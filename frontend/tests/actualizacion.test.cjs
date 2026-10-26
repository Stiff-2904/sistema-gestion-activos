const test = require('node:test');
const assert = require('node:assert/strict');
const {runPage, jsonReply} = require('./util.cjs');
const sesion={token:'jwt.ok',role:'SUPERUSER',id:1,name:'Directora',email:'directora@ctposa.ac.cr'};
const actualizar=ui=>ui.dom['formulario-actualizacion'].handlers.submit({preventDefault(){}});
function completar(ui, id=2, password='') {
  ui.dom['id-usuario'].value=String(id);
  ui.dom.nombre.value='Ana Pérez';
  ui.dom.correo.value=' ANA@INSTITUCION.CR ';
  ui.dom.clave.value=password;
  ui.dom.rol.value='BASIC_USER';
}

test('HU-GU-03 exige sesión SUPERUSER',()=>{
  const ui=runPage('actualizar-usuario.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-03 actualiza por PUT autenticado sin cambiar contraseña',async()=>{
  const ui=runPage('actualizar-usuario.js', {session:sesion,response:jsonReply(200,{id:2,email:'ana@institucion.cr',role:'BASIC_USER'})});
  completar(ui);
  await actualizar(ui);
  assert.equal(ui.calls[0].route,'/api/v1/users/2');
  assert.equal(ui.calls[0].options.method,'PUT');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer jwt.ok');
  assert.deepEqual(JSON.parse(ui.calls[0].options.body),{
    name:'Ana Pérez',email:'ana@institucion.cr',password:null,role:'BASIC_USER'
  });
  assert.match(ui.dom['mensaje-actualizacion'].textContent,/actualizado correctamente/);
});
test('HU-GU-03 permite nueva contraseña',async()=>{
  const ui=runPage('actualizar-usuario.js',{session:sesion,response:jsonReply(200,{id:2,email:'ana@institucion.cr',role:'BASIC_USER'})});
  completar(ui,2,'nuevoPass123');
  await actualizar(ui);
  assert.equal(JSON.parse(ui.calls[0].options.body).password,'nuevoPass123');
});
test('HU-GU-03 valida ID y longitud de contraseña sin enviar PUT',async()=>{
  const ui=runPage('actualizar-usuario.js',{session:sesion});
  completar(ui,0);await actualizar(ui);
  assert.equal(ui.calls.length,0);
  completar(ui,2,'123');await actualizar(ui);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-03 error de duplicado muestra rechazo',async()=>{
  const ui=runPage('actualizar-usuario.js',{session:sesion,response:jsonReply(400,{message:'Ya existe otro usuario con ese correo'})});
  completar(ui);await actualizar(ui);
  assert.match(ui.dom['mensaje-actualizacion'].textContent,/Ya existe otro/);
});
test('HU-GU-03 actualizando la propia cuenta elimina sesión',async()=>{
  const ui=runPage('actualizar-usuario.js',{session:sesion,response:jsonReply(200,{id:1,email:'ana@institucion.cr',role:'BASIC_USER'})});
  completar(ui,1);await actualizar(ui);
  assert.equal(ui.storage.size,0);
  assert.match(ui.dom['mensaje-actualizacion'].textContent,/Inicie sesión nuevamente/);
});
test('HU-GU-03 cancelar regresa al panel sin guardar',()=>{
  const ui=runPage('actualizar-usuario.js',{session:sesion});
  ui.dom['cancelar-actualizacion'].handlers.click();
  assert.equal(ui.calls.length,0);
  assert.deepEqual(ui.history,[['assign','panel.html']]);
});
