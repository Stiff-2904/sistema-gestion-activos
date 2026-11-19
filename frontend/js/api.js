/* HU-GU-01/HU-GU-02: cliente REST compartido; se usa el mismo origen que Spring Boot.
 * El JWT se conserva solo durante la pestaña actual (sessionStorage).
 */
(function (root) {
  'use strict';
  const SESSION_KEY = 'sga_sesion';
  const ROLES = Object.freeze(['SUPERUSER', 'INTERMEDIATE_USER', 'BASIC_USER']);

  function session() {
    try {
      const value = JSON.parse(root.sessionStorage.getItem(SESSION_KEY) || 'null');
      return value && typeof value.token === 'string' && value.token.length > 0 &&
        ROLES.includes(value.role) ? value : null;
    } catch (_) { return null; }
  }

  function saveSession(data) {
    if (!data || typeof data.token !== 'string' || !data.token ||
        !ROLES.includes(data.role)) throw new Error('Respuesta de inicio de sesión inválida.');
    root.sessionStorage.setItem(SESSION_KEY, JSON.stringify({
      token: data.token,
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
    }));
  }

  function clearSession() { root.sessionStorage.removeItem(SESSION_KEY); }

  async function request(route, options = {}) {
    const headers = { Accept: 'application/json' };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.authenticated) {
      const current = session();
      if (!current) {
        const error = new Error('Debe iniciar sesión nuevamente.');
        error.status = 401;
        throw error;
      }
      headers.Authorization = 'Bearer ' + current.token;
    }
    let response;
    try {
      response = await root.fetch(route, {
        method: options.method || 'GET',
        headers: headers,
        cache: 'no-store',
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
      });
    } catch (_) {
      throw new Error('No se pudo conectar con el servidor. Compruebe que Spring Boot esté iniciado.');
    }
    const type = response.headers && response.headers.get('content-type');
    let data = null;
    if (type && type.includes('application/json')) {
      try { data = await response.json(); } catch (_) { data = null; }
    }
    if (!response.ok) {
      const error = new Error((data && typeof data.message === 'string' && data.message)
        || (response.status === 403 ? 'No tiene permisos para realizar esta operación.'
          : response.status === 401 ? 'Sesión no válida o credenciales incorrectas.'
          : 'No se pudo completar la operación.'));
      error.status = response.status;
      throw error;
    }
    if (!data) throw new Error('El servidor no devolvió una respuesta JSON válida.');
    return data;
  }

  root.AssetManagementAPI = { session, saveSession, clearSession, request };
})(window);
