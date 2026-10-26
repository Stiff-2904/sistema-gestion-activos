/* HU-GU-03: actualización protegida para SUPERUSER, contraseña opcional. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api.sesion();
  if (!sesion || sesion.role !== 'SUPERUSER') {
    window.location.replace('index.html');
    return;
  }
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
    mensaje.textContent = texto;
    mensaje.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (guardar.disabled) return;
    const id = Number(idCampo.value);
    const name = nombre.value.trim();
    const email = correo.value.trim().toLowerCase();
    const password = clave.value;
    const role = rol.value;
    if (!Number.isSafeInteger(id) || id < 1) {
      avisar('Debe indicar un ID de usuario válido.', 'error'); idCampo.focus(); return;
    }
    if (!name || name.length > 100 || !email || email.length > 100 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        !['SUPERUSER', 'INTERMEDIATE_USER', 'BASIC_USER'].includes(role) ||
        (password.length > 0 && (password.length < 6 || password.length > 100))) {
      avisar('Revise nombre, correo, rol y contraseña (6 a 100 caracteres cuando se modifica).', 'error');
      return;
    }
    guardar.disabled = true;
    cancelar.disabled = true;
    avisar('Guardando cambios...', 'informacion');
    try {
      const datos = await api.solicitud('/api/v1/users/' + id, {
        method: 'PUT', autenticado: true,
        body: { name, email, password: password || null, role },
      });
      if (!datos || datos.id !== id || datos.email !== email) {
        throw new Error('No se pudo confirmar la actualización.');
      }
      form.reset();
      if (sesion.id === id) {
        api.cerrarSesion();
        avisar('Cuenta actualizada. Inicie sesión nuevamente para aplicar los cambios.', 'exito');
      } else {
        avisar('Usuario ' + datos.email + ' actualizado correctamente.', 'exito');
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
    if (!cancelar.disabled) {
      form.reset();
      window.location.assign('panel.html');
    }
  });
})();
