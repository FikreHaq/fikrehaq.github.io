const APP_VERSION = '1.0.1';
const CACHE_NAME = `fikrehaq-cache-v${APP_VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// 1. Install: نئے ورژن کی بنیادی فائلیں کیش کریں
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
  self.skipWaiting();
});

// 2. Activate: پرانے تمام ورژنز کی کیش حذف کریں
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name.startsWith('fikrehaq-cache-') && name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// 3. Fetch: نیٹ ورک سے تازہ مواد لیں، ناکامی پر کیش سے دکھائیں
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});

// 4. Push Notifications: پش نوٹیفیکیشن وصول اور ظاہر کرنا
self.addEventListener('push', (event) => {
  let payload = {
    title: 'فکرِ حق',
    body: 'نئی اپڈیٹ شائع کر دی گئی ہے۔',
    url: './',
    icon: './icon-192.png'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch (e) {
      payload.body = event.data.text() || payload.body;
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.icon,
      dir: 'rtl',
      lang: 'ur',
      data: { url: payload.url }
    })
  );
});

// 5. Notification Click: نوٹیفیکیشن پر کلک سے متعلقہ صفحہ کھولنا
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || './';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          return client.navigate(targetUrl);
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
