const test = require('node:test');
const assert = require('node:assert/strict');
const { repository } = require('../../scripts/test-support/finance-db.cjs');
const { loader } = require('../../scripts/test-support/load-ts.cjs');
const { validateImport, needsReview, applyImportChoice } = loader()('modules/Core/import/validation.ts');

const transaction = { title: 'Imported expense', date: '2026-10-01', amount: 2000, type: 'expense', category: 'Other Expense', account: null, currencyCode: 'INR', currencySymbol: '₹', currencyName: 'Indian Rupee' };
const catalog = { incomeCategories: ['Salary'], expenseCategories: ['Other Expense', 'Food'], accounts: ['Cash', 'Card'] };
const reviewed = data => validateImport(data.map(row => ({ ...row, account: row.account || 'Cash' })), catalog);

test('missing required fields and invalid dates reject the entire file with row numbers', () => {
  assert.throws(() => validateImport([transaction, { ...transaction, date: '2026-02-30', amount: '', type: 'expensse', title: '' }], catalog), error => {
    assert.equal(error.name, 'ImportValidationError');
    assert.equal(error.problems.length, 4);
    assert.ok(error.problems.every(problem => problem.rowNumber === 2));
    return true;
  });
});
test('unknown names are retained for review, without fuzzy category or payment mapping', () => {
  const [row] = validateImport([{ ...transaction, category: 'Food delivery', account: 'Bank holiday fund' }], catalog);
  assert.equal(row.transaction.category, 'Food delivery');
  assert.equal(row.transaction.account, 'Bank holiday fund');
  assert.equal(needsReview(row, catalog), true);
});
test('missing accounts remain unresolved until a real payment account is chosen', () => {
  const rows = validateImport([transaction, transaction], catalog);
  assert.equal(needsReview(rows[0], catalog), true);
  const updated = applyImportChoice(rows, rows[0], 'account', '', false, true);
  assert.equal(updated.every(row => needsReview(row, catalog)), true);
  const assigned = applyImportChoice(rows, rows[0], 'account', 'Cash', false, false);
  assert.equal(needsReview(assigned[0], catalog), false);
  assert.equal(needsReview(assigned[1], catalog), true);
});
test('per-transaction changes stay local; matching category changes stay within income or expense', () => {
  const rows = validateImport([transaction, transaction, { ...transaction, type: 'income' }], catalog);
  const local = applyImportChoice(rows, rows[0], 'category', 'Food', false, false);
  assert.equal(local[1].transaction.category, 'Other Expense');
  const bulk = applyImportChoice(rows, rows[0], 'category', 'Food', false, true);
  assert.equal(bulk[1].transaction.category, 'Food');
  assert.equal(bulk[2].transaction.category, 'Other Expense');
});
test('creating a category resolves every row already using it, while preserving other review issues', () => {
  const rows = validateImport([
    { ...transaction, category: 'Donations', account: 'Cash' },
    { ...transaction, category: 'donations', account: 'Card' },
    { ...transaction, category: 'Donations', account: '' },
    { ...transaction, category: 'Donations', account: 'Cash', type: 'income' },
    { ...transaction, category: 'Something else', account: 'Cash' },
  ], catalog);
  const updated = applyImportChoice(rows, rows[0], 'category', 'Donations', true, false);
  assert.deepEqual(updated.map(row => needsReview(row, catalog)), [false, false, true, true, true]);
  assert.ok(updated.slice(0, 3).every(row => row.createCategory && row.transaction.category === 'Donations'));
  assert.equal(rows[1].createCategory, undefined, 'source rows are not mutated');
  const renamed = applyImportChoice(rows, rows[0], 'category', 'Giving', true, false);
  assert.equal(needsReview(renamed[1], catalog), true, 'renaming one row does not remap other rows unless apply-to-all is enabled');
});
test('a category created once in review imports all matching transactions atomically', async () => {
  const { repo, sqlite } = repository();
  try {
    const rows = reviewed([
      { ...transaction, category: 'Donations', account: 'Cash' },
      { ...transaction, title: 'Second donation', category: 'Donations', account: 'Cash' },
    ]);
    const updated = applyImportChoice(rows, rows[0], 'category', 'Donations', true, false);
    await repo.importReviewedTransactions(updated);
    assert.equal((await repo.getTransactions()).length, 2);
    assert.equal((await repo.getCategories('expense')).filter(row => row.name === 'Donations').length, 1);
  } finally { sqlite.close(); }
});
test('imported expenses without accounts survive SQLite reads and repository reloads', async () => {
  const { sqlite, repo } = repository();
  try {
    await repo.addCategory('Other Expense', 'expense');
    await repo.addTransaction(transaction);
    const rows = await new repo.constructor('personal').getTransactions();
    assert.equal(rows.length, 1);
    assert.equal(rows[0].account, '');
    assert.equal(rows[0].currencyCode, 'INR');
  } finally { sqlite.close(); }
});
test('an unresolved row aborts import without saving any earlier row', async () => {
  const { sqlite, repo } = repository();
  try {
    await repo.addCategory('Other Expense', 'expense');
    await assert.rejects(repo.importReviewedTransactions(validateImport([transaction], catalog)), /still need review/);
    assert.equal((await repo.getTransactions()).length, 0);
  } finally { sqlite.close(); }
});
test('explicit new categories and accounts are created alongside their transactions', async () => {
  const { sqlite, repo } = repository();
  try {
    const rows = reviewed([{ ...transaction, category: 'Donations', account: 'Savings' }]).map(row => ({ ...row, createCategory: true, createAccount: true }));
    await repo.importReviewedTransactions(rows);
    assert.equal((await repo.getTransactions())[0].account, 'Savings');
    assert.equal((await repo.getCategories('expense')).some(c => c.name === 'Donations'), true);
    assert.equal((await repo.getAccounts()).some(a => a.name === 'Savings'), true);
  } finally { sqlite.close(); }
});
test('a later write failure rolls back every transaction and new category/account in the batch', async () => {
  const { sqlite, repo } = repository();
  try {
    sqlite.exec("CREATE TRIGGER fail_import BEFORE INSERT ON transactions WHEN NEW.title = 'Fail' BEGIN SELECT RAISE(ABORT, 'Simulated disk failure'); END;");
    const rows = reviewed([{ ...transaction, category: 'New category', account: 'New account' }, { ...transaction, title: 'Fail', category: 'New category', account: 'New account' }]).map(row => ({ ...row, createCategory: true, createAccount: true }));
    await assert.rejects(repo.importReviewedTransactions(rows), /Row 2:.*Nothing was imported/);
    assert.equal((await repo.getTransactions()).length, 0);
    assert.equal((await repo.getCategories('expense')).some(c => c.name === 'New category'), false);
    assert.equal((await repo.getAccounts()).some(a => a.name === 'New account'), false);
  } finally { sqlite.close(); }
});
function importControls({ saveError, refreshError, activeWorkspace = 'personal', file = [transaction] } = {}) {
  const messages = [];
  const actions = [];
  let writes = 0;
  const action = type => Object.assign(() => ({ type }), { fulfilled: payload => ({ type, payload }) });
  const load = loader({
    '@/components/toast/ToastProvider': { toast: { success: message => messages.push(message) } },
    '@/modules/Core/Repository/Index': { getActiveWorkspaceId: () => activeWorkspace },
    '@/modules/Core/Repository/SQLiteRepo': { SQLiteFinanceRepository: class {
      async importReviewedTransactions(rows) { if (saveError) throw saveError; writes++; return rows.length; }
      async getTransactions() { if (refreshError) throw refreshError; return []; }
      async getCategories(type) { return (type === 'expense' ? catalog.expenseCategories : catalog.incomeCategories).map(name => ({ name })); }
      async getAccounts() { return catalog.accounts.map(name => ({ name })); }
    } },
    '@/modules/Core/Slices/TransactionSlice': { loadTransactions: action('transactions'), fetchCategories: action('categories'), fetchAccounts: action('accounts') },
    '@/utils/CryptoUtils': { isEncryptedEnvelope: () => false },
    'expo-document-picker': { getDocumentAsync: async () => ({ assets: [{ uri: 'file://test.json', name: 'test.json' }] }) },
    'expo-file-system/legacy': { readAsStringAsync: async () => JSON.stringify(file) }, 'react-native': {},
  });
  const { useImportExport: createImportExport } = load('hooks/use-import-export.ts');
  const controls = createImportExport(action => actions.push(action), () => {}, []);
  return { controls, messages, actions, writes: () => writes };
}
test('success is reported only after committed rows and reference lists reload', async () => {
  const { controls, messages, actions } = importControls();
  await controls.confirmImportPreview(reviewed([transaction]), 'personal');
  assert.deepEqual(messages, ['Imported 1 transactions!']);
  assert.equal(actions.length, 4);
});
test('failed refresh explains rows are saved; failed writes never report success', async () => {
  const refresh = importControls({ refreshError: new Error('Read failed') });
  await assert.rejects(refresh.controls.confirmImportPreview(reviewed([transaction]), 'personal'), /saved.*do not import the file again/);
  assert.deepEqual(refresh.messages, []);
  const write = importControls({ saveError: new Error('Nothing was imported') });
  await assert.rejects(write.controls.confirmImportPreview(reviewed([transaction]), 'personal'), /Nothing was imported/);
  assert.deepEqual(write.messages, []);
});
test('switching workspace after preview prevents writing into a different workspace', async () => {
  const { controls, writes } = importControls({ activeWorkspace: 'family' });
  await assert.rejects(controls.confirmImportPreview(reviewed([transaction]), 'personal'), /Workspace changed/);
  assert.equal(writes(), 0);
});
test('file preview surfaces invalid row details and never starts an import', async () => {
  const { controls, writes } = importControls({ file: [transaction, { ...transaction, amount: null }] });
  const result = await controls.buildImportPreview();
  assert.match(result.error, /Nothing was imported/);
  assert.equal(result.problems[0].rowNumber, 2);
  assert.equal(writes(), 0);
});
