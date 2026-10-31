const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const $ = (id) => document.getElementById(id);
const modal = new bootstrap.Modal($('modalBaja'));
let idBaja = null;

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

function avisar(msg, tipo = 'success') {
  const a = $('aviso');
  a.className = `alert alert-${tipo}`;
  a.textContent = msg;
}

function llenar(select, items, valor, texto) {
  for (const i of items) {
    const o = document.createElement('option');
    o.value = i[valor];
    o.textContent = i[texto];
    select.append(o);
  }
}

// El estado de caducidad va en texto, no solo en color
function insignia(dias) {
  const b = document.createElement('span');
  b.className = 'badge ' + (dias <= 30 ? 'text-bg-danger' : 'text-bg-success');
  b.textContent = dias < 0 ? `Caducado hace ${-dias} días` : `Vence en ${dias} días`;
  return b;
}

async function cargar() {
  try {
    const meds = await api('/api/medicamentos?q=' + encodeURIComponent($('q').value));
    const tbody = $('lista');
    tbody.replaceChildren();
    if (!meds.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.textContent = 'No hay medicamentos que coincidan.';
      tr.append(td);
      tbody.append(tr);
      return;
    }
    for (const m of meds) {
      const tr = document.createElement('tr');
      for (const t of [m.nombre, m.descripcion || '—', `${m.cantidad_restante} de ${m.cantidad_tabletas}`, m.estado, m.ubicaciones]) {
        const td = document.createElement('td');
        td.textContent = t; // textContent evita XSS
        tr.append(td);
      }
      const tdFecha = document.createElement('td');
      tdFecha.append(m.fecha_caducidad + ' ', insignia(Number(m.dias_para_caducar)));
      tr.append(tdFecha);

      const btn = document.createElement('button');
      btn.className = 'btn btn-sm btn-outline-danger';
      btn.textContent = 'Dar de baja';
      btn.setAttribute('aria-label', 'Dar de baja ' + m.nombre);
      btn.addEventListener('click', () => { idBaja = m.id_medi; modal.show(); });
      const tdAcc = document.createElement('td');
      tdAcc.append(btn);
      tr.append(tdAcc);
      tbody.append(tr);
    }
  } catch (err) { avisar(err.message, 'danger'); }
}

$('buscador').addEventListener('submit', (e) => { e.preventDefault(); cargar(); });
$('salir').addEventListener('click', () => { localStorage.clear(); location.href = '/'; });

$('nuevo').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/medicamentos', {
      method: 'POST',
      body: JSON.stringify({
        nombre: $('nombre').value,
        descripcion: $('descripcion').value,
        cantidad_tabletas: $('cantidad_tabletas').value,
        cantidad_restante: $('cantidad_restante').value,
        fecha_caducidad: $('fecha_caducidad').value,
        id_estado: $('id_estado').value,
        id_ubi: $('id_ubi').value,
      }),
    });
    e.target.reset();
    avisar('Medicamento registrado.');
    cargar();
  } catch (err) { avisar(err.message, 'danger'); }
});

$('formBaja').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/medicamentos/' + idBaja, {
      method: 'DELETE',
      body: JSON.stringify({ id_motivo: $('motivo').value }),
    });
    modal.hide();
    avisar('Medicamento dado de baja. Quedó registrado en el historial.');
    cargar();
  } catch (err) { avisar(err.message, 'danger'); }
});

(async () => {
  try {
    const cat = await api('/api/medicamentos/catalogos');
    llenar($('id_estado'), cat.estados, 'id_estado', 'nombre_est');
    llenar($('id_ubi'), cat.ubicaciones, 'id_ubi', 'nombre_ubi');
    llenar($('motivo'), cat.motivos, 'id_motivo', 'nombre');
    cargar();
  } catch (err) { avisar(err.message, 'danger'); }
})();
