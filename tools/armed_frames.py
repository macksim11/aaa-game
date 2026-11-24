# ARMED FRAMES (v16): Arlo drawn by the artist actually holding a sword, one sheet per outfit.
# The sheet is generated with a LIME-GREEN marker sword (tools/gen.sh, see art-gen/log.txt "swl_*"), so the sword pixels
# are exact: the game shows them as iron and tints them to wood / stone / diamond / netherite (like the belt).
# For every pose of the outfit this writes, next to the clean frames:
#   sw_<pose>.webp     the whole pose holding the sword (sword in iron grey, belt still magenta)
#   swt_<pose>.webp    sword shading mask (grey + alpha), tinted per sword material in the game
#   swb_<pose>.webp    belt shading mask (the game repaints it in his earned belt colour)
# and in frames.json, per frame: "sw": {"f", "t", "b", "w", "h", "dx"}  (dx: frame-px shift of its centre so the body
# stays where the clean frame's body is; frames are bottom-aligned at the same refHeight scale as the clean frames).
# usage: python3 tools/armed_frames.py <sheet.png> <outfit_dir> [slice.py pocket flags...]
import sys, os, json, subprocess, tempfile, shutil
import numpy as np
from PIL import Image
from scipy import ndimage

SPEC = 'idle:3+victory:1,run:4,punch:1+kick:1+hurt:1+down:1'
sheet, D = sys.argv[1], sys.argv[2]; extra = sys.argv[3:]
here = os.path.dirname(os.path.abspath(__file__))
tmp = tempfile.mkdtemp()
subprocess.run([sys.executable, f'{here}/slice.py', sheet, tmp, SPEC, '--key', 'white', '--height', '300', *extra], check=True)
for f in os.listdir(tmp):   # slice.py writes png; keep names
    pass

def hsv(a):
    h = np.array(Image.fromarray(a[..., :3].astype(np.uint8)).convert('HSV')).astype(float)
    return h[..., 0] * 360 / 255, h[..., 1] / 255, h[..., 2] / 255

def lime_mask(a):
    hue, sat, val = hsv(a)
    core = (a[..., 3] > 60) & (hue > 60) & (hue < 125) & (sat > 0.45) & (val > 0.45)
    core = ndimage.binary_opening(core, iterations=1)
    lab, n = ndimage.label(core)                       # drop tiny specks (eye glints, hoodie fleck)
    if n:
        sz = ndimage.sum(core, lab, range(1, n + 1)); core = np.isin(lab, [i + 1 for i, s in enumerate(sz) if s >= 25])
    # anti-aliased rim: greenish pixels touching the core
    near = ndimage.binary_dilation(core, iterations=2)
    rim = near & (a[..., 3] > 0) & (hue > 50) & (hue < 140) & (sat > 0.2)
    return core, core | rim

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
work = tempfile.mkdtemp(); wj = {'refHeight': fj.get('refHeight', 300), 'anims': {}}
for anim, lst in tj['anims'].items():
    for k, fr in enumerate(lst):
        im = Image.open(f"{tmp}/{fr['f']}").convert('RGBA')
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))), Image.LANCZOS)
        a = np.array(im).astype(np.int32)
        core, lime = lime_mask(a)
        lum = 0.3 * a[..., 0] + 0.59 * a[..., 1] + 0.11 * a[..., 2]
        grey = np.clip((lum - 60) * 1.25 + 40, 0, 255)        # lime shading -> iron grey ramp (dark rim stays dark)
        base = a.copy()
        for c in range(3): base[..., c] = np.where(lime, grey, a[..., c])
        # the blue-grey of iron, a touch cool
        base[..., 2] = np.where(lime, np.clip(grey + 8, 0, 255), base[..., 2])
        tint = np.zeros_like(a); tint[..., 0] = tint[..., 1] = tint[..., 2] = grey
        tint[..., 3] = np.where(lime, a[..., 3], 0)
        name = f'{anim}_{k}'
        Image.fromarray(base.astype(np.uint8)).save(f'{work}/sw_{name}.webp', 'WEBP', quality=90, method=6)
        Image.fromarray(tint.astype(np.uint8)).save(f'{work}/swt_{name}.webp', 'WEBP', lossless=True)
        # clean frame of the same pose -> horizontal anchor
        clean = fj['anims'].get(anim, fj['anims']['idle'])[min(k, len(fj['anims'].get(anim, fj['anims']['idle'])) - 1)]
        ca = np.array(Image.open(f"{D}/{clean['f']}").convert('RGBA'))
        if anim == 'down':
            dx = 0.0
        else:
            dx = (body_cx(a, lime) - a.shape[1] / 2) - (body_cx(ca, np.zeros(ca.shape[:2], bool)) - ca.shape[1] / 2)
        wj['anims'].setdefault(anim, []).append({'f': f'sw_{name}.webp', 'w': im.width, 'h': im.height, 'dx': round(-dx, 1), 'lime': int(core.sum())})
json.dump(wj, open(f'{work}/frames.json', 'w'))
subprocess.run([sys.executable, f'{here}/belt_masks.py', work], check=True, stdout=subprocess.DEVNULL)
wj = json.load(open(f'{work}/frames.json'))
for anim, lst in wj['anims'].items():
    for k, w in enumerate(lst):
        name = f'{anim}_{k}'
        shutil.copy(f'{work}/sw_{name}.webp', f'{D}/sw_{name}.webp'); shutil.copy(f'{work}/swt_{name}.webp', f'{D}/swt_{name}.webp')
        entry = {'f': f'sw_{name}.webp', 't': f'swt_{name}.webp', 'w': w['w'], 'h': w['h'], 'dx': w['dx']}
        if w.get('belt'): shutil.copy(f"{work}/{w['belt']}", f'{D}/swb_{name}.webp'); entry['b'] = f'swb_{name}.webp'
        if anim in fj['anims'] and k < len(fj['anims'][anim]): fj['anims'][anim][k]['sw'] = entry
        print(D, name, entry, 'lime px', w['lime'])
json.dump(fj, open(f'{D}/frames.json', 'w'), indent=1)
shutil.rmtree(tmp); shutil.rmtree(work)
