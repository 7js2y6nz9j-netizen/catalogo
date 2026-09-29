/* ==================================================================
   buscar.js · Buscador y filtros (#buscar)
   ------------------------------------------------------------------
   Busca en nombre, colección, descripción, medidas y variantes, y
   filtra por disponibilidad (disponible / sobre pedido), colección y
   precio. Los resultados son las mismas tarjetas de las colecciones.
   Se muestra en la misma capa que una colección (#coleccion).
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, D = window.Datos;
  const { $, $$, esc, estado } = I;
  const cont = $('#coleccion');
  const INICIAL = { q: '', estado: 'todas', col: '', min: '', max: '', orden: 'relevancia' };
  const st = Object.assign({}, INICIAL);
  const norm = (t) => D.sinAcentos(t).toLowerCase();
  const ORDENES = [['relevancia', 'Destacadas'], ['menor', 'Precio: menor a mayor'], ['mayor', 'Precio: mayor a menor'], ['nombre', 'Nombre (A–Z)']];
  const DISPONIBILIDAD = [['todas', 'Todas'], ['disponible', 'Disponibles'], ['encargo', 'Sobre pedido']];

  const activa = () => !!$('[data-buscador]', cont);
  const hayFiltros = () => st.q.trim() || st.estado !== 'todas' || st.col || st.min !== '' || st.max !== '';

  function texto(p) {
    return norm([p.nombre, p.categoria, p.descripcion, p.medidas, p.entrega, p.tallas.join(' '), p.colores.join(' '),
      p.materiales.join(' '), I.textoEstado(p)].join(' '));
  }

  function filtrar() {
    const palabras = norm(st.q).split(/\s+/).filter(Boolean);
    const min = st.min === '' ? null : Number(st.min), max = st.max === '' ? null : Number(st.max);
    const res = [];
    estado.productos.forEach((p, i) => {
      if (st.estado !== 'todas' && p.estado !== st.estado) return;
      if (st.col && D.slug(p.categoria || 'Piezas') !== st.col) return;
      if (min != null || max != null) {
        const r = D.rangoPrecio(p.precio);
        if (!r) return;
        if (min != null && r.max < min) return;
        if (max != null && r.min > max) return;
      }
      let puntos = 0;
      if (palabras.length) {
        const t = texto(p), n = norm(p.nombre), c = norm(p.categoria);
        for (const w of palabras) {
          if (!t.includes(w)) return;
          puntos += n.includes(w) ? 3 : c.includes(w) ? 2 : 1;
        }
      }
      res.push({ p, i, puntos: puntos + (p.destacado ? 0.5 : 0) });
    });
    const desde = (p) => { const r = D.rangoPrecio(p.precio); return r ? r.min : null; };
    const orden = {
      relevancia: (a, b) => b.puntos - a.puntos || a.i - b.i,
      menor: (a, b) => (desde(a.p) ?? Infinity) - (desde(b.p) ?? Infinity) || a.i - b.i,
      mayor: (a, b) => (desde(b.p) ?? -1) - (desde(a.p) ?? -1) || a.i - b.i,
      nombre: (a, b) => a.p.nombre.localeCompare(b.p.nombre, 'es'),
    }[st.orden] || ((a, b) => a.i - b.i);
    return res.sort(orden).map((x) => x.p);
  }

  const chip = (grupo, v, t, on) => `<button type="button" class="chip${on ? ' activo' : ''}" data-f-${grupo}="${esc(v)}" aria-pressed="${on}">${esc(t)}</button>`;

  function html() {
    const cols = estado.categorias.filter((c) => !c.especial);
    return `<div class="col-scroll">
      <header class="col-barra">
        <a class="volver" href="#taller" data-volver>${A.ICONOS.volver}<span>Taller</span></a>
        <span class="col-marca" aria-hidden="true">${A.logo()}</span>
        ${window.Taller.atajosBarra({ buscar: false })}
      </header>
      <div class="col-cabecera buscar-cabecera">
        <p class="col-antes">en todo el taller</p>
        <h1 class="col-titulo" id="col-titulo">Buscar</h1>
      </div>
      <form class="buscador-cat" role="search" data-buscador>
        <label class="buscador-campo">
          ${A.ICONOS.buscar}
          <input type="search" name="q" value="${esc(st.q)}" placeholder="Pieza, colección, material, talla…" autocomplete="off" enterkeyhint="search" aria-label="Buscar piezas">
          <button type="button" class="buscador-borrar" data-borrar-q aria-label="Borrar la búsqueda"${st.q ? '' : ' hidden'}>${A.ICONOS.cerrar}</button>
        </label>
        <div class="filtro-fila" role="group" aria-label="Disponibilidad">
          <span class="filtro-etiqueta">Disponibilidad</span>
          <div class="filtro-chips">${DISPONIBILIDAD.map(([v, t]) => chip('estado', v, t, st.estado === v)).join('')}</div>
        </div>
        ${cols.length > 1 ? `<div class="filtro-fila" role="group" aria-label="Colección">
          <span class="filtro-etiqueta">Colección</span>
          <div class="filtro-chips desliza">${[['', 'Todas']].concat(cols.map((c) => [c.slug, c.nombre])).map(([v, t]) => chip('col', v, t, st.col === v)).join('')}</div>
        </div>` : ''}
        <div class="filtro-fila filtro-precio">
          <span class="filtro-etiqueta">Precio</span>
          <div class="precio-rango">
            <label><span class="solo-lectores">Precio desde</span><input type="number" name="min" inputmode="numeric" min="0" step="any" placeholder="Desde $" value="${esc(st.min)}"></label>
            <span aria-hidden="true">–</span>
            <label><span class="solo-lectores">Precio hasta</span><input type="number" name="max" inputmode="numeric" min="0" step="any" placeholder="Hasta $" value="${esc(st.max)}"></label>
          </div>
          <label class="orden"><span class="filtro-etiqueta">Ordenar</span>
            <select name="orden">${ORDENES.map(([v, t]) => `<option value="${v}"${st.orden === v ? ' selected' : ''}>${t}</option>`).join('')}</select>
          </label>
        </div>
      </form>
      <p class="buscar-cuenta" aria-live="polite" data-cuenta></p>
      <div class="rejilla" data-resultados></div>
      <div class="buscar-vacio" data-vacio hidden>
        <span class="buscar-vacio-icono">${A.ICONOS.buscar}</span>
        <p><strong>No encontré piezas así.</strong></p>
        <p>Prueba con otra palabra o quita algún filtro. Si tienes una idea, también la podemos hacer sobre pedido.</p>
        <div class="fila-botones">
          <button type="button" class="boton" data-limpiar>Quitar filtros</button>
          <a class="boton boton-tinta" href="#cotizar">${A.ICONOS.mensaje}<span>Cotizar mi idea</span></a>
        </div>
      </div>
    </div>`;
  }

  function resultados() {
    if (!activa()) return;
    const lista = filtrar();
    const rejilla = $('[data-resultados]', cont);
    rejilla.innerHTML = lista.map(window.Taller.tarjetaHTML).join('');
    I.prepararImagenes(rejilla);
    window.Seleccion.pintarMarcas(rejilla);
    window.Taller.observarTarjetas(rejilla);
    $('[data-vacio]', cont).hidden = lista.length > 0;
    const n = lista.length;
    $('[data-cuenta]', cont).innerHTML = `${n === 1 ? '1 pieza' : `${n} piezas`}${hayFiltros() ? ' · <button type="button" class="enlace-suave" data-limpiar>quitar filtros</button>' : ''}`;
    window.Ficha.ponerLista(lista.map((p) => p.id), { ruta: 'buscar', nombre: 'Búsqueda' });
  }

  /* Abre (o repinta) la vista de búsqueda dentro de #coleccion */
  function mostrar({ enfocar = false } = {}) {
    cont.innerHTML = html();
    resultados();
    if (enfocar && I.puntero) $('input[name="q"]', cont).focus({ preventScroll: true });
  }

  function marcarChips(grupo, valor) {
    $$(`[data-f-${grupo}]`, cont).forEach((b) => {
      const on = b.getAttribute(`data-f-${grupo}`) === valor;
      b.classList.toggle('activo', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function limpiar() {
    Object.assign(st, INICIAL);
    mostrar({ enfocar: true });
  }

  let espera = 0;
  cont.addEventListener('input', (e) => {
    if (!activa()) return;
    const t = e.target;
    if (t.name === 'q') {
      st.q = t.value;
      $('[data-borrar-q]', cont).hidden = !t.value;
      clearTimeout(espera);
      espera = setTimeout(resultados, 140);
      return;
    }
    if (t.name === 'min' || t.name === 'max') {
      st[t.name] = t.value === '' ? '' : String(Math.max(0, Number(t.value)));
      clearTimeout(espera);
      espera = setTimeout(resultados, 250);
    }
  });
  cont.addEventListener('change', (e) => {
    if (!activa() || e.target.name !== 'orden') return;
    st.orden = e.target.value;
    resultados();
  });
  cont.addEventListener('submit', (e) => {
    if (!activa()) return;
    e.preventDefault();
    const q = $('input[name="q"]', cont);
    if (q) q.blur(); // cierra el teclado del teléfono
  });
  cont.addEventListener('click', (e) => {
    if (!activa()) return;
    const t = e.target;
    const est = t.closest('[data-f-estado]');
    if (est) { st.estado = est.dataset.fEstado; marcarChips('estado', st.estado); resultados(); return; }
    const col = t.closest('[data-f-col]');
    if (col) { st.col = col.dataset.fCol; marcarChips('col', st.col); resultados(); return; }
    if (t.closest('[data-borrar-q]')) {
      st.q = '';
      const q = $('input[name="q"]', cont);
      q.value = '';
      q.focus();
      t.closest('[data-borrar-q]').hidden = true;
      resultados();
      return;
    }
    if (t.closest('[data-limpiar]')) limpiar();
  });

  window.Buscar = { mostrar, resultados, activa, estado: st };
})();
