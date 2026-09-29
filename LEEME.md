# Catálogo digital · Inluna

> **Ya está en línea y conectado a tu hoja de Google:**
> - Catálogo (para Instagram): **https://7js2y6nz9j-netizen.github.io/catalogo/**
>   (la dirección corta **https://7js2y6nz9j-netizen.github.io** también lleva al catálogo; la redirección vive en el repositorio `7js2y6nz9j-netizen.github.io`, carpeta `inluna-inicio` en tu computadora)
> - Tu panel (entra con tu clave): **https://7js2y6nz9j-netizen.github.io/catalogo/admin.html**
> - Tus piezas se guardan en la hoja **"Catálogo Inluna"** de tu Google Drive y las fotos en la carpeta **"Inluna · fotos del catálogo"**.
>
> Los pasos 1 a 3 de abajo ya están hechos; quedan como referencia por si algún día hay que repetirlos.

Tu catálogo en línea, con tu arte:

1. **Carga:** las seis hojas verdes de tu logo se abren una a una, giran y luego vuelan a su lugar, a la derecha del nombre «Inluna».
2. **Entrada (la fachada):** una casita de ladrillo blanco con la enredadera cayendo desde el techo, un árbol que deja caer sus hojas y sombras de hojas en la pared. La clienta **desliza o toca las puertas** (verdes) para entrar. Antes puede jugar:
   - el **árbol** se sacude y suelta hojas; los **postigos** de la ventana se abren y cierran; las **celosías de talavera** se iluminan; los **arbolitos** en maceta se sacuden; tu **logo de hojas**, junto al nombre, gira al tocarlo;
   - todo se mueve un poco al inclinar el teléfono;
   - sonido opcional (apagado al inicio; botón **sin sonido / sonido** arriba a la derecha).
   - **La fachada es siempre el inicio:** dentro del taller hay un botón **salir** (arriba a la izquierda) y el botón **atrás** del teléfono también saca por la puerta. Se sale caminando hacia atrás por la puerta, que se cierra, y se puede volver a entrar cuando se quiera.
   - **Después de pedir por WhatsApp:** cuando la clienta regresa al catálogo, sale del taller y la recibe un «¡Gracias por tu pedido! Aquí te espero cuando quieras volver».
3. **Interior (galería de arcos):** se desliza de lado entre arcos, uno por colección, con tu logo de hojas grande al fondo, lámparas y enredaderas. Al tocar un arco, la colección se abre desde él.
4. **Piezas que se mueven:** cada tarjeta flota y tiene una pequeña animación de su uso (vapor en las tazas, hojas que pasan en las libretas, platos que giran, láminas y aretes que se mecen, flores que crecen en jarrones, la llama de una vela, brillo en azulejos y joyas).
5. **Ficha de cada pieza:** aquí sí se ve **la foto original**, con precio, estado y botones para **pedir por WhatsApp**, escribir por Instagram o compartir.
6. **Contacto:** un panel verde con las hojas de tu logo, olas y tus azulejos de talavera (botón **Hacer un pedido** y al final de cada colección).

**Tus fotos se convierten solas al estilo del catálogo:** cuando subes una foto desde el panel, el teléfono hace una versión "dibujada con tinta azul" y guarda **las dos** en tu Drive. En los arcos y tarjetas se ve el dibujo; al abrir la pieza, la foto original.

**Cada pieza puede llevar su propio color de tinta:** en el panel, bajo la vista previa, toca **Color del dibujo** y se abre un abanico como el de los marcadores con **201 colores**: 13 familias (amarillo, naranja, coral, rojo, rosa, magenta, violeta, índigo, azul, turquesa, verde, verde limón y tierra), cada una en intensidad viva, media y suave, de claro a oscuro, más unos pocos grises. Toca un color para elegirlo y **Más tonos de…** para ver las tiras completas de esa familia. **Azul talavera** (B26) es el color de siempre. El dibujo se vuelve a entintar al momento, sin subir otra vez las fotos.

Todo es **gratis**, sin suscripciones:

| Pieza | Dónde vive | Costo |
|---|---|---|
| La página (catálogo + panel) | GitHub Pages | $0 |
| Tus piezas (nombre, precio, etc.) | Una hoja de Google Sheets | $0 |
| Tus fotos | Una carpeta de tu Google Drive | $0 |
| El "servidor" que conecta todo | Google Apps Script | $0 |

```
  Tu teléfono (panel)  ──guarda──►  Tu hoja de Google + fotos en tu Drive
                                                │
  Clientas (Instagram)  ◄──lee──  catálogo publicado en GitHub Pages
```

---

## 0 · Pruébalo ya (sin configurar nada)

Abre `index.html` con Chrome o Edge (doble clic). Verás el catálogo con **piezas de ejemplo** (dibujadas por código con tus patrones).

Abre también `admin.html`: el panel funciona en **modo de prueba** con cualquier clave. Lo que guardes se queda solo en ese navegador, y el catálogo de ese mismo navegador lo muestra.

---

## 1 · Crea tu hoja de Google y el "servidor" gratis (10 min, mejor en computadora)

1. Entra a <https://sheets.new> con tu cuenta de Gmail (usa una **cuenta personal**; las de escuela o trabajo a veces bloquean compartir fotos). Ponle de nombre **Catálogo Inluna**.
2. En el menú: **Extensiones → Apps Script**.
3. Borra lo que aparece y pega **todo** el contenido del archivo `apps-script/Codigo.gs`. Toca 💾 (Guardar).
4. En la línea `const CLAVE_DEL_PANEL = 'cambia-esta-clave';` escribe **tu propia clave** entre las comillas (mínimo 6 caracteres; es la que usarás en el panel). Guarda otra vez.
5. Arriba, en el selector de funciones, elige **configurar** y toca **▶ Ejecutar**.
   - Google pedirá permisos: **Revisar permisos** → elige tu cuenta.
   - Aparecerá *"Google no verificó esta app"*: es normal, porque el script es tuyo. Toca **Configuración avanzada → Ir a (proyecto) (no seguro) → Permitir**.
   - Abajo verás `✅ Listo`. Se crearon las pestañas **piezas** y **ajustes** en tu hoja y la carpeta **"Inluna · fotos del catálogo"** en tu Drive.
6. Toca **Implementar → Nueva implementación**. En el engrane ⚙ elige **Aplicación web** y llena:
   - **Ejecutar como:** Yo
   - **Quién tiene acceso:** Cualquier usuario *(no "cualquier usuario con cuenta de Google")*
7. Toca **Implementar** y copia la **URL de la aplicación web** (termina en `/exec`).
8. Prueba: pega esa URL en el navegador. Debes ver algo como `{"ok":true,"productos":[],...}`. ¡Tu servidor funciona!

> **¿Olvidaste la clave?** Cámbiala en el script y vuelve a ejecutar **configurar** (no hace falta volver a implementar).
> **¿Cambiaste el código del script?** Ve a **Implementar → Gestionar implementaciones → ✏️ → Versión: Nueva versión → Implementar**. La URL no cambia.
> **¿Ya tenías instalado el script de la versión anterior?** Pega el `Codigo.gs` nuevo (vuelve a poner tu clave), guarda y crea una **Nueva versión** como se explica arriba. Las columnas nuevas (`animacion`, `color`) se agregan solas a tu hoja la primera vez que guardes una pieza.

---

## 2 · Conecta el catálogo con tu hoja

Abre `js/config.js` con el Bloc de notas y pega tu URL:

```js
urlScript: 'https://script.google.com/macros/s/AKfy.../exec',
```

Guarda el archivo. El WhatsApp, Instagram y los textos los puedes llenar aquí o después desde el panel → **Ajustes**.

---

## 3 · Publícalo gratis en internet (GitHub Pages)

1. Crea una cuenta gratuita en <https://github.com>. Tu nombre de usuario formará tu dirección (por ejemplo, si te llamas `inluna`, tu sitio será `inluna.github.io/...`).
2. Toca **+ → New repository**. Nombre: `catalogo` · marca **Public** · **Create repository**.
3. Toca **uploading an existing file** y **arrastra todo lo que hay dentro de la carpeta `catalogo-inluna`** (los archivos y las carpetas `css`, `js`, `img`, `apps-script`). Abajo toca **Commit changes**.
4. Ve a **Settings → Pages**. En *Branch* elige **main** y **/(root)** → **Save**.
5. En 1 o 2 minutos tu catálogo estará en:
   **`https://TU-USUARIO.github.io/catalogo/`** ✨
6. *(Opcional, para que salga la imagen bonita al compartir el enlace en WhatsApp o Facebook)*: en `index.html` cambia `https://TU-SITIO/img/compartir.png` por `https://TU-USUARIO.github.io/catalogo/img/compartir.png`.

**¿Cambiar un archivo después?** En GitHub abre el archivo, toca ✏️, edita y **Commit changes** (se puede desde el teléfono). Pero en el día a día **no necesitas tocar GitHub**: las piezas se manejan desde el panel.

> Otras opciones gratuitas parecidas: Cloudflare Pages (arrastras la carpeta y te da una dirección `tu-nombre.pages.dev`). Un dominio propio (`inluna.com`) es opcional y ese sí se paga aparte.

---

## 4 · Ponlo en Instagram

- **Enlace en tu perfil:** Editar perfil → Enlaces → Agregar enlace externo → pega tu dirección del catálogo.
- **Historias:** usa el sticker **Enlace**. Puedes enlazar una pieza directa: abre la pieza en el catálogo → **Compartir** → copia el enlace.
- **Enlaces directos** (entran sin la animación de las puertas):
  - Una pieza: `…/catalogo/#p/taza-seigaiha`
  - Una colección: `…/catalogo/#c/ceramica`
  - Hacer un pedido: `…/catalogo/#contacto`

---

## 5 · Administrar desde tu teléfono

Abre **`https://TU-USUARIO.github.io/catalogo/admin.html`** y entra con tu clave.

**Instálalo como app:**
- iPhone (Safari): botón Compartir → **Agregar a pantalla de inicio**.
- Android (Chrome): menú ⋮ → **Agregar a la pantalla principal** / **Instalar app**.

**Lo que puedes hacer:**

| Quiero… | Cómo |
|---|---|
| Agregar una pieza | **+ Nueva pieza** → *Agregar fotos* (cámara o galería) → nombre, precio, colección, descripción → **Guardar** |
| Marcarla agotada o sobre pedido | Toca la pieza → *Estado* → **Agotado** / **Sobre pedido** → Guardar |
| Esconderla sin borrarla | *Estado* → **Oculto** |
| Destacarla | Activa **"Mostrar en Favoritas del taller"** |
| Cambiar la portada | En las fotos toca ★ en la que quieras de portada |
| Cambiar el orden | **Ordenar** → flechas ↑ ↓ → **Guardar orden** |
| Crear una pieza parecida | Abre una pieza → **Duplicar pieza** |
| Elegir su animación | *Animación* → **Automática** (la adivina por el nombre) o elige una: Vapor, Balanceo, Girar, Hojear, Brillo, Flores, Llama o Sin animación. La **vista previa** te la muestra antes de guardar |
| Cambiar el color del dibujo | Bajo la vista previa toca **Color del dibujo** → elige en el abanico (o **Más tonos de…**) → **Listo** → Guardar. **Volver al azul talavera** lo regresa al azul de siempre. Mientras tengas el panel abierto, cada pieza nueva empieza con el último color que usaste |
| Cambiar WhatsApp, Instagram, textos o moneda | Engrane ⚙ **Ajustes** |

- Las fotos se achican solas en el teléfono antes de subirse (rápido y ligero) y se guardan en tu Drive, **cada una en dos versiones**: la original y la dibujada (en el panel llevan la marca ✦). Tarda un par de segundos por foto.
- Si una foto no tiene su versión dibujada (por ejemplo, la pegaste como enlace), en el catálogo se tiñe de azul automáticamente; en el panel puedes tocar **✦ dibujar** sobre ella para crear su dibujo.
- **Animación automática** según el nombre: taza, tetera, cuenco → vapor · libreta, cuaderno, libro → hojear · plato → girar · lámina, cuadro, arete, collar, bolsa → balanceo · jarrón, florero, maceta → flores · vela → llama · azulejo, anillo, joya → brillo.
- Los cambios aparecen en el catálogo en segundos.
- Las **colecciones** se crean solas con el nombre que escribas en *Colección* (Cerámica, Láminas, Textil…). Cada colección toma como portada la foto de su primera pieza favorita (o la primera pieza).
- **WhatsApp:** escríbelo con código de país, sin "+" ni espacios. México: `52` + tus 10 dígitos (ej. `5215512345678` o `525512345678`).

**También puedes editar la hoja directamente** (en la app de Google Sheets):

| Columna | Qué va |
|---|---|
| `id` | Se llena solo. Es la parte final del enlace de la pieza. No lo cambies. |
| `nombre` | Nombre de la pieza |
| `precio` | Número (`350`) o texto (`Desde $200`, `Consultar`) |
| `categoria` | La colección |
| `descripcion` | Texto libre (medidas, materiales…) |
| `fotos` | Una por línea: el ID o el enlace de Drive, o cualquier enlace a una imagen. Las que sube el panel se ven como `original\|dibujo` (dos IDs unidos por una barra); no las separes |
| `estado` | `disponible`, `encargo`, `agotado` u `oculto` |
| `destacado` | ✔ para que salga en Favoritas |
| `animacion` | `auto`, `vapor`, `colgar`, `girar`, `hojear`, `brillo`, `flores`, `llama` o `ninguna` (vacío = `auto`) |
| `color` | Color de la tinta del dibujo como `#rrggbb` (ej. `#d4452b`). Vacío = azul talavera |
| `orden` | Número: las piezas se muestran de menor a mayor |

---

## 6 · Personalizar

- **Colores:** `js/config.js` → `colores` (verde de las hojas y botones, café para la tinta, ramas y techo, azul solo para la talavera y dorado para estrellas y flores).
- **Textos de la entrada** ("el taller de", nombre, frase): panel → Ajustes.
- **Tipografías:** Fraunces (títulos) y Klee One (letra a mano), de Google Fonts. Se cambian en `index.html`, `admin.html` y en `css/base.css` (`--f-titulo`, `--f-mano`).
- **Dibujos:** todo el arte se genera con código, sin imágenes pesadas:
  - `js/arte.js` → logo, patrones (escamas, olas, puntos, ajedrez, arcos, ramitas, estrellas…), marcos de arco, friso y enredaderas.
  - `js/escenas.js` → la casita de la entrada (ladrillo blanco, enredadera, árbol, puerta verde, postigos, celosías de talavera y arbolitos) y las piezas del interior.
- **Animaciones de las piezas:** las palabras que activan cada una están en `js/animaciones.js`; cómo se mueven, en `css/piezas.css`.
- **Estilo de las fotos dibujadas:** `js/estilo.js` (grosor de las líneas, cantidad de tinta).
- **Piezas de ejemplo:** `js/demo.js` (solo se ven mientras no conectes tu hoja).

---

## 7 · Si algo no funciona

| Veo… | Revisa |
|---|---|
| "No pudimos abrir el taller" | Que la URL de `js/config.js` termine en `/exec` y que la implementación diga **Quién tiene acceso: Cualquier usuario**. Pega la URL en el navegador: debe mostrar `{"ok":true...}`. |
| En el panel: "La URL del Apps Script no devolvió datos" | Lo mismo de arriba. Si cambiaste el código, crea una **nueva versión** de la implementación. |
| Las fotos no aparecen | En Drive, la carpeta *"Inluna · fotos del catálogo"* debe estar compartida como **Cualquier persona con el enlace · Lector** (el script lo hace solo; las cuentas de escuela o trabajo a veces lo bloquean). |
| "Clave incorrecta" y no la recuerdas | Cambia `CLAVE_DEL_PANEL` en el script y ejecuta **configurar** otra vez. |
| "Demasiados intentos" | Espera 15 minutos (protección contra quien intente adivinar tu clave). |
| Cambié algo en la hoja y no se ve | Espera unos segundos y recarga. El catálogo guarda una copia por hasta 5 minutos. |
| Una foto no se convirtió en dibujo | Ábrela en el panel y toca **✦ dibujar**. Si dice que no pudo, bórrala y súbela otra vez desde tu teléfono: se convierte sola al subir. |
| Elijo una *Animación* o un *Color del dibujo* en el panel y no se guarda (o el panel avisa que tu Apps Script no guarda el color) | Actualizaste la página pero no el script: pega el `Codigo.gs` nuevo y crea una **Nueva versión** de la implementación (paso 1). |

**¿Cuánto aguanta gratis?** Para un catálogo de un taller, de sobra: Google permite miles de visitas y cambios al día, y GitHub Pages sirve páginas a mucho tráfico sin costo.

---

## Archivos

```
catalogo-inluna/
├── index.html            ← el catálogo (lo que ven tus clientas)
├── admin.html            ← tu panel (protegido con tu clave)
├── admin.webmanifest     ← para instalar el panel como app
├── css/
│   ├── base.css          ← papel, tinta, tipografías, logo
│   ├── piezas.css        ← marcos y animaciones de las piezas
│   ├── catalogo.css      ← fachada, galería, colecciones, ficha, contacto
│   └── admin.css         ← el panel
├── js/
│   ├── config.js         ← ★ lo único que necesitas editar
│   ├── arte.js           ← logo, patrones, arcos, friso, enredaderas
│   ├── escenas.js        ← la casita de la entrada y las piezas del interior
│   ├── animaciones.js    ← qué animación lleva cada pieza
│   ├── estilo.js         ← convierte tus fotos al dibujo en tinta azul
│   ├── tintas.js         ← la gama de 201 colores para la tinta de cada pieza
│   ├── sonido.js         ← campanitas (opcionales)
│   ├── datos.js          ← conexión con tu hoja de Google
│   ├── nucleo.js         ← utilidades compartidas del catálogo
│   ├── fachada.js        ← la entrada, sus juegos y la salida del taller
│   ├── taller.js         ← galería de arcos, colecciones, ficha y contacto
│   ├── catalogo.js       ← arranque y rutas del catálogo
│   ├── admin.js          ← funcionamiento del panel
│   └── demo.js           ← piezas de ejemplo
├── img/                  ← íconos e imagen para compartir
└── apps-script/Codigo.gs ← el "servidor" (se pega en Google Apps Script)
```
