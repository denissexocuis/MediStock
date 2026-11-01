const form = document.getElementById('form');
const error = document.getElementById('error');
const pass = document.getElementById('password');
const ver = document.getElementById('ver');

ver.addEventListener('click', () => {
  const visible = pass.type === 'text';
  pass.type = visible ? 'password' : 'text';
  ver.textContent = visible ? 'Mostrar' : 'Ocultar';
  ver.setAttribute('aria-pressed', String(!visible));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.classList.add('d-none');
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: document.getElementById('usuario').value, password: pass.value }),
  });
  const data = await r.json();
  if (!r.ok) {
    error.textContent = data.error;
    error.classList.remove('d-none');
    return;
  }
  localStorage.setItem('token', data.token);
  localStorage.setItem('nombre', data.nombre);
  location.href = '/inventario.html';
});
