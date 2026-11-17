const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function load(pathname, mode = 'keycloak') {
  const calls = [];
  class Keycloak {
    constructor(config) { calls.push(['config', config]); }
    async init(options) { calls.push(['init', options]); }
    async logout(options) { calls.push(['logout', options]); }
  }
  const source = fs.readFileSync('src/services/chiroAuth.ts', 'utf8').replace('import.meta.env.VITE_API_BASE', 'undefined');
  const exports = {};
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
    exports, require: () => ({ default: Keycloak }), location: { origin: 'https://clms.example', pathname },
    localStorage: { removeItem() {} },
    fetch: async () => ({ ok: true, json: async () => ({ mode, realm: 'chirocity', clientId: 'clms-web', url: 'https://auth.example' }) }),
  });
  return { exports, calls };
}

for (const path of ['/', '/login', '/applications']) {
  test(`${path} requires Keycloak login before app startup`, async () => {
    const { exports, calls } = load(path);
    await exports.initializeAuth();
    const options = calls.find(([name]) => name === 'init')[1];
    assert.equal(options.onLoad, 'login-required');
    assert.equal(options.pkceMethod, 'S256');
    assert.equal(options.redirectUri, 'https://clms.example/login');
    assert.equal(calls[0][1].realm, 'chirocity');
  });
}
test('explicit local mode does not start Keycloak', async () => {
  const { exports, calls } = load('/login', 'local');
  await exports.initializeAuth();
  assert.equal(calls.length, 0);
});
test('logout ends the Keycloak session and returns to the allowed login callback', async () => {
  const { exports, calls } = load('/applications');
  await exports.initializeAuth();
  await exports.signOut();
  assert.equal(calls.find(([name]) => name === 'logout')[1].redirectUri, 'https://clms.example/login');
});
