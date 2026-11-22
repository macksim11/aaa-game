import { drawSprite } from './sprites.js';
import { drawAnim, sheetReady, loadSheet, spriteHeight } from './sheets.js';
import { INK, shade, rr, circle, ellipse, poly, line, limb, block, shadow, fillStroke } from './core.js';

const PET_LOOKS = {
  twyla: { kind: 'dog', body: '#2b282e', len: 46, h: 24, leg: 14, head: 15, muzzle: '#3b3739', muzzleTip: '#77716f', ears: 'flop', tail: 'long', chest: '#e8e4e0', collar: '#1f6b45', eye: '#6a3618' },
  lenny: { kind: 'cat', body: '#19181c', len: 40, h: 25, leg: 10, head: 15, fluffy: true, bib: '#fbfbfb', paws: '#fbfbfb', face: '#fbfbfb', eye: '#e0a92a', nose: '#f3a3a8', tail: 'fluff' },
  goose: { kind: 'cat', body: '#807c82', len: 33, h: 19, leg: 9, head: 13, bib: '#fbfbfb', paws: '#fbfbfb', face: '#fbfbfb', blaze: true, eye: '#9bb36a', nose: '#e8a0a0', tail: 'thin', stripes: '#5f5a60', shy: true },
  marah: { kind: 'cat', body: '#73685a', len: 46, h: 33, leg: 7, head: 15, stripes: '#3d352d', eye: '#a9b060', nose: '#d68f86', tail: 'striped', chonk: true, face: '#c9bba6' },
  tobi: { kind: 'chi', body: '#1c1b1f', len: 30, h: 16, leg: 17, head: 12, chest: '#fbfbfb', blaze: true, tan: '#c98a4a', eye: '#5a3418', ears: 'giant', tail: 'thin' },
  zuko: { kind: 'chi', body: '#d8ad78', len: 28, h: 16, leg: 15, head: 12.5, chest: '#ecd2ab', eye: '#2b1a10', ears: 'giant', tail: 'curl', smile: true, paws: '#f6ead8' },
};

function quad(ctx, L, pose) {
  const t = pose.t || 0, walk = pose.walk;
  const sw = walk != null ? Math.sin(walk) : 0;
  const bob = walk != null ? Math.abs(Math.cos(walk)) * 2 : Math.sin(t * 3) * 0.6;
  const atk = pose.attack || 0;
  const bodyY = -L.leg - L.h / 2 - bob;
  const lx = L.len / 2;
  shadow(ctx, 0, 0, L.len * 0.6);
  // tail
  const wag = Math.sin(t * (L.kind === 'dog' || L.kind === 'chi' ? 14 : 3)) * 0.35;
  ctx.save(); ctx.translate(-lx + 3, bodyY - L.h * 0.2); ctx.rotate(-0.9 + wag);
  if (L.tail === 'fluff') { ellipse(ctx, 0, -14, 7, 16, L.body); }
  else if (L.tail === 'curl') { ctx.beginPath(); ctx.arc(-4, -10, 7, 0.5, Math.PI * 1.7); ctx.lineWidth = 9; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 5; ctx.strokeStyle = L.body; ctx.stroke(); }
  else { rr(ctx, -3, -22, 6.5, 24, 3.2, L.body); if (L.tail === 'striped') { ctx.fillStyle = L.stripes; for (let i = 0; i < 4; i++) ctx.fillRect(-2, -20 + i * 5, 4.5, 2); } }
  ctx.restore();
  // back legs
  const legW = L.kind === 'chi' ? 6 : 8;
  const legs = [[-lx * 0.6, sw * 0.5, true], [lx * 0.55, -sw * 0.5, true], [-lx * 0.45, -sw * 0.5, false], [lx * 0.7, sw * 0.5, false]];
  for (const [x, a, back] of legs.filter(l => l[2])) limb(ctx, x, bodyY + L.h * 0.25, a, legW, L.leg + L.h * 0.25 - 2, shade(L.body, -0.2), 2.5);
  // body
  if (L.chonk) ellipse(ctx, 0, bodyY + 2, lx + 4, L.h / 2 + 3, L.body);
  else rr(ctx, -lx, bodyY - L.h / 2, L.len, L.h, L.h / 2, L.body);
  if (L.fluffy) { ctx.save(); ctx.globalAlpha = 1; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * 8, bodyY + L.h / 2 - 1, 4, 0, Math.PI); ctx.fillStyle = L.body; ctx.fill(); } ctx.restore(); }
  if (L.stripes && !L.fluffy) {
    ctx.save(); ctx.beginPath(); if (L.chonk) ctx.ellipse(0, bodyY + 2, lx + 4, L.h / 2 + 3, 0, 0, 7); else ctx.rect(-lx, bodyY - L.h / 2, L.len, L.h); ctx.clip();
    ctx.strokeStyle = L.stripes; ctx.lineWidth = 3;
    for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * 8, bodyY - L.h); ctx.quadraticCurveTo(i * 8 + 4, bodyY, i * 8 - 2, bodyY + L.h * 0.2); ctx.stroke(); }
    if (L.bib) { ctx.fillStyle = L.bib; ctx.beginPath(); ctx.ellipse(0, bodyY + L.h * 0.55, lx, L.h * 0.35, 0, 0, 7); ctx.fill(); }
    ctx.restore();
    if (L.chonk) ellipse(ctx, 0, bodyY + 2, lx + 4, L.h / 2 + 3, null); else rr(ctx, -lx, bodyY - L.h / 2, L.len, L.h, L.h / 2, null);
  }
  if (L.bib && L.fluffy) ellipse(ctx, lx * 0.62, bodyY + 2, 9, L.h * 0.45, L.bib, 2);
  if (L.chest) ellipse(ctx, lx * 0.7, bodyY + 3, 6, L.h * 0.3, L.chest, 2);
  // front legs
  for (const [x, a] of legs.filter(l => !l[2])) {
    limb(ctx, x, bodyY + L.h * 0.25, a, legW, L.leg + L.h * 0.25 - 2, L.body, 2.5);
    const fx = x - Math.sin(a) * (L.leg + L.h * 0.25 - 2), fy = bodyY + L.h * 0.25 + Math.cos(a) * (L.leg + L.h * 0.25 - 2);
    if (L.paws) ellipse(ctx, fx + 1, fy, 5, 3.5, L.paws, 2);
  }
  // head
  const hr = L.head;
  const hx = lx + hr * 0.25 + atk * 10, hy = bodyY - L.h * 0.45 - hr * 0.35 + (L.kind === 'chi' ? -4 : 0);
  // ears behind
  if (L.kind === 'cat') {
    poly(ctx, [hx - hr * 0.75, hy - hr * 0.35, hx - hr * 0.55, hy - hr * 1.35, hx - hr * 0.05, hy - hr * 0.78], L.body, 2.5);
    poly(ctx, [hx + hr * 0.05, hy - hr * 0.8, hx + hr * 0.6, hy - hr * 1.35, hx + hr * 0.8, hy - hr * 0.3], L.body, 2.5);
    poly(ctx, [hx + hr * 0.2, hy - hr * 0.82, hx + hr * 0.58, hy - hr * 1.15, hx + hr * 0.66, hy - hr * 0.5], '#f0a6ad', 0);
  } else if (L.ears === 'giant') {
    poly(ctx, [hx - hr * 0.8, hy - hr * 0.2, hx - hr * 1.3, hy - hr * 1.9, hx - hr * 0.1, hy - hr * 0.75], L.body, 2.5);
    poly(ctx, [hx + hr * 0.1, hy - hr * 0.8, hx + hr * 0.9, hy - hr * 2.0, hx + hr * 0.9, hy - hr * 0.3], L.body, 2.5);
    poly(ctx, [hx + hr * 0.3, hy - hr * 0.8, hx + hr * 0.82, hy - hr * 1.65, hx + hr * 0.8, hy - hr * 0.55], L.tan || '#f0b6a0', 0);
  }
  circle(ctx, hx, hy, hr, L.body);
  if (L.face) { ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, hr - 1.5, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = L.face; ctx.beginPath(); ctx.ellipse(hx + hr * 0.35, hy + hr * 0.6, hr * 0.75, hr * 0.62, 0, 0, 7); ctx.fill(); if (L.blaze) { ctx.beginPath(); ctx.moveTo(hx + hr * 0.15, hy + hr * 0.3); ctx.lineTo(hx + hr * 0.3, hy - hr); ctx.lineTo(hx + hr * 0.55, hy + hr * 0.3); ctx.fill(); } ctx.restore(); circle(ctx, hx, hy, hr, null); }
  if (L.blaze && !L.face) { ctx.save(); ctx.beginPath(); ctx.arc(hx, hy, hr - 1.5, 0, 7); ctx.clip(); ctx.fillStyle = L.chest; ctx.fillRect(hx + hr * 0.22, hy - hr, hr * 0.22, hr * 1.2); ctx.restore(); }
  if (L.stripes && L.kind === 'cat' && !L.fluffy) { ctx.strokeStyle = L.stripes; ctx.lineWidth = 2; for (let i = -1; i <= 1; i++) line(ctx, hx + i * 4, hy - hr * 0.95, hx + i * 3, hy - hr * 0.55, L.stripes, 2); }
  // muzzle
  if (L.kind === 'dog') {
    ellipse(ctx, hx + hr * 0.85, hy + hr * 0.32, hr * 0.6, hr * 0.42, L.muzzle);
    circle(ctx, hx + hr * 1.35, hy + hr * 0.15, hr * 0.2, '#0b0b0b', 2);
    if (L.muzzleTip) { ctx.save(); ctx.globalAlpha = 0.5; ellipse(ctx, hx + hr * 1.0, hy + hr * 0.5, hr * 0.32, hr * 0.15, L.muzzleTip, 0); ctx.restore(); }
  } else if (L.kind === 'chi') {
    ellipse(ctx, hx + hr * 0.82, hy + hr * 0.35, hr * 0.48, hr * 0.32, L.chest || L.body, 2.5);
    circle(ctx, hx + hr * 1.22, hy + hr * 0.25, hr * 0.15, '#0b0b0b', 1.5);
    if (L.tan) { ellipse(ctx, hx + hr * 0.15, hy - hr * 0.35, 2.5, 1.8, L.tan, 0); ellipse(ctx, hx + hr * 0.62, hy - hr * 0.38, 2.5, 1.8, L.tan, 0); ellipse(ctx, hx + hr * 0.6, hy + hr * 0.62, 3, 2, L.tan, 0); }
  } else {
    poly(ctx, [hx + hr * 0.52, hy + hr * 0.2, hx + hr * 0.72, hy + hr * 0.2, hx + hr * 0.62, hy + hr * 0.32], L.nose || '#f3a3a8', 1.5);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(hx + hr * 0.62, hy + hr * 0.32); ctx.quadraticCurveTo(hx + hr * 0.5, hy + hr * 0.5, hx + hr * 0.4, hy + hr * 0.42); ctx.moveTo(hx + hr * 0.62, hy + hr * 0.32); ctx.quadraticCurveTo(hx + hr * 0.74, hy + hr * 0.5, hx + hr * 0.86, hy + hr * 0.42); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) line(ctx, hx + hr * 0.95, hy + hr * 0.35 + i * 2, hx + hr * 1.5, hy + hr * 0.3 + i * 4, '#ddd', 1);
  }
  // eyes
  const shy = L.shy && (Math.sin(t * 0.7) > 0.4);
  const closed = (t % 3.7) < 0.12 || shy;
  for (const ex of [hx + hr * 0.08, hx + hr * 0.55]) {
    if (closed) { ctx.beginPath(); ctx.arc(ex, hy - hr * 0.1, 3, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = L.face && L.body === '#19181c' ? '#fff' : INK; ctx.stroke(); continue; }
    if (L.kind === 'cat') { ellipse(ctx, ex, hy - hr * 0.1, 3.4, 4.2, L.eye, 1.8); ellipse(ctx, ex + 0.3, hy - hr * 0.1, 1.2, 3.2, '#111', 0); }
    else { circle(ctx, ex, hy - hr * 0.12, 3.6, L.eye, 1.6); circle(ctx, ex + 0.5, hy - hr * 0.12, 2, '#000', 0); }
    circle(ctx, ex - 1, hy - hr * 0.22, 1.1, '#fff', 0);
  }
  if (L.smile || atk > 0.2) { ctx.beginPath(); ctx.arc(hx + hr * 0.9, hy + hr * 0.52, 4, 0.1, Math.PI - 0.1); ctx.closePath(); fillStroke(ctx, '#8a2232', 1.5); ellipse(ctx, hx + hr * 0.9, hy + hr * 0.72, 2, 1.6, '#ff7d8f', 0); }
  // floppy ears in front
  if (L.ears === 'flop') {
    ctx.save(); ctx.translate(hx - hr * 0.72, hy - hr * 0.5); ctx.rotate(0.3 + Math.sin(t * 5) * 0.08); ellipse(ctx, 0, hr * 0.45, hr * 0.28, hr * 0.55, shade(L.body, 0.12)); ctx.restore();
  }
  if (L.kind === 'cat' && L.chonk) { ctx.save(); ctx.globalAlpha = 0.3; ellipse(ctx, hx + hr * 0.7, hy + hr * 0.4, 3, 2, '#ff8c9a', 0); ctx.restore(); }
  if (L.collar) { ctx.save(); rr(ctx, hx - hr * 0.6, hy + hr * 0.72, hr * 1.0, 5, 2, L.collar, 2); ctx.fillStyle = '#d12c3b'; for (let i = 0; i < 3; i++) ctx.fillRect(hx - hr * 0.45 + i * 5, hy + hr * 0.72 + 1.5, 2, 2); circle(ctx, hx - hr * 0.1, hy + hr * 0.72 + 8, 2.5, '#ccc', 1.5); ctx.restore(); }
}

function wolf(ctx, pose) {
  const t = pose.t || 0, bob = Math.sin(t * 3) * 0.6, a = pose.attack || 0;
  shadow(ctx, 0, 0, 24);
  block(ctx, -22, -26 - bob, 6, 18, '#e8e6e6', 2.5);
  for (const x of [-14, -8, 8, 14]) block(ctx, x - 3, -12, 6, 12, x % 2 ? '#d8d6d6' : '#e8e6e6', 2.5);
  block(ctx, -18, -26 - bob, 34, 15, '#e8e6e6', 2.5);
  block(ctx, -4, -30 - bob, 20, 8, '#e8e6e6', 2.5);
  const hx = 14 + a * 8;
  block(ctx, hx, -38 - bob, 18, 16, '#e8e6e6', 2.5);
  block(ctx, hx + 2, -44 - bob, 5, 6, '#e8e6e6', 2); block(ctx, hx + 11, -44 - bob, 5, 6, '#e8e6e6', 2);
  block(ctx, hx + 12, -30 - bob, 9, 7, '#d8d0c6', 2); ctx.fillStyle = '#111'; ctx.fillRect(hx + 17, -30 - bob, 4, 3);
  ctx.fillStyle = '#111'; ctx.fillRect(hx + 5, -34 - bob, 3, 3); ctx.fillRect(hx + 12, -34 - bob, 3, 3);
  block(ctx, hx - 2, -24 - bob, 16, 4, '#d12c3b', 2);
}
function axolotl(ctx, pose) {
  const t = pose.t || 0, bob = Math.sin(t * 3) * 1;
  shadow(ctx, 0, 0, 22);
  ellipse(ctx, -16, -12 - bob, 14, 6, '#ffb3cf', 2.5, -0.3);
  ellipse(ctx, 0, -12 - bob, 18, 10, '#ffb3cf');
  for (const x of [-8, 8]) limb(ctx, x, -6 - bob, 0.3, 5, 6, '#ff9cbf', 2);
  circle(ctx, 18, -18 - bob, 12, '#ffb3cf');
  for (const [dx, dy, r] of [[6, -28, -0.6], [10, -31, -0.2], [26, -28, 0.6], [24, -31, 0.2]]) ellipse(ctx, dx, dy - bob, 3, 6, '#ff5c93', 2, r);
  circle(ctx, 16, -20 - bob, 2.4, '#111', 0); circle(ctx, 24, -20 - bob, 2.4, '#111', 0);
  ctx.beginPath(); ctx.arc(20, -15 - bob, 3, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.8; ctx.strokeStyle = INK; ctx.stroke();
}
function pikachu(ctx, pose) {
  const t = pose.t || 0, bob = Math.abs(Math.sin(t * 3)) * 2, a = pose.attack || 0;
  shadow(ctx, 0, 0, 18);
  ctx.save(); ctx.translate(-14, -20 - bob); ctx.rotate(-0.4);
  poly(ctx, [0, 0, -6, -10, 2, -12, -4, -24, 12, -26, 6, -16, 12, -14, 4, 0], '#ffd83a', 2.5); ctx.restore();
  ellipse(ctx, 0, -16 - bob, 15, 16, '#ffd83a');
  for (const x of [-7, 7]) ellipse(ctx, x, -2, 5, 3, '#ffd83a', 2);
  circle(ctx, 2 + a * 6, -36 - bob, 14, '#ffd83a');
  for (const [x, r] of [[-6, -0.4], [10, 0.4]]) { ctx.save(); ctx.translate(2 + x + a * 6, -48 - bob); ctx.rotate(r); ellipse(ctx, 0, -8, 4.5, 11, '#ffd83a'); ctx.beginPath(); ctx.ellipse(0, -15, 3.5, 4.5, 0, 0, 7); ctx.fillStyle = '#222'; ctx.fill(); ctx.restore(); }
  circle(ctx, -1 + a * 6, -38 - bob, 2.6, '#111', 0); circle(ctx, 9 + a * 6, -38 - bob, 2.6, '#111', 0);
  circle(ctx, 0 + a * 6, -39 - bob, 0.9, '#fff', 0); circle(ctx, 10 + a * 6, -39 - bob, 0.9, '#fff', 0);
  circle(ctx, -6 + a * 6, -31 - bob, 3.4, '#ff4a3d', 1.5); circle(ctx, 14 + a * 6, -31 - bob, 3.4, '#ff4a3d', 1.5);
  ctx.beginPath(); ctx.arc(4 + a * 6, -32 - bob, 2.5, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
  if (a > 0.3) { ctx.strokeStyle = '#fff36b'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-10, -50); ctx.lineTo(-4, -42); ctx.lineTo(-12, -38); ctx.lineTo(-6, -28); ctx.stroke(); }
}
function eevee(ctx, pose) {
  const t = pose.t || 0, bob = Math.abs(Math.sin(t * 3)) * 1.5;
  shadow(ctx, 0, 0, 20);
  ctx.save(); ctx.translate(-16, -18 - bob); ctx.rotate(-0.7 + Math.sin(t * 4) * 0.15); ellipse(ctx, 0, -10, 8, 13, '#9a6a3c'); ellipse(ctx, 0, -20, 5, 5, '#f4e3bd', 0); ctx.restore();
  ellipse(ctx, 0, -14 - bob, 16, 11, '#9a6a3c');
  for (const x of [-9, -3, 7, 12]) limb(ctx, x, -8 - bob, 0, 5, 8, '#9a6a3c', 2);
  ellipse(ctx, 12, -22 - bob, 10, 8, '#f4e3bd', 2.5);
  circle(ctx, 16, -34 - bob, 12, '#9a6a3c');
  for (const [x, r] of [[-2, -0.5], [28, 0.5]]) { ctx.save(); ctx.translate(x + (x > 0 ? -6 : 6), -42 - bob); ctx.rotate(r); ellipse(ctx, 0, -9, 6, 12, '#9a6a3c'); ellipse(ctx, 0, -9, 3, 8, '#4d2f18', 0); ctx.restore(); }
  circle(ctx, 13, -35 - bob, 2.8, '#3a1c0a', 0); circle(ctx, 22, -35 - bob, 2.8, '#3a1c0a', 0); circle(ctx, 14, -36 - bob, 1, '#fff', 0); circle(ctx, 23, -36 - bob, 1, '#fff', 0);
  ctx.beginPath(); ctx.arc(19, -29 - bob, 2.5, 0.2, Math.PI - 0.2); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
}
function charizard(ctx, pose) {
  const t = pose.t || 0, bob = Math.sin(t * 2.5) * 1.5, a = pose.attack || 0;
  shadow(ctx, 0, 0, 26);
  // wings
  const fl = Math.sin(t * 6) * 0.15;
  ctx.save(); ctx.translate(-4, -40 - bob); ctx.rotate(-0.6 + fl); poly(ctx, [0, 0, -30, -26, -24, -10, -36, -6, -20, 4, -28, 12, 0, 8], '#2f6f8a', 2.5); ctx.restore();
  // tail
  ctx.save(); ctx.translate(-16, -14 - bob); ctx.rotate(-0.4); rr(ctx, -16, -5, 20, 9, 4.5, '#f08a2c'); ctx.restore();
  const fx = -30, fy = -22 - bob; const fh = 8 + Math.sin(t * 14) * 2;
  ellipse(ctx, fx, fy - fh * 0.4, 5, fh, '#ff5a1f', 2); ellipse(ctx, fx, fy - fh * 0.2, 2.5, fh * 0.6, '#ffe14a', 0);
  ellipse(ctx, 0, -24 - bob, 16, 20, '#f08a2c');
  ellipse(ctx, 4, -20 - bob, 9, 14, '#ffe0a0', 2);
  for (const x of [-8, 8]) limb(ctx, x, -8 - bob, 0, 8, 8, '#f08a2c', 2.5);
  limb(ctx, 12, -32 - bob, -0.9 - a * 0.6, 6, 12, '#f08a2c', 2.5);
  // head
  const hx = 12 + a * 6, hy = -50 - bob;
  ellipse(ctx, hx, hy, 12, 10, '#f08a2c');
  ellipse(ctx, hx + 9, hy + 3, 8, 6, '#f08a2c', 2.5);
  poly(ctx, [hx - 8, hy - 6, hx - 12, hy - 18, hx - 2, hy - 9], '#f08a2c', 2.5);
  circle(ctx, hx + 4, hy - 2, 2.6, '#2a6fbf', 0); circle(ctx, hx + 4.5, hy - 2, 1.3, '#000', 0);
  if (a > 0.3) { ctx.globalAlpha = a; ellipse(ctx, hx + 26, hy + 4, 14, 5, '#ff7a1f', 0); ellipse(ctx, hx + 22, hy + 4, 7, 3, '#ffe14a', 0); ctx.globalAlpha = 1; }
}

export function drawPet(ctx, id, x, y, s, pose = {}) {
  const key = 'chars/' + id;
  if (sheetReady(key)) { drawAnim(ctx, key, pose.walk != null ? 'run' : (pose.attack > 0.2 ? 'attack' : (pose.hurt > 0.4 ? 'hurt' : 'idle')), x, y, spriteHeight(key) * s, { t: pose.t, facing: pose.facing || 1 }); return; }
  loadSheet(key);
  if (drawSprite(ctx, id, x, y, 44 * s, pose)) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (pose.facing || 1), s);
  if (pose.hurt) ctx.translate(-pose.hurt * 5, 0);
  const L = PET_LOOKS[id];
  if (L) quad(ctx, L, pose);
  else if (id === 'wolf') wolf(ctx, pose);
  else if (id === 'axolotl') axolotl(ctx, pose);
  else if (id === 'pikachu') pikachu(ctx, pose);
  else if (id === 'eevee') eevee(ctx, pose);
  else if (id === 'charizard') charizard(ctx, pose);
  ctx.restore();
}
