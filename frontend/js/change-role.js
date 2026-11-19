/* HU-GU-04: PATCH autenticado del rol, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('form-role');
  const notice = document.getElementById('message-role');
  const submitButton = document.getElementById('button-change-role');
  const cancelButton = document.getElementById('cancel-role');
  const fields = {
    id: document.getElementById('id-user'),
    role: document.getElementById('role'),
  };

  // Sin sesion va al login; con sesion pero sin rol SUPERUSER vuelve a la pantalla principal.
  const session = api.session();
  if (!session) {
    window.location.replace('index.html');
    return;
  }
  if (session.role !== 'SUPERUSER') {
    window.location.replace('dashboard.html');
    return;
  }

  function message(text = '', cssClass = '') {
    notice.textContent = text;
    notice.className = 'form-message' + (cssClass ? ' ' + cssClass : '');
  }
  function clear() {
    message();
    for (const [key, field] of Object.entries(fields)) {
      field.classList.remove('invalid-field');
      field.removeAttribute('aria-invalid');
      document.getElementById('error-' + key).textContent = '';
    }
  }
  for (const field of Object.values(fields)) {
    field.addEventListener('input', clear);
    field.addEventListener('change', clear);
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;
    clear();
    const result = window.RoleChangeValidation.validateRoleChange({
      id: fields.id.value,
      role: fields.role.value,
    });
    if (!result.valid) {
      for (const [key, text] of Object.entries(result.errors)) {
        fields[key].classList.add('invalid-field');
        fields[key].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + key).textContent = text;
      }
      fields[Object.keys(result.errors)[0]].focus();
      message('Revise los campos indicados antes de continuar.', 'error');
      return;
    }

    submitButton.disabled = true;
    cancelButton.disabled = true; // No ofrecer cancelacion cuando el PATCH ya ha comenzado.
    message('Modificando rol...', 'information');
    try {
      const response = await api.request('/api/v1/users/' + result.data.id + '/role', {
        method: 'PATCH', body: { role: result.data.role }, authenticated: true,
      });
      if (!response || response.id !== result.data.id || response.role !== result.data.role) {
        throw new Error('El servidor no confirmo correctamente el cambio de rol.');
      }
      form.reset();
      if (response.id === session.id) {
        // El rol de la cuenta en uso cambio: la sesion actual ya no es valida.
        api.clearSession();
        message('Rol de su propia cuenta modificado. Inicie sesion nuevamente para aplicar los cambios.', 'success');
      } else {
        message('Rol del usuario ' + response.email + ' modificado correctamente a ' + response.role + '.', 'success');
      }
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
    // CA02: cancelar descarta los datos y jamas ejecuta PATCH.
    form.reset();
    clear();
    window.location.assign('dashboard.html');
  });
})();
