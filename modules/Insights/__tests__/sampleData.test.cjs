/* global __dirname */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const Module = require("node:module");
function load(name) {
  const filename = path.resolve(__dirname, `../${name}.ts`);
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  const loaded = new Module(filename, module);
  loaded._compile(compiled, filename);
  return loaded.exports;
}
const { createSampleTransactions } = load("sampleData");
const { calculateInsights } = load("calculations");
const options = {
  incomeCategories: ["Salary", "Freelance"],
  expenseCategories: ["Food", "Transport", "Shopping", "Bills", "Leisure"],
  accounts: ["Cash", "Card", "UPI"],
  currency: { currencyCode: "INR", currencySymbol: "₹", currencyName: "Indian Rupee" },
};
test("samples populate three months of actual insight calculations", () => {
  const now = new Date(2026, 9, 16);
  const samples = createSampleTransactions({ ...options, now });
  assert.deepEqual([...new Set(samples.map(row => row.date.slice(0, 7)))], ["2026-08", "2026-09", "2026-10"]);
  assert.ok(samples.every(row => row.date <= "2026-10-16" && row.amount > 0 && row.currencyCode === "INR"));
  assert.equal(new Set(samples.filter(row => row.type === "expense").map(row => row.category)).size, 5);
  assert.equal(new Set(samples.map(row => row.account)).size, 3);
  const rows = samples.map((row, index) => ({ ...row, id: String(index), deleted: false }));
  const data = calculateInsights(rows, "2026-10", "INR", "INR", true, now);
  assert.ok(data.hasIncome && data.hasSpending && data.hasPreviousIncome && data.hasPreviousSpending);
  assert.ok(data.expenseCategories.length > 1 && data.accounts.length > 1);
});
test("year rollover and first-day previews never create future entries", () => {
  const rows = createSampleTransactions({ ...options, now: new Date(2026, 0, 1) });
  assert.deepEqual([...new Set(rows.map(row => row.date.slice(0, 7)))], ["2025-11", "2025-12", "2026-01"]);
  assert.ok(rows.some(row => row.date === "2026-01-01" && row.type === "income"));
  assert.ok(rows.some(row => row.date === "2026-01-01" && row.type === "expense"));
  assert.ok(rows.every(row => row.date <= "2026-01-01"));
});
test("leap years, custom setup, and reloads are deterministic", () => {
  const input = { ...options, incomeCategories: ["Pay"], expenseCategories: ["Living"], accounts: ["Wallet"], now: new Date(2024, 2, 31) };
  const rows = createSampleTransactions(input);
  assert.ok(rows.some(row => row.date === "2024-02-29"));
  assert.ok(!rows.some(row => row.date === "2024-02-30"));
  assert.ok(rows.every(row => row.account === "Wallet" && row.category === (row.type === "income" ? "Pay" : "Living")));
  assert.deepEqual(rows, createSampleTransactions(input));
});
test("incomplete workspace setup produces an actionable error", () => {
  assert.throws(() => createSampleTransactions({ ...options, accounts: [] }), /Add an income category/);
});

test("household samples keep titles and recurring payments in their named categories after reordering", () => {
  const input = { ...options, now: new Date(2026, 9, 18),
    incomeCategories: ['Rental Income', 'Freelance', 'Salary', 'Other Income'],
    expenseCategories: ['Milk & Dairy', 'Meat & Fish', 'Bills & Utilities', 'Fruits', 'Rent', 'Vegetables', 'Groceries', 'Food & Dining'],
  };
  const rows = createSampleTransactions(input);
  for (const [title, category] of [['Monthly salary', 'Salary'], ['Rent received', 'Rental Income'],
    ['Monthly rent', 'Rent'], ['Electricity and water bills', 'Bills & Utilities'], ['Family dinner', 'Food & Dining']]) {
    const matching = rows.filter(row => row.title === title);
    assert.ok(matching.length, title);
    assert.ok(matching.every(row => row.category === category), title);
  }
  assert.ok(rows.filter(row => row.category === 'Milk & Dairy').every(row => /milk/i.test(row.title) && row.amount <= 120));
  assert.ok(rows.filter(row => row.category === 'Rent').every(row => row.date.endsWith('-01') && row.amount === 15000));
  assert.ok(rows.filter(row => row.category === 'Fruits').every(row => /fruits|apples/i.test(row.title)));
  assert.ok(!rows.some(row => row.title === 'Weekend outing' && row.category === 'Milk & Dairy'));
  assert.equal(new Set(rows.map(row => JSON.stringify([row.date, row.type, row.category, row.title]))).size, rows.length, 'daily samples and outing samples do not duplicate a purchase');
  const rentOnly = createSampleTransactions({ ...input, expenseCategories: ['Rent'] }).filter(row => row.type === 'expense');
  assert.equal(rentOnly.length, 3);
  assert.ok(rentOnly.every(row => row.date.endsWith('-01') && row.title === 'Monthly rent'));
});

test("unknown custom category names get neutral titles rather than unrelated salary or outing labels", () => {
  const rows = createSampleTransactions({ ...options, now: new Date(2026, 9, 18),
    incomeCategories: ['Custom receipts'], expenseCategories: ['Custom spending'],
  });
  assert.ok(rows.every(row => row.title === (row.type === 'income' ? 'Custom receipts income' : 'Custom spending expense')));
});
