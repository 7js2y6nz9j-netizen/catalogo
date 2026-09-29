/* ==================================================================
   admin.js · Panel del taller
   Entrar con tu clave → ver tus piezas → agregar / editar / ordenar,
   subir fotos desde el teléfono y cambiar los ajustes del catálogo.
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte, D = window.Datos, B = window.Datos.backend, Tintas = window.Tintas;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const CLAVE_SESION = 'inluna:sesion:v1';
  const ETIQUETAS = { disponible: 'Disponible', encargo: 'Sobre pedido', agotado: 'Agotado', oculto: 'Oculto' };

  const estado = {
    token: null, productos: [], ajustes: D.mezclarAjustes({}), ajustesGuardados: {},
    filtro: 'todas', busqueda: '', ordenando: false, ordenPrevio: null,
    borrador: null, cambios: false, colaFotos: [], subiendo: false,
  };

  /* ---------- colores e íconos ---------- */
  (function () {
    const c = (window.INLUNA_CONFIG || {}).colores || {}, st = document.documentElement.style;
    ['tinta', 'oscura', 'papel', 'verde', 'acento', 'cafe', 'dorado'].forEach((k) => {
      if (c[k]) st.setProperty(`--${k}`, c[k]);
    });
  })();
  $$('[data-icono]').forEach((el) => el.insertAdjacentHTML('afterbegin', A.ICONOS[el.dataset.icono] || ''));
  $('#cargando-logo').innerHTML = A.logo({ clase: 'logo-giro' });
  $('#acceso-logo').innerHTML = A.logo();
  $('#barra-logo').innerHTML = A.logo();
  if (D.modoPrueba) $$('[data-prueba]').forEach((el) => { el.hidden = false; });

  /* ================================================================
     SESIÓN
     ================================================================ */
  function leerSesion() {
    try {
      const s = JSON.parse(localStorage.getItem(CLAVE_SESION));
      if (s && s.token && (!s.hasta || s.hasta > Date.now()) && s.modo === B.tipo) return s;
    } catch (e) { /* nada */ }
    return null;
  }
  function guardarSesion(token, hasta) {
    try { localStorage.setItem(CLAVE_SESION, JSON.stringify({ token, hasta: hasta || Date.now() + 30 * 864e5, modo: B.tipo })); } catch (e) { /* nada */ }
  }
  function borrarSesion() { try { localStorage.removeItem(CLAVE_SESION); } catch (e) { /* nada */ } }

  function mostrar(pantalla) {
    $('#acceso').hidden = pantalla !== 'acceso';
    $('#lista').hidden = pantalla !== 'lista';
    const c = $('#cargando');
    c.classList.add('fuera');
    setTimeout(() => { c.hidden = true; c.classList.remove('fuera'); }, 360);
  }
  function cargando(si) {
    const c = $('#cargando');
    if (si) { c.hidden = false; c.classList.add('sobre'); } else { c.hidden = true; c.classList.remove('sobre'); }
  }

  async function iniciar() {
    const s = leerSesion();
    if (s) {
      estado.token = s.token;
      try {
        await B.verificar(s.token);
        await cargarLista();
        mostrar('lista');
        return;
      } catch (e) {
        if (e.codigo === 'sesion') borrarSesion();
        else mostrarErrorAcceso(`No pude conectar con tu hoja: ${e.message}`);
      }
    }
    mostrar('acceso');
  }

  $('#ver-clave').addEventListener('click', () => {
    const i = $('#clave');
    i.type = i.type === 'password' ? 'text' : 'password';
    $('#ver-clave').setAttribute('aria-label', i.type === 'password' ? 'Mostrar clave' : 'Ocultar clave');
  });

  function mostrarErrorAcceso(txt) {
    const e = $('#error-acceso');
    e.textContent = txt;
    e.hidden = !txt;
  }

  $('#form-acceso').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const boton = $('#boton-entrar');
    mostrarErrorAcceso('');
    boton.disabled = true;
    boton.textContent = 'Entrando…';
    try {
      const r = await B.login($('#clave').value);
      estado.token = r.token;
      guardarSesion(r.token, r.hasta);
      $('#clave').value = '';
      await cargarLista();
      mostrar('lista');
    } catch (e) {
      mostrarErrorAcceso(e.message || 'No se pudo entrar.');
    } finally {
      boton.disabled = false;
      boton.textContent = 'Entrar';
    }
  });

  $('#salir').addEventListener('click', async () => {
    if (!(await confirmar('¿Salir del panel en este teléfono?', { si: 'Salir', peligro: false }))) return;
    B.salir(estado.token).catch(() => {});
    borrarSesion();
    estado.token = null;
    estado.productos = [];
    $('#lista-piezas').innerHTML = '';
    mostrar('acceso');
  });

  function manejarError(e) {
    console.error('[Inluna panel]', e);
    if (e && e.codigo === 'sesion') {
      borrarSesion();
      aviso('Tu sesión terminó. Vuelve a entrar con tu clave.', 'error');
      [$('#editor'), $('#ajustes')].forEach((d) => { if (d.open) d.close(); });
      mostrar('acceso');
      return;
    }
    aviso((e && e.message) || 'Algo salió mal. Revisa tu conexión.', 'error');
  }

  /* ================================================================
     LISTA
     ================================================================ */
  async function cargarLista() {
    const r = await B.listar(estado.token);
    estado.productos = (r.productos || []).map(D.normalizarProducto).sort((a, b) => a.orden - b.orden);
    estado.ajustesGuardados = r.ajustes || {};
    estado.ajustes = D.mezclarAjustes(r.ajustes);
    renderLista();
  }

  function productosVisibles() {
    const q = sinAcentos(estado.busqueda.trim());
    return estado.productos.filter((p) =>
      (estado.filtro === 'todas' || p.estado === estado.filtro) &&
      (!q || sinAcentos(`${p.nombre} ${p.categoria}`).includes(q)));
  }

  function filaHTML(p, i, total) {
    const precio = D.formatoPrecio(p.precio, estado.ajustes.moneda);
    const ref = (p.dibujos && p.dibujos[0]) || p.fotos[0];
    const dibujada = (p.dibujos && p.dibujos[0]) || /^(dibujo|patron):/.test(ref || '');
    const tinta = dibujada ? Tintas.estilo(p.color) : '';
    const foto = ref ? `<img src="${esc(D.urlImagen(ref, 240))}" alt="" loading="lazy" decoding="async"${tinta ? ` style="${tinta}"` : ''}>` : A.logo();
    const orden = estado.ordenando
      ? `<span class="fila-orden"><button type="button" data-subir="${esc(p.id)}" aria-label="Subir ${esc(p.nombre)}"${i === 0 ? ' disabled' : ''}>${A.ICONOS.arriba}</button>` +
        `<button type="button" data-bajar="${esc(p.id)}" aria-label="Bajar ${esc(p.nombre)}"${i === total - 1 ? ' disabled' : ''}>${A.ICONOS.abajo}</button></span>`
      : '';
    return `<li class="fila-pieza estado-${p.estado}" data-id="${esc(p.id)}">
      <button class="fila-principal" type="button" data-editar="${esc(p.id)}"${estado.ordenando ? ' tabindex="-1"' : ''}>
        <span class="fila-foto">${foto}</span>
        <span class="fila-texto">
          <span class="fila-nombre">${esc(p.nombre)}${p.destacado ? ' <span class="fila-estrella" title="Favorita">★</span>' : ''}</span>
          <span class="fila-meta">${precio ? `${esc(precio)} · ` : ''}${esc(p.categoria || 'Sin colección')}</span>
        </span>
        <span class="chip-estado ${p.estado}">${ETIQUETAS[p.estado]}</span>
      </button>${orden}
    </li>`;
  }

  function renderLista() {
    const visibles = estado.ordenando ? estado.productos : productosVisibles();
    const total = estado.productos.length;
    const ocultas = estado.productos.filter((p) => p.estado === 'oculto').length;
    $('#cuenta').textContent = `${total} ${total === 1 ? 'pieza' : 'piezas'}${ocultas ? ` · ${ocultas} oculta${ocultas === 1 ? '' : 's'}` : ''}`;
    $('#lista-piezas').innerHTML = visibles.map((p, i) => filaHTML(p, i, visibles.length)).join('');
    const vacia = $('#lista-vacia');
    vacia.hidden = visibles.length > 0;
    if (!visibles.length) {
      vacia.innerHTML = total
        ? `${A.logo()}<p>No hay piezas con ese filtro.</p>`
        : `${A.logo({ estrellas: true })}<p>Tu taller todavía está vacío.<br>Toca <strong>«Nueva pieza»</strong> para agregar la primera.</p>`;
    }
    $('#ayuda-lista').textContent = estado.ordenando ? 'Usa las flechas para cambiar el orden.' : 'Toca una pieza para editarla.';
    $$('.filtro').forEach((b) => { b.classList.toggle('activo', b.dataset.filtro === estado.filtro); b.disabled = estado.ordenando; });
    $('#buscar').disabled = estado.ordenando;
    $('#ordenar').hidden = estado.ordenando;
    $('#nueva').hidden = estado.ordenando;
    $('#barra-orden').hidden = !estado.ordenando;
    actualizarCategorias();
  }

  $('#buscar').addEventListener('input', (e) => { estado.busqueda = e.target.value; renderLista(); });
  $('#filtros').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filtro]');
    if (!b) return;
    estado.filtro = b.dataset.filtro;
    renderLista();
  });

  $('#lista-piezas').addEventListener('click', (e) => {
    const editar = e.target.closest('[data-editar]');
    const subir = e.target.closest('[data-subir]');
    const bajar = e.target.closest('[data-bajar]');
    if (subir || bajar) {
      const id = (subir || bajar).dataset[subir ? 'subir' : 'bajar'];
      const i = estado.productos.findIndex((p) => p.id === id);
      const j = subir ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= estado.productos.length) return;
      [estado.productos[i], estado.productos[j]] = [estado.productos[j], estado.productos[i]];
      renderLista();
      const fila = $(`.fila-pieza[data-id="${CSS.escape(id)}"]`);
      if (fila) {
        fila.classList.add('movida');
        const boton = $(subir ? '[data-subir]' : '[data-bajar]', fila);
        (boton && !boton.disabled ? boton : fila).focus({ preventScroll: true });
        fila.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
      return;
    }
    if (editar && !estado.ordenando) {
      const p = estado.productos.find((x) => x.id === editar.dataset.editar);
      if (p) abrirEditor(p);
    }
  });

  /* Ordenar */
  $('#ordenar').addEventListener('click', () => {
    estado.ordenando = true;
    estado.ordenPrevio = estado.productos.map((p) => p.id);
    estado.filtro = 'todas';
    estado.busqueda = '';
    $('#buscar').value = '';
    renderLista();
  });
  $('#cancelar-orden').addEventListener('click', () => {
    const prev = estado.ordenPrevio || [];
    estado.productos.sort((a, b) => prev.indexOf(a.id) - prev.indexOf(b.id));
    estado.ordenando = false;
    renderLista();
  });
  $('#guardar-orden').addEventListener('click', async () => {
    const boton = $('#guardar-orden');
    boton.disabled = true;
    boton.textContent = 'Guardando…';
    try {
      const ids = estado.productos.map((p) => p.id);
      await B.ordenar(estado.token, ids);
      estado.productos.forEach((p, i) => { p.orden = i + 1; });
      estado.ordenando = false;
      renderLista();
      aviso('Orden guardado ✓');
    } catch (e) { manejarError(e); } finally {
      boton.disabled = false;
      boton.textContent = 'Guardar orden';
    }
  });

  /* ================================================================
     EDITOR DE PIEZA
     ================================================================ */
  const dlgEditor = $('#editor');
  const form = $('#form-pieza');

  function categoriasExistentes() {
    const vistas = new Map();
    estado.productos.forEach((p) => { if (p.categoria && !vistas.has(sinAcentos(p.categoria))) vistas.set(sinAcentos(p.categoria), p.categoria); });
    return Array.from(vistas.values());
  }
  function actualizarCategorias() {
    $('#lista-categorias').innerHTML = categoriasExistentes().map((c) => `<option value="${esc(c)}"></option>`).join('');
  }
  function renderChipsCategorias() {
    const actual = sinAcentos(form.elements.categoria.value.trim());
    $('#chips-categorias').innerHTML = categoriasExistentes().map((c) =>
      `<button type="button" data-cat="${esc(c)}" class="${sinAcentos(c) === actual ? 'activo' : ''}">${esc(c)}</button>`).join('');
  }
  $('#chips-categorias').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    form.elements.categoria.value = b.dataset.cat;
    estado.cambios = true;
    renderChipsCategorias();
  });
  form.elements.categoria.addEventListener('input', renderChipsCategorias);

  function llenarFormulario(b) {
    const f = form.elements;
    f.nombre.value = b.nombre || '';
    f.precio.value = b.precio === '' || b.precio == null ? '' : String(b.precio);
    f.categoria.value = b.categoria || '';
    f.descripcion.value = b.descripcion || '';
    f.estado.value = b.estado || 'disponible';
    f.destacado.checked = !!b.destacado;
    f.animacion.value = b.animacion || 'auto';
    f.color.value = Tintas.normalizar(b.color);
    pintarColor();
    f.nombre.removeAttribute('aria-invalid');
  }

  function abrirEditor(p, { copia = false } = {}) {
    const base = p ? JSON.parse(JSON.stringify(p)) : {
      id: '', nombre: '', precio: '', categoria: estado.ultimaCategoria || '', descripcion: '', fotos: [], dibujos: [], estado: 'disponible', destacado: false, animacion: 'auto',
      color: estado.ultimoColor || '',
    };
    if (copia) { base.id = ''; base.nombre = `${base.nombre} (copia)`; }
    const dibujos = base.dibujos || [];
    estado.borrador = Object.assign(base, { fotos: (base.fotos || []).map((ref, i) => ({ ref, dibujo: dibujos[i] || '', estado: 'lista' })) });
    llenarFormulario(estado.borrador);
    $('#editor-titulo').textContent = base.id ? 'Editar pieza' : copia ? 'Copia de pieza' : 'Nueva pieza';
    $('#zona-extra').hidden = !base.id;
    renderFotos();
    renderChipsCategorias();
    estado.cambios = copia;
    if (!dlgEditor.open) dlgEditor.showModal();
    $('.hoja-admin-cuerpo', dlgEditor).scrollTop = 0;
  }

  async function cerrarHoja(dlg) {
    dlg.classList.add('cerrando');
    await espera(220);
    dlg.classList.remove('cerrando');
    dlg.close();
  }

  async function intentarCerrarEditor() {
    const subiendo = estado.borrador && estado.borrador.fotos.some((f) => f.estado === 'subiendo' || f.estado === 'espera');
    if (subiendo && !(await confirmar('Todavía se están subiendo fotos. ¿Salir de todos modos?', { si: 'Salir', peligro: true }))) return;
    if (!subiendo && estado.cambios && !(await confirmar('Tienes cambios sin guardar. ¿Salir sin guardarlos?', { si: 'Salir sin guardar', peligro: true }))) return;
    estado.borrador = null;
    cerrarHoja(dlgEditor);
  }

  dlgEditor.addEventListener('cancel', (e) => { e.preventDefault(); if (!$('#gama').hidden) { cerrarGama(); return; } intentarCerrarEditor(); });
  $('[data-cerrar]', dlgEditor).addEventListener('click', intentarCerrarEditor);
  form.addEventListener('input', () => { estado.cambios = true; renderVistaPrevia(); });
  form.elements.animacion.addEventListener('change', renderVistaPrevia);

  $('#nueva').addEventListener('click', () => abrirEditor(null));
  $('#duplicar').addEventListener('click', () => {
    const datos = leerFormulario();
    const listas = estado.borrador.fotos.filter((x) => x.estado === 'lista' && x.ref);
    abrirEditor(Object.assign({}, datos, { fotos: listas.map((x) => x.ref), dibujos: listas.map((x) => x.dibujo || '') }), { copia: true });
    aviso('Copia lista: cambia lo que necesites y guarda.');
  });

  /* ---------- fotos ---------- */
  const esDibujoDemo = (ref) => /^(dibujo|patron):/.test(ref || '');
  function renderFotos() {
    const b = estado.borrador;
    if (!b) return;
    $('#fotos-editor').innerHTML = b.fotos.map((f, i) => {
      const src = f.vista || D.urlImagen(f.dibujo || f.ref, 320);
      const conEstilo = f.vista || f.dibujo || esDibujoDemo(f.ref);
      const tinta = Tintas.estilo(form.elements.color.value, { cruda: !conEstilo });
      return `<div class="foto-mini ${f.estado}">
        ${src ? `<img src="${esc(src)}" alt="Foto ${i + 1}"${conEstilo ? '' : ' class="foto-cruda"'}${tinta ? ` style="${tinta}"` : ''}>` : ''}
        ${i === 0 ? '<span class="foto-portada">Portada</span>'
          : f.estado === 'lista' ? `<button type="button" class="foto-accion foto-hacer-portada" data-portada="${i}" aria-label="Usar como portada">${A.ICONOS.estrella}</button>` : ''}
        <button type="button" class="foto-accion foto-quitar" data-quitar="${i}" aria-label="Quitar foto ${i + 1}">${A.ICONOS.cerrar}</button>
        ${f.estado === 'lista' && conEstilo ? '<span class="foto-estilo" title="Convertida al estilo del catálogo">✦</span>' : ''}
        ${f.estado === 'lista' && !conEstilo ? `<button type="button" class="foto-dibujar" data-dibujar="${i}">✦ dibujar</button>` : ''}
        ${f.estado === 'subiendo' || f.estado === 'espera' ? `<span class="foto-progreso"><span class="girando"></span><span class="foto-paso">${f.paso || 'preparando'}</span></span>` : ''}
        ${f.estado === 'error' ? `<button type="button" class="foto-reintentar" data-reintentar="${i}">Reintentar</button>` : ''}
      </div>`;
    }).join('') + `<button type="button" class="foto-agregar" id="agregar-fotos">${A.ICONOS.foto}<span>Agregar fotos</span></button>`;
    renderVistaPrevia();
  }

  /* Vista previa: la tarjeta tal como se verá en el catálogo, con su animación */
  function renderVistaPrevia() {
    const b = estado.borrador;
    const marco = $('#vp-marco');
    if (!b || !marco) return;
    const f = form.elements;
    const tipo = window.Animaciones.tipo({ nombre: f.nombre.value, categoria: f.categoria.value, animacion: f.animacion.value });
    const primera = b.fotos.find((x) => x.estado !== 'error' && (x.vista || x.ref));
    let img = `<span class="sin-foto">${A.logo()}</span>`;
    if (primera) {
      const src = primera.vista || D.urlImagen(primera.dibujo || primera.ref, 480);
      const cruda = !primera.vista && !primera.dibujo && !esDibujoDemo(primera.ref);
      const tinta = Tintas.estilo(f.color.value, { cruda });
      img = `<img src="${esc(src)}" alt="" class="cargada${cruda ? ' foto-cruda' : ''}"${tinta ? ` style="${tinta}"` : ''}>`;
    }
    marco.innerHTML = `<span class="marco-img${tipo ? ` anim-${tipo}` : ''}">${img}${window.Animaciones.capa(tipo)}</span>${A.marcoArco()}`;
    $('#vp-tipo').textContent = tipo ? `✦ ${window.Animaciones.NOMBRES[tipo]}` : 'sin animación';
  }

  /* ---------- color del dibujo: la gama se despliega como un abanico ---------- */
  const gama = $('#gama');
  function pintarColor() {
    const v = form.elements.color.value;
    $('#muestra-color').style.background = Tintas.normalizar(v) || Tintas.TALAVERA;
    $('#nombre-color').textContent = Tintas.nombre(v);
  }
  let gamaFamilia = null; // null = el abanico de familias; 'B' = el muestrario de esa familia
  const q = (v) => Math.round(v * 10) / 10;
  const muestraAttrs = (x, elegido) =>
    `class="gama-muestra${x.hex === elegido ? ' elegida' : ''}" data-color="${x.hex}" tabindex="0" role="button" aria-label="${esc(x.familia)} ${x.codigo}"`;

  // 1 · el abanico de familias (como tu referencia): un rayo por familia con
  //     sus 5 tonos de intensidad media, oscuros al centro y claros afuera
  function abanicoFamilias(elegido) {
    const cx = 200, cy = 212, r0 = 58, prof = 25, sep = 3;
    const fam = Tintas.FAMILIAS, paso = 180 / fam.length;
    const pto = (r, a) => [cx + r * Math.cos((a * Math.PI) / 180), cy - r * Math.sin((a * Math.PI) / 180)];
    let s = '';
    fam.forEach((fa, k) => {
      const a1 = 180 - k * paso - 0.7, a2 = 180 - (k + 1) * paso + 0.7, medio = (a1 + a2) / 2;
      let g = '';
      Tintas.tonosDe(fa.k, '2').slice().reverse().forEach((x, j) => {
        const ri = r0 + j * (prof + sep), re = ri + prof;
        const [x1, y1] = pto(ri, a1), [x2, y2] = pto(re, a1), [x3, y3] = pto(re, a2), [x4, y4] = pto(ri, a2);
        const d = `M${q(x1)},${q(y1)}L${q(x2)},${q(y2)}A${re},${re} 0 0 1 ${q(x3)},${q(y3)}L${q(x4)},${q(y4)}A${ri},${ri} 0 0 0 ${q(x1)},${q(y1)}Z`;
        const [tx, ty] = pto(ri + prof / 2, medio);
        const giro = medio > 90 ? 180 - medio : -medio;
        g += `<g ${muestraAttrs(x, elegido)}><path d="${d}" fill="${x.hex}"/>` +
          `<text x="${q(tx)}" y="${q(ty)}" transform="rotate(${q(giro)} ${q(tx)} ${q(ty)})" fill="${x.claro ? '#3a2a1f' : '#fff'}">${x.codigo}</text></g>`;
      });
      s += `<g class="gama-rayo" style="--i:${k};--desde:${q(medio - paso / 2)}deg">${g}</g>`;
    });
    s += `<path class="gama-centro" d="M${cx - 48},${cy}A48,48 0 0 1 ${cx + 48},${cy}Z" fill="${elegido}"/>`;
    return `<svg class="gama-svg" viewBox="0 0 400 216" role="group" aria-label="Familias de color">${s}</svg>`;
  }
  // los pocos grises y la tinta, en una fila
  const filaNeutros = (elegido) => `<div class="gama-neutros" role="group" aria-label="Grises y tinta">${Tintas.neutros().map((x) =>
    `<button type="button" class="gama-neutro${x.hex === elegido ? ' elegida' : ''}" data-color="${x.hex}" style="--c:${x.hex}" aria-label="${esc(x.familia)} ${x.codigo}"><span></span>${x.codigo}</button>`).join('')}</div>`;

  // 2 · el muestrario de una familia: 3 tiras (viva, media, suave) × 5 tonos, abiertas en abanico
  function abanicoFamilia(k, elegido) {
    const px = 200, py = 760, ancho = 62, alto = 32;
    let s = '';
    Tintas.GRUPOS.forEach((gr, i) => {
      const giro = (i - 1) * 7.5;
      let g = '';
      Tintas.tonosDe(k, gr.d).forEach((x, j) => { // arriba el más claro
        const R = 700 - j * 38;
        g += `<g ${muestraAttrs(x, elegido)}><rect x="${px - ancho / 2}" y="${py - R - alto / 2}" width="${ancho}" height="${alto}" rx="8" fill="${x.hex}"/>` +
          `<text x="${px}" y="${py - R}" fill="${x.claro ? '#3a2a1f' : '#fff'}">${x.codigo}</text></g>`;
      });
      g += `<text class="gama-tira-nombre" x="${px}" y="${py - 700 + 5 * 38 + 8}">${gr.nombre}</text>`;
      s += `<g class="gama-tira" style="--i:${i};transform:rotate(${giro}deg)">${g}</g>`;
    });
    return `<svg class="gama-svg gama-familia" viewBox="0 0 400 290" role="group" aria-label="Tonos de ${esc(Tintas.familia(k).nombre)}">${s}</svg>`;
  }

  function colorActual() { return Tintas.normalizar(form.elements.color.value) || Tintas.TALAVERA; }
  function pieGama(hex) {
    const d = Tintas.datos(hex), fam = !d.neutro && d.k && Tintas.familia(d.k);
    const mas = $('#gama-mas');
    mas.hidden = !!gamaFamilia || !fam;
    if (fam) mas.textContent = `Más tonos de ${fam.nombre} ›`;
    $('#gama-volver').hidden = !gamaFamilia;
    $('#gama-titulo').textContent = gamaFamilia ? `Tonos de ${Tintas.familia(gamaFamilia).nombre}` : 'Color del dibujo';
  }
  function marcarGama(hex) {
    $('#gama-muestra').style.background = hex;
    $('#gama-nombre').textContent = Tintas.nombre(hex);
    const centro = $('.gama-centro', gama);
    if (centro) centro.setAttribute('fill', hex);
    $$('[data-color]', gama).forEach((m) => m.classList.toggle('elegida', m.dataset.color === hex));
    pieGama(hex);
  }
  function renderGama() {
    const hex = colorActual();
    $('#gama-abanico').innerHTML = gamaFamilia ? abanicoFamilia(gamaFamilia, hex) : abanicoFamilias(hex) + filaNeutros(hex);
    marcarGama(hex);
  }
  function abrirGama() {
    gamaFamilia = null;
    renderGama();
    gama.classList.remove('cerrando');
    gama.hidden = false;
  }
  async function cerrarGama() {
    if (gama.hidden) return;
    gama.classList.add('cerrando');
    await espera(220);
    gama.hidden = true;
    gama.classList.remove('cerrando');
    $('#abrir-gama').focus({ preventScroll: true });
  }
  function elegirColor(hex) {
    form.elements.color.value = Tintas.normalizar(hex);
    estado.cambios = true;
    marcarGama(hex);
    pintarColor();
    renderFotos();
  }
  $('#abrir-gama').addEventListener('click', abrirGama);
  gama.addEventListener('click', (e) => {
    if (e.target.closest('[data-cerrar-gama]')) { cerrarGama(); return; }
    const m = e.target.closest('[data-color]');
    if (m) elegirColor(m.dataset.color);
  });
  gama.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.preventDefault(); if (gamaFamilia) { gamaFamilia = null; renderGama(); } else cerrarGama(); return; }
    const m = e.target.closest('.gama-muestra');
    if (m && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); elegirColor(m.dataset.color); }
  });
  $('#gama-mas').addEventListener('click', () => { gamaFamilia = Tintas.datos(colorActual()).k; renderGama(); });
  $('#gama-volver').addEventListener('click', () => { gamaFamilia = null; renderGama(); });
  $('#gama-original').addEventListener('click', () => elegirColor(Tintas.TALAVERA));

  $('#fotos-editor').addEventListener('click', (e) => {
    const b = estado.borrador;
    if (!b) return;
    if (e.target.closest('#agregar-fotos')) { $('#input-fotos').click(); return; }
    const quitar = e.target.closest('[data-quitar]');
    const portada = e.target.closest('[data-portada]');
    const reintentar = e.target.closest('[data-reintentar]');
    const dibujar = e.target.closest('[data-dibujar]');
    if (quitar) { b.fotos.splice(Number(quitar.dataset.quitar), 1); estado.cambios = true; renderFotos(); }
    if (portada) { const [f] = b.fotos.splice(Number(portada.dataset.portada), 1); b.fotos.unshift(f); estado.cambios = true; renderFotos(); }
    if (reintentar) { b.fotos[Number(reintentar.dataset.reintentar)].estado = 'espera'; renderFotos(); procesarCola(); }
    if (dibujar) dibujarExistente(b, b.fotos[Number(dibujar.dataset.dibujar)]);
  });

  /* Convierte al estilo del catálogo una foto que se subió antes (o por enlace) */
  async function dibujarExistente(b, f) {
    if (!f || f.estado !== 'lista') return;
    f.estado = 'subiendo';
    f.paso = 'dibujando';
    renderFotos();
    try {
      const img = await cargarImagen(D.urlImagen(f.ref, 1400), true);
      const dib = dibujarFoto(img);
      f.vista = dib.vista;
      f.paso = 'subiendo';
      renderFotos();
      const r = await B.subirFoto(estado.token, { nombre: 'dibujo.jpg', tipo: dib.tipo, datos: dib.datos });
      f.dibujo = r.id;
      estado.cambios = true;
      aviso('Foto convertida al estilo del taller ✓');
    } catch (e) {
      if (e && e.codigo === 'sesion') { manejarError(e); return; }
      aviso('No pude convertir esta foto. Súbela de nuevo desde tu teléfono y se convertirá sola.', 'error');
    } finally {
      f.estado = 'lista';
      f.paso = '';
      if (estado.borrador === b) renderFotos();
    }
  }

  $('#input-fotos').addEventListener('change', (e) => {
    const b = estado.borrador;
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    if (!b || !archivos.length) return;
    archivos.forEach((archivo) => b.fotos.push({ archivo, estado: 'espera', ref: '' }));
    estado.cambios = true;
    renderFotos();
    procesarCola();
  });

  $('#pegar-enlace').addEventListener('click', () => {
    const b = estado.borrador;
    if (!b) return;
    const url = (window.prompt('Pega el enlace de la imagen (de Google Drive o una dirección que termine en .jpg / .png):') || '').trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url) && !D.idDeDrive(url)) { aviso('Ese enlace no parece una imagen.', 'error'); return; }
    b.fotos.push({ ref: url, estado: 'lista' });
    estado.cambios = true;
    renderFotos();
  });

  async function procesarCola() {
    if (estado.subiendo) return;
    estado.subiendo = true;
    try {
      for (;;) {
        const b = estado.borrador;
        const f = b && b.fotos.find((x) => x.estado === 'espera');
        if (!f) break;
        f.estado = 'subiendo';
        f.paso = 'preparando';
        renderFotos();
        try {
          // 1 · la foto original (se ve al abrir la pieza)
          const lista = await prepararFoto(f.archivo, D.modoPrueba ? 900 : 1600, D.modoPrueba ? 0.8 : 0.86);
          // 2 · su versión con el estilo del catálogo (se ve en las tarjetas)
          f.paso = 'dibujando';
          renderFotos();
          await espera(30);
          const dib = dibujarFoto(lista.lienzo);
          f.vista = dib.vista;
          f.paso = 'subiendo';
          renderFotos();
          const r1 = await B.subirFoto(estado.token, { nombre: lista.nombre, tipo: lista.tipo, datos: lista.datos });
          const r2 = await B.subirFoto(estado.token, { nombre: `dibujo-${lista.nombre}`, tipo: dib.tipo, datos: dib.datos });
          f.ref = r1.id;
          f.dibujo = r2.id;
          f.estado = 'lista';
          f.paso = '';
          delete f.archivo;
        } catch (e) {
          f.estado = 'error';
          if (e && e.codigo === 'sesion') { manejarError(e); break; }
          aviso(e && e.message ? `No se pudo subir una foto: ${e.message}` : 'No se pudo subir una foto.', 'error');
        }
        if (estado.borrador === b) renderFotos();
      }
    } finally { estado.subiendo = false; }
  }

  function cargarImagen(src, cors = false) {
    return new Promise((ok, no) => {
      const img = new Image();
      if (cors && !/^(data|blob):/.test(src)) img.crossOrigin = 'anonymous';
      img.onload = () => ok(img);
      img.onerror = () => no(new Error('No pude leer esta foto. Prueba con una JPG o PNG.'));
      img.src = src;
    });
  }

  /* La versión dibujada (tinta azul sobre papel) — js/estilo.js */
  function dibujarFoto(fuente) {
    const lienzo = window.Estilo.estilizar(fuente, { lado: D.modoPrueba ? 560 : 760 });
    const url = lienzo.toDataURL('image/jpeg', D.modoPrueba ? 0.72 : 0.82);
    return { datos: url.split(',')[1], tipo: 'image/jpeg', vista: url };
  }

  /* Achica la foto en el teléfono antes de subirla (más rápido y ligero) */
  async function prepararFoto(archivo, maxLado, calidad) {
    const url = URL.createObjectURL(archivo);
    try {
      const img = await cargarImagen(url);
      const escala = Math.min(1, maxLado / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * escala)), h = Math.max(1, Math.round(img.naturalHeight * escala));
      const lienzo = document.createElement('canvas');
      lienzo.width = w; lienzo.height = h;
      const ctx = lienzo.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = lienzo.toDataURL('image/jpeg', calidad);
      const base = String(archivo.name || 'foto').replace(/\.[^.]+$/, '').replace(/[^\w\-]+/g, '-').slice(0, 40) || 'foto';
      return { datos: dataUrl.split(',')[1], tipo: 'image/jpeg', nombre: `${base}.jpg`, vista: dataUrl, lienzo };
    } finally { URL.revokeObjectURL(url); }
  }

  /* ---------- guardar / eliminar ---------- */
  function interpretarPrecio(txt) {
    const s = String(txt || '').trim();
    if (!s) return '';
    const limpio = s.replace(/[$\s]/g, '');
    if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(limpio)) return Number(limpio.replace(/,/g, ''));
    if (/^\d+,\d{1,2}$/.test(limpio)) return Number(limpio.replace(',', '.'));
    if (/^\d+(\.\d+)?$/.test(limpio)) return Number(limpio);
    return s;
  }

  function leerFormulario() {
    const f = form.elements, b = estado.borrador || {};
    const listas = (b.fotos || []).filter((x) => x.estado === 'lista' && x.ref);
    return {
      id: b.id || '',
      nombre: f.nombre.value.trim(),
      precio: interpretarPrecio(f.precio.value),
      categoria: f.categoria.value.trim(),
      descripcion: f.descripcion.value.trim(),
      // cada foto se guarda como "original|dibujo"
      fotos: D.unirFotos(listas.map((x) => x.ref), listas.map((x) => x.dibujo || '')),
      estado: f.estado.value || 'disponible',
      destacado: f.destacado.checked,
      animacion: f.animacion.value || 'auto',
      color: Tintas.normalizar(f.color.value),
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const b = estado.borrador;
    if (!b) return;
    if (b.fotos.some((f) => f.estado === 'subiendo' || f.estado === 'espera')) { aviso('Espera un momento: se están subiendo las fotos.'); return; }
    const datos = leerFormulario();
    if (!datos.nombre) {
      form.elements.nombre.setAttribute('aria-invalid', 'true');
      form.elements.nombre.focus();
      aviso('Ponle un nombre a la pieza.', 'error');
      return;
    }
    if (b.fotos.some((f) => f.estado === 'error') && !(await confirmar('Algunas fotos no se pudieron subir. ¿Guardar sin ellas?', { si: 'Guardar así', peligro: false }))) return;
    const boton = $('#guardar');
    boton.disabled = true;
    boton.textContent = 'Guardando…';
    try {
      const r = await B.guardar(estado.token, datos);
      // un Apps Script de antes no conoce el color: avisa para actualizarlo
      const sinColor = datos.color && r.producto && !('color' in r.producto);
      const guardado = D.normalizarProducto(r.producto || datos, estado.productos.length);
      const i = estado.productos.findIndex((p) => p.id === guardado.id);
      if (i >= 0) estado.productos[i] = guardado; else estado.productos.push(guardado);
      estado.productos.sort((x, y) => x.orden - y.orden);
      estado.ultimaCategoria = datos.categoria;
      estado.ultimoColor = datos.color;
      estado.cambios = false;
      renderLista();
      estado.borrador = null;
      await cerrarHoja(dlgEditor);
      if (sinColor) aviso('Se guardó la pieza, pero tu Apps Script todavía no guarda el color: actualízalo (LEEME.md, paso 1).', 'error');
      else aviso(i >= 0 ? 'Cambios guardados ✓' : 'Pieza agregada al catálogo ✓');
    } catch (err) { manejarError(err); } finally {
      boton.disabled = false;
      boton.textContent = 'Guardar pieza';
    }
  });

  $('#eliminar').addEventListener('click', async () => {
    const b = estado.borrador;
    if (!b || !b.id) return;
    const ok = await confirmar(`¿Eliminar «${b.nombre}» del catálogo? Si solo quieres esconderla un tiempo, mejor usa «Oculto».`, { si: 'Eliminar', peligro: true });
    if (!ok) return;
    cargando(true);
    try {
      await B.eliminar(estado.token, b.id);
      estado.productos = estado.productos.filter((p) => p.id !== b.id);
      renderLista();
      estado.borrador = null;
      estado.cambios = false;
      await cerrarHoja(dlgEditor);
      aviso('Pieza eliminada');
    } catch (e) { manejarError(e); } finally { cargando(false); }
  });

  /* ================================================================
     AJUSTES
     ================================================================ */
  const dlgAjustes = $('#ajustes');
  const formAjustes = $('#form-ajustes');
  $('#abrir-ajustes').addEventListener('click', () => {
    const a = estado.ajustes, f = formAjustes.elements;
    ['nombre', 'antesDelNombre', 'lema', 'whatsapp', 'instagram', 'mensajeWhatsApp'].forEach((k) => { f[k].value = a[k] || ''; });
    f.moneda.value = a.moneda || 'MXN';
    if (f.moneda.value !== (a.moneda || 'MXN')) {
      f.moneda.insertAdjacentHTML('beforeend', `<option value="${esc(a.moneda)}">${esc(a.moneda)}</option>`);
      f.moneda.value = a.moneda;
    }
    dlgAjustes.showModal();
  });
  $('[data-cerrar]', dlgAjustes).addEventListener('click', () => cerrarHoja(dlgAjustes));
  dlgAjustes.addEventListener('cancel', (e) => { e.preventDefault(); cerrarHoja(dlgAjustes); });

  formAjustes.addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = formAjustes.elements;
    const wa = f.whatsapp.value.replace(/\D/g, '');
    if (wa && wa.length < 10) { aviso('El WhatsApp parece incompleto: incluye el código de país.', 'error'); f.whatsapp.focus(); return; }
    if (wa && wa.length === 10) {
      const seguir = await confirmar('Tu número de WhatsApp tiene 10 dígitos: ¿le falta el código de país? (México: 52)', { si: 'Guardar así', no: 'Corregir', peligro: false });
      if (!seguir) { f.whatsapp.focus(); return; }
    }
    const ajustes = {
      nombre: f.nombre.value.trim(), antesDelNombre: f.antesDelNombre.value.trim(), lema: f.lema.value.trim(),
      whatsapp: wa, instagram: f.instagram.value.trim().replace(/^@/, ''), moneda: f.moneda.value,
      mensajeWhatsApp: f.mensajeWhatsApp.value.trim(),
    };
    const boton = $('#guardar-ajustes');
    boton.disabled = true;
    boton.textContent = 'Guardando…';
    try {
      await B.guardarAjustes(estado.token, ajustes);
      estado.ajustesGuardados = Object.assign({}, estado.ajustesGuardados, ajustes);
      estado.ajustes = D.mezclarAjustes(estado.ajustesGuardados);
      renderLista();
      await cerrarHoja(dlgAjustes);
      aviso('Ajustes guardados ✓');
    } catch (err) { manejarError(err); } finally {
      boton.disabled = false;
      boton.textContent = 'Guardar ajustes';
    }
  });

  $('#reiniciar-prueba').addEventListener('click', async () => {
    if (!(await confirmar('¿Borrar todo lo que guardaste en modo de prueba y volver a las piezas de ejemplo?', { si: 'Borrar', peligro: true }))) return;
    if (B.reiniciar) B.reiniciar();
    await cerrarHoja(dlgAjustes);
    await cargarLista();
    aviso('Listo: volviste a las piezas de ejemplo.');
  });

  /* ================================================================
     CONFIRMAR y AVISOS
     ================================================================ */
  function confirmar(texto, { si = 'Sí', no = 'Cancelar', peligro = true } = {}) {
    const dlg = $('#confirmar');
    $('#confirmar-texto').textContent = texto;
    const bSi = $('#confirmar-si'), bNo = $('#confirmar-no');
    bSi.textContent = si;
    bNo.textContent = no;
    bSi.className = `boton ${peligro ? 'boton-peligro' : 'boton-tinta'}`;
    return new Promise((ok) => {
      const alCerrar = () => { dlg.removeEventListener('close', alCerrar); ok(dlg.returnValue === 'si'); };
      dlg.returnValue = '';
      dlg.addEventListener('close', alCerrar);
      dlg.showModal();
      bNo.focus();
    });
  }

  function aviso(texto, tipo = '') {
    const el = document.createElement('div');
    el.className = `aviso ${tipo}`;
    el.textContent = texto;
    $('#avisos').appendChild(el);
    setTimeout(() => { el.classList.add('sale'); setTimeout(() => el.remove(), 320); }, tipo === 'error' ? 4200 : 2600);
  }

  window.addEventListener('beforeunload', (e) => {
    if (dlgEditor.open && estado.cambios) { e.preventDefault(); e.returnValue = ''; }
  });

  iniciar();
})();
