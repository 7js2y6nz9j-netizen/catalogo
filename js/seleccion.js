/* ==================================================================
   seleccion.js · «Mi selección»
   ------------------------------------------------------------------
   La clienta marca con ♡ las piezas que le gustan (en las tarjetas o
   en la ficha, con su talla, color, material y cantidad). Todas se
   juntan aquí y se mandan en UN solo mensaje de WhatsApp.
   Se guarda en su teléfono (localStorage), así la encuentra al volver.
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, D = window.Datos;
  const { $, $$, esc, espera, reducido, estado } = I;
  const CLAVE = 'inluna:seleccion:v1';
  const dlg = $('#seleccion');
  let items = leer(); // [{ id, variantes: { talla, color, material }, cantidad, t }]
  let nota = '';

  function leer() {
    try {
      const v = JSON.parse(localStorage.getItem(CLAVE));
      if (Array.isArray(v)) {
        return v.filter((x) => x && typeof x.id === 'string').map((x) => ({
          id: x.id, variantes: Object.assign({}, x.variantes), cantidad: Math.max(1, Math.floor(Number(x.cantidad)) || 1), t: x.t || 0,
        }));
      }
    } catch (e) { /* nada */ }
    return [];
  }
  function guardar() {
    try { localStorage.setItem(CLAVE, JSON.stringify(items)); } catch (e) { /* sin espacio */ }
    pintarMarcas();
  }
  const firma = (id, v) => `${id}|${I.textoVariantes(v)}`;
  const piezaDe = (id) => estado.productos.find((p) => p.id === id);
  // (solo cuentan las piezas que siguen en el catálogo)
  const vigentes = () => (estado.listo ? items.filter((x) => piezaDe(x.id)) : items);
  const cuenta = () => vigentes().length;
  const tiene = (id) => items.some((x) => x.id === id);

  function agregar(id, { variantes = {}, cantidad = 1 } = {}) {
    const limpias = {};
    I.VARIANTES.forEach(([, k]) => { if (variantes[k]) limpias[k] = variantes[k]; });
    const k = firma(id, limpias);
    const ya = items.find((x) => firma(x.id, x.variantes) === k);
    if (ya) ya.cantidad = Math.max(ya.cantidad, cantidad);
    else {
      // si la misma pieza estaba sin elegir talla/color, ahora queda con lo elegido
      const sinElegir = items.find((x) => x.id === id && !I.textoVariantes(x.variantes));
      if (sinElegir && I.textoVariantes(limpias)) Object.assign(sinElegir, { variantes: limpias, cantidad: Math.max(sinElegir.cantidad, cantidad) });
      else items.push({ id, variantes: limpias, cantidad, t: Date.now() });
    }
    guardar();
  }
  function quitarPieza(id) { items = items.filter((x) => x.id !== id); guardar(); }
  function alternar(id, opciones) {
    if (tiene(id)) { quitarPieza(id); return false; }
    agregar(id, opciones);
    return true;
  }

  /* ---------- corazones y contadores en toda la página ---------- */
  function corazonHTML(p, clase = '') {
    return `<button type="button" class="corazon ${clase}" data-corazon="${esc(p.id)}" aria-pressed="false" aria-label="Guardar ${esc(p.nombre)} en mi selección">${A.ICONOS.corazon}</button>`;
  }
  function pintarMarcas(raiz = document) {
    $$('[data-corazon]', raiz).forEach((b) => {
      const on = tiene(b.dataset.corazon);
      if (b.classList.contains('activo') === on && b.firstElementChild) return;
      b.classList.toggle('activo', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      b.innerHTML = on ? A.ICONOS.corazonLleno : A.ICONOS.corazon;
    });
    const n = cuenta();
    $$('[data-cuenta-seleccion]').forEach((el) => { el.textContent = n ? String(n) : ''; el.hidden = !n; });
    if (window.Ficha) window.Ficha.pintarSeleccion();
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-corazon]');
    if (!b) return;
    e.preventDefault();
    e.stopPropagation();
    const on = alternar(b.dataset.corazon);
    I.vibrar(on ? 12 : 6);
    if (on) {
      I.destellosEn(b, { n: 6, radio: 30 });
      if (window.Sonido) window.Sonido.tintineo(5);
      b.animate && !reducido && b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.3)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'ease-out' });
    }
    I.aviso(on ? `♥ Guardada en tu selección (${cuenta()})` : 'Quitada de tu selección');
  });

  /* ---------- la hoja «Mi selección» ---------- */
  function precioUnidad(p) {
    const r = D.rangoPrecio(p.precio);
    return r && r.min === r.max ? r.min : null;
  }
  const formato = (n) => D.formatoPrecio(n, estado.ajustes.moneda);

  function totales() {
    let total = 0, porCotizar = 0;
    vigentes().forEach((x) => {
      const u = precioUnidad(piezaDe(x.id));
      if (u == null) porCotizar++; else total += u * x.cantidad;
    });
    return { total, porCotizar };
  }

  function mensaje() {
    const lista = vigentes();
    const lineas = ['¡Hola! Me interesan estas piezas de tu catálogo:', ''];
    lista.forEach((x, i) => {
      const p = piezaDe(x.id);
      const pr = I.precio(p);
      lineas.push(`${i + 1}. ${p.nombre}${pr ? ` — ${pr}` : ''}`);
      const detalle = [I.textoVariantes(x.variantes), `Cantidad: ${x.cantidad}`].filter(Boolean).join(' · ');
      lineas.push(`   ${detalle}`);
      const falta = I.VARIANTES.filter(([lista, k]) => p[lista].length > 1 && !x.variantes[k]).map(([, , et]) => et.toLowerCase());
      if (falta.length) lineas.push(`   (${falta.join(' y ')} por definir)`);
      lineas.push(`   ${I.enlacePieza(p)}`);
    });
    const { total, porCotizar } = totales();
    if (total) lineas.push('', `Total aproximado: ${formato(total)}${porCotizar ? ` + ${porCotizar === 1 ? '1 pieza' : `${porCotizar} piezas`} por cotizar` : ''}`);
    if (nota.trim()) lineas.push('', `Nota: ${nota.trim()}`);
    return lineas.join('\n');
  }

  function itemHTML(x, i) {
    const p = piezaDe(x.id);
    const pr = I.precio(p);
    const selects = I.VARIANTES.filter(([lista]) => p[lista].length > 1).map(([lista, k, et]) =>
      `<label class="sel-variante"><span>${et}</span><select data-item="${i}" data-var="${k}">
        <option value="">Elegir…</option>${p[lista].map((v) => `<option${x.variantes[k] === v ? ' selected' : ''}>${esc(v)}</option>`).join('')}
      </select></label>`).join('');
    const unica = I.VARIANTES.filter(([lista]) => p[lista].length === 1).map(([lista, , et]) => `${et}: ${esc(p[lista][0])}`).join(' · ');
    return `<li class="sel-item" style="--i:${i}">
      <a class="sel-foto" href="#p/${encodeURIComponent(p.id)}">${window.Taller.imagenCatalogo(p, 200)}</a>
      <div class="sel-datos">
        <a class="sel-nombre" href="#p/${encodeURIComponent(p.id)}">${esc(p.nombre)}</a>
        <p class="sel-precio">${pr ? esc(pr) : ''}${p.estado !== 'disponible' ? `<span class="estado ${p.estado}">${I.textoEstado(p)}</span>` : ''}</p>
        ${unica ? `<p class="sel-fija">${unica}</p>` : ''}
        ${selects ? `<div class="sel-variantes">${selects}</div>` : ''}
        <div class="sel-controles">
          ${I.contadorHTML(`cantidad-${i}`, x.cantidad, Math.max(1, p.minimo || 1))}
          <button type="button" class="enlace-suave sel-quitar" data-quitar="${i}">Quitar</button>
        </div>
      </div>
    </li>`;
  }

  function render() {
    const lista = vigentes();
    if (lista.length !== items.length && estado.listo) { items = lista; guardar(); }
    const wa = I.enlaceWhatsAppTexto(mensaje());
    const { total, porCotizar } = totales();
    const cuerpo = lista.length ? `
      <ul class="sel-lista">${lista.map(itemHTML).join('')}</ul>
      <p class="sel-total">${total ? `Total aproximado: <strong>${esc(formato(total))}</strong>` : 'Te comparto el precio por mensaje.'}
        ${total && porCotizar ? `<span>+ ${porCotizar === 1 ? '1 pieza' : `${porCotizar} piezas`} por cotizar</span>` : ''}</p>
      <label class="campo-cat">
        <span class="campo-cat-etiqueta">¿Algo más que quieras contarme? <small>(opcional)</small></span>
        <textarea data-nota rows="2" placeholder="Ej. Es para regalo · lo necesito para el viernes">${esc(nota)}</textarea>
      </label>`
      : `<div class="sel-vacia">
        <span class="sel-vacia-icono">${A.ICONOS.corazon}</span>
        <p><strong>Aún no guardas ninguna pieza.</strong></p>
        <p>Toca el ♡ de las piezas que te gusten: aquí se juntan para pedirlas todas en un solo mensaje.</p>
        <a class="boton" href="#buscar" data-reemplazar>${A.ICONOS.buscar}<span>Buscar piezas</span></a>
      </div>`;
    const pie = lista.length ? `
      <footer class="hoja-pie">
        ${wa ? `<a class="boton boton-tinta boton-ancho" href="${esc(wa)}" target="_blank" rel="noopener" data-wa data-enviar-seleccion>${A.ICONOS.whatsapp}<span>Enviar mi selección por WhatsApp</span></a>`
          : `<button class="boton boton-tinta boton-ancho" type="button" data-copiar-seleccion>${A.ICONOS.mensaje}<span>Copiar mi lista</span></button>`}
        <button class="enlace-suave" type="button" data-vaciar>Vaciar mi selección</button>
      </footer>` : '';
    dlg.innerHTML = `<div class="hoja hoja-seleccion">
      <header class="hoja-cabeza">
        <div><p class="hoja-antes">tu lista</p><h2 class="hoja-titulo" id="seleccion-titulo">Mi selección ${lista.length ? `<span class="hoja-cuenta">${lista.length}</span>` : ''}</h2></div>
        <button class="boton-icono hoja-cerrar" type="button" data-cerrar aria-label="Cerrar">${A.ICONOS.cerrar}</button>
      </header>
      <div class="hoja-cuerpo">${cuerpo}</div>
      ${pie}
    </div>`;
    I.prepararImagenes(dlg);
  }

  // solo cambia el enlace de WhatsApp y el total (sin repintar la lista)
  function refrescarEnvio() {
    const a = $('[data-enviar-seleccion]', dlg);
    if (a) a.href = I.enlaceWhatsAppTexto(mensaje());
    const t = $('.sel-total', dlg);
    if (t) {
      const { total, porCotizar } = totales();
      t.innerHTML = `${total ? `Total aproximado: <strong>${esc(formato(total))}</strong>` : 'Te comparto el precio por mensaje.'}
        ${total && porCotizar ? `<span>+ ${porCotizar === 1 ? '1 pieza' : `${porCotizar} piezas`} por cotizar</span>` : ''}`;
    }
  }

  function abrir() {
    render();
    if (!dlg.open) { dlg.showModal(); I.actualizarScroll(); }
  }
  async function cerrar() {
    if (!dlg.open || dlg.classList.contains('cerrando')) return;
    dlg.classList.add('cerrando');
    await espera(reducido ? 0 : 200);
    dlg.close();
    dlg.classList.remove('cerrando');
    I.actualizarScroll();
  }
  function cerrarYa() { if (dlg.open) { dlg.close(); dlg.classList.remove('cerrando'); } }

  dlg.addEventListener('cancel', (e) => { e.preventDefault(); I.volver(); });
  dlg.addEventListener('click', async (e) => {
    const t = e.target;
    if (t === dlg || t.closest('[data-cerrar]')) { I.volver(); return; }
    const q = t.closest('[data-quitar]');
    if (q) {
      const x = vigentes()[Number(q.dataset.quitar)];
      if (x) { items.splice(items.indexOf(x), 1); guardar(); render(); }
      return;
    }
    if (t.closest('[data-vaciar]')) {
      items = [];
      nota = '';
      guardar();
      render();
      I.aviso('Tu selección quedó vacía');
      return;
    }
    if (t.closest('[data-copiar-seleccion]')) {
      try { await navigator.clipboard.writeText(mensaje()); I.aviso('Lista copiada: pégala en un mensaje'); } catch (err) { window.prompt('Copia tu lista:', mensaje()); }
    }
  });
  dlg.addEventListener('input', (e) => {
    const t = e.target;
    if (t.matches('[data-nota]')) { nota = t.value; refrescarEnvio(); return; }
    const m = t.name && t.name.match(/^cantidad-(\d+)$/);
    if (m) {
      const x = vigentes()[Number(m[1])];
      if (x) { x.cantidad = I.leerContador(t); guardar(); refrescarEnvio(); }
    }
  });
  dlg.addEventListener('change', (e) => {
    const t = e.target;
    if (!t.matches('[data-var]')) return;
    const x = vigentes()[Number(t.dataset.item)];
    if (!x) return;
    if (t.value) x.variantes[t.dataset.var] = t.value; else delete x.variantes[t.dataset.var];
    guardar();
    refrescarEnvio();
  });

  // en otra pestaña cambió la selección
  window.addEventListener('storage', (e) => { if (e.key === CLAVE) { items = leer(); pintarMarcas(); if (dlg.open) render(); } });

  window.Seleccion = {
    agregar, quitarPieza, alternar, tiene, cuenta, corazonHTML, pintarMarcas, mensaje,
    abrir, cerrar, cerrarYa, abierta: () => dlg.open,
  };
})();
