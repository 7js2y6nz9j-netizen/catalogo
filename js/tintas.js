/* ==================================================================
   tintas.js · La gama de colores para la tinta de cada pieza
   ------------------------------------------------------------------
   Los dibujos de tus fotos se guardan en azul; aquí se "vuelven a
   entintar" del color que elijas con un filtro SVG, así puedes
   cambiarlo cuando quieras sin volver a subir nada.

   La gama sigue la idea de los marcadores (como tu referencia):
   · 13 familias de color, cada una con 3 intensidades
       0 viva · 2 media · 5 suave
     y 5 niveles de luz (2 claro · 4 · 5 · 6 · 8 oscuro), sin
     casi-blancos ni casi-negros → 13 × 15 = 195 colores
   · y solo unos pocos neutros (6): 201 colores en total
   · código = familia + intensidad + luz; B26 es exactamente tu azul
     talavera (el color de siempre)
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte;
  const { T, P } = A.colores;
  const NS = 'http://www.w3.org/2000/svg';

  const FAMILIAS = [
    { k: 'Y', nombre: 'Amarillo', h: 50 },
    { k: 'YR', nombre: 'Naranja', h: 30 },
    { k: 'RO', nombre: 'Coral', h: 14 },
    { k: 'R', nombre: 'Rojo', h: 356 },
    { k: 'RV', nombre: 'Rosa', h: 332 },
    { k: 'M', nombre: 'Magenta', h: 305 },
    { k: 'V', nombre: 'Violeta', h: 278 },
    { k: 'BV', nombre: 'Índigo', h: 250 },
    { k: 'B', nombre: 'Azul', h: 228 },
    { k: 'BG', nombre: 'Turquesa', h: 188 },
    { k: 'G', nombre: 'Verde', h: 140 },
    { k: 'YG', nombre: 'Verde limón', h: 88 },
    { k: 'E', nombre: 'Tierra', h: 26, tierra: true },
  ];
  const GRUPOS = [{ d: '0', nombre: 'viva', s: 88 }, { d: '2', nombre: 'media', s: 64 }, { d: '5', nombre: 'suave', s: 40 }];
  const NIVELES = [{ d: '2', l: 72 }, { d: '4', l: 62 }, { d: '5', l: 52 }, { d: '6', l: 42 }, { d: '8', l: 32 }];
  // unos pocos neutros (sin blancos ni negros puros)
  const NEUTROS = [
    { codigo: 'N2', nombre: 'Gris claro', h: 0, s: 0, l: 74 },
    { codigo: 'N5', nombre: 'Gris medio', h: 0, s: 0, l: 55 },
    { codigo: 'N8', nombre: 'Gris oscuro', h: 0, s: 0, l: 35 },
    { codigo: 'W4', nombre: 'Gris cálido', h: 34, s: 16, l: 58 },
    { codigo: 'C4', nombre: 'Gris frío', h: 212, s: 16, l: 58 },
    { codigo: 'T9', nombre: 'Tinta', h: 28, s: 14, l: 22 },
  ];

  function hslAHex(h, s, l) {
    s /= 100; l /= 100;
    const c = (1 - Math.abs(2 * l - 1)) * s, hp = (((h % 360) + 360) % 360) / 60;
    const x = c * (1 - Math.abs((hp % 2) - 1)), m = l - c / 2;
    const [r, g, b] = hp < 1 ? [c, x, 0] : hp < 2 ? [x, c, 0] : hp < 3 ? [0, c, x] : hp < 4 ? [0, x, c] : hp < 5 ? [x, 0, c] : [c, 0, x];
    return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('');
  }
  const rgb01 = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f3 = (n) => Math.round(n * 1000) / 1000;

  const GAMA = [];
  FAMILIAS.forEach((fam) => GRUPOS.forEach((g) => NIVELES.forEach((n) => GAMA.push({
    codigo: `${fam.k}${g.d}${n.d}`, familia: fam.nombre, k: fam.k, grupo: g.d, nivel: n.d,
    hex: hslAHex(fam.h, fam.tierra ? Math.round(g.s * 0.6) : g.s, n.l), claro: n.l > 58,
  }))));
  NEUTROS.forEach((x) => GAMA.push({ codigo: x.codigo, familia: x.nombre, k: 'N', grupo: '', nivel: '', hex: hslAHex(x.h, x.s, x.l), claro: x.l > 58, neutro: true }));
  const POR_HEX = new Map();
  GAMA.forEach((x) => { if (!POR_HEX.has(x.hex)) POR_HEX.set(x.hex, x); });
  const TALAVERA = String(T).toLowerCase();

  /* '' = azul talavera (el de siempre); si no, un #rrggbb */
  function normalizar(v) {
    const s = String(v || '').trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(s) && s !== TALAVERA ? s : '';
  }
  function datos(v) {
    const hex = normalizar(v) || TALAVERA;
    return POR_HEX.get(hex) || { codigo: '', familia: 'Color propio', k: '', hex };
  }
  function nombre(v) {
    if (!normalizar(v)) return 'Azul talavera · B26';
    const d = datos(v);
    return `${d.familia} · ${d.codigo || d.hex}`;
  }
  const familia = (k) => FAMILIAS.find((f) => f.k === k);
  const tonosDe = (k, grupo) => GAMA.filter((x) => x.k === k && !x.neutro && (grupo == null || x.grupo === grupo));
  const neutros = () => GAMA.filter((x) => x.neutro);

  /* Filtros SVG: 'd' = dibujo (la tinta azul pasa a tu color exacto),
     'f' = foto que aún no tiene dibujo (se entinta en 4 tonos) */
  const hechos = new Set();
  function filtro(v, tipo = 'd') {
    const n = normalizar(v);
    if (!n || typeof document === 'undefined') return '';
    const id = `tinta-${tipo}-${n.slice(1)}`;
    if (!hechos.has(id) || !document.getElementById(id)) { crearFiltro(id, n, tipo); hechos.add(id); }
    return `url(#${id})`;
  }
  function nodo(nombreEl, atributos) {
    const el = document.createElementNS(NS, nombreEl);
    Object.keys(atributos).forEach((a) => el.setAttribute(a, atributos[a]));
    return el;
  }
  function crearFiltro(id, hex, tipo) {
    let cont = document.getElementById('filtros-tinta');
    if (!cont) {
      cont = nodo('svg', { id: 'filtros-tinta', width: '0', height: '0', 'aria-hidden': 'true', focusable: 'false' });
      cont.style.position = 'absolute';
      cont.style.pointerEvents = 'none';
      (document.body || document.documentElement).appendChild(cont);
    }
    const [r, g, b] = rgb01(hex), [pr, pg, pb] = rgb01(P);
    const fl = nodo('filter', { id, 'color-interpolation-filters': 'sRGB', x: '0', y: '0', width: '100%', height: '100%' });
    // 1 · a grises (la luz de cada punto)
    fl.appendChild(nodo('feColorMatrix', { type: 'matrix', values: '0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0' }));
    // 2 · dibujo: el azul queda en 0 y el papel en 1 · foto: 4 tonos, como tinta
    const ajuste = nodo('feComponentTransfer', {});
    ['R', 'G', 'B'].forEach((c) => ajuste.appendChild(tipo === 'd'
      ? nodo(`feFunc${c}`, { type: 'linear', slope: '1.5', intercept: '-0.4' })
      : nodo(`feFunc${c}`, { type: 'discrete', tableValues: '0 .33 .66 1' })));
    fl.appendChild(ajuste);
    // 3 · pintar: lo oscuro con tu tinta y lo claro con el papel
    const tinta = { R: [r, pr], G: [g, pg], B: [b, pb] };
    const pintar = nodo('feComponentTransfer', {});
    ['R', 'G', 'B'].forEach((c) => pintar.appendChild(nodo(`feFunc${c}`, { type: 'table', tableValues: `${f3(tinta[c][0])} ${f3(tinta[c][1])}` })));
    fl.appendChild(pintar);
    const viejo = document.getElementById(id);
    if (viejo) viejo.remove();
    cont.appendChild(fl);
  }

  /* Estilo en línea para la imagen de una pieza */
  function estilo(color, { cruda = false, agotada = false } = {}) {
    const fl = filtro(color, cruda ? 'f' : 'd');
    return fl ? `filter:${fl}${agotada ? ' grayscale(0.5)' : ''}` : '';
  }

  window.Tintas = { FAMILIAS, GRUPOS, NIVELES, GAMA, TALAVERA, normalizar, datos, nombre, familia, tonosDe, neutros, filtro, estilo };
})();
