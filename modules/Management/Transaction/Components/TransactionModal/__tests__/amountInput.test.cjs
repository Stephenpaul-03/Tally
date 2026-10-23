const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../../../../../scripts/test-support/load-ts.cjs');
const { keypadAmount, sanitizeAmountInput } = loader()('modules/Management/Transaction/Components/TransactionModal/amountInput.ts');
test('rapid ordered keypad updates preserve every digit and clear/backspace correctly', () => {
  assert.equal(['1','2','3','4','5'].reduce(keypadAmount, ''), '12345');
  assert.equal(keypadAmount('12345', 'backspace'), '1234');
  assert.equal(keypadAmount('12345', 'clear'), '');
  assert.equal(keypadAmount('', 'backspace'), '');
});
test('keypad keeps existing decimal entry and precision limits without rounding', () => {
  assert.equal(['0','1','2'].reduce(keypadAmount, ''), '0.12');
  assert.equal(sanitizeAmountInput('1234567890123456.123456789012'), '123456789012345.1234567890');
  assert.equal(sanitizeAmountInput('₹12..34'), '12.34');
});
