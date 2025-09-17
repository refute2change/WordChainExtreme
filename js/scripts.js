const keyboardRows = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['Z','X','C','V','B','N','M']
];

// DOM elements
const startEl = document.getElementById('startWord');
const targetEl = document.getElementById('targetWord');
const inputEl = document.getElementById('moveInput');
const historyEl = document.getElementById('history');
const msgEl = document.getElementById('message');
const resetBtn = document.getElementById('reset');
const playBtn = document.getElementById('play');
const invEl = document.getElementById('inventory');
const wordLength = document.getElementById('wordLength');
const moveBoxes = document.getElementById('moveBoxes');
const startBoxes = document.getElementById('startBoxes');
const targetBoxes = document.getElementById('targetBoxes');

let historyString = '↪';

// game state
let current = startEl.value;
let history = [current];
let inventory = {};
for (let i = 65; i <= 90; i++) {
  inventory[String.fromCharCode(i)] = 1000;
}
let word1, word2;

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
      const count = inventory[letter] ?? 0;

      const btn = document.createElement('button');
      btn.className = 'inv-btn';
      btn.disabled = count <= 0;

      btn.innerHTML = `
        <div class="letter">${letter}</div>
        <div class="count">${count}</div>
      `;

      btn.onclick = () => {
        moveInput.value += letter.toLowerCase();
        renderInventory();
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
    moveInput.value = moveInput.value.slice(0, -1);
  };

  invEl.lastElementChild.appendChild(back);
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

async function playMove() {
  const w = inputEl.value.trim().toLowerCase();
  if (!w) return setMsg('Type a word first.');
  if (w.length !== current.length) return setMsg(`Must be ${current.length} letters.`);

  try {
    const res = await fetch('legalanswers.json');
    const groups = await res.json();

    const len = wordLength.value; // read current selection
    const list = new Set(groups[len]);

    if (!list.has(w)) return setMsg('Not in dictionary.');
  } catch (err) {
    console.error('Error loading legalanswers.json', err);
    return setMsg('Error loading dictionary.');
  }

  if (!oneLetterDiff(current, w)) return setMsg('Must change exactly 1 letter.');
  if (history.includes(w)) return setMsg('Already used.');

  const cost = getChangedLetter(current, w);
  if (!inventory[cost] || inventory[cost] <= 0) return setMsg(`No ${cost}s left.`);

  inventory[cost]--;
  current = w;
  history.push(w);
  historyString += cost;
  startEl.value = w;

  renderHistory();
  renderInventory();
  updateAllBoxes();
  inputEl.value = '';

  setMsg(w === targetEl.value ? '🎉 Reached target!' : '');
}

function setMsg(t) { msgEl.textContent = t; }

playBtn.onclick = playMove;
inputEl.onkeydown = e => { if (e.key === 'Enter') playMove(); };

function renderWordBoxes(container, word, totalLength) {
  container.innerHTML = '';
  for (let i = 0; i < totalLength; i++) {
    const box = document.createElement('div');
    box.className = 'letter-box';
    box.textContent = word[i] ? word[i].toUpperCase() : '';
    container.appendChild(box);
  }
}

function updateAllBoxes() {
  const len = parseInt(wordLength.value, 10);
  renderWordBoxes(startBoxes, startEl.value, len);
  renderWordBoxes(targetBoxes, targetEl.value, len);
  renderWordBoxes(moveBoxes, inputEl.value, len);
}

// Update whenever something changes
inputEl.addEventListener('input', updateAllBoxes);
startEl.addEventListener('input', updateAllBoxes);
targetEl.addEventListener('input', updateAllBoxes);

// Initial render
updateAllBoxes();

function chooseWords() {
  fetch('answerscompartments.json')
    .then(res => res.json())
    .then(groups => {
        const len = wordLength.value;
        const templist = groups[len];       // read current selection
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

        word1 = list[i1];
        word2 = list[i2];

        startEl.value = word1;
        targetEl.value = word2;

        console.log(`Chosen ${len}-letter words:`, word1, word2);
        current = word1;
        history = [];
        historyString = "↪";
        history.push(word1);

        inventory = {};
        for (let i = 65; i <= 90; i++) inventory[String.fromCharCode(i)] = 1000;

        renderHistory();
        renderInventory();
        setMsg('');
        updateAllBoxes();
    })
    .catch(err => console.error('Error loading answers.json', err));
}

resetBtn.onclick = () => {
  chooseWords();
  inputEl.value = '';
  setMsg('');
};

chooseWords();
renderHistory();
renderInventory();
