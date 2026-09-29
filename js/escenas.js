/* ==================================================================
   escenas.js · La fachada del taller y las piezas del interior
   ------------------------------------------------------------------
   Fachada minimalista, como tus referencias: una casita de ladrillo
   blanco con la enredadera cayendo desde el techo, un árbol que deja
   caer sus hojas y sombras de hojas sobre la pared. Puerta verde,
   ventana con postigos, celosías de talavera (el azul queda solo ahí y
   en las macetas) y arbolitos en maceta.
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte;
  const { T, O, P, V, C } = A.colores;
  const { f } = A.util;
  const CFG = window.INLUNA_CONFIG || {};
  const LUZ = '#fff1c4';

  // La casa
  const MURO = '#fdfbf6', MURO_LADO = '#ebe4d6', LADRILLO = 'rgba(58, 42, 31, 0.13)';
  const SOMBRA = '#3a2e24', VIDRIO = '#3a342c', BANQUETA = '#ece5d8';
  const PUERTA = '#7cb342', PUERTA_PANEL = '#8cc152', PUERTA_LINEA = '#5a8a2d', LATON = '#d6ae55';
  // Verdes de las hojas: del limón con sol al verde de tu logo
  const VERDES = ['#d7e972', '#badb4f', '#94c940', '#66b845', '#3ea53d', V, '#1f8a36'];

  const W = 400, H = 500, CX = 200, SUELO = 468;
  const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;
  const f2 = (n) => Math.round(n * 100) / 100;

  /* Posiciones (en unidades del dibujo) de lo que se puede tocar */
  const FACHADA = {
    W, H, CX, SUELO,
    muro: { x: 70, y: 116, w: 260, h: SUELO - 116 },
    puerta: { x: 162, y: 318, w: 76, h: 150 },
    postigo: { x: 102, y: 176, w: 48, h: 64 },
    celosias: [{ x: 250, y: 176, w: 48, h: 64 }, { x: 84, y: 352, w: 42, h: 42 }, { x: 274, y: 352, w: 42, h: 42 }],
    macetas: [{ x: 122, y: 386, w: 32, h: 82 }, { x: 246, y: 386, w: 32, h: 82 }],
  };
  /* Caja CSS (porcentajes) de un elemento dentro de la casa */
  function caja(r) {
    return `left:${pct(r.x, W)};top:${pct(r.y, H)};width:${pct(r.w, W)};height:${pct(r.h, H)}`;
  }

  /* ---------- hojas redonditas, como las de tu referencia ---------- */
  const HOJA = 'M0,-6.5C3.8,-6.5 6.4,-3.4 6,0.4C5.6,4.2 2.6,6.8 0,8.6C-2.6,6.8 -5.6,4.2 -6,0.4C-6.4,-3.4 -3.8,-6.5 0,-6.5Z';
  const VENA = 'M0,-4.8V6.2';
  // tono: 0 = limón con sol … 6 = verde oscuro (sesgo > 0 → más oscuras)
  const tono = (r, sesgo = 0) => VERDES[Math.max(0, Math.min(VERDES.length - 1, Math.floor(r() * 4 + sesgo)))];
  const colocar = (x, y, giro, esc) => `translate(${f(x)},${f(y)}) rotate(${Math.round(giro)}) scale(${f2(esc)})`;
  // hoja que brota (el <g> la coloca; el <g class="hv"> se anima con CSS)
  function hoja(x, y, giro, esc, relleno, retraso) {
    const d = retraso == null ? '' : ` style="--d:${f2(retraso)}s"`;
    return `<g transform="${colocar(x, y, giro, esc)}"><g class="hv"${d}><path d="${HOJA}" fill="${relleno}"/>` +
      `<path d="${VENA}" stroke="rgba(255,255,255,.42)" stroke-width=".7" fill="none"/></g></g>`;
  }
  const hojaFija = (x, y, giro, esc, relleno) => `<path d="${HOJA}" transform="${colocar(x, y, giro, esc)}" fill="${relleno}"/>`;
  // (sin color propio: el grupo de sombras pone un solo tono, sin manchas donde se enciman)
  const sombraHoja = (x, y, giro, esc) => `<path d="${HOJA}" transform="${colocar(x, y, giro, esc)}"/>`;

  function curva(pts) {
    const s = A.catmullRom(pts);
    return `M${f(s[0][0][0])},${f(s[0][0][1])}` + s.map((q) => `C${f(q[1][0])},${f(q[1][1])} ${f(q[2][0])},${f(q[2][1])} ${f(q[3][0])},${f(q[3][1])}`).join('');
  }

  /* La enredadera que cae desde el techo (y su sombra en la pared) */
  function enredaderaTecho() {
    const r = A.azar('enredadera-techo');
    let mata = '', tiras = '', sombras = '';
    // la mata sobre el pretil: brota del centro hacia las orillas
    for (let k = 0; k < 170; k++) {
      const x = 46 + r() * 312;
      const orilla = Math.abs(x - CX) / 156;
      const y = 94 + r() * 30 + orilla * 8 + (r() < 0.3 ? r() * 14 : 0);
      const esc = 0.8 + r() * 0.55, giro = (r() - 0.5) * 140;
      mata += hoja(x, y, giro, esc, tono(r, (y - 96) / 16), 0.05 + orilla * 0.7 + r() * 0.3);
      if (x > 74 && x < 346) sombras += sombraHoja(x - 6, y + 16, giro, esc);
    }
    // tiras que cuelgan: [x, hasta dónde bajan]
    [[58, 172], [86, 204], [112, 236], [144, 210], [178, 196], [222, 188], [258, 204], [292, 222], [322, 196], [348, 176]].forEach(([x0, fin], i) => {
      const n = Math.max(3, Math.round((fin - 116) / 10));
      const pts = [];
      for (let j = 0; j <= n; j++) { const t = j / n; pts.push([x0 + Math.sin(t * 2.6 + i * 1.7) * 6 * t, 116 + (fin - 116) * t]); }
      let g = `<path class="tallo" pathLength="1" style="--d:${f2(0.5 + i * 0.06)}s;--dur:1.2s" d="${curva(pts)}" fill="none" stroke="${C}" stroke-width="1.2" stroke-linecap="round"/>`;
      pts.slice(1).forEach(([x, y], j) => {
        const t = (j + 1) / n, lado = j % 2 ? 1 : -1;
        const esc = 0.95 - t * 0.4 + r() * 0.15, giro = lado * (30 + r() * 30);
        g += hoja(x + lado * 3.5, y, giro, esc, tono(r, 1 + t * 2.4), 0.6 + i * 0.06 + t * 0.9);
        if (x > 72 && x < 346) sombras += sombraHoja(x + lado * 3.5 - 6, y + 16, giro, esc);
      });
      tiras += `<g class="tira" style="transform-origin:${x0}px 116px;--m:${f2(3.4 + (i % 4) * 0.5)}s">${g}</g>`;
    });
    return { hojas: tiras + mata, sombras };
  }

  /* Sombra del árbol que cae en diagonal sobre el lado derecho */
  function sombrasArbol() {
    const r = A.azar('sombra-arbol');
    let s = '';
    for (let k = 0; k < 46; k++) {
      const t = r(), x = 236 + r() * 118, y = 118 + t * t * 230;
      if (x < 236 + (y - 118) * 0.15) continue;
      s += sombraHoja(x, y, r() * 360, 1.4 + r() * 1.1);
    }
    return s;
  }

  function marcoVentana(v) {
    return `<rect x="${v.x}" y="${v.y}" width="${v.w}" height="${v.h}" fill="${MURO}"/>` +
      `<rect x="${v.x - 4}" y="${v.y + v.h}" width="${v.w + 8}" height="5" fill="${MURO}"/>`;
  }

  /* ================================================================
     FACHADA · devuelve { casa, vivo }:
     · casa: el dibujo quieto (con el hueco de la puerta)
     · vivo: la enredadera que brota encima de todo
     ================================================================ */
  function fachada({ nombre = CFG.nombre || 'Inluna' } = {}) {
    const M = FACHADA.muro, x0 = M.x, x1 = M.x + M.w, yT = M.y, pu = FACHADA.puerta;
    const abrir = (clase) => `<svg class="fachada-svg ${clase}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" overflow="visible">`;
    const enr = enredaderaTecho();
    const muroD = `M${x0},${yT}H${x1}V${SUELO}H${x0}Z`;
    const huecoD = `M${pu.x},${pu.y}H${pu.x + pu.w}V${SUELO}H${pu.x}Z`;
    const ladoD = `M${x1},${yT}L${x1 + 16},${yT + 7}V${SUELO}H${x1}Z`;
    const vp = FACHADA.postigo;

    let s = abrir('fachada-casa') +
      `<defs>${A.filtroTinta('tinta-fachada', { escala: 1.5, frecuencia: 0.035, semilla: 11 })}` +
      `<pattern id="ladrillos" width="24" height="18" patternUnits="userSpaceOnUse"><path d="M0,.5H24M0,9.5H24M7,.5V9.5M19,9.5V18" stroke="${LADRILLO}" stroke-width="1" fill="none"/></pattern>` +
      `<clipPath id="recorte-muro"><path clip-rule="evenodd" d="${muroD} ${huecoD} ${ladoD}"/></clipPath></defs>`;

    // banqueta
    let juntas = '';
    for (let x = 40; x < 380; x += 34) juntas += `M${x},${SUELO}L${x - 4},${SUELO + 12}`;
    s += `<path d="M18,${SUELO}H382V${SUELO + 12}H18Z" fill="${BANQUETA}"/><path d="${juntas}" stroke="${O}" stroke-width=".8" opacity=".25"/>`;
    // muro de ladrillo (con el hueco de la puerta) y su lado en sombra
    s += `<path fill-rule="evenodd" d="${muroD} ${huecoD}" fill="${MURO}"/><path fill-rule="evenodd" d="${muroD} ${huecoD}" fill="url(#ladrillos)"/>`;
    s += `<path d="${ladoD}" fill="${MURO_LADO}"/><path d="${ladoD}" fill="url(#ladrillos)" opacity=".7"/>`;
    // pretil
    s += `<path d="M${x0 - 6},${yT - 9}H${x1 + 6}V${yT + 2}H${x0 - 6}Z" fill="${MURO}"/><path d="M${x1 + 6},${yT - 9}L${x1 + 20},${yT - 3}V${yT + 7}L${x1 + 6},${yT + 2}Z" fill="${MURO_LADO}"/>`;
    // ventana con vidrio oscuro (los postigos van encima, se pueden cerrar)
    s += marcoVentana(vp) + `<rect x="${vp.x + 5}" y="${vp.y + 5}" width="${vp.w - 10}" height="${vp.h - 10}" fill="${VIDRIO}"/>`;
    s += `<path d="M${vp.x + vp.w / 2},${vp.y + 5}V${vp.y + vp.h - 5}M${vp.x + 5},${vp.y + vp.h * 0.45}H${vp.x + vp.w - 5}" stroke="${MURO}" stroke-width="2.2"/>`;
    s += `<path d="M${vp.x + 9},${vp.y + vp.h - 12}L${vp.x + 17},${vp.y + 10}" stroke="rgba(255,255,255,.16)" stroke-width="3"/>`;
    // repisas de las celosías
    FACHADA.celosias.forEach((v) => { s += `<rect x="${v.x - 4}" y="${v.y + v.h}" width="${v.w + 8}" height="5" fill="${MURO}"/>`; });
    // marco de la puerta, cornisa y escalón
    s += `<path fill-rule="evenodd" d="M${pu.x - 6},${SUELO}V${pu.y - 6}H${pu.x + pu.w + 6}V${SUELO}Z ${huecoD}" fill="${MURO}"/>`;
    s += `<path d="M${pu.x - 14},${pu.y - 18}H${pu.x + pu.w + 14}V${pu.y - 10}H${pu.x - 14}Z" fill="${MURO}"/>`;
    s += `<path d="M${pu.x - 10},${SUELO}H${pu.x + pu.w + 10}V${SUELO + 6}H${pu.x - 10}Z" fill="#e2dbcd"/>`;
    // zócalo de talavera (rombitos azules)
    let zocalo = '';
    for (let x = x0 + 8; x < x1 - 4; x += 12) {
      if (x > pu.x - 14 && x < pu.x + pu.w + 14) continue;
      zocalo += `<rect x="${x - 3}" y="455" width="6" height="6" fill="${T}" transform="rotate(45 ${x} 458)"/>`;
    }
    s += zocalo;

    // sombras de las hojas sobre la pared (la de la enredadera y la del árbol)
    s += `<g clip-path="url(#recorte-muro)" fill="${SOMBRA}" opacity=".1">${enr.sombras}${sombrasArbol()}</g>`;

    // contornos a mano (tinta café)
    let tinta = `<path d="M18,${SUELO}H382"/>`;
    tinta += `<path d="M${x0},${yT + 2}V${SUELO}M${x1},${yT + 2}V${SUELO}M${x1 + 16},${yT + 7}V${SUELO}" stroke-width="1.5"/>`;
    tinta += `<path d="M${x0 - 6},${yT - 9}H${x1 + 6}V${yT + 2}H${x0 - 6}Z M${x1 + 6},${yT - 9}L${x1 + 20},${yT - 3}V${yT + 7}L${x1 + 16},${yT + 7}" stroke-width="1.5"/>`;
    tinta += `<rect x="${vp.x}" y="${vp.y}" width="${vp.w}" height="${vp.h}" stroke-width="1.5"/><rect x="${vp.x + 5}" y="${vp.y + 5}" width="${vp.w - 10}" height="${vp.h - 10}" stroke-width=".9"/>`;
    [vp].concat(FACHADA.celosias).forEach((v) => { tinta += `<rect x="${v.x - 4}" y="${v.y + v.h}" width="${v.w + 8}" height="5" stroke-width="1.2"/>`; });
    tinta += `<path d="M${pu.x - 6},${SUELO}V${pu.y - 6}H${pu.x + pu.w + 6}V${SUELO}M${pu.x},${SUELO}V${pu.y}H${pu.x + pu.w}V${SUELO}" stroke-width="1.4"/>`;
    tinta += `<path d="M${pu.x - 14},${pu.y - 18}H${pu.x + pu.w + 14}V${pu.y - 10}H${pu.x - 14}Z" stroke-width="1.4"/>`;
    tinta += `<path d="M${pu.x - 9},${pu.y - 10}L${pu.x - 5},${pu.y - 4}M${pu.x + pu.w + 9},${pu.y - 10}L${pu.x + pu.w + 5},${pu.y - 4}" stroke-width="1.2"/>`;
    tinta += `<path d="M${pu.x - 10},${SUELO}V${SUELO + 6}H${pu.x + pu.w + 10}V${SUELO}" stroke-width="1.2"/>`;
    tinta += `<path d="M${x0},449H${pu.x - 14}M${pu.x + pu.w + 14},449H${x1}" stroke-width=".9"/>`;
    s += `<g filter="url(#tinta-fachada)" fill="none" stroke="${O}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${tinta}</g>`;

    // letrero pintado sobre la pared, con dos hojitas
    const largo = String(nombre).length;
    const ajuste = largo > 8 ? ` textLength="96" lengthAdjust="spacingAndGlyphs"` : '';
    s += hojaFija(CX - 50, 289, -62, 0.62, VERDES[4]) + hojaFija(CX + 50, 289, 62, 0.62, VERDES[4]);
    s += `<text class="fz-letrero" x="${CX}" y="296" text-anchor="middle" fill="${O}"${ajuste}>${escapar(nombre)}</text></svg>`;

    const vivo = abrir('fachada-viva') + `<g class="fz-enredadera">${enr.hojas}</g></svg>`;
    return { casa: s, vivo };
  }

  /* ---------- piezas que se pueden tocar ---------- */
  function hojaPuerta() {
    const w = 38, h = 150;
    let s = `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" fill="${PUERTA}" stroke="${O}" stroke-width="1.8"/>`;
    [[9, 58], [76, 64]].forEach(([y, alto]) => {
      s += `<rect x="6" y="${y}" width="${w - 12}" height="${alto}" rx="1.5" fill="${PUERTA_PANEL}" stroke="${PUERTA_LINEA}" stroke-width="1.3"/>`;
      s += `<path d="M8.5,${y + 3}V${y + alto - 3}" stroke="rgba(255,255,255,.4)" stroke-width="1.2"/>`;
    });
    s += `<circle cx="${w - 5.5}" cy="72" r="2.3" fill="${LATON}" stroke="${O}" stroke-width=".8"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}</svg>`;
  }

  /* Lo que se ve por la puerta al abrirse: la luz del taller y un arco de talavera */
  function huecoPuerta() {
    const w = 76, h = 150, c = w / 2, ya = 124, r0 = 15;
    let s = `<defs><radialGradient id="hueco-luz" cx="50%" cy="38%" r="80%"><stop offset="0" stop-color="#fffdf6"/><stop offset=".6" stop-color="${P}"/><stop offset="1" stop-color="#e2d3b3"/></radialGradient></defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#hueco-luz)"/>`;
    s += `<g transform="translate(${c - 15},12) scale(.3)">${A.logoPartes()}</g>`;
    s += `<g class="hueco-marco"><path d="M${c - r0},${ya}V${ya - 34}A${r0},${r0} 0 0 1 ${c + r0},${ya - 34}V${ya}Z" fill="${P}" stroke="${O}" stroke-width="1.2"/>` +
      `<path d="M${c},${ya - 34 - r0}A${r0},${r0} 0 0 1 ${c + r0},${ya - 34}V${ya}H${c + r0 - 3.5}V${ya - 34}A${r0 - 3.5},${r0 - 3.5} 0 0 0 ${c},${ya - 34 - r0 + 3.5}Z" fill="${T}"/></g>`;
    s += `<path d="M0,${ya}H${w}V${h}H0Z" fill="#eadcbf"/><path d="M0,${ya}H${w}" stroke="${O}" stroke-width="1" opacity=".5"/>`;
    for (let k = -3; k <= 3; k++) s += `<path d="M${c + k * 8},${ya}L${c + k * 30},${h}" stroke="${O}" stroke-width=".8" opacity=".2"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}</svg>`;
  }

  /* Un postigo de persiana (la ventana tiene dos) */
  function postigoPanel() {
    let s = `<rect x="1" y="1" width="22" height="62" fill="#f7f3ea" stroke="${O}" stroke-width="1.4"/>`;
    for (let y = 7; y < 60; y += 4.6) s += `<path d="M4.5,${f(y)}H19.5" stroke="#cdbfa8" stroke-width="1.5"/>`;
    return `<svg viewBox="0 0 24 64" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}</svg>`;
  }

  /* Celosía de talavera: estrellas azules con huecos que se iluminan */
  function celosia(w, h, i) {
    const m = 4.5, iw = w - 2 * m, ih = h - 2 * m;
    const n = Math.max(2, Math.round(iw / 12)), cw = iw / n;
    const filas = Math.max(2, Math.round(ih / cw)), ch = ih / filas;
    const id = `celosia-${i}`;
    let dentro = `<rect x="${m}" y="${m}" width="${f(iw)}" height="${f(ih)}" fill="${P}"/>`;
    for (let j = 0; j <= filas; j++) {
      for (let k = 0; k <= n; k++) dentro += `<circle class="cl-hueco" cx="${f(m + k * cw)}" cy="${f(m + j * ch)}" r="${f(Math.min(cw, ch) * 0.2)}" fill="${VIDRIO}"/>`;
    }
    for (let j = 0; j < filas; j++) {
      for (let k = 0; k < n; k++) dentro += `<path d="${A.destello(m + (k + 0.5) * cw, m + (j + 0.5) * ch, Math.min(cw, ch) * 0.46, 0.2)}" fill="${T}"/>`;
    }
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false"><defs><clipPath id="${id}"><rect x="${m}" y="${m}" width="${f(iw)}" height="${f(ih)}"/></clipPath></defs>` +
      `<rect x=".8" y=".8" width="${f(w - 1.6)}" height="${f(h - 1.6)}" fill="${MURO}" stroke="${O}" stroke-width="1.4"/>` +
      `<g clip-path="url(#${id})">${dentro}</g><rect x="${m}" y="${m}" width="${f(iw)}" height="${f(ih)}" fill="none" stroke="${O}" stroke-width=".9"/></svg>`;
  }

  /* Arbolito redondo en maceta de talavera */
  function topiario(i) {
    const r = A.azar(`topiario-${i}`);
    const w = 32, h = 82, c = 16, cy = 24;
    let copa = `<path d="M${c},${cy + 10}V62" stroke="${C}" stroke-width="2.4" stroke-linecap="round"/>`;
    copa += `<circle cx="${c}" cy="${cy}" r="13.5" fill="#4f9f3a"/>`;
    for (let k = 0; k < 34; k++) {
      const a = r() * 6.283, d = Math.sqrt(r()) * 13.5;
      const x = c + Math.cos(a) * d, y = cy + Math.sin(a) * d;
      copa += hojaFija(x, y, r() * 360, 0.5 + r() * 0.28, tono(r, 0.8 + (y - cy + 13) / 12));
    }
    let maceta = `<path d="M${c - 11},64H${c + 11}L${c + 8},${h - 1}H${c - 8}Z" fill="${P}" stroke="${O}" stroke-width="1.3"/>`;
    maceta += `<path d="M${c - 12.5},59H${c + 12.5}V65H${c - 12.5}Z" fill="${T}" stroke="${O}" stroke-width="1.2"/>`;
    maceta += `<path d="M${c - 9.8},71H${c + 9.8}M${c - 9.2},75.5H${c + 9.2}" stroke="${T}" stroke-width="1.4"/>`;
    maceta += [c - 5, c, c + 5].map((x) => `<circle cx="${x}" cy="79.5" r="1.1" fill="${T}"/>`).join('');
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" overflow="visible"><g class="topiario-copa" style="transform-origin:${c}px 62px">${copa}</g>${maceta}</svg>`;
  }

  /* El árbol que asoma desde arriba a la derecha (sus hojas van cayendo) */
  function arbol() {
    const r = A.azar('arbol-inluna');
    const w = 360, h = 330;
    const ramas = [
      { pts: [[378, 18], [330, 52], [276, 92], [222, 134], [176, 168]], g: 7 },
      { pts: [[318, 60], [292, 36], [266, 20]], g: 3.2 },
      { pts: [[276, 92], [298, 150], [322, 206]], g: 3.6 },
      { pts: [[226, 132], [204, 190], [192, 238]], g: 2.8 },
      { pts: [[182, 166], [150, 186], [126, 196]], g: 2.2 },
    ];
    let s = ramas.map((q) => `<path d="${curva(q.pts)}" stroke="${C}" stroke-width="${q.g}" fill="none" stroke-linecap="round"/>`).join('');
    [[306, 44, 66, 64], [242, 88, 58, 52], [186, 146, 46, 36], [292, 152, 56, 46], [350, 112, 42, 30],
      [230, 196, 40, 26], [320, 216, 36, 22], [134, 188, 28, 14], [268, 26, 42, 26], [196, 70, 34, 18]].forEach(([gx, gy, rad, n]) => {
      for (let k = 0; k < n; k++) {
        const a = r() * 6.283, d = Math.sqrt(r()) * rad;
        const x = gx + Math.cos(a) * d, y = gy + Math.sin(a) * d * 0.78;
        const oscuro = (y - gy) / rad + ((x - gx) / rad) * 0.4; // abajo y a la derecha, más sombra
        s += hojaFija(x, y, r() * 360, 1.05 + r() * 0.7, tono(r, 1.4 + oscuro * 1.8));
      }
    });
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" overflow="visible"><g class="arbol-copa" style="transform-origin:360px 20px">${s}</g></svg>`;
  }

  /* Una hoja suelta (las que caen del árbol) */
  function hojaSuelta(color) {
    return `<svg viewBox="-7 -7.5 14 17" aria-hidden="true" focusable="false"><path d="${HOJA}" fill="${color}"/><path d="${VENA}" stroke="rgba(255,255,255,.45)" stroke-width=".7"/></svg>`;
  }

  /* ================================================================
     INTERIOR · piezas sueltas para la galería
     ================================================================ */
  /* El círculo de fondo del interior: el logo de hojas de Inluna, grande */
  function hojasFondoSVG() {
    return `<svg viewBox="-4 -4 108 108" aria-hidden="true" focusable="false"><g class="hojas-fondo">${A.logoPartes()}</g></svg>`;
  }

  /* Lámpara colgante del interior (largo = cordón) */
  function lampara(largo = 40) {
    const x = 30, y = largo;
    return `<svg viewBox="0 0 60 ${largo + 70}" aria-hidden="true" focusable="false" overflow="visible">` +
      `<defs><radialGradient id="luz-lampara-${largo}"><stop offset="0" stop-color="${LUZ}" stop-opacity=".95"/><stop offset=".45" stop-color="${LUZ}" stop-opacity=".45"/><stop offset="1" stop-color="${LUZ}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle class="lp-luz" cx="${x}" cy="${y + 38}" r="48" fill="url(#luz-lampara-${largo})"/>` +
      `<path d="M${x},0V${y}" stroke="${O}" stroke-width="1.6"/>` +
      `<path d="M${x - 21},${y + 25}Q${x - 19},${y} ${x},${y}Q${x + 19},${y} ${x + 21},${y + 25}Z" fill="${C}" stroke="${O}" stroke-width="2"/>` +
      `<path d="M${x - 13},${y + 10}Q${x},${y + 5} ${x + 13},${y + 10}M${x - 17},${y + 18}Q${x},${y + 13} ${x + 17},${y + 18}" stroke="${P}" stroke-width="1.4" fill="none" opacity=".7"/>` +
      `<path d="M${x - 21},${y + 25}H${x + 21}" stroke="${O}" stroke-width="2"/>` +
      `<circle cx="${x}" cy="${y + 30}" r="5" fill="#fff8e6" stroke="${O}" stroke-width="1.4"/></svg>`;
  }

  /* Pilar entre arcos: la estrella con puntitos de tu friso */
  function pilar() {
    return `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">` +
      `<path d="${A.destello(20, 30, 13, 0.18)}" fill="none" stroke="${T}" stroke-width="1.8" stroke-linejoin="round"/>` +
      [[6, 12], [34, 12], [6, 48], [34, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${T}"/>`).join('') + `</svg>`;
  }

  /* Enredadera que cuelga del friso (lado: 1 izquierda, -1 derecha) */
  function enredaderaColgante(alto, lado, semilla) {
    const w = 44, x0 = lado > 0 ? 8 : w - 8, s = lado;
    const pts = [[x0, 0], [x0 + 10 * s, alto * 0.22], [x0 + 2 * s, alto * 0.46], [x0 + 12 * s, alto * 0.7], [x0 + 4 * s, alto]];
    return `<svg viewBox="0 0 ${w} ${alto}" aria-hidden="true" focusable="false" overflow="visible">` +
      A.enredadera(pts, { semilla, retraso: 0.5, dur: 1.5, hoja: [8, 13], paso: 13 }) + `</svg>`;
  }

  function escapar(t) {
    return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  window.Escenas = {
    FACHADA, VERDES, caja, fachada, hojaPuerta, huecoPuerta, postigoPanel, celosia, topiario, arbol, hojaSuelta,
    hojasFondoSVG, lampara, pilar, enredaderaColgante, escapar,
  };
})();
