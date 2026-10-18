/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
const filename = path.resolve(__dirname, '../tourSteps.ts');
const loaded = new Module(filename, module);
loaded._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, filename);
const { TOUR_STEPS, fitSpotlightRect, tooltipTop } = loaded.exports;

test('tour covers Home, Transactions and Insights before one Settings step', () => {
  assert.deepEqual([...new Set(TOUR_STEPS.map(step => step.page))], ['transactions', 'calendar', 'insights', 'settings']);
  assert.equal(TOUR_STEPS.filter(step => step.page === 'settings').length, 1);
  assert.ok(TOUR_STEPS.every(step => step.target && step.title && step.points.length));
});
test('spotlight padding stays inside the screen at the edges', () => {
  const rect = fitSpotlightRect({ x: 0, y: 4, width: 400, height: 70 }, 400, 800);
  assert.ok(rect.x >= 0 && rect.y >= 0);
  assert.ok(rect.x + rect.width <= 400 && rect.y + rect.height <= 800);
});
test('tooltip goes below upper targets and above bottom controls, inside safe areas', () => {
  assert.equal(tooltipTop({ x: 10, y: 80, width: 300, height: 60 }, 800, 24, 24, 240), 156);
  const top = tooltipTop({ x: 10, y: 680, width: 300, height: 52 }, 800, 24, 24, 240);
  assert.ok(top + 240 < 680 && top >= 36);
  assert.ok(tooltipTop(null, 600, 44, 24, 330) + 330 <= 564);
});
