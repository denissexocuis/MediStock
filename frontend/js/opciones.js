const $ = (id) => document.getElementById(id);

const PALETAS = [
  ['oliva', 'Oliva (predeterminada)', '#3b4a14'], ['rosa', 'Rosa', '#8c4a4f'], ['azul', 'Azul', '#1f5a99'], ['verde', 'Verde', '#2f6b47'],
  ['morado', 'Morado', '#6a3fa0'], ['gris', 'Gris', '#3f4a5a'],
];
const TEMAS = [
  ['claro', 'Claro'], ['oscuro', 'Oscuro'],
  ['contraste', 'Alto contraste: negro sobre blanco'], ['contraste-oscuro', 'Alto contraste: amarillo sobre negro'],
];
const ZOOMS = [50, 75, 100, 125, 150, 175, 200];
const EXTRAS = [
  ['subrayar', 'Subrayar todos los enlaces', 'Los enlaces y botones de navegación siempre se ven subrayados.'],
  ['sinMov', 'Reducir animaciones', 'Quita transiciones y movimientos de las ventanas.'],
  ['espaciado', 'Más espacio entre letras, palabras y líneas', 'Ayuda a leer con dislexia o baja visión.'],
  ['fuente', 'Fuente de lectura fácil', 'Usa Verdana, más ancha y clara.'],
  ['foco', 'Resaltar el foco del teclado', 'El contorno al navegar con Tab es más grueso.'],
  ['controles', 'Botones y campos más grandes', 'Facilita tocar o hacer clic con precisión.'],
  ['daltonismo', 'Modo daltonismo', 'Los avisos y estados usan naranja y azul en lugar de rojo y verde, siempre con texto.'],
];

function el(tag, attrs = {}, txt) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (txt !== undefined) e.textContent = txt;
  return e;
}

// grupo de opciones tipo "radio"; el nombre del texto siempre acompaña al color
function radios(idLista, nombre, items, actual, onChange) {
  const ul = $(idLista);
  for (const [valor, texto, color] of items) {
    const id = `${nombre}-${valor}`;
    const li = el('li', { class: 'opc' });
    const inp = el('input', { type: 'radio', name: nombre, id, value: valor });
    inp.checked = String(actual) === String(valor);
    inp.addEventListener('change', () => onChange(valor));
    const lab = el('label', { for: id });
    if (color) { const m = el('span', { class: 'muestra', 'aria-hidden': 'true' }); m.style.background = color; lab.append(m); }
    lab.append(texto);
    li.append(inp, lab);
    ul.append(li);
  }
}

function avisar(msg) {
  const s = $('estado');
  s.textContent = '';
  setTimeout(() => { s.textContent = msg; }, 50); // fuerza el anuncio del lector de pantalla
}

const a = Ajustes.leer();
Ajustes.alFallar = () => avisar('No se pudo guardar en tu cuenta. El cambio se aplicó solo en este equipo.');
radios('g-paleta', 'paleta', PALETAS.map(([v, t, c]) => [v, t, c]), a.paleta, (v) => { Ajustes.cambiar('paleta', v); avisar('Paleta cambiada.'); });
radios('g-tema', 'tema', TEMAS, a.tema, (v) => { Ajustes.cambiar('tema', v); avisar('Tema cambiado.'); });
radios('g-zoom', 'zoom', ZOOMS.map((z) => [z, z + ' %']), a.zoom, (v) => { Ajustes.cambiar('zoom', Number(v)); avisar('Tamaño del texto: ' + v + ' por ciento.'); });

for (const [campo, titulo, ayuda] of EXTRAS) {
  const id = 'x-' + campo;
  const fila = el('div', { class: 'opc-check' });
  const inp = el('input', { type: 'checkbox', class: 'form-check-input', id, 'aria-describedby': id + '-d' });
  inp.checked = a[campo];
  inp.addEventListener('change', () => { Ajustes.cambiar(campo, inp.checked); avisar(titulo + (inp.checked ? ': activado.' : ': desactivado.')); });
  const lab = el('label', { for: id }, titulo);
  lab.append(el('small', { id: id + '-d' }, ayuda));
  fila.append(inp, lab);
  $('g-extra').append(fila);
}

$('restablecer').addEventListener('click', () => {
  Ajustes.restablecer();
  location.reload(); // vuelve a dibujar los controles con los valores por defecto
});

// si hay sesión, vuelve al inventario; si no, al inicio de sesión
let token = null;
try { token = localStorage.getItem('token'); } catch (e) { /* sin almacenamiento */ }
let nombre = 'doctor';
try { nombre = localStorage.getItem('nombre') || 'doctor'; } catch (e) { /* igual */ }
if (token) $('quien').textContent = 'Dr(a). ' + nombre;
$('salir').addEventListener('click', () => {
  try { localStorage.removeItem('token'); localStorage.removeItem('nombre'); } catch (e) { /* igual */ }
  location.href = '/';
});
if (!token) { $('salir').hidden = true; }

$('opciones').addEventListener('submit', (e) => e.preventDefault());
