const C = 'ta-24';
self.addEventListener('install', e => { self.skipWaiting(); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  const html = r.mode === 'navigate' || (r.headers.get('accept') || '').includes('text/html');
  if (html) {  // pages : réseau d'abord, copie hors connexion
    e.respondWith(fetch(r).then(res => { const c = res.clone(); caches.open(C).then(x => x.put(r, c)); return res; }).catch(() => caches.match(r).then(m => m || caches.match('/index.html'))));
  } else {     // fichiers : cache d'abord
    e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => { if (res.ok) { const c = res.clone(); caches.open(C).then(x => x.put(r, c)); } return res; })));
  }
});
