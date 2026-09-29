/* ==================================================================
   cotizar.js · Cotización guiada (para lo que se hace sobre pedido)
   ------------------------------------------------------------------
   Cuatro pasos cortos: qué necesitas → cuántas piezas → para cuándo
   → revisar y enviar. Al final arma el mensaje de WhatsApp.
   Se abre desde la ficha de una pieza «sobre pedido» (#cotizar/<id>)
   o para una idea nueva, desde el contacto (#cotizar).
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, D = window.Datos;
  const { $, $$, esc, espera, reducido, estado } = I;
  const dlg = $('#cotizar');
  const PASOS = [
    { k: 'que', titulo: '¿Qué necesitas?' },
    { k: 'cuantas', titulo: '¿Cuántas piezas?' },
    { k: 'cuando', titulo: '¿Para cuándo?' },
    { k: 'enviar', titulo: 'Revisa y envía' },
  ];
  const PLAZOS = [['sin-prisa', 'Sin prisa'], ['dos-semanas', 'En unas 2 semanas'], ['este-mes', 'Este mes'], ['fecha', 'Tengo una fecha']];
  let c = null; // el borrador de la cotización

  function nuevo(p) {
    const op = p && window.Ficha ? window.Ficha.opcionesDe(p) : {};
    const minimo = p ? Math.max(1, p.minimo || 1) : 1;
    return {
      id: p ? p.id : '', paso: 0, tipo: '', idea: '', variantes: Object.assign({}, op.variantes),
      cantidad: Math.max(minimo, op.cantidad || minimo), plazo: '', fecha: '', nombre: '', mensaje: '', editado: false,
    };
  }
  const pieza = () => (c && c.id ? estado.productos.find((x) => x.id === c.id) : null);
  const hoyISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
  function fechaBonita(iso) {
    const [y, m, d] = String(iso).split('-').map(Number);
    if (!y || !m || !d) return iso;
    try { return new Date(y, m - 1, d).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return iso; }
  }

  function mensaje() {
    const p = pieza();
    const l = ['¡Hola! Quiero cotizar un encargo:'];
    if (p) l.push(`• Pieza: ${p.nombre} — ${I.enlacePieza(p)}`);
    else if (c.tipo) l.push(`• Tipo: ${c.tipo}`);
    if (c.idea.trim()) l.push(`• Lo que necesito: ${c.idea.trim()}`);
    const v = I.textoVariantes(c.variantes);
    if (v) l.push(`• ${v}`);
    l.push(`• Cantidad: ${c.cantidad} ${c.cantidad === 1 ? 'pieza' : 'piezas'}`);
    const plazo = c.plazo === 'fecha' ? (c.fecha ? `para el ${fechaBonita(c.fecha)}` : '') : (PLAZOS.find(([k]) => k === c.plazo) || [])[1];
    if (plazo) l.push(`• ¿Para cuándo?: ${plazo}`);
    if (c.nombre.trim()) l.push(`• Mi nombre: ${c.nombre.trim()}`);
    return l.join('\n');
  }

  /* ---------- cada paso ---------- */
  function pasoQue(p) {
    const tipos = estado.categorias.filter((x) => !x.especial).map((x) => x.nombre);
    const grupos = p ? I.VARIANTES.filter(([lista]) => p[lista].length) : [];
    return `${p ? '' : `<fieldset class="cot-grupo">
        <legend>¿De qué tipo? <small>(opcional)</small></legend>
        <div class="variante-opciones">${tipos.concat(['Otra cosa']).map((t) => `<label class="opcion"><input type="radio" name="tipo" value="${esc(t)}"${c.tipo === t ? ' checked' : ''}><span>${esc(t)}</span></label>`).join('')}</div>
      </fieldset>`}
      <label class="campo-cat">
        <span class="campo-cat-etiqueta">${p ? 'Cuéntame cómo la quieres' : 'Cuéntame tu idea'}</span>
        <textarea name="idea" rows="4" maxlength="800" placeholder="${p ? 'Ej. Con el logo de mi negocio, en tonos cálidos…' : 'Ej. Llaveros con el nombre de mis invitados, en madera…'}">${esc(c.idea)}</textarea>
        <span class="campo-cat-ayuda">Medidas, colores, textos, para qué es… lo que se te ocurra.</span>
      </label>
      ${grupos.map(([lista, clave, et]) => `<fieldset class="cot-grupo">
        <legend>${et}</legend>
        <div class="variante-opciones">${p[lista].map((v) => `<label class="opcion"><input type="radio" name="var-${clave}" value="${esc(v)}"${c.variantes[clave] === v || p[lista].length === 1 ? ' checked' : ''}><span>${esc(v)}</span></label>`).join('')}</div>
      </fieldset>`).join('')}`;
  }
  function pasoCuantas(p) {
    const minimo = p ? Math.max(1, p.minimo || 1) : 1;
    const rapidas = [1, 5, 10, 25, 50, 100].filter((n) => n >= minimo).slice(0, 5);
    if (minimo > 1 && rapidas[0] !== minimo) rapidas.unshift(minimo);
    return `<div class="cot-cantidad">
        ${I.contadorHTML('cantidad', c.cantidad, minimo, 'Cantidad de piezas')}
        <span class="cot-unidad">${c.cantidad === 1 ? 'pieza' : 'piezas'}</span>
      </div>
      <div class="cot-rapidas" role="group" aria-label="Cantidades rápidas">${rapidas.map((n) => `<button type="button" class="chip${n === c.cantidad ? ' activo' : ''}" data-cantidad="${n}">${n}</button>`).join('')}</div>
      ${minimo > 1 ? `<p class="cot-nota">${A.ICONOS.caja}<span>El pedido mínimo de esta pieza es de <strong>${minimo} piezas</strong>.</span></p>` : ''}`;
  }
  function pasoCuando(p) {
    return `<div class="variante-opciones cot-plazos">${PLAZOS.map(([k, t]) => `<label class="opcion"><input type="radio" name="plazo" value="${k}"${c.plazo === k ? ' checked' : ''}><span>${t}</span></label>`).join('')}</div>
      <label class="campo-cat cot-fecha"${c.plazo === 'fecha' ? '' : ' hidden'}>
        <span class="campo-cat-etiqueta">Fecha</span>
        <input type="date" name="fecha" min="${hoyISO()}" value="${esc(c.fecha)}">
      </label>
      ${p && p.entrega ? `<p class="cot-nota">${A.ICONOS.reloj}<span>Tiempo de entrega aproximado: <strong>${esc(p.entrega)}</strong>.</span></p>` : ''}`;
  }
  function pasoEnviar() {
    if (!c.editado) c.mensaje = mensaje();
    const wa = I.enlaceWhatsAppTexto(c.mensaje);
    return `<label class="campo-cat">
        <span class="campo-cat-etiqueta">Tu nombre <small>(opcional)</small></span>
        <input name="nombre" autocomplete="given-name" maxlength="60" value="${esc(c.nombre)}" placeholder="Para saber cómo llamarte">
      </label>
      <label class="campo-cat">
        <span class="campo-cat-etiqueta">Tu mensaje <small>(puedes cambiarlo)</small></span>
        <textarea name="mensaje" rows="8" class="cot-mensaje">${esc(c.mensaje)}</textarea>
      </label>
      ${wa ? '' : '<p class="cot-nota">Copia tu mensaje y mándalo por Instagram.</p>'}`;
  }

  function render({ enfocar = true } = {}) {
    const p = pieza();
    const paso = PASOS[c.paso];
    const ultimo = c.paso === PASOS.length - 1;
    const cuerpo = [pasoQue, pasoCuantas, pasoCuando, pasoEnviar][c.paso](p);
    const wa = ultimo ? I.enlaceWhatsAppTexto(c.mensaje) : '';
    const ig = I.mensajeInstagram();
    dlg.innerHTML = `<form class="hoja hoja-cotizar" novalidate>
      <header class="hoja-cabeza">
        <div><p class="hoja-antes">cotiza tu encargo · paso ${c.paso + 1} de ${PASOS.length}</p><h2 class="hoja-titulo" id="cotizar-titulo">${paso.titulo}</h2></div>
        <button class="boton-icono hoja-cerrar" type="button" data-cerrar aria-label="Cerrar">${A.ICONOS.cerrar}</button>
      </header>
      <ol class="cot-progreso" aria-hidden="true">${PASOS.map((x, i) => `<li class="${i < c.paso ? 'hecho' : i === c.paso ? 'actual' : ''}"></li>`).join('')}</ol>
      <div class="hoja-cuerpo">
        ${p ? `<div class="cot-pieza"><span class="cot-pieza-foto">${window.Taller.imagenCatalogo(p, 200)}</span>
          <div><p class="cot-pieza-nombre">${esc(p.nombre)}</p><p class="cot-pieza-dato">${esc(I.precio(p) || '')}${p.entrega ? ` · entrega: ${esc(p.entrega)}` : ''}</p></div></div>` : ''}
        <div class="cot-paso" data-paso="${paso.k}">${cuerpo}</div>
        <p class="cot-error" role="alert" hidden></p>
      </div>
      <footer class="hoja-pie cot-pie">
        ${c.paso ? '<button type="button" class="boton boton-plano" data-atras>Atrás</button>' : '<span></span>'}
        ${ultimo
          ? (wa ? `<a class="boton boton-tinta" href="${esc(wa)}" target="_blank" rel="noopener" data-wa data-enviar-cotizacion>${A.ICONOS.whatsapp}<span>Enviar por WhatsApp</span></a>`
            : `<button type="button" class="boton boton-tinta" data-copiar>${A.ICONOS.mensaje}<span>Copiar mensaje</span></button>${ig ? `<a class="boton" href="${ig}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>Instagram</span></a>` : ''}`)
          : '<button type="submit" class="boton boton-tinta" data-siguiente-paso>Siguiente <span aria-hidden="true">›</span></button>'}
      </footer>
    </form>`;
    I.prepararImagenes(dlg);
    if (!enfocar) return;
    const primero = $('.cot-paso textarea, .cot-paso input:not([type=radio]), .cot-paso input[type=radio]', dlg);
    if (primero && I.puntero) primero.focus({ preventScroll: true });
  }

  /* ---------- leer y validar ---------- */
  function leer() {
    const form = $('form', dlg);
    if (!form) return;
    const el = form.elements;
    if (el.tipo) { const r = form.querySelector('input[name="tipo"]:checked'); c.tipo = r ? r.value : ''; }
    if (el.idea) c.idea = el.idea.value;
    I.VARIANTES.forEach(([, k]) => { const r = form.querySelector(`input[name="var-${k}"]:checked`); if (r) c.variantes[k] = r.value; });
    if (el.cantidad) c.cantidad = I.leerContador(el.cantidad);
    if (el.plazo) { const r = form.querySelector('input[name="plazo"]:checked'); c.plazo = r ? r.value : ''; }
    if (el.fecha) c.fecha = el.fecha.value;
    if (el.nombre) c.nombre = el.nombre.value;
    if (el.mensaje) c.mensaje = el.mensaje.value;
  }
  function error(texto) {
    const e = $('.cot-error', dlg);
    e.textContent = texto;
    e.hidden = !texto;
    if (texto) I.vibrar(20);
  }
  function valido() {
    const p = pieza();
    if (c.paso === 0) {
      if (!p && c.idea.trim().length < 4) { error('Cuéntame un poquito de tu idea para poder cotizarla.'); $('textarea', dlg).focus(); return false; }
      const falta = p && I.VARIANTES.find(([lista, k]) => p[lista].length > 1 && !c.variantes[k]);
      if (falta) { error(`Elige ${{ Talla: 'una talla', Color: 'un color', Material: 'un material' }[falta[2]]}.`); return false; }
    }
    if (c.paso === 1) {
      const minimo = p ? Math.max(1, p.minimo || 1) : 1;
      if (c.cantidad < minimo) { error(`El pedido mínimo es de ${minimo} piezas.`); return false; }
    }
    if (c.paso === 2 && c.plazo === 'fecha' && !c.fecha) { error('Elige la fecha en el calendario (o una de las otras opciones).'); return false; }
    return true;
  }
  function irA(paso) {
    c.paso = Math.max(0, Math.min(PASOS.length - 1, paso));
    render();
    const cuerpo = $('.hoja-cuerpo', dlg);
    if (cuerpo) cuerpo.scrollTop = 0;
    if (!reducido) $('.cot-paso', dlg).animate([{ opacity: 0, transform: 'translateX(18px)' }, { opacity: 1, transform: 'none' }], { duration: 240, easing: 'ease-out' });
  }

  /* ---------- abrir / cerrar ---------- */
  function abrir({ id = '' } = {}) {
    const p = id ? estado.productos.find((x) => x.id === id) : null;
    if (!c || c.id !== (p ? p.id : '') || !dlg.open) c = nuevo(p);
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
  dlg.addEventListener('submit', (e) => {
    e.preventDefault();
    leer();
    error('');
    if (valido()) irA(c.paso + 1);
  });
  dlg.addEventListener('click', async (e) => {
    const t = e.target;
    if (t === dlg || t.closest('[data-cerrar]')) { I.volver(); return; }
    if (t.closest('[data-atras]')) { leer(); error(''); c.editado = false; irA(c.paso - 1); return; }
    const n = t.closest('[data-cantidad]');
    if (n) {
      c.cantidad = Number(n.dataset.cantidad);
      const input = $('input[name="cantidad"]', dlg);
      input.value = c.cantidad;
      $$('[data-cantidad]', dlg).forEach((b) => b.classList.toggle('activo', b === n));
      $('.cot-unidad', dlg).textContent = c.cantidad === 1 ? 'pieza' : 'piezas';
      return;
    }
    if (t.closest('[data-enviar-cotizacion]')) { leer(); t.closest('a').href = I.enlaceWhatsAppTexto(c.mensaje); return; }
    if (t.closest('[data-copiar]')) {
      leer();
      try { await navigator.clipboard.writeText(c.mensaje); I.aviso('Mensaje copiado'); } catch (err) { window.prompt('Copia tu mensaje:', c.mensaje); }
    }
  });
  dlg.addEventListener('input', (e) => {
    const t = e.target;
    error('');
    if (t.name === 'cantidad') {
      c.cantidad = I.leerContador(t);
      $$('[data-cantidad]', dlg).forEach((b) => b.classList.toggle('activo', Number(b.dataset.cantidad) === c.cantidad));
      const u = $('.cot-unidad', dlg);
      if (u) u.textContent = c.cantidad === 1 ? 'pieza' : 'piezas';
    }
    if (t.name === 'plazo') {
      const fecha = $('.cot-fecha', dlg);
      fecha.hidden = t.value !== 'fecha';
      if (!fecha.hidden) $('input', fecha).focus();
    }
    if (t.name === 'mensaje') { c.editado = true; c.mensaje = t.value; }
    if (t.name === 'nombre') {
      c.nombre = t.value;
      if (!c.editado) { c.mensaje = mensaje(); const m = $('textarea[name="mensaje"]', dlg); if (m) m.value = c.mensaje; }
    }
    const a = $('[data-enviar-cotizacion]', dlg);
    if (a) a.href = I.enlaceWhatsAppTexto(c.mensaje);
  });

  window.Cotizar = { abrir, cerrar, cerrarYa, abierta: () => dlg.open };
})();
