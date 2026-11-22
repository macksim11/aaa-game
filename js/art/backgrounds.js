import { INK, shade, rr, circle, ellipse, poly, line, block, text } from './core.js';

const hash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };

function sky(ctx, w, h, top, bot) { const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, top); g.addColorStop(1, bot); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
function repeat(ctx, w, cam, k, tileW, fn) {
  const off = cam * k; const start = Math.floor(off / tileW) - 1, end = Math.ceil((off + w) / tileW) + 1;
  for (let i = start; i <= end; i++) fn(i * tileW - off, i);
}
function clouds(ctx, w, h, cam, t, color = '#fff') {
  ctx.save(); ctx.globalAlpha = 0.9;
  repeat(ctx, w, cam + t * 8, 0.08, 260, (x, i) => {
    const y = 20 + hash(i) * h * 0.18, s = 0.7 + hash(i + 5) * 0.6;
    ctx.fillStyle = color;
    for (const [dx, dy, r] of [[0, 0, 18], [20, -8, 22], [42, 0, 17], [20, 6, 18]]) { ctx.beginPath(); ctx.arc(x + dx * s, y + dy * s, r * s, 0, 7); ctx.fill(); }
  });
  ctx.restore();
}
function tree(ctx, x, gy, s, leaf, trunk = '#7a5230') {
  block(ctx, x - 4 * s, gy - 26 * s, 8 * s, 26 * s, trunk, 2.5);
  ctx.lineWidth = 5; ctx.strokeStyle = INK;
  const puffs = [[0, -44, 22], [-16, -32, 16], [16, -32, 16], [0, -60, 16]];
  for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(x + dx * s, gy + dy * s, r * s, 0, 7); ctx.stroke(); }
  ctx.fillStyle = leaf; for (const [dx, dy, r] of puffs) { ctx.beginPath(); ctx.arc(x + dx * s, gy + dy * s, r * s, 0, 7); ctx.fill(); }
  ctx.fillStyle = shade(leaf, 0.2); ctx.beginPath(); ctx.arc(x - 6 * s, gy - 52 * s, 7 * s, 0, 7); ctx.fill();
}
function house(ctx, x, gy, s, wall, roof, i) {
  const w = 90 * s, hh = 56 * s;
  block(ctx, x, gy - hh, w, hh, wall, 2.5);
  poly(ctx, [x - 8 * s, gy - hh, x + w / 2, gy - hh - 34 * s, x + w + 8 * s, gy - hh], roof, 2.5);
  rr(ctx, x + w * 0.62, gy - 34 * s, 18 * s, 34 * s, 3, shade(roof, -0.1), 2);
  for (const wx of [x + 10 * s, x + 32 * s]) { block(ctx, wx, gy - 42 * s, 16 * s, 14 * s, '#bfe8ff', 2); line(ctx, wx + 8 * s, gy - 42 * s, wx + 8 * s, gy - 28 * s, INK, 1.5); }
}
function ground(ctx, w, h, gy, top, body, cam, stripe) {
  ctx.fillStyle = body; ctx.fillRect(0, gy, w, h - gy);
  ctx.fillStyle = top; ctx.fillRect(0, gy - 4, w, 10);
  line(ctx, 0, gy - 4, w, gy - 4, INK, 3);
  if (stripe) { ctx.fillStyle = stripe; repeat(ctx, w, cam, 1, 60, x => ctx.fillRect(x, gy + (h - gy) * 0.45, 30, 4)); }
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#000'; repeat(ctx, w, cam, 1, 37, (x, i) => { ctx.fillRect(x + hash(i) * 20, gy + 8 + hash(i + 3) * (h - gy - 12), 6, 3); }); ctx.restore();
}
function grassStrip(ctx, w, y, cam, c) {
  ctx.fillStyle = c; ctx.fillRect(0, y, w, 10);
  repeat(ctx, w, cam, 1, 14, (x, i) => { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 4, y - 6 - hash(i) * 4); ctx.lineTo(x + 8, y); ctx.fill(); });
}
function fence(ctx, w, gy, cam, c = '#c9864a') {
  repeat(ctx, w, cam, 0.9, 26, x => { block(ctx, x, gy - 30, 8, 30, c, 2); });
  ctx.fillStyle = c; ctx.fillRect(0, gy - 24, w, 5); ctx.fillRect(0, gy - 13, w, 5);
}

const THEMES = {
  river(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#6cc6f2', '#c8f0ff'); clouds(ctx, w, h, cam, t);
    const gy = h * 0.76;
    // far bank (Île-Bizard)
    ctx.fillStyle = '#3f8a4a'; repeat(ctx, w, cam, 0.15, 50, (x, i) => { ctx.beginPath(); ctx.arc(x + 25, h * 0.42, 26 + hash(i) * 14, Math.PI, 0); ctx.fill(); });
    ctx.fillRect(0, h * 0.42, w, 10);
    // river
    ctx.fillStyle = '#3d9be0'; ctx.fillRect(0, h * 0.44, w, h * 0.16);
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#d6f2ff'; repeat(ctx, w, cam + t * 15, 0.3, 70, (x, i) => ctx.fillRect(x, h * 0.47 + hash(i) * h * 0.1, 22, 2.5)); ctx.restore();
    // near bank trees + houses
    grassStrip(ctx, w, h * 0.6, cam * 0.5, '#5cb84a');
    ctx.fillStyle = '#6cc957'; ctx.fillRect(0, h * 0.6 + 8, w, gy - h * 0.6);
    repeat(ctx, w, cam, 0.55, 170, (x, i) => {
      const k = hash(i);
      if (k < 0.45) house(ctx, x + 20, gy - 18, 0.55, ['#f1e3c0', '#d7e6f2', '#f6d0c0', '#e0d7f2'][i & 3], ['#b04a3a', '#3a5a8a', '#5a4a3a', '#6a3a8a'][(i >> 1) & 3], i);
      else tree(ctx, x + 60, gy - 14, 0.75 + k * 0.3, k > 0.7 ? '#4fae3d' : '#3f9a3a');
    });
    fence(ctx, w, gy, cam);
    ground(ctx, w, h, gy, '#e8d29a', '#d9be7e', cam);
  },
  bridge(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#7ccff5', '#e0f6ff'); clouds(ctx, w, h, cam, t);
    const gy = h * 0.76;
    ctx.fillStyle = '#3a8048'; repeat(ctx, w, cam, 0.12, 60, (x, i) => { ctx.beginPath(); ctx.arc(x + 30, h * 0.5, 30 + hash(i) * 10, Math.PI, 0); ctx.fill(); });
    ctx.fillStyle = '#3d9be0'; ctx.fillRect(0, h * 0.5, w, gy - h * 0.5);
    ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#d6f2ff'; repeat(ctx, w, cam + t * 15, 0.4, 60, (x, i) => ctx.fillRect(x, h * 0.53 + hash(i) * (gy - h * 0.55), 20, 2.5)); ctx.restore();
    // the bridge: arches and railing
    repeat(ctx, w, cam, 0.5, 140, (x, i) => {
      block(ctx, x + 60, h * 0.36, 20, gy - h * 0.36, '#a9a39a', 2.5);
      ctx.beginPath(); ctx.moveTo(x - 10, h * 0.36); ctx.quadraticCurveTo(x + 70, h * 0.2, x + 150, h * 0.36); ctx.lineWidth = 7; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#d0453a'; ctx.stroke();
    });
    block(ctx, -4, h * 0.34, w + 8, 12, '#8d877e', 2.5);
    repeat(ctx, w, cam, 1, 24, x => block(ctx, x, gy - 28, 5, 28, '#777', 1.5));
    ctx.fillStyle = '#888'; ctx.fillRect(0, gy - 30, w, 5); line(ctx, 0, gy - 30, w, gy - 30, INK, 2);
    ground(ctx, w, h, gy, '#9a9a9a', '#7d7d82', cam, '#f2d23a');
  },
  mountain(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#89c4f0', '#f6e1c4'); clouds(ctx, w, h, cam, t);
    const gy = h * 0.78;
    const mx = w * 0.6 - cam * 0.05;
    ctx.fillStyle = '#5a7a5a'; ctx.beginPath(); ctx.moveTo(mx - 260, h * 0.62); ctx.quadraticCurveTo(mx, h * 0.12, mx + 260, h * 0.62); ctx.fill();
    // the cross on Mount Royal (glowing purple — President Business took it)
    const cx = mx, cy = h * 0.2; const g = 0.6 + Math.sin(t * 3) * 0.3;
    ctx.save(); ctx.globalAlpha = g * 0.4; ctx.fillStyle = '#c070ff'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 7); ctx.fill(); ctx.restore();
    block(ctx, cx - 3, cy - 22, 6, 34, '#e7c3ff', 2); block(ctx, cx - 12, cy - 12, 24, 5, '#e7c3ff', 2);
    repeat(ctx, w, cam, 0.35, 70, (x, i) => tree(ctx, x + 30, h * 0.66, 0.55, ['#e07b2a', '#d14a2a', '#e8b52a', '#8a9a2a'][i & 3], '#6a4a2a'));
    repeat(ctx, w, cam, 0.7, 110, (x, i) => { if (hash(i) > 0.3) tree(ctx, x + 40, gy - 8, 0.85 + hash(i + 1) * 0.3, ['#e8812e', '#d9502e', '#f0c030', '#c0392b'][i & 3], '#6a4a2a'); });
    ground(ctx, w, h, gy, '#a77a4a', '#8a6038', cam);
  },
  metro(ctx, w, h, cam, t) {
    ctx.fillStyle = '#2a2a33'; ctx.fillRect(0, 0, w, h);
    const gy = h * 0.76;
    // tiled wall
    ctx.fillStyle = '#c9c4b5'; ctx.fillRect(0, h * 0.12, w, gy - h * 0.12);
    ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1;
    repeat(ctx, w, cam, 0.6, 18, x => { ctx.beginPath(); ctx.moveTo(x, h * 0.12); ctx.lineTo(x, gy); ctx.stroke(); });
    for (let y = h * 0.12; y < gy; y += 14) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = '#f08a1f'; ctx.fillRect(0, h * 0.42, w, 14); // orange line!
    line(ctx, 0, h * 0.42, w, h * 0.42, INK, 2); line(ctx, 0, h * 0.42 + 14, w, h * 0.42 + 14, INK, 2);
    repeat(ctx, w, cam, 0.6, 300, (x, i) => {
      rr(ctx, x + 40, h * 0.2, 120, 34, 6, '#1a4fa0'); text(ctx, ['BERRI-UQAM', 'MONT-ROYAL', 'JEAN-TALON', 'SNOWDON', 'LIONEL-GROULX'][((i % 5) + 5) % 5], x + 100, h * 0.2 + 17, 13, '#fff', 'center', null);
    });
    // lights
    repeat(ctx, w, cam, 0.6, 120, x => { ctx.save(); ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.moveTo(x + 50, h * 0.12); ctx.lineTo(x + 20, gy); ctx.lineTo(x + 80, gy); ctx.fill(); ctx.restore(); rr(ctx, x + 40, h * 0.1, 20, 8, 3, '#fff6c0', 2); });
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, w, h * 0.12);
    ground(ctx, w, h, gy, '#e8c840', '#55555e', cam);
  },
  stadium(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#ff9a6a', '#ffe0a0');
    clouds(ctx, w, h, cam, t, '#ffd9c0');
    const gy = h * 0.78; const sx = w * 0.55 - cam * 0.06;
    ctx.fillStyle = '#b9b2a6'; ctx.beginPath(); ctx.ellipse(sx, h * 0.6, 170, 40, 0, Math.PI, 0); ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.save(); ctx.translate(sx + 120, h * 0.6); ctx.rotate(-0.55); block(ctx, -10, -150, 22, 150, '#cfc8ba', 3); block(ctx, -16, -165, 34, 22, '#cfc8ba', 3); ctx.restore();
    ctx.strokeStyle = 'rgba(80,60,40,.4)'; for (let i = 0; i < 8; i++) { ctx.beginPath(); ctx.ellipse(sx, h * 0.6, 170 - i * 8, 40 - i * 3, 0, Math.PI, 0); ctx.stroke(); }
    repeat(ctx, w, cam, 0.5, 90, (x, i) => { block(ctx, x + 40, h * 0.46, 5, gy - h * 0.46, '#666', 2); rr(ctx, x + 32, h * 0.44, 22, 8, 3, '#fff6a0', 2); });
    ground(ctx, w, h, gy, '#bdbdbd', '#8e8e94', cam, '#fff');
  },
  school(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#6cc6f2', '#d8f4ff'); clouds(ctx, w, h, cam, t);
    const gy = h * 0.78;
    repeat(ctx, w, cam, 0.45, 420, (x, i) => {
      block(ctx, x, h * 0.32, 380, gy - h * 0.32 - 30, '#b35a3e', 3);
      for (let r = 0; r < 2; r++) for (let c = 0; c < 7; c++) block(ctx, x + 18 + c * 52, h * 0.37 + r * 42, 30, 26, '#bfe8ff', 2);
      rr(ctx, x + 120, h * 0.26, 140, 26, 6, '#2b3a8a'); text(ctx, 'TERRY FOX', x + 190, h * 0.26 + 13, 16, '#fff', 'center', null);
    });
    ctx.fillStyle = '#5cb84a'; ctx.fillRect(0, gy - 32, w, 32);
    repeat(ctx, w, cam, 0.9, 500, x => { ctx.lineWidth = 4; ctx.strokeStyle = INK; ctx.strokeRect(x + 200, gy - 60, 70, 50); ctx.lineWidth = 2.5; ctx.strokeStyle = '#fff'; ctx.strokeRect(x + 200, gy - 60, 70, 50); });
    ground(ctx, w, h, gy, '#e0e0d8', '#c4c0b6', cam);
  },
  waterpark(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#4ec3ff', '#c6f2ff'); clouds(ctx, w, h, cam, t);
    const gy = h * 0.78;
    repeat(ctx, w, cam, 0.35, 220, (x, i) => {
      const c = ['#ff5a7a', '#ffcf33', '#3ad19a', '#8a5aff'][i & 3];
      block(ctx, x + 20, h * 0.2, 10, gy - h * 0.2, '#ddd', 2); block(ctx, x + 120, h * 0.3, 10, gy - h * 0.3, '#ddd', 2);
      ctx.beginPath(); ctx.moveTo(x + 25, h * 0.2); ctx.bezierCurveTo(x + 180, h * 0.25, x - 20, h * 0.45, x + 160, h * 0.62); ctx.lineWidth = 16; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 11; ctx.strokeStyle = c; ctx.stroke();
    });
    ctx.fillStyle = '#41c8f0'; ctx.fillRect(0, h * 0.64, w, gy - h * 0.64 - 6);
    ctx.save(); ctx.globalAlpha = 0.6; ctx.fillStyle = '#fff'; repeat(ctx, w, cam + t * 20, 0.8, 40, (x, i) => ctx.fillRect(x, h * 0.66 + hash(i) * 12, 16, 3)); ctx.restore();
    ground(ctx, w, h, gy, '#f6e7c8', '#e8d4ae', cam);
  },
  laronde(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#5a1030', '#ff6a3a');
    const gy = h * 0.78;
    const fx = w * 0.7 - cam * 0.08, fy = h * 0.35;
    ctx.save(); ctx.translate(fx, fy); ctx.rotate(t * 0.2); ctx.lineWidth = 3; ctx.strokeStyle = '#2a0a14';
    ctx.beginPath(); ctx.arc(0, 0, 70, 0, 7); ctx.stroke(); for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(i * 0.52) * 70, Math.sin(i * 0.52) * 70); ctx.stroke(); ctx.fillStyle = ['#ff3a3a', '#ffcf33'][i % 2]; ctx.fillRect(Math.cos(i * 0.52) * 70 - 5, Math.sin(i * 0.52) * 70 - 4, 10, 8); }
    ctx.restore();
    repeat(ctx, w, cam, 0.3, 200, (x) => { ctx.beginPath(); ctx.moveTo(x, h * 0.6); ctx.quadraticCurveTo(x + 50, h * 0.2, x + 100, h * 0.5); ctx.quadraticCurveTo(x + 150, h * 0.7, x + 200, h * 0.6); ctx.lineWidth = 5; ctx.strokeStyle = '#2a0a14'; ctx.stroke(); for (let k = 0; k < 8; k++) line(ctx, x + k * 25, h * 0.6, x + k * 25, gy, '#2a0a14', 2); });
    ground(ctx, w, h, gy, '#a8302a', '#6e1a1a', cam);
    ctx.fillStyle = '#ff8a1f'; repeat(ctx, w, cam, 1, 160, (x, i) => { if (hash(i) > 0.5) { rr(ctx, x, gy + 14, 60, 10, 5, '#ff8a1f', 2); } });
  },
  nether(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#2a0606', '#7a1a10');
    const gy = h * 0.78;
    repeat(ctx, w, cam, 0.2, 90, (x, i) => { ctx.fillStyle = '#ff7a1f'; ctx.globalAlpha = 0.8; ctx.fillRect(x + hash(i) * 60, 0, 10, h * 0.65); ctx.globalAlpha = 1; });
    repeat(ctx, w, cam, 0.5, 240, (x, i) => {
      block(ctx, x, h * 0.3, 200, gy - h * 0.3, '#3a1418', 3);
      for (let r = 0; r < 6; r++) for (let c = 0; c < 10; c++) { ctx.strokeStyle = 'rgba(0,0,0,.35)'; ctx.lineWidth = 1; ctx.strokeRect(x + c * 20 + (r % 2) * 10, h * 0.3 + r * 16, 20, 16); }
      block(ctx, x + 80, gy - 60, 40, 60, '#14060a', 2.5);
    });
    ground(ctx, w, h, gy, '#8a2a24', '#5a1414', cam);
  },
  tower(ctx, w, h, cam, t) {
    sky(ctx, w, h, '#0e0a2a', '#3a2a6a');
    ctx.fillStyle = '#fff'; for (let i = 0; i < 30; i++) ctx.fillRect(hash(i) * w, hash(i + 9) * h * 0.4, 2, 2);
    const gy = h * 0.78;
    repeat(ctx, w, cam, 0.2, 70, (x, i) => { const bh = 60 + hash(i) * 120; ctx.fillStyle = '#1e1840'; ctx.fillRect(x, gy - bh - 30, 60, bh + 30); ctx.fillStyle = '#ffd86a'; for (let k = 0; k < 10; k++) if (hash(i * 7 + k) > 0.5) ctx.fillRect(x + 6 + (k % 3) * 18, gy - bh - 20 + Math.floor(k / 3) * 18, 8, 8); });
    const tx = w * 0.5 - cam * 0.08;
    block(ctx, tx - 50, h * 0.02, 100, gy, '#3a3a58', 3);
    rr(ctx, tx - 58, h * 0.04, 116, 26, 6, '#c22'); text(ctx, 'BUSINESS', tx, h * 0.04 + 13, 16, '#fff', 'center', null);
    for (let r = 0; r < 12; r++) for (let c = 0; c < 4; c++) block(ctx, tx - 40 + c * 22, h * 0.12 + r * 20, 12, 12, (r + c) % 3 ? '#ffd86a' : '#555', 1);
    ground(ctx, w, h, gy, '#55555e', '#38383f', cam, '#f2d23a');
  },
};
export function drawBackground(ctx, theme, w, h, cam, t) { (THEMES[theme] || THEMES.river)(ctx, w, h, cam, t); return h * (theme === 'mountain' || theme === 'school' || theme === 'stadium' || theme === 'waterpark' || theme === 'laronde' || theme === 'nether' || theme === 'tower' ? 0.78 : 0.76); }
export function groundY(theme, h) { return h * (['river', 'bridge', 'metro'].includes(theme) ? 0.76 : 0.78); }
export { tree, house, sky, clouds };
