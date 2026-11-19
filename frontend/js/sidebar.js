/* Navegación compartida: panel independiente, Usuarios y Activos desplegables. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api && api.sesion();
  const nav = document.getElementById('navegacion-principal');
  if (!nav || !sesion) return; // Cada módulo controla su propia redirección de acceso.

  const superusuario = sesion.role === 'SUPERUSER';
  const puedeCatalogos = superusuario || sesion.role === 'INTERMEDIATE_USER';
  const ruta = (window.location.pathname || '').split('/').pop() || 'panel.html';
  const grupos = [
    {
      id: 'usuarios', nombre: 'Usuarios', icono: '♙', permitido: superusuario,
      enlaces: [
        ['crear-usuario.html', '＋', 'Registrar usuario'],
        ['update_user.html', '✎', 'Actualizar datos'],
        ['modificar-rol.html', '♙', 'Modificar roles'],
        ['estado-usuario.html', '◉', 'Estados y eliminación'],
      ],
    },
    {
      id: 'activos', nombre: 'Activos', icono: '▣', permitido: true,
      enlaces: [
        ['registrar-activo.html', '▣', 'Registrar activo', superusuario],
        ['consultar-activo.html', '⌕', 'Consultar activo', true],
        ['actualizar-activo.html', '✎', 'Actualizar activo', superusuario],
        ['catalogos.html', '☰', 'Catálogos', puedeCatalogos],
      ],
    },
  ];

  function icono(valor) {
    const span = document.createElement('span');
    span.className = 'nav-icon';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = valor;
    return span;
  }

  function enlace(href, simbolo, titulo) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'nav-link';
    a.appendChild(icono(simbolo));
    a.appendChild(document.createTextNode(titulo));
    if (ruta === href) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  nav.appendChild(enlace('panel.html', '▦', 'Panel principal'));
  for (const grupo of grupos) {
    if (!grupo.permitido) continue;
    const contenedor = document.createElement('div');
    contenedor.className = 'nav-group';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-category';
    toggle.id = 'nav-toggle-' + grupo.id;
    toggle.setAttribute('aria-controls', 'nav-submenu-' + grupo.id);
    toggle.appendChild(icono(grupo.icono));
    const etiqueta = document.createElement('span');
    etiqueta.className = 'nav-category-label';
    etiqueta.textContent = grupo.nombre;
    toggle.appendChild(etiqueta);
    const flecha = document.createElement('span');
    flecha.className = 'nav-chevron';
    flecha.setAttribute('aria-hidden', 'true');
    flecha.textContent = '⌄';
    toggle.appendChild(flecha);
    const submenu = document.createElement('div');
    submenu.id = 'nav-submenu-' + grupo.id;
    submenu.className = 'nav-submenu';
    const permitidos = grupo.enlaces.filter(item => item.length < 4 || item[3]);
    for (const item of permitidos) submenu.appendChild(enlace(item[0], item[1], item[2]));
    const expandido = permitidos.some(item => item[0] === ruta);
    function expandir(abierto) {
      toggle.setAttribute('aria-expanded', String(abierto));
      toggle.classList.toggle('is-open', abierto);
      submenu.hidden = !abierto;
    }
    expandir(expandido);
    toggle.addEventListener('click', () => expandir(toggle.getAttribute('aria-expanded') !== 'true'));
    contenedor.appendChild(toggle);
    contenedor.appendChild(submenu);
    nav.appendChild(contenedor);
  }

  const movil = document.getElementById('sidebar-menu-toggle');
  const barra = document.querySelector('.sidebar');
  if (movil && barra) {
    movil.addEventListener('click', () => {
      const abierto = movil.getAttribute('aria-expanded') !== 'true';
      movil.setAttribute('aria-expanded', String(abierto));
      barra.classList.toggle('nav-mobile-open', abierto);
    });
  }
})();
