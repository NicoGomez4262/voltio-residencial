/* =========================================================
   VOLTIO — Pagos en línea con Wompi (tarjeta, PSE, Nequi)
   Sin dependencias. Expone window.VW.

   Cómo funciona, en corto:
   1. El anfitrión guarda su llave pública y su secreto de integridad.
   2. El vecino toca "Pagar en línea": firmamos el cobro (SHA-256) y lo
      mandamos al Checkout Web de Wompi.
   3. Wompi devuelve al vecino a la app con el id de la transacción.
   4. Consultamos ese id contra la API de Wompi. Si está APPROVED y el monto
      coincide, la reserva queda marcada como pagada — sin revisar el banco.

   La confirmación que vale es la que hace el anfitrión (paso 4 desde su
   sesión): el celular del vecino no puede darse por pagado a sí mismo.
   ========================================================= */
(function () {
  'use strict';

  const CHECKOUT = 'https://checkout.wompi.co/p/';
  const API_PROD = 'https://production.wompi.co/v1';
  const API_TEST = 'https://sandbox.wompi.co/v1';
  const LS_PENDING = 'voltio.wompi.pending.v1';

  const isTest = (pubKey) => /^pub_test_/.test(String(pubKey || ''));
  const apiBase = (pubKey) => (isTest(pubKey) ? API_TEST : API_PROD);

  /* Una configuración sirve si tiene las dos piezas con el formato de Wompi. */
  function isConfigured(cfg) {
    if (!cfg) return false;
    const k = String(cfg.pubKey || '').trim(), s = String(cfg.integrity || '').trim();
    return /^pub_(prod|test)_\w+/.test(k) && s.length >= 8;
  }

  /* Motivo legible por el que una configuración no sirve (para el anfitrión). */
  function configError(cfg) {
    const k = String((cfg && cfg.pubKey) || '').trim(), s = String((cfg && cfg.integrity) || '').trim();
    if (!k && !s) return 'Falta la llave pública y el secreto de integridad.';
    if (!/^pub_(prod|test)_\w+/.test(k)) return 'La llave pública debe empezar por pub_prod_ o pub_test_.';
    if (s.length < 8) return 'Falta el secreto de integridad (lo ves junto a las llaves en Wompi).';
    return '';
  }

  /* Firma de integridad: SHA256("<referencia><montoEnCentavos><moneda><secreto>") */
  async function sign(reference, amountInCents, currency, secret) {
    const raw = String(reference) + String(amountInCents) + String(currency) + String(secret);
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw));
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /* Referencia única y rastreable: VOLTIO-<reserva>-<marca de tiempo> */
  const reference = (bookingId) => 'VOLTIO-' + String(bookingId || 'x').replace(/[^A-Za-z0-9]/g, '') + '-' + Date.now().toString(36).toUpperCase();

  const toCents = (cop) => Math.round(Math.max(0, Number(cop) || 0)) * 100;

  /* Arma la URL del Checkout Web ya firmada. */
  async function buildCheckout(opts) {
    const cents = toCents(opts.totalCOP);
    if (cents < 150000) throw new Error('Wompi solo procesa cobros desde $1.500. Usa Bre-B para montos pequeños.');
    const ref = reference(opts.bookingId);
    const signature = await sign(ref, cents, 'COP', opts.integrity);
    const p = new URLSearchParams();
    p.set('public-key', opts.pubKey);
    p.set('currency', 'COP');
    p.set('amount-in-cents', String(cents));
    p.set('reference', ref);
    p.set('signature:integrity', signature);
    p.set('redirect-url', opts.redirectUrl);
    if (opts.email) p.set('customer-data:email', opts.email);
    if (opts.fullName) p.set('customer-data:full-name', opts.fullName);
    if (opts.phone) p.set('customer-data:phone-number', opts.phone);
    return { url: CHECKOUT + '?' + p.toString(), reference: ref, amountInCents: cents, test: isTest(opts.pubKey) };
  }

  /* Consulta el estado real de una transacción. La llave pública no es secreta. */
  async function getTransaction(txId, pubKey) {
    const r = await fetch(apiBase(pubKey) + '/transactions/' + encodeURIComponent(txId), {
      headers: { Authorization: 'Bearer ' + pubKey }
    });
    if (!r.ok) throw new Error('No pudimos consultar el pago con Wompi (' + r.status + ')');
    const j = await r.json();
    return (j && j.data) || null;
  }

  /* ¿La transacción respalda de verdad el cobro de esta reserva? */
  function verifyAgainst(tx, expectedCents) {
    if (!tx) return { ok: false, motivo: 'Wompi no devolvió la transacción.' };
    if (tx.status !== 'APPROVED') return { ok: false, status: tx.status, motivo: statusText(tx.status) };
    // Toleramos un peso de diferencia por redondeos, nunca un cobro menor al acordado.
    if (expectedCents && Number(tx.amount_in_cents) < expectedCents - 100) {
      return { ok: false, status: tx.status, motivo: 'El pago fue por un monto menor al de la reserva.' };
    }
    return { ok: true, status: tx.status };
  }

  function statusText(s) {
    return ({
      APPROVED: 'Pago aprobado',
      PENDING: 'El pago aún está en proceso en el banco.',
      DECLINED: 'El banco rechazó el pago.',
      VOIDED: 'El pago fue anulado.',
      ERROR: 'El pago falló.'
    })[s] || ('Estado del pago: ' + s);
  }

  /* Rastro local del pago en curso: sobrevive al salto al banco y de vuelta. */
  function remember(data) {
    try { localStorage.setItem(LS_PENDING, JSON.stringify(Object.assign({ at: Date.now() }, data))); } catch (e) {}
  }
  function pending() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_PENDING));
      // Un pago abandonado hace más de 6 horas ya no nos interesa.
      if (v && Date.now() - (v.at || 0) < 6 * 3600e3) return v;
    } catch (e) {}
    return null;
  }
  function forget() { try { localStorage.removeItem(LS_PENDING); } catch (e) {} }

  /* El id que Wompi agrega al volver a la app. */
  function returnedTxId() {
    try {
      const q = new URLSearchParams(location.search);
      return q.get('id') || q.get('transaction_id') || null;
    } catch (e) { return null; }
  }
  function cleanUrl() {
    try { history.replaceState(null, '', location.pathname); } catch (e) {}
  }

  window.VW = {
    CHECKOUT, isTest, apiBase, isConfigured, configError, sign, reference, toCents,
    buildCheckout, getTransaction, verifyAgainst, statusText,
    remember, pending, forget, returnedTxId, cleanUrl
  };
})();
