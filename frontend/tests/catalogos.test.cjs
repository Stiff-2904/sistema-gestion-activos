const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validarElemento } = require('../js/catalogos-validaciones.js');
const superusuario = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const intermedio = { token: 'jwt.int', role: 'INTERMEDIATE_USER', id: 2, name: 'Marta', email: 'marta@ctposa.ac.cr' };
const basico = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const lista = [
  { id: 1, name: 'Aula 1', detail: 'Edificio A', usageCount: 3, deletable: false },
  { id: 2, name: 'Aula 2', detail: 'Edificio A', usageCount: 0, deletable: true },
];
const esperar = () => new Promise(setImmediate);
const guardar = ui => ui.dom['formulario-catalogo'].handlers.submit({ preventDefault() {} });
// Cada fila tiene 4 celdas; la ultima guarda los botones Editar y Eliminar.
const botones = (ui, fila) => ui.dom['cuerpo-tabla'].children[fila].children[3].children;
// El servidor responde la lista a los GET y la respuesta indicada al resto de metodos.
function servidor(otra, elementos = lista) {
  return (ruta, opciones) => opciones.method === 'GET' ? jsonReply(200, elementos) : otra;
}
async function abrir(session = superusuario, response = servidor(jsonReply(200, {}))) {
  const ui = runPage('catalogos.js', { response, session });
  await esperar();
  return ui;
}

test('HU-GA-02 CA01 lista los elementos con la cantidad de activos que los usan', async () => {
  const ui = await abrir();
  assert.equal(ui.calls[0].route, '/api/v1/catalogs/ubicaciones');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer jwt.ok');
  assert.equal(ui.dom['cuerpo-tabla'].children.length, 2);
  assert.equal(ui.dom['cuerpo-tabla'].children[0].children[0].textContent, 'Aula 1');
  assert.equal(ui.dom['cuerpo-tabla'].children[0].children[2].textContent, '3');
  assert.equal(ui.dom['estado-lista'].hidden, true);
});
test('HU-GA-02 CA01 catalogo vacio muestra un aviso', async () => {
  const ui = await abrir(superusuario, servidor(jsonReply(200, {}), []));
  assert.equal(ui.dom['cuerpo-tabla'].children.length, 0);
  assert.match(ui.dom['estado-lista'].textContent, /No hay elementos/);
});
test('HU-GA-02 CA01 cambiar de pestana carga el otro catalogo', async () => {
  const ui = await abrir();
  ui.dom['pestana-estados'].handlers.click();
  await esperar();
  assert.equal(ui.calls.at(-1).route, '/api/v1/catalogs/estados');
  assert.equal(ui.dom['pestana-estados'].classList.contains('activa'), true);
  assert.equal(ui.dom['pestana-ubicaciones'].classList.contains('activa'), false);
});
test('HU-GA-02 CA02 crea un elemento valido y recarga la lista', async () => {
  const ui = await abrir(superusuario, servidor(jsonReply(201, { id: 9, name: 'Aula 9' })));
  ui.dom['nombre-catalogo'].value = '  Aula 9 ';
  ui.dom['detalle-catalogo'].value = 'Edificio B';
  await guardar(ui);
  await esperar();
  const post = ui.calls.find(c => c.options.method === 'POST');
  assert.equal(post.route, '/api/v1/catalogs/ubicaciones');
  assert.deepEqual(JSON.parse(post.options.body), { name: 'Aula 9', detail: 'Edificio B' });
  assert.match(ui.dom['mensaje-catalogo'].textContent, /creado correctamente/);
  assert.equal(ui.dom['mensaje-catalogo'].className, 'mensaje-formulario exito');
  assert.equal(ui.calls.filter(c => c.options.method === 'GET').length, 2);
});
test('HU-GA-02 CA03 campos obligatorios vacios no se envian', async () => {
  const ui = await abrir();
  await guardar(ui);
  assert.equal(ui.calls.filter(c => c.options.method === 'POST').length, 0);
  assert.match(ui.dom['error-nombre-catalogo'].textContent, /obligatorio/);
  assert.match(ui.dom['error-detalle-catalogo'].textContent, /obligatorio/);
});
test('HU-GA-02 CA03 nombre repetido muestra el error del servidor', async () => {
  const ui = await abrir(superusuario, servidor(jsonReply(400, { message: 'Ya existe un elemento con el nombre: Aula 1' })));
  ui.dom['nombre-catalogo'].value = 'Aula 1';
  ui.dom['detalle-catalogo'].value = 'Edificio A';
  await guardar(ui);
  await esperar();
  assert.match(ui.dom['mensaje-catalogo'].textContent, /Ya existe/);
  assert.equal(ui.dom['mensaje-catalogo'].className, 'mensaje-formulario error');
});
test('HU-GA-02 CA03 validaciones de longitud y detalle opcional', () => {
  assert.equal(validarElemento('estados', { name: 'x'.repeat(51), detail: '' }).errores.name !== undefined, true);
  assert.equal(validarElemento('categorias', { name: 'Libros', detail: '' }).valido, true);
  assert.equal(validarElemento('ubicaciones', { name: 'Aula', detail: '' }).valido, false);
  assert.equal(validarElemento('otro', { name: 'a', detail: 'b' }).valido, false);
});
test('HU-GA-02 CA04 elimina un elemento sin registros asociados tras confirmar', async () => {
  const ui = await abrir();
  const eliminar = botones(ui, 1)[1];
  assert.equal(eliminar.disabled, false);
  await eliminar.handlers.click();
  await esperar();
  const borrado = ui.calls.find(c => c.options.method === 'DELETE');
  assert.equal(borrado.route, '/api/v1/catalogs/ubicaciones/2');
  assert.equal(ui.confirmations.length, 1);
  assert.match(ui.dom['mensaje-catalogo'].textContent, /correctamente/);
});
test('HU-GA-02 CA04 si el usuario cancela la confirmacion no se elimina', async () => {
  const ui = runPage('catalogos.js', { response: servidor(jsonReply(200, {})), session: superusuario, confirmResult: false });
  await esperar();
  await botones(ui, 1)[1].handlers.click();
  assert.equal(ui.calls.filter(c => c.options.method === 'DELETE').length, 0);
});
test('HU-GA-02 CA05 el boton eliminar esta deshabilitado si el elemento esta en uso', async () => {
  const ui = await abrir();
  assert.equal(botones(ui, 0)[1].disabled, true);
  assert.match(botones(ui, 0)[1].attrs.title, /3 registro/);
});
test('HU-GA-02 CA05 si el servidor responde 409 se muestra el motivo', async () => {
  const ui = await abrir(superusuario, servidor(jsonReply(409, { message: "No se puede eliminar 'Aula 2' porque tiene 1 registro(s) asociado(s)" })));
  await botones(ui, 1)[1].handlers.click();
  await esperar();
  assert.match(ui.dom['mensaje-catalogo'].textContent, /No se puede eliminar/);
  assert.equal(ui.dom['mensaje-catalogo'].className, 'mensaje-formulario error');
});
test('HU-GA-02 CA06 el usuario basico vuelve al panel sin consultar el API', () => {
  const ui = runPage('catalogos.js', { response: servidor(jsonReply(200, {})), session: basico });
  assert.deepEqual(ui.history, [['replace', 'panel.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-02 CA06 sin sesion va al inicio de sesion', () => {
  const ui = runPage('catalogos.js', { response: servidor(jsonReply(200, {})) });
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GA-02 CA06 el usuario intermedio si puede administrar', async () => {
  const ui = await abrir(intermedio);
  assert.equal(ui.history.length, 0);
  assert.equal(ui.dom['cuerpo-tabla'].children.length, 2);
});
test('HU-GA-02 CA07 editar carga el elemento en el formulario y guarda con PUT', async () => {
  const ui = await abrir(superusuario, servidor(jsonReply(200, { id: 2, name: 'Aula 2B' })));
  botones(ui, 1)[0].handlers.click();
  assert.equal(ui.dom['nombre-catalogo'].value, 'Aula 2');
  assert.equal(ui.dom['boton-guardar-catalogo'].textContent, 'Guardar cambios');
  ui.dom['nombre-catalogo'].value = 'Aula 2B';
  await guardar(ui);
  await esperar();
  const put = ui.calls.find(c => c.options.method === 'PUT');
  assert.equal(put.route, '/api/v1/catalogs/ubicaciones/2');
  assert.deepEqual(JSON.parse(put.options.body), { name: 'Aula 2B', detail: 'Edificio A' });
});
