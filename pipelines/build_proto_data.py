"""
Turns proto_assets/credits.json into proto_data.js for the prototype: one record per image that was really downloaded,
with its display name, the fact the questions use, and its credit line. Images that failed to download are simply absent.
Facts are well-known ones written by hand for the mock-up (debut years, countries, painters); the real build takes them from Wikidata.
Run:  python3 pipelines/build_proto_data.py
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
C = json.load(open(os.path.join(ROOT, "proto_assets", "credits.json")))

# Wikipedia title -> (display name, fact). Facts: K-pop debut year; geography/food country; art painter; history/others none.
FACTS = {
    "BTS": ("BTS", 2013), "Blackpink": ("BLACKPINK", 2016), "Twice (group)": ("TWICE", 2015), "Stray Kids": ("Stray Kids", 2018),
    "NewJeans": ("NewJeans", 2022), "Aespa": ("aespa", 2020), "Seventeen (South Korean band)": ("SEVENTEEN", 2015), "IU (singer)": ("IU", None),
    "Jungkook": ("Jungkook", None), "Lisa (rapper)": ("Lisa", None), "Jennie (singer)": ("Jennie", None), "Big Bang (South Korean band)": ("BIGBANG", 2006),
    "Red Velvet (group)": ("Red Velvet", 2014), "Itzy": ("ITZY", 2019), "Le Sserafim": ("LE SSERAFIM", 2022), "Ive (group)": ("IVE", 2021),
    "Eiffel Tower": ("Eiffel Tower", "France"), "Machu Picchu": ("Machu Picchu", "Peru"), "Taj Mahal": ("Taj Mahal", "India"), "Mount Fuji": ("Mount Fuji", "Japan"),
    "Petra": ("Petra", "Jordan"), "Sydney Opera House": ("Sydney Opera House", "Australia"), "Great Wall of China": ("Great Wall", "China"),
    "Flag of South Korea": ("South Korea", "South Korea"), "Flag of Brazil": ("Brazil", "Brazil"), "Flag of Japan": ("Japan", "Japan"),
    "Flag of Canada": ("Canada", "Canada"), "Flag of Nigeria": ("Nigeria", "Nigeria"), "Flag of Turkey": ("Turkey", "Turkey"),
    "Cleopatra": ("Cleopatra", None), "Napoleon": ("Napoleon", None), "Abraham Lincoln": ("Abraham Lincoln", None), "Joan of Arc": ("Joan of Arc", None),
    "Genghis Khan": ("Genghis Khan", None), "Queen Victoria": ("Queen Victoria", None), "Julius Caesar": ("Julius Caesar", None), "Apollo 11": ("Apollo 11", 1969),
    "Mona Lisa": ("Mona Lisa", "Leonardo da Vinci"), "The Starry Night": ("The Starry Night", "Vincent van Gogh"), "The Great Wave off Kanagawa": ("The Great Wave", "Hokusai"),
    "Girl with a Pearl Earring": ("Girl with a Pearl Earring", "Johannes Vermeer"), "The Birth of Venus": ("The Birth of Venus", "Sandro Botticelli"),
    "The Kiss (Klimt)": ("The Kiss", "Gustav Klimt"), "Water Lilies (Monet series)": ("Water Lilies", "Claude Monet"),
    "Kimchi": ("Kimchi", "Korea"), "Paella": ("Paella", "Spain"), "Pho": ("Pho", "Vietnam"), "Sushi": ("Sushi", "Japan"), "Pizza": ("Pizza", "Italy"),
    "Bibimbap": ("Bibimbap", "Korea"), "Taco": ("Taco", "Mexico"), "Croissant": ("Croissant", "France"),
    "Albert Einstein": ("Albert Einstein", None), "Marie Curie": ("Marie Curie", None), "Isaac Newton": ("Isaac Newton", None), "Charles Darwin": ("Charles Darwin", None),
    "Ada Lovelace": ("Ada Lovelace", None), "Nikola Tesla": ("Nikola Tesla", None),
    "Magnus Carlsen": ("Magnus Carlsen", None), "Garry Kasparov": ("Garry Kasparov", None), "Hikaru Nakamura": ("Hikaru Nakamura", None), "Judit Polgár": ("Judit Polgár", None),
    "Gukesh Dommaraju": ("Gukesh D", None), "Bobby Fischer": ("Bobby Fischer", None),
    "LeBron James": ("LeBron James", None), "Stephen Curry": ("Stephen Curry", None), "Michael Jordan": ("Michael Jordan", None), "Kobe Bryant": ("Kobe Bryant", None),
    "Giannis Antetokounmpo": ("Giannis Antetokounmpo", None), "Victor Wembanyama": ("Victor Wembanyama", None),
    "Saturn": ("Saturn", None), "Aurora": ("Aurora", None), "Great Pyramid of Giza": ("Great Pyramid of Giza", None), "Northern cardinal": ("Northern cardinal", None),
    "Volcano": ("Volcano", None), "Mount Everest": ("Mount Everest", None),
    # titles Wikipedia redirects to
    "Twice": ("TWICE", 2015), "IU (entertainer)": ("IU", None), "Jung Kook": ("Jungkook", None), "BigBang (South Korean band)": ("BIGBANG", 2006),
}
FOOT = {"achrafhakimi": "Achraf Hakimi", "alexanderisak": "Alexander Isak", "andresiniesta": "Andrés Iniesta", "bradleybarcola": "Bradley Barcola", "brunofernandes": "Bruno Fernandes",
        "bukayosaka": "Bukayo Saka", "colepalmer": "Cole Palmer", "cristianoronaldo": "Cristiano Ronaldo", "declanrice": "Declan Rice", "dennisbergkamp": "Dennis Bergkamp",
        "desiredoue": "Désiré Doué", "diegomaradona": "Diego Maradona", "erlinghaaland": "Erling Haaland", "federicovalverde": "Federico Valverde", "florianwirtz": "Florian Wirtz",
        "harrykane": "Harry Kane", "jamalmusiala": "Jamal Musiala", "judebellingham": "Jude Bellingham", "khvichakvaratskhelia": "Khvicha Kvaratskhelia", "kylianmbappe": "Kylian Mbappé",
        "lamineyamal": "Lamine Yamal", "lautaromartinez": "Lautaro Martínez", "lionelmessi": "Lionel Messi", "marcovanbasten": "Marco van Basten", "martinodegaard": "Martin Ødegaard",
        "michaelolise": "Michael Olise", "mohamedsalah": "Mohamed Salah", "nicopaz": "Nico Paz", "olegunnarsolskjaer": "Ole Gunnar Solskjær", "ousmanedembele": "Ousmane Dembélé",
        "pedri": "Pedri", "philfoden": "Phil Foden", "rafaelleao": "Rafael Leão", "raphinha": "Raphinha", "robertlewandowski": "Robert Lewandowski", "rodri": "Rodri",
        "sergioaguero": "Sergio Agüero", "sergiroberto": "Sergi Roberto", "victorosimhen": "Victor Osimhen", "viniciusjunior": "Vinícius Júnior", "virgilvandijk": "Virgil van Dijk",
        "waynerooney": "Wayne Rooney", "zinedinezidane": "Zinedine Zidane"}

out, skipped = [], []
for path, c in C["credits"].items():
    cat = path.split("/")[0]
    if cat == "football":
        name, fact = FOOT.get(c["title"]), None
        if not name: skipped.append(path); continue
    else:
        if c["title"] not in FACTS: skipped.append(path + " (" + c["title"] + ")"); continue
        name, fact = FACTS[c["title"]]
    kind = "flag" if c["title"].startswith("Flag of") else "photo"
    out.append({"cat": cat, "src": "proto_assets/" + path, "name": name, "fact": fact, "kind": kind,
                "credit": f'{c["author"] or "Unknown author"} · {c["licence"]}', "page": c["page"]})
js = "/* built by pipelines/build_proto_data.py from proto_assets/credits.json */\nconst IMGS = " + json.dumps(out, ensure_ascii=False) + ";\n"
open(os.path.join(ROOT, "proto_data.js"), "w").write(js)
print(len(out), "records; skipped:", skipped, "\nmissing from download:", C["missing"])
