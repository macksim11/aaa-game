// Original chiptune music + sound effects, synthesized with WebAudio (no files needed).
// To use your own music, drop MP3 files into /music named hub.mp3, adventure.mp3, battle.mp3, boss.mp3, story.mp3
import { S } from './state.js';

let ac = null, master = null, musicGain = null, sfxGain = null;
let current = null, currentName = null, fileAudio = null, songGain = null;
const fileCache = {};

export function initAudio() {
  if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
  const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
  ac = new AC();
  master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
  musicGain = ac.createGain(); musicGain.gain.value = S.settings.music ? 0.32 : 0; musicGain.connect(master);
  sfxGain = ac.createGain(); sfxGain.gain.value = S.settings.sfx ? 0.55 : 0; sfxGain.connect(master);
  if (currentName) { const n = currentName; currentName = null; playMusic(n); }
}
export function applyAudioSettings() {
  if (musicGain) musicGain.gain.value = S.settings.music ? 0.32 : 0;
  if (sfxGain) sfxGain.gain.value = S.settings.sfx ? 0.55 : 0;
  if (fileAudio) fileAudio.volume = S.settings.music ? 0.6 : 0;
}

function tone(freq, start, dur, type = 'square', vol = 0.2, dest = sfxGain, slide = 0) {
  if (!ac) return;
  const o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, start);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), start + dur);
  g.gain.setValueAtTime(0.0001, start); g.gain.exponentialRampToValueAtTime(vol, start + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  o.connect(g); g.connect(dest); o.start(start); o.stop(start + dur + 0.02);
}
function noise(start, dur, vol = 0.2, hp = 800, dest = sfxGain) {
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur); const b = ac.createBuffer(1, len, ac.sampleRate); const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource(); src.buffer = b; const f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
  const g = ac.createGain(); g.gain.value = vol; src.connect(f); f.connect(g); g.connect(dest); src.start(start);
}

const SFX = {
  click: t => tone(660, t, 0.06, 'square', 0.12),
  punch: t => { noise(t, 0.08, 0.35, 400); tone(160, t, 0.08, 'triangle', 0.3, sfxGain, 0.5); },
  punch2: t => { noise(t, 0.07, 0.3, 700); tone(220, t, 0.07, 'triangle', 0.25, sfxGain, 0.5); },
  crit: t => { noise(t, 0.12, 0.4, 300); tone(880, t, 0.12, 'square', 0.15, sfxGain, 1.5); },
  enemyHit: t => { noise(t, 0.08, 0.25, 250); tone(110, t, 0.1, 'sawtooth', 0.15, sfxGain, 0.6); },
  throw: t => { noise(t, 0.1, 0.15, 2500); },
  kick: t => { tone(120, t, 0.1, 'triangle', 0.35, sfxGain, 0.4); },
  boing: t => tone(300, t, 0.15, 'sine', 0.25, sfxGain, 2.2),
  zap: t => { for (let i = 0; i < 4; i++) tone(1200 - i * 200, t + i * 0.03, 0.05, 'sawtooth', 0.12); noise(t, 0.2, 0.2, 3000); },
  boom: t => { noise(t, 0.5, 0.6, 60); tone(80, t, 0.4, 'sine', 0.5, sfxGain, 0.3); },
  hiss: t => noise(t, 0.5, 0.18, 4000),
  poof: t => { noise(t, 0.15, 0.2, 1500); tone(500, t, 0.12, 'sine', 0.15, sfxGain, 0.4); },
  pet: t => tone(900, t, 0.08, 'sine', 0.2, sfxGain, 1.4),
  dragon: t => { tone(200, t, 0.3, 'sawtooth', 0.25, sfxGain, 3); noise(t + 0.1, 0.3, 0.4, 300); },
  coin: t => { tone(988, t, 0.06, 'square', 0.15); tone(1319, t + 0.06, 0.12, 'square', 0.15); },
  heal: t => { [523, 659, 784].forEach((f, i) => tone(f, t + i * 0.06, 0.12, 'sine', 0.2)); },
  levelup: t => { [523, 659, 784, 1047].forEach((f, i) => tone(f, t + i * 0.08, 0.18, 'square', 0.15)); },
  win: t => { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, t + i * 0.11, 0.2, 'square', 0.15)); },
  lose: t => { [392, 370, 349, 262].forEach((f, i) => tone(f, t + i * 0.22, 0.3, 'triangle', 0.25)); },
  bad: t => { tone(300, t, 0.2, 'sawtooth', 0.15, sfxGain, 0.6); },
  good: t => { tone(700, t, 0.1, 'square', 0.12); tone(1050, t + 0.08, 0.15, 'square', 0.12); },
  step: t => tone(140, t, 0.04, 'triangle', 0.08),
  gallop: t => { tone(200, t, 0.05, 'triangle', 0.2); tone(180, t + 0.08, 0.05, 'triangle', 0.2); },
  honk: t => { tone(415, t, 0.18, 'square', 0.25); tone(415, t + 0.25, 0.25, 'square', 0.25); },
  sonic: t => { tone(80, t, 0.6, 'sawtooth', 0.3, sfxGain, 4); noise(t, 0.6, 0.2, 200); },
  cinema: t => { [392, 523, 659, 784].forEach((f, i) => tone(f, t + i * 0.05, 0.4, 'triangle', 0.15)); },
  chest: t => { [392, 494, 587, 784, 988].forEach((f, i) => tone(f, t + i * 0.07, 0.2, 'square', 0.13)); },
  flipper: t => { tone(180, t, 0.05, 'square', 0.15); },
  bumper: t => { tone(1400, t, 0.06, 'square', 0.12); tone(1800, t + 0.04, 0.06, 'square', 0.1); },
  dice: t => { for (let i = 0; i < 5; i++) noise(t + i * 0.06, 0.03, 0.2, 2000); },
  oof: t => { tone(330, t, 0.15, 'square', 0.25, sfxGain, 0.6); },
};
export function sfx(name) { if (!ac || !S.settings.sfx) return; const f = SFX[name]; if (f) f(ac.currentTime + 0.001); }

// ---------------- Music (original tunes) ----------------
const N = n => 440 * Math.pow(2, (n - 69) / 12); // MIDI -> Hz
// notes as [midi or 0 for rest, length in 16ths]
const SONGS = {
  // cozy, warm hub theme (Nana & Papi's house)
  hub: { bpm: 96, lead: 'triangle', bass: 'sine', melody: [[72,4],[76,2],[79,2],[77,4],[76,2],[74,2],[72,4],[69,2],[71,2],[72,8],[74,4],[77,2],[81,2],[79,4],[77,2],[76,2],[74,4],[72,2],[74,2],[76,8]], bassline: [[48,8],[53,8],[45,8],[48,8],[50,8],[53,8],[55,8],[48,8]] },
  // bouncy adventure walking theme
  adventure: { bpm: 132, lead: 'square', bass: 'triangle', melody: [[76,2],[79,2],[84,2],[79,2],[81,4],[79,2],[76,2],[74,2],[76,2],[77,2],[79,2],[76,8],[72,2],[76,2],[79,2],[76,2],[77,4],[76,2],[74,2],[72,2],[74,2],[76,2],[71,2],[72,8]], bassline: [[48,4],[55,4],[53,4],[55,4],[48,4],[55,4],[43,4],[47,4],[45,4],[52,4],[50,4],[55,4],[48,4],[43,4],[48,8]] },
  // driving battle theme
  battle: { bpm: 156, lead: 'square', bass: 'sawtooth', melody: [[69,2],[69,1],[72,1],[76,2],[74,2],[72,2],[71,2],[72,2],[74,2],[69,2],[69,1],[72,1],[76,2],[79,2],[77,4],[76,4],[74,2],[74,1],[77,1],[81,2],[79,2],[77,2],[76,2],[74,2],[72,2],[71,2],[72,2],[74,2],[76,2],[69,8]], bassline: [[45,2],[45,2],[57,2],[45,2],[41,2],[41,2],[53,2],[41,2],[43,2],[43,2],[55,2],[43,2],[45,2],[45,2],[52,2],[45,2]] },
  // tense boss theme
  boss: { bpm: 168, lead: 'sawtooth', bass: 'square', melody: [[62,2],[65,2],[69,2],[68,2],[62,2],[65,2],[70,4],[69,2],[65,2],[62,2],[61,2],[62,8],[62,2],[65,2],[69,2],[72,2],[71,2],[69,2],[68,4],[65,2],[68,2],[69,2],[61,2],[62,8]], bassline: [[38,2],[38,2],[50,2],[38,2],[37,2],[37,2],[49,2],[37,2],[34,2],[34,2],[46,2],[34,2],[33,2],[33,2],[45,2],[33,2]] },
  // gentle story theme
  story: { bpm: 84, lead: 'triangle', bass: 'sine', melody: [[67,4],[72,4],[71,2],[69,2],[67,4],[64,4],[65,2],[67,2],[69,8],[67,4],[72,4],[74,2],[76,2],[77,4],[76,4],[74,2],[71,2],[72,8]], bassline: [[48,16],[41,16],[43,16],[48,16]] },
};

export async function playMusic(name) {
  if (currentName === name) return;
  stopMusic(); currentName = name;
  // try user-provided file first
  if (fileCache[name] === undefined) {
    try { const r = await fetch(`music/${name}.mp3`, { method: 'HEAD' }); fileCache[name] = r.ok; } catch { fileCache[name] = false; }
  }
  if (currentName !== name) return;
  if (fileCache[name]) {
    fileAudio = new Audio(`music/${name}.mp3`); fileAudio.loop = true; fileAudio.volume = S.settings.music ? 0.6 : 0;
    fileAudio.play().catch(() => {}); return;
  }
  if (!ac) return;
  const song = SONGS[name]; if (!song) return;
  songGain = ac.createGain(); songGain.gain.value = 1; songGain.connect(musicGain); const dest = songGain;
  const sixteenth = 60 / song.bpm / 4;
  const loopLen = (arr) => arr.reduce((s, n) => s + n[1], 0);
  const mLen = loopLen(song.melody), bLen = loopLen(song.bassline);
  const total = Math.max(mLen, bLen) * sixteenth;
  let next = ac.currentTime + 0.1;
  const schedule = () => {
    while (next < ac.currentTime + 1.5) {
      let t = next;
      for (const [n, l] of song.melody) { if (n) tone(N(n), t, l * sixteenth * 0.9, song.lead, 0.09, dest); t += l * sixteenth; }
      t = next;
      while (t < next + total - 0.001) { for (const [n, l] of song.bassline) { if (t >= next + total) break; if (n) tone(N(n), t, l * sixteenth * 0.85, song.bass, 0.12, dest); t += l * sixteenth; } }
      // simple drum on battle/boss/adventure
      if (name !== 'hub' && name !== 'story') for (let k = 0; k < total / sixteenth; k += 4) { noise(next + k * sixteenth, 0.04, 0.05, 6000, dest); if (k % 8 === 0) tone(60, next + k * sixteenth, 0.1, 'sine', 0.2, dest, 0.5); }
      next += total;
    }
  };
  schedule();
  current = setInterval(schedule, 500);
}
export function stopMusic() {
  if (current) clearInterval(current); current = null;
  if (fileAudio) { fileAudio.pause(); fileAudio = null; }
  if (songGain) { try { songGain.disconnect(); } catch {} songGain = null; }
  currentName = null;
}
