/* ==================================================================
   animaciones.js · Pequeñas animaciones "de uso" de cada pieza
   (las usan el catálogo y el panel para la vista previa)
   · automática: se elige por el nombre de la pieza
   ================================================================== */
(function () {
  'use strict';
  const A = window.Arte, D = window.Datos;

  const NOMBRES = {
    auto: 'Automática', vapor: 'Vapor (tazas)', colgar: 'Balanceo (colgar)', girar: 'Girar (platos)',
    hojear: 'Hojear (libretas)', brillo: 'Brillo', flores: 'Flores', llama: 'Llama (velas)', ninguna: 'Sin animación',
  };
  const REGLAS = [
    ['llama', /\b(vela|velas|veladora|incienso|candel)/],
    ['vapor', /\b(taza|tazas|tazon|mug|cuenco|tetera|jarro|cafe|te|chocolate)\b/],
    ['girar', /\b(plato|platos|platon|disco|vinil|charola|posavasos?)\b/],
    ['hojear', /\b(libreta|libretas|cuaderno|libro|agenda|bitacora|diario|sketchbook|zine|fanzine|postal(es)?)\b/],
    ['flores', /\b(jarron|florero|maceta|planta|flor(es)?)\b/],
    ['colgar', /\b(lamina|laminas|cuadro|print|poster|ilustracion|arete|aretes|collar|colgante|llavero|bolsa|bolsas|tote|morral|mochila|atrapasuenos|movil|guirnalda)\b/],
    ['brillo', /\b(azulejo|azulejos|joya|anillo|pulsera|espejo|vidrio|esmalte|sticker|estampa|pin|broche)\b/],
  ];

  function tipo(p) {
    const a = String((p && p.animacion) || 'auto');
    if (a === 'ninguna') return '';
    if (a !== 'auto' && NOMBRES[a]) return a;
    const texto = D.slug(`${(p && p.nombre) || ''} ${(p && p.categoria) || ''}`).replace(/-/g, ' ');
    for (const [t, re] of REGLAS) if (re.test(texto)) return t;
    return '';
  }

  const DESTELLO = (x, y, r) => A.destello(x, y, r, 0.2);
  function capa(t) {
    switch (t) {
      case 'vapor':
        return '<span class="anim-capa vapor" aria-hidden="true"><svg viewBox="0 0 60 70"><path class="v1" d="M20,68C12,56 28,48 20,36C12,24 26,16 20,4"/><path class="v2" d="M31,68C23,56 39,48 31,36C23,24 37,16 31,4"/><path class="v3" d="M42,68C34,56 50,48 42,36C34,24 48,16 42,4"/></svg></span>';
      case 'llama':
        return '<span class="anim-capa llama" aria-hidden="true"><svg viewBox="0 0 30 46"><path class="ll-a" d="M15,2C22,14 28,22 27,32A12,12 0 0 1 3,32C2,22 8,14 15,2Z"/><path class="ll-b" d="M15,18C19,25 21,29 20,34A5,5 0 0 1 10,34C9,29 11,25 15,18Z"/></svg></span>';
      case 'hojear':
        return '<span class="anim-capa hoja" aria-hidden="true"></span>';
      case 'brillo':
        return '<span class="anim-capa brillo" aria-hidden="true"></span>';
      case 'flores':
        return `<span class="anim-capa flores" aria-hidden="true"><svg viewBox="0 0 60 30"><path class="f1" d="${DESTELLO(14, 18, 6)}"/><path class="f2" d="${DESTELLO(30, 10, 7.5)}"/><path class="f3" d="${DESTELLO(46, 18, 6)}"/></svg></span>`;
      default:
        return '';
    }
  }

  window.Animaciones = { NOMBRES, tipo, capa };
})();
