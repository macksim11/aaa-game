# Grip points for CLEAN sprites (no marker): the weapon is drawn BEHIND the sprite with its handle under the fist,
# so the fingers the artist drew wrap around it. No pixels of the sprite are ever edited (ARES visual mission 2026-11-23:
# erasing marker pixels left smears and specks).
# For each frame: start from a hint point (the hand that holds), snap to the centre of the nearest skin-coloured hand
# blob, and give the blade the pose's natural direction (0 = up, clockwise). Writes hands.json: [x, y, angle, 1].
# usage: python3 tools/clean_grips.py assets/chars/arlo [more dirs]
import json, sys, numpy as np
from PIL import Image
from scipy import ndimage
# which hand holds, as a hint (fraction of the frame), and where the blade points, per pose
POSE = {'idle': ((0.77, 0.79), 40), 'victory': ((0.91, 0.34), 0), 'run_0': ((0.54, 0.76), 60), 'run_1': ((0.73, 0.64), 70), 'run_2': ((0.71, 0.75), 60),
        'run_3': ((0.75, 0.65), 70), 'punch': ((0.93, 0.6), 90), 'kick': ((0.32, 0.64), 285), 'hurt': ((0.75, 0.67), 135)}
for D in sys.argv[1:]:
    j = json.load(open(f'{D}/frames.json')); hands = {}
    for anim, l in j['anims'].items():
        for k, fr in enumerate(l):
            hint = POSE.get(f'{anim}_{k}') or POSE.get(anim)
            if not hint: continue
            a = np.array(Image.open(f"{D}/{fr['f']}").convert('RGBA')); H, W = a.shape[:2]
            hsv = np.array(Image.fromarray(a).convert('RGB').convert('HSV')).astype(float)
            h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
            skin = (a[..., 3] > 150) & (h > 8) & (h < 40) & (s > 0.15) & (s < 0.6) & (v > 0.62)
            skin = ndimage.binary_opening(skin, iterations=1)
            lab, n = ndimage.label(skin)
            (hx, hy), ang = hint; px, py = hx * W, hy * H
            best = None
            for i in range(1, n + 1):
                ys, xs = np.nonzero(lab == i)
                if not (60 < len(xs) < 0.04 * W * H): continue          # a hand, not a speck and not the face or legs
                d = np.hypot(xs.mean() - px, ys.mean() - py)
                if d < 0.14 * H and (best is None or d < best[0]): best = (d, xs.mean(), ys.mean())
            gx, gy = (best[1], best[2]) if best else (px, py)
            hands[f'{anim}_{k}'] = [round(gx / W, 3), round(gy / H, 3), ang, 1]
            if not best: print('no hand found near the hint:', D, anim, k)
    json.dump(hands, open(f'{D}/hands.json', 'w'), indent=None, separators=(',', ':')); print(D, len(hands), 'grips')
