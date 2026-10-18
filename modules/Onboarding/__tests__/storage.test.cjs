/* global __dirname */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const Module = require('node:module');
function loadTs(relative, aliases = {}) {
  const filename = path.resolve(__dirname, relative);
  const compiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true },
  }).outputText;
  const loaded = new Module(filename, module);
  const originalRequire = loaded.require.bind(loaded);
  loaded.require = id => Object.hasOwn(aliases, id) ? aliases[id] : originalRequire(id);
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const { initializeOnboarding, isOnboardingComplete, resetOnboarding, saveOnboarding,
  getTourProgress, saveTourProgress, normalizeSetupItems } = loadTs('../storage.ts');
const { schema } = loadTs('../../Core/DB/Schema.ts');
function database(existing = false) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec(schema);
  const db = {
    execSync: sql => sqlite.exec(sql),
    runSync: (sql, params = []) => sqlite.prepare(sql).run(...params),
    runAsync: async (sql, params = []) => sqlite.prepare(sql).run(...params),
    getFirstSync: (sql, params = []) => sqlite.prepare(sql).get(...params),
    getFirstAsync: async (sql, params = []) => sqlite.prepare(sql).get(...params),
    withTransactionSync: fn => {
      sqlite.exec('BEGIN');
      try { fn(); sqlite.exec('COMMIT'); } catch (error) { sqlite.exec('ROLLBACK'); throw error; }
    },
  };
  initializeOnboarding(db, existing ? 1 : 0);
  db.runSync("INSERT INTO workspaces (id, name, icon, color) VALUES ('personal', 'Personal', 'account-outline', '#6366F1')");
  db.runSync("INSERT INTO categories (workspace_id, name, type) VALUES ('personal', 'Old default', 'expense')");
  db.runSync("INSERT INTO accounts (workspace_id, name) VALUES ('personal', 'Old method')");
  return db;
}
const item = (name, icon = 'wallet-outline', color = '#6366F1') => ({ name, icon, color });
const setup = { name: '  Everyday  ', icon: 'home-outline', color: '#22C55E', currencyCode: 'usd', currencySymbol: '$', currencyName: 'US Dollar',
  incomeCategories: [item('Salary'), item('Side project', 'laptop')], expenseCategories: [item('Food', 'food-outline')], accounts: [item('Debit', 'credit-card-outline')] };

test('fresh installs remain in setup across restarts; existing installs skip it without a surprise tour', async () => {
  const fresh = database();
  assert.equal(await isOnboardingComplete(fresh), false);
  initializeOnboarding(fresh, 1);
  assert.equal(await isOnboardingComplete(fresh), false);
  const existing = database(true);
  assert.equal(await isOnboardingComplete(existing), true);
  assert.equal(await getTourProgress(existing), null);
});

test('setup saves selected and custom items, workspace appearance, and tour eligibility together', async () => {
  const db = database();
  saveOnboarding(db, setup);
  assert.equal(await isOnboardingComplete(db), true);
  assert.equal(await getTourProgress(db), 0);
  const workspace = db.getFirstSync('SELECT * FROM workspaces');
  assert.equal(workspace.name, 'Everyday');
  assert.equal(workspace.currency_code, 'USD');
  assert.equal(workspace.icon, 'home-outline');
  assert.equal(workspace.color, '#22C55E');
  assert.equal(db.getFirstSync('SELECT COUNT(*) AS count FROM categories').count, 3);
  assert.equal(db.getFirstSync("SELECT icon FROM categories WHERE name = 'Side project'").icon, 'laptop');
  assert.equal(db.getFirstSync("SELECT COUNT(*) AS count FROM categories WHERE name = 'Old default'").count, 0);
  assert.equal(db.getFirstSync('SELECT name FROM accounts').name, 'Debit');
  assert.throws(() => saveOnboarding(db, { ...setup, name: 'Overwrite' }), /already complete/);
  assert.equal(db.getFirstSync('SELECT name FROM workspaces').name, 'Everyday');
});

test('a storage failure rolls back the workspace and all selected items and leaves setup resumable', async () => {
  const db = database();
  db.execSync("CREATE TRIGGER simulate_failure BEFORE INSERT ON accounts WHEN NEW.name = 'Debit' BEGIN SELECT RAISE(ABORT, 'Storage failure'); END;");
  assert.throws(() => saveOnboarding(db, setup), /Storage failure/);
  assert.equal(await isOnboardingComplete(db), false);
  assert.equal(await getTourProgress(db), null);
  assert.equal(db.getFirstSync('SELECT name FROM workspaces').name, 'Personal');
  assert.equal(db.getFirstSync('SELECT name FROM categories').name, 'Old default');
  assert.equal(db.getFirstSync('SELECT name FROM accounts').name, 'Old method');
  db.execSync('DROP TRIGGER simulate_failure');
  saveOnboarding(db, setup);
  assert.equal(await isOnboardingComplete(db), true);
});

test('blank names, invalid currencies or appearance, and missing workspace cannot finish setup', async () => {
  const db = database();
  assert.throws(() => saveOnboarding(db, { ...setup, name: '   ' }), /workspace name/);
  assert.throws(() => saveOnboarding(db, { ...setup, currencyCode: '?' }), /currency/);
  assert.throws(() => saveOnboarding(db, { ...setup, color: 'red' }), /icon and color/);
  db.runSync('DELETE FROM categories'); db.runSync('DELETE FROM accounts'); db.runSync('DELETE FROM workspaces');
  assert.throws(() => saveOnboarding(db, setup), /find your workspace/);
  assert.equal(await isOnboardingComplete(db), false);
});

test('every category type and payment methods need at least one selected item', () => {
  for (const key of ['incomeCategories', 'expenseCategories', 'accounts']) {
    assert.throws(() => saveOnboarding(database(), { ...setup, [key]: [] }), /Select at least one/);
  }
  assert.throws(() => normalizeSetupItems([item('Food'), item(' food ')], 'category'), /already a category/);
  assert.equal(normalizeSetupItems([item('  Food  ')], 'category')[0].name, 'Food');
});

test('the same name can be used for income and expense categories', () => {
  const db = database();
  saveOnboarding(db, { ...setup, incomeCategories: [item('Other')], expenseCategories: [item('Other')] });
  assert.equal(db.getFirstSync("SELECT COUNT(*) AS count FROM categories WHERE name = 'Other'").count, 2);
});

test('existing transactions block setup writes even when the marker says pending', () => {
  const db = database();
  const category = db.getFirstSync('SELECT id FROM categories');
  db.runSync("INSERT INTO transactions (id, title, amount, date, category_id, type) VALUES ('real-entry', 'Food', 10, '2026-10-17', ?, 'expense')", [category.id]);
  assert.throws(() => saveOnboarding(db, setup), /already has transactions/);
  assert.equal(db.getFirstSync('SELECT name FROM workspaces').name, 'Personal');
  assert.equal(db.getFirstSync('SELECT COUNT(*) AS count FROM transactions').count, 1);
});

test('tour progress resumes across restarts, completion and skip stay dismissed, and reset clears it', async () => {
  const db = database(); saveOnboarding(db, setup);
  await saveTourProgress(db, 3); initializeOnboarding(db, 1);
  assert.equal(await getTourProgress(db), 3);
  await saveTourProgress(db, null);
  assert.equal(await getTourProgress(db), null);
  await assert.rejects(saveTourProgress(db, -1), /Invalid tour step/);
  resetOnboarding(db);
  assert.equal(await isOnboardingComplete(db), false);
  assert.equal(await getTourProgress(db), null);
});

test('skipping setup creates a complete default workspace independent of earlier draft edits', async () => {
  const { makeDefaultSetup, makePresets } = loadTs('../presets.ts', {
    '@/data/management-options.json': require('../../../data/management-options.json'),
    '@/utils/Types': loadTs('../../../utils/Types.ts'),
  });
  const abandoned = makePresets('income');
  abandoned.forEach(item => { item.selected = false; item.name = 'Abandoned draft'; });
  const defaults = makeDefaultSetup({ code: 'INR', symbol: '₹', name: 'Indian Rupee' });
  const db = database();
  saveOnboarding(db, defaults);
  assert.equal(await isOnboardingComplete(db), true);
  assert.equal(await getTourProgress(db), 0);
  assert.equal(db.getFirstSync('SELECT name FROM workspaces').name, 'Personal');
  assert.equal(db.getFirstSync('SELECT currency_code FROM workspaces').currency_code, 'INR');
  assert.ok(db.getFirstSync("SELECT name FROM categories WHERE name = 'Salary' AND type = 'income'"));
  assert.ok(db.getFirstSync("SELECT name FROM categories WHERE type = 'expense'"));
  assert.equal(db.getFirstSync('SELECT COUNT(*) AS count FROM accounts').count, 3);
  assert.equal(db.getFirstSync("SELECT name FROM categories WHERE name = 'Abandoned draft'"), undefined);
});

test('extra category presets start unselected, restore choices, and stay out of default setup', () => {
  const { makePresets, restoreChoices, makeDefaultSetup, SETUP_ICONS } = loadTs('../presets.ts', {
    '@/data/management-options.json': require('../../../data/management-options.json'),
    '@/utils/Types': loadTs('../../../utils/Types.ts'),
  });
  const defaults = makeDefaultSetup({ code: 'INR', symbol: '₹', name: 'Indian Rupee' });
  for (const [kind, extra, defaultItems] of [
    ['income', 'Bonus', defaults.incomeCategories], ['expense', 'Pets', defaults.expenseCategories], ['accounts', 'Credit card', defaults.accounts],
  ]) {
    const presets = makePresets(kind);
    assert.ok(presets.some(item => !item.selected));
    assert.ok(presets.every(item => SETUP_ICONS.includes(item.icon)));
    assert.equal(presets.find(item => item.name === extra).selected, false);
    assert.equal(defaultItems.some(item => item.name === extra), false);
    const restored = restoreChoices(presets.map(item => item.name === extra ? { ...item, selected: true } : item), kind);
    assert.equal(restored.find(item => item.name === extra).selected, true);
    const oldDraft = restoreChoices(presets.filter(item => item.selected), kind);
    assert.equal(oldDraft.find(item => item.name === extra).selected, false);
  }
});

test('moving appearance before workspace keeps existing drafts on their original page', () => {
  const { restoreSetupStep, SETUP_STEP: step } = loadTs('../steps.ts');
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6].map(value => restoreSetupStep(value, 3)),
    [step.intro, step.workspace, step.income, step.expense, step.accounts, step.appearance, step.review]);
  assert.equal(restoreSetupStep(5, 2), step.review);
  assert.equal(restoreSetupStep(1, 4), step.appearance);
  assert.equal(restoreSetupStep(2, 4), step.workspace);
  assert.equal(restoreSetupStep(-1, 4), step.intro);
  assert.equal(restoreSetupStep('2', 4), step.intro);
});

test('household defaults save distinct everyday categories, valid icons, and rental income', () => {
  const { makeDefaultSetup, makePresets } = loadTs('../presets.ts', {
    '@/data/management-options.json': require('../../../data/management-options.json'),
  });
  const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json');
  const defaults = makeDefaultSetup({ code: 'INR', symbol: '₹', name: 'Indian Rupee' });
  const db = database();
  saveOnboarding(db, defaults);
  for (const name of ['Groceries', 'Fruits', 'Vegetables', 'Meat & Fish', 'Milk & Dairy', 'Rent']) {
    const saved = db.getFirstSync("SELECT icon FROM categories WHERE name = ? AND type = 'expense'", [name]);
    assert.ok(saved, name);
    assert.ok(Object.hasOwn(glyphs, saved.icon), `${name} uses a supported icon`);
  }
  assert.ok(db.getFirstSync("SELECT name FROM categories WHERE name = 'Rental Income' AND type = 'income'"));
  assert.equal(defaults.incomeCategories.at(-1).name, 'Other Income');
  assert.equal(defaults.expenseCategories.at(-1).name, 'Other Expense');
  for (const kind of ['income', 'expense', 'accounts']) {
    const presets = makePresets(kind);
    assert.equal(new Set(presets.map(item => item.name.toLowerCase())).size, presets.length);
    assert.ok(presets.every(item => Object.hasOwn(glyphs, item.icon)));
  }
});

test('optional household selections and deselected defaults survive a resumed onboarding draft', () => {
  const { makePresets, restoreChoices, makeDefaultSetup } = loadTs('../presets.ts', {
    '@/data/management-options.json': require('../../../data/management-options.json'),
  });
  const optional = ['Cooking Gas', 'Domestic Help', 'Home Maintenance', 'Childcare'];
  const initial = makePresets('expense');
  assert.ok(initial.filter(item => optional.includes(item.name)).every(item => !item.selected));
  const restored = restoreChoices(initial.map(item => ({ ...item,
    selected: item.name === 'Rent' ? false : optional.includes(item.name) || item.selected,
  })), 'expense');
  const setup = makeDefaultSetup({ code: 'INR', symbol: '₹', name: 'Indian Rupee' });
  const db = database();
  saveOnboarding(db, { ...setup, expenseCategories: restored.filter(item => item.selected) });
  assert.equal(db.getFirstSync("SELECT name FROM categories WHERE name = 'Rent' AND type = 'expense'"), undefined);
  for (const name of optional) assert.ok(db.getFirstSync("SELECT name FROM categories WHERE name = ? AND type = 'expense'", [name]));
});
