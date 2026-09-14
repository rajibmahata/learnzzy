/* Learnzzy service worker — app-shell cache, offline-friendly, no false completions. */
const CACHE = "learnzzy-shell-v2";
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

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  // Never cache admin/API writes; pass through.
  if (url.pathname.startsWith("/api/")) return;
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            const copy = res.clone();
            // Cache only same-origin static + pages.
            if (url.origin === self.location.origin && res.status === 200) {
              caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
            }
            return res;
          })
          .catch(() => caches.match("/play"))
    )
  );
});
