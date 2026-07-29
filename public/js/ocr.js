/* =========================================================
   VOLTIO — Lectura del contador por foto (OCR)
   Expone window.VOCR. La UI vive en el sheet #ocrSheet.

   Todo pasa en el celular: la foto nunca se sube. El motor de
   reconocimiento (tesseract.js) se descarga solo la primera vez que
   alguien usa la cámara, para no cargar 4 MB a quien no la necesita.
   ========================================================= */
(function () {
  'use strict';

  const ENGINE_URL = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
  const $ = (s) => document.querySelector(s);
  const ui = () => window.VoltioUI || {};

  let engineLoading = null;   // promesa de carga del motor
  let img = null;             // Image ya cargada
  let ctx = null;             // contexto del canvas de vista previa
  const frame = { x: 10, y: 41, w: 80, h: 18 }; // marco de recorte, en % de la imagen
  let ctxTarget = null;       // { label, onUse }
  let busy = false;

  /* ---------- Motor ---------- */
  function loadEngine(onStatus) {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    if (engineLoading) return engineLoading;
    if (onStatus) onStatus('Descargando el lector (solo la primera vez)…', 0.05);
    engineLoading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = ENGINE_URL;
      s.async = true;
      s.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error('engine')));
      s.onerror = () => reject(new Error('network'));
      document.head.appendChild(s);
      setTimeout(() => reject(new Error('timeout')), 45000);
    }).catch((e) => { engineLoading = null; throw e; });
    return engineLoading;
  }

  /* ---------- Imagen ---------- */
  function fileToImage(file) {
    return new Promise((resolve, reject) => {
      if (!file || !/^image\//.test(file.type)) { reject(new Error('no-image')); return; }
      const fr = new FileReader();
      fr.onload = () => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.onerror = () => reject(new Error('img'));
        i.src = fr.result;
      };
      fr.onerror = () => reject(new Error('read'));
      fr.readAsDataURL(file);
    });
  }

  /* Umbral automático de Otsu: separa dígitos del fondo sin pedirle nada al usuario. */
  function otsu(hist, total) {
    let sum = 0;
    for (let i = 0; i < 256; i++) sum += i * hist[i];
    let sumB = 0, wB = 0, best = 0, thr = 128;
    for (let t = 0; t < 256; t++) {
      wB += hist[t];
      if (!wB) continue;
      const wF = total - wB;
      if (!wF) break;
      sumB += t * hist[t];
      const mB = sumB / wB, mF = (sum - sumB) / wF;
      const between = wB * wF * (mB - mF) * (mB - mF);
      if (between > best) { best = between; thr = t; }
    }
    return thr;
  }

  /* Recorta el marco, lo agranda y lo deja en blanco y negro limpio. */
  function buildCrop() {
    if (!img) return null;
    const sx = Math.round(img.width * frame.x / 100);
    const sy = Math.round(img.height * frame.y / 100);
    const sw = Math.max(8, Math.round(img.width * frame.w / 100));
    const sh = Math.max(8, Math.round(img.height * frame.h / 100));

    // Los dígitos se leen mejor con unos 200 px de alto.
    const scale = Math.min(6, Math.max(1, 200 / sh));
    const w = Math.round(sw * scale), h = Math.round(sh * scale);
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = 'high';
    c.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);

    const data = c.getImageData(0, 0, w, h);
    const px = data.data;
    const hist = new Uint32Array(256);
    const grey = new Uint8ClampedArray(w * h);
    for (let i = 0, p = 0; i < px.length; i += 4, p++) {
      const g = (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) | 0;
      grey[p] = g; hist[g]++;
    }
    const thr = otsu(hist, w * h);

    // Un contador puede tener números claros sobre fondo oscuro (LCD) o al revés:
    // dejamos siempre tinta oscura sobre papel blanco, que es lo que espera el motor.
    let dark = 0;
    for (let p = 0; p < grey.length; p++) if (grey[p] < thr) dark++;
    const invert = dark > grey.length * 0.55;

    for (let p = 0, i = 0; p < grey.length; p++, i += 4) {
      let on = grey[p] < thr;          // true = pertenece al trazo
      if (invert) on = !on;
      const v = on ? 0 : 255;
      px[i] = px[i + 1] = px[i + 2] = v;
      px[i + 3] = 255;
    }
    c.putImageData(data, 0, 0);
    return cv;
  }

  /* ---------- Lectura ---------- */
  async function recognize(canvas, onStatus) {
    const T = await loadEngine(onStatus);
    if (onStatus) onStatus('Preparando el lector…', 0.2);
    const worker = await T.createWorker('eng', 1, {
      logger: (m) => {
        if (!onStatus) return;
        if (m.status === 'recognizing text') onStatus('Leyendo los números…', 0.55 + m.progress * 0.45);
        else if (m.status && m.progress != null) onStatus('Preparando el lector…', 0.2 + m.progress * 0.3);
      }
    });
    try {
      await worker.setParameters({
        tessedit_char_whitelist: '0123456789.,',
        tessedit_pageseg_mode: '7',      // una sola línea de texto
        classify_bln_numeric_mode: '1'
      });
      const { data } = await worker.recognize(canvas);
      return { text: (data && data.text) || '', conf: (data && data.confidence) || 0 };
    } finally {
      try { await worker.terminate(); } catch (e) {}
    }
  }

  /* Del texto crudo saca el número más largo y lo normaliza a formato decimal. */
  function extractNumber(text) {
    const limpio = String(text || '').replace(/[^0-9.,\s]/g, ' ');
    const trozos = limpio.split(/\s+/).filter(Boolean);
    if (!trozos.length) return '';
    // Nos quedamos con el que tenga más dígitos: en un contador ese es la lectura.
    trozos.sort((a, b) => (b.replace(/\D/g, '').length - a.replace(/\D/g, '').length));
    let n = trozos[0].replace(/,/g, '.');
    const partes = n.split('.');
    if (partes.length > 2) n = partes.slice(0, -1).join('') + '.' + partes[partes.length - 1];
    n = n.replace(/^\.+/, '').replace(/\.+$/, '');
    if (!/\d/.test(n)) return '';
    // Un contador no arranca en cero a la izquierda; "008123" es 8123.
    return n.replace(/^0+(?=\d)/, '');
  }

  /* ---------- UI del sheet ---------- */
  function drawPreview() {
    const cv = $('#ocrCanvas');
    if (!cv || !img) return;
    const maxW = Math.min(cv.parentElement.clientWidth || 320, 520);
    const w = maxW, h = Math.round(img.height * (maxW / img.width));
    cv.width = w; cv.height = h;
    ctx = cv.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h);
    positionFrame();
  }
  function positionFrame() {
    const f = $('#ocrFrame'), cv = $('#ocrCanvas');
    if (!f || !cv) return;
    f.style.left = frame.x + '%';
    f.style.top = frame.y + '%';
    f.style.width = frame.w + '%';
    f.style.height = frame.h + '%';
  }
  function clampFrame() {
    frame.w = Math.min(98, Math.max(20, frame.w));
    frame.h = Math.min(60, Math.max(6, frame.h));
    frame.x = Math.min(100 - frame.w, Math.max(0, frame.x));
    frame.y = Math.min(100 - frame.h, Math.max(0, frame.y));
  }

  function show(step) {
    ['#ocrStage', '#ocrProgress', '#ocrResult'].forEach((s) => {
      const el = $(s); if (el) el.classList.add('hidden');
    });
    const pick = $('#ocrPick');
    if (pick) pick.classList.toggle('hidden', step !== 'pick');
    const el = $(step === 'stage' ? '#ocrStage' : step === 'run' ? '#ocrProgress' : step === 'result' ? '#ocrResult' : null);
    if (el) el.classList.remove('hidden');
  }
  function setError(msg) {
    const e = $('#ocrError');
    if (!e) return;
    e.textContent = msg || '';
    e.classList.toggle('hidden', !msg);
  }
  function setStatus(msg, p) {
    const s = $('#ocrStatus'), b = $('#ocrBar');
    if (s) s.textContent = msg;
    if (b) b.style.transform = 'scaleX(' + Math.min(1, Math.max(0, p || 0)).toFixed(4) + ')';
  }

  async function onPick(file) {
    setError('');
    try {
      img = await fileToImage(file);
      Object.assign(frame, { x: 10, y: 41, w: 80, h: 18 });
      const w = $('#ocrW'), h = $('#ocrH');
      if (w) w.value = String(frame.w);
      if (h) h.value = String(frame.h);
      show('stage');
      // El canvas necesita estar visible para medir su ancho.
      requestAnimationFrame(drawPreview);
    } catch (e) {
      setError('No pudimos abrir esa imagen. Intenta con otra foto.');
    }
  }

  async function run() {
    if (busy || !img) return;
    busy = true;
    setError('');
    show('run');
    setStatus('Recortando la foto…', 0.05);
    try {
      const crop = buildCrop();
      const { text, conf } = await recognize(crop, setStatus);
      const num = extractNumber(text);
      if (!num) {
        show('stage');
        setError('No logramos leer los números. Acerca el marco a la cifra, revisa la luz y prueba de nuevo.');
        return;
      }
      show('result');
      const v = $('#ocrValue');
      if (v) v.value = num;
      const c = $('#ocrConf');
      if (c) {
        c.textContent = conf >= 75
          ? '✓ Lectura clara. Confírmala y la usamos.'
          : '⚠️ La foto quedó difícil de leer: revisa el número (y el punto decimal) antes de usarlo.';
      }
    } catch (e) {
      show('stage');
      setError(e && e.message === 'network'
        ? 'No pudimos descargar el lector. Conéctate a internet e intenta otra vez, o escribe la lectura a mano.'
        : 'No pudimos leer la foto. Escribe la lectura a mano y sigue con el cobro.');
    } finally {
      busy = false;
    }
  }

  /* Arrastrar el marco sobre los números. */
  function bindDrag() {
    const holder = $('#ocrHolder'), f = $('#ocrFrame');
    if (!holder || !f) return;
    let dragging = false, resizing = false, ox = 0, oy = 0;
    const pct = (e) => {
      const r = holder.getBoundingClientRect();
      return { x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 };
    };
    holder.addEventListener('pointerdown', (e) => {
      if (!img) return;
      const p = pct(e);
      resizing = !!(e.target && e.target.classList.contains('ocr-handle'));
      dragging = !resizing;
      ox = p.x - frame.x; oy = p.y - frame.y;
      holder.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    holder.addEventListener('pointermove', (e) => {
      if (!dragging && !resizing) return;
      const p = pct(e);
      if (resizing) { frame.w = p.x - frame.x; frame.h = p.y - frame.y; }
      else { frame.x = p.x - ox; frame.y = p.y - oy; }
      clampFrame();
      positionFrame();
      const w = $('#ocrW'), h = $('#ocrH');
      if (w) w.value = String(Math.round(frame.w));
      if (h) h.value = String(Math.round(frame.h));
    });
    const end = (e) => {
      dragging = resizing = false;
      try { holder.releasePointerCapture(e.pointerId); } catch (err) {}
    };
    holder.addEventListener('pointerup', end);
    holder.addEventListener('pointercancel', end);
  }

  function bind() {
    if (!$('#ocrSheet')) return;
    $('#ocrPick').addEventListener('click', () => $('#ocrFile').click());
    $('#ocrFile').addEventListener('change', async () => {
      const f = $('#ocrFile').files && $('#ocrFile').files[0];
      $('#ocrFile').value = '';
      if (f) await onPick(f);
    });
    $('#ocrRetake').addEventListener('click', () => { show('pick'); setError(''); });
    $('#ocrAgain').addEventListener('click', () => { show('pick'); setError(''); });
    $('#ocrRun').addEventListener('click', run);
    $('#ocrW').addEventListener('input', () => { frame.w = +$('#ocrW').value; clampFrame(); positionFrame(); });
    $('#ocrH').addEventListener('input', () => { frame.h = +$('#ocrH').value; clampFrame(); positionFrame(); });
    $('#ocrUse').addEventListener('click', () => {
      const v = ($('#ocrValue').value || '').trim();
      if (!v || isNaN(parseFloat(v.replace(',', '.')))) {
        setError('Escribe un número válido antes de usarlo.');
        return;
      }
      if (ctxTarget && ctxTarget.onUse) ctxTarget.onUse(v.replace(',', '.'));
      close();
    });
    bindDrag();
    window.addEventListener('resize', () => { if (img && !$('#ocrStage').classList.contains('hidden')) drawPreview(); });
  }

  function open(opts) {
    ctxTarget = opts || {};
    img = null;
    setError('');
    show('pick');
    const sub = $('#ocrSub');
    if (sub && ctxTarget.label) {
      sub.textContent = 'Vas a registrar la lectura ' + ctxTarget.label +
        '. Toma la foto de frente, bien iluminada y con los números grandes en el encuadre.';
    }
    if (ui().openSheet) ui().openSheet('#ocrSheet');
  }
  function close() {
    if (ui().closeSheet) ui().closeSheet('#ocrSheet');
    img = null;
  }

  window.VOCR = { open, close, bind, extractNumber, loadEngine };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
