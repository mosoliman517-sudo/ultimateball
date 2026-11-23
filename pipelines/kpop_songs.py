"""
K-pop songs from Apple's catalogue (iTunes Search API, no key): for every group in packs/kpop.json, its best-known tracks with
the real title, album, release date, album cover, a 30-second preview and the Apple Music link.
A track is kept only when Apple's artist is the group itself (or the group credited with someone), so namesakes never slip in.
Alternate versions (instrumental, remix, sped up, Japanese or English version, live...) are dropped; the earliest release of
each title is kept. A group with no debut year on Wikidata is dated from its first release here; groups whose first release
is before 2012 (2nd generation) are removed with their members.
Covers are linked from Apple, not copied (Apple lets its artwork be shown next to a link to the music).
Run after build_packs.py kpop and kpop_names.py:  python3 pipelines/kpop_songs.py
"""
import json, os, re, time, unicodedata
import requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json")
CACHE = os.path.join(ROOT, "packs", "_itunes_cache.json")   # raw answers, so a re-run does not ask Apple again
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower())
SKIP = re.compile(r"\b(inst|instrumental|remix|mix|ver|version|sped|slowed|live|acoustic|karaoke|english|japanese|chinese|japan|edit|demo|acapella|a cappella|orchestra|piano|intro|outro|interlude|skit|mr removed|reprise|clean|radio)\b", re.I)
PER_GROUP = 18

d = json.load(open(P, encoding="utf-8"))
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kpop_named import NAMED, key as nkey   # only the groups you named: the rest of the data is never fetched
NAMEDK = {nkey(n) for n in NAMED}
groups = [x for x in d["items"] if x["kind"] == "group" and nkey(x["n"]) in NAMEDK]
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}
ALIAS = {"TXT": ["TOMORROW X TOGETHER", "Tomorrow X Together"], "Tomorrow X Together": ["TOMORROW X TOGETHER", "TXT"], "(G)I-dle": ["i-dle", "(G)I-DLE"], "Girls' Generation": ["Girls' Generation", "SNSD"]}

def ask(term):
    if term in cache: return cache[term]
    for wait in (5, 20, 60):
        try:
            r = requests.get("https://itunes.apple.com/search", params={"term": term, "entity": "song", "attribute": "artistTerm", "limit": 200, "country": "US"}, timeout=40)
            if r.status_code == 200:
                cache[term] = r.json().get("results", []); json.dump(cache, open(CACHE, "w")); time.sleep(3.2); return cache[term]
        except requests.RequestException: pass
        time.sleep(wait)
    return []

def get_json(url, params):
    for wait in (3, 15, 45):
        try:
            r = requests.get(url, params=params, timeout=40)
            if r.status_code == 200: return r.json()
        except requests.RequestException: pass
        time.sleep(wait)
    return {}

def fetch(g, names):
    """Looks the artist up first (genre K-Pop preferred, name must match), then fetches that artist's songs by id: searching by
    a name like 'Twice' or 'Ive' returns hundreds of unrelated artists and buries the group."""
    k = "artist2:" + g["n"]
    if k in cache: return cache[k]
    terms = [g["n"]] + ALIAS.get(g["n"], [])
    found = None
    for term in terms:
        r = get_json("https://itunes.apple.com/search", {"term": term, "entity": "musicArtist", "limit": 15, "country": "US"}); time.sleep(3.2)
        c = [a for a in r.get("results", []) if norm(a.get("artistName")) in names]
        c.sort(key=lambda a: 0 if "k-pop" in (a.get("primaryGenreName") or "").lower() else 1)
        if c: found = c[0]; break
    if not found:
        print("no Apple artist for", g["n"], flush=True); return []
    out = []
    for tag, extra in (("pop", {}), ("recent", {"sort": "recent"})):   # Apple's default order (roughly by popularity) and its newest-first order
        r = get_json("https://itunes.apple.com/lookup", dict({"id": found["artistId"], "entity": "song", "limit": 200, "country": "US"}, **extra)); time.sleep(3.2)
        for i, t in enumerate(x for x in r.get("results", []) if x.get("wrapperType") == "track"): t["_ord"] = (tag, i); out.append(t)
    if out: cache[k] = out; json.dump(cache, open(CACHE, "w"))
    return out

def credited(artist, names):
    if norm(artist) in names: return True            # the whole name first: "TOMORROW X TOGETHER" contains " X "
    for n in names:
        if n and n in norm(artist) and len(n) >= 6: return True   # "TOMORROW X TOGETHER & Jonas Brothers"
    parts = [norm(p) for p in re.split(r",|&| x | X |\bfeat\.?|\bwith\b", artist or "")]
    return any(n and n in parts for n in names)

songs, firsts = [], {}
for k, g in enumerate(groups):
    names = {norm(g["n"])} | {norm(a) for a in ALIAS.get(g["n"], [])}
    seen = {}
    for t in fetch(g, names):
        if not credited(t.get("artistName"), names) or not t.get("previewUrl"): continue
        title = re.sub(r"\s*[\(\[](feat|with|prod)[^\)\]]*[\)\]]", "", t["trackName"]).strip()
        if SKIP.search(title) or SKIP.search(t.get("collectionName", "")) and "ver" in t.get("collectionName", "").lower(): continue
        date = (t.get("releaseDate") or "")[:10]
        if not date: continue
        firsts[g["id"]] = min(firsts.get(g["id"], "9999"), date)
        if date[:4] < "2022": continue        # recent music only: older songs would crowd out the quota before the cutoff
        key = norm(title)
        score = t["_ord"][1] if t["_ord"][0] == "pop" else 100 + t["_ord"][1]      # appears early in Apple's popular order: best; recent-only: after
        if not key or (key in seen and seen[key]["_rank"] <= score): continue
        alb = re.sub(r"\s*-\s*(Single|EP)$", "", t.get("collectionName", "")).strip()
        seen[key] = {"id": "s" + str(t["trackId"]), "n": title, "kind": "song", "by": g["n"], "gid": g["id"], "date": date, "year": int(date[:4]), "album": alb,
                     "single": t.get("collectionName", "").endswith("- Single") or norm(alb) == key, "cover": (t.get("artworkUrl100") or "").replace("100x100bb", "600x600bb"),
                     "pv": t["previewUrl"], "am": t.get("trackViewUrl"), "_rank": score}
    quota = {1: 22, 2: 15, 3: 9}.get(g.get("tier"), 12)
    top = sorted(seen.values(), key=lambda s: s["_rank"])[:quota]
    for i, s in enumerate(top):
        s["fame"] = s["fame0"] = round(g.get("fame0", g["fame"]) * (1 - i / (quota * 1.5)), 1); s.pop("_rank")
    songs += top
    if k % 20 == 0 or not top: print(k, g["n"], len(top), "songs", flush=True)

# date groups from their first release where Wikidata has no debut year; drop anything that started before 2012
drop = set()
for g in groups:
    if not g.get("debut") and g["id"] in firsts: g["debut"] = int(firsts[g["id"]][:4]); g["debut_src"] = "first release on Apple Music"
    if (not g.get("debut") or g["debut"] < 2015) and nkey(g["n"]) not in NAMEDK: drop.add(g["n"])   # named groups are always kept
    elif "gen" not in g: g["gen"] = 3 if g["debut"] < 2018 else 4 if g["debut"] < 2023 else 5
keep = []
for x in d["items"]:
    if x["kind"] == "song": continue
    if x["kind"] == "group" and x["n"] in drop: continue
    if x["kind"] == "idol":
        x["groups"] = [n for n in x.get("groups", []) if n not in drop]
        if not x["groups"]: continue
    keep.append(x)
songs = [s for s in songs if s["by"] not in drop]
d["items"] = keep + songs
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(songs)} songs from {len({s['by'] for s in songs})} groups; dropped {len(drop)} groups without a 2012+ debut: {sorted(drop)[:30]}")
print("by debut generation:", {gen: sum(1 for s in songs if next((g.get('gen') for g in groups if g['n'] == s['by']), None) == gen) for gen in (3, 4, 5)})
