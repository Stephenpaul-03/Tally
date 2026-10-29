const {test}=require('node:test');
const assert=require('node:assert/strict');
const {loader}=require('../../../scripts/test-support/load-ts.cjs');
const {toggleReportSection,reportComparisonMode,reportDetailKey}=loader()('modules/Insights/reportSelection.ts');
const base={includeIncome:true,includeExpenses:true,includeAccounts:true,compareMonth:true,compareBudget:true,layout:'sage',expanded:[]};
test('section toggles preserve at least one selection including an accounts-only report',()=>{
 let selected=toggleReportSection(base,'includeIncome');selected=toggleReportSection(selected,'includeExpenses');
 assert.equal(selected.includeAccounts,true);assert.equal(toggleReportSection(selected,'includeAccounts'),selected);
 assert.equal(toggleReportSection(selected,'includeIncome').includeIncome,true);
});
test('comparison switches work independently and budgets require the expenses section',()=>{
 assert.equal(reportComparisonMode(base),'both');assert.equal(reportComparisonMode({...base,compareMonth:false}),'budget');
 assert.equal(reportComparisonMode({...base,compareBudget:false}),'lastMonth');
 assert.equal(reportComparisonMode({...base,compareMonth:false,compareBudget:false}),'none');
 assert.equal(reportComparisonMode({...base,includeExpenses:false}),'lastMonth');
 assert.equal(reportComparisonMode({...base,includeExpenses:false,compareMonth:false}),'none');
});
test('expanded identities distinguish equal category/account names and separator characters',()=>{
 const keys=[reportDetailKey('income','Cash'),reportDetailKey('expense','Cash'),reportDetailKey('account','Cash'),reportDetailKey('income','Cash:[]')];
 assert.equal(new Set(keys).size,4);
});
test('unavailable report sections and comparisons are unchecked and cannot count as remaining content',()=>{
 const {availableReportSelection}=loader()('modules/Insights/reportSelection.ts');
 const sections={includeIncome:false,includeExpenses:true,includeAccounts:true};
 const previous={includeIncome:true,includeExpenses:false,includeAccounts:false};
 const selected=availableReportSelection({...base,includeAccounts:false},sections,previous,false);
 assert.equal(selected.includeIncome,false);assert.equal(selected.includeExpenses,true);
 assert.equal(selected.compareMonth,false);assert.equal(selected.compareBudget,false);
 assert.equal(toggleReportSection(selected,'includeExpenses'),selected);
 const empty=availableReportSelection(base,{includeIncome:false,includeExpenses:false,includeAccounts:false},previous,true);
 assert.equal(empty.includeIncome||empty.includeExpenses||empty.includeAccounts,false);
 assert.equal(empty.compareMonth,false);assert.equal(empty.compareBudget,false);
 const fallback=availableReportSelection({...base,includeExpenses:false,includeAccounts:false},sections,previous,true);
 assert.equal(fallback.includeExpenses,true);
});
