/* HU-GU-01: inicio de sesion contra el backend y creacion de la sesion con SGAAPI. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const form = document.getElementById('formulario-login');
  const user = document.getElementById('usuario');
  const passwordInput = document.getElementById('contrasena');
  const submitButton = document.getElementById('boton-login');
  const notice = document.getElementById('mensaje-formulario');
  const show = document.getElementById('mostrar-contrasena');
  const usernameError = document.getElementById('error-usuario');
  const passwordError = document.getElementById('error-contrasena');
  const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function message(text = '', cssClass = '') {
    notice.textContent = text;
    notice.className = 'mensaje-formulario' + (cssClass ? ' ' + cssClass : '');
  }
  function clear() {
    message();
    usernameError.textContent = '';
    passwordError.textContent = '';
    user.classList.remove('campo-invalido');
    passwordInput.classList.remove('campo-invalido');
  }

  show.addEventListener('click', function () {
    const type = passwordInput.type === 'password' ? 'text' : 'password';
    passwordInput.type = type;
    show.textContent = type === 'password' ? 'Mostrar' : 'Ocultar';
    show.setAttribute('aria-pressed', String(type === 'text'));
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    if (submitButton.disabled) return;
    clear();
    const email = user.value.trim().toLowerCase();
    const password = passwordInput.value;
    let valid = true;
    if (!EMAIL_PATTERN.test(email)) {
      usernameError.textContent = 'Ingrese un correo electrónico válido.';
      user.classList.add('campo-invalido');
      valid = false;
    }
    if (!password) {
      passwordError.textContent = 'Ingrese su contraseña.';
      passwordInput.classList.add('campo-invalido');
      valid = false;
    }
    if (!valid) return;

    submitButton.disabled = true;
    message('Iniciando sesion...', 'informacion');
    try {
      const data = await api.request('/api/v1/auth/login', {
        method: 'POST', body: { email, password },
      });
      api.saveSession(data);
      passwordInput.value = '';
      window.location.assign('panel.html');
    } catch (error) {
      message(error.status === 401 ? 'Correo o contraseña incorrectos.' : error.message, 'error');
      submitButton.disabled = false;
    }
  });
})();
