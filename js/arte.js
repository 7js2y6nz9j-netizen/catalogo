/* ==================================================================
   arte.js · Dibujos en tinta para el catálogo Inluna
   ------------------------------------------------------------------
   Todo el arte (logo, patrones, marcos de arco, friso, enredaderas e
   íconos) se genera aquí como SVG: no hay imágenes pesadas que
   descargar y todo usa los mismos colores de config.js.
   ================================================================== */
(function () {
  'use strict';

  const CFG = window.INLUNA_CONFIG || {};
  const COL = Object.assign({
    tinta: '#2742b0', oscura: '#3a2a1f', papel: '#f4eee1',
    verde: '#00aa1f', verdeClaro: '#8fcf7e', cafe: '#8b5a35', dorado: '#d99a2b', luna: '#e9decf',
  }, CFG.colores || {});
  const T = COL.tinta;       // azul talavera: solo azulejos, frisos, macetas y marcos
  const O = COL.oscura;      // tinta café: contornos
  const P = COL.papel;       // papel crema
  const V = COL.verde;       // hojas y logo
  const VC = COL.verdeClaro; // hojas claras
  const C = COL.cafe;        // ramas y techo
  const D = COL.dorado;      // estrellas y flores
  const LU = COL.luna;       // la luna de Inluna
  const R3 = Math.sqrt(3);
  const f = (n) => Math.round(n * 10) / 10;
  const pt = (p) => `${f(p[0])},${f(p[1])}`;
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  let contador = 0;
  const nuevoId = (p) => `${p}-${++contador}`;

  /* ---------- azar con semilla (mismo dibujo cada vez) ---------- */
  function hashTexto(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function azar(semilla) {
    let a = typeof semilla === 'number' ? semilla >>> 0 : hashTexto(String(semilla));
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const aUri = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  /* Filtro que hace temblar un poco las líneas, como tinta a mano */
  function filtroTinta(id, { escala = 2.4, frecuencia = 0.03, semilla = 7 } = {}) {
    return `<filter id="${id}" x="-4%" y="-4%" width="108%" height="108%" color-interpolation-filters="sRGB">` +
      `<feTurbulence type="fractalNoise" baseFrequency="${frecuencia}" numOctaves="2" seed="${semilla}" result="ruido"/>` +
      `<feDisplacementMap in="SourceGraphic" in2="ruido" scale="${escala}" xChannelSelector="R" yChannelSelector="G"/>` +
      `</filter>`;
  }

  /* ---------- formas pequeñas ---------- */
  // Estrella de 4 puntas con lados curvos (el destello de tus dibujos)
  function destello(cx, cy, r, k = 0.2) {
    const a = r * k;
    return `M${f(cx)},${f(cy - r)}Q${f(cx + a)},${f(cy - a)} ${f(cx + r)},${f(cy)}` +
      `Q${f(cx + a)},${f(cy + a)} ${f(cx)},${f(cy + r)}Q${f(cx - a)},${f(cy + a)} ${f(cx - r)},${f(cy)}` +
      `Q${f(cx - a)},${f(cy - a)} ${f(cx)},${f(cy - r)}Z`;
  }
  // Hoja con la base en (0,0) apuntando hacia +x
  function hojaD(s) {
    const a = s * 0.4;
    return `M0,0C${f(s * 0.28)},${f(-a)} ${f(s * 0.72)},${f(-a)} ${f(s)},0C${f(s * 0.72)},${f(a)} ${f(s * 0.28)},${f(a)} 0,0Z`;
  }
  const sombraSuelo = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${O}" opacity=".12"/>`;

  /* ================================================================
     LOGO · las seis hojas verdes de Inluna, girando alrededor del
     centro (50,50). La hoja se trazó sobre tu logo original.
     ================================================================ */
  const HOJA_LOGO = 'M0,37.9C1.2,37.2 2.2,36.4 3.4,35.7C4.5,35.1 5.7,34.4 6.9,33.9C8.2,33.3 9.4,32.9 10.7,32.6' +
    'C12,32.2 13.3,31.9 14.6,31.7C15.9,31.5 17.3,31.4 18.6,31.4C19.9,31.3 21.3,31.4 22.6,31.6C23.9,31.7 25.2,32 26.5,32.3' +
    'C27.8,32.7 29.1,33 30.3,33.5C31.6,33.9 32.8,34.5 34,35.1C35.2,35.7 36.4,36.3 37.5,37.1C38.6,37.8 39.8,38.6 40.5,39.6' +
    'C41.3,40.6 42.2,42.1 42.1,43.2C41.9,44.3 40.7,45.4 39.7,46.2C38.7,47 37.3,47.5 36.1,48C34.8,48.4 33.5,48.7 32.2,49' +
    'C30.9,49.3 29.6,49.5 28.3,49.7C27,49.8 25.6,49.8 24.3,49.8C22.9,49.8 21.6,49.8 20.3,49.6C19,49.5 17.6,49.2 16.4,48.9' +
    'C15.1,48.5 13.8,48.1 12.6,47.5C11.4,47 10.2,46.4 9,45.7C7.9,45.1 6.7,44.4 5.7,43.5C4.6,42.7 3.6,41.8 2.7,40.9' +
    'C1.8,39.9 0.9,38.9 0,37.9Z';

  // Gira los puntos de una ruta (solo M y C absolutos) alrededor de (cx,cy)
  function girarRuta(d, grados, cx = 50, cy = 50) {
    const a = grados * Math.PI / 180, co = Math.cos(a), si = Math.sin(a);
    return d.replace(/(-?\d*\.?\d+),(-?\d*\.?\d+)/g, (m, sx, sy) => {
      const x = Number(sx) - cx, y = Number(sy) - cy;
      return `${f(cx + x * co - y * si)},${f(cy + x * si + y * co)}`;
    });
  }
  // Las seis hojas ya giradas (sin transform, para poder animarlas con CSS)
  const HOJAS_LOGO = [0, 1, 2, 3, 4, 5].map((k) => girarRuta(HOJA_LOGO, k * 60));

  function logoPartes({ color = V } = {}) {
    return `<g class="hojas-logo">${HOJAS_LOGO.map((d) => `<path class="hoja-logo" d="${d}" fill="${color}"/>`).join('')}</g>`;
  }

  function logo({ clase = '', etiqueta = '' } = {}) {
    const a11y = etiqueta ? `role="img" aria-label="${etiqueta}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="logo ${clase}" viewBox="0 0 100 100" ${a11y}>${logoPartes()}</svg>`;
  }

  /* La luna de Inluna: media luna con tres patas (medidas de tu logo) */
  const LUNA_CAJA = { x: 19, y: 46, w: 211, h: 195 };
  const LUNA_LOGO = [
    'M19,46A105.5,105.5 0 0 0 230,46H184.8A61,61 0 0 1 64.2,46Z',
    'M26,99.3A112,112 0 0 0 66,141.5V207H26Z',
    'M104,156.1A112,112 0 0 0 145,156.1V241H104Z',
    'M183,141.5A112,112 0 0 0 223,99.3V207H183Z',
  ];
  function lunaPartes({ relleno = LU, contorno = '', grosor = 0 } = {}) {
    const trazo = contorno ? ` stroke="${contorno}" stroke-width="${grosor}" stroke-linejoin="round"` : '';
    return `<g class="luna-logo">${LUNA_LOGO.map((d) => `<path d="${d}" fill="${relleno}"${trazo}/>`).join('')}</g>`;
  }
  function lunaLogo({ clase = '', relleno, contorno, grosor, etiqueta = '' } = {}) {
    const m = grosor ? grosor : 0, c = LUNA_CAJA;
    const a11y = etiqueta ? `role="img" aria-label="${etiqueta}"` : 'aria-hidden="true" focusable="false"';
    return `<svg class="luna-svg ${clase}" viewBox="${c.x - m} ${c.y - m} ${c.w + 2 * m} ${c.h + 2 * m}" ${a11y}>${lunaPartes({ relleno, contorno, grosor })}</svg>`;
  }

  /* ================================================================
     PATRONES · inspirados en tu hoja de referencia (tinta azul)
     Cada uno recibe (ancho, alto, azar) y devuelve SVG.
     ================================================================ */
  const PATRONES = {
    escamas(w, h) {
      const R = 44; let s = '';
      for (let j = 0, y = -R * 0.5; y < h + R; j++, y += R * 0.5) {
        const off = (j % 2) ? R : 0;
        for (let x = -2 * R + off; x < w + 2 * R; x += 2 * R) {
          let abanico = '';
          for (let a = -150; a <= -30; a += 20) {
            const c = Math.cos(a * Math.PI / 180), sn = Math.sin(a * Math.PI / 180);
            abanico += `M${f(c * R * 0.1)},${f(sn * R * 0.1)}L${f(c * R * 0.34)},${f(sn * R * 0.34)}`;
          }
          s += `<g transform="translate(${f(x)},${f(y)})"><circle r="${R}" fill="${P}"/><circle r="${f(R * 0.72)}"/>` +
            `<circle r="${f(R * 0.47)}" stroke-width="2.4"/><path d="${abanico}" stroke-width="2"/></g>`;
        }
      }
      return s;
    },
    olas(w, h) {
      let s = '';
      const U = 150, A = 44, paso = 66;
      for (let fila = 0, y = 34; y < h + A + 30; fila++, y += paso) {
        const off = (fila % 2) * U * 0.5;
        let cresta = '', lineas = '';
        for (let x = -U * 2 + off; x < w + U; x += U) {
          cresta += `M${f(x)},${f(y)}C${f(x + U * 0.36)},${f(y)} ${f(x + U * 0.44)},${f(y - A)} ${f(x + U * 0.7)},${f(y - A)}` +
            `C${f(x + U * 0.93)},${f(y - A)} ${f(x + U * 0.99)},${f(y - A * 0.4)} ${f(x + U * 0.86)},${f(y - A * 0.36)}` +
            `C${f(x + U * 0.77)},${f(y - A * 0.33)} ${f(x + U * 0.76)},${f(y - A * 0.62)} ${f(x + U * 0.85)},${f(y - A * 0.64)}`;
          cresta += `M${f(x + U * 0.8)},${f(y - A * 0.2)}C${f(x + U * 0.87)},${f(y - 3)} ${f(x + U * 0.94)},${f(y)} ${f(x + U)},${f(y)}`;
          for (let k = 1; k <= 3; k++) {
            const yy = y + k * 9;
            lineas += `M${f(x + U * 0.05 * k)},${f(yy)}C${f(x + U * 0.38)},${f(yy)} ${f(x + U * 0.48)},${f(yy - A + k * 9)} ${f(x + U * 0.68 - k * 4)},${f(yy - A + k * 8)}`;
          }
        }
        s += `<path d="${lineas}" stroke-width="2"/><path d="${cresta}" stroke-width="3.2"/>`;
      }
      return s;
    },
    puntos(w, h, r) {
      let s = ''; const paso = 30;
      for (let y = paso / 2; y < h; y += paso) {
        for (let x = paso / 2; x < w; x += paso) {
          const rr = 1.8 + r() * r() * 7.5;
          s += `<circle cx="${f(x + (r() - 0.5) * paso * 0.8)}" cy="${f(y + (r() - 0.5) * paso * 0.8)}" r="${f(rr)}" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    ajedrez(w, h) {
      const L = 64; let s = '';
      for (let j = 0; j * L < h; j++) {
        for (let i = 0; i * L < w; i++) {
          if ((i + j) % 2 === 0) s += `<rect x="${i * L + 2}" y="${j * L + 2}" width="${L - 4}" height="${L - 4}" rx="2" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    arcoiris(w, h) {
      const W = 76, H = 70; let s = '';
      for (let j = 0, y = 62; y < h + H; j++, y += H) {
        for (let x = -W + (j % 2) * W / 2; x < w + W; x += W) {
          const cx = x + W / 2; let d = '';
          for (let k = 0; k < 3; k++) {
            const rr = W * 0.42 - k * 9.5;
            d += `M${f(cx - rr)},${y}A${f(rr)},${f(rr)} 0 0 1 ${f(cx + rr)},${y}`;
          }
          s += `<path d="${d}"/>`;
        }
      }
      return s;
    },
    ramitas(w, h, r) {
      let s = ''; const col = 84, fila = 150, alto = 120;
      for (let j = 0, y = fila * 0.45; y < h + fila; j++, y += fila) {
        for (let x = col / 2 + (j % 2) * col / 2 - col; x < w + col; x += col) {
          const inc = (r() - 0.5) * 8;
          s += `<path d="M${f(x)},${f(y + alto / 2)}C${f(x - 4)},${f(y)} ${f(x + 4 + inc)},${f(y - alto / 4)} ${f(x + inc)},${f(y - alto / 2)}" stroke-width="2.4"/>`;
          for (let k = 0; k < 4; k++) {
            const yy = y + alto / 2 - 20 - k * 25;
            const xx = x + inc * (k / 4);
            s += `<path transform="translate(${f(xx)},${f(yy)}) rotate(-38)" d="${hojaD(21 - k * 1.5)}" fill="${T}" stroke="none"/>`;
            s += `<path transform="translate(${f(xx)},${f(yy - 9)}) rotate(-142)" d="${hojaD(20 - k * 1.5)}" fill="${T}" stroke="none"/>`;
          }
          s += `<path transform="translate(${f(x + inc)},${f(y - alto / 2)}) rotate(-90)" d="${hojaD(16)}" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    estrellas(w, h, r) {
      let s = ''; const paso = 58;
      for (let y = paso / 2; y < h; y += paso) {
        for (let x = paso / 2; x < w; x += paso) {
          const cx = x + (r() - 0.5) * paso * 0.55, cy = y + (r() - 0.5) * paso * 0.55;
          const rr = 6 + r() * 11, rayos = r() < 0.5 ? 6 : 8, rot = r() * Math.PI;
          let d = '';
          for (let k = 0; k < rayos; k++) {
            const a = rot + k * Math.PI * 2 / rayos;
            d += `M${f(cx)},${f(cy)}L${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`;
          }
          s += `<path d="${d}" stroke-width="2.4"/>`;
          if (r() < 0.5) s += `<circle cx="${f(cx + paso * 0.42)}" cy="${f(cy + paso * 0.22)}" r="2.3" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    cruces(w, h, r) {
      let d = ''; const paso = 40;
      for (let j = 0, y = paso / 2; y < h; j++, y += paso) {
        for (let x = paso / 2 + (j % 2) * paso / 2; x < w; x += paso) {
          const t = 7 + r() * 2;
          d += `M${f(x - t)},${f(y)}L${f(x + t)},${f(y)}M${f(x)},${f(y - t)}L${f(x)},${f(y + t)}`;
        }
      }
      return `<path d="${d}" stroke-width="2.6"/>`;
    },
    circulos(w, h) {
      let s = ''; const paso = 104;
      for (let y = paso / 2; y < h + paso; y += paso) {
        for (let x = paso / 2; x < w + paso; x += paso) {
          s += `<circle cx="${x}" cy="${y}" r="40"/><circle cx="${x}" cy="${y}" r="28"/><circle cx="${x}" cy="${y}" r="15" stroke-width="2.4"/>` +
            `<circle cx="${x}" cy="${y}" r="5" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    rombos(w, h) {
      let s = ''; const W = 76, H = 112;
      for (let j = 0, y = 0; y < h + H; j++, y += H / 2) {
        for (let x = (j % 2) * W / 2; x < w + W; x += W) {
          if (j % 2 === 0) {
            s += `<path d="M${x},${y - H / 2 + 5}L${x + W / 2 - 5},${y}L${x},${y + H / 2 - 5}L${x - W / 2 + 5},${y}Z" fill="${T}"/>` +
              `<path d="M${x},${y - H / 2 + 22}L${x},${y + H / 2 - 22}M${x - W / 2 + 21},${y}L${x + W / 2 - 21},${y}" stroke="${P}" stroke-width="1.8" opacity=".7"/>`;
          } else {
            s += `<circle cx="${x}" cy="${y}" r="3.6" fill="${T}" stroke="none"/>` +
              [[0, -15], [0, 15], [-11, 0], [11, 0]].map(([a, b]) => `<circle cx="${x + a}" cy="${y + b}" r="2" fill="${T}" stroke="none"/>`).join('');
          }
        }
      }
      return s;
    },
    gotas(w, h, r) {
      let s = ''; const px = 46, py = 64;
      for (let j = 0, y = py / 2; y < h + py; j++, y += py) {
        for (let x = px / 2 + (j % 2) * px / 2; x < w + px; x += px) {
          s += `<path transform="translate(${f(x)},${f(y)}) scale(${f(0.9 + r() * 0.3)})" d="M0,-16C3,-8 9,-1 9,6A9,9 0 0 1 -9,6C-9,-1 -3,-8 0,-16Z" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    zigzag(w, h) {
      let s = ''; const paso = 30, A = 16, U = 34;
      for (let y = 18; y < h + A; y += paso) {
        let d = `M-${U},${y}`;
        for (let x = -U, k = 0; x < w + U; x += U / 2, k++) d += `L${f(x + U / 2)},${f(y + (k % 2 ? 0 : A))}`;
        s += `<path d="${d}" stroke-width="2.6"/>`;
      }
      return s;
    },
    destellos(w, h) {
      let s = ''; const paso = 92;
      for (let y = paso / 2; y < h + paso; y += paso) {
        for (let x = paso / 2; x < w + paso; x += paso) {
          s += `<path d="${destello(x, y, 26, 0.15)}" fill="${T}" stroke="none"/>`;
          s += `<path d="${destello(x + paso / 2, y + paso / 2, 8, 0.2)}" fill="${T}" stroke="none"/>`;
          s += `<circle cx="${x + paso / 2}" cy="${y}" r="2.6" fill="${T}" stroke="none"/><circle cx="${x}" cy="${y + paso / 2}" r="2.6" fill="${T}" stroke="none"/>`;
        }
      }
      return s;
    },
    flores(w, h, r) {
      let s = ''; const paso = 100;
      for (let j = 0, y = paso / 2; y < h + paso; j++, y += paso) {
        for (let x = paso / 2 + (j % 2) * paso / 2 - paso / 2; x < w + paso; x += paso) {
          const rot = r() * 72; let pet = '';
          for (let k = 0; k < 5; k++) pet += `<ellipse cx="0" cy="-13" rx="7.5" ry="11.5" transform="rotate(${f(rot + k * 72)})" fill="${P}"/>`;
          s += `<path d="M${f(x)},${f(y + 2)}C${f(x - 3)},${f(y + 16)} ${f(x + 3)},${f(y + 28)} ${f(x)},${f(y + 38)}" stroke-width="2.2"/>`;
          s += `<path transform="translate(${f(x)},${f(y + 26)}) rotate(-28)" d="${hojaD(15)}" fill="${T}" stroke="none"/>`;
          s += `<path transform="translate(${f(x)},${f(y + 30)}) rotate(-152)" d="${hojaD(13)}" fill="${T}" stroke="none"/>`;
          s += `<g transform="translate(${f(x)},${f(y - 12)})">${pet}<circle r="5.5" fill="${T}" stroke="none"/></g>`;
        }
      }
      return s;
    },
    rayas(w, h, r) {
      let s = '', x = 8;
      while (x < w + 10) {
        const g = 1.6 + r() * r() * 7;
        s += `<path d="M${f(x)},-10L${f(x + (r() - 0.5) * 4)},${h + 10}" stroke-width="${f(g)}"/>`;
        x += 10 + r() * 14 + g;
      }
      return s;
    },
    arcos(w, h) {
      let s = ''; const W = 62, H = 94, r0 = 21;
      for (let j = 0, y = 64; y < h + H; j++, y += H) {
        for (let x = W / 2 + (j % 2) * W / 2 - W; x < w + W; x += W) {
          s += `<path d="M${x - r0},${y + 30}V${y}A${r0},${r0} 0 0 1 ${x + r0},${y}V${y + 30}Z" fill="${T}" stroke="none"/>`;
          s += `<path d="M${x - r0 + 8},${y + 30}V${y + 2}A${r0 - 8},${r0 - 8} 0 0 1 ${x + r0 - 8},${y + 2}V${y + 30}" stroke="${P}" stroke-width="2"/>`;
        }
      }
      return s;
    },
    tejido(w, h, r) {
      let d = ''; const L = 60;
      for (let j = 0; j * L < h; j++) {
        for (let i = 0; i * L < w; i++) {
          const x = i * L, y = j * L;
          for (let k = 1; k <= 5; k++) {
            const o = k * L / 6;
            if ((i + j) % 2) d += `M${x + 6},${f(y + o)}L${x + L - 6},${f(y + o + (r() - 0.5) * 2)}`;
            else d += `M${f(x + o)},${y + 6}L${f(x + o + (r() - 0.5) * 2)},${y + L - 6}`;
          }
        }
      }
      return `<path d="${d}" stroke-width="2.4"/>`;
    },
    cuadricula(w, h, r) {
      let d = ''; const paso = 13;
      for (let y = 4; y < h; y += paso) d += `M-5,${f(y + (r() - 0.5) * 2)}L${w + 5},${f(y + (r() - 0.5) * 3)}`;
      for (let x = 4; x < w; x += paso) d += `M${f(x + (r() - 0.5) * 2)},-5L${f(x + (r() - 0.5) * 3)},${h + 5}`;
      return `<path d="${d}" stroke-width="1.5"/>`;
    },
  };
  const NOMBRES_PATRONES = Object.keys(PATRONES);

  function patron(nombre, w, h, semilla) {
    const fn = PATRONES[nombre] || PATRONES.escamas;
    return `<g fill="none" stroke="${T}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${fn(w, h, azar(semilla || nombre))}</g>`;
  }

  /* Sombreado con rayitas a la derecha de los objetos (como tus franjas) */
  function rayado(x0, x1, alto) {
    let d = '';
    for (let x = x0, k = 0; x < x1 + 40; k++) {
      d += `M${f(x)},0L${f(x - 40)},${alto}`;
      x += Math.max(4, 11 - k * 0.9);
    }
    return `<path d="${d}" stroke="${O}" stroke-width="2.2" opacity=".26" fill="none"/>`;
  }

  /* ================================================================
     OBJETOS de ejemplo (para las piezas de muestra)
     Lienzo de 480 × 600. "cuerpo" es la silueta donde va el patrón.
     ================================================================ */
  const OBJETOS = {
    taza() {
      const asa = 'M330,246C398,240 414,298 406,334C398,378 358,398 324,392';
      return {
        cuerpo: 'M118,196L127,440Q129,472 160,472L290,472Q321,472 323,440L332,196A107,26 0 0 1 118,196Z',
        antes: sombraSuelo(228, 482, 136, 15) +
          `<path d="${asa}" fill="none" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="${asa}" fill="none" stroke="${P}" stroke-width="12" stroke-linecap="round"/>`,
        despues: `<ellipse cx="225" cy="196" rx="107" ry="26" fill="${P}" stroke="${O}" stroke-width="4"/><ellipse cx="225" cy="199" rx="94" ry="18" fill="#e6dac1" stroke="${O}" stroke-width="2.4"/>`,
        sombra: [270, 336],
      };
    },
    plato() {
      let puntos = '';
      for (let k = 0; k < 16; k++) {
        const a = k * Math.PI / 8;
        puntos += `<circle cx="${f(240 + Math.cos(a) * 96)}" cy="${f(296 + Math.sin(a) * 96)}" r="3" fill="${T}"/>`;
      }
      return {
        cuerpo: 'M40,296A200,200 0 1 0 440,296A200,200 0 1 0 40,296Z',
        antes: `<circle cx="240" cy="296" r="208" fill="${O}" opacity=".08"/>`,
        despues: `<circle cx="240" cy="296" r="128" fill="${P}" stroke="${O}" stroke-width="3"/>` +
          `<circle cx="240" cy="296" r="116" fill="none" stroke="${T}" stroke-width="2"/>` +
          `<path d="${destello(240, 296, 64, 0.14)}" fill="${T}"/>` + puntos,
      };
    },
    jarron() {
      return {
        cuerpo: 'M196,112L284,112C286,140 276,160 270,178C344,212 374,300 364,382C356,452 318,500 292,512L188,512C162,500 124,452 116,382C106,300 136,212 210,178C204,160 194,140 196,112Z',
        antes: sombraSuelo(242, 516, 124, 12),
        despues: `<ellipse cx="240" cy="112" rx="44" ry="10" fill="#e6dac1" stroke="${O}" stroke-width="3.5"/>`,
        sombra: [300, 370],
      };
    },
    lamina() {
      return {
        cuerpo: 'M142,126H338V474H142Z',
        antes: `<rect x="106" y="94" width="288" height="428" fill="${O}" opacity=".1"/>` +
          `<path d="M240,46L116,86M240,46L364,86" stroke="${O}" stroke-width="2" fill="none"/><circle cx="240" cy="44" r="5" fill="${O}"/>` +
          `<rect x="96" y="84" width="288" height="428" fill="${O}"/><rect x="110" y="98" width="260" height="400" fill="${P}"/>`,
        despues: `<rect x="120" y="108" width="240" height="380" fill="none" stroke="${T}" stroke-width="1.5"/>`,
      };
    },
    libreta() {
      let espiral = '';
      for (let y = 122; y < 490; y += 26) {
        espiral += `<path d="M164,${y}C142,${y - 2} 138,${y + 12} 152,${y + 14}" fill="none" stroke="${O}" stroke-width="4" stroke-linecap="round"/>`;
      }
      return {
        cuerpo: 'M150,96H364Q378,96 378,110V494Q378,508 364,508H150Z',
        antes: sombraSuelo(266, 518, 134, 12) +
          `<path d="M158,104H372Q386,104 386,118V502Q386,516 372,516H158Z" fill="#e6dac1" stroke="${O}" stroke-width="3"/>`,
        despues: `<rect x="206" y="210" width="136" height="64" rx="6" fill="${P}" stroke="${O}" stroke-width="3"/>` +
          `<path d="M222,236H324M222,254H292" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`,
        encima: espiral,
        sombra: [334, 380],
      };
    },
    bolsa() {
      const asa = 'M172,250C166,150 200,112 240,112C280,112 314,150 308,250';
      return {
        cuerpo: 'M104,246L376,246L362,540L118,540Z',
        antes: sombraSuelo(242, 546, 150, 12) +
          `<path d="${asa}" fill="none" stroke="${O}" stroke-width="20" stroke-linecap="round"/><path d="${asa}" fill="none" stroke="${P}" stroke-width="12" stroke-linecap="round"/>`,
        despues: `<path d="M112,262H368" stroke="${O}" stroke-width="1.8" stroke-dasharray="7 7" fill="none"/>`,
        sombra: [318, 380],
      };
    },
    azulejo() {
      let esquinas = '';
      [[90, 150, 0], [390, 150, 90], [390, 450, 180], [90, 450, 270]].forEach(([x, y, a]) => {
        esquinas += `<g transform="translate(${x},${y}) rotate(${a})"><path d="M0,0H44A44,44 0 0 1 0,44Z" fill="${T}"/>` +
          `<path d="M56,0A56,56 0 0 1 0,56" fill="none" stroke="${T}" stroke-width="2.6"/></g>`;
      });
      return {
        cuerpo: 'M90,150H390V450H90Z',
        antes: `<rect x="100" y="160" width="300" height="300" fill="${O}" opacity=".12"/>`,
        despues: esquinas,
      };
    },
  };

  /* Ilustración completa de una pieza de ejemplo (SVG 480×600) */
  function ilustracion(objeto, nombrePatron, semilla = '') {
    const W = 480, H = 600;
    const obj = (OBJETOS[objeto] || OBJETOS.azulejo)();
    const r = azar(`${objeto}/${nombrePatron}/${semilla}`);
    const idc = 'c', idf = 't';
    let fondo = `<rect width="${W}" height="${H}" fill="${P}"/>` +
      `<circle cx="${W / 2}" cy="${H * 0.48}" r="232" fill="${O}" opacity=".045"/>`;
    for (let k = 0; k < 7; k++) {
      const x = 30 + r() * (W - 60), y = 30 + r() * (H - 60);
      if (Math.abs(x - W / 2) < 170 && Math.abs(y - H / 2) < 230) continue;
      fondo += `<path d="${destello(x, y, 5 + r() * 7, 0.2)}" fill="${T}" opacity=".5"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
      `<defs>${filtroTinta(idf, { semilla: Math.floor(r() * 90) + 1, escala: 3, frecuencia: 0.028 })}<clipPath id="${idc}"><path d="${obj.cuerpo}"/></clipPath></defs>` +
      fondo +
      `<g filter="url(#${idf})">` + (obj.antes || '') +
      `<path d="${obj.cuerpo}" fill="${P}"/>` +
      `<g clip-path="url(#${idc})">${patron(nombrePatron, W, H, `${semilla}${nombrePatron}`)}${obj.sombra ? rayado(obj.sombra[0], obj.sombra[1], H) : ''}</g>` +
      (obj.despues || '') +
      `<path d="${obj.cuerpo}" fill="none" stroke="${O}" stroke-width="4.2" stroke-linejoin="round"/>` +
      (obj.encima || '') + `</g></svg>`;
  }

  /* Muestra plana de un patrón (para portadas sin foto) */
  function muestra(nombrePatron, w = 480, h = 600, semilla = '') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
      `<defs>${filtroTinta('t', { escala: 2.6 })}</defs><rect width="${w}" height="${h}" fill="${P}"/>` +
      `<g filter="url(#t)">${patron(nombrePatron, w, h, semilla + nombrePatron)}</g></svg>`;
  }

  /* Referencias de imágenes de ejemplo: "dibujo:taza/escamas" o "patron:olas" */
  const cacheDibujos = new Map();
  function imagenDeDibujo(ref) {
    if (cacheDibujos.has(ref)) return cacheDibujos.get(ref);
    let uri = '';
    const m = /^dibujo:([a-z]+)\/([a-z]+)$/i.exec(ref);
    const n = /^patron:([a-z]+)$/i.exec(ref);
    if (m) uri = aUri(ilustracion(m[1], m[2]));
    else if (n) uri = aUri(muestra(n[1]));
    cacheDibujos.set(ref, uri);
    return uri;
  }

  /* ================================================================
     MARCO DE ARCO para las tarjetas (anillo con la mitad derecha azul,
     como los arcos de tu friso)
     ================================================================ */
  function marcoArco() {
    const exterior = 'M3,249V100A97,97 0 0 1 197,100V249Z';
    const interior = 'M12,241V100A88,88 0 0 1 188,100V241Z';
    return `<svg class="marco-arco" viewBox="0 0 200 250" preserveAspectRatio="none" aria-hidden="true" focusable="false">` +
      `<path d="${exterior} ${interior}" fill="${P}" fill-rule="evenodd"/>` +
      `<path d="M100,3A97,97 0 0 1 197,100V249H188V100A88,88 0 0 0 100,12Z" fill="${T}"/>` +
      `<path d="${exterior}" fill="none" stroke="${O}" stroke-width="2" vector-effect="non-scaling-stroke"/>` +
      `<path d="${interior}" fill="none" stroke="${O}" stroke-width="1.4" vector-effect="non-scaling-stroke"/>` +
      `</svg>`;
  }

  /* ================================================================
     FRISO DE ARCOS (tu tira con festones, estrellas y arcos)
     Devuelve una baldosa que se repite a lo ancho.
     ================================================================ */
  function frisoTile() {
    const u = 36, W = 72, H = 88;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">` +
      `<g stroke-linecap="round" stroke-linejoin="round">`;
    s += `<path d="M-1,12H${W + 1}V84H65V54A11,11 0 0 0 43,54V84H-1Z" fill="${P}"/>`;
    s += `<rect x="-1" y="3" width="${W + 2}" height="9" fill="${P}"/>`;
    let trama = '';
    for (let x = -8; x < W + 8; x += 5) trama += `M${x},12L${x + 7},3`;
    s += `<path d="${trama}" stroke="${T}" stroke-width="1.4" fill="none"/>`;
    s += `<path d="M-1,3H${W + 1}M-1,12H${W + 1}" stroke="${O}" stroke-width="1.8" fill="none"/>`;
    for (let i = 0; i < 2; i++) {
      const cx = u / 2 + i * u, rx = u / 2 - 1, ry = 12;
      s += `<path d="M${cx - rx},12A${rx},${ry} 0 0 0 ${cx + rx},12Z" fill="${T}" stroke="${O}" stroke-width="1.5"/>`;
      s += `<path d="M${f(cx - rx * 0.8)},16.5H${f(cx + rx * 0.8)}M${f(cx - rx * 0.55)},20.5H${f(cx + rx * 0.55)}" stroke="${P}" stroke-width="1" opacity=".55" fill="none"/>`;
    }
    s += `<path d="${destello(18, 57, 10, 0.18)}" fill="none" stroke="${O}" stroke-width="1.5"/>`;
    s += [[7, 42], [29, 42], [7, 74], [29, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.4" fill="${O}"/>`).join('');
    s += `<path d="M54,45.5A8.5,8.5 0 0 1 62.5,54V84" fill="none" stroke="${T}" stroke-width="5"/>`;
    s += `<path d="M43,85V54A11,11 0 0 1 65,54V85" fill="none" stroke="${O}" stroke-width="1.8"/>`;
    s += `<path d="M-1,84H43M65,84H${W + 1}" stroke="${O}" stroke-width="1.8" fill="none"/>`;
    return s + '</g></svg>';
  }

  /* Fila de arquitos rellenos (para separadores) */
  function arquitosTile() {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30" width="40" height="30">` +
      `<path d="M8,30V14A12,12 0 0 1 32,14V30Z" fill="${T}"/><path d="M14,30V15A6,6 0 0 1 26,15V30" fill="none" stroke="${P}" stroke-width="1.6"/></svg>`;
  }

  /* ================================================================
     ENREDADERAS · tallo que crece + hojas que brotan en orden
     ================================================================ */
  function catmullRom(pts) {
    const segs = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      segs.push([p1,
        [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
        [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
        p2]);
    }
    return segs;
  }
  const trazoSegs = (segs) => 'M' + pt(segs[0][0]) + segs.map((s) => `C${pt(s[1])} ${pt(s[2])} ${pt(s[3])}`).join('');
  function puntoBezier(s, t) {
    const u = 1 - t;
    const x = u * u * u * s[0][0] + 3 * u * u * t * s[1][0] + 3 * u * t * t * s[2][0] + t * t * t * s[3][0];
    const y = u * u * u * s[0][1] + 3 * u * u * t * s[1][1] + 3 * u * t * t * s[2][1] + t * t * t * s[3][1];
    const dx = 3 * u * u * (s[1][0] - s[0][0]) + 6 * u * t * (s[2][0] - s[1][0]) + 3 * t * t * (s[3][0] - s[2][0]);
    const dy = 3 * u * u * (s[1][1] - s[0][1]) + 6 * u * t * (s[2][1] - s[1][1]) + 3 * t * t * (s[3][1] - s[2][1]);
    return [x, y, Math.atan2(dy, dx)];
  }
  function muestrear(segs, paso) {
    const pol = [];
    segs.forEach((s, i) => { for (let k = i ? 1 : 0; k <= 24; k++) pol.push(puntoBezier(s, k / 24)); });
    const acum = [0];
    for (let i = 1; i < pol.length; i++) acum.push(acum[i - 1] + Math.hypot(pol[i][0] - pol[i - 1][0], pol[i][1] - pol[i - 1][1]));
    const total = acum[acum.length - 1];
    const res = [];
    let i = 1;
    for (let l = paso * 0.7; l < total - 2; l += paso) {
      while (i < acum.length - 1 && acum[i] < l) i++;
      const q = (l - acum[i - 1]) / ((acum[i] - acum[i - 1]) || 1);
      res.push({ x: pol[i - 1][0] + (pol[i][0] - pol[i - 1][0]) * q, y: pol[i - 1][1] + (pol[i][1] - pol[i - 1][1]) * q, ang: pol[i][2], t: l / total });
    }
    return res;
  }

  function enredadera(puntos, opciones = {}) {
    const {
      semilla = 1, paso = 15, hoja = [8, 14], retraso = 0, dur = 1.8, grosor = 2.4,
      flores = 0.07, zarcillos = 0.1, clase = '', relleno = 0.55,
    } = opciones;
    const r = azar(semilla);
    const segs = catmullRom(puntos);
    let hojas = '';
    muestrear(segs, paso).forEach((m, i) => {
      const lado = i % 2 ? 1 : -1;
      const ang = m.ang * 180 / Math.PI + lado * (38 + r() * 30);
      const tam = hoja[0] + r() * (hoja[1] - hoja[0]);
      const llena = r() < relleno;
      const d = f(retraso + m.t * dur);
      // hojas verdes (dos tonos) con nervadura; ramas y zarcillos en café
      let forma = `<path class="hoja" style="--d:${d}s" d="${hojaD(tam)}" fill="${llena ? V : VC}" stroke="${O}" stroke-width="1.3"/>`;
      forma += `<path class="hoja" style="--d:${d}s" d="M${f(tam * 0.15)},0L${f(tam * 0.78)},0" stroke="${O}" stroke-width=".9" opacity=".55" fill="none"/>`;
      hojas += `<g transform="translate(${f(m.x)},${f(m.y)}) rotate(${f(ang)})">${forma}</g>`;
      if (r() < zarcillos) {
        const a2 = m.ang * 180 / Math.PI - lado * 70;
        hojas += `<g transform="translate(${f(m.x)},${f(m.y)}) rotate(${f(a2)})"><path class="hoja" style="--d:${d}s" d="M0,0C4,-5 11,-7 13,-2C15,3 9,6 7,2C6,0 8,-2 9,-1" fill="none" stroke="${C}" stroke-width="1.1" stroke-linecap="round"/></g>`;
      }
      if (r() < flores) {
        const off = lado * -9;
        hojas += `<g transform="translate(${f(m.x + Math.cos(m.ang + Math.PI / 2) * off)},${f(m.y + Math.sin(m.ang + Math.PI / 2) * off)})"><path class="hoja flor" style="--d:${f(+d + 0.25)}s" d="${destello(0, 0, 5.5, 0.2)}" fill="${D}" stroke="${O}" stroke-width=".8"/></g>`;
      }
    });
    return `<g class="enredadera ${clase}"><path class="tallo" pathLength="1" style="--d:${f(retraso)}s;--dur:${f(dur)}s" d="${trazoSegs(segs)}" fill="none" stroke="${C}" stroke-width="${grosor}" stroke-linecap="round"/>${hojas}</g>`;
  }

  /* ================================================================
     ÍCONOS de interfaz (línea fina, se colorean con currentColor)
     ================================================================ */
  const ic = (d, extra = '') => `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"${extra}>${d}</svg>`;
  const ICONOS = {
    whatsapp: ic('<path d="M4 20l1.2-3.7A8.3 8.3 0 1 1 8 19.1z"/><path d="M9.2 8.4c.2-.5.7-.6 1-.1l.6 1.3c.1.3 0 .6-.2.8l-.5.5c.5 1.1 1.4 2 2.5 2.5l.5-.5c.2-.2.5-.3.8-.2l1.3.6c.5.3.4.8-.1 1-1.9.8-5.8-2.3-5.9-5.9z" stroke-width="1.4"/>'),
    instagram: ic('<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.1" cy="6.9" r=".7" fill="currentColor" stroke="none"/>'),
    compartir: ic('<path d="M12 15V3.5M7.5 8L12 3.5 16.5 8"/><path d="M5 12.5V19a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 19v-6.5"/>'),
    volver: ic('<path d="M15 5l-7 7 7 7"/>'),
    cerrar: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
    mas: ic('<path d="M12 5v14M5 12h14"/>'),
    lapiz: ic('<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>'),
    basura: ic('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>'),
    arriba: ic('<path d="M12 19V5M6 11l6-6 6 6"/>'),
    abajo: ic('<path d="M12 5v14M6 13l6 6 6-6"/>'),
    ajustes: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
    ojo: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
    salir: ic('<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M14 17l5-5-5-5M19 12H9"/>'),
    foto: ic('<rect x="3" y="5" width="18" height="15" rx="2.5"/><circle cx="12" cy="12.5" r="3.5"/><path d="M8 5l1.5-2h5L16 5"/>'),
    estrella: ic('<path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.4 6.9 19.2 8 13.5l-4.3-4 5.8-.7z"/>'),
    enlace: ic('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
    ordenar: ic('<path d="M8 4v16M4 8l4-4 4 4M16 20V4M12 16l4 4 4-4"/>'),
    buscar: ic('<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4.5 4.5"/>'),
    check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  };

  window.Arte = {
    colores: { T, O, P, V, VC, C, D, LU }, azar, aUri, filtroTinta, destello, hojaD,
    logo, logoPartes, HOJAS_LOGO, lunaLogo, lunaPartes, LUNA_CAJA,
    PATRONES, NOMBRES_PATRONES, patron, rayado, OBJETOS, ilustracion, muestra, imagenDeDibujo,
    marcoArco, frisoTile, arquitosTile, enredadera, catmullRom, ICONOS, nuevoId,
    util: { f, pt, lerp },
  };
})();
