const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const { validateItem } = require('../js/catalog-validations.js');
const isSuperuser = { token: 'jwt.ok', role: 'SUPERUSER', id: 1, name: 'Directora', email: 'directora@ctposa.ac.cr' };
const intermediate = { token: 'jwt.int', role: 'INTERMEDIATE_USER', id: 2, name: 'Marta', email: 'marta@ctposa.ac.cr' };
const basic = { token: 'jwt.basico', role: 'BASIC_USER', id: 5, name: 'Luis', email: 'luis@ctposa.ac.cr' };
const list = [
  { id: 1, name: 'Aula 1', detail: 'Edificio A', usageCount: 3, deletable: false },
  { id: 2, name: 'Aula 2', detail: 'Edificio A', usageCount: 0, deletable: true },
];
const wait = () => new Promise(setImmediate);
const save = ui => ui.dom['form-catalog'].handlers.submit({ preventDefault() {} });
// Cada fila tiene 4 celdas; la ultima guarda los botones Editar y Eliminar.
const buttons = (ui, row) => ui.dom['body-table'].children[row].children[3].children;
// El servidor responde la lista a los GET y la respuesta indicada al resto de metodos.
function server(otra, items = list) {
  return (route, options) => options.method === 'GET' ? jsonReply(200, items) : otra;
}
async function openButton(session = isSuperuser, response = server(jsonReply(200, {}))) {
  const ui = runPage('catalogs.js', { response, session });
  await wait();
  return ui;
}

test('HU-GA-02 CA01 lista los elementos con la cantidad de activos que los usan', async () => {
  const ui = await openButton();
  assert.equal(ui.calls[0].route, '/api/v1/catalogs/ubicaciones');
  assert.equal(ui.calls[0].options.headers.Authorization, 'Bearer jwt.ok');
  assert.equal(ui.dom['body-table'].children.length, 2);
  assert.equal(ui.dom['body-table'].children[0].children[0].textContent, 'Aula 1');
  assert.equal(ui.dom['body-table'].children[0].children[2].textContent, '3');
  assert.equal(ui.dom['list-status'].hidden, true);
});
test('HU-GA-02 CA01 catalogo vacio muestra un aviso', async () => {
  const ui = await openButton(isSuperuser, server(jsonReply(200, {}), []));
  assert.equal(ui.dom['body-table'].children.length, 0);
  assert.match(ui.dom['list-status'].textContent, /No hay elementos/);
});
test('HU-GA-02 CA01 cambiar de pestana carga el otro catalogo', async () => {
  const ui = await openButton();
  ui.dom['tab-statuses'].handlers.click();
  await wait();
  assert.equal(ui.calls.at(-1).route, '/api/v1/catalogs/estados');
  assert.equal(ui.dom['tab-statuses'].classList.contains('tab-active'), true);
  assert.equal(ui.dom['tab-locations'].classList.contains('tab-active'), false);
});
test('HU-GA-02 CA02 crea un elemento valido y recarga la lista', async () => {
  const ui = await openButton(isSuperuser, server(jsonReply(201, { id: 9, name: 'Aula 9' })));
  ui.dom['name-catalog'].value = '  Aula 9 ';
  ui.dom['detail-catalog'].value = 'Edificio B';
  await save(ui);
  await wait();
  const post = ui.calls.find(c => c.options.method === 'POST');
  assert.equal(post.route, '/api/v1/catalogs/ubicaciones');
  assert.deepEqual(JSON.parse(post.options.body), { name: 'Aula 9', detail: 'Edificio B' });
  assert.match(ui.dom['message-catalog'].textContent, /creado correctamente/);
  assert.equal(ui.dom['message-catalog'].className, 'form-message success');
  assert.equal(ui.calls.filter(c => c.options.method === 'GET').length, 2);
});
test('HU-GA-02 CA03 campos obligatorios vacios no se envian', async () => {
  const ui = await openButton();
  await save(ui);
  assert.equal(ui.calls.filter(c => c.options.method === 'POST').length, 0);
  assert.match(ui.dom['error-name-catalog'].textContent, /obligatorio/);
  assert.match(ui.dom['error-detail-catalog'].textContent, /obligatorio/);
});
test('HU-GA-02 CA03 nombre repetido muestra el error del servidor', async () => {
  const ui = await openButton(isSuperuser, server(jsonReply(400, { message: 'Ya existe un elemento con el nombre: Aula 1' })));
  ui.dom['name-catalog'].value = 'Aula 1';
  ui.dom['detail-catalog'].value = 'Edificio A';
  await save(ui);
  await wait();
  assert.match(ui.dom['message-catalog'].textContent, /Ya existe/);
  assert.equal(ui.dom['message-catalog'].className, 'form-message error');
});
test('HU-GA-02 CA03 validaciones de longitud y detalle opcional', () => {
  assert.equal(validateItem('estados', { name: 'x'.repeat(51), detail: '' }).errors.name !== undefined, true);
  assert.equal(validateItem('categorias', { name: 'Libros', detail: '' }).valid, true);
  assert.equal(validateItem('ubicaciones', { name: 'Aula', detail: '' }).valid, false);
  assert.equal(validateItem('otro', { name: 'a', detail: 'b' }).valid, false);
});
test('HU-GA-02 CA04 elimina un elemento sin registros asociados tras confirmar', async () => {
  const ui = await openButton();
  const remove = buttons(ui, 1)[1];
  assert.equal(remove.disabled, false);
  await remove.handlers.click();
  await wait();
  const deletionRequest = ui.calls.find(c => c.options.method === 'DELETE');
  assert.equal(deletionRequest.route, '/api/v1/catalogs/ubicaciones/2');
  assert.equal(ui.confirmations.length, 1);
  assert.match(ui.dom['message-catalog'].textContent, /correctamente/);
});
test('HU-GA-02 CA04 si el usuario cancela la confirmacion no se elimina', async () => {
  const ui = runPage('catalogs.js', { response: server(jsonReply(200, {})), session: isSuperuser, confirmResult: false });
  await wait();
  await buttons(ui, 1)[1].handlers.click();
  assert.equal(ui.calls.filter(c => c.options.method === 'DELETE').length, 0);
});
test('HU-GA-02 CA05 el boton eliminar esta deshabilitado si el elemento esta en uso', async () => {
  const ui = await openButton();
  assert.equal(buttons(ui, 0)[1].disabled, true);
  assert.match(buttons(ui, 0)[1].attrs.title, /3 registro/);
});
test('HU-GA-02 CA05 si el servidor responde 409 se muestra el motivo', async () => {
  const ui = await openButton(isSuperuser, server(jsonReply(409, { message: "No se puede eliminar 'Aula 2' porque tiene 1 registro(s) asociado(s)" })));
  await buttons(ui, 1)[1].handlers.click();
  await wait();
  assert.match(ui.dom['message-catalog'].textContent, /No se puede eliminar/);
  assert.equal(ui.dom['message-catalog'].className, 'form-message error');
});
test('HU-GA-02 CA06 el usuario basico vuelve al panel sin consultar el API', () => {
  const ui = runPage('catalogs.js', { response: server(jsonReply(200, {})), session: basic });
  assert.deepEqual(ui.history, [['replace', 'dashboard.html']]);
  assert.equal(ui.calls.length, 0);
});
test('HU-GA-02 CA06 sin sesion va al inicio de sesion', () => {
  const ui = runPage('catalogs.js', { response: server(jsonReply(200, {})) });
  assert.deepEqual(ui.history, [['replace', 'index.html']]);
});
test('HU-GA-02 CA06 el usuario intermedio si puede administrar', async () => {
  const ui = await openButton(intermediate);
  assert.equal(ui.history.length, 0);
  assert.equal(ui.dom['body-table'].children.length, 2);
});
test('HU-GA-02 CA07 editar carga el elemento en el formulario y guarda con PUT', async () => {
  const ui = await openButton(isSuperuser, server(jsonReply(200, { id: 2, name: 'Aula 2B' })));
  buttons(ui, 1)[0].handlers.click();
  assert.equal(ui.dom['name-catalog'].value, 'Aula 2');
  assert.equal(ui.dom['button-save-catalog'].textContent, 'Guardar cambios');
  ui.dom['name-catalog'].value = 'Aula 2B';
  await save(ui);
  await wait();
  const put = ui.calls.find(c => c.options.method === 'PUT');
  assert.equal(put.route, '/api/v1/catalogs/ubicaciones/2');
  assert.deepEqual(JSON.parse(put.options.body), { name: 'Aula 2B', detail: 'Edificio A' });
});
