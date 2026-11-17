// Panel de opciones de accesibilidad para el login y el registro (sin salir de la página).
// Usa el mismo Ajustes que la página Opciones.
(function () {
  var cuerpo = document.getElementById('panelCuerpo');
  if (!cuerpo || !window.Ajustes) return;

  var PALETAS = [['oliva', 'Oliva (predeterminada)'], ['rosa', 'Rosa'], ['azul', 'Azul'], ['verde', 'Verde'], ['morado', 'Morado'], ['gris', 'Gris']];
  var TEMAS = [['claro', 'Claro'], ['oscuro', 'Oscuro'], ['contraste', 'Alto contraste: negro sobre blanco'], ['contraste-oscuro', 'Alto contraste: amarillo sobre negro']];
  var ZOOMS = [50, 75, 100, 125, 150, 175, 200];
  var EXTRAS = [
    ['daltonismo', 'Modo daltonismo (sin rojo ni verde)'],
    ['subrayar', 'Subrayar todos los enlaces'],
    ['espaciado', 'Más espacio entre letras y líneas'],
    ['fuente', 'Fuente de lectura fácil'],
    ['foco', 'Resaltar el foco del teclado'],
    ['controles', 'Botones y campos más grandes'],
    ['sinMov', 'Reducir animaciones'],
  ];

  var a = Ajustes.leer();
  var estado = document.createElement('p');
  estado.className = 'visually-hidden';
  estado.setAttribute('role', 'status');

  function avisar(msg) { estado.textContent = ''; setTimeout(function () { estado.textContent = msg; }, 50); }

  function selector(id, titulo, items, actual, campo, convertir) {
    var d = document.createElement('div'); d.className = 'campo';
    var l = document.createElement('label'); l.htmlFor = id; l.className = 'form-label'; l.textContent = titulo;
    var s = document.createElement('select'); s.id = id; s.className = 'form-select';
    items.forEach(function (it) {
      var o = document.createElement('option');
      o.value = it[0]; o.textContent = it[1]; if (String(it[0]) === String(actual)) o.selected = true;
      s.appendChild(o);
    });
    s.addEventListener('change', function () { Ajustes.cambiar(campo, convertir ? convertir(s.value) : s.value); avisar(titulo + ' cambiado.'); });
    d.appendChild(l); d.appendChild(s);
    return d;
  }

  var fs = document.createElement('fieldset');
  var lg = document.createElement('legend'); lg.className = 'visually-hidden'; lg.textContent = 'Apariencia y accesibilidad';
  fs.appendChild(lg);
  fs.appendChild(selector('pa-paleta', 'Colores', PALETAS, a.paleta, 'paleta'));
  fs.appendChild(selector('pa-tema', 'Contraste', TEMAS, a.tema, 'tema'));
  fs.appendChild(selector('pa-zoom', 'Tamaño del texto', ZOOMS.map(function (z) { return [z, z + ' %']; }), a.zoom, 'zoom', Number));

  EXTRAS.forEach(function (e) {
    var fila = document.createElement('div'); fila.className = 'opc-check';
    var i = document.createElement('input'); i.type = 'checkbox'; i.className = 'form-check-input'; i.id = 'pa-' + e[0]; i.checked = !!a[e[0]];
    var l = document.createElement('label'); l.htmlFor = i.id; l.textContent = e[1];
    i.addEventListener('change', function () { Ajustes.cambiar(e[0], i.checked); avisar(e[1] + (i.checked ? ': activado.' : ': desactivado.')); });
    fila.appendChild(i); fila.appendChild(l); fs.appendChild(fila);
  });

  var r = document.createElement('button'); r.type = 'button'; r.className = 'btn btn-claro btn-sm mt-2'; r.textContent = 'Restablecer opciones';
  r.addEventListener('click', function () {
    Ajustes.restablecer();
    var nuevo = Ajustes.leer();
    document.getElementById('pa-paleta').value = nuevo.paleta;
    document.getElementById('pa-tema').value = nuevo.tema;
    document.getElementById('pa-zoom').value = nuevo.zoom;
    EXTRAS.forEach(function (e) { document.getElementById('pa-' + e[0]).checked = !!nuevo[e[0]]; });
    avisar('Opciones restablecidas.');
  });

  cuerpo.appendChild(fs); cuerpo.appendChild(r); cuerpo.appendChild(estado);
})();
