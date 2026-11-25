/* ================= pictures: where they come from, who owns them, and how to have one removed ================= */
const REMOVAL = "https://github.com/mosoliman517-sudo/ultimateball/issues/new";
const removalLink = (about) => `${REMOVAL}?title=${encodeURIComponent("Picture removal request" + (about ? ": " + about : ""))}&body=${encodeURIComponent("Which picture (name and where you saw it):\n\nYour connection to it (you, the owner, a representative):\n\nThis page is public, so please don't include private details.")}`;
/* host of a credit link → how to describe the source, and whether it is free to reuse */
const SOURCES = [
  [/commons\.wikimedia\.org/, "Wikimedia Commons", "Free licences or public domain; each answer card names the author and licence."],
  [/kpop\.fandom\.com/, "K-pop fan wiki", "Not freely licensed. Idol photos belong to their owners."],
  [/anilist\.co/, "AniList", "Not freely licensed. Anime covers and character art belong to their studios and publishers."],
  [/deezer\.com/, "Deezer", "Not freely licensed. Artist pictures belong to their owners."],
  [/apple\.com|mzstatic\.com/, "Apple Music", "Album covers and song previews belong to the labels and are shown with a link to Apple Music."],
  [/espn/, "ESPN", "Not freely licensed. NBA player pictures and team logos, shown only to identify them."],
  [/ea\.com/, "EA Sports FC", "Not freely licensed. Player portraits, shown only to identify the player."],
  [/thesportsdb\.com/, "TheSportsDB", "Not freely licensed. Player pictures, shown only to identify the player."],
  [/transfermarkt\.com/, "Transfermarkt", "Club crests are trademarks of the clubs, shown only to identify them."],
];
function pictureCounts() {
  const n = new Map(), add = (name) => n.set(name, (n.get(name) || 0) + 1);
  Object.values(window.PACKS || {}).forEach((p) => (p.items || []).forEach((x) => ["img", "logo", "flag", "cover"].forEach((k) => {
    if (!x[k]) return; const c = (x.cr && x.cr[k]) || null, where = c ? c.page || "" : k === "cover" ? "https://music.apple.com" : "";
    const s = SOURCES.find(([re]) => re.test(where)); add(s ? s[1] : "Other");
  })));
  return n;
}
function renderCredits() {
  const n = pictureCounts();
  $("#credRoom").innerHTML = `<div class="hero"><h1>Pictures and <em>removal</em></h1><p class="sub">Where the pictures on this site come from, and how to have one taken down.</p></div>
    <div class="card"><div class="label">Sources</div><ul class="srclist">${SOURCES.filter(([, name]) => n.get(name)).map(([, name, text]) => `<li><b>${name}</b><span class="num">${n.get(name).toLocaleString()}</span><span class="fine">${text}</span></li>`).join("")}${n.get("Other") ? `<li><b>Other</b><span class="num">${n.get("Other")}</span><span class="fine">See the answer card.</span></li>` : ""}</ul>
      <p class="fine">Not every picture is free to reuse. Rights stay with their owners, and none of them endorses this site. It is an independent student project. Facts come from Wikidata (CC0), MusicBrainz, the K-pop fan wiki, Open Trivia DB, Lichess and ballknowledge's football and basketball data. Chess pieces are the cburnett set (CC BY-SA 3.0).</p></div>
    <div class="card"><div class="label">Have a picture removed</div><p>If you are in a picture, own it, or act for someone who does, ask and it will be taken down. You don't need to give a reason to ask about a picture of yourself.</p>
      <a class="btn" href="${removalLink("")}" target="_blank" rel="noopener">Request a removal</a><p class="fine">This opens a request on the project's GitHub page (a free GitHub account is needed). Requests there are public, so don't include private details.</p></div>`;
}
