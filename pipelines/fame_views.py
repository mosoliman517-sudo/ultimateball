"""
How well known something is, measured the same way everywhere: English Wikipedia page views over the last 12 months
(Wikimedia pageviews API). This decides what Easy, Medium, Hard and Elite draw from, so Easy is what most people actually know
(Naruto and Demon Slayer, pizza and sushi, France and Japan) rather than whatever has the most translations on Wikidata.
An anime with no English article of its own uses the manga it adapts (`based`). Items with no article keep a small score from
their old count, so they land in Hard and Elite. The old count is kept as `fame0`.
Run (after the packs are built):  python3 pipelines/fame_views.py anime food history geography
"""
import json, os, re, sys, time, urllib.parse
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

CACHE = os.path.join(B.ROOT, "packs", "_views_cache.json")
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

def views(title):
    if title in cache: return cache[title]
    for wait in (0, 5, 20):
        time.sleep(wait or 0.5)
        try:
            r = requests.get("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/" + urllib.parse.quote(title.replace(" ", "_"), safe="") + "/monthly/2025110100/2026103100", headers=B.HEAD, timeout=30)
            if r.status_code == 200: cache[title] = sum(i["views"] for i in r.json()["items"]); break
            if r.status_code == 404: cache[title] = 0; break
        except requests.RequestException: pass
    if len(cache) % 50 == 0: json.dump(cache, open(CACHE, "w"))
    return cache.get(title, 0)

for w in sys.argv[1:]:
    p = os.path.join(B.ROOT, "packs", w + ".json"); d = json.load(open(p, encoding="utf-8"))
    its = [x for x in d["items"] if re.match(r"^Q\d+$", x["id"]) and x["kind"] != "character"]
    qs = sorted({x["id"] for x in its} | {x["based"] for x in its if x.get("based")}); title = {}
    for i in range(0, len(qs), 200):
        vals = " ".join("wd:" + q for q in qs[i:i + 200])
        for b in B.sparql(f"SELECT ?x ?t WHERE {{ VALUES ?x {{ {vals} }} ?a schema:about ?x; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?t. }}"):
            title[B.qid(B.v(b, "x"))] = B.v(b, "t")
    for k, x in enumerate(its):
        if "fame0" not in x: x["fame0"] = x["fame"]
        vs = [views(title[q]) for q in (x["id"], x.get("based")) if q and q in title]
        x["views"] = max(vs) if vs else 0
        if k % 100 == 0: print(w, k, "of", len(its))
    # no English article: a tiny score from the old count keeps them in order among themselves, below anything people read about
    for x in its: x["fame"] = round(x["views"] / 1000, 1) if x["views"] else round(x["fame0"] / 1000, 3)
    # anime characters: as known as their series
    if w == "anime":
        show = {x["n"]: x["fame"] for x in d["items"] if x["kind"] == "anime"}
        for x in d["items"]:
            if x["kind"] == "character":
                if "fame0" not in x: x["fame0"] = x["fame"]
                x["fame"] = round(show.get(x["anime"], 0) * (0.4 + 0.6 * min(1, x["fame0"] / 60)), 1)
    json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":")); json.dump(cache, open(CACHE, "w"))
    for kind in sorted({x["kind"] for x in its}):
        top = sorted([x for x in its if x["kind"] == kind], key=lambda x: -x["fame"])
        print(f"{w}/{kind}: best known {[x['n'] for x in top[:15]]}")
