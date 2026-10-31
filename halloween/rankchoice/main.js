import { isConfigured, watchConfig, watchBallots, fetchBallots, saveConfig, signInAdmin } from './firebase.js';
import { rankTop } from './tally.js';

const $ = id => document.getElementById(id);
const views = ['loading', 'setup', 'open', 'closed'];
const show = name => views.forEach(v => { $('view-' + v).hidden = v !== name; });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };
const ORDINAL = { 1: 'First', 2: 'Second', 3: 'Third' };

let config = null;
let ballotsUnsub = null;
let counting = false;
let candidatesSnapshot = [];

const voteUrl = `${location.origin}/halloween/rankchoice/vote/`;
$('vote-url').textContent = voteUrl;
$('vote-url').href = voteUrl;

function renderVoters(ballots) {
  const names = ballots.map(b => b.name).sort((a, b) => a.localeCompare(b));
  $('voter-count').textContent = names.length;
  $('no-voters').hidden = names.length > 0;
  const grid = $('voter-grid');
  const known = new Set([...grid.children].map(li => li.textContent.replace('👻 ', '')));
  if (known.size === names.length && names.every(n => known.has(n))) return;
  grid.replaceChildren(...names.map(n => {
    const li = document.createElement('li');
    li.className = 'voter-chip';
    li.textContent = n;
    return li;
  }));
}

function startBallotWatch() {
  if (ballotsUnsub) return;
  ballotsUnsub = watchBallots((ballots, err) => { if (!err) renderVoters(ballots); });
}

function podiumHtml(results) {
  const wrap = document.createElement('div');
  wrap.className = 'podium';
  results.forEach(r => {
    const slot = document.createElement('div');
    slot.className = 'podium-slot';
    const medal = document.createElement('div');
    medal.className = 'medal';
    medal.textContent = MEDALS[r.place];
    const name = document.createElement('div');
    name.className = 'p-name';
    name.textContent = r.winner;
    slot.append(medal, name);
    wrap.append(slot);
  });
  return wrap;
}

function renderBars(round, candidates, eliminatedSoFar) {
  const bars = $('stage-bars');
  const max = Math.max(round.active, 1);
  const rows = candidates.map(c => {
    const row = document.createElement('div');
    row.className = 'bar-row';
    row.dataset.name = c;
    const name = document.createElement('div');
    name.className = 'bar-name';
    name.textContent = c;
    const track = document.createElement('div');
    track.className = 'bar-track';
    const fill = document.createElement('div');
    fill.className = 'bar-fill';
    track.append(fill);
    const val = document.createElement('div');
    val.className = 'bar-val';
    row.append(name, track, val);
    return row;
  });
  bars.replaceChildren(...rows);
  return () => rows.forEach(row => {
    const c = row.dataset.name;
    const n = round.counts[c];
    row.classList.toggle('out', n === undefined || eliminatedSoFar.has(c));
    row.querySelector('.bar-fill').style.width = n === undefined ? '0%' : `${(n / max) * 100}%`;
    row.querySelector('.bar-val').textContent = n === undefined ? '' : n;
    row.classList.toggle('win', round.winner === c);
  });
}

async function playCount(ballots, candidates) {
  const results = rankTop(ballots, candidates, 3);
  const stage = $('stage');
  stage.hidden = false;
  document.querySelector('.shell').hidden = true;
  const title = $('stage-title');
  const sub = $('stage-sub');
  const barsEl = $('stage-bars');
  const winnerEl = $('stage-winner');

  if (!results.length) {
    title.textContent = 'No votes were cast...';
    sub.textContent = 'The ghosts have nothing to count.';
    await sleep(3500);
    return endStage(results);
  }

  title.textContent = 'Counting the votes...';
  sub.textContent = 'THE SPIRITS ARE TALLYING';
  title.classList.add('flicker');
  await sleep(3000);
  title.classList.remove('flicker');

  for (const result of [...results].reverse()) {
    winnerEl.replaceChildren();
    title.textContent = `The ${ORDINAL[result.place]} Place Spirit`;
    const eliminated = new Set();
    for (let i = 0; i < result.rounds.length; i++) {
      const round = result.rounds[i];
      sub.textContent = `ROUND ${i + 1} OF ${result.rounds.length} · ${round.active} BALLOTS`;
      const apply = renderBars(round, Object.keys(result.rounds[0].counts), eliminated);
      await sleep(60);
      apply();
      await sleep(2600);
      if (round.eliminated) {
        eliminated.add(round.eliminated);
        sub.textContent = `${round.eliminated.toUpperCase()} VANISHES INTO THE MIST...`;
        apply();
        await sleep(1800);
      }
    }
    barsEl.replaceChildren();
    sub.textContent = '';
    const card = document.createElement('div');
    card.className = 'winner-card';
    const medal = document.createElement('div');
    medal.className = 'medal';
    medal.textContent = MEDALS[result.place];
    const name = document.createElement('div');
    name.className = 'winner-name';
    name.textContent = result.winner;
    card.append(medal, name);
    winnerEl.replaceChildren(card);
    await sleep(result.place === 1 ? 4500 : 3500);
  }
  endStage(results);
}

function endStage(results) {
  $('stage').hidden = true;
  document.querySelector('.shell').hidden = false;
  $('stage-bars').replaceChildren();
  $('stage-winner').replaceChildren();
  $('final-podium').replaceChildren(podiumHtml([...results].sort((a, b) => a.place - b.place)));
  counting = false;
  render();
}

async function reveal() {
  counting = true;
  const ballots = (await fetchBallots()).map(b => b.ranking);
  await playCount(ballots, candidatesSnapshot);
}

function render() {
  if (counting) return;
  if (!config) return;
  show(config.status === 'open' ? 'open' : config.status === 'closed' ? 'closed' : 'setup');
  if (config.status === 'open') startBallotWatch();
}

$('tally-button').addEventListener('click', async () => {
  const btn = $('tally-button');
  const err = $('tally-error');
  err.textContent = '';
  btn.disabled = true;
  try {
    candidatesSnapshot = config.candidates;
    await signInAdmin();
    counting = true;
    await saveConfig({ status: 'closed' });
    await reveal();
  } catch (e) {
    counting = false;
    err.textContent = e.message || 'Could not close the voting.';
  } finally {
    btn.disabled = false;
  }
});

$('replay-button').addEventListener('click', () => !counting && reveal().catch(e => {
  counting = false;
  $('fatal-error').textContent = e.message;
}));

if (!isConfigured) {
  $('fatal-error').textContent = 'Firebase is not configured yet. Fill in js/rankchoice/firebase-config.js.';
  show('setup');
} else {
  watchConfig((cfg, err) => {
    if (err) { $('fatal-error').textContent = 'Could not reach the ballot box.'; return; }
    config = cfg;
    candidatesSnapshot = cfg.candidates;
    render();
  });
}
