/* HU-GU-01: verifica la sesión contra el backend antes de habilitar la navegación. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const datos = api.sesion();
  if (!datos) { window.location.replace('index.html'); return; }

  document.getElementById('cerrar-sesion').addEventListener('click', function () {
    api.cerrarSesion();
    window.location.assign('index.html');
  });
  (async () => {
    try {
      const usuario = await api.solicitud('/api/v1/auth/me', { autenticado: true });
      document.getElementById('datos-cuenta').textContent = usuario.name + ' · ' + usuario.email;
      document.getElementById('rol-cuenta').textContent = 'Rol: ' + usuario.role;
      const navegacion = typeof document.querySelector === 'function' ? document.querySelector('.admin-navigation') : null;
      if (navegacion) navegacion.hidden = usuario.role !== 'SUPERUSER';
      if (typeof document.querySelectorAll === 'function') {
        document.querySelectorAll('[data-admin-link]').forEach(enlace => {
          enlace.hidden = usuario.role !== 'SUPERUSER';
        });
      }
      if (typeof document.querySelectorAll === 'function') {
        document.querySelectorAll('[data-catalog-link]').forEach(enlace => {
          enlace.hidden = usuario.role === 'BASIC_USER';
        });
      }
      const enlaceCatalogos = document.getElementById('enlace-catalogos');
      if (enlaceCatalogos) enlaceCatalogos.hidden = usuario.role === 'BASIC_USER';
      // La sección Gestión de activos es accesible para consulta en todos los perfiles.
      // Solo la tarjeta de registro requiere SUPERUSER.
      const enlaceRegistrarActivo = document.getElementById('enlace-activo');
      if (enlaceRegistrarActivo) enlaceRegistrarActivo.hidden = usuario.role !== 'SUPERUSER';
      const enlaceActualizarActivo = document.getElementById('enlace-actualizar-activo');
      if (enlaceActualizarActivo) enlaceActualizarActivo.hidden = usuario.role !== 'SUPERUSER';
      const contadorActivos = document.getElementById('contador-funciones-activos');
      if (contadorActivos) contadorActivos.textContent = usuario.role === 'SUPERUSER' ? '3 FUNCIONES' : '1 FUNCIÓN';
      document.getElementById('enlace-registro').hidden = usuario.role !== 'SUPERUSER';
      document.getElementById('enlace-actualizacion').hidden = usuario.role !== 'SUPERUSER';
      const enlaceRol = document.getElementById('enlace-rol');
      if (enlaceRol) enlaceRol.hidden = usuario.role !== 'SUPERUSER';
      const enlaceEstado = document.getElementById('enlace-estado');
      if (enlaceEstado) enlaceEstado.hidden = usuario.role !== 'SUPERUSER';
      const enlaceEliminar = document.getElementById('enlace-eliminar');
      if (enlaceEliminar) enlaceEliminar.hidden = usuario.role !== 'SUPERUSER';
      document.getElementById('panel-cuenta').hidden = false;
      document.getElementById('estado-panel').hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        api.cerrarSesion();
        window.location.replace('index.html');
      } else {
        const estado = document.getElementById('estado-panel');
        estado.textContent = error.message;
      }
    }
  })();
})();
