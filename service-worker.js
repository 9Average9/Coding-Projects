importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyDVWKRCtjg7ppR-D8ZNs-TfSwPlWdXXQ5Q",
  authDomain: "greek-vocab-leaderboard.firebaseapp.com",
  projectId: "greek-vocab-leaderboard",
  storageBucket: "greek-vocab-leaderboard.firebasestorage.app",
  messagingSenderId: "473409624300",
  appId: "1:473409624300:web:8288c792af4f3c32586dc9"
});

const messaging = firebase.messaging();

// No manual showNotification — Firebase auto-displays from the notification
// field in the payload. Calling showNotification here caused iOS to show
// two notifications (APNs auto-display + our manual call).
messaging.onBackgroundMessage(function () {});

const CACHE_NAME = "basic-greek-trainer-v3.0.43";

const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./style.css?v=3.0.43",
  "./vocab.js?v=3.0.8",
  "./app.js?v=3.0.43",
  "./rhema-critical.js?v=3.0.23",
  "./rhema-msb.js?v=3.0.43",
  "./rhema-bsb.js?v=3.0.43",
  "./rhema-crossrefs-ui.js?v=3.0.29",
  "./greek-verbs.js?v=3.0.23",
  "./firebase-lb.js?v=3.0.43",
  "./assets/home-backgrounds/abstract.jpg",
  "./assets/home-backgrounds/ancient-scroll.jpg",
  "./assets/home-backgrounds/city.jpg",
  "./assets/home-backgrounds/clouds.jpg",
  "./assets/home-backgrounds/desert.jpg",
  "./assets/home-backgrounds/forest.jpg",
  "./assets/home-backgrounds/garden.jpg",
  "./assets/home-backgrounds/greek-columns.jpg",
  "./assets/home-backgrounds/leaves.jpg",
  "./assets/home-backgrounds/mountains.jpg",
  "./assets/home-backgrounds/night-sky.jpg",
  "./assets/home-backgrounds/ocean.jpg",
  "./assets/home-backgrounds/sunrise.jpg",
  "./assets/home-backgrounds/waves.jpg",
  "./assets/home-backgrounds/abstract-thumb.jpg",
  "./assets/home-backgrounds/ancient-scroll-thumb.jpg",
  "./assets/home-backgrounds/city-thumb.jpg",
  "./assets/home-backgrounds/clouds-thumb.jpg",
  "./assets/home-backgrounds/desert-thumb.jpg",
  "./assets/home-backgrounds/forest-thumb.jpg",
  "./assets/home-backgrounds/garden-thumb.jpg",
  "./assets/home-backgrounds/greek-columns-thumb.jpg",
  "./assets/home-backgrounds/leaves-thumb.jpg",
  "./assets/home-backgrounds/mountains-thumb.jpg",
  "./assets/home-backgrounds/night-sky-thumb.jpg",
  "./assets/home-backgrounds/ocean-thumb.jpg",
  "./assets/home-backgrounds/sunrise-thumb.jpg",
  "./assets/home-backgrounds/waves-thumb.jpg",
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
    })
      .then(() => self.clients.claim())
      .then(() => self.clients.matchAll({ type: "window", includeUncontrolled: true }))
      .then((clients) => {
        clients.forEach((client) => client.navigate(client.url));
      })
  );
});

self.addEventListener("fetch", (event) => {
  // Let Firebase and external CDN requests pass through
  if (
    event.request.url.includes("firebaseapp.com") ||
    event.request.url.includes("googleapis.com") ||
    event.request.url.includes("gstatic.com") ||
    event.request.url.includes("fcmregistrations.googleapis.com")
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
