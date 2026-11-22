import { el, rich, sleep, icon } from '../util.js';
const SKILL_ICON_ALIAS = { poison_star: 'poison_touch', thunder_plus: 'thunder', thunder_god: 'thunder', dragon_fist: 'rage_up', golden_burger: 'big_lunch', vampire_kick: 'lifesteal' };
import { SKILLS } from '../data/skills.js';
import { RARITY_NAMES } from '../data/gear.js';
import { sfx } from '../audio.js';
import { toCanvas } from '../art/core.js';
import { drawItemIcon } from '../art/items.js';

export function overlay() { return document.getElementById('overlay'); }

export function modal(content, { onClose, dismissable = false, cls = '' } = {}) {
  const bg = el('div', { class: 'modal-bg ' + cls });
  bg.append(content);
  if (dismissable) bg.addEventListener('click', e => { if (e.target === bg) close(); });
  overlay().append(bg);
  function close() { bg.remove(); onClose?.(); }
  return { el: bg, close };
}

export function skillIcon(id, size = 54) {
  const s = SKILLS[id];
  const d = el('div', { class: `skill-icon bg-${s.rarity}`, style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.55) + 'px' } }, icon(SKILL_ICON_ALIAS[id] || id, Math.round(size * 0.82), s.icon));
  if (s.badge) d.append(el('span', { class: 'badge' }, s.badge));
  return d;
}

export function skillPicker(ids, title = 'Choose a skill', sub = 'Pick one!') {
  return new Promise(res => {
    sfx('levelup');
    const wrap = el('div', { style: { width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' } });
    wrap.append(el('div', { class: 'choose-title' }, el('div', { class: 'ribbon' }, title), el('p', {}, sub)));
    ids.forEach((id, i) => {
      const s = SKILLS[id];
      const b = el('button', { class: 'skill-opt', style: { animationDelay: (i * 0.08) + 's' }, onclick: () => { sfx('click'); m.close(); res(id); } },
        skillIcon(id),
        el('div', {}, el('div', { class: 'name' }, el('span', { class: `rar r-${s.rarity}` }, RARITY_NAMES[s.rarity]), s.name), el('div', { class: 'desc', html: rich(s.desc) })));
      wrap.append(b);
    });
    const m = modal(wrap);
  });
}

export function infoModal(title, bodyHtml, btn = 'OK', color = 'green') {
  return new Promise(res => {
    const p = el('div', { class: 'panel' }, el('h2', {}, title), el('div', { html: bodyHtml, style: { fontWeight: 600, textAlign: 'center' } }),
      el('div', { style: { textAlign: 'center', marginTop: '14px' } }, el('button', { class: 'btn ' + color, onclick: () => { sfx('click'); m.close(); res(); } }, btn)));
    const m = modal(p);
  });
}
export function confirmModal(title, bodyHtml, yes = 'Yes', no = 'No') {
  return new Promise(res => {
    // resolve BEFORE closing: closing fires onClose, which would otherwise answer "No" first
    let answered = false; const answer = v => { if (answered) return; answered = true; res(v); };
    const p = el('div', { class: 'panel' }, el('h2', {}, title), el('div', { html: bodyHtml, style: { fontWeight: 600, textAlign: 'center' } }),
      el('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '14px' } },
        el('button', { class: 'btn gray small', onclick: () => { answer(false); m.close(); } }, no),
        el('button', { class: 'btn green small', onclick: () => { sfx('click'); answer(true); m.close(); } }, yes)));
    const m = modal(p, { dismissable: true, onClose: () => answer(false) });
  });
}

export function iconCanvas(key, size = 48) { return toCanvas(size, size, (ctx, w, h) => drawItemIcon(ctx, key, w, h)); }
// gear icon: generated art if present, else the built-in drawing
export function gearIcon(id, key, size = 48) {
  const im = icon('g_' + id, size); im.onerror = () => im.replaceWith(iconCanvas(key, size)); return im;
}

export function rewardChips(r) {
  const out = el('div', { class: 'rewards' });
  if (r.coins) out.append(el('div', { class: 'reward' }, '🪙 ', String(r.coins)));
  if (r.gems) out.append(el('div', { class: 'reward' }, '💎 ', String(r.gems)));
  if (r.food) out.append(el('div', { class: 'reward' }, '🦴 ', String(r.food)));
  if (r.eggs) out.append(el('div', { class: 'reward' }, '🥚 ', String(r.eggs)));
  return out;
}

export function canvasBox(w, h, drawFn, animate = false) {
  const c = el('canvas'); const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = w * dpr; c.height = h * dpr; c.style.width = w + 'px'; c.style.height = h + 'px';
  const ctx = c.getContext('2d'); ctx.scale(dpr, dpr);
  if (!animate) { drawFn(ctx, w, h, 0); return c; }
  const t0 = performance.now();
  const loop = now => { if (!c.isConnected && now - t0 > 1000) return; ctx.clearRect(0, 0, w, h); requestAnimationFrame(loop); drawFn(ctx, w, h, Math.max(0, (now - t0) / 1000)); };
  requestAnimationFrame(loop);
  return c;
}
