/* ================= sidekick outfits (from ballknowledge), unlocked by what you do ================= */
const OUTFITS = [
  ["none", "Classic", () => true, "Always yours"],
  ["party", "Party hat", (p) => ((p.stats || {}).games || 0) >= 10, "Finish 10 solo games"],
  ["silver", "Silver", (p) => levelOf(p.xp).i >= 3, "Reach level 4"],
  ["neon", "Neon", (p) => !!p.ach.explorer, "Play a game in every category"],
  ["fire", "Fire aura", (p) => !!p.ach.streak10, "Get a solo streak of 10"],
  ["gold", "Gold", (p) => levelOf(p.xp).i >= 5, "Reach level 6"],
  ["crown", "Crown", (p) => levelOf(p.xp).i >= 6, "Reach level 7"],
];
/* OUTFIT_HAT (the hats) is already drawn in mascot_art.js */
function outfitOK(k) { const o = OUTFITS.find((x) => x[0] === k); return !!o && o[2](prof()); }
function outfitNow() { const k = prof().outfit || "none"; return outfitOK(k) ? k : "none"; }
function outfitPaint() {
  const el = document.getElementById("mascot"); if (!el) return; const k = outfitNow(); el.dataset.fit = k;
  const b = el.querySelector(".mbody"); if (!b) return; b.querySelectorAll(".mhat").forEach((x) => x.remove()); if (OUTFIT_HAT[k]) b.insertAdjacentHTML("afterbegin", OUTFIT_HAT[k]);
}
function outfitCardHTML() {
  const cur = outfitNow(), sk = Mascot.id();
  return `<div class="card"><div class="label">Sidekick outfit</div><p class="fine">Locked outfits open as you play; each card says how.</p><div class="fitrow">${OUTFITS.map(([k, n, , how]) => { const ok = outfitOK(k); return `<button type="button" class="fitcard ${k === cur ? "on" : ""} ${ok ? "" : "locked"}" data-fit="${k}" ${ok ? `data-wear="${k}"` : "disabled"}><span class="fitprev">${OUTFIT_HAT[k] || ""}${MASCOT_SVG[sk]("happy")}</span><b>${ok ? "" : "🔒 "}${n}</b><small>${ok ? (k === cur ? "Wearing it" : "Tap to wear") : how}</small></button>`; }).join("")}</div></div>`;
}

/* ================= guided tour: your sidekick points things out, in its own voice ================= */
const Tour = {
  at: -1,
  targets: [null, "#homeCats", "#missionBox", '[data-go="wiki"]', '[data-go="collection"]', '[data-go="settings"]', "#profileBtn", null],
  start() { go("home"); this.at = 0; setTimeout(() => this.show(), 500); },
  end() { this.at = -1; const o = $("#tour"); if (o) o.remove(); Voice.stop(); Mascot.dock(); try { localStorage.setItem("gp_toured", "1"); } catch (e) { /* blocked */ } const c = $("#tourChip"); if (c) c.remove(); },
  show() {
    if (this.at < 0) return; if (this.at >= this.targets.length) return this.end();
    const id = Mascot.id(), line = (MASCOTS[id].lines.tour || [])[this.at], sel = this.targets[this.at], el = sel && $(sel);
    if (sel && !el) { this.at++; return this.show(); }
    let o = $("#tour"); if (!o) { o = document.createElement("div"); o.id = "tour"; o.setAttribute("role", "dialog"); o.setAttribute("aria-label", "Guided tour"); document.body.appendChild(o); }
    if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + scrollY - 90), behavior: "instant" });
    const r = el && el.getBoundingClientRect(), low = r && r.top > innerHeight * 0.45;
    o.innerHTML = `${r ? `<div class="tourspot" style="left:${r.left - 8}px;top:${r.top - 8}px;width:${r.width + 16}px;height:${Math.min(r.height + 16, innerHeight * 0.55)}px"></div>` : `<div class="tourshade"></div>`}
      <div class="tourbox ${low ? "top" : ""}"><span class="tourface">${MASCOT_SVG[id]("happy")}</span><div><b>${esc(MASCOTS[id].name)}</b><p>${esc(line || "")}</p><div class="row" style="gap:8px"><button type="button" class="btn" id="tourNext">${this.at === this.targets.length - 1 ? "Done" : "Next"}</button><button type="button" class="btn ghost" id="tourSkip">Skip</button><span class="fine num">${this.at + 1}/${this.targets.length}</span></div></div></div>`;
    if (line) { try { if ((localStorage.getItem("gp_voice") || "1") === "1") Voice.say(id, line); } catch (e) { /* no audio */ } }
    const d = $("#mascot"); if (d) d.remove();
  },
};
function tourCardHTML() { return `<div class="card"><div class="label">Guided tour</div><p class="fine">Your sidekick shows you around, out loud.</p><button type="button" class="btn" data-tour="1">Start the tour</button></div>`; }

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.wear) { prof().outfit = t.dataset.wear; saveProf(); Mascot.dock(); outfitPaint(); renderSettings(); Mascot.react("achieve", true); return; }
  if (t.dataset.tour) { const c = $("#tourChip"); if (c) c.remove(); Voice.ready(); Tour.start(); return; }
  if (t.id === "tourNext") { Tour.at++; Tour.show(); return; }
  if (t.id === "tourSkip" || t.id === "tourNo") { Tour.end(); return; }
});
addEventListener("hashchange", () => { if (Tour.at >= 0 && location.hash !== "#home") Tour.end(); });
setTimeout(() => {
  outfitPaint();
  let seen = "1"; try { seen = localStorage.getItem("gp_toured"); } catch (e) { /* blocked: don't offer */ }
  if (!seen) { const c = document.createElement("div"); c.id = "tourChip"; c.innerHTML = `<button type="button" data-tour="1">New here? Take the tour</button><button type="button" id="tourNo" aria-label="No thanks">✕</button>`; document.body.appendChild(c); }
}, 2600);
