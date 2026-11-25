/* ================= redemption round: the questions you missed come back, spaced further apart each time you get them =================
   Kept in your profile (so it follows your account). Solo quiz rounds only. Entries: "world|game|item" → { box, due, n, t }.
   box 0 = just missed; each redemption right moves it up and further away; after the fourth it is done (box 9, kept so another
   device cannot bring it back). */
var Redo = {
  GAPS: [1, 3, 7, 16], BATCH: 10, CAP: 200,
  day(plus = 0) { return new Date(Date.now() + plus * 864e5).toISOString().slice(0, 10); },
  all() { const p = prof(); return (p.redo = p.redo || {}); },
  parts(k) { const [w, g, ...id] = k.split("|"); return { w, g, id: id.join("|") }; },
  open() { return Object.entries(this.all()).filter(([k, v]) => { if (v.box >= 9) return false; const { w, g } = this.parts(k); return WORLDS[w] && gameOf(w, g); }); },
  due() { const today = this.day(); return this.open().filter(([, v]) => v.due <= today).sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].t - b[1].t); },
  trim() { const a = this.all(), ks = Object.keys(a); if (ks.length > this.CAP) ks.sort((x, y) => (a[y].box >= 9) - (a[x].box >= 9) || a[x].t - a[y].t).slice(0, ks.length - this.CAP).forEach((k) => delete a[k]); },
  missed(k) { const a = this.all(), old = a[k]; a[k] = { box: 0, due: this.day(), n: ((old && old.n) || 0) + 1, t: Date.now() }; this.trim(); saveProf(); },
  got(k) {   // only counts inside a redemption round
    const v = this.all()[k]; if (!v || v.box >= 9) return null; v.box++; v.t = Date.now();
    if (v.box > this.GAPS.length) { v.box = 9; saveProf(); return 0; }
    const gap = this.GAPS[v.box - 1]; v.due = this.day(gap); saveProf(); return gap;
  },
  start() {
    const list = this.due().slice(0, 40).map(([k]) => ({ k, ...this.parts(k) })).filter((x) => gameOf(x.w, x.g).pool().some((i) => i.id === x.id)).slice(0, this.BATCH);
    if (!list.length) return toast("Nothing is due right now.");
    const mix = shuffle(list), first = mix[0];
    loadingScreen(first.w, () => {
      Net.close(); S.world = first.w; show("league"); renderWorldFor(first.w); $("#crumbs").innerHTML = `<button class="back" data-go="home" type="button">← Menu</button>`;
      document.body.classList.add("ingame"); S.game = first.g; this.starting = mix; newQuiz(first.w, first.g, "solo", mix.map((x) => ({ w: x.w, g: x.g }))); S.game = first.g;
    });
  },
  card() {
    const n = this.due().length, later = this.open().filter(([, v]) => v.due > this.day()).sort((a, b) => a[1].due.localeCompare(b[1].due));
    if (!n && !later.length) return "";
    const next = later.length ? new Date(later[0][1].due + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" }) : "";
    return `<div class="redocard"><div><span class="htlabel">Redemption round</span><b>${n ? `${n} question${n === 1 ? "" : "s"} you missed ${n === 1 ? "is" : "are"} back` : "Nothing due today"}</b><span class="fine">${n ? `Up to ${this.BATCH} at a time. Get one right and it returns later, then retires.` : `${later.length} waiting. The next comes back ${next}.`}</span></div>${n ? `<button type="button" class="btn" data-redo="1">Play</button>` : ""}</div>`;
  },
};
{ const next0 = nextRound; nextRound = function () { if (Redo.starting && Q.s && Q.s.round === 0) { Q.s.redo = Redo.starting.map((x) => x.id); Q.s.redoKeys = Redo.starting.map((x) => x.k); Q.s.mixW = []; Redo.starting = null; } return next0.apply(this, arguments); }; }
{ const end0 = endRound; endRound = function (winner) {
  const s = Q.s; if (!s || s.mode !== "solo" || s.phase === "reveal") return end0.apply(this, arguments);
  const w = curWorld(), g = curDef().id, key = s.redoKeys ? s.redoKeys[s.round - 1] : `${w}|${g}|${s.r.id}`;
  const out = end0.apply(this, arguments);
  if (winner == null) Redo.missed(key);
  else if (s.redo) { const gap = Redo.got(key); if (gap != null) toast(gap ? `Back again in ${gap} day${gap === 1 ? "" : "s"}.` : "<b>Redeemed</b><br>That one's yours now.", "ach"); }
  return out;
}; }
document.addEventListener("click", (e) => { const t = e.target.closest("button"); if (t && t.dataset.redo) { Snd.tick(); Redo.start(); } });
