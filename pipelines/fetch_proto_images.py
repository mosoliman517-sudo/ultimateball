"""
Prototype images: for each Wikipedia article below, take its lead image, but only if that file lives on Wikimedia Commons
(free licence or public domain; non-free "fair use" files exist only on en.wikipedia and are skipped, never replaced).
Saves a 480 px thumbnail as WebP into ../proto_assets/<cat>/<slug>.webp and writes ../proto_assets/credits.json with the
author, licence and source page of every file. Football uses the ballknowledge hero cutouts (TheSportsDB, identification only).
Run:  python3 pipelines/fetch_proto_images.py
"""
import io, json, os, re, shutil, time
import requests
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "proto_assets")
HEAD = {"User-Agent": "games-platform-prototype/0.1 (student project)"}
BK_HERO = os.path.expanduser("~/Desktop/football-prediction-model/docs/football/hero")

PAGES = {
    "kpop": ["BTS", "Blackpink", "Twice (group)", "Stray Kids", "NewJeans", "Aespa", "Seventeen (South Korean band)", "IU (singer)",
             "Jungkook", "Lisa (rapper)", "Jennie (singer)", "Big Bang (South Korean band)", "Red Velvet (group)", "Itzy", "Le Sserafim", "Ive (group)"],
    "geography": ["Eiffel Tower", "Machu Picchu", "Taj Mahal", "Mount Fuji", "Petra", "Sydney Opera House", "Great Wall of China",
                  "Flag of South Korea", "Flag of Brazil", "Flag of Japan", "Flag of Canada", "Flag of Nigeria", "Flag of Turkey"],
    "history": ["Cleopatra", "Napoleon", "Abraham Lincoln", "Joan of Arc", "Genghis Khan", "Queen Victoria", "Julius Caesar", "Apollo 11"],
    "art": ["Mona Lisa", "The Starry Night", "The Great Wave off Kanagawa", "Girl with a Pearl Earring", "The Birth of Venus", "The Kiss (Klimt)", "Water Lilies (Monet series)"],
    "food": ["Kimchi", "Paella", "Pho", "Sushi", "Pizza", "Bibimbap", "Taco", "Croissant"],
    "science": ["Albert Einstein", "Marie Curie", "Isaac Newton", "Charles Darwin", "Ada Lovelace", "Nikola Tesla"],
    "chess": ["Magnus Carlsen", "Garry Kasparov", "Hikaru Nakamura", "Judit Polgár", "Gukesh Dommaraju", "Bobby Fischer"],
    "basketball": ["LeBron James", "Stephen Curry", "Michael Jordan", "Kobe Bryant", "Giannis Antetokounmpo", "Victor Wembanyama"],
    "general": ["Saturn", "Aurora", "Great Pyramid of Giza", "Northern cardinal", "Volcano", "Mount Everest"],
}
slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
strip = lambda h: re.sub(r"<[^>]+>", "", h or "").strip()

def get(url, **kw):
    # polite: back off and retry when the API says "too many requests" (429)
    for wait in (2, 5, 10, 20, 40, 60):
        r = requests.get(url, headers=HEAD, timeout=60, **kw)
        if r.status_code == 200:
            time.sleep(1.0); return r
        time.sleep(wait)
    r.raise_for_status()

LEAD = {}
def lead_image(title):
    if title not in LEAD:
        r = get("https://en.wikipedia.org/w/api.php", params={"action": "query", "titles": title, "prop": "pageimages", "piprop": "name", "redirects": 1, "format": "json"}).json()
        p = next(iter(r["query"]["pages"].values()))
        LEAD[title] = (p.get("pageimage"), p.get("title"))
    return LEAD[title]

def commons_info(fname):
    r = get("https://commons.wikimedia.org/w/api.php", params={"action": "query", "titles": "File:" + fname, "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": 480, "format": "json"}).json()
    for p in r["query"]["pages"].values():
        if "missing" in p or "imageinfo" not in p:
            return None
        ii = p["imageinfo"][0]; md = ii.get("extmetadata", {})
        return {"thumb": ii["thumburl"], "page": ii["descriptionurl"], "licence": strip(md.get("LicenseShortName", {}).get("value")), "author": strip(md.get("Artist", {}).get("value"))[:120]}
    return None

def main():
    credits, missing = {}, []
    for cat, titles in PAGES.items():
        os.makedirs(os.path.join(OUT, cat), exist_ok=True)
        for t in titles:
            fname, real = lead_image(t)
            info = commons_info(fname) if fname else None
            if not info:
                missing.append(f"{cat}: {t} ({'no lead image' if not fname else 'not on Commons (non-free)'})"); continue
            dest = os.path.join(OUT, cat, slug(real) + ".webp")
            if not os.path.exists(dest):
                img = Image.open(io.BytesIO(get(info["thumb"]).content)).convert("RGBA")
                if img.mode == "RGBA" and not fname.lower().endswith((".svg", ".png")):
                    img = img.convert("RGB")
                img.save(dest, "WEBP", quality=80)
                time.sleep(0.4)
            credits[f"{cat}/{slug(real)}.webp"] = {"title": real, **{k: info[k] for k in ("licence", "author", "page")}}
    os.makedirs(os.path.join(OUT, "football"), exist_ok=True)
    for f in sorted(os.listdir(BK_HERO)):
        shutil.copy(os.path.join(BK_HERO, f), os.path.join(OUT, "football", f))
        credits[f"football/{f}"] = {"title": f[:-5], "licence": "Identification only", "author": "TheSportsDB", "page": "https://www.thesportsdb.com"}
    json.dump({"credits": credits, "missing": missing}, open(os.path.join(OUT, "credits.json"), "w"), indent=1, ensure_ascii=False)
    print(len(credits), "images;", len(missing), "missing:"); print("\n".join(missing))

main()
