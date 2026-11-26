"""
Fills missing pictures and adds well-known inventions, without rebuilding any pack.
  python3 pipelines/fill_pictures.py pictures     history, food, chess and anime items that have none
  python3 pipelines/fill_pictures.py inventions   the named inventions below, with years from Wikidata
A picture is only taken from the item's own English Wikipedia article (matched by its Wikidata id, or for chess players by an
article that says it is about a chess player) or from AniList (exact title or character name inside the right series).
An invention is only added when Wikidata gives it one year and that year also appears in its Wikipedia article.
Anything that fails a check is left out and listed.
"""
import os, re, sys, time
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
from more_content import key, load, store, picture

WP = "https://en.wikipedia.org/w/api.php"
WD = "https://www.wikidata.org/w/api.php"

def api(url, **params):
    time.sleep(0.4)
    return B.get(url, params={**params, "format": "json", "formatversion": 2}).json()

def chunks(xs, n=40):
    for i in range(0, len(xs), n): yield xs[i:i + n]

def titles_for(qids):
    out = {}
    for c in chunks([q for q in qids if re.match(r"^Q\d+$", q)]):
        for q, e in api(WD, action="wbgetentities", ids="|".join(c), props="sitelinks", sitefilter="enwiki").get("entities", {}).items():
            t = e.get("sitelinks", {}).get("enwiki", {}).get("title")
            if t: out[q] = t
    return out

def page_images(titles):
    """title asked for -> (final title, thumbnail url, file name, short description)"""
    out = {}
    for c in chunks(list(titles), 40):
        r = api(WP, action="query", titles="|".join(c), prop="pageimages|description", piprop="thumbnail|name", pithumbsize=960, pilicense="any", pilimit=50, redirects=1)["query"]
        back = {t: t for t in c}
        for kind in ("normalized", "redirects"):
            for n in r.get(kind, []):
                for asked, now in back.items():
                    if now == n["from"]: back[asked] = n["to"]
        pages = {p["title"]: p for p in r.get("pages", [])}
        for asked, now in back.items():
            p = pages.get(now)
            if p and not p.get("missing"):
                out[asked] = (now, (p.get("thumbnail") or {}).get("source"), p.get("pageimage"), p.get("description") or "")
    return out

# a picture that is a logo, map, signature or diagram of the word says nothing about the thing
BAD = re.compile(r"logo|wordmark|signature|locator|_map|map_of|\bicon|question_book|ambox|\.svg$", re.I)

# Wikipedia's lead picture for these is a title logo or a map that spells out the answer
NO_PICTURE = {"Hunter × Hunter", "Pokémon Chronicles", "2016 Brussels bombings", "Treaty of London"}

def attach(world, found, size=640):
    """found: list of (item, thumb url, file name, article title)"""
    cr = B.credits_for([f for _, _, f, _ in found if f], 960)
    n = 0
    for x, url, f, title in found:
        if x["n"] in NO_PICTURE: continue
        rel = f"img/{world}/{x['id']}_img.webp"
        if not B.save_img(url, os.path.join(B.ROOT, rel), size=size): continue
        c = cr.get(f.replace("_", " ")) or cr.get(f)
        x["img"] = rel
        x.setdefault("cr", {})["img"] = {"by": c["by"], "lic": c["lic"], "page": c["page"]} if c else \
            {"by": "Wikipedia", "lic": "not freely licensed; shown with credit", "page": "https://en.wikipedia.org/wiki/" + title.replace(" ", "_")}
        n += 1
    return n

def from_wikipedia(world, items, by_name=None):
    if by_name:
        want = {x["id"]: x["n"] for x in items}
        want.update({x["id"]: x["n"] + " (chess player)" for x in items if x["n"] + " (chess player)" in page_images([x["n"] + " (chess player)"])})
    else:
        want = titles_for([x["id"] for x in items])
    got = page_images(set(want.values()))
    found = []
    for x in items:
        t, url, f, desc = got.get(want.get(x["id"]), (None, None, None, ""))
        if not url or not f or BAD.search(f): continue
        if by_name and not by_name.search(desc): continue
        found.append((x, url, f, t))
    return attach(world, found)

# ---------------- anime (AniList, exact matches only) ----------------
def ani(query, **variables):
    for wait in (3, 30, 65):
        try:
            r = requests.post("https://graphql.anilist.co", json={"query": query, "variables": variables}, headers=B.HEAD, timeout=60)
            if r.status_code == 200: time.sleep(2.1); return r.json()["data"]
            if r.status_code == 429: time.sleep(int(r.headers.get("Retry-After", 60)) + 2); continue
            if r.status_code == 404: return {}
        except requests.RequestException: pass
        time.sleep(wait)
    return {}

Q = """query($s:String){ Page(perPage:8){ media(search:$s, type:ANIME, sort:SEARCH_MATCH){ id siteUrl title{romaji english} synonyms startDate{year}
  coverImage{extraLarge} characters(sort:[ROLE,FAVOURITES_DESC], perPage:25){ nodes{ siteUrl name{full alternative} image{large} } } } } }"""

def anime_pictures(items):
    series = {x["n"]: x for x in items if x["kind"] == "anime"}
    need = [x for x in items if x["kind"] in ("anime", "character") and not x.get("img")]
    cache, n = {}, 0
    for x in need:
        title = x["n"] if x["kind"] == "anime" else x.get("anime")
        if not title: continue
        if title not in cache:
            found = ((ani(Q, s=title).get("Page") or {}).get("media")) or []
            year = series.get(title, {}).get("year")
            cache[title] = [m for m in found if key(title) in {key(t) for t in [m["title"].get("english"), m["title"].get("romaji")] + (m.get("synonyms") or [])}
                            and (x["kind"] == "character" or not year or abs(year - (m["startDate"]["year"] or year)) <= 1)]
        rel = f"img/anime/{x['id']}_img.webp"
        for m in cache[title]:
            if x["kind"] == "anime":
                url, page, what = (m["coverImage"] or {}).get("extraLarge"), m["siteUrl"], "AniList cover art"
            else:
                words = lambda s: sorted(re.findall(r"[a-z0-9]+", (s or "").lower()))
                c = next((c for c in m["characters"]["nodes"] if words(x["n"]) in [words(a) for a in [c["name"]["full"]] + (c["name"].get("alternative") or [])]), None)
                url, page, what = ((c or {}).get("image") or {}).get("large"), (c or {}).get("siteUrl"), "AniList character art"
            if url and "default" not in url and picture(url, rel):
                x["img"] = rel; x.setdefault("cr", {})["img"] = {"by": what, "lic": "not freely licensed; shown with credit", "page": page}; n += 1
                break
    return n

def pictures():
    for world in ("history", "food", "chess", "anime"):
        d = load(world); items = d["items"]
        if world == "history":
            n = from_wikipedia(world, [x for x in items if x["kind"] in ("event", "person", "invention") and not x.get("img")])
        elif world == "food":
            n = from_wikipedia(world, [x for x in items if not x.get("img")])
        elif world == "chess":
            n = from_wikipedia(world, [x for x in items if x["kind"] == "cplayer" and not x.get("img")], by_name=re.compile("chess", re.I))
        else:
            n = anime_pictures(items)
            n += from_wikipedia(world, [x for x in items if x["kind"] == "anime" and not x.get("img")])
        store(world, d)
        left = [x["n"] for x in items if x["kind"] in ("event", "person", "invention", "dish", "cplayer", "anime", "character") and not x.get("img")]
        print(f"{world}: +{n} pictures, still without: {len(left)} {left[:60]}", flush=True)

# ---------------- inventions ----------------
NAMES = """Telescope|Microscope|Steam engine|Telegraph|Light bulb:Incandescent light bulb|Radio|Television|Airplane|Helicopter|Automobile:Benz Patent-Motorwagen
Bicycle|Motorcycle|Locomotive:Steam locomotive|Submarine|Parachute|Hot air balloon|Typewriter|Sewing machine|Refrigerator|Air conditioning|Washing machine
Microwave oven|Toaster|Dishwasher|Elevator:Safety elevator|Escalator|Zipper|Safety pin|Velcro|Ballpoint pen|Pencil sharpener|Stapler|Paper clip|Post-it Note
Matches:Match|Lighter|Thermometer|Stethoscope|X-ray|Pacemaker:Artificial cardiac pacemaker|Aspirin|Insulin|Pasteurization|Anesthesia|Vaccine|Contact lens
Transistor|Integrated circuit|Laser|Personal computer|Computer mouse|Mobile phone|Smartphone|World Wide Web|Email|Compact disc|DVD|Floppy disk|USB flash drive
Video game console|Digital camera|Polaroid camera:Instant camera|Calculator:Pocket calculator|Barcode|QR code|Credit card|Automated teller machine|Vending machine
Traffic light|Seat belt|Airbag|Windscreen wiper|Odometer|Seismometer|Sextant|Chronometer:Marine chronometer|Mechanical pencil|Fountain pen
Nylon|Teflon:Polytetrafluoroethylene|Bakelite|Stainless steel|Dynamo|Electric motor|Wind turbine|Solar cell|Nuclear reactor|Jet engine|Rocket:V-2 rocket
Machine gun|Revolver|Tank|Radar|Sonar|Satellite:Sputnik 1|Space telescope:Hubble Space Telescope|Rubik's Cube|Lego|Yo-yo|Frisbee|Skateboard|Snowboard
Chewing gum|Coca-Cola|Potato chip|Ice cream cone|Tea bag|Espresso machine|Tin can|Drinking straw|Toothbrush|Safety razor|Lipstick|Sunglasses|Wristwatch
Sticky tape:Scotch Tape|Bubble wrap|Super Glue:Cyanoacrylate|Fire extinguisher|Lawn mower|Chainsaw|Combine harvester|Tractor|Hearing aid|Wheelchair|Syringe
Tetris|Monopoly (game)|Crossword|Snooker|Table tennis|Badminton|Netball|Futsal|Water polo|Handball|Triathlon|Windsurfing|Paintball|Laser tag"""

# Years Wikidata does not give, entered by hand for undisputed cases only; each must still appear in the article (printed for review)
HAND = {"Telescope": 1608, "Hot air balloon": 1783, "Air conditioning": 1902, "Safety pin": 1849, "Stethoscope": 1816, "X-ray": 1895, "Aspirin": 1897,
        "Insulin": 1921, "Vaccine": 1796, "Digital camera": 1975, "Polaroid camera": 1948, "Barcode": 1952, "Automated teller machine": 1967, "Seat belt": 1959,
        "Tetris": 1984, "Crossword": 1913, "Snooker": 1875, "Stainless steel": 1913, "Teflon": 1938, "Revolver": 1836, "Super Glue": 1942, "Matches": 1826,
        "DVD": 1995, "USB flash drive": 2000, "Space telescope": 1990, "Pacemaker": 1958}
# Left out after review: disputed or misleading year, or the picture does not show the thing or spells out the answer
REJECT = {"Bicycle", "Locomotive", "Refrigerator", "Elevator", "World Wide Web", "Email", "Solar cell", "Coca-Cola", "Bubble wrap", "Chainsaw", "Monopoly",
          "Radio", "Matches", "Aspirin", "Insulin", "Stainless steel", "Polaroid camera"}
NO_BY = {"Microwave oven", "Ballpoint pen"}      # Wikidata credits the wrong person

def inventions():
    d = load("history"); items = d["items"]
    have = {key(x["n"]) for x in items} | {x["id"] for x in items}
    wanted = {}
    for entry in NAMES.replace("\n", "|").split("|"):
        name, _, title = entry.partition(":")
        title = title or name
        name = re.sub(r" \(.*\)$", "", name)
        if key(name) not in have: wanted[title] = name
    info = {}
    for c in chunks(list(wanted), 40):
        r = api(WP, action="query", titles="|".join(c), prop="pageprops", ppprop="wikibase_item|disambiguation", redirects=1)["query"]
        moved = {n["from"]: n["to"] for k in ("normalized", "redirects") for n in r.get(k, [])}
        pages = {p["title"]: p for p in r["pages"]}
        for t in c:
            now = t
            while now in moved: now = moved[now]
            pp = pages.get(now, {}).get("pageprops", {})
            if "wikibase_item" in pp and "disambiguation" not in pp: info[t] = (pp["wikibase_item"], now)
    ents = {}
    for c in chunks([q for q, _ in info.values()]):
        ents.update(api(WD, action="wbgetentities", ids="|".join(c), props="claims|sitelinks", sitefilter="")["entities"])
    new, dropped = [], []
    for asked, name in wanted.items():
        if asked not in info: dropped.append(name + " (no article)"); continue
        q, title = info[asked]
        if q in have or name in REJECT: continue
        claims = ents.get(q, {}).get("claims", {})
        def years(p):
            out = set()
            for c in claims.get(p, []):
                v = c["mainsnak"].get("datavalue", {}).get("value")
                if v and v["precision"] >= 9 and c.get("rank") != "deprecated": out.add(B.year(v["time"]))
            return out
        ys = {HAND[name]} if name in HAND else years("P575") or years("P571")
        if len(ys) != 1: dropped.append(f"{name} ({'several years' if ys else 'no year'})"); continue
        y = ys.pop()
        text = api(WP, action="query", titles=title, prop="extracts", explaintext=1)["query"]["pages"][0].get("extract", "")
        if y < 1000 or not re.search(rf"\b{y}\b", text): dropped.append(f"{name} ({y} not in the article)"); continue
        if name in HAND: print(f"  check {name} {y}:", (re.search(rf"[^.\n]{{0,110}}\b{y}\b[^.\n]{{0,70}}", text) or [""])[0])
        by = [] if name in NO_BY or name in HAND else [c["mainsnak"]["datavalue"]["value"]["id"] for c in claims.get("P61", []) if "datavalue" in c["mainsnak"]][:2]
        new.append({"id": q, "n": name, "kind": "invention", "fame": len(ents[q].get("sitelinks", {})), "year": y, "by": by, "_title": title})
    ids = sorted({p for x in new for p in x["by"]})
    labels = {}
    for c in chunks(ids):
        for q, e in api(WD, action="wbgetentities", ids="|".join(c), props="labels", languages="en")["entities"].items():
            labels[q] = e.get("labels", {}).get("en", {}).get("value")
    for x in new: x["by"] = [labels[p] for p in x["by"] if labels.get(p)]
    got = page_images({x["_title"] for x in new})
    found = []
    for x in new:
        t, url, f, _ = got.get(x.pop("_title"), (None, None, None, ""))
        if url and f and not BAD.search(f): found.append((x, url, f, t))
    attach("history", found)
    for x in new:
        if not x.get("img"): dropped.append(x["n"] + " (no usable picture)")
    new = [x for x in new if x.get("img")]
    d["items"] = items + new; store("history", d)
    print(f"inventions: +{len(new)}")
    for x in new: print(f"   {x['n']} {x['year']} {x['by']} <- {x['cr']['img']['page'][-70:]}")
    print("left out:", "; ".join(dropped))

if __name__ == "__main__":
    for what in sys.argv[1:]:
        {"pictures": pictures, "inventions": inventions}[what]()
