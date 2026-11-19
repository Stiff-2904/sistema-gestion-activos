/* HU-GA-03: CA01 actualizacion PUT, CA02 obligatorios, CA03 formato, CA04 cancelar. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api.sesion();
  if (!sesion) { window.location.replace('index.html'); return; }
  if (sesion.role !== 'SUPERUSER') { window.location.replace('panel.html'); return; }

  const formularioBuscar = document.getElementById('formulario-buscar-edicion');
  const campoId = document.getElementById('id-edicion');
  const errorId = document.getElementById('error-id-edicion');
  const mensajeCarga = document.getElementById('mensaje-carga-edicion');
  const botonCargar = document.getElementById('boton-cargar-edicion');
  const seccion = document.getElementById('seccion-edicion');
  const tituloId = document.getElementById('id-activo-cargado');
  const formulario = document.getElementById('formulario-edicion');
  const aviso = document.getElementById('mensaje-edicion');
  const guardar = document.getElementById('boton-guardar-edicion');
  const cancelar = document.getElementById('cancelar-edicion');
  const avisoListado = document.getElementById('mensaje-listado-edicion');
  const cuerpoListado = document.getElementById('cuerpo-edicion-activos');
  const tablaListado = document.getElementById('tabla-edicion-activos');
  const CAMPOS = {
    assetNumber: 'numero-activo', description: 'descripcion-activo', brand: 'marca-activo',
    model: 'modelo-activo', serial: 'serie-activo', price: 'precio-activo',
    statusId: 'estado-activo', locationId: 'ubicacion-activo', categoryId: 'categoria-activo',
    acquisitionModeId: 'modo-activo', currentResponsibleId: 'responsable-activo', notes: 'observaciones-activo',
  };
  const LISTAS = {
    statuses: 'statusId', locations: 'locationId', categories: 'categoryId',
    acquisitionModes: 'acquisitionModeId', responsibles: 'currentResponsibleId',
  };
  const campos = Object.fromEntries(Object.entries(CAMPOS).map(([k, id]) => [k, document.getElementById(id)]));
  let idActual = null;
  let version = 0;
  let enviando = false;
  let catalogoListo = false;
  let promesaCatalogo = null;
  let versionListado = 0;

  function mensaje(elemento, texto = '', clase = '') {
    elemento.textContent = texto;
    elemento.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiarErrores() {
    for (const [clave, campo] of Object.entries(campos)) {
      campo.classList.remove('campo-invalido');
      campo.removeAttribute('aria-invalid');
      document.getElementById('error-' + CAMPOS[clave]).textContent = '';
    }
  }
  Object.values(campos).forEach(campo => {
    campo.addEventListener('input', limpiarErrores);
    campo.addEventListener('change', limpiarErrores);
  });
  function datosEnFormulario(activo) {
    for (const [clave, campo] of Object.entries(campos)) {
      campo.value = activo[clave] === null || activo[clave] === undefined ? '' : String(activo[clave]);
    }
  }
  function esIdValido(valor) {
    return /^[1-9]\d*$/.test(String(valor).trim()) && Number.isSafeInteger(Number(valor));
  }

  function cargarCatalogo() {
    // Compartir la misma solicitud si se seleccionan varios activos con rapidez.
    if (!promesaCatalogo) {
      promesaCatalogo = api.solicitud('/api/v1/assets/catalog', { autenticado: true })
        .then(catalogo => {
          for (const lista of Object.keys(LISTAS)) {
            if (!Array.isArray(catalogo[lista])) throw new Error('No fue posible obtener el catálogo de ' + lista + '.');
          }
          for (const [lista, clave] of Object.entries(LISTAS)) {
            for (const entrada of catalogo[lista]) {
              const opcion = document.createElement('option');
              opcion.value = String(entrada.id);
              opcion.textContent = entrada.name;
              campos[clave].appendChild(opcion);
            }
          }
          catalogoListo = true;
        })
        .catch(error => { promesaCatalogo = null; throw error; });
    }
    return promesaCatalogo;
  }

  function destacarSeleccion() {
    for (const fila of cuerpoListado.children) {
      const seleccionada = idActual !== null && Number(fila.dataset.assetId) === idActual;
      fila.classList.toggle('consulta-fila-seleccionada', seleccionada);
      const accion = fila.children[4] && fila.children[4].children[0];
      if (accion) accion.setAttribute('aria-pressed', String(seleccionada));
    }
  }

  async function cargarListado() {
    const actual = ++versionListado;
    avisoListado.textContent = 'Actualizando listado de activos...';
    try {
      const activos = await api.solicitud('/api/v1/assets', { autenticado: true });
      if (actual !== versionListado) return;
      if (!Array.isArray(activos)) throw new Error('El listado de activos tiene un formato inválido.');
      cuerpoListado.textContent = '';
      for (const activo of activos) {
        const fila = document.createElement('tr');
        fila.dataset.assetId = String(activo.id);
        for (const clave of ['id', 'assetNumber', 'description', 'status']) {
          const celda = document.createElement('td');
          const valor = activo[clave];
          celda.textContent = valor === null || valor === undefined || valor === '' ? 'No registrado' : String(valor);
          fila.appendChild(celda);
        }
        const acciones = document.createElement('td');
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'consulta-ver consulta-editar';
        boton.textContent = 'Actualizar';
        boton.setAttribute('aria-label', 'Actualizar activo ' + String(activo.assetNumber));
        boton.addEventListener('click', () => {
          if (enviando) return;
          campoId.value = String(activo.id);
          cargarActivo(activo.id, true);
        });
        acciones.appendChild(boton);
        fila.appendChild(acciones);
        cuerpoListado.appendChild(fila);
      }
      tablaListado.hidden = activos.length === 0;
      avisoListado.textContent = activos.length ? 'Activos disponibles: ' + activos.length + '.' : 'No hay activos registrados.';
      destacarSeleccion();
    } catch (error) {
      if (actual !== versionListado) return;
      if (error.status === 401) { api.cerrarSesion(); window.location.replace('index.html'); return; }
      avisoListado.textContent = 'No se pudo cargar el listado: ' + error.message;
    }
  }

  async function cargarActivo(valor, desdeListado = false) {
    if (enviando) return;
    const actual = ++version;
    idActual = null;
    destacarSeleccion();
    seccion.hidden = true;
    mensaje(aviso);
    limpiarErrores();
    errorId.textContent = '';
    if (!esIdValido(valor)) {
      errorId.textContent = 'Ingrese un ID entero y positivo.';
      campoId.focus();
      mensaje(mensajeCarga, 'Revise el ID del activo.', 'error');
      return;
    }
    botonCargar.disabled = true;
    mensaje(mensajeCarga, 'Cargando datos del activo...', 'informacion');
    try {
      if (!catalogoListo) await cargarCatalogo();
      const respuesta = await api.solicitud('/api/v1/assets/' + Number(valor), { autenticado: true });
      if (actual !== version) return;
      if (!respuesta || respuesta.id !== Number(valor)) throw new Error('El servidor devolvió un activo inesperado.');
      idActual = respuesta.id;
      datosEnFormulario(respuesta);
      destacarSeleccion();
      tituloId.textContent = '· ID ' + respuesta.id;
      seccion.hidden = false;
      mensaje(mensajeCarga, 'Activo cargado. Puede editar los campos y guardar.', 'exito');
      if (desdeListado && typeof seccion.scrollIntoView === 'function') {
        seccion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      if (actual !== version) return;
      if (error.status === 401) { api.cerrarSesion(); window.location.replace('index.html'); return; }
      mensaje(mensajeCarga, error.status === 404 ? 'El activo con ID ' + Number(valor) + ' no existe.' : error.message, 'error');
    } finally {
      if (actual === version) botonCargar.disabled = false;
    }
  }

  formularioBuscar.addEventListener('submit', evento => {
    evento.preventDefault();
    cargarActivo(campoId.value);
  });

  formulario.addEventListener('submit', async evento => {
    evento.preventDefault();
    if (enviando || idActual === null) return;
    limpiarErrores();
    const datos = Object.fromEntries(Object.entries(campos).map(([clave, campo]) => [clave, campo.value]));
    const resultado = window.SGAActivoValidaciones.validarActivo(datos);
    if (!resultado.valido) {
      for (const [clave, texto] of Object.entries(resultado.errores)) {
        campos[clave].classList.add('campo-invalido');
        campos[clave].setAttribute('aria-invalid', 'true');
        document.getElementById('error-' + CAMPOS[clave]).textContent = texto;
      }
      campos[Object.keys(resultado.errores)[0]].focus();
      mensaje(aviso, 'Revise los campos señalados. No se enviaron cambios.', 'error');
      return;
    }
    enviando = true;
    guardar.disabled = true;
    cancelar.disabled = true; // Evita cancelar despues de iniciado el PUT.
    botonCargar.disabled = true;
    mensaje(aviso, 'Guardando actualización...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/assets/' + idActual, {
        method: 'PUT', body: resultado.datos, autenticado: true,
      });
      if (!respuesta || respuesta.id !== idActual || respuesta.assetNumber !== resultado.datos.assetNumber) {
        throw new Error('El servidor no confirmó la actualización correctamente.');
      }
      datosEnFormulario(respuesta);
      await cargarListado();
      mensaje(aviso, 'Activo ' + respuesta.assetNumber + ' actualizado correctamente. Cambio registrado en auditoría.', 'exito');
    } catch (error) {
      if (error.status === 401) { api.cerrarSesion(); window.location.replace('index.html'); return; }
      mensaje(aviso, error.message, 'error');
    } finally {
      enviando = false;
      guardar.disabled = false;
      cancelar.disabled = false;
      botonCargar.disabled = false;
    }
  });

  cancelar.addEventListener('click', () => {
    if (enviando) return;
    ++version;
    idActual = null;
    formulario.reset();
    campoId.value = '';
    errorId.textContent = '';
    limpiarErrores();
    destacarSeleccion();
    seccion.hidden = true;
    mensaje(aviso);
    mensaje(mensajeCarga, 'Actualización cancelada. No se guardaron cambios.', 'informacion');
    // Se mantiene el listado visible para seleccionar otro activo sin salir.
  });

  // Cuando se seleccionó «Actualizar» desde el listado, precargar el ID.
  const query = window.location && typeof window.location.search === 'string'
    ? new URLSearchParams(window.location.search).get('id') : null;
  cargarListado();
  if (query) { campoId.value = query; cargarActivo(query); }
})();
