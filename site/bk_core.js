/* Copied from ballknowledge (site/arena_template.html) unchanged unless marked: sound, effects, toasts, finale, name matching, MQTT rooms. */
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const hash = (s) => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0; return h; };
/* ---------- sound: small synthesised palette, three levels ---------- */
const Snd = (() => {
  let ctx = null, master = null, level = 1;           // 0 off, 1 soft, 2 full
  try { const v = localStorage.getItem("arena-sound"); if (v != null) level = +v; } catch (e) { /* storage unavailable */ }
  const gainFor = () => [0, 0.5, 1][level] * (window.MIXFX == null ? 1 : window.MIXFX);
  function init() {
    if (ctx) { if (ctx.state === "suspended") ctx.resume(); return true; }
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      master = ctx.createGain(); master.gain.value = gainFor();
      const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 6500;
      const delay = ctx.createDelay(); delay.delayTime.value = 0.19; const fb = ctx.createGain(); fb.gain.value = 0.28; const wet = ctx.createGain(); wet.gain.value = 0.22;
      master.connect(lp); lp.connect(ctx.destination); lp.connect(delay); delay.connect(fb); fb.connect(delay); delay.connect(wet); wet.connect(ctx.destination);
      return true;
    } catch (e) { return false; }
  }
  const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
  function note(n, t0, dur, type = "sine", vol = 0.09, glide = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(midi(n), t0);
    if (glide) o.frequency.exponentialRampToValueAtTime(midi(n + glide), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  function noise(t0, dur, f0, f1, vol = 0.05, q = 1.2) {
    const len = Math.floor(ctx.sampleRate * dur), buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const s = ctx.createBufferSource(); s.buffer = buf; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t0); f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t0);
  }
  const SCALES = { E0: [0, 2, 4, 6, 7, 9, 11], D1: [0, 3, 5, 7, 10], SP1: [0, 1, 4, 5, 7, 8, 10], I1: [0, 2, 4, 5, 7, 9, 11], F1: [0, 2, 3, 5, 7, 9, 10], ALL: [0, 2, 4, 7, 9] };
  const ROOT = { E0: 60, D1: 57, SP1: 62, I1: 65, F1: 59, ALL: 64 }, WAVE = { E0: "sine", D1: "triangle", SP1: "triangle", I1: "sine", F1: "sine", ALL: "sine" };
  const run = (fn) => { if (level === 0 || !init()) return; fn(ctx.currentTime + 0.01); };
  /* Generative background music: calm lobby loop and a slightly more driven game loop. Nothing is downloaded; it is played live. */
  let mus = 1, mg = null, mode = "lobby", want = "lobby", timer = null, nextT = 0, step = 0, pend = null;
  try { const v = localStorage.getItem("arena-music"); if (v != null) mus = +v; } catch (e) { /* storage unavailable */ }
  const LOBBY = { bpm: 68, chords: [[48, 55, 59, 64], [45, 52, 60, 64], [41, 48, 57, 64], [43, 50, 59, 62]], pent: [72, 74, 76, 79, 81, 84], motif: [76, 79, 81, 79, 76, 74, 72, 74] };
  const GAME = { bpm: 88, chords: [[45, 52, 57, 60], [41, 48, 55, 57], [48, 55, 60, 64], [43, 50, 55, 59]], pent: [69, 72, 74, 76, 79, 81], motif: [69, 72, 76, 72, 74, 72, 69, 67] };
  function mnote(n, t0, dur, type, vol, att) { const o = ctx.createOscillator(), g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(midi(n), t0); g.gain.setValueAtTime(0.0001, t0); g.gain.linearRampToValueAtTime(vol, t0 + (att || 0.01)); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(mg); o.start(t0); o.stop(t0 + dur + 0.05); }
  function mkick(t0, vol) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(110, t0); o.frequency.exponentialRampToValueAtTime(42, t0 + 0.14); g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.2); o.connect(g); g.connect(mg); o.start(t0); o.stop(t0 + 0.25); }
  function mhat(t0, vol) { const len = Math.floor(ctx.sampleRate * 0.05), b = ctx.createBuffer(1, len, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len); const s = ctx.createBufferSource(); s.buffer = b; const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 6500; const g = ctx.createGain(); g.gain.value = vol; s.connect(f); f.connect(g); g.connect(mg); s.start(t0); }
  function bar(m, bi, t0, spb) {
    const P = m === "game" ? GAME : LOBBY, ch = P.chords[bi % 4], beat = spb, game = m === "game";
    if (!game) ch.slice(1).forEach((n, i) => mnote(n + 12, t0 + i * 0.03, beat * 4.2, "sine", 0.022, 1.1));
    else ch.slice(1).forEach((n) => mnote(n, t0, beat * 1.9, "triangle", 0.012, 0.05));
    mnote(ch[0] - 12, t0, beat * (game ? 1.6 : 3.4), "sine", game ? 0.07 : 0.06, 0.03);
    if (game) { mnote(ch[0] - 12, t0 + beat * 2.5, beat * 0.9, "sine", 0.05, 0.03); mkick(t0, 0.09); mkick(t0 + beat, 0.09); mhat(t0 + beat * 2, 0.05); mhat(t0 + beat * 2.02, 0.035); mhat(t0 + beat * 3.5, 0.012); }
    else [1, 3].forEach((b) => mhat(t0 + beat * (b + 0.5), 0.006));
    const eighth = beat / 2, n8 = 8;
    for (let i = 0; i < n8; i++) {
      const sw = i % 2 ? eighth * 0.12 : 0, tt = t0 + i * eighth + sw;
      if (bi % 4 === 0 || bi % 4 === 2 && i % 2 === 0) { if (bi % 4 === 0 || Math.random() < 0.6) mnote(P.motif[i] + (bi % 8 >= 4 ? 0 : 0), tt, eighth * (game ? 1.4 : 2.6), game ? "triangle" : "sine", game ? 0.04 : 0.045, 0.006); }
      else if (Math.random() < (game ? 0.42 : 0.3)) mnote(P.pent[Math.floor(Math.random() * P.pent.length)], tt, eighth * (game ? 1.2 : 2.4), game ? "triangle" : "sine", game ? 0.03 : 0.032, 0.006);
    }
  }
  function sched() {
    if (!ctx || !mg) return; const P = mode === "game" ? GAME : LOBBY, spb = 60 / P.bpm, now = ctx.currentTime;
    if (nextT < now) nextT = now + 0.05;
    while (nextT < now + 1.2) { bar(mode, step, nextT, spb); step++; nextT += spb * 4; }
  }
  function mStart() { if (!mus || level === 0 || !init()) return; if (!mg) { mg = ctx.createGain(); mg.gain.value = 0.0001; mg.connect(master); } if (!timer) { mode = want; nextT = ctx.currentTime + 0.1; step = 0; timer = setInterval(sched, 300); sched(); } mg.gain.cancelScheduledValues(ctx.currentTime); mg.gain.setTargetAtTime(0.9 * (window.MIXMUS == null ? 1 : window.MIXMUS), ctx.currentTime, 0.8); }
  function mStop() { if (mg && ctx) { mg.gain.cancelScheduledValues(ctx.currentTime); mg.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.25); } clearInterval(timer); timer = null; }
  function mSet(m) { want = m; if (!timer || m === mode) return; mg.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.2); clearTimeout(pend); pend = setTimeout(() => { mode = want; step = 0; nextT = ctx.currentTime + 0.1; mg.gain.setTargetAtTime(0.9 * (window.MIXMUS == null ? 1 : window.MIXMUS), ctx.currentTime, 0.6); }, 700); }
  document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (level) ctx.resume(); });
  const vib = (p) => { try { if (level && navigator.vibrate && (!navigator.userActivation || navigator.userActivation.hasBeenActive)) navigator.vibrate(p); } catch (e) { /* not supported */ } };
  return {
    get level() { return level; },
    remix() { if (master) master.gain.value = gainFor(); if (mg && timer) mg.gain.setTargetAtTime(0.9 * (window.MIXMUS == null ? 1 : window.MIXMUS), ctx.currentTime, 0.1); },
    _n: { note: (...a) => note(...a), noise: (...a) => noise(...a), run: (f) => run(f) },
    cycle() { level = (level + 1) % 3; try { localStorage.setItem("arena-sound", String(level)); } catch (e) { /* storage unavailable */ } if (master) master.gain.value = gainFor(); if (level === 0) mStop(); else mStart(); return ["off", "soft", "full"][level]; },
    unlock() { if (level) { init(); mStart(); } },
    get music() { return mus; }, mode(m) { mSet(m); },
    setLevel(n) { level = n; try { localStorage.setItem("arena-sound", String(level)); } catch (e) { /* storage unavailable */ } if (master) master.gain.value = gainFor(); if (level === 0) mStop(); else mStart(); return level; },
    setMusic(on) { mus = on ? 1 : 0; try { localStorage.setItem("arena-music", String(mus)); } catch (e) { /* storage unavailable */ } if (mus) mStart(); else mStop(); return mus; },
    toggleMusic() { mus = mus ? 0 : 1; try { localStorage.setItem("arena-music", String(mus)); } catch (e) { /* storage unavailable */ } if (mus) mStart(); else mStop(); return mus; },
    count(n) { run((t) => { if (n === 0) { [72, 76, 79, 84].forEach((x, i) => note(x, t + i * 0.025, 0.7, "triangle", 0.06)); noise(t, 0.35, 800, 5000, 0.03, 0.8); } else note(n === 1 ? 69 : 67, t, 0.22, "sine", 0.08); }); },
    tick() { run((t) => noise(t, 0.035, 2600, 1800, 0.035, 2)); },
    hover() { run((t) => { note(84, t, 0.07, "sine", 0.02); note(91, t + 0.015, 0.06, "sine", 0.01); }); },
    lock() { vib(15); run((t) => { note(43, t, 0.22, "sine", 0.16, -5); noise(t, 0.08, 400, 120, 0.05); note(67, t + 0.06, 0.12, "triangle", 0.06); }); },
    whoosh() { run((t) => noise(t, 0.42, 300, 3200, 0.06, 0.8)); },
    right() { vib(18); run((t) => [72, 76, 79].forEach((n, i) => note(n, t + i * 0.09, 0.45, "triangle", 0.075))); },
    wrong() { vib([40, 50, 40]); run((t) => { note(64, t, 0.3, "sine", 0.07, -2); note(60, t + 0.16, 0.42, "sine", 0.06, -1); }); },
    win() { vib([30, 40, 70]); run((t) => { [76, 79, 83, 88].forEach((n, i) => note(n, t + i * 0.08, 0.55, "triangle", 0.07)); noise(t + 0.3, 0.4, 5000, 9000, 0.02, 3); noise(t + 0.1, 1.3, 500, 1700, 0.035, 0.5); }); },
    horn() { vib([60, 40, 120]); run((t) => { [55, 59, 62].forEach((n) => note(n, t, 0.9, "sawtooth", 0.035)); [67, 71, 74].forEach((n) => note(n, t + 0.02, 0.9, "square", 0.018)); noise(t + 0.15, 1.8, 450, 1500, 0.045, 0.45); }); },
    league(code) { run((t) => { const sc = SCALES[code], r = ROOT[code]; [0, 2, 4, 6].forEach((d, i) => note(r + sc[d % sc.length] + (d >= sc.length ? 12 : 0), t + i * 0.13, 0.9, WAVE[code], 0.075)); noise(t, 0.6, 500, 2400, 0.025, 0.7); }); },
    back() { run((t) => { note(67, t, 0.22, "sine", 0.07); note(60, t + 0.11, 0.3, "sine", 0.07); }); },
    goal() { run((t) => { noise(t, 0.5, 400, 2600, 0.07, 0.7); [67, 71, 74, 79].forEach((n, i) => note(n, t + 0.05 + i * 0.07, 0.5, "triangle", 0.07)); }); },
    whistle() { run((t) => { note(88, t, 0.16, "sine", 0.045); note(88.5, t + 0.19, 0.3, "sine", 0.045); }); },
    flip() { run((t) => noise(t, 0.2, 800, 2400, 0.05, 1.5)); },
  };
})();
function confetti() {
  if (REDUCED) return;
  const box = document.createElement("div"); box.className = "confetti"; box.setAttribute("aria-hidden", "true");
  const cols = ["--accent", "--accent2", "--home", "--away", "--ok"];
  for (let k = 0; k < 40; k++) { const e = document.createElement("i"); e.style.cssText = `left:${(Math.random() * 100).toFixed(1)}%;--c:var(${cols[k % cols.length]});--x:${((Math.random() - 0.5) * 260).toFixed(0)}px;--r:${(Math.random() * 720 - 360).toFixed(0)}deg;--d:${(1.1 + Math.random() * 1).toFixed(2)}s`; box.appendChild(e); }
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}

/* ---------- FX: the moments after a right or wrong answer ----------
   hit(pts): a burst where you clicked and a floating +points.  miss(text): the card shakes and a red -points floats up.
   streak(n): a banner at 3, 5, 10, 15, 20 and every 5 after.  best(score): "New best" at the end of a solo run.
   Snd.right / Snd.wrong are wrapped, so every game gets at least the burst or the shake. */
const FX = (() => {
  let px = innerWidth / 2, py = innerHeight / 2, last = 0;
  addEventListener("pointerdown", (e) => { px = e.clientX; py = e.clientY; }, { capture: true, passive: true });
  const origin = () => { const a = document.activeElement; if (a && a !== document.body && a.getBoundingClientRect) { const r = a.getBoundingClientRect(); if (r.width && r.bottom > 0 && r.top < innerHeight) return [r.left + r.width / 2, r.top + r.height / 2]; } return [px, py]; };
  const add = (cls, html, at, ms, label) => { const e = document.createElement("div"); e.className = cls; e.innerHTML = html; if (label) { e.setAttribute("role", "status"); e.setAttribute("aria-label", label); } else e.setAttribute("aria-hidden", "true"); if (at) { e.style.left = at[0] + "px"; e.style.top = at[1] + "px"; } document.body.appendChild(e); setTimeout(() => e.remove(), ms); return e; };
  const cols = ["--ok", "--accent", "--accent2", "--glow"];
  function burst(at) { let h = "<b></b>"; for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2 + Math.random() * 0.3, d = 60 + Math.random() * 70; h += `<i style="--c:var(${cols[k % cols.length]});--x:${(Math.cos(a) * d).toFixed(0)}px;--y:${(Math.sin(a) * d).toFixed(0)}px"></i>`; } add("fx-burst", h, at, 900); }
  const float = (text, kind, at, label) => add("fx-float " + kind, text, at, 1200, label);
  const after = (fn) => setTimeout(fn, 20);   // after the synchronous re-render that follows every answer
  function shake(sel) { after(() => { const el = typeof sel === "string" ? document.querySelector(sel) : sel; if (!el) return; el.classList.remove("fx-shake"); void el.offsetWidth; el.classList.add("fx-shake"); setTimeout(() => el.classList.remove("fx-shake"), 520); }); }
  function pop(sel) { after(() => document.querySelectorAll(sel).forEach((el, i) => { el.style.animationDelay = i * 80 + "ms"; el.classList.add("fx-pop"); })); }
  function countUp(sel, from, to) { after(() => { const el = document.querySelector(sel); if (!el || REDUCED) return; const t0 = performance.now(); el.classList.add("fx-count"); (function f(t) { const k = Math.min(1, (t - t0) / 650), e = 1 - Math.pow(1 - k, 3); if (el.isConnected) el.textContent = Math.round(from + (to - from) * e); if (k < 1 && el.isConnected) requestAnimationFrame(f); })(t0); }); }
  function banner(big, small, party = true) { if (REDUCED) return; document.querySelectorAll(".fx-banner").forEach((e) => e.remove()); add("fx-banner", `${big}<small>${small}</small>`, null, 2000, `${big}. ${small}`); if (party) confetti(); }
  const MILESTONE = { 3: ["3 in a row", "Heating up"], 5: ["5 in a row", "On fire"], 10: ["10 in a row", "Unstoppable"], 15: ["15 in a row", "Ball knowledge"], 20: ["20 in a row", "Hall of fame"] };
  const api = {
    hit(pts) { last = performance.now(); try { Mascot.react(pts >= 900 ? "bighit" : "hit"); } catch (e) { /* no mascot */ } if (REDUCED) return; const at = origin(); burst(at); if (pts) float("+" + pts, "good", [at[0], at[1] - 10], `Correct, plus ${pts}`); },
    miss(text, sel = "#room > .card") { last = performance.now(); try { Mascot.react("miss"); } catch (e) { /* no mascot */ } const at = origin(); if (!REDUCED && text) float(text, "bad", at, "Wrong, " + text); shake(sel); },
    streak(n) { if (!n) return; const m = MILESTONE[n] || (n > 20 && n % 5 === 0 ? [n + " in a row", "Legendary"] : null); if (!m) return; setTimeout(() => { try { Mascot.react("streak"); } catch (e) { /* no mascot */ } }, 900); setTimeout(() => { banner(m[0], m[1]); try { Snd.horn(); } catch (e) { /* no sound */ } }, 350); },
    best(score) { setTimeout(() => { try { Mascot.react("best"); } catch (e) { /* no mascot */ } }, 1200); setTimeout(() => { banner("New best!", score + " points"); try { Snd.horn(); } catch (e) { /* no sound */ } }, 450); },
    over() { setTimeout(() => { try { Mascot.react("over"); } catch (e) { /* no mascot */ } }, 600); if (REDUCED) return; add("fx-dim", "", null, 1500); shake("#room > .card"); },
    pop, countUp, shake,
    auto(ok) { if (performance.now() - last < 120) return; last = performance.now(); try { Mascot.react(ok ? "hit" : "miss"); } catch (e) { /* no mascot */ } if (ok) { if (!REDUCED) burst(origin()); } else shake("#room > .card"); },
  };
  const r0 = Snd.right, w0 = Snd.wrong;
  Snd.right = function () { const v = r0.apply(this, arguments); api.auto(true); return v; };
  Snd.wrong = function () { const v = w0.apply(this, arguments); api.auto(false); return v; };
  return api;
})();

function toast(html, kind = "") {
  let box = $("#toasts"); if (!box) { box = document.createElement("div"); box.id = "toasts"; box.setAttribute("aria-live", "polite"); document.body.appendChild(box); }
  TOASTQ.push([html, kind]); if (TOASTQ.length === 1) toastNext(box);   // one at a time, so achievements and stickers do not pile up
}
const TOASTQ = [];
function toastNext(box) {
  if (!TOASTQ.length) return; const [html, kind] = TOASTQ[0], short = TOASTQ.length > 3, t = document.createElement("div"); t.className = "toast " + kind; t.innerHTML = html; box.appendChild(t);
  const life = short ? 1800 : 2800; setTimeout(() => t.classList.add("out"), life); setTimeout(() => { t.remove(); TOASTQ.shift(); toastNext(box); }, life + 450);
}
/* ---------- The finale: one end-of-game card for every game. A ribbon and a trophy (gold for a win or a good run, silver for a
   draw), the scores counting up with a crown on the winner, confetti, your sidekick's reaction and stat tiles. ---------- */
const FIN_TROPHY = (tone) => `<svg viewBox="0 0 64 64" class="fintro ${tone}" aria-hidden="true"><defs><linearGradient id="fg-${tone}" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="${tone === "gold" ? "#ffe27a" : tone === "silver" ? "#f2f4f8" : "#e7b07a"}"/><stop offset="1" stop-color="${tone === "gold" ? "#d49a12" : tone === "silver" ? "#9aa3b2" : "#a8642c"}"/></linearGradient></defs><path d="M18 8h28v12a14 14 0 0 1-28 0z" fill="url(#fg-${tone})" stroke="#0006" stroke-width="2"/><path d="M18 12H9a9 9 0 0 0 11 12M46 12h9a9 9 0 0 1-11 12" fill="none" stroke="url(#fg-${tone})" stroke-width="4" stroke-linecap="round"/><rect x="29" y="33" width="6" height="11" fill="url(#fg-${tone})"/><rect x="20" y="44" width="24" height="8" rx="2" fill="url(#fg-${tone})" stroke="#0006" stroke-width="2"/><path d="M27 15l5-3 5 3-2 6h-6z" fill="#fff" opacity=".55"/></svg>`;
function finale(o) {
  /* o: { label, verdict, players: [{ name, score, av }], winner: index | -1 (draw) | null (solo), good: solo run worth celebrating, extra, buttons } */
  const solo = o.winner == null, tone = solo ? (o.good ? "gold" : "bronze") : o.winner < 0 ? "silver" : "gold", party = solo ? o.good : o.winner >= 0;
  let line = ""; try { const L = MASCOTS[Mascot.id()].lines || {}, pool = (party ? L.best || L.over : L.over || L.miss) || []; line = pool.length ? pool[Math.floor(Math.random() * pool.length)] : ""; } catch (e) { /* no sidekick */ }
  const sk = (() => { try { return Mascot.mode() !== "off" ? Mascot.face(party ? "happy" : "sad") : ""; } catch (e) { return ""; } })();
  setTimeout(finaleFx, 30);
  return `<div class="fin ${party ? "won" : ""} ${solo ? "solo" : ""}"><div class="finrays" aria-hidden="true"></div>
    <div class="fintop">${FIN_TROPHY(tone)}<div class="finkick">${esc(o.label || "Full time")}</div><div class="finverdict">${o.verdict || ""}</div></div>
    <div class="finscores">${o.players.map((p, i) => `<div class="finp ${!solo && i === o.winner ? "win" : ""} ${!solo && o.winner >= 0 && i !== o.winner ? "lose" : ""}" style="--d:${200 + i * 160}ms">${!solo && i === o.winner ? '<span class="fincrown" aria-label="Winner">👑</span>' : ""}<span class="finav">${p.av || avatarHTML("", "lg", p.name)}</span><small>${esc(p.name)}</small><b class="num finnum" data-to="${Math.round(p.score) || 0}">0</b></div>`).join(!solo && o.players.length === 2 ? '<span class="finvs">vs</span>' : "")}</div>
    ${o.tiles && o.tiles.length ? `<div class="fintiles">${o.tiles.map(([v, l], i) => `<div class="fintile" style="--d:${500 + i * 90}ms"><b class="num">${v}</b><small>${esc(l)}</small></div>`).join("")}</div>` : ""}
    ${o.extra || ""}
    ${sk && line ? `<div class="finsk"><span class="finskface">${sk}</span><span class="finskbub"><b>${esc(Mascot.name())}</b>${esc(line)}</span></div>` : ""}
    <div class="row finbtns">${o.buttons || ""}</div></div>`;
}
function finaleFx() {
  const f = document.querySelector(".fin"); if (!f) return;
  f.querySelectorAll(".finnum").forEach((el, i) => { const to = +el.dataset.to || 0; if (typeof REDUCED !== "undefined" && REDUCED) { el.textContent = to.toLocaleString(); return; } setTimeout(() => { const t0 = performance.now(), d = 900 + Math.min(700, Math.abs(to) / 6); (function step(t) { const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); if (!el.isConnected) return; el.textContent = Math.round(to * e).toLocaleString(); if (k < 1) requestAnimationFrame(step); else { el.classList.add("land"); try { Snd.tick(); } catch (x) { /* quiet */ } } })(t0); }, 260 + i * 160); });
  if (f.classList.contains("won")) setTimeout(() => { try { confetti(); Snd.win && Snd.win(); } catch (x) { /* quiet */ } }, 650);
}
const lev = (a, b) => { const m = a.length, n = b.length; if (Math.abs(m - n) > 3) return 9; let prev = Array.from({ length: n + 1 }, (_, j) => j); for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; } return prev[n]; };
/* what Enter should submit: an exact match, the only suggestion, the only name that starts with what was typed, or a single name within a letter or two (typos) */
/* One forgiving name check used by every guessing game: the full name, just the last name (or any later part of it), initials plus last name ("L. Messi"), accents ignored,
   and a typo or two on longer words all count. A first name on its own and bare particles ("van", "de") do not. */
const NM_PART = new Set(["de", "da", "do", "dos", "van", "von", "der", "den", "di", "del", "la", "le", "el", "al", "bin", "ter", "ten", "dal", "du", "mac", "mc", "fc", "ac", "as"]);
const NM_GENERIC = new Set(["city", "united", "real", "club", "sporting", "athletic", "town", "borussia", "bayer", "olympique", "sport", "calcio", "futbol", "football", "ssc", "afc"]);
function nmSame(a, b) { if (a === b) return true; if (a.length >= 5 && Math.abs(a.length - b.length) <= 2) return lev(a, b) <= (a.length >= 9 ? 2 : 1); return false; }
function nameMatch(typed, full, generic) {
  const g = xiTok(typed).filter((w) => w.length > 1), t = xiTok(full); if (!g.length || !t.length) return false;
  if (xiTok(typed).join(" ") === t.join(" ")) return true;
  const used = new Set();
  for (const w of g) { const k = t.findIndex((v, i) => !used.has(i) && nmSame(w, v)); if (k < 0) return false; used.add(k); }
  const idx = [...used], skip = generic ? NM_GENERIC : null;
  if (idx.every((i) => NM_PART.has(t[i]) || (skip && skip.has(t[i])))) return false;                // only particles or generic words matched
  if (t.length === 1 || generic) return true;                                                           // club names: any distinctive word is enough
  return idx.some((i) => i > 0 && !NM_PART.has(t[i])) || g.length >= 2;                                 // a later part of the name (the surname), or at least two words
}
const clubNameMatch = (typed, ours, tm) => nameMatch(typed, ours, true) || (tm && nameMatch(typed, tm, true));
/* players in a pool whose name fits what was typed, most famous first; the first one that passes `pred` wins (a cell of the grid, a club he played for) */
function guessPlayer(typed, pool, pred) { const c = pool.filter((x) => nameMatch(typed, x.n)).sort((a, b) => (FAME.get(a.id) ?? 9e9) - (FAME.get(b.id) ?? 9e9)); return (pred && c.find(pred)) || c[0] || null; }
function resolveGuess(typed, items, key) {
  const n = qnorm(typed); if (n.length < 3) return null;
  const s = suggestions(typed, items, key), exact = s.find((x) => qnorm(key(x)) === n); if (exact) return exact;
  if (s.length === 1) return s[0];
  const starts = s.filter((x) => qnorm(key(x)).startsWith(n)); if (starts.length === 1 && n.length >= 4) return starts[0];
  const tol = n.length >= 9 ? 2 : n.length >= 5 ? 1 : 0; if (!tol) return null;
  let best = null, bd = 99, tie = false; for (const x of items) { const d = lev(n, qnorm(key(x))); if (d < bd) { bd = d; best = x; tie = false; } else if (d === bd) tie = true; }
  return bd <= tol && !tie ? best : null;
}
/* Everything that arrives from another person (the public relay, a challenge link) is untrusted and some of it is drawn as HTML.
   So it is cleaned once, where it enters: markup characters become look-alikes, picture and sound addresses must be ours or
   from the sources the site already uses, and odd keys are dropped. */
const SAFE_URL = /^(img\/[\w.\/-]+|https:\/\/([a-z0-9-]+\.)*(mzstatic\.com|apple\.com|wikimedia\.org)\/[^\s"'<>`\\()]*)$/i;
const URL_KEYS = /^(img|logo|flag|cover|pv|am|page)$/;
function cleanData(v, key, depth = 0) {
  if (depth > 12) return null;
  if (typeof v === "string") {
    if (URL_KEYS.test(key || "")) return SAFE_URL.test(v) ? v : "";
    return v.slice(0, 2000).replace(/</g, "‹").replace(/>/g, "›").replace(/"/g, "”").replace(/'/g, "’").replace(/`/g, "’").replace(/javascript\s*:/gi, "");
  }
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (Array.isArray(v)) return v.slice(0, 2000).map((x) => cleanData(x, key, depth + 1));
  if (v && typeof v === "object") { const o = {}; Object.keys(v).slice(0, 300).forEach((k) => { if (/^[\w:.|* -]{1,60}$/.test(k) && !/^(__proto__|constructor|prototype)$/.test(k)) o[k] = cleanData(v[k], k, depth + 1); }); return o; }
  return typeof v === "boolean" ? v : null;
}
function mqttConnect(url, topic, onMsg, onState) {
  const enc = new TextEncoder(), dec = new TextDecoder(), st = { open: false, ws: null, ping: null, stopped: false, tries: 0 }; let buf = new Uint8Array(0);
  const str = (s) => { const b = enc.encode(s); return [b.length >> 8, b.length & 255, ...b]; };
  const rl = (n) => { const o = []; do { let d = n % 128; n = Math.floor(n / 128); if (n) d |= 128; o.push(d); } while (n); return o; };
  const pkt = (hdr, body) => { const b = Uint8Array.from(body); return Uint8Array.from([hdr, ...rl(b.length), ...b]); };
  const cat = (a, b) => { const o = new Uint8Array(a.length + b.length); o.set(a); o.set(b, a.length); return o; };
  function connect() {
    let ws; try { ws = new WebSocket(url, "mqtt"); } catch (e) { retry(); return; }
    st.ws = ws; ws.binaryType = "arraybuffer"; buf = new Uint8Array(0);
    ws.onopen = () => {
      ws.send(pkt(0x10, [...str("MQTT"), 4, 2, 0, 60, ...str("bk" + Math.random().toString(36).slice(2, 10))]));
      ws.send(pkt(0x82, [0, 1, ...str(topic), 0]));
      st.ping = setInterval(() => { try { ws.send(Uint8Array.from([0xC0, 0])); } catch (e) { /* closed */ } }, 30000);
    };
    ws.onmessage = (ev) => {
      buf = cat(buf, new Uint8Array(ev.data));
      while (buf.length >= 2) {
        let i = 1, mul = 1, len = 0, b; do { if (i >= buf.length) return; b = buf[i++]; len += (b & 127) * mul; mul *= 128; } while (b & 128);
        if (buf.length < i + len) return;
        const hdr = buf[0], body = buf.slice(i, i + len); buf = buf.slice(i + len);
        if (hdr >> 4 === 2) { st.open = true; st.tries = 0; if (onState) onState(true); }
        else if (hdr >> 4 === 3) { const tl = (body[0] << 8) | body[1], off = 2 + tl + (((hdr >> 1) & 3) ? 2 : 0); try { if (body.length < 200000) onMsg(cleanData(JSON.parse(dec.decode(body.slice(off))))); } catch (e) { /* not ours */ } }
      }
    };
    ws.onclose = () => { const was = st.open; st.open = false; clearInterval(st.ping); if (was && onState) onState(false); retry(); };
    ws.onerror = () => { /* onclose follows */ };
  }
  function retry() { if (st.stopped) return; st.tries++; setTimeout(() => { if (!st.stopped) connect(); }, Math.min(8000, 800 * st.tries)); }
  st.send = (obj) => { if (!st.open) return; const tb = str(topic), pb = enc.encode(JSON.stringify(obj)); try { st.ws.send(pkt(0x30, [...tb, ...pb])); } catch (e) { /* closed */ } };
  st.close = () => { st.stopped = true; clearInterval(st.ping); try { st.ws.close(); } catch (e) { /* ignore */ } st.open = false; };
  connect(); return st;
}
const BROKERS = ["wss://broker.hivemq.com:8884/mqtt", "wss://broker.emqx.io:8084/mqtt", "wss://test.mosquitto.org:8081"];
const qnorm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
function suggestions(q, items, key) {
  const n = qnorm(q); if (n.length < 2) return [];
  const hit = items.filter((x) => qnorm(key(x)).includes(n)); hit.sort((a, b) => (qnorm(key(a)).startsWith(n) ? 0 : 1) - (qnorm(key(b)).startsWith(n) ? 0 : 1) || key(a).length - key(b).length);
  return hit.slice(0, 6);
}
const xiTok = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/ø/g, "o").replace(/[^a-z0-9]+/g, " ").trim().split(" ").filter(Boolean);
/* ---------- ambient particles ---------- */
const fx = $("#fx"), fctx = fx.getContext("2d");
let parts = [], glowCol = "#A855F7", accCol = "#7CF5C8";
function sizeFx() { fx.width = innerWidth * devicePixelRatio; fx.height = innerHeight * devicePixelRatio; }
function seedParts() { parts = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: 1 + Math.random() * 3, s: 0.02 + Math.random() * 0.05, p: Math.random() * 6.28, a: 0.15 + Math.random() * 0.4 })); }
function frame(ts) {
  fctx.clearRect(0, 0, fx.width, fx.height);
  if (document.body.classList.contains("ingame")) { if (!document.hidden) requestAnimationFrame(frame); return; }   // no background particles during a round: less work, fewer distractions
  const W = fx.width, H = fx.height, dpr = devicePixelRatio;
  parts.forEach((q) => {
    q.y -= q.s / 60; if (q.y < -0.05) { q.y = 1.05; q.x = Math.random(); }
    const x = (q.x + Math.sin(ts / 4000 + q.p) * 0.02) * W, y = q.y * H, rr = q.r * 6 * dpr, g = fctx.createRadialGradient(x, y, 0, x, y, rr);
    const a = q.a * (0.6 + 0.4 * Math.sin(ts / 900 + q.p));
    g.addColorStop(0, hexA(q.r > 2.4 ? accCol : glowCol, a)); g.addColorStop(1, hexA(glowCol, 0));
    fctx.fillStyle = g; fctx.beginPath(); fctx.arc(x, y, rr, 0, 6.283); fctx.fill();
  });
  if (!document.hidden) requestAnimationFrame(frame);
}
function hexA(h, a) { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a.toFixed(3)})`; }
if (!REDUCED) { sizeFx(); seedParts(); requestAnimationFrame(frame); addEventListener("resize", sizeFx); document.addEventListener("visibilitychange", () => { if (!document.hidden) requestAnimationFrame(frame); }); }
function setParticleColours(code) { const p = PAL[code] || PAL.E0; glowCol = p.glow; accCol = p.accent; }
const Vs = {
  el: null, tm: [], on: false,
  clear() { this.tm.forEach(clearTimeout); this.tm = []; clearInterval(this.iv); },
  close() { this.clear(); this.on = false; const e = this.el; this.el = null; if (e) { e.classList.add("out"); setTimeout(() => e.remove(), 360); } },
  mount(cls, html) { this.clear(); if (this.el) this.el.remove(); const e = document.createElement("div"); e.className = "vso " + cls; e.setAttribute("role", "dialog"); e.setAttribute("aria-label", "Online match"); e.style.setProperty("--rc", this.rc()); e.innerHTML = html; document.body.appendChild(e); this.el = e; this.on = true; return e; },
  rc() { const c = Account.signedIn ? Ranked.elo : 1000; return c >= 1400 ? "#d36bff" : c >= 1250 ? "#5aa8ff" : c >= 1150 ? "#5ad6d0" : c >= 1050 ? "#f2b632" : c >= 950 ? "#b9c2d0" : "#c07a45"; },
  me() { const p = prof(); return { nick: p.nick || "Guest", elo: Account.signedIn ? Ranked.elo : null, avatar: p.avatar || "", badges: myBadges() }; },
  wait(code, game) {
    const c = this.me(), link = inviteLink(code, game);
    const e = this.mount("waiting", `<div class="vsw"><div class="vsttl">${Net.ranked ? "Ranked lobby" : "Private room"}</div><div class="vsstage"><i class="vsr"></i><i class="vsr"></i><i class="vsr"></i><i class="vsradar"></i><span class="vsme">${avatarHTML(c.avatar, "xl", c.nick)}</span></div><div class="vsname">${esc(c.nick)}${badgesHTML(c.badges)}</div><div class="vsttl">Waiting for an opponent<i>.</i><i>.</i><i>.</i></div><div class="vscode" aria-label="Room code ${esc(code)}">${code.split("").map((ch) => `<b>${esc(ch)}</b>`).join("")}</div><div class="vsmsg" id="vsMsg">Share the code or the invite link.</div><div class="row" style="justify-content:center"><button class="btn" id="vsCopy" type="button">Copy invite link</button><button class="btn ghost" id="vsCancel" type="button">Cancel</button></div></div>`);
    e.querySelector("#vsCopy").onclick = () => { try { navigator.clipboard.writeText(link).then(() => toast("Invite link copied"), () => toast(link)); } catch (x) { toast(link); } };
    e.querySelector("#vsCancel").onclick = () => Vs.cancel();
    this.iv = setInterval(() => { const m = $("#vsMsg"); if (m && !Net.linked()) m.textContent = "Connecting to the room server…"; else if (m) m.textContent = "Room is open. Share the code or the invite link."; }, 1500);
  },
  join(code) {
    this.seen = false; const c = this.me(), since = Date.now();
    const e = this.mount("joining", `<div class="vsw"><div class="vsttl">Joining room</div><div class="vscode">${code.split("").map((ch) => `<b>${esc(ch)}</b>`).join("")}</div><div class="vsstage"><i class="vsr"></i><i class="vsr"></i><i class="vsr"></i><i class="vsradar"></i><span class="vsme">${avatarHTML(c.avatar, "xl", c.nick)}</span></div><div class="vsname">${esc(c.nick)}${badgesHTML(c.badges)}</div><div class="vsttl" id="vsJt">Connecting<i>.</i><i>.</i><i>.</i></div><div class="vsmsg" id="vsMsg"></div><button class="btn ghost" id="vsCancel" type="button">Cancel</button></div>`);
    e.querySelector("#vsCancel").onclick = () => Vs.cancel();
    this.iv = setInterval(() => { const m = $("#vsMsg"), s = (Date.now() - since) / 1000; if (!m) return; m.textContent = !Net.linked() ? (s > 12 ? "Could not reach the room server. Check your connection." : "Reaching the room server…") : s > 20 ? "Connected, but nobody is hosting this room. Check the code." : "Looking for the host…"; }, 1200);
  },
  cancel() { this.close(); Net.close(); S.rk = false; go(""); },
  card(c, side) {
    c = c || {}; const elo = Number.isFinite(+c.elo) && c.elo != null ? Math.round(+c.elo) : null, rk = elo != null ? rankOf(elo) : null;
    const ids = (Array.isArray(c.badges) ? c.badges : []).filter((x) => typeof x === "string" && /^[a-z0-9_]{2,24}$/.test(x)).slice(0, 3);
    return `<div class="vsc ${side}"><span>${avatarHTML(typeof c.avatar === "string" ? c.avatar.slice(0, 60) : "", "xl", String(c.nick || "?"))}</span><div class="vsname">${esc(String(c.nick || "Player").slice(0, 16))}</div>${badgesHTML(ids, true)}${elo != null ? `<div class="vselo">${elo}</div><div class="vsrk">${rk.icon} ${rk.name}</div>` : '<div class="vsrk">Guest</div>'}</div>`;
  },
  match(a, b, done) {
    if (this.matched) return; this.matched = true;
    const e = this.mount("versus", `<div class="vsflash"></div><div class="vsvs"><div class="vsvsl"></div>${this.card(a, "l")}<div class="vsmid"><div class="vsx">VS</div></div>${this.card(b, "r")}</div><div class="vscount" id="vsCnt" aria-live="polite"></div>`);
    Snd.lock();
    const cnt = (txt, at) => this.tm.push(setTimeout(() => { const n = $("#vsCnt"); if (n) n.innerHTML = `<b>${txt}</b>`; Snd.count(txt === "GO" ? 0 : +txt); }, at));
    cnt("3", 1700); cnt("2", 2300); cnt("1", 2900); cnt("GO", 3500);
    this.tm.push(setTimeout(() => { Vs.matched = false; Vs.close(); if (done) done(); }, 4100));
  },
};
