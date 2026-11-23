"""
Curated K-pop database for the site: the 4th and 5th generation groups the user listed, plus TWICE, BLACKPINK, BTS and IZ*ONE
(and Seventeen, Stray Kids). Only these groups, their members (born 1997+, or 1994+ for the legacy four) and their songs released
in 2022 or later are kept. Tiers: 1 = major international acts, 2 = mainstream, 3 = established but less universal.
Run last in the K-pop chain (after kpop_focus.py):  python3 pipelines/kpop_curated.py
"""
import json, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8"))
LEGACY = {"TWICE", "BLACKPINK", "BTS", "Iz*One"}
MODERN = ["Hearts2Hearts", "ILLIT", "KATSEYE", "KiiiKiii", "AllDay Project", "CORTIS", "BABYMONSTER", "TWS", "RIIZE", "ZEROBASEONE",
          "Boynextdoor", "NCT Wish", "MEOVV", "Unis", "BADVILLAIN", "Fifty Fifty", "KickFlip", "Nowz",
          "Le Sserafim", "NewJeans", "I-dle", "ITZY", "IVE", "aespa", "TXT", "Stray Kids", "ENHYPEN", "ATEEZ", "TREASURE", "THE BOYZ",
          "STAYC", "NMIXX", "Kiss of Life", "XG", "Kep1er", "EVERGLOW", "P1Harmony", "CRAVITY", "fromis 9", "Seventeen"]
TIER1 = {"BTS", "BLACKPINK", "TWICE", "NewJeans", "Le Sserafim", "IVE", "aespa", "Stray Kids", "ITZY", "ILLIT", "Seventeen", "ENHYPEN", "TXT", "Hearts2Hearts", "KATSEYE", "RIIZE", "BABYMONSTER", "Iz*One"}
TIER2 = {"I-dle", "ATEEZ", "TWS", "ZEROBASEONE", "Boynextdoor", "NMIXX", "Kiss of Life", "STAYC", "TREASURE", "THE BOYZ", "CORTIS", "AllDay Project", "NCT Wish", "Kep1er", "P1Harmony", "CRAVITY", "fromis 9", "EVERGLOW", "XG", "MEOVV", "KiiiKiii"}
key = lambda s: "".join(c for c in s.lower() if c.isalnum())
want = {key(n) for n in MODERN + list(LEGACY)}
groups = [x for x in d["items"] if x["kind"] == "group" and key(x["n"]) in want]
gnames = {x["n"] for x in groups}
have = {key(x["n"]) for x in groups}
missing = sorted(n for n in MODERN if key(n) not in have)
for g in groups:
    g["tier"] = 1 if key(g["n"]) in {key(t) for t in TIER1} else 2 if key(g["n"]) in {key(t) for t in TIER2} else 3   # case-insensitive: the data says "Itzy", the list says "ITZY"
    g["gen"] = 3 if (g.get("debut") or 0) < 2018 else 4 if (g.get("debut") or 0) < 2023 else 5
out = []
for x in d["items"]:
    k = x["kind"]
    if k == "group":
        if x["n"] in gnames: out.append(x)
    elif k == "song":
        if x.get("by") in gnames and (x.get("date") or "")[:4] >= "2022": out.append(x)
    elif k == "idol":
        gs = [g for g in x.get("groups", []) if g in gnames]
        if not gs: continue
        legacy = any(g in LEGACY for g in gs)
        born = x.get("born") or 0
        if born and born < (1994 if legacy else 1997): continue
        x["groups"] = gs; out.append(x)
d["items"] = out
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print("groups", len(groups), "idols", sum(1 for x in out if x["kind"] == "idol"), "songs 2022+", sum(1 for x in out if x["kind"] == "song"))
print("tiers:", {t: sum(1 for g in groups if g["tier"] == t) for t in (1, 2, 3)})
print("NOT IN THE DATA (need adding from Wikidata):", missing)
