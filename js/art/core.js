export const INK = '#2b1d14';

export function shade(hex, amt) {
  // amt -1..1 : negative darkens, positive lightens
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const n = parseInt(c, 16);
  let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  if (amt < 0) { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  else { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}
export function rrPath(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
export function fillStroke(ctx, fill, lw = 3, stroke = INK) {
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
}
export function rr(ctx, x, y, w, h, r, fill, lw = 3) { rrPath(ctx, x, y, w, h, r); fillStroke(ctx, fill, lw); }
export function circle(ctx, x, y, r, fill, lw = 3) { ctx.beginPath(); ctx.arc(x, y, Math.max(0.1, r), 0, Math.PI * 2); fillStroke(ctx, fill, lw); }
export function ellipse(ctx, x, y, rx, ry, fill, lw = 3, rot = 0) { ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, Math.PI * 2); fillStroke(ctx, fill, lw); }
export function poly(ctx, pts, fill, lw = 3) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); fillStroke(ctx, fill, lw);
}
export function line(ctx, x1, y1, x2, y2, color = INK, lw = 3) {
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineCap = 'round'; ctx.stroke();
}
// a limb hanging from (x,y) rotated by angle (0 = straight down)
export function limb(ctx, x, y, ang, w, len, fill, lw = 3) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); rr(ctx, -w / 2, -w / 2, w, len + w / 2, w / 2, fill, lw); ctx.restore();
}
// blocky (Minecraft) cube with simple top shading
export function block(ctx, x, y, w, h, fill, lw = 3) {
  ctx.beginPath(); ctx.rect(x, y, w, h); fillStroke(ctx, fill, lw);
}
export function shadow(ctx, x, y, w) {
  ctx.save(); ctx.globalAlpha = 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(x, y, w, w * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
export function text(ctx, s, x, y, size, fill = '#fff', align = 'center', stroke = INK, font = 'Lilita One, Fredoka, sans-serif') {
  ctx.font = `${size}px ${font}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineWidth = Math.max(3, size / 6); ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = fill; ctx.fillText(s, x, y);
}
// render something into an offscreen canvas (for icons/avatars)
export function toCanvas(w, h, drawFn, dpr = Math.min(2, window.devicePixelRatio || 1)) {
  const c = document.createElement('canvas'); c.width = w * dpr; c.height = h * dpr;
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr); drawFn(ctx, w, h); return c;
}
// simple pixel-art from a list of rows and a palette
export function pixels(ctx, x, y, size, rows, pal) {
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < rows[r].length; c++) {
    const ch = rows[r][c]; if (ch === '.' || ch === ' ') continue;
    ctx.fillStyle = pal[ch]; ctx.fillRect(x + c * size, y + r * size, size + 0.5, size + 0.5);
  }
}
