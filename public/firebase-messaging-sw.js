/* =========================================================
   VOLTIO — Service worker de notificaciones (FCM)
   Recibe los avisos cuando la app está cerrada o en segundo plano.
   Va aparte de /sw.js (el del modo sin conexión) porque Firebase exige
   este nombre de archivo en la raíz.
   ========================================================= */
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyBUtdh_YANN3S-sP5ACS52iTliHAXC0dtE',
  authDomain: 'voltio-aec23.firebaseapp.com',
  projectId: 'voltio-aec23',
  storageBucket: 'voltio-aec23.firebasestorage.app',
  messagingSenderId: '881007290873',
  appId: '1:881007290873:web:cbcc91d89cdfb7aeabf528'
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const n = payload.notification || {};
  self.registration.showNotification(n.title || d.title || 'Voltio MontReal', {
    body: n.body || d.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: d.tag || 'voltio',
    data: { url: d.url || '/' },
    vibrate: [30, 20, 30]
  });
});

// Al tocar el aviso: si Voltio ya está abierta, la traemos al frente.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.indexOf(self.location.origin) === 0 && 'focus' in c) return c.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
