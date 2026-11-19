/* HU-GA-02: CA01 consulta correcta, CA02 no existe, CA03 cancelar sin modificaciones. */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const sesion = api.sesion();
  if (!sesion) { window.location.replace('index.html'); return; }
  const formulario = document.getElementById('formulario-consulta');
  const campo = document.getElementById('id-consulta');
  const errorId = document.getElementById('error-id-consulta');
  const aviso = document.getElementById('mensaje-consulta');
  const boton = document.getElementById('boton-consultar');
  const cancelar = document.getElementById('cancelar-consulta');
  const seccion = document.getElementById('seccion-detalle');
  const resumen = document.getElementById('resumen-activo');
  const detalle = document.getElementById('datos-detalle');
  let version = 0; // invalida el resultado tardio de una consulta cancelada

  const campos = [
    ['id', 'ID del activo'], ['assetNumber', 'Número de identificación'],
    ['description', 'Descripción'], ['brand', 'Marca'], ['model', 'Modelo'],
    ['serial', 'Serie'], ['price', 'Precio'], ['status', 'Estado'],
    ['location', 'Ubicación'], ['category', 'Categoría'],
    ['acquisitionMode', 'Modo de adquisición'],
    ['currentResponsible', 'Responsable actual'], ['decommissioned', 'Dado de baja'],
    ['notes', 'Observaciones'],
  ];
  const texto = (clave, valor) => {
    if (clave === 'decommissioned') return valor === true ? 'Sí' : 'No';
    return valor === null || valor === undefined || valor === '' ? 'No registrado' : String(valor);
  };
  function mensaje(valor = '', clase = '') {
    aviso.textContent = valor;
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiarVista() {
    seccion.hidden = true;
    resumen.textContent = '';
    detalle.textContent = '';
  }
  function mostrarActivo(activo) {
    limpiarVista();
    resumen.textContent = activo.assetNumber + ' · ' + activo.description;
    campos.forEach(([clave, titulo]) => {
      const contenedor = document.createElement('div');
      contenedor.className = 'detalle-item' + (['description','notes'].includes(clave) ? ' detalle-ancho' : '');
      const dt = document.createElement('dt');
      dt.textContent = titulo;
      const dd = document.createElement('dd');
      dd.textContent = texto(clave, activo[clave]);
      contenedor.appendChild(dt);
      contenedor.appendChild(dd);
      detalle.appendChild(contenedor);
    });
    seccion.hidden = false;
  }
  const validarId = valor => /^[1-9]\d*$/.test(String(valor).trim()) && Number.isSafeInteger(Number(valor));
  async function consultar(id) {
    const actual = ++version;
    limpiarVista();
    errorId.textContent = '';
    campo.removeAttribute('aria-invalid');
    if (!validarId(id)) {
      errorId.textContent = 'Ingrese un ID numérico entero y positivo.';
      campo.setAttribute('aria-invalid', 'true');
      campo.focus();
      mensaje('Revise el ID antes de consultar.', 'error');
      return;
    }
    boton.disabled = true;
    mensaje('Consultando activo...', 'informacion');
    try {
      const respuesta = await api.solicitud('/api/v1/assets/' + Number(id), { autenticado: true });
      if (actual !== version) return;
      if (!respuesta || respuesta.id !== Number(id)) throw new Error('El servidor devolvió un activo diferente al solicitado.');
      mostrarActivo(respuesta);
      mensaje('Información del activo consultada correctamente.', 'exito');
    } catch (error) {
      if (actual !== version) return;
      if (error.status === 401) {
        api.cerrarSesion(); window.location.replace('index.html'); return;
      }
      mensaje(error.status === 404 ? 'El activo con ID ' + Number(id) + ' no existe.' : error.message, 'error');
    } finally {
      if (actual === version) boton.disabled = false;
    }
  }
  formulario.addEventListener('submit', function (evento) {
    evento.preventDefault();
    consultar(campo.value);
  });
  cancelar.addEventListener('click', function () {
    ++version;
    boton.disabled = false;
    formulario.reset();
    limpiarVista();
    errorId.textContent = '';
    campo.removeAttribute('aria-invalid');
    mensaje('Consulta cancelada. No se realizó ningún cambio.', 'informacion');
  });
  campo.addEventListener('input', function () {
    errorId.textContent = '';
    campo.removeAttribute('aria-invalid');
  });
  if (sesion.role === 'SUPERUSER') {
    const registrar = document.getElementById('enlace-registrar');
    if (registrar) registrar.hidden = false;
    const actualizar = document.getElementById('enlace-actualizar');
    if (actualizar) actualizar.hidden = false;
  }

  async function cargarListado() {
    const avisoListado = document.getElementById('mensaje-listado');
    const cuerpo = document.getElementById('cuerpo-activos');
    const tabla = document.getElementById('tabla-activos');
    try {
      const activos = await api.solicitud('/api/v1/assets', { autenticado: true });
      if (!Array.isArray(activos)) throw new Error('El listado de activos tiene un formato inválido.');
      cuerpo.textContent = '';
      for (const activo of activos) {
        const fila = document.createElement('tr');
        for (const clave of ['id','assetNumber','description','status']) {
          const celda = document.createElement('td');
          celda.textContent = texto(clave, activo[clave]);
          fila.appendChild(celda);
        }
        const celda = document.createElement('td');
        const ver = document.createElement('button');
        ver.type = 'button';
        ver.className = 'consulta-ver';
        ver.textContent = 'Ver detalle';
        ver.addEventListener('click', () => {
          campo.value = String(activo.id);
          consultar(activo.id);
        });
        celda.appendChild(ver);
        if (sesion.role === 'SUPERUSER') {
          const editar = document.createElement('a');
          editar.href = 'actualizar-activo.html?id=' + encodeURIComponent(String(activo.id));
          editar.className = 'consulta-ver consulta-editar';
          editar.textContent = 'Actualizar';
          celda.appendChild(editar);
        }
        fila.appendChild(celda);
        cuerpo.appendChild(fila);
      }
      tabla.hidden = activos.length === 0;
      avisoListado.textContent = activos.length === 0 ? 'No hay activos registrados.' : 'Activos disponibles: ' + activos.length + '.';
    } catch (error) {
      if (error.status === 401) {
        api.cerrarSesion(); window.location.replace('index.html'); return;
      }
      avisoListado.textContent = 'No se pudo cargar el listado: ' + error.message;
    }
  }
  cargarListado();
})();
