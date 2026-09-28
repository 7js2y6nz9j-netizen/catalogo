/* ==================================================================
   taller.js · El interior del taller
   ------------------------------------------------------------------
   1. Galería de arcos: cada colección vive en un arco; se recorre
      deslizando (el arco del centro se ilumina y se acerca).
   2. Colección: se abre "desde" su arco; las piezas flotan en fila.
   3. Pieza: ficha inmersiva con la FOTO ORIGINAL (en el catálogo
      se ve la versión dibujada con el estilo del taller).
   4. Contacto: panel de noche con luna, olas y azulejos.
   Cada pieza tiene una animación de uso: vapor, balanceo, giro…
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, E = window.Escenas, D = window.Datos, S = window.Sonido;
  const { $, $$, esc, espera, reducido, estado } = I;

  const g = {
    construido: false, arcada: null, nichos: [], idx: 0, raf: 0,
    col: null, lista: [], pieza: null, origenNicho: null, origenPieza: null,
  };

  /* Animaciones de uso (js/animaciones.js): vapor, balanceo, giro… */
  const tipoAnimacion = window.Animaciones.tipo;
  const capaAnimacion = window.Animaciones.capa;

  /* En el catálogo: la versión dibujada (o la foto con filtro de tinta) */
  function imagenCatalogo(p, ancho) {
    const original = p.fotos[0], dibujo = p.dibujos && p.dibujos[0];
    if (dibujo) return I.imagen(dibujo, p.nombre, ancho);
    if (!original) return I.imagen('', p.nombre, ancho);
    const demo = /^(dibujo|patron):/.test(original);
    return I.imagen(original, p.nombre, ancho, { clase: demo ? '' : 'foto-cruda' });
  }
  function marcoPieza(p, ancho) {
    const tipo = tipoAnimacion(p);
    return `<span class="marco-img${tipo ? ` anim-${tipo}` : ''}">${imagenCatalogo(p, ancho)}${capaAnimacion(tipo)}</span>`;
  }

  /* ================================================================
     1 · GALERÍA DE ARCOS
     ================================================================ */
  function construir() {
    const t = $('#taller');
    if (!g.construido) {
      g.construido = true;
      $('.t-friso', t).style.backgroundImage = `url("${A.aUri(A.frisoTile())}")`;
      $('.t-luna', t).innerHTML = `<button class="t-luna-boton" type="button" aria-label="La ventana de la luna">${E.ventanaLunaSVG(150)}</button>`;
      $('.t-lamparas', t).innerHTML = [0, 1].map((i) => `<button class="t-lampara ${i ? 'der' : 'izq'}" type="button" aria-label="Mover la lámpara">${E.lampara(40)}</button>`).join('');
      $('.t-enredaderas', t).innerHTML = `<span class="t-enr izq">${E.enredaderaColgante(170, 1, 61)}</span><span class="t-enr der">${E.enredaderaColgante(170, 1, 61)}</span>`;
      g.arcada = $('.arcada', t);
      conectarGaleria();
    }
    render();
  }

  function render() {
    const t = $('#taller'), a = estado.ajustes;
    $('.t-cabecera', t).innerHTML = `<p class="t-antes">${esc(a.antesDelNombre)}</p><h1 class="t-nombre">${esc(a.nombre)}</h1>`;
    const cols = estado.categorias;
    if (!cols.length) {
      g.arcada.innerHTML = '<p class="galeria-vacia">Pronto habrá piezas nuevas en el taller.</p>';
      g.nichos = [];
      $('.puntos', t).innerHTML = '';
    } else {
      g.arcada.innerHTML = cols.map((c, i) => (i ? `<span class="pilar" aria-hidden="true">${E.pilar()}</span>` : '') + nichoHTML(c)).join('');
      g.nichos = $$('.nicho-caja', g.arcada);
      $('.puntos', t).innerHTML = cols.map((c, i) => `<button type="button" data-ir="${i}" aria-label="Ir a ${esc(c.nombre)}"></button>`).join('');
    }
    $('.t-contacto', t).innerHTML = barraContacto();
    $('.galeria-pista', t).hidden = cols.length < 2;
    I.prepararImagenes(g.arcada);
    g.idx = -1;
    requestAnimationFrame(() => { centrar(Math.min(g.idxGuardado || 0, Math.max(0, g.nichos.length - 1)), true); enfocar(); });
  }

  function nichoHTML(c) {
    const cuerpo = c.pieza ? marcoPieza(c.pieza, 720) : `<span class="marco-img anim-brillo">${I.imagen(c.patron, c.nombre, 720)}${capaAnimacion('brillo')}</span>`;
    const sello = c.especial === 'favoritas' ? '<span class="nicho-sello">✦ favoritas</span>' : c.especial === 'todas' ? '<span class="nicho-sello">todo el taller</span>' : '';
    return `<div class="nicho-caja" role="listitem">
      <button class="nicho${c.especial ? ' especial' : ''}" type="button" data-slug="${esc(c.slug)}" aria-label="${esc(c.nombre)}, ${I.cuantas(c.total)}">
        <span class="nicho-marco">${cuerpo}${A.marcoArco()}${sello}<span class="nicho-luz" aria-hidden="true"></span></span>
        <span class="nicho-sombra" aria-hidden="true"></span>
        <span class="nicho-placa"><span class="nicho-nombre">${esc(c.nombre)}</span><span class="nicho-cuenta">${I.cuantas(c.total)}</span></span>
      </button>
    </div>`;
  }

  function barraContacto() {
    const ig = I.enlaceInstagram(), wa = I.enlaceWhatsApp();
    const igB = ig ? `<a class="boton-icono" href="${ig}" target="_blank" rel="noopener" aria-label="Instagram">${A.ICONOS.instagram}</a>` : '<span class="boton-hueco"></span>';
    const waB = wa || D.modoPrueba ? `<a class="boton-icono" href="${wa || '#'}" target="_blank" rel="noopener" data-wa aria-label="WhatsApp">${A.ICONOS.whatsapp}</a>` : '<span class="boton-hueco"></span>';
    return `${igB}<a class="boton boton-tinta boton-pedido" href="#contacto"><svg class="icono" viewBox="0 0 20 20" aria-hidden="true"><path d="${A.destello(10, 10, 8.5, 0.2)}" fill="currentColor"/></svg><span>Hacer un pedido</span></a>${waB}`;
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
      $$('#taller .puntos button').forEach((b, i) => b.classList.toggle('activo', i === mejor));
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
      I.vibrar(8);
      S.tintineo(i + 2);
      g.origenNicho = n;
      I.navegar(`c/${n.dataset.slug}`);
    });
    arc.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); centrar(Math.min(g.nichos.length - 1, g.idx + 1)); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); centrar(Math.max(0, g.idx - 1)); }
    });
    $('.puntos', t).addEventListener('click', (e) => { const b = e.target.closest('[data-ir]'); if (b) centrar(Number(b.dataset.ir)); });
    $('.galeria-flecha.anterior', t).addEventListener('click', () => centrar(Math.max(0, g.idx - 1)));
    $('.galeria-flecha.siguiente', t).addEventListener('click', () => centrar(Math.min(g.nichos.length - 1, g.idx + 1)));
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

  /* ================================================================
     2 · COLECCIÓN
     ================================================================ */
  function tarjetaHTML(p, i) {
    const r = A.azar(`t-${p.id}`);
    const pr = I.precio(p);
    const sello = p.estado === 'agotado' ? '<span class="sello agotado">agotado</span>'
      : p.estado === 'encargo' ? '<span class="sello">sobre pedido</span>' : '';
    return `<a class="tarjeta${p.estado === 'agotado' ? ' agotada' : ''}" href="#p/${encodeURIComponent(p.id)}" data-id="${esc(p.id)}" style="--i:${i};--fd:${(3 + r() * 1.4).toFixed(2)}s;--fdel:-${(r() * 3).toFixed(2)}s">
      <span class="tarjeta-flota"><span class="marco">${marcoPieza(p, 560)}${A.marcoArco()}${sello}</span></span>
      <span class="tarjeta-sombra" aria-hidden="true"></span>
      <span class="tarjeta-etiqueta"><span class="tarjeta-nombre">${esc(p.nombre)}</span><span class="tarjeta-precio">${pr ? esc(pr) : '&nbsp;'}</span></span>
    </a>`;
  }

  function coleccionHTML(c) {
    return `<div class="col-scroll">
      <header class="col-barra">
        <a class="volver" href="#" data-volver>${A.ICONOS.volver}<span>Taller</span></a>
        <span class="col-marca" aria-hidden="true">${A.logo()}</span>
        <span class="col-hueco"></span>
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

  function mostrarColeccion(slug) {
    const c = estado.categorias.find((x) => x.slug === slug);
    if (!c) return false;
    const col = $('#coleccion');
    const yaAbierta = !col.hidden;
    if (g.col !== slug || !col.innerHTML) {
      col.innerHTML = coleccionHTML(c);
      I.prepararImagenes(col);
      const chip = $('.chip.activo', col);
      if (chip) chip.scrollIntoView({ block: 'nearest', inline: 'center' });
      if (yaAbierta) $('.col-scroll', col).scrollTop = 0;
    }
    g.col = slug;
    g.lista = c.productos.map((p) => p.id);
    if (!yaAbierta) {
      const origen = g.origenNicho && $('.nicho-marco', g.origenNicho);
      g.origenNicho = null;
      col.hidden = false;
      $('#taller').classList.add('atras');
      $('.col-scroll', col).scrollTop = 0;
      if (origen && !reducido) {
        col.animate([{ clipPath: recorteArco(origen) }, { clipPath: rectoCompleto }], { duration: 560, easing: 'cubic-bezier(.7,0,.2,1)' });
      } else {
        col.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220 });
      }
    }
    return true;
  }

  async function cerrarColeccion() {
    const col = $('#coleccion');
    if (col.hidden) return;
    const i = estado.categorias.findIndex((x) => x.slug === g.col);
    $('#taller').classList.remove('atras');
    const caja = g.nichos[i];
    try {
      if (caja && !reducido) {
        centrar(i, true);
        enfocar();
        await col.animate([{ clipPath: rectoCompleto }, { clipPath: recorteArco($('.nicho-marco', caja)) }], { duration: 460, easing: 'cubic-bezier(.7,0,.2,1)', fill: 'forwards' }).finished;
      } else {
        await col.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }).finished;
      }
    } catch (e) { /* animación cancelada */ }
    col.hidden = true;
    col.getAnimations().forEach((a) => a.cancel());
    col.innerHTML = '';
    g.col = null;
  }

  /* ================================================================
     3 · PIEZA (ficha inmersiva con la foto original)
     ================================================================ */
  const dlg = $('#ficha');

  function fichaHTML(p) {
    const fotos = p.fotos.length ? p.fotos : [''];
    const pr = I.precio(p);
    const pos = g.lista.indexOf(p.id);
    const total = g.lista.length;
    const pedir = p.estado === 'agotado' ? 'Preguntar por WhatsApp' : p.estado === 'encargo' ? 'Encargar por WhatsApp' : 'Pedir por WhatsApp';
    const nav = total > 1 && pos >= 0
      ? `<button class="boton-icono" type="button" data-anterior aria-label="Pieza anterior">${A.ICONOS.volver}</button><span class="ficha-pos">${pos + 1} / ${total}</span><button class="boton-icono girado" type="button" data-siguiente aria-label="Pieza siguiente">${A.ICONOS.volver}</button>`
      : '';
    return `<div class="ficha-escena">
      <header class="ficha-barra"><div class="ficha-nav">${nav}</div><button class="boton-icono ficha-cerrar" type="button" data-cerrar aria-label="Cerrar">${A.ICONOS.cerrar}</button></header>
      <div class="ficha-cuerpo">
        <div class="vitrina">
          <div class="vitrina-marco">
            <div class="vitrina-fotos" tabindex="0" aria-label="Fotos de ${esc(p.nombre)}">${fotos.map((f, i) =>
              `<figure class="vitrina-foto">${I.imagen(f, `${p.nombre} · foto ${i + 1}`, 1400, { perezosa: i > 0 })}</figure>`).join('')}</div>
            <span class="vitrina-brillo" aria-hidden="true"></span>
          </div>
          ${fotos.length > 1 ? `<div class="vitrina-puntos">${fotos.map((_, i) => `<button type="button" data-foto="${i}" aria-label="Ver foto ${i + 1}"${i ? '' : ' class="activo"'}></button>`).join('')}</div>` : ''}
          <span class="vitrina-sombra" aria-hidden="true"></span>
        </div>
        <div class="ficha-info">
          ${p.categoria ? `<p class="ficha-cat">${esc(p.categoria)}</p>` : ''}
          <h2 class="ficha-nombre" id="ficha-nombre">${esc(p.nombre)}</h2>
          <div class="ficha-precio-fila">${pr ? `<span class="ficha-precio">${esc(pr)}</span>` : ''}<span class="estado ${p.estado}">${I.textoEstado(p)}</span></div>
          ${p.descripcion ? `<p class="ficha-desc">${esc(p.descripcion)}</p>` : ''}
          <div class="ficha-acciones">
            <a class="boton boton-tinta" href="${esc(I.enlaceWhatsApp(p) || '#')}" target="_blank" rel="noopener" data-wa>${A.ICONOS.whatsapp}<span>${pedir}</span></a>
            <div class="ficha-acciones-fila">
              ${I.mensajeInstagram() ? `<a class="boton" href="${I.mensajeInstagram()}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>Mensaje</span></a>` : ''}
              <button class="boton" type="button" data-compartir>${A.ICONOS.compartir}<span>Compartir</span></button>
            </div>
          </div>
          <p class="ficha-nota">✦ Hecho a mano: cada pieza puede variar un poquito.</p>
        </div>
      </div>
    </div>`;
  }

  function abrirPieza(p, { direccion = 0 } = {}) {
    const primera = !dlg.open;
    const origen = g.origenPieza;
    g.origenPieza = null;
    if (g.lista.indexOf(p.id) < 0) g.lista = [p.id];
    g.pieza = p;
    dlg.innerHTML = fichaHTML(p);
    I.prepararImagenes(dlg);
    const fotos = $('.vitrina-fotos', dlg), puntos = $$('.vitrina-puntos button', dlg);
    if (fotos && puntos.length) {
      fotos.addEventListener('scroll', () => {
        const i = Math.round(fotos.scrollLeft / Math.max(1, fotos.clientWidth));
        puntos.forEach((b, k) => b.classList.toggle('activo', k === i));
      }, { passive: true });
    }
    if (primera) {
      document.documentElement.classList.add('sin-scroll');
      dlg.showModal();
    }
    const marco = $('.vitrina-marco', dlg);
    if (reducido) return;
    if (primera && origen) {
      const a = origen.getBoundingClientRect(), b = marco.getBoundingClientRect();
      const s = a.width / b.width;
      marco.animate([
        { transform: `translate(${(a.left + a.width / 2 - (b.left + b.width / 2)).toFixed(1)}px,${(a.top + a.height / 2 - (b.top + b.height / 2)).toFixed(1)}px) scale(${s.toFixed(3)})`, borderRadius: `${(b.width / 2).toFixed(0)}px ${(b.width / 2).toFixed(0)}px 12px 12px` },
        { transform: 'none', borderRadius: '22px' },
      ], { duration: 480, easing: 'cubic-bezier(.2,.8,.2,1)' });
      $('.ficha-info', dlg).animate([{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 120, easing: 'ease-out', fill: 'backwards' });
    } else if (direccion) {
      $('.vitrina', dlg).animate([{ opacity: 0, transform: `translateX(${direccion * 48}px)` }, { opacity: 1, transform: 'none' }], { duration: 300, easing: 'cubic-bezier(.2,.8,.2,1)' });
      $('.ficha-info', dlg).animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300 });
    } else if (primera) {
      $('.ficha-escena', dlg).animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    }
  }

  async function cerrarPieza() {
    if (!dlg.open || dlg.classList.contains('cerrando')) return;
    dlg.classList.add('cerrando');
    await espera(reducido ? 0 : 200);
    dlg.close();
    dlg.classList.remove('cerrando');
    document.documentElement.classList.remove('sin-scroll');
    g.pieza = null;
  }

  function siguientePieza(delta) {
    if (!g.pieza || g.lista.length < 2) return;
    const i = g.lista.indexOf(g.pieza.id);
    const id = g.lista[(i + delta + g.lista.length) % g.lista.length];
    g.direccion = delta;
    I.navegar(`p/${id}`, { reemplazar: true });
    S.toque();
  }

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); I.cerrarPiezaRuta(); });
  dlg.addEventListener('click', (e) => {
    const t = e.target;
    if (t === dlg || t.closest('[data-cerrar]')) { I.cerrarPiezaRuta(); return; }
    if (t.closest('[data-anterior]')) { siguientePieza(-1); return; }
    if (t.closest('[data-siguiente]')) { siguientePieza(1); return; }
    if (t.closest('[data-compartir]') && g.pieza) { I.compartir(g.pieza); return; }
    const punto = t.closest('[data-foto]');
    if (punto) {
      const f = $('.vitrina-fotos', dlg);
      f.scrollTo({ left: Number(punto.dataset.foto) * f.clientWidth, behavior: reducido ? 'auto' : 'smooth' });
    }
  });
  dlg.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && !e.target.closest('.vitrina-fotos')) siguientePieza(1);
    if (e.key === 'ArrowLeft' && !e.target.closest('.vitrina-fotos')) siguientePieza(-1);
  });
  // la vitrina se inclina con el mouse (y con el teléfono en Android)
  dlg.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reducido) return;
    const m = $('.vitrina-marco', dlg);
    if (!m) return;
    const r = m.getBoundingClientRect();
    const x = Math.max(-0.6, Math.min(0.6, (e.clientX - r.left) / r.width - 0.5));
    const y = Math.max(-0.6, Math.min(0.6, (e.clientY - r.top) / r.height - 0.5));
    m.style.transform = `perspective(1000px) rotateY(${(x * 12).toFixed(2)}deg) rotateX(${(-y * 9).toFixed(2)}deg)`;
    m.style.setProperty('--bx', `${((x + 0.5) * 100).toFixed(1)}%`);
    m.style.setProperty('--by', `${((y + 0.5) * 100).toFixed(1)}%`);
  });
  window.addEventListener('deviceorientation', (e) => {
    if (!dlg.open || e.gamma == null || reducido) return;
    const m = $('.vitrina-marco', dlg);
    if (!m) return;
    const x = Math.max(-1, Math.min(1, e.gamma / 25)), y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    m.style.transform = `perspective(1000px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
    m.style.setProperty('--bx', `${((x + 1) * 50).toFixed(1)}%`);
    m.style.setProperty('--by', `${((y + 1) * 50).toFixed(1)}%`);
  });

  /* ================================================================
     4 · CONTACTO (panel de noche con luna, olas y azulejos)
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
        <svg class="contacto-luna" viewBox="0 0 80 80" aria-hidden="true"><g transform="rotate(90 40 40)"><path d="M40,12A28,28 0 0 1 40,68A16,28 0 0 0 40,12Z"/></g><circle cx="40" cy="40" r="28" fill="none" stroke-dasharray="2 6"/></svg>
        <p class="contacto-antes">¿te gustó algo?</p>
        <h2 class="contacto-titulo">Hagamos tu pedido</h2>
        <p class="contacto-texto">Escríbeme para pedidos, encargos o piezas personalizadas. Te respondo en cuanto salga del taller.</p>
        <div class="contacto-botones">
          ${wa || D.modoPrueba ? `<a class="boton boton-luna" href="${wa || '#'}" target="_blank" rel="noopener" data-wa>${A.ICONOS.whatsapp}<span>WhatsApp</span></a>` : ''}
          ${ig ? `<a class="boton boton-luna-borde" href="${ig}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>@${esc(a.instagram)}</span></a>` : ''}
        </div>
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
    document.documentElement.classList.add('sin-scroll');
    dlgContacto.showModal();
  }
  async function cerrarContacto() {
    if (!dlgContacto.open) return;
    dlgContacto.classList.add('cerrando');
    await espera(reducido ? 0 : 200);
    dlgContacto.close();
    dlgContacto.classList.remove('cerrando');
    if (!dlg.open) document.documentElement.classList.remove('sin-scroll');
  }
  dlgContacto.addEventListener('cancel', (e) => { e.preventDefault(); I.volver(); });
  dlgContacto.addEventListener('click', (e) => {
    if (e.target === dlgContacto || e.target.closest('[data-cerrar]')) I.volver();
  });

  // recordar la tarjeta tocada (para que la pieza "vuele" desde ahí)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.tarjeta');
    if (t) g.origenPieza = $('.marco', t);
  }, true);

  /* Llegaron datos nuevos: repinta sin perder el lugar */
  function refrescar() {
    render();
    const col = $('#coleccion');
    const c = g.col && estado.categorias.find((x) => x.slug === g.col);
    if (c && !col.hidden) {
      const sc = $('.col-scroll', col);
      const y = sc ? sc.scrollTop : 0;
      col.innerHTML = coleccionHTML(c);
      I.prepararImagenes(col);
      $('.col-scroll', col).scrollTop = y;
      g.lista = c.productos.map((p) => p.id);
    }
  }

  window.Taller = {
    construir, render, refrescar, mostrarColeccion, cerrarColeccion, abrirPieza, cerrarPieza, abrirContacto, cerrarContacto,
    coleccionAbierta: () => !$('#coleccion').hidden,
    coleccionActual: () => g.col,
    piezaAbierta: () => dlg.open,
    direccion() { const d = g.direccion || 0; g.direccion = 0; return d; },
    tipoAnimacion,
  };
})();
