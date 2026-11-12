/* Validaciones de HU-GU-04 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const ROLES = Object.freeze(["SUPERUSER", "INTERMEDIATE_USER", "BASIC_USER"]);

  function validarCambioRol(datos) {
    const textoId = String(datos.id === undefined || datos.id === null ? "" : datos.id).trim();
    const id = Number(textoId);
    const rol = String(datos.role || "").trim();
    const errores = {};

    if (!textoId) errores.id = "El ID del usuario es obligatorio.";
    else if (!Number.isSafeInteger(id) || id < 1) {
      errores.id = "Ingrese un ID de usuario valido (entero mayor a 0).";
    }

    // CA03: sin rol seleccionado no se puede actualizar
    if (!rol) errores.role = "Seleccione un rol para poder actualizar.";
    else if (!ROLES.includes(rol)) errores.role = "El rol seleccionado no es valido.";

    return {
      valido: Object.keys(errores).length === 0,
      errores,
      datos: { id, role: rol },
    };
  }

  const API = { ROLES, validarCambioRol };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SGARolValidaciones = API;
})(typeof window !== "undefined" ? window : globalThis);
