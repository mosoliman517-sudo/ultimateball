"""
The named K-pop groups, and a targeted add for any that Wikidata's general K-pop list missed (searched by name).
Everything else in the K-pop data is dropped by kpop_curated.py. Shared by kpop_curated.py and kpop_songs.py.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
LEGACY = {"TWICE", "BLACKPINK", "BTS", "Iz*One"}
MODERN = ["Hearts2Hearts", "ILLIT", "KATSEYE", "KiiiKiii", "AllDay Project", "CORTIS", "BABYMONSTER", "TWS", "RIIZE", "ZEROBASEONE",
          "Boynextdoor", "NCT Wish", "MEOVV", "Unis", "BADVILLAIN", "Fifty Fifty", "KickFlip", "Nowz",
          "Le Sserafim", "NewJeans", "I-dle", "ITZY", "IVE", "aespa", "TXT", "Stray Kids", "ENHYPEN", "ATEEZ", "TREASURE", "THE BOYZ",
          "STAYC", "NMIXX", "Kiss of Life", "XG", "Kep1er", "EVERGLOW", "P1Harmony", "CRAVITY", "fromis 9", "Seventeen"]
NAMED = {"TWICE", "BLACKPINK", "BTS", "Iz*One"} | set(MODERN)
key = lambda s: "".join(c for c in s.lower() if c.isalnum())
SEARCH = {"aespa": "aespa", "TXT": "Tomorrow X Together", "KATSEYE": "Katseye", "MEOVV": "Meovv", "XG": "XG (group)", "Boynextdoor": "Boynextdoor", "THE BOYZ": "The Boyz"}

def add_missing(P):
    """Adds each named group that is not in the data yet, found by name on Wikidata, with its members."""
    d = json.load(open(P, encoding="utf-8")); have = {key(x["n"]) for x in d["items"] if x["kind"] == "group"}
    for name in NAMED:
        if key(name) in have or key(SEARCH.get(name, name)) in have: continue
        q = SEARCH.get(name, name)
        r = B.get("https://www.wikidata.org/w/api.php", params={"action": "wbsearchentities", "search": q, "language": "en", "format": "json", "limit": 8, "type": "item"}).json()
        ids = " ".join("wd:" + x["id"] for x in r.get("search", []))
        if not ids: print("not found:", name); continue
        rows = B.sparql(f"""SELECT ?g ?gLabel ?inc ?sl WHERE {{ VALUES ?g {{ {ids} }} ?g wdt:P31/wdt:P279* wd:Q215380 .
            ?g wikibase:sitelinks ?sl. OPTIONAL {{ ?g wdt:P571 ?inc }} SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
        if not rows: print("no group match for:", name); continue
        best = max(rows, key=lambda b: int(B.v(b, "sl")))
        gid = B.qid(B.v(best, "g")); gn = B.v(best, "gLabel")
        mem = B.sparql(f"""SELECT ?p ?pLabel ?dob WHERE {{ ?p wdt:P463 wd:{gid}; wdt:P31 wd:Q5. OPTIONAL {{ ?p wdt:P569 ?dob }} SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}""")
        print(name, "->", gn, B.year(B.v(best, "inc")), len(mem), "members")
        d["items"].append({"id": gid, "n": name if key(name) == key(gn) else gn, "kind": "group", "fame": int(B.v(best, "sl")), "debut": B.year(B.v(best, "inc")) or None})
        for b in mem:
            pn = B.v(b, "pLabel")
            if re.match(r"^Q\d+$", pn): continue
            d["items"].append({"id": B.qid(B.v(b, "p")), "n": pn, "kind": "idol", "fame": 1, "groups": [gn], "born": B.year(B.v(b, "dob"))})
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))

RENAME = {"Tomorrow X Together": "TXT", "Katseye": "KATSEYE", "Meovv": "MEOVV", "Q118178306": "Boynextdoor", "Boynextdoor": "Boynextdoor", "aespa": "aespa"}
def tidy(P):
    """Uses the names you use (TXT, KATSEYE, MEOVV, Boynextdoor, aespa), merges duplicate groups and their members."""
    d = json.load(open(P, encoding="utf-8")); items = d["items"]
    for x in items:
        if x["kind"] == "group" and x["n"] in RENAME: x["n"] = RENAME[x["n"]]
        if x["kind"] == "idol": x["groups"] = [RENAME.get(g, g) for g in x.get("groups", [])]
        if x["kind"] == "song" and x.get("by") in RENAME: x["by"] = RENAME[x["by"]]
    groups = {}; keep = []
    for x in items:
        if x["kind"] == "group":
            if x["n"] in groups: groups[x["n"]]["fame"] = max(groups[x["n"]]["fame"], x.get("fame", 0)); continue
            groups[x["n"]] = x
        keep.append(x)
    seen = {}; out = []
    for x in keep:
        if x["kind"] == "idol":
            k = x["id"]
            if k in seen:
                seen[k]["groups"] = sorted(set(seen[k]["groups"]) | set(x.get("groups", []))); continue
            seen[k] = x
        out.append(x)
    d["items"] = out
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
    print("tidy done")
