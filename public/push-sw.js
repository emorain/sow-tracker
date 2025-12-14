// Push Notification Handlers for Sow Tracker Service Worker
// This file is imported by sw.js to handle push notifications

console.log('[Push SW] Push notification handlers loaded');

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('[Push SW] Push event received:', event);

  let notificationData = {
    title: 'Sow Tracker',
    body: 'You have a new notification',
    icon: '/icon-192x192.png',
    badge: '/icon-96x96.png',
    data: {},
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || notificationData.title,
        body: data.body || data.message || notificationData.body,
        icon: data.icon || notificationData.icon,
        badge: data.badge || notificationData.badge,
        tag: data.tag,
        data: {
          url: data.url,
          notificationId: data.notificationId,
          type: data.type,
        },
      };
    } catch (error) {
      console.error('[Push SW] Error parsing push data:', error);
    }
  }

  const promiseChain = self.registration.showNotification(
    notificationData.title,
    {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      actions: [
        {
          action: 'view',
          title: 'View',
        },
        {
          action: 'close',
          title: 'Dismiss',
        },
      ],
    }
  );

  event.waitUntil(promiseChain);
});

// Notification Click Handler
self.addEventListener('notificationclick', (event) => {
  console.log('[Push SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    // User dismissed the notification
    return;
  }

  // Determine URL to open
  let urlToOpen = '/';

  if (event.notification.data && event.notification.data.url) {
    urlToOpen = event.notification.data.url;
  } else if (event.notification.data && event.notification.data.type) {
    // Map notification types to URLs
    const typeUrls = {
      farrowing: '/sows',
      breeding: '/sows',
      weaning: '/sows',
      health: '/health',
      task: '/tasks',
      feed: '/feed',
      mortality: '/sows',
    };
    urlToOpen = typeUrls[event.notification.data.type] || '/';
  }

  // Open or focus the app
  const promiseChain = clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      // Check if there's already a window open
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen.split('?')[0]) && 'focus' in client) {
          return client.focus();
        }
      }

      // If no matching window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

console.log('[Push SW] Push notification handlers registered');
