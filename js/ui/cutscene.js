import { el, sleep } from '../util.js';
import { S } from '../state.js';
import { drawPerson, arloLook } from '../art/people.js';
import { drawMob } from '../art/mobs.js';
import { drawPet } from '../art/animals.js';
import { drawBackground, house, tree, sky } from '../art/backgrounds.js';
import { FAMILY } from '../data/family.js';
import { INK, rr, circle, ellipse, poly, line, block, text, shade } from '../art/core.js';
import { sfx, playMusic } from '../audio.js';

const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k));

function legoWorld(ctx, w, h, t) {
  sky(ctx, w, h, '#ffd23a', '#ff8a3d');
  const gy = h * 0.78;
  const cols = ['#e0263f', '#2f7fe0', '#2fbf4a', '#ffcf33', '#ff7ac8'];
  for (let i = 0; i < 9; i++) { const bx = (i * 90 + 20) % (w + 60) - 30, bh = 60 + (i * 37) % 90; block(ctx, bx, gy - bh, 60, bh, cols[i % 5], 3); for (let k = 0; k < 3; k++) rr(ctx, bx + 6 + k * 18, gy - bh - 6, 12, 7, 2, cols[i % 5], 2); }
  ctx.fillStyle = '#2fbf4a'; ctx.fillRect(0, gy, w, h - gy); line(ctx, 0, gy, w, gy, INK, 3);
  for (let x = 6; x < w; x += 22) { circle(ctx, x, gy + 12, 6, '#3ad15a', 2); circle(ctx, x + 11, gy + 34, 6, '#3ad15a', 2); }
}
function portal(ctx, x, y, r, t) {
  for (let i = 0; i < 6; i++) { ctx.save(); ctx.globalAlpha = 0.5; ctx.beginPath(); ctx.ellipse(x, y, r * (1 - i * 0.14), r * 1.5 * (1 - i * 0.14), t * (i % 2 ? 2 : -2), 0, Math.PI * 2); ctx.fillStyle = ['#7b3fe4', '#c070ff', '#3a1f8a'][i % 3]; ctx.fill(); ctx.restore(); }
}
function montreal(ctx, w, h, t, night = false) {
  sky(ctx, w, h, night ? '#1d1240' : '#6cc6f2', night ? '#6a3a8a' : '#d8f4ff');
  const gy = h * 0.78;
  // skyline with Mount Royal and the cross
  ctx.fillStyle = night ? '#2c2050' : '#5a7a5a'; ctx.beginPath(); ctx.moveTo(-20, gy); ctx.quadraticCurveTo(w * 0.25, h * 0.25, w * 0.6, gy); ctx.fill();
  block(ctx, w * 0.24, h * 0.3, 4, 26, '#fff', 1.5); block(ctx, w * 0.24 - 7, h * 0.3 + 6, 18, 4, '#fff', 1.5);
  const bs = [[0.45, 120], [0.53, 160], [0.6, 100], [0.68, 190], [0.76, 140], [0.84, 110], [0.92, 170]];
  for (const [bx, bh] of bs) { block(ctx, w * bx, gy - bh, w * 0.07, bh, night ? '#3a3060' : '#8aa0c0', 2.5); ctx.fillStyle = night ? '#ffd86a' : '#cfe8ff'; for (let k = 0; k < bh / 20; k++) ctx.fillRect(w * bx + 6, gy - bh + 8 + k * 20, w * 0.07 - 12, 6); }
  ctx.fillStyle = night ? '#2a2040' : '#6a6a72'; ctx.fillRect(0, gy, w, h - gy); line(ctx, 0, gy, w, gy, INK, 3);
}
function riverHome(ctx, w, h, t, gone = false) {
  drawBackground(ctx, 'river', w, h, 0, t);
  const gy = h * 0.76;
  if (!gone) {
    // Arlo's house, big
    const x = w * 0.45, s = 1.25;
    block(ctx, x, gy - 80 * s, 120 * s, 80 * s, '#dfe8f2', 3);
    poly(ctx, [x - 12, gy - 80 * s, x + 60 * s, gy - 130 * s, x + 120 * s + 12, gy - 80 * s], '#4a3a6a', 3);
    rr(ctx, x + 80 * s, gy - 46 * s, 22 * s, 46 * s, 3, '#7b3fe4', 2.5);
    for (const wx of [x + 12 * s, x + 44 * s]) { block(ctx, wx, gy - 62 * s, 24 * s, 20 * s, '#ffe9a0', 2); }
  } else {
    ctx.fillStyle = '#a08060'; ctx.beginPath(); ctx.ellipse(w * 0.62, gy + 6, 90, 12, 0, 0, Math.PI * 2); ctx.fill();
  }
}
function note(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 2) * 0.05);
  rr(ctx, -40 * s, -26 * s, 80 * s, 52 * s, 3, '#fffbe8', 2.5);
  ctx.strokeStyle = '#999'; ctx.lineWidth = 1; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-32 * s, -14 * s + i * 10 * s); ctx.lineTo(32 * s, -14 * s + i * 10 * s); ctx.stroke(); }
  rr(ctx, 22 * s, -30 * s, 14 * s, 10 * s, 2, '#ffd22e', 1.5);
  ctx.restore();
}

export function playIntro(onDone) {
  playMusic('story');
  const belt = '#f4f4f4';
  const arlo = () => arloLook(S, belt);
  const scenes = [
    { speaker: '', text: 'Far, far away, in a world made entirely of LEGO bricks...', draw(ctx, w, h, t) {
      legoWorld(ctx, w, h, t); const gy = h * 0.78;
      drawMob(ctx, 'micro_manager', w * 0.2, gy, h / 300, { t, facing: 1 }); drawMob(ctx, 'micro_manager', w * 0.82, gy, h / 300, { t: t + 1, facing: -1 });
      drawMob(ctx, 'president_business', w * 0.5, gy, h / 260, { t, facing: 1 });
    } },
    { speaker: 'President Business', text: '"This LEGO world is too SMALL for me! I need a REAL city to glue in place with my KRAGLE!"', draw(ctx, w, h, t) {
      legoWorld(ctx, w, h, t); const gy = h * 0.78;
      portal(ctx, w * 0.75, gy - h * 0.25, h * 0.14, t);
      const x = lerp(w * 0.35, w * 0.72, (t - 1.5) / 2);
      drawMob(ctx, 'president_business', x, gy, h / 260 * (t > 3.2 ? Math.max(0.1, 1 - (t - 3.2)) : 1), { t, facing: 1, attack: Math.sin(t * 3) > 0.5 ? 1 : 0 });
      if (t > 0.3 && t < 1.5) sfxOnce('dragon', this);
    } },
    { speaker: '', text: 'President Business escaped the LEGO world... and landed right in the middle of MONTREAL!', draw(ctx, w, h, t) {
      montreal(ctx, w, h, t); const gy = h * 0.78;
      portal(ctx, w * 0.3, gy - h * 0.25, h * 0.12 * Math.max(0, 1 - t / 3), t);
      const k = Math.min(1, t / 0.8);
      drawMob(ctx, 'president_business', w * 0.35, lerp(gy - h * 0.3, gy, k), h / 250, { t, facing: 1 });
      if (k >= 1) text(ctx, 'MWAHAHA!', w * 0.62, h * 0.3, 22 + h * 0.03, '#fff');
    } },
    { speaker: 'Malgosha', text: '"My lord... the Orb of Dominance shows me someone who could ruin everything. A boy. His name is... ARLO."', draw(ctx, w, h, t) {
      montreal(ctx, w, h, t, true); const gy = h * 0.78;
      drawMob(ctx, 'malgosha', w * 0.3, gy, h / 260, { t, facing: 1, attack: 0.6 });
      // vision in the orb
      const ox = w * 0.66, oy = h * 0.36, r = h * 0.2;
      ctx.save(); ctx.globalAlpha = 0.85; circle(ctx, ox, oy, r, '#ffb020', 4); ctx.beginPath(); ctx.arc(ox, oy, r - 4, 0, 7); ctx.clip();
      ctx.fillStyle = '#ffdc8a'; ctx.fillRect(ox - r, oy - r, r * 2, r * 2);
      drawPerson(ctx, ox, oy + r * 0.75, r / 85, arlo(), { t, attack: Math.max(0, Math.sin(t * 3)) });
      ctx.restore();
      ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 4) * 0.15; circle(ctx, ox, oy, r + 10, '#ffb020', 0); ctx.restore();
    } },
    { speaker: 'President Business', text: '"A KID?! Ha! Minions! Go to his house. Take his family. Take his pets. Take his HOUSE! Then he\'ll have NOTHING!"', draw(ctx, w, h, t) {
      montreal(ctx, w, h, t, true); const gy = h * 0.78;
      drawMob(ctx, 'ghast', w * 0.78, gy - h * 0.1, h / 520, { t, facing: -1 });
      const army = ['zombie', 'skeleton', 'creeper', 'bad_cop', 'toasty', 'spider', 'enderman', 'pillager'];
      army.forEach((a, i) => drawMob(ctx, a, w * (0.42 + (i % 4) * 0.13) + Math.sin(t * 6 + i) * 2, gy + (i >= 4 ? 0 : -14), h / 330, { t: t + i, facing: -1 }));
      drawMob(ctx, 'president_business', w * 0.18, gy, h / 240, { t, facing: 1, attack: Math.sin(t * 4) > 0 ? 0.8 : 0 });
    } },
    { speaker: '', text: 'Meanwhile, by the Rivière des Prairies in Pierrefonds... Arlo REALLY had to go pee. So he ran way down to the river, behind the big bushes.', draw(ctx, w, h, t) {
      riverHome(ctx, w, h, t); const gy = h * 0.76;
      drawPerson(ctx, w * 0.12, gy, h / 330, arlo(), { t, facing: -1 });
      // big bush in front of Arlo
      for (const [dx, dy, r] of [[0, -20, 32], [-26, -10, 24], [26, -10, 24], [0, -44, 22]]) circle(ctx, w * 0.12 + dx * h / 330, gy + dy * h / 330, r * h / 330, '#3f9a3a', 3);
      text(ctx, '♪ ♫', w * 0.2, h * 0.3 + Math.sin(t * 3) * 4, 16, '#fff');
    } },
    { speaker: '', text: 'While he was gone, the minions stormed the house! ZAP! The Kragle-ray shrank the WHOLE house into a tiny LEGO house!', draw(ctx, w, h, t) {
      const gone = t > 2.2;
      riverHome(ctx, w, h, t, gone); const gy = h * 0.76;
      if (!gone) { ctx.save(); ctx.globalAlpha = Math.min(1, t / 1.5) * (0.5 + Math.sin(t * 20) * 0.3); ctx.fillStyle = '#e6ffe0'; ctx.fillRect(w * 0.4, 0, w * 0.6, gy); ctx.restore(); }
      if (gone) {
        const k = Math.min(1, (t - 2.2) / 2);
        const lx = lerp(w * 0.62, w * 1.2, k);
        block(ctx, lx - 18, gy - 60 - 20, 36, 22, '#dfe8f2', 2.5); poly(ctx, [lx - 22, gy - 80, lx, gy - 96, lx + 22, gy - 80], '#4a3a6a', 2.5);
        drawMob(ctx, 'micro_manager', lx, gy, h / 330, { t, facing: 1 });
        // family & pets in a cage being dragged
        const cx = lerp(w * 0.5, w * 1.3, k);
        rr(ctx, cx - 60, gy - 80, 120, 78, 6, 'rgba(255,255,255,.05)', 3);
        ['mom', 'papa', 'alyzee', 'eveah', 'emery'].forEach((id, i) => drawPerson(ctx, cx - 44 + i * 22, gy - 4, h / 900 * (id === 'emery' ? 0.95 : 1.05), FAMILY[id].look, { t: t + i, sad: true }));
        for (let i = 0; i < 7; i++) line(ctx, cx - 60 + i * 20, gy - 80, cx - 60 + i * 20, gy - 2, '#555', 3);
        ['twyla', 'lenny', 'goose', 'marah', 'tobi', 'zuko'].forEach((id, i) => drawPet(ctx, id, cx - 50 + i * 20, gy + 14, h / 900, { t: t + i }));
        drawMob(ctx, 'zombie', cx + 80, gy, h / 330, { t, facing: 1 });
      }
      if (t > 2.1 && t < 2.3) sfxOnce('boom', this);
    } },
    { speaker: '', text: 'When Arlo came back... the house was GONE. Everyone was gone. All that was left was a note.', draw(ctx, w, h, t) {
      riverHome(ctx, w, h, t, true); const gy = h * 0.76;
      drawPerson(ctx, w * 0.35, gy, h / 300, arlo(), { t, sad: true });
      note(ctx, w * 0.66, gy - 10, h / 300, t);
    } },
    { speaker: 'The note', text: '"Now that we\'ve taken all your family, your pets AND your stuff, there\'s NO WAY you could ever stop us! — President Business  (P.S. Nice try, kid.)"', draw(ctx, w, h, t) {
      ctx.fillStyle = '#3a2a1a'; ctx.fillRect(0, 0, w, h);
      note(ctx, w / 2, h / 2, Math.min(w / 100, h / 70), t * 0.3);
      ctx.save(); ctx.translate(w / 2, h / 2); const s = Math.min(w / 100, h / 70);
      ctx.font = `${Math.round(5.5 * s)}px Fredoka, sans-serif`; ctx.fillStyle = '#c22'; ctx.textAlign = 'center';
      ctx.fillText('HA HA HA!', 0, -12 * s); ctx.fillStyle = '#333'; ctx.fillText('No way you can', 0, -2 * s); ctx.fillText('stop us, kid!', 0, 8 * s); ctx.fillText('- P.B.', 18 * s, 18 * s);
      ctx.restore();
    } },
    { speaker: 'Arlo', text: '"Oh... it is ON. I\'m going to rescue EVERYONE. And then I\'m taking Montreal back."', draw(ctx, w, h, t) {
      riverHome(ctx, w, h, t, true); const gy = h * 0.76;
      const k = Math.min(1, t / 1.2);
      const look = { ...arlo(), hat: { style: 'headband', color: '#e0263f' } };
      drawPerson(ctx, w * 0.5, gy, h / 260 * (1 + k * 0.1), t > 1.2 ? look : arlo(), { t, attack: t > 1.5 ? Math.max(0, Math.sin(t * 4)) : 0, angry: true });
      if (t > 1.2) { ctx.save(); ctx.globalAlpha = 0.3 + Math.sin(t * 6) * 0.2; circle(ctx, w * 0.5, gy - h * 0.2, h * 0.28, '#ffcf33', 0); ctx.restore(); }
      if (t > 1.2 && t < 1.4) sfxOnce('cinema', this);
    } },
    { speaker: '', text: 'Arlo ran all the way to Nana & Papi\'s house. That would be his base. Nana gave him a big hug. Papi made him a snack. And the adventure began...', draw(ctx, w, h, t) {
      drawBackground(ctx, 'river', w, h, t * 30, t); const gy = h * 0.76;
      drawPerson(ctx, w * 0.3, gy, h / 300, FAMILY.nana.look, { t });
      drawPerson(ctx, w * 0.5, gy, h / 300, arlo(), { t, armUp: true });
      drawPerson(ctx, w * 0.7, gy, h / 300, FAMILY.papi.look, { t: t + 1, wave: true });
    } },
    { speaker: '', text: '', title: true, draw(ctx, w, h, t) {
      ctx.fillStyle = '#2a1840'; ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { const a = i * 2.4 + t * 0.3; ctx.fillStyle = ['#7b3fe4', '#ffcf33', '#ff7ac8'][i % 3]; ctx.globalAlpha = 0.5; ctx.fillRect(w / 2 + Math.cos(a) * (40 + i * 8), h / 2 + Math.sin(a) * (40 + i * 6), 6, 6); }
      ctx.globalAlpha = 1;
      const s = Math.min(1, t / 0.6);
      ctx.save(); ctx.translate(w / 2, h * 0.4); ctx.scale(s, s);
      text(ctx, "ARLO'S", 0, -h * 0.12, h * 0.09, '#ffcf33'); text(ctx, 'AWESOME', 0, 0, h * 0.12, '#fff'); text(ctx, 'ADVENTURE', 0, h * 0.12, h * 0.09, '#c9a6ff');
      ctx.restore();
      if (t > 0.8) text(ctx, '★ AAA ★', w / 2, h * 0.68, h * 0.05, '#ff7ac8');
      if (t > 0.6) drawPerson(ctx, w / 2, h * 0.95, h / 420, { ...arlo(), hat: { style: 'headband', color: '#e0263f' } }, { t, attack: Math.max(0, Math.sin(t * 3)) });
    } },
  ];

  const canvas = el('canvas');
  const speaker = el('div', { class: 'speaker' }), txt = el('div'), tap = el('div', { class: 'tap' }, 'tap ▶');
  const caption = el('div', { class: 'cut-caption' }, speaker, txt, tap);
  const skip = el('button', { class: 'btn small gray skip-btn', onclick: e => { e.stopPropagation(); finish(); } }, 'Skip ⏭');
  const root = el('div', { class: 'cutscene' }, skip, canvas, caption);
  document.getElementById('overlay').append(root);
  const ctx = canvas.getContext('2d');
  let i = 0, t0 = performance.now(), typed = 0, done = false;
  function resize() { const r = canvas.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); canvas.width = r.width * dpr; canvas.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function show(k) { i = k; t0 = performance.now(); typed = 0; const sc = scenes[i]; speaker.textContent = sc.speaker; caption.style.display = sc.title ? 'none' : 'block'; sc._played = {}; }
  function next() {
    const sc = scenes[i];
    if (!sc.title && typed < sc.text.length) { typed = sc.text.length; return; }
    sfx('click');
    if (i < scenes.length - 1) show(i + 1); else finish();
  }
  function finish() { if (done) return; done = true; root.remove(); onDone(); }
  root.addEventListener('click', next);
  function loop(now) {
    if (done) return;
    const r = canvas.getBoundingClientRect(); if (Math.abs(r.width * Math.min(2, devicePixelRatio || 1) - canvas.width) > 2) resize();
    const t = (now - t0) / 1000; const sc = scenes[i];
    ctx.clearRect(0, 0, r.width, r.height);
    ctx.save(); sc.draw(ctx, r.width, r.height, t); ctx.restore();
    if (!sc.title) { typed = Math.min(sc.text.length, typed + 1.2); txt.textContent = sc.text.slice(0, Math.floor(typed)); }
    else if (t > 2.5) { if (!sc._tapShown) { sc._tapShown = true; } text(ctx, 'tap to start', r.width / 2, r.height * 0.78, 16, '#fff'); }
    requestAnimationFrame(loop);
  }
  show(0); resize(); requestAnimationFrame(loop);
}
function sfxOnce(name, sc) { sc._played = sc._played || {}; if (!sc._played[name]) { sc._played[name] = 1; sfx(name); } }
