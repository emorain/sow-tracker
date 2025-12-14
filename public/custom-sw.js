// Custom Service Worker for Sow Tracker
// This file adds push notification handlers to the service worker
// Note: In production, next-pwa will generate sw.js automatically
// This file shows how the push handlers work

// Push Notification Handler
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);

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
      console.error('Error parsing push data:', error);
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
  console.log('Notification clicked:', event);

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
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }

      // If no window is open, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});

// Background Sync (for offline actions)
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);

  if (event.tag === 'sync-notifications') {
    // Sync notifications when back online
    event.waitUntil(syncNotifications());
  }
});

async function syncNotifications() {
  try {
    // This could fetch new notifications from the server
    // For now, just log
    console.log('Syncing notifications...');
  } catch (error) {
    console.error('Error syncing notifications:', error);
  }
}

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(clients.claim());
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
