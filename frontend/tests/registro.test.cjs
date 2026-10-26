const test = require('node:test');
const assert = require('node:assert/strict');
const { runPage, jsonReply } = require('./util.cjs');
const {validarUsuario} = require('../js/registro-validaciones.js');
const legit={token:'jwt.ok',role:'SUPERUSER',id:1,name:'Directora',email:'directora@ctposa.ac.cr'};
const valido={name:'Ana Pérez',email:'ana@institucion.cr',password:'123456',role:'BASIC_USER'};
const submit=ui => ui.dom['formulario-registro'].handlers.submit({preventDefault() {}});
function fill(ui,datos=valido) { for (const [key,id] of Object.entries({name:'nombre',email:'correo',password:'clave',role:'rol'})) ui.dom[id].value=datos[key]; }

test('CA02 datos completos y correctos',()=>assert.equal(validarUsuario(valido).valido,true));
test('CA02 campos vacíos se rechazan',()=>assert.deepEqual(Object.keys(validarUsuario({}).errores).sort(),['email','name','password','role']));
test('CA02 formato correo inválido',()=>assert.ok(validarUsuario({...valido,email:'mal-correo'}).errores.email));
test('CA02 contraseña demasiado corta',()=>assert.ok(validarUsuario({...valido,password:'12345'}).errores.password));
test('CA02 rol incorrecto',()=>assert.ok(validarUsuario({...valido,role:'OTRO'}).errores.role));
test('CA03 normaliza correo para comprobar duplicado en backend',()=>assert.equal(validarUsuario({...valido,email:'  ANA@INSTITUCION.CR  '}).datos.email,'ana@institucion.cr'));
test('CA02 no envía formularios inválidos',async()=>{
  const ui=runPage('crear-usuario.js',{session:legit});
  await submit(ui);
  assert.equal(ui.calls.length,0);
  assert.match(ui.dom['mensaje-registro'].textContent,/Revise los campos/);
});
test('CA01 envía POST autenticado y confirma respuesta', async()=>{
  const ui=runPage('crear-usuario.js',{session:legit,response:jsonReply(201,{id:2,name:'Ana Pérez',email:valido.email,role:'BASIC_USER',active:true})});
  fill(ui); await submit(ui);
  assert.equal(ui.calls[0].route,'/api/v1/users');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer '+legit.token);
  assert.deepEqual(JSON.parse(ui.calls[0].options.body),valido);
  assert.match(ui.dom['mensaje-registro'].textContent,/registrado correctamente/);
  assert.equal(ui.dom['formulario-registro'].resetCount,1);
});
test('CA03 correo duplicado muestra error sin declarar éxito',async()=>{
  const ui=runPage('crear-usuario.js',{session:legit,response:jsonReply(400,{message:'Ya existe un usuario con ese correo'})});
  fill(ui); await submit(ui);
  assert.match(ui.dom['mensaje-registro'].textContent,/Ya existe/);
  assert.equal(ui.dom['formulario-registro'].resetCount,0);
});
test('CA04 cancelar limpia sin hacer POST',()=>{
  const ui=runPage('crear-usuario.js',{session:legit});
  ui.dom['cancelar-registro'].handlers.click();
  assert.equal(ui.calls.length,0);
  assert.equal(ui.dom['formulario-registro'].resetCount,1);
  assert.deepEqual(ui.history,[['assign','panel.html']]);
});
test('El registro exige sesión de superusuario',()=>{
  const ui=runPage('crear-usuario.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('Error 401 al registrar termina sesión',async()=>{
  const ui=runPage('crear-usuario.js',{session:legit,response:jsonReply(401,{message:'No auth'})});
  fill(ui);await submit(ui);
  assert.equal(ui.storage.size,0);
  assert.deepEqual(ui.history,[['replace','index.html']]);
});
test('Error 403 al registrar no declara registro',async()=>{
  const ui=runPage('crear-usuario.js',{session:legit,response:jsonReply(403,{message:'Sin permisos'})});
  fill(ui);await submit(ui);
  assert.match(ui.dom['mensaje-registro'].textContent,/Sin permisos/);
  assert.equal(ui.dom['formulario-registro'].resetCount,0);
});
