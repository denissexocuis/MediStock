const ACCIONES = { crear: 'Creó', editar: 'Editó', eliminar: 'Eliminó', reactivar: 'Reactivó' };
const ENTIDADES = { medicamento: 'Medicamento', farmaco: 'Fármaco', marca: 'Marca', ubicacion: 'Ubicación', categoria: 'Categoría'};
const CAMPOS = {
  nombre: 'Nombre', descripcion: 'Descripción', cantidad_tabletas: 'Tabletas del empaque',
  cantidad_restante: 'Tabletas restantes', fecha_caducidad: 'Caducidad', id_estado: 'Estado',
  id_marca: 'Marca', id_tipo: 'Tipo',
  categorias: 'Categorías'
};
// campo del formulario -> parámetro de la URL y de la API
const FILTROS = { q: 'f_q', doctor: 'f_doctor', entidad: 'f_entidad', accion: 'f_accion', desde: 'f_desde', hasta: 'f_hasta' };
const MAX = 200; // el servidor devuelve como máximo 200 movimientos

let filasActuales = [];
const nombres = { id_estado: {}, id_marca: {}, id_tipo: {} }; // para mostrar nombres en vez de números

const dia = (d) => d.toISOString().slice(0, 10);
const hoy = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d; };

function valor(campo, v) {
  if (v === null || v === undefined || v === '') return 'vacío';
  return (nombres[campo] && nombres[campo][v]) || String(v);
}

// lista legible de lo que cambió en un movimiento
function cambios(h) {
  const d = h.detalle;
  if (!d) return [];
  const sal = [];
  if (h.accion === 'editar' && d.antes && d.despues) {
    for (const k of Object.keys(d.despues)) {
      const a = d.antes[k] ?? null, b = d.despues[k] ?? null;
      if (String(a ?? '') !== String(b ?? '')) sal.push(`${CAMPOS[k] || k}: ${valor(k, a)} → ${valor(k, b)}`);
    }
  } else if ((h.accion === 'crear' || h.accion === 'reactivar') && d.despues) {
    for (const [k, v] of Object.entries(d.despues)) if (v !== null && v !== '') sal.push(`${CAMPOS[k] || k}: ${valor(k, v)}`);
  } else if (h.accion === 'eliminar' && d.antes) {
    for (const [k, v] of Object.entries(d.antes)) sal.push(`${CAMPOS[k] || k}: ${valor(k, v)}`);
  }
  return sal;
}

function leerFiltros() {
  const p = new URLSearchParams();
  for (const [param, id] of Object.entries(FILTROS)) {
    const v = $(id).value.trim();
    if (v) p.set(param, v);
  }
  return p;
}

function describirFiltros(p) {
  const partes = [];
  const txt = (id) => { const e = $(id); return e.tagName === 'SELECT' ? e.selectedOptions[0].textContent : e.value.trim(); };
  if (p.has('q')) partes.push(`"${p.get('q')}"`);
  if (p.has('doctor')) partes.push('doctor: ' + txt('f_doctor'));
  if (p.has('entidad')) partes.push('qué: ' + txt('f_entidad'));
  if (p.has('accion')) partes.push('acción: ' + txt('f_accion'));
  if (p.has('desde')) partes.push('desde ' + p.get('desde'));
  if (p.has('hasta')) partes.push('hasta ' + p.get('hasta'));
  return partes;
}

function fila(h) {
  const f = new Date(h.fecha_hora);
  const tr = el('tr');
  const camb = cambios(h);
  const celdaCamb = el('td');
  if (camb.length) {
    const det = el('details');
    det.append(el('summary', null, `Ver cambios (${camb.length})`));
    const ul = el('ul', 'mb-0 ps-3');
    for (const c of camb) ul.append(el('li', null, c));
    det.append(ul);
    celdaCamb.append(det);
  } else celdaCamb.textContent = '—';
  tr.append(
    el('td', 'text-nowrap', f.toLocaleDateString('es-MX')),
    el('td', 'text-nowrap', f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })),
    el('td', null, h.doctor),
    el('td', null, ACCIONES[h.accion] || h.accion),
    el('td', null, `${ENTIDADES[h.entidad] || h.entidad}: ${h.objeto || '—'}`),
    el('td', null, h.motivo || '—'),
    el('td', null, h.paciente || '—'),
    celdaCamb
  );
  return tr;
}

async function cargar() {
  const p = leerFiltros();
  // la URL guarda los filtros: se puede compartir, recargar o volver con "atrás"
  history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
  $('aviso').className = 'aviso d-none';
  $('resumen').textContent = 'Cargando…';
  try {
    const filas = await api('/api/historial?' + p);
    filasActuales = filas;
    const tbody = $('filas');
    tbody.replaceChildren();
    const activos = describirFiltros(p);
    let msg = filas.length === 1 ? '1 movimiento' : `${filas.length} movimientos`;
    if (activos.length) msg += ' con los filtros: ' + activos.join(', ');
    if (filas.length >= MAX) msg += `. Se muestran los ${MAX} más recientes; usa los filtros para acotar.`;
    $('resumen').textContent = msg;
    $('borrar').disabled = !activos.length;
    if (!filas.length) {
      const tr = el('tr');
      const td = el('td', null, activos.length ? 'Ningún movimiento coincide. Prueba "Borrar filtros".' : 'Aún no hay movimientos.');
      td.colSpan = 8;
      tr.append(td);
      tbody.append(tr);
    }
    for (const h of filas) tbody.append(fila(h));
  } catch (err) { $('resumen').textContent = ''; avisar(err.message, 'error'); }
}

function borrarFiltros() {
  for (const id of Object.values(FILTROS)) $(id).value = '';
  cargar();
  $('f_q').focus();
}

function rango(tipo) {
  const h = hoy();
  let desde = dia(h);
  if (tipo === '7') { const d = hoy(); d.setDate(d.getDate() - 6); desde = dia(d); }
  if (tipo === 'mes') desde = dia(h).slice(0, 8) + '01';
  $('f_desde').value = desde;
  $('f_hasta').value = dia(h);
  cargar();
}

// ---- exportar lo que se está viendo ----
function celdaCsv(v) {
  let s = String(v ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // evita que Excel lo interprete como fórmula
  return '"' + s.replace(/"/g, '""') + '"';
}
function descargarCsv() {
  const enc = ['Fecha', 'Hora', 'Doctor', 'Acción', 'Qué', 'Motivo', 'Paciente', 'Cambios'];
  const lineas = [enc.map(celdaCsv).join(',')];
  for (const h of filasActuales) {
    const f = new Date(h.fecha_hora);
    lineas.push([
      f.toLocaleDateString('es-MX'), f.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      h.doctor, ACCIONES[h.accion] || h.accion, `${ENTIDADES[h.entidad] || h.entidad}: ${h.objeto || ''}`,
      h.motivo || '', h.paciente || '', cambios(h).join('; '),
    ].map(celdaCsv).join(','));
  }
  const blob = new Blob(['\ufeff' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const a = el('a');
  a.href = URL.createObjectURL(blob);
  a.download = `historial-medistock-${dia(hoy())}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
  avisar('Se descargó el CSV con los movimientos que ves en pantalla.');
}

$('filtros').addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
for (const id of ['f_doctor', 'f_entidad', 'f_accion', 'f_desde', 'f_hasta']) $(id).addEventListener('change', cargar);
$('borrar').addEventListener('click', borrarFiltros);
for (const b of document.querySelectorAll('[data-rango]')) b.addEventListener('click', () => rango(b.dataset.rango));
$('csv').addEventListener('click', descargarCsv);
$('imprimir').addEventListener('click', () => window.print());

(async () => {
  try {
    const [docs, cat] = await Promise.all([api('/api/historial/doctores'), api('/api/medicamentos/catalogos')]);
    for (const d of docs) { const o = el('option', null, d.nombre); o.value = d.id_doctor; $('f_doctor').append(o); }
    for (const e of cat.estados) nombres.id_estado[e.id_estado] = e.nombre_est;
    for (const m of cat.marcas) nombres.id_marca[m.id_marca] = m.nombre;
    for (const t of cat.tipos) nombres.id_tipo[t.id_tipo] = t.nombre;
  } catch (err) { avisar(err.message, 'error'); }
  // filtros que vienen en la URL (por ejemplo desde Doctores > Ver historial de movimientos)
  const url = new URLSearchParams(location.search);
  for (const [param, id] of Object.entries(FILTROS)) if (url.has(param)) $(id).value = url.get(param);
  cargar();
})();