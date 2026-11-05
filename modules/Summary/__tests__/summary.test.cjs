const { test } = require('node:test');
const assert = require('node:assert/strict');
const { repository } = require('../../../scripts/test-support/finance-db.cjs');
const { loader } = require('../../../scripts/test-support/load-ts.cjs');
const { databaseSummary } = loader()('modules/Summary/model.ts');
test('summary reads only the selected workspace, including all dates, and keeps currencies separate', async () => {
  const { repo, workspaceRepo, sqlite } = repository();
  await repo.addCategory('Salary', 'income');
  await repo.addTransaction({ title: 'Salary', amount: 500, date: '2026-11-01', type: 'income', category: 'Salary', account: 'Cash', currencyCode: 'INR', currencySymbol: '₹' });
  sqlite.exec(`INSERT INTO workspaces (id,name,icon,color,currency_code,currency_symbol) VALUES ('other','Other','wallet','#123456','USD','$');
    INSERT INTO categories (workspace_id,name,type) VALUES ('other','Food','expense');
    INSERT INTO transactions (id,workspace_id,title,amount,date,category_id,type,account) VALUES ('other-entry','other','Lunch',10,'2026-10-31',(SELECT id FROM categories WHERE workspace_id='other' AND name='Food'),'expense','Cash');
    INSERT INTO transactions (id,workspace_id,title,amount,date,category_id,type,account,is_deleted) VALUES ('deleted-entry','other','Deleted',20,'2026-10-31',(SELECT id FROM categories WHERE workspace_id='other' AND name='Food'),'expense','Cash',1);`);
  const before = sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get().count;
  sqlite.exec(`INSERT INTO transactions (id,workspace_id,title,amount,date,category_id,type,account,currency_code) VALUES ('other-inr','other','Other INR',999,'2026-09-01',(SELECT id FROM categories WHERE workspace_id='other' AND name='Food'),'expense','Cash','INR');`);
  const rows = await workspaceRepo.getSummaryTransactions('personal');
  assert.equal(rows.length, 1);
  assert.ok(rows.every(row => row.workspaceId === 'personal'));
  assert.equal(databaseSummary(rows, 'INR', null).income, 500);
  assert.equal(databaseSummary(rows, 'INR', null).spent, 0);
  const other = await workspaceRepo.getSummaryTransactions('other');
  assert.equal(other.length, 2);
  assert.ok(other.every(row => row.workspaceId === 'other'));
  assert.equal(other.find(row => row.id === 'other-entry').currencyCode, 'USD');
  assert.equal(databaseSummary(other, 'USD', null).spent, 10);
  assert.equal(databaseSummary(other, 'INR', null).spent, 999);
  assert.equal(databaseSummary(other, 'USD', '2026-11').entries.length, 0);
  assert.equal((await workspaceRepo.getSummaryTransactions('missing')).length, 0);
  await assert.rejects(workspaceRepo.getSummaryTransactions(''), /Choose a workspace/);
  assert.equal(sqlite.prepare('SELECT COUNT(*) AS count FROM transactions').get().count, before + 1);
});

test('summary reports match the period and currency, include foreign categories and preserve source labels', () => {
  const { workspaceSummaryReport } = loader()('modules/Summary/report.ts');
  const { buildInsightsHTML } = loader()('modules/Insights/reportHtml.ts');
  const row = (id, amount, date, type, category, currencyCode = 'INR') => ({ id, title: id, amount, date, type, category, currencyCode, account: 'External account', workspaceId: 'foreign', workspaceName: 'Another workspace', categoryIcon: 'airplane', categoryColor: '#123456', deleted: false });
  const rows = [row('Salary',500,'2026-11-01','income','External salary'), row('Trip',70,'2026-11-02','expense','External trip'), row('Previous',20,'2026-10-01','expense','External trip'), row('Dollars',900,'2026-11-01','income','External salary','USD')];
  const month = workspaceSummaryReport(rows, 'INR', '2026-11');
  assert.equal(month.summary.incomeTotal, 500);
  assert.equal(month.summary.expenseTotal, 70);
  assert.equal(month.expenseComparison[0].previousAmount, 20);
  assert.ok(month.groups.some(group => group.label === 'External trip' && group.color === '#123456'));
  assert.ok(month.groups.some(group => group.label === 'External account'));
  assert.ok(month.transactions.every(row => row.title.includes('Another workspace')));
  const all = workspaceSummaryReport(rows, 'INR', null);
  assert.equal(all.summary.expenseTotal, 90);
  assert.deepEqual(all.previousSections, { includeIncome:false, includeExpenses:false, includeAccounts:false });
  const allHtml = buildInsightsHTML(all.summary, 'All time', { mode:'none', currencyCode:'INR', currrencySymbol:'₹', currentMonthLabel:'All time', previousMonthLabel:'', reportTitle:'Summary', recordedPeriodDescription:'All time · Another workspace' });
  assert.ok(allHtml.includes('All time · Another workspace'));
  assert.ok(!allHtml.includes('Recorded activity for this month'));
  for (const layout of ['sage','classic']) {
    const html = buildInsightsHTML(month.summary, 'November 2026', { mode:'none', layout, currencyCode:'INR', currrencySymbol:'₹', currentMonthLabel:'November 2026', previousMonthLabel:'October 2026', workspaceName:'Summary', includeIncome:true, includeExpenses:true, includeAccounts:true, accounts:month.accounts, transactions:month.transactions, expanded:[JSON.stringify(['expense','External trip'])] }, month.expenseComparison, month.incomeComparison);
    assert.ok(html.includes('Summary'));
    assert.ok(html.includes('Trip · Another workspace'));
    assert.ok(!html.includes('Dollars'));
  }
});
