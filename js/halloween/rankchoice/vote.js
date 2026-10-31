import { isConfigured, watchConfig, hasVoted, submitBallot, cleanName } from './firebase.js';

const $ = id => document.getElementById(id);
const views = ['loading', 'closed', 'name', 'rank', 'done'];
const show = name => views.forEach(v => { $('view-' + v).hidden = v !== name; });

let config = null;
let voterName = '';
let step = 'name';
let sortable = null;

function renumber() {
  [...$('rank-list').children].forEach((li, i) => { li.querySelector('.rank-num').textContent = i + 1; });
}

function buildRankList() {
  const list = $('rank-list');
  const items = [...config.candidates].sort(() => Math.random() - 0.5).map(c => {
    const li = document.createElement('li');
    li.className = 'rank-item';
    li.dataset.name = c;
    const num = document.createElement('span');
    num.className = 'rank-num';
    const name = document.createElement('span');
    name.className = 'rank-name';
    name.textContent = c;
    const grip = document.createElement('span');
    grip.className = 'drag-grip';
    grip.textContent = '☰';
    li.append(num, name, grip);
    return li;
  });
  list.replaceChildren(...items);
  renumber();
  sortable?.destroy();
  sortable = window.Sortable.create(list, { handle: '.drag-grip', animation: 150, onEnd: renumber });
}

function render() {
  if (step === 'done') return;
  if (!config) return;
  if (config.status !== 'open' || !config.candidates.length) {
    const closed = config.status === 'closed';
    $('closed-title').textContent = closed ? 'The voting has ended!' : 'The voting has not been set up yet!';
    $('closed-text').textContent = closed
      ? 'The spirits have sealed the ballot box. Watch the big screen for the winners...'
      : 'The spirits are still preparing the ballots. Check back soon...';
    show('closed');
    return;
  }
  if (step === 'name') show('name');
  else if (step === 'rank') show('rank');
}

$('name-form').addEventListener('submit', async e => {
  e.preventDefault();
  const err = $('name-error');
  err.textContent = '';
  const name = cleanName($('name-input').value);
  if (!name || name.includes('/')) { err.textContent = 'Please enter a valid name (no slashes).'; return; }
  try {
    if (await hasVoted(name)) { err.textContent = `"${name}" has already voted!`; return; }
  } catch {
    err.textContent = 'The crypt would not answer. Try again.';
    return;
  }
  voterName = name;
  step = 'rank';
  buildRankList();
  render();
});

$('submit-button').addEventListener('click', async () => {
  const err = $('rank-error');
  err.textContent = '';
  const btn = $('submit-button');
  btn.disabled = true;
  const ranking = [...$('rank-list').children].map(li => li.dataset.name);
  try {
    await submitBallot(voterName, ranking);
    step = 'done';
    show('done');
  } catch {
    err.textContent = 'Your vote could not be sealed. The voting may have closed or you already voted.';
    btn.disabled = false;
  }
});

if (!isConfigured) {
  show('closed');
} else {
  watchConfig((cfg, error) => {
    if (error) { show('closed'); return; }
    config = cfg;
    render();
  });
}
