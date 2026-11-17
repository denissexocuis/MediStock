// Opciones de accesibilidad y apariencia. Se carga en el <head> de cada página para que
// se apliquen antes de pintar (sin parpadeo). Se guardan en el navegador (para pintar rápido)
// y, si hay sesión, también en la cuenta del doctor, así lo siguen a cualquier equipo.
(function () {
  var KEY = 'medistock_ajustes';
  var MARCA = 'medistock_ajustes_sesion'; // indica que lo guardado en este equipo es de un doctor con sesión
  var PALETAS = ['oliva', 'rosa', 'azul', 'verde', 'morado', 'gris'];
  var TEMAS = ['claro', 'oscuro', 'contraste', 'contraste-oscuro'];
  var ZOOMS = [50, 75, 100, 125, 150, 175, 200];
  var BOOLS = ['subrayar', 'sinMov', 'espaciado', 'fuente', 'foco', 'controles', 'daltonismo'];
  var CLASES = { subrayar: 'sub-enlaces', sinMov: 'sin-mov', espaciado: 'espaciado', fuente: 'fuente-legible', foco: 'foco-grande', controles: 'controles-grandes', daltonismo: 'daltonismo' };
  var DEF = { paleta: 'oliva', tema: 'claro', zoom: 100, subrayar: false, sinMov: false, espaciado: false, fuente: false, foco: false, controles: false, daltonismo: false };

  function limpiar(o) {
    var a = {}, k;
    for (k in DEF) a[k] = DEF[k];
    o = o || {};
    if (PALETAS.indexOf(o.paleta) >= 0) a.paleta = o.paleta;
    if (TEMAS.indexOf(o.tema) >= 0) a.tema = o.tema;
    if (ZOOMS.indexOf(Number(o.zoom)) >= 0) a.zoom = Number(o.zoom);
    BOOLS.forEach(function (b) { a[b] = o[b] === true; });
    return a;
  }
  function leer() {
    try { return limpiar(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return limpiar(); }
  }
  function haySesion() {
    try { return !!localStorage.getItem('token'); } catch (e) { return false; }
  }
  function guardar(a) {
    try {
      localStorage.setItem(KEY, JSON.stringify(a));
      if (haySesion()) localStorage.setItem(MARCA, '1');
    } catch (e) { /* sin almacenamiento: solo dura esta página */ }
  }
  // Si la sesión terminó (cerrar sesión o vencimiento), las opciones de ese doctor no se quedan en el equipo.
  // Lo que alguien elige ANTES de iniciar sesión (en el login o el registro) sí se conserva.
  try {
    if (!haySesion() && localStorage.getItem(MARCA)) { localStorage.removeItem(KEY); localStorage.removeItem(MARCA); }
  } catch (e) { /* igual */ }
  function aplicar(a) {
    var h = document.documentElement;
    var tema = a.tema;
    h.setAttribute('data-paleta', a.paleta);
    h.setAttribute('data-tema', tema);
    h.setAttribute('data-bs-theme', tema === 'oscuro' || tema === 'contraste-oscuro' ? 'dark' : 'light');
    h.setAttribute('data-zoom', String(a.zoom));
    h.style.fontSize = a.zoom + '%';
    BOOLS.forEach(function (b) { h.classList.toggle(CLASES[b], a[b]); });
  }

  // Guarda en la cuenta del doctor (si hay sesión). Espera un momento por si cambia varias cosas seguidas,
  // pero si la página se cierra o cambia antes, lo pendiente se envía de todos modos (keepalive).
  var temporizador = null, pendiente = null;
  function volcar() {
    clearTimeout(temporizador);
    if (!pendiente) return;
    var token = null;
    try { token = localStorage.getItem('token'); } catch (e) { /* sin almacenamiento */ }
    var a = pendiente; pendiente = null;
    if (!token) return;
    fetch('/api/ajustes', {
      method: 'PUT',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(a),
    }).then(function (r) { if (!r.ok) throw new Error(); })
      .catch(function () { if (window.Ajustes.alFallar) window.Ajustes.alFallar(); });
  }
  function enviar(a) {
    if (!haySesion()) return;
    pendiente = a;
    clearTimeout(temporizador);
    temporizador = setTimeout(volcar, 400);
  }
  window.addEventListener('pagehide', volcar);

  window.Ajustes = {
    DEF: DEF, leer: leer, aplicar: aplicar, alFallar: null,
    cambiar: function (campo, valor) { var a = leer(); a[campo] = valor; a = limpiar(a); guardar(a); aplicar(a); enviar(a); return a; },
    restablecer: function () { var a = limpiar(); guardar(a); aplicar(a); enviar(a); return a; },
    // al iniciar sesión: se usan las opciones de ESE doctor. Si aún no tiene guardadas, se quedan las que
    // acaba de elegir en esta pantalla (o las de fábrica) y se guardan en su cuenta.
    alIniciarSesion: function (guardadas) {
      var a = guardadas ? limpiar(guardadas) : leer();
      guardar(a); aplicar(a);
      if (!guardadas) { enviar(a); volcar(); } // se envía ya: la página cambia enseguida
      return a;
    },
  };
  aplicar(leer());
})();
