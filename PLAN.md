# New games platform: concept draft v0.1

*21 November 2026. This is a concept draft, not a build plan, and nothing in ballknowledge has been changed. Points marked **⚑ DECIDE** are yours to call. The most important ones are polled at the end.*

---

## 0. The idea in one line

**A single gaming world where what you know becomes who you are.** Your profile, sidekick and collection come from the subjects you love, and a draft-style match lets a K-pop fan and a football fan compete on equal terms.

My honest view after reading the brief: the strongest, most original idea is **the cross-category draft combined with an identity built from knowledge**. The rest (Elo, achievements, outfits, loading screens) is good but standard. Every phase below protects those two ideas first and keeps everything else lean until they work.

---

## 1. What ballknowledge already gives us (audit)

Read from `~/Desktop/football-prediction-model` (README diary, `site/`, `online/`, `src/30_build_arena.py`, built `docs/`).

### Worth keeping (concepts and code to generalise)

| What exists | Where | Verdict |
|---|---|---|
| Quiz mechanics: Who am I?, Career path, Badge blur, Scramble, Higher or lower, Tic-tac-toe, Rank the five, Career timeline, Where did they finish? | `site/arena_template.html`, `site/nba_overlay.js` | **Generalise.** These are already "mechanic plus data". They become the engine's first mechanics. |
| Solo streak, duel buzzer race and closest-guess modes on one device or two | arena template | **Keep the design, rebuild the plumbing** (see limits) |
| Online rooms: 4-letter code or link, MQTT over three public brokers, BroadcastChannel for tabs | `mqttConnect`, `BROKERS` (arena template about l.3941) | Fine for casual play. **Not enough for ranked play** (see limits) |
| Ranks: Bronze to Legend Elo bands, Elo history chart, leaderboards (all time / week / today) | `RANKS` (l.2402), `online/schema*.sql` (`elo_top`, `my_elo_history`, `report_match`) | **Keep the feel, change the maths** to per-category ratings (section 8) |
| One Supabase login with separate schemas per sport (`public`, `nba`, `chess`); friends, lobbies, reports, admins, idea votes | `online/schema*.sql` | **Redesign** as a single schema keyed by category, not one copy per sport |
| Sidekicks: 6 original object mascots (Old Boot, Ref Rita, Bench, Rim, Shot Clock, Sneak) plus chess coaches (Pip); moods (happy, wow, sad, calm); about 1,355 voiced lines | `site/mascots.js`, `mascot_lines.js`, `coach_lines.js`, `src/80_make_voice.py` (Kokoro), `src/83_make_voice_cb.py` (Chatterbox) | **Keep the style** (a personified object from each world) and **the voice pipeline**. This is the platform's DNA. |
| Outfits that unlock by rank or achievement (Silver, Gold, Fire aura, Party hat, Neon, Crown) | `OUTFITS` in `mascots.js` | **Generalise** into the cosmetics catalogue |
| Collectible loading screens with rarity (Common to Legendary) plus the hidden "Notebook" secret | chess and football templates | **Keep.** This is already the collectible system in small form. |
| Settings: carousel cards that preview a sidekick's voice, outfits, looks, text size, audio mixer, lite mode and reduced motion | `site/settings_ui.js` | **Keep the pattern** |
| Daily challenges, streak, 14-day calendar; challenge a friend; result cards; monthly recap | arena template | **Keep** and make them cross-category |
| Honest data pipelines (Transfermarkt CC0, Wikidata, Lichess CC0, ESPN via sportsdataverse) with audits (`46_audit_quiz_data.py`, `48_crosscheck_wikidata.py`) | `src/` | **Keep the method.** Each category gets a pipeline plus an audit script. |
| Artwork policy: third-party badges and photos are git-ignored, used only as identification with credit and a takedown route, and removable with `--no-artwork` | `30_build_arena.py` | **Keep as a platform rule** |
| PWA (manifest, service worker), light/dark/auto looks, animations using only transform and opacity | `docs/` | **Keep** |

### Current limits (why the new site shouldn't copy the architecture)

1. **Copied templates.** `nba_template.html` is a fork of the football one, and the README notes that generic fixes have to be copied across by hand. With 20 or more categories this breaks down. The new site needs **one engine with many content packs**.
2. **Huge single bundles.** The built JavaScript is 12 MB for football, 6 MB for chess and 4 MB for basketball, with 64 MB of voice clips. Every category has to **load its data lazily, game by game**.
3. **A 4,400-line template.** It works, but adding a category means editing it everywhere.
4. **Public MQTT brokers.** They're free and clever, but nobody guarantees they stay up, any client can read a room, and nothing stops cheating. That's fine for casual rooms. **Ranked online play needs a server that checks results** (Supabase Realtime plus a database function that scores the round).
5. **Answers live in the browser bundle.** Anyone can open developer tools and see them. That's acceptable for solo play, but not for ranked play against people.
6. **Per-sport database schemas.** `public`, `nba` and `chess` each repeat profiles, progress and Elo tables. Twenty categories would mean twenty schemas.
7. **Not tested yet** (from the diary): real two-device play and chess accounts on the live database.

---

## 2. Brand name ideas

I haven't checked domains or trademarks for any of these; that's a step for later. Grouped by style:

| Name | Style | Strengths | Weaknesses |
|---|---|---|---|
| **Gamut** | Real word ("the whole range") | Short and grown-up; it literally means "every subject"; "run the gamut" works well for a cross-category mode | An abstract word; probably busy in trademarks |
| **Niche** | Real word | Says "interests become identity" exactly ("Every niche. One arena.") | Can sound small; also a common startup name |
| **Rabbit Hole** | Phrase | Discovery, curiosity, playful; the mascot almost writes itself | Long; "rabbit hole" can sound negative (time sink) |
| **Lorebox** | Compound | "Lore" covers sports, K-pop, history and games; "box" suggests collectibles | "Lore" leans towards fantasy or gaming |
| **Knowhere** | Pun | Memorable, fits a map/explorer theme, "know-where" | Hard to say aloud; easily confused with "nowhere" |
| **Wits** | Short word | Punchy; "battle of wits"; makes a good app icon | Very likely taken |
| **Quorra / Kudo / Vexa** | Made up | Easy to own as a trademark, short, room for a strong logo | Means nothing until the brand gives it meaning |
| **moknows** | Family bridge | Keeps the ballknowledge lineage ("mo" plus "knows"); you already own the "mo" identity | Ties the brand to a person; you asked for independence |
| **Fandom Arena / Clash of Fans** | Descriptive | Clear right away | Generic; "Fandom" is a big existing company |

**My shortlist:** Gamut (it says what the product is) or a made-up name (easiest to own). **⚑ DECIDE** the naming direction before any logo work.

**Design direction (changed 21 Nov 2026, the user's call):** drop the minimal look completely. Go all in like ballknowledge's football section and higherlowergame: real photos everywhere (drifting photo walls, full-bleed posters, split-screen versus and higher-or-lower rounds), night-arena backgrounds with light beams and glow, huge condensed headlines (Big Shoulders Display), mono name labels, handwritten notes, trading cards with a holo effect. Prototype images come from `pipelines/fetch_proto_images.py` (Wikimedia Commons, free licences only, credits in `proto_assets/credits.json`) plus the ballknowledge football cutouts.

~~**Visual identity proposal (superseded):**~~ a neutral, Apple-calm base (off-white or near-black, one geometric sans such as Inter or SF-like for the interface, one display face for headings) with **one accent colour per category** that fills the screen when you enter that world. Logo idea: a mark that **changes colour or fill depending on the category you're in**, so the brand itself shows "one platform, many personalities". This pairs with the platform mascot idea in section 6.

**What carries over from ballknowledge:** the floodlit/neon looks become *category themes* (football keeps Floodlit, basketball keeps the neon court, chess keeps Cyber/Classic). The new home and shell stay calm and minimal. The personality lives inside each world.

---

## 3. The three layers

```
Platform (brand, home, account, profile, friends, overall rating, wallet of collectibles)
  └─ Category (manifest: name, accent, mascot, theme, packs, category rating, category achievements)
       └─ Game = Mechanic × Content pack × Mode
```

The key design choice is to **separate *mechanic* from *content*.**

- A **mechanic** is code: Blur reveal, Clue ladder, Order it, Higher or lower, Map pin, Grid (tic-tac-toe), Connections, Audio clip, Timeline, Odd one out.
- A **content pack** is data: JSON from a pipeline, with a source, a licence and an audit. Examples: "K-pop groups → logo images", "Historical figures → clues", "Countries → flags".
- A **mode** is how it's played: solo streak, solo timed, duel buzzer, duel closest-guess, async challenge, or a draft round.

"Badge blur" then becomes *Blur reveal × football-crests*, "Flag blur" becomes *Blur reveal × flags*, and "Idol blur" becomes *Blur reveal × K-pop-photos*. **Adding a category means writing a manifest and some packs, with no new code**, unless it needs a new mechanic.

Each pack row carries `difficulty` (from real popularity such as Wikipedia page views or Wikidata sitelinks, the way ballknowledge uses `FAME`), `source`, `licence` and `credit`. These fields are what make the cross-category draft fair (section 7).

---

## 4. Categories, the games they reuse, and their data

Licences are from my knowledge as of mid-2026. **Anything marked "check" must be confirmed before use.** Where no clean source exists I say so instead of filling the gap.

### Launch candidates (clean data, strong reuse)

| Category | Reused mechanics (from ballknowledge) | Data source and licence |
|---|---|---|
| **Football** | Everything existing: Who am I?, Career path, Badge blur, Higher or lower, Tic-tac-toe, Starting XI, Beat the Model | Existing pipelines: Transfermarkt dataset (CC0), football-data.co.uk, Wikidata (CC0). Crests stay under the identification policy. |
| **Basketball** | Same set as football plus Rank the five and Career timeline | Existing: ESPN box scores via sportsdataverse, Wikidata |
| **Chess** | Name the opening, Who is this player?, puzzles, Human bar, Spot the tactic | Existing: Lichess database and puzzles (CC0), lichess-org/chess-openings (CC0), Stockfish (GPL, already credited) |
| **Geography** | Flag blur, Who am I? (country from clues), Higher or lower (population, area), Tic-tac-toe (continent × language × …) | Flags: Wikimedia Commons SVGs (mostly public domain, check each file) or the `flag-icons` library (MIT). Borders and maps: Natural Earth (public domain). Facts: Wikidata (CC0). Place names: GeoNames (CC BY 4.0). |
| **History** | Who am I? (historical figures), Timeline (reuses Career timeline), Higher or lower (which came first) | Wikidata (CC0) for people, dates and events; Commons portraits (pre-1900 paintings are usually public domain, check each one) |
| **General knowledge** | Clue ladder, Higher or lower, Odd one out | Open Trivia DB (CC BY-SA 4.0, needs attribution and share-alike; check). Wikidata-generated questions. |

### Strong but with licensing care

| Category | Reused mechanics | Data and the problem |
|---|---|---|
| **K-pop** | Who am I? (idols), Logo blur (groups), Career timeline (debut years), Higher or lower (members, debut year), Tic-tac-toe (agency × generation × …) | Facts: Wikidata and MusicBrainz (both CC0) for groups, members, debut dates, agencies and discographies. **Photos:** Commons has many CC BY-SA idol photos (several from Korean government Flickr accounts, check each one); coverage of smaller groups will be thin and **I won't invent filler**. **Group logos:** trademarks with no licensed source, so they'd follow the same identification-only policy as football crests, and supply is uncertain (check). **Music:** see the audio note below. |
| **Food** | Who am I? (dish from clues), Image blur (dish photo), Odd one out (ingredients) | Wikidata dishes (CC0) plus Commons photos (CC BY-SA, check). TheMealDB has a free test key but **public use needs a paid tier (check)**. Open Food Facts (ODbL) for packaged products. |
| **Art** | Image blur (painting), Who painted it?, Timeline | **Very clean:** Met Museum Open Access (CC0) and Art Institute of Chicago API (CC0) |
| **Science** | Clue ladder (element or scientist), Higher or lower (atomic number, discovery year) | PubChem periodic table (US government, public domain), Wikidata |
| **Movies / TV** | Clue ladder, Timeline, Blur (posters are a problem) | TMDB API (free with attribution, **non-commercial terms, check**). Posters are copyrighted, so text clues are safer. |
| **Anime** | Same as above | AniList API (free, **terms limit commercial use, check**). Character art is copyrighted. |
| **Formula 1** | Career path (driver teams), Higher or lower, Grid (team × era) | Jolpica-F1 (the community successor to Ergast, free, check terms) |
| **Tennis** | Career path, Higher or lower | Jeff Sackmann `tennis_atp` and `tennis_wta` (**CC BY-NC-SA**, so it can never be used commercially) |
| **Languages** | Guess the language from a sentence, Odd one out | Tatoeba sentences (CC BY 2.0 FR), Wiktionary (CC BY-SA) |
| **Literature** | First line → book, Who wrote it? | Project Gutenberg (public-domain texts), Open Library (CC0 data) |
| **Architecture / Landmarks** | Image blur, Map pin | Wikidata plus Commons photos (check each one) |

**⚠ Audio ("guess the song").** I don't know of any free, licensed source of real song clips for a public quiz. Spotify stopped giving preview URLs to new apps in late 2024. Deezer and iTunes previews exist, but their terms limit this kind of use (check before relying on them). **Recommendation:** no real-song audio at launch. Music games instead use metadata (album → year, lyric-free clues, discography timelines from MusicBrainz) and *original* sounds. If you want real audio, it needs an official licence. **⚑ DECIDE.**

### Suggested additional categories
Mythology (Wikidata, public-domain art), Brands and logos (trademark problems, so skip), **Space** (NASA imagery is public domain), **Animals** (iNaturalist CC photos, check each one), Video games (IGDB, check terms), Cars, Olympics (Wikidata), Board games.

### Organisation
Group categories into **4 "worlds"** on the home page (Sports, Entertainment, Knowledge, Culture) only once there are more than about 8 categories. Until then, a single grid of category tiles is calmer.

---

## 5. New game ideas

### Platform-wide new mechanics
- **Connections:** 16 tiles, 4 hidden groups. It works in any category, and it's the heart of the cross-genre mode (groups that mix categories).
- **Odd one out (with a why):** pick the odd item, then pick the reason. Two-step answers reward real knowledge over guessing.
- **Pin it:** drop a pin on a map (geography, history battles, football stadiums, K-pop agency HQs). Points depend on distance. Natural Earth maps.
- **Timeline drop:** drag cards into chronological order (history events, K-pop debuts, chess world champions, football transfers).
- **Pixel to photo:** an image goes from 8×8 pixels up to full resolution. It's a different feel from blur and suits small screens.
- **Chain:** each answer must link to the previous one (footballer → club → teammate…, idol → group → agency → another group). A natural fit for duels.
- **Estimate:** closest guess to a real number (already the duel style in ballknowledge).

### Category-specific
| Category | New idea |
|---|---|
| **K-pop** | *Line distribution* (guess which member had the most lines, if a real licensed dataset exists, **check, otherwise drop**); *Generation sort* (1st to 5th gen); *Lightstick match* (only if images are licensed); *Fandom names* (group ↔ fandom) |
| **Geography** | *Border to border* (connect two countries through land borders, Natural Earth adjacency); *Shape only* (country outline); *Capital rush* (timed) |
| **History** | *Who lived first?*; *Overlap* (were these two people alive at the same time?, Wikidata dates); *Headline year* (three real events → the year) |
| **Football** | Existing ones plus *Transfer chain* and *Tactics board* (place the formation of a famous final, using `49_build_xi.py` data) |
| **Food** | *Ingredient reveal* (ingredients revealed one at a time); *Where's it from?* (dish → country on the map, combining with Pin it) |
| **Chess** | Existing ones plus *Guess the Elo* (already done as "estimate my Elo"); *Famous position → which game* |
| **Art** | *Zoom out* (start from a tiny detail of a CC0 painting) |

### Cross-genre (the flagship)
- **Category Draft.** Each player picks 3 categories, then each bans 1 of the opponent's picks (4 left + a wildcard = best of 5). The remaining pool is shuffled. Both players vote on mechanics (if they vote the same way it locks in, if they differ a coin-flip animation decides). Best of 5 rounds, with the **same questions shown to both players at the same time**.
- **Variants as toggles, not separate modes:** Blind draft (hide your opponent's picks), Wildcard round 5 (a random category), Equal ground (the system picks). "My interests vs yours" is simply a draft where your saved favourites are picked for you.
- **Gamut Run** (solo): 10 rounds in 10 different categories. It's the daily cross-genre test and feeds the "versatility" rating.
- **Mixed Connections:** groups that cut across categories ("things that are red: Liverpool, the Korean flag's taegeuk half, a ruby, Ferrari").

**Pushback:** I'd **cut** Category Domination and Mixed Knowledge as separate modes because they overlap with Draft plus toggles. **Spectator mode** also waits: high cost, little gain for now.

---

## 6. Mascots, identity, collectibles

### Mascots
House style, kept from ballknowledge: **personified objects from each world**, original characters with a short life story and one voice each (Kokoro or Chatterbox, which you already use).

- **Platform mascot (new idea):** a **chameleon** whose skin takes on the accent colour of the category you're in. It's the brand's face and literally "interests become identity". The alternative is a blank game piece (a pawn or token) that dresses up for each world.
- Football: Old Boot / Ref Rita / Bench (existing). Basketball: Rim / Shot Clock / Sneak (existing). Chess: Pip (existing coach).
- **K-pop: "Bongi"**, a lightstick who's sure every song is a comeback; bright, fan-chant energy.
- **Geography: "Pin"**, a map pin who's never been where it is now.
- **History: "Tock"**, an hourglass who's lived through everything and remembers half of it.
- **Food: "Dumpling"**, a dumpling who's a very strict judge.
- **General knowledge: "Dog-ear"**, the folded corner of an encyclopedia page.
- **Art: "Smudge"**, a paint blob that never stays in shape.
- **Science: "Flask"**, a beaker that gets over-excited (bubbles over on a right answer).

⚠ Kokoro has no Korean voice as far as I know (check). Bongi would speak English with a few Korean words. Any Korean should be checked by a native speaker, never guessed.

### Identity
- **Profile:** avatar, frame, banner/background, title, equipped mascot plus skin, **showcase** (pick 3: an achievement, a card and a rating), favourite categories, and a "knowledge fingerprint" radar of your category ratings.
- **Onboarding:** pick 3 favourite categories (shown as mascot portraits, not a list). This shapes recommendations and the default draft only. Every category stays open.

### ⚠ The biggest problem in the brief: real people as profile pictures
Showing a footballer or K-pop idol photo *inside a quiz* is identification, the same as ballknowledge's current policy. **Letting users pick that photo as their personal avatar is different.** It uses someone's likeness for decoration, which runs into publicity and personality rights (strong in South Korea), and most Commons photos are CC BY-SA, so they'd need credit on every avatar. **My recommendation:**
- Profile pictures are **original artwork**: mascots, skins, category emblems, and **stylised "fan badges"** (for example "Fan of [group]" as a typographic badge in the group's colours, never their logo or photo).
- Public-domain figures (historical portraits, old masters) **can** be avatars.
- Real athletes and idols appear on **cards in the Dex** (below), shown as identification with credit, not as your face.

**⚑ DECIDE.** This is the one place where I'd push back on the brief.

### The Dex (my main new idea for collectibles)
Instead of collecting random loot, **you collect what you know.** Get an idol, a flag, a painting or a footballer right 3 times across games and its card goes into your Dex for that category. **A card's rarity is the real share of players who own it**, so it can't be faked or bought. Before there are enough players, rarity is based on the item's difficulty tier. This ties identity directly to knowledge ("I've collected 140 of 196 flags"), gives you a reason to come back, and replaces a separate card system.

### Rarity and cosmetics
Common → Uncommon → Rare → Epic → Legendary → Mythic, plus the existing **Secret** tier (like the Notebook). Rarity is shown through the frame finish and particle effect, never through power. **No paid items, nothing that changes gameplay.** Mythic is reserved for the hardest feats (for example a Legend rank in 3 categories).

### Achievements (additions to yours)
- *Polyglot of Fandoms:* win a draft round in a category you've never played.
- *Upset:* beat someone 300+ rating points above you in their own drafted category.
- *Full Dex:* complete one category's Dex (for example every UN member flag).
- *Gamut:* reach Gold in 8 categories.
- *Ambassador:* someone you invited completes their first draft match.
- *Rivalry:* 10 matches against the same friend.
- *Fair play:* 50 online matches without leaving early.

Every achievement has an icon, rarity, progress bar and unlock animation, and hidden ones stay secret until found.

### Loading screens
Keep the ballknowledge system (Common to Legendary plus Secret, "New! x of N"). New twist: **in a lobby, each player's equipped loading screen shows up on their half of the versus screen**, so your collection becomes part of the match intro.

---

## 7. Match lobby and draft flow

1. **Versus screen:** two halves in each player's own category colours, avatar, frame, title, equipped mascot. Each mascot says one intro line (from the voiced bank).
2. **Draft:** 3 picks each (simultaneous) → 1 ban each → 4 categories + 1 wildcard, revealed with a card-flip animation.
3. **Vote:** a 10-second simultaneous vote on mechanics per category, with a coin-flip on a tie.
4. **Rounds:** same questions for both players. Rounds are scored as **won or lost**, not raw points, because point scales differ by game.
5. **Result:** round-by-round strip, rating changes per category, Dex cards earned, achievements, mascot reactions.

On **one device** the flow is the same with pass-and-play screens ("hand it to Sam" cover screens so picks stay hidden). Ballknowledge's typed names (`shared_names.js`) carry over.

**Fairness problem:** each player drafts their strengths, so it can become "I win mine, you win yours". The tie-breaker round (the 5th, wildcard) decides, which is good drama. Use question difficulty from the pack's popularity scores so both players get the same difficulty mix.

---

## 8. Ratings (one formula per format, as you asked)

| Rating | How | Why |
|---|---|---|
| **Per-category rating** (solo and duels) | **Glicko-2** instead of plain Elo | Most players will have played a category only a few times. Glicko tracks uncertainty, so new categories don't swing wildly or get stuck. Displayed with the existing Bronze to Legend bands. |
| **Draft rating** (cross-category matches) | Elo per player on match results | Simple, familiar, and it's head-to-head |
| **Versatility score** | Average of your **top 8** category ratings (a category not played counts as the floor) | Rewards breadth without punishing specialists, who still top their own category boards |
| **Game personal bests** | Records and streaks per game | No rating needed |

Leaderboards: per category, draft, versatility, and friends-only. Cosmetics never affect any of them.

**⚑ Note:** ballknowledge's `18_test_elo_formats.py` already shows you test rating formulas properly. The same approach applies here once there are real matches; until then these are proposals, not tuned numbers.

---

## 9. Home page and navigation

Bottom bar on mobile, top bar on desktop: **Play · Categories · Dex · Friends · Profile.**

- **Play (home):** one hero card, "Challenge someone" (draft). Below it: Today's Gamut Run, the daily set (3 categories), "Continue" (last game) and **one** suggestion from a category you haven't tried.
- **Categories:** a calm grid of category tiles, each with its mascot portrait and accent colour. Tapping one moves into that category's themed world (a colour-flood transition).
- **Category page:** mascot greeting, rating badge, Dex progress ring, games as cards (mechanic icon plus a one-line pitch).
- **Game intro:** an icon-led how-to (image first, one sentence), mode picker (Solo · Same device · Online).

That's 5 tabs and one primary action per screen, in line with the minimal brief.

---

## 10. Reuse vs rebuild

| Reuse as-is | Generalise | Rebuild |
|---|---|---|
| Python data pipelines and audit scripts (copy the method; football, NBA and chess outputs exported as JSON packs) | Quiz mechanics → mechanic modules | Single big template → component app |
| Voice pipeline (Kokoro, Chatterbox) and line banks | Mascots and outfits → catalogue of characters and cosmetics | Per-sport schemas → one category-keyed schema |
| Stockfish worker and chess board code | Loading screens and rarity → collectibles system | Ranked online play → Supabase Realtime plus server-side scoring |
| Artwork policy and `--no-artwork` switch | Daily challenges → cross-category daily | Everything loaded at once → lazy content packs |
| Look and motion rules (transform/opacity only, lite mode, reduced motion) | Settings carousel UI | Navigation and home |
| MQTT rooms (casual only, as a fallback) | Elo history chart → rating charts per category | Profile pages |

**The ballknowledge site stays exactly as it is.** Nothing gets moved out of it; the new project copies and adapts.

---

## 11. Repo, stack and hosting (proposal)

- **New repository** (name after the brand), separate from `football-prediction-model`.
- **Stack ⚑ DECIDE:**
  - (a) **Vite + TypeScript + Svelte** (or Preact): small, fast, real components and per-route code splitting. Static output, so it still hosts on Vercel for free. *My recommendation.*
  - (b) Keep the Python-template approach: known and quick to start, but it repeats limits 1–3.
  - (c) Next.js: more power than needed; server features you probably won't use.
- **Backend:** Supabase (you already know it): Auth, Postgres (one `game` schema), Realtime for lobbies, database functions for scoring ranked rounds, Storage for images and voice. Free tier first; watch storage and bandwidth limits (64 MB of voice already, so serve compressed Opus clips).
- **Hosting:** a new Vercel project; custom domain once the name is chosen.

```
<brand>/
  app/                 # Svelte/TS front end
    shell/             # nav, theme, transitions, audio mixer
    mechanics/         # blur, clue-ladder, order, higher-lower, pin, grid, connections, timeline…
    modes/             # solo-streak, duel-buzzer, closest-guess, draft
    platform/          # profile, dex, cosmetics, achievements, lobby, friends
    mascots/           # SVG rigs, moods, line banks
  categories/
    football/manifest.json   # accent, mascot, theme, games = [mechanic+pack+modes]
    kpop/manifest.json …
  packs/               # built JSON content packs (lazy-loaded); raw files git-ignored
  pipelines/           # Python: one folder per category + audit script + SOURCES.md (licence, credit)
  db/                  # numbered SQL migrations (you paste them into the Supabase editor)
  voice/               # line banks + generator scripts
```

Every pack has a `SOURCES.md` entry (source, licence, credit, date fetched). A build step **refuses to ship a pack without a licence line**, which enforces the never-fake rule automatically.

---

## 12. Roadmap (a different order from the brief's, and why)

**Main change:** prove the cross-genre loop early with categories that have **clean data** (Geography, History), and do **K-pop after its licensing approach is settled**. Don't port all three sports in full before anything new exists.

| Phase | What | Done when |
|---|---|---|
| **0. Decisions** | Name direction, real-person avatar rule, stack, first categories (the polls below) | You've answered the polls |
| **1. Look and feel prototype** | An **interactive artifact** (no data): home, category grid, category page, versus screen, draft and vote, profile, one loading screen, chameleon mascot moods | You approve the design language |
| **2. Engine + 3 categories** | Mechanic/pack/mode framework; 4 mechanics (Blur, Clue ladder, Higher or lower, Timeline); **Football** (packs exported from ballknowledge), **Geography**, **History**; solo play only; lazy loading | Three categories playable solo on phone and desktop |
| **3. Same-device versus + draft** | Pass-and-play lobby, draft, ban, vote, rounds and results, with no network to debug | Two people on one phone can play a full draft |
| **4. Accounts and ratings** | Supabase schema, Glicko per category, versatility score, profiles, leaderboards | Signed-in play records ratings |
| **5. Online** | Realtime lobbies, room codes, server-scored ranked rounds, MQTT kept as the casual fallback | Two real devices finish a ranked draft (actually tested) |
| **6. Identity layer** | Dex, cosmetics and rarity, achievements, loading screens in lobbies, mascots and voices per category | A profile tells a story |
| **7. K-pop + more** | K-pop (with the agreed licence approach), Basketball and Chess packs, Food, Art, General knowledge, Connections and Pin it | Steady growth: one category per sprint |
| **Later** | Seasonal events, tournaments, rivalries, community goals, spectating | Based on real usage |

Ballknowledge carries on alongside throughout.

---

## 13. What to cut or delay (complexity check)

- **Delay:** spectating, tournaments, community challenges, animated avatars, mascot skin editor. Each is a project of its own.
- **Merge:** character cards → Dex; 9 match formats → Draft plus 3 toggles; trophy cabinet → profile showcase plus a Dex tab.
- **Keep from day one:** the licence-line build check, lazy loading, and transform-only animation. These are cheap now and expensive to add later.

---

## Prototype

Clickable look-and-feel prototype (no real data pipeline): https://claude.ai/artifact/NHQ1ifwVdP25KNfctqR1wK (source `games-platform/prototype.html`). It covers home, categories, a category page, the Dex, friends, the profile, and a full draft match against a simulated opponent: versus screen, pick 3, ban 1, wildcard, vote, five quick-fire rounds, result. All player figures are labelled as examples. The quiz questions are well-known facts written from memory for the mock-up only.

## Decisions made (poll of 21 Nov 2026)

1. **Name: a made-up name.** (Polled on 21 Nov: no favourite yet, so "Lumo" stays as a placeholder. Come back to this later.) Next shortlist to poll, none checked for domain or trademark yet: *Quorra, Kudo, Vexa, Zindo, Nuvo, Brimo, Lumo, Okko*. I'd like one that's two syllables, easy to say in Korean and English, and works as a one-letter icon.
2. **Real people as profile pictures: allowed.** Ways to reduce the risk, carried over from the ballknowledge artwork policy:
   - only photos with a free licence (Commons CC BY / CC BY-SA, public domain), with the credit available behind a tap on every avatar;
   - a report/takedown route on each one;
   - a build switch (like `--no-artwork`) that swaps every real-person avatar for the mascot in one command;
   - no paid or rare-tier real-person avatars (rarity stays on frames and effects, so nobody's likeness is sold or gated).
   Where no licensed photo exists, that person isn't offered as an avatar. Nothing gets made up to fill the gap.
3. **Stack: Python templates**, like ballknowledge. To avoid repeating its limits (section 1), the new build needs three rules from the start:
   - **one** engine template plus per-category manifests, with no forked templates;
   - content packs as separate JSON files fetched when a game opens, not inlined into one bundle;
   - each mechanic in its own JS file that the build stitches in.
   The repo layout in section 11 keeps `pipelines/`, `packs/`, `categories/` and `db/`. `app/` becomes `site/` templates plus `mechanics/*.js`.
4. **Categories: all of the ones listed, starting with K-pop.** The roadmap changes accordingly. Phase 2 becomes the engine plus **K-pop** (Wikidata/MusicBrainz facts first, then Commons photos where licensed). Football is ported in the same phase so the draft has two contrasting categories. The other categories follow one at a time. K-pop pieces without a licensed source (group logos, song audio) start out **missing and listed as missing**, not filled in.

## Open questions (in priority order)

1. **Name direction:** a real word (Gamut / Niche), a made-up name, or a family bridge (moknows)?
2. **Real people as profile pictures:** only original art plus public-domain figures (my recommendation), or allow real athletes and idols as avatars despite the likeness risk?
3. **Stack:** Svelte/TypeScript (my recommendation) or keep Python templates?
4. **First new categories:** Geography + History first and K-pop after licensing (my recommendation), or K-pop first?
5. *(Later)* Real song audio: skip it, or look into a paid licence?
6. *(Later)* Should ballknowledge eventually link to the new platform, merge into it, or stay fully separate?
7. *(Later)* Platform mascot: chameleon or game token?
