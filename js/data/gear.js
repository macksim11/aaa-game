export const RARITIES = ['common', 'great', 'rare', 'epic', 'legendary', 'mythic'];
export const RARITY_NAMES = { common: 'Common', great: 'Great', rare: 'Rare', epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', family: 'Family' };
export const RARITY_MULT = [1, 1.5, 2.2, 3.2, 4.6, 6.5];
export const SLOTS = ['weapon', 'gi', 'gloves', 'shoes', 'necklace', 'ring'];
export const SLOT_NAMES = { weapon: 'Weapon', gi: 'Armor', gloves: 'Gloves', shoes: 'Shoes', necklace: 'Necklace', ring: 'Ring' };
export const SLOT_ICONS = { weapon: '🗡️', gi: '🥋', gloves: '🥊', shoes: '👟', necklace: '📿', ring: '💍' };

// stat values are for a Common, level 1 item. pct stats (crit etc.) don't scale with level.
export const GEAR = {
  // weapons
  wood_sword:   { slot: 'weapon', name: 'Wooden Sword', icon: 'px:wood_sword', stats: { atk: 10 } },
  bo_staff:     { slot: 'weapon', name: 'Bo Staff', icon: 'px:bo_staff', stats: { atk: 11, combo: 0.03 } },
  nunchucks:    { slot: 'weapon', name: 'Nunchucks', icon: 'px:nunchucks', stats: { atk: 9, combo: 0.06 } },
  stone_sword:  { slot: 'weapon', name: 'Stone Sword', icon: 'px:stone_sword', stats: { atk: 14 } },
  hockey_stick: { slot: 'weapon', name: 'Habs Hockey Stick', icon: 'px:hockey_stick', stats: { atk: 13, crit: 0.04 } },
  iron_sword:   { slot: 'weapon', name: 'Iron Sword', icon: 'px:iron_sword', stats: { atk: 17 } },
  diamond_pick: { slot: 'weapon', name: 'Diamond Pickaxe', icon: 'px:diamond_pick', stats: { atk: 19, crit: 0.05 } },
  diamond_sword:{ slot: 'weapon', name: 'Diamond Sword', icon: 'px:diamond_sword', stats: { atk: 24, crit: 0.05 }, minRarity: 2 },
  netherite_sword:{ slot: 'weapon', name: 'Netherite Sword', icon: 'px:netherite_sword', stats: { atk: 30, critDmg: 0.2 }, minRarity: 3 },
  // armor
  karate_gi:    { slot: 'gi', name: 'Karate Gi', icon: '🥋', stats: { hp: 70, def: 2 } },
  hoodie:       { slot: 'gi', name: 'Cozy Hoodie', icon: '🧥', stats: { hp: 90 } },
  leather_tunic:{ slot: 'gi', name: 'Leather Tunic', icon: 'px:leather_tunic', stats: { hp: 60, def: 4 } },
  iron_chest:   { slot: 'gi', name: 'Iron Chestplate', icon: 'px:iron_chest', stats: { hp: 90, def: 6 } },
  diamond_chest:{ slot: 'gi', name: 'Diamond Chestplate', icon: 'px:diamond_chest', stats: { hp: 130, def: 9 }, minRarity: 2 },
  // gloves
  sparring:     { slot: 'gloves', name: 'Sparring Gloves', icon: '🥊', stats: { atk: 5, hp: 25 } },
  goalie:       { slot: 'gloves', name: 'Goalie Gloves', icon: '🧤', stats: { def: 4, counter: 0.04 } },
  dragon_wraps: { slot: 'gloves', name: 'Dragon Hand Wraps', icon: '🐉', stats: { atk: 7, critDmg: 0.15 }, minRarity: 1 },
  // shoes
  cleats:       { slot: 'shoes', name: 'Soccer Cleats', icon: '👟', stats: { atk: 4, dodge: 0.03 } },
  water_shoes:  { slot: 'shoes', name: 'Water Park Shoes', icon: '🩴', stats: { hp: 40, dodge: 0.02 } },
  kungfu_shoes: { slot: 'shoes', name: 'Kung Fu Slippers', icon: '🥿', stats: { atk: 3, combo: 0.04 } },
  diamond_boots:{ slot: 'shoes', name: 'Diamond Boots', icon: 'px:diamond_boots', stats: { def: 6, hp: 40 }, minRarity: 2 },
  // necklaces
  burger_pendant:{ slot: 'necklace', name: 'Golden Burger Pendant', icon: '🍔', stats: { hp: 60 } },
  ender_pearl:  { slot: 'necklace', name: 'Ender Pearl Necklace', icon: 'px:ender_pearl', stats: { dodge: 0.04, hp: 20 } },
  dragon_medal: { slot: 'necklace', name: 'Kung Fu Medal', icon: '🏅', stats: { crit: 0.04, atk: 3 } },
  // rings
  pinball_ring: { slot: 'ring', name: 'Pinball Ring', icon: '🎰', stats: { critDmg: 0.20, atk: 2 } },
  emerald_ring: { slot: 'ring', name: 'Emerald Ring', icon: 'px:emerald', stats: { def: 3, hp: 30 } },
  totem_ring:   { slot: 'ring', name: 'Totem Ring', icon: 'px:totem', stats: { hp: 50, lifesteal: 0.03 }, minRarity: 1 },
};

export function maxLevel(rarityIdx) { return 10 + rarityIdx * 10; }
export function enhanceCost(item) { return Math.round(15 * item.level * (1 + item.rarity * 0.6)); }
export function itemStats(item) {
  const def = GEAR[item.id]; const out = {};
  const m = RARITY_MULT[item.rarity] * (1 + (item.level - 1) * 0.1);
  for (const [k, v] of Object.entries(def.stats)) {
    if (k === 'atk' || k === 'hp' || k === 'def') out[k] = Math.round(v * m);
    else out[k] = +(v * (1 + item.rarity * 0.25)).toFixed(3);
  }
  return out;
}
export function itemPower(item) {
  const s = itemStats(item);
  return Math.round((s.atk || 0) * 10 + (s.hp || 0) + (s.def || 0) * 8 + ((s.crit || 0) + (s.combo || 0) + (s.dodge || 0) + (s.counter || 0) + (s.lifesteal || 0)) * 1500 + (s.critDmg || 0) * 500);
}
export function randomGearId(minRarity = 0, rarity = 0) {
  const ids = Object.keys(GEAR).filter(id => (GEAR[id].minRarity || 0) <= rarity);
  return ids[Math.floor(Math.random() * ids.length)];
}

export const CHESTS = {
  wood:  { name: 'Wooden Chest', icon: '📦', cost: { coins: 400 }, desc: 'Common or Great gear', odds: [0.75, 0.25, 0, 0, 0, 0] },
  gold:  { name: 'Golden Chest', icon: '🎁', cost: { gems: 80 }, desc: 'Great, Rare or Epic gear. Small chance of Legendary!', odds: [0, 0.45, 0.38, 0.14, 0.03, 0] },
  diamond: { name: 'Diamond Chest', icon: '💎', cost: { gems: 300 }, desc: 'Epic or better. Could be Mythic!', odds: [0, 0, 0, 0.7, 0.26, 0.04] },
};
