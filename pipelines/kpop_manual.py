"""
Manual roster fixes for named groups that Wikidata lists incompletely (aespa: only 2 of 4 members, XG: absent), plus the stage names
fans use for KATSEYE and aespa members. Every manual entry carries src="official roster (manual)" so it is easy to audit.
No birth years are filled in by hand. Run after kpop_named.tidy and before kpop_songs.py / kpop_curated.py.
"""
import json, os
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8")); items = d["items"]
STAGE = {"Ning Ning": "Ningning", "Daniela Avanzini": "Daniela", "Manon Bannerman": "Manon", "Sophia Laforteza": "Sophia", "Lara Raj": "Lara",
         "Megan Skiendiel": "Megan", "Yoonchae Jeung": "Yoonchae", "Yoonchae Jeong": "Yoonchae"}
for x in items:
    if x["kind"] == "idol" and x["n"] in STAGE and any(g in ("aespa", "KATSEYE") for g in x.get("groups", [])): x["n"] = STAGE[x["n"]]
ROSTER = {"aespa": ["Karina", "Winter"], "XG": ["Jurin", "Chisa", "Hinata", "Harvey", "Juria", "Maya", "Cocona"]}
names = {(x["n"], g) for x in items if x["kind"] == "idol" for g in x.get("groups", [])}
if not any(x["kind"] == "group" and x["n"] == "XG" for x in items):
    items.append({"id": "manual-xg", "n": "XG", "kind": "group", "fame": 2, "debut": 2022, "labels": [], "gender": "girl group", "gen": 4, "src": "official roster (manual)"})
for g, ms in ROSTER.items():
    for m in ms:
        if (m, g) not in names:
            items.append({"id": f"manual-{g.lower()}-{m.lower()}", "n": m, "kind": "idol", "fame": 1, "groups": [g], "src": "official roster (manual)"})
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
for g in ("aespa", "XG", "KATSEYE"): print(g, [x["n"] for x in items if x["kind"] == "idol" and g in x.get("groups", [])])
