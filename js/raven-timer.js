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

  // Audio assets: prefer Web Audio API (attempt mixing), fall back to HTMLAudio
  const _AudioContext = window.AudioContext || window.webkitAudioContext || null;
  let audioCtx = null;
  const audioBuffers = {}; // name -> AudioBuffer
  const loopSources = {};  // name -> { source, gain }
  const playingSources = {}; // name -> { source, gain } for one-shot WebAudio playback that may need early stopping
  const fallbackAudio = {}; // name -> HTMLAudio element
  let soundEnabled = true; // user can toggle site audio

  // preload fallback HTMLAudio elements (used if WebAudio unavailable)
  try{ fallbackAudio.newHand = new Audio('newHand.mp3'); fallbackAudio.newHand.loop = false; }catch(e){ fallbackAudio.newHand = null; }
  try{ fallbackAudio.raven = new Audio('raven.mp3'); fallbackAudio.raven.loop = true; }catch(e){ fallbackAudio.raven = null; }
  try{ fallbackAudio.scroll = new Audio('ScrollOpen.mp3'); fallbackAudio.scroll.loop = false; }catch(e){ fallbackAudio.scroll = null; }

  // initialize AudioContext and fetch buffers (called lazily when needed)
  async function _ensureAudioContext(){
    if(!soundEnabled) return;
    if(!_AudioContext) return;
    if(!audioCtx) {
      try{
        audioCtx = new _AudioContext();
      }catch(e){ audioCtx = null; }
    }
    if(!audioCtx) return;
    const toLoad = [ ['newHand','newHand.mp3'], ['raven','raven.mp3'], ['scroll','ScrollOpen.mp3'] ];
    await Promise.all(toLoad.map(async ([name,url])=>{
      if(audioBuffers[name]) return;
      try{
        const resp = await fetch(url);
        const arr = await resp.arrayBuffer();
        audioBuffers[name] = await audioCtx.decodeAudioData(arr.slice(0));
      }catch(e){ audioBuffers[name] = null; }
    }));
  }

  function _playNamed(name, opts){
    if(!soundEnabled) return;
    // prefer WebAudio when available and buffers loaded
    if(audioCtx && audioBuffers[name]){
      try{
        const src = audioCtx.createBufferSource();
        src.buffer = audioBuffers[name];
        const gain = audioCtx.createGain();
        src.connect(gain);
        gain.connect(audioCtx.destination);
        if(opts && opts.loop) src.loop = true;
        src.start(0);
        if(opts && opts.loop){
          // store reference so we can stop it
          loopSources[name] = { source: src, gain };
        } else {
          // store reference for one-shot so it can be stopped early if needed
          playingSources[name] = { source: src, gain };
          src.onended = ()=>{
            try{ src.disconnect(); gain.disconnect(); }catch(e){}
            try{ playingSources[name] = null; }catch(e){}
          };
        }
      }catch(e){ /* fallthrough to fallback */ }
      return;
    }
    // fallback: HTMLAudio element
    const el = fallbackAudio[name];
    if(!el) return;
    try{ const p = el.play(); if(p && p.catch) p.catch(()=>{}); }catch(e){}
  }

  function _stopNamed(name){
    // stop looped WebAudio source if present
    if(loopSources[name] && loopSources[name].source){
      try{ loopSources[name].source.stop(0); loopSources[name].source.disconnect(); loopSources[name].gain.disconnect(); }catch(e){}
      loopSources[name] = null;
      return;
    }
    // stop one-shot WebAudio sources if present (e.g., newHand played via WebAudio)
    if(playingSources[name] && playingSources[name].source){
      try{ playingSources[name].source.stop(0); playingSources[name].source.disconnect(); playingSources[name].gain.disconnect(); }catch(e){}
      playingSources[name] = null;
      return;
    }
    // fallback: HTMLAudio element
    const el = fallbackAudio[name];
    if(!el) return;
    try{ el.pause(); el.currentTime = 0; }catch(e){}
  }

  // public wrapper used in code below: ensures audio context started then plays
  function _playAudioNamed(name, opts){
    if(!soundEnabled) return;
    // try to initialize audio context and buffers (but don't block UI)
    if(_AudioContext && !audioCtx){ _ensureAudioContext().catch(()=>{}); }
    // if context is suspended (requires user gesture), attempt resume on next gesture; best-effort
    if(audioCtx && audioCtx.state === 'suspended'){
      try{ audioCtx.resume().catch(()=>{}); }catch(e){}
    }
    _playNamed(name, opts);
  }

  function _stopAudioNamed(name){ _stopNamed(name); }

  let intervalId = null;
  let tickSeconds = 0;
  let chance = 0.5; // starts at 50%
  let timerOn = true;
  // players will be an array of objects: { name, baseWeight, effectiveWeight, skipped }
  let players = [];
  let inEvent = false;
  let _modalScrollHandler = null;
  let _modalResizeHandler = null;
  // hand-change (purple raven) hourly timer/state
  let handChangeIntervalId = null;
  let handChangeMode = false;
  const STORAGE_KEYS = {
    NAMES: 'raven_names_v1',
    GAME: 'raven_game_v1'
  };

  // helper to render letter text with an embellished initial
  function setLetterText(txt){
    if(!letterContent) return;
    const safe = String(txt || '');
    const first = safe.charAt(0) || '';
    const rest = safe.slice(1);
    letterContent.innerHTML = `<p><span class="initial">${first}</span>${rest}</p>`;
  }

  // escape HTML to avoid injection when inserting names into innerHTML
  function escapeHtml(s){
    return String(s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/\"/g,'&quot;')
      .replace(/'/g,'&#39;');
  }

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
    // autosave names when edited
    input.addEventListener('input', ()=>{ saveNames(); });
    row.appendChild(label);
    row.appendChild(input);
    commonersEl.appendChild(row);
  }

  function removeCommonerRow(){
    // do not allow fewer than 2 commoners
    if(commonersEl.children.length <= 2) return;
    commonersEl.removeChild(commonersEl.lastChild);
    saveNames();
  }

  addCommoner.addEventListener('click', ()=>{ addCommonerRow(); scrollToBottomIfNeeded(); });
  removeCommoner.addEventListener('click', ()=>{ removeCommonerRow(); scrollToBottomIfNeeded(); });

  // save name edits for king/hand
  const kingInput = document.querySelector('input[name=king]');
  const handInput = document.querySelector('input[name=hand]');
  if(kingInput) kingInput.addEventListener('input', ()=>{ saveNames(); });
  if(handInput) handInput.addEventListener('input', ()=>{ saveNames(); });

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

    // persist names and initial game state
    saveNames({ king, hand, commons });
    saveGameState();

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

  // ----- Persistence helpers -----
  function saveNames(obj){
    // obj optional; if not provided, read from DOM
    try{
      let payload = obj;
      if(!payload){
        const king = (document.querySelector('input[name=king]') && document.querySelector('input[name=king]').value.trim()) || '';
        const hand = (document.querySelector('input[name=hand]') && document.querySelector('input[name=hand]').value.trim()) || '';
        const commonerInputs = Array.from(commonersEl.querySelectorAll('input'));
        const commons = commonerInputs.map(i => i.value.trim() || '');
        payload = { king, hand, commons };
      }
      localStorage.setItem(STORAGE_KEYS.NAMES, JSON.stringify(payload));
    }catch(e){}
  }

  function loadNames(){
    try{
      const raw = localStorage.getItem(STORAGE_KEYS.NAMES);
      if(!raw) return;
      const data = JSON.parse(raw);
      if(!data) return;
      // set king/hand
      const kingEl = document.querySelector('input[name=king]');
      const handEl = document.querySelector('input[name=hand]');
      if(kingEl && data.king) kingEl.value = data.king;
      if(handEl && data.hand) handEl.value = data.hand;
      // set commoners: ensure enough rows
      const commons = Array.isArray(data.commons) ? data.commons : [];
      // remove all existing commoner rows then recreate to match saved
      commonersEl.innerHTML = '';
      commons.forEach(c => addCommonerRow(c || ''));
      // ensure minimum count
      ensureInitialCommoners();
    }catch(e){}
  }

  function saveGameState(){
    try{
      const state = {
        players: players || [],
        chance: chance || 0,
        tickSeconds: tickSeconds || 0,
        timerOn: timerToggle ? timerToggle.checked : true,
        intervalMin: intervalMin ? intervalMin.value : '0',
        intervalSec: intervalSec ? intervalSec.value : '0',
        inEvent: !!inEvent,
        timestamp: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.GAME, JSON.stringify(state));
    }catch(e){}
  }

  function loadGameState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEYS.GAME);
      if(!raw) return;
      const s = JSON.parse(raw);
      if(!s) return;
      // restore players (ensure proper fields exist)
      players = (s.players || []).map(p => ({
        name: p.name || 'Unknown',
        baseWeight: typeof p.baseWeight === 'number' ? p.baseWeight : 4,
        effectiveWeight: typeof p.effectiveWeight === 'number' ? p.effectiveWeight : (p.baseWeight || 4),
        skipped: !!p.skipped
      }));
      chance = typeof s.chance === 'number' ? s.chance : 0.5;
      tickSeconds = typeof s.tickSeconds === 'number' ? s.tickSeconds : 0;
      if(intervalMin && typeof s.intervalMin !== 'undefined') intervalMin.value = s.intervalMin;
      if(intervalSec && typeof s.intervalSec !== 'undefined') intervalSec.value = s.intervalSec;
      if(timerToggle) timerToggle.checked = !!s.timerOn;

      // if there are players, go to play screen
      if(players && players.length){
        intro.classList.add('hidden');
        setup.classList.add('hidden');
        play.classList.remove('hidden');
        renderWeightsPanel();
        updateChanceDisplay();
        // if we were in an event, render raven and stop timer
        inEvent = !!s.inEvent;
        if(inEvent){ renderRaven(); stopTimer(); }
        else { startTimer(); }
      }
    }catch(e){}
  }

  function clearSavedGame(){
    try{ localStorage.removeItem(STORAGE_KEYS.GAME); }catch(e){}
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

  // --- Purple raven: hourly hand-change event ---
  function renderPurpleRaven(){
    ravenContainer.innerHTML = '';
    const raven = document.createElement('div');
    raven.className = 'raven purple-raven';
    raven.innerHTML = `
      <svg viewBox="0 0 64 64" width="140" height="140" aria-hidden="true">
        <g fill="purple">
          <path d="M12 36c4-8 18-12 28-10 0 0-6 6-4 10 3 6 12 6 14 8 0 0-12 6-26 6-14 0-20-12-12-20z"/>
          <circle cx="44" cy="20" r="2" fill="#fff" />
        </g>
      </svg>
    `;
    raven.addEventListener('click', ()=>{
      openHandChangeLetter();
    });
    ravenContainer.appendChild(raven);
    // play newHand once for purple raven appearance
    _stopAudioNamed('raven');
    _playAudioNamed('newHand');
  }

  function startHandChangeTimer(){
    stopHandChangeTimer();
    // every hour
    handChangeIntervalId = setInterval(()=>{ if(!inEvent) triggerPurpleHandChange('auto'); }, 3600000);
  }

  function stopHandChangeTimer(){ if(handChangeIntervalId){ clearInterval(handChangeIntervalId); handChangeIntervalId = null; } }

  function triggerPurpleHandChange(source='manual'){
    if(inEvent) return;
    inEvent = true;
    handChangeMode = false; // will set when raven clicked
    // pause normal timers
    stopTimer();
    stopHandChangeTimer();
    // render purple raven only; it must be clicked to show the message
    renderPurpleRaven();
  }

  function openHandChangeLetter(){
    if(!letterModal) return;
    handChangeMode = true;
    // simple message only
    setLetterText('A new Hand must be chosen.');
    // ensure next button enabled
    if(letterNext) { letterNext.disabled = false; }
    // stop any playing new-hand audio and play scroll once
    _stopAudioNamed('newHand');
    _playAudioNamed('scroll');
    letterModal.classList.add('open');
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
      saveGameState();
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
    // start black raven loop audio
    _stopAudioNamed('newHand');
    _playAudioNamed('raven',{loop:true});
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
    // persist updated game state
    saveGameState();

    // prepare letter text (bold the chosen name)
    setLetterText(`Hear ye! By raven's beak and royal decree, <strong>${escapeHtml(chosen)}</strong> is called to action: "Rise and answer the clarion of duty!"`);
    // show letter modal on first click of raven
    // we will wait for user to click raven which opens letter via click handler attached earlier
  }

  function openLetter(){
    // show modal and make overlay follow scroll
    if(!letterModal) return;
    // stop black raven audio immediately and play scroll once
    _stopAudioNamed('raven');
    _playAudioNamed('scroll');
    // simply open modal; CSS `position:fixed` keeps it covering the viewport
    letterModal.classList.add('open');
  }

  letterNext.addEventListener('click', ()=>{
    // If this was the purple hand-change event, just dismiss message and resume
    if(handChangeMode){
      if(letterModal) {
        letterModal.classList.remove('open');
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
      clearRaven();
      handChangeMode = false;
      inEvent = false;
      // resume normal timers
      startHandChangeTimer();
      startTimer();
      saveGameState();
      return;
    }

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
    saveGameState();
  });

  callRavenBtn.addEventListener('click', ()=>{ callRaven('manual'); });
  // Restore original Reset Chance behavior on existing reset button
  if(btnReset){
    btnReset.addEventListener('click', ()=>{
      chance = 0; updateChanceDisplayDebug();
      if(rollLog){ const m = document.createElement('div'); m.className='roll-entry'; m.textContent='Chance reset'; rollLog.prepend(m); }
      renderWeightsPanel();
      saveGameState();
    });
  }

  // Debug: trigger hand change (purple raven)
  (function createTriggerHandChangeButton(){
    try{
      if(!btnReset) return;
      if(document.getElementById('btn-trigger-hand-change')) return;
      const b = document.createElement('button');
      b.id = 'btn-trigger-hand-change';
      b.type = 'button';
      b.textContent = 'trigger hand change';
      b.style.marginLeft = '8px';
      b.style.padding = '8px 10px';
      b.style.cursor = 'pointer';
      btnReset.insertAdjacentElement('afterend', b);
      b.addEventListener('click', ()=>{ triggerPurpleHandChange('debug'); });
    }catch(e){}
  })();

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
  // load persisted names first so inputs reflect saved list
  loadNames();
  // then restore any running game
  loadGameState();

  // start hourly hand-change timer
  startHandChangeTimer();

  // create a dedicated "Reset Game" button (preserve saved names) placed after the "Change List Names" control
  (function createResetGameButton(){
    try{
      if(!editNames) return;
      // avoid duplicating if already created
      if(document.getElementById('btn-reset-game')) return;
      const btn = document.createElement('button');
      btn.id = 'btn-reset-game';
      btn.type = 'button';
      btn.textContent = 'Reset Game';
      // styling: reddish and noticeable (inline as quick solution)
      btn.style.background = '#c0392b';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.padding = '10px 14px';
      btn.style.marginLeft = '8px';
      btn.style.borderRadius = '4px';
      btn.style.cursor = 'pointer';
      btn.style.boxShadow = '0 1px 0 rgba(0,0,0,0.2)';
      // insert after editNames
      editNames.insertAdjacentElement('afterend', btn);

      // small site-audio toggle
      const audioToggleWrap = document.createElement('label');
      audioToggleWrap.style.marginLeft = '8px';
      audioToggleWrap.style.cursor = 'pointer';
      audioToggleWrap.title = 'Toggle site audio (attempt mixing via WebAudio)';
      const chk = document.createElement('input');
      chk.type = 'checkbox'; chk.checked = true; chk.style.marginRight = '6px';
      audioToggleWrap.appendChild(chk);
      const txt = document.createTextNode('Site audio');
      audioToggleWrap.appendChild(txt);
      btn.insertAdjacentElement('afterend', audioToggleWrap);
      chk.addEventListener('change', (e)=>{
        soundEnabled = !!chk.checked;
        if(soundEnabled && _AudioContext){ _ensureAudioContext().catch(()=>{}); }
        if(!soundEnabled){
          // stop any playing sounds
          _stopAudioNamed('raven'); _stopAudioNamed('newHand'); _stopAudioNamed('scroll');
        }
      });

      btn.addEventListener('click', (e)=>{
        // confirmation to make accidental clicks harder
        const ok = window.confirm('Are you sure you want to reset the current game? This will return to the start screen but will keep the saved names.');
        if(!ok) return;
        // perform reset (preserve saved names)
        stopTimer();
        inEvent = false;
        players = [];
        chance = 0.5;
        tickSeconds = 0;
        renderWeightsPanel();
        updateChanceDisplay();
        clearSavedGame();
        intro.classList.remove('hidden');
        setup.classList.add('hidden');
        play.classList.add('hidden');
      });
    }catch(e){}
  })();

  // autosave on page hide/unload
  window.addEventListener('pagehide', ()=>{ saveNames(); saveGameState(); });
  window.addEventListener('beforeunload', ()=>{ saveNames(); saveGameState(); });

  // expose a small helper for manual opening from URL if desired
  window.__raven_start = ()=>{ intro.classList.add('hidden'); setup.classList.remove('hidden'); ensureInitialCommoners(); };

})();
