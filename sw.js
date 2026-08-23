// Shell-only cache. The console is worthless without the network — it exists to
// talk to PocketBase — so nothing about devices or playback is ever cached;
// only enough to make the installed app open instantly and not show a browser
// error page when offline.
const CACHE = 'soundstitch-console-v40';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Never touch the API or the event stream: a cached device list would be a
  // lie, and a cached SSE response would break realtime outright.
  if (url.pathname.startsWith('/api/') || e.request.headers.get('accept') === 'text/event-stream') return;
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request, { ignoreSearch: true })));
});
