const modalForm = new bootstrap.Modal($('modalForm'));
const modalBaja = new bootstrap.Modal($('modalBaja'));
let editandoId = null;
let bajaId = null;

async function cargar() {
  try {
    const lista = await api('/api/marcas');
    const tbody = $('filas');
    tbody.replaceChildren();
    if (!lista.length) {
      const tr = el('tr');
      const td = el('td', null, 'Aún no hay marcas.');
      td.colSpan = 2;
      tr.append(td);
      tbody.append(tr);
    }
    for (const m of lista) {
      const tr = el('tr');
      const editar = el('button', 'btn btn-claro btn-sm', 'Editar');
      editar.addEventListener('click', () => abrirEditar(m));
      const elim = el('button', 'btn-peligro ms-2', 'Eliminar');
      elim.addEventListener('click', () => abrirBaja(m));
      const acc = el('td');
      acc.append(editar, elim);
      tr.append(el('td', null, m.nombre), acc);
      tbody.append(tr);
    }
  } catch (err) { avisar(err.message, 'error'); }
}

function abrirNuevo() {
  editandoId = null;
  $('form').reset();
  $('tituloForm').textContent = 'Nueva marca';
  $('grupoMotivo').hidden = true;
  $('motivoM').required = false;
  $('errorForm').classList.add('d-none');
  modalForm.show();
}

function abrirEditar(m) {
  editandoId = m.id_marca;
  $('form').reset();
  $('tituloForm').textContent = 'Editar marca';
  $('nombreM').value = m.nombre;
  $('grupoMotivo').hidden = false;
  $('motivoM').required = true;
  $('errorForm').classList.add('d-none');
  modalForm.show();
}

function abrirBaja(m) {
  bajaId = m.id_marca;
  $('textoBaja').textContent = `Vas a eliminar "${m.nombre}". Quedará registrado en el historial.`;
  $('motivoBaja').value = '';
  $('errorBaja').classList.add('d-none');
  modalBaja.show();
}

$('btnNuevo').addEventListener('click', abrirNuevo);

$('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const body = { nombre: $('nombreM').value };
  try {
    if (editandoId) {
      body.id_motivo = $('motivoM').value;
      await api('/api/marcas/' + editandoId, { method: 'PUT', body: JSON.stringify(body) });
      avisar('Marca actualizada. Quedó registrado en el historial.');
    } else {
      await api('/api/marcas', { method: 'POST', body: JSON.stringify(body) });
      avisar('Marca registrada.');
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
    await api('/api/marcas/' + bajaId, { method: 'DELETE', body: JSON.stringify({ id_motivo: $('motivoBaja').value }) });
    modalBaja.hide();
    avisar('Marca eliminada. Quedó registrado en el historial.');
    cargar();
  } catch (err) {
    $('errorBaja').textContent = err.message;
    $('errorBaja').classList.remove('d-none');
  }
});

(async () => {
  try { await Promise.all([cargarMotivos($('motivoM'), 'editar'), cargarMotivos($('motivoBaja'), 'baja_catalogo')]); }
  catch (err) { avisar(err.message, 'error'); }
  cargar();
})();
