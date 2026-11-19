/* HU-GU-02: POST autenticado, validaciones, permisos y cancelación sin cambios. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('form-registration');
  const notice = document.getElementById('message-registration');
  const submitButton = document.getElementById('button-register');
  const cancelButton = document.getElementById('cancel-registration');
  const fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    password: document.getElementById('access-key'),
    role: document.getElementById('role'),
  };
  const session = api.session();
  if (!session || session.role !== 'SUPERUSER') {
    window.location.replace('index.html');
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
    const data = Object.fromEntries(
      Object.entries(fields).map(([key, field]) => [key, field.value]));
    const result = window.UserRegistrationValidation.validateUser(data);
    if (!result.valid) {
      for (const [key, text] of Object.entries(result.errors)) {
        fields[key].classList.add('invalid-field');
        fields[key].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + key).textContent = text;
      }
      fields[Object.keys(result.errors)[0]].focus();
      message('Revise los campos señalados antes de continuar.', 'error');
      return;
    }

    submitButton.disabled = true;
    cancelButton.disabled = true; // No ofrecer cancelación cuando el POST ya ha comenzado.
    message('Registrando usuario...', 'information');
    try {
      const response = await api.request('/api/v1/users', {
        method: 'POST', body: result.data, authenticated: true,
      });
      if (!response || !response.id || response.email !== result.data.email) {
        throw new Error('El servidor no confirmó correctamente el registro.');
      }
      form.reset();
      message('Usuario ' + response.email + ' registrado correctamente con rol ' + response.role + '.', 'success');
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
    window.location.assign('dashboard.html');
  });
})();
