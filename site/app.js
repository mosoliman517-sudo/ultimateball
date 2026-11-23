/* ================= The games site: worlds, games, cross-category matches, profile and collection =================
   Built on ballknowledge's football page: the same look (worlds repaint the page), the same round engine (clues get easier,
   buzz early for up to 1,000 points, a wrong guess costs 150), the same sidekicks, loading screens, finale and sounds. */
const PK = window.PACKS || {};
Object.values(PK).forEach((p) => { p.items = p.items.filter((x) => x.n && !/^Q\d+$/.test(x.n)); });   /* Wikidata entries with no English name are left out, never renamed */
if (window.IMGDATA) Object.values(PK).forEach((p) => p.items.forEach((x) => ["img", "logo", "flag"].forEach((k) => { if (x[k]) { if (IMGDATA[x[k]]) x[k] = IMGDATA[x[k]]; else delete x[k]; } })));
const items = (w, f) => ((PK[w] && PK[w].items) || []).filter((x) => !x.former && (!f || f(x)));   // former members are kept in the data but never used in a game
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, "") + " bn" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + " m" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
const euro = (v) => (v >= 1e6 ? `€${(v / 1e6).toFixed(1).replace(/\.0$/, "")}m` : `€${Math.round(v / 1e3)}k`);
const imgOf = (x) => x && (x.img || x.logo || x.flag || x.cover);
const isCut = (x) => x && x.cut;
const credOf = (x, k) => { const c = x && x.cr && (x.cr[k] || x.cr.img || x.cr.logo || x.cr.flag); return c ? `<div class="credit">${esc(c.by)} · ${esc(c.lic)} · <a href="${c.page}" target="_blank" rel="noopener">source</a></div>` : ""; };
const pic = (x, cls = "") => imgOf(x) ? `<img class="${cls} ${isCut(x) ? "cutpic" : ""} ${x.logo || x.flag ? "contain" : ""}" src="${imgOf(x)}" alt="${esc(x.n)}" loading="lazy">` : "";

/* ---------------- the worlds ---------------- */
const WORLDS = {
  kpop: { name: "K-pop", kicker: "Idols, groups, songs, fandoms", tag: "The current generation: 4th and 5th gen groups plus TWICE, BLACKPINK, BTS and IZ*ONE, with their idols, hits since 2022, album covers and song previews.", mascot: "bongi", kicks: ["bongi", "mic", "pocha"] },
  football: { name: "Football", kicker: "Five leagues, real data", tag: "Players, careers, crests and market values from ballknowledge's real data.", mascot: "bench", kicks: ["bench", "boot", "rita"] },
  basketball: { name: "Basketball", kicker: "25 seasons of the NBA", tag: "Players, careers, team logos and career points from ballknowledge's basketball data.", mascot: "rim", kicks: ["rim", "clock", "sneak"] },
  chess: { name: "Chess", kicker: "Grandmasters and openings", tag: "Elite players with their peak ratings, and the real openings from Lichess.", mascot: "pip", kicks: ["pip", "vera", "bea"] },
  geography: { name: "Geography", kicker: "Flags, capitals, countries", tag: "Every sovereign country: flags, capitals, languages and populations.", mascot: "pin", kicks: ["pin"] },
  history: { name: "History", kicker: "Events, inventions, empires, people", tag: "Wars and revolutions, world-changing inventions, the flags of countries that are gone, and the people who made it all happen.", mascot: "tock", kicks: ["tock"] },
  general: { name: "General knowledge", kicker: "Science, history, film, sport and more", tag: "Real quiz questions from Open Trivia DB, rated easy to hard. Type the answer.", mascot: "dogear", kicks: ["dogear"] },
  anime: { name: "Anime", kicker: "Series, studios, creators", tag: "The most famous anime series from Wikidata: year, studio, episodes and the manga behind them.", mascot: "neko", kicks: ["neko"] },
  food: { name: "Food", kicker: "Dishes of the world", tag: "Famous dishes, where they come from and what goes in them.", mascot: "dumpling", kicks: ["dumpling"] },
};
const PAL = { E0: { glow: "#A855F7", accent: "#7CF5C8" }, HOME: { glow: "#1FA463", accent: "#F2C14E" }, mix: { glow: "#7C6CFF", accent: "#FFD166" },
  football: { glow: "#1FA463", accent: "#F2C14E" }, kpop: { glow: "#FF3E9A", accent: "#7BE0FF" }, geography: { glow: "#22C3D6", accent: "#5BE3C8" }, history: { glow: "#D08A2E", accent: "#E8B85C" }, food: { glow: "#FF5E3A", accent: "#FFB347" }, general: { glow: "#F5C542", accent: "#FF7A2F" }, anime: { glow: "#FF4D8D", accent: "#7FD4FF" }, basketball: { glow: "#FF7A2F", accent: "#5B8CFF" }, chess: { glow: "#5B6CFF", accent: "#7CF5C8" } };
const WVARS = { football: ["#0A1A12", "#F3EFE3", "#A9C0B0", "#F2C14E", "#1FA463", '"Big Shoulders Display"'], kpop: ["#1A0B22", "#FFF0FA", "#D9AECB", "#FF5FB4", "#FF3E9A", "Syne"], geography: ["#08202A", "#EAF8F7", "#9CC4C6", "#5BE3C8", "#22C3D6", '"Bricolage Grotesque"'], history: ["#1E160C", "#F8EEDB", "#CDB68F", "#E8B85C", "#D08A2E", "Fraunces"], food: ["#241010", "#FFF1E6", "#E2B6A4", "#FFB347", "#FF5E3A", '"DM Serif Display"'], general: ["#1A1708", "#FFF8E1", "#D8CBA0", "#F5C542", "#E09A1A", '"Bricolage Grotesque"'], anime: ["#160F24", "#FDF2FF", "#C9B5DA", "#7FD4FF", "#FF4D8D", "Syne"], basketball: ["#1A1020", "#FFF3E8", "#C9B3C6", "#FF8A3D", "#FF5E1A", '"Big Shoulders Display"'], chess: ["#0E1424", "#EEF3F7", "#9DB2CB", "#7CF5C8", "#5B6CFF", '"DM Serif Display"'] };
const wvars = (w) => { const v = WVARS[w]; return `--c-bg:${v[0]};--c-ink:${v[1]};--c-muted:${v[2]};--c-accent:${v[3]};--c-glow:${v[4]};--c-display:${v[5]},system-ui,sans-serif;--wc:${v[4]}`; };
const WORLD_IDS = Object.keys(WORLDS).filter((w) => items(w).length);

/* difficulty: by fame (Wikipedia language editions, or market value), like ballknowledge's FAME ranks */
/* difficulty, as on ballknowledge: Easy, Medium, Hard and Elite. It changes who can come up (by fame: Wikipedia language
   editions, market value or ranking), how fast clues arrive, how long you get to answer, how close higher-or-lower pairs are,
   and how long roulette turns last. Solo scores are multiplied by 0.6, 1, 1.4 or 2. */
const S = { world: null, diff: "medium", game: null, mode: null };
const ELITE_WORD = { kpop: "K-pop", football: "ball", basketball: "hoops", chess: "chess", geography: "map", history: "history", food: "food", general: "general", anime: "anime" };
const DIFFS = [["easy", "Easy"], ["medium", "Medium"], ["hard", "Hard"], ["elite", "Elite"]];
const diffName = (k) => (k === "elite" ? `Elite ${ELITE_WORD[S.world] || ""} knowledge` : DIFFS.find((d) => d[0] === k)[1]);
const DIFFX = { easy: 0.6, medium: 1, hard: 1.4, elite: 2 };
const DIFFNOTE = {
  easy: "Only the most famous. Two clues to start, slow reveals, 15 seconds to answer, higher-or-lower pairs far apart. Scores count 0.6x.",
  medium: "Well known. Normal speed, 12 seconds to answer. Scores count 1x.",
  hard: "Deeper cuts, faster clues, 10 seconds to answer, closer higher-or-lower pairs. Scores count 1.4x.",
  elite: "Anyone in the data, mostly the obscure ones. Fast clues, 8 seconds to answer, near-identical pairs. Scores count 2x.",
};
try { const d = localStorage.getItem("gp_diff"); if (d && DIFFNOTE[d]) S.diff = d; } catch (e) { /* storage blocked */ }
/* Difficulty by fame, measured against everything of the same kind in the category (all K-pop groups, all idols, all songs),
   not just the ones a game can use: so Easy is only ever the genuinely famous, even in a game with a short list. */
const FAMECUT = {};
/* K-pop: the four legacy groups (TWICE, BLACKPINK, BTS, IZ*ONE) are a separate bucket, so each bucket gets its own fame cuts and
   Easy holds the famous of BOTH (a modern idol is not hidden behind BTS's page views), and questions draw 18% legacy, 82% modern */
const LEGACY_K = new Set(["twice", "blackpink", "bts", "izone"]);
const kbucket = (x) => (x.kind === "idol" ? (x.groups || []).some((g) => LEGACY_K.has(qnorm(g))) : x.kind === "song" || x.kind === "release" || x.kind === "unit" ? LEGACY_K.has(qnorm(x.by || "")) : x.kind === "group" ? LEGACY_K.has(qnorm(x.n)) : false) ? "L" : "M";
function fameCuts(w, kind, bucket) {
  const k = w + ":" + kind + ":" + (bucket || ""); if (FAMECUT[k]) return FAMECUT[k];
  const f = items(w, (x) => x.kind === kind && (!bucket || kbucket(x) === bucket)).map((x) => x.fame || 0).sort((a, b) => b - a), at = (q) => f[Math.min(f.length - 1, Math.floor(f.length * q))] || 0;
  return (FAMECUT[k] = { easy: at(0.15), medium: at(0.4), hard: at(0.75) });
}
function byFame(list) {
  if (!list.length) return list;
  if (S.world === "kpop" || (list[0] && items("kpop").includes(list[0]))) return list;   // K-pop: the whole eligible database, weighted by Pick (see social.js); difficulty metadata stays for later
  const w = S.world && items(S.world).includes(list[0]) ? S.world : WORLD_IDS.find((x) => items(x).includes(list[0])), s2 = list.slice().sort((a, b) => (b.fame || 0) - (a.fame || 0));
  const top = (x) => { const c = fameCuts(w, x.kind, w === "kpop" ? kbucket(x) : ""); return S.diff === "easy" ? x.fame >= c.easy : S.diff === "medium" ? x.fame >= c.medium : S.diff === "hard" ? x.fame >= c.hard : true; };
  let r = S.diff === "elite" ? s2.filter((x) => (x.fame || 0) < fameCuts(w, x.kind, w === "kpop" ? kbucket(x) : "").easy) : s2.filter(top);
  if (r.length < 4) r = s2.slice(0, Math.max(4, Math.ceil(s2.length * ({ easy: 0.15, medium: 0.4, hard: 0.75, elite: 1 })[S.diff])));   // a very short list: its own best known
  return r;
}
const startClues = () => (S.diff === "easy" ? 2 : 1);
const answerTime = () => ({ easy: 15, medium: 12, hard: 10, elite: 8 })[S.diff];
const rouTurn = (solo) => (solo ? { easy: 75, medium: 60, hard: 50, elite: 40 } : { easy: 16, medium: 12, hard: 9, elite: 7 })[S.diff];
const clueSpeed = () => ({ easy: 1.35, medium: 1, hard: 0.8, elite: 0.6 })[S.diff];

/* ---------------- clue ladders from the real facts (hardest first) ---------------- */
const LGN = { E0: "Premier League", SP1: "LaLiga", D1: "Bundesliga", I1: "Serie A", F1: "Ligue 1" };
const yr = (y) => (y == null ? null : y <= 0 ? `${1 - y} BC` : String(y));   // Wikidata counts years astronomically: -479 is 480 BC
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const released = (x) => (x.date ? `${MONTHS[+x.date.slice(5, 7) - 1]} ${x.date.slice(0, 4)}` : x.year);
const genOf = (g) => (g && g.gen ? ["", "", "", "3rd", "4th", "5th"][g.gen] + " generation" : null);
const groupOf = (n) => items("kpop", (g) => g.kind === "group" && g.n === n)[0];
const first = (n) => String(n || "").split(/\s+/).filter(Boolean).map((w) => (w[0] || "").toUpperCase()).join(". ") + ".";
const CLUES = {
  player: (p) => [["Born", p.born], ["Nationality", p.nat], ["Position", p.pos], ["Clubs", p.hist && p.hist.length ? `${new Set(p.hist).size} clubs on record` : null], ["Strong foot", p.foot], ["Caps", p.caps != null ? `${p.caps} for his country` : null], ["Now at", p.club], ["Initials", first(p.n)]].filter((c) => c[1]),
  idol: (p) => [["Born", p.born], ["Birthplace", p.from], ["Group", p.groups && p.groups.join(", ")], ["Role", p.role && p.role.filter((r) => r !== "Maknae" || p.role.length === 1).join(", ")], ["Initials", first(p.n)]].filter((c) => c[1]),
  group: (g) => [["Generation", genOf(g)], ["Type", g.gender], ["Members", g.members ? `${g.members}-member group` : null], ["Agency", g.agency || (g.labels && g.labels.join(", "))], ["Fandom name", g.fandom], ["Debut", g.debut], ["Status", g.status === "disbanded" ? "Disbanded" : null], ["Initials", first(g.n)]].filter((c) => c[1]),
  country: (c) => [["Population", c.pop ? fmt(c.pop) + " people" : null], ["Area", c.area ? fmt(c.area) + " km²" : null], ["Currency", c.currency && c.currency.join(", ")], ["Language", c.language && c.language.join(", ")], ["Continent", c.continent], ["Capital", c.capital], ["Initials", first(c.n)]].filter((c) => c[1]),
  person: (p) => [["Born", yr(p.born)], ["Died", p.died != null ? yr(p.died) : null], ["Known as", p.occ && p.occ.join(", ")], ["Country", p.ctry && p.ctry.join(", ")], ["Initials", first(p.n)]].filter((c) => c[1]),
  character: (c) => [["From", c.anime], ["Gender", c.gender]].filter((k) => k[1]),
  landmark: (l) => [["Country", l.country], ["City", l.city], ["Built", l.built != null ? yr(l.built) : null], ["Initials", first(l.n)]].filter((c) => c[1]),
  event: (e) => [["Type", e.type], ["Year", yr(e.year)], ["Where", e.where], ["Ended", e.end != null && e.end !== e.year ? yr(e.end) : null], ["Initials", first(e.n)]].filter((c) => c[1]),
  invention: (x) => [["Year", yr(x.year)], ["By", x.by && x.by.join(", ")], ["Initials", first(x.n)]].filter((c) => c[1]),
  oldstate: (x) => [["Existed", x.from != null ? `${yr(x.from)} to ${yr(x.to)}` : `until ${yr(x.to)}`], ["Capital", x.capital], ["Initials", first(x.n)]].filter((c) => c[1]),
  dish: (d) => [...(d.made || []).map((m) => ["Made with", m]), ["From", d.origin], ["Initials", first(d.n)]].filter((c) => c[1]),
  song: (x) => [["Released", released(x)], ["Album", x.album && qnorm(x.album) !== qnorm(x.n) ? x.album : null], ["By", x.by], ["Starts with", x.n[0].toUpperCase()]].filter((c) => c[1]),
  bplayer: (p) => [["Born", p.born], ["Nationality", p.nat], ["Height", p.h ? Math.round(p.h) + " cm" : null], ["Position", p.pos], ["First season", p.first], ["Teams", p.hist && p.hist.length ? `${new Set(p.hist).size} teams` : null], ["Career", p.pts ? `${p.pts.toLocaleString()} points in ${p.gp} games` : null], ["Titles", p.titles ? `${p.titles} championship${p.titles > 1 ? "s" : ""}` : null], ["Team", p.club], ["Initials", first(p.n)]].filter((c) => c[1]),
  cplayer: (p) => [["Born", p.born], ["Peak rating", p.peak], ["Country", p.nat], ["World champion", p.champ ? "Yes" : "No"], ["Initials", first(p.n)]].filter((c) => c[1]),
  opening: (o) => { const mv = o.pgn.split(/\s+/).filter((t) => !/^\d+\.$/.test(t)), at = (k) => o.pgn.split(/\s+/).slice(0, Math.ceil(k * 1.5)).join(" "); const seen = new Set(); return [["ECO code", o.eco], ["First moves", at(2)], ["More moves", at(4)], ["The full line", o.pgn], ["Games on Lichess", `${o.games.toLocaleString()} in our sample`], ["Initials", first(o.n)]].filter((c) => c[1] && !seen.has(c[1]) && seen.add(c[1])); },
  trivia: (x) => [["Question", x.q], ["Category", x.cat], ["Letters", x.n.replace(/\S/g, "_ ")], ["Starts with", x.n[0]]],
  anime: (x) => [["Genres", x.genres && x.genres.join(", ")], ["Episodes", x.eps], ["Studio", x.studios && x.studios.join(", ")], ["Based on work by", x.authors && x.authors.join(", ")], ["First aired", x.year], ["Initials", first(x.n)]].filter((c) => c[1]),
  team: (t) => [["City", t.loc], ["Nickname", t.short]].filter((c) => c[1]),
  club: (c) => [["League", LGN[c.lg]], ["Stadium", c.stadium], ["Coach", c.coach], ["Players in our data", (() => { const r = rosterOf("football", c).slice(0, 3).map((p) => p.n); return r.length ? r.join(", ") : null; })()], ["Initials", first(c.n)]].filter((c) => c[1]),
};
const BLUR = [34, 26, 19, 13, 8, 4, 0];
const scrambleWord = (w) => { const a = [...w]; if (a.length < 3) return w; for (let k = 0; k < 20; k++) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (a.join("").toLowerCase() !== w.toLowerCase()) break; } return a.join(""); };
const scrambleName = (n) => n.split(/\s+/).map((w) => scrambleWord(w.replace(/[^\p{L}\p{N}'-]/gu, ""))).join("   ").toUpperCase();

/* ---------------- the games of each world: every game plays exactly what its name says ---------------- */
const G = (id, name, kind, o) => ({ id, name, kind, ...o });
const KIND_WORD = { trivia: "a quiz answer", anime: "an anime", song: "a song", bplayer: "a basketball player", cplayer: "a chess player", opening: "a chess opening", team: "a team", player: "a footballer", club: "a club", idol: "an idol", group: "a group", country: "a country", person: "a historical figure", dish: "a dish", landmark: "a landmark", character: "an anime character", event: "a historical event", invention: "an invention", oldstate: "a former country" };
const GAMES = {
  football: [
    G("who", "Who am I?", "clue", { tag: "A mystery player. Clues go from obscure to obvious. Buzz in early for more points.", pool: () => items("football", (x) => x.kind === "player"), clues: CLUES.player, unit: "player" }),
    G("career", "Career path", "clue", { tag: "Every club he played for, in order. Name the player.", pool: () => items("football", (x) => x.kind === "player" && x.hist && x.hist.length >= 3), clues: (p) => p.hist.map((c, i) => [`Club ${i + 1}`, c]), unit: "player" }),
    G("club", "Name that club", "clue", { tag: "Its league, stadium, coach, then some of its players. Name the club.", pool: () => items("football", (x) => x.kind === "club" && x.stadium), clues: CLUES.club, unit: "club" }),
    G("blur", "Badge blur", "blur", { tag: "A blurry club crest that sharpens by the second.", pool: () => items("football", (x) => x.kind === "club" && x.logo), unit: "club", imgKey: "logo" }),
    G("photo", "Who's that player?", "photo", { tag: "A player's photo, right away. Buzz and name him. Hints come at a third and two thirds of the time.", pool: () => items("football", (x) => x.kind === "player" && x.img), hints: (p) => [["Club", p.club || p.nat], ["Initials", first(p.n)]].filter((c) => c[1]), unit: "player" }),
    G("value", "Market value", "hol", { tag: "Two players. Who is worth more? Keep the streak alive.", pool: () => items("football", (x) => x.kind === "player" && x.val && x.img), stat: (x) => x.val, show: euro, ask: "Who is worth more?", higher: true }),
    G("xi", "Starting XI", "all", { tag: "A real final or big match. Name the eleven who started, position by position.", pool: () => items("football", (x) => x.kind === "lineup"), list: (m) => m.players.map((p) => ({ n: p.n, pos: p.pos, x: items("football", (y) => y.kind === "player" && y.n === p.n)[0] })), unit: "player" }),
    G("ttt", "Football tic-tac-toe", "ttt", { tag: "Name a player who fits the row and the column: club, nationality or position. Three in a row wins.", pool: () => items("football", (x) => x.kind === "player"), attrs: () => tttAttrsBall("football"), unit: "player" }),
    G("roulette", "Club roulette", "roulette", { tag: "A club appears. Take turns naming players who played for it. First to blank loses.", pool: () => items("football", (x) => x.kind === "club").filter((c) => rosterOf("football", c).length >= 8), roster: (c) => rosterOf("football", c), unit: "player" }),
    G("scramble", "Scramble", "scramble", { tag: "A player or club with the letters shuffled. Unscramble it first.", pool: () => items("football") }),
  ],
  basketball: [
    G("who", "Who am I?", "clue", { tag: "A mystery NBA player. Born, height, position, career points. Buzz early.", pool: () => items("basketball", (x) => x.kind === "bplayer"), clues: CLUES.bplayer, unit: "bplayer" }),
    G("career", "Career path", "clue", { tag: "Every team he played for, in order. Name the player.", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.hist && x.hist.length >= 3), clues: (p) => p.hist.map((c, i) => [`Team ${i + 1}`, c]), unit: "bplayer" }),
    G("logo", "Logo blur", "blur", { tag: "A blurred NBA team logo that sharpens by the second.", pool: () => items("basketball", (x) => x.kind === "team"), unit: "team", imgKey: "logo" }),
    G("photo", "Who's that player?", "photo", { tag: "A headshot, right away. Buzz and name him. Two hints on the way.", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.img), hints: (p) => [["Team", p.club || p.pos], ["Initials", first(p.n)]].filter((c) => c[1]), unit: "bplayer" }),
    G("points", "Career points", "hol", { tag: "Two players. Who scored more career points?", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.pts && x.img), stat: (x) => x.pts, show: (v) => v.toLocaleString(), ask: "More career points?", higher: true }),
    G("five", "Starting five", "all", { tag: "A real playoff or Finals game. Name the five who started.", pool: () => items("basketball", (x) => x.kind === "lineup"), list: (m) => m.players.map((p) => ({ n: p.n, pos: p.pos, x: items("basketball", (y) => y.kind === "bplayer" && y.n === p.n)[0] })), unit: "bplayer" }),
    G("ttt", "Hoops tic-tac-toe", "ttt", { tag: "Name a player who fits the row and the column: team, position or career mark. Three in a row wins.", pool: () => items("basketball", (x) => x.kind === "bplayer"), attrs: () => tttAttrsBall("basketball"), unit: "bplayer" }),
    G("roulette", "Team roulette", "roulette", { tag: "A team appears. Take turns naming players who played for it.", pool: () => items("basketball", (x) => x.kind === "team").filter((t) => rosterOf("basketball", t).length >= 8), roster: (t) => rosterOf("basketball", t), unit: "bplayer" }),
    G("scramble", "Scramble", "scramble", { tag: "A player or team with the letters shuffled.", pool: () => items("basketball") }),
  ],
  chess: [
    G("play", "Play chess", "play", { tag: "A real game of chess: against the computer (Stockfish, four strengths from beginner to full power) or a friend on the same device.", pool: () => [{ id: "board", n: "Chess" }], min: 1 }),
    G("who", "Who is this player?", "clue", { tag: "Born, peak rating, country, world champion or not. Name the grandmaster.", pool: () => items("chess", (x) => x.kind === "cplayer"), clues: CLUES.cplayer, unit: "cplayer" }),
    G("photo", "Who's that grandmaster?", "photo", { tag: "A top player's photo, right away. Name them. Two hints on the way.", pool: () => items("chess", (x) => x.kind === "cplayer" && x.img), hints: (p) => [["Country", p.nat], ["Initials", first(p.n)]].filter((c) => c[1]), unit: "cplayer" }),
    G("opening", "Name the opening", "clue", { tag: "The moves of a real opening appear one by one. Type its name.", pool: () => items("chess", (x) => x.kind === "opening"), clues: CLUES.opening, unit: "opening" }),
    G("peak", "Higher peak?", "hol", { gaps: [100, 50, 20], tag: "Two grandmasters. Whose peak rating was higher?", pool: () => items("chess", (x) => x.kind === "cplayer" && x.peak && x.img), stat: (x) => x.peak, show: String, ask: "Higher peak rating?", higher: true }),
    G("scramble", "Scramble", "scramble", { tag: "A grandmaster or opening with the letters shuffled.", pool: () => items("chess") }),
  ],
  kpop: [
    G("face", "Who's that idol?", "photo", { tag: "An idol's photo, right away. Buzz and type the name. A hint comes at a third of the time, another at two thirds.", pool: () => items("kpop", (x) => x.kind === "idol" && x.img), hints: (p) => [["Group", p.groups.join(", ")], ["Initials", first(p.n)]], unit: "idol" }),
    G("missing", "Who's missing?", "photo", { tag: "A group's line-up with one empty slot. Name the missing member.", pool: () => missingPool(), top: missingTop, hints: (p) => [["Born", p.born], ["Initials", first(p.n)]].filter((c) => c[1]), unit: "idol" }),
    G("fromMembers", "Name the group", "clue", { tag: "Member names appear one by one. Buzz with the group they're in.", pool: () => items("kpop", (x) => x.kind === "group").filter((g) => rosterOK(g)), clues: (g) => [...shuffle(rosterOf("kpop", g)).slice(0, 6).map((p) => ["Member", p.n]), ["Debut", g.debut]].filter((c) => c[1]), unit: "group" }),
    G("album", "Album → song", "photo", { tag: "An album cover and its year. Name the song. The group's name is the first hint.", pool: () => albumPool(), top: (x) => `<div class="blurpic cover"><img src="${x.cover}" alt=""></div><div class="fine" style="text-align:center">Released ${esc(released(x))}</div>`, hints: (x) => [["By", x.by], ["Starts with", x.n[0].toUpperCase()]], unit: "song" }),
    G("hear", "Hear the song", "audio", { tag: "Three seconds of a real song. Then five more. Buzz and type the title before the hints arrive.", pool: () => items("kpop", (x) => x.kind === "song" && x.pv), unit: "song", min: 6 }),
    G("song", "Guess the song", "clue", { tag: "A real song: when it came out, its album, then the group. Type the title.", pool: () => items("kpop", (x) => x.kind === "song" && x.date), clues: CLUES.song, unit: "song" }),
    G("albumname", "Which album is it from?", "clue", { tag: "A song, its group and when it came out. Name the album it is on. Harder on Hard and Elite: deeper album tracks.", pool: () => items("kpop", (x) => x.kind === "song" && x.album && qnorm(x.album) !== qnorm(x.n) && qnorm(x.album) !== qnorm(x.by)), clues: (x) => [["Song", x.n], ["By", x.by], ["Released", released(x)], ["Starts with", x.album[0]]], unit: "album", answer: (x) => x.album }),
    G("whose", "Whose song is it?", "clue", { tag: "A song title appears. Type the group who sings it.", pool: () => items("kpop", (x) => x.kind === "song" && x.by && !qnorm(x.n).includes(qnorm(x.by)) && !qnorm(x.album || "").includes(qnorm(x.by))), clues: (x) => [["Song", x.n], ["Released", released(x)], ["Album", x.album && qnorm(x.album) !== qnorm(x.n) ? x.album : null], ["Generation", genOf(groupOf(x.by))], ["Starts with", x.by[0]]].filter((c) => c[1]), unit: "group", answer: (x) => x.by }),
    G("group", "Group: Who are we?", "clue", { tag: "A mystery group. Generation, members, label and debut year reveal it.", pool: () => items("kpop", (x) => x.kind === "group" && (x.debut || (x.labels || []).length)), clues: CLUES.group, unit: "group" }),
    G("logo", "Logo blur", "blur", { tag: "A blurred group logo that sharpens by the second.", pool: () => items("kpop", (x) => x.kind === "group" && x.logo), unit: "group", imgKey: "logo", min: 6 }),
    G("relfirst", "Which release came first?", "hol", { gaps: [900, 365, 120], tag: "Two albums, EPs or singles from the full discographies. Which one came out first?", pool: () => releasePool().filter((x) => x.img || x.logo), stat: (x) => Math.round(Date.parse(x.date) / 864e5), show: (v) => { const t = new Date(v * 864e5); return `${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`; }, ask: "Came out first?", higher: false }),
    G("release", "Name the release", "clue", { tag: "An album, EP or single from a group's full discography. Its group, type and date come first. Type the title.", pool: () => releasePool().filter((x) => qnorm(x.n) !== qnorm(x.by) && x.n.length >= 3), clues: (x) => [["By", x.by], ["Type", x.ty === "ep" ? "EP" : x.ty === "single" ? "Single" : "Album"], ["Released", released(x)], ["Starts with", x.n[0].toUpperCase()]], unit: "release" }),
    G("leader", "Name the leader", "photo", { tag: "A group's picture and name. Which member is its leader? Hints: the group's size, then the first letter.", pool: () => items("kpop", (x) => x.kind === "group" && rosterOK(x) && holderOf(x, "Leader")), top: (g) => `<div class="blurpic ${g.img ? "" : "logo"}">${g.img ? `<img src="${g.img}" alt="">` : g.logo ? `<img src="${g.logo}" alt="">` : ""}</div><div class="fine" style="text-align:center;font-weight:800;font-size:18px">${esc(g.n)}</div>`, hints: (g) => [["Members", g.members + " in the group"], ["Starts with", holderOf(g, "Leader").n[0].toUpperCase()]], answer: (g) => holderOf(g, "Leader").n, unit: "idol" }),
    G("maknae", "Name the maknae", "photo", { tag: "A group's picture and name. Which member is the maknae, the youngest? Hints: the group's size, then the first letter.", pool: () => items("kpop", (x) => x.kind === "group" && rosterOK(x) && holderOf(x, "Maknae")), top: (g) => `<div class="blurpic ${g.img ? "" : "logo"}">${g.img ? `<img src="${g.img}" alt="">` : g.logo ? `<img src="${g.logo}" alt="">` : ""}</div><div class="fine" style="text-align:center;font-weight:800;font-size:18px">${esc(g.n)}</div>`, hints: (g) => [["Members", g.members + " in the group"], ["Starts with", holderOf(g, "Maknae").n[0].toUpperCase()]], answer: (g) => holderOf(g, "Maknae").n, unit: "idol" }),
    G("fandomname", "Whose fandom is this?", "clue", { tag: "A fandom name appears. Type the group it belongs to. Agency and debut year follow.", pool: () => items("kpop", (x) => x.kind === "group" && x.fandom && x.fandom.length >= 3), clues: (g) => [["Fandom name", g.fandom], ["Agency", g.agency], ["Debut", g.debut], ["Starts with", g.n[0].toUpperCase()]].filter((c) => c[1]), unit: "group" }),
    G("colors", "Whose colours are these?", "photo", { tag: "A group's official colours. Name the group. Hints: the agency, then the debut year.", pool: () => items("kpop", (x) => x.kind === "group" && x.colors && x.colors.length), top: (g) => `<div class="swatches">${g.colors.slice(0, 4).map((c) => `<i style="background:${c.hex}"><small>${esc(c.name)}</small></i>`).join("")}</div>`, hints: (g) => [["Agency", g.agency], ["Debut", g.debut]].filter((c) => c[1]), unit: "group" }),
    G("unit", "Whose unit is it?", "clue", { tag: "A sub-unit or duo appears with its members. Name the group it comes from.", pool: () => unitPool().filter((u) => u.members.length >= 2), min: 12, clues: (u) => [["Unit", u.n], ["Members", u.members.join(", ")], ["Debut", u.debut], ["Starts with", u.by[0].toUpperCase()]].filter((c) => c[1]), unit: "group", answer: (u) => u.by }),
    G("newer", "Which song is newer?", "hol", { gaps: [730, 240, 60], tag: "Two songs with their covers. Which came out more recently? Keep the streak alive.", pool: () => items("kpop", (x) => x.kind === "song" && x.date && x.cover), stat: (x) => Math.round(Date.parse(x.date) / 864e5), show: (v) => { const t = new Date(v * 864e5); return `${MONTHS[t.getUTCMonth()]} ${t.getUTCFullYear()}`; }, ask: "Released more recently?", higher: true }),
    G("fandom", "Bigger fandom?", "hol", { tag: "Two groups. Whose English Wikipedia page got more views over the last year?", pool: () => items("kpop", (x) => x.kind === "group" && x.views && (x.img || x.logo)), stat: (x) => x.views, show: (v) => fmt(v) + " views", ask: "More popular?", higher: true }),
    G("members", "Member roulette", "roulette", { tag: "A group appears. Take turns naming its members. First to blank or repeat loses the round.", pool: () => items("kpop", (x) => x.kind === "group").filter((g) => rosterOK(g) && rosterOf("kpop", g).length >= 4), roster: (g) => rosterOf("kpop", g), unit: "idol" }),
    G("lineup", "Name every member", "all", { tag: "A group appears. Name every member in our data before the clock runs out.", pool: () => items("kpop", (x) => x.kind === "group").filter((g) => rosterOK(g)), list: (g) => rosterOf("kpop", g).map((p) => ({ n: p.n, pos: "", x: p })), unit: "idol" }),
    G("ttt", "K-pop tic-tac-toe", "ttt", { tag: "Name a group that fits the row and the column: agency, boy or girl group, generation. Three in a row wins.", pool: () => items("kpop", (x) => x.kind === "group"), attrs: () => tttAttrsKpop(), unit: "group" }),
    G("older", "Who's older?", "hol", { tag: "Two idols. Who was born first?", pool: () => items("kpop", (x) => x.kind === "idol" && x.born && x.img), stat: (x) => x.born, show: String, ask: "Born first?", higher: false, gaps: [8, 4, 2] }),
    G("labels", "Label roulette", "roulette", { tag: "An agency appears. Take turns naming its groups. First to blank loses.", pool: () => labelPool(), roster: (l) => items("kpop", (g) => g.kind === "group" && (g.labels || []).includes(l.n)), unit: "group" }),
    G("scramble", "Scramble", "scramble", { tag: "An idol, group or song with the letters shuffled.", pool: () => items("kpop") }),
  ],
  general: [
    G("quiz", "Quick quiz", "clue", { tag: "A real quiz question. Hints show the letters, then the first one. Type the answer before your rival.", pool: () => items("general"), clues: CLUES.trivia, unit: "trivia" }),
    G("scramble", "Answer scramble", "scramble", { tag: "A quiz answer with its letters shuffled.", pool: () => items("general", (x) => x.n.length >= 5) }),
  ],
  anime: [
    G("who", "Which anime am I?", "clue", { tag: "Genres, episodes, studio, creator, year. Name the series.", pool: () => items("anime", (x) => x.kind === "anime" && (x.studios || []).length + (x.genres || []).length + (x.authors || []).length + (x.eps ? 1 : 0) + (x.year ? 1 : 0) >= 3), clues: CLUES.anime, unit: "anime" }),
    G("from", "Which anime are they from?", "clue", { tag: "A character's name, then a co-star, the year and the studio. Name the series.", pool: () => items("anime", (x) => x.kind === "character" && items("anime", (a) => a.kind === "anime" && a.n === x.anime).length), clues: (c) => { const a = items("anime", (y) => y.kind === "anime" && y.n === c.anime)[0] || {}, co = items("anime", (y) => y.kind === "character" && y.anime === c.anime && y.id !== c.id); return [["Character", c.n], ["Also in it", co.length ? rnd(co).n : null], ["First aired", a.year], ["Studio", a.studios && a.studios.join(", ")], ["Starts with", c.anime[0]]].filter((k) => k[1]); }, answer: (c) => c.anime, unit: "anime" }),
    G("cast", "Character roulette", "roulette", { tag: "A series appears. Take turns naming its characters. First to blank loses.", pool: () => items("anime", (x) => x.kind === "anime").filter((a) => rosterOf("anime", a).length >= 4), roster: (a) => rosterOf("anime", a), unit: "character" }),
    G("charface", "Who's that character?", "photo", { tag: "An anime character's portrait, right away. Name them. Hints: their series, then the first letter.", pool: () => items("anime", (x) => x.kind === "character" && x.img), hints: (c) => [["From", qnorm(c.anime).includes(qnorm(c.n)) ? null : c.anime], ["Initials", first(c.n)]].filter((h) => h[1]), unit: "character", min: 8 }),
    G("aired", "Which aired first?", "hol", { gaps: [10, 5, 2], tag: "Two series. Which one started earlier?", pool: () => items("anime", (x) => x.year), stat: (x) => x.year, show: String, ask: "Aired first?", higher: false }),
    G("scramble", "Scramble", "scramble", { tag: "An anime title with the letters shuffled.", pool: () => items("anime") }),
  ],
  geography: [
    G("flag", "Flag blur", "blur", { tag: "A blurred flag that sharpens by the second. Name the country.", pool: () => items("geography", (x) => x.flag), unit: "country", imgKey: "flag" }),
    G("who", "Which country am I?", "clue", { tag: "Population, area, currency, language, then the capital. Name the country.", pool: () => items("geography", (x) => x.capital), clues: CLUES.country, unit: "country" }),
    G("capital", "Capital cities", "clue", { tag: "A flag and a country. Type the capital before the hints give it away.", pool: () => items("geography", (x) => x.capital && x.flag), clues: (c) => [["Country", c.n], ["Continent", c.continent], ["Starts with", c.capital[0]], ["Letters", c.capital.replace(/\S/g, "_ ")]].filter((x) => x[1]), unit: "capital", answer: (c) => c.capital, showImg: true }),
    G("pop", "More people?", "hol", { tag: "Two flags. Which country has more people?", pool: () => items("geography", (x) => x.pop && x.flag), stat: (x) => x.pop, show: (v) => fmt(v), ask: "More people?", higher: true }),
    G("landmark", "Name the landmark", "photo", { tag: "A famous building, monument or ruin, right away. Name it. Hints: the country, then the city.", pool: () => items("geography", (x) => x.kind === "landmark"), hints: (l) => [["Country", l.country], ["City", l.city || first(l.n)]], unit: "landmark" }),
    G("where", "Where in the world?", "photo", { tag: "A famous landmark. Name the country it's in.", pool: () => items("geography", (x) => x.kind === "landmark" && x.country && items("geography", (c) => c.kind === "country" && c.n === x.country).length), top: (l) => `<div class="blurpic"><img src="${l.img}" alt=""></div><div class="fine" style="text-align:center">${esc(l.n)}</div>`, hints: (l) => [["City", l.city || "?"], ["Starts with", l.country[0]]], answer: (l) => l.country, unit: "country" }),
    G("scramble", "Scramble", "scramble", { tag: "A country or landmark with the letters shuffled.", pool: () => items("geography") }),
  ],
  history: [
    G("who", "Who am I?", "clue", { tag: "Born, died, what they did, where they came from. Name the figure.", pool: () => items("history", (x) => x.kind === "person"), clues: CLUES.person, unit: "person" }),
    G("invfirst", "Which invention came first?", "hol", { gaps: [150, 40, 10], tag: "Two inventions or discoveries. Which one came first? Keep the streak alive.", pool: () => items("history", (x) => x.kind === "invention" && x.img), stat: (x) => x.year, show: yr, ask: "Came first?", higher: false }),
    G("invention", "Name the invention", "photo", { tag: "A picture of a famous invention or discovery. Name it. Hints: the year, then who.", pool: () => items("history", (x) => x.kind === "invention" && x.img), hints: (x) => [["Year", yr(x.year)], ["By", x.by && x.by.length ? x.by.join(", ") : first(x.n)]], unit: "invention" }),
    G("event", "Name the event", "clue", { tag: "A war, battle, revolution or treaty. Type, year and place come first. Name it.", pool: () => items("history", (x) => x.kind === "event"), clues: CLUES.event, unit: "event" }),
    G("evfirst", "Which happened first?", "hol", { gaps: [150, 40, 8], tag: "Two moments in history. Which came first?", pool: () => items("history", (x) => x.kind === "event" && x.img), stat: (x) => x.year, show: yr, ask: "Happened first?", higher: false }),
    G("oldflag", "Whose flag was this?", "photo", { tag: "The flag of a country that no longer exists. Name it. Hints: when it existed, then its capital.", pool: () => items("history", (x) => x.kind === "oldstate" && x.flag), hints: (x) => [["Existed", x.from != null ? `${yr(x.from)} to ${yr(x.to)}` : `until ${yr(x.to)}`], ["Capital", x.capital || first(x.n)]], unit: "oldstate" }),
    G("portrait", "Who's in the portrait?", "photo", { tag: "A famous face, right away. Who is it? Two hints on the way.", pool: () => items("history", (x) => x.kind === "person" && x.img), hints: (p) => [["Known as", p.occ && p.occ.slice(0, 2).join(", ")], ["Initials", first(p.n)]].filter((c) => c[1]), unit: "person" }),
    G("born", "Who was born first?", "hol", { gaps: [60, 20, 5], tag: "Two figures from history. Who came first?", pool: () => items("history", (x) => x.kind === "person" && x.born != null && x.img), stat: (x) => x.born, show: yr, ask: "Born first?", higher: false }),
    G("scramble", "Scramble", "scramble", { tag: "A name, event or invention with the letters shuffled.", pool: () => items("history") }),
  ],
  food: [
    G("dish", "Name the dish", "photo", { tag: "A famous dish, right away. Name it. Two hints on the way.", pool: () => items("food", (x) => x.img), hints: (d) => [["From", d.origin], ["Initials", first(d.n)]].filter((c) => c[1]), unit: "dish" }),
    G("who", "Ingredient reveal", "clue", { tag: "What goes into it, then where it is from. Name the dish.", pool: () => items("food", (x) => x.made && x.made.length >= 2), clues: CLUES.dish, unit: "dish" }),
    G("origin", "Where's it from?", "clue", { tag: "A dish appears. Type the country it comes from.", pool: () => items("food", (x) => x.origin && x.img), clues: (d) => [["Dish", d.n], ...(d.made || []).slice(0, 2).map((m) => ["Made with", m]), ["Starts with", d.origin[0]]], unit: "origin", answer: (d) => d.origin, showImg: true }),
    G("scramble", "Scramble", "scramble", { tag: "A dish with the letters shuffled.", pool: () => items("food") }),
  ],
};
Object.keys(GAMES).forEach((w) => { GAMES[w] = GAMES[w].filter((g) => g.pool().length >= (g.min || 4)); });
const gameOf = (w, id) => (GAMES[w] || []).find((g) => g.id === id);
/* forgiving answer check: the full name, any distinctive word of it (a first name, a stage name, a surname), the legal name,
   a few typos on longer names, or most of the name typed from the start all count. Accents, spaces and hyphens are ignored. */
function nameOK(typed, name, alts) {
  const t = qnorm(typed); if (t.length < 2) return false;
  for (const c of [name, ...(alts || [])].filter(Boolean)) {
    const n = qnorm(c); if (!n) continue;
    if (t === n || rom(typed) === rom(c)) return true;
    const tol = n.length >= 10 ? 2 : n.length >= 5 ? 1 : 0; if (tol && lev(t, n) <= tol) return true;
    if (t.length >= 3 && nameMatch(typed, c, true)) return true;
    if (t.length >= 4 && n.startsWith(t) && t.length >= n.length * 0.6) return true;
  }
  return false;
}
/* answers and suggestions forgive typos and romanisation variants (Jisu = Jisoo, Seulgi = Seul-gi, Yeji = Yeiji) */
const rom = (t) => qnorm(t).replace(/oo/g, "u").replace(/ee/g, "i").replace(/eo/g, "o").replace(/ae/g, "e").replace(/yu/g, "u").replace(/(.)\1/g, "$1");
function smartSuggest(q, list, key) {
  const n = rom(q); if (n.length < 2) return [];
  const tol = n.length >= 7 ? 2 : n.length >= 4 ? 1 : 0, out = [];
  for (const x of list) {
    const names = [key(x), x.full].filter(Boolean); let best = -1;
    for (const nm of names) { const raw = qnorm(nm), rq = qnorm(q), k = rom(nm), words = nm.split(/[\s-]+/).map(rom);
      const sc = raw.startsWith(rq) ? 6 : raw.includes(rq) ? 4 : k.startsWith(rom(q)) ? 5 : words.some((w) => w.startsWith(rom(q))) ? 4 : k.includes(rom(q)) ? 3 : tol && lev(rom(q), k.slice(0, rom(q).length)) <= tol ? 2 : tol && words.some((w) => lev(rom(q), w.slice(0, rom(q).length)) <= tol) ? 1 : -1;
      best = Math.max(best, sc - (nm === key(x) ? 0 : 0.5)); }
    if (best >= 0) out.push([best, x]);
  }
  out.sort((a, b) => b[0] - a[0] || (b[1].fame || 0) - (a[1].fame || 0) || key(a[1]).length - key(b[1]).length);
  return out.slice(0, 6).map((o) => o[1]);
}
const nameOfAnswer = (g, x) => (g.answer ? g.answer(x) : x.n);
function suggestPool(g, w) {
  if (g.unit === "capital") return [...new Set(items("geography").map((x) => x.capital).filter(Boolean))].map((n) => ({ n }));
  if (g.unit === "origin") return [...new Set(items("food").map((x) => x.origin).concat(items("geography").map((x) => x.n)))].map((n) => ({ n }));
  if (g.kind === "scramble") return [];
  if (g.unit === "release") return releasePool();
  if (g.unit === "album") return [...new Set(items("kpop", (x) => x.kind === "song" && x.album).map((x) => x.album))].map((n) => ({ n }));
  if (g.unit === "trivia") return []; if (g.unit === "label") return labelPool(); const kinds = { anime: ["anime"], song: ["song"], bplayer: ["bplayer"], cplayer: ["cplayer"], opening: ["opening"], team: ["team"], player: ["player"], club: ["club"], idol: ["idol"], group: ["group"], kpop: ["idol", "group"], country: ["country"], person: ["person"], dish: ["dish"], landmark: ["landmark"], character: ["character"], event: ["event"], invention: ["invention"], oldstate: ["oldstate"] }[g.unit] || null;
  return items(w, (x) => !kinds || kinds.includes(x.kind));
}

/* a roster game needs the full line-up: the idols we hold for a group must equal its official member count (one source: the group record) */
function rosterOK(g) { const n = rosterOf("kpop", g).length; return n >= 3 && (!g.members || n === g.members); }
function rosterOf(w, x) {
  rosterOf.c = rosterOf.c || {}; const k = w + x.id; if (rosterOf.c[k]) return rosterOf.c[k];
  const norm = (t) => qnorm(t).replace(/^(fc|afc|ac|ss|as|rc|sc|vfb|vfl|tsg|sv|1fc)/, "");
  let r = [];
  if (w === "kpop") r = items("kpop", (p) => p.kind === "idol" && (p.groups || []).includes(x.n));
  else if (w === "football") { const n = norm(x.n); r = items("football", (p) => p.kind === "player" && (p.hist || []).concat(p.club || []).some((h) => { const t = norm(h); return t && (t === n || (t.length > 4 && (n.includes(t) || t.includes(n)))); })); }
  else if (w === "anime") r = items("anime", (p) => p.kind === "character" && p.anime === x.n);
  else if (w === "basketball") r = items("basketball", (p) => p.kind === "bplayer" && (p.hist || []).includes(x.short));
  return (rosterOf.c[k] = r);
}
/* Who's missing?: an idol whose group has at least three members in the data; the line-up is shown in a fixed order with the idol's slot empty */
function mainGroup(p) { return (p.groups || []).map(groupOf).find((g) => g && rosterOK(g)); }
function missingPool() { return (missingPool.c = missingPool.c || items("kpop", (p) => p.kind === "idol" && p.img && mainGroup(p) && rosterOf("kpop", mainGroup(p)).filter((m) => m.img).length >= 3)); }
function missingTop(p) { const g = mainGroup(p), r = rosterOf("kpop", g).slice(0, 14); if (!r.includes(p)) r[r.length - 1] = p; return `<div class="label" style="text-align:center">${esc(g.n)}</div><div class="lineupgrid">${r.map((m, i) => m === p ? `<div class="lu miss" style="--i:${i}"><b>?</b></div>` : `<div class="lu" style="--i:${i}">${m.img ? `<img src="${m.img}" alt="">` : `<i>${esc(m.n[0])}</i>`}<small>${esc(m.n)}</small></div>`).join("")}</div>`; }
/* Album → song: one song per cover, so the cover gives a single answer */
function albumPool() { if (albumPool.c) return albumPool.c; const n = {}; items("kpop", (x) => x.kind === "song" && x.cover).forEach((x) => { n[x.cover] = (n[x.cover] || 0) + 1; }); return (albumPool.c = items("kpop", (x) => x.kind === "song" && x.cover && n[x.cover] === 1)); }
/* releases: every studio album, EP and single of a group, built from the group's `discography` (the one source). Language versions, live albums,
   compilations and remixes are left out of the games but stay in the data. */
function releasePool() {
  if (releasePool.c) return releasePool.c; const out = [];
  items("kpop", (g) => g.kind === "group" && g.discography).forEach((g) => { const seen = new Set(); g.discography.forEach((r) => {
    if (r.ver || (r.sec && r.sec.length) || !/^\d{4}-\d{2}/.test(r.d) || !["album", "ep", "single"].includes(r.ty)) return;
    const k = qnorm(r.t); if (!k || seen.has(k)) return; seen.add(k);
    out.push({ id: "rel-" + r.id, n: r.t, kind: "release", by: g.n, ty: r.ty, date: r.d.length === 7 ? r.d + "-15" : r.d.length === 4 ? r.d + "-06-15" : r.d, year: +r.d.slice(0, 4), img: g.img || null, logo: g.logo || null, fame: g.fame || 0 });
  }); });
  return (releasePool.c = out);
}
/* units: sub-units and duo/trio projects, read from each group's `units` (members checked against the group's own line-up) */
function unitPool() {
  if (unitPool.c) return unitPool.c; const out = [];
  items("kpop", (g) => g.kind === "group" && g.units).forEach((g) => g.units.forEach((u) => out.push({ id: "unit-" + qnorm(g.n) + qnorm(u.n), n: u.n, kind: "unit", by: g.n, members: u.members, debut: u.debut, img: g.img || null, logo: g.logo || null, fame: g.fame || 0 })));
  return (unitPool.c = out);
}
/* the one member of a group who holds a role (Leader, Maknae): only groups where exactly one current member does */
function holderOf(g, role) { const r = rosterOf("kpop", g).filter((m) => (m.role || []).includes(role)); return r.length === 1 ? r[0] : null; }
function labelPool() { if (labelPool.c) return labelPool.c; const m = {}; items("kpop", (g) => g.kind === "group").forEach((g) => (g.labels || []).forEach((l) => { m[l] = (m[l] || 0) + 1; })); return (labelPool.c = Object.entries(m).filter(([, n]) => n >= 4).map(([n, k]) => ({ id: "L" + n, n, fame: k }))); }
/* tic-tac-toe attributes: every one is a real fact from the data; a grid is only used when all nine cells have answers */
function tttAttrsKpop() {
  const G = (g) => g.debut || 0, size = (g) => rosterOf("kpop", g).length, songYr = (g, y) => items("kpop", (x) => x.kind === "song" && x.by === g.n && (x.date || "") >= y + "-01-01").length > 0;
  const fam = [
    [{ label: "Debuted 2015–2019", test: (g) => G(g) >= 2015 && G(g) <= 2019 }, { label: "Debuted 2020–2022", test: (g) => G(g) >= 2020 && G(g) <= 2022 }, { label: "Debuted 2023 or later", test: (g) => G(g) >= 2023 }],
    [{ label: "Biggest acts (tier 1)", test: (g) => g.tier === 1 }, { label: "Mainstream (tier 2)", test: (g) => g.tier === 2 }, { label: "Established (tier 3)", test: (g) => g.tier === 3 }],
    [{ label: "5 or more members", test: (g) => size(g) >= 5 }, { label: "4 or fewer members", test: (g) => size(g) > 0 && size(g) <= 4 }, { label: "7 or more members", test: (g) => size(g) >= 7 }],
    [{ label: "Released music in 2025", test: (g) => songYr(g, 2025) }, { label: "Released music in 2024", test: (g) => songYr(g, 2024) }, { label: "Released music in 2023", test: (g) => songYr(g, 2023) }],
    [{ label: "Boy group", test: (g) => g.gender === "boy group" }, { label: "Girl group", test: (g) => g.gender === "girl group" }],
  ];
  return fam.concat([labelPool().sort((a, b) => b.fame - a.fame).slice(0, 8).map((l) => ({ label: l.n, test: (g) => (g.labels || []).includes(l.n) }))]);
}
function tttAttrsBall(w) {
  const P = w === "football" ? items("football", (x) => x.kind === "player") : items("basketball", (x) => x.kind === "bplayer"), cnt = {};
  P.forEach((p) => new Set(p.hist || []).forEach((c) => { cnt[c] = (cnt[c] || 0) + 1; }));
  const clubs = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([c]) => ({ label: c, test: (p) => (p.hist || []).includes(c) }));
  if (w === "football") {
    const nat = {}; P.forEach((p) => { if (p.nat) nat[p.nat] = (nat[p.nat] || 0) + 1; });
    const grp = (p) => /keeper/i.test(p.pos || "") ? "Goalkeeper" : /back|defen/i.test(p.pos || "") ? "Defender" : /midfield/i.test(p.pos || "") ? "Midfielder" : /forward|wing|striker|attack/i.test(p.pos || "") ? "Attacker" : "";
    return [clubs, Object.entries(nat).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([n]) => ({ label: n, test: (p) => p.nat === n })), ["Defender", "Midfielder", "Attacker"].map((g) => ({ label: g, test: (p) => grp(p) === g }))];
  }
  return [clubs, [{ label: "Guard", test: (p) => /guard/i.test(p.pos || "") }, { label: "Forward", test: (p) => /forward/i.test(p.pos || "") }, { label: "Center", test: (p) => /center/i.test(p.pos || "") }],
    [{ label: "10,000+ career points", test: (p) => p.pts >= 10000 }, { label: "Won a title", test: (p) => p.titles > 0 }, { label: "Born outside the US", test: (p) => p.nat && p.nat !== "United States" }]];
}
const T3 = { s: null };
function newTTT(mode) {
  const g = gameOf(S.world, S.game), pool = g.pool(), fams = g.attrs(); let rows, cols, ok = false;
  for (let k = 0; k < 300 && !ok; k++) { const [fr, fc] = shuffle(fams.map((_, i) => i)).slice(0, 2); if (fams[fr].length < 3 || fams[fc].length < 3) continue; rows = shuffle(fams[fr]).slice(0, 3); cols = shuffle(fams[fc]).slice(0, 3); ok = rows.every((r) => cols.every((c) => pool.filter((x) => r.test(x) && c.test(x)).length >= (S.diff === "easy" ? 3 : 1))); }
  if (!ok) { $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}<p class="fine">There aren't enough matching names in our data for a full grid in this category right now. Try another difficulty, or another game.</p></div>`; return; }
  T3.s = { w: S.world, game: S.game, mode, rows, cols, cells: Array(9).fill(null), turn: 0, used: new Set(), msg: "", over: false, winner: null, pool }; renderTTT();
}
const LINES3 = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
function renderTTT() {
  const s = T3.s, g = gameOf(s.w, s.game), n = s.mode === "solo" ? [prof().nick || "You", "Computer"] : NAMES();
  const cell = (i) => { const c = s.cells[i]; return `<button type="button" class="t3c ${c ? "p" + c.who : ""} ${s.sel === i ? "sel" : ""}" data-t3="${i}" ${c || s.over ? "disabled" : ""}>${c ? `${imgOf(c.x) ? `<img src="${imgOf(c.x)}" alt="" class="${isCut(c.x) ? "cutpic" : ""} ${c.x.logo ? "contain" : ""}">` : ""}<b>${esc(c.x.n)}</b>` : "<span>+</span>"}</button>`; };
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}<div class="qhud"><span class="label">${s.over ? (s.winner == null ? "A draw" : esc(n[s.winner]) + " wins!") : (s.mode === "solo" && s.turn === 0 ? "Your turn" : esc(n[s.turn]) + "'s turn")}</span><span class="num qscore"><small>✕ ${esc(n[0])}</small></span><span class="num qscore"><small>◯ ${esc(n[1])}</small></span></div>
    <div class="t3"><span></span>${s.cols.map((c) => `<div class="t3h">${esc(c.label)}</div>`).join("")}${[0, 1, 2].map((r) => `<div class="t3h">${esc(s.rows[r].label)}</div>${[0, 1, 2].map((c) => cell(r * 3 + c)).join("")}`).join("")}</div>
    ${s.over ? `<div class="row" style="margin-top:12px"><button class="btn" id="t3Again" type="button">Play again</button></div>` : s.sel == null ? `<p class="fine" style="margin-top:10px">${esc(s.msg || "Tap a square, then name someone who fits both its row and its column.")}</p><div class="row"><button class="btn ghost" id="t3Quit" type="button">Give up the game</button></div>` : s.sel != null ? `<div class="answerbox"><div class="row"><b>${esc(s.rows[Math.floor(s.sel / 3)].label)} + ${esc(s.cols[s.sel % 3].label)}</b><span class="num fine" id="t3Clock"></span></div><div class="row"><input id="qIn" autocomplete="off" spellcheck="false" placeholder="Type a name" aria-label="Your answer"><button class="btn" id="t3Go" type="button">Play it</button><button class="btn ghost" id="t3Pass" type="button">Pass</button></div><div id="qSug" class="sugs"></div></div>` : `<p class="fine" style="margin-top:10px">${esc(s.msg || "Tap a square, then name someone who fits both its row and its column.")}</p>`}</div>`;
  const i = $("#qIn"); if (i) i.focus({ preventScroll: true });
}
function t3Play(typed, pickName) {
  const s = T3.s, i = s.sel; if (i == null || s.over) return; const r = s.rows[Math.floor(i / 3)], c = s.cols[i % 3];
  const cand = s.pool.filter((x) => pickName != null ? x.n === pickName : nameOK(typed, x.n, [x.full])), fit = cand.find((x) => r.test(x) && c.test(x) && !s.used.has(x.id));
  if (fit) { s.cells[i] = { who: s.turn, x: fit }; s.used.add(fit.id); Snd.right(); flashEdge(true); s.msg = ""; collect(s.w, fit); }
  else { Snd.wrong(); flashEdge(false); s.msg = cand.length ? (cand.some((x) => s.used.has(x.id)) ? `${cand[0].n} is already on the board. Turn lost.` : `${cand[0].n} doesn't fit both. Turn lost.`) : "Not found in the data. Turn lost."; }
  s.sel = null; t3Check(); if (!s.over) { s.turn = 1 - s.turn; if (s.mode === "solo" && s.turn === 1) setTimeout(t3Cpu, 900); } renderTTT();
}
function t3Check() { const s = T3.s, w = LINES3.find((l) => l.every((k) => s.cells[k] && s.cells[k].who === s.cells[l[0]].who)); if (w) { s.over = true; s.winner = s.cells[w[0]].who; Snd.win(); confetti(); if (s.mode !== "solo" || s.winner === 0) addXP(40, s.w); award("duo"); } else if (s.cells.every(Boolean)) { s.over = true; s.winner = null; } }
function t3Cpu() {
  const s = T3.s; if (s.over) return; const free = s.cells.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0), skill = { easy: 0.35, medium: 0.55, hard: 0.75, elite: 0.9 }[S.diff];
  const win = free.find((i) => LINES3.some((l) => l.includes(i) && l.filter((k) => s.cells[k] && s.cells[k].who === 1).length === 2)), block = free.find((i) => LINES3.some((l) => l.includes(i) && l.filter((k) => s.cells[k] && s.cells[k].who === 0).length === 2));
  const i = win != null ? win : block != null && Math.random() < skill ? block : rnd(free); s.sel = i; const r = s.rows[Math.floor(i / 3)], c = s.cols[i % 3], opts = byFame(s.pool).filter((x) => r.test(x) && c.test(x) && !s.used.has(x.id));
  if (opts.length && Math.random() < skill) { const x = opts[0]; s.cells[i] = { who: 1, x }; s.used.add(x.id); s.msg = `Computer played ${x.n}.`; Snd.lock(); } else s.msg = "The computer couldn't think of anyone. Your turn.";
  s.sel = null; t3Check(); if (!s.over) s.turn = 0; renderTTT();
}
/* Name them all (ballknowledge's Starting XI): a real line-up, every name to find before the clock runs out */
const AL = { s: null, t: null };
function newAll(mode) {
  const g = gameOf(S.world, S.game), pk = Pick.ctx(), x = S.world === "kpop" ? Pick.choose(byFame(g.pool()), pk) : rnd(byFame(g.pool())), list = g.list(x); if (S.world === "kpop") Pick.record(x, pk);
  AL.s = { w: S.world, game: S.game, mode, x, list, found: new Set(), hints: 0, wrong: 0, left: { easy: 180, medium: 140, hard: 100, elite: 70 }[S.diff] * (list.length > 6 ? 1 : 0.6), over: false, msg: "" };
  clearInterval(AL.t); AL.t = setInterval(() => { const s = AL.s; if (!s || s.over) return clearInterval(AL.t); s.left -= 0.25; const c = $("#alClock"); if (c) c.textContent = Math.ceil(s.left) + "s"; if (s.left <= 0) endAll(); }, 250); renderAll();
}
function renderAll() {
  const s = AL.s, g = gameOf(s.w, s.game), x = s.x, score = s.found.size * 100 - s.wrong * 20 - s.hints * 30;
  const slot = (p, i) => { const ok = s.found.has(i) || s.over; return `<div class="alslot ${s.found.has(i) ? "got" : s.over ? "miss" : ""}">${ok && p.x && imgOf(p.x) ? `<img src="${imgOf(p.x)}" alt="" class="${isCut(p.x) ? "cutpic" : ""}">` : `<span class="alq">?</span>`}<b>${ok ? esc(p.n) : s.hints > [...Array(i + 1).keys()].filter((k) => !s.found.has(k)).length - 1 ? esc(first(p.n)) : "?"}</b><small>${esc(p.pos || "")}</small></div>`; };
  const head = x.kind === "lineup" ? `<div class="label">${esc(x.date || "")} · ${esc(x.score || "")}${x.won != null ? (x.won ? " · won" : " · lost") : ""}</div><h3 style="font-size:28px;font-family:var(--display)">${esc(x.club)}</h3><div class="fine">${esc(x.title)}</div>` : `<div class="row" style="gap:12px;align-items:center">${imgOf(x) ? `<img class="ansimg" src="${imgOf(x)}" alt="">` : ""}<div><div class="label">Every member in our data</div><h3 style="font-size:30px;font-family:var(--display)">${esc(x.n)}</h3></div></div>`;
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}<div class="qhud"><span class="label">${s.found.size} of ${s.list.length}</span><span class="num qscore"><small>Score</small> <b>${score}</b></span><span class="num" id="alClock" style="font:800 28px var(--display)">${Math.ceil(s.left)}s</span></div>${head}<div class="algrid">${s.list.map(slot).join("")}</div>
    ${s.over ? `<div class="rcard on" style="margin-top:10px"><b>${s.found.size === s.list.length ? "All of them! " : ""}${s.found.size} of ${s.list.length} named · ${score} points</b></div><div class="row" style="margin-top:12px"><button class="btn" id="alAgain" type="button">Another one</button></div>` : `<div class="answerbox"><div class="row"><input id="alIn" autocomplete="off" spellcheck="false" placeholder="Type a name" aria-label="A name"><button class="btn" id="alGo" type="button">Add</button><button class="btn ghost" id="alHint" type="button">Initials (-30)</button><button class="btn ghost" id="alGive" type="button">Give up</button></div><div class="fine">${esc(s.msg)}</div></div>`}</div>`;
  const i = $("#alIn"); if (i) i.focus({ preventScroll: true });
}
function allSay() { const s = AL.s, t = ($("#alIn") || {}).value || ""; if (!t.trim() || s.over) return; const k = s.list.findIndex((p, i) => !s.found.has(i) && nameOK(t, p.n, [p.x && p.x.full]));
  if (k >= 0) { s.found.add(k); Snd.right(); flashEdge(true); s.msg = ""; if (s.list[k].x) collect(s.w, s.list[k].x); if (s.found.size === s.list.length) return endAll(); } else { s.wrong++; Snd.wrong(); flashEdge(false); s.msg = s.list.some((p, i) => s.found.has(i) && nameOK(t, p.n, [p.x && p.x.full])) ? "Already named." : "Not in this line-up."; }
  renderAll(); }
function endAll() { const s = AL.s; if (s.over) return; s.over = true; clearInterval(AL.t); const sc = s.found.size * 100 - s.wrong * 20 - s.hints * 30; addXP(Math.max(5, Math.round(sc / 20)), s.w); if (s.found.size === s.list.length) { Snd.win(); confetti(); Mascot.react("best", true); } else Mascot.react("over"); const k = s.w + ":" + s.game, p = prof(); if (!p.best[k] || sc > p.best[k].score) { p.best[k] = { score: sc, streak: s.found.size }; saveProf(); } renderAll(); }
/* ---------------- storage and profile (browser first, like ballknowledge without an account) ---------------- */
const KEY = "gp-v1";
const store = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } })();
const saveStore = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage blocked */ } };
function prof() { const p = store.profile || (store.profile = {}); return Object.assign(p, { xp: p.xp || 0, ach: p.ach || {}, days: p.days || {}, nick: p.nick || "", avatar: p.avatar || "", worlds: p.worlds || {}, dex: p.dex || {}, splashes: p.splashes || {}, best: p.best || {}, mix: p.mix || { played: 0, won: 0 }, elo: p.elo || 1000 }); }
const saveProf = () => { saveStore(); if (typeof Cloud !== "undefined") Cloud.push(); };
const LEVELS = [["Rookie", 0], ["Regular", 100], ["Contender", 300], ["Know-it-all", 650], ["Quizmaster", 1200], ["Professor", 2000], ["Legend", 3200], ["Polymath", 5000]];
const levelOf = (xp) => { let i = 0; LEVELS.forEach(([, t], k) => { if (xp >= t) i = k; }); const nx = LEVELS[i + 1]; return { i, name: LEVELS[i][0], next: nx ? nx[1] : null, from: LEVELS[i][1] }; };
const WRANKS = [[1500, "Legend"], [900, "Diamond"], [500, "Platinum"], [250, "Gold"], [100, "Silver"], [0, "Bronze"]];
const wRank = (xp) => (WRANKS.find(([m]) => xp >= m) || WRANKS[WRANKS.length - 1])[1];
const rkIcon = (name) => `<svg class='ic rk rk-${name.toLowerCase()}'><use href='#i-rank'/></svg>`;
const todayKey = () => new Date().toISOString().slice(0, 10);
function avatarHTML(av, size = "md", nick = "") {
  const x = av && findItem(av); const inner = x && imgOf(x) ? `<img src="${imgOf(x)}" alt="" class="${isCut(x) ? "cutpic" : ""}">` : `<span class="avl">${esc((nick || "?")[0].toUpperCase())}</span>`;
  return `<span class="av av-${size}">${inner}</span>`;
}
function findItem(key) { const [w, id] = String(key).split(":"); return items(w).find((x) => x.id === id) || null; }

/* achievements: names, tiers and icons in ballknowledge's format */
const TIERS = [["Common", "#9aa3b2"], ["Uncommon", "#4ade80"], ["Rare", "#38bdf8"], ["Epic", "#c084fc"], ["Legendary", "#fbbf24"]];
const ACH = [
  ["first_buzz", "First buzz", "Get your first answer right", 0, "bolt"], ["hat3", "Hat-trick", "Three right in a row in a solo run", 0, "flame"], ["speed", "Lightning", "Score 950 or more in one round", 2, "bolt"],
  ["streak10", "Unstoppable", "A solo streak of 10", 3, "flame"], ["elite_win", "Elite", "Get a round right on Elite", 2, "star"], ["explorer", "Explorer", "Play a game in every world", 2, "globe"],
  ["tourist", "Tourist", "Play a game in three different worlds", 1, "compass"], ["mix_first", "Crossover", "Finish a cross-category match", 1, "swords"], ["mix_win", "Polymath", "Win a cross-category match", 2, "trophy"],
  ["mix_sweep", "Clean sweep", "Win every round of a cross-category match", 3, "crown"], ["dex10", "Collector", "Put 10 cards in your Dex", 1, "album"], ["dex50", "Curator", "Put 50 cards in your Dex", 3, "album"],
  ["splash5", "Screen saver", "Collect 5 loading screens", 1, "star"], ["splash_rare", "Rare sight", "See a Rare loading screen", 1, "star"], ["splash_leg", "Legendary", "See a Legendary loading screen", 3, "crown"],
  ["secret", "The Notebook", "Find the secret loading screen", 4, "bulb"], ["avatar", "New face", "Pick a profile picture", 0, "user"], ["duo", "Rivals", "Finish a two-player game", 0, "swords"],
  ["flags20", "Flag bearer", "Get 20 flags right", 2, "flag"], ["kpop_debut", "Day one stan", "Get 10 song or fandom match-ups right", 1, "star"], ["value10", "Scout", "Get 10 market values right", 1, "trend"],
];
const achOf = (id) => ACH.find((a) => a[0] === id);
function award(id) { const p = prof(); if (p.ach[id]) return; p.ach[id] = todayKey(); saveProf(); const a = achOf(id); if (!a) return; toast(`<b>Achievement unlocked</b><br>${esc(a[1])}: ${esc(a[2])}`, "ach"); Snd.win(); setTimeout(() => Mascot.react("achieve", true), 1400); }
function addXP(n, w) { const p = prof(), lv0 = levelOf(p.xp).i; n = xpGate(n); if (n <= 0) return; p.xp += n; if (w) { const W = p.worlds[w] || (p.worlds[w] = { xp: 0, plays: 0 }); const r0 = wRank(W.xp); W.xp += n; if (wRank(W.xp) !== r0) { toast(`<b>Rank up in ${esc(WORLDS[w].name)}</b><br>${rkIcon(wRank(W.xp))} ${wRank(W.xp)}`, "ach"); Mascot.react("rankup", true); } } p.days[todayKey()] = (p.days[todayKey()] || 0) + 1; saveProf(); if (levelOf(p.xp).i > lv0) toast(`<b>Level up</b><br>${levelOf(p.xp).name}`, "ach"); paintProfileBtn(); }
function collect(w, x) { if (!x || !imgOf(x)) return; const p = prof(), k = w + ":" + x.id; p.dex[k] = (p.dex[k] || 0) + 1; if (p.dex[k] === 3) toast(`<b>New card</b><br>${esc(x.n)} joined your Dex`, "ach"); saveProf(); const n = Object.values(p.dex).filter((c) => c >= 3).length; if (n >= 10) award("dex10"); if (n >= 50) award("dex50"); }
const dexHas = (k) => (prof().dex[k] || 0) >= 3;

/* ---------------- sidekick voices: each one "talks" in its own made-up chatter (short sung syllables), no robot speech ---------------- */
const VOICES = {   // base pitch Hz, waveform, syllable length s, pitch spread, vibrato, brightness (filter Hz)
  bongi: [520, "triangle", 0.07, 0.35, 6, 2600], mic: [660, "square", 0.06, 0.45, 9, 3200], pocha: [300, "sawtooth", 0.09, 0.25, 4, 1500],
  bench: [150, "sawtooth", 0.11, 0.2, 3, 1100], boot: [240, "square", 0.08, 0.3, 5, 1800], rita: [440, "triangle", 0.075, 0.4, 7, 2400],
  rim: [200, "square", 0.09, 0.25, 4, 1400], clock: [380, "square", 0.05, 0.15, 0, 3000], sneak: [470, "sawtooth", 0.065, 0.5, 8, 2200],
  pin: [560, "sine", 0.07, 0.35, 5, 2800], tock: [170, "triangle", 0.12, 0.18, 2, 1000], dumpling: [480, "sine", 0.085, 0.3, 10, 2000],
  dogear: [330, "triangle", 0.08, 0.3, 3, 1700], neko: [720, "sine", 0.06, 0.55, 12, 3600],
};
const Babble = {
  ctx: null, until: 0, queue: [],
  // browsers only let sound start after a click or key press: start the voice context on the first one, then play anything queued
  ready() {
    try { const C = this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)()); if (C.state !== "running") C.resume().then(() => this.flush()).catch(() => {}); else this.flush(); } catch (e) { /* no audio */ }
  },
  flush() { const q = this.queue.splice(0); q.forEach(([w, t]) => this.say(w, t)); },
  say(who, text) {
    if (typeof Snd !== "undefined" && Snd.level === 0) return;
    if (!this.ctx || this.ctx.state !== "running") { this.queue = [[who, text]]; this.ready(); return; }
    const h = [...String(who)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0;
    const v = VOICES[who] || [220 + (h % 400), ["sine", "triangle", "square"][h % 3], 0.06 + (h % 5) / 100, 0.3, h % 9, 1500 + (h % 2000)];
    const C = this.ctx || (this.ctx = new (window.AudioContext || window.webkitAudioContext)()); if (C.state === "suspended") C.resume();
    if (this.out) { try { this.out.gain.setTargetAtTime(0, C.currentTime, 0.03); } catch (e) { /* gone */ } }   // a new line cuts the old one
    let t = C.currentTime + 0.03; const out = C.createGain(); out.gain.value = 0.13 * (typeof Snd !== "undefined" && Snd.level === 2 ? 1.5 : 1); this.out = out;
    const f = C.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = v[5]; f.connect(out); out.connect(C.destination);
    const words = String(text).replace(/[^\p{L}\p{N}\s?!.,]/gu, "").split(/\s+/).slice(0, 14);
    for (const w of words) {
      const syl = Math.max(1, Math.min(4, Math.round(w.length / 3)));
      for (let k = 0; k < syl; k++) {
        const ch = (w.charCodeAt(k * 2 % w.length) || 97) % 12, o = C.createOscillator(), g = C.createGain();
        o.type = v[1]; o.frequency.setValueAtTime(v[0] * (1 + (ch / 12 - 0.5) * v[3]), t);
        if (/[?]$/.test(w) && k === syl - 1) o.frequency.linearRampToValueAtTime(v[0] * 1.5, t + v[2]);
        if (v[4]) { const l = C.createOscillator(), lg = C.createGain(); l.frequency.value = v[4]; lg.gain.value = v[0] * 0.03; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + v[2] + 0.02); }
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + 0.01); g.gain.exponentialRampToValueAtTime(0.001, t + v[2]);
        o.connect(g); g.connect(f); o.start(t); o.stop(t + v[2] + 0.02); t += v[2] * 1.15;
      }
      t += v[2] * (/[.,!?]$/.test(w) ? 2.2 : 0.8);
    }
    this.until = t;
  },
};
/* ---------------- sidekick dock (ballknowledge's #mascot markup and CSS; the sidekick follows the world you are in) ---------------- */
const Mascot = (() => {
  let hideT = null, last = 0; const said = [];
  const id = () => { const w = S.world && WORLDS[S.world] ? S.world : null, k = w ? (prof().kick || {})[w] : prof().kickHome; return k && MASCOT_SVG[k] ? k : w ? WORLDS[w].mascot : "bongi"; };
  const mode = () => { try { return localStorage.getItem("gp_mascot") || "on"; } catch (e) { return "on"; } };
  const pick = (arr) => { const fresh = arr.filter((x) => !said.includes(x)), pool = fresh.length ? fresh : arr, x = rnd(pool); said.push(x); if (said.length > 30) said.shift(); return x; };
  function dock() { if (mode() === "off") { const d = $("#mascot"); if (d) d.remove(); return null; } let el = $("#mascot"); if (!el) { el = document.createElement("div"); el.id = "mascot"; el.setAttribute("role", "status"); el.setAttribute("aria-live", "polite"); document.body.appendChild(el); el.addEventListener("click", () => api.react("idle", true)); } if (el.dataset.who !== id()) { el.dataset.who = id(); el.innerHTML = `<div class="mbody calm">${MASCOT_SVG[id()]("calm")}</div><div class="mbubble"></div>`; el.className = "on"; } return el; }
  function show(kind, text) {
    const el = dock(); if (!el) return; const mood = MOOD_OF[kind] || "calm";
    el.querySelector(".mbody").className = "mbody " + mood; el.querySelector(".mbody").innerHTML = MASCOT_SVG[id()](mood);
    el.querySelector(".mbubble").innerHTML = `<b>${MASCOTS[id()].name}</b>${esc(text)}`; el.className = "on talk k-" + kind;
    clearTimeout(hideT); hideT = setTimeout(() => { el.className = "on"; const b = el.querySelector(".mbody"); b.className = "mbody calm"; b.innerHTML = MASCOT_SVG[id()]("calm"); }, Math.min(9000, 3000 + text.length * 45));
    try { if ((localStorage.getItem("gp_voice") || "1") === "1") Babble.say(id(), text); } catch (e) { /* no audio */ }
  }
  const api = {
    id, mode, dock, name: () => MASCOTS[id()].name, face: (m) => MASCOT_SVG[id()](m), setCtx() {},
    react(kind, force) { const now = performance.now(), big = ["streak", "best", "over", "rankup", "achieve", "welcome"].includes(kind); if (!big && !force && now - last < 5000) return; last = now; const L = MASCOTS[id()].lines || {}, pool = L[kind] || L.hit || []; if (pool.length) show(kind, pick(pool)); },
    hello() { const L = MASCOTS[id()].lines; if (L && L.welcome) show("welcome", pick(L.welcome)); },
  };
  return api;
})();

/* ---------------- theme + routing (same wash transition as ballknowledge) ---------------- */
function setTheme(code, ev) {
  const root = document.documentElement, apply = () => { root.setAttribute("data-league", code || "HOME"); setParticleColours(code || "HOME"); try { Snd.theme(code || "HOME"); } catch (e) { /* quiet */ } Mascot.dock(); };
  if (REDUCED || !ev || !ev.clientX) { apply(); return; }
  const wash = $("#wash"); wash.style.setProperty("--wx", ev.clientX + "px"); wash.style.setProperty("--wy", ev.clientY + "px"); wash.style.setProperty("--wash", getComputedStyle(root).getPropertyValue("--bg"));
  wash.classList.remove("go"); void wash.offsetWidth; wash.classList.add("go"); setTimeout(apply, 280);
}
const SECTIONS = ["home", "worldsPage", "league", "mixPage", "profilePage", "collPage", "setPage", "wikiPage"];
function show(id) { SECTIONS.forEach((s) => { const el = $("#" + s); if (el) el.hidden = s !== id; }); scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }); }
function go(slug, ev) { try { if (location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug); } catch (e) { /* no hash */ } route(ev); }
function route(ev) {
  const h = (location.hash || "#home").slice(1); if (!h.startsWith("w-kpop")) { try { const sd = localStorage.getItem("gp_diff"); if (sd && DIFFS.some((x) => x[0] === sd)) S.diff = sd; } catch (e) { /* blocked */ } } stopQuiz(); document.body.classList.remove("ingame"); Snd.mode(h.startsWith("w-") && h.split("-").length > 2 ? "game" : "lobby");
  if (h.startsWith("w-")) { const [, w, g] = h.split("-"); if (!WORLDS[w]) return go("worlds"); const changed = S.world !== w; S.world = w; setTheme(w, ev); show("league"); renderWorld(); if (g && gameOf(w, g)) openGame(g); else { S.game = null; renderHub(); } if (changed) setTimeout(() => Mascot.hello(), 700); return; }
  S.world = null;
  if (h === "worlds") { setTheme("HOME", ev); show("worldsPage"); renderWorlds(); return; }
  if (h === "mix") { setTheme("mix", ev); show("mixPage"); renderMix(); return; }
  if (h === "profile") { setTheme("HOME", ev); show("profilePage"); renderProfile(); return; }
  if (h === "collection") { setTheme("HOME", ev); show("collPage"); renderCollection(); return; }
  if (h === "settings") { setTheme("HOME", ev); show("setPage"); renderSettings(); return; }
  if (h === "wiki") { setTheme("HOME", ev); show("wikiPage"); renderWiki(); return; }
  setTheme("HOME", ev); show("home"); renderHome();
}

/* ---------------- home: the photo wall and the doors ---------------- */
function renderHome() {
  const all = shuffle(WORLD_IDS.flatMap((w) => items(w, (x) => x.img).slice(0, 30))).slice(0, 60);
  const tiles = all.map((x) => `<div class="wtile"><img src="${x.img}" alt="${esc(x.n)}" class="${isCut(x) ? "cutpic" : ""}" loading="lazy"><span>${esc(x.n)}</span></div>`);
  $("#photowall").innerHTML = [0, 1].map((r) => { const l = tiles.filter((_, i) => i % 2 === r); return `<div class="wrow ${r ? "rev" : ""}" style="--sp:${80 + r * 20}s">${l.concat(l).join("")}</div>`; }).join("");
  $("#doors").innerHTML = "";
  const n = WORLD_IDS.reduce((s2, w) => s2 + items(w).length, 0), ng = WORLD_IDS.reduce((s2, w) => s2 + GAMES[w].length, 0);
  $("#ribbon").innerHTML = `<span><b class="num">${WORLD_IDS.length}</b> categories</span><span><b class="num">${ng}</b> games</span><span><b class="num">${n.toLocaleString()}</b> real people, places and things</span>`;
  $("#homeCats").innerHTML = catCards(); const top = $("#homeTop"); if (top && typeof Daily !== "undefined" && Daily) top.innerHTML = homeTopHTML();
  const mixPics = WORLD_IDS.map((w) => items(w, (x) => x.img)[0]).filter(Boolean);
  $("#homeMix").innerHTML = `<h2 class="sec">Multi-genre</h2><p class="secsub">Every category in one game. Test yourself across all of them, or beat a friend who knows completely different things.</p><div class="groups">
    <button type="button" class="gpick" data-go="mix"><div class="gfaces">${mixPics.slice(0, 4).map((x) => `<img class="gface-img ${isCut(x) ? "cutpic" : ""}" src="${x.img}" alt="">`).join("")}</div><div class="gname">Cross-category match</div><div class="gtag">Two players. Each picks three categories, bans one of the other's, a wildcard joins, and every round is a real game from that category.</div><span class="dgo">Challenge a friend</span></button>
    <button type="button" class="gpick" data-gamut="1"><div class="gfaces">${mixPics.slice(4, 8).map((x) => `<img class="gface-img ${isCut(x) ? "cutpic" : ""}" src="${x.img}" alt="">`).join("")}</div><div class="gname">Gamut run</div><div class="gtag">Solo. One round from every category, back to back. How far does your knowledge reach?</div><span class="dgo">${WORLD_IDS.length} rounds</span></button></div>`;
  homeTilt();
}
function catCards() {
  const p = prof();
  return WORLD_IDS.map((w, k) => { const W = WORLDS[w], pics = shuffle(items(w, (x) => x.img && (w !== "kpop" || x.kind === "idol")).sort((a, b) => (b.fame || 0) - (a.fame || 0)).slice(0, 24)).slice(0, 3), wx = (p.worlds[w] || {}).xp || 0, kick = (p.kick || {})[w] || W.mascot;
    return `<button type="button" class="world ${k === 0 ? "feat" : ""}" data-go="w-${w}" style="${wvars(w)};--d:${k * 70}ms"><div class="wbody"><div class="wk">${esc(W.kicker)}</div><div class="wn">${esc(W.name)}</div><div class="wt">${esc(W.tag)}</div><div class="ws"><span>${GAMES[w].length} games</span><span>${rkIcon(wRank(wx))} ${wRank(wx)}</span></div></div>${pics.length ? `<div class="wpics">${pics.map((x) => `<img src="${x.img}" alt="" class="${isCut(x) ? "cutpic" : ""}">`).join("")}</div><div class="wmas">${MASCOT_SVG[kick]("happy")}</div>` : `<div class="wbig">${MASCOT_SVG[kick]("happy")}</div>`}</button>`; }).join("");
}
function homeTilt() { document.querySelectorAll(".door,.world,.gcard").forEach((el) => { el.onpointermove = (e) => { const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height; el.style.setProperty("--ry", `${(x - 0.5) * 8}deg`); el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`); el.style.setProperty("--mx", x * 100 + "%"); el.style.setProperty("--my", y * 100 + "%"); }; el.onpointerleave = () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); }; }); }

function renderWorlds() {
  $("#worlds").innerHTML = catCards(); homeTilt(); return;
  const p = prof();
  $("#worlds").innerHTML = WORLD_IDS.map((w, k) => { const W = WORLDS[w], pics = shuffle(items(w, (x) => x.img).slice(0, 20)).slice(0, 3), wx = (p.worlds[w] || {}).xp || 0;
    return `<button type="button" class="world" data-go="w-${w}" style="${wvars(w)};--d:${k * 70}ms"><div class="wbody"><div class="wk">${esc(W.kicker)}</div><div class="wn">${esc(W.name)}</div><div class="wt">${esc(W.tag)}</div><div class="ws"><span>${GAMES[w].length} games</span><span>${items(w).length} items</span><span>${rkIcon(wRank(wx))} ${wRank(wx)}</span></div></div><div class="wpics">${pics.map((x) => `<img src="${x.img}" alt="" class="${isCut(x) ? "cutpic" : ""}">`).join("")}</div><div class="wmas">${MASCOT_SVG[W.mascot]("happy")}</div></button>`; }).join("");
  homeTilt();
}

/* ---------------- a world: header, rooms, the game hub ---------------- */
function renderWorld() {
  const w = S.world, W = WORLDS[w], wx = (prof().worlds[w] || {}).xp || 0;
  $("#crumbs").innerHTML = `<button class="back" data-go="worlds" type="button">← Worlds</button><div class="trail"><span class="crumb cur">${esc(W.name)}</span></div>`;
  $("#lFlag").innerHTML = ""; $("#lFlag").style.background = `linear-gradient(135deg, ${WVARS[w][4]}, ${WVARS[w][3]})`; $("#lKicker").textContent = W.kicker; $("#lName").textContent = W.name; $("#lTag").textContent = W.tag;
  $("#scorebox").innerHTML = `<div class="score"><span class="label">Rank</span><b>${rkIcon(wRank(wx))} ${wRank(wx)}</b></div><div class="score"><span class="label">World XP</span><b class="num">${wx}</b></div><div class="score"><span class="label">Dex</span><b class="num">${Object.keys(prof().dex).filter((k) => k.startsWith(w + ":") && dexHas(k)).length}/${items(w, imgOf).length}</b></div>`;
}
function kickRow(w) { const cur = (prof().kick || {})[w] || WORLDS[w].mascot; return `<div class="kickrow"><span class="label">${esc(WORLDS[w].name)}</span>${WORLDS[w].kicks.concat(Object.keys(MASCOTS).filter((k) => !WORLDS[w].kicks.includes(k))).map((k) => `<button type="button" class="kick ${k === cur ? "on" : ""}" data-kick="${k}" data-kw="${w}" title="${esc(MASCOTS[k].name)}: ${esc(MASCOTS[k].blurb)}">${MASCOT_SVG[k]("happy")}<small>${esc(MASCOTS[k].name)}</small></button>`).join("")}</div>`; }
function recordLine(w, id) { const b = prof().best[w + ":" + id]; return b ? `Your best: ${b.score.toLocaleString()} pts · streak ${b.streak}` : "Not played yet"; }
function renderHub() {
  const w = S.world; let k = 0;
  const faces = (g) => shuffle(g.pool().filter(imgOf)).slice(0, 3).map((x) => `<img class="gface-img ${x.logo || x.flag ? "contain" : ""} ${isCut(x) ? "cutpic" : ""}" src="${imgOf(x)}" alt="">`).join("");
  $("#room").innerHTML = `<h2 class="sec">What do you want to play?</h2><p class="secsub">${GAMES[w].length} games in ${esc(WORLDS[w].name)}. Every one works solo, on one device with a friend, or on two devices.</p><div class="hub">${GAMES[w].map((g) => `<button type="button" class="gcard" data-game="${g.id}" style="--d:${k++ * 60}ms"><div class="gfaces">${faces(g)}</div><div class="gname">${esc(g.name)}</div><div class="gmodes">${g.kind === "play" ? "vs computer · 2 players" : g.kind === "hol" ? "Solo streak · 2 players" : g.kind === "roulette" ? "Solo 60 seconds · 2 players" : "Solo streak · 2 players · online"}</div><div class="gtag">${esc(g.tag)}</div><div class="grec num">${esc(recordLine(w, g.id))}</div></button>`).join("")}</div>`;
  homeTilt();
}

/* ================= the round engine (ballknowledge's Q engine, generalised to any world) ================= */
const Q = { timer: null, s: null };
function stopQuiz() { if (Q.timer) { clearInterval(Q.timer); Q.timer = null; } try { Aud.stop(); } catch (e) { /* not ready */ } }
/* Hear the song: Apple's 30-second previews, played in slices (3 s, then 5 s more, then the rest), paused while someone answers */
const Aud = {
  a: null, t: null, ok: true,
  load(url) { this.stop(); this.ok = true; this.blocked = false; if (!url) { this.a = null; return; } const a = new Audio(); a.preload = "auto"; a.src = url; a.onerror = () => { this.ok = false; this.note(window.ARTIFACT ? "Audio can't play in this preview. It plays on moultimateball.vercel.app." : "This preview didn't load. Skip it or use the hints."); }; this.a = a; setTimeout(() => this.stage(1), 400); },
  play(from, to) { const a = this.a; if (!a) return; clearTimeout(this.t); try { a.currentTime = from; a.play().then(() => { this.blocked = false; this.note(""); }).catch(() => { this.blocked = true; this.note(""); }); } catch (e) { return; } this.t = setTimeout(() => a.pause(), (to - from) * 1000); },
  stage(n) { if (n === 1) this.play(0, 3); else if (n === 2) this.play(3, 8); else if (n >= 5) this.play(8, 30); },
  note(t) { const n = $("#audNote"); if (!n) return; n.innerHTML = t ? esc(t) : this.blocked ? `<button class="btn" id="audReplay" type="button">▶ Tap to play</button>` : "Listening… replay with the button below"; },
  pause() { if (this.a) this.a.pause(); clearTimeout(this.t); },
  stop() { this.pause(); if (this.a) { this.a.src = ""; this.a = null; } },
};
const gamesBar = (title) => `<div class="row" style="margin-bottom:12px"><button class="btn ghost" id="gamesBack" type="button">← Back</button><h2 style="font-size:24px">${title}</h2></div>`;
const diffBar = () => S.world === "kpop" ? "" : `<div class="label" style="margin-top:14px">Difficulty</div><div class="diffbar" role="group" aria-label="Difficulty">${DIFFS.map(([k]) => [k, diffName(k)]).map(([k, n]) => `<button type="button" class="chip" data-diff="${k}" aria-pressed="${S.diff === k}">${n}</button>`).join("")}</div><div class="fine" id="diffNote" style="margin-top:6px">${DIFFNOTE[S.diff]}</div>`;
const modeIntro = (title, blurb, opts) => `<div class="card">${gamesBar(title)}<p class="sub">${blurb}</p>${diffBar()}<div class="label" style="margin-top:16px">Players and devices</div><div class="modes">${opts.map((o) => `<button class="mode" data-mode="${o.id}" type="button"><b>${o.t}</b><span>${o.d}</span></button>`).join("")}</div><div id="roomBox"></div></div>`;
const NAMES = () => { try { const n = JSON.parse(localStorage.getItem("gp_names") || "null"); return n && n.length === 2 ? n : ["Player 1", "Player 2"]; } catch (e) { return ["Player 1", "Player 2"]; } };
function openGame(id) {
  S.game = id; if (S.world === "kpop") S.diff = "medium"; const g = gameOf(S.world, id); stopQuiz(); Q.s = null; H.s = null; document.body.classList.remove("ingame");
  const how = { play: "The difficulty sets how strong the computer plays.", photo: "The picture is there from the start; hints arrive at one third and two thirds of the time.", clue: "Clues start hard and get easier.", blur: "The picture starts blurred and sharpens every few seconds.", scramble: "The letters of every word are shuffled. Hints arrive slowly.", hol: "Two picks, one question. Tap the right side.", all: "Type names in any order. Initials cost 30 points, a wrong name 20.", ttt: "Tap a square and name someone who fits its row and column. A wrong or repeated name loses your turn.", roulette: "Name as many as you can. In a duel, take turns: blank, repeat or run out of time and you lose the round.", audio: "A real song plays in short slices: 3 seconds, then 5 more, then the rest." }[g.kind];
  $("#room").innerHTML = modeIntro(esc(g.name), `${esc(g.tag)} ${how} ${g.kind === "hol" ? "Solo: keep the streak going. Two players: take turns, five each." : "Buzz in whenever you think you know it. The sooner you are right, the more you score (up to 1,000); a wrong guess costs 150."}`, [
    { id: "solo", t: g.kind === "ttt" || g.kind === "play" ? "Solo, against the computer" : g.kind === "roulette" || g.kind === "all" ? "Solo, against the clock" : "Solo streak", d: g.kind === "ttt" ? "The computer gets smarter with the difficulty." : g.kind === "all" ? "Name everyone before the clock runs out." : g.kind === "roulette" ? "Name as many as you can before time runs out." : "Keep going for as long as you can. The run ends the first time you miss." },
    ...(g.kind === "all" ? [] : [{ id: "duo", t: "Two players, one device", d: g.kind === "play" ? "One board, pass the device after every move." : g.kind === "hol" ? "Take turns. Most right after five each wins." : g.kind === "roulette" ? "Three rounds. Take turns typing names on the same screen." : "Five rounds. Race to buzz: A for player 1, L for player 2." }]),
    ...(["hol", "roulette", "all", "ttt", "play"].includes(g.kind) ? [] : [{ id: "online", t: "Two players, two devices", d: "The same race on two phones or computers, with a four-letter room code." }])]);
  if (["clue", "blur", "photo", "audio", "scramble", "hol"].includes(g.kind)) { $("#room").insertAdjacentHTML("beforeend", `<div class="card" id="boardBox"></div>`); if (Boards) Boards.paint(`${S.world}:${id}`, g.kind === "hol" ? "streak" : "points"); }
  Snd.mode("game");
}
function startMode(m) {
  const g = gameOf(S.world, S.game); if (m === "online") return openOnline(); document.body.classList.add("ingame");
  { const p = prof(); p.last = { w: S.world, g: S.game, t: Date.now() }; p.gplays = p.gplays || {}; p.gplays[S.world + ":" + S.game] = (p.gplays[S.world + ":" + S.game] || 0) + 1; saveProf(); }
  addPlay(S.world);
  const go2 = () => { if (g.kind === "play") return newChessPlay(m); if (g.kind === "all") return newAll(m); if (g.kind === "ttt") return newTTT(m); if (g.kind === "hol") return newHol(m); if (g.kind === "roulette") return newRou(m); newQuiz(S.world, S.game, m); };
  if (m === "duo") { const n = NAMES(); Vs.match({ nick: n[0], avatar: prof().avatar }, { nick: n[1], avatar: "" }, go2); } else go2();
}
/* ---------------- roulette (ballknowledge's Club roulette): name members or players of a group, club or team ---------------- */
const RO = { s: null, t: null };
function newRou(mode) { RO.s = { w: S.world, game: S.game, mode, round: 0, wins: [0, 0], score: 0, phase: "play" }; nextRou(); }
function nextRou() {
  const s = RO.s, g = gameOf(s.w, s.game); s.round++; if (s.w === "kpop") { s.pk = s.pk || Pick.ctx(); s.x = Pick.choose(byFame(g.pool()), s.pk); Pick.record(s.x, s.pk); } else s.x = rnd(byFame(g.pool())); s.roster = g.roster(s.x); s.named = []; s.turn = (s.round - 1) % 2; s.phase = "play"; s.msg = "";
  s.left = rouTurn(s.mode === "solo"); clearInterval(RO.t); RO.t = setInterval(() => { s.left -= 0.25; const c = $("#roClock"); if (c) c.textContent = Math.ceil(s.left) + "s"; if (s.left <= 0) rouLose("time"); }, 250); renderRou();
}
function renderRou() {
  const s = RO.s, g = gameOf(s.w, s.game), n = NAMES(), x = s.x;
  if (s.phase === "done") { clearInterval(RO.t); const duo = s.mode === "duo", winner = s.wins[0] === s.wins[1] ? -1 : s.wins[0] > s.wins[1] ? 0 : 1; $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${finale({ label: duo ? "Full time" : "Time!", verdict: duo ? (winner < 0 ? "A draw." : esc(n[winner]) + " wins!") : `${s.score} named.`, players: duo ? [0, 1].map((k) => ({ name: n[k], score: s.wins[k] })) : [{ name: prof().nick || "You", score: s.score, av: avatarHTML(prof().avatar, "lg", prof().nick || "You") }], winner: duo ? winner : null, good: duo || s.score >= 6, tiles: [], buttons: `<button class="btn" id="roAgain" type="button">Play again</button>` })}</div>`; return; }
  const head = `<div class="row" style="gap:14px;align-items:center;margin:6px 0 12px">${imgOf(x) ? `<img class="ansimg ${x.logo ? "contain" : ""}" src="${imgOf(x)}" alt="">` : ""}<div><div class="label">${s.mode === "duo" ? `Round ${s.round} of 3` : "Name as many as you can"}</div><h3 style="font-size:32px;font-family:var(--display)">${esc(x.n)}</h3><div class="fine">${s.roster.length} in our data</div></div><span class="num" id="roClock" style="margin-left:auto;font:800 34px var(--display)">${Math.ceil(s.left)}s</span></div>`;
  const named = `<div class="mixstrip">${s.named.map((p) => `<span>${imgOf(p) ? `<img src="${imgOf(p)}" alt="">` : ""}${esc(p.n)}</span>`).join("")}</div>`;
  const reveal = s.phase === "reveal" ? `<div class="rcard on" style="margin-top:10px"><b>${esc(s.msg)}</b><div class="fine" style="margin-top:6px">Some you could have said: ${s.roster.filter((p) => !s.named.includes(p)).slice(0, 8).map((p) => esc(p.n)).join(", ")}</div></div><div class="row" style="margin-top:12px"><button class="btn" id="roNext" type="button">${s.mode === "solo" || s.round >= 3 ? "See the result" : "Next round"}</button></div>` : `<div class="answerbox"><div class="row"><b>${s.mode === "duo" ? esc(n[s.turn]) + ", your turn" : "Your answer"}</b></div><div class="row"><input id="roIn" autocomplete="off" spellcheck="false" placeholder="Type a name" aria-label="A name"><button class="btn" id="roGo" type="button">Say it</button><button class="btn ghost" id="roGive" type="button">Give up</button></div><div class="fine">${esc(s.msg)}</div></div>`;
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${s.mode === "duo" ? `<div class="qhud"><span class="label">Rounds won</span>${[0, 1].map((i) => `<span class="num qscore"><small>${esc(n[i])}</small> <b>${s.wins[i]}</b></span>`).join("")}</div>` : `<div class="qhud"><span class="label">Named</span><span class="num qscore"><b>${s.score}</b></span></div>`}${head}${named}${reveal}</div>`;
  const i = $("#roIn"); if (i) i.focus({ preventScroll: true });
}
function rouSay() {
  const s = RO.s, t = ($("#roIn") || {}).value || ""; if (!t.trim() || s.phase !== "play") return;
  const hit = s.roster.find((p) => !s.named.includes(p) && nameOK(t, p.n, [p.full])) || s.roster.find((p) => nameOK(t, p.n, [p.full]));
  if (!hit) { s.msg = `Not in the data for ${s.x.n}. Try another.`; Snd.wrong(); flashEdge(false); renderRou(); return; }
  if (s.named.includes(hit)) { if (s.mode === "duo") return rouLose("repeat"); s.msg = "Already said."; renderRou(); return; }
  s.named.push(hit); Snd.right(); flashEdge(true); collect(s.w, hit); s.msg = "";
  if (s.mode === "solo") { s.score++; addXP(5, s.w); if (s.named.length >= s.roster.length) return rouLose("all"); }
  else { s.turn = 1 - s.turn; s.left = rouTurn(false); if (s.named.length >= s.roster.length) return rouLose("all"); }
  renderRou();
}
function rouLose(why) { const s = RO.s; if (s.phase !== "play") return; clearInterval(RO.t); s.phase = "reveal"; const n = NAMES();
  if (s.mode === "solo") s.msg = why === "all" ? "You named every one!" : `${why === "give" ? "You gave up" : "Time!"} ${s.score} named.`;
  else if (why === "all") s.msg = "Every name used. Nobody loses this round.";
  else { s.wins[1 - s.turn]++; s.msg = `${n[s.turn]} ${why === "repeat" ? "repeated a name" : why === "give" ? "gave up" : "ran out of time"}. Round to ${n[1 - s.turn]}.`; Snd.wrong(); }
  renderRou(); }

function addPlay(w) { const p = prof(); const W = p.worlds[w] || (p.worlds[w] = { xp: 0, plays: 0 }); W.plays++; saveProf(); const n = WORLD_IDS.filter((x) => (p.worlds[x] || {}).plays).length; if (n >= 3) award("tourist"); if (n >= WORLD_IDS.length) award("explorer"); }

function newQuiz(w, game, mode, mix) { Q.hold = false; clearTimeout(Q.auto); Q.s = { w, game, mode, round: 0, rounds: mix ? mix.length : mode === "solo" ? 10 : 5, scores: mode === "solo" ? [0] : [0, 0], streak: 0, phase: "run", mix: mix || null, wins: [0, 0], used: new Set() }; nextRound(); }
function curDef() { const s = Q.s; return s.mix ? gameOf(s.mix[s.round - 1].w, s.mix[s.round - 1].g) : gameOf(s.w, s.game); }
function curWorld() { const s = Q.s; return s.mix ? s.mix[s.round - 1].w : s.w; }
function nextRound() {
  const s = Q.s; s.round++; const d = curDef(), pool = byFame(d.pool()); let r;
  const kp = curWorld() === "kpop" && !s.daily; s.pk = s.pk || Pick.ctx();
  const fresh = (x) => !s.used.has(x.id) && (d.kind !== "scramble" || qnorm(x.n).length >= 4);
  const pickR = s.daily ? (k) => pool[Math.floor(seeded(`${s.daily}:${s.round}:${k}`) * pool.length)] : () => rnd(pool);
  if (kp) { const cand = pool.filter(fresh); r = Pick.choose(cand.length ? cand : pool, s.pk); } else for (let k = 0; k < 60; k++) { r = pickR(k); if (fresh(r)) break; }
  if (kp) Pick.record(r, s.pk);
  if (s.fixed) r = items(s.w).find((x) => x.id === s.fixed[s.round - 1]) || r;   // a challenge replays the challenger's exact rounds
  s.used.add(r.id); s.r = r; (s.picks = s.picks || []).push(r.id);
  s.clues = d.kind === "audio" ? [["Listen", "3 seconds"], ["Listen", "5 more seconds"], ["By", r.by], ["Year", r.year], ["Listen", "the whole preview"], ["Initials", first(r.n)]].filter((c) => c[1]) : d.kind === "blur" ? BLUR.map((b) => ["Blur", b]) : d.kind === "scramble" ? [["Letters", scrambleName(r.n)], ["It is", KIND_WORD[r.kind] || "a name"], ...(CLUES[r.kind] ? CLUES[r.kind](r).filter((c) => !/Initials|Starts|Letters/.test(c[0])).slice(-1) : []), ["Starts with", first(r.n)]] : d.kind === "photo" ? d.hints(r) : d.clues(r);
  /* a hint must never contain the answer (Tottenham Hotspur Stadium for Tottenham, "Albanian lek" for Albania): drop it, unless the clue IS the prompt */
  if (!["capital", "whose", "albumname", "where", "from", "quiz"].includes(d.id) && d.kind !== "scramble" && d.kind !== "audio") { const an = qnorm(nameOfAnswer(d, r)); if (an.length >= 5) { const stem = an.slice(0, Math.max(5, an.length - 2)), keep = s.clues.filter((c, i) => i === 0 || !qnorm(String(c[1])).includes(stem) || /^(Initials|Starts with)$/.test(c[0])); if (keep.length >= 2) s.clues = keep; } }
  s.elapsed = 0; s.paused = false; s.buzzed = null; s.locked = [false, false]; s.phase = "run"; s.result = null; s.hn = 0;
  Aud.load(d.kind === "audio" ? r.pv : null); s.cs = (d.kind === "audio" ? 7 : d.kind === "blur" ? 3.2 : d.kind === "scramble" ? 7 : d.kind === "photo" ? 8 : 6) * clueSpeed(); s.total = d.kind === "photo" ? 3 * s.cs : s.clues.length * s.cs + 6;
  if (s.mix) { setTheme(curWorld()); }
  renderQuiz(); if (Q.timer) clearInterval(Q.timer); Q.timer = setInterval(tickQuiz, 250); Net.sync();   /* not stopQuiz(): that would also stop this round's song */
}
const worth = () => { const s = Q.s; return Math.max(100, Math.round(1000 * (1 - s.elapsed / s.total) * (curDef().kind === "scramble" ? Math.max(0.4, 1 - 0.15 * s.hn) : 1))); };
const shownCount = () => { const s = Q.s, k = curDef().kind; return k === "photo" ? Math.min(s.clues.length, (S.diff === "easy" ? 1 : 0) + Math.floor(s.elapsed / s.cs)) : k === "scramble" ? Math.min(s.clues.length, startClues() + s.hn) : Math.min(s.clues.length, (k === "audio" ? 1 : startClues()) + Math.floor(s.elapsed / s.cs)); };
function tickQuiz() {
  const s = Q.s; if (!s || s.phase !== "run") return; if (!$("#qMeter")) { stopQuiz(); return; }
  if (s.paused) { s.answerLeft -= 0.25; if (s.answerLeft <= 0) wrongGuess(true); else { const c = $("#qClock"); if (c) c.textContent = Math.ceil(s.answerLeft) + "s"; } return; }
  const before = shownCount(); s.elapsed += 0.25; if (curDef().kind === "scramble" && s.elapsed > (s.hn + 1) * s.cs * 1.6 && s.hn < s.clues.length - 1) s.hn++;
  if (shownCount() > before) { Snd.tick(); paintClues(); Net.sync(); if (curDef().kind === "audio") Aud.stage(shownCount()); }
  if (s.elapsed >= s.total) endRound(null); else { const m = $("#qMeter"), wv = $("#qWorth"); if (m) m.style.width = (100 * (1 - s.elapsed / s.total)).toFixed(1) + "%"; if (wv) wv.textContent = worth(); }
}
function buzz(who) {
  const s = Q.s; if (!s || s.phase !== "run" || s.paused || s.locked[who]) return;
  if (Net.role === "guest") { Net.send({ k: "buzz" }); return; }
  s.paused = true; s.buzzed = who; s.answerLeft = answerTime(); Aud.pause(); Snd.lock(); renderQuiz(); Net.sync(); focusIn();
}
const focusIn = () => setTimeout(() => { const i = $("#qIn"); if (i) { i.value = ""; i.focus({ preventScroll: true }); } }, 0);
function isRight(typed, pickName) { const s = Q.s, d = curDef(), ans = nameOfAnswer(d, s.r); if (pickName != null) return qnorm(pickName) === qnorm(ans); if (nameOK(typed, ans, ans === s.r.n && s.r.full ? [s.r.full] : [])) return true; const m = resolveGuess(typed, suggestPool(d, curWorld()), (x) => x.n); return !!m && qnorm(m.n) === qnorm(ans); }
function submitAnswer(pickName, typedRemote) {
  const s = Q.s; if (!s || !s.paused) return; const typed = typedRemote != null ? typedRemote : ($("#qIn") && $("#qIn").value) || "";
  if (Net.role === "guest") { Net.send({ k: "ans", t: typed, p: pickName }); return; }
  if (isRight(typed, pickName)) endRound(s.buzzed); else wrongGuess(false);
}
function wrongGuess(timedOut) {
  const s = Q.s, who = s.buzzed; s.scores[who] -= 150; flashEdge(false); FX.miss(timedOut ? "Time! -150" : "-150"); Snd.wrong(); Mascot.react("miss");
  if (s.mode === "solo") { s.paused = false; s.buzzed = null; renderQuiz(); Net.sync(); return; }
  s.locked[who] = true; s.paused = false; s.buzzed = null; if (s.locked[0] && s.locked[1]) endRound(null); else { renderQuiz(); Net.sync(); }
}
function endRound(winner, gave) {
  const s = Q.s; stopQuiz(); s.paused = false; s.phase = "reveal"; let pts = 0; const w = curWorld(), d = curDef();
  if (winner != null) {
    pts = Math.round(worth() * (s.mode === "solo" ? DIFFX[S.diff] : 1)); s.scores[winner] += pts; s.wins[winner]++; s.streak++; s.best = Math.max(s.best || 0, s.streak); flashEdge(true); FX.hit(pts); Snd.win(); if (pts > 700) confetti();
    if (winner === 0 || s.mode !== "solo") { collect(w, s.r); award("first_buzz"); if (pts >= 950) award("speed"); if (S.diff === "elite") award("elite_win"); }
    if (s.mode === "solo") { FX.streak(s.streak); if (s.streak >= 3) award("hat3"); if (s.streak >= 10) award("streak10"); Mascot.react(pts > 800 ? "bighit" : s.streak >= 3 && s.streak % 3 === 0 ? "streak" : "hit"); }
    if (d.unit === "country" && d.kind === "blur") { const p = prof(); p.flags = (p.flags || 0) + 1; saveProf(); if (p.flags >= 20) award("flags20"); }
    addXP(10 + Math.round(pts / 100), w);
  } else { if (s.mode === "solo") { s.streak = 0; Mascot.react("miss"); } FX.miss(""); Snd.wrong(); }
  if (winner != null && typeof countRound === "function") countRound(s, winner, pts);
  s.result = { winner, pts, gave: !!gave }; (s.marks = s.marks || []).push(winner != null); renderQuiz(); Net.sync();
}
function finishQuiz() {
  const s = Q.s; s.phase = "done"; stopQuiz();
  if (s.mode === "solo") { const k = s.w + ":" + s.game, p = prof(), b = p.best[k]; if (!b || s.scores[0] > b.score) { p.best[k] = { score: s.scores[0], streak: s.best || 0 }; saveProf(); if (b) Mascot.react("best", true); } }
  else award("duo");
  if (s.mix) mixFinished(s);
  if (s.mode === "solo" && !s.mix) { if (typeof recordGame === "function") recordGame(s); if (s.daily) Daily.finish(s); else if (Boards) Boards.record(`${s.w}:${s.game}`, s.scores[0]); }
  renderQuiz(); Net.sync();
}
function paintClues() { const b = $("#qClues"); if (b) b.innerHTML = cluesHTML(); }
function cluesHTML() {
  const s = Q.s, d = curDef(), n = shownCount(), x = s.r;
  if (d.kind === "blur") { const k = d.imgKey, src = x[k] || imgOf(x); return `<div class="blurpic ${k === "logo" ? "logo" : k === "flag" ? "flag" : ""} ${isCut(x) ? "cut cutpic" : ""}"><img src="${src}" alt="" style="filter:blur(${BLUR[Math.min(n - 1, BLUR.length - 1)]}px)"></div><div class="fine" style="text-align:center">Sharpens every few seconds</div>`; }
  if (d.kind === "audio") { return `<div class="blurpic" style="width:min(240px,60vw);display:grid;place-items:center;background:radial-gradient(circle,var(--accent2),var(--surface2))"><div class="eq">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div></div><div class="fine" id="audNote" style="text-align:center">${!Aud.ok ? (window.ARTIFACT ? "Audio can't play in this preview. It plays on moultimateball.vercel.app." : "This preview didn't load. Skip it or use the hints.") : Aud.blocked ? `<button class="btn" id="audReplay" type="button">▶ Tap to play</button>` : "Listening… replay with the button below"}</div><div class="row" style="justify-content:center"><button class="btn ghost" id="audReplay" type="button">Replay what you've heard</button></div>` + s.clues.slice(2).map((c, i) => i + 2 < n ? `<div class="clue on"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>` : `<div class="clue off"><span class="label">${esc(c[0])}</span><b>?</b></div>`).join(""); }
  if (d.kind === "scramble") { let k = 0; const words = s.clues[0][1].split(/\s{2,}/).map((wd) => `<div class="scw">${[...wd].map((c) => `<i class="sct" style="--i:${++k}">${esc(c)}</i>`).join("")}</div>`).join(""); return `<div class="scr seen">${words}</div><div class="schints">${s.clues.slice(1, n).map((c) => `<div class="schint"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>`).join("")}</div>`; }
  if (d.kind === "photo") return (d.top ? d.top(x) : `<div class="blurpic ${isCut(x) ? "cut cutpic" : ""} ${x.flag && !x.img ? "flag" : ""}"><img src="${imgOf(x)}" alt=""></div>`) + s.clues.map((c, i) => i < n ? `<div class="clue on ${i === n - 1 ? "new" : ""}"><span class="label">Hint ${i + 1} · ${esc(c[0])}</span><b>${esc(c[1])}</b></div>` : `<div class="clue off"><span class="label">Hint ${i + 1}</span><b>at ${i + 1}/3 of the time</b></div>`).join("");
  const top = d.showImg && imgOf(x) ? `<div class="blurpic ${x.flag && !x.img ? "flag" : ""}" style="width:min(220px,60vw)">${pic(x)}</div>` : "";
  return top + s.clues.map((c, i) => i < n ? `<div class="clue on ${i === n - 1 ? "new" : ""}"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>` : `<div class="clue off"><span class="label">${esc(c[0])}</span><b>?</b></div>`).join("");
}
function answerCard() {
  const s = Q.s, d = curDef(), x = s.r, ans = nameOfAnswer(d, x), facts = (CLUES[x.kind] ? CLUES[x.kind](x) : []).filter((c) => c[0] !== "Initials").slice(0, 4).map((c) => `${esc(c[0])}: ${esc(c[1])}`).join(" · ");
  return `<div class="rcard on"><div class="label">The answer</div><div class="row" style="gap:14px;margin:8px 0;align-items:center">${imgOf(x) ? `<img class="ansimg ${x.logo || x.flag ? "contain" : ""} ${isCut(x) ? "cutpic" : ""}" src="${imgOf(x)}" alt="">` : ""}<div><h3 style="font-size:28px">${wikiLink(curWorld(), ans === x.n ? x : wikiFind(curWorld(), ans) || x, esc(ans))}</h3>${ans !== x.n ? `<div class="fine">${esc(x.n)}</div>` : ""}<div class="fine">${facts}</div></div></div>${credOf(x, d.imgKey)}${x.am ? `<a class="credit" href="${x.am}" target="_blank" rel="noopener">Preview courtesy of Apple Music. Listen to the full song there.</a>` : ""}</div>`;
}
function renderQuiz() {
  const s = Q.s, d = curDef(), duo = s.mode !== "solo", names = s.mode === "online" ? Net.names() : NAMES(), title = s.mix ? `Round ${s.round}: ${esc(WORLDS[curWorld()].name)} · ${esc(d.name)}` : esc(d.name);
  const strip = s.mix ? `<div class="mixstrip" style="margin-bottom:10px">${s.mix.map((m, i) => { const x = items(m.w, (y) => y.img)[0]; return `<span class="${i === s.round - 1 ? "now" : ""} ${s.mixW && s.mixW[i] != null && s.mixW[i] >= 0 ? "w" + s.mixW[i] : ""}">${x ? `<img src="${x.img}" alt="">` : ""}${esc(WORLDS[m.w].name)}</span>`; }).join("")}</div>` : "";
  const head = gamesBar(title) + strip;
  if (s.phase === "done") {
    if (s.mode === "online") rankedDone(s);
    const best = Math.max(...s.scores), winner = duo ? (s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1) : 0;
    $("#room").innerHTML = `<div class="card">${head}${finale({ label: duo ? "Full time" : `${s.wins[0]} of ${s.rounds} right · best streak ${s.best || s.streak}`, verdict: duo ? (winner < 0 ? "A draw." : esc(names[winner]) + " wins!") : best >= 6000 ? "Serious knowledge." : best >= 3500 ? "Solid." : "Keep practising.", players: s.scores.map((sc, k) => ({ name: duo ? names[k] : prof().nick || "You", score: sc, av: duo ? null : avatarHTML(prof().avatar, "lg", prof().nick || "You") })), winner: duo ? winner : null, good: duo ? true : best >= 3500, tiles: duo ? [[`${s.wins[0]}–${s.wins[1]}`, "rounds won"]] : [[`${s.wins[0]}/${s.rounds}`, "right"], [s.best || 0, "best streak"], [best.toLocaleString(), "points"]], buttons: s.daily ? `<button class="btn" id="dShare" type="button">Copy my result</button><button class="btn ghost" data-go="home" type="button">Back home</button>` : `${s.chal ? challengeVerdict(s) : ""}<button class="btn" id="qAgain" type="button">Play again</button>${!duo && !s.mix ? `<button class="btn ghost" id="qChal" type="button">Challenge a friend</button>` : ""}${s.mix ? `<button class="btn ghost" data-go="mix" type="button">New match</button>` : ""}` })}</div>`; return;
  }
  const last = s.round >= s.rounds, hud = `<div class="qhud"><span class="label">Round ${s.round} of ${s.rounds}${duo ? "" : ` · streak ${s.streak}`}</span>${s.scores.map((v, i) => `<span class="num qscore"><small>${duo ? esc(names[i]) : "Score"}</small> <b>${v}</b></span>`).join("")}</div>`;
  if (s.phase === "reveal") { const r = s.result, nm = r.winner == null ? (duo ? "Nobody got it" : r.gave ? "Skipped" : "Not this time") : duo ? esc(names[r.winner]) + " got it" : "You got it"; $("#room").innerHTML = `<div class="card">${head}${hud}<div class="rcard on" style="margin-bottom:10px"><b style="font-size:20px">${nm}${r.winner != null ? `: +${r.pts}` : ""}</b></div>${answerCard()}<div class="row" style="margin-top:14px"><button class="btn" id="${last ? "qFinish" : "qNext"}" type="button">${last ? "See the final score" : "Next round"}</button>${!last && Net.role !== "guest" && !Q.hold ? `<button class="btn ghost" id="qHold" type="button">Pause</button>` : ""}</div>${!last && Net.role !== "guest" && !Q.hold ? `<div class="autometer"><i></i></div>` : ""}</div>`;
    clearTimeout(Q.auto); if (!last && Net.role !== "guest" && !Q.hold) { const rd = s.round; Q.auto = setTimeout(() => { if (Q.s === s && s.phase === "reveal" && s.round === rd && !Q.hold) { const b = $("#qNext"); if (b) b.click(); } }, 4500); }
    return; }
  const bz = s.paused, me = Net.role === "guest" ? 1 : 0;
  const buzzers = duo ? `<div class="buzzers"><button class="buzz p1" id="qB0" type="button" ${s.locked[0] || bz || (Net.role === "guest") ? "disabled" : ""}>${Net.role ? (me === 0 ? "Buzz" : esc(names[0])) : esc(names[0])}<small>${Net.role ? (me === 0 ? "space bar" : "your rival") : "key A"}</small></button><button class="buzz p2" id="qB1" type="button" ${s.locked[1] || bz || Net.role === "host" ? "disabled" : ""}>${Net.role ? (me === 1 ? "Buzz" : esc(names[1])) : esc(names[1])}<small>${Net.role ? (me === 1 ? "space bar" : "your rival") : "key L"}</small></button></div>` : `<div class="buzzers"><button class="buzz p1 wide" id="qB0" type="button" ${bz ? "disabled" : ""}>BUZZ<small>space bar</small></button></div>`;
  const mine = !Net.role || s.buzzed === me;
  const giveUp = !bz && !(Net.role === "guest") ? `<div class="row" style="justify-content:center;margin-top:8px"><button class="btn ghost" id="qGive" type="button">${duo ? "Skip this one" : "Give up"}</button></div>` : "";
  const answer = bz ? `<div class="answerbox"><div class="row"><b>${duo ? esc(names[s.buzzed]) : "Your answer"}</b><span class="num fine" id="qClock">${Math.ceil(s.answerLeft)}s</span></div>${mine ? `<div class="row"><input id="qIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type your answer" aria-label="Your answer"><button class="btn" id="qGuess" type="button">Guess</button></div><div id="qSug" class="sugs"></div>` : `<div class="fine">Your rival is answering…</div>`}</div>` : "";
  $("#room").innerHTML = `<div class="card">${head}${hud}<div class="meter"><i id="qMeter" style="width:${(100 * (1 - s.elapsed / s.total)).toFixed(1)}%"></i></div><div class="row" style="justify-content:space-between"><span class="fine">Worth <b class="num" id="qWorth">${worth()}</b> points now</span><span class="fine">${esc(WORLDS[curWorld()].name)}</span></div><div id="qClues" class="clues">${cluesHTML()}</div>${answer}${buzzers}${giveUp}</div>`;
  if (bz && mine) focusIn();
}
function paintSuggestions() {
  const box = $("#qSug"), q = ($("#qIn") || {}).value || ""; if (!box) return;
  if ($("#t3Go") && T3.s) { box.innerHTML = smartSuggest(q, T3.s.pool, (x) => x.n).map((x) => `<button type="button" class="sug" data-t3sug="${esc(x.n)}">${esc(x.n)}</button>`).join(""); return; }
  const d = curDef(); if (d.kind === "scramble") { box.innerHTML = ""; return; }
  const list = smartSuggest(q, suggestPool(d, curWorld()), (x) => x.n); box.innerHTML = list.map((x) => `<button type="button" class="sug" data-sug="${esc(x.n)}">${x.img || x.logo || x.flag ? `<img src="${imgOf(x)}" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle">` : ""}${esc(x.n)}</button>`).join("");
}

/* ================= higher or lower (ballknowledge's Higher or lower / Market value, with photos) ================= */
const H = { s: null };
function newHol(mode) { H.s = { w: S.world, game: S.game, mode, streak: 0, turn: 0, scores: [0, 0], n: [0, 0], phase: "pick" }; nextHol(); }
function holGapOK(g, a, b) {
  const x = g.stat(a), y = g.stat(b); if (x === y) return false;
  const gap = g.gaps ? Math.abs(x - y) : Math.max(x, y) / Math.max(1, Math.min(x, y)), t = g.gaps || [2.5, 1.5, 1.15];
  return S.diff === "easy" ? gap >= t[0] : S.diff === "medium" ? gap >= t[1] : S.diff === "hard" ? gap >= t[2] && gap < t[0] : gap < t[1];
}
function nextHol() { const s = H.s, g = gameOf(s.w, s.game), pool = byFame(g.pool()); let a, b;
  if (s.w === "kpop") { s.pk = s.pk || Pick.ctx(); a = Pick.choose(pool, s.pk); const c = pool.filter((y) => y !== a && g.stat(y) !== g.stat(a) && holGapOK(g, a, y)); b = Pick.choose(c.length ? c : pool.filter((y) => y !== a && g.stat(y) !== g.stat(a)), s.pk); Pick.record(a, s.pk); Pick.record(b, s.pk); s.a = a; s.b = b; s.phase = "pick"; s.pick = null; renderHol(); return; } for (let k = 0; k < 400; k++) { [a, b] = shuffle(pool).slice(0, 2); if (a && b && holGapOK(g, a, b)) break; } if (!a || !b || g.stat(a) === g.stat(b)) for (let k = 0; k < 60; k++) { [a, b] = shuffle(pool).slice(0, 2); if (g.stat(a) !== g.stat(b)) break; } s.a = a; s.b = b; s.phase = "pick"; s.pick = null; renderHol(); }
function renderHol() {
  const s = H.s, g = gameOf(s.w, s.game), duo = s.mode === "duo", names = NAMES(), done = s.phase === "done";
  if (done) { const winner = s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1; $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${finale({ label: duo ? "Full time" : `Run over`, verdict: duo ? (winner < 0 ? "A draw." : esc(names[winner]) + " wins!") : s.streak >= 10 ? "Unreal." : s.streak >= 5 ? "Strong run." : "Go again.", players: duo ? [0, 1].map((k) => ({ name: names[k], score: s.scores[k] })) : [{ name: prof().nick || "You", score: s.streak, av: avatarHTML(prof().avatar, "lg", prof().nick || "You") }], winner: duo ? winner : null, good: duo || s.streak >= 5, tiles: duo ? [] : [[s.streak, "streak"]], buttons: `<button class="btn" id="hAgain" type="button">Play again</button>` })}</div>`; return; }
  const side = (x, k) => { const rev = s.phase === "reveal", ok = rev && ((g.higher ? g.stat(x) > g.stat(k === "a" ? s.b : s.a) : g.stat(x) < g.stat(k === "a" ? s.b : s.a))); return `<button type="button" class="holside ${rev ? (ok ? "win" : "lose") : ""}" data-hol="${k}" ${rev ? "disabled" : ""}>${imgOf(x) ? `<img src="${imgOf(x)}" alt="" class="${isCut(x) ? "cutpic" : ""}" style="${(x.flag || x.logo) && !x.img && !x.cover ? "object-fit:contain;padding:30px;background:#0b1a22" : ""}">` : `<span class="hph">${esc(String(x.n || "?")[0].toUpperCase())}</span>`}<b>${esc(x.n)}</b><span class="hv num" data-v="${g.stat(x)}">${rev ? esc(g.show(g.stat(x))) : ""}</span></button>`; };
  const hud = duo ? `<div class="qhud"><span class="label">${esc(names[s.turn])}'s turn · ${s.n[0] + s.n[1] + 1} of 10</span>${[0, 1].map((i) => `<span class="num qscore"><small>${esc(names[i])}</small> <b>${s.scores[i]}</b></span>`).join("")}</div>` : `<div class="qhud"><span class="label">Streak ${s.streak}</span></div>`;
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${hud}<h3 style="text-align:center;font-family:var(--display);font-size:clamp(26px,4vw,40px);margin:6px 0 12px">${esc(g.ask)}</h3><div class="holpair">${side(s.a, "a")}${side(s.b, "b")}<div class="holor">OR</div></div>${s.phase === "reveal" ? `<div class="row" style="margin-top:14px;justify-content:space-between"><span class="fine">${credOf(s.a)}${credOf(s.b)}</span><button class="btn" id="hNext" type="button">${s.over ? "See the result" : "Next"}</button></div>` : ""}</div>`;
}
function answerHol(k) {
  const s = H.s, g = gameOf(s.w, s.game); if (s.phase !== "pick") return; const x = k === "a" ? s.a : s.b, y = k === "a" ? s.b : s.a, ok = g.higher ? g.stat(x) > g.stat(y) : g.stat(x) < g.stat(y);
  s.phase = "reveal"; flashEdge(ok);
  if (s.mode === "solo") { if (ok) { s.streak++; FX.streak(s.streak); Snd.right(); addXP(8, s.w); collect(s.w, x); Mascot.react(s.streak % 3 === 0 ? "streak" : "hit"); if (s.game === "newer" || s.game === "fandom") { const p = prof(); p.debutOK = (p.debutOK || 0) + 1; saveProf(); if (p.debutOK >= 10) award("kpop_debut"); } if (s.game === "value") { const p = prof(); p.valOK = (p.valOK || 0) + 1; saveProf(); if (p.valOK >= 10) award("value10"); } } else { s.over = true; Snd.wrong(); FX.over(); Mascot.react("over"); const kk = s.w + ":" + s.game, p = prof(); if (!p.best[kk] || s.streak > p.best[kk].streak) { p.best[kk] = { score: s.streak, streak: s.streak }; saveProf(); } } }
  else { if (ok) { s.scores[s.turn]++; Snd.right(); } else Snd.wrong(); s.n[s.turn]++; s.over = s.n[0] + s.n[1] >= 10; }
  renderHol(); document.querySelectorAll(".holside .hv").forEach((el) => countTo(el, +el.dataset.v, g.show));
}
function countTo(el, to, show) { if (REDUCED) return; const from = Math.abs(to) > 3000 ? 0 : to - 30, t0 = performance.now(); (function st(t) { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); el.textContent = show(Math.round(from + (to - from) * e)); if (k < 1) requestAnimationFrame(st); })(t0); }

/* ================= cross-category match: pick 2 worlds each, ban 1, plus a wildcard; one round per world ================= */
const MX = { s: null };
function renderMix() {
  const s = MX.s, names = NAMES();
  if (!s || s.stage === "setup") {
    MX.s = { stage: "pick", turn: 0, picks: [[], []], bans: [null, null] };
    $("#mixRoom").innerHTML = `<div class="card"><div class="label">Cross-category match</div><h2 style="font-size:clamp(30px,5vw,48px);font-family:var(--display)">Your world vs theirs</h2><p class="sub">Two players on one device. Each of you picks three categories you know best, then bans one of the other's picks. A wildcard world joins, and every round is a real game from that world (a buzzer race: A for ${esc(names[0])}, L for ${esc(names[1])}).</p><div class="row" style="margin-top:12px;gap:10px;flex-wrap:wrap"><label class="fine">Player 1 <input id="n0" value="${esc(names[0])}" maxlength="14" style="width:120px"></label><label class="fine">Player 2 <input id="n1" value="${esc(names[1])}" maxlength="14" style="width:120px"></label><button class="btn" id="mxStart" type="button">Start the draft</button></div></div>`;
    MX.s.stage = "names"; return;
  }
  const head = `<div class="drafthead"><div class="draftp">${avatarHTML(prof().avatar, "md", names[0])}<b>${esc(names[0])}</b></div><b style="font-family:var(--display);font-size:30px">VS</b><div class="draftp right">${avatarHTML("", "md", names[1])}<b>${esc(names[1])}</b></div></div>`;
  const tile = (w, extra, act) => { const x = shuffle(items(w, (y) => y.img).slice(0, 12))[0]; const who = s.picks[0].includes(w) ? 0 : s.picks[1].includes(w) ? 1 : -1, banned = s.bans.includes(w); return `<button type="button" class="wpick ${who >= 0 ? "p" + who : ""} ${banned ? "ban" : ""}" style="--wc:${WVARS[w][4]}" ${act ? `data-mx="${act}" data-w="${w}"` : "disabled"}>${x ? `<img src="${x.img}" alt="" class="${isCut(x) ? "cutpic" : ""}">` : ""}${who >= 0 ? `<span class="tagp">${esc(names[who])}</span>` : ""}${banned ? '<span class="stampb"><i>BANNED</i></span>' : ""}<b>${esc(WORLDS[w].name)}</b>${extra || ""}</button>`; };
  if (s.stage === "pick") { const free = WORLD_IDS.filter((w) => !s.picks[0].includes(w) && !s.picks[1].includes(w)); $("#mixRoom").innerHTML = `<div class="card">${head}<h3 style="margin:16px 0 8px;font-family:var(--display);font-size:26px">${esc(names[s.turn])}, pick a world (${s.picks[s.turn].length + 1} of 3)</h3><div class="pickgrid">${WORLD_IDS.map((w) => tile(w, "", free.includes(w) ? "pick" : null)).join("")}</div></div>`; return; }
  if (s.stage === "ban") { const t = s.bans[0] == null ? 0 : 1, theirs = s.picks[1 - t]; $("#mixRoom").innerHTML = `<div class="card">${head}<h3 style="margin:16px 0 8px;font-family:var(--display);font-size:26px">${esc(names[t])}, ban one of ${esc(names[1 - t])}'s worlds</h3><div class="pickgrid">${WORLD_IDS.filter((w) => s.picks[0].includes(w) || s.picks[1].includes(w)).map((w) => tile(w, "", theirs.includes(w) && !s.bans.includes(w) ? "ban" : null)).join("")}</div></div>`; return; }
}
function mixPick(w) { const s = MX.s; s.picks[s.turn].push(w); Snd.lock(); if (s.picks[0].length + s.picks[1].length >= Math.min(6, WORLD_IDS.length - 1)) { s.stage = "ban"; } else s.turn = 1 - s.turn; renderMix(); }
function mixBan(w) { const s = MX.s; const t = s.bans[0] == null ? 0 : 1; s.bans[t] = w; Snd.wrong(); if (s.bans[1] == null) { renderMix(); return; }
  const keep = [...s.picks[0], ...s.picks[1]].filter((x) => !s.bans.includes(x)), rest = WORLD_IDS.filter((x) => !s.picks[0].includes(x) && !s.picks[1].includes(x)), wild = rest.length ? rnd(rest) : rnd(keep);
  const worlds = [...keep, ...keep.slice(0, Math.max(0, 4 - keep.length)), wild].slice(0, 5);
  const mix = worlds.map((x) => ({ w: x, g: rnd(GAMES[x].filter((g) => g.kind === "clue" || g.kind === "blur" || g.kind === "photo")).id }));
  renderMix(); setTimeout(() => { toast(`<b>Wildcard</b><br>${esc(WORLDS[wild].name)} joins the match`, "ach"); loadingScreen(wild, () => { S.world = mix[0].w; show("league"); renderWorldFor(mix[0].w); Q.s = null; newQuiz(mix[0].w, mix[0].g, "duo", mix); Q.s.mixW = []; }); }, 700); }
function renderWorldFor(w) { S.world = w; renderWorld(); $("#crumbs").innerHTML = `<button class="back" data-go="mix" type="button">← Cross-category match</button>`; }
function mixFinished(s) { const p = prof(); p.mix.played++; award("mix_first"); if (s.scores[0] > s.scores[1]) { p.mix.won++; award("mix_win"); if (s.wins[1] === 0) award("mix_sweep"); } saveProf(); }

/* ================= loading screens: one collection per world, Common to Legendary, plus a secret ================= */
const SPLASH_TIPS = ["Buzz early: points fall from 1,000 toward 100 as the clues arrive.", "A wrong guess costs 150, so buzz when you are sure.", "Get the same answer right three times and its card joins your Dex.", "Every world has its own loading screens. Rare ones are worth hunting.", "In a cross-category match, ban the world your rival knows best.", "Elite counts double. Easy counts 0.6x.", "Any card in your Dex can be your profile picture."];
function splashCatalog(w) {
  const list = byFameAll(items(w, (x) => x.img)), n = list.length, out = [];
  list.slice(0, Math.min(24, n)).forEach((x, i) => out.push({ id: `${w}:${x.id}`, w, x, name: x.n, rar: i < 6 ? "Uncommon" : "Common" }));
  out.push({ id: `${w}:rare`, w, name: { kpop: "Concert night", geography: "Spinning globe", history: "Sands of time", food: "Open kitchen", football: "Floodlights" }[w], rar: "Rare" });
  out.push({ id: `${w}:leg`, w, name: { kpop: "Encore", geography: "Around the world", history: "The golden age", food: "Michelin night", football: "Cup final" }[w] || "Grand finale", rar: "Legendary" });
  if (list.length >= 6) out.push({ id: `${w}:hall`, w, name: "Hall of fame", rar: "Legendary", collage: list.slice(0, 7) });
  if (w === "kpop") {   // the debut stage: a newer group's whole line-up, gold-framed
    const fresh = items("kpop", (g) => g.kind === "group" && g.gen >= 4).filter((g) => rosterOf("kpop", g).filter((m) => m.img).length >= 4);
    fresh.forEach((g) => out.push({ id: `kpop:stage:${g.id}`, w, name: `${g.n} · Debut stage`, rar: "Legendary", collage: rosterOf("kpop", g).filter((m) => m.img).slice(0, 8), g }));
    items("kpop", (g) => g.kind === "group" && g.img).slice(0, 30).forEach((g) => out.push({ id: `kpop:${g.id}`, w, x: g, name: g.n, rar: "Uncommon" }));
  }
  return out;
}
const byFameAll = (l) => l.slice().sort((a, b) => (b.fame || 0) - (a.fame || 0));
function sceneHTML(w, legendary) {
  const col = WVARS[w][4], flags = items("geography", (x) => x.flag).slice(0, 6);
  if (w === "kpop") return `<div class="sc-stage" style="--sc:${col}">${[10, 40, 70].map((l, i) => `<div class="beam" style="left:${l}%;animation-delay:${-i * 1.3}s"></div>`).join("")}${Array.from({ length: 14 }, (_, i) => `<div class="stick" style="left:${4 + i * 7}%;animation-delay:${(i % 5) * 0.15}s;--sc:${legendary && i % 2 ? "#ffd166" : col}"></div>`).join("")}</div>`;
  if (w === "geography") return `<div class="sc-stage" style="display:grid;place-items:center"><div class="sc-globe"><i></i></div>${legendary ? `<div class="sc-flags">${flags.map((f, i) => `<img src="${f.flag}" style="left:39%;top:44%;animation-delay:${-i * 1.33}s" alt="">`).join("")}</div>` : ""}</div>`;
  if (w === "history") return `<div class="sc-stage" style="display:grid;place-items:center">${MASCOT_SVG.tock(legendary ? "wow" : "calm").replace('class="msvg"', 'class="msvg sc-sand"')}</div>`;
  if (w === "food") return `<div class="sc-stage" style="display:grid;place-items:center">${MASCOT_SVG.dumpling(legendary ? "wow" : "happy").replace('class="msvg"', 'class="msvg sc-sand"')}</div>`;
  return `<div class="sc-stage" style="--sc:#fff7d6">${[10, 70].map((l, i) => `<div class="beam" style="left:${l}%;animation-delay:${-i * 2}s"></div>`).join("")}${MASCOT_SVG.boot(legendary ? "wow" : "happy").replace('class="msvg"', 'class="msvg sc-sand" style="position:absolute;bottom:4%;left:27%"')}</div>`;
}
/* Secret: one hand-picked photo on a velvet stage, a spotlight and falling glitter (picture: Wikimedia Commons, credited) */
const SECRET = { img: "img/special/center.webp", by: "sublimitas viii (cropped)", lic: "CC BY-SA 4.0", page: "https://commons.wikimedia.org/wiki/File:20260827_HEARTS2HEARTS_Ian_@_K-World_Dream_Awards_(2).jpg" };
function secretHTML() { return `<div class="sp-secret"><div class="ss-spot"></div>${Array.from({ length: 26 }, (_, i) => `<i class="ss-glit" style="--x:${(i * 37) % 100}%;--d:${(i % 7) * 0.45}s;--s:${0.6 + (i % 4) * 0.3}"></i>`).join("")}<div class="ss-frame"><img src="${SECRET.img}" alt=""><div class="ss-cap">you found the center</div></div>${SECRET.by ? `<div class="ss-cred">${esc(SECRET.by)} · ${esc(SECRET.lic)}</div>` : ""}</div>`; }
/* Legendary: a gold-framed collage on rotating light rays with a holographic sweep */
function legendHTML(c) { return `<div class="sp-legend"><div class="lg-rays"></div><div class="lg-grid n${Math.min(c.collage.length, 8)}">${c.collage.map((x, i) => `<div class="lg-cell" style="--i:${i}"><img src="${imgOf(x)}" alt=""><small>${esc(x.n)}</small></div>`).join("")}</div><div class="lg-holo"></div><div class="lg-title">${esc(c.name.toUpperCase())}</div></div>`; }
function loadingScreen(w, done) {
  const sp = $("#splash"); if (!sp || !WORLDS[w]) { done && done(); return; }
  const cat = splashCatalog(w), r = Math.random(); let cur;
  const legs = cat.filter((c) => c.rar === "Legendary"), stage = legs.filter((c) => c.g), h2h = stage.filter((c) => /hearts2hearts/i.test(c.g.n));
  if (r < 0.004) cur = { id: "secret:notebook", name: "The Notebook", rar: "Secret", w };
  else if (r < 0.014 && w === "kpop" && SECRET.img) cur = { id: "secret:center", name: "Center stage", rar: "Secret", w };
  else if (r < 0.06) cur = stage.length && Math.random() < 0.5 ? (h2h.length && Math.random() < 0.35 ? h2h[0] : rnd(stage)) : rnd(legs.filter((c) => !c.g));
  else if (r < 0.2) cur = cat.find((c) => c.rar === "Rare");
  else cur = rnd(cat.filter((c) => c.rar === (r < 0.45 ? "Uncommon" : "Common"))) || cat[0];
  const art = sp.querySelector(".sp-art");
  if (cur.id === "secret:notebook") art.innerHTML = `<div class="sp-notebook"><div class="nb-paper"><div class="nb-title">My worlds</div><div class="nb-sub">a notebook, written by hand</div><ol>${WORLD_IDS.map((x, i) => `<li style="--i:${i}"><b>${i + 1}. ${esc(WORLDS[x].name)}</b><span>${(prof().worlds[x] || {}).xp || 0} XP</span></li>`).join("")}</ol><div class="nb-note">Before the games, there was a notebook full of things worth knowing.</div></div></div>`;
  else if (cur.rar === "Secret") art.innerHTML = secretHTML();
  else if (cur.collage) art.innerHTML = legendHTML(cur);
  else if (cur.x) art.innerHTML = `<div class="sp-poster pal-${hash(cur.name) % 6} star"><div class="sp-speed"></div><div class="sp-bgname">${esc(cur.name.toUpperCase())}</div><img class="sp-cutimg ${isCut(cur.x) ? "cut" : ""}" src="${cur.x.img}" alt="${esc(cur.name)}"></div>`;
  else art.innerHTML = `<div class="sp-poster pal-${hash(w) % 6}"><div class="sp-speed"></div><div class="sp-bgname">${esc(WORLDS[w].name.toUpperCase())}</div>${sceneHTML(w, cur.rar === "Legendary")}</div>`;
  const p = prof(), isNew = !p.splashes[cur.id]; p.splashes[cur.id] = 1; saveProf();
  const got = Object.keys(p.splashes).length; if (got >= 5) award("splash5"); if (cur.rar === "Rare") award("splash_rare"); if (cur.rar === "Legendary") award("splash_leg"); if (cur.rar === "Secret") award("secret");
  $("#spTip").textContent = rnd(SPLASH_TIPS); $("#spName").textContent = `${WORLDS[w].name} · ${cur.name}`; const rr = $("#spRar"); rr.textContent = cur.rar; rr.className = "sp-rar r-" + cur.rar.toLowerCase(); $("#spNew").textContent = isNew ? `New! ${got} collected` : "";
  sp.className = "splash k-" + ({ Common: "star", Uncommon: "legend", Rare: "rare", Legendary: "legendary", Secret: "secret" }[cur.rar]) + (cur.id === "secret:center" ? " ss-on" : "") + (cur.collage ? " lg-on" : ""); sp.hidden = false; sp.classList.remove("out");
  const end = () => { sp.classList.add("out"); setTimeout(() => { sp.hidden = true; }, 450); done && done(); };
  clearTimeout(loadingScreen.t); loadingScreen.t = setTimeout(end, cur.rar === "Secret" || cur.rar === "Legendary" ? 3800 : 2000); $("#spSkip").onclick = () => { clearTimeout(loadingScreen.t); end(); };
}

/* ================= collection: Dex + loading screens ================= */
function renderCollection() {
  const p = prof(), rc = { Common: "#9aa3b2", Uncommon: "#4ade80", Rare: "#38bdf8", Legendary: "#fbbf24", Secret: "#ff6b9d" };
  const screens = WORLD_IDS.map((w) => { const cat = splashCatalog(w), have = cat.filter((c) => p.splashes[c.id]).length; return `<h3 class="sec" style="font-size:22px">${esc(WORLDS[w].name)} <span class="fine">${have} of ${cat.length}</span></h3><div class="coll">${cat.map((c) => { const ok = !!p.splashes[c.id]; return `<div class="lscard ${ok ? "" : "locked"}" style="--rc:${rc[c.rar]}">${c.collage ? `<div class="scene lgmini">${c.collage.slice(0, 4).map((x) => `<img src="${imgOf(x)}" alt="">`).join("")}</div>` : c.x ? `<img src="${c.x.img}" alt="" class="${isCut(c.x) ? "cutpic" : ""}">` : `<div class="scene" style="background:${WVARS[w][0]}">${sceneHTML(w, c.rar === "Legendary")}</div>`}<small>${c.rar}</small><b>${ok ? esc(c.name) : "???"}</b></div>`; }).join("")}</div>`; }).join("");
  const secs = [p.splashes["secret:notebook"] ? `<div class="lscard" style="--rc:${rc.Secret};max-width:180px"><div class="scene" style="background:#f4ecd6"></div><small>Secret</small><b style="color:#222">The Notebook</b></div>` : "", p.splashes["secret:center"] ? `<div class="lscard" style="--rc:${rc.Secret};max-width:180px"><img src="${SECRET.img}" alt=""><small>Secret</small><b>Center stage</b></div>` : ""].filter(Boolean);
  const secret = `<div class="coll">${secs.join("")}</div>` + (secs.length < 2 ? `<p class="fine">${secs.length ? "There is one more secret screen." : "There are secret screens. They are not listed until you find them."}</p>` : "");
  const dex = WORLD_IDS.map((w) => { const all = byFameAll(items(w, imgOf)).slice(0, 60); return `<h3 class="sec" style="font-size:22px">${esc(WORLDS[w].name)} <span class="fine">${all.filter((x) => dexHas(w + ":" + x.id)).length} of ${items(w, imgOf).length}</span></h3><div class="coll">${all.map((x) => { const ok = dexHas(w + ":" + x.id), n = p.dex[w + ":" + x.id] || 0; return `<div class="lscard ${ok ? "" : "locked"}" ${ok ? `data-wiki="${esc(wikiKey(w, x))}" role="button" tabindex="0"` : ""} style="--rc:${ok ? WVARS[w][4] : "#3a3a46"}">${pic(x)}<small>${ok ? "In your Dex" : `${n}/3 right`}</small><b>${ok ? esc(x.n) : "???"}</b></div>`; }).join("")}</div>`; }).join("");
  $("#collRoom").innerHTML = `<div class="hero"><h1><em>Collection</em></h1><p>Get an answer right three times and its card joins your Dex. Every world also hides loading screens, from Common up to Legendary, and one secret.</p></div><div class="scope" style="margin-bottom:12px"><button type="button" class="chip" data-coll="dex" aria-pressed="${S.coll !== "screens"}">Dex</button><button type="button" class="chip" data-coll="screens" aria-pressed="${S.coll === "screens"}">Loading screens</button></div>${S.coll === "screens" ? screens + secret : dex}`;
}

/* ================= profile ================= */
function paintProfileBtn() { const p = prof(), b = $("#profileBtn"); if (b) b.innerHTML = `${avatarHTML(p.avatar, "sm", p.nick || "You")}<span>${esc(levelOf(p.xp).name)}${typeof Cloud !== "undefined" && Cloud.user ? " ·☁" : ""}</span>`; }
/* free from the start: Hearts2Hearts (Ian first) and the most famous face of every category; everything else unlocks through the Dex */
const STARTER = (k) => { const [w, id] = k.split(":"), x = items(w).find((y) => y.id === id); return !!x && ((w === "kpop" && (x.groups || []).includes("Hearts2Hearts")) || byFameAll(items(w, imgOf))[0] === x); };
function renderProfile() {
  const p = prof(), lv = levelOf(p.xp), pct = lv.next ? Math.round((100 * (p.xp - lv.from)) / (lv.next - lv.from)) : 100;
  const ian = items("kpop", (x) => x.kind === "idol" && x.n === "Ian" && (x.groups || []).includes("Hearts2Hearts") && x.img), h2h = items("kpop", (x) => x.kind === "idol" && (x.groups || []).includes("Hearts2Hearts") && x.img && x.n !== "Ian");
  const avs = [...ian, ...h2h].map((x) => ({ w: "kpop", x })).concat(WORLD_IDS.flatMap((w) => byFameAll(items(w, imgOf)).slice(0, 14).map((x) => ({ w, x })))).filter((v, i, A) => A.findIndex((y) => y.x === v.x) === i);
  $("#profRoom").innerHTML = accountCardHTML() + friendsCardHTML() + `<div class="card pfcard" style="${bannerCSS(p.banner)}"><div class="pfhead" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${avatarHTML(p.avatar, "xl", p.nick || "You")}<div><div class="label">Level ${lv.i + 1}</div><h2 style="font-size:34px;font-family:var(--display)">${esc(p.nick || "You")}</h2>${p.title && achOf(p.title) ? `<div class="pftitle">${esc(achOf(p.title)[1])}</div>` : ""}<div class="fine">${esc(lv.name)} · ${p.xp} XP${lv.next ? ` · ${lv.next - p.xp} to ${LEVELS[lv.i + 1][0]}` : ""}</div><div class="meter" style="margin-top:8px;max-width:320px"><i style="width:${pct}%"></i></div></div>${showcaseHTML(p)}<label class="fine" style="margin-left:auto">Nickname <input id="nick" value="${esc(p.nick)}" maxlength="16" style="width:150px"></label></div></div>
  ${BadgeUI.html()}
  ${flairHTML(p)}
  <div class="card"><div class="label">Rank in every world</div><div class="wrank" style="margin-top:8px">${WORLD_IDS.map((w) => { const x = (p.worlds[w] || {}).xp || 0; return `<div style="--wc:${WVARS[w][4]}"><span class="fine">${esc(WORLDS[w].name)}</span><b>${rkIcon(wRank(x))} ${wRank(x)}</b><span class="fine num">${x} XP · ${(p.worlds[w] || {}).plays || 0} games</span></div>`; }).join("")}</div><div class="fine" style="margin-top:8px">Cross-category matches: ${p.mix.played} played, ${p.mix.won} won.</div></div>
  <div class="card"><div class="label">Profile picture</div><p class="fine">Anyone in your Dex can be your picture. Locked ones unlock when you get them right three times.</p><div class="avpick" style="margin-top:8px">${avs.map(({ w, x }) => { const k = w + ":" + x.id, ok = dexHas(k) || STARTER(k); return `<button type="button" class="${p.avatar === k ? "on" : ""} ${ok ? "" : "locked"}" ${ok ? `data-av="${k}"` : `title="Get ${esc(x.n)} right 3 times"`}><img src="${imgOf(x)}" alt="" class="${isCut(x) ? "cutpic" : ""}">${ok ? esc(x.n) : "Locked"}</button>`; }).join("")}</div></div>
  <div class="card"><div class="label">Achievements ${Object.keys(p.ach).length} of ${ACH.length}</div><div class="achgrid" style="margin-top:8px">${ACH.map(([id, n, d, t, ic]) => `<div class="achv ${p.ach[id] ? "on" : ""}" style="--tc:${TIERS[t][1]}"><svg class=ic><use href=#i-${ic}></use></svg><b>${esc(n)}</b><span class="fine">${esc(d)}</span><span class="fine" style="color:${TIERS[t][1]}">${TIERS[t][0]}</span></div>`).join("")}</div></div>`;
}
function renderSettings() {
  const g = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  $("#setRoom").innerHTML = `<div class="hero"><h1><em>Settings</em></h1></div><div class="card"><div class="label">Sound</div><div class="row" style="gap:8px;margin-top:8px">${["Off", "Soft", "Full"].map((n, i) => `<button class="chip" data-snd="${i}" aria-pressed="${Snd.level === i}">${n}</button>`).join("")}</div><div class="label" style="margin-top:14px">Lobby music</div><div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-mus="1" aria-pressed="${!!Snd.music}">On</button><button class="chip" data-mus="0" aria-pressed="${!Snd.music}">Off</button></div><p class="fine">Every world has its own music, played live in your browser.</p><div class="label" style="margin-top:14px">Sidekick</div><div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-mas="on" aria-pressed="${g("gp_mascot", "on") === "on"}">On</button><button class="chip" data-mas="off" aria-pressed="${g("gp_mascot", "on") === "off"}">Off</button><button class="chip" data-voice="${g("gp_voice", "1") === "1" ? "0" : "1"}" aria-pressed="${g("gp_voice", "1") === "1"}">Sidekick voices</button><button class="chip" data-hear="1">Hear your sidekick</button></div></div><div class="card"><div class="label">Your sidekick in each category</div><p class="fine">The sidekick cheers you on, reacts to your answers and follows you into that category.</p>${WORLD_IDS.map(kickRow).join("")}</div><div class="card"><div class="label">Install as an app</div>${installHTML()}</div><div class="card"><div class="label">Photo credits</div><p class="fine">Every picture comes with its author and licence on the answer card. K-pop, geography, history and food pictures are from Wikimedia Commons (free licences or public domain), facts from Wikidata (CC0). Football data and crests come from ballknowledge (Transfermarkt CC0 data; crests and player photos shown only to identify them).</p></div>`;
}

/* ================= wiki: every group, idol, song, country, player... with its facts and links; any name with data-wiki opens it ================= */
const WIKI_SKIP = new Set(["lineup", "trivia"]);
const wikiKey = (w, x) => `${w}:${x.id}`;
const wikiLink = (w, x, label) => (x && x.id ? `<a class="wlink" href="#wiki" data-wiki="${esc(wikiKey(w, x))}">${label}</a>` : label);
const wikiFind = (w, n) => items(w, (x) => !WIKI_SKIP.has(x.kind) && qnorm(x.n) === qnorm(n))[0];
const KIND_NAME = { idol: "Idol", group: "Group", song: "Song", player: "Footballer", club: "Club", bplayer: "NBA player", team: "NBA team", cplayer: "Chess player", opening: "Chess opening", country: "Country", person: "Historical figure", dish: "Dish", anime: "Anime", event: "Event", invention: "Invention", oldstate: "Former country", landmark: "Landmark", character: "Anime character" };
let WQ = { q: "", w: "all" };
function renderWiki() {
  $("#wikiRoom").innerHTML = `<div class="hero"><h1><em>Wiki</em></h1><p class="sub">Every group, idol, song, country and player in the games. Tap a name anywhere on the site to land here.</p></div><div class="card"><input id="wikiQ" class="wikiq" placeholder="Search: Hearts2Hearts, Wonyoung, Japan, Messi…" value="${esc(WQ.q)}" autocomplete="off" spellcheck="false" aria-label="Search the wiki"><div class="diffbar" style="margin-top:10px">${["all", ...WORLD_IDS.filter((w) => w !== "general")].map((w) => `<button type="button" class="chip" data-wikiw="${w}" aria-pressed="${WQ.w === w}">${w === "all" ? "Everything" : esc(WORLDS[w].name)}</button>`).join("")}</div></div><div id="wikiRes" class="wikigrid"></div>`;
  wikiResults(); setTimeout(() => { const i = $("#wikiQ"); if (i && matchMedia("(pointer:fine)").matches) i.focus({ preventScroll: true }); }, 0);
}
function wikiResults() {
  const q = qnorm(WQ.q), ws = WQ.w === "all" ? WORLD_IDS : [WQ.w], out = [];
  ws.forEach((w) => items(w, (x) => !WIKI_SKIP.has(x.kind) && x.n).forEach((x) => {
    let sc = -1; if (!q) sc = imgOf(x) ? (x.fame || 0) : -1; else { const n = qnorm(x.n), f = qnorm(x.full || ""); sc = n === q ? 3e6 : n.startsWith(q) ? 2e6 : n.includes(q) || (f && f.includes(q)) ? 1e6 : -1; if (sc > 0) sc += (x.fame || 0) + (imgOf(x) ? 500 : 0); }
    if (sc >= 0) out.push([sc, w, x]); }));
  out.sort((a, b) => b[0] - a[0]);
  const box = $("#wikiRes"); if (!box) return;
  box.innerHTML = out.length ? out.slice(0, 60).map(([, w, x], i) => `<button type="button" class="wcard" data-wiki="${esc(wikiKey(w, x))}" style="--d:${Math.min(i, 20) * 25}ms;${wvars(w)}">${imgOf(x) ? pic(x) : `<span class="wph">${esc(x.n[0])}</span>`}<b>${esc(x.n)}</b><small>${esc(KIND_NAME[x.kind] || WORLDS[w].name)} · ${esc(WORLDS[w].name)}</small></button>`).join("") : `<p class="fine">Nothing found for “${esc(WQ.q)}”.</p>`;
}
function wikiChips(w, list) { return `<div class="wchips">${list.map((x) => `<button type="button" class="wchip" data-wiki="${esc(wikiKey(w, x))}">${imgOf(x) ? `<img src="${imgOf(x)}" alt="">` : ""}<span>${esc(x.n)}</span></button>`).join("")}</div>`; }
function openWiki(key) {
  const i = key.indexOf(":"), w = key.slice(0, i), id = key.slice(i + 1), x = items(w).find((y) => y.id === id); if (!x) return;
  const facts = (CLUES[x.kind] ? CLUES[x.kind](x) : []).filter((c) => !/Initials|Starts with|Letters|Question|Real name/.test(c[0]));
  let extra = "";
  if (x.kind === "group") {
    const mem = rosterOf("kpop", x), songs = items("kpop", (s) => s.kind === "song" && s.by === x.n).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
    if (x.views) facts.push(["Wikipedia views", fmt(x.views) + " in the last year"]);
    if (mem.length) extra += `<div class="label">Members</div>${wikiChips(w, mem)}`;
    if (songs.length) extra += `<div class="label">Songs to play</div>${wikiChips(w, songs.slice(0, 18))}`;
    if (x.units && x.units.length) extra += `<div class="label">Units and duos</div><div class="disco">${x.units.map((u) => `<div class="dr"><span class="dd num">${u.debut || ""}</span><b>${esc(u.n)}</b><small>${esc(u.members.join(", "))}</small></div>`).join("")}</div>`;
    if (x.colors && x.colors.length) extra += `<div class="label">Official colours</div><div class="swatches sm">${x.colors.map((c) => `<i style="background:${c.hex}"><small>${esc(c.name)}</small></i>`).join("")}</div>`;
    if (x.discography && x.discography.length) { const real = x.discography.filter((r) => ["album", "ep", "single"].includes(r.ty)); extra += `<div class="label">Full discography · ${real.length} releases${x.discography_source ? ` · <a href="https://${x.discography_source}" target="_blank" rel="noopener">MusicBrainz</a>` : ""}</div><div class="disco">${real.map((r) => `<div class="dr ${r.ty}"><span class="dd num">${esc(r.d.slice(0, 7))}</span><b>${esc(r.t)}</b><small>${esc(r.ty === "ep" ? "EP" : r.ty)}${r.sec ? " · " + esc(r.sec.join(", ")) : ""}${r.ver ? " · language version" : ""}</small></div>`).join("")}</div>`; }
  }
  if (x.kind === "idol" && x.color) extra += `<div class="label">Member colour</div><div class="swatches sm"><i style="background:${x.color.hex}"><small>${esc(x.color.name)}${x.animal ? " · " + esc(x.animal) : ""}</small></i></div>`;
  if (x.kind === "idol") extra += `<div class="label">Group</div>${wikiChips(w, (x.groups || []).map(groupOf).filter(Boolean))}`;
  if (x.kind === "song") { const g = groupOf(x.by); if (g) extra += `<div class="label">By</div>${wikiChips(w, [g])}`; if (x.pv) extra += `<div class="row" style="margin-top:10px"><button class="btn" type="button" data-wplay="${esc(x.pv)}">▶ Play the preview</button>${x.am ? `<a class="btn ghost" href="${x.am}" target="_blank" rel="noopener">Apple Music</a>` : ""}</div>`; }
  if (x.kind === "club" || x.kind === "team") { const r = rosterOf(w, x); if (r.length) extra += `<div class="label">Players in our data</div>${wikiChips(w, r.slice(0, 24))}`; }
  if (x.kind === "player" || x.kind === "bplayer") { const c = (x.hist || []).map((h) => items(w, (y) => (y.kind === "club" || y.kind === "team") && (y.n === h || y.short === h))[0]).filter(Boolean); if (c.length) extra += `<div class="label">Clubs and teams</div>${wikiChips(w, [...new Set(c)])}`; }
  if (x.kind === "country") { const d = items("food", (f) => f.origin === x.n); if (d.length) extra += `<div class="label">Dishes from here</div>${wikiChips("food", d)}`; }
  let pop = $("#wikiPop"); if (!pop) { pop = document.createElement("div"); pop.id = "wikiPop"; pop.className = "wikipop"; document.body.appendChild(pop); }
  pop.style.cssText = wvars(w); pop.hidden = false;
  pop.innerHTML = `<div class="wp-card" role="dialog" aria-label="${esc(x.n)}"><button class="wp-x" type="button" data-wclose="1" aria-label="Close">×</button>${imgOf(x) ? `<div class="wp-img ${x.logo || x.flag ? "contain" : ""}">${pic(x)}</div>` : ""}<div class="wp-body"><div class="label">${esc(KIND_NAME[x.kind] || "")} · ${esc(WORLDS[w].name)}</div><h2>${esc(x.n)}</h2><div class="wfacts">${facts.map((c) => `<div><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>`).join("")}</div>${extra}${credOf(x)}</div></div>`;
  pop.querySelector(".wp-card").scrollTop = 0;
}
function closeWiki() { const p = $("#wikiPop"); if (p) { p.hidden = true; p.innerHTML = ""; } if (WikiAud.a) WikiAud.a.pause(); }
const WikiAud = { a: null };

/* ================= two devices: ballknowledge's MQTT rooms; the host runs the game and sends the state ================= */
const Net = {
  role: null, code: null, mq: [], seen: new Set(), guestName: "", hostName: "",
  names() { return [this.hostName || "Host", this.guestName || "Guest"]; },
  open(code) { this.code = code; this.mq = BROKERS.map((u) => mqttConnect(u, "gamesite/v1/" + code, (m) => this.recv(m), () => this.paint())); },
  send(m) { m.id = Math.random().toString(36).slice(2); m.from = this.role; this.mq.forEach((c) => { try { c.send(m); } catch (e) { /* broker down */ } }); },
  recv(m) { if (!m || this.seen.has(m.id) || m.from === this.role) return; this.seen.add(m.id);
    if (this.role === "host") { if (m.k === "hello") { if (this.guestName) return; this.guestName = m.nick || "Guest"; Snd.win(); addPlay(S.world); this.send({ k: "go", host: prof().nick || "Host", hav: prof().avatar }); Vs.match({ nick: prof().nick || "Host", avatar: prof().avatar }, { nick: this.guestName, avatar: m.av || "" }, () => newQuiz(S.world, S.game, "online")); } else if (m.k === "buzz") buzz(1); else if (m.k === "ans") submitAnswer(m.p, m.t); }
    else if (m.k === "go") { Vs.match({ nick: m.host, avatar: m.hav || "" }, { nick: prof().nick || "Guest", avatar: prof().avatar }, () => {}); }
    else if (m.k === "state") { if (Vs.on && !Vs.matched) Vs.close(); this.hostName = m.host; Q.s = Object.assign(m.s, { used: new Set() }); if (S.world !== m.s.w || S.game !== m.s.game) { S.world = m.s.w; S.game = m.s.game; renderWorld(); } renderQuiz(); }
  },
  sync() { if (this.role !== "host" || !Q.s) return; const s = { ...Q.s }; delete s.used; this.send({ k: "state", s, host: prof().nick || "Host" }); },
  close() { this.mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); this.mq = []; this.role = null; },
  paint() {},
};
function openOnline() {
  $("#roomBox").innerHTML = matchmakingHTML() + `<div class="card" style="margin-top:12px"><div class="label">Play a friend: room code</div><div class="row" style="gap:10px;flex-wrap:wrap;margin-top:8px"><button class="btn" id="mkRoom" type="button">Create a room</button><span class="fine">or</span><input id="roomCode" maxlength="4" placeholder="CODE" style="width:90px;text-transform:uppercase"><button class="btn ghost" id="joinRoom" type="button">Join</button></div><div id="roomMsg" class="fine" style="margin-top:8px"></div></div>`;
}
const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function makeRoom() { Net.guestName = ""; const code = Array.from({ length: 4 }, () => rnd([...codeChars])).join(""); Net.role = "host"; Net.open(code); Vs.wait(code, S.game); }
function joinRoom() { const c = ($("#roomCode").value || "").trim().toUpperCase(); if (!/^[A-Z]{4}$/.test(c)) { toast("Type the 4-letter code"); return; } Net.role = "guest"; Net.open(c); setTimeout(() => Net.send({ k: "hello", nick: prof().nick || "Guest", av: prof().avatar }), 1200); Vs.join(c); }
function flashEdge(ok) { const d = document.documentElement; d.classList.remove("fl-ok", "fl-no"); void d.offsetWidth; d.classList.add(ok ? "fl-ok" : "fl-no"); }

const Account = { signedIn: false }, Ranked = { elo: 1000 }, myBadges = () => Object.keys(prof().badges || {}), badgesHTML = () => (typeof BadgeUI !== "undefined" ? BadgeUI.html() : ""), inviteLink = (code) => location.href.split("#")[0] + "#join-" + code;
const rankOf = (elo) => { const r = WRANKS.find(([m]) => elo - 1000 >= m) || WRANKS[WRANKS.length - 1]; return { name: r[1], icon: rkIcon(r[1]) }; };
Net.linked = () => Net.mq.some((c) => c && c.open);
/* ================= events ================= */
["pointerdown", "keydown", "touchend"].forEach((ev) => document.addEventListener(ev, () => Babble.ready(), { once: false, passive: true }));
document.addEventListener("click", (e) => {
  const wl = e.target.closest("[data-wiki]"); if (wl) { e.preventDefault(); Snd.tick(); openWiki(wl.dataset.wiki); return; }
  if (e.target.id === "wikiPop" || e.target.closest("[data-wclose]")) { closeWiki(); return; }
  const t = e.target.closest("button,[data-go]"); if (!t) return; Snd.unlock();
  if (t.dataset.wikiw) { WQ.w = t.dataset.wikiw; document.querySelectorAll("[data-wikiw]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.wikiw === WQ.w)); wikiResults(); return; }
  if (t.dataset.wplay) { if (WikiAud.a) WikiAud.a.pause(); WikiAud.a = new Audio(t.dataset.wplay); WikiAud.a.play().catch(() => {}); return; }
  if (t.dataset.go) { Snd.tick(); const to = t.dataset.go; if (to.startsWith("w-") && to.split("-").length === 2) { loadingScreen(to.slice(2), () => go(to, e)); return; } go(to, e); return; }
  if (t.dataset.game) { Snd.tick(); go(`w-${S.world}-${t.dataset.game}`, e); return; }
  if (t.dataset.diff) { S.diff = t.dataset.diff; try { localStorage.setItem("gp_diff", S.diff); } catch (x) { /* blocked */ } Snd.tick(); document.querySelectorAll("[data-diff]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.diff === S.diff)); $("#diffNote").textContent = DIFFNOTE[S.diff]; return; }
  if (t.dataset.mode) { startMode(t.dataset.mode); return; }
  if (t.id === "gamesBack") { if (Q.s && Q.s.mix) { Q.s = null; go("mix"); return; } go("w-" + S.world); return; }
  if (t.id === "qB0") { buzz(0); return; } if (t.id === "qB1") { buzz(1); return; }
  if (t.id === "qGuess") { submitAnswer(null); return; } if (t.dataset.sug) { submitAnswer(t.dataset.sug); return; }
  if (t.id === "qHold") { Q.hold = true; clearTimeout(Q.auto); t.remove(); const m = $(".autometer"); if (m) m.remove(); return; }
  if (t.id === "qNext") { if (Net.role === "guest") return; if (Q.s.mix) { Q.s.mixW = Q.s.mixW || []; Q.s.mixW[Q.s.round - 1] = Q.s.result.winner == null ? -1 : Q.s.result.winner; } nextRound(); return; }
  if (t.id === "qFinish") { if (Net.role === "guest") return; if (Q.s.mix) { Q.s.mixW[Q.s.round - 1] = Q.s.result.winner == null ? -1 : Q.s.result.winner; } finishQuiz(); return; }
  if (t.id === "qAgain") { if (Q.s && Q.s.mix) { go("mix"); return; } startMode(Q.s.mode); return; }
  if (t.dataset.hol) { answerHol(t.dataset.hol); return; }
  if (t.id === "hNext") { if (H.s.mode === "solo" && H.s.over) { H.s.phase = "done"; if (Boards) Boards.record(`${H.s.w}:${H.s.game}`, H.s.streak); renderHol(); return; } if (H.s.mode === "duo") { if (H.s.over) { H.s.phase = "done"; award("duo"); renderHol(); return; } H.s.turn = 1 - H.s.turn; } nextHol(); return; }
  if (t.id === "hAgain") { newHol(H.s.mode); return; }
  if (t.id === "mxStart") { try { localStorage.setItem("gp_names", JSON.stringify([$("#n0").value || "Player 1", $("#n1").value || "Player 2"])); } catch (x) { /* blocked */ } MX.s.stage = "pick"; renderMix(); return; }
  if (t.dataset.mx === "pick") { mixPick(t.dataset.w); return; } if (t.dataset.mx === "ban") { mixBan(t.dataset.w); return; }
  if (t.dataset.coll) { S.coll = t.dataset.coll; renderCollection(); return; }
  if (t.dataset.av) { const p = prof(); p.avatar = t.dataset.av; saveProf(); award("avatar"); paintProfileBtn(); renderProfile(); return; }
  if (t.dataset.snd) { Snd.setLevel(+t.dataset.snd); renderSettings(); return; } if (t.dataset.mus) { Snd.setMusic(t.dataset.mus === "1"); renderSettings(); return; }
  if (t.dataset.mas) { try { localStorage.setItem("gp_mascot", t.dataset.mas); } catch (x) { /* blocked */ } Mascot.dock(); renderSettings(); return; }
  if (t.dataset.hear) { Mascot.hello(); return; }
  if (t.dataset.voice) { try { localStorage.setItem("gp_voice", t.dataset.voice); } catch (x) { /* blocked */ } renderSettings(); return; }
  if (t.dataset.t3 != null) { T3.s.sel = +t.dataset.t3; Snd.tick(); renderTTT(); return; } if (t.id === "t3Pass") { const s3 = T3.s; s3.sel = null; s3.msg = "Passed."; s3.turn = 1 - s3.turn; Snd.back(); if (s3.mode === "solo" && s3.turn === 1) setTimeout(t3Cpu, 700); renderTTT(); return; }
  if (t.id === "t3Quit") { const s3 = T3.s; s3.over = true; s3.winner = 1 - s3.turn; Snd.wrong(); renderTTT(); return; }
  if (t.id === "roGive") { rouLose("give"); return; }
  if (t.id === "qGive") { if (Q.s && Q.s.phase === "run" && !Q.s.paused) { stopQuiz(); endRound(null, true); } return; }
  if (t.id === "t3Go") { t3Play(($("#qIn") || {}).value || ""); return; } if (t.dataset.t3sug) { t3Play("", t.dataset.t3sug); return; } if (t.id === "t3Again") { newTTT(T3.s.mode); return; }
  if (t.id === "alGo") { allSay(); return; } if (t.id === "alHint") { AL.s.hints = Math.min(AL.s.list.length, AL.s.hints + 1); renderAll(); return; } if (t.id === "alGive") { endAll(); return; } if (t.id === "alAgain") { newAll(AL.s.mode); return; }
  if (t.id === "audReplay") { const n = shownCount(); Aud.play(0, n >= 5 ? 30 : n >= 2 ? 8 : 3); return; }
  if (t.id === "roGo") { rouSay(); return; } if (t.id === "roNext") { if (RO.s.mode === "solo" || RO.s.round >= 3) { RO.s.phase = "done"; if (RO.s.mode === "duo") award("duo"); renderRou(); } else nextRou(); return; } if (t.id === "roAgain") { newRou(RO.s.mode); return; }
  if (t.dataset.kick) { const p = prof(); p.kick = p.kick || {}; p.kick[t.dataset.kw || S.world] = t.dataset.kick; saveProf(); const d = $("#mascot"); if (d) d.dataset.who = ""; Mascot.dock(); Mascot.hello(); if (!$("#setPage").hidden) renderSettings(); else renderHub(); return; }
  if (t.dataset.gamut) { const mix = shuffle(WORLD_IDS).map((w) => ({ w, g: rnd(GAMES[w].filter((g) => g.kind === "clue" || g.kind === "blur" || g.kind === "photo")).id })); loadingScreen(mix[0].w, () => { show("league"); renderWorldFor(mix[0].w); $("#crumbs").innerHTML = `<button class="back" data-go="home" type="button">← Menu</button>`; newQuiz(mix[0].w, mix[0].g, "solo", mix); Q.s.gamut = true; }); return; }
  if (t.id === "mkRoom") { makeRoom(); return; } if (t.id === "joinRoom") { joinRoom(); return; }
  if (t.id === "brand") { go("home", e); return; }
});
document.addEventListener("input", (e) => { if (e.target.id === "wikiQ") { WQ.q = e.target.value; wikiResults(); return; } if (e.target.id === "qIn") paintSuggestions(); if (e.target.id === "nick") { prof().nick = e.target.value.slice(0, 16); saveProf(); paintProfileBtn(); } });
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && $("#wikiPop") && !$("#wikiPop").hidden) { closeWiki(); return; }
  if (e.target.id === "roIn" && e.key === "Enter") { e.preventDefault(); rouSay(); return; }
  if (e.target.id === "alIn" && e.key === "Enter") { e.preventDefault(); allSay(); return; }
  if (e.target.id === "qIn" && e.key === "Enter" && $("#t3Go")) { e.preventDefault(); const one = $("#qSug .sug"); t3Play(e.target.value, $("#qSug").children.length === 1 ? one.dataset.t3sug : null); return; }
  if (e.target.tagName === "INPUT") { if (e.key === "Enter" && e.target.id === "qIn") { e.preventDefault(); const s = $("#qSug .sug"); const typed = e.target.value; if (s && !isRightSafe(typed) && $("#qSug").children.length === 1) submitAnswer(s.dataset.sug); else submitAnswer(null); } return; }
  const s = Q.s; if (!s || s.phase !== "run" || s.paused) return;
  if (s.mode === "solo" && e.code === "Space") { e.preventDefault(); buzz(0); }
  else if (s.mode === "online" && e.code === "Space") { e.preventDefault(); buzz(Net.role === "guest" ? 1 : 0); }
  else if (s.mode === "duo") { const k = e.key.toLowerCase(); if (k === "a") { e.preventDefault(); buzz(0); } else if (k === "l") { e.preventDefault(); buzz(1); } }
});
const isRightSafe = (t) => { try { return isRight(t, null); } catch (e) { return false; } };
addEventListener("hashchange", () => route());

/* start: the first loading screen, then the page */
paintProfileBtn();
loadingScreen(rnd(WORLD_IDS), () => { route(); setTimeout(() => Mascot.dock(), 600); });
document.addEventListener("pointerdown", () => Snd.unlock(), { once: true });
