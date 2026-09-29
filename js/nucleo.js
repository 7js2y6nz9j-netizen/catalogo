/* ==================================================================
   nucleo.js · Lo que comparten la entrada y el taller: estado,
   imágenes, enlaces de WhatsApp, avisos y los destellos al tocar.
   ================================================================== */
(function () {
  'use strict';
  const CFG = window.INLUNA_CONFIG || {};
  const A = window.Arte, E = window.Escenas, D = window.Datos;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const puntero = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const esc = E.escapar;

  const estado = {
    listo: false, productos: [], ajustes: D.mezclarAjustes({}), categorias: [], fuente: '',
  };

  /* ---------- modo ligero: en teléfonos modestos se apagan los adornos
     que se mueven sin parar (el catálogo se ve igual, pero quieto) ---------- */
  const ligero = { activo: false, avisar: [] };
  function activarLigero() {
    if (ligero.activo) return;
    ligero.activo = true;
    document.documentElement.classList.add('ligero');
    ligero.avisar.forEach((fn) => { try { fn(); } catch (e) { /* nada */ } });
  }
  (function () {
    try {
      const q = location.search;
      if (/[?&]completo\b/.test(q)) return;
      const mem = navigator.deviceMemory || 8, nucleos = navigator.hardwareConcurrency || 8;
      const ahorro = navigator.connection && navigator.connection.saveData;
      if (/[?&]ligero\b/.test(q) || reducido || ahorro || mem <= 2 || nucleos <= 2 || (mem <= 4 && nucleos <= 4)) activarLigero();
    } catch (e) { /* nada */ }
  })();
  /* Mide unos segundos si las animaciones van fluidas; si no, pasa a ligero */
  function medirFluidez(ms = 1600) {
    if (ligero.activo || reducido || /[?&]completo\b/.test(location.search)) return;
    const tiempos = [];
    let previo = 0, fin = 0;
    const paso = (t) => {
      if (document.visibilityState !== 'visible') return;
      if (previo) tiempos.push(t - previo);
      previo = t;
      if (!fin) fin = t + ms;
      if (t < fin) { requestAnimationFrame(paso); return; }
      if (tiempos.length < 10) return;
      const orden = tiempos.slice().sort((a, b) => a - b);
      const mediana = orden[Math.floor(orden.length / 2)], lentos = tiempos.filter((x) => x > 50).length / tiempos.length;
      if (mediana > 26 || lentos > 0.25) activarLigero();
    };
    requestAnimationFrame(paso);
  }
  const alPasarALigero = (fn) => { if (ligero.activo) fn(); else ligero.avisar.push(fn); };

  /* ---------- colores de config.js → variables CSS ---------- */
  (function () {
    const c = CFG.colores || {}, st = document.documentElement.style;
    ['tinta', 'oscura', 'papel', 'verde', 'acento', 'cafe', 'dorado'].forEach((k) => {
      if (c[k]) st.setProperty(`--${k}`, c[k]);
    });
    const destello = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="${A.destello(10, 10, 9.5, 0.16)}"/></svg>`;
    st.setProperty('--destello', `url("${A.aUri(destello)}")`);
  })();

  /* ---------- datos → colecciones ---------- */
  function armarColecciones(productos) {
    const mapa = new Map();
    productos.forEach((p) => {
      const nombre = p.categoria || 'Piezas';
      const s = D.slug(nombre);
      if (!mapa.has(s)) mapa.set(s, { slug: s, nombre, productos: [] });
      mapa.get(s).productos.push(p);
    });
    // la portada de cada colección es una de sus piezas (con su foto y su animación)
    const portadaDe = (lista) => lista.find((x) => x.destacado && x.fotos.length) || lista.find((x) => x.fotos.length) || null;
    const cols = Array.from(mapa.values()).map((c) => Object.assign(c, { total: c.productos.length, pieza: portadaDe(c.productos) }));
    const favoritas = productos.filter((p) => p.destacado);
    const lista = [];
    if (favoritas.length && productos.length > favoritas.length) {
      lista.push({ slug: 'favoritas', nombre: 'Favoritas del taller', especial: 'favoritas', productos: favoritas, total: favoritas.length, pieza: portadaDe(favoritas) });
    }
    lista.push(...cols);
    if (cols.length > 1) {
      lista.push({ slug: 'todas', nombre: 'Todas las piezas', especial: 'todas', productos, total: productos.length, pieza: null, patron: 'patron:destellos' });
    }
    return lista;
  }

  function aplicarDatos(datos) {
    estado.productos = datos.productos;
    estado.ajustes = datos.ajustes;
    estado.fuente = datos.fuente;
    estado.categorias = armarColecciones(datos.productos);
    document.title = `${datos.ajustes.nombre} · catálogo del taller`;
  }

  /* ---------- textos ---------- */
  const cuantas = (n) => `${n} ${n === 1 ? 'pieza' : 'piezas'}`;
  const precio = (p) => D.formatoPrecio(p.precio, estado.ajustes.moneda);
  const textoEstado = (p) => ({ disponible: 'Disponible', encargo: 'Sobre pedido', agotado: 'Agotado' }[p.estado] || '');

  /* ---------- imágenes ---------- */
  function imagen(ref, alt, ancho, { perezosa = true, clase = '', estilo = '' } = {}) {
    if (!ref) return `<span class="sin-foto">${A.logo()}</span>`;
    const alterna = D.urlImagenAlterna(ref, ancho);
    return `<img src="${esc(D.urlImagen(ref, ancho))}" alt="${esc(alt)}"${clase ? ` class="${clase}"` : ''}${estilo ? ` style="${esc(estilo)}"` : ''}${perezosa ? ' loading="lazy"' : ''} decoding="async"${alterna ? ` data-alterna="${esc(alterna)}"` : ''}>`;
  }
  function prepararImagenes(cont) {
    $$('img', cont).forEach((img) => { if (img.complete && img.naturalWidth) img.classList.add('cargada'); });
  }
  document.addEventListener('load', (e) => { if (e.target.tagName === 'IMG') e.target.classList.add('cargada'); }, true);
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG') return;
    if (img.dataset.alterna && !img.dataset.probo) { img.dataset.probo = '1'; img.src = img.dataset.alterna; return; }
    const span = document.createElement('span');
    span.className = 'sin-foto';
    span.innerHTML = A.logo();
    img.replaceWith(span);
  }, true);

  /* ---------- enlaces ---------- */
  // En GitHub Pages cada pieza tiene su propia página para compartir (p/<id>/,
  // con su foto y su nombre en la vista previa); si aún no existe, 404.html
  // lleva a la pieza igual. En otros lugares se usa el enlace con #.
  const conFichas = /\.github\.io$/i.test(location.hostname);
  const baseSitio = () => location.origin + location.pathname.replace(/[^/]*$/, '');
  const enlacePieza = (p) => (conFichas
    ? `${baseSitio()}p/${encodeURIComponent(p.id)}/`
    : `${location.origin}${location.pathname}#p/${encodeURIComponent(p.id)}`);

  /* Variantes elegidas: { talla, color, material } → "Talla: M · Color: Negro" */
  const VARIANTES = [['tallas', 'talla', 'Talla'], ['colores', 'color', 'Color'], ['materiales', 'material', 'Material']];
  function textoVariantes(v) {
    return VARIANTES.filter(([, k]) => v && v[k]).map(([, k, etiqueta]) => `${etiqueta}: ${v[k]}`).join(' · ');
  }
  const enlaceWhatsAppTexto = (texto) => (estado.ajustes.whatsapp
    ? `https://wa.me/${estado.ajustes.whatsapp}${texto ? `?text=${encodeURIComponent(texto)}` : ''}` : '');

  function mensajePieza(p, { variantes, cantidad } = {}) {
    const a = estado.ajustes;
    let msg = (a.mensajeWhatsApp || CFG.mensajeWhatsApp || '{pieza} {enlace}')
      .replace(/\{pieza\}/g, p.nombre).replace(/\{precio\}/g, precio(p)).replace(/\{enlace\}/g, enlacePieza(p))
      .replace(/\s*\(\s*\)/g, '');
    const extra = [textoVariantes(variantes), cantidad > 1 ? `Cantidad: ${cantidad}` : ''].filter(Boolean);
    if (extra.length) msg += `\n${extra.join('\n')}`;
    return msg;
  }
  function enlaceWhatsApp(p, opciones) {
    if (!estado.ajustes.whatsapp) return '';
    return p ? enlaceWhatsAppTexto(mensajePieza(p, opciones)) : enlaceWhatsAppTexto('');
  }
  const enlaceInstagram = () => (estado.ajustes.instagram ? `https://instagram.com/${encodeURIComponent(estado.ajustes.instagram)}` : '');
  const mensajeInstagram = () => (estado.ajustes.instagram ? `https://ig.me/m/${encodeURIComponent(estado.ajustes.instagram)}` : '');

  async function compartir(p) {
    const url = enlacePieza(p);
    const datos = { title: `${p.nombre} · ${estado.ajustes.nombre}`, text: `Mira esta pieza: ${p.nombre}`, url };
    if (navigator.share) {
      try { await navigator.share(datos); return; } catch (e) { if (e && e.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(url); aviso('Enlace copiado'); } catch (e) { window.prompt('Copia el enlace de la pieza:', url); }
  }

  /* ---------- avisos ---------- */
  function aviso(texto, tipo = '') {
    const cont = $('#avisos');
    if (!cont) return;
    const el = document.createElement('div');
    el.className = `aviso ${tipo}`;
    el.textContent = texto;
    cont.appendChild(el);
    setTimeout(() => { el.classList.add('sale'); setTimeout(() => el.remove(), 320); }, 2800);
  }

  /* ---------- destellos que brotan donde tocas ---------- */
  let capa = null;
  function destellos(x, y, { n = 7, radio = 46, clara = false } = {}) {
    if (reducido) return;
    if (ligero.activo) n = Math.min(4, n);
    if (!capa) { capa = document.createElement('div'); capa.className = 'destellos'; document.body.appendChild(capa); }
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = `chispita${clara || i % 3 === 2 ? ' clara' : ''}`;
      const tam = 7 + Math.random() * 9;
      s.style.cssText = `left:${x}px;top:${y}px;width:${tam}px;height:${tam}px`;
      capa.appendChild(s);
      const ang = (i / n) * Math.PI * 2 + Math.random() * 0.6;
      const dist = radio * (0.55 + Math.random() * 0.6);
      const anim = s.animate([
        { transform: 'translate(-50%,-50%) scale(.2) rotate(0deg)', opacity: 1 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist}px), calc(-50% + ${Math.sin(ang) * dist}px)) scale(1) rotate(${90 + Math.random() * 90}deg)`, opacity: 1, offset: 0.55 },
        { transform: `translate(calc(-50% + ${Math.cos(ang) * dist * 1.25}px), calc(-50% + ${Math.sin(ang) * dist * 1.25 + 14}px)) scale(.3) rotate(200deg)`, opacity: 0 },
      ], { duration: 900 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' });
      anim.onfinish = () => s.remove();
    }
  }
  function destellosEn(el, opciones) {
    const r = el.getBoundingClientRect();
    destellos(r.left + r.width / 2, r.top + r.height / 2, opciones);
  }
  const vibrar = (ms = 10) => {
    try {
      const activo = !navigator.userActivation || navigator.userActivation.isActive;
      if (navigator.vibrate && activo) navigator.vibrate(ms);
    } catch (e) { /* nada */ }
  };

  /* ---------- botón de sonido (en todas las escenas) ---------- */
  function botonSonido() {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'boton-sonido';
    const pintar = () => {
      const on = window.Sonido && window.Sonido.activo();
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.setAttribute('aria-label', on ? 'Apagar sonido' : 'Encender sonido');
      b.innerHTML = `<svg class="icono" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/>${on ? '<path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/>' : '<path d="M16 9.5l5 5M21 9.5l-5 5"/>'}</svg><span>${on ? 'sonido' : 'sin sonido'}</span>`;
    };
    pintar();
    b.addEventListener('click', () => { window.Sonido.alternar(); pintar(); vibrar(8); });
    document.body.appendChild(b);
    return b;
  }
  document.addEventListener('pointerdown', () => { if (window.Sonido) window.Sonido.despertar(); }, { passive: true });

  /* Con cualquier hoja abierta, la página de atrás no se desplaza */
  function actualizarScroll() {
    const abierta = $$('dialog.hoja-catalogo').some((d) => d.open);
    document.documentElement.classList.toggle('sin-scroll', abierta);
  }

  /* Botón de "cantidad" (− 1 +) */
  function contadorHTML(nombre, valor, minimo = 1, etiqueta = 'Cantidad') {
    return `<span class="contador" data-contador data-min="${minimo}">
      <button type="button" class="contador-boton" data-paso="-1" aria-label="Menos">−</button>
      <input type="number" name="${nombre}" value="${valor}" min="${minimo}" max="9999" inputmode="numeric" aria-label="${esc(etiqueta)}">
      <button type="button" class="contador-boton" data-paso="1" aria-label="Más">+</button>
    </span>`;
  }
  const leerContador = (input) => {
    const min = Number(input.min) || 1;
    const n = Math.floor(Number(input.value));
    return Math.max(min, Math.min(9999, isFinite(n) && n > 0 ? n : min));
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-contador] [data-paso]');
    if (!b) return;
    const input = b.parentElement.querySelector('input');
    input.value = Math.max(Number(input.min) || 1, Math.min(9999, leerContador(input) + Number(b.dataset.paso)));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    vibrar(5);
  });
  document.addEventListener('change', (e) => {
    if (e.target.matches('[data-contador] input')) e.target.value = leerContador(e.target);
  });

  window.Inluna = {
    CFG, $, $$, esc, espera, reducido, puntero, estado, ligero, activarLigero, medirFluidez, alPasarALigero,
    aplicarDatos, cuantas, precio, textoEstado,
    imagen, prepararImagenes, enlacePieza, enlaceWhatsApp, enlaceWhatsAppTexto, mensajePieza, textoVariantes, VARIANTES,
    enlaceInstagram, mensajeInstagram, compartir,
    aviso, destellos, destellosEn, vibrar, botonSonido, actualizarScroll, contadorHTML, leerContador,
  };
})();
