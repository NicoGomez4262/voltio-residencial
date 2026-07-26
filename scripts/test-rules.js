/**
 * Prueba las reglas de Firestore contra el simulador de Firebase.
 * No toca datos ni necesita cuentas: manda peticiones simuladas y comprueba
 * que se permitan o se nieguen como corresponde.
 *
 *   node scripts/test-rules.js
 *
 * Cubre lo que sostiene el piloto: el código del conjunto, quién puede
 * reservar y publicar, el bloqueo de horas dobles y la privacidad del perfil.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const KEY_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  path.join(process.env.USERPROFILE || process.env.HOME, 'voltio-firebase-key.json');
const key = JSON.parse(fs.readFileSync(KEY_PATH, 'utf8'));
const PROJECT = key.project_id;
const b64u = (x) => Buffer.from(x).toString('base64url');

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64u(JSON.stringify({
    iss: key.client_email, scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600
  }));
  const sig = crypto.createSign('RSA-SHA256').update(header + '.' + claim).sign(key.private_key);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') +
          '&assertion=' + header + '.' + claim + '.' + b64u(sig)
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('token: ' + JSON.stringify(j));
  return j.access_token;
}

const DOC = (p) => `/databases/(default)/documents/${p}`;
const CODIGO = process.env.VOLTIO_CODIGO || 'MONTREAL2026';

/* Atajos para simular qué hay en la base cuando las reglas consultan. */
const mockGet = (p, data) => ({ function: 'get', args: [{ exactValue: DOC(p) }], result: { value: { data } } });
const mockExists = (p, v) => ({ function: 'exists', args: [{ exactValue: DOC(p) }], result: { value: v } });

// Perfiles tipo: vecino con código, vecino sin código y administración.
const VECINO = [mockExists('users/vecino', true), mockGet('users/vecino', { role: 'guest', verificado: true })];
const NUEVO = [mockExists('users/nuevo', true), mockGet('users/nuevo', { role: 'guest' })];
const ADMIN = [mockExists('users/jefe', true), mockGet('users/jefe', { role: 'admin' })];
const CONFIG = [mockGet('config/acceso', { codigo: CODIGO })];
const PUESTO = (uid) => mockGet('stations/p1', { ownerUid: uid });

const casos = [
  // ---- Código del conjunto ----
  { n: 'Con el código correcto, la cuenta queda verificada', esperado: 'ALLOW',
    m: 'update', p: 'users/nuevo', uid: 'nuevo', mocks: [...NUEVO, ...CONFIG],
    data: { verificado: true, codigoIngresado: CODIGO }, antes: { role: 'guest' } },

  { n: 'Con un código inventado, NO se verifica', esperado: 'DENY',
    m: 'update', p: 'users/nuevo', uid: 'nuevo', mocks: [...NUEVO, ...CONFIG],
    data: { verificado: true, codigoIngresado: 'ABRETESESAMO' }, antes: { role: 'guest' } },

  { n: 'Sin código ninguno, tampoco se verifica', esperado: 'DENY',
    m: 'update', p: 'users/nuevo', uid: 'nuevo', mocks: [...NUEVO, ...CONFIG],
    data: { verificado: true }, antes: { role: 'guest' } },

  { n: 'Al crear la cuenta nadie nace verificado', esperado: 'DENY',
    m: 'create', p: 'users/nuevo', uid: 'nuevo', mocks: [...NUEVO, ...CONFIG],
    data: { role: 'guest', verificado: true } },

  { n: 'Nadie se asciende a administrador', esperado: 'DENY',
    m: 'update', p: 'users/vecino', uid: 'vecino', mocks: [...VECINO, ...CONFIG],
    data: { role: 'admin' }, antes: { role: 'guest', verificado: true } },

  // ---- Quién puede reservar y publicar ----
  { n: 'El vecino verificado reserva', esperado: 'ALLOW',
    m: 'create', p: 'bookings/b1', uid: 'vecino', mocks: VECINO,
    data: { driverUid: 'vecino', stationId: 'p1', fecha: '2026-08-01' } },

  { n: 'Quien no metió el código NO reserva', esperado: 'DENY',
    m: 'create', p: 'bookings/b1', uid: 'nuevo', mocks: NUEVO,
    data: { driverUid: 'nuevo', stationId: 'p1', fecha: '2026-08-01' } },

  { n: 'Sin sesión, nada', esperado: 'DENY',
    m: 'create', p: 'bookings/b1', uid: null, mocks: [],
    data: { driverUid: 'x' } },

  { n: 'Quien no metió el código NO publica puesto', esperado: 'DENY',
    m: 'create', p: 'stations/p9', uid: 'nuevo', mocks: NUEVO,
    data: { ownerUid: 'nuevo', nombre: 'Mi puesto' } },

  { n: 'El vecino verificado publica su puesto', esperado: 'ALLOW',
    m: 'create', p: 'stations/p9', uid: 'vecino', mocks: VECINO,
    data: { ownerUid: 'vecino', nombre: 'Mi puesto' } },

  { n: 'La administración reserva sin código', esperado: 'ALLOW',
    m: 'create', p: 'bookings/b1', uid: 'jefe', mocks: ADMIN,
    data: { driverUid: 'jefe', stationId: 'p1' } },

  // ---- Horas apartadas ----
  { n: 'Apartar una hora libre', esperado: 'ALLOW',
    m: 'create', p: 'slots/p1__2026-08-01__1000', uid: 'vecino', mocks: VECINO,
    data: { driverUid: 'vecino', ownerUid: 'ana', stationId: 'p1', fecha: '2026-08-01', hhmm: '1000' } },

  { n: 'Pisar una hora ya apartada por otro', esperado: 'DENY',
    m: 'update', p: 'slots/p1__2026-08-01__1000', uid: 'otro', mocks: VECINO,
    data: { driverUid: 'otro' }, antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  { n: 'Liberar la hora propia', esperado: 'ALLOW',
    m: 'delete', p: 'slots/p1__2026-08-01__1000', uid: 'vecino', mocks: VECINO,
    antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  { n: 'El anfitrión libera una hora de su puesto', esperado: 'ALLOW',
    m: 'delete', p: 'slots/p1__2026-08-01__1000', uid: 'ana', mocks: VECINO,
    antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  { n: 'Un tercero NO libera la hora de otro', esperado: 'DENY',
    m: 'delete', p: 'slots/p1__2026-08-01__1000', uid: 'colado', mocks: VECINO,
    antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  // ---- Pagos ----
  { n: 'El vecino NO se declara pagado', esperado: 'DENY',
    m: 'update', p: 'bookings/b1', uid: 'vecino', mocks: VECINO,
    data: { pagado: true }, antes: { driverUid: 'vecino', ownerUid: 'ana', total: 20000 } },

  { n: 'El vecino sí deja constancia de su pago en línea', esperado: 'ALLOW',
    m: 'update', p: 'bookings/b1', uid: 'vecino', mocks: VECINO,
    data: { wompiTxId: '123-abc', wompiStatus: 'APPROVED' }, antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  { n: 'El anfitrión sí confirma el pago', esperado: 'ALLOW',
    m: 'update', p: 'bookings/b1', uid: 'ana', mocks: VECINO,
    data: { pagado: true }, antes: { driverUid: 'vecino', ownerUid: 'ana' } },

  // ---- Privacidad ----
  { n: 'Nadie lee el perfil de otro vecino', esperado: 'DENY',
    m: 'get', p: 'users/vecino', uid: 'curioso', mocks: [mockExists('users/curioso', true), mockGet('users/curioso', { role: 'guest', verificado: true })],
    antes: { phone: '3001234567', torre: '2', apto: '304' } },

  { n: 'La administración sí lee los perfiles', esperado: 'ALLOW',
    m: 'get', p: 'users/vecino', uid: 'jefe', mocks: ADMIN, antes: { phone: '3001234567' } },

  { n: 'El código del conjunto no lo lee nadie', esperado: 'DENY',
    m: 'get', p: 'config/acceso', uid: 'jefe', mocks: ADMIN, antes: { codigo: CODIGO } },

  // ---- Llaves de la pasarela ----
  { n: 'El anfitrión guarda sus llaves de Wompi', esperado: 'ALLOW',
    m: 'update', p: 'stations/p1/pay/wompi', uid: 'ana', mocks: [...VECINO, PUESTO('ana')],
    data: { pubKey: 'pub_test_x', integrity: 'test_integrity_y' } },

  { n: 'Otro anfitrión NO toca llaves ajenas', esperado: 'DENY',
    m: 'update', p: 'stations/p1/pay/wompi', uid: 'colado', mocks: [...VECINO, PUESTO('ana')],
    data: { pubKey: 'pub_test_malo' } }
];

function build(c) {
  const req = { auth: c.uid ? { uid: c.uid, token: { email: c.uid + '@test.co' } } : null, path: DOC(c.p), method: c.m };
  if (c.data) req.resource = { data: c.data };
  const t = { expectation: c.esperado, request: req };
  if (c.antes) t.resource = { data: c.antes };
  if (c.mocks && c.mocks.length) t.functionMocks = c.mocks;
  return t;
}

(async () => {
  const token = await getToken();
  const source = { files: [{ name: 'firestore.rules', content: fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8') }] };
  const res = await fetch(`https://firebaserules.googleapis.com/v1/projects/${PROJECT}:test`, {
    method: 'POST',
    headers: { authorization: 'Bearer ' + token, 'content-type': 'application/json' },
    body: JSON.stringify({ source, testSuite: { testCases: casos.map(build) } })
  });
  const j = await res.json();
  if (!res.ok) { console.error('La API respondió', res.status, JSON.stringify(j).slice(0, 600)); process.exit(1); }
  if (j.issues && j.issues.length) {
    console.error('Las reglas tienen problemas:');
    j.issues.forEach((i) => console.error(' ', i.severity, i.description, `(línea ${i.sourcePosition && i.sourcePosition.line})`));
    process.exit(1);
  }
  let ok = 0, mal = 0;
  (j.testResults || []).forEach((r, i) => {
    const bien = r.state === 'SUCCESS';
    if (bien) ok++; else mal++;
    console.log(`${bien ? '  ok  ' : ' FALLA'}  ${casos[i].n}${bien ? '' : '   (esperaba ' + casos[i].esperado + ')'}`);
    if (!bien && r.errorPosition) console.log(`        línea ${r.errorPosition.line} de las reglas`);
    if (!bien && r.debugMessages) r.debugMessages.slice(0, 2).forEach((d) => console.log('        ' + d));
  });
  console.log(`\n${ok} correctas, ${mal} con problemas.`);
  process.exit(mal ? 1 : 0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
