// Headless playthrough bot for Arlo's Awesome Adventure.
// Runs the real game code (run.js + battle.js) in jsdom with a virtual clock, plays like a kid
// (always fights, random choices, spends coins between runs) and reports how many tries each chapter takes.
import { JSDOM } from 'jsdom';
const GAME = process.env.GAME;
const MAX_RUNS = +process.env.MAX_RUNS || 400;
const VERBOSE = !!process.env.VERBOSE;
const SEED = +process.env.SEED || 1;

// ---------- deterministic random ----------
let seed = SEED * 9301 + 49297; Math.random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- DOM ----------
const dom = new JSDOM(`<!doctype html><div id="app"><div id="screen"></div><div id="overlay"></div><div id="toast"></div></div>`, { url: 'http://localhost/?sim', pretendToBeVisual: true });
const W = dom.window;
for (const k of ['window', 'document', 'localStorage', 'location', 'navigator', 'HTMLElement', 'Node', 'NodeFilter', 'MutationObserver', 'getComputedStyle', 'Image', 'HTMLCanvasElement', 'Event']) {
  try { globalThis[k] = k === 'window' ? W : W[k]; } catch { Object.defineProperty(globalThis, k, { value: W[k], configurable: true }); }
}
W.HTMLCanvasElement.prototype.getContext = function () {
  const noop = () => {}; const grad = { addColorStop: noop };
  return new Proxy({}, { get: (t, p) => p in t ? t[p] : (p === 'canvas' ? this : (p === 'measureText' ? () => ({ width: 10 }) : (/Gradient|Pattern/.test(p) ? () => grad : (p === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) : noop)))), set: (t, p, v) => { t[p] = v; return true; } });
};
W.HTMLElement.prototype.getBoundingClientRect = function () { return { left: 0, top: 0, width: 390, height: 300, right: 390, bottom: 300, x: 0, y: 0 }; };
globalThis.addEventListener = W.addEventListener.bind(W); globalThis.removeEventListener = W.removeEventListener.bind(W);
W.Element.prototype.animate = function () { return { cancel() {}, finished: Promise.resolve() }; };
globalThis.devicePixelRatio = W.devicePixelRatio = 1;
globalThis.ResizeObserver = W.ResizeObserver = class { observe() {} disconnect() {} };
globalThis.fetch = async () => ({ ok: false, json: async () => null });

// ---------- virtual clock ----------
let now = 0; const q = []; let tid = 1;
const setT = (fn, ms = 0, ...a) => { const id = tid++; q.push({ id, at: now + Math.max(0, ms), fn: () => fn(...a) }); return id; };
const clearT = id => { const i = q.findIndex(x => x.id === id); if (i >= 0) q.splice(i, 1); };
globalThis.setTimeout = W.setTimeout = setT; globalThis.clearTimeout = W.clearTimeout = clearT;
globalThis.setInterval = W.setInterval = (fn, ms) => { const id = tid++; const tick = () => { fn(); q.push({ id, at: now + ms, fn: tick }); }; q.push({ id, at: now + ms, fn: tick }); return id; };
globalThis.clearInterval = W.clearInterval = clearT;
globalThis.requestAnimationFrame = W.requestAnimationFrame = fn => setT(() => fn(now), 50);
globalThis.cancelAnimationFrame = W.cancelAnimationFrame = clearT;
const perf = { now: () => now }; Object.defineProperty(globalThis, 'performance', { value: perf, configurable: true }); W.performance.now = () => now;
const flush = () => new Promise(r => setImmediate(r));
async function step() {
  await flush(); await flush();
  if (!q.length) return false;
  q.sort((a, b) => a.at - b.at || a.id - b.id);
  const t = q.shift(); now = Math.max(now, t.at);
  try { t.fn(); } catch (e) { errors.push(String(e && e.stack || e)); }
  return true;
}
const errors = [];
W.addEventListener('error', e => errors.push(String(e.error?.stack || e.message)));
process.on('unhandledRejection', e => errors.push('REJ ' + String(e?.stack || e)));
const origErr = console.error; console.error = (...a) => { errors.push('console.error ' + a.map(String).join(' ').slice(0, 300)); };
console.warn = (...a) => { const s = a.map(String).join(' '); if (!/frame skipped/.test(s)) errors.push('warn ' + s.slice(0, 200)); else errors.push('FRAME ' + String(a[1]?.stack || a[1]).slice(0, 300)); };

// ---------- load the game ----------
const st = await import(GAME + '/js/state.js');
const S = st.S;
const { startRun } = await import(GAME + '/js/run.js');
const scene = await import(GAME + '/js/scene.js');
scene.Scene.prototype.draw = function () {};
const stats = await import(GAME + '/js/stats.js');
const gear = await import(GAME + '/js/data/gear.js');
const pets = await import(GAME + '/js/data/pets.js');
const fam = await import(GAME + '/js/data/family.js');
const { CHAPTERS } = await import(GAME + '/js/data/chapters.js');
const util = await import(GAME + '/js/util.js');
const { BAL } = await import(GAME + '/js/data/balance.js');
S.coins = 0; S.gems = 0;
if (process.env.BALJSON) Object.assign(BAL, JSON.parse(process.env.BALJSON));
S.settings.speed = 3; S.settings.sfx = false; S.settings.music = false; S.introSeen = true; if (S.tut) S.tut.stage = 'done';

// ---------- the bot "kid" ----------
const doc = W.document;
const pickR = a => a[Math.floor(Math.random() * a.length)];
function clickAny() {
  const ov = doc.getElementById('overlay');
  const comic = ov.querySelector('.cutscene .skip-btn'); if (comic) { comic.click(); return true; }
  const opts = [...ov.querySelectorAll('.skill-opt')];
  if (opts.length) {
    if (process.env.POLICY === 'smart') {      // pick the strongest-looking skill: rarity first, then offensive keywords
      const R = { mythic: 6, legendary: 5, epic: 4, rare: 3, great: 2, common: 1 };
      const score = b => { const t = b.textContent.toLowerCase(); let v = 0; for (const [k, n] of Object.entries(R)) if (t.includes(k)) v = Math.max(v, n * 10); for (const w of ['atk', 'crit', 'heal', 'lifesteal', 'combo', 'hp', 'damage']) if (t.includes(w)) v += 2; return v; };
      opts.sort((x, y) => score(y) - score(x))[0].click();
    } else pickR(opts).click();
    return true;
  }
  const mb = [...ov.querySelectorAll('.modal-bg .btn:not([disabled])')];
  if (mb.length) { (mb.find(b => /green|gold/.test(b.className)) || mb[mb.length - 1]).click(); return true; }
  if (ov.querySelector('.pinball')) return false;          // pinball ends by itself
  const acts = [...doc.querySelectorAll('.actions .btn:not([disabled])')];
  if (acts.length) { pickR(acts).click(); return true; }
  return false;
}
function playRun(ch) {
  return new Promise(async resolve => {
    let done = null; const t0 = now;
    startRun(ch, info => { done = info; });
    let guard = 0;
    while (!done) {
      if (!(await step())) break;
      if (++guard % 20 === 0) clickAny();
      if (now - t0 > 60 * 60 * 1000) { errors.push('RUN TIMEOUT ch' + ch + ' overlay=' + doc.getElementById('overlay').innerHTML.slice(0, 400) + ' actions=' + (doc.querySelector('.actions')?.innerHTML || 'none').slice(0, 300) + ' q=' + q.length); break; }
    }
    resolve(done || { timeout: true });
  });
}
// spend between runs like a kid would
function spend(day) {
  // Nana gift + Papi meal + free pinball once per "day" (assume 3 runs a day)
  // training: always buy the cheapest-level stat
  let guard = 0;
  // wooden chest while some gear slots are empty
  while (gear.SLOTS.some(sl => !S.gear.slots[sl]) && S.coins >= gear.CHESTS.wood.cost.coins * 2 && guard++ < 5) { S.coins -= gear.CHESTS.wood.cost.coins; openChest('wood'); equipBest(); }
  // then: training, or enhancing equipped gear when that's cheaper
  while (guard++ < 2000) {
    const eq = Object.values(S.gear.slots).map(u => S.gear.items.find(i => i.uid === u)).filter(it => it && it.level < gear.maxLevel(it.rarity)).sort((a, b) => gear.enhanceCost(a) - gear.enhanceCost(b))[0];
    const tc = stats.talentCost(), ec = eq ? gear.enhanceCost(eq) : Infinity;
    if (ec < tc * 0.6 && S.coins >= ec) { S.coins -= ec; eq.level++; continue; }
    if (S.coins < tc) break;
    const k = ['atk', 'hp', 'def'].sort((a, b) => S.talents[a] - S.talents[b])[0];
    S.coins -= tc; S.talents[k]++;
  }
  // gems: golden chest
  while (S.gems >= gear.CHESTS.gold.cost.gems + 20) { S.gems -= gear.CHESTS.gold.cost.gems; openChest('gold'); }
  // equip best per slot, merge triples, enhance equipped gear with leftover coins
  equipBest(); merge();
}
function equipBest() {
  for (const sl of gear.SLOTS) { const best = S.gear.items.filter(i => gear.GEAR[i.id].slot === sl).sort((a, b) => gear.itemPower(b) - gear.itemPower(a))[0]; if (best) S.gear.slots[sl] = best.uid; }
}
function merge() {
  for (let pass = 0; pass < 5; pass++) { const g = {}; for (const it of S.gear.items) { if (it.rarity >= 5) continue; (g[it.id + '|' + it.rarity] ||= []).push(it); }
    for (const grp of Object.values(g)) if (grp.length >= 3) { const [k, a, b] = grp.sort((x, y) => y.level - x.level); k.rarity++; S.gear.items = S.gear.items.filter(i => i !== a && i !== b); for (const [sl, u] of Object.entries(S.gear.slots)) if (u === a.uid || u === b.uid) S.gear.slots[sl] = k.uid; } }
  equipBest();
}
function petsSpend() {
  // pets: feed equipped
  for (const id of S.pets.equipped) { const p = S.pets.owned[id]; while (p && p.level < pets.PET_MAX_LEVEL && S.petFood >= pets.petLevelCost(p.level)) { S.petFood -= pets.petLevelCost(p.level); p.level++; } }
  const slots = stats.petSlots(); for (const id of Object.keys(S.pets.owned)) if (S.pets.equipped.length < slots && !S.pets.equipped.includes(id)) S.pets.equipped.push(id);
  st.save();
}
function openChest(id) {
  const c = gear.CHESTS[id]; let r = Math.random(), rarity = 0; for (let k = 0; k < c.odds.length; k++) { r -= c.odds[k]; if (r <= 0) { rarity = k; break; } }
  const gid = gear.randomGearId(0, rarity); S.gear.items.push({ uid: util.uid(), id: gid, rarity, level: 1 });
}
function daily() {
  if (process.env.NO_DAILY) return;
  const gifts = BAL.nanaGift(S.progress.unlocked);
  const g = pickR(gifts); S.coins += g.coins || 0; S.gems += g.gems || 0; S.petFood += g.food || 0;
  S.papiBuff = pickR(fam.PAPI_MEALS);
}

// ---------- play the whole game ----------
const report = []; let runs = 0, ch = 1, tries = 0;
const t0 = Date.now();
while (runs < MAX_RUNS && ch <= CHAPTERS.length) {
  if (runs > 0 && runs % 3 === 0) daily();   // first adventure: no gifts, no Papi meal
  const before = { coins: S.coins, power: stats.heroStats().power };
  const res = await playRun(ch); runs++; tries++;
  const best = S.progress.best[ch] || 0;
  if (VERBOSE) console.log(`run ${runs} ch${ch} try${tries} ${res.won ? 'WON' : 'lost'} day ${best}/${CHAPTERS[ch - 1].days} power ${before.power} coins+${S.coins - before.coins} belt ${stats.beltInfo().name} talents ${S.talents.hp + S.talents.atk + S.talents.def}`);
  if (res.won) { report.push({ ch, tries, runs, power: stats.heroStats().power, belt: stats.beltInfo().name, talents: S.talents.hp + S.talents.atk + S.talents.def }); ch++; tries = 0; }
  if (runs === 1) openChest('wood');           // Papi's free chest in the tour
  spend(); petsSpend(); equipBest(); st.save();
}
console.log(JSON.stringify({ report, runs, finished: ch > CHAPTERS.length, secs: Math.round((Date.now() - t0) / 1000), errors: [...new Set(errors)].slice(0, 25) }, null, 1));
process.exit(0);
