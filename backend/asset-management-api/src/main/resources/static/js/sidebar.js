/* Navegación compartida: panel independiente, Usuarios y Activos desplegables. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const session = api && api.session();
  const nav = document.getElementById('main-navigation');
  if (!nav || !session) return; // Cada módulo controla su propia redirección de acceso.

  const isSuperuser = session.role === 'SUPERUSER';
  const canManageCatalogs = isSuperuser || session.role === 'INTERMEDIATE_USER';
  const route = (window.location.pathname || '').split('/').pop() || 'dashboard.html';
  const groups = [
    {
      id: 'users', name: 'Usuarios', createIcon: '♙', allowed: isSuperuser,
      links: [
        ['create-user.html', '＋', 'Registrar usuario'],
        ['update-user.html', '✎', 'Actualizar datos'],
        ['change-role.html', '♙', 'Modificar roles'],
        ['user-status.html', '◉', 'Estados y eliminación'],
      ],
    },
    {
      id: 'assets', name: 'Activos', createIcon: '▣', allowed: true,
      links: [
        ['register-asset.html', '▣', 'Registrar activo', isSuperuser],
        ['view-asset.html', '⌕', 'Consultar activo', true],
        ['update-asset.html', '✎', 'Actualizar activo', isSuperuser],
        ['catalogs.html', '☰', 'Catálogos', canManageCatalogs],
      ],
    },
  ];

  function createIcon(value) {
    const span = document.createElement('span');
    span.className = 'nav-icon';
    span.setAttribute('aria-hidden', 'true');
    span.textContent = value;
    return span;
  }

  function createLink(href, symbol, title) {
    const a = document.createElement('a');
    a.href = href;
    a.className = 'nav-link';
    a.appendChild(createIcon(symbol));
    a.appendChild(document.createTextNode(title));
    if (route === href) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }
    return a;
  }

  nav.appendChild(createLink('dashboard.html', '▦', 'Panel principal'));
  for (const group of groups) {
    if (!group.allowed) continue;
    const container = document.createElement('div');
    container.className = 'nav-group';
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'nav-category';
    toggle.id = 'nav-toggle-' + group.id;
    toggle.setAttribute('aria-controls', 'nav-submenu-' + group.id);
    toggle.appendChild(createIcon(group.createIcon));
    const label = document.createElement('span');
    label.className = 'nav-category-label';
    label.textContent = group.name;
    toggle.appendChild(label);
    const arrow = document.createElement('span');
    arrow.className = 'nav-chevron';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '⌄';
    toggle.appendChild(arrow);
    const submenu = document.createElement('div');
    submenu.id = 'nav-submenu-' + group.id;
    submenu.className = 'nav-submenu';
    const allowedLinks = group.links.filter(item => item.length < 4 || item[3]);
    for (const item of allowedLinks) submenu.appendChild(createLink(item[0], item[1], item[2]));
    const expanded = allowedLinks.some(item => item[0] === route);
    function toggleExpanded(isOpen) {
      toggle.setAttribute('aria-expanded', String(isOpen));
      toggle.classList.toggle('is-open', isOpen);
      submenu.hidden = !isOpen;
    }
    toggleExpanded(expanded);
    toggle.addEventListener('click', () => toggleExpanded(toggle.getAttribute('aria-expanded') !== 'true'));
    container.appendChild(toggle);
    container.appendChild(submenu);
    nav.appendChild(container);
  }

  const mobileToggle = document.getElementById('sidebar-menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      const isOpen = mobileToggle.getAttribute('aria-expanded') !== 'true';
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
      sidebar.classList.toggle('nav-mobile-open', isOpen);
    });
  }
})();
