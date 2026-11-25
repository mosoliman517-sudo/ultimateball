/* ================= accounts (Supabase), leaderboards, daily challenge, home "For you" =================
   Accounts: email + password through Supabase Auth. Your progress (XP, ranks, Dex, loading screens, achievements, best scores)
   is saved to your account and merged with what this browser already has, so nothing is lost when you sign in on a new device.
   The publishable key below is meant to be public; the tables are protected by row-level security (db/001_accounts.sql). */
const SB = { url: "https://qzskqkfidobxbxqlgexh.supabase.co", key: "sb_publishable_GUI7T86m1nuewXzUZ8-sKw_99Vpqai-" };
const isoWeek = (d = new Date()) => { const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); const day = t.getUTCDay() || 7; t.setUTCDate(t.getUTCDate() + 4 - day); const y0 = new Date(Date.UTC(t.getUTCFullYear(), 0, 1)); return t.getUTCFullYear() * 100 + Math.ceil(((t - y0) / 864e5 + 1) / 7); };
const gameKey = (k) => k.replace(":", "_").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 24);
function seeded(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; }

/* merge two saved profiles: keep the best of both (higher XP, every card, every screen, every achievement, best scores) */
function mergeProf(a, b) {
  const o = Object.assign({}, a, b), mx = (x, y) => Math.max(x || 0, y || 0);
  o.xp = mx(a.xp, b.xp); o.elo = mx(a.elo, b.elo);
  o.ach = Object.assign({}, b.ach, a.ach); o.splashes = Object.assign({}, b.splashes, a.splashes); o.days = Object.assign({}, b.days, a.days);
  o.dex = {}; new Set([...Object.keys(a.dex || {}), ...Object.keys(b.dex || {})]).forEach((k) => { o.dex[k] = mx((a.dex || {})[k], (b.dex || {})[k]); });
  o.worlds = {}; new Set([...Object.keys(a.worlds || {}), ...Object.keys(b.worlds || {})]).forEach((k) => { const x = (a.worlds || {})[k] || {}, y = (b.worlds || {})[k] || {}; o.worlds[k] = { xp: mx(x.xp, y.xp), plays: mx(x.plays, y.plays) }; });
  o.best = Object.assign({}, a.best); Object.entries(b.best || {}).forEach(([k, v]) => { if (!o.best[k] || v.score > o.best[k].score) o.best[k] = v; });
  o.daily = Object.assign({}, b.daily, a.daily); o.gplays = Object.assign({}, b.gplays, a.gplays); o.boards = Object.assign({}, b.boards, a.boards);
  o.nick = a.nick || b.nick; o.avatar = a.avatar || b.avatar;
  o.badges = Object.assign({}, b.badges, a.badges); o.mseen = Object.assign({}, b.mseen, a.mseen); o.mchest = Object.assign({}, b.mchest, a.mchest); o.missions = Object.assign({}, a.missions, b.missions);
  Object.entries(a.missions || {}).forEach(([d, r]) => { const c = (b.missions || {})[d]; if (!c || Object.keys(r.done || {}).length >= Object.keys(c.done || {}).length) o.missions[d] = r; });
  o.stats = Object.assign({}, a.stats, b.stats); Object.keys(o.stats).forEach((k) => { o.stats[k] = mx((a.stats || {})[k], (b.stats || {})[k]); });
  o.outfit = a.outfit || b.outfit; o.relo = Object.assign({}, a.relo, b.relo); o.season = ((b.season || {}).m || "") >= ((a.season || {}).m || "") ? b.season || a.season : a.season; o.chessTr = Object.assign({}, a.chessTr, b.chessTr); o.title = a.title || b.title; o.banner = a.banner || b.banner; o.showcase = (a.showcase && a.showcase.length ? a.showcase : b.showcase); o.kick = Object.assign({}, b.kick, a.kick); o.fits = Object.assign({}, b.fits, a.fits);
  return o;
}

/* what an email link (confirm / reset / expired) put in the address bar: read it before the library clears it */
const AUTH_LINK = (() => { const h = new URLSearchParams(location.hash.slice(1)); return { error: h.get("error_description") || h.get("error"), code: h.get("error_code"), type: h.get("type") }; })();
const acctError = (m) => /rate limit|only request this after|security purposes/i.test(m) ? "Too many emails sent just now. Wait a while (up to an hour) and try again."
  : /not authorized|error sending/i.test(m) ? "The account server could not send email to that address. The site owner needs to finish the email setup."
  : /not confirmed/i.test(m) ? "That email isn't confirmed yet. Open the link in the email we sent you."
  : /invalid login/i.test(m) ? "Wrong email or password. New here? Press Create account."
  : /already registered/i.test(m) ? "That email already has an account. Press Sign in."
  : /failed to fetch|network/i.test(m) ? "Can't reach the account server. Check your connection." : m;

var Cloud = {
  sb: null, user: null, nick: "", t: null, busy: false, recovery: false,
  on() { return !!(SB.url && window.supabase && this.sb); },
  async init() {
    if (!window.supabase || !SB.url) return;
    try { this.sb = supabase.createClient(SB.url, SB.key); } catch (e) { return; }
    paintProfileBtn();
    const { data } = await this.sb.auth.getSession(); this.user = data.session ? data.session.user : null;
    this.sb.auth.onAuthStateChange((ev, ses) => { if (ev === "PASSWORD_RECOVERY") { this.recovery = true; setTimeout(() => go("profile"), 0); } const was = this.user; this.user = ses ? ses.user : null; if (this.user && !was) this.pull(); this.repaint(); });
    if (this.user) await this.pull(); this.repaint();
    if (AUTH_LINK.error) { go("profile"); toast(esc(AUTH_LINK.code === "otp_expired" ? "That email link has expired or was already used. Sign in, or ask for a new one." : AUTH_LINK.error), "ach"); }
    else if (AUTH_LINK.type === "recovery" && this.user) { this.recovery = true; go("profile"); this.repaint(); }
    else if (AUTH_LINK.type === "signup" && this.user) { go("profile"); toast("<b>Email confirmed</b><br>You're signed in.", "ach"); }
  },
  repaint() { paintProfileBtn(); if ($("#profilePage") && !$("#profilePage").hidden) { renderProfile(); afterProfile(); } },
  async pull() {
    try {
      const { data } = await this.sb.from("progress").select("data").eq("user_id", this.user.id).maybeSingle();
      if (data && data.data && typeof data.data === "object") { store.profile = mergeProf(prof(), data.data); saveStore(); }
      const n = await this.sb.from("profiles").select("nick").eq("user_id", this.user.id).maybeSingle(); this.nick = (n.data && n.data.nick) || "";
      this.pushNow(); this.repaint();
    } catch (e) { /* offline: keep playing locally */ }
  },
  push() { if (!this.user) return; clearTimeout(this.t); this.t = setTimeout(() => this.pushNow(), 3000); },
  async pushNow() { if (!this.user) return; try { await this.sb.from("progress").upsert({ user_id: this.user.id, data: prof(), updated_at: new Date().toISOString() }); } catch (e) { /* retry on the next save */ } },
  async signUp(email, pw) { const r = await this.sb.auth.signUp({ email, password: pw, options: { emailRedirectTo: location.origin + location.pathname } }); return r.error ? acctError(r.error.message) : r.data.session ? "ok" : r.data.user && r.data.user.identities && !r.data.user.identities.length ? acctError("already registered") : "check"; },
  async signIn(email, pw) { const r = await this.sb.auth.signInWithPassword({ email, password: pw }); return r.error ? acctError(r.error.message) : "ok"; },
  async newPassword(pw) { const r = await this.sb.auth.updateUser({ password: pw }); if (!r.error) this.recovery = false; return r.error ? acctError(r.error.message) : "ok"; },
  async reset(email) { const r = await this.sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }); return r.error ? acctError(r.error.message) : "sent"; },
  async signOut() { await this.pushNow(); await this.sb.auth.signOut(); this.user = null; this.nick = ""; this.repaint(); },
  async setNick(n) { const { data, error } = await this.sb.rpc("set_nickname", { p_nick: n }); if (!error && data === "ok") { this.nick = n; prof().nick = n; saveProf(); } return error ? error.message : data; },
  async result(key, score) { if (!this.user || !this.nick) return; try { await this.sb.from("results").insert({ game: gameKey(key), score: Math.round(score), week: isoWeek(), day: todayKey() }); } catch (e) { /* ignore */ } },
  async board(key, period) { try { if (period === "friends") { const { data } = await this.sb.rpc("friends_board", { p_game: gameKey(key) }); return data || []; } const { data } = await this.sb.rpc("leaderboard", { p_game: gameKey(key), p_period: period, p_week: isoWeek(), p_day: todayKey() }); return data || []; } catch (e) { return []; } },
};

function accountCardHTML() {
  if (!window.supabase) return `<div class="card"><div class="label">Account</div><p class="fine">Accounts could not load (offline or blocked). Your progress is saved in this browser.</p></div>`;
  if (!Cloud.user) return `<div class="card acct"><div class="label">Account</div><h3>Save your progress everywhere</h3><p class="fine">Sign in to keep your XP, ranks, Dex, loading screens and achievements on every device, and to get on the leaderboards. What you've earned here comes with you.</p>
    <div class="acctform"><input id="acEmail" type="email" placeholder="Email" autocomplete="email"><input id="acPw" type="password" placeholder="Password (6+ characters)" autocomplete="current-password"></div>
    <div class="row" style="gap:8px;margin-top:10px"><button class="btn" id="acIn" type="button">Sign in</button><button class="btn ghost" id="acUp" type="button">Create account</button><button class="btn ghost" id="acReset" type="button">Forgot password</button></div><div class="fine" id="acMsg" style="margin-top:8px"></div></div>`;
  if (Cloud.recovery) return `<div class="card acct"><div class="label">Account</div><h3>Choose a new password</h3><div class="acctform"><input id="acNew" type="password" placeholder="New password (6+ characters)" autocomplete="new-password"></div><div class="row" style="gap:8px;margin-top:10px"><button class="btn" id="acSetPw" type="button">Save password</button></div><div class="fine" id="acMsg" style="margin-top:8px"></div></div>`;
  return `<div class="card acct"><div class="label">Account</div><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><div><b>Signed in</b> <span class="fine">${esc(Cloud.user.email || "")} · progress saved to your account</span></div><button class="btn ghost" id="acOut" type="button">Sign out</button></div>
    <div class="label" style="margin-top:12px">Leaderboard name</div><div class="row" style="gap:8px"><input id="acNick" value="${esc(Cloud.nick || prof().nick || "")}" maxlength="16" placeholder="3 to 16 letters or numbers"><button class="btn" id="acNickGo" type="button">${Cloud.nick ? "Change" : "Save"}</button></div><div class="fine" id="acMsg" style="margin-top:6px">${Cloud.nick ? "" : "Pick a name to appear on the leaderboards."}</div></div>`;
}
async function accountClick(id) {
  const msg = (t) => { const m = $("#acMsg"); if (m) m.textContent = t; }, em = ($("#acEmail") || {}).value, pw = ($("#acPw") || {}).value;
  if (id === "acOut") return Cloud.signOut();
  if (id === "acSetPw") { const n = ($("#acNew") || {}).value || ""; if (n.length < 6) return msg("Passwords need at least 6 characters."); const r = await Cloud.newPassword(n); if (r !== "ok") return msg(r); toast("Password changed.", "ach"); return Cloud.repaint(); }
  if (id === "acNickGo") { const r = await Cloud.setNick((($("#acNick") || {}).value || "").trim()); return r === "ok" ? Cloud.repaint() : msg(r === "taken" ? "That name is taken." : r === "invalid" ? "3 to 16 letters, numbers, spaces, dots or dashes." : r); }
  if (!em || !/@/.test(em)) return msg("Type your email first.");
  if (id === "acReset") return msg(await Cloud.reset(em).then((r) => (r === "sent" ? "Check your email (and spam) for a reset link." : r)));
  if (!pw || pw.length < 6) return msg("Passwords need at least 6 characters.");
  msg("…"); const r = id === "acUp" ? await Cloud.signUp(em, pw) : await Cloud.signIn(em, pw);
  msg(r === "ok" ? "Welcome!" : r === "check" ? "Almost there: open the link in the email we sent (check spam), then sign in." : r);
}

/* ================= leaderboards: your own best runs on this device, plus the public boards when signed in ================= */
var Boards = {
  record(key, score) { const p = prof(); p.boards = p.boards || {}; const l = (p.boards[key] = p.boards[key] || []); l.push({ s: score, d: todayKey() }); l.sort((a, b) => b.s - a.s); l.length = Math.min(l.length, 10); saveProf(); Cloud.result(key, score); },
  async paint(key, unit, period = "week") {
    const box = $("#boardBox"); if (!box) return; const mine = ((prof().boards || {})[key] || []).slice(0, 5);
    const tabs = Cloud.on() ? `<div class="diffbar" style="margin:8px 0">${[["day", "Today"], ["week", "This week"], ["all", "All time"], ...(Cloud.user ? [["friends", "Friends"]] : [])].map(([k, n]) => `<button type="button" class="chip" data-board="${k}" data-bkey="${esc(key)}" data-bunit="${unit}" aria-pressed="${period === k}">${n}</button>`).join("")}</div>` : "";
    box.innerHTML = `<div class="label">Leaderboard</div>${tabs}<div id="boardList" class="fine">${Cloud.on() ? "Loading…" : ""}</div><div class="label" style="margin-top:12px">Your best runs</div>${mine.length ? `<ol class="board">${mine.map((r) => `<li><b class="num">${r.s.toLocaleString()}</b> <span class="fine">${unit} · ${r.d}</span></li>`).join("")}</ol>` : `<p class="fine">Play a solo run to set your first score.</p>`}`;
    if (!Cloud.on()) return;
    const rows = await Cloud.board(key, period), L = $("#boardList"); if (!L) return;
    L.innerHTML = rows.length ? `<ol class="board">${rows.slice(0, 10).map((r, i) => `<li class="${r.nick === Cloud.nick ? "me" : ""}"><span class="rk">${i + 1}</span><b>${esc(r.nick)}</b><span class="num">${Number(r.value).toLocaleString()}</span></li>`).join("")}</ol>` : `<p class="fine">No scores yet${period === "day" ? " today" : period === "week" ? " this week" : ""}. ${Cloud.user ? (Cloud.nick ? "Be the first." : "Pick a leaderboard name in your profile to appear here.") : `<a href="#profile">Sign in</a> to get on the board.`}</p>`;
  },
};

/* ================= daily challenge: the same five rounds for everyone, once a day per category ================= */
var Daily = {
  games(w) { return (GAMES[w] || []).filter((g) => ["clue", "photo", "blur", "audio"].includes(g.kind) && g.id !== "hear"); },
  game(w) { const l = this.games(w); return l[Math.floor(seeded(todayKey() + ":" + w) * l.length)]; },
  rec(w) { return ((prof().daily || {})[todayKey()] || {})[w]; },
  start(w) { const g = this.game(w); if (!g) return; S.diff = "medium"; S.world = w; S.game = g.id; loadingScreen(w, () => { go(`w-${w}`); setTimeout(() => { S.game = g.id; document.body.classList.add("ingame"); addPlay(w); newQuiz(w, g.id, "solo"); Q.s.daily = todayKey() + ":" + w; Q.s.rounds = 5; Q.s.used = new Set(); Q.s.round = 0; Q.s.marks = []; nextRound(); }, 60); }); },
  finish(s) {
    const p = prof(), d = (p.daily = p.daily || {}), t = (d[todayKey()] = d[todayKey()] || {});
    if (!t[s.w]) { t[s.w] = { score: s.scores[0], marks: s.marks || [], game: s.game }; Object.keys(d).sort().slice(0, -14).forEach((k) => delete d[k]); saveProf(); Boards.record(`daily:${s.w}`, s.scores[0]); addXP(25, s.w); }
    const days = Object.keys(d).filter((k) => Object.keys(d[k]).length).length; if (days >= 3) award("daily3");
  },
  share(w) { const r = this.rec(w); if (!r) return ""; return `ultimateball daily · ${WORLDS[w].name} · ${todayKey()}\n${r.marks.map((m) => (m ? "🟩" : "⬛")).join("")} ${r.score.toLocaleString()} pts\nmoultimateball.vercel.app`; },
  streak() { const d = prof().daily || {}; let n = 0; const t = new Date(); for (;;) { const k = new Date(t - n * 864e5).toISOString().slice(0, 10); if (d[k] && Object.keys(d[k]).length) n++; else break; } return n; },
};
if (typeof ACH !== "undefined" && !ACH.find((a) => a[0] === "daily3")) ACH.push(["daily3", "Regular", "Play the daily challenge on 3 days", 1, "calendar"]);

/* ================= home: daily challenges, continue playing, and "For you" picks from what you play ================= */
function forYou() {
  const p = prof(), plays = p.gplays || {}, wp = WORLD_IDS.map((w) => [w, (p.worlds[w] || {}).plays || 0]).sort((a, b) => b[1] - a[1]), out = [];
  const fav = wp[0][1] ? wp[0][0] : "kpop", fresh = GAMES[fav].filter((g) => !plays[fav + ":" + g.id]);
  if (fresh.length) out.push({ w: fav, g: rnd(fresh), why: `New to you in ${WORLDS[fav].name}` });
  const best = Object.entries(p.best || {}).sort((a, b) => b[1].score - a[1].score)[0];
  if (best) { const [w, gid] = best[0].split(":"); const g = gameOf(w, gid); if (g) out.push({ w, g, why: `Beat your best: ${best[1].score.toLocaleString()}` }); }
  const quiet = wp.filter(([w]) => w !== fav).sort((a, b) => a[1] - b[1])[0]; if (quiet) { const g = rnd(GAMES[quiet[0]]); out.push({ w: quiet[0], g, why: `Try something different` }); }
  return out.filter((x, i, A) => x.g && A.findIndex((y) => y.w === x.w && y.g.id === x.g.id) === i).slice(0, 3);
}
const gameFace = (w, g) => { const x = shuffle(g.pool().filter(imgOf)).find(Boolean); return x ? `<img src="${imgOf(x)}" alt="" class="${x.logo || x.flag ? "contain" : ""} ${isCut(x) ? "cutpic" : ""}">` : ""; };
function homeTopHTML() {
  const p = prof(), last = p.last && gameOf(p.last.w, p.last.g) ? p.last : null, st = Daily.streak();
  const daily = WORLD_IDS.filter((w) => Daily.game(w)).map((w, i) => { const r = Daily.rec(w), g = Daily.game(w); return `<button type="button" class="dcard ${r ? "done" : ""}" data-daily="${w}" style="${wvars(w)};--d:${i * 50}ms">${gameFace(w, g)}<span class="dk">${esc(WORLDS[w].name)}</span><b>${esc(g.name)}</b><span class="dm">${r ? `${r.marks.map((m) => (m ? "🟩" : "⬛")).join("")} ${r.score.toLocaleString()}` : "5 rounds · play now"}</span></button>`; }).join("");
  const picks = forYou().map(({ w, g, why }, i) => `<button type="button" class="fycard" data-go="w-${w}-${g.id}" style="${wvars(w)};--d:${i * 60}ms">${gameFace(w, g)}<div><span class="dk">${esc(why)}</span><b>${esc(g.name)}</b><small>${esc(WORLDS[w].name)}</small></div></button>`).join("");
  return `${typeof Mis !== "undefined" && Mis ? Mis.html() : ""}${last ? `<button type="button" class="contbar" data-go="w-${last.w}-${last.g}" style="${wvars(last.w)}">${gameFace(last.w, gameOf(last.w, last.g))}<div><span class="dk">Continue playing</span><b>${esc(gameOf(last.w, last.g).name)}</b><small>${esc(WORLDS[last.w].name)}</small></div><span class="dgo">Play →</span></button>` : ""}
    <h2 class="sec">Daily challenges ${st ? `<span class="fine">🔥 ${st}-day streak</span>` : ""}</h2><p class="secsub">The same five rounds for everyone today, one per category. Come back tomorrow for new ones.</p><div class="dailyrow">${daily}</div>
    ${calDoorHTML()}
    ${picks ? `<h2 class="sec">For you</h2><p class="secsub">Picked from what you play.</p><div class="fyrow">${picks}</div>` : ""}`;
}

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.daily) { const w = t.dataset.daily; if (Daily.rec(w)) { const txt = Daily.share(w); try { navigator.clipboard.writeText(txt); toast("Result copied. Share it!", "ach"); } catch (x) { toast(esc(txt)); } return; } Snd.tick(); Daily.start(w); return; }
  if (t.id === "dShare" && Q.s) { const txt = Daily.share(Q.s.w); try { navigator.clipboard.writeText(txt); toast("Result copied. Share it!", "ach"); } catch (x) { toast(esc(txt)); } return; }
  if (t.dataset.board) { Boards.paint(t.dataset.bkey, t.dataset.bunit, t.dataset.board); return; }
  if (/^ac(In|Up|Out|Reset|NickGo|SetPw)$/.test(t.id)) { accountClick(t.id); return; }
});
document.addEventListener("keydown", (e) => { if (e.key !== "Enter") return; const b = { acEmail: "acIn", acPw: "acIn", acNew: "acSetPw", acNick: "acNickGo" }[e.target.id]; if (b) { e.preventDefault(); accountClick(b); } });
Cloud.init();
if ($("#home") && !$("#home").hidden && $("#homeTop")) $("#homeTop").innerHTML = homeTopHTML();
if (S.game && $("#boardBox")) Boards.paint(`${S.world}:${S.game}`, "points");

/* install as an app: register the service worker, and offer an Install button where the browser supports it */
if ("serviceWorker" in navigator && location.protocol === "https:" && !window.ARTIFACT) navigator.serviceWorker.register("sw.js").catch(() => {});
let installEvt = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; if (!$("#setPage").hidden) renderSettings(); });
function installHTML() {
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  if (standalone) return `<p class="fine">You're using the installed app.</p>`;
  if (installEvt) return `<button class="btn" id="doInstall" type="button">Install ultimateball</button><p class="fine">Adds an app icon; it opens full screen and works offline.</p>`;
  return `<p class="fine">${ios ? "On iPhone or iPad: tap Share, then <b>Add to Home Screen</b>." : "In Chrome or Edge: open the browser menu and choose <b>Install app</b> (or <b>Add to Home screen</b> on Android)."}</p>`;
}
document.addEventListener("click", async (e) => { const t = e.target.closest("#doInstall"); if (!t || !installEvt) return; installEvt.prompt(); await installEvt.userChoice; installEvt = null; renderSettings(); });

/* ================= profile flair: a title (from your achievements), a banner (unlocked by ranks and finds), three showcase cards ================= */
const BANNERS = [
  { id: "", name: "Plain", css: "", need: () => true, how: "" },
  ...Object.keys(WVARS).map((w) => ({ id: "w-" + w, name: (WORLDS[w] || {}).name || w, css: `background:linear-gradient(120deg,${WVARS[w][0]} 0%,${WVARS[w][4]}55 60%,${WVARS[w][3]}44 100%)`, need: (p) => ((p.worlds[w] || {}).xp || 0) >= 100, how: `Silver rank in ${(WORLDS[w] || {}).name || w}` })),
  { id: "gold", name: "Gold foil", css: "background:linear-gradient(120deg,#3a2a06,#8a6a1c 40%,#ffe39a 55%,#8a6a1c 70%,#3a2a06);background-size:200% 100%;animation:goldShift 6s linear infinite", need: (p) => Object.keys(p.splashes || {}).some((k) => /:leg$|:hall$|:stage:/.test(k)), how: "Find a Legendary loading screen" },
  { id: "velvet", name: "Velvet stage", css: "background:radial-gradient(500px 220px at 30% 0,#7a1f5f,#2a0a24 60%,#0d0410)", need: (p) => Object.keys(p.splashes || {}).some((k) => k.startsWith("secret:")), how: "Find a secret loading screen" },
  { id: "holo", name: "Holographic", css: "background:linear-gradient(110deg,#2b1055,#7597de,#ff8ad8,#ffd86f,#2b1055);background-size:300% 100%;animation:goldShift 8s linear infinite", need: (p) => levelOf(p.xp).i >= 4, how: "Reach Quizmaster level" },
];
const bannerCSS = (id) => { const b = BANNERS.find((x) => x.id === id); return b && b.css ? b.css + ";" : ""; };
function showcaseHTML(p) {
  const ks = (p.show || []).filter(dexHas).slice(0, 3); if (!ks.length) return "";
  return `<div class="showcase">${ks.map((k, i) => { const i2 = k.indexOf(":"), w = k.slice(0, i2), x = items(w).find((y) => y.id === k.slice(i2 + 1)); return x ? `<button type="button" class="shcard" data-wiki="${esc(k)}" style="--i:${i};${wvars(w)}">${pic(x)}<b>${esc(x.n)}</b></button>` : ""; }).join("")}</div>`;
}
function flairHTML(p) {
  const titles = ACH.filter(([id]) => p.ach[id]), dex = Object.keys(p.dex || {}).filter(dexHas);
  return `<div class="card"><div class="label">Flair</div>
    <div class="label" style="margin-top:10px">Title <span class="fine">· earned with achievements</span></div><div class="row" style="gap:6px;flex-wrap:wrap;margin-top:6px"><button type="button" class="chip" data-title="" aria-pressed="${!p.title}">None</button>${titles.map(([id, n]) => `<button type="button" class="chip" data-title="${id}" aria-pressed="${p.title === id}">${esc(n)}</button>`).join("") || `<span class="fine">Unlock an achievement to get your first title.</span>`}</div>
    <div class="label" style="margin-top:14px">Banner</div><div class="bnpick">${BANNERS.map((b) => { const ok = b.need(p); return `<button type="button" class="bn ${p.banner === b.id || (!p.banner && !b.id) ? "on" : ""} ${ok ? "" : "locked"}" ${ok ? `data-banner="${b.id}"` : `title="${esc(b.how)}"`} style="${b.css}"><span>${ok ? esc(b.name) : "🔒 " + esc(b.how)}</span></button>`; }).join("")}</div>
    <div class="label" style="margin-top:14px">Showcase <span class="fine">· pick up to 3 cards from your Dex</span></div>${dex.length ? `<div class="avpick" style="margin-top:6px">${dex.slice(0, 80).map((k) => { const i2 = k.indexOf(":"), x = items(k.slice(0, i2)).find((y) => y.id === k.slice(i2 + 1)); return x ? `<button type="button" class="${(p.show || []).includes(k) ? "on" : ""}" data-show="${esc(k)}">${pic(x)}${esc(x.n)}</button>` : ""; }).join("")}</div>` : `<p class="fine">Get someone right three times to add them to your Dex.</p>`}</div>`;
}
document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return; const p = prof();
  if (t.dataset.title != null && t.classList.contains("chip")) { p.title = t.dataset.title; saveProf(); renderProfile(); return; }
  if (t.dataset.banner != null) { p.banner = t.dataset.banner; saveProf(); renderProfile(); return; }
  if (t.dataset.show) { const k = t.dataset.show, l = (p.show = p.show || []); const i = l.indexOf(k); if (i >= 0) l.splice(i, 1); else { l.push(k); if (l.length > 3) l.shift(); } saveProf(); renderProfile(); return; }
});

/* ================= challenge links: send "beat my score" on the exact same rounds; no account needed ================= */
const b64u = { enc: (o) => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), dec: (t) => JSON.parse(decodeURIComponent(escape(atob(t.replace(/-/g, "+").replace(/_/g, "/"))))) };
function challengeLink(s) { return location.origin + location.pathname + "#ch=" + b64u.enc({ w: s.w, g: s.game, d: S.diff, s: s.scores[0], n: (prof().nick || "A friend").slice(0, 16), r: s.picks.slice(0, s.rounds), k: s.wins[0] }); }
function challengeVerdict(s) { const c = s.chal, me = s.scores[0]; return `<div class="chverdict ${me > c.s ? "win" : me < c.s ? "loss" : ""}"><b>${me > c.s ? `You beat ${esc(c.n)}!` : me < c.s ? `${esc(c.n)} wins this one` : "Dead heat!"}</b><span class="num">${me.toLocaleString()} vs ${Number(c.s).toLocaleString()}</span></div>`; }
async function shareChallenge() {
  const s = Q.s; if (!s || !s.picks) return; const url = challengeLink(s), g = gameOf(s.w, s.game), text = `I scored ${s.scores[0].toLocaleString()} in ${g.name} (${WORLDS[s.w].name}) on ultimateball. Same rounds, your turn:`;
  try { if (navigator.share) { await navigator.share({ title: "ultimateball challenge", text, url }); return; } } catch (e) { /* cancelled */ }
  try { await navigator.clipboard.writeText(text + " " + url); toast("Challenge link copied. Send it to a friend!", "ach"); } catch (e) { prompt("Copy this link", url); }
}
function openChallenge(c) {
  const g = gameOf(c.w, c.g); if (!g || !Array.isArray(c.r) || !c.r.length) return;
  let pop = $("#wikiPop"); if (!pop) { pop = document.createElement("div"); pop.id = "wikiPop"; pop.className = "wikipop"; document.body.appendChild(pop); }
  const x = items(c.w).find((y) => y.id === c.r[0]); pop.hidden = false; pop.style.cssText = wvars(c.w);
  pop.innerHTML = `<div class="wp-card chcard" role="dialog"><button class="wp-x" type="button" data-wclose="1" aria-label="Close">×</button><div class="wp-body"><div class="label">You've been challenged</div><h2>${esc(c.n)} scored ${Number(c.s).toLocaleString()}</h2><p>in <b>${esc(g.name)}</b> · ${esc(WORLDS[c.w].name)} · ${esc(diffNameFor(c.d))}. Same ${c.r.length} rounds, same difficulty. Can you beat it?</p><div class="row" style="gap:8px;margin-top:12px"><button class="btn" id="chPlay" type="button">Accept the challenge</button><button class="btn ghost" data-wclose="1" type="button">Not now</button></div></div></div>`;
  openChallenge.c = c;
}
const diffNameFor = (d) => ({ easy: "Easy", medium: "Medium", hard: "Hard", elite: "Elite" })[d] || "Medium";
function playChallenge(c) {
  closeWiki(); S.diff = c.d || "medium"; S.world = c.w; S.game = c.g;
  loadingScreen(c.w, () => { go(`w-${c.w}`); setTimeout(() => { document.body.classList.add("ingame"); addPlay(c.w); newQuiz(c.w, c.g, "solo"); const s = Q.s; s.fixed = c.r; s.chal = c; s.rounds = c.r.length; s.used = new Set(); s.round = 0; s.picks = []; s.marks = []; s.scores = [0]; s.wins = [0, 0]; s.streak = 0; nextRound(); }, 60); });
}
function checkChallengeHash() { const h = location.hash; if (!h.startsWith("#ch=")) return; try { const c = b64u.dec(h.slice(4)); history.replaceState(null, "", "#home"); route(); setTimeout(() => openChallenge(c), 300); } catch (e) { /* broken link */ } }
window.addEventListener("hashchange", checkChallengeHash); checkChallengeHash();
document.addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.id === "qChal") shareChallenge(); if (t.id === "chPlay" && openChallenge.c) playChallenge(openChallenge.c); });

/* ================= friends: add by leaderboard name, see their level and title, compare scores on every board ================= */
function friendsCardHTML() {
  if (!Cloud.user) return "";
  if (!Cloud.nick) return `<div class="card"><div class="label">Friends</div><p class="fine">Pick a leaderboard name above first; friends find you by it.</p></div>`;
  setTimeout(paintFriends, 0);
  return `<div class="card"><div class="label">Friends</div><p class="fine">Add friends by their leaderboard name. Your name is <b>${esc(Cloud.nick)}</b>. Every game's leaderboard gets a Friends tab.</p><div class="row" style="gap:8px;margin-top:8px"><input id="frNick" placeholder="Their leaderboard name" maxlength="16"><button class="btn" id="frAdd" type="button">Add friend</button></div><div class="fine" id="frMsg" style="margin-top:6px"></div><div id="frList" class="frlist"></div></div>`;
}
async function paintFriends() {
  const box = $("#frList"); if (!box) return; box.innerHTML = `<p class="fine">Loading…</p>`;
  const { data, error } = await Cloud.sb.rpc("my_friends"); if (!$("#frList")) return;
  if (error) { box.innerHTML = `<p class="fine">Friends aren't switched on yet (db/002_friends.sql still needs to run).</p>`; return; }
  box.innerHTML = data && data.length ? data.map((f) => { const lv = levelOf(f.xp || 0); const t = f.title && achOf(f.title); return `<div class="frrow">${avatarHTML(f.avatar || "", "md", f.nick)}<div><b>${esc(f.nick)}</b>${t ? ` <span class="pftitle sm">${esc(t[1])}</span>` : ""}<div class="fine">Level ${lv.i + 1} · ${esc(lv.name)} · ${(f.xp || 0).toLocaleString()} XP${f.follows_back ? " · friends both ways" : ""}</div></div><span class="row" style="gap:6px"><button class="btn ghost" type="button" data-watchfr="${esc(f.nick)}">Watch</button><button class="btn ghost" type="button" data-unfriend="${esc(f.nick)}">Remove</button></span></div>`; }).join("") : `<p class="fine">No friends yet. Add someone by name, or send a challenge link from any game's final score.</p>`;
}
document.addEventListener("click", async (e) => {
  const t = e.target.closest("button"); if (!t || !Cloud.sb) return;
  if (t.id === "frAdd") { const n = (($("#frNick") || {}).value || "").trim(), m = $("#frMsg"); if (!n) return; const { data, error } = await Cloud.sb.rpc("add_friend", { p_nick: n }); if (m) m.textContent = error ? "Friends aren't switched on yet." : { ok: `${n} added!`, notfound: "Nobody has that name.", self: "That's you!", already: "Already your friend." }[data] || data; if (data === "ok") { Snd.win(); paintFriends(); } return; }
  if (t.dataset.unfriend) { await Cloud.sb.rpc("remove_friend", { p_nick: t.dataset.unfriend }); paintFriends(); return; }
});

/* ================= online matchmaking: find a random opponent for the same game and difficulty; ranked Elo per category =================
   Players looking for a match announce themselves on a lobby channel (the same public MQTT brokers the rooms use). When two meet,
   the one with the smaller id hosts, picks a room code and tells the other; then the normal two-device game starts. */
const relo = (w) => ((prof().relo || {})[w] || 1000);
const MM = {
  mq: [], id: null, on: false, beat: null, paired: false, t0: 0,
  topic() { return `gamesite/v1/lobby/${S.world}-${S.game}-${S.diff}`; },
  start() {
    this.stop(); this.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); this.on = true; this.paired = false; this.t0 = Date.now();
    this.mq = BROKERS.map((u) => mqttConnect(u, this.topic(), (m) => this.recv(m), () => {}));
    const me = { k: "seek", id: this.id, nick: prof().nick || "Player", av: prof().avatar, elo: relo(S.world) };
    this.beat = setInterval(() => { this.send(me); this.paint(); }, 1500); this.paint();
  },
  send(m) { this.mq.forEach((c) => { try { c.send(m); } catch (e) { /* broker down */ } }); },
  stop() { clearInterval(this.beat); this.mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); this.mq = []; this.on = false; },
  recv(m) {
    if (!this.on || this.paired || !m || m.id === this.id) return;
    if (m.k === "seek" && this.id < m.id) { this.paired = true; const code = "R" + (m.id + this.id).replace(/[^a-z0-9]/g, "").slice(-8).toUpperCase(); const me = { k: "pair", to: m.id, id: this.id, code, nick: prof().nick || "Player", av: prof().avatar, elo: relo(S.world) }; for (let i = 0; i < 3; i++) setTimeout(() => this.send(me), i * 400); setTimeout(() => this.enter("host", code, m), 1300); }
    else if (m.k === "pair" && m.to === this.id) { this.paired = true; this.enter("guest", m.code, m); }
  },
  enter(role, code, opp) {
    this.stop(); Net.guestName = ""; Net.ranked = { w: S.world, opp: opp.nick, oppElo: opp.elo || 1000, done: false }; Snd.win();
    if (role === "host") { Net.role = "host"; Net.open(code); Vs.wait(code, S.game); }
    else { Net.role = "guest"; Q.s = null; Net.open(code); [1200, 2500, 4000, 6000, 9000, 13000].forEach((ms) => setTimeout(() => { if (!Q.s && Net.code === code) Net.send({ k: "hello", nick: prof().nick || "Guest", av: prof().avatar }); }, ms)); Vs.join(code); }
  },
  paint() { const b = $("#mmBox"); if (!b) return; const sec = Math.round((Date.now() - this.t0) / 1000); b.innerHTML = this.on ? `<div class="mmsearch"><div class="mmradar"><i></i><i></i><i></i></div><div><b>Looking for an opponent…</b><div class="fine">${S.diff ? esc(diffName(S.diff)) : ""} · ${sec}s · your ${esc(WORLDS[S.world].name)} rating ${relo(S.world)}</div><div class="fine">Tip: share the game with a friend so you meet faster, or use a room code below.</div></div><button class="btn ghost" id="mmCancel" type="button">Cancel</button></div>` : mmButton(); },
};
const mmButton = () => `<button class="btn" id="mmGo" type="button">Find an opponent (ranked)</button><span class="fine" style="margin-left:8px">Your ${esc(WORLDS[S.world].name)} rating: <b>${relo(S.world)}</b></span>`;
function matchmakingHTML() { return `<div class="card" style="margin-top:12px"><div class="label">Ranked: play anyone online</div><div id="mmBox" style="margin-top:8px">${mmButton()}</div></div>`; }
function rankedDone(s) {
  const R = Net.ranked; if (!R || R.done || R.w !== s.w) return; R.done = true;
  const me = Net.role === "guest" ? 1 : 0, mine = s.scores[me], theirs = s.scores[1 - me], res = mine > theirs ? 1 : mine < theirs ? 0 : 0.5;
  const p = prof(), cur = relo(s.w), exp = 1 / (1 + 10 ** ((R.oppElo - cur) / 400)), d = Math.round(32 * (res - exp));
  p.relo = p.relo || {}; p.relo[s.w] = Math.max(100, cur + d); p.ranked = p.ranked || { w: 0, l: 0, d: 0 }; p.ranked[res === 1 ? "w" : res === 0 ? "l" : "d"]++; saveProf();
  toast(`<b>Ranked ${res === 1 ? "win" : res === 0 ? "loss" : "draw"} vs ${esc(R.opp)}</b><br>${esc(WORLDS[s.w].name)} rating ${p.relo[s.w]} (${d >= 0 ? "+" : ""}${d})`, "ach");
  if (res === 1) award("ranked_win");
}
if (typeof ACH !== "undefined" && !ACH.find((a) => a[0] === "ranked_win")) ACH.push(["ranked_win", "Online threat", "Win a ranked match online", 1, "swords"]);
document.addEventListener("click", (e) => { const t = e.target.closest("button"); if (!t) return; if (t.id === "mmGo") { Snd.tick(); MM.start(); } if (t.id === "mmCancel") { MM.stop(); MM.paint(); } });
window.addEventListener("hashchange", () => { if (MM.on) MM.stop(); });

/* ================= badges, stats and XP rules =================
   Stats are counted from real finished games only. XP is capped per day, and a game+difficulty played again and again
   earns less each time, so repeating an easy run is not a way to farm levels. */
const RARITY = [["Common", "#9aa3b2"], ["Uncommon", "#4ade80"], ["Rare", "#38bdf8"], ["Epic", "#c084fc"], ["Legendary", "#fbbf24"]];
const XP_DAY_CAP = 900, XP_PER_GAME_DAY = 220;
function xpGate(n) {
  const p = prof(), d = todayKey(); p.xpDay = p.xpDay && p.xpDay.d === d ? p.xpDay : { d, total: 0, games: {} };
  const key = `${S.world || "-"}:${S.game || "-"}:${S.diff}`, used = p.xpDay.games[key] || 0;
  let out = Math.round(n * (used < 3 ? 1 : used < 6 ? 0.5 : 0.2));           // repeats earn less
  out = Math.min(out, XP_PER_GAME_DAY - used, XP_DAY_CAP - p.xpDay.total);
  out = Math.max(0, out);
  p.xpDay.games[key] = used + out; p.xpDay.total += out; saveProf();
  return out;
}
const STAT0 = () => ({ games: 0, wins: 0, perfect: 0, hear: 0, idol: 0, elite: 0, bestStreak: 0, rounds: 0 });
function recordGame(s) {
  const p = prof(), st = (p.stats = Object.assign(STAT0(), p.stats)), solo = s.mode === "solo";
  if (!solo) return;
  st.games++; st.rounds += s.rounds || 0; st.bestStreak = Math.max(st.bestStreak, s.best || 0);
  const won = (s.wins[0] || 0) >= Math.ceil((s.rounds || 1) / 2);
  if (won) st.wins++;
  if ((s.wins[0] || 0) === (s.rounds || 0) && (s.rounds || 0) > 0) st.perfect++;
  if (S.diff === "elite" && won) st.elite++;
  checkBadges();
}
function countRound(s, winner, pts) {   // called on every round that someone got right
  if (winner !== 0) return; const p = prof(), st = (p.stats = Object.assign(STAT0(), p.stats)), d = s.mix ? null : gameOf(s.w, s.game);
  if (d && d.kind === "audio") st.hear++;
  if (d && d.unit === "idol") st.idol++;
  saveProf(); checkBadges();
}
const BADGES = [
  { id: "first_steps", name: "First Steps", how: "Complete your first game", r: 0, ok: (p, st) => st.games >= 1, icon: "star" },
  { id: "rising_star", name: "Rising Star", how: "Reach 300 XP", r: 1, ok: (p) => p.xp >= 300, icon: "trend" },
  { id: "perfect", name: "Perfect Performance", how: "Win every round of a solo game", r: 2, ok: (p, st) => st.perfect >= 1, icon: "target" },
  { id: "dedicated", name: "Dedicated Fan", how: "Finish 50 solo games", r: 1, ok: (p, st) => st.games >= 50, icon: "users" },
  { id: "song_detective", name: "Song Detective", how: "Name 10 songs in Listen to the Song", r: 2, ok: (p, st) => st.hear >= 10, icon: "bolt" },
  { id: "idol_expert", name: "Idol Expert", how: "Name 25 idols in K-pop games", r: 2, ok: (p, st) => st.idol >= 25, icon: "gem" },
  { id: "elite_knowledge", name: "Elite Knowledge", how: "Win 5 solo games on Elite", r: 3, ok: (p, st) => st.elite >= 5, icon: "crown" },
  { id: "streak_master", name: "Streak Master", how: "Reach a streak of 10 points in a solo run", r: 3, ok: (p, st) => st.bestStreak >= 10, icon: "flame" },
  { id: "variety_stan", name: "Variety Stan", how: "Play a game in every category", r: 4, ok: (p) => WORLD_IDS.every((w) => ((p.worlds || {})[w] || {}).plays > 0), icon: "globe" },
];
function checkBadges() {
  const p = prof(), st = Object.assign(STAT0(), p.stats); p.badges = p.badges || {};
  BADGES.forEach((b) => {
    if (p.badges[b.id] || !b.ok(p, st)) return;
    p.badges[b.id] = todayKey(); saveProf();
    toast(`<b>Badge unlocked · ${RARITY[b.r][0]}</b><br>${esc(b.name)}: ${esc(b.how)}`, "ach"); Snd.win();
  });
}
const BadgeUI = {
  html() {
    const p = prof(), st = Object.assign(STAT0(), p.stats), got = p.badges || {};
    const rows = BADGES.map((b) => {
      const on = !!got[b.id], col = RARITY[b.r][1];
      return `<div class="bgcard ${on ? "on" : "locked"}" style="--rc:${col}" title="${esc(b.how)}"><svg class="ic"><use href="#i-${b.icon}"/></svg><b>${esc(b.name)}</b><span class="fine">${on ? RARITY[b.r][0] : "🔒 " + esc(b.how)}</span></div>`;
    }).join("");
    const win = st.games ? Math.round((100 * st.wins) / st.games) : 0;
    return `<div class="card"><div class="label">Badges ${Object.keys(got).length} of ${BADGES.length}</div><div class="bdgrid" style="margin-top:8px">${rows}</div>
      <div class="label" style="margin-top:14px">Stats</div><div class="statgrid"><div><b>${st.games}</b><span class="fine">Solo games</span></div><div><b>${win}%</b><span class="fine">Win rate</span></div><div><b>${st.bestStreak}</b><span class="fine">Best streak</span></div><div><b>${(p.best && Object.values(p.best).reduce((m, v) => Math.max(m, v.score), 0) || 0).toLocaleString()}</b><span class="fine">Highest score</span></div></div>
      <div class="fine" style="margin-top:8px">XP today ${((p.xpDay && p.xpDay.d === todayKey()) ? p.xpDay.total : 0)} of ${XP_DAY_CAP}. Repeating the same game and difficulty earns less each time.</div></div>`;
  },
};

/* ================= K-pop question selection: diversity, cooldown, weighted randomness =================
   Replaces plain random picks. A candidate's weight multiplies:
     popularity   0.6 to 2.0 by how known it is within its own kind (famous appears more, nobody is shut out)
     recency      songs: 2025-26 x1.25, 2024 x1.15, 2023 x1.0, 2022 x0.8
     cooldown     seen in the last 12 picks (across sessions) x0.05, last 40 x0.3, last 120 x0.7
     group spread each time this session already used the group, weight / (1 + 1.5 x uses); the same group as the last pick x0.1
     headcount    an idol's weight is divided by sqrt(group size), so a 13-member group does not get 13 shares
   The four legacy groups (TWICE, BLACKPINK, BTS, IZ*ONE) get a fixed 18% share of the draws, the rest go to the modern groups. */
var Pick = {
  ctx() { return { gc: {}, last: null }; },
  gkey(x) { return x.kind === "group" ? x.n : x.by || (x.groups || [])[0] || x.n; },
  pct(x) {   // fame percentile within the same kind (1 = best known)
    const k = x.kind; Pick._p = Pick._p || {}; if (!Pick._p[k]) { const f = items("kpop", (y) => y.kind === k).map((y) => y.fame || 0).sort((a, b) => a - b); Pick._p[k] = f; }
    const f = Pick._p[k]; let lo = 0, hi = f.length; while (lo < hi) { const m = (lo + hi) >> 1; if (f[m] < (x.fame || 0)) lo = m + 1; else hi = m; } return f.length > 1 ? lo / (f.length - 1) : 0.5;
  },
  weight(x, c) {
    const p = prof(), rc = p.rc || 0, last = (p.recent || {})[x.id];
    let w = 0.6 + 1.4 * Pick.pct(x);
    if (x.kind === "song") { const y = +(x.date || "").slice(0, 4); w *= y >= 2025 ? 1.25 : y === 2024 ? 1.15 : y === 2022 ? 0.8 : 1; }
    if (last != null) { const age = rc - last; w *= age < 12 ? 0.05 : age < 40 ? 0.3 : age < 120 ? 0.7 : 1; }
    const g = Pick.gkey(x); w /= 1 + 1.5 * (c.gc[g] || 0); if (c.last && c.last === g) w *= 0.1;
    if (x.kind === "idol") { const gr = groupOf(g); const n = gr ? Math.max(1, rosterOf("kpop", gr).length) : 5; w /= Math.sqrt(n); }
    return Math.max(w, 1e-6);
  },
  choose(pool, c) {
    if (!pool.length) return null; c = c || Pick.ctx();
    const L = pool.filter((x) => kbucket(x) === "L"), M = pool.filter((x) => kbucket(x) !== "L");
    const from = L.length && M.length ? (Math.random() < 0.18 ? L : M) : pool;
    const ws = from.map((x) => Pick.weight(x, c)), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot;
    for (let i = 0; i < from.length; i++) { r -= ws[i]; if (r <= 0) return from[i]; }
    return from[from.length - 1];
  },
  record(x, c) {
    if (!x) return; const p = prof(); p.recent = p.recent || {}; p.rc = (p.rc || 0) + 1; p.recent[x.id] = p.rc;
    const g = Pick.gkey(x); c.gc[g] = (c.gc[g] || 0) + 1; c.last = g;
    const keys = Object.keys(p.recent); if (keys.length > 400) { keys.sort((a, b) => p.recent[a] - p.recent[b]).slice(0, keys.length - 300).forEach((k) => delete p.recent[k]); }   // keep the history small
    saveProf();
  },
};

/* ================= pictures that never break: primary, then a verified fallback, then a clean placeholder =================
   A failed picture is never swapped for another person's: the placeholder carries the idol's own initial and name. */
document.addEventListener("error", (e) => {
  const im = e.target; if (!im || im.tagName !== "IMG" || im.dataset.ph) return;
  const alt = (im.getAttribute("alt") || "").trim(), fb = im.dataset.fallback;
  if (fb && im.src !== fb && !im.dataset.tried) { im.dataset.tried = "1"; im.src = fb; return; }
  im.dataset.ph = "1"; const ph = document.createElement("span"); ph.className = "imgph " + (im.className || ""); ph.setAttribute("role", "img"); ph.setAttribute("aria-label", alt || "no picture");
  ph.textContent = (alt || "?").replace(/^(the|a)\s+/i, "")[0].toUpperCase(); im.replaceWith(ph);
}, true);
