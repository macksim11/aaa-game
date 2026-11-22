export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const chance = p => Math.random() < p;
export const pick = arr => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
// ---- game pause: every game timer (sleep) and the battle scene stop while paused ----
export const GAME = { paused: false };
export function setPaused(p) { GAME.paused = !!p; }
// sleep that only counts time while the game is NOT paused
export const sleep = ms => new Promise(r => {
  let left = ms, last = performance.now();
  const tick = () => { const now = performance.now(); if (!GAME.paused) left -= now - last; last = now; if (left <= 0) r(); else setTimeout(tick, Math.min(60, Math.max(4, left))); };
  setTimeout(tick, Math.min(60, Math.max(0, ms)));
});
export function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export function weighted(items, w = x => x.weight ?? 1) {
  const total = items.reduce((s, x) => s + w(x), 0);
  let r = Math.random() * total;
  for (const x of items) { r -= w(x); if (r <= 0) return x; }
  return items[items.length - 1];
}
export function fmt(n) {
  n = Math.round(n);
  if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
  if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(n >= 1e5 ? 0 : 1) + 'K';
  return String(n);
}
export const pct = v => Math.round(v * 100) + '%';
export function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false) continue;
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
}
export function today() { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
export function uid() { return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3); }
export function toast(msg) {
  const t = document.getElementById('toast');
  const m = el('div', { class: 'toast-msg', html: msg });
  t.append(m); setTimeout(() => m.remove(), 2300);
}
// Highlight keywords written as [r:text] [b:text] [p:text] [g:text]
export function rich(s) {
  return s.replace(/\[(r|b|p|g):([^\]]+)\]/g, (_, c, t) => `<span class="k-${{ r: 'red', b: 'blue', p: 'purple', g: 'green' }[c]}">${t}</span>`);
}

// Generated game icons (assets/icons/<name>.webp) with an emoji fallback
export function icon(name, size = 24, fallback = '') {
  const im = document.createElement('img');
  im.src = `assets/icons/${name}.webp`; im.alt = ''; im.className = 'gi';
  im.style.width = im.style.height = size + 'px';
  im.onerror = () => { const sp = document.createElement('span'); sp.textContent = fallback; im.replaceWith(sp); };
  return im;
}

// ---- Emoji → game icon art ----
// Any of these emoji appearing in the UI text are swapped for the generated icons automatically.
export const EMOJI_ICON = {
  '🪙': 'coin', '💎': 'gem', '❤️': 'heart', '❤': 'heart', '⚔️': 'sword', '⚔': 'sword', '🛡️': 'shield', '🛡': 'shield', '⚡': 'bolt',
  '🦴': 'food', '🥚': 'egg', '🔒': 'lock', '✅': 'check', '🎯': 'target', '💥': 'burst', '🥋': 'fists', '🔄': 'counter_arrows',
  '👟': 'wingshoe', '🧛': 'blood', '🎵': 'music', '🔊': 'sound', '🎬': 'clapper', '📲': 'transfer', '📊': 'stats', '🐾': 'pets',
  '🛵': 'rides', '👊': 'power_punch', '💀': 'skull', '👑': 'crown', '🎲': 'dice', '❓': 'question', '⚙️': 'settings', '⚙': 'settings',
  '📖': 'book', '🏠': 'home', '🏙️': 'map', '✨': 'sparkle', '🔥': 'flame', '⏳': 'hourglass', '🍀': 'horseshoe', '🎁': 'gift',
  '🏆': 'trophy', '⭐': 'star', '🌟': 'star_plus', '🍔': 'big_lunch', '🎰': 'pinball', '📜': 'note', '🗝️': 'key', '❗': 'alert', '🏇': 'rides',
};
const EMOJI_RE = new RegExp('(' + Object.keys(EMOJI_ICON).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\uFE0F?', 'gu');
export function iconizeText(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: n => { const p = n.parentElement; if (!p || p.closest('textarea,input,script,style,.no-icons')) return NodeFilter.FILTER_REJECT; EMOJI_RE.lastIndex = 0; return EMOJI_RE.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT; },
  });
  const nodes = []; while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const n of nodes) {
    const frag = document.createDocumentFragment(); let last = 0; const s = n.nodeValue;
    EMOJI_RE.lastIndex = 0; let m;
    while ((m = EMOJI_RE.exec(s))) {
      if (m.index > last) frag.append(s.slice(last, m.index));
      const name = EMOJI_ICON[m[1]] || EMOJI_ICON[m[1].replace('️', '')];
      const im = document.createElement('img'); im.src = `assets/icons/${name}.webp`; im.alt = m[1]; im.className = 'emo';
      im.onerror = () => im.replaceWith(m[1]);
      frag.append(im); last = m.index + m[0].length;
    }
    if (last < s.length) frag.append(s.slice(last));
    n.replaceWith(frag);
  }
}
let iconizeQueued = false;
export function watchIcons(root) {
  iconizeText(root);
  new MutationObserver(() => { if (iconizeQueued) return; iconizeQueued = true; queueMicrotask(() => { iconizeQueued = false; iconizeText(root); }); })
    .observe(root, { childList: true, subtree: true, characterData: true });
}

// Load every icon once at start and keep them in memory, so menus show icons instantly.
const ICON_CACHE = [];
export async function preloadIcons() {
  try {
    const names = await (await fetch('assets/icons/list.json')).json();
    await Promise.all(names.map(n => new Promise(res => { const im = new Image(); im.onload = im.onerror = res; im.src = `assets/icons/${n}.webp`; ICON_CACHE.push(im); })));
  } catch {}
}
