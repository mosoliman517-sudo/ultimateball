"""
Expressive Chatterbox takes for every ultimateball sidekick line that does not have one yet, replacing the quick Kokoro clip in
docs/voice/ one file at a time. It QUEUES behind ballknowledge's own Chatterbox job: it waits while that is running, so the two
never share the GPU. Resumable. Progress goes to voice_cb_status.json, which ballknowledge's voice stats page shows.

Start (keeps the Mac awake, survives closing the terminal):
  cd ~/games-platform && nohup caffeinate -i ~/Desktop/football-prediction-model/.venv-cb/bin/python -u pipelines/make_voices_cb.py > voice_cb.log 2>&1 &
Stop:   pkill -f make_voices_cb.py          Gentler on the Mac:  add  --rest 15
When it has made some, publish them:  git add docs/voice voice_cb_done.json && git commit -m "Chatterbox takes" && git push
"""
import json, os, re, subprocess, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".."))
BK = os.path.expanduser("~/Desktop/football-prediction-model")
OUT, DONE, STATUS, REF = (os.path.join(ROOT, p) for p in ("docs/voice", "voice_cb_done.json", "voice_cb_status.json", "voice_ref"))
# who first (the sidekicks heard most), then which moments first
ORDER = ["bongi", "neko", "mic", "pocha", "bench", "boot", "rim", "pip", "pin", "tock", "dumpling", "dogear", "rita", "clock", "sneak", "vera", "bea"]
FIRST = ["welcome", "hit", "miss", "bighit", "streak", "best", "over", "g_audio", "g_photo", "g_hol", "duo_start", "duo_point", "duo_end", "achieve", "rankup", "idle", "tour"]
STYLE = {"boot": 0.55, "rita": 0.4, "bench": 0.75, "rim": 0.55, "clock": 0.8, "sneak": 0.9, "pip": 0.6, "vera": 0.55, "bea": 0.4,
         "bongi": 0.85, "mic": 0.85, "pocha": 0.55, "neko": 0.9, "pin": 0.45, "tock": 0.4, "dumpling": 0.55, "dogear": 0.4}
HYPE_PREFIX = ("grp_", "idl_")
HYPE = {"bighit", "streak", "best", "rankup", "duo_point", "ch_win"}
CALM = {"over", "idle", "night", "tour", "ch_loss", "ch_draw"}

def all_lines():
    src = open(os.path.join(ROOT, "pipelines", "make_voices.py"), encoding="utf-8").read().replace("\nmain()\n", "\n")
    ns = {"__file__": os.path.join(ROOT, "pipelines", "make_voices.py"), "__name__": "lines"}
    exec(src, ns)
    import tempfile
    js = "\n".join(open(os.path.join(ROOT, "site", f), encoding="utf-8").read() for f in ns["FILES"])
    js += "\nvar o=[];for(const k in MASCOTS){const L=MASCOTS[k].lines||{};for(const kind of " + json.dumps(ns["KINDS"]) + ".concat(Object.keys(L).filter(x=>/^(grp|idl)_/.test(x))))for(const t of (L[kind]||[]))o.push([k,MASCOTS[k].voice,t,kind]);}print(JSON.stringify(o));"
    with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f: f.write(js)
    rows = json.loads(subprocess.run([ns["JSC"], f.name], capture_output=True, text=True, check=True).stdout); os.unlink(f.name)
    seen, out = set(), []
    for who, voice, text, kind in rows:
        if (who, text) not in seen: seen.add((who, text)); out.append((who, voice, text, kind, ns["name"](who, text)))
    return out

def done_set(lines):
    done = set(json.load(open(DONE))) if os.path.exists(DONE) else set()
    bk = json.load(open(os.path.join(BK, "docs/voice/index.json"), encoding="utf-8"))   # lines already copied from ballknowledge's Chatterbox takes
    for who, voice, text, kind, name in lines:
        if str(bk.get(f"{voice}|{text}", "")).startswith("cb_"): done.add(name)
    return done

def status(state, lines, done, extra=None):
    per = {}
    for who, voice, text, kind, name in lines:
        a = per.setdefault(who, [0, 0]); a[1] += 1; a[0] += name in done
    data = {"state": state, "total": len(lines), "done": sum(n in done for *_, n in lines), "chars": per, "at": time.time(), **(extra or {})}
    json.dump(data, open(STATUS + ".part", "w")); os.replace(STATUS + ".part", STATUS)

def ballknowledge_running():
    return subprocess.run(["pgrep", "-f", "83_make_voice_cb.py"], capture_output=True).returncode == 0

def main():
    lines = all_lines(); done = done_set(lines)
    todo = [x for x in lines if x[4] not in done]
    todo.sort(key=lambda x: (ORDER.index(x[0]) if x[0] in ORDER else 99, FIRST.index(x[3]) if x[3] in FIRST else 99))
    print(f"{len(lines)} lines, {len(todo)} to make", flush=True)
    if "--status-only" in sys.argv: status("queued", lines, done); return
    while ballknowledge_running():
        status("queued", lines, done, {"waiting": "ballknowledge's job"}); time.sleep(120)
    import soundfile as sf, torch
    from chatterbox.tts import ChatterboxTTS
    dev = "mps" if torch.backends.mps.is_available() else "cpu"
    model = ChatterboxTTS.from_pretrained(device=dev)
    rest = float(sys.argv[sys.argv.index("--rest") + 1]) if "--rest" in sys.argv else 0
    t0, made, recent = time.time(), 0, []
    for who, voice, text, kind, name in todo:
        while ballknowledge_running():    # their job was started again: step aside
            status("queued", lines, done, {"waiting": "ballknowledge's job"}); time.sleep(120)
        ref = next((p for p in (os.path.join(BK, "01_data_tts/ref", voice + ".wav"), os.path.join(REF, voice + ".wav")) if os.path.exists(p)), None)
        ex = STYLE.get(who, 0.5) + (0.15 if kind in HYPE or kind.startswith(HYPE_PREFIX) else -0.1 if kind in CALM else 0)
        try:
            wav = model.generate(re.sub(r"\*", "", text), audio_prompt_path=ref, exaggeration=max(0.25, min(1.0, ex)), cfg_weight=0.3 if kind in CALM else 0.45)
            dst = os.path.join(OUT, name)
            sf.write(dst + ".part", wav.squeeze(0).cpu().numpy(), model.sr, format="MP3"); os.replace(dst + ".part", dst)
            del wav
            if dev == "mps": torch.mps.empty_cache()      # memory creeps up over a long run
        except Exception as e:
            print("  failed:", who, text[:60], e, flush=True)
            if "out of memory" in str(e):    # every later line would fail too: start afresh, finished lines are kept
                status("queued", lines, done, {"waiting": "memory to free up"}); time.sleep(120); os.execv(sys.executable, [sys.executable, "-u"] + sys.argv)
            continue
        done.add(name); made += 1; recent = ([f"{who}: {text}"] + recent)[:6]
        json.dump(sorted(done), open(DONE, "w"))
        per = (time.time() - t0) / made
        status("recording", lines, done, {"perLine": per, "eta": per * (len(todo) - made), "recent": recent})
        if made % 10 == 0: print(f"  {made}/{len(todo)}  {per:.1f}s a line, about {per * (len(todo) - made) / 60:.0f} min left", flush=True)
        if rest: time.sleep(rest)
    status("finished", lines, done); print("done", flush=True)

main()
