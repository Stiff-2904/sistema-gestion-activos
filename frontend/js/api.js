/* HU-GU-01/HU-GU-02: cliente REST compartido; se usa el mismo origen que Spring Boot.
 * El JWT se conserva solo durante la pestaña actual (sessionStorage).
 */
(function (root) {
  'use strict';
  const CLAVE = 'sga_sesion';
  const ROLES = Object.freeze(['SUPERUSER', 'INTERMEDIATE_USER', 'BASIC_USER']);

  function sesion() {
    try {
      const valor = JSON.parse(root.sessionStorage.getItem(CLAVE) || 'null');
      return valor && typeof valor.token === 'string' && valor.token.length > 0 &&
        ROLES.includes(valor.role) ? valor : null;
    } catch (_) { return null; }
  }

  function guardarSesion(datos) {
    if (!datos || typeof datos.token !== 'string' || !datos.token ||
        !ROLES.includes(datos.role)) throw new Error('Respuesta de inicio de sesión inválida.');
    root.sessionStorage.setItem(CLAVE, JSON.stringify({
      token: datos.token,
      id: datos.id,
      name: datos.name,
      email: datos.email,
      role: datos.role,
    }));
  }

  function cerrarSesion() { root.sessionStorage.removeItem(CLAVE); }

  async function solicitud(ruta, opciones = {}) {
    const encabezados = { Accept: 'application/json' };
    if (opciones.body !== undefined) encabezados['Content-Type'] = 'application/json';
    if (opciones.autenticado) {
      const actual = sesion();
      if (!actual) {
        const error = new Error('Debe iniciar sesión nuevamente.');
        error.status = 401;
        throw error;
      }
      encabezados.Authorization = 'Bearer ' + actual.token;
    }
    let respuesta;
    try {
      respuesta = await root.fetch(ruta, {
        method: opciones.method || 'GET',
        headers: encabezados,
        cache: 'no-store',
        ...(opciones.body !== undefined ? { body: JSON.stringify(opciones.body) } : {}),
      });
    } catch (_) {
      throw new Error('No se pudo conectar con el servidor. Compruebe que Spring Boot esté iniciado.');
    }
    const tipo = respuesta.headers && respuesta.headers.get('content-type');
    let datos = null;
    if (tipo && tipo.includes('application/json')) {
      try { datos = await respuesta.json(); } catch (_) { datos = null; }
    }
    if (!respuesta.ok) {
      const error = new Error((datos && typeof datos.message === 'string' && datos.message)
        || (respuesta.status === 403 ? 'No tiene permisos para realizar esta operación.'
          : respuesta.status === 401 ? 'Sesión no válida o credenciales incorrectas.'
          : 'No se pudo completar la operación.'));
      error.status = respuesta.status;
      throw error;
    }
    if (!datos) throw new Error('El servidor no devolvió una respuesta JSON válida.');
    return datos;
  }

  root.SGAAPI = { sesion, guardarSesion, cerrarSesion, solicitud };
})(window);
