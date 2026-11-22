import { INK, shade, rr, rrPath, circle, ellipse, poly, line, limb, fillStroke, shadow } from './core.js';
import { drawWeapon } from './items.js';
import { drawSprite } from './sprites.js';
import { drawAnim, sheetReady, loadSheet, spriteHeight } from './sheets.js';

// Draw several ellipses as one blob with a single outer outline.
function blob(ctx, puffs, fill, lw = 3) {
  ctx.lineWidth = lw * 2; ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  for (const [x, y, rx, ry, rot] of puffs) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = fill;
  for (const [x, y, rx, ry, rot] of puffs) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot || 0, 0, Math.PI * 2); ctx.fill(); }
}
const P = (hx, hy, hr, arr) => arr.map(([x, y, rx, ry, rot]) => [hx + x * hr, hy + y * hr, rx * hr, ry * hr, rot]);

const HAIR_BACK = {
  bob: [[0, 0.15, 1.22, 1.12]],
  long: [[-0.15, 0.9, 1.05, 1.75], [0, -0.1, 1.15, 1.05]],
};
const HAIR_FRONT = {
  messy: [[-0.15, -0.62, 0.78, 0.5], [0.38, -0.72, 0.55, 0.42, 0.3], [-0.68, -0.25, 0.42, 0.55], [0.78, -0.38, 0.34, 0.33], [0.1, -0.98, 0.34, 0.28, -0.4], [-0.5, -0.86, 0.36, 0.3, 0.5], [0.6, -0.18, 0.4, 0.2, 0.5], [0.95, -0.7, 0.22, 0.18, 0.8]],
  swept: [[-0.1, -0.72, 0.85, 0.48], [0.35, -0.98, 0.52, 0.38, 0.4], [-0.62, -0.35, 0.45, 0.58], [0.72, -0.55, 0.38, 0.3, 0.5], [-0.3, -1.05, 0.4, 0.28, -0.3]],
  short: [[0, -0.58, 0.98, 0.52], [-0.62, -0.2, 0.42, 0.5], [0.55, -0.62, 0.5, 0.3, 0.2]],
  bob: [[0, -0.6, 1.04, 0.52], [0.42, -0.42, 0.66, 0.3, 0.05], [-0.85, 0.2, 0.42, 0.78], [-0.3, -0.5, 0.6, 0.35]],
  long: [[0, -0.62, 1.04, 0.5], [0.5, -0.5, 0.55, 0.28, 0.4], [-0.8, 0.15, 0.4, 0.85]],
};

function shirtPattern(ctx, style, x, y, w, h, color, accent) {
  ctx.save(); rrPath(ctx, x, y, w, h, 9); ctx.clip();
  if (style === 'plaid') {
    ctx.globalAlpha = 0.55; ctx.fillStyle = accent || '#fff';
    for (let i = -1; i < 6; i++) { ctx.fillRect(x + i * 9 + 2, y, 3, h); }
    for (let i = 0; i < 8; i++) { ctx.fillRect(x, y + i * 9 + 3, w, 3); }
    ctx.globalAlpha = 0.35; ctx.fillStyle = shade(color, -0.45);
    for (let i = -1; i < 6; i++) ctx.fillRect(x + i * 9 + 6, y, 2, h);
    for (let i = 0; i < 8; i++) ctx.fillRect(x, y + i * 9 + 7, w, 2);
  } else if (style === 'tribal') {
    ctx.strokeStyle = '#e9e6df'; ctx.lineWidth = 1.6;
    for (let r = 0; r < 6; r++) {
      const yy = y + 5 + r * 8;
      ctx.beginPath(); for (let i = 0; i <= w; i += 4) ctx.lineTo(x + i, yy + ((i / 4) % 2 ? 2.5 : -2.5)); ctx.stroke();
      if (r % 2) { ctx.beginPath(); ctx.moveTo(x, yy + 4); ctx.lineTo(x + w, yy + 4); ctx.stroke(); }
    }
  } else if (style === 'blouse') {
    for (let i = 0; i < 9; i++) {
      const cx = x + ((i * 13) % w), cy = y + ((i * 17) % h);
      ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.strokeStyle = accent || '#d9a62b'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#2f4f9a'; ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
    }
  } else if (style === 'stripes') {
    ctx.fillStyle = accent || '#fff'; for (let i = 0; i < 8; i++) ctx.fillRect(x, y + 3 + i * 8, w, 3.5);
  } else if (style === 'jersey') {
    ctx.fillStyle = accent || '#fff'; ctx.fillRect(x, y, 5, h); ctx.fillRect(x + w - 5, y, 5, h);
    ctx.font = 'bold 15px Fredoka, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('10', x + w / 2, y + h * 0.45);
  } else if (style === 'habs') {
    ctx.fillStyle = '#1d3a8c'; ctx.fillRect(x, y + h * 0.42, w, h * 0.2);
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y + h * 0.39, w, 2); ctx.fillRect(x, y + h * 0.62, w, 2);
    ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.25, 5.5, 0.6, Math.PI * 2 - 0.6); ctx.lineWidth = 3; ctx.strokeStyle = '#fff'; ctx.stroke();
  } else if (style === 'hoodie') {
    ctx.fillStyle = shade(color, -0.15); rrPath(ctx, x + 4, y + h * 0.55, w - 8, h * 0.3, 4); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; line(ctx, x + w * 0.4, y + 2, x + w * 0.38, y + 14, '#eee', 1.5); line(ctx, x + w * 0.6, y + 2, x + w * 0.62, y + 14, '#eee', 1.5);
  } else if (style === 'gi') {
    ctx.strokeStyle = '#bdb6aa'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + w * 0.2, y); ctx.lineTo(x + w * 0.62, y + h * 0.6); ctx.moveTo(x + w * 0.8, y); ctx.lineTo(x + w * 0.45, y + h * 0.4); ctx.stroke();
  } else if (style === 'steve') {
    ctx.fillStyle = shade(color, -0.15); ctx.fillRect(x, y + h * 0.5, w, 3);
  } else if (style === 'suit') {
    ctx.fillStyle = '#fff'; poly(ctx, [x + w * 0.35, y, x + w * 0.65, y, x + w * 0.5, y + h * 0.5], '#fff', 0);
    poly(ctx, [x + w * 0.47, y + 2, x + w * 0.53, y + 2, x + w * 0.56, y + h * 0.42, x + w * 0.5, y + h * 0.5, x + w * 0.44, y + h * 0.42], accent || '#c22', 0);
  }
  ctx.restore();
}

const LONG_SLEEVE = { plaid: 1, hoodie: 1, gi: 1, blouse: 1, suit: 1 };

function drawHat(ctx, hat, hx, hy, hr, t) {
  if (!hat || hat.style === 'none') return;
  const c = hat.color || '#7b3fe4';
  switch (hat.style) {
    case 'cap':
      rr(ctx, hx + hr * 0.2, hy - hr * 0.62, hr * 1.15, hr * 0.28, hr * 0.14, shade(c, -0.15));
      ctx.beginPath(); ctx.arc(hx, hy - hr * 0.35, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); fillStroke(ctx, c);
      circle(ctx, hx, hy - hr * 1.36, hr * 0.12, shade(c, 0.2), 2);
      break;
    case 'headband': {
      rr(ctx, hx - hr * 1.02, hy - hr * 0.62, hr * 2.04, hr * 0.3, 4, c);
      const wv = Math.sin(t * 6) * 3;
      poly(ctx, [hx - hr * 0.95, hy - hr * 0.55, hx - hr * 1.7, hy - hr * 0.2 + wv, hx - hr * 1.6, hy - hr * 0.05 + wv, hx - hr * 0.95, hy - hr * 0.4], c, 2.5);
      circle(ctx, hx + hr * 0.15, hy - hr * 0.47, hr * 0.1, '#fff', 1.5);
      break; }
    case 'beanie':
      ctx.beginPath(); ctx.arc(hx, hy - hr * 0.25, hr * 1.04, Math.PI, Math.PI * 2); ctx.closePath(); fillStroke(ctx, c);
      rr(ctx, hx - hr * 1.08, hy - hr * 0.42, hr * 2.16, hr * 0.32, 5, shade(c, -0.2));
      circle(ctx, hx, hy - hr * 1.33, hr * 0.24, '#fff');
      break;
    case 'crown':
      poly(ctx, [hx - hr * 0.75, hy - hr * 0.6, hx - hr * 0.8, hy - hr * 1.35, hx - hr * 0.4, hy - hr * 1.0, hx, hy - hr * 1.5, hx + hr * 0.4, hy - hr * 1.0, hx + hr * 0.8, hy - hr * 1.35, hx + hr * 0.75, hy - hr * 0.6], '#ffcf33');
      circle(ctx, hx, hy - hr * 0.85, hr * 0.13, '#e23', 2);
      break;
    case 'helmet': {
      const hc = c === '#7b3fe4' ? '#4fe3e0' : c;
      ctx.beginPath(); ctx.rect(hx - hr * 1.12, hy - hr * 1.18, hr * 2.24, hr * 0.85); fillStroke(ctx, hc);
      ctx.beginPath(); ctx.rect(hx - hr * 1.12, hy - hr * 0.4, hr * 0.45, hr * 0.9); fillStroke(ctx, hc);
      ctx.fillStyle = shade(hc, 0.4); ctx.fillRect(hx - hr * 0.9, hy - hr * 1.05, hr * 0.5, hr * 0.15);
      break; }
    case 'bacon': {
      const cols = ['#7a3b1c', '#d9774a', '#7a3b1c', '#d9774a'];
      blob(ctx, P(hx, hy, hr, [[0, -0.7, 1.05, 0.48]]), '#7a3b1c');
      ctx.save(); ctx.beginPath(); ctx.ellipse(hx, hy - hr * 0.7, hr * 1.05, hr * 0.48, 0, 0, Math.PI * 2); ctx.clip();
      for (let i = 0; i < 6; i++) { ctx.strokeStyle = cols[i % 4]; ctx.lineWidth = hr * 0.16; ctx.beginPath(); for (let k = -1.1; k <= 1.1; k += 0.1) ctx.lineTo(hx + k * hr, hy - hr * (1.1 - i * 0.14) + Math.sin(k * 8) * 2); ctx.stroke(); }
      ctx.restore();
      break; }
    case 'propeller': {
      ctx.beginPath(); ctx.arc(hx, hy - hr * 0.35, hr * 1.02, Math.PI * 1.02, Math.PI * 1.98); ctx.closePath(); fillStroke(ctx, c);
      line(ctx, hx, hy - hr * 1.35, hx, hy - hr * 1.6, INK, 2.5);
      const pw = Math.cos(t * 18) * hr * 0.9;
      ellipse(ctx, hx, hy - hr * 1.65, Math.abs(pw) + 1, hr * 0.12, '#ff4d6d', 2);
      break; }
    case 'santa':
      poly(ctx, [hx - hr, hy - hr * 0.5, hx + hr, hy - hr * 0.5, hx - hr * 0.2, hy - hr * 1.7], '#e0263f');
      rr(ctx, hx - hr * 1.08, hy - hr * 0.6, hr * 2.16, hr * 0.3, 6, '#fff');
      circle(ctx, hx - hr * 0.25, hy - hr * 1.7, hr * 0.2, '#fff');
      break;
  }
}

// soft inner shading for round shapes (Capybara-Go-like)
function shadeIn(ctx, pathFn, color, dx, dy, alpha = 0.18) {
  ctx.save(); pathFn(); ctx.clip();
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.translate(dx, dy); pathFn(); ctx.rect(-9999, -9999, 19998, 19998); ctx.fill('evenodd');
  ctx.restore();
}

export function drawPerson(ctx, x, y, s, L, pose = {}) {
  if (L.id && !pose.sit) {
    const key = 'chars/' + L.id;
    if (sheetReady(key)) {
      const anim = pose.attack > 0.2 ? 'punch' : pose.sad ? 'sad' : pose.armUp ? 'victory' : pose.wave ? 'wave' : pose.walk != null ? 'run' : 'idle';
      drawAnim(ctx, key, anim, x, y, spriteHeight(key) * s, { t: pose.t, facing: pose.facing || 1, noShadow: pose.noShadow, weapon: pose.weapon });
      return { headY: y - spriteHeight(key) * s, height: spriteHeight(key) * s };
    }
    loadSheet(key);
  }
  if (L.id && drawSprite(ctx, L.id, x, y, (L.build === 'kid' ? 95 : 100 + ((L.height || 1) - 1) * 95) * s, pose)) return { headY: y - 95 * s, height: 95 * s };
  const t = pose.t || 0;
  const H = L.height || 1;
  const kid = L.build === 'kid';
  const hr = kid ? 27 : 24;                                   // big chibi head
  const legLen = kid ? 11 : 11 + (H - 1) * 52;                // Emery gets long legs
  const torso = kid ? 26 : 26 + (H - 1) * 40;
  const bw = kid ? 31 : L.build === 'tall' ? 30 : 31;
  const walk = pose.walk;
  const sw = walk != null ? Math.sin(walk) : 0;
  const bob = walk != null ? Math.abs(Math.cos(walk)) * 2.5 : Math.sin(t * 2.6) * 1;
  const breathe = walk == null ? Math.sin(t * 2.6) * 0.015 : 0;
  const atk = pose.attack || 0;
  const hurt = pose.hurt || 0;
  const skin = L.skin;
  const shirt = L.shirt || { style: 'tee', color: '#7b3fe4' };
  const pants = L.pants || { style: 'shorts', color: '#5d6f80' };
  const sit = !!pose.sit;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s * (pose.facing || 1), s);
  if (hurt) ctx.translate(-hurt * 7, 0);
  if (!sit && !pose.noShadow) shadow(ctx, 0, 0, bw * 0.85);
  ctx.scale(1 - breathe, 1 + breathe);

  const hipY = sit ? 0 : -legLen - bob * 0.3;
  const shY = hipY - torso;
  const hx = 3, hy = shY - hr * 0.62 - bob * 0.4;

  // long hair behind body
  if (HAIR_BACK[L.hairStyle]) blob(ctx, P(hx, hy, hr, HAIR_BACK[L.hairStyle]), L.hair, 3);

  const sleeveCol = shirt.style === 'tank' ? skin : shirt.color;
  const longSleeve = LONG_SLEEVE[shirt.style];
  const armLen = kid ? 17 : 17 + (H - 1) * 22, armW = 11;
  const drawArm = (ax, ay, ang, back, len = armLen) => {
    const dark = back ? -0.2 : 0;
    limb(ctx, ax, ay, ang, armW, len, shade(longSleeve ? sleeveCol : skin, dark), 3);
    if (!longSleeve && shirt.style !== 'tank') limb(ctx, ax, ay, ang, armW + 2, len * 0.42, shade(sleeveCol, dark), 3);
    const hx2 = ax - Math.sin(ang) * len, hy2 = ay + Math.cos(ang) * len;
    circle(ctx, hx2, hy2, 6.3 + (back ? 0 : atk * 2.5), shade(skin, dark), 3);
    return [hx2, hy2];
  };
  // back arm
  drawArm(-bw * 0.36, shY + 12, sit ? -0.6 : sw * 0.6 + 0.15, true);

  // legs (short and stubby)
  const legW = 12.5, shoe = pants.shoe || '#3b3346';
  const legCol = (pants.style === 'shorts' || pants.style === 'skirt') ? skin : pants.color;
  const drawLeg = (lx, ang, back) => {
    const dark = back ? -0.2 : 0;
    if (sit) {
      limb(ctx, lx, hipY - 4, -Math.PI / 2 + 0.2, legW, 16, shade(pants.color, dark), 3);
      ellipse(ctx, lx + 20, hipY + 2, 8.5, 5.5, shade(shoe, dark), 3);
      return;
    }
    limb(ctx, lx, hipY - 4, ang, legW, legLen + 2, shade(legCol, dark), 3);
    if (pants.style === 'shorts') limb(ctx, lx, hipY - 5, ang, legW + 2, Math.min(legLen, 7 + legLen * 0.25), shade(pants.color, dark), 3);
    const fx = lx - Math.sin(ang) * (legLen + 2) + 3, fy = hipY + Math.cos(ang) * (legLen + 2) + 1;
    ellipse(ctx, fx, fy, 9, 5.5, shade(shoe, dark), 3);
    ctx.save(); ctx.globalAlpha = 0.35; ellipse(ctx, fx - 2, fy - 2, 4, 1.6, '#fff', 0); ctx.restore();
  };
  drawLeg(-bw * 0.2, sit ? 0 : -sw * 0.6, true);
  drawLeg(bw * 0.18, sit ? 0 : sw * 0.6, false);

  // torso: a rounded bean
  const tY = shY - 2, tH = torso + 6;
  const bodyPath = () => rrPath(ctx, -bw / 2, tY, bw, tH, 13);
  if (shirt.style === 'tank') {
    bodyPath(); fillStroke(ctx, skin, 0);
    ctx.save(); bodyPath(); ctx.clip(); rrPath(ctx, -bw / 2 - 2, tY + 8, bw + 4, tH, 10); ctx.fillStyle = shirt.color; ctx.fill(); ctx.restore();
    line(ctx, -bw * 0.24, tY + 2, -bw * 0.26, tY + 10, shirt.color, 4); line(ctx, bw * 0.22, tY + 2, bw * 0.24, tY + 10, shirt.color, 4);
  } else {
    bodyPath(); fillStroke(ctx, shirt.color, 0);
    shirtPattern(ctx, shirt.style, -bw / 2, tY, bw, tH, shirt.color, shirt.accent);
  }
  if (pants.style === 'skirt' && !sit) {
    poly(ctx, [-bw / 2 + 1, hipY - 9, bw / 2 - 1, hipY - 9, bw / 2 + 6, hipY + Math.max(8, legLen * 0.6), -bw / 2 - 6, hipY + Math.max(8, legLen * 0.6)], pants.color, 3);
    ctx.fillStyle = '#e9eef8'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(-bw / 2 + 2 + i * 6, hipY - 2 + (i % 2) * 6, 1.5, 0, 7); ctx.fill(); }
  } else if (!sit) {
    ctx.save(); bodyPath(); ctx.clip(); ctx.fillStyle = pants.color; ctx.fillRect(-bw, hipY - 8, bw * 2, 20); ctx.restore();
  }
  shadeIn(ctx, bodyPath, '#000', -5, -4, 0.16);
  bodyPath(); fillStroke(ctx, null, 3.2);
  if (L.beltColor && !sit) {
    rr(ctx, -bw / 2 - 1, hipY - 11, bw + 2, 7, 3, L.beltColor, 2.8);
    poly(ctx, [bw * 0.1, hipY - 7, bw * 0.26, hipY + 7 + Math.sin(t * 5) * 1.5, bw * 0.38, hipY + 5, bw * 0.24, hipY - 7], L.beltColor, 2.4);
    poly(ctx, [bw * 0.05, hipY - 7, bw * 0.02, hipY + 6 + Math.sin(t * 5 + 1) * 1.5, bw * 0.14, hipY + 6, bw * 0.16, hipY - 7], L.beltColor, 2.4);
  }

  const drawFrontArm = () => {
  // front arm
  let fAng = sit ? -1.0 : -sw * 0.6 - 0.1;
  let len = armLen;
  if (atk) { fAng = -Math.PI / 2 * Math.min(1, atk * 1.7) - 0.05; len = armLen * (1 + atk * 0.25); }
  if (pose.wave) fAng = Math.PI * 0.85 + Math.sin(t * 8) * 0.3;
  if (L.cane) fAng = -0.6;
  if (pose.armUp) fAng = Math.PI * 0.92;
  const sxF = bw * 0.28, syF = shY + 12;
  if (L.cane) {
    const hx2 = sxF - Math.sin(fAng) * len, hy2 = syF + Math.cos(fAng) * len;
    const ex = hx2 + 18, ey = sit ? hy2 + 30 : 0;
    line(ctx, hx2, hy2, ex, ey, INK, 6); line(ctx, hx2, hy2, ex, ey, '#fafafa', 3.2);
    const f = k => [hx2 + (ex - hx2) * k, hy2 + (ey - hy2) * k];
    const [a1, b1] = f(0.7), [a2, b2] = f(0.97); line(ctx, a1, b1, a2, b2, '#e0263f', 3.2);
  }
  if (pose.weapon && !L.cane) {
    const hx2 = sxF - Math.sin(fAng) * len, hy2 = syF + Math.cos(fAng) * len;
    drawWeapon(ctx, pose.weapon, hx2, hy2, fAng + Math.PI * 0.75 + (atk ? -0.4 : 0), 0.95);
  }
  const hand = drawArm(sxF, syF, fAng, false, len);
  if (L.tattoo && shirt.style === 'tank') {
    ctx.save(); ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 1.3;
    const m2x = sxF - Math.sin(fAng) * len * 0.5, m2y = syF + Math.cos(fAng) * len * 0.5;
    ctx.beginPath(); ctx.arc(m2x, m2y, 2.4, 0, 6.3); ctx.moveTo(m2x - 2.5, m2y + 5); ctx.lineTo(m2x + 2.5, m2y + 7); ctx.stroke(); ctx.restore();
  }
  if (atk > 0.5) {
    ctx.save(); ctx.globalAlpha = (atk - 0.5) * 2;
    for (let i = 0; i < 3; i++) line(ctx, hand[0] - 12 - i * 3, hand[1] - 7 + i * 7, hand[0] - 24 - i * 4, hand[1] - 7 + i * 7, '#fff', 2.5);
    ctx.restore();
  }
  };
  if (!atk) drawFrontArm();
  // head
  const headPath = () => { ctx.beginPath(); ctx.ellipse(hx, hy, hr * 1.03, hr, 0, 0, Math.PI * 2); };
  headPath(); fillStroke(ctx, skin, 0);
  shadeIn(ctx, headPath, '#a0522d', -5, -4, 0.16);
  headPath(); fillStroke(ctx, null, 3.2);
  ellipse(ctx, hx - hr * 0.55, hy + hr * 0.1, hr * 0.16, hr * 0.22, shade(skin, -0.06), 2.8);

  // face
  const blinking = (t % 4.2) < 0.12 || pose.eyesClosed;
  const eyeY = hy + hr * 0.16;
  const eyeXs = [hx + hr * 0.05, hx + hr * 0.58];
  if (L.sunglasses) {
    rr(ctx, hx - hr * 0.16, eyeY - hr * 0.2, hr * 0.46, hr * 0.34, 6, '#141414', 2.5);
    rr(ctx, hx + hr * 0.38, eyeY - hr * 0.2, hr * 0.44, hr * 0.34, 6, '#141414', 2.5);
    line(ctx, hx + hr * 0.3, eyeY - hr * 0.06, hx + hr * 0.38, eyeY - hr * 0.06, '#141414', 2.5);
    line(ctx, hx - hr * 0.16, eyeY - hr * 0.08, hx - hr * 0.5, eyeY - hr * 0.12, '#141414', 2.5);
    ctx.save(); ctx.globalAlpha = 0.45; ctx.fillStyle = '#fff'; ctx.fillRect(hx - hr * 0.06, eyeY - hr * 0.14, 4, 3); ctx.fillRect(hx + hr * 0.48, eyeY - hr * 0.14, 4, 3); ctx.restore();
  } else {
    for (const ex of eyeXs) {
      if (blinking) { ctx.beginPath(); ctx.arc(ex, eyeY - 1, 4.5, 0.15, Math.PI - 0.15); ctx.lineWidth = 2.8; ctx.strokeStyle = INK; ctx.stroke(); continue; }
      ellipse(ctx, ex, eyeY, hr * 0.13, hr * 0.17, L.eyes || '#3a2618', 2.4);
      ellipse(ctx, ex + 0.6, eyeY + 1, hr * 0.075, hr * 0.1, '#140d08', 0);
      circle(ctx, ex - hr * 0.04, eyeY - hr * 0.07, hr * 0.05, '#fff', 0);
      circle(ctx, ex + hr * 0.05, eyeY + hr * 0.07, hr * 0.022, '#fff', 0);
    }
    const bc = shade(L.hair === '#fbefb6' ? '#c9a66a' : L.hair, -0.3);
    const ang = pose.angry ? 3 : 0;
    line(ctx, eyeXs[0] - 4.5, eyeY - hr * 0.33 + ang * 0.3, eyeXs[0] + 4.5, eyeY - hr * 0.36 + ang, bc, 3);
    line(ctx, eyeXs[1] - 4.5, eyeY - hr * 0.36 + ang, eyeXs[1] + 4.5, eyeY - hr * 0.33 + ang * 0.3, bc, 3);
  }
  // blush
  ctx.save(); ctx.globalAlpha = kid || L.cheeks ? 0.4 : 0.22;
  ellipse(ctx, hx + hr * 0.86, eyeY + hr * 0.3, hr * 0.13, hr * 0.08, '#ff6b7a', 0);
  ellipse(ctx, hx - hr * 0.2, eyeY + hr * 0.3, hr * 0.12, hr * 0.08, '#ff6b7a', 0);
  ctx.restore();
  // nose (tiny)
  ellipse(ctx, hx + hr * 0.36, eyeY + hr * 0.24, 2.2, 1.6, shade(skin, -0.25), 0);
  if (L.septum) { ctx.beginPath(); ctx.arc(hx + hr * 0.36, eyeY + hr * 0.32, 2, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.8; ctx.strokeStyle = '#d4b04a'; ctx.stroke(); }
  if (L.nosering) circle(ctx, hx + hr * 0.28, eyeY + hr * 0.27, 1.4, '#e8e8e8', 1);
  if (L.stubble) { ctx.save(); headPath(); ctx.clip(); ctx.globalAlpha = 0.2; ctx.fillStyle = shade(L.hair, -0.35); ctx.beginPath(); ctx.ellipse(hx + hr * 0.3, hy + hr * 0.85, hr * 0.75, hr * 0.42, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
  if (L.mustache) poly(ctx, [hx + hr * 0.08, eyeY + hr * 0.42, hx + hr * 0.36, eyeY + hr * 0.32, hx + hr * 0.66, eyeY + hr * 0.42, hx + hr * 0.62, eyeY + hr * 0.5, hx + hr * 0.36, eyeY + hr * 0.42, hx + hr * 0.12, eyeY + hr * 0.5], L.mustache, 2);
  // mouth
  const mx = hx + hr * 0.36, my = eyeY + hr * 0.5;
  if (pose.shout || atk > 0.3) { ctx.beginPath(); ctx.ellipse(mx, my + 1, 5, 4.5, 0, 0, Math.PI * 2); fillStroke(ctx, '#7a1f2b', 2.5); ellipse(ctx, mx, my + 3, 3, 1.6, '#ff7d8f', 0); }
  else if (pose.sad) { ctx.beginPath(); ctx.arc(mx, my + 5, 4.5, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 2.6; ctx.strokeStyle = INK; ctx.stroke(); }
  else if (L.lips) { ctx.beginPath(); ctx.ellipse(mx, my, 4.5, 2.6, 0, 0, Math.PI * 2); fillStroke(ctx, L.lips, 1.8); }
  else { ctx.beginPath(); ctx.arc(mx, my - 2.5, 5, 0.3, Math.PI - 0.3); ctx.lineWidth = 2.8; ctx.strokeStyle = INK; ctx.stroke(); }

  // hair front
  if (HAIR_FRONT[L.hairStyle]) {
    blob(ctx, P(hx, hy, hr, HAIR_FRONT[L.hairStyle]), L.hair, 3);
    if (L.hairTop) { ctx.save(); ctx.globalAlpha = 0.55; blob(ctx, P(hx, hy, hr, [[0.1, -0.8, 0.7, 0.28]]), L.hairTop, 0); ctx.restore(); }
    ctx.save(); ctx.globalAlpha = 0.35; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(hx - hr * 0.05, hy - hr * 0.2, hr * 0.68, Math.PI * 1.25, Math.PI * 1.45); ctx.stroke(); ctx.restore();
  }
  if (L.hat) drawHat(ctx, L.hat, hx, hy, hr, t);

  if (atk) drawFrontArm();
  ctx.restore();
  return { headY: y + (hy - hr) * s, height: (hr * 2 + torso + legLen) * s };
}

// convenience: Arlo with his saved look
// Arlo's sprite set depends on the armor he wears (falls back to the base sprite)
export const ARMOR_SHEETS = ['karate_gi', 'hoodie', 'leather_tunic', 'iron_chest', 'diamond_chest'];
export function arloSheetId(save) {
  const it = save.gear.items.find(i => i.uid === save.gear.slots.gi);
  return it && ARMOR_SHEETS.includes(it.id) ? 'arlo_' + it.id : 'arlo';
}
export function arloWeapon(save) { const it = save.gear.items.find(i => i.uid === save.gear.slots.weapon); return it ? it.id : null; }
export function arloLook(save, beltColor) {
  return {
    id: arloSheetId(save), skin: '#f6d2b8', hair: '#d9b46a', hairStyle: 'messy', eyes: '#3d7fd0', height: 1, build: 'kid',
    shirt: { style: save.look.shirt.style, color: save.look.shirt.color, accent: save.look.shirt.accent || '#ffffff' },
    pants: { style: save.look.pants.style, color: save.look.pants.color },
    hat: save.look.hat, beltColor,
  };
}
