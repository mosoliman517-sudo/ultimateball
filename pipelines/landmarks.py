"""
Famous landmarks for geography (towers, bridges, temples, palaces, ruins, statues...): photo, country, city and the year built,
from Wikidata (CC0) with Wikimedia Commons photos. Adds `landmark` items to packs/geography.json (the country flags stay).
Run:  python3 pipelines/landmarks.py
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

TYPES = ("Q570116 Q4989906 Q12518 Q12280 Q23413 Q16560 Q44539 Q16970 Q32815 Q11303 Q179700 Q839954 Q2977 Q12570 Q57821 Q1081138 Q15243209 Q33506 Q483453 Q1497364 Q2065736 Q41176 Q811979")
SKIP = {"Auschwitz", "World Trade Center", "Bastille", "Buddhas of Bamiyan"}   # places of atrocity or destroyed buildings: not quiz material
rows = B.sparql(f"""SELECT ?l ?lLabel ?cLabel ?cityLabel ?inc ?img ?sl WHERE {{ VALUES ?t {{ {" ".join("wd:" + t for t in TYPES.split())} }}
  ?l wdt:P31 ?t; wdt:P18 ?img; wdt:P17 ?c; wikibase:sitelinks ?sl. FILTER(?sl > 70)
  OPTIONAL {{ ?l wdt:P131 ?city }} OPTIONAL {{ ?l wdt:P571 ?inc }}
  SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
L = {}
for b in rows:
    i = B.qid(B.v(b, "l")); n = B.v(b, "lLabel")
    if re.match(r"^Q\d+$", n) or n in SKIP: continue
    x = L.setdefault(i, {"id": i, "n": n, "kind": "landmark", "fame": int(B.v(b, "sl")), "country": B.v(b, "cLabel"), "_img": B.fname(B.v(b, "img"))})
    c = B.v(b, "cityLabel")
    if c and not re.match(r"^Q\d+$", c) and c != x["country"] and "city" not in x: x["city"] = c
    if B.v(b, "inc") and B.year(B.v(b, "inc")) is not None: x["built"] = min(x.get("built", 99999), B.year(B.v(b, "inc")))
items = sorted(L.values(), key=lambda x: -x["fame"])[:180]
print(len(items), "landmarks:", [x["n"] for x in items[:30]])
B.attach_images("geography", items, width=960, size=720)
items = [x for x in items if x.get("img")]
p = os.path.join(B.ROOT, "packs", "geography.json"); d = json.load(open(p, encoding="utf-8"))
d["items"] = [x for x in d["items"] if x["kind"] != "landmark"] + items
json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(items), "landmarks with photos added to geography")
