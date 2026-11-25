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
- **Daily missions, combo effects** (`site/missions.js`, `site/gamefx.js`), from ballknowledge.
- **Outfits and guided tour** (`site/fits_tour.js`); **light/dark, share card, comeback calendar** (`site/extras.js`).
- **Chess training** (`site/chess_train.js`): puzzles and puzzle rush (Lichess puzzles, CC0; `pipelines/chess_puzzles.py`), endgame trainer, game review with Stockfish.
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
