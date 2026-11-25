/* ================= Play chess: against Stockfish or a friend on the same device =================
   Board, pieces and engine wrapper follow ballknowledge's chess page. Rules: chess.js (BSD). Engine: Stockfish 17.1 lite
   (GPL-3, served from engine/, source and licence in engine/COPYING.txt), with Stockfish 10 from a CDN as the fallback. */
const SF17 = "engine/stockfish-17.1-lite-single.js", SF10 = "https://cdn.jsdelivr.net/npm/stockfish.js@10.0.2/stockfish.js";
const Engine = {
  w: null, ready: null, cb: null,
  boot() {
    if (this.ready) return this.ready;
    this.ready = new Promise((res) => {
      const start = (modern) => {
        try { this.w = modern ? new Worker(SF17) : new Worker(URL.createObjectURL(new Blob([`importScripts("${SF10}");`], { type: "text/javascript" }))); } catch (e) { if (modern) return start(false); return res(false); }
        const to = setTimeout(() => { try { this.w.terminate(); } catch (e) { /* gone */ } if (modern) start(false); else res(false); }, modern ? 15000 : 25000);
        this.w.onmessage = (e) => { const s = String(e.data); if (s.startsWith("info") && s.includes(" score ")) this.info = s; if (s === "uciok") this.w.postMessage("isready"); else if (s === "readyok") { clearTimeout(to); res(true); } else if (s.startsWith("bestmove") && this.cb) { const c = this.cb; this.cb = null; c(s.split(" ")[1]); } };
        this.w.onerror = () => { clearTimeout(to); if (modern) start(false); else res(false); };
        this.w.postMessage("uci");
      };
      start(location.protocol !== "file:");
    });
    return this.ready;
  },
  async best(fen, skill, ms) {
    const ok = await this.boot(); if (!ok) return null;
    return new Promise((res) => { this.cb = res; this.w.postMessage("setoption name Skill Level value " + skill); this.w.postMessage("position fen " + fen); this.w.postMessage("go movetime " + ms); });
  },
};
const CP = { s: null };
const CLEVEL = { easy: [0, 150, "Pip (beginner)"], medium: [5, 300, "Queen Vera (club player)"], hard: [12, 600, "Bishop Bea (strong)"], elite: [20, 1200, "Stockfish at full strength"] };
const PVAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
function newChessPlay(mode) {
  if (typeof Chess === "undefined") { $("#room").innerHTML = `<div class="card">${gamesBar("Play chess")}<p>The chess rules could not load (offline?). Try again in a moment.</p></div>`; return; }
  const p = prof(), you = mode === "solo" ? (p.lastColor === "w" ? "b" : "w") : "w"; p.lastColor = you; saveProf();
  CP.s = { mode, c: new Chess(), you, sel: null, targets: [], last: null, think: false, over: null, lvl: S.diff, hist: [] };
  if (mode === "solo") Engine.boot();
  renderChess(); if (mode === "solo" && you === "b") setTimeout(cpEngine, 400);
}
function chessBoard(s) {
  const c = s.c, b = c.board(), flip = s.mode === "solo" ? s.you === "b" : false, order = flip ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]; let h = "";
  const myTurn = !s.over && !s.think && (s.mode === "duo" || c.turn() === s.you), caps = s.targets.filter((t) => c.get(t));
  order.forEach((r, ri) => order.forEach((f, fi) => { const pc = b[r][f], sq = "abcdefgh"[f] + (8 - r), own = myTurn && pc && pc.color === c.turn(), chk = pc && pc.type === "k" && pc.color === c.turn() && c.in_check();
    h += `<i data-csq="${sq}" ${own ? 'data-own="1"' : ""} class="${(r + f) % 2 ? "d" : "l"} ${s.sel === sq ? "sel" : ""} ${s.targets.includes(sq) ? "tgt" : ""} ${caps.includes(sq) ? "cap" : ""} ${s.last && s.last.includes(sq) ? "last" : ""} ${chk ? "chk" : ""}">${pc ? `<b class="pcz pc-${pc.color}${pc.type}"></b>` : ""}${fi === 0 ? `<span class="co r">${8 - r}</span>` : ""}${ri === 7 ? `<span class="co f">${"abcdefgh"[f]}</span>` : ""}</i>`; }));
  return `<div class="board play">${h}</div>`;
}
function capturedOf(c, color) { const have = { p: 0, n: 0, b: 0, r: 0, q: 0 }; c.board().flat().forEach((p) => { if (p && p.color === color && have[p.type] != null) have[p.type]++; }); const full = { p: 8, n: 2, b: 2, r: 2, q: 1 }; return Object.keys(full).flatMap((t) => Array(Math.max(0, full[t] - have[t])).fill(t)); }
function renderChess() {
  const s = CP.s, c = s.c, names = NAMES(), lv = CLEVEL[s.lvl], solo = s.mode === "solo";
  const who = (col) => (solo ? (col === s.you ? prof().nick || "You" : lv[2]) : names[col === "w" ? 0 : 1]);
  const lost = (col) => capturedOf(c, col), mat = (col) => lost(col === "w" ? "b" : "w").reduce((a, t) => a + PVAL[t], 0) - lost(col).reduce((a, t) => a + PVAL[t], 0);
  const bar = (col) => `<div class="cpbar ${c.turn() === col && !s.over ? "on" : ""}"><span class="cpdot ${col}"></span><b>${esc(who(col))}</b><span class="cpcap">${lost(col === "w" ? "b" : "w").map((t) => `<i class="pcz pc-${col === "w" ? "b" : "w"}${t}"></i>`).join("")}${mat(col) > 0 ? ` +${mat(col)}` : ""}</span></div>`;
  const top = solo ? (s.you === "w" ? "b" : "w") : "b", bottom = top === "w" ? "b" : "w";
  const status = s.over ? "" : s.think ? `${esc(lv[2].split(" (")[0])} is thinking…` : c.in_check() ? "Check!" : solo ? (c.turn() === s.you ? "Your move." : "") : `${esc(who(c.turn()))} to move.`;
  const moves = c.history(); let ml = ""; for (let i = 0; i < moves.length; i += 2) ml += `<span><small>${i / 2 + 1}.</small> ${esc(moves[i])} ${moves[i + 1] ? esc(moves[i + 1]) : ""}</span>`;
  const over = s.over ? `<div class="cpover ${s.over.cls}"><h3>${esc(s.over.title)}</h3><p class="fine">${esc(s.over.why)}</p><div class="row" style="justify-content:center;gap:8px"><button class="btn" id="cpAgain" type="button">Play again</button><button class="btn ghost" id="cpReview" type="button">Review game</button></div></div>` : "";
  $("#room").innerHTML = `<div class="card cpwrap">${gamesBar(solo ? `Play chess · ${esc(lv[2])}` : "Play chess · two players")}${bar(top)}<div class="cpboard">${chessBoard(s)}${over}</div>${bar(bottom)}
    <div class="row" style="justify-content:space-between;margin-top:8px;flex-wrap:wrap;gap:8px"><span class="fine">${status}</span><span class="row" style="gap:6px"><button class="btn ghost" id="cpUndo" type="button" ${!moves.length || s.think || s.over ? "disabled" : ""}>Undo</button><button class="btn ghost" id="cpResign" type="button" ${s.over ? "disabled" : ""}>${solo ? "Resign" : "Offer draw / resign"}</button></span></div>
    <div class="cpmoves">${ml || `<span class="fine">${solo ? `You have ${s.you === "w" ? "White" : "Black"}. Tap a piece, then a square.` : "White starts. Tap a piece, then a square. Pass the device after each move."}</span>`}</div><p class="fine" style="margin-top:8px">Engine: Stockfish (free software, GPL), running in your browser. Pieces: cburnett set (CC BY-SA 3.0).</p></div>`;
  const ml2 = $(".cpmoves"); if (ml2) ml2.scrollLeft = ml2.scrollWidth;
}
function cpCheckEnd() {
  const s = CP.s, c = s.c; if (!c.game_over()) return false; const solo = s.mode === "solo", names = NAMES();
  if (c.in_checkmate()) { const winner = c.turn() === "w" ? "b" : "w", won = solo && winner === s.you; s.over = { cls: solo ? (won ? "win" : "loss") : "win", title: solo ? (won ? "You win!" : "Checkmate. You lost.") : `${names[winner === "w" ? 0 : 1]} wins!`, why: "Checkmate." };
    if (!solo || won) { Snd.win(); confetti(); addXP(solo ? { easy: 20, medium: 40, hard: 80, elite: 150 }[s.lvl] : 30, "chess"); Mascot.react("bighit", true); if (solo && s.lvl === "elite") award("elite_win"); if (!solo) award("duo"); } else { Snd.wrong(); Mascot.react("over", true); } }
  else { s.over = { cls: "draw", title: "Draw", why: c.in_stalemate() ? "Stalemate." : c.in_threefold_repetition() ? "Threefold repetition." : c.insufficient_material() ? "Not enough pieces left to mate." : "Fifty-move rule." }; addXP(10, "chess"); }
  if (solo) { const p = prof(); p.chessRec = p.chessRec || { w: 0, d: 0, l: 0 }; p.chessRec[s.over.cls === "win" ? "w" : s.over.cls === "loss" ? "l" : "d"]++; saveProf(); }
  return true;
}
function cpMove(from, to) {
  const s = CP.s, m = s.c.move({ from, to, promotion: "q" }); if (!m) return false;
  s.last = [from, to]; s.sel = null; s.targets = []; Snd.tick(); if (m.captured) Snd.lock();
  if (!cpCheckEnd() && s.mode === "solo" && s.c.turn() !== s.you) { s.think = true; renderChess(); setTimeout(cpEngine, 200); } else renderChess();
  return true;
}
async function cpEngine() {
  const s = CP.s; if (!s || s.over) return; s.think = true; const lv = CLEVEL[s.lvl], fen = s.c.fen();
  let u = await Engine.best(fen, lv[0], lv[1]);
  if (CP.s !== s || s.c.fen() !== fen) return;
  let m = u && u !== "(none)" ? s.c.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] || "q" }) : null;
  if (!m) { const all = s.c.moves({ verbose: true }); const caps = all.filter((x) => x.captured).sort((a, b) => PVAL[b.captured] - PVAL[a.captured]); m = s.c.move(caps[0] || rnd(all)); }   // no engine: a simple capture-first fallback
  s.think = false; if (m) { s.last = [m.from, m.to]; Snd.tick(); } cpCheckEnd(); renderChess();
}
function chessClick(sq) {
  const s = CP.s; if (!s || s.over || s.think) return; const c = s.c; if (s.mode === "solo" && c.turn() !== s.you) return;
  if (s.sel && s.targets.includes(sq)) { cpMove(s.sel, sq); return; }
  const pc = c.get(sq); if (pc && pc.color === c.turn()) { s.sel = sq; s.targets = c.moves({ square: sq, verbose: true }).map((m) => m.to); } else { s.sel = null; s.targets = []; }
  renderChess();
}
document.addEventListener("click", (e) => {
  const sq = e.target.closest("[data-csq]"); if (sq && CP.s && $(".cpwrap")) { chessClick(sq.dataset.csq); return; }
  const t = e.target.closest("button"); if (!t || !CP.s) return;
  if (t.id === "cpAgain") { newChessPlay(CP.s.mode); return; }
  if (t.id === "cpUndo") { const s = CP.s; s.c.undo(); if (s.mode === "solo" && s.c.turn() !== s.you) s.c.undo(); s.sel = null; s.targets = []; s.last = null; renderChess(); return; }
  if (t.id === "cpResign") { const s = CP.s, solo = s.mode === "solo"; if (solo) { s.over = { cls: "loss", title: "You resigned", why: "Another one?" }; const p = prof(); p.chessRec = p.chessRec || { w: 0, d: 0, l: 0 }; p.chessRec.l++; saveProf(); Mascot.react("over", true); } else s.over = { cls: "draw", title: "Game over", why: "Ended by agreement." }; renderChess(); return; }
});
