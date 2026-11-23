"""
Picture integrity for the K-pop data. Removes pictures that cannot be trusted, so an idol shows an honest placeholder instead of a wrong face:
  - one picture file shared by different people (Deezer's generic "no picture" image, a group photo used as a member's portrait);
  - a picture whose file is missing or unreadable, or too small to be a portrait (under 120 px).
Run it after any step that adds pictures, then re-run the photo steps for whoever lost one:  python3 pipelines/kpop_images_fix.py
"""
import hashlib, json, os, collections
from PIL import Image
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
by = collections.defaultdict(list); removed = []
def drop(x, why): removed.append(f"{x['kind']} {x['n']}: {why}"); x.pop("img", None); (x.get("cr") or {}).pop("img", None)
for x in items:
    v = x.get("img")
    if not v or v.startswith("http"): continue
    fp = os.path.join(ROOT, v)
    try:
        im = Image.open(fp); im.verify()
        if min(Image.open(fp).size) < 120: drop(x, "too small"); continue
    except Exception: drop(x, "unreadable or missing"); continue
    by[hashlib.md5(open(fp, "rb").read()).hexdigest()].append(x)
for h, xs in by.items():
    names = {(x["kind"], x["n"]) for x in xs}
    if len(names) < 2: continue
    groups = [x for x in xs if x["kind"] == "group"]; idols = [x for x in xs if x["kind"] == "idol"]
    if groups and idols and len({x["n"] for x in groups}) == 1 and all(x.get("groups") and groups[0]["n"] in x["groups"] for x in idols):
        for x in idols: drop(x, "a group photo, not this member's portrait")       # keep the group's own picture
    else:
        for x in xs: drop(x, f"one picture shared by {len(names)} different people (a placeholder or a wrong match)")
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"removed {len(removed)} untrustworthy pictures"); [print("  -", r) for r in removed]
