import { el, sleep } from '../util.js';
import { sfx, playMusic } from '../audio.js';
import { circle, rr, line, text, poly, INK } from '../art/core.js';

// A small real-physics pinball table. Resolves with the final score.
export function playPinball({ title = 'Pinball!', seconds = 35, balls = 3 } = {}) {
  return new Promise(resolve => {
    playMusic('battle');
    const canvas = el('canvas');
    const scoreEl = el('span', {}, '0'), timeEl = el('span', {}, seconds + 's'), ballsEl = el('span', {}, '●'.repeat(balls));
    const left = el('button', { class: 'btn purple' }, '◀ FLIP'), right = el('button', { class: 'btn purple' }, 'FLIP ▶');
    const root = el('div', { class: 'pinball' },
      el('div', { class: 'pin-bar' }, el('span', {}, title), el('span', {}, '⭐ ', scoreEl), el('span', {}, ballsEl), el('span', {}, '⏱ ', timeEl)),
      canvas, el('div', { class: 'pin-ctrl' }, left, right));
    document.getElementById('overlay').append(root);
    const ctx = canvas.getContext('2d');
    let W = 300, H = 500, S = 1;
    function resize() {
      const r = canvas.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      S = Math.min(r.width / W, r.height / H);
      ctx.setTransform(dpr * S, 0, 0, dpr * S, dpr * (r.width - W * S) / 2, dpr * (r.height - H * S) / 2);
    }
    // table geometry in a 300x500 space
    const walls = [
      [20, 480, 20, 90], [20, 90, 70, 30], [70, 30, 230, 30], [230, 30, 280, 90], [280, 90, 280, 480],
      [20, 380, 95, 440], [280, 380, 205, 440],
      [60, 300, 60, 340], [240, 300, 240, 340],
    ];
    const bumpers = [{ x: 110, y: 140, r: 20, c: '#ff5a7a', p: 100 }, { x: 190, y: 140, r: 20, c: '#3ad19a', p: 100 }, { x: 150, y: 200, r: 22, c: '#ffcf33', p: 150 }, { x: 80, y: 230, r: 14, c: '#7b3fe4', p: 250 }, { x: 220, y: 230, r: 14, c: '#7b3fe4', p: 250 }];
    const targets = [{ x: 105, y: 60, w: 24, h: 8, hit: 0 }, { x: 140, y: 52, w: 24, h: 8, hit: 0 }, { x: 175, y: 60, w: 24, h: 8, hit: 0 }];
    const fl = [{ px: 95, py: 440, len: 50, side: 1, ang: 0.45, up: false }, { px: 205, py: 440, len: 50, side: -1, ang: 0.45, up: false }];
    let ball = null, score = 0, left_ = balls, time = seconds, over = false, flashes = [];
    const newBall = () => { ball = { x: 150 + (Math.random() - 0.5) * 60, y: 70, vx: (Math.random() - 0.5) * 200, vy: 50, r: 8 }; };
    newBall();
    const set = (i, v) => { if (fl[i].up !== v && v) sfx('flipper'); fl[i].up = v; };
    const bind = (b, i) => { b.addEventListener('pointerdown', e => { e.preventDefault(); set(i, true); }); b.addEventListener('pointerup', () => set(i, false)); b.addEventListener('pointerleave', () => set(i, false)); };
    bind(left, 0); bind(right, 1);
    canvas.addEventListener('pointerdown', e => { const r = canvas.getBoundingClientRect(); set(e.clientX < r.left + r.width / 2 ? 0 : 1, true); });
    canvas.addEventListener('pointerup', () => { set(0, false); set(1, false); });
    const keys = e => { const d = e.type === 'keydown'; if (e.key === 'ArrowLeft' || e.key === 'z') set(0, d); if (e.key === 'ArrowRight' || e.key === '/' || e.key === 'm') set(1, d); };
    addEventListener('keydown', keys); addEventListener('keyup', keys);
    const flEnd = f => { const a = f.side === 1 ? f.ang : Math.PI - f.ang; return [f.px + Math.cos(a) * f.len, f.py + Math.sin(a) * f.len]; };

    function collideSeg(x1, y1, x2, y2, bounce = 0.75, extra = null) {
      const dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
      let k = ((ball.x - x1) * dx + (ball.y - y1) * dy) / L2; k = Math.max(0, Math.min(1, k));
      const cx = x1 + dx * k, cy = y1 + dy * k; let nx = ball.x - cx, ny = ball.y - cy; const d = Math.hypot(nx, ny);
      if (d < ball.r && d > 0) {
        nx /= d; ny /= d; ball.x = cx + nx * ball.r; ball.y = cy + ny * ball.r;
        const vn = ball.vx * nx + ball.vy * ny;
        if (vn < 0) { ball.vx -= (1 + bounce) * vn * nx; ball.vy -= (1 + bounce) * vn * ny; }
        if (extra) extra(nx, ny, k);
        return true;
      }
      return false;
    }
    let last = performance.now();
    const timer = setInterval(() => { if (over) return; time--; timeEl.textContent = time + 's'; if (time <= 0) end(); }, 1000);
    function end() { if (over) return; over = true; clearInterval(timer); removeEventListener('keydown', keys); removeEventListener('keyup', keys); sfx('win'); setTimeout(() => { root.remove(); resolve(score); }, 1200); }
    function addScore(p, x, y) { score += p; scoreEl.textContent = score; flashes.push({ x, y, t: 0, s: '+' + p }); }
    function step(dt) {
      for (const f of fl) { const target = f.up ? -0.5 : 0.45; const prev = f.ang; f.ang += Math.sign(target - f.ang) * Math.min(Math.abs(target - f.ang), dt * 18); f.w = (f.ang - prev) / dt; }
      if (!ball) return;
      ball.vy += 520 * dt; ball.x += ball.vx * dt; ball.y += ball.vy * dt;
      const sp = Math.hypot(ball.vx, ball.vy); if (sp > 900) { ball.vx *= 900 / sp; ball.vy *= 900 / sp; }
      for (const w of walls) collideSeg(...w, 0.6);
      for (const b of bumpers) { const dx = ball.x - b.x, dy = ball.y - b.y, d = Math.hypot(dx, dy); if (d < b.r + ball.r) { const nx = dx / d, ny = dy / d; ball.x = b.x + nx * (b.r + ball.r); ball.y = b.y + ny * (b.r + ball.r); ball.vx = nx * 480; ball.vy = ny * 480; b.lit = 0.2; sfx('bumper'); addScore(b.p, b.x, b.y - b.r); } }
      for (const t of targets) { if (ball.x > t.x - 4 && ball.x < t.x + t.w + 4 && ball.y > t.y - 6 && ball.y < t.y + t.h + 6 && !t.hit) { t.hit = 1; ball.vy = Math.abs(ball.vy) * 0.8; sfx('coin'); addScore(300, t.x + t.w / 2, t.y); if (targets.every(q => q.hit)) { addScore(2000, 150, 90); targets.forEach(q => q.hit = 0); sfx('levelup'); } } }
      for (const f of fl) {
        const [ex, ey] = flEnd(f);
        collideSeg(f.px, f.py, ex, ey, 0.4, (nx, ny, k) => { if (f.up && Math.abs(f.w) > 0.5) { const boost = 280 + 520 * k; ball.vx += nx * boost * 0.6 + (f.side === 1 ? 60 : -60); ball.vy += ny * boost; } });
      }
      if (ball.y > H + 20) { left_--; ballsEl.textContent = '●'.repeat(Math.max(0, left_)); sfx('bad'); if (left_ <= 0) { ball = null; end(); } else newBall(); }
    }
    function draw() {
      ctx.save(); ctx.fillStyle = '#12091f'; ctx.fillRect(-500, -500, 2000, 2000);
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#3a1f6e'); g.addColorStop(1, '#1a0f38');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(20, 480); ctx.lineTo(20, 90); ctx.lineTo(70, 30); ctx.lineTo(230, 30); ctx.lineTo(280, 90); ctx.lineTo(280, 480); ctx.fill();
      text(ctx, 'ARLO', 150, 300, 34, 'rgba(255,255,255,.12)', 'center', null);
      text(ctx, 'ABSOLUTE CINEMA', 150, 330, 12, 'rgba(255,255,255,.12)', 'center', null);
      for (const w of walls) { line(ctx, w[0], w[1], w[2], w[3], INK, 8); line(ctx, w[0], w[1], w[2], w[3], '#c9b8ff', 4); }
      for (const b of bumpers) { b.lit = Math.max(0, (b.lit || 0) - 0.016); circle(ctx, b.x, b.y, b.r + (b.lit ? 4 : 0), b.lit ? '#fff' : b.c, 3); circle(ctx, b.x, b.y, b.r * 0.5, 'rgba(255,255,255,.4)', 0); }
      for (const t of targets) rr(ctx, t.x, t.y, t.w, t.h, 3, t.hit ? '#555' : '#ffcf33', 2);
      for (const f of fl) { const [ex, ey] = flEnd(f); line(ctx, f.px, f.py, ex, ey, INK, 14); line(ctx, f.px, f.py, ex, ey, '#ff5a7a', 9); circle(ctx, f.px, f.py, 6, '#fff', 2); }
      if (ball) { circle(ctx, ball.x, ball.y, ball.r, '#e8e8f0', 2.5); circle(ctx, ball.x - 3, ball.y - 3, 2.5, '#fff', 0); }
      flashes = flashes.filter(f => (f.t += 0.016) < 0.8);
      for (const f of flashes) { ctx.globalAlpha = 1 - f.t / 0.8; text(ctx, f.s, f.x, f.y - f.t * 40, 16, '#ffe14a'); ctx.globalAlpha = 1; }
      if (over) text(ctx, `SCORE ${score}`, 150, 250, 32, '#ffe14a');
      ctx.restore();
    }
    const loop = now => { if (!root.isConnected) return; const dt = Math.min(0.033, (now - last) / 1000); last = now; for (let i = 0; i < 4; i++) step(dt / 4); draw(); requestAnimationFrame(loop); };
    requestAnimationFrame(() => { resize(); requestAnimationFrame(loop); });
    new ResizeObserver(resize).observe(canvas);
  });
}
