const modalForm = new bootstrap.Modal($('modalForm'));
const modalBaja = new bootstrap.Modal($('modalBaja'));
let editandoId = null;
let bajaId = null;

async function cargar() {
  try {
    const lista = await api('/api/farmacos');
    const tbody = $('filas');
    tbody.replaceChildren();
    if (!lista.length) {
      const tr = el('tr');
      const td = el('td', null, 'Aún no hay fármacos.');
      td.colSpan = 4;
      tr.append(td);
      tbody.append(tr);
    }
    for (const f of lista) {
      const tr = el('tr');
      const editar = el('button', 'btn btn-claro btn-sm', 'Editar');
      editar.addEventListener('click', () => abrirEditar(f));
      const elim = el('button', 'btn-peligro ms-2', 'Eliminar');
      elim.addEventListener('click', () => abrirBaja(f));
      const acc = el('td');
      acc.append(editar, elim);
      tr.append(el('td', null, f.nombre), el('td', null, f.tipo || 'Sin clasificar'), el('td', null, f.descripcion || '—'), acc);
      tbody.append(tr);
    }
  } catch (err) { avisar(err.message, 'error'); }
}

function abrirNuevo() {
  editandoId = null;
  $('form').reset();
  $('tituloForm').textContent = 'Nuevo fármaco';
  $('grupoMotivo').hidden = true;
  $('motivoF').required = false;
  $('errorForm').classList.add('d-none');
  modalForm.show();
}

function abrirEditar(f) {
  editandoId = f.id_farmaco;
  $('form').reset();
  $('tituloForm').textContent = 'Editar fármaco';
  $('nombreF').value = f.nombre;
  $('descF').value = f.descripcion || '';
  $('tipoF').value = f.id_tipo || '';
  $('grupoMotivo').hidden = false;
  $('motivoF').required = true;
  $('errorForm').classList.add('d-none');
  modalForm.show();
}

function abrirBaja(f) {
  bajaId = f.id_farmaco;
  $('textoBaja').textContent = `Vas a eliminar "${f.nombre}". Quedará registrado en el historial.`;
  $('motivoBaja').value = '';
  $('errorBaja').classList.add('d-none');
  modalBaja.show();
}

$('btnNuevo').addEventListener('click', abrirNuevo);

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { nombre: $('nombreF').value, descripcion: $('descF').value, id_tipo: $('tipoF').value };
  try {
    if (editandoId) {
      body.id_motivo = $('motivoF').value;
      await api('/api/farmacos/' + editandoId, { method: 'PUT', body: JSON.stringify(body) });
      avisar('Fármaco actualizado. Quedó registrado en el historial.');
    } else {
      await api('/api/farmacos', { method: 'POST', body: JSON.stringify(body) });
      avisar('Fármaco registrado.');
    }
    modalForm.hide();
    cargar();
  } catch (err) {
    $('errorForm').textContent = err.message;
    $('errorForm').classList.remove('d-none');
  }
});

$('formBaja').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/farmacos/' + bajaId, { method: 'DELETE', body: JSON.stringify({ id_motivo: $('motivoBaja').value }) });
    modalBaja.hide();
    avisar('Fármaco eliminado. Quedó registrado en el historial.');
    cargar();
  } catch (err) {
    $('errorBaja').textContent = err.message;
    $('errorBaja').classList.remove('d-none');
  }
});

(async () => {
  try {
    await Promise.all([cargarMotivos($('motivoF'), 'editar'), cargarMotivos($('motivoBaja'), 'baja_catalogo')]);
    const tipos = await api('/api/farmacos/tipos');
    for (const t of tipos) {
      const o = el('option', null, t.nombre);
      o.value = t.id_tipo;
      $('tipoF').append(o);
    }
  } catch (err) { avisar(err.message, 'error'); }
  cargar();
})();