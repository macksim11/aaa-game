// Doctor: Nana & Papi's house layout.  node tools/doctor/check_home.mjs
// Nobody may stand inside / float over furniture: anyone overlapping a piece's x-range must have their feet
// in front of it (iy > base + 0.02). Pets may sit in pet beds. Spots must be on the floor and not on top of each other.
import { FURNITURE, HOME_SPOTS, PET_SPOTS } from '../../js/data/home.js';
import { SPRITE_HEIGHT } from '../../js/art/sheets.js';
const probs = [];
const HALF = { person: 0.028, pet: 0.02 };
function checkSpot(name, ix, iy, kind) {
  if (iy < 0.88 || iy > 1.0) probs.push(`${name} feet at iy=${iy} are off the floor (floor is 0.88-1.0)`);
  for (const f of FURNITURE) {
    const overlap = ix + HALF[kind] > f.x0 && ix - HALF[kind] < f.x1;
    if (!overlap) continue;
    if (f.bed && kind === 'pet' && Math.abs(ix - f.bed.ix) < 0.02 && Math.abs(iy - f.bed.iy) < 0.02) continue;   // napping in the bed
    if (iy <= f.base + 0.02) probs.push(`${name} at (${ix}, ${iy}) is inside/over the ${f.name} (needs iy > ${(f.base + 0.02).toFixed(3)} or move sideways)`);
  }
}
for (const [k, s] of Object.entries(HOME_SPOTS)) checkSpot(k, s.ix, s.iy, 'person');
PET_SPOTS.forEach(([ix, iy], i) => checkSpot(`pet spot ${i + 1}`, ix, iy, 'pet'));
const people = Object.entries(HOME_SPOTS);
for (let i = 0; i < people.length; i++) for (let j = i + 1; j < people.length; j++) {
  const [a, s] = people[i], [b, t] = people[j];
  if (Math.abs(s.ix - t.ix) < 0.04) probs.push(`${a} and ${b} stand on top of each other (only ${Math.abs(s.ix - t.ix).toFixed(3)} apart)`);
}
// Emery is 6'9" — he must look the tallest person in the house (sprite height x perspective, same formula as hub.js)
const shown = k => (SPRITE_HEIGHT['chars/' + k] || 100) * (0.85 + (HOME_SPOTS[k].iy - 0.84) * 1.4);
for (const k of Object.keys(HOME_SPOTS)) if (k !== 'emery' && shown(k) >= shown('emery')) probs.push(`${k} looks taller than Emery at home (Emery must be the tallest)`);
for (const p of probs) console.log('HOME ' + p);
console.log(`${probs.length} home layout problems`);
process.exit(probs.length ? 1 : 0);
