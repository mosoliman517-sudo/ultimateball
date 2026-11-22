"""
More recent K-pop groups: every boy group, girl group and co-ed group on Wikidata that debuted in 2015 or later (Wikidata's
inception or start of work period), down to newer acts with few Wikipedia articles, with their members and photos.
Groups already in packs/kpop.json are left as they are. Afterwards run kpop_names.py, kpop_songs.py and kpop_fix.py.
Run:  python3 pipelines/kpop_more.py
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

P = os.path.join(B.ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8"))
have = {x["id"] for x in d["items"]}
rows = B.sparql("""SELECT ?g ?gLabel ?inc ?ws ?labLabel ?img ?logo ?sl ?typeLabel ?title WHERE {
  ?g wdt:P136 wd:Q213665; wdt:P31 ?type; wikibase:sitelinks ?sl. VALUES ?type { wd:Q215380 wd:Q216337 wd:Q641066 wd:Q2088357 wd:Q5741069 }
  OPTIONAL { ?g wdt:P571 ?inc } OPTIONAL { ?g wdt:P2031 ?ws } OPTIONAL { ?g wdt:P264 ?lab } OPTIONAL { ?g wdt:P18 ?img } OPTIONAL { ?g wdt:P154 ?logo }
  OPTIONAL { ?art schema:about ?g; schema:isPartOf <https://en.wikipedia.org/>; schema:name ?title }
  FILTER(?sl > 2) SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } }""")
G = {}
for b in rows:
    g = B.qid(B.v(b, "g"))
    if g in have: continue
    x = G.setdefault(g, {"id": g, "n": B.v(b, "gLabel"), "kind": "group", "fame": int(B.v(b, "sl")), "labels": set(), "types": set(), "_y": set()})
    for k in ("inc", "ws"):
        if B.v(b, k) and B.year(B.v(b, k)): x["_y"].add(B.year(B.v(b, k)))
    if B.v(b, "labLabel") and not re.match(r"^Q\d+$", B.v(b, "labLabel")): x["labels"].add(B.v(b, "labLabel"))
    if B.v(b, "typeLabel"): x["types"].add(B.v(b, "typeLabel"))
    if B.v(b, "img"): x["_img"] = B.fname(B.v(b, "img"))
    if B.v(b, "logo"): x["_logo"] = B.fname(B.v(b, "logo"))
    if B.v(b, "title"): x["wiki"] = B.v(b, "title")
new = []
for x in G.values():
    y = x.pop("_y")
    if not y or min(y) < 2015 or re.match(r"^Q\d+$", x["n"]): continue   # no debut year: cannot prove it is a 2015+ group
    x["debut"] = min(y); x["labels"] = sorted(x["labels"])[:2]; t = x.pop("types")
    x["gender"] = "boy group" if "boy band" in t else "girl group" if "girl group" in t else None
    new.append(x)
new = sorted(new, key=lambda x: -x["fame"])   # every 2015+ group with a debut year; the lesser known end up in Hard and Elite
print(len(new), "new groups (2015+):", [f"{x['n']} {x['debut']}" for x in new[:40]])
if new:
    ids = " ".join("wd:" + x["id"] for x in new); gname = {x["id"]: x["n"] for x in new}
    rows = B.sparql(f"""SELECT ?p ?pLabel ?g ?dob ?bpLabel ?img ?sl WHERE {{ VALUES ?g {{ {ids} }} ?p wdt:P463 ?g; wdt:P31 wd:Q5; wikibase:sitelinks ?sl.
      OPTIONAL {{ ?p wdt:P569 ?dob }} OPTIONAL {{ ?p wdt:P19 ?bp }} OPTIONAL {{ ?p wdt:P18 ?img }}
      SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
    idols = {x["id"]: x for x in d["items"] if x["kind"] == "idol"}; fresh = {}
    for b in rows:
        p = B.qid(B.v(b, "p")); n = B.v(b, "pLabel")
        if re.match(r"^Q\d+$", n): continue
        if p in idols:   # already here for another group: add this group to them
            if gname[B.qid(B.v(b, "g"))] not in idols[p]["groups"]: idols[p]["groups"].append(gname[B.qid(B.v(b, "g"))])
            continue
        x = fresh.setdefault(p, {"id": p, "n": n, "kind": "idol", "fame": int(B.v(b, "sl")), "groups": set()})
        x["groups"].add(gname[B.qid(B.v(b, "g"))])
        if B.v(b, "dob"): x["born"] = B.year(B.v(b, "dob"))
        if B.v(b, "bpLabel") and not re.match(r"^Q\d+$", B.v(b, "bpLabel")): x["from"] = B.v(b, "bpLabel")
        if B.v(b, "img"): x["_img"] = B.fname(B.v(b, "img"))
    il = list(fresh.values())
    for x in il: x["groups"] = sorted(x["groups"])
    cnt = {}
    for x in il:
        for g in x["groups"]: cnt[g] = cnt.get(g, 0) + 1
    for x in new: x["members"] = max(x.get("members", 0), cnt.get(x["n"], 0)) or None
    print(len(il), "new idols")
    # pictures come from kpop_photos_wiki.py (Wikipedia thumbnails, not rate-limited); drop the raw Commons file names here
    for x in new + il:
        x.pop("_img", None); x.pop("_logo", None)
    d["items"] += new + il
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print("kpop.json now has", sum(1 for x in d["items"] if x["kind"] == "group"), "groups")
