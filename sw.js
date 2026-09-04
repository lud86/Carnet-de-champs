const CACHE_NAME = 'carnet-de-champs-v1';
const APP_SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Ne met en cache que l'appli elle-même (App Shell), jamais les appels à
// l'API GitHub ni les tuiles de carte : ces requêtes doivent toujours
// aller chercher les données fraîches sur le réseau.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // laisse passer GitHub/OSM/Leaflet
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
