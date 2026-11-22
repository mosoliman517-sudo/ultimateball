"""
Builds the content packs for every world from real sources, with an image and a credit line for every picture.
  K-pop, geography, history, food : Wikidata (CC0 facts) + Wikimedia Commons images (free licences / public domain)
  football                        : ballknowledge's own quiz data (Transfermarkt CC0 + Wikidata) and its crests/photos
Nothing is invented: an item without the facts a game needs is left out of that game, and the build prints what is missing.
Output: packs/<world>.json and img/<world>/*.webp, credits inside each pack.
Run:  python3 pipelines/build_packs.py [world ...]
"""
import io, json, os, re, shutil, sys, time, urllib.parse
import requests
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BK = os.path.expanduser("~/Desktop/football-prediction-model")
HEAD = {"User-Agent": "games-platform-prototype/0.2 (student project)"}
SPARQL = "https://query.wikidata.org/sparql"

def get(url, **kw):
    for wait in (3, 8, 15, 30, 60):
        try:
            r = requests.get(url, headers=HEAD, timeout=90, **kw)
            if r.status_code == 200:
                return r
        except requests.RequestException:
            pass
        time.sleep(wait)
    raise RuntimeError("failed: " + url[:120])

def sparql(q):
    return get(SPARQL, params={"query": q, "format": "json"}).json()["results"]["bindings"]

v = lambda b, k: b[k]["value"] if k in b else None
qid = lambda u: u.rsplit("/", 1)[-1] if u else None
def year(s):
    m = re.match(r"^([+-]?)(\d{4})", s or "")
    return (-1 if m.group(1) == "-" else 1) * int(m.group(2)) if m else None
fname = lambda u: urllib.parse.unquote(u.rsplit("/", 1)[-1]) if u else None
strip = lambda h: re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", h or "")).strip()

def credits_for(files, width=500):
    out = {}
    files = [f for f in files if f]
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        r = get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "titles": "|".join("File:" + f for f in chunk), "prop": "imageinfo",
                                                                  "iiprop": "url|extmetadata", "iiurlwidth": width, "format": "json"}).json()
        norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
        for p in r["query"]["pages"].values():
            if "imageinfo" not in p:
                continue
            ii = p["imageinfo"][0]; md = ii.get("extmetadata", {}); t = norm.get(p["title"], p["title"])[5:]
            out[t] = {"thumb": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"], "lic": strip(md.get("LicenseShortName", {}).get("value")),
                      "by": strip(md.get("Artist", {}).get("value"))[:90] or "Unknown author"}
        time.sleep(1)
    return out

def save_img(url, dest, square=False, keep_alpha=False, size=420):
    if os.path.exists(dest):
        return True
    try:
        r = None
        for wait in (4, 0):            # one quick retry; a picture that still fails is left out (the item plays without it)
            r = requests.get(url, headers=HEAD, timeout=60)
            if r.status_code == 200: break
            time.sleep(wait)
        if r.status_code != 200: raise RuntimeError(r.status_code)
        im = Image.open(io.BytesIO(r.content))
        im = im.convert("RGBA") if keep_alpha or im.mode in ("RGBA", "LA", "P") else im.convert("RGB")
        im.thumbnail((size, size))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        im.save(dest, "WEBP", quality=82 if size > 420 else 78)
        time.sleep(0.5)
        return True
    except Exception as e:
        print("  image failed", dest, e)
        return False

def attach_images(world, items, keys=("img",), alpha_keys=("logo", "flag"), width=500, size=420):
    files = [it.get("_" + k) for it in items for k in keys]
    cr = credits_for(files, width)
    for it in items:
        for k in keys:
            f = it.pop("_" + k, None)
            if not f or f not in cr:
                continue
            rel = f"img/{world}/{it['id']}_{k}.webp"
            if save_img(cr[f]["thumb"], os.path.join(ROOT, rel), keep_alpha=k in alpha_keys, size=size):
                it[k] = rel
                it.setdefault("cr", {})[k] = {"by": cr[f]["by"], "lic": cr[f]["lic"], "page": cr[f]["page"]}

def write(world, items, meta=None):
    os.makedirs(os.path.join(ROOT, "packs"), exist_ok=True)
    json.dump({"world": world, "items": items, **(meta or {})}, open(os.path.join(ROOT, "packs", world + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"{world}: {len(items)} items, {sum(1 for x in items if x.get('img'))} photos, {sum(1 for x in items if x.get('logo'))} logos, {sum(1 for x in items if x.get('flag'))} flags")

# ---------------- K-pop: 3rd to 5th generation groups (debut 2012 on) and their members ----------------
# pictures Wikidata does not link yet, chosen by hand from Commons (free licences)
IMG_FIX = {"Juun": "20260827 HEARTS2HEARTS Juun @ K-World Dream Awards.jpg"}
FIRST_GEN3 = 2015
def kpop():
    rows = sparql("""SELECT ?g ?gLabel ?inc ?ws ?labLabel ?img ?logo ?sl ?typeLabel ?title (COUNT(DISTINCT ?m) AS ?n) WHERE {
      ?g wdt:P136 wd:Q213665; wdt:P31 ?type; wikibase:sitelinks ?sl. VALUES ?type { wd:Q215380 wd:Q216337 wd:Q641066 wd:Q2088357 }
      OPTIONAL { ?g wdt:P571 ?inc } OPTIONAL { ?g wdt:P2031 ?ws } OPTIONAL { ?g wdt:P264 ?lab } OPTIONAL { ?g wdt:P18 ?img } OPTIONAL { ?g wdt:P154 ?logo } OPTIONAL { ?g wdt:P527 ?m }
      OPTIONAL { ?art schema:about ?g; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?title }
      FILTER(?sl > 5) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }
      GROUP BY ?g ?gLabel ?inc ?ws ?labLabel ?img ?logo ?sl ?typeLabel ?title ORDER BY DESC(?sl) LIMIT 4000""")
    groups = {}
    for b in rows:
        g = qid(v(b, "g")); x = groups.setdefault(g, {"id": g, "n": v(b, "gLabel"), "kind": "group", "fame": int(v(b, "sl")), "labels": set(), "types": set(), "_y": set()})
        for k in ("inc", "ws"):
            if v(b, k) and year(v(b, k)): x["_y"].add(year(v(b, k)))
        if v(b, "labLabel") and not re.match(r"^Q\d+$", v(b, "labLabel")): x["labels"].add(v(b, "labLabel"))
        if v(b, "typeLabel"): x["types"].add(v(b, "typeLabel"))
        if v(b, "img"): x["_img"] = fname(v(b, "img"))
        if v(b, "logo"): x["_logo"] = fname(v(b, "logo"))
        if v(b, "title"): x["wiki"] = v(b, "title")
        if int(v(b, "n") or 0): x["members"] = max(x.get("members", 0), int(v(b, "n")))
    for x in groups.values():
        y = x.pop("_y")
        if y: x["debut"] = min(y)
    # 3rd generation on; a group with no debut year on Wikidata is kept for now and dated from its first release by kpop_songs.py
    gl = [x for x in groups.values() if not re.match(r"^Q\d+$", x["n"]) and ((x.get("debut") or 9999) >= FIRST_GEN3 or x["n"] in ("BTS",))]
    gl = sorted(gl, key=lambda x: -x["fame"])[:240]
    for x in gl:
        x["labels"] = sorted(x["labels"])[:2]; t = x.pop("types")
        x["gender"] = "boy group" if "boy band" in t else "girl group" if "girl group" in t else None
        if x.get("debut"): x["gen"] = 3 if x["debut"] < 2018 else 4 if x["debut"] < 2023 else 5
    # how popular each group is now: English Wikipedia page views over the last 12 months (Wikimedia pageviews API)
    for x in gl:
        t = x.get("wiki")
        if not t: continue
        try:
            r = requests.get("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/" + urllib.parse.quote(t.replace(" ", "_"), safe="") + "/monthly/2025110100/2026103100", headers=HEAD, timeout=30)
            if r.status_code == 200: x["views"] = sum(i["views"] for i in r.json()["items"])
        except requests.RequestException: pass
        time.sleep(0.15)
    ids = " ".join("wd:" + x["id"] for x in gl)
    rows = sparql(f"""SELECT ?p ?pLabel ?g ?dob ?bpLabel ?img ?sl WHERE {{ VALUES ?g {{ {ids} }} ?p wdt:P463 ?g; wdt:P31 wd:Q5; wikibase:sitelinks ?sl.
      OPTIONAL {{ ?p wdt:P569 ?dob }} OPTIONAL {{ ?p wdt:P19 ?bp }} OPTIONAL {{ ?p wdt:P18 ?img }} FILTER(?sl > 0)
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
    gname = {x["id"]: x["n"] for x in gl}; idols = {}
    for b in rows:
        p = qid(v(b, "p")); x = idols.setdefault(p, {"id": p, "n": v(b, "pLabel"), "kind": "idol", "fame": int(v(b, "sl")), "groups": set()})
        x["groups"].add(gname[qid(v(b, "g"))])
        if v(b, "dob"): x["born"] = year(v(b, "dob"))
        if v(b, "bpLabel") and not re.match(r"^Q\d+$", v(b, "bpLabel")): x["from"] = v(b, "bpLabel")
        if v(b, "img"): x["_img"] = fname(v(b, "img"))
    il = [x for x in idols.values() if not re.match(r"^Q\d+$", x["n"])]
    for x in il:
        x["groups"] = sorted(x["groups"])
        if x["n"] in IMG_FIX and not x.get("_img"): x["_img"] = IMG_FIX[x["n"]]
    il.sort(key=lambda x: -x["fame"])
    print(f"kpop: {len(gl)} groups (debut {FIRST_GEN3}+), {len(il)} idols, {sum(1 for x in gl if x.get('views'))} with page views")
    shutil.rmtree(os.path.join(ROOT, "img", "kpop"), ignore_errors=True)   # re-fetched sharper (960 px source, 720 px saved)
    items = gl + il
    attach_images("kpop", items, keys=("img", "logo"), width=960, size=720)
    write("kpop", items)

# ---------------- Geography: sovereign states ----------------
def geography():
    rows = sparql("""SELECT ?c ?cLabel ?capLabel ?contLabel ?pop ?area ?langLabel ?curLabel ?flag ?sl WHERE {
      ?c wdt:P31 wd:Q3624078; wdt:P41 ?flag; wikibase:sitelinks ?sl. FILTER NOT EXISTS { ?c wdt:P576 ?end }
      OPTIONAL { ?c wdt:P36 ?cap } OPTIONAL { ?c wdt:P30 ?cont } OPTIONAL { ?c wdt:P1082 ?pop } OPTIONAL { ?c wdt:P2046 ?area }
      OPTIONAL { ?c wdt:P37 ?lang } OPTIONAL { ?c wdt:P38 ?cur }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    cs = {}
    for b in rows:
        c = qid(v(b, "c")); x = cs.setdefault(c, {"id": c, "n": v(b, "cLabel"), "kind": "country", "fame": int(v(b, "sl")), "caps": set(), "conts": set(), "langs": set(), "curs": set()})
        x["_flag"] = fname(v(b, "flag"))
        for k, f in (("caps", "capLabel"), ("conts", "contLabel"), ("langs", "langLabel"), ("curs", "curLabel")):
            if v(b, f) and not re.match(r"^Q\d+$", v(b, f)): x[k].add(v(b, f))
        if v(b, "pop"): x["pop"] = max(x.get("pop", 0), int(float(v(b, "pop"))))
        if v(b, "area"): x["area"] = max(x.get("area", 0), int(float(v(b, "area"))))
    items = []
    for x in cs.values():
        caps = x.pop("caps"); x["capital"] = sorted(caps)[0] if caps else None
        conts = x.pop("conts"); x["continent"] = sorted(conts)[0] if len(conts) == 1 else None
        x["language"] = sorted(x.pop("langs"))[:2]; x["currency"] = sorted(x.pop("curs"))[:1]
        items.append(x)
    items.sort(key=lambda x: -x["fame"])
    attach_images("geography", items, keys=("flag",))
    write("geography", items)

# ---------------- History: famous people born before 1900 ----------------
def history():
    """People (any era, not only before 1900), events (wars, battles, revolutions, treaties...), inventions with the year they
    appeared, and countries that no longer exist with their old flags."""
    occ = "wd:Q116 wd:Q82955 wd:Q189290 wd:Q4964182 wd:Q11900058 wd:Q901 wd:Q1028181 wd:Q36834 wd:Q36180 wd:Q47064 wd:Q205375 wd:Q169470"
    rows = sparql(f"""SELECT ?p ?pLabel ?dob ?dod ?cLabel ?occLabel ?img ?sl WHERE {{ VALUES ?occ {{ {occ} }}
      ?p wdt:P106 ?occ; wikibase:sitelinks ?sl. FILTER(?sl > 140) ?p wdt:P31 wd:Q5; wdt:P569 ?dob; wdt:P18 ?img. FILTER(YEAR(?dob) < 1960)
      OPTIONAL {{ ?p wdt:P570 ?dod }} OPTIONAL {{ ?p wdt:P27 ?c }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
    ps = {}
    for b in rows:
        p = qid(v(b, "p")); x = ps.setdefault(p, {"id": p, "n": v(b, "pLabel"), "kind": "person", "fame": int(v(b, "sl")), "occ": set(), "ctry": set()})
        x["born"] = year(v(b, "dob")); x["died"] = year(v(b, "dod")) if v(b, "dod") else None
        if v(b, "occLabel"): x["occ"].add(v(b, "occLabel"))
        if v(b, "cLabel") and not re.match(r"^Q\d+$", v(b, "cLabel")): x["ctry"].add(v(b, "cLabel"))
        x["_img"] = fname(v(b, "img"))
    people = sorted(ps.values(), key=lambda x: -x["fame"])[:220]
    for x in people: x["occ"] = sorted(x["occ"])[:2]; x["ctry"] = sorted(x["ctry"])[:1]
    # events: wars, battles, revolutions, treaties, disasters, landmark moments, with a date
    rows = sparql("""SELECT ?e ?eLabel ?tLabel ?start ?pit ?end ?locLabel ?img ?sl WHERE {
      VALUES ?t { wd:Q198 wd:Q178561 wd:Q10931 wd:Q131569 wd:Q3839081 wd:Q8065 wd:Q7944 wd:Q124734 wd:Q2223653 wd:Q1261499 wd:Q645883 wd:Q2334719 }
      ?e wdt:P31 ?t; wikibase:sitelinks ?sl. FILTER(?sl > 40)
      OPTIONAL { ?e wdt:P580 ?start } OPTIONAL { ?e wdt:P585 ?pit } OPTIONAL { ?e wdt:P582 ?end } OPTIONAL { ?e wdt:P276 ?loc } OPTIONAL { ?e wdt:P18 ?img }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    ev = {}
    for b in rows:
        e = qid(v(b, "e")); x = ev.setdefault(e, {"id": e, "n": v(b, "eLabel"), "kind": "event", "fame": int(v(b, "sl")), "type": v(b, "tLabel")})
        y = year(v(b, "start")) or year(v(b, "pit"))
        if y is not None: x["year"] = min(x.get("year", 99999), y)
        if v(b, "end") and year(v(b, "end")): x["end"] = year(v(b, "end"))
        if v(b, "locLabel") and not re.match(r"^Q\d+$", v(b, "locLabel")): x["where"] = v(b, "locLabel")
        if v(b, "img"): x["_img"] = fname(v(b, "img"))
    events = sorted([x for x in ev.values() if x.get("year") is not None and not re.match(r"^Q\d+$", x["n"])], key=lambda x: -x["fame"])[:220]
    # inventions and discoveries with the year they appeared (P575)
    rows = sparql("""SELECT ?i ?iLabel ?d ?byLabel ?img ?sl ?tLabel WHERE { ?i wdt:P575 ?d; wikibase:sitelinks ?sl. FILTER(?sl > 25)
      OPTIONAL { ?i wdt:P31 ?t } OPTIONAL { ?i wdt:P61 ?by } OPTIONAL { ?i wdt:P18 ?img }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 30000""")
    # Wikidata dates mostly discoveries in nature this way (planets, moons, elements, islands); keep things people made:
    # an item stays only when every type it has reads like a made thing (device, weapon, sport, material, method...)
    MADE = re.compile(r"device|weapon|sport|invention|product|material|component|instrument|vehicle|machine|technique|game|tool|food|drink|dish|software|medic|vaccine|toy|hobby|technolog|engine|aircraft|apparatus|equipment|method|process|class of|type of (?!chemical|quantum|disease)", re.I)
    NOT_MADE = {"electricity", "atoll", "hormone", "synapse", "G/g", "grapheme", "potato", "Van Allen radiation belt", "intron", "mitochondrial DNA", "amylase", "pectin", "prion",
                "natural selection", "electromagnetic radiation", "gravitational wave", "standing wave", "Zeeman effect", "Compton scattering", "altostratus", "meme", "quaternion"}
    types = {}
    for b in rows: types.setdefault(qid(v(b, "i")), set()).add(v(b, "tLabel") or "")
    made = {i for i, ts in types.items() if all(t == "" or MADE.search(t) for t in ts)}
    inv = {}
    for b in rows:
        i = qid(v(b, "i"))
        if i not in made or v(b, "iLabel") in NOT_MADE: continue
        x = inv.setdefault(i, {"id": i, "n": v(b, "iLabel"), "kind": "invention", "fame": int(v(b, "sl")), "by": set()})
        y = year(v(b, "d"))
        if y is not None: x["year"] = min(x.get("year", 99999), y)
        if v(b, "byLabel") and not re.match(r"^Q\d+$", v(b, "byLabel")): x["by"].add(v(b, "byLabel"))
        if v(b, "img"): x["_img"] = fname(v(b, "img"))
    inventions = sorted([x for x in inv.values() if x.get("year") is not None and not re.match(r"^Q\d+$", x["n"])], key=lambda x: -x["fame"])[:200]
    for x in inventions: x["by"] = sorted(x["by"])[:2]
    # countries that no longer exist, with their flags
    rows = sparql("""SELECT ?c ?cLabel ?inc ?dis ?capLabel ?flag ?sl WHERE { VALUES ?t { wd:Q3024240 wd:Q1250464 wd:Q19953632 } ?c wdt:P31 ?t; wdt:P41 ?flag; wdt:P576 ?dis; wikibase:sitelinks ?sl. FILTER(?sl > 45)
      OPTIONAL { ?c wdt:P571 ?inc } OPTIONAL { ?c wdt:P36 ?cap } SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    old = {}
    for b in rows:
        c = qid(v(b, "c")); x = old.setdefault(c, {"id": c, "n": v(b, "cLabel"), "kind": "oldstate", "fame": int(v(b, "sl"))})
        if v(b, "inc") and year(v(b, "inc")) is not None: x["from"] = min(x.get("from", 99999), year(v(b, "inc")))
        if year(v(b, "dis")) is not None: x["to"] = max(x.get("to", -99999), year(v(b, "dis")))
        if v(b, "capLabel") and not re.match(r"^Q\d+$", v(b, "capLabel")): x["capital"] = v(b, "capLabel")
        x["_flag"] = fname(v(b, "flag"))
    olds = sorted([x for x in old.values() if not re.match(r"^Q\d+$", x["n"])], key=lambda x: -x["fame"])[:150]
    print(f"history: {len(people)} people, {len(events)} events, {len(inventions)} inventions, {len(olds)} former countries")
    items = people + events + inventions + olds
    attach_images("history", items, keys=("img", "flag"), width=960, size=640)
    write("history", items)

# ---------------- Food: dishes with a country of origin ----------------
def basketball():
    d = json.load(open(os.path.join(BK, "02_processed_data/nba_data.json"), encoding="utf-8"))
    ps = sorted(d["players"], key=lambda p: int(p.get("rk") or 9999))
    items = []
    for p in ps:
        x = {"id": "b" + str(p["id"]), "n": p["n"], "kind": "bplayer", "fame": 10000 - int(p.get("rk") or 9999), "pos": p.get("posn") or p.get("pos"), "club": p.get("club"),
             "hist": p.get("hist") or [], "born": year(p.get("dob")), "nat": p.get("nat"), "h": float(p["h"]) if p.get("h") else None, "pts": int(p.get("pts") or 0),
             "gp": int(p.get("gp") or 0), "first": p.get("first"), "best": (p.get("bp") or {}).get("avg"), "titles": len(p.get("ti") or [])}
        if p.get("photo") and len(items) < 220:
            rel = f"img/basketball/{x['id']}.webp"
            if save_img(p["photo"], os.path.join(ROOT, rel), keep_alpha=True):
                x["img"] = rel; x["cut"] = 1; x["cr"] = {"img": {"by": "ESPN headshot", "lic": "Identification only", "page": "https://www.espn.com/nba/"}}
        items.append(x)
    for t in d["teams"].values():
        rel = f"img/basketball/team_{t['abbr'].lower()}.webp"
        if save_img(t["logo"], os.path.join(ROOT, rel), keep_alpha=True):
            items.append({"id": "t" + str(t["id"]), "n": t["name"], "kind": "team", "short": t["short"], "loc": t["loc"], "logo": rel, "fame": 50,
                          "cr": {"logo": {"by": "Team logo", "lic": "Identification only", "page": "https://www.espn.com/nba/teams"}}})
    write("basketball", items)

def chess():
    ps = json.load(open(os.path.join(BK, "02_processed_data/chess_players.json"), encoding="utf-8"))
    items = []
    for p in ps:
        x = {"id": "c" + re.sub(r"[^a-z]", "", p["n"].lower())[:24], "n": p["n"], "kind": "cplayer", "fame": p.get("peak") or 0, "born": p.get("born"), "died": p.get("died"),
             "nat": p.get("country"), "peak": p.get("peak"), "champ": bool(p.get("champ")), "_img": fname(p["img"]) if p.get("img") else None}
        items.append(x)
    attach_images("chess", items)
    import csv
    stats = json.load(open(os.path.join(BK, "02_processed_data/chess_openstats.json"), encoding="utf-8"))
    rows = list(csv.DictReader(open(os.path.join(BK, "01_data_chess/openings.tsv"), encoding="utf-8"), delimiter="\t"))
    for fam, st in stats.items():
        lines = [r for r in rows if r["name"] == fam] or [r for r in rows if r["name"].startswith(fam + ":")]
        if not lines: continue
        r = min(lines, key=lambda r: len(r["pgn"]))
        items.append({"id": "o" + re.sub(r"[^a-z]", "", fam.lower())[:30], "n": fam, "kind": "opening", "fame": st[0], "eco": r["eco"], "pgn": r["pgn"], "games": st[0], "white": round(st[1] * 100)})
    write("chess", items)

def general():
    # Open Trivia DB (CC BY-SA 4.0): only questions with a short, typeable answer are kept
    import html
    tok = get("https://opentdb.com/api_token.php", params={"command": "request"}).json()["token"]
    items, seen = [], set()
    for k in range(40):
        r = get("https://opentdb.com/api.php", params={"amount": 50, "type": "multiple", "token": tok}).json()
        if r.get("response_code") != 0: break
        for q in r["results"]:
            a = html.unescape(q["correct_answer"]); t = html.unescape(q["question"])
            if t in seen or len(a) > 28 or len(a.split()) > 4 or re.search(r"which of these|which one of the following|not\b|following", t, re.I): continue
            seen.add(t)
            items.append({"id": "g%d" % len(items), "n": a, "kind": "trivia", "q": t, "cat": html.unescape(q["category"]), "diff": q["difficulty"], "fame": {"easy": 3, "medium": 2, "hard": 1}[q["difficulty"]],
                          "cr": {"q": {"by": "Open Trivia Database", "lic": "CC BY-SA 4.0", "page": "https://opentdb.com"}}})
        time.sleep(5.5)
    write("general", items)

def anime():
    # Wikidata files the anime TV series apart from the manga it adapts, and the anime entry often looks obscure (Demon Slayer's
    # anime has 9 language articles, its manga 65), so a title counts as famous as the better known of the two;
    # pipelines/fame_views.py then ranks everything by real Wikipedia readership.
    rows = sparql("""SELECT ?a ?aLabel ?start ?studioLabel ?eps ?authLabel ?genreLabel ?sl ?m ?msl WHERE { ?a wdt:P31 wd:Q63952888; wikibase:sitelinks ?sl.
      OPTIONAL { ?a wdt:P144 ?m. ?m wikibase:sitelinks ?msl } FILTER(?sl > 3 || ?msl > 15)
      OPTIONAL { ?a wdt:P580 ?start } OPTIONAL { ?a wdt:P272 ?studio } OPTIONAL { ?a wdt:P1113 ?eps } OPTIONAL { ?a wdt:P144 ?based. ?based wdt:P50 ?auth } OPTIONAL { ?a wdt:P136 ?genre }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    xs = {}
    for b in rows:
        a = qid(v(b, "a")); x = xs.setdefault(a, {"id": a, "n": v(b, "aLabel"), "kind": "anime", "fame": int(v(b, "sl")), "studios": set(), "authors": set(), "genres": set()})
        if v(b, "msl") and int(v(b, "msl")) > x["fame"]: x["fame"] = int(v(b, "msl")); x["based"] = qid(v(b, "m"))
        if v(b, "start"): x["year"] = min(x.get("year") or 9999, year(v(b, "start")))
        if v(b, "eps"): x["eps"] = int(float(v(b, "eps")))
        for k, f in (("studios", "studioLabel"), ("authors", "authLabel"), ("genres", "genreLabel")):
            if v(b, f) and not re.match(r"^Q\d+$", v(b, f)): x[k].add(v(b, f))
    items = [x for x in xs.values() if not re.match(r"^Q\d+$", x["n"])]
    for x in items: x["studios"] = sorted(x["studios"])[:2]; x["authors"] = sorted(x["authors"])[:2]; x["genres"] = sorted(x["genres"])[:3]
    items.sort(key=lambda x: -x["fame"])
    write("anime", items[:300])

def food():
    rows = sparql("""SELECT ?d ?dLabel ?oLabel ?mLabel ?img ?sl WHERE { ?d wdt:P31 wd:Q746549; wdt:P495 ?o; wdt:P18 ?img; wikibase:sitelinks ?sl. FILTER(?sl > 14)
      OPTIONAL { ?d wdt:P186 ?m } OPTIONAL { ?d wdt:P527 ?m }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    ds = {}
    for b in rows:
        d = qid(v(b, "d")); x = ds.setdefault(d, {"id": d, "n": v(b, "dLabel"), "kind": "dish", "fame": int(v(b, "sl")), "origin": set(), "made": set()})
        if v(b, "oLabel") and not re.match(r"^Q\d+$", v(b, "oLabel")): x["origin"].add(v(b, "oLabel"))
        if v(b, "mLabel") and not re.match(r"^Q\d+$", v(b, "mLabel")): x["made"].add(v(b, "mLabel"))
        x["_img"] = fname(v(b, "img"))
    items = [x for x in ds.values() if len(x["origin"]) == 1 and not re.match(r"^Q\d+$", x["n"])]
    for x in items: x["origin"] = next(iter(x["origin"])); x["made"] = sorted(x["made"])[:5]
    items = sorted(items, key=lambda x: -x["fame"])[:250]
    attach_images("food", items)
    for x in items:
        if x["n"] and x["n"][0].islower(): x["n"] = x["n"][0].upper() + x["n"][1:]   # Wikidata labels some dishes in lower case
    write("food", items)

# ---------------- Football: from ballknowledge ----------------
def football():
    q = json.load(open(os.path.join(BK, "02_processed_data/quiz_data.json"), encoding="utf-8"))
    fame = lambda p: max(float(p.get("peak") or 0), float(p.get("val") or 0))
    ps = sorted([p for p in q["players"] if p.get("hist")], key=lambda p: -fame(p))
    hero = {f[:-5]: f for f in os.listdir(os.path.join(BK, "docs/football/hero"))}
    slug = lambda n: re.sub(r"[^a-z]", "", __import__("unicodedata").normalize("NFKD", n).encode("ascii", "ignore").decode().lower())
    items = []
    for p in ps:
        hist = [h for h in p["hist"] if not re.search(r"yth|youth|\bu\d\d\b|\bii\b|\bb$|reserve", h, re.I)]
        x = {"id": "p" + str(p["id"]), "n": p["n"], "kind": "player", "fame": fame(p), "nat": p.get("nat"), "pos": p.get("sub") or p.get("pos"), "club": p.get("club"),
             "born": year(p.get("dob")), "hist": hist, "caps": int(p["caps"]) if p.get("caps") else None, "val": int(float(p["val"])) if p.get("val") else None, "foot": p.get("foot")}
        s = slug(p["n"])
        if s in hero:
            rel = f"img/football/{s}.webp"; os.makedirs(os.path.join(ROOT, "img/football"), exist_ok=True)
            shutil.copy(os.path.join(BK, "docs/football/hero", hero[s]), os.path.join(ROOT, rel)); x["img"] = rel; x["cut"] = 1
            x["cr"] = {"img": {"by": "TheSportsDB", "lic": "Identification only", "page": "https://www.thesportsdb.com"}}
        elif p.get("ph") and len(items) < 260:
            rel = f"img/football/p{p['id']}.webp"
            if save_img(p["ph"], os.path.join(ROOT, rel), keep_alpha=True):
                x["img"] = rel; x["cut"] = 1
                x["cr"] = {"img": {"by": "EA Sports FC portrait", "lic": "Identification only", "page": "https://www.ea.com/games/ea-sports-fc/ratings"}}
        items.append(x)
    clubs = []; bycl = {slug(n): n for n in q["clubs"]}
    for d in ("E0", "D1", "SP1", "I1", "F1"):
        folder = os.path.join(BK, "site/logos/clubs", d)
        for f in sorted(os.listdir(folder)) if os.path.isdir(folder) else []:
            name = bycl.get(slug(os.path.splitext(f)[0]))
            if not name:
                print("  no club name for crest", f); continue
            src = os.path.join(folder, f); rel = f"img/football/club_{slug(name)}.webp"
            try:
                im = Image.open(src).convert("RGBA"); im.thumbnail((300, 300)); im.save(os.path.join(ROOT, rel), "WEBP", quality=80)
            except Exception:
                continue
            info = q["clubs"].get(name, {})
            clubs.append({"id": "c" + slug(name), "n": name, "kind": "club", "lg": d, "logo": rel, "stadium": info.get("stadium"), "coach": info.get("coach"),
                          "cr": {"logo": {"by": "Club crest", "lic": "Identification only", "page": "https://www.transfermarkt.com"}}})
    write("football", items + clubs)

if __name__ == "__main__":
    todo = sys.argv[1:] or ["kpop", "basketball", "chess", "geography", "history", "food"]
    for w in todo:
        try:
            globals()[w]()
        except Exception as e:
            print("FAILED", w, e)
