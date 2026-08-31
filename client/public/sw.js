/**
 * Web Push service worker.
 *
 * Deliberately minimal: it exists so the browser has somewhere to deliver a
 * push while the tab is closed, and it is served from `public/` (i.e. at the
 * site root) because a worker's scope cannot be broader than its own path.
 *
 * Not bundled by Metro — this file ships verbatim, so it must stay plain
 * JavaScript with no imports.
 */

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Auto Cal', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Auto Cal';
  const options = {
    body: data.body || '',
    // Tagging by the item key means a re-sent notification for the same slot
    // replaces the old one instead of stacking.
    tag: data.tag || 'auto-cal',
    renotify: false,
    data: { url: data.url || '/today' },
    icon: '/favicon.png',
    badge: '/favicon.png',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';

  // Focus an existing tab if one is open rather than opening a second copy of
  // the app; only fall back to `openWindow` when nothing is running.
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            if ('navigate' in client) client.navigate(target);
            return client.focus();
          }
        }
        if (self.clients.openWindow) return self.clients.openWindow(target);
        return undefined;
      }),
  );
});

// A newly-installed worker takes over immediately, so a user who just granted
// permission does not have to close every tab before pushes start arriving.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
