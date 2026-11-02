const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const validator = require('../js/registro-validaciones.js');
const validatorRol = require('../js/modificar-rol-validaciones.js');

function makeElement() {
  const handlers = {};
  const classes = new Set();
  return {
    value: '', textContent: '', type: 'password', className: '', hidden: false, disabled: false,
    attrs: {}, handlers, focusCount: 0, resetCount: 0,
    classList: { add(x) { classes.add(x); }, remove(x) { classes.delete(x); }, contains(x) { return classes.has(x); } },
    setAttribute(k,v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(k, fn) { handlers[k] = fn; },
    focus() { this.focusCount++; },
    reset() { this.resetCount++; },
  };
}
function jsonReply(status, body) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => 'application/json' }, async json() { return body; } };
}
function runPage(page, { response, session, confirmResult = true } = {}) {
  const ids = ['formulario-login','usuario','contrasena','mostrar-contrasena','boton-login',
    'error-usuario','error-contrasena','mensaje-formulario',
    'formulario-registro','mensaje-registro','boton-registrar','nombre','correo','clave','rol',
    'error-name','error-email','error-password','error-role','cancelar-registro',
    'datos-cuenta','rol-cuenta','enlace-registro','enlace-actualizacion','panel-cuenta','estado-panel','cerrar-sesion',
    'formulario-actualizacion','mensaje-actualizacion','boton-actualizar','cancelar-actualizacion','id-usuario',
    'formulario-rol','mensaje-rol','boton-modificar-rol','cancelar-rol','error-id','enlace-rol',
    'enlace-estado','formulario-estado','mensaje-estado','boton-estado','cancelar-estado',
    'consultar-estado','ficha-usuario','seccion-cambio','motivo-estado','error-motivo',
    'nombre-usuario','correo-usuario','rol-usuario','estado-actual'];
  const dom = Object.fromEntries(ids.map(id => [id, makeElement()]));
  const history = [];
  const calls = [];
  const confirmations = [];
  const storage = new Map();
  if (session) storage.set('sga_sesion',JSON.stringify(session));
  const browser = {
    SGARegistroValidaciones: validator,
    SGARolValidaciones: validatorRol,
    sessionStorage: {
      getItem: k => storage.get(k) || null,
      setItem: (k,v) => storage.set(k,v),
      removeItem: k => storage.delete(k),
    },
    confirm: (message) => { confirmations.push(message); return confirmResult; },
    fetch: async (route, options) => {
      calls.push({route, options});
      if (response instanceof Error) throw response;
      return typeof response === 'function' ? response(route, options) : response;
    },
    location: { assign: p => history.push(['assign',p]), replace: p => history.push(['replace',p]) },
  };
  const sandbox = { window: browser, document: { getElementById: id => dom[id] } };
  const execute = (script) => vm.runInNewContext(
    fs.readFileSync(path.join(__dirname,'../js/',script),'utf8'),sandbox,{ filename:script });
  execute('api.js');
  execute(page);
  return { dom, history, calls, storage, browser, jsonReply, confirmations };
}
module.exports = { runPage, jsonReply };
