// Pets. `every` = attacks every N rounds. mult = % of Arlo's ATK.
// stats = flat stats given to Arlo while equipped (scale with pet level).
// owned = small permanent bonus just for having rescued/hatched the pet.
export const PETS = {
  twyla: {
    name: 'Twyla', species: 'Black Lab', rarity: 'family', owner: 'arlo', art: 'twyla',
    personality: 'Happy, loyal, always wagging',
    attack: { name: 'Zoomies Tackle', every: 2, mult: 0.7, stun: 0.2, desc: 'Every 2 rounds Twyla zooms in and tackles for [b:70% ATK] with a 20% chance to [b:stun].' },
    stats: { hp: 120, atk: 6, def: 2 }, owned: { hpPct: 0.03 },
  },
  lenny: {
    name: 'Lenny', species: 'Ragdoll Tuxedo Cat', rarity: 'family', owner: 'arlo', art: 'lenny',
    personality: 'Funny, floppy, fancy tuxedo',
    attack: { name: 'Ragdoll Flop', every: 3, mult: 1.3, stun: 0.35, desc: 'Every 3 rounds Lenny goes totally limp and flops on the enemy for [b:130% ATK], 35% chance to [b:stun].' },
    stats: { hp: 60, atk: 5, def: 6 }, owned: { defPct: 0.03 },
  },
  goose: {
    name: 'Goose', species: 'Grey & White Cat', rarity: 'family', owner: 'arlo', art: 'goose',
    personality: 'Small, shy, secretly a ninja',
    attack: { name: 'Shy Swipe', every: 2, mult: 0.55, alwaysCrit: true, desc: 'Every 2 rounds Goose sneaks out of hiding for a swipe that [b:always crits] (55% ATK).' },
    stats: { hp: 50, atk: 7, def: 2, dodge: 0.03 }, owned: { atkPct: 0.03 },
  },
  marah: {
    name: 'Marah', species: 'Mackerel Tabby Cat', rarity: 'family', owner: 'arlo', art: 'marah',
    personality: 'Chill, loving, perfectly round',
    attack: { name: 'Loaf Hug', every: 3, heal: 0.08, shield: 0.06, desc: 'Every 3 rounds Marah gives you a loaf hug: [b:heal 8%] of Max HP and a [b:6% shield].' },
    stats: { hp: 160, atk: 3, def: 4 }, owned: { hpPct: 0.03 },
  },
  tobi: {
    name: 'Tobi', species: 'Deer-head Chihuahua', rarity: 'family', owner: 'emery', art: 'tobi',
    personality: 'Curious, tall, always sniffing',
    attack: { name: 'Curious Sniff', every: 3, mult: 0.6, defShred: 0.15, desc: 'Every 3 rounds Tobi sniffs out a weak spot: [b:60% ATK] and enemy [b:DEF -15%] (stacks 3x).' },
    stats: { hp: 60, atk: 6, def: 3, crit: 0.03 }, owned: { atkPct: 0.03 },
  },
  zuko: {
    name: 'Zuko', species: 'Fawn Chihuahua', rarity: 'family', owner: 'emery', art: 'zuko',
    personality: 'Smiley, zoomy, pure energy',
    attack: { name: 'Zoom-Zoom Nibbles', every: 2, mult: 0.28, hits: 3, desc: 'Every 2 rounds Zuko does [b:3 super-fast nibbles] (28% ATK each).' },
    stats: { hp: 50, atk: 8, def: 2, combo: 0.03 }, owned: { atkPct: 0.03 },
  },
  // ---- Egg pets (unlock after every family pet is rescued) ----
  wolf: {
    name: 'Minecraft Wolf', species: 'Tamed Wolf', rarity: 'rare', egg: true, art: 'wolf',
    attack: { name: 'Pack Bite', every: 2, mult: 0.6, packBonus: 0.25, desc: 'Every 2 rounds bites for [b:60% ATK], +25% for each other pet with you.' },
    stats: { hp: 80, atk: 8, def: 3 }, owned: { atkPct: 0.02 },
  },
  axolotl: {
    name: 'Axolotl', species: 'Minecraft Axolotl', rarity: 'rare', egg: true, art: 'axolotl',
    attack: { name: 'Bubble Heal', every: 3, heal: 0.06, mult: 0.4, desc: 'Every 3 rounds blows a bubble for [b:40% ATK] and [b:heals 6%].' },
    stats: { hp: 110, atk: 4, def: 4 }, owned: { hpPct: 0.02 },
  },
  eevee: {
    name: 'Eevee', species: 'Pokémon', rarity: 'epic', egg: true, art: 'eevee',
    attack: { name: 'Swift', every: 2, mult: 0.35, hits: 3, desc: 'Every 2 rounds fires [b:3 Swift stars] (35% ATK each).' },
    stats: { hp: 90, atk: 10, def: 4, crit: 0.03 }, owned: { atkPct: 0.03 },
  },
  pikachu: {
    name: 'Pikachu', species: 'Pokémon', rarity: 'epic', egg: true, art: 'pikachu',
    attack: { name: 'Thunderbolt', every: 2, mult: 0.5, chain: 3, stun: 0.12, desc: 'Every 2 rounds a [b:Thunderbolt] chains through 3 enemies (50% ATK), 12% stun.' },
    stats: { hp: 80, atk: 12, def: 3 }, owned: { atkPct: 0.04 },
  },
  charizard: {
    name: 'Charizard', species: 'Pokémon', rarity: 'legendary', egg: true, art: 'charizard',
    attack: { name: 'Flamethrower', every: 3, mult: 1.6, burn: 0.35, all: true, desc: 'Every 3 rounds a [b:Flamethrower] hits ALL enemies for 160% ATK and sets them on fire.' },
    stats: { hp: 180, atk: 18, def: 8 }, owned: { atkPct: 0.05, hpPct: 0.03 },
  },
};
export const FAMILY_PET_ORDER = ['twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko'];
export const EGG_TABLE = [
  { id: 'wolf', weight: 38 }, { id: 'axolotl', weight: 34 }, { id: 'eevee', weight: 14 }, { id: 'pikachu', weight: 10 }, { id: 'charizard', weight: 4 },
];
export const EGG_COST = 60; // gems
export function petLevelCost(level) { return 5 + level * 4; }   // pet food
export const PET_MAX_LEVEL = 40;
export function petLevelMult(level) { return 1 + (level - 1) * 0.08; }
