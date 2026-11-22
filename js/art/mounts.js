import { INK, shade, rr, circle, ellipse, poly, line, limb, block, shadow } from './core.js';

function wheel(ctx, x, y, r, t, spin = true) {
  circle(ctx, x, y, r, '#26222c'); circle(ctx, x, y, r * 0.55, '#c9c9d2', 2);
  if (spin) { const a = t * 10; line(ctx, x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, x - Math.cos(a) * r * 0.5, y - Math.sin(a) * r * 0.5, INK, 1.5); }
}

// Each returns {seatX, seatY} in local units where Arlo sits (hip position)
const MOUNTS = {
  bike(ctx, t, moving) {
    shadow(ctx, 0, 0, 30);
    wheel(ctx, -20, -12, 12, moving ? t : 0); wheel(ctx, 22, -12, 12, moving ? t : 0);
    ctx.lineWidth = 6; ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(-20, -12); ctx.lineTo(-4, -30); ctx.lineTo(16, -30); ctx.lineTo(22, -12); ctx.moveTo(-4, -30); ctx.lineTo(2, -12); ctx.lineTo(-20, -12); ctx.moveTo(16, -30); ctx.lineTo(14, -40); ctx.stroke();
    ctx.lineWidth = 3.5; ctx.strokeStyle = '#8a3ff0'; ctx.stroke();
    rr(ctx, -10, -36, 14, 5, 2.5, '#222', 2); line(ctx, 10, -42, 20, -40, INK, 4);
    return { seatX: -6, seatY: -34 };
  },
  ebike(ctx, t, moving) {
    const r = MOUNTS.bike(ctx, t, moving);
    rr(ctx, -4, -28, 16, 9, 3, '#2fd1b5', 2); ctx.fillStyle = '#fff36b'; poly(ctx, [4, -27, 1, -23, 4, -23, 2, -20, 8, -25, 5, -25, 7, -27], '#fff36b', 1);
    if (moving && Math.sin(t * 20) > 0.6) { line(ctx, -32, -10, -40, -14, '#fff36b', 2); }
    return r;
  },
  horse(ctx, t, moving) {
    const k = moving ? Math.sin(t * 10) * 0.4 : 0;
    shadow(ctx, 0, 0, 34);
    for (const [x, a] of [[-20, k], [-12, -k], [14, -k], [22, k]]) limb(ctx, x, -30, a, 8, 28, x === -12 || x === 14 ? '#6b4423' : '#7d5230', 2.5);
    block(ctx, -28, -48, 58, 22, '#8b5a33', 3);
    block(ctx, -36, -46, 9, 20, '#3a2414', 2.5);
    block(ctx, 22, -72, 14, 28, '#8b5a33', 3);
    block(ctx, 28, -76, 22, 14, '#8b5a33', 3);
    block(ctx, 18, -78, 6, 26, '#3a2414', 2);
    ctx.fillStyle = '#111'; ctx.fillRect(38, -72, 4, 4);
    block(ctx, -10, -52, 22, 6, '#5a2a10', 2);
    return { seatX: -2, seatY: -50 };
  },
  hippo(ctx, t, moving) {
    const k = moving ? Math.sin(t * 8) * 0.3 : 0;
    shadow(ctx, 0, 0, 34);
    for (const [x, a] of [[-18, k], [16, -k], [-10, -k], [24, k]]) limb(ctx, x, -22, a, 11, 18, '#8e7fa6', 2.5);
    ellipse(ctx, 0, -32, 34, 20, '#a596bf');
    ellipse(ctx, 34, -38, 16, 15, '#a596bf');
    ellipse(ctx, 44, -32, 12, 10, '#b9abd2', 2.5);
    circle(ctx, 30, -48, 4, '#a596bf', 2); circle(ctx, 40, -46, 3.5, '#fff', 1.5); circle(ctx, 41, -46, 1.8, '#111', 0);
    circle(ctx, 50, -34, 1.6, '#4a3a5a', 0); circle(ctx, 45, -33, 1.6, '#4a3a5a', 0);
    ctx.save(); ctx.globalAlpha = 0.35; ellipse(ctx, 36, -30, 4, 2.5, '#ff7a9a', 0); ctx.restore();
    return { seatX: -6, seatY: -50 };
  },
  pig(ctx, t, moving) {
    const k = moving ? Math.sin(t * 10) * 0.4 : 0;
    shadow(ctx, 0, 0, 28);
    for (const [x, a] of [[-16, k], [-8, -k], [10, -k], [18, k]]) block(ctx, x - 4 + a * 4, -16, 8, 16, '#f0a0a8', 2.5);
    block(ctx, -24, -38, 48, 24, '#f5b0b8', 3);
    block(ctx, 20, -46, 22, 22, '#f5b0b8', 3);
    block(ctx, 36, -38, 10, 9, '#e88a96', 2.5); ctx.fillStyle = '#8a3a4a'; ctx.fillRect(38, -35, 2, 3); ctx.fillRect(42, -35, 2, 3);
    ctx.fillStyle = '#111'; ctx.fillRect(28, -42, 4, 4);
    block(ctx, -10, -42, 22, 6, '#6b4423', 2); block(ctx, -6, -36, 3, 14, '#6b4423', 0);
    return { seatX: 0, seatY: -42 };
  },
  camel(ctx, t, moving) {
    const k = moving ? Math.sin(t * 8) * 0.4 : 0;
    shadow(ctx, 0, 0, 30);
    for (const [x, a] of [[-16, k], [-8, -k], [12, -k], [20, k]]) block(ctx, x - 3 + a * 5, -32, 7, 32, '#d1a866', 2.5);
    block(ctx, -24, -54, 50, 24, '#ddb575', 3);
    block(ctx, -14, -66, 14, 14, '#ddb575', 2.5); block(ctx, 6, -64, 14, 12, '#ddb575', 2.5);
    block(ctx, 22, -82, 10, 34, '#ddb575', 2.5); block(ctx, 26, -88, 20, 12, '#ddb575', 2.5);
    ctx.fillStyle = '#111'; ctx.fillRect(36, -85, 3, 3);
    block(ctx, -6, -60, 14, 6, '#a0312a', 2);
    return { seatX: 0, seatY: -62 };
  },
  chicken(ctx, t, moving) {
    const k = moving ? Math.sin(t * 14) * 0.5 : 0;
    shadow(ctx, 0, 0, 22);
    limb(ctx, -4, -14, k, 3, 14, '#f0b020', 2); limb(ctx, 6, -14, -k, 3, 14, '#f0b020', 2);
    block(ctx, -18, -38, 32, 24, '#fafafa', 3);
    block(ctx, -22, -34, 8, 14, '#eee', 2.5);
    block(ctx, 8, -56, 16, 22, '#fafafa', 3);
    block(ctx, 22, -48, 8, 5, '#f0b020', 2); block(ctx, 14, -42, 6, 8, '#e02a2a', 2);
    ctx.fillStyle = '#111'; ctx.fillRect(16, -52, 3, 3);
    const fl = moving ? Math.sin(t * 20) * 4 : 0; block(ctx, -8, -34 - fl, 16, 10, '#e8e8e8', 2);
    return { seatX: -2, seatY: -36 };
  },
  golfcart(ctx, t, moving) {
    shadow(ctx, 0, 0, 40);
    wheel(ctx, -26, -11, 11, moving ? t : 0); wheel(ctx, 28, -11, 11, moving ? t : 0);
    rr(ctx, -40, -34, 80, 22, 8, '#f4f4ee');
    rr(ctx, 22, -42, 20, 12, 4, '#f4f4ee', 2.5);
    line(ctx, -32, -34, -30, -80, INK, 5); line(ctx, -32, -34, -30, -80, '#bbb', 2.5);
    line(ctx, 24, -40, 18, -80, INK, 5); line(ctx, 24, -40, 18, -80, '#bbb', 2.5);
    rr(ctx, -42, -86, 70, 8, 4, '#5ab05a');
    rr(ctx, -20, -42, 26, 10, 4, '#3a6fbf', 2.5);
    circle(ctx, 40, -30, 4, '#ffe070', 2);
    line(ctx, 16, -44, 20, -56, INK, 3); ellipse(ctx, 20, -57, 6, 2, '#222', 2);
    return { seatX: -8, seatY: -40 };
  },
  car(ctx, t, moving) {
    shadow(ctx, 0, 0, 46);
    const b = moving ? Math.abs(Math.sin(t * 12)) * 1 : 0;
    wheel(ctx, -30, -12, 13, moving ? t : 0); wheel(ctx, 32, -12, 13, moving ? t : 0);
    ctx.save(); ctx.translate(0, -b);
    ctx.beginPath(); ctx.moveTo(-50, -20); ctx.lineTo(-48, -36); ctx.quadraticCurveTo(-30, -42, -18, -42); ctx.lineTo(10, -42); ctx.quadraticCurveTo(40, -42, 52, -30); ctx.lineTo(52, -18); ctx.quadraticCurveTo(0, -12, -50, -20); ctx.closePath();
    ctx.fillStyle = '#8a3ff0'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#b07bff'; ctx.fillRect(-44, -34, 92, 4);
    line(ctx, 8, -42, 18, -56, INK, 4); line(ctx, 8, -42, 18, -56, '#bfe9ff', 2);
    ellipse(ctx, 48, -32, 4, 3, '#fff6a0', 2); rr(ctx, -52, -32, 5, 6, 2, '#ff3a3a', 2);
    circle(ctx, 14, -46, 6, INK, 0); circle(ctx, 14, -46, 4.5, '#444', 0);
    ctx.font = 'bold 9px Fredoka'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('ARLO', 30, -24);
    ctx.restore();
    return { seatX: -8, seatY: -38 - b };
  },
};

export function drawMount(ctx, id, x, y, s, pose = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s * (pose.facing || 1), s);
  const fn = MOUNTS[id];
  const r = fn ? fn(ctx, pose.t || 0, !!pose.moving) : { seatX: 0, seatY: 0 };
  ctx.restore();
  return { x: x + r.seatX * s * (pose.facing || 1), y: y + r.seatY * s };
}
