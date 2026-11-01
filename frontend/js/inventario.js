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
const modalVer = new bootstrap.Modal($('modalVer'));
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

function datos(m, campos) {
  const dl = el('dl', 'datos');
  const filas = {
    uso: ['Para qué sirve', m.descripcion || '—'],
    farmacos: ['Fármacos', m.farmacos || '—'],
    marca: ['Marca', m.marca || '—'],
    cantidad: ['Cantidad', `${m.cantidad_restante} de ${m.cantidad_tabletas} tabletas`],
    estado: ['Estado', m.estado],
    ubicacion: ['Ubicación', m.ubicaciones],
  };
  for (const c of campos) dl.append(el('dt', null, filas[c][0]), el('dd', null, filas[c][1]));
  const dd = el('dd');
  dd.append(m.fecha_caducidad + ' ', insignia(Number(m.dias_para_caducar)));
  dl.append(el('dt', null, 'Caducidad'), dd);
  return dl;
}

// Tarjeta resumida: el detalle y el botón Editar están en "Ver más"
function tarjeta(m) {
  const c = el('article', 'card-med');
  c.append(el('h2', null, m.nombre), datos(m, ['farmacos', 'cantidad']));

  const elim = el('button', 'btn-peligro', 'Eliminar');
  elim.setAttribute('aria-label', 'Eliminar ' + m.nombre);
  elim.addEventListener('click', () => { bajaId = m.id_medi; modalBaja.show(); });
  const ver = el('button', 'btn btn-rose', 'Ver más');
  ver.setAttribute('aria-label', 'Ver más de ' + m.nombre);
  ver.addEventListener('click', () => abrirVer(m));
  const acc = el('div', 'acciones');
  acc.append(elim, ver);
  c.append(acc);
  return c;
}

let verActual = null;
function abrirVer(m) {
  verActual = m;
  $('verTitulo').textContent = m.nombre;
  $('verDatos').replaceChildren(datos(m, ['uso', 'farmacos', 'marca', 'cantidad', 'estado', 'ubicacion']));
  modalVer.show();
}

$('verEditar').addEventListener('click', () => {
  const m = verActual;
  // Primero se cierra "Ver más" y luego se abre el formulario (nunca dos modales a la vez)
  $('modalVer').addEventListener('hidden.bs.modal', () => abrirEditar(m), { once: true });
  modalVer.hide();
});

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
  for (const mg of document.querySelectorAll('#farmacos .mg')) { mg.hidden = true; mg.required = false; }
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
  for (const i of document.querySelectorAll('#farmacos input[type=checkbox]')) {
    const f = (m.farmacos_det || []).find((x) => x.id === Number(i.value));
    const mg = $('mg-' + i.value);
    i.checked = !!f;
    mg.hidden = !f;
    mg.required = !!f;
    mg.value = f && f.mg != null ? f.mg : '';
  }
  $('grupoMotivo').hidden = false;
  $('motivoEdit').required = true;
  modalMed.show();
}

$('btnAnadir').addEventListener('click', abrirAgregar);
$('buscador').addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
$('salir').addEventListener('click', () => { localStorage.clear(); location.href = '/'; });

$('formMed').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { farmacos: [...document.querySelectorAll('#farmacos input[type=checkbox]:checked')].map((i) => ({ id: i.value, mg: $('mg-' + i.value).value })) };
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

function agregarFarmaco(id, nombre, marcado) {
  const d = el('div', 'form-check');
  const i = el('input', 'form-check-input');
  i.type = 'checkbox'; i.id = 'f-' + id; i.value = id; i.checked = marcado;
  const l = el('label', 'form-check-label', nombre);
  l.htmlFor = i.id;
  // Miligramos de este fármaco en este medicamento (aparece al marcarlo)
  const mg = el('input', 'form-control form-control-sm mg');
  mg.type = 'number'; mg.min = '0.01'; mg.step = 'any'; mg.id = 'mg-' + id;
  mg.placeholder = 'mg';
  mg.setAttribute('aria-label', 'Miligramos de ' + nombre);
  mg.hidden = !marcado; mg.required = marcado;
  i.addEventListener('change', () => {
    mg.hidden = !i.checked;
    mg.required = i.checked;
    if (i.checked) mg.focus(); else mg.value = '';
  });
  d.append(i, l, mg);
  $('farmacos').append(d);
}

// Crear fármaco, marca o ubicación sin salir del formulario
const RAPIDO = {
  farmacos: { titulo: 'Nuevo fármaco', desc: true },
  marcas: { titulo: 'Nueva marca' },
  ubicaciones: { titulo: 'Nueva ubicación' },
};
let rapidoTipo = null;

function abrirRapido(tipo) {
  rapidoTipo = tipo;
  $('rapidoTitulo').textContent = RAPIDO[tipo].titulo;
  $('rapidoDescGrupo').hidden = !RAPIDO[tipo].desc;
  $('rapidoNombre').value = '';
  $('rapidoDesc').value = '';
  $('rapidoError').classList.add('d-none');
  $('rapido').hidden = false;
  $('rapidoNombre').focus();
}
function cerrarRapido() { $('rapido').hidden = true; rapidoTipo = null; }

async function guardarRapido() {
  try {
    const n = await api('/api/catalogo/' + rapidoTipo, {
      method: 'POST',
      body: JSON.stringify({ nombre: $('rapidoNombre').value, descripcion: $('rapidoDesc').value }),
    });
    if (rapidoTipo === 'farmacos') {
      agregarFarmaco(n.id, n.nombre, true); // queda marcado
      $('mg-' + n.id).focus();
    } else {
      const s = $(rapidoTipo === 'marcas' ? 'id_marca' : 'id_ubi');
      const o = el('option', null, n.nombre);
      o.value = n.id;
      s.append(o);
      s.value = n.id;
    }
    cerrarRapido();
  } catch (err) {
    $('rapidoError').textContent = err.message;
    $('rapidoError').classList.remove('d-none');
  }
}

for (const b of document.querySelectorAll('[data-nuevo]')) b.addEventListener('click', () => abrirRapido(b.dataset.nuevo));
$('rapidoGuardar').addEventListener('click', guardarRapido);
$('rapidoCancelar').addEventListener('click', cerrarRapido);
for (const i of [$('rapidoNombre'), $('rapidoDesc')]) {
  i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); guardarRapido(); } });
}
$('modalMed').addEventListener('hidden.bs.modal', cerrarRapido);

(async () => {
  try {
    const cat = await api('/api/medicamentos/catalogos');
    llenar($('id_estado'), cat.estados, 'id_estado', 'nombre_est');
    llenar($('id_ubi'), cat.ubicaciones, 'id_ubi', 'nombre_ubi');
    llenar($('id_marca'), cat.marcas, 'id_marca', 'nombre');
    llenar($('motivo'), cat.motivos, 'id_motivo', 'nombre');
    llenar($('motivoEdit'), cat.motivos, 'id_motivo', 'nombre');
    for (const f of cat.farmacos) agregarFarmaco(f.id_farmaco, f.nombre, false);
    cargar();
  } catch (err) { avisar(err.message, 'error'); }
})();
