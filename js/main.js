import { S, save } from './state.js';
import { el, watchIcons, preloadIcons, pick } from './util.js';
// swap leftover emoji in the UI for the game's icon art
watchIcons(document.getElementById('app') || document.body);
import { initAudio } from './audio.js';
import { preloadSheets } from './art/sheets.js';

const CHAR_SHEETS = ['arlo', 'emery', 'mom', 'papa', 'alyzee', 'eveah', 'nana', 'papi', 'twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko', 'wolf', 'axolotl', 'eevee', 'pikachu', 'charizard'].map(k => 'chars/' + k);
const loadImg = src => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = src; });

// Loading screen: load the characters, icons and main pictures with a progress bar,
// so the game never shows a blank screen or pops art in late.
async function loadEverything() {
  const bar = document.getElementById('bootbar'), tip = document.getElementById('boottip');
  const tips = ['Waking up Twyla...', 'Papi is heating up the stove...', 'Polishing the diamond sword...', 'Tying Arlo\'s belt...', 'Counting coins...', 'Absolute cinema loading...'];
  if (tip) tip.textContent = pick(tips);
  const tipTimer = setInterval(() => { if (tip) tip.textContent = pick(tips); }, 1600);
  const jobs = [
    ...CHAR_SHEETS.map(k => preloadSheets([k])),
    preloadIcons(),
    loadImg('assets/title.webp'), loadImg('assets/bg/bg_hub.webp'), loadImg('assets/ui/face_arlo.webp'), loadImg('assets/ui/face_nana.webp'),
    document.fonts?.ready,
  ];
  let done = 0;
  const step = () => { done++; if (bar) bar.style.width = Math.max(4, Math.round(done / jobs.length * 100)) + '%'; };
  await Promise.race([Promise.all(jobs.map(j => Promise.resolve(j).then(step, step))), new Promise(r => setTimeout(r, 15000))]);
  clearInterval(tipTimer);
  if (bar) bar.style.width = '100%';
  await new Promise(r => setTimeout(r, 250));
  const bootEl = document.getElementById('boot');
  if (bootEl) { bootEl.classList.add('done'); setTimeout(() => bootEl.remove(), 500); }
}
import { showHub } from './ui/hub.js';
import { startRun } from './run.js';
import { playIntro as playOldIntro } from './ui/cutscene.js';
import { playComic, INTRO, hasComicArt } from './ui/comic.js';

// comic-book story if the art is there, otherwise the original animated one
async function playIntro(done) { if (await hasComicArt()) playComic(INTRO, done); else playOldIntro(done); }

// Audio on iOS needs a user gesture first.
const unlock = () => { initAudio(); };
addEventListener('pointerdown', unlock, { passive: true });
addEventListener('keydown', unlock);

// Stop iOS double-tap zoom / pinch zoom inside the game
document.addEventListener('gesturestart', e => e.preventDefault());
let lastTouch = 0;
document.addEventListener('touchend', e => { const now = Date.now(); if (now - lastTouch < 300) e.preventDefault(); lastTouch = now; }, { passive: false });

function goHub() {
  showHub({
    onStart: ch => startRun(ch, () => goHub()),
    onReplayIntro: () => playIntro(() => goHub()),
  });
}

// Like the real thing: a brand-new player goes straight from the story into Chapter 1.
// Nana & Papi's house (and the tour of it) opens after that first adventure ends.
function firstAdventure() {
  S.tut.stage = 'firstRun'; save();
  startRun(1, () => { S.tut.stage = 'tour'; S.tut.step = 0; S.tut.open = ['home']; save(); goHub(); });
}

function boot() {
  if (!S.introSeen) {
    // splash so the first tap also unlocks sound
    const go = () => { initAudio(); splash.classList.add('leaving'); setTimeout(() => { splash.remove(); playIntro(() => { S.introSeen = true; S.tut.stage = 'firstRun'; save(); firstAdventure(); }); }, 350); };
    const sparkles = el('div', { class: 'ts-sparkles' }, ...Array.from({ length: 14 }, (_, i) => el('i', { style: { left: (5 + (i * 37) % 90) + '%', top: (8 + (i * 53) % 80) + '%', animationDelay: (i * 0.37 % 3).toFixed(2) + 's' } })));
    const splash = el('div', { class: 'title-splash' },
      el('div', { class: 'ts-bg' }), sparkles,
      el('div', { class: 'ts-art' }, el('img', { src: 'assets/title.webp', alt: "Arlo's Awesome Adventure" })),
      el('div', { class: 'ts-bottom' },
        el('button', { class: 'btn gold big ts-play', onclick: go }, el('span', { class: 'ts-tri' }), 'PLAY'),
        el('div', { class: 'ts-ribbon' }, 'Happy Birthday Arlo!')));
    document.getElementById('overlay').append(splash);
    return;
  }
  if (S.tut.stage === 'story' || S.tut.stage === 'firstRun') return firstAdventure();
  goHub();
}
loadEverything().then(boot);

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
