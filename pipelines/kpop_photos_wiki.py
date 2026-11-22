"""
Photos for K-pop groups and idols that still have none, from their English Wikipedia article's lead image (a Wikimedia Commons
file). Wikipedia's page summary is not rate-limited the way Commons downloads were. Every picture keeps its Commons author and
licence (read from Commons' file metadata), shown on the answer card. Items with no article image are left without one.
Run after the other K-pop steps:  python3 pipelines/kpop_photos_wiki.py
"""
import json, os, re, sys, time, io, urllib.parse
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

P = os.path.join(B.ROOT, "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8")); its = d["items"]
need = [x for x in its if x["kind"] in ("idol", "group") and not x.get("img") and re.match(r"^Q\d+$", x["id"])]
print(len(need), "items without a photo")
titles = {}
ids = [x["id"] for x in need]
for i in range(0, len(ids), 150):
    vals = " ".join("wd:" + q for q in ids[i:i + 150])
    for b in B.sparql(f"SELECT ?x ?t WHERE {{ VALUES ?x {{ {vals} }} ?a schema:about ?x; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?t. }}"):
        titles[B.qid(B.v(b, "x"))] = B.v(b, "t")
H = B.HEAD; got = 0
def polite(url, **kw):
    """GET that waits out rate limits (429) with growing pauses instead of giving up."""
    for wait in (30, 60, 120, 240, 300):
        r = requests.get(url, **kw)
        if r.status_code != 429: return r
        print("rate limited, waiting", wait, "s", flush=True); time.sleep(wait)
    return r
for x in need:
    t = titles.get(x["id"])
    if not t: continue
    try:
        r = polite("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(t.replace(" ", "_"), safe=""), headers=H, timeout=30)
        if r.status_code != 200: print("summary", r.status_code, x["n"]); continue
        src = (r.json().get("originalimage") or r.json().get("thumbnail") or {}).get("source")
        if not src or "/commons/" not in src: print("no image", x["n"]); continue
        fn = urllib.parse.unquote(src.split("/commons/", 1)[1].split("/", 2)[-1].split("?")[0].split("/")[-1]) if "/thumb/" not in src else urllib.parse.unquote(src.split("/thumb/", 1)[1].split("/")[-2])
        try:
            c = requests.get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "titles": "File:" + fn, "prop": "imageinfo", "iiprop": "extmetadata|url", "format": "json"}, headers=H, timeout=30).json()
            pg = next(iter(c["query"]["pages"].values())); ii = pg["imageinfo"][0]; md = ii.get("extmetadata", {})
        except Exception:   # Commons rate-limits its metadata too: keep the picture, credit it to its file page
            ii = {"descriptionurl": "https://commons.wikimedia.org/wiki/File:" + fn.replace(" ", "_")}; md = {}
        img = polite(src, headers=H, timeout=60)
        if img.status_code != 200: print("download", img.status_code, x["n"]); time.sleep(3); continue
        im = Image.open(io.BytesIO(img.content)).convert("RGB"); im.thumbnail((720, 720))
        rel = f"img/kpop/{x['id']}_img.webp"; os.makedirs(os.path.join(B.ROOT, "img", "kpop"), exist_ok=True)
        im.save(os.path.join(B.ROOT, rel), "WEBP", quality=82)
        x["img"] = rel
        x.setdefault("cr", {})["img"] = {"by": re.sub(r"<[^>]+>", "", md.get("Artist", {}).get("value", "")).strip()[:90] or "Unknown author",
                                         "lic": re.sub(r"<[^>]+>", "", md.get("LicenseShortName", {}).get("value", "")).strip(), "page": ii["descriptionurl"]}
        got += 1
        if got % 25 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(got, "photos so far")
    except Exception as e:
        print("fail", x["n"], type(e).__name__, str(e)[:80]); continue
    time.sleep(4)   # one picture every few seconds keeps the rate limit away
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(got, "photos added;", sum(1 for x in need if not x.get("img")), "still without one")
