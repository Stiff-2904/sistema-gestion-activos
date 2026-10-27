document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const form = document.getElementById('formulario-login');
  const inputUsuario = document.getElementById('usuario');
  const inputContrasena = document.getElementById('contrasena');
  const btnLogin = document.getElementById('boton-login');
  const mensajeFormulario = document.getElementById('mensaje-formulario');
  const btnMostrar = document.getElementById('mostrar-contrasena');

  if (btnMostrar && inputContrasena) {
    btnMostrar.addEventListener('click', function () {
      const tipo = inputContrasena.getAttribute('type') === 'password' ? 'text' : 'password';
      inputContrasena.setAttribute('type', tipo);
      btnMostrar.textContent = tipo === 'password' ? 'Mostrar' : 'Ocultar';
      btnMostrar.setAttribute('aria-pressed', tipo === 'text');
    });
  }

  function mostrarMensaje(texto, clase = '') {
    if (!mensajeFormulario) return;
    mensajeFormulario.textContent = texto;
    mensajeFormulario.className = 'mensaje-formulario ' + clase;
  }

  if (form) {
    form.addEventListener('submit', async function (evento) {
      evento.preventDefault();

      const email = inputUsuario.value.trim().toLowerCase();
      const password = inputContrasena.value;

      if (!email || !password) {
        mostrarMensaje('Por favor, complete todos los campos.', 'error');
        return;
      }

      if (btnLogin) btnLogin.disabled = true;
      mostrarMensaje('Iniciando sesión...', 'informacion');

      try {
        const respuesta = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password })
        });

        if (!respuesta.ok) {
          throw new Error('Credenciales inválidas o error en el servidor.');
        }

        const data = await respuesta.json();

        localStorage.setItem('token', data.token || data.accessToken);
        localStorage.setItem('usuario', JSON.stringify({
          id: data.id || 1,
          role: data.role || 'SUPERUSER',
          email: email
        }));

        mostrarMensaje('¡Acceso concedido! Redirigiendo...', 'exito');

        setTimeout(() => {
          window.location.href = 'panel.html';
        }, 800);

      } catch (error) {
        mostrarMensaje(error.message || 'Error al conectar con el servidor.', 'error');
        if (btnLogin) btnLogin.disabled = false;
      }
    });
  }
});