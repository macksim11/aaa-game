# Turns a sprite set drawn with a LIME-GREEN marker handle in the fist into grip data:
#   hands.json[frame] = [x, y, angle]  (handle centre as fraction of the frame, blade direction in degrees, 0 = up, clockwise)
# and erases the marker (filled from the nearest non-marker pixel), so the game draws the real weapon behind the fist.
# usage: python3 tools/grip_handles.py assets/chars/arlo [more dirs]
import json, sys, math, numpy as np
from PIL import Image
from scipy import ndimage
CARRY = '--carry' in sys.argv   # marker stick strapped on the back: weapon drawn behind, handle at the bottom end
for D in [x for x in sys.argv[1:] if not x.startswith('--')]:
    j = json.load(open(f'{D}/frames.json')); hands = {}
    for anim, l in j['anims'].items():
        for k, fr in enumerate(l):
            p = f"{D}/{fr['f']}"; im = Image.open(p).convert('RGBA'); a = np.array(im)
            hsv = np.array(im.convert('RGB').convert('HSV')).astype(float); hue = hsv[..., 0] * 360 / 255; sat = hsv[..., 1] / 255; val = hsv[..., 2] / 255
            lime = (a[..., 3] > 80) & (hue > 85) & (hue < 150) & (sat > 0.6) & (val > 0.7) & (a[..., 1] > 190) & (a[..., 0] < 150)   # pure bright marker lime only (not a green roof)
            lime = ndimage.binary_dilation(lime, iterations=1) & (a[..., 3] > 20) & (hue > 70) & (hue < 165) & (sat > 0.25)
            if lime.sum() < 40: continue
            lab, n = ndimage.label(lime)
            # the held handle is the one with the most skin (the fist) right around it
            skin = (a[..., 3] > 150) & (hue > 10) & (hue < 40) & (sat > 0.15) & (sat < 0.55) & (val > 0.7)
            def fist(i): return ((ndimage.binary_dilation(lab == i, iterations=7) & skin).sum(), (lab == i).sum())
            main = lab == (max(range(1, n + 1), key=lambda i: (lab == i).sum()) if CARRY else max(range(1, n + 1), key=fist))   # carry: the long stick itself
            ys, xs = np.nonzero(main); cx, cy = xs.mean(), ys.mean()
            cov = np.cov(np.vstack([xs - cx, ys - cy])); w, v = np.linalg.eigh(cov); dx, dy = v[:, np.argmax(w)]
            body = (a[..., 3] > 100) & ~lime; bys, bxs = np.nonzero(body); bcx = bxs.mean()
            if abs(dy) > 0.35: dx, dy = (dx, dy) if dy < 0 else (-dx, -dy)          # mostly vertical: blade points up
            else: dx, dy = (dx, dy) if (cx + dx * 10 - bcx) * (cx - bcx) >= 0 and abs(cx + dx - bcx) > abs(cx - bcx) else (-dx, -dy)   # horizontal: blade away from the body
            ang = (math.degrees(math.atan2(dx, -dy)) + 360) % 360
            # does the blade (about 0.45 of the frame height long) cross his head? then it is drawn behind him
            if CARRY:
                if dy > 0: dx, dy = -dx, -dy                                   # blade points up along the stick
                proj = (xs - cx) * dx + (ys - cy) * dy; lo = proj.min()
                gx, gy = cx + dx * lo * 0.75, cy + dy * lo * 0.75              # handle near the bottom end
                ang = (math.degrees(math.atan2(dx, -dy)) + 360) % 360
                hands[f'{anim}_{k}'] = [round(gx / a.shape[1], 3), round(gy / a.shape[0], 3), round(ang), 1]
                _, (iy, ix) = ndimage.distance_transform_edt(lime, return_indices=True)
                ring = ndimage.binary_dilation(lime, iterations=5) & ~lime
                lime = lime | (ring & (((hue > 45) & (hue < 170) & (sat > 0.12)) | (val < 0.5) | ((hue > 25) & (hue < 90) & (sat > 0.2) & (val < 0.75))) & ~((hue > 10) & (hue < 40) & (sat > 0.15) & (sat < 0.6) & (val > 0.72)))
                _, (iy, ix) = ndimage.distance_transform_edt(lime, return_indices=True)
                a[lime] = a[iy[lime], ix[lime]]; Image.fromarray(a).save(p, 'WEBP', quality=92)
                continue
            H0, W0 = a.shape[:2]; op = a[..., 3] > 100; rows = np.nonzero(op.any(1))[0]; head_bottom = rows.min() + (rows.max() - rows.min()) * 0.42
            # the head = the widest opaque part above head_bottom, minus raised arms: use the columns of the hair/face blob
            headblob = op.copy(); headblob[int(head_bottom):] = False
            lab_h, n_h = ndimage.label(headblob)
            if n_h: sz = ndimage.sum(headblob, lab_h, range(1, n_h + 1)); headblob = lab_h == (int(np.argmax(sz)) + 1)
            hx = np.nonzero(headblob.any(0))[0]; hx0, hx1 = (hx.min() + (hx.max() - hx.min()) * 0.08, hx.max() - (hx.max() - hx.min()) * 0.08) if len(hx) else (0, 0)
            def head_hits(ux, uy):
                n = 0
                for t in np.linspace(0.12, 1.0, 24):
                    px, py = int(cx + ux * t * H0 * 0.5), int(cy + uy * t * H0 * 0.5)
                    if 0 <= px < W0 and 0 <= py < H0 and py < head_bottom and hx0 <= px <= hx1 and headblob[py, px]: n += 1
                return n
            behind = 0
            if head_hits(dx, dy) >= 2:
                # try other natural directions before hiding it: straight up, up-forward, up-back, the other way, forward
                for cand in [0, 30, 330, (ang + 180) % 360, 90]:
                    ux, uy = math.sin(math.radians(cand)), -math.cos(math.radians(cand))
                    if head_hits(ux, uy) < 2: dx, dy, ang = ux, uy, cand; break
                else: behind = 1
            hands[f'{anim}_{k}'] = [round(cx / a.shape[1], 3), round(cy / a.shape[0], 3), round(ang), behind]
            # the handle's dark outline + anti-aliasing: a ring around every marker blob that is dark or greenish
            ring = ndimage.binary_dilation(lime, iterations=5) & ~lime
            greenish = (hue > 45) & (hue < 170) & (sat > 0.12)
            dark = val < 0.5
            olive = (hue > 25) & (hue < 90) & (sat > 0.2) & (val < 0.75)        # brown/olive blend of the marker's outline
            skinny = (hue > 10) & (hue < 40) & (sat > 0.15) & (sat < 0.6) & (val > 0.72)
            lime = lime | (ring & (greenish | dark | olive) & ~skinny)
            # erase every marker pixel: copy the nearest non-marker pixel (keeps the fist, clears what stuck out)
            _, (iy, ix) = ndimage.distance_transform_edt(lime, return_indices=True)
            a[lime] = a[iy[lime], ix[lime]]
            Image.fromarray(a).save(p, 'WEBP', quality=92)
            # FIST layer: the hand pixels around the handle, drawn on top of the weapon so the fingers wrap around it
            hsv2 = np.array(Image.fromarray(a).convert('RGB').convert('HSV')).astype(float)
            h2, s2, v2 = hsv2[..., 0] * 360 / 255, hsv2[..., 1] / 255, hsv2[..., 2] / 255
            skin2 = (a[..., 3] > 150) & (h2 > 8) & (h2 < 42) & (s2 > 0.12) & (v2 > 0.55)
            near = ndimage.binary_dilation(main, iterations=9)
            lab2, n2 = ndimage.label(skin2 & near)
            fist_m = np.zeros_like(skin2)
            if n2:
                sz = ndimage.sum(skin2 & near, lab2, range(1, n2 + 1)); fist_m = lab2 == (int(np.argmax(sz)) + 1)
                fist_m = ndimage.binary_fill_holes(fist_m)
                fist_m = ndimage.binary_dilation(fist_m, iterations=2) & (a[..., 3] > 60)   # include the fist's outline
            f = a.copy(); f[..., 3] = np.where(fist_m, a[..., 3], 0)
            fname = 'fist_' + fr['f']; Image.fromarray(f).save(f'{D}/{fname}', 'WEBP', lossless=True); fr['fist'] = fname
    json.dump(hands, open(f'{D}/hands.json', 'w')); json.dump(j, open(f'{D}/frames.json', 'w'), indent=1)
    print(D, len(hands), 'grips')
