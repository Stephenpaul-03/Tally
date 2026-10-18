/* global __dirname */
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

function loader(aliases = {}) {
  const cache = new Map();
  function load(filename) {
    filename = path.resolve(root, filename);
    if (cache.has(filename)) return cache.get(filename).exports;
    const loaded = new Module(filename, module);
    cache.set(filename, loaded);
    loaded.require = id => {
      if (Object.hasOwn(aliases, id)) return aliases[id];
      const target = id.startsWith('@/') ? path.join(root, id.slice(2))
        : id.startsWith('.') ? path.resolve(path.dirname(filename), id) : null;
      if (target) {
        if (target.endsWith('.json')) return require(target);
        if (fs.existsSync(target + '.ts')) return load(target + '.ts');
      }
      return require(id);
    };
    loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
    }).outputText, filename);
    return loaded.exports;
  }
  return load;
}

module.exports = { loader };
