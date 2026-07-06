// ============================================================
// GRAVE GENT service worker
// 策略：HTML(導航) network-first、其餘同源 GET cache-first
// cache 名帶部署版號（build 時蓋章），activate 整組清舊版
// ============================================================
const VERSION = '__GG_BUILD__';
const CACHE = `gg-${VERSION}`;

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys.filter((k) => k.startsWith('gg-') && k !== CACHE).map((k) => caches.delete(k))
    );
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const c = await caches.open(CACHE);
        c.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || Response.error();
      }
    })());
    return;
  }

  e.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    const fresh = await fetch(req);
    if (fresh.ok) {
      const c = await caches.open(CACHE);
      c.put(req, fresh.clone());
    }
    return fresh;
  })());
});
