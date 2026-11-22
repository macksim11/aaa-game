// In-run skills. fx values are summed into run.mods. max = times it can be picked.
export const SKILLS = {
  // ---------- COMMON ----------
  star:        { name: 'Throwing Star', icon: '✴️', rarity: 'common', desc: 'Every 2 rounds throw a [b:Throwing Star] (60% ATK).', fx: { starCount: 1 } },
  star_plus:   { name: 'Throwing Star+', icon: '✴️', badge: '+1', rarity: 'common', requires: 'star', desc: 'Throw [b:1 more] star each volley.', fx: { starCount: 1 }, max: 2 },
  heal_star:   { name: 'Healing Star', icon: '💚', rarity: 'common', requires: 'star', desc: 'Stars have a 30% chance to [g:heal 3% HP].', fx: { starHeal: 0.30 } },
  rage_star:   { name: 'Rage Star', icon: '😤', rarity: 'common', requires: 'star', desc: 'Stars have a 35% chance to give [r:+20 Rage].', fx: { starRage: 0.35 } },
  bolt_star:   { name: 'Bolt Star', icon: '⚡', rarity: 'common', requires: 'star', desc: 'Stars have a 30% chance to call [b:lightning] (45% ATK).', fx: { starBolt: 0.30 } },
  poison_star: { name: 'Poison Star', icon: '🟢', rarity: 'common', requires: 'star', desc: 'Stars have a 35% chance to [g:poison] (20% ATK per round).', fx: { starPoison: 0.35 } },
  soccer:      { name: 'Soccer Kick', icon: '⚽', rarity: 'common', desc: 'Every 3 rounds kick a ball that [b:bounces 2 times] between enemies (80% ATK).', fx: { soccer: 1 } },
  soccer_plus: { name: 'Bicycle Kick', icon: '⚽', badge: '+2', rarity: 'common', requires: 'soccer', desc: 'Soccer ball bounces [b:2 more times] and hits 25% harder.', fx: { soccerBounce: 2, soccerDmg: 0.25 }, max: 2 },
  thunder:     { name: 'Thunder Clap', icon: '⚡', rarity: 'common', desc: 'Every 3 rounds [b:2 lightning bolts] strike (50% ATK).', fx: { thunder: 2 } },
  thunder_plus:{ name: 'Thunder Clap+', icon: '⚡', badge: '+2', rarity: 'common', requires: 'thunder', desc: '[b:2 more] lightning bolts.', fx: { thunder: 2 }, max: 2 },
  power_punch: { name: 'Power Punch', icon: '👊', rarity: 'common', desc: '[r:ATK +12%]', fx: { atkPct: 0.12 }, max: 5 },
  iron_body:   { name: 'Iron Body', icon: '🛡️', rarity: 'common', desc: '[b:DEF +20%]', fx: { defPct: 0.20 }, max: 4 },
  big_lunch:   { name: 'Big Lunch', icon: '🍔', rarity: 'common', desc: '[g:Max HP +15%] (and heals that much).', fx: { hpPct: 0.15 }, max: 5 },
  combo:       { name: 'Combo Training', icon: '🥋', rarity: 'common', desc: '[b:Combo chance +12%]: extra punches!', fx: { combo: 0.12 }, max: 3 },
  counter:     { name: 'Counter Stance', icon: '🔄', rarity: 'common', desc: '[b:Counter chance +15%]: hit back when attacked.', fx: { counter: 0.15 }, max: 3 },
  eagle_eye:   { name: 'Eagle Eye', icon: '🎯', rarity: 'common', desc: '[r:Crit chance +10%]', fx: { crit: 0.10 }, max: 3 },
  crit_power:  { name: 'Critical Power', icon: '💥', rarity: 'common', desc: '[r:Crit damage +40%]', fx: { critDmg: 0.40 }, max: 3 },
  quick_feet:  { name: 'Quick Feet', icon: '👟', rarity: 'common', desc: '[b:Dodge +7%]', fx: { dodge: 0.07 }, max: 3 },
  second_wind: { name: 'Second Wind', icon: '🌬️', rarity: 'common', desc: 'While under 50% HP, [g:heal 4% HP] every round.', fx: { lowRegen: 0.04 }, max: 2 },
  snack:       { name: 'Post-Fight Snack', icon: '🍟', rarity: 'common', desc: '[g:Heal 12% HP] after every battle.', fx: { postBattleHeal: 0.12 }, max: 2 },
  lucky_coins: { name: 'Lucky Coins', icon: '🪙', rarity: 'common', desc: '[b:+30% coins] from everything.', fx: { coinPct: 0.30 }, max: 2 },
  fast_learner:{ name: 'Fast Learner', icon: '📚', rarity: 'common', desc: '[b:+25% XP]', fx: { xpPct: 0.25 }, max: 2 },
  fire_fist:   { name: 'Fire Fist', icon: '🔥', rarity: 'common', desc: 'Punches have a 22% chance to [r:Burn] (30% ATK per round, 3 rounds).', fx: { burnChance: 0.22 }, max: 2 },
  ice_palm:    { name: 'Ice Palm', icon: '❄️', rarity: 'common', desc: 'Punches have a 12% chance to [b:Freeze] the enemy for 1 round.', fx: { freezeChance: 0.12 }, max: 2 },
  poison_touch:{ name: 'Poison Touch', icon: '☠️', rarity: 'common', desc: 'Punches have a 25% chance to [g:Poison] (20% ATK per round, 4 rounds).', fx: { poisonChance: 0.25 }, max: 2 },
  rage_builder:{ name: 'Rage Builder', icon: '😡', rarity: 'common', desc: '[r:+50% Rage] gained. Rage unleashes your Dragon Kick!', fx: { rageGain: 0.5 }, max: 2 },
  rage_up:     { name: 'Dragon Kick+', icon: '🐉', rarity: 'common', desc: 'Dragon Kick (Rage skill) deals [r:+60% damage].', fx: { rageDmg: 0.6 }, max: 3 },
  shield_up:   { name: 'Bubble Shield', icon: '🫧', rarity: 'common', desc: 'Start every battle with a [b:shield of 15% Max HP].', fx: { shieldStart: 0.15 }, max: 2 },
  lifesteal:   { name: 'Vampire Fist', icon: '🧛', rarity: 'common', desc: '[g:Heal 8%] of the damage you deal.', fx: { lifesteal: 0.08 }, max: 2 },
  skill_dmg:   { name: 'Skill Boost', icon: '✨', rarity: 'common', desc: 'Stars, soccer balls, lightning and pets deal [b:+20% damage].', fx: { skillDmg: 0.2 }, max: 3 },

  // ---------- LEGENDARY ----------
  berserker:   { name: 'Berserker Belt', icon: '🔴', rarity: 'legendary', desc: '[r:ATK +40%], but Max HP -15%.', fx: { atkPct: 0.40, hpPct: -0.15 } },
  skill_master:{ name: 'Skill Master', icon: '📜', rarity: 'legendary', desc: 'Skill damage [b:+60%], punch damage -20%.', fx: { skillDmg: 0.6, basicDmg: -0.2 } },
  diamond_skin:{ name: 'Diamond Skin', icon: '💎', rarity: 'legendary', desc: '[b:DEF +50%] and Counter +10%.', fx: { defPct: 0.5, counter: 0.10 } },
  creeper_kick:{ name: 'Creeper Kick', icon: '💣', rarity: 'legendary', desc: 'Every 4 rounds a creeper-powered kick [r:EXPLODES] on all enemies (180% ATK).', fx: { creeper: 1 } },
  cinema:      { name: 'Absolute Cinema!', icon: '🎬', rarity: 'legendary', desc: 'First hit of every battle is a [r:guaranteed crit] that deals [r:3x damage]. Absolute cinema!', fx: { cinema: 1 } },
  pinball_wiz: { name: 'Pinball Wizard', icon: '🎰', rarity: 'legendary', desc: 'Every punch has a 30% chance to [b:bounce] for an extra hit.', fx: { bounce: 0.30 } },
  frozen_touch:{ name: 'Frozen Touch', icon: '🧊', rarity: 'legendary', desc: 'Freeze chance +15%. Frozen enemies take [b:+40% damage].', fx: { freezeChance: 0.15, frozenBonus: 0.4 } },
  tornado_kick:{ name: 'Tornado Kick', icon: '🌪️', rarity: 'legendary', desc: 'Dragon Kick hits [r:ALL enemies] and stuns them.', fx: { rageAoe: 1 } },
  burger_fort: { name: 'Burger Fortress', icon: '🏰', rarity: 'legendary', desc: '[g:Regenerate 3% HP] every round.', fx: { regen: 0.03 } },

  // ---------- MYTHIC ----------
  shadow_clone:{ name: 'Shadow Clone', icon: '👥', rarity: 'mythic', desc: 'Combo +15% and combos can chain up to [p:3 times]!', fx: { combo: 0.15, comboMax: 2 } },
  revive:      { name: 'Extra Life', icon: '💖', rarity: 'mythic', desc: '[p:Revive once] with 50% HP when defeated.', fx: { revive: 1 } },
  star_storm:  { name: 'Star Storm', icon: '🌟', rarity: 'mythic', desc: '[p:+3 Throwing Stars] and star damage +50%.', fx: { starCount: 3, starDmg: 0.5 } },
  thunder_god: { name: 'Thunder God', icon: '⛈️', rarity: 'mythic', desc: 'Lightning strikes [p:every round], +3 bolts, +50% lightning damage.', fx: { thunder: 3, thunderEvery1: 1, boltDmg: 0.5 } },
  dragon_fist: { name: 'Dragon Fist', icon: '🐲', rarity: 'mythic', desc: 'Rage fills [p:twice as fast] and Dragon Kick deals [p:double damage].', fx: { rageGain: 1, rageDmg: 1 } },
  golden_burger:{ name: 'Golden Burger', icon: '🌭', rarity: 'mythic', desc: '[p:Max HP +40%] and heal 4% every round.', fx: { hpPct: 0.4, regen: 0.04 } },
  vampire_kick:{ name: 'Vampire Kick', icon: '🦇', rarity: 'mythic', desc: '[p:Lifesteal +20%] and ATK +15%.', fx: { lifesteal: 0.2, atkPct: 0.15 } },
};
SKILLS.golden_burger.icon = '🍔';

export function availableSkills(run, rarity) {
  return Object.entries(SKILLS).filter(([id, s]) => {
    if (rarity && s.rarity !== rarity) return false;
    if (s.requires && !run.skills[s.requires]) return false;
    const have = run.skills[id] || 0;
    return have < (s.max || 1);
  }).map(([id]) => id);
}
