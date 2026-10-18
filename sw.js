const CACHE_NAME = 'carnet-de-champs-v2026-10-18-1';
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

// La page elle-même (index.html / carnet-de-champs.html) doit TOUJOURS être
// vérifiée sur le réseau d'abord, sinon une mise à jour de l'appli reste
// invisible tant que ce fichier sw.js lui-même n'a pas changé : le
// navigateur continuerait sinon à servir indéfiniment la version mise en
// cache lors de la première installation, même après avoir remplacé le
// fichier sur le disque ou sur GitHub.
// Le manifest/les icônes (statiques, ne changent presque jamais) restent en
// cache-first. Les appels à l'API GitHub ou aux tuiles de carte ne sont
// jamais mis en cache (gérés par le early-return ci-dessous).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // laisse passer GitHub/OSM/Leaflet

  const isAppDoc = event.request.mode === 'navigate'
    || url.pathname.endsWith('.html')
    || url.pathname.endsWith('/');

  if (isAppDoc) {
    event.respondWith(
      fetch(event.request).then((resp) => {
        const copy = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return resp;
      }).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
