/* ================= the end-of-game summary card (as on ballknowledge) and the door to the chess room (docs/lab/) =================
   The card counts your moves with a quick Stockfish pass; the full Game review searches deeper, so its numbers can differ. */
const Lab = {
  el: null,
  open(hash, game) {
    this.close(); Voice.stop();
    if (game) { try { sessionStorage.setItem("ub_review", JSON.stringify(game)); } catch (e) { /* blocked: the review asks for a game */ } }
    const f = document.createElement("iframe"); f.className = "labframe"; f.title = "Chess room"; f.src = "lab/index.html#" + hash; f.allow = "autoplay";
    document.body.appendChild(f); document.body.classList.add("labopen"); this.el = f; f.addEventListener("load", () => { try { f.contentWindow.focus(); } catch (e) { /* fine */ } });
  },
  close() { if (this.el) this.el.remove(); this.el = null; document.body.classList.remove("labopen"); },
};
addEventListener("message", (e) => { if (e.origin === location.origin && e.data && e.data.ub === "labclose") Lab.close(); });
addEventListener("hashchange", () => Lab.close());

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
