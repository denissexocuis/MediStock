// Tutorial de bienvenida (se muestra una vez a cada doctor nuevo) y contenido de la página Ayuda.
// Aquí vive el texto: la página Ayuda y el recorrido paso a paso usan los mismos pasos.
(function () {
  var PASOS = [
    { titulo: 'Bienvenido(a) a MediStock',
      resumen: 'MediStock lleva el inventario de medicamentos de la clínica y deja constancia de cada movimiento. Este recorrido dura un minuto.',
      como: ['El menú de la izquierda te lleva a cada sección: Inventario, Fármacos, Marcas, Doctores, Historial, Opciones y Ayuda.',
             'Puedes volver a ver esta guía cuando quieras en Ayuda.'] },
    { titulo: 'Inventario: ver y buscar medicamentos',
      resumen: 'Aquí aparecen todos los medicamentos en tarjetas, con su cantidad y su fecha de caducidad.',
      como: ['Escribe en el buscador y pulsa Buscar.',
             'Usa los filtros: categoría, fármaco, marca, ubicación, estado y caducidad. "Limpiar filtros" los quita todos.',
             '"Por caducar" muestra lo que vence en los próximos 30 días.',
             'Arriba aparece un aviso si hay medicamentos caducados o por caducar, con el botón "Ver cuáles".'],
      enlace: ['/inventario.html', 'Ir al Inventario'] },
    { titulo: 'Añadir un medicamento',
      resumen: 'Se hace con el botón "Añadir +" del Inventario.',
      como: ['Escribe el nombre y para qué sirve.',
             'Marca los fármacos que contiene y pon sus miligramos. Si falta uno, usa "+ Nuevo fármaco" sin salir del formulario.',
             'Elige una o varias categorías (antibiótico, analgésico...). Si no existe, usa "+ Nueva categoría".',
             'Elige la marca y la ubicación, y escribe las tabletas del empaque y las que quedan.',
             'Elige el estado (Nuevo o Abierto) y la fecha de caducidad. La foto es opcional.',
             'Pulsa Agregar. El alta queda registrada en el historial.'] },
    { titulo: 'Ver más y editar',
      resumen: 'Cada tarjeta tiene "Ver más" con todo el detalle y el botón Editar.',
      como: ['Pulsa "Ver más" para ver marca, estado, ubicación y fármacos con sus miligramos.',
             'Pulsa Editar, cambia lo que necesites y elige el motivo del cambio (Corrección de datos).',
             'Pulsa "Guardar cambios". Queda en el historial lo que había antes y lo que quedó después.'] },
    { titulo: 'Eliminar un medicamento',
      resumen: 'Se hace con el botón Eliminar de la tarjeta. Siempre se pide un motivo.',
      como: ['Elige el motivo: "Entregado a..." (escribe el nombre del paciente), "Caducado" o "Corrección de datos".',
             'No se borra del todo: deja de verse en el inventario, pero queda en el historial.'] },
    { titulo: 'Fármacos y Marcas',
      resumen: 'Son las listas que usas al registrar medicamentos. Puedes crear, editar y eliminar.',
      como: ['Usa "Nuevo fármaco +" o "Nueva marca +" para agregar.',
             'Al editar o eliminar eliges el motivo, y el cambio queda en el historial.',
             'Un fármaco o una marca que usan medicamentos activos no se puede eliminar hasta que cambies esos medicamentos.'],
      enlace: ['/farmacos.html', 'Ir a Fármacos'] },
    { titulo: 'Doctores',
      resumen: 'Muestra los doctores activos y su última actividad.',
      como: ['Cada doctor tiene el botón "Ver historial de movimientos", que abre el Historial ya filtrado por esa persona.'],
      enlace: ['/doctores.html', 'Ir a Doctores'] },
    { titulo: 'Historial',
      resumen: 'Aquí se ve todo lo que se hizo: quién, cuándo, qué y por qué. Nada se borra del historial.',
      como: ['Filtra por tipo de movimiento, acción, doctor, fechas o busca por nombre. Hay atajos: Hoy, Últimos 7 días y Este mes.',
             '"Borrar filtros" vuelve a mostrar todo.',
             '"Ver cambios" muestra qué había antes y qué quedó.',
             '"Descargar CSV" y "Imprimir" sirven para reportes.'],
      enlace: ['/historial.html', 'Ir al Historial'] },
    { titulo: 'Opciones: hazlo cómodo para ti',
      resumen: 'Cambia colores, contraste, tamaño de letra y más. Se guardan en tu cuenta y te siguen a cualquier equipo.',
      como: ['Paleta de colores y tema claro, oscuro o de alto contraste.',
             'Tamaño del texto del 50 % al 200 %.',
             'Modo daltonismo, subrayar enlaces, más espacio entre letras, fuente fácil de leer, foco grande y botones grandes.'],
      enlace: ['/opciones.html', 'Ir a Opciones'] },
    { titulo: 'Cuida tu cuenta',
      resumen: 'Todo lo que haces queda registrado con tu nombre.',
      como: ['No compartas tu usuario ni tu contraseña.',
             'Cierra sesión al terminar, sobre todo en equipos compartidos.',
             'Puedes consultar el Aviso de privacidad y los Términos y condiciones desde la pantalla de inicio de sesión.'] },
  ];

  var token = null;
  try { token = localStorage.getItem('token'); } catch (e) { /* sin almacenamiento */ }

  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined) e.textContent = txt;
    return e;
  }
  function llamar(metodo) {
    return fetch('/api/ajustes/tutorial', { method: metodo, headers: { Authorization: 'Bearer ' + token } })
      .then(function (r) { if (!r.ok) throw new Error(); return r.json(); });
  }

  var modal = null, indice = 0, esAutomatico = false, ui = {};

  function construir() {
    var m = el('div', 'modal fade');
    m.id = 'modalTutorial'; m.tabIndex = -1;
    m.setAttribute('aria-labelledby', 'tutTitulo'); m.setAttribute('aria-hidden', 'true');
    m.setAttribute('data-bs-backdrop', 'static');
    var dlg = el('div', 'modal-dialog modal-dialog-scrollable modal-dialog-centered');
    var c = el('div', 'modal-content');

    var h = el('div', 'modal-header');
    ui.titulo = el('h2', 'modal-title h5'); ui.titulo.id = 'tutTitulo'; ui.titulo.tabIndex = -1;
    var x = el('button', 'btn-close'); x.type = 'button'; x.setAttribute('data-bs-dismiss', 'modal'); x.setAttribute('aria-label', 'Cerrar tutorial');
    h.append(ui.titulo, x);

    var b = el('div', 'modal-body');
    ui.progreso = el('p', 'small mb-2'); ui.progreso.setAttribute('role', 'status'); ui.progreso.setAttribute('aria-live', 'polite');
    ui.resumen = el('p');
    ui.lista = el('ol', 'mb-2');
    b.append(ui.progreso, ui.resumen, ui.lista);

    var f = el('div', 'modal-footer justify-content-between');
    ui.omitir = el('button', 'btn btn-claro', 'Omitir tutorial'); ui.omitir.type = 'button'; ui.omitir.setAttribute('data-bs-dismiss', 'modal');
    var der = el('div', 'd-flex gap-2');
    ui.atras = el('button', 'btn btn-claro', 'Anterior'); ui.atras.type = 'button';
    ui.sigue = el('button', 'btn btn-rose', 'Siguiente'); ui.sigue.type = 'button';
    der.append(ui.atras, ui.sigue);
    f.append(ui.omitir, der);

    c.append(h, b, f); dlg.append(c); m.append(dlg); document.body.append(m);

    ui.atras.addEventListener('click', function () { mostrar(indice - 1); });
    ui.sigue.addEventListener('click', function () {
      if (indice < PASOS.length - 1) mostrar(indice + 1);
      else modal.hide();
    });
    m.addEventListener('hidden.bs.modal', function () {
      if (esAutomatico) { esAutomatico = false; llamar('POST').catch(function () { /* se mostrará otra vez la próxima vez */ }); }
    });
    m.addEventListener('shown.bs.modal', function () { ui.titulo.focus(); });
    return m;
  }

  function mostrar(i) {
    indice = i;
    var p = PASOS[i];
    ui.titulo.textContent = p.titulo;
    ui.progreso.textContent = 'Paso ' + (i + 1) + ' de ' + PASOS.length;
    ui.resumen.textContent = p.resumen;
    ui.lista.replaceChildren();
    p.como.forEach(function (t) { ui.lista.append(el('li', null, t)); });
    ui.atras.disabled = i === 0;
    ui.sigue.textContent = i === PASOS.length - 1 ? 'Entendido' : 'Siguiente';
    ui.omitir.hidden = i === PASOS.length - 1;
    if (i > 0) ui.titulo.focus();
  }

  function abrir(automatico) {
    if (!window.bootstrap) return;
    var m = document.getElementById('modalTutorial') || construir();
    if (!modal) modal = window.bootstrap.Modal.getOrCreateInstance(m);
    esAutomatico = !!automatico;
    mostrar(0);
    modal.show();
  }

  window.Tutorial = { PASOS: PASOS, abrir: abrir };

  // al entrar al Inventario por primera vez, un doctor nuevo ve el recorrido
  function arrancar() {
    if (location.pathname !== '/inventario.html' || !token) return;
    llamar('GET').then(function (r) { if (!r.visto) abrir(true); }).catch(function () { /* sin tutorial automático */ });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', arrancar); else arrancar();
})();
