# ultimateball: the games site

A games-only knowledge site spun off from ballknowledge (`~/Desktop/football-prediction-model`). It is built on that site's football page: the same CSS and look, round engine, sounds and lobby music, finale card, versus screens, MQTT rooms and sidekicks, copied into `site/` and extended to many categories.

## Build

```bash
python3 pipelines/build_packs.py            # real data + images for every category (slow: Commons asks for gentle downloads)
python3 pipelines/lineups.py                 # real starting XIs and starting fives from ballknowledge
python3 pipelines/song_previews.py           # Apple's 30-second previews for K-pop songs (about 20 lookups a minute)
python3 build.py                             # site -> docs/index.html + docs/img/
```

Preview: the `games-prototype` entry in `~/.claude/launch.json` serves this folder; open `/docs/index.html`.

## Layout

- `site/base.css`, `site/sprite.html`, `site/bk_core.js`, `site/mascot_art.js`, `site/mascot_lines.js`, `site/coach_lines.js`, `site/chess_coaches.js`: copied from ballknowledge, unchanged except where marked.
- `site/app.js`: categories, games, the generalised round engine, roulette, higher or lower, cross-category match, Gamut run, collection, profile, online rooms.
- `site/mascots_worlds.js`: the new sidekicks (Bongi, Maknae Mic, Pocha, Pin, Tock, Dumpling, Dog-ear, Neko) in ballknowledge's drawing style.
- `pipelines/`: data builders. Facts from Wikidata (CC0), Open Trivia DB (CC BY-SA 4.0) and ballknowledge's own data; pictures from Wikimedia Commons with author and licence on every answer card. Nothing is invented: an item without the facts a game needs is left out of that game.
- `db/001_accounts.sql`: accounts for the new Supabase project (run it in that project's SQL editor once it exists).

## Rules

- Never invent data. Missing facts or pictures are left out and reported.
- No song lyrics: they are copyrighted and there is no licensed source.
- Every game plays the mechanic its name says. Answers are typed, with suggestions, like ballknowledge.
