/* FORGE service worker — a konditeremben gyakran nincs térerő.
   A váz előre a cache-be kerül, a betűk futás közben.
   A naplód amúgy is localStorage-ban van, így offline semmi nem áll meg.

   A VERSION-t kézzel kell emelni, ha a váz fájljai változnak:
   új érték = új cache, a régi az aktiválásnál törlődik. */

const VERSION = 'forge-v2';
const SHELL = `${VERSION}-shell`;
const RUNTIME = `${VERSION}-runtime`;

const SHELL_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/app.css',
  './assets/app.js',
  './assets/data.js',
  './assets/icon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* saját fájl: előbb a cache, utána a hálózat — és amit a hálózat ad, elmentjük */
async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {});
  return res;
}

/* betűk: a cache-ből azonnal, a háttérben frissül */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const hit = await cache.match(request);
  const update = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return hit || update.then((res) => res || Response.error());
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // oldalbetöltés: offline is a mentett vázat adjuk
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(SHELL);
        return (await cache.match('./index.html')) || (await cache.match('./')) || Response.error();
      })
    );
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirst(request, SHELL).catch(() => Response.error()));
    return;
  }

  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
