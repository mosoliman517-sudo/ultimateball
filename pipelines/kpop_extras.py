"""
Extra facts from the K-pop wiki's group pages, for more games:
  idols : `role` (Leader, Main Vocalist, Lead Rapper, Main Dancer, Visual, Center, Maknae...), and where the table has them, a member `color` and `animal`
  groups: official `colors` (name + hex) from the infobox, and `units` (sub-units and duo/trio projects whose members really are members of the group)
Everything is read from the page; nothing is typed in by hand. A role is only stored when the member's row names it.
Run after kpop_rosters.py and kpop_discography.py:  python3 pipelines/kpop_extras.py
"""
import json, os, re, sys, time, urllib.parse
import requests
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_packs as B
from kpop_named import NAMED, key
P = os.path.join(B.ROOT, "packs", "kpop.json"); d = json.load(open(P, encoding="utf-8")); items = d["items"]
API = "https://kpop.fandom.com/api.php"
LINK = re.compile(r"\[\[([^\]|#]+)(?:\|([^\]]+))?\]\]")
ALT = {"i-dle": ["(G)I-dle", "I-dle"], "fromis9": ["fromis_9", "Fromis 9"], "izone": ["IZ*ONE"], "txt": ["TOMORROW X TOGETHER", "TXT"], "kissoflife": ["KISS OF LIFE"], "nctwish": ["NCT WISH"]}
def api(params):
    for wait in (2, 10, 30):
        try:
            r = requests.get(API, params=params, headers=B.HEAD, timeout=40)
            if r.status_code == 200: return r.json()
        except requests.RequestException: pass
        time.sleep(wait)
    return {}
def wikitext(title): return (api({"action": "parse", "page": title, "prop": "wikitext", "redirects": 1, "format": "json"}).get("parse", {}).get("wikitext", {}) or {}).get("*", "")
def group_page(name):
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
def infobox(w):
    i = w.find("{{Infobox")
    if i < 0: return {}
    box = w[i:]; j = box.find("\n}}"); box = box[:j] if j > 0 else box
    return {m.group(1).lower(): m.group(2).strip() for m in re.finditer(r"\n\|\s*(\w+)\s*=(.*?)(?=\n\|\s*\w+\s*=|\Z)", box, re.S)}
def links_of(txt): return [(l.group(1).strip(), re.sub(r"\s*\(.*?\)$", "", (l.group(2) or l.group(1)).strip())) for l in LINK.finditer(txt or "") if ":" not in l.group(1)]
ROLES = [("Leader", r"\bleader\b"), ("Main Vocalist", r"\bmain vocal"), ("Lead Vocalist", r"\blead vocal"), ("Sub Vocalist", r"\bsub[- ]vocal"), ("Main Rapper", r"\bmain rap"), ("Lead Rapper", r"\blead rap"), ("Sub Rapper", r"\bsub[- ]rap"),
         ("Main Dancer", r"\bmain danc"), ("Lead Dancer", r"\blead danc"), ("Sub Dancer", r"\bsub[- ]danc"), ("Center", r"\bcenter\b"), ("Visual", r"\bvisual\b"), ("Maknae", r"\bmaknae\b"), ("Producer", r"\bproducer\b")]
COLOR = re.compile(r"\{\{\s*color box\s*\|\s*(#[0-9a-fA-F]{3,8})\s*\}\}\s*([A-Za-z][A-Za-z '/-]{1,24})", re.I)
def strip(t): return re.sub(r"<ref[^>]*?/>|<ref.*?</ref>|\{\{small\|[^}]*\}\}|<[^>]+>", " ", t or "", flags=re.S | re.I)
def member_rows(w):
    m = re.search(r"==\s*Members?\s*==(.*?)(?=\n==[^=])", w, re.S)
    if not m: return []
    sec = m.group(1); cut = re.search(r"\n\s*!\s[^\n]*?(?<![A-Za-z])(Former|Pre-debut|Departed|Ex-members?|Past members?|Trainees?)(?![a-z])", sec)
    sec = sec[:cut.start()] if cut else sec
    return re.split(r"\n\|-", sec)
cur = {}
for x in items:
    if x["kind"] == "idol":
        for g in x.get("groups", []): cur.setdefault(g, []).append(x)
report = []
for g in [x for x in items if x["kind"] == "group" and key(x["n"]) in {key(n) for n in NAMED}]:
    title = group_page(g["n"])
    if not title: report.append(f"{g['n']}: no wiki page"); continue
    w = wikitext(title); ib = infobox(w); mem = cur.get(g["n"], [])
    cols = [{"hex": h.lower(), "name": n.strip()} for h, n in COLOR.findall(ib.get("colors", ""))]
    if cols: g["colors"] = cols
    roles = 0
    for row in member_rows(w):
        lk = LINK.search(row)
        if not lk: continue
        disp = re.sub(r"\s*\(.*?\)$", "", (lk.group(2) or lk.group(1)).strip()); k = key(disp)
        who = next((e for e in mem if key(e["n"]) == k), None) or next((e for e in mem if len(k) >= 3 and (k in key(e["n"]) or key(e["n"]) in k)), None)
        if not who: continue
        txt = strip(row); found = [name for name, rx in ROLES if re.search(rx, txt, re.I)]
        if found: who["role"] = found; roles += 1
        c = COLOR.search(row)
        if c: who["color"] = {"hex": c.group(1).lower(), "name": c.group(2).strip()}
        an = re.search(r"([\U0001F300-\U0001FAFF][️‍\U0001F300-\U0001FAFF]*)\s*([A-Za-z][A-Za-z ]{1,20})", strip(row))
        if an: who["animal"] = an.group(2).strip()
    units = []
    for t, disp in links_of(ib.get("associated", "")):
        if re.search(r"Entertainment|Nation|Records|Music|SMTOWN|SMROOKIES|\(show\)|Project$|^Wikipedia", t, re.I): continue
        uw = wikitext(t); ui = infobox(uw); um = [dsp for _, dsp in links_of(ui.get("current", ""))]
        inside = [m for m in um if any(key(m) == key(e["n"]) or (len(key(m)) >= 3 and key(m) in key(e["n"])) for e in mem)]
        if len(um) >= 2 and len(inside) >= max(2, int(0.6 * len(um))):
            dd = re.search(r"(\d{4})", ui.get("debut", "")); units.append({"n": disp, "members": inside, "debut": int(dd.group(1)) if dd else None, "src": "kpop.fandom.com/wiki/" + urllib.parse.quote(t.replace(" ", "_"))})
        time.sleep(0.4)
    if units: g["units"] = units
    report.append(f"{g['n']}: {roles}/{len(mem)} roles, colours {len(cols)}, member colours {sum(1 for e in mem if e.get('color'))}, units {[u['n'] for u in units]}")
    json.dump(d, open(P, "w"), ensure_ascii=False, separators=(",", ":")); time.sleep(0.4)
print("\n".join(report))
