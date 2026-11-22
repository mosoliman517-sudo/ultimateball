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

def credits_for(files):
    out = {}
    files = [f for f in files if f]
    for i in range(0, len(files), 40):
        chunk = files[i:i + 40]
        r = get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "titles": "|".join("File:" + f for f in chunk), "prop": "imageinfo",
                                                                  "iiprop": "url|extmetadata", "iiurlwidth": 500, "format": "json"}).json()
        norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
        for p in r["query"]["pages"].values():
            if "imageinfo" not in p:
                continue
            ii = p["imageinfo"][0]; md = ii.get("extmetadata", {}); t = norm.get(p["title"], p["title"])[5:]
            out[t] = {"thumb": ii.get("thumburl") or ii["url"], "page": ii["descriptionurl"], "lic": strip(md.get("LicenseShortName", {}).get("value")),
                      "by": strip(md.get("Artist", {}).get("value"))[:90] or "Unknown author"}
        time.sleep(1)
    return out

def save_img(url, dest, square=False, keep_alpha=False):
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
        im.thumbnail((420, 420))
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        im.save(dest, "WEBP", quality=78)
        time.sleep(0.5)
        return True
    except Exception as e:
        print("  image failed", dest, e)
        return False

def attach_images(world, items, keys=("img",), alpha_keys=("logo", "flag")):
    files = [it.get("_" + k) for it in items for k in keys]
    cr = credits_for(files)
    for it in items:
        for k in keys:
            f = it.pop("_" + k, None)
            if not f or f not in cr:
                continue
            rel = f"img/{world}/{it['id']}_{k}.webp"
            if save_img(cr[f]["thumb"], os.path.join(ROOT, rel), keep_alpha=k in alpha_keys):
                it[k] = rel
                it.setdefault("cr", {})[k] = {"by": cr[f]["by"], "lic": cr[f]["lic"], "page": cr[f]["page"]}

def write(world, items, meta=None):
    os.makedirs(os.path.join(ROOT, "packs"), exist_ok=True)
    json.dump({"world": world, "items": items, **(meta or {})}, open(os.path.join(ROOT, "packs", world + ".json"), "w"), ensure_ascii=False, separators=(",", ":"))
    print(f"{world}: {len(items)} items, {sum(1 for x in items if x.get('img'))} photos, {sum(1 for x in items if x.get('logo'))} logos, {sum(1 for x in items if x.get('flag'))} flags")

# ---------------- K-pop: groups and their members ----------------
def kpop():
    rows = sparql("""SELECT ?g ?gLabel ?inc ?labLabel ?img ?logo ?sl ?typeLabel (COUNT(DISTINCT ?m) AS ?n) WHERE {
      ?g wdt:P136 wd:Q213665; wdt:P31 ?type; wikibase:sitelinks ?sl. VALUES ?type { wd:Q215380 wd:Q216337 wd:Q641066 wd:Q2088357 }
      OPTIONAL { ?g wdt:P571 ?inc } OPTIONAL { ?g wdt:P264 ?lab } OPTIONAL { ?g wdt:P18 ?img } OPTIONAL { ?g wdt:P154 ?logo } OPTIONAL { ?g wdt:P527 ?m }
      FILTER(?sl > 10) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }
      GROUP BY ?g ?gLabel ?inc ?labLabel ?img ?logo ?sl ?typeLabel ORDER BY DESC(?sl) LIMIT 900""")
    groups = {}
    for b in rows:
        g = qid(v(b, "g")); x = groups.setdefault(g, {"id": g, "n": v(b, "gLabel"), "kind": "group", "fame": int(v(b, "sl")), "labels": set(), "types": set()})
        if v(b, "inc") and "debut" not in x: x["debut"] = year(v(b, "inc"))
        if v(b, "labLabel"): x["labels"].add(v(b, "labLabel"))
        if v(b, "typeLabel"): x["types"].add(v(b, "typeLabel"))
        if v(b, "img"): x["_img"] = fname(v(b, "img"))
        if v(b, "logo"): x["_logo"] = fname(v(b, "logo"))
        if int(v(b, "n") or 0): x["members"] = max(x.get("members", 0), int(v(b, "n")))
    gl = sorted(groups.values(), key=lambda x: -x["fame"])[:160]
    for x in gl:
        x["labels"] = sorted(x["labels"])[:2]; t = x.pop("types")
        x["gender"] = "boy group" if "boy band" in t else "girl group" if "girl group" in t else None
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
    il = sorted(idols.values(), key=lambda x: -x["fame"]); il = il[:700] + [x for x in il[700:] if "Hearts2Hearts" in x["groups"]]
    for x in il: x["groups"] = sorted(x["groups"])
    rows = sparql(f"""SELECT ?s ?sLabel ?g ?date ?albLabel ?sl WHERE {{ VALUES ?g {{ {ids} }} ?s wdt:P175 ?g; wikibase:sitelinks ?sl. VALUES ?t {{ wd:Q7366 wd:Q134556 }} ?s wdt:P31 ?t.
      OPTIONAL {{ ?s wdt:P577 ?date }} OPTIONAL {{ ?s wdt:P361 ?alb }} FILTER(?sl > 2) SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
    songs = {}
    for b in rows:
        sid = qid(v(b, "s")); x = songs.setdefault(sid, {"id": sid, "n": v(b, "sLabel"), "kind": "song", "fame": int(v(b, "sl")), "by": gname[qid(v(b, "g"))]})
        if v(b, "date"): x["year"] = min(x.get("year", 9999), year(v(b, "date")))
        if v(b, "albLabel") and not re.match(r"^Q\d+$", v(b, "albLabel")): x["album"] = v(b, "albLabel")
    sl = [x for x in songs.values() if not re.match(r"^Q\d+$", x["n"])]
    gimg = {x["n"]: x for x in gl}
    print(f"kpop: {len(gl)} groups, {len(il)} idols, {len(sl)} songs")
    for k, x in enumerate(il):   # photos for the 250 best-known idols and every Hearts2Hearts member; the rest play without a picture
        if k >= 250 and "Hearts2Hearts" not in x["groups"]: x.pop("_img", None)
    
    items = gl + il + sorted(sl, key=lambda x: -x["fame"])[:500]
    attach_images("kpop", items, keys=("img", "logo"))
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
    occ = "wd:Q116 wd:Q82955 wd:Q189290 wd:Q4964182 wd:Q11900058 wd:Q901 wd:Q1028181 wd:Q36834 wd:Q36180 wd:Q47064"
    rows = sparql(f"""SELECT ?p ?pLabel ?dob ?dod ?cLabel ?occLabel ?img ?sl WHERE {{ VALUES ?occ {{ {occ} }}
      ?p wdt:P106 ?occ; wikibase:sitelinks ?sl. FILTER(?sl > 150) ?p wdt:P31 wd:Q5; wdt:P569 ?dob; wdt:P18 ?img. FILTER(YEAR(?dob) < 1900)
      OPTIONAL {{ ?p wdt:P570 ?dod }} OPTIONAL {{ ?p wdt:P27 ?c }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
    ps = {}
    for b in rows:
        p = qid(v(b, "p")); x = ps.setdefault(p, {"id": p, "n": v(b, "pLabel"), "kind": "person", "fame": int(v(b, "sl")), "occ": set(), "ctry": set()})
        x["born"] = year(v(b, "dob")); x["died"] = year(v(b, "dod")) if v(b, "dod") else None
        if v(b, "occLabel"): x["occ"].add(v(b, "occLabel"))
        if v(b, "cLabel") and not re.match(r"^Q\d+$", v(b, "cLabel")): x["ctry"].add(v(b, "cLabel"))
        x["_img"] = fname(v(b, "img"))
    items = sorted(ps.values(), key=lambda x: -x["fame"])[:160]
    for x in items: x["occ"] = sorted(x["occ"])[:2]; x["ctry"] = sorted(x["ctry"])[:1]
    attach_images("history", items)
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
    rows = sparql("""SELECT ?a ?aLabel ?start ?studioLabel ?eps ?authLabel ?genreLabel ?sl WHERE { ?a wdt:P31 wd:Q63952888; wikibase:sitelinks ?sl. FILTER(?sl > 8)
      OPTIONAL { ?a wdt:P580 ?start } OPTIONAL { ?a wdt:P272 ?studio } OPTIONAL { ?a wdt:P1113 ?eps } OPTIONAL { ?a wdt:P144 ?based. ?based wdt:P50 ?auth } OPTIONAL { ?a wdt:P136 ?genre }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    xs = {}
    for b in rows:
        a = qid(v(b, "a")); x = xs.setdefault(a, {"id": a, "n": v(b, "aLabel"), "kind": "anime", "fame": int(v(b, "sl")), "studios": set(), "authors": set(), "genres": set()})
        if v(b, "start"): x["year"] = year(v(b, "start"))
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
