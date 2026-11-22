// Family members. `look` drives the cartoon drawing in art/people.js
export const FAMILY = {
  arlo: {
    name: 'Arlo', look: { skin: '#f6d2b8', hair: '#d9b46a', hairStyle: 'messy', eyes: '#3d7fd0', height: 1.0, build: 'kid' },
  },
  mom: {
    id: 'mom', name: 'Mom', full: 'Mom (Karen)', chapter: 1,
    look: { id: 'mom', skin: '#f7d6c2', hair: '#fbefb6', hairStyle: 'bob', bangs: true, eyes: '#6b8fb0', lips: '#e0302c', height: 1.12, build: 'adult', shirt: { style: 'blouse', color: '#fffaf0', accent: '#d9a62b' }, pants: { style: 'pants', color: '#2d3a5a' }, septum: true },
    bonusTitle: "Mom's Home Cooking",
    bonus: 'Mom cooks a big family meal: [b:+100 Max HP] forever.',
    line: "Arlo! You came for me! Sit down, I'm making you a real meal.",
    action: 'cook',
  },
  papa: {
    id: 'papa', name: 'Papa', full: 'Papa (Louis)', chapter: 2,
    look: { id: 'papa', skin: '#efc9a8', hair: '#8d8d8d', hairTop: '#5c5c5c', hairStyle: 'short', eyes: '#5a4632', mustache: '#4a4038', stubble: true, height: 1.2, build: 'adult', shirt: { style: 'tee', color: '#1e1e22' }, pants: { style: 'pants', color: '#4a5468' } },
    bonusTitle: "Papa's Piano Power",
    bonus: 'Papa plays an epic piano song: [b:+15 ATK] forever.',
    line: "That's my boy! Listen to this one, it's called 'Arlo's Theme'.",
    action: 'piano',
  },
  alyzee: {
    id: 'alyzee', name: 'Alyzée', full: 'Alyzée', chapter: 3,
    look: { id: 'alyzee', skin: '#f4cdb5', hair: '#3a2219', hairStyle: 'long', eyes: '#6f8a5a', height: 1.1, build: 'adult', shirt: { style: 'tank', color: '#fbfbf7' }, pants: { style: 'shorts', color: '#5d8cc4' }, tattoo: true, nosering: true },
    bonusTitle: 'Lash Vision',
    bonus: 'Alyzée puts on her magic lashes: you can [b:see what is coming] on the road ahead, and get [b:+6% Crit chance].',
    line: 'Okay these lashes are literally magic. I can see EVERYTHING now.',
    action: 'lashes',
  },
  eveah: {
    id: 'eveah', name: 'Évéah', full: 'Évéah', chapter: 4,
    look: { id: 'eveah', skin: '#f8d8c6', hair: '#8a4a2a', hairStyle: 'long', eyes: '#5b7da8', cheeks: true, height: 1.06, build: 'adult', shirt: { style: 'tank', color: '#18141c' }, pants: { style: 'skirt', color: '#3c4f8a' }, septum: true },
    bonusTitle: "Évéah's Song",
    bonus: 'Évéah sings a powerful song: [b:+10 DEF] forever.',
    line: "I'm gonna sing you a song so good, nothing can hurt you.",
    action: 'sing',
  },
  emery: {
    id: 'emery', name: 'Emery', full: 'Emery', chapter: 5,
    look: { id: 'emery', skin: '#f3cdb2', hair: '#b8935a', hairStyle: 'swept', eyes: '#4d86c4', stubble: true, height: 1.55, build: 'tall', shirt: { style: 'plaid', color: '#3f5f93', accent: '#9fb6d6' }, pants: { style: 'pants', color: '#4b5f7c' } },
    bonusTitle: 'Big Brother Sidekick',
    bonus: 'Emery joins you in every adventure! Every 2nd round he attacks for [b:100% of your ATK].',
    line: "Took you long enough, little bro. Let's go take down President Business. Together.",
    action: 'sidekick',
  },
  nana: {
    id: 'nana', name: 'Nana', full: 'Nana', hub: true,
    look: { id: 'nana', skin: '#f1c7a5', hair: '#e0a66a', hairStyle: 'long', eyes: '#5a6e8a', sunglasses: true, cane: true, height: 1.1, build: 'adult', shirt: { style: 'tank', color: '#17151a' }, pants: { style: 'pants', color: '#4d5f80' } },
    bonusTitle: "Nana's Daily Gift",
    bonus: 'Nana has a [b:gift] for you once every day.',
    line: "Is that my Arlo? Come give your Nana a hug!",
  },
  papi: {
    id: 'papi', name: 'Papi', full: 'Papi', hub: true,
    look: { id: 'papi', skin: '#d9a77c', hair: '#2a211c', hairStyle: 'short', eyes: '#5f7c96', height: 1.15, build: 'adult', shirt: { style: 'plaid', color: '#3d7fc0', accent: '#d8434b' }, pants: { style: 'pants', color: '#3a3f4a' } },
    bonusTitle: "Papi's Kitchen",
    bonus: 'Papi cooks you a [b:power-up meal] once a day for your next adventure.',
    line: "Hungry? Of course you're hungry. Papi's cooking!",
  },
};
export const RESCUE_ORDER = ['mom', 'papa', 'alyzee', 'eveah', 'emery'];

export const PAPI_MEALS = [
  { id: 'burger', name: 'Papi Burger', icon: '🍔', desc: '+20% Max HP for your next adventure', fx: { hpPct: 0.20 } },
  { id: 'spaghetti', name: 'Spaghetti Strength', icon: '🍝', desc: '+15% ATK for your next adventure', fx: { atkPct: 0.15 } },
  { id: 'soup', name: 'Soupe aux pois', icon: '🥣', desc: '+25% DEF and +2% HP regen each round', fx: { defPct: 0.25, regen: 0.02 } },
  { id: 'pancakes', name: 'Maple Pancakes', icon: '🥞', desc: '+40% XP for your next adventure', fx: { xpPct: 0.40 } },
  { id: 'steak', name: 'Papi Steak', icon: '🥩', desc: '+10% Crit chance and +30% Crit damage', fx: { crit: 0.10, critDmg: 0.30 } },
];
