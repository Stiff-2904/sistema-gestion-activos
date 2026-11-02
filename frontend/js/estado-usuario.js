/* HU-GU-05: consultar y modificar el estado de una cuenta con motivo y auditoria. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api.sesion();
  if (!sesion) { window.location.replace('index.html'); return; }
  if (sesion.role !== 'SUPERUSER') { window.location.replace('panel.html'); return; }

  const id = document.getElementById('id-usuario');
  const consulta = document.getElementById('consultar-estado');
  const formulario = document.getElementById('formulario-estado');
  const ficha = document.getElementById('ficha-usuario');
  const seccion = document.getElementById('seccion-cambio');
  const motivo = document.getElementById('motivo-estado');
  const boton = document.getElementById('boton-estado');
  const cancelar = document.getElementById('cancelar-estado');
  const aviso = document.getElementById('mensaje-estado');
  const errorId = document.getElementById('error-id');
  const errorMotivo = document.getElementById('error-motivo');
  let usuarioActual = null;

  function mensaje(texto, clase) {
    aviso.textContent = texto || '';
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function invalidarSeleccion() {
    usuarioActual = null;
    ficha.hidden = true;
    seccion.hidden = true;
    motivo.value = '';
    errorMotivo.textContent = '';
  }
  function validarId() {
    const valor = id.value.trim();
    if (!/^[1-9]\d*$/.test(valor) || !Number.isSafeInteger(Number(valor))) {
      errorId.textContent = 'Ingrese un ID de usuario valido (entero positivo).';
      id.setAttribute('aria-invalid', 'true');
      id.focus();
      return null;
    }
    errorId.textContent = '';
    id.removeAttribute('aria-invalid');
    return Number(valor);
  }
  function mostrarUsuario(usuario) {
    usuarioActual = usuario;
    document.getElementById('nombre-usuario').textContent = usuario.name;
    document.getElementById('correo-usuario').textContent = usuario.email;
    document.getElementById('rol-usuario').textContent = usuario.role;
    const actual = document.getElementById('estado-actual');
    actual.textContent = usuario.active ? 'Activo' : 'Inactivo';
    actual.className = usuario.active ? 'estado-activo' : 'estado-inactivo';
    boton.textContent = usuario.active ? 'Inactivar usuario' : 'Activar usuario';
    motivo.value = '';
    ficha.hidden = false;
    seccion.hidden = false;
  }
  async function consultar() {
    invalidarSeleccion();
    mensaje('', '');
    const userId = validarId();
    if (userId === null) return;
    consulta.disabled = true;
    mensaje('Consultando estado actual...', 'informacion');
    try {
      const usuario = await api.solicitud('/api/v1/users/' + userId + '/status', { autenticado: true });
      if (!usuario || usuario.id !== userId || typeof usuario.active !== 'boolean') {
        throw new Error('El servidor no devolvio un estado valido para ese usuario.');
      }
      mostrarUsuario(usuario);
      mensaje('Cuenta encontrada. Indique el motivo para continuar.', 'informacion');
    } catch (error) { manejarError(error); }
    finally { consulta.disabled = false; }
  }
  function manejarError(error) {
    if (error.status === 401) {
      api.cerrarSesion();
      window.location.replace('index.html');
      return;
    }
    if (error.status === 403) {
      window.location.replace('panel.html');
      return;
    }
    mensaje(error.message || 'No se pudo completar la operacion.', 'error');
  }
  id.addEventListener('input', function () {
    invalidarSeleccion();
    errorId.textContent = '';
    id.removeAttribute('aria-invalid');
    mensaje('', '');
  });
  motivo.addEventListener('input', function () {
    errorMotivo.textContent = '';
    motivo.removeAttribute('aria-invalid');
  });
  consulta.addEventListener('click', consultar);
  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (!usuarioActual || boton.disabled) return;
    const texto = motivo.value.trim();
    if (!texto || texto.length > 500) {
      errorMotivo.textContent = texto ? 'El motivo no puede superar 500 caracteres.' : 'Es obligatorio indicar un motivo.';
      motivo.setAttribute('aria-invalid', 'true');
      motivo.focus();
      mensaje('Revise el motivo del cambio.', 'error');
      return;
    }
    const cambiarA = !usuarioActual.active;
    const verbo = cambiarA ? 'activar' : 'inactivar';
    if (!window.confirm('¿Confirma que desea ' + verbo + ' al usuario ' + usuarioActual.email + '?')) return;

    boton.disabled = true;
    cancelar.disabled = true;
    consulta.disabled = true;
    id.disabled = true;
    motivo.disabled = true;
    mensaje('Guardando cambio...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/users/' + usuarioActual.id + '/status', {
        method: 'PATCH', autenticado: true, body: { active: cambiarA, reason: texto },
      });
      if (!respuesta || respuesta.id !== usuarioActual.id || respuesta.active !== cambiarA) {
        throw new Error('El servidor no confirmo correctamente el cambio de estado.');
      }
      mostrarUsuario(respuesta);
      mensaje('El usuario ' + respuesta.email + ' fue ' + (cambiarA ? 'activado' : 'inactivado') + ' correctamente.', 'exito');
      if (respuesta.id === sesion.id && !cambiarA) {
        api.cerrarSesion();
        ficha.hidden = true;
        seccion.hidden = true;
        mensaje('Su propia cuenta fue inactivada. Debe iniciar sesion con una cuenta activa.', 'exito');
      }
    } catch (error) { manejarError(error); }
    finally {
      boton.disabled = false; cancelar.disabled = false; consulta.disabled = false;
      id.disabled = false; motivo.disabled = false;
    }
  });
  cancelar.addEventListener('click', function () {
    if (cancelar.disabled) return;
    // CA03: salir sin emitir ninguna solicitud PATCH.
    formulario.reset();
    invalidarSeleccion();
    mensaje('', '');
    window.location.assign('panel.html');
  });
})();
