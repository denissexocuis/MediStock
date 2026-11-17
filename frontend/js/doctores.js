(async () => {
  try {
    const docs = await api('/api/historial/doctores');
    const tbody = $('filas');
    tbody.replaceChildren();
    $('conteo').textContent = docs.length === 1 ? '1 doctor activo' : `${docs.length} doctores activos`;
    if (!docs.length) {
      const tr = el('tr');
      const td = el('td', null, 'No hay doctores activos.');
      td.colSpan = 5;
      tr.append(td);
      tbody.append(tr);
    }
    for (const d of docs) {
      const tr = el('tr');
      const ver = el('a', 'btn btn-claro btn-sm', 'Ver historial de movimientos');
      ver.href = '/historial.html?doctor=' + encodeURIComponent(d.id_doctor);
      ver.setAttribute('aria-label', 'Ver historial de movimientos de ' + d.nombre);
      const acc = el('td');
      acc.append(ver);
      tr.append(
        el('td', null, d.nombre),
        el('td', null, d.especialidad || '—'),
        el('td', null, d.ultimo_acceso ? new Date(d.ultimo_acceso).toLocaleString('es-MX') : 'Nunca ha entrado'),
        el('td', null, String(d.movimientos)),
        acc
      );
      tbody.append(tr);
    }
  } catch (err) { avisar(err.message, 'error'); }
})();