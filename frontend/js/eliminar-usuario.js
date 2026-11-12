/* HU-GU-06: comprobación previa, confirmación y eliminación definitiva. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api.sesion();
  if (!sesion) { window.location.replace('index.html'); return; }
  if (sesion.role !== 'SUPERUSER') { window.location.replace('panel.html'); return; }

  const id = document.getElementById('id-usuario');
  const consultarBoton = document.getElementById('consultar-eliminacion');
  const form = document.getElementById('formulario-eliminar');
  const ficha = document.getElementById('ficha-eliminar');
  const seccion = document.getElementById('seccion-eliminar');
  const borrarBoton = document.getElementById('boton-eliminar');
  const cancelar = document.getElementById('cancelar-eliminacion');
  const mensaje = document.getElementById('mensaje-eliminacion');
  const errorId = document.getElementById('error-id');
  let seleccionado = null;
  let numeroConsulta = 0;

  function avisar(texto, clase) {
    mensaje.textContent = texto || '';
    mensaje.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiar() {
    seleccionado = null;
    ficha.hidden = true;
    seccion.hidden = true;
  }
  function errorSolicitud(error) {
    if (error.status === 401) {
      api.cerrarSesion();
      window.location.replace('index.html');
    } else if (error.status === 403) {
      window.location.replace('panel.html');
    } else {
      avisar(error.message || 'No se pudo completar la operación.', 'error');
    }
  }
  function idValido() {
    const valor = id.value.trim();
    if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
      errorId.textContent = 'Ingrese un ID de usuario válido (entero positivo).';
      id.setAttribute('aria-invalid', 'true');
      id.focus();
      return null;
    }
    errorId.textContent = '';
    id.removeAttribute('aria-invalid');
    return Number(valor);
  }
  async function consultar() {
    limpiar();
    avisar('', '');
    const userId = idValido();
    if (userId === null) return;
    const turno = ++numeroConsulta;
    consultarBoton.disabled = true;
    avisar('Comprobando condiciones de eliminación...', 'informacion');
    try {
      const usuario = await api.solicitud('/api/v1/users/' + userId + '/deletion', { autenticado: true });
      if (turno !== numeroConsulta) return;
      if (!usuario || usuario.id !== userId || typeof usuario.canDelete !== 'boolean' || typeof usuario.active !== 'boolean') {
        throw new Error('El servidor no devolvió una evaluación válida.');
      }
      document.getElementById('nombre-eliminar').textContent = usuario.name;
      document.getElementById('correo-eliminar').textContent = usuario.email;
      document.getElementById('rol-eliminar').textContent = usuario.role;
      document.getElementById('estado-eliminar').textContent = usuario.active ? 'Activo' : 'Inactivo';
      ficha.hidden = false;
      // No basta confiar en la pantalla: DELETE vuelve a validar todo en el servidor.
      if (usuario.canDelete && !usuario.active && usuario.id !== sesion.id) {
        seleccionado = usuario;
        seccion.hidden = false;
        avisar('Cuenta habilitada para eliminación definitiva.', 'informacion');
      } else {
        avisar(usuario.message || 'Esta cuenta no puede eliminarse.', 'error');
      }
    } catch (error) {
      if (turno === numeroConsulta) errorSolicitud(error);
    } finally {
      if (turno === numeroConsulta) consultarBoton.disabled = false;
    }
  }
  id.addEventListener('input', function () {
    numeroConsulta++;
    limpiar();
    errorId.textContent = '';
    id.removeAttribute('aria-invalid');
    consultarBoton.disabled = false;
    avisar('', '');
  });
  consultarBoton.addEventListener('click', consultar);
  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (!seleccionado || borrarBoton.disabled) return;
    const usuario = seleccionado;
    if (!window.confirm('¿Eliminar DEFINITIVAMENTE al usuario ' + usuario.email + ' (ID ' + usuario.id + ')? Esta acción NO se puede deshacer.')) {
      avisar('Eliminación cancelada. No se modificó el registro.', 'informacion');
      return;
    }
    borrarBoton.disabled = true;
    consultarBoton.disabled = true;
    cancelar.disabled = true;
    id.disabled = true;
    avisar('Eliminando usuario...', 'informacion');
    try {
      const resultado = await api.solicitud('/api/v1/users/' + usuario.id, {
        method: 'DELETE', autenticado: true,
      });
      if (!resultado || resultado.id !== usuario.id) throw new Error('El servidor no confirmó la eliminación.');
      limpiar();
      id.value = '';
      avisar('Usuario eliminado definitivamente de forma exitosa.', 'exito');
    } catch (error) {
      // Un 409 puede deberse a un cambio de estado o historial desde la consulta.
      if (error.status === 409) limpiar();
      errorSolicitud(error);
    } finally {
      borrarBoton.disabled = false;
      consultarBoton.disabled = false;
      cancelar.disabled = false;
      id.disabled = false;
    }
  });
  cancelar.addEventListener('click', function () {
    if (cancelar.disabled) return;
    numeroConsulta++;
    limpiar();
    form.reset();
    window.location.assign('panel.html');
  });
})();
