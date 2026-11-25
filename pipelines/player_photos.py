"""
Portraits for the best-known footballers and NBA players that have none yet, from the links ballknowledge's data holds
(EA Sports FC and ESPN). Shown only to identify the player; credited on the answer card. Run:  python3 pipelines/player_photos.py
"""
import concurrent.futures as cf, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B

TOP = 800
def fill(world, kind, links, folder, by, page):
    p = os.path.join(B.ROOT, "packs", world + ".json"); d = json.load(open(p, encoding="utf-8"))
    players = sorted([x for x in d["items"] if x["kind"] == kind], key=lambda x: -x.get("fame", 0))
    if world == "basketball":   # fame is not comparable across eras here: rank by career points
        players = sorted(players, key=lambda x: -(x.get("pts") or 0))
    todo = [x for x in players[:TOP] if not x.get("img") and links.get(x["id"])]
    def one(x):
        rel = f"img/{folder}/{x['id']}.webp"
        return x, rel, B.save_img(links[x["id"]], os.path.join(B.ROOT, rel), keep_alpha=True, size=300)
    done = 0
    with cf.ThreadPoolExecutor(max_workers=4) as pool:
        for x, rel, ok in pool.map(one, todo):
            if ok:
                x["img"] = rel; x["cut"] = 1; x["cr"] = {"img": {"by": by, "lic": "Identification only", "page": page}}; done += 1
                if done % 100 == 0: print(world, done, flush=True)
    json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print(f"{world}: {done} of {len(todo)} portraits added; {sum(1 for x in d['items'] if x['kind'] == kind and x.get('img'))} players now have one", flush=True)

q = json.load(open(os.path.join(B.BK, "02_processed_data/quiz_data.json"), encoding="utf-8"))
fill("football", "player", {"p" + str(p["id"]): p.get("ph") for p in q["players"]}, "football", "EA Sports FC portrait", "https://www.ea.com/games/ea-sports-fc/ratings")
n = json.load(open(os.path.join(B.BK, "02_processed_data/nba_data.json"), encoding="utf-8"))
ids = {x["id"] for x in json.load(open(os.path.join(B.ROOT, "packs", "basketball.json")))["items"] if x["kind"] == "bplayer"}
links = {}
for p in n["players"]:
    for key in (p["id"], "b" + str(p["id"]), "p" + str(p["id"]), "n" + str(p["id"])):
        if key in ids: links[key] = p.get("photo")
fill("basketball", "bplayer", links, "basketball", "ESPN headshot", "https://www.espn.com/nba/")
