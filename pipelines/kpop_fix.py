"""
Second pass over packs/kpop.json after a big build: Commons and Wikimedia throttle bursts, so some pictures and page-view counts
fail the first time. This fetches, slowly, (1) the photos and logos still missing for idols and groups that have one on Wikidata,
and (2) every group's English Wikipedia page views over the last 12 months.
Run after kpop_songs.py:  python3 pipelines/kpop_fix.py
"""
import json, os, re, sys, time, urllib.parse
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

P = os.path.join(B.ROOT, "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8"))
# only younger groups: debut 2015 or later; members of older groups go too, and so do those groups' songs
FIRST = 2015
ALWAYS = {"BTS"}   # older groups kept on request
old = {x["n"] for x in d["items"] if x["kind"] == "group" and (x.get("debut") or 0) < FIRST and x["n"] not in ALWAYS}
keep = []
for x in d["items"]:
    if x["kind"] == "group" and x["n"] in old: continue
    if x["kind"] == "song" and x.get("by") in old: continue
    if x["kind"] == "idol":
        x["groups"] = [g for g in x.get("groups", []) if g not in old]
        if not x["groups"]: continue
    keep.append(x)
d["items"] = its = keep
# idols who were ever in a K-pop group that started before 2015 (Red Velvet's Irene, EXO's Chanyeol...) go as well, even when they
# also have a newer sub-unit or side group; sub-units left with no members go with them. BTS stays by request.
idq = [x["id"] for x in its if x["kind"] == "idol" and re.match(r"^Q\d+$", x["id"])]
veteran = set()
for i in range(0, len(idq), 150):
    vals = " ".join("wd:" + q for q in idq[i:i + 150])
    for b in B.sparql(f"""SELECT ?p ?gLabel (MIN(YEAR(?d)) AS ?y) WHERE {{ VALUES ?p {{ {vals} }} ?p wdt:P463 ?g. ?g wdt:P136 wd:Q213665.
        {{ ?g wdt:P571 ?d }} UNION {{ ?g wdt:P2031 ?d }} SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }} GROUP BY ?p ?gLabel"""):
        if int(B.v(b, "y")) < FIRST and B.v(b, "gLabel") not in ALWAYS: veteran.add(B.qid(B.v(b, "p")))
# ex-Iz*One members (Wonyoung, Yujin, Chaewon, Sakura, Yena...) always stay: they lead today's big groups
izone = {x["id"] for x in its if x["kind"] == "idol" and any(g in ("Iz*One", "IZ*ONE", "Izone") for g in x.get("groups", []))}
veteran -= izone
before = {}
for x in its:
    if x["kind"] == "idol":
        for g in x.get("groups", []): before[g] = before.get(g, 0) + 1
its = [x for x in its if not (x["kind"] == "idol" and x["id"] in veteran)]
after = {}
for x in its:
    if x["kind"] == "idol":
        for g in x.get("groups", []): after[g] = after.get(g, 0) + 1
gone = {g for g, n in before.items() if n and not after.get(g)}
its = [x for x in its if not ((x["kind"] == "group" and x["n"] in gone) or (x["kind"] == "song" and x.get("by") in gone))]
d["items"] = its
print(f"removed {len(veteran)} idols from pre-{FIRST} groups and {len(gone)} groups left without members: {sorted(gone)}")
debut = {x["n"]: x.get("debut") or 0 for x in its if x["kind"] == "group"}
for x in its:
    if x["kind"] == "group": y = debut[x["n"]]; x["gen"] = 3 if y < 2018 else 4 if y < 2023 else 5
    if "fame0" not in x: x["fame0"] = x["fame"]          # the original count of Wikipedia articles, kept so this step can run again
print(f"dropped {len(old)} groups that debuted before {FIRST}; {sum(1 for x in its if x['kind'] == 'group')} groups left")
need = [x for x in its if x["kind"] in ("idol", "group") and re.match(r"^Q\d+$", x["id"]) and (not x.get("img") or (x["kind"] == "group" and not x.get("logo")))]
files = {}
for i in range(0, len(need), 150):
    ids = " ".join("wd:" + x["id"] for x in need[i:i + 150])
    for b in B.sparql(f"SELECT ?x ?img ?logo WHERE {{ VALUES ?x {{ {ids} }} OPTIONAL {{ ?x wdt:P18 ?img }} OPTIONAL {{ ?x wdt:P154 ?logo }} }}"):
        q = B.qid(B.v(b, "x"))
        if B.v(b, "img"): files.setdefault(q, {})["img"] = B.fname(B.v(b, "img"))
        if B.v(b, "logo"): files.setdefault(q, {})["logo"] = B.fname(B.v(b, "logo"))
for x in its:
    if x["n"] in B.IMG_FIX and not x.get("img"): files.setdefault(x["id"], {})["img"] = B.IMG_FIX[x["n"]]
todo = [(x, k, f) for x in need for k, f in files.get(x["id"], {}).items() if not x.get(k)]
print(len(todo), "pictures to fetch")
cr = B.credits_for([f for _, _, f in todo], 960)
got = 0
for x, k, f in todo:
    if f not in cr: continue
    rel = f"img/kpop/{x['id']}_{k}.webp"
    for attempt in range(3):
        if B.save_img(cr[f]["thumb"], os.path.join(B.ROOT, rel), keep_alpha=k == "logo", size=720): break
        time.sleep(20 * (attempt + 1))
    if os.path.exists(os.path.join(B.ROOT, rel)):
        x[k] = rel; x.setdefault("cr", {})[k] = {"by": cr[f]["by"], "lic": cr[f]["lic"], "page": cr[f]["page"]}; got += 1
    time.sleep(12)   # Commons rate-limits bursts (429): one picture every 12 seconds
print(got, "pictures added")
n = 0
for x in its:
    if x["kind"] != "group" or not x.get("wiki"): continue
    for wait in (0, 5, 20):
        time.sleep(wait or 0.6)
        try:
            r = requests.get("https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/en.wikipedia/all-access/user/" + urllib.parse.quote(x["wiki"].replace(" ", "_"), safe="") + "/monthly/2025110100/2026103100", headers=B.HEAD, timeout=30)
            if r.status_code == 200: x["views"] = sum(i["views"] for i in r.json()["items"]); n += 1; break
            if r.status_code == 404: break
        except requests.RequestException: pass
# how well known each group is decides the difficulty it appears at (Easy draws from the best known, Elite from the rest):
# English Wikipedia views over the last year where we have them, otherwise the number of Wikipedia articles about the group
groups = [x for x in its if x["kind"] == "group"]
withv = [x for x in groups if x.get("views")]
ratio = sorted(x["views"] / max(1, x["fame0"]) for x in withv)[len(withv) // 2] if withv else 10000
for g in groups: g["fame"] = round((g["views"] if g.get("views") else g["fame0"] * ratio * 0.7) / 1000, 1)
gf = {g["n"]: g for g in groups}
for x in its:
    if x["kind"] == "idol":     # an idol is as known as their best-known group, adjusted by how known they are personally
        gs = [gf[n] for n in x.get("groups", []) if n in gf]
        if gs:
            top = max(gs, key=lambda g: g["fame"]); peers = [y["fame0"] for y in its if y["kind"] == "idol" and top["n"] in y.get("groups", [])]
            x["fame"] = round(top["fame"] * (0.55 + 0.45 * x["fame0"] / max(peers or [1])), 1)
    elif x["kind"] == "song" and x.get("by") in gf:   # a song: its group's fame, less for deeper cuts
        g = gf[x["by"]]; x["fame"] = round(g["fame"] * min(1, x["fame0"] / max(1, g.get("fame0", 1))), 1)
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(n, "groups with page views")
print("best known:", [g["n"] for g in sorted(groups, key=lambda g: -g["fame"])[:25]])
