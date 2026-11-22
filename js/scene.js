import { sleep, GAME } from './util.js';
import { drawBackground, groundY } from './art/backgrounds.js';
import { drawPerson } from './art/people.js';
import { drawPet } from './art/animals.js';
import { drawMob, MOB_HEIGHTS } from './art/mobs.js';
import { drawMount } from './art/mounts.js';
import { INK, circle, ellipse, poly, line, rr, text, shade } from './art/core.js';
import { drawAnim, sheetReady, loadSheet, spriteHeight, bgImage } from './art/sheets.js';

const BG_FILE = { river: 'bg_river', bridge: 'bg_bridge', mountain: 'bg_mountain', metro: 'bg_metro', stadium: 'bg_stadium', school: 'bg_school', waterpark: 'bg_waterpark', laronde: 'bg_laronde', nether: 'bg_nether', tower: 'bg_tower' };

const ease = k => 1 - Math.pow(1 - k, 3);

export class Scene {
  constructor(canvas, theme = 'river') {
    this.c = canvas; this.ctx = canvas.getContext('2d');
    this.theme = theme; this.cam = 0; this.t = 0; this.walking = false; this.walkSpeed = 140;
    this.actors = []; this.fx = []; this.shakeT = 0; this.flashT = 0; this.flashColor = '#fff';
    this.speed = 1; this.running = true; this.overlayDraw = null;
    this.resize(); this._ro = new ResizeObserver(() => this.resize()); this._ro.observe(canvas);
    this.last = performance.now();
    const loop = now => { if (!this.running) return; requestAnimationFrame(loop); const dt = Math.max(0, Math.min(0.05, (now - this.last) / 1000)); this.last = now; try { if (!GAME.paused) this.update(dt); this.draw(); } catch (e) { console.warn('frame skipped', e); } };
    requestAnimationFrame(loop);
  }
  destroy() { this.running = false; this._ro.disconnect(); }
  resize() {
    const r = this.c.getBoundingClientRect(); const dpr = Math.min(2, window.devicePixelRatio || 1);
    this.w = Math.max(1, r.width); this.h = Math.max(1, r.height);
    this.c.width = this.w * dpr; this.c.height = this.h * dpr; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.gy = groundY(this.theme, this.h);
    this.unit = this.h / 330; // scale so Arlo is ~30% of scene height
    this.layout?.();
  }
  get u() { return this.unit; }
  add(a) { a.anim = a.anim || {}; a.alpha = a.alpha ?? 1; a.dx = a.dx || 0; this.actors.push(a); return a; }
  remove(a) { this.actors = this.actors.filter(x => x !== a); }
  clearEnemies() { this.actors = this.actors.filter(a => !a.enemy); }

  update(dt) {
    dt *= this.speed;
    this.t += dt;
    if (this.walking) this.cam += this.walkSpeed * dt * this.u;
    for (const a of this.actors) {
      for (const k of Object.keys(a.anim)) { a.anim[k] = Math.max(0, a.anim[k] - dt * (k === 'attack' ? 3.2 : k === 'hurt' ? 4 : 2.5)); }
      if (a.moveTo != null) { const d = a.moveTo - a.x; const step = Math.sign(d) * Math.min(Math.abs(d), (a.moveSpeed || 260) * this.u * dt); a.x += step; if (Math.abs(d) < 1) { a.x = a.moveTo; a.moveTo = null; a.onArrive?.(); a.onArrive = null; } }
      if (a.fade) { a.alpha = Math.max(0, a.alpha - dt * 2.5); }
      if (a.walkPhase != null && (this.walking || a.moveTo != null)) a.walkPhase += dt * 11;
    }
    this.actors = this.actors.filter(a => !(a.fade && a.alpha <= 0));
    for (const f of this.fx) { f.age += dt; f.update?.(f, dt); }
    this.fx = this.fx.filter(f => f.age < f.life);
    this.shakeT = Math.max(0, this.shakeT - dt);
    this.flashT = Math.max(0, this.flashT - dt);
  }

  draw() {
    const { ctx, w, h } = this;
    ctx.save();
    if (this.shakeT > 0) ctx.translate((Math.random() - 0.5) * 10 * this.shakeT, (Math.random() - 0.5) * 10 * this.shakeT);
    const bg = BG_FILE[this.theme] ? bgImage(BG_FILE[this.theme]) : null;
    if (bg) {
      const bw = bg.naturalWidth * h / bg.naturalHeight; const off = ((this.cam * 0.8) % bw + bw) % bw;
      for (let x = -off; x < w; x += bw) ctx.drawImage(bg, x, 0, bw + 1, h);
      this.gy = h * 0.87;
    } else { drawBackground(ctx, this.theme, w, h, this.cam, this.t); this.gy = groundY(this.theme, h); }
    const sorted = [...this.actors].sort((a, b) => (a.z || 0) - (b.z || 0));
    for (const a of sorted) this.drawActor(a);
    for (const f of this.fx) f.draw(ctx, f);
    ctx.restore();
    if (this.flashT > 0) { ctx.save(); ctx.globalAlpha = this.flashT * 2; ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, w, h); ctx.restore(); }
    this.overlayDraw?.(ctx, w, h, this.t);
  }

  drawActor(a) {
    const { ctx } = this; const u = this.u * (a.scale || 1);
    const att = a.anim.attack || 0;
    const lunge = a.lunge ? Math.sin(Math.min(1, att) * Math.PI) * a.lunge * this.u : 0;
    const x = a.x + lunge * (a.facing || 1) + (a.dx || 0), y = (a.y ?? this.gy) + (a.dy || 0);
    ctx.save(); ctx.globalAlpha = a.alpha;
    const moving = this.walking || a.moveTo != null;
    const pose = { t: this.t + (a.seed || 0), walk: moving && !a.sitting ? a.walkPhase : null, attack: att > 0 ? Math.min(1, att) : 0, hurt: a.anim.hurt || 0, facing: a.facing || 1, crown: a.crown, flash: a.anim.flash || 0, weapon: a.weapon, wave: a.wave, angry: a.angry, shout: a.shout, sad: a.sad, eyesClosed: a.eyesClosed, armUp: a.armUp };
    if (a.anim.hurt > 0.5) ctx.filter = 'brightness(1.8)';
    if (a.frozen) ctx.filter = 'hue-rotate(160deg) saturate(1.6) brightness(1.2)';
    if (a.sheet && sheetReady(a.sheet)) {
      this.drawSprite(a, x, y, pose, moving);
    } else if (a.kind === 'person') {
      if (a.sheet) loadSheet(a.sheet);
      if (a.mount) {
        const seat = drawMount(ctx, a.mount, x, y, this.u * 0.9, { t: this.t, moving, facing: a.facing || 1 });
        drawPerson(ctx, seat.x, seat.y, u, a.look, { ...pose, sit: true, noShadow: true });
      } else drawPerson(ctx, x, y, u, a.look, pose);
    } else if (a.kind === 'pet') drawPet(ctx, a.id, x, y, u, pose);
    else if (a.kind === 'mob') drawMob(ctx, a.art, x, y, u, pose);
    else if (a.kind === 'custom') a.drawFn(ctx, x, y, u, pose, this.t);
    ctx.filter = 'none';
    if (a.frozen) { ctx.globalAlpha = 0.35 * a.alpha; ctx.fillStyle = '#bfefff'; const hh = this.heightOf(a); ctx.fillRect(x - 22 * u, y - hh, 44 * u, hh); ctx.globalAlpha = a.alpha; }
    if (a.stunned) { for (let i = 0; i < 3; i++) { const an = this.t * 4 + i * 2.1; text(ctx, '★', x + Math.cos(an) * 14 * u, y - this.heightOf(a) - 6 + Math.sin(an) * 4, 12 * this.u + 4, '#ffe14a'); } }
    if (a.shield > 0) { ctx.globalAlpha = 0.28 * a.alpha; ellipse(ctx, x, y - this.heightOf(a) / 2, 34 * u, this.heightOf(a) * 0.62, '#9fd8ff', 0); ctx.globalAlpha = 0.7 * a.alpha; ellipse(ctx, x, y - this.heightOf(a) / 2, 34 * u, this.heightOf(a) * 0.62, null, 2); ctx.globalAlpha = a.alpha; }
    if (a.showBar && a.maxHp) this.drawBar(a, x, y);
    if (a.label) text(ctx, a.label, x, y - this.heightOf(a) - 14, 11 + this.u * 3, '#fff');
    ctx.restore();
  }
  // choose the animation for a sprite actor from its state
  spriteAnim(a, moving) {
    if (a.forceAnim) return a.forceAnim;
    if (a.fade || a.dead) return 'down';
    if ((a.anim.hurt || 0) > 0.35) return 'hurt';
    if ((a.anim.attack || 0) > 0.05) return a.attackAnim || 'attack';
    if (a.sad) return 'sad';
    if (a.armUp) return 'victory';
    if (a.wave) return 'wave';
    if (moving && !a.mount) return 'run';
    return a.idleAnim || 'idle';
  }
  drawSprite(a, x, y, pose, moving) {
    const { ctx } = this;
    const h = spriteHeight(a.sheet) * this.u * (a.spriteScale ?? 1);
    const anim = this.spriteAnim(a, moving);
    const att = a.anim.attack || 0, hurt = a.anim.hurt || 0;
    const opts = { t: pose.t, facing: a.kind === 'mob' ? 1 : (a.facing || 1), squash: hurt * 0.12, flash: hurt > 0.6 ? 0.5 : (a.anim.flash || 0) * 0.6,
      lean: att ? -0.08 * Math.sin(Math.min(1, att) * Math.PI) * (a.kind === 'mob' ? -1 : 1) : 0, frame: (anim === 'attack' || anim === 'punch' || anim === 'kick' || anim === 'special') ? 0 : null,
      filter: a.frozen ? 'hue-rotate(160deg) saturate(1.6) brightness(1.2)' : null };
    const rideKey = a.mount ? `rides/${a.mount}` : null;
    if (rideKey && sheetReady(rideKey)) {
      const rh = spriteHeight(rideKey) * this.u;
      const charging = (a.anim.attack || 0) > 0.05;
      drawAnim(ctx, rideKey, charging ? 'charge' : 'ride', x, y - (moving ? Math.abs(Math.sin(pose.t * 9)) * 2 * this.u : 0), rh, { ...opts, frame: charging ? 0 : (moving ? null : 0), lean: 0 });
    } else if (a.mount) {
      if (rideKey) loadSheet(rideKey);
      const seat = drawMount(ctx, a.mount, x, y, this.u * 0.9, { t: this.t, moving, facing: a.facing || 1 });
      drawAnim(ctx, a.sheet, anim === 'run' ? 'idle' : anim, seat.x + 4 * this.u, seat.y + h * 0.3, h * 0.92, { ...opts, noShadow: true });
    } else {
      const hop = anim === 'run' ? Math.abs(Math.sin(pose.t * 11)) * 3 * this.u : 0;
      drawAnim(ctx, a.sheet, anim, x, y - hop, h, { ...opts, weapon: a.kind === 'person' ? a.weapon : null });
    }
    if (a.crown && a.kind === 'mob' && !a.boss) { text(ctx, '👑', x, y - h - 8, 16 * this.u, '#fff', 'center', null); }
  }
  drawBar(a, x, y) {
    const { ctx } = this; const bw = 54 * this.u + 10, bh = 7;
    const by = y + 8;
    rr(ctx, x - bw / 2, by, bw, bh, 3, '#2a1a10', 2);
    const k = Math.max(0, a.hp / a.maxHp);
    if (k > 0) { ctx.fillStyle = a.enemy ? '#e0263f' : '#4fc13a'; ctx.fillRect(x - bw / 2 + 1.5, by + 1.5, (bw - 3) * k, bh - 3); }
    if (a.shield > 0) { ctx.fillStyle = 'rgba(160,215,255,.9)'; ctx.fillRect(x - bw / 2 + 1.5, by + 1.5, (bw - 3) * Math.min(1, a.shield / a.maxHp), bh - 3); }
    text(ctx, fmtShort(Math.max(0, a.hp)), x, by + bh + 7, 10, '#fff');
  }
  heightOf(a) {
    if (a.sheet && sheetReady(a.sheet)) return spriteHeight(a.sheet) * this.u * (a.spriteScale ?? 1) * (a.mount ? 1.2 : 1);
    const u = this.u * (a.scale || 1);
    if (a.kind === 'person') return (a.mount ? 95 : (a.look.height > 1.3 ? 150 : a.look.height > 1 ? 112 : 100)) * u;
    if (a.kind === 'pet') return 42 * u;
    if (a.kind === 'mob') return (MOB_HEIGHTS[a.art] || 72) * u;
    return 80 * u;
  }
  center(a) { return { x: a.x + (a.dx || 0), y: (a.y ?? this.gy) - this.heightOf(a) * 0.55 }; }

  // ---------- effects ----------
  shake(s = 0.4) { this.shakeT = Math.max(this.shakeT, s); }
  flash(c = '#fff', s = 0.25) { this.flashColor = c; this.flashT = s; }
  floatText(x, y, str, color = '#fff', size = 18, big = false) {
    const sz = size * (0.8 + this.u * 0.25);
    this.fx.push({ age: 0, life: 0.95, x: x + (Math.random() - 0.5) * 16, y, draw: (ctx, f) => {
      const k = f.age / f.life; const yy = f.y - ease(Math.min(1, k * 1.4)) * 36;
      ctx.save(); ctx.globalAlpha = 1 - Math.max(0, (k - 0.6) / 0.4);
      const sc = big ? 1 + Math.max(0, 0.4 - k) * 2 : 1;
      text(ctx, str, f.x, yy, sz * sc, color); ctx.restore();
    } });
  }
  sparks(x, y, color = '#fff', n = 8, spd = 140) {
    const parts = Array.from({ length: n }, () => ({ a: Math.random() * Math.PI * 2, v: spd * (0.5 + Math.random()) }));
    this.fx.push({ age: 0, life: 0.4, draw: (ctx, f) => {
      const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k; ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const p of parts) { const d = p.v * f.age, d2 = d * 0.55; ctx.beginPath(); ctx.moveTo(x + Math.cos(p.a) * d2, y + Math.sin(p.a) * d2); ctx.lineTo(x + Math.cos(p.a) * d, y + Math.sin(p.a) * d); ctx.stroke(); }
      ctx.restore();
    } });
  }
  hitStar(x, y, crit) {
    const s = crit ? 22 : 14;
    this.fx.push({ age: 0, life: 0.22, draw: (ctx, f) => {
      const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(x, y); ctx.rotate(k);
      const pts = []; for (let i = 0; i < 16; i++) { const r = i % 2 ? s * 0.4 : s * (1 + k * 0.5); pts.push(Math.cos(i * Math.PI / 8) * r, Math.sin(i * Math.PI / 8) * r); }
      poly(ctx, pts, crit ? '#ffd23a' : '#fff', 2); ctx.restore();
    } });
  }
  healFx(a) {
    const c = this.center(a);
    for (let i = 0; i < 6; i++) this.fx.push({ age: -i * 0.05, life: 0.8, x: c.x + (Math.random() - 0.5) * 40, draw: (ctx, f) => { if (f.age < 0) return; const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k; text(ctx, '+', f.x, c.y + 20 - k * 50, 18, '#5cff6a'); ctx.restore(); } });
  }
  explosion(x, y, r = 50) {
    this.shake(0.5);
    this.fx.push({ age: 0, life: 0.5, draw: (ctx, f) => {
      const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k;
      circle(ctx, x, y, r * this.u * (0.4 + k), '#ffcf33', 0); circle(ctx, x, y, r * this.u * (0.25 + k * 0.7), '#ff7a1f', 0); circle(ctx, x, y, r * this.u * k * 0.6, '#fff8d0', 0);
      ctx.restore();
    } });
    this.sparks(x, y, '#ff9a1f', 12, 220);
  }
  lightning(x, y) {
    const pts = []; let yy = 0; while (yy < y) { pts.push([x + (Math.random() - 0.5) * 24, yy]); yy += 18; } pts.push([x, y]);
    this.fx.push({ age: 0, life: 0.3, draw: (ctx, f) => {
      const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k;
      for (const [lw, col] of [[8, '#7a5cff'], [3.5, '#fff8a0']]) { ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)); ctx.lineWidth = lw; ctx.strokeStyle = col; ctx.stroke(); }
      ctx.restore();
    } });
    this.sparks(x, y, '#fff8a0', 6, 120);
  }
  // projectile from (x1,y1) to (x2,y2). returns promise resolved on hit
  projectile(kind, x1, y1, x2, y2, dur = 0.35, arc = 0) {
    return new Promise(res => {
      const draws = {
        star: (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 20); poly(ctx, [0, -10, 3, -3, 10, 0, 3, 3, 0, 10, -3, 3, -10, 0, -3, -3], '#cfd6e6', 2); circle(ctx, 0, 0, 2, '#556', 0); ctx.restore(); },
        ball: (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 14); circle(ctx, 0, 0, 9, '#fff', 2.5); poly(ctx, [0, -4, 4, -1, 2, 4, -2, 4, -4, -1], '#222', 0); ctx.restore(); },
        fire: (ctx, x, y) => { circle(ctx, x, y, 12, '#ff7a1f', 2); circle(ctx, x - 2, y - 2, 6, '#ffe14a', 0); },
        arrow: (ctx, x, y, t, ang) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); line(ctx, -14, 0, 10, 0, '#8a5a2b', 3); poly(ctx, [10, -4, 16, 0, 10, 4], '#ccc', 1.5); ctx.restore(); },
        orb: (ctx, x, y, t) => { ctx.save(); ctx.globalAlpha = 0.5; circle(ctx, x, y, 16, '#ffb020', 0); ctx.restore(); circle(ctx, x, y, 9, '#ff9a1f', 2); },
        toast: (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 10); rr(ctx, -9, -10, 18, 20, 5, '#3a2210'); ctx.restore(); },
        tnt: (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 6); ctx.beginPath(); ctx.rect(-10, -10, 20, 20); ctx.fillStyle = '#d33'; ctx.fill(); ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke(); ctx.fillStyle = '#fff'; ctx.fillRect(-10, -3, 20, 6); ctx.fillStyle = '#000'; ctx.font = 'bold 6px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('TNT', 0, 2); ctx.restore(); },
        kragle: (ctx, x, y, t) => { ctx.save(); ctx.globalAlpha = 0.85; ellipse(ctx, x, y, 14, 9, '#e6ffe0', 2); ctx.restore(); },
        bubble: (ctx, x, y) => { ctx.save(); ctx.globalAlpha = 0.6; circle(ctx, x, y, 10, '#bff', 2); ctx.restore(); },
        swift: (ctx, x, y, t) => { ctx.save(); ctx.translate(x, y); ctx.rotate(t * 8); poly(ctx, [0, -9, 2.5, -3, 9, -3, 4, 1.5, 6, 8, 0, 4, -6, 8, -4, 1.5, -9, -3, -2.5, -3], '#ffe14a', 2); ctx.restore(); },
        paw: (ctx, x, y) => { circle(ctx, x, y, 7, '#fff', 2); },
      };
      const d = draws[kind] || draws.star;
      const ang = Math.atan2(y2 - y1, x2 - x1);
      this.fx.push({ age: 0, life: dur / Math.max(0.2, this.speed) * this.speed, done: false, draw: (ctx, f) => {
        const k = Math.min(1, f.age / f.life);
        const x = x1 + (x2 - x1) * k, y = y1 + (y2 - y1) * k - Math.sin(k * Math.PI) * arc;
        d(ctx, x, y, f.age, ang);
      }, update: (f) => { if (!f.done && f.age >= f.life * 0.98) { f.done = true; res(); } } });
      sleep((dur * 1000) / this.speed + 400).then(res);
    });
  }
  beam(x1, y1, x2, y2, color = '#38f3e6', dur = 0.4) {
    this.fx.push({ age: 0, life: dur, draw: (ctx, f) => { const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k; line(ctx, x1, y1, x2, y2, color, 14 * (1 - k) + 2); line(ctx, x1, y1, x2, y2, '#fff', 4 * (1 - k) + 1); ctx.restore(); } });
  }
  ring(x, y, color = '#38f3e6') {
    this.fx.push({ age: 0, life: 0.6, draw: (ctx, f) => { const k = f.age / f.life; ctx.save(); ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.arc(x, y, 10 + k * 120, 0, 7); ctx.lineWidth = 6; ctx.strokeStyle = color; ctx.stroke(); ctx.restore(); } });
  }
  bigText(str, color = '#fff', life = 1.2) {
    this.fx.push({ age: 0, life, draw: (ctx, f) => {
      const k = f.age / f.life; const sc = k < 0.15 ? k / 0.15 : 1;
      ctx.save(); ctx.globalAlpha = k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1; ctx.translate(this.w / 2, this.h * 0.35); ctx.scale(sc, sc);
      text(ctx, str, 0, 0, 30 + this.u * 6, color); ctx.restore();
    } });
  }
}
function fmtShort(n) { n = Math.round(n); if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M'; if (n >= 1e4) return (n / 1e3).toFixed(1) + 'K'; return String(n); }
