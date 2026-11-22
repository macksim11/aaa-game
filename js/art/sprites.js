// Optional image sprites. Put PNGs (transparent background, character facing RIGHT,
// feet at the bottom edge) in /sprites and list them in sprites/manifest.json, e.g.
//   { "arlo": "arlo.png", "mom": "mom.png", "twyla": "twyla.png" }
// Any character listed here is drawn from the image instead of the built-in drawing.
export const SPRITES = {};
fetch('sprites/manifest.json').then(r => r.ok ? r.json() : {}).then(list => {
  for (const [id, file] of Object.entries(list || {})) { const img = new Image(); img.src = 'sprites/' + file; SPRITES[id] = img; }
}).catch(() => {});

// Draw a sprite with simple code animation: idle breathing, walk bounce, punch lunge, hurt squash.
export function drawSprite(ctx, id, x, y, heightPx, pose = {}) {
  const img = SPRITES[id]; if (!img || !img.complete || !img.naturalWidth) return false;
  const t = pose.t || 0, atk = pose.attack || 0, hurt = pose.hurt || 0;
  const walk = pose.walk;
  const bob = walk != null ? Math.abs(Math.sin(walk)) * heightPx * 0.04 : 0;
  const breathe = walk == null ? Math.sin(t * 2.6) * 0.02 : 0;
  const sq = hurt ? 1 - hurt * 0.12 : 1;
  const w = heightPx * img.naturalWidth / img.naturalHeight;
  ctx.save(); ctx.translate(x - hurt * 8, y - bob); ctx.scale((pose.facing || 1) * (1 + (1 - sq) * 0.5), 1);
  ctx.rotate(atk ? -0.12 * atk : (walk != null ? Math.sin(walk) * 0.05 : 0));
  ctx.scale(1 - breathe, sq * (1 + breathe));
  ctx.globalAlpha *= 0.22; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.35, w * 0.08, 0, 0, 7); ctx.fill(); ctx.globalAlpha /= 0.22;
  ctx.drawImage(img, -w / 2 + atk * w * 0.2, -heightPx, w, heightPx);
  ctx.restore();
  return true;
}
