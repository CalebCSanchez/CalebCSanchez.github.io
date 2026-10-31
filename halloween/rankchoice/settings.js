import {
  isConfigured, watchConfig, watchBallots, saveConfig, startVoting, isExpired, resetAll, removeBallot,
  watchAuth, isAdmin, signInAdmin, signOutAdmin
} from './firebase.js';

const $ = id => document.getElementById(id);
const LABELS = { setup: 'SEALED', open: 'VOTING OPEN', closed: 'VOTING ENDED' };

let config = { status: 'setup', candidates: [] };
let unsubs = [];

function parseCandidates() {
  const seen = new Set();
  return $('candidates-input').value.split('\n').map(s => s.trim()).filter(s => {
    const k = s.toLowerCase();
    if (!s || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function run(fn) {
  $('admin-error').textContent = '';
  try { await fn(); } catch (e) { $('admin-error').textContent = e.message || 'Something went wrong.'; }
}

function renderConfig() {
  const pill = $('status-pill');
  pill.dataset.status = config.status;
  pill.textContent = isExpired(config) ? 'AUTO-LOCKED (3H)' : LABELS[config.status];
  const sealed = config.status === 'setup';
  $('start-button').disabled = (config.status === 'open' && !isExpired(config)) || !config.candidates.length;
  $('candidates-input').disabled = !sealed;
  $('save-candidates').disabled = !sealed;
  if (document.activeElement !== $('candidates-input')) $('candidates-input').value = config.candidates.join('\n');
}

function renderBallots(ballots) {
  $('ballot-count').textContent = ballots.length;
  $('ballot-list').replaceChildren(...ballots.sort((a, b) => a.name.localeCompare(b.name)).map(b => {
    const li = document.createElement('li');
    const name = document.createElement('span');
    name.textContent = b.name;
    const btn = document.createElement('button');
    btn.className = 'button button-danger';
    btn.type = 'button';
    btn.textContent = 'Banish vote';
    btn.addEventListener('click', () => run(() => removeBallot(b.id)));
    li.append(name, btn);
    return li;
  }));
}

function startAdmin() {
  unsubs.push(watchConfig((cfg, err) => {
    if (err) { $('admin-error').textContent = 'Could not read the crypt.'; return; }
    config = cfg;
    renderConfig();
  }));
  unsubs.push(watchBallots((ballots, err) => { if (!err) renderBallots(ballots); }));
}

function stopAdmin() {
  unsubs.forEach(u => u());
  unsubs = [];
}

$('signin-button').addEventListener('click', async () => {
  $('signin-error').textContent = '';
  try { await signInAdmin(); } catch (e) { $('signin-error').textContent = e.message; }
});
$('signout-button').addEventListener('click', () => signOutAdmin());

$('save-candidates').addEventListener('click', () => run(() => {
  const candidates = parseCandidates();
  return saveConfig({ candidates });
}));

$('start-button').addEventListener('click', () => run(() => startVoting()));

$('reset-button').addEventListener('click', () => run(async () => {
  if (!confirm('Delete every ballot and seal the crypt again?')) return;
  await resetAll();
}));

if (!isConfigured) {
  $('fatal-error').textContent = 'Firebase is not configured yet. Fill in js/rankchoice/firebase-config.js.';
} else {
  watchAuth(user => {
    const admin = isAdmin(user);
    $('view-signin').hidden = admin;
    $('view-admin').hidden = !admin;
    stopAdmin();
    if (admin) startAdmin();
  });
}
