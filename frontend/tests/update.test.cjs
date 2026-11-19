const test = require('node:test');
const assert = require('node:assert/strict');
const {runPage, jsonReply} = require('./util.cjs');
const session={token:'jwt.ok',role:'SUPERUSER',id:1,name:'Directora',email:'directora@ctposa.ac.cr'};
const update=ui=>ui.dom['form-update'].handlers.submit({preventDefault(){}});
function complete(ui, id=2, password='') {
  ui.dom['id-user'].value=String(id);
  ui.dom['name'].value='Ana Pérez';
  ui.dom['email'].value=' ANA@INSTITUCION.CR ';
  ui.dom['access-key'].value=password;
  ui.dom['role'].value='BASIC_USER';
}

test('HU-GU-03 exige sesión SUPERUSER',()=>{
  const ui=runPage('update-user.js');
  assert.deepEqual(ui.history,[['replace','index.html']]);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-03 actualiza por PUT autenticado sin cambiar contraseña',async()=>{
  const ui=runPage('update-user.js', {session:session,response:jsonReply(200,{id:2,email:'ana@institucion.cr',role:'BASIC_USER'})});
  complete(ui);
  await update(ui);
  assert.equal(ui.calls[0].route,'/api/v1/users/2');
  assert.equal(ui.calls[0].options.method,'PUT');
  assert.equal(ui.calls[0].options.headers.Authorization,'Bearer jwt.ok');
  assert.deepEqual(JSON.parse(ui.calls[0].options.body),{
    name:'Ana Pérez',email:'ana@institucion.cr',password:null,role:'BASIC_USER'
  });
  assert.match(ui.dom['message-update'].textContent,/actualizado correctamente/);
});
test('HU-GU-03 permite nueva contraseña',async()=>{
  const ui=runPage('update-user.js',{session:session,response:jsonReply(200,{id:2,email:'ana@institucion.cr',role:'BASIC_USER'})});
  complete(ui,2,'nuevoPass123');
  await update(ui);
  assert.equal(JSON.parse(ui.calls[0].options.body).password,'nuevoPass123');
});
test('HU-GU-03 valida ID y longitud de contraseña sin enviar PUT',async()=>{
  const ui=runPage('update-user.js',{session:session});
  complete(ui,0);await update(ui);
  assert.equal(ui.calls.length,0);
  complete(ui,2,'123');await update(ui);
  assert.equal(ui.calls.length,0);
});
test('HU-GU-03 error de duplicado muestra rechazo',async()=>{
  const ui=runPage('update-user.js',{session:session,response:jsonReply(400,{message:'Ya existe otro usuario con ese correo'})});
  complete(ui);await update(ui);
  assert.match(ui.dom['message-update'].textContent,/Ya existe otro/);
});
test('HU-GU-03 actualizando la propia cuenta elimina sesión',async()=>{
  const ui=runPage('update-user.js',{session:session,response:jsonReply(200,{id:1,email:'ana@institucion.cr',role:'BASIC_USER'})});
  complete(ui,1);await update(ui);
  assert.equal(ui.storage.size,0);
  assert.match(ui.dom['message-update'].textContent,/Inicie sesión nuevamente/);
});
test('HU-GU-03 cancelar regresa al panel sin guardar',()=>{
  const ui=runPage('update-user.js',{session:session});
  ui.dom['cancel-update'].handlers.click();
  assert.equal(ui.calls.length,0);
  assert.deepEqual(ui.history,[['assign','dashboard.html']]);
});
