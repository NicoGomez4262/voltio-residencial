/* =========================================================
   VOLTIO RESIDENCIAL · v2.4 — Piloto conjunto MontReal
   Búsqueda con ranking, calendario tipo Teams, reservas,
   chat, calificaciones y notificaciones (Firebase real).
   v2.4: historial real en la nube, pago confirmado por el
   anfitrión, reporte mensual (PDF/CSV) y fotos del puesto.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Constantes ---------- */
  const LS_SETTINGS = 'voltio.res.settings.v1';
  const LS_SESSIONS = 'voltio.res.sessions.v1';
  const LS_SEEN = 'voltio.res.seen.v1';
  const LS_ADMINGUEST = 'voltio.res.adminAsGuest.v1';
  const LS_BORRADOR = 'voltio.res.borradorReserva.v1';
  const CONJUNTO = 'montreal';
  // MontReal: 3 torres, 8 pisos por torre, 4 apartamentos por piso (101 → 804).
  const TORRES = 3, PISOS = 8, APTOS_POR_PISO = 4;
  const APTO_MIN = 101, APTO_MAX = PISOS * 100 + APTOS_POR_PISO;
  const CO2_GAS_PER_L = 2.31, GAS_KM_PER_L = 12, GAS_PRICE_PER_L = 4300;
  const DIAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const DIAS_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const CAL_S = 6, CAL_E = 22;
  const DEFAULTS = { pricePerKwh: 800, serviceFee: 0, stationName: '', ownerName: '', kmPerKwh: 6, accent: 'cyan', animations: true, role: null, vehicle: 'pickup' };

  // Respaldo local: si Firestore aún no responde, la búsqueda no queda vacía
  // En producción el conjunto ve solo puestos reales; los de ejemplo son para desarrollar.
  const DEMO_ON = (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  const DEMO_STATIONS = [
    { id: 'mr-t1-ana', demo: true, ownerUid: 'voltio-demo', ownerName: 'Ana G. (Torre 1)', nombre: 'Torre 1 · Parqueadero cubierto', torre: '1', numeroParqueadero: 'P-112', puerto: 'Tipo 2', pow: 7.4, tamano: 'Mediano', precio: 900, serviceFee: 0, discount: 0, dias: [0,1,1,1,1,1,0], desde: '06:00', hasta: '22:00', breb: '@ana.montreal', titular: 'Ana Gómez', visible: true, condiciones: 'Cubierto y con cámaras. Escríbeme por el chat al llegar.', ratingSum: 47, ratingCount: 10 },
    { id: 'mr-t3-carlos', demo: true, ownerUid: 'voltio-demo', ownerName: 'Carlos R. (Torre 3)', nombre: 'Torre 3 · Toma nocturna', torre: '3', numeroParqueadero: 'P-305', puerto: 'Doméstico', pow: 3.6, tamano: 'Pequeño', precio: 800, serviceFee: 0, discount: 0, dias: [1,1,1,1,1,1,1], desde: '18:00', hasta: '23:00', breb: '@carlos3', titular: 'Carlos Ruiz', visible: true, condiciones: 'Toma de 220V, ideal para cargas nocturnas.', ratingSum: 22, ratingCount: 6 },
    { id: 'mr-t2-sofia', demo: true, ownerUid: 'voltio-demo', ownerName: 'Sofía P. (Torre 2)', nombre: 'Torre 2 · Wallbox 11 kW', torre: '2', numeroParqueadero: 'P-208', puerto: 'Tipo 2', pow: 11, tamano: 'Grande', precio: 1000, serviceFee: 1000, discount: 0, dias: [1,1,1,1,1,1,0], desde: '07:00', hasta: '21:00', breb: '@sofiap', titular: 'Sofía Peña', visible: true, condiciones: 'Wallbox rápido de 11 kW en puesto grande.', ratingSum: 58, ratingCount: 12 },
    { id: 'mr-t5-diego', demo: true, ownerUid: 'voltio-demo', ownerName: 'Diego S. (Torre 5)', nombre: 'Torre 5 · Carga rápida CCS', torre: '5', numeroParqueadero: 'P-501', puerto: 'CCS', pow: 22, tamano: 'Grande', precio: 1200, serviceFee: 0, discount: 0, dias: [0,0,0,0,0,1,1], desde: '08:00', hasta: '19:00', breb: '@diego.ev', titular: 'Diego Salas', visible: true, condiciones: 'CCS de alta potencia, solo fines de semana.', ratingSum: 30, ratingCount: 7 },
    { id: 'mr-visit', demo: true, ownerUid: 'voltio-demo', ownerName: 'Administración', nombre: 'Parqueadero de visitantes', torre: '—', numeroParqueadero: 'P-V04', puerto: 'Tipo 1', pow: 7.4, tamano: 'Mediano', precio: 950, serviceFee: 0, discount: 200, dias: [1,1,1,1,1,1,1], desde: '08:00', hasta: '20:00', breb: '@montreal.admin', titular: 'Admón. MontReal', visible: true, condiciones: 'Gestionado por la administración. Avisa en portería.', ratingSum: 41, ratingCount: 9 }
  ];

  // Residentes de ejemplo para el panel de administración (solo se usan en modo prueba local)
  const DEMO_USERS = [
    { uid: 'u-ana',    name: 'Ana Gómez',       email: 'ana.gomez@montreal.co',   phone: '300 111 2233', torre: '1', apto: '112', role: 'guest', emailVerified: true },
    { uid: 'u-carlos', name: 'Carlos Ruiz',     email: 'carlos.ruiz@montreal.co', phone: '311 445 6677', torre: '3', apto: '305', role: 'guest', emailVerified: true },
    { uid: 'u-sofia',  name: 'Sofía Peña',      email: 'sofia.pena@montreal.co',  phone: '320 998 1010', torre: '2', apto: '208', role: 'guest', emailVerified: false },
    { uid: 'u-diego',  name: 'Diego Salas',     email: 'diego.salas@montreal.co', phone: '315 223 4455', torre: '5', apto: '501', role: 'guest', emailVerified: true },
    { uid: 'u-laura',  name: 'Laura Mesa',      email: 'laura.mesa@montreal.co',  phone: '304 776 5544', torre: '4', apto: '402', role: 'guest', emailVerified: true },
    { uid: 'u-admin',  name: 'Admón. MontReal', email: 'admin@montreal.co',       phone: '601 743 0000', torre: '—', apto: '—',  role: 'admin', emailVerified: true }
  ];

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (t, a) => { const e = document.createElementNS(SVGNS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const copFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmtCOP = (n) => copFmt.format(Math.round(n || 0));
  const fmtKwh = (n) => (Math.round((n || 0) * 100) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });
  const fmtNum = (n, d = 0) => (n || 0).toLocaleString('es-CO', { maximumFractionDigits: d });
  const escapeHtml = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const debounce = (fn, ms) => { let t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; };
  /* El escalonado de listas es adorno, y el adorno no puede estorbar: solo entra
     cuando la lista se llena estando vacía. En un re-dibujo —una tecla en el
     buscador, un cambio que llega de Firestore mientras el vecino lee— repetirlo
     haría parpadear justo lo que está leyendo. Por eso se pregunta ANTES de vaciar. */
  const vaEscalonada = (ul) => !ul.firstElementChild;
  const escalonar = (el, i, on) => { if (on) { el.classList.add('stagger'); el.style.setProperty('--i', i); } return el; };
  const round2 = (n) => Math.round((n || 0) * 100) / 100;
  const uid8 = (p) => p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const tsDate = (ts) => (ts && ts.seconds ? new Date(ts.seconds * 1000) : new Date());
  const starTxt = (a) => '★'.repeat(Math.round(a)) + '☆'.repeat(5 - Math.round(a));
  const hToMin = (h) => { const p = String(h || '0:0').split(':'); return (+p[0]) * 60 + (+p[1]); };
  const sizeRank = (s) => ({ 'Pequeño': 1, 'Mediano': 2, 'Grande': 3 }[s] || 2);
  function fmtCompact(n, m) {
    if (m === 'kwh') return (Math.round(n * 10) / 10).toLocaleString('es-CO', { maximumFractionDigits: 1 });
    if (m === 'count') return String(Math.round(n));
    if (n >= 1e6) return '$' + (n / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + 'M';
    if (n >= 1e3) return '$' + Math.round(n / 1e3) + 'k';
    return '$' + Math.round(n);
  }
  function parseNum(v) {
    if (typeof v === 'number') return v;
    if (v == null) return 0;
    let s = String(v).trim().replace(/\s/g, '').replace(/[^0-9.,-]/g, '');
    if (s === '' || s === '-') return 0;
    const hd = s.includes('.'), hc = s.includes(',');
    if (hd && hc) { if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.'); else s = s.replace(/,/g, ''); }
    else if (hc) s = s.replace(/,/g, '.');
    else if (hd && s.split('.').length > 2) s = s.replace(/\./g, '');
    const n = parseFloat(s); return isNaN(n) ? 0 : n;
  }
  function loadJSON(k, fb) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  const ymd = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const parseYmd = (s) => { const p = String(s).split('-').map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  function mondayOf(d) { const x = new Date(d); const wd = (x.getDay() + 6) % 7; x.setDate(x.getDate() - wd); x.setHours(0, 0, 0, 0); return x; }
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  const dayDiff = (a, b) => Math.round((b.setHours ? b : new Date(b)) / 864e5) - Math.round((a.setHours ? a : new Date(a)) / 864e5);

  /* ---------- Estado ---------- */
  let settings = Object.assign({}, DEFAULTS, loadJSON(LS_SETTINGS, {}));
  let sessions = loadJSON(LS_SESSIONS, []);
  let mode = 'meter';
  let lastCalc = null;
  let currentView = 'buscar';
  const taState = { torre: null, piso: null, unit: null };
  const chartState = { group: 'day' };
  const admChart = { metric: 'cop' };
  const filters = { port: 'todos', minPow: 0, size: 'todos', day: 'any', date: null, band: 'any' };
  const spDias = [0, 1, 1, 1, 1, 1, 0];
  const calOffset = { driver: 0, host: 0 };
  const MAX_FOTOS = 3;
  const repState = { month: null };

  let VB = null, user = null, backendOff = false;
  let stations = [], myBookings = [], myRequests = [], myChats = [], myStationDoc = null;
  let sheetStation = null, chatCtx = null, rateCtx = null, rateStars = 0, rejectCtx = null, rejReason = null;
  // Administración del conjunto
  let myProfile = null, allBookings = [], allStations = [], allUsers = [], allSessions = [];
  let adminSpotCtx = null, userCtx = null, adminAsGuest = loadJSON(LS_ADMINGUEST, false);
  let spotQr = null; // data URL del QR mientras se edita un puesto
  let spotFotos = []; // data URLs de las fotos mientras se edita el puesto
  let syncDone = false; // ya intentamos subir las cargas locales pendientes
  const unsubs = {};
  const seen = loadJSON(LS_SEEN, { reqs: [], msgs: {} });

  // ¿La cuenta es administradora? (por perfil real, o modo prueba solo en localhost)
  const devAdmin = () => { try { return (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && localStorage.getItem('voltio.dev.admin') === '1'; } catch (e) { return false; } };
  const isAdmin = () => !!(myProfile && myProfile.role === 'admin') || devAdmin();

  /* ---------- Ajustes personales: locales y también en la cuenta ----------
     Lo que el vecino escoge (su carro, su color, su tarifa) deja de vivir solo
     en este dispositivo: se guarda en su perfil y lo acompaña a donde entre. */
  const PREF_KEYS = ['accent', 'vehicle', 'animations', 'pricePerKwh', 'kmPerKwh', 'serviceFee', 'stationName', 'ownerName', 'role'];
  let prefsLoaded = false;    // ya trajimos (o sembramos) las preferencias de la nube
  let applyingPrefs = false;  // evita devolver a la nube lo que acabamos de bajar
  let prefsTimer = null;

  const persistSettings = () => { localStorage.setItem(LS_SETTINGS, JSON.stringify(settings)); queuePrefsSync(); };
  function queuePrefsSync() {
    if (applyingPrefs || !VB || !user) return;
    clearTimeout(prefsTimer);
    prefsTimer = setTimeout(() => {
      const p = {};
      PREF_KEYS.forEach((k) => { if (settings[k] !== undefined) p[k] = settings[k]; });
      VB.savePrefs(p).catch(() => {});
    }, 900);
  }
  function applyPrefs(p) {
    applyingPrefs = true;
    try {
      const rolAntes = settings.role;
      PREF_KEYS.forEach((k) => { if (p[k] !== undefined && p[k] !== null) settings[k] = p[k]; });
      localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
      loadSettingsUI();
      if (settings.role !== rolAntes) refreshMode({ keepView: true });
      syncHeroCar();
    } finally { applyingPrefs = false; }
  }
  // Primer perfil tras entrar: o adoptamos lo que ya tenía la cuenta, o le
  // subimos lo que traía este dispositivo.
  function syncPrefsOnLogin() {
    if (prefsLoaded || !myProfile) return;
    prefsLoaded = true;
    if (myProfile.prefs && Object.keys(myProfile.prefs).length) applyPrefs(myProfile.prefs);
    else queuePrefsSync();
  }
  const persistSessions = () => localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  const persistSeen = () => localStorage.setItem(LS_SEEN, JSON.stringify(seen));

  function whenVB(cb) {
    if (window.VB) { cb(window.VB); return; }
    window.addEventListener('vb-ready', () => cb(window.VB), { once: true });
    setTimeout(() => { if (!window.VB) { backendOff = true; useFallback(); } }, 9000);
  }
  function useFallback() {
    if (stations.length) return;
    if (DEMO_ON) { stations = DEMO_STATIONS.slice(); showNotice('Mostrando puestos de ejemplo. La conexión con la nube de Voltio está pendiente.'); }
    else showNotice('No pudimos conectar con la nube de Voltio. Revisa tu internet: en cuanto vuelva, los puestos aparecen solos.');
    if (currentView === 'buscar') runSearch();
  }
  function showNotice(msg) {
    ['#buscarNotice', '#novNotice'].forEach((s) => { const el = $(s); if (el) { el.textContent = '⚠️ ' + msg; el.classList.remove('hidden'); } });
  }
  function hideNotice() { ['#buscarNotice', '#novNotice'].forEach((s) => { const el = $(s); if (el) el.classList.add('hidden'); }); }
  const needLogin = () => { openSheet('#loginSheet'); toast('Inicia sesión para continuar', 'error'); };

  /* =========================================================
     Roles y navegación
     ========================================================= */
  const TABS = {
    driver: ['buscar', 'reservas', 'chats', 'settings'],
    host: ['novedades', 'agenda', 'puesto', 'analisis', 'chats', 'settings'],
    admin: ['panel', 'usuarios', 'settings']
  };
  // Modo efectivo: el admin ve el panel, salvo que elija "ver como residente".
  function effectiveMode() {
    if (isAdmin() && !adminAsGuest) return 'admin';
    return settings.role; // 'driver' | 'host' | null
  }
  function applyRole(role, opts) {
    if (role === 'driver' || role === 'host') { settings.role = role; persistSettings(); }
    const list = TABS[role] || TABS.host;
    $$('.nav-btn').forEach((b) => b.classList.toggle('nav-hidden', !list.includes(b.dataset.view)));
    $('#roleTag').textContent = role === 'admin' ? 'MontReal · Administración' : role === 'driver' ? 'MontReal · Busco carga' : 'MontReal · Anfitrión';
    $$('#roleSwitch .seg-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.role === settings.role));
    $('#roleGate').classList.add('hidden'); $('#roleGate').setAttribute('aria-hidden', 'true');
    if (!opts || !opts.keepView) goView(list[0]);
    else if (!list.includes(currentView)) goView(list[0]);
    else syncHeroCar();
  }
  // Decide y aplica el modo según admin/rol; muestra el selector si aún no hay rol.
  function refreshMode(opts) {
    const m = effectiveMode();
    if (m === 'admin' || m === 'driver' || m === 'host') { applyRole(m, opts); return; }
    $('#roleGate').classList.remove('hidden'); $('#roleGate').setAttribute('aria-hidden', 'false');
    $$('.nav-btn').forEach((b) => b.classList.toggle('nav-hidden', !TABS.host.includes(b.dataset.view)));
  }
  function goView(name) {
    currentView = name;
    $$('.view').forEach((v) => { const a = v.id === 'view-' + name; v.classList.toggle('is-active', a); v.hidden = !a; });
    $$('.nav-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.view === name));
    if (name === 'buscar') runSearch();
    if (name === 'reservas') renderReservas();
    if (name === 'novedades') renderNovedades();
    if (name === 'agenda') renderAgenda();
    if (name === 'puesto') renderPuesto();
    if (name === 'analisis') { renderHistory(); renderCharts(); }
    if (name === 'chats') { markChatsSeen(); renderChatList(); }
    if (name === 'panel') renderPanel();
    if (name === 'usuarios') renderUsers();
    if (name === 'settings') { renderAuthUI(); loadProfileUI(); loadAdminSettingsUI(); updateNotifState(); }
    syncHeroCar();
    updateDots();
    // Al tope de una: es otra vista, no hay continuidad espacial que preservar.
    // El scroll suave le sumaba media espera a la acción más frecuente de la app,
    // y encima competía con el fundido del contenido que acababa de aparecer.
    window.scrollTo({ top: 0 });
  }

  /* =========================================================
     Auth
     ========================================================= */
  let lgMode = 'login';
  function renderAuthUI() {
    const logged = !!user;
    $('#accSignedOut').classList.toggle('hidden', logged);
    $('#accSignedIn').classList.toggle('hidden', !logged);
    const top = $('#topAvatar');
    if (logged) {
      const name = nombreVisible() || 'U', photo = user.photoURL;
      top.innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt=""/>` : escapeHtml(name[0].toUpperCase());
      $('#accAvatar').innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt=""/>` : escapeHtml(name[0].toUpperCase());
      $('#accName').textContent = name; $('#accEmail').textContent = user.email || '';
      const inp = $('#acNombre');
      if (inp && document.activeElement !== inp) inp.value = name;
      const b = [];
      if (esVecino()) b.push('<span class="sc-badge b-ver">✓ Vecino verificado</span>');
      if (VB.isGoogle()) b.push('<span class="sc-badge b-ver">✓ Google</span>');
      if (user.emailVerified) b.push('<span class="sc-badge b-ok">✓ Correo verificado</span>');
      b.push('<span class="sc-badge b-id">🪪 Identidad: próximamente</span>');
      $('#accBadges').innerHTML = b.join('');
    } else top.textContent = '👤';
    ['#resAuth', '#novAuth', '#puestoAuth', '#chatAuth'].forEach((s) => { const el = $(s); if (el) el.classList.toggle('hidden', logged); });
    $('#resContent').classList.toggle('hidden', !logged);
    $('#novContent').classList.toggle('hidden', !logged);
    $('#puestoForm').classList.toggle('hidden', !logged || (myStationDoc && !window.__spotEditing));
    $('#adminCard').classList.toggle('hidden', !isAdmin());
    applyAdminSettingsView(logged);
    loadAccesoUI();
    renderGate();
  }
  /* El administrador no vive en la app como vecino: no tiene puesto, no cobra
     energía y no arma recibos. Le dejamos solo lo suyo. */
  function applyAdminSettingsView(logged) {
    const soloAdmin = effectiveMode() === 'admin';
    $('#roleCard').classList.toggle('hidden', soloAdmin);
    $('#profileCard').classList.toggle('hidden', soloAdmin || !logged);
    ['#notifCard', '#priceCard', '#receiptCard'].forEach((s) => { const el = $(s); if (el) el.classList.toggle('hidden', soloAdmin); });
    const veh = $('#vehBlock'); if (veh) veh.classList.toggle('hidden', soloAdmin);
    const note = $('#prefsSyncNote');
    if (note) {
      note.textContent = soloAdmin
        ? 'El color acompaña tu cuenta de administración en cualquier dispositivo.'
        : (logged ? 'Tu vehículo y tus colores quedan guardados en tu cuenta: los verás igual en cualquier celular.'
                  : 'Inicia sesión para que tu vehículo y tus colores te sigan a cualquier dispositivo.');
    }
    syncHeroCar();
  }
  function startWatchers() {
    stopWatchers(['bk', 'rq', 'ch', 'prof', 'allbk', 'allst', 'allses']);
    if (!VB || !user) { myBookings = []; myRequests = []; myChats = []; myProfile = null; allBookings = []; allStations = []; allUsers = []; allSessions = []; prefsLoaded = false; refreshAll(); return; }
    unsubs.prof = VB.watchMyProfile((p) => { const was = isAdmin(); myProfile = p; onProfileUpdate(was); });
    unsubs.bk = VB.watchMyBookings((l) => { myBookings = l; onBookingsUpdate(); });
    unsubs.rq = VB.watchRequests((l) => { const prev = myRequests; myRequests = l; onRequestsUpdate(prev); });
    unsubs.ch = VB.watchChats((l) => { const prev = myChats; myChats = l; onChatsUpdate(prev); });
    VB.myStation().then((st) => { myStationDoc = st; if (st) loadAvailabilityUI(st); if (currentView === 'puesto') renderPuesto(); if (currentView === 'agenda') renderAgenda(); }).catch(() => {});
  }
  function startAdminWatchers() {
    if (unsubs.allbk) return;
    unsubs.allbk = VB.watchAllBookings((l) => { const prev = allBookings; allBookings = l; onAllBookingsUpdate(prev); }, () => {});
    unsubs.allst = VB.watchConjuntoStations(CONJUNTO, (l) => { allStations = l; if (currentView === 'panel') renderPanel(); }, () => {});
    unsubs.allses = VB.watchAllSessions((l) => { allSessions = l; if (currentView === 'panel') renderPanel(); }, () => {});
  }
  function onProfileUpdate(wasAdmin) {
    const nowAdmin = isAdmin();
    // El nombre elegido manda en todo lo que se escriba de aquí en adelante.
    if (VB && VB.setDisplayName) VB.setDisplayName(myProfile && myProfile.name);
    syncPrefsOnLogin();
    if (currentView === 'settings') { renderAuthUI(); loadProfileUI(); loadAdminSettingsUI(); }
    loadAccesoUI(); renderGate();
    if (nowAdmin && !wasAdmin) { startAdminWatchers(); refreshMode({ keepView: true }); }
    else if (!nowAdmin && wasAdmin) { stopWatchers(['allbk', 'allst', 'allses']); allBookings = []; allStations = []; allSessions = []; refreshMode({ keepView: true }); }
    else if (nowAdmin) { if (currentView === 'panel') renderPanel(); if (currentView === 'usuarios') renderUsers(); }
  }
  function onAllBookingsUpdate(prev) {
    if (prev && prev.length) {
      const prevIds = new Set(prev.map((x) => x.id));
      allBookings.filter((b) => !prevIds.has(b.id)).slice(0, 3).forEach((b) => {
        notify('Nueva reserva en el conjunto', (b.driverName || 'Un vecino') + ' · ' + (b.stationName || 'un puesto'));
      });
    }
    if (currentView === 'panel') renderPanel();
  }
  function stopWatchers(keys) { keys.forEach((k) => { if (unsubs[k]) { try { unsubs[k](); } catch (e) {} delete unsubs[k]; } }); }
  function refreshAll() {
    if (currentView === 'reservas') renderReservas();
    if (currentView === 'novedades') renderNovedades();
    if (currentView === 'agenda') renderAgenda();
    if (currentView === 'chats') renderChatList();
    if (currentView === 'panel') renderPanel();
    if (currentView === 'usuarios') renderUsers();
    updateDots();
  }
  function onBookingsUpdate() { if (currentView === 'reservas') renderReservas(); updateDots(); }
  function onRequestsUpdate(prev) {
    const prevIds = new Set((prev || []).map((x) => x.id));
    myRequests.filter((r) => r.estado === 'pendiente' && !prevIds.has(r.id) && !seen.reqs.includes(r.id)).forEach((r) => {
      notify('Nueva solicitud de reserva', (r.driverName || 'Un vecino') + ' quiere reservar tu puesto');
    });
    if (currentView === 'novedades') renderNovedades();
    if (currentView === 'agenda') renderAgenda();
    if (currentView === 'analisis') renderBookingLink();
    updateDots();
  }
  function onChatsUpdate(prev) {
    const uidv = VB && VB.uid();
    myChats.forEach((c) => {
      const p = (prev || []).find((x) => x.id === c.id);
      const changed = !p || (c.lastAt && (!p.lastAt || c.lastAt.seconds !== p.lastAt.seconds));
      if (changed && c.lastFrom && c.lastFrom !== uidv && c.id !== (chatCtx && chatCtx.chatId)) {
        notify('Nuevo mensaje', (c.lastMsg || 'Te escribieron') + ' — ' + (c.stationName || ''));
      }
    });
    if (currentView === 'chats') renderChatList();
    if (currentView === 'novedades') renderNovedades();
    updateDots();
  }
  function updateDots() {
    const pend = myRequests.filter((r) => r.estado === 'pendiente').length;
    $('#dotNov').classList.toggle('hidden', !pend);
    const news = myBookings.some((b) => (b.estado === 'confirmada' || b.estado === 'rechazada') && !seen.reqs.includes('b_' + b.id + '_' + b.estado));
    $('#dotReservas').classList.toggle('hidden', !news);
    const uidv = VB && VB.uid();
    const unread = myChats.some((c) => c.lastFrom && c.lastFrom !== uidv && tsDate(c.lastAt).getTime() > (seen.msgs[c.id] || 0));
    $('#dotChats').classList.toggle('hidden', !unread);
  }
  function markChatsSeen() { myChats.forEach((c) => { seen.msgs[c.id] = Date.now(); }); persistSeen(); }

  /* =========================================================
     Notificaciones
     ========================================================= */
  function notify(title, body) {
    toast('🔔 ' + title);
    if (navigator.vibrate) { try { navigator.vibrate(24); } catch (e) {} }
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const opts = { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png', tag: 'voltio-' + Date.now(), vibrate: [30, 20, 30] };
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          navigator.serviceWorker.ready.then((reg) => reg.showNotification(title, opts)).catch(() => { try { new Notification(title, opts); } catch (e) {} });
        } else { new Notification(title, opts); }
      }
    } catch (e) {}
  }
  function requestNotifPermission() {
    if (!('Notification' in window)) { toast('Tu navegador no soporta notificaciones', 'error'); return Promise.resolve('unsupported'); }
    return Notification.requestPermission().then((p) => {
      if (p === 'granted') { toast('Notificaciones activadas 🔔'); notify('Voltio MontReal', 'Te avisaremos de reservas, confirmaciones y mensajes.'); setupPush(); }
      else if (p === 'denied') toast('Notificaciones bloqueadas en el navegador', 'error');
      refreshNotifBanner(); updateNotifState();
      return p;
    }).catch(() => 'error');
  }
  /* Registra el dispositivo para recibir avisos con la app cerrada.
     Sin clave VAPID en firebase-config.js esto no hace nada y los avisos
     siguen llegando solo con la app abierta. */
  let pushToken = null;
  function setupPush() {
    if (!VB || !user || pushToken) return;
    if (!VB.pushAvailable || !VB.pushAvailable()) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    VB.registerPush().then((t) => { if (t) { pushToken = t; updateNotifState(); } }).catch(() => {});
  }
  function updateNotifState() {
    const el = $('#notifState'); if (!el) return;
    const sup = 'Notification' in window;
    const st = sup ? Notification.permission : 'unsupported';
    const map = { granted: '✅ Activadas', denied: '🚫 Bloqueadas (actívalas en los ajustes del navegador)', default: 'Aún no activadas', unsupported: 'No disponibles en este navegador' };
    const cerrada = (VB && VB.pushAvailable && VB.pushAvailable())
      ? (pushToken ? ' · también con la app cerrada 📲' : '')
      : ' · solo con la app abierta';
    el.textContent = (map[st] || '') + (st === 'granted' ? cerrada : '');
    const btn = $('#notifEnable2'); if (btn) btn.classList.toggle('hidden', st === 'granted' || st === 'unsupported');
  }
  function refreshNotifBanner() {
    const banner = $('#notifBanner');
    if (!banner) return;
    const supported = 'Notification' in window;
    banner.classList.toggle('hidden', !supported || Notification.permission === 'granted');
    if (supported && Notification.permission === 'denied') {
      banner.querySelector('span').textContent = 'Las notificaciones están bloqueadas en el navegador. Actívalas desde los ajustes del sitio.';
      $('#notifEnable').classList.add('hidden');
    }
  }

  /* =========================================================
     Estaciones del conjunto
     ========================================================= */
  const conjuntoStations = () => stations.filter((s) => (s.conjunto || 'montreal') === CONJUNTO && s.visible !== false);
  const ratingAvg = (s) => (s.ratingCount ? s.ratingSum / s.ratingCount : 0);

  function isOpenNow(sp) {
    const now = new Date(); const dias = sp.dias || [1, 1, 1, 1, 1, 1, 1];
    if (!dias[now.getDay()]) return false;
    const cur = now.getHours() * 60 + now.getMinutes();
    return cur >= hToMin(sp.desde) && cur <= hToMin(sp.hasta);
  }
  function bandRange(b) { return b === 'm' ? [6, 12] : b === 't' ? [12, 18] : b === 'n' ? [18, 24] : [0, 24]; }
  function targetWeekdays(f) {
    if (f.day === 'hoy') return [new Date().getDay()];
    if (f.day === 'man') return [addDays(new Date(), 1).getDay()];
    if (f.day === 'pick' && f.date) return [parseYmd(f.date).getDay()];
    return null; // any
  }
  function availabilityMatch(sp, f) {
    if (f.day === 'any' && f.band === 'any') return true;
    const dias = sp.dias || [1, 1, 1, 1, 1, 1, 1];
    const [bs, be] = bandRange(f.band);
    const winS = hToMin(sp.desde) / 60, winE = hToMin(sp.hasta) / 60;
    const overlaps = (wd) => dias[wd] && winS < be && winE > bs;
    const days = targetWeekdays(f);
    if (!days) { for (let wd = 0; wd < 7; wd++) if (overlaps(wd)) return true; return false; }
    return days.some(overlaps);
  }
  function evalStation(sp, f) {
    const miss = [];
    if (f.port !== 'todos' && sp.puerto !== f.port) miss.push('Puerto');
    if (f.minPow > 0 && (sp.pow || 0) < f.minPow) miss.push('Potencia');
    if (f.size !== 'todos' && sizeRank(sp.tamano) < sizeRank(f.size)) miss.push('Tamaño');
    if (!availabilityMatch(sp, f)) miss.push('Disponibilidad');
    return miss;
  }
  function idealSort(a, b) {
    const oa = isOpenNow(a), ob = isOpenNow(b);
    if (oa !== ob) return oa ? -1 : 1;
    const ra = ratingAvg(a), rb = ratingAvg(b);
    if (Math.abs(rb - ra) > 0.05) return rb - ra;
    return (a.precio || 0) - (b.precio || 0);
  }

  function runSearch() {
    const list = conjuntoStations();
    const evaluated = list.map((sp) => ({ sp, miss: evalStation(sp, filters) }));
    const perfect = evaluated.filter((e) => e.miss.length === 0).map((e) => e.sp).sort(idealSort);
    const head = $('#resultsHead'), ul = $('#resultList'), empty = $('#resultEmpty');
    const esc = vaEscalonada(ul);
    ul.innerHTML = ''; empty.classList.add('hidden');

    if (!list.length) {
      head.innerHTML = '';
      empty.classList.remove('hidden');
      empty.innerHTML = '<div class="empty-icon">🔌</div><p>Aún no hay puestos publicados en MontReal.</p><span>Sé el primero: publica el tuyo desde “Ofrezco mi cargador”.</span>';
      return;
    }
    if (perfect.length) {
      head.innerHTML = `<span class="rh-count">${perfect.length} ${perfect.length === 1 ? 'puesto ideal' : 'puestos ideales'} para ti</span>`;
      perfect.forEach((sp, i) => { const c = spotCard(sp, []); escalonar(c, i, esc); ul.appendChild(c); });
      return;
    }
    // Sin coincidencia exacta → recomendaciones ordenadas por menos diferencias
    const near = evaluated.slice().sort((a, b) => a.miss.length - b.miss.length || idealSort(a.sp, b.sp));
    head.innerHTML = `<div class="rh-none">No encontramos un puesto que cumpla <b>todo</b> lo que pediste.<br/>Estas opciones son las más cercanas — en <span class="miss-red">rojo</span> lo que cambia:</div>`;
    near.forEach((e, i) => { const c = spotCard(e.sp, e.miss); escalonar(c, i, esc); ul.appendChild(c); });
  }

  function availText(sp) {
    const dias = sp.dias || [1, 1, 1, 1, 1, 1, 1];
    const d = dias.every(Boolean) ? 'Todos los días' : dias.map((v, i) => v ? DIAS[i] : null).filter(Boolean).join(' ');
    return d + ' · ' + (sp.desde || '00:00') + '–' + (sp.hasta || '23:59');
  }
  function spotCard(sp, miss) {
    const open = isOpenNow(sp), avg = ratingAvg(sp), mine = user && sp.ownerUid === user.uid;
    const li = document.createElement('li');
    li.className = 'spot-card';
    const missBadge = (k) => miss.includes(k) ? ' miss' : '';
    li.innerHTML = `
      <div class="sc-top">
        <div>
          <div class="sc-name">${escapeHtml(sp.nombre)}</div>
          <div class="sc-badges">
            <span class="sc-badge b-torre">🏢 Torre ${escapeHtml(sp.torre || '—')}</span>
            <span class="sc-badge ${open ? 'b-ok' : 'b-off'}">${open ? '● Disponible ahora' : '○ Cerrado ahora'}</span>
            ${sp.ownerVerificado ? '<span class="sc-badge b-ver">✓ Vecino verificado</span>' : ''}
            ${mine ? '<span class="sc-badge b-mine">★ Tu puesto</span>' : ''}
          </div>
        </div>
        <div class="sc-price"><b>${fmtCOP(sp.precio || 0)}</b><small>/ kWh</small></div>
      </div>
      <div class="sc-meta">
        <span class="mtag${missBadge('Puerto')}">🔌 ${escapeHtml(sp.puerto || '—')}</span>
        <span class="mtag${missBadge('Potencia')}">⚡ ${(sp.pow || 0).toLocaleString('es-CO')} kW</span>
        <span class="mtag${missBadge('Tamaño')}">📐 ${escapeHtml(sp.tamano || '—')}</span>
        <span class="sc-rating">★ ${avg ? avg.toLocaleString('es-CO', { maximumFractionDigits: 1 }) : '—'} <small>(${sp.ratingCount || 0})</small></span>
      </div>
      <div class="sc-avail${miss.includes('Disponibilidad') ? ' miss' : ''}">🗓️ ${availText(sp)}</div>
      ${miss.length ? `<div class="miss-note">Cambia en: ${miss.map((m) => '<b>' + m + '</b>').join(', ')}</div>` : ''}
      ${mine ? '<div class="sc-mine-note">Así ven tu puesto los vecinos 👀</div>' : `
      <div class="sc-actions">
        <button class="btn-ok sc-agendar" type="button">Agendar</button>
        <button class="btn-ghost sc-chat" type="button">💬 Chatear</button>
      </div>`}`;
    if (!mine) {
      li.querySelector('.sc-agendar').addEventListener('click', (e) => { e.stopPropagation(); openBookingSheet(sp); });
      li.querySelector('.sc-chat').addEventListener('click', (e) => { e.stopPropagation(); startChatWith(sp); });
    }
    return li;
  }

  /* =========================================================
     Horas apartadas
     Una reserva bloquea sus cuartos de hora menos el último medio: así el
     siguiente vecino puede llegar mientras el anterior desconecta (hasta 15
     minutos de relevo), pero un cruce mayor no pasa.
     ========================================================= */
  const slotCache = new Map();
  async function slotsDe(stationId, fecha) {
    if (!VB || !stationId || !fecha) return [];
    const k = VB.sfKey(stationId, fecha);
    if (slotCache.has(k)) return slotCache.get(k);
    const list = await VB.busySlots(stationId, fecha).catch(() => []);
    slotCache.set(k, list);
    setTimeout(() => slotCache.delete(k), 30000); // que no se quede viejo
    return list;
  }
  async function horasChocan(stationId, fecha, from, to) {
    const ocupados = await slotsDe(stationId, fecha);
    if (!ocupados.length) return false;
    const mios = new Set(VB.slotKeys(fecha, from, to));
    // Las horas que uno mismo ya tenía apartadas no cuentan como choque ajeno.
    return ocupados.some((s) => mios.has(s.hhmm) && s.driverUid !== (VB.uid() || ''));
  }
  const hhmmLabel = (h) => h.slice(0, 2) + ':' + h.slice(2);
  /* Pinta bajo el formulario las horas que ya están tomadas ese día. */
  async function pintarOcupadas(sp) {
    const box = $('#bkBusy');
    if (!box) return;
    const fecha = $('#bkFecha') && $('#bkFecha').value;
    if (!fecha) { box.classList.add('hidden'); return; }
    slotCache.delete(VB.sfKey(sp.id, fecha));
    const ocupados = await slotsDe(sp.id, fecha);
    const ajenos = ocupados.filter((s) => s.driverUid !== (VB.uid() || ''));
    if (!ajenos.length) {
      box.className = 'bk-busy bk-busy-free';
      box.innerHTML = '✅ Ese día el puesto está libre a cualquier hora del horario del anfitrión.';
      box.classList.remove('hidden');
      return;
    }
    // Agrupamos los cuartos seguidos en rangos legibles.
    const mins = ajenos.map((s) => +s.hhmm.slice(0, 2) * 60 + +s.hhmm.slice(2)).sort((a, b) => a - b);
    const rangos = [];
    let ini = mins[0], prev = mins[0];
    for (let i = 1; i <= mins.length; i++) {
      if (i === mins.length || mins[i] > prev + 15) { rangos.push([ini, prev + 30]); ini = mins[i]; }
      prev = mins[i];
    }
    const fmt = (m) => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    box.className = 'bk-busy';
    box.innerHTML = '🚫 Ya apartado ese día: ' + rangos.map((r) => `<b>${fmt(r[0])}–${fmt(r[1])}</b>`).join(', ') +
      '<small>Puedes empezar justo cuando otro termina: dejamos 15 minutos de relevo.</small>';
    box.classList.remove('hidden');
  }
  /* Al cancelar o declinar, la hora vuelve a quedar libre para el resto. */
  async function liberarHoras(bk) {
    if (!bk || !VB) return;
    try { await VB.releaseSlots(bk); slotCache.delete(VB.sfKey(bk.stationId, bk.fecha)); } catch (e) {}
  }

  /* =========================================================
     Código del conjunto
     Sin él la app se puede mirar, pero no reservar ni publicar.
     ========================================================= */
  const esVecino = () => isAdmin() || !!(myProfile && myProfile.verificado === true);

  /* El nombre con el que los vecinos te ven en toda la app. Arranca con el del
     correo o el de Google, pero manda el que la persona haya elegido. */
  function nombreVisible() {
    if (myProfile && myProfile.name) return myProfile.name;
    return (VB && VB.userName()) || '';
  }
  async function guardarNombre() {
    const inp = $('#acNombre'), val = (inp.value || '').trim();
    if (!val) { toast('Escribe cómo quieres que te vean', 'error'); inp.focus(); return; }
    if (val.length < 2) { toast('Ese nombre es muy corto', 'error'); return; }
    try {
      $('#acNombreSave').disabled = true;
      await VB.saveProfile({ name: val });
      successPop();
      toast('Listo: tus vecinos te verán como ' + val.split(' ')[0]);
    } catch (e) { toast('No se pudo guardar el nombre', 'error'); }
    finally { $('#acNombreSave').disabled = false; }
  }
  function puedeActuar(accion) {
    if (!user) { needLogin(); return false; }
    if (esVecino()) return true;
    toast('Para ' + (accion || 'usar esto') + ' necesitas el código del conjunto', 'error');
    goView('settings');
    setTimeout(() => { const el = $('#acCodigo'); if (el) el.focus(); }, 400);
    return false;
  }
  function renderGate() {
    const pendiente = !!user && !esVecino();
    ['#gateBuscar', '#gateNov'].forEach((s) => {
      const el = $(s); if (!el) return;
      el.classList.toggle('hidden', !pendiente);
      if (pendiente) {
        el.innerHTML = '<div><b>🔐 Te falta el código del conjunto</b><span>Puedes mirar la app, pero para reservar o publicar tu puesto necesitas el código que reparte la administración.</span></div>' +
          '<button class="btn-secondary btn-sm" type="button" data-gate="1">Escribir código</button>';
        const b = el.querySelector('[data-gate]');
        if (b) b.addEventListener('click', () => { goView('settings'); setTimeout(() => { const i = $('#acCodigo'); if (i) i.focus(); }, 400); });
      }
    });
  }
  function loadAccesoUI() {
    const card = $('#accesoCard'); if (!card) return;
    const soloAdmin = effectiveMode() === 'admin';
    card.classList.toggle('hidden', !user || soloAdmin);
    const ok = esVecino();
    $('#accesoBadge').classList.toggle('hidden', !ok);
    $('#accesoOk').classList.toggle('hidden', !ok);
    $('#accesoPendiente').classList.toggle('hidden', ok);
  }
  async function enviarCodigo() {
    const inp = $('#acCodigo'), err = $('#acError');
    err.classList.add('hidden');
    const val = (inp.value || '').trim();
    if (!val) { err.textContent = 'Escribe el código.'; err.classList.remove('hidden'); return; }
    try {
      $('#acSave').disabled = true;
      await VB.verificarCodigo(val);
      successPop();
      toast('¡Listo! Ya eres vecino verificado ✓');
      inp.value = '';
    } catch (e) {
      err.textContent = e.message;
      err.classList.remove('hidden');
    } finally { $('#acSave').disabled = false; }
  }

  /* =========================================================
     Recordatorio del día
     ========================================================= */
  function renderTodayBanner() {
    const hoy = ymd(new Date());
    const pinta = (sel, lista, texto) => {
      const el = $(sel); if (!el) return;
      const hoyList = lista.filter((b) => b.fecha === hoy && (b.estado === 'confirmada' || b.estado === 'completada'));
      el.classList.toggle('hidden', !hoyList.length);
      if (!hoyList.length) return;
      hoyList.sort((a, b) => hToMin(a.from) - hToMin(b.from));
      el.innerHTML = '<span class="today-ico">📅</span><div>' + texto(hoyList) + '</div>';
    };
    pinta('#todayRes', myBookings, (l) => {
      const b = l[0];
      return '<b>Hoy cargas a las ' + escapeHtml(b.from) + '</b><span>' + escapeHtml(b.stationName || 'Tu puesto') +
        ' · Torre ' + escapeHtml(b.torre || '—') + ' · puesto ' + escapeHtml(b.numeroParqueadero || 'por coordinar') +
        (l.length > 1 ? ' · y ' + (l.length - 1) + ' más hoy' : '') + '</span>';
    });
    pinta('#todayNov', myRequests, (l) => {
      const b = l[0];
      return '<b>Hoy recibes a ' + escapeHtml((b.driverName || 'un vecino').split(' ')[0]) + ' a las ' + escapeHtml(b.from) + '</b>' +
        '<span>' + (l.length > 1 ? l.length + ' cargas agendadas para hoy en tu puesto' : 'Ten a mano la lectura del contador antes de conectar') + '</span>';
    });
  }

  /* =========================================================
     Agendar (booking sheet)
     ========================================================= */
  /* ---------- Cuánta energía va a caber en la reserva ----------
     Por defecto lo calculamos: potencia del cargador × horas reservadas, menos
     una hora de margen porque nadie llega y conecta al minuto exacto (ni se
     queda hasta el último). Nunca bajamos de la mitad del tiempo reservado,
     para que una reserva corta no estime cero.
     El vecino puede escribir su propio estimado si sabe cuánto necesita. */
  function horasUtiles(from, to) {
    const dur = (hToMin(to) - hToMin(from)) / 60;
    if (dur <= 0) return 0;
    return Math.max(dur * 0.5, dur - 1);
  }
  // Ningún carro del conjunto recibe más que esto en una sola carga: sin este
  // techo, una reserva de 12 h estimaría 81 kWh y asustaría al vecino con un
  // número que jamás va a pagar.
  const KWH_TECHO = 60;
  function kwhCalculado(sp, from, to) {
    const h = horasUtiles(from, to);
    if (!h) return 0;
    const bruto = (sp.pow || 7.4) * h;
    return Math.round(Math.min(bruto, KWH_TECHO) * 10) / 10;
  }

  let bkModo = 'auto';
  /* Recalcula el estimado y explica de dónde sale, para que nadie se lleve una
     sorpresa con el cobro. */
  function refrescarEstimado(sp) {
    if (!$('#bkEst')) return;
    const from = $('#bkFrom').value, to = $('#bkTo').value;
    const kwh = kwhEstimado(sp);
    $('#bkEst').textContent = fmtCOP(kwh * (sp.precio || 0));
    if (bkModo === 'auto') {
      const h = horasUtiles(from, to);
      const dur = (hToMin(to) - hToMin(from)) / 60;
      $('#bkAutoKwh').textContent = h ? fmtKwh(kwh) : '—';
      const topado = h && (sp.pow || 7.4) * h > KWH_TECHO;
      $('#bkAutoNota').innerHTML = !h
        ? 'Elige un horario válido para poder calcularlo.'
        : topado
          ? `Con <b>${fmtNum(dur, 1)} h</b> reservadas a <b>${fmtNum(sp.pow || 7.4, 1)} kW</b> te sobra tiempo: contamos <b>${KWH_TECHO} kWh</b>, que es más de lo que cabe en la batería de un carro normal. Si sabes cuánto necesitas, ponlo tú.`
          : `Reservas <b>${fmtNum(dur, 1)} h</b> y el cargador da <b>${fmtNum(sp.pow || 7.4, 1)} kW</b>. Contamos <b>${fmtNum(h, 1)} h</b> de carga efectiva porque siempre se pierde un rato entre que llegas, conectas y te vas.`;
    }
    guardarBorrador(sp.id);
  }
  function kwhEstimado(sp) {
    if (bkModo === 'manual') return Math.max(0, parseNum($('#bkKwh').value));
    return kwhCalculado(sp, $('#bkFrom').value, $('#bkTo').value);
  }

  /* ---------- Borrador de la reserva ----------
     Si el vecino se sale a buscar el código del conjunto, cierra la app o se le
     acaba la batería, al volver encuentra lo que ya había puesto. */
  function guardarBorrador(stationId) {
    if (!$('#bkFecha')) return;
    const b = {
      stationId, fecha: $('#bkFecha').value, from: $('#bkFrom').value, to: $('#bkTo').value,
      modo: bkModo, kwh: $('#bkKwh') ? $('#bkKwh').value : '', at: Date.now()
    };
    try { localStorage.setItem(LS_BORRADOR, JSON.stringify(b)); } catch (e) {}
  }
  function leerBorrador(stationId) {
    try {
      const b = JSON.parse(localStorage.getItem(LS_BORRADOR));
      // Solo sirve para el mismo puesto y si es de las últimas 24 horas.
      if (b && b.stationId === stationId && Date.now() - (b.at || 0) < 864e5) {
        if (!b.fecha || b.fecha >= ymd(new Date())) return b;
      }
    } catch (e) {}
    return {};
  }
  const borrarBorrador = () => { try { localStorage.removeItem(LS_BORRADOR); } catch (e) {} };

  function openBookingSheet(sp) {
    if (!user) { needLogin(); return; }
    sheetStation = sp;
    const bd = leerBorrador(sp.id);
    const defDate = bd.fecha || (filters.day === 'hoy' ? ymd(new Date()) : filters.day === 'man' ? ymd(addDays(new Date(), 1)) : (filters.day === 'pick' && filters.date) ? filters.date : ymd(new Date()));
    const [bs] = bandRange(filters.band);
    const defFrom = bd.from || (filters.band !== 'any' ? String(bs).padStart(2, '0') + ':00' : (sp.desde || '08:00'));
    const defTo = bd.to || sp.hasta || '20:00';
    const c = $('#sheetContent');
    c.innerHTML = `
      <div class="sh-head">
        <div><div class="sh-name">${escapeHtml(sp.nombre)}</div><div class="sh-host">de ${escapeHtml(sp.ownerName || 'Anfitrión')} · Torre ${escapeHtml(sp.torre || '—')}</div></div>
        <div class="sc-price"><b>${fmtCOP(sp.precio || 0)}</b><small>/ kWh</small></div>
      </div>
      <div class="sh-specs">
        <div class="sh-spec"><b>${escapeHtml(sp.puerto || '—')}</b><small>puerto</small></div>
        <div class="sh-spec"><b>${(sp.pow || 0).toLocaleString('es-CO')} kW</b><small>potencia</small></div>
        <div class="sh-spec"><b>${escapeHtml(sp.tamano || '—')}</b><small>tamaño</small></div>
        <div class="sh-spec"><b>~${Math.round((sp.pow || 0) * (settings.kmPerKwh || 6))}</b><small>km/hora</small></div>
      </div>
      <div class="sh-avail">🗓️ Disponible: ${availText(sp)}</div>
      <div class="sh-pay">💳 Pagas con: ${[sp.breb ? '<b>Bre-B</b>' : '', sp.wompi ? '<b>tarjeta, PSE o Nequi</b>' : ''].filter(Boolean).join(' o ') || '<b>lo que acuerdes por el chat</b>'}</div>
      ${(sp.fotos && sp.fotos.length) ? `<div class="foto-strip">${sp.fotos.map((f, i) => `<img src="${escapeHtml(f)}" alt="Foto ${i + 1} de ${escapeHtml(sp.nombre)}" loading="lazy"/>`).join('')}</div>` : ''}
      ${sp.condiciones ? `<div class="bk-pay" style="margin:0 0 14px">📋 ${escapeHtml(sp.condiciones)}</div>` : ''}
      <h3 class="sub-h">Agenda tu carga</h3>
      <div class="field"><label>Fecha</label><div class="input-wrap"><input id="bkFecha" type="date" min="${ymd(new Date())}" value="${defDate}"/></div></div>
      <div class="grid-2" style="margin-top:10px">
        <div class="field"><label>Desde</label><div class="input-wrap"><input id="bkFrom" type="time" value="${defFrom}"/></div></div>
        <div class="field"><label>Hasta</label><div class="input-wrap"><input id="bkTo" type="time" value="${defTo}"/></div></div>
      </div>
      <div class="bk-busy hidden" id="bkBusy"></div>

      <h3 class="sub-h">¿Cuánta energía vas a cargar?</h3>
      <div class="segmented" id="bkModo">
        <button class="seg-btn ${bd.modo === 'manual' ? '' : 'is-active'}" data-kmodo="auto" type="button">Calcúlalo por mí</button>
        <button class="seg-btn ${bd.modo === 'manual' ? 'is-active' : ''}" data-kmodo="manual" type="button">Yo sé cuánto</button>
      </div>
      <div id="bkAutoBox" class="kwh-box${bd.modo === 'manual' ? ' hidden' : ''}">
        <div class="kwh-auto"><b id="bkAutoKwh">—</b><span>kWh estimados</span></div>
        <p class="hint" id="bkAutoNota" style="margin-top:8px"></p>
      </div>
      <div id="bkManualBox" class="field${bd.modo === 'manual' ? '' : ' hidden'}" style="margin-top:12px">
        <label for="bkKwh">Energía que piensas cargar</label>
        <div class="input-wrap input-wrap--big"><input id="bkKwh" inputmode="decimal" value="${bd.kwh || 20}" autocomplete="off"/><span class="unit">kWh</span></div>
        <p class="hint">La batería de un carro pequeño llena son unos 40 kWh; una SUV, unos 75.</p>
      </div>

      <div class="sh-est"><span>Costo estimado</span><b id="bkEst">${fmtCOP(0)}</b></div>
      <p class="hint bk-est-nota">Es un cálculo aproximado para que sepas a qué atenerte. <b>El cobro real lo hace el anfitrión con la lectura del contador</b> al terminar la carga.</p>
      <button id="bkSend" class="btn-primary" type="button" style="margin-top:14px"><span class="btn-glow"></span>Enviar solicitud de reserva</button>
      <button id="bkChat" class="btn-ghost btn-block" type="button" style="margin-top:10px">💬 Prefiero preguntarle primero</button>
      <p class="hint" style="text-align:center;margin-top:8px">${sp.demo ? 'Puesto de ejemplo: la confirmación es simulada.' : 'El anfitrión recibirá tu solicitud al instante y podrá aceptarla o declinarla.'}</p>`;
    openSheet('#spotSheet');
    bkModo = bd.modo === 'manual' ? 'manual' : 'auto';
    refrescarEstimado(sp);

    $$('#bkModo .seg-btn').forEach((b) => b.addEventListener('click', () => {
      bkModo = b.dataset.kmodo;
      $$('#bkModo .seg-btn').forEach((x) => x.classList.toggle('is-active', x === b));
      $('#bkAutoBox').classList.toggle('hidden', bkModo !== 'auto');
      $('#bkManualBox').classList.toggle('hidden', bkModo !== 'manual');
      refrescarEstimado(sp);
      if (bkModo === 'manual') setTimeout(() => $('#bkKwh').focus(), 60);
    }));
    $('#bkKwh').addEventListener('input', () => refrescarEstimado(sp));
    ['#bkFrom', '#bkTo'].forEach((s) => $(s).addEventListener('change', () => refrescarEstimado(sp)));
    $('#bkSend').addEventListener('click', () => submitBooking(sp));
    $('#bkChat').addEventListener('click', () => startChatWith(sp));
    $('#bkFecha').addEventListener('change', () => { pintarOcupadas(sp); guardarBorrador(sp.id); });
    pintarOcupadas(sp);
  }
  async function submitBooking(sp) {
    const fecha = $('#bkFecha').value, from = $('#bkFrom').value, to = $('#bkTo').value;
    const kwhEst = Math.max(1, kwhEstimado(sp) || 20);
    if (!fecha || !from || !to) { toast('Completa fecha y horas', 'error'); return; }
    if (hToMin(to) <= hToMin(from)) { toast('La hora final debe ser mayor', 'error'); return; }
    const wd = parseYmd(fecha).getDay(), dias = sp.dias || [1, 1, 1, 1, 1, 1, 1];
    if (!dias[wd]) { toast('Ese día el puesto no está disponible', 'error'); return; }
    if (hToMin(from) < hToMin(sp.desde) || hToMin(to) > hToMin(sp.hasta)) { toast('Elige un horario entre ' + sp.desde + ' y ' + sp.hasta, 'error'); return; }
    if (!puedeActuar('reservar')) return;
    // Aviso temprano y amable; el bloqueo de verdad lo hace Firestore más abajo.
    const choque = await horasChocan(sp.id, fecha, from, to);
    if (choque) { toast('Esa hora ya está apartada por otro vecino. Mira las horas libres arriba.', 'error'); await pintarOcupadas(sp); return; }
    const common = !!(sp.common || sp.autoConfirm); // puestos de la administración: sin aprobación
    try {
      $('#bkSend').disabled = true;
      const bk = {
        stationId: sp.id, stationName: sp.nombre, ownerUid: sp.ownerUid, ownerName: sp.ownerName || 'Anfitrión',
        torre: sp.torre || '', puerto: sp.puerto || '', breb: sp.breb || '', titular: sp.titular || '', banco: sp.banco || '', wompi: !!sp.wompi,
        precio: sp.precio || 0, fecha, from, to, kwhEst, total: kwhEst * (sp.precio || 0), demo: !!sp.demo, common
      };
      if (common) { bk.estado = 'confirmada'; bk.numeroParqueadero = sp.numeroParqueadero || ''; }
      // Primero se apartan las horas: si otro vecino ganó la carrera, el lote
      // falla entero y no llegamos a crear una reserva imposible de cumplir.
      try {
        await VB.claimSlots(bk, '');
      } catch (e) {
        $('#bkSend').disabled = false;
        toast('Justo alguien apartó esa hora. Elige otra franja.', 'error');
        await pintarOcupadas(sp);
        return;
      }
      let id;
      try {
        id = await VB.createBooking(bk);
      } catch (e) {
        await VB.releaseSlots(bk); // no dejamos horas bloqueadas sin reserva detrás
        throw e;
      }
      slotCache.delete(VB.sfKey(sp.id, fecha));
      borrarBorrador();
      closeSheet('#spotSheet');
      goView('reservas');
      const fx = parseYmd(fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
      if (common) {
        mostrarAviso('ok', '¡Puesto reservado!', `Ya está apartado para el <b>${escapeHtml(fx)}</b> de <b>${escapeHtml(from)}</b> a <b>${escapeHtml(to)}</b>. Puedes usarlo sin esperar a nadie.`);
        notify('Reserva confirmada', 'Ya puedes usar ' + (sp.nombre || 'el puesto') + '. Paga por Bre-B a la administración.');
      } else {
        mostrarAviso('espera', 'Solicitud enviada', `${escapeHtml((sp.ownerName || 'El anfitrión').split(' ')[0])} ya la recibió. Te avisamos apenas la acepte.<br/><small>${escapeHtml(fx)} · ${escapeHtml(from)}–${escapeHtml(to)}</small>`);
        if (sp.demo) demoAutoConfirm(id, sp);
      }
    } catch (e) {
      $('#bkSend').disabled = false;
      toast(e.message === 'login' ? 'Inicia sesión para reservar' : 'No se pudo crear la reserva', 'error');
    }
  }
  function demoAutoConfirm(id, sp) {
    setTimeout(() => {
      VB.updateBooking(id, { estado: 'confirmada', numeroParqueadero: sp.numeroParqueadero || '' })
        .then(() => notify('Reserva confirmada', (sp.ownerName || 'El anfitrión') + ' aceptó tu reserva'))
        .catch(() => {});
    }, 6000);
  }

  /* =========================================================
     Pagos en línea (Wompi)
     El vecino paga con tarjeta, PSE o Nequi; al volver comprobamos la
     transacción contra Wompi. La confirmación que cuenta la hace la sesión
     del anfitrión, que es quien recibe el dinero.
     ========================================================= */
  const payCfgCache = {};
  async function payConfigOf(stationId) {
    if (!stationId || !VB) return null;
    if (payCfgCache[stationId] !== undefined) return payCfgCache[stationId];
    const cfg = await VB.getPayConfig(stationId).catch(() => null);
    payCfgCache[stationId] = cfg;
    return cfg;
  }
  const aceptaWompi = (bk) => { const st = findStation(bk.stationId); return !!(st ? st.wompi : bk.wompi); };
  const brebDe = (bk) => { const st = findStation(bk.stationId); return bk.breb || (st && st.breb) || ''; };

  async function payWithWompi(bookingId) {
    const bk = myBookings.find((b) => b.id === bookingId);
    if (!bk || !window.VW) return;
    const btn = $('#bookList [data-wompi="' + bookingId + '"]');
    if (btn) { btn.disabled = true; btn.textContent = 'Abriendo el pago…'; }
    try {
      const cfg = await payConfigOf(bk.stationId);
      if (!window.VW.isConfigured(cfg)) throw new Error('El anfitrión aún no terminó de configurar el pago en línea. Usa Bre-B o escríbele por el chat.');
      const total = bk.totalReal || bk.total;
      const ck = await window.VW.buildCheckout({
        bookingId, totalCOP: total, pubKey: cfg.pubKey, integrity: cfg.integrity,
        redirectUrl: location.origin + '/?wpay=' + encodeURIComponent(bookingId),
        email: (user && user.email) || '', fullName: (VB && VB.userName()) || ''
      });
      window.VW.remember({ bookingId, reference: ck.reference, amountInCents: ck.amountInCents, pubKey: cfg.pubKey, stationId: bk.stationId });
      location.href = ck.url;
    } catch (e) {
      if (btn) { btn.disabled = false; btn.innerHTML = '💳 Pagar en línea'; }
      toast(e.message || 'No pudimos abrir el pago', 'error');
    }
  }

  /* Volvimos del banco: Wompi nos deja el id de la transacción en la URL. */
  async function checkWompiReturn() {
    if (!window.VW) return;
    const txId = window.VW.returnedTxId();
    const pend = window.VW.pending();
    if (!txId || !pend) return;
    window.VW.cleanUrl();
    toast('Comprobando tu pago con Wompi…');
    try {
      const tx = await window.VW.getTransaction(txId, pend.pubKey);
      const v = window.VW.verifyAgainst(tx, pend.amountInCents);
      const patch = {
        wompiTxId: txId, wompiRef: tx ? tx.reference : pend.reference,
        wompiStatus: (tx && tx.status) || 'DESCONOCIDO',
        wompiMonto: (tx && tx.amount_in_cents) || pend.amountInCents,
        pagoMetodo: 'wompi'
      };
      if (VB && user) await VB.updateBooking(pend.bookingId, patch).catch(() => {});
      window.VW.forget();
      const tabs = TABS[effectiveMode()] || [];
      if (tabs.includes('reservas')) goView('reservas');
      if (v.ok) { successPop(); toast('¡Pago aprobado! ✅ El anfitrión ya lo verá confirmado'); }
      else toast(v.motivo || 'El pago no quedó aprobado', 'error');
    } catch (e) {
      toast('No pudimos confirmar el pago con Wompi. Revisa tu reserva en un momento.', 'error');
    }
  }

  /* Del lado del anfitrión: cada pago en línea se contrasta con Wompi y, si es
     real, la reserva queda pagada sin que él tenga que revisar nada. */
  let verifyingWompi = false;
  async function autoVerifyWompiPayments() {
    if (verifyingWompi || !VB || !user || !window.VW || !myStationDoc) return;
    const pendientes = myRequests.filter((r) => r.wompiTxId && !r.pagado && r.wompiStatus !== 'DECLINED');
    if (!pendientes.length) return;
    const cfg = await payConfigOf(myStationDoc.id);
    if (!window.VW.isConfigured(cfg)) return;
    verifyingWompi = true;
    try {
      for (const r of pendientes.slice(0, 8)) {
        try {
          const tx = await window.VW.getTransaction(r.wompiTxId, cfg.pubKey);
          const esperado = window.VW.toCents(r.totalReal || r.total);
          const v = window.VW.verifyAgainst(tx, esperado);
          if (v.ok) {
            await VB.markBookingPaid(r.id, true, 'wompi');
            notify('Pago recibido', (r.driverName || 'Un vecino') + ' pagó ' + fmtCOP(r.totalReal || r.total) + ' en línea');
          } else if (tx && tx.status !== r.wompiStatus) {
            await VB.updateBooking(r.id, { wompiStatus: tx.status }).catch(() => {});
          }
        } catch (e) { /* seguimos con las demás */ }
      }
    } finally { verifyingWompi = false; }
  }

  /* ---------- Bloque de pago que ve el vecino en su reserva ---------- */
  function payBlock(bk) {
    if (bk.estado !== 'confirmada' && bk.estado !== 'completada') return '';
    const puesto = `📍 Tu puesto: <span class="bk-key">${escapeHtml(bk.numeroParqueadero || 'coordinar por chat')}</span>`;
    const total = bk.totalReal || bk.total;

    if (bk.pagado) {
      const via = bk.pagoMetodo === 'wompi' ? 'Pago en línea verificado con Wompi' : escapeHtml(bk.ownerName || 'El anfitrión') + ' confirmó que recibió tu pago';
      return `<div class="bk-pay bk-paid">${puesto}<div class="bk-paid-line">✅ ${via} de <b>${fmtCOP(total)}</b>. ¡Todo en orden!</div></div>`;
    }
    if (bk.wompiTxId && bk.wompiStatus === 'APPROVED') {
      return `<div class="bk-pay bk-paid">${puesto}<div class="bk-paid-line">✅ Wompi aprobó tu pago de <b>${fmtCOP(total)}</b>. El anfitrión lo verá confirmado en su app.</div></div>`;
    }

    const breb = brebDe(bk), wompi = aceptaWompi(bk);
    const pendiente = bk.wompiTxId && bk.wompiStatus === 'PENDING'
      ? '<div class="bk-note">⏳ Tu pago está en proceso en el banco. Te avisamos cuando Wompi lo apruebe.</div>' : '';
    const rechazado = bk.wompiTxId && (bk.wompiStatus === 'DECLINED' || bk.wompiStatus === 'ERROR')
      ? '<div class="bk-note bk-note-bad">✋ El último intento de pago no pasó. Puedes reintentar o pagar por Bre-B.</div>' : '';

    const lineaBreb = breb
      ? `<br/>Paga por <b>Bre-B</b> a <span class="bk-key">${escapeHtml(breb)}</span>${bk.banco ? ' · ' + escapeHtml(bk.banco) : ''} · ${escapeHtml(bk.titular || bk.ownerName || '')}`
      : (wompi ? '<br/>Este puesto recibe el pago <b>en línea</b>.' : '<br/>Coordina el pago con el anfitrión por el chat.');

    const acciones = [];
    if (wompi) acciones.push(`<button class="btn-ok btn-sm" data-wompi="${bk.id}">💳 Pagar ${fmtCOP(total)} en línea</button>`);
    if (breb) {
      acciones.push(`<button class="btn-ghost btn-sm" data-copy="${escapeHtml(breb)}">Copiar llave</button>`);
      acciones.push(`<button class="${wompi ? 'btn-ghost' : 'btn-ok'} btn-sm" data-qr="${bk.id}">💳 Bre-B / QR</button>`);
    }
    const nota = wompi && !bk.totalReal
      ? '<div class="bk-note">El monto es el estimado de la reserva. Si prefieres pagar lo exacto, espera a que el anfitrión mida la carga.</div>' : '';

    return `<div class="bk-pay">${puesto}${lineaBreb}${pendiente}${rechazado}${nota}<div class="bk-actions">${acciones.join('')}</div></div>`;
  }

  /* =========================================================
     Reservas del conductor
     ========================================================= */
  const PILL = { pendiente: ['p-pend', 'Por confirmar'], confirmada: ['p-ok', 'Confirmada'], rechazada: ['p-no', 'Declinada'], cancelada: ['p-dim', 'Cancelada'], completada: ['p-dim', 'Completada'] };
  function renderReservas() {
    if (!user) return;
    renderTodayBanner();
    renderCalendar('#calDriver', myBookings, 'driver');
    const ul = $('#bookList'), esc = vaEscalonada(ul); ul.innerHTML = '';
    $('#bookEmpty').classList.toggle('hidden', myBookings.length > 0);
    myBookings.forEach((bk, i) => {
      const [cls, lab] = PILL[bk.estado] || ['p-dim', bk.estado];
      const li = document.createElement('li'); li.className = 'book-card'; escalonar(li, i, esc);
      const fx = parseYmd(bk.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
      li.innerHTML = `
        <div class="bk-top"><div><div class="bk-name">${escapeHtml(bk.stationName)}</div><div class="bk-sub">de ${escapeHtml(bk.ownerName || '')} · Torre ${escapeHtml(bk.torre || '—')}</div></div><span class="bk-pill ${cls}">${lab}</span></div>
        <div class="bk-meta"><span>🗓️ ${fx}</span><span>🕐 ${escapeHtml(bk.from)}–${escapeHtml(bk.to)}</span><span>💰 ${bk.totalReal ? fmtCOP(bk.totalReal) : fmtCOP(bk.total) + ' aprox.'}</span>${bk.kwhReal ? `<span>🔋 ${fmtKwh(bk.kwhReal)} kWh medidos</span>` : ''}</div>
        ${payBlock(bk)}
        ${bk.estado === 'rechazada' && bk.rejectReason ? `<div class="bk-pay p-rej">✋ Motivo: ${escapeHtml(bk.rejectReason)}</div>` : ''}
        <div class="bk-actions">
          <button class="btn-ghost btn-sm" data-chat="${bk.id}">💬 Chat</button>
          ${(bk.estado === 'pendiente' || bk.estado === 'confirmada') ? `<button class="btn-ghost btn-sm btn-danger" data-cancel="${bk.id}">Cancelar</button>` : ''}
          ${(bk.estado === 'confirmada' || bk.estado === 'completada') && !bk.ratedByDriver ? `<button class="btn-ok" data-rate="${bk.id}">⭐ Calificar</button>` : ''}
          ${bk.ratedByDriver ? '<span class="sc-badge b-ok">✓ Calificado</span>' : ''}
        </div>`;
      ul.appendChild(li);
      seen.reqs.push('b_' + bk.id + '_' + bk.estado);
    });
    persistSeen();
    $$('#bookList [data-cancel]').forEach((b) => b.addEventListener('click', () => cancelarReserva(b.dataset.cancel)));
    $$('#bookList [data-copy]').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Llave copiada 📋'); } catch (e) {} }));
    $$('#bookList [data-wompi]').forEach((b) => b.addEventListener('click', () => payWithWompi(b.dataset.wompi)));
    $$('#bookList [data-qr]').forEach((b) => b.addEventListener('click', () => {
      const bk = myBookings.find((x) => x.id === b.dataset.qr); if (!bk) return;
      const st = findStation(bk.stationId);
      openQrView({ stationName: bk.stationName, breb: bk.breb, banco: bk.banco, titular: bk.titular, ownerName: bk.ownerName, qr: (st && st.qr) || bk.qr || '' });
    }));
    $$('#bookList [data-rate]').forEach((b) => b.addEventListener('click', () => { const bk = myBookings.find((x) => x.id === b.dataset.rate); if (bk) openRate({ bookingId: bk.id, stationId: bk.stationId, toName: bk.ownerName, tipo: 'driver-host' }); }));
    $$('#bookList [data-chat]').forEach((b) => b.addEventListener('click', () => { const bk = myBookings.find((x) => x.id === b.dataset.chat); if (bk) startChatWith({ id: bk.stationId, nombre: bk.stationName, ownerUid: bk.ownerUid, ownerName: bk.ownerName, demo: bk.demo }); }));
  }

  /* Cancelar libera la hora: si el vecino ya no va, otro puede tomarla. */
  async function cancelarReserva(id) {
    const bk = myBookings.find((x) => x.id === id);
    if (!bk) return;
    if (bk.estado === 'confirmada' && !confirm('¿Cancelar esta reserva ya confirmada?\n\nLa hora queda libre para otro vecino y le avisamos al anfitrión.')) return;
    if (bk.pagado || bk.wompiTxId) {
      if (!confirm('Ojo: esta reserva ya tiene un pago registrado.\n\nCancélala solo si acordaste la devolución con el anfitrión. ¿Sigo?')) return;
    }
    try {
      await VB.updateBooking(id, { estado: 'cancelada' });
      await liberarHoras(bk);
      toast('Reserva cancelada · la hora quedó libre');
    } catch (e) { toast('No se pudo cancelar', 'error'); }
  }

  /* =========================================================
     Novedades + solicitudes (host)
     ========================================================= */
  function renderNovedades() {
    if (!user) { renderAuthUI(); return; }
    refreshNotifBanner();
    renderTodayBanner();
    autoVerifyWompiPayments();
    const pend = myRequests.filter((r) => r.estado === 'pendiente');
    const porCobrar = myRequests.filter((r) => (r.estado === 'confirmada' || r.estado === 'completada') && !r.pagado);
    $('#novReqCount').textContent = pend.length ? pend.length + (pend.length === 1 ? ' nueva' : ' nuevas')
      : (porCobrar.length ? porCobrar.length + (porCobrar.length === 1 ? ' por cobrar' : ' por cobrar') : '');
    // Primero lo que pide acción: solicitudes nuevas, luego los pagos sin confirmar.
    const rank = (r) => (r.estado === 'pendiente' ? 0 : ((r.estado === 'confirmada' || r.estado === 'completada') && !r.pagado ? 1 : 2));
    renderReqList('#novReqList', '#novReqEmpty', myRequests.slice().sort((a, b) => rank(a) - rank(b)).slice(0, 8));
    // Chats recientes
    const cl = $('#novChatsList'); cl.innerHTML = '';
    $('#novChatsEmpty').classList.toggle('hidden', myChats.length > 0);
    const uidv = VB.uid();
    myChats.slice(0, 4).forEach((ch) => cl.appendChild(chatRow(ch, uidv)));
  }
  function renderReqList(ulSel, emptySel, list) {
    const ul = $(ulSel), esc = vaEscalonada(ul); ul.innerHTML = '';
    if (emptySel) $(emptySel).classList.toggle('hidden', list.length > 0);
    list.forEach((rq, i) => {
      const [cls, lab] = { pendiente: ['p-pend', 'Pendiente'], confirmada: ['p-ok', 'Aceptada'], rechazada: ['p-no', 'Declinada'], completada: ['p-dim', 'Completada'], cancelada: ['p-dim', 'Cancelada'] }[rq.estado] || ['p-dim', rq.estado];
      const li = document.createElement('li'); li.className = 'book-card'; escalonar(li, i, esc);
      const fx = parseYmd(rq.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
      li.innerHTML = `
        <div class="bk-top"><div><div class="bk-name">${escapeHtml(rq.driverName || 'Vecino')}</div><div class="bk-sub">quiere ${escapeHtml(rq.stationName || 'tu puesto')}</div></div><span class="bk-pill ${cls}">${lab}</span></div>
        <div class="bk-meta"><span>🗓️ ${fx}</span><span>🕐 ${escapeHtml(rq.from)}–${escapeHtml(rq.to)}</span><span>⚡ ${rq.kwhReal ? fmtKwh(rq.kwhReal) + ' kWh medidos' : '~' + fmtKwh(rq.kwhEst) + ' kWh'}</span><span>💰 ${fmtCOP(rq.totalReal || rq.total)}</span>${rq.pagado ? `<span class="meta-paid">${rq.pagoMetodo === 'wompi' ? '💳 Pagado en línea' : '💵 Pago recibido'}</span>` : (rq.wompiTxId ? '<span class="meta-pend">⏳ Pago en línea en proceso</span>' : '')}</div>
        <div class="bk-actions">
          <button class="btn-ghost btn-sm" data-chat="${rq.id}">💬 Chat</button>
          ${rq.estado === 'pendiente' ? `<button class="btn-ok" data-acc="${rq.id}">Aceptar</button><button class="btn-ghost btn-danger" data-rej="${rq.id}">Declinar</button>` : ''}
          ${rq.estado === 'confirmada' ? `<button class="btn-ghost btn-sm" data-done="${rq.id}">Completada</button>` : ''}
          ${(rq.estado === 'confirmada' || rq.estado === 'completada') ? `<button class="${rq.pagado ? 'btn-ghost btn-sm' : 'btn-ok btn-sm'}" data-pay="${rq.id}">${rq.pagado ? 'Marcar sin pagar' : '💵 Ya me pagó'}</button>` : ''}
        </div>`;
      ul.appendChild(li);
    });
    $$(ulSel + ' [data-acc]').forEach((b) => b.addEventListener('click', () => acceptRequest(b.dataset.acc)));
    $$(ulSel + ' [data-rej]').forEach((b) => b.addEventListener('click', () => openReject(b.dataset.rej)));
    $$(ulSel + ' [data-done]').forEach((b) => b.addEventListener('click', () => VB.updateBooking(b.dataset.done, { estado: 'completada' }).then(() => toast('Carga completada 🔋'))));
    $$(ulSel + ' [data-pay]').forEach((b) => b.addEventListener('click', () => toggleBookingPaid(b.dataset.pay)));
    $$(ulSel + ' [data-chat]').forEach((b) => b.addEventListener('click', () => { const rq = myRequests.find((x) => x.id === b.dataset.chat); if (rq) startChatWith({ id: rq.stationId, nombre: rq.stationName, ownerUid: rq.ownerUid, ownerName: rq.driverName, demo: rq.demo }, rq.driverUid); }));
  }
  function acceptRequest(id) {
    const rq = myRequests.find((x) => x.id === id);
    const num = (myStationDoc && myStationDoc.numeroParqueadero) || '';
    VB.updateBooking(id, { estado: 'confirmada', numeroParqueadero: num }).then(() => { successPop(); toast('Reserva aceptada ✅ Avisamos a ' + ((rq && rq.driverName) || 'el vecino').split(' ')[0]); });
  }
  // El anfitrión confirma que la transferencia Bre-B llegó: cierra el ciclo del pago.
  function toggleBookingPaid(id) {
    const rq = myRequests.find((x) => x.id === id); if (!rq) return;
    const marcar = !rq.pagado;
    VB.markBookingPaid(id, marcar)
      .then(() => { if (marcar) successPop(); toast(marcar ? 'Pago confirmado 💵 El vecino ya lo ve' : 'Pago marcado como pendiente'); })
      .catch(() => toast('No se pudo registrar el pago', 'error'));
  }

  /* =========================================================
     Calendario tipo Teams
     ========================================================= */
  function renderCalendar(sel, bookings, role) {
    const el = $(sel); if (!el) return;
    const ws = addDays(mondayOf(new Date()), calOffset[role] * 7);
    const we = addDays(ws, 6);
    const lbl = ws.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' – ' + we.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    $(role === 'driver' ? '#resRange' : '#agRange').textContent = lbl;
    $(role === 'driver' ? '#resWeekLbl' : '#agWeekLbl').textContent = calOffset[role] === 0 ? 'Esta semana' : (calOffset[role] > 0 ? 'Próxima' : 'Anterior');

    const hours = [6, 10, 14, 18, 22];
    let times = '<div class="cal-times">' + hours.map((h) => `<span style="top:${(h - CAL_S) / (CAL_E - CAL_S) * 100}%">${h}:00</span>`).join('') + '</div>';
    const today = ymd(new Date());
    let cols = '';
    for (let i = 0; i < 7; i++) {
      const d = addDays(ws, i), key = ymd(d), isToday = key === today;
      const wd = d.getDay();
      // sombreado disponible (solo agenda del host)
      let avail = '';
      if (role === 'host' && myStationDoc && (myStationDoc.dias || [])[wd]) {
        const t = (hToMin(myStationDoc.desde) / 60 - CAL_S) / (CAL_E - CAL_S) * 100;
        const bt = (hToMin(myStationDoc.hasta) / 60 - CAL_S) / (CAL_E - CAL_S) * 100;
        avail = `<div class="cal-free" style="top:${clamp(t, 0, 100)}%;height:${clamp(bt - t, 0, 100)}%"></div>`;
      }
      const dayBk = bookings.filter((b) => b.fecha === key && (b.estado === 'pendiente' || b.estado === 'confirmada'));
      const blocks = dayBk.map((b) => {
        const t = clamp((hToMin(b.from) / 60 - CAL_S) / (CAL_E - CAL_S) * 100, 0, 100);
        const bt = clamp((hToMin(b.to) / 60 - CAL_S) / (CAL_E - CAL_S) * 100, 0, 100);
        const h = Math.max(9, bt - t);
        const who = role === 'host' ? (b.driverName || 'Vecino') : (b.stationName || '');
        const cls = b.estado === 'confirmada' ? 'ev-ok' : 'ev-pend';
        return `<div class="cal-ev ${cls}" style="top:${t}%;height:${h}%" title="${escapeHtml(who)} · ${b.from}-${b.to}"><b>${escapeHtml(b.from)}</b><span>${escapeHtml(who.split(' ')[0])}</span></div>`;
      }).join('');
      cols += `<div class="cal-day"><div class="cal-dh ${isToday ? 'is-today' : ''}"><span>${DIAS[wd]}</span><b>${d.getDate()}</b></div><div class="cal-col">${avail}${blocks}</div></div>`;
    }
    el.innerHTML = `<div class="cal-grid">${times}<div class="cal-days">${cols}</div></div>`;
  }
  function renderAgenda() {
    if (!user) return;
    renderCalendar('#calHost', myRequests, 'host');
    renderReqList('#novReqList2', null, []); // no-op safety
    loadAvailabilityUI(myStationDoc);
  }

  /* =========================================================
     Disponibilidad (host)
     ========================================================= */
  function buildAvDias() {
    const w = $('#avDias'); if (!w) return; w.innerHTML = '';
    DIAS.forEach((d, i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'chip' + (spDias[i] ? ' is-active' : ''); b.textContent = d;
      b.addEventListener('click', () => { spDias[i] = spDias[i] ? 0 : 1; b.classList.toggle('is-active', !!spDias[i]); });
      w.appendChild(b);
    });
  }
  function loadAvailabilityUI(sp) {
    if (!sp) return;
    (sp.dias || []).forEach((v, i) => { spDias[i] = v ? 1 : 0; });
    $$('#avDias .chip').forEach((c, i) => c.classList.toggle('is-active', !!spDias[i]));
    if ($('#avDesde')) $('#avDesde').value = sp.desde || '07:00';
    if ($('#avHasta')) $('#avHasta').value = sp.hasta || '21:00';
  }
  async function saveAvailability() {
    if (!user) { needLogin(); return; }
    if (!myStationDoc) { toast('Primero publica tu puesto en la pestaña Puesto', 'error'); goView('puesto'); return; }
    try {
      await VB.updateStationFields(myStationDoc.id, { dias: spDias.slice(), desde: $('#avDesde').value || '07:00', hasta: $('#avHasta').value || '21:00' });
      myStationDoc.dias = spDias.slice(); myStationDoc.desde = $('#avDesde').value; myStationDoc.hasta = $('#avHasta').value;
      renderCalendar('#calHost', myRequests, 'host');
      toast('Horario actualizado ⏰');
    } catch (e) { toast('No se pudo guardar', 'error'); }
  }

  /* =========================================================
     Mi puesto (host)
     ========================================================= */
  function renderPuesto() {
    const logged = !!user;
    $('#puestoAuth').classList.toggle('hidden', logged);
    $('#puestoForm').classList.toggle('hidden', !logged);
    $('#puestoState').classList.toggle('hidden', !myStationDoc);
    if (myStationDoc) { $('#puestoState').textContent = myStationDoc.visible !== false ? '● Publicado' : '○ Oculto'; loadPuestoForm(myStationDoc); }
  }
  function loadPuestoForm(sp) {
    $('#spName').value = sp.nombre || ''; selectWithFallback('#spTorre', sp.torre || ''); $('#spNum').value = sp.numeroParqueadero || '';
    $('#spSize').value = sp.tamano || 'Mediano'; $('#spPort').value = sp.puerto || 'Tipo 2';
    setPotencia(sp.pow || 7.4);
    $('#spCond').value = sp.condiciones || ''; $('#spPrecio').value = sp.precio || ''; $('#spFee').value = sp.serviceFee || ''; $('#spDesc').value = sp.discount || '';
    $('#spBreb').value = sp.breb || ''; $('#spTitular').value = sp.titular || '';
    if ($('#spBanco')) $('#spBanco').value = sp.banco || '';
    spotQr = null; qrShow($('#spQrPreview'), $('#spQrImg'), $('#spQrPick'), sp.qr || null);
    spotFotos = (sp.fotos || []).filter((f) => typeof f === 'string' && f); renderSpotFotos();
    const sw = $('#spVisible'); sw.classList.toggle('is-on', sp.visible !== false); sw.setAttribute('aria-checked', String(sp.visible !== false));
    setWompiSwitch(!!sp.wompi);
    loadWompiConfig(sp.id);
  }
  /* ---------- Potencia del cargador ----------
     Las cuatro de siempre cubren casi todo, pero hay cargadores de 9,6 o de 16 kW:
     "Otra…" abre un campo para escribir la que sea. */
  const POW_FIJAS = ['3.6', '7.4', '11', '22'];
  function setPotencia(kw) {
    const v = String(kw || 7.4);
    const esFija = POW_FIJAS.includes(v);
    $('#spPow').value = esFija ? v : 'otra';
    $('#spPowOtra').value = esFija ? '' : String(kw).replace('.', ',');
    $('#spPowOtraField').classList.toggle('hidden', esFija);
  }
  function leerPotencia() {
    if ($('#spPow').value !== 'otra') return parseFloat($('#spPow').value);
    const v = parseNum($('#spPowOtra').value);
    return v > 0 ? Math.round(v * 100) / 100 : 0;
  }

  /* ---------- Pago en línea del anfitrión ---------- */
  function setWompiSwitch(on) {
    const sw = $('#spWompiOn'); if (!sw) return;
    sw.classList.toggle('is-on', !!on); sw.setAttribute('aria-checked', String(!!on));
    $('#spWompiFields').classList.toggle('hidden', !on);
  }
  async function loadWompiConfig(stationId) {
    if (!$('#spWompiKey')) return;
    $('#spWompiKey').value = ''; $('#spWompiSecret').value = '';
    if (!stationId || !VB) return;
    const cfg = await payConfigOf(stationId);
    if (!cfg) return;
    $('#spWompiKey').value = cfg.pubKey || '';
    $('#spWompiSecret').value = cfg.integrity || '';
    updateWompiState();
  }
  function updateWompiState() {
    const el = $('#spWompiState'); if (!el || !window.VW) return;
    const cfg = { pubKey: $('#spWompiKey').value, integrity: $('#spWompiSecret').value };
    if (!$('#spWompiOn').classList.contains('is-on')) { el.textContent = ''; return; }
    if (window.VW.isConfigured(cfg)) {
      el.className = 'hint hint-ok';
      el.textContent = window.VW.isTest(cfg.pubKey)
        ? '🧪 Modo de prueba: los pagos son simulados, no mueven dinero real. Perfecto para ensayar.'
        : '✅ Listo para recibir pagos reales de tus vecinos.';
    } else {
      el.className = 'hint hint-warn';
      el.textContent = '⚠️ ' + window.VW.configError(cfg);
    }
  }
  async function savePuesto() {
    if (!puedeActuar('publicar tu puesto')) return;
    const nombre = $('#spName').value.trim();
    if (!nombre) { toast('Ponle un nombre a tu puesto', 'error'); return; }
    const wompiOn = $('#spWompiOn').classList.contains('is-on');
    const wompiCfg = { pubKey: $('#spWompiKey').value.trim(), integrity: $('#spWompiSecret').value.trim() };
    if (wompiOn && window.VW && !window.VW.isConfigured(wompiCfg)) {
      toast(window.VW.configError(wompiCfg), 'error');
      $('#spWompiKey').focus();
      return;
    }
    if (!wompiOn && !$('#spBreb').value.trim()) {
      toast('Deja al menos una forma de cobro: la llave Bre-B o el pago en línea', 'error');
      return;
    }
    const pow = leerPotencia();
    if (!pow) { toast('Escribe cuánta potencia da tu cargador', 'error'); $('#spPowOtra').focus(); return; }
    if (pow > 350) { toast('Esa potencia no parece de un cargador residencial. Revísala.', 'error'); $('#spPowOtra').focus(); return; }
    const data = {
      conjunto: CONJUNTO, nombre, torre: $('#spTorre').value.trim(), numeroParqueadero: $('#spNum').value.trim(),
      wompi: wompiOn, ownerVerificado: esVecino(),
      tamano: $('#spSize').value, puerto: $('#spPort').value, pow: pow,
      condiciones: $('#spCond').value.trim(),
      precio: Math.max(0, Math.round(parseNum($('#spPrecio').value))) || settings.pricePerKwh,
      serviceFee: Math.max(0, Math.round(parseNum($('#spFee').value))), discount: Math.max(0, Math.round(parseNum($('#spDesc').value))),
      breb: $('#spBreb').value.trim(), titular: $('#spTitular').value.trim(),
      banco: $('#spBanco') ? $('#spBanco').value : '',
      dias: (myStationDoc && myStationDoc.dias) || spDias.slice(),
      desde: (myStationDoc && myStationDoc.desde) || '07:00', hasta: (myStationDoc && myStationDoc.hasta) || '21:00',
      fotos: spotFotos.slice(), visible: $('#spVisible').classList.contains('is-on')
    };
    if (spotQr !== null) data.qr = spotQr; // '' quita el QR, dataURL lo guarda
    // Un documento de Firestore no puede pasar de 1 MB: las imágenes van embebidas.
    const peso = spotFotos.reduce((a, f) => a + f.length, 0) + (data.qr ? data.qr.length : 0);
    if (peso > 850000) { toast('Las fotos pesan demasiado juntas. Quita una e intenta de nuevo.', 'error'); return; }
    try {
      $('#spSave').disabled = true; $('#spSave').textContent = 'Publicando…';
      const id = await VB.publishStation(data, myStationDoc && myStationDoc.id);
      // Las llaves de la pasarela van aparte del documento público del puesto.
      if (wompiOn) { await VB.savePayConfig(id, wompiCfg); payCfgCache[id] = wompiCfg; }
      else { await VB.clearPayConfig(id); payCfgCache[id] = null; }
      myStationDoc = Object.assign({ id }, myStationDoc || {}, data);
      renderPuesto();
      successPop();
      toast('¡Tu puesto quedó publicado en MontReal! ⚡');
    } catch (e) { toast('No se pudo publicar: ' + e.message, 'error'); }
    finally { $('#spSave').disabled = false; $('#spSave').innerHTML = '<span class="btn-glow"></span>Publicar mi puesto'; }
  }

  /* =========================================================
     Rechazo con motivo
     ========================================================= */
  function openReject(id) { rejectCtx = id; rejReason = null; $$('#rejReasons .reason-btn').forEach((b) => b.classList.remove('on')); $('#rejOtherField').classList.add('hidden'); $('#rejOther').value = ''; openSheet('#rejectSheet'); }
  async function sendReject() {
    if (!rejectCtx) return;
    let reason = rejReason;
    if (reason === 'otro') { reason = $('#rejOther').value.trim(); if (!reason) { toast('Escribe el motivo', 'error'); return; } }
    if (!reason) { toast('Elige un motivo', 'error'); return; }
    const rq = myRequests.find((x) => x.id === rejectCtx);
    try {
      await VB.updateBooking(rejectCtx, { estado: 'rechazada', rejectReason: reason });
      await liberarHoras(rq); // la hora vuelve al conjunto
      closeSheet('#rejectSheet'); toast('Solicitud declinada · la hora quedó libre');
    } catch (e) { toast('Error al declinar', 'error'); }
  }

  /* =========================================================
     Chat
     ========================================================= */
  async function startChatWith(sp, forcedOther) {
    if (!user) { needLogin(); return; }
    try {
      const chatId = await VB.openChat(sp);
      closeSheet('#spotSheet');
      openChatSheet({ chatId, title: sp.nombre, sub: 'con ' + (sp.ownerName || 'el anfitrión'), demo: !!sp.demo });
    } catch (e) { toast('No se pudo abrir el chat', 'error'); }
  }
  function chatRow(ch, uidv) {
    const other = (ch.names && Object.keys(ch.names).filter((k) => k !== uidv).map((k) => ch.names[k])[0]) || 'Chat';
    const li = document.createElement('li'); li.className = 'book-card'; li.style.cursor = 'pointer';
    li.innerHTML = `<div class="bk-top"><div><div class="bk-name">💬 ${escapeHtml(ch.stationName || other)}</div><div class="bk-sub">${escapeHtml(other)}${ch.lastMsg ? ' · ' + escapeHtml(ch.lastMsg) : ''}</div></div><span class="bk-sub">${tsDate(ch.lastAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</span></div>`;
    li.addEventListener('click', () => openChatSheet({ chatId: ch.id, title: ch.stationName || other, sub: 'con ' + other, demo: !!ch.demo }));
    return li;
  }
  function renderChatList() {
    if (!user) { renderAuthUI(); return; }
    const ul = $('#chatsList'); ul.innerHTML = '';
    $('#chatsEmpty').classList.toggle('hidden', myChats.length > 0);
    const uidv = VB.uid();
    myChats.forEach((ch) => ul.appendChild(chatRow(ch, uidv)));
  }
  function openChatSheet(ctx) {
    chatCtx = ctx;
    $('#chTitle').textContent = ctx.title; $('#chSub').textContent = ctx.sub || '';
    $('#chMsgs').innerHTML = '<div class="msg-day">Cargando…</div>';
    openSheet('#chatSheet');
    stopWatchers(['msgs']);
    unsubs.msgs = VB.watchMessages(ctx.chatId, (msgs) => {
      const box = $('#chMsgs'), uidv = VB.uid(); let html = '', lastDay = '';
      msgs.forEach((m) => {
        const d = tsDate(m.at), dk = d.toDateString();
        if (dk !== lastDay) { lastDay = dk; html += `<div class="msg-day">${d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}</div>`; }
        html += `<div class="msg ${m.from === uidv ? 'msg-out' : 'msg-in'}">${escapeHtml(m.text)}<span class="msg-time">${d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</span></div>`;
      });
      if (!msgs.length) html = '<div class="msg-day">Escribe el primer mensaje 👋</div>';
      if (ctx.demo) html += '<div class="chat-demo-note">Puesto de ejemplo: el anfitrión no responderá.</div>';
      box.innerHTML = html; box.scrollTop = box.scrollHeight;
      seen.msgs[ctx.chatId] = Date.now(); persistSeen();
    });
    setTimeout(() => $('#chInput').focus(), 300);
  }
  async function sendChat() {
    const t = $('#chInput').value.trim(); if (!t || !chatCtx) return;
    $('#chInput').value = '';
    try { await VB.sendMessage(chatCtx.chatId, t); } catch (e) { toast('No se pudo enviar', 'error'); $('#chInput').value = t; }
  }

  /* =========================================================
     Calificaciones
     ========================================================= */
  function openRate(ctx) {
    rateCtx = ctx; rateStars = 0;
    $('#rtTitle').textContent = ctx.tipo === 'driver-host' ? 'Califica al anfitrión' : 'Califica al vecino';
    $('#rtSub').textContent = 'Tu opinión sobre ' + ctx.toName + ' ayuda a la confianza del conjunto.';
    $('#rtComment').value = ''; $$('#rtStars .star-btn').forEach((s) => s.classList.remove('on'));
    openSheet('#rateSheet');
  }
  async function sendRating() {
    if (!rateCtx) return; if (!rateStars) { toast('Elige de 1 a 5 estrellas', 'error'); return; }
    try {
      await VB.submitRating({ bookingId: rateCtx.bookingId || null, stationId: rateCtx.stationId || null, stars: rateStars, comment: $('#rtComment').value.trim().slice(0, 300), tipo: rateCtx.tipo });
      closeSheet('#rateSheet'); successPop(); toast('¡Gracias por calificar! ⭐');
    } catch (e) { toast('No se pudo enviar', 'error'); }
  }

  /* =========================================================
     Imágenes / QR de pago
     ========================================================= */
  function compressImageFile(file, maxSize, quality) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('no-image')); return; }
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, (maxSize || 480) / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); ctx.drawImage(img, 0, 0, w, h);
          resolve(cv.toDataURL('image/jpeg', quality || 0.72));
        };
        img.onerror = () => reject(new Error('img'));
        img.src = reader.result;
      };
      reader.onerror = () => reject(new Error('read'));
      reader.readAsDataURL(file);
    });
  }
  function qrShow(previewEl, imgEl, pickEl, dataUrl) {
    if (!previewEl) return;
    if (dataUrl) { imgEl.src = dataUrl; previewEl.classList.remove('hidden'); pickEl.classList.add('hidden'); }
    else { previewEl.classList.add('hidden'); pickEl.classList.remove('hidden'); }
  }
  /* ---------- Fotos del puesto ---------- */
  function renderSpotFotos() {
    const grid = $('#spFotoGrid'), pick = $('#spFotoPick');
    if (!grid) return;
    grid.classList.toggle('hidden', !spotFotos.length);
    grid.innerHTML = spotFotos.map((src, i) =>
      `<div class="foto-thumb"><img src="${escapeHtml(src)}" alt="Foto ${i + 1} del puesto"/><button type="button" class="foto-del" data-foto="${i}" aria-label="Quitar esta foto">✕</button></div>`).join('');
    if (pick) {
      pick.classList.toggle('hidden', spotFotos.length >= MAX_FOTOS);
      const main = pick.querySelector('.qr-drop-main');
      if (main) main.textContent = spotFotos.length ? 'Agregar otra foto' : 'Agregar fotos';
    }
    $$('#spFotoGrid .foto-del').forEach((b) => b.addEventListener('click', () => { spotFotos.splice(+b.dataset.foto, 1); renderSpotFotos(); }));
  }
  async function addSpotFotos(files) {
    const libres = MAX_FOTOS - spotFotos.length;
    if (libres <= 0) { toast('Ya tienes el máximo de ' + MAX_FOTOS + ' fotos', 'error'); return; }
    let ok = 0;
    for (const f of Array.from(files).slice(0, libres)) {
      try { spotFotos.push(await compressImageFile(f, 720, 0.6)); ok++; } catch (e) { /* archivo no válido */ }
    }
    renderSpotFotos();
    toast(ok ? (ok === 1 ? 'Foto agregada 📷' : ok + ' fotos agregadas 📷') : 'No pudimos procesar esas imágenes', ok ? undefined : 'error');
  }
  function findStation(id) { return stations.find((s) => s.id === id) || allStations.find((s) => s.id === id) || null; }
  function openQrView(opts) {
    const c = $('#qrViewContent');
    const img = opts.qr ? `<img class="qr-big" src="${escapeHtml(opts.qr)}" alt="QR de pago"/>` : `<div class="qr-none">Este puesto no tiene QR. Usa la llave Bre-B para transferir.</div>`;
    c.innerHTML = `
      <div class="qr-view-head"><div class="bk-name">Pago con Bre-B</div><div class="bk-sub">${escapeHtml(opts.stationName || '')}</div></div>
      ${img}
      <div class="qr-pay-info">
        <div class="qr-pay-row"><span>Llave Bre-B</span><b>${escapeHtml(opts.breb || '—')}</b></div>
        ${opts.banco ? `<div class="qr-pay-row"><span>Banco</span><b>${escapeHtml(opts.banco)}</b></div>` : ''}
        <div class="qr-pay-row"><span>Titular</span><b>${escapeHtml(opts.titular || opts.ownerName || '—')}</b></div>
      </div>
      ${opts.breb ? `<button class="btn-secondary btn-block" id="qrCopy" type="button">Copiar llave Bre-B</button>` : ''}
      <p class="hint" style="text-align:center;margin-top:8px">Abre tu banco, escanea el QR o usa la llave, y transfiere el total acordado.</p>`;
    openSheet('#qrSheet');
    if (opts.breb) $('#qrCopy').addEventListener('click', async () => { try { await navigator.clipboard.writeText(opts.breb); toast('Llave copiada 📋'); } catch (e) {} });
  }

  /* =========================================================
     ADMINISTRACIÓN DEL CONJUNTO
     ========================================================= */
  function demoAllBookings() {
    const mk = (id, st, drv, du, kwh, estado, daysAgo) => ({
      id, stationId: st.id, stationName: st.nombre, ownerUid: st.ownerUid, ownerName: st.ownerName,
      driverUid: du, driverName: drv, torre: st.torre, kwhEst: kwh, precio: st.precio,
      total: Math.round(kwh * st.precio), estado,
      createdAt: { seconds: Math.floor((Date.now() - daysAgo * 864e5) / 1000) },
      fecha: ymd(addDays(new Date(), -daysAgo)), from: '18:00', to: '21:00'
    });
    const S = DEMO_STATIONS;
    return [
      mk('d1', S[0], 'Laura Mesa', 'u-laura', 18, 'completada', 6),
      mk('d2', S[1], 'Carlos Ruiz', 'u-carlos', 12, 'completada', 5),
      mk('d3', S[0], 'Diego Salas', 'u-diego', 22, 'completada', 4),
      mk('d4', S[2], 'Ana Gómez', 'u-ana', 30, 'confirmada', 3),
      mk('d5', S[3], 'Sofía Peña', 'u-sofia', 15, 'completada', 2),
      mk('d6', S[0], 'Carlos Ruiz', 'u-carlos', 20, 'confirmada', 1),
      mk('d7', S[4], 'Laura Mesa', 'u-laura', 25, 'completada', 1),
      mk('d8', S[2], 'Diego Salas', 'u-diego', 10, 'pendiente', 0),
      mk('d9', S[0], 'Ana Gómez', 'u-ana', 16, 'completada', 0)
    ];
  }
  // Cargas medidas de ejemplo (solo modo prueba local) para ver el panel con datos.
  function demoSessions() {
    const S = DEMO_STATIONS;
    const mk = (st, drv, kwh, daysAgo, pagado) => ({
      id: 'ds' + daysAgo + drv.length, ownerUid: st.ownerUid, ownerName: st.ownerName,
      stationId: st.id, stationName: st.nombre, torrePuesto: st.torre, torre: st.torre,
      driverName: drv, kwh, pricePerKwh: st.precio, total: Math.round(kwh * st.precio),
      dateISO: addDays(new Date(), -daysAgo).toISOString(), pagado
    });
    return [
      mk(S[0], 'Laura Mesa', 19.4, 2, true), mk(S[1], 'Ana Gómez', 11.2, 3, true),
      mk(S[2], 'Diego Salas', 27.8, 5, false), mk(S[0], 'Carlos Ruiz', 15.6, 9, true),
      mk(S[3], 'Sofía Peña', 22.1, 12, false), mk(S[4], 'Laura Mesa', 8.9, 34, true),
      mk(S[0], 'Ana Gómez', 17.3, 38, true), mk(S[2], 'Carlos Ruiz', 24.5, 41, true)
    ];
  }
  const panelBookings = () => (allBookings.length ? allBookings : (devAdmin() ? demoAllBookings() : []));
  const panelStations = () => (allStations.length ? allStations : (devAdmin() ? DEMO_STATIONS.map((s) => Object.assign({}, s, { common: s.ownerName === 'Administración' })) : []));
  const panelUsers = () => (allUsers.length ? allUsers : (devAdmin() ? DEMO_USERS : []));
  const panelSessions = () => (allSessions.length ? allSessions : (devAdmin() ? demoSessions() : []));

  /* ---------- Historial unificado del conjunto ----------
     Dos fuentes: las cargas medidas con el contador (reales) y las reservas
     agendadas (estimadas). Una reserva con carga medida encima ya trae 'kwhReal',
     así que se excluye para no contarla dos veces.                             */
  function mergedEvents() {
    const cargas = panelSessions().map((s) => ({
      origen: 'carga',
      fecha: s.dateISO ? ymd(new Date(s.dateISO)) : ymd(tsDate(s.at)),
      torre: String(s.torrePuesto || s.torre || '—') || '—',
      stationId: s.stationId || '',
      puesto: s.stationName || 'Carga por contador',
      anfitrion: s.ownerName || '',
      vecino: s.driverName || 'Sin nombre',
      kwh: s.kwh || 0, precio: s.pricePerKwh || 0, total: s.total || 0,
      pagado: !!s.pagado
    }));
    const reservas = panelBookings()
      .filter((b) => (b.estado === 'confirmada' || b.estado === 'completada') && !b.kwhReal)
      .map((b) => ({
        origen: 'reserva',
        fecha: b.fecha || ymd(tsDate(b.createdAt)),
        torre: String(b.torre || '—') || '—',
        stationId: b.stationId || '',
        puesto: b.stationName || 'Puesto',
        anfitrion: b.ownerName || '',
        vecino: b.driverName || 'Sin nombre',
        kwh: b.kwhEst || 0, precio: b.precio || 0, total: b.total || 0,
        pagado: !!b.pagado
      }));
    return cargas.concat(reservas).sort((a, b) => String(b.fecha).localeCompare(String(a.fecha)));
  }
  function sumEvents(list) {
    return list.reduce((a, e) => {
      a.ingresos += e.total; a.kwh += e.kwh; a.count++;
      if (e.pagado) a.pagado += e.total; else a.pendiente += e.total;
      return a;
    }, { ingresos: 0, kwh: 0, count: 0, pagado: 0, pendiente: 0 });
  }

  function countUp(el, to, fmt, dur) {
    const d = dur || 800;
    if (!settings.animations || prefersReduced() || document.visibilityState === 'hidden') { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    let done = false;
    const settle = () => { if (!done) { done = true; el.textContent = fmt(to); } };
    (function step(now) {
      const p = clamp((now - t0) / d, 0, 1);
      if (done) return;
      el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step); else settle();
    })(performance.now());
    // Red de seguridad: si rAF no corre (pestaña oculta, equipo lento) el dato
    // nunca se queda en cero — siempre termina mostrando el valor real.
    setTimeout(settle, d + 120);
  }
  function adminStats() {
    const t = sumEvents(mergedEvents());
    return {
      ingresos: t.ingresos, kwh: t.kwh, cargas: t.count, pendiente: t.pendiente,
      reservas: panelBookings().length,
      puestos: panelStations().length
    };
  }
  function renderAdminMetrics() {
    const st = adminStats(), wrap = $('#admMetrics');
    const cards = [
      { ico: '💰', label: 'Ingresos', val: st.ingresos, fmt: (v) => fmtCOP(v) },
      { ico: '⚡', label: 'Energía', val: st.kwh, fmt: (v) => fmtKwh(v) + ' kWh' },
      { ico: '🔋', label: 'Cargas', val: st.cargas, fmt: (v) => fmtNum(Math.round(v)) },
      { ico: '💵', label: 'Por cobrar', val: st.pendiente, fmt: (v) => fmtCOP(v) },
      { ico: '🗓️', label: 'Reservas', val: st.reservas, fmt: (v) => fmtNum(Math.round(v)) },
      { ico: '🔌', label: 'Puestos', val: st.puestos, fmt: (v) => fmtNum(Math.round(v)) }
    ];
    const esc = vaEscalonada(wrap);
    wrap.innerHTML = cards.map((c, i) => `<div class="metric-card${esc ? ' stagger' : ''}" style="--i:${i}"><span class="metric-ico">${c.ico}</span><b class="metric-val" data-i="${i}">${c.fmt(0)}</b><span class="metric-label">${c.label}</span></div>`).join('');
    cards.forEach((c, i) => { const el = wrap.querySelector('.metric-val[data-i="' + i + '"]'); if (el) countUp(el, c.val, c.fmt, 900); });
  }
  function adminDailyBuckets(events) {
    const days = [], now = new Date();
    for (let i = 7; i >= 0; i--) { const d = addDays(now, -i); days.push({ key: ymd(d), label: d.getDate() + ' ' + d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''), cop: 0, kwh: 0, count: 0 }); }
    events.forEach((e) => {
      const bucket = days.find((x) => x.key === e.fecha);
      if (bucket) { bucket.cop += e.total; bucket.kwh += e.kwh; bucket.count++; }
    });
    return days;
  }
  function renderAdminChart() {
    const A = $('#admChartA'); if (!A) return; A.classList.remove('chart-in'); A.innerHTML = '';
    const bk = adminDailyBuckets(mergedEvents()), metric = admChart.metric;
    drawBars(A, bk, metric);
    const tot = bk.reduce((a, b) => a + (metric === 'cop' ? b.cop : b.kwh), 0);
    $('#admChartFootA').innerHTML = `<span>Total del período</span><b>${metric === 'cop' ? fmtCOP(tot) : fmtKwh(tot) + ' kWh'}</b>`;
    const rev = () => A.classList.add('chart-in'); requestAnimationFrame(() => requestAnimationFrame(rev)); setTimeout(rev, 120);
  }
  function renderTopSpots() {
    const counts = {};
    mergedEvents().forEach((e) => {
      const k = e.stationId || e.puesto;
      const c = counts[k] || (counts[k] = { id: k, name: e.puesto, count: 0 });
      c.count++;
    });
    const list = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 6);
    const ul = $('#admTopList'), esc = vaEscalonada(ul); ul.innerHTML = '';
    $('#admTopEmpty').classList.toggle('hidden', list.length > 0);
    const max = list.length ? list[0].count : 1;
    list.forEach((c, i) => {
      const li = document.createElement('li'); li.className = 'rank-item'; escalonar(li, i, esc);
      li.innerHTML = `<span class="rank-pos">${i + 1}</span><div class="rank-main"><div class="rank-name">${escapeHtml(c.name)}</div><div class="rank-bar"><i style="width:${Math.round(c.count / max * 100)}%"></i></div></div><div class="rank-val"><b>${c.count}</b><small>${c.count === 1 ? 'reserva' : 'reservas'}</small></div>`;
      ul.appendChild(li);
    });
  }
  function renderCommonSpots() {
    const spots = panelStations().filter((s) => s.common);
    const ul = $('#admSpotsList'), esc = vaEscalonada(ul); ul.innerHTML = '';
    $('#admSpotsEmpty').classList.toggle('hidden', spots.length > 0);
    spots.forEach((sp, i) => {
      const li = document.createElement('li'); li.className = 'book-card'; escalonar(li, i, esc);
      li.innerHTML = `<div class="bk-top"><div><div class="bk-name">${escapeHtml(sp.nombre)}</div><div class="bk-sub">🅿️ ${escapeHtml(sp.numeroParqueadero || '—')} · ${escapeHtml(sp.puerto || '')} · ${(sp.pow || 0)} kW</div></div><span class="bk-pill ${sp.visible !== false ? 'p-ok' : 'p-dim'}">${sp.visible !== false ? 'Visible' : 'Oculto'}</span></div>
        <div class="bk-meta"><span>💰 ${fmtCOP(sp.precio || 0)}/kWh</span><span>🕐 ${escapeHtml(sp.desde || '—')}–${escapeHtml(sp.hasta || '—')}</span>${sp.breb ? `<span>💳 ${escapeHtml(sp.breb)}</span>` : ''}</div>
        <div class="bk-actions"><button class="btn-ghost btn-sm" data-edit="${escapeHtml(sp.id)}">Editar</button><button class="btn-ghost btn-sm btn-danger" data-del="${escapeHtml(sp.id)}">Eliminar</button></div>`;
      ul.appendChild(li);
    });
    $$('#admSpotsList [data-edit]').forEach((b) => b.addEventListener('click', () => openAdminSpot(b.dataset.edit)));
    $$('#admSpotsList [data-del]').forEach((b) => b.addEventListener('click', () => deleteAdminSpot(b.dataset.del)));
  }
  function renderPanel() {
    if (!isAdmin()) return;
    renderAdminMetrics(); renderAdminChart(); renderReporte(); renderTopSpots(); renderCommonSpots();
  }

  /* =========================================================
     Reporte mensual para la administración (PDF / CSV)
     ========================================================= */
  const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthKey = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  function monthLabel(key) {
    const p = String(key).split('-'), m = MESES[(+p[1]) - 1] || '';
    return (m ? m[0].toUpperCase() + m.slice(1) : key) + ' de ' + p[0];
  }
  // Los 12 meses recientes más cualquier mes que tenga movimientos.
  function availableMonths() {
    const set = {}, now = new Date();
    for (let i = 0; i < 12; i++) set[monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1))] = 1;
    mergedEvents().forEach((e) => { if (e.fecha) set[String(e.fecha).slice(0, 7)] = 1; });
    return Object.keys(set).sort().reverse();
  }
  function buildReporte(key) {
    const evs = mergedEvents().filter((e) => String(e.fecha).slice(0, 7) === key);
    const tot = sumEvents(evs);

    const torres = {};
    evs.forEach((e) => {
      const t = torres[e.torre] || (torres[e.torre] = { torre: e.torre, count: 0, kwh: 0, ingresos: 0, pagado: 0, pendiente: 0 });
      t.count++; t.kwh += e.kwh; t.ingresos += e.total;
      if (e.pagado) t.pagado += e.total; else t.pendiente += e.total;
    });
    const torreRows = Object.values(torres).sort((a, b) => b.ingresos - a.ingresos)
      .map((t) => [(t.torre === '—' ? 'Sin torre' : 'Torre ' + t.torre), t.count, t.kwh, t.ingresos, t.pagado, t.pendiente]);

    const puestos = {};
    evs.forEach((e) => {
      const k = e.stationId || e.puesto;
      const p = puestos[k] || (puestos[k] = { nombre: e.puesto, anfitrion: e.anfitrion, count: 0, kwh: 0, ingresos: 0 });
      p.count++; p.kwh += e.kwh; p.ingresos += e.total;
    });
    const puestoRows = Object.values(puestos).sort((a, b) => b.ingresos - a.ingresos)
      .map((p) => [p.nombre, p.anfitrion || '—', p.count, p.kwh, p.ingresos]);

    const detRows = evs.slice().sort((a, b) => String(a.fecha).localeCompare(String(b.fecha))).map((e) => {
      const d = parseYmd(e.fecha);
      return [String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'),
        e.puesto, e.vecino, e.kwh, e.precio, e.total, e.pagado ? 'Pagado' : 'Por cobrar'];
    });
    const vecinos = Object.keys(evs.reduce((a, e) => { a[e.vecino] = 1; return a; }, {})).length;

    return {
      titulo: 'Reporte mensual de carga eléctrica',
      conjunto: 'Conjunto MontReal',
      periodo: monthLabel(key),
      generado: new Date().toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }),
      nota: 'Las cargas medidas con el contador se toman como consumo real; las reservas sin medición se valoran con los kWh acordados. "Por cobrar" es lo que el anfitrión todavía no ha confirmado como recibido.',
      resumen: [
        { label: 'Ingresos del mes', fmt: 'cop', value: tot.ingresos },
        { label: 'Energía entregada (kWh)', fmt: 'dec1', value: tot.kwh },
        { label: 'Cargas registradas', fmt: 'int', value: tot.count },
        { label: 'Por cobrar', fmt: 'cop', value: tot.pendiente },
        { label: 'Puestos activos', fmt: 'int', value: Object.keys(puestos).length },
        { label: 'Vecinos que cargaron', fmt: 'int', value: vecinos }
      ],
      tablas: [
        { titulo: 'Consumo e ingresos por torre', cols: ['Torre', 'Cargas', 'kWh', 'Ingresos', 'Pagado', 'Por cobrar'], fmt: ['text', 'int', 'dec1', 'cop', 'cop', 'cop'], w: [1.5, 0.85, 0.95, 1.25, 1.25, 1.25], rows: torreRows, total: ['Total', tot.count, tot.kwh, tot.ingresos, tot.pagado, tot.pendiente] },
        { titulo: 'Detalle por puesto', cols: ['Puesto', 'Anfitrión', 'Cargas', 'kWh', 'Ingresos'], fmt: ['text', 'text', 'int', 'dec1', 'cop'], w: [2.2, 1.6, 0.8, 0.9, 1.2], rows: puestoRows },
        { titulo: 'Detalle de cargas', cols: ['Fecha', 'Puesto', 'Vecino', 'kWh', '$/kWh', 'Total', 'Pago'], fmt: ['text', 'text', 'text', 'dec1', 'cop', 'cop', 'text'], w: [0.75, 2, 1.5, 0.75, 0.9, 1.05, 0.95], rows: detRows }
      ],
      _tot: tot, _torres: torreRows
    };
  }
  function renderReporte() {
    const sel = $('#admRepMonth'); if (!sel) return;
    const months = availableMonths();
    if (!repState.month || months.indexOf(repState.month) < 0) repState.month = months[0];
    sel.innerHTML = months.map((k) => `<option value="${k}"${k === repState.month ? ' selected' : ''}>${escapeHtml(monthLabel(k))}</option>`).join('');

    const rep = buildReporte(repState.month), t = rep._tot;
    $('#admRepOrigen').textContent = t.count ? (t.count === 1 ? '1 movimiento' : t.count + ' movimientos') : '';
    $('#admRepKpis').innerHTML = [
      ['Ingresos', fmtCOP(t.ingresos)], ['Energía', fmtKwh(t.kwh) + ' kWh'],
      ['Pagado', fmtCOP(t.pagado)], ['Por cobrar', fmtCOP(t.pendiente)]
    ].map(([l, v]) => `<div class="rep-kpi"><span>${l}</span><b>${v}</b></div>`).join('');

    const tbl = $('#admRepTable'), empty = $('#admRepEmpty'), has = rep._torres.length > 0;
    tbl.classList.toggle('hidden', !has); empty.classList.toggle('hidden', has);
    if (has) {
      tbl.innerHTML = '<thead><tr><th>Torre</th><th>Cargas</th><th>kWh</th><th>Ingresos</th><th>Por cobrar</th></tr></thead><tbody>' +
        rep._torres.map((r) => `<tr><td>${escapeHtml(r[0])}</td><td>${fmtNum(r[1])}</td><td>${fmtKwh(r[2])}</td><td>${fmtCOP(r[3])}</td><td>${fmtCOP(r[5])}</td></tr>`).join('') +
        `</tbody><tfoot><tr><td>Total</td><td>${fmtNum(t.count)}</td><td>${fmtKwh(t.kwh)}</td><td>${fmtCOP(t.ingresos)}</td><td>${fmtCOP(t.pendiente)}</td></tr></tfoot>`;
    }
  }
  function downloadReporte(kind) {
    if (!window.VReporte) { toast('El módulo de reportes no cargó. Recarga la página.', 'error'); return; }
    const rep = buildReporte(repState.month);
    if (!rep._tot.count) { toast('Ese mes no tiene movimientos', 'error'); return; }
    const name = 'voltio-montreal-' + repState.month + '.' + (kind === 'pdf' ? 'pdf' : 'csv');
    try {
      if (kind === 'pdf') { download(name, window.VReporte.pdf(rep), 'application/pdf'); toast('Reporte en PDF descargado 📄'); }
      else { download(name, window.VReporte.csv(rep), 'text/csv;charset=utf-8'); toast('Reporte en CSV descargado ⬇'); }
      successPop();
    } catch (e) { toast('No se pudo generar el reporte', 'error'); }
  }

  function openAdminSpot(id) {
    const sp = id ? panelStations().find((s) => s.id === id) : null;
    adminSpotCtx = (sp && !sp.demo) ? sp.id : null; // solo se editan puestos reales
    spotQr = null;
    const g = (k, d) => (sp && sp[k] != null ? sp[k] : d);
    const opt = (v, cur) => `<option ${v === cur ? 'selected' : ''}>${v}</option>`;
    const bancos = ['', 'Bancolombia', 'Nequi', 'Daviplata', 'Davivienda', 'BBVA', 'Banco de Bogotá', 'Nu', 'Lulo Bank', 'Banco Caja Social', 'Scotiabank Colpatria', 'Banco Popular', 'Banco de Occidente', 'Bancoomeva', 'Movii', 'Otro'];
    $('#admSpotContent').innerHTML = `
      <div class="login-box" style="text-align:left">
        <h3>${sp ? 'Editar puesto común' : 'Nuevo puesto común'}</h3>
        <p class="lg-sub">Puestos de visitantes o zonas comunes gestionados por la administración.</p>
        <div class="field"><label for="asName">Nombre del puesto</label><div class="input-wrap"><input id="asName" type="text" value="${escapeHtml(g('nombre', ''))}" placeholder="Ej: Parqueadero de visitantes" autocomplete="off"/></div></div>
        <div class="grid-2">
          <div class="field"><label for="asNum">N.º parqueadero</label><div class="input-wrap"><input id="asNum" type="text" value="${escapeHtml(g('numeroParqueadero', ''))}" placeholder="P-V04" autocomplete="off"/></div></div>
          <div class="field"><label for="asTorre">Zona / Torre</label><div class="input-wrap"><input id="asTorre" type="text" value="${escapeHtml(g('torre', ''))}" placeholder="Visitantes" autocomplete="off"/></div></div>
          <div class="field"><label for="asPort">Puerto</label><div class="input-wrap select-wrap"><select id="asPort">${['Tipo 1', 'Tipo 2', 'CCS', 'Doméstico'].map((v) => opt(v, g('puerto', 'Tipo 2'))).join('')}</select></div></div>
          <div class="field"><label for="asPow">Potencia (kW)</label><div class="input-wrap select-wrap"><select id="asPow">${['3.6', '7.4', '11', '22'].map((v) => `<option ${(+v === +g('pow', 7.4)) ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
          <div class="field"><label for="asSize">Tamaño</label><div class="input-wrap select-wrap"><select id="asSize">${['Pequeño', 'Mediano', 'Grande'].map((v) => opt(v, g('tamano', 'Mediano'))).join('')}</select></div></div>
          <div class="field"><label for="asPrecio">Precio por kWh</label><div class="input-wrap"><span class="unit unit--left">$</span><input id="asPrecio" inputmode="numeric" class="has-left" value="${escapeHtml(String(g('precio', 900)))}" autocomplete="off"/></div></div>
          <div class="field"><label for="asDesde">Desde</label><div class="input-wrap"><input id="asDesde" type="time" value="${escapeHtml(g('desde', '06:00'))}"/></div></div>
          <div class="field"><label for="asHasta">Hasta</label><div class="input-wrap"><input id="asHasta" type="time" value="${escapeHtml(g('hasta', '22:00'))}"/></div></div>
        </div>
        <h3 class="sub-h">Pago a la administración (Bre-B)</h3>
        <div class="grid-2">
          <div class="field"><label for="asBreb">Llave Bre-B</label><div class="input-wrap"><input id="asBreb" type="text" value="${escapeHtml(g('breb', ''))}" placeholder="@montreal.admin" autocomplete="off"/></div></div>
          <div class="field"><label for="asTitular">Titular</label><div class="input-wrap"><input id="asTitular" type="text" value="${escapeHtml(g('titular', 'Admón. MontReal'))}" autocomplete="off"/></div></div>
        </div>
        <div class="field"><label for="asBanco">Banco o billetera</label><div class="input-wrap select-wrap"><select id="asBanco">${bancos.map((v) => v === '' ? `<option value="" ${!g('banco', '') ? 'selected' : ''}>Selecciona…</option>` : opt(v, g('banco', ''))).join('')}</select></div></div>
        <div class="field ta-field">
          <label>Código QR de pago <span class="opt">(opcional)</span></label>
          <input id="asQrInput" type="file" accept="image/*" class="hidden"/>
          <div class="qr-preview hidden" id="asQrPreview"><img id="asQrImg" alt="QR"/><button type="button" class="qr-remove" id="asQrRemove">✕ Quitar QR</button></div>
          <button type="button" class="qr-drop" id="asQrPick"><span class="qr-ico">📷</span><span class="qr-drop-main">Subir imagen del QR</span><small>La comprimimos por ti.</small></button>
        </div>
        <div class="field ta-field"><label for="asCond">Indicaciones</label><div class="input-wrap"><textarea id="asCond" rows="2" placeholder="Ej: Avisa en portería al llegar.">${escapeHtml(g('condiciones', ''))}</textarea></div></div>
        <div class="switch-row"><div><span class="switch-title">Visible para los vecinos</span><span class="switch-sub">Aparece en la búsqueda</span></div><button id="asVisible" class="switch ${g('visible', true) !== false ? 'is-on' : ''}" type="button" role="switch" aria-checked="${g('visible', true) !== false}"><i></i></button></div>
        <button id="asSave" class="btn-primary" type="button" style="margin-top:16px"><span class="btn-glow"></span>${sp ? 'Guardar cambios' : 'Crear puesto'}</button>
        <button class="btn-ghost btn-block" type="button" data-close="admSpot" style="margin-top:8px">Cancelar</button>
      </div>`;
    openSheet('#admSpotSheet');
    qrShow($('#asQrPreview'), $('#asQrImg'), $('#asQrPick'), g('qr', null));
    $('#asQrPick').addEventListener('click', () => $('#asQrInput').click());
    $('#asQrInput').addEventListener('change', async () => { const f = $('#asQrInput').files[0]; if (!f) return; try { const url = await compressImageFile(f, 520, 0.72); spotQr = url; qrShow($('#asQrPreview'), $('#asQrImg'), $('#asQrPick'), url); toast('QR cargado 📷'); } catch (e) { toast('No se pudo procesar la imagen', 'error'); } $('#asQrInput').value = ''; });
    $('#asQrRemove').addEventListener('click', () => { spotQr = ''; qrShow($('#asQrPreview'), $('#asQrImg'), $('#asQrPick'), null); });
    $('#asVisible').addEventListener('click', () => { const sw = $('#asVisible'); sw.classList.toggle('is-on'); sw.setAttribute('aria-checked', String(sw.classList.contains('is-on'))); });
    $('#asSave').addEventListener('click', saveAdminSpot);
    $('#admSpotContent [data-close]').addEventListener('click', () => closeSheet('#admSpotSheet'));
  }
  async function saveAdminSpot() {
    const nombre = $('#asName').value.trim();
    if (!nombre) { toast('Ponle un nombre al puesto', 'error'); return; }
    const data = {
      nombre, numeroParqueadero: $('#asNum').value.trim(), torre: $('#asTorre').value.trim() || 'Visitantes',
      puerto: $('#asPort').value, pow: parseFloat($('#asPow').value) || 7.4, tamano: $('#asSize').value,
      precio: Math.max(0, Math.round(parseNum($('#asPrecio').value))) || 900, serviceFee: 0, discount: 0,
      dias: [1, 1, 1, 1, 1, 1, 1], desde: $('#asDesde').value || '06:00', hasta: $('#asHasta').value || '22:00',
      breb: $('#asBreb').value.trim(), titular: $('#asTitular').value.trim() || 'Admón. MontReal',
      banco: $('#asBanco').value, condiciones: $('#asCond').value.trim(),
      visible: $('#asVisible').classList.contains('is-on'), autoConfirm: true
    };
    if (spotQr !== null) data.qr = spotQr;
    if (!user || devAdmin()) { toast(devAdmin() ? 'Modo prueba: no se guarda en la nube' : 'Inicia sesión como administrador', 'error'); if (devAdmin()) closeSheet('#admSpotSheet'); return; }
    try { $('#asSave').disabled = true; await VB.saveManagedSpot(data, adminSpotCtx); closeSheet('#admSpotSheet'); successPop(); toast('Puesto guardado ✅'); }
    catch (e) { toast('No se pudo guardar: ' + (e.message || ''), 'error'); }
    finally { const b = $('#asSave'); if (b) b.disabled = false; }
  }
  function deleteAdminSpot(id) {
    const sp = panelStations().find((s) => s.id === id); if (!sp) return;
    if (!confirm('¿Eliminar "' + (sp.nombre || 'este puesto') + '"?')) return;
    if (sp.demo || devAdmin() || !user) { toast('Puesto de ejemplo: no se elimina en modo prueba'); return; }
    VB.deleteStation(id).then(() => toast('Puesto eliminado')).catch(() => toast('No se pudo eliminar', 'error'));
  }

  /* ---------- Usuarios (admin) ---------- */
  function renderUsers() {
    if (VB && user && myProfile && myProfile.role === 'admin' && !allUsers.length && !renderUsers._loading) {
      renderUsers._loading = true;
      VB.listUsers().then((l) => { renderUsers._loading = false; if (l && l.length) { allUsers = l; drawUsers(); } }).catch(() => { renderUsers._loading = false; });
    }
    drawUsers();
  }
  function drawUsers() {
    const term = ($('#admUserSearch') && $('#admUserSearch').value || '').trim().toLowerCase();
    let list = panelUsers().slice().sort((a, b) => (b.role === 'admin' ? 1 : 0) - (a.role === 'admin' ? 1 : 0) || String(a.name || '').localeCompare(String(b.name || '')));
    if (term) list = list.filter((u) => [u.name, u.email, u.phone, u.torre, u.apto].some((f) => String(f || '').toLowerCase().includes(term)));
    $('#admUserCount').textContent = list.length + (list.length === 1 ? ' residente' : ' residentes');
    const ul = $('#admUsersList'), esc = vaEscalonada(ul); ul.innerHTML = '';
    $('#admUsersEmpty').classList.toggle('hidden', list.length > 0);
    if (!list.length) { $('#admUsersEmpty').innerHTML = '<div class="empty-icon">👥</div><p>' + (term ? 'Sin resultados.' : 'Aún no hay residentes registrados.') + '</p>'; }
    list.forEach((u, i) => {
      const li = document.createElement('li'); li.className = 'user-row'; escalonar(li, i, esc);
      const initials = String(u.name || u.email || 'U').trim().charAt(0).toUpperCase();
      const loc = [u.torre && u.torre !== '—' ? 'Torre ' + u.torre : null, u.apto && u.apto !== '—' ? 'Apto ' + u.apto : null].filter(Boolean).join(' · ') || 'Sin ubicación';
      li.innerHTML = `<span class="user-av">${escapeHtml(initials)}</span><div class="user-main"><div class="user-name">${escapeHtml(u.name || 'Sin nombre')}${u.role === 'admin' ? ' <span class="sc-badge b-ver">Admin</span>' : ''}</div><div class="user-sub">${escapeHtml(u.email || '')}</div><div class="user-loc">🏢 ${escapeHtml(loc)}${u.phone ? ' · 📱 ' + escapeHtml(u.phone) : ''}</div></div><button class="btn-ghost btn-sm user-manage" data-uid="${escapeHtml(u.uid)}">Gestionar</button>`;
      ul.appendChild(li);
    });
    $$('#admUsersList .user-manage').forEach((b) => b.addEventListener('click', () => openUserSheet(b.dataset.uid)));
  }
  function openUserSheet(uid) {
    const u = panelUsers().find((x) => x.uid === uid); if (!u) return;
    userCtx = u;
    const loc = [u.torre && u.torre !== '—' ? 'Torre ' + u.torre : null, u.apto && u.apto !== '—' ? 'Apto ' + u.apto : null].filter(Boolean).join(' · ') || '—';
    let chosen = u.role === 'admin' ? 'admin' : 'guest';
    $('#userSheetContent').innerHTML = `
      <div class="login-box" style="text-align:left">
        <div class="user-detail-head"><span class="user-av user-av--big">${escapeHtml(String(u.name || u.email || 'U').charAt(0).toUpperCase())}</span><div><div class="bk-name">${escapeHtml(u.name || 'Sin nombre')}</div><div class="bk-sub">${escapeHtml(u.email || '')}</div></div></div>
        <div class="user-detail-grid">
          <div class="udg"><span>📱 Celular</span><b>${escapeHtml(u.phone || '—')}</b></div>
          <div class="udg"><span>🏢 Ubicación</span><b>${escapeHtml(loc)}</b></div>
          <div class="udg"><span>✉️ Correo</span><b>${u.emailVerified ? 'Verificado' : 'Sin verificar'}</b></div>
          <div class="udg"><span>🔑 Rol actual</span><b>${u.role === 'admin' ? 'Administrador' : 'Residente'}</b></div>
        </div>
        <h3 class="sub-h" style="margin-top:16px">Acceso al conjunto</h3>
        <div class="switch-row" style="margin-top:0">
          <div><span class="switch-title">${u.verificado ? '✓ Vecino verificado' : 'Sin el código del conjunto'}</span><span class="switch-sub">${u.verificado ? 'Puede reservar y publicar su puesto' : 'Solo puede mirar la app'}</span></div>
          <button id="urVerif" class="switch ${u.verificado ? 'is-on' : ''}" type="button" role="switch" aria-checked="${!!u.verificado}"><i></i></button>
        </div>
        <p class="hint">Actívalo a mano si el vecino es de MontReal pero no tiene el código a la mano.</p>
        <h3 class="sub-h" style="margin-top:16px">Rol en el conjunto</h3>
        <div class="segmented" id="urRole">
          <button class="seg-btn ${u.role !== 'admin' ? 'is-active' : ''}" data-role="guest" type="button">🏠 Residente</button>
          <button class="seg-btn ${u.role === 'admin' ? 'is-active' : ''}" data-role="admin" type="button">✦ Administrador</button>
        </div>
        <p class="hint">Un administrador accede al panel del conjunto, las métricas y la gestión de usuarios.</p>
        <button id="urSave" class="btn-secondary btn-block" type="button">Guardar rol</button>
        <button class="btn-ghost btn-block" type="button" data-close="user" style="margin-top:8px">Cerrar</button>
      </div>`;
    openSheet('#userSheet');
    $$('#urRole .seg-btn').forEach((b) => b.addEventListener('click', () => { chosen = b.dataset.role; $$('#urRole .seg-btn').forEach((x) => x.classList.toggle('is-active', x === b)); }));
    $('#urVerif').addEventListener('click', () => {
      const sw = $('#urVerif'), nuevo = !sw.classList.contains('is-on');
      sw.classList.toggle('is-on', nuevo); sw.setAttribute('aria-checked', String(nuevo));
      VB.setUserVerified(u.uid, nuevo)
        .then(() => { u.verificado = nuevo; toast(nuevo ? 'Vecino verificado ✓' : 'Acceso retirado'); })
        .catch(() => { sw.classList.toggle('is-on', !nuevo); toast('No se pudo cambiar el acceso', 'error'); });
    });
    $('#urSave').addEventListener('click', () => changeUserRole(u, chosen));
    $('#userSheetContent [data-close]').addEventListener('click', () => closeSheet('#userSheet'));
  }
  function changeUserRole(u, role) {
    if (role === (u.role === 'admin' ? 'admin' : 'guest')) { closeSheet('#userSheet'); return; }
    if (u.uid === (VB && VB.uid()) && role !== 'admin' && !confirm('Vas a quitarte a ti mismo el rol de administrador. ¿Continuar?')) return;
    if (devAdmin() || !user || String(u.uid).startsWith('u-')) { toast('Modo prueba: cambio de rol simulado'); closeSheet('#userSheet'); return; }
    VB.setUserRole(u.uid, role).then(() => { closeSheet('#userSheet'); successPop(); toast('Rol actualizado ✅'); })
      .catch(() => toast('No se pudo cambiar el rol', 'error'));
  }

  /* ---------- Perfil del residente + ajustes admin ---------- */
  function loadProfileUI() {
    if (!$('#pfPhone')) return;
    const p = myProfile || {};
    $('#pfPhone').value = p.phone || '';
    selectWithFallback('#pfTorre', (p.torre && p.torre !== '—') ? p.torre : '');
    selectWithFallback('#pfApto', (p.apto && p.apto !== '—') ? p.apto : '');
  }
  async function saveProfileHandler() {
    if (!user) { needLogin(); return; }
    const patch = { phone: $('#pfPhone').value.trim(), torre: $('#pfTorre').value.trim(), apto: $('#pfApto').value.trim() };
    try { $('#pfSave').disabled = true; await VB.saveProfile(patch); successPop(); toast('Información guardada ✅'); }
    catch (e) { toast('No se pudo guardar', 'error'); }
    finally { $('#pfSave').disabled = false; }
  }
  function loadAdminSettingsUI() {
    const sw = $('#adminAsGuest'); if (!sw) return;
    sw.classList.toggle('is-on', adminAsGuest); sw.setAttribute('aria-checked', String(adminAsGuest));
  }

  /* =========================================================
     Sheets util
     ========================================================= */
  /* La hoja pasa de display:none a block, así que hay que dejar pintar un frame
     con ella todavía abajo antes de subirla: si se añade todo en el mismo tick,
     el navegador no ve dos estados y no hay nada que animar. Mismo truco de los
     dos rAF que ya usan las gráficas. */
  /* Abrir y cerrar es solo poner y quitar una clase: la entrada, la salida y el
     momento de ocultar la hoja los resuelve el CSS con @starting-style y
     transition-behavior: allow-discrete. Nada depende de rAF ni de temporizadores
     —que en una pestaña en segundo plano no corren, o corren a un tick por
     segundo, y dejaban la hoja abierta pero fuera de pantalla—. */
  function openSheet(sel) { $(sel).classList.add('is-open'); $(sel).setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeSheet(sel) { $(sel).classList.remove('is-open'); $(sel).setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (sel === '#chatSheet') { stopWatchers(['msgs']); chatCtx = null; } }

  /* =========================================================
     Toasts
     ========================================================= */
  function toast(msg, type) {
    const w = $('#toasts'), t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' t-error' : '');
    t.innerHTML = `<span class="t-ico">${type === 'error' ? '!' : '✓'}</span><span>${escapeHtml(msg)}</span>`;
    // Dos a la vez como mucho: el tercero empuja al más viejo. La pila es una
    // columna flex, así que cada entrada y cada salida recolocaba de golpe a los
    // de abajo; con dos, ese salto casi no se da.
    while (w.children.length >= 2) w.firstElementChild.remove();
    w.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 200); }, 2800);
  }

  /* ---------- Micro-interacciones ---------- */
  const RIPPLE_SEL = '.btn-primary,.btn-secondary,.btn-ok,.chip,.seg-btn,.reason-btn,.role-card,.g-btn,.user-manage,.star-btn';
  function addRipple(e) {
    if (!settings.animations || prefersReduced()) return;
    const btn = e.target.closest(RIPPLE_SEL);
    if (!btn || btn.disabled) return;
    const r = btn.getBoundingClientRect(); if (r.width < 8) return;
    btn.classList.add('ripple-host');
    const ink = document.createElement('span'); ink.className = 'ripple-ink';
    const size = Math.max(r.width, r.height);
    ink.style.width = ink.style.height = size + 'px';
    ink.style.left = ((e.clientX != null ? e.clientX : r.left + r.width / 2) - r.left - size / 2) + 'px';
    ink.style.top = ((e.clientY != null ? e.clientY : r.top + r.height / 2) - r.top - size / 2) + 'px';
    btn.appendChild(ink);
    setTimeout(() => ink.remove(), 640);
  }
  /* Aviso grande en el centro: lo usamos cuando pasa algo que el vecino tiene
     que ver sí o sí, como que su solicitud quedó enviada y falta que la acepten. */
  function mostrarAviso(tipo, titulo, detalle) {
    const el = document.createElement('div');
    el.className = 'aviso-centro aviso-' + tipo;
    const ico = tipo === 'ok' ? '✓' : tipo === 'espera' ? '📨' : '!';
    el.innerHTML = `<div class="aviso-caja">
        <span class="aviso-ico">${ico}</span>
        <b>${escapeHtml(titulo)}</b>
        <p>${detalle || ''}</p>
        ${tipo === 'espera' ? '<span class="aviso-pill">⏳ Esperando confirmación</span>' : ''}
      </div>`;
    document.body.appendChild(el);
    if (navigator.vibrate) { try { navigator.vibrate([18, 28, 40]); } catch (e) {} }
    const cerrar = () => { el.classList.add('is-out'); setTimeout(() => el.remove(), 320); };
    el.addEventListener('click', cerrar);
    setTimeout(cerrar, 3800);
  }

  function successPop() {
    if (navigator.vibrate) { try { navigator.vibrate([18, 28, 40]); } catch (e) {} }
    if (!settings.animations || prefersReduced()) return;
    const el = document.createElement('div'); el.className = 'success-pop';
    el.innerHTML = '<div class="sp-circle"><svg viewBox="0 0 24 24"><path class="sp-check" d="M5 13l4 4L19 7"/></svg></div>';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1120);
  }

  /* ============================================================================
     ==================  CALCULADORA / RECIBOS / GRÁFICAS  ======================
     ============================================================================ */
  function buildTAChips() {
    const T = $('#torreChips'), P = $('#pisoChips'), A = $('#aptoChips');
    for (let t = 1; t <= TORRES; t++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.dataset.v = t; b.addEventListener('click', () => { taState.torre = taState.torre === t ? null : t; renderTA(); }); T.appendChild(b); }
    for (let p = 1; p <= PISOS; p++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = p; b.dataset.v = p; b.addEventListener('click', () => { if (taState.piso === p) { taState.piso = null; taState.unit = null; } else taState.piso = p; renderTA(); }); P.appendChild(b); }
    for (let u = 1; u <= APTOS_POR_PISO; u++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.v = u; b.addEventListener('click', () => { taState.unit = taState.unit === u ? null : u; renderTA(); }); A.appendChild(b); }
    $('#taClear').addEventListener('click', () => { taState.torre = null; taState.piso = null; taState.unit = null; renderTA(); });
  }
  /* Los selectores de torre y apartamento del conjunto: nadie escribe un 905 que no existe. */
  function fillConjuntoSelects() {
    const torres = (sel, blank) => {
      const el = $(sel); if (!el) return;
      el.innerHTML = '<option value="">' + blank + '</option>' +
        Array.from({ length: TORRES }, (_, i) => `<option value="${i + 1}">Torre ${i + 1}</option>`).join('');
    };
    torres('#pfTorre', 'Selecciona…');
    torres('#spTorre', 'Selecciona…');
    const ap = $('#pfApto');
    if (ap) {
      let html = '<option value="">Selecciona…</option>';
      for (let p = 1; p <= PISOS; p++) {
        html += `<optgroup label="Piso ${p}">`;
        for (let u = 1; u <= APTOS_POR_PISO; u++) { const n = p * 100 + u; html += `<option value="${n}">${n}</option>`; }
        html += '</optgroup>';
      }
      ap.innerHTML = html;
    }
  }
  // Un valor guardado antes (o escrito a mano) puede no estar en la lista: lo agregamos
  // para no borrarle el dato al vecino sin avisar.
  function selectWithFallback(sel, value) {
    const el = $(sel); if (!el) return;
    const v = String(value == null ? '' : value).trim();
    if (v && !Array.from(el.options).some((o) => o.value === v)) {
      const opt = document.createElement('option');
      opt.value = v; opt.textContent = v + ' (fuera del conjunto)';
      el.appendChild(opt);
    }
    el.value = v;
  }
  function renderTA() {
    $$('#torreChips .chip').forEach((c) => c.classList.toggle('is-active', +c.dataset.v === taState.torre));
    $$('#pisoChips .chip').forEach((c) => c.classList.toggle('is-active', +c.dataset.v === taState.piso));
    const hp = taState.piso != null; $('#aptoRow').classList.toggle('hidden', !hp);
    if (hp) $$('#aptoChips .chip').forEach((c) => { const u = +c.dataset.v; c.textContent = taState.piso * 100 + u; c.classList.toggle('is-active', taState.unit === u); });
    const apto = hp && taState.unit ? taState.piso * 100 + taState.unit : null;
    const parts = []; if (taState.torre) parts.push('Torre ' + taState.torre); if (apto) parts.push('Apto ' + apto);
    $('#taSummary').classList.toggle('hidden', !parts.length); if (parts.length) $('#taSummaryText').textContent = '🏢 ' + parts.join(' · ');
  }
  const getTA = () => ({ torre: taState.torre || null, apto: taState.piso && taState.unit ? taState.piso * 100 + taState.unit : null });
  function readInputs() {
    const driverName = $('#driverName').value.trim(), carModel = $('#carModel').value.trim();
    const serviceFee = parseNum($('#serviceFee').value) || 0, discount = parseNum($('#discount').value) || 0, ta = getTA();
    let kwh = 0, rs = null, re = null;
    if (mode === 'meter') { rs = parseNum($('#readingStart').value); re = parseNum($('#readingEnd').value); kwh = re - rs; }
    else kwh = parseNum($('#directKwh').value);
    return { driverName, carModel, serviceFee, discount, kwh, readingStart: rs, readingEnd: re, torre: ta.torre, apto: ta.apto };
  }
  function computeCharge() {
    const inp = readInputs(), price = settings.pricePerKwh, kwh = inp.kwh;
    const subtotal = kwh * price, total = Math.max(0, subtotal + inp.serviceFee - inp.discount);
    const eff = settings.kmPerKwh || 6, kmAdded = kwh * eff;
    const co2 = (kmAdded / GAS_KM_PER_L) * CO2_GAS_PER_L, gasCost = (kmAdded / GAS_KM_PER_L) * GAS_PRICE_PER_L;
    return Object.assign(inp, { pricePerKwh: price, subtotal, total, kmAdded, co2, savings: Math.max(0, gasCost - total) });
  }
  function validate(inp) {
    if (settings.pricePerKwh <= 0) return 'Configura el precio por kWh en Ajustes.';
    if (mode === 'meter') { if (!$('#readingStart').value.trim() || !$('#readingEnd').value.trim()) return 'Ingresa la lectura inicial y final.'; if (inp.readingEnd < inp.readingStart) return 'La lectura final debe ser mayor que la inicial.'; if (inp.kwh <= 0) return 'El consumo debe ser mayor a 0 kWh.'; }
    else if (inp.kwh <= 0) return 'Ingresa la energía consumida.';
    return null;
  }
  function updateLive() {
    const inp = readInputs(), kwh = inp.kwh > 0 ? inp.kwh : 0;
    const cost = Math.max(0, kwh * settings.pricePerKwh + inp.serviceFee - inp.discount);
    $('#liveKwh').textContent = fmtKwh(kwh); $('#liveCost').textContent = fmtCOP(cost);
    $('#liveBar').style.transform = 'scaleX(' + (clamp(kwh / 60, 0, 1)).toFixed(4) + ')';
  }
  // ---- Animación ----
  const anim = { timers: [], running: [] };
  const prefersReduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const PORT = { x: 477, y: 207 };
  function clearAnims() { anim.timers.forEach(clearTimeout); anim.timers = []; anim.running.forEach((a) => { try { a.cancel(); } catch (e) {} }); anim.running = []; }
  function setBattery(p) { p = clamp(p, 0, 100); $('#batteryFill').setAttribute('width', (p / 100 * 78).toFixed(1)); $('#batteryPct').textContent = Math.round(p) + '%'; }
  function setConsole(s, ph) { $('#roStatus').textContent = s; const cc = $('#chargeConsole'); cc.classList.toggle('is-charging', ph === 'charging'); cc.classList.toggle('is-done', ph === 'done'); }
  function buildSparks() { const g = $('#sparks'); g.innerHTML = ''; for (let i = 0; i < 7; i++) { const c = svgEl('circle', { class: 'spark', cx: (PORT.x + (Math.random() * 22 - 11)).toFixed(0), cy: (PORT.y + (Math.random() * 8 - 4)).toFixed(0), r: (Math.random() * 2 + 1.4).toFixed(1) }); c.style.setProperty('--sx', (Math.random() * 44 - 22).toFixed(0) + 'px'); c.style.animationDelay = Math.random().toFixed(2) + 's'; g.appendChild(c); } }
  const startWheels = (d) => $$('#sceneMain .wheel-spin').map((w) => w.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { duration: d, iterations: Infinity, easing: 'linear' }));
  function burstPort() { anim.running.push($('#portBurst').animate([{ opacity: 0.9, transform: 'scale(0.5)' }, { opacity: 0, transform: 'scale(2.6)' }], { duration: 480, easing: 'ease-out' })); }
  function resetScene() { const s = $('#sceneMain'); s.classList.remove('charging', 'moving'); $('.scene-holder').classList.remove('flash'); $('#evCar').style.transform = 'translateX(-560px)'; setBattery(0); $('#roKwh').textContent = '0,0'; $('#roCop').textContent = fmtCOP(0); setConsole('Conectando', 'idle'); buildSparks(); }
  function tween(dur, up, done) { const t0 = performance.now(); function step(now) { const p = clamp((now - t0) / dur, 0, 1); up(1 - Math.pow(1 - p, 3)); if (p < 1) { const id = requestAnimationFrame(step); anim.running.push({ cancel: () => cancelAnimationFrame(id) }); } else if (done) done(); } const id = requestAnimationFrame(step); anim.running.push({ cancel: () => cancelAnimationFrame(id) }); }
  const countTo = (el, a, b, d, f) => tween(d, (e) => { el.textContent = f(a + (b - a) * e); });
  function playSequence(calc) {
    clearAnims(); resetScene();
    // Desde ya es la carga vigente: si el vecino toca "Saltar" antes de que
    // termine la animación, tiene que ver ESTE cobro y no el anterior.
    lastCalc = calc;
    const scene = $('#sceneMain'), car = $('#evCar'), body = $('#carBodyGrp');
    if (prefersReduced() || !settings.animations) { car.style.transform = 'translateX(0)'; scene.classList.add('charging'); setBattery(100); $('#roKwh').textContent = fmtKwh(calc.kwh); $('#roCop').textContent = fmtCOP(calc.total); setConsole('¡Completa!', 'done'); revealResult(calc); return; }
    const ENTER = 1150, CHARGE = 2100;
    scene.classList.add('moving');
    const wheels = startWheels(480); anim.running.push.apply(anim.running, wheels);
    anim.running.push(car.animate([{ transform: 'translateX(-560px)' }, { transform: 'translateX(14px)', offset: 0.84 }, { transform: 'translateX(0px)' }], { duration: 1100, easing: 'cubic-bezier(.17,.84,.28,1)', fill: 'forwards' }));
    anim.running.push(body.animate([{ transform: 'rotate(0) translateY(0)' }, { transform: 'rotate(0) translateY(0)', offset: 0.6 }, { transform: 'rotate(1.6deg) translateY(2px)', offset: 0.8 }, { transform: 'rotate(-0.6deg) translateY(-1px)', offset: 0.92 }, { transform: 'rotate(0) translateY(0)' }], { duration: 1150, easing: 'ease-out' }));
    anim.timers.push(setTimeout(() => {
      wheels.forEach((w) => { try { w.cancel(); } catch (e) {} });
      scene.classList.remove('moving'); car.style.transform = 'translateX(0)'; burstPort(); scene.classList.add('charging'); setConsole('Cargando', 'charging');
      anim.running.push(body.animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-3px)' }, { transform: 'translateY(0)' }], { duration: 2400, iterations: Infinity, easing: 'ease-in-out' }));
      countTo($('#roKwh'), 0, calc.kwh, CHARGE - 200, (v) => fmtKwh(v)); countTo($('#roCop'), 0, calc.total, CHARGE - 200, (v) => fmtCOP(v)); tween(CHARGE - 200, (e) => setBattery(e * 100));
    }, ENTER));
    anim.timers.push(setTimeout(() => { $('#roKwh').textContent = fmtKwh(calc.kwh); $('#roCop').textContent = fmtCOP(calc.total); setBattery(100); setConsole('¡Completa!', 'done'); revealResult(calc); }, ENTER + CHARGE));
  }
  function playExit(after) {
    clearAnims(); const scene = $('#sceneMain'), car = $('#evCar'), body = $('#carBodyGrp'); scene.classList.remove('charging');
    let done = false; const finish = () => { if (done) return; done = true; scene.classList.remove('moving'); if (after) after(); };
    if (prefersReduced() || !settings.animations) { finish(); return; }
    setConsole('Desconectando', 'idle'); burstPort(); scene.classList.add('moving');
    const wheels = startWheels(400); anim.running.push.apply(anim.running, wheels);
    anim.running.push(car.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-16px)', offset: 0.16 }, { transform: 'translateX(920px)' }], { duration: 900, easing: 'cubic-bezier(.5,0,.78,.2)', fill: 'forwards' }));
    anim.timers.push(setTimeout(() => { wheels.forEach((w) => { try { w.cancel(); } catch (e) {} }); finish(); }, 940));
  }
  function skipToResult(calc) { clearAnims(); const s = $('#sceneMain'); s.classList.remove('moving'); $('#evCar').style.transform = 'translateX(0)'; s.classList.add('charging'); setBattery(100); $('#roKwh').textContent = fmtKwh(calc.kwh); $('#roCop').textContent = fmtCOP(calc.total); setConsole('¡Completa!', 'done'); revealResult(calc); }
  function openOverlay() {
    const o = $('#overlay');
    clearTimeout(o._reset);
    o.classList.add('is-open');
    o.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    $('#resultPanel').classList.remove('is-visible'); $('#skipBtn').classList.remove('hidden');
  }
  function closeOverlay() {
    const o = $('#overlay');
    o.classList.remove('is-open');
    o.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    clearAnims();
    clearTimeout(o._reset);
    // Devolver el carro a su sitio va DESPUÉS del fundido: si se hace de una, se
    // alcanza a ver saltando mientras el overlay todavía se está yendo.
    o._reset = setTimeout(() => {
      $('.scene-holder').classList.remove('flash');
      $('#evCar').style.transform = 'translateX(0)';
      setBattery(100);
    }, 200);
  }
  function buildBreakdown(c) {
    const row = (l, v, x) => `<div class="bd-row ${x || ''}"><span>${l}</span><b>${v}</b></div>`; let h = '';
    if (c.readingStart != null && (c.readingStart || c.readingEnd)) { h += row('Lectura inicial', fmtKwh(c.readingStart) + ' kWh'); h += row('Lectura final', fmtKwh(c.readingEnd) + ' kWh'); }
    h += row('Consumo', fmtKwh(c.kwh) + ' kWh'); h += row('Precio por kWh', fmtCOP(c.pricePerKwh)); h += row('Subtotal', fmtCOP(c.subtotal));
    if (c.serviceFee > 0) h += row('Tarifa de servicio', fmtCOP(c.serviceFee)); if (c.discount > 0) h += row('Descuento', '− ' + fmtCOP(c.discount));
    if (c.torre || c.apto) h += row('Ubicación', [c.torre ? 'Torre ' + c.torre : null, c.apto ? 'Apto ' + c.apto : null].filter(Boolean).join(' · '));
    h += row('Total a cobrar', fmtCOP(c.total), 'bd-total'); return h;
  }
  function revealResult(c) {
    lastCalc = c; $('#skipBtn').classList.add('hidden');
    $('#rSub').textContent = fmtKwh(c.kwh) + ' kWh · ' + fmtCOP(c.pricePerKwh) + '/kWh';
    $('#rKm').textContent = fmtNum(Math.round(c.kmAdded)) + ' km'; $('#rCo2').textContent = (c.co2).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kg'; $('#rSave').textContent = fmtCOP(c.savings || 0);
    $('#rBreakdown').innerHTML = buildBreakdown(c);
    const h = $('.scene-holder'); h.classList.add('flash'); anim.timers.push(setTimeout(() => h.classList.remove('flash'), 750));
    $('#resultPanel').classList.add('is-visible'); $('#rTotal').textContent = fmtCOP(c.total); countTo($('#rTotal'), 0, c.total, 1000, (v) => fmtCOP(v));
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
  }
  function saveSession(c) { const s = Object.assign({ id: uid8('s'), dateISO: c.dateISO || new Date().toISOString() }, c); sessions.unshift(s); persistSessions(); return s; }

  /* ---------- Historial real: las cargas también viven en la nube ---------- */
  // Lo que se guarda en Firestore de cada carga medida (sin datos de más).
  function sessionPayload(s) {
    return {
      dateISO: s.dateISO,
      driverName: s.driverName || '', carModel: s.carModel || '',
      torre: s.torre != null ? String(s.torre) : '', apto: s.apto != null ? String(s.apto) : '',
      torrePuesto: s.torrePuesto || '',
      stationId: s.stationId || '', stationName: s.stationName || '',
      kwh: round2(s.kwh), pricePerKwh: Math.round(s.pricePerKwh || 0),
      serviceFee: Math.round(s.serviceFee || 0), discount: Math.round(s.discount || 0),
      total: Math.round(s.total || 0),
      bookingId: s.bookingId || null, pagado: !!s.pagado
    };
  }
  async function pushSession(s) {
    if (!VB || !user) return null;
    const id = await VB.saveChargeSession(sessionPayload(s));
    s.remoteId = id; persistSessions();
    // Si viene de una reserva, la cerramos con los kWh reales (así el panel no la cuenta dos veces)
    if (s.bookingId) {
      try {
        await VB.updateBooking(s.bookingId, {
          estado: 'completada', kwhReal: round2(s.kwh),
          totalReal: Math.round(s.total || 0), sessionId: id
        });
      } catch (e) { /* la carga ya quedó guardada; la reserva se puede cerrar a mano */ }
    }
    return id;
  }
  // Sube de una sola vez las cargas que quedaron solo en el dispositivo.
  async function syncPendingSessions() {
    if (!VB || !user || syncDone) return;
    syncDone = true;
    const pend = sessions.filter((s) => !s.remoteId).slice(0, 60);
    if (!pend.length) return;
    let ok = 0;
    for (const s of pend) {
      try { await pushSession(s); ok++; } catch (e) { syncDone = false; break; }
    }
    if (ok) {
      persistSessions();
      toast(ok === 1 ? 'Carga sincronizada con el conjunto ☁️' : ok + ' cargas sincronizadas con el conjunto ☁️');
      if (currentView === 'analisis') renderHistory();
    }
  }
  // Reservas del anfitrión que aún no tienen una carga medida asociada.
  const linkableBookings = () => myRequests.filter((r) => (r.estado === 'confirmada' || r.estado === 'completada') && !r.kwhReal);
  function renderBookingLink() {
    const sel = $('#calcBooking'), field = $('#calcBookingField');
    if (!sel || !field) return;
    const list = linkableBookings();
    field.classList.toggle('hidden', !list.length);
    const prev = sel.value;
    sel.innerHTML = '<option value="">No, es una carga suelta</option>' + list.map((r) => {
      const fx = parseYmd(r.fecha).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      return `<option value="${escapeHtml(r.id)}">${escapeHtml(r.driverName || 'Vecino')} · ${fx} · ~${fmtKwh(r.kwhEst)} kWh</option>`;
    }).join('');
    if (list.some((r) => r.id === prev)) sel.value = prev;
  }
  async function toggleSessionPaid(localId) {
    const s = sessions.find((x) => x.id === localId); if (!s) return;
    s.pagado = !s.pagado; persistSessions(); renderHistory();
    toast(s.pagado ? 'Pago registrado 💵' : 'Pago marcado como pendiente');
    if (s.remoteId && VB && user) {
      try { await VB.updateChargeSession(s.remoteId, { pagado: !!s.pagado }); }
      catch (e) { toast('Se guardó en el dispositivo, pero no en la nube', 'error'); }
    }
  }
  const computeStats = () => sessions.reduce((a, s) => { a.earn += s.total || 0; a.kwh += s.kwh || 0; a.count++; return a; }, { earn: 0, kwh: 0, count: 0 });
  function taLabel(s) { const p = []; if (s.torre) p.push('T' + s.torre); if (s.apto) p.push(String(s.apto)); return p.join(' · '); }
  function renderHistory() {
    const st = computeStats(); $('#statEarn').textContent = fmtCOP(st.earn); $('#statKwh').innerHTML = fmtKwh(st.kwh) + ' <small>kWh</small>'; $('#statCount').textContent = st.count;
    renderBookingLink();
    const list = $('#histList'), empty = $('#histEmpty'), pend = $('#histPending'); list.innerHTML = '';
    const porCobrar = sessions.filter((s) => !s.pagado).reduce((a, s) => a + (s.total || 0), 0);
    if (pend) {
      pend.classList.toggle('hidden', porCobrar <= 0);
      if (porCobrar > 0) pend.innerHTML = '💵 Por cobrar: <b>' + fmtCOP(porCobrar) + '</b> · marca el pago cuando te llegue la transferencia.';
    }
    if (!sessions.length) { empty.classList.remove('hidden'); return; } empty.classList.add('hidden');
    sessions.forEach((s) => {
      const li = document.createElement('li'); li.className = 'hist-item'; const d = new Date(s.dateISO);
      const sub = [d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), taLabel(s) || (s.driverName ? s.carModel : ''), s.remoteId ? '☁️' : ''].filter(Boolean).join(' · ');
      li.innerHTML = `<div class="hist-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg></div><div class="hist-main"><div class="hist-title">${escapeHtml(s.driverName || s.carModel || 'Carga')}${s.pagado ? ' <span class="sc-badge b-ok">💵 Pagada</span>' : ''}</div><div class="hist-sub">${escapeHtml(sub)}</div></div><div class="hist-amount"><div class="hist-cop">${fmtCOP(s.total)}</div><div class="hist-kwh">${fmtKwh(s.kwh)} kWh</div></div><div class="hist-actions"><button class="btn-ghost btn-sm" data-pay="${s.id}">${s.pagado ? 'Sin pagar' : '💵 Pago recibido'}</button><button class="btn-ghost btn-sm" data-share="${s.id}">Compartir</button><button class="btn-ghost btn-sm btn-danger" data-del="${s.id}">Eliminar</button></div>`;
      list.appendChild(li);
    });
    $$('#histList [data-del]').forEach((b) => b.addEventListener('click', () => deleteSession(b.dataset.del)));
    $$('#histList [data-share]').forEach((b) => b.addEventListener('click', () => { const s = sessions.find((x) => x.id === b.dataset.share); if (s) shareReceipt(s); }));
    $$('#histList [data-pay]').forEach((b) => b.addEventListener('click', () => toggleSessionPaid(b.dataset.pay)));
  }
  function deleteSession(localId) {
    const s = sessions.find((x) => x.id === localId);
    sessions = sessions.filter((x) => x.id !== localId); persistSessions(); renderHistory(); renderCharts();
    if (s && s.remoteId && VB && user) VB.deleteChargeSession(s.remoteId).catch(() => {});
    toast('Carga eliminada');
  }
  function receiptText(c) {
    const L = ['⚡ *Voltio* — Recibo de carga'];
    if (settings.stationName) L.push('📍 ' + settings.stationName);
    L.push('🗓️ ' + new Date(c.dateISO || Date.now()).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' }));
    if (c.driverName) L.push('👤 ' + c.driverName);
    if (c.torre || c.apto) L.push('🏢 ' + [c.torre ? 'Torre ' + c.torre : null, c.apto ? 'Apto ' + c.apto : null].filter(Boolean).join(' · '));
    if (c.carModel) L.push('🚗 ' + c.carModel);
    L.push('──────────────');
    if (c.readingStart != null && (c.readingStart || c.readingEnd)) { L.push('Lectura inicial: ' + fmtKwh(c.readingStart) + ' kWh'); L.push('Lectura final:  ' + fmtKwh(c.readingEnd) + ' kWh'); }
    L.push('Consumo: ' + fmtKwh(c.kwh) + ' kWh'); L.push('Precio kWh: ' + fmtCOP(c.pricePerKwh));
    if (c.serviceFee > 0) L.push('Tarifa servicio: ' + fmtCOP(c.serviceFee)); if (c.discount > 0) L.push('Descuento: −' + fmtCOP(c.discount));
    L.push('──────────────'); L.push('*TOTAL: ' + fmtCOP(c.total) + '*');
    L.push('🔋 ~' + fmtNum(Math.round(c.kmAdded)) + ' km · 🌱 ' + (c.co2).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kg CO₂ evitados');
    if (settings.ownerName) L.push('Cargador de ' + settings.ownerName);
    L.push('Gracias por cargar con energía limpia ⚡'); return L.join('\n');
  }
  /* Compartir el recibo: por defecto como imagen, que es lo que la gente espera
     recibir por WhatsApp. El texto plano sigue disponible para quien lo prefiera. */
  let shareFmt = 'img';
  async function shareReceipt(c) {
    const t = receiptText(c);
    if (shareFmt === 'txt' || !window.VRecibo) {
      if (navigator.share) {
        try { await navigator.share({ title: 'Recibo Voltio', text: t }); return; }
        catch (e) { if (e && e.name === 'AbortError') return; }
      }
      window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
      return;
    }
    const btn = $('#shareBtn'), original = btn.innerHTML;
    btn.disabled = true;
    btn.textContent = shareFmt === 'pdf' ? 'Armando el PDF…' : 'Armando la imagen…';
    try {
      const r = await window.VRecibo.compartir(c, shareFmt, { texto: t, stationName: c.stationName || settings.stationName });
      if (r === 'descargado') toast(shareFmt === 'pdf' ? 'PDF guardado en tus descargas 📄' : 'Imagen guardada en tus descargas 🖼️');
    } catch (e) {
      toast('No pudimos armar el recibo. Te lo compartimos como texto.', 'error');
      if (navigator.share) { try { await navigator.share({ title: 'Recibo Voltio', text: t }); } catch (e2) {} }
      else window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
    } finally {
      btn.disabled = false;
      btn.innerHTML = original;
    }
  }
  const csvCell = (v) => { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  function download(name, content, type) { const b = new Blob([content], { type }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 200); }
  function exportCSV() {
    if (!sessions.length) { toast('No hay cargas para exportar', 'error'); return; }
    const head = ['Fecha', 'Vecino', 'Vehiculo', 'Torre', 'Apto', 'Consumo (kWh)', 'Precio kWh', 'Total (COP)', 'Pago'];
    const rows = sessions.map((s) => [new Date(s.dateISO).toLocaleString('es-CO'), s.driverName || '', s.carModel || '', s.torre || '', s.apto || '', round2(s.kwh), Math.round(s.pricePerKwh), Math.round(s.total), s.pagado ? 'Pagado' : 'Pendiente']);
    download('voltio-recibos.csv', '﻿' + [head].concat(rows).map((r) => r.map(csvCell).join(',')).join('\r\n'), 'text/csv;charset=utf-8'); toast('Recibos exportados ⬇');
  }
  // ---- Gráficas ----
  const dayKey = (d) => ymd(d);
  function bucketize() {
    if (chartState.group === 'day') {
      const days = [], now = new Date();
      for (let i = 7; i >= 0; i--) { const d = addDays(now, -i); days.push({ key: dayKey(d), label: d.getDate() + ' ' + d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', ''), cop: 0, kwh: 0, count: 0 }); }
      sessions.forEach((s) => { const b = days.find((x) => x.key === dayKey(new Date(s.dateISO))); if (b) { b.cop += s.total || 0; b.kwh += s.kwh || 0; b.count++; } });
      return days;
    }
    const map = {};
    sessions.forEach((s) => { const k = s.driverName || 'Sin nombre'; const b = map[k] || (map[k] = { key: k, label: k.length > 8 ? k.slice(0, 7) + '…' : k, full: k, cop: 0, kwh: 0, count: 0 }); b.cop += s.total || 0; b.kwh += s.kwh || 0; b.count++; });
    return Object.values(map).sort((a, b) => b.cop - a.cop).slice(0, 6);
  }
  function drawGrid(svg, X0, X1, Y0, Y1, max, m) {
    [0.25, 0.5, 0.75].forEach((f) => { svg.appendChild(svgEl('line', { x1: X0, x2: X1, y1: Y1 - (Y1 - Y0) * f, y2: Y1 - (Y1 - Y0) * f, stroke: 'rgba(255,255,255,0.06)', 'stroke-dasharray': '3 5' })); const t = svgEl('text', { x: X0, y: Y1 - (Y1 - Y0) * f - 4, class: 'chart-axis' }); t.textContent = fmtCompact(max * f, m); svg.appendChild(t); });
    const tm = svgEl('text', { x: X0, y: Y0 - 8, class: 'chart-axis' }); tm.textContent = fmtCompact(max, m); svg.appendChild(tm);
    const base = svgEl('line', { x1: X0, x2: X1, y1: Y1, y2: Y1 }); base.style.stroke = 'rgba(255,255,255,0.14)'; base.style.strokeWidth = '1.5'; svg.appendChild(base);
  }
  function drawBars(svg, bk, m) {
    const X0 = 14, X1 = 350, Y0 = 36, Y1 = 200, LABY = 220; const vals = bk.map((b) => m === 'cop' ? b.cop : b.kwh); const max = Math.max.apply(null, vals.concat([0.001])) * 1.05;
    drawGrid(svg, X0, X1, Y0, Y1, max, m); const span = (X1 - X0) / bk.length, bw = Math.min(30, span * 0.52);
    bk.forEach((b, i) => {
      const v = vals[i], cx = X0 + span * i + span / 2, zero = v <= 0, h = zero ? 3 : Math.max(6, (v / max) * (Y1 - Y0));
      const r = svgEl('rect', { x: (cx - bw / 2).toFixed(1), y: (Y1 - h).toFixed(1), width: bw.toFixed(1), height: h.toFixed(1), rx: Math.min(6, bw / 2), fill: zero ? 'rgba(255,255,255,0.06)' : 'url(#accentGrad)', class: 'chart-bar' + (zero ? ' bar-zero' : '') }); r.style.transitionDelay = (i * 55) + 'ms';
      if (!zero) { const dt = (b.full || b.label) + ': ' + fmtCOP(b.cop) + ' · ' + fmtKwh(b.kwh) + ' kWh'; r.addEventListener('click', () => toast(dt)); const t = svgEl('title', {}); t.textContent = dt; r.appendChild(t); }
      svg.appendChild(r);
      if (!zero) { const vt = svgEl('text', { x: cx.toFixed(1), y: (Y1 - h - 8).toFixed(1), 'text-anchor': 'middle', 'font-size': '9.5', 'font-weight': '700', fill: '#eaf2ff', 'font-family': 'Orbitron, sans-serif', class: 'chart-val' }); vt.style.transitionDelay = (i * 55 + 250) + 'ms'; vt.textContent = fmtCompact(v, m); svg.appendChild(vt); }
      const lt = svgEl('text', { x: cx.toFixed(1), y: LABY, 'text-anchor': 'middle', 'font-size': '9', fill: 'rgba(159,178,204,0.85)' }); lt.textContent = b.label; svg.appendChild(lt);
    });
  }
  function drawArea(svg, bk) {
    const X0 = 14, X1 = 350, Y0 = 36, Y1 = 200, LABY = 220; const vals = bk.map((b) => b.kwh); const max = Math.max.apply(null, vals.concat([0.001])) * 1.1;
    drawGrid(svg, X0, X1, Y0, Y1, max, 'kwh'); const span = (X1 - X0) / bk.length;
    const pts = bk.map((b, i) => ({ x: X0 + span * i + span / 2, y: Y1 - Math.max(0, b.kwh / max) * (Y1 - Y0), b }));
    let d = 'M ' + pts[0].x.toFixed(1) + ' ' + pts[0].y.toFixed(1);
    for (let i = 1; i < pts.length; i++) { const p0 = pts[i - 1], p1 = pts[i], mx = (p0.x + p1.x) / 2; d += ' C ' + mx.toFixed(1) + ' ' + p0.y.toFixed(1) + ', ' + mx.toFixed(1) + ' ' + p1.y.toFixed(1) + ', ' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1); }
    const area = svgEl('path', { d: d + ' L ' + pts[pts.length - 1].x.toFixed(1) + ' ' + Y1 + ' L ' + pts[0].x.toFixed(1) + ' ' + Y1 + ' Z', class: 'chart-area' }); svg.appendChild(area);
    const line = svgEl('path', { d, class: 'chart-line' }); line.style.strokeDasharray = 900; line.style.strokeDashoffset = 900; line.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(.3,.7,.3,1)'; svg.appendChild(line);
    area.style.opacity = '0'; area.style.transition = 'opacity 0.8s ease 0.3s';
    pts.forEach((p, i) => {
      const dot = svgEl('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: 3.5, class: 'chart-dot chart-val' }); dot.style.transitionDelay = (i * 60 + 300) + 'ms'; svg.appendChild(dot);
      if (p.b.kwh > 0) { const vt = svgEl('text', { x: p.x.toFixed(1), y: (p.y - 9).toFixed(1), 'text-anchor': 'middle', 'font-size': '9.5', 'font-weight': '700', fill: '#eaf2ff', 'font-family': 'Orbitron, sans-serif', class: 'chart-val' }); vt.style.transitionDelay = (i * 60 + 350) + 'ms'; vt.textContent = fmtCompact(p.b.kwh, 'kwh'); svg.appendChild(vt); }
      const lt = svgEl('text', { x: p.x.toFixed(1), y: LABY, 'text-anchor': 'middle', 'font-size': '9', fill: 'rgba(159,178,204,0.85)' }); lt.textContent = p.b.label; svg.appendChild(lt);
    });
    const rev = () => { line.style.strokeDashoffset = '0'; area.style.opacity = '1'; }; requestAnimationFrame(() => requestAnimationFrame(rev)); setTimeout(rev, 120);
  }
  function renderCharts() {
    const A = $('#chartSvgA'), B = $('#chartSvgB'), empty = $('#chartEmpty'); [A, B].forEach((s) => { s.classList.remove('chart-in'); s.innerHTML = ''; });
    const has = sessions.length > 0; $$('.chart-card').forEach((c) => c.classList.toggle('hidden', !has)); $('.chart-controls').classList.toggle('hidden', !has); empty.classList.toggle('hidden', has); if (!has) return;
    const bk = bucketize(), tCop = bk.reduce((a, b) => a + b.cop, 0), tKwh = bk.reduce((a, b) => a + b.kwh, 0), tCount = bk.reduce((a, b) => a + b.count, 0);
    $('#chartPeriod').textContent = chartState.group === 'day' ? 'Últimos 8 días' : 'Top vecinos';
    drawBars(A, bk, 'cop'); $('#chartFootA').innerHTML = `<span>Total del período</span><b>${fmtCOP(tCop)}</b>`;
    if (chartState.group === 'day') drawArea(B, bk); else drawBars(B, bk, 'kwh');
    $('#chartFootB').innerHTML = `<span>${tCount} ${tCount === 1 ? 'carga' : 'cargas'}</span><b>${fmtKwh(tKwh)} kWh</b>`;
    const rev = () => { A.classList.add('chart-in'); B.classList.add('chart-in'); }; requestAnimationFrame(() => requestAnimationFrame(rev)); setTimeout(rev, 120);
  }

  /* =========================================================
     El carro de la pantalla de inicio
     Reusamos el vehículo de la animación de cobro: se clona una sola vez,
     hereda el modelo y el color elegidos, y se muda a la vista de inicio
     del rol activo. Al administrador no se le muestra.
     ========================================================= */
  const VEH_NOMBRE = { sedan: 'automóvil', pickup: 'pickup', suv: 'SUV', '4x4': '4x4' };
  let heroCar = null;

  function buildHeroCar() {
    const src = $('#evCar');
    if (!src || heroCar) return;
    const wrap = document.createElement('div');
    wrap.className = 'hero-car';

    const svg = svgEl('svg', { viewBox: '0 100 520 212', preserveAspectRatio: 'xMidYMid meet', class: 'hero-car-svg' });
    svg.setAttribute('aria-hidden', 'true');
    svg.appendChild(svgEl('ellipse', { class: 'hero-floor-glow', cx: 262, cy: 290, rx: 250, ry: 20, fill: 'url(#glowRad)' }));
    svg.appendChild(svgEl('line', { class: 'hero-floor', x1: 22, y1: 288, x2: 502, y2: 288 }));

    const car = src.cloneNode(true);
    car.removeAttribute('id');
    car.removeAttribute('style');
    car.setAttribute('class', 'hero-ev');
    // Fuera lo que solo tiene sentido mientras se cobra una carga.
    ['#speedLines', '.car-battery', '#portBurst'].forEach((sel) => {
      const el = car.querySelector(sel); if (el) el.remove();
    });
    // Los id no pueden repetirse en la página: los pasamos a clases equivalentes
    // para que el CSS del acento los siga pintando.
    car.querySelectorAll('[id]').forEach((el) => { el.classList.add('hc-' + el.id); el.removeAttribute('id'); });
    svg.appendChild(car);

    const cap = document.createElement('div');
    cap.className = 'hero-car-caption';
    cap.innerHTML = '<b id="heroCarTitle"></b><span id="heroCarSub"></span>';

    wrap.appendChild(svg);
    wrap.appendChild(cap);
    heroCar = wrap;
  }

  function syncHeroCar() {
    if (!heroCar) return;
    // El carro puede estar fuera del DOM (vistas sin hero), así que su modelo se
    // fija aquí y no en applyVehicle, que solo alcanza lo que está en la página.
    const veh0 = settings.vehicle || 'pickup';
    heroCar.querySelectorAll('.car-model').forEach((m) => m.classList.toggle('is-active', m.dataset.model === veh0));

    const slot = effectiveMode() === 'admin' ? null
      : currentView === 'buscar' ? $('#slotBuscar')
      : currentView === 'novedades' ? $('#slotNov') : null;
    if (!slot) { if (heroCar.parentNode) heroCar.remove(); return; }
    if (heroCar.parentNode !== slot) slot.appendChild(heroCar);
    heroCar.classList.toggle('no-anim', !settings.animations || prefersReduced());

    const nombre = (user && VB && VB.userName()) ? String(VB.userName()).split(' ')[0] : '';
    const veh = VEH_NOMBRE[settings.vehicle] || 'vehículo';
    const t = $('#heroCarTitle'), s = $('#heroCarSub');
    if (t) t.textContent = nombre ? '¡Hola, ' + nombre + '!' : 'Bienvenido a Voltio';
    if (s) {
      s.textContent = !user ? 'Entra con tu cuenta y elige tu vehículo y tu color en Ajustes.'
        : currentView === 'novedades' ? 'Tu ' + veh + ' y tu puesto, listos en MontReal.'
        : 'Tu ' + veh + ', lista para cargar en MontReal.';
    }
  }

  /* =========================================================
     Ajustes
     ========================================================= */
  function applyAccent(n) { document.body.dataset.accent = n; settings.accent = n; $$('#accentRow .accent-dot').forEach((d) => d.classList.toggle('is-active', d.dataset.accent === n)); }
  function applyVehicle(v) { settings.vehicle = v; $$('.car-model').forEach((m) => m.classList.toggle('is-active', m.dataset.model === v)); $$('#vehRow .veh-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.veh === v)); }
  function syncPriceUI() {
    const p = settings.pricePerKwh, range = $('#setPriceRange'); $('#setPrice').value = p; range.value = clamp(p, +range.min, +range.max);
    range.style.setProperty('--rangePct', ((clamp(p, +range.min, +range.max) - range.min) / (range.max - range.min) * 100).toFixed(1) + '%');
    $('#priceChipValue').textContent = fmtCOP(p).replace(/\s?COP$/, ''); $$('#pricePresets .chip').forEach((c) => c.classList.toggle('is-active', +c.dataset.price === p)); updateLive();
  }
  function setPrice(p) { p = Math.max(0, Math.round(p || 0)); settings.pricePerKwh = p; persistSettings(); syncPriceUI(); }
  function loadSettingsUI() {
    applyAccent(settings.accent || 'cyan'); applyVehicle(settings.vehicle || 'pickup'); syncPriceUI();
    $('#setServiceFee').value = settings.serviceFee || ''; $('#setEff').value = settings.kmPerKwh || ''; $('#setStation').value = settings.stationName || ''; $('#setOwner').value = settings.ownerName || '';
    const sw = $('#setAnim'); sw.classList.toggle('is-on', !!settings.animations); sw.setAttribute('aria-checked', String(!!settings.animations));
    if (settings.serviceFee > 0 && !$('#serviceFee').value) $('#serviceFee').value = settings.serviceFee;
  }

  /* =========================================================
     PWA
     ========================================================= */
  function registerSW() { if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {})); }
  let deferredPrompt = null;
  function setupInstall() {
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; $('#installBtn').classList.remove('hidden'); });
    $('#installBtn').addEventListener('click', async () => { if (!deferredPrompt) return; deferredPrompt.prompt(); try { await deferredPrompt.userChoice; } catch (e) {} deferredPrompt = null; $('#installBtn').classList.add('hidden'); });
    window.addEventListener('appinstalled', () => { $('#installBtn').classList.add('hidden'); toast('¡App instalada! ⚡'); });
  }

  /* =========================================================
     Init
     ========================================================= */
  function setMode(m) { mode = m; $$('.seg-btn[data-mode]').forEach((b) => b.classList.toggle('is-active', b.dataset.mode === m)); $('#meterFields').classList.toggle('hidden', m !== 'meter'); $('#directFields').classList.toggle('hidden', m !== 'direct'); updateLive(); }
  function doCalc() {
    const err = $('#calcError'), inp = readInputs(), msg = validate(inp);
    if (msg) { err.textContent = msg; err.classList.remove('hidden'); if (navigator.vibrate) { try { navigator.vibrate([20, 40, 20]); } catch (e) {} } return; }
    err.classList.add('hidden');
    const calc = computeCharge();
    calc.dateISO = new Date().toISOString();
    // De qué puesto salió la carga: así el reporte del conjunto sabe a qué torre atribuirla
    if (myStationDoc) { calc.stationId = myStationDoc.id; calc.stationName = myStationDoc.nombre || ''; calc.torrePuesto = myStationDoc.torre || ''; }
    const sel = $('#calcBooking');
    const bkId = (sel && !$('#calcBookingField').classList.contains('hidden')) ? sel.value : '';
    if (bkId) {
      calc.bookingId = bkId;
      const rq = myRequests.find((r) => r.id === bkId);
      if (rq) {
        if (!calc.driverName) calc.driverName = rq.driverName || '';
        if (!calc.stationName) calc.stationName = rq.stationName || '';
        if (!calc.torrePuesto) calc.torrePuesto = rq.torre || '';
      }
    }
    const s = saveSession(calc);
    if (VB && user) {
      pushSession(s).catch(() => { syncDone = false; toast('La carga quedó guardada aquí; la subimos al conjunto más tarde', 'error'); });
    }
    if (sel) sel.value = '';
    renderHistory(); renderCharts(); // el historial y las gráficas quedan al día detrás del overlay
    openOverlay(); playSequence(calc);
  }
  function resetForm() { ['#readingStart', '#readingEnd', '#directKwh', '#driverName', '#carModel', '#discount'].forEach((s) => { $(s).value = ''; }); $('#serviceFee').value = settings.serviceFee > 0 ? settings.serviceFee : ''; taState.torre = null; taState.piso = null; taState.unit = null; renderTA(); updateLive(); }

  function init() {
    registerSW(); setupInstall(); fillConjuntoSelects(); buildTAChips(); renderTA(); buildAvDias(); loadSettingsUI();
    buildHeroCar();
    // Los puestos de ejemplo solo tienen sentido mientras se desarrolla:
    // en el conjunto real nadie debe ver cargadores que no existen.
    if (DEMO_ON) stations = DEMO_STATIONS.slice();
    setBattery(100);
    document.addEventListener('pointerdown', addRipple, { passive: true });

    whenVB((vb) => {
      VB = vb;
      VB.onAuth((u) => {
        const wasAdmin = isAdmin(); user = u; renderAuthUI(); startWatchers();
        if (u) { closeSheet('#loginSheet'); syncPendingSessions(); checkWompiReturn(); setupPush(); } else { syncDone = false; }
        refreshAll(); syncHeroCar(); if (!u && wasAdmin) refreshMode();
      });
      unsubs.st = VB.watchStations((list) => {
        const res = list.filter((s) => (s.conjunto || 'montreal') === CONJUNTO);
        stations = res.length ? res : (DEMO_ON ? DEMO_STATIONS.slice() : []);
        backendOff = false; hideNotice();
        if (currentView === 'buscar') runSearch();
      }, (e) => { backendOff = true; useFallback(); if (String(e && e.code).includes('permission')) showNotice('Faltan publicar las reglas de seguridad de Firestore (te muestro los puestos de ejemplo mientras tanto).'); });
    });

    // Rol / modo (el admin se resuelve cuando llega su perfil de Firestore)
    refreshMode({ keepView: true });
    $('#roleDriverBtn').addEventListener('click', () => { applyRole('driver'); toast('Modo conductor 🚗'); });
    $('#roleHostBtn').addEventListener('click', () => { applyRole('host'); toast('Modo anfitrión 🏠'); });
    $$('#roleSwitch .seg-btn').forEach((b) => b.addEventListener('click', () => { if (settings.role !== b.dataset.role) { applyRole(b.dataset.role, { keepView: true }); } }));

    $$('.nav-btn').forEach((b) => b.addEventListener('click', () => goView(b.dataset.view)));

    // Login
    $$('.js-open-login').forEach((b) => b.addEventListener('click', () => openSheet('#loginSheet')));
    $('#topAuthBtn').addEventListener('click', () => { if (user) goView('settings'); else openSheet('#loginSheet'); });
    $('#lgGoogle').addEventListener('click', async () => { $('#lgError').classList.add('hidden'); try { await VB.loginGoogle(); toast('¡Bienvenido! ⚡'); } catch (e) { $('#lgError').textContent = e.message; $('#lgError').classList.remove('hidden'); } });
    $('#lgToggle').addEventListener('click', () => { lgMode = lgMode === 'login' ? 'signup' : 'login'; $('#lgNameField').classList.toggle('hidden', lgMode !== 'signup'); $('#lgSubmit').textContent = lgMode === 'signup' ? 'Crear cuenta' : 'Entrar'; $('#lgToggle').innerHTML = lgMode === 'signup' ? '¿Ya tienes cuenta? <b>Entrar</b>' : '¿No tienes cuenta? <b>Crear una</b>'; });
    $('#lgSubmit').addEventListener('click', async () => {
      const email = $('#lgEmail').value.trim(), pass = $('#lgPass').value; $('#lgError').classList.add('hidden');
      if (!email || !pass) { $('#lgError').textContent = 'Escribe tu correo y contraseña.'; $('#lgError').classList.remove('hidden'); return; }
      try { if (lgMode === 'signup') await VB.signupEmail($('#lgName').value.trim(), email, pass); else await VB.loginEmail(email, pass); toast('¡Bienvenido! ⚡'); }
      catch (e) { $('#lgError').textContent = e.message; $('#lgError').classList.remove('hidden'); }
    });
    $('#lgPass').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('#lgSubmit').click(); });
    $('#accLogout').addEventListener('click', async () => { await VB.logout(); toast('Sesión cerrada'); });

    // Sheets close
    $$('[data-close]').forEach((el) => el.addEventListener('click', () => closeSheet('#' + el.getAttribute('data-close') + 'Sheet')));

    // Filtros de búsqueda
    const filterGroup = (sel, key, cast) => $$(sel + ' .chip').forEach((c) => c.addEventListener('click', () => { filters[key] = cast ? cast(c.dataset[Object.keys(c.dataset)[0]]) : c.dataset[Object.keys(c.dataset)[0]]; $$(sel + ' .chip').forEach((x) => x.classList.toggle('is-active', x === c)); if (key === 'day') { const pick = c.dataset.day === 'pick'; $('#fDate').classList.toggle('hidden', !pick); if (pick && !$('#fDate').value) $('#fDate').value = ymd(new Date()); filters.date = pick ? $('#fDate').value : null; } updateBandNote(); runSearch(); }));
    filterGroup('#fPort', 'port');
    filterGroup('#fPow', 'minPow', Number);
    filterGroup('#fSize', 'size');
    filterGroup('#fDay', 'day');
    filterGroup('#fBand', 'band');
    $('#fDate').addEventListener('change', () => { filters.date = $('#fDate').value; runSearch(); });
    $('#fReset').addEventListener('click', () => {
      Object.assign(filters, { port: 'todos', minPow: 0, size: 'todos', day: 'any', date: null, band: 'any' });
      [['#fPort', 'todos'], ['#fPow', '0'], ['#fSize', 'todos'], ['#fDay', 'any'], ['#fBand', 'any']].forEach(([s, v]) => $$(s + ' .chip').forEach((c) => c.classList.toggle('is-active', Object.values(c.dataset)[0] === v)));
      $('#fDate').classList.add('hidden'); updateBandNote(); runSearch(); toast('Filtros reiniciados');
    });

    // Calendario nav
    $$('.cal-arrow').forEach((b) => b.addEventListener('click', () => { calOffset[b.dataset.cal] += +b.dataset.dir; if (b.dataset.cal === 'driver') renderCalendar('#calDriver', myBookings, 'driver'); else renderCalendar('#calHost', myRequests, 'host'); }));

    // Novedades
    $('#notifEnable').addEventListener('click', requestNotifPermission);
    $('#notifEnable2').addEventListener('click', requestNotifPermission);
    $('#novChatsAll').addEventListener('click', () => goView('chats'));

    // Administración
    $('#admAddSpot').addEventListener('click', () => openAdminSpot(null));
    $('#admRepMonth').addEventListener('change', () => { repState.month = $('#admRepMonth').value; renderReporte(); });
    $('#admRepPdf').addEventListener('click', () => downloadReporte('pdf'));
    $('#admRepCsv').addEventListener('click', () => downloadReporte('csv'));
    $$('#admChartGroup .seg-btn').forEach((b) => b.addEventListener('click', () => { admChart.metric = b.dataset.agroup; $$('#admChartGroup .seg-btn').forEach((x) => x.classList.toggle('is-active', x === b)); renderAdminChart(); }));
    $('#admUserSearch').addEventListener('input', debounce(drawUsers, 150));
    $('#goPanelBtn').addEventListener('click', () => { adminAsGuest = false; localStorage.setItem(LS_ADMINGUEST, 'false'); loadAdminSettingsUI(); refreshMode(); });
    $('#adminAsGuest').addEventListener('click', () => {
      adminAsGuest = !adminAsGuest; localStorage.setItem(LS_ADMINGUEST, JSON.stringify(adminAsGuest));
      loadAdminSettingsUI(); renderAuthUI();
      if (adminAsGuest && !(settings.role === 'driver' || settings.role === 'host')) { settings.role = 'host'; persistSettings(); }
      refreshMode();
    });

    // Nombre visible, perfil del residente y código del conjunto
    $('#acNombreSave').addEventListener('click', guardarNombre);
    $('#acNombre').addEventListener('keydown', (e) => { if (e.key === 'Enter') guardarNombre(); });
    $('#pfSave').addEventListener('click', saveProfileHandler);
    $('#acSave').addEventListener('click', enviarCodigo);
    $('#acCodigo').addEventListener('keydown', (e) => { if (e.key === 'Enter') enviarCodigo(); });

    // QR de pago (formulario del anfitrión)
    $('#spQrPick').addEventListener('click', () => $('#spQrInput').click());
    $('#spQrInput').addEventListener('change', async () => { const f = $('#spQrInput').files[0]; if (!f) return; try { const url = await compressImageFile(f, 520, 0.72); spotQr = url; qrShow($('#spQrPreview'), $('#spQrImg'), $('#spQrPick'), url); toast('QR cargado 📷'); } catch (e) { toast('No se pudo procesar la imagen', 'error'); } $('#spQrInput').value = ''; });
    $('#spQrRemove').addEventListener('click', () => { spotQr = ''; qrShow($('#spQrPreview'), $('#spQrImg'), $('#spQrPick'), null); });

    // Potencia del cargador: "Otra…" abre el campo libre
    $('#spPow').addEventListener('change', () => {
      const otra = $('#spPow').value === 'otra';
      $('#spPowOtraField').classList.toggle('hidden', !otra);
      if (otra) setTimeout(() => $('#spPowOtra').focus(), 60);
    });

    // Formato del recibo al compartir
    $$('#shareFormat .seg-btn').forEach((b) => b.addEventListener('click', () => {
      shareFmt = b.dataset.fmt;
      $$('#shareFormat .seg-btn').forEach((x) => x.classList.toggle('is-active', x === b));
    }));

    // Pago en línea (Wompi)
    $('#spWompiOn').addEventListener('click', () => {
      setWompiSwitch(!$('#spWompiOn').classList.contains('is-on'));
      updateWompiState();
    });
    ['#spWompiKey', '#spWompiSecret'].forEach((s) => $(s).addEventListener('input', updateWompiState));

    // Lectura del contador con la cámara
    $$('.in-cam').forEach((b) => b.addEventListener('click', () => {
      if (!window.VOCR) { toast('El lector no está disponible', 'error'); return; }
      const target = b.dataset.cam;
      window.VOCR.open({
        label: target === 'readingStart' ? 'de antes de conectar' : 'de después de cargar',
        onUse: (v) => { $('#' + target).value = v; updateLive(); toast('Lectura registrada 📷'); }
      });
    }));

    // Fotos del puesto
    $('#spFotoPick').addEventListener('click', () => $('#spFotoInput').click());
    $('#spFotoInput').addEventListener('change', async () => {
      const f = $('#spFotoInput').files; if (f && f.length) await addSpotFotos(f);
      $('#spFotoInput').value = '';
    });
    renderSpotFotos();

    // Disponibilidad
    $('#avSave').addEventListener('click', saveAvailability);

    // Mi puesto
    $('#spSave').addEventListener('click', savePuesto);
    $('#spVisible').addEventListener('click', () => { const sw = $('#spVisible'); sw.classList.toggle('is-on'); sw.setAttribute('aria-checked', String(sw.classList.contains('is-on'))); });

    // Chat / rechazo / rating
    $('#chSend').addEventListener('click', sendChat); $('#chInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') sendChat(); });
    $$('#rejReasons .reason-btn').forEach((b) => b.addEventListener('click', () => { rejReason = b.dataset.r; $$('#rejReasons .reason-btn').forEach((x) => x.classList.toggle('on', x === b)); $('#rejOtherField').classList.toggle('hidden', b.dataset.r !== 'otro'); if (b.dataset.r === 'otro') setTimeout(() => $('#rejOther').focus(), 50); }));
    $('#rejSend').addEventListener('click', sendReject);
    $$('#rtStars .star-btn').forEach((s) => s.addEventListener('click', () => { rateStars = +s.dataset.s; $$('#rtStars .star-btn').forEach((x) => x.classList.toggle('on', +x.dataset.s <= rateStars)); }));
    $('#rtSend').addEventListener('click', sendRating);

    // Calculadora
    $$('.seg-btn[data-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
    ['#readingStart', '#readingEnd', '#directKwh', '#serviceFee', '#discount'].forEach((s) => $(s).addEventListener('input', updateLive));
    $$('#view-analisis input').forEach((el) => el.addEventListener('keydown', (e) => { if (e.key === 'Enter' && el.closest('.card') === $('#calcBtn').closest('.card')) { e.preventDefault(); doCalc(); } }));
    $('#detailsToggle').addEventListener('click', () => { const body = $('#detailsBody'); const open = body.classList.toggle('hidden') === false; $('#detailsToggle').setAttribute('aria-expanded', String(open)); });
    $('#priceChip').addEventListener('click', () => { goView('settings'); setTimeout(() => $('#setPrice').focus(), 350); });
    $('#calcBtn').addEventListener('click', doCalc);
    $('#skipBtn').addEventListener('click', () => { if (lastCalc) skipToResult(lastCalc); });
    $('.overlay-backdrop').addEventListener('click', () => { if ($('#resultPanel').classList.contains('is-visible')) playExit(closeOverlay); else if (lastCalc) skipToResult(lastCalc); });
    $('#shareBtn').addEventListener('click', () => { if (lastCalc) shareReceipt(lastCalc); });
    $('#newBtn').addEventListener('click', () => playExit(() => { closeOverlay(); resetForm(); }));
    $('#exportBtn').addEventListener('click', exportCSV); $('#exportBtn2').addEventListener('click', exportCSV);
    $('#clearHistBtn').addEventListener('click', () => {
      if (!sessions.length) { toast('El historial ya está vacío'); return; }
      const enNube = sessions.filter((s) => s.remoteId).length;
      if (!confirm('¿Borrar todo el historial de cargas?' + (enNube ? '\n\nTambién se quitarán ' + enNube + (enNube === 1 ? ' carga' : ' cargas') + ' del reporte del conjunto.' : ''))) return;
      const remotos = sessions.filter((s) => s.remoteId).map((s) => s.remoteId);
      sessions = []; persistSessions(); renderHistory(); renderCharts();
      if (VB && user) remotos.forEach((id) => VB.deleteChargeSession(id).catch(() => {}));
      toast('Historial borrado');
    });
    $$('#chartGroup .seg-btn').forEach((b) => b.addEventListener('click', () => { chartState.group = b.dataset.group; $$('#chartGroup .seg-btn').forEach((x) => x.classList.toggle('is-active', x === b)); renderCharts(); }));

    // Ajustes
    $('#setPrice').addEventListener('input', () => setPrice(parseNum($('#setPrice').value)));
    $('#setPriceRange').addEventListener('input', (e) => { if (!e.isTrusted) return; setPrice(+$('#setPriceRange').value); });
    $$('#pricePresets .chip').forEach((c) => c.addEventListener('click', () => setPrice(+c.dataset.price)));
    $('#setStation').addEventListener('input', () => { settings.stationName = $('#setStation').value.trim(); persistSettings(); });
    $('#setOwner').addEventListener('input', () => { settings.ownerName = $('#setOwner').value.trim(); persistSettings(); });
    $('#setServiceFee').addEventListener('input', () => { settings.serviceFee = Math.max(0, parseNum($('#setServiceFee').value)); persistSettings(); });
    $('#setEff').addEventListener('input', () => { settings.kmPerKwh = Math.max(0, parseNum($('#setEff').value)) || 6; persistSettings(); });
    $$('#accentRow .accent-dot').forEach((d) => d.addEventListener('click', () => { applyAccent(d.dataset.accent); persistSettings(); }));
    $$('#vehRow .veh-btn').forEach((b) => b.addEventListener('click', () => { applyVehicle(b.dataset.veh); persistSettings(); syncHeroCar(); toast('Vehículo actualizado 🚙'); }));
    $('#setAnim').addEventListener('click', () => { settings.animations = !settings.animations; const sw = $('#setAnim'); sw.classList.toggle('is-on', settings.animations); sw.setAttribute('aria-checked', String(settings.animations)); persistSettings(); });
    $('#resetBtn').addEventListener('click', () => { if (confirm('¿Restablecer datos locales (ajustes y recibos)?')) { [LS_SETTINGS, LS_SESSIONS].forEach((k) => localStorage.removeItem(k)); settings = Object.assign({}, DEFAULTS); sessions = []; loadSettingsUI(); renderHistory(); resetForm(); $('#roleGate').classList.remove('hidden'); toast('Datos locales restablecidos'); } });

    updateBandNote(); updateLive();
  }
  function updateBandNote() {
    const notes = { any: '', m: 'Franja de la mañana: 6:00 a 12:00', t: 'Franja de la tarde: 12:00 a 18:00', n: 'Franja de la noche: 18:00 a 24:00' };
    $('#bandNote').textContent = notes[filters.band] || '';
  }
  // exponer para renderAuthUI (edición de puesto)
  window.__spotEditing = false;
  // Lo que los módulos sueltos (OCR, reporte) necesitan de la app.
  window.VoltioUI = { openSheet, closeSheet, toast };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
