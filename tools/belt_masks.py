# Finds Arlo's white belt in every frame and saves a shading mask (belt_<frame>.webp)
# so the game can repaint the belt in his current belt colour.
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
D = 'assets/chars/arlo'
j = json.load(open(f'{D}/frames.json'))
out = {}
for anim, frames in j['anims'].items():
    for fr in frames:
        fr.pop('belt', None)
        im = np.array(Image.open(f"{D}/{fr['f']}").convert('RGBA')).astype(int)
        r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
        mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
        white = (a > 200) & (mn > 150) & (mx - mn < 45)
        H, W = white.shape
        blue = (b > r + 40) & (a > 150)                       # iris colour, to reject eye whites
        near_blue = ndimage.binary_dilation(blue, iterations=3)
        lab, n = ndimage.label(white)
        if not n: continue
        idx = range(1, n + 1)
        sizes = np.array(ndimage.sum(white, lab, idx))
        solid = ndimage.binary_erosion(white, iterations=2)
        solid_n = np.array(ndimage.sum(solid, lab, idx))
        eyeish = np.array(ndimage.sum(near_blue, lab, idx)) > 0
        cy = np.array([c[0] for c in ndimage.center_of_mass(white, lab, idx)])
        ok = (solid_n > 4) & ~eyeish & (cy > H * 0.5)
        if not ok.any(): continue
        seed = int(np.argmax(np.where(ok, sizes, 0))) + 1
        if sizes[seed - 1] < 60: continue
        m = lab == seed
        # grow: add nearby solid white pieces (knot + tails) that touch the belt after a small gap
        for _ in range(4):
            near = ndimage.binary_dilation(m, iterations=9)
            add = [i for i in idx if ok[i - 1] and not m[lab == i].any() and (near & (lab == i)).any()]
            if not add: break
            for i in add: m |= lab == i
        m = ndimage.binary_dilation(m, iterations=1) & (mn > 110) & (a > 150) & ~near_blue
        lum = (0.3 * r + 0.59 * g + 0.11 * b)
        shade = np.clip(lum / 235 * 255, 0, 255)
        mask = np.zeros((H, W, 4), np.uint8)
        mask[..., 0] = mask[..., 1] = mask[..., 2] = shade.astype(np.uint8)
        mask[..., 3] = np.where(m, 255, 0)
        name = 'belt_' + fr['f']
        Image.fromarray(mask).save(f'{D}/{name}', 'WEBP', quality=90, lossless=True)
        fr['belt'] = name
json.dump(j, open(f'{D}/frames.json', 'w'), indent=1)
print('ok')
