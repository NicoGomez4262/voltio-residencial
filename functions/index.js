/* =========================================================
   VOLTIO — Notificaciones con la app cerrada
   Cloud Functions (2ª gen) sobre la base Firestore "default".

   Qué avisa:
   · al anfitrión, cuando un vecino solicita su puesto;
   · al vecino, cuando le aceptan, le declinan o le confirman el pago;
   · a quien corresponda, cuando le escriben por el chat.

   Requiere plan Blaze. Despliegue:
     cd functions && npm install
     firebase deploy --only functions
   ========================================================= */
import { initializeApp, getApp } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import { setGlobalOptions } from 'firebase-functions/v2';
import { logger } from 'firebase-functions';

initializeApp();
setGlobalOptions({ region: 'us-central1', maxInstances: 10 });

// La base de este proyecto no es la clásica "(default)": se llama "default".
const DB = 'default';
const db = getFirestore(getApp(), DB);
const trigger = (document) => ({ document, database: DB });

const fmtCOP = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');

/* Manda el aviso a todos los dispositivos de un usuario y limpia los tokens muertos. */
async function pushTo(uid, title, body, extra) {
  if (!uid) return;
  const snap = await db.doc(`users/${uid}`).get();
  const tokens = Object.keys((snap.exists && snap.data().fcmTokens) || {});
  if (!tokens.length) return;

  const res = await getMessaging().sendEachForMulticast({
    tokens,
    notification: { title, body },
    data: Object.assign({ title, body, url: '/' }, extra || {}),
    webpush: {
      notification: { icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' },
      fcmOptions: { link: 'https://voltio-red.web.app/' }
    }
  });

  const muertos = [];
  res.responses.forEach((r, i) => {
    const code = r.error && r.error.code;
    if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
      muertos.push(tokens[i]);
    }
  });
  if (muertos.length) {
    const patch = {};
    muertos.forEach((t) => { patch[`fcmTokens.${t}`] = FieldValue.delete(); });
    await db.doc(`users/${uid}`).update(patch).catch(() => {});
  }
  logger.info(`push a ${uid}: ${res.successCount}/${tokens.length}`);
}

/* ---------- Una solicitud nueva ---------- */
export const onNuevaReserva = onDocumentCreated(trigger('bookings/{id}'), async (event) => {
  const b = event.data && event.data.data();
  if (!b) return;
  if (b.estado === 'confirmada') return; // puesto común: no hay nada que aprobar
  await pushTo(
    b.ownerUid,
    'Nueva solicitud de reserva',
    `${b.driverName || 'Un vecino'} quiere ${b.stationName || 'tu puesto'} el ${b.fecha || ''} de ${b.from || ''} a ${b.to || ''}.`,
    { tag: 'reserva-' + event.params.id }
  );
});

/* ---------- Aceptada, declinada o pagada ---------- */
export const onCambioReserva = onDocumentUpdated(trigger('bookings/{id}'), async (event) => {
  const antes = event.data.before.data(), ahora = event.data.after.data();
  if (!antes || !ahora) return;
  const tag = 'reserva-' + event.params.id;

  if (antes.estado !== ahora.estado) {
    if (ahora.estado === 'confirmada') {
      await pushTo(ahora.driverUid, '¡Reserva confirmada! ⚡',
        `${ahora.ownerName || 'El anfitrión'} aceptó tu carga en ${ahora.stationName || 'su puesto'}.`, { tag });
    } else if (ahora.estado === 'rechazada') {
      await pushTo(ahora.driverUid, 'Solicitud declinada',
        ahora.rejectReason ? `Motivo: ${ahora.rejectReason}` : 'Tu vecino no puede esta vez. Busca otro puesto en la app.', { tag });
    } else if (ahora.estado === 'completada') {
      await pushTo(ahora.driverUid, 'Carga completada 🔋',
        `${ahora.stationName || 'Tu carga'}: ${fmtCOP(ahora.totalReal || ahora.total)}.`, { tag });
    }
  }

  if (!antes.pagado && ahora.pagado) {
    await pushTo(ahora.driverUid, 'Pago confirmado ✅',
      `${ahora.ownerName || 'El anfitrión'} registró tu pago de ${fmtCOP(ahora.totalReal || ahora.total)}.`, { tag });
  }
  // El vecino pagó en línea: el anfitrión se entera sin abrir la app.
  if (!antes.wompiTxId && ahora.wompiTxId && ahora.wompiStatus === 'APPROVED') {
    await pushTo(ahora.ownerUid, 'Pago en línea recibido 💳',
      `${ahora.driverName || 'Un vecino'} pagó ${fmtCOP(ahora.totalReal || ahora.total)} por ${ahora.stationName || 'tu puesto'}.`, { tag });
  }
});

/* ---------- Mensajes del chat ---------- */
export const onNuevoMensaje = onDocumentCreated(trigger('chats/{chatId}/messages/{mid}'), async (event) => {
  const m = event.data && event.data.data();
  if (!m) return;
  const chat = await db.doc(`chats/${event.params.chatId}`).get();
  if (!chat.exists) return;
  const c = chat.data();
  const destino = (c.participantes || []).find((u) => u !== m.from);
  if (!destino) return;
  await pushTo(destino, `💬 ${m.fromName || 'Nuevo mensaje'}`,
    String(m.text || '').slice(0, 120), { tag: 'chat-' + event.params.chatId });
});
