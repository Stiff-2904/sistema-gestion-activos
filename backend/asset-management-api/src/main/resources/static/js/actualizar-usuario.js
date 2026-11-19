/* HU-GU-03: PUT autenticado, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('formulario-actualizacion');
  const message = document.getElementById('mensaje-actualizacion');
  const save = document.getElementById('boton-actualizar');
  const cancelButton = document.getElementById('cancelar-actualizacion');
  const idField = document.getElementById('id-usuario');
  const name = document.getElementById('nombre');
  const emailInput = document.getElementById('correo');
  const key = document.getElementById('clave');
  const roleInput = document.getElementById('rol');

  const session = api.session();
  if (!session) {
    window.location.replace('index.html');
    return;
  }
  if (session.role !== 'SUPERUSER') {
    window.location.replace('panel.html');
    return;
  }

  function notify(text, cssClass = '') {
    message.textContent = text;
    message.className = 'mensaje-formulario' + (cssClass ? ' ' + cssClass : '');
  }

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (save.disabled) return;
    const id = Number(idField.value);
    const password = key.value;

    if (!Number.isSafeInteger(id) || id < 1) {
      notify('Debe indicar un ID de usuario válido.', 'error');
      idField.focus();
      return;
    }
    if (password && (password.length < 6 || password.length > 100)) {
      notify('La contraseña debe tener entre 6 y 100 caracteres.', 'error');
      key.focus();
      return;
    }

    save.disabled = true;
    cancelButton.disabled = true;
    notify('Guardando cambios...', 'informacion');
    try {
      const response = await api.request('/api/v1/users/' + id, {
        method: 'PUT',
        authenticated: true,
        body: {
          name: name.value.trim(),
          email: emailInput.value.trim().toLowerCase(),
          password: password ? password : null,
          role: roleInput.value,
        },
      });
      form.reset();
      if (response.id === session.id) {
        api.clearSession();
        notify('Usuario actualizado correctamente. Inicie sesión nuevamente para aplicar los cambios.', 'exito');
      } else {
        notify('Usuario actualizado correctamente.', 'exito');
      }
    } catch (error) {
      if (error.status === 401) {
        api.clearSession();
        window.location.replace('index.html');
        return;
      }
      notify(error.message, 'error');
    } finally {
      save.disabled = false;
      cancelButton.disabled = false;
    }
  });

  cancelButton.addEventListener('click', function () {
    if (cancelButton.disabled) return;
    form.reset();
    window.location.assign('panel.html');
  });
})();
