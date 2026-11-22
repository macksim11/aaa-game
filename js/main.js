import { S, save } from './state.js';
import { el, watchIcons } from './util.js';
// swap leftover emoji in the UI for the game's icon art
watchIcons(document.getElementById('app') || document.body);
import { initAudio } from './audio.js';
import { preloadSheets } from './art/sheets.js';

// load all character art up front so every menu shows the new sprites
preloadSheets(['arlo', 'emery', 'mom', 'papa', 'alyzee', 'eveah', 'nana', 'papi', 'twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko', 'wolf', 'axolotl', 'eevee', 'pikachu', 'charizard'].map(k => 'chars/' + k));
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
    const splash = el('div', { class: 'cutscene title-splash', style: { alignItems: 'center', justifyContent: 'center', gap: '18px', background: 'radial-gradient(circle at 50% 35%, #5a35a8, #1d1230)', padding: '0 0 env(safe-area-inset-bottom)' } },
      el('img', { src: 'assets/title.webp', style: { width: '100%', maxHeight: '72vh', objectFit: 'contain', borderTop: '4px solid #2b1d14', borderBottom: '4px solid #2b1d14' } }),
      el('button', { class: 'btn gold big', onclick: () => { initAudio(); splash.remove(); playIntro(() => { S.introSeen = true; S.tut.stage = 'firstRun'; save(); firstAdventure(); }); } }, '▶ PLAY'),
      el('div', { style: { color: '#cbb9f0', fontSize: '12px', marginTop: '18px' } }, 'Happy Birthday Arlo! 🎂'));
    document.getElementById('overlay').append(splash);
    return;
  }
  if (S.tut.stage === 'story' || S.tut.stage === 'firstRun') return firstAdventure();
  goHub();
}
boot();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
