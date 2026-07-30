/* =========================================================
   VOLTIO — Backend (Firebase Auth + Firestore, tiempo real)
   Módulo ES: expone window.VB y dispara 'vb-ready'.
   ========================================================= */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile,
  sendEmailVerification, signOut, onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc, setDoc, getDoc, getDocs, addDoc, updateDoc, deleteDoc, onSnapshot,
  query, where, orderBy, limit, serverTimestamp, runTransaction, increment, writeBatch
} from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { firebaseConfig, vapidKey } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
// La base de datos del proyecto se llama "default" (no el clásico "(default)")
const DB_ID = 'default';
let db;
try {
  db = initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) }, DB_ID);
} catch (e) {
  db = initializeFirestore(app, {}, DB_ID);
}

// displayName: el nombre que el residente eligió en Ajustes. Manda sobre el del
// correo o el de Google en todo lo que ve el resto del conjunto.
const state = { user: null, profileSaved: false, displayName: null };

/* ---------- Auth ---------- */
function mapAuthError(e) {
  const c = (e && e.code) || '';
  const M = {
    'auth/operation-not-allowed': 'Este método de ingreso aún no está habilitado en el servidor.',
    'auth/configuration-not-found': 'La autenticación aún no está configurada en el servidor.',
    'auth/email-already-in-use': 'Ese correo ya tiene una cuenta. Prueba "Ya tengo cuenta".',
    'auth/invalid-email': 'El correo no es válido.',
    'auth/weak-password': 'La contraseña debe tener mínimo 6 caracteres.',
    'auth/invalid-credential': 'Correo o contraseña incorrectos.',
    'auth/wrong-password': 'Contraseña incorrecta.',
    'auth/user-not-found': 'No existe una cuenta con ese correo.',
    'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
    'auth/popup-closed-by-user': 'Cerraste la ventana de Google antes de terminar.',
    'auth/popup-blocked': 'El navegador bloqueó la ventana emergente.',
    'auth/unauthorized-domain': 'Este dominio no está autorizado para ingresar.'
  };
  return M[c] || ('No se pudo completar: ' + (e && e.message ? e.message.replace('Firebase: ', '') : c));
}

async function ensureProfile(u) {
  if (!u || state.profileSaved) return;
  try {
    // El nombre solo se siembra la primera vez: si el residente ya eligió el
    // suyo en Ajustes, volver a entrar no puede pisárselo.
    let nombre = null;
    try {
      const prev = await getDoc(doc(db, 'users', u.uid));
      if (prev.exists() && prev.data().name) { nombre = prev.data().name; state.displayName = nombre; }
    } catch (e) {}
    await setDoc(doc(db, 'users', u.uid), {
      name: nombre || u.displayName || (u.email ? u.email.split('@')[0] : 'Usuario'),
      email: u.email || '',
      photoURL: u.photoURL || '',
      providers: u.providerData.map((p) => p.providerId),
      emailVerified: !!u.emailVerified,
      updatedAt: serverTimestamp()
    }, { merge: true });
    state.profileSaved = true;
  } catch (e) { /* backend puede no estar listo aún */ }
}

const VB = {
  /* estado */
  user: () => state.user,
  uid: () => (state.user ? state.user.uid : null),
  userName: () => (state.user ? (state.displayName || state.user.displayName || (state.user.email || '').split('@')[0] || 'Usuario') : null),
  setDisplayName(n) { state.displayName = (n || '').trim() || null; },
  isGoogle: () => !!(state.user && state.user.providerData.some((p) => p.providerId === 'google.com')),

  onAuth(cb) {
    onAuthStateChanged(auth, (u) => {
      state.user = u;
      state.profileSaved = false;
      if (u) ensureProfile(u);
      cb(u);
    });
    getRedirectResult(auth).catch(() => {});
  },

  async loginGoogle() {
    const prov = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, prov);
    } catch (e) {
      if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/cancelled-popup-request')) {
        await signInWithRedirect(auth, prov);
        return;
      }
      throw new Error(mapAuthError(e));
    }
  },

  async signupEmail(name, email, pass) {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name) await updateProfile(cred.user, { displayName: name });
      try { await sendEmailVerification(cred.user); } catch (e) {}
      state.user = auth.currentUser;
    } catch (e) { throw new Error(mapAuthError(e)); }
  },

  async loginEmail(email, pass) {
    try { await signInWithEmailAndPassword(auth, email, pass); }
    catch (e) { throw new Error(mapAuthError(e)); }
  },

  async logout() { await signOut(auth); },

  /* ---------- Estaciones ---------- */
  watchStations(cb, onErr) {
    const q = query(collection(db, 'stations'), where('visible', '==', true));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => Object.assign({ id: d.id }, d.data())));
    }, (e) => { if (onErr) onErr(e); });
  },

  async publishStation(data, existingId) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const payload = Object.assign({}, data, {
      ownerUid: uid,
      ownerName: VB.userName(),
      ownerVerified: VB.isGoogle() || !!(state.user && state.user.emailVerified),
      updatedAt: serverTimestamp()
    });
    if (existingId) {
      await updateDoc(doc(db, 'stations', existingId), payload);
      return existingId;
    }
    payload.createdAt = serverTimestamp();
    payload.ratingSum = 0;
    payload.ratingCount = 0;
    const ref = await addDoc(collection(db, 'stations'), payload);
    return ref.id;
  },

  async myStation() {
    const uid = VB.uid();
    if (!uid) return null;
    const q = query(collection(db, 'stations'), where('ownerUid', '==', uid), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    const d = snap.docs[0];
    return Object.assign({ id: d.id }, d.data());
  },

  async setStationVisible(id, visible) {
    await updateDoc(doc(db, 'stations', id), { visible });
  },

  async updateStationFields(id, patch) {
    await updateDoc(doc(db, 'stations', id), Object.assign({}, patch, { updatedAt: serverTimestamp() }));
  },

  /* ---------- Franjas horarias: dos vecinos no pueden pedir la misma hora ----------
     Cada reserva aparta sus cuartos de hora como documentos con id fijo
     (puesto + fecha + hora). Como Firestore rechaza crear un id que ya existe y
     el lote es todo-o-nada, el choque lo impide el servidor: aunque dos vecinos
     toquen "Agendar" en el mismo segundo, solo uno se queda con la hora.

     El último medio cuarto no se aparta a propósito: así una reserva puede
     empezar cuando otra va terminando (hasta 15 minutos de relevo). */
  SLOT_MIN: 15,
  slotKeys(fecha, from, to) {
    const min = (h) => { const p = String(h || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); };
    const grid = (m) => Math.floor(m / 15) * 15;
    const ini = grid(min(from));
    const fin = Math.max(ini, grid(min(to)) - 30); // 30 = dos cuartos de relevo
    const out = [];
    for (let m = ini; m <= fin; m += 15) {
      out.push(String(Math.floor(m / 60)).padStart(2, '0') + String(m % 60).padStart(2, '0'));
    }
    return out;
  },
  slotId(stationId, fecha, hhmm) { return `${stationId}__${fecha}__${hhmm}`; },
  // Una sola clave por puesto y día: así la consulta necesita un índice simple.
  sfKey(stationId, fecha) { return `${stationId}__${fecha}`; },

  /* Aparta las horas. Si alguna está tomada, no se aparta ninguna. */
  async claimSlots(bk, bookingId) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const keys = VB.slotKeys(bk.fecha, bk.from, bk.to);
    const batch = writeBatch(db);
    keys.forEach((hhmm) => {
      batch.set(doc(db, 'slots', VB.slotId(bk.stationId, bk.fecha, hhmm)), {
        stationId: bk.stationId, fecha: bk.fecha, hhmm,
        sfKey: VB.sfKey(bk.stationId, bk.fecha),
        bookingId: bookingId || '', driverUid: uid, ownerUid: bk.ownerUid || '',
        at: serverTimestamp()
      });
    });
    await batch.commit();
    return keys;
  },
  /* Libera las horas de una reserva (cancelada, declinada o vencida). */
  async releaseSlots(bk) {
    if (!bk || !bk.stationId || !bk.fecha) return;
    const keys = VB.slotKeys(bk.fecha, bk.from, bk.to);
    const batch = writeBatch(db);
    keys.forEach((hhmm) => batch.delete(doc(db, 'slots', VB.slotId(bk.stationId, bk.fecha, hhmm))));
    try { await batch.commit(); } catch (e) { /* si ya no están, mejor */ }
  },
  /* Horas ya tomadas de un puesto en un día, para pintarlas en la ficha. */
  async busySlots(stationId, fecha) {
    try {
      const q = query(collection(db, 'slots'), where('sfKey', '==', VB.sfKey(stationId, fecha)));
      const snap = await getDocs(q);
      return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    } catch (e) { return []; }
  },
  /* Todas las horas apartadas del conjunto en una fecha, de un solo viaje.
     Los documentos de slots ya guardaban `fecha`, así que esto es una consulta
     de campo único —Firestore la indexa sola, sin índice compuesto— y las
     reglas ya permiten `list` a cualquiera que haya iniciado sesión. Con esto
     la búsqueda puede decir cuántos puestos quedan libres a cada hora, en vez
     de mirar solo el horario que el anfitrión declaró. */
  async busyDay(fecha) {
    if (!fecha) return [];
    try {
      const q = query(collection(db, 'slots'), where('fecha', '==', fecha));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data());
    } catch (e) { return []; }
  },

  /* ---------- Reservas ---------- */
  async createBooking(bk) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    bk.driverUid = uid;
    bk.driverName = VB.userName();
    bk.createdAt = serverTimestamp();
    bk.estado = bk.estado || 'pendiente'; // puestos comunes/visitantes nacen 'confirmada'
    const ref = await addDoc(collection(db, 'bookings'), bk);
    return ref.id;
  },

  watchMyBookings(cb, onErr) {
    const uid = VB.uid();
    if (!uid) return () => {};
    const q = query(collection(db, 'bookings'), where('driverUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => (b.createdAt && b.createdAt.seconds || 0) - (a.createdAt && a.createdAt.seconds || 0));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },

  watchRequests(cb, onErr) {
    const uid = VB.uid();
    if (!uid) return () => {};
    const q = query(collection(db, 'bookings'), where('ownerUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => (b.createdAt && b.createdAt.seconds || 0) - (a.createdAt && a.createdAt.seconds || 0));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },

  async updateBooking(id, patch) {
    await updateDoc(doc(db, 'bookings', id), patch);
  },

  // El anfitrión confirma que el pago llegó (cierra el ciclo).
  // metodo: 'breb' cuando lo confirma a mano, 'wompi' cuando lo verificó la pasarela.
  async markBookingPaid(id, pagado, metodo) {
    await updateDoc(doc(db, 'bookings', id), {
      pagado: !!pagado,
      pagadoAt: pagado ? serverTimestamp() : null,
      pagadoPor: pagado ? (VB.userName() || '') : '',
      pagoMetodo: pagado ? (metodo || 'breb') : ''
    });
  },

  /* ---------- Pagos en línea (Wompi) ----------
     La llave pública y el secreto de integridad viven aparte del documento del
     puesto, que es de lectura pública: aquí solo entran vecinos con sesión. */
  async savePayConfig(stationId, cfg) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    await setDoc(doc(db, 'stations', stationId, 'pay', 'wompi'), {
      pubKey: (cfg.pubKey || '').trim(),
      integrity: (cfg.integrity || '').trim(),
      ownerUid: uid,
      updatedAt: serverTimestamp()
    }, { merge: true });
  },
  async getPayConfig(stationId) {
    try {
      const s = await getDoc(doc(db, 'stations', stationId, 'pay', 'wompi'));
      return s.exists() ? s.data() : null;
    } catch (e) { return null; }
  },
  async clearPayConfig(stationId) {
    try { await deleteDoc(doc(db, 'stations', stationId, 'pay', 'wompi')); } catch (e) {}
  },

  /* ---------- Cargas medidas con la calculadora (historial real) ---------- */
  async saveChargeSession(data) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const payload = Object.assign({}, data, {
      ownerUid: uid,
      ownerName: VB.userName(),
      conjunto: data.conjunto || 'montreal',
      at: serverTimestamp()
    });
    const ref = await addDoc(collection(db, 'sessions'), payload);
    return ref.id;
  },
  async updateChargeSession(id, patch) {
    await updateDoc(doc(db, 'sessions', id), patch);
  },
  async deleteChargeSession(id) {
    await deleteDoc(doc(db, 'sessions', id));
  },
  watchMySessions(cb, onErr) {
    const uid = VB.uid();
    if (!uid) return () => {};
    const q = query(collection(db, 'sessions'), where('ownerUid', '==', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || '')));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },
  watchAllSessions(cb, onErr) {
    return onSnapshot(query(collection(db, 'sessions')), (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => String(b.dateISO || '').localeCompare(String(a.dateISO || '')));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },

  /* ---------- Chat ---------- */
  async openChat(station) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const chatId = station.id + '_' + uid;
    const names = {};
    names[uid] = VB.userName();
    names[station.ownerUid] = station.ownerName || 'Anfitrión';
    await setDoc(doc(db, 'chats', chatId), {
      stationId: station.id,
      stationName: station.nombre,
      ownerUid: station.ownerUid,
      driverUid: uid,
      participantes: [station.ownerUid, uid],
      names,
      demo: !!station.demo,
      lastAt: serverTimestamp()
    }, { merge: true });
    return chatId;
  },

  watchChats(cb, onErr) {
    const uid = VB.uid();
    if (!uid) return () => {};
    const q = query(collection(db, 'chats'), where('participantes', 'array-contains', uid));
    return onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => (b.lastAt && b.lastAt.seconds || 0) - (a.lastAt && a.lastAt.seconds || 0));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },

  watchMessages(chatId, cb, onErr) {
    const q = query(collection(db, 'chats', chatId, 'messages'), orderBy('at', 'asc'), limit(300));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => Object.assign({ id: d.id }, d.data())));
    }, (e) => { if (onErr) onErr(e); });
  },

  async sendMessage(chatId, text) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      from: uid, fromName: VB.userName(), text, at: serverTimestamp()
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMsg: text.slice(0, 80), lastFrom: uid, lastAt: serverTimestamp()
    });
  },

  /* ---------- Calificaciones ---------- */
  async submitRating(r) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    r.fromUid = uid;
    r.fromName = VB.userName();
    r.at = serverTimestamp();
    await addDoc(collection(db, 'ratings'), r);
    if (r.stationId && r.tipo === 'driver-host') {
      try {
        await runTransaction(db, async (tx) => {
          const ref = doc(db, 'stations', r.stationId);
          tx.update(ref, { ratingSum: increment(r.stars), ratingCount: increment(1) });
        });
      } catch (e) {}
    }
    if (r.bookingId) {
      try {
        const patch = {};
        patch[r.tipo === 'driver-host' ? 'ratedByDriver' : 'ratedByOwner'] = true;
        await updateDoc(doc(db, 'bookings', r.bookingId), patch);
      } catch (e) {}
    }
  },

  async stationRatings(stationId) {
    try {
      const q = query(collection(db, 'ratings'), where('stationId', '==', stationId), limit(30));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => d.data()).filter((r) => r.tipo === 'driver-host');
      list.sort((a, b) => (b.at && b.at.seconds || 0) - (a.at && a.at.seconds || 0));
      return list.slice(0, 5);
    } catch (e) { return []; }
  },

  /* ---------- Perfil del residente ---------- */
  watchMyProfile(cb, onErr) {
    const uid = VB.uid();
    if (!uid) return () => {};
    return onSnapshot(doc(db, 'users', uid), (snap) => {
      cb(snap.exists() ? Object.assign({ uid: snap.id }, snap.data()) : null);
    }, (e) => { if (onErr) onErr(e); });
  },
  async saveProfile(patch) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    // Nunca enviamos 'role' desde aquí (lo controla el admin / las reglas).
    const clean = Object.assign({}, patch); delete clean.role;
    await setDoc(doc(db, 'users', uid), Object.assign(clean, { updatedAt: serverTimestamp() }), { merge: true });
  },

  /* ---------- Código del conjunto ----------
     El código vive en config/acceso, un documento que NINGÚN cliente puede
     leer: solo las reglas de seguridad lo consultan para comparar. Por eso
     mandamos el código escrito y es el servidor el que decide si la cuenta
     queda verificada — no hay forma de marcarse vecino a pulso. */
  async verificarCodigo(codigo) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const limpio = String(codigo || '').trim().toUpperCase();
    if (!limpio) throw new Error('Escribe el código que te dio la administración.');
    try {
      await setDoc(doc(db, 'users', uid), {
        codigoIngresado: limpio, verificado: true, verificadoAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      if (String(e && e.code).includes('permission')) throw new Error('Ese código no es el del conjunto. Revísalo con la administración.');
      throw new Error('No pudimos validar el código. Intenta de nuevo.');
    }
  },
  // El administrador puede dar acceso a mano (por ejemplo, a un vecino nuevo).
  async setUserVerified(uid, verificado) {
    await updateDoc(doc(db, 'users', uid), {
      verificado: !!verificado, verificadoAt: verificado ? serverTimestamp() : null, updatedAt: serverTimestamp()
    });
  },

  /* Gustos del residente (vehículo, color, precio…): viajan con la cuenta,
     así el carro y los colores lo siguen a cualquier dispositivo. */
  async savePrefs(prefs) {
    const uid = VB.uid();
    if (!uid) return;
    await setDoc(doc(db, 'users', uid), { prefs, prefsAt: serverTimestamp() }, { merge: true });
  },

  /* ---------- Notificaciones con la app cerrada (FCM) ----------
     Sin clave VAPID configurada esto no hace nada: la app sigue avisando
     con notificaciones locales mientras está abierta. */
  pushAvailable: () => !!vapidKey && 'serviceWorker' in navigator && 'Notification' in window,
  async registerPush() {
    if (!vapidKey || !state.user) return null;
    try {
      const { getMessaging, getToken, onMessage } = await import('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging.js');
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js', { scope: '/' });
      const messaging = getMessaging(app);
      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: reg });
      if (!token) return null;
      // Guardamos el token del dispositivo junto al perfil; la Cloud Function lo usa.
      await setDoc(doc(db, 'users', state.user.uid), {
        fcmTokens: { [token]: { at: serverTimestamp(), ua: navigator.userAgent.slice(0, 120) } }
      }, { merge: true });
      onMessage(messaging, (payload) => {
        window.dispatchEvent(new CustomEvent('vb-push', { detail: payload }));
      });
      return token;
    } catch (e) {
      return null;
    }
  },

  /* ---------- Administración del conjunto ---------- */
  watchAllBookings(cb, onErr) {
    return onSnapshot(query(collection(db, 'bookings')), (snap) => {
      const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
      list.sort((a, b) => (b.createdAt && b.createdAt.seconds || 0) - (a.createdAt && a.createdAt.seconds || 0));
      cb(list);
    }, (e) => { if (onErr) onErr(e); });
  },
  watchConjuntoStations(conjunto, cb, onErr) {
    const q = query(collection(db, 'stations'), where('conjunto', '==', conjunto || 'montreal'));
    return onSnapshot(q, (snap) => {
      cb(snap.docs.map((d) => Object.assign({ id: d.id }, d.data())));
    }, (e) => { if (onErr) onErr(e); });
  },
  async listUsers() {
    try {
      const snap = await getDocs(collection(db, 'users'));
      return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
    } catch (e) { return []; }
  },
  async setUserRole(uid, role) {
    await updateDoc(doc(db, 'users', uid), { role, updatedAt: serverTimestamp() });
  },
  async saveManagedSpot(data, id) {
    const uid = VB.uid();
    if (!uid) throw new Error('login');
    const payload = Object.assign({}, data, {
      ownerUid: uid,
      ownerName: data.ownerName || 'Administración',
      common: true,
      conjunto: data.conjunto || 'montreal',
      ownerVerified: true,
      updatedAt: serverTimestamp()
    });
    if (id) { await updateDoc(doc(db, 'stations', id), payload); return id; }
    payload.createdAt = serverTimestamp();
    payload.ratingSum = 0; payload.ratingCount = 0;
    const ref = await addDoc(collection(db, 'stations'), payload);
    return ref.id;
  },
  async deleteStation(id) { await deleteDoc(doc(db, 'stations', id)); },
  async getStation(id) {
    try { const s = await getDoc(doc(db, 'stations', id)); return s.exists() ? Object.assign({ id: s.id }, s.data()) : null; }
    catch (e) { return null; }
  }
};

window.VB = VB;
window.dispatchEvent(new Event('vb-ready'));
