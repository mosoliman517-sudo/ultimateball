"""
Adds to the existing packs without rebuilding them (run any of: anime trivia events):
  python3 pipelines/more_content.py anime     popular series and their main characters from AniList, with pictures; fills missing pictures
  python3 pipelines/more_content.py trivia    every further short-answer question Open Trivia DB has (CC BY-SA 4.0)
  python3 pipelines/more_content.py events    more dated historical events with pictures (Wikidata, CC0; pictures from Commons)
Nothing already in a pack is changed apart from adding a missing picture.
"""
import html, io, json, os, re, sys, time, unicodedata
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

key = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s or "").lower())
load = lambda w: json.load(open(os.path.join(B.ROOT, "packs", w + ".json"), encoding="utf-8"))
def store(w, d): json.dump(d, open(os.path.join(B.ROOT, "packs", w + ".json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))

# ---------------- anime (AniList) ----------------
QUERY = """query($p:Int){ Page(page:$p, perPage:25){ media(type:ANIME, sort:POPULARITY_DESC, format_in:[TV,ONA], isAdult:false){
  id siteUrl popularity episodes genres startDate{year} title{romaji english} synonyms coverImage{extraLarge large}
  relations{ edges{ relationType node{ type format } } } studios(isMain:true){ nodes{ name } }
  staff(perPage:4, sort:RELEVANCE){ edges{ role node{ name{full} } } }
  characters(sort:[ROLE,FAVOURITES_DESC], perPage:6){ edges{ role node{ id siteUrl gender favourites name{full} image{large} } } } } } }"""

def anilist(page):
    for wait in (3, 30, 65, 65):
        try:
            r = requests.post("https://graphql.anilist.co", json={"query": QUERY, "variables": {"p": page}}, headers=B.HEAD, timeout=60)
            if r.status_code == 200: return r.json()["data"]["Page"]["media"]
            if r.status_code == 429: time.sleep(int(r.headers.get("Retry-After", 60)) + 2); continue
        except requests.RequestException: pass
        time.sleep(wait)
    return []

def picture(url, rel):
    try:
        r = requests.get(url, headers=B.HEAD, timeout=60)
        if r.status_code != 200: return False
        im = Image.open(io.BytesIO(r.content)).convert("RGB"); im.thumbnail((420, 600))
        os.makedirs(os.path.join(B.ROOT, os.path.dirname(rel)), exist_ok=True); im.save(os.path.join(B.ROOT, rel), "WEBP", quality=78); return True
    except Exception:
        return False

def credit(by, page): return {"img": {"by": by, "lic": "not freely licensed; shown with credit", "page": page}}

def anime(pages=28, add_series=300, chars_each=4):
    d = load("anime"); items = d["items"]
    shows = [x for x in items if x["kind"] == "anime"]
    index = {}
    for x in shows:
        for n in [x["n"]] + x.get("alt", []): index.setdefault(key(n), x)
    seen_chars = {(x.get("anime"), key(x["n"])): x for x in items if x["kind"] == "character"}
    media = []
    for p in range(1, pages + 1):
        media += anilist(p); time.sleep(2.2)
        if p % 5 == 0: print("page", p, len(media), flush=True)
    # place new series on the same fame scale: compare with already known series of similar AniList popularity
    known = []
    for m in media:
        for t in [m["title"].get("english"), m["title"].get("romaji")] + (m.get("synonyms") or []):
            x = index.get(key(t))
            if x and (not x.get("year") or not (m["startDate"] or {}).get("year") or abs(x["year"] - m["startDate"]["year"]) <= 1):
                m["_have"] = x; known.append((m["popularity"], x.get("fame", 0))); break
    known.sort()
    def fame_for(pop):
        near = sorted(known, key=lambda k: abs(k[0] - pop))[:15]
        vals = sorted(f for _, f in near) or [10]
        return round(vals[len(vals) // 2], 1)
    new = filled = chars = 0
    for m in media:
        sequel = any(e["relationType"] == "PREQUEL" and e["node"]["type"] == "ANIME" and e["node"]["format"] in ("TV", "ONA") for e in m["relations"]["edges"])
        x = m.get("_have")
        title = m["title"].get("english") or m["title"].get("romaji")
        cover = (m["coverImage"] or {}).get("extraLarge") or (m["coverImage"] or {}).get("large")
        if x is None:
            if sequel or new >= add_series or not title or re.search(r"\b(season|part|cour)\b|\b(2nd|3rd|\dth)\b|[\[\(]", title, re.I): continue
            x = {"id": f"al{m['id']}", "n": title, "kind": "anime", "fame": fame_for(m["popularity"]), "genres": (m.get("genres") or [])[:3],
                 "studios": [s["name"] for s in m["studios"]["nodes"]][:2], "year": (m["startDate"] or {}).get("year"), "eps": m.get("episodes"), "src": "AniList",
                 "authors": [e["node"]["name"]["full"] for e in m["staff"]["edges"] if e["role"].startswith("Original")][:2]}
            alt = [t for t in (m["title"].get("romaji"), m["title"].get("english")) if t and t != title]
            if alt: x["alt"] = alt
            x = {k: v for k, v in x.items() if v not in (None, [], "")}
            rel = f"img/anime/{x['id']}.webp"
            if not cover or not picture(cover, rel): continue
            x["img"] = rel; x["cr"] = credit("AniList cover art", m["siteUrl"]); items.append(x); new += 1
            for n in [x["n"]] + alt: index.setdefault(key(n), x)
        elif not x.get("img") and cover:
            rel = f"img/anime/{x['id']}_img.webp"
            if picture(cover, rel): x["img"] = rel; x.setdefault("cr", {}).update(credit("AniList cover art", m["siteUrl"])); filled += 1
        have_n = sum(1 for (a, _) in seen_chars if a == x["n"])
        for e in m["characters"]["edges"]:
            c = e["node"]; name = (c["name"] or {}).get("full"); img = (c.get("image") or {}).get("large")
            if not name or not img or "default" in img or e["role"] == "BACKGROUND": continue
            old = seen_chars.get((x["n"], key(name))) or seen_chars.get((x["n"], key(" ".join(reversed(name.split())))))
            if old:
                if not old.get("img"):
                    rel = f"img/anime/{old['id']}_img.webp"
                    if picture(img, rel): old["img"] = rel; old.setdefault("cr", {}).update(credit("AniList character art", c["siteUrl"])); filled += 1
                continue
            if have_n >= chars_each or e["role"] != "MAIN": continue
            y = {"id": f"alc{c['id']}", "n": name, "kind": "character", "anime": x["n"], "fame": round(x.get("fame", 0) * (0.4 + 0.6 * min(1, (c.get("favourites") or 0) / 20000)), 1), "src": "AniList"}
            if y["id"] in {i["id"] for i in items}: continue
            g = (c.get("gender") or "").lower()
            if g in ("male", "female"): y["gender"] = g
            rel = f"img/anime/{y['id']}.webp"
            if not picture(img, rel): continue
            y["img"] = rel; y["cr"] = credit("AniList character art", c["siteUrl"]); items.append(y); seen_chars[(x["n"], key(name))] = y; have_n += 1; chars += 1
        if (new + chars) and (new + chars) % 100 < 4: store("anime", d); print("so far", new, "series", chars, "characters", filled, "pictures filled", flush=True)
    store("anime", d)
    print(f"anime done: +{new} series, +{chars} characters, {filled} missing pictures filled", flush=True)

# ---------------- trivia (Open Trivia DB) ----------------
def trivia():
    d = load("general"); items = d["items"]; seen = {x["q"] for x in items}
    tok = requests.get("https://opentdb.com/api_token.php", params={"command": "request"}, headers=B.HEAD, timeout=30).json()["token"]
    n = len(items); added = 0; empty = 0
    for k in range(140):
        try:
            r = requests.get("https://opentdb.com/api.php", params={"amount": 50, "type": "multiple", "token": tok}, headers=B.HEAD, timeout=40).json()
        except Exception:
            time.sleep(10); continue
        if r.get("response_code") == 5: time.sleep(8); continue
        if r.get("response_code") != 0:
            empty += 1
            r2 = requests.get("https://opentdb.com/api.php", params={"amount": 10, "type": "multiple", "token": tok}, headers=B.HEAD, timeout=40).json() if empty < 3 else {}
            if r2.get("response_code") != 0: break
            r = r2
        for q in r["results"]:
            a = html.unescape(q["correct_answer"]).strip(); t = html.unescape(q["question"]).strip()
            if t in seen or len(a) > 28 or len(a.split()) > 4 or re.search(r"which of these|which one of the following|not\b|following", t, re.I): continue
            seen.add(t)
            while any(x["id"] == f"g{n}" for x in items[-1:]): n += 1
            items.append({"id": f"gx{n}", "n": a, "kind": "trivia", "q": t, "cat": html.unescape(q["category"]), "diff": q["difficulty"], "fame": {"easy": 3, "medium": 2, "hard": 1}[q["difficulty"]],
                          "cr": {"q": {"by": "Open Trivia Database", "lic": "CC BY-SA 4.0", "page": "https://opentdb.com"}}}); n += 1; added += 1
        if k % 10 == 0: store("general", d); print("request", k, "added", added, flush=True)
        time.sleep(5.5)
    store("general", d); print(f"trivia done: +{added}, total {len(items)}", flush=True)

# ---------------- events (Wikidata) ----------------
def events(extra=200):
    d = load("history"); items = d["items"]; have = {x["id"] for x in items}; names = {key(x["n"]) for x in items}
    rows = B.sparql("""SELECT ?e ?eLabel ?tLabel ?start ?pit ?end ?locLabel ?img ?sl WHERE {
      VALUES ?t { wd:Q198 wd:Q178561 wd:Q10931 wd:Q131569 wd:Q3839081 wd:Q8065 wd:Q7944 wd:Q124734 wd:Q2223653 wd:Q1261499 wd:Q645883 wd:Q2334719 }
      ?e wdt:P31 ?t; wikibase:sitelinks ?sl; wdt:P18 ?img. FILTER(?sl > 30)
      OPTIONAL { ?e wdt:P580 ?start } OPTIONAL { ?e wdt:P585 ?pit } OPTIONAL { ?e wdt:P582 ?end } OPTIONAL { ?e wdt:P276 ?loc }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
    ev = {}
    for b in rows:
        e = B.qid(B.v(b, "e"))
        if e in have: continue
        x = ev.setdefault(e, {"id": e, "n": B.v(b, "eLabel"), "kind": "event", "fame": int(B.v(b, "sl")), "type": B.v(b, "tLabel"), "_y": set()})
        for f in ("start", "pit"):
            if B.v(b, f) and B.year(B.v(b, f)) is not None: x["_y"].add(B.year(B.v(b, f)))
        if B.v(b, "end") and B.year(B.v(b, "end")) is not None: x["end"] = B.year(B.v(b, "end"))
        if B.v(b, "locLabel") and not re.match(r"^Q\d+$", B.v(b, "locLabel")): x["where"] = B.v(b, "locLabel")
        x["_img"] = B.fname(B.v(b, "img"))
    new = []
    for x in sorted(ev.values(), key=lambda x: -x["fame"]):
        ys = x.pop("_y")
        # one clear date only (sources that disagree are left out), no unnamed or legendary entries
        if len(ys) != 1 or re.match(r"^Q\d+$", x["n"]) or key(x["n"]) in names or re.search(r"trojan|myth|legend|full-scale", x["n"], re.I): continue
        x["year"] = ys.pop()
        if x.get("end") is not None and x["end"] < x["year"]: x.pop("end")
        if x["n"][0].islower(): x["n"] = x["n"][0].upper() + x["n"][1:]
        names.add(key(x["n"])); new.append(x)
        if len(new) >= extra: break
    print(len(new), "candidate events; fetching pictures", flush=True)
    B.attach_images("history", new, width=960, size=640)
    new = [x for x in new if x.get("img")]
    d["items"] = items + new; store("history", d)
    print(f"events done: +{len(new)}", flush=True)

if __name__ == "__main__":
    for what in sys.argv[1:]:
        {"anime": anime, "trivia": trivia, "events": events}[what]()
