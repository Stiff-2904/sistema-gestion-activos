const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const legit = { token:'ey.example.token',id:1,name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER' };

function submit(ui) { return ui.dom['form-login'].handlers.submit({preventDefault() {}}); }

test('HU-GU-01 valida campos vacíos antes de conectar', async () => {
  const ui = runPage('login.js');
  await submit(ui);
  assert.equal(ui.calls.length, 0);
  assert.match(ui.dom['error-user'].textContent,/válido/);
  assert.match(ui.dom['password-error-login'].textContent,/contraseña/);
});
test('HU-GU-01 valida formato de correo antes de conectar', async () => {
  const ui = runPage('login.js');
  ui.dom['username'].value='incorrecto';ui.dom['password'].value='123456';
  await submit(ui);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-01 inicia sesión, guarda token y abre panel', async () => {
  const ui = runPage('login.js', { response:jsonReply(200,legit) });
  ui.dom['username'].value=' ANA@CTPOSA.AC.CR ';ui.dom['password'].value='123456';
  await submit(ui);
  assert.equal(ui.calls[0].route, '/api/v1/auth/login');
  assert.equal(JSON.parse(ui.calls[0].options.body).email,'ana@ctposa.ac.cr');
  assert.equal(JSON.parse(ui.storage.get('sga_sesion')).role,'SUPERUSER');
  assert.deepEqual(ui.history,[['assign','dashboard.html']]);
  assert.equal(ui.dom['password'].value,'');
});
test('HU-GU-01 credenciales incorrectas no crean sesión', async () => {
  const ui = runPage('login.js', {response:jsonReply(401,{message:'Contraseña incorrecta'})});
  ui.dom['username'].value='ana@ctposa.ac.cr';ui.dom['password'].value='no válida';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.equal(ui.history.length,0);
  assert.match(ui.dom['form-message'].textContent,/incorrectos/);
});
test('HU-GU-01 fallo de red no autoriza acceso', async () => {
  const ui = runPage('login.js', {response:new Error('disconnect')});
  ui.dom['username'].value='ana@ctposa.ac.cr';ui.dom['password'].value='123456';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.match(ui.dom['form-message'].textContent,/No se pudo conectar/);
});
test('HU-GU-01 respuesta sin token no crea sesión', async () => {
  const ui = runPage('login.js', {response:jsonReply(200,{role:'SUPERUSER'})});
  ui.dom['username'].value='ana@ctposa.ac.cr';ui.dom['password'].value='123456';
  await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.equal(ui.history.length,0);
});
test('HU-GU-01 mostrar contraseña alterna visibilidad', () => {
  const ui = runPage('login.js');
  ui.dom['show-password'].handlers.click();
  assert.equal(ui.dom['password'].type,'text');
  ui.dom['show-password'].handlers.click();
  assert.equal(ui.dom['password'].type,'password');
});

test('HU-GU-01 panel exige sesión previa', () => {
  const ui = runPage('dashboard.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-01 panel verifica sesión real con servidor', async () => {
  const ui = runPage('dashboard.js', {session:legit,response:jsonReply(200,{ id:1,name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER'}) });
  await new Promise(setImmediate);
  assert.equal(ui.calls[0].route,'/api/v1/auth/me');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer '+legit.token);
  assert.equal(ui.dom['link-registration'].hidden,false);
  assert.equal(ui.dom['account-panel'].hidden,false);
});
test('HU-GU-01 panel oculta enlace a quien no es superusuario', async () => {
  const ui = runPage('dashboard.js', {session:legit,response:jsonReply(200,{ name:'Ana',email:'ana@ctposa.ac.cr',role:'BASIC_USER'}) });
  await new Promise(setImmediate);
  assert.equal(ui.dom['link-registration'].hidden,true);
});
test('HU-GU-01 sesión vencida se elimina en panel', async () => {
  const ui = runPage('dashboard.js', {session:legit,response:jsonReply(401,{message:'No auth'})});
  await new Promise(setImmediate);
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['replace','index.html']]);
});
test('HU-GU-01 cerrar sesión elimina token', async () => {
  const ui = runPage('dashboard.js', {session:legit,response:jsonReply(200,{name:'Ana',email:'ana@ctposa.ac.cr',role:'SUPERUSER'})});
  await new Promise(setImmediate);
  ui.dom['close-session'].handlers.click();
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['assign','index.html']]);
});
