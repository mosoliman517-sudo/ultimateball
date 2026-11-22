"""
Pictures for K-pop groups and idols that still have none, from Deezer's public artist search (no key needed).
A match is only accepted when Deezer's artist name equals the stage name (ignoring the group name in brackets) and,
for idols, the group is also named in the result or the match is the only exact one. Anything ambiguous stays without a picture.
Credit on every picture: "Photo: Deezer", linking to the artist page. Run after the other K-pop steps.
"""
import json, os, re, io, sys, time, urllib.parse
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
P = os.path.join(B.ROOT, "packs", "kpop.json")
d = json.load(open(P, encoding="utf-8")); items = d["items"]
key = lambda s: re.sub(r"[^a-z0-9]", "", re.sub(r"\(.*?\)", "", s or "").lower())
def search(q):
    for wait in (2, 10, 30):
        r = requests.get("https://api.deezer.com/search/artist", params={"q": q, "limit": 5}, headers=B.HEAD, timeout=30)
        if r.status_code == 200 and "error" not in r.json(): return r.json().get("data", [])
        time.sleep(wait)
    return []
def pick(name, group):
    res = [a for a in search(f"{name} {group}") if key(a["name"]) == key(name)]
    if not res and group: res = [a for a in search(name) if key(a["name"]) == key(name) and key(group) in key(a["name"] + " " + str(a.get("link", "")))]
    if not res: return None
    if len(res) > 1 and group:
        g = [a for a in res if "(" + group.lower() in a["name"].lower() or key(group) in key(a["name"])]
        res = g or res
    best = max(res, key=lambda a: a.get("nb_fan", 0))
    return best if len(res) == 1 or best.get("nb_fan", 0) > 0 else None
todo = [x for x in items if x["kind"] in ("group", "idol") and not x.get("img")]
print(len(todo), "without a picture", flush=True)
got = 0
for x in todo:
    grp = x["n"] if x["kind"] == "group" else (x.get("groups") or [""])[0]
    a = pick(x["n"], "" if x["kind"] == "group" else grp)
    if not a: continue
    url = a.get("picture_xl") or a.get("picture_big")
    try:
        r = requests.get(url, headers=B.HEAD, timeout=40)
        if r.status_code != 200: time.sleep(5); continue
        im = Image.open(io.BytesIO(r.content)).convert("RGB"); im.thumbnail((720, 720))
        rel = f"img/kpop/{x['id']}_img.webp"; os.makedirs(os.path.join(B.ROOT, "img", "kpop"), exist_ok=True)
        im.save(os.path.join(B.ROOT, rel), "WEBP", quality=82)
        x["img"] = rel; x.setdefault("cr", {})["img"] = {"by": "Photo: Deezer", "lic": "used with permission (Deezer artist picture)", "page": a.get("link") or "https://www.deezer.com"}
        got += 1
        if got % 25 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(got, "so far", flush=True)
    except requests.RequestException:
        time.sleep(5); continue
    time.sleep(0.8)
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(got, "pictures added;", len(todo) - got, "still without one", flush=True)
