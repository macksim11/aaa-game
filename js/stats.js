import { setBeltColor } from './art/sheets.js';
import { S } from './state.js';
import { BAL } from './data/balance.js';
import { GEAR, itemStats } from './data/gear.js';
import { PETS, petLevelMult } from './data/pets.js';
import { MOUNTS } from './data/mounts.js';

export const BELTS = [
  { name: 'White Belt', color: '#f4f4f4' },
  { name: 'Yellow Belt', color: '#ffd400' },
  { name: 'Orange Belt', color: '#ff8c1a' },
  { name: 'Green Belt', color: '#2fbf4a' },
  { name: 'Blue Belt', color: '#2f7fe0' },
  { name: 'Purple Belt', color: '#8a3ff0' },
  { name: 'Brown Belt', color: '#7a4a25' },
  { name: 'Black Belt', color: '#161616' },
];
export const PER_BELT = 12;
export const TALENT_GAIN = BAL.talentGain;

export function talentTotal() { const t = S.talents; return t.hp + t.atk + t.def; }
export function beltInfo() {
  const total = talentTotal();
  const idx = Math.min(BELTS.length - 1, Math.floor(total / PER_BELT));
  const stripes = idx === BELTS.length - 1 ? Math.min(10, total - idx * PER_BELT) : total % PER_BELT;
  setBeltColor(BELTS[idx].color);  // Arlo's sprite wears his real belt colour
  return { idx, ...BELTS[idx], stripes, total };
}
export function talentCost() { return BAL.talentCost(talentTotal()); }
export function petSlots() { const b = beltInfo().idx; return 1 + (b >= 2 ? 1 : 0) + (b >= 4 ? 1 : 0); }
export const PET_SLOT_BELTS = [0, 2, 4];

export function rescued(id) { return S.rescued.family.includes(id); }

function addStats(t, s, mult = 1) {
  for (const [k, v] of Object.entries(s || {})) {
    if (k === 'hp' || k === 'atk' || k === 'def') t[k] += v * mult;
    else t[k] = (t[k] || 0) + v;
  }
}

// Permanent (out-of-run) hero stats.
export function heroStats() {
  const t = { hp: BAL.hero.hp, atk: BAL.hero.atk, def: BAL.hero.def, crit: 0.05, critDmg: 0.5, combo: 0.08, counter: 0.05, dodge: 0.03, lifesteal: 0, hpPct: 0, atkPct: 0, defPct: 0 };
  t.hp += S.talents.hp * TALENT_GAIN.hp; t.atk += S.talents.atk * TALENT_GAIN.atk; t.def += S.talents.def * TALENT_GAIN.def;
  if (rescued('mom')) t.hp += 100;
  if (rescued('papa')) t.atk += 15;
  if (rescued('eveah')) t.def += 10;
  if (rescued('alyzee')) t.crit += 0.06;
  // gear
  for (const uid of Object.values(S.gear.slots)) {
    const it = S.gear.items.find(i => i.uid === uid); if (it) addStats(t, itemStats(it));
  }
  // pets: equipped give flat stats, all owned give their small owned bonus
  for (const [id, p] of Object.entries(S.pets.owned)) {
    const def = PETS[id]; if (!def) continue;
    addStats(t, def.owned);
    if (S.pets.equipped.includes(id)) {
      const m = petLevelMult(p.level);
      for (const [k, v] of Object.entries(def.stats)) {
        if (k === 'hp' || k === 'atk' || k === 'def') t[k] += v * m; else t[k] = (t[k] || 0) + v;
      }
    }
  }
  // mounts: owned bonuses
  for (const id of Object.keys(S.mounts.owned)) { const m = MOUNTS[id]; if (m) addStats(t, m.owned); }
  // belt bonus
  const belt = beltInfo().idx;
  t.hpPct += belt * BAL.beltBonus; t.atkPct += belt * BAL.beltBonus; t.defPct += belt * BAL.beltBonus;
  const out = {
    hp: Math.round(t.hp * (1 + t.hpPct)), atk: Math.round(t.atk * (1 + t.atkPct)), def: Math.round(t.def * (1 + t.defPct)),
    crit: t.crit, critDmg: t.critDmg, combo: t.combo, counter: t.counter, dodge: t.dodge, lifesteal: t.lifesteal,
  };
  out.power = Math.round(out.atk * 10 + out.hp + out.def * 8 + (out.crit + out.combo + out.counter + out.dodge) * 1500);
  return out;
}
