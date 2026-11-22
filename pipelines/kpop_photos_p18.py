"""
Photos for idols that still have none, using the picture Wikidata links to each person (P18) and Commons' direct file link
(Special:FilePath), which is served from a different cache than the thumbnail generator that was throttling us.
Credit: the Commons file page. Run after the other K-pop steps.
"""
import json, os, re, sys, time, io, urllib.parse
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
P = os.path.join(B.ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
need = [x for x in items if x["kind"] == "idol" and not x.get("img") and re.match(r"^Q\d+$", x["id"])]
files = {}
for i in range(0, len(need), 120):
    vals = " ".join("wd:" + x["id"] for x in need[i:i + 120])
    for b in B.sparql(f"SELECT ?p ?img WHERE {{ VALUES ?p {{ {vals} }} ?p wdt:P18 ?img. }}"): files.setdefault(B.qid(B.v(b, "p")), B.fname(B.v(b, "img")))
print(len(need), "idols without a photo;", len(files), "have a Wikidata picture", flush=True)
got = 0
for x in need:
    fn = files.get(x["id"])
    if not fn: continue
    ok = False
    for wait in (0, 20, 60):
        time.sleep(wait or 2.5)
        try:
            r = requests.get("https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(fn) + "?width=720", headers=B.HEAD, timeout=60)
        except requests.RequestException: continue
        if r.status_code == 200: ok = True; break
        if r.status_code != 429: break
    if not ok: print("fail", x["n"], r.status_code, flush=True); continue
    try:
        im = Image.open(io.BytesIO(r.content)).convert("RGB"); im.thumbnail((720, 720))
        rel = f"img/kpop/{x['id']}_img.webp"; im.save(os.path.join(B.ROOT, rel), "WEBP", quality=82)
    except Exception as e: print("bad image", x["n"], e, flush=True); continue
    x["img"] = rel; x.setdefault("cr", {})["img"] = {"by": "Wikimedia Commons", "lic": "see file page", "page": "https://commons.wikimedia.org/wiki/File:" + fn.replace(" ", "_")}
    got += 1
    if got % 10 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(got, "so far", flush=True)
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(got, "photos added;", len(need) - got, "still without one", flush=True)
