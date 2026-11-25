/* ================= Party room: up to 8 players on their own phones, one 4-letter code. Everyone answers at once.
   The host's device runs the game and sends what to show; the answer is only sent at the reveal. Every incoming message has
   already been through cleanData() (bk_core.js), and everything is escaped again when drawn. ================= */
const PARTY_MAX = 8, PARTY_ROUNDS = 10, PARTY_SECS = 30;
const Party = {
  role: null, code: "", mq: [], seen: new Set(), pid: "", s: null, timer: null, h: null, drawn: "", lastState: 0,
  games: (w) => (GAMES[w] || []).filter((g) => ["clue", "blur", "photo"].includes(g.kind) && !g.top && !g.reveal && !g.two),
  me() { let v = ""; try { v = sessionStorage.getItem("gp_pid") || ""; if (!v) { v = Math.random().toString(36).slice(2, 10); sessionStorage.setItem("gp_pid", v); } } catch (e) { v = Math.random().toString(36).slice(2, 10); } return v; },
  name() { return (prof().nick || "").trim().slice(0, 16) || "Player"; },
  intro(w) {
    stopQuiz(); Net.close(); this.stop(); this.world = w;
    $("#room").innerHTML = `<div class="card">${gamesBar("Party room")}<p class="sub">Made for 3 to 8 players, each on their own phone or computer. ${PARTY_ROUNDS} questions from ${esc(WORLDS[w].name)}. Everyone types at once: the sooner you are right, the more you score, and a wrong guess costs 50.</p>
      <label class="label" for="pName">Your name</label><input id="pName" maxlength="16" value="${esc(prof().nick || "")}" placeholder="Your name">
      <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn" type="button" data-party="make">Start a party</button><span class="fine">or</span><input id="pCode" maxlength="4" placeholder="CODE" aria-label="Party code" style="width:90px;text-transform:uppercase"><button class="btn ghost" type="button" data-party="join">Join</button></div></div>`;
  },
  open(code) {
    this.code = code; this.seen.clear(); this.drawn = "";
    this.mq = BROKERS.map((u) => mqttConnect(u, "gamesite/v1/party/" + code, (m) => this.recv(m), () => {}));
  },
  send(m) { m.id = Math.random().toString(36).slice(2); m.pid = this.pid; this.mq.forEach((c) => { try { c.send(m); } catch (e) { /* broker down */ } }); },
  stop() {
    if (this.role === "host") this.send({ k: "bye" });
    clearInterval(this.timer); this.timer = null; const old = this.mq; this.mq = []; setTimeout(() => old.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }), 300);
    this.role = null; this.s = null; this.h = null; this.drawn = "";
  },
  keepName() { const v = ($("#pName") || {}).value; if (v != null && v.trim()) { prof().nick = v.trim().slice(0, 16); saveProf(); paintProfileBtn(); } },

  /* ---- host ---- */
  host() {
    this.keepName(); this.stop(); const code = Array.from({ length: 4 }, () => rnd([...codeChars])).join("");
    this.role = "host"; this.pid = "host"; this.open(code);
    this.h = { phase: "lobby", round: 0, players: [{ pid: "host", n: this.name(), score: 0, got: false, fb: "", tries: 0, seen: Date.now(), last: 0 }], used: new Set(), elapsed: 0, wait: 0, q: null };
    this.timer = setInterval(() => this.tick(), 500); this.publish();
  },
  question() {
    const h = this.h, w = this.world, list = this.games(w);
    for (let k = 0; k < 40; k++) {
      const d = rnd(list), x = rnd(byFame(d.pool())); if (!x || h.used.has(x.id)) continue;
      const ans = nameOfAnswer(d, x), img = d.kind === "blur" ? (d.imgKey && x[d.imgKey]) || imgOf(x) : d.kind === "photo" || d.showImg ? imgOf(x) || "" : "";
      if ((d.kind === "blur" || d.kind === "photo") && !img) continue;
      let clues = d.kind === "blur" ? [] : (d.kind === "photo" ? d.hints(x) : d.clues(x)).map((c) => [String(c[0]), String(c[1])]);
      const an = qnorm(ans); if (an.length >= 5 && !["capital", "whose", "albumname", "where", "from", "quiz"].includes(d.id)) clues = clues.filter((c, i) => (i === 0 && d.kind === "clue") || !qnorm(c[1]).includes(an.slice(0, Math.max(5, an.length - 2))) || /^(Initials|Starts with)$/.test(c[0]));
      h.used.add(x.id); return { d, x, ans, img, clues };
    }
    return null;
  },
  next() {
    const h = this.h; if (h.round >= PARTY_ROUNDS) { h.phase = "done"; this.publish(); return; }
    const q = this.question(); if (!q) { h.phase = "done"; this.publish(); return; }
    h.q = q; h.round++; h.phase = "ask"; h.elapsed = 0; h.players.forEach((p) => { p.got = false; p.fb = ""; p.tries = 0; }); this.publish();
  },
  here() { const t = Date.now(); return this.h.players.filter((p) => p.pid === "host" || t - p.seen < 20000); },
  tick() {
    const h = this.h; if (!h) return;
    if (h.phase === "ask") { h.elapsed += 0.5; if (h.elapsed >= PARTY_SECS || this.here().every((p) => p.got)) { h.phase = "reveal"; h.wait = 6; } }
    else if (h.phase === "reveal") { h.wait -= 0.5; if (h.wait <= 0) return this.next(); }
    if (Math.round(h.elapsed * 2) % 2 === 0) this.publish();
  },
  guess(pid, text) {
    const h = this.h, p = h && h.players.find((y) => y.pid === pid); if (!p || h.phase !== "ask" || p.got || Date.now() - p.last < 900) return;
    p.last = Date.now(); const t = String(text || "").slice(0, 80); if (!t.trim()) return;
    const { d, x, ans } = h.q, w = this.world;
    let ok = nameOK(t, ans, altsFor(d, x, ans));
    if (!ok) { const m = resolveGuess(t, suggestPool(d, w), (y) => y.n); ok = !!m && qnorm(m.n) === qnorm(ans); }
    p.tries++;
    if (ok) { const pts = Math.max(100, Math.round(1000 * (1 - h.elapsed / PARTY_SECS))); p.score += pts; p.got = true; p.fb = `Right! +${pts}`; }
    else { p.score = Math.max(0, p.score - 50); p.fb = "Not that. Try again."; }
    this.publish();
  },
  view() {
    const h = this.h, q = h.q, s = { phase: h.phase, round: h.round, rounds: PARTY_ROUNDS, world: this.world, left: Math.max(0, Math.ceil(PARTY_SECS - h.elapsed)),
      players: h.players.map((p) => ({ pid: p.pid, n: p.n, score: p.score, got: p.got, fb: p.fb, tries: p.tries, here: p.pid === "host" || Date.now() - p.seen < 20000 })) };
    if (q && (h.phase === "ask" || h.phase === "reveal")) {
      const kind = q.d.kind, n = kind === "photo" ? Math.floor(h.elapsed / (PARTY_SECS / 3)) : 1 + Math.floor(h.elapsed / (PARTY_SECS / (q.clues.length + 1)));
      s.game = q.d.name; s.img = q.img; s.blur = kind === "blur" && h.phase === "ask" ? BLUR[Math.min(BLUR.length - 1, Math.floor(h.elapsed / 4))] : 0;
      s.clues = h.phase === "reveal" ? q.clues : q.clues.slice(0, n);
      if (h.phase === "reveal") s.answer = q.ans;
    }
    return s;
  },
  publish() { if (this.role !== "host" || !this.h) return; const s = this.view(); this.send({ k: "state", s }); this.s = s; this.draw(); },

  /* ---- guest ---- */
  join(code) {
    this.keepName(); this.stop(); const c = String(code || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (c.length !== 4) { toast("Type the 4-letter code"); return; }
    this.role = "guest"; this.pid = this.me(); this.open(c); this.lastState = Date.now();
    $("#room").innerHTML = `<div class="card">${gamesBar("Party room")}<p class="fine" id="pWait">Looking for party ${esc(c)}…</p></div>`;
    const hello = () => this.send({ k: "join", n: this.name() });
    setTimeout(hello, 900); let beat = 0;
    this.timer = setInterval(() => {
      beat++; if (!this.s) { hello(); if (beat >= 4 && $("#pWait")) $("#pWait").textContent = `No party found with code ${c} yet. Check the code, and that the host still has the page open.`; }
      else { this.send({ k: "ping" }); if (Date.now() - this.lastState > 15000) { const f = $("#pFeed"); if (f) f.textContent = "The host has gone quiet. Waiting…"; } }
    }, 3000);
  },
  recv(m) {
    if (!m || typeof m !== "object" || m.pid === this.pid || this.seen.has(m.id)) return; this.seen.add(m.id); if (this.seen.size > 4000) this.seen.clear();
    if (this.role === "host" && this.h) {
      const h = this.h; let p = h.players.find((y) => y.pid === m.pid);
      if (m.k === "join") {
        if (!p) { if (h.players.length >= PARTY_MAX) return; let n = String(m.n || "Player").slice(0, 16); while (h.players.some((y) => y.n === n)) n = n.slice(0, 13) + " " + (h.players.length + 1); p = { pid: String(m.pid).slice(0, 12), n, score: 0, got: false, fb: "", tries: 0, last: 0 }; h.players.push(p); Snd.lock(); }
        p.seen = Date.now(); this.publish();
      } else if (p) { p.seen = Date.now(); if (m.k === "ans" && m.r === h.round) this.guess(p.pid, m.t); }
    } else if (this.role === "guest" && m.pid === "host") {
      if (m.k === "bye") { this.stop(); $("#room").innerHTML = `<div class="card">${gamesBar("Party room")}<p class="fine">The host closed the party.</p></div>`; return; }
      if (m.k === "state" && m.s && Array.isArray(m.s.players)) {
        const first = !this.s; this.s = m.s; this.lastState = Date.now();
        if (first && WORLDS[m.s.world]) { this.world = m.s.world; if (!m.s.players.some((p) => p.pid === this.pid) && m.s.players.length >= PARTY_MAX) { this.stop(); $("#room").innerHTML = `<div class="card">${gamesBar("Party room")}<p class="fine">That party is full.</p></div>`; return; } }
        this.draw();
      }
    }
  },
  say() {
    const i = $("#pIn"), t = i ? i.value : ""; if (!t.trim() || !this.s) return; i.value = ""; i.focus({ preventScroll: true });
    if (this.role === "host") this.guess("host", t); else this.send({ k: "ans", t: t.slice(0, 80), r: this.s.round });
  },

  /* ---- both: draw the skeleton when the phase changes, then only update what moves, so typing is never interrupted ---- */
  draw() {
    const s = this.s, room = $("#room"); if (!s || !room) return;
    const mine = s.players.find((p) => p.pid === this.pid), key = `${s.phase}:${s.round}:${s.phase === "lobby" ? s.players.length : ""}:${mine && mine.got ? 1 : 0}`;
    const board = [...s.players].sort((a, b) => b.score - a.score).map((p) => `<li class="${p.pid === this.pid ? "me" : ""} ${p.here === false ? "gone" : ""}"><span>${esc(p.n)}${p.got ? " ✓" : ""}</span><b class="num">${Number(p.score) || 0}</b></li>`).join("");
    if (key !== this.drawn || !$("#pBoard")) {
      const had = ($("#pIn") || {}).value || "", sameRound = this.drawn.startsWith(`${s.phase}:${s.round}:`);
      this.drawn = key; let body = "";
      if (s.phase === "lobby") body = `<p class="sub">Party code</p><div class="pcode num">${esc(this.code)}</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="btn ghost" type="button" data-party="copy">Copy the invite link</button>${this.role === "host" ? `<button class="btn" type="button" data-party="start" ${s.players.length < 2 ? "disabled" : ""}>Start with ${s.players.length} player${s.players.length === 1 ? "" : "s"}</button>` : ""}</div><p class="fine">${this.role === "host" ? "Made for 3 to 8. Keep this page open: your device runs the game." : "You're in. Waiting for the host to start."}</p>`;
      else if (s.phase === "done") { const top = [...s.players].sort((a, b) => b.score - a.score)[0]; body = `<h3 class="pwin">${esc(top.n)} wins the party</h3>${this.role === "host" ? `<button class="btn" type="button" data-party="again">Play again</button>` : `<p class="fine">The host can start another.</p>`}`; if (top.pid === this.pid) { try { confetti(); Snd.win(); } catch (e) { /* quiet */ } } }
      else body = `<div class="qhud"><span class="label">Question ${Number(s.round)} of ${Number(s.rounds)} · ${esc(s.game || "")}</span><span class="num qscore" id="pLeft"></span></div>${s.img ? `<div class="blurpic"><img id="pImg" src="${esc(s.img)}" alt=""></div>` : ""}<div id="pClues" class="clues"></div>${s.phase === "reveal" ? `<div class="rcard on"><div class="label">The answer</div><h3 style="font-size:28px">${esc(s.answer || "")}</h3></div>` : mine && mine.got ? `<div class="rcard on"><b>You got it. Waiting for the others…</b></div>` : `<div class="answerbox"><div class="row"><input id="pIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type your answer" aria-label="Your answer"><button class="btn" type="button" data-party="say">Guess</button></div></div>`}<div class="fine" id="pFeed" role="status"></div>`;
      room.innerHTML = `<div class="card">${gamesBar("Party room")}${body}<ol id="pBoard" class="pboard"></ol></div>`;
      const i = $("#pIn"); if (i) { if (sameRound) i.value = had; i.focus({ preventScroll: true }); }
    }
    $("#pBoard").innerHTML = board;
    const left = $("#pLeft"); if (left) left.textContent = s.phase === "ask" ? `${Number(s.left)}s` : "";
    const img = $("#pImg"); if (img) img.style.filter = s.blur ? `blur(${Number(s.blur)}px)` : "";
    const cl = $("#pClues"); if (cl) cl.innerHTML = (s.clues || []).map((c) => `<div class="clue on"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>`).join("");
    const feed = $("#pFeed"); if (feed) feed.textContent = mine && s.phase === "ask" ? mine.fb || "" : "";
  },
};
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-party]"); if (!t) return; const a = t.dataset.party; Snd.unlock();
  if (a === "make") Party.host();
  else if (a === "join") Party.join(($("#pCode") || {}).value);
  else if (a === "start") Party.next();
  else if (a === "again") { const h = Party.h; if (h) { h.round = 0; h.used.clear(); h.players.forEach((p) => { p.score = 0; }); Party.next(); } }
  else if (a === "say") Party.say();
  else if (a === "copy") { const link = location.href.split("#")[0] + "#party-" + Party.code; (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => toast("Invite link copied")).catch(() => toast(esc(link))); }
});
document.addEventListener("keydown", (e) => { if (e.target.id === "pIn" && e.key === "Enter") { e.preventDefault(); Party.say(); } });
addEventListener("pagehide", () => Party.stop());
{ const route0 = route; route = function (ev) {
  const h = (location.hash || "").slice(1);
  Party.stop();
  if (h.startsWith("party-")) {
    const code = h.slice(6).toUpperCase().replace(/[^A-Z]/g, "").slice(0, 4);
    try { history.replaceState(null, "", "#home"); } catch (e) { /* keep the hash */ }
    stopQuiz(); Net.close(); S.world = "kpop"; S.game = null; setTheme("kpop", ev); show("league"); renderWorld(); Party.intro("kpop"); $("#pCode").value = code;
    return;
  }
  return route0.apply(this, arguments);
}; }
