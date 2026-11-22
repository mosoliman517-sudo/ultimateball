"""
K-pop focus: 4th and 5th generation (debut 2018 on) plus the groups the user named (Twice, Blackpink, BTS, Iz*One, Seventeen,
Stray Kids). Idols born before 1994 are removed (they are the old groups' members). Songs and idols are cleaned to match.
Run last in the K-pop chain:  python3 pipelines/kpop_focus.py
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8"))
KEEP = {"Twice", "Blackpink", "BTS", "Iz*One", "Seventeen", "Stray Kids"}
MIN_BORN = 1994
groups = {x["n"] for x in d["items"] if x["kind"] == "group" and ((x.get("debut") or 0) >= 2018 or x["n"] in KEEP)}
out = []
for x in d["items"]:
    k = x["kind"]
    if k == "group" and x["n"] not in groups: continue
    if k == "song" and x.get("by") not in groups: continue
    if k == "idol":
        x["groups"] = [g for g in x.get("groups", []) if g in groups]
        if not x["groups"]: continue
        if x.get("born") and x["born"] < MIN_BORN: continue
    out.append(x)
d["items"] = out
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print("groups", sum(1 for x in out if x["kind"] == "group"), "idols", sum(1 for x in out if x["kind"] == "idol"), "songs", sum(1 for x in out if x["kind"] == "song"))
