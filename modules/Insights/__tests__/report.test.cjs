const {test}=require('node:test');const assert=require('node:assert/strict');const {loader}=require('../../../scripts/test-support/load-ts.cjs');
const {buildInsightsHTML}=loader()('modules/Insights/reportHtml.ts');
const summary={incomeTotal:100,expenseTotal:40,balanceInHand:60,fullExpenseBreakdown:[{category:'Food <script>alert(1)</script>',amount:40,color:'#123456'}],fullIncomeBreakdown:[{category:'Salary',amount:100,color:'#009944'}]};
const options={mode:'both',currencyCode:'INR',currrencySymbol:'₹',currentMonthLabel:'October 2026',previousMonthLabel:'September 2026',categoryBudgets:{Food:50},generatedAt:'2026-10-25'};
test('reports preserve totals, categories and comparison-only categories while escaping all user content',()=>{
 const html=buildInsightsHTML(summary,'October 2026', {...options,workspaceName:'<img onerror=alert(1)>'},[{category:'Old category',currentAmount:0,previousAmount:5}]);
 for(const text of ['₹100','₹40','₹60','Salary','Old category','September 2026','Budget'])assert.ok(html.includes(text),text);
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img onerror'));
});
test('Classic and Expressive reports use distinct geometry and honor comparison/budget options',()=>{
 const classic=buildInsightsHTML(summary,'October', {...options,layout:'classic',mode:'budget'});const expressive=buildInsightsHTML(summary,'October',{...options,layout:'sage',mode:'lastMonth'});
 assert.ok(classic.includes('Detailed report'));assert.ok(expressive.includes('Simple report'));assert.ok(expressive.includes('30px 30px 30px 10px'));assert.ok(!classic.includes('September 2026</th>'));assert.ok(!expressive.includes('<th class="num">Budget</th>'));
});

test('selected sections omit unselected summaries and comparisons can both be disabled', () => {
 const html=buildInsightsHTML(summary,'October', {...options,mode:'none',includeIncome:false,includeExpenses:true,includeAccounts:false});
 assert.ok(html.includes('<h2>Spending</h2>'));assert.ok(!html.includes('<h2>Income</h2>'));
 assert.ok(!html.includes('Salary'));assert.ok(!html.includes('<div class="label">Balance</div>'));
 assert.ok(!html.includes('September 2026'));assert.ok(!html.includes('<div class="budget">'));
 assert.throws(()=>buildInsightsHTML(summary,'October',{...options,includeIncome:false,includeExpenses:false,includeAccounts:false}),/at least one/);
});
test('accounts and selected expanded entries are included without expanding unselected categories', () => {
 const transactions=[{title:'Lunch <unsafe>',category:'Food',account:'Cash',type:'expense',amount:20,date:'2026-10-02',createdAt:'2026-10-02',notes:'Note & details'},
 {title:'Private salary',category:'Salary',account:'Bank',type:'income',amount:100,date:'2026-10-03',createdAt:'2026-10-03'}];
 const base={...options,mode:'none',includeIncome:false,includeExpenses:true,includeAccounts:true,accounts:[{name:'Cash',income:0,expense:20,previousIncome:0,previousExpense:0}],transactions,
 expanded:[JSON.stringify(['expense','Food']),JSON.stringify(['income','Salary'])]};
 const html=buildInsightsHTML({...summary,fullExpenseBreakdown:[{category:'Food',amount:20,color:'#123456'}]},'October',base);
 assert.ok(html.includes('<h2>Accounts</h2>'));assert.ok(html.includes('Lunch &lt;unsafe&gt;'));assert.ok(html.includes('Note &amp; details'));
 assert.ok(!html.includes('Private salary'));assert.ok(!html.includes('<h2>Salary</h2>'));
 const collapsed=buildInsightsHTML(summary,'October',{...base,expanded:[]});assert.ok(!collapsed.includes('Lunch &lt;unsafe&gt;'));
 const accountsOnly=buildInsightsHTML(summary,'October',{...base,includeExpenses:false,expanded:[JSON.stringify(['account','Cash'])]});
 assert.ok(accountsOnly.includes('<h2>Cash</h2>'));assert.ok(!accountsOnly.includes('<h2>Spending</h2>'));assert.ok(!accountsOnly.includes('<div class="hero">'));
});
test('Simple reports omit chart markup while Detailed reports keep charts', () => {
 const simple=buildInsightsHTML(summary,'October',{...options,layout:'sage'});
 const detailed=buildInsightsHTML(summary,'October',{...options,layout:'classic'});
 assert.ok(!simple.includes('<svg'));
 assert.ok(detailed.includes('<svg'));
 for(const html of [simple,detailed]) { assert.ok(html.includes('Salary')); assert.ok(html.includes('₹100')); }
});
test('expanded groups follow their own parent section instead of collecting at the end', () => {
 const html=buildInsightsHTML(summary,'October',{...options,includeAccounts:true,
  accounts:[{name:'Cash',income:100,expense:40,previousIncome:0,previousExpense:0}],
  expanded:[JSON.stringify(['expense',summary.fullExpenseBreakdown[0].category]),JSON.stringify(['income','Salary']),JSON.stringify(['account','Cash'])]});
 const spending=html.indexOf('<h2>Spending</h2>'),expenseDetail=html.indexOf('EXPENSE DETAILS');
 const income=html.indexOf('<h2>Income</h2>'),incomeDetail=html.indexOf('INCOME DETAILS');
 const accounts=html.indexOf('<h2>Accounts</h2>'),accountDetail=html.indexOf('ACCOUNT DETAILS');
 assert.ok(spending<expenseDetail && expenseDetail<income && income<incomeDetail && incomeDetail<accounts && accounts<accountDetail);
});
