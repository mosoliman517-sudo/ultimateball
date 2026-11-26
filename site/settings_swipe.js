/* ================= visual settings, after ballknowledge: rows of cards to swipe, tap or step with the arrows.
   Swiping a card into the middle applies it. Look, sidekick (per category), outfit and text size. ================= */
const Swipe = {
  world: "kpop", timers: {},
  row(id, cards) { return `<div class="uxrow" data-uxrow="${id}"><button type="button" class="uxarrow" data-uxgo="-1" aria-label="Previous">‹</button><div class="uxtrack">${cards.join("")}</div><button type="button" class="uxarrow" data-uxgo="1" aria-label="Next">›</button></div>`; },
  card(row, v, on, body, locked) { return `<button type="button" class="uxcard ${on ? "on" : ""} ${locked ? "locked" : ""}" data-ux="${row}" data-v="${v}" aria-pressed="${on}">${body}</button>`; },
  kick(w) { return (prof().kick || {})[w] || WORLDS[w].mascot; },
  html(row) {
    if (row === "look") return this.row(row, [["dark", "Dark", "Stage lights"], ["light", "Light", "Warm paper"], ["device", "Follow my device", "Switches with your phone or computer"]].map(([k, n, d]) => this.card(row, k, Look.get() === k, `<span class="uxlook ${k}"><i></i><i></i><i></i></span><b>${n}</b><small>${d}</small>`)));
    if (row === "kick") { const w = this.world, list = WORLDS[w].kicks.concat(Object.keys(MASCOTS).filter((k) => !WORLDS[w].kicks.includes(k))).filter((k) => MASCOT_SVG[k]);
      return this.row(row, list.map((k) => this.card(row, k, this.kick(w) === k, `<span class="uxface">${MASCOT_SVG[k]("happy")}</span><b>${esc(MASCOTS[k].name)}</b><small>${esc(MASCOTS[k].blurb || "")}</small>`))); }
    if (row === "fit") { const sk = this.kick(this.world);
      return this.row(row, OUTFITS.map(([k, n, , how]) => { const ok = outfitOK(k); return this.card(row, k, outfitNow() === k, `<span class="uxface fitprev">${OUTFIT_HAT[k] || ""}${MASCOT_SVG[sk]("happy")}</span><b>${ok ? "" : "🔒 "}${n}</b><small>${ok ? (outfitNow() === k ? "Wearing it" : "Yours") : how}</small>`, !ok); })); }
    return this.row("text", [["s", "Small", 14], ["m", "Normal", 16], ["l", "Large", 19], ["xl", "Extra large", 22]].map(([k, n, px]) => this.card("text", k, Prefs.get("text", "m") === k, `<span class="uxtext" style="font-size:${px}px">Who am I? Name the idol.</span><b>${n}</b>`)));
  },
  cards() {
    const chips = `<div class="chips" role="group" aria-label="Category">${WORLD_IDS.map((w) => `<button type="button" class="chip ${this.world === w ? "on" : ""}" data-uxworld="${w}">${esc(WORLDS[w].name)}</button>`).join("")}</div>`;
    return `<div class="card"><div class="label">Look</div>${this.html("look")}</div>
      <div class="card"><div class="label">Your sidekick</div><p class="fine">Each category has its own. Swipe or tap one; tap the chosen one again to hear it.</p>${chips}<div id="uxKick">${this.html("kick")}</div></div>
      <div class="card"><div class="label">Sidekick outfit</div><p class="fine">Locked outfits open as you play; each card says how.</p><div id="uxFit">${this.html("fit")}</div></div>
      <div class="card"><div class="label">Text size</div>${this.html("text")}</div>`;
  },
  center(row, smooth) { const t = row.querySelector(".uxtrack"), c = t.querySelector(".uxcard.on"); if (c) t.scrollTo({ left: c.offsetLeft - (t.clientWidth - c.offsetWidth) / 2, behavior: smooth ? "smooth" : "instant" }); },
  mark(row, v) { row.querySelectorAll(".uxcard").forEach((c) => { const on = c.dataset.v === v; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on); }); },
  redraw(id, name) { const box = $("#" + id); if (!box) return; box.innerHTML = this.html(name); this.watch(box.querySelector(".uxrow")); },
  hear() { const k = this.kick(this.world), L = MASCOTS[k].lines || {}, pool = L.hello || L.greet || Object.values(L).find((x) => Array.isArray(x) && x.length) || []; if (pool.length) Voice.say(k, rnd(pool)); },
  /* apply one choice without rebuilding the page */
  pick(row, v) {
    const name = row.dataset.uxrow, card = row.querySelector(`.uxcard[data-v="${v}"]`); if (!card || card.classList.contains("locked") || card.classList.contains("on")) return;
    this.mark(row, v);
    if (name === "look") Look.set(v);
    else if (name === "text") { Prefs.set("text", v); Prefs.apply(); }
    else if (name === "kick") { const p = prof(); p.kick = p.kick || {}; p.kick[this.world] = v; saveProf(); const d = $("#mascot"); if (d) d.dataset.who = ""; Mascot.dock(); this.redraw("uxFit", "fit"); }
    else if (name === "fit") { prof().outfit = v; saveProf(); Mascot.dock(); outfitPaint(); this.redraw("uxFit", "fit"); }
    Snd.tick();
  },
  watch(row) {
    const t = row.querySelector(".uxtrack"); this.center(row);
    let touched = false;
    ["pointerdown", "wheel", "touchstart"].forEach((ev) => t.addEventListener(ev, () => { touched = true; }, { passive: true }));
    t.addEventListener("scroll", () => {
      if (!touched) return; clearTimeout(this.timers[row.dataset.uxrow]);
      this.timers[row.dataset.uxrow] = setTimeout(() => {
        const mid = t.scrollLeft + t.clientWidth / 2, cards = [...t.querySelectorAll(".uxcard")], atEnd = t.scrollLeft + t.clientWidth >= t.scrollWidth - 4, atStart = t.scrollLeft <= 4;
        const best = atStart ? cards[0] : atEnd ? cards[cards.length - 1] : cards.reduce((a, c) => (Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) < Math.abs(a.offsetLeft + a.offsetWidth / 2 - mid) ? c : a));
        if (t.scrollWidth > t.clientWidth + 8) this.pick(row, best.dataset.v);
      }, 220);
    }, { passive: true });
  },
};
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("button"); if (!t) return;
  if (t.dataset.uxworld) { Swipe.world = t.dataset.uxworld; document.querySelectorAll("[data-uxworld]").forEach((b) => b.classList.toggle("on", b === t)); Swipe.redraw("uxKick", "kick"); Swipe.redraw("uxFit", "fit"); return; }
  const row = t.closest(".uxrow"); if (!row) return;
  const cards = [...row.querySelectorAll(".uxcard")];
  if (t.dataset.uxgo) { let i = cards.findIndex((c) => c.classList.contains("on")); do { i += +t.dataset.uxgo; } while (cards[i] && cards[i].classList.contains("locked")); if (cards[i]) { Swipe.pick(row, cards[i].dataset.v); Swipe.center(row, true); } return; }
  if (t.dataset.ux) { if (t.classList.contains("on")) { if (t.dataset.ux === "kick") Swipe.hear(); return; } Swipe.pick(row, t.dataset.v); Swipe.center(row, true); }
});
