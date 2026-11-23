"""
Full discographies for the named groups from MusicBrainz (free, open data, CC0): every album, EP and single since debut, with its first
release date, type, and flags for live albums, compilations, remixes and language versions. Stored on each group as `discography`
(newest first) with the MusicBrainz id, so a record can be checked at musicbrainz.org/artist/<id>. No audio comes from here:
playable previews stay with the Apple song list (kpop_songs.py).
An artist is accepted only when MusicBrainz names it exactly like the group (or a known alias) and calls it a group from Korea or Japan.
Run after kpop_curated.py:  python3 pipelines/kpop_discography.py
"""
import json, os, re, sys, time
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kpop_named import NAMED, key
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
H = {"User-Agent": "games-platform-prototype/0.2 (student project)"}
ALT = {"katseye": ["KATSEYE"], "txt": ["TOMORROW X TOGETHER"], "idle": ["(G)I-DLE", "i-dle"], "izone": ["IZ*ONE"], "fromis9": ["fromis_9"], "kissoflife": ["KISS OF LIFE"], "nctwish": ["NCT WISH"], "aespa": ["æspa", "aespa"], "ive": ["IVE"], "boynextdoor": ["BOYNEXTDOOR"], "meovv": ["MEOVV"]}
def mb(path, **p):
    p["fmt"] = "json"
    for w in (1.3, 6, 20, 40):
        time.sleep(w)
        try:
            r = requests.get("https://musicbrainz.org/ws/2/" + path, params=p, headers=H, timeout=40)
            if r.status_code == 200: return r.json()
        except requests.RequestException: pass
    return {}
VERSION = re.compile(r"\((?:[^)]*\b(?:japanese|japan|korean|english|chinese)\b[^)]*)\)|\[[^\]]*\b(?:japanese|japan|korean|english)\b[^\]]*\]|\b(?:japanese|japan)\s+(?:ver|version)", re.I)
report = []
for g in [x for x in items if x["kind"] == "group" and key(x["n"]) in {key(n) for n in NAMED}]:
    names = {key(g["n"])} | {key(a) for a in ALT.get(key(g["n"]), [])}
    cand = []
    for q in ALT.get(key(g["n"]), []) + [g["n"]]:   # a known full name first: the bare name can match an unrelated artist
        r = mb("artist", query=f'artist:"{q}"', limit=10)
        cand += [a for a in r.get("artists", []) if key(a.get("name")) in names and a.get("type") in ("Group", None) and a.get("country") in ("KR", "JP", "US") or (a.get("country") is None and key(g["n"]) not in ("txt",))]
        if cand: break
    cand.sort(key=lambda a: (a.get("country") != "KR", -int(a.get("score", 0))))
    if not cand: report.append(f"{g['n']}: no MusicBrainz artist found"); continue
    a = cand[0]; out = []; off = 0
    while True:
        r = mb("release-group", artist=a["id"], type="album|ep|single", limit=100, offset=off)
        rgs = r.get("release-groups", [])
        for x in rgs:
            t = x["title"]; sec = [s.lower() for s in x.get("secondary-types", [])]
            if not x.get("first-release-date"): continue
            out.append({"t": t, "ty": (x.get("primary-type") or "").lower(), "d": x["first-release-date"], "sec": sec or None, "ver": bool(VERSION.search(t)) or None, "id": x["id"][:8]})
        off += len(rgs)
        if not rgs or off >= r.get("release-group-count", 0): break
    out.sort(key=lambda x: x["d"], reverse=True); g["discography"] = out; g["mb"] = a["id"]; g["discography_source"] = "musicbrainz.org/artist/" + a["id"]
    report.append(f"{g['n']}: {len(out)} releases ({sum(1 for x in out if x['ty']=='album')} albums, {sum(1 for x in out if x['ty']=='ep')} EPs, {sum(1 for x in out if x['ty']=='single')} singles) {a['name']} [{a.get('country')}]")
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print("\n".join(report))
