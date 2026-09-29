/* ==================================================================
   catalogo.js · Arranque del catálogo y navegación
   Cargador (logo girando) → el logo vuela junto al nombre → fachada
   interactiva → galería de arcos → colección → pieza.
   La fachada es siempre el inicio: se entra por la puerta y se sale
   por ella (con "atrás", con el botón «salir» o al volver de mandar
   tu pedido por WhatsApp), y se puede volver a entrar cuando quieras.
   Rutas: (vacía) fachada · #taller · #c/coleccion · #p/pieza · #contacto
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, D = window.Datos, A = window.Arte;
  const { $, espera, reducido, estado } = I;
  const Fachada = window.Fachada, Taller = window.Taller;
  const CLAVE_PEDIDO = 'inluna:pedido';
  let dentro = false, saliendo = false, pedidoPendiente = false, seFue = false;

  const datosFachada = () => ({ nombre: estado.ajustes.nombre, antes: estado.ajustes.antesDelNombre, onEntrar: entrarAlTaller });

  async function iniciar() {
    const t0 = performance.now();
    let ruta = leerRuta();
    const pedido = leerPedido();
    // volviste después de mandar tu pedido, o recargaste dentro del taller:
    // se empieza otra vez desde la fachada
    if (pedido || ruta.tipo === 'taller') {
      if (pedido) borrarPedido();
      limpiarRuta();
      ruta = { tipo: 'fachada' };
    }
    const saltarEntrada = ruta.tipo !== 'fachada';

    if (!saltarEntrada) Fachada.construir(datosFachada());

    const fuentes = document.fonts
      ? Promise.race([Promise.all([
        document.fonts.load('italic 500 40px Fraunces'), document.fonts.load('500 16px Fraunces'),
        document.fonts.load('400 16px "Klee One"'), document.fonts.load('600 16px "Klee One"'),
      ]).catch(() => {}), espera(2200)])
      : Promise.resolve();

    const carga = D.cargar();
    let datos = carga.inmediato;
    if (datos) {
      carga.fresco.then(actualizar).catch((e) => console.warn('[Inluna] Usando la copia guardada:', e.message));
    } else {
      try { datos = await carga.fresco; } catch (e) { errorCarga(e); return; }
    }
    await fuentes;
    I.aplicarDatos(datos);
    Fachada.ponerNombre(estado.ajustes.nombre, estado.ajustes.antesDelNombre);

    const minimo = reducido ? 250 : saltarEntrada ? 900 : 1400;
    const pasado = performance.now() - t0;
    if (pasado < minimo) await espera(minimo - pasado);

    estado.listo = true;
    I.botonSonido();
    if (saltarEntrada) {
      await quitarCargador();
      mostrarTaller();
    } else {
      await cargadorAlFronton();
      Fachada.animar();
      if (pedido) Fachada.nota(true);
    }
  }

  function actualizar(nuevos) {
    if (JSON.stringify([estado.productos, estado.ajustes]) === JSON.stringify([nuevos.productos, nuevos.ajustes])) return;
    I.aplicarDatos(nuevos);
    Fachada.ponerNombre(estado.ajustes.nombre, estado.ajustes.antesDelNombre);
    if (!$('#taller').hidden) Taller.refrescar();
  }

  /* ---------- cargador ---------- */
  function esperarReposo(svg) {
    // espera a que las hojas terminen su sexto de vuelta (así no "saltan":
    // cada 60° el logo se ve igual que quieto)
    const g = svg.querySelector('.hojas-logo');
    const a = g && g.getAnimations ? g.getAnimations().find((x) => x.animationName === 'girar-hojas') : null;
    if (!a || a.currentTime == null) return Promise.resolve();
    const tm = a.effect.getTiming();
    const t = a.currentTime - (tm.delay || 0);
    if (t < 0) return Promise.resolve();
    const paso = tm.duration / 6, fase = t % paso;
    return espera(fase < 30 ? 0 : paso - fase + 20);
  }

  async function cargadorAlFronton() {
    const cargador = $('#cargador'), logo = $('.logo-giro', cargador), destino = Fachada.logo();
    Fachada.mostrar();
    if (reducido || !destino) {
      if (destino) destino.classList.add('visible');
      await quitarCargador();
      return;
    }
    await esperarReposo(logo);
    logo.classList.add('quieto');
    const a = logo.getBoundingClientRect(), b = destino.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    cargador.classList.add('transparente');
    logo.style.transition = 'transform .8s cubic-bezier(.7,0,.2,1)';
    logo.getBoundingClientRect();
    logo.style.transform = `translate(${dx}px, ${dy}px) scale(${b.width / a.width})`;
    await espera(820);
    destino.classList.add('visible');
    cargador.remove();
  }

  async function quitarCargador() {
    const c = $('#cargador');
    if (!c) return;
    c.style.transition = 'opacity .35s ease';
    c.style.opacity = '0';
    await espera(360);
    c.remove();
  }

  function errorCarga(err) {
    console.error('[Inluna]', err);
    const c = $('#cargador');
    if (!c) return;
    const a = D.mezclarAjustes({});
    $('.logo-giro', c).classList.add('quieto');
    $('.cargador-texto', c).hidden = true;
    const caja = document.createElement('div');
    caja.className = 'cargador-error';
    caja.innerHTML = `<h2>No pudimos abrir el taller</h2><p>Revisa tu conexión e inténtalo de nuevo.</p>
      <div class="fila-botones"><button class="boton boton-tinta" type="button" data-reintentar>Reintentar</button>
      ${a.instagram ? `<a class="boton" href="https://instagram.com/${encodeURIComponent(a.instagram)}">${A.ICONOS.instagram}<span>Instagram</span></a>` : ''}</div>`;
    $('.cargador-centro', c).appendChild(caja);
    $('[data-reintentar]', caja).addEventListener('click', () => location.reload());
  }

  /* ---------- entrar y salir del taller ---------- */
  function entrarAlTaller() {
    // al cruzar la puerta queda una entrada en el historial: "atrás" te saca
    if (leerRuta().tipo === 'fachada') history.pushState({ inluna: true, desdeFachada: true }, '', '#taller');
    mostrarTaller();
  }

  function mostrarTaller() {
    const t = $('#taller');
    t.hidden = false;
    dentro = true;
    Taller.construir();
    rutear();
  }

  // cuando la fachada ya lo tapa, el interior se guarda (queda listo para volver)
  function guardarTaller() {
    Taller.cerrarTodo();
    $('#taller').hidden = true;
    dentro = false;
  }

  async function salirDelTaller({ gracias = false } = {}) {
    if (!dentro || saliendo) return;
    saliendo = true;
    Taller.cerrarDialogos(); // los diálogos van por encima de todo: se cierran antes
    try {
      await Fachada.salir(Object.assign(datosFachada(), { gracias, alCubrir: guardarTaller }));
    } finally {
      saliendo = false;
    }
  }

  function salirPorLaPuerta() {
    if (history.state && history.state.desdeFachada && leerRuta().tipo === 'taller') history.back();
    else navegar('');
  }

  /* ---------- pedido por WhatsApp: al volver, sales del taller ---------- */
  function marcarPedido() {
    pedidoPendiente = true;
    seFue = false;
    try { sessionStorage.setItem(CLAVE_PEDIDO, String(Date.now())); } catch (e) { /* nada */ }
  }
  function leerPedido() {
    try {
      const t = Number(sessionStorage.getItem(CLAVE_PEDIDO));
      return !!t && Date.now() - t < 12 * 3600 * 1000;
    } catch (e) { return false; }
  }
  function borrarPedido() {
    pedidoPendiente = false;
    try { sessionStorage.removeItem(CLAVE_PEDIDO); } catch (e) { /* nada */ }
  }
  function alVolver() {
    if (!pedidoPendiente || !seFue || document.visibilityState !== 'visible') return;
    borrarPedido();
    if (!dentro || !estado.listo) { Fachada.nota(true); return; }
    setTimeout(() => {
      limpiarRuta(); // la fachada es el inicio
      salirDelTaller({ gracias: true });
    }, 350);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') { if (pedidoPendiente) seFue = true; return; }
    alVolver();
  });
  window.addEventListener('pageshow', (e) => { if (e.persisted && pedidoPendiente) { seFue = true; alVolver(); } });

  /* ================================================================
     NAVEGACIÓN
     ================================================================ */
  function leerRuta() {
    let h = location.hash.replace(/^#\/?/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* nada */ }
    if (h.startsWith('p/')) return { tipo: 'pieza', id: h.slice(2) };
    if (h.startsWith('c/')) return { tipo: 'coleccion', slug: h.slice(2) };
    if (h === 'contacto') return { tipo: 'contacto' };
    if (h === 'taller') return { tipo: 'taller' };
    return { tipo: 'fachada' };
  }
  const limpiarRuta = () => history.replaceState(null, '', location.pathname + location.search);

  function navegar(hash, { reemplazar = false } = {}) {
    const url = hash ? `#${hash}` : location.pathname + location.search;
    if (reemplazar) history.replaceState(history.state, '', url);
    else history.pushState({ inluna: true }, '', url);
    rutear();
  }

  function rutaPadre() {
    const r = leerRuta();
    if (r.tipo === 'pieza' && Taller.coleccionActual()) return `c/${Taller.coleccionActual()}`;
    return 'taller';
  }
  function volver() {
    if (history.state && history.state.inluna) history.back();
    else navegar(rutaPadre(), { reemplazar: true });
  }
  function cerrarPiezaRuta() {
    if (leerRuta().tipo !== 'pieza') { Taller.cerrarPieza(); return; }
    volver();
  }

  async function rutear() {
    if (!estado.listo) return;
    const r = leerRuta();
    if (r.tipo === 'fachada') {
      if (dentro) salirDelTaller();
      return;
    }
    if (!dentro) {
      if (saliendo) return;
      // "adelante" desde la fachada: se vuelve a entrar por la puerta
      if (Fachada.activa()) Fachada.entrar();
      else mostrarTaller();
      return;
    }
    if (r.tipo !== 'contacto') Taller.cerrarContacto();
    if (r.tipo === 'contacto') {
      await Taller.cerrarPieza();
      Taller.abrirContacto();
      return;
    }
    if (r.tipo === 'pieza') {
      const p = estado.productos.find((x) => x.id === r.id);
      if (!p) { I.aviso('Esa pieza ya no está en el catálogo.'); navegar('taller', { reemplazar: true }); return; }
      if (!Taller.coleccionAbierta()) Taller.mostrarColeccion(D.slug(p.categoria || 'Piezas'));
      Taller.abrirPieza(p, { direccion: Taller.direccion() });
      return;
    }
    await Taller.cerrarPieza();
    if (r.tipo === 'coleccion') {
      if (!Taller.mostrarColeccion(r.slug)) navegar('taller', { reemplazar: true });
    } else {
      await Taller.cerrarColeccion();
    }
  }

  document.addEventListener('click', (e) => {
    const wa = e.target.closest('[data-wa]');
    if (wa && !estado.ajustes.whatsapp) {
      e.preventDefault();
      I.aviso(D.modoPrueba ? 'Modo de prueba: agrega tu WhatsApp en el panel → Ajustes.' : 'Por ahora escríbeme por Instagram.');
      return;
    }
    if (wa) { marcarPedido(); return; } // se abre WhatsApp; al volver, sales del taller
    if (e.target.closest('[data-salir]')) { e.preventDefault(); salirPorLaPuerta(); return; }
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    if (a.hasAttribute('data-volver')) { volver(); return; }
    navegar(a.getAttribute('href').slice(1), { reemplazar: a.hasAttribute('data-reemplazar') });
  });
  window.addEventListener('popstate', rutear);

  Object.assign(I, { navegar, volver, cerrarPiezaRuta, leerRuta });
  iniciar().catch((e) => { console.error(e); errorCarga(e); });
})();
