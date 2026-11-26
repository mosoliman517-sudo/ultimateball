"""
Final league tables and big-match records for "Where did they finish?" and "Who did it", taken from ballknowledge's
public football and basketball builds (read only). Writes site/bk_history.json.
    python3 pipelines/bk_history.py
"""
import glob, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BK = os.path.expanduser("~/Desktop/football-prediction-model")


def data(sport):
    found = glob.glob(os.path.join(BK, "docs", sport, "data.*.js"))
    assert len(found) == 1, f"expected one data file for {sport}"
    text = open(found[0], encoding="utf-8").read()
    return json.loads(text[text.index("=") + 1:].rstrip().rstrip(";"))


def tables(d):
    out = {}
    for code, league in d["leagues"].items():
        # [team, points or wins, scored, conceded, won, drawn, lost], in finishing order
        t = {season: [row[:7] for row in rows] for season, rows in (league.get("tables") or {}).items() if len(rows) >= 10}
        if t:
            out[code] = {"name": league.get("name", code), "tables": t}
    return out


def main():
    fb, nba = data("football"), data("basketball")
    keep = ("t", "comp", "season", "date", "h", "a", "hg", "ag", "ev")
    matches = [{k: m[k] for k in keep if k in m} for m in fb.get("highlights", []) if m.get("ev") and all(e.get("p") for e in m["ev"])]
    out = {"football": {"leagues": tables(fb), "matches": matches}, "basketball": {"leagues": tables(nba)}}
    path = os.path.join(ROOT, "site", "bk_history.json")
    json.dump(out, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    for sport, v in out.items():
        print(sport, sum(len(l["tables"]) for l in v["leagues"].values()), "season tables,", len(v.get("matches", [])), "matches")


main()
