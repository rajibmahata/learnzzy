/* Learnzzy service worker — network-first pages, cache-first hashed assets.
 * Pages must NEVER be served stale across deploys: cached HTML references
 * hashed JS chunks from its own build, so a stale page = missing chunks =
 * blank screen and games that never load. Navigations go to network first
 * (falling back to cache only when offline); immutable hashed assets stay
 * cache-first for speed. */
const CACHE = "learnzzy-shell-v3";
const SHELL = ["/", "/play", "/manifest.json", "/icons/icon.svg", "/assets/apple.svg", "/assets/bird.svg", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function putInCache(request, response) {
  if (response.status !== 200) return response;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return response;
  const copy = response.clone();
  caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Never intercept API traffic.
  if (url.pathname.startsWith("/api/")) return;

  // Navigations (pages): network first so deploys take effect immediately.
  // Cache fallback keeps offline play working.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => putInCache(request, res))
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/play")))
    );
    return;
  }

  // Static assets (/_next/static/*, icons, images): cache first.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => putInCache(request, res))
          .catch(() => caches.match("/play"))
    )
  );
});
