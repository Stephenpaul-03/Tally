const test = require('node:test');
const assert = require('node:assert/strict');
const { loader } = require('../../scripts/test-support/load-ts.cjs');
const load = loader();
const { sortCategories } = load('utils/category-order.ts');
const { matchesIconSearch } = load('utils/icon-search.ts');
const options = require('../../data/management-options.json');
const glyphs = require('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json');

test('both catch-all categories stay last for ascending and descending name and usage sorts', () => {
  for (const type of ['Income', 'Expense']) {
    const items = [{ name: `Other ${type}`, count: 3 }, { name: 'Zebra', count: 0 }, { name: 'Apple', count: 8 }];
    for (const direction of [1, -1]) {
      for (const compare of [(a, b) => a.name.localeCompare(b.name), (a, b) => a.count - b.count]) {
        const result = sortCategories(items, item => item.name, (a, b) => direction * compare(a, b));
        assert.equal(result.at(-1).name, `Other ${type}`);
        assert.ok(direction * compare(result[0], result[1]) <= 0);
        assert.equal(items[0].name, `Other ${type}`, 'source order is not mutated');
      }
    }
  }
});
test('fallback pinning preserves custom order and handles normalized names', () => {
  assert.deepEqual(sortCategories([' other expense ', 'Zebra', 'Apple'], name => name), ['Zebra', 'Apple', ' other expense ']);
  assert.deepEqual(sortCategories([], name => name), []);
});
test('household icons are valid, unique, and searchable using everyday names', () => {
  assert.equal(new Set(options.categoryIcons).size, options.categoryIcons.length);
  assert.ok(options.categoryIcons.every(icon => Object.hasOwn(glyphs, icon)));
  assert.ok(options.fallbackCategoryIcons.every(icon => options.categoryIcons.includes(icon)));
  for (const [query, icon] of [['rent', 'home-outline'], ['groceries', 'basket-outline'], ['doctor', 'stethoscope'], ['school fees', 'school-outline'], ['food', 'food-outline']]) {
    assert.ok(options.categoryIcons.includes(icon));
    assert.ok(matchesIconSearch(icon, query), query);
  }
  assert.ok(matchesIconSearch('silverware-fork-knife', 'fork knife'));
  assert.ok(matchesIconSearch('food-outline', ''));
  assert.equal(matchesIconSearch('food-outline', 'mortgage'), false);
});
