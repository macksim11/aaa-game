// Ground mounts. owned = permanent bonus for owning it. ride = bonus/skill while riding it.
export const MOUNTS = {
  bike: {
    name: 'BMX Bike', rarity: 'common', art: 'bike', from: 'Chapter 1 reward',
    owned: { hpPct: 0.02 }, ride: { dodge: 0.05 }, rideDesc: 'Dodge +5%',
  },
  horse: {
    name: 'Minecraft Horse', rarity: 'great', art: 'horse', from: 'Chapter 2 reward', price: { coins: 3000 },
    owned: { atkPct: 0.03 }, ride: { charge: { every: 3, mult: 0.9 } }, rideDesc: 'Every 3 rounds the horse charges for 90% ATK',
  },
  hippo: {
    name: 'Hippo', rarity: 'rare', art: 'hippo', from: 'Chapter 3 reward', price: { gems: 300 },
    owned: { defPct: 0.04, hpPct: 0.03 }, ride: { shieldStart: 0.12, defPct: 0.10 }, rideDesc: 'Start battles with a 12% shield, DEF +10%',
  },
  ebike: {
    name: 'Electric Bike', rarity: 'rare', art: 'ebike', from: 'Chapter 4 reward', price: { gems: 350 },
    owned: { atkPct: 0.04 }, ride: { combo: 0.08, boltChance: 0.10 }, rideDesc: 'Combo +8%, attacks have 10% chance to zap with lightning',
  },
  car: {
    name: "Arlo's Car", rarity: 'legendary', art: 'car', from: 'Chapter 5 reward',
    owned: { atkPct: 0.06, hpPct: 0.06 }, ride: { ram: { every: 3, mult: 1.3, stun: 0.15 } }, rideDesc: 'Every 3 rounds: HONK HONK! Rams ALL enemies for 130% ATK, 15% stun',
  },
  golfcart: {
    name: 'Oddballs Golf Cart', rarity: 'epic', art: 'golfcart', from: 'Chapter 6 reward', price: { gems: 600 },
    owned: { atkPct: 0.05 }, ride: { ram: { every: 4, mult: 1.2, stun: 0 }, coinPct: 0.2 }, rideDesc: 'Every 4 rounds runs over ALL enemies (120% ATK), +20% coins',
  },
  pig: {
    name: 'Saddled Pig', rarity: 'great', art: 'pig', from: 'Shop', price: { coins: 2500 },
    owned: { hpPct: 0.03 }, ride: { postBattleHeal: 0.08 }, rideDesc: 'Heal 8% HP after every battle',
  },
  chicken: {
    name: 'Chicken Jockey', rarity: 'epic', art: 'chicken', from: 'Shop', price: { gems: 500 },
    owned: { atkPct: 0.03, defPct: 0.03 }, ride: { dodge: 0.10, crit: 0.06 }, rideDesc: 'Dodge +10%, Crit +6%. CHICKEN JOCKEY!',
  },
  camel: {
    name: 'Camel', rarity: 'rare', art: 'camel', from: 'Shop', price: { coins: 6000 },
    owned: { defPct: 0.04 }, ride: { counter: 0.12 }, rideDesc: 'Counter +12%',
  },
};
