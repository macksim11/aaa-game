import { el, rich, pick, weighted, chance, randi, sleep, shuffle, fmt, toast, icon } from './util.js';
import { S, save } from './state.js';
import { heroStats, beltInfo } from './stats.js';
import { Scene } from './scene.js';
import { CHAPTERS, chapterById, BOSS_HP, BOSS_ATK, ELITE_HP, ELITE_ATK } from './data/chapters.js';
import { ENEMIES } from './data/enemies.js';
import { EVENTS, WALK_TEXTS } from './data/events.js';
import { SKILLS, availableSkills } from './data/skills.js';
import { PETS, FAMILY_PET_ORDER } from './data/pets.js';
import { MOUNTS } from './data/mounts.js';
import { FAMILY } from './data/family.js';
import { GEAR, randomGearId } from './data/gear.js';
import { arloLook } from './art/people.js';
import { fight } from './battle.js';
import { sfx, playMusic } from './audio.js';
import { modal, skillPicker, skillIcon, infoModal, confirmModal, rewardChips, canvasBox } from './ui/common.js';
import { playPinball } from './ui/pinball.js';
import { playComic, ENDING } from './ui/comic.js';
import { drawPet } from './art/animals.js';
import { drawPerson } from './art/people.js';
import { preloadSheets } from './art/sheets.js';

const SHEET_PETS = ['twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko', 'wolf', 'axolotl', 'eevee', 'pikachu', 'charizard'];
const EV_ICON = { poutine: 'poutine', bagel: 'bagel', depanneur: 'slushie', lego: 'lego', kragle_puddle: 'kragle', board_game: 'dice', pinball: 'pinball', penalty: 'goal', goal: 'goal', fountain: 'fountain', potion: 'potion', sugar_shack: 'taffy', golden_burger: 'big_lunch', diamond: 'gem', pigeon_coins: 'coin', food_bag: 'food', mcdonalds: 'big_lunch', obby: 'trophy', gi_found: 'belts', kata: 'power_punch', pushups: 'power_punch', chess: 'fast_learner', steve: 'heal_star', crossing_guard: 'heal_star', habs: 'g_hockey_stick', sprinkler: 'g_water_shoes', rain: 'second_wind', wind: 'second_wind', lego_salesman: 'lego', raccoon: 'skill_dmg', gym: 'combo', cat_cafe: 'pets' };
const NUM_KEYS = ['hpPct', 'atkPct', 'defPct', 'crit', 'critDmg', 'combo', 'counter', 'dodge', 'lifesteal', 'coinPct', 'xpPct', 'regen', 'shieldStart', 'postBattleHeal', 'boltChance'];

export function startRun(chId, onExit) {
  const ch = chapterById(chId);
  S.stats.runs++; save();
  const root = document.getElementById('screen'); root.innerHTML = '';
  playMusic('adventure');

  // ---------- run state ----------
  const run = {
    ch, day: 0, level: 1, xp: 0, rage: 0, coins: 0, gems: 0, food: 0, kills: 0, dmgDealt: 0,
    skills: {}, mods: {}, ev: { maxHp: 0, atk: 0, def: 0 }, base: heroStats(), revived: false, stats: {}, hp: 0,
    ride: S.mounts.equipped ? MOUNTS[S.mounts.equipped]?.ride : null,
    papi: S.papiBuff, petsJoined: [], over: false,
  };
  S.papiBuff = null; save(); // Papi's meal is used up by this adventure
  function recalc(first = false) {
    const m = {};
    const addFx = fx => { for (const [k, v] of Object.entries(fx || {})) m[k] = (m[k] || 0) + v; };
    for (const [id, n] of Object.entries(run.skills)) for (let i = 0; i < n; i++) addFx(SKILLS[id].fx);
    if (run.papi) addFx(run.papi.fx);
    if (run.ride) for (const k of NUM_KEYS) if (run.ride[k]) m[k] = (m[k] || 0) + run.ride[k];
    run.mods = m;
    const B = run.base, lv = 1 + 0.06 * (run.level - 1);
    const old = run.stats.maxHp;
    run.stats = {
      maxHp: Math.max(1, Math.round(B.hp * Math.max(0.2, 1 + (m.hpPct || 0) + run.ev.maxHp) * lv)),
      atk: Math.max(1, Math.round(B.atk * Math.max(0.2, 1 + (m.atkPct || 0) + run.ev.atk) * lv)),
      def: Math.max(0, Math.round(B.def * Math.max(0.2, 1 + (m.defPct || 0) + run.ev.def) * (1 + 0.03 * (run.level - 1)))),
      crit: B.crit + (m.crit || 0), critDmg: B.critDmg + (m.critDmg || 0), combo: B.combo + (m.combo || 0),
      counter: B.counter + (m.counter || 0), dodge: B.dodge + (m.dodge || 0), lifesteal: B.lifesteal + (m.lifesteal || 0),
    };
    if (first) run.hp = run.stats.maxHp;
    else if (old && run.stats.maxHp > old) run.hp += run.stats.maxHp - old;
    run.hp = Math.min(run.hp, run.stats.maxHp);
  }
  recalc(true);
  const xpNext = () => 25 + 12 * run.level;
  const coinMult = 1 + (ch.id - 1) * 0.7;
  const hasAlyzee = S.rescued.family.includes('alyzee');

  // ---------- schedule ----------
  const schedule = [null];
  const petDays = {}; for (const p of ch.pets || []) if (!S.rescued.pets.includes(p.id)) petDays[p.day] = p;
  const eliteDay = Math.round(ch.days * 0.55);
  let lastEv = [];
  for (let d = 1; d <= ch.days; d++) {
    if (d === ch.days) schedule.push({ type: 'boss' });
    else if (d === 1) schedule.push({ type: 'start' });
    else if (petDays[d]) schedule.push({ type: 'pet', pet: petDays[d] });
    else if (d === eliteDay) schedule.push({ type: 'elite' });
    else {
      const prevBattle = schedule[d - 1]?.type === 'battle' && schedule[d - 2]?.type === 'battle';
      if (!prevBattle && chance(d % 2 === 0 ? 0.62 : 0.32)) schedule.push({ type: 'battle' });
      else if (chance(0.08)) schedule.push({ type: 'walk' });
      else {
        let ev; let tries = 0;
        do { ev = weighted(EVENTS); tries++; } while (lastEv.includes(ev.id) && tries < 10);
        lastEv = [ev.id, ...lastEv].slice(0, 6);
        schedule.push({ type: 'event', ev });
      }
    }
  }

  // ---------- DOM ----------
  const canvas = el('canvas');
  const trackEl = el('div', { class: 'track' });
  const coinsEl = el('div', { class: 'coins-pill' }, '🪙 0');
  const roundEl = el('div', { class: 'round-label', style: { display: 'none' } });
  const speedBtn = el('button', { class: 'speed-btn', onclick: () => { S.settings.speed = S.settings.speed === 1 ? 2 : S.settings.speed === 2 ? 3 : 1; scene.speed = S.settings.speed; speedBtn.textContent = 'x' + S.settings.speed; save(); } }, 'x' + S.settings.speed);
  const menuBtn = el('button', { class: 'icon-btn', onclick: () => pauseMenu() }, '⚙️');
  const sceneWrap = el('div', { class: 'scene-wrap' }, canvas, el('div', { class: 'hud-top' }, menuBtn, trackEl, coinsEl), roundEl, speedBtn);
  const lvlEl = el('div', { class: 'lvl' }), hpFill = el('div', { class: 'fill' }), hpShield = el('div', { class: 'shield' }), hpTxt = el('span');
  const atkEl = el('span'), defEl = el('span'), rageFill = el('div', { style: { height: '100%', background: '#ff9a3d', width: '0%' } });
  const statbar = el('div', { class: 'statbar' }, lvlEl,
    el('div', { style: { flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' } }, el('div', { class: 'hpbar' }, hpFill, hpShield, hpTxt), el('div', { class: 'xpbar', style: { width: '100%', height: '5px' } }, rageFill)),
    el('div', { class: 'stat-chip' }, '⚔️', atkEl), el('div', { class: 'stat-chip' }, '🛡️', defEl));
  const log = el('div', { class: 'log' });
  const actions = el('div', { class: 'actions' });
  const skillsBtn = el('button', { class: 'icon-btn skills-btn', onclick: () => showSkills(), style: { width: '44px', height: '44px', fontSize: '22px' } }, '📖');
  const runEl = el('div', { class: 'run' }, sceneWrap, statbar, log, actions);
  root.append(runEl); runEl.append(skillsBtn);

  const scene = new Scene(canvas, ch.theme);
  preloadSheets(['chars/arlo', 'chars/emery', ...(S.mounts.equipped ? [`rides/${S.mounts.equipped}`] : []), ...S.pets.equipped.filter(id => SHEET_PETS.includes(id)).map(id => `chars/${id}`), `bosses/${ch.boss}`, ...ch.enemies.map(k => `mobs/${ENEMIES[k].art}`), `mobs/${ENEMIES[ch.elite].art}`]);
  scene.speed = S.settings.speed;
  const belt = beltInfo();
  const weaponItem = S.gear.items.find(i => i.uid === S.gear.slots.weapon);
  const hero = scene.add({ kind: 'person', sheet: 'chars/arlo', look: arloLook(S, belt.color), x: 0, z: 5, walkPhase: 0, mount: S.mounts.equipped, weapon: weaponItem ? weaponItem.id : null, facing: 1 });
  const emery = S.rescued.family.includes('emery') ? scene.add({ kind: 'person', sheet: 'chars/emery', look: FAMILY.emery.look, x: 0, z: 3, walkPhase: 1, seed: 1.3 }) : null;
  const petActors = [];
  function addPetActor(id) {
    const p = S.pets.owned[id]; if (!p) return;
    const a = scene.add({ kind: 'pet', id, sheet: SHEET_PETS.includes(id) ? `chars/${id}` : null, level: p.level, x: -50, z: 6 + petActors.length, walkPhase: petActors.length * 1.7, seed: petActors.length * 0.7, scale: 0.95 });
    petActors.push(a); layout();
  }
  for (const id of S.pets.equipped) addPetActor(id);
  scene.layout = layout;
  function layout() {
    const u = scene.u, w = scene.w;
    hero.x = w * 0.34 + (hero.mount ? 10 : 0);
    if (emery) { emery.x = w * 0.13; emery.dy = -4 * u; }
    const slots = hero.mount ? [[-86, 30], [-128, 22], [60, 34]] : [[-46, 34], [44, 36], [-96, 26]];
    petActors.forEach((p, i) => { p.x = hero.x + slots[i][0] * u; p.dy = slots[i][1] * u * 0.5; p.scale = hero.mount ? 0.82 : 0.95; });
    if (emery && hero.mount) emery.x = w * 0.1;
    const eSlots = [0.74, 0.88, 0.6];
    scene.actors.filter(a => a.enemy && a.moveTo == null).forEach((a, i) => { a.x = w * eSlots[i % 3]; });
  }
  layout();

  // ---------- UI updates ----------
  function updateUI() {
    const st = run.stats;
    lvlEl.innerHTML = `<div style="font-size:11px">Lv.${run.level}</div>`;
    const xb = el('div', { class: 'xpbar' }, el('div', { style: { width: Math.min(100, run.xp / xpNext() * 100) + '%' } })); lvlEl.append(xb);
    hpFill.style.width = Math.max(0, run.hp / st.maxHp * 100) + '%';
    hpShield.style.width = Math.min(100, (hero.shield || 0) / st.maxHp * 100) + '%';
    hpTxt.textContent = `${fmt(Math.max(0, run.hp))} / ${fmt(st.maxHp)}`;
    atkEl.textContent = fmt(st.atk); defEl.textContent = fmt(st.def);
    rageFill.style.width = run.rage + '%';
    coinsEl.textContent = '🪙 ' + fmt(run.coins);
    renderTrack();
  }
  const ICON = { battle: '⚔️', elite: '💀', boss: '👑', pet: '🐾', start: '🏁', walk: '👣' };
  function evIcon(sd) {
    if (sd.type !== 'event') return ICON[sd.type];
    if (!hasAlyzee) return '❓';
    return sd.ev.choices ? '🎲' : sd.ev.kind === 'good' ? '🍀' : '⚡';
  }
  function renderTrack() {
    trackEl.innerHTML = '';
    trackEl.append(el('span', { class: 'day-label' }, `Day ${run.day}/${ch.days}`));
    const n = hasAlyzee ? 5 : 4;
    for (let i = 0; i < n; i++) {
      const d = run.day + i; if (d > ch.days || d < 1) continue;
      if (i) trackEl.append(el('span', { class: 'line' }));
      const sd = schedule[d];
      // only battles/boss/pets are visible ahead without Alyzée's lashes; events show ❓
      trackEl.append(el('span', { class: 'node' + (i === 0 ? ' now' : '') }, evIcon(sd)));
    }
  }
  function addCard(html, cls = '', day = true, tags = null, ic = null) {
    const c = el('div', { class: 'card ' + cls + (ic ? ' with-icon' : '') });
    if (ic) c.append(icon(ic, 40, ''));
    if (day) c.append(el('div', { class: 'day' }, `Day ${run.day}`));
    c.append(el('div', { html: rich(html) }));
    if (tags?.length) { const t = el('div', { class: 'tags' }); tags.forEach(x => t.append(x)); c.append(t); }
    log.append(c); while (log.children.length > 30) log.firstChild.remove();
    requestAnimationFrame(() => { log.scrollTop = log.scrollHeight; });
    return c;
  }
  function tag(cls, txt) { return el('span', { class: 'tag ' + cls }, txt); }
  function setActions(btns) { actions.innerHTML = ''; btns.forEach(b => actions.append(b)); }
  function btn(label, color, fn, sub) {
    const b = el('button', { class: `btn ${color}` + (sub != null ? ' choice' : ''), onclick: () => { sfx('click'); fn(); } }, label);
    if (sub) b.append(el('span', { class: 'sub' }, sub));
    return b;
  }
  const busy = (label = 'Moving', color = 'green') => setActions([el('button', { class: `btn ${color}`, disabled: true }, label + '...')]);

  // ---------- effects ----------
  function applyEffect(e, srcText) {
    const tags = [];
    if (e.random) { const r = pick(e.random); return applyEffect(r, srcText); }
    if (e.heal) { const amt = Math.round(run.stats.maxHp * e.heal); run.hp = Math.max(1, Math.min(run.stats.maxHp, run.hp + amt)); tags.push(tag(e.heal > 0 ? 'hp' : 'neg', `${e.heal > 0 ? '❤️ Restore' : '💔 Lose'} ${Math.round(Math.abs(e.heal) * 100)}% HP`)); if (e.heal > 0) scene.healFx(hero); else hero.anim.hurt = 1; }
    if (e.maxHp) { run.ev.maxHp += e.maxHp; tags.push(tag(e.maxHp > 0 ? 'hp' : 'neg', `Max HP ${e.maxHp > 0 ? '+' : ''}${Math.round(e.maxHp * 100)}%`)); }
    if (e.atk) { run.ev.atk += e.atk; tags.push(tag(e.atk > 0 ? 'atk' : 'neg', `ATK ${e.atk > 0 ? '+' : ''}${Math.round(e.atk * 100)}%`)); }
    if (e.def) { run.ev.def += e.def; tags.push(tag(e.def > 0 ? 'def' : 'neg', `DEF ${e.def > 0 ? '+' : ''}${Math.round(e.def * 100)}%`)); }
    if (e.xp) { const x = Math.round((20 + run.day) * e.xp); run.xp += x; tags.push(tag('xp', `EXP +${x}`)); }
    if (e.coins) { const c = Math.round((8 + run.day * 0.6) * coinMult * e.coins * (1 + (run.mods.coinPct || 0))); run.coins += c; tags.push(tag('coin', `🪙 +${c}`)); sfx('coin'); }
    if (e.gems) { run.gems += e.gems; tags.push(tag('gem', `💎 +${e.gems}`)); }
    if (e.food) { run.food += e.food; tags.push(tag('coin', `🦴 Pet food +${e.food}`)); }
    recalc(); updateUI();
    return tags;
  }
  async function checkLevelUp() {
    while (run.xp >= xpNext()) {
      run.xp -= xpNext(); run.level++; recalc();
      run.hp = Math.min(run.stats.maxHp, run.hp + Math.round(run.stats.maxHp * 0.1));
      updateUI();
      addCard(`You've reached [g:Lv.${run.level}]!`, '', false);
      await chooseSkill('common', `Level ${run.level}!`);
    }
    updateUI();
  }
  async function chooseSkill(rarity, title = 'Choose a skill') {
    let pool = availableSkills(run, rarity);
    if (!pool.length) pool = availableSkills(run);
    let opts = shuffle(pool).slice(0, 3);
    if (rarity === 'common' && chance(0.1)) { const leg = shuffle(availableSkills(run, 'legendary'))[0]; if (leg) opts[2] = leg; }
    if (!opts.length) { addCard('You already know every skill! Absolute cinema.', '', false); return; }
    const id = await skillPicker(opts, title, rarity === 'mythic' ? 'Mythic power!' : rarity === 'legendary' ? 'Legendary!' : 'Choose a skill from below');
    run.skills[id] = (run.skills[id] || 0) + 1;
    const s = SKILLS[id];
    if (s.fx.hpPct > 0) run.hp += 0; // recalc handles the heal on max HP increase
    recalc(); updateUI();
    addCard(`You've learned [b:${s.name}].`, '', false);
  }

  // ---------- enemies ----------
  function makeEnemy(key, slot = 0, opts = {}) {
    const d = ENEMIES[key]; const prog = 1 + (run.day / ch.days) * 1.1;
    let hp = d.hp * ch.mult * prog, atk = d.atk * 1.25 * ch.mult * prog, def = d.def * Math.pow(ch.mult, 0.6);
    if (d.elite || opts.elite) { hp *= ELITE_HP; atk *= ELITE_ATK; }
    if (d.boss) { hp *= BOSS_HP; atk *= BOSS_ATK; }
    if (opts.weak) { hp *= 0.6; atk *= 0.7; }
    const eSlots = [0.74, 0.88, 0.6];
    const a = scene.add({ kind: 'mob', art: d.art, sheet: d.boss ? `bosses/${key}` : `mobs/${d.art}`, spriteScale: d.boss ? 1 : ((d.elite || opts.elite) ? 1.3 : 1) * (opts.weak ? 0.9 : 1), enemy: true, boss: !!d.boss, name: d.name, hp: Math.round(hp), maxHp: Math.round(hp), atk, def, abilities: d.abilities, scale: (d.scale || 1) * (d.boss ? 1.15 : 1.2) * (opts.elite && !d.scale ? 1.3 : 1), crown: d.crown || (opts.elite && !d.boss), facing: -1, x: scene.w + 60 + slot * 40, z: 2 + slot, seed: Math.random() * 5 });
    a.moveTo = scene.w * eSlots[slot]; a.moveSpeed = 300;
    return a;
  }
  function spawnGroup(key, opts = {}) {
    const d = ENEMIES[key]; const n = d.group ? randi(d.group[0], d.group[1]) : (opts.count || 1);
    return Array.from({ length: n }, (_, i) => makeEnemy(key, i, opts));
  }
  async function doBattle(enemies, kind = 'normal') {
    await sleep(500 / scene.speed);
    setActions([btn(kind === 'boss' ? 'BOSS BATTLE' : 'Battle', 'red', () => go())]);
    await new Promise(r => { go = r; });
    busy('Battling', 'red');
    playMusic(kind === 'boss' ? 'boss' : 'battle');
    const res = await fight({ scene, run, hero, emery, petActors, onUpdate: updateUI, onRound: (r, max) => { if (r == null) roundEl.style.display = 'none'; else { roundEl.style.display = 'block'; roundEl.textContent = r ? `Round ${r}/${max}` : 'Ready...'; } },
      summon: (boss) => { const m = makeEnemy('micro_manager', scene.actors.filter(a => a.enemy && a.hp > 0).length, { weak: true }); m.showBar = true; enemies.push(m); } }, enemies, { boss: kind === 'boss', elite: kind === 'elite' });
    roundEl.style.display = 'none';
    scene.clearEnemies();
    if (!res.won) return false;
    playMusic('adventure');
    // rewards
    const n = enemies.length;
    const xp = Math.round((20 + run.day) * (kind === 'elite' ? 3 : 1) * (0.75 + n * 0.25) * (1 + (run.mods.xpPct || 0)));
    const coins = Math.round((8 + run.day * 0.6) * coinMult * (kind === 'elite' ? 3 : 1) * (0.75 + n * 0.25) * (1 + (run.mods.coinPct || 0)));
    const food = randi(1, 2) + (kind === 'elite' ? 3 : 0);
    run.xp += xp; run.coins += coins; run.food += food;
    const gems = kind === 'elite' ? 6 : (chance(0.08) ? 1 : 0); run.gems += gems;
    S.stats.kills += n;
    const tags = [tag('xp', `EXP +${xp}`), tag('coin', `🪙 +${coins}`)]; if (gems) tags.push(tag('gem', `💎 +${gems}`));
    addCard('Victory!', '', false, tags);
    sfx('coin');
    await checkLevelUp();
    return true;
  }
  let go = null;

  // ---------- day handlers ----------
  async function nextDay() {
    if (run.over) return;
    busy('Moving');
    run.day++;
    scene.walking = true; sfx('step');
    await sleep(900 / scene.speed);
    scene.walking = false;
    updateUI();
    const sd = schedule[run.day];
    let ok = true;
    try {
      if (sd.type === 'start') {
        addCard(ch.start);
        if (run.papi) addCard(`Papi's [b:${run.papi.name}] ${run.papi.icon} gives you power: ${run.papi.desc}`, 'good', false);
        if (run.ride) addCard(`You're riding your [b:${MOUNTS[S.mounts.equipped].name}]!`, '', false);
      }
      else if (sd.type === 'walk') addCard(pick(WALK_TEXTS));
      else if (sd.type === 'battle') {
        const key = pick(ch.enemies); const d = ENEMIES[key];
        addCard(pick(d.intro));
        ok = await doBattle(spawnGroup(key));
      } else if (sd.type === 'elite') {
        const d = ENEMIES[ch.elite];
        addCard(pick(d.intro) + ' [p:(Elite!)]', 'boss');
        ok = await doBattle([makeEnemy(ch.elite, 0, { elite: true })], 'elite');
        if (ok) { addCard('The elite dropped a [p:Golden Chest]!', 'good', false); sfx('chest'); await chooseSkill('mythic', 'Mythic Chest!'); }
      } else if (sd.type === 'pet') {
        addCard(sd.pet.text, 'rescue');
        const guards = [makeEnemy(sd.pet.guard, 0), makeEnemy(sd.pet.guard, 1, { weak: true })];
        ok = await doBattle(guards);
        if (ok) await rescuePet(sd.pet.id);
      } else if (sd.type === 'event') {
        await doEvent(sd.ev);
      } else if (sd.type === 'boss') {
        addCard(ch.bossText, 'boss');
        const d = ENEMIES[ch.boss];
        await sleep(400);
        addCard(pick(d.intro), 'boss', false);
        scene.bigText('BOSS!', '#ff5a6a', 1.2); sfx('boom'); scene.shake(0.5);
        ok = await doBattle([makeEnemy(ch.boss, 0)], 'boss');
        if (ok) return chapterWon();
      }
    } catch (e) { console.error(e); }
    if (!ok || run.hp <= 0) return defeat();
    if (run.hp <= 0) return defeat();
    setActions([btn('Next Day', 'green', nextDay)]);
    updateUI();
  }

  async function doEvent(ev) {
    const cls = ev.kind === 'good' ? 'good' : ev.kind === 'bad' ? 'bad' : '';
    if (!ev.choices) {
      const tags = applyEffect(ev.effect);
      addCard(ev.text, cls, true, tags, EV_ICON[ev.id]);
      if (ev.luck) { scene.bigText(ev.luck === 'Bad Luck' ? 'BAD LUCK' : ev.luck.toUpperCase(), ev.kind === 'bad' ? '#c9c4d6' : '#7fe0ff', 1.1); sfx(ev.kind === 'bad' ? 'bad' : 'good'); }
      await checkLevelUp();
      return;
    }
    addCard(ev.text, cls, true, null, EV_ICON[ev.id]);
    const choice = await new Promise(res => {
      setActions(ev.choices.map((c, i) => {
        const b = btn(c.label, i === 0 && ev.choices.length > 1 && !c.cost ? 'gold' : 'gold', () => res(c), c.sub || '');
        if (c.cost && run.coins < c.cost) { b.disabled = true; b.querySelector('.sub').textContent = `Need ${c.cost} coins`; }
        return b;
      }));
    });
    busy('...');
    if (choice.cost) { run.coins -= choice.cost; updateUI(); }
    if (choice.special === 'pinball') return pinballEvent();
    if (choice.special === 'dice') return diceEvent();
    if (choice.special === 'obby') return obbyEvent();
    if (choice.special === 'penalty') return penaltyEvent(choice.label.includes('LEFT') ? 0 : 1);
    const eff = { ...choice.effect }; const skillR = eff.skill; delete eff.skill;
    const tags = applyEffect(eff);
    addCard(choice.result || '', '', false, tags);
    if (skillR) await chooseSkill(skillR, skillR === 'legendary' ? 'Legendary Deal!' : 'New Skill!');
    await checkLevelUp();
  }
  async function pinballEvent() {
    const score = await playPinball({ title: 'Pinball!', seconds: 35 });
    playMusic('adventure');
    let rar = 'common', msg;
    if (score >= 9000) { rar = 'mythic'; msg = 'JACKPOT! A [p:Mythic] skill!'; }
    else if (score >= 4500) { rar = 'legendary'; msg = 'High score! A [p:Legendary] skill!'; }
    else if (score >= 1500) msg = 'Nice score! A new skill!';
    else { addCard(`You scored ${fmt(score)}. Not enough for a prize... but you still get some coins.`, '', false, applyEffect({ coins: 1 })); return; }
    addCard(`Pinball score: [b:${fmt(score)}]! ${msg}`, 'good', false);
    await chooseSkill(rar, 'Pinball Prize!');
  }
  async function diceEvent() {
    const roll = await diceModal();
    const outcomes = {
      1: ['Snake eyes... you trip over the dice.', { heal: -0.12 }],
      2: ['Monopoly money falls from the sky!', { coins: 4 }],
      3: ['You land on "Free Parking". Rest time!', { heal: 0.3 }],
      4: ['You land on "Go"! Collect your power!', { atk: 0.07 }],
      5: ['You draw a "Chance" card: new skill!', { skill: 'common' }],
      6: ['DOUBLE SIX! Legendary roll!', { skill: 'legendary' }],
    }[roll];
    const eff = { ...outcomes[1] }; const sk = eff.skill; delete eff.skill;
    addCard(`You rolled a [b:${roll}]! ${outcomes[0]}`, roll >= 4 ? 'good' : '', false, applyEffect(eff));
    if (sk) await chooseSkill(sk, roll === 6 ? 'LUCKY ROLL!' : 'Chance Card!');
    await checkLevelUp();
  }
  function diceModal() {
    return new Promise(res => {
      const face = el('div', { style: { fontSize: '90px', textAlign: 'center', lineHeight: '1.1' } }, '🎲');
      const p = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, 'Roll the dice!'), face);
      const m = modal(p); sfx('dice');
      const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅']; let i = 0;
      const iv = setInterval(() => { face.textContent = faces[i++ % 6]; }, 80);
      setTimeout(() => { clearInterval(iv); const r = randi(1, 6); face.textContent = faces[r - 1]; sfx('coin'); setTimeout(() => { m.close(); res(r); }, 900); }, 1300);
    });
  }
  async function obbyEvent() {
    hero.dy = 0; scene.bigText('OBBY TIME!', '#7fe0ff', 1);
    for (let i = 0; i < 3; i++) { hero.dy = -30 * scene.u; await sleep(200); hero.dy = 0; await sleep(150); }
    if (chance(0.65)) { addCard('You beat the obby! Easy. Absolute cinema.', 'good', false, applyEffect({ gems: 12, xp: 1 })); sfx('win'); }
    else { sfx('oof'); scene.bigText('OOF!', '#fff', 1); addCard('You fell off the last jump. [r:OOF!]', 'bad', false, applyEffect({ heal: -0.1 })); }
    await checkLevelUp();
  }
  async function penaltyEvent(side) {
    const ball = scene.projectile('ball', hero.x + 20, scene.gy - 10, scene.w * 0.85, scene.gy - 60 - side * 10, 0.5, 40);
    await ball;
    if (chance(0.55)) { scene.bigText('GOOOAL!', '#ffd23a', 1.2); sfx('win'); addCard('GOOOOAL! The zombie goalie didn\'t even move.', 'good', false, applyEffect({ atk: 0.08, coins: 2 })); }
    else { scene.bigText('SAVED!', '#ccc', 1); sfx('bad'); addCard('The zombie goalie saved it with its face. Gross, but impressive.', '', false, applyEffect({ xp: 0.5 })); }
    await checkLevelUp();
  }

  async function rescuePet(id) {
    const pdef = PETS[id];
    if (!S.rescued.pets.includes(id)) S.rescued.pets.push(id);
    if (!S.pets.owned[id]) S.pets.owned[id] = { level: 1, xp: 0 };
    const slots = 1 + (belt.idx >= 2 ? 1 : 0) + (belt.idx >= 4 ? 1 : 0);
    let joined = false;
    if (S.pets.equipped.length < slots && !S.pets.equipped.includes(id)) { S.pets.equipped.push(id); joined = true; }
    save();
    sfx('win');
    await new Promise(res => {
      const pic = canvasBox(220, 130, (ctx, w, h, t) => drawPet(ctx, id, w / 2 - 10, h - 14, 2.1, { t }), true);
      const p = el('div', { class: 'panel', style: { textAlign: 'center' } },
        el('h2', {}, `${pdef.name} rescued!`), pic,
        el('div', { style: { fontWeight: 700 } }, `${pdef.species} · ${pdef.personality}`),
        el('div', { style: { fontSize: '13px', margin: '6px 0' }, html: rich(`Special move: [p:${pdef.attack.name}]<br>` + pdef.attack.desc) }),
        el('div', { style: { fontSize: '13px', color: '#6d4c32' } }, joined ? `${pdef.name} joins your adventure right now!` : `${pdef.name} runs home to Nana & Papi's. Equip them in the Pets tab!`),
        el('div', { style: { marginTop: '10px' } }, el('button', { class: 'btn green', onclick: () => { m.close(); res(); } }, 'Yay!')));
      const m = modal(p);
    });
    addCard(`[p:${pdef.name}] is safe! ${joined ? 'They join your adventure!' : ''}`, 'rescue', false);
    if (joined) { addPetActor(id); updateUI(); }
  }

  // ---------- end of run ----------
  function bankRewards(extra = {}) {
    const dayBonus = Math.round(run.day * 5 * coinMult);
    const r = { coins: run.coins + dayBonus + (extra.coins || 0), gems: run.gems + (extra.gems || 0), food: run.food + (extra.food || 0) };
    S.coins += r.coins; S.gems += r.gems; S.petFood += r.food;
    S.progress.best[ch.id] = Math.max(S.progress.best[ch.id] || 0, run.day);
    save();
    return r;
  }
  async function defeat() {
    if (run.over) return; run.over = true;
    S.stats.deaths++;
    hero.sad = true; hero.forceAnim = 'down'; hero.anim.hurt = 1; sfx('lose');
    setActions([]);
    await sleep(700);
    const r = bankRewards();
    const box = el('div', { class: 'result-box' },
      el('div', { class: 'big-banner', style: { fontSize: '40px' } }, 'Defeat'),
      el('div', {}, `Chapter ${ch.id}: ${ch.name}`), el('div', {}, 'Days survived'),
      el('div', { class: 'days' }, `${run.day} days`),
      el('div', { style: { fontSize: '13px', color: '#ffd86a' } }, `Longest journey: ${S.progress.best[ch.id]} days`),
      rewardChips(r),
      el('div', { style: { fontSize: '12.5px', margin: '6px 0 10px', color: '#e8dcff' } }, tipText()),
      el('button', { class: 'btn gold big', onclick: () => { m.close(); exit(); } }, 'Back'));
    const m = modal(box);
  }
  function tipText() {
    return pick([
      'Tip: Spend coins on your Belt (HP, ATK, DEF) to get stronger!',
      'Tip: Open chests in the Shop for new gear.',
      'Tip: Feed your pets pet food to level them up.',
      'Tip: Papi cooks a new power-up meal every day!',
      'Tip: Every belt color gives +4% to ALL stats.',
      'Tip: Orange Belt unlocks a 2nd pet slot. Blue Belt unlocks a 3rd!',
    ]);
  }
  async function chapterWon() {
    run.over = true; setActions([]);
    playMusic('story'); sfx('win');
    scene.bigText('VICTORY!', '#ffd23a', 2);
    hero.armUp = true;
    await sleep(1400);
    const first = !S.progress.cleared[ch.id];
    S.progress.cleared[ch.id] = true;
    S.progress.unlocked = Math.max(S.progress.unlocked, Math.min(CHAPTERS.length, ch.id + 1));
    if (first && chapterById(ch.id + 1)) S.progress.selected = ch.id + 1;
    S.stats.bossKills++;
    const k = first ? 1 : 0.3;
    const extra = { coins: Math.round(ch.reward.coins * k), gems: Math.round(ch.reward.gems * k), food: first ? 10 : 3 };
    const fam = ch.rescueFamily && !S.rescued.family.includes(ch.rescueFamily) ? ch.rescueFamily : null;
    if (fam) S.rescued.family.push(fam);
    let mountMsg = '', gearMsg = '';
    if (first && ch.reward.mount && !S.mounts.owned[ch.reward.mount]) { S.mounts.owned[ch.reward.mount] = { level: 1 }; if (!S.mounts.equipped) S.mounts.equipped = ch.reward.mount; mountMsg = `New ride: <b>${MOUNTS[ch.reward.mount].name}</b>!`; }
    if (first && ch.reward.gear) {
      const rarity = Math.min(5, ch.reward.gear); const id = randomGearId(0, rarity);
      S.gear.items.push({ uid: Math.random().toString(36).slice(2, 9), id, rarity, level: 1 }); gearMsg = `New gear: <b>${GEAR[id].name}</b>!`;
    }
    if (first && ch.reward.house) S.houseBack = true;
    const r = bankRewards(extra);
    // rescue celebration
    await new Promise(res => {
      const kids = [];
      if (fam) {
        const f = FAMILY[fam];
        const fallback = canvasBox(240, 170, (ctx, w, h, t) => { drawPerson(ctx, w * 0.32, h - 12, 1.0, arloLook(S, belt.color), { t, armUp: true }); drawPerson(ctx, w * 0.7, h - 12, fam === 'emery' ? 0.85 : 1.0, f.look, { t, wave: true }); }, true);
        const pic = el('img', { src: `assets/story/rescue_${fam}.webp`, class: 'rescue-pic' });
        pic.onerror = () => pic.replaceWith(fallback);
        kids.push(pic);
        kids.push(el('div', { style: { fontWeight: 700, fontSize: '18px' } }, `You rescued ${f.full}!`));
        kids.push(el('div', { style: { fontStyle: 'italic', margin: '4px 0' } }, `"${f.line}"`));
        kids.push(el('div', { style: { fontSize: '13px' }, html: rich(f.bonus) }));
        kids.push(el('div', { style: { fontSize: '12px', color: '#6d4c32', marginTop: '4px' } }, fam === 'emery' ? 'Emery will now fight by your side in every adventure!' : `${f.name} is safe at Nana & Papi's house now.`));
      } else if (ch.freeText) kids.push(el('div', { style: { fontWeight: 700, fontSize: '17px' } }, ch.freeText));
      else kids.push(el('div', { style: { fontWeight: 700 } }, 'Chapter cleared again! Great training!'));
      if (mountMsg) kids.push(el('div', { html: mountMsg, style: { marginTop: '6px' } }));
      if (gearMsg) kids.push(el('div', { html: gearMsg }));
      if (S.progress.unlocked > ch.id && first && chapterById(ch.id + 1)) kids.push(el('div', { style: { marginTop: '6px', color: '#7b2fd0', fontWeight: 700 } }, `Chapter ${ch.id + 1}: ${chapterById(ch.id + 1).name} unlocked!`));
      const p = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, fam ? 'RESCUED!' : 'CHAPTER CLEAR!'), ...kids, rewardChips(r),
        el('button', { class: 'btn gold big', onclick: () => { m.close(); res(); } }, 'Absolute cinema!'));
      const m = modal(p);
    });
    if (first && ch.reward.house) { await new Promise(res => playComic(ENDING, res)); }
    exit({ won: true, chapter: ch.id, rescued: fam });
  }

  function exit(info) { scene.destroy(); onExit(info || {}); }

  async function pauseMenu() {
    sfx('click');
    const p = el('div', { class: 'panel' }, el('h2', {}, 'Paused'),
      el('div', { class: 'menu-list' },
        el('button', { class: 'btn green', onclick: () => m.close() }, '▶ Resume'),
        el('button', { class: 'btn blue', onclick: () => { m.close(); showSkills(); } }, '📖 My skills'),
        el('button', { class: 'btn red', onclick: async () => { m.close(); if (await confirmModal('Give up?', 'You keep the coins you collected so far.', 'Give up', 'Keep going')) { run.over = false; defeat(); } } }, '🏳️ Give up')));
    const m = modal(p, { dismissable: true });
  }
  function showSkills() {
    const ids = Object.keys(run.skills);
    const grid = el('div', { class: 'skill-list' });
    ids.forEach(id => grid.append(el('div', { class: 'si', onclick: () => infoModal(SKILLS[id].name, rich(SKILLS[id].desc)) }, skillIcon(id, 52), SKILLS[id].name + (run.skills[id] > 1 ? ` x${run.skills[id]}` : ''))));
    const st = run.stats;
    const p = el('div', { class: 'panel' }, el('h2', {}, 'Skills'), ids.length ? grid : el('div', { style: { textAlign: 'center' } }, 'No skills yet. Level up to learn some!'),
      el('div', { class: 'stat-row', style: { fontSize: '12px' } },
        el('span', {}, `Crit ${Math.round(st.crit * 100)}%`), el('span', {}, `Combo ${Math.round(st.combo * 100)}%`), el('span', {}, `Counter ${Math.round(st.counter * 100)}%`), el('span', {}, `Dodge ${Math.round(Math.min(0.6, st.dodge) * 100)}%`)),
      el('div', { style: { textAlign: 'center', marginTop: '10px' } }, el('button', { class: 'btn gold small', onclick: () => m.close() }, 'Resume')));
    const m = modal(p, { dismissable: true });
  }

  // go!
  updateUI();
  setActions([btn('Start!', 'green', nextDay)]);
  addCard(`[p:Chapter ${ch.id}: ${ch.name}]`, '', false);
  return run;
}
