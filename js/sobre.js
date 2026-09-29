/* ==================================================================
   sobre.js · «Sobre el taller» (#sobre)
   ------------------------------------------------------------------
   Quién está detrás, cómo se trabaja y con qué materiales. Los textos
   se escriben en el panel → Ajustes (o en config.js).
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, A = window.Arte, D = window.Datos;
  const { $, esc, espera, reducido, estado } = I;
  const dlg = $('#sobre');

  const lineas = (t) => String(t || '').split(/\n+/).map((x) => x.trim()).filter(Boolean);
  const lista = (t) => String(t || '').split(/[,;\n]+/).map((x) => x.trim()).filter(Boolean);

  function html() {
    const a = estado.ajustes;
    const quien = lineas(a.sobreQuien);
    const intro = quien.length ? quien
      : [`${a.nombre} es un taller pequeño: cada pieza se diseña y se hace aquí, con cuidado y una por una.`, 'Si no encuentras justo lo que buscas, cuéntame tu idea y la hacemos juntos.'];
    const pasos = lineas(a.sobreProceso);
    const materiales = lista(a.sobreMateriales);
    const wa = I.enlaceWhatsApp(), ig = I.enlaceInstagram();
    return `<article class="hoja hoja-sobre">
      <button class="boton-icono hoja-cerrar sobre-cerrar" type="button" data-cerrar aria-label="Cerrar">${A.ICONOS.cerrar}</button>
      <header class="sobre-cabeza">
        ${a.sobreFoto
          ? `<span class="sobre-foto marco"><span class="marco-img">${I.imagen(a.sobreFoto, `El taller de ${a.nombre}`, 640)}</span>${A.marcoArco()}</span>`
          : `<span class="sobre-emblema" aria-hidden="true">${A.logo({ clase: 'sobre-hojas' })}</span>`}
        <p class="hoja-antes">${esc(a.antesDelNombre)} ${esc(a.nombre)}</p>
        <h2 class="hoja-titulo sobre-titulo" id="sobre-titulo">Sobre el taller</h2>
        ${a.lema ? `<p class="sobre-lema">${esc(a.lema)}</p>` : ''}
      </header>
      <section class="sobre-bloque" aria-labelledby="sobre-quien">
        <h3 class="sobre-subtitulo" id="sobre-quien"><span>✦</span> Quién está detrás</h3>
        ${intro.map((t) => `<p>${esc(t)}</p>`).join('')}
      </section>
      ${pasos.length ? `<section class="sobre-bloque" aria-labelledby="sobre-proceso">
        <h3 class="sobre-subtitulo" id="sobre-proceso"><span>✦</span> Así trabajo</h3>
        <ol class="sobre-pasos">${pasos.map((t, i) => `<li style="--i:${i}"><span class="sobre-num">${i + 1}</span><span>${esc(t)}</span></li>`).join('')}</ol>
      </section>` : ''}
      ${materiales.length ? `<section class="sobre-bloque" aria-labelledby="sobre-materiales">
        <h3 class="sobre-subtitulo" id="sobre-materiales"><span>✦</span> Materiales y técnicas</h3>
        <ul class="sobre-materiales">${materiales.map((t) => `<li>${A.ICONOS.hoja}<span>${esc(t)}</span></li>`).join('')}</ul>
      </section>` : ''}
      <footer class="sobre-pie">
        <a class="boton boton-tinta" href="#cotizar">${A.ICONOS.mensaje}<span>Cotizar una idea</span></a>
        ${wa || D.modoPrueba ? `<a class="boton" href="${wa || '#'}" target="_blank" rel="noopener" data-wa>${A.ICONOS.whatsapp}<span>WhatsApp</span></a>` : ''}
        ${ig ? `<a class="boton" href="${ig}" target="_blank" rel="noopener">${A.ICONOS.instagram}<span>@${esc(a.instagram)}</span></a>` : ''}
      </footer>
    </article>`;
  }

  function abrir() {
    dlg.innerHTML = html();
    I.prepararImagenes(dlg);
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
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg || e.target.closest('[data-cerrar]')) I.volver();
  });

  window.Sobre = { abrir, cerrar, cerrarYa, abierta: () => dlg.open };
})();
