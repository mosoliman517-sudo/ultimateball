"""
Ranks anime and characters by how known they really are, and adds more characters from the well-known series.
  python3 pipelines/anime_popular.py          (AniList answers are cached in packs/_anilist_cache.json)
Series: AniList popularity (how many people list it). Wikipedia page views were wrong here: a show adapted from a classic
novel inherited the novel's readers and landed in Easy. Characters: AniList favourites, weighted by their series.
HOUSEHOLD and ICONS are a hand-picked editorial list of names known well beyond AniList users.
Run again after fame_views.py if that is ever run on anime.
"""
import json, os, re, sys, time, unicodedata
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
from more_content import key, load, store, picture

CACHE = os.path.join(B.ROOT, "packs", "_anilist_cache.json")
cache = json.load(open(CACHE)) if os.path.exists(CACHE) else {}

HOUSEHOLD = ["Naruto", "One Piece", "Dragon Ball Z", "Dragon Ball", "Pokémon", "Attack on Titan", "Demon Slayer: Kimetsu no Yaiba", "Death Note", "Doraemon",
             "Case Closed", "Sailor Moon", "Jujutsu Kaisen", "My Hero Academia", "Captain Tsubasa", "Yu-Gi-Oh!"]
ICONS = ["Naruto Uzumaki", "Sasuke Uchiha", "Luffy Monkey", "Kakashi Hatake", "Monkey D. Luffy", "Roronoa Zoro", "Goku", "Son Goku", "Vegeta", "Pikachu", "Ash Ketchum", "Satoshi",
         "Doraemon", "Nobita Nobi", "Conan Edogawa", "Usagi Tsukino", "Sailor Moon", "Light Yagami", "L Lawliet", "L", "Eren Yeager", "Mikasa Ackerman", "Levi",
         "Levi Ackerman", "Tanjirou Kamado", "Tanjiro Kamado", "Nezuko Kamado", "Satoru Gojou", "Satoru Gojo", "Yuuji Itadori", "Yuji Itadori", "Saitama",
         "Izuku Midoriya", "Katsuki Bakugou", "Gon Freecss", "Killua Zoldyck", "Edward Elric", "Anya Forger", "Yugi Mutou", "Tsubasa Oozora", "Tsubasa Ozora"]
DROP = {"The One Piece"}          # an announced remake, listed beside One Piece itself
NOT_A_CHARACTER = {"list of Rurouni Kenshin characters", "Death Busters", "Black Moon Clan", "Dark Kingdom", "Shadow Galactica", "Thousand Sunny", "Moomins",
                   "Bandar-log", "Seven Dwarfs", "Aerialbots", "Protectobots", "Mini-Con", "Baker Street Irregulars", "Straw Hat Pirates", "Hattifattener", "Predacon", "Narrator"}
# (series starts with, name we got) -> the name English-speaking fans use; the old one is still accepted
RENAME = {("Pokémon", "Satoshi"): "Ash Ketchum", ("Pokémon", "Kojirou"): "James", ("Pokémon", "Musashi"): "Jessie", ("Pokémon", "Kasumi"): "Misty",
          ("Pokémon", "Takeshi"): "Brock", ("Dragon Ball", "Gokuu Son"): "Goku", ("Dragon Ball", "Son Goku"): "Goku", ("Dragon Ball", "Gohan Son"): "Gohan",
          ("Dragon Ball", "Goten Son"): "Goten", ("Attack on Titan", "Levi"): "Levi Ackerman", ("Death Note", "L Lawliet"): "L", ("One Piece", "Luffy Monkey"): "Monkey D. Luffy",
          ("Sword Art Online", "Kazuto Kirigaya"): "Kirito"}
SEARCH_AS = {"JoJo's Bizarre Adventure": "JoJo's Bizarre Adventure (TV)"}

FIELDS = """id siteUrl popularity format title{romaji english} synonyms startDate{year} coverImage{extraLarge}
  relations{ edges{ relationType node{ id type format } } }
  characters(sort:[FAVOURITES_DESC], perPage:25){ nodes{ id siteUrl favourites gender name{full alternative} image{large} } }"""
TOP = "query($p:Int){ Page(page:$p, perPage:20){ media(type:ANIME, sort:POPULARITY_DESC, format_in:[TV,TV_SHORT,ONA], isAdult:false){ " + FIELDS + " } } }"
FIND = "query($s:String){ Page(perPage:8){ media(search:$s, type:ANIME, sort:SEARCH_MATCH, isAdult:false){ " + FIELDS + " } } }"

def ask(query, k, **variables):
    if k in cache: return cache[k]
    for wait in (3, 20, 65, 65, 65):
        try:
            r = requests.post("https://graphql.anilist.co", json={"query": query, "variables": variables}, headers=B.HEAD, timeout=60)
            if r.status_code == 200:
                time.sleep(2.1); cache[k] = r.json()["data"]["Page"]["media"]
                if len(cache) % 20 == 0: json.dump(cache, open(CACHE, "w"))
                return cache[k]
            if r.status_code == 429: time.sleep(int(r.headers.get("Retry-After", 60)) + 2); continue
        except requests.RequestException: pass
        time.sleep(wait)
    raise RuntimeError("AniList did not answer: " + k)

titles = lambda m: {key(t) for t in [re.sub(r" \((19|20)\d\d\)$", "", t or "") for t in [m["title"].get("english"), m["title"].get("romaji")] + (m.get("synonyms") or [])] if key(t)}
plain = lambda s: "".join(ch for ch in unicodedata.normalize("NFKD", s or "") if not unicodedata.combining(ch)).lower().replace("ou", "o").replace("oo", "o").replace("uu", "u")
words = lambda s: " ".join(sorted(re.findall(r"[a-z0-9]+", plain(s))))
names = lambda c: [c["name"]["full"]] + [a for a in c["name"].get("alternative") or [] if a]

def main():
    d = load("anime")
    for x in d["items"]:
        if x.get("anime") in DROP: x["anime"] = "One Piece"      # its characters belong to the show itself
    items = [x for x in d["items"] if x["n"] not in DROP]
    one = {}          # the same title listed twice (remakes, double records) is one answer in a guessing game
    for x in sorted((x for x in items if x["kind"] == "anime"), key=lambda x: (not x.get("img"), -(x.get("fame0") or 0))):
        keep = one.setdefault(key(x["n"]) or x["n"], x)
        if keep is not x:
            keep["_any"] = True      # match whichever version of the title is the most watched
            alt = sorted(set(keep.get("alt", []) + x.get("alt", [])) - {keep["n"]})
            if alt: keep["alt"] = alt
    items = [x for x in items if x["kind"] != "anime" or one[key(x["n"]) or x["n"]] is x]
    items = [x for x in items if not (x["kind"] == "character" and x["n"] in NOT_A_CHARACTER)]
    media = {}
    for p in range(1, 41):
        for m in ask(TOP, f"top{p}", p=p): media[m["id"]] = m
        if p % 10 == 0: print("top page", p, len(media), flush=True)
    by_title = {}
    for m in sorted(media.values(), key=lambda m: -m["popularity"]):
        for t in titles(m): by_title.setdefault(t, []).append(m)
    series = [x for x in items if x["kind"] == "anime"]
    match = {}
    for i, x in enumerate(series):
        keys = [key(t) for t in [SEARCH_AS.get(x["n"]), x["n"]] + x.get("alt", []) if t and key(t)]
        near = lambda m: x.get("_any") or not x.get("year") or not (m["startDate"] or {}).get("year") or abs(x["year"] - m["startDate"]["year"]) <= 1
        found = [m for k in keys for m in by_title.get(k, [])]
        pick = [m for m in found if near(m)] or [m for m in found if m["title"].get("english") and key(m["title"]["english"]) == keys[0]]
        if not pick:
            pick = [m for m in ask(FIND, "s:" + SEARCH_AS.get(x["n"], x["n"]), s=SEARCH_AS.get(x["n"], x["n"])) if titles(m) & set(keys) and near(m)]
        if x.pop("_any", False) and pick: x["year"] = (max(pick, key=lambda m: m["popularity"])["startDate"] or {}).get("year") or x.get("year")
        if pick:
            match[x["id"]] = max(pick, key=lambda m: m["popularity"]); media.setdefault(match[x["id"]]["id"], match[x["id"]])
        if i % 50 == 0: print("matched", len(match), "of", i + 1, flush=True)
    json.dump(cache, open(CACHE, "w"))

    # the first entry of a franchise, following prequels as far as we have them
    def root(m):
        seen = set()
        while m["id"] not in seen:
            seen.add(m["id"])
            prev = [media[e["node"]["id"]] for e in m["relations"]["edges"] if e["relationType"] == "PREQUEL" and e["node"]["id"] in media
                    and e["node"]["format"] in ("TV", "TV_SHORT", "ONA")]
            if not prev: break
            m = prev[0]
        return m["id"]
    franchise = {}
    for m in media.values(): franchise.setdefault(root(m), []).append(m)

    # two of our entries that are the same AniList show are one show: keep the shorter, better known name
    gone, rename, first = set(), {}, {}
    for x in sorted(series, key=lambda x: (x["n"] not in HOUSEHOLD, len(x["n"]))):
        m = match.get(x["id"])
        if not m: continue
        if m["id"] in first:
            keep = first[m["id"]]; gone.add(x["id"]); rename[x["n"]] = keep["n"]
            keep["alt"] = sorted(set(keep.get("alt", []) + [x["n"]] + x.get("alt", [])) - {keep["n"]})
        else: first[m["id"]] = x
    series = [x for x in series if x["id"] not in gone]
    print("duplicate series merged:", sorted(rename.items()))

    primary = {}      # franchise -> the entry that stands for it (earliest we have)
    for x in sorted(series, key=lambda x: (x["n"] not in HOUSEHOLD, x.get("year") or 9999, len(x["n"]))):
        if x["id"] in match: primary.setdefault(root(match[x["id"]]), x)
    pop = {}
    for x in series:
        m = match.get(x["id"])
        if not m: x["fame"] = round(min(0.9, (x.get("views") or 0) / 1e6), 3); continue
        r = root(m)
        pop[x["id"]] = max(z["popularity"] for z in franchise[r]) if primary[r] is x else m["popularity"]
        x["fame"] = round(pop[x["id"]] / 1000, 1)
    top_fame = sorted((x["fame"] for x in series), reverse=True)[8]
    for x in series:
        if x["n"] in HOUSEHOLD: x["fame"] = max(x["fame"], top_fame)
    show = {x["n"]: x for x in series}

    # characters: attach AniList favourites to the ones we have, merge repeats, then add more from the well-known series
    chars = [x for x in items if x["kind"] == "character" and x["id"] not in gone]
    for c in chars: c["anime"] = rename.get(c["anime"], c["anime"])
    cast = {}         # series name -> {AniList character id: character}
    for r, x in primary.items():
        for m in sorted(franchise[r], key=lambda m: -m["popularity"]):
            for c in m["characters"]["nodes"]: cast.setdefault(x["n"], {}).setdefault(c["id"], c)
    for x in series:      # a later entry we also hold uses its own show's cast
        if x["id"] in match and x["n"] not in cast: cast[x["n"]] = {c["id"]: c for c in match[x["id"]]["characters"]["nodes"]}
    family = {x["n"]: primary[root(match[x["id"]])]["n"] for x in series if x["id"] in match}
    used, kept = {}, []
    for c in sorted(chars, key=lambda c: c["anime"] != family.get(c["anime"])):
        pool = list(cast.get(c["anime"], {}).values()) + list(cast.get(family.get(c["anime"]), {}).values())
        mine = {words(c["n"])} | {words(a) for a in c.get("alt", [])}
        a = next((z for z in pool if c["id"] == f"alc{z['id']}"), None) or next((z for z in pool if words(z["name"]["full"]) in mine), None) \
            or next((z for z in pool if mine & {words(n) for n in names(z)}), None)
        if not a:      # "Gohan" is "Son Gohan": accept a part of a name only when exactly one character in the cast has it
            part = {z["id"]: z for z in pool if set(words(c["n"]).split()) < set(words(z["name"]["full"]).split())}
            if len(part) == 1: a = next(iter(part.values()))
        if a and a["id"] in used:
            twin = used[a["id"]]; twin["alt"] = sorted(set(twin.get("alt", []) + [c["n"]]) - {twin["n"]}); continue
        if a: used[a["id"]] = c; c["_fav"] = a["favourites"]; c["alt"] = sorted(set(c.get("alt", []) + names(a)[:4]) - {c["n"]})
        url = ((a or {}).get("image") or {}).get("large")
        if a and not c.get("img") and url and "default" not in url:      # matched here but never had a picture
            rel = f"img/anime/{c['id']}_img.webp"
            if os.path.exists(os.path.join(B.ROOT, rel)) or picture(url, rel):
                c["img"] = rel; c.setdefault("cr", {})["img"] = {"by": "AniList character art", "lic": "not freely licensed; shown with credit", "page": a["siteUrl"]}
        kept.append(c)
    print("characters: merged repeats", len(chars) - len(kept), "| matched", len(used), flush=True)

    ranked = sorted((x for x in primary.values()), key=lambda x: -x["fame"])
    have_ids = {c["id"] for c in kept}
    added = 0
    for rank, x in enumerate(ranked[:170]):
        room = 16 if rank < 40 else 11 if rank < 90 else 7
        have = [c for c in kept if c["anime"] == x["n"]]
        taken = {words(c["n"]) for c in have}
        for a in sorted(cast.get(x["n"], {}).values(), key=lambda a: -a["favourites"]):
            if a["favourites"] < 250 or (len(have) >= room and a["favourites"] < 3000): break      # a big favourite is never cut by the limit
            name, img = a["name"]["full"], (a.get("image") or {}).get("large")
            if a["id"] in used or f"alc{a['id']}" in have_ids or words(name) in taken or not img or "default" in img: continue
            y = {"id": f"alc{a['id']}", "n": name, "kind": "character", "anime": x["n"], "src": "AniList", "_fav": a["favourites"]}
            alt = sorted(set(names(a)[1:4]) - {name})
            if alt: y["alt"] = alt
            if (a.get("gender") or "").lower() in ("male", "female"): y["gender"] = a["gender"].lower()
            rel = f"img/anime/{y['id']}.webp"
            if not os.path.exists(os.path.join(B.ROOT, rel)) and not picture(img, rel): continue
            y["img"] = rel; y["cr"] = {"img": {"by": "AniList character art", "lic": "not freely licensed; shown with credit", "page": a["siteUrl"]}}
            kept.append(y); have.append(y); used[a["id"]] = y; have_ids.add(y["id"]); added += 1
        if rank % 20 == 0: print("series", rank, "characters added", added, flush=True)
    icons = {words(n) for n in ICONS}
    best = 0
    for c in kept:
        s = show.get(c["anime"], {}).get("fame", 0)
        fav = c.pop("_fav", None)
        c["fame"] = round((fav ** 0.5) * (s ** 0.5) / 3, 2) if fav is not None else round(min(0.9, s / 1000), 3)
        best = max(best, c["fame"])
    for c in kept:
        if words(c["n"]) in icons and c["anime"] in show and (c["anime"] in HOUSEHOLD or show[c["anime"]]["fame"] > 150):
            c["fame"] = max(c["fame"], round(best * 0.8, 2))
    stem = lambda n: re.sub(r"[^a-z]", "", plain(n.split(":")[0]).replace("the series", ""))
    for c in kept:
        for (series_start, old), new in RENAME.items():
            if c["n"] == old and c["anime"].startswith(series_start):
                c["alt"] = sorted(set(c.get("alt", []) + [old]) - {new}); c["n"] = new
                if words(new) in icons: c["fame"] = max(c["fame"], round(best * 0.8, 2))
    seen, single = [], []
    for c in sorted(kept, key=lambda c: (-c["fame"], not c.get("img"))):
        me, fam = words(c["n"]), stem(c["anime"])
        twin = next((t for w_, f, t in seen if w_ == me and (f.startswith(fam) or fam.startswith(f))), None)
        if twin:
            twin["alt"] = sorted(set(twin.get("alt", []) + c.get("alt", []) + [c["n"]]) - {twin["n"]})
            if not twin.get("img") and c.get("img"): twin["img"], twin["cr"] = c["img"], c.get("cr")
            continue
        seen.append((me, fam, c)); single.append(c)
    print("repeated characters merged:", len(kept) - len(single))
    kept = single
    others = [x for x in items if x["kind"] not in ("anime", "character")]
    for t in others:
        t["anime"] = rename.get(t.get("anime"), t.get("anime"))
        if t.get("anime") in show: t["fame"] = show[t["anime"]]["fame"]
    d["items"] = series + kept + others; store("anime", d)
    print(f"done: {len(series)} series ({len(match)} matched), {len(kept)} characters (+{added})")
    for kind, xs in (("series", series), ("characters", kept)):
        xs = sorted(xs, key=lambda x: -x["fame"])
        for label, a, b in (("easy", 0, 35), ("medium", 60, 90), ("hard", 150, 180), ("elite", 350, 375)):
            print(kind, label, [x["n"] for x in xs[a:b]])

main()
