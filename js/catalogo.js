/* ==================================================================
   catalogo.js · Arranque del catálogo y navegación
   Cargador (logo girando) → el logo vuela al frontón → fachada
   interactiva → galería de arcos → colección → pieza.
   Rutas: #c/coleccion · #p/pieza · #contacto (el botón "atrás" funciona)
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, D = window.Datos, A = window.Arte;
  const { $, espera, reducido, estado } = I;
  const Fachada = window.Fachada, Taller = window.Taller;

  async function iniciar() {
    const t0 = performance.now();
    const ruta = leerRuta();
    let yaEntro = false;
    try { yaEntro = sessionStorage.getItem('inluna:entro') === '1'; } catch (e) { /* nada */ }
    const saltarEntrada = ruta.tipo !== 'inicio' || yaEntro;

    if (!saltarEntrada) {
      Fachada.construir({
        nombre: estado.ajustes.nombre,
        antes: estado.ajustes.antesDelNombre,
        onEntrar() {
          try { sessionStorage.setItem('inluna:entro', '1'); } catch (e) { /* nada */ }
          mostrarTaller();
        },
      });
    }

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
    // espera a que los tres triángulos terminen su vuelta (así no "saltan")
    const tris = svg.querySelectorAll('.tri');
    const anim = (el) => (el && el.getAnimations ? el.getAnimations().find((a) => a.animationName === 'girar') : null);
    const a0 = anim(tris[0]), a2 = anim(tris[tris.length - 1]);
    if (!a0 || a0.currentTime == null) return Promise.resolve();
    const t0 = a0.effect.getTiming(), t2 = a2 ? a2.effect.getTiming() : t0;
    const t = a0.currentTime - (t0.delay || 0);
    if (t < 0) return Promise.resolve();
    const fase = t % t0.duration;
    const reposo = t0.duration / 2 + ((t2.delay || 0) - (t0.delay || 0)) + 40;
    return espera(fase < reposo ? reposo - fase : 0);
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

  function mostrarTaller() {
    const t = $('#taller');
    if (!t.hidden) return;
    t.hidden = false;
    Taller.construir();
    rutear();
  }

  /* ================================================================
     NAVEGACIÓN
     ================================================================ */
  function leerRuta() {
    let h = location.hash.replace(/^#\/?/, '');
    try { h = decodeURIComponent(h); } catch (e) { /* nada */ }
    if (h.startsWith('p/')) return { tipo: 'pieza', id: h.slice(2) };
    if (h.startsWith('c/')) return { tipo: 'coleccion', slug: h.slice(2) };
    if (h === 'contacto') return { tipo: 'contacto' };
    return { tipo: 'inicio' };
  }

  function navegar(hash, { reemplazar = false } = {}) {
    const url = hash ? `#${hash}` : location.pathname + location.search;
    if (reemplazar) history.replaceState(history.state, '', url);
    else history.pushState({ inluna: true }, '', url);
    rutear();
  }

  function rutaPadre() {
    const r = leerRuta();
    if (r.tipo === 'pieza' && Taller.coleccionActual()) return `c/${Taller.coleccionActual()}`;
    return '';
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
    if (!estado.listo || $('#taller').hidden) return;
    const r = leerRuta();
    if (r.tipo !== 'contacto') Taller.cerrarContacto();
    if (r.tipo === 'contacto') {
      await Taller.cerrarPieza();
      Taller.abrirContacto();
      return;
    }
    if (r.tipo === 'pieza') {
      const p = estado.productos.find((x) => x.id === r.id);
      if (!p) { I.aviso('Esa pieza ya no está en el catálogo.'); navegar('', { reemplazar: true }); return; }
      if (!Taller.coleccionAbierta()) Taller.mostrarColeccion(D.slug(p.categoria || 'Piezas'));
      Taller.abrirPieza(p, { direccion: Taller.direccion() });
      return;
    }
    await Taller.cerrarPieza();
    if (r.tipo === 'coleccion') {
      if (!Taller.mostrarColeccion(r.slug)) navegar('', { reemplazar: true });
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
