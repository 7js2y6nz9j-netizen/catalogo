/* ==================================================================
   datos.js · De dónde salen las piezas
   ------------------------------------------------------------------
   · Con urlScript (config.js): lee y escribe en tu hoja de Google
     a través de tu Apps Script (gratis).
   · Sin urlScript: "modo de prueba". El catálogo muestra las piezas
     de ejemplo y el panel guarda los cambios solo en ese navegador.
   ================================================================== */
(function () {
  'use strict';
  const CFG = window.INLUNA_CONFIG || {};
  const CLAVE_CACHE = 'inluna:catalogo:v1';
  const CLAVE_PRUEBA = 'inluna:prueba:v1';

  /* ---------- utilidades ---------- */
  const sinAcentos = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
  function slug(t) {
    return sinAcentos(t).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'pieza';
  }
  function normalizarEstado(v) {
    const s = sinAcentos(v).toLowerCase().trim();
    if (!s) return 'disponible';
    if (s.startsWith('agot') || s.startsWith('vendid') || s === 'no') return 'agotado';
    if (s.includes('encargo') || s.includes('pedido')) return 'encargo';
    if (s.startsWith('ocult') || s.startsWith('borrador')) return 'oculto';
    return 'disponible';
  }
  const esVerdadero = (v) => v === true || /^(si|sí|true|verdadero|x|1|yes)$/i.test(String(v == null ? '' : v).trim());
  function listaFotos(v) {
    if (Array.isArray(v)) return v.map((s) => String(s).trim()).filter(Boolean);
    return String(v || '').split(/[\s;]+/)
      .flatMap((t) => (t.includes('/') ? t.split(/,(?=https?:|dibujo:|patron:)/) : t.split(',')))
      .map((t) => t.replace(/^,+|,+$/g, '').trim())
      .filter(Boolean);
  }

  /* Cada foto puede venir en pareja "original|dibujo": la original se ve al
     abrir la pieza y el dibujo (versión con el estilo del taller) en el catálogo */
  function parFoto(ref) {
    const [original, dibujo] = String(ref || '').split('|');
    return { original: (original || '').trim(), dibujo: (dibujo || '').trim() };
  }
  const ANIMACIONES = ['auto', 'vapor', 'colgar', 'girar', 'hojear', 'brillo', 'flores', 'llama', 'ninguna'];
  function normalizarAnimacion(v) {
    const s = sinAcentos(v).toLowerCase().trim();
    return ANIMACIONES.includes(s) ? s : 'auto';
  }
  /* Color de la tinta del dibujo: '' = azul talavera (el de siempre) */
  function normalizarColor(v) {
    const s = String(v == null ? '' : v).trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(s) ? s : '';
  }
  /* Variantes ("CH, M, G") → ['CH', 'M', 'G'] */
  function listaVariantes(v) {
    const partes = Array.isArray(v) ? v : String(v == null ? '' : v).split(/[,;\n]+/);
    const vistas = new Set();
    return partes.map((x) => String(x).trim().slice(0, 40)).filter((x) => {
      const k = sinAcentos(x).toLowerCase();
      if (!x || vistas.has(k)) return false;
      vistas.add(k);
      return true;
    }).slice(0, 20);
  }
  /* Pedido mínimo: entero mayor que 1 (0 = sin mínimo) */
  function normalizarMinimo(v) {
    const n = Math.floor(Number(String(v == null ? '' : v).replace(/[^\d.]/g, '')));
    return n > 1 ? Math.min(n, 100000) : 0;
  }
  const textoCorto = (v, max) => String(v == null ? '' : v).trim().slice(0, max);
  /* Precio → { min, max } en números ("350", "$1,200", "170 - 300"); null si es texto */
  function rangoPrecio(precio) {
    if (typeof precio === 'number') return isFinite(precio) ? { min: precio, max: precio } : null;
    const nums = (String(precio == null ? '' : precio).match(/\d[\d,]*(\.\d+)?/g) || [])
      .map((t) => Number(t.replace(/,(?=\d{3}\b)/g, '').replace(/,/g, '.'))).filter((n) => isFinite(n) && n > 0);
    return nums.length ? { min: Math.min(...nums), max: Math.max(...nums) } : null;
  }

  function normalizarProducto(p, i) {
    const nombre = String(p.nombre == null ? '' : p.nombre).trim();
    const pares = listaFotos(p.fotos).map(parFoto).filter((x) => x.original || x.dibujo);
    return {
      id: String(p.id || '').trim() || `${slug(nombre)}-${i + 1}`,
      nombre: nombre || 'Pieza sin nombre',
      precio: p.precio == null ? '' : p.precio,
      categoria: String(p.categoria == null ? '' : p.categoria).trim(),
      descripcion: String(p.descripcion == null ? '' : p.descripcion).trim(),
      fotos: pares.map((x) => x.original || x.dibujo),
      dibujos: pares.map((x) => x.dibujo),
      estado: normalizarEstado(p.estado),
      destacado: esVerdadero(p.destacado),
      animacion: normalizarAnimacion(p.animacion),
      color: normalizarColor(p.color),
      medidas: textoCorto(p.medidas, 120),
      entrega: textoCorto(p.entrega, 80),
      minimo: normalizarMinimo(p.minimo),
      tallas: listaVariantes(p.tallas),
      colores: listaVariantes(p.colores),
      materiales: listaVariantes(p.materiales),
      orden: Number(p.orden) || 1000 + i,
    };
  }
  /* Vuelve a unir fotos y dibujos para guardarlos */
  const unirFotos = (fotos, dibujos) => fotos.map((f, i) => (dibujos && dibujos[i] ? `${f}|${dibujos[i]}` : f));

  const CAMPOS_AJUSTES = ['nombre', 'antesDelNombre', 'lema', 'whatsapp', 'instagram', 'moneda', 'mensajeWhatsApp',
    'sobreQuien', 'sobreProceso', 'sobreMateriales', 'sobreFoto'];
  function mezclarAjustes(a) {
    const res = {};
    CAMPOS_AJUSTES.forEach((k) => {
      const v = a && a[k] != null ? String(a[k]).trim() : '';
      res[k] = v !== '' ? v : String(CFG[k] == null ? '' : CFG[k]);
    });
    res.whatsapp = res.whatsapp.replace(/\D/g, '');
    res.instagram = res.instagram.replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/\/.*$/, '').trim();
    res.moneda = (res.moneda || 'MXN').toUpperCase();
    return res;
  }

  /* Prepara lo que llega del servidor para mostrarlo en el catálogo */
  function procesar(datos) {
    const productos = (datos.productos || []).map(normalizarProducto).filter((p) => p.estado !== 'oculto');
    productos.sort((a, b) => a.orden - b.orden);
    return { productos, ajustes: mezclarAjustes(datos.ajustes) };
  }

  /* ---------- imágenes ---------- */
  function idDeDrive(ref) {
    const s = String(ref || '').trim();
    if (/google(usercontent)?\.com/.test(s)) {
      const m = s.match(/\/file\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/) || s.match(/googleusercontent\.com\/d\/([\w-]{20,})/);
      if (m) return m[1];
    }
    if (/^[\w-]{25,}$/.test(s)) return s; // solo el ID de Drive
    return null;
  }
  function urlImagen(ref, ancho = 800) {
    if (!ref) return '';
    if (/^(dibujo|patron):/.test(ref)) return window.Arte ? window.Arte.imagenDeDibujo(ref) : '';
    if (/^(data|blob):/.test(ref)) return ref;
    const id = idDeDrive(ref);
    if (id) return `https://lh3.googleusercontent.com/d/${id}=w${ancho}`;
    return ref;
  }
  function urlImagenAlterna(ref, ancho = 800) {
    const id = idDeDrive(ref);
    return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${ancho}` : '';
  }

  function formatoPrecio(precio, moneda) {
    if (precio === '' || precio == null) return '';
    const fmt = (n) => {
      try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda || 'MXN', minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n);
      } catch (e) { return '$' + n; }
    };
    if (typeof precio === 'number') return fmt(precio);
    const s = String(precio).trim();
    if (/^\$?\s*[\d.,]+$/.test(s)) {
      const n = Number(s.replace(/[$\s,]/g, ''));
      if (isFinite(n)) return fmt(n);
    }
    return s; // texto libre: "Desde $200", "Consultar"…
  }

  /* ---------- servidores ---------- */
  function conTiempo(promesa, ms) {
    return Promise.race([promesa, new Promise((_, no) => setTimeout(() => no(new Error('Tiempo de espera agotado')), ms))]);
  }

  function backendGoogle(url) {
    async function leerRespuesta(r) {
      if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
      let j;
      try { j = await r.json(); } catch (e) {
        throw new Error('La URL del Apps Script no devolvió datos. Revisa que esté publicado como "Cualquier persona".');
      }
      if (!j.ok) { const e = new Error(j.error || 'Error del servidor'); e.codigo = j.codigo; throw e; }
      return j;
    }
    const get = (params) => {
      const u = url + (url.includes('?') ? '&' : '?') + new URLSearchParams(Object.assign({}, params, { t: Date.now() }));
      return fetch(u, { redirect: 'follow' }).then(leerRespuesta);
    };
    // Cuerpo como texto plano: así el navegador no hace "preflight" y Apps Script lo acepta.
    const post = (datos) => fetch(url, { method: 'POST', body: JSON.stringify(datos), redirect: 'follow' }).then(leerRespuesta);
    return {
      tipo: 'google',
      catalogo: () => get({ accion: 'catalogo' }),
      login: (clave) => post({ accion: 'login', clave }),
      verificar: (token) => post({ accion: 'verificar', token }),
      listar: (token) => post({ accion: 'listar', token }),
      guardar: (token, producto) => post({ accion: 'guardar', token, producto }),
      eliminar: (token, id) => post({ accion: 'eliminar', token, id }),
      subirFoto: (token, foto) => post(Object.assign({ accion: 'subirFoto', token }, foto)),
      ordenar: (token, ids) => post({ accion: 'ordenar', token, ids }),
      guardarAjustes: (token, ajustes) => post({ accion: 'guardarAjustes', token, ajustes }),
      salir: (token) => post({ accion: 'salir', token }),
    };
  }

  /* Modo de prueba: todo vive en el navegador (localStorage) */
  function backendPrueba() {
    const pausa = (ms) => new Promise((r) => setTimeout(r, ms));
    const copia = (o) => JSON.parse(JSON.stringify(o));
    const leer = () => {
      try { const d = JSON.parse(localStorage.getItem(CLAVE_PRUEBA)); if (d && Array.isArray(d.productos)) return d; } catch (e) { /* nada */ }
      const demo = window.INLUNA_DEMO || { productos: [], ajustes: {} };
      return { productos: copia(demo.productos), ajustes: copia(demo.ajustes || {}) };
    };
    const escribir = (d) => {
      try { localStorage.setItem(CLAVE_PRUEBA, JSON.stringify(d)); } catch (e) {
        throw new Error('Este navegador ya no tiene espacio para más fotos de prueba. Conecta tu hoja de Google para guardar de verdad.');
      }
    };
    return {
      tipo: 'prueba',
      async catalogo() { await pausa(200); return Object.assign({ ok: true }, leer()); },
      async login(clave) { await pausa(350); if (!String(clave || '').trim()) throw new Error('Escribe cualquier clave para entrar al modo de prueba.'); return { ok: true, token: 'prueba' }; },
      async verificar() { return { ok: true }; },
      async listar() { await pausa(250); return Object.assign({ ok: true }, leer()); },
      async guardar(_t, producto) {
        await pausa(350);
        const d = leer();
        const p = Object.assign({}, producto);
        const i = d.productos.findIndex((x) => x.id === p.id);
        if (i >= 0) d.productos[i] = Object.assign(d.productos[i], p);
        else {
          p.id = `${slug(p.nombre)}-${Math.random().toString(36).slice(2, 6)}`;
          p.orden = d.productos.reduce((m, x) => Math.max(m, Number(x.orden) || 0), 0) + 1;
          d.productos.push(p);
        }
        escribir(d);
        return { ok: true, producto: i >= 0 ? d.productos[i] : p };
      },
      async eliminar(_t, id) { await pausa(300); const d = leer(); d.productos = d.productos.filter((x) => x.id !== id); escribir(d); return { ok: true }; },
      async subirFoto(_t, foto) { await pausa(400); return { ok: true, id: `data:${foto.tipo};base64,${foto.datos}` }; },
      async ordenar(_t, ids) {
        await pausa(250);
        const d = leer();
        d.productos.forEach((p) => { const k = ids.indexOf(p.id); if (k >= 0) p.orden = k + 1; });
        escribir(d);
        return { ok: true };
      },
      async guardarAjustes(_t, ajustes) { await pausa(300); const d = leer(); d.ajustes = Object.assign({}, d.ajustes, ajustes); escribir(d); return { ok: true, ajustes: d.ajustes }; },
      async salir() { return { ok: true }; },
      reiniciar() { localStorage.removeItem(CLAVE_PRUEBA); },
    };
  }

  // (en tu computadora, "?prueba" abre las piezas de ejemplo para probar sin tocar tu hoja)
  const pruebaLocal = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) && /[?&]prueba\b/.test(location.search);
  const url = pruebaLocal ? '' : String(CFG.urlScript || '').trim();
  const backend = url ? backendGoogle(url) : backendPrueba();

  /* ---------- carga del catálogo (con copia guardada) ---------- */
  function leerCache() {
    try {
      const c = JSON.parse(localStorage.getItem(CLAVE_CACHE));
      if (c && c.url === url && Array.isArray(c.productos)) return c;
    } catch (e) { /* nada */ }
    return null;
  }

  /* Copia del catálogo publicada junto a la página (datos/catalogo.json, la
     renueva cada hora el robot de GitHub): llega en un instante la primera vez */
  function copiaDelSitio() {
    if (backend.tipo !== 'google' || !/^https?:/.test(location.protocol)) return Promise.resolve(null);
    return conTiempo(fetch('datos/catalogo.json', { cache: 'no-cache' }).then((r) => (r.ok ? r.json() : null)), 4000)
      .then((d) => (d && Array.isArray(d.productos) ? Object.assign(procesar(d), { fuente: 'copia' }) : null))
      .catch(() => null);
  }

  /* Devuelve { inmediato, rapido, fresco }:
     · inmediato: la última copia guardada en este teléfono (para abrir al instante) o null
     · rapido: promesa con la copia publicada en el sitio (o null)
     · fresco: promesa con los datos recién pedidos al servidor */
  function cargar() {
    const cache = backend.tipo === 'google' ? leerCache() : null;
    const fresco = conTiempo(backend.catalogo(), cache ? 15000 : 12000).then((datos) => {
      const res = procesar(datos);
      res.fuente = backend.tipo;
      if (backend.tipo === 'google') {
        try { localStorage.setItem(CLAVE_CACHE, JSON.stringify({ url, productos: datos.productos, ajustes: datos.ajustes, guardado: Date.now() })); } catch (e) { /* sin espacio */ }
      }
      return res;
    });
    let inmediato = null;
    if (cache) { inmediato = procesar(cache); inmediato.fuente = 'copia'; }
    return { inmediato, rapido: cache ? Promise.resolve(null) : copiaDelSitio(), fresco };
  }

  window.Datos = {
    backend, cargar, procesar, normalizarProducto, normalizarEstado, normalizarAnimacion, normalizarColor, mezclarAjustes,
    urlImagen, urlImagenAlterna, idDeDrive, formatoPrecio, slug, listaFotos, esVerdadero, parFoto, unirFotos,
    listaVariantes, normalizarMinimo, rangoPrecio, sinAcentos,
    ANIMACIONES, modoPrueba: backend.tipo === 'prueba',
  };
})();
