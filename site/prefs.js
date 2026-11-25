/* ================= display and sound preferences (text size, contrast, motion, mixer), after ballknowledge's settings ================= */
const Prefs = {
  get(k, d) { try { const v = localStorage.getItem("gp_" + k); return v == null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("gp_" + k, v); } catch (e) { /* blocked: lasts until reload */ } },
  num(k, d) { const n = parseFloat(this.get(k, "")); return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : d; },
  apply() {
    const r = document.documentElement, size = this.get("text", "m");
    r.setAttribute("data-text", size);
    if (this.get("contrast", "") === "high") r.setAttribute("data-contrast", "high"); else r.removeAttribute("data-contrast");
    if (this.get("motion", "") === "reduced") r.setAttribute("data-motion", "reduced"); else r.removeAttribute("data-motion");
    window.MIXFX = this.num("mixfx", 1); window.MIXMUS = this.num("mixmus", 1); window.MIXVOX = this.num("mixvox", 1);
    try { Snd.remix(); } catch (e) { /* sound not started yet */ }
  },
};
Prefs.apply();
function displayCardHTML() {
  const chips = (k, cur, opts) => `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">${opts.map(([v, n]) => `<button type="button" class="chip" data-pref="${k}:${v}" aria-pressed="${cur === v}">${n}</button>`).join("")}</div>`;
  const slider = (k, n) => `<label class="mixrow"><span>${n}</span><input type="range" min="0" max="100" step="5" value="${Math.round(Prefs.num(k, 1) * 100)}" data-mix="${k}"><output>${Math.round(Prefs.num(k, 1) * 100)}%</output></label>`;
  return `<div class="card"><div class="label">Text size</div>${chips("text", Prefs.get("text", "m"), [["s", "Small"], ["m", "Normal"], ["l", "Large"], ["xl", "Extra large"]])}
    <div class="label" style="margin-top:14px">Contrast</div>${chips("contrast", Prefs.get("contrast", ""), [["", "Normal"], ["high", "High"]])}
    <div class="label" style="margin-top:14px">Motion</div>${chips("motion", Prefs.get("motion", ""), [["", "Follow my device"], ["reduced", "Reduce motion"]])}<p class="fine">Reduce motion stops animations; background effects stop after a reload.</p></div>
  <div class="card"><div class="label">Volume mixer</div>${slider("mixfx", "Effects and music (overall)")}${slider("mixmus", "Music")}${slider("mixvox", "Sidekick voices")}</div>`;
}

/* ================= two players on one device: names for this visit only (never saved for good) ================= */
try { localStorage.removeItem("gp_names"); } catch (e) { /* blocked */ }
function duoNamesHTML() {
  let n = []; try { n = JSON.parse(sessionStorage.getItem("gp_names") || "[]"); } catch (e) { /* blocked */ }
  return `<div class="duonames"><span class="fine">Names for two players on one device (optional)</span><input data-duo="0" maxlength="16" placeholder="Player 1" aria-label="Player 1 name" value="${esc(n[0] && n[0] !== "Player 1" ? n[0] : "")}"><input data-duo="1" maxlength="16" placeholder="Player 2" aria-label="Player 2 name" value="${esc(n[1] && n[1] !== "Player 2" ? n[1] : "")}"></div>`;
}

/* ================= your recent runs ================= */
{ const rec0 = recordGame; recordGame = function (s) {
  rec0.apply(this, arguments);
  if (s.mode !== "solo" || s.mix) return;
  const p = prof(); p.history = p.history || [];
  p.history.unshift({ t: Date.now(), w: s.w, g: s.game, s: s.scores[0], r: s.wins[0] || 0, n: s.rounds || 0, d: s.w === "kpop" ? "" : S.diff });
  p.history.length = Math.min(p.history.length, 20); saveProf();
}; }
function historyHTML() {
  const h = (prof().history || []).filter((x) => WORLDS[x.w] && gameOf(x.w, x.g));
  return `<div class="card"><div class="label">Recent runs</div>${h.length ? `<ul class="histlist">${h.slice(0, 10).map((x) => `<li><button type="button" data-go="w-${x.w}-${x.g}" title="Play again"><span style="--wc:${WVARS[x.w][4]}" class="hdot"></span><b>${esc(gameOf(x.w, x.g).name)}</b><span class="fine">${esc(WORLDS[x.w].name)}${x.d ? " · " + esc(diffNameFor(x.d)) : ""} · ${new Date(x.t).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</span><span class="num">${x.r}/${x.n} · ${Number(x.s).toLocaleString()}</span></button></li>`).join("")}</ul>` : `<p class="fine">Finish a solo quiz and it shows up here.</p>`}</div>`;
}

/* ================= search finds games too, not only people and things ================= */
{ const wr0 = wikiResults; wikiResults = function () {
  wr0.apply(this, arguments);
  const box = $("#wikiRes"); if (!box) return; const old = $("#gameHits"); if (old) old.remove();
  const q = qnorm(WQ.q); if (q.length < 2) return;
  const hits = WORLD_IDS.filter((w) => WQ.w === "all" || w === WQ.w).flatMap((w) => GAMES[w].filter((g) => qnorm(g.name).includes(q) || qnorm(WORLDS[w].name + g.name).includes(q)).map((g) => [w, g])).slice(0, 6);
  if (hits.length) box.insertAdjacentHTML("beforebegin", `<div id="gameHits" class="row" style="gap:6px;flex-wrap:wrap;margin:8px 0"><span class="label">Games</span>${hits.map(([w, g]) => `<button type="button" class="chip" data-go="w-${w}-${g.id}">${esc(g.name)} · ${esc(WORLDS[w].name)}</button>`).join("")}</div>`);
}; }

/* ================= keyboard: chess squares can be reached and pressed, and the skip button jumps past the header ================= */
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const sq = e.target.closest && e.target.closest("[data-csq]"); if (!sq) return;
  e.preventDefault(); const id = sq.dataset.csq; sq.click();
  setTimeout(() => { const again = document.querySelector(`[data-csq="${id}"]`); if (again) again.focus(); }, 0);
});
document.addEventListener("click", (e) => {
  if (e.target.id === "skipBtn") { const m = $("#main"), h = m && [...m.querySelectorAll("section:not([hidden]) button, section:not([hidden]) input, section:not([hidden]) a[href]")].find((x) => x.offsetParent); if (h) h.focus(); return; }
  const t = e.target.closest("button"); if (!t || !t.dataset.pref) return;
  const [k, v] = t.dataset.pref.split(":"); Prefs.set(k, v); Prefs.apply(); renderSettings();
});
document.addEventListener("input", (e) => {
  if (e.target.dataset.mix) { Prefs.set(e.target.dataset.mix, String(e.target.value / 100)); Prefs.apply(); e.target.nextElementSibling.textContent = e.target.value + "%"; return; }
  if (e.target.dataset.duo != null) { const v = [0, 1].map((i) => (($(`[data-duo="${i}"]`) || {}).value || "").trim() || `Player ${i + 1}`); try { sessionStorage.setItem("gp_names", JSON.stringify(v)); } catch (x) { /* blocked */ } }
});
