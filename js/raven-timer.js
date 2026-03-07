(() => {
  // DOM
  const intro = document.getElementById('intro');
  const setup = document.getElementById('setup');
  const play = document.getElementById('play');
  const btnBegin = document.getElementById('btn-begin');
  const addCommoner = document.getElementById('add-commoner');
  const removeCommoner = document.getElementById('remove-commoner');
  const commonersEl = document.getElementById('commoners');
  const btnStartGame = document.getElementById('btn-start-game');
  const editNames = document.getElementById('edit-names');

  const intervalMin = document.getElementById('interval-min');
  const intervalSec = document.getElementById('interval-sec');
  const timerToggle = document.getElementById('timer-toggle');
  const chanceDisplay = document.getElementById('chance-display');
  const countdown = document.getElementById('countdown');
  const callRavenBtn = document.getElementById('call-raven');
  const ravenContainer = document.getElementById('raven-container');
  const letterModal = document.getElementById('letter-modal');
  const letterContent = document.getElementById('letter-content');
  const letterNext = document.getElementById('letter-next');
  const rollLog = document.getElementById('roll-log');
  const btnReset = document.getElementById('btn-reset');

  let intervalId = null;
  let tickSeconds = 0;
  let chance = 0.5; // starts at 50%
  let timerOn = true;
  // players will be an array of objects: { name, baseWeight, effectiveWeight, skipped }
  let players = [];
  let inEvent = false;
  let _modalScrollHandler = null;
  let _modalResizeHandler = null;

  // Ensure at least 2 commoners so total >=4 (King+Hand+2 commoners)
  function ensureInitialCommoners(){
    const needed = 2 - commonersEl.children.length;
    for(let i=0;i<needed;i++) addCommonerRow();
  }

  function addCommonerRow(name=''){
    const idx = commonersEl.children.length + 1;
    const row = document.createElement('div');
    row.className = 'row commoner-row';
    const label = document.createElement('label');
    label.textContent = `People ${idx}`;
    const input = document.createElement('input');
    input.name = `commoner-${idx}`;
    input.placeholder = `Name`;
    input.value = name;
    row.appendChild(label);
    row.appendChild(input);
    commonersEl.appendChild(row);
  }

  function removeCommonerRow(){
    // do not allow fewer than 2 commoners
    if(commonersEl.children.length <= 2) return;
    commonersEl.removeChild(commonersEl.lastChild);
  }

  addCommoner.addEventListener('click', ()=>{ addCommonerRow(); scrollToBottomIfNeeded(); });
  removeCommoner.addEventListener('click', ()=>{ removeCommonerRow(); scrollToBottomIfNeeded(); });

  function scrollToBottomIfNeeded(){
    window.scrollTo({top:document.body.scrollHeight,behavior:'smooth'});
  }

  // Flow
  btnBegin.addEventListener('click', ()=>{
    intro.classList.add('hidden');
    setup.classList.remove('hidden');
    ensureInitialCommoners();
  });

  document.getElementById('edit-names').addEventListener('click', ()=>{
    // pause timer while editing
    stopTimer();
    play.classList.add('hidden');
    setup.classList.remove('hidden');
  });

  btnStartGame.addEventListener('click', ()=>{
    // collect names
    const king = document.querySelector('input[name=king]').value.trim() || 'King Unknown';
    const hand = document.querySelector('input[name=hand]').value.trim() || 'Hand Unknown';
    const commonerInputs = Array.from(commonersEl.querySelectorAll('input'));
    const commons = commonerInputs.map(i => i.value.trim() || 'Commoner');
    // initialize players with weights
    players = [king, hand, ...commons].map(n => ({ name: n, baseWeight: 4, effectiveWeight: 4, skipped: false }));
    renderWeightsPanel();

    setup.classList.add('hidden');
    play.classList.remove('hidden');

    // init chance and start timer immediately
    chance = 0.5;
    updateChanceDisplay();
    startTimer();
  });

  function formatCountdown(seconds){
    if(seconds >= 60){
      const m = Math.floor(seconds/60);
      const s = seconds % 60;
      return `${m}m ${s}s`;
    }
    return `${seconds}s`;
  }

  function startTimer(){
    stopTimer();
    timerOn = timerToggle.checked;
    if(!timerOn) {countdown.textContent = 'Off'; return}
    const mins = Math.max(0, parseInt(intervalMin && intervalMin.value,10) || 0);
    const secs = Math.max(0, parseInt(intervalSec && intervalSec.value,10) || 0);
    const totalSec = Math.max(1, (mins * 60) + secs);
    tickSeconds = totalSec;
    countdown.textContent = formatCountdown(tickSeconds);
    intervalId = setInterval(()=>{
      if(!timerToggle.checked) return;
      tickSeconds -= 1;
      countdown.textContent = formatCountdown(tickSeconds);
      if(tickSeconds <= 0){
        tickSeconds = totalSec;
        countdown.textContent = formatCountdown(tickSeconds);
        checkRavenRoll();
      }
    },1000);
  }

  function stopTimer(){
    if(intervalId) { clearInterval(intervalId); intervalId = null; }
    countdown.textContent = '—';
  }

  function updateChanceDisplay(){ chanceDisplay.textContent = Math.round(chance*100) + '%'; }

  // show 'debug' label for probability, keep percentage in title for hover
  function updateChanceDisplayDebug(){
    if(!chanceDisplay) return;
    chanceDisplay.textContent = 'debug';
    chanceDisplay.title = Math.round(chance*100) + '%';
  }

  function logRoll(rolledPct, thresholdPct, success){
    if(!rollLog) return;
    const d = document.createElement('div');
    d.className = 'roll-entry';
    const ok = success ? 'SUCCESS' : 'FAILED';
    const rolledComplement = 100 - rolledPct;
    const thresholdComplement = 100 - thresholdPct;
    d.textContent = `Rolled ${rolledComplement} — threshold ${thresholdComplement} — ${ok}`;
    rollLog.prepend(d);
    if(rollLog.children.length>8) rollLog.removeChild(rollLog.lastChild);
  }

  function checkRavenRoll(){
    if(inEvent) return;
    const r = Math.random();
    const rolled = Math.round(r*100);
    const thresh = Math.round(chance*100);
    const success = r < chance;
    logRoll(rolled, thresh, success);
    if(success){
      callRaven('auto');
    } else {
      chance = Math.min(1, chance + 0.1);
      updateChanceDisplay();
    }
  }

  function pickPerson(){
    if(players.length === 0) return null;
    // build list of eligible entries by effectiveWeight (>0)
    const entries = players.filter(p => (p.effectiveWeight || 0) > 0);
    if(entries.length === 0) return null;
    const total = entries.reduce((s,p) => s + (p.effectiveWeight||0), 0);
    let r = Math.random() * total;
    for(const p of entries){
      r -= p.effectiveWeight;
      if(r <= 0) return p;
    }
    return entries[entries.length-1];
  }

  function renderRaven(){
    ravenContainer.innerHTML = '';
    const raven = document.createElement('div');
    raven.className = 'raven';
    raven.innerHTML = `
      <svg viewBox="0 0 64 64" width="120" height="120" aria-hidden="true">
        <g fill="black">
          <path d="M12 36c4-8 18-12 28-10 0 0-6 6-4 10 3 6 12 6 14 8 0 0-12 6-26 6-14 0-20-12-12-20z"/>
          <circle cx="44" cy="20" r="2" fill="#fff" />
        </g>
      </svg>
    `;
    raven.addEventListener('click', ()=>openLetter());
    ravenContainer.appendChild(raven);
  }

  function clearRaven(){ ravenContainer.innerHTML = ''; }

  function callRaven(source='manual'){
    if(inEvent) return; // already active
    inEvent = true;
    stopTimer();
    chance = 0; updateChanceDisplay();
    renderRaven();
    const chosenObj = pickPerson();
    const chosen = chosenObj ? chosenObj.name : 'No One';
    // update weights according to rules:
    // - when someone is chosen, decrement their baseWeight by 1 (min 0)
    // - they are set to effectiveWeight 0 (skipped) so they cannot be chosen next immediate round
    // - any other player who was skipped becomes eligible again with effectiveWeight = baseWeight
    if(chosenObj){
      // first, any previously skipped (except the newly chosen) become unskipped
      players.forEach(p => {
        if(p.skipped && p !== chosenObj){
          p.skipped = false;
          p.effectiveWeight = p.baseWeight;
        }
      });
      // now apply chosen changes
      chosenObj.baseWeight = Math.max(0, (chosenObj.baseWeight || 0) - 1);
      chosenObj.effectiveWeight = 0;
      chosenObj.skipped = true;

      // global rule: if nobody has baseWeight === 4, increment everyone's baseWeight by 1 (cap at 4)
      const anyFull = players.some(p => p.baseWeight === 4);
      if(!anyFull){
        players.forEach(p => {
          p.baseWeight = Math.min(4, (p.baseWeight || 0) + 1);
          // do NOT change effectiveWeight if currently skipped (0)
          if(!p.skipped) p.effectiveWeight = p.baseWeight;
        });
      }
    }

    // update the debug weights panel so the UI reflects new values
    renderWeightsPanel();

    // prepare letter text
    letterContent.textContent = `Hear ye! By raven's beak and royal decree, ${chosen} is called to action: "Rise and answer the clarion of duty!"`;
    // show letter modal on first click of raven
    // we will wait for user to click raven which opens letter via click handler attached earlier
  }

  function openLetter(){
    // show modal and make overlay follow scroll
    if(!letterModal) return;
    // simply open modal; CSS `position:fixed` keeps it covering the viewport
    letterModal.classList.add('open');
  }

  letterNext.addEventListener('click', ()=>{
    // on first press, close letter and send raven away
    if(letterModal) {
      letterModal.classList.remove('open');
      // cleanup any inline styles (if present) and handlers
      try {
        if(_modalScrollHandler) { window.removeEventListener('scroll', _modalScrollHandler); _modalScrollHandler = null; }
        if(_modalResizeHandler) { window.removeEventListener('resize', _modalResizeHandler); _modalResizeHandler = null; }
      } catch (e) {}
      letterModal.style.position = '';
      letterModal.style.top = '';
      letterModal.style.left = '';
      letterModal.style.width = '';
      letterModal.style.height = '';
    }
    // raven leaves
    clearRaven();
    inEvent = false;
    // reset chance and resume timer
    chance = 0;
    updateChanceDisplay();
    startTimer();
  });

  callRavenBtn.addEventListener('click', ()=>{ callRaven('manual'); });
  // Reset button now logs a simple message
  if(btnReset){
    btnReset.addEventListener('click', ()=>{ chance = 0; updateChanceDisplayDebug();
      if(rollLog){ const m = document.createElement('div'); m.className='roll-entry'; m.textContent='Chance reset'; rollLog.prepend(m); }
      renderWeightsPanel();
    });
  }

  // weights panel UI (inserted under reset button)
  let weightsPanel = null;
  function createWeightsPanel(){
    if(!btnReset) return;
    weightsPanel = document.createElement('div');
    weightsPanel.className = 'weights-panel';
    btnReset.insertAdjacentElement('afterend', weightsPanel);
  }

  function renderWeightsPanel(){
    if(!weightsPanel) return;
    weightsPanel.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'weights-title';
    title.textContent = 'Players & Weights';
    weightsPanel.appendChild(title);
    if(!players || players.length === 0){
      const none = document.createElement('div'); none.textContent = 'No players'; weightsPanel.appendChild(none); return;
    }
    players.forEach(p => {
      const row = document.createElement('div');
      row.className = 'weights-row';
      const skipped = p.skipped ? ' (skipped)' : '';
      row.textContent = `${p.name} — base: ${p.baseWeight} — effective: ${p.effectiveWeight}${skipped}`;
      weightsPanel.appendChild(row);
    });
  }

  if(intervalMin) intervalMin.addEventListener('change', ()=>{ if(!inEvent) startTimer(); });
  if(intervalSec) intervalSec.addEventListener('change', ()=>{ if(!inEvent) startTimer(); });
  timerToggle.addEventListener('change', ()=>{ if(timerToggle.checked) startTimer(); else stopTimer(); });

  // initial setup
  ensureInitialCommoners();
  createWeightsPanel();

  // expose a small helper for manual opening from URL if desired
  window.__raven_start = ()=>{ intro.classList.add('hidden'); setup.classList.remove('hidden'); ensureInitialCommoners(); };

})();
