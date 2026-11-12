/* HU-GU-03: PUT autenticado, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const form = document.getElementById('formulario-actualizacion');
  const mensaje = document.getElementById('mensaje-actualizacion');
  const guardar = document.getElementById('boton-actualizar');
  const cancelar = document.getElementById('cancelar-actualizacion');
  const idCampo = document.getElementById('id-usuario');
  const nombre = document.getElementById('nombre');
  const correo = document.getElementById('correo');
  const clave = document.getElementById('clave');
  const rol = document.getElementById('rol');

  const sesion = api.sesion();
  if (!sesion) {
    window.location.replace('index.html');
    return;
  }
  if (sesion.role !== 'SUPERUSER') {
    window.location.replace('panel.html');
    return;
  }

  function avisar(texto, clase = '') {
    mensaje.textContent = texto;
    mensaje.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (guardar.disabled) return;
    const id = Number(idCampo.value);
    const password = clave.value;

    if (!Number.isSafeInteger(id) || id < 1) {
      avisar('Debe indicar un ID de usuario válido.', 'error');
      idCampo.focus();
      return;
    }
    if (password && (password.length < 6 || password.length > 100)) {
      avisar('La contraseña debe tener entre 6 y 100 caracteres.', 'error');
      clave.focus();
      return;
    }

    guardar.disabled = true;
    cancelar.disabled = true;
    avisar('Guardando cambios...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/users/' + id, {
        method: 'PUT',
        autenticado: true,
        body: {
          name: nombre.value.trim(),
          email: correo.value.trim().toLowerCase(),
          password: password ? password : null,
          role: rol.value,
        },
      });
      form.reset();
      if (respuesta.id === sesion.id) {
        api.cerrarSesion();
        avisar('Usuario actualizado correctamente. Inicie sesión nuevamente para aplicar los cambios.', 'exito');
      } else {
        avisar('Usuario actualizado correctamente.', 'exito');
      }
    } catch (error) {
      if (error.status === 401) {
        api.cerrarSesion();
        window.location.replace('index.html');
        return;
      }
      avisar(error.message, 'error');
    } finally {
      guardar.disabled = false;
      cancelar.disabled = false;
    }
  });

  cancelar.addEventListener('click', function () {
    if (cancelar.disabled) return;
    form.reset();
    window.location.assign('panel.html');
  });
})();
