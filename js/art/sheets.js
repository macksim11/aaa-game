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
        if (fr.fist) { const fm = new Image(); fm.onload = () => { im.fist = fm; }; fm.src = base + fr.fist; }   // FRONT layer: the fist (and anything drawn over the handle)
        if (fr.held) { const hm = new Image(); hm.onload = () => { im.held = hm; }; hm.src = base + fr.held; }   // BODY layer of the same pose holding something (marker removed with the clean original's true pixels)
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
const WEAPON_GRIP = { hockey_stick: { grip: [0.76, 0.2], nat: 225, backAngle: 330, idleAngle: 125, size: 0.78 }, bo_staff: { grip: [0.5, 0.5], nat: 45, idleAngle: 0, idleGrip: [0.37, 0.63], size: 1.25 }, nunchucks: { grip: [0.18, 0.86], nat: 15, idleAngle: 95, size: 0.8 }, diamond_pick: { grip: [0.2, 0.82], nat: 45, idleAngle: 70 } };
// where the weapon sits on his back for each ride (offsets from the belt, as a fraction of the frame); in the golf cart
// and car he sits low behind the seat, so the handle pokes up higher over his shoulder
const RIDE_BACK = { default: { dx: -0.02, dy: -0.17, ang: 215, size: 0.36 }, golfcart: { dx: -0.12, dy: -0.1, ang: 215, size: 0.3, front: true }, car: { dx: -0.03, dy: -0.33, ang: 205, size: 0.42 } };
const HELD = 0.38;   // held weapon length as a fraction of his height (0.44 looked too big for him)
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
  const gp = (g.idleGrip && frameKey.startsWith('idle')) ? g.idleGrip : g.grip;   // resting on the ground in idle: held a little lower so the end touches the floor, not through it
  ctx.drawImage(im, -gp[0] * S, -gp[1] * S, S, S);
  ctx.restore();
}
// Where a held weapon reaches (frame pixels): sample its axis from the grip. Used to keep it off his head.
function weaponCrosses(id, gx, gy, angleDeg, size, box, share = 0) {
  const g = WEAPON_GRIP[id] || { grip: [0.26, 0.76], nat: 45 }; const S = size * (g.size || 1);
  const n = g.nat * Math.PI / 180, ax = Math.sin(n), ay = -Math.cos(n);                 // the item's own axis in its picture
  const off = ((g.grip[0] - 0.5) * ax + (g.grip[1] - 0.5) * ay) * S;                    // grip position along that axis
  const half = S * 0.5 / Math.max(Math.abs(ax), Math.abs(ay));
  const r = angleDeg * Math.PI / 180, ux = Math.sin(r), uy = -Math.cos(r);
  let cnt = 0, hit = 0;
  for (let t = -(half + off); t <= half - off; t += S / 24) { const x = gx + ux * t, y = gy + uy * t; cnt++; if (x > box[0] && x < box[2] && y > box[1] && y < box[3]) { if (!share) return true; hit++; } }
  return share ? hit / cnt > share : false;   // share: true only when that much of its length lies over the box
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
  // HELD WEAPON, three layers (ARES hold_layers, Emery 2026-11-23): [item if it would cross his head] BODY [item] FIST.
  // The handle passes behind his fist; the rest of the item is in front of his body, never across his head.
  const hold = opts.weapon && img.held && img.fist && sheet.hands?.[img.key];
  if (hold && !opts.onlyWeapon) {
    const [hx, hy, ang, , , face, shift, clean] = sheet.hands[img.key];
    const k = w / img.naturalWidth, Wm = img.held.naturalWidth * k, Hm = img.held.naturalHeight * k;
    const left = -w / 2 - (shift ? shift[1] : 0) * k, top = -ih - (shift ? shift[0] : 0) * k;   // the clean frame's pixels stay exactly where they were
    const gx = left + hx * Wm, gy = top + hy * Hm, size = h * HELD;
    const head = face ? [left + (face[0] - 0.08) * Wm, top, left + (face[2] + 0.08) * Wm, top + face[3] * Hm] : null;   // the whole head, hair included
    // never across his face, and never lying across his belly like a sticker: then it goes behind him (his fist still holds it)
    const torso = face ? [left + (face[0] + 0.02) * Wm, top + face[3] * Hm, left + (face[2] - 0.02) * Wm, top + 0.8 * Hm] : null;
    const bad = a => head && (weaponCrosses(opts.weapon, gx, gy, a, size, head, 0.12) || weaponCrosses(opts.weapon, gx, gy, a, size, torso, 0.3));
    let ang2 = ang, behind = bad(ang);
    if (behind) {
      const raised = face && gy < top + face[3] * Hm;   // a raised fist (cheer): up and outward first, never dangling it
      const D = (raised ? [20, -20, 40, -40, 60, -60, 75, -75, 180] : [180, 40, -40, 75, -75, 110, -110]).map(d => (ang + d + 360) % 360);
      const clear = D.find(a => !bad(a));
      if (clear != null) { ang2 = clear; behind = false; }   // nearest clear direction: in front, fully visible
      else {   // no fully clear way (a fist in front of his chest, as in the kick): off his head, over the least of his body, tucked behind it
        const share = a => { for (let k = 0.05; k <= 1; k += 0.05) if (!weaponCrosses(opts.weapon, gx, gy, a, size, torso, k)) return k; return 1; };
        const C2 = []; for (let a = 0; a < 360; a += 15) if (!weaponCrosses(opts.weapon, gx, gy, a, size, head, 0.12)) C2.push(a);
        if (C2.length) { ang2 = C2.reduce((b, a) => share(a) < share(b) ? a : b); behind = (WEAPON_GRIP[opts.weapon]?.size ?? 1) >= 0.9; }   // a short item (hockey stick, nunchucks) would vanish behind him: it stays in front   // behind him: never a sticker across his body (Emery 31.webp); its ends show past him
      }
    }
    if (behind) drawWeapon(ctx, opts.weapon, gx, gy, ang2, size, 'held');
    ctx.drawImage(img.held, left, top, Wm, Hm);
    if (!behind) drawWeapon(ctx, opts.weapon, gx, gy, ang2, size, 'held');
    ctx.drawImage(img.fist, left, top, Wm, Hm);
    const beltCol = BELT_COLOR || (img.beltAlways ? '#f4f4f4' : null);
    if (img.belt && beltCol && opts.belt !== false) ctx.drawImage(beltTint(img, beltCol), -w / 2, -ih, w, ih);
    if (opts.flash) { ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = opts.flash; ctx.fillStyle = '#fff'; ctx.fillRect(left, top, Wm, Hm); }
    ctx.restore();
    return true;
  }
  if (hold && opts.onlyWeapon) {   // test hook used by the Doctor's grip check: the item alone, where it is drawn
    const [hx, hy, ang, , , , shift] = sheet.hands[img.key]; const k = w / img.naturalWidth;
    drawWeapon(ctx, opts.weapon, -w / 2 - (shift ? shift[1] : 0) * k + hx * img.held.naturalWidth * k, -ih - (shift ? shift[0] : 0) * k + hy * img.held.naturalHeight * k, ang, h * HELD, 'held');
    ctx.restore(); return true;
  }
  let frontWeapon = null;   // golf cart: the weapon rests against the seat in front of the cart's back
  // weapon goes BEHIND the sprite so his fist wraps around the handle
  if (opts.weapon && sheet.hands?.[img.key] && (!img.fist || sheet.hands[img.key][3])) {   /* behind the body (no fist layer, or the blade would cross his face, or strapped on his back on a ride) */ const [hx, hy, ang] = sheet.hands[img.key]; const ride = key.startsWith('rides/'); if (key === 'rides/golfcart') { frontWeapon = () => drawWeapon(ctx, opts.weapon, -w / 2 + (hx - 0.1) * w, -ih + (hy + 0.12) * ih, 345, ih * 0.3, 'carry'); }   /* leaning on the seat behind him */ else drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, ride ? ih * 0.38 : h * HELD, ride ? 'carry' : img.key); }
  // on rides his hands are on the handlebars / reins, so the weapon is strapped across his back (placed from the belt position)
  else if (opts.weapon && img.beltC && key.startsWith('rides/')) {
    const o = RIDE_BACK[key.slice(6)] || RIDE_BACK.default; const [bx, by] = img.beltC;
    if (!o.front) drawWeapon(ctx, opts.weapon, -w / 2 + (bx + o.dx) * w, -ih + (by + o.dy) * ih, o.ang, ih * o.size, 'back');
    else frontWeapon = () => drawWeapon(ctx, opts.weapon, -w / 2 + (bx + o.dx) * w, -ih + (by + o.dy) * ih, o.ang, ih * o.size, 'back');   // golf cart: resting in the back seat
  }
  if (opts.onlyWeapon) { frontWeapon?.(); if (opts.weapon && img.fist && sheet.hands?.[img.key]) { const [hx, hy, ang] = sheet.hands[img.key]; drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, h * HELD, img.key); } ctx.restore(); return true; }   // test hook used by the Doctor's grip check
  ctx.drawImage(img, -w / 2, -ih, w, ih);
  frontWeapon?.();
  // held weapon: in front of the body, then the fingers on top so the fist wraps around the handle
  if (opts.weapon && img.fist && sheet.hands?.[img.key]) {
    const [hx, hy, ang, behind] = sheet.hands[img.key];
    if (!behind) drawWeapon(ctx, opts.weapon, -w / 2 + hx * w, -ih + hy * ih, ang, h * HELD, img.key);
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
