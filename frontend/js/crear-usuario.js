/* HU-GU-02: POST autenticado, validaciones, permisos y cancelación sin cambios. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const formulario = document.getElementById('formulario-registro');
  const aviso = document.getElementById('mensaje-registro');
  const boton = document.getElementById('boton-registrar');
  const cancelar = document.getElementById('cancelar-registro');
  const campos = {
    name: document.getElementById('nombre'),
    email: document.getElementById('correo'),
    password: document.getElementById('clave'),
    role: document.getElementById('rol'),
  };
  const sesion = api.sesion();
  if (!sesion || sesion.role !== 'SUPERUSER') {
    window.location.replace('index.html');
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
    const datos = Object.fromEntries(
      Object.entries(campos).map(([clave, campo]) => [clave, campo.value]));
    const resultado = window.SGARegistroValidaciones.validarUsuario(datos);
    if (!resultado.valido) {
      for (const [clave, texto] of Object.entries(resultado.errores)) {
        campos[clave].classList.add('campo-invalido');
        campos[clave].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + clave).textContent = texto;
      }
      campos[Object.keys(resultado.errores)[0]].focus();
      mensaje('Revise los campos señalados antes de continuar.', 'error');
      return;
    }

    boton.disabled = true;
    cancelar.disabled = true; // No ofrecer cancelación cuando el POST ya ha comenzado.
    mensaje('Registrando usuario...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/users', {
        method: 'POST', body: resultado.datos, autenticado: true,
      });
      if (!respuesta || !respuesta.id || respuesta.email !== resultado.datos.email) {
        throw new Error('El servidor no confirmó correctamente el registro.');
      }
      formulario.reset();
      mensaje('Usuario ' + respuesta.email + ' registrado correctamente con rol ' + respuesta.role + '.', 'exito');
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
    // CA04: cancelar descarta los datos y jamás ejecuta POST.
    formulario.reset();
    limpiar();
    window.location.assign('panel.html');
  });
})();
