/* Validaciones de HU-GU-04 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const ROLES = Object.freeze(["SUPERUSER", "INTERMEDIATE_USER", "BASIC_USER"]);

  function validateRoleChange(data) {
    const idText = String(data.id === undefined || data.id === null ? "" : data.id).trim();
    const id = Number(idText);
    const roleInput = String(data.role || "").trim();
    const errors = {};

    if (!idText) errors.id = "El ID del usuario es obligatorio.";
    else if (!Number.isSafeInteger(id) || id < 1) {
      errors.id = "Ingrese un ID de usuario valido (entero mayor a 0).";
    }

    // CA03: sin rol seleccionado no se puede actualizar
    if (!roleInput) errors.role = "Seleccione un rol para poder actualizar.";
    else if (!ROLES.includes(roleInput)) errors.role = "El rol seleccionado no es valido.";

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: { id, role: roleInput },
    };
  }

  const API = { ROLES, validateRoleChange };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.RoleChangeValidation = API;
})(typeof window !== "undefined" ? window : globalThis);
