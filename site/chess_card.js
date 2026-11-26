/* ================= the end-of-game summary card (as on ballknowledge) and the door to the chess room (docs/chessroom.html) =================
   The card counts your moves with a quick Stockfish pass; the full Game review searches deeper, so its numbers can differ. */
const Lab = {
  /* the chess room is its own page (the site does not allow itself to be framed). Over a live online game it opens in a new tab, so the room stays open. */
  open(hash, game) {
    Voice.stop();
    if (game) { try { sessionStorage.setItem("ub_review", JSON.stringify(game)); } catch (e) { /* blocked: the review asks for a game */ } }
    const url = "chessroom.html#" + hash;
    if (CP.s && CP.s.mode === "online" && ChessNet.code && window.open(url, "_blank")) return;
    location.href = url;
  },
};

const cpGameFor = (s) => ({ sans: s.c.history(), color: s.mode !== "duo" ? s.you : "w", names: s.mode !== "duo" ? ((o) => (s.you === "w" ? ["You", o] : [o, "You"]))(s.mode === "solo" ? cpOpp(s.bot).name : s.oppName) : NAMES().slice(0, 2) });

/* grade your own moves once, when a game against the computer ends */
function cpGrade(s) {
  if (s.grading || s.mode === "duo" || !s.c.history().length) return; s.grading = true;
  const done = (r) => { s.stats = r || { n: {}, moves: 0 }; const box = CP.s === s && $(".ectiles"); if (box) { box.innerHTML = cpTiles(s); const note = $(".ecnote"); if (note) note.textContent = cpNote(s); } };
  BKBots.grade(new Chess().fen(), s.c.history({ verbose: true }), s.you, () => CP.s === s).then(done, () => done(null));
}
const cpTiles = (s) => (!s.stats ? `<p class="ecwait">Checking your moves…</p>` : s.stats.moves ? BKBots.tiles(s.stats.n) : `<p class="ecwait">The moves could not be checked.</p>`);
const cpNote = (s) => (s.stats && s.stats.moves ? `A quick look at your ${s.stats.moves} moves. The review checks deeper.` : "");

/* the card over the board; once closed, the buttons it held sit under the board */
function cpOverHTML(s) {
  const o = s.over; if (!o || s.cardHidden) return "";
  const solo = s.mode === "solo", moved = s.c.history().length > 0, mine = s.mode !== "duo" && s.c.history({ verbose: true }).some((m) => m.color === s.you);
  if (mine) cpGrade(s);
  return `<div class="ecwrap ${o.cls}"><div class="eccard" role="dialog" aria-label="Game over"><button type="button" class="ecx" data-ec="x" aria-label="Close and look at the board">×</button>
    <h3>${esc(o.title)}</h3><p class="ecwhy">${esc(o.why)}</p>${mine ? `<div class="ectiles">${cpTiles(s)}</div><p class="ecnote">${cpNote(s)}</p>` : ""}
    ${moved ? `<button type="button" class="btn ecreview" id="cpReview">★ Game review</button>` : ""}
    <div class="ecrow">${solo ? `<button class="btn ghost" id="cpChange" type="button">New game</button>` : ""}${s.gone ? "" : `<button class="btn ghost" id="cpAgain" type="button">${s.mode !== "duo" ? "Rematch" : "Play again"}</button>`}</div></div></div>`;
}
function cpAfterHTML(s) {
  if (!s.over || !s.cardHidden) return "";
  return `<div class="row ecafter"><button type="button" class="btn" id="cpReview" ${s.c.history().length ? "" : "disabled"}>★ Game review</button>${s.gone ? "" : `<button class="btn ghost" id="cpAgain" type="button">${s.mode !== "duo" ? "Rematch" : "Play again"}</button>`}</div>`;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("button"); if (!t) return;
  if (t.dataset.lab) { Lab.open(t.dataset.lab); return; }
  if (t.dataset.ec === "x" && CP.s) { CP.s.cardHidden = true; renderChess(); }
});
