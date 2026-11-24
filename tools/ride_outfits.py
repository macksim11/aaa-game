# RIDES IN EVERY OUTFIT (v16): the ride sheets art-gen/raw/mk_ride{1,2,3}.png were edited (Nano Banana) so Arlo wears each
# armour/outfit: art-gen/raw/mkr_<outfit>_<n>.png, same layout. This cuts them and stores, next to each ride frame,
#   o_<outfit>_<frame>.webp (+ ob_<outfit>_<frame>.webp belt mask) and in frames.json  "o": {"<outfit>": {f, b, w, h, dx}}
# Each new frame is scaled to the existing frame's height and shifted (dx) so it sits exactly where the original does:
# the weapon carry (hands.json, RIDE_BACK) and belt positions keep working.
# usage: python3 tools/ride_outfits.py [outfit ...]   (default: all five)
import sys, os, json, subprocess, tempfile, shutil
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); from belt_tighten import tighten
here = os.path.dirname(os.path.abspath(__file__)); os.chdir(os.path.join(here, '..'))
SHEETS = {1: ['bike', 'ebike', 'horse'], 2: ['hippo', 'pig', 'camel'], 3: ['chicken', 'golfcart', 'car']}
OUTFITS = sys.argv[1:] or ['hoodie', 'karate_gi', 'leather_tunic', 'iron_chest', 'diamond_chest']

def shift(a, ca):
    """horizontal shift that best overlays the new frame's shape on the original (both bottom-aligned)"""
    A = a[..., 3] > 128; C = ca[..., 3] > 128
    h = min(A.shape[0], C.shape[0]); A = A[-h:]; C = C[-h:]
    cA, cC = A.shape[1] / 2, C.shape[1] / 2; best = (-1, 0)
    for d in range(-40, 41):
        x0 = int(round(cA - cC - d)); j0, j1 = max(0, -x0), min(C.shape[1], A.shape[1] - x0)
        if j1 <= j0: continue
        sc = (C[:, j0:j1] & A[:, j0 + x0:j1 + x0]).sum()
        if sc > best[0]: best = (sc, d)
    return best[1]

for o in OUTFITS:
    for n, rides in SHEETS.items():
        sheet = f'art-gen/raw/mkr_{o}_{n}.png'
        tmp = tempfile.mkdtemp()
        spec = ','.join(f'{r}/ride:2+{r}/charge:1' for r in rides)
        subprocess.run([sys.executable, f'{here}/slice.py', sheet, tmp, spec, '--key', 'white', '--clear-outlined'], check=True, stderr=subprocess.DEVNULL)
        for r in rides:
            D = f'assets/rides/{r}'; fj = json.load(open(f'{D}/frames.json')); tj = json.load(open(f'{tmp}/{r}/frames.json'))
            work = tempfile.mkdtemp(); wj = {'refHeight': fj['refHeight'], 'anims': {}}
            for anim, lst in tj['anims'].items():
                for k, fr in enumerate(lst):
                    old = fj['anims'][anim][k]; ca = np.array(Image.open(f"{D}/{old['f']}").convert('RGBA'))
                    im = Image.open(f"{tmp}/{r}/{fr['f']}").convert('RGBA')
                    im = im.resize((max(1, round(im.width * ca.shape[0] / im.height)), ca.shape[0]), Image.LANCZOS)
                    a = np.array(im); dx = shift(a, ca)
                    # white left inside the wheels / between legs: transparent wherever the original frame is transparent there
                    h = min(a.shape[0], ca.shape[0]); x0 = int(round(a.shape[1] / 2 - ca.shape[1] / 2 - dx))
                    oa = np.zeros(a.shape[:2], bool); j0, j1 = max(0, -x0), min(ca.shape[1], a.shape[1] - x0)
                    oa[-h:, j0 + x0:j1 + x0] = ca[-h:, j0:j1, 3] < 40
                    wh = (a[..., :3].min(2) > 228) & (a[..., 3] > 0)
                    a[oa & wh, 3] = 0; im = Image.fromarray(a)
                    name = f'o_{o}_{anim}_{k}.webp'; im.save(f'{work}/{name}', 'WEBP', quality=90, method=6)
                    wj['anims'].setdefault(anim, []).append({'f': name, 'w': im.width, 'h': im.height, 'dx': dx})
            json.dump(wj, open(f'{work}/frames.json', 'w'))
            subprocess.run([sys.executable, f'{here}/belt_masks.py', work], check=True, stdout=subprocess.DEVNULL)
            wj = json.load(open(f'{work}/frames.json'))
            for anim, lst in wj['anims'].items():
                for k, w in enumerate(lst):
                    shutil.copy(f"{work}/{w['f']}", f"{D}/{w['f']}")
                    e = {'f': w['f'], 'w': w['w'], 'h': w['h'], 'dx': w['dx']}
                    if w.get('belt'): b = 'ob_' + w['f'][2:]; shutil.copy(f"{work}/{w['belt']}", f'{D}/{b}'); e['b'] = b; tighten(f"{D}/{w['f']}", f'{D}/{b}')
                    fj['anims'][anim][k].setdefault('o', {})[f'arlo_{o}'] = e
                    print(D, w['f'], e)
            json.dump(fj, open(f'{D}/frames.json', 'w'), indent=1)
            shutil.rmtree(work)
        shutil.rmtree(tmp)
