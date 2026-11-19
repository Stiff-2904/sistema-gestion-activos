/* HU-GU-01: verifica la sesión contra el backend antes de habilitar la navegación. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const data = api.session();
  if (!data) { window.location.replace('index.html'); return; }

  document.getElementById('cerrar-sesion').addEventListener('click', function () {
    api.clearSession();
    window.location.assign('index.html');
  });
  (async () => {
    try {
      const user = await api.request('/api/v1/auth/me', { authenticated: true });
      document.getElementById('datos-cuenta').textContent = user.name + ' · ' + user.email;
      document.getElementById('rol-cuenta').textContent = 'Rol: ' + user.role;
      const navigation = typeof document.querySelector === 'function' ? document.querySelector('.admin-navigation') : null;
      if (navigation) navigation.hidden = user.role !== 'SUPERUSER';
      if (typeof document.querySelectorAll === 'function') {
        document.querySelectorAll('[data-admin-link]').forEach(createLink => {
          createLink.hidden = user.role !== 'SUPERUSER';
        });
      }
      if (typeof document.querySelectorAll === 'function') {
        document.querySelectorAll('[data-catalog-link]').forEach(createLink => {
          createLink.hidden = user.role === 'BASIC_USER';
        });
      }
      const catalogLink = document.getElementById('enlace-catalogos');
      if (catalogLink) catalogLink.hidden = user.role === 'BASIC_USER';
      // La sección Gestión de activos es accesible para consulta en todos los perfiles.
      // Solo la tarjeta de registro requiere SUPERUSER.
      const registerAssetLink = document.getElementById('enlace-activo');
      if (registerAssetLink) registerAssetLink.hidden = user.role !== 'SUPERUSER';
      const updateAssetLink = document.getElementById('enlace-actualizar-activo');
      if (updateAssetLink) updateAssetLink.hidden = user.role !== 'SUPERUSER';
      const assetCounter = document.getElementById('contador-funciones-activos');
      if (assetCounter) assetCounter.textContent = user.role === 'SUPERUSER' ? '3 FUNCIONES' : '1 FUNCIÓN';
      document.getElementById('enlace-registro').hidden = user.role !== 'SUPERUSER';
      document.getElementById('enlace-actualizacion').hidden = user.role !== 'SUPERUSER';
      const roleLink = document.getElementById('enlace-rol');
      if (roleLink) roleLink.hidden = user.role !== 'SUPERUSER';
      const statusLink = document.getElementById('enlace-estado');
      if (statusLink) statusLink.hidden = user.role !== 'SUPERUSER';
      const deleteLink = document.getElementById('enlace-eliminar');
      if (deleteLink) deleteLink.hidden = user.role !== 'SUPERUSER';
      document.getElementById('panel-cuenta').hidden = false;
      document.getElementById('estado-panel').hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        api.clearSession();
        window.location.replace('index.html');
      } else {
        const status = document.getElementById('estado-panel');
        status.textContent = error.message;
      }
    }
  })();
})();
