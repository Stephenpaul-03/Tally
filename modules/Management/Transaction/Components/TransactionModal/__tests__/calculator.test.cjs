const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../../../../scripts/test-support/load-ts.cjs');
const { calculateAmount } = loader()('modules/Management/Transaction/Components/TransactionModal/calculator.ts');
test('calculator respects precedence, decimals, signs and parentheses without floating-point noise', () => {
 for (const [expression, value] of [['10+20×3','70'], ['(10+20)÷3','10'], ['20−5−3','12'], ['0.1+0.2','0.3'], ['8÷2×3','12'], ['-3+5','2'], ['.5*4','2']]) assert.deepEqual(calculateAmount(expression), { value });
});
test('calculator rejects incomplete, zero-divisor, oversized and executable input', () => {
 for (const expression of ['1/0', '1+', '1..2', '(2+3', '2(3)', 'Infinity', 'Math.random()', '1000000000000000', '2'.repeat(161)]) assert.ok('error' in calculateAmount(expression), expression);
});
const { amountSessionReducer:step,emptyAmountSession:empty } = loader()('modules/Management/Transaction/Components/TransactionModal/calculatorSession.ts');
test('standard keypad retains lhs above rhs, switches operation without losing operands, and commits on equals',()=>{
 let state=step(empty,{type:'set',value:'12'}); state=step(state,{type:'operation',operation:'+'}); assert.equal(state.lhs,'12');
 state=step(state,{type:'operation',operation:'×'}); state=step(state,{type:'key',key:'3'}); assert.equal(state.value,'3'); assert.equal(state.lhs,'12');
 state=step(state,{type:'equals'}); assert.equal(state.value,'36'); assert.equal(state.operation,null);
});
test('calculator session handles rapid keys, decimals, clear, missing rhs and division by zero without losing work',()=>{
 let state=step(empty,{type:'toggle'}); for(const key of ['1','2','.','5'])state=step(state,{type:'key',key}); assert.equal(state.value,'12.5');
 state=step(state,{type:'operation',operation:'÷'});assert.ok(step(state,{type:'equals'}).error);state=step(state,{type:'key',key:'0'}); assert.match(step(state,{type:'equals'}).error,/zero/);
 state=step(state,{type:'key',key:'clear'});assert.equal(state.value,'');assert.equal(state.open,true);assert.equal(state.operation,null);
});
