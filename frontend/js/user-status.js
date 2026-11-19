/* HU-GU-05: consultar y modificar el estado de una cuenta con motivo y auditoria. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const session = api.session();
  if (!session) { window.location.replace('index.html'); return; }
  if (session.role !== 'SUPERUSER') { window.location.replace('dashboard.html'); return; }

  const id = document.getElementById('id-user');
  const lookupButton = document.getElementById('view-status');
  const form = document.getElementById('form-status');
  const profileCard = document.getElementById('card-user');
  const section = document.getElementById('section-change');
  const reason = document.getElementById('reason-status');
  const submitButton = document.getElementById('button-status');
  const cancelButton = document.getElementById('cancel-status');
  const notice = document.getElementById('message-status');
  const idError = document.getElementById('error-id');
  const reasonError = document.getElementById('error-reason');
  let currentUser = null;

  // La eliminación se gestiona desde esta misma pantalla, sin cambiar el backend.
  // La comprobación GET y el DELETE siguen teniendo todas las restricciones originales.
  const deletionUI = (function () {
    const openButton = document.getElementById('open-deletion');
    const deletionPanel = document.getElementById('dashboard-deletion');
    const deleteCard = document.getElementById('card-delete');
    const deleteSection = document.getElementById('section-delete');
    const deleteForm = document.getElementById('form-delete');
    const deleteButton = document.getElementById('button-delete');
    const cancelDeletionButton = document.getElementById('cancel-deletion');
    const deleteNotice = document.getElementById('message-deletion');
    if (!openButton || !deletionPanel || !deleteCard || !deleteSection || !deleteForm ||
        !deleteButton || !cancelDeletionButton || !deleteNotice) return null;

    let authorizedUser = null;
    let requestSequence = 0;
    let busy = false;
    function notify(text, cssClass) {
      deleteNotice.textContent = text || '';
      deleteNotice.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
    }
    function clear() {
      requestSequence++;
      authorizedUser = null;
      deletionPanel.hidden = true;
      deleteCard.hidden = true;
      deleteSection.hidden = true;
      notify('', '');
    }
    function setBusyState(blocked) {
      busy = blocked;
      openButton.disabled = blocked;
      deleteButton.disabled = blocked;
      cancelDeletionButton.disabled = blocked;
      lookupButton.disabled = blocked;
      id.disabled = blocked;
      submitButton.disabled = blocked;
      reason.disabled = blocked;
      cancelButton.disabled = blocked;
    }
    openButton.addEventListener('click', async function () {
      if (!currentUser || busy) return;
      clear();
      deletionPanel.hidden = false;
      if (currentUser.active) {
        notify('Primero debe inactivar la cuenta. Una cuenta activa no puede eliminarse.', 'error');
        return;
      }
      const userId = currentUser.id;
      const turno = ++requestSequence;
      openButton.disabled = true;
      notify('Comprobando si la cuenta puede eliminarse...', 'information');
      try {
        const preview = await api.request('/api/v1/users/' + userId + '/deletion', { authenticated: true });
        if (turno !== requestSequence || !currentUser || currentUser.id !== userId) return;
        if (!preview || preview.id !== userId || typeof preview.canDelete !== 'boolean' || typeof preview.active !== 'boolean') {
          throw new Error('El servidor no devolvió una evaluación válida de eliminación.');
        }
        document.getElementById('name-delete').textContent = preview.name;
        document.getElementById('email-delete').textContent = preview.email;
        document.getElementById('role-delete').textContent = preview.role;
        document.getElementById('status-delete').textContent = preview.active ? 'Activo' : 'Inactivo';
        deleteCard.hidden = false;
        if (preview.canDelete && !preview.active && preview.id !== session.id) {
          authorizedUser = preview;
          deleteSection.hidden = false;
          notify('La cuenta cumple las condiciones. Confirme únicamente si desea eliminarla.', 'information');
        } else {
          notify(preview.message || 'Esta cuenta no cumple las condiciones de eliminación.', 'error');
        }
      } catch (error) {
        if (turno === requestSequence) {
          if (error.status === 401 || error.status === 403) handleError(error);
          else notify(error.message || 'No se pudo comprobar la eliminación.', 'error');
        }
      } finally {
        if (turno === requestSequence) openButton.disabled = false;
      }
    });
    deleteForm.addEventListener('submit', async function (event) {
      event.preventDefault();
      if (!authorizedUser || busy) return;
      const user = authorizedUser;
      if (!window.confirm('¿Eliminar DEFINITIVAMENTE al usuario ' + user.email + ' (ID ' + user.id + ')? Esta acción NO se puede deshacer.')) {
        notify('Eliminación cancelada. No se modificó el registro.', 'information');
        return;
      }
      setBusyState(true);
      notify('Eliminando la cuenta...', 'information');
      try {
        const response = await api.request('/api/v1/users/' + user.id, { method: 'DELETE', authenticated: true });
        if (!response || response.id !== user.id) throw new Error('El servidor no confirmó la eliminación.');
        id.value = '';
        invalidateSelection();
        message('Usuario eliminado definitivamente. La cuenta ya no está registrada.', 'success');
      } catch (error) {
        if (error.status === 409) {
          authorizedUser = null;
          deleteSection.hidden = true;
        }
        if (error.status === 401 || error.status === 403) handleError(error);
        else notify(error.message || 'No se pudo completar la eliminación.', 'error');
      } finally {
        setBusyState(false);
      }
    });
    cancelDeletionButton.addEventListener('click', function () {
      if (!busy) clear();
    });
    return { clear };
  })();

  function message(text, cssClass) {
    notice.textContent = text || '';
    notice.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
  }
  function invalidateSelection() {
    currentUser = null;
    if (deletionUI) deletionUI.clear();
    profileCard.hidden = true;
    section.hidden = true;
    reason.value = '';
    reasonError.textContent = '';
  }
  function validateId() {
    const value = id.value.trim();
    if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value))) {
      idError.textContent = 'Ingrese un ID de usuario valido (entero positivo).';
      id.setAttribute('aria-invalid', 'true');
      id.focus();
      return null;
    }
    idError.textContent = '';
    id.removeAttribute('aria-invalid');
    return Number(value);
  }
  function displayUser(user) {
    if (deletionUI) deletionUI.clear();
    currentUser = user;
    document.getElementById('name-user').textContent = user.name;
    document.getElementById('email-user').textContent = user.email;
    document.getElementById('role-user').textContent = user.role;
    const current = document.getElementById('status-current');
    current.textContent = user.active ? 'Activo' : 'Inactivo';
    current.className = user.active ? 'asset-active-status' : 'asset-inactive-status';
    submitButton.textContent = user.active ? 'Inactivar usuario' : 'Activar usuario';
    reason.value = '';
    profileCard.hidden = false;
    section.hidden = false;
  }
  async function fetchDetails() {
    invalidateSelection();
    message('', '');
    const userId = validateId();
    if (userId === null) return;
    lookupButton.disabled = true;
    message('Consultando estado actual...', 'information');
    try {
      const user = await api.request('/api/v1/users/' + userId + '/status', { authenticated: true });
      if (!user || user.id !== userId || typeof user.active !== 'boolean') {
        throw new Error('El servidor no devolvio un estado valido para ese usuario.');
      }
      displayUser(user);
      message('Cuenta encontrada. Indique el motivo para continuar.', 'information');
    } catch (error) { handleError(error); }
    finally { lookupButton.disabled = false; }
  }
  function handleError(error) {
    if (error.status === 401) {
      api.clearSession();
      window.location.replace('index.html');
      return;
    }
    if (error.status === 403) {
      window.location.replace('dashboard.html');
      return;
    }
    message(error.message || 'No se pudo completar la operacion.', 'error');
  }
  id.addEventListener('input', function () {
    invalidateSelection();
    idError.textContent = '';
    id.removeAttribute('aria-invalid');
    message('', '');
  });
  reason.addEventListener('input', function () {
    reasonError.textContent = '';
    reason.removeAttribute('aria-invalid');
  });
  lookupButton.addEventListener('click', fetchDetails);
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (!currentUser || submitButton.disabled) return;
    const text = reason.value.trim();
    if (!text || text.length > 500) {
      reasonError.textContent = text ? 'El motivo no puede superar 500 caracteres.' : 'Es obligatorio indicar un motivo.';
      reason.setAttribute('aria-invalid', 'true');
      reason.focus();
      message('Revise el motivo del cambio.', 'error');
      return;
    }
    const switchTo = !currentUser.active;
    const verbo = switchTo ? 'activar' : 'inactivar';
    if (!window.confirm('¿Confirma que desea ' + verbo + ' al usuario ' + currentUser.email + '?')) return;

    submitButton.disabled = true;
    cancelButton.disabled = true;
    lookupButton.disabled = true;
    id.disabled = true;
    reason.disabled = true;
    const openDeletion = document.getElementById('open-deletion');
    if (openDeletion) openDeletion.disabled = true;
    message('Guardando cambio...', 'information');
    try {
      const response = await api.request('/api/v1/users/' + currentUser.id + '/status', {
        method: 'PATCH', authenticated: true, body: { active: switchTo, reason: text },
      });
      if (!response || response.id !== currentUser.id || response.active !== switchTo) {
        throw new Error('El servidor no confirmo correctamente el cambio de estado.');
      }
      displayUser(response);
      message('El usuario ' + response.email + ' fue ' + (switchTo ? 'activado' : 'inactivado') + ' correctamente.', 'success');
      if (response.id === session.id && !switchTo) {
        api.clearSession();
        profileCard.hidden = true;
        section.hidden = true;
        message('Su propia cuenta fue inactivada. Debe iniciar sesion con una cuenta activa.', 'success');
      }
    } catch (error) { handleError(error); }
    finally {
      submitButton.disabled = false; cancelButton.disabled = false; lookupButton.disabled = false;
      id.disabled = false; reason.disabled = false;
      if (openDeletion) openDeletion.disabled = false;
    }
  });
  cancelButton.addEventListener('click', function () {
    if (cancelButton.disabled) return;
    // CA03: salir sin emitir ninguna solicitud PATCH.
    form.reset();
    invalidateSelection();
    message('', '');
    window.location.assign('dashboard.html');
  });
})();
