/* ==================================================================
   fachada.js · La entrada: la fachada simétrica que reacciona al tacto
   ------------------------------------------------------------------
   · Mover el dedo / el mouse / inclinar el teléfono → profundidad
   · Tocar el cielo → brotan destellos (y una notita si hay sonido)
   · La luna brilla y cruza una estrella fugaz
   · Faroles que se mecen, ventanas que se encienden, macetas que florecen
   · Las puertas se abren deslizando el dedo (o con un toque)
   ================================================================== */
(function () {
  'use strict';
  const I = window.Inluna, E = window.Escenas, S = window.Sonido;
  const { $, $$, esc, espera, reducido } = I;
  const F = E.FACHADA;

  let raiz = null, escena = null, capas = [], rafId = 0, activo = false, entrando = false, alEntrar = null;
  const vista = { tx: 0, ty: 0, x: 0, y: 0, ultimo: -1e9, punto: null, tilt: null, tilt0: null };
  let chispas = [];
  let arrastre = null, tocando = null;

  const iconoPuerta = '<svg class="pista-icono" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 7L4 12l5 5M15 7l5 5-5 5"/></svg>';

  function construir({ nombre, antes, onEntrar }) {
    alEntrar = onEntrar;
    raiz = $('#entrada');
    const fz = E.fachada({ nombre });
    const hoja = E.hojaPuerta();
    raiz.innerHTML = `
      <div class="escena">
        <div class="cielo-fondo capa" data-prof="0.22"></div>
        <span class="nube nube-1 capa" data-prof="0.3">${E.nube(0)}</span>
        <span class="nube nube-2 capa" data-prof="0.34">${E.nube(1)}</span>
        <span class="fugaz" aria-hidden="true"></span>
        <div class="entrada-columna">
          <header class="entrada-titulo capa" data-prof="0.3">
            <p class="entrada-antes">${esc(antes)}</p>
            <h1 class="entrada-nombre">${esc(nombre)}</h1>
            <p class="entrada-pista2">✦ toca la luna, las ventanas y los faroles ✦</p>
          </header>
          <div class="cielo capa" data-prof="0.45">
            <button class="luna" type="button" aria-label="Tocar la luna">${E.luna()}</button>
          </div>
          <div class="casa capa" data-prof="0.7">
            <div class="puertas" style="${E.caja(F.puerta)}">
              <div class="hueco">${E.huecoPuerta()}</div>
              <button class="puertas-boton" type="button" aria-label="Abrir las puertas y entrar al taller">
                <span class="hoja-puerta izq">${hoja}</span><span class="hoja-puerta der">${hoja}</span>
              </button>
            </div>
            ${F.ventanas.map((v, i) => `<button class="ventana-luz" type="button" style="${E.caja(v)}" aria-label="Encender o apagar la ventana">${E.luzVentana(i)}</button>`).join('')}
            ${fz.casa}
            ${F.faroles.map((v) => `<button class="farol" type="button" style="${E.caja(v)}" aria-label="Mover el farol"><span class="farol-luz"></span>${E.farol()}</button>`).join('')}
            ${F.macetas.map((v, i) => `<button class="maceta" type="button" style="${E.caja(v)}" aria-label="Hacer florecer la maceta">${E.maceta(i)}</button>`).join('')}
            ${fz.vivo}
          </div>
          <div class="entrada-pistas">
            <p class="entrada-pista">${iconoPuerta}<span>desliza o toca las puertas para entrar</span></p>
          </div>
        </div>
        <div class="frente capa" data-prof="1.25">
          <span class="arbusto izq">${E.arbusto()}</span><span class="arbusto der">${E.arbusto()}</span>
        </div>
        <div class="chispas-vivas" aria-hidden="true"></div>
      </div>`;
    escena = $('.escena', raiz);
    capas = $$('.capa', raiz).map((el) => ({ el, prof: Number(el.dataset.prof) || 0.5 }));
    raiz.hidden = false;
    pintarEstrellas();
    crearChispas();
    conectar();
  }

  function pintarEstrellas() {
    const c = $('.cielo-fondo', raiz);
    if (!c) return;
    c.innerHTML = E.estrellas(Math.max(320, c.clientWidth || window.innerWidth), Math.max(200, c.clientHeight || window.innerHeight * 0.6));
  }

  /* ---------- profundidad (parallax) ---------- */
  function moverVista(x, y) {
    vista.tx = (x / window.innerWidth - 0.5) * 2;
    vista.ty = (y / window.innerHeight - 0.5) * 2;
    vista.ultimo = performance.now();
    vista.punto = { x, y };
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
    moverChispas(t);
    rafId = requestAnimationFrame(bucle);
  }

  /* ---------- chispitas que flotan (y se juntan donde tocas) ---------- */
  function crearChispas() {
    const cont = $('.chispas-vivas', raiz);
    const n = window.innerWidth < 600 ? 9 : 15;
    chispas = Array.from({ length: n }, (_, i) => {
      const el = document.createElement('span');
      el.className = `chispa-viva${i % 3 === 0 ? ' grande' : ''}`;
      el.style.animationDelay = `${(-Math.random() * 2.4).toFixed(2)}s`;
      cont.appendChild(el);
      return { el, x: Math.random() * window.innerWidth, y: window.innerHeight * (0.4 + Math.random() * 0.55), vx: 0, vy: 0, a: Math.random() * 6.28 };
    });
  }
  function moverChispas() {
    const w = window.innerWidth, h = window.innerHeight;
    const atraer = performance.now() - vista.ultimo < 1600 ? vista.punto : null;
    for (const c of chispas) {
      c.a += (Math.random() - 0.5) * 0.35;
      c.vx += Math.cos(c.a) * 0.05;
      c.vy += Math.sin(c.a) * 0.04;
      if (atraer) { c.vx += (atraer.x - c.x) * 0.0012; c.vy += (atraer.y - c.y) * 0.0012; }
      if (c.y < h * 0.3) c.vy += 0.04;
      if (c.y > h - 12) c.vy -= 0.05;
      if (c.x < 12) c.vx += 0.05;
      if (c.x > w - 12) c.vx -= 0.05;
      c.vx *= 0.955; c.vy *= 0.955;
      c.x += c.vx; c.y += c.vy;
      c.el.style.transform = `translate3d(${c.x.toFixed(1)}px,${c.y.toFixed(1)}px,0)`;
    }
  }

  /* ---------- puertas: se abren deslizando el dedo ---------- */
  function ponerApertura(p) {
    const pu = $('.puertas', raiz);
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
      raiz.classList.remove('arrastrando');
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
  function estrellaFugaz() {
    const f = $('.fugaz', raiz);
    if (!f || reducido) return;
    f.style.setProperty('--y', `${(8 + Math.random() * 18).toFixed(1)}vh`);
    reiniciar(f, 'vuela');
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
    $('.luna', raiz).addEventListener('click', (e) => {
      reiniciar(e.currentTarget, 'brilla');
      I.destellosEn(e.currentTarget, { n: 10, radio: 74 });
      estrellaFugaz();
      S.glissando();
      I.vibrar(8);
    });
    $$('.farol', raiz).forEach((b, i) => b.addEventListener('click', () => {
      reiniciar(b, 'mece');
      I.destellosEn(b, { n: 5, radio: 30 });
      S.tintineo(3 + i * 2);
      I.vibrar(6);
    }));
    $$('.ventana-luz', raiz).forEach((b, i) => b.addEventListener('click', () => {
      const apagada = b.classList.toggle('apagada');
      if (!apagada) I.destellosEn(b, { n: 6, radio: 34 });
      S.tintineo(apagada ? 1 : 5 + i);
      I.vibrar(6);
    }));
    $$('.maceta', raiz).forEach((b, i) => b.addEventListener('click', () => {
      if (b.classList.contains('florece')) reiniciar(b, 'gira');
      else b.classList.add('florece');
      I.destellosEn(b, { n: 6, radio: 34 });
      S.flor();
      I.vibrar(6);
    }));
    window.addEventListener('deviceorientation', orientacion);
    window.addEventListener('resize', alCambiarTamano);
    // estrella fugaz de vez en cuando
    const fugazCiclica = () => { if (!activo) return; estrellaFugaz(); setTimeout(fugazCiclica, 7000 + Math.random() * 6000); };
    setTimeout(fugazCiclica, 4200);
  }
  let tRes = 0;
  function alCambiarTamano() { clearTimeout(tRes); tRes = setTimeout(pintarEstrellas, 200); }

  /* ---------- ciclo de vida ---------- */
  function animar() {
    if (!raiz) return;
    raiz.classList.add('viva');
    activo = true;
    if (!reducido) rafId = requestAnimationFrame(bucle);
    setTimeout(() => { if (!entrando && raiz) raiz.classList.add('llamar'); }, reducido ? 0 : 1600);
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
    const pu = $('.puertas', raiz).getBoundingClientRect();
    const s = Math.max(window.innerWidth / pu.width, window.innerHeight / pu.height) * 1.35;
    escena.style.transformOrigin = `${pu.left + pu.width / 2}px ${pu.top + pu.height * 0.45}px`;
    escena.style.transition = 'transform .9s cubic-bezier(.65,0,.3,1)';
    escena.style.transform = `scale(${s.toFixed(3)})`;
    await espera(560);
    alEntrar && alEntrar();
    raiz.classList.add('desvanecer');
    await espera(420);
    destruir();
  }

  function destruir() {
    activo = false;
    cancelAnimationFrame(rafId);
    window.removeEventListener('deviceorientation', orientacion);
    window.removeEventListener('resize', alCambiarTamano);
    if (raiz) { raiz.innerHTML = ''; raiz.hidden = true; }
    raiz = null;
  }

  window.Fachada = {
    construir, animar, entrar,
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
