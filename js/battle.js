import { chance, rand } from './util.js';
import { PETS, petLevelMult } from './data/pets.js';
import { sfx } from './audio.js';
import { BAL } from './data/balance.js';

// Turn-based auto battle, animated on the Scene.
// ctx = { scene, run, hero, emery, petActors, onUpdate }
export async function fight(ctx, enemies, { boss = false, elite = false } = {}) {
  const { scene, run } = ctx;
  const S = run.stats; // live derived stats (recalculated by run)
  // battlePace > 1 slows every beat of the fight so a kid can follow each exchange
  const wait = ms => new Promise(r => setTimeout(r, ms * BAL.battlePace / scene.speed));
  const hero = ctx.hero;
  const maxRounds = (boss || elite) ? 15 : 25;
  let round = 0;
  let firstHit = true;
  run.shield = run.stats.maxHp * (run.mods.shieldStart || 0);
  hero.shield = run.shield;
  hero.stunned = false;
  const alive = () => enemies.filter(e => e.hp > 0);
  const target = () => alive()[0];
  const statusTxt = (a, s, c) => { const p = scene.center(a); scene.floatText(p.x, p.y - 30, s, c, 14); };

  function dealDamage(e, amount, { crit = false, color = '#fff', kind = 'basic', silent = false } = {}) {
    if (!e || e.hp <= 0) return 0;
    if (e.frozen && run.mods.frozenBonus) amount *= 1 + run.mods.frozenBonus;
    amount = Math.max(1, Math.round(amount));
    e.hp -= amount;
    e.anim.hurt = 1;
    const p = scene.center(e);
    if (!silent) {
      scene.floatText(p.x, p.y - 10, (crit ? '' : '-') + fmt(amount) + (crit ? '!' : ''), crit ? '#ffd23a' : color, crit ? 24 : 18, crit);
      scene.hitStar(p.x - 10, p.y, crit);
    }
    if (e.abilities?.thorns && kind === 'basic') { hurtHero(amount * e.abilities.thorns, e, true); }
    if (run.stats.lifesteal && (kind === 'basic' || kind === 'rage')) healHero(amount * run.stats.lifesteal, true);
    run.dmgDealt += amount;
    if (e.hp <= 0) killEnemy(e);
    return amount;
  }
  function killEnemy(e) {
    e.hp = 0; e.fade = true; e.showBar = false;
    sfx('poof'); const p = scene.center(e); scene.sparks(p.x, p.y, '#fff', 10, 160);
    run.kills++;
  }
  function calc(mult, e, kind = 'basic', forceCrit = false, extraCrit = 0) {
    const atk = run.stats.atk;
    let m = mult;
    if (kind === 'basic') m *= 1 + (run.mods.basicDmg || 0);
    else if (kind !== 'rage') m *= 1 + (run.mods.skillDmg || 0);
    let def = (e?.def || 0) * (1 - Math.min(0.45, (e?.shred || 0)));
    let dmg = atk * m * 100 / (100 + def) * rand(0.92, 1.08);
    const crit = forceCrit || chance(run.stats.crit + extraCrit);
    if (crit) dmg *= 1.5 + run.stats.critDmg - 0.5;
    return { dmg, crit };
  }
  function healHero(amount, silent = false) {
    amount = Math.round(amount); if (amount <= 0) return;
    const before = run.hp; run.hp = Math.min(run.stats.maxHp, run.hp + amount);
    if (!silent && run.hp > before) { const p = scene.center(hero); scene.floatText(p.x, p.y - 20, '+' + fmt(run.hp - before), '#5cff6a', 16); }
    ctx.onUpdate();
  }
  function hurtHero(amount, src, silent = false) {
    amount = Math.max(1, Math.round(amount * 100 / (100 + run.stats.def)));
    if (hero.shield > 0) { const ab = Math.min(hero.shield, amount); hero.shield -= ab; amount -= ab; }
    run.hp -= amount; hero.anim.hurt = 1;
    run.rage = Math.min(100, run.rage + 8 * (1 + (run.mods.rageGain || 0)));
    const p = scene.center(hero);
    if (!silent && amount > 0) scene.floatText(p.x, p.y - 10, '-' + fmt(amount), '#ff5a6a', 18);
    ctx.onUpdate();
    return amount;
  }
  function onHitProcs(e) {
    if (!e || e.hp <= 0) return;
    const M = run.mods;
    if (M.burnChance && chance(M.burnChance)) { e.burn = { dmg: run.stats.atk * 0.3, turns: 3 }; statusTxt(e, 'BURN', '#ff8a3d'); }
    if (M.poisonChance && chance(M.poisonChance)) { e.poison = { dmg: run.stats.atk * 0.2, turns: 4 }; statusTxt(e, 'POISON', '#6cff6a'); }
    if (M.freezeChance && chance(M.freezeChance) && !e.boss) { e.frozen = 1; statusTxt(e, 'FROZEN', '#9fe8ff'); }
    else if (M.freezeChance && chance(M.freezeChance * 0.5) && e.boss) { e.frozen = 1; statusTxt(e, 'FROZEN', '#9fe8ff'); }
    if (M.boltChance && chance(M.boltChance)) { const p = scene.center(e); scene.lightning(p.x, p.y); const r = calc(0.45 * (1 + (M.boltDmg || 0)), e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#bfa6ff', kind: 'skill' }); }
  }

  async function basicAttack(isCombo = false) {
    const e = target(); if (!e) return;
    hero.attackAnim = Math.random() < 0.55 ? 'punch' : 'kick'; hero.lunge = 48; hero.anim.attack = 1; sfx(isCombo ? 'punch2' : 'punch');
    await wait(140);
    if (e.hp <= 0) return;
    if (e.abilities?.dodge && chance(e.abilities.dodge)) { statusTxt(e, 'MISS', '#ddd'); await wait(150); return; }
    const cinema = firstHit && run.mods.cinema; firstHit = false;
    const r = calc(cinema ? 3 : 1, e, 'basic', cinema);
    if (cinema) { scene.bigText('ABSOLUTE CINEMA!', '#ffd23a', 1.2); scene.flash('#fff', 0.2); sfx('cinema'); }
    if (r.crit) { scene.shake(0.25); sfx('crit'); }
    dealDamage(e, r.dmg, { crit: r.crit });
    run.rage = Math.min(100, run.rage + 20 * (1 + (run.mods.rageGain || 0)));
    onHitProcs(e);
    ctx.onUpdate();
    await wait(170);
    if (run.mods.bounce && chance(run.mods.bounce) && target()) {
      const t2 = alive()[alive().length > 1 ? 1 : 0];
      const p1 = scene.center(e), p2 = scene.center(t2);
      await scene.projectile('ball', p1.x, p1.y, p2.x, p2.y - 10, 0.18, 30);
      const r2 = calc(0.6, t2, 'basic'); dealDamage(t2, r2.dmg, { crit: r2.crit, color: '#ffb3ff' }); statusTxt(t2, 'BOUNCE!', '#ffb3ff');
    }
  }
  async function dragonKick() {
    run.rage = 0; ctx.onUpdate();
    const M = run.mods; const targets = M.rageAoe ? alive() : [target()];
    hero.attackAnim = 'kick'; hero.lunge = 90; hero.anim.attack = 1.2; hero.shout = true; sfx('dragon');
    scene.bigText('DRAGON KICK!', '#ff9a3d', 0.9);
    await wait(220);
    for (const e of targets) { if (!e || e.hp <= 0) continue; const r = calc(2.5 * (1 + (M.rageDmg || 0)), e, 'rage'); dealDamage(e, r.dmg, { crit: r.crit, color: '#ff9a3d' }); scene.explosion(scene.center(e).x, scene.center(e).y, 26); if (M.rageAoe && e.hp > 0) { e.stunned = 1; } }
    hero.shout = false;
    await wait(280);
  }
  async function stars() {
    const n = run.mods.starCount || 0; if (!n) return;
    const p = scene.center(hero);
    sfx('throw');
    const throws = [];
    for (let i = 0; i < n; i++) {
      const e = alive()[i % Math.max(1, alive().length)]; if (!e) break;
      const q = scene.center(e);
      throws.push((async () => {
        await wait(i * 90);
        await scene.projectile('star', p.x + 10, p.y - 10, q.x, q.y - 6 + i * 3, 0.28, 20);
        if (e.hp <= 0) return;
        const r = calc(0.6 * (1 + (run.mods.starDmg || 0)), e, 'skill');
        dealDamage(e, r.dmg, { crit: r.crit, color: '#9fd8ff', kind: 'skill' });
        const M = run.mods;
        if (M.starHeal && chance(M.starHeal)) healHero(run.stats.maxHp * 0.03);
        if (M.starRage && chance(M.starRage)) { run.rage = Math.min(100, run.rage + 20); statusTxt(hero, '+RAGE', '#ff7a3d'); }
        if (M.starBolt && chance(M.starBolt) && e.hp > 0) { scene.lightning(q.x, q.y); const r2 = calc(0.45 * (1 + (M.boltDmg || 0)), e, 'skill'); dealDamage(e, r2.dmg, { crit: r2.crit, color: '#bfa6ff', kind: 'skill' }); }
        if (M.starPoison && chance(M.starPoison) && e.hp > 0) { e.poison = { dmg: run.stats.atk * 0.2, turns: 4 }; statusTxt(e, 'POISON', '#6cff6a'); }
      })());
    }
    await Promise.all(throws);
    await wait(100);
  }
  async function soccer() {
    const M = run.mods; let e = target(); if (!e) return;
    const bounces = 2 + (M.soccerBounce || 0);
    let from = scene.center(hero); sfx('kick');
    for (let i = 0; i < bounces; i++) {
      const list = alive(); if (!list.length) break;
      e = list[i % list.length];
      const q = scene.center(e);
      await scene.projectile('ball', from.x, from.y + 10, q.x, q.y, 0.24, 40);
      if (e.hp > 0) { const r = calc(0.8 * (1 + (M.soccerDmg || 0)), e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#9fd8ff', kind: 'skill' }); sfx('boing'); }
      from = q;
    }
  }
  async function thunder() {
    const M = run.mods; const n = M.thunder || 0;
    sfx('zap');
    for (let i = 0; i < n; i++) {
      const list = alive(); if (!list.length) break;
      const e = list[Math.floor(Math.random() * list.length)]; const q = scene.center(e);
      scene.lightning(q.x + (Math.random() - 0.5) * 10, q.y);
      const r = calc(0.5 * (1 + (M.boltDmg || 0)), e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#bfa6ff', kind: 'skill' });
      await wait(110);
    }
  }
  async function creeperKick() {
    sfx('boom');
    for (const e of alive()) { const q = scene.center(e); scene.explosion(q.x, q.y, 40); const r = calc(1.8, e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#ffcf33', kind: 'skill' }); }
    await wait(300);
  }
  async function petAttack(pa) {
    const def = PETS[pa.id]; const A = def.attack; const lvl = petLevelMult(pa.level);
    const e = target(); if (!e && !A.heal) return;
    pa.lunge = 40; pa.anim.attack = 1; sfx('pet');
    await wait(150);
    if (A.heal) { healHero(run.stats.maxHp * A.heal * (0.8 + lvl * 0.2)); scene.healFx(hero); }
    if (A.shield) { hero.shield = (hero.shield || 0) + run.stats.maxHp * A.shield; }
    if (!A.mult) { await wait(150); return; }
    const hits = A.hits || 1;
    const targets = A.all ? alive() : A.chain ? alive().slice(0, A.chain) : [e];
    const others = ctx.petActors.length - 1;
    for (const t of targets) {
      for (let h = 0; h < hits; h++) {
        if (!t || t.hp <= 0) continue;
        let mult = A.mult * lvl * (1 + (A.packBonus || 0) * others);
        if (A.chain) { const q = scene.center(t); scene.lightning(q.x, q.y); }
        if (A.all && A.burn) { const q = scene.center(t); scene.explosion(q.x, q.y, 22); t.burn = { dmg: run.stats.atk * A.burn, turns: 3 }; }
        if (def.art === 'eevee') { const p = scene.center(pa), q = scene.center(t); await scene.projectile('swift', p.x, p.y, q.x, q.y, 0.18, 10); }
        const r = calc(mult, t, 'pet', !!A.alwaysCrit);
        dealDamage(t, r.dmg, { crit: r.crit, color: '#e3b3ff', kind: 'pet' });
        if (A.stun && chance(A.stun) && t.hp > 0) { t.stunned = 1; statusTxt(t, 'STUN', '#ffe14a'); }
        if (A.defShred && t.hp > 0) { t.shred = Math.min(0.45, (t.shred || 0) + A.defShred); statusTxt(t, 'DEF DOWN', '#ffcf33'); }
        if (hits > 1) await wait(90);
      }
    }
    await wait(160);
  }
  async function emeryAttack() {
    const em = ctx.emery; const e = target(); if (!em || !e) return;
    em.attackAnim = Math.random() < 0.5 ? 'punch' : 'kick'; em.lunge = 60; em.anim.attack = 1; sfx('punch');
    await wait(150);
    if (e.hp <= 0) return;
    const r = calc(1.0, e, 'emery');
    dealDamage(e, r.dmg / (1 + (run.mods.skillDmg || 0)), { crit: r.crit, color: '#ffb36b', kind: 'emery' });
    if (r.crit) scene.shake(0.2);
    await wait(170);
  }
  async function mountSkill() {
    const R = run.ride; if (!R) return;
    if (R.charge && round % R.charge.every === 0 && target()) {
      hero.lunge = 80; hero.anim.attack = 1; sfx('gallop'); await wait(160);
      const e = target(); if (e) { const r = calc(R.charge.mult, e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#ffd9a0', kind: 'skill' }); }
      await wait(150);
    }
    if (R.ram && round % R.ram.every === 0 && target()) {
      hero.lunge = 120; hero.anim.attack = 1; sfx('honk'); scene.bigText(R.ram.stun ? 'HONK HONK!' : 'FORE!', '#fff', 0.8); await wait(200);
      for (const e of alive()) { const r = calc(R.ram.mult, e, 'skill'); dealDamage(e, r.dmg, { crit: r.crit, color: '#ffd9a0', kind: 'skill' }); if (R.ram.stun && chance(R.ram.stun) && e.hp > 0) { e.stunned = 1; statusTxt(e, 'STUN', '#ffe14a'); } }
      scene.shake(0.3); await wait(200);
    }
  }
  // ----- enemy actions -----
  async function enemyAct(e) {
    if (e.hp <= 0) return;
    if (e.stunned || e.frozen) { e.stunned = 0; e.frozen = 0; return; }
    const A = e.abilities || {};
    const r = round;
    e.attackAnim = 'special';
    const p = scene.center(e), h = scene.center(hero);
    // special abilities
    if (A.explode && r === A.explode) {
      e.anim.flash = 1; sfx('hiss'); await wait(400);
      scene.explosion(p.x, p.y, 60); sfx('boom');
      hurtHero(e.atk * 3.5, e); killEnemy(e); await wait(300); return;
    }
    if (A.heal && r % 3 === 0 && e.hp < e.maxHp) { const amt = e.maxHp * A.heal; e.hp = Math.min(e.maxHp, e.hp + amt); scene.healFx(e); statusTxt(e, '+' + fmt(amt), '#5cff6a'); await wait(300); return; }
    if (A.bomb && r % A.bomb === 0) { e.anim.attack = 1; await scene.projectile('tnt', p.x, p.y - 20, h.x, h.y, 0.5, 80); scene.explosion(h.x, h.y, 50); sfx('boom'); hurtHero(e.atk * 2.0, e); await wait(250); return; }
    if (A.volley && r % A.volley === 0) { e.anim.attack = 1; sfx('throw'); await Promise.all([0, 1, 2].map(i => scene.projectile('arrow', p.x, p.y - 10, h.x, h.y - 10 + i * 8, 0.3 + i * 0.05, 30))); hurtHero(e.atk * 1.9, e); await wait(200); return; }
    if (A.teleport && r % A.teleport === 0) { e.alpha = 0.2; await wait(200); e.alpha = 1; e.anim.attack = 1; statusTxt(e, 'TELEPORT!', '#d36bff'); hurtHero(e.atk * 2.2, e); await wait(250); return; }
    if (A.sonic && r % A.sonic === 0) { e.anim.attack = 1; statusTxt(e, 'SONIC BOOM', '#38f3e6'); sfx('sonic'); await wait(300); scene.ring(p.x, p.y); scene.beam(p.x, p.y - 10, h.x, h.y); scene.shake(0.5); hurtHero(e.atk * 2.8, e); await wait(250); return; }
    if (A.goodcop && r % A.goodcop === 0) { statusTxt(e, 'GOOD COP?', '#9fd8ff'); const amt = e.maxHp * 0.07; e.hp = Math.min(e.maxHp, e.hp + amt); await wait(250); e.anim.attack = 1; statusTxt(e, 'BAD COP!', '#ff5a6a'); hurtHero(e.atk * 2.0, e); await wait(250); return; }
    if (A.fireball && r % A.fireball === 0) { e.anim.attack = 1; await scene.projectile(e.art === 'toasty' ? 'toast' : 'fire', p.x, p.y - 10, h.x, h.y, 0.4, 30); scene.explosion(h.x, h.y, 30); sfx('boom'); hurtHero(e.atk * 2.0, e); await wait(200); return; }
    if (A.laser && r % A.laser === 0) { e.anim.attack = 1; sfx('sonic'); await wait(300); scene.beam(p.x, p.y, h.x, h.y, '#ff3a8a'); hurtHero(e.atk * 2.2, e); await wait(250); return; }
    if (A.orb && r % A.orb === 0) { e.anim.attack = 1; statusTxt(e, 'ORB OF DOMINANCE', '#ffb020'); await scene.projectile('orb', p.x + 10, p.y - 40, h.x, h.y, 0.5, 60); scene.explosion(h.x, h.y, 40); hurtHero(e.atk * 2.4, e); await wait(250); return; }
    if (A.kragle && r % A.kragle === 0) { e.anim.attack = 1; statusTxt(e, 'KRAGLE!', '#c22'); await scene.projectile('kragle', p.x, p.y - 20, h.x, h.y, 0.45, 40); hurtHero(e.atk * 1.8, e); hero.stunned = true; statusTxt(hero, 'GLUED!', '#e6ffe0'); await wait(250); return; }
    if (A.summon && r % A.summon === 0 && alive().length < 3) { statusTxt(e, 'MICRO MANAGERS!', '#ff5555'); ctx.summon?.(e); await wait(400); return; }
    if (A.charge && r % A.charge === 0) { e.lunge = 120; e.anim.attack = 1; await wait(200); scene.shake(0.4); hurtHero(e.atk * 2.0, e); await wait(200); return; }
    // normal attack
    e.attackAnim = 'attack';
    e.lunge = (e.art === 'skeleton' || e.art === 'pillager' || e.art === 'blaze' || e.art === 'ghast' || e.art === 'guardian') ? 0 : 46;
    e.anim.attack = 1; sfx('enemyHit');
    if (!e.lunge) { const kind = e.art === 'blaze' || e.art === 'ghast' ? 'fire' : 'arrow'; await scene.projectile(kind, p.x, p.y - 10, h.x, h.y, 0.25, 10); }
    else await wait(140);
    if (chance(Math.min(0.6, run.stats.dodge))) { statusTxt(hero, 'DODGE', '#9fd8ff'); await wait(140); return; }
    hurtHero(e.atk * rand(0.9, 1.1), e);
    if (A.poison && chance(A.poison)) { run.poisoned = { dmg: e.atk * 0.25, turns: 3 }; statusTxt(hero, 'POISONED', '#6cff6a'); }
    await wait(140);
    if (chance(run.stats.counter) && e.hp > 0 && run.hp > 0) { statusTxt(hero, 'COUNTER!', '#ffcf33'); await basicAttack(); }
  }
  async function tickDots() {
    for (const e of alive()) {
      if (e.burn?.turns > 0) { e.burn.turns--; dealDamage(e, e.burn.dmg * (1 + (run.mods.skillDmg || 0)), { color: '#ff8a3d', kind: 'dot' }); }
      if (e.poison?.turns > 0 && e.hp > 0) { e.poison.turns--; dealDamage(e, e.poison.dmg * (1 + (run.mods.skillDmg || 0)), { color: '#6cff6a', kind: 'dot' }); }
    }
    if (run.poisoned?.turns > 0) { run.poisoned.turns--; hurtHero(run.poisoned.dmg, null); }
  }
  async function checkDeath() {
    if (run.hp > 0) return false;
    if (run.mods.revive && !run.revived) {
      run.revived = true; run.hp = Math.round(run.stats.maxHp * 0.5); hero.anim.hurt = 0;
      scene.bigText('EXTRA LIFE!', '#ff7ac8', 1.2); scene.healFx(hero); sfx('levelup'); ctx.onUpdate(); await wait(600);
      return false;
    }
    return true;
  }

  // ======== MAIN LOOP ========
  for (const e of enemies) { e.showBar = true; }
  ctx.onRound?.(0, maxRounds);
  await wait(300);
  while (alive().length && run.hp > 0) {
    round++;
    ctx.onRound?.(round, maxRounds);
    if (round > maxRounds) break;
    // --- player phase ---
    if (hero.stunned) { hero.stunned = false; statusTxt(hero, 'STUCK!', '#e6ffe0'); await wait(300); }
    else {
      await basicAttack();
      let combos = 0; const maxC = 1 + (run.mods.comboMax || 0);
      while (alive().length && combos < maxC && chance(Math.min(0.75, run.stats.combo))) { combos++; statusTxt(hero, combos > 1 ? `COMBO x${combos + 1}!` : 'COMBO!', '#ffcf33'); await basicAttack(true); }
      if (alive().length && run.rage >= 100) await dragonKick();
    }
    if (alive().length && round % 2 === 0) await stars();
    if (alive().length && run.mods.soccer && round % 3 === 0) await soccer();
    if (alive().length && run.mods.thunder && (run.mods.thunderEvery1 || round % 3 === 0)) await thunder();
    if (alive().length && run.mods.creeper && round % 4 === 0) await creeperKick();
    for (const pa of ctx.petActors) { const A = PETS[pa.id].attack; if (alive().length && round % A.every === 0) await petAttack(pa); }
    if (alive().length && ctx.emery && round % 2 === 0) await emeryAttack();
    if (alive().length) await mountSkill();
    if (alive().length) await tickDots();
    if (!alive().length) break;
    // --- enemy phase ---
    await wait(260);   // short beat when the turn switches sides
    for (const e of alive()) { await enemyAct(e); await wait(120); if (run.hp <= 0 && await checkDeath()) break; }
    if (run.hp <= 0) break;
    // --- end of round ---
    const M = run.mods;
    if (M.regen) healHero(run.stats.maxHp * M.regen, true);
    if (M.lowRegen && run.hp < run.stats.maxHp * 0.5) healHero(run.stats.maxHp * M.lowRegen);
    hero.shield = Math.max(0, hero.shield || 0);
    ctx.onUpdate();
    await wait(200);
  }
  hero.shield = 0; ctx.onRound?.(null);
  const won = !alive().length && run.hp > 0;
  (window.__fights = window.__fights || []).push({ day: run.day, boss, elite, round, hpPct: Math.round(run.hp / run.stats.maxHp * 100), won, lvl: run.level, atk: run.stats.atk, maxHp: run.stats.maxHp });
  if (won && run.mods.postBattleHeal) { healHero(run.stats.maxHp * run.mods.postBattleHeal); }
  return { won, timeout: round > maxRounds };
}

function fmt(n) { n = Math.round(n); if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K'; return String(n); }
