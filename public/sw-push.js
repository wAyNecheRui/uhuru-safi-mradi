// Uhuru Safi Push Notification Service Worker
// Handles push notifications when the app is in background or closed

const CACHE_NAME = 'uhuru-safi-push-v1';

// Listen for push events
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let data = {
    title: 'Uhuru Safi',
    body: 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'default',
    data: {}
  };

  try {
    if (event.data) {
      const payload = event.data.json();
      data = {
        title: payload.title || data.title,
        body: payload.body || payload.message || data.body,
        icon: payload.icon || data.icon,
        badge: payload.badge || data.badge,
        tag: payload.tag || payload.category || data.tag,
        data: payload.data || payload
      };
    }
  } catch (e) {
    console.error('[SW] Error parsing push data:', e);
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    vibrate: [100, 50, 100],
    data: data.data,
    requireInteraction: data.data?.priority === 'high',
    actions: getActionsForType(data.data?.type || data.data?.category)
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data;
  let targetUrl = '/';

  // Determine target URL based on action or notification data
  if (action === 'view') {
    targetUrl = notificationData?.action_url || '/';
  } else if (action === 'dismiss') {
    return; // Just close the notification
  } else if (notificationData?.action_url) {
    targetUrl = notificationData.action_url;
  } else {
    // Default routes based on notification type
    switch (notificationData?.category) {
      case 'project':
        targetUrl = '/citizen/projects';
        break;
      case 'bid':
        targetUrl = '/contractor/bid-tracking';
        break;
      case 'payment':
        targetUrl = '/contractor/financials';
        break;
      case 'verification':
        targetUrl = '/contractor/verification';
        break;
      case 'report':
        targetUrl = '/citizen/track-reports';
        break;
      case 'milestone':
        targetUrl = '/citizen/projects';
        break;
      default:
        targetUrl = '/';
    }
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // If a window is already open, focus it and navigate
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({
              type: 'NOTIFICATION_CLICKED',
              url: targetUrl,
              data: notificationData
            });
            return;
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event);
  // Could track dismissed notifications here
});

// Get contextual actions based on notification type
function getActionsForType(type) {
  switch (type) {
    case 'project':
    case 'milestone':
      return [
        { action: 'view', title: 'View Project', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'bid':
      return [
        { action: 'view', title: 'View Bids', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'payment':
      return [
        { action: 'view', title: 'View Payment', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    case 'report':
      return [
        { action: 'view', title: 'View Report', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
    default:
      return [
        { action: 'view', title: 'View', icon: '/icons/icon-72x72.png' },
        { action: 'dismiss', title: 'Dismiss' }
      ];
  }
}

// Listen for messages from main app
self.addEventListener('message', (event) => {
  console.log('[SW] Message received:', event.data);
  
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating push service worker');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
});
