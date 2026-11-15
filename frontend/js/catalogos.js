/* Administracion de catalogos: listar, crear, editar y eliminar (solo sin registros asociados). */
(function () {
  'use strict';
  const api = window.SGAAPI;
  const validaciones = window.SGACatalogoValidaciones;
  const CATALOGOS = validaciones.CATALOGOS;

  // Sin sesion va al login; el usuario basico vuelve al panel porque no tiene permiso.
  const sesion = api.sesion();
  if (!sesion) { window.location.replace('index.html'); return; }
  if (sesion.role === 'BASIC_USER') { window.location.replace('panel.html'); return; }

  const formulario = document.getElementById('formulario-catalogo');
  const campoNombre = document.getElementById('nombre-catalogo');
  const campoDetalle = document.getElementById('detalle-catalogo');
  const etiquetaDetalle = document.getElementById('etiqueta-detalle');
  const errorNombre = document.getElementById('error-nombre-catalogo');
  const errorDetalle = document.getElementById('error-detalle-catalogo');
  const botonGuardar = document.getElementById('boton-guardar-catalogo');
  const botonCancelar = document.getElementById('cancelar-catalogo');
  const aviso = document.getElementById('mensaje-catalogo');
  const titulo = document.getElementById('titulo-catalogo');
  const cuerpo = document.getElementById('cuerpo-tabla');
  const estadoLista = document.getElementById('estado-lista');

  // Ejemplos que se muestran dentro de los campos segun el catalogo activo
  const EJEMPLOS = {
    ubicaciones: { nombre: 'Ejemplo: Aula 12', detalle: 'Ejemplo: Edificio B' },
    estados: { nombre: 'Ejemplo: Reparacion', detalle: 'Ejemplo: Requiere mantenimiento antes de usarse' },
    categorias: { nombre: 'Ejemplo: Material deportivo', detalle: 'Ejemplo: Balones, redes y conos' },
    'modos-adquisicion': { nombre: 'Ejemplo: Convenio', detalle: 'Ejemplo: Recibido mediante convenio institucional' },
  };

  let tipoActual = 'ubicaciones';
  let idEdicion = null;

  function mensaje(texto, clase) {
    aviso.textContent = texto || '';
    aviso.className = 'mensaje-formulario' + (clase ? ' ' + clase : '');
  }
  function limpiarErrores() {
    for (const [campo, error] of [[campoNombre, errorNombre], [campoDetalle, errorDetalle]]) {
      campo.classList.remove('campo-invalido');
      campo.removeAttribute('aria-invalid');
      error.textContent = '';
    }
  }
  function marcar(campo, error, texto) {
    error.textContent = texto;
    campo.classList.add('campo-invalido');
    campo.setAttribute('aria-invalid', 'true');
  }

  // Deja el formulario en modo crear, con las etiquetas del catalogo activo.
  function prepararFormulario() {
    const config = CATALOGOS[tipoActual];
    idEdicion = null;
    formulario.reset();
    limpiarErrores();
    titulo.textContent = config.titulo;
    etiquetaDetalle.textContent = config.etiquetaDetalle + (config.detalleObligatorio ? ' *' : '');
    campoNombre.setAttribute('placeholder', EJEMPLOS[tipoActual].nombre);
    campoDetalle.setAttribute('placeholder', EJEMPLOS[tipoActual].detalle);
    botonGuardar.textContent = 'Agregar ' + config.singular;
    botonCancelar.hidden = true;
  }

  function celda(texto) {
    const td = document.createElement('td');
    td.textContent = texto;
    return td;
  }

  function filaDe(elemento) {
    const fila = document.createElement('tr');
    fila.appendChild(celda(elemento.name));
    fila.appendChild(celda(elemento.detail || '-'));
    fila.appendChild(celda(String(elemento.usageCount)));

    const acciones = document.createElement('td');
    const editar = document.createElement('button');
    editar.type = 'button';
    editar.className = 'boton-consultar boton-tabla';
    editar.textContent = 'Editar';
    editar.addEventListener('click', () => iniciarEdicion(elemento));

    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.className = 'boton-eliminar boton-tabla';
    eliminar.textContent = 'Eliminar';
    if (!elemento.deletable) {
      eliminar.disabled = true;
      eliminar.setAttribute('title', 'En uso por ' + elemento.usageCount + ' registro(s)');
    }
    eliminar.addEventListener('click', () => eliminarElemento(elemento));

    acciones.appendChild(editar);
    acciones.appendChild(eliminar);
    fila.appendChild(acciones);
    return fila;
  }

  async function cargarLista() {
    estadoLista.textContent = 'Cargando...';
    estadoLista.hidden = false;
    cuerpo.textContent = '';
    try {
      const elementos = await api.solicitud('/api/v1/catalogs/' + tipoActual, { autenticado: true });
      cuerpo.textContent = '';
      if (!Array.isArray(elementos) || elementos.length === 0) {
        estadoLista.textContent = 'No hay elementos registrados en este catalogo.';
        return;
      }
      for (const elemento of elementos) cuerpo.appendChild(filaDe(elemento));
      estadoLista.hidden = true;
    } catch (error) {
      if (manejarSesion(error)) return;
      estadoLista.textContent = error.message;
    }
  }

  // Sesion vencida o sin permiso: se vuelve al inicio.
  function manejarSesion(error) {
    if (error.status === 401) {
      api.cerrarSesion();
      window.location.replace('index.html');
      return true;
    }
    if (error.status === 403) {
      window.location.replace('panel.html');
      return true;
    }
    return false;
  }

  function iniciarEdicion(elemento) {
    limpiarErrores();
    mensaje('');
    idEdicion = elemento.id;
    campoNombre.value = elemento.name;
    campoDetalle.value = elemento.detail || '';
    botonGuardar.textContent = 'Guardar cambios';
    botonCancelar.hidden = false;
    campoNombre.focus();
  }

  async function eliminarElemento(elemento) {
    if (!window.confirm('Se eliminara "' + elemento.name + '". Esta accion no se puede deshacer. Desea continuar?')) return;
    mensaje('');
    try {
      const respuesta = await api.solicitud('/api/v1/catalogs/' + tipoActual + '/' + elemento.id,
        { method: 'DELETE', autenticado: true });
      if (idEdicion === elemento.id) prepararFormulario();
      mensaje(respuesta.message || 'Elemento eliminado correctamente.', 'exito');
      await cargarLista();
    } catch (error) {
      if (manejarSesion(error)) return;
      mensaje(error.message, 'error');
      await cargarLista();
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    limpiarErrores();
    mensaje('');
    const resultado = validaciones.validarElemento(tipoActual, { name: campoNombre.value, detail: campoDetalle.value });
    if (!resultado.valido) {
      if (resultado.errores.name) marcar(campoNombre, errorNombre, resultado.errores.name);
      if (resultado.errores.detail) marcar(campoDetalle, errorDetalle, resultado.errores.detail);
      return;
    }
    const edicion = idEdicion !== null;
    botonGuardar.disabled = true;
    try {
      await api.solicitud('/api/v1/catalogs/' + tipoActual + (edicion ? '/' + idEdicion : ''),
        { method: edicion ? 'PUT' : 'POST', body: resultado.datos, autenticado: true });
      prepararFormulario();
      mensaje(edicion ? 'Elemento actualizado correctamente.' : 'Elemento creado correctamente.', 'exito');
      await cargarLista();
    } catch (error) {
      if (manejarSesion(error)) return;
      mensaje(error.message, 'error');
    } finally {
      botonGuardar.disabled = false;
    }
  }

  function seleccionar(tipo) {
    tipoActual = tipo;
    for (const clave of Object.keys(CATALOGOS)) {
      const pestana = document.getElementById('pestana-' + clave);
      pestana.classList.remove('activa');
      pestana.setAttribute('aria-selected', 'false');
    }
    const activa = document.getElementById('pestana-' + tipo);
    activa.classList.add('activa');
    activa.setAttribute('aria-selected', 'true');
    mensaje('');
    prepararFormulario();
    return cargarLista();
  }

  for (const clave of Object.keys(CATALOGOS)) {
    document.getElementById('pestana-' + clave).addEventListener('click', () => seleccionar(clave));
  }
  formulario.addEventListener('submit', guardar);
  botonCancelar.addEventListener('click', () => { prepararFormulario(); mensaje(''); });
  seleccionar('ubicaciones');
})();