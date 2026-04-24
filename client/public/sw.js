/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'nexus-v3';
const MEDIA_CACHE = 'nexus-media-assets';

// Core assets for the app to load offline
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/sw.js',
    '/favicon.svg'
];

const MEDIA_URL_PATTERN = /\.(mp4|webm|jpg|jpeg|png|gif|pdf|svg)$|(\/uploads\/)/;
const MANIFEST_URL_PATTERN = /\/api\/screens\/manifest/;
const AUTH_URL_PATTERN = /\/api\/auth\//;

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== MEDIA_CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );
    clients.claim();
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // CRITICAL FIX: Only handle GET requests and bypass Auth API
    if (event.request.method !== 'GET' || AUTH_URL_PATTERN.test(url)) {
        return; // Let the browser handle these normally (No respondWith)
    }

    // 1. Handle Manifest API (Stale-While-Revalidate)
    if (MANIFEST_URL_PATTERN.test(url)) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    const fetchPromise = fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Offline or network error
                        return cachedResponse;
                    });
                    return cachedResponse || fetchPromise;
                });
            })
        );
        return;
    }

    // 2. Handle Media Assets (Cache-First)
    if (MEDIA_URL_PATTERN.test(url)) {
        event.respondWith(
            caches.open(MEDIA_CACHE).then((cache) => {
                return cache.match(event.request).then((cachedResponse) => {
                    if (cachedResponse) return cachedResponse;

                    return fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            cache.put(event.request, networkResponse.clone());
                        }
                        return networkResponse;
                    }).catch(() => {
                        // Return nothing if both fail for media
                    });
                });
            })
        );
        return;
    }

    // 3. App Shell (Static Assets)
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request).catch(() => {
                // If it's a page navigation, we could return index.html here
                if (event.request.mode === 'navigate') {
                    return caches.match('/index.html');
                }
            });
        })
    );
});
