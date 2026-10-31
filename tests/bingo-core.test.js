const test = require('node:test');
const assert = require('node:assert/strict');
const BingoCore = require('../js/halloween/bingo-core.js');

test('payout allocation totals the pot and distributes leftover cents by largest remainder', () => {
  const result = BingoCore.calculatePayouts(25, 25, [
    { weight: 1 }, { weight: 1 }, { weight: 2 }
  ]);
  assert.equal(result.valid, true);
  assert.equal(result.potCents, 625);
  assert.deepEqual(result.allocations.map(item => item.payoutCents), [156, 156, 313]);
  assert.equal(result.allocations.reduce((sum, item) => sum + item.payoutCents, 0), 625);
});

test('money parsing uses integer cents and rejects unsupported precision', () => {
  assert.equal(BingoCore.parseMoneyToCents('0.25'), 25);
  assert.equal(BingoCore.parseMoneyToCents('12'), 1200);
  assert.equal(BingoCore.parseMoneyToCents('0.255'), null);
  assert.equal(BingoCore.parseMoneyToCents('-1'), null);
});

test('payout calculation rejects invalid counts and weights', () => {
  assert.equal(BingoCore.calculatePayouts(-1, 25, [{ weight: 1 }]).valid, false);
  assert.equal(BingoCore.calculatePayouts(1.5, 25, [{ weight: 1 }]).valid, false);
  assert.equal(BingoCore.calculatePayouts(1, 25, [{ weight: 0 }]).valid, false);
});

test('draws never repeat and returns null after all 75 numbers are drawn', () => {
  const drawn = Array.from({ length: 74 }, (_, index) => index + 1);
  assert.equal(BingoCore.drawNumber(drawn, () => 0.5), 75);
  assert.equal(BingoCore.drawNumber(Array.from({ length: 75 }, (_, index) => index + 1)), null);
});

test('manual calls append the selected number once and reject invalid or duplicate numbers', () => {
  assert.deepEqual(BingoCore.addCalledNumber([2, 4], 44), [2, 4, 44]);
  assert.equal(BingoCore.addCalledNumber([2, 4], 4), null);
  assert.equal(BingoCore.addCalledNumber([], 0), null);
  assert.equal(BingoCore.addCalledNumber([], 76), null);
});

test('round resizing preserves existing rounds and creates defaults', () => {
  const game = BingoCore.createDefaultGame();
  game.rounds[0].paidCards = 25;
  const expanded = BingoCore.resizeRounds(game.rounds.slice(0, 2), 3);
  assert.equal(expanded[0].paidCards, 25);
  assert.equal(expanded[2].title, 'High Stakes');
  assert.equal(BingoCore.resizeRounds(expanded, 1).length, 1);
});

test('classic and Halloween pattern previews are 5 by 5 with a reserved free center', () => {
  assert.ok(BingoCore.PATTERN_CATALOG.some(pattern => pattern.name === 'Ghost'));
  assert.ok(BingoCore.PATTERN_CATALOG.some(pattern => pattern.name === "Witch's Hat"));
  for (const pattern of BingoCore.PATTERN_CATALOG) {
    const mask = BingoCore.getPatternMask(pattern.type);
    assert.equal(mask.length, 25, `${pattern.name} must have 25 cells`);
    assert.equal(mask[12], false, `${pattern.name} leaves the FREE center distinct`);
    assert.ok(mask.some(Boolean), `${pattern.name} has at least one marked cell`);
  }
});