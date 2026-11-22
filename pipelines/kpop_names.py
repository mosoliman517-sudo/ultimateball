"""
Idols are known by their stage names (Wonyoung, Seulgi, Nayeon), not their legal names (Jang Won-young). This gives every idol in
packs/kpop.json the name fans use:
  1. for a Korean "Family Given-name" label, the given name with the hyphen dropped (Kang Seul-gi -> Seulgi);
  2. otherwise the label as it is (Lisa, G-Dragon, Jackson Wang); Wikidata's pseudonym is used only for idols with no English label.
The legal name is kept as `full`: it still counts as a right answer and appears as a late clue.
Run after build_packs.py kpop:  python3 pipelines/kpop_names.py
"""
import json, os, re, time, requests

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
HEAD = {"User-Agent": "games-platform-prototype/0.2 (student project)"}
SURNAMES = set("kim lee yi park choi jung jeong kang cho jo yoon yun jang lim im han oh seo shin kwon hwang ahn an song yoo yu hong jeon ko go moon yang son bae baek heo nam shim sim noh ha kwak sung seong cha joo ju woo min ryu yoo na jin ji um eom byun byeon chae won bang gong hyun doh do chun kook yeo pyo myung ki tak ok ma kang kwon".split())

p = os.path.join(ROOT, "packs", "kpop.json"); d = json.load(open(p, encoding="utf-8"))
idols = [x for x in d["items"] if x["kind"] == "idol"]
stage = {}
for i in range(0, len(idols), 150):
    ids = " ".join("wd:" + x["id"] for x in idols[i:i + 150] if re.match(r"^Q\d+$", x["id"]))
    q = f"SELECT ?p ?s WHERE {{ VALUES ?p {{ {ids} }} ?p wdt:P742 ?s. }}"
    for _ in range(4):
        r = requests.get("https://query.wikidata.org/sparql", params={"query": q, "format": "json"}, headers=HEAD, timeout=90)
        if r.status_code == 200: break
        time.sleep(8)
    for b in r.json()["results"]["bindings"]:
        v = b["s"]["value"].strip()
        if re.fullmatch(r"[A-Za-zÀ-ÿ0-9 .'&!-]{1,24}", v):
            stage.setdefault(b["p"]["value"].rsplit("/", 1)[-1], []).append(v)
    time.sleep(1)

KEEP_FULL = {"Lee Know", "Kim Lip", "Kim Woojin", "Han Seungwoo", "Bang Chan", "Jung Kook"}   # stage names that look like a surname + given name, or idols known by the full name
def given(label):
    w = label.split()
    if label in KEEP_FULL or len(w) != 2 or w[0].lower() not in SURNAMES: return None
    if re.fullmatch(r"[A-Z][a-z]+-[a-z]+", w[1]): return w[1].replace("-", "")          # Kang Seul-gi -> Seulgi
    if re.fullmatch(r"[A-Z][a-z]{4,}", w[1]): return w[1]                                # Im Nayeon -> Nayeon, Lim Yoona -> Yoona (5+ letters, so Bang Chan and Jung Kook stay whole)
    return None

changed = 0
for x in idols:
    if "full" in x: x["n"] = x["full"]          # re-runnable
    label = x["n"]; s = stage.get(x["id"]); new = None
    new = given(label)
    if not new and s and re.fullmatch(r"Q\d+", label):   # Wikidata's pseudonym list is noisy (solo aliases, nicknames): used only when there is no English name at all
        new = min(s, key=len)
    if new and new != label:
        x["full"] = label; x["n"] = new; changed += 1
json.dump(d, open(p, "w"), ensure_ascii=False, separators=(",", ":"))
print(f"{changed} of {len(idols)} idols now use their stage name; {len(stage)} stage names found on Wikidata")
print([f"{x.get('full', '')} -> {x['n']}" for x in idols if x.get("full")][:25])
