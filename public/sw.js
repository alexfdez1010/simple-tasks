const CACHE_NAME = 'simple-tasks-public-v1';
const OFFLINE_URL = '/offline.html';
const PUBLIC_ASSETS = [
  OFFLINE_URL,
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
];

/** Precaches only the public offline document and original-brand icons, without sending session cookies. */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(
        PUBLIC_ASSETS.map(
          (url) =>
            new Request(new URL(url, self.location.origin), {
              cache: 'reload',
              credentials: 'omit',
            }),
        ),
      ),
    ),
  );
});

/** Removes this app's obsolete public caches; updates wait for existing windows to close naturally. */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys
          .filter(
            (key) =>
              key.startsWith('simple-tasks-public-') && key !== CACHE_NAME,
          )
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    }),
  );
});

/** Uses the network for private pages and never stores responses; only failed document navigation gets the static fallback. */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (PUBLIC_ASSETS.includes(url.pathname) && !url.search) {
    event.respondWith(
      caches
        .open(CACHE_NAME)
        .then(
          async (cache) => (await cache.match(url.pathname)) ?? fetch(request),
        ),
    );
    return;
  }
  if (
    request.mode !== 'navigate' ||
    url.pathname.startsWith('/api/') ||
    request.headers.has('RSC')
  )
    return;
  event.respondWith(
    fetch(request, { cache: 'no-store' }).catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (
        (await cache.match(OFFLINE_URL)) ??
        new Response('Offline', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        })
      );
    }),
  );
});
