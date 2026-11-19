/* Validaciones de la administracion de catalogos, reutilizables y probables sin navegador. */
(function (root) {
  "use strict";

  // Configuracion de cada catalogo: ruta del API, limites y etiquetas del segundo campo.
  const CATALOG_TYPES = {
    ubicaciones: { title: "Ubicaciones", singular: "ubicacion", maxNameLength: 100, detailLabel: "Edificio", detailRequired: true, maxDetailLength: 100 },
    estados: { title: "Estados", singular: "estado", maxNameLength: 50, detailLabel: "Descripcion", detailRequired: false, maxDetailLength: 500 },
    categorias: { title: "Categorias", singular: "categoria", maxNameLength: 100, detailLabel: "Descripcion", detailRequired: false, maxDetailLength: 500 },
    "modos-adquisicion": { title: "Modos de adquisicion", singular: "modo de adquisicion", maxNameLength: 100, detailLabel: "Descripcion", detailRequired: false, maxDetailLength: 500 },
  };

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function validateItem(type, data) {
    const config = CATALOG_TYPES[type];
    if (!config) return { valid: false, errors: { type: "Catalogo no reconocido." }, data: null };
    const name = text(data.name);
    const detail = text(data.detail);
    const errors = {};

    if (!name) errors.name = "El nombre es obligatorio.";
    else if (name.length > config.maxNameLength) errors.name = "El nombre no puede superar " + config.maxNameLength + " caracteres.";

    if (!detail && config.detailRequired) errors.detail = "El campo " + config.detailLabel.toLowerCase() + " es obligatorio.";
    else if (detail.length > config.maxDetailLength) errors.detail = "El campo " + config.detailLabel.toLowerCase() + " no puede superar " + config.maxDetailLength + " caracteres.";

    if (Object.keys(errors).length > 0) return { valid: false, errors, data: null };
    return { valid: true, errors: {}, data: { name: name, detail: detail || null } };
  }

  const API = { CATALOG_TYPES, validateItem };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.CatalogValidation = API;
})(typeof window !== "undefined" ? window : globalThis);
