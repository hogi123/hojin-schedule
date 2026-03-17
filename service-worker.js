const CACHE_NAME = 'schedule-app-v4'; // 버전을 올려서 브라우저가 새 버전을 인식하게 합니다.
const urlsToCache = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', event => {
  // [핵심 수정 부분] GET 요청이 아니면 캐시 로직을 타지 않고 즉시 네트워크로 보냄
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }

  // GET 요청인 경우에만 기존 Network First 전략 유지
  event.respondWith(
    fetch(event.request).then(response => {
      // 유효한 응답이 아니면 캐시하지 않음
      if (!response || response.status !== 200 || response.type !== 'basic') {
        return response;
      }
      return caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch(() => {
      return caches.match(event.request);
    })
  );
});
