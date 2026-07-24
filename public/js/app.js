/* =========================================================
   VOLTIO RESIDENCIAL · v2.2 — Piloto conjunto MontReal
   Búsqueda con ranking, calendario tipo Teams, reservas,
   chat, calificaciones y notificaciones (Firebase real).
   ========================================================= */
(function () {
  'use strict';

  /* ---------- Constantes ---------- */
  const LS_SETTINGS = 'voltio.res.settings.v1';
  const LS_SESSIONS = 'voltio.res.sessions.v1';
  const LS_SEEN = 'voltio.res.seen.v1';
  const CONJUNTO = 'montreal';
  const CO2_GAS_PER_L = 2.31, GAS_KM_PER_L = 12, GAS_PRICE_PER_L = 4300;
  const DIAS = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
  const DIAS_FULL = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const CAL_S = 6, CAL_E = 22;
  const DEFAULTS = { pricePerKwh: 800, serviceFee: 0, stationName: '', ownerName: '', kmPerKwh: 6, accent: 'cyan', animations: true, role: null, vehicle: 'pickup' };

  // Respaldo local: si Firestore aún no responde, la búsqueda no queda vacía
  const DEMO_STATIONS = [
    { id: 'mr-t1-ana', demo: true, ownerUid: 'voltio-demo', ownerName: 'Ana G. (Torre 1)', nombre: 'Torre 1 · Parqueadero cubierto', torre: '1', numeroParqueadero: 'P-112', puerto: 'Tipo 2', pow: 7.4, tamano: 'Mediano', precio: 900, serviceFee: 0, discount: 0, dias: [0,1,1,1,1,1,0], desde: '06:00', hasta: '22:00', breb: '@ana.montreal', titular: 'Ana Gómez', visible: true, condiciones: 'Cubierto y con cámaras. Escríbeme por el chat al llegar.', ratingSum: 47, ratingCount: 10 },
    { id: 'mr-t3-carlos', demo: true, ownerUid: 'voltio-demo', ownerName: 'Carlos R. (Torre 3)', nombre: 'Torre 3 · Toma nocturna', torre: '3', numeroParqueadero: 'P-305', puerto: 'Doméstico', pow: 3.6, tamano: 'Pequeño', precio: 800, serviceFee: 0, discount: 0, dias: [1,1,1,1,1,1,1], desde: '18:00', hasta: '23:00', breb: '@carlos3', titular: 'Carlos Ruiz', visible: true, condiciones: 'Toma de 220V, ideal para cargas nocturnas.', ratingSum: 22, ratingCount: 6 },
    { id: 'mr-t2-sofia', demo: true, ownerUid: 'voltio-demo', ownerName: 'Sofía P. (Torre 2)', nombre: 'Torre 2 · Wallbox 11 kW', torre: '2', numeroParqueadero: 'P-208', puerto: 'Tipo 2', pow: 11, tamano: 'Grande', precio: 1000, serviceFee: 1000, discount: 0, dias: [1,1,1,1,1,1,0], desde: '07:00', hasta: '21:00', breb: '@sofiap', titular: 'Sofía Peña', visible: true, condiciones: 'Wallbox rápido de 11 kW en puesto grande.', ratingSum: 58, ratingCount: 12 },
    { id: 'mr-t5-diego', demo: true, ownerUid: 'voltio-demo', ownerName: 'Diego S. (Torre 5)', nombre: 'Torre 5 · Carga rápida CCS', torre: '5', numeroParqueadero: 'P-501', puerto: 'CCS', pow: 22, tamano: 'Grande', precio: 1200, serviceFee: 0, discount: 0, dias: [0,0,0,0,0,1,1], desde: '08:00', hasta: '19:00', breb: '@diego.ev', titular: 'Diego Salas', visible: true, condiciones: 'CCS de alta potencia, solo fines de semana.', ratingSum: 30, ratingCount: 7 },
    { id: 'mr-visit', demo: true, ownerUid: 'voltio-demo', ownerName: 'Administración', nombre: 'Parqueadero de visitantes', torre: '—', numeroParqueadero: 'P-V04', puerto: 'Tipo 1', pow: 7.4, tamano: 'Mediano', precio: 950, serviceFee: 0, discount: 200, dias: [1,1,1,1,1,1,1], desde: '08:00', hasta: '20:00', breb: '@montreal.admin', titular: 'Admón. MontReal', visible: true, condiciones: 'Gestionado por la administración. Avisa en portería.', ratingSum: 41, ratingCount: 9 }
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
  const filters = { port: 'todos', minPow: 0, size: 'todos', day: 'any', date: null, band: 'any' };
  const spDias = [0, 1, 1, 1, 1, 1, 0];
  const calOffset = { driver: 0, host: 0 };

  let VB = null, user = null, backendOff = false;
  let stations = [], myBookings = [], myRequests = [], myChats = [], myStationDoc = null;
  let sheetStation = null, chatCtx = null, rateCtx = null, rateStars = 0, rejectCtx = null, rejReason = null;
  const unsubs = {};
  const seen = loadJSON(LS_SEEN, { reqs: [], msgs: {} });

  const persistSettings = () => localStorage.setItem(LS_SETTINGS, JSON.stringify(settings));
  const persistSessions = () => localStorage.setItem(LS_SESSIONS, JSON.stringify(sessions));
  const persistSeen = () => localStorage.setItem(LS_SEEN, JSON.stringify(seen));

  function whenVB(cb) {
    if (window.VB) { cb(window.VB); return; }
    window.addEventListener('vb-ready', () => cb(window.VB), { once: true });
    setTimeout(() => { if (!window.VB) { backendOff = true; useFallback(); } }, 9000);
  }
  function useFallback() {
    if (stations.length) return;
    stations = DEMO_STATIONS.slice();
    showNotice('Mostrando puestos de ejemplo. La conexión con la nube de Voltio está pendiente.');
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
    host: ['novedades', 'agenda', 'puesto', 'analisis', 'chats', 'settings']
  };
  function applyRole(role, opts) {
    settings.role = role; persistSettings();
    const list = TABS[role] || TABS.host;
    $$('.nav-btn').forEach((b) => b.classList.toggle('nav-hidden', !list.includes(b.dataset.view)));
    $('#roleTag').textContent = role === 'driver' ? 'MontReal · Busco carga' : 'MontReal · Anfitrión';
    $$('#roleSwitch .seg-btn').forEach((b) => b.classList.toggle('is-active', b.dataset.role === role));
    $('#roleGate').classList.add('hidden'); $('#roleGate').setAttribute('aria-hidden', 'true');
    if (!opts || !opts.keepView) goView(list[0]);
    else if (!list.includes(currentView)) goView(list[0]);
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
    if (name === 'settings') renderAuthUI();
    updateDots();
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
      const name = VB.userName() || 'U', photo = user.photoURL;
      top.innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt=""/>` : escapeHtml(name[0].toUpperCase());
      $('#accAvatar').innerHTML = photo ? `<img src="${escapeHtml(photo)}" alt=""/>` : escapeHtml(name[0].toUpperCase());
      $('#accName').textContent = name; $('#accEmail').textContent = user.email || '';
      const b = [];
      if (VB.isGoogle()) b.push('<span class="sc-badge b-ver">✓ Google</span>');
      if (user.emailVerified) b.push('<span class="sc-badge b-ok">✓ Correo verificado</span>');
      b.push('<span class="sc-badge b-id">🪪 Identidad: próximamente</span>');
      $('#accBadges').innerHTML = b.join('');
    } else top.textContent = '👤';
    ['#resAuth', '#novAuth', '#puestoAuth', '#chatAuth'].forEach((s) => { const el = $(s); if (el) el.classList.toggle('hidden', logged); });
    $('#resContent').classList.toggle('hidden', !logged);
    $('#novContent').classList.toggle('hidden', !logged);
    $('#puestoForm').classList.toggle('hidden', !logged || (myStationDoc && !window.__spotEditing));
  }
  function startWatchers() {
    stopWatchers(['bk', 'rq', 'ch']);
    if (!VB || !user) { myBookings = []; myRequests = []; myChats = []; refreshAll(); return; }
    unsubs.bk = VB.watchMyBookings((l) => { myBookings = l; onBookingsUpdate(); });
    unsubs.rq = VB.watchRequests((l) => { const prev = myRequests; myRequests = l; onRequestsUpdate(prev); });
    unsubs.ch = VB.watchChats((l) => { const prev = myChats; myChats = l; onChatsUpdate(prev); });
    VB.myStation().then((st) => { myStationDoc = st; if (st) loadAvailabilityUI(st); if (currentView === 'puesto') renderPuesto(); if (currentView === 'agenda') renderAgenda(); }).catch(() => {});
  }
  function stopWatchers(keys) { keys.forEach((k) => { if (unsubs[k]) { try { unsubs[k](); } catch (e) {} delete unsubs[k]; } }); }
  function refreshAll() {
    if (currentView === 'reservas') renderReservas();
    if (currentView === 'novedades') renderNovedades();
    if (currentView === 'agenda') renderAgenda();
    if (currentView === 'chats') renderChatList();
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
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/icons/icon-192.png', badge: '/icons/icon-192.png' });
      }
    } catch (e) {}
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
    ul.innerHTML = ''; empty.classList.add('hidden');

    if (!list.length) {
      head.innerHTML = '';
      empty.classList.remove('hidden');
      empty.innerHTML = '<div class="empty-icon">🔌</div><p>Aún no hay puestos publicados en MontReal.</p><span>Sé el primero: publica el tuyo desde “Ofrezco mi cargador”.</span>';
      return;
    }
    if (perfect.length) {
      head.innerHTML = `<span class="rh-count">${perfect.length} ${perfect.length === 1 ? 'puesto ideal' : 'puestos ideales'} para ti</span>`;
      perfect.forEach((sp) => ul.appendChild(spotCard(sp, [])));
      return;
    }
    // Sin coincidencia exacta → recomendaciones ordenadas por menos diferencias
    const near = evaluated.slice().sort((a, b) => a.miss.length - b.miss.length || idealSort(a.sp, b.sp));
    head.innerHTML = `<div class="rh-none">No encontramos un puesto que cumpla <b>todo</b> lo que pediste.<br/>Estas opciones son las más cercanas — en <span class="miss-red">rojo</span> lo que cambia:</div>`;
    near.forEach((e) => ul.appendChild(spotCard(e.sp, e.miss)));
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
     Agendar (booking sheet)
     ========================================================= */
  function openBookingSheet(sp) {
    if (!user) { needLogin(); return; }
    sheetStation = sp;
    const defDate = filters.day === 'hoy' ? ymd(new Date()) : filters.day === 'man' ? ymd(addDays(new Date(), 1)) : (filters.day === 'pick' && filters.date) ? filters.date : ymd(new Date());
    const [bs] = bandRange(filters.band);
    const defFrom = (filters.band !== 'any' ? String(bs).padStart(2, '0') + ':00' : (sp.desde || '08:00'));
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
      ${sp.condiciones ? `<div class="bk-pay" style="margin:0 0 14px">📋 ${escapeHtml(sp.condiciones)}</div>` : ''}
      <h3 class="sub-h">Agenda tu carga</h3>
      <div class="grid-2">
        <div class="field"><label>Fecha</label><div class="input-wrap"><input id="bkFecha" type="date" min="${ymd(new Date())}" value="${defDate}"/></div></div>
        <div class="field"><label>Energía estimada</label><div class="input-wrap"><input id="bkKwh" inputmode="decimal" value="20" autocomplete="off"/><span class="unit">kWh</span></div></div>
      </div>
      <div class="grid-2" style="margin-top:10px">
        <div class="field"><label>Desde</label><div class="input-wrap"><input id="bkFrom" type="time" value="${defFrom}"/></div></div>
        <div class="field"><label>Hasta</label><div class="input-wrap"><input id="bkTo" type="time" value="${sp.hasta || '20:00'}"/></div></div>
      </div>
      <div class="sh-est"><span>Costo estimado</span><b id="bkEst">${fmtCOP(20 * (sp.precio || 0))}</b></div>
      <button id="bkSend" class="btn-primary" type="button" style="margin-top:14px"><span class="btn-glow"></span>Enviar solicitud de reserva</button>
      <button id="bkChat" class="btn-ghost btn-block" type="button" style="margin-top:10px">💬 Prefiero preguntarle primero</button>
      <p class="hint" style="text-align:center;margin-top:8px">${sp.demo ? 'Puesto de ejemplo: la confirmación es simulada.' : 'El anfitrión recibirá tu solicitud al instante y podrá aceptarla o declinarla.'}</p>`;
    openSheet('#spotSheet');
    const est = () => $('#bkEst').textContent = fmtCOP(Math.max(0, parseNum($('#bkKwh').value)) * (sp.precio || 0));
    $('#bkKwh').addEventListener('input', est);
    $('#bkSend').addEventListener('click', () => submitBooking(sp));
    $('#bkChat').addEventListener('click', () => startChatWith(sp));
  }
  async function submitBooking(sp) {
    const fecha = $('#bkFecha').value, from = $('#bkFrom').value, to = $('#bkTo').value;
    const kwhEst = Math.max(1, parseNum($('#bkKwh').value) || 20);
    if (!fecha || !from || !to) { toast('Completa fecha y horas', 'error'); return; }
    if (hToMin(to) <= hToMin(from)) { toast('La hora final debe ser mayor', 'error'); return; }
    const wd = parseYmd(fecha).getDay(), dias = sp.dias || [1, 1, 1, 1, 1, 1, 1];
    if (!dias[wd]) { toast('Ese día el puesto no está disponible', 'error'); return; }
    if (hToMin(from) < hToMin(sp.desde) || hToMin(to) > hToMin(sp.hasta)) { toast('Elige un horario entre ' + sp.desde + ' y ' + sp.hasta, 'error'); return; }
    try {
      $('#bkSend').disabled = true;
      const id = await VB.createBooking({
        stationId: sp.id, stationName: sp.nombre, ownerUid: sp.ownerUid, ownerName: sp.ownerName || 'Anfitrión',
        torre: sp.torre || '', puerto: sp.puerto || '', breb: sp.breb || '', titular: sp.titular || '',
        precio: sp.precio || 0, fecha, from, to, kwhEst, total: kwhEst * (sp.precio || 0), demo: !!sp.demo
      });
      closeSheet('#spotSheet');
      goView('reservas');
      toast('Solicitud enviada 📨');
      if (sp.demo) demoAutoConfirm(id, sp);
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
     Reservas del conductor
     ========================================================= */
  const PILL = { pendiente: ['p-pend', 'Por confirmar'], confirmada: ['p-ok', 'Confirmada'], rechazada: ['p-no', 'Declinada'], cancelada: ['p-dim', 'Cancelada'], completada: ['p-dim', 'Completada'] };
  function renderReservas() {
    if (!user) return;
    renderCalendar('#calDriver', myBookings, 'driver');
    const ul = $('#bookList'); ul.innerHTML = '';
    $('#bookEmpty').classList.toggle('hidden', myBookings.length > 0);
    myBookings.forEach((bk) => {
      const [cls, lab] = PILL[bk.estado] || ['p-dim', bk.estado];
      const li = document.createElement('li'); li.className = 'book-card';
      const fx = parseYmd(bk.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
      li.innerHTML = `
        <div class="bk-top"><div><div class="bk-name">${escapeHtml(bk.stationName)}</div><div class="bk-sub">de ${escapeHtml(bk.ownerName || '')} · Torre ${escapeHtml(bk.torre || '—')}</div></div><span class="bk-pill ${cls}">${lab}</span></div>
        <div class="bk-meta"><span>🗓️ ${fx}</span><span>🕐 ${escapeHtml(bk.from)}–${escapeHtml(bk.to)}</span><span>💰 ${fmtCOP(bk.total)} aprox.</span></div>
        ${bk.estado === 'confirmada' ? `<div class="bk-pay">📍 Tu puesto: <span class="bk-key">${escapeHtml(bk.numeroParqueadero || 'coordinar por chat')}</span><br/>Al terminar, transfiere por <b>Bre-B</b> a <span class="bk-key">${escapeHtml(bk.breb || '—')}</span> · ${escapeHtml(bk.titular || bk.ownerName)}${bk.breb ? '<div class="bk-actions"><button class="btn-ghost btn-sm" data-copy="' + escapeHtml(bk.breb) + '">Copiar llave</button></div>' : ''}</div>` : ''}
        ${bk.estado === 'rechazada' && bk.rejectReason ? `<div class="bk-pay p-rej">✋ Motivo: ${escapeHtml(bk.rejectReason)}</div>` : ''}
        <div class="bk-actions">
          <button class="btn-ghost btn-sm" data-chat="${bk.id}">💬 Chat</button>
          ${bk.estado === 'pendiente' ? `<button class="btn-ghost btn-sm btn-danger" data-cancel="${bk.id}">Cancelar</button>` : ''}
          ${(bk.estado === 'confirmada' || bk.estado === 'completada') && !bk.ratedByDriver ? `<button class="btn-ok" data-rate="${bk.id}">⭐ Calificar</button>` : ''}
          ${bk.ratedByDriver ? '<span class="sc-badge b-ok">✓ Calificado</span>' : ''}
        </div>`;
      ul.appendChild(li);
      seen.reqs.push('b_' + bk.id + '_' + bk.estado);
    });
    persistSeen();
    $$('#bookList [data-cancel]').forEach((b) => b.addEventListener('click', () => VB.updateBooking(b.dataset.cancel, { estado: 'cancelada' }).then(() => toast('Reserva cancelada'))));
    $$('#bookList [data-copy]').forEach((b) => b.addEventListener('click', async () => { try { await navigator.clipboard.writeText(b.dataset.copy); toast('Llave copiada 📋'); } catch (e) {} }));
    $$('#bookList [data-rate]').forEach((b) => b.addEventListener('click', () => { const bk = myBookings.find((x) => x.id === b.dataset.rate); if (bk) openRate({ bookingId: bk.id, stationId: bk.stationId, toName: bk.ownerName, tipo: 'driver-host' }); }));
    $$('#bookList [data-chat]').forEach((b) => b.addEventListener('click', () => { const bk = myBookings.find((x) => x.id === b.dataset.chat); if (bk) startChatWith({ id: bk.stationId, nombre: bk.stationName, ownerUid: bk.ownerUid, ownerName: bk.ownerName, demo: bk.demo }); }));
  }

  /* =========================================================
     Novedades + solicitudes (host)
     ========================================================= */
  function renderNovedades() {
    if (!user) { renderAuthUI(); return; }
    refreshNotifBanner();
    const pend = myRequests.filter((r) => r.estado === 'pendiente');
    $('#novReqCount').textContent = pend.length ? pend.length + (pend.length === 1 ? ' nueva' : ' nuevas') : '';
    renderReqList('#novReqList', '#novReqEmpty', myRequests.slice(0, 6));
    // Chats recientes
    const cl = $('#novChatsList'); cl.innerHTML = '';
    $('#novChatsEmpty').classList.toggle('hidden', myChats.length > 0);
    const uidv = VB.uid();
    myChats.slice(0, 4).forEach((ch) => cl.appendChild(chatRow(ch, uidv)));
  }
  function renderReqList(ulSel, emptySel, list) {
    const ul = $(ulSel); ul.innerHTML = '';
    if (emptySel) $(emptySel).classList.toggle('hidden', list.length > 0);
    list.forEach((rq) => {
      const [cls, lab] = { pendiente: ['p-pend', 'Pendiente'], confirmada: ['p-ok', 'Aceptada'], rechazada: ['p-no', 'Declinada'], completada: ['p-dim', 'Completada'], cancelada: ['p-dim', 'Cancelada'] }[rq.estado] || ['p-dim', rq.estado];
      const li = document.createElement('li'); li.className = 'book-card';
      const fx = parseYmd(rq.fecha).toLocaleDateString('es-CO', { weekday: 'short', day: '2-digit', month: 'short' });
      li.innerHTML = `
        <div class="bk-top"><div><div class="bk-name">${escapeHtml(rq.driverName || 'Vecino')}</div><div class="bk-sub">quiere ${escapeHtml(rq.stationName || 'tu puesto')}</div></div><span class="bk-pill ${cls}">${lab}</span></div>
        <div class="bk-meta"><span>🗓️ ${fx}</span><span>🕐 ${escapeHtml(rq.from)}–${escapeHtml(rq.to)}</span><span>⚡ ~${fmtKwh(rq.kwhEst)} kWh</span><span>💰 ${fmtCOP(rq.total)}</span></div>
        <div class="bk-actions">
          <button class="btn-ghost btn-sm" data-chat="${rq.id}">💬 Chat</button>
          ${rq.estado === 'pendiente' ? `<button class="btn-ok" data-acc="${rq.id}">Aceptar</button><button class="btn-ghost btn-danger" data-rej="${rq.id}">Declinar</button>` : ''}
          ${rq.estado === 'confirmada' ? `<button class="btn-ghost btn-sm" data-done="${rq.id}">Completada</button>` : ''}
        </div>`;
      ul.appendChild(li);
    });
    $$(ulSel + ' [data-acc]').forEach((b) => b.addEventListener('click', () => acceptRequest(b.dataset.acc)));
    $$(ulSel + ' [data-rej]').forEach((b) => b.addEventListener('click', () => openReject(b.dataset.rej)));
    $$(ulSel + ' [data-done]').forEach((b) => b.addEventListener('click', () => VB.updateBooking(b.dataset.done, { estado: 'completada' }).then(() => toast('Carga completada 🔋'))));
    $$(ulSel + ' [data-chat]').forEach((b) => b.addEventListener('click', () => { const rq = myRequests.find((x) => x.id === b.dataset.chat); if (rq) startChatWith({ id: rq.stationId, nombre: rq.stationName, ownerUid: rq.ownerUid, ownerName: rq.driverName, demo: rq.demo }, rq.driverUid); }));
  }
  function acceptRequest(id) {
    const rq = myRequests.find((x) => x.id === id);
    const num = (myStationDoc && myStationDoc.numeroParqueadero) || '';
    VB.updateBooking(id, { estado: 'confirmada', numeroParqueadero: num }).then(() => toast('Reserva aceptada ✅ Avisamos a ' + ((rq && rq.driverName) || 'el vecino').split(' ')[0]));
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
    $('#spName').value = sp.nombre || ''; $('#spTorre').value = sp.torre || ''; $('#spNum').value = sp.numeroParqueadero || '';
    $('#spSize').value = sp.tamano || 'Mediano'; $('#spPort').value = sp.puerto || 'Tipo 2'; $('#spPow').value = String(sp.pow || 7.4);
    $('#spCond').value = sp.condiciones || ''; $('#spPrecio').value = sp.precio || ''; $('#spFee').value = sp.serviceFee || ''; $('#spDesc').value = sp.discount || '';
    $('#spBreb').value = sp.breb || ''; $('#spTitular').value = sp.titular || '';
    const sw = $('#spVisible'); sw.classList.toggle('is-on', sp.visible !== false); sw.setAttribute('aria-checked', String(sp.visible !== false));
  }
  async function savePuesto() {
    if (!user) { needLogin(); return; }
    const nombre = $('#spName').value.trim();
    if (!nombre) { toast('Ponle un nombre a tu puesto', 'error'); return; }
    const data = {
      conjunto: CONJUNTO, nombre, torre: $('#spTorre').value.trim(), numeroParqueadero: $('#spNum').value.trim(),
      tamano: $('#spSize').value, puerto: $('#spPort').value, pow: parseFloat($('#spPow').value),
      condiciones: $('#spCond').value.trim(),
      precio: Math.max(0, Math.round(parseNum($('#spPrecio').value))) || settings.pricePerKwh,
      serviceFee: Math.max(0, Math.round(parseNum($('#spFee').value))), discount: Math.max(0, Math.round(parseNum($('#spDesc').value))),
      breb: $('#spBreb').value.trim(), titular: $('#spTitular').value.trim(),
      dias: (myStationDoc && myStationDoc.dias) || spDias.slice(),
      desde: (myStationDoc && myStationDoc.desde) || '07:00', hasta: (myStationDoc && myStationDoc.hasta) || '21:00',
      fotos: (myStationDoc && myStationDoc.fotos) || [], visible: $('#spVisible').classList.contains('is-on')
    };
    try {
      $('#spSave').disabled = true; $('#spSave').textContent = 'Publicando…';
      const id = await VB.publishStation(data, myStationDoc && myStationDoc.id);
      myStationDoc = Object.assign({ id }, myStationDoc || {}, data);
      renderPuesto();
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
    try { await VB.updateBooking(rejectCtx, { estado: 'rechazada', rejectReason: reason }); closeSheet('#rejectSheet'); toast('Solicitud declinada'); }
    catch (e) { toast('Error al declinar', 'error'); }
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
      closeSheet('#rateSheet'); toast('¡Gracias por calificar! ⭐');
    } catch (e) { toast('No se pudo enviar', 'error'); }
  }

  /* =========================================================
     Sheets util
     ========================================================= */
  function openSheet(sel) { $(sel).classList.add('is-open'); $(sel).setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; }
  function closeSheet(sel) { $(sel).classList.remove('is-open'); $(sel).setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; if (sel === '#chatSheet') { stopWatchers(['msgs']); chatCtx = null; } }

  /* =========================================================
     Toasts
     ========================================================= */
  function toast(msg, type) {
    const w = $('#toasts'), t = document.createElement('div');
    t.className = 'toast' + (type === 'error' ? ' t-error' : '');
    t.innerHTML = `<span class="t-ico">${type === 'error' ? '!' : '✓'}</span><span>${escapeHtml(msg)}</span>`;
    w.appendChild(t);
    setTimeout(() => { t.classList.add('is-out'); setTimeout(() => t.remove(), 300); }, 2800);
  }

  /* ============================================================================
     ==================  CALCULADORA / RECIBOS / GRÁFICAS  ======================
     ============================================================================ */
  function buildTAChips() {
    const T = $('#torreChips'), P = $('#pisoChips'), A = $('#aptoChips');
    for (let t = 1; t <= 6; t++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = t; b.dataset.v = t; b.addEventListener('click', () => { taState.torre = taState.torre === t ? null : t; renderTA(); }); T.appendChild(b); }
    for (let p = 2; p <= 8; p++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.textContent = p; b.dataset.v = p; b.addEventListener('click', () => { if (taState.piso === p) { taState.piso = null; taState.unit = null; } else taState.piso = p; renderTA(); }); P.appendChild(b); }
    for (let u = 1; u <= 4; u++) { const b = document.createElement('button'); b.type = 'button'; b.className = 'chip'; b.dataset.v = u; b.addEventListener('click', () => { taState.unit = taState.unit === u ? null : u; renderTA(); }); A.appendChild(b); }
    $('#taClear').addEventListener('click', () => { taState.torre = null; taState.piso = null; taState.unit = null; renderTA(); });
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
    $('#liveBar').style.width = clamp(kwh / 60 * 100, 0, 100) + '%';
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
  function openOverlay() { const o = $('#overlay'); o.classList.add('is-open'); o.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden'; $('#resultPanel').classList.remove('is-visible'); $('#skipBtn').classList.remove('hidden'); }
  function closeOverlay() { const o = $('#overlay'); o.classList.remove('is-open'); o.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; $('.scene-holder').classList.remove('flash'); clearAnims(); $('#evCar').style.transform = 'translateX(0)'; setBattery(100); }
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
  const computeStats = () => sessions.reduce((a, s) => { a.earn += s.total || 0; a.kwh += s.kwh || 0; a.count++; return a; }, { earn: 0, kwh: 0, count: 0 });
  function taLabel(s) { const p = []; if (s.torre) p.push('T' + s.torre); if (s.apto) p.push(String(s.apto)); return p.join(' · '); }
  function renderHistory() {
    const st = computeStats(); $('#statEarn').textContent = fmtCOP(st.earn); $('#statKwh').innerHTML = fmtKwh(st.kwh) + ' <small>kWh</small>'; $('#statCount').textContent = st.count;
    const list = $('#histList'), empty = $('#histEmpty'); list.innerHTML = '';
    if (!sessions.length) { empty.classList.remove('hidden'); return; } empty.classList.add('hidden');
    sessions.forEach((s) => {
      const li = document.createElement('li'); li.className = 'hist-item'; const d = new Date(s.dateISO);
      const sub = [d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), taLabel(s) || (s.driverName ? s.carModel : '')].filter(Boolean).join(' · ');
      li.innerHTML = `<div class="hist-ico"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h7l-1 8 10-12h-7z"/></svg></div><div class="hist-main"><div class="hist-title">${escapeHtml(s.driverName || s.carModel || 'Carga')}</div><div class="hist-sub">${escapeHtml(sub)}</div></div><div class="hist-amount"><div class="hist-cop">${fmtCOP(s.total)}</div><div class="hist-kwh">${fmtKwh(s.kwh)} kWh</div></div><div class="hist-actions"><button class="btn-ghost btn-sm" data-share="${s.id}">Compartir</button><button class="btn-ghost btn-sm btn-danger" data-del="${s.id}">Eliminar</button></div>`;
      list.appendChild(li);
    });
    $$('#histList [data-del]').forEach((b) => b.addEventListener('click', () => { sessions = sessions.filter((x) => x.id !== b.dataset.del); persistSessions(); renderHistory(); renderCharts(); toast('Carga eliminada'); }));
    $$('#histList [data-share]').forEach((b) => b.addEventListener('click', () => { const s = sessions.find((x) => x.id === b.dataset.share); if (s) shareReceipt(s); }));
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
  async function shareReceipt(c) { const t = receiptText(c); if (navigator.share) { try { await navigator.share({ title: 'Recibo Voltio', text: t }); return; } catch (e) { if (e && e.name === 'AbortError') return; } } window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank'); }
  const csvCell = (v) => { v = v == null ? '' : String(v); return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  function download(name, content, type) { const b = new Blob([content], { type }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 200); }
  function exportCSV() {
    if (!sessions.length) { toast('No hay cargas para exportar', 'error'); return; }
    const head = ['Fecha', 'Vecino', 'Vehiculo', 'Torre', 'Apto', 'Consumo (kWh)', 'Precio kWh', 'Total (COP)'];
    const rows = sessions.map((s) => [new Date(s.dateISO).toLocaleString('es-CO'), s.driverName || '', s.carModel || '', s.torre || '', s.apto || '', round2(s.kwh), Math.round(s.pricePerKwh), Math.round(s.total)]);
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
    err.classList.add('hidden'); const calc = computeCharge(); calc.dateISO = new Date().toISOString(); saveSession(calc); openOverlay(); playSequence(calc);
  }
  function resetForm() { ['#readingStart', '#readingEnd', '#directKwh', '#driverName', '#carModel', '#discount'].forEach((s) => { $(s).value = ''; }); $('#serviceFee').value = settings.serviceFee > 0 ? settings.serviceFee : ''; taState.torre = null; taState.piso = null; taState.unit = null; renderTA(); updateLive(); }

  function init() {
    registerSW(); setupInstall(); buildTAChips(); renderTA(); buildAvDias(); loadSettingsUI();
    stations = DEMO_STATIONS.slice(); // arranque inmediato; se reemplaza con datos en vivo
    setBattery(100);

    whenVB((vb) => {
      VB = vb;
      VB.onAuth((u) => { user = u; renderAuthUI(); startWatchers(); if (u) closeSheet('#loginSheet'); refreshAll(); });
      unsubs.st = VB.watchStations((list) => {
        const res = list.filter((s) => (s.conjunto || 'montreal') === CONJUNTO);
        stations = res.length ? res : DEMO_STATIONS.slice();
        backendOff = false; hideNotice();
        if (currentView === 'buscar') runSearch();
      }, (e) => { backendOff = true; useFallback(); if (String(e && e.code).includes('permission')) showNotice('Faltan publicar las reglas de seguridad de Firestore (te muestro los puestos de ejemplo mientras tanto).'); });
    });

    // Rol
    if (settings.role === 'driver' || settings.role === 'host') applyRole(settings.role, { keepView: true });
    else { $('#roleGate').classList.remove('hidden'); $('#roleGate').setAttribute('aria-hidden', 'false'); $$('.nav-btn').forEach((b) => b.classList.toggle('nav-hidden', !TABS.host.includes(b.dataset.view))); }
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
    $('#notifEnable').addEventListener('click', async () => { try { const p = await Notification.requestPermission(); if (p === 'granted') { toast('Notificaciones activadas 🔔'); notify('Voltio MontReal', 'Te avisaremos de solicitudes y mensajes.'); } refreshNotifBanner(); } catch (e) {} });
    $('#novChatsAll').addEventListener('click', () => goView('chats'));

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
    $('#clearHistBtn').addEventListener('click', () => { if (!sessions.length) { toast('El historial ya está vacío'); return; } if (confirm('¿Borrar todo el historial de cargas?')) { sessions = []; persistSessions(); renderHistory(); renderCharts(); toast('Historial borrado'); } });
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
    $$('#vehRow .veh-btn').forEach((b) => b.addEventListener('click', () => { applyVehicle(b.dataset.veh); persistSettings(); toast('Vehículo actualizado 🚙'); }));
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

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
