/* ================= Play chess: against the characters, Stockfish, or a friend on the same device =================
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
/* who you can play: the characters brought over from ballknowledge (site/bk_bots.js), and plain Stockfish at full strength */
const CPOPP = [...BKBots.BOTS.map((b) => ({ ...b, elo: BKBots.ELO[b.id] })),
  { id: "stockfish", name: "Stockfish", tag: "Full strength", style: ["No character", "No mercy"], desc: "The engine on its own, as strong as it gets in a browser." }];
const cpOpp = (id) => CPOPP.find((o) => o.id === id) || CPOPP[0];
const CPXP = { pip: 20, arteta: 40, berserker: 40, bea: 40, trader: 80, escaped: 80, council: 110, vera: 110, stockfish: 150 };
const cpFace = (id, mood) => (id === "stockfish" ? `<span class="cpsf">♞</span>` : BKBots.face(id, mood || "calm"));
const PVAL = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
/* ---------- the clock (solo games), as on ballknowledge: none, 3, 5 or 10 minutes each ---------- */
const CPCLOCKS = [[0, "No clock"], [180, "3 min"], [300, "5 min"], [600, "10 min"]];
const cpTime = (ms) => { const t = Math.max(0, ms) / 1000; return t < 20 ? t.toFixed(1) : `${Math.floor(Math.ceil(t) / 60)}:${String(Math.ceil(t) % 60).padStart(2, "0")}`; };
/* take the time since the last look off the side to move; nothing runs until both sides have made their first move. True if that side's flag fell */
function cpCharge(s) {
  const now = performance.now(), gone = now - s.stamp; s.stamp = now;
  if (!s.clock || s.over || s.c.history().length < 2) return false;
  const side = s.c.turn(); s.ms[side] -= gone;
  if (s.ms[side] > 0) return false;
  s.ms[side] = 0; cpFlag(s, side); return true;
}
function cpFlag(s, side) {
  const winner = side === "w" ? "b" : "w";
  const left = s.c.board().flat().filter((p) => p && p.color === winner && p.type !== "k").map((p) => p.type);
  s.think = false; s.sel = null; s.targets = [];
  if (!left.length || (left.length === 1 && "nb".includes(left[0]))) { s.over = { cls: "draw", title: "Draw", why: "Time ran out, but there is not enough left to mate." }; addXP(10, "chess"); }
  else if (winner === s.you) { s.over = { cls: "win", title: "You win!", why: "On time." }; Snd.win(); confetti(); addXP(CPXP[s.bot], "chess"); Mascot.react("ch_win", true); if (s.bot === "stockfish") award("elite_win"); }
  else { s.over = { cls: "loss", title: "You lost on time.", why: "On time." }; Snd.wrong(); Mascot.react("ch_loss", true); }
  cpRecord(s); renderChess(); cpLastWord();
}
function cpTick(s) {
  if (CP.s !== s || !$(".cpwrap") || s.over) { clearInterval(s.timer); return; }
  if (cpCharge(s)) { clearInterval(s.timer); return; }
  document.querySelectorAll(".cpclk").forEach((el) => { const v = s.ms[el.dataset.side]; el.textContent = cpTime(v); el.classList.toggle("low", v < 20000); });
}
/* ---------- how long a bot takes: each has its own tempo; quicker in the opening, after a capture or with one legal move ---------- */
const CPTEMPO = { pip: [1200, 2600], arteta: [2200, 4800], berserker: [1100, 2600], bea: [2000, 4200], trader: [1500, 3400], escaped: [900, 4000], council: [2800, 5600], vera: [2200, 4400], stockfish: [1500, 3200] };
function cpThinkMs(s) {
  const [lo, hi] = CPTEMPO[s.bot] || [1500, 3000], n = s.c.history().length, last = s.c.history({ verbose: true }).pop();
  let ms = lo + Math.random() * (hi - lo);
  if (n < 8) ms *= 0.65; else if (last && last.captured) ms *= 0.7; else if (n > 14 && Math.random() < 0.12) ms += 2500;
  if (s.c.moves().length === 1) ms = 900;
  ms = Math.max(1000, ms);
  return s.clock ? Math.min(ms, Math.max(300, s.ms[s.c.turn()] / 30)) : ms;   /* never think itself out of time */
}
/* the piece that just moved glides from its old square (the rook too, when castling) */
function cpSlide(from, to) {
  const a = document.querySelector(`.cpwrap [data-csq="${from}"]`), b = document.querySelector(`.cpwrap [data-csq="${to}"]`), p = b && b.querySelector(".pcz");
  if (!a || !p || !p.animate || (typeof REDUCED !== "undefined" && REDUCED)) return;
  const x = a.getBoundingClientRect(), y = b.getBoundingClientRect();
  p.style.zIndex = 4; p.animate([{ transform: `translate(${x.left - y.left}px, ${x.top - y.top}px)` }, { transform: "none" }], { duration: 220, easing: "ease-out" });
}
function cpAnimate(s) {
  const key = s.c.fen() + String(s.last);
  if (!s.last || s.slid === key) return; s.slid = key;
  if (s.dropped) { s.dropped = false; return; }   /* you dragged it there yourself */
  cpSlide(s.last[0], s.last[1]);
  const king = s.c.get(s.last[1]);
  if (king && king.type === "k" && Math.abs(s.last[0].charCodeAt(0) - s.last[1].charCodeAt(0)) === 2) { const r = s.last[1][1], short = s.last[1][0] === "g"; cpSlide((short ? "h" : "a") + r, (short ? "f" : "d") + r); }
}
/* resigning or walking out of a running game takes a second tap */
function cpSure(btn, label) {
  if (btn.dataset.sure) return true;
  const was = btn.textContent; btn.dataset.sure = "1"; btn.textContent = label; btn.classList.add("cpwarn");
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.sure; btn.textContent = was; btn.classList.remove("cpwarn"); } }, 3000);
  return false;
}
const cpRunning = () => { const s = CP.s; return !!(s && !s.over && s.c.history().length > 1 && $(".cpwrap:not(.trwrap)")); };
function newChessPlay(mode, bot) {
  if (typeof Chess === "undefined") { $("#room").innerHTML = `<div class="card">${gamesBar("Play chess")}<p>The chess rules could not load (offline?). Try again in a moment.</p></div>`; return; }
  Voice.stop();
  if (mode === "solo" && !bot) { CP.s = null; return renderOpponents(); }
  const p = prof(), you = mode === "solo" ? (p.lastColor === "w" ? "b" : "w") : "w"; p.lastColor = you; if (bot) p.chessBot = bot; saveProf();
  const s = (CP.s = { mode, c: new Chess(), you, sel: null, targets: [], last: null, think: false, over: null, bot: mode === "solo" ? bot : null, say: null, talk: BKBots.TALK.fresh(false), note: "" });
  s.clock = mode === "solo" ? p.chessClock || 0 : 0; s.ms = { w: s.clock * 1000, b: s.clock * 1000 }; s.stamp = performance.now();
  if (s.clock) s.timer = setInterval(() => cpTick(s), 100);
  if (mode === "solo") Engine.boot();
  s.think = mode === "solo" && you === "b";
  renderChess();
  const card = $(".cpwrap"); if (card) card.scrollIntoView({ block: "start" });
  if (s.think) setTimeout(cpEngine, 400);
  if (cpTalks(s)) setTimeout(() => { if (CP.s === s) cpSay("start", () => { if (!s.over && s.c.history().length < 6) cpSay("rival", () => { const y = s.say; if (y && y.face !== s.bot && s.bot !== "council") { s.say = null; const el = $("#cpSay"); if (el) el.innerHTML = cpSayHTML(s); } }); }); }, 900);
}
function renderOpponents() {
  const p = prof(), rec = p.chessVs || {};
  const card = (o) => { const r = rec[o.id]; return `<button type="button" class="cpopp ${p.chessBot === o.id ? "on" : ""}" data-bot="${o.id}"><span class="cpav">${cpFace(o.id, "happy")}</span><b>${esc(o.name)}</b><span class="cpelo num">${o.elo || "Max"}<small>${o.elo ? "Elo" : "strength"}</small></span><span class="cptag">${esc(o.tag)}</span><span class="cpstyle">${o.style.map((t) => `<i>${esc(t)}</i>`).join("")}</span><span class="fine">${esc(o.desc)}</span>${r ? `<span class="cprec num">You: ${r.w} won · ${r.d} drawn · ${r.l} lost</span>` : ""}</button>`; };
  $("#room").innerHTML = `<div class="card">${gamesBar("Choose your opponent")}<p class="sub">Eight characters, each with their own way of playing and their own voice, brought over from ballknowledge. The ratings were measured there from how they play master-game positions (Lichess scale; chess.com runs a little lower at club level).</p><div class="label">Clock</div><div class="row" style="gap:8px;margin-top:8px;flex-wrap:wrap" role="group" aria-label="Clock">${CPCLOCKS.map(([sec, n]) => `<button type="button" class="chip" data-secs="${sec}" aria-pressed="${(p.chessClock || 0) === sec}">${n}</button>`).join("")}</div><p class="fine" style="margin-top:6px">Time for each side. The clock starts after both first moves.</p><div class="cpgrid">${CPOPP.map(card).join("")}</div></div>`;
}
/* ---------- what the character says ---------- */
const cpTalks = (s) => s && s.mode === "solo" && !!BKBots.LINES[s.bot];
const cpCoach = () => { const m = Mascot.id(); return COACHES[m] ? m : "pip"; };
function cpPick(kind) {
  const s = CP.s, L = BKBots.LINES[s.bot];
  let pool = [...(L[kind] || [])];
  if (s.bot === "escaped" && kind === "my_sac") pool.push(...(L.trait || []));   /* his older sacrifice lines join the new ones */
  if (/_mate$/.test(kind)) pool.push(...(L[kind.split("_")[0]] || []));
  if (kind === "rival") pool = pool.filter((x) => x[0] === cpCoach());
  if (!pool.length) return null;
  const pick = BKBots.fresh(s.bot, kind, pool), who = Array.isArray(pick) ? pick[0] : s.bot;
  return { who, text: Array.isArray(pick) ? pick[1] : pick, name: kind === "rival" ? COACHES[who].name : s.bot === "council" ? `${COACHES[who].name} of the Council` : cpOpp(s.bot).name, face: kind === "rival" || s.bot === "council" ? who : s.bot };
}
function cpSayHTML(s) { const y = s.say, o = cpOpp(s.bot); return `<span class="cpav">${cpFace(y ? y.face : s.bot)}</span><p><b>${esc(y ? y.name : o.name)}</b>${y ? esc(y.text) : esc(o.tag || "")}</p>`; }
function cpSay(kind, done) {
  const s = CP.s; if (!cpTalks(s) || !$(".cpwrap.vsbot")) return; const p = cpPick(kind); if (!p) return;
  s.say = p; const el = $("#cpSay"); if (el) el.innerHTML = cpSayHTML(s);
  const wait = Math.min(9000, 1200 + p.text.length * 60); s.talkUntil = performance.now() + wait;
  const after = () => { if (done && CP.s === s && $(".cpwrap.vsbot")) done(); };
  let voice = false; try { voice = (localStorage.getItem("gp_voice") || "1") === "1"; } catch (e) { /* blocked */ }
  (voice ? Voice.say("bk_" + p.who, p.text) : Promise.resolve(false)).then((ok) => { const secs = ok && Voice.src && Voice.src.buffer ? Voice.src.buffer.duration * 1000 + 300 : wait; if (ok) s.talkUntil = performance.now() + secs; if (done) setTimeout(after, secs); });
}
/* after every half-move: what did the character notice? (ballknowledge's botWatch) */
function cpWatch() {
  const s = CP.s; if (!cpTalks(s) || s.over) return; const T = BKBots.TALK;
  const H = s.c.history({ verbose: true }), n = H.length, S_ = s.talk; if (!n || S_.seen === n) return; S_.seen = n;
  const walk = new Chess(), fens = [walk.fen()]; H.forEach((x) => { walk.move({ from: x.from, to: x.to, promotion: x.promotion }); fens.push(walk.fen()); });
  const theirs = s.you === "w" ? "b" : "w";   /* the character's colour */
  const F = T.facts(H, fens, theirs);
  F.quietChance = new Chess(fens[n - 1]).moves({ verbose: true }).some((z) => z.captured && BKBots.BV[z.captured] >= 3);
  const evalOf = (k) => (S_.evals[k] = S_.evals[k] || T.look(fens[k], theirs).catch(() => null));
  const both = Promise.all([evalOf(n - 1), evalOf(n)]), slow = new Promise((res) => setTimeout(() => res([null, null]), 3000));
  S_.chain = (S_.chain || Promise.resolve()).then(() => Promise.race([both, slow])).then(([a, b]) => {
    if (CP.s !== s || s.over || s.c.history().length - n > 2 || s.c.history().length < n) return;
    const list = T.events(F, T.judge(a, b, F.m, theirs, F.mine), S_, s.bot), L = BKBots.LINES[s.bot];
    if (S_.lines >= T.MAX_LINES) return;
    for (const ev of list) {
      const pri = T.PRI[ev], kind = [ev, ...(BKBots.ALSO[ev] || [])].find((k) => L[k] && L[k].length);
      if (!kind || n - S_.last < T.GAP[pri]) continue;
      if (performance.now() < (s.talkUntil || 0) && pri <= (s.talkPri || 0)) return;   /* do not talk over a line that matters as much */
      if (ev === "story" || ev === "taunt") { if (Math.random() < 0.45) return; S_.chat++; }
      S_.said[ev] = (S_.said[ev] || 0) + 1; S_.lines++; S_.last = n; s.talkPri = pri;
      const named = s.bot === "arteta" ? T.playerKind(ev, H, theirs) : null;
      cpSay(named && L[named] ? named : kind);
      return;
    }
  }).catch(() => { /* talk never breaks a game */ });
}
/* the last word, from the character's side */
function cpLastWord() {
  const s = CP.s; if (!cpTalks(s)) return; const o = s.over, base = o.cls === "win" ? "lose" : o.cls === "loss" ? "win" : "draw", L = BKBots.LINES[s.bot];
  const k = base === "draw" ? (o.why === "Stalemate." ? "stalemate" : "draw") : o.why === "Checkmate." ? base + "_mate" : o.why === "On time." ? base + "_time" : base;
  setTimeout(() => { if (CP.s === s) cpSay(L[k] ? k : base); }, 600);
}
function chessBoard(s) {
  const c = s.c, b = c.board(), flip = s.mode === "solo" ? s.you === "b" : false, order = flip ? [7, 6, 5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5, 6, 7]; let h = "";
  const myTurn = !s.over && !s.think && (s.mode === "duo" || c.turn() === s.you), caps = s.targets.filter((t) => c.get(t));
  order.forEach((r, ri) => order.forEach((f, fi) => { const pc = b[r][f], sq = "abcdefgh"[f] + (8 - r), own = myTurn && pc && pc.color === c.turn(), chk = pc && pc.type === "k" && pc.color === c.turn() && c.in_check();
    h += `<i data-csq="${sq}" tabindex="0" role="button" aria-label="${sq}${pc ? ` ${pc.color === "w" ? "white" : "black"} ${{ p: "pawn", n: "knight", b: "bishop", r: "rook", q: "queen", k: "king" }[pc.type]}` : " empty"}" ${own ? 'data-own="1"' : ""} class="${(r + f) % 2 ? "d" : "l"} ${s.sel === sq ? "sel" : ""} ${s.targets.includes(sq) ? "tgt" : ""} ${caps.includes(sq) ? "cap" : ""} ${s.last && s.last.includes(sq) ? "last" : ""} ${chk ? "chk" : ""}">${pc ? `<b class="pcz pc-${pc.color}${pc.type}"></b>` : ""}${fi === 0 ? `<span class="co r">${8 - r}</span>` : ""}${ri === 7 ? `<span class="co f">${"abcdefgh"[f]}</span>` : ""}</i>`; }));
  return `<div class="board play">${h}</div>`;
}
function capturedOf(c, color) { const have = { p: 0, n: 0, b: 0, r: 0, q: 0 }; c.board().flat().forEach((p) => { if (p && p.color === color && have[p.type] != null) have[p.type]++; }); const full = { p: 8, n: 2, b: 2, r: 2, q: 1 }; return Object.keys(full).flatMap((t) => Array(Math.max(0, full[t] - have[t])).fill(t)); }
function renderChess() {
  const s = CP.s, c = s.c, names = NAMES(), solo = s.mode === "solo", opp = solo ? cpOpp(s.bot) : null;
  const who = (col) => (solo ? (col === s.you ? prof().nick || "You" : opp.name + (opp.elo ? ` · ${opp.elo}` : "")) : names[col === "w" ? 0 : 1]);
  const lost = (col) => capturedOf(c, col), mat = (col) => lost(col === "w" ? "b" : "w").reduce((a, t) => a + PVAL[t], 0) - lost(col).reduce((a, t) => a + PVAL[t], 0);
  const bar = (col) => `<div class="cpbar ${c.turn() === col && !s.over ? "on" : ""}"><span class="cpdot ${col}"></span><b>${esc(who(col))}</b>${solo && s.think && col !== s.you ? `<span class="cpthink" aria-label="thinking"><i></i><i></i><i></i></span>` : ""}<span class="cpcap">${lost(col === "w" ? "b" : "w").map((t) => `<i class="pcz pc-${col === "w" ? "b" : "w"}${t}"></i>`).join("")}${mat(col) > 0 ? ` +${mat(col)}` : ""}</span>${s.clock ? `<span class="cpclk num ${s.ms[col] < 20000 ? "low" : ""}" data-side="${col}">${cpTime(s.ms[col])}</span>` : ""}</div>`;
  const top = solo ? (s.you === "w" ? "b" : "w") : "b", bottom = top === "w" ? "b" : "w";
  const status = s.over ? "" : s.think ? `${esc(opp.name)} is thinking…` : c.in_check() ? "Check!" : solo ? (c.turn() === s.you ? "Your move." : "") : `${esc(who(c.turn()))} to move.`;
  const moves = c.history(); let ml = ""; for (let i = 0; i < moves.length; i += 2) ml += `<span><small>${i / 2 + 1}.</small> ${esc(moves[i])} ${moves[i + 1] ? esc(moves[i + 1]) : ""}</span>`;
  const over = s.over ? `<div class="cpover ${s.over.cls}"><h3>${esc(s.over.title)}</h3><p class="fine">${esc(s.over.why)}</p><div class="row" style="justify-content:center;gap:8px"><button class="btn" id="cpAgain" type="button">Play again</button>${solo ? `<button class="btn ghost" id="cpChange" type="button">Change opponent</button>` : ""}<button class="btn ghost" id="cpReview" type="button">Review game</button></div></div>` : "";
  $("#room").innerHTML = `<div class="card cpwrap ${cpTalks(s) ? "vsbot" : ""}">${gamesBar(solo ? `Play chess · ${esc(opp.name)}` : "Play chess · two players")}${cpTalks(s) ? `<div class="cpsay" id="cpSay" role="status">${cpSayHTML(s)}</div>` : ""}${bar(top)}<div class="cpboard">${chessBoard(s)}${over}${s.promo ? `<div class="cppromo" role="dialog" aria-label="Choose a piece">${["q", "r", "b", "n"].map((k) => `<button type="button" data-promo="${k}" aria-label="${{ q: "Queen", r: "Rook", b: "Bishop", n: "Knight" }[k]}"><i class="pcz pc-${c.turn()}${k}"></i></button>`).join("")}<button type="button" class="btn ghost" data-promo="x">Cancel</button></div>` : ""}</div>${bar(bottom)}
    <div class="row" style="justify-content:space-between;margin-top:8px;flex-wrap:wrap;gap:8px"><span class="fine">${s.note ? esc(s.note) + " " : ""}${status}</span><span class="row" style="gap:6px">${solo && !s.over ? `<button class="btn ghost" id="cpChange" type="button">Opponent</button>` : ""}<button class="btn ghost" id="cpUndo" type="button" ${moves.length < (solo && s.you === "b" ? 2 : 1) || s.think || s.over ? "disabled" : ""}>Undo</button>${solo ? "" : `<button class="btn ghost" id="cpDraw" type="button" ${s.over ? "disabled" : ""}>Draw</button>`}<button class="btn ghost" id="cpResign" type="button" ${s.over ? "disabled" : ""}>Resign</button></span></div>
    <div class="cpmoves">${ml || `<span class="fine">${solo ? `You have ${s.you === "w" ? "White" : "Black"}. Tap a piece, then a square.` : "White starts. Tap a piece, then a square. Pass the device after each move."}</span>`}</div><p class="fine" style="margin-top:8px">Engine: Stockfish (free software, GPL), running in your browser. Pieces: cburnett set (CC BY-SA 3.0).</p></div>`;
  const ml2 = $(".cpmoves"); if (ml2) ml2.scrollLeft = ml2.scrollWidth;
  cpAnimate(s);
}
function cpRecord(s) {
  const p = prof(), k = s.over.cls === "win" ? "w" : s.over.cls === "loss" ? "l" : "d";
  p.chessRec = p.chessRec || { w: 0, d: 0, l: 0 }; p.chessRec[k]++;
  p.chessVs = p.chessVs || {}; (p.chessVs[s.bot] = p.chessVs[s.bot] || { w: 0, d: 0, l: 0 })[k]++; saveProf();
}
function cpCheckEnd() {
  const s = CP.s, c = s.c; if (!c.game_over()) return false; const solo = s.mode === "solo", names = NAMES();
  if (c.in_checkmate()) { const winner = c.turn() === "w" ? "b" : "w", won = solo && winner === s.you; s.over = { cls: solo ? (won ? "win" : "loss") : "win", title: solo ? (won ? "You win!" : "Checkmate. You lost.") : `${names[winner === "w" ? 0 : 1]} wins!`, why: "Checkmate." };
    if (!solo || won) { Snd.win(); confetti(); addXP(solo ? CPXP[s.bot] : 30, "chess"); Mascot.react(solo ? "ch_win" : "duo_end", true); if (solo && s.bot === "stockfish") award("elite_win"); if (!solo) award("duo"); } else { Snd.wrong(); Mascot.react("ch_loss", true); } }
  else { s.over = { cls: "draw", title: "Draw", why: c.in_stalemate() ? "Stalemate." : c.in_threefold_repetition() ? "Threefold repetition." : c.insufficient_material() ? "Not enough pieces left to mate." : "Fifty-move rule." }; addXP(10, "chess"); Mascot.react("ch_draw", true); }
  if (solo) { cpRecord(s); cpLastWord(); }
  return true;
}
function cpMove(from, to, piece) {
  const s = CP.s; if (cpCharge(s)) return false;
  const pawn = s.c.get(from);
  if (!piece && pawn && pawn.type === "p" && /[18]$/.test(to) && s.c.moves({ square: from, verbose: true }).some((x) => x.to === to)) { s.promo = { from, to }; s.sel = null; s.targets = []; s.dropped = false; renderChess(); return true; }
  const m = s.c.move({ from, to, promotion: piece || "q" }); if (!m) return false;
  s.promo = null; s.last = [from, to]; s.sel = null; s.targets = []; Snd.tick(); if (m.captured) Snd.lock();
  if (!cpCheckEnd() && s.mode === "solo" && s.c.turn() !== s.you) { s.think = true; renderChess(); setTimeout(cpEngine, 200); } else renderChess();
  cpWatch();
  return true;
}
async function cpEngine() {
  const s = CP.s; if (!s || s.over || !$(".cpwrap")) return; s.think = true; const fen = s.c.fen(), t0 = performance.now(), want = cpThinkMs(s);
  let mv = null;
  try {
    if (s.bot === "stockfish") { const u = await Engine.best(fen, 20, 1200); if (u && u !== "(none)") mv = { from: u.slice(0, 2), to: u.slice(2, 4), promotion: u[4] }; }
    else if (s.bot === "pip") mv = BKBots.smallMove(fen);
    else mv = await BKBots.move(BKBots.BOTS.findIndex((b) => b.id === s.bot) + 1, fen);
  } catch (e) { /* the engine failed: handled below */ }
  const gap = want - (performance.now() - t0); if (gap > 0) await new Promise((r) => setTimeout(r, gap));
  if (CP.s !== s || s.c.fen() !== fen || s.over || !$(".cpwrap") || cpCharge(s)) return;
  let m = mv ? s.c.move({ from: mv.from, to: mv.to, promotion: mv.promotion || "q" }) : null;
  if (!m) { s.note = "Stockfish could not load, so a much simpler engine is moving."; const x = BKBots.smallMove(fen); m = s.c.move({ from: x.from, to: x.to, promotion: x.promotion || "q" }); }
  s.think = false; if (m) { s.last = [m.from, m.to]; Snd.tick(); } cpCheckEnd(); renderChess(); cpWatch();
}
function chessClick(sq) {
  const s = CP.s; if (!s || s.over || s.think || s.promo) return; const c = s.c; if (s.mode === "solo" && c.turn() !== s.you) return;
  if (s.sel === sq) { s.sel = null; s.targets = []; renderChess(); return; }
  if (s.sel && s.targets.includes(sq)) { cpMove(s.sel, sq); return; }
  const pc = c.get(sq); if (pc && pc.color === c.turn()) { s.sel = sq; s.targets = c.moves({ square: sq, verbose: true }).map((m) => m.to); } else { s.sel = null; s.targets = []; }
  renderChess();
}
document.addEventListener("click", (e) => {
  const sq = e.target.closest("[data-csq]"); if (sq && CP.s && $(".cpwrap")) { chessClick(sq.dataset.csq); return; }
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.secs != null) { const p = prof(); p.chessClock = +t.dataset.secs; saveProf(); Snd.tick(); document.querySelectorAll("[data-secs]").forEach((b) => b.setAttribute("aria-pressed", b === t)); return; }
  if (t.dataset.bot) { Snd.tick(); newChessPlay("solo", t.dataset.bot); return; }
  if (!CP.s) return;
  if (t.dataset.promo) { const s = CP.s, p = s.promo; if (!p) return; s.promo = null; if (t.dataset.promo === "x") renderChess(); else cpMove(p.from, p.to, t.dataset.promo); return; }
  if (t.id === "cpDraw") { const s = CP.s; if (s.over || !cpSure(t, "Both agree? Tap again")) return; s.over = { cls: "draw", title: "Draw", why: "Agreed." }; renderChess(); return; }
  if (t.id === "cpAgain") { newChessPlay(CP.s.mode, CP.s.bot); return; }
  if (t.id === "cpChange") { if (cpRunning() && !cpSure(t, "Leave this game?")) return; newChessPlay("solo"); return; }
  if (t.id === "cpUndo") { const s = CP.s; if (cpCharge(s)) return; s.promo = null; s.slid = null; s.c.undo(); if (s.mode === "solo" && s.c.turn() !== s.you) s.c.undo(); s.sel = null; s.targets = []; s.last = null; const n = s.c.history().length; s.talk.seen = n; s.talk.evals.length = Math.min(s.talk.evals.length, n + 1); s.talk.last = Math.min(s.talk.last, n); s.talk.pending = null; renderChess(); if (s.mode === "solo" && s.c.turn() !== s.you) { s.think = true; renderChess(); setTimeout(cpEngine, 400); } return; }
  if (t.id === "cpResign") { const s = CP.s, solo = s.mode === "solo"; if (s.over || cpCharge(s) || !cpSure(t, "Tap again to resign")) return; s.promo = null; if (solo) { s.over = { cls: "loss", title: "You resigned", why: "Another one?" }; cpRecord(s); Mascot.react("ch_loss", true); s.think = false; cpLastWord(); } else { const names = NAMES(), side = s.c.turn(); s.over = { cls: "win", title: `${names[side === "w" ? 1 : 0]} wins!`, why: `${names[side === "w" ? 0 : 1]} resigned.` }; } renderChess(); return; }
});

/* "Back" in a running game asks once more (this runs before the page's own Back handler) */
document.addEventListener("click", (e) => { const t = e.target.closest && e.target.closest("#gamesBack"); if (t && cpRunning() && !cpSure(t, "Leave the game?")) { e.stopPropagation(); e.preventDefault(); } }, true);
/* ---------- drag and drop, on every board (games, puzzles, endgames): a drag is a press on the piece, then on the square it is dropped on ---------- */
{
  let d = null, eat = 0;
  const at = (sq) => document.querySelector(`.cpwrap [data-csq="${sq}"]`);
  const end = () => { if (d && d.ghost) { d.ghost.remove(); const o = at(d.from); if (o) o.classList.remove("dragging"); } d = null; };
  document.addEventListener("pointerdown", (e) => {
    end(); const sq = e.target.closest && e.target.closest('.cpwrap [data-csq][data-own="1"]'); if (!sq || e.button > 0) return;
    const p = sq.querySelector(".pcz"); if (!p) return;
    d = { from: sq.dataset.csq, x: e.clientX, y: e.clientY, id: e.pointerId, cls: p.className, size: sq.getBoundingClientRect().width, ghost: null };
  });
  document.addEventListener("pointermove", (e) => {
    if (!d || e.pointerId !== d.id) return;
    if (!d.ghost) {
      if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 8) return;
      const o = at(d.from); if (!o) return end(); if (!o.classList.contains("sel")) o.click();   /* select it, so the squares it can go to show */
      d.ghost = Object.assign(document.createElement("b"), { className: d.cls + " cpghost" }); d.ghost.style.width = d.ghost.style.height = d.size * 1.15 + "px"; document.body.appendChild(d.ghost);
    }
    const o = at(d.from); if (o) o.classList.add("dragging");
    d.ghost.style.left = e.clientX - d.size * 0.575 + "px"; d.ghost.style.top = e.clientY - d.size * 0.575 + "px";
  });
  document.addEventListener("pointerup", (e) => {
    if (!d || e.pointerId !== d.id) return; const was = d; end(); if (!was.ghost) return;
    const el = document.elementFromPoint(e.clientX, e.clientY), sq = el && el.closest(".cpwrap [data-csq]");
    if (sq && sq.dataset.csq !== was.from) { if (CP.s) CP.s.dropped = true; if (typeof Train !== "undefined" && Train.s) Train.s.dropped = true; sq.click(); if (CP.s) CP.s.dropped = false; }
    eat = performance.now();
  });
  document.addEventListener("pointercancel", end);
  /* the browser may follow a drag with a click of its own: ignore it */
  document.addEventListener("click", (e) => { if (e.isTrusted && performance.now() - eat < 60 && e.target.closest && e.target.closest(".cpwrap [data-csq]")) e.stopPropagation(); }, true);
}
