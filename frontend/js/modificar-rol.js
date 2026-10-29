/* HU-GU-04: PATCH autenticado del rol, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const formulario = document.getElementById('formulario-rol');
  const aviso = document.getElementById('mensaje-rol');
  const boton = document.getElementById('boton-modificar-rol');
  const cancelar = document.getElementById('cancelar-rol');
  const campos = {
    id: document.getElementById('id-usuario'),
    role: document.getElementById('rol'),
  };

  // Sin sesion va al login; con sesion pero sin rol SUPERUSER vuelve a la pantalla principal.
  const sesion = api.sesion();
  if (!sesion) {
    window.location.replace('index.html');
    return;
  }
  if (sesion.role !== 'SUPERUSER') {
    window.location.replace('panel.html');
    return;
  }

  function mensaje(texto = '', clase = '') {
    aviso.textContent = texto;
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiar() {
    mensaje();
    for (const [clave, campo] of Object.entries(campos)) {
      campo.classList.remove('campo-invalido');
      campo.removeAttribute('aria-invalid');
      document.getElementById('error-' + clave).textContent = '';
    }
  }
  for (const campo of Object.values(campos)) {
    campo.addEventListener('input', limpiar);
    campo.addEventListener('change', limpiar);
  }

  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (boton.disabled) return;
    limpiar();
    const resultado = window.SGARolValidaciones.validarCambioRol({
      id: campos.id.value,
      role: campos.role.value,
    });
    if (!resultado.valido) {
      for (const [clave, texto] of Object.entries(resultado.errores)) {
        campos[clave].classList.add('campo-invalido');
        campos[clave].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + clave).textContent = texto;
      }
      campos[Object.keys(resultado.errores)[0]].focus();
      mensaje('Revise los campos indicados antes de continuar.', 'error');
      return;
    }

    boton.disabled = true;
    cancelar.disabled = true; // No ofrecer cancelacion cuando el PATCH ya ha comenzado.
    mensaje('Modificando rol...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/users/' + resultado.datos.id + '/role', {
        method: 'PATCH', body: { role: resultado.datos.role }, autenticado: true,
      });
      if (!respuesta || respuesta.id !== resultado.datos.id || respuesta.role !== resultado.datos.role) {
        throw new Error('El servidor no confirmo correctamente el cambio de rol.');
      }
      formulario.reset();
      if (respuesta.id === sesion.id) {
        // El rol de la cuenta en uso cambio: la sesion actual ya no es valida.
        api.cerrarSesion();
        mensaje('Rol de su propia cuenta modificado. Inicie sesion nuevamente para aplicar los cambios.', 'exito');
      } else {
        mensaje('Rol del usuario ' + respuesta.email + ' modificado correctamente a ' + respuesta.role + '.', 'exito');
      }
    } catch (error) {
      if (error.status === 401) {
        api.cerrarSesion();
        window.location.replace('index.html');
        return;
      }
      mensaje(error.message, 'error');
    } finally { boton.disabled = false; cancelar.disabled = false; }
  });

  cancelar.addEventListener('click', function () {
    if (cancelar.disabled) return;
    // CA02: cancelar descarta los datos y jamas ejecuta PATCH.
    formulario.reset();
    limpiar();
    window.location.assign('panel.html');
  });
})();
