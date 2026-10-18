/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../colorTreatment.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
const { colorTreatment, actionAccent } = loaded.exports;
const { colors } = require('../../data/management-options.json');
function rgb(hex) { return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16)); }
function luminance(channels) {
  return channels.map(value => value / 255).map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
    .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
}
test('preset and extreme custom colors keep icons visible on light, dark and AMOLED surfaces', () => {
  for (const [dark, surface] of [[false, '#FFFFFF'], [true, '#1E1E1E'], [true, '#000000']]) {
    for (const color of [...colors, '#FFFFFF', '#000000', '#FFFF00', '#000010']) {
      for (const selected of [false, true]) {
        const result = colorTreatment(color, dark, selected, surface);
        const fill = luminance(rgb(result.backgroundColor));
        const icon = luminance(rgb(result.foregroundColor));
        const contrast = (Math.max(fill, icon) + 0.05) / (Math.min(fill, icon) + 0.05);
        assert.ok(contrast >= 3, `${color}, ${surface}, selected=${selected}: ${contrast}`);
      }
    }
  }
});
test('tints support imported color formats and safe fallbacks', () => {
  assert.deepEqual(colorTreatment('#abc', true), colorTreatment('#aabbcc', true));
  assert.deepEqual(colorTreatment('rgb(17, 34, 51)', true), colorTreatment('#112233', true));
  assert.deepEqual(colorTreatment('#11223380', true), colorTreatment('#112233', true));
  assert.match(colorTreatment('invalid', true).foregroundColor, /^#[0-9a-f]{6}$/);
  assert.notEqual(colorTreatment('#6366F1', true).borderColor, colorTreatment('#6366F1', true, true).borderColor);
});
test('settings accents distinguish actions while preserving a supplied fallback', () => {
  assert.notEqual(actionAccent('tag-multiple-outline', '#123456'), actionAccent('wallet-outline', '#123456'));
  assert.equal(actionAccent('unknown', '#123456'), '#123456');
});

test('every surface uses the intro pill wash: the icon accent at 0x18 over the neutral card', () => {
  const surface = '#28282b';
  for (const accent of ['#73D6B1', '#F0B86E', '#B9A7F4', ...colors]) {
    const tint = colorTreatment(accent, true, false, surface);
    const expected = rgb(surface).map((value, index) => Math.round(value * (1 - 24 / 255) + rgb(tint.foregroundColor)[index] * 24 / 255));
    assert.deepEqual(rgb(tint.backgroundColor), expected);
    assert.equal(colorTreatment(accent, true, true, surface).backgroundColor, tint.backgroundColor);
  }
  for (const accent of ['#73D6B1', '#F0B86E', '#B9A7F4']) {
    assert.equal(colorTreatment(accent, true, false, surface).foregroundColor, accent.toLowerCase());
  }
});
