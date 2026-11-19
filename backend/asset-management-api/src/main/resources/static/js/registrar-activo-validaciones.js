/* Validaciones de HU-GA-01 reutilizables y probables sin abrir navegador. */
(function (root) {
  "use strict";

  const ASSET_NUMBER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;
  const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

  function text(value) {
    return String(value === undefined || value === null ? "" : value).trim();
  }

  function isValidId(value) {
    const number = Number(value);
    return /^\d+$/.test(value) && Number.isSafeInteger(number) && number > 0;
  }

  function validateAsset(data) {
    const number = text(data.assetNumber);
    const description = text(data.description);
    const brand = text(data.brand);
    const model = text(data.model);
    const serial = text(data.serial);
    const price = text(data.price);
    const notes = text(data.notes);
    const errors = {};

    if (!number) errors.assetNumber = "El numero de identificacion es obligatorio. Ejemplo: ACT-2026-0001.";
    else if (number.length > 50) errors.assetNumber = "Maximo 50 caracteres.";
    else if (!ASSET_NUMBER_PATTERN.test(number)) {
      errors.assetNumber = "Use solo letras, numeros, punto, guion y barra, sin espacios. Ejemplo: ACT-2026-0001.";
    }

    if (!description) errors.description = "La descripcion es obligatoria. Ejemplo: Computadora portatil de escritorio.";
    else if (description.length > 500) errors.description = "Maximo 500 caracteres.";

    if (brand.length > 50) errors.brand = "Maximo 50 caracteres.";
    if (model.length > 50) errors.model = "Maximo 50 caracteres.";
    if (serial.length > 50) errors.serial = "Maximo 50 caracteres.";

    if (price && !PRICE_PATTERN.test(price)) {
      errors.price = "Ingrese un monto valido con punto decimal y maximo 2 decimales. Ejemplo: 125000.50.";
    }

    const requiredFields = [
      ["statusId", "Seleccione el estado del activo."],
      ["locationId", "Seleccione la ubicacion del activo."],
      ["categoryId", "Seleccione la categoria del activo."],
      ["acquisitionModeId", "Seleccione el modo de adquisicion."],
    ];
    for (const [key, message] of requiredFields) {
      const value = text(data[key]);
      if (!value) errors[key] = message;
      else if (!isValidId(value)) errors[key] = "La opcion seleccionada no es valida.";
    }

    const responsible = text(data.currentResponsibleId);
    if (responsible && !isValidId(responsible)) {
      errors.currentResponsibleId = "La opcion seleccionada no es valida.";
    }

    if (notes.length > 1000) errors.notes = "Maximo 1000 caracteres.";

    return {
      valid: Object.keys(errors).length === 0,
      errors,
      data: {
        assetNumber: number,
        description: description,
        brand: brand || null,
        model: model || null,
        serial: serial || null,
        price: price ? Number(price) : null,
        statusId: Number(text(data.statusId)),
        locationId: Number(text(data.locationId)),
        categoryId: Number(text(data.categoryId)),
        acquisitionModeId: Number(text(data.acquisitionModeId)),
        currentResponsibleId: responsible ? Number(responsible) : null,
        notes: notes || null,
      },
    };
  }

  const API = { validateAsset };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  else root.AssetValidation = API;
})(typeof window !== "undefined" ? window : globalThis);
