/* ultimateball's front door to the screens brought over from ballknowledge's chess page (pipelines/chess_lab.py puts this
   where that page used to start itself). Opened as #review, #game (the game just played), #positions or #wcc. */
const LAB_GAMES = ["next", "blunder", "tact", "hbar", "endg", "blind"];
Object.keys(VERSOF).forEach((k) => { if (k === "next" || k === "recog" || k === "blunder" || k === "open") delete VERSOF[k]; });   /* no version chips: each game has its own card */
{ const n = CG.find((x) => x.id === "next"); if (n) { n.name = "Guess the next move"; n.tag = CGALL.find((x) => x.id === "next").tag; } }

function labHome() {
  try { CH.v = "home"; cpClose(); RKS.prof = null; } catch (e) { /* not set up */ }
  rvStop(); olClose(); clearInterval(st.timer); live = null; st = {};
  const card = (attr, icon, name, tag) => `<button type="button" class="gcard labcard" ${attr}><div class="gname">${ic(icon)}${name}</div><div class="gtag">${tag}</div></button>`;
  $("#app").className = "fresh";
  $("#app").innerHTML = `<h2>${ic("crown")}Chess room</h2><div class="labgrid">${card('data-go="labreview"', "chart", "Review a game", "Paste a PGN, or bring your games from Lichess or chess.com. Every move is graded.")}${card('data-go="labwcc"', "crown", "World Championship", "Gukesh against Sindarov: live board, schedule, score and players.")}</div>
    <h3>${ic("puzzle")}Position games</h3><div class="labgrid">${LAB_GAMES.map((id) => { const x = CGALL.find((y) => y.id === id), name = id === "next" ? "Guess the next move" : x.name; return card(`data-intro="${id}"`, x.ic, name, x.tag); }).join("")}</div>`;
  window.scrollTo(0, 0);
}
home = labHome; hub = labHome; gamesPage = labHome;
Object.assign(GO, { home: labHome, games: labHome, daily: labHome, board: labHome, learn: labHome, rank: labHome, labreview: () => reviewIntro(), labwcc: () => champPage("wcc") });

function labRoute() {
  const h = location.hash.slice(1);
  if (h === "wcc") return champPage("wcc");
  if (h === "review") return reviewIntro();
  if (h === "game") {
    let g = null; try { g = JSON.parse(sessionStorage.getItem("ub_review") || "null"); } catch (e) { /* blocked */ }
    if (g && Array.isArray(g.sans) && g.sans.length > 1) return reviewStart(g.sans.map(String), g.color === "b" ? "b" : "w", { from: "pgn", names: g.names });
    return reviewIntro();
  }
  labHome();
}
const labClose = () => { if (window.opener) { window.close(); return; } location.href = "./#w-chess"; };   /* a tab opened over an online game just closes */
if (typeof Install !== "undefined") Install.show = () => {};   /* ballknowledge's install prompt does not belong here */
document.getElementById("labClose").addEventListener("click", labClose);
addEventListener("keydown", (e) => { if (e.key === "Escape" && !/INPUT|TEXTAREA/.test(e.target.tagName || "")) labClose(); });
addEventListener("hashchange", labRoute);
{ let light = false; try { const v = localStorage.getItem("gp_look"); light = v === "light" || (v === "device" && matchMedia("(prefers-color-scheme: light)").matches); } catch (e) { /* dark */ }
  document.documentElement.setAttribute("data-theme", light ? "light" : "classic"); }
labRoute();
