export const firebaseConfig = {
  "apiKey": "AIzaSyBUtdh_YANN3S-sP5ACS52iTliHAXC0dtE",
  "authDomain": "voltio-aec23.firebaseapp.com",
  "projectId": "voltio-aec23",
  "storageBucket": "voltio-aec23.firebasestorage.app",
  "messagingSenderId": "881007290873",
  "appId": "1:881007290873:web:cbcc91d89cdfb7aeabf528"
};

/* Clave pública Web Push (VAPID) del proyecto.
   Firebase → Configuración del proyecto → Cloud Messaging → Web Push certificates.
   Mientras esté vacía, las notificaciones funcionan solo con la app abierta:
   el push con la app cerrada necesita esta clave y las Cloud Functions
   desplegadas (plan Blaze). Ver README → "Notificaciones con la app cerrada". */
export const vapidKey = "";
