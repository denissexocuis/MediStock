const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt; // textContent evita XSS
  return e;
};
const modalMed = new bootstrap.Modal($('modalMed'));
const modalBaja = new bootstrap.Modal($('modalBaja'));
let editandoId = null;
let bajaId = null;

const nombre = localStorage.getItem('nombre') || 'doctor';
$('saludo').textContent = `¡Hola, ${nombre}!`;
$('quien').textContent = 'Dr(a). ' + nombre;

async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  });
  if (r.status === 401) { localStorage.clear(); location.href = '/login'; return; }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}

function avisar(msg, tipo = 'ok') {
  const a = $('aviso');
  a.className = 'aviso ' + tipo;
  a.textContent = msg;
}

function llenar(select, items, valor, texto) {
  for (const i of items) {
    const o = el('option', null, i[texto]);
    o.value = i[valor];
    select.append(o);
  }
}

// El estado de caducidad va en texto, no solo en color
function insignia(dias) {
  const texto = dias < 0 ? `Caducado hace ${-dias} días` : `Vence en ${dias} días`;
  return el('span', 'insignia ' + (dias <= 30 ? 'alerta' : 'bien'), texto);
}

function tarjeta(m) {
  const c = el('article', 'card-med');
  c.append(el('h2', null, m.nombre));
  const dl = el('dl', 'datos');
  const fila = (k, v) => dl.append(el('dt', null, k), el('dd', null, v));
  fila('Para qué sirve', m.descripcion || '—');
  fila('Fármacos', m.farmacos || '—');
  fila('Marca', m.marca || '—');
  fila('Cantidad', `${m.cantidad_restante} de ${m.cantidad_tabletas}`);
  fila('Estado', m.estado);
  fila('Ubicación', m.ubicaciones);
  const dd = el('dd');
  dd.append(m.fecha_caducidad + ' ', insignia(Number(m.dias_para_caducar)));
  dl.append(el('dt', null, 'Caducidad'), dd);
  c.append(dl);

  const elim = el('button', 'btn-peligro', 'Eliminar');
  elim.setAttribute('aria-label', 'Eliminar ' + m.nombre);
  elim.addEventListener('click', () => { bajaId = m.id_medi; modalBaja.show(); });
  const edit = el('button', 'btn btn-rose', 'Editar');
  edit.setAttribute('aria-label', 'Editar ' + m.nombre);
  edit.addEventListener('click', () => abrirEditar(m));
  const acc = el('div', 'acciones');
  acc.append(elim, edit);
  c.append(acc);
  return c;
}

async function cargar() {
  try {
    const meds = await api('/api/medicamentos?q=' + encodeURIComponent($('q').value));
    const lista = $('lista');
    lista.replaceChildren();
    if (!meds.length) lista.append(el('p', null, 'No hay medicamentos que coincidan.'));
    for (const m of meds) lista.append(tarjeta(m));
  } catch (err) { avisar(err.message, 'error'); }
}

const CAMPOS = ['nombre', 'descripcion', 'cantidad_tabletas', 'cantidad_restante', 'fecha_caducidad', 'id_estado', 'id_marca', 'id_ubi'];

function abrirAgregar() {
  editandoId = null;
  $('formMed').reset();
  $('tituloMed').textContent = 'Agregar medicamento';
  $('formMed').querySelector('.modal-footer .btn-rose').textContent = 'Agregar';
  $('grupoMotivo').hidden = true;
  $('motivoEdit').required = false;
  modalMed.show();
}

function abrirEditar(m) {
  editandoId = m.id_medi;
  $('formMed').reset();
  $('tituloMed').textContent = 'Editar medicamento';
  $('formMed').querySelector('.modal-footer .btn-rose').textContent = 'Guardar cambios';
  for (const k of CAMPOS) $(k).value = m[k] ?? '';
  for (const i of document.querySelectorAll('#farmacos input')) i.checked = m.farmacos_ids.includes(Number(i.value));
  $('grupoMotivo').hidden = false;
  $('motivoEdit').required = true;
  modalMed.show();
}

$('btnAnadir').addEventListener('click', abrirAgregar);
$('buscador').addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
$('salir').addEventListener('click', () => { localStorage.clear(); location.href = '/'; });

$('formMed').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { farmacos: [...document.querySelectorAll('#farmacos input:checked')].map((i) => i.value) };
  for (const k of CAMPOS) body[k] = $(k).value;
  try {
    if (editandoId) {
      body.id_motivo = $('motivoEdit').value;
      await api('/api/medicamentos/' + editandoId, { method: 'PUT', body: JSON.stringify(body) });
      avisar('Cambios guardados. Quedaron registrados en el historial.');
    } else {
      await api('/api/medicamentos', { method: 'POST', body: JSON.stringify(body) });
      avisar('Medicamento registrado.');
    }
    modalMed.hide();
    cargar();
  } catch (err) { avisar(err.message, 'error'); modalMed.hide(); }
});

$('formBaja').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/medicamentos/' + bajaId, { method: 'DELETE', body: JSON.stringify({ id_motivo: $('motivo').value }) });
    modalBaja.hide();
    avisar('Medicamento eliminado. Quedó registrado en el historial.');
    cargar();
  } catch (err) { avisar(err.message, 'error'); modalBaja.hide(); }
});

(async () => {
  try {
    const cat = await api('/api/medicamentos/catalogos');
    llenar($('id_estado'), cat.estados, 'id_estado', 'nombre_est');
    llenar($('id_ubi'), cat.ubicaciones, 'id_ubi', 'nombre_ubi');
    llenar($('id_marca'), cat.marcas, 'id_marca', 'nombre');
    llenar($('motivo'), cat.motivos, 'id_motivo', 'nombre');
    llenar($('motivoEdit'), cat.motivos, 'id_motivo', 'nombre');
    for (const f of cat.farmacos) {
      const d = el('div', 'form-check');
      const i = el('input', 'form-check-input');
      i.type = 'checkbox'; i.id = 'f-' + f.id_farmaco; i.value = f.id_farmaco;
      const l = el('label', 'form-check-label', f.nombre);
      l.htmlFor = i.id;
      d.append(i, l);
      $('farmacos').append(d);
    }
    cargar();
  } catch (err) { avisar(err.message, 'error'); }
})();
