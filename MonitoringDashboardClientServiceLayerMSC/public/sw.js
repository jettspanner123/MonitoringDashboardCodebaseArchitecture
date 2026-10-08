// Push-only service worker - just displays the OS-level notification the
// backend sends when a run comes back Degraded/Failed. `requireInteraction`
// keeps it on screen until the person actually dismisses it, which is as
// close to "strong" as a closed-tab notification can get - a continuous
// custom alarm sound needs an open tab's own JS running, which is what
// RunFailureAlarmSharedComponent.tsx is for, not something a service worker
// can do on its own.
self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || 'ObservaCore Alert';
  const body = payload.body || 'A smoke test run needs attention.';

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/favicon.svg',
      requireInteraction: true,
      tag: 'observacore-run-alert',
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
