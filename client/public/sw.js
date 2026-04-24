/* eslint-disable no-undef */
/* eslint-disable no-restricted-globals */
const CACHE_NAME = 'nexus-media-cache-v1';

// We only want to cache actual media assets (images, videos, pdfs)
const MEDIA_URL_PATTERN = /\.(mp4|webm|jpg|jpeg|png|gif|pdf|svg)$|(\/uploads\/)/;

self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
    const url = event.request.url;

    // Only intercept media files
    if (MEDIA_URL_PATTERN.test(url)) {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                if (cachedResponse) {
                    // Return from cache, but update in background (Stale-While-Revalidate)
                    fetch(event.request).then((networkResponse) => {
                        if (networkResponse.ok) {
                            caches.open(CACHE_NAME).then((cache) => {
                                cache.put(event.request, networkResponse);
                            });
                        }
                    });
                    return cachedResponse;
                }

                return fetch(event.request).then((networkResponse) => {
                    if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                        return networkResponse;
                    }

                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });

                    return networkResponse;
                });
            })
        );
    }
});
