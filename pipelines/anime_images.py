"""
Pictures for anime series (cover art) and characters (portraits) from AniList's public GraphQL API (no key). Used with the site owner's
permission; every picture is credited to AniList. A series is matched on its title (romaji or English) and start year (within a year);
a character on its name AND on being listed in the same series. Anything not matched confidently stays without a picture.
Run after build_packs.py anime and anime_characters.py:  python3 pipelines/anime_images.py
"""
import json, os, re, sys, time, io
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
P = os.path.join(B.ROOT, "packs", "anime.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
key = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
URL = "https://graphql.anilist.co"
def q(query, variables):
    for wait in (2, 15, 45):
        try:
            r = requests.post(URL, json={"query": query, "variables": variables}, headers=B.HEAD, timeout=40)
            if r.status_code == 200: return r.json().get("data") or {}
            if r.status_code == 429: time.sleep(int(r.headers.get("Retry-After", 30)))
        except requests.RequestException: pass
        time.sleep(wait)
    return {}
def save(url, rel):
    r = requests.get(url, headers=B.HEAD, timeout=60)
    if r.status_code != 200: return False
    im = Image.open(io.BytesIO(r.content)).convert("RGB"); im.thumbnail((600, 800))
    os.makedirs(os.path.join(B.ROOT, os.path.dirname(rel)), exist_ok=True); im.save(os.path.join(B.ROOT, rel), "WEBP", quality=82); return True
got = 0
for x in [y for y in items if y["kind"] == "anime" and not y.get("img")]:
    data = q("query($s:String){ Page(perPage:6){ media(search:$s, type:ANIME){ id siteUrl startDate{year} title{romaji english} coverImage{extraLarge large} } } }", {"s": x["n"]})
    for m in (data.get("Page") or {}).get("media", []):
        ts = {key(m["title"].get("romaji")), key(m["title"].get("english"))} - {""}
        yr = (m.get("startDate") or {}).get("year")
        if key(x["n"]) in ts and (not x.get("year") or not yr or abs(yr - x["year"]) <= 1):
            url = (m["coverImage"] or {}).get("extraLarge") or (m["coverImage"] or {}).get("large")
            if url and save(url, f"img/anime/{x['id']}_img.webp"):
                x["img"] = f"img/anime/{x['id']}_img.webp"; x.setdefault("cr", {})["img"] = {"by": "AniList cover art", "lic": "used with the site owner's permission", "page": m["siteUrl"]}; got += 1; break
    time.sleep(0.9)
    if got and got % 20 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(got, "series pictures so far", flush=True)
print(got, "series pictures", flush=True); cgot = 0
series = {y["n"]: key(y["n"]) for y in items if y["kind"] == "anime"}
for x in [y for y in items if y["kind"] == "character" and not y.get("img")]:
    data = q("query($s:String){ Page(perPage:6){ characters(search:$s){ name{full} siteUrl image{large} media(perPage:8){ nodes{ title{romaji english} } } } } }", {"s": x["n"]})
    for c in (data.get("Page") or {}).get("characters", []):
        shows = {key(t) for n in c["media"]["nodes"] for t in (n["title"].get("romaji"), n["title"].get("english")) if t}
        if key(c["name"]["full"]) == key(x["n"]) or key(x["n"]) in key(c["name"]["full"]):
            ak = series.get(x.get("anime")) or key(x.get("anime"))
            if any(ak and (ak in s or s in ak) for s in shows) and c["image"]["large"] and "default" not in c["image"]["large"]:
                if save(c["image"]["large"], f"img/anime/{x['id']}_img.webp"):
                    x["img"] = f"img/anime/{x['id']}_img.webp"; x.setdefault("cr", {})["img"] = {"by": "AniList character art", "lic": "used with the site owner's permission", "page": c["siteUrl"]}; cgot += 1; break
    time.sleep(0.9)
    if cgot and cgot % 20 == 0: json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); print(cgot, "character pictures so far", flush=True)
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(cgot, "character pictures;", sum(1 for y in items if y["kind"] == "anime" and not y.get("img")), "series and", sum(1 for y in items if y["kind"] == "character" and not y.get("img")), "characters still without one", flush=True)
