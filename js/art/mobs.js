import { INK, shade, rr, circle, ellipse, poly, line, limb, block, shadow, fillStroke } from './core.js';

// All mobs face RIGHT in local coordinates; enemies are drawn mirrored (facing -1).
const px = (ctx, x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

function humanoidBlock(ctx, o, pose) {
  // generic Minecraft-ish mob: head, body, arms, legs
  const t = pose.t || 0, a = pose.attack || 0, sw = Math.sin(t * 4) * 0.12;
  const { head = '#5fa047', body = '#2fa6a8', legs = '#3a3f9a', arm = head, h = 1, thin = false, hw = 22 } = o;
  const legH = 22 * h, bodyH = 24 * h, bw = thin ? 12 : 18, lw = thin ? 6 : 8;
  shadow(ctx, 0, 0, 18);
  limb(ctx, -bw * 0.25, -legH, sw * 2, lw, legH, shade(legs, -0.2), 2.5);
  limb(ctx, bw * 0.25, -legH, -sw * 2, lw, legH, legs, 2.5);
  block(ctx, -bw / 2, -legH - bodyH, bw, bodyH, body, 2.5);
  if (o.bodyDetail) o.bodyDetail(ctx, -bw / 2, -legH - bodyH, bw, bodyH);
  const armAng = o.armsOut ? -Math.PI / 2 + 0.05 - a * 0.3 : (-a * 1.4 + sw);
  limb(ctx, -bw * 0.15, -legH - bodyH + 4, armAng + 0.1, lw - 1, 20 * h, shade(arm, -0.2), 2.5);
  const hy = -legH - bodyH - hw + 2;
  block(ctx, -hw / 2 + 1, hy, hw, hw, head, 2.5);
  if (o.face) o.face(ctx, -hw / 2 + 1, hy, hw, t, pose);
  limb(ctx, bw * 0.15, -legH - bodyH + 4, armAng, lw - 1, 20 * h, arm, 2.5);
  if (o.hand) { const L = 20 * h; o.hand(ctx, bw * 0.15 - Math.sin(armAng) * L, -legH - bodyH + 4 + Math.cos(armAng) * L, armAng, a); }
  return { top: hy };
}

const faceZombie = (ctx, x, y, s) => { px(ctx, x + s * 0.5, y + s * 0.4, s * 0.2, s * 0.15, '#0f2a0a'); px(ctx, x + s * 0.78, y + s * 0.4, s * 0.18, s * 0.15, '#0f2a0a'); px(ctx, x + s * 0.55, y + s * 0.72, s * 0.35, s * 0.08, '#2c4a1f'); };
const faceSkel = (ctx, x, y, s) => { px(ctx, x + s * 0.45, y + s * 0.38, s * 0.2, s * 0.18, '#222'); px(ctx, x + s * 0.75, y + s * 0.38, s * 0.2, s * 0.18, '#222'); px(ctx, x + s * 0.5, y + s * 0.72, s * 0.42, s * 0.08, '#555'); };
const faceIllager = (ctx, x, y, s) => { px(ctx, x + s * 0.4, y + s * 0.3, s * 0.6, s * 0.08, '#3a2a20'); px(ctx, x + s * 0.48, y + s * 0.4, s * 0.12, s * 0.12, '#fff'); px(ctx, x + s * 0.52, y + s * 0.42, s * 0.08, s * 0.1, '#2a6a2a'); px(ctx, x + s * 0.78, y + s * 0.4, s * 0.12, s * 0.12, '#fff'); px(ctx, x + s * 0.82, y + s * 0.42, s * 0.08, s * 0.1, '#2a6a2a'); px(ctx, x + s * 0.88, y + s * 0.5, s * 0.2, s * 0.35, '#9a8270'); };

function bow(ctx, x, y, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI / 2); ctx.beginPath(); ctx.arc(0, 0, 12, -1.2, 1.2); ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 2.5; ctx.strokeStyle = '#8a5a2b'; ctx.stroke(); line(ctx, Math.cos(-1.2) * 12, Math.sin(-1.2) * 12, Math.cos(1.2) * 12, Math.sin(1.2) * 12, '#ddd', 1); ctx.restore(); }
function axe(ctx, x, y, ang) { ctx.save(); ctx.translate(x, y); ctx.rotate(ang + Math.PI); block(ctx, -2, -4, 4, 26, '#7a5228', 2); poly(ctx, [2, 14, 12, 10, 12, 24, 2, 22], '#ccc', 2); ctx.restore(); }
function crown(ctx, x, y, w) { poly(ctx, [x, y, x + w * 0.1, y - w * 0.45, x + w * 0.3, y - w * 0.2, x + w * 0.5, y - w * 0.55, x + w * 0.7, y - w * 0.2, x + w * 0.9, y - w * 0.45, x + w, y], '#ffcf33', 2.5); circle(ctx, x + w * 0.5, y - w * 0.15, w * 0.07, '#e23', 1.5); }

const MOBS = {
  zombie(ctx, p) { return humanoidBlock(ctx, { head: '#5fa047', body: '#2fa6a8', legs: '#3a3f9a', arm: '#5fa047', armsOut: true, face: faceZombie }, p); },
  baby_zombie(ctx, p) { ctx.scale(0.7, 0.7); return humanoidBlock(ctx, { head: '#5fa047', body: '#2fa6a8', legs: '#3a3f9a', arm: '#5fa047', armsOut: true, hw: 24, face: faceZombie }, p); },
  drowned(ctx, p) { return humanoidBlock(ctx, { head: '#3e8a86', body: '#2a6b74', legs: '#5b4a8a', arm: '#3e8a86', armsOut: true, face: (c, x, y, s) => { px(c, x + s * 0.5, y + s * 0.4, s * 0.2, s * 0.15, '#7ff7ff'); px(c, x + s * 0.78, y + s * 0.4, s * 0.18, s * 0.15, '#7ff7ff'); },
    hand: (c, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a + Math.PI); block(c, -1.5, -8, 3, 34, '#2fbfaa', 2); poly(c, [-6, 26, 6, 26, 0, 34], '#2fbfaa', 2); c.restore(); } }, p); },
  skeleton(ctx, p) { return humanoidBlock(ctx, { head: '#d6d6d6', body: '#c8c8c8', legs: '#c0c0c0', arm: '#d6d6d6', thin: true, face: faceSkel, bodyDetail: (c, x, y, w, h) => { for (let i = 0; i < 3; i++) px(c, x + 2, y + 5 + i * 6, w - 4, 2, '#777'); }, hand: (c, x, y, a) => bow(c, x, y, a) }, p); },
  wither_skel(ctx, p) { return humanoidBlock(ctx, { head: '#2a2a2e', body: '#232326', legs: '#1d1d20', arm: '#2a2a2e', thin: true, h: 1.15, face: (c, x, y, s) => { px(c, x + s * 0.45, y + s * 0.38, s * 0.2, s * 0.18, '#000'); px(c, x + s * 0.75, y + s * 0.38, s * 0.2, s * 0.18, '#000'); }, hand: (c, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a + Math.PI); block(c, -2, -2, 4, 8, '#5a3a1a', 2); block(c, -3, 6, 6, 24, '#8a8a8a', 2); c.restore(); } }, p); },
  pillager(ctx, p) { return humanoidBlock(ctx, { head: '#a89888', body: '#3e4a5a', legs: '#2b2f3a', arm: '#3e4a5a', face: faceIllager, hand: (c, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2); block(c, -12, -3, 24, 6, '#6b4423', 2); line(c, -10, 0, 0, -8, '#ccc', 1.5); line(c, 10, 0, 0, -8, '#ccc', 1.5); c.restore(); } }, p); },
  vindicator(ctx, p) { return humanoidBlock(ctx, { head: '#a89888', body: '#2b2f3a', legs: '#20232c', arm: '#2b2f3a', face: faceIllager, hand: (c, x, y, a) => axe(c, x, y, a) }, p); },
  witch(ctx, p) {
    const r = humanoidBlock(ctx, { head: '#a89888', body: '#4a2a6a', legs: '#3a1f55', arm: '#4a2a6a', face: (c, x, y, s) => { faceIllager(c, x, y, s); px(c, x + s * 0.9, y + s * 0.5, s * 0.25, s * 0.45, '#9a8270'); px(c, x + s * 1.0, y + s * 0.8, s * 0.08, s * 0.08, '#4aa83a'); },
      hand: (c, x, y) => { circle(c, x + 3, y + 2, 6, '#c03ae0', 2); block(c, x + 1, y - 7, 4, 5, '#ddd', 1.5); } }, p);
    poly(ctx, [-16, r.top + 2, 18, r.top + 2, 6, r.top - 8, 2, r.top - 26], '#2a1a3a', 2.5);
    return r;
  },
  micro_manager(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, b = Math.sin(t * 5) * 1;
    shadow(ctx, 0, 0, 20);
    for (const [x, ph] of [[-12, 0], [-4, 1], [4, 2], [12, 3]]) { const k = Math.sin(t * 8 + ph) * 3; line(ctx, x, -14 - b, x + k, 0, INK, 4); }
    block(ctx, -20, -44 - b, 40, 30, '#1c1c22', 3);
    block(ctx, -14, -40 - b, 28, 10, '#2b2b33', 2);
    rr(ctx, -10, -38 - b, 20, 6, 3, a > 0.2 ? '#ff2a2a' : '#ff5555', 1.5);
    px(ctx, -6, -24 - b, 12, 3, '#ffcf33');
    limb(ctx, 16, -36 - b, -Math.PI / 2 * (0.3 + a), 5, 18, '#3a3a44', 2.5);
    circle(ctx, 16 + Math.sin(Math.PI / 2 * (0.3 + a)) * 18, -36 - b + Math.cos(Math.PI / 2 * (0.3 + a)) * 18, 4, '#ffcf33', 2);
    return { top: -44 - b };
  },
  creeper(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, flash = p.flash || 0;
    const g = flash > 0.5 ? '#fff' : '#5cb848';
    shadow(ctx, 0, 0, 16);
    for (const [x, k] of [[-10, 0], [-2, 1], [4, 2], [10, 3]]) block(ctx, x - 4, -12, 8, 12, shade('#4c9c3a', k % 2 ? -0.1 : 0), 2.5);
    const sq = 1 + a * 0.1;
    ctx.save(); ctx.scale(sq, 1);
    block(ctx, -9, -44, 18, 32, g, 2.5);
    for (let i = 0; i < 8; i++) px(ctx, -8 + (i * 7) % 16, -42 + (i * 11) % 28, 4, 4, '#3f8a30');
    block(ctx, -12, -66, 24, 24, g, 2.5);
    for (let i = 0; i < 6; i++) px(ctx, -11 + (i * 9) % 22, -65 + (i * 7) % 20, 4, 4, '#3f8a30');
    px(ctx, -7, -60, 6, 6, '#111'); px(ctx, 3, -60, 6, 6, '#111'); px(ctx, -2, -54, 6, 6, '#111'); px(ctx, -5, -50, 12, 6, '#111'); px(ctx, -5, -46, 3, 3, '#111'); px(ctx, 4, -46, 3, 3, '#111');
    ctx.restore();
    return { top: -66 };
  },
  spider(ctx, p, cave) {
    const t = p.t || 0, a = p.attack || 0;
    const c = cave ? '#1e4a5a' : '#3a302c';
    shadow(ctx, 0, 0, 26);
    for (let i = 0; i < 4; i++) {
      const k = Math.sin(t * 10 + i) * 3, x = -14 + i * 9;
      ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x, -16); ctx.lineTo(x - 8 + k, -26); ctx.lineTo(x - 14 + k, 0); ctx.stroke();
      ctx.lineWidth = 3; ctx.strokeStyle = c; ctx.stroke();
    }
    block(ctx, -24, -26, 26, 18, c, 2.5);
    block(ctx, 0 + a * 6, -28, 18, 18, shade(c, 0.1), 2.5);
    px(ctx, 9 + a * 6, -24, 4, 4, '#ff2020'); px(ctx, 14 + a * 6, -24, 3, 3, '#ff2020'); px(ctx, 6 + a * 6, -19, 3, 3, '#ff2020'); px(ctx, 12 + a * 6, -19, 4, 3, '#ff2020');
    return { top: -28 };
  },
  cave_spider(ctx, p) { ctx.scale(0.8, 0.8); return MOBS.spider(ctx, p, true); },
  slime(ctx, p, magma) {
    const t = p.t || 0, j = Math.abs(Math.sin(t * 4)), sq = 1 + (1 - j) * 0.12;
    shadow(ctx, 0, 0, 16);
    ctx.save(); ctx.translate(0, -j * 8); ctx.scale(sq, 2 - sq);
    if (magma) { block(ctx, -15, -28, 30, 28, '#5a1a10', 3); for (let i = 0; i < 3; i++) px(ctx, -14, -24 + i * 9, 28, 3, '#ff8a1f'); px(ctx, 2, -20, 5, 4, '#ffdd33'); px(ctx, 9, -20, 5, 4, '#ffdd33'); }
    else { ctx.globalAlpha = 0.85; block(ctx, -15, -28, 30, 28, '#7ed957', 3); ctx.globalAlpha = 1; block(ctx, -8, -21, 18, 16, '#5cbf3a', 0); px(ctx, 0, -20, 5, 5, '#1a3a10'); px(ctx, 8, -20, 5, 5, '#1a3a10'); px(ctx, 5, -11, 4, 3, '#1a3a10'); }
    ctx.restore();
    return { top: -36 };
  },
  magma_cube(ctx, p) { return MOBS.slime(ctx, p, true); },
  silverfish(ctx, p) {
    const t = p.t || 0;
    shadow(ctx, 0, 0, 18);
    for (let i = 0; i < 5; i++) block(ctx, -20 + i * 8, -12 + Math.sin(t * 10 + i) * 2 - (i === 4 ? 2 : 0), 9, 10 + (i === 2 ? 3 : 0), i % 2 ? '#9a9aa2' : '#b8b8c0', 2);
    px(ctx, 16, -9 + Math.sin(t * 10 + 4) * 2, 2, 2, '#111');
    return { top: -16 };
  },
  enderman(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, s = Math.sin(t * 2) * 0.05;
    shadow(ctx, 0, 0, 14);
    limb(ctx, -4, -46, s, 6, 46, '#141016', 2.5); limb(ctx, 4, -46, -s, 6, 46, '#1c171f', 2.5);
    block(ctx, -9, -78, 18, 34, '#1c171f', 2.5);
    limb(ctx, -6, -74, 0.1 - a, 5, 42, '#141016', 2.5);
    block(ctx, -11, -98, 22, 20, '#1c171f', 2.5);
    px(ctx, -6, -88, 7, 3, '#d36bff'); px(ctx, 4, -88, 7, 3, '#d36bff'); px(ctx, -4, -88, 3, 3, '#f3c6ff'); px(ctx, 6, -88, 3, 3, '#f3c6ff');
    limb(ctx, 6, -74, -0.1 - a * 1.2, 5, 42, '#1c171f', 2.5);
    if (Math.sin(t * 3) > 0.7) { ctx.fillStyle = '#c64bff'; for (let i = 0; i < 3; i++) ctx.fillRect(-14 + Math.random() * 28, -90 + Math.random() * 80, 3, 3); }
    return { top: -98 };
  },
  iron_golem(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, sw = Math.sin(t * 3) * 0.08;
    shadow(ctx, 0, 0, 26);
    block(ctx, -14, -26, 11, 26, '#bdb9b0', 2.5); block(ctx, 3, -26, 11, 26, '#cfcbc2', 2.5);
    block(ctx, -22, -64, 44, 40, '#d4d0c6', 2.5);
    px(ctx, -16, -52, 8, 14, '#5d8a3a'); px(ctx, 6, -42, 6, 12, '#5d8a3a');
    block(ctx, -10, -84, 20, 22, '#d4d0c6', 2.5);
    px(ctx, -6, -78, 5, 4, '#ff2020'); px(ctx, 3, -78, 5, 4, '#ff2020'); px(ctx, -2, -72, 4, 8, '#bdb9b0');
    limb(ctx, 22, -60, sw - a * 1.4, 10, 46, '#cfcbc2', 2.5);
    return { top: -84 };
  },
  warden(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, pulse = (Math.sin(t * 4) + 1) / 2;
    shadow(ctx, 0, 0, 26);
    block(ctx, -14, -30, 11, 30, '#0f3a40', 2.5); block(ctx, 3, -30, 11, 30, '#124650', 2.5);
    block(ctx, -24, -70, 48, 42, '#124650', 2.5);
    ctx.globalAlpha = 0.5 + pulse * 0.5; px(ctx, -12, -62, 24, 22, '#38f3e6'); ctx.globalAlpha = 1;
    px(ctx, -6, -56, 4, 4, '#ff8a3d'); px(ctx, 2, -52, 4, 4, '#ff8a3d');
    block(ctx, -16, -98, 32, 28, '#124650', 2.5);
    poly(ctx, [-16, -94, -30, -110, -24, -88], '#38f3e6', 2.5); poly(ctx, [16, -94, 30, -110, 24, -88], '#38f3e6', 2.5);
    px(ctx, -12, -82, 24, 4, a > 0.2 ? '#38f3e6' : '#0a2a2e');
    limb(ctx, 24, -66, -a * 1.3 + Math.sin(t * 2) * 0.1, 11, 40, '#0f3a40', 2.5);
    return { top: -110 };
  },
  guardian(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, bob = Math.sin(t * 2.5) * 4, elder = p.crown;
    const c = elder ? '#c9c2b0' : '#5aa89a';
    ctx.translate(0, -18 + bob);
    shadow(ctx, 0, 18 - bob, 20);
    for (const [x, y] of [[-24, -10], [24, -10], [0, -34], [0, 14], [-18, -28], [18, -28], [-18, 10], [18, 10]]) poly(ctx, [x * 0.8, y * 0.8, x * 1.15 + (x > 0 ? 4 : x < 0 ? -4 : 0), y * 1.1 - (y < 0 ? 4 : -4), x * 0.8 + 4, y * 0.8 + 2], '#e8a030', 2);
    block(ctx, -22, -30, 44, 40, c, 3);
    block(ctx, -10, -18, 20, 16, '#fff', 2.5); block(ctx, -4 + a * 3, -14, 8, 8, '#6a2a8a', 0);
    block(ctx, 20, -12, 14, 10, shade(c, -0.15), 2.5);
    if (a > 0.3) { ctx.globalAlpha = a; line(ctx, 10, -10, 200, -10, '#ff3a8a', 4); line(ctx, 10, -10, 200, -10, '#fff', 1.5); ctx.globalAlpha = 1; }
    return { top: -50 };
  },
  blaze(ctx, p) {
    const t = p.t || 0, bob = Math.sin(t * 3) * 4;
    ctx.translate(0, -20 + bob);
    for (let i = 0; i < 8; i++) { const an = t * 2 + i * Math.PI / 4; const r = i % 2 ? 22 : 16; block(ctx, Math.cos(an) * r - 3, -6 + Math.sin(an) * 6 + (i % 2 ? 10 : -6), 6, 18, '#f0b020', 2); }
    ctx.globalAlpha = 0.6; ellipse(ctx, 0, 6, 16, 22, '#ff7a1f', 0); ctx.globalAlpha = 1;
    block(ctx, -12, -34, 24, 24, '#f8d040', 2.5);
    px(ctx, -6, -26, 5, 4, '#222'); px(ctx, 4, -26, 5, 4, '#222'); px(ctx, -5, -18, 12, 3, '#a05010');
    return { top: -54 };
  },
  piglin(ctx, p) { return humanoidBlock(ctx, { head: '#f0a0a0', body: '#7a5a3a', legs: '#5a3a20', arm: '#f0a0a0', face: (c, x, y, s) => { px(c, x + s * 0.55, y + s * 0.55, s * 0.5, s * 0.35, '#e08888'); px(c, x + s * 0.65, y + s * 0.65, s * 0.08, s * 0.1, '#5a2a2a'); px(c, x + s * 0.85, y + s * 0.65, s * 0.08, s * 0.1, '#5a2a2a'); px(c, x + s * 0.45, y + s * 0.35, s * 0.12, s * 0.12, '#fff'); px(c, x + s * 0.75, y + s * 0.35, s * 0.12, s * 0.12, '#fff'); px(c, x + s * 0.5, y + s * 0.9, s * 0.08, s * 0.15, '#fff'); },
    hand: (c, x, y, a) => { c.save(); c.translate(x, y); c.rotate(a + Math.PI); block(c, -2, -2, 4, 8, '#5a3a1a', 2); block(c, -3, 6, 6, 22, '#ffcf33', 2); c.restore(); } }, p); },
  ghast(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, bob = Math.sin(t * 1.5) * 6;
    ctx.translate(0, -60 + bob);
    for (let i = 0; i < 9; i++) { const k = Math.sin(t * 3 + i) * 4; block(ctx, -34 + i * 8, 26, 5, 18 + (i % 3) * 8 + k, '#e8e8e8', 2); }
    block(ctx, -40, -40, 80, 68, '#f2f2f2', 3);
    if (a > 0.2) { px(ctx, -22, -18, 12, 12, '#222'); px(ctx, 10, -18, 12, 12, '#222'); px(ctx, -12, 4, 24, 12, '#5a0a0a'); }
    else { px(ctx, -22, -12, 12, 3, '#555'); px(ctx, 10, -12, 12, 3, '#555'); px(ctx, -8, 8, 16, 3, '#555'); px(ctx, -20, -8, 3, 12, '#9ad'); px(ctx, 12, -8, 3, 16, '#9ad'); }
    return { top: -40 };
  },
  // ---- LEGO & movie villains ----
  bad_cop(ctx, p) { return minifig(ctx, p, { torso: '#1d3a8c', legs: '#1b1b2a', hat: 'police', face: 'shades', badge: true }); },
  president_business(ctx, p) { return minifig(ctx, p, { torso: '#2a2d3a', legs: '#2a2d3a', hair: '#6b6f78', face: 'angry', tie: '#c22', suit: true }); },
  toasty(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, b = Math.sin(t * 4) * 1.5;
    shadow(ctx, 0, 0, 26);
    for (const x of [-12, 10]) { limb(ctx, x, -14 - b, Math.sin(t * 5 + x) * 0.2, 6, 14, '#6a6a72', 2.5); ellipse(ctx, x + 2, 0, 7, 4, '#333', 2); }
    // toast popping
    const pop = 8 + a * 18 + Math.abs(Math.sin(t * 2)) * 3;
    for (const x of [-12, 4]) { rr(ctx, x, -66 - b - pop, 14, 24, 5, '#3a2210'); rr(ctx, x + 2, -64 - b - pop, 10, 18, 4, '#5a3418', 0); }
    rr(ctx, -26, -60 - b, 52, 48, 12, '#c8ccd4');
    ctx.save(); ctx.globalAlpha = 0.5; rr(ctx, -20, -55 - b, 10, 36, 5, '#fff', 0); ctx.restore();
    rr(ctx, -16, -64 - b, 16, 6, 3, '#222', 2); rr(ctx, 2, -64 - b, 16, 6, 3, '#222', 2);
    // evil face
    circle(ctx, -6, -40 - b, 6, '#fff', 2); circle(ctx, 12, -40 - b, 6, '#fff', 2);
    circle(ctx, -4, -39 - b, 3, '#c01818', 0); circle(ctx, 14, -39 - b, 3, '#c01818', 0);
    line(ctx, -13, -50 - b, -1, -45 - b, INK, 3); line(ctx, 19, -50 - b, 7, -45 - b, INK, 3);
    ctx.beginPath(); ctx.moveTo(-6, -26 - b); ctx.lineTo(-2, -29 - b); ctx.lineTo(2, -26 - b); ctx.lineTo(6, -29 - b); ctx.lineTo(10, -26 - b); ctx.lineTo(14, -29 - b); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
    rr(ctx, 24, -40 - b, 8, 14, 3, '#444', 2);
    limb(ctx, 26, -46 - b, -0.6 - a * 1.2, 5, 18, '#6a6a72', 2.5);
    return { top: -70 };
  },
  malgosha(ctx, p) {
    const t = p.t || 0, a = p.attack || 0, b = Math.sin(t * 2) * 1.5;
    shadow(ctx, 0, 0, 24);
    // robe
    poly(ctx, [-22, 0, 22, 0, 16, -52 - b, -16, -52 - b], '#3a1f2a', 3);
    poly(ctx, [-6, 0, 6, 0, 4, -50 - b, -4, -50 - b], '#b8862b', 2);
    // staff
    const sx = 22, sy = -40 - b;
    line(ctx, sx, sy - 40, sx + 4, 0, INK, 7); line(ctx, sx, sy - 40, sx + 4, 0, '#5a3a22', 4);
    const glow = 0.6 + Math.sin(t * 5) * 0.3 + a * 0.4;
    ctx.save(); ctx.globalAlpha = glow * 0.5; circle(ctx, sx, sy - 46, 14, '#ffb020', 0); ctx.restore();
    circle(ctx, sx, sy - 46, 8, '#ff9a1f', 2.5); circle(ctx, sx - 2, sy - 48, 3, '#fff3a0', 0);
    // shoulders / cloak collar
    poly(ctx, [-24, -50 - b, 24, -50 - b, 18, -60 - b, -18, -60 - b], '#5a2a3a', 2.5);
    // head (piglin)
    const hy = -84 - b;
    block(ctx, -15, hy, 30, 26, '#e7a0a0', 2.5);
    block(ctx, 6, hy + 10, 16, 12, '#d98a8a', 2.5); px(ctx, 12, hy + 14, 3, 4, '#5a2a2a'); px(ctx, 18, hy + 14, 3, 4, '#5a2a2a');
    px(ctx, 6, hy + 22, 3, 7, '#fff8e0'); px(ctx, 18, hy + 22, 3, 7, '#fff8e0');
    px(ctx, -4, hy + 7, 5, 5, '#ffd020'); px(ctx, 8, hy + 7, 5, 5, '#ffd020');
    // white-grey hair
    for (let i = 0; i < 5; i++) block(ctx, -18 + i * 2, hy - 2 + i * 4, 6, 22 - i * 2, '#d8d4cc', 2);
    // crown / headdress
    poly(ctx, [-16, hy, 16, hy, 18, hy - 14, 8, hy - 6, 0, hy - 18, -8, hy - 6, -18, hy - 14], '#b8862b', 2.5);
    circle(ctx, 0, hy - 6, 3, '#ff3a3a', 1.5);
    limb(ctx, 14, -54 - b, -0.4 - a * 0.5, 6, 18, '#e7a0a0', 2.5);
    return { top: hy - 18 };
  },
};

function minifig(ctx, p, o) {
  const t = p.t || 0, a = p.attack || 0, b = Math.sin(t * 3) * 1;
  const Y = '#ffd22e';
  shadow(ctx, 0, 0, 20);
  // legs
  block(ctx, -14, -26, 13, 26, o.legs, 2.5); block(ctx, 1, -26, 13, 26, shade(o.legs, 0.1), 2.5);
  block(ctx, -15, -30, 30, 6, shade(o.legs, -0.2), 2.5);
  // torso (trapezoid)
  poly(ctx, [-16, -30 - b, 16, -30 - b, 12, -62 - b, -12, -62 - b], o.torso, 2.5);
  if (o.suit) { poly(ctx, [-5, -62 - b, 5, -62 - b, 0, -46 - b], '#fff', 1.5); poly(ctx, [-2, -60 - b, 2, -60 - b, 3, -44 - b, 0, -40 - b, -3, -44 - b], o.tie, 1.5); line(ctx, -5, -62 - b, -2, -36 - b, '#111', 1.5); line(ctx, 5, -62 - b, 2, -36 - b, '#111', 1.5); }
  if (o.badge) { poly(ctx, [6, -54 - b, 10, -56 - b, 12, -50 - b, 8, -47 - b, 5, -50 - b], '#ffcf33', 1.5); px(ctx, -10, -40 - b, 20, 3, '#111'); }
  // back arm
  limb(ctx, -14, -58 - b, 0.25, 8, 20, shade(o.torso, -0.2), 2.5);
  // neck + head
  block(ctx, -5, -66 - b, 10, 5, Y, 2);
  rr(ctx, -13, -90 - b, 26, 24, 7, Y);
  block(ctx, -6, -95 - b, 12, 5, Y, 2);
  // face
  const fy = -80 - b;
  if (o.face === 'shades') { rr(ctx, -9, fy - 4, 20, 7, 3, '#111', 2); line(ctx, -2, fy + 8, 8, fy + 7, INK, 2.5); }
  else { circle(ctx, -2, fy, 2.2, '#111', 0); circle(ctx, 7, fy, 2.2, '#111', 0); line(ctx, -6, fy - 6, 1, fy - 3, INK, 2.5); line(ctx, 11, fy - 6, 4, fy - 3, INK, 2.5);
    ctx.beginPath(); ctx.arc(3, fy + 10, 5, Math.PI * 1.15, Math.PI * 1.85); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); }
  if (o.hair) { // wild grey businessman hair
    poly(ctx, [-15, -82 - b, -16, -96 - b, -10, -92 - b, -6, -102 - b, 0, -94 - b, 6, -104 - b, 10, -94 - b, 16, -98 - b, 15, -84 - b, 10, -90 - b, -10, -90 - b], o.hair, 2.5);
  }
  if (o.hat === 'police') { rr(ctx, -15, -100 - b, 30, 12, 4, '#1d3a8c'); rr(ctx, -16, -90 - b, 34, 4, 2, '#111', 2); poly(ctx, [-2, -98 - b, 2, -98 - b, 3, -93 - b, -3, -93 - b], '#ffcf33', 1); }
  // front arm with C-hand
  const ang = -a * 1.4 + Math.sin(t * 2) * 0.1;
  limb(ctx, 14, -58 - b, ang, 8, 20, o.torso, 2.5);
  const hx = 14 - Math.sin(ang) * 22, hy = -58 - b + Math.cos(ang) * 22;
  ctx.beginPath(); ctx.arc(hx, hy, 5, 0.6, Math.PI * 2 - 0.6); ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 3.5; ctx.strokeStyle = Y; ctx.stroke();
  if (o.suit && a > 0.2) { // Kragle bottle
    rr(ctx, hx - 4, hy - 16, 10, 14, 3, '#f0f0f0', 2); rr(ctx, hx - 2, hy - 21, 6, 5, 2, '#c22', 1.5); ctx.fillStyle = '#c22'; ctx.fillRect(hx - 3, hy - 12, 8, 3);
  }
  return { top: -104 - b };
}

export function drawMob(ctx, art, x, y, s, pose = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (pose.facing || 1), s);
  if (pose.hurt) { ctx.translate(-pose.hurt * 6, 0); }
  const fn = MOBS[art] || MOBS.zombie;
  const r = fn(ctx, pose) || { top: -60 };
  if (pose.crown) crown(ctx, -12, r.top + 2, 24);
  if (pose.hurt > 0.4) { ctx.globalCompositeOperation = 'source-atop'; }
  ctx.restore();
  return r;
}
export const MOB_HEIGHTS = { ghast: 150, enderman: 100, warden: 112, iron_golem: 86, malgosha: 104, president_business: 106, bad_cop: 106, toasty: 80, slime: 36, magma_cube: 36, silverfish: 18, spider: 30, cave_spider: 26, guardian: 56, blaze: 60 };
