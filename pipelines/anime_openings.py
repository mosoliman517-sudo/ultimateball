"""
Opening and theme songs for "Hear the opening". The series-to-song pairs below are a hand-written list of well-known themes; each
is kept only when Apple's catalogue has that title by that artist (with a 30-second preview), and only for series in the pack.
Previews are Apple's, shown with a link to Apple Music. Run:  python3 pipelines/anime_openings.py
"""
import json, os, re, time, unicodedata
import requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
# series names to look for | song | artist
LIST = """
Attack on Titan|Guren no Yumiya|Linked Horizon
Naruto|Haruka Kanata|ASIAN KUNG-FU GENERATION
Naruto: Shippūden;Naruto Shippuden|Blue Bird|Ikimonogakari
One Piece|We Are!|Hiroshi Kitadani
Death Note|the WORLD|Nightmare
Fullmetal Alchemist: Brotherhood|again|YUI
Fullmetal Alchemist|Melissa|Porno Graffitti
Demon Slayer: Kimetsu no Yaiba;Demon Slayer|Gurenge|LiSA
Jujutsu Kaisen;JUJUTSU KAISEN|Kaikai Kitan|Eve
Chainsaw Man|KICK BACK|Kenshi Yonezu
Spy × Family;SPY x FAMILY|Mixed Nuts|Official HIGE DANdism
Oshi no Ko;【OSHI NO KO】;My Star|Idol|YOASOBI
Frieren;Frieren: Beyond Journey's End|The Brave|YOASOBI
My Hero Academia|Peace Sign|Kenshi Yonezu
Tokyo Ghoul|unravel|TK from Ling tosite sigure
Sword Art Online|crossing field|LiSA
Code Geass;Code Geass: Lelouch of the Rebellion|COLORS|FLOW
Bleach|Asterisk|ORANGE RANGE
Hunter × Hunter;Hunter x Hunter|departure!|Masatoshi Ono
Haikyu!!;HAIKYU!!;Haikyū!!|Imagination|SPYAIR
Neon Genesis Evangelion|A Cruel Angel's Thesis|Yoko Takahashi
Cowboy Bebop|Tank!|Seatbelts
One-Punch Man|THE HERO !!|JAM Project
Mob Psycho 100|99|MOB CHOIR
Steins;Gate|Hacking to the Gate|Kanako Itou
Re:Zero;Re:ZERO -Starting Life in Another World-|Redo|Konomi Suzuki
Solo Leveling|LEveL|SawanoHiroyuki[nZk]
Dandadan;Dan Da Dan|Otonoke|Creepy Nuts
Mashle;Mashle: Magic and Muscles|Bling-Bang-Bang-Born|Creepy Nuts
Blue Lock|Chaos ga Kiwamaru|UNISON SQUARE GARDEN
Bocchi the Rock!;BOCCHI THE ROCK!|Seishun Complex|kessoku band
Toradora!|Pre-Parade|Rie Kugimiya
Your Lie in April|Hikaru Nara|Goose house
Anohana;Anohana: The Flower We Saw That Day|Aoi Shiori|Galileo Galilei
Fire Force|Inferno|Mrs. GREEN APPLE
Dr. Stone|Good Morning World!|BURNOUT SYNDROMES
Black Clover|Haruka Mirai|Kankaku Piero
Fairy Tail|Snow fairy|FUNKIST
Dragon Ball Z|CHA-LA HEAD-CHA-LA|Hironobu Kageyama
Sailor Moon|Moonlight Densetsu|DALI
Inuyasha|CHANGE THE WORLD|V6
JoJo's Bizarre Adventure|Sono Chi no Sadame|Hiroaki Tommy Tominaga
Vinland Saga|MUKANJYO|Survive Said The Prophet
The Promised Neverland|Touch off|UVERworld
Erased|Re:Re:|ASIAN KUNG-FU GENERATION
Parasyte;Parasyte -the maxim-|Let Me Hear|Fear, and Loathing in Las Vegas
Noragami|Goya no Machiawase|Hello Sleepwalkers
Kaguya-sama: Love Is War|Love Dramatic|Masayuki Suzuki
The Apothecary Diaries|Hana ni Natte|Ryokuoushoku Shakai
Cyberpunk: Edgerunners|This Fffire|Franz Ferdinand
Kuroko's Basketball|Can Do|GRANRODEO
Violet Evergarden|Sincerely|TRUE
Blue Exorcist|CORE PRIDE|UVERworld
Soul Eater|resonance|T.M.Revolution
Akame ga Kill!|Skyreach|Sora Amamiya
No Game No Life|This game|Konomi Suzuki
Hell's Paradise|WORK|millennium parade
Gintama|Pray|Tommy heavenly6
"""

norm = lambda s: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower())

def search(term, country):
    for wait in (3.5, 20, 60):
        time.sleep(wait)
        try:
            r = requests.get("https://itunes.apple.com/search", params={"term": term, "entity": "song", "limit": 15, "country": country}, timeout=40)
            if r.status_code == 200: return r.json().get("results", [])
        except requests.RequestException: pass
    return []

p = os.path.join(ROOT, "packs", "anime.json"); d = json.load(open(p, encoding="utf-8"))
shows = {}
for x in d["items"]:
    if x["kind"] == "anime":
        for n in [x["n"]] + x.get("alt", []): shows.setdefault(norm(n), x)
themes, missing_show, no_match = [], [], []
for line in LIST.strip().split("\n"):
    names, song, artist = line.split("|")
    show = next((shows[norm(n)] for n in names.split(";") if norm(n) in shows), None)
    if not show: missing_show.append(names.split(";")[0]); continue
    hit = None
    for country in ("US", "JP"):
        for t in search(f"{song} {artist}", country):
            title = re.sub(r"\s*[\(\[\-~〜–].*$", "", t.get("trackName", "")).strip() or t.get("trackName", "")
            if t.get("previewUrl") and norm(artist) and norm(artist) in norm(t.get("artistName", "")) and norm(title) == norm(song) and not re.search(r"karaoke|instrumental|cover|inst\.", t.get("trackName", "") + t.get("collectionName", ""), re.I):
                hit = t; break
        if hit: break
    if not hit: no_match.append(f"{show['n']}: {song}"); continue
    themes.append({"id": f"th{hit['trackId']}", "n": song, "kind": "theme", "anime": show["n"], "by": artist, "year": show.get("year"), "fame": show.get("fame", 0),
                   "cover": (hit.get("artworkUrl100") or "").replace("100x100bb", "600x600bb"), "pv": hit["previewUrl"], "am": hit.get("trackViewUrl")})
    print("ok", show["n"], "-", song, flush=True)
d["themes"] = themes     # kept apart from the items: only "Hear the opening" uses them
json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
print(f"{len(themes)} themes. Series not in the pack: {missing_show}\nNot confirmed on Apple: {no_match}")
