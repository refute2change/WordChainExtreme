const keyboardRows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

const levelconstraints = [{level:1, stages: [3]}, {level:2, stages: [3, 3]}, {level:3, stages: [3, 3, 3]},
                          {level:4, stages: [3, 4]}, {level:5, stages: [3, 4, 4]}, {level:6, stages: [4, 4, 4, 4]},
                          {level:7, stages: [5, 5]}, {level:8, stages: [4, 5, 4, 5]}, {level:9, stages: [3, 3, 4, 4, 5, 5]}];

// const minimumLength = [{level:1, stages: [3]}, {level:2, stages: [3, 3]}, {level:3, stages: [3, 4, 5]},
//                       {level:4, stages: [4, 4]}, {level:5, stages: [4, 4, 5]}, {level:6, stages: [4, 4, 5, 6]},
//                       {level:7, stages: [5, 6]}, {level:8, stages: [5, 5, 6, 6]}, {level:9, stages: [5, 6, 6, 7, 8, 10]}];

const minimumLength = [{level:1, stages: [3]}, {level:2, stages: [3, 3]}, {level:3, stages: [3, 4, 5]},
                      {level:4, stages: [3, 3]}, {level:5, stages: [4, 4, 4]}, {level:6, stages: [4, 4, 5, 6]},
                      {level:7, stages: [3, 4]}, {level:8, stages: [4, 4, 5, 5]}, {level:9, stages: [5, 6, 6, 7, 7, 7]}];

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
const repetitiveAssist = document.getElementById('assistToggle');
const switchLabel = document.getElementById('assistLabel');
const wordsUsedEl = document.getElementById('wordsUsed');
if (repetitiveAssist.checked) switchLabel.classList.remove('inactive');
else switchLabel.classList.add('inactive');
repetitiveAssist.onchange = () => {
  if (repetitiveAssist.checked) switchLabel.classList.remove('inactive');
  else switchLabel.classList.add('inactive');
  renderAssist();
}
let currentTyped = '';
let levels = []; //
let finished = false;
let restrictedWords = [];
let wordsused = {3: [], 4: [], 5: []};
let originalOrder = []; // store the natural order for reverting
let potential = [];
let nonPotential = [];
let historyString = '↪'; //
let title = "WORDCHAIN";
let currentStage = 0; //
const progressBar = document.getElementById('progressBar');
const stageContainer = document.getElementById('stageContainer');
const buttonTray = document.getElementById('buttons');
let currentLevelIndex = 0; //
let lengthOfWord;
let currentTotalStage = 0; //
let totalStages = 0; //
let LevelsCompleted = 0; //
let wayout = true; //

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

function resetoriginalOrder() {
  originalOrder = [];
  const usedWords = wordsused[lengthOfWord] || [];
  usedWords.forEach(word => {
    const div = document.createElement('div');
    div.className = 'used-word-item';
    div.textContent = word;
    originalOrder.push(div);
  });
}

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
  console.log(totalStages, history.length);
  if (totalStages == 0 && history.length == 1) historyEl.classList.add('inactive');
  else historyEl.classList.remove('inactive');
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
      `;

      btn.onclick = () => {
        if (currentTyped.length >= current.length) return;
        if (finished) return;
        currentTyped += letter.toLowerCase();
        updateAllBoxes();
        renderAssist();
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
  `;
  back.onclick = () => {
    currentTyped = currentTyped.slice(0, -1);
    updateAllBoxes();
    renderAssist();
  };

  invEl.lastElementChild.appendChild(back);
    // ▶ Play
  const playBtn = document.createElement('button');
  playBtn.className = 'inv-btn action-btn';
  playBtn.innerHTML = `<div class="letter">▶</div>`;
  playBtn.onclick = playMove; // call your existing play function
  invEl.lastElementChild.appendChild(playBtn);

  // ↻ Reset

}

// function renderAssist() {
//   if (!repetitiveAssist.checked) {
//     for (const el of wordsUsedEl.children) {
//       el.classList.remove('potential');
//       el.classList.remove('disappear');
//     }
//     return;
//   }

//   if (currentTyped.length === 0) {
//     for (const el of wordsUsedEl.children) {
//       el.classList.remove('potential');
//       el.classList.remove('disappear');
//     }
//     return;
//   }

//   // Collect potential and non-potential elements
//   const potential = [];
//   const nonPotential = [];
//   for (const el of wordsUsedEl.children) {
//     if (el.textContent.startsWith(currentTyped.toLowerCase())) {
//       el.classList.add('potential');
//       el.classList.add('moving');
//       potential.push(el);
//     } else {
//       el.classList.remove('potential');
//       el.classList.add('disappear');
//       nonPotential.push(el);
//     }
//   }

//   reorderPotentialWords();

//   // // Reorder: potential matches first
//   // wordsUsedEl.innerHTML = '';
//   // for (const el of potential) wordsUsedEl.appendChild(el);
//   // for (const el of nonPotential) wordsUsedEl.appendChild(el);
// }

// function reorderPotentialWords() {
//   const potentials = wordsUsedEl.querySelectorAll('.used-word-item.potential');
//   potentials.forEach(p => wordsUsedEl.prepend(p));
// }

function renderAssist() {
  //return;
  // Save the original order once
  if (originalOrder.length === 0) {
    originalOrder = Array.from(wordsUsedEl.children);
  }

  // --- Case 1: Assist off or no text typed ---
  if (!repetitiveAssist.checked || currentTyped.length === 0) {
    if (originalOrder.length > 0) {
      animateReorderBack(wordsUsedEl, originalOrder);

      // Wait for all transitions to finish before updating classes
      Promise.all(
        Array.from(wordsUsedEl.children).map(el =>
          new Promise(resolve => {
            el.addEventListener('transitionend', resolve, { once: true });
          })
        )
      ).then(() => {
        for (const el of wordsUsedEl.children) {
          el.classList.remove('potential', 'disappear', 'moving', 'match');
          el.style.transition = '';
          el.style.transform = '';
        }
      });
    } else {
      for (const el of wordsUsedEl.children) {
        el.classList.remove('potential', 'disappear', 'moving', 'match');
        el.style.transition = '';
        el.style.transform = '';
      }
    }
    return;
  }

  // --- Case 2: Assist on and something typed ---
  potential = [];
  nonPotential = [];
  for (const el of originalOrder) {
    if (el.textContent.startsWith(currentTyped.toLowerCase())) {
      potential.push(el);
    } else {
      nonPotential.push(el);
    }
  }

  potential.reverse();

  // Animate reorder first, then update classes after transition
  animateReorder(wordsUsedEl, potential);

  // Wait for the animation to finish before updating classes
  // Use a Promise to wait for all transitions
  Promise.all(
    Array.from(wordsUsedEl.children).map(el =>
      new Promise(resolve => {
        el.addEventListener('transitionend', resolve, { once: true });
      })
    )
  ).then(() => {
    for (let el of potential) {
      if (currentTyped.length !== lengthOfWord) {
        el.classList.remove('match');
        el.classList.add('potential');
      }
      else {
        el.classList.remove('potential');
        el.classList.add('match');
      }
      el.classList.remove('disappear');
    }
    for (let el of nonPotential) {
      el.classList.remove('potential');
      el.classList.remove('match');
      el.classList.add('disappear');
    }
  });

  // // First reorder, then update classes
  // for (let el of potential) {
  //   el.classList.add('potential');
  //   el.classList.remove('disappear');
  // }
  // for (let el of nonPotential) {
  //   el.classList.remove('potential');
  //   el.classList.add('disappear');
  // }
}

// ---- Smooth forward animation (bring potential to start) ----
function animateReorder(container, potentialList) {
  const items = Array.from(container.children);

  // Record current positions
  const firstRects = new Map(items.map(el => [el, el.getBoundingClientRect()]));

  // Move potential items to the front
  potentialList.forEach(p => container.prepend(p));

  requestAnimationFrame(() => {
    const lastRects = new Map(items.map(el => [el, el.getBoundingClientRect()]));

    items.forEach(el => {
      const first = firstRects.get(el);
      const last = lastRects.get(el);
      if (!first || !last) return;

      const dx = first.left - last.left;
      const dy = first.top - last.top;

      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'none';
      el.getBoundingClientRect(); // force reflow

      el.style.transition = 'transform 1s ease';
      el.style.transform = '';

      el.addEventListener('transitionend', () => {
        el.style.transition = '';
      }, { once: true });
    });
  });
}

// ---- Smooth reverse animation (return to original order) ----
function animateReorderBack(container, originalOrder) {
  const items = Array.from(container.children);

  const firstRects = new Map(items.map(el => [el, el.getBoundingClientRect()]));

  // Restore original DOM order
  originalOrder.forEach(el => container.appendChild(el));

  requestAnimationFrame(() => {
    const lastRects = new Map(items.map(el => [el, el.getBoundingClientRect()]));

    items.forEach(el => {
      const first = firstRects.get(el);
      const last = lastRects.get(el);
      if (!first || !last) return;

      const dx = first.left - last.left;
      const dy = first.top - last.top;

      el.style.transform = `translate(${dx}px, ${dy}px)`;
      el.style.transition = 'none';
      el.getBoundingClientRect();

      el.style.transition = 'transform 1s ease';
      el.style.transform = '';

      el.addEventListener('transitionend', () => {
        el.style.transition = '';
      }, { once: true });
    });
  });
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
      if (wordsused[len].includes(i))
      {
        if (i !== targetEl.value) continue; // skip used words
      }
      // if (restrictedWords.includes(i) && i !== targetEl.value) continue; // skip restricted words
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
  if (wordsused[lengthOfWord].includes(w) && w !== targetEl.value) return setMsg('Already used.');
  // if (restrictedWords.includes(w) && w !== targetEl.value) return setMsg('Word is reserved for future uses, please take another path.');
  const cost = getChangedLetter(current, w);
  if (!inventory[cost] || inventory[cost] <= 0) return setMsg(`No ${cost}s left.`);

  console.log(existsWordChain(w, targetEl.value));
  inventory[cost]--;
  current = w;
  history.push(w);
  historyString += cost;
  startEl.value = w;
  if (!wordsused[lengthOfWord].includes(w)) wordsused[lengthOfWord].push(w);
  currentTyped = '';

  console.log(wordsused);
  wayout = await existsWordChain(w, targetEl.value);

  if (w === targetEl.value) {
    totalStages++;
    finished = true;
    if (currentStage === levelconstraints[currentLevelIndex].stages.length - 1) {
      LevelsCompleted++;
    }
    setMsg('🎉 Reached target!');
  }
  else {
    if (!wayout)
    {
      setMsg('⚠ No possible path from here, the game must be restarted.');
      finished = true;
      nextBtn.disabled = true;
      updateAllBoxes();
    }
  }

  if (LevelsCompleted === levels.length)
  {
    setMsg('🏆 All levels completed! Congratulations for finally beating this hecking of a torture.');
    nextBtn.disabled = true;
  }
  else nextBtn.disabled = startEl.value !== targetEl.value && startEl.value !== '';

  renderHistory();
  renderInventory();
  updateAllBoxes();
  renderProgress();
  renderUsedWords();
  originalOrder = Array.from(wordsUsedEl.children);
  // renderAssist();
  

  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

function setMsg(t) { msgEl.textContent = t; }

document.onkeydown = e => {
  if (startEl.value === targetEl.value) return;
  setMsg('');
  if (finished) return;
  if (e.key === 'Backspace') {
    currentTyped = currentTyped.slice(0, -1);
    updateAllBoxes();
    renderAssist();
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
    renderAssist();
  }
};

function renderUsedWords() {
  wordsUsedEl.innerHTML = '';
  const usedWords = wordsused[lengthOfWord] || [];
  usedWords.forEach(word => {
    const div = document.createElement('div');
    div.className = 'used-word-item';
    div.textContent = word;
    wordsUsedEl.appendChild(div);
  });
  const wordsUsedContainer = document.getElementById('wordsUsedContainer');
  if (currentTotalStage === 0) wordsUsedContainer.style.opacity = '0';
  else wordsUsedContainer.style.opacity = '1';
}

function renderWordBoxes(container, word, totalLength, mode = 0) {
  container.innerHTML = '';
  for (let i = 0; i < totalLength; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.textContent = word[i] ? word[i].toUpperCase() : '';
    if (finished)
    {
      if (startEl.value === targetEl.value) box.classList.add('completed');
      else box.classList.add('failed');
    }
    else {
      if (mode == -1) box.classList.add('current');
      else if (mode == 1) box.classList.add('target');
    }
    container.appendChild(box);
  }
}

function updateAllBoxes() {
  const len = parseInt(startEl.value.length, 10);
  renderWordBoxes(startBoxes, startEl.value, len, mode = -1);
  renderWordBoxes(targetBoxes, targetEl.value, len, mode = 1);
  renderWordBoxes(moveBoxes, currentTyped, len);
}

// Update whenever something changes
startEl.addEventListener('input', updateAllBoxes);
targetEl.addEventListener('input', updateAllBoxes);

/**
 * Optimization advice:
 * - Cache fetches for legalanswers.json and legalanswersedgelist.json outside loops.
 * - Avoid repeated fetches inside pickWords and existsWordChainByIndex.
 * - Use Sets for faster lookups.
 * - Consider parallelizing independent stages with Promise.all if possible.
 * - Reduce unnecessary retries by tracking failed pairs.
 * - If possible, precompute adjacency and word lists once per session.
 * - For large word lists, consider using a Web Worker for async processing.
 */

// Example: cache fetches at top-level
let cachedLegalAnswers = null;
let cachedAdjList = null;

async function getLegalAnswers() {
  if (!cachedLegalAnswers) {
    const res = await fetch('legalanswers.json');
    cachedLegalAnswers = await res.json();
  }
  return cachedLegalAnswers;
}

async function getAdjList() {
  if (!cachedAdjList) {
    const res = await fetch('legalanswersedgelist.json');
    cachedAdjList = await res.json();
  }
  return cachedAdjList;
}

async function existsWordChainByIndex(startIdx, targetIdx, potentialunused, len, minLen) {
  const groups = await getLegalAnswers();
  const wordList = groups[len];

  const adjList1 = await getAdjList();
  const adjList = adjList1[len];

  const usedSet = new Set(potentialunused);

  const visited = new Set();
  const queue = [{ idx: startIdx, path: [startIdx] }];
  visited.add(startIdx);

  let i;
  while (queue.length) {
    const { idx: curr, path } = queue.shift();
    if (curr === targetIdx && path.length >= minLen) {
      return path;
    }
    for (const neighbor of adjList[curr]) {
      i = wordList[neighbor];
      if (usedSet.has(neighbor)) continue;
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push({ idx: neighbor, path: [...path, neighbor] });
      }
    }
  }
  return [];
}

async function pickWords(groups, len, potentialunused, minLen) {
  const templist = groups[len];

  let index;
  let tries = 0;
  let maxTries = 50; // limit retries for performance
  let list, i1, i2, word1, word2, exists;
  do {
    index = Math.floor(Math.random() * templist.length);
    list = templist[index];
    if (!list || list.length < 2) continue;
    i1 = Math.floor(Math.random() * list.length);
    do {
      i2 = Math.floor(Math.random() * list.length);
    } while (i2 === i1);

    word1 = list[i1];
    word2 = list[i2];

    if (restrictedWords.includes(word1) || restrictedWords.includes(word2)) continue;

    const altgroups = await getLegalAnswers();
    const wordList = altgroups[len];
    let index1 = wordList.indexOf(word1);
    let index2 = wordList.indexOf(word2);

    exists = await existsWordChainByIndex(index1, index2, potentialunused, len, minLen);
    tries++;
    if (exists.length) break;
  } while ((!exists || !exists.length) && tries < maxTries);

  if (!exists || !exists.length) {
    return {"start": "", "target": "", "chain": []};
  }

  console.log(`Chosen words:`, word1, word2);
  return {"start": word1, "target": word2, "chain": exists};
}

async function createLevels() {
  currentLevelIndex = 0;
  currentStage = 0;
  currentTotalStage = 0;
  totalStages = 0;
  LevelsCompleted = 0;
  restrictedWords = [];
  wordsused = {3:[], 4:[], 5:[]};
  potentialunused = {3:[], 4:[], 5:[]};
  const res = await fetch('answerscompartments.json');
  const groups = await res.json();
  levels = [];
  let i, done = 0;
  for (const lvl of levelconstraints) {
    i = lvl.level;
    let words = [];
    let res;
    for (let j = 0; j < lvl.stages.length; j++) {
      const stageLen = lvl.stages[j];
      res = await pickWords(groups, stageLen, potentialunused[stageLen], minimumLength[i-1].stages[j] + 1);
      let tries = 0;
      while (!res.chain.length && tries < 20) {
        res = await pickWords(groups, stageLen, potentialunused[stageLen], minimumLength[i-1].stages[j] + 1);
        tries++;
      }
      if (!res.chain.length) {
        console.warn(`Could not find valid chain for level ${i} stage ${j + 1}`);
        continue;
      }
      restrictedWords.push(res.start);
      restrictedWords.push(res.target);
      for (const w of res.chain) potentialunused[stageLen].push(w);
      res = {"start": res.start, "target": res.target};
      words.push(res);
      console.log(`Level ${i} Stage with length ${stageLen} is done.`);
      done++;
      renderLoadProgress(done);
    }
    levels.push({level: i, words: words});
  }
  console.log('Created levels:', levels);
  localStorage.setItem('wordChainState', JSON.stringify(createState()));
  console.log(localStorage.getItem('wordChainState'));
}

function renderLoadProgress(done) {
  // compute total stages
  let total = 27;
  if (total === 0) return;

  // ensure the bar element exists
  if (!progressBar) {
    console.warn('progressBar element not defined!');
    return;
  }

  if (done > 1) {
    let fill = progressBar.querySelector('#progressFill');
    let label = progressBar.querySelector('#progressLabel');
    const percent = ((done * 1.0 / total) * 100).toFixed(1);
    if (fill) fill.style.width = `${percent}%`;
    if (label) label.textContent = `Generating Levels: ${percent}%`;
    if (done >= total && fill) {
      fill.style.background = 'linear-gradient(90deg, #00ff9d, #00ff9d)';
      if (label) label.textContent = 'Generation Complete!';
    }
    return;
  }

  progressBar.innerHTML = '';
  stageContainer.innerHTML = '';
  // initialize inner elements once
  let fill = progressBar.querySelector('#progressFill');
  let label = progressBar.querySelector('#progressLabel');

  if (!fill) {
    fill = document.createElement('div');
    fill.id = 'progressFill';
    Object.assign(fill.style, {
      width: '0%',
      height: '100%',
      background: 'linear-gradient(90deg, #00ff9d, #0077ff)',
      borderRadius: 'inherit',
      transition: 'width 0.3s ease',
      position: 'absolute',
      top: 0,
      left: 0,
    });
    progressBar.appendChild(fill);
  }

  if (!label) {
    label = document.createElement('span');
    label.id = 'progressLabel';
    Object.assign(label.style, {
      position: 'relative',
      zIndex: 2,
      color: '#fff',
      fontFamily: 'Itim, cursive',
      fontSize: '1rem',
      textShadow: '0 0 4px rgba(0,0,0,0.6)',
    });
    progressBar.appendChild(label);
  }

  // make sure progressBar is ready for absolute positioning
  const computedStyle = getComputedStyle(progressBar);
  if (computedStyle.position === 'static') {
    progressBar.style.position = 'relative';
  }
  progressBar.style.overflow = 'hidden';

  // update progress
  const percent = Math.floor((done * 1.0 / total) * 100);
  fill.style.width = `${percent}%`;
  label.textContent = `Generating Levels: ${percent}%`;

  // mark completion
  if (done >= total) {
    fill.style.background = 'linear-gradient(90deg, #00ff9d, #00ff9d)';
    label.textContent = 'Generation Complete!';
  }
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
  if (!wordsused[lengthOfWord].includes(startEl.value)) wordsused[lengthOfWord].push(startEl.value);
  finished = false;
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
  originalOrder = Array.from(wordsUsedEl.children);
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
  if (LevelsCompleted === 0) progressBar.style.opacity = '0';
  else progressBar.style.opacity = '1';
  for (let index = 0; index < levels.length; index++) {
    const lv = levels[index];
    const char = title[index];

    const levelDiv = document.createElement('div');
    levelDiv.className = 'level-node';

    // big circle for level
    const levelBtn = document.createElement('div');
    levelBtn.className = 'outlined-text';
    levelBtn.textContent = char;

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

async function loadGameState() {
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
    nextBtn.disabled = startEl.value !== targetEl.value && startEl.value !== '';
    renderHistory();
    renderInventory();
    renderProgress();
    updateAllBoxes();
    setMsg('');
    renderUsedWords();
    originalOrder = Array.from(wordsUsedEl.children);
    for (const key in levels) {
      for (const words in levels[key].words) {
        restrictedWords.push(words.start);
        restrictedWords.push(words.target);
      }
    }
    if (startEl.value === targetEl.value) {
      finished = true;
    }
    else
    {
      const wayout = await existsWordChain(current, targetEl.value);
      if (!wayout) {
        setMsg('⚠ No possible path from here, the game must be restarted.');
        finished = true;
        nextBtn.disabled = true;
        updateAllBoxes();
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
  let loaded = await loadGameState();
  console.log(loaded);
  if (loaded) return;
  localStorage.removeItem('wordChainGame');
  fullReset();
}

init();