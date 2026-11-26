"""
Builds docs/lab/: ballknowledge's own chess screens that the user asked to have here (game review with import from
chess.com, Lichess or PGN, the position games and the World Championship hub), taken from its public build (read only).
    python3 pipelines/chess_lab.py
Run it again after ballknowledge rebuilds its chess page. site/lab/lab.js and lab.css are added on top.
ballknowledge's database settings are removed, so nothing here reads or writes its accounts or leaderboards.
"""
import glob, hashlib, json, os, re, shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BK = os.path.expanduser("~/Desktop/football-prediction-model")
SRC = os.path.join(BK, "docs", "chess")
OUT = os.path.join(ROOT, "docs", "lab")
rd = lambda *p: open(os.path.join(*p), encoding="utf-8").read()


def one(pattern):
    found = glob.glob(os.path.join(SRC, pattern))
    assert len(found) == 1, f"expected one {pattern} in {SRC}, found {len(found)}"
    return os.path.basename(found[0])


def swap(text, old, new, count=1):
    assert text.count(old) >= 1, f"marker not found in ballknowledge's build: {old[:60]!r}"
    return text.replace(old, new, count)


def hashed(stem, text):
    name = f"{stem}.{hashlib.sha1(text.encode()).hexdigest()[:10]}.js"
    open(os.path.join(OUT, name), "w", encoding="utf-8").write(text)
    return name


def main():
    names = {k: one(f"{k}.*.js") for k in ("app", "data", "events")}
    html, app, data, events = rd(SRC, "index.html"), rd(SRC, names["app"]), rd(SRC, names["data"]), rd(SRC, names["events"])

    if os.path.isdir(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, "voice"))
    shutil.copytree(os.path.join(SRC, "img"), os.path.join(OUT, "img"))

    # no ballknowledge database
    data, n = re.subn(r'"board":\{"url":"[^"]*","key":"[^"]*"\}', '"board":null', data)
    assert n == 1 and "supabase.co" not in data, "ballknowledge's database settings are still in the data file"

    # coach clips for the lines these screens can speak
    index = json.loads(rd(BK, "docs", "voice", "index.json"))
    spoken = "\n".join([rd(BK, "site", "coach_lines.js"), rd(BK, "site", "opening_stories.js")]
                       + [l for l in rd(BK, "site", "chess_template.html").splitlines() if re.match(r"^\s+[a-z_]+: \[\"", l)])
    said = set()
    for m in re.finditer(r'"((?:[^"\\\n]|\\.){2,})"', spoken):
        try:
            said.add(json.loads(f'"{m.group(1)}"'))
        except ValueError:
            pass
    said |= {"Fun fact: " + s for s in said} | {"The idea: " + s for s in said}
    keep = {k: f for k, f in index.items() if (k in said or k.split("|", 1)[-1] in said) and os.path.exists(os.path.join(BK, "docs", "voice", f))}
    for f in set(keep.values()):
        shutil.copyfile(os.path.join(BK, "docs", "voice", f), os.path.join(OUT, "voice", f))
    json.dump(keep, open(os.path.join(OUT, "voice", "index.json"), "w"), ensure_ascii=False)

    # the code: our own front door instead of ballknowledge's, no splash
    app = swap(app, 'const BASE = "../voice/";', 'const BASE = "voice/";')
    app = swap(app, "\nhome();\nrunSplash();", "\n" + rd(ROOT, "site", "lab", "lab.js"))
    ev_name = hashed("events", events)
    data = swap(data, names["events"], ev_name)
    app_name, data_name = hashed("app", app), hashed("data", data)

    # the page: no app install, no ballknowledge branding, splash gone, our styles on top
    html = re.sub(r'<link rel="manifest"[^>]*>|<meta name="(?:apple-)?mobile-web-app-capable"[^>]*>|<link rel="apple-touch-icon"[^>]*>', "", html)
    html = re.sub(r'<script>if \("serviceWorker".*?</script>', "", html, flags=re.S)
    html = re.sub(r'<div id="splash".*?Tap to skip</div></div></div>', "", html, flags=re.S)
    html = swap(html, "<title>ballknowledge chess</title>", "<title>ultimateball chess room</title>")
    bar_start, bar_end = html.index('<div class="bar">'), html.index('<main id="app">')
    html = html[:bar_start] + ('<div class="bar"><button class="brand" id="home" type="button"><span id="logo"></span>ultimate<b>ball</b> chess</button>'
                               '<span style="flex:1"></span><button class="pill" id="sndBtn" type="button" aria-label="Sound"></button>'
                               '<span id="thLab" hidden></span><span id="acctBtn" hidden><span id="acctLab"></span></span>'
                               '<span id="compass" hidden></span><button class="pill" id="labClose" type="button">✕ Close</button></div>\n ') + html[bar_end:]
    html = re.sub(r'<div class="foot">.*?</div>', '<div class="foot">Brought over from ballknowledge. Games and puzzles: Lichess (CC0). Player facts: Wikidata; photos: Wikimedia Commons. '
                  'Engine: Stockfish (GPL-3). Not affiliated with Lichess, FIDE or any player.</div>', html, count=1, flags=re.S)
    for k, new in (("app", app_name), ("data", data_name)):
        html = swap(html, names[k], new, 9)
    html = swap(html, "</html>", "<style>" + rd(ROOT, "site", "lab", "lab.css") + "</style></html>")
    assert "supabase.co/" not in html and "lkawhxog" not in html + app + data, "ballknowledge's database address is still there"
    open(os.path.join(OUT, "index.html"), "w", encoding="utf-8").write(html)

    size = sum(os.path.getsize(os.path.join(d, f)) for d, _, fs in os.walk(OUT) for f in fs)
    clips = len(set(keep.values()))
    print(f"docs/lab: {size / 1e6:.1f} MB, {clips} coach clips")


main()
