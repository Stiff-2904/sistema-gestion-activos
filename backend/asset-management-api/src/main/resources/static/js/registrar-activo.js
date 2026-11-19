/* HU-GA-01: POST autenticado, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('formulario-activo');
  const notice = document.getElementById('mensaje-activo');
  const submitButton = document.getElementById('boton-registrar-activo');
  const cancelButton = document.getElementById('cancelar-activo');

  // clave del formulario -> id del campo en la pagina
  const FIELDS = {
    assetNumber: 'numero-activo',
    description: 'descripcion-activo',
    brand: 'marca-activo',
    model: 'modelo-activo',
    serial: 'serie-activo',
    price: 'precio-activo',
    statusId: 'estado-activo',
    locationId: 'ubicacion-activo',
    categoryId: 'categoria-activo',
    acquisitionModeId: 'modo-activo',
    currentResponsibleId: 'responsable-activo',
    notes: 'observaciones-activo',
  };
  // lista del catalogo -> campo que se llena y nombre para el mensaje de lista vacia
  const LISTS = {
    statuses: { key: 'statusId', name: 'estados', required: true },
    locations: { key: 'locationId', name: 'ubicaciones', required: true },
    categories: { key: 'categoryId', name: 'categorias', required: true },
    acquisitionModes: { key: 'acquisitionModeId', name: 'modos de adquisicion', required: true },
    responsibles: { key: 'currentResponsibleId', name: 'responsables', required: false },
  };
  const fields = {};
  for (const [key, id] of Object.entries(FIELDS)) fields[key] = document.getElementById(id);

  // Sin sesion va al login; con sesion pero sin rol SUPERUSER vuelve a la pantalla principal.
  const session = api.session();
  if (!session) {
    window.location.replace('index.html');
    return;
  }
  if (session.role !== 'SUPERUSER') {
    window.location.replace('panel.html');
    return;
  }

  function message(text = '', cssClass = '') {
    notice.textContent = text;
    notice.className = 'mensaje-formulario' + (cssClass ? ' ' + cssClass : '');
  }
  function clear() {
    message();
    for (const [key, field] of Object.entries(fields)) {
      field.classList.remove('campo-invalido');
      field.removeAttribute('aria-invalid');
      document.getElementById('error-' + FIELDS[key]).textContent = '';
    }
  }
  for (const field of Object.values(fields)) {
    field.addEventListener('input', clear);
    field.addEventListener('change', clear);
  }

  function populateSelect(select, items) {
    for (const item of items) {
      const option = document.createElement('option');
      option.value = String(item.id);
      option.textContent = item.name;
      select.appendChild(option);
    }
  }

  // Las listas desplegables salen de la base de datos, no estan escritas en la pagina.
  async function loadCatalog() {
    try {
      const catalog = await api.request('/api/v1/assets/catalog', { authenticated: true });
      const vacias = [];
      for (const [list, destination] of Object.entries(LISTS)) {
        const items = Array.isArray(catalog[list]) ? catalog[list] : [];
        populateSelect(fields[destination.key], items);
        if (destination.required && items.length === 0) vacias.push(destination.name);
      }
      if (vacias.length > 0) {
        message('No hay ' + vacias.join(', ') + ' registrados en el sistema. Agreguelos en la base de datos antes de registrar activos.', 'error');
      }
    } catch (error) {
      if (error.status === 401) {
        api.clearSession();
        window.location.replace('index.html');
        return;
      }
      message(error.message, 'error');
    }
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;
    clear();
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value]));
    const result = window.AssetValidation.validateAsset(data);
    if (!result.valid) {
      for (const [key, text] of Object.entries(result.errors)) {
        fields[key].classList.add('campo-invalido');
        fields[key].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + FIELDS[key]).textContent = text;
      }
      fields[Object.keys(result.errors)[0]].focus();
      message('Revise los campos senalados antes de continuar.', 'error');
      return;
    }

    submitButton.disabled = true;
    cancelButton.disabled = true; // No ofrecer cancelacion cuando el POST ya ha comenzado.
    message('Registrando activo...', 'informacion');
    try {
      const response = await api.request('/api/v1/assets', {
        method: 'POST', body: result.data, authenticated: true,
      });
      if (!response || !response.id || response.assetNumber !== result.data.assetNumber) {
        throw new Error('El servidor no confirmo correctamente el registro.');
      }
      form.reset();
      message('Activo ' + response.assetNumber + ' registrado correctamente con ID ' + response.id + '.', 'exito');
    } catch (error) {
      if (error.status === 401) {
        api.clearSession();
        window.location.replace('index.html');
        return;
      }
      message(error.message, 'error');
    } finally { submitButton.disabled = false; cancelButton.disabled = false; }
  });

  cancelButton.addEventListener('click', function () {
    if (cancelButton.disabled) return;
    // CA05: cancelar descarta los datos y jamas ejecuta POST.
    form.reset();
    clear();
    window.location.assign('panel.html');
  });

  loadCatalog();
})();
