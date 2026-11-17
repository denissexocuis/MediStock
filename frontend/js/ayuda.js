// Pinta la guía completa con los mismos pasos del recorrido de bienvenida.
const guia = $('guia');
const indice = $('indice');

Tutorial.PASOS.forEach((p, i) => {
  const id = 'tema-' + (i + 1);
  const li = el('li');
  const a = el('a', null, p.titulo);
  a.href = '#' + id;
  li.append(a);
  indice.append(li);

  const sec = el('section', 'mb-4');
  sec.setAttribute('aria-labelledby', id);
  const h = el('h2', 'h5', p.titulo);
  h.id = id;
  sec.append(h, el('p', null, p.resumen));
  const ol = el('ol');
  p.como.forEach((t) => ol.append(el('li', null, t)));
  sec.append(ol);
  if (p.enlace) {
    const e = el('a', null, p.enlace[1]);
    e.href = p.enlace[0];
    const pe = el('p', 'mb-0');
    pe.append(e);
    sec.append(pe);
  }
  guia.append(sec);
});

$('verRecorrido').addEventListener('click', () => Tutorial.abrir(false));
