const SHELL_CACHE = 'nihongo-shell-v1';
const RUNTIME_CACHE = 'nihongo-runtime-v1';
const APP_SHELL = ['/', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== SHELL_CACHE && key !== RUNTIME_CACHE)
          .map((key) => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API/auth traffic or private learner state.
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/cdn-cgi/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put('/', copy));
          }
          return response;
        })
        .catch(async () =>
          (await caches.match('/')) ||
          new Response('Offline', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        )
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  const isStaticAsset =
    url.pathname.startsWith('/assets/') ||
    url.pathname === '/favicon.svg' ||
    url.pathname === '/manifest.webmanifest';

  if (!isStaticAsset) return;

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => cached);

      return cached || network;
    })
  );
});
