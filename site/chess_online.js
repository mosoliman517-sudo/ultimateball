/* ================= play a friend on two devices: a four-letter room on the same public relays as the other online games.
   Each browser checks every move it receives against the rules before playing it, keeps its own clock honest, and sends
   the whole move list each time, so a lost message is repaired by the next one. Everything received has been through
   cleanData() (bk_core.js). Anyone who knows the code can try to join; the first one in keeps the seat. ================= */
const ChessNet = {
  mq: [], code: null, host: false, me: "", peer: null, peerName: "", seen: new Set(), clock: 0, hostColor: "w", game: 0, beat: null, last: 0, quiet: false,
  rid: () => Math.random().toString(36).slice(2, 10),
  menu() {
    this.close();
    const clocks = CPCLOCKS.map(([v, n]) => `<button type="button" class="chip" data-netclock="${v}" aria-pressed="${(prof().chessClock || 0) === v}">${n}</button>`).join("");
    $("#room").innerHTML = `<div class="card">${gamesBar("Play chess · two devices")}<p class="sub">One of you creates a room and reads out the code; the other types it in.</p><div class="label">Clock (the host chooses)</div><div class="row" style="gap:8px;flex-wrap:wrap;margin-top:6px">${clocks}</div>
      <div class="row" style="gap:10px;flex-wrap:wrap;margin-top:14px"><button class="btn" type="button" data-net="make">Create a room</button><span class="fine">or</span><input id="netCode" aria-label="Room code" maxlength="4" placeholder="CODE" autocomplete="off" style="width:96px;text-transform:uppercase"><button class="btn ghost" type="button" data-net="join">Join</button></div><p class="fine" id="netMsg" role="status" style="margin-top:10px"></p></div>`;
  },
  say(text) { const el = $("#netMsg"); if (el) el.textContent = text; },
  open(code, host) {
    this.close(); this.code = code; this.host = host; this.me = this.rid();
    this.mq = BROKERS.map((u) => mqttConnect(u, "gamesite/v1/chess/" + code, (m) => this.recv(m), () => {}));
    this.beat = setInterval(() => this.tick(), 2000);
  },
  close() {
    if (!this.code) return;
    this.send({ k: "bye", game: this.game }); const old = this.mq; this.mq = []; setTimeout(() => old.forEach((c) => c.close()), 400);
    clearInterval(this.beat); this.code = null; this.peer = null; this.peerName = ""; this.game = 0; this.seen.clear(); this.quiet = false;
  },
  send(m) { m.id = this.rid() + this.rid(); m.from = this.me; this.mq.forEach((c) => c.send(m)); },
  playing() { const s = CP.s; return s && s.mode === "online" && s.net === this.code ? s : null; },
  make() { const code = Array.from({ length: 4 }, () => rnd([..."ABCDEFGHJKLMNPQRSTUVWXYZ"])).join(""); this.open(code, true); this.clock = prof().chessClock || 0; this.say(`Room ${code}. Tell your friend the code; the game starts when they join.`); },
  join() { const code = (($("#netCode") || {}).value || "").trim().toUpperCase(); if (!/^[A-Z]{4}$/.test(code)) return this.say("Type the four-letter code."); this.open(code, false); this.say(`Looking for room ${code}…`); this.tries = 0; },
  startMsg() { return { k: "start", to: this.peer, nick: prof().nick || "Host", clock: this.clock, hostColor: this.hostColor, game: this.game }; },
  /* every two seconds: say hello until answered, then keep each other up to date */
  tick() {
    if (!this.code) return;
    const s = this.playing();
    if (s && !$(".cpwrap")) return this.close();                      // walked away from the board
    if (!this.host && !s) { this.send({ k: "hello", nick: prof().nick || "Guest" }); if (++this.tries === 8) this.say("No answer yet. Check the code, and that your friend's room is still open."); return; }
    if (!this.peer) return;
    this.send({ k: "ping", game: this.game, moves: s ? s.c.history() : [], over: !!(s && s.over) });
    if (s && !s.over && performance.now() - this.last > 12000 && !this.quiet) { this.quiet = true; s.note = `${this.peerName} seems to have lost the connection.`; renderChess(); }
  },
  begin(youColor) {
    const old = CP.s; if (old && old.timer) clearInterval(old.timer);
    Voice.stop(); document.body.classList.add("ingame"); Snd.mode("game");
    const s = (CP.s = { id: ++CP.games, mode: "online", net: this.code, oppName: this.peerName, c: new Chess(), you: youColor, sel: null, targets: [], last: null, think: false, over: null, bot: null, say: null, talk: BKBots.TALK.fresh(false), note: "" });
    s.clock = this.clock; s.ms = { w: s.clock * 1000, b: s.clock * 1000 }; s.stamp = performance.now();
    if (s.clock) s.timer = setInterval(() => cpTick(s), 100);
    this.last = performance.now(); this.quiet = false; renderChess(); Snd.win();
    const card = $(".cpwrap"); if (card) scrollTo({ top: card.getBoundingClientRect().top + scrollY - 4, behavior: "instant" });
  },
  moved(s) { this.send({ k: "moves", game: this.game, moves: s.c.history(), left: s.ms[s.you] }); },
  /* take the other side's move list: only moves of theirs, only legal ones, and only if it agrees with ours */
  take(m) {
    const s = this.playing(); if (!s || m.game !== this.game || !Array.isArray(m.moves) || s.over) return;
    const mine = s.c.history(); if (m.moves.length !== mine.length + 1 || !mine.every((x, i) => x === m.moves[i]) || s.c.turn() === s.you) return;
    if (s.clock) { cpCharge(s); if (s.over) return; }
    const mv = s.c.move(String(m.moves[mine.length])); if (!mv) return;
    if (s.clock && typeof m.left === "number") s.ms[mv.color] = Math.max(0, Math.min(s.clock * 1000, m.left));
    s.last = [mv.from, mv.to]; s.sel = null; s.targets = []; s.drawAsked = false; Snd.tick(); if (mv.captured) Snd.lock();
    cpCheckEnd(); renderChess();
  },
  recv(m) {
    if (!m || !this.code || m.from === this.me || this.seen.has(m.id)) return; this.seen.add(m.id);
    if (this.host && m.k === "hello") {
      if (this.peer && this.peer !== m.from) return;                   // the seat is taken
      if (!this.peer) { this.peer = m.from; this.peerName = String(m.nick || "Guest").slice(0, 16); this.game = 1; this.hostColor = "w"; this.begin("w"); }
      return this.send(this.startMsg());
    }
    if (!this.host && m.k === "start" && (m.hostColor === "w" || m.hostColor === "b")) {
      if (this.peer && this.peer !== m.from) return;
      if (m.game <= this.game) return;
      this.peer = m.from; this.peerName = String(m.nick || "Host").slice(0, 16); this.game = m.game; this.clock = CPCLOCKS.some(([v]) => v === m.clock) ? m.clock : 0;
      return this.begin(m.hostColor === "w" ? "b" : "w");
    }
    if (m.from !== this.peer) return;
    this.last = performance.now(); const s = this.playing();
    if (this.quiet && s) { this.quiet = false; s.note = ""; renderChess(); }
    if (m.k === "moves") return this.take(m);
    if (m.k === "ping") {
      if (!s || m.game !== this.game || !Array.isArray(m.moves)) return;
      if (m.moves.length === s.c.history().length + 1) this.take(m);
      else if (m.moves.length < s.c.history().length) this.moved(s);      // they missed our last move
      if (s.over && !m.over && s.sentOver) this.send(s.sentOver);       // or the way it ended
      return;
    }
    if (!s || m.game !== this.game) return;
    if (m.k === "rematch") { if (!s.over) return; if (s.wantAgain && this.host) return this.again(); s.theyWant = true; s.note = `${this.peerName} wants a rematch.`; s.cardHidden = true; return renderChess(); }
    if (m.k === "bye") { if (!s.over) { s.over = { cls: "win", title: "You win!", why: `${this.peerName} left the game.` }; cpWinFx(); } s.note = `${this.peerName} left the room.`; s.gone = true; return renderChess(); }
    if (s.over) return;
    if (m.k === "resign") { s.over = { cls: "win", title: "You win!", why: `${this.peerName} resigned.` }; cpWinFx(); return renderChess(); }
    if (m.k === "flag") return cpFlag(s, s.you === "w" ? "b" : "w");
    if (m.k === "draw") { if (s.drawAsked) { this.end({ cls: "draw", title: "Draw", why: "Agreed." }, "drawok"); return; } s.drawOffered = true; s.note = `${this.peerName} offers a draw.`; return renderChess(); }
    if (m.k === "drawok" && s.drawAsked) { s.over = { cls: "draw", title: "Draw", why: "Agreed." }; return renderChess(); }
  },
  /* end the game on this side and tell the other */
  end(over, kind) { const s = this.playing(); if (!s || s.over) return; s.over = over; s.sentOver = { k: kind, game: this.game }; this.send({ ...s.sentOver }); renderChess(); },
  resign() { this.end({ cls: "loss", title: "You resigned", why: "Another one?" }, "resign"); },
  draw() { const s = this.playing(); if (!s || s.over) return; if (s.drawOffered) return this.end({ cls: "draw", title: "Draw", why: "Agreed." }, "drawok"); s.drawAsked = true; s.note = "Draw offered."; this.send({ k: "draw", game: this.game }); renderChess(); },
  rematch() { const s = this.playing(); if (!s || !s.over || s.gone) return; if (s.theyWant && this.host) return this.again(); s.wantAgain = true; s.note = `Waiting for ${this.peerName} to accept the rematch.`; s.cardHidden = true; this.send({ k: "rematch", game: this.game }); renderChess(); },
  again() { this.game++; this.hostColor = this.hostColor === "w" ? "b" : "w"; this.begin(this.hostColor); this.send(this.startMsg()); },
};
const cpWinFx = () => { Snd.win(); confetti(); addXP(40, "chess"); Mascot.react("ch_win", true); };
document.addEventListener("click", (e) => {
  const t = e.target.closest && e.target.closest("button"); if (!t) return;
  if (t.dataset.netclock != null) { const p = prof(); p.chessClock = +t.dataset.netclock; saveProf(); Snd.tick(); document.querySelectorAll("[data-netclock]").forEach((b) => b.setAttribute("aria-pressed", b === t)); return; }
  if (t.dataset.net === "make") ChessNet.make(); else if (t.dataset.net === "join") ChessNet.join();
});
{ const close0 = Net.close; Net.close = function () { ChessNet.close(); return close0.apply(this, arguments); }; }
addEventListener("hashchange", () => ChessNet.close());
addEventListener("pagehide", () => ChessNet.close());
