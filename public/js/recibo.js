/* =========================================================
   VOLTIO — Recibo compartible (imagen o PDF)
   Expone window.VRecibo. Sin dependencias.

   Dibuja el recibo directamente en un canvas, con el mismo diseño que ve el
   anfitrión en la app pero sin la escena del carro: de "Total a cobrar" hacia
   abajo. De ahí salen las dos formas de compartirlo:
     · imagen PNG  — lo que la gente espera al pasar un recibo por WhatsApp
     · PDF         — la misma composición embebida en una página, para archivar

   El PDF lleva la imagen dentro en vez de texto dibujado: así los dos formatos
   se ven idénticos y no hay que pelear con fuentes ni codificaciones.
   ========================================================= */
(function () {
  'use strict';

  const W = 720;                 // ancho de diseño; se dibuja al doble para que no pixele
  const S = 2;                   // factor de nitidez
  const PAD = 40;

  const COL = {
    fondo: '#0a0c11',
    tarjeta: '#12151c',
    tarjeta2: '#171b25',
    borde: 'rgba(255,255,255,0.09)',
    texto: '#e9edf4',
    dim: '#aab4c4',
    mute: '#828d9e'
  };

  const copFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
  const fmtCOP = (n) => copFmt.format(Math.round(n || 0));
  const fmtKwh = (n) => (Math.round((n || 0) * 100) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });

  /* El acento que el vecino tenga puesto ahora mismo. */
  function acento() {
    try {
      const cs = getComputedStyle(document.body);
      return {
        a: (cs.getPropertyValue('--accent') || '#3ad4e6').trim(),
        b: (cs.getPropertyValue('--accent-2') || '#5ee7c8').trim()
      };
    } catch (e) { return { a: '#3ad4e6', b: '#5ee7c8' }; }
  }

  const fuente = (px, peso, display) =>
    `${peso || 400} ${px}px ${display ? '"Orbitron", "Exo 2", system-ui, sans-serif' : '"Exo 2", system-ui, sans-serif'}`;

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  /* Las filas del desglose, en el mismo orden que la app. */
  function filas(c) {
    const f = [];
    if (c.readingStart != null && (c.readingStart || c.readingEnd)) {
      f.push(['Lectura inicial', fmtKwh(c.readingStart) + ' kWh']);
      f.push(['Lectura final', fmtKwh(c.readingEnd) + ' kWh']);
    }
    f.push(['Consumo', fmtKwh(c.kwh) + ' kWh']);
    f.push(['Precio por kWh', fmtCOP(c.pricePerKwh)]);
    f.push(['Subtotal', fmtCOP(c.subtotal)]);
    if (c.serviceFee > 0) f.push(['Tarifa de servicio', fmtCOP(c.serviceFee)]);
    if (c.discount > 0) f.push(['Descuento', '− ' + fmtCOP(c.discount)]);
    const ubi = [c.torre ? 'Torre ' + c.torre : null, c.apto ? 'Apto ' + c.apto : null].filter(Boolean).join(' · ');
    if (ubi) f.push(['Ubicación', ubi]);
    if (c.driverName) f.push(['Vecino', c.driverName]);
    if (c.carModel) f.push(['Vehículo', c.carModel]);
    return f;
  }

  /* ---------- El dibujo ---------- */
  function render(calc, opts) {
    const o = opts || {};
    const ac = acento();
    const rows = filas(calc);

    // Alto: cabecera + total + 3 tarjetas + filas + total final + pie
    const H = PAD + 74 + 170 + 128 + (rows.length * 46) + 76 + 96;

    const cv = document.createElement('canvas');
    cv.width = W * S;
    cv.height = Math.round(H) * S;
    const c = cv.getContext('2d');
    c.scale(S, S);
    c.textBaseline = 'alphabetic';

    // Fondo
    c.fillStyle = COL.fondo;
    c.fillRect(0, 0, W, H);
    // Un resplandor de acento arriba, como el de la app
    const glow = c.createRadialGradient(W * 0.5, 0, 0, W * 0.5, 0, W * 0.75);
    glow.addColorStop(0, ac.a + '22');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = glow;
    c.fillRect(0, 0, W, 260);

    let y = PAD + 18;

    /* --- Cabecera: marca y fecha --- */
    c.fillStyle = ac.a;
    c.font = fuente(24, 700, true);
    c.fillText('VOLTIO', PAD, y);
    const anchoMarca = c.measureText('VOLTIO').width;
    c.fillStyle = COL.mute;
    c.font = fuente(14, 500);
    c.fillText('Residencial', PAD + anchoMarca + 9, y);

    const fecha = new Date(calc.dateISO || Date.now());
    c.fillStyle = COL.mute;
    c.font = fuente(13, 500);
    c.textAlign = 'right';
    c.fillText(fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }), W - PAD, y - 8);
    c.fillText(fecha.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }), W - PAD, y + 10);
    c.textAlign = 'left';

    y += 22;
    c.strokeStyle = ac.a;
    c.lineWidth = 2;
    c.beginPath(); c.moveTo(PAD, y); c.lineTo(W - PAD, y); c.stroke();
    y += 42;

    /* --- Total a cobrar --- */
    c.textAlign = 'center';
    c.fillStyle = COL.mute;
    c.font = fuente(13, 600);
    c.fillText('TOTAL A COBRAR', W / 2, y);
    y += 60;

    c.fillStyle = ac.a;
    c.font = fuente(54, 700, true);
    c.fillText(fmtCOP(calc.total), W / 2, y);
    y += 30;

    c.fillStyle = COL.dim;
    c.font = fuente(15, 500);
    c.fillText(fmtKwh(calc.kwh) + ' kWh · ' + fmtCOP(calc.pricePerKwh) + '/kWh', W / 2, y);
    c.textAlign = 'left';
    y += 46;

    /* --- Las tres cifras del vehículo eléctrico --- */
    const tarjetas = [
      ['🔋', Math.round(calc.kmAdded || 0).toLocaleString('es-CO') + ' km', 'autonomía'],
      ['🌱', (calc.co2 || 0).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' kg', 'CO₂ evitado'],
      ['💵', fmtCOP(calc.savings || 0), 'ahorro vs gasolina']
    ];
    const anchoT = (W - PAD * 2 - 24) / 3, altoT = 104;
    tarjetas.forEach((t, i) => {
      const x = PAD + i * (anchoT + 12);
      c.fillStyle = COL.tarjeta;
      roundRect(c, x, y, anchoT, altoT, 14);
      c.fill();
      c.strokeStyle = COL.borde;
      c.lineWidth = 1;
      c.stroke();

      c.textAlign = 'center';
      c.font = fuente(22, 400);
      c.fillText(t[0], x + anchoT / 2, y + 36);
      c.fillStyle = COL.texto;
      c.font = fuente(17, 700, true);
      c.fillText(t[1], x + anchoT / 2, y + 66);
      c.fillStyle = COL.mute;
      c.font = fuente(12, 500);
      c.fillText(t[2], x + anchoT / 2, y + 87);
      c.textAlign = 'left';
    });
    y += altoT + 24;

    /* --- Desglose --- */
    const altoCaja = rows.length * 46 + 68;
    c.fillStyle = COL.tarjeta;
    roundRect(c, PAD, y, W - PAD * 2, altoCaja, 16);
    c.fill();
    c.strokeStyle = COL.borde;
    c.lineWidth = 1;
    c.stroke();

    let ry = y + 40;
    rows.forEach((r, i) => {
      c.fillStyle = COL.dim;
      c.font = fuente(15, 500);
      c.fillText(r[0], PAD + 24, ry);
      c.fillStyle = COL.texto;
      c.font = fuente(15, 600);
      c.textAlign = 'right';
      c.fillText(r[1], W - PAD - 24, ry);
      c.textAlign = 'left';
      if (i < rows.length - 1) {
        c.strokeStyle = 'rgba(255,255,255,0.06)';
        c.lineWidth = 1;
        c.beginPath(); c.moveTo(PAD + 24, ry + 15); c.lineTo(W - PAD - 24, ry + 15); c.stroke();
      }
      ry += 46;
    });

    // Total, resaltado
    ry += 4;
    c.strokeStyle = ac.a + '55';
    c.lineWidth = 1.4;
    c.beginPath(); c.moveTo(PAD + 24, ry - 16); c.lineTo(W - PAD - 24, ry - 16); c.stroke();
    c.fillStyle = COL.texto;
    c.font = fuente(17, 700);
    c.fillText('Total a cobrar', PAD + 24, ry + 14);
    c.fillStyle = ac.a;
    c.font = fuente(20, 700, true);
    c.textAlign = 'right';
    c.fillText(fmtCOP(calc.total), W - PAD - 24, ry + 14);
    c.textAlign = 'left';
    y += altoCaja + 34;

    /* --- Pie --- */
    c.textAlign = 'center';
    c.fillStyle = COL.mute;
    c.font = fuente(13, 500);
    const puesto = calc.stationName || o.stationName || '';
    if (puesto) { c.fillText('⚡ ' + puesto, W / 2, y); y += 22; }
    c.fillText('Recibo generado con Voltio Residencial', W / 2, y);
    y += 20;
    c.fillStyle = ac.a;
    c.font = fuente(13, 600);
    c.fillText('voltio-red.web.app', W / 2, y);
    c.textAlign = 'left';

    return cv;
  }

  /* ---------- Salidas ---------- */
  const canvasToBlob = (cv, tipo, calidad) => new Promise((res, rej) => {
    cv.toBlob((b) => (b ? res(b) : rej(new Error('canvas'))), tipo, calidad);
  });

  /* JPEG y no PNG: el mismo recibo pasa de ~740 KB a ~150 KB y el texto sigue
     nítido porque el lienzo se dibuja al doble de tamaño. Importa: esto se manda
     por WhatsApp, muchas veces con datos móviles. */
  async function toImagen(calc, opts) {
    return canvasToBlob(render(calc, opts), 'image/jpeg', 0.94);
  }

  /* PDF de una página con la imagen dentro (JPEG por /DCTDecode).
     Embeber la imagen evita tener que incrustar fuentes: el PDF sale idéntico
     a lo que el vecino vio en pantalla. */
  async function toPDF(calc, opts) {
    const cv = render(calc, opts);
    const dataUrl = cv.toDataURL('image/jpeg', 0.92);
    const b64 = dataUrl.split(',')[1];
    const bin = atob(b64);
    const img = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) img[i] = bin.charCodeAt(i);

    // Página del tamaño de la imagen a 96 dpi → puntos PDF (72 dpi)
    const pw = (cv.width / S) * 0.75, ph = (cv.height / S) * 0.75;
    const objs = [];
    objs.push('<< /Type /Catalog /Pages 2 0 R >>');
    objs.push('<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    objs.push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + pw.toFixed(2) + ' ' + ph.toFixed(2) +
      '] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>');
    objs.push('<< /Type /XObject /Subtype /Image /Width ' + cv.width + ' /Height ' + cv.height +
      ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.length + ' >>\nstream\n STREAM \nendstream');
    const contenido = 'q ' + pw.toFixed(2) + ' 0 0 ' + ph.toFixed(2) + ' 0 0 cm /Im0 Do Q';
    objs.push('<< /Length ' + contenido.length + ' >>\nstream\n' + contenido + '\nendstream');

    // Montamos el archivo byte a byte porque la imagen es binaria.
    const partes = [];
    let pos = 0;
    const push = (u8) => { partes.push(u8); pos += u8.length; };
    const txt = (s) => { const a = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i) & 0xff; return a; };

    push(txt('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n'));
    const offsets = [];
    objs.forEach((cuerpo, i) => {
      offsets.push(pos);
      const cab = (i + 1) + ' 0 obj\n';
      if (cuerpo.indexOf(' STREAM ') >= 0) {
        const [antes, despues] = cuerpo.split(' STREAM ');
        push(txt(cab + antes));
        push(img);
        push(txt(despues + '\nendobj\n'));
      } else {
        push(txt(cab + cuerpo + '\nendobj\n'));
      }
    });
    const xref = pos;
    let tabla = 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach((off) => { tabla += String(off).padStart(10, '0') + ' 00000 n \n'; });
    tabla += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';
    push(txt(tabla));

    return new Blob(partes, { type: 'application/pdf' });
  }

  function nombreArchivo(calc, ext) {
    const d = new Date(calc.dateISO || Date.now());
    const f = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    return 'recibo-voltio-' + f + '.' + ext;
  }

  function descargar(blob, nombre) {
    const u = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = u; a.download = nombre;
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(u); a.remove(); }, 400);
  }

  /* Comparte el recibo. Si el sistema no sabe compartir archivos (escritorio,
     navegadores viejos), lo descarga y avisa: nunca se queda sin hacer nada. */
  async function compartir(calc, formato, opts) {
    const fmt = formato === 'pdf' ? 'pdf' : 'img';
    const blob = fmt === 'pdf' ? await toPDF(calc, opts) : await toImagen(calc, opts);
    const nombre = nombreArchivo(calc, fmt === 'pdf' ? 'pdf' : 'jpg');
    const file = new File([blob], nombre, { type: blob.type });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: 'Recibo Voltio', text: (opts && opts.texto) || '' });
        return 'compartido';
      } catch (e) {
        if (e && e.name === 'AbortError') return 'cancelado';
      }
    }
    descargar(blob, nombre);
    return 'descargado';
  }

  window.VRecibo = { render, toImagen, toPDF, compartir, descargar, nombreArchivo };
})();
