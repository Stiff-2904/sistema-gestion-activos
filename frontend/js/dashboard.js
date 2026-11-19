/* HU-GU-01: verifica la sesión contra el backend antes de habilitar la navegación. */
(function () {
  'use strict';
  const api = window.AssetManagementAPI;
  const data = api.session();
  if (!data) { window.location.replace('index.html'); return; }

  document.getElementById('close-session').addEventListener('click', function () {
    api.clearSession();
    window.location.assign('index.html');
  });
  (async () => {
    try {
      const user = await api.request('/api/v1/auth/me', { authenticated: true });
      document.getElementById('account-details').textContent = user.name + ' · ' + user.email;
      document.getElementById('account-role').textContent = 'Rol: ' + user.role;
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
      const catalogLink = document.getElementById('link-catalogs');
      if (catalogLink) catalogLink.hidden = user.role === 'BASIC_USER';
      // La sección Gestión de activos es accesible para consulta en todos los perfiles.
      // Solo la tarjeta de registro requiere SUPERUSER.
      const registerAssetLink = document.getElementById('link-asset');
      if (registerAssetLink) registerAssetLink.hidden = user.role !== 'SUPERUSER';
      const updateAssetLink = document.getElementById('link-update-asset');
      if (updateAssetLink) updateAssetLink.hidden = user.role !== 'SUPERUSER';
      const assetCounter = document.getElementById('counter-functions-assets');
      if (assetCounter) assetCounter.textContent = user.role === 'SUPERUSER' ? '3 FUNCIONES' : '1 FUNCIÓN';
      document.getElementById('link-registration').hidden = user.role !== 'SUPERUSER';
      document.getElementById('link-update').hidden = user.role !== 'SUPERUSER';
      const roleLink = document.getElementById('link-role');
      if (roleLink) roleLink.hidden = user.role !== 'SUPERUSER';
      const statusLink = document.getElementById('link-status');
      if (statusLink) statusLink.hidden = user.role !== 'SUPERUSER';
      const deleteLink = document.getElementById('link-delete');
      if (deleteLink) deleteLink.hidden = user.role !== 'SUPERUSER';
      document.getElementById('account-panel').hidden = false;
      document.getElementById('status-dashboard').hidden = true;
    } catch (error) {
      if (error.status === 401 || error.status === 403) {
        api.clearSession();
        window.location.replace('index.html');
      } else {
        const status = document.getElementById('status-dashboard');
        status.textContent = error.message;
      }
    }
  })();
})();
