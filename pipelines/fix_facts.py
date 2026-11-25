"""
Hand-checked corrections applied to the packs. The raw builder (build_packs.py) kept only the first values Wikidata returned in
alphabetical order, which gave wrong clues (United States: "Carolinian, Chamorro"; Zimbabwe: "Australian dollar"; Einstein:
"inventor, philosopher"). This file is the source of truth for those fields; build_packs.py applies it whenever it writes a pack.
Run by itself to correct the existing packs:  python3 pipelines/fix_facts.py
"""
import json, os, re

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BK = os.path.expanduser("~/Desktop/football-prediction-model")

# name | capital | other accepted capitals | languages (main first) | currency | continent
COUNTRIES = """
Afghanistan|Kabul||Pashto,Dari|afghani|Asia
Albania|Tirana||Albanian|lek|Europe
Algeria|Algiers||Arabic,Berber|Algerian dinar|Africa
Andorra|Andorra la Vella||Catalan|euro|Europe
Angola|Luanda||Portuguese|kwanza|Africa
Antigua and Barbuda|Saint John's|St. John's|English|East Caribbean dollar|North America
Argentina|Buenos Aires||Spanish|Argentine peso|South America
Armenia|Yerevan||Armenian|dram|Asia
Australia|Canberra||English|Australian dollar|Oceania
Austria|Vienna||German|euro|Europe
Azerbaijan|Baku||Azerbaijani|manat|Asia
Bahrain|Manama||Arabic|Bahraini dinar|Asia
Bangladesh|Dhaka||Bengali|taka|Asia
Barbados|Bridgetown||English|Barbados dollar|North America
Belarus|Minsk||Russian,Belarusian|Belarusian ruble|Europe
Belgium|Brussels||Dutch,French,German|euro|Europe
Belize|Belmopan||English|Belize dollar|North America
Benin|Porto-Novo|Cotonou|French|West African CFA franc|Africa
Bhutan|Thimphu||Dzongkha|ngultrum|Asia
Bolivia|Sucre|La Paz|Spanish,Quechua,Aymara|boliviano|South America
Bosnia and Herzegovina|Sarajevo||Bosnian,Serbian,Croatian|convertible mark|Europe
Botswana|Gaborone||English,Setswana|pula|Africa
Brazil|Brasília||Portuguese|real|South America
Brunei|Bandar Seri Begawan||Malay|Brunei dollar|Asia
Bulgaria|Sofia||Bulgarian|euro|Europe
Burkina Faso|Ouagadougou||Mooré,French|West African CFA franc|Africa
Burundi|Gitega|Bujumbura|Kirundi,French,English|Burundian franc|Africa
Cambodia|Phnom Penh||Khmer|riel|Asia
Cameroon|Yaoundé||French,English|Central African CFA franc|Africa
Canada|Ottawa||English,French|Canadian dollar|North America
Cape Verde|Praia||Portuguese,Cape Verdean Creole|Cape Verdean escudo|Africa
Central African Republic|Bangui||Sango,French|Central African CFA franc|Africa
Chad|N'Djamena||Arabic,French|Central African CFA franc|Africa
Chile|Santiago||Spanish|Chilean peso|South America
Colombia|Bogotá||Spanish|Colombian peso|South America
Comoros|Moroni||Comorian,Arabic,French|Comorian franc|Africa
Costa Rica|San José||Spanish|colón|North America
Croatia|Zagreb||Croatian|euro|Europe
Cuba|Havana||Spanish|Cuban peso|North America
Cyprus|Nicosia||Greek,Turkish|euro|Asia
Czech Republic|Prague||Czech|koruna|Europe
Democratic Republic of the Congo|Kinshasa||French,Lingala,Swahili|Congolese franc|Africa
Djibouti|Djibouti|Djibouti City|French,Arabic,Somali|Djiboutian franc|Africa
Dominica|Roseau||English|East Caribbean dollar|North America
Dominican Republic|Santo Domingo||Spanish|Dominican peso|North America
Ecuador|Quito||Spanish|US dollar|South America
Egypt|Cairo||Arabic|Egyptian pound|Africa
El Salvador|San Salvador||Spanish|US dollar|North America
Equatorial Guinea|Ciudad de la Paz|Malabo|Spanish,French,Portuguese|Central African CFA franc|Africa
Eritrea|Asmara||Tigrinya,Arabic,English|nakfa|Africa
Estonia|Tallinn||Estonian|euro|Europe
Eswatini|Mbabane|Lobamba|Swazi,English|lilangeni|Africa
Ethiopia|Addis Ababa||Amharic,Oromo|birr|Africa
Federated States of Micronesia|Palikir||English|US dollar|Oceania
Fiji|Suva||English,Fijian,Fiji Hindi|Fijian dollar|Oceania
Finland|Helsinki||Finnish,Swedish|euro|Europe
France|Paris||French|euro|Europe
Gabon|Libreville||French|Central African CFA franc|Africa
Georgia|Tbilisi||Georgian|lari|Asia
Germany|Berlin||German|euro|Europe
Ghana|Accra||English|cedi|Africa
Greece|Athens||Greek|euro|Europe
Grenada|St. George's|Saint George's|English|East Caribbean dollar|North America
Guatemala|Guatemala City||Spanish|quetzal|North America
Guinea|Conakry||French|Guinean franc|Africa
Guinea-Bissau|Bissau||Portuguese|West African CFA franc|Africa
Guyana|Georgetown||English|Guyanese dollar|South America
Haiti|Port-au-Prince||Haitian Creole,French|gourde|North America
Honduras|Tegucigalpa||Spanish|lempira|North America
Hungary|Budapest||Hungarian|forint|Europe
Iceland|Reykjavík||Icelandic|Icelandic króna|Europe
India|New Delhi|Delhi|Hindi,English|Indian rupee|Asia
Indonesia|Jakarta||Indonesian|rupiah|Asia
Iran|Tehran||Persian|rial|Asia
Iraq|Baghdad||Arabic,Kurdish|Iraqi dinar|Asia
Ireland|Dublin||English,Irish|euro|Europe
Israel|Jerusalem||Hebrew|new shekel|Asia
Italy|Rome||Italian|euro|Europe
Ivory Coast|Yamoussoukro|Abidjan|French|West African CFA franc|Africa
Jamaica|Kingston||English|Jamaican dollar|North America
Japan|Tokyo||Japanese|yen|Asia
Jordan|Amman||Arabic|Jordanian dinar|Asia
Kazakhstan|Astana||Kazakh,Russian|tenge|Asia
Kenya|Nairobi||Swahili,English|Kenyan shilling|Africa
Kingdom of Denmark|Copenhagen||Danish|Danish krone|Europe
Kingdom of the Netherlands|Amsterdam||Dutch|euro|Europe
Kiribati|South Tarawa|Tarawa|English,Gilbertese|Australian dollar|Oceania
Kosovo|Pristina|Prishtina|Albanian,Serbian|euro|Europe
Kuwait|Kuwait City||Arabic|Kuwaiti dinar|Asia
Kyrgyzstan|Bishkek||Kyrgyz,Russian|som|Asia
Laos|Vientiane||Lao|kip|Asia
Latvia|Riga||Latvian|euro|Europe
Lebanon|Beirut||Arabic|Lebanese pound|Asia
Lesotho|Maseru||Sesotho,English|loti|Africa
Liberia|Monrovia||English|Liberian dollar|Africa
Libya|Tripoli||Arabic|Libyan dinar|Africa
Liechtenstein|Vaduz||German|Swiss franc|Europe
Lithuania|Vilnius||Lithuanian|euro|Europe
Luxembourg|Luxembourg|Luxembourg City|Luxembourgish,French,German|euro|Europe
Madagascar|Antananarivo||Malagasy,French|ariary|Africa
Malawi|Lilongwe||English,Chewa|Malawian kwacha|Africa
Malaysia|Kuala Lumpur|Putrajaya|Malay|ringgit|Asia
Maldives|Malé||Dhivehi|rufiyaa|Asia
Mali|Bamako||Bambara,French|West African CFA franc|Africa
Malta|Valletta||Maltese,English|euro|Europe
Marshall Islands|Majuro||Marshallese,English|US dollar|Oceania
Mauritania|Nouakchott||Arabic|ouguiya|Africa
Mauritius|Port Louis||English,French,Mauritian Creole|Mauritian rupee|Africa
Mexico|Mexico City||Spanish|Mexican peso|North America
Moldova|Chișinău||Romanian|Moldovan leu|Europe
Monaco|Monaco||French|euro|Europe
Mongolia|Ulaanbaatar|Ulan Bator|Mongolian|tögrög|Asia
Montenegro|Podgorica||Montenegrin|euro|Europe
Morocco|Rabat||Arabic,Berber|dirham|Africa
Mozambique|Maputo||Portuguese|metical|Africa
Myanmar|Naypyidaw|Nay Pyi Taw|Burmese|kyat|Asia
Namibia|Windhoek||English|Namibian dollar|Africa
Nauru|Yaren|Yaren District|Nauruan,English|Australian dollar|Oceania
Nepal|Kathmandu||Nepali|Nepalese rupee|Asia
New Zealand|Wellington||English,Māori|New Zealand dollar|Oceania
Nicaragua|Managua||Spanish|córdoba|North America
Niger|Niamey||Hausa,French|West African CFA franc|Africa
Nigeria|Abuja||English|naira|Africa
North Korea|Pyongyang||Korean|North Korean won|Asia
North Macedonia|Skopje||Macedonian,Albanian|denar|Europe
Norway|Oslo||Norwegian|Norwegian krone|Europe
Oman|Muscat||Arabic|Omani rial|Asia
Pakistan|Islamabad||Urdu,English|Pakistani rupee|Asia
Palau|Ngerulmud||Palauan,English|US dollar|Oceania
Palestine|East Jerusalem|Jerusalem,Ramallah|Arabic|new shekel|Asia
Panama|Panama City||Spanish|balboa and US dollar|North America
Papua New Guinea|Port Moresby||Tok Pisin,English|kina|Oceania
Paraguay|Asunción||Spanish,Guarani|guaraní|South America
People's Republic of China|Beijing||Mandarin Chinese|renminbi|Asia
Peru|Lima||Spanish,Quechua,Aymara|sol|South America
Philippines|Manila||Filipino,English|Philippine peso|Asia
Poland|Warsaw||Polish|złoty|Europe
Portugal|Lisbon||Portuguese|euro|Europe
Qatar|Doha||Arabic|Qatari riyal|Asia
Republic of the Congo|Brazzaville||French|Central African CFA franc|Africa
Romania|Bucharest||Romanian|Romanian leu|Europe
Russia|Moscow||Russian|Russian ruble|Europe
Rwanda|Kigali||Kinyarwanda,English,French|Rwandan franc|Africa
Saint Kitts and Nevis|Basseterre||English|East Caribbean dollar|North America
Saint Lucia|Castries||English|East Caribbean dollar|North America
Saint Vincent and the Grenadines|Kingstown||English|East Caribbean dollar|North America
Samoa|Apia||Samoan,English|tālā|Oceania
San Marino|San Marino|City of San Marino|Italian|euro|Europe
Saudi Arabia|Riyadh||Arabic|Saudi riyal|Asia
Senegal|Dakar||Wolof,French|West African CFA franc|Africa
Serbia|Belgrade||Serbian|Serbian dinar|Europe
Seychelles|Victoria||Seychellois Creole,English,French|Seychellois rupee|Africa
Sierra Leone|Freetown||English,Krio|leone|Africa
Singapore|Singapore|Singapore City|English,Malay,Mandarin,Tamil|Singapore dollar|Asia
Slovakia|Bratislava||Slovak|euro|Europe
Slovenia|Ljubljana||Slovene|euro|Europe
Solomon Islands|Honiara||English|Solomon Islands dollar|Oceania
Somalia|Mogadishu||Somali,Arabic|Somali shilling|Africa
South Africa|Pretoria|Cape Town,Bloemfontein|Zulu,Xhosa,Afrikaans,English|rand|Africa
South Korea|Seoul||Korean|South Korean won|Asia
South Sudan|Juba||English|South Sudanese pound|Africa
Spain|Madrid||Spanish|euro|Europe
Sri Lanka|Sri Jayawardenepura Kotte|Colombo,Kotte|Sinhala,Tamil|Sri Lankan rupee|Asia
Sudan|Khartoum||Arabic,English|Sudanese pound|Africa
Suriname|Paramaribo||Dutch|Surinamese dollar|South America
Sweden|Stockholm||Swedish|Swedish krona|Europe
Switzerland|Bern|Berne|German,French,Italian,Romansh|Swiss franc|Europe
Syria|Damascus||Arabic|Syrian pound|Asia
São Tomé and Príncipe|São Tomé||Portuguese|dobra|Africa
Taiwan|Taipei||Mandarin Chinese|New Taiwan dollar|Asia
Tajikistan|Dushanbe||Tajik|somoni|Asia
Tanzania|Dodoma|Dar es Salaam|Swahili,English|Tanzanian shilling|Africa
Thailand|Bangkok||Thai|baht|Asia
The Bahamas|Nassau||English|Bahamian dollar|North America
The Gambia|Banjul||English|dalasi|Africa
Timor-Leste|Dili||Tetum,Portuguese|US dollar|Asia
Togo|Lomé||French|West African CFA franc|Africa
Tonga|Nukuʻalofa||Tongan,English|paʻanga|Oceania
Trinidad and Tobago|Port of Spain||English|Trinidad and Tobago dollar|North America
Tunisia|Tunis||Arabic|Tunisian dinar|Africa
Turkey|Ankara||Turkish|Turkish lira|Asia
Turkmenistan|Ashgabat||Turkmen|Turkmen manat|Asia
Tuvalu|Funafuti||Tuvaluan,English|Australian dollar|Oceania
Uganda|Kampala||English,Swahili|Ugandan shilling|Africa
Ukraine|Kyiv|Kiev|Ukrainian|hryvnia|Europe
United Arab Emirates|Abu Dhabi||Arabic|UAE dirham|Asia
United Kingdom|London||English|pound sterling|Europe
United States|Washington, D.C.|Washington,Washington DC|English|US dollar|North America
Uruguay|Montevideo||Spanish|Uruguayan peso|South America
Uzbekistan|Tashkent||Uzbek|som|Asia
Vanuatu|Port Vila||Bislama,English,French|vatu|Oceania
Vatican City|Vatican City||Italian,Latin|euro|Europe
Venezuela|Caracas||Spanish|bolívar|South America
Vietnam|Hanoi||Vietnamese|đồng|Asia
Yemen|Sanaa|Sana'a,Aden|Arabic|Yemeni rial|Asia
Zambia|Lusaka||English|Zambian kwacha|Africa
Zimbabwe|Harare||Shona,Ndebele,English|Zimbabwe Gold and US dollar|Africa
"""
# shorter everyday names, with the other names people type
RENAME = {"People's Republic of China": ("China", ["People's Republic of China", "PRC"]), "Kingdom of the Netherlands": ("Netherlands", ["Holland", "Kingdom of the Netherlands"]),
          "Kingdom of Denmark": ("Denmark", ["Kingdom of Denmark"]), "Timor-Leste": ("East Timor", ["Timor-Leste", "Timor Leste"])}
ALSO = {"United States": ["USA", "US", "United States of America", "America"], "United Kingdom": ["UK", "Great Britain", "Britain"], "United Arab Emirates": ["UAE", "Emirates"],
        "Czech Republic": ["Czechia"], "Ivory Coast": ["Côte d'Ivoire", "Cote d Ivoire"], "Eswatini": ["Swaziland"], "Myanmar": ["Burma"], "Turkey": ["Türkiye", "Turkiye"],
        "Democratic Republic of the Congo": ["DR Congo", "DRC"], "Republic of the Congo": ["Congo Brazzaville", "Congo"], "South Korea": ["Korea South"], "The Bahamas": ["Bahamas"], "The Gambia": ["Gambia"],
        "Vatican City": ["Vatican", "Holy See"], "Bosnia and Herzegovina": ["Bosnia"], "North Macedonia": ["Macedonia"], "Cape Verde": ["Cabo Verde"], "Federated States of Micronesia": ["Micronesia"]}

# what each historical figure is chiefly known as
PEOPLE = {}
for line in """
politician and businessman: Donald Trump
playwright and poet: William Shakespeare
dictator: Adolf Hitler; Joseph Stalin; Benito Mussolini; Muammar Gaddafi
singer: Michael Jackson; Madonna; Freddie Mercury
physicist: Albert Einstein; Isaac Newton; Marie Curie; Stephen Hawking; Michael Faraday; Niels Bohr; Max Planck; Ernest Rutherford; Enrico Fermi
philosopher: Aristotle; Confucius; Plato; Socrates; Immanuel Kant; Friedrich Nietzsche; René Descartes; Jean-Jacques Rousseau; John Locke; Georg Wilhelm Friedrich Hegel; Arthur Schopenhauer; Ludwig Wittgenstein; Benedictus de Spinoza; Laozi; Voltaire; Jean-Paul Sartre; Simone de Beauvoir; Francis Bacon; Bertrand Russell
president: Vladimir Putin; Nelson Mandela; Abraham Lincoln; George W. Bush; Joe Biden; George Washington; Ronald Reagan; John F. Kennedy; Bill Clinton; Thomas Jefferson; Richard Nixon; Harry S. Truman; George H. W. Bush; Theodore Roosevelt; Dwight D. Eisenhower; Woodrow Wilson; John Adams; James Madison; Lyndon B. Johnson; Jimmy Carter; Gerald Ford; Mustafa Kemal Atatürk; Charles de Gaulle; François Hollande; Nicolas Sarkozy; Xi Jinping; Hugo Chávez; Recep Tayyip Erdoğan; Lech Wałęsa
prime minister: Winston Churchill; Margaret Thatcher; Jawaharlal Nehru; Indira Gandhi; Narendra Modi; Benjamin Netanyahu
chancellor: Angela Merkel; Otto von Bismarck
revolutionary leader: Vladimir Lenin; Mao Zedong; Fidel Castro; Simón Bolívar; Leon Trotsky; Rosa Luxemburg
political theorist: Karl Marx; Friedrich Engels; Niccolò Machiavelli
independence leader: Mahatma Gandhi
civil rights leader: Martin Luther King Jr.
diplomat: Kofi Annan
painter and inventor: Leonardo da Vinci
general and emperor: Napoleon
general and statesman: Julius Caesar
emperor: Augustus; Qin Shi Huang; Marcus Aurelius; Ashoka
conqueror: Alexander the Great; Genghis Khan; Hernán Cortés
king or queen: Elizabeth II; Charles III; Louis XIV of France; Victoria; Cleopatra
emperor of the Franks: Charlemagne
novelist: Leo Tolstoy; Fyodor Dostoyevsky; Victor Hugo; Miguel de Cervantes; Charles Dickens; Franz Kafka; George Orwell; Gabriel García Márquez; James Joyce; Ernest Hemingway; Jane Austen; Albert Camus; Marcel Proust; Jules Verne; Agatha Christie; Honoré de Balzac; Virginia Woolf; Alexandre Dumas; Arthur Conan Doyle; Maxim Gorky; Naguib Mahfouz; J. R. R. Tolkien
writer: Mark Twain; Edgar Allan Poe; Oscar Wilde; Jorge Luis Borges; Hans Christian Andersen; Anton Chekhov; Rudyard Kipling
poet: Dante Alighieri; Johann Wolfgang von Goethe; Rabindranath Tagore; Virgil; Alexander Pushkin; Lord Byron; Matsuo Bashō; Li Bai; Geoffrey Chaucer; Friedrich Schiller; Charles Baudelaire
playwright: Molière; Sophocles
composer: Wolfgang Amadeus Mozart; Ludwig van Beethoven; Johann Sebastian Bach; Richard Wagner; Frédéric Chopin; Pyotr Ilyich Tchaikovsky; Giuseppe Verdi; Franz Schubert
singer and songwriter: John Lennon; Bob Dylan
jazz musician: Louis Armstrong
painter: Vincent van Gogh; Pablo Picasso; Salvador Dalí; Rembrandt; Frida Kahlo; Raphael; Francisco Goya; Albrecht Dürer; Henri Matisse; Peter Paul Rubens; Katsushika Hokusai
sculptor and painter: Michelangelo
artist: Andy Warhol
architect: Le Corbusier; Frank Lloyd Wright
actor and filmmaker: Charlie Chaplin
film director: Alfred Hitchcock; Akira Kurosawa
actress: Sarah Bernhardt
animator and producer: Walt Disney
footballer: Pelé
religious leader: The Buddha; Pope Francis; John Paul II; Benedict XVI; Paul the Apostle
theologian: Martin Luther; Augustine of Hippo; Thomas Aquinas
military leader and saint: Joan of Arc
naturalist: Charles Darwin
astronomer: Galileo Galilei; Nicolaus Copernicus; Johannes Kepler
inventor: Thomas Edison; Nikola Tesla; Johannes Gutenberg
businessman: Steve Jobs; Henry Ford
chemist and inventor: Alfred Nobel; Dmitri Mendeleev
scientist and statesman: Benjamin Franklin
mathematician: Archimedes; Pythagoras; Euclid; Carl Friedrich Gauss; Leonhard Euler; Blaise Pascal; Gottfried Wilhelm Leibniz
explorer: Christopher Columbus; Marco Polo; Ferdinand Magellan; Vasco da Gama; James Cook; Roald Amundsen
cosmonaut: Yuri Gagarin
economist: Adam Smith; John Maynard Keynes
sociologist: Max Weber
linguist: Noam Chomsky
physician: Hippocrates; Avicenna
orator and statesman: Cicero
last Soviet leader: Mikhail Gorbachev
""".strip().split("\n"):
    job, names = line.split(": ", 1)
    for n in names.split("; "): PEOPLE[n] = job
QNAMES = {"Q7186": "Marie Curie", "Q6294": "Hillary Clinton", "Q3044": "Charlemagne", "Q34743": "Rudyard Kipling", "Q5580": "Albrecht Dürer"}
PEOPLE["Hillary Clinton"] = "politician and diplomat"

ORIGIN = {"Laksa": "Southeast Asia", "Rogan josh": "Kashmir", "Pancake": "Ancient world", "Waffle": "Low Countries", "Jin deui": "China", "Samosa": "Central Asia and Middle East"}
CHINA = "People's Republic of China"
INGREDIENT = {"Agaricus": "mushroom", "Aleurites moluccanus": "candlenut", "Allium": "onion", "Allium ascalonicum": "shallot", "Allium sativum": "garlic", "Alpinia galanga": "galangal", "Bambusoideae": "bamboo shoot",
    "Beltxa": "black beans", "Beta": "beetroot", "Beta vulgaris": "beetroot", "Brassica oleracea var. capitata": "cabbage", "Brassica oleracea var. palmifolia": "black kale", "Brassica rapa subsp. chinensis": "bok choy",
    "Capsicum annuum": "peppers", "Chanos chanos": "milkfish", "Clupea": "herring", "Coriandrum sativum": "coriander", "Cucumis sativus": "cucumber", "Curcuma longa": "turmeric", "Cymbopogon": "lemongrass",
    "Cymbopogon citratus": "lemongrass", "Datshi": "cheese", "European anchovy": "anchovy", "European pilchard": "sardine", "Faba asturiana": "Asturian white beans", "Foeniculum vulgare": "fennel", "Fontina PDO": "fontina",
    "Garcinia atroviridis": "asam gelugur", "Gnetum gnemon": "melinjo", "Illicium verum": "star anise", "Indonesian peanut sauces": "peanut sauce", "Kaempferia galanga": "aromatic ginger", "Lactuca sativa": "lettuce",
    "Mielie-meal": "maize meal", "Mytilus edulis": "mussels", "Octopoda": "octopus", "Pecorino Romano PDO": "pecorino romano", "Phaseolus": "beans", "Phaseolus vulgaris": "beans", "Phrynium placentarium": "phrynium leaves",
    "Piper": "pepper", "Pistacia": "pistachio", "Pisum sativum": "peas", "Platostoma palustre": "Chinese mesona", "Prunus dulcis": "almond", "Raphanus sativus": "radish", "Rumex acetosa": "sorrel", "Sechium edule": "chayote",
    "Sesamum indicum": "sesame", "Tamarindus indica": "tamarind", "Thunnus": "tuna", "Tilia leaf": "linden leaf", "Triticum": "wheat", "Vigna radiata": "mung bean", "sodium chloride": "salt", "table salt": "salt", "Olive de Nice": "Nice olives"}
STUDIO = {"Naruto": ["Pierrot"], "Pokémon": ["OLM, Inc."]}

def _country(x, table):
    row = table.get(x["n"]) or table.get(next((k for k, (short, _) in RENAME.items() if short == x["n"]), ""))
    if not row: return False
    name, cap, alts, langs, cur, cont = row
    x["capital"], x["language"], x["currency"], x["continent"] = cap, langs.split(","), [cur], cont
    if alts: x["capAlt"] = alts.split(",") if name != "United States" else ["Washington", "Washington DC", "Washington D.C."]
    also = list(ALSO.get(name, []))
    if name in RENAME: x["n"], extra = RENAME[name]; also += extra
    if also: x["alt"] = also
    return True

def _clean_credit(x):
    for c in (x.get("cr") or {}).values():
        if isinstance(c, dict) and c.get("by"):
            by = c["by"].strip()
            if len(by) % 2 == 0 and by[:len(by) // 2] == by[len(by) // 2:]: by = by[:len(by) // 2]
            c["by"] = by.replace("Unknown authorUnknown author", "Unknown author")

def apply(world, items):
    table = {r.split("|")[0]: r.split("|") for r in COUNTRIES.strip().split("\n")}
    seen = set(); out = []
    for x in items:
        _clean_credit(x)
        if world == "geography" and x.get("kind") == "country" and not _country(x, table): print("  no checked facts for country", x["n"])
        if world == "geography" and x.get("kind") == "landmark" and x.get("country") in RENAME: x["country"] = RENAME[x["country"]][0]
        if world == "history" and x.get("kind") == "person":
            x["n"] = QNAMES.get(x["n"], x["n"])
            if x["n"] in PEOPLE: x["occ"] = [PEOPLE[x["n"]]]
        if world == "food":
            x["origin"] = ORIGIN.get(x["n"], "China" if x.get("origin") == CHINA else x.get("origin"))
            if x.get("made"): x["made"] = list(dict.fromkeys(INGREDIENT.get(i, i.replace(" as food", "")) for i in x["made"]))
        if world == "anime" and x.get("kind") == "anime" and x["n"] in STUDIO: x["studios"] = STUDIO[x["n"]]
        if world == "kpop":
            if x["id"] in seen: continue
            seen.add(x["id"])
        out.append(x)
    return out

def refresh_football(items):
    """Clubs and players move: take current club, value and the dated manager from ballknowledge's latest data (read only)."""
    q = json.load(open(os.path.join(BK, "02_processed_data/quiz_data.json"), encoding="utf-8"))
    players = {"p" + str(p["id"]): p for p in q["players"]}; n = {"coach": 0, "club": 0, "val": 0}
    for x in items:
        if x["kind"] == "club":
            f = q["clubs"].get(x["n"], {})
            coach, at = f.get("coach") or None, f.get("coachAt")
            if x.get("coach") != coach: n["coach"] += 1
            x["coach"], x["coachAt"] = coach, at
        elif x["kind"] == "player" and x["id"] in players:
            p = players[x["id"]]
            if p.get("club") and p["club"] != x.get("club"): x["club"] = p["club"]; n["club"] += 1
            if p.get("val") and int(float(p["val"])) != x.get("val"): x["val"] = int(float(p["val"])); n["val"] += 1
    return n, q.get("valAt"), q.get("asOf")

if __name__ == "__main__":
    for w in ["geography", "history", "food", "anime", "kpop", "chess", "football", "basketball"]:
        p = os.path.join(ROOT, "packs", w + ".json"); d = json.load(open(p, encoding="utf-8")); before = len(d["items"])
        d["items"] = apply(w, d["items"])
        if w == "football" and os.path.isdir(BK):
            n, valat, asof = refresh_football(d["items"]); d["valAt"], d["asOf"] = valat, asof; print("football refreshed:", n, "values as of", valat, "data as of", asof)
        json.dump(d, open(p, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        print(w, before, "->", len(d["items"]))
    missing = [x["n"] for x in json.load(open(os.path.join(ROOT, "packs", "history.json")))["items"] if x["kind"] == "person" and x["n"] not in PEOPLE]
    print("people without a checked occupation:", missing)
