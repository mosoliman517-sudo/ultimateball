/* ================= light / dark ================= */
const Look = {
  get() { try { const v = localStorage.getItem("gp_look"); return v === "light" || v === "device" ? v : "dark"; } catch (e) { return "dark"; } },
  now() { const v = this.get(); return v === "device" ? (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark") : v; },
  apply() { const r = document.documentElement; if (this.now() === "light") r.setAttribute("data-mode", "light"); else r.removeAttribute("data-mode"); const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = this.now() === "light" ? "#f2f4fb" : "#0e1424"; },
  set(v) { try { localStorage.setItem("gp_look", v); } catch (e) { /* blocked: lasts this visit */ } this.apply(); },
};
Look.apply();
matchMedia("(prefers-color-scheme: light)").addEventListener("change", () => Look.apply());
function lookCardHTML() { return `<div class="card"><div class="label">Look</div><div class="row" style="gap:8px;margin-top:8px">${[["dark", "Dark"], ["light", "Light"], ["device", "Follow my device"]].map(([k, n]) => `<button type="button" class="chip" data-look="${k}" aria-pressed="${Look.get() === k}">${n}</button>`).join("")}</div></div>`; }

/* ================= profile share card: a picture of your profile to send or save ================= */
const Share = {
  load(src) { return new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; }); },
  async draw() {
    const p = prof(), lv = levelOf(p.xp), W = 1080, H = 1350, c = document.createElement("canvas"); c.width = W; c.height = H; const g = c.getContext("2d");
    const css = getComputedStyle(document.documentElement), v = (n, d) => css.getPropertyValue(n).trim() || d;
    const bg = v("--bg", "#14121F"), ink = v("--ink", "#F4EFE6"), muted = v("--muted", "#B3AEC4"), accent = v("--accent", "#FFD166"), surface = v("--surface", "#211D33"), glow = v("--glow", "#7C6CFF");
    try { await document.fonts.ready; } catch (e) { /* system font */ }
    const F = (px, w = 700) => `${w} ${px}px ${v("--display", "system-ui")}, system-ui, sans-serif`;
    const text = (t, x, y, px, col, w, max) => { g.font = F(px, w); g.fillStyle = col; g.fillText(t, x, y, max); };
    const box = (x, y, w, h, col) => { g.fillStyle = col; g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, 28); else g.rect(x, y, w, h); g.fill(); };
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const rg = g.createRadialGradient(W * 0.85, 120, 20, W * 0.85, 120, 760); rg.addColorStop(0, "rgba(0,0,0,1)"); rg.addColorStop(1, "rgba(0,0,0,0)");
    const l = document.createElement("canvas"); l.width = W; l.height = H; const lg = l.getContext("2d"); lg.fillStyle = rg; lg.fillRect(0, 0, W, H); lg.globalCompositeOperation = "source-in"; lg.fillStyle = glow; lg.fillRect(0, 0, W, H);   // any colour format works
    g.globalAlpha = 0.5; g.drawImage(l, 0, 0); g.globalAlpha = 1;
    text("ultimateball", 70, 112, 56, accent, 800);
    // picture: the chosen Dex card, or the first letter
    const av = p.avatar && String(p.avatar).split(":"), x = av ? items(av[0]).find((i) => i.id === av.slice(1).join(":")) : null;
    const img = x && imgOf(x) ? await this.load(imgOf(x)) : null;
    g.save(); g.beginPath(); g.arc(190, 290, 120, 0, Math.PI * 2); g.clip(); g.fillStyle = surface; g.fillRect(70, 170, 240, 240);
    if (img) { const s = Math.max(240 / img.width, 240 / img.height); g.drawImage(img, 190 - (img.width * s) / 2, 170, img.width * s, img.height * s); }
    g.restore(); if (!img) { g.textAlign = "center"; text((p.nick || "You")[0].toUpperCase(), 190, 330, 120, ink, 800); g.textAlign = "left"; }
    text(p.nick || "You", 350, 270, 76, ink, 800, 660);
    if (p.title && achOf(p.title)) text(achOf(p.title)[1], 350, 325, 36, accent, 700, 660);
    text(`Level ${lv.i + 1} · ${lv.name} · ${p.xp.toLocaleString()} XP`, 350, 380, 32, muted, 500, 660);
    // numbers
    const t = p.stats || {}, badges = Object.keys(p.badges || {}).length, dex = Object.values(p.dex || {}).filter((n) => n >= 3).length;
    [[`${badges}/${BADGES.length}`, "Badges"], [`${Object.keys(p.ach || {}).length}/${ACH.length}`, "Achievements"], [String(dex), "Dex cards"], [String(Daily.streak()), "Day streak"]].forEach(([n, l], i) => { const bx = 70 + i * 240; box(bx, 460, 220, 150, surface); text(n, bx + 24, 535, 58, ink, 800, 180); text(l, bx + 24, 580, 28, muted, 500, 180); });
    // ranks: the worlds played most
    text("Ranks", 70, 690, 40, ink, 800);
    WORLD_IDS.map((w) => ({ w, xp: (p.worlds[w] || {}).xp || 0 })).sort((a, b) => b.xp - a.xp).slice(0, 5).forEach(({ w, xp }, i) => { const y = 720 + i * 90; box(70, y, 700, 74, surface); g.fillStyle = WVARS[w][4]; g.fillRect(70, y + 14, 10, 46); text(WORLDS[w].name, 104, y + 48, 34, ink, 700, 320); text(wRank(xp), 450, y + 48, 32, accent, 700, 180); g.textAlign = "right"; text(`${xp} XP`, 740, y + 48, 28, muted, 500); g.textAlign = "left"; });
    // your sidekick
    const kid = p.kickHome && MASCOT_SVG[p.kickHome] ? p.kickHome : (p.kick || {}).kpop || "bongi";
    const svg = MASCOT_SVG[kid]("happy").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="260" height="260" ');
    const m = await this.load("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg)); if (m) g.drawImage(m, 790, 900, 260, 260);
    g.textAlign = "center"; text(MASCOTS[kid].name, 920, 1190, 30, muted, 700, 260); g.textAlign = "left";
    text(location.host || "moultimateball.vercel.app", 70, 1270, 32, muted, 500);
    return c;
  },
  async open() {
    const c = await this.draw(), url = c.toDataURL("image/png"), old = $("#shareBox"); if (old) old.remove();
    const el = document.createElement("div"); el.id = "shareBox"; el.className = "sharebox"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Your share card");
    el.innerHTML = `<div class="sharein"><img src="${url}" alt="Your ultimateball profile card"><div class="row" style="gap:8px;justify-content:center;flex-wrap:wrap">${navigator.canShare ? `<button type="button" class="btn" id="shSend">Share</button>` : ""}<a class="btn" href="${url}" download="ultimateball-card.png">Save picture</a><button type="button" class="btn ghost" id="shClose">Close</button></div></div>`;
    document.body.appendChild(el);
    el.addEventListener("click", async (e) => {
      if (e.target === el || e.target.id === "shClose") return el.remove();
      if (e.target.id === "shSend") { try { const f = new File([await (await fetch(url)).blob()], "ultimateball-card.png", { type: "image/png" }); await navigator.share({ files: [f], title: "ultimateball" }); } catch (x) { /* closed the share sheet */ } }
    });
  },
};
function shareCardHTML() { return `<div class="card"><div class="label">Share card</div><p class="fine">A picture of your level, ranks and badges to send to friends.</p><button type="button" class="btn" id="shareOpen">Make my card</button></div>`; }

/* ================= comeback calendar: real release dates from each group's discography, plus debut anniversaries ================= */
const Cal = {
  y: 0, m: 0, all: null,
  data() {
    if (this.all) return this.all;
    const rel = [], seen = new Set(), debuts = [];
    items("kpop", (x) => x.kind === "group").forEach((g) => {
      (g.discography || []).forEach((r) => {
        if (!r.d || r.d.length !== 10 || r.ver || (r.sec && r.sec.some((s) => /remix|compilation|live|spoken|interview|dj/i.test(s)))) return;
        const k = g.n + "|" + r.t.toLowerCase(); if (seen.has(k)) return; seen.add(k);
        rel.push({ d: r.d, g: g.n, gx: g, t: r.t, ty: r.ty, col: (g.colors && g.colors[0] && g.colors[0].hex) || "var(--accent)" });
      });
      const dd = g.debut_date && new Date(g.debut_date + " 12:00 UTC");
      if (dd && !isNaN(dd)) debuts.push({ md: dd.toISOString().slice(5, 10), y: dd.getUTCFullYear(), g: g.n, gx: g });
    });
    return (this.all = { rel: rel.sort((a, b) => a.d.localeCompare(b.d)), debuts });
  },
  render() {
    const today = todayKey(); if (!this.y) { this.y = +today.slice(0, 4); this.m = +today.slice(5, 7) - 1; }
    const { rel, debuts } = this.data(), mm = `${this.y}-${String(this.m + 1).padStart(2, "0")}`, month = rel.filter((r) => r.d.startsWith(mm)), anni = debuts.filter((d) => d.md.startsWith(mm.slice(5)) && d.y < this.y);
    const by = {}; month.forEach((r) => (by[+r.d.slice(8)] = by[+r.d.slice(8)] || []).push(r));
    const bd = {}; anni.forEach((a) => (bd[+a.md.slice(3)] = bd[+a.md.slice(3)] || []).push(a));
    const days = new Date(Date.UTC(this.y, this.m + 1, 0)).getUTCDate(), lead = (new Date(Date.UTC(this.y, this.m, 1)).getUTCDay() + 6) % 7;
    const title = new Date(Date.UTC(this.y, this.m, 15)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
    const cells = Array.from({ length: lead }, () => "<i></i>").concat(Array.from({ length: days }, (_, i) => { const n = i + 1, iso = `${mm}-${String(n).padStart(2, "0")}`, r = by[n] || [], a = bd[n] || []; return `<button type="button" class="calday ${iso === today ? "today" : ""} ${r.length || a.length ? "has" : ""}" ${r.length || a.length ? `data-calday="${n}"` : "disabled"}><b>${n}</b><span>${r.slice(0, 4).map((x) => `<em style="background:${x.col}"></em>`).join("")}${a.length ? "🎂" : ""}</span></button>`; }));
    const row = (r) => `<li><span class="num">${+r.d.slice(8)}</span><em style="background:${r.col}"></em><div><b>${wikiLink("kpop", r.gx, esc(r.g))}</b> ${esc(r.t)} <span class="fine">${esc(r.ty)}${r.d > today ? " · upcoming" : ""}</span></div></li>`;
    const next = rel.filter((r) => r.d >= today).slice(0, 6);
    $("#calRoom").innerHTML = `<div class="hero"><h1>Comeback <em>calendar</em></h1><p class="fine">Releases listed in MusicBrainz for the groups on this site, and debut anniversaries. Announcements that aren't listed there yet won't show.</p></div>
      ${next.length ? `<div class="card"><div class="label">Coming up</div><ul class="callist">${next.map((r) => `<li><span class="num">${new Date(r.d + "T12:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}</span><em style="background:${r.col}"></em><div><b>${wikiLink("kpop", r.gx, esc(r.g))}</b> ${esc(r.t)} <span class="fine">${esc(r.ty)}</span></div></li>`).join("")}</ul></div>` : ""}
      <div class="card"><div class="row" style="justify-content:space-between;align-items:center"><button type="button" class="chip" data-calmove="-1" aria-label="Previous month">←</button><h3 style="margin:0">${title}</h3><button type="button" class="chip" data-calmove="1" aria-label="Next month">→</button></div>
        <div class="kcalgrid">${["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => `<u>${d}</u>`).join("")}${cells.join("")}</div></div>
      <div class="card" id="calList"><div class="label">${month.length} release${month.length === 1 ? "" : "s"} in ${title}</div>${month.length ? `<ul class="callist">${month.map(row).join("")}</ul>` : `<p class="fine">Nothing listed for this month.</p>`}
        ${anni.length ? `<div class="label" style="margin-top:12px">Debut anniversaries</div><ul class="callist">${anni.sort((a, b) => a.md.localeCompare(b.md)).map((a) => `<li><span class="num">${+a.md.slice(3)}</span><em></em><div><b>${wikiLink("kpop", a.gx, esc(a.g))}</b> ${this.y - a.y} year${this.y - a.y === 1 ? "" : "s"} since debut</div></li>`).join("")}</ul>` : ""}</div>`;
  },
  move(n) { const d = new Date(Date.UTC(this.y, this.m + n, 15)); this.y = d.getUTCFullYear(); this.m = d.getUTCMonth(); this.render(); },
  pick(n) { const day = $(`#calList li span.num`) && [...document.querySelectorAll("#calList li")].find((li) => li.querySelector(".num").textContent === String(n)); if (day) { day.scrollIntoView({ block: "center", behavior: "smooth" }); day.classList.remove("flash"); void day.offsetWidth; day.classList.add("flash"); } },
};
function calDoorHTML() { return `<button type="button" class="contbar caldoor" data-go="calendar"><div><span class="dk">K-pop</span><b>Comeback calendar</b><span class="fine">Releases and debut anniversaries, month by month</span></div></button>`; }

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.look) { Look.set(t.dataset.look); renderSettings(); return; }
  if (t.id === "shareOpen") { Share.open().catch(() => toast("Could not make the card on this device.")); return; }
  if (t.dataset.calmove) { Cal.move(+t.dataset.calmove); return; }
  if (t.dataset.calday) Cal.pick(+t.dataset.calday);
});
