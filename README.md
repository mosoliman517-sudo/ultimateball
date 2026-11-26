# ultimateball: the games site

A games-only knowledge site spun off from ballknowledge (`~/Desktop/football-prediction-model`). It is built on that site's football page: the same CSS and look, round engine, sounds and lobby music, finale card, versus screens, MQTT rooms and sidekicks, copied into `site/` and extended to many categories.

## Build

```bash
python3 pipelines/build_packs.py            # real data + images for every category (slow: Commons asks for gentle downloads)
python3 pipelines/lineups.py                 # real starting XIs and starting fives from ballknowledge
python3 pipelines/kpop_names.py              # idols by stage name (Wonyoung, not Jang Won-young); the legal name still counts
python3 pipelines/kpop_songs.py              # K-pop songs, covers and 30-second previews from Apple (iTunes Search API); drops pre-2012 groups
python3 build.py                             # site -> docs/index.html + docs/img/
```

Preview: the `games-prototype` entry in `~/.claude/launch.json` serves this folder; open `/docs/index.html`.

## Check before pushing
```
python3 build.py && python3 -m unittest discover -s tests
python3 pipelines/kpop_audit.py
```
The build writes `docs/index.html` and `docs/data.<hash>.js` (the game data, cached for a year because its name changes with its content).

## Facts and security
- **Picture removal requests** arrive as GitHub issues. Add the item id (or image path) to `site/removed.json`, run the build, push, and close the issue. Older copies stay in git history; purge it too if the requester asks.
- `pipelines/fix_facts.py` holds the hand-checked corrections (country capitals, languages and currencies, what historical figures are known for, dish origins). The builder applies it on every write; edit it, not the packs.
- Anything from other players (public MQTT relay, challenge links) passes `cleanData()` in `site/bk_core.js` before use. Keep it that way for any new channel.
- Third-party scripts carry integrity hashes: change the hash when changing a version. Security and cache headers are in `vercel.json`.
- Restore point before the November 2026 audit: git tag `pre-audit-2026-11-25`.

## Layout

- `site/base.css`, `site/sprite.html`, `site/bk_core.js`, `site/mascot_art.js`, `site/mascot_lines.js`, `site/coach_lines.js`, `site/chess_coaches.js`: copied from ballknowledge, unchanged except where marked.
- `site/app.js`: categories, games, the generalised round engine, roulette, higher or lower, cross-category match, Gamut run, collection, profile, online rooms.
- `site/mascots_worlds.js`: the new sidekicks (Bongi, Maknae Mic, Pocha, Pin, Tock, Dumpling, Dog-ear, Neko) in ballknowledge's drawing style.
- `pipelines/`: data builders. Facts from Wikidata (CC0), Open Trivia DB (CC BY-SA 4.0) and ballknowledge's own data; pictures from Wikimedia Commons with author and licence on every answer card. Nothing is invented: an item without the facts a game needs is left out of that game.
- `db/001_accounts.sql`: accounts for the new Supabase project (run it in that project's SQL editor once it exists).

## K-pop

Younger groups only (debut 2015 on, plus BTS by request); groups from 2020 on weigh double so they come up most. Groups, idols and photos come from Wikidata/Commons (photos fetched at 960 px). Songs, album covers and previews come from Apple's catalogue (covers linked, not copied). "Bigger fandom?" uses English Wikipedia page views over the last 12 months. Photo rounds show the picture at once, with hints at one third and two thirds of the time.

## Features beyond the games

- **Accounts** (`site/social.js`): email and password through Supabase (project `qzskqkfidobxbxqlgexh`, separate from ballknowledge). Progress is merged with the browser's on sign-in and saved as you play. Run `db/001_accounts.sql` once in that project's SQL editor, and set Authentication → URL Configuration → Site URL to `https://moultimateball.vercel.app`.
- **Account emails** need two things set in the Supabase dashboard (only the project owner can): Authentication → URL Configuration → Site URL and Redirect URLs `https://moultimateball.vercel.app`; and either turn off Authentication → Sign In / Providers → Email → "Confirm email", or add your own SMTP sender (Supabase's built-in sender is limited to the project team and a few emails an hour).
- **Leaderboards**: on every game's start screen; your own best runs always, public boards (today, week, all time) when signed in with a leaderboard name.
- **Daily challenge**: one game per category, the same five rounds for everyone that day (seeded by the date), with a share line.
- **Home**: continue playing, daily challenges, and "For you" picks from what you play.
- **Wiki**: search every group, idol, song, country, player, event and invention; any underlined name opens its page.
- **Play chess** (`site/chessplay.js`): against Stockfish 17.1 lite (GPL-3, `site/engine/`, Stockfish 10 from a CDN as fallback) or a friend on one device.
- **Reveal games, anime and topic games**: zoom-out and tile reveals (`revealHTML` in `site/app.js`), "Hear the opening" (`pipelines/anime_openings.py`).
- **Adding content**: `pipelines/more_content.py anime|trivia|events`, `pipelines/player_photos.py`, `pipelines/bk_voices.py` (ballknowledge's Chatterbox lines).
- **Redemption round** (`site/redo.js`): solo quiz questions you miss come back, 1, 3, 7 and 16 days apart as you get them right, then retire.
- **Daily missions, combo effects** (`site/missions.js`, `site/gamefx.js`), from ballknowledge.
- **Outfits and guided tour** (`site/fits_tour.js`); **light/dark, share card, comeback calendar** (`site/extras.js`).
- **Chess training** (`site/chess_train.js`): puzzles and puzzle rush (Lichess puzzles, CC0; `pipelines/chess_puzzles.py`), endgame trainer (game review is in the chess room, below).
- **Ranked seasons, player links, watching live** (`site/online_extras.js`): shared boards and links need `db/003_seasons_profiles.sql` run once.
- **Sidekick voices** (`site/voice.js`, `pipelines/make_voices.py`): recorded clips in `docs/voice/`, one Kokoro voice per sidekick. Lines ballknowledge already recorded are copied (some are its expressive Chatterbox takes). Extra lines are in `site/more_lines.js`. After changing any line, run `~/Desktop/football-prediction-model/.venv-tts/bin/python pipelines/make_voices.py` and commit `docs/voice/`.

## K-pop data: one source, validated

`packs/kpop.json` is the only place group, idol and song facts live; every game reads it. Pipeline, in order:
`kpop_curated.py` (named groups only) -> `kpop_songs.py` (Apple catalogue, 2022 on, quota by tier) -> `kpop_rosters.py` (current/former line-ups, official counts, debut, agency, fandom, from the K-pop wiki's group pages) -> `kpop_images_fix.py` (removes shared or placeholder pictures) -> `kpop_photos_fandom.py` (member pictures) -> `kpop_audit.py`.
- **Audit:** `python3 pipelines/kpop_audit.py` blocks on: roster size != official count, parser misses, duplicate groups/members/songs, idols named like a song, unknown group references, missing picture files, one picture shared by different people. Output also in `packs/_kpop_audit.json`.
- **Admin:** `python3 pipelines/kpop_admin.py add-group|add-idol|add-song|set-members|former|check-images|validate` (see the file's header). Every edit is stamped with source, date and verification status and logged in `packs/kpop_changes.log`. No site code changes when content is added.
- **Games:** K-pop has no difficulty screen; every game draws from the whole eligible database through `Pick` (`site/social.js`): popularity, recency, cooldown across sessions, group spread, headcount balance, 18% legacy share. Roster games (Who's missing, Name every member, Member roulette, Name the group) only use groups whose line-up equals the official count.
- **Pictures:** a failed picture becomes a placeholder with the idol's own initial, never another person's photo.

## Rules

- Never invent data. Missing facts or pictures are left out and reported.
- No song lyrics: they are copyrighted and there is no licensed source.
- Every game plays the mechanic its name says. Answers are typed, with suggestions, like ballknowledge.

## Modes, party room, binder and languages (25 November)

Odd one out and Two songs at once (K-pop), Survival (three lives, harder every three questions), Mixed marathon, a Party room
for up to 8 players on their own devices (the host's device runs it; the answer is only sent at the reveal), a photocard binder,
"play a round that starts with this one" from search (press / to search), and German, French and Arabic menus (`site/i18n.js`,
not checked by a native speaker; questions, answers and voices stay English). `python3 pipelines/group_lines.py` rewrites the
sidekick lines about particular groups and idols; then run `pipelines/make_voices.py`.

Not tested yet: the party room across different networks and with more than two players, two songs playing together on iPhone.

## Difficulty levels and the anime ranking (26 November)

Each level is a share of the category with a cap on how many names it holds (`LEVEL_CAP` in `site/app.js`): Easy is the
household names, Hard leaves those out, Elite starts well below Medium and stops before the unknown tail. K-pop has no levels.
Anime is ranked by `pipelines/anime_popular.py` (AniList popularity and character favourites, plus a short hand-picked list
of household names). Run it after anything that rebuilds or re-ranks the anime pack.

## Play chess against the ballknowledge characters (26 November)

Solo "Play chess" asks who you want to play: Pip, Mikel Arteta, The Berserker, Bishop Bea, The Trader, The Escaped,
The Council, Queen Vera, or plain Stockfish. The characters are the ones from ballknowledge's chess page, with the same
move rules, faces, measured ratings, lines and recorded voices; they replace the old four difficulty levels.

`pipelines/chess_characters.py` copies them over (it only reads ballknowledge) into `site/bk_bots.js` and
`docs/voice_bk/`. Change a character in ballknowledge, then run it again, then `python3 build.py`.
`site/chessplay.js` holds the opponent screen and the speech bubble. The same screen picks the clock (none, 3, 5 or 10 minutes each, solo only). It starts after both first moves; running out
loses, or draws if the other side has too little left to mate. Undo does not give time back.

Bots take their time (`CPTEMPO` in `site/chessplay.js`, 1 to 4.5 s; longer in sharp positions, less when their clock is low). The screen is patched in place (`cpPaint`), never rebuilt, and the board is sized so both players stay on screen. Pieces can be dragged or
tapped; promotion asks for the piece; Resign, Opponent and Back ask for a second tap in a running game.

## Chess room and end-of-game card (26 November)

A finished game against the computer shows ballknowledge's summary card (your moves counted by a quick Stockfish pass,
then Game review, New game, Rematch).

`docs/lab/` is the chess room: ballknowledge's own game review (with import from Lichess, chess.com or PGN), six position
games and the World Championship hub, taken from its public build by `python3 pipelines/chess_lab.py`. It opens over the
current screen (`site/chess_card.js`). `site/lab/` holds the front door and styles added on top. ballknowledge's database
settings are removed, so nothing there uses its accounts or boards; scores are kept in the browser. Re-run after
ballknowledge rebuilds its chess page.

## Where did they finish? and Who did it (26 November)

From ballknowledge: real final tables (football and basketball) and 338 big football matches. `pipelines/bk_history.py`
writes `site/bk_history.json`; the games are in `site/history_games.js`. Solo and two players on one device ("Who did it"
is solo only); no two-device mode for these two. There are no basketball match records, so "Who did it" is football only.

## Swipeable settings (26 November)

Look, sidekick (per category), outfit and text size are rows of cards to swipe, tap or step with the arrows
(`site/settings_swipe.js`). Not tried with a finger on a real phone.
