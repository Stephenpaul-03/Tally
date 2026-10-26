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
 assert.ok(classic.includes('Classic report'));assert.ok(expressive.includes('Expressive report'));assert.ok(expressive.includes('30px 30px 30px 10px'));assert.ok(!classic.includes('September 2026</th>'));assert.ok(!expressive.includes('<th class="num">Budget</th>'));
});
