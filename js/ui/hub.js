import { el, rich, fmt, toast, today, uid, pick, weighted, sleep, icon } from '../util.js';
import { S, save, exportCode, importCode, resetSave, wipeAndReload } from '../state.js';
import { heroStats, beltInfo, talentCost, TALENT_GAIN, BELTS, PER_BELT, petSlots, PET_SLOT_BELTS, rescued } from '../stats.js';
import { CHAPTERS, chapterById } from '../data/chapters.js';
import { FAMILY, RESCUE_ORDER, PAPI_MEALS } from '../data/family.js';
import { PETS, FAMILY_PET_ORDER, EGG_TABLE, EGG_COST, petLevelCost, PET_MAX_LEVEL, petLevelMult } from '../data/pets.js';
import { MOUNTS } from '../data/mounts.js';
import { GEAR, SLOTS, SLOT_NAMES, SLOT_ICONS, RARITIES, RARITY_NAMES, CHESTS, itemStats, itemPower, maxLevel, enhanceCost, randomGearId } from '../data/gear.js';
import { drawPerson, arloLook } from '../art/people.js';
import { drawPet } from '../art/animals.js';
import { drawMount } from '../art/mounts.js';
import { drawMob } from '../art/mobs.js';
import { INK, rr, circle, ellipse, poly, line, block, text, shade, shadow } from '../art/core.js';
import { tree } from '../art/backgrounds.js';
import { drawAnim, drawHeadshot, sheetReady, preloadSheets, spriteHeight, bgImage } from '../art/sheets.js';
import { modal, infoModal, confirmModal, iconCanvas, gearIcon, rewardChips, canvasBox } from './common.js';
import { sfx, playMusic, applyAudioSettings } from '../audio.js';
import { playPinball } from './pinball.js';
import { runTour } from './tutorial.js';
import { BAL } from '../data/balance.js';

let tab = 'home';
let ctxHub = null;

export function showHub(opts = {}) {
  const { onStart, onReplayIntro } = opts;
  ctxHub = opts;
  playMusic('hub');
  const root = document.getElementById('screen'); root.innerHTML = '';
  const st = heroStats(); const belt = beltInfo();
  const avatar = el('div', { class: 'avatar' }, canvasBox(44, 44, (ctx, w, h) => { if (!drawHeadshot(ctx, 'chars/arlo', w, h, { belt: false })) drawPerson(ctx, w / 2 - 2, h + 22, 0.62, arloLook(S, belt.color), { t: 0, noShadow: true }); }, true));
  const top = el('div', { class: 'topbar' },
    el('div', { class: 'who' }, avatar, el('div', {}, el('div', { class: 'nm' }, S.name), el('div', { class: 'belt' }, el('span', { class: 'belt-swatch', style: { background: belt.color } }), belt.name), el('div', { class: 'power' }, '⚡', fmt(st.power)))),
    el('div', { class: 'cur' }, icon('coin', 20, '🪙'), ' ', fmt(S.coins)), el('div', { class: 'cur' }, icon('gem', 20, '💎'), ' ', fmt(S.gems)));
  const body = el('div', { class: 'tab-body' });
  const tabs = [['shop', '🛒', 'Shop', 'shop'], ['gear', '🎒', 'Gear', 'gear'], ['home', '🏠', 'Home', 'home'], ['pets', '🐾', 'Pets', 'pets'], ['belts', '🥋', 'Belts', 'belts']];
  const isOpen = id => S.tut.stage === 'done' || S.tut.open.includes(id);
  if (!isOpen(tab)) tab = 'home';
  const nav = el('div', { class: 'navbar' }, ...tabs.map(([id, ic, nm, ik]) => {
    const open = isOpen(id);
    const b = el('button', { 'data-tab': id, class: (tab === id ? 'on' : '') + (open ? '' : ' locked'), onclick: () => { sfx('click'); if (!open) return toast('Locked! Nana will show you soon.'); tab = id; showHub(opts); } }, el('span', { class: 'ic' }, icon(ik, 30, ic)), nm);
    if (!open) { b.append(el('span', { class: 'lockbadge' }, icon('lock', 22))); return b; }
    if (id === 'belts' && S.coins >= talentCost()) b.append(el('span', { class: 'dot' }));
    if (id === 'pets' && Object.keys(S.pets.owned).some(p => S.petFood >= petLevelCost(S.pets.owned[p].level) && S.pets.owned[p].level < PET_MAX_LEVEL)) b.append(el('span', { class: 'dot' }));
    return b;
  }));
  root.append(el('div', { class: 'hub tab-' + tab }, top, body, nav));
  ({ home: homeTab, gear: gearTab, pets: petsTab, belts: beltsTab, shop: shopTab }[tab])(body, opts);
  if (S.tut.stage === 'tour' && !tourRunning) startTour();
}
let tourRunning = false;
// First visit home (after the first adventure): Nana shows every tab, unlocking them one by one.
async function startTour() {
  tourRunning = true;
  const openTab = id => { if (!S.tut.open.includes(id)) S.tut.open.push(id); save(); refresh(); };
  const steps = [
    { sel: '.home-scene canvas', pad: -4, text: "Oh sweetheart, you're back! Those minions were tough... but every hero gets knocked down sometimes. Welcome to <b>our house</b>, your base camp!" },
    { sel: '.topbar .cur', text: 'You brought home <b>coins</b> from your adventure! The further you get, the more you earn. Let me show you how to use them.' },
    { before: () => openTab('belts'), sel: '.navbar [data-tab=belts]', tap: true, text: 'I just unlocked your <b>Belts</b>! Tap it.' },
    { sel: '.upg-cards', tap: () => S.coins >= talentCost(), tapSel: '.upg-cards .btn', text: 'Train here with coins: <b>Health</b>, <b>Power</b> and <b>Guard</b>. Every training makes you stronger forever. Try one, tap a gold button!' },
    { sel: '.belt-big', text: 'Every <b>12 trainings</b> you earn the next belt: Yellow, Orange, Green, all the way to <b>Black Belt</b>! Your belt changes colour and every belt adds +4% to everything.' },
    { before: () => { if (!S.tut.chestGiven) { S.tut.chestGiven = true; S.freeChest = true; } openTab('shop'); }, sel: '.navbar [data-tab=shop]', tap: true, text: 'Now the <b>Shop</b> is open too. Tap it!' },
    { skipIf: () => !S.freeChest, sel: '.shop-card .btn.gold', tap: true, text: 'Chests have <b>gear</b> inside: weapons, gis, gloves and more. Papi already paid for your first one. Tap <b>FREE</b>!' },
    { before: () => openTab('gear'), sel: '.navbar [data-tab=gear]', tap: true, text: 'Ooh, nice! Let\'s see it on you. Tap <b>Gear</b>.' },
    { sel: '.slots', text: 'New gear goes on Arlo by itself. Tap any item to <b>Enhance</b> it with coins. And if you collect <b>3 of the same</b> item, they <b>merge</b> into a better one!' },
    { before: () => openTab('pets'), sel: '.navbar [data-tab=pets]', tap: true, text: 'Last one: <b>Pets</b>! Tap it.' },
    { sel: '.tab-body .section', pad: -2, text: 'President Business took all the pets too! When you rescue them, they live here. Put them on your <b>team</b> to fight with you, and feed them <b>pet food</b> to level them up. Your <b>Rides</b> are in here too!' },
    { sel: '.navbar [data-tab=home]', tap: true, text: "Now come back home. Tap <b>Home</b>." },
    { sel: '.hub-side.right', text: 'Visit us <b>every day</b>! I have a gift for you, Papi cooks a meal that powers up your next adventure, and you get a <b>free game of Pinball</b>.' },
    { sel: '.hub-side:not(.right)', text: '<b>Rides</b> lets you pick what you ride into battle. <b>Menu</b> has music, the story, and moving your game to another device.' },
    { sel: '.home-panel .chapter-card', text: "This is where adventures start. Your mom is trapped in <b>Chapter 1</b>. Get stronger, then go get her back. I believe in you, my love!" },
  ];
  await runTour(steps, { from: S.tut.step || 0, onStep: i => { S.tut.step = i; save(); } });
  S.tut.stage = 'done'; S.tut.open = ['home', 'shop', 'gear', 'pets', 'belts']; save();
  tourRunning = false; tab = 'home'; refresh();
}
const refresh = () => showHub(ctxHub);

// =================== HOME ===================
function homeTab(body, { onStart, onReplayIntro }) {
  const canvas = el('canvas');
  const sceneBox = el('div', { class: 'home-scene' }, canvas);
  const nanaReady = S.daily.nana !== today(), papiReady = S.daily.papi !== today() && !S.papiBuff, pinReady = S.daily.pinball !== today();
  const side = el('div', { class: 'hub-side' },
    sideBtn('rides', 'Rides', () => { tab = 'pets'; petsSub = 'rides'; refresh(); }),
    sideBtn('menu', 'Menu', () => menuModal(onReplayIntro)));
  const side2 = el('div', { class: 'hub-side right' },
    sideBtn('gift', 'Nana', () => nanaGift(), nanaReady),
    sideBtn('papi', 'Papi', () => papiMeal(), papiReady),
    sideBtn('pinball', 'Pinball', () => dailyPinball(), pinReady));
  sceneBox.append(side, side2);
  body.append(sceneBox); body.classList.add('home-body');
  // chapter picker
  let sel = Math.min(S.progress.selected || 1, S.progress.unlocked);
  const panel = el('div', { class: 'home-panel' });
  function renderPanel() {
    const ch = chapterById(sel); panel.innerHTML = '';
    const locked = sel > S.progress.unlocked;
    const best = S.progress.best[sel] || 0;
    const prev = el('button', { class: 'arrow-btn', disabled: sel <= 1, onclick: () => { sel--; S.progress.selected = sel; save(); renderPanel(); } }, '◀');
    const next = el('button', { class: 'arrow-btn', disabled: sel >= CHAPTERS.length, onclick: () => { sel++; renderPanel(); } }, '▶');
    const famIcon = ch.rescueFamily ? (S.rescued.family.includes(ch.rescueFamily) ? `✅ ${FAMILY[ch.rescueFamily].name} rescued` : `🔒 ${FAMILY[ch.rescueFamily].name} is trapped here!`) : (S.progress.cleared[ch.id] ? '✅ Freed!' : '🏙️ Free this part of Montreal');
    panel.append(el('div', { class: 'chapter-card' + (locked ? ' locked' : '') }, prev,
      el('div', { class: 'ch-mid' },
        el('div', { class: 'ch-thumb', style: { backgroundImage: `url(assets/bg/bg_${ch.theme}.webp)` } }, el('span', { class: 'ch-num' }, `Chapter ${ch.id}`), el('div', { class: 'cname' }, ch.name)),
        el('div', { class: 'ch-info' }, el('span', { class: 'cinfo' }, `Best ${best}/${ch.days} days`), el('div', { class: 'ch-progress' }, el('div', { style: { width: Math.min(100, best / ch.days * 100) + '%' } }))),
        el('div', { class: 'cinfo fam' }, famIcon)),
      next));
    const petLeft = (ch.pets || []).filter(p => !S.rescued.pets.includes(p.id));
    if (petLeft.length && !locked) panel.append(el('div', { class: 'note' }, `🐾 ${petLeft.map(p => PETS[p.id].name).join(' & ')} ${petLeft.length > 1 ? 'are' : 'is'} somewhere in this chapter!`));
    if (locked) panel.append(el('button', { class: 'btn gray big', disabled: true }, '🔒 Locked'), el('div', { class: 'note' }, `Beat Chapter ${sel - 1} first`));
    else panel.append(el('button', { class: 'btn gold big', onclick: () => { sfx('click'); S.progress.selected = sel; save(); onStart(sel); } }, 'Start'));
    const rescuedN = S.rescued.family.length, petsN = S.rescued.pets.length;
    sceneBox.querySelector('.home-counts')?.remove();
    sceneBox.append(el('div', { class: 'home-counts' }, el('span', {}, icon('family', 20), ` ${rescuedN}/5`), el('span', {}, icon('pets', 20), ` ${petsN}/6`)));
  }
  renderPanel();
  sceneBox.append(panel);
  // hub scene drawing
  const hits = [];
  drawHome(canvas, hits);
  canvas.addEventListener('click', e => {
    const r = canvas.getBoundingClientRect(); const x = e.clientX - r.left, y = e.clientY - r.top;
    const h = [...hits].reverse().find(h => x > h.x - h.w / 2 && x < h.x + h.w / 2 && y > h.y - h.h && y < h.y);
    if (!h) return; sfx('click');
    if (h.id === 'nana') return nanaGift();
    if (h.id === 'papi') return papiMeal();
    if (h.id === 'arlo') return infoModal('Arlo', '<i>"Absolute cinema!"</i><br><br>Train your belt, collect gear and rescue everyone!', 'Hi-yah!');
    if (PETS[h.id]) return petModal(h.id);
    const f = FAMILY[h.id]; if (f) infoModal(f.full, `<i>"${f.line}"</i><br><br>${rich(f.bonus)}`, 'Love you!');
    if (h.id === 'missing') infoModal('Still missing...', `President Business still has ${h.who}! Rescue them in Chapter ${h.ch}.`, 'I will!', 'red');
  });
}
function sideBtn(ic, label, fn, dot) {
  const b = el('button', { class: 'side-btn', onclick: () => { sfx('click'); fn(); } }, el('span', { class: 'ic' }, icon(ic, 30, '•')), label);
  if (dot) b.append(el('span', { class: 'dot', style: { position: 'absolute', top: '2px', right: '2px', width: '10px', height: '10px', borderRadius: '50%', background: '#ef4b5f', border: '2px solid #000' } }));
  return b;
}

const FAMILY_SHEETS = ['arlo', 'mom', 'papa', 'alyzee', 'eveah', 'emery', 'nana', 'papi', 'twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko', 'wolf', 'axolotl', 'eevee', 'pikachu', 'charizard'];
// Where everyone stands in Nana & Papi's room, in coordinates of the room picture
// (ix = 0..1 across the picture, iy = 0..1 down it; iy is where their feet touch the floor)
const HOME_SPOTS = {
  papi: { ix: 0.24, iy: 0.81 },   // at the stove
  nana: { ix: 0.43, iy: 0.73 },   // by the window
  mom: { ix: 0.6, iy: 0.74 }, papa: { ix: 0.73, iy: 0.76 }, emery: { ix: 0.87, iy: 0.79 },
  alyzee: { ix: 0.3, iy: 0.91 }, eveah: { ix: 0.72, iy: 0.92 },
  arlo: { ix: 0.5, iy: 0.94 },
};
const PET_SPOTS = [[0.38, 0.97], [0.62, 0.98], [0.17, 0.95], [0.86, 0.96], [0.27, 0.99], [0.76, 0.99], [0.45, 0.99], [0.56, 0.96], [0.1, 0.99], [0.92, 0.99], [0.5, 1.0]];
function drawHomeArt(ctx, w, h, t, u, bg, hits, { fam, missing, pets, stageH }) {
  // The room picture fills the area above the chapter card, so its floor is always visible.
  const sh = Math.max(stageH, h * 0.5);
  // never zoom in so far that the sides get cut off (tall phones / laptop windows): extend the wall upward instead
  const sc = Math.min(Math.max(w / bg.naturalWidth, sh / bg.naturalHeight), w * 1.22 / bg.naturalWidth);
  const bw = bg.naturalWidth * sc, bh = bg.naturalHeight * sc;
  const ox = (w - bw) / 2, oy = sh - bh;
  ctx.fillStyle = '#5a3418'; ctx.fillRect(0, 0, w, h);
  if (oy > 0) ctx.drawImage(bg, 0, 0, bg.naturalWidth, 3, ox, 0, bw, oy + 2);
  ctx.drawImage(bg, ox, oy, bw, bh);
  const P = (ix, iy) => [ox + ix * bw, oy + iy * bh];
  // perspective: people further back are smaller; an adult is ~31% of the picture height
  const adult = iy => bh * 0.31 * (0.82 + (iy - 0.72) * 1.5);
  const add = (id, x, y, w2, h2, extra = {}) => hits.push({ id, x, y, w: w2, h: h2, ...extra });
  const drawn = [];
  const person = (key, anim, tt, facing = 1) => {
    const sp = HOME_SPOTS[key]; const [x, y] = P(sp.ix, sp.iy);
    drawn.push({ y, f: () => { const hh = adult(sp.iy) * spriteHeight('chars/' + key) / 112; drawAnim(ctx, 'chars/' + key, anim, x, y, hh, { t: tt, facing }); add(key, x, y, hh * 0.5, hh); } });
  };
  const wave = (i, a = 'idle') => Math.sin(t * 0.5 + i * 1.7) > 0.9 ? 'wave' : Math.sin(t * 0.37 + i) > 0.93 ? 'action' : a;
  person('papi', 'action', t);
  person('nana', Math.sin(t * 0.6) > 0.85 ? 'wave' : 'idle', t + 2);
  fam.forEach((id, i) => person(id, wave(i), t + i * 1.3, HOME_SPOTS[id].ix > 0.5 ? -1 : 1));
  // Arlo (or Arlo on his ride)
  { const sp = HOME_SPOTS.arlo; const [x, y] = P(sp.ix, sp.iy); const ride = S.mounts.equipped;
    drawn.push({ y, f: () => {
      if (ride && sheetReady('rides/' + ride)) { const rh = adult(sp.iy) * spriteHeight('rides/' + ride) / 112; drawAnim(ctx, 'rides/' + ride, 'ride', x, y, rh, { t, frame: 0 }); add('arlo', x, y, rh * 0.7, rh); }
      else { if (ride) preloadSheets(['rides/' + ride]); const ah = adult(sp.iy) * 100 / 112; drawAnim(ctx, 'chars/arlo', Math.sin(t * 0.4) > 0.92 ? 'victory' : 'idle', x, y, ah, { t }); add('arlo', x, y, ah * 0.5, ah); }
    } }); }
  // pets wander on the floor in front
  pets.forEach((id, i) => {
    const [ix, iy] = PET_SPOTS[i % PET_SPOTS.length]; const vx = Math.cos(t * 0.45 + i * 2);
    const [bx, y] = P(ix, iy); const x = bx + Math.sin(t * 0.45 + i * 2) * 12 * u;
    drawn.push({ y, f: () => {
      const ph = adult(iy) * spriteHeight('chars/' + id) / 112;
      if (FAMILY_SHEETS.includes(id)) drawAnim(ctx, 'chars/' + id, Math.abs(vx) > 0.6 ? 'run' : (i % 3 === 0 ? 'sit' : 'idle'), x, y, ph, { t: t + i, facing: vx > 0 ? 1 : -1 });
      else drawPet(ctx, id, x, y, 0.62 * u, { t: t + i, facing: vx > 0 ? 1 : -1 });
      add(id, x, y, ph * 1.2, ph);
    } });
  });
  drawn.sort((a, b) => a.y - b.y).forEach(d => d.f());   // back to front
  // missing family: "?" picture frames on the wall above the window
  missing.forEach((id, i) => {
    const fs = Math.max(26, bh * 0.05), [cx] = P(0.5, 0); const x = cx + (i - (missing.length - 1) / 2) * fs * 1.25, y = Math.max(oy + bh * 0.2, 58);
    rr(ctx, x - fs * 0.4, y - fs * 0.5, fs * 0.8, fs, 4, '#6b4424', 2.5);
    rr(ctx, x - fs * 0.28, y - fs * 0.37, fs * 0.56, fs * 0.74, 2, '#2e2440', 1.5);
    text(ctx, '?', x, y + 1, fs * 0.5, '#ffd23a', 'center', null);
    add('missing', x, y + fs * 0.5, fs, fs, { who: FAMILY[id].full, ch: FAMILY[id].chapter });
  });
}

function drawHome(canvas, hits) {
  preloadSheets(FAMILY_SHEETS.map(k => 'chars/' + k));
  const ctx = canvas.getContext('2d');
  const dpr = Math.min(2, devicePixelRatio || 1);
  const t0 = performance.now();
  const belt = beltInfo();
  const fam = RESCUE_ORDER.filter(id => S.rescued.family.includes(id));
  const missing = RESCUE_ORDER.filter(id => !S.rescued.family.includes(id));
  const pets = Object.keys(S.pets.owned);
  function frame(now) {
    if (!canvas.isConnected) return;
    const r = canvas.getBoundingClientRect(); const w = r.width, h = r.height;
    if (canvas.width !== Math.round(w * dpr)) { canvas.width = w * dpr; canvas.height = h * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const t = Math.max(0, (now - t0) / 1000); const u = h / 330;
    hits.length = 0;
    const hubBg = bgImage('bg_hub');
    if (hubBg && sheetReady('chars/arlo')) { const card = canvas.parentElement?.querySelector('.chapter-card'); const stageH = card ? card.getBoundingClientRect().top - r.top + 24 : h * 0.72; drawHomeArt(ctx, w, h, t, u, hubBg, hits, { fam, missing, pets, belt, stageH }); requestAnimationFrame(frame); return; }
    // room
    const fy = h * 0.8;
    ctx.fillStyle = '#f3dcb6'; ctx.fillRect(0, 0, w, fy);
    ctx.fillStyle = '#ead0a2'; for (let x = 0; x < w; x += 26) ctx.fillRect(x, 0, 12, fy);
    ctx.fillStyle = '#a8703f'; ctx.fillRect(0, fy, w, h - fy); ctx.fillStyle = '#9a6536'; for (let x = 0; x < w; x += 46) ctx.fillRect(x, fy, 3, h - fy);
    line(ctx, 0, fy, w, fy, INK, 3);
    rr(ctx, -4, fy - 14, w + 8, 14, 0, '#fff4e0', 2.5);
    // window with the river
    const wx = w * 0.42, wy = h * 0.1, ww = w * 0.26, wh = h * 0.3;
    rr(ctx, wx, wy, ww, wh, 6, '#9fe0ff', 4);
    ctx.fillStyle = '#3d9be0'; ctx.fillRect(wx + 3, wy + wh * 0.62, ww - 6, wh * 0.35);
    ctx.fillStyle = '#4f9a46'; ctx.beginPath(); ctx.arc(wx + ww * 0.3, wy + wh * 0.62, wh * 0.2, Math.PI, 0); ctx.arc(wx + ww * 0.75, wy + wh * 0.62, wh * 0.16, Math.PI, 0); ctx.fill();
    line(ctx, wx + ww / 2, wy, wx + ww / 2, wy + wh, INK, 3); line(ctx, wx, wy + wh / 2, wx + ww, wy + wh / 2, INK, 3);
    text(ctx, "Nana & Papi's House", w * 0.55, h * 0.05, 11 + u * 2, '#fff');
    // kitchen (left): counter + stove where Papi cooks
    rr(ctx, -6, fy - 70 * u, w * 0.3, 70 * u, 4, '#e9e4dc', 3);
    rr(ctx, w * 0.04, fy - 76 * u, w * 0.2, 8 * u, 3, '#555', 2.5);
    rr(ctx, -6, h * 0.08, w * 0.3, 40 * u, 4, '#c98a5a', 3);
    // pan + steam
    const px = w * 0.17, py = fy - 80 * u;
    ellipse(ctx, px, py, 18 * u, 5 * u, '#333', 2.5); line(ctx, px + 16 * u, py, px + 34 * u, py - 4 * u, INK, 4);
    ctx.save(); ctx.globalAlpha = 0.5; for (let i = 0; i < 3; i++) { const k = (t * 0.6 + i / 3) % 1; circle(ctx, px - 8 * u + i * 8 * u + Math.sin(t * 2 + i) * 4, py - 10 * u - k * 40 * u, (4 + k * 6) * u, '#fff', 0); } ctx.restore();
    // couch (right)
    rr(ctx, w * 0.62, fy - 46 * u, w * 0.42, 36 * u, 12, '#7b3fe4', 3);
    rr(ctx, w * 0.6, fy - 64 * u, w * 0.44, 28 * u, 12, '#8f58f0', 3);
    // plant + lamp
    tree(ctx, w * 0.36, fy - 4, 0.38 * u, '#4fae3d', '#a0612e');
    // ---- people ----
    const add = (id, x, y, sc, w2, h2) => hits.push({ id, x, y, w: w2, h: h2 });
    // Papi at the stove
    drawPerson(ctx, w * 0.12, fy - 2, 0.62 * u, FAMILY.papi.look, { t, armUp: Math.sin(t * 3) > 0 });
    add('papi', w * 0.12, fy, 0, 50 * u, 100 * u);
    // Nana by the window with her cane
    drawPerson(ctx, w * 0.33, fy - 2, 0.62 * u, FAMILY.nana.look, { t: t + 1 });
    add('nana', w * 0.33, fy, 0, 50 * u, 100 * u);
    // rescued family on/near the couch, back row
    const famX = [0.5, 0.61, 0.71, 0.81, 0.9];
    fam.forEach((id, i) => {
      const x = w * (famX[i] || 0.6) - (id === 'emery' ? 4 : 0);
      drawPerson(ctx, x, fy - 6 * u, (id === 'emery' ? 0.58 : 0.6) * u, FAMILY[id].look, { t: t + i * 0.7, wave: Math.sin(t * 0.8 + i) > 0.92 });
      add(id, x, fy, 0, 44 * u, (id === 'emery' ? 140 : 100) * u);
    });
    // missing family shown as photo frames on the wall
    missing.forEach((id, i) => {
      const x = w * 0.74 + (i % 3) * 30 * u - 10 * u, y = h * 0.22 + Math.floor(i / 3) * 36 * u;
      rr(ctx, x - 12 * u, y - 15 * u, 24 * u, 30 * u, 3, '#5a3a22', 2.5);
      rr(ctx, x - 8 * u, y - 11 * u, 16 * u, 22 * u, 2, '#333', 1.5);
      text(ctx, '?', x, y + 1, 16 * u, '#ffcf33', 'center', null);
      add('missing', x, y + 15 * u, 0, 26 * u, 32 * u); hits[hits.length - 1].who = FAMILY[id].full; hits[hits.length - 1].ch = FAMILY[id].chapter;
    });
    // Arlo front and center
    const ax = w * 0.45;
    if (S.mounts.equipped) { const seat = drawMount(ctx, S.mounts.equipped, ax, h - 10, 0.62 * u, { t }); drawPerson(ctx, seat.x, seat.y, 0.75 * u, arloLook(S, belt.color), { t, sit: true, noShadow: true }); }
    else drawPerson(ctx, ax, h - 10, 0.78 * u, arloLook(S, belt.color), { t });
    add('arlo', ax, h - 10, 0, 60 * u, 90 * u);
    // pets wander on the floor
    pets.forEach((id, i) => {
      const baseX = w * (0.62 + (i % 4) * 0.1) - (i >= 4 ? w * 0.48 : 0); const x = baseX + Math.sin(t * 0.5 + i * 2) * 10 * u;
      const y = h - 6 - (i % 2) * 8 * u;
      drawPet(ctx, id, x, y, 0.62 * u, { t: t + i, facing: Math.cos(t * 0.5 + i * 2) > 0 ? 1 : -1 });
      add(id, x, y, 0, 40 * u, 34 * u);
    });
    if (S.houseBack) text(ctx, '🏠 Your house is back!', w * 0.5, h * 0.05, 12 * u + 4, '#ffd23a');
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function nanaGift() {
  if (S.daily.nana === today()) return infoModal('Nana', '<i>"I already gave you your gift today, sweetheart. Come back tomorrow!"</i>', 'OK');
  const gifts = BAL.nanaGift(S.progress.unlocked);
  const g = pick(gifts);
  S.coins += g.coins || 0; S.gems += g.gems || 0; S.petFood += g.food || 0; S.daily.nana = today(); save(); sfx('chest');
  const p = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, "Nana's Gift"),
    canvasBox(160, 140, (ctx, w, h, t) => drawPerson(ctx, w / 2, h - 8, 1.05, FAMILY.nana.look, { t }), true),
    el('div', { style: { fontStyle: 'italic', fontWeight: 600 } }, pick(['"Here, my love. Don\'t tell Papi!"', '"I can\'t see it, but I know you\'re getting taller!"', '"For my brave little hero."'])),
    rewardChips(g), el('button', { class: 'btn green', onclick: () => { m.close(); refresh(); } }, 'Thanks Nana!'));
  const m = modal(p);
}
function papiMeal() {
  if (S.papiBuff) return infoModal("Papi's Kitchen", `Your <b>${S.papiBuff.name}</b> ${S.papiBuff.icon} is ready! It will power you up on your next adventure.<br><br>${S.papiBuff.desc}`, 'Yum!');
  if (S.daily.papi === today()) return infoModal("Papi's Kitchen", '<i>"The kitchen is closed! Come back tomorrow, I\'ll make something even better."</i>', 'OK');
  const meal = pick(PAPI_MEALS);
  S.papiBuff = meal; S.daily.papi = today(); save(); sfx('heal');
  const p = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, "Papi's Kitchen"),
    el('div', { style: { fontSize: '64px' } }, meal.icon),
    el('div', { style: { fontWeight: 700, fontSize: '19px' } }, meal.name),
    el('div', {}, meal.desc),
    el('div', { style: { fontStyle: 'italic', margin: '8px 0', fontSize: '13px' } }, '"Eat it all, you\'ll need your strength to beat that President guy!"'),
    el('button', { class: 'btn green', onclick: () => { m.close(); refresh(); } }, 'Merci Papi!'));
  const m = modal(p);
}
async function dailyPinball() {
  const free = S.daily.pinball !== today();
  if (!free && S.gems < 5) return infoModal('Pinball', 'Your free daily game is used up. Come back tomorrow, or play again for 💎 5.', 'OK');
  if (!free && !(await confirmModal('Pinball', 'Play again for 💎 5? Big scores win coins and gems!', 'Play!', 'No'))) return;
  if (free) S.daily.pinball = today(); else S.gems -= 5;
  save();
  const score = await playPinball({ title: 'Daily Pinball', seconds: 40 });
  // payout scales with progress so it's a nice bonus, never a shortcut
  const lvl = S.progress.unlocked;
  const coins = Math.round(Math.min(score, 6000) / 6000 * (60 + 50 * lvl)), gems = score >= 5000 ? 3 : score >= 2500 ? 1 : 0;
  S.coins += coins; S.gems += gems; save();
  await infoModal('Pinball Results', `Score: <b>${fmt(score)}</b><br><br>🪙 +${coins}${gems ? ` · 💎 +${gems}` : ''}`, 'Nice!');
  refresh();
}

// =================== LOOK (customize) ===================
const COLORS = ['#7b3fe4', '#e0263f', '#2f7fe0', '#2fbf4a', '#ffcf33', '#ff8c1a', '#ff7ac8', '#1d1d24', '#f4f4f4', '#2b3550', '#8d8d96', '#2fbfb0', '#6b4423'];
const STYLES = {
  shirt: [['tee', 'T-Shirt', 0], ['tribal', 'Cool Pattern', 0], ['gi', 'Karate Gi', 0], ['stripes', 'Stripes', 300], ['plaid', 'Plaid', 400], ['hoodie', 'Hoodie', 500], ['jersey', 'Soccer #10', 600], ['steve', 'Steve Shirt', 700], ['habs', 'Habs Jersey', 900]],
  pants: [['shorts', 'Shorts', 0], ['pants', 'Pants', 0], ['gi', 'Gi Pants', 0]],
  hat: [['none', 'None', 0], ['cap', 'Cap', 0], ['headband', 'Headband', 0], ['beanie', 'Tuque', 300], ['propeller', 'Propeller', 500], ['santa', 'Santa Hat', 400], ['bacon', 'Bacon Hair', 1000], ['helmet', 'Diamond Helmet', 1500], ['crown', 'Crown', 3000]],
};
function lookModal() {
  let part = 'shirt';
  const belt = beltInfo();
  const preview = canvasBox(200, 170, (ctx, w, h, t) => drawPerson(ctx, w / 2, h - 10, 1.45, arloLook(S, belt.color), { t }), true);
  const body = el('div');
  const p = el('div', { class: 'panel' }, el('h2', {}, "Arlo's Look"), el('div', { style: { display: 'flex', justifyContent: 'center' } }, preview), body,
    el('div', { style: { textAlign: 'center', marginTop: '8px' } }, el('button', { class: 'btn green small', onclick: () => { m.close(); refresh(); } }, 'Done')));
  function render() {
    body.innerHTML = '';
    body.append(el('div', { class: 'tabs' }, ...['shirt', 'pants', 'hat'].map(k => el('button', { class: part === k ? 'on' : '', onclick: () => { part = k; render(); } }, { shirt: '👕 Shirt', pants: '👖 Pants', hat: '🧢 Hat' }[k]))));
    const row = el('div', { class: 'opt-row' });
    for (const [id, name, cost] of STYLES[part]) {
      const key = `${part}:${id}`; const owned = cost === 0 || S.look.unlocked.includes(key);
      const on = S.look[part].style === id;
      row.append(el('button', { class: 'opt' + (on ? ' on' : '') + (owned ? '' : ' locked'), onclick: async () => {
        if (!owned) {
          if (S.coins < cost) return toast(`Need 🪙 ${cost}`);
          if (!(await confirmModal('Unlock?', `Buy <b>${name}</b> for 🪙 ${cost}?`, 'Buy', 'No'))) return;
          S.coins -= cost; S.look.unlocked.push(key); sfx('coin');
        }
        S.look[part].style = id; save(); render();
      } }, name, el('div', { style: { fontSize: '10px' } }, owned ? (on ? '✓ wearing' : '') : `🪙 ${cost}`)));
    }
    body.append(row);
    if (!(part === 'hat' && ['none', 'helmet', 'crown', 'bacon'].includes(S.look.hat.style))) {
      body.append(el('div', { style: { fontWeight: 700, fontSize: '13px' } }, 'Color'));
      body.append(el('div', { class: 'swatches' }, ...COLORS.map(c => el('button', { class: 'swatch' + (S.look[part].color === c ? ' on' : ''), style: { background: c }, onclick: () => { S.look[part].color = c; save(); sfx('click'); render(); } }))));
    }
  }
  render();
  const m = modal(p, { dismissable: true, onClose: refresh });
}

// =================== MENU ===================
function menuModal(onReplayIntro) {
  const p = el('div', { class: 'panel' }, el('h2', {}, 'Menu'), el('div', { class: 'menu-list' },
    el('button', { class: 'btn blue', onclick: () => { S.settings.music = !S.settings.music; save(); applyAudioSettings(); m.close(); menuModal(onReplayIntro); } }, `🎵 Music: ${S.settings.music ? 'ON' : 'OFF'}`),
    el('button', { class: 'btn blue', onclick: () => { S.settings.sfx = !S.settings.sfx; save(); applyAudioSettings(); m.close(); menuModal(onReplayIntro); } }, `🔊 Sounds: ${S.settings.sfx ? 'ON' : 'OFF'}`),
    el('button', { class: 'btn purple', onclick: () => { m.close(); onReplayIntro(); } }, '🎬 Watch the story again'),
    el('button', { class: 'btn gold', onclick: () => { m.close(); transferModal(); } }, '📲 Move my save to another device'),
    el('button', { class: 'btn gray', onclick: () => { m.close(); statsModal(); } }, '📊 My stats'),
    el('button', { class: 'btn red small', style: { marginTop: '6px' }, onclick: async () => { m.close(); if (await confirmModal('Start over?', 'This erases ALL progress on this device and starts a brand new game.', 'Erase', 'Cancel') && await confirmModal('Are you SURE?', 'Everything will be gone forever. Belts, gear, pets, rescues... all of it.', 'Yes, erase', 'No!')) wipeAndReload(); } }, 'Start a new game'),
    el('button', { class: 'btn green', onclick: () => m.close() }, 'Close')));
  const m = modal(p, { dismissable: true });
}
function statsModal() {
  const st = heroStats();
  infoModal('My Stats', `❤️ HP ${fmt(st.hp)} · ⚔️ ATK ${fmt(st.atk)} · 🛡️ DEF ${fmt(st.def)}<br>Crit ${Math.round(st.crit * 100)}% · Combo ${Math.round(st.combo * 100)}% · Counter ${Math.round(st.counter * 100)}% · Dodge ${Math.round(st.dodge * 100)}%<br><br>Adventures: ${S.stats.runs} · Monsters beaten: ${S.stats.kills} · Bosses: ${S.stats.bossKills}`, 'Cool');
}
function transferModal() {
  const ta = el('textarea', { class: 'code', readonly: true }); ta.value = exportCode();
  const inp = el('textarea', { class: 'code', placeholder: 'Paste a save code here...' });
  const p = el('div', { class: 'panel' }, el('h2', {}, 'Move Save'),
    el('div', { style: { fontSize: '13px', fontWeight: 600 } }, '1. On THIS device, copy your save code and send it to yourself (text, email, AirDrop).'),
    ta, el('button', { class: 'btn blue small', onclick: async () => { try { await navigator.clipboard.writeText(ta.value); toast('Copied!'); } catch { ta.select(); document.execCommand('copy'); toast('Copied!'); } } }, '📋 Copy code'),
    el('div', { style: { fontSize: '13px', fontWeight: 600, marginTop: '12px' } }, '2. On the OTHER device, paste the code here and tap Load.'),
    inp, el('button', { class: 'btn red small', onclick: async () => {
      if (!(await confirmModal('Load save?', 'This replaces the progress on this device.', 'Load', 'Cancel'))) return;
      try { importCode(inp.value); toast('Save loaded!'); m.close(); location.reload(); } catch (e) { toast(e.message); }
    } }, '📥 Load'),
    el('div', { style: { textAlign: 'center', marginTop: '10px' } }, el('button', { class: 'btn green small', onclick: () => m.close() }, 'Close')));
  const m = modal(p, { dismissable: true });
}

// =================== GEAR ===================
function gearTab(body) {
  const st = heroStats(); const belt = beltInfo();
  const sec = el('div', { class: 'section' });
  const slotEl = slot => {
    const it = S.gear.items.find(i => i.uid === S.gear.slots[slot]);
    const b = el('button', { class: 'slot' + (it ? ' filled bg-' + RARITIES[it.rarity] : ''), onclick: () => it ? itemModal(it) : toast(`No ${SLOT_NAMES[slot]} yet. Find some in chests!`) });
    if (it) { b.append(gearIcon(it.id, GEAR[it.id].icon, 64)); b.append(el('span', { class: 'lv', style: { position: 'absolute', left: '2px', top: '1px', fontSize: '10px', fontWeight: 700, background: 'rgba(0,0,0,.55)', color: '#fff', borderRadius: '5px', padding: '0 4px' } }, 'Lv' + it.level)); }
    else b.append(icon('slot_' + slot, 40, SLOT_ICONS[slot]), el('span', { class: 'lbl' }, SLOT_NAMES[slot]));
    return b;
  };
  const weapon = S.gear.items.find(i => i.uid === S.gear.slots.weapon);
  const prev = canvasBox(170, 190, (ctx, w, h, t) => drawPerson(ctx, w / 2, h - 12, 1.4, arloLook(S, belt.color), { t, weapon: weapon?.id }), true);
  sec.append(el('div', { class: 'paper' },
    el('div', { class: 'slots' }, el('div', { class: 'slot-col' }, slotEl('weapon'), slotEl('gloves'), slotEl('necklace')), el('div', { class: 'hero-preview', style: { display: 'flex', justifyContent: 'center' } }, prev), el('div', { class: 'slot-col' }, slotEl('gi'), slotEl('shoes'), slotEl('ring'))),
    el('div', { class: 'stat-row' }, el('span', {}, '❤️ ', fmt(st.hp)), el('span', {}, '⚔️ ', fmt(st.atk)), el('span', {}, '🛡️ ', fmt(st.def)), el('span', {}, '⚡ ', fmt(st.power)))));
  sec.append(el('h3', {}, `Backpack (${S.gear.items.length})`));
  const equipped = new Set(Object.values(S.gear.slots));
  const items = [...S.gear.items].sort((a, b) => (equipped.has(b.uid) - equipped.has(a.uid)) || b.rarity - a.rarity || itemPower(b) - itemPower(a));
  if (!items.length) sec.append(el('div', { class: 'empty' }, 'Your backpack is empty. Open chests in the Shop or beat bosses!'));
  const grid = el('div', { class: 'grid' });
  for (const it of items) {
    const t = el('button', { class: `tile bg-${RARITIES[it.rarity]}`, onclick: () => itemModal(it) }, gearIcon(it.id, GEAR[it.id].icon, 64), el('span', { class: 'lv' }, 'Lv' + it.level));
    if (equipped.has(it.uid)) t.append(el('span', { class: 'eq' }, '✓'));
    grid.append(t);
  }
  sec.append(grid);
  const mergeable = findMerges();
  if (mergeable.length) sec.append(el('div', { style: { textAlign: 'center', marginTop: '12px' } }, el('button', { class: 'btn purple', onclick: () => mergeAll() }, `✨ Merge all (${mergeable.length})`)), el('div', { class: 'note' }, '3 of the same item and rarity merge into the next rarity!'));
  body.append(sec);
}
function findMerges() {
  const groups = {};
  for (const it of S.gear.items) { if (it.rarity >= 5) continue; const k = it.id + '|' + it.rarity; (groups[k] = groups[k] || []).push(it); }
  return Object.values(groups).filter(g => g.length >= 3);
}
function mergeAll() {
  let made = 0;
  let groups;
  while ((groups = findMerges()).length) {
    for (const g of groups) {
      const equippedUids = new Set(Object.values(S.gear.slots));
      g.sort((a, b) => equippedUids.has(b.uid) - equippedUids.has(a.uid) || b.level - a.level);
      const [keep, a, b] = g;
      keep.rarity++; made++;
      S.gear.items = S.gear.items.filter(i => i !== a && i !== b);
      for (const [s, u] of Object.entries(S.gear.slots)) if (u === a.uid || u === b.uid) S.gear.slots[s] = keep.uid;
    }
  }
  save(); sfx('chest'); toast(`Merged ${made} item${made > 1 ? 's' : ''}! ✨`); refresh();
}
function itemModal(it) {
  const def = GEAR[it.id]; const s = itemStats(it); const rname = RARITIES[it.rarity];
  const isEq = S.gear.slots[def.slot] === it.uid;
  const statLines = Object.entries(s).map(([k, v]) => `<div>${{ atk: '⚔️ ATK', hp: '❤️ HP', def: '🛡️ DEF', crit: '🎯 Crit', critDmg: '💥 Crit DMG', combo: '🥋 Combo', counter: '🔄 Counter', dodge: '👟 Dodge', lifesteal: '🧛 Lifesteal' }[k] || k}: <b>${k === 'atk' || k === 'hp' || k === 'def' ? '+' + v : '+' + Math.round(v * 100) + '%'}</b></div>`).join('');
  const cost = enhanceCost(it); const capped = it.level >= maxLevel(it.rarity);
  const p = el('div', { class: 'panel' }, el('h2', {}, def.name),
    el('div', { style: { display: 'flex', gap: '12px', alignItems: 'center' } },
      el('div', { class: `tile bg-${rname}`, style: { width: '84px', flex: '0 0 84px' } }, gearIcon(it.id, def.icon, 80)),
      el('div', {}, el('span', { class: `rar r-${rname}` }, RARITY_NAMES[rname]), el('div', { style: { fontWeight: 700 } }, `${SLOT_NAMES[def.slot]} · Lv ${it.level}/${maxLevel(it.rarity)}`), el('div', { html: statLines, style: { fontSize: '14px' } }))),
    el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px', flexWrap: 'wrap' } },
      el('button', { class: 'btn ' + (isEq ? 'gray' : 'blue') + ' small', onclick: () => { if (isEq) delete S.gear.slots[def.slot]; else S.gear.slots[def.slot] = it.uid; save(); sfx('click'); m.close(); refresh(); } }, isEq ? 'Unequip' : 'Equip'),
      el('button', { class: 'btn green small', disabled: capped, onclick: () => {
        if (S.coins < cost) return toast(`Need 🪙 ${cost}`);
        S.coins -= cost; it.level++; save(); sfx('levelup'); m.close(); itemModal(it); refresh();
      } }, capped ? 'Max level' : `Enhance 🪙${cost}`),
      el('button', { class: 'btn red small', onclick: async () => { if (await confirmModal('Recycle?', `Recycle <b>${def.name}</b> for 🪙 ${50 * (it.rarity + 1) * it.level}?`, 'Recycle', 'Keep')) { S.coins += 50 * (it.rarity + 1) * it.level; for (const [k, u] of Object.entries(S.gear.slots)) if (u === it.uid) delete S.gear.slots[k]; S.gear.items = S.gear.items.filter(i => i !== it); save(); m.close(); refresh(); } } }, 'Recycle')),
    capped && it.rarity < 5 ? el('div', { class: 'note', style: { color: '#6d4c32' } }, 'Merge 3 of these to raise the max level!') : null);
  const m = modal(p, { dismissable: true });
}

// =================== PETS & RIDES ===================
let petsSub = 'pets';
function petsTab(body) {
  const sec = el('div', { class: 'section' });
  sec.append(el('div', { class: 'tabs' }, el('button', { class: petsSub === 'pets' ? 'on' : '', onclick: () => { petsSub = 'pets'; refresh(); } }, '🐾 Pets'), el('button', { class: petsSub === 'rides' ? 'on' : '', onclick: () => { petsSub = 'rides'; refresh(); } }, '🛵 Rides')));
  if (petsSub === 'rides') return ridesSection(sec, body);
  const slots = petSlots();
  sec.append(el('h3', {}, 'Adventure Team'));
  const row = el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center' } });
  for (let i = 0; i < 3; i++) {
    const id = S.pets.equipped[i];
    if (i >= slots) { row.append(el('div', { class: 'tile locked', style: { width: '84px', fontSize: '12px', color: '#fff', flexDirection: 'column', filter: 'none', background: '#3a2a55' } }, '🔒', el('span', { style: { fontSize: '10px', textAlign: 'center' } }, BELTS[PET_SLOT_BELTS[i]].name))); continue; }
    if (!id) { row.append(el('div', { class: 'tile', style: { width: '84px', background: '#e9d8b4', fontSize: '12px', fontWeight: 700 } }, 'Empty')); continue; }
    row.append(petTile(id, 84));
  }
  sec.append(row);
  sec.append(el('div', { class: 'note' }, `🦴 Pet food: ${S.petFood} · Pet slots unlock at Orange & Blue belt`));
  sec.append(el('h3', {}, 'Family Pets'));
  const g = el('div', { class: 'grid' });
  for (const id of FAMILY_PET_ORDER) {
    if (S.pets.owned[id]) g.append(petTile(id));
    else { const ch = CHAPTERS.find(c => (c.pets || []).some(p => p.id === id)); g.append(el('button', { class: 'tile locked', onclick: () => infoModal('Kidnapped!', `President Business took ${PETS[id].name}! Rescue them in Chapter ${ch.id}: ${ch.name}.`, 'I will!', 'red') }, canvasBox(72, 72, (ctx, w, h) => drawPet(ctx, id, w / 2 - 4, h - 8, 0.95, { t: 0 })), el('span', { class: 'q' }, '?'))); }
  }
  sec.append(g);
  const allFamily = FAMILY_PET_ORDER.every(id => S.pets.owned[id]);
  sec.append(el('h3', {}, 'Egg Pets'));
  if (!allFamily) sec.append(el('div', { class: 'empty' }, '🥚 Rescue all 6 family pets to unlock the Pet Eggs!'));
  else {
    const g2 = el('div', { class: 'grid' });
    for (const { id } of EGG_TABLE) {
      if (S.pets.owned[id]) g2.append(petTile(id));
      else g2.append(el('div', { class: 'tile locked' }, canvasBox(72, 72, (ctx, w, h) => drawPet(ctx, id, w / 2 - 4, h - 8, 0.95, { t: 0 })), el('span', { class: 'q' }, '?')));
    }
    sec.append(g2);
    sec.append(el('div', { style: { textAlign: 'center', marginTop: '10px' } }, el('button', { class: 'btn gold', onclick: () => hatchEgg() }, `🥚 Hatch an egg 💎${EGG_COST}`)));
  }
  body.append(sec);
}
function petTile(id, size) {
  const p = S.pets.owned[id]; const def = PETS[id];
  const t = el('button', { class: `tile bg-${def.rarity}`, style: size ? { width: size + 'px' } : {}, onclick: () => petModal(id) }, canvasBox(72, 72, (ctx, w, h, tt) => drawPet(ctx, id, w / 2 - 4, h - 8, 0.95, { t: tt }), true), el('span', { class: 'lv' }, 'Lv' + p.level));
  if (S.pets.equipped.includes(id)) t.append(el('span', { class: 'eq' }, '✓'));
  return t;
}
function petModal(id) {
  const p = S.pets.owned[id]; const def = PETS[id]; if (!p) return;
  const eq = S.pets.equipped.includes(id); const cost = petLevelCost(p.level); const m2 = petLevelMult(p.level);
  const stats = Object.entries(def.stats).map(([k, v]) => `${{ hp: '❤️', atk: '⚔️', def: '🛡️', crit: '🎯 Crit', combo: '🥋 Combo', dodge: '👟 Dodge' }[k]} ${k === 'hp' || k === 'atk' || k === 'def' ? '+' + Math.round(v * m2) : '+' + Math.round(v * 100) + '%'}`).join(' · ');
  const pnl = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, def.name),
    canvasBox(220, 130, (ctx, w, h, t) => drawPet(ctx, id, w / 2 - 10, h - 12, 2.0, { t }), true),
    el('div', {}, el('span', { class: `rar r-${def.rarity}` }, RARITY_NAMES[def.rarity]), `${def.species} · Lv ${p.level}/${PET_MAX_LEVEL}`),
    def.personality ? el('div', { style: { fontStyle: 'italic', fontSize: '13px' } }, def.personality) : null,
    el('div', { style: { margin: '8px 0', fontSize: '13px' }, html: rich(`<b>${def.attack.name}</b>: ${def.attack.desc.replace(/(\d+)% ATK/g, (m, n) => `${Math.round(n * m2)}% ATK`)}`) }),
    el('div', { style: { fontSize: '13px', fontWeight: 700 } }, 'When on your team: ' + stats),
    el('div', { style: { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '12px' } },
      el('button', { class: 'btn ' + (eq ? 'gray' : 'blue') + ' small', onclick: () => {
        if (eq) S.pets.equipped = S.pets.equipped.filter(x => x !== id);
        else { if (S.pets.equipped.length >= petSlots()) return toast('Team is full! Unequip a pet first, or earn a higher belt.'); S.pets.equipped.push(id); }
        save(); sfx('pet'); m.close(); refresh();
      } }, eq ? 'Rest' : 'Add to team'),
      el('button', { class: 'btn green small', disabled: p.level >= PET_MAX_LEVEL, onclick: () => {
        if (S.petFood < cost) return toast(`Need 🦴 ${cost} pet food`);
        S.petFood -= cost; p.level++; save(); sfx('levelup'); m.close(); petModal(id); refresh();
      } }, `Feed 🦴${cost}`)));
  const m = modal(pnl, { dismissable: true });
}
async function hatchEgg() {
  if (S.gems < EGG_COST) return toast(`Need 💎 ${EGG_COST}`);
  S.gems -= EGG_COST;
  const id = weighted(EGG_TABLE).id; const dup = !!S.pets.owned[id];
  if (dup) { S.petFood += 25; S.pets.owned[id].level = Math.min(PET_MAX_LEVEL, S.pets.owned[id].level + 2); }
  else S.pets.owned[id] = { level: 1, xp: 0 };
  save();
  const egg = el('div', { style: { fontSize: '96px', textAlign: 'center', animation: 'pop .3s' } }, '🥚');
  const pnl = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, 'Hatching...'), egg);
  const m = modal(pnl); sfx('dice');
  for (let i = 0; i < 6; i++) { egg.style.transform = `rotate(${i % 2 ? 15 : -15}deg)`; await sleep(180); }
  sfx('chest'); pnl.innerHTML = '';
  pnl.append(el('h2', {}, dup ? `${PETS[id].name} again!` : `You got ${PETS[id].name}!`), canvasBox(220, 130, (ctx, w, h, t) => drawPet(ctx, id, w / 2 - 10, h - 12, 2.0, { t }), true),
    el('div', {}, el('span', { class: `rar r-${PETS[id].rarity}` }, RARITY_NAMES[PETS[id].rarity])), el('div', { style: { margin: '6px 0' } }, dup ? '+2 levels and +25 pet food!' : PETS[id].attack.name),
    el('button', { class: 'btn green', onclick: () => { m.close(); refresh(); } }, 'Awesome!'));
}
function ridesSection(sec, body) {
  sec.append(el('div', { class: 'note' }, 'Every ride you own gives bonus stats forever. The one you ride gives a special power!'));
  for (const [id, mt] of Object.entries(MOUNTS)) {
    const owned = !!S.mounts.owned[id]; const riding = S.mounts.equipped === id;
    preloadSheets(['rides/' + id]);
    const pic = canvasBox(90, 80, (ctx, w, h, t) => { if (!drawAnim(ctx, 'rides/' + id, 'ride', w / 2, h - 4, h * 0.95, { t, frame: riding ? undefined : 0, noShadow: true })) drawMount(ctx, id, w / 2, h - 6, 0.55, { t, moving: riding }); }, true);
    const owns = Object.entries(mt.owned).map(([k, v]) => `${k.replace('Pct', '').toUpperCase()} +${Math.round(v * 100)}%`).join(', ');
    let action;
    if (owned) action = el('button', { class: 'btn small ' + (riding ? 'gray' : 'blue'), onclick: () => { S.mounts.equipped = riding ? null : id; save(); sfx('honk'); refresh(); } }, riding ? 'Get off' : 'Ride!');
    else if (mt.price) {
      const [cur, amt] = Object.entries(mt.price)[0];
      action = el('button', { class: 'btn small gold', onclick: async () => {
        if (S[cur] < amt) return toast(`Need ${cur === 'coins' ? '🪙' : '💎'} ${amt}`);
        if (!(await confirmModal('Buy ride?', `Buy <b>${mt.name}</b> for ${cur === 'coins' ? '🪙' : '💎'} ${amt}?`, 'Buy', 'No'))) return;
        S[cur] -= amt; S.mounts.owned[id] = { level: 1 }; S.mounts.equipped = id; save(); sfx('chest'); refresh();
      } }, `${cur === 'coins' ? '🪙' : '💎'} ${amt}`);
    } else action = el('div', { style: { fontSize: '11px', fontWeight: 700 } }, '🔒 ' + mt.from);
    sec.append(el('div', { class: 'list-row', style: { opacity: owned || mt.price ? 1 : 0.75 } }, el('div', { class: `tile bg-${mt.rarity}`, style: { width: '90px', flex: '0 0 90px', aspectRatio: 'auto', height: '80px' } }, pic),
      el('div', { class: 'grow' }, el('div', { class: 't' }, mt.name, ' ', el('span', { class: `rar r-${mt.rarity}` }, RARITY_NAMES[mt.rarity])), el('div', { class: 'd' }, '🏇 ' + mt.rideDesc), el('div', { class: 'd' }, '✨ Owned: ' + owns)), action));
  }
  body.append(sec);
}

// =================== BELTS (talents) ===================
function beltsTab(body) {
  const b = beltInfo(); const st = heroStats(); const cost = talentCost();
  const sec = el('div', { class: 'section' });
  const stripes = el('div', { class: 'stripes' }, ...Array.from({ length: 10 }, (_, i) => el('i', { class: b.idx === BELTS.length - 1 ? 'gold' : '', style: { opacity: i < Math.round(b.stripes / PER_BELT * 10) || (b.idx === BELTS.length - 1 && i < b.stripes) ? 1 : 0.15 } })));
  sec.append(el('div', { class: 'paper', style: { textAlign: 'center' } },
    el('div', { style: { fontFamily: 'var(--title)', fontSize: '26px' } }, b.name),
    canvasBox(180, 150, (ctx, w, h, t) => drawPerson(ctx, w / 2, h - 8, 1.25, { ...arloLook(S, b.color), shirt: { style: 'gi', color: '#fbfbf7' }, pants: { style: 'gi', color: '#fbfbf7' }, hat: { style: 'headband', color: '#e0263f' } }, { t, attack: Math.max(0, Math.sin(t * 2.2)) }), true),
    el('div', { class: 'belt-big', style: { background: b.color } }, el('div', { class: 'knot' }), stripes),
    el('div', { style: { fontSize: '13px', fontWeight: 600 } }, b.idx < BELTS.length - 1 ? `${PER_BELT - b.stripes} more upgrades until ${BELTS[b.idx + 1].name}!` : 'BLACK BELT MASTER! Keep training!'),
    el('div', { style: { fontSize: '12px' } }, `Every belt: +4% HP, ATK and DEF (now +${b.idx * 4}%)`)));
  sec.append(el('h3', {}, 'Train'));
  const card = (key, ic, name, gain, cur) => el('div', { class: 'upg' }, el('div', { class: 'ic' }, ic), el('div', {}, name), el('div', { class: 'v' }, `Lv ${S.talents[key]}`), el('div', { class: 'v', style: { color: '#23902a' } }, `+${gain}`),
    el('button', { class: 'btn small gold', style: { marginTop: '6px', width: '100%', padding: '6px 2px', fontSize: '15px' }, onclick: () => {
      if (S.coins < cost) return toast(`Need 🪙 ${cost}`);
      const before = beltInfo().idx;
      S.coins -= cost; S.talents[key]++; save(); sfx('levelup');
      const after = beltInfo().idx;
      if (after > before) { sfx('win'); infoModal('NEW BELT!', `You earned your <b>${BELTS[after].name}</b>!<br>All stats +4%!${after === 2 ? '<br>🐾 2nd pet slot unlocked!' : after === 4 ? '<br>🐾 3rd pet slot unlocked!' : ''}`, 'HI-YAH!').then(refresh); }
      else refresh();
    } }, `🪙 ${fmt(cost)}`));
  sec.append(el('div', { class: 'upg-cards' }, card('hp', '❤️', 'Health', TALENT_GAIN.hp + ' HP'), card('atk', '👊', 'Power', TALENT_GAIN.atk + ' ATK'), card('def', '🛡️', 'Guard', TALENT_GAIN.def + ' DEF')));
  sec.append(el('div', { class: 'note' }, `Now: ❤️ ${fmt(st.hp)} · ⚔️ ${fmt(st.atk)} · 🛡️ ${fmt(st.def)}`));
  sec.append(el('h3', {}, 'Belt Rewards'));
  BELTS.forEach((bb, i) => {
    const perks = { 1: 'All stats +4%', 2: '🐾 2nd pet slot', 3: 'All stats +12% total', 4: '🐾 3rd pet slot', 5: 'Purple! Arlo\'s favourite color', 6: 'All stats +24% total', 7: '🥋 Black belt: +28% all stats' }[i] || 'Start here';
    sec.append(el('div', { class: 'list-row', style: { opacity: i <= b.idx ? 1 : 0.6, padding: '6px 8px' } }, el('span', { class: 'belt-swatch', style: { background: bb.color, width: '34px', height: '12px' } }), el('div', { class: 'grow' }, el('div', { class: 't', style: { fontSize: '14px' } }, bb.name), el('div', { class: 'd' }, perks)), i <= b.idx ? '✅' : '🔒'));
  });
  body.append(sec);
}

// =================== SHOP ===================
function shopTab(body) {
  const sec = el('div', { class: 'section' });
  sec.append(el('h3', {}, 'Gear Chests'));
  for (const [id, c] of Object.entries(CHESTS)) {
    const [cur, amt] = Object.entries(c.cost)[0];
    sec.append(el('div', { class: 'shop-card' }, el('div', { class: 'ic' }, icon('chest_' + id, 56, c.icon)), el('div', { class: 'grow' }, el('div', { class: 't' }, c.name), el('div', { class: 'd' }, c.desc)),
      el('div', { style: { display: 'flex', flexDirection: 'column', gap: '4px' } },
        el('button', { class: 'btn small gold', onclick: () => openChest(id, 1) }, id === 'wood' && S.freeChest ? 'FREE' : `${cur === 'coins' ? '🪙' : '💎'} ${amt}`),
        el('button', { class: 'btn tiny purple', onclick: () => openChest(id, 10) }, `x10 ${cur === 'coins' ? '🪙' : '💎'}${amt * 9}`))));
  }
  sec.append(el('h3', {}, 'Trades'));
  const trade = (ic, name, desc, cur, amt, fn) => sec.append(el('div', { class: 'shop-card' }, el('div', { class: 'ic' }, ic), el('div', { class: 'grow' }, el('div', { class: 't' }, name), el('div', { class: 'd' }, desc)),
    el('button', { class: 'btn small gold', onclick: () => { if (S[cur] < amt) return toast(`Need ${cur === 'coins' ? '🪙' : '💎'} ${amt}`); S[cur] -= amt; fn(); save(); sfx('coin'); refresh(); } }, `${cur === 'coins' ? '🪙' : '💎'} ${amt}`)));
  trade(icon('food', 52, '🦴'), 'Pet Food x20', 'Level up your pets', 'coins', 600, () => { S.petFood += 20; toast('+20 pet food'); });
  trade(icon('gem', 52, '💎'), 'Gems x20', 'Trade coins for gems', 'coins', 1500, () => { S.gems += 20; toast('+20 gems'); });
  sec.append(el('div', { class: 'note' }, 'Everything is earned by playing. No real money, ever!'));
  body.append(sec);
}
async function openChest(id, n) {
  const c = CHESTS[id]; const [cur, amt] = Object.entries(c.cost)[0]; const free = id === 'wood' && n === 1 && S.freeChest; const price = free ? 0 : n === 10 ? amt * 9 : amt;
  if (S[cur] < price) return toast(`Need ${cur === 'coins' ? '🪙' : '💎'} ${price}`);
  S[cur] -= price; if (free) S.freeChest = false;
  const got = [];
  for (let i = 0; i < n; i++) {
    let r = Math.random(), rarity = 0; for (let k = 0; k < c.odds.length; k++) { r -= c.odds[k]; if (r <= 0) { rarity = k; break; } }
    const gid = randomGearId(0, rarity); const it = { uid: uid(), id: gid, rarity, level: 1 }; S.gear.items.push(it); got.push(it);
    const slot = GEAR[gid].slot; if (!S.gear.slots[slot]) S.gear.slots[slot] = it.uid;
  }
  save(); sfx('chest');
  const grid = el('div', { class: 'grid' }, ...got.map(it => el('div', { class: `tile bg-${RARITIES[it.rarity]}`, style: { animation: 'pop .4s backwards' } }, gearIcon(it.id, GEAR[it.id].icon, 64))));
  const best = got.reduce((a, b) => b.rarity > a.rarity ? b : a);
  const p = el('div', { class: 'panel', style: { textAlign: 'center' } }, el('h2', {}, c.name), grid,
    el('div', { style: { marginTop: '8px', fontWeight: 700 } }, n === 1 ? `${GEAR[best.id].name} (${RARITY_NAMES[RARITIES[best.rarity]]})` : `Best: ${GEAR[best.id].name} (${RARITY_NAMES[RARITIES[best.rarity]]})`),
    el('button', { class: 'btn green', style: { marginTop: '10px' }, onclick: () => { m.close(); refresh(); } }, 'Sweet!'));
  const m = modal(p);
}
