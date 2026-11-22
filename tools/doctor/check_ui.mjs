// Doctor: screen-design checks in a real (headless) browser.  node tools/doctor/check_ui.mjs
// Opens every screen and popup on 5 devices and looks for: sideways scrolling, text cut off, button text wrapping,
// buttons off-screen, overlapping buttons, tap targets too small, broken images and console errors.
// Saves a screenshot of every screen to tools/doctor/report/ui/ for review.
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = path.join(ROOT, 'tools/doctor/report/ui'); fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) fs.unlinkSync(path.join(OUT, f));

// tiny static server for the game
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/\/$/, '/index.html'));
  if (!p.startsWith(ROOT) || !fs.existsSync(p)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  fs.createReadStream(p).pipe(res);
}).listen(0);
const PORT = server.address().port;

const DEVICES = [
  { name: 'iphone-se', width: 375, height: 667, mobile: true },
  { name: 'iphone-12', width: 390, height: 844, mobile: true },
  { name: 'iphone-pro-max', width: 430, height: 932, mobile: true },
  { name: 'ipad', width: 820, height: 1180, mobile: true },
  { name: 'laptop', width: 1440, height: 900, mobile: false },
];
const MID_SAVE = {
  introSeen: true, coins: 2400, gems: 160, petFood: 40, tut: { stage: 'done', open: ['home', 'shop', 'gear', 'pets', 'belts'], step: 0 },
  talents: { hp: 8, atk: 8, def: 7 }, rescued: { family: ['mom', 'papa', 'alyzee'], pets: ['twyla', 'lenny', 'goose'] },
  pets: { owned: { twyla: { level: 4, xp: 0 }, lenny: { level: 2, xp: 0 }, goose: { level: 1, xp: 0 } }, equipped: ['twyla', 'lenny'] },
  progress: { unlocked: 4, selected: 3, best: { 1: 30, 2: 35, 3: 18 }, cleared: { 1: true, 2: true, 3: true } },
  mounts: { owned: { bike: { level: 1 }, horse: { level: 1 } }, equipped: null },
  gear: { items: [{ uid: 'w', id: 'diamond_sword', rarity: 3, level: 4 }, { uid: 'a', id: 'iron_chest', rarity: 2, level: 2 }, { uid: 'g', id: 'sparring', rarity: 1, level: 1 }, { uid: 's', id: 'cleats', rarity: 0, level: 1 }], slots: { weapon: 'w', gi: 'a', gloves: 'g', shoes: 's' } },
};

// checks that run inside the page
const PAGE_CHECKS = () => {
  const out = [];
  // visible = on screen AND not scrolled out of its scrolling area (e.g. cards hidden behind the tab bar)
  const vis = e => {
    const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    if (!(r.width > 2 && r.height > 2 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05)) return false;
    for (let p = e.parentElement; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(ps.overflowY) && p !== document.body && p !== document.documentElement) {
        const pr = p.getBoundingClientRect();
        if (r.bottom <= pr.top + 2 || r.top >= pr.bottom - 2 || r.right <= pr.left + 2 || r.left >= pr.right - 2) return false;
      }
    }
    return true;
  };
  // rect clipped to every scrolling ancestor = the part you can actually see / tap
  const clip = e => {
    let r = e.getBoundingClientRect(); r = { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    for (let p = e.parentElement; p; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (/(auto|scroll|hidden)/.test(ps.overflowY) && p !== document.body && p !== document.documentElement) {
        const pr = p.getBoundingClientRect();
        r = { left: Math.max(r.left, pr.left), right: Math.min(r.right, pr.right), top: Math.max(r.top, pr.top), bottom: Math.min(r.bottom, pr.bottom) };
      }
    }
    r.width = Math.max(0, r.right - r.left); r.height = Math.max(0, r.bottom - r.top); return r;
  };
  const label = e => (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : e.tagName.toLowerCase()) + ' "' + (e.innerText || e.alt || '').trim().replace(/\s+/g, ' ').slice(0, 28) + '"';
  const topModal = [...document.querySelectorAll('.modal-bg')].pop();
  const scope = topModal || document.getElementById('app');
  if (document.documentElement.scrollWidth > innerWidth + 1) out.push(['overflow', 'page scrolls sideways (' + document.documentElement.scrollWidth + 'px wide)']);
  const clickables = [...scope.querySelectorAll('button, .btn, .tile, .slot, .side-btn, .navbar button')].filter(vis);
  const appR = document.getElementById('app').getBoundingClientRect();
  for (const e of clickables) {
    const r = e.getBoundingClientRect();
    const inScroller = e.closest('.tab-body, .log, .panel');
    if (!inScroller && (r.left < appR.left - 1 || r.right > appR.right + 1 || r.bottom > appR.bottom + 1 || r.top < appR.top - 1)) out.push(['offscreen', label(e) + ' is cut off by the screen edge']);
    if (Math.min(r.width, r.height) < 30 && !e.classList.contains('danger-link')) out.push(['tap-target', label(e) + ` is small to tap (${Math.round(r.width)}x${Math.round(r.height)})`]);
    if (e.classList.contains('btn') && !e.classList.contains('choice')) {
      const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.2;
      const textH = e.scrollHeight - parseFloat(getComputedStyle(e).paddingTop) - parseFloat(getComputedStyle(e).paddingBottom);
      if (textH > lh * 1.9 && e.innerText.trim().length > 3) out.push(['wrap', label(e) + ' text wraps onto 2+ lines']);
    }
  }
  for (let i = 0; i < clickables.length; i++) for (let j = i + 1; j < clickables.length; j++) {
    const a = clickables[i], b = clickables[j]; if (a.contains(b) || b.contains(a)) continue;
    const r = clip(a), s = clip(b);
    const ix = Math.max(0, Math.min(r.right, s.right) - Math.max(r.left, s.left)), iy = Math.max(0, Math.min(r.bottom, s.bottom) - Math.max(r.top, s.top));
    const small = Math.min(r.width * r.height, s.width * s.height);
    if (ix * iy > small * 0.25) out.push(['overlap', label(a) + ' overlaps ' + label(b)]);
  }
  for (const e of [...scope.querySelectorAll('h2, h3, .cname, .t, .name, .nm, .tag, .cur, .reward, .ribbon, .day-label')].filter(vis)) {
    if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible') out.push(['cut-text', label(e) + ' text is cut off']);
  }
  for (const im of document.querySelectorAll('img')) if (im.complete && im.naturalWidth === 0 && vis(im)) out.push(['image', 'image failed to load: ' + im.getAttribute('src')]);
  return out;
};

const problems = []; const screens = [];
// uses the Google Chrome already installed on this Mac (falls back to Playwright's own Chromium if present)
const browser = await chromium.launch({ channel: 'chrome', headless: true }).catch(() => chromium.launch());
for (const dev of DEVICES) {
  for (const flow of ['fresh', 'mid']) {
    const ctx = await browser.newContext({ viewport: { width: dev.width, height: dev.height }, isMobile: dev.mobile, hasTouch: dev.mobile, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const consoleErr = [];
    page.on('console', m => { if (m.type() === 'error' && !/music\/|favicon|404 \(File not found\)|status of 404/.test(m.text())) consoleErr.push(m.text()); });
    page.on('pageerror', e => consoleErr.push(String(e)));
    if (flow === 'mid') await ctx.addInitScript(s => { try { localStorage.setItem('aaa_save_test', s); } catch {} }, JSON.stringify(MID_SAVE));
    await page.goto(`http://localhost:${PORT}/?test`, { waitUntil: 'load' });
    await page.waitForSelector('#boot', { state: 'detached', timeout: 20000 }).catch(() => {});
    const shot = async (name) => {
      await page.waitForTimeout(350);
      const found = await page.evaluate(PAGE_CHECKS);
      for (const [kind, msg] of found) problems.push({ device: dev.name, screen: name, kind, msg });
      const file = `${dev.name}__${name}.png`; await page.screenshot({ path: path.join(OUT, file) }); screens.push(file);
    };
    const click = async sel => { const el = await page.$(sel); if (el) { await el.click({ force: true }).catch(() => {}); await page.waitForTimeout(300); return true; } return false; };
    const closeModals = async () => { for (let i = 0; i < 4; i++) { if (!(await page.$('.modal-bg'))) break; await page.evaluate(() => { const b = [...document.querySelectorAll('.modal-bg')].pop(); (b.querySelector('.btn.green:not(.small), .btn.gold:not(.small)') ? b.querySelector('.btn.green:not(.small), .btn.gold:not(.small)') : b).click(); }); await page.waitForTimeout(250); } await page.evaluate(() => document.querySelectorAll('.modal-bg').forEach(m => m.remove())); };
    try {
      if (flow === 'fresh') {
        await shot('title');
        await click('.ts-play'); await page.waitForTimeout(900); await shot('story');
        await click('.skip-btn'); await page.waitForTimeout(900); await shot('first-adventure');
      } else {
        await shot('home');
        await click('.side-btn:nth-child(2)'); await shot('menu'); await closeModals();
        for (const tab of ['gear', 'pets', 'belts', 'shop']) {
          await click(`.navbar [data-tab=${tab}]`); await shot('tab-' + tab);
          if (tab === 'gear') { await click('.grid .tile'); await shot('item-popup'); await closeModals(); }
          if (tab === 'pets') { await click('.grid .tile'); await shot('pet-popup'); await closeModals(); await page.evaluate(() => [...document.querySelectorAll('.tabs button')].find(b => /Rides/.test(b.textContent))?.click()); await page.waitForTimeout(300); await shot('tab-rides'); }
          if (tab === 'shop') { await click('.shop-card .btn.gold'); await page.waitForTimeout(500); await shot('chest-popup'); await closeModals(); }
        }
        await click('.navbar [data-tab=home]'); await click('.home-panel .btn.gold'); await page.waitForTimeout(1200); await shot('adventure');
        await click('.actions .btn'); await page.waitForTimeout(2500);
        // play forward until a battle, skill choice or event choice appears
        for (let i = 0; i < 18; i++) {
          if (await page.$('.skill-opt')) { await shot('skill-choice'); await click('.skill-opt'); continue; }
          const n = await page.$$eval('.actions .btn:not([disabled])', b => b.length);
          if (n > 1) { await shot('event-choice'); }
          const lbl = await page.$eval('.actions .btn', b => b.textContent).catch(() => '');
          if (/Battle/.test(lbl)) { await shot('before-battle'); await click('.actions .btn'); await page.waitForTimeout(2500); await shot('battle'); break; }
          await page.evaluate(() => { const b = [...document.querySelectorAll('.actions .btn:not([disabled])')]; b[b.length - 1]?.click(); });
          await page.waitForTimeout(1500);
        }
        await click('.hud-top .icon-btn'); await shot('paused'); await closeModals();
      }
    } catch (e) { problems.push({ device: dev.name, screen: flow, kind: 'script', msg: 'test flow stopped: ' + String(e).slice(0, 150) }); }
    for (const e of [...new Set(consoleErr)]) problems.push({ device: dev.name, screen: flow, kind: 'console', msg: e.slice(0, 200) });
    await ctx.close();
  }
}
await browser.close(); server.close();
// group identical problems across devices
const groups = {};
for (const p of problems) { const k = p.kind + '|' + p.screen + '|' + p.msg; (groups[k] ||= { ...p, devices: [] }).devices.push(p.device); }
const list = Object.values(groups);
for (const g of list) console.log(`UI [${g.kind}] ${g.screen}: ${g.msg}  (${g.devices.join(', ')})`);
fs.writeFileSync(path.join(ROOT, 'tools/doctor/report/ui.json'), JSON.stringify({ problems: list, screens }, null, 1));
console.log(`${list.length} UI problems, ${screens.length} screenshots in tools/doctor/report/ui/`);
process.exit(list.length ? 1 : 0);
