/* ================= "Where did they finish?" (football and basketball) and "Who did it" (football), from ballknowledge.
   Real final tables and match records only (window.HISTORY, pipelines/bk_history.py). Solo and one-device play. ================= */
const HIST = window.HISTORY || { football: { leagues: {}, matches: [] }, basketball: { leagues: {} } };
const finTol = () => ({ easy: 4, medium: 3, hard: 2, elite: 1 })[S.diff] || 3;
const ordn = (k) => k + (["th", "st", "nd", "rd"][k % 10 > 3 || (k > 10 && k < 14) ? 0 : k % 10]);
const histClub = (w, name) => items(w, (x) => (x.kind === "club" || x.kind === "team") && x.logo && (x.n === name || x.short === name || x.n.endsWith(" " + name)))[0];
const histBadge = (w, name) => { const c = histClub(w, name); return c ? `<img class="hgbadge" src="${c.logo}" alt="">` : ""; };
const histClubs = (w) => items(w, (x) => (x.kind === "club" || x.kind === "team") && x.logo);

GAMES.football.push(G("finish", "Where did they finish?", "finish", { tag: "A club and a season. Slide to where it finished: the closer, the more you score.", pool: () => histClubs("football"), min: 1 }));
GAMES.basketball.push(G("finish", "Where did they finish?", "finish", { tag: "A team and a season. Slide to where its record ranked: the closer, the more you score.", pool: () => histClubs("basketball"), min: 1 }));
if ((HIST.football.matches || []).length) GAMES.football.push(G("iconic", "Who did it", "iconic", { tag: "A big match, minute by minute. Name the scorers, the assists, the penalty takers and who was sent off.", pool: () => histClubs("football"), min: 1 }));

function histDone(key, score, streak, xp, w) {
  const p = prof(), k = w + ":" + key, old = p.best[k];
  if (!old || score > old.score) p.best[k] = { score, streak: Math.max(streak, (old || {}).streak || 0) };
  addXP(xp, w); saveProf();
}
/* keep the card still when it is redrawn */
function histPaint(view, body) {
  const old = $("#room > .hg"), still = old && old.dataset.view === view;
  $("#room").innerHTML = `<div class="card hg ${still ? "still" : ""}" data-view="${view}">${body}</div>`;
}

/* ---------- where did they finish? ---------- */
const Fin = {
  s: null,
  start(mode) { this.s = { w: S.world, mode, round: 0, rounds: 5, scores: mode === "duo" ? [0, 0] : [0], streak: 0, turn: 0, over: false, used: new Set(), phase: "ask" }; this.next(); },
  next() {
    const f = this.s, L = Object.values(HIST[f.w].leagues); let lg, season, tab, pos;
    for (let k = 0; k < 60; k++) { lg = rnd(L); season = rnd(Object.keys(lg.tables)); tab = lg.tables[season]; pos = Math.floor(Math.random() * tab.length); if (!f.used.has(tab[pos][0])) break; }
    f.used.add(tab[pos][0]); f.round++; f.turn = 0; f.phase = "ask";
    f.cur = { league: lg.name, season, n: tab.length, pos: pos + 1, row: tab[pos], guess: Math.ceil(tab.length / 2), guesses: [], diffs: [], pts: [] };
    this.paint();
  },
  paint() {
    const f = this.s, c = f.cur, r = c.row, duo = f.mode === "duo", nba = f.w === "basketball", who = NAMES(), title = gamesBar("Where did they finish?");
    if (f.phase === "done") {
      const [a, b] = f.scores, verdict = duo ? (a === b ? "A draw." : `${esc(who[a > b ? 0 : 1])} wins!`) : `Run over · streak of ${f.streak}`;
      return histPaint("fin-done", `${title}<div class="rcard on"><div class="big">${verdict}</div><p class="fine">${f.scores.map((s, i) => `${duo ? esc(who[i]) : "Points"}: ${s}`).join(" · ")}</p></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn" type="button" data-fin="again">Play again</button></div>`);
    }
    const hud = `<div class="qhud"><span class="label">${duo ? `Round ${f.round} of ${f.rounds}` : `Streak ${f.streak}`}</span>${f.scores.map((s, i) => `<span class="num qscore"><small>${duo ? esc(who[i]) : "Points"}</small> <b>${s}</b></span>`).join("")}</div>`;
    const ctx = f.phase === "ask" ? (nba ? `Scored ${r[2]} a game and gave up ${r[3]}` : `Scored ${r[2]} and conceded ${r[3]}`) : nba ? `${r[4]} wins, ${r[6]} defeats` : `${r[1]} points: ${r[4]} wins, ${r[5]} draws, ${r[6]} defeats`;
    const last = duo ? f.round >= f.rounds : f.over;
    const body = f.phase === "ask"
      ? `<div class="hgslide">${duo ? `<b>${esc(who[f.turn])}, your guess</b>` : ""}<div class="num hgpos" id="finVal">${ordn(c.guess)}</div><input type="range" id="finRange" min="1" max="${c.n}" value="${c.guess}" aria-label="Final position"><div class="row fine" style="justify-content:space-between"><span>Top</span><span>Bottom</span></div></div><div class="row" style="margin-top:12px"><button class="btn" type="button" data-fin="lock">${duo && f.turn === 0 ? "Lock in and pass" : "Lock in"}</button></div>`
      : `<div class="rcard on"><div class="label">${nba ? "Where the record ranked" : "The real table position"}</div><div class="big num">${ordn(c.pos)}</div><p class="fine">${c.guesses.map((g, i) => `${duo ? esc(who[i]) : "You"}: ${ordn(g)}, ${c.diffs[i] === 0 ? "spot on" : `${c.diffs[i]} off`}, ${c.pts[i]} points`).join("<br>")}</p></div><div class="row" style="margin-top:12px"><button class="btn" type="button" data-fin="next">${last ? "See the result" : "Next"}</button></div>`;
    histPaint("fin", `${title}${hud}<div class="row hghead">${histBadge(f.w, r[0])}<div><h3>${esc(r[0])}</h3><div class="fine">${esc(c.league)}, ${esc(c.season)} · ${c.n} ${nba ? "teams, all ranked by record" : "clubs"}</div><div class="fine">${ctx}</div></div></div>${body}`);
  },
  lock() {
    const f = this.s, c = f.cur, duo = f.mode === "duo"; c.guesses[f.turn] = c.guess; Snd.lock();
    if (duo && f.turn === 0) { f.turn = 1; c.guess = Math.ceil(c.n / 2); return this.paint(); }
    c.guesses.forEach((g, i) => { c.diffs[i] = Math.abs(g - c.pos); c.pts[i] = Math.max(0, 1000 - 220 * c.diffs[i]); f.scores[i] += c.pts[i]; });
    const best = Math.min(...c.diffs); if (!duo) { if (best <= finTol()) f.streak++; else f.over = true; }
    f.phase = "reveal"; if (best === 0) { Snd.win(); confetti(); } else if (best <= finTol()) Snd.right(); else Snd.wrong();
    Mascot.react(best <= finTol() ? "hit" : "miss"); this.paint();
  },
  advance() {
    const f = this.s;
    if (f.mode === "duo" ? f.round >= f.rounds : f.over) { f.phase = "done"; if (f.mode === "solo") histDone("finish", f.scores[0], f.streak, 10 + Math.round(f.scores[0] / 200), f.w); else { addXP(20, f.w); saveProf(); } Mascot.react("over"); return this.paint(); }
    this.next();
  },
};

/* ---------- who did it ---------- */
const ICKINDS = [["any", "Surprise me", () => true], ["ucl", "Champions League", (m) => m.comp === "Champions League"], ["intl", "World Cups and Euros", (m) => /World Cup|European Championship/.test(m.comp)], ["cup", "Domestic cup finals", (m) => /FA Cup|Copa|DFB|Coppa/.test(m.comp)], ["league", "League giants", (m) => /Premier|Bundesliga|La Liga/.test(m.comp)]];
const Ic = {
  s: null, kind: "any",
  menu() { this.s = null; histPaint("ic-menu", `${gamesBar("Who did it")}<p class="sub">A big match appears with its score and highlights. Name the scorer, whoever set it up, the penalty taker and who was sent off.</p><div class="chips">${ICKINDS.map(([k, n]) => `<button type="button" class="chip ${this.kind === k ? "on" : ""}" data-ickind="${k}">${n}</button>`).join("")}</div><p class="fine">${HIST.football.matches.length} matches, from match records. A surname is enough. 100 points each; a wrong guess costs 15, a hint 30.</p><div class="row" style="margin-top:10px"><button class="btn" type="button" data-ic="start">Start</button></div>`); },
  start() {
    const f = (ICKINDS.find((k) => k[0] === this.kind) || ICKINDS[0])[2], pool = HIST.football.matches.filter(f); if (!pool.length) return toast("No matches of that kind.");
    const m = rnd(pool), qs = [];
    m.ev.forEach((e, i) => { if (e.k === "goal") { qs.push({ i, q: e.pen ? "Who converted the penalty?" : "Who scored?", ans: e.p }); if (e.a) qs.push({ i, q: "Who set it up?", ans: e.a, assist: true }); } else qs.push({ i, q: e.why === "second yellow" ? "Who was sent off for a second yellow?" : "Who was sent off?", ans: e.p }); });
    const main = qs.filter((q) => !q.assist);
    this.s = { m, qs: main.length > 10 ? main.slice(0, 10) : qs.slice(0, 12), k: 0, got: {}, wrong: 0, hints: 0, hint: 0, done: false, msg: "" }; this.paint();
  },
  score() { const x = this.s; return Math.max(0, Object.keys(x.got).length * 100 - x.wrong * 15 - x.hints * 30); },
  hint(s) { const t = s.split(" "), sur = t[t.length - 1]; return this.s.hint === 1 ? `${t.length > 1 ? t[0][0] + ". " : ""}${sur.length} letters in the surname` : `Surname starts with “${sur.slice(0, 3)}”`; },
  paint() {
    const x = this.s, m = x.m, cur = x.qs[x.k], correct = Object.keys(x.got).length;
    const rows = m.ev.map((e, i) => {
      const mine = x.qs.filter((q) => q.i === i), isCur = !x.done && cur && cur.i === i, side = e.s === "h" ? m.h : m.a;
      const name = (q, real) => (!q || x.done || x.got[x.qs.indexOf(q)] || x.qs.indexOf(q) < x.k ? esc(real) : isCur && cur === q ? "<b>?</b>" : "…");
      const scorer = mine.find((q) => !q.assist), assist = mine.find((q) => q.assist);
      const text = e.k === "goal" ? `${e.pen ? "Penalty" : "Goal"}${e.how && !e.pen ? ` (${esc(e.how)})` : ""} for ${esc(side)}: ${name(scorer, e.p)}${e.a ? ` · assist ${name(assist, e.a)}` : ""}` : `${e.why === "second yellow" ? "Second yellow, red card" : "Red card"} for ${esc(side)}: ${name(scorer || mine[0], e.p)}`;
      return `<li class="${isCur ? "cur" : ""}"><span class="num">${e.m}'</span><span>${e.k === "goal" ? "⚽" : "🟥"} ${text}</span></li>`;
    }).join("");
    const foot = x.done
      ? `<div class="rcard on" style="margin-top:12px"><b>${correct === x.qs.length ? "Perfect highlights" : `${correct} of ${x.qs.length}`}</b><p class="fine">Score ${this.score()}. ${x.wrong} wrong, ${x.hints} hints.</p></div><div class="row" style="margin-top:12px;gap:8px"><button class="btn" type="button" data-ic="start">Another match</button><button class="btn ghost" type="button" data-ic="menu">Change competition</button></div>`
      : `<div class="hgask"><b>${esc(cur.q)} <span class="fine">minute ${m.ev[cur.i].m}</span></b><div class="row" style="gap:8px"><input class="t" id="icIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type a surname" aria-label="Player"><button class="btn" type="button" data-ic="guess">Guess</button><button class="btn ghost" type="button" data-ic="hint" ${x.hint >= 2 ? "disabled" : ""}>Hint (-30)</button><button class="btn ghost" type="button" data-ic="skip">Skip</button></div>${x.hint ? `<div class="fine">Hint: ${esc(this.hint(cur.ans))}</div>` : ""}${x.msg ? `<div class="fine">${esc(x.msg)}</div>` : ""}</div>`;
    histPaint("ic", `${gamesBar("Who did it")}<div class="qhud"><span class="label">${esc(m.t)}</span><b class="num">${correct}/${x.qs.length}</b></div><div class="hgscore"><b>${esc(m.h)}</b><span class="num">${m.hg} – ${m.ag}</span><b>${esc(m.a)}</b></div><ol class="hglist">${rows}</ol>${foot}`);
    const input = $("#icIn"); if (input) input.focus({ preventScroll: true });
  },
  advance() {
    const x = this.s; x.k++; x.hint = 0; x.msg = "";
    if (x.k >= x.qs.length) { x.done = true; const n = Object.keys(x.got).length; if (n === x.qs.length) { Snd.win(); confetti(); } else Snd.whistle(); histDone("iconic", this.score(), n, 5 + n * 3, "football"); Mascot.react("over"); }
    this.paint();
  },
  guess() { const x = this.s; if (!x || x.done) return; const v = ($("#icIn") || {}).value || ""; if (!v.trim()) return; if (nameMatch(v, x.qs[x.k].ans)) { x.got[x.k] = true; Snd.right(); this.advance(); } else { x.wrong++; x.msg = `“${v.trim()}” is not it.`; Snd.wrong(); this.paint(); } },
};

document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("button"); if (!t || !$("#room > .hg")) return;
  if (t.dataset.fin && Fin.s) { if (t.dataset.fin === "lock") Fin.lock(); else if (t.dataset.fin === "next") Fin.advance(); else Fin.start(Fin.s.mode); return; }
  if (t.dataset.ickind) { Ic.kind = t.dataset.ickind; Ic.menu(); return; }
  const a = t.dataset.ic; if (!a) return;
  if (a === "start") Ic.start(); else if (a === "menu") Ic.menu(); else if (!Ic.s || Ic.s.done) return; else if (a === "guess") Ic.guess(); else if (a === "hint") { Ic.s.hint++; Ic.s.hints++; Ic.paint(); } else { Snd.tick(); Ic.advance(); }
});
document.addEventListener("input", (e) => { if (e.target.id === "finRange" && Fin.s) { Fin.s.cur.guess = +e.target.value; const v = $("#finVal"); if (v) v.textContent = ordn(Fin.s.cur.guess); } });
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "icIn") { e.preventDefault(); Ic.guess(); } });
