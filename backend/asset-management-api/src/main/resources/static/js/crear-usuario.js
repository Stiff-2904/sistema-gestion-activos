/* HU-GU-02: POST autenticado, validaciones, permisos y cancelación sin cambios. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('formulario-registro');
  const notice = document.getElementById('mensaje-registro');
  const submitButton = document.getElementById('boton-registrar');
  const cancelButton = document.getElementById('cancelar-registro');
  const fields = {
    name: document.getElementById('nombre'),
    email: document.getElementById('correo'),
    password: document.getElementById('clave'),
    role: document.getElementById('rol'),
  };
  const session = api.session();
  if (!session || session.role !== 'SUPERUSER') {
    window.location.replace('index.html');
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
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value]));
    const result = window.UserRegistrationValidation.validateUser(data);
    if (!result.valid) {
      for (const [key, text] of Object.entries(result.errors)) {
        fields[key].classList.add('campo-invalido');
        fields[key].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + key).textContent = text;
      }
      fields[Object.keys(result.errors)[0]].focus();
      message('Revise los campos señalados antes de continuar.', 'error');
      return;
    }

    submitButton.disabled = true;
    cancelButton.disabled = true; // No ofrecer cancelación cuando el POST ya ha comenzado.
    message('Registrando usuario...', 'informacion');
    try {
      const response = await api.request('/api/v1/users', {
        method: 'POST', body: result.data, authenticated: true,
      });
      if (!response || !response.id || response.email !== result.data.email) {
        throw new Error('El servidor no confirmó correctamente el registro.');
      }
      form.reset();
      message('Usuario ' + response.email + ' registrado correctamente con rol ' + response.role + '.', 'exito');
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
    // CA04: cancelar descarta los datos y jamás ejecuta POST.
    form.reset();
    clear();
    window.location.assign('panel.html');
  });
})();
