const token = localStorage.getItem('token');
if (!token) location.href = '/login';

const $ = (id) => document.getElementById(id);
const el = (tag, cls, txt) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (txt !== undefined) e.textContent = txt;
  return e;
};

async function api(url, opts = {}) {
  const r = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
  });
  if (r.status === 401) { localStorage.removeItem('token'); localStorage.removeItem('nombre'); location.href = '/login'; return; }
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}

function avisar(msg, tipo = 'ok') {
  const a = $('aviso');
  a.className = 'aviso ' + tipo;
  a.textContent = msg;
}

const nombre = localStorage.getItem('nombre') || 'doctor';
if ($('quien')) $('quien').textContent = 'Dr(a). ' + nombre;
if ($('salir')) $('salir').addEventListener('click', () => { localStorage.removeItem('token'); localStorage.removeItem('nombre'); location.href = '/'; });

// Llena un <select> con los motivos de la tabla `motivo`. Fármacos y marcas no usan "Entregado a...".
async function cargarMotivos(select, uso) { // uso: 'editar' | 'baja_catalogo'
  const cat = await api('/api/medicamentos/catalogos');
  select.replaceChildren();
  const vacio = el('option', null, 'Elige un motivo');
  vacio.value = '';
  select.append(vacio);
  for (const m of cat.motivos.filter((x) => x.usos.includes(uso))) {
    const o = el('option', null, m.nombre);
    o.value = m.id_motivo;
    select.append(o);
  }
}
