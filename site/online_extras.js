/* ================= ranked seasons, player links and watching a live match =================
   The shared boards and player links need db/003_seasons_profiles.sql run once; without it, season points are kept on this device. */
const Season = {
  now: () => new Date().toISOString().slice(0, 7),
  label: (m) => new Date(m + "-15T00:00:00Z").toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }),
  daysLeft() { const d = new Date(); return Math.ceil((Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1) - d) / 864e5); },
  data() {   // a new month starts everyone on 1000; the month that ended is kept in history
    const p = prof(), m = this.now(); p.season = p.season || { m, pts: {}, past: [] };
    if (p.season.m !== m) { const best = Object.entries(p.season.pts || {}).sort((a, b) => b[1] - a[1])[0]; if (best) p.season.past = [...(p.season.past || []), { m: p.season.m, w: best[0], pts: best[1] }].slice(-12); p.season.m = m; p.season.pts = {}; saveProf(); }
    return p.season;
  },
  points(w) { return this.data().pts[w] || 1000; },
  add(w, d) { const s = this.data(); s.pts[w] = Math.max(100, (s.pts[w] || 1000) + d); saveProf(); if (Cloud.on() && Cloud.user) Cloud.sb.rpc("season_report", { p_world: w, p_delta: d }).then(() => {}, () => {}); },
  card() {
    const s = this.data(), mine = Object.entries(s.pts).sort((a, b) => b[1] - a[1]), w = this.pick && WORLDS[this.pick] ? this.pick : mine.length ? mine[0][0] : "kpop";
    return `<div class="card" id="seasonCard"><div class="label">Ranked season · ${this.label(s.m)} · ${this.daysLeft()} day${this.daysLeft() === 1 ? "" : "s"} left</div>
      <p class="fine">Win ranked matches (Two players, two devices → Find an opponent) to climb. Everyone starts each month on 1000.</p>
      <div class="diffbar" style="margin:8px 0">${WORLD_IDS.map((k) => `<button type="button" class="chip" data-season="${k}" aria-pressed="${k === w}">${esc(WORLDS[k].name)}${s.pts[k] ? ` · ${s.pts[k]}` : ""}</button>`).join("")}</div>
      <div id="seasonBoard" class="fine">Your points in ${esc(WORLDS[w].name)}: <b>${this.points(w)}</b></div>
      ${(s.past || []).length ? `<div class="label" style="margin-top:12px">Past seasons</div><p class="fine">${s.past.slice().reverse().map((x) => `${this.label(x.m)}: ${x.pts} in ${esc((WORLDS[x.w] || {}).name || x.w)}`).join(" · ")}</p>` : ""}</div>`;
  },
  async board() {
    const box = $("#seasonBoard"); if (!box || !Cloud.on()) return; const on = document.querySelector('[data-season][aria-pressed="true"]'); if (!on) return; const w = on.dataset.season;
    const { data, error } = await Cloud.sb.rpc("season_board", { p_world: w, p_season: this.now() }).then((r) => r, () => ({ error: true }));
    if (!box.isConnected) return;
    const you = `Your points in ${esc(WORLDS[w].name)}: <b>${this.points(w)}</b>`;
    box.innerHTML = error ? `${you}<br>The shared season board isn't switched on yet.` : data.length ? `${you}<ol class="board">${data.slice(0, 10).map((r, i) => `<li class="${r.nick === Cloud.nick ? "me" : ""}"><span class="rk">${i + 1}</span><b>${esc(r.nick)}</b><span class="num">${r.value}</span></li>`).join("")}</ol>` : `${you}<br>No ranked matches on the board this month yet.`;
  },
};
/* count each ranked result toward the season: the same change as the rating */
{ const done0 = rankedDone; rankedDone = function (s) { const R = Net.ranked, was = R && !R.done && R.w === s.w, before = was ? relo(s.w) : 0; done0.apply(this, arguments); if (was && R.done) Season.add(s.w, relo(s.w) - before); }; }

/* ---------- player links: …/#player-Name ---------- */
const playerLink = (nick) => `${location.origin}${location.pathname}#player-${encodeURIComponent(nick)}`;
function myLinkHTML() { return Cloud.user && Cloud.nick ? `<div class="card"><div class="label">Your player link</div><p class="fine">Send it to a friend: it opens your profile with Add friend and Challenge buttons.</p><button type="button" class="btn" data-copylink="1">Copy my link</button></div>` : ""; }
async function openPlayer(nick) {
  const old = $("#playerBox"); if (old) old.remove(); const el = document.createElement("div"); el.id = "playerBox"; el.className = "sharebox"; el.setAttribute("role", "dialog"); el.setAttribute("aria-label", "Player profile");
  el.innerHTML = `<div class="card plcard"><p>Loading…</p></div>`; document.body.appendChild(el); el.addEventListener("click", (e) => { if (e.target === el) el.remove(); });
  const card = (h) => { const c = el.querySelector(".plcard"); if (c) c.innerHTML = h + `<div class="row" style="justify-content:center;margin-top:10px"><button type="button" class="btn ghost" data-plclose="1">Close</button></div>`; };
  if (!Cloud.on()) return card("<p>Accounts could not load, so this profile can't be shown.</p>");
  const { data, error } = await Cloud.sb.rpc("public_profile", { p_nick: nick }).then((r) => r, () => ({ error: true }));
  if (error) return card("<p>Player links aren't switched on yet.</p>");
  const r = data && data[0]; if (!r) return card(`<p>Nobody called <b>${esc(nick)}</b>.</p>`);
  const top = Object.entries(r.worlds || {}).filter(([w, v]) => WORLDS[w] && v && v.xp).sort((a, b) => b[1].xp - a[1].xp).slice(0, 4), me = Cloud.nick && r.nick === Cloud.nick;
  card(`<h2 style="font-family:var(--display)">${esc(r.nick)}</h2>${r.title && achOf(r.title) ? `<div class="pftitle">${esc(achOf(r.title)[1])}</div>` : ""}<p class="fine">${esc(levelOf(r.xp).name)} · ${r.xp} XP · ${r.badges} badge${r.badges === 1 ? "" : "s"}</p>
    ${top.length ? `<div class="wrank">${top.map(([w, v]) => `<div style="--wc:${WVARS[w][4]}"><span class="fine">${esc(WORLDS[w].name)}</span><b>${rkIcon(wRank(v.xp))} ${wRank(v.xp)}</b></div>`).join("")}</div>` : ""}
    ${me ? `<p class="fine">That's you.</p>` : Cloud.user && Cloud.nick ? `<div class="row" style="justify-content:center;gap:8px;margin-top:10px"><button type="button" class="btn" data-pladd="${esc(r.nick)}">Add friend</button><button type="button" class="btn ghost" data-plchallenge="1">Challenge</button></div><div class="fine" id="plMsg"></div>` : `<p class="fine"><a href="#profile">Sign in</a> and pick a name to add them.</p>`}`);
}
function checkPlayerHash() { const h = location.hash; if (!h.startsWith("#player-")) return; let n = ""; try { n = decodeURIComponent(h.slice(8)); } catch (e) { return; } setTimeout(() => openPlayer(n.slice(0, 16)), 400); }

/* ---------- watching a live match: listen to the room, show it, touch nothing ---------- */
const Watch = {
  mq: [], code: null, seen: false, beat: null,
  stop() { clearInterval(this.beat); this.mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); this.mq = []; if (this.code) { this.code = null; document.body.classList.remove("watching"); const b = $("#watchBar"); if (b) b.remove(); stopQuiz(); Q.s = null; } },
  start(code) {
    this.stop(); Net.close(); this.code = code; this.seen = false;
    const bar = document.createElement("div"); bar.id = "watchBar"; bar.innerHTML = `<span id="watchText">Waiting for room ${esc(code)}…</span><button type="button" class="btn ghost" data-unwatch="1">Stop watching</button>`; document.body.appendChild(bar);
    this.mq = BROKERS.map((u) => mqttConnect(u, "gamesite/v1/" + code, (m) => this.recv(m), () => {}));
    this.beat = setTimeout(() => { if (this.code && !this.seen) { const t = $("#watchText"); if (t) t.textContent = `Nothing from room ${this.code} yet. It shows up at their next move.`; } }, 9000);
  },
  recv(m) {
    if (!this.code || !m || m.k !== "state" || !m.s || !WORLDS[m.s.w] || !gameOf(m.s.w, m.s.game)) return;
    const first = !this.seen; this.seen = true;
    Q.s = Object.assign(m.s, { used: new Set() }); Net.hostName = m.host;
    if (first || S.world !== m.s.w || S.game !== m.s.game || $("#league").hidden) { S.world = m.s.w; S.game = m.s.game; setTheme(m.s.w); show("league"); renderWorld(); document.body.classList.add("ingame", "watching"); }
    renderQuiz(); const t = $("#watchText"); if (t) t.textContent = `Watching ${m.host || "a match"} live`;
  },
};
/* who is playing right now: each player in an online room says so on their own channel, which only people who know the name listen to */
const Live = {
  mq: [], beat: null, key: "",
  topic: (nick) => "gamesite/v1/live/" + String(nick).toLowerCase().replace(/[^a-z0-9]/g, "_"),
  stop() { clearInterval(this.beat); this.mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); this.mq = []; this.key = ""; },
  tick() {
    const on = Net.role && Net.mq.length && Cloud.nick && Q.s && Q.s.mode === "online"; if (!on) { if (this.key) this.stop(); return; }
    const key = Cloud.nick + Net.code; if (this.key !== key) { this.stop(); this.key = key; this.mq = BROKERS.map((u) => mqttConnect(u, this.topic(Cloud.nick), () => {}, () => {})); }
    this.mq.forEach((c) => { try { c.send({ k: "live", code: Net.code }); } catch (e) { /* broker down */ } });
  },
  find(nick) {
    return new Promise((res) => {
      let done = false; const end = (v) => { if (done) return; done = true; mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); res(v); };
      const mq = BROKERS.map((u) => mqttConnect(u, this.topic(nick), (m) => { if (m && m.k === "live" && /^[A-Z0-9]{4,12}$/.test(m.code)) end(m.code); }, () => {}));
      setTimeout(() => end(null), 7000);
    });
  },
};
setInterval(() => { try { Live.tick(); } catch (e) { /* not ready */ } }, 3000);
/* a watcher never plays */
{ const b0 = buzz, a0 = submitAnswer; buzz = function () { if (Watch.code) return; return b0.apply(this, arguments); }; submitAnswer = function () { if (Watch.code) return; return a0.apply(this, arguments); }; }
function watchRowHTML() { return `<div class="row" style="gap:8px;flex-wrap:wrap;margin-top:8px"><span class="fine">Just watching?</span><input id="watchCode" maxlength="12" placeholder="CODE" style="width:110px;text-transform:uppercase"><button type="button" class="btn ghost" data-watch="1">Watch live</button></div>`; }

document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.season) { Season.pick = t.dataset.season; const c = $("#seasonCard"); if (c) { c.outerHTML = Season.card(); Season.board(); } return; }
  if (t.dataset.copylink) { const l = playerLink(Cloud.nick); try { await navigator.clipboard.writeText(l); toast("Link copied", "ach"); } catch (x) { toast(esc(l)); } return; }
  if (t.dataset.plclose) { const b = $("#playerBox"); if (b) b.remove(); if (location.hash.startsWith("#player-")) go("home"); return; }
  if (t.dataset.pladd) { const m = $("#plMsg"); const { data, error } = await Cloud.sb.rpc("add_friend", { p_nick: t.dataset.pladd }); if (m) m.textContent = error ? "Friends aren't switched on yet." : { ok: "Added!", already: "Already your friend." }[data] || data; return; }
  if (t.dataset.plchallenge) { const b = $("#playerBox"); if (b) b.remove(); go("worlds"); toast("Pick a game, play it, then press Challenge a friend on the result.", "ach"); return; }
  if (t.dataset.watch) { const c = (($("#watchCode") || {}).value || "").trim().toUpperCase(); if (!/^[A-Z0-9]{4,12}$/.test(c)) return toast("Type the room code"); Watch.start(c); return; }
  if (t.dataset.watchfr) { t.disabled = true; t.textContent = "Looking…"; const code = await Live.find(t.dataset.watchfr); if (code) Watch.start(code); else { t.disabled = false; t.textContent = "Watch"; toast(`${esc(t.dataset.watchfr)} isn't in an online match right now.`); } return; }
  if (t.dataset.unwatch) { Watch.stop(); go("home"); return; }
});
addEventListener("hashchange", () => { if (Watch.code && !location.hash.startsWith("#w-")) Watch.stop(); checkPlayerHash(); });
checkPlayerHash();
