/* Validaciones de la administracion de catalogos, reutilizables y probables sin navegador. */
(function (root) {
  "use strict";

  // Configuracion de cada catalogo: ruta del API, limites y etiquetas del segundo campo.
  const CATALOGOS = {
    ubicaciones: { titulo: "Ubicaciones", singular: "ubicacion", maxNombre: 100, etiquetaDetalle: "Edificio", detalleObligatorio: true, maxDetalle: 100 },
    estados: { titulo: "Estados", singular: "estado", maxNombre: 50, etiquetaDetalle: "Descripcion", detalleObligatorio: false, maxDetalle: 500 },
    categorias: { titulo: "Categorias", singular: "categoria", maxNombre: 100, etiquetaDetalle: "Descripcion", detalleObligatorio: false, maxDetalle: 500 },
    "modos-adquisicion": { titulo: "Modos de adquisicion", singular: "modo de adquisicion", maxNombre: 100, etiquetaDetalle: "Descripcion", detalleObligatorio: false, maxDetalle: 500 },
  };

  function texto(valor) {
    return String(valor === undefined || valor === null ? "" : valor).trim();
  }

  function validarElemento(tipo, datos) {
    const config = CATALOGOS[tipo];
    if (!config) return { valido: false, errores: { tipo: "Catalogo no reconocido." }, datos: null };
    const nombre = texto(datos.name);
    const detalle = texto(datos.detail);
    const errores = {};

    if (!nombre) errores.name = "El nombre es obligatorio.";
    else if (nombre.length > config.maxNombre) errores.name = "El nombre no puede superar " + config.maxNombre + " caracteres.";

    if (!detalle && config.detalleObligatorio) errores.detail = "El campo " + config.etiquetaDetalle.toLowerCase() + " es obligatorio.";
    else if (detalle.length > config.maxDetalle) errores.detail = "El campo " + config.etiquetaDetalle.toLowerCase() + " no puede superar " + config.maxDetalle + " caracteres.";

    if (Object.keys(errores).length > 0) return { valido: false, errores, datos: null };
    return { valido: true, errores: {}, datos: { name: nombre, detail: detalle || null } };
  }

  const API = { CATALOGOS, validarElemento };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SGACatalogoValidaciones = API;
})(typeof window !== "undefined" ? window : globalThis);
