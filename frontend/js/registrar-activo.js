/* HU-GA-01: POST autenticado, validaciones, permisos y cancelacion sin cambios. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const formulario = document.getElementById('formulario-activo');
  const aviso = document.getElementById('mensaje-activo');
  const boton = document.getElementById('boton-registrar-activo');
  const cancelar = document.getElementById('cancelar-activo');

  // clave del formulario -> id del campo en la pagina
  const CAMPOS = {
    assetNumber: 'numero-activo',
    description: 'descripcion-activo',
    brand: 'marca-activo',
    model: 'modelo-activo',
    serial: 'serie-activo',
    price: 'precio-activo',
    statusId: 'estado-activo',
    locationId: 'ubicacion-activo',
    categoryId: 'categoria-activo',
    acquisitionModeId: 'modo-activo',
    currentResponsibleId: 'responsable-activo',
    notes: 'observaciones-activo',
  };
  // lista del catalogo -> campo que se llena y nombre para el mensaje de lista vacia
  const LISTAS = {
    statuses: { clave: 'statusId', nombre: 'estados', obligatoria: true },
    locations: { clave: 'locationId', nombre: 'ubicaciones', obligatoria: true },
    categories: { clave: 'categoryId', nombre: 'categorias', obligatoria: true },
    acquisitionModes: { clave: 'acquisitionModeId', nombre: 'modos de adquisicion', obligatoria: true },
    responsibles: { clave: 'currentResponsibleId', nombre: 'responsables', obligatoria: false },
  };
  const campos = {};
  for (const [clave, id] of Object.entries(CAMPOS)) campos[clave] = document.getElementById(id);

  // Sin sesion va al login; con sesion pero sin rol SUPERUSER vuelve a la pantalla principal.
  const sesion = api.sesion();
  if (!sesion) {
    window.location.replace('index.html');
    return;
  }
  if (sesion.role !== 'SUPERUSER') {
    window.location.replace('panel.html');
    return;
  }

  function mensaje(texto = '', clase = '') {
    aviso.textContent = texto;
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiar() {
    mensaje();
    for (const [clave, campo] of Object.entries(campos)) {
      campo.classList.remove('campo-invalido');
      campo.removeAttribute('aria-invalid');
      document.getElementById('error-' + CAMPOS[clave]).textContent = '';
    }
  }
  for (const campo of Object.values(campos)) {
    campo.addEventListener('input', limpiar);
    campo.addEventListener('change', limpiar);
  }

  function llenarLista(select, elementos) {
    for (const elemento of elementos) {
      const opcion = document.createElement('option');
      opcion.value = String(elemento.id);
      opcion.textContent = elemento.name;
      select.appendChild(opcion);
    }
  }

  // Las listas desplegables salen de la base de datos, no estan escritas en la pagina.
  async function cargarCatalogo() {
    try {
      const catalogo = await api.solicitud('/api/v1/assets/catalog', { autenticado: true });
      const vacias = [];
      for (const [lista, destino] of Object.entries(LISTAS)) {
        const elementos = Array.isArray(catalogo[lista]) ? catalogo[lista] : [];
        llenarLista(campos[destino.clave], elementos);
        if (destino.obligatoria && elementos.length === 0) vacias.push(destino.nombre);
      }
      if (vacias.length > 0) {
        mensaje('No hay ' + vacias.join(', ') + ' registrados en el sistema. Agreguelos en la base de datos antes de registrar activos.', 'error');
      }
    } catch (error) {
      if (error.status === 401) {
        api.cerrarSesion();
        window.location.replace('index.html');
        return;
      }
      mensaje(error.message, 'error');
    }
  }

  formulario.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    if (boton.disabled) return;
    limpiar();
    const datos = Object.fromEntries(
      Object.entries(campos).map(([clave, campo]) => [clave, campo.value]));
    const resultado = window.SGAActivoValidaciones.validarActivo(datos);
    if (!resultado.valido) {
      for (const [clave, texto] of Object.entries(resultado.errores)) {
        campos[clave].classList.add('campo-invalido');
        campos[clave].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + CAMPOS[clave]).textContent = texto;
      }
      campos[Object.keys(resultado.errores)[0]].focus();
      mensaje('Revise los campos senalados antes de continuar.', 'error');
      return;
    }

    boton.disabled = true;
    cancelar.disabled = true; // No ofrecer cancelacion cuando el POST ya ha comenzado.
    mensaje('Registrando activo...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/assets', {
        method: 'POST', body: resultado.datos, autenticado: true,
      });
      if (!respuesta || !respuesta.id || respuesta.assetNumber !== resultado.datos.assetNumber) {
        throw new Error('El servidor no confirmo correctamente el registro.');
      }
      formulario.reset();
      mensaje('Activo ' + respuesta.assetNumber + ' registrado correctamente con ID ' + respuesta.id + '.', 'exito');
    } catch (error) {
      if (error.status === 401) {
        api.cerrarSesion();
        window.location.replace('index.html');
        return;
      }
      mensaje(error.message, 'error');
    } finally { boton.disabled = false; cancelar.disabled = false; }
  });

  cancelar.addEventListener('click', function () {
    if (cancelar.disabled) return;
    // CA05: cancelar descarta los datos y jamas ejecuta POST.
    formulario.reset();
    limpiar();
    window.location.assign('panel.html');
  });

  cargarCatalogo();
})();
