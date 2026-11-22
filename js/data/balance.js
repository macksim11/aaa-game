// ============================================================
//  GAME BALANCE: every number that controls the pace lives here.
//  Tuned with a headless bot that plays the whole game (see tools/sim/).
//  Goal: each chapter takes several tries, and the only way to get
//  stronger is to play (coins come from adventures).
//  Simulated result (8 bot players, random AND smart skill picks): ~50 adventures to beat the game,
//  3-4 tries for chapter 1, 4-5 for chapter 2, 4-10 for later chapters, Black Belt near the end.
// ============================================================
export const BAL = {
  // how much tougher each chapter's monsters are (chapter 1 = 1)
  chapterMult: [1, 1.7, 3.0, 4.15, 6.8, 10.6, 15.8, 19.3, 24.4, 26.8],
  enemyHp: 1.95, enemyAtk: 2.35,
  battlePace: 1.6,                               // >1 = slower, easier-to-follow fights (x1 speed)                  // global monster toughness
  // coins/XP scale with chapter at a slightly slower rate than monsters, so later chapters need a few more tries
  coinPow: 0.85,
  battleCoins: (day) => 6 + day * 0.4,          // base coins per battle (x chapter coin multiplier)
  dayBonus: 3,                                   // coins per day survived, paid when the adventure ends
  clearCoins: 250, clearGems: 25,                // first clear of a chapter (x chapter coin multiplier)
  replayClearFactor: 0.3,
  // permanent training (Belts tab)
  hero: { hp: 400, atk: 40, def: 10 },
  talentGain: { hp: 30, atk: 3, def: 2 },
  talentCost: n => Math.round(30 + 10 * n + 0.1 * n * n),
  beltBonus: 0.04,                               // +4% all stats per belt
  // daily extras (small on purpose: a treat, not a shortcut)
  nanaGift: lvl => [{ coins: 60 * lvl }, { gems: 5 + lvl }, { food: 6 + lvl }, { coins: 40 * lvl, gems: 3 }],
};
export const coinMult = chId => Math.pow(BAL.chapterMult[chId - 1] || 1, BAL.coinPow);
