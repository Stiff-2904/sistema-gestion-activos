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
      document.getElementById('enlace-registro').hidden = usuario.role !== 'SUPERUSER';
      document.getElementById('enlace-actualizacion').hidden = usuario.role !== 'SUPERUSER';
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
