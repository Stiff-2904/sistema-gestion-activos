/* HU-GA-02: CA01 consulta correcta, CA02 no existe, CA03 cancelar sin modificaciones. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const session = api.session();
  if (!session) { window.location.replace('index.html'); return; }
  const form = document.getElementById('form-view');
  const field = document.getElementById('id-view');
  const idError = document.getElementById('error-id-view');
  const notice = document.getElementById('message-view');
  const submitButton = document.getElementById('button-view');
  const cancelButton = document.getElementById('cancel-view');
  const section = document.getElementById('section-detail');
  const summary = document.getElementById('summary-asset');
  const detail = document.getElementById('data-detail');
  let version = 0; // invalida el resultado tardio de una consulta cancelada

  const fields = [
    ['id', 'ID del activo'], ['assetNumber', 'Número de identificación'],
    ['description', 'Descripción'], ['brand', 'Marca'], ['model', 'Modelo'],
    ['serial', 'Serie'], ['price', 'Precio'], ['status', 'Estado'],
    ['location', 'Ubicación'], ['category', 'Categoría'],
    ['acquisitionMode', 'Modo de adquisición'],
    ['currentResponsible', 'Responsable actual'], ['decommissioned', 'Dado de baja'],
    ['notes', 'Observaciones'],
  ];
  const text = (key, value) => {
    if (key === 'decommissioned') return value === true ? 'Sí' : 'No';
    return value === null || value === undefined || value === '' ? 'No registrado' : String(value);
  };
  function message(value = '', cssClass = '') {
    notice.textContent = value;
    notice.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
  }
  function clearView() {
    section.hidden = true;
    summary.textContent = '';
    detail.textContent = '';
  }
  function displayAsset(asset) {
    clearView();
    summary.textContent = asset.assetNumber + ' · ' + asset.description;
    fields.forEach(([key, title]) => {
      const container = document.createElement('div');
      container.className = 'detail-item' + (['description','notes'].includes(key) ? 'detail-wide' : '');
      const dt = document.createElement('dt');
      dt.textContent = title;
      const dd = document.createElement('dd');
      dd.textContent = text(key, asset[key]);
      container.appendChild(dt);
      container.appendChild(dd);
      detail.appendChild(container);
    });
    section.hidden = false;
  }
  const validateId = value => /^[1-9]\d*$/.test(String(value).trim()) && Number.isSafeInteger(Number(value));
  async function fetchDetails(id) {
    const current = ++version;
    clearView();
    idError.textContent = '';
    field.removeAttribute('aria-invalid');
    if (!validateId(id)) {
      idError.textContent = 'Ingrese un ID numérico entero y positivo.';
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      message('Revise el ID antes de consultar.', 'error');
      return;
    }
    submitButton.disabled = true;
    message('Consultando activo...', 'information');
    try {
      const response = await api.request('/api/v1/assets/' + Number(id), { authenticated: true });
      if (current !== version) return;
      if (!response || response.id !== Number(id)) throw new Error('El servidor devolvió un activo diferente al solicitado.');
      displayAsset(response);
      message('Información del activo consultada correctamente.', 'success');
    } catch (error) {
      if (current !== version) return;
      if (error.status === 401) {
        api.clearSession(); window.location.replace('index.html'); return;
      }
      message(error.status === 404 ? 'El activo con ID ' + Number(id) + ' no existe.' : error.message, 'error');
    } finally {
      if (current === version) submitButton.disabled = false;
    }
  }
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    fetchDetails(field.value);
  });
  cancelButton.addEventListener('click', function () {
    ++version;
    submitButton.disabled = false;
    form.reset();
    clearView();
    idError.textContent = '';
    field.removeAttribute('aria-invalid');
    message('Consulta cancelada. No se realizó ningún cambio.', 'information');
  });
  field.addEventListener('input', function () {
    idError.textContent = '';
    field.removeAttribute('aria-invalid');
  });
  if (session.role === 'SUPERUSER') {
    const register = document.getElementById('link-register-asset');
    if (register) register.hidden = false;
    const update = document.getElementById('link-update-asset');
    if (update) update.hidden = false;
  }

  async function loadAssetList() {
    const listNotice = document.getElementById('message-listing');
    const tableBody = document.getElementById('body-assets');
    const table = document.getElementById('table-assets');
    try {
      const assets = await api.request('/api/v1/assets', { authenticated: true });
      if (!Array.isArray(assets)) throw new Error('El listado de activos tiene un formato inválido.');
      tableBody.textContent = '';
      for (const asset of assets) {
        const row = document.createElement('tr');
        for (const key of ['id','assetNumber','description','status']) {
          const createCell = document.createElement('td');
          createCell.textContent = text(key, asset[key]);
          row.appendChild(createCell);
        }
        const createCell = document.createElement('td');
        const ver = document.createElement('button');
        ver.type = 'button';
        ver.className = 'asset-view-button';
        ver.textContent = 'Ver detalle';
        ver.addEventListener('click', () => {
          field.value = String(asset.id);
          fetchDetails(asset.id);
        });
        createCell.appendChild(ver);
        if (session.role === 'SUPERUSER') {
          const editButton = document.createElement('a');
          editButton.href = 'update-asset.html?id=' + encodeURIComponent(String(asset.id));
          editButton.className = 'asset-view-button asset-edit-button';
          editButton.textContent = 'Actualizar';
          createCell.appendChild(editButton);
        }
        row.appendChild(createCell);
        tableBody.appendChild(row);
      }
      table.hidden = assets.length === 0;
      listNotice.textContent = assets.length === 0 ? 'No hay activos registrados.' : 'Activos disponibles: ' + assets.length + '.';
    } catch (error) {
      if (error.status === 401) {
        api.clearSession(); window.location.replace('index.html'); return;
      }
      listNotice.textContent = 'No se pudo cargar el listado: ' + error.message;
    }
  }
  loadAssetList();
})();
