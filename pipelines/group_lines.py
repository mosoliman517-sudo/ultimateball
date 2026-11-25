"""
Writes site/group_lines.js: what the K-pop sidekicks say after you correctly name a particular group or idol.
Only stage names and group names from packs/kpop.json go in; the lines claim no facts. Run after the pack changes:
  python3 pipelines/group_lines.py
"""
import json, os, re, unicodedata

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
items = json.load(open(os.path.join(ROOT, "packs", "kpop.json"), encoding="utf-8"))["items"]
groups = [x["n"] for x in items if x["kind"] == "group"]
idols = list(dict.fromkeys(x["n"] for x in items if x["kind"] == "idol"))

GROUP = {
    "bongi": ["{n}! My light just switched to full.", "That's {n}! Wave it high.", "Yes, {n}! The whole stand is glowing.", "{n}, correct! I'm blinking in rhythm.",
              "You know your {n}. Sparkles for you.", "{n}! I'd stay lit all night for that.", "Right, it's {n}! Happy little glow."],
    "mic": ["{n}! Make some noise!", "That's {n}! I'd do the fanchant.", "Yes, {n}! Turn me up.", "{n}, correct! Encore, encore!",
            "You really know {n}. Loud applause!", "{n}! I felt that one in the speakers.", "Right, it's {n}! Sing it with me."],
    "pocha": ["{n}. A lovely set to know.", "That is {n}. Filed and sleeved.", "Yes, {n}. Front of the binder.", "{n}, correct. Very collectible knowledge.",
              "You know your {n}. Mint condition.", "{n}. I keep a whole page for that.", "Right, it's {n}. Crisp answer."],
}
IDOL = {
    "bongi": ["{n}! Glowing for that one.", "That's {n}! Full brightness.", "Yes, {n}! I'm waving.", "You spotted {n}! Sparkle time."],
    "mic": ["{n}! Say it louder!", "That's {n}! Cheers all round.", "Yes, {n}! What a call.", "You got {n}! Loud and clear."],
    "pocha": ["{n}. A fine card to pull.", "That is {n}. Into the sleeve.", "Yes, {n}. Nicely spotted.", "You named {n}. Very neat."],
}
key = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s).encode("ascii", "ignore").decode().lower())
L = {}
for who in GROUP:
    L[who] = {}
    for i, n in enumerate(groups):
        t = GROUP[who]
        L[who]["grp_" + key(n)] = [t[i % len(t)].format(n=n), t[(i + 3) % len(t)].format(n=n)]
    for i, n in enumerate(idols):
        L[who]["idl_" + key(n)] = [IDOL[who][i % len(IDOL[who])].format(n=n)]
js = ("/* made by pipelines/group_lines.py: praise for a particular group (grp_) or idol (idl_), said only after that answer */\n"
      "{ const G = " + json.dumps(L, ensure_ascii=False, separators=(",", ":")) + ";\n"
      "  for (const who in G) if (MASCOTS[who]) Object.assign(MASCOTS[who].lines = MASCOTS[who].lines || {}, G[who]); }\n")
open(os.path.join(ROOT, "site", "group_lines.js"), "w", encoding="utf-8").write(js)
print(len(groups), "groups,", len(idols), "idols,", sum(len(v) for a in L.values() for v in a.values()), "lines")
