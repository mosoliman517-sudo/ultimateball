# Build a games-only knowledge website, spun off from ballknowledge

## Context
I own **ballknowledge** (https://moballknowledge.vercel.app, code in `~/Desktop/football-prediction-model`). It's a football site built around a prediction model, plus basketball and chess sections, full of knowledge games. I want a **new, separate website dedicated only to games that test your knowledge across many categories**. It isn't centred on a model.

It should feel like ballknowledge's football section: the same aesthetic, animations, mascots, loading screens, ranks and accounts. The difference is that it covers many genres. Treat ballknowledge as the blueprint to copy and extend, not just loose inspiration. Do not change the ballknowledge repo.

## The core idea
- Many categories, each with several fun games: **K-pop, football, basketball, chess, geography, history, food, general knowledge**, and more later (movies, music, anime, F1, science, art…).
- Each category reuses ballknowledge games where the mechanic fits, and gets **new games** where it doesn't have enough. Some games are unique to one genre.
- **A cross-category friend challenge.** Each player brings the categories they're good at, and a match mixes them. For example, a K-pop fan against a football fan.
- You can play **alone**, **2 players on one device**, or **2 players on two devices** (room code or invite link), exactly like ballknowledge.

## Games: adapt the existing ones, then add new ones
Every game must actually play the mechanic its name describes. A game called "Logo blur" shows a blurred logo, never an unrelated question.

| Existing ballknowledge game | Reused for |
|---|---|
| Badge blur | K-pop group logos, country flags, basketball team logos, famous paintings, landmarks |
| Who am I? (clues revealed one by one) | K-pop idols, historical figures, footballers, basketball players, chess players, scientists |
| Career path / Career timeline | Footballers' clubs, idols' groups and agencies, rulers' reigns |
| Higher or lower | Debut years, populations, birth years, transfer values, stats |
| Scramble | Names in any category |
| Tic-tac-toe grid | Club × nation, agency × generation, continent × language |
| Rank the five, Starting XI, Name the opening, Spot the tactic | Keep in their sports; build equivalents where they fit |

Suggest new games per genre. Examples: K-pop "Who debuted first?", "Fandom name match" and "Generation sort"; geography "Pin it on the map" and "Border to border"; history "Timeline drop" and "Which came first?"; food "Guess the dish from ingredients". Poll me before committing to the list.

## Everything else to carry over from ballknowledge
- **One account for everything:** a single login with a profile, nickname, profile picture, rank and achievements. Ratings and leaderboards per category plus an overall one. Playing without an account still works.
- **Ranked system:** Elo-based ranks from Bronze to Legend, rating history, and leaderboards (all time, this week, today).
- **Achievements and badges**, including hidden ones, plus daily challenges with a streak calendar.
- **Collectible loading screens for every category.** Rarities run Common → Uncommon → Rare → Legendary, plus a secret one (like ballknowledge's "Notebook"), with a "New! x of N" collection counter.
- **Profile pictures from every genre** (idols, players, flags, mascots…), using only licensed or credited images.
- **Mascots (sidekicks) for every category**, drawn in the same style as Old Boot, Ref Rita, Bench, Rim, Shot Clock, Sneak and Pip. Each has moods, voice lines and outfits that unlock with rank or achievements.
- **Lobby music and sound effects** per category (like the football stadium stomp-clap and the basketball arena loop), with an audio mixer.
- **Looks and polish:** ballknowledge's visual style, with real photos, logos and icons everywhere, photo walls, glow, light beams, big bold type, and heavy but smooth animation. Keep lite mode and reduced-motion support.
- **Daily challenges, result cards, Challenge a friend links, a monthly recap.**

## Rules
- **Never invent data.** Every fact, stat and image comes from a real source (Wikidata, Wikimedia Commons, the existing ballknowledge datasets, Lichess, etc.), with credit. If something is missing, tell me instead of filling the gap.
- Prefer images and icons over long text.
- **Poll me** on decisions and on improvements or additions as you go. I can't remember everything I want, so suggest things.

## Where to start
1. Start as an **artifact** or prototype to get the look and feel right.
2. Build the site skeleton by copying ballknowledge's structure: home with doors, game hub, game intro cards, solo/2-player picker, profile, settings, loading screens and mascot dock.
3. Import the **football, basketball and chess** games and data first.
4. Then build **K-pop** as the first new category, followed by the rest.

This is a draft project to work on when there's time. Keep it expandable.
