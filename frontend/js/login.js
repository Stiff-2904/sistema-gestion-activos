/* HU-GU-01: inicio de sesion contra el backend y creacion de la sesion con SGAAPI. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const formulario = document.getElementById('formulario-login');
  const usuario = document.getElementById('usuario');
  const contrasena = document.getElementById('contrasena');
  const boton = document.getElementById('boton-login');
  const aviso = document.getElementById('mensaje-formulario');
  const mostrar = document.getElementById('mostrar-contrasena');
  const errorUsuario = document.getElementById('error-usuario');
  const errorContrasena = document.getElementById('error-contrasena');
  const formatoCorreo = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function mensaje(texto = '', clase = '') {
    aviso.textContent = texto;
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiar() {
    mensaje();
    errorUsuario.textContent = '';
    errorContrasena.textContent = '';
    usuario.classList.remove('campo-invalido');
    contrasena.classList.remove('campo-invalido');
  }

  mostrar.addEventListener('click', function () {
    const tipo = contrasena.type === 'password' ? 'text' : 'password';
    contrasena.type = tipo;
    mostrar.textContent = tipo === 'password' ? 'Mostrar' : 'Ocultar';
    mostrar.setAttribute('aria-pressed', String(tipo === 'text'));
  });

  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (boton.disabled) return;
    limpiar();
    const email = usuario.value.trim().toLowerCase();
    const password = contrasena.value;
    let valido = true;
    if (!formatoCorreo.test(email)) {
      errorUsuario.textContent = 'Ingrese un correo electrónico válido.';
      usuario.classList.add('campo-invalido');
      valido = false;
    }
    if (!password) {
      errorContrasena.textContent = 'Ingrese su contraseña.';
      contrasena.classList.add('campo-invalido');
      valido = false;
    }
    if (!valido) return;

    boton.disabled = true;
    mensaje('Iniciando sesion...', 'informacion');
    try {
      const datos = await api.solicitud('/api/v1/auth/login', {
        method: 'POST', body: { email, password },
      });
      api.guardarSesion(datos);
      contrasena.value = '';
      window.location.assign('panel.html');
    } catch (error) {
      mensaje(error.status === 401 ? 'Correo o contraseña incorrectos.' : error.message, 'error');
      boton.disabled = false;
    }
  });
})();
