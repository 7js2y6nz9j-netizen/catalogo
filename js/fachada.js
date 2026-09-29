/* ==================================================================
   fachada.js · La entrada (y el regreso): la casita que reacciona al tacto
   ------------------------------------------------------------------
   · Mover el dedo / el mouse / inclinar el teléfono → profundidad
   · Las hojas caen del árbol; al tocarlo se sacude y caen más
   · Postigos que se abren y cierran, celosías de talavera que se
     iluminan, arbolitos que se sacuden y el emblema que gira
   · Las puertas se abren deslizando el dedo (o con un toque)
   · salir(): sales por la puerta, se cierra detrás de ti y quedas
     frente a la fachada, lista para volver a entrar cuando quieras
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, E = window.Escenas, S = window.Sonido;
  const { $, $$, esc, espera, reducido } = I;
  const F = E.FACHADA;

  let raiz = null, escena = null, capas = [], rafId = 0, activo = false, entrando = false, alEntrar = null;
  const vista = { tx: 0, ty: 0, x: 0, y: 0, ultimo: -1e9, tilt: null, tilt0: null };
  let arrastre = null, tocando = null, tNota = 0;

  const iconoPuerta = '<svg class="pista-icono" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7L4 12l5 5M15 7l5 5-5 5"/></svg>';

  function construir({ nombre, antes, onEntrar }) {
    if (raiz) destruir();
    alEntrar = onEntrar;
    entrando = false;
    raiz = $('#entrada');
    raiz.className = 'entrada';
    raiz.removeAttribute('style');
    const fz = E.fachada({ nombre });
    const hoja = E.hojaPuerta(), postigo = E.postigoPanel();
    raiz.innerHTML = `
      <div class="escena">
        <button class="arbol capa" data-prof="0.4" type="button" aria-label="Sacudir el árbol">${E.arbol()}</button>
        <header class="entrada-titulo capa" data-prof="0.22">
          <p class="entrada-antes">${esc(antes)}</p>
          <h1 class="entrada-nombre">${esc(nombre)}</h1>
          <p class="entrada-pista2">✦ toca el árbol, las ventanas y las macetas ✦</p>
          <p class="nota-regreso" role="status" hidden></p>
        </header>
        <div class="casa-lugar">
          <div class="casa capa" data-prof="0.7">
            <div class="puertas" style="${E.caja(F.puerta)}">
              <div class="hueco">${E.huecoPuerta()}</div>
              <button class="puertas-boton" type="button" aria-label="Abrir las puertas y entrar al taller">
                <span class="hoja-puerta izq">${hoja}</span><span class="hoja-puerta der">${hoja}</span>
              </button>
            </div>
            ${fz.casa}
            <button class="postigo" type="button" style="${E.caja(F.postigo)}" aria-label="Abrir o cerrar la ventana">
              <span class="postigo-hoja izq">${postigo}</span><span class="postigo-hoja der">${postigo}</span>
            </button>
            ${F.celosias.map((v, i) => `<button class="celosia" type="button" style="${E.caja(v)}" aria-label="Encender la celosía">${E.celosia(v.w, v.h, i)}</button>`).join('')}
            ${F.macetas.map((v, i) => `<button class="maceta" type="button" style="${E.caja(v)}" aria-label="Sacudir el arbolito">${E.topiario(i)}</button>`).join('')}
            <button class="luna emblema" type="button" style="${E.caja(F.emblema)}" aria-label="Tocar el emblema de Inluna">${E.luna({ hojasClase: 'fz-logo' })}</button>
            ${fz.vivo}
          </div>
        </div>
        <div class="entrada-pistas">
          <p class="entrada-pista">${iconoPuerta}<span>desliza o toca las puertas para entrar</span></p>
        </div>
        <div class="hojas-caen" aria-hidden="true"></div>
      </div>`;
    escena = $('.escena', raiz);
    capas = $$('.capa', raiz).map((el) => ({ el, prof: Number(el.dataset.prof) || 0.5 }));
    raiz.hidden = false;
    crearHojas();
    conectar();
  }

  /* ---------- profundidad (parallax) ---------- */
  function moverVista(x, y) {
    vista.tx = (x / window.innerWidth - 0.5) * 2;
    vista.ty = (y / window.innerHeight - 0.5) * 2;
    vista.ultimo = performance.now();
  }
  function orientacion(e) {
    if (e.gamma == null || e.beta == null) return;
    if (!vista.tilt0) vista.tilt0 = { g: e.gamma, b: e.beta };
    const lim = (v) => Math.max(-1, Math.min(1, v));
    vista.tilt = { x: lim((e.gamma - vista.tilt0.g) / 18), y: lim((e.beta - vista.tilt0.b) / 22) };
  }
  function bucle(t) {
    if (!activo) return;
    const quieto = performance.now() - vista.ultimo > 2200;
    let tx = vista.tx, ty = vista.ty;
    if (quieto) {
      if (vista.tilt) { tx = vista.tilt.x; ty = vista.tilt.y; } else { tx = Math.sin(t / 2100) * 0.35; ty = Math.cos(t / 2700) * 0.22; }
    }
    vista.x += (tx - vista.x) * 0.09;
    vista.y += (ty - vista.y) * 0.09;
    const px = -vista.x * 18, py = -vista.y * 11;
    for (const c of capas) c.el.style.transform = `translate3d(${(px * c.prof).toFixed(2)}px,${(py * c.prof).toFixed(2)}px,0)`;
    rafId = requestAnimationFrame(bucle);
  }

  /* ---------- hojas que caen del árbol ---------- */
  const colorHoja = () => E.VERDES[Math.floor(Math.random() * E.VERDES.length)];
  function hojaQueCae(estilo, rafaga) {
    const el = document.createElement('span');
    el.className = `hoja-cae${rafaga ? ' rafaga' : ''}`;
    const giro = (Math.random() < 0.5 ? -1 : 1) * (180 + Math.random() * 360);
    el.style.cssText = `${estilo};--dx:${(-6 - Math.random() * 22).toFixed(1)}vw;--giro:${giro.toFixed(0)}deg;` +
      `--tam:${(10 + Math.random() * 9).toFixed(1)}px;--vaiven:${(1.6 + Math.random() * 1.4).toFixed(2)}s`;
    el.innerHTML = E.hojaSuelta(colorHoja());
    return el;
  }
  function crearHojas() {
    if (reducido) return;
    const cont = $('.hojas-caen', raiz);
    const n = window.innerWidth < 600 ? 9 : 14;
    for (let i = 0; i < n; i++) {
      const dur = 9 + Math.random() * 7;
      cont.appendChild(hojaQueCae(`left:${(38 + Math.random() * 60).toFixed(1)}vw;top:${(2 + Math.random() * 22).toFixed(1)}vh;` +
        `--dur:${dur.toFixed(1)}s;--retraso:${(-Math.random() * dur).toFixed(1)}s`));
    }
  }
  function soltarHojas(x, y, n = 6, dispersion = 40) {
    if (reducido || !raiz) return;
    const cont = $('.hojas-caen', raiz);
    for (let i = 0; i < n; i++) {
      const dur = 3.2 + Math.random() * 2.4;
      const el = hojaQueCae(`left:${(x + (Math.random() - 0.5) * dispersion).toFixed(0)}px;top:${(y + (Math.random() - 0.5) * dispersion * 0.6).toFixed(0)}px;` +
        `--dur:${dur.toFixed(1)}s;--retraso:${(i * 0.06).toFixed(2)}s`, true);
      cont.appendChild(el);
      setTimeout(() => el.remove(), (dur + 0.8) * 1000);
    }
  }

  /* ---------- puertas: se abren deslizando el dedo ---------- */
  function ponerApertura(p) {
    const pu = raiz && $('.puertas', raiz);
    if (pu) pu.style.setProperty('--abre', p.toFixed(3));
  }
  function conectarPuertas() {
    const b = $('.puertas-boton', raiz);
    b.addEventListener('pointerdown', (e) => {
      if (entrando) return;
      arrastre = { x0: e.clientX, y0: e.clientY, t0: performance.now(), prog: 0 };
      try { b.setPointerCapture(e.pointerId); } catch (err) { /* nada */ }
      raiz.classList.add('arrastrando');
    });
    b.addEventListener('pointermove', (e) => {
      if (!arrastre) return;
      const dx = e.clientX - arrastre.x0, dy = e.clientY - arrastre.y0;
      arrastre.prog = Math.min(1, Math.max(Math.abs(dx), -dy, 0) / 120);
      ponerApertura(arrastre.prog);
    });
    const soltar = (cancelado) => {
      const a = arrastre;
      arrastre = null;
      if (raiz) raiz.classList.remove('arrastrando');
      if (!a) return;
      const toque = performance.now() - a.t0 < 450 && a.prog < 0.08;
      if (!cancelado && (a.prog > 0.3 || toque)) entrar();
      else ponerApertura(0);
    };
    b.addEventListener('pointerup', () => soltar(false));
    b.addEventListener('pointercancel', () => soltar(true));
    b.addEventListener('click', (e) => { if (e.detail === 0) entrar(); }); // teclado
  }

  /* ---------- cosas que se pueden tocar ---------- */
  function reiniciar(el, clase) {
    el.classList.remove(clase);
    void el.offsetWidth;
    el.classList.add(clase);
  }
  function centroDe(el, e) {
    const r = el.getBoundingClientRect();
    return e && e.clientX ? [e.clientX, e.clientY] : [r.left + r.width / 2, r.top + r.height / 2];
  }
  function conectar() {
    raiz.addEventListener('pointermove', (e) => moverVista(e.clientX, e.clientY), { passive: true });
    raiz.addEventListener('pointerdown', (e) => {
      moverVista(e.clientX, e.clientY);
      tocando = e.target.closest('button') ? null : { x: e.clientX, y: e.clientY, t: performance.now() };
    }, { passive: true });
    raiz.addEventListener('pointerup', (e) => {
      const t = tocando;
      tocando = null;
      if (!t || entrando) return;
      if (performance.now() - t.t < 350 && Math.hypot(e.clientX - t.x, e.clientY - t.y) < 12) {
        I.destellos(e.clientX, e.clientY, { n: 6, radio: 38 });
        S.tintineo();
      }
    });
    conectarPuertas();
    $('.arbol', raiz).addEventListener('click', (e) => {
      reiniciar(e.currentTarget, 'sacude');
      const [x, y] = centroDe(e.currentTarget, e);
      soltarHojas(x, y, 8, 110);
      S.tintineo(2);
      I.vibrar(10);
    });
    $('.luna', raiz).addEventListener('click', (e) => {
      reiniciar(e.currentTarget, 'brilla');
      I.destellosEn(e.currentTarget, { n: 10, radio: 60 });
      S.glissando();
      I.vibrar(8);
    });
    $('.postigo', raiz).addEventListener('click', (e) => {
      const cerrada = e.currentTarget.classList.toggle('cerrada');
      S.tintineo(cerrada ? 1 : 4);
      I.vibrar(6);
    });
    $$('.celosia', raiz).forEach((b, i) => b.addEventListener('click', () => {
      const encendida = b.classList.toggle('encendida');
      if (encendida) I.destellosEn(b, { n: 6, radio: 30 });
      S.tintineo(encendida ? 5 + i : 1);
      I.vibrar(6);
    }));
    $$('.maceta', raiz).forEach((b) => b.addEventListener('click', () => {
      reiniciar(b, 'sacude');
      const r = b.getBoundingClientRect();
      soltarHojas(r.left + r.width / 2, r.top + r.height * 0.3, 3, 26);
      S.flor();
      I.vibrar(6);
    }));
    window.addEventListener('deviceorientation', orientacion);
  }

  /* ---------- ciclo de vida ---------- */
  function animar() {
    if (!raiz) return;
    raiz.classList.add('viva');
    activo = true;
    cancelAnimationFrame(rafId);
    if (!reducido) rafId = requestAnimationFrame(bucle);
    setTimeout(() => { if (!entrando && raiz) raiz.classList.add('llamar'); }, reducido ? 0 : 1600);
  }

  // Zoom sobre el umbral de la puerta (para entrar o para salir)
  function zoomPuerta() {
    const pu = $('.puertas', raiz).getBoundingClientRect();
    const s = Math.max(window.innerWidth / pu.width, window.innerHeight / pu.height) * 1.35;
    escena.style.transformOrigin = `${pu.left + pu.width / 2}px ${pu.top + pu.height * 0.45}px`;
    return `scale(${s.toFixed(3)})`;
  }

  async function entrar() {
    if (entrando || !raiz) return;
    entrando = true;
    S.puerta();
    I.vibrar(18);
    raiz.classList.remove('llamar');
    raiz.classList.add('abriendo');
    ponerApertura(1);
    if (reducido) {
      alEntrar && alEntrar();
      raiz.classList.add('desvanecer');
      await espera(350);
      destruir();
      return;
    }
    await espera(330);
    const zoom = zoomPuerta();
    escena.style.transition = 'transform .9s cubic-bezier(.65,0,.3,1)';
    escena.style.transform = zoom;
    await espera(560);
    alEntrar && alEntrar();
    raiz.classList.add('desvanecer');
    await espera(420);
    destruir();
  }

  /* Salir del taller: empiezas en el umbral, te alejas de la puerta y
     ésta se cierra detrás de ti. alCubrir() guarda el interior cuando
     la fachada ya lo tapa. */
  async function salir({ nombre, antes, onEntrar, gracias = false, alCubrir } = {}) {
    construir({ nombre, antes, onEntrar });
    raiz.classList.add('lista', 'crecida', 'saliendo');
    const logo = $('.fz-logo', raiz);
    if (logo) logo.classList.add('visible');
    if (reducido) {
      alCubrir && alCubrir();
      raiz.classList.remove('saliendo');
      animar();
      nota(gracias);
      return;
    }
    raiz.classList.add('abriendo', 'arrastrando');
    ponerApertura(1);
    escena.style.transform = zoomPuerta();
    raiz.style.opacity = '0';
    void raiz.offsetWidth;
    raiz.classList.remove('arrastrando');
    raiz.style.transition = 'opacity .38s ease';
    raiz.style.opacity = '1';
    await espera(400);
    alCubrir && alCubrir();
    escena.style.transition = 'transform 1.05s cubic-bezier(.33,0,.2,1)';
    escena.style.transform = 'none';
    await espera(780);
    raiz.classList.remove('abriendo');
    ponerApertura(0);
    S.puerta();
    await espera(520);
    raiz.classList.remove('saliendo');
    raiz.style.transition = '';
    raiz.style.opacity = '';
    escena.style.transition = '';
    animar();
    nota(gracias);
  }

  /* Mensaje al volver a la fachada */
  function nota(gracias) {
    const n = raiz && $('.nota-regreso', raiz);
    if (!n) return;
    n.innerHTML = gracias
      ? '¡Gracias por tu pedido! <span>✦</span> Aquí te espero cuando quieras volver.'
      : '¡Vuelve cuando quieras! <span>✦</span> La puerta siempre está abierta.';
    n.classList.remove('se-va');
    n.hidden = false;
    const p = $('.entrada-pista span', raiz);
    if (p) p.textContent = 'toca las puertas para volver a entrar';
    clearTimeout(tNota);
    tNota = setTimeout(() => { if (n.isConnected) n.classList.add('se-va'); }, 7000);
  }

  function destruir() {
    activo = false;
    cancelAnimationFrame(rafId);
    clearTimeout(tNota);
    window.removeEventListener('deviceorientation', orientacion);
    if (raiz) { raiz.innerHTML = ''; raiz.hidden = true; raiz.className = 'entrada'; raiz.removeAttribute('style'); }
    raiz = null;
    escena = null;
    capas = [];
  }

  window.Fachada = {
    construir, animar, entrar, salir, nota,
    activa: () => !!raiz && !entrando,
    logo: () => raiz && $('.fz-logo', raiz),
    mostrar: () => raiz && raiz.classList.add('lista'),
    ponerNombre(nombre, antes) {
      if (!raiz) return;
      const l = $('.fz-letrero', raiz); if (l) l.textContent = nombre;
      const n = $('.entrada-nombre', raiz); if (n) n.textContent = nombre;
      const a = $('.entrada-antes', raiz); if (a) a.textContent = antes;
    },
  };
})();
