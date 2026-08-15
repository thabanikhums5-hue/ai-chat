/* ============================================================
   AI Chat - Service Worker
   Caches the app shell so the interface (not the AI responses,
   which always need the network) loads instantly and works
   offline / installable.
   ============================================================ */

const CACHE_NAME = "ai-chat-shell-v1";

const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png"
];

self.addEventListener("install", (event) => {

  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );

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

  const url = new URL(event.request.url);

  // Only manage same-origin app-shell requests. Everything else
  // (Puter.js, CDN scripts, AI API calls) goes straight to the
  // network so responses are always fresh.
  if (url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {

      const network = fetch(event.request)
        .then((response) => {

          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }

          return response;

        })
        .catch(() => cached);

      return cached || network;

    })
  );

});
