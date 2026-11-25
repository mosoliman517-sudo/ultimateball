/* ultimateball service worker: the page itself is fetched fresh when online (so updates show at once) and kept for offline;
   pictures, the chess engine and libraries are cached as they are used. Song previews and accounts always go to the network. */
const V = "ub-v3";
self.addEventListener("install", (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(["./", "./index.html"]).then(() => c.match("./index.html")).then((r) => r && r.text()).then((t) => { const d = t && /data\.[0-9a-f]+\.js/.exec(t); return d && c.add(d[0]); }).catch(() => {}))); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url); if (r.method !== "GET") return;
  if (/supabase\.co|itunes|apple\.com|mzstatic|wikimedia\.org\/api|\/voice\//.test(u.host + u.pathname)) return;
  if (r.mode === "navigate") { e.respondWith(fetch(r).then((res) => { const c = res.clone(); caches.open(V).then((k) => k.put("./index.html", c)); return res; }).catch(() => caches.match("./index.html"))); return; }
  if (u.origin === location.origin || /cdnjs|jsdelivr|fonts\.g/.test(u.host)) e.respondWith(caches.match(r).then((hit) => hit || fetch(r).then((res) => { if (res.ok && res.status === 200) { const c = res.clone(); caches.open(V).then((k) => k.put(r, c).then(() => { if (/\/data\.[0-9a-f]+\.js$/.test(u.pathname)) k.keys().then((all) => all.forEach((q) => { const p = new URL(q.url).pathname; if (/\/data\.[0-9a-f]+\.js$/.test(p) && p !== u.pathname) k.delete(q); })); })); } return res; })));
});
