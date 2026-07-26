/**
 * Aprovisionamiento del backend de Voltio (sin dependencias).
 * Usa la cuenta de servicio para llamar APIs de Google Cloud/Firebase:
 *   node scripts/backend-setup.js setup   -> habilita APIs, crea Firestore, registra web app, configura Auth
 *   node scripts/backend-setup.js seed    -> siembra estaciones de ejemplo (docs reales en Firestore)
 *   node scripts/backend-setup.js google  -> intenta habilitar el proveedor Google de Auth
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
    iss: key.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now, exp: now + 3600
  }));
  const sig = crypto.createSign('RSA-SHA256').update(header + '.' + claim).sign(key.private_key);
  const jwt = header + '.' + claim + '.' + b64u(sig);
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + jwt
  });
  const j = await res.json();
  if (!j.access_token) throw new Error('token: ' + JSON.stringify(j));
  return j.access_token;
}

let TOKEN = null;
async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: { authorization: 'Bearer ' + TOKEN, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  let j = null;
  try { j = await res.json(); } catch (e) { j = {}; }
  return { status: res.status, body: j };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ============================ SETUP ============================ */
async function setup() {
  console.log('Proyecto:', PROJECT);

  // 1. Habilitar APIs
  for (const svc of ['firestore.googleapis.com', 'identitytoolkit.googleapis.com', 'firebase.googleapis.com', 'firebasehosting.googleapis.com']) {
    const r = await api('POST', `https://serviceusage.googleapis.com/v1/projects/${PROJECT}/services/${svc}:enable`);
    console.log('enable', svc, '->', r.status, r.body.error ? r.body.error.message : 'ok');
  }
  await sleep(5000);

  // 2. Crear base de datos Firestore (São Paulo — la más cercana a Colombia)
  let r = await api('POST', `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases?databaseId=(default)`,
    { type: 'FIRESTORE_NATIVE', locationId: 'southamerica-east1' });
  if (r.status === 409) console.log('firestore -> ya existía');
  else console.log('firestore ->', r.status, r.body.error ? r.body.error.message : 'creando…');
  for (let i = 0; i < 12; i++) {
    const g = await api('GET', `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/default`);
    if (g.status === 200) { console.log('firestore listo:', g.body.locationId, g.body.type); break; }
    await sleep(4000);
  }

  // 3. Web app (registrar si no existe) + config
  r = await api('GET', `https://firebase.googleapis.com/v1beta1/projects/${PROJECT}/webApps`);
  let appId = (r.body.apps || [])[0] && (r.body.apps || [])[0].appId;
  if (!appId) {
    r = await api('POST', `https://firebase.googleapis.com/v1beta1/projects/${PROJECT}/webApps`, { displayName: 'Voltio Web' });
    console.log('webApp create ->', r.status);
    const opName = r.body.name;
    for (let i = 0; i < 12; i++) {
      await sleep(3000);
      const op = await api('GET', `https://firebase.googleapis.com/v1/${opName}`);
      if (op.body.done) { appId = op.body.response && op.body.response.appId; break; }
    }
  }
  console.log('webApp id:', appId);
  r = await api('GET', `https://firebase.googleapis.com/v1beta1/projects/${PROJECT}/webApps/${appId}/config`);
  const cfg = r.body;
  const fileCfg = {
    apiKey: cfg.apiKey,
    authDomain: cfg.authDomain,
    projectId: cfg.projectId,
    storageBucket: cfg.storageBucket,
    messagingSenderId: cfg.messagingSenderId,
    appId: cfg.appId
  };
  const out = 'export const firebaseConfig = ' + JSON.stringify(fileCfg, null, 2) + ';\n';
  fs.writeFileSync(path.join(__dirname, '..', 'public', 'js', 'firebase-config.js'), out);
  console.log('firebase-config.js escrito:', JSON.stringify(fileCfg.projectId), fileCfg.appId);

  // 4. Auth: correo+contraseña, anónimo y dominios autorizados
  r = await api('PATCH',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config?updateMask=signIn.email,signIn.anonymous,authorizedDomains`,
    {
      signIn: { email: { enabled: true, passwordRequired: true }, anonymous: { enabled: true } },
      authorizedDomains: ['localhost', `${PROJECT}.firebaseapp.com`, `${PROJECT}.web.app`, 'voltio-red.web.app']
    });
  console.log('auth config ->', r.status, r.body.error ? JSON.stringify(r.body.error) : 'ok (email+anónimo+dominios)');

  // 5. Intentar habilitar Google como proveedor
  await tryGoogle();
  console.log('SETUP COMPLETO');
}

async function tryGoogle() {
  let r = await api('POST',
    `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/defaultSupportedIdpConfigs?idpId=google.com`,
    { enabled: true });
  if (r.status === 409) {
    r = await api('PATCH',
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/defaultSupportedIdpConfigs/google.com?updateMask=enabled`,
      { enabled: true });
  }
  console.log('google idp ->', r.status, r.body.error ? JSON.stringify(r.body.error.message || r.body.error) : JSON.stringify(r.body));
}

/* ============================ SEED ============================ */
const F = {
  s: (v) => ({ stringValue: String(v) }),
  n: (v) => (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }),
  b: (v) => ({ booleanValue: !!v }),
  arrN: (a) => ({ arrayValue: { values: a.map(F.n) } }),
  arrS: (a) => ({ arrayValue: { values: a.map(F.s) } }),
  ts: () => ({ timestampValue: new Date().toISOString() })
};

// Conjunto MontReal — puestos de ejemplo del piloto residencial
const SEED = [
  { id: 'mr-t1-ana',    nombre: 'Torre 1 · Parqueadero cubierto', torre: '1', num: 'P-112', puerto: 'Tipo 2',     pow: 7.4, tamano: 'Mediano', precio: 900,  sf: 0,    desc: 0,   dias: [0,1,1,1,1,1,0], desde: '06:00', hasta: '22:00', breb: '@ana.montreal', titular: 'Ana Gómez',        ownerName: 'Ana G. (Torre 1)',   rs: 47, rc: 10, cond: 'Cubierto y con cámaras. Escríbeme por el chat cuando llegues y te abro el sótano.' },
  { id: 'mr-t3-carlos', nombre: 'Torre 3 · Toma nocturna',        torre: '3', num: 'P-305', puerto: 'Doméstico', pow: 3.6, tamano: 'Pequeño', precio: 800,  sf: 0,    desc: 0,   dias: [1,1,1,1,1,1,1], desde: '18:00', hasta: '23:00', breb: '@carlos3',     titular: 'Carlos Ruiz',      ownerName: 'Carlos R. (Torre 3)', rs: 22, rc: 6,  cond: 'Toma de 220V, ideal para dejar el carro cargando de noche. Puesto para autos compactos.' },
  { id: 'mr-t2-sofia',  nombre: 'Torre 2 · Wallbox 11 kW',        torre: '2', num: 'P-208', puerto: 'Tipo 2',     pow: 11,  tamano: 'Grande',  precio: 1000, sf: 1000, desc: 0,   dias: [1,1,1,1,1,1,0], desde: '07:00', hasta: '21:00', breb: '@sofiap',      titular: 'Sofía Peña',       ownerName: 'Sofía P. (Torre 2)',  rs: 58, rc: 12, cond: 'Wallbox rápido de 11 kW en puesto grande. Incluye una pequeña tarifa por el uso del equipo.' },
  { id: 'mr-t5-diego',  nombre: 'Torre 5 · Carga rápida CCS',     torre: '5', num: 'P-501', puerto: 'CCS',        pow: 22,  tamano: 'Grande',  precio: 1200, sf: 0,    desc: 0,   dias: [0,0,0,0,0,1,1], desde: '08:00', hasta: '19:00', breb: '@diego.ev',    titular: 'Diego Salas',      ownerName: 'Diego S. (Torre 5)',  rs: 30, rc: 7,  cond: 'Cargador CCS de alta potencia, disponible solo fines de semana. Reserva con anticipación.' },
  { id: 'mr-visit',     nombre: 'Parqueadero de visitantes',      torre: '—', num: 'P-V04', puerto: 'Tipo 1',     pow: 7.4, tamano: 'Mediano', precio: 950,  sf: 0,    desc: 200, dias: [1,1,1,1,1,1,1], desde: '08:00', hasta: '20:00', breb: '@montreal.admin', titular: 'Admón. MontReal', ownerName: 'Administración',      rs: 41, rc: 9,  cond: 'Puesto de visitantes gestionado por la administración. Avisa en portería al llegar.' }
];

async function seed() {
  for (const s of SEED) {
    const fields = {
      conjunto: F.s('montreal'),
      ownerUid: F.s('voltio-demo'),
      ownerName: F.s(s.ownerName),
      demo: F.b(true),
      nombre: F.s(s.nombre),
      torre: F.s(s.torre),
      numeroParqueadero: F.s(s.num),
      puerto: F.s(s.puerto),
      pow: F.n(s.pow),
      tamano: F.s(s.tamano),
      precio: F.n(s.precio),
      serviceFee: F.n(s.sf),
      discount: F.n(s.desc),
      desde: F.s(s.desde), hasta: F.s(s.hasta),
      dias: F.arrN(s.dias),
      breb: F.s(s.breb), titular: F.s(s.titular),
      visible: F.b(true),
      fotos: { arrayValue: {} },
      condiciones: F.s(s.cond),
      ratingSum: F.n(s.rs), ratingCount: F.n(s.rc),
      createdAt: F.ts()
    };
    const r = await api('PATCH',
      `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/default/documents/stations/${s.id}`,
      { fields });
    console.log('seed', s.id, '->', r.status, r.body.error ? r.body.error.message : 'ok');
  }
  console.log('SEED COMPLETO');
}

/* Retira los puestos de ejemplo: en el piloto real el conjunto no debe ver
   cargadores que no existen (ni torres que no existen).
   Se puede deshacer en cualquier momento con `node scripts/backend-setup.js seed`. */
async function unseed() {
  for (const s of SEED) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/default/documents/stations/${s.id}`;
    const g = await api('GET', url);
    if (g.status !== 200) { console.log('unseed', s.id, '-> no existe'); continue; }
    const esDemo = g.body.fields && g.body.fields.demo && g.body.fields.demo.booleanValue === true;
    if (!esDemo) { console.log('unseed', s.id, '-> OMITIDO: ya no está marcado como demo (¿lo edito alguien?)'); continue; }
    const r = await api('DELETE', url);
    console.log('unseed', s.id, '->', r.status === 200 ? 'borrado' : r.status);
  }
  console.log('LISTO: el conjunto ya solo verá puestos reales.');
}

/* ============================ CHECK ============================ */
async function check() {
  const db = await api('GET', `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/default`);
  console.log('Firestore  :', db.status === 200
    ? `OK (${db.body.locationId}, ${db.body.type})`
    : `FALTA (${db.status} ${db.body.error ? db.body.error.message.slice(0, 60) : ''})`);

  const cfg = await api('GET', `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/config`);
  if (cfg.status === 200) {
    const si = cfg.body.signIn || {};
    console.log('Auth correo:', si.email && si.email.enabled ? 'OK habilitado' : 'FALTA');
    console.log('Dominios   :', (cfg.body.authorizedDomains || []).join(', '));
  } else console.log('Auth       : FALTA (', cfg.status, ')');

  const idp = await api('GET', `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT}/defaultSupportedIdpConfigs`);
  const gl = ((idp.body && idp.body.defaultSupportedIdpConfigs) || []).find((c) => (c.name || '').endsWith('google.com'));
  console.log('Auth Google:', gl ? (gl.enabled ? 'OK habilitado' : 'existe pero DESHABILITADO') : 'FALTA (habilítalo en consola)');
}

/* ============================ RULES ============================ */
async function rules() {
  const src = fs.readFileSync(path.join(__dirname, '..', 'firestore.rules'), 'utf8');
  const rs = await api('POST', `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/rulesets`,
    { source: { files: [{ name: 'firestore.rules', content: src }] } });
  if (rs.status !== 200) { console.log('crear ruleset ->', rs.status, JSON.stringify(rs.body).slice(0, 300)); return; }
  const rulesetName = rs.body.name;
  console.log('ruleset creado:', rulesetName);
  // La base de este proyecto se llama "default" (base CON NOMBRE, no la clásica
  // "(default)"). El release de reglas debe ser cloud.firestore/default; usar
  // solo "cloud.firestore" publicaría a una base (default) que aquí no existe.
  const DB = process.argv[3] || 'default';
  const relId = DB === '(default)' ? 'cloud.firestore' : `cloud.firestore/${DB}`;
  const relName = `projects/${PROJECT}/releases/${relId}`;
  let up = await api('PATCH', `https://firebaserules.googleapis.com/v1/${relName}`,
    { release: { name: relName, rulesetName } });
  if (up.status === 404 || (up.body.error && /not.*exist|NOT_FOUND/i.test(JSON.stringify(up.body.error)))) {
    up = await api('POST', `https://firebaserules.googleapis.com/v1/projects/${PROJECT}/releases`,
      { name: relName, rulesetName });
  }
  console.log('publicar release', relId, '->', up.status, up.body.error ? JSON.stringify(up.body.error.message || up.body.error) : 'OK reglas activas');
}

/* ============================ ADMIN ============================ */
/**
 * Asigna (o quita) el rol de administrador del conjunto por correo:
 *   node scripts/backend-setup.js admin correo@dominio.com          -> role: admin
 *   node scripts/backend-setup.js admin correo@dominio.com guest    -> role: guest
 * La cuenta debe haber iniciado sesión en la app al menos una vez.
 */
async function admin() {
  const email = process.argv[3];
  const role = process.argv[4] || 'admin';
  if (!email) { console.log('Uso: node scripts/backend-setup.js admin <correo> [admin|guest]'); return; }

  const lk = await api('POST', `https://identitytoolkit.googleapis.com/v1/projects/${PROJECT}/accounts:lookup`, { email: [email] });
  const u = ((lk.body && lk.body.users) || [])[0];
  if (!u) { console.log(`No existe una cuenta para ${email}. Pídele que entre a la app una vez.`); return; }
  console.log('uid:', u.localId, '| nombre:', u.displayName || '(sin nombre)');

  const base = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/default/documents/users/${u.localId}`;
  const cur = await api('GET', base);
  const fields = { role: F.s(role), updatedAt: F.ts() };
  if (cur.status !== 200) { // el perfil aún no existe: lo creamos con lo básico
    fields.email = F.s(u.email || email);
    fields.name = F.s(u.displayName || (u.email || email).split('@')[0]);
  }
  const mask = Object.keys(fields).map((k) => `updateMask.fieldPaths=${k}`).join('&');
  const r = await api('PATCH', `${base}?${mask}`, { fields });
  console.log(`role="${role}" ->`, r.status, r.body.error ? r.body.error.message : 'OK');
}

/* ============================ IAM ============================ */
async function iam() {
  const r = await api('POST', `https://cloudresourcemanager.googleapis.com/v1/projects/${PROJECT}:getIamPolicy`, {});
  if (r.status !== 200) { console.log('getIamPolicy ->', r.status, r.body.error ? r.body.error.message : ''); return; }
  const me = 'serviceAccount:' + key.client_email;
  const mine = (r.body.bindings || []).filter((b) => (b.members || []).includes(me)).map((b) => b.role);
  console.log('Cuenta de servicio:', key.client_email);
  console.log('Roles actuales    :', mine.length ? mine.join(', ') : '(ninguno)');
}

/* ============================ MAIN ============================ */
(async () => {
  TOKEN = await getToken();
  const cmd = process.argv[2] || 'setup';
  if (cmd === 'setup') await setup();
  else if (cmd === 'seed') await seed();
  else if (cmd === 'unseed') await unseed();
  else if (cmd === 'google') await tryGoogle();
  else if (cmd === 'check') await check();
  else if (cmd === 'iam') await iam();
  else if (cmd === 'rules') await rules();
  else if (cmd === 'admin') await admin();
  else if (cmd === 'dbs') {
    const r = await api('GET', `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases`);
    console.log('list databases ->', r.status);
    console.log(JSON.stringify(r.body, null, 2).slice(0, 1200));
  }
  else console.log('comando desconocido:', cmd);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
