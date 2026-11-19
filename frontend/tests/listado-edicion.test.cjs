const test = require('node:test');
const assert = require('node:assert/strict');
const {runPage,jsonReply}=require('./util.cjs');
const admin={token:'jwt.super',role:'SUPERUSER',id:1};
const modelo={id:5,assetNumber:'ACT-005',description:'Antes de editar',brand:'Dell',model:'Latitude',serial:'XA1',price:15000,
  statusId:1,status:'Activo',locationId:2,categoryId:3,acquisitionModeId:4,currentResponsibleId:null,notes:''};
const catalogo={statuses:[{id:1,name:'Activo'}],locations:[{id:2,name:'Oficina'}],categories:[{id:3,name:'Equipo'}],acquisitionModes:[{id:4,name:'Compra'}],responsibles:[]};
const tick=()=>new Promise(setImmediate);

test('El listado aparece al entrar, y seleccionar Actualizar carga datos en la misma página',async()=>{
  const activo={...modelo};
  const ui=runPage('actualizar-activo.js',{session:admin,response:(ruta)=>{
    if(ruta==='/api/v1/assets')return jsonReply(200,[activo]);
    if(ruta==='/api/v1/assets/catalog')return jsonReply(200,catalogo);
    if(ruta==='/api/v1/assets/5')return jsonReply(200,activo);
    throw new Error('ruta inesperada '+ruta);
  }});
  await tick();
  assert.equal(ui.dom['tabla-edicion-activos'].hidden,false);
  assert.equal(ui.dom['cuerpo-edicion-activos'].children.length,1);
  const fila=ui.dom['cuerpo-edicion-activos'].children[0];
  assert.equal(fila.children[2].textContent,'Antes de editar');
  fila.children[4].children[0].handlers.click();
  await tick();
  assert.equal(ui.dom['seccion-edicion'].hidden,false);
  assert.equal(ui.dom['id-edicion'].value,'5');
  assert.equal(ui.dom['descripcion-activo'].value,'Antes de editar');
  assert.equal(ui.history.length,0);
  assert.equal(fila.classList.contains('consulta-fila-seleccionada'),true);
});

test('Guardar actualiza la tabla con los datos devueltos por el backend',async()=>{
  let activo={...modelo};
  const ui=runPage('actualizar-activo.js',{session:admin,response:(ruta,options)=>{
    if(ruta==='/api/v1/assets')return jsonReply(200,[activo]);
    if(ruta==='/api/v1/assets/catalog')return jsonReply(200,catalogo);
    if(ruta==='/api/v1/assets/5' && options.method==='GET')return jsonReply(200,activo);
    if(ruta==='/api/v1/assets/5' && options.method==='PUT'){
      activo={...activo,description:JSON.parse(options.body).description};
      return jsonReply(200,activo);
    }
    throw new Error('ruta inesperada '+ruta);
  }});
  await tick();
  ui.dom['cuerpo-edicion-activos'].children[0].children[4].children[0].handlers.click();
  await tick();
  ui.dom['descripcion-activo'].value='Descripción actualizada en tabla';
  await ui.dom['formulario-edicion'].handlers.submit({preventDefault(){}});
  await tick();
  assert.equal(ui.calls.filter(x=>x.route==='/api/v1/assets').length,2);
  assert.equal(ui.dom['cuerpo-edicion-activos'].children[0].children[2].textContent,'Descripción actualizada en tabla');
  assert.match(ui.dom['mensaje-edicion'].textContent,/actualizado correctamente/);
  assert.equal(ui.dom['seccion-edicion'].hidden,false);
  assert.equal(ui.history.length,0);
});

test('Cancelar abandona edición sin PUT y conserva el listado dentro de la página',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:(ruta)=>{
    if(ruta==='/api/v1/assets')return jsonReply(200,[modelo]);
    if(ruta==='/api/v1/assets/catalog')return jsonReply(200,catalogo);
    return jsonReply(200,modelo);
  }});
  await tick();
  ui.dom['cuerpo-edicion-activos'].children[0].children[4].children[0].handlers.click();
  await tick();
  ui.dom['descripcion-activo'].value='Sin guardar';
  ui.dom['cancelar-edicion'].handlers.click();
  assert.equal(ui.dom['seccion-edicion'].hidden,true);
  assert.equal(ui.dom['tabla-edicion-activos'].hidden,false);
  assert.equal(ui.dom['cuerpo-edicion-activos'].children.length,1);
  assert.equal(ui.calls.filter(x=>x.options.method==='PUT').length,0);
  assert.equal(ui.history.length,0);
});

test('Sin activos muestra mensaje vacío y oculta la tabla',async()=>{
  const ui=runPage('actualizar-activo.js',{session:admin,response:()=>jsonReply(200,[])});
  await tick();
  assert.equal(ui.dom['tabla-edicion-activos'].hidden,true);
  assert.match(ui.dom['mensaje-listado-edicion'].textContent,/No hay activos registrados/);
});
