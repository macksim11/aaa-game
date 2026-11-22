// Guided tour: dims the screen, cuts a spotlight around one thing, and Nana explains it.
// Steps: { sel, text, tap (player must tap the highlighted thing), tapSel (what counts as the tap),
//          before(), skipIf(), pad }
import { el, sleep } from '../util.js';
import { sfx } from '../audio.js';
import { canvasBox } from './common.js';
import { drawHeadshot } from '../art/sheets.js';

const overlayEl = () => document.getElementById('overlay');
const hasModal = () => !!overlayEl().querySelector('.modal-bg, .pinball, .cutscene');

async function waitFor(sel, ms = 6000) {
  const t0 = performance.now();
  while (performance.now() - t0 < ms) {
    const e = !hasModal() && document.querySelector(sel);
    if (e) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0) return e; }
    await sleep(80);
  }
  return null;
}

export async function runTour(steps, { from = 0, onStep } = {}) {
  const layer = el('div', { class: 'tut-layer' });
  const hole = el('div', { class: 'tut-hole' });
  const hand = el('div', { class: 'tut-hand' }, '👆');
  const textEl = el('div', { class: 'tut-text' });
  const nextBtn = el('button', { class: 'btn gold small tut-next' }, 'Next ▶');
  const tapHint = el('div', { class: 'tut-taphint' }, 'Tap the glowing spot!');
  const face = el('img', { src: 'assets/ui/face_nana.webp', alt: 'Nana' });
  const coach = el('div', { class: 'tut-coach' }, el('div', { class: 'tut-face' }, face), el('div', { class: 'tut-body' }, el('div', { class: 'tut-name' }, 'Nana'), textEl, el('div', { class: 'tut-actions' }, tapHint, nextBtn)));
  layer.append(hole, hand, coach);
  document.getElementById('app').append(layer);

  let cur = null, target = null, raf = 0;
  const track = () => {
    if (target && target.isConnected) {
      const r = target.getBoundingClientRect(), app = document.getElementById('app').getBoundingClientRect();
      const p = cur?.pad ?? 6;
      Object.assign(hole.style, { left: r.left - app.left - p + 'px', top: r.top - app.top - p + 'px', width: r.width + p * 2 + 'px', height: r.height + p * 2 + 'px', display: 'block' });
      const below = (r.top + r.height / 2 - app.top) < app.height * 0.55;
      coach.classList.toggle('top', !below);
      const low = r.top + r.height / 2 - app.top > app.height * 0.7;   // near the bottom: point down from above
      hand.textContent = low ? '👇' : '👆';
      Object.assign(hand.style, { left: r.left - app.left + r.width / 2 - 20 + 'px', top: (low ? r.top - app.top - 50 : r.top - app.top + r.height / 2) + 'px' });
    }
    raf = requestAnimationFrame(track);
  };
  raf = requestAnimationFrame(track);

  // Block every tap except the coach box and (for tap steps) the highlighted thing.
  let allowSel = null, onTap = null;
  const guard = e => {
    if (!layer.isConnected) return;
    if (coach.contains(e.target)) return;
    if (hasModal() && !allowSel) return;                 // let reward popups be closed
    if (allowSel && e.target.closest?.(allowSel)) { if (e.type === 'click') onTap?.(); return; }
    if (hasModal() && e.target.closest?.('.modal-bg')) return;
    e.stopPropagation(); e.preventDefault();
  };
  document.addEventListener('click', guard, true);

  for (let i = from; i < steps.length; i++) {
    const s = steps[i]; cur = s;
    onStep?.(i);
    if (s.skipIf?.()) continue;
    hole.style.display = 'none'; hand.style.display = 'none'; coach.style.visibility = 'hidden'; target = null;
    await s.before?.();
    await sleep(120);
    target = await waitFor(s.sel);
    if (!target) continue;                                  // nothing to show — move on
    textEl.innerHTML = s.text;
    const tap = typeof s.tap === 'function' ? s.tap() : s.tap;
    nextBtn.style.display = tap ? 'none' : ''; tapHint.style.display = tap ? '' : 'none';
    hand.style.display = tap ? 'block' : 'none';
    coach.style.visibility = 'visible'; coach.classList.remove('pop'); void coach.offsetWidth; coach.classList.add('pop');
    sfx('pet');
    await new Promise(res => {
      if (tap) { allowSel = s.tapSel || s.sel; onTap = () => { allowSel = null; onTap = null; setTimeout(res, 250); }; }
      else nextBtn.onclick = () => { sfx('click'); res(); };
    });
    allowSel = null;
    await s.after?.();
  }
  cancelAnimationFrame(raf);
  document.removeEventListener('click', guard, true);
  layer.remove();
}
