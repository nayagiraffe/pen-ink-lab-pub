/* Pen & Ink Lab 서비스 워커: 앱 파일을 기기에 보관해 인터넷 없이도 열리게 한다.
   사용자 데이터(만년필·잉크 기록)는 이 파일이 아니라 브라우저의 localStorage 에 있으며, 여기서는 건드리지 않는다. */
const CACHE = 'pil-v0.1.0-1d4ac796';
const ASSETS = ["./","./index.html","./manifest.webmanifest","./icons/icon-180.png","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png"];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  // 옛 버전의 캐시를 지운다 (pil- 로 시작하는 우리 캐시만)
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pil-') && k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;   // 다른 사이트 요청은 건드리지 않는다
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit =>
      hit || fetch(req).then(res => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        return res;
      }).catch(() => (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))
    )
  );
});
