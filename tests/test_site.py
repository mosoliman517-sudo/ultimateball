"""
Checks that run without a browser. Build first, then:  python3 build.py && python3 -m unittest discover -s tests -v
JavaScript is checked with JavaScriptCore (macOS) or node, whichever is there.
"""
import glob, json, os, re, shutil, subprocess, tempfile, unittest, warnings
warnings.simplefilter("ignore", ResourceWarning)

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
ENGINE = JSC if os.path.exists(JSC) else shutil.which("node")
rd = lambda *p: open(os.path.join(ROOT, *p), encoding="utf-8").read()


def js(source):
    prelude = "if (typeof print === 'undefined') globalThis.print = console.log;\n"
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
        f.write(prelude + source)
    try:
        r = subprocess.run([ENGINE, f.name], capture_output=True, text=True, timeout=120)
        return r.returncode, r.stdout + r.stderr
    finally:
        os.unlink(f.name)


def packs():
    return {os.path.basename(f)[:-5]: json.load(open(f, encoding="utf-8")) for f in glob.glob(os.path.join(ROOT, "packs", "*.json"))
            if not os.path.basename(f).startswith("_") and not f.endswith("_audio.json")}


@unittest.skipUnless(ENGINE, "no JavaScript engine")
class Code(unittest.TestCase):
    def test_page_scripts_compile_together(self):
        """All inline scripts share one scope: a duplicate const in two files breaks the whole page."""
        page = rd("docs", "index.html")
        scripts = re.findall(r"<script>(.*?)</script>", page, re.S)
        self.assertGreater(len(scripts), 3)
        code, out = js("try { new Function(" + json.dumps("\n;\n".join(scripts)) + "); print('ok'); } catch (e) { print('ERR ' + e); }")
        self.assertIn("ok", out, out[-500:])

    def test_untrusted_messages_are_cleaned(self):
        core = rd("site", "bk_core.js")
        start = core.index("const SAFE_URL"); end = core.index("function mqttConnect")
        probe = """var c = cleanData({host: '<img src=x onerror=alert(1)>', q: "a\\"b'c`d", img: 'javascript:alert(1)', cover: 'https://evil.example/a.png',
            logo: 'img/a/b.webp', pv: 'https://audio-ssl.itunes.apple.com/x.m4a', n: 5, list: ['<b>'], constructor: 1});
            print(JSON.stringify(c));"""
        code, out = js(core[start:end] + probe)
        d = json.loads(out.strip().split("\n")[-1])
        self.assertNotIn("<", out); self.assertNotIn('"b', d["q"]); self.assertEqual(d["img"], ""); self.assertEqual(d["cover"], "")
        self.assertEqual(d["logo"], "img/a/b.webp"); self.assertTrue(d["pv"].startswith("https://audio")); self.assertEqual(d["n"], 5); self.assertNotIn("constructor", d)

    def test_every_sidekick_line_has_a_clip(self):
        files = ["mascot_lines.js", "coach_lines.js", "chess_coaches.js", "mascot_art.js", "mascots_worlds.js", "more_lines.js"]
        src = "\n".join(rd("site", f) for f in files)
        kinds = ["welcome", "hit", "bighit", "miss", "streak", "best", "over", "rankup", "achieve", "idle", "tour"]
        src += "\nvar o=[];for(const k in MASCOTS){const L=MASCOTS[k].lines||{};for(const kind of " + json.dumps(kinds) + ")for(const t of (L[kind]||[]))o.push([k,t]);}print(JSON.stringify(o));"
        code, out = js(src)
        lines = json.loads(out.strip().split("\n")[-1])
        def name(who, text):
            h = 0x811c9dc5
            for b in f"{who}|{text}".encode(): h = ((h ^ b) * 0x01000193) & 0xffffffff
            return f"{h:08x}.mp3"
        missing = [(w, t) for w, t in lines if not os.path.exists(os.path.join(ROOT, "docs", "voice", name(w, t)))]
        self.assertEqual(missing[:5], [], f"{len(missing)} lines without a clip: run pipelines/make_voices.py")


class Data(unittest.TestCase):
    def test_ids_unique_and_names_real(self):
        for w, p in packs().items():
            ids = [x["id"] for x in p["items"]]
            self.assertEqual(len(ids), len(set(ids)), f"duplicate ids in {w}")
            bad = [x.get("n") for x in p["items"] if not x.get("n") or re.fullmatch(r"Q\d+", str(x["n"]))]
            self.assertEqual(bad, [], f"unnamed items in {w}")

    def test_picture_files_exist(self):
        for w, p in packs().items():
            missing = [x[k] for x in p["items"] for k in ("img", "logo", "flag") if str(x.get(k, "")).startswith("img/")
                       and not os.path.exists(os.path.join(ROOT, x[k])) and not os.path.exists(os.path.join(ROOT, "docs", x[k]))]
            self.assertEqual(missing[:5], [], f"missing pictures in {w}")

    def test_countries_have_checked_facts(self):
        cs = [x for x in packs()["geography"]["items"] if x["kind"] == "country"]
        self.assertGreaterEqual(len(cs), 197)
        for x in cs:
            for k in ("capital", "language", "currency", "continent"):
                self.assertTrue(x.get(k), f"{x['n']} has no {k}")
        by = {x["n"]: x for x in cs}
        for n in ("China", "Netherlands", "Denmark", "East Timor"):
            self.assertIn(n, by)
        self.assertEqual(by["United States"]["language"], ["English"])
        self.assertEqual(by["France"]["currency"], ["euro"])
        self.assertEqual(by["Bolivia"]["capital"], "Sucre")

    def test_people_have_one_clear_occupation(self):
        by = {x["n"]: x for x in packs()["history"]["items"] if x["kind"] == "person"}
        self.assertEqual(by["Albert Einstein"]["occ"], ["physicist"])
        self.assertTrue(all(len(x.get("occ") or []) == 1 for x in by.values()))

    def test_puzzles(self):
        pz = json.loads(rd("site", "puzzles.json"))
        self.assertGreater(len(pz), 500)
        for fen, moves, rating, theme in pz:
            self.assertEqual(len(fen.split()), 6); self.assertGreaterEqual(len(moves.split()), 2); self.assertTrue(600 <= rating < 2400)


class Deploy(unittest.TestCase):
    def test_built_page(self):
        page = rd("docs", "index.html")
        self.assertTrue(page.lstrip().lower().startswith("<!doctype html>"), "page must not run in quirks mode")
        data = re.search(r'src="(data\.[0-9a-f]+\.js)"', page)
        self.assertTrue(data and os.path.exists(os.path.join(ROOT, "docs", data.group(1))))
        for tag in re.findall(r'<script src="https://[^>]+>', page):
            self.assertIn("integrity=", tag, "third-party script without an integrity hash: " + tag)

    def test_no_private_keys_in_the_page(self):
        page = rd("docs", "index.html")
        self.assertNotRegex(page, r"sb_secret_|service_role|eyJhbGciOi[\w-]{20,}\.[\w-]*c2VydmljZV9yb2xl")

    def test_vercel_config_is_valid(self):
        self.assertIn("headers", json.loads(rd("vercel.json")))


if __name__ == "__main__":
    unittest.main()
