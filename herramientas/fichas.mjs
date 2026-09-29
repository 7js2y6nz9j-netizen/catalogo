/* ==================================================================
   fichas.mjs · Páginas para compartir cada pieza
   ------------------------------------------------------------------
   Crea p/<pieza>/index.html con la foto, el nombre y el precio de la
   pieza en la vista previa (WhatsApp, Facebook, Instagram…) y manda a
   quien la abre directo a esa pieza del catálogo. También deja una
   copia del catálogo en datos/catalogo.json para que la página abra
   rápido la primera vez.
   La ejecuta el robot de GitHub (.github/workflows/fichas.yml) cada
   hora y cada vez que se sube un cambio. No necesitas correrla tú.
   ================================================================== */
import { readFile, writeFile, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFile(path.join(raiz, f), 'utf8');
const esc = (t) => String(t == null ? '' : t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- lo que se necesita: la dirección del sitio y la del script ---------- */
const indice = await leer('index.html');
const sitio = (indice.match(/property="og:url" content="([^"]+)"/) || [])[1];
const imagenGeneral = (indice.match(/property="og:image" content="([^"]+)"/) || [])[1] || '';
const config = await leer('js/config.js');
const urlScript = (config.match(/urlScript:\s*'([^']*)'/) || [])[1];
if (!sitio || !urlScript) {
  console.log('Falta og:url en index.html o urlScript en js/config.js: no hay fichas que crear.');
  process.exit(0);
}
const base = sitio.endsWith('/') ? sitio : `${sitio}/`;

/* ---------- el catálogo ---------- */
async function traer(url, intentos = 3) {
  for (let i = 1; ; i++) {
    try {
      const r = await fetch(url, { redirect: 'follow' });
      if (!r.ok) throw new Error(`respondió ${r.status}`);
      return r;
    } catch (e) {
      if (i >= intentos) throw e;
      await new Promise((ok) => setTimeout(ok, 3000 * i));
    }
  }
}
const datos = await (await traer(`${urlScript}?accion=catalogo`)).json();
if (!datos || !datos.ok || !Array.isArray(datos.productos)) throw new Error('El servidor no devolvió el catálogo.');
const ajustes = datos.ajustes || {};
const taller = String(ajustes.nombre || 'Inluna').trim();
const moneda = String(ajustes.moneda || 'MXN').toUpperCase();

await mkdir(path.join(raiz, 'datos'), { recursive: true });
await writeFile(path.join(raiz, 'datos/catalogo.json'), `${JSON.stringify({ productos: datos.productos, ajustes })}\n`);

/* ---------- ayudas (igual que en js/datos.js) ---------- */
function idDeDrive(ref) {
  const s = String(ref || '').trim();
  if (/google(usercontent)?\.com/.test(s)) {
    const m = s.match(/\/file\/d\/([\w-]{20,})/) || s.match(/[?&]id=([\w-]{20,})/) || s.match(/googleusercontent\.com\/d\/([\w-]{20,})/);
    if (m) return m[1];
  }
  return /^[\w-]{25,}$/.test(s) ? s : null;
}
function formatoPrecio(precio) {
  if (precio === '' || precio == null) return '';
  const fmt = (n) => {
    try { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda, minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }).format(n); } catch (e) { return `$${n}`; }
  };
  if (typeof precio === 'number') return fmt(precio);
  const s = String(precio).trim();
  if (/^\$?\s*[\d.,]+$/.test(s)) { const n = Number(s.replace(/[$\s,]/g, '')); if (isFinite(n)) return fmt(n); }
  return s;
}
const ESTADOS = { disponible: 'Disponible', encargo: 'Sobre pedido', agotado: 'Agotado' };
const estadoDe = (v) => {
  const s = String(v || '').toLowerCase();
  if (s.startsWith('agot') || s.startsWith('vendid')) return 'agotado';
  if (s.includes('encargo') || s.includes('pedido')) return 'encargo';
  if (s.startsWith('ocult') || s.startsWith('borrador')) return 'oculto';
  return 'disponible';
};

/* ---------- la foto de cada pieza (se descarga una vez, a 800 px) ---------- */
const MANIFIESTO = path.join(raiz, 'p/.fichas.json');
let previo = {};
try { previo = JSON.parse(await readFile(MANIFIESTO, 'utf8')); } catch (e) { /* primera vez */ }
const nuevo = {};

async function fotoDe(id, ref) {
  const carpeta = path.join(raiz, 'p', id);
  const drive = idDeDrive(ref);
  if (!drive) return /^https?:\/\//.test(ref) ? ref : '';
  const antes = previo[id];
  if (antes && antes.ref === ref && antes.archivo && existsSync(path.join(carpeta, antes.archivo))) {
    nuevo[id] = antes;
    return `${base}p/${id}/${antes.archivo}`;
  }
  for (const url of [`https://lh3.googleusercontent.com/d/${drive}=w800`, `https://drive.google.com/thumbnail?id=${drive}&sz=w800`]) {
    try {
      const r = await traer(url, 2);
      const tipo = r.headers.get('content-type') || '';
      if (!/^image\/(jpeg|png|webp)/.test(tipo)) continue;
      const ext = tipo.includes('png') ? 'png' : tipo.includes('webp') ? 'webp' : 'jpg';
      const bytes = Buffer.from(await r.arrayBuffer());
      if (bytes.length < 500) continue;
      for (const f of await readdir(carpeta).catch(() => [])) if (f.startsWith('foto.')) await rm(path.join(carpeta, f));
      await writeFile(path.join(carpeta, `foto.${ext}`), bytes);
      nuevo[id] = { ref, archivo: `foto.${ext}` };
      return `${base}p/${id}/foto.${ext}`;
    } catch (e) { /* probar la otra dirección */ }
  }
  return '';
}

/* ---------- la página de cada pieza ---------- */
function pagina(p, id, imagen) {
  const precio = formatoPrecio(p.precio);
  const estado = ESTADOS[estadoDe(p.estado)] || '';
  const desc = String(p.descripcion || '').replace(/\s+/g, ' ').trim();
  const resumen = [[estado, precio].filter(Boolean).join(' · '), desc.length > 150 ? `${desc.slice(0, 147)}…` : desc].filter(Boolean).join('. ');
  const titulo = `${p.nombre}${precio ? ` · ${precio}` : ''}`;
  const destino = `../../#p/${encodeURIComponent(id)}`;
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(p.nombre)} · ${esc(taller)}</title>
  <meta name="description" content="${esc(resumen)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="${esc(taller)} · catálogo del taller">
  <meta property="og:url" content="${esc(`${base}p/${id}/`)}">
  <meta property="og:title" content="${esc(titulo)}">
  <meta property="og:description" content="${esc(resumen || `Mira esta pieza del taller de ${taller}`)}">
  <meta property="og:image" content="${esc(imagen || imagenGeneral)}">
  <meta property="og:image:alt" content="${esc(p.nombre)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="theme-color" content="#f4eee1">
  <link rel="icon" href="../../img/icono.svg" type="image/svg+xml">
  <script>location.replace(${JSON.stringify(destino)});</script>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; padding: 24px; box-sizing: border-box;
      background: #f4eee1; color: #3a2a1f; font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif; text-align: center; }
    img { width: min(80vw, 360px); height: auto; border-radius: 180px 180px 16px 16px; border: 2px solid #3a2a1f; }
    h1 { margin: 16px 0 4px; font-family: Georgia, serif; font-style: italic; font-weight: 500; }
    a { color: #16803a; font-weight: 600; }
  </style>
</head>
<body>
  <main>
    ${imagen ? `<img src="${esc(imagen)}" alt="${esc(p.nombre)}">` : ''}
    <h1>${esc(p.nombre)}</h1>
    ${precio ? `<p>${esc(precio)}</p>` : ''}
    <p><a href="${esc(destino)}">Ver la pieza en el catálogo de ${esc(taller)}</a></p>
  </main>
</body>
</html>
`;
}

/* ---------- crear, actualizar y borrar ---------- */
await mkdir(path.join(raiz, 'p'), { recursive: true });
const hechas = new Set();
for (const p of datos.productos) {
  const id = String(p.id || '').trim();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(id) || estadoDe(p.estado) === 'oculto') continue;
  await mkdir(path.join(raiz, 'p', id), { recursive: true });
  const ref = String((Array.isArray(p.fotos) ? p.fotos[0] : String(p.fotos || '').split(/\s+/)[0]) || '').split('|')[0].trim();
  const imagen = await fotoDe(id, ref);
  await writeFile(path.join(raiz, 'p', id, 'index.html'), pagina(p, id, imagen));
  hechas.add(id);
}
for (const d of await readdir(path.join(raiz, 'p'), { withFileTypes: true })) {
  if (d.isDirectory() && !hechas.has(d.name)) await rm(path.join(raiz, 'p', d.name), { recursive: true, force: true });
}
await writeFile(MANIFIESTO, `${JSON.stringify(nuevo, null, 1)}\n`);
console.log(`Listo: ${hechas.size} fichas para compartir (${Object.keys(nuevo).length} con foto).`);
