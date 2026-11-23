#!/usr/bin/env python3
"""
K-pop content admin: add or change groups, idols and songs in one place (packs/kpop.json); every game reads from it, so nothing in
the site code changes when a new group or comeback is added. Each admin edit is stamped with source, date and verification status,
validated, and logged to packs/kpop_changes.log.
  python3 pipelines/kpop_admin.py add-group "KATSEYE" --debut 2024 --members 6 --agency "HYBE x Geffen" --fandom "EYEKON" --source URL
  python3 pipelines/kpop_admin.py add-idol "Karina" aespa --role "Leader" --born 2000 --img path/or/url --source URL
  python3 pipelines/kpop_admin.py add-song "Supernova" aespa 2024-05-13 --album "Armageddon" --source URL      (preview and cover are looked up on Apple)
  python3 pipelines/kpop_admin.py set-members aespa 4          python3 pipelines/kpop_admin.py former Karina aespa
  python3 pipelines/kpop_admin.py check-images   (broken and duplicated pictures)      python3 pipelines/kpop_admin.py validate
After editing, rebuild the site:  python3 build.py
"""
import argparse, hashlib, io, json, os, re, subprocess, sys, time
import requests
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
P = os.path.join(ROOT, "packs", "kpop.json")
key = lambda s: re.sub(r"[^a-z0-9]", "", (s or "").lower())
def load(): return json.load(open(P, encoding="utf-8"))
def save(d, msg):
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
    open(os.path.join(ROOT, "packs", "kpop_changes.log"), "a").write(f"{time.strftime('%Y-%m-%d %H:%M')}  {msg}\n"); print("saved:", msg)
def stamp(x, a): x["verification"] = {"status": "verified" if a.source else "unverified", "source": a.source or "", "date": time.strftime("%Y-%m-%d")}
def find_group(d, name): return next((x for x in d["items"] if x["kind"] == "group" and key(x["n"]) == key(name)), None)
def fetch_image(src, rel):
    from PIL import Image
    data = requests.get(src, timeout=60).content if src.startswith("http") else open(src, "rb").read()
    im = Image.open(io.BytesIO(data)).convert("RGB"); im.thumbnail((720, 720)); os.makedirs(os.path.dirname(os.path.join(ROOT, rel)), exist_ok=True)
    im.save(os.path.join(ROOT, rel), "WEBP", quality=84); return rel
ap = argparse.ArgumentParser(); sub = ap.add_subparsers(dest="cmd", required=True)
g = sub.add_parser("add-group"); g.add_argument("name"); g.add_argument("--debut", type=int, required=True); g.add_argument("--members", type=int); g.add_argument("--agency"); g.add_argument("--fandom"); g.add_argument("--status", default="active"); g.add_argument("--source")
i = sub.add_parser("add-idol"); i.add_argument("name"); i.add_argument("group"); i.add_argument("--role"); i.add_argument("--born", type=int); i.add_argument("--img"); i.add_argument("--source")
s = sub.add_parser("add-song"); s.add_argument("title"); s.add_argument("group"); s.add_argument("date"); s.add_argument("--album"); s.add_argument("--source")
m = sub.add_parser("set-members"); m.add_argument("group"); m.add_argument("count", type=int)
f = sub.add_parser("former"); f.add_argument("name"); f.add_argument("group")
sub.add_parser("check-images"); sub.add_parser("validate")
a = ap.parse_args(); d = load(); items = d["items"]
if a.cmd == "add-group":
    if find_group(d, a.name): sys.exit(f"{a.name} already exists")
    x = {"id": "admin-" + key(a.name), "n": a.name, "kind": "group", "fame": 1, "debut": a.debut, "gen": 3 if a.debut < 2018 else 4 if a.debut < 2023 else 5, "labels": [], "members": a.members, "agency": a.agency, "fandom": a.fandom, "status": a.status}
    stamp(x, a); items.append(x); save(d, f"add-group {a.name}")
elif a.cmd == "add-idol":
    gr = find_group(d, a.group) or sys.exit(f"unknown group {a.group}: add it first")
    if any(y["kind"] == "idol" and key(y["n"]) == key(a.name) and gr["n"] in y.get("groups", []) for y in items): sys.exit("already a member")
    x = {"id": f"admin-{key(gr['n'])}-{key(a.name)}", "n": a.name, "kind": "idol", "fame": 1, "groups": [gr["n"]]}
    if a.role: x["role"] = a.role
    if a.born: x["born"] = a.born
    if a.img: x["img"] = fetch_image(a.img, f"img/kpop/{x['id']}_img.webp"); x["cr"] = {"img": {"by": "added by site admin", "lic": "used with the site owner's permission", "page": a.img if a.img.startswith("http") else ""}}
    stamp(x, a); items.append(x); save(d, f"add-idol {a.name} ({gr['n']})")
elif a.cmd == "add-song":
    gr = find_group(d, a.group) or sys.exit(f"unknown group {a.group}")
    r = requests.get("https://itunes.apple.com/search", params={"term": f"{gr['n']} {a.title}", "entity": "song", "limit": 10, "country": "US"}, timeout=30).json().get("results", [])
    hit = next((t for t in r if key(t["trackName"]).startswith(key(a.title)) and key(gr["n"]) in key(t["artistName"]) and t.get("previewUrl")), None)
    x = {"id": "admin-" + key(gr["n"]) + "-" + key(a.title), "n": a.title, "kind": "song", "by": gr["n"], "date": a.date, "year": int(a.date[:4]), "album": a.album or "", "fame": 1}
    if hit: x.update({"pv": hit["previewUrl"], "am": hit.get("trackViewUrl"), "cover": (hit.get("artworkUrl100") or "").replace("100x100bb", "600x600bb")}); x["id"] = "s" + str(hit["trackId"])
    else: print("warning: no Apple preview found, so Listen to the Song will skip this one")
    stamp(x, a); items.append(x); save(d, f"add-song {a.title} ({gr['n']})")
elif a.cmd == "set-members":
    gr = find_group(d, a.group) or sys.exit("unknown group"); gr["members"] = a.count; save(d, f"set-members {gr['n']} {a.count}")
elif a.cmd == "former":
    n = 0
    for y in items:
        if y["kind"] == "idol" and key(y["n"]) == key(a.name) and any(key(q) == key(a.group) for q in y.get("groups", [])): y["drop"] = True; n += 1
    d["items"] = [y for y in items if not y.get("drop")]; items = d["items"]
    save(d, f"former {a.name} ({a.group}): removed x{n}")
elif a.cmd == "check-images":
    seen = {}; bad = 0
    for x in items:
        for k in ("img", "logo", "cover"):
            v = x.get(k)
            if not v or v.startswith("http"): continue
            fp = os.path.join(ROOT, v)
            if not os.path.exists(fp): print("MISSING", x["kind"], x["n"], v); bad += 1; continue
            h = hashlib.md5(open(fp, "rb").read()).hexdigest()
            if h in seen and seen[h][0] != x["n"]: print("DUPLICATE picture:", x["n"], "and", seen[h][0], v); bad += 1
            seen[h] = (x["n"], v)
    print("image check:", "clean" if not bad else f"{bad} problem(s)")
if a.cmd == "validate" or a.cmd in ("add-group", "add-idol", "add-song", "set-members", "former"):
    sys.exit(subprocess.call([sys.executable, os.path.join(ROOT, "pipelines", "kpop_audit.py")]))
