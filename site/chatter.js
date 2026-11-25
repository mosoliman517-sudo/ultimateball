/* ================= when the new lines are said: opening a song, picture or higher-or-lower game; the time of day; two-player play ================= */
{ const hello0 = Mascot.hello; Mascot.hello = function () {
  const h = new Date().getHours(), part = h >= 5 && h < 11 ? "morning" : h >= 18 && h < 23 ? "evening" : h >= 23 || h < 5 ? "night" : null;
  const L = MASCOTS[Mascot.id()].lines || {};
  if (part && L[part] && Math.random() < 0.5) return Mascot.react(part, true);
  return hello0.apply(this, arguments);
}; }
const sayIf = (kind, delay = 0) => setTimeout(() => { const L = MASCOTS[Mascot.id()].lines || {}; if (L[kind]) Mascot.react(kind, true); }, delay);
{ const open0 = openGame; openGame = function (id) {
  const out = open0.apply(this, arguments), g = gameOf(S.world, id), k = g && { audio: "g_audio", photo: "g_photo", blur: "g_photo", hol: "g_hol" }[g.kind];
  if (k) sayIf(k, 500);
  return out;
}; }
{ const start0 = startMode; startMode = function (m) {
  const g = gameOf(S.world, S.game), out = start0.apply(this, arguments);
  if (m === "duo" && g && g.kind !== "audio") sayIf("duo_start", 300);   // never talk over a song
  return out;
}; }
{ const end0 = endRound; endRound = function (winner) {
  const s = Q.s, live = s && s.mode !== "solo" && s.phase !== "reveal", out = end0.apply(this, arguments);
  if (live && winner != null) sayIf("duo_point", 150);
  return out;
}; }
{ const end1 = endRound; endRound = function (winner) {   // sometimes praise that fits the game just won
  const s = Q.s, d = s && s.phase !== "reveal" && s.mode === "solo" && winner != null ? curDef() : null, out = end1.apply(this, arguments);
  const kind = d && (d.kind === "blur" && d.imgKey === "logo" && curWorld() === "football" ? "hit_blur" : d.id === "career" ? "hit_career" : null);   // badge praise only for badges
  if (kind && Math.random() < 0.35) sayIf(kind, 200);
  return out;
}; }
{ const fin0 = finishQuiz; finishQuiz = function () {
  const s = Q.s, duo = s && s.mode !== "solo", out = fin0.apply(this, arguments);
  if (duo) sayIf("duo_end", 900);
  return out;
}; }
{ const react0 = Mascot.react; Mascot.react = function (kind, force) {
  const k = (kind === "hit" || kind === "streak") && (S.game === "value" ? "hit_value" : S.game === "ttt" ? "hit_ttt" : null);
  if (k && Math.random() < 0.35 && (MASCOTS[Mascot.id()].lines || {})[k]) return react0.call(this, k, force);
  return react0.apply(this, arguments);
}; }
