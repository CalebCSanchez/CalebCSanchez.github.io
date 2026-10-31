(() => {
  const STORAGE_KEY = 'halloween_bingo_game_v1';
  const LETTERS = ['B', 'I', 'N', 'G', 'O'];
  const COLUMNS = ['#ff9850', '#bb8ee8', '#e7c89b', '#a8cf7a', '#f17b60'];
  const PRESETS = [
    ...BingoCore.PATTERN_CATALOG.map(pattern => [pattern.name, pattern.type, pattern.category]),
    ['Custom pattern', 'custom', 'custom']
  ];

  const elements = {
    numberBoard: document.getElementById('number-board'),
    roundNavigation: document.getElementById('round-navigation'),
    roundTabs: document.getElementById('round-tabs'),
    roundConfig: document.getElementById('round-config'),
    roundCount: document.getElementById('round-count'),
    cardPrice: document.getElementById('card-price'),
    ball: document.getElementById('current-ball'),
    ballLetter: document.getElementById('ball-letter'),
    ballNumber: document.getElementById('ball-number'),
    callerCaption: document.getElementById('caller-caption'),
    drawButton: document.getElementById('draw-button'),
    roundStateButton: document.getElementById('round-state-button'),
    gameStatus: document.getElementById('game-status'),
    drawCount: document.getElementById('draw-count'),
    remainingCount: document.getElementById('remaining-count'),
    historyList: document.getElementById('history-list'),
    resetRoundButton: document.getElementById('reset-round-button'),
    newGameButton: document.getElementById('new-game-button'),
    fullscreenButton: document.getElementById('fullscreen-button'),
    roundKicker: document.getElementById('round-kicker'),
    roundTitleDisplay: document.getElementById('round-title-display'),
    patternName: document.getElementById('active-pattern-name'),
    patternPreview: document.getElementById('active-pattern-preview'),
    toast: document.getElementById('toast')
  };

  let state = loadState();
  let priceDraft = (state.cardPriceCents / 100).toFixed(2);
  let toastTimer;
  let lastJackpot = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === 1 && Array.isArray(saved.rounds) && saved.rounds.length) {
        const defaults = BingoCore.createDefaultGame();
        const rounds = saved.rounds.slice(0, 12).map((round, index) => ({
          ...BingoCore.makeRound(index),
          ...round,
          title: typeof round.title === 'string' ? round.title : `Round ${index + 1}`,
          paidCards: round.paidCards ?? 0,
          drawn: Array.isArray(round.drawn) ? [...new Set(round.drawn.filter(number => Number.isInteger(number) && number >= 1 && number <= 75))] : [],
          status: ['ready', 'playing', 'paused', 'complete'].includes(round.status) ? round.status : 'ready',
          patterns: Array.isArray(round.patterns) ? round.patterns.filter(pattern => pattern && typeof pattern.name === 'string').map(pattern => ({
            id: String(pattern.id || `${index}-${Math.random()}`),
            name: pattern.name,
            weight: pattern.weight,
            type: pattern.type || 'custom'
          })) : []
        }));
        return {
          ...defaults,
          ...saved,
          cardPriceCents: Number.isSafeInteger(saved.cardPriceCents) && saved.cardPriceCents >= 0 ? saved.cardPriceCents : 25,
          activeRound: Math.min(Math.max(Number.isInteger(saved.activeRound) ? saved.activeRound : 0, 0), rounds.length - 1),
          rounds
        };
      }
    } catch (error) {
      console.warn('Could not restore the bingo game.', error);
    }
    return BingoCore.createDefaultGame();
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { showToast('This browser could not save the game locally.'); }
  }

  function currentRound() { return state.rounds[state.activeRound]; }
  function formatMoney(cents) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100); }
  function numberLetter(number) { return LETTERS[Math.floor((number - 1) / 15)] || '?'; }
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
  }

  function renderBoard() {
    elements.numberBoard.innerHTML = LETTERS.map((letter, column) => {
      const start = column * 15 + 1;
      const cells = Array.from({ length: 15 }, (_, index) => {
        const number = start + index;
        const round = currentRound();
        const drawn = round.drawn.includes(number);
        const current = round.drawn.at(-1) === number;
        const locked = round.status === 'paused' || round.status === 'complete';
        return `<button class="number-cell${drawn ? ' is-drawn' : ''}${current ? ' is-current' : ''}" type="button" data-call-number="${number}" aria-label="${letter} ${number}${drawn ? ', called' : ', call number'}" aria-pressed="${drawn}" ${drawn || locked ? 'disabled' : ''}>${number}</button>`;
      }).join('');
      return `<div class="bingo-column" style="--column-color:${COLUMNS[column]}"><div class="column-letter">${letter}</div>${cells}</div>`;
    }).join('');
  }

  function renderRoundNavigation() {
    elements.roundNavigation.innerHTML = state.rounds.map((round, index) =>
      `<button class="round-nav-button" type="button" data-round="${index}" aria-label="Round ${index + 1}: ${escapeHtml(round.title)}" aria-current="${index === state.activeRound}">${String(index + 1).padStart(2, '0')}</button>`
    ).join('');
    elements.roundTabs.innerHTML = state.rounds.map((round, index) =>
      `<button class="round-tab${index === state.rounds.length - 1 ? ' is-final' : ''}" type="button" role="tab" data-round="${index}" aria-selected="${index === state.activeRound}" aria-label="Round ${index + 1}: ${escapeHtml(round.title)}">R${index + 1}</button>`
    ).join('');
  }

  function calculate(round = currentRound()) {
    const priceCents = BingoCore.parseMoneyToCents(priceDraft);
    return BingoCore.calculatePayouts(round.paidCards, priceCents, round.patterns);
  }

  function getPatternMask(type) {
    return BingoCore.getPatternMask(type);
  }

  function previewMarkup(type) {
    const mask = getPatternMask(type);
    return mask.map((active, index) => `<span class="mini-cell${active ? ' is-active' : ''}${index === 12 ? ' is-free' : ''}"></span>`).join('');
  }

  function activePattern(round = currentRound()) {
    return round.patterns.find(pattern => pattern.id === round.selectedPattern) ||
      round.patterns.find(pattern => pattern.name === round.selectedPattern) || round.patterns[0];
  }

  function renderPatternRows(round, payout) {
    const totalWeight = payout.valid ? payout.totalWeight : null;
    return round.patterns.map((pattern, index) => {
      const isSelected = activePattern(round)?.id === pattern.id;
      const allocation = payout.valid ? payout.allocations[index] : null;
      const share = totalWeight && allocation ? `${allocation.percentage.toFixed(1)}%` : '—';
      const amount = payout.valid && Number(round.paidCards) > 0 ? formatMoney(allocation.payoutCents) : '—';
      return `<div class="pattern-row${isSelected ? ' is-selected' : ''}" data-pattern-id="${escapeHtml(pattern.id)}">
        <div class="pattern-main">
          <input class="pattern-name-input" data-pattern-name="${escapeHtml(pattern.id)}" maxlength="36" value="${escapeHtml(pattern.name)}" aria-label="Name for pattern ${escapeHtml(pattern.name || 'unnamed pattern')}">
          <span class="pattern-payout">${amount}<span class="pattern-percent"> · ${share}</span></span>
        </div>
        <input data-pattern-weight="${escapeHtml(pattern.id)}" type="number" min="0.001" max="1000000" step="0.001" value="${escapeHtml(pattern.weight)}" aria-label="Weight for ${escapeHtml(pattern.name)}" title="Pattern weight">
        <div class="pattern-order"><button type="button" data-move-pattern="${index - 1}" aria-label="Move ${escapeHtml(pattern.name)} up" ${index === 0 ? 'disabled' : ''}>↑</button><button type="button" data-move-pattern="${index + 1}" aria-label="Move ${escapeHtml(pattern.name)} down" ${index === round.patterns.length - 1 ? 'disabled' : ''}>↓</button></div>
        <button class="pattern-select" type="button" data-select-pattern="${escapeHtml(pattern.id)}" aria-label="Select ${escapeHtml(pattern.name)} pattern" aria-pressed="${isSelected}">${isSelected ? '✦' : '○'}</button>
        <button class="pattern-remove" type="button" data-remove-pattern="${escapeHtml(pattern.id)}" aria-label="Remove ${escapeHtml(pattern.name)}">×</button>
      </div>`;
    }).join('');
  }

  function renderRoundConfig() {
    const round = currentRound();
    const payout = calculate(round);
    const selected = activePattern(round);
    const selectedPayoutIndex = selected ? round.patterns.indexOf(selected) : -1;
    const selectedPayout = payout.valid && selectedPayoutIndex >= 0 ? payout.allocations[selectedPayoutIndex] : null;
    const isFinal = state.activeRound === state.rounds.length - 1;
    const blackout = round.patterns.find(pattern => pattern.type === 'blackout' || pattern.name.toLowerCase() === 'blackout');
    const blackoutIndex = blackout ? round.patterns.indexOf(blackout) : -1;
    const blackoutPayout = payout.valid && blackoutIndex >= 0 ? payout.allocations[blackoutIndex] : null;
    const hasMoney = Number(round.paidCards) > 0;
    const jackpotAmount = hasMoney && blackoutPayout ? formatMoney(blackoutPayout.payoutCents) : formatMoney(0);
    elements.roundConfig.innerHTML = `
      <div class="round-config-header">
        <input class="round-title-input" id="round-title-input" maxlength="42" value="${escapeHtml(round.title)}" aria-label="Round ${state.activeRound + 1} title">
        <button class="complete-button" id="complete-round-button" type="button">${round.status === 'complete' ? 'Completed ✓' : 'Complete round'}</button>
      </div>
      <div class="round-stat-grid">
        <div class="stat-box"><label for="paid-cards-input">PAID CARDS IN PLAY</label><input class="card-count-input" id="paid-cards-input" type="number" min="0" step="1" value="${escapeHtml(round.paidCards)}" inputmode="numeric"></div>
        <div class="stat-box"><span class="stat-label">ROUND PRIZE POOL</span><strong class="stat-value">${payout.valid ? formatMoney(payout.potCents) : '—'}</strong></div>
      </div>
      <p class="cards-note">Paid cards entered for this round only. Free cards do not add to the pot.${!hasMoney ? ' Enter paid cards to calculate prizes.' : ''}</p>
      ${!payout.valid ? `<p class="field-note pattern-error">${escapeHtml(payout.reason)}</p>` : ''}
      ${BingoCore.parseMoneyToCents(priceDraft) === null ? '<p class="field-note pattern-error">Enter a card price with up to two decimal places.</p>' : ''}
      <div class="patterns-heading"><h3>WINNING PATTERNS</h3><span class="total-weight">Total weight: ${payout.valid ? payout.totalWeight : '—'}</span></div>
      <div class="pattern-list">${renderPatternRows(round, payout) || '<p class="field-note">Add a winning pattern to calculate prizes.</p>'}</div>
      <div class="pattern-add">
        <div class="pattern-add-controls">
          <select class="preset-select" id="pattern-preset" aria-label="Select a pattern preset"><optgroup label="Classic bingo">${PRESETS.filter(item => item[2] === 'classic').map(([name, type]) => `<option value="${type}">${name}</option>`).join('')}</optgroup><optgroup label="Halloween shapes">${PRESETS.filter(item => item[2] === 'halloween').map(([name, type]) => `<option value="${type}">${name}</option>`).join('')}</optgroup><option value="custom">Custom pattern</option></select>
          <button class="add-pattern-button" id="add-pattern-button" type="button" aria-label="Add pattern">+</button>
          <input class="custom-pattern-input" id="custom-pattern-name" maxlength="36" placeholder="Name your custom pattern" aria-label="Custom pattern name" hidden>
        </div>
      </div>
      ${isFinal ? `<div class="jackpot-panel${lastJackpot !== jackpotAmount ? ' amount-change' : ''}"><p class="jackpot-label">☘ BLACKOUT JACKPOT</p><strong class="jackpot-amount">${blackout ? (hasMoney && blackoutPayout ? jackpotAmount : '$0.00') : 'Add a Blackout pattern'}</strong><span class="jackpot-pattern">${blackout ? `Final prize · ${escapeHtml(blackout.name)}` : 'Create a Blackout pattern to enable the prize'}</span></div>` : ''}
      <div class="round-controls">
        <button class="button button-outline" type="button" data-step-round="-1" ${state.activeRound === 0 ? 'disabled' : ''}>← Previous</button>
        <button class="button button-primary" type="button" data-step-round="1" ${state.activeRound === state.rounds.length - 1 ? 'disabled' : ''}>Next Round →</button>
      </div>`;
    lastJackpot = jackpotAmount;
    const preset = document.getElementById('pattern-preset');
    preset.addEventListener('change', () => {
      document.getElementById('custom-pattern-name').hidden = preset.value !== 'custom';
    });
  }

  function renderCurrentBoardDetails() {
    const round = currentRound();
    const lastNumber = round.drawn.at(-1);
    elements.roundKicker.textContent = `ROUND ${String(state.activeRound + 1).padStart(2, '0')}`;
    elements.roundTitleDisplay.textContent = round.title;
    elements.drawCount.textContent = String(round.drawn.length);
    elements.remainingCount.textContent = String(75 - round.drawn.length);
    elements.gameStatus.textContent = round.status === 'playing' ? 'IN PROGRESS' : round.status === 'paused' ? 'PAUSED' : round.status === 'complete' ? 'ROUND COMPLETE' : 'READY TO BEGIN';
    elements.gameStatus.dataset.status = round.status;
    elements.drawButton.disabled = round.status !== 'playing' || round.drawn.length >= 75;
    elements.roundStateButton.textContent = round.status === 'playing' ? 'Pause Round' : round.status === 'paused' ? 'Continue Round' : round.status === 'complete' ? 'Start Again' : 'Start Round';
    elements.ballLetter.textContent = lastNumber ? numberLetter(lastNumber) : '?';
    elements.ballNumber.textContent = lastNumber ? String(lastNumber) : '--';
    elements.ball.setAttribute('aria-label', lastNumber ? `Current number ${numberLetter(lastNumber)} ${lastNumber}` : 'No number drawn yet');
    elements.callerCaption.textContent = lastNumber ? `The caller drew ${numberLetter(lastNumber)} ${lastNumber}.` : 'The first number is waiting in the fog.';
    elements.historyList.innerHTML = [...round.drawn].reverse().map(number => `<li class="history-chip">${numberLetter(number)}-${number}</li>`).join('') || '<li class="field-note">No calls yet</li>';
    const pattern = activePattern(round);
    elements.patternName.textContent = pattern ? pattern.name : 'No pattern selected';
    elements.patternPreview.innerHTML = previewMarkup(pattern?.type);
    elements.roundCount.value = state.rounds.length;
    elements.cardPrice.value = priceDraft;
    renderBoard();
    renderRoundNavigation();
    renderRoundConfig();
  }

  function render() { renderCurrentBoardDetails(); }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => elements.toast.classList.remove('is-visible'), 2600);
  }

  function setActiveRound(index) {
    if (!Number.isInteger(index) || index < 0 || index >= state.rounds.length) return;
    state.activeRound = index;
    saveState();
    render();
  }

  function animateCall() {
    saveState();
    render();
    elements.ball.classList.remove('has-number');
    void elements.ball.offsetWidth;
    elements.ball.classList.add('has-number');
  }

  function callNumber(number) {
    const round = currentRound();
    if (round.status === 'paused' || round.status === 'complete') return;
    const updatedDraws = BingoCore.addCalledNumber(round.drawn, number);
    if (!updatedDraws) return;
    round.drawn = updatedDraws;
    round.status = 'playing';
    animateCall();
  }

  function drawNumber() {
    const round = currentRound();
    if (round.status !== 'playing') return;
    const number = BingoCore.drawNumber(round.drawn);
    if (number === null) {
      showToast('All 75 numbers have been called.');
      return;
    }
    callNumber(number);
  }

  function toggleRoundState() {
    const round = currentRound();
    round.status = round.status === 'playing' ? 'paused' : 'playing';
    saveState();
    render();
  }

  function resetRoundBoard() {
    if (!currentRound().drawn.length && currentRound().status === 'ready') return;
    if (!window.confirm('Reset this round’s bingo board? Its card count, patterns, payouts, and other rounds will stay unchanged.')) return;
    currentRound().drawn = [];
    currentRound().status = 'ready';
    saveState();
    render();
  }

  function newGame() {
    if (!window.confirm('Start a fresh game? This discards all rounds, card counts, patterns, and drawn numbers saved in this browser.')) return;
    state = BingoCore.createDefaultGame();
    priceDraft = '0.25';
    saveState();
    render();
    showToast('A fresh Halloween game is ready.');
  }

  function resizeGame(count) {
    if (!Number.isInteger(count) || count < 1 || count > 12) {
      elements.roundCount.value = state.rounds.length;
      showToast('Choose between 1 and 12 rounds.');
      return;
    }
    if (count < state.rounds.length) {
      const removed = state.rounds.slice(count);
      const hasData = removed.some(round => round.patterns.length || Number(round.paidCards) > 0 || round.drawn.length || round.status !== 'ready');
      if (hasData && !window.confirm(`Remove ${removed.length} round${removed.length === 1 ? '' : 's'} and its configured patterns, cards, and drawn numbers?`)) {
        elements.roundCount.value = state.rounds.length;
        return;
      }
    }
    state.rounds = BingoCore.resizeRounds(state.rounds, count);
    state.activeRound = Math.min(state.activeRound, count - 1);
    saveState();
    render();
  }

  function addPattern() {
    const round = currentRound();
    const presetType = document.getElementById('pattern-preset').value;
    const customName = document.getElementById('custom-pattern-name').value.trim();
    const preset = PRESETS.find(item => item[1] === presetType);
    const name = presetType === 'custom' ? customName : preset?.[0];
    if (!name) {
      showToast('Enter a name for the custom pattern.');
      return;
    }
    const id = `pattern-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const pattern = { id, name, weight: 1, type: presetType === 'custom' ? 'custom' : presetType };
    round.patterns.push(pattern);
    round.selectedPattern = id;
    saveState();
    render();
    showToast(`${name} added to ${round.title}.`);
  }

  function onRoundConfigClick(event) {
    const select = event.target.closest('[data-select-pattern]');
    if (select) {
      currentRound().selectedPattern = select.dataset.selectPattern;
      saveState();
      render();
      return;
    }
    const remove = event.target.closest('[data-remove-pattern]');
    if (remove) {
      currentRound().patterns = currentRound().patterns.filter(pattern => pattern.id !== remove.dataset.removePattern);
      if (currentRound().selectedPattern === remove.dataset.removePattern) currentRound().selectedPattern = currentRound().patterns[0]?.id || '';
      saveState();
      render();
      return;
    }
    const move = event.target.closest('[data-move-pattern]');
    if (move) {
      const targetIndex = Number(move.dataset.movePattern);
      const row = move.closest('.pattern-row');
      const fromIndex = currentRound().patterns.findIndex(pattern => pattern.id === row.dataset.patternId);
      if (targetIndex < 0 || targetIndex >= currentRound().patterns.length) return;
      const [pattern] = currentRound().patterns.splice(fromIndex, 1);
      currentRound().patterns.splice(targetIndex, 0, pattern);
      saveState();
      render();
      return;
    }
    const step = event.target.closest('[data-step-round]');
    if (step) {
      setActiveRound(state.activeRound + Number(step.dataset.stepRound));
      return;
    }
    if (event.target.closest('#add-pattern-button')) addPattern();
    if (event.target.closest('#complete-round-button')) {
      currentRound().status = 'complete';
      saveState();
      render();
      showToast(`${currentRound().title} marked complete.`);
    }
  }

  function onRoundConfigInput(event) {
    const target = event.target;
    if (target.id === 'round-title-input') {
      currentRound().title = target.value;
      elements.roundTitleDisplay.textContent = target.value || `Round ${state.activeRound + 1}`;
      renderRoundNavigation();
      saveState();
      return;
    }
    if (target.id === 'paid-cards-input') {
      currentRound().paidCards = target.value === '' ? '' : Number(target.value);
      saveState();
      renderRoundConfig();
      document.getElementById('paid-cards-input')?.focus({ preventScroll: true });
      return;
    }
    if (target.hasAttribute('data-pattern-weight')) {
      const pattern = currentRound().patterns.find(item => item.id === target.dataset.patternWeight);
      if (pattern) pattern.weight = target.value === '' ? '' : Number(target.value);
      saveState();
      renderRoundConfig();
      document.querySelector(`[data-pattern-weight="${CSS.escape(target.dataset.patternWeight)}"]`)?.focus({ preventScroll: true });
      return;
    }
    if (target.hasAttribute('data-pattern-name')) {
      const pattern = currentRound().patterns.find(item => item.id === target.dataset.patternName);
      if (pattern) pattern.name = target.value;
      saveState();
      renderRoundConfig();
      document.querySelector(`[data-pattern-name="${CSS.escape(target.dataset.patternName)}"]`)?.focus({ preventScroll: true });
      elements.patternName.textContent = activePattern()?.name || 'No pattern selected';
    }
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.().catch(() => showToast('Fullscreen is not available in this browser.'));
  }

  elements.drawButton.addEventListener('click', drawNumber);
  elements.numberBoard.addEventListener('click', event => {
    const tile = event.target.closest('[data-call-number]');
    if (tile) callNumber(Number(tile.dataset.callNumber));
  });
  elements.roundStateButton.addEventListener('click', toggleRoundState);
  elements.resetRoundButton.addEventListener('click', resetRoundBoard);
  elements.newGameButton.addEventListener('click', newGame);
  elements.fullscreenButton.addEventListener('click', toggleFullscreen);
  elements.roundCount.addEventListener('change', () => resizeGame(Number(elements.roundCount.value)));
  elements.cardPrice.addEventListener('input', () => {
    priceDraft = elements.cardPrice.value;
    renderRoundConfig();
    const cents = BingoCore.parseMoneyToCents(priceDraft);
    if (cents !== null) {
      state.cardPriceCents = cents;
      saveState();
    }
  });
  elements.roundNavigation.addEventListener('click', event => {
    const button = event.target.closest('[data-round]');
    if (button) setActiveRound(Number(button.dataset.round));
  });
  elements.roundTabs.addEventListener('click', event => {
    const button = event.target.closest('[data-round]');
    if (button) setActiveRound(Number(button.dataset.round));
  });
  elements.roundConfig.addEventListener('click', onRoundConfigClick);
  elements.roundConfig.addEventListener('input', onRoundConfigInput);
  elements.roundConfig.addEventListener('change', onRoundConfigInput);
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return;
    if (event.code === 'Space' || event.key.toLowerCase() === 'd') {
      event.preventDefault();
      drawNumber();
    } else if (event.key.toLowerCase() === 'p') toggleRoundState();
    else if (event.key.toLowerCase() === 'f') toggleFullscreen();
  });

  render();
})();