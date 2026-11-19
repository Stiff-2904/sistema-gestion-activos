/* HU-GU-06: comprobación previa, confirmación y eliminación definitiva. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const session = api.session();
  if (!session) { window.location.replace('index.html'); return; }
  if (session.role !== 'SUPERUSER') { window.location.replace('dashboard.html'); return; }

  const id = document.getElementById('id-user');
  const lookupButton = document.getElementById('view-deletion');
  const form = document.getElementById('form-delete');
  const profileCard = document.getElementById('card-delete');
  const section = document.getElementById('section-delete');
  const deleteButton = document.getElementById('button-delete');
  const cancelButton = document.getElementById('cancel-deletion');
  const message = document.getElementById('message-deletion');
  const idError = document.getElementById('error-id');
  let selected = null;
  let requestSequence = 0;

  function notify(text, cssClass) {
    message.textContent = text || '';
    message.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
  }
  function clear() {
    selected = null;
    profileCard.hidden = true;
    section.hidden = true;
  }
  function handleRequestError(error) {
    if (error.status === 401) {
      api.clearSession();
      window.location.replace('index.html');
    } else if (error.status === 403) {
      window.location.replace('dashboard.html');
    } else {
      notify(error.message || 'No se pudo completar la operación.', 'error');
    }
  }
  function getValidId() {
    const value = id.value.trim();
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      idError.textContent = 'Ingrese un ID de usuario válido (entero positivo).';
      id.setAttribute('aria-invalid', 'true');
      id.focus();
      return null;
    }
    idError.textContent = '';
    id.removeAttribute('aria-invalid');
    return Number(value);
  }
  async function fetchDetails() {
    clear();
    notify('', '');
    const userId = getValidId();
    if (userId === null) return;
    const turno = ++requestSequence;
    lookupButton.disabled = true;
    notify('Comprobando condiciones de eliminación...', 'information');
    try {
      const user = await api.request('/api/v1/users/' + userId + '/deletion', { authenticated: true });
      if (turno !== requestSequence) return;
      if (!user || user.id !== userId || typeof user.canDelete !== 'boolean' || typeof user.active !== 'boolean') {
        throw new Error('El servidor no devolvió una evaluación válida.');
      }
      document.getElementById('name-delete').textContent = user.name;
      document.getElementById('email-delete').textContent = user.email;
      document.getElementById('role-delete').textContent = user.role;
      document.getElementById('status-delete').textContent = user.active ? 'Activo' : 'Inactivo';
      profileCard.hidden = false;
      // No basta confiar en la pantalla: DELETE vuelve a validar todo en el servidor.
      if (user.canDelete && !user.active && user.id !== session.id) {
        selected = user;
        section.hidden = false;
        notify('Cuenta habilitada para eliminación definitiva.', 'information');
      } else {
        notify(user.message || 'Esta cuenta no puede eliminarse.', 'error');
      }
    } catch (error) {
      if (turno === requestSequence) handleRequestError(error);
    } finally {
      if (turno === requestSequence) lookupButton.disabled = false;
    }
  }
  id.addEventListener('input', function () {
    requestSequence++;
    clear();
    idError.textContent = '';
    id.removeAttribute('aria-invalid');
    lookupButton.disabled = false;
    notify('', '');
  });
  lookupButton.addEventListener('click', fetchDetails);
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!selected || deleteButton.disabled) return;
    const user = selected;
    if (!window.confirm('¿Eliminar DEFINITIVAMENTE al usuario ' + user.email + ' (ID ' + user.id + ')? Esta acción NO se puede deshacer.')) {
      notify('Eliminación cancelada. No se modificó el registro.', 'information');
      return;
    }
    deleteButton.disabled = true;
    lookupButton.disabled = true;
    cancelButton.disabled = true;
    id.disabled = true;
    notify('Eliminando usuario...', 'information');
    try {
      const result = await api.request('/api/v1/users/' + user.id, {
        method: 'DELETE', authenticated: true,
      });
      if (!result || result.id !== user.id) throw new Error('El servidor no confirmó la eliminación.');
      clear();
      id.value = '';
      notify('Usuario eliminado definitivamente de forma exitosa.', 'success');
    } catch (error) {
      // Un 409 puede deberse a un cambio de estado o historial desde la consulta.
      if (error.status === 409) clear();
      handleRequestError(error);
    } finally {
      deleteButton.disabled = false;
      lookupButton.disabled = false;
      cancelButton.disabled = false;
      id.disabled = false;
    }
  });
  cancelButton.addEventListener('click', function () {
    if (cancelButton.disabled) return;
    requestSequence++;
    clear();
    form.reset();
    window.location.assign('dashboard.html');
  });
})();
