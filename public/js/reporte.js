/* =========================================================
   VOLTIO — Reporte mensual para la administración
   Genera CSV y PDF real sin dependencias ni librerías.
   Expone window.VReporte = { csv, pdf, fmt }
   El objeto "reporte" que recibe:
     { titulo, conjunto, periodo, generado, nota,
       resumen: [{ label, fmt, value }],
       tablas:  [{ titulo, cols, fmt, w, rows, total }] }
   fmt por columna: 'text' | 'int' | 'dec1' | 'cop'
   ========================================================= */
(function (root) {
  'use strict';

  /* ---------- Formatos (deterministas, estilo colombiano) ---------- */
  function miles(n) {
    const s = String(Math.abs(Math.trunc(n || 0)));
    let out = '';
    for (let i = 0; i < s.length; i++) { if (i && (s.length - i) % 3 === 0) out += '.'; out += s[i]; }
    return ((n || 0) < 0 ? '-' : '') + out;
  }
  function dec1(n) {
    const v = Math.round((n || 0) * 10) / 10, a = Math.abs(v);
    return (v < 0 ? '-' : '') + miles(Math.floor(a)) + ',' + Math.round((a - Math.floor(a)) * 10);
  }
  const cop = (n) => '$' + miles(Math.round(n || 0));
  const fmt = {
    text: (v) => String(v == null ? '' : v),
    int: (v) => miles(Math.round(v || 0)),
    dec1: dec1,
    cop: cop
  };
  // Para CSV: número "crudo" con coma decimal (Excel es-CO lo lee como número)
  const raw = {
    text: (v) => String(v == null ? '' : v),
    int: (v) => String(Math.round(v || 0)),
    dec1: (v) => String(Math.round((v || 0) * 10) / 10).replace('.', ','),
    cop: (v) => String(Math.round(v || 0))
  };
  // Un texto en una columna numérica (títulos, la etiqueta "Total") pasa tal cual.
  const show = (v, f) => (typeof v === 'string' ? v : (fmt[f] || fmt.text)(v));
  const rawOf = (v, f) => (typeof v === 'string' ? v : (raw[f] || raw.text)(v));

  /* =========================================================
     CSV (separador ';' — así lo abre Excel en español)
     ========================================================= */
  function csvCell(v) {
    v = v == null ? '' : String(v);
    return /[";\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function csv(rep) {
    const out = [];
    out.push([rep.titulo]);
    out.push([rep.conjunto + ' - ' + rep.periodo]);
    out.push(['Generado', rep.generado]);
    out.push([]);
    out.push(['Resumen']);
    (rep.resumen || []).forEach((k) => out.push([k.label, rawOf(k.value, k.fmt)]));
    (rep.tablas || []).forEach((t) => {
      out.push([]);
      out.push([t.titulo]);
      out.push(t.cols.slice());
      const line = (r) => r.map((v, i) => rawOf(v, t.fmt[i]));
      t.rows.forEach((r) => out.push(line(r)));
      if (t.total) out.push(line(t.total));
    });
    if (rep.nota) { out.push([]); out.push([rep.nota]); }
    return '﻿' + out.map((r) => r.map(csvCell).join(';')).join('\r\n');
  }

  /* =========================================================
     PDF 1.4 · Helvetica + Helvetica-Bold, WinAnsiEncoding
     ========================================================= */
  // Anchos Helvetica (por 1000 em) para los códigos 32..126
  const W_REG = [278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,556,556,333,500,278,556,500,722,500,500,500,334,260,334,584];
  const W_BOLD = [278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,611,611,389,556,333,611,556,778,556,556,500,389,280,389,584];
  // Códigos WinAnsi > 126 → letra base para estimar el ancho
  const BASE = {};
  (function () {
    const g = (from, to, ch) => { for (let c = from; c <= to; c++) BASE[c] = ch; };
    g(0xC0, 0xC5, 'A'); BASE[0xC7] = 'C'; g(0xC8, 0xCB, 'E'); g(0xCC, 0xCF, 'I');
    BASE[0xD0] = 'D'; BASE[0xD1] = 'N'; g(0xD2, 0xD6, 'O'); BASE[0xD8] = 'O';
    g(0xD9, 0xDC, 'U'); BASE[0xDD] = 'Y'; BASE[0xDF] = 'B';
    g(0xE0, 0xE5, 'a'); BASE[0xE7] = 'c'; g(0xE8, 0xEB, 'e'); g(0xEC, 0xEF, 'i');
    BASE[0xF1] = 'n'; g(0xF2, 0xF6, 'o'); BASE[0xF8] = 'o'; g(0xF9, 0xFC, 'u');
    BASE[0xFD] = 'y'; BASE[0xFF] = 'y';
    BASE[0xA1] = '!'; BASE[0xBF] = '?'; BASE[0xB7] = '.'; BASE[0xAB] = 'c'; BASE[0xBB] = 'c';
    BASE[0xBA] = 'o'; BASE[0xB0] = 'o'; BASE[0x93] = '"'; BASE[0x94] = '"'; BASE[0x96] = '-'; BASE[0x97] = '-';
  })();
  const WIN = { '€': 128, '…': 133, '‘': 145, '’': 146, '“': 147, '”': 148, '•': 149, '–': 150, '—': 151, '™': 153 };
  const SUB = { '≈': '~', '≥': '>=', '≤': '<=', '→': '->', ' ': ' ' };

  // Deja el texto en bytes WinAnsi (1 char = 1 byte) y descarta lo no imprimible (emojis)
  function win(s) {
    let out = '';
    const str = String(s == null ? '' : s);
    for (const ch of str) {
      const c = ch.codePointAt(0);
      if (c === 10 || c === 13 || c === 9) { out += ' '; continue; }
      if (c >= 32 && c <= 126) { out += ch; continue; }
      if (WIN[ch] != null) { out += String.fromCharCode(WIN[ch]); continue; }
      if (SUB[ch] != null) { out += SUB[ch]; continue; }
      if (c >= 160 && c <= 255) { out += ch; continue; }
    }
    return out.replace(/ {2,}/g, ' ').trim();
  }
  function charW(code, bold) {
    const T = bold ? W_BOLD : W_REG;
    if (code >= 32 && code <= 126) return T[code - 32];
    const b = BASE[code];
    if (b) return T[b.charCodeAt(0) - 32];
    return bold ? 611 : 556;
  }
  function widthOf(txt, size, bold) {
    let w = 0;
    for (let i = 0; i < txt.length; i++) w += charW(txt.charCodeAt(i), bold);
    return w * size / 1000;
  }
  // Parte un párrafo en líneas que caben en 'max' puntos
  function wrap(txt, size, bold, max) {
    const lines = [];
    let cur = '';
    win(txt).split(' ').forEach((w) => {
      const t = cur ? cur + ' ' + w : w;
      if (widthOf(t, size, bold) <= max) cur = t;
      else { if (cur) lines.push(cur); cur = w; }
    });
    if (cur) lines.push(cur);
    return lines;
  }
  // Recorta con puntos suspensivos para que quepa en 'max' puntos
  function ellip(txt, size, bold, max) {
    if (widthOf(txt, size, bold) <= max) return txt;
    let t = txt;
    while (t.length > 1 && widthOf(t + '…', size, bold) > max) t = t.slice(0, -1);
    return t + '…';
  }
  const esc = (t) => t.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
  const num = (n) => (Math.round(n * 100) / 100).toString();

  const PW = 595, PH = 842, ML = 40, MR = 40, MT = 46, MB = 44;
  const CW = PW - ML - MR;
  const INK = '0.10 0.13 0.19', GRAY = '0.44 0.48 0.53', LINE = '0.86 0.88 0.91';
  const TEAL = '0.05 0.49 0.55', SOFT = '0.965 0.972 0.980';

  function pdf(rep) {
    const pages = [];
    let ops = null, y = 0;

    function newPage() {
      ops = [];
      pages.push(ops);
      y = PH - MT;
    }
    function text(t, x, yy, size, bold, color, align, boxW) {
      const s = win(t);
      if (!s) return;
      let tx = x;
      if (align === 'r') tx = x + (boxW || 0) - widthOf(s, size, bold);
      else if (align === 'c') tx = x + ((boxW || 0) - widthOf(s, size, bold)) / 2;
      ops.push('BT ' + (color || INK) + ' rg /' + (bold ? 'F2' : 'F1') + ' ' + size +
        ' Tf ' + num(tx) + ' ' + num(yy) + ' Td (' + esc(s) + ') Tj ET');
    }
    function rect(x, yy, w, h, fill) { ops.push(fill + ' rg ' + num(x) + ' ' + num(yy) + ' ' + num(w) + ' ' + num(h) + ' re f'); }
    function hline(x1, x2, yy, color, wid) {
      ops.push((color || LINE) + ' RG ' + num(wid || 0.6) + ' w ' + num(x1) + ' ' + num(yy) + ' m ' + num(x2) + ' ' + num(yy) + ' l S');
    }
    function room(h) { if (y - h < MB) { newPage(); return true; } return false; }

    /* ---- Encabezado (solo la primera página) ---- */
    newPage();
    text('VOLTIO', ML, y - 12, 15, true, TEAL);
    text('Residencial', ML + widthOf('VOLTIO', 15, true) + 5, y - 12, 9.5, false, GRAY);
    text('Generado: ' + rep.generado, ML, y - 12, 8.5, false, GRAY, 'r', CW);
    y -= 22;
    hline(ML, PW - MR, y, TEAL, 1.4);
    y -= 26;
    text(rep.titulo, ML, y, 16.5, true, INK);
    y -= 16;
    text(rep.conjunto + '  ·  ' + rep.periodo, ML, y, 11, false, GRAY);
    y -= 26;

    /* ---- Resumen en tarjetas ---- */
    const ks = rep.resumen || [];
    if (ks.length) {
      const per = 4, gap = 9, bw = (CW - gap * (per - 1)) / per, bh = 46;
      for (let i = 0; i < ks.length; i += per) {
        room(bh + 10);
        const rowKs = ks.slice(i, i + per);
        rowKs.forEach((k, j) => {
          const x = ML + j * (bw + gap);
          rect(x, y - bh, bw, bh, SOFT);
          hline(x, x + bw, y - 1, TEAL, 2);
          text(k.label, x + 9, y - 17, 7.8, false, GRAY);
          text(show(k.value, k.fmt), x + 9, y - 35, 12.5, true, INK);
        });
        y -= bh + gap;
      }
      y -= 8;
    }

    /* ---- Nota metodológica (junto a las cifras que explica) ---- */
    if (rep.nota) {
      wrap(rep.nota, 7.8, false, CW).forEach((l) => { room(12); text(l, ML, y - 9, 7.8, false, GRAY); y -= 10; });
      y -= 14;
    }

    /* ---- Tablas ---- */
    (rep.tablas || []).forEach((t) => {
      const cols = t.cols, weights = t.w || cols.map(() => 1);
      const sum = weights.reduce((a, b) => a + b, 0);
      const ws = weights.map((w) => w / sum * CW);
      const xs = []; let acc = ML;
      ws.forEach((w) => { xs.push(acc); acc += w; });
      const RH = 15.5, HH = 17;
      const alignOf = (i) => (t.fmt[i] === 'text' ? 'l' : 'r');
      const cell = (v, i, row) => {
        const s = show(v, t.fmt[i]);
        return ellip(win(s), 8.3, row === 'h' || row === 't', ws[i] - 12);
      };

      function head() {
        room(HH + RH + 6);
        rect(ML, y - HH, CW, HH, SOFT);
        cols.forEach((c, i) => {
          const a = alignOf(i);
          text(cell(c, i, 'h'), xs[i] + (a === 'r' ? 0 : 6), y - 12, 8.3, true, INK, a, a === 'r' ? ws[i] - 6 : 0);
        });
        y -= HH;
        hline(ML, PW - MR, y, LINE, 0.8);
      }

      room(60);
      text(t.titulo, ML, y - 11, 11.5, true, INK);
      y -= 22;
      head();

      t.rows.forEach((r, ri) => {
        if (y - RH < MB) { newPage(); head(); }
        if (ri % 2 === 1) rect(ML, y - RH, CW, RH, SOFT);
        r.forEach((v, i) => {
          const a = alignOf(i);
          text(cell(v, i), xs[i] + (a === 'r' ? 0 : 6), y - 11, 8.3, false, INK, a, a === 'r' ? ws[i] - 6 : 0);
        });
        y -= RH;
      });
      if (!t.rows.length) { text('Sin movimientos en el periodo.', ML + 6, y - 11, 8.3, false, GRAY); y -= RH; }

      if (t.total) {
        hline(ML, PW - MR, y, LINE, 0.8);
        if (y - RH < MB) newPage();
        t.total.forEach((v, i) => {
          const a = alignOf(i);
          text(cell(v, i, 't'), xs[i] + (a === 'r' ? 0 : 6), y - 11.5, 8.6, true, INK, a, a === 'r' ? ws[i] - 6 : 0);
        });
        y -= RH;
        hline(ML, PW - MR, y, TEAL, 1);
      }
      y -= 24;
    });

    /* ---- Pie de página en todas las páginas ---- */
    const total = pages.length;
    pages.forEach((p, i) => {
      ops = p;
      hline(ML, PW - MR, MB - 10, LINE, 0.6);
      text(rep.conjunto + '  ·  ' + rep.periodo, ML, MB - 21, 7.5, false, GRAY);
      text('Página ' + (i + 1) + ' de ' + total, ML, MB - 21, 7.5, false, GRAY, 'r', CW);
    });

    return assemble(pages);
  }

  /* ---- Ensamblado del archivo PDF ---- */
  function assemble(pages) {
    const objs = [];
    const put = (body) => { objs.push(body); return objs.length; }; // devuelve el número de objeto

    const catalog = put('');            // 1 (se rellena luego)
    const pagesObj = put('');           // 2
    put('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');      // 3
    put('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'); // 4

    const kids = [];
    pages.forEach((ops) => {
      const stream = ops.join('\n');
      const cont = put('<< /Length ' + stream.length + ' >>\nstream\n' + stream + '\nendstream');
      const page = put('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PW + ' ' + PH + ']' +
        ' /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ' + cont + ' 0 R >>');
      kids.push(page + ' 0 R');
    });

    objs[catalog - 1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objs[pagesObj - 1] = '<< /Type /Pages /Kids [' + kids.join(' ') + '] /Count ' + pages.length + ' >>';

    let out = '%PDF-1.4\n%âãÏÓ\n';
    const offsets = [];
    objs.forEach((body, i) => {
      offsets.push(out.length);
      out += (i + 1) + ' 0 obj\n' + body + '\nendobj\n';
    });
    const xref = out.length;
    out += 'xref\n0 ' + (objs.length + 1) + '\n0000000000 65535 f \n';
    offsets.forEach((o) => { out += String(o).padStart(10, '0') + ' 00000 n \n'; });
    out += 'trailer\n<< /Size ' + (objs.length + 1) + ' /Root 1 0 R >>\nstartxref\n' + xref + '\n%%EOF\n';

    const bytes = new Uint8Array(out.length);
    for (let i = 0; i < out.length; i++) bytes[i] = out.charCodeAt(i) & 0xff;
    return bytes;
  }

  root.VReporte = { csv: csv, pdf: pdf, fmt: fmt, show: show };
})(typeof window !== 'undefined' ? window : globalThis);
