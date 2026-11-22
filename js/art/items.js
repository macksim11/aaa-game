import { INK, shade, rr, circle, ellipse, poly, line, block } from './core.js';

const MAT = { wood: '#b07a3e', stone: '#9b9b9b', iron: '#e6e6ea', diamond: '#4fe3e0', netherite: '#4a3f45', gold: '#ffcf33' };

function sword(ctx, mat) {
  const c = MAT[mat];
  // handle
  block(ctx, -2.5, -2, 5, 12, '#6b4423', 2);
  // guard
  block(ctx, -8, -5, 16, 5, mat === 'wood' ? '#7a5228' : shade(c, -0.35), 2);
  // blade (stepped pixel look)
  ctx.beginPath(); ctx.moveTo(-4.5, -5); ctx.lineTo(-4.5, -32); ctx.lineTo(0, -38); ctx.lineTo(4.5, -32); ctx.lineTo(4.5, -5); ctx.closePath();
  ctx.fillStyle = c; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = shade(c, 0.45); ctx.fillRect(-2.5, -32, 2, 26);
  ctx.fillStyle = shade(c, -0.2); ctx.fillRect(1.5, -30, 2, 24);
}
export function drawWeapon(ctx, id, x, y, ang, s = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  switch (id) {
    case 'wood_sword': sword(ctx, 'wood'); break;
    case 'stone_sword': sword(ctx, 'stone'); break;
    case 'iron_sword': sword(ctx, 'iron'); break;
    case 'diamond_sword': sword(ctx, 'diamond'); break;
    case 'netherite_sword': sword(ctx, 'netherite'); break;
    case 'diamond_pick':
      block(ctx, -2.5, -30, 5, 40, '#6b4423', 2);
      ctx.beginPath(); ctx.moveTo(-17, -22); ctx.quadraticCurveTo(0, -38, 17, -22); ctx.lineTo(13, -19); ctx.quadraticCurveTo(0, -30, -13, -19); ctx.closePath();
      ctx.fillStyle = MAT.diamond; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      break;
    case 'hockey_stick':
      block(ctx, -2.5, -36, 5, 44, '#d9a066', 2);
      ctx.fillStyle = '#111'; ctx.fillRect(-2.5, -36, 5, 6);
      poly(ctx, [-2.5, 8, 2.5, 8, 16, 12, 16, 17, -2.5, 15], '#d9a066', 2);
      ctx.fillStyle = '#fff'; ctx.fillRect(4, 10, 8, 4);
      break;
    case 'bo_staff':
      rr(ctx, -2.5, -46, 5, 62, 2.5, '#8a5a2b', 2);
      ctx.fillStyle = '#e0c060'; ctx.fillRect(-2.5, -46, 5, 4); ctx.fillRect(-2.5, 12, 5, 4);
      break;
    case 'nunchucks':
      rr(ctx, -3, -16, 6, 20, 3, '#222', 2);
      ctx.strokeStyle = '#aaa'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(0, -16); ctx.quadraticCurveTo(-8, -24, -6, -30); ctx.stroke();
      ctx.save(); ctx.translate(-6, -30); ctx.rotate(-0.8); rr(ctx, -3, -20, 6, 20, 3, '#222', 2); ctx.restore();
      break;
    default: sword(ctx, 'iron');
  }
  ctx.restore();
}

// icon renderer. key: emoji string, or "px:<id>"
export function drawItemIcon(ctx, key, w, h) {
  if (!key.startsWith('px:')) {
    ctx.font = `${Math.round(h * 0.62)}px "Apple Color Emoji","Segoe UI Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(key, w / 2, h / 2 + 2); return;
  }
  const id = key.slice(3);
  const cx = w / 2, cy = h / 2, s = w / 60;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s);
  const weapons = ['wood_sword', 'stone_sword', 'iron_sword', 'diamond_sword', 'netherite_sword', 'diamond_pick', 'hockey_stick', 'bo_staff', 'nunchucks'];
  if (weapons.includes(id)) {
    const sc = id === 'bo_staff' ? 0.75 : 1;
    drawWeapon(ctx, id, -6, 14, Math.PI / 4, sc);
  } else if (id === 'leather_tunic' || id === 'iron_chest' || id === 'diamond_chest') {
    const c = { leather_tunic: '#a0612e', iron_chest: '#d9d9de', diamond_chest: '#4fe3e0' }[id];
    poly(ctx, [-16, -16, -6, -16, -4, -12, 4, -12, 6, -16, 16, -16, 18, -2, 12, -2, 12, 18, -12, 18, -12, -2, -18, -2], c, 2.5);
    ctx.fillStyle = shade(c, -0.2); ctx.fillRect(-10, 4, 20, 3);
  } else if (id === 'diamond_boots') {
    block(ctx, -16, -8, 10, 18, MAT.diamond, 2.5); block(ctx, -16, 6, 14, 6, MAT.diamond, 2.5);
    block(ctx, 4, -8, 10, 18, MAT.diamond, 2.5); block(ctx, 4, 6, 14, 6, MAT.diamond, 2.5);
  } else if (id === 'ender_pearl') {
    circle(ctx, 0, 0, 14, '#1f7a6e'); circle(ctx, 0, 0, 8, '#2fd1b5', 0); circle(ctx, 0, 0, 3, '#0b3b35', 0); circle(ctx, -5, -5, 2.5, '#bff', 0);
  } else if (id === 'emerald') {
    poly(ctx, [0, -16, 11, -6, 11, 6, 0, 16, -11, 6, -11, -6], '#2fd16a', 2.5); poly(ctx, [0, -9, 5, -3, 5, 3, 0, 9, -5, 3, -5, -3], '#8fffb8', 0);
  } else if (id === 'totem') {
    block(ctx, -8, -16, 16, 14, '#ffcf33', 2.5); block(ctx, -14, -2, 28, 8, '#ffcf33', 2.5); block(ctx, -6, 6, 12, 12, '#ffcf33', 2.5);
    ctx.fillStyle = '#2fd16a'; ctx.fillRect(-5, -10, 3, 3); ctx.fillRect(2, -10, 3, 3);
  }
  ctx.restore();
}
