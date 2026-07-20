/* CIK Clock service worker
   Caches the app shell so it works offline after the first load.
   Bump CACHE_VERSION when you change files and want clients to re-fetch. */

const CACHE_VERSION = "cik-clock-v1";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png",
  "./icon-180.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // never intercept POSTs (sync goes through)
  const url = new URL(req.url);
  // Only handle same-origin requests. Let Google Apps Script and other cross-origin go through untouched.
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        // Cache successful responses for app shell files
        const copy = res.clone();
        caches.open(CACHE_VERSION).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      }).catch(() => {
        // If offline and the request is a navigation, fall back to index.html
        if (req.mode === "navigate") return caches.match("./index.html");
        throw new Error("offline and not cached");
      });
    })
  );
});
