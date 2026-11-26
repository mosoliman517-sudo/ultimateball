"""
Builds the games site into docs/index.html (+ docs/img/), from site/template.html, ballknowledge's CSS/JS (copied into site/),
the new app code and the packs in packs/. The football section's lobby music gets one theme per world here.
Run:  python3 build.py
"""
import json, os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(ROOT, p), encoding="utf-8").read()

# lobby and game music per world, in the format of ballknowledge's LOBBY / GAME presets (chords, pentatonic notes, motif, tempo)
THEMES = {
    "kpop": {"lobby": {"bpm": 104, "chords": [[48, 55, 60, 64], [45, 52, 57, 64], [41, 48, 57, 60], [43, 50, 55, 62]], "pent": [72, 74, 76, 79, 81, 84], "motif": [79, 81, 84, 81, 79, 76, 79, 81]},
             "game": {"bpm": 122, "chords": [[45, 52, 57, 60], [41, 48, 53, 57], [48, 55, 60, 64], [43, 50, 55, 59]], "pent": [69, 72, 74, 76, 79, 81], "motif": [76, 79, 81, 84, 81, 79, 76, 74]}},
    "geography": {"lobby": {"bpm": 76, "chords": [[50, 57, 62, 66], [52, 59, 64, 68], [47, 54, 59, 62], [45, 52, 57, 61]], "pent": [74, 76, 78, 81, 83, 86], "motif": [78, 81, 83, 81, 78, 76, 74, 76]},
                  "game": {"bpm": 96, "chords": [[50, 57, 62, 66], [47, 54, 59, 62], [43, 50, 55, 59], [45, 52, 57, 61]], "pent": [74, 76, 78, 81, 83, 86], "motif": [74, 78, 81, 78, 76, 74, 71, 74]}},
    "history": {"lobby": {"bpm": 66, "chords": [[45, 52, 57, 60], [50, 57, 62, 65], [44, 52, 56, 59], [45, 52, 57, 61]], "pent": [69, 71, 72, 74, 76, 77], "motif": [69, 72, 76, 74, 72, 71, 72, 69]},
                "game": {"bpm": 92, "chords": [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [44, 52, 56, 59]], "pent": [69, 71, 72, 74, 76, 77], "motif": [76, 74, 72, 71, 72, 74, 71, 68]}},
    "food": {"lobby": {"bpm": 84, "chords": [[48, 52, 55, 59], [50, 53, 57, 60], [43, 47, 50, 53], [48, 52, 55, 59]], "pent": [72, 74, 76, 79, 81, 83], "motif": [76, 79, 81, 83, 81, 79, 76, 74]},
             "game": {"bpm": 104, "chords": [[48, 52, 55, 59], [45, 48, 52, 55], [50, 53, 57, 60], [43, 47, 50, 53]], "pent": [72, 74, 75, 77, 79, 82], "motif": [72, 75, 77, 79, 77, 75, 72, 70]}},
}
core = rd("site/bk_core.js")
core = core.replace("const LOBBY = {", "let LOBBY = {", 1).replace("const GAME = {", "let GAME = {", 1)
core = core.replace("  return {\n    get level()", "  const THEMES = " + json.dumps(THEMES) + ", BASE = { lobby: LOBBY, game: GAME };\n  function theme(w) { const t = THEMES[w] || BASE; LOBBY = t.lobby; GAME = t.game; }\n  return {\n    theme,\n    get level()", 1)
core = core.replace("const SCALES = {", "const SCALES = { kpop: [0, 2, 4, 7, 9], geography: [0, 2, 4, 6, 7, 9, 11], history: [0, 2, 3, 5, 7, 8, 10], food: [0, 2, 4, 5, 7, 9, 10], football: [0, 2, 4, 7, 9], mix: [0, 2, 4, 7, 9], HOME: [0, 2, 4, 7, 9], ", 1)
assert "theme," in core and "let LOBBY" in core, "music patch failed"

packs = {}
for f in sorted(os.listdir(os.path.join(ROOT, "packs"))):
    if f.endswith(".json") and not f.endswith("_audio.json") and not f.startswith("_"):
        try:
            packs[f[:-5]] = json.load(open(os.path.join(ROOT, "packs", f), encoding="utf-8"))
        except ValueError:
            print("skipped unfinished pack", f)
au = os.path.join(ROOT, "packs", "kpop_audio.json")
if "kpop" in packs and os.path.exists(au):
    A = json.load(open(au))
    for x in packs["kpop"]["items"]:
        if A.get(x["id"]):
            x["pv"], x["am"] = A[x["id"]]["pv"], A[x["id"]]["url"]
# pictures taken down on request (site/removed.json): strip them from the data here, and from the built folder below
gone = json.loads(rd("site/removed.json"))
gone_files = set(gone.get("files", []))
for p in packs.values():
    for x in p["items"]:
        if x["id"] in set(gone.get("ids", [])):
            gone_files.update(x[k] for k in ("img", "logo", "flag") if str(x.get(k, "")).startswith("img/"))
            for k in ("img", "logo", "flag", "cover", "cut", "cr"): x.pop(k, None)
        for k in ("img", "logo", "flag"):
            if x.get(k) in gone_files: x.pop(k)
html = rd("site/template.html")
for k, v in {"/*FONTS*/": rd("site/fonts.html"), "/*BASE_CSS*/": rd("site/base.css"), "/*EXTRA_CSS*/": rd("site/extra.css") + "\n" + rd("site/chess.css"), "/*SPRITE*/": rd("site/sprite.html"),
             "/*PACKS*/{}": json.dumps(packs, ensure_ascii=False, separators=(",", ":")) + ";window.PUZZLES=" + rd("site/puzzles.json") + ";window.HISTORY=" + rd("site/bk_history.json"), "/*CORE*/": core,
             "/*MASCOTS*/": rd("site/mascot_lines.js") + "\n" + rd("site/coach_lines.js") + "\n" + rd("site/chess_coaches.js") + "\n" + rd("site/mascot_art.js") + "\n" + rd("site/mascots_worlds.js") + "\n" + rd("site/more_lines.js") + "\n" + rd("site/more_lines2.js") + "\n" + rd("site/bk_lines.js") + "\n" + rd("site/more_lines3.js") + "\n" + rd("site/group_lines.js") + "\n" + rd("site/voice.js"), "/*APP*/": rd("site/app.js") + "\n" + rd("site/social.js") + "\n" + rd("site/bk_bots.js") + "\n" + rd("site/chessplay.js") + "\n" + rd("site/chess_card.js") + "\n" + rd("site/history_games.js") + "\n" + rd("site/extras.js") + "\n" + rd("site/gamefx.js") + "\n" + rd("site/missions.js") + "\n" + rd("site/fits_tour.js") + "\n" + rd("site/chess_train.js") + "\n" + rd("site/online_extras.js") + "\n" + rd("site/prefs.js") + "\n" + rd("site/settings_swipe.js") + "\n" + rd("site/redo.js") + "\n" + rd("site/credits.js") + "\n" + rd("site/chatter.js") + "\n" + rd("site/modes.js") + "\n" + rd("site/party.js") + "\n" + rd("site/i18n.js")}.items():
    html = html.replace(k, v, 1)
out = os.path.join(ROOT, "docs")
os.makedirs(out, exist_ok=True)
# the public site: the game data goes in its own file named by its content, so an ordinary update does not re-download it
import hashlib, glob as _glob
start = html.index("window.PACKS = "); end = html.index("\n</script>", start)
data = html[start:end]
dname = "data." + hashlib.sha1(data.encode()).hexdigest()[:10] + ".js"
for old in _glob.glob(os.path.join(out, "data.*.js")): os.remove(old)
open(os.path.join(out, dname), "w", encoding="utf-8").write(data + "\n")
page = html[:start] + "\n</script>\n<script src=\"" + dname + "\"></script>\n<script>\nif (!window.PACKS) document.body.innerHTML = '<p style=\"padding:24px;font:16px system-ui\">The game data did not load. Check your connection and <a href=\"\">reload</a>.</p>';" + html[end:]
open(os.path.join(out, "index.html"), "w", encoding="utf-8").write(page)
if os.path.isdir(os.path.join(out, "img")):
    shutil.rmtree(os.path.join(out, "img"))
shutil.copytree(os.path.join(ROOT, "img"), os.path.join(out, "img"))
for f in gone_files:
    p = os.path.join(out, f)
    if os.path.isfile(p): os.remove(p)
shutil.rmtree(os.path.join(out, "engine"), ignore_errors=True); shutil.copytree(os.path.join(ROOT, "site", "engine"), os.path.join(out, "engine"))   # Stockfish (GPL-3, licence inside)
os.makedirs(os.path.join(out, "img"), exist_ok=True)
for f in os.listdir(os.path.join(ROOT, "site", "pwa")): shutil.copy(os.path.join(ROOT, "site", "pwa", f), os.path.join(out, f))   # install as an app
n = sum(len(fs) for _, _, fs in os.walk(os.path.join(out, "img")))
print(f"docs/index.html {len(page) // 1024} KB + {dname} {len(data) // 1024} KB, {len(packs)} worlds ({', '.join(f'{w} {len(p['items'])}' for w, p in packs.items())}), {n} images")

# Artifact build: the artifact allows few files, so each category's pictures go into one script of data URIs (docs_art/img_<world>.js)
import base64, sys
if "--artifact" in sys.argv:
    art = os.path.join(ROOT, "docs_art"); shutil.rmtree(art, ignore_errors=True); os.makedirs(art)
    tags = []
    for w in packs:
        d = {}
        for x in packs[w]["items"]:
            for k in ("img", "logo", "flag"):
                if x.get(k) and x[k] not in d and os.path.exists(os.path.join(ROOT, x[k])):
                    d[x[k]] = "data:image/webp;base64," + base64.b64encode(open(os.path.join(ROOT, x[k]), "rb").read()).decode()
        js = "window.IMGDATA=window.IMGDATA||{};Object.assign(IMGDATA," + json.dumps(d, separators=(",", ":")) + ");"
        open(os.path.join(art, f"img_{w}.js"), "w").write(js); tags.append(f'<script src="img_{w}.js"></script>')
        print(f"  img_{w}.js {len(js) // 1024} KB, {len(d)} pictures")
    a = html.replace('<script>\nconst $ = (s, r = document)', "\n".join(tags) + '\n<script>\nconst $ = (s, r = document)', 1)
    a = a.replace("window.PACKS = ", "window.ARTIFACT = true; window.PACKS = ", 1)
    open(os.path.join(art, "index.html"), "w", encoding="utf-8").write(a)
    print("docs_art/index.html", len(a) // 1024, "KB")
