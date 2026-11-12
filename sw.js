/* Service worker: fresh when online, cached copy when offline. Bump VERSION when files are added or renamed. */
const VERSION = "v1";
const CACHE = "ran-trainer-" + VERSION;
const CORE = ["./", "index.html", "css/app.css", "js/app.js", "js/data-journey.js", "js/data-cases.js", "js/data-cards.js", "js/data-library.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith("ran-trainer-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, {ignoreSearch: true}).then(hit => hit || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
