const CACHE = "dieleer-v2";
const CORE = ["./", "./index.html", "./data.json", "./manifest.json",
  "./icon-180.png", "./icon-192.png", "./icon-512.png", "./icon-512-maskable.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// Network-first: online always gets the latest publish; offline falls back to the cache.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  // Only manage the app's own files. Supabase (and the Supabase JS CDN script) are left to the
  // network untouched: the app's own code already treats a dropped connection there as normal
  // (ratings and off-menu extras "go quiet"), and caching a stale cross-origin response would mean
  // showing old ratings or off-menu drinks as if current, which the spec is explicit shouldn't happen.
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
