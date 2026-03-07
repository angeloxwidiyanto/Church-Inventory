self.addEventListener('install', (e) => {
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    self.registration.unregister()
        .then(() => self.clients.matchAll())
        .then((clients) => {
            clients.forEach((client) => {
                if (client.url && "navigate" in client) {
                    client.navigate(client.url);
                }
            });
        });
});

self.addEventListener('fetch', (e) => {
    // A simple pass-through fetch handler is enough to satisfy the PWA install requirement
    e.respondWith(fetch(e.request));
});
