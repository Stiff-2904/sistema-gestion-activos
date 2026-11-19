/* HU-GA-03: CA01 actualizacion PUT, CA02 obligatorios, CA03 formato, CA04 cancelar. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const session = api.session();
  if (!session) { window.location.replace('index.html'); return; }
  if (session.role !== 'SUPERUSER') { window.location.replace('dashboard.html'); return; }

  const searchForm = document.getElementById('form-search-editing');
  const idField = document.getElementById('id-editing');
  const idError = document.getElementById('error-id-editing');
  const loadingNotice = document.getElementById('message-load-editing');
  const loadButton = document.getElementById('button-load-editing');
  const section = document.getElementById('section-editing');
  const assetIdTitle = document.getElementById('id-asset-loaded');
  const form = document.getElementById('form-editing');
  const notice = document.getElementById('message-editing');
  const save = document.getElementById('button-save-editing');
  const cancelButton = document.getElementById('cancel-editing');
  const listNotice = document.getElementById('message-listing-editing');
  const listBody = document.getElementById('body-editing-assets');
  const listTable = document.getElementById('table-editing-assets');
  const FIELDS = {
    assetNumber: 'number-asset', description: 'description-asset', brand: 'brand-asset',
    model: 'model-asset', serial: 'serial-asset', price: 'price-asset',
    statusId: 'status-asset', locationId: 'location-asset', categoryId: 'category-asset',
    acquisitionModeId: 'mode-asset', currentResponsibleId: 'responsible-asset', notes: 'notes-asset',
  };
  const LISTS = {
    statuses: 'statusId', locations: 'locationId', categories: 'categoryId',
    acquisitionModes: 'acquisitionModeId', responsibles: 'currentResponsibleId',
  };
  const fields = Object.fromEntries(Object.entries(FIELDS).map(([k, id]) => [k, document.getElementById(id)]));
  let currentId = null;
  let version = 0;
  let submitting = false;
  let catalogReady = false;
  let catalogPromise = null;
  let versionListado = 0;

  function message(item, text = '', cssClass = '') {
    item.textContent = text;
    item.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
  }
  function clearErrors() {
    for (const [key, field] of Object.entries(fields)) {
      field.classList.remove('invalid-field');
      field.removeAttribute('aria-invalid');
      document.getElementById('error-' + FIELDS[key]).textContent = '';
    }
  }
  Object.values(fields).forEach(field => {
    field.addEventListener('input', clearErrors);
    field.addEventListener('change', clearErrors);
  });
  function hasFormData(asset) {
    for (const [key, field] of Object.entries(fields)) {
      field.value = asset[key] === null || asset[key] === undefined ? '' : String(asset[key]);
    }
  }
  function isValidId(value) {
    return /^[1-9]\d*$/.test(String(value).trim()) && Number.isSafeInteger(Number(value));
  }

  function loadCatalog() {
    // Compartir la misma solicitud si se seleccionan varios activos con rapidez.
    if (!catalogPromise) {
      catalogPromise = api.request('/api/v1/assets/catalog', { authenticated: true })
        .then(catalog => {
          for (const list of Object.keys(LISTS)) {
            if (!Array.isArray(catalog[list])) throw new Error('No fue posible obtener el catálogo de ' + list + '.');
          }
          for (const [list, key] of Object.entries(LISTS)) {
            for (const entry of catalog[list]) {
              const option = document.createElement('option');
              option.value = String(entry.id);
              option.textContent = entry.name;
              fields[key].appendChild(option);
            }
          }
          catalogReady = true;
        })
        .catch(error => { catalogPromise = null; throw error; });
    }
    return catalogPromise;
  }

  function highlightSelection() {
    for (const row of listBody.children) {
      const selected = currentId !== null && Number(row.dataset.assetId) === currentId;
      row.classList.toggle('view-row-selected', selected);
      const action = row.children[4] && row.children[4].children[0];
      if (action) action.setAttribute('aria-pressed', String(selected));
    }
  }

  async function loadAssetList() {
    const current = ++versionListado;
    listNotice.textContent = 'Actualizando listado de activos...';
    try {
      const assets = await api.request('/api/v1/assets', { authenticated: true });
      if (current !== versionListado) return;
      if (!Array.isArray(assets)) throw new Error('El listado de activos tiene un formato inválido.');
      listBody.textContent = '';
      for (const asset of assets) {
        const row = document.createElement('tr');
        row.dataset.assetId = String(asset.id);
        for (const key of ['id', 'assetNumber', 'description', 'status']) {
          const createCell = document.createElement('td');
          const value = asset[key];
          createCell.textContent = value === null || value === undefined || value === '' ? 'No registrado' : String(value);
          row.appendChild(createCell);
        }
        const actions = document.createElement('td');
        const submitButton = document.createElement('button');
        submitButton.type = 'button';
        submitButton.className = 'asset-view-button asset-edit-button';
        submitButton.textContent = 'Actualizar';
        submitButton.setAttribute('aria-label', 'Actualizar activo ' + String(asset.assetNumber));
        submitButton.addEventListener('click', () => {
          if (submitting) return;
          idField.value = String(asset.id);
          loadAsset(asset.id, true);
        });
        actions.appendChild(submitButton);
        row.appendChild(actions);
        listBody.appendChild(row);
      }
      listTable.hidden = assets.length === 0;
      listNotice.textContent = assets.length ? 'Activos disponibles: ' + assets.length + '.' : 'No hay activos registrados.';
      highlightSelection();
    } catch (error) {
      if (current !== versionListado) return;
      if (error.status === 401) { api.clearSession(); window.location.replace('index.html'); return; }
      listNotice.textContent = 'No se pudo cargar el listado: ' + error.message;
    }
  }

  async function loadAsset(value, fromList = false) {
    if (submitting) return;
    const current = ++version;
    currentId = null;
    highlightSelection();
    section.hidden = true;
    message(notice);
    clearErrors();
    idError.textContent = '';
    if (!isValidId(value)) {
      idError.textContent = 'Ingrese un ID entero y positivo.';
      idField.focus();
      message(loadingNotice, 'Revise el ID del activo.', 'error');
      return;
    }
    loadButton.disabled = true;
    message(loadingNotice, 'Cargando datos del activo...', 'information');
    try {
      if (!catalogReady) await loadCatalog();
      const response = await api.request('/api/v1/assets/' + Number(value), { authenticated: true });
      if (current !== version) return;
      if (!response || response.id !== Number(value)) throw new Error('El servidor devolvió un activo inesperado.');
      currentId = response.id;
      hasFormData(response);
      highlightSelection();
      assetIdTitle.textContent = '· ID ' + response.id;
      section.hidden = false;
      message(loadingNotice, 'Activo cargado. Puede editar los campos y guardar.', 'success');
      if (fromList && typeof section.scrollIntoView === 'function') {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      if (current !== version) return;
      if (error.status === 401) { api.clearSession(); window.location.replace('index.html'); return; }
      message(loadingNotice, error.status === 404 ? 'El activo con ID ' + Number(value) + ' no existe.' : error.message, 'error');
    } finally {
      if (current === version) loadButton.disabled = false;
    }
  }

  searchForm.addEventListener('submit', event => {
    event.preventDefault();
    loadAsset(idField.value);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (submitting || currentId === null) return;
    clearErrors();
    const data = Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.value]));
    const result = window.AssetValidation.validateAsset(data);
    if (!result.valid) {
      for (const [key, text] of Object.entries(result.errors)) {
        fields[key].classList.add('invalid-field');
        fields[key].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + FIELDS[key]).textContent = text;
      }
      fields[Object.keys(result.errors)[0]].focus();
      message(notice, 'Revise los campos señalados. No se enviaron cambios.', 'error');
      return;
    }
    submitting = true;
    save.disabled = true;
    cancelButton.disabled = true; // Evita cancelar despues de iniciado el PUT.
    loadButton.disabled = true;
    message(notice, 'Guardando actualización...', 'information');
    try {
      const response = await api.request('/api/v1/assets/' + currentId, {
        method: 'PUT', body: result.data, authenticated: true,
      });
      if (!response || response.id !== currentId || response.assetNumber !== result.data.assetNumber) {
        throw new Error('El servidor no confirmó la actualización correctamente.');
      }
      hasFormData(response);
      await loadAssetList();
      message(notice, 'Activo ' + response.assetNumber + ' actualizado correctamente. Cambio registrado en auditoría.', 'success');
    } catch (error) {
      if (error.status === 401) { api.clearSession(); window.location.replace('index.html'); return; }
      message(notice, error.message, 'error');
    } finally {
      submitting = false;
      save.disabled = false;
      cancelButton.disabled = false;
      loadButton.disabled = false;
    }
  });

  cancelButton.addEventListener('click', () => {
    if (submitting) return;
    ++version;
    currentId = null;
    form.reset();
    idField.value = '';
    idError.textContent = '';
    clearErrors();
    highlightSelection();
    section.hidden = true;
    message(notice);
    message(loadingNotice, 'Actualización cancelada. No se guardaron cambios.', 'information');
    // Se mantiene el listado visible para seleccionar otro activo sin salir.
  });

  // Cuando se seleccionó «Actualizar» desde el listado, precargar el ID.
  const query = window.location && typeof window.location.search === 'string'
    ? new URLSearchParams(window.location.search).get('id') : null;
  loadAssetList();
  if (query) { idField.value = query; loadAsset(query); }
})();
