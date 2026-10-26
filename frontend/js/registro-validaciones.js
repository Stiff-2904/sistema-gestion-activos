/* Validaciones de HU-GU-02 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const ROLES = Object.freeze(["SUPERUSER", "INTERMEDIATE_USER", "BASIC_USER"]);

  function validarUsuario(datos) {
    const nombre = String(datos.name || "").trim();
    const correo = String(datos.email || "").trim().toLowerCase();
    const contrasena = String(datos.password || "");
    const rol = String(datos.role || "").trim();
    const errores = {};

    if (!nombre) errores.name = "El nombre es obligatorio.";
    else if (nombre.length > 100) errores.name = "Máximo 100 caracteres.";

    if (!correo) errores.email = "El correo es obligatorio.";
    else if (correo.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      errores.email = "Ingrese un correo válido, por ejemplo nombre@institucion.cr.";
    }

    if (!contrasena.trim()) errores.password = "La contraseña es obligatoria.";
    else if (contrasena.length < 6 || contrasena.length > 100) {
      errores.password = "La contraseña debe tener entre 6 y 100 caracteres.";
    }

    if (!rol) errores.role = "Seleccione un rol.";
    else if (!ROLES.includes(rol)) errores.role = "El rol seleccionado no es válido.";

    return {
      valido: Object.keys(errores).length === 0,
      errores,
      datos: { name: nombre, email: correo, password: contrasena, role: rol },
    };
  }

  const API = { ROLES, validarUsuario };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SGARegistroValidaciones = API;
})(typeof window !== "undefined" ? window : globalThis);
