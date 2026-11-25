/* ================= Odd one out, Two songs at once, Mixed marathon, the photocard binder, "play this one" from search,
   and sidekick lines about the idol or group just named ================= */
const seededShuffle = (list, key) => list.map((x, i) => [seedOf(`${key}:${i}`), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

/* ---------- Odd one out: five faces, four from one group ---------- */
function oddPool() {
  if (oddPool.c) return oddPool.c;
  const full = items("kpop", (g) => g.kind === "group" && g.gender && rosterOf("kpop", g).filter((m) => m.img).length >= 4);
  const genderOf = (p) => { const g = (p.groups || []).map(groupOf).find((x) => x && x.gender); return g && g.gender; };
  return (oddPool.c = items("kpop", (p) => p.kind === "idol" && p.img).map((p) => {
    const mine = new Set((p.groups || []).map(qnorm)), gender = genderOf(p);
    const others = full.filter((g) => g.gender === gender && !mine.has(qnorm(g.n)) && !rosterOf("kpop", g).some((m) => qnorm(m.n) === qnorm(p.n) || (m.groups || []).some((x) => mine.has(qnorm(x)))));
    if (!gender || !others.length) return null;
    const g = rnd(others), line = shuffle(rosterOf("kpop", g).filter((m) => m.img)).slice(0, 4).map((m) => m.id);
    return { ...p, odd: g.n, line };
  }).filter(Boolean));
}
function oddTop(x) {
  const byId = new Map(items("kpop", (p) => p.kind === "idol").map((p) => [p.id, p]));
  const five = seededShuffle([x.id, ...(x.line || [])], x.id + x.odd).map((id) => byId.get(id)).filter(Boolean);
  return `<h3 class="oddq">Who is not in the same group as the others?</h3>${faceRow(five)}`;
}
GAMES.kpop.push(G("odd", "Odd one out", "photo", { tag: "Five idols, four from one group. Type the name of the one who doesn't belong.", pool: oddPool, top: oddTop, hints: (d) => [["The other four are in", d.odd], ["Initials", first(d.n)]], unit: "idol" }));

/* ---------- Two songs at once ---------- */
function twoPool() {
  if (twoPool.c) return twoPool.c;
  const songs = byFameAll(items("kpop", (x) => x.kind === "song" && x.pv && x.by)).slice(0, 360), mixed = shuffle(songs), out = [];
  for (let i = 0; i + 1 < mixed.length; i += 2) {
    const a = mixed[i], b = mixed[i + 1];
    if (a.by === b.by || qnorm(a.n) === qnorm(b.n)) continue;
    out.push({ id: `two-${a.id}-${b.id}`, kind: "twosongs", n: `${a.n} + ${b.n}`, fame: Math.round(((a.fame || 0) + (b.fame || 0)) / 2), pv: a.pv, pv2: b.pv, songs: [{ n: a.n, by: a.by, year: a.year, alt: a.alt || [] }, { n: b.n, by: b.by, year: b.year, alt: b.alt || [] }] });
  }
  return (twoPool.c = out);
}
CLUES.twosongs = (d) => d.songs.map((x, i) => [`Song ${i + 1}`, `${x.n} by ${x.by}`]);
GAMES.kpop.push(G("two", "Two songs at once", "audio", { tag: "Two song previews play together. Name both titles, one at a time or with a + between them.", pool: twoPool, two: true, unit: "song" }));
const TWO_CLUES = (r) => [["Listen", "3 seconds of both"], ["Listen", "5 more seconds"], ["One is by", r.songs[0].by], ["The other is by", r.songs[1].by], ["Listen", "the whole previews"], ["Initials", `${first(r.songs[0].n)}  and  ${first(r.songs[1].n)}`]];
const foundNote = () => { const s = Q.s; if (!s || !s.r || !s.r.songs || s.phase !== "run" || !(s.found || []).length) return; const box = $("#qClues"); if (box && !$("#twoFound")) box.insertAdjacentHTML("afterend", `<div class="schint" id="twoFound"><span class="label">Got one</span><b>${esc(s.found.map((i) => s.r.songs[i].n).join(", "))}. Now name the other.</b></div>`); };
{ const next0 = nextRound; nextRound = function () { const out = next0.apply(this, arguments), s = Q.s; if (s && curDef().two) { s.found = []; s.clues = TWO_CLUES(s.r); s.total = s.clues.length * s.cs + 12; renderQuiz(); Net.sync(); } return out; }; }
{ const render0 = renderQuiz; renderQuiz = function () { const out = render0.apply(this, arguments); foundNote(); return out; }; }
{ const submit0 = submitAnswer; submitAnswer = function (pickName, typedRemote) {
  const s = Q.s; if (!s || !s.paused || !curDef().two) return submit0.apply(this, arguments);
  const typed = String(pickName != null ? pickName : typedRemote != null ? typedRemote : ($("#qIn") && $("#qIn").value) || "");
  if (Net.role === "guest") { Net.send({ k: "ans", t: typed }); return; }
  if (s.foundBy !== s.buzzed) { if (s.mode !== "solo") s.found = []; s.foundBy = s.buzzed; }
  s.found = s.found || [];
  const hit = (t) => s.r.songs.findIndex((x, i) => !s.found.includes(i) && nameOK(t, x.n, x.alt));
  const whole = hit(typed), parts = whole >= 0 ? [typed] : typed.split(/\s*\+\s*|\s*\/\s*|\s*,\s*|\s+and\s+/i);
  let got = 0;
  parts.forEach((t) => { const i = t.trim() ? hit(t) : -1; if (i >= 0) { s.found.push(i); got++; } });
  if (s.found.length >= 2) return endRound(s.buzzed);
  if (!got) return wrongGuess(false);
  Snd.right(); s.answerLeft = answerTime() + 4; renderQuiz(); Net.sync(); focusIn();
}; }

/* ---------- Mixed marathon: one run that jumps between a category's games ---------- */
const Marathon = {
  LEN: 12,
  games: (w) => GAMES[w].filter((g) => ["clue", "blur", "photo"].includes(g.kind)),
  start(w, mode) {
    const list = this.games(w); if (!list.length) return;
    let bag = []; const mix = Array.from({ length: this.LEN }, () => { if (!bag.length) bag = shuffle(list); return { w, g: bag.pop().id }; });
    const go2 = () => { document.body.classList.add("ingame"); S.world = w; S.game = mix[0].g; if (w === "kpop") S.diff = "medium"; addPlay(w); Q.next = { marathon: w, mixW: [] }; newQuiz(w, mix[0].g, mode, mix); };
    if (mode === "duo") { const n = NAMES(); Vs.match({ nick: n[0], avatar: prof().avatar }, { nick: n[1], avatar: "" }, go2); } else go2();
  },
  intro(w) {
    stopQuiz(); Net.close();
    $("#room").innerHTML = modeIntro("Mixed marathon", `${this.LEN} questions in a row, each from a different ${esc(WORLDS[w].name)} game. One score.`, [
      { id: "mar-solo", t: "Solo", d: "All twelve, as many points as you can." }, { id: "mar-duo", t: "Two players, one device", d: "Race to buzz: A for player 1, L for player 2." }]);
    $("#room .modes").insertAdjacentHTML("afterend", duoNamesHTML());
    $("#room").querySelectorAll('[data-mode^="mar-"]').forEach((b) => { const m = b.dataset.mode.slice(4); delete b.dataset.mode; b.dataset.marathon = m; });
    const best = prof().best[w + ":marathon"]; if (best) $("#room .card").insertAdjacentHTML("beforeend", `<p class="fine num">Your best: ${best.score.toLocaleString()} pts</p>`);
  },
};

/* ---------- hub cards for the modes that are not one game ---------- */
{ const hub0 = renderHub; renderHub = function () {
  const out = hub0.apply(this, arguments), w = S.world, box = $("#room .hub"); if (!box || !Marathon.games(w).length) return out;
  const card = (attr, name, modes, tag) => `<button type="button" class="gcard modecard" ${attr}><div class="gname">${name}</div><div class="gmodes">${modes}</div><div class="gtag">${tag}</div></button>`;
  box.insertAdjacentHTML("afterbegin", card('data-modecard="marathon"', "Mixed marathon", "Solo · 2 players", "One run that jumps between games.") + card('data-modecard="party"', "Party room", "3 to 8 players, own phones", "One code, everyone answers at once, fastest scores most.")
    + (w === "kpop" ? card('data-modecard="binder"', "Photocard binder", "Your collection", "Every idol you name correctly leaves a card here.") : ""));
  return out;
}; }

/* ---------- photocard binder: one answer unlocks a card, more make it rarer ---------- */
const cardTier = (n) => (n >= 6 ? "gold" : n >= 3 ? "holo" : n >= 1 ? "own" : "locked");
function binderHTML() {
  const p = prof(), have = (x) => p.dex["kpop:" + x.id] || 0, groups = byFameAll(items("kpop", (g) => g.kind === "group"));
  const idols = items("kpop", (x) => x.kind === "idol" && x.img), owned = idols.filter(have).length;
  const pages = groups.map((g) => ({ g, m: rosterOf("kpop", g).filter((x) => x.img) })).filter((x) => x.m.length)
    .sort((a, b) => b.m.filter(have).length - a.m.filter(have).length);
  return `<p class="sub"><b class="num">${owned}</b> of ${idols.length} cards. Name an idol correctly to unlock their card. Three times makes it holographic, six times gold.</p>` + pages.map(({ g, m }) => `<details class="bpage" ${m.some(have) ? "open" : ""}><summary><b>${esc(g.n)}</b><span class="fine num">${m.filter(have).length} of ${m.length}</span></summary><div class="pcards">${m.map((x) => { const t = cardTier(have(x)); return `<div class="pcard ${t}" ${t === "locked" ? 'aria-label="Locked card"' : `data-wiki="${esc(wikiKey("kpop", x))}" role="button" tabindex="0"`}><img src="${imgOf(x)}" alt="" loading="lazy"><span>${t === "locked" ? "?" : esc(x.n)}</span></div>`; }).join("")}</div></details>`).join("");
}
{ const coll0 = renderCollection; renderCollection = function () {
  const out = coll0.apply(this, arguments), box = $("#collRoom"), bar = box && box.querySelector(".scope"); if (!bar) return out;
  bar.insertAdjacentHTML("afterbegin", `<button type="button" class="chip" data-coll="cards" aria-pressed="${S.coll === "cards"}">Photocards</button>`);
  if (S.coll === "cards") { bar.querySelector('[data-coll="dex"]').setAttribute("aria-pressed", "false"); while (bar.nextSibling) bar.nextSibling.remove(); box.insertAdjacentHTML("beforeend", binderHTML()); }
  return out;
}; }
{ const collect0 = collect; collect = function (w, x) {
  const fresh = w === "kpop" && x && x.kind === "idol" && x.img && !prof().dex["kpop:" + x.id], out = collect0.apply(this, arguments);
  if (fresh) toast(`<b>New photocard</b><br>${esc(x.n)}`, "ach");
  return out;
}; }

/* ---------- search: every entry offers the games it appears in ---------- */
const playableWith = (w, x) => (GAMES[w] || []).filter((g) => ["clue", "blur", "photo", "audio"].includes(g.kind) && !g.two && g.id !== "odd" && g.pool().some((y) => y.id === x.id)).slice(0, 6);
{ const wiki0 = openWiki; openWiki = function (key) {
  const out = wiki0.apply(this, arguments), i = key.indexOf(":"), w = key.slice(0, i), x = items(w).find((y) => y.id === key.slice(i + 1)), body = $("#wikiPop .wp-body");
  if (!x || !body) return out;
  const list = playableWith(w, x);
  if (list.length) body.insertAdjacentHTML("beforeend", `<div class="label">Play a round that starts with this one</div><div class="wchips">${list.map((g) => `<button type="button" class="wchip" data-play="${esc(`${w}|${g.id}|${x.id}`)}"><span>${esc(g.name)}</span></button>`).join("")}</div><p class="fine">The first question is this entry, so you will know the answer. The rest are random.</p>`);
  return out;
}; }
document.addEventListener("keydown", (e) => { if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { e.preventDefault(); go("wiki"); } });

document.addEventListener("click", (e) => {
  const t = e.target.closest("button"); if (!t) return;
  if (t.dataset.modecard === "marathon") { Snd.tick(); Marathon.intro(S.world); }
  else if (t.dataset.modecard === "party") { Snd.tick(); Party.intro(S.world); }
  else if (t.dataset.modecard === "binder") { Snd.tick(); S.coll = "cards"; go("collection"); }
  else if (t.dataset.marathon) { Snd.tick(); Marathon.start(S.world, t.dataset.marathon); }
  else if (t.dataset.play) { const [w, gid, id] = t.dataset.play.split("|"); closeWiki(); Snd.tick(); go(`w-${w}-${gid}`); Q.first = id; startMode("solo"); }
});

/* ---------- a line about whoever was just named, instead of the usual praise, about half the time ---------- */
{ const end0 = endRound; endRound = function (winner) {
  const s = Q.s;
  Mascot.about = null;
  if (s && s.phase !== "reveal" && winner != null && curWorld() === "kpop") {
    const d = curDef(), x = s.r, ans = nameOfAnswer(d, x);
    Mascot.about = x.kind === "idol" && ans === x.n ? "idl_" + qnorm(x.n) : x.kind === "group" && ans === x.n ? "grp_" + qnorm(x.n) : x.kind === "song" && x.by ? "grp_" + qnorm(x.by) : null;
  }
  const out = end0.apply(this, arguments);
  if (s && s.mode !== "solo" && Mascot.about) sayIf(Mascot.about, 700);
  Mascot.about = null;
  return out;
}; }
{ const react1 = Mascot.react; Mascot.react = function (kind, force) {
  const about = Mascot.about;
  if (about && (kind === "hit" || kind === "bighit") && Math.random() < 0.6 && (MASCOTS[Mascot.id()].lines || {})[about]) { Mascot.about = null; return react1.call(this, about, true); }
  return react1.apply(this, arguments);
}; }
