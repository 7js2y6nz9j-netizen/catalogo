/* ==================================================================
   ficha.js · La ficha de cada pieza
   ------------------------------------------------------------------
   · Galería con todas las fotos ORIGINALES: se deslizan con el dedo,
     con las flechas o las miniaturas (y con ← → del teclado). Al tocar
     una foto se abre el visor con zoom: pellizcar, doble toque, rueda
     del mouse, + y −; arrastrar para moverse y deslizar para cambiar.
   · Datos de la pieza: medidas, tiempo de entrega y pedido mínimo;
     variantes (talla, color, material) y cantidad.
   · Pedir por WhatsApp con lo elegido, cotizar si es sobre pedido,
     guardarla en «mi selección» y compartirla.
   · Al final, piezas relacionadas.
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, D = window.Datos, S = window.Sonido;
  const { $, $$, esc, espera, reducido, estado } = I;
  const dlg = $('#ficha');
  const f = { pieza: null, lista: [], volver: { ruta: 'taller', nombre: 'Taller' }, origen: null, opciones: {} };

  /* La lista por la que se pasa con «anterior / siguiente» y a dónde vuelve */
  function ponerLista(ids, volver) {
    f.lista = ids.slice();
    if (volver) f.volver = volver;
  }

  /* ================================================================
     HTML
     ================================================================ */
  function galeriaHTML(p) {
    const fotos = p.fotos.length ? p.fotos : [''];
    const varias = fotos.length > 1;
    return `<div class="vitrina">
      <div class="vitrina-marco">
        <div class="vitrina-fotos" tabindex="0" role="region" aria-roledescription="carrusel" aria-label="Fotos de ${esc(p.nombre)}${varias ? `: ${fotos.length}. Usa las flechas para cambiar` : ''}">${fotos.map((ref, i) =>
          `<figure class="vitrina-foto" aria-label="Foto ${i + 1} de ${fotos.length}">${ref
            ? `<button type="button" class="vitrina-ampliar" data-ampliar="${i}" aria-label="Ampliar la foto ${i + 1}">${I.imagen(ref, `${p.nombre} · foto ${i + 1}`, 1200, { perezosa: i > 0 })}</button>`
            : I.imagen('', p.nombre, 400)}</figure>`).join('')}</div>
        <span class="vitrina-brillo" aria-hidden="true"></span>
        ${varias ? `<button class="vitrina-flecha anterior" type="button" data-foto-paso="-1" aria-label="Foto anterior">${A.ICONOS.volver}</button>
        <button class="vitrina-flecha siguiente" type="button" data-foto-paso="1" aria-label="Foto siguiente">${A.ICONOS.siguiente}</button>
        <span class="vitrina-cuenta" aria-hidden="true"><span data-foto-actual>1</span> / ${fotos.length}</span>` : ''}
        ${fotos[0] ? `<button class="vitrina-zoom" type="button" data-ampliar="actual" aria-label="Ampliar la foto">${A.ICONOS.zoom}</button>` : ''}
      </div>
      ${varias ? `<div class="vitrina-miniaturas" role="group" aria-label="Elegir foto">${fotos.map((ref, i) =>
        `<button type="button" class="miniatura${i ? '' : ' activa'}" data-foto="${i}" aria-label="Ver foto ${i + 1}"${i ? '' : ' aria-current="true"'}>${I.imagen(ref, '', 160)}</button>`).join('')}</div>` : ''}
      <span class="vitrina-sombra" aria-hidden="true"></span>
    </div>`;
  }

  const DATOS = [['medidas', 'regla', 'Medidas'], ['entrega', 'reloj', 'Tiempo de entrega']];
  function infoHTML(p) {
    const pr = I.precio(p);
    const datos = DATOS.filter(([k]) => p[k]).map(([k, ic, et]) => [ic, et, p[k]]);
    if (p.minimo > 1) datos.push(['caja', 'Pedido mínimo', `${p.minimo} piezas`]);
    const minimo = Math.max(1, p.minimo || 1);
    const op = f.opciones[p.id] || {};
    const elegido = (clave, v, total) => (op.variantes && op.variantes[clave] === v) || total === 1;
    const grupos = I.VARIANTES.filter(([lista]) => p[lista].length);
    return `<div class="ficha-info">
      ${p.categoria ? `<p class="ficha-cat">${esc(p.categoria)}</p>` : ''}
      <h2 class="ficha-nombre" id="ficha-nombre">${esc(p.nombre)}</h2>
      <div class="ficha-precio-fila">${pr ? `<span class="ficha-precio">${esc(pr)}</span>` : ''}<span class="estado ${p.estado}">${I.textoEstado(p)}</span></div>
      ${p.descripcion ? `<p class="ficha-desc">${esc(p.descripcion)}</p>` : ''}
      ${datos.length ? `<dl class="ficha-datos">${datos.map(([ic, et, v]) =>
        `<div class="dato"><dt>${A.ICONOS[ic]}<span>${et}</span></dt><dd>${esc(v)}</dd></div>`).join('')}</dl>` : ''}
      ${grupos.length || p.estado !== 'agotado' ? `<form class="ficha-opciones" data-opciones>
        ${grupos.map(([lista, clave, et]) => `<fieldset class="variante" data-variante="${clave}">
          <legend>${et}${p[lista].length > 1 ? '<span class="variante-falta" aria-live="polite"></span>' : ''}</legend>
          <div class="variante-opciones">${p[lista].map((v) => `<label class="opcion"><input type="radio" name="${clave}" value="${esc(v)}"${elegido(clave, v, p[lista].length) ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div>
        </fieldset>`).join('')}
        ${p.estado !== 'agotado' ? `<div class="variante variante-cantidad">
          <span class="variante-etiqueta">Cantidad</span>
          ${I.contadorHTML('cantidad', Math.max(minimo, op.cantidad || minimo), minimo)}
          ${minimo > 1 ? `<span class="cantidad-nota">mínimo ${minimo}</span>` : ''}
        </div>` : ''}
      </form>` : ''}
      <div class="ficha-acciones">
        ${accionPrincipal(p)}
        <button class="boton boton-seleccion" type="button" data-seleccionar aria-pressed="false">${A.ICONOS.corazon}<span>Guardar en mi selección</span></button>
        <div class="ficha-acciones-fila">
          ${I.mensajeInstagram() ? `<a class="boton" href="${I.mensajeInstagram()}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>Mensaje</span></a>` : ''}
          <button class="boton" type="button" data-compartir>${A.ICONOS.compartir}<span>Compartir</span></button>
        </div>
      </div>
      <p class="ficha-nota">✦ Hecho a mano: cada pieza puede variar un poquito.</p>
    </div>`;
  }

  function accionPrincipal(p) {
    if (p.estado === 'encargo') {
      return `<a class="boton boton-tinta" href="#cotizar/${encodeURIComponent(p.id)}" data-cotizar>${A.ICONOS.mensaje}<span>Cotizar este encargo</span></a>`;
    }
    const texto = p.estado === 'agotado' ? 'Preguntar por WhatsApp' : 'Pedir por WhatsApp';
    return `<a class="boton boton-tinta" href="${esc(I.enlaceWhatsApp(p, opcionesDe(p)) || '#')}" target="_blank" rel="noopener" data-wa data-pedir>${A.ICONOS.whatsapp}<span>${texto}</span></a>`;
  }

  /* Piezas relacionadas: primero de su colección, luego favoritas y el resto */
  function relacionadas(p) {
    const puntaje = (x) => (x.categoria === p.categoria ? 4 : 0) + (x.destacado ? 1.5 : 0) + (x.estado === p.estado ? 0.5 : 0)
      + (x.fotos.length ? 0.5 : 0) - (x.estado === 'agotado' ? 2 : 0);
    return estado.productos.filter((x) => x.id !== p.id)
      .map((x, i) => ({ x, s: puntaje(x), i })).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 6).map((o) => o.x);
  }
  function relacionadasHTML(p) {
    const lista = relacionadas(p);
    if (!lista.length) return '';
    return `<section class="relacionadas" aria-labelledby="rel-titulo">
      <h3 class="relacionadas-titulo" id="rel-titulo"><span>✦</span> También te puede gustar</h3>
      <div class="relacionadas-fila">${lista.map((x) => `<a class="mini-tarjeta" href="#p/${encodeURIComponent(x.id)}" data-reemplazar>
          <span class="mini-marco marco">${window.Taller.marcoPieza(x, 360)}${A.marcoArco()}</span>
          <span class="mini-nombre">${esc(x.nombre)}</span>
          <span class="mini-precio">${esc(I.precio(x)) || I.textoEstado(x)}</span>
        </a>`).join('')}</div>
    </section>`;
  }

  function fichaHTML(p) {
    const pos = f.lista.indexOf(p.id), total = f.lista.length;
    const nav = total > 1 && pos >= 0 ? `<div class="ficha-nav" role="group" aria-label="Otras piezas">
        <button class="boton-icono" type="button" data-anterior aria-label="Pieza anterior">${A.ICONOS.volver}</button>
        <span class="ficha-pos">${pos + 1} de ${total}</span>
        <button class="boton-icono" type="button" data-siguiente aria-label="Pieza siguiente">${A.ICONOS.siguiente}</button>
      </div>` : '';
    return `<div class="ficha-escena" tabindex="-1">
      <header class="ficha-barra">
        <a class="volver" href="#${esc(f.volver.ruta)}" data-volver aria-label="Volver a ${esc(f.volver.nombre)}">${A.ICONOS.volver}<span>${esc(f.volver.nombre)}</span></a>
        ${nav}
      </header>
      <div class="ficha-cuerpo">${galeriaHTML(p)}${infoHTML(p)}</div>
      ${relacionadasHTML(p)}
    </div>`;
  }

  /* ================================================================
     OPCIONES (variantes y cantidad)
     ================================================================ */
  function opcionesDe(p) {
    const form = dlg.open && f.pieza && f.pieza.id === p.id ? $('[data-opciones]', dlg) : null;
    if (!form) return f.opciones[p.id] || {};
    const variantes = {};
    I.VARIANTES.forEach(([, k]) => {
      const r = form.querySelector(`input[name="${k}"]:checked`);
      if (r) variantes[k] = r.value;
    });
    const c = form.elements.cantidad;
    return { variantes, cantidad: c ? I.leerContador(c) : 1 };
  }
  function guardarOpciones() {
    if (f.pieza) f.opciones[f.pieza.id] = opcionesDe(f.pieza);
  }
  function actualizarPedido() {
    const p = f.pieza;
    const a = p && $('[data-pedir]', dlg);
    if (a && I.enlaceWhatsApp(p)) a.href = I.enlaceWhatsApp(p, opcionesDe(p));
  }
  /* Si hay que elegir talla/color/material, lo pide antes de mandar el mensaje */
  function faltaVariante(p) {
    const form = $('[data-opciones]', dlg);
    if (!form) return false;
    for (const [lista, clave, et] of I.VARIANTES) {
      if (p[lista].length < 2 || form.querySelector(`input[name="${clave}"]:checked`)) continue;
      const fs = form.querySelector(`[data-variante="${clave}"]`);
      const texto = { Talla: 'elige una talla', Color: 'elige un color', Material: 'elige un material' }[et];
      fs.classList.remove('falta');
      void fs.offsetWidth;
      fs.classList.add('falta');
      $('.variante-falta', fs).textContent = ` · ${texto}`;
      fs.scrollIntoView({ block: 'center', behavior: reducido ? 'auto' : 'smooth' });
      I.vibrar(20);
      return true;
    }
    return false;
  }
  function pintarSeleccion() {
    const b = dlg.open && $('[data-seleccionar]', dlg);
    if (!b || !f.pieza) return;
    const on = window.Seleccion.tiene(f.pieza.id);
    b.classList.toggle('activo', on);
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
    b.innerHTML = `${on ? A.ICONOS.corazonLleno : A.ICONOS.corazon}<span>${on ? 'En tu selección' : 'Guardar en mi selección'}</span>`;
  }

  /* ================================================================
     GALERÍA
     ================================================================ */
  const pista = () => $('.vitrina-fotos', dlg);
  let fotoI = 0; // la foto elegida (aunque el deslizamiento vaya a medio camino)
  const fotoActual = () => fotoI;
  function marcarFoto(i) {
    $$('.miniatura', dlg).forEach((b, k) => {
      b.classList.toggle('activa', k === i);
      if (k === i) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    });
    const n = $('[data-foto-actual]', dlg);
    if (n) n.textContent = String(i + 1);
    const activa = $('.miniatura.activa', dlg);
    const fila = activa && activa.parentElement;
    if (fila && fila.scrollWidth > fila.clientWidth) fila.scrollTo({ left: activa.offsetLeft - fila.clientWidth / 2 + activa.offsetWidth / 2, behavior: reducido ? 'auto' : 'smooth' });
  }
  function irAFoto(i, suave = true) {
    const t = pista();
    if (!t) return;
    const total = t.children.length;
    i = (i + total) % total;
    fotoI = i;
    t.scrollTo({ left: i * t.clientWidth, behavior: suave && !reducido ? 'smooth' : 'auto' });
    marcarFoto(i);
  }
  function conectarGaleria() {
    fotoI = 0;
    const t = pista();
    if (!t || t.children.length < 2) return;
    let previa = 0, quieto = 0;
    t.addEventListener('scroll', () => {
      const i = Math.round(t.scrollLeft / Math.max(1, t.clientWidth));
      if (i !== previa) { previa = i; marcarFoto(i); }
      // al terminar de deslizar, esa es la foto elegida
      clearTimeout(quieto);
      quieto = setTimeout(() => { fotoI = Math.round(t.scrollLeft / Math.max(1, t.clientWidth)); marcarFoto(fotoI); }, 120);
    }, { passive: true });
  }

  /* ================================================================
     ABRIR / CERRAR
     ================================================================ */
  function abrir(p, { direccion = 0 } = {}) {
    const primera = !dlg.open;
    if (!primera && f.pieza && f.pieza.id === p.id) return; // ya está abierta (p. ej. al volver de cotizar)
    guardarOpciones();
    const origen = f.origen;
    f.origen = null;
    f.pieza = p;
    dlg.innerHTML = fichaHTML(p);
    I.prepararImagenes(dlg);
    window.Seleccion.pintarMarcas(dlg);
    pintarSeleccion();
    conectarGaleria();
    if (primera) {
      dlg.showModal();
      document.documentElement.classList.add('con-ficha');
      I.actualizarScroll();
    }
    $('.ficha-escena', dlg).focus({ preventScroll: true }); // (el teclado sigue en la ficha, sin marcar un botón)
    const marco = $('.vitrina-marco', dlg);
    if (reducido) return;
    if (primera && origen && origen.isConnected) {
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
    } else {
      $('.ficha-escena', dlg).animate([{ opacity: 0, transform: 'translateY(30px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: 'ease-out' });
    }
  }

  async function cerrar() {
    cerrarVisorYa();
    if (!dlg.open || dlg.classList.contains('cerrando')) return;
    guardarOpciones();
    dlg.classList.add('cerrando');
    await espera(reducido ? 0 : 200);
    dlg.close();
    dlg.classList.remove('cerrando');
    f.pieza = null;
    document.documentElement.classList.remove('con-ficha');
    I.actualizarScroll();
  }
  function cerrarYa() {
    cerrarVisorYa();
    if (dlg.open) { dlg.close(); dlg.classList.remove('cerrando'); }
    f.pieza = null;
    document.documentElement.classList.remove('con-ficha');
  }

  function siguientePieza(delta) {
    if (!f.pieza || f.lista.length < 2) return;
    const i = f.lista.indexOf(f.pieza.id);
    if (i < 0) return;
    const id = f.lista[(i + delta + f.lista.length) % f.lista.length];
    f.direccion = delta;
    I.navegar(`p/${id}`, { reemplazar: true });
    S.toque();
  }

  /* ---------- eventos de la ficha ---------- */
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); I.cerrarPiezaRuta(); });
  dlg.addEventListener('submit', (e) => e.preventDefault()); // (Enter en la cantidad no recarga la página)
  dlg.addEventListener('click', (e) => {
    const t = e.target, p = f.pieza;
    if (!p) return;
    if (t === dlg) { I.cerrarPiezaRuta(); return; }
    if (t.closest('[data-anterior]')) { siguientePieza(-1); return; }
    if (t.closest('[data-siguiente]')) { siguientePieza(1); return; }
    if (t.closest('[data-compartir]')) { I.compartir(p); return; }
    const mini = t.closest('[data-foto]');
    if (mini) { irAFoto(Number(mini.dataset.foto)); return; }
    const paso = t.closest('[data-foto-paso]');
    if (paso) { irAFoto(fotoActual() + Number(paso.dataset.fotoPaso)); return; }
    const ampliar = t.closest('[data-ampliar]');
    if (ampliar) {
      const i = ampliar.dataset.ampliar === 'actual' ? fotoActual() : Number(ampliar.dataset.ampliar);
      abrirVisor(p, i);
      return;
    }
    if (t.closest('[data-seleccionar]')) {
      const on = window.Seleccion.tiene(p.id);
      if (on) { window.Seleccion.quitarPieza(p.id); I.aviso('Quitada de tu selección'); return; }
      window.Seleccion.agregar(p.id, opcionesDe(p));
      I.vibrar(12);
      I.destellosEn(t.closest('[data-seleccionar]'), { n: 6, radio: 36 });
      S.tintineo(5);
      I.aviso(`♥ Guardada en tu selección (${window.Seleccion.cuenta()})`);
      return;
    }
    if (t.closest('[data-pedir]')) {
      if (p.estado !== 'agotado' && faltaVariante(p)) { e.preventDefault(); e.stopPropagation(); return; }
      actualizarPedido();
      return;
    }
    if (t.closest('[data-cotizar]')) guardarOpciones();
  });
  dlg.addEventListener('input', (e) => {
    if (!e.target.closest('[data-opciones]')) return;
    const fs = e.target.closest('.variante.falta');
    if (fs) { fs.classList.remove('falta'); const m = $('.variante-falta', fs); if (m) m.textContent = ''; }
    guardarOpciones();
    actualizarPedido();
  });
  dlg.addEventListener('change', (e) => { if (e.target.closest('[data-opciones]')) { guardarOpciones(); actualizarPedido(); } });
  dlg.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.target.closest('input, textarea, select')) return;
    const enFotos = e.target.closest('.vitrina-fotos');
    if (enFotos && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      e.preventDefault();
      irAFoto(fotoActual() + (e.key === 'ArrowRight' ? 1 : -1));
      return;
    }
    if (enFotos && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); if (f.pieza.fotos.length) abrirVisor(f.pieza, fotoActual()); return; }
    if (e.key === 'ArrowRight') siguientePieza(1);
    if (e.key === 'ArrowLeft') siguientePieza(-1);
  });
  // la vitrina se inclina con el mouse (y con el teléfono en Android)
  dlg.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || reducido || I.ligero.activo) return;
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
    if (!dlg.open || e.gamma == null || reducido || I.ligero.activo || visor.open) return;
    const m = $('.vitrina-marco', dlg);
    if (!m) return;
    const x = Math.max(-1, Math.min(1, e.gamma / 25)), y = Math.max(-1, Math.min(1, (e.beta - 45) / 30));
    m.style.transform = `perspective(1000px) rotateY(${(x * 7).toFixed(2)}deg) rotateX(${(-y * 5).toFixed(2)}deg)`;
    m.style.setProperty('--bx', `${((x + 1) * 50).toFixed(1)}%`);
    m.style.setProperty('--by', `${((y + 1) * 50).toFixed(1)}%`);
  });
  // recordar la tarjeta tocada (para que la pieza "vuele" desde ahí)
  document.addEventListener('click', (e) => {
    const t = e.target.closest('.tarjeta');
    if (t) f.origen = $('.marco', t);
  }, true);

  /* ================================================================
     VISOR · la foto en grande, con zoom
     ================================================================ */
  const visor = $('#visor');
  const V = { fotos: [], nombre: '', i: 0, s: 1, x: 0, y: 0, punteros: new Map(), gesto: null, toque: 0 };
  visor.innerHTML = `
    <div class="visor-escenario" data-escenario>
      <div class="visor-lienzo"><img class="visor-img" alt="" draggable="false"></div>
    </div>
    <header class="visor-barra">
      <span class="visor-cuenta" aria-live="polite"></span>
      <div class="visor-botones">
        <button class="boton-icono" type="button" data-zoom="-1" aria-label="Alejar">${A.ICONOS.zoomMenos}</button>
        <button class="boton-icono" type="button" data-zoom="1" aria-label="Acercar">${A.ICONOS.zoom}</button>
        <button class="boton-icono" type="button" data-cerrar-visor aria-label="Cerrar la foto">${A.ICONOS.cerrar}</button>
      </div>
    </header>
    <button class="visor-flecha anterior" type="button" data-visor-paso="-1" aria-label="Foto anterior">${A.ICONOS.volver}</button>
    <button class="visor-flecha siguiente" type="button" data-visor-paso="1" aria-label="Foto siguiente">${A.ICONOS.siguiente}</button>
    <p class="visor-pista" aria-hidden="true">pellizca o toca dos veces para acercar</p>`;
  const escenario = $('[data-escenario]', visor), lienzo = $('.visor-lienzo', visor), img = $('.visor-img', visor);
  img.addEventListener('load', () => img.classList.add('cargada'));
  img.addEventListener('error', () => {
    const alterna = D.urlImagenAlterna(V.fotos[V.i], 1600);
    if (alterna && img.src !== alterna) img.src = alterna;
  });

  function abrirVisor(p, i) {
    if (!p.fotos.length) return;
    V.fotos = p.fotos;
    V.nombre = p.nombre;
    visor.classList.toggle('una', V.fotos.length < 2);
    mostrarFoto(i, 0);
    if (!visor.open) visor.showModal();
    let vista = false;
    try { vista = sessionStorage.getItem('inluna:visor') === '1'; sessionStorage.setItem('inluna:visor', '1'); } catch (e) { /* nada */ }
    visor.classList.toggle('con-pista', !vista);
    S.toque();
  }
  function cerrarVisor() {
    if (!visor.open) return;
    const i = V.i;
    visor.close();
    if (dlg.open) irAFoto(i, false);
  }
  function cerrarVisorYa() { if (visor.open) visor.close(); }

  function mostrarFoto(i, dir) {
    V.i = (i + V.fotos.length) % V.fotos.length;
    V.s = 1; V.x = 0; V.y = 0;
    img.classList.remove('cargada');
    img.src = D.urlImagen(V.fotos[V.i], 2000);
    img.alt = `${V.nombre} · foto ${V.i + 1}`;
    aplicar(false);
    $('.visor-cuenta', visor).textContent = V.fotos.length > 1 ? `${V.i + 1} / ${V.fotos.length}` : V.nombre;
    lienzo.style.transition = 'none';
    lienzo.style.transform = '';
    if (dir && !reducido) lienzo.animate([{ opacity: 0, transform: `translateX(${dir * 60}px)` }, { opacity: 1, transform: 'none' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function cambiar(delta) {
    if (V.fotos.length < 2) return;
    mostrarFoto(V.i + delta, delta);
    S.toque();
  }

  function aplicar(animado) {
    img.style.transition = animado && !reducido ? 'transform .28s cubic-bezier(.2,.8,.2,1), opacity .25s ease' : 'opacity .25s ease';
    img.style.transform = `translate3d(${V.x.toFixed(1)}px,${V.y.toFixed(1)}px,0) scale(${V.s.toFixed(3)})`;
    visor.classList.toggle('ampliado', V.s > 1.01);
  }
  // cuánto se puede mover la foto sin que se vean huecos
  function limites() {
    const r = escenario.getBoundingClientRect();
    const nw = img.naturalWidth || r.width, nh = img.naturalHeight || r.height;
    const k = Math.min(r.width / nw, r.height / nh);
    return { r, mx: Math.max(0, (nw * k * V.s - r.width) / 2), my: Math.max(0, (nh * k * V.s - r.height) / 2) };
  }
  function acotar() {
    const { mx, my } = limites();
    V.x = Math.max(-mx, Math.min(mx, V.x));
    V.y = Math.max(-my, Math.min(my, V.y));
  }
  // acerca manteniendo quieto el punto que está bajo el dedo (cx, cy)
  function zoomEn(s, cx, cy) {
    const { r } = limites();
    s = Math.max(1, Math.min(5, s));
    const ox = cx - (r.left + r.width / 2), oy = cy - (r.top + r.height / 2);
    V.x = ox - (ox - V.x) * (s / V.s);
    V.y = oy - (oy - V.y) * (s / V.s);
    V.s = s;
    if (s <= 1.001) { V.s = 1; V.x = 0; V.y = 0; }
    acotar();
  }
  function zoomCentro(factor) {
    const r = escenario.getBoundingClientRect();
    zoomEn(V.s * factor, r.left + r.width / 2, r.top + r.height / 2);
    aplicar(true);
  }

  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) || 1;
  const medio = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  escenario.addEventListener('pointerdown', (e) => {
    if (e.button > 0) return;
    try { escenario.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
    V.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    visor.classList.remove('con-pista');
    if (V.punteros.size === 2) {
      const [a, b] = [...V.punteros.values()];
      V.gesto = { tipo: 'pellizco', d0: dist(a, b), s0: V.s, m0: medio(a, b), x0: V.x, y0: V.y };
      lienzo.style.transform = '';
    } else if (V.punteros.size === 1) {
      V.gesto = { tipo: 'arrastre', x0: e.clientX, y0: e.clientY, tx: V.x, ty: V.y, movio: false };
    }
  });
  escenario.addEventListener('pointermove', (e) => {
    if (!V.punteros.has(e.pointerId)) return;
    V.punteros.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = V.gesto;
    if (!g) return;
    if (g.tipo === 'pellizco' && V.punteros.size >= 2) {
      const [a, b] = [...V.punteros.values()];
      const m = medio(a, b), { r } = limites();
      const s = Math.max(1, Math.min(5, g.s0 * dist(a, b) / g.d0));
      const ox = g.m0.x - (r.left + r.width / 2), oy = g.m0.y - (r.top + r.height / 2);
      V.x = ox - (ox - g.x0) * (s / g.s0) + (m.x - g.m0.x);
      V.y = oy - (oy - g.y0) * (s / g.s0) + (m.y - g.m0.y);
      V.s = s;
      acotar();
      aplicar(false);
    } else if (g.tipo === 'arrastre') {
      const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
      if (Math.abs(dx) + Math.abs(dy) > 6) g.movio = true;
      if (V.s > 1.01) {
        V.x = g.tx + dx;
        V.y = g.ty + dy;
        acotar();
        aplicar(false);
      } else if (g.movio) {
        // sin zoom: la foto sigue al dedo (a los lados cambia, hacia abajo se cierra)
        const baja = dy > 0 && Math.abs(dy) > Math.abs(dx);
        lienzo.style.transition = 'none';
        lienzo.style.transform = baja ? `translate3d(0,${dy}px,0) scale(${Math.max(0.85, 1 - dy / 1400).toFixed(3)})` : `translate3d(${dx}px,0,0)`;
        visor.style.setProperty('--velo', String(baja ? Math.max(0.35, 1 - dy / 500) : 1));
      }
    }
  });
  function soltar(e) {
    if (!V.punteros.has(e.pointerId)) return;
    V.punteros.delete(e.pointerId);
    const g = V.gesto;
    if (!g) return;
    if (g.tipo === 'pellizco') {
      if (V.punteros.size === 1) {
        const [q] = [...V.punteros.values()];
        V.gesto = { tipo: 'arrastre', x0: q.x, y0: q.y, tx: V.x, ty: V.y, movio: true };
      } else V.gesto = null;
      if (V.s < 1.06) { V.s = 1; V.x = 0; V.y = 0; aplicar(true); }
      return;
    }
    if (V.punteros.size) return;
    V.gesto = null;
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    visor.style.removeProperty('--velo');
    if (V.s <= 1.01 && g.movio) {
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) && V.fotos.length > 1) { cambiar(dx < 0 ? 1 : -1); return; }
      if (dy > 110 && Math.abs(dy) > Math.abs(dx)) { cerrarVisor(); return; }
      lienzo.style.transition = 'transform .25s cubic-bezier(.2,.8,.2,1)';
      lienzo.style.transform = '';
      return;
    }
    if (!g.movio && e.type === 'pointerup') {
      // doble toque: acerca (o regresa)
      const ahora = performance.now();
      if (ahora - V.toque < 320) {
        V.toque = 0;
        zoomEn(V.s > 1.01 ? 1 : 2.6, e.clientX, e.clientY);
        aplicar(true);
      } else V.toque = ahora;
    }
  }
  escenario.addEventListener('pointerup', soltar);
  escenario.addEventListener('pointercancel', soltar);
  escenario.addEventListener('wheel', (e) => {
    e.preventDefault();
    const k = e.deltaMode === 1 ? 40 : 1;
    zoomEn(V.s * Math.exp(-e.deltaY * k * 0.0022), e.clientX, e.clientY);
    aplicar(false);
  }, { passive: false });
  visor.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-cerrar-visor]')) { cerrarVisor(); return; }
    const z = t.closest('[data-zoom]');
    if (z) { zoomCentro(Number(z.dataset.zoom) > 0 ? 1.7 : 1 / 1.7); return; }
    const pasoV = t.closest('[data-visor-paso]');
    if (pasoV) cambiar(Number(pasoV.dataset.visorPaso));
  });
  visor.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); cambiar(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); cambiar(-1); }
    if (e.key === '+' || e.key === '=') { e.preventDefault(); zoomCentro(1.7); }
    if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomCentro(1 / 1.7); }
    if (e.key === '0') { V.s = 1; V.x = 0; V.y = 0; aplicar(true); }
  });
  visor.addEventListener('cancel', (e) => { e.preventDefault(); cerrarVisor(); });
  window.addEventListener('resize', () => { if (visor.open) { acotar(); aplicar(false); } });

  window.Ficha = {
    abrir, cerrar, cerrarYa, ponerLista, pintarSeleccion, opcionesDe,
    abierta: () => dlg.open,
    actual: () => f.pieza,
    direccion() { const d = f.direccion || 0; f.direccion = 0; return d; },
  };
})();
