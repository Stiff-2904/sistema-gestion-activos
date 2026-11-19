/* Administracion de catalogos: listar, crear, editar y eliminar (solo sin registros asociados). */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const validation = window.CatalogValidation;
  const CATALOG_TYPES = validation.CATALOG_TYPES;

  // Sin sesion va al login; el usuario basico vuelve al panel porque no tiene permiso.
  const session = api.session();
  if (!session) { window.location.replace('index.html'); return; }
  if (session.role === 'BASIC_USER') { window.location.replace('panel.html'); return; }

  const form = document.getElementById('formulario-catalogo');
  const nameField = document.getElementById('nombre-catalogo');
  const detailField = document.getElementById('detalle-catalogo');
  const detailLabel = document.getElementById('etiqueta-detalle');
  const nameError = document.getElementById('error-nombre-catalogo');
  const detailError = document.getElementById('error-detalle-catalogo');
  const saveButton = document.getElementById('boton-guardar-catalogo');
  const cancelButton = document.getElementById('cancelar-catalogo');
  const notice = document.getElementById('mensaje-catalogo');
  const title = document.getElementById('titulo-catalogo');
  const tableBody = document.getElementById('cuerpo-tabla');
  const listStatus = document.getElementById('estado-lista');

  // Ejemplos que se muestran dentro de los campos segun el catalogo activo
  const EXAMPLES = {
    ubicaciones: { name: 'Ejemplo: Aula 12', detail: 'Ejemplo: Edificio B' },
    estados: { name: 'Ejemplo: Reparacion', detail: 'Ejemplo: Requiere mantenimiento antes de usarse' },
    categorias: { name: 'Ejemplo: Material deportivo', detail: 'Ejemplo: Balones, redes y conos' },
    'modos-adquisicion': { name: 'Ejemplo: Convenio', detail: 'Ejemplo: Recibido mediante convenio institucional' },
  };

  let tipoActual = 'ubicaciones';
  let editingId = null;

  function message(text, cssClass) {
    notice.textContent = text || '';
    notice.className = 'mensaje-formulario' + (cssClass ? ' ' + cssClass : '');
  }
  function clearErrors() {
    for (const [field, error] of [[nameField, nameError], [detailField, detailError]]) {
      field.classList.remove('campo-invalido');
      field.removeAttribute('aria-invalid');
      error.textContent = '';
    }
  }
  function markField(field, error, text) {
    error.textContent = text;
    field.classList.add('campo-invalido');
    field.setAttribute('aria-invalid', 'true');
  }

  // Deja el formulario en modo crear, con las etiquetas del catalogo activo.
  function prepareForm() {
    const config = CATALOG_TYPES[tipoActual];
    editingId = null;
    form.reset();
    clearErrors();
    title.textContent = config.title;
    detailLabel.textContent = config.detailLabel + (config.detailRequired ? ' *' : '');
    nameField.setAttribute('placeholder', EXAMPLES[tipoActual].name);
    detailField.setAttribute('placeholder', EXAMPLES[tipoActual].detail);
    saveButton.textContent = 'Agregar ' + config.singular;
    cancelButton.hidden = true;
  }

  function createCell(text) {
    const td = document.createElement('td');
    td.textContent = text;
    return td;
  }

  function createRow(item) {
    const row = document.createElement('tr');
    row.appendChild(createCell(item.name));
    row.appendChild(createCell(item.detail || '-'));
    row.appendChild(createCell(String(item.usageCount)));

    const actions = document.createElement('td');
    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'boton-consultar boton-tabla';
    editButton.textContent = 'Editar';
    editButton.addEventListener('click', () => startEditing(item));

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'boton-eliminar boton-tabla';
    remove.textContent = 'Eliminar';
    if (!item.deletable) {
      remove.disabled = true;
      remove.setAttribute('title', 'En uso por ' + item.usageCount + ' registro(s)');
    }
    remove.addEventListener('click', () => deleteItem(item));

    actions.appendChild(editButton);
    actions.appendChild(remove);
    row.appendChild(actions);
    return row;
  }

  async function loadList() {
    listStatus.textContent = 'Cargando...';
    listStatus.hidden = false;
    tableBody.textContent = '';
    try {
      const items = await api.request('/api/v1/catalogs/' + tipoActual, { authenticated: true });
      tableBody.textContent = '';
      if (!Array.isArray(items) || items.length === 0) {
        listStatus.textContent = 'No hay elementos registrados en este catalogo.';
        return;
      }
      for (const item of items) tableBody.appendChild(createRow(item));
      listStatus.hidden = true;
    } catch (error) {
      if (handleSessionError(error)) return;
      listStatus.textContent = error.message;
    }
  }

  // Sesion vencida o sin permiso: se vuelve al inicio.
  function handleSessionError(error) {
    if (error.status === 401) {
      api.clearSession();
      window.location.replace('index.html');
      return true;
    }
    if (error.status === 403) {
      window.location.replace('panel.html');
      return true;
    }
    return false;
  }

  function startEditing(item) {
    clearErrors();
    message('');
    editingId = item.id;
    nameField.value = item.name;
    detailField.value = item.detail || '';
    saveButton.textContent = 'Guardar cambios';
    cancelButton.hidden = false;
    nameField.focus();
  }

  async function deleteItem(item) {
    if (!window.confirm('Se eliminara "' + item.name + '". Esta accion no se puede deshacer. Desea continuar?')) return;
    message('');
    try {
      const response = await api.request('/api/v1/catalogs/' + tipoActual + '/' + item.id,
        { method: 'DELETE', authenticated: true });
      if (editingId === item.id) prepareForm();
      message(response.message || 'Elemento eliminado correctamente.', 'exito');
      await loadList();
    } catch (error) {
      if (handleSessionError(error)) return;
      message(error.message, 'error');
      await loadList();
    }
  }

  async function save(event) {
    event.preventDefault();
    clearErrors();
    message('');
    const result = validation.validateItem(tipoActual, { name: nameField.value, detail: detailField.value });
    if (!result.valid) {
      if (result.errors.name) markField(nameField, nameError, result.errors.name);
      if (result.errors.detail) markField(detailField, detailError, result.errors.detail);
      return;
    }
    const edicion = editingId !== null;
    saveButton.disabled = true;
    try {
      await api.request('/api/v1/catalogs/' + tipoActual + (edicion ? '/' + editingId : ''),
        { method: edicion ? 'PUT' : 'POST', body: result.data, authenticated: true });
      prepareForm();
      message(edicion ? 'Elemento actualizado correctamente.' : 'Elemento creado correctamente.', 'exito');
      await loadList();
    } catch (error) {
      if (handleSessionError(error)) return;
      message(error.message, 'error');
    } finally {
      saveButton.disabled = false;
    }
  }

  function selectItem(type) {
    tipoActual = type;
    for (const key of Object.keys(CATALOG_TYPES)) {
      const tab = document.getElementById('pestana-' + key);
      tab.classList.remove('activa');
      tab.setAttribute('aria-selected', 'false');
    }
    const active = document.getElementById('pestana-' + type);
    active.classList.add('activa');
    active.setAttribute('aria-selected', 'true');
    message('');
    prepareForm();
    return loadList();
  }

  for (const key of Object.keys(CATALOG_TYPES)) {
    document.getElementById('pestana-' + key).addEventListener('click', () => selectItem(key));
  }
  form.addEventListener('submit', save);
  cancelButton.addEventListener('click', () => { prepareForm(); message(''); });
  selectItem('ubicaciones');
})();