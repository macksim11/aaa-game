# ARMED FRAMES (v16): Arlo drawn by the artist actually holding a sword, one sheet per outfit.
# The sheet is generated with a LIME-GREEN marker sword (tools/gen.sh, see art-gen/log.txt "swl_*"), so the sword pixels
# are exact: the game shows them as iron and tints them to wood / stone / diamond / netherite (like the belt).
# For every pose of the outfit this writes, next to the clean frames:
#   sw_<pose>.webp     the whole pose holding the sword (sword in iron grey, belt still magenta)
#   swt_<pose>.webp    sword shading mask (grey + alpha), tinted per sword material in the game
#   swb_<pose>.webp    belt shading mask (the game repaints it in his earned belt colour)
# and in frames.json, per frame: "sw": {"f", "t", "b", "w", "h", "dx"}  (dx: frame-px shift of its centre so the body
# stays where the clean frame's body is; frames are bottom-aligned at the same refHeight scale as the clean frames).
# OTHER WEAPONS (real colours, no tint): --weapon <id> writes a_<id>_<pose>.webp + ab_<id>_<pose>.webp and
#   frames.json "arm": {"<id>": {"f", "b", "w", "h", "dx"}}. --skip pose (keep the composited weapon for that pose),
#   --same pose=other (use another pose's drawing, e.g. a frame where the artist forgot the item), --gaps (clear every
#   900-2500 px white pocket: gaps between limbs and the item; not for white clothing such as the karate gi).
# usage: python3 tools/armed_frames.py <sheet.png> <outfit_dir> [--weapon id] [--skip pose] [--same a=b] [--gaps] [slice.py pocket flags...]
import sys, os, json, subprocess, tempfile, shutil
import numpy as np
from PIL import Image
from scipy import ndimage

SPEC = 'idle:3+victory:1,run:4,punch:1+kick:1+hurt:1+down:1'
sheet, D = sys.argv[1], sys.argv[2]; rest = sys.argv[3:]
def opt(name, many=False):
    vals = [rest[k + 1] for k, a in enumerate(rest) if a == name]
    return vals if many else (vals[0] if vals else None)
WEAPON = opt('--weapon'); SKIP = set(opt('--skip', True)); SAME = dict(x.split('=') for x in opt('--same', True))
extra = []; k = 0
while k < len(rest):
    if rest[k] in ('--weapon', '--skip', '--same'): k += 2; continue
    if rest[k] == '--gaps': k += 1; continue
    extra.append(rest[k]); k += 1
here = os.path.dirname(os.path.abspath(__file__))
def hsv(a):
    h = np.array(Image.fromarray(a[..., :3].astype(np.uint8)).convert('HSV')).astype(float)
    return h[..., 0] * 360 / 255, h[..., 1] / 255, h[..., 2] / 255

def lime_mask(a):
    hue, sat, val = hsv(a)
    core = (a[..., 3] > 60) & (hue > 60) & (hue < 125) & (sat > 0.45) & (val > 0.45)
    core = ndimage.binary_opening(core, iterations=1)
    lab, n = ndimage.label(core)                       # drop tiny specks (eye glints, hoodie fleck)
    if n:
        sz = ndimage.sum(core, lab, range(1, n + 1)); core = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 6])
    # anti-aliased rim: greenish pixels touching the core
    near = ndimage.binary_dilation(core, iterations=3)
    rim = near & (a[..., 3] > 0) & (hue > 45) & (hue < 145) & (sat > 0.12)
    return core, core | rim

tmp = tempfile.mkdtemp()
# white pockets that touch the sword are gaps (between blade, arm and body), not white clothing: clear those
def sword_gaps(path):
    a = np.array(Image.open(path).convert('RGBA')).astype(np.int16)
    white = (a[..., 0] > 238) & (a[..., 1] > 238) & (a[..., 2] > 238)
    lab, n = ndimage.label(white)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    core, _ = lime_mask(a.astype(np.int32)); near = ndimage.binary_dilation(core, iterations=18)
    out = []
    for i, sl in enumerate(ndimage.find_objects(lab), 1):
        if i in border or sl is None: continue
        m = lab[sl] == i
        if 900 < m.sum() < 2500 and ('--gaps' in rest or (near[sl] & m).any()):   # bigger pockets next to the sword were white clothing (karate gi)
            ys, xs = np.nonzero(m); out += ['--clear-pocket', f'{xs[0] + sl[1].start},{ys[0] + sl[0].start}']
    return out
subprocess.run([sys.executable, f'{here}/slice.py', sheet, tmp, SPEC, '--key', 'white', '--height', '300', *sword_gaps(sheet), *extra], check=True)

def body_cx(a, skip):
    m = (a[..., 3] > 128) & ~skip
    ys, xs = np.nonzero(m)
    if not len(ys): return a.shape[1] / 2
    top = ys.min(); hh = ys.max() - top
    head = ys < top + 0.38 * hh
    return xs[head].mean() if head.sum() > 50 else xs.mean()

fj = json.load(open(f'{D}/frames.json'))
tj = json.load(open(f'{tmp}/frames.json'))
# scale: the armed idle_0 is drawn as tall as the clean idle_0 (the sword stays below his hair in idle)
c0 = Image.open(f"{D}/{fj['anims']['idle'][0]['f']}"); a0 = np.array(Image.open(f"{tmp}/{tj['anims']['idle'][0]['f']}").convert('RGBA'))
s = c0.height / a0.shape[0]
def head_shift(a, ca):
    """horizontal shift (frame px) that puts the armed pose's head over the clean pose's head (bottom-aligned)"""
    A = a[..., 3] > 128; C = ca[..., 3] > 128
    ys = np.nonzero(C.any(1))[0]; top, hh = ys.min(), ys.max() - ys.min()
    band = C[top:top + int(0.4 * hh)]
    off = A.shape[0] - C.shape[0]                     # bottom alignment
    r0 = top + off
    if r0 < 0: band = band[-r0:]; r0 = 0
    Ab = A[r0:r0 + band.shape[0]]; band = band[:Ab.shape[0]]
    cA, cC = A.shape[1] / 2, C.shape[1] / 2; best = (-1, 0)
    for d in range(-80, 81):                           # armed frame drawn with its centre shifted by d
        x0 = int(round(cA - cC - d))                   # clean column j sits at armed column j + x0
        j0, j1 = max(0, -x0), min(C.shape[1], A.shape[1] - x0)
        if j1 <= j0: continue
        sc = (band[:, j0:j1] & Ab[:, j0 + x0:j1 + x0]).sum()
        if sc > best[0]: best = (sc, d)
    return best[1]
pre = 'sw' if not WEAPON else f'a_{WEAPON}'
work = tempfile.mkdtemp(); wj = {'refHeight': fj.get('refHeight', 300), 'anims': {}}
for anim, lst in tj['anims'].items():
    for k, fr in enumerate(lst):
        name = f'{anim}_{k}'; src = SAME.get(name, name); sa, sk = src.rsplit('_', 1)
        im = Image.open(f"{tmp}/{tj['anims'][sa][int(sk)]['f']}").convert('RGBA')
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        a = np.array(im).astype(np.int32)
        lab, n = ndimage.label(a[..., 3] > 40)           # drop specks floating apart from him (speed lines, sparkles)
        if n > 1:
            sz = ndimage.sum(np.ones(lab.shape), lab, range(1, n + 1))
            a[np.isin(lab, [i + 1 for i, v in enumerate(sz) if v < 150])] = 0
            for i, sl in enumerate(ndimage.find_objects(lab), 1):   # motion marks cut by the left/right frame edge
                if sl is not None and sz[i - 1] < 400 and (sl[1].start == 0 or sl[1].stop == a.shape[1]): a[lab == i] = 0
        clean = fj['anims'].get(anim, fj['anims']['idle'])[min(k, len(fj['anims'].get(anim, fj['anims']['idle'])) - 1)]
        ca = np.array(Image.open(f"{D}/{clean['f']}").convert('RGBA'))
        if not WEAPON:
            core, lime = lime_mask(a)
            lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
            grey = np.clip((lum - 60) * 1.25 + 40, 0, 255)        # lime shading -> iron grey ramp (dark rim stays dark)
            base = a.copy()
            for c in range(3): base[..., c] = np.where(lime, grey, a[..., c])
            base[..., 2] = np.where(lime, np.clip(grey + 8, 0, 255), base[..., 2])   # the blue-grey of iron, a touch cool
            tint = np.zeros_like(a); tint[..., 0] = tint[..., 1] = tint[..., 2] = grey
            tint[..., 3] = np.where(lime, a[..., 3], 0)
            Image.fromarray(tint.astype(np.uint8)).save(f'{work}/swt_{name}.webp', 'WEBP', lossless=True)
            dx = 0.0 if anim == 'down' else -((body_cx(a, lime) - a.shape[1] / 2) - (body_cx(ca, np.zeros(ca.shape[:2], bool)) - ca.shape[1] / 2))
            n_item = int(core.sum())
        else:
            base = a; n_item = 9999
            dx = 0.0 if anim == 'down' else head_shift(a, ca)
        Image.fromarray(base.astype(np.uint8)).save(f'{work}/{pre}_{name}.webp', 'WEBP', quality=90, method=6)
        wj['anims'].setdefault(anim, []).append({'f': f'{pre}_{name}.webp', 'w': im.width, 'h': im.height, 'dx': round(float(dx), 1), 'lime': n_item})
json.dump(wj, open(f'{work}/frames.json', 'w'))
subprocess.run([sys.executable, f'{here}/belt_masks.py', work], check=True, stdout=subprocess.DEVNULL)
wj = json.load(open(f'{work}/frames.json'))
bpre = 'swb' if not WEAPON else f'ab_{WEAPON}'
for anim, lst in wj['anims'].items():
    for k, w in enumerate(lst):
        name = f'{anim}_{k}'
        tgt = fj['anims'][anim][k] if anim in fj['anims'] and k < len(fj['anims'][anim]) else None
        if tgt is None: continue
        if WEAPON: tgt.get('arm', {}).pop(WEAPON, None)
        else: tgt.pop('sw', None)
        if name in SKIP or w['lime'] < 600: print(D, name, 'SKIPPED: keeps the composited weapon'); continue
        shutil.copy(f"{work}/{w['f']}", f"{D}/{w['f']}")
        entry = {'f': w['f'], 'w': w['w'], 'h': w['h'], 'dx': w['dx']}
        if not WEAPON: shutil.copy(f'{work}/swt_{name}.webp', f'{D}/swt_{name}.webp'); entry['t'] = f'swt_{name}.webp'
        if w.get('belt'): shutil.copy(f"{work}/{w['belt']}", f'{D}/{bpre}_{name}.webp'); entry['b'] = f'{bpre}_{name}.webp'
        if WEAPON: tgt.setdefault('arm', {})[WEAPON] = entry
        else: tgt['sw'] = entry
        print(D, name, entry)
json.dump(fj, open(f'{D}/frames.json', 'w'), indent=1)
shutil.rmtree(tmp); shutil.rmtree(work)
