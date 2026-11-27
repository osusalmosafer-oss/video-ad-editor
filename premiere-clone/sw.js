/* مونتاج أبو صهيب — service worker: يخزّن واجهة التطبيق ليعمل بلا إنترنت (ما عدا النماذج والخطوط الخارجية). */
const CACHE = 'abu-suhaib-v1';
const SHELL = ['./', 'index.html', 'style.css', 'engine.js', 'ui.js', 'ai.js', 'remix.js', 'publish.js', 'brand.js', 'baseline-core.js', 'baseline-data.js', 'advisor.js', 'pro.js', 'pwa.js',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-48.png', 'assets/asas/bug.png', 'assets/asas/wa.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;     // الخطوط والنماذج الخارجية تمرّ مباشرة
  e.respondWith(caches.match(e.request).then(hit => {
    const net = fetch(e.request).then(r => { if (r && r.ok) { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); } return r; }).catch(() => hit);
    return hit || net;                         // الكاش أولاً مع تحديث في الخلفية
  }));
});
