"""
Data audit for the K-pop database (packs/kpop.json). Run it after any update:  python3 pipelines/kpop_audit.py
Checks: group roster size vs the official count and the count the source page states, duplicate idols / songs / groups,
idols and songs pointing at groups that do not exist, groups with too few members, idols and groups without a picture,
songs without a release date, picture files that do not exist, songs per group, release-year spread.
Exit code 1 when a blocking problem is found. Writes packs/_kpop_audit.json (the same facts, machine-readable).
"""
import json, os, re, sys, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
d = json.load(open(os.path.join(ROOT, "packs", "kpop.json"), encoding="utf-8"))["items"]
key = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
groups = {x["n"]: x for x in d if x["kind"] == "group"}; idols = [x for x in d if x["kind"] == "idol"]; songs = [x for x in d if x["kind"] == "song"]
block, warn = [], []
cur = collections.defaultdict(list)
for i in idols:
    for g in i.get("groups", []):
        if g not in groups: block.append(f"idol {i['n']} points at unknown group {g}")
        elif not i.get("former"): cur[g].append(i)
for n, g in sorted(groups.items()):
    r = len(cur[n]); official = g.get("members"); lead = g.get("lead_count")
    if r == 0: block.append(f"{n}: no current members in the data")
    if official and r != official: block.append(f"{n}: {r} current members in the data, official count {official}")
    if lead and official and official < 0.6 * lead: block.append(f"{n}: the member table gave {official} but the source page says {lead}: parser miss")
    elif lead and official and lead != official: warn.append(f"{n}: the source page's first sentence says {lead}, its member table has {official} (a lineup change: check)")
    if not g.get("debut"): warn.append(f"{n}: no debut year")
    if not (g.get("img") or g.get("logo")): warn.append(f"{n}: no picture")
    names = collections.Counter(key(i["n"]) for i in cur[n])
    for k, c in names.items():
        if c > 1: block.append(f"{n}: duplicate member {k}")
titles = {(key(s["by"]), key(t)) for s in songs for t in (s["n"], s.get("album"))}
for i in idols:
    for g in i.get("groups", []):
        if (key(g), key(i["n"])) in titles: block.append(f"{g}: '{i['n']}' is a song or album title, not a member")
gd = collections.Counter(key(g["n"]) for g in groups.values())
for k, c in gd.items():
    if c > 1: block.append(f"duplicate group {k}")
sd = collections.Counter((key(s["by"]), key(s["n"])) for s in songs)
for k, c in sd.items():
    if c > 1: warn.append(f"duplicate song {k}")
for s in songs:
    if s.get("by") not in groups: block.append(f"song {s['n']} points at unknown group {s.get('by')}")
    if not s.get("date"): block.append(f"song {s['n']} has no release date")
for x in d:
    for k in ("img", "logo", "cover"):
        v = x.get(k)
        if v and not v.startswith("http") and not os.path.exists(os.path.join(ROOT, v)): block.append(f"{x['kind']} {x['n']}: {k} file missing {v}")
import hashlib
seen_h = {}
for x in d:
    v = x.get("img")
    if v and not v.startswith("http") and os.path.exists(os.path.join(ROOT, v)):
        h = hashlib.md5(open(os.path.join(ROOT, v), "rb").read()).hexdigest()
        if h in seen_h and seen_h[h] != x["n"]: block.append(f"{x['kind']} {x['n']} shares a picture file with {seen_h[h]} (a placeholder or a wrong match)")
        seen_h.setdefault(h, x["n"])
noimg = [f"{i['n']} ({i['groups'][0] if i.get('groups') else '?'})" for i in idols if not i.get("img") and not i.get("former")]
per = collections.Counter(s["by"] for s in songs); yrs = collections.Counter(s["date"][:4] for s in songs if s.get("date"))
print(f"groups {len(groups)} | current idols {sum(len(v) for v in cur.values())} (+{sum(1 for i in idols if i.get('former'))} former) | songs {len(songs)}")
print("song years:", dict(sorted(yrs.items())))
print("groups with fewer than 5 songs:", [f"{g} ({per.get(g, 0)})" for g in groups if per.get(g, 0) < 5])
print(f"idols without a picture: {len(noimg)}", noimg[:30])
print(f"\nBLOCKING ({len(block)}):"); [print("  -", b) for b in block]
print(f"\nWARNINGS ({len(warn)}):"); [print("  -", w) for w in warn]
json.dump({"groups": len(groups), "idols": len(idols), "songs": len(songs), "blocking": block, "warnings": warn, "idols_without_picture": noimg}, open(os.path.join(ROOT, "packs", "_kpop_audit.json"), "w"), indent=1)
sys.exit(1 if block else 0)
