/* =====================
   CACHE CONFIG
===================== */
const VERSION = 'v2';

const APP_CACHE = `auto-parts-app-${VERSION}`;
const IMAGE_CACHE = `auto-parts-images-${VERSION}`;
const API_CACHE = `auto-parts-api-${VERSION}`;

const DEBUG = true;

/* =====================
   INSTALL
===================== */
self.addEventListener('install', (event) => {
  if (DEBUG) console.log('[SW] 📦 Install');
  self.skipWaiting();
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) =>
      cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ])
    )
  );
});

/* =====================
   ACTIVATE
===================== */
self.addEventListener('activate', (event) => {
  if (DEBUG) console.log('[SW] 🚀 Activate');
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) =>
            ![APP_CACHE, IMAGE_CACHE, API_CACHE].includes(key)
          )
          .map((key) => {
            if (DEBUG) console.log('[SW] 🧹 Delete old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

/* =====================
   FETCH
===================== */
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* =====================
     🖼️ IMAGES – CACHE FIRST
  ===================== */
  if (
    request.destination === 'image' ||
    url.pathname.startsWith('/images/')
  ) {
    event.respondWith(
      caches.open(IMAGE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);

        if (cached) {
          if (DEBUG) console.log('[SW] 🖼️ Cache hit:', request.url);
          return cached;
        }

        try {
          if (DEBUG) console.log('[SW] 🌐 Fetch image:', request.url);
          const response = await fetch(request);

          if (response.ok) {
            // CLONE IMMEDIATELY before returning or awaiting anything else
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          }

          throw new Error('Image fetch failed');
        } catch (err) {
          if (DEBUG) console.warn('[SW] ⚠️ Image offline fallback', err);

          // Fallback SVG offline
          return new Response(
            `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300">
              <rect width="300" height="300" fill="#f1f3f5"/>
              <text x="150" y="150" text-anchor="middle"
                font-size="14" fill="#868e96">
                Image indisponible
              </text>
            </svg>`,
            {
              headers: {
                'Content-Type': 'image/svg+xml',
                'Cache-Control': 'no-store'
              }
            }
          );
        }
      })
    );
    return;
  }

  /* =====================
     🔌 API – NETWORK FIRST
  ===================== */
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          
          if (response.ok) {
            // CRITICAL FIX: Clone immediately before any async operation
            const responseToCache = response.clone();
            
            caches.open(API_CACHE).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          
          return response;
        } catch (error) {
          if (DEBUG) console.log('[SW] 📦 API fallback cache');
          return caches.match(request);
        }
      })()
    );
    return;
  }

  /* =====================
     🧱 APP SHELL – CACHE FIRST
  ===================== */
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request);
    })
  );
});