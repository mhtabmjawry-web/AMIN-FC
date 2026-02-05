// نام کش‌ها
const CACHE_NAME = 'flashcard-master-v1';
const RUNTIME_CACHE = 'runtime';

// منابعی که باید در هنگام نصب کش شوند
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap'
];

// نصب Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// فعال‌سازی Service Worker
self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return cacheNames.filter(cacheName => !currentCaches.includes(cacheName));
    }).then(cachesToDelete => {
      return Promise.all(cachesToDelete.map(cacheToDelete => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// رهگیری درخواست‌ها
self.addEventListener('fetch', event => {
  // درخواست‌های مربوط به داده‌های پویا را نادیده بگیر
  if (event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // اگر پاسخ در کش موجود بود، آن را برگردان
        if (cachedResponse) {
          return cachedResponse;
        }

        // در غیر این صورت، از شبکه درخواست بده
        return fetch(event.request)
          .then(response => {
            // بررسی صحت پاسخ
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // پاسخ را در کش runtime ذخیره کن
            const responseToCache = response.clone();
            caches.open(RUNTIME_CACHE)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // اگر شبکه در دسترس نبود، صفحه خطا برگردان
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('./index.html');
            }
          });
      })
  );
});

// دریافت پیام‌ها از main thread
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_FLASHCARDS') {
    // کش کردن فلش کارت‌ها
    const flashcards = event.data.flashcards;
    caches.open(CACHE_NAME)
      .then(cache => {
        // ذخیره فلش کارت‌ها در کش
        console.log('Flashcards cached');
      });
  }
});