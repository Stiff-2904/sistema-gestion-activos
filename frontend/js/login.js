/* HU-GU-01: validar campos, autenticar por correo/contraseña y abrir panel. */
(function () {
  'use strict';
  const usuario = document.getElementById('usuario');
  const contrasena = document.getElementById('contrasena');
  const mostrar = document.getElementById('mostrar-contrasena');
  const boton = document.getElementById('boton-login');
  const errorUsuario = document.getElementById('error-usuario');
  const errorContrasena = document.getElementById('error-contrasena');
  const mensaje = document.getElementById('mensaje-formulario');
  const formulario = document.getElementById('formulario-login');
  const api = window.SGAAPI;

  function estado(texto = '', clase = '') {
    mensaje.textContent = texto;
    mensaje.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiar(campo, error) {
    campo.classList.remove('campo-invalido');
    campo.removeAttribute('aria-invalid');
    error.textContent = '';
    estado();
  }
  function invalido(campo, error, texto) {
    campo.classList.add('campo-invalido');
    campo.setAttribute('aria-invalid', 'true');
    error.textContent = texto;
  }

  mostrar.addEventListener('click', function () {
    const visible = contrasena.type === 'password';
    contrasena.type = visible ? 'text' : 'password';
    mostrar.textContent = visible ? 'Ocultar' : 'Mostrar';
    mostrar.setAttribute('aria-label', visible ? 'Ocultar contraseña' : 'Mostrar contraseña');
    mostrar.setAttribute('aria-pressed', String(visible));
  });
  usuario.addEventListener('input', () => limpiar(usuario, errorUsuario));
  contrasena.addEventListener('input', () => limpiar(contrasena, errorContrasena));

  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    limpiar(usuario, errorUsuario);
    limpiar(contrasena, errorContrasena);
    const correo = usuario.value.trim().toLowerCase();
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      invalido(usuario, errorUsuario, 'Ingrese un correo electrónico válido.');
    }
    if (!contrasena.value) {
      invalido(contrasena, errorContrasena, 'Ingrese su contraseña.');
    }
    if (errorUsuario.textContent || errorContrasena.textContent) {
      (errorUsuario.textContent ? usuario : contrasena).focus();
      return;
    }

    boton.disabled = true;
    estado('Verificando credenciales...', 'informacion');
    try {
      const datos = await api.solicitud('/api/v1/auth/login', {
        method: 'POST', body: { email: correo, password: contrasena.value },
      });
      api.guardarSesion(datos);
      contrasena.value = '';
      window.location.assign('panel.html');
    } catch (error) {
      // No revelar si el correo existe cuando las credenciales son incorrectas.
      estado(error.status === 401
        ? 'Correo o contraseña incorrectos, o cuenta inactiva.' : error.message, 'error');
    } finally { boton.disabled = false; }
  });
})();
