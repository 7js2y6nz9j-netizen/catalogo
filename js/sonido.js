/* ==================================================================
   sonido.js · Campanitas suaves hechas en el navegador (sin archivos)
   Empieza APAGADO; la clienta lo enciende con el botón ♪.
   ================================================================== */
(function () {
  'use strict';
  const CLAVE = 'inluna:sonido';
  // Escala pentatónica: cualquier combinación suena bonita
  const ESCALA = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98, 1760];
  let ctx = null, salida = null, activo = false;
  try { activo = localStorage.getItem(CLAVE) === '1'; } catch (e) { /* nada */ }

  function preparar() {
    if (ctx) return ctx.state === 'suspended' ? ctx.resume() : Promise.resolve();
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return Promise.resolve();
    ctx = new AC();
    salida = ctx.createGain();
    salida.gain.value = 0.5;
    // un eco suave para que suene "en el taller"
    const eco = ctx.createDelay(1);
    eco.delayTime.value = 0.21;
    const retro = ctx.createGain();
    retro.gain.value = 0.26;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = 2200;
    salida.connect(ctx.destination);
    salida.connect(eco);
    eco.connect(filtro);
    filtro.connect(retro);
    retro.connect(eco);
    filtro.connect(ctx.destination);
    return ctx.resume ? ctx.resume() : Promise.resolve();
  }

  function nota(frec, { cuando = 0, dur = 1.6, vol = 0.14, tipo = 'sine' } = {}) {
    if (!activo || !ctx) return;
    const t = ctx.currentTime + cuando;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(salida);
    const o1 = ctx.createOscillator();
    o1.type = tipo;
    o1.frequency.value = frec;
    o1.connect(g);
    const g2 = ctx.createGain();
    g2.gain.value = 0.22;
    g2.connect(g);
    const o2 = ctx.createOscillator();
    o2.type = 'sine';
    o2.frequency.value = frec * 2.01;
    o2.connect(g2);
    [o1, o2].forEach((o) => { o.start(t); o.stop(t + dur + 0.05); });
  }

  const azar = () => ESCALA[Math.floor(Math.random() * 6)];

  const Sonido = {
    activo: () => activo,
    alternar() {
      activo = !activo;
      try { localStorage.setItem(CLAVE, activo ? '1' : '0'); } catch (e) { /* nada */ }
      if (activo) preparar().then(() => Sonido.acorde());
      return activo;
    },
    /* Se llama en cualquier toque: el navegador solo deja sonar después de uno */
    despertar() { if (activo) preparar(); },
    tintineo(indice) { nota(indice == null ? azar() : ESCALA[indice % ESCALA.length], { vol: 0.12 }); },
    acorde() { [0, 2, 4].forEach((k, i) => nota(ESCALA[k], { cuando: i * 0.07, vol: 0.1, dur: 2 })); },
    glissando() { [2, 3, 4, 5, 6, 7].forEach((k, i) => nota(ESCALA[k], { cuando: i * 0.07, vol: 0.08, dur: 1.4 })); },
    puerta() {
      [0, 2, 4, 5, 7].forEach((k, i) => nota(ESCALA[k] / 2, { cuando: i * 0.11, vol: 0.12, dur: 2.4, tipo: 'triangle' }));
    },
    toque() { nota(ESCALA[7], { vol: 0.04, dur: 0.35 }); },
    flor() { [4, 6, 8].forEach((k, i) => nota(ESCALA[k], { cuando: i * 0.09, vol: 0.08, dur: 1.2 })); },
  };
  window.Sonido = Sonido;
})();
