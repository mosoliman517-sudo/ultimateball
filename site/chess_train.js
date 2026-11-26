/* ================= chess training: puzzles, puzzle rush, endgame trainer and game review =================
   Puzzles: Lichess puzzle database (CC0). Endgame positions follow ballknowledge's trainer. Engine: the same Stockfish as Play chess. */
const PZ = window.PUZZLES || [];
const ENDGAMES = [
  { id: "kq", name: "Queen mate", fen: "8/8/8/4k3/8/8/8/4K2Q w - - 0 1", goal: "mate", lim: 20, tag: "King and queen against a lone king.", tip: "Use the queen to shrink the king's box from a knight's move away, bring your own king up, and never leave the other king without a move (that's stalemate)." },
  { id: "kr", name: "Rook mate", fen: "8/8/8/4k3/8/8/8/R3K3 w - - 0 1", goal: "mate", lim: 35, tag: "King and rook against a lone king.", tip: "Cut the king off with the rook, walk your king up to face it, then check along the edge." },
  { id: "kp6", name: "King on the sixth", fen: "4k3/8/4K3/4P3/8/8/8/8 w - - 0 1", goal: "queen", lim: 15, tag: "King in front of the pawn wins.", tip: "With your king on the sixth rank in front of the pawn this is always a win. Keep the king ahead and push only when it is safe from stalemate." },
  { id: "keysq", name: "Key squares", fen: "4k3/8/8/3K4/3P4/8/8/8 w - - 0 1", goal: "queen", lim: 20, tag: "Only a couple of moves win. Find them.", tip: "Get your king to c6, d6 or e6 before pushing. Push too early and it is a draw." },
  { id: "lucena", name: "Lucena position", fen: "1K1k4/1P6/8/8/8/8/r7/2R5 w - - 0 1", goal: "queen", lim: 25, tag: "The most famous winning rook ending.", tip: "Build a bridge: bring the rook to the fourth rank, walk the king out, and block the checks with the rook." },
  { id: "phil", name: "Philidor defence", fen: "4k3/7R/8/4PK2/8/8/8/r7 b - - 0 1", goal: "hold", lim: 25, tag: "Hold the draw a rook against rook and pawn.", tip: "Keep your rook on the third rank from your side to keep the king out. When the pawn advances, swing the rook behind and check from there." },
  { id: "kpdef", name: "Stop the pawn", fen: "8/8/8/8/4k3/8/4PK2/8 b - - 0 1", goal: "hold", lim: 25, tag: "King against king and pawn: take the opposition.", tip: "Stay in front of the pawn and face the white king with one square between you." },
];
const GOAL = { mate: "Give checkmate", queen: "Queen the pawn and keep the queen (or mate)", hold: "Hold the draw" };

const Train = {
  s: null, clock: null,
  data() { const p = prof(); p.chessTr = p.chessTr || { r: 1000, solved: 0, rush: 0, eg: {} }; return p.chessTr; },
  stop() { clearInterval(this.clock); this.s = null; },
  strip() {
    const d = this.data();
    return `<div class="trstrip">${[["puzzles", "Puzzles", `Your puzzle rating: ${d.r} · ${d.solved} solved`], ["rush", "Puzzle rush", `3 minutes, 3 strikes · best ${d.rush}`], ["endgames", "Endgame trainer", `${Object.keys(d.eg).length}/${ENDGAMES.length} done`]].map(([k, n, t]) => `<button type="button" class="contbar caldoor chessdoor" data-train="${k}"><div><span class="dk">Training</span><b>${n}</b><span class="fine">${t}</span></div></button>`).join("")}</div>`;
  },
  frame(title, body) { const s = this.s; if (s && s.last && s.c) queueMicrotask(() => { if (this.s === s) cpAnimate(s); }); $("#room").innerHTML = `<div class="card cpwrap trwrap"><div class="row" style="margin-bottom:12px;gap:10px"><button class="btn ghost" type="button" data-train="back">← Back</button><h2 style="font-size:24px">${title}</h2></div>${body}</div>`; },
  open(kind) {
    this.stop(); stopQuiz(); Q.s = null; H.s = null; CP.s = null; S.game = null; document.body.classList.add("ingame"); Snd.mode("game");
    if (typeof Chess === "undefined") return this.frame("Training", "<p>The chess rules could not load (offline?). Try again in a moment.</p>");
    if (kind === "endgames") return this.frame("Endgame trainer", `<p class="sub">Textbook endings against full-strength Stockfish.</p><div class="modes">${ENDGAMES.map((e) => `<button type="button" class="mode" data-eg="${e.id}"><b>${this.data().eg[e.id] ? "✓ " : ""}${e.name}</b><span>${e.tag} Goal: ${GOAL[e.goal].toLowerCase()}.</span></button>`).join("")}</div>`);
    if (!PZ.length) return this.frame("Puzzles", "<p>No puzzles loaded.</p>");
    if (kind === "rush") { this.s = { kind: "rush", left: 180, strikes: 0, score: 0, used: new Set() }; this.clock = setInterval(() => { const s = this.s; if (!s || s.kind !== "rush" || s.over) return clearInterval(this.clock); if (!$(".trwrap")) return this.stop(); s.left--; const el = $("#trClock"); if (el) el.textContent = this.mmss(s.left); if (s.left <= 0) this.rushEnd(); }, 1000); return this.nextPuzzle(); }
    this.s = { kind: "puzzles", used: new Set() }; this.nextPuzzle();
  },
  mmss: (n) => `${Math.floor(Math.max(0, n) / 60)}:${String(Math.max(0, n) % 60).padStart(2, "0")}`,

  /* ---------- puzzles ---------- */
  nextPuzzle() {
    const s = this.s; if (!s) return; const target = s.kind === "rush" ? 600 + s.score * 75 : this.data().r;
    let pool = []; for (let w = 100; w < 2400 && pool.length < 8; w += 100) pool = PZ.map((p, i) => i).filter((i) => !s.used.has(i) && Math.abs(PZ[i][2] - target) <= w);
    if (!pool.length) { s.used.clear(); pool = PZ.map((p, i) => i); }
    const i = rnd(pool); s.used.add(i); const [fen, moves, rating, theme] = PZ[i], c = new Chess(fen), line = moves.split(" ");
    Object.assign(s, { c, line, at: 0, rating, theme, sel: null, targets: [], last: null, think: true, over: null, failed: false, done: false, msg: "", mode: "solo", you: c.turn() === "w" ? "b" : "w" });
    this.paint(); const key = line; setTimeout(() => { if (this.s !== s || s.line !== key) return; this.play(line[0]); s.at = 1; s.think = false; this.paint(); }, s.kind === "rush" ? 500 : 1000);
  },
  play(u) { const s = this.s, m = s.c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || "q" }); if (m) { s.last = [m.from, m.to]; Snd.tick(); } return m; },
  paint() {
    const s = this.s; if (!s) return; if (s.kind === "eg") return this.egPaint(); const rush = s.kind === "rush", d = this.data();
    const head = rush ? `<div class="trhead"><b class="num" id="trClock">${this.mmss(s.left)}</b><span>Solved <b class="num">${s.score}</b></span><span class="trstrikes">${"✕".repeat(s.strikes)}${"·".repeat(3 - s.strikes)}</span></div>` : `<div class="trhead"><span>Your rating <b class="num">${d.r}</b></span><span>Puzzle ${s.rating} · ${s.done ? esc(s.theme) : "find the best move"}</span></div>`;
    const foot = rush ? "" : `<div class="row" style="gap:8px;margin-top:10px;flex-wrap:wrap">${s.done ? `<button type="button" class="btn" data-pz="next">Next puzzle</button>` : `<button type="button" class="btn ghost" data-pz="hint">Hint</button><button type="button" class="btn ghost" data-pz="solve">Show solution</button>`}</div>`;
    this.frame(rush ? "Puzzle rush" : "Puzzles", `${head}<div class="cpboard">${chessBoard(s)}</div><p class="trmsg" aria-live="polite">${s.msg || `You play ${s.you === "w" ? "White" : "Black"}.`}</p>${foot}<p class="fine">Puzzles from the Lichess puzzle database (CC0).</p>`);
  },
  click(sq) {
    const s = this.s; if (!s || s.think || s.over || s.done) return; const c = s.c; if (c.turn() !== s.you) return;
    if (s.sel && s.targets.includes(sq)) { const from = s.sel; s.sel = null; s.targets = []; return s.kind === "eg" ? this.egMove(from, sq) : this.tryMove(from, sq); }
    const pc = c.get(sq); if (pc && pc.color === c.turn()) { s.sel = sq; s.targets = c.moves({ square: sq, verbose: true }).map((m) => m.to); } else { s.sel = null; s.targets = []; }
    this.paint();
  },
  tryMove(from, to) {
    const s = this.s, want = s.line[s.at], m = s.c.move({ from, to, promotion: from + to === want.slice(0, 4) && want[4] ? want[4] : "q" }); if (!m) return;
    const right = from + to === want.slice(0, 4) || s.c.in_checkmate();   // any mate counts
    if (!right) {
      s.c.undo(); Snd.wrong(); if (typeof flashEdge === "function") flashEdge(false);
      if (s.kind === "rush") { s.strikes++; if (s.strikes >= 3) return this.rushEnd(); return this.nextPuzzle(); }
      s.msg = "Not that one. Try again."; this.rate(false); return this.paint();
    }
    s.last = [from, to]; s.at++; Snd.tick();
    if (s.at >= s.line.length || s.c.in_checkmate()) return this.solved();
    s.think = true; s.msg = "Good. Keep going."; this.paint(); const key = s.line;
    setTimeout(() => { if (this.s !== s || s.line !== key) return; this.play(s.line[s.at]); s.at++; s.think = false; if (s.at >= s.line.length) return this.solved(); this.paint(); }, s.kind === "rush" ? 500 : 900);
  },
  rate(win) {   // an Elo step once per puzzle: a hint, a wrong move or the solution counts as a miss
    const s = this.s, d = this.data(); if (s.kind !== "puzzles" || s.failed) return; if (!win) s.failed = true;
    const exp = 1 / (1 + Math.pow(10, (s.rating - d.r) / 400)); d.r = Math.max(400, Math.round(d.r + 32 * ((win ? 1 : 0) - exp))); saveProf();
  },
  solved() {
    const s = this.s; s.done = true; s.think = false; Snd.right(); if (typeof flashEdge === "function") flashEdge(true);
    if (s.kind === "rush") { s.score++; this.paint(); return setTimeout(() => { if (this.s === s && !s.over) this.nextPuzzle(); }, 350); }
    this.rate(true); if (!s.failed) { this.data().solved++; addXP(6, "chess"); Mascot.react("hit"); } saveProf(); s.msg = `Solved. ${esc(s.theme)}.`; this.paint();
  },
  hint() { const s = this.s; if (!s || s.done || s.think) return; this.rate(false); s.sel = s.line[s.at].slice(0, 2); s.targets = []; s.msg = "Move the highlighted piece."; s.targets = s.c.moves({ square: s.sel, verbose: true }).map((m) => m.to); this.paint(); },
  solve() {
    const s = this.s; if (!s || s.done || s.think) return; this.rate(false); s.think = true; s.sel = null; s.targets = []; s.msg = "Here is the line."; const key = s.line;
    const step = () => { if (this.s !== s || s.line !== key) return; if (s.at >= s.line.length) { s.done = true; s.think = false; return this.paint(); } this.play(s.line[s.at]); s.at++; this.paint(); setTimeout(step, 700); };
    step();
  },
  rushEnd() {
    const s = this.s; clearInterval(this.clock); s.over = true; const d = this.data(), best = s.score > d.rush; if (best) d.rush = s.score; saveProf();
    if (s.score) { addXP(Math.min(60, s.score * 3), "chess"); Boards.record("chess:rush", s.score); }
    Mascot.react(best && s.score ? "best" : "over", true);
    this.frame("Puzzle rush", `<div class="cpover ${s.score ? "win" : "loss"}" style="position:static"><h3>${s.score} solved</h3><p class="fine">${best && s.score ? "New best!" : `Your best: ${d.rush}`}</p><div class="row" style="justify-content:center;gap:8px"><button type="button" class="btn" data-train="rush">Again</button></div></div><div id="boardBox"></div>`); Boards.paint("chess:rush", "solved");
  },

  /* ---------- endgame trainer ---------- */
  eg(id) {
    this.stop(); const e = ENDGAMES.find((x) => x.id === id), c = new Chess(e.fen);
    this.s = { kind: "eg", e, c, you: c.turn(), mode: "solo", sel: null, targets: [], last: null, think: false, over: null, n: 0, msg: "" }; Engine.boot(); this.egPaint();
  },
  egPaint() {
    const s = this.s, e = s.e;
    this.frame(e.name, `<div class="trhead"><span>Goal: ${GOAL[e.goal]}</span><span class="num">Move ${s.n}/${e.lim}</span></div><div class="cpboard">${chessBoard(s)}</div><p class="trmsg" aria-live="polite">${s.over ? s.over.text : s.think ? "Stockfish is thinking…" : s.msg || `You play ${s.you === "w" ? "White" : "Black"}.`}</p>
      <details class="trtip"><summary>How to do it</summary><p>${e.tip}</p></details><div class="row" style="gap:8px;margin-top:10px"><button type="button" class="btn" data-eg="${e.id}">${s.over ? "Try again" : "Restart"}</button><button type="button" class="btn ghost" data-train="endgames">All endings</button></div>`);
  },
  egEnd(win, text) { const s = this.s; s.over = { text: `${win ? "Done! " : ""}${text}` }; if (win) { const d = this.data(); if (!d.eg[s.e.id]) addXP(30, "chess"); d.eg[s.e.id] = todayKey(); saveProf(); Snd.win(); confetti(); Mascot.react("bighit", true); } else { Snd.wrong(); Mascot.react("miss", true); } this.egPaint(); },
  /* after any move: has the goal been reached or lost? */
  egCheck() {
    const s = this.s, c = s.c, e = s.e, board = c.board().flat().filter(Boolean), mine = (t) => board.some((p) => p.color === s.you && p.type === t), theirs = (t) => board.some((p) => p.color !== s.you && p.type === t);
    if (c.in_checkmate()) { this.egEnd(c.turn() !== s.you && e.goal !== "hold", c.turn() !== s.you ? "Checkmate." : "You got mated."); return true; }
    if (e.goal === "hold") {
      if (c.in_draw() || c.in_stalemate()) { this.egEnd(true, "The draw is yours."); return true; }
      if (theirs("q") && !mine("q") && c.turn() !== s.you) return false;
      if (theirs("q") && c.turn() === s.you && !c.moves({ verbose: true }).some((m) => m.captured === "q")) { this.egEnd(false, "The pawn became a queen and you can't take it."); return true; }
      if (!theirs("p") && !theirs("q")) { this.egEnd(true, "The pawn is gone: it's a draw."); return true; }
    } else {
      if (c.in_draw() || c.in_stalemate()) { this.egEnd(false, c.in_stalemate() ? "Stalemate: only a draw." : "Only a draw."); return true; }
      if (e.goal === "queen" && mine("q") && c.turn() === s.you) { this.egEnd(true, "The new queen survived: this wins."); return true; }
    }
    if (c.turn() === s.you && s.n >= e.lim) { if (e.goal === "hold") this.egEnd(true, "You held out."); else this.egEnd(false, "Out of moves."); return true; }
    return false;
  },
  async egMove(from, to) {
    const s = this.s; if (!s.c.move({ from, to, promotion: "q" })) return; s.last = [from, to]; s.n++; Snd.tick();
    if (this.egCheck()) return; s.think = true; this.egPaint(); const fen = s.c.fen();
    const [u] = await Promise.all([Engine.best(fen, 20, 600), new Promise((r) => setTimeout(r, 1000 + Math.random() * 800))]); if (this.s !== s || s.c.fen() !== fen) return;
    let m = u && u !== "(none)" ? s.c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || "q" }) : null;
    if (!m) { const all = s.c.moves({ verbose: true }); m = s.c.move(all.find((x) => x.captured) || rnd(all)); }
    s.think = false; if (m) s.last = [m.from, m.to]; if (!this.egCheck()) this.egPaint();
  },
};

/* ================= game review: Stockfish goes through your last game and grades every move ================= */
const Review = {
  s: null,
  GRADE: { best: ["Best", "#5ee6a8", "rv_best"], good: ["Good", "#9ec5ff", "rv_good"], inaccuracy: ["Inaccuracy", "#ffd23f", "rv_inaccuracy"], mistake: ["Mistake", "#ff9d3d", "rv_mistake"], blunder: ["Blunder", "#ff5d5d", "rv_blunder"] },
  async score(c) {   // centipawns for the side to move
    if (c.in_checkmate()) return { cp: -10000, best: null };
    if (c.in_draw() || c.in_stalemate()) return { cp: 0, best: null };
    Engine.info = ""; const best = await Engine.best(c.fen(), 20, 350), m = /score (cp|mate) (-?\d+)/.exec(Engine.info || "");
    return { cp: !m ? null : m[1] === "mate" ? Math.sign(+m[2] || -1) * (10000 - Math.abs(+m[2])) : +m[2], best };
  },
  win: (cp) => 1 / (1 + Math.pow(10, -cp / 400)),
  async start(game) {
    const moves = game.c.history({ verbose: true }); if (!moves.length) return;
    const you = game.mode === "solo" ? game.you : null, me = (this.s = { moves, rows: [], at: moves.length - 1, you, done: false });
    if (!(await Engine.boot())) return Train.frame("Game review", "<p>The engine could not start on this device.</p>");
    const c = new Chess(); let before = await this.score(c);
    for (let i = 0; i < moves.length; i++) {
      if (this.s !== me) return; if (!$(".trwrap") && i) return;   // left the screen
      if (i % 2 === 0) Train.frame("Game review", `<p class="sub">Stockfish is going through the game… move ${i + 1} of ${moves.length}</p><div class="meter"><i style="width:${(100 * i) / moves.length}%"></i></div>`);
      const m = moves[i], uci = m.from + m.to + (m.promotion || ""); c.move({ from: m.from, to: m.to, promotion: m.promotion }); const after = await this.score(c);
      const known = before.cp != null && after.cp != null, drop = known ? Math.max(0, this.win(before.cp) - this.win(-after.cp)) : 0;
      const g = before.best === uci || c.in_checkmate() ? "best" : drop > 0.3 ? "blunder" : drop > 0.2 ? "mistake" : drop > 0.1 ? "inaccuracy" : "good";
      me.rows.push({ g, drop: g === "best" ? 0 : drop, fen: c.fen(), san: m.san, from: m.from, to: m.to, color: m.color, better: before.best });
      before = after;
    }
    me.done = true; me.at = Math.max(0, me.rows.findIndex((r) => r.g === "blunder" && (!you || r.color === you))); this.paint(true);
  },
  accuracy(col) { const r = this.s.rows.filter((x) => x.color === col); return r.length ? Math.round((100 * r.reduce((a, x) => a + Math.exp(-4 * x.drop), 0)) / r.length) : 100; },
  paint(speak) {
    const s = this.s, r = s.rows[s.at], c = new Chess(r.fen), view = { c, mode: "solo", you: s.you || "w", over: true, think: false, sel: null, targets: [], last: [r.from, r.to] }, G = this.GRADE[r.g];
    const coach = ["vera", "bea", "pip"][s.at % 3], pool = (MASCOT_LINES[coach] || {})[G[2]] || [], line = pool.length ? pool[(s.at * 7) % pool.length] : "";
    const count = (col) => Object.entries(this.GRADE).map(([k, v]) => `<span style="color:${v[1]}">${s.rows.filter((x) => x.color === col && x.g === k).length} ${v[0].toLowerCase()}</span>`).join(" · ");
    Train.frame("Game review", `<div class="trhead"><span>White accuracy <b class="num">${this.accuracy("w")}%</b></span><span>Black accuracy <b class="num">${this.accuracy("b")}%</b></span></div>
      <div class="cpboard">${chessBoard(view)}</div>
      <p class="trmsg"><b>${Math.floor(s.at / 2) + 1}${r.color === "w" ? "." : "…"} ${esc(r.san)}</b> <span style="color:${G[1]};font-weight:800">${G[0]}</span>${r.g !== "best" && r.better ? ` <span class="fine">Stockfish preferred ${r.better.slice(0, 2)}–${r.better.slice(2, 4)}</span>` : ""}</p>
      <div class="trcoach"><span>${MASCOT_SVG[coach](r.g === "best" ? "happy" : r.g === "good" ? "calm" : "sad")}</span><p><b>${MASCOTS[coach].name}</b>${esc(line)}</p></div>
      <div class="row" style="gap:8px;justify-content:center"><button type="button" class="btn ghost" data-rv="prev">← Previous</button><button type="button" class="btn" data-rv="next">Next →</button></div>
      <div class="trmoves">${s.rows.map((x, i) => `<button type="button" data-rvat="${i}" class="${i === s.at ? "on" : ""}" style="--g:${this.GRADE[x.g][1]}">${i % 2 === 0 ? `${i / 2 + 1}. ` : ""}${esc(x.san)}</button>`).join("")}</div>
      <p class="fine">White: ${count("w")}<br>Black: ${count("b")}</p>`);
    if (speak && line) { try { if ((localStorage.getItem("gp_voice") || "1") === "1") Voice.say(coach, line); } catch (e) { /* no audio */ } }
  },
  go(i) { const s = this.s; if (!s || !s.done) return; s.at = Math.max(0, Math.min(s.rows.length - 1, i)); this.paint(true); },
};

document.addEventListener("click", (e) => {
  const sq = e.target.closest("[data-csq]"); if (sq && Train.s && $(".trwrap")) { Train.click(sq.dataset.csq); return; }
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.train) { Voice.stop(); if (t.dataset.train === "back") { Train.stop(); Review.s = null; document.body.classList.remove("ingame"); S.game = null; renderHub(); return; } Review.s = null; Train.open(t.dataset.train); return; }
  if (t.dataset.eg) { Train.eg(t.dataset.eg); return; }
  if (t.dataset.pz) { if (t.dataset.pz === "next") Train.nextPuzzle(); else if (t.dataset.pz === "hint") Train.hint(); else Train.solve(); return; }
  if (t.id === "cpReview" && CP.s) { const g = CP.s; CP.s = null; Train.stop(); Review.start(g); return; }
  if (t.dataset.rv) { Review.go(Review.s.at + (t.dataset.rv === "next" ? 1 : -1)); return; }
  if (t.dataset.rvat) { Review.go(+t.dataset.rvat); return; }
});
addEventListener("hashchange", () => { Train.stop(); Review.s = null; });
