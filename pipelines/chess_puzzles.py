"""
Real puzzles from the Lichess puzzle database (CC0), taken from the download ballknowledge already has
(~/Desktop/football-prediction-model/01_data_chess/puzzles_first60MB.csv.zst): well liked, much played, spread evenly by rating.
Writes site/puzzles.json as [fen, moves, rating, theme]. The first move is the opponent's; the player answers from there.
Run:  python3 pipelines/chess_puzzles.py   (needs Python 3.14+ for compression.zstd)
"""
import json, os, random
from compression import zstd

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
SRC = os.path.expanduser("~/Desktop/football-prediction-model/01_data_chess/puzzles_first60MB.csv.zst")
PER_BAND = 45
THEMES = {"mateIn1": "Mate in 1", "mateIn2": "Mate in 2", "mateIn3": "Mate in 3", "backRankMate": "Back rank mate", "fork": "Fork", "pin": "Pin", "skewer": "Skewer",
          "discoveredAttack": "Discovered attack", "sacrifice": "Sacrifice", "hangingPiece": "Hanging piece", "deflection": "Deflection", "promotion": "Promotion", "endgame": "Endgame"}

chunks = []
try:
    with zstd.open(SRC, "rb") as f:                      # the file is a cut-off download: take everything before the cut
        while True:
            c = f.read(1 << 20)
            if not c: break
            chunks.append(c)
except (EOFError, zstd.ZstdError): pass
text = b"".join(chunks).decode("utf-8", "ignore")
bands = {}
for line in text.split("\n")[1:-1]:
    c = line.split(",")
    if len(c) < 8: continue
    fen, moves, rating, pop, plays, themes = c[1], c[2], int(c[3]), int(c[5]), int(c[6]), c[7].split()
    if pop < 85 or plays < 800 or not 600 <= rating < 2400 or len(moves.split()) > 8: continue
    theme = next((THEMES[t] for t in THEMES if t in themes), "Tactics")
    bands.setdefault(rating // 100, []).append([fen, moves, rating, theme])
random.seed(7)
out = [p for b in sorted(bands) for p in random.sample(bands[b], min(PER_BAND, len(bands[b])))]
out.sort(key=lambda p: p[2])
json.dump(out, open(os.path.join(ROOT, "site", "puzzles.json"), "w"), separators=(",", ":"))
print(len(out), "puzzles,", out[0][2], "to", out[-1][2], "from", sum(len(v) for v in bands.values()), "good ones")
