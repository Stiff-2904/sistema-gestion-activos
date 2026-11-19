/* Validaciones de HU-GU-02 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const ROLES = Object.freeze(["SUPERUSER", "INTERMEDIATE_USER", "BASIC_USER"]);

  function validateUser(data) {
    const name = String(data.name || "").trim();
    const emailInput = String(data.email || "").trim().toLowerCase();
    const passwordInput = String(data.password || "");
    const roleInput = String(data.role || "").trim();
    const errors = {};

    if (!name) errors.name = "El nombre es obligatorio.";
    else if (name.length > 100) errors.name = "Máximo 100 caracteres.";

    if (!emailInput) errors.email = "El correo es obligatorio.";
    else if (emailInput.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      errors.email = "Ingrese un correo válido, por ejemplo nombre@institucion.cr.";
    }

    if (!passwordInput.trim()) errors.password = "La contraseña es obligatoria.";
    else if (passwordInput.length < 6 || passwordInput.length > 100) {
      errors.password = "La contraseña debe tener entre 6 y 100 caracteres.";
    }

    if (!roleInput) errors.role = "Seleccione un rol.";
    else if (!ROLES.includes(roleInput)) errors.role = "El rol seleccionado no es válido.";

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: { name: name, email: emailInput, password: passwordInput, role: roleInput },
    };
  }

  const API = { ROLES, validateUser };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.UserRegistrationValidation = API;
})(typeof window !== "undefined" ? window : globalThis);
