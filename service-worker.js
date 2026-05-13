importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
const CACHE_NAME = "basic-greek-trainer-v1.5.3";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=76",
  "./vocab.js?v=76",
  "./app.js?v=76",
  "./firebase-lb.js?v=76",
  "./manifest.json",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const file of FILES_TO_CACHE) {
        try {
          await cache.add(file);
          console.log("Cached:", file);
        } catch (error) {
          console.warn("Skipped cache file:", file, error);
        }
      }
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  // Let OneSignal handle its own requests
  if (
    event.request.url.includes("onesignal") ||
    event.request.url.includes("os.tc") ||
    event.request.url.includes("cdn.onesignal.com")
  ) {
    return;
  }

  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const shouldCache =
          response &&
          response.status === 200 &&
          response.type === "basic" &&
          !event.request.url.endsWith(".mp4");

        if (shouldCache) {
          const responseClone = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }

        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
