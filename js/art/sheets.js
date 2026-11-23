// Animated sprites cut from the Higgsfield sprite sheets (assets/chars, assets/mobs, assets/bosses).
// Each folder has frames.json: { refHeight, anims: { idle: [{f,w,h}], run: [...], ... } }
// Frames are trimmed and bottom-aligned (feet at the bottom edge).

const SHEETS = {};      // key -> { refHeight, anims: { name: [HTMLImageElement] } }
const LOADING = {};

export function sheetReady(key) { return !!SHEETS[key]; }
export function loadSheet(key) {
  if (SHEETS[key] || LOADING[key]) return LOADING[key];
  const base = `assets/${key}/`;
  LOADING[key] = fetch(base + 'frames.json').then(r => r.ok ? r.json() : null).then(async j => {
    if (!j) return null;
    const anims = {};
    await Promise.all(Object.entries(j.anims).map(async ([name, list]) => {
      anims[name] = await Promise.all(list.map((fr, k) => new Promise(res => {
        const im = new Image(); im.key = `${name}_${k}`; im.beltAlways = !!fr.beltAlways; im.beltC = fr.beltC || null; im.onload = () => res(im); im.onerror = () => res(null); im.src = base + fr.f;
        if (fr.fist) { const fm = new Image(); fm.onload = () => { im.fist = fm; }; fm.src = base + fr.fist; }   // fingers drawn over a held weapon
        if (fr.belt) { const bm = new Image(); bm.onload = () => { im.belt = bm; }; bm.src = base + fr.belt; }  // recolourable belt mask
      })));
      anims[name] = anims[name].filter(Boolean);
    }));
    // hand positions for holding weapons (Arlo and his armor variants)
    const hands = (key.startsWith('chars/arlo') || key.startsWith('rides/')) ? await fetch(base + 'hands.json').then(r => r.ok ? r.json() : null).catch(() => null) : null;
    SHEETS[key] = { refHeight: j.refHeight || 300, anims, hands };
    return SHEETS[key];
  }).catch(() => null);
  return LOADING[key];
}
// ---- Arlo's belt colour (repaints the white belt on his sprite) ----
let BELT_COLOR = null; const TINTS = new Map();
export function setBeltColor(c) { BELT_COLOR = c && c.toLowerCase() !== '#f4f4f4' ? c : null; }
function beltTint(img, color) {
  const key = img.src + '|' + color; let c = TINTS.get(key);
  if (c) return c;
  c = document.createElement('canvas'); c.width = img.belt.naturalWidth; c.height = img.belt.naturalHeight;
  const x = c.getContext('2d');
  x.drawImage(img.belt, 0, 0);
  x.globalCompositeOperation = 'multiply'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
  x.globalCompositeOperation = 'destination-in'; x.drawImage(img.belt, 0, 0);
  if (/^#(1|2)/.test(color)) { x.globalCompositeOperation = 'source-atop'; x.globalAlpha = 0.18; x.drawImage(img.belt, 0, 0); } // keep a little shine on dark belts
  TINTS.set(key, c); return c;
}
// ---- weapons drawn in Arlo's hand ----
// grip = where the handle is in the weapon picture (0..1), nat = direction the weapon points in its picture (deg, 0 = up)
const WEAPON_GRIP = { hockey_stick: { grip: [0.76, 0.2], nat: 225, backAngle: 330, size: 0.78 }, bo_staff: { grip: [0.5, 0.5], nat: 45, size: 1.25 }, nunchucks: { grip: [0.18, 0.86], nat: 15, size: 0.8 }, diamond_pick: { grip: [0.2, 0.82], nat: 45 } };
// where the weapon sits on his back for each ride (offsets from the belt, as a fraction of the frame); in the golf cart
// and car he sits low behind the seat, so the handle pokes up higher over his shoulder
const RIDE_BACK = { default: { dx: -0.02, dy: -0.17, ang: 215, size: 0.36 }, golfcart: { dx: -0.12, dy: -0.1, ang: 215, size: 0.3, front: true }, car: { dx: -0.03, dy: -0.33, ang: 205, size: 0.42 } };
const WEAPON_IMG = {};
function weaponImg(id) {
  if (WEAPON_IMG[id] !== undefined) return WEAPON_IMG[id];
  WEAPON_IMG[id] = null; const im = new Image(); im.onload = () => { WEAPON_IMG[id] = im; }; im.src = `assets/icons/g_${id}.webp`; return null;
}
function drawWeapon(ctx, id, hx, hy, angleDeg, size, frameKey = '') {
  const im = weaponImg(id); if (!im) return;
  const g = WEAPON_GRIP[id] || { grip: [0.26, 0.76], nat: 45 };   // grip = middle of the hilt (sits inside the fist)
  if (g.idleAngle != null && frameKey.startsWith('idle')) angleDeg = g.idleAngle;
  if (g.backAngle != null && frameKey === 'back') angleDeg = g.backAngle;   // e.g. hockey stick on his back: blade up over the shoulder   // e.g. hockey stick rests blade-down
  const S = size * (g.size || 1);
  ctx.save(); ctx.translate(hx, hy); ctx.rotate((angleDeg - g.nat) * Math.PI / 180);
  ctx.drawImage(im, -g.grip[0] * S, -g.grip[1] * S, S, S);
  ctx.restore();
}
export function preloadSheets(keys) { return Promise.all(keys.map(loadSheet)); }

// How tall (in world units, where Arlo = 100) each sprite should be drawn
export const SPRITE_HEIGHT = {
  'chars/arlo': 100, 'chars/emery': 132, 'chars/mom': 112, 'chars/papa': 118, 'chars/alyzee': 112, 'chars/eveah': 108, 'chars/nana': 110, 'chars/papi': 114,
  'chars/twyla': 52, 'chars/lenny': 48, 'chars/goose': 40, 'chars/marah': 46, 'chars/tobi': 44, 'chars/zuko': 40,
  'chars/wolf': 50, 'chars/axolotl': 36, 'chars/eevee': 42, 'chars/pikachu': 42, 'chars/charizard': 64,
  'rides/bike': 122, 'rides/ebike': 122, 'rides/horse': 150, 'rides/hippo': 128, 'rides/pig': 118, 'rides/camel': 158, 'rides/chicken': 124, 'rides/golfcart': 130, 'rides/car': 112,
  'mobs/slime': 56, 'mobs/magma_cube': 56, 'mobs/silverfish': 34, 'mobs/spider': 56, 'mobs/cave_spider': 46, 'mobs/baby_zombie': 72,
  'mobs/blaze': 96, 'mobs/guardian': 70, 'mobs/enderman': 140, 'mobs/iron_golem': 132, 'mobs/creeper': 104,
  'bosses/ghast': 150, 'bosses/elder_guardian': 130, 'bosses/warden': 150, 'bosses/ender_king': 150,
};
export function spriteHeight(key) { return SPRITE_HEIGHT[key] || (key.startsWith('bosses/') ? 135 : key.startsWith('mobs/') ? 100 : 100); }

// Which animation names exist (fallbacks so every sheet answers every request)
const FALLBACK = {
  idle: ['idle', 'sit'], run: ['run', 'walk', 'idle'], walk: ['walk', 'run', 'idle'],
  attack: ['attack', 'punch', 'special', 'action', 'idle'], punch: ['punch', 'attack', 'idle'], kick: ['kick', 'punch', 'attack', 'idle'],
  special: ['special', 'attack', 'idle'], charge: ['charge', 'taunt', 'idle'], taunt: ['taunt', 'idle'],
  hurt: ['hurt', 'sad', 'idle'], down: ['down', 'sad', 'hurt', 'idle'], sad: ['sad', 'hurt', 'idle'],
  victory: ['victory', 'cheer', 'thumbs', 'idle'], cheer: ['cheer', 'victory', 'idle'], wave: ['wave', 'idle'], action: ['action', 'attack', 'idle'],
  sit: ['sit', 'idle'], jump: ['jump', 'run', 'idle'], ride: ['ride', 'idle'],
};
function frames(sheet, anim) {
  for (const n of (FALLBACK[anim] || [anim, 'idle'])) if (sheet.anims[n]?.length) return sheet.anims[n];
  return Object.values(sheet.anims)[0] || [];
}

// fps per animation; idle frames ping-pong for a breathing feel
const FPS = { ride: 6, idle: 4, run: 11, walk: 7, attack: 8, special: 6, action: 3, wave: 3, charge: 6 };

/**
 * Draw an animated sprite.
 * key: sheet key ("chars/arlo"); anim: animation name; x,y: feet position; h: height in px
 * opts: { t, facing (1 right / -1 left), frame (force index), alpha, squash, lean, flash, filter }
 */
export function drawAnim(ctx, key, anim, x, y, h, opts = {}) {
  const sheet = SHEETS[key]; if (!sheet) { loadSheet(key); return false; }
  const list = frames(sheet, anim); if (!list.length) return false;
  const t = opts.t || 0;
  let i;
  if (opts.frame != null) i = Math.min(list.length - 1, opts.frame);
  else {
    const fps = FPS[anim] || 4; const n = list.length;
    const k = Math.max(0, Math.floor(t * fps)) || 0;  // t can be slightly negative on the first frame
    i = (anim === 'idle' && n > 2) ? [0, 1, 2, 1][k % 4] % n : k % n;
  }
  const img = list[i] || list[0];
  if (!img) return false;
  const scale = h / sheet.refHeight;
  const w = img.naturalWidth * scale, ih = img.naturalHeight * scale;
  const breathe = (anim === 'idle' && opts.frame == null) ? Math.sin(t * 2.4) * 0.012 : 0;
  const sq = opts.squash || 0;
  ctx.save();
  ctx.translate(x, y);
  if (opts.alpha != null) ctx.globalAlpha *= opts.alpha;
  if (opts.lean) ctx.rotate(opts.lean);
  ctx.scale((opts.facing || 1) * (1 + sq * 0.5 - breathe), 1 - sq + breathe);
  // soft shadow
  if (!opts.noShadow) { ctx.save(); ctx.globalAlpha *= 0.2; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, Math.min(w, h * 0.9) * 0.4, h * 0.06, 0, 0, 7); ctx.fill(); ctx.restore(); }
  if (opts.filter) ctx.filter = opts.filter;
  let frontWeapon = null;
  // weapon goes BEHIND the sprite so his fist wraps around the handle
  if (opts.weapon && sheet.hands?.[img.key] && (!img.fist || sheet.hands[img.key][3])) {   /* behind the body (no fist layer, or the blade would cross his face, or strapped on his back on a ride) */ const [hx, hy, ang] = sheet.hands[img.key]; const ride = key.startsWith('rides/'); drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, ride ? ih * 0.38 : h * 0.44, ride ? 'carry' : img.key); }
  // on rides his hands are on the handlebars / reins, so the weapon is strapped across his back (placed from the belt position)
  else if (opts.weapon && img.beltC && key.startsWith('rides/')) {
    const o = RIDE_BACK[key.slice(6)] || RIDE_BACK.default; const [bx, by] = img.beltC;
    if (!o.front) drawWeapon(ctx, opts.weapon, -w / 2 + (bx + o.dx) * w, -ih + (by + o.dy) * ih, o.ang, ih * o.size, 'back');
    else frontWeapon = () => drawWeapon(ctx, opts.weapon, -w / 2 + (bx + o.dx) * w, -ih + (by + o.dy) * ih, o.ang, ih * o.size, 'back');   // golf cart: resting in the back seat
  }
  if (opts.onlyWeapon) { frontWeapon?.(); if (opts.weapon && img.fist && sheet.hands?.[img.key]) { const [hx, hy, ang] = sheet.hands[img.key]; drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, h * 0.44, img.key); } ctx.restore(); return true; }   // test hook used by the Doctor's grip check
  ctx.drawImage(img, -w / 2, -ih, w, ih);
  frontWeapon?.();
  // held weapon: in front of the body, then the fingers on top so the fist wraps around the handle
  if (opts.weapon && img.fist && sheet.hands?.[img.key]) {
    const [hx, hy, ang, behind] = sheet.hands[img.key];
    if (!behind) drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, h * 0.44, img.key);
    ctx.drawImage(img.fist, -w / 2, -ih, w, ih);
  }
  const beltCol = BELT_COLOR || (img.beltAlways ? '#f4f4f4' : null);   // marker belts are always repainted (even white)
  if (img.belt && beltCol && opts.belt !== false && (key.startsWith('chars/arlo') || key.startsWith('rides/'))) ctx.drawImage(beltTint(img, beltCol), -w / 2, -ih, w, ih);
  if (opts.flash) { ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = opts.flash; ctx.fillStyle = '#fff'; ctx.fillRect(-w / 2, -ih, w, ih); }
  ctx.restore();
  return true;
}

// Head-and-shoulders picture for round avatars / speech boxes: the top ~63% of the sprite,
// with a little space above the hair so faces aren't cropped too tight.
export function drawHeadshot(ctx, key, w, h, opts = {}) {
  const H = h * 1.5;
  return drawAnim(ctx, key, opts.anim || 'idle', w / 2, h * 0.07 + H, H, { frame: 0, noShadow: true, ...opts });
}

// static portrait (for menus): first frame of an anim drawn to fit a box
export function drawPortrait(ctx, key, anim, x, y, h, t = 0) { return drawAnim(ctx, key, anim, x, y, h, { t, noShadow: true }); }

// ---------- backgrounds ----------
const BGS = {};
export function bgImage(name) {
  if (BGS[name] !== undefined) return BGS[name];
  BGS[name] = null;
  const im = new Image(); im.onload = () => { BGS[name] = im; }; im.src = `assets/bg/${name}.webp`;
  return null;
}
