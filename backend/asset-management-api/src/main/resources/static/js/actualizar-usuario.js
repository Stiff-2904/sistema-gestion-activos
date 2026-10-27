(function () {
  'use strict';
  
  const form = document.getElementById('formulario-actualizacion');
  const mensaje = document.getElementById('mensaje-actualizacion');
  const guardar = document.getElementById('boton-actualizar');
  const cancelar = document.getElementById('cancelar-actualizacion');
  const idCampo = document.getElementById('id-usuario');
  const nombre = document.getElementById('nombre');
  const correo = document.getElementById('correo');
  const clave = document.getElementById('clave');
  const rol = document.getElementById('rol');

  function avisar(texto, clase = '') {
    if (!mensaje) return;
    mensaje.textContent = texto;
    mensaje.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }

  if (form) {
    form.addEventListener('submit', async function (evento) {
      evento.preventDefault();
      if (guardar && guardar.disabled) return;
      
      const id = Number(idCampo.value);
      const name = nombre.value.trim();
      const email = correo.value.trim().toLowerCase();
      const password = clave.value;
      const role = rol.value;

      if (!Number.isSafeInteger(id) || id < 1) {
        avisar('Debe indicar un ID de usuario válido.', 'error'); 
        idCampo.focus(); 
        return;
      }

      if (guardar) guardar.disabled = true;
      if (cancelar) cancelar.disabled = true;
      avisar('Guardando cambios...', 'informacion');

      try {
        const usuarioSesion = JSON.parse(localStorage.getItem('usuario') || '{}');
        const token = usuarioSesion.token || localStorage.getItem('token') || '';

        const headers = {
          'Content-Type': 'application/json'
        };

        if (token) {
          headers['Authorization'] = 'Bearer ' + token;
        }

        const respuesta = await fetch('/api/v1/users/' + id, {
          method: 'PUT',
          headers: headers,
          body: JSON.stringify({ 
            name: name, 
            email: email, 
            password: password ? password : null, 
            role: role 
          })
        });

        if (!respuesta.ok) {
          const errorData = await respuesta.json().catch(() => ({}));
          throw new Error(errorData.message || 'Error en el servidor: ' + respuesta.statusText);
        }

        form.reset();
        avisar('¡Usuario actualizado correctamente en la base de datos!', 'exito');
      } catch (error) {
        avisar(error.message || 'Error al actualizar el usuario.', 'error');
      } finally {
        if (guardar) guardar.disabled = false;
        if (cancelar) cancelar.disabled = false;
      }
    });
  }

  if (cancelar) {
    cancelar.addEventListener('click', function () {
      if (form) form.reset();
      window.location.assign('panel.html');
    });
  }
})();