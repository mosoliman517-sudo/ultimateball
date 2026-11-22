"""
Adds real starting line-ups from ballknowledge to the football and basketball packs, for the "Name them all" games:
  football   : 02_processed_data/xi.json + xi_old.json (finals, Champions League knockouts, league giants; from match line-up data)
  basketball : 02_processed_data/nba_xi.json (playoff and finals starting fives, from ESPN box scores)
Run after build_packs.py:  python3 pipelines/lineups.py
"""
import json, os

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BK = os.path.expanduser("~/Desktop/football-prediction-model/02_processed_data")

def add(world, new):
    p = os.path.join(ROOT, "packs", world + ".json"); d = json.load(open(p, encoding="utf-8"))
    d["items"] = [x for x in d["items"] if x["kind"] != "lineup"] + new
    json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
    print(world, len(new), "line-ups")

fx = []
for f in ("xi.json", "xi_old.json"):
    for m in json.load(open(os.path.join(BK, f), encoding="utf-8")):
        teams = m["teams"] if isinstance(m["teams"], list) else []
        for t in teams:
            xi = [{"n": p["n"], "pos": p.get("pos")} for p in t.get("xi", [])]
            if len(xi) == 11:
                fx.append({"id": f"x{len(fx)}", "n": f"{t['club']} · {m.get('t') or m.get('comp')}", "kind": "lineup", "club": t["club"], "title": m.get("t") or m.get("comp"),
                           "date": m.get("date"), "score": f"{m.get('hg')}-{m.get('ag')}", "won": t.get("won"), "players": xi, "fame": 1 if m.get("k") == "final" else 0})
add("football", fx)

bx = []
for m in json.load(open(os.path.join(BK, "nba_xi.json"), encoding="utf-8")):
    for t in m["teams"]:
        five = [{"n": p["n"], "pos": p.get("pos")} for p in t.get("starters", [])]
        if len(five) == 5:
            bx.append({"id": f"f{len(bx)}", "n": f"{t['team']} · {m['label']}", "kind": "lineup", "club": t["team"], "title": m["label"], "date": m["date"],
                       "season": m["season"], "score": str(t.get("score")), "won": t.get("won"), "players": five, "fame": 1 if "finals" in m["label"].lower() else 0})
add("basketball", bx)
