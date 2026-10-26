const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const legit = { token:'ey.example.token',id:1,name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER' };

function submit(ui) { return ui.dom['formulario-login'].handlers.submit({preventDefault() {}}); }

test('HU-GU-01 valida campos vacíos antes de conectar', async () => {
  const ui = runPage('login.js');
  await submit(ui);
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-usuario'].textContent,/válido/);
  assert.match(ui.dom['error-contrasena'].textContent,/contraseña/);
});
test('HU-GU-01 valida formato de correo antes de conectar', async () => {
  const ui = runPage('login.js');
  ui.dom.usuario.value='incorrecto';ui.dom.contrasena.value='123456';
  await submit(ui);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-01 inicia sesión, guarda token y abre panel', async () => {
  const ui = runPage('login.js', { response:jsonReply(200,legit) });
  ui.dom.usuario.value=' ANA@CTPOSA.AC.CR ';ui.dom.contrasena.value='123456';
  await submit(ui);
  assert.equal(ui.calls[0].route, '/api/v1/auth/login');
  assert.equal(JSON.parse(ui.calls[0].options.body).email,'ana@ctposa.ac.cr');
  assert.equal(JSON.parse(ui.storage.get('sga_sesion')).role,'SUPERUSER');
  assert.deepEqual(ui.history,[['assign','panel.html']]);
  assert.equal(ui.dom.contrasena.value,'');
});
test('HU-GU-01 credenciales incorrectas no crean sesión', async () => {
  const ui = runPage('login.js', {response:jsonReply(401,{message:'Contraseña incorrecta'})});
  ui.dom.usuario.value='ana@ctposa.ac.cr';ui.dom.contrasena.value='no válida';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.equal(ui.history.length,0);
  assert.match(ui.dom['mensaje-formulario'].textContent,/incorrectos/);
});
test('HU-GU-01 fallo de red no autoriza acceso', async () => {
  const ui = runPage('login.js', {response:new Error('disconnect')});
  ui.dom.usuario.value='ana@ctposa.ac.cr';ui.dom.contrasena.value='123456';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.match(ui.dom['mensaje-formulario'].textContent,/No se pudo conectar/);
});
test('HU-GU-01 respuesta sin token no crea sesión', async () => {
  const ui = runPage('login.js', {response:jsonReply(200,{role:'SUPERUSER'})});
  ui.dom.usuario.value='ana@ctposa.ac.cr';ui.dom.contrasena.value='123456';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.equal(ui.history.length,0);
});
test('HU-GU-01 mostrar contraseña alterna visibilidad', () => {
  const ui = runPage('login.js');
  ui.dom['mostrar-contrasena'].handlers.click();
  assert.equal(ui.dom.contrasena.type,'text');
  ui.dom['mostrar-contrasena'].handlers.click();
  assert.equal(ui.dom.contrasena.type,'password');
});

test('HU-GU-01 panel exige sesión previa', () => {
  const ui = runPage('panel.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-01 panel verifica sesión real con servidor', async () => {
  const ui = runPage('panel.js', {session:legit,response:jsonReply(200,{ id:1,name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER'}) });
  await new Promise(setImmediate);
  assert.equal(ui.calls[0].route,'/api/v1/auth/me');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer '+legit.token);
  assert.equal(ui.dom['enlace-registro'].hidden,false);
  assert.equal(ui.dom['panel-cuenta'].hidden,false);
});
test('HU-GU-01 panel oculta enlace a quien no es superusuario', async () => {
  const ui = runPage('panel.js', {session:legit,response:jsonReply(200,{ name:'Ana',email:'ana@ctposa.ac.cr',role:'BASIC_USER'}) });
  await new Promise(setImmediate);
  assert.equal(ui.dom['enlace-registro'].hidden,true);
});
test('HU-GU-01 sesión vencida se elimina en panel', async () => {
  const ui = runPage('panel.js', {session:legit,response:jsonReply(401,{message:'No auth'})});
  await new Promise(setImmediate);
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['replace','index.html']]);
});
test('HU-GU-01 cerrar sesión elimina token', async () => {
  const ui = runPage('panel.js', {session:legit,response:jsonReply(200,{name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER'})});
  await new Promise(setImmediate);
  ui.dom['cerrar-sesion'].handlers.click();
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['assign','index.html']]);
});
