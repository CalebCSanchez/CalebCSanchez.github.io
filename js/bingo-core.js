(function (root, factory) {
  const core = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = core;
  if (root) root.BingoCore = core;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ROUND_TITLES = ['Warm-Up', 'Getting Competitive', 'High Stakes', 'The Finale'];
  const ROUND_PRESETS = [
    [['One Line', 1, 'line'], ['Four Corners', 1, 'corners'], ['Two Lines', 2, 'two-lines']],
    [['One Line', 1, 'line'], ['X Pattern', 2, 'x'], ['Four Corners', 2, 'corners']],
    [['Four Corners', 2, 'corners'], ['X Pattern', 3, 'x'], ['Outer Border', 4, 'border']],
    [['One Line', 2, 'line'], ['X Pattern', 4, 'x'], ['Blackout', 10, 'blackout']]
  ];
  const PATTERN_CATALOG = [
    { name: 'One Line', type: 'line', category: 'classic' },
    { name: 'Two Lines', type: 'two-lines', category: 'classic' },
    { name: 'Four Corners', type: 'corners', category: 'classic' },
    { name: 'X Pattern', type: 'x', category: 'classic' },
    { name: 'Plus Sign', type: 'plus', category: 'classic' },
    { name: 'T Pattern', type: 't', category: 'classic' },
    { name: 'L Pattern', type: 'l', category: 'classic' },
    { name: 'Postage Stamp', type: 'postage', category: 'classic' },
    { name: 'Inner Frame', type: 'inner-frame', category: 'classic' },
    { name: 'Railroad Tracks', type: 'railroad', category: 'classic' },
    { name: 'Diamond', type: 'diamond', category: 'classic' },
    { name: 'Outer Border', type: 'border', category: 'classic' },
    { name: 'Blackout / Full House', type: 'blackout', category: 'classic' },
    { name: "Witch's Hat", type: 'witch-hat', category: 'halloween' },
    { name: 'Ghost', type: 'ghost', category: 'halloween' },
    { name: 'Pumpkin', type: 'pumpkin', category: 'halloween' },
    { name: 'Bat', type: 'bat', category: 'halloween' },
    { name: 'Haunted House', type: 'haunted-house', category: 'halloween' },
    { name: 'Spiderweb', type: 'spiderweb', category: 'halloween' }
  ];
  const PATTERN_MASKS = {
    line: ['00000', '00000', '11111', '00000', '00000'],
    'two-lines': ['00000', '11111', '00000', '11111', '00000'],
    corners: ['10001', '00000', '00000', '00000', '10001'],
    x: ['10001', '01010', '00100', '01010', '10001'],
    plus: ['00100', '00100', '11111', '00100', '00100'],
    t: ['11111', '00100', '00100', '00100', '00100'],
    l: ['10000', '10000', '10000', '10000', '11111'],
    postage: ['11000', '11000', '00000', '00000', '00000'],
    'inner-frame': ['00000', '01110', '01010', '01110', '00000'],
    railroad: ['01010', '01010', '01010', '01010', '01010'],
    diamond: ['00100', '01010', '10001', '01010', '00100'],
    border: ['11111', '10001', '10001', '10001', '11111'],
    blackout: ['11111', '11111', '11111', '11111', '11111'],
    'witch-hat': ['00100', '01110', '11111', '00100', '00100'],
    ghost: ['00100', '01110', '11111', '10101', '10101'],
    pumpkin: ['00100', '01110', '11111', '10101', '01110'],
    bat: ['10101', '11111', '01110', '00100', '01010'],
    'haunted-house': ['00100', '01110', '11111', '10101', '11111'],
    spiderweb: ['10101', '01010', '11111', '01010', '10101']
  };

  function getPatternMask(type) {
    const rows = PATTERN_MASKS[type];
    if (!rows) return Array(25).fill(false);
    return rows.join('').split('').map((cell, index) => cell === '1' && index !== 12);
  }

  function makeRound(index) {
    const patterns = ROUND_PRESETS[index] || ROUND_PRESETS[0];
    return {
      title: ROUND_TITLES[index] || `Round ${index + 1}`,
      paidCards: 0,
      drawn: [],
      status: 'ready',
      selectedPattern: patterns[0][0],
      patterns: patterns.map(([name, weight, type], patternIndex) => ({
        id: `round-${index + 1}-pattern-${patternIndex + 1}`,
        name,
        weight,
        type
      }))
    };
  }

  function createDefaultGame() {
    return {
      version: 1,
      cardPriceCents: 25,
      activeRound: 0,
      rounds: Array.from({ length: 4 }, (_, index) => makeRound(index))
    };
  }

  function parseMoneyToCents(value) {
    const text = String(value).trim();
    if (!/^\d+(?:\.\d{0,2})?$/.test(text)) return null;
    const [dollars, cents = ''] = text.split('.');
    return Number(dollars) * 100 + Number(cents.padEnd(2, '0'));
  }

  function weightToUnits(value) {
    const text = String(value).trim();
    if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null;
    const [whole, fraction = ''] = text.split('.');
    const units = Number(whole) * 1000 + Number(fraction.padEnd(3, '0'));
    return Number.isSafeInteger(units) && units > 0 ? units : null;
  }

  function calculatePayouts(cardCount, priceCents, patterns) {
    if (!Number.isSafeInteger(cardCount) || cardCount < 0) {
      return { valid: false, reason: 'Enter a whole number of paid cards.' };
    }
    if (!Number.isSafeInteger(priceCents) || priceCents < 0) {
      return { valid: false, reason: 'Enter a valid card price.' };
    }
    if (!Array.isArray(patterns) || patterns.length === 0) {
      return { valid: false, reason: 'Add at least one winning pattern.' };
    }

    const weights = patterns.map(pattern => weightToUnits(pattern.weight));
    if (weights.some(weight => weight === null)) {
      return { valid: false, reason: 'Pattern weights must be positive, up to three decimals.' };
    }

    const potCents = cardCount * priceCents;
    if (!Number.isSafeInteger(potCents)) {
      return { valid: false, reason: 'The calculated prize pool is too large.' };
    }

    const totalWeightUnits = weights.reduce((sum, weight) => sum + BigInt(weight), 0n);
    const pot = BigInt(potCents);
    const shares = weights.map((weight, index) => {
      const numerator = pot * BigInt(weight);
      return { index, cents: numerator / totalWeightUnits, remainder: numerator % totalWeightUnits };
    });
    let remainingCents = pot - shares.reduce((sum, share) => sum + share.cents, 0n);
    const remainderOrder = [...shares].sort((left, right) => {
      if (left.remainder === right.remainder) return left.index - right.index;
      return left.remainder > right.remainder ? -1 : 1;
    });
    for (let index = 0; remainingCents > 0n; index += 1, remainingCents -= 1n) {
      remainderOrder[index].cents += 1n;
    }

    const totalWeight = Number(totalWeightUnits) / 1000;
    return {
      valid: true,
      potCents,
      totalWeight,
      allocations: shares.sort((left, right) => left.index - right.index).map((share, index) => ({
        payoutCents: Number(share.cents),
        percentage: (weights[index] / Number(totalWeightUnits)) * 100
      }))
    };
  }

  function drawNumber(drawnNumbers, random = Math.random) {
    const drawn = new Set(drawnNumbers);
    const remaining = Array.from({ length: 75 }, (_, index) => index + 1)
      .filter(number => !drawn.has(number));
    if (remaining.length === 0) return null;
    const sample = Number(random());
    const boundedSample = Number.isFinite(sample) ? Math.min(Math.max(sample, 0), 0.999999999) : 0;
    return remaining[Math.floor(boundedSample * remaining.length)];
  }

  function addCalledNumber(drawnNumbers, number) {
    if (!Array.isArray(drawnNumbers) || !Number.isInteger(number) || number < 1 || number > 75 || drawnNumbers.includes(number)) {
      return null;
    }
    return [...drawnNumbers, number];
  }

  function resizeRounds(rounds, count) {
    if (!Number.isSafeInteger(count) || count < 1 || count > 12) {
      throw new RangeError('Round count must be between 1 and 12.');
    }
    const resized = rounds.slice(0, count);
    while (resized.length < count) resized.push(makeRound(resized.length));
    return resized;
  }

  return { addCalledNumber, calculatePayouts, createDefaultGame, drawNumber, getPatternMask, makeRound, parseMoneyToCents, PATTERN_CATALOG, resizeRounds };
});