// Kill-switch service worker.
// The previous version of this site registered a caching service worker.
// After the rebuild that worker became stale and forced a reload loop.
// This replacement installs, removes itself and all caches, then reloads
// each window exactly once so no service worker remains.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch (e) {
        // ignore
      }
      try {
        await self.registration.unregister();
      } catch (e) {
        // ignore
      }
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((client) => client.navigate(client.url));
    })()
  );
});
