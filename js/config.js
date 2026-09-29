/* ==================================================================
   CONFIGURACIÓN DEL CATÁLOGO · Inluna
   ------------------------------------------------------------------
   Este es el único archivo que necesitas editar para conectar tu
   catálogo con tu hoja de Google (ver LEEME.md, paso 2).

   Los textos, WhatsApp e Instagram también se pueden cambiar después
   desde el panel (admin.html → Ajustes), sin tocar este archivo.
   ================================================================== */
window.INLUNA_CONFIG = {
  // 1) URL de tu Apps Script (termina en /exec).
  //    Mientras esté vacía, el catálogo muestra piezas de ejemplo y el
  //    panel funciona en "modo de prueba" (solo guarda en ese teléfono).
  urlScript: 'https://script.google.com/macros/s/AKfycbwpe0up2Mk3S_m-WP1UMzPcNnuw28ylkYkTNO3Eept3RJASHEdtdefXUwl71e8EBbhPZA/exec',

  // 2) Valores iniciales (el panel → Ajustes los puede sobrescribir)
  nombre: 'Inluna',
  antesDelNombre: 'el taller de',
  lema: 'Piezas hechas a mano, dibujadas con tinta azul.',
  whatsapp: '',   // código de país + número, sin "+" ni espacios. Ej: 5215512345678
  instagram: '',  // tu usuario, sin "@". Ej: inluna.taller
  moneda: 'MXN',  // MXN, USD, COP, ARS, CLP, PEN, EUR...
  mensajeWhatsApp: '¡Hola! Me interesa {pieza} ({precio}) que vi en tu catálogo: {enlace}',

  // 3) Colores (el azul queda solo para la talavera)
  colores: {
    verde: '#00aa1f',   // hojas y logo de Inluna
    acento: '#16803a',  // botones y detalles (un verde que se lee bien)
    cafe: '#8b5a35',    // ramas y techo
    oscura: '#3a2a1f',  // tinta café (contornos y textos)
    tinta: '#2742b0',   // azul talavera (azulejos, frisos, macetas y marcos)
    dorado: '#d99a2b',  // estrellas y flores
    papel: '#f4eee1',   // crema
  },
};
