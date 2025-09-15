const builtin = [
    "cat","cot","cog","dog","dot","dat","bat","bag","bog","log","lag","tag","tan",
    "man","men","pen","pan","can","cap","map","mad","sad","sap","sip","sit",
    "fit","fat","fog","hug","hum","ham","him","rim","ram","ran","run","sun","son"
];

const wordlist = new Set(builtin);
const startEl = document.getElementById('startWord');
const targetEl = document.getElementById('targetWord');
const inputEl = document.getElementById('moveInput');
const historyEl = document.getElementById('history');
const msgEl = document.getElementById('message');
const resetBtn = document.getElementById('reset');
const playBtn = document.getElementById('play');
const invEl = document.getElementById('inventory');

let current = startEl.value;
let history = [current];
let inventory = {  }; // starting letters
for (let i = 65; i <= 90; i++) { // A-Z
    inventory[String.fromCharCode(i)] = 1000;
}

let oneLetterDiffer;

// Ensure Module is defined or imported before using it
if (typeof Module === 'function') {
    Module().then((Module) => {
        oneLetterDiffer = Module.oneLetterDiffer;
        readWordsfromFile = Module.readWordsFromFile;
        console.log("WASM ready");
    });
} else {
    // Fallback: use the JS implementation if WASM is not available
    oneLetterDiffer = oneLetterDiff;
}


function renderHistory() {
    historyEl.innerHTML = '';
    history.forEach(w => {
    const div = document.createElement('div');
    div.className = 'word-item';
    div.innerHTML = `<div class="letter-box">${w[0]}</div><div>${w}</div>`;
    historyEl.appendChild(div);
    });
}

function renderInventory() {
    invEl.innerHTML = '';
    for (const [ltr,count] of Object.entries(inventory)) {
    const d = document.createElement('div');
    d.className = 'inv-item';
    d.textContent = `${ltr}: ${count}`;
    invEl.appendChild(d);
    }
}

function oneLetterDiff(a,b){
    console.log('Using JS oneLetterDiff');
    if (a.length !== b.length) return false;
    let diff=0;
    for (let i=0;i<a.length;i++) if(a[i]!==b[i]) diff++;
    return diff===1;
}

function getChangedLetter(a,b){
    for (let i=0;i<a.length;i++) if(a[i]!==b[i]) return b[i].toUpperCase();
    return null;
}

function playMove(){
    const w = inputEl.value.trim().toLowerCase();
    if (!w) return setMsg('Type a word first.');
    if (w.length !== current.length) return setMsg('Must be '+current.length+' letters.');
    if (!wordlist.has(w)) return setMsg('Not in dictionary.');
    if (!oneLetterDiffer) return setMsg('WASM not loaded yet.');
    if (!oneLetterDiffer(current,w)) return setMsg('Must change exactly 1 letter.');
    if (history.includes(w)) return setMsg('Already used.');

    const cost = getChangedLetter(current,w);
    if (!inventory[cost] || inventory[cost] <= 0) return setMsg(`No ${cost}s left.`);

    inventory[cost]--;
    current = w;
    history.push(w);
    renderHistory();
    renderInventory();
    inputEl.value = '';
    startEl.value = w;
    if (w === targetEl.value) setMsg('🎉 Reached target!'); else setMsg('');
}

function setMsg(t){ msgEl.textContent = t; }

playBtn.onclick = playMove;
inputEl.onkeydown = e => { if (e.key==='Enter') playMove(); };
resetBtn.onclick = () => {
    readWordsFromFile();
    const words = builtin.slice();
    const startIdx = Math.floor(Math.random() * words.length);
    let endIdx;
    do {
        endIdx = Math.floor(Math.random() * words.length);
    } while (endIdx === startIdx);
    startEl.value = words[startIdx];
    targetEl.value = words[endIdx];
    current = startEl.value;
    history = [current];
    inventory = {};
    for (let i = 65; i <= 90; i++) { // A-Z
        inventory[String.fromCharCode(i)] = 1000;
    }
    renderHistory();
    renderInventory();
    setMsg('');
};

renderHistory();
renderInventory();