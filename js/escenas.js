/* ==================================================================
   escenas.js · La fachada del taller (simétrica) y las piezas del
   interior. Todo el dibujo gira alrededor de un eje central x = 320:
   luna → ▽ del frontón → letrero → puertas → camino.
   ------------------------------------------------------------------
   De tu boceto: techo con aleros curvos y tejas punteadas azules, el ▽
   en el frontón, puertas dobles azules y tu friso de arcos y estrellas.
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte;
  const { T, O, P } = A.colores;
  const { f } = A.util;
  const CFG = window.INLUNA_CONFIG || {};
  const LUZ = '#fff1c4';

  const W = 640, H = 520, CX = 320, SUELO = 478;
  const eje = (x) => 2 * CX - x;
  const espejo = (pts) => pts.map(([x, y]) => [eje(x), y]);
  const pct = (v, total) => `${((v / total) * 100).toFixed(3)}%`;

  /* Posiciones (en unidades del dibujo) de lo que se puede tocar */
  const FACHADA = {
    W, H, CX, SUELO,
    puerta: { x: 222, y: 304, w: 196, h: 174 },
    logo: { x: 297, y: 100, w: 46 },
    ventanas: [{ x: 95, y: 305, w: 58, h: 107 }, { x: 487, y: 305, w: 58, h: 107 }],
    faroles: [{ x: 164, y: 284, w: 40, h: 78 }, { x: 436, y: 284, w: 40, h: 78 }],
    macetas: [{ x: 158, y: 372, w: 56, h: 106 }, { x: 426, y: 372, w: 56, h: 106 }],
  };
  /* Caja CSS (porcentajes) de un elemento dentro de la casa */
  function caja(r) {
    return `left:${pct(r.x, W)};top:${pct(r.y, H)};width:${pct(r.w, W)};height:${pct(r.h, H)}`;
  }

  /* ---------- geometría del techo ---------- */
  const FALDA = 'M200,150H440C500,170 570,196 624,212C606,224 596,236 580,236H60C44,236 34,224 16,212C70,196 140,170 200,150Z';
  function bezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return [
      u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    ];
  }
  /* Borde izquierdo de la falda del techo para una altura y */
  const bordeFalda = (function () {
    const pts = [];
    for (let k = 0; k <= 30; k++) pts.push(bezier([200, 150], [140, 170], [70, 196], [16, 212], k / 30));
    for (let k = 1; k <= 20; k++) pts.push(bezier([16, 212], [34, 224], [44, 236], [60, 236], k / 20));
    return function (y) {
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if ((y - a[1]) * (y - b[1]) <= 0 && a[1] !== b[1]) return a[0] + (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]);
      }
      return 60;
    };
  })();

  /* Tejas: filas de guiones azules, en espejo para que sean simétricas */
  function tejas(r) {
    let d = '';
    [166, 182, 198, 214, 228].forEach((y, fila) => {
      const limite = bordeFalda(y) + 12, hueco = 11;
      let x;
      if (fila % 2 === 0) {
        d += `M${CX - 11},${y}H${CX + 11}`;
        x = CX - 11 - hueco;
      } else {
        x = CX - hueco / 2;
      }
      while (x - 12 > limite) {
        const largo = Math.min(18 + r() * 8, x - limite);
        d += `M${f(x)},${y}H${f(x - largo)}M${f(eje(x))},${y}H${f(eje(x - largo))}`;
        x -= largo + hueco + r() * 3;
      }
    });
    return `<path d="${d}" stroke="${T}" stroke-width="2.8"/>`;
  }

  /* Tu friso de arcos y estrellas, de esquina a esquina bajo el alero */
  function friso() {
    const x0 = 50, x1 = 590, y = 246, alto = 38, n = 13, u = (x1 - x0) / n, yb = y + alto;
    let s = `<rect x="${x0}" y="${y}" width="${x1 - x0}" height="${alto}" fill="${P}" stroke="none"/>`;
    for (let i = 0; i < n; i++) {
      const cx = x0 + u * (i + 0.5);
      s += `<path d="M${f(cx - u / 2 + 1)},${y}A${f(u / 2 - 1)},11 0 0 0 ${f(cx + u / 2 - 1)},${y}Z" fill="${T}" stroke-width="1.3"/>`;
      s += `<path d="M${f(cx - u * 0.3)},${y + 4}H${f(cx + u * 0.3)}" stroke="${P}" stroke-width="1" opacity=".55"/>`;
      if (i === 6) continue; // el centro lo ocupa el letrero
      if (i % 2 === 0) {
        const ra = u * 0.2, ys = yb - 11;
        const derecha = cx < CX; // la sombra azul mira hacia la puerta, en espejo
        s += derecha
          ? `<path d="M${f(cx)},${f(ys - ra + 2.2)}A${f(ra - 2.2)},${f(ra - 2.2)} 0 0 1 ${f(cx + ra - 2.2)},${f(ys)}V${yb}" stroke="${T}" stroke-width="4.4"/>`
          : `<path d="M${f(cx)},${f(ys - ra + 2.2)}A${f(ra - 2.2)},${f(ra - 2.2)} 0 0 0 ${f(cx - ra + 2.2)},${f(ys)}V${yb}" stroke="${T}" stroke-width="4.4"/>`;
        s += `<path d="M${f(cx - ra)},${yb}V${f(ys)}A${f(ra)},${f(ra)} 0 0 1 ${f(cx + ra)},${f(ys)}V${yb}" stroke-width="1.5"/>`;
      } else {
        s += `<path d="${A.destello(cx, yb - 12, u * 0.17, 0.18)}" stroke-width="1.3"/>`;
        [[-0.3, -0.52], [0.3, -0.52], [-0.3, -0.12], [0.3, -0.12]].forEach(([a, b]) => {
          s += `<circle cx="${f(cx + a * u)}" cy="${f(yb + b * alto * 0.62)}" r="1.1" fill="${O}" stroke="none"/>`;
        });
      }
    }
    s += `<path d="M${x0},${y}H${x1}M${x0},${yb}H${x1}" stroke-width="1.9"/>`;
    s += `<path d="M${x0},${y}L${x0 - 7},${y - 4}V${yb - 4}L${x0},${yb}Z" fill="${T}" stroke-width="1.5"/>`;
    s += `<path d="M${x1},${y}L${x1 + 7},${y - 4}V${yb - 4}L${x1},${yb}Z" fill="${T}" stroke-width="1.5"/>`;
    return s;
  }

  function ventanaEstatica(cx, lado) {
    // lado: 1 = la sombra azul a la derecha (ventana izquierda), -1 = en espejo
    const ro = 34, ri = 27, ys = 334, yb = 410;
    const barrido = lado > 0 ? 1 : 0, barridoInt = lado > 0 ? 0 : 1;
    let s = `<path d="M${cx - ro},${yb}V${ys}A${ro},${ro} 0 0 1 ${cx + ro},${ys}V${yb}Z M${cx - ri},${yb}V${ys}A${ri},${ri} 0 0 1 ${cx + ri},${ys}V${yb}Z" fill="${P}" fill-rule="evenodd" stroke="none"/>`;
    s += `<path d="M${cx},${ys - ro}A${ro},${ro} 0 0 ${barrido} ${cx + lado * ro},${ys}V${yb}H${cx + lado * ri}V${ys}A${ri},${ri} 0 0 ${barridoInt} ${cx},${ys - ri}Z" fill="${T}" stroke="none"/>`;
    s += `<path d="M${cx - ro},${yb}V${ys}A${ro},${ro} 0 0 1 ${cx + ro},${ys}V${yb}"/>`;
    s += `<path d="M${cx - ri},${yb}V${ys}A${ri},${ri} 0 0 1 ${cx + ri},${ys}V${yb}" stroke-width="1.8"/>`;
    s += `<path d="M${cx},${ys - ri}V${yb}M${cx - ri},356H${cx + ri}" stroke-width="2.2"/>`;
    s += `<path d="M${cx - 38},${yb}H${cx + 38}V${yb + 7}H${cx - 38}Z" fill="${P}" stroke-width="2"/>`;
    s += `<path d="M${cx - 32},${yb + 7}H${cx + 32}L${cx + 28},${yb + 26}H${cx - 28}Z" fill="${T}" stroke-width="2"/>`;
    s += `<path d="M${cx - 26},${yb + 13}H${cx + 26}M${cx - 24},${yb + 20}H${cx + 24}" stroke="${P}" stroke-width="1.4" opacity=".7"/>`;
    return s;
  }

  /* ================================================================
     FACHADA · devuelve { casa, vivo }:
     · casa: el dibujo quieto con filtro de tinta (con huecos en la
       puerta y las ventanas, para que se vea lo que hay detrás)
     · vivo: enredaderas que crecen + el ▽ donde aterriza el logo
     ================================================================ */
  function fachada({ nombre = CFG.nombre || 'Inluna' } = {}) {
    const r = A.azar('fachada-simetrica');
    const abrir = (clase) => `<svg class="fachada-svg ${clase}" viewBox="0 0 ${W} ${H}" aria-hidden="true" focusable="false" overflow="visible">`;

    // ----- muros (con huecos) -----
    let casa = `<path fill-rule="evenodd" fill="${P}" stroke="none" d="M50,284H590V${SUELO}H50Z M222,304H418V${SUELO}H222Z` +
      ` M97,410V334A27,27 0 0 1 151,334V410Z M489,410V334A27,27 0 0 1 543,334V410Z"/>`;
    let zocalo = '';
    for (let x = 64; x < 200; x += 12) zocalo += `M${x},469h6v6h-6Z M${eje(x) - 6},469h6v6h-6Z`;
    casa += `<path d="${zocalo}" fill="${T}" stroke="none"/>`;
    casa += `<path d="M50,284V${SUELO}M590,284V${SUELO}"/><path d="M58,284V${SUELO}M582,284V${SUELO}" stroke-width="1.6"/>`;
    casa += `<path d="M204,284V${SUELO}M436,284V${SUELO}" stroke-width="2.2"/><path d="M211,284V${SUELO}M429,284V${SUELO}" stroke-width="1.4"/>`;
    casa += `<path d="M50,462H204M436,462H590" stroke-width="1.4"/>`;
    // marco azul de la puerta (doble, como en tu boceto)
    casa += `<path d="M214,${SUELO}V296H426V${SUELO}" stroke="${T}" stroke-width="3.4"/><path d="M221,${SUELO}V303H419V${SUELO}" stroke="${T}" stroke-width="2"/>`;
    casa += ventanaEstatica(124, 1) + ventanaEstatica(516, -1);
    // ----- friso + letrero central -----
    casa += friso();
    casa += `<rect x="258" y="238" width="124" height="54" rx="9" fill="${P}" stroke-width="2.6"/>` +
      `<rect x="264" y="244" width="112" height="42" rx="6" stroke="${T}" stroke-width="1.4"/>` +
      `<path d="${A.destello(276, 265, 4.6, 0.2)}" fill="${T}" stroke="none"/><path d="${A.destello(364, 265, 4.6, 0.2)}" fill="${T}" stroke="none"/>`;
    // ----- falda del techo con tejas -----
    casa += `<path d="${FALDA}" fill="${P}" stroke="none"/>` + tejas(r) + `<path d="${FALDA}"/>`;
    casa += `<path d="M60,236C58,239 59,242 63,244H577C581,242 582,239 580,236" stroke-width="2"/>`;
    // ----- frontón (con curva de pagoda) -----
    casa += `<path d="M186,146C268,128 311,72 320,34C329,72 372,128 454,146L440,150H200Z" fill="${P}" stroke="none"/>`;
    casa += `<path d="M320,34C311,72 268,128 186,146C181,147 178,145 176,141"/>`;
    casa += `<path d="M320,34C329,72 372,128 454,146C459,147 462,145 464,141"/>`;
    casa += `<path d="M320,50C312,84 272,134 200,150M320,50C328,84 368,134 440,150" stroke-width="2"/>`;
    casa += `<path d="M200,150H440" stroke-width="2.2"/>`;
    casa += `<path d="${A.destello(CX, 22, 7.5, 0.18)}" fill="${T}" stroke-width="1.6"/>`;

    // ----- suelo -----
    let suelo = `<path d="M-700,${SUELO + 1}C-300,${SUELO - 2} 100,${SUELO + 2} ${CX},${SUELO}C540,${SUELO - 2} 940,${SUELO + 2} 1340,${SUELO + 1}" stroke-width="2.6"/>`;
    let hierba = '';
    for (let x = 36; x > -680; x -= 30 + r() * 52) {
      const a = 5 + r() * 6;
      [x, eje(x)].forEach((xx, k) => {
        const s1 = k ? -1 : 1;
        hierba += `M${f(xx)},${SUELO}q${-2 * s1},-${f(a)} ${-6 * s1},-${f(a + 3)}M${f(xx)},${SUELO}q${s1},-${f(a + 3)} ${2 * s1},-${f(a + 6)}M${f(xx)},${SUELO}q${3 * s1},-${f(a - 1)} ${8 * s1},-${f(a + 1)}`;
      });
    }
    suelo += `<path d="${hierba}" stroke-width="1.6"/>`;
    [[490, 40, 5], [509, 50, 6.5]].forEach(([y, rx, ry]) => {
      suelo += `<ellipse cx="${CX}" cy="${y}" rx="${rx}" ry="${ry}" fill="${P}" stroke-width="1.8"/>`;
    });
    [[-150, 494], [-60, 504], [30, 500]].forEach(([x, y]) => {
      const rx = f(3 + r() * 4), ry = f(1.6 + r() * 1.4);
      suelo += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" stroke-width="1.4"/><ellipse cx="${eje(x)}" cy="${y}" rx="${rx}" ry="${ry}" stroke-width="1.4"/>`;
    });

    let s = abrir('fachada-casa') +
      `<defs>${A.filtroTinta('tinta-fachada', { escala: 2.4, frecuencia: 0.028, semilla: 11 })}</defs>` +
      `<g class="fz-suelo" fill="none" stroke="${O}" stroke-linecap="round" filter="url(#tinta-fachada)">${suelo}</g>` +
      `<g class="fz-casa" filter="url(#tinta-fachada)" fill="none" stroke="${O}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round">${casa}</g>`;
    const largo = String(nombre).length;
    const ajuste = largo > 8 ? ` textLength="84" lengthAdjust="spacingAndGlyphs"` : '';
    s += `<text class="fz-letrero" x="${CX}" y="274" text-anchor="middle" fill="${O}"${ajuste}>${escapar(nombre)}</text></svg>`;

    // ----- capa viva: el ▽ del frontón y las enredaderas -----
    const L = FACHADA.logo;
    let v = abrir('fachada-viva') +
      `<g class="fz-logo" transform="translate(${L.x},${L.y}) scale(${L.w / 100})"><rect width="100" height="88" fill="none" stroke="none"/>${A.logoPartes()}</g>`;
    let enr = '';
    const par = (pts, op) => {
      enr += A.enredadera(pts, op);
      enr += A.enredadera(espejo(pts), Object.assign({}, op, { semilla: op.semilla + 100 }));
    };
    par([[58, 478], [46, 446], [60, 414], [46, 382], [60, 350], [46, 318], [58, 292], [44, 268], [30, 250], [20, 230]],
      { semilla: 3, retraso: 0.1, dur: 2.1, hoja: [9, 15], paso: 14 });
    par([[92, 244], [96, 262], [90, 280], [95, 296]], { semilla: 12, retraso: 1.5, dur: 0.8, hoja: [6, 11], paso: 11, grosor: 1.6 });
    par([[150, 242], [153, 258], [148, 272]], { semilla: 14, retraso: 1.7, dur: 0.7, hoja: [6, 10], paso: 11, grosor: 1.6 });
    enr += A.enredadera([[206, 334], [212, 306], [240, 298], [266, 306], [293, 298], [320, 305], [347, 298], [374, 306], [400, 298], [428, 306], [434, 334]],
      { semilla: 8, retraso: 0.8, dur: 1.7, hoja: [7, 12], paso: 13, flores: 0.2, grosor: 1.8 });
    par([[100, 419], [98, 404], [104, 392], [100, 380]], { semilla: 31, retraso: 1.1, dur: 0.7, hoja: [7, 11], paso: 8, zarcillos: 0, flores: 0.25 });
    par([[146, 419], [149, 405], [144, 394]], { semilla: 33, retraso: 1.25, dur: 0.6, hoja: [6, 10], paso: 8, zarcillos: 0 });
    [[20, 478], [-90, 478], [-240, 478]].forEach(([x, y], i) => {
      par([[x, y], [x + 2, y - 14], [x - 2, y - 28]], { semilla: 40 + i, retraso: 1 + i * 0.1, dur: 0.6, hoja: [6, 9], paso: 7, zarcillos: 0, grosor: 1.4 });
    });
    v += `<g class="fz-enredaderas">${enr}</g></svg>`;
    return { casa: s, vivo: v };
  }

  /* ---------- piezas que se pueden tocar ---------- */
  function hojaPuerta() {
    const w = 98, h = 174, cx = 49, cy = 54, R1 = 32, R2 = 26;
    let s = `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="${P}" stroke="${T}" stroke-width="3"/>`;
    s += `<path d="M${cx - R1},96V${cy}A${R1},${R1} 0 0 1 ${cx + R1},${cy}V96Z" fill="${P}" stroke="${T}" stroke-width="2.6"/>`;
    s += `<path d="M${cx},${cy - R1}A${R1},${R1} 0 0 1 ${cx + R1},${cy}V96H${cx + R2}V${cy}A${R2},${R2} 0 0 0 ${cx},${cy - R2}Z" fill="${T}"/>`;
    s += `<path d="M${cx - R2},96V${cy}A${R2},${R2} 0 0 1 ${cx + R2},${cy}V96" fill="none" stroke="${T}" stroke-width="1.3"/>`;
    s += `<path d="${A.destello(cx - 3, cy + 9, 12, 0.16)}" fill="${T}"/>`;
    s += `<rect x="16" y="106" width="66" height="56" rx="2" fill="none" stroke="${T}" stroke-width="2.4"/>`;
    for (let j = 0; j < 3; j++) {
      for (let i = 0; i < 4; i++) s += `<circle cx="${f(26 + i * 15 + (j % 2) * 7.5 - 3.75)}" cy="${f(119 + j * 15)}" r="${j % 2 ? 1.6 : 2.4}" fill="${T}"/>`;
    }
    s += `<rect x="84" y="92" width="5" height="24" rx="2.5" fill="${O}"/>`;
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><g filter="url(#tinta-fachada)" stroke-linejoin="round">${s}</g></svg>`;
  }

  /* Lo que se ve por la puerta al abrirse: la galería de arcos del interior */
  function huecoPuerta() {
    const w = 196, h = 174, c = w / 2;
    let s = `<defs><radialGradient id="hueco-luz" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#fffdf6"/><stop offset=".6" stop-color="${P}"/><stop offset="1" stop-color="#e2d3b3"/></radialGradient></defs>`;
    s += `<rect width="${w}" height="${h}" fill="url(#hueco-luz)"/>`;
    s += `<circle cx="${c}" cy="38" r="21" fill="${T}" stroke="${O}" stroke-width="1.6"/><circle cx="${c}" cy="38" r="25" fill="none" stroke="${O}" stroke-width="1.2"/>`;
    s += `<g transform="translate(${c},42) rotate(90)"><path d="M0,-9A9,9 0 0 1 0,9A5,9 0 0 0 0,-9Z" fill="${P}"/></g>`;
    s += `<path d="M0,138H${w}V${h}H0Z" fill="#eadcbf"/><path d="M0,138H${w}" stroke="${O}" stroke-width="1.2" opacity=".5"/>`;
    for (let k = -4; k <= 4; k++) s += `<path d="M${c + k * 14},138L${c + k * 60},${h}" stroke="${O}" stroke-width="1" opacity=".2"/>`;
    [[36, 30, 0], [c, 40, 1], [w - 36, 30, 2]].forEach(([x, ancho, i]) => {
      const r0 = ancho / 2, alto = ancho * 1.45, y = 134 - alto;
      s += `<g class="hueco-marco" style="--i:${i}"><path d="M${x - r0},134V${f(y + r0)}A${r0},${r0} 0 0 1 ${x + r0},${f(y + r0)}V134Z" fill="${P}" stroke="${O}" stroke-width="1.5"/>` +
        `<path d="M${x - r0 + 4},131V${f(y + r0 + 1)}A${r0 - 4},${r0 - 4} 0 0 1 ${x + r0 - 4},${f(y + r0 + 1)}V131Z" fill="${T}" opacity=".85"/>` +
        `<path d="${A.destello(x, y + alto * 0.45, ancho * 0.16, 0.2)}" fill="${P}"/></g>`;
    });
    [c - 42, c + 42].forEach((x) => {
      s += `<path d="M${x},0V12" stroke="${O}" stroke-width="1.1"/><path d="M${x - 9},22Q${x - 8},12 ${x},12Q${x + 8},12 ${x + 9},22Z" fill="${T}" stroke="${O}" stroke-width="1.2"/><circle cx="${x}" cy="25" r="2.6" fill="#fff9e8"/>`;
    });
    return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}</svg>`;
  }

  /* Luz detrás de una ventana (se enciende y apaga al tocarla) */
  function luzVentana(i) {
    const id = `luz-v${i}`;
    return `<svg viewBox="0 0 58 107" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
      `<defs><radialGradient id="${id}" cx="50%" cy="62%" r="70%"><stop offset="0" stop-color="#fffbea"/><stop offset=".55" stop-color="${LUZ}"/><stop offset="1" stop-color="#f1cf7e"/></radialGradient></defs>` +
      `<rect class="vl-encendida" width="58" height="107" fill="url(#${id})"/>` +
      `<rect class="vl-apagada" width="58" height="107" fill="${O}"/>` +
      `<path d="M4,78H54" stroke="${O}" stroke-width="2" opacity=".55"/>` +
      `<path d="M13,78V66Q13,58 19,58Q25,58 25,66V78Z M31,78V70Q31,62 38,60Q45,62 45,70V78Z" fill="${T}" opacity=".7"/>` +
      `<path class="vl-destello" d="${A.destello(29, 34, 6, 0.2)}" fill="${T}" opacity=".45"/></svg>`;
  }

  /* Farol de papel colgante */
  function farol() {
    return `<svg viewBox="0 0 40 78" aria-hidden="true" focusable="false" overflow="visible">` +
      `<path d="M20,0V16" stroke="${O}" stroke-width="1.5"/>` +
      `<path d="M13,16H27L29,21H11Z" fill="${O}"/>` +
      `<path d="M11,21C3,26 2,50 11,56H29C38,50 37,26 29,21Z" fill="${P}" stroke="${O}" stroke-width="2"/>` +
      `<path d="M7,30H33M5,38H35M6,46H34" stroke="${T}" stroke-width="1.4" fill="none"/>` +
      `<path d="${A.destello(20, 38, 6, 0.2)}" fill="${T}"/>` +
      `<path d="M11,56H29L27,61H13Z" fill="${O}"/>` +
      `<path d="M20,61V72M17,72H23" stroke="${T}" stroke-width="1.6"/></svg>`;
  }

  /* Maceta con plantita y una flor escondida que florece al tocarla */
  function maceta(i) {
    const r = A.azar(`maceta-${i}`);
    const w = 56, h = 106, c = w / 2, base = h, alto = 36, yT = base - alto;
    const cuerpo = `M${c - 16},${yT + 8}H${c + 16}L${c + 12},${base}H${c - 12}Z`;
    let deco = i === 0
      ? `<path d="M${c - 14},${yT + 17}H${c + 14}M${c - 13},${yT + 26}H${c + 13}" stroke="${T}" stroke-width="3"/>`
      : [-8, 0, 8].map((dx) => `<circle cx="${c + dx}" cy="${yT + 21}" r="2.4" fill="${T}"/>`).join('');
    let hojas = '';
    [[-1, 0], [0, 1], [1, 2]].forEach(([dir, k]) => {
      hojas += A.enredadera([[c + dir * 2, yT + 2], [c + dir * 7, yT - 18], [c + dir * 13 + (r() - 0.5) * 4, yT - 38]],
        { semilla: 70 + i * 5 + k, retraso: 0, dur: 0.01, hoja: [8, 12], paso: 8, zarcillos: 0, flores: 0, grosor: 1.6, clase: 'fija' });
    });
    return `<svg viewBox="0 0 ${w} ${h}" aria-hidden="true" focusable="false" overflow="visible">` +
      `<g class="mc-planta">${hojas}</g>` +
      `<g class="mc-flor" style="transform-origin:${c}px ${yT - 40}px">` +
      [0, 72, 144, 216, 288].map((a) => `<ellipse cx="${c}" cy="${yT - 47}" rx="4" ry="6.5" transform="rotate(${a} ${c} ${yT - 40})" fill="${P}" stroke="${O}" stroke-width="1.2"/>`).join('') +
      `<circle cx="${c}" cy="${yT - 40}" r="3.4" fill="${T}"/></g>` +
      `<path d="${cuerpo}" fill="${P}" stroke="${O}" stroke-width="2"/>${deco}` +
      `<path d="M${c - 19},${yT}H${c + 19}V${yT + 8}H${c - 19}Z" fill="${T}" stroke="${O}" stroke-width="2"/></svg>`;
  }

  /* Luna en forma de barca (con las puntas hacia arriba: simétrica) */
  function luna() {
    const c = 70, r = 44;
    return `<svg viewBox="0 0 140 140" aria-hidden="true" focusable="false" overflow="visible">` +
      `<defs><radialGradient id="halo-luna"><stop offset="0" stop-color="#fff7da" stop-opacity=".95"/><stop offset=".5" stop-color="#fff7da" stop-opacity=".4"/><stop offset="1" stop-color="#fff7da" stop-opacity="0"/></radialGradient></defs>` +
      `<circle class="luna-halo" cx="${c}" cy="${c}" r="70" fill="url(#halo-luna)"/>` +
      `<circle class="luna-llena" cx="${c}" cy="${c}" r="${r}" fill="#fffaf0" stroke="${O}" stroke-width="1.4"/>` +
      `<circle cx="${c}" cy="${c}" r="${r}" fill="none" stroke="${O}" stroke-width="1.4" stroke-dasharray="2 6" opacity=".5"/>` +
      `<g transform="rotate(90 ${c} ${c})"><path d="M${c},${c - r}A${r},${r} 0 0 1 ${c},${c + r}A${f(r * 0.56)},${r} 0 0 0 ${c},${c - r}Z" fill="${T}" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/></g>` +
      `<path d="M${f(c - r * 0.55)},${f(c + r * 0.66)}Q${c},${f(c + r * 0.82)} ${f(c + r * 0.55)},${f(c + r * 0.66)}" stroke="${P}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>` +
      `</svg>`;
  }

  /* Cielo: estrellas y puntitos repartidos (se ven en todo el fondo) */
  function estrellas(ancho, alto) {
    const r = A.azar(`cielo-${Math.round(ancho / 50)}`);
    let s = '', chispas = '';
    const n = Math.round(Math.min(30, 10 + ancho / 60));
    for (let i = 0; i < n; i++) {
      const x = 10 + r() * (ancho - 20), y = 10 + r() * (alto - 20);
      if (r() < 0.45) s += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 + r())}" fill="${O}"/>`;
      else chispas += `<path class="chispa" style="--i:${i}" d="${A.destello(x, y, 3 + r() * 5, 0.18)}" fill="${r() < 0.5 ? T : 'none'}" stroke="${O}" stroke-width="1.2" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 ${f(ancho)} ${f(alto)}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${s}${chispas}</svg>`;
  }

  function nube(k = 0) {
    return k
      ? `<svg viewBox="0 0 64 24" aria-hidden="true"><path d="M3,20q6,-10 16,-5q6,-10 16,-3q9,0 9,8" fill="none" stroke="${O}" stroke-width="1.8" stroke-linecap="round"/></svg>`
      : `<svg viewBox="0 0 80 26" aria-hidden="true"><path d="M3,22q8,-13 21,-7q7,-13 22,-4q13,-2 13,11" fill="none" stroke="${O}" stroke-width="1.9" stroke-linecap="round"/></svg>`;
  }

  /* Arbustos del primer plano (el derecho es el mismo, en espejo) */
  function arbusto() {
    const r = A.azar('arbusto');
    let s = `<path d="M0,110C0,74 18,56 42,58C52,32 90,26 106,48C122,36 150,46 152,72C160,82 160,98 160,110Z" fill="${P}" stroke="${O}" stroke-width="2.4" stroke-linejoin="round"/>`;
    let hojas = '';
    for (let k = 0; k < 22; k++) {
      const x = 16 + r() * 128, y = 58 + r() * 46;
      const ang = -90 + (x - 80) * 0.9 + (r() - 0.5) * 50;
      hojas += `<path transform="translate(${f(x)},${f(y)}) rotate(${f(ang)})" d="${A.hojaD(10 + r() * 7)}" fill="${r() < 0.55 ? T : P}" stroke="${O}" stroke-width="1.1"/>`;
    }
    [[52, 70], [100, 58], [128, 86]].forEach(([x, y]) => { hojas += `<path d="${A.destello(x, y, 5.5, 0.2)}" fill="${T}" stroke="${O}" stroke-width=".8"/>`; });
    let trama = '';
    for (let x = 118; x < 160; x += 6) trama += `M${x},110L${x + 10},72`;
    return `<svg viewBox="0 0 160 110" preserveAspectRatio="xMinYMax meet" aria-hidden="true" focusable="false">${s}<path d="${trama}" stroke="${O}" stroke-width="1.3" opacity=".22"/>${hojas}</svg>`;
  }

  /* ================================================================
     INTERIOR · piezas sueltas para la galería
     ================================================================ */
  function ventanaLuna(R) {
    const id = A.nuevoId('vl');
    const Ri = R - 10;
    let dentro = `<rect x="${-R}" y="${-R}" width="${2 * R}" height="${2 * R}" fill="${T}"/>`;
    let d = '';
    for (let x = -R * 2; x < R * 2; x += 7) d += `M${f(x)},${-R}L${f(x + R)},${R}`;
    dentro += `<path d="${d}" stroke="${O}" stroke-width="1.2" opacity=".2"/>`;
    const mr = Ri * 0.3, my = -Ri * 0.18;
    dentro += `<g transform="translate(0,${f(my)}) rotate(90)">` +
      `<circle r="${f(mr)}" fill="none" stroke="${P}" stroke-width="1.3" stroke-dasharray="2 6" opacity=".55"/>` +
      `<path d="M0,${f(-mr)}A${f(mr)},${f(mr)} 0 0 1 0,${f(mr)}A${f(mr * 0.56)},${f(mr)} 0 0 0 0,${f(-mr)}Z" fill="${P}"/></g>`;
    [[-0.52, -0.34, 0.1], [0.52, -0.34, 0.1], [-0.2, -0.66, 0.055], [0.2, -0.66, 0.055], [-0.66, 0.06, 0.05], [0.66, 0.06, 0.05], [-0.3, 0.22, 0.04], [0.3, 0.22, 0.04]].forEach(([x, y, k]) => {
      dentro += `<path d="${A.destello(x * Ri, y * Ri, k * Ri * 1.3, 0.18)}" fill="${P}"/>`;
    });
    dentro += `<path d="M${-R},${f(Ri * 0.5)}H${R}V${R}H${-R}Z" fill="${O}" opacity=".25"/>`;
    for (let fila = 0; fila < 4; fila++) {
      const y = Ri * (0.48 + fila * 0.14);
      let dd = `M${f(-Ri - 20)},${f(y)}`;
      for (let x = -Ri - 20; x < Ri + 20; x += Ri * 0.25) dd += `q${f(Ri * 0.0625)},${f(-Ri * 0.07)} ${f(Ri * 0.125)},0t${f(Ri * 0.125)},0`;
      dentro += `<path d="${dd}" stroke="${P}" stroke-width="1.8" fill="none" opacity="${f(0.95 - fila * 0.2)}"/>`;
    }
    return `<defs><clipPath id="${id}"><circle r="${Ri}"/></clipPath></defs>` +
      `<circle r="${R + 6}" fill="${P}" stroke="${O}" stroke-width="3"/>` +
      `<path d="M0,${-(R + 6)}A${R + 6},${R + 6} 0 0 1 0,${R + 6}L0,${Ri}A${Ri},${Ri} 0 0 0 0,${-Ri}Z" fill="${T}"/>` +
      `<g clip-path="url(#${id})">${dentro}</g>` +
      `<circle r="${Ri}" fill="none" stroke="${O}" stroke-width="2.4"/>` +
      `<circle r="${R + 6}" fill="none" stroke="${O}" stroke-width="3"/>`;
  }
  function ventanaLunaSVG(R = 150) {
    const m = R + 10;
    return `<svg viewBox="${-m} ${-m} ${2 * m} ${2 * m}" aria-hidden="true" focusable="false">` +
      `<defs>${A.filtroTinta('tinta-luna', { escala: 2.2, frecuencia: 0.03, semilla: 5 })}</defs><g filter="url(#tinta-luna)">${ventanaLuna(R)}</g></svg>`;
  }

  /* Lámpara colgante del interior (largo = cordón) */
  function lampara(largo = 40) {
    const x = 30, y = largo;
    return `<svg viewBox="0 0 60 ${largo + 70}" aria-hidden="true" focusable="false" overflow="visible">` +
      `<defs><radialGradient id="luz-lampara-${largo}"><stop offset="0" stop-color="${LUZ}" stop-opacity=".95"/><stop offset=".45" stop-color="${LUZ}" stop-opacity=".45"/><stop offset="1" stop-color="${LUZ}" stop-opacity="0"/></radialGradient></defs>` +
      `<circle class="lp-luz" cx="${x}" cy="${y + 38}" r="48" fill="url(#luz-lampara-${largo})"/>` +
      `<path d="M${x},0V${y}" stroke="${O}" stroke-width="1.6"/>` +
      `<path d="M${x - 21},${y + 25}Q${x - 19},${y} ${x},${y}Q${x + 19},${y} ${x + 21},${y + 25}Z" fill="${T}" stroke="${O}" stroke-width="2"/>` +
      `<path d="M${x - 13},${y + 10}Q${x},${y + 5} ${x + 13},${y + 10}M${x - 17},${y + 18}Q${x},${y + 13} ${x + 17},${y + 18}" stroke="${P}" stroke-width="1.4" fill="none" opacity=".7"/>` +
      `<path d="M${x - 21},${y + 25}H${x + 21}" stroke="${O}" stroke-width="2"/>` +
      `<circle cx="${x}" cy="${y + 30}" r="5" fill="#fff8e6" stroke="${O}" stroke-width="1.4"/></svg>`;
  }

  /* Pilar entre arcos: la estrella con puntitos de tu friso */
  function pilar() {
    return `<svg viewBox="0 0 40 60" aria-hidden="true" focusable="false">` +
      `<path d="${A.destello(20, 30, 13, 0.18)}" fill="none" stroke="${O}" stroke-width="1.8" stroke-linejoin="round"/>` +
      [[6, 12], [34, 12], [6, 48], [34, 48]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="${O}"/>`).join('') + `</svg>`;
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
    FACHADA, caja, fachada, hojaPuerta, huecoPuerta, luzVentana, farol, maceta, luna, estrellas, nube, arbusto,
    ventanaLuna, ventanaLunaSVG, lampara, pilar, enredaderaColgante, escapar,
  };
})();
