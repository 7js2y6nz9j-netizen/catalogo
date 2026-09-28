/* ==================================================================
   Piezas de ejemplo · se muestran mientras no conectes tu hoja de
   Google (config.js → urlScript). Las imágenes son dibujos generados
   por código ("dibujo:objeto/patrón"), así que no pesan nada.
   ================================================================== */
window.INLUNA_DEMO = {
  ajustes: {},
  productos: [
    { id: 'taza-seigaiha', nombre: 'Taza Seigaiha', precio: 320, categoria: 'Cerámica', estado: 'disponible', destacado: true, orden: 1,
      descripcion: 'Taza de cerámica pintada a mano con escamas de olas.\n350 ml · apta para microondas.',
      fotos: ['dibujo:taza/escamas', 'dibujo:taza/puntos'] },
    { id: 'plato-mar-de-noche', nombre: 'Plato Mar de noche', precio: 450, categoria: 'Cerámica', estado: 'disponible', orden: 2,
      descripcion: 'Plato de 24 cm con borde de olas y un destello al centro.',
      fotos: ['dibujo:plato/olas', 'dibujo:plato/escamas'] },
    { id: 'jarron-ramitas', nombre: 'Jarrón Ramitas', precio: 680, categoria: 'Cerámica', estado: 'encargo', orden: 3,
      descripcion: 'Jarrón de 22 cm de alto con ramitas pintadas una por una.\nSe hace sobre pedido (2 a 3 semanas).',
      fotos: ['dibujo:jarron/ramitas', 'dibujo:jarron/flores'] },
    { id: 'azulejo-destellos', nombre: 'Azulejo Destellos', precio: 180, categoria: 'Cerámica', estado: 'disponible', orden: 4,
      descripcion: 'Azulejo decorativo de 15 × 15 cm, con gancho para colgar.',
      fotos: ['dibujo:azulejo/destellos', 'dibujo:azulejo/rombos'] },
    { id: 'libreta-arcos', nombre: 'Libreta Arcos', precio: 220, categoria: 'Papelería', estado: 'disponible', destacado: true, orden: 5,
      descripcion: 'Libreta A5 con espiral y 80 hojas punteadas.',
      fotos: ['dibujo:libreta/arcoiris'] },
    { id: 'libreta-tejido', nombre: 'Libreta Tejido', precio: 220, categoria: 'Papelería', estado: 'agotado', orden: 6,
      descripcion: 'Libreta A5 con espiral y 80 hojas lisas.',
      fotos: ['dibujo:libreta/tejido'] },
    { id: 'lamina-cielo', nombre: 'Lámina Cielo', precio: 350, categoria: 'Láminas', estado: 'disponible', orden: 7,
      descripcion: 'Impresión tamaño carta en papel de algodón, firmada a mano.',
      fotos: ['dibujo:lamina/estrellas'] },
    { id: 'lamina-jardin', nombre: 'Lámina Jardín', precio: 350, categoria: 'Láminas', estado: 'disponible', destacado: true, orden: 8,
      descripcion: 'Impresión tamaño carta en papel de algodón, firmada a mano.',
      fotos: ['dibujo:lamina/flores'] },
    { id: 'lamina-oleaje', nombre: 'Lámina Oleaje', precio: 350, categoria: 'Láminas', estado: 'disponible', orden: 9,
      descripcion: 'Impresión tamaño carta en papel de algodón, firmada a mano.',
      fotos: ['dibujo:lamina/olas'] },
    { id: 'bolsa-ajedrez', nombre: 'Bolsa Ajedrez', precio: 390, categoria: 'Textil', estado: 'disponible', orden: 10,
      descripcion: 'Tote bag de manta, estampada a mano con tinta textil.',
      fotos: ['dibujo:bolsa/ajedrez'] },
    { id: 'bolsa-lluvia', nombre: 'Bolsa Lluvia', precio: 390, categoria: 'Textil', estado: 'disponible', orden: 11,
      descripcion: 'Tote bag de manta, estampada a mano con tinta textil.',
      fotos: ['dibujo:bolsa/gotas'] },
  ],
};
