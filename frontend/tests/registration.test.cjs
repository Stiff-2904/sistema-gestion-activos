const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const {validateUser} = require('../js/user-registration-validations.js');
const legit={token:'jwt.ok',role:'SUPERUSER',id:1,name:'Directora',email:'directora@ctposa.ac.cr'};
const valid={name:'Ana Pérez',email:'ana@institucion.cr',password:'123456',role:'BASIC_USER'};
const submit=ui => ui.dom['form-registration'].handlers.submit({preventDefault() {}});
function fill(ui,data=valid) { for (const [key,id] of Object.entries({name:'name',email:'email',password:'access-key',role:'role'})) ui.dom[id].value=data[key]; }

test('CA02 datos completos y correctos',()=>assert.equal(validateUser(valid).valid,true));
test('CA02 campos vacíos se rechazan',()=>assert.deepEqual(Object.keys(validateUser({}).errors).sort(),['email','name','password','role']));
test('CA02 formato correo inválido',()=>assert.ok(validateUser({...valid,email:'mal-correo'}).errors.email));
test('CA02 contraseña demasiado corta',()=>assert.ok(validateUser({...valid,password:'12345'}).errors.password));
test('CA02 rol incorrecto',()=>assert.ok(validateUser({...valid,role:'OTRO'}).errors.role));
test('CA03 normaliza correo para comprobar duplicado en backend',()=>assert.equal(validateUser({...valid,email:'  ANA@INSTITUCION.CR  '}).data.email,'ana@institucion.cr'));
test('CA02 no envía formularios inválidos',async()=>{
  const ui=runPage('create-user.js',{session:legit});
  await submit(ui);
  assert.equal(ui.calls.length,0);
  assert.match(ui.dom['message-registration'].textContent,/Revise los campos/);
});
test('CA01 envía POST autenticado y confirma respuesta', async()=>{
  const ui=runPage('create-user.js',{session:legit,response:jsonReply(201,{id:2,name:'Ana Pérez',email:valid.email,role:'BASIC_USER',active:true})});
  fill(ui); await submit(ui);
  assert.equal(ui.calls[0].route,'/api/v1/users');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer '+legit.token);
  assert.deepEqual(JSON.parse(ui.calls[0].options.body),valid);
  assert.match(ui.dom['message-registration'].textContent,/registrado correctamente/);
  assert.equal(ui.dom['form-registration'].resetCount,1);
});
test('CA03 correo duplicado muestra error sin declarar éxito',async()=>{
  const ui=runPage('create-user.js',{session:legit,response:jsonReply(400,{message:'Ya existe un usuario con ese correo'})});
  fill(ui); await submit(ui);
  assert.match(ui.dom['message-registration'].textContent,/Ya existe/);
  assert.equal(ui.dom['form-registration'].resetCount,0);
});
test('CA04 cancelar limpia sin hacer POST',()=>{
  const ui=runPage('create-user.js',{session:legit});
  ui.dom['cancel-registration'].handlers.click();
  assert.equal(ui.calls.length,0);
  assert.equal(ui.dom['form-registration'].resetCount,1);
  assert.deepEqual(ui.history,[['assign','dashboard.html']]);
});
test('El registro exige sesión de superusuario',()=>{
  const ui=runPage('create-user.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('Error 401 al registrar termina sesión',async()=>{
  const ui=runPage('create-user.js',{session:legit,response:jsonReply(401,{message:'No auth'})});
  fill(ui);await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['replace','index.html']]);
});
test('Error 403 al registrar no declara registro',async()=>{
  const ui=runPage('create-user.js',{session:legit,response:jsonReply(403,{message:'Sin permisos'})});
  fill(ui);await submit(ui);
  assert.match(ui.dom['message-registration'].textContent,/Sin permisos/);
  assert.equal(ui.dom['form-registration'].resetCount,0);
});
