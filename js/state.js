// Save system. Every field has a default, so new fields added in future
// updates merge in automatically and old saves never break.
// ?test in the URL uses a separate save, so testing never touches Arlo's real progress
const KEY = /[?&]test\b/.test(location.search) ? 'aaa_save_test' : 'aaa_save';
export const SAVE_VERSION = 1;

export function defaultSave() {
  return {
    version: SAVE_VERSION,
    name: 'Arlo',
    introSeen: false,
    coins: 0,
    gems: 0,
    petFood: 0,
    eggs: 0,
    horseshoes: 0,
    talents: { hp: 0, atk: 0, def: 0 },
    progress: { unlocked: 1, selected: 1, best: {}, cleared: {} },
    rescued: { family: [], pets: [] },
    pets: { owned: {}, equipped: [] },          // owned: id -> {level, xp}
    mounts: { owned: {}, equipped: null },       // owned: id -> {level}
    gear: { items: [], slots: {} },              // items: {uid,id,rarity,level}
    look: {
      shirt: { style: 'tribal', color: '#2b3550' },
      pants: { style: 'shorts', color: '#5d6f80' },
      hat: { style: 'none', color: '#7b3fe4' },
      unlocked: ['shirt:tee', 'shirt:tribal', 'shirt:gi', 'pants:shorts', 'pants:jeans', 'pants:gi', 'hat:none', 'hat:cap', 'hat:headband'],
    },
    daily: { nana: '', papi: '', pinball: '' },
    papiBuff: null,
    stats: { runs: 0, deaths: 0, kills: 0, bossKills: 0 },
    settings: { music: true, sfx: true, speed: 1, calm: (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches), vibrate: true },
    login: { day: 0, last: '' },
    seenNews: [],
    // first-time flow: 'story' -> 'firstRun' (straight into Chapter 1) -> 'tour' (hub walkthrough) -> 'done'
    tut: { stage: 'story', open: ['home'], step: 0 },
    freeChest: false,
  };
}

function mergeDefaults(def, obj) {
  if (Array.isArray(def)) return Array.isArray(obj) ? obj : def;
  if (def && typeof def === 'object') {
    const out = { ...(obj && typeof obj === 'object' ? obj : {}) };
    for (const k of Object.keys(def)) out[k] = (obj && k in obj) ? mergeDefaults(def[k], obj[k]) : def[k];
    return out;
  }
  return obj === undefined ? def : obj;
}

const MIGRATIONS = {
  // 1: s => { ...; return s; }   // add future migrations here
};

function migrate(s) {
  let v = s.version || 1;
  while (v < SAVE_VERSION) { v++; if (MIGRATIONS[v]) s = MIGRATIONS[v](s); }
  s.version = SAVE_VERSION;
  return s;
}

export let S = load();
globalThis.__AAA_S = S;

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      // saves from before the tutorial existed skip it (they already know the game)
      if (!obj.tut && obj.introSeen) obj.tut = { stage: 'done', open: ['home', 'shop', 'gear', 'pets', 'belts'], step: 0 };
      return migrate(mergeDefaults(defaultSave(), obj));
    }
  } catch (e) { console.warn('save load failed', e); }
  return defaultSave();
}
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { console.warn('save failed', e); }
}
export function resetSave() { S = defaultSave(); globalThis.__AAA_S = S; save(); }
export function wipeAndReload() { try { localStorage.removeItem(KEY); } catch {} location.reload(); }

export function exportCode() {
  const json = JSON.stringify(S);
  return 'AAA1:' + btoa(unescape(encodeURIComponent(json)));
}
export function importCode(code) {
  code = (code || '').trim();
  if (!code.startsWith('AAA1:')) throw new Error('That is not an AAA save code.');
  const json = decodeURIComponent(escape(atob(code.slice(5))));
  const obj = JSON.parse(json);
  if (!obj.tut && obj.introSeen) obj.tut = { stage: 'done', open: ['home', 'shop', 'gear', 'pets', 'belts'], step: 0 };
  S = migrate(mergeDefaults(defaultSave(), obj)); globalThis.__AAA_S = S;
  save();
}

export function addCurrency(kind, n) { S[kind] = Math.max(0, (S[kind] || 0) + Math.round(n)); }
