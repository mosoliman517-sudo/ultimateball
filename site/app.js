/* ================= The games site: worlds, games, cross-category matches, profile and collection =================
   Built on ballknowledge's football page: the same look (worlds repaint the page), the same round engine (clues get easier,
   buzz early for up to 1,000 points, a wrong guess costs 150), the same sidekicks, loading screens, finale and sounds. */
const PK = window.PACKS || {};
Object.values(PK).forEach((p) => { p.items = p.items.filter((x) => x.n && !/^Q\d+$/.test(x.n)); });   /* Wikidata entries with no English name are left out, never renamed */
if (window.IMGDATA) Object.values(PK).forEach((p) => p.items.forEach((x) => ["img", "logo", "flag"].forEach((k) => { if (x[k]) { if (IMGDATA[x[k]]) x[k] = IMGDATA[x[k]]; else delete x[k]; } })));
const items = (w, f) => ((PK[w] && PK[w].items) || []).filter((x) => !f || f(x));
const rnd = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const fmt = (n) => n >= 1e9 ? (n / 1e9).toFixed(1).replace(/\.0$/, "") + " bn" : n >= 1e6 ? (n / 1e6).toFixed(1).replace(/\.0$/, "") + " m" : n >= 1e3 ? Math.round(n / 1e3) + "k" : String(n);
const euro = (v) => (v >= 1e6 ? `€${(v / 1e6).toFixed(1).replace(/\.0$/, "")}m` : `€${Math.round(v / 1e3)}k`);
const imgOf = (x) => x && (x.img || x.logo || x.flag);
const isCut = (x) => x && x.cut;
const credOf = (x, k) => { const c = x && x.cr && (x.cr[k] || x.cr.img || x.cr.logo || x.cr.flag); return c ? `<div class="credit">${esc(c.by)} · ${esc(c.lic)} · <a href="${c.page}" target="_blank" rel="noopener">source</a></div>` : ""; };
const pic = (x, cls = "") => imgOf(x) ? `<img class="${cls} ${isCut(x) ? "cutpic" : ""} ${x.logo || x.flag ? "contain" : ""}" src="${imgOf(x)}" alt="${esc(x.n)}" loading="lazy">` : "";

/* ---------------- the worlds ---------------- */
const WORLDS = {
  kpop: { name: "K-pop", kicker: "Idols, groups, songs, debuts", tag: "160 groups, 700 idols and 500 songs from Wikidata, with free-licence photos.", mascot: "bongi", kicks: ["bongi", "mic", "pocha"] },
  football: { name: "Football", kicker: "Five leagues of ball knowledge", tag: "Players, careers, crests and market values from ballknowledge's real data.", mascot: "bench", kicks: ["bench", "boot", "rita"] },
  basketball: { name: "Basketball", kicker: "25 seasons of the NBA", tag: "Players, careers, team logos and career points from ballknowledge's basketball data.", mascot: "rim", kicks: ["rim", "clock", "sneak"] },
  chess: { name: "Chess", kicker: "Grandmasters and openings", tag: "Elite players with their peak ratings, and the real openings from Lichess.", mascot: "pip", kicks: ["pip", "vera", "bea"] },
  geography: { name: "Geography", kicker: "Flags, capitals, countries", tag: "Every sovereign country: flags, capitals, languages and populations.", mascot: "pin", kicks: ["pin"] },
  history: { name: "History", kicker: "Rulers, thinkers, explorers", tag: "The most famous people born before 1900, with their real dates.", mascot: "tock", kicks: ["tock"] },
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
function byFame(list) {
  const s2 = list.slice().sort((a, b) => (b.fame || 0) - (a.fame || 0)), n = s2.length, cut = (f, min) => s2.slice(0, Math.max(min, Math.ceil(n * f)));
  const r = S.diff === "easy" ? cut(0.15, 25) : S.diff === "medium" ? cut(0.4, 50) : S.diff === "hard" ? cut(0.75, 80) : s2.slice(Math.floor(n * 0.25));
  return r.length >= 4 ? r : s2;
}
const startClues = () => (S.diff === "easy" ? 2 : 1);
const answerTime = () => ({ easy: 15, medium: 12, hard: 10, elite: 8 })[S.diff];
const rouTurn = (solo) => (solo ? { easy: 75, medium: 60, hard: 50, elite: 40 } : { easy: 16, medium: 12, hard: 9, elite: 7 })[S.diff];
const clueSpeed = () => ({ easy: 1.35, medium: 1, hard: 0.8, elite: 0.6 })[S.diff];

/* ---------------- clue ladders from the real facts (hardest first) ---------------- */
const first = (n) => n.split(/\s+/).map((w) => w[0].toUpperCase()).join(". ") + ".";
const CLUES = {
  player: (p) => [["Born", p.born], ["Nationality", p.nat], ["Position", p.pos], ["Clubs", p.hist && p.hist.length ? `${new Set(p.hist).size} clubs on record` : null], ["Strong foot", p.foot], ["Caps", p.caps != null ? `${p.caps} for his country` : null], ["Now at", p.club], ["Initials", first(p.n)]].filter((c) => c[1]),
  idol: (p) => [["Born", p.born], ["Birthplace", p.from], ["Group", p.groups && p.groups.join(", ")], ["Initials", first(p.n)]].filter((c) => c[1]),
  group: (g) => [["Type", g.gender], ["Members", g.members ? `${g.members} members on record` : null], ["Label", g.labels && g.labels.join(", ")], ["Debut", g.debut], ["Initials", first(g.n)]].filter((c) => c[1]),
  country: (c) => [["Population", c.pop ? fmt(c.pop) + " people" : null], ["Area", c.area ? fmt(c.area) + " km²" : null], ["Currency", c.currency && c.currency.join(", ")], ["Language", c.language && c.language.join(", ")], ["Continent", c.continent], ["Capital", c.capital], ["Initials", first(c.n)]].filter((c) => c[1]),
  person: (p) => [["Born", p.born < 0 ? `${-p.born} BC` : p.born], ["Died", p.died != null ? (p.died < 0 ? `${-p.died} BC` : p.died) : null], ["Known as", p.occ && p.occ.join(", ")], ["Country", p.ctry && p.ctry.join(", ")], ["Initials", first(p.n)]].filter((c) => c[1]),
  dish: (d) => [...(d.made || []).map((m) => ["Made with", m]), ["From", d.origin], ["Initials", first(d.n)]].filter((c) => c[1]),
  song: (x) => [["Year", x.year], ["Album", x.album], ["Shape", x.n.replace(/\S/g, "_ ")], ["By", x.by], ["Initials", first(x.n)]].filter((c) => c[1]),
  bplayer: (p) => [["Born", p.born], ["Nationality", p.nat], ["Height", p.h ? Math.round(p.h) + " cm" : null], ["Position", p.pos], ["First season", p.first], ["Teams", p.hist && p.hist.length ? `${new Set(p.hist).size} teams` : null], ["Career", p.pts ? `${p.pts.toLocaleString()} points in ${p.gp} games` : null], ["Titles", p.titles ? `${p.titles} championship${p.titles > 1 ? "s" : ""}` : null], ["Team", p.club], ["Initials", first(p.n)]].filter((c) => c[1]),
  cplayer: (p) => [["Born", p.born], ["Peak rating", p.peak], ["Country", p.nat], ["World champion", p.champ ? "Yes" : "No"], ["Initials", first(p.n)]].filter((c) => c[1]),
  opening: (o) => { const mv = o.pgn.split(/\s+/).filter((t) => !/^\d+\.$/.test(t)), at = (k) => o.pgn.split(/\s+/).slice(0, Math.ceil(k * 1.5)).join(" "); const seen = new Set(); return [["ECO code", o.eco], ["First moves", at(2)], ["More moves", at(4)], ["The full line", o.pgn], ["Games on Lichess", `${o.games.toLocaleString()} in our sample`], ["Initials", first(o.n)]].filter((c) => c[1] && !seen.has(c[1]) && seen.add(c[1])); },
  trivia: (x) => [["Question", x.q], ["Category", x.cat], ["Letters", x.n.replace(/\S/g, "_ ")], ["Starts with", x.n[0]]],
  anime: (x) => [["Genres", x.genres && x.genres.join(", ")], ["Episodes", x.eps], ["Studio", x.studios && x.studios.join(", ")], ["Based on work by", x.authors && x.authors.join(", ")], ["First aired", x.year], ["Initials", first(x.n)]].filter((c) => c[1]),
  team: (t) => [["City", t.loc], ["Nickname", t.short]].filter((c) => c[1]),
  club: (c) => [["Coach", c.coach], ["Stadium", c.stadium], ["Initials", first(c.n)]].filter((c) => c[1]),
};
const BLUR = [34, 26, 19, 13, 8, 4, 0];
const scrambleWord = (w) => { const a = [...w]; if (a.length < 3) return w; for (let k = 0; k < 20; k++) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } if (a.join("").toLowerCase() !== w.toLowerCase()) break; } return a.join(""); };
const scrambleName = (n) => n.split(/\s+/).map((w) => scrambleWord(w.replace(/[^\p{L}\p{N}'-]/gu, ""))).join("   ").toUpperCase();

/* ---------------- the games of each world: every game plays exactly what its name says ---------------- */
const G = (id, name, kind, o) => ({ id, name, kind, ...o });
const KIND_WORD = { trivia: "a quiz answer", anime: "an anime", song: "a song", bplayer: "a basketball player", cplayer: "a chess player", opening: "a chess opening", team: "a team", player: "a footballer", club: "a club", idol: "an idol", group: "a group", country: "a country", person: "a historical figure", dish: "a dish" };
const GAMES = {
  football: [
    G("who", "Who am I?", "clue", { tag: "A mystery player. Clues go from obscure to obvious. Buzz in early for more points.", pool: () => items("football", (x) => x.kind === "player"), clues: CLUES.player, unit: "player" }),
    G("career", "Career path", "clue", { tag: "Every club he played for, in order. Name the player.", pool: () => items("football", (x) => x.kind === "player" && x.hist && x.hist.length >= 3), clues: (p) => p.hist.map((c, i) => [`Club ${i + 1}`, c]), unit: "player" }),
    G("blur", "Badge blur", "blur", { tag: "A blurry club crest that sharpens by the second.", pool: () => items("football", (x) => x.kind === "club" && x.logo), unit: "club", imgKey: "logo" }),
    G("photo", "Who's that player?", "blur", { tag: "A blurred player photo that sharpens. Name him before your rival does.", pool: () => items("football", (x) => x.kind === "player" && x.img), unit: "player", imgKey: "img" }),
    G("value", "Market value", "hol", { tag: "Two players. Who is worth more? Keep the streak alive.", pool: () => items("football", (x) => x.kind === "player" && x.val && x.img), stat: (x) => x.val, show: euro, ask: "Who is worth more?", higher: true }),
    G("roulette", "Club roulette", "roulette", { tag: "A club appears. Take turns naming players who played for it. First to blank loses.", pool: () => items("football", (x) => x.kind === "club").filter((c) => rosterOf("football", c).length >= 8), roster: (c) => rosterOf("football", c), unit: "player" }),
    G("scramble", "Scramble", "scramble", { tag: "A player or club with the letters shuffled. Unscramble it first.", pool: () => items("football") }),
  ],
  basketball: [
    G("who", "Who am I?", "clue", { tag: "A mystery NBA player. Born, height, position, career points. Buzz early.", pool: () => items("basketball", (x) => x.kind === "bplayer"), clues: CLUES.bplayer, unit: "bplayer" }),
    G("career", "Career path", "clue", { tag: "Every team he played for, in order. Name the player.", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.hist && x.hist.length >= 3), clues: (p) => p.hist.map((c, i) => [`Team ${i + 1}`, c]), unit: "bplayer" }),
    G("logo", "Logo blur", "blur", { tag: "A blurred NBA team logo that sharpens by the second.", pool: () => items("basketball", (x) => x.kind === "team"), unit: "team", imgKey: "logo" }),
    G("photo", "Who's that player?", "blur", { tag: "A blurred headshot that sharpens. Name him first.", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.img), unit: "bplayer", imgKey: "img" }),
    G("points", "Career points", "hol", { tag: "Two players. Who scored more career points?", pool: () => items("basketball", (x) => x.kind === "bplayer" && x.pts && x.img), stat: (x) => x.pts, show: (v) => v.toLocaleString(), ask: "More career points?", higher: true }),
    G("roulette", "Team roulette", "roulette", { tag: "A team appears. Take turns naming players who played for it.", pool: () => items("basketball", (x) => x.kind === "team").filter((t) => rosterOf("basketball", t).length >= 8), roster: (t) => rosterOf("basketball", t), unit: "bplayer" }),
    G("scramble", "Scramble", "scramble", { tag: "A player or team with the letters shuffled.", pool: () => items("basketball") }),
  ],
  chess: [
    G("who", "Who is this player?", "clue", { tag: "Born, peak rating, country, world champion or not. Name the grandmaster.", pool: () => items("chess", (x) => x.kind === "cplayer"), clues: CLUES.cplayer, unit: "cplayer" }),
    G("photo", "Grandmaster blur", "blur", { tag: "A blurred photo of a top player that sharpens.", pool: () => items("chess", (x) => x.kind === "cplayer" && x.img), unit: "cplayer", imgKey: "img" }),
    G("opening", "Name the opening", "clue", { tag: "The moves of a real opening appear one by one. Type its name.", pool: () => items("chess", (x) => x.kind === "opening"), clues: CLUES.opening, unit: "opening" }),
    G("peak", "Higher peak?", "hol", { gaps: [100, 50, 20], tag: "Two grandmasters. Whose peak rating was higher?", pool: () => items("chess", (x) => x.kind === "cplayer" && x.peak && x.img), stat: (x) => x.peak, show: String, ask: "Higher peak rating?", higher: true }),
    G("scramble", "Scramble", "scramble", { tag: "A grandmaster or opening with the letters shuffled.", pool: () => items("chess") }),
  ],
  kpop: [
    G("who", "Idol: Who am I?", "clue", { tag: "A mystery idol. Birth year, hometown, then the group. Buzz early.", pool: () => items("kpop", (x) => x.kind === "idol" && x.groups && x.groups.length), clues: CLUES.idol, unit: "idol" }),
    G("group", "Group: Who are we?", "clue", { tag: "A mystery group. Label, members and debut year reveal it.", pool: () => items("kpop", (x) => x.kind === "group" && (x.debut || x.labels.length)), clues: CLUES.group, unit: "group" }),
    G("logo", "Logo blur", "blur", { tag: "A blurred group logo that sharpens by the second.", pool: () => items("kpop", (x) => x.kind === "group" && x.logo), unit: "group", imgKey: "logo", min: 6 }),
    G("photo", "Idol blur", "blur", { tag: "A blurred photo of an idol or group. Name them before it is sharp.", pool: () => items("kpop", (x) => x.img), unit: "kpop", imgKey: "img" }),
    G("song", "Guess the song", "clue", { tag: "A real song. Year, album and group come first, then its shape. Type the title.", pool: () => items("kpop", (x) => x.kind === "song" && x.year), clues: CLUES.song, unit: "song" }),
    G("hear", "Hear the song", "audio", { tag: "Three seconds of a real song. Then five more. Buzz and type the title before the hints arrive.", pool: () => items("kpop", (x) => x.kind === "song" && x.pv), unit: "song", min: 6 }),
    G("whose", "Whose song is it?", "clue", { tag: "A song title appears. Type the group who sings it.", pool: () => items("kpop", (x) => x.kind === "song" && x.by), clues: (x) => [["Song", x.n], ["Year", x.year], ["Album", x.album], ["Starts with", x.by[0]]].filter((c) => c[1]), unit: "group", answer: (x) => x.by }),
    G("members", "Member roulette", "roulette", { tag: "A group appears. Take turns naming its members. First to blank or repeat loses the round.", pool: () => items("kpop", (x) => x.kind === "group").filter((g) => rosterOf("kpop", g).length >= 4), roster: (g) => rosterOf("kpop", g), unit: "idol" }),
    G("debut", "Who debuted first?", "hol", { gaps: [8, 4, 2], tag: "Two groups, one question: which one debuted earlier?", pool: () => items("kpop", (x) => x.kind === "group" && x.debut && x.img), stat: (x) => x.debut, show: String, ask: "Who debuted first?", higher: false }),
    G("scramble", "Scramble", "scramble", { tag: "An idol or group with the letters shuffled.", pool: () => items("kpop") }),
  ],
  general: [
    G("quiz", "Quick quiz", "clue", { tag: "A real quiz question. Hints show the letters, then the first one. Type the answer before your rival.", pool: () => items("general"), clues: CLUES.trivia, unit: "trivia" }),
    G("scramble", "Answer scramble", "scramble", { tag: "A quiz answer with its letters shuffled.", pool: () => items("general", (x) => x.n.length >= 5) }),
  ],
  anime: [
    G("who", "Which anime am I?", "clue", { tag: "Genres, episodes, studio, creator, year. Name the series.", pool: () => items("anime"), clues: CLUES.anime, unit: "anime" }),
    G("aired", "Which aired first?", "hol", { gaps: [10, 5, 2], tag: "Two series. Which one started earlier?", pool: () => items("anime", (x) => x.year), stat: (x) => x.year, show: String, ask: "Aired first?", higher: false }),
    G("scramble", "Scramble", "scramble", { tag: "An anime title with the letters shuffled.", pool: () => items("anime") }),
  ],
  geography: [
    G("flag", "Flag blur", "blur", { tag: "A blurred flag that sharpens by the second. Name the country.", pool: () => items("geography", (x) => x.flag), unit: "country", imgKey: "flag" }),
    G("who", "Which country am I?", "clue", { tag: "Population, area, currency, language, then the capital. Name the country.", pool: () => items("geography", (x) => x.capital), clues: CLUES.country, unit: "country" }),
    G("capital", "Capital cities", "clue", { tag: "A flag and a country. Type the capital before the hints give it away.", pool: () => items("geography", (x) => x.capital && x.flag), clues: (c) => [["Country", c.n], ["Continent", c.continent], ["Starts with", c.capital[0]], ["Letters", c.capital.replace(/\S/g, "_ ")]].filter((x) => x[1]), unit: "capital", answer: (c) => c.capital, showImg: true }),
    G("pop", "More people?", "hol", { tag: "Two flags. Which country has more people?", pool: () => items("geography", (x) => x.pop && x.flag), stat: (x) => x.pop, show: (v) => fmt(v), ask: "More people?", higher: true }),
    G("scramble", "Scramble", "scramble", { tag: "A country with the letters shuffled.", pool: () => items("geography") }),
  ],
  history: [
    G("who", "Who am I?", "clue", { tag: "Born, died, what they did, where they came from. Name the figure.", pool: () => items("history"), clues: CLUES.person, unit: "person" }),
    G("portrait", "Portrait blur", "blur", { tag: "A famous portrait comes into focus. Who is it?", pool: () => items("history", (x) => x.img), unit: "person", imgKey: "img" }),
    G("born", "Who was born first?", "hol", { gaps: [60, 20, 5], tag: "Two figures from history. Who came first?", pool: () => items("history", (x) => x.born != null && x.img), stat: (x) => x.born, show: (v) => (v < 0 ? `${-v} BC` : String(v)), ask: "Born first?", higher: false }),
    G("scramble", "Scramble", "scramble", { tag: "A famous name with the letters shuffled.", pool: () => items("history") }),
  ],
  food: [
    G("dish", "Dish blur", "blur", { tag: "A blurred photo of a famous dish. Name it before it is sharp.", pool: () => items("food", (x) => x.img), unit: "dish", imgKey: "img" }),
    G("who", "Ingredient reveal", "clue", { tag: "What goes into it, then where it is from. Name the dish.", pool: () => items("food", (x) => x.made && x.made.length >= 2), clues: CLUES.dish, unit: "dish" }),
    G("origin", "Where's it from?", "clue", { tag: "A dish appears. Type the country it comes from.", pool: () => items("food", (x) => x.origin && x.img), clues: (d) => [["Dish", d.n], ...(d.made || []).slice(0, 2).map((m) => ["Made with", m]), ["Starts with", d.origin[0]]], unit: "origin", answer: (d) => d.origin, showImg: true }),
    G("scramble", "Scramble", "scramble", { tag: "A dish with the letters shuffled.", pool: () => items("food") }),
  ],
};
Object.keys(GAMES).forEach((w) => { GAMES[w] = GAMES[w].filter((g) => g.pool().length >= (g.min || 4)); });
const gameOf = (w, id) => (GAMES[w] || []).find((g) => g.id === id);
const nameOfAnswer = (g, x) => (g.answer ? g.answer(x) : x.n);
function suggestPool(g, w) {
  if (g.unit === "capital") return [...new Set(items("geography").map((x) => x.capital).filter(Boolean))].map((n) => ({ n }));
  if (g.unit === "origin") return [...new Set(items("food").map((x) => x.origin).concat(items("geography").map((x) => x.n)))].map((n) => ({ n }));
  if (g.kind === "scramble") return [];
  if (g.unit === "trivia") return []; const kinds = { anime: ["anime"], song: ["song"], bplayer: ["bplayer"], cplayer: ["cplayer"], opening: ["opening"], team: ["team"], player: ["player"], club: ["club"], idol: ["idol"], group: ["group"], kpop: ["idol", "group"], country: ["country"], person: ["person"], dish: ["dish"] }[g.unit] || null;
  return items(w, (x) => !kinds || kinds.includes(x.kind));
}

function rosterOf(w, x) {
  rosterOf.c = rosterOf.c || {}; const k = w + x.id; if (rosterOf.c[k]) return rosterOf.c[k];
  const norm = (t) => qnorm(t).replace(/^(fc|afc|ac|ss|as|rc|sc|vfb|vfl|tsg|sv|1fc)/, "");
  let r = [];
  if (w === "kpop") r = items("kpop", (p) => p.kind === "idol" && (p.groups || []).includes(x.n));
  else if (w === "football") { const n = norm(x.n); r = items("football", (p) => p.kind === "player" && (p.hist || []).concat(p.club || []).some((h) => { const t = norm(h); return t && (t === n || (t.length > 4 && (n.includes(t) || t.includes(n)))); })); }
  else if (w === "basketball") r = items("basketball", (p) => p.kind === "bplayer" && (p.hist || []).includes(x.short));
  return (rosterOf.c[k] = r);
}
/* ---------------- storage and profile (browser first, like ballknowledge without an account) ---------------- */
const KEY = "gp-v1";
const store = (() => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { return {}; } })();
const saveStore = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { /* storage blocked */ } };
function prof() { const p = store.profile || (store.profile = {}); return Object.assign(p, { xp: p.xp || 0, ach: p.ach || {}, days: p.days || {}, nick: p.nick || "", avatar: p.avatar || "", worlds: p.worlds || {}, dex: p.dex || {}, splashes: p.splashes || {}, best: p.best || {}, mix: p.mix || { played: 0, won: 0 }, elo: p.elo || 1000 }); }
const saveProf = () => saveStore();
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
  ["flags20", "Flag bearer", "Get 20 flags right", 2, "flag"], ["kpop_debut", "Day one stan", "Get 10 'Who debuted first?' right", 1, "star"], ["value10", "Scout", "Get 10 market values right", 1, "trend"],
];
const achOf = (id) => ACH.find((a) => a[0] === id);
function award(id) { const p = prof(); if (p.ach[id]) return; p.ach[id] = todayKey(); saveProf(); const a = achOf(id); if (!a) return; toast(`<b>Achievement unlocked</b><br>${esc(a[1])}: ${esc(a[2])}`, "ach"); Snd.win(); setTimeout(() => Mascot.react("achieve", true), 1400); }
function addXP(n, w) { const p = prof(), lv0 = levelOf(p.xp).i; p.xp += n; if (w) { const W = p.worlds[w] || (p.worlds[w] = { xp: 0, plays: 0 }); const r0 = wRank(W.xp); W.xp += n; if (wRank(W.xp) !== r0) { toast(`<b>Rank up in ${esc(WORLDS[w].name)}</b><br>${rkIcon(wRank(W.xp))} ${wRank(W.xp)}`, "ach"); Mascot.react("rankup", true); } } p.days[todayKey()] = (p.days[todayKey()] || 0) + 1; saveProf(); if (levelOf(p.xp).i > lv0) toast(`<b>Level up</b><br>${levelOf(p.xp).name}`, "ach"); paintProfileBtn(); }
function collect(w, x) { if (!x || !imgOf(x)) return; const p = prof(), k = w + ":" + x.id; p.dex[k] = (p.dex[k] || 0) + 1; if (p.dex[k] === 3) toast(`<b>New card</b><br>${esc(x.n)} joined your Dex`, "ach"); saveProf(); const n = Object.values(p.dex).filter((c) => c >= 3).length; if (n >= 10) award("dex10"); if (n >= 50) award("dex50"); }
const dexHas = (k) => (prof().dex[k] || 0) >= 3;

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
    try { if (localStorage.getItem("gp_voice") === "1" && window.speechSynthesis) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; speechSynthesis.speak(u); } } catch (e) { /* no speech */ }
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
const SECTIONS = ["home", "worldsPage", "league", "mixPage", "profilePage", "collPage", "setPage"];
function show(id) { SECTIONS.forEach((s) => { const el = $("#" + s); if (el) el.hidden = s !== id; }); scrollTo({ top: 0, behavior: REDUCED ? "auto" : "smooth" }); }
function go(slug, ev) { try { if (location.hash !== "#" + slug) history.replaceState(null, "", "#" + slug); } catch (e) { /* no hash */ } route(ev); }
function route(ev) {
  const h = (location.hash || "#home").slice(1); stopQuiz(); Snd.mode(h.startsWith("w-") && h.split("-").length > 2 ? "game" : "lobby");
  if (h.startsWith("w-")) { const [, w, g] = h.split("-"); if (!WORLDS[w]) return go("worlds"); const changed = S.world !== w; S.world = w; setTheme(w, ev); show("league"); renderWorld(); if (g && gameOf(w, g)) openGame(g); else { S.game = null; renderHub(); } if (changed) setTimeout(() => Mascot.hello(), 700); return; }
  S.world = null;
  if (h === "worlds") { setTheme("HOME", ev); show("worldsPage"); renderWorlds(); return; }
  if (h === "mix") { setTheme("mix", ev); show("mixPage"); renderMix(); return; }
  if (h === "profile") { setTheme("HOME", ev); show("profilePage"); renderProfile(); return; }
  if (h === "collection") { setTheme("HOME", ev); show("collPage"); renderCollection(); return; }
  if (h === "settings") { setTheme("HOME", ev); show("setPage"); renderSettings(); return; }
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
  $("#homeCats").innerHTML = catCards();
  const mixPics = WORLD_IDS.map((w) => items(w, (x) => x.img)[0]).filter(Boolean);
  $("#homeMix").innerHTML = `<h2 class="sec">Multi-genre</h2><p class="secsub">Every category in one game. Test yourself across all of them, or beat a friend who knows completely different things.</p><div class="groups">
    <button type="button" class="gpick" data-go="mix"><div class="gfaces">${mixPics.slice(0, 4).map((x) => `<img class="gface-img ${isCut(x) ? "cutpic" : ""}" src="${x.img}" alt="">`).join("")}</div><div class="gname">Cross-category match</div><div class="gtag">Two players. Each picks three categories, bans one of the other's, a wildcard joins, and every round is a real game from that category.</div><span class="dgo">Challenge a friend</span></button>
    <button type="button" class="gpick" data-gamut="1"><div class="gfaces">${mixPics.slice(4, 8).map((x) => `<img class="gface-img ${isCut(x) ? "cutpic" : ""}" src="${x.img}" alt="">`).join("")}</div><div class="gname">Gamut run</div><div class="gtag">Solo. One round from every category, back to back. How far does your knowledge reach?</div><span class="dgo">${WORLD_IDS.length} rounds</span></button></div>`;
  homeTilt();
}
function catCards() {
  const p = prof();
  return WORLD_IDS.map((w, k) => { const W = WORLDS[w], pics = shuffle(items(w, (x) => x.img).slice(0, 24)).slice(0, 3), wx = (p.worlds[w] || {}).xp || 0, kick = (p.kick || {})[w] || W.mascot;
    return `<button type="button" class="world ${k === 0 ? "feat" : ""}" data-go="w-${w}" style="${wvars(w)};--d:${k * 70}ms"><div class="wbody"><div class="wk">${esc(W.kicker)}</div><div class="wn">${esc(W.name)}</div><div class="wt">${esc(W.tag)}</div><div class="ws"><span>${GAMES[w].length} games</span><span>${rkIcon(wRank(wx))} ${wRank(wx)}</span></div></div><div class="wpics">${pics.map((x) => `<img src="${x.img}" alt="" class="${isCut(x) ? "cutpic" : ""}">`).join("")}</div><div class="wmas">${MASCOT_SVG[kick]("happy")}</div></button>`; }).join("");
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
  $("#lFlag").innerHTML = ""; $("#lFlag").style.background = `linear-gradient(135deg, ${WVARS[w][4]}, ${WVARS[w][3]})`; $("#lKicker").textContent = W.kicker; $("#lName").textContent = W.name; $("#lTag").textContent = `${W.tag} Your sidekick here is ${MASCOTS[W.mascot].name}.`;
  $("#scorebox").innerHTML = `<div class="score"><span class="label">Rank</span><b>${rkIcon(wRank(wx))} ${wRank(wx)}</b></div><div class="score"><span class="label">World XP</span><b class="num">${wx}</b></div><div class="score"><span class="label">Dex</span><b class="num">${Object.keys(prof().dex).filter((k) => k.startsWith(w + ":") && dexHas(k)).length}/${items(w, imgOf).length}</b></div>`;
}
function kickRow(w) { const cur = Mascot.id(); return `<div class="kickrow"><span class="label">Your sidekick here</span>${WORLDS[w].kicks.concat(Object.keys(MASCOTS).filter((k) => !WORLDS[w].kicks.includes(k))).map((k) => `<button type="button" class="kick ${k === cur ? "on" : ""}" data-kick="${k}" title="${esc(MASCOTS[k].name)}: ${esc(MASCOTS[k].blurb)}">${MASCOT_SVG[k]("happy")}<small>${esc(MASCOTS[k].name)}</small></button>`).join("")}</div>`; }
function recordLine(w, id) { const b = prof().best[w + ":" + id]; return b ? `Your best: ${b.score.toLocaleString()} pts · streak ${b.streak}` : "Not played yet"; }
function renderHub() {
  const w = S.world; let k = 0;
  const faces = (g) => shuffle(g.pool().filter(imgOf)).slice(0, 3).map((x) => `<img class="gface-img ${x.logo || x.flag ? "contain" : ""} ${isCut(x) ? "cutpic" : ""}" src="${imgOf(x)}" alt="">`).join("");
  $("#room").innerHTML = kickRow(w) + `<h2 class="sec">What do you want to play?</h2><p class="secsub">${GAMES[w].length} games in ${esc(WORLDS[w].name)}. Every one works solo, on one device with a friend, or on two devices.</p><div class="hub">${GAMES[w].map((g) => `<button type="button" class="gcard" data-game="${g.id}" style="--d:${k++ * 60}ms"><div class="gfaces">${faces(g)}</div><div class="gname">${esc(g.name)}</div><div class="gmodes">${g.kind === "hol" ? "Solo streak · 2 players" : g.kind === "roulette" ? "Solo 60 seconds · 2 players" : "Solo streak · 2 players · online"}</div><div class="gtag">${esc(g.tag)}</div><div class="grec num">${esc(recordLine(w, g.id))}</div></button>`).join("")}</div>`;
  homeTilt();
}

/* ================= the round engine (ballknowledge's Q engine, generalised to any world) ================= */
const Q = { timer: null, s: null };
function stopQuiz() { if (Q.timer) { clearInterval(Q.timer); Q.timer = null; } try { Aud.stop(); } catch (e) { /* not ready */ } }
/* Hear the song: Apple's 30-second previews, played in slices (3 s, then 5 s more, then the rest), paused while someone answers */
const Aud = {
  a: null, t: null, ok: true,
  load(url) { this.stop(); this.ok = true; if (!url) { this.a = null; return; } const a = new Audio(); a.preload = "auto"; a.src = url; a.onerror = () => { this.ok = false; const n = $("#audNote"); if (n) n.textContent = "Audio can't play here. It plays on the website (this preview blocks outside audio)."; }; this.a = a; setTimeout(() => this.stage(1), 400); },
  play(from, to) { const a = this.a; if (!a) return; clearTimeout(this.t); try { a.currentTime = from; a.play().catch(() => { this.ok = false; }); } catch (e) { return; } this.t = setTimeout(() => a.pause(), (to - from) * 1000); },
  stage(n) { if (n === 1) this.play(0, 3); else if (n === 2) this.play(3, 8); else if (n >= 5) this.play(8, 30); },
  pause() { if (this.a) this.a.pause(); clearTimeout(this.t); },
  stop() { this.pause(); if (this.a) { this.a.src = ""; this.a = null; } },
};
const gamesBar = (title) => `<div class="row" style="margin-bottom:12px"><button class="btn ghost" id="gamesBack" type="button">← Back</button><h2 style="font-size:24px">${title}</h2></div>`;
const diffBar = () => `<div class="label" style="margin-top:14px">Difficulty</div><div class="diffbar" role="group" aria-label="Difficulty">${DIFFS.map(([k]) => [k, diffName(k)]).map(([k, n]) => `<button type="button" class="chip" data-diff="${k}" aria-pressed="${S.diff === k}">${n}</button>`).join("")}</div><div class="fine" id="diffNote" style="margin-top:6px">${DIFFNOTE[S.diff]}</div>`;
const modeIntro = (title, blurb, opts) => `<div class="card">${gamesBar(title)}<p class="sub">${blurb}</p>${diffBar()}<div class="label" style="margin-top:16px">Players and devices</div><div class="modes">${opts.map((o) => `<button class="mode" data-mode="${o.id}" type="button"><b>${o.t}</b><span>${o.d}</span></button>`).join("")}</div><div id="roomBox"></div></div>`;
const NAMES = () => { try { const n = JSON.parse(localStorage.getItem("gp_names") || "null"); return n && n.length === 2 ? n : ["Player 1", "Player 2"]; } catch (e) { return ["Player 1", "Player 2"]; } };
function openGame(id) {
  S.game = id; const g = gameOf(S.world, id); stopQuiz(); Q.s = null; H.s = null;
  const how = { clue: "Clues start hard and get easier.", blur: "The picture starts blurred and sharpens every few seconds.", scramble: "The letters of every word are shuffled. Hints arrive slowly.", hol: "Two picks, one question. Tap the right side.", roulette: "Name as many as you can. In a duel, take turns: blank, repeat or run out of time and you lose the round.", audio: "A real song plays in short slices: 3 seconds, then 5 more, then the rest." }[g.kind];
  $("#room").innerHTML = modeIntro(esc(g.name), `${esc(g.tag)} ${how} ${g.kind === "hol" ? "Solo: keep the streak going. Two players: take turns, five each." : "Buzz in whenever you think you know it. The sooner you are right, the more you score (up to 1,000); a wrong guess costs 150."}`, [
    { id: "solo", t: g.kind === "roulette" ? "Solo, against the clock" : "Solo streak", d: g.kind === "roulette" ? "Name as many as you can before time runs out." : "Keep going for as long as you can. The run ends the first time you miss." },
    { id: "duo", t: "Two players, one device", d: g.kind === "hol" ? "Take turns. Most right after five each wins." : g.kind === "roulette" ? "Three rounds. Take turns typing names on the same screen." : "Five rounds. Race to buzz: A for player 1, L for player 2." },
    ...(g.kind === "hol" || g.kind === "roulette" ? [] : [{ id: "online", t: "Two players, two devices", d: "The same race on two phones or computers, with a four-letter room code." }])]);
  Snd.mode("game");
}
function startMode(m) {
  const g = gameOf(S.world, S.game); if (m === "online") return openOnline();
  addPlay(S.world);
  const go2 = () => { if (g.kind === "hol") return newHol(m); if (g.kind === "roulette") return newRou(m); newQuiz(S.world, S.game, m); };
  if (m === "duo") { const n = NAMES(); Vs.match({ nick: n[0], avatar: prof().avatar }, { nick: n[1], avatar: "" }, go2); } else go2();
}
/* ---------------- roulette (ballknowledge's Club roulette): name members or players of a group, club or team ---------------- */
const RO = { s: null, t: null };
function newRou(mode) { RO.s = { w: S.world, game: S.game, mode, round: 0, wins: [0, 0], score: 0, phase: "play" }; nextRou(); }
function nextRou() {
  const s = RO.s, g = gameOf(s.w, s.game); s.round++; s.x = rnd(byFame(g.pool())); s.roster = g.roster(s.x); s.named = []; s.turn = (s.round - 1) % 2; s.phase = "play"; s.msg = "";
  s.left = rouTurn(s.mode === "solo"); clearInterval(RO.t); RO.t = setInterval(() => { s.left -= 0.25; const c = $("#roClock"); if (c) c.textContent = Math.ceil(s.left) + "s"; if (s.left <= 0) rouLose("time"); }, 250); renderRou();
}
function renderRou() {
  const s = RO.s, g = gameOf(s.w, s.game), n = NAMES(), x = s.x;
  if (s.phase === "done") { clearInterval(RO.t); const duo = s.mode === "duo", winner = s.wins[0] === s.wins[1] ? -1 : s.wins[0] > s.wins[1] ? 0 : 1; $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${finale({ label: duo ? "Full time" : "Time!", verdict: duo ? (winner < 0 ? "A draw." : esc(n[winner]) + " wins!") : `${s.score} named.`, players: duo ? [0, 1].map((k) => ({ name: n[k], score: s.wins[k] })) : [{ name: prof().nick || "You", score: s.score, av: avatarHTML(prof().avatar, "lg", prof().nick || "You") }], winner: duo ? winner : null, good: duo || s.score >= 6, tiles: [], buttons: `<button class="btn" id="roAgain" type="button">Play again</button>` })}</div>`; return; }
  const head = `<div class="row" style="gap:14px;align-items:center;margin:6px 0 12px">${imgOf(x) ? `<img class="ansimg ${x.logo ? "contain" : ""}" src="${imgOf(x)}" alt="">` : ""}<div><div class="label">${s.mode === "duo" ? `Round ${s.round} of 3` : "Name as many as you can"}</div><h3 style="font-size:32px;font-family:var(--display)">${esc(x.n)}</h3><div class="fine">${s.roster.length} in our data</div></div><span class="num" id="roClock" style="margin-left:auto;font:800 34px var(--display)">${Math.ceil(s.left)}s</span></div>`;
  const named = `<div class="mixstrip">${s.named.map((p) => `<span>${imgOf(p) ? `<img src="${imgOf(p)}" alt="">` : ""}${esc(p.n)}</span>`).join("")}</div>`;
  const reveal = s.phase === "reveal" ? `<div class="rcard on" style="margin-top:10px"><b>${esc(s.msg)}</b><div class="fine" style="margin-top:6px">Some you could have said: ${s.roster.filter((p) => !s.named.includes(p)).slice(0, 8).map((p) => esc(p.n)).join(", ")}</div></div><div class="row" style="margin-top:12px"><button class="btn" id="roNext" type="button">${s.mode === "solo" || s.round >= 3 ? "See the result" : "Next round"}</button></div>` : `<div class="answerbox"><div class="row"><b>${s.mode === "duo" ? esc(n[s.turn]) + ", your turn" : "Your answer"}</b></div><div class="row"><input id="roIn" autocomplete="off" spellcheck="false" placeholder="Type a name" aria-label="A name"><button class="btn" id="roGo" type="button">Say it</button></div><div class="fine">${esc(s.msg)}</div></div>`;
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${s.mode === "duo" ? `<div class="qhud"><span class="label">Rounds won</span>${[0, 1].map((i) => `<span class="num qscore"><small>${esc(n[i])}</small> <b>${s.wins[i]}</b></span>`).join("")}</div>` : `<div class="qhud"><span class="label">Named</span><span class="num qscore"><b>${s.score}</b></span></div>`}${head}${named}${reveal}</div>`;
  const i = $("#roIn"); if (i) i.focus({ preventScroll: true });
}
function rouSay() {
  const s = RO.s, t = ($("#roIn") || {}).value || ""; if (!t.trim() || s.phase !== "play") return;
  const hit = s.roster.find((p) => nameMatch(t, p.n) || qnorm(t) === qnorm(p.n));
  if (!hit) { s.msg = `Not in the data for ${s.x.n}. Try another.`; Snd.wrong(); flashEdge(false); renderRou(); return; }
  if (s.named.includes(hit)) { if (s.mode === "duo") return rouLose("repeat"); s.msg = "Already said."; renderRou(); return; }
  s.named.push(hit); Snd.right(); flashEdge(true); collect(s.w, hit); s.msg = "";
  if (s.mode === "solo") { s.score++; addXP(5, s.w); if (s.named.length >= s.roster.length) return rouLose("all"); }
  else { s.turn = 1 - s.turn; s.left = rouTurn(false); if (s.named.length >= s.roster.length) return rouLose("all"); }
  renderRou();
}
function rouLose(why) { const s = RO.s; if (s.phase !== "play") return; clearInterval(RO.t); s.phase = "reveal"; const n = NAMES();
  if (s.mode === "solo") s.msg = why === "all" ? "You named every one!" : `Time! ${s.score} named.`;
  else if (why === "all") s.msg = "Every name used. Nobody loses this round.";
  else { s.wins[1 - s.turn]++; s.msg = `${n[s.turn]} ${why === "repeat" ? "repeated a name" : "ran out of time"}. Round to ${n[1 - s.turn]}.`; Snd.wrong(); }
  renderRou(); }

function addPlay(w) { const p = prof(); const W = p.worlds[w] || (p.worlds[w] = { xp: 0, plays: 0 }); W.plays++; saveProf(); const n = WORLD_IDS.filter((x) => (p.worlds[x] || {}).plays).length; if (n >= 3) award("tourist"); if (n >= WORLD_IDS.length) award("explorer"); }

function newQuiz(w, game, mode, mix) { Q.s = { w, game, mode, round: 0, rounds: mix ? mix.length : 5, scores: mode === "solo" ? [0] : [0, 0], streak: 0, phase: "run", mix: mix || null, wins: [0, 0], used: new Set() }; nextRound(); }
function curDef() { const s = Q.s; return s.mix ? gameOf(s.mix[s.round - 1].w, s.mix[s.round - 1].g) : gameOf(s.w, s.game); }
function curWorld() { const s = Q.s; return s.mix ? s.mix[s.round - 1].w : s.w; }
function nextRound() {
  const s = Q.s; s.round++; const d = curDef(), pool = byFame(d.pool()); let r;
  for (let k = 0; k < 40; k++) { r = rnd(pool); if (!s.used.has(r.id)) break; } s.used.add(r.id); s.r = r;
  s.clues = d.kind === "audio" ? [["Listen", "3 seconds"], ["Listen", "5 more seconds"], ["By", r.by], ["Year", r.year], ["Listen", "the whole preview"], ["Initials", first(r.n)]].filter((c) => c[1]) : d.kind === "blur" ? BLUR.map((b) => ["Blur", b]) : d.kind === "scramble" ? [["Letters", scrambleName(r.n)], ["It is", KIND_WORD[r.kind] || "a name"], ["Starts with", first(r.n)], ["Shape", r.n.replace(/\S/g, "_")]] : d.clues(r);
  s.elapsed = 0; s.paused = false; s.buzzed = null; s.locked = [false, false]; s.phase = "run"; s.result = null; s.hn = 0;
  Aud.load(d.kind === "audio" ? r.pv : null); s.cs = (d.kind === "audio" ? 7 : d.kind === "blur" ? 3.2 : d.kind === "scramble" ? 7 : 6) * clueSpeed(); s.total = s.clues.length * s.cs + 6;
  if (s.mix) { setTheme(curWorld()); }
  renderQuiz(); if (Q.timer) clearInterval(Q.timer); Q.timer = setInterval(tickQuiz, 250); Net.sync();   /* not stopQuiz(): that would also stop this round's song */
}
const worth = () => { const s = Q.s; return Math.max(100, Math.round(1000 * (1 - s.elapsed / s.total) * (curDef().kind === "scramble" ? Math.max(0.4, 1 - 0.15 * s.hn) : 1))); };
const shownCount = () => { const s = Q.s, k = curDef().kind; return k === "scramble" ? Math.min(s.clues.length, startClues() + s.hn) : Math.min(s.clues.length, (k === "audio" ? 1 : startClues()) + Math.floor(s.elapsed / s.cs)); };
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
function isRight(typed, pickName) { const s = Q.s, d = curDef(), ans = nameOfAnswer(d, s.r); if (pickName != null) return qnorm(pickName) === qnorm(ans); if (qnorm(typed) === qnorm(ans)) return true; if (nameMatch(typed, ans, d.unit === "club" || d.unit === "group" || d.unit === "country")) return true; const m = resolveGuess(typed, suggestPool(d, curWorld()), (x) => x.n); return !!m && qnorm(m.n) === qnorm(ans); }
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
function endRound(winner) {
  const s = Q.s; stopQuiz(); s.paused = false; s.phase = "reveal"; let pts = 0; const w = curWorld(), d = curDef();
  if (winner != null) {
    pts = Math.round(worth() * (s.mode === "solo" ? DIFFX[S.diff] : 1)); s.scores[winner] += pts; s.wins[winner]++; s.streak++; flashEdge(true); FX.hit(pts); Snd.win(); if (pts > 700) confetti();
    if (winner === 0 || s.mode !== "solo") { collect(w, s.r); award("first_buzz"); if (pts >= 950) award("speed"); if (S.diff === "elite") award("elite_win"); }
    if (s.mode === "solo") { FX.streak(s.streak); if (s.streak >= 3) award("hat3"); if (s.streak >= 10) award("streak10"); Mascot.react(pts > 800 ? "bighit" : s.streak >= 3 && s.streak % 3 === 0 ? "streak" : "hit"); }
    if (d.unit === "country" && d.kind === "blur") { const p = prof(); p.flags = (p.flags || 0) + 1; saveProf(); if (p.flags >= 20) award("flags20"); }
    addXP(10 + Math.round(pts / 100), w);
  } else { if (s.mode === "solo" && !s.mix) { s.over = true; FX.over(); Mascot.react("over"); } else FX.miss(""); Snd.wrong(); }
  s.result = { winner, pts }; renderQuiz(); Net.sync();
}
function finishQuiz() {
  const s = Q.s; s.phase = "done"; stopQuiz();
  if (s.mode === "solo") { const k = s.w + ":" + s.game, p = prof(), b = p.best[k]; if (!b || s.scores[0] > b.score) { p.best[k] = { score: s.scores[0], streak: s.streak }; saveProf(); if (b) Mascot.react("best", true); } }
  else award("duo");
  if (s.mix) mixFinished(s);
  renderQuiz(); Net.sync();
}
function paintClues() { const b = $("#qClues"); if (b) b.innerHTML = cluesHTML(); }
function cluesHTML() {
  const s = Q.s, d = curDef(), n = shownCount(), x = s.r;
  if (d.kind === "blur") { const k = d.imgKey, src = x[k] || imgOf(x); return `<div class="blurpic ${k === "logo" ? "logo" : k === "flag" ? "flag" : ""} ${isCut(x) ? "cut cutpic" : ""}"><img src="${src}" alt="" style="filter:blur(${BLUR[Math.min(n - 1, BLUR.length - 1)]}px)"></div><div class="fine" style="text-align:center">Sharpens every few seconds</div>`; }
  if (d.kind === "audio") { return `<div class="blurpic" style="width:min(240px,60vw);display:grid;place-items:center;background:radial-gradient(circle,var(--accent2),var(--surface2))"><div class="eq">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i}"></i>`).join("")}</div></div><div class="fine" id="audNote" style="text-align:center">${Aud.ok ? "Listening… replay with the button" : "Audio can't play here. It plays on the website."}</div><div class="row" style="justify-content:center"><button class="btn ghost" id="audReplay" type="button">Replay what you've heard</button></div>` + s.clues.slice(2).map((c, i) => i + 2 < n ? `<div class="clue on"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>` : `<div class="clue off"><span class="label">${esc(c[0])}</span><b>?</b></div>`).join(""); }
  if (d.kind === "scramble") { let k = 0; const words = s.clues[0][1].split(/\s{2,}/).map((wd) => `<div class="scw">${[...wd].map((c) => `<i class="sct" style="--i:${++k}">${esc(c)}</i>`).join("")}</div>`).join(""); return `<div class="scr seen">${words}</div><div class="schints">${s.clues.slice(1, n).map((c) => `<div class="schint"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>`).join("")}</div>`; }
  const top = d.showImg && imgOf(x) ? `<div class="blurpic ${x.flag && !x.img ? "flag" : ""}" style="width:min(220px,60vw)">${pic(x)}</div>` : "";
  return top + s.clues.map((c, i) => i < n ? `<div class="clue on ${i === n - 1 ? "new" : ""}"><span class="label">${esc(c[0])}</span><b>${esc(c[1])}</b></div>` : `<div class="clue off"><span class="label">${esc(c[0])}</span><b>?</b></div>`).join("");
}
function answerCard() {
  const s = Q.s, d = curDef(), x = s.r, ans = nameOfAnswer(d, x), facts = (CLUES[x.kind] ? CLUES[x.kind](x) : []).filter((c) => c[0] !== "Initials").slice(0, 4).map((c) => `${esc(c[0])}: ${esc(c[1])}`).join(" · ");
  return `<div class="rcard on"><div class="label">The answer</div><div class="row" style="gap:14px;margin:8px 0;align-items:center">${imgOf(x) ? `<img class="ansimg ${x.logo || x.flag ? "contain" : ""} ${isCut(x) ? "cutpic" : ""}" src="${imgOf(x)}" alt="">` : ""}<div><h3 style="font-size:28px">${esc(ans)}</h3>${ans !== x.n ? `<div class="fine">${esc(x.n)}</div>` : ""}<div class="fine">${facts}</div></div></div>${credOf(x, d.imgKey)}${x.am ? `<a class="credit" href="${x.am}" target="_blank" rel="noopener">Preview courtesy of Apple Music. Listen to the full song there.</a>` : ""}</div>`;
}
function renderQuiz() {
  const s = Q.s, d = curDef(), duo = s.mode !== "solo", names = s.mode === "online" ? Net.names() : NAMES(), title = s.mix ? `Round ${s.round}: ${esc(WORLDS[curWorld()].name)} · ${esc(d.name)}` : esc(d.name);
  const strip = s.mix ? `<div class="mixstrip" style="margin-bottom:10px">${s.mix.map((m, i) => { const x = items(m.w, (y) => y.img)[0]; return `<span class="${i === s.round - 1 ? "now" : ""} ${s.mixW && s.mixW[i] != null && s.mixW[i] >= 0 ? "w" + s.mixW[i] : ""}">${x ? `<img src="${x.img}" alt="">` : ""}${esc(WORLDS[m.w].name)}</span>`; }).join("")}</div>` : "";
  const head = gamesBar(title) + strip;
  if (s.phase === "done") {
    const best = Math.max(...s.scores), winner = duo ? (s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1) : 0;
    $("#room").innerHTML = `<div class="card">${head}${finale({ label: duo ? "Full time" : `Run over · streak of ${s.streak}`, verdict: duo ? (winner < 0 ? "A draw." : esc(names[winner]) + " wins!") : best >= 3500 ? "Serious knowledge." : best >= 2000 ? "Solid." : "Keep practising.", players: s.scores.map((sc, k) => ({ name: duo ? names[k] : prof().nick || "You", score: sc, av: duo ? null : avatarHTML(prof().avatar, "lg", prof().nick || "You") })), winner: duo ? winner : null, good: duo ? true : best >= 2000, tiles: duo ? [[`${s.wins[0]}–${s.wins[1]}`, "rounds won"]] : [[s.streak, "streak"], [best.toLocaleString(), "points"]], buttons: `<button class="btn" id="qAgain" type="button">Play again</button>${s.mix ? `<button class="btn ghost" data-go="mix" type="button">New match</button>` : ""}` })}</div>`; return;
  }
  const last = duo || s.mix ? s.round >= s.rounds : s.over, hud = `<div class="qhud"><span class="label">${duo ? `Round ${s.round} of ${s.rounds}` : `Streak ${s.streak}`}</span>${s.scores.map((v, i) => `<span class="num qscore"><small>${duo ? esc(names[i]) : "Score"}</small> <b>${v}</b></span>`).join("")}</div>`;
  if (s.phase === "reveal") { const r = s.result, nm = r.winner == null ? (duo ? "Nobody got it" : "Time ran out. The run is over") : duo ? esc(names[r.winner]) + " got it" : "You got it"; $("#room").innerHTML = `<div class="card">${head}${hud}<div class="rcard on" style="margin-bottom:10px"><b style="font-size:20px">${nm}${r.winner != null ? `: +${r.pts}` : ""}</b></div>${answerCard()}<div class="row" style="margin-top:14px"><button class="btn" id="${last ? "qFinish" : "qNext"}" type="button">${last ? "See the final score" : "Next round"}</button></div></div>`; return; }
  const bz = s.paused, me = Net.role === "guest" ? 1 : 0;
  const buzzers = duo ? `<div class="buzzers"><button class="buzz p1" id="qB0" type="button" ${s.locked[0] || bz || (Net.role === "guest") ? "disabled" : ""}>${Net.role ? (me === 0 ? "Buzz" : esc(names[0])) : esc(names[0])}<small>${Net.role ? (me === 0 ? "space bar" : "your rival") : "key A"}</small></button><button class="buzz p2" id="qB1" type="button" ${s.locked[1] || bz || Net.role === "host" ? "disabled" : ""}>${Net.role ? (me === 1 ? "Buzz" : esc(names[1])) : esc(names[1])}<small>${Net.role ? (me === 1 ? "space bar" : "your rival") : "key L"}</small></button></div>` : `<div class="buzzers"><button class="buzz p1 wide" id="qB0" type="button" ${bz ? "disabled" : ""}>BUZZ<small>space bar</small></button></div>`;
  const mine = !Net.role || s.buzzed === me;
  const answer = bz ? `<div class="answerbox"><div class="row"><b>${duo ? esc(names[s.buzzed]) : "Your answer"}</b><span class="num fine" id="qClock">${Math.ceil(s.answerLeft)}s</span></div>${mine ? `<div class="row"><input id="qIn" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="go" placeholder="Type your answer" aria-label="Your answer"><button class="btn" id="qGuess" type="button">Guess</button></div><div id="qSug" class="sugs"></div>` : `<div class="fine">Your rival is answering…</div>`}</div>` : "";
  $("#room").innerHTML = `<div class="card">${head}${hud}<div class="meter"><i id="qMeter" style="width:${(100 * (1 - s.elapsed / s.total)).toFixed(1)}%"></i></div><div class="row" style="justify-content:space-between"><span class="fine">Worth <b class="num" id="qWorth">${worth()}</b> points now</span><span class="fine">${esc(WORLDS[curWorld()].name)}</span></div><div id="qClues" class="clues">${cluesHTML()}</div>${answer}${buzzers}</div>`;
  if (bz && mine) focusIn();
}
function paintSuggestions() {
  const box = $("#qSug"), q = ($("#qIn") || {}).value || ""; if (!box) return; const d = curDef(); if (d.kind === "scramble") { box.innerHTML = ""; return; }
  const list = suggestions(q, suggestPool(d, curWorld()), (x) => x.n); box.innerHTML = list.map((x) => `<button type="button" class="sug" data-sug="${esc(x.n)}">${x.img || x.logo || x.flag ? `<img src="${imgOf(x)}" alt="" style="width:22px;height:22px;border-radius:50%;object-fit:cover;margin-right:6px;vertical-align:middle">` : ""}${esc(x.n)}</button>`).join("");
}

/* ================= higher or lower (ballknowledge's Higher or lower / Market value, with photos) ================= */
const H = { s: null };
function newHol(mode) { H.s = { w: S.world, game: S.game, mode, streak: 0, turn: 0, scores: [0, 0], n: [0, 0], phase: "pick" }; nextHol(); }
function holGapOK(g, a, b) {
  const x = g.stat(a), y = g.stat(b); if (x === y) return false;
  const gap = g.gaps ? Math.abs(x - y) : Math.max(x, y) / Math.max(1, Math.min(x, y)), t = g.gaps || [2.5, 1.5, 1.15];
  return S.diff === "easy" ? gap >= t[0] : S.diff === "medium" ? gap >= t[1] : S.diff === "hard" ? gap >= t[2] && gap < t[0] : gap < t[1];
}
function nextHol() { const s = H.s, g = gameOf(s.w, s.game), pool = byFame(g.pool()); let a, b; for (let k = 0; k < 400; k++) { [a, b] = shuffle(pool).slice(0, 2); if (a && b && holGapOK(g, a, b)) break; } if (!a || !b || g.stat(a) === g.stat(b)) for (let k = 0; k < 60; k++) { [a, b] = shuffle(pool).slice(0, 2); if (g.stat(a) !== g.stat(b)) break; } s.a = a; s.b = b; s.phase = "pick"; s.pick = null; renderHol(); }
function renderHol() {
  const s = H.s, g = gameOf(s.w, s.game), duo = s.mode === "duo", names = NAMES(), done = s.phase === "done";
  if (done) { const winner = s.scores[0] === s.scores[1] ? -1 : s.scores[0] > s.scores[1] ? 0 : 1; $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${finale({ label: duo ? "Full time" : `Run over`, verdict: duo ? (winner < 0 ? "A draw." : esc(names[winner]) + " wins!") : s.streak >= 10 ? "Unreal." : s.streak >= 5 ? "Strong run." : "Go again.", players: duo ? [0, 1].map((k) => ({ name: names[k], score: s.scores[k] })) : [{ name: prof().nick || "You", score: s.streak, av: avatarHTML(prof().avatar, "lg", prof().nick || "You") }], winner: duo ? winner : null, good: duo || s.streak >= 5, tiles: duo ? [] : [[s.streak, "streak"]], buttons: `<button class="btn" id="hAgain" type="button">Play again</button>` })}</div>`; return; }
  const side = (x, k) => { const rev = s.phase === "reveal", ok = rev && ((g.higher ? g.stat(x) > g.stat(k === "a" ? s.b : s.a) : g.stat(x) < g.stat(k === "a" ? s.b : s.a))); return `<button type="button" class="holside ${rev ? (ok ? "win" : "lose") : ""}" data-hol="${k}" ${rev ? "disabled" : ""}>${imgOf(x) ? `<img src="${imgOf(x)}" alt="" class="${isCut(x) ? "cutpic" : ""}" style="${x.flag && !x.img ? "object-fit:contain;padding:30px;background:#0b1a22" : ""}">` : ""}<b>${esc(x.n)}</b><span class="hv num" data-v="${g.stat(x)}">${rev ? esc(g.show(g.stat(x))) : ""}</span></button>`; };
  const hud = duo ? `<div class="qhud"><span class="label">${esc(names[s.turn])}'s turn · ${s.n[0] + s.n[1] + 1} of 10</span>${[0, 1].map((i) => `<span class="num qscore"><small>${esc(names[i])}</small> <b>${s.scores[i]}</b></span>`).join("")}</div>` : `<div class="qhud"><span class="label">Streak ${s.streak}</span></div>`;
  $("#room").innerHTML = `<div class="card">${gamesBar(esc(g.name))}${hud}<h3 style="text-align:center;font-family:var(--display);font-size:clamp(26px,4vw,40px);margin:6px 0 12px">${esc(g.ask)}</h3><div class="holpair">${side(s.a, "a")}${side(s.b, "b")}<div class="holor">OR</div></div>${s.phase === "reveal" ? `<div class="row" style="margin-top:14px;justify-content:space-between"><span class="fine">${credOf(s.a)}${credOf(s.b)}</span><button class="btn" id="hNext" type="button">${s.over ? "See the result" : "Next"}</button></div>` : ""}</div>`;
}
function answerHol(k) {
  const s = H.s, g = gameOf(s.w, s.game); if (s.phase !== "pick") return; const x = k === "a" ? s.a : s.b, y = k === "a" ? s.b : s.a, ok = g.higher ? g.stat(x) > g.stat(y) : g.stat(x) < g.stat(y);
  s.phase = "reveal"; flashEdge(ok);
  if (s.mode === "solo") { if (ok) { s.streak++; FX.streak(s.streak); Snd.right(); addXP(8, s.w); collect(s.w, x); Mascot.react(s.streak % 3 === 0 ? "streak" : "hit"); if (s.game === "debut") { const p = prof(); p.debutOK = (p.debutOK || 0) + 1; saveProf(); if (p.debutOK >= 10) award("kpop_debut"); } if (s.game === "value") { const p = prof(); p.valOK = (p.valOK || 0) + 1; saveProf(); if (p.valOK >= 10) award("value10"); } } else { s.over = true; Snd.wrong(); FX.over(); Mascot.react("over"); const kk = s.w + ":" + s.game, p = prof(); if (!p.best[kk] || s.streak > p.best[kk].streak) { p.best[kk] = { score: s.streak, streak: s.streak }; saveProf(); } } }
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
  const mix = worlds.map((x) => ({ w: x, g: rnd(GAMES[x].filter((g) => g.kind === "clue" || g.kind === "blur")).id }));
  renderMix(); setTimeout(() => { toast(`<b>Wildcard</b><br>${esc(WORLDS[wild].name)} joins the match`, "ach"); loadingScreen(wild, () => { S.world = mix[0].w; show("league"); renderWorldFor(mix[0].w); Q.s = null; newQuiz(mix[0].w, mix[0].g, "duo", mix); Q.s.mixW = []; }); }, 700); }
function renderWorldFor(w) { S.world = w; renderWorld(); $("#crumbs").innerHTML = `<button class="back" data-go="mix" type="button">← Cross-category match</button>`; }
function mixFinished(s) { const p = prof(); p.mix.played++; award("mix_first"); if (s.scores[0] > s.scores[1]) { p.mix.won++; award("mix_win"); if (s.wins[1] === 0) award("mix_sweep"); } saveProf(); }

/* ================= loading screens: one collection per world, Common to Legendary, plus a secret ================= */
const SPLASH_TIPS = ["Buzz early: points fall from 1,000 toward 100 as the clues arrive.", "A wrong guess costs 150, so buzz when you are sure.", "Get the same answer right three times and its card joins your Dex.", "Every world has its own loading screens. Rare ones are worth hunting.", "In a cross-category match, ban the world your rival knows best.", "Elite counts double. Easy counts 0.6x.", "Any card in your Dex can be your profile picture."];
function splashCatalog(w) {
  const list = byFameAll(items(w, (x) => x.img)), n = list.length, out = [];
  list.slice(0, Math.min(24, n)).forEach((x, i) => out.push({ id: `${w}:${x.id}`, w, x, name: x.n, rar: i < 6 ? "Uncommon" : "Common" }));
  out.push({ id: `${w}:rare`, w, name: { kpop: "Concert night", geography: "Spinning globe", history: "Sands of time", food: "Open kitchen", football: "Floodlights" }[w], rar: "Rare" });
  out.push({ id: `${w}:leg`, w, name: { kpop: "Encore", geography: "Around the world", history: "The golden age", food: "Michelin night", football: "Cup final" }[w], rar: "Legendary" });
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
function loadingScreen(w, done) {
  const sp = $("#splash"); if (!sp || !WORLDS[w]) { done && done(); return; }
  const cat = splashCatalog(w), r = Math.random(); let cur;
  if (r < 0.012) cur = { id: "secret:notebook", name: "The Notebook", rar: "Secret", w };
  else if (r < 0.06) cur = cat.find((c) => c.rar === "Legendary");
  else if (r < 0.2) cur = cat.find((c) => c.rar === "Rare");
  else cur = rnd(cat.filter((c) => c.rar === (r < 0.45 ? "Uncommon" : "Common"))) || cat[0];
  const art = sp.querySelector(".sp-art");
  if (cur.rar === "Secret") art.innerHTML = `<div class="sp-notebook"><div class="nb-paper"><div class="nb-title">My worlds</div><div class="nb-sub">a notebook, written by hand</div><ol>${WORLD_IDS.map((x, i) => `<li style="--i:${i}"><b>${i + 1}. ${esc(WORLDS[x].name)}</b><span>${(prof().worlds[x] || {}).xp || 0} XP</span></li>`).join("")}</ol><div class="nb-note">Before the games, there was a notebook full of things worth knowing.</div></div></div>`;
  else if (cur.x) art.innerHTML = `<div class="sp-poster pal-${hash(cur.name) % 6} star"><div class="sp-speed"></div><div class="sp-bgname">${esc(cur.name.toUpperCase())}</div><img class="sp-cutimg ${isCut(cur.x) ? "cut" : ""}" src="${cur.x.img}" alt="${esc(cur.name)}"></div>`;
  else art.innerHTML = `<div class="sp-poster pal-${hash(w) % 6}"><div class="sp-speed"></div><div class="sp-bgname">${esc(WORLDS[w].name.toUpperCase())}</div>${sceneHTML(w, cur.rar === "Legendary")}</div>`;
  const p = prof(), isNew = !p.splashes[cur.id]; p.splashes[cur.id] = 1; saveProf();
  const got = Object.keys(p.splashes).length; if (got >= 5) award("splash5"); if (cur.rar === "Rare") award("splash_rare"); if (cur.rar === "Legendary") award("splash_leg"); if (cur.rar === "Secret") award("secret");
  $("#spTip").textContent = rnd(SPLASH_TIPS); $("#spName").textContent = `${WORLDS[w].name} · ${cur.name}`; const rr = $("#spRar"); rr.textContent = cur.rar; rr.className = "sp-rar r-" + cur.rar.toLowerCase(); $("#spNew").textContent = isNew ? `New! ${got} collected` : "";
  sp.className = "splash k-" + ({ Common: "star", Uncommon: "legend", Rare: "rare", Legendary: "legendary", Secret: "secret" }[cur.rar]); sp.hidden = false; sp.classList.remove("out");
  const end = () => { sp.classList.add("out"); setTimeout(() => { sp.hidden = true; }, 450); done && done(); };
  clearTimeout(loadingScreen.t); loadingScreen.t = setTimeout(end, cur.rar === "Secret" || cur.rar === "Legendary" ? 3800 : 2000); $("#spSkip").onclick = () => { clearTimeout(loadingScreen.t); end(); };
}

/* ================= collection: Dex + loading screens ================= */
function renderCollection() {
  const p = prof(), rc = { Common: "#9aa3b2", Uncommon: "#4ade80", Rare: "#38bdf8", Legendary: "#fbbf24", Secret: "#ff6b9d" };
  const screens = WORLD_IDS.map((w) => { const cat = splashCatalog(w), have = cat.filter((c) => p.splashes[c.id]).length; return `<h3 class="sec" style="font-size:22px">${esc(WORLDS[w].name)} <span class="fine">${have} of ${cat.length}</span></h3><div class="coll">${cat.map((c) => { const ok = !!p.splashes[c.id]; return `<div class="lscard ${ok ? "" : "locked"}" style="--rc:${rc[c.rar]}">${c.x ? `<img src="${c.x.img}" alt="" class="${isCut(c.x) ? "cutpic" : ""}">` : `<div class="scene" style="background:${WVARS[w][0]}">${sceneHTML(w, c.rar === "Legendary")}</div>`}<small>${c.rar}</small><b>${ok ? esc(c.name) : "???"}</b></div>`; }).join("")}</div>`; }).join("");
  const secret = p.splashes["secret:notebook"] ? `<div class="lscard" style="--rc:${rc.Secret};max-width:180px"><div class="scene" style="background:#f4ecd6"></div><small>Secret</small><b style="color:#222">The Notebook</b></div>` : `<p class="fine">There is one more screen. It is not listed until you find it.</p>`;
  const dex = WORLD_IDS.map((w) => { const all = byFameAll(items(w, imgOf)).slice(0, 60); return `<h3 class="sec" style="font-size:22px">${esc(WORLDS[w].name)} <span class="fine">${all.filter((x) => dexHas(w + ":" + x.id)).length} of ${items(w, imgOf).length}</span></h3><div class="coll">${all.map((x) => { const ok = dexHas(w + ":" + x.id), n = p.dex[w + ":" + x.id] || 0; return `<div class="lscard ${ok ? "" : "locked"}" style="--rc:${ok ? WVARS[w][4] : "#3a3a46"}">${pic(x)}<small>${ok ? "In your Dex" : `${n}/3 right`}</small><b>${ok ? esc(x.n) : "???"}</b></div>`; }).join("")}</div>`; }).join("");
  $("#collRoom").innerHTML = `<div class="hero"><h1><em>Collection</em></h1><p>Get an answer right three times and its card joins your Dex. Every world also hides loading screens, from Common up to Legendary, and one secret.</p></div><div class="scope" style="margin-bottom:12px"><button type="button" class="chip" data-coll="dex" aria-pressed="${S.coll !== "screens"}">Dex</button><button type="button" class="chip" data-coll="screens" aria-pressed="${S.coll === "screens"}">Loading screens</button></div>${S.coll === "screens" ? screens + secret : dex}`;
}

/* ================= profile ================= */
function paintProfileBtn() { const p = prof(), b = $("#profileBtn"); if (b) b.innerHTML = `${avatarHTML(p.avatar, "sm", p.nick || "You")}<span>${esc(levelOf(p.xp).name)}</span>`; }
/* free from the start: Hearts2Hearts (Ian first) and the most famous face of every category; everything else unlocks through the Dex */
const STARTER = (k) => { const [w, id] = k.split(":"), x = items(w).find((y) => y.id === id); return !!x && ((w === "kpop" && (x.groups || []).includes("Hearts2Hearts")) || byFameAll(items(w, imgOf))[0] === x); };
function renderProfile() {
  const p = prof(), lv = levelOf(p.xp), pct = lv.next ? Math.round((100 * (p.xp - lv.from)) / (lv.next - lv.from)) : 100;
  const ian = items("kpop", (x) => x.kind === "idol" && x.n === "Ian" && (x.groups || []).includes("Hearts2Hearts") && x.img), h2h = items("kpop", (x) => x.kind === "idol" && (x.groups || []).includes("Hearts2Hearts") && x.img && x.n !== "Ian");
  const avs = [...ian, ...h2h].map((x) => ({ w: "kpop", x })).concat(WORLD_IDS.flatMap((w) => byFameAll(items(w, imgOf)).slice(0, 14).map((x) => ({ w, x })))).filter((v, i, A) => A.findIndex((y) => y.x === v.x) === i);
  $("#profRoom").innerHTML = `<div class="card"><div class="pfhead" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap">${avatarHTML(p.avatar, "xl", p.nick || "You")}<div><div class="label">Level ${lv.i + 1}</div><h2 style="font-size:34px;font-family:var(--display)">${esc(p.nick || "You")}</h2><div class="fine">${esc(lv.name)} · ${p.xp} XP${lv.next ? ` · ${lv.next - p.xp} to ${LEVELS[lv.i + 1][0]}` : ""}</div><div class="meter" style="margin-top:8px;max-width:320px"><i style="width:${pct}%"></i></div></div><label class="fine" style="margin-left:auto">Nickname <input id="nick" value="${esc(p.nick)}" maxlength="16" style="width:150px"></label></div></div>
  <div class="card"><div class="label">Rank in every world</div><div class="wrank" style="margin-top:8px">${WORLD_IDS.map((w) => { const x = (p.worlds[w] || {}).xp || 0; return `<div style="--wc:${WVARS[w][4]}"><span class="fine">${esc(WORLDS[w].name)}</span><b>${rkIcon(wRank(x))} ${wRank(x)}</b><span class="fine num">${x} XP · ${(p.worlds[w] || {}).plays || 0} games</span></div>`; }).join("")}</div><div class="fine" style="margin-top:8px">Cross-category matches: ${p.mix.played} played, ${p.mix.won} won.</div></div>
  <div class="card"><div class="label">Profile picture</div><p class="fine">Anyone in your Dex can be your picture. Locked ones unlock when you get them right three times.</p><div class="avpick" style="margin-top:8px">${avs.map(({ w, x }) => { const k = w + ":" + x.id, ok = dexHas(k) || STARTER(k); return `<button type="button" class="${p.avatar === k ? "on" : ""} ${ok ? "" : "locked"}" ${ok ? `data-av="${k}"` : `title="Get ${esc(x.n)} right 3 times"`}><img src="${imgOf(x)}" alt="" class="${isCut(x) ? "cutpic" : ""}">${ok ? esc(x.n) : "Locked"}</button>`; }).join("")}</div></div>
  <div class="card"><div class="label">Achievements ${Object.keys(p.ach).length} of ${ACH.length}</div><div class="achgrid" style="margin-top:8px">${ACH.map(([id, n, d, t, ic]) => `<div class="achv ${p.ach[id] ? "on" : ""}" style="--tc:${TIERS[t][1]}"><svg class=ic><use href=#i-${ic}></use></svg><b>${esc(n)}</b><span class="fine">${esc(d)}</span><span class="fine" style="color:${TIERS[t][1]}">${TIERS[t][0]}</span></div>`).join("")}</div></div>`;
}
function renderSettings() {
  const g = (k, d) => { try { return localStorage.getItem(k) || d; } catch (e) { return d; } };
  $("#setRoom").innerHTML = `<div class="hero"><h1><em>Settings</em></h1></div><div class="card"><div class="label">Sound</div><div class="row" style="gap:8px;margin-top:8px">${["Off", "Soft", "Full"].map((n, i) => `<button class="chip" data-snd="${i}" aria-pressed="${Snd.level === i}">${n}</button>`).join("")}</div><div class="label" style="margin-top:14px">Lobby music</div><div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-mus="1" aria-pressed="${!!Snd.music}">On</button><button class="chip" data-mus="0" aria-pressed="${!Snd.music}">Off</button></div><p class="fine">Every world has its own music, played live in your browser.</p><div class="label" style="margin-top:14px">Sidekick</div><div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-mas="on" aria-pressed="${g("gp_mascot", "on") === "on"}">On</button><button class="chip" data-mas="off" aria-pressed="${g("gp_mascot", "on") === "off"}">Off</button><button class="chip" data-voice="${g("gp_voice", "0") === "1" ? "0" : "1"}" aria-pressed="${g("gp_voice", "0") === "1"}">Read lines aloud</button></div></div><div class="card"><div class="label">Photo credits</div><p class="fine">Every picture comes with its author and licence on the answer card. K-pop, geography, history and food pictures are from Wikimedia Commons (free licences or public domain), facts from Wikidata (CC0). Football data and crests come from ballknowledge (Transfermarkt CC0 data; crests and player photos shown only to identify them).</p></div>`;
}

/* ================= two devices: ballknowledge's MQTT rooms; the host runs the game and sends the state ================= */
const Net = {
  role: null, code: null, mq: [], seen: new Set(), guestName: "", hostName: "",
  names() { return [this.hostName || "Host", this.guestName || "Guest"]; },
  open(code) { this.code = code; this.mq = BROKERS.map((u) => mqttConnect(u, "gamesite/v1/" + code, (m) => this.recv(m), () => this.paint())); },
  send(m) { m.id = Math.random().toString(36).slice(2); m.from = this.role; this.mq.forEach((c) => { try { c.send(m); } catch (e) { /* broker down */ } }); },
  recv(m) { if (!m || this.seen.has(m.id) || m.from === this.role) return; this.seen.add(m.id);
    if (this.role === "host") { if (m.k === "hello") { this.guestName = m.nick || "Guest"; Snd.win(); addPlay(S.world); this.send({ k: "go", host: prof().nick || "Host", hav: prof().avatar }); Vs.match({ nick: prof().nick || "Host", avatar: prof().avatar }, { nick: this.guestName, avatar: m.av || "" }, () => newQuiz(S.world, S.game, "online")); } else if (m.k === "buzz") buzz(1); else if (m.k === "ans") submitAnswer(m.p, m.t); }
    else if (m.k === "go") { Vs.match({ nick: m.host, avatar: m.hav || "" }, { nick: prof().nick || "Guest", avatar: prof().avatar }, () => {}); }
    else if (m.k === "state") { if (Vs.on && !Vs.matched) Vs.close(); this.hostName = m.host; Q.s = Object.assign(m.s, { used: new Set() }); if (S.world !== m.s.w || S.game !== m.s.game) { S.world = m.s.w; S.game = m.s.game; renderWorld(); } renderQuiz(); }
  },
  sync() { if (this.role !== "host" || !Q.s) return; const s = { ...Q.s }; delete s.used; this.send({ k: "state", s, host: prof().nick || "Host" }); },
  close() { this.mq.forEach((c) => { try { c.close(); } catch (e) { /* closed */ } }); this.mq = []; this.role = null; },
  paint() {},
};
function openOnline() {
  $("#roomBox").innerHTML = `<div class="card" style="margin-top:12px"><div class="label">Two devices</div><div class="row" style="gap:10px;flex-wrap:wrap;margin-top:8px"><button class="btn" id="mkRoom" type="button">Create a room</button><span class="fine">or</span><input id="roomCode" maxlength="4" placeholder="CODE" style="width:90px;text-transform:uppercase"><button class="btn ghost" id="joinRoom" type="button">Join</button></div><div id="roomMsg" class="fine" style="margin-top:8px"></div></div>`;
}
const codeChars = "ABCDEFGHJKLMNPQRSTUVWXYZ";
function makeRoom() { const code = Array.from({ length: 4 }, () => rnd([...codeChars])).join(""); Net.role = "host"; Net.open(code); Vs.wait(code, S.game); }
function joinRoom() { const c = ($("#roomCode").value || "").trim().toUpperCase(); if (!/^[A-Z]{4}$/.test(c)) { toast("Type the 4-letter code"); return; } Net.role = "guest"; Net.open(c); setTimeout(() => Net.send({ k: "hello", nick: prof().nick || "Guest", av: prof().avatar }), 1200); Vs.join(c); }
function flashEdge(ok) { const d = document.documentElement; d.classList.remove("fl-ok", "fl-no"); void d.offsetWidth; d.classList.add(ok ? "fl-ok" : "fl-no"); }

const Account = { signedIn: false }, Ranked = { elo: 1000 }, myBadges = () => [], badgesHTML = () => "", inviteLink = (code) => location.href.split("#")[0] + "#join-" + code;
const rankOf = (elo) => { const r = WRANKS.find(([m]) => elo - 1000 >= m) || WRANKS[WRANKS.length - 1]; return { name: r[1], icon: rkIcon(r[1]) }; };
Net.linked = () => Net.mq.some((c) => c && c.open);
/* ================= events ================= */
document.addEventListener("click", (e) => {
  const t = e.target.closest("button,[data-go]"); if (!t) return; Snd.unlock();
  if (t.dataset.go) { Snd.tick(); const to = t.dataset.go; if (to.startsWith("w-") && to.split("-").length === 2) { loadingScreen(to.slice(2), () => go(to, e)); return; } go(to, e); return; }
  if (t.dataset.game) { Snd.tick(); go(`w-${S.world}-${t.dataset.game}`, e); return; }
  if (t.dataset.diff) { S.diff = t.dataset.diff; try { localStorage.setItem("gp_diff", S.diff); } catch (x) { /* blocked */ } Snd.tick(); document.querySelectorAll("[data-diff]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.diff === S.diff)); $("#diffNote").textContent = DIFFNOTE[S.diff]; return; }
  if (t.dataset.mode) { startMode(t.dataset.mode); return; }
  if (t.id === "gamesBack") { if (Q.s && Q.s.mix) { Q.s = null; go("mix"); return; } go("w-" + S.world); return; }
  if (t.id === "qB0") { buzz(0); return; } if (t.id === "qB1") { buzz(1); return; }
  if (t.id === "qGuess") { submitAnswer(null); return; } if (t.dataset.sug) { submitAnswer(t.dataset.sug); return; }
  if (t.id === "qNext") { if (Net.role === "guest") return; if (Q.s.mix) { Q.s.mixW = Q.s.mixW || []; Q.s.mixW[Q.s.round - 1] = Q.s.result.winner == null ? -1 : Q.s.result.winner; } nextRound(); return; }
  if (t.id === "qFinish") { if (Net.role === "guest") return; if (Q.s.mix) { Q.s.mixW[Q.s.round - 1] = Q.s.result.winner == null ? -1 : Q.s.result.winner; } finishQuiz(); return; }
  if (t.id === "qAgain") { if (Q.s && Q.s.mix) { go("mix"); return; } startMode(Q.s.mode); return; }
  if (t.dataset.hol) { answerHol(t.dataset.hol); return; }
  if (t.id === "hNext") { if (H.s.mode === "solo" && H.s.over) { H.s.phase = "done"; renderHol(); return; } if (H.s.mode === "duo") { if (H.s.over) { H.s.phase = "done"; award("duo"); renderHol(); return; } H.s.turn = 1 - H.s.turn; } nextHol(); return; }
  if (t.id === "hAgain") { newHol(H.s.mode); return; }
  if (t.id === "mxStart") { try { localStorage.setItem("gp_names", JSON.stringify([$("#n0").value || "Player 1", $("#n1").value || "Player 2"])); } catch (x) { /* blocked */ } MX.s.stage = "pick"; renderMix(); return; }
  if (t.dataset.mx === "pick") { mixPick(t.dataset.w); return; } if (t.dataset.mx === "ban") { mixBan(t.dataset.w); return; }
  if (t.dataset.coll) { S.coll = t.dataset.coll; renderCollection(); return; }
  if (t.dataset.av) { const p = prof(); p.avatar = t.dataset.av; saveProf(); award("avatar"); paintProfileBtn(); renderProfile(); return; }
  if (t.dataset.snd) { Snd.setLevel(+t.dataset.snd); renderSettings(); return; } if (t.dataset.mus) { Snd.setMusic(t.dataset.mus === "1"); renderSettings(); return; }
  if (t.dataset.mas) { try { localStorage.setItem("gp_mascot", t.dataset.mas); } catch (x) { /* blocked */ } Mascot.dock(); renderSettings(); return; }
  if (t.dataset.voice) { try { localStorage.setItem("gp_voice", t.dataset.voice); } catch (x) { /* blocked */ } renderSettings(); return; }
  if (t.id === "audReplay") { const n = shownCount(); Aud.play(0, n >= 5 ? 30 : n >= 2 ? 8 : 3); return; }
  if (t.id === "roGo") { rouSay(); return; } if (t.id === "roNext") { if (RO.s.mode === "solo" || RO.s.round >= 3) { RO.s.phase = "done"; if (RO.s.mode === "duo") award("duo"); renderRou(); } else nextRou(); return; } if (t.id === "roAgain") { newRou(RO.s.mode); return; }
  if (t.dataset.kick) { const p = prof(); p.kick = p.kick || {}; p.kick[S.world] = t.dataset.kick; saveProf(); const d = $("#mascot"); if (d) d.dataset.who = ""; Mascot.dock(); Mascot.hello(); renderHub(); return; }
  if (t.dataset.gamut) { const mix = shuffle(WORLD_IDS).map((w) => ({ w, g: rnd(GAMES[w].filter((g) => g.kind === "clue" || g.kind === "blur")).id })); loadingScreen(mix[0].w, () => { show("league"); renderWorldFor(mix[0].w); $("#crumbs").innerHTML = `<button class="back" data-go="home" type="button">← Menu</button>`; newQuiz(mix[0].w, mix[0].g, "solo", mix); Q.s.gamut = true; }); return; }
  if (t.id === "mkRoom") { makeRoom(); return; } if (t.id === "joinRoom") { joinRoom(); return; }
  if (t.id === "brand") { go("home", e); return; }
});
document.addEventListener("input", (e) => { if (e.target.id === "qIn") paintSuggestions(); if (e.target.id === "nick") { prof().nick = e.target.value.slice(0, 16); saveProf(); paintProfileBtn(); } });
document.addEventListener("keydown", (e) => {
  if (e.target.id === "roIn" && e.key === "Enter") { e.preventDefault(); rouSay(); return; }
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
