"""
Records every sidekick line with Kokoro-82M (the same engine ballknowledge uses), each sidekick in their own voice, into
docs/voice/<hash>.mp3. The hash is of "sidekick|line" and the page computes the same one (site/voice.js).
Lines ballknowledge already recorded in the same voice are copied instead of recorded again.
Run after changing any line:
  ~/Desktop/football-prediction-model/.venv-tts/bin/python pipelines/make_voices.py
Needs ballknowledge's model files in ~/Desktop/football-prediction-model/01_data_tts/ (kokoro-v1.0.int8.onnx, voices-v1.0.bin).
Add --check to only report missing clips.
"""
import json, os, re, shutil, subprocess, sys, tempfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BK = os.path.expanduser("~/Desktop/football-prediction-model")
OUT = os.path.join(ROOT, "docs", "voice")
JSC = "/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc"
FILES = ["mascot_lines.js", "coach_lines.js", "chess_coaches.js", "mascot_art.js", "mascots_worlds.js", "more_lines.js"]
SPEED = {"bongi": 1.1, "mic": 1.12, "neko": 1.12, "sneak": 1.1, "clock": 1.12, "tock": 0.88, "pin": 0.95, "bea": 0.95, "vera": 0.95}
KINDS = ["welcome", "hit", "bighit", "miss", "streak", "best", "over", "rankup", "achieve", "idle", "tour"]   # the moments the site speaks at

def lines():
    src = "\n".join(open(os.path.join(ROOT, "site", f), encoding="utf-8").read() for f in FILES)
    src += "\nvar o=[];for(const k in MASCOTS){const L=MASCOTS[k].lines||{};for(const kind of " + json.dumps(KINDS) + ")for(const t of (L[kind]||[]))o.push([k,MASCOTS[k].voice,t]);}print(JSON.stringify(o));"
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f: f.write(src)
    out = subprocess.run([JSC, f.name], capture_output=True, text=True, check=True).stdout; os.unlink(f.name)
    return list({(k, t): (k, v, t) for k, v, t in json.loads(out)}.values())

def name(who, text):
    h = 0x811c9dc5
    for b in f"{who}|{text}".encode(): h = ((h ^ b) * 0x01000193) & 0xffffffff
    return f"{h:08x}.mp3"

def main():
    os.makedirs(OUT, exist_ok=True)
    jobs = lines(); names = [name(k, t) for k, _, t in jobs]
    assert len(set(names)) == len(names), "two lines hash to the same file name"
    for f in os.listdir(OUT):
        if f not in set(names): os.remove(os.path.join(OUT, f))     # lines that no longer exist
    bk = {}
    p = os.path.join(BK, "docs", "voice", "index.json")
    if os.path.exists(p): bk = json.load(open(p, encoding="utf-8"))
    todo, copied = [], 0
    for who, voice, text in jobs:
        dst = os.path.join(OUT, name(who, text))
        if os.path.exists(dst): continue
        old = bk.get(f"{voice}|{text}") or (bk.get(text) if voice == "af_heart" else None)
        src = old and os.path.join(BK, "docs", "voice", old)
        if src and os.path.exists(src) and "--check" not in sys.argv: shutil.copy(src, dst); copied += 1
        else: todo.append((who, voice, text, dst))
    print(f"{len(jobs)} lines, {copied} copied from ballknowledge, {len(todo)} to record", flush=True)
    if "--check" in sys.argv or not todo: return
    import onnxruntime as rt, soundfile as sf
    from kokoro_onnx import Kokoro
    o = rt.SessionOptions(); o.intra_op_num_threads = 4     # leaves the Mac cool and usable
    k = Kokoro.from_session(rt.InferenceSession(os.path.join(BK, "01_data_tts", "kokoro-v1.0.int8.onnx"), o, providers=["CPUExecutionProvider"]), os.path.join(BK, "01_data_tts", "voices-v1.0.bin"))
    for i, (who, voice, text, dst) in enumerate(todo):
        say = re.sub(r"\*", "", text)
        samples, sr = k.create(say, voice=voice, speed=SPEED.get(who, 1.05), lang="en-gb" if voice.startswith("b") else "en-us")
        sf.write(dst + ".part", samples, sr, format="MP3"); os.replace(dst + ".part", dst)
        if i % 50 == 0: print(f"{i}/{len(todo)}", flush=True)
    print("done", len(todo), flush=True)

main()
