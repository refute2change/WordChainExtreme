const keyboardRows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

const levelconstraints = [{level:1, stages: [3]}, {level:2, stages: [3, 3]}, {level:3, stages: [3, 3, 3]},
                          {level:4, stages: [3, 4]}, {level:5, stages: [3, 4, 4]}, {level:6, stages: [4, 4, 4, 4]},
                          {level:7, stages: [5, 5]}, {level:8, stages: [4, 5, 4, 5]}, {level:9, stages: [3, 3, 4, 4, 5, 5]}];

// DOM elements
const startEl = document.getElementById('startWord');
const targetEl = document.getElementById('targetWord');
const historyEl = document.getElementById('history');
const msgEl = document.getElementById('message');
const playBtn = document.getElementById('play');
const invEl = document.getElementById('inventory');
const wordLength = document.getElementById('wordLength');
const moveBoxes = document.getElementById('moveBoxes');
const startBoxes = document.getElementById('startBoxes');
const targetBoxes = document.getElementById('targetBoxes');
let currentTyped = '';
let levels = []; //
let restrictedWords = [];
let wordsused = {3: [], 4: [], 5: []};
let historyString = '↪'; //
let currentStage = 0; //
const progressBar = document.getElementById('progressBar');
const stageContainer = document.getElementById('stageContainer');
const buttonTray = document.getElementById('buttons');
let currentLevelIndex = 0; //
let lengthOfWord;
let currentTotalStage = 0; //
let totalStages = 0; //
let LevelsCompleted = 0; //

// game state
let current = startEl.value;
let history = [current]; //
let inventory = {}; //
for (let i = 65; i <= 90; i++) {
  inventory[String.fromCharCode(i)] = 0;
}
const nextBtn = document.createElement('button');
nextBtn.setAttribute('id', 'nextBtn');
nextBtn.className = 'action-btn';
nextBtn.innerHTML = `<div class="count">next</div>`;
nextBtn.disabled = startEl.value !== targetEl.value && startEl.value !== '';
nextBtn.onclick = goNext; // call your existing next function
buttonTray.appendChild(nextBtn);
const resetBtn = document.createElement('button');
resetBtn.setAttribute('id', 'resetBtn');
resetBtn.className = 'action-btn';
resetBtn.innerHTML = `<div class="count">reset</div>`;
resetBtn.onclick = fullReset; // call your existing reset function
buttonTray.appendChild(resetBtn);
let word1, word2;

function goNext() {
  // const nextBtn = document.getElementById('nextBtn');
  // if (nextBtn.disabled) return;
  nextBtn.disabled = true;
  currentTotalStage++;
  currentStage++;
  if (currentStage == levelconstraints[currentLevelIndex].stages.length && currentLevelIndex < levels.length - 1) {
    currentLevelIndex++;
    currentStage = 0;
  }
  loadLevel();
  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

function renderHistory() {
  let i = 0;
  historyEl.innerHTML = '';
  history.forEach(w => {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `<div class="letter-box">${historyString[i]}</div><div>${w}</div>`;
    historyEl.appendChild(div);
    i++;
  });
}

function renderInventory() {
  invEl.innerHTML = '';

  for (const row of keyboardRows) {
    const rowDiv = document.createElement('div');
    rowDiv.className = 'inv-row';

    for (const letter of row) {
      // if (letter === 'Z')
      // {
      //   const nextBtn = document.createElement('button');
      //   nextBtn.setAttribute('id', 'nextBtn');
      //   nextBtn.className = 'inv-btn action-btn';
      //   nextBtn.innerHTML = `<div class="letter"></div><div class="count">next</div>`;
      //   nextBtn.disabled = startEl.value !== targetEl.value && startEl.value !== '';
      //   nextBtn.onclick = goNext; // call your existing reset function
      //   rowDiv.appendChild(nextBtn);
      // }
      const count = inventory[letter] ?? 0;

      const btn = document.createElement('button');
      btn.className = 'inv-btn';
      btn.disabled = count <= 0;

      btn.innerHTML = `
        <div class="letter">${letter}</div>
        <div class="count">${count}</div>
      `;

      btn.onclick = () => {
        if (currentTyped.length >= current.length) return;
        currentTyped += letter.toLowerCase();
        updateAllBoxes();
      };

      rowDiv.appendChild(btn);
    }

    invEl.appendChild(rowDiv);
  }

  // Backspace key at the end of last row
  const back = document.createElement('button');
  back.className = 'inv-btn backspace-btn';
  back.innerHTML = `
    <div class="letter">←</div>
    <div class="count">del</div>
  `;
  back.onclick = () => {
    currentTyped = currentTyped.slice(0, -1);
    updateAllBoxes();
  };

  invEl.lastElementChild.appendChild(back);
    // ▶ Play
  const playBtn = document.createElement('button');
  playBtn.className = 'inv-btn action-btn';
  playBtn.innerHTML = `<div class="letter">▶</div><div class="count">play</div>`;
  playBtn.onclick = playMove; // call your existing play function
  invEl.lastElementChild.appendChild(playBtn);

  // ↻ Reset

}

function oneLetterDiff(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) diff++;
  return diff === 1;
}

function findLetterDiff(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i];
}

function getChangedLetter(a, b) {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return b[i].toUpperCase();
  return null;
}

async function existsWordChain(startWord, targetWord) {
  // Load legalanswers.json for word list
  const resWords = await fetch('legalanswers.json');
  const groups = await resWords.json();
  const len = startWord.length;
  const wordList = groups[len];
  const wordToIndex = {};
  let i;
  wordList.forEach((w, i) => { wordToIndex[w] = i; });

  // Load adjacency list (already as list of indices)
  const resAdj = await fetch('legalanswersedgelist.json');
  const adjList1 = await resAdj.json(); // adjList[i] = [neighbors]
  const adjList = adjList1[len]; // get for specific length

  const startIdx = wordToIndex[startWord];
  const targetIdx = wordToIndex[targetWord];
  if (startIdx === undefined || targetIdx === undefined) return false;

  // BFS
  const visited = new Set();
  const queue = [startIdx];
  visited.add(startIdx);

  while (queue.length) {
    const curr = queue.shift();
    if (curr === targetIdx) return true;
    for (const neighbor of adjList[curr]) {
      i = wordList[neighbor];
      if (wordsused[len].includes(i)) continue; // skip used words
      if (restrictedWords.includes(i)) continue; // skip restricted words
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

async function playMove() {
  const w = currentTyped.trim().toLowerCase();
  if (!w) return setMsg('Type a word first.');
  if (w.length !== current.length) return setMsg(`Must be ${current.length} letters.`);

  try {
    const res = await fetch('legalanswers.json');
    const groups = await res.json();

    const len = lengthOfWord; // read current selection
    const list = new Set(groups[len]);

    if (!list.has(w)) return setMsg('Not in dictionary.');
  } catch (err) {
    console.error('Error loading legalanswers.json', err);
    return setMsg('Error loading dictionary.');
  }

  if (!oneLetterDiff(current, w)) return setMsg('Must change exactly 1 letter.');
  if (history.includes(w)) return setMsg('Already used.');
  if (wordsused[lengthOfWord].includes(w)) return setMsg('Already used.');
  if (restrictedWords.includes(w)) return setMsg('Word is reserved for future uses, please take another path.');
  const cost = getChangedLetter(current, w);
  if (!inventory[cost] || inventory[cost] <= 0) return setMsg(`No ${cost}s left.`);

  console.log(existsWordChain(w, targetEl.value));
  inventory[cost]--;
  current = w;
  history.push(w);
  historyString += cost;
  startEl.value = w;
  wordsused[lengthOfWord].push(w);
  currentTyped = '';
  nextBtn.disabled = startEl.value !== targetEl.value && startEl.value !== '';

  console.log(wordsused);

  renderHistory();
  renderInventory();
  updateAllBoxes();
  renderProgress();
  renderUsedWords();
  
  if (w === targetEl.value) {
    totalStages++;
    if (currentStage === levelconstraints[currentLevelIndex].stages.length - 1) {
      LevelsCompleted++;
    }
    setMsg('🎉 Reached target!');
  }
  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

function setMsg(t) { msgEl.textContent = t; }

document.onkeydown = e => {
  console.log(e.key);
  setMsg('');
  if (e.key === 'Backspace') {
    currentTyped = currentTyped.slice(0, -1);
    updateAllBoxes();
    console.log(currentTyped);
    return;
  }
  if (e.key === 'Enter') {
    playMove();
    return;
  }
  const letter = e.key.toUpperCase();
  if (letter.length === 1 && letter >= 'A' && letter <= 'Z' && currentTyped.length < current.length) {
    currentTyped += letter;
    console.log(currentTyped);
    updateAllBoxes();
  }
};

function renderUsedWords() {
  const wordsUsedEl = document.getElementById('wordsUsed');
  wordsUsedEl.innerHTML = '';
  const usedWords = wordsused[lengthOfWord] || [];
  usedWords.forEach(word => {
    const div = document.createElement('div');
    div.className = 'used-word-item';
    div.textContent = word;
    wordsUsedEl.appendChild(div);
  });
}

function renderWordBoxes(container, word, totalLength) {
  container.innerHTML = '';
  for (let i = 0; i < totalLength; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.textContent = word[i] ? word[i].toUpperCase() : '';
    if (startEl.value === targetEl.value) box.classList.add('completed');
    container.appendChild(box);
  }
}

function updateAllBoxes() {
  const len = parseInt(startEl.value.length, 10);
  renderWordBoxes(startBoxes, startEl.value, len);
  renderWordBoxes(targetBoxes, targetEl.value, len);
  renderWordBoxes(moveBoxes, currentTyped, len);
}

// Update whenever something changes
startEl.addEventListener('input', updateAllBoxes);
targetEl.addEventListener('input', updateAllBoxes);

async function existsWordChainByIndex(startIdx, targetIdx, potentialunused, len) {
  const resWords = await fetch('legalanswers.json');
  const groups = await resWords.json();
  const wordList = groups[len];

  const resAdj = await fetch('legalanswersedgelist.json');
  const adjList1 = await resAdj.json();
  const adjList = adjList1[len];

  const usedSet = new Set(potentialunused);

  const visited = new Set();
  // Each queue item: { idx, path }
  const queue = [{ idx: startIdx, path: [wordList[startIdx]] }];
  visited.add(startIdx);

  let i;
  while (queue.length) {
    const { idx: curr, path } = queue.shift();
    if (curr === targetIdx && path.length >= len) {
      // You can return path here if you want the chain
      return path;
    }
    for (const neighbor of adjList[curr]) {
      i = wordList[neighbor];
      if (restrictedWords.includes(i)) continue; // skip used words
      if (usedSet.has(neighbor)) continue;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ idx: neighbor, path: [...path, wordList[neighbor]] });
      }
    }
  }
  return false;
}

async function pickWords(groups, len, potentialunused) {
  const templist = groups[len];

  let index;
  do {
    index = Math.floor(Math.random() * templist.length);
  } while (templist[index].length < 2);

  const list = templist[index];
  if (!list || list.length < 2) {
    console.warn('Not enough words of length', len);
    return;
  }

  const i1 = Math.floor(Math.random() * list.length);
  let i2;
  do {
    i2 = Math.floor(Math.random() * list.length);
  } while (i2 === i1);

  if (restrictedWords.includes(list[i1]) || restrictedWords.includes(list[i2])) {
    return pickWords(groups, len); // try again
  }

  // existsWordChainByIndex is async, so we need to await its result
  // pickWords must be async to use await
  // If a chain exists, we want to try again
  // So, change pickWords to async and use await here
  // Example:
  // if (await existsWordChainByIndex(i1, i2, potentialunused, len)) {
  //   return await pickWords(groups, len, potentialunused); // try again
  // }

  // Note: You must update the pickWords function definition to be async:
  // async function pickWords(groups, len, potentialunused) { ... }
  word1 = list[i1];
  word2 = list[i2];

  const resWords = await fetch('legalanswers.json');
  const groups = await resWords.json();
  const wordList = groups[len];

  let index1 = wordList.indexOf(word1);
  let index2 = wordList.indexOf(word2);

  if (existsWordChainByIndex(index1, index2, potentialunused, len)) {
    return pickWords(groups, len, potentialunused); // try again
  }

  word1 = list[i1];
  word2 = list[i2];
  console.log(`Chosen words:`, word1, word2);
  return {"start": word1, "target": word2, "chain": existsWordChainByIndex(i1, i2, potentialunused, len)};
}

async function createLevels()
{
  currentLevelIndex = 0;
  currentStage = 0;
  currentTotalStage = 0; //
  totalStages = 0; //
  LevelsCompleted = 0; //
  restrictedWords = [];
  wordsused = {3:[], 4:[], 5:[]};
  potentialunused = {3:[], 4:[], 5:[]};
  const res = await fetch('answerscompartments.json');
  const groups = await res.json();
  levels = [];
  let i;
  for (const lvl of levelconstraints)
  {
    i = lvl.level;
    let words = [];
    for (const stageLen of lvl.stages)
    {
      let res = pickWords(groups, stageLen, potentialunused[stageLen]);
      restrictedWords.push(res.start);
      restrictedWords.push(res.target);
      potentialunused[stageLen].push(...res.chain);
      res = {"start": res.start, "target": res.target};
      words.push(res);
      console.log(`Level ${i} Stage with length ${stageLen} is done.`);
    }
    levels.push({level: i, words: words});
  }
  console.log('Created levels:', levels);
  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

async function chooseWords() {
  const res = await fetch('answerscompartments.json');
  const groups = await res.json();

  const chosenWords = pickWords(groups, wordLength.value);

  word1 = chosenWords.start;
  word2 = chosenWords.target;

  startEl.value = word1;
  targetEl.value = word2;

  current = word1;
  history = [];
  historyString = "↪";
  history.push(word1);

  currentTyped = '';
  inventory = {};
  for (let i = 65; i <= 90; i++) inventory[String.fromCharCode(i)] = 1000;
  renderHistory();
  renderInventory();
  setMsg('');
  updateAllBoxes();
  renderUsedWords();
}

function handleReset() {
  chooseWords();
  renderHistory();
  renderInventory();
  setMsg('');
  updateAllBoxes();
};

function setup(words) {
  startEl.value = words.start;
  targetEl.value = words.target;
  lengthOfWord = words.start.length;
  wordsused[lengthOfWord].push(startEl.value);
  current = words.start;
  history = [current];
  historyString = '↪';
  currentTyped = '';
  if (currentStage === 0)
  {
    let lv = levels[currentLevelIndex];
    if ("inventory" in lv)
    {
      for (const key in lv.inventory)
      {
        inventory[key] = (inventory[key] ?? 0) + lv.inventory[key];
      }
    }
    else for (let i = 65; i <= 90; i++) {
        inventory[String.fromCharCode(i)] = 1000;
      }
  }
  renderHistory();
  renderInventory();
  setMsg('');
  renderProgress();
  updateAllBoxes();
  renderUsedWords();
  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

function loadLevel() {
  renderProgress();
  console.log(levels[currentLevelIndex].words[currentStage]);
  setup(levels[currentLevelIndex].words[currentStage]);
  highlightProgress(currentLevelIndex);
}

function createState() {
  return {
    levels,
    currentLevelIndex,
    currentStage,
    currentTotalStage,
    totalStages,
    LevelsCompleted,
    history,
    historyString,
    inventory,
    wordsused
  };
}

function renderProgress() {
  progressBar.innerHTML = '';

  for (let index = 0; index < levels.length; index++) {
    const lv = levels[index];

    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-node';

    // big circle for level
    const levelBtn = document.createElement('div');
    levelBtn.className = 'level-circle';
    levelBtn.textContent = lv.level;

    if (index < currentLevelIndex) {
      levelBtn.classList.add('completed');
    }

    if (index === currentLevelIndex) {
      if (currentStage === levels[currentLevelIndex].words.length - 1 && startEl.value === targetEl.value) levelBtn.classList.add('completed');
      else levelBtn.classList.add('active');
    }

    levelDiv.appendChild(levelBtn);
    progressBar.appendChild(levelDiv);
  }

  // initial stage dots
  renderStageDots(currentLevelIndex);
}

function renderStageDots(levelIndex) {
  stageContainer.innerHTML = '';

  const lv = levels[levelIndex];
  const stagesDiv = document.createElement('div');
  stagesDiv.className = 'stage-row';

  for (let si = 0; si < lv.words.length; si++) {
    const stage = document.createElement('div');
    stage.className = 'stage-dot';
    stage.textContent = si + 1;
    if (si < currentStage) stage.classList.add('completed');
    else if (si === currentStage)
    {
      if (startEl.value === targetEl.value) stage.classList.add('completed');
      else stage.classList.add('active');
    }
    stagesDiv.appendChild(stage);
  }

  stageContainer.appendChild(stagesDiv);
}

function highlightProgress(index) {
  return;
}

function loadGameState() {
  const savedState = localStorage.getItem('wordChainState');
  if (!savedState) return false;
  try {
    const state = JSON.parse(savedState);
    levels = state.levels || [];
    currentLevelIndex = state.currentLevelIndex || 0;
    currentStage = state.currentStage || 0;
    currentTotalStage = state.currentTotalStage || 0;
    totalStages = state.totalStages || 0;
    LevelsCompleted = state.LevelsCompleted || 0;
    history = state.history || [];
    historyString = state.historyString || '↪';
    wordsused = state.wordsused;
    inventory = state.inventory || {};
    current = history[history.length - 1] || '';
    startEl.value = current;
    targetEl.value = levels[currentLevelIndex].words[currentStage].target;
    currentTyped = '';
    lengthOfWord = current.length;
    renderHistory();
    renderInventory();
    renderProgress();
    updateAllBoxes();
    setMsg('');
    renderUsedWords();
    for (const key in levels) {
      for (const words in levels[key].words) {
        restrictedWords.push(words.start);
        restrictedWords.push(words.target);
      }
    }
    return true;
  }
  catch (err) {
    console.error('Error loading game state:', err);
    return false;
  }
}

async function fullReset() {
  nextBtn.disabled = true;
  await createLevels();
  loadLevel();
}

async function init() {
  let loaded = loadGameState();
  console.log(loaded);
  if (loaded) return;
  localStorage.removeItem('wordChainGame');
  fullReset();
}

init();