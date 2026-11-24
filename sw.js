// Service worker.
// - Game code (html/js/css): network-first, so updates arrive as soon as you're online.
// - Pictures, sprites, fonts: cache-first (instant), refreshed quietly in the background.
//   They live in a separate cache that survives version bumps, so updates don't re-download all art.
// Bump VERSION when releasing an update.
const VERSION = 'aaa-v16';
const ASSETS = 'aaa-assets-3';   // v16: armed poses, refilled see-through sprites and new frame data: fetch the art fresh once
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== ASSETS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const isAsset = url => /\.(webp|png|jpg|jpeg|gif|mp3|woff2?|ttf)(\?|$)/.test(url) || url.includes('fonts.gstatic') || /\/frames\.json(\?|$)/.test(url);
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = req.url;
  const ours = url.startsWith(self.location.origin) || url.includes('fonts.g');
  if (!ours) return;
  if (isAsset(url)) {
    e.respondWith(caches.open(ASSETS).then(async c => {
      const hit = await c.match(req);
      const fresh = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      if (hit) { e.waitUntil(fresh); return hit; }   // instant from cache, update in background
      return fresh;
    }));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => caches.match(req)));
});
