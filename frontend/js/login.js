const form = document.getElementById('form');
const error = document.getElementById('error');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  error.classList.add('d-none');
  const r = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      usuario: document.getElementById('usuario').value,
      password: document.getElementById('password').value,
    }),
  });
  const data = await r.json();
  if (!r.ok) {
    error.textContent = data.error;
    error.classList.remove('d-none');
    return;
  }
  localStorage.setItem('token', data.token);
  location.href = '/inventario.html';
});
