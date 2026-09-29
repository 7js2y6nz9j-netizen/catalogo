/**
 * ==================================================================
 *  INLUNA · Servidor del catálogo (Google Apps Script, gratis)
 * ==================================================================
 *  Guarda tus piezas en esta hoja de cálculo y las fotos en tu
 *  Google Drive. El catálogo y el panel hablan con este script.
 *
 *  PASOS (con más detalle en LEEME.md):
 *   1. En tu hoja de Google: Extensiones → Apps Script.
 *   2. Borra lo que haya y pega TODO este archivo. Guarda (💾).
 *   3. Cambia CLAVE_DEL_PANEL (aquí abajo) por tu propia clave.
 *   4. Arriba elige la función «configurar» y toca ▶ Ejecutar.
 *      Google pedirá permisos: es tu propio script, acéptalos.
 *   5. Implementar → Nueva implementación → tipo «Aplicación web»:
 *        · Ejecutar como: Yo
 *        · Quién tiene acceso: Cualquier usuario
 *   6. Copia la URL que termina en /exec y pégala en js/config.js
 *
 *  ¿Cambiaste la clave? Vuelve a ejecutar «configurar» (no hace
 *  falta volver a implementar). ¿Cambiaste el código? Implementar →
 *  Gestionar implementaciones → ✏️ → Versión: Nueva → Implementar.
 * ==================================================================
 */

const CLAVE_DEL_PANEL = 'cambia-esta-clave';

const HOJA_PIEZAS = 'piezas';
const HOJA_AJUSTES = 'ajustes';
const COLUMNAS = ['id', 'nombre', 'precio', 'categoria', 'descripcion', 'fotos', 'estado', 'destacado', 'animacion', 'color',
  'medidas', 'entrega', 'minimo', 'tallas', 'colores', 'materiales', 'orden', 'actualizado'];
// (columnas que se guardan como texto, tal cual)
const COLUMNAS_TEXTO = ['id', 'nombre', 'categoria', 'descripcion', 'fotos', 'animacion', 'color', 'medidas', 'entrega', 'tallas', 'colores', 'materiales'];
const ESTADOS = ['disponible', 'encargo', 'agotado', 'oculto'];
const ANIMACIONES = ['auto', 'vapor', 'colgar', 'girar', 'hojear', 'brillo', 'flores', 'llama', 'ninguna'];
const AJUSTES_INICIALES = [
  ['nombre', 'Inluna'],
  ['antesDelNombre', 'el taller de'],
  ['lema', 'Piezas hechas a mano, dibujadas con tinta azul.'],
  ['whatsapp', ''],
  ['instagram', ''],
  ['moneda', 'MXN'],
  ['mensajeWhatsApp', '¡Hola! Me interesa {pieza} ({precio}) que vi en tu catálogo: {enlace}'],
  ['sobreQuien', ''],
  ['sobreProceso', ''],
  ['sobreMateriales', ''],
  ['sobreFoto', ''],
];
const NOMBRE_CARPETA = 'Inluna · fotos del catálogo';
const DIAS_SESION = 30;
const SEGUNDOS_CACHE = 300;
const ALIAS = {
  'categoría': 'categoria', 'coleccion': 'categoria', 'colección': 'categoria',
  'descripción': 'descripcion', 'foto': 'fotos', 'imagen': 'fotos', 'imagenes': 'fotos', 'imágenes': 'fotos',
  'favorita': 'destacado', 'destacada': 'destacado', 'favoritas': 'destacado',
  'medida': 'medidas', 'tiempo de entrega': 'entrega', 'entrega aproximada': 'entrega',
  'cantidad minima': 'minimo', 'pedido minimo': 'minimo', 'talla': 'tallas', 'material': 'materiales',
};

/* ==================================================================
   1 · CONFIGURAR (ejecútala una vez desde el editor)
   ================================================================== */
function configurar() {
  if (!CLAVE_DEL_PANEL || CLAVE_DEL_PANEL === 'cambia-esta-clave' || String(CLAVE_DEL_PANEL).length < 6) {
    throw new Error('Primero cambia CLAVE_DEL_PANEL (arriba del todo) por una clave tuya de al menos 6 caracteres.');
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abre este script desde tu hoja de Google (Extensiones → Apps Script).');
  const props = PropertiesService.getScriptProperties();
  props.setProperty('HOJA_ID', ss.getId());
  props.setProperty('CLAVE_HASH', hashear_(CLAVE_DEL_PANEL));
  // Al cambiar la clave se cierran todas las sesiones abiertas
  Object.keys(props.getProperties()).forEach(function (k) { if (k.indexOf('sesion_') === 0) props.deleteProperty(k); });

  let hoja = ss.getSheetByName(HOJA_PIEZAS);
  if (!hoja) hoja = ss.insertSheet(HOJA_PIEZAS, 0);
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS])
      .setFontWeight('bold').setBackground('#2742b0').setFontColor('#ffffff');
    hoja.setFrozenRows(1);
    const anchos = { id: 150, nombre: 200, precio: 90, categoria: 130, descripcion: 320, fotos: 260, estado: 110, destacado: 90, animacion: 110, color: 90,
      medidas: 140, entrega: 120, minimo: 70, tallas: 130, colores: 150, materiales: 150, orden: 70, actualizado: 150 };
    COLUMNAS.forEach(function (c, i) {
      hoja.setColumnWidth(i + 1, anchos[c] || 120);
      if (COLUMNAS_TEXTO.indexOf(c) >= 0) hoja.getRange(2, i + 1, 999, 1).setNumberFormat('@');
    });
    const colEstado = COLUMNAS.indexOf('estado') + 1, colDest = COLUMNAS.indexOf('destacado') + 1, colAnim = COLUMNAS.indexOf('animacion') + 1;
    hoja.getRange(2, colEstado, 999, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(ESTADOS, true).setAllowInvalid(true).build());
    hoja.getRange(2, colDest, 999, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireCheckbox().build());
    hoja.getRange(2, colAnim, 999, 1).setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList(ANIMACIONES, true).setAllowInvalid(true).build());
    hoja.getRange(2, COLUMNAS.indexOf('descripcion') + 1, 999, 2).setWrap(true);
  } else {
    asegurarColumnas_(hoja);
  }

  let aj = ss.getSheetByName(HOJA_AJUSTES);
  if (!aj) {
    aj = ss.insertSheet(HOJA_AJUSTES);
    aj.getRange('A:B').setNumberFormat('@');
    aj.getRange(1, 1, 1, 2).setValues([['ajuste', 'valor']]).setFontWeight('bold').setBackground('#2742b0').setFontColor('#ffffff');
    aj.getRange(2, 1, AJUSTES_INICIALES.length, 2).setValues(AJUSTES_INICIALES);
    aj.setColumnWidth(1, 170);
    aj.setColumnWidth(2, 460);
    aj.setFrozenRows(1);
  }

  const carpeta = carpeta_();
  borrarCache_();
  Logger.log('✅ Listo. Tus fotos se guardarán en: ' + carpeta.getUrl());
  Logger.log('👉 Ahora: Implementar → Nueva implementación → Aplicación web (Ejecutar como: Yo · Acceso: Cualquier usuario).');
}

/* Si editas la hoja a mano, el catálogo se actualiza al momento */
function onEdit() { borrarCache_(); }

/* ==================================================================
   2 · CATÁLOGO PÚBLICO (lo lee la página)
   ================================================================== */
function doGet(e) {
  const accion = (e && e.parameter && e.parameter.accion) || 'catalogo';
  try {
    if (accion === 'catalogo') return salida_(catalogoPublico_());
    if (accion === 'ping') return json_({ ok: true, hola: 'Inluna' });
    return json_({ ok: false, error: 'Acción desconocida.' });
  } catch (err) {
    return json_({ ok: false, error: mensaje_(err) });
  }
}

function catalogoPublico_() {
  const cache = CacheService.getScriptCache();
  const guardado = cache.get('catalogo');
  if (guardado) return guardado;
  const productos = leerPiezas_(true).filas
    .map(limpiarPieza_)
    .filter(function (p) { return p.estado !== 'oculto'; });
  const texto = JSON.stringify({ ok: true, productos: productos, ajustes: leerAjustes_(), generado: new Date().toISOString() });
  if (texto.length < 90000) {
    try { cache.put('catalogo', texto, SEGUNDOS_CACHE); } catch (err) { /* catálogo muy grande: se lee directo de la hoja */ }
  }
  return texto;
}

/* ==================================================================
   3 · PANEL (necesita tu clave)
   ================================================================== */
function doPost(e) {
  let d;
  try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) { return json_({ ok: false, error: 'Datos inválidos.' }); }
  try {
    switch (d.accion) {
      case 'login': return json_(login_(d.clave));
      case 'verificar': exigirSesion_(d.token); return json_({ ok: true });
      case 'listar': exigirSesion_(d.token); return json_(listar_());
      case 'guardar': exigirSesion_(d.token); return json_(conCandado_(function () { return guardar_(d.producto); }));
      case 'eliminar': exigirSesion_(d.token); return json_(conCandado_(function () { return eliminar_(d.id); }));
      case 'ordenar': exigirSesion_(d.token); return json_(conCandado_(function () { return ordenar_(d.ids || []); }));
      case 'subirFoto': exigirSesion_(d.token); return json_(subirFoto_(d));
      case 'guardarAjustes': exigirSesion_(d.token); return json_(conCandado_(function () { return guardarAjustes_(d.ajustes || {}); }));
      case 'salir': cerrarSesion_(d.token); return json_({ ok: true });
      default: return json_({ ok: false, error: 'Acción desconocida.' });
    }
  } catch (err) {
    const r = { ok: false, error: mensaje_(err) };
    if (err && err.codigo) r.codigo = err.codigo;
    return json_(r);
  }
}

function listar_() {
  return { ok: true, productos: leerPiezas_(true).filas.map(limpiarPieza_), ajustes: leerAjustes_() };
}

function guardar_(p) {
  if (!p || !String(p.nombre || '').trim()) throw new Error('La pieza necesita un nombre.');
  asegurarColumnas_(hojaPiezas_());
  const datos = leerPiezas_(false);
  const fila = p.id ? datos.filas.filter(function (f) { return String(f.id) === String(p.id); })[0] : null;
  // cada foto llega como "original|dibujo" (el dibujo es la versión con el estilo del catálogo)
  const fotos = (Array.isArray(p.fotos) ? p.fotos : listaFotos_(p.fotos))
    .map(function (x) { return String(x).trim(); })
    .filter(function (x) { return x && x.indexOf('data:') !== 0; });
  const registro = {
    id: fila ? String(fila.id) : nuevoId_(p.nombre, datos.filas),
    nombre: String(p.nombre).trim().slice(0, 120),
    precio: typeof p.precio === 'number' ? p.precio : String(p.precio == null ? '' : p.precio).trim().slice(0, 40),
    categoria: String(p.categoria || '').trim().slice(0, 60),
    descripcion: String(p.descripcion || '').trim().slice(0, 3000),
    fotos: fotos.join('\n'),
    estado: normalizarEstado_(p.estado),
    destacado: p.destacado === true || p.destacado === 'true',
    animacion: normalizarAnimacion_(p.animacion),
    color: normalizarColor_(p.color),
    medidas: String(p.medidas || '').trim().slice(0, 120),
    entrega: String(p.entrega || '').trim().slice(0, 80),
    minimo: normalizarMinimo_(p.minimo),
    tallas: listaCorta_(p.tallas),
    colores: listaCorta_(p.colores),
    materiales: listaCorta_(p.materiales),
    orden: fila ? (Number(fila.orden) || datos.filas.length + 1) : siguienteOrden_(datos.filas),
    actualizado: new Date(),
  };
  const valores = datos.encabezados.map(function (k) {
    if (k && Object.prototype.hasOwnProperty.call(registro, k)) {
      const v = registro[k];
      return typeof v === 'string' ? textoSeguro_(v) : v;
    }
    return fila && k ? fila[k] : '';
  });
  if (fila) datos.hoja.getRange(fila._fila, 1, 1, valores.length).setValues([valores]);
  else datos.hoja.appendRow(valores);
  borrarCache_();
  return { ok: true, producto: limpiarPieza_(registro) };
}

function eliminar_(id) {
  const datos = leerPiezas_(false);
  const fila = datos.filas.filter(function (f) { return String(f.id) === String(id); })[0];
  if (!fila) return { ok: true };
  datos.hoja.deleteRow(fila._fila);
  // Manda a la papelera de Drive las fotos (y sus dibujos) que ya no usa ninguna otra pieza
  const partes = function (lista) {
    return listaFotos_(lista).reduce(function (acc, t) { return acc.concat(String(t).split('|')); }, []).filter(Boolean);
  };
  const enUso = {};
  datos.filas.forEach(function (f) {
    if (f !== fila) partes(f.fotos).forEach(function (x) { enUso[idDrive_(x) || x] = true; });
  });
  const carpetaId = PropertiesService.getScriptProperties().getProperty('CARPETA_ID');
  partes(fila.fotos).forEach(function (ref) {
    const idF = idDrive_(ref);
    if (!idF || enUso[idF] || !carpetaId) return;
    try {
      const archivo = DriveApp.getFileById(idF);
      const padres = archivo.getParents();
      while (padres.hasNext()) { if (padres.next().getId() === carpetaId) { archivo.setTrashed(true); break; } }
    } catch (err) { /* ya no existe */ }
  });
  borrarCache_();
  return { ok: true };
}

function ordenar_(ids) {
  const datos = leerPiezas_(false);
  const col = datos.encabezados.indexOf('orden') + 1;
  if (!col) throw new Error('Falta la columna «orden» en la hoja.');
  const ultima = datos.hoja.getLastRow();
  if (ultima < 2) return { ok: true };
  const pos = {};
  ids.forEach(function (id, i) { pos[String(id)] = i + 1; });
  let extra = ids.length;
  const rango = datos.hoja.getRange(2, col, ultima - 1, 1);
  const valores = rango.getValues();
  datos.filas.forEach(function (f) { valores[f._fila - 2][0] = pos[String(f.id)] || ++extra; });
  rango.setValues(valores);
  borrarCache_();
  return { ok: true };
}

function subirFoto_(d) {
  if (!d.datos) throw new Error('No llegó la foto.');
  const tipo = /^image\/(jpeg|png|webp|gif)$/.test(d.tipo) ? d.tipo : 'image/jpeg';
  const bytes = Utilities.base64Decode(String(d.datos));
  if (bytes.length > 8 * 1024 * 1024) throw new Error('La foto pesa demasiado (máximo 8 MB).');
  const nombre = String(d.nombre || 'foto.jpg').replace(/[^\w.\-]+/g, '-').slice(0, 60);
  const archivo = carpeta_().createFile(Utilities.newBlob(bytes, tipo, nombre));
  try { archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { /* la carpeta ya es pública */ }
  return { ok: true, id: archivo.getId() };
}

function guardarAjustes_(nuevos) {
  const hoja = hojaAjustes_();
  const valores = hoja.getDataRange().getValues();
  AJUSTES_INICIALES.forEach(function (a) {
    const k = a[0];
    if (!Object.prototype.hasOwnProperty.call(nuevos, k)) return;
    const v = textoSeguro_(String(nuevos[k] == null ? '' : nuevos[k]).slice(0, k.indexOf('sobre') === 0 ? 3000 : 600));
    let i = -1;
    for (let r = 0; r < valores.length; r++) { if (String(valores[r][0]).trim() === k) { i = r; break; } }
    if (i >= 0) hoja.getRange(i + 1, 2).setValue(v);
    else hoja.appendRow([k, v]);
  });
  borrarCache_();
  return { ok: true };
}

/* ==================================================================
   4 · SESIONES
   ================================================================== */
function login_(clave) {
  const props = PropertiesService.getScriptProperties();
  const hash = props.getProperty('CLAVE_HASH');
  if (!hash) throw new Error('Falta configurar el panel: en Apps Script ejecuta la función «configurar».');
  const cache = CacheService.getScriptCache();
  const intentos = Number(cache.get('intentos') || 0);
  if (intentos >= 10) throw new Error('Demasiados intentos. Espera 15 minutos y vuelve a probar.');
  if (hashear_(String(clave || '')) !== hash) {
    cache.put('intentos', String(intentos + 1), 900);
    Utilities.sleep(700);
    throw new Error('Clave incorrecta.');
  }
  cache.remove('intentos');
  const token = Utilities.getUuid().replace(/-/g, '') + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
  const hasta = Date.now() + DIAS_SESION * 864e5;
  props.setProperty('sesion_' + token, String(hasta));
  const todas = props.getProperties();
  Object.keys(todas).forEach(function (k) {
    if (k.indexOf('sesion_') === 0 && Number(todas[k]) < Date.now()) props.deleteProperty(k);
  });
  return { ok: true, token: token, hasta: hasta };
}

function exigirSesion_(token) {
  const hasta = token ? Number(PropertiesService.getScriptProperties().getProperty('sesion_' + token)) : 0;
  if (!hasta || hasta < Date.now()) {
    const e = new Error('Tu sesión terminó, vuelve a entrar.');
    e.codigo = 'sesion';
    throw e;
  }
}

function cerrarSesion_(token) {
  if (token) PropertiesService.getScriptProperties().deleteProperty('sesion_' + token);
}

/* ==================================================================
   5 · AYUDANTES
   ================================================================== */
function libro_() {
  const id = PropertiesService.getScriptProperties().getProperty('HOJA_ID');
  if (id) return SpreadsheetApp.openById(id);
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Ejecuta primero la función «configurar».');
  return ss;
}
function hojaPiezas_() {
  const h = libro_().getSheetByName(HOJA_PIEZAS);
  if (!h) throw new Error('No encuentro la hoja «' + HOJA_PIEZAS + '». Ejecuta «configurar».');
  return h;
}
function hojaAjustes_() {
  const h = libro_().getSheetByName(HOJA_AJUSTES);
  if (!h) throw new Error('No encuentro la hoja «' + HOJA_AJUSTES + '». Ejecuta «configurar».');
  return h;
}

function normalizarEncabezados_(fila) {
  return fila.map(function (h) {
    const k = String(h || '').trim().toLowerCase();
    const s = k.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return ALIAS[k] || ALIAS[s] || s;
  });
}

/* Lee la hoja de piezas. Si "completarIds", les pone id a las filas nuevas escritas a mano. */
function leerPiezas_(completarIds) {
  const hoja = hojaPiezas_();
  const valores = hoja.getDataRange().getValues();
  const encabezados = normalizarEncabezados_(valores[0] && valores[0].join('') ? valores[0] : COLUMNAS);
  const filas = [];
  for (let r = 1; r < valores.length; r++) {
    const o = { _fila: r + 1 };
    encabezados.forEach(function (k, j) { if (k) o[k] = valores[r][j]; });
    if (String(o.nombre || '').trim() || String(o.id || '').trim()) filas.push(o);
  }
  const colId = encabezados.indexOf('id') + 1;
  const sinId = filas.filter(function (f) { return !String(f.id || '').trim() && String(f.nombre || '').trim(); });
  if (completarIds && sinId.length && colId) {
    const lock = LockService.getScriptLock();
    if (lock.tryLock(5000)) {
      try {
        sinId.forEach(function (f) {
          f.id = nuevoId_(f.nombre, filas);
          hoja.getRange(f._fila, colId).setValue(f.id);
        });
      } finally { lock.releaseLock(); }
    } else {
      sinId.forEach(function (f) { f.id = slug_(f.nombre) + '-' + f._fila; });
    }
  }
  return { hoja: hoja, encabezados: encabezados, filas: filas };
}

function limpiarPieza_(f) {
  const precio = f.precio instanceof Date ? '' : f.precio;
  return {
    id: String(f.id || ''),
    nombre: String(f.nombre || '').trim(),
    precio: precio === '' || precio == null ? '' : precio,
    categoria: String(f.categoria || '').trim(),
    descripcion: String(f.descripcion || ''),
    fotos: listaFotos_(f.fotos),
    estado: normalizarEstado_(f.estado),
    destacado: f.destacado === true || /^(si|sí|true|verdadero|x|1)$/i.test(String(f.destacado || '').trim()),
    animacion: normalizarAnimacion_(f.animacion),
    color: normalizarColor_(f.color),
    medidas: String(f.medidas || '').trim(),
    entrega: String(f.entrega || '').trim(),
    minimo: normalizarMinimo_(f.minimo),
    tallas: listaCorta_(f.tallas),
    colores: listaCorta_(f.colores),
    materiales: listaCorta_(f.materiales),
    orden: Number(f.orden) || 0,
  };
}

/* Color de la tinta del dibujo (#rrggbb); vacío = azul talavera */
function normalizarColor_(v) {
  const s = String(v || '').trim().toLowerCase();
  return /^#[0-9a-f]{6}$/.test(s) ? s : '';
}

/* Pedido mínimo: un número entero mayor que 1 (vacío = sin mínimo) */
function normalizarMinimo_(v) {
  const n = Math.floor(Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')));
  return n > 1 ? Math.min(n, 100000) : '';
}

/* Variantes para elegir ("CH, MD, G"): texto limpio, separado por comas */
function listaCorta_(v) {
  const partes = Array.isArray(v) ? v : String(v == null ? '' : v).split(/[,;\n]+/);
  const vistas = {};
  return partes.map(function (x) { return String(x).trim().slice(0, 40); })
    .filter(function (x) { const k = x.toLowerCase(); if (!x || vistas[k]) return false; vistas[k] = true; return true; })
    .slice(0, 20).join(', ');
}

function normalizarAnimacion_(v) {
  const s = String(v || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return ANIMACIONES.indexOf(s) >= 0 ? s : 'auto';
}

/* Si la hoja se creó con una versión anterior, agrega las columnas que falten */
function asegurarColumnas_(hoja) {
  if (hoja.getLastRow() === 0) {
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold').setBackground('#2742b0').setFontColor('#ffffff');
    return;
  }
  const ultima = Math.max(1, hoja.getLastColumn());
  const actuales = normalizarEncabezados_(hoja.getRange(1, 1, 1, ultima).getValues()[0]);
  let col = ultima;
  COLUMNAS.forEach(function (c) {
    if (actuales.indexOf(c) < 0) {
      col += 1;
      hoja.getRange(1, col).setValue(c).setFontWeight('bold').setBackground('#2742b0').setFontColor('#ffffff');
      if (COLUMNAS_TEXTO.indexOf(c) >= 0) hoja.getRange(2, col, 999, 1).setNumberFormat('@');
      if (c === 'animacion') {
        hoja.getRange(2, col, 999, 1).setNumberFormat('@').setDataValidation(
          SpreadsheetApp.newDataValidation().requireValueInList(ANIMACIONES, true).setAllowInvalid(true).build());
      }
    }
  });
}

function leerAjustes_() {
  const res = {};
  hojaAjustes_().getDataRange().getValues().slice(1).forEach(function (r) {
    const k = String(r[0] || '').trim();
    if (k) res[k] = String(r[1] == null ? '' : r[1]);
  });
  return res;
}

function normalizarEstado_(v) {
  const s = String(v || '').trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (!s) return 'disponible';
  if (s.indexOf('agot') === 0 || s.indexOf('vendid') === 0 || s === 'no') return 'agotado';
  if (s.indexOf('encargo') >= 0 || s.indexOf('pedido') >= 0) return 'encargo';
  if (s.indexOf('ocult') === 0 || s.indexOf('borrador') === 0) return 'oculto';
  return 'disponible';
}

function listaFotos_(v) {
  if (Array.isArray(v)) return v.map(String).filter(Boolean);
  return String(v || '').split(/[\s;]+/).reduce(function (acc, t) {
    const partes = t.indexOf('/') >= 0 ? t.split(/,(?=https?:)/) : t.split(',');
    partes.forEach(function (x) { x = x.replace(/^,+|,+$/g, '').trim(); if (x) acc.push(x); });
    return acc;
  }, []);
}

function idDrive_(ref) {
  const s = String(ref || '').trim();
  let m = s.match(/\/file\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/) || s.match(/googleusercontent\.com\/d\/([\w-]{20,})/);
  if (m) return m[1];
  return /^[\w-]{25,}$/.test(s) ? s : null;
}

function carpeta_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('CARPETA_ID');
  if (id) {
    try { const c = DriveApp.getFolderById(id); if (!c.isTrashed()) return c; } catch (err) { /* se borró */ }
  }
  const c = DriveApp.createFolder(NOMBRE_CARPETA);
  try { c.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { /* cuentas con restricciones */ }
  props.setProperty('CARPETA_ID', c.getId());
  return c;
}

function nuevoId_(nombre, filas) {
  const base = slug_(nombre).slice(0, 48) || 'pieza';
  const usados = {};
  filas.forEach(function (f) { usados[String(f.id)] = true; });
  let id = base, n = 2;
  while (usados[id]) id = base + '-' + (n++);
  usados[id] = true;
  return id;
}

function siguienteOrden_(filas) {
  return filas.reduce(function (m, f) { return Math.max(m, Number(f.orden) || 0); }, 0) + 1;
}

function slug_(t) {
  return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/* Evita que un texto que empieza con = + - @ se vuelva fórmula en la hoja */
function textoSeguro_(t) {
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function hashear_(texto) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, 'inluna:' + texto, Utilities.Charset.UTF_8);
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function conCandado_(fn) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('El taller está ocupado guardando otra cosa. Intenta de nuevo en unos segundos.');
  try { return fn(); } finally { lock.releaseLock(); }
}

function borrarCache_() {
  try { CacheService.getScriptCache().remove('catalogo'); } catch (err) { /* nada */ }
}

function mensaje_(err) { return String((err && err.message) || err || 'Error desconocido'); }
function json_(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }
function salida_(texto) { return ContentService.createTextOutput(texto).setMimeType(ContentService.MimeType.JSON); }
