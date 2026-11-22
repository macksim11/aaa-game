# Diagnostic: every Arlo / ride frame must have its belt fully covered by the belt mask.
# (1) any magenta marker pixel NOT in the mask would show up pink in the game  -> problem
# (2) frames where the belt is visible but there is no mask at all               -> problem
# (3) mask that is suspiciously large (grabbed a vehicle / clothing)               -> problem
import json, os, sys, numpy as np
from PIL import Image
from scipy import ndimage
dirs = sorted([f'assets/chars/{x}' for x in os.listdir('assets/chars') if x.startswith('arlo')] + [f'assets/rides/{x}' for x in os.listdir('assets/rides')])
bad = []
for D in dirs:
    if not os.path.isdir(D): continue
    j = json.load(open(D + '/frames.json'))
    for anim, l in j['anims'].items():
        for fr in l:
            a = np.array(Image.open(f"{D}/{fr['f']}").convert('RGBA')).astype(int); r, g, b, al = [a[..., i] for i in range(4)]
            hsv = np.array(Image.open(f"{D}/{fr['f']}").convert('RGB').convert('HSV')).astype(float); hue, sat = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255
            magenta = (al > 150) & (hue >= 296) & (hue <= 332) & (sat > 0.5) & (r > 120)
            m = np.array(Image.open(f"{D}/{fr['belt']}"))[..., 3] > 0 if 'belt' in fr else np.zeros_like(magenta)
            uncovered = int(ndimage.binary_opening(magenta & ~ndimage.binary_dilation(m, iterations=1), iterations=1).sum())   # solid chunks only (thin outline specks aren't belt)
            if uncovered > 12: bad.append(f'{D}/{fr["f"]}: {uncovered} pink belt pixels not repainted')
            if not fr.get('beltAlways') and anim != 'down': bad.append(f'{D}/{fr["f"]}: not using a marker belt (may stay white)')
            if m.sum() > (al > 150).sum() * 0.2: bad.append(f'{D}/{fr["f"]}: belt mask too large ({int(m.sum())} px)')
for b in bad: print('BELT', b)
print(f'{len(bad)} belt problems'); sys.exit(1 if bad else 0)
