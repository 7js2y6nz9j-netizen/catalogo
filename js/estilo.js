/* ==================================================================
   estilo.js · Convierte una foto al estilo del catálogo:
   tinta azul sobre papel crema, con rayitas para las sombras y
   contornos oscuros, como tus dibujos. Se usa en el panel al subir
   cada foto (la original se guarda aparte y se ve al abrir la pieza).
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte;
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const suave = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

  /* Desenfoque de caja separable (rápido) */
  function desenfocar(src, w, h, r) {
    const tmp = new Float32Array(w * h), out = new Float32Array(w * h), k = 2 * r + 1;
    for (let y = 0; y < h; y++) {
      const fila = y * w;
      let acc = 0;
      for (let x = -r; x <= r; x++) acc += src[fila + Math.min(w - 1, Math.max(0, x))];
      for (let x = 0; x < w; x++) {
        tmp[fila + x] = acc / k;
        acc += src[fila + Math.min(w - 1, x + r + 1)] - src[fila + Math.max(0, x - r)];
      }
    }
    for (let x = 0; x < w; x++) {
      let acc = 0;
      for (let y = -r; y <= r; y++) acc += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = acc / k;
        acc += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
      }
    }
    return out;
  }

  /* fuente: <img>, <canvas> o ImageBitmap · devuelve un <canvas> */
  function estilizar(fuente, { lado = 720 } = {}) {
    const w0 = fuente.naturalWidth || fuente.width, h0 = fuente.naturalHeight || fuente.height;
    const k = Math.min(1, lado / Math.max(w0, h0));
    const w = Math.max(1, Math.round(w0 * k)), h = Math.max(1, Math.round(h0 * k)), n = w * h;
    const lienzo = document.createElement('canvas');
    lienzo.width = w;
    lienzo.height = h;
    const ctx = lienzo.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(fuente, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h), d = img.data;

    // 1 · luz de cada punto, con niveles automáticos (la foto se "limpia")
    const L = new Float32Array(n);
    for (let i = 0, j = 0; i < n; i++, j += 4) L[i] = (0.299 * d[j] + 0.587 * d[j + 1] + 0.114 * d[j + 2]) / 255;
    const hist = new Uint32Array(256);
    for (let i = 0; i < n; i++) hist[Math.min(255, (L[i] * 255) | 0)]++;
    let acc = 0, lo = 0, hi = 255;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.01) { lo = v; break; } }
    acc = 0;
    for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.04) { hi = v; break; } }
    const base = lo / 255, rango = Math.max(0.15, (hi - lo) / 255);
    for (let i = 0; i < n; i++) L[i] = Math.min(1, Math.max(0, (L[i] - base) / rango));

    // 2 · suavizado y contornos (diferencia entre dos desenfoques)
    const r1 = Math.max(1, Math.round(w / 480)), r2 = r1 * 3 + 1;
    const g1 = desenfocar(desenfocar(L, w, h, r1), w, h, r1);
    const g2 = desenfocar(desenfocar(L, w, h, r2), w, h, r2);

    // 3 · pintar: papel → rayitas azules → tinta sólida, y contornos oscuros
    const [pr, pg, pb] = rgb(A.colores.P), [tr, tg, tb] = rgb(A.colores.T), [or, og, ob] = rgb(A.colores.O);
    const paso = Math.max(5, w / 88);
    const TAU = Math.PI * 2;
    for (let y = 0, i = 0; y < h; y++) {
      const ondaY = y * 0.045;
      for (let x = 0; x < w; x++, i++) {
        const oscuro = Math.pow(1 - g1[i], 1.35);
        const temblor = Math.sin(ondaY + Math.sin(x * 0.02) * 2.2) * paso * 0.2;
        const t1 = 0.5 + 0.5 * Math.cos((TAU * (x + y + temblor)) / paso);
        // más papel que tinta: las rayas se engrosan poco a poco y casi nunca llegan a sólido
        const v = (oscuro - 0.2) * 0.95;
        let tinta = suave(t1 - 0.09, t1 + 0.09, v);
        if (v > 0.58) {
          const t2 = 0.5 + 0.5 * Math.cos((TAU * (x - y - temblor)) / paso);
          tinta = Math.max(tinta, suave(t2 - 0.09, t2 + 0.09, (v - 0.56) * 1.4));
        }
        if (v > 0.74) tinta = Math.max(tinta, Math.min(1, (v - 0.74) * 6));
        const borde = suave(0.03, 0.085, g2[i] - g1[i]);
        let r = pr + (tr - pr) * tinta, g = pg + (tg - pg) * tinta, b = pb + (tb - pb) * tinta;
        r += (or - r) * borde; g += (og - g) * borde; b += (ob - b) * borde;
        const grano = (((i * 2654435761) >>> 0) / 4294967296 - 0.5) * 9;
        const j = i * 4;
        d[j] = r + grano; d[j + 1] = g + grano; d[j + 2] = b + grano; d[j + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return lienzo;
  }

  window.Estilo = { estilizar };
})();
