const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const validator = require('../js/user-registration-validations.js');
const validatorRol = require('../js/role-change-validations.js');
const validatorActivo = require('../js/asset-registration-validations.js');
const validatorCatalogo = require('../js/catalog-validations.js');

function makeElement() {
  const handlers = {};
  const classes = new Set();
  return {
    _text: '',
    get textContent() { return this._text; },
    // Asignar '' vacia los hijos, igual que en un navegador real
    set textContent(v) { this._text = v; if (v === '') this.children.length = 0; },
    value: '', type: 'password', className: '', hidden: false, disabled: false, dataset: {},
    attrs: {}, handlers, focusCount: 0, resetCount: 0, children: [],
    classList: { add(x) { classes.add(x); }, remove(x) { classes.delete(x); }, toggle(x, force) { if (force ?? !classes.has(x)) classes.add(x); else classes.delete(x); return classes.has(x); }, contains(x) { return classes.has(x); } },
    setAttribute(k,v) { this.attrs[k] = v; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener(k, fn) { handlers[k] = fn; },
    focus() { this.focusCount++; },
    reset() { this.resetCount++; },
    appendChild(childElement) { this.children.push(childElement); },
  };
}
function jsonReply(status, body) {
  return { ok: status >= 200 && status < 300, status, headers: { get: () => 'application/json' }, async json() { return body; } };
}
function runPage(page, { response, session, confirmResult = true } = {}) {
  const ids = ['form-login','username','password','show-password','button-login',
    'error-user','password-error-login','form-message',
    'form-registration','message-registration','button-register','name','email','access-key','role',
    'error-name','error-email','error-password','error-role','error-status-asset','cancel-registration',
    'account-details','account-role','link-registration','link-update','link-asset','link-update-asset','counter-functions-assets','account-panel','status-dashboard','close-session',
    'form-update','message-update','button-update','cancel-update','id-user',
    'form-role','message-role','button-change-role','cancel-role','error-id','link-role',
    'link-status','form-status','message-status','button-status','cancel-status',
    'view-status','card-user','section-change','reason-status','error-reason',
    'name-user','email-user','role-user','status-current',
    'link-delete','form-delete','view-deletion','card-delete',
    'section-delete','button-delete','cancel-deletion','message-deletion',
    'name-delete','email-delete','role-delete','status-delete',
    'open-deletion','dashboard-deletion',
    'form-catalog','name-catalog','detail-catalog','label-detail','error-name-catalog',
    'error-detail-catalog','button-save-catalog','cancel-catalog','message-catalog','title-catalog',
    'body-table','list-status','link-catalogs','tab-locations','tab-statuses',
    'tab-categories','tab-acquisition-modes',
    'form-view','id-view','error-id-view','message-view','button-view',
    'cancel-view','section-detail','summary-asset','data-detail','message-listing',
    'body-assets','table-assets','link-register-asset','link-update-asset',
    'form-search-editing','id-editing','error-id-editing','message-load-editing',
    'button-load-editing','message-listing-editing','body-editing-assets','table-editing-assets','section-editing','id-asset-loaded','form-editing',
    'message-editing','button-save-editing','cancel-editing',
    'form-asset','message-asset','button-register-asset','cancel-asset',
    ...['number-asset','description-asset','brand-asset','model-asset','serial-asset','price-asset',
      'status-asset','location-asset','category-asset','mode-asset','responsible-asset',
      'notes-asset'].flatMap(id => [id, 'error-' + id])];
  const dom = Object.fromEntries(ids.map(id => [id, makeElement()]));
  const history = [];
  const calls = [];
  const confirmations = [];
  const storage = new Map();
  if (session) storage.set('sga_sesion',JSON.stringify(session));
  const browser = {
    UserRegistrationValidation: validator,
    RoleChangeValidation: validatorRol,
    AssetValidation: validatorActivo,
    CatalogValidation: validatorCatalogo,
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
  const sandbox = { window: browser, document: { getElementById: id => dom[id], createElement: () => makeElement() } };
  const execute = (script) => vm.runInNewContext(
    fs.readFileSync(path.join(__dirname,'../js/',script),'utf8'),sandbox,{ filename:script });
  execute('api.js');
  execute(page);
  return { dom, history, calls, storage, browser, jsonReply, confirmations };
}
module.exports = { runPage, jsonReply };
