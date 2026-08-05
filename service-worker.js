"use strict";

const CACHE_NAME = "pocket-budget-v11-custom-sheet";
const LOCAL_ASSETS = [
  "./",
  "index.html",
  "styles.css?v=11",
  "cycle.js?v=11",
  "db.js?v=11",
  "app.js?v=11",
  "calculations.py?v=11",
  "manifest.webmanifest?v=11",
  "icons/icon-192.png?v=11",
  "icons/icon-512.png?v=11",
  "icons/icon-1024.png?v=11",
  "icons/apple-touch-icon.png?v=11",
  "icons/favicon.svg?v=11",
  "icons/app-icon.svg?v=11"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(LOCAL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

async function networkFirst(request, navigationFallback = false) {
  try {
    const response = await fetch(request, { cache: "no-store" });
    if (response && response.status === 200 && response.type === "basic") {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (navigationFallback) {
      const fallback = await caches.match("index.html");
      if (fallback) return fallback;
    }
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(networkFirst(event.request, event.request.mode === "navigate"));
});
