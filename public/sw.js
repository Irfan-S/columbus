const CACHE_NAME = "columbus-v2";
const STATIC_ASSETS = ["/", "/search", "/auth/login", "/auth/register"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and API routes
  if (request.method !== "GET" || url.pathname.startsWith("/api/")) return;

  // Skip cross-origin requests entirely (Mapbox tiles/styles/events, analytics, etc.)
  if (url.origin !== self.location.origin) return;

  // Network-first for HTML pages
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for same-origin static assets with content-hashed paths
  // (Next.js emits these under /_next/static/). Skip other paths to avoid
  // caching dev bundles that share a stable URL across builds.
  if (!url.pathname.startsWith("/_next/static/")) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.pathname.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
