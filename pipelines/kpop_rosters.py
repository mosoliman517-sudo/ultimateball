"""
Complete, current line-ups for the named groups, read from each group's "Members" table on the K-pop wiki (kpop.fandom.com).
For every named group this: (1) takes the current members from the table (stopping at Former / Pre-debut / Departed rows),
(2) matches each to an idol already in the data (and renames them to the stage name the wiki uses, e.g. "Vernon Chwe" -> "Vernon"),
(3) adds any member that is missing, with the member's own page picture, (4) marks idols who are no longer members as `former`
(kept in the data, left out of the line-up games), (5) stores the official member count and the debut year from the page's first
paragraph (fixes years Wikidata had wrong). Run after kpop_manual.py, before kpop_curated.py:  python3 pipelines/kpop_rosters.py
"""
import json, os, re, sys, time, io, urllib.parse
import requests
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
from kpop_named import NAMED, key
P = os.path.join(B.ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
API = "https://kpop.fandom.com/api.php"
def api(params):
    for wait in (2, 10, 30):
        try:
            r = requests.get(API, params=params, headers=B.HEAD, timeout=40)
            if r.status_code == 200: return r.json()
        except requests.RequestException: pass
        time.sleep(wait)
    return {}
ALT = {"i-dle": ["(G)I-dle", "I-dle"], "fromis9": ["fromis_9", "Fromis 9"], "izone": ["IZ*ONE"], "txt": ["TOMORROW X TOGETHER", "TXT"], "kissoflife": ["KISS OF LIFE"], "nctwish": ["NCT WISH"]}
def group_page(name):
    """The wiki page of a group: a "Name (group)" title wins over the plain title (which can be a disambiguation page)."""
    plain = None
    for q in [name] + ALT.get(key(name), []):
        r = api({"action": "opensearch", "search": q, "limit": 8, "format": "json"}); t = (r[1] if r and len(r) > 1 else [])
        for c in t:
            if "/" in c: continue
            base = re.sub(r"\s*\((?:group|band|boy group|girl group)\)$", "", c, flags=re.I)
            if key(base) in {key(q), key(name)}:
                if base != c: return c
                plain = plain or c
    return plain
LINK = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
def parse_members(w, group, strict=True, skip=()):
    m = re.search(r"==\s*Members?\s*==(.*?)(?=\n==[^=])", w, re.S)
    if not m: return []
    sec = m.group(1)
    cut = re.search(r"\n\s*!\s[^\n]*?(?<![A-Za-z])(Former|Pre-debut|Departed|Ex-members?|Past members?|Trainees?)(?![a-z])", sec)   # a heading row only: not the word "Formerly" in a footnote
    cur = sec[:cut.start()] if cut else sec
    out = []
    for row in re.split(r"\n\|-", cur):
        if strict and not re.search(r"\d{4}\s*[–—-]\s*(?:present|\d{4})|present", row, re.I): continue   # a member row has a years-active cell; footnote rows do not
        for l in LINK.finditer(row):
            title, disp = l.group(1).strip(), (l.group(2) or l.group(1)).strip()
            if ":" in title or key(title) == key(group) or key(title) in skip or key(disp) in skip or re.search(r"Entertainment|Records|Wikipedia", title): continue
            out.append((title, re.sub(r"\s*\(.*?\)$", "", disp).strip())); break
    return out
def infobox(w):
    """The group's infobox as {field: text}; its `current` and `former` fields are explicit member lists."""
    i = w.find("{{Infobox")
    if i < 0: return {}
    box = w[i:]; j = box.find("\n}}")
    box = box[:j] if j > 0 else box
    return {m.group(1).lower(): m.group(2).strip() for m in re.finditer(r"\n\|\s*(\w+)\s*=(.*?)(?=\n\|\s*\w+\s*=|\Z)", box, re.S)}
def links_of(txt):
    out = []
    for l in LINK.finditer(txt or ""):
        t, dsp = l.group(1).strip(), (l.group(2) or l.group(1)).strip()
        if ":" not in t: out.append((t, re.sub(r"\s*\(.*?\)$", "", dsp).strip()))
    return out
def clean(t):
    t = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", t or ""); t = re.sub(r"\{\{.*?\}\}|<[^>]*>|'''|''|\*", "", t)
    return re.sub(r"\s+", " ", t).strip()
def thumb(title):
    r = api({"action": "query", "titles": title, "prop": "pageimages", "piprop": "thumbnail", "pithumbsize": 720, "format": "json"})
    try: return next(iter(r["query"]["pages"].values()))["thumbnail"]["source"]
    except Exception: return None
by_group = {}
for x in items:
    if x["kind"] == "idol":
        for g in x.get("groups", []): by_group.setdefault(g, []).append(x)
report = []
for g in [x for x in items if x["kind"] == "group" and key(x["n"]) in {key(n) for n in NAMED}]:
    title = group_page(g["n"])
    if not title: report.append(f"{g['n']}: no wiki page"); continue
    w = (api({"action": "parse", "page": title, "prop": "wikitext", "redirects": 1, "format": "json"}).get("parse", {}).get("wikitext", {}) or {}).get("*", "")
    body = re.sub(r"\{\{Infobox.*?\n\}\}", "", w, count=1, flags=re.S)   # skip the infobox and quote box: the first prose sentence names the debut
    y = re.search(r"debut(?:ed)? (?:on|in) (?:[A-Z][a-z]+ \d{1,2}, )?(\d{4})", body[:6000])
    if y: g["debut"] = int(y.group(1)); g["gen"] = 3 if g["debut"] < 2018 else 4 if g["debut"] < 2023 else 5
    NUM = {w: i for i, w in enumerate("zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty".split())}
    lc = re.search(r"\b(\w+)-member", re.sub(r"\{\{Infobox.*?\n\}\}", "", w, count=1, flags=re.S)[:6000])
    if lc: g["lead_count"] = NUM.get(lc.group(1).lower()) or (int(lc.group(1)) if lc.group(1).isdigit() else None)   # what the page's first sentence says ("a nine-member girl group")
    g["source"] = "kpop.fandom.com/wiki/" + title.replace(" ", "_"); g["verified_on"] = time.strftime("%Y-%m-%d")
    titles = {key(t) for s_ in items if s_["kind"] == "song" and s_.get("by") == g["n"] for t in (s_["n"], s_.get("album")) if t}
    ib = infobox(w); cur_ib = links_of(ib.get("current")); fmr_ib = links_of(ib.get("former"))
    if ib.get("fandom"): g["fandom"] = clean(ib["fandom"])
    if ib.get("label"):
        lab = links_of(ib["label"]); g["agency"] = lab[0][1] if lab else clean(ib["label"]).split("(")[0].strip()
    if ib.get("hangul"): g["aliases"] = sorted(set(g.get("aliases", []) + [clean(ib["hangul"])] + ALT.get(key(g["n"]), [])))
    yrs = ib.get("years", "") or ib.get("years_active", "")
    if yrs: g["status"] = "active" if re.search(r"present", yrs, re.I) else "disbanded"
    dd = re.search(r"([A-Z][a-z]+ \d{1,2}, \d{4})", ib.get("debut", ""))
    if dd: g["debut_date"] = dd.group(1)
    g["former_members"] = [dsp for _, dsp in fmr_ib]
    tbl = parse_members(w, g["n"])
    # two sources for the current line-up: the infobox list and the Members table (the infobox can leave out members on hiatus);
    # take whichever is closer to the count the page's first sentence states
    cands = [m for m in (cur_ib if len(cur_ib) >= 2 else [], tbl) if m]
    members = min(cands, key=lambda m: abs(len(m) - (g.get("lead_count") or len(m)))) if cands else []
    if g.get("lead_count") and len(members) < 0.6 * g["lead_count"]:   # the strict reading missed rows: read every row, minus anything that is one of the group's songs or albums
        loose = parse_members(w, g["n"], strict=False, skip=titles)
        if abs(len(loose) - g["lead_count"]) < abs(len(members) - g["lead_count"]): members = loose
    if not members: report.append(f"{g['n']}: no members table found"); continue
    have = by_group.get(g["n"], []); keep_ids = set(); added = 0
    for ttl, disp in members:
        hit = next((e for e in have if key(e["n"]) == key(disp)), None) or next((e for e in have if len(key(disp)) >= 3 and (key(disp) in key(e["n"]) or key(e["n"]) in key(disp)) and e["id"] not in keep_ids), None)
        if hit:
            if " " in hit["n"] and " " not in disp and key(disp) in key(hit["n"]): hit["n"] = disp   # "Vernon Chwe" -> "Vernon"; never overwrite a stage name with a legal name
            hit.pop("former", None); keep_ids.add(hit["id"]); continue
        new = {"id": "wiki-" + key(g["n"]) + "-" + key(disp), "n": disp, "kind": "idol", "fame": 1, "groups": [g["n"]], "src": "K-pop wiki members table"}
        src = thumb(ttl)
        if src:
            try:
                img = requests.get(src, headers=B.HEAD, timeout=60)
                if img.status_code == 200:
                    im = Image.open(io.BytesIO(img.content)).convert("RGB"); im.thumbnail((720, 720)); rel = f"img/kpop/{new['id']}_img.webp"
                    im.save(os.path.join(B.ROOT, rel), "WEBP", quality=84); new["img"] = rel
                    new["cr"] = {"img": {"by": "Kpop Wiki (Fandom): concept photo", "lic": "used with the site owner's permission", "page": "https://kpop.fandom.com/wiki/" + urllib.parse.quote(ttl.replace(" ", "_"))}}
            except Exception: pass
        items.append(new); keep_ids.add(new["id"]); added += 1; time.sleep(0.6)
    former = [e["n"] for e in have if e["id"] not in keep_ids]
    for e in have:
        if e["id"] not in keep_ids:
            if e.get("src") == "K-pop wiki members table": e["drop"] = True
            else: e["former"] = True
    g["members"] = len(members)
    report.append(f"{g['n']}: {len(members)} members (+{added} added, {len(former)} marked former {former}) debut {g.get('debut')}")
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); time.sleep(0.5)
d["items"] = [x for x in d["items"] if not x.get("drop")]
json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":"))
print("\n".join(report))
