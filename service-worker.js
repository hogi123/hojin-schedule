const CACHE_NAME = 'schedule-app-v5'; // 버전을 올려서 브라우저가 새 버전을 인식하게 합니다.
const urlsToCache = [
  './index.html',
  './manifest.json',
  './service-worker.js'
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
  // GET 요청이 아니면 캐시 로직을 타지 않고 즉시 네트워크로 보냄
  if (event.request.method !== 'GET') {
    return event.respondWith(fetch(event.request));
  }

  // Network First, Falling back to Cache
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
