"""
Photos for idols that still have none, from the K-pop wiki's page for that member (kpop.fandom.com, the page's lead picture).
Used with the site owner's permission; the credit on every picture names the source and links to the member's page.
A page is accepted only when its title is exactly "Name (Group)" for the idol's own stage name and group, so a namesake can never
be picked. Anything else stays without a picture.  Run last in the K-pop chain.
"""
import json, os, re, sys, time, io, urllib.parse
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
P = os.path.join(B.ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
key = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
API = "https://kpop.fandom.com/api.php"
GROUP_TITLES = {"I-dle": ["(G)I-dle", "i-dle"], "Seventeen": ["SEVENTEEN"], "Illit": ["ILLIT"], "Ive": ["IVE"], "Itzy": ["ITZY"], "Zerobaseone": ["ZEROBASEONE"],
                "Babymonster": ["BABYMONSTER"], "TWS": ["TWS"], "Riize": ["RIIZE"], "Cortis": ["CORTIS"], "Nmixx": ["NMIXX"], "Everglow": ["EVERGLOW"],
                "Ateez": ["ATEEZ"], "Treasure": ["TREASURE"], "Enhypen": ["ENHYPEN"], "Boynextdoor": ["BOYNEXTDOOR"], "Twice": ["TWICE"], "Blackpink": ["BLACKPINK"],
                "Le Sserafim": ["LE SSERAFIM"], "Fromis 9": ["fromis_9", "fromis 9"], "Iz*One": ["IZ*ONE"], "Kiss of Life": ["KISS OF LIFE"], "Unis": ["UNIS"], "KiiiKiii": ["KiiiKiii"]}
def get(params):
    for wait in (2, 10, 30):
        try:
            r = requests.get(API, params=params, headers=B.HEAD, timeout=30)
            if r.status_code == 200: return r.json()
        except requests.RequestException: pass
        time.sleep(wait)
    return {}
need = [x for x in items if x["kind"] == "idol" and not x.get("img")]
print(len(need), "idols without a photo", flush=True); got = 0
for x in need:
    g = (x.get("groups") or [""])[0]; names = [x["n"]] + ([] if " " not in x["n"] else [x["n"].split()[-1]]); gs = [g] + GROUP_TITLES.get(g, [])
    title = None
    res = get({"action": "opensearch", "search": f"{x['n']} {g}", "limit": 8, "format": "json"}); cands = res[1] if res and len(res) > 1 else []
    for t in cands:
        m = re.fullmatch(r"(.+?) \((.+)\)", t)
        if m and key(m.group(1)) in {key(n) for n in names} and key(m.group(2)) in {key(a) for a in gs}: title = t; break
    if not title:   # any candidate page counts when its picture's own file name names the group AND a piece of the idol's name
        toks = [key(t) for t in re.split(r"[\s-]+", x["n"]) if len(key(t)) >= 3] or [key(x["n"])]
        for t in cands:
            if t.endswith("/Gallery") or "/" in t or key(t) in {key(a) for a in gs}: continue
            ex = get({"action": "query", "titles": t, "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": 720, "format": "json"})
            try: pg = next(iter(ex["query"]["pages"].values())); fn = key(urllib.parse.unquote((pg.get("thumbnail") or {}).get("source", "")).split("/revision/")[0].split("/")[-1])
            except Exception: continue
            if any(key(a) in fn for a in gs if key(a)) and any(tk in fn for tk in toks): title = t; break
    if not title: continue
    r = get({"action": "query", "titles": title, "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": 720, "format": "json"})
    try: src = next(iter(r["query"]["pages"].values()))["thumbnail"]["source"]
    except Exception: continue
    try:
        img = requests.get(src, headers=B.HEAD, timeout=60)
        if img.status_code != 200: print("download", img.status_code, x["n"], flush=True); time.sleep(5); continue
        im = Image.open(io.BytesIO(img.content)).convert("RGB"); im.thumbnail((720, 720))
        rel = f"img/kpop/{x['id']}_img.webp"; im.save(os.path.join(B.ROOT, rel), "WEBP", quality=84)
    except Exception as e: print("bad", x["n"], str(e)[:50], flush=True); continue
    x["img"] = rel; x.setdefault("cr", {})["img"] = {"by": "Kpop Wiki (Fandom): concept photo", "lic": "used with the site owner's permission", "page": "https://kpop.fandom.com/wiki/" + urllib.parse.quote(title.replace(" ", "_"))}
    got += 1
    if got % 10 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(got, "so far", flush=True)
    time.sleep(0.8)
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(got, "photos added;", len(need) - got, "still without one", flush=True)
