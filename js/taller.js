/* ==================================================================
   taller.js · El interior del taller
   ------------------------------------------------------------------
   1. Galería de arcos: cada colección vive en un arco; se recorre
      deslizando, con las flechas (en pantalla o del teclado) o con los
      puntitos (el arco del centro se ilumina y se acerca).
   2. Colección: se abre "desde" su arco; las piezas flotan en fila.
      El buscador (js/buscar.js) usa la misma capa.
   3. La ficha de cada pieza vive en js/ficha.js.
   4. Contacto: panel verde con las hojas de Inluna, olas y azulejos.
   Cada pieza tiene una animación de uso: vapor, balanceo, giro…
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, E = window.Escenas, D = window.Datos, S = window.Sonido, Tintas = window.Tintas;
  const { $, $$, esc, espera, reducido, estado } = I;

  const g = { construido: false, arcada: null, nichos: [], idx: 0, raf: 0, col: null, origenNicho: null };

  /* Animaciones de uso (js/animaciones.js): vapor, balanceo, giro… */
  const tipoAnimacion = window.Animaciones.tipo;
  const capaAnimacion = window.Animaciones.capa;

  /* En el catálogo: la versión dibujada (o la foto con filtro de tinta) */
  // la imagen de la tarjeta: el dibujo, entintado del color que elegiste
  function imagenCatalogo(p, ancho) {
    const original = p.fotos[0], dibujo = p.dibujos && p.dibujos[0];
    const agotada = p.estado === 'agotado';
    if (dibujo) return I.imagen(dibujo, p.nombre, ancho, { estilo: Tintas.estilo(p.color, { agotada }) });
    if (!original) return I.imagen('', p.nombre, ancho);
    const demo = /^(dibujo|patron):/.test(original);
    return I.imagen(original, p.nombre, ancho, { clase: demo ? '' : 'foto-cruda', estilo: Tintas.estilo(p.color, { cruda: !demo, agotada }) });
  }
  function marcoPieza(p, ancho) {
    const tipo = tipoAnimacion(p);
    return `<span class="marco-img${tipo ? ` anim-${tipo}` : ''}">${imagenCatalogo(p, ancho)}${capaAnimacion(tipo)}</span>`;
  }

  /* Botones de la barra superior de colección / búsqueda */
  function atajosBarra({ buscar = true } = {}) {
    return `<span class="col-atajos">
      ${buscar ? `<a class="boton-icono" href="#buscar" aria-label="Buscar piezas">${A.ICONOS.buscar}</a>` : ''}
      <a class="boton-icono boton-seleccion-barra" href="#seleccion" aria-label="Mi selección">${A.ICONOS.corazon}<span class="insignia" data-cuenta-seleccion hidden></span></a>
    </span>`;
  }

  /* ================================================================
     1 · GALERÍA DE ARCOS
     ================================================================ */
  function construir() {
    const t = $('#taller');
    if (!g.construido) {
      g.construido = true;
      $('.t-friso', t).style.backgroundImage = `url("${A.aUri(A.frisoTile())}")`;
      $('.t-luna', t).innerHTML = `<button class="t-luna-boton" type="button" aria-label="Las hojas de Inluna">${E.hojasFondoSVG()}</button>`;
      $('.t-lamparas', t).innerHTML = [0, 1].map((i) => `<button class="t-lampara ${i ? 'der' : 'izq'}" type="button" aria-label="Mover la lámpara">${E.lampara(40)}</button>`).join('');
      $('.t-enredaderas', t).innerHTML = `<span class="t-enr izq">${E.enredaderaColgante(170, 1, 61)}</span><span class="t-enr der">${E.enredaderaColgante(170, 1, 61)}</span>`;
      g.arcada = $('.arcada', t);
      conectarGaleria();
    }
    render();
  }

  function render() {
    const t = $('#taller'), a = estado.ajustes;
    $('.t-cabecera', t).innerHTML = `<p class="t-antes">${esc(a.antesDelNombre)}</p><h1 class="t-nombre">${esc(a.nombre)}</h1>
      <a class="t-sobre" href="#sobre">conoce el taller <span aria-hidden="true">›</span></a>`;
    const cols = estado.categorias;
    if (!cols.length) {
      g.arcada.innerHTML = '<p class="galeria-vacia">Pronto habrá piezas nuevas en el taller.</p>';
      g.nichos = [];
      $('.puntos', t).innerHTML = '';
    } else {
      g.arcada.innerHTML = cols.map((c, i) => (i ? `<span class="pilar" aria-hidden="true">${E.pilar()}</span>` : '') + nichoHTML(c, i, cols.length)).join('');
      g.nichos = $$('.nicho-caja', g.arcada);
      $('.puntos', t).innerHTML = cols.map((c, i) => `<button type="button" data-ir="${i}" aria-label="Ir a ${esc(c.nombre)}"></button>`).join('');
    }
    $('.t-contacto', t).innerHTML = barraContacto();
    $('.galeria-pista', t).hidden = cols.length < 2;
    $$('.galeria-flecha', t).forEach((b) => { b.hidden = cols.length < 2; });
    I.prepararImagenes(g.arcada);
    window.Seleccion.pintarMarcas(t);
    g.idx = -1;
    requestAnimationFrame(() => { centrar(Math.min(g.idxGuardado || 0, Math.max(0, g.nichos.length - 1)), true); enfocar(); });
  }

  function nichoHTML(c, i, total) {
    const cuerpo = c.pieza ? marcoPieza(c.pieza, 720) : `<span class="marco-img anim-brillo">${I.imagen(c.patron, c.nombre, 720)}${capaAnimacion('brillo')}</span>`;
    const sello = c.especial === 'favoritas' ? '<span class="nicho-sello">✦ favoritas</span>' : c.especial === 'todas' ? '<span class="nicho-sello">todo el taller</span>' : '';
    return `<div class="nicho-caja" role="listitem">
      <button class="nicho${c.especial ? ' especial' : ''}" type="button" data-slug="${esc(c.slug)}" aria-label="${esc(c.nombre)}, ${I.cuantas(c.total)} (${i + 1} de ${total})">
        <span class="nicho-marco">${cuerpo}${A.marcoArco()}${sello}<span class="nicho-luz" aria-hidden="true"></span></span>
        <span class="nicho-sombra" aria-hidden="true"></span>
        <span class="nicho-placa"><span class="nicho-nombre">${esc(c.nombre)}</span><span class="nicho-cuenta">${I.cuantas(c.total)}</span></span>
      </button>
    </div>`;
  }

  // abajo: buscar · hacer un pedido · mi selección
  function barraContacto() {
    return `<a class="boton-icono boton-barra" href="#buscar" aria-label="Buscar piezas">${A.ICONOS.buscar}<span class="boton-barra-texto">buscar</span></a>
      <a class="boton boton-tinta boton-pedido" href="#contacto"><svg class="icono" viewBox="0 0 20 20" aria-hidden="true"><path d="${A.destello(10, 10, 8.5, 0.2)}" fill="currentColor"/></svg><span>Hacer un pedido</span></a>
      <a class="boton-icono boton-barra boton-seleccion-barra" href="#seleccion" aria-label="Mi selección">${A.ICONOS.corazon}<span class="boton-barra-texto">mi selección</span><span class="insignia" data-cuenta-seleccion hidden></span></a>`;
  }

  /* Enfoque del arco central + profundidad del fondo */
  function enfocar() {
    g.raf = 0;
    const arc = g.arcada;
    if (!arc || !g.nichos.length) return;
    const r = arc.getBoundingClientRect(), centro = r.left + r.width / 2;
    let mejor = 0, mejorD = Infinity;
    g.nichos.forEach((caja, i) => {
      const b = caja.getBoundingClientRect();
      const d = (b.left + b.width / 2 - centro) / Math.max(1, b.width * 1.08);
      const ad = Math.min(1.5, Math.abs(d));
      const fo = Math.max(0, 1 - ad);
      const n = caja.firstElementChild;
      const jalon = -Math.sign(d) * Math.min(1, ad) * 18; // los vecinos se asoman hacia el centro
      n.style.transform = `perspective(1000px) translate3d(${jalon.toFixed(1)}px,${(ad * 20).toFixed(1)}px,0) rotateY(${(-Math.max(-1.3, Math.min(1.3, d)) * 15).toFixed(1)}deg) scale(${(0.85 + fo * 0.15).toFixed(3)})`;
      n.style.opacity = (0.45 + fo * 0.55).toFixed(3);
      n.classList.toggle('enfocado', ad < 0.3);
      if (Math.abs(d) < mejorD) { mejorD = Math.abs(d); mejor = i; }
    });
    if (mejor !== g.idx) {
      if (g.idx >= 0) S.toque();
      g.idx = mejor;
      g.idxGuardado = mejor;
      $$('#taller .puntos button').forEach((b, i) => {
        b.classList.toggle('activo', i === mejor);
        if (i === mejor) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
      });
      const t = $('#taller');
      $('.galeria-flecha.anterior', t).disabled = mejor <= 0;
      $('.galeria-flecha.siguiente', t).disabled = mejor >= g.nichos.length - 1;
    }
    const max = arc.scrollWidth - arc.clientWidth;
    const off = 0.5 - (max > 0 ? arc.scrollLeft / max : 0.5);
    const t = $('#taller');
    $('.t-luna', t).style.transform = `translate3d(${(off * 34).toFixed(1)}px,0,0)`;
    $('.t-lamparas', t).style.transform = `translate3d(${(off * 56).toFixed(1)}px,0,0)`;
    $('.t-enredaderas', t).style.transform = `translate3d(${(off * 16).toFixed(1)}px,0,0)`;
  }

  function centrar(i, instantaneo) {
    const caja = g.nichos[i];
    if (!caja) return;
    const izq = caja.offsetLeft + caja.offsetWidth / 2 - g.arcada.clientWidth / 2;
    g.arcada.scrollTo({ left: izq, behavior: instantaneo || reducido ? 'auto' : 'smooth' });
  }
  const mover = (delta) => centrar(Math.max(0, Math.min(g.nichos.length - 1, g.idx + delta)));
  function abrirNicho(n) {
    I.vibrar(8);
    S.tintineo(g.nichos.indexOf(n.parentElement) + 2);
    g.origenNicho = n;
    I.navegar(`c/${n.dataset.slug}`);
  }

  function conectarGaleria() {
    const t = $('#taller'), arc = g.arcada;
    arc.addEventListener('scroll', () => {
      if (!g.raf) g.raf = requestAnimationFrame(enfocar);
      if (!t.classList.contains('recorrido')) setTimeout(() => t.classList.add('recorrido'), 400);
    }, { passive: true });
    window.addEventListener('resize', () => { if (!t.hidden) { centrar(g.idx, true); enfocar(); } });
    arc.addEventListener('click', (e) => {
      const n = e.target.closest('.nicho');
      if (!n) return;
      const i = g.nichos.indexOf(n.parentElement);
      if (i !== g.idx) { centrar(i); return; }
      abrirNicho(n);
    });
    $('.puntos', t).addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) centrar(Number(b.dataset.ir)); });
    $('.galeria-flecha.anterior', t).addEventListener('click', () => mover(-1));
    $('.galeria-flecha.siguiente', t).addEventListener('click', () => mover(1));
    $('.t-lamparas', t).addEventListener('click', (e) => {
      const b = e.target.closest('.t-lampara');
      if (!b) return;
      b.classList.remove('mece'); void b.offsetWidth; b.classList.add('mece');
      I.destellosEn(b.querySelector('svg'), { n: 5, radio: 34 });
      S.tintineo(b.classList.contains('der') ? 6 : 3);
    });
    $('.t-luna', t).addEventListener('click', (e) => {
      const b = e.target.closest('.t-luna-boton');
      if (!b) return;
      b.classList.remove('brilla'); void b.offsetWidth; b.classList.add('brilla');
      I.destellosEn(b, { n: 10, radio: 90, clara: true });
      S.glissando();
    });
  }

  /* Teclado en el taller: ← → recorren los arcos, Enter abre el del
     centro, Inicio/Fin van a los extremos y «/» abre el buscador */
  document.addEventListener('keydown', (e) => {
    const t = $('#taller');
    if (!t || t.hidden || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return;
    if ($$('dialog[open]').length || !$('#coleccion').hidden || !$('#entrada').hidden) return;
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    const enBoton = !!e.target.closest('a, button'); // (ahí Enter hace lo de siempre)
    if (e.key === 'ArrowRight') { e.preventDefault(); mover(1); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); mover(-1); }
    else if (e.key === 'Home') { e.preventDefault(); centrar(0); }
    else if (e.key === 'End') { e.preventDefault(); centrar(g.nichos.length - 1); }
    else if (e.key === '/') { e.preventDefault(); I.navegar('buscar'); }
    else if ((e.key === 'Enter' || e.key === ' ') && !enBoton) {
      const n = g.nichos[g.idx] && g.nichos[g.idx].firstElementChild;
      if (n) { e.preventDefault(); abrirNicho(n); }
    }
  });

  /* ================================================================
     2 · COLECCIÓN (y la capa del buscador)
     ================================================================ */
  function tarjetaHTML(p, i) {
    const r = A.azar(`t-${p.id}`);
    const pr = I.precio(p);
    const sello = p.estado === 'agotado' ? '<span class="sello agotado">agotado</span>'
      : p.estado === 'encargo' ? '<span class="sello">sobre pedido</span>' : '';
    return `<div class="tarjeta-caja" style="--i:${Math.min(i, 12)};--fd:${(3 + r() * 1.4).toFixed(2)}s">
      <a class="tarjeta${p.estado === 'agotado' ? ' agotada' : ''}" href="#p/${encodeURIComponent(p.id)}" data-id="${esc(p.id)}">
        <span class="tarjeta-flota"><span class="marco">${marcoPieza(p, 560)}${A.marcoArco()}${sello}</span></span>
        <span class="tarjeta-sombra" aria-hidden="true"></span>
        <span class="tarjeta-etiqueta"><span class="tarjeta-nombre">${esc(p.nombre)}</span><span class="tarjeta-precio">${pr ? esc(pr) : '&nbsp;'}</span></span>
      </a>
      ${window.Seleccion.corazonHTML(p)}
    </div>`;
  }

  /* Solo se mueven las tarjetas que se ven (ahorra batería y memoria) */
  const visibles = 'IntersectionObserver' in window ? new IntersectionObserver((entradas) => {
    entradas.forEach((en) => en.target.classList.toggle('en-vista', en.isIntersecting));
  }, { rootMargin: '120px 0px' }) : null;
  function observarTarjetas(raiz) {
    $$('.tarjeta-caja', raiz).forEach((el) => { if (visibles) visibles.observe(el); else el.classList.add('en-vista'); });
  }

  function coleccionHTML(c) {
    return `<div class="col-scroll">
      <header class="col-barra">
        <a class="volver" href="#taller" data-volver>${A.ICONOS.volver}<span>Taller</span></a>
        <span class="col-marca" aria-hidden="true">${A.logo()}</span>
        ${atajosBarra()}
      </header>
      <div class="col-cabecera">
        <p class="col-antes">${c.especial ? 'del taller' : 'colección'}</p>
        <h1 class="col-titulo" id="col-titulo">${esc(c.nombre)}</h1>
        <p class="col-cuenta">${I.cuantas(c.total)}</p>
      </div>
      <nav class="chips" aria-label="Colecciones">${estado.categorias.map((x) =>
        `<a class="chip${x.slug === c.slug ? ' activo' : ''}" href="#c/${encodeURIComponent(x.slug)}" data-reemplazar${x.slug === c.slug ? ' aria-current="page"' : ''}>${esc(x.nombre)}</a>`).join('')}</nav>
      <div class="rejilla">${c.productos.map(tarjetaHTML).join('')}</div>
      ${panelContacto()}
    </div>`;
  }

  const rectoCompleto = 'inset(0px 0px 0px 0px round 0px 0px 0px 0px)';
  function recorteArco(el) {
    const r = el.getBoundingClientRect(), rad = r.width / 2;
    return `inset(${r.top.toFixed(1)}px ${(window.innerWidth - r.right).toFixed(1)}px ${(window.innerHeight - r.bottom).toFixed(1)}px ${r.left.toFixed(1)}px round ${rad.toFixed(1)}px ${rad.toFixed(1)}px 8px 8px)`;
  }

  // la capa (colección o búsqueda) entra y tapa el taller
  function abrirCapa(origen) {
    const col = $('#coleccion');
    col.hidden = false;
    document.documentElement.classList.add('con-capa');
    const t = $('#taller');
    t.classList.add('atras');
    $('.col-scroll', col).scrollTop = 0;
    let anim;
    if (origen && !reducido) anim = col.animate([{ clipPath: recorteArco(origen) }, { clipPath: rectoCompleto }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)' });
    else anim = col.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { duration: reducido ? 1 : 260, easing: 'ease-out' });
    anim.finished.then(() => { if (!col.hidden) t.classList.add('tapado'); }).catch(() => {});
  }

  function pintarColeccion(c) {
    const col = $('#coleccion');
    col.innerHTML = coleccionHTML(c);
    col.setAttribute('aria-labelledby', 'col-titulo');
    I.prepararImagenes(col);
    window.Seleccion.pintarMarcas(col);
    observarTarjetas(col);
  }

  function mostrarColeccion(slug) {
    const c = estado.categorias.find((x) => x.slug === slug);
    if (!c) return false;
    const col = $('#coleccion');
    const yaAbierta = !col.hidden;
    if (g.col !== slug || !col.innerHTML) {
      pintarColeccion(c);
      const chip = $('.chip.activo', col);
      if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
      if (yaAbierta) $('.col-scroll', col).scrollTop = 0;
    }
    g.col = slug;
    window.Ficha.ponerLista(c.productos.map((p) => p.id), { ruta: `c/${encodeURIComponent(slug)}`, nombre: c.nombre });
    if (!yaAbierta) {
      const origen = g.origenNicho && $('.nicho-marco', g.origenNicho);
      g.origenNicho = null;
      abrirCapa(origen);
    }
    return true;
  }

  function mostrarBusqueda() {
    const col = $('#coleccion');
    const yaAbierta = !col.hidden;
    if (g.col !== 'buscar' || !col.innerHTML) window.Buscar.mostrar({ enfocar: !yaAbierta });
    else window.Buscar.resultados();
    g.col = 'buscar';
    col.setAttribute('aria-labelledby', 'col-titulo');
    if (!yaAbierta) abrirCapa(null);
  }

  async function cerrarColeccion() {
    const col = $('#coleccion');
    if (col.hidden) return;
    const i = estado.categorias.findIndex((x) => x.slug === g.col);
    const t = $('#taller');
    t.classList.remove('tapado', 'atras');
    document.documentElement.classList.remove('con-capa');
    const caja = g.nichos[i];
    try {
      if (caja && !reducido) {
        centrar(i, true);
        enfocar();
        await col.animate([{ clipPath: rectoCompleto }, { clipPath: recorteArco($('.nicho-marco', caja)) }], { duration: 460, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
      } else {
        await col.animate([{ opacity: 1 }, { opacity: 0 }], { duration: reducido ? 1 : 200, fill: 'forwards' }).finished;
      }
    } catch (e) { /* animación cancelada */ }
    col.hidden = true;
    col.getAnimations().forEach((a) => a.cancel());
    col.innerHTML = '';
    g.col = null;
  }

  /* ================================================================
     4 · CONTACTO (panel verde con las hojas de Inluna, olas y azulejos)
     ================================================================ */
  function panelContacto() {
    const a = estado.ajustes, wa = I.enlaceWhatsApp(), ig = I.enlaceInstagram();
    const patrones = ['escamas', 'destellos', 'ajedrez', 'olas', 'rombos', 'arcoiris', 'puntos', 'flores', 'tejido', 'gotas', 'circulos', 'arcos'];
    const azulejos = patrones.map((pt) => `<span class="azulejo" style="background-image:url(&quot;${A.imagenDeDibujo(`patron:${pt}`)}&quot;)"></span>`).join('');
    // en los márgenes, lejos del texto centrado
    const estrellasC = [[6, 20, 5], [10, 64, 3.5], [86, 16, 4.5], [92, 52, 6], [26, 8, 3], [72, 7, 3]].map(([x, y, r]) =>
      `<svg class="c-estrella" style="left:${x}%;top:${y}%;width:${r * 4}px" viewBox="0 0 20 20" aria-hidden="true"><path d="${A.destello(10, 10, 9, 0.18)}"/></svg>`).join('');
    return `<section class="contacto" aria-label="Contacto y pedidos">
      <div class="contacto-noche">
        <div class="contacto-festones" aria-hidden="true"></div>
        ${estrellasC}
        <div class="contacto-emblema" aria-hidden="true">${A.logo({ clase: 'contacto-hojas' })}</div>
        <p class="contacto-antes">¿te gustó algo?</p>
        <h2 class="contacto-titulo">Hagamos tu pedido</h2>
        <p class="contacto-texto">Escríbeme para pedidos, encargos o piezas personalizadas. Te respondo en cuanto salga del taller.</p>
        <div class="contacto-botones">
          ${wa || D.modoPrueba ? `<a class="boton boton-luna" href="${wa || '#'}" target="_blank" rel="noopener" data-wa>${A.ICONOS.whatsapp}<span>WhatsApp</span></a>` : ''}
          <a class="boton boton-luna-borde" href="#cotizar">${A.ICONOS.mensaje}<span>Cotizar un encargo</span></a>
          ${ig ? `<a class="boton boton-luna-borde" href="${ig}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>@${esc(a.instagram)}</span></a>` : ''}
        </div>
        <p class="contacto-mas"><a href="#seleccion">${A.ICONOS.corazon}<span>mi selección</span></a><span aria-hidden="true">·</span><a href="#sobre">${A.ICONOS.hoja}<span>conoce el taller</span></a></p>
        <div class="contacto-olas" aria-hidden="true" style="background-image:url(&quot;${A.aUri(olasSVG())}&quot;)"></div>
      </div>
      <div class="contacto-azulejos" aria-hidden="true">${azulejos}</div>
      <p class="contacto-firma">${A.logo({ estrellas: true })}<span>${esc(a.nombre)} · hecho a mano</span></p>
      ${estado.fuente === 'prueba' ? '<p class="contacto-demo">Estas son piezas de ejemplo: pronto verás aquí las del taller.</p>' : ''}
    </section>`;
  }

  function olasSVG() {
    const { O, P } = A.colores;
    let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 92" width="120" height="92"><path d="M0,44H120V92H0Z" fill="${O}" opacity=".32"/>`;
    for (let k = 0; k < 4; k++) {
      const y = 34 + k * 15;
      s += `<path d="M0,${y}q15,-8 30,0t30,0t30,0t30,0" fill="none" stroke="${P}" stroke-width="2.2" stroke-linecap="round" opacity="${(0.95 - k * 0.2).toFixed(2)}"/>`;
    }
    return s + '</svg>';
  }

  const dlgContacto = $('#contacto');
  function abrirContacto() {
    if (dlgContacto.open) return;
    dlgContacto.innerHTML = `<div class="hoja-contacto"><button class="boton-icono contacto-cerrar" type="button" data-cerrar aria-label="Cerrar">${A.ICONOS.cerrar}</button>${panelContacto()}</div>`;
    dlgContacto.showModal();
    I.actualizarScroll();
  }
  async function cerrarContacto() {
    if (!dlgContacto.open) return;
    dlgContacto.classList.add('cerrando');
    await espera(reducido ? 0 : 200);
    dlgContacto.close();
    dlgContacto.classList.remove('cerrando');
    I.actualizarScroll();
  }
  dlgContacto.addEventListener('cancel', (e) => { e.preventDefault(); I.volver(); });
  dlgContacto.addEventListener('click', (e) => {
    if (e.target === dlgContacto || e.target.closest('[data-cerrar]')) I.volver();
  });

  /* Al salir del taller: todo se cierra al instante (la fachada lo tapa) */
  function cerrarDialogos() {
    window.Ficha.cerrarYa();
    [window.Seleccion, window.Cotizar, window.Sobre].forEach((m) => m.cerrarYa());
    if (dlgContacto.open) { dlgContacto.close(); dlgContacto.classList.remove('cerrando'); }
    I.actualizarScroll();
  }
  function cerrarTodo() {
    cerrarDialogos();
    const col = $('#coleccion');
    col.getAnimations().forEach((a) => a.cancel());
    col.hidden = true;
    col.innerHTML = '';
    g.col = null;
    $('#taller').classList.remove('atras', 'tapado');
    document.documentElement.classList.remove('con-capa');
  }

  /* Llegaron datos nuevos: repinta sin perder el lugar */
  function refrescar() {
    render();
    const col = $('#coleccion');
    if (col.hidden || !g.col) return;
    const sc = $('.col-scroll', col);
    const y = sc ? sc.scrollTop : 0;
    if (g.col === 'buscar') { window.Buscar.resultados(); return; }
    const c = estado.categorias.find((x) => x.slug === g.col);
    if (!c) return;
    pintarColeccion(c);
    $('.col-scroll', col).scrollTop = y;
    window.Ficha.ponerLista(c.productos.map((p) => p.id));
  }

  window.Taller = {
    construir, render, refrescar, mostrarColeccion, mostrarBusqueda, cerrarColeccion, abrirContacto, cerrarContacto,
    cerrarDialogos, cerrarTodo, imagenCatalogo, marcoPieza, tarjetaHTML, observarTarjetas, atajosBarra,
    coleccionAbierta: () => !$('#coleccion').hidden,
    coleccionActual: () => g.col,
    rutaLista: () => (g.col === 'buscar' ? 'buscar' : g.col ? `c/${g.col}` : 'taller'),
    tipoAnimacion,
  };
})();
