"""
Finds Apple's free 30-second preview for each K-pop song in packs/kpop.json (iTunes Search API, no key).
A preview is kept only when Apple's artist name matches the group and the track title matches the song, so a cover or a
namesake never slips in. Songs without a match simply have no audio. The site links every preview back to Apple Music.
Output: packs/kpop_audio.json  {song id: {"pv": preview url, "url": Apple Music link}}
Run (after build_packs.py kpop):  python3 pipelines/song_previews.py
"""
import json, os, re, time, unicodedata
import requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower())
while not os.path.exists(os.path.join(ROOT, "packs/kpop.json")):
    time.sleep(20)
songs = sorted([x for x in json.load(open(os.path.join(ROOT, "packs/kpop.json")))["items"] if x["kind"] == "song"], key=lambda x: -x["fame"])
out_p = os.path.join(ROOT, "packs/kpop_audio.json")
out = json.load(open(out_p)) if os.path.exists(out_p) else {}
for k, s in enumerate(songs):
    if s["id"] in out:
        continue
    try:
        r = requests.get("https://itunes.apple.com/search", params={"term": f"{s['by']} {s['n']}", "entity": "song", "limit": 10, "country": "US"}, timeout=30).json()
    except Exception as e:
        print("failed", s["n"], e); time.sleep(10); continue
    hit = None
    for t in r.get("results", []):
        a, n = norm(t.get("artistName")), norm(t.get("trackName"))
        if norm(s["by"]) and (norm(s["by"]) in a or a in norm(s["by"])) and n.startswith(norm(s["n"])) and t.get("previewUrl"):
            hit = t; break
    out[s["id"]] = {"pv": hit["previewUrl"], "url": hit.get("trackViewUrl")} if hit else None
    if k % 20 == 0:
        json.dump(out, open(out_p, "w")); print(k, "done,", sum(1 for v in out.values() if v), "with audio")
    time.sleep(3.2)   # Apple asks for about 20 calls a minute
json.dump(out, open(out_p, "w"))
print("total", len(out), "with audio", sum(1 for v in out.values() if v))
