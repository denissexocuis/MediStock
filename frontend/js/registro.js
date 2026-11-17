const form = document.getElementById('form');
const error = document.getElementById('error');

function mostrarError(msg) {
  error.textContent = msg;
  error.classList.remove('d-none');
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.classList.add('d-none');

  const cedula = document.getElementById('cedula').value.trim();
  const nombre = document.getElementById('nombre').value.trim();
  const ap_paterno = document.getElementById('ap_paterno').value.trim();
const ap_materno = document.getElementById('ap_materno').value.trim();
  const especialidad = document.getElementById('especialidad').value.trim();
  const correo = document.getElementById('correo').value.trim();
  const usuario = document.getElementById('usuario').value.trim();
  const password = document.getElementById('password').value;
  const password2 = document.getElementById('password2').value;

  if (password !== password2) {
    return mostrarError('Las contraseñas no coinciden.');
  }

  try {
    const res = await fetch('/api/registro', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, nombre, ap_paterno, ap_materno, especialidad, correo, usuario, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo registrar.');
    window.location.href = '/login';
  } catch (err) {
    mostrarError(err.message);
  }
});