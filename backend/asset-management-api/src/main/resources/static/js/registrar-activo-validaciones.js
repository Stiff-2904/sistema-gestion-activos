/* Validaciones de HU-GA-01 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const FORMATO_NUMERO = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
  const FORMATO_PRECIO = /^\d{1,10}(\.\d{1,2})?$/;

  function texto(valor) {
    return String(valor === undefined || valor === null ? "" : valor).trim();
  }

  function esIdValido(valor) {
    const numero = Number(valor);
    return /^\d+$/.test(valor) && Number.isSafeInteger(numero) && numero > 0;
  }

  function validarActivo(datos) {
    const numero = texto(datos.assetNumber);
    const descripcion = texto(datos.description);
    const marca = texto(datos.brand);
    const modelo = texto(datos.model);
    const serie = texto(datos.serial);
    const precio = texto(datos.price);
    const observaciones = texto(datos.notes);
    const errores = {};

    if (!numero) errores.assetNumber = "El numero de identificacion es obligatorio. Ejemplo: ACT-2026-0001.";
    else if (numero.length > 50) errores.assetNumber = "Maximo 50 caracteres.";
    else if (!FORMATO_NUMERO.test(numero)) {
      errores.assetNumber = "Use solo letras, numeros, punto, guion y barra, sin espacios. Ejemplo: ACT-2026-0001.";
    }

    if (!descripcion) errores.description = "La descripcion es obligatoria. Ejemplo: Computadora portatil de escritorio.";
    else if (descripcion.length > 500) errores.description = "Maximo 500 caracteres.";

    if (marca.length > 50) errores.brand = "Maximo 50 caracteres.";
    if (modelo.length > 50) errores.model = "Maximo 50 caracteres.";
    if (serie.length > 50) errores.serial = "Maximo 50 caracteres.";

    if (precio && !FORMATO_PRECIO.test(precio)) {
      errores.price = "Ingrese un monto valido con punto decimal y maximo 2 decimales. Ejemplo: 125000.50.";
    }

    const obligatorias = [
      ["statusId", "Seleccione el estado del activo."],
      ["locationId", "Seleccione la ubicacion del activo."],
      ["categoryId", "Seleccione la categoria del activo."],
      ["acquisitionModeId", "Seleccione el modo de adquisicion."],
    ];
    for (const [clave, mensaje] of obligatorias) {
      const valor = texto(datos[clave]);
      if (!valor) errores[clave] = mensaje;
      else if (!esIdValido(valor)) errores[clave] = "La opcion seleccionada no es valida.";
    }

    const responsable = texto(datos.currentResponsibleId);
    if (responsable && !esIdValido(responsable)) {
      errores.currentResponsibleId = "La opcion seleccionada no es valida.";
    }

    if (observaciones.length > 1000) errores.notes = "Maximo 1000 caracteres.";

    return {
      valido: Object.keys(errores).length === 0,
      errores,
      datos: {
        assetNumber: numero,
        description: descripcion,
        brand: marca || null,
        model: modelo || null,
        serial: serie || null,
        price: precio ? Number(precio) : null,
        statusId: Number(texto(datos.statusId)),
        locationId: Number(texto(datos.locationId)),
        categoryId: Number(texto(datos.categoryId)),
        acquisitionModeId: Number(texto(datos.acquisitionModeId)),
        currentResponsibleId: responsable ? Number(responsable) : null,
        notes: observaciones || null,
      },
    };
  }

  const API = { validarActivo };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.SGAActivoValidaciones = API;
})(typeof window !== "undefined" ? window : globalThis);
