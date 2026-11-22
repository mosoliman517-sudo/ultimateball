"""
Anime characters from Wikidata (CC0): the best-known characters of every series in packs/anime.json, with the series they are
in. Character art is copyrighted (no free pictures), so the character games are name-based. Adds `character` items.
Run:  python3 pipelines/anime_characters.py
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

p = os.path.join(B.ROOT, "packs", "anime.json"); d = json.load(open(p, encoding="utf-8"))
shows = {x["id"]: x["n"] for x in d["items"] if x["kind"] == "anime" and re.match(r"^Q\d+$", x["id"])}
chars = {}; types = {}
ids = list(shows)
for i in range(0, len(ids), 120):
    vals = " ".join("wd:" + q for q in ids[i:i + 120])
    # characters of the anime itself, or of the manga it is based on (P144)
    for b in B.sparql(f"""SELECT ?c ?cLabel ?a ?sl ?gLabel ?tLabel WHERE {{ VALUES ?a {{ {vals} }} {{ ?c wdt:P1441 ?a }} UNION {{ ?a wdt:P144 ?m. ?c wdt:P1441 ?m }}
        ?c wikibase:sitelinks ?sl. FILTER(?sl > 6) OPTIONAL {{ ?c wdt:P21 ?g }} OPTIONAL {{ ?c wdt:P31 ?t }} SERVICE wikibase:label {{ bd:serviceParam wikibase:language "en". }} }}"""):
        c = B.qid(B.v(b, "c")); n = B.v(b, "cLabel"); types.setdefault(c, set()).add((B.v(b, "tLabel") or "").lower())
        if re.match(r"^Q\d+$", n): continue
        x = chars.setdefault(c, {"id": c, "n": n, "kind": "character", "fame": int(B.v(b, "sl")), "anime": shows[B.qid(B.v(b, "a"))]})
        if B.v(b, "gLabel") in ("male", "female"): x["gender"] = B.v(b, "gLabel")
# keep anime and manga characters; drop gods, myths and literary figures that a series borrows (Zeus in Ulysses 31)
ok = lambda ts: any("character" in t for t in ts) and not any(re.search(r"deity|god\b|myth|legend|literary|historical|biblical|folklore", t) for t in ts)
items = sorted([x for x in chars.values() if ok(types.get(x["id"], set()))], key=lambda x: -x["fame"])[:600]
items = sorted(items, key=lambda x: -x["fame"])[:600]
d["items"] = [x for x in d["items"] if x["kind"] != "character"] + items
json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(items), "characters from", len({x["anime"] for x in items}), "series:", [f"{x['n']} ({x['anime']})" for x in items[:20]])
