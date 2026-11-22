# Finds Arlo's white belt in every frame and saves a shading mask (belt_<frame>.webp)
# so the game can repaint the belt in his current belt colour.
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage
def run(D):
  j = json.load(open(f'{D}/frames.json'))
  for anim, frames in j['anims'].items():
      for fr in frames:
          fr.pop('belt', None)
          im = np.array(Image.open(f"{D}/{fr['f']}").convert('RGBA')).astype(int)
          r, g, b, a = im[..., 0], im[..., 1], im[..., 2], im[..., 3]
          mx, mn = np.maximum(np.maximum(r, g), b), np.minimum(np.minimum(r, g), b)
          strict = 'arlo_' in D                                   # armor variants: belt is the brightest pure white
          white = (a > 200) & (mn > (222 if strict else 150)) & (mx - mn < (28 if strict else 45))
          hsv = np.array(Image.open(f"{D}/{fr['f']}").convert('RGB').convert('HSV')).astype(float)
          hue, sat = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255
          # marker belt = pure magenta (hue ~300-330, strong colour). Pig pink (~0) and the purple car (~288, weaker) don't match.
          magenta = (a > 150) & (hue >= 296) & (hue <= 332) & (sat > 0.5) & (r > 120)
          magenta = ndimage.binary_opening(magenta, iterations=1) | (magenta & ndimage.binary_dilation(ndimage.binary_opening(magenta, iterations=1), iterations=2))
          if magenta.sum() > 40:
              m = ndimage.binary_dilation(magenta, iterations=1) & (a > 120)
              shade = np.clip((0.5 * r + 0.5 * b) / 255 * 255, 0, 255)
              mask = np.zeros((H0 := magenta.shape[0], magenta.shape[1], 4), np.uint8)
              mask[..., 0] = mask[..., 1] = mask[..., 2] = shade.astype(np.uint8); mask[..., 3] = np.where(m, 255, 0)
              name = 'belt_' + fr['f']; Image.fromarray(mask).save(f'{D}/{name}', 'WEBP', lossless=True)
              fr['belt'] = name; fr['beltAlways'] = 1
              continue
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
          navy = (b > r + 8) & (mx < 120) & (a > 200)
          above = np.zeros_like(navy); above[8:] = navy[:-8]
          under_shirt = np.array(ndimage.sum(above, lab, idx)) / np.maximum(sizes, 1)
          ok = (solid_n > 4) & ~eyeish & ((cy > H * 0.5) if 'chars' in D else (under_shirt > 0.08))
          if not ok.any(): continue
          seed = int(np.argmax(np.where(ok, sizes, 0))) + 1
          if sizes[seed - 1] < 60: continue
          m = lab == seed
          # knot and tails: any solid white piece next to the belt, not huge (not the white chicken / golf cart), near belt height
          sy = cy[seed - 1]
          grow_ok = (solid_n > 1) & ~eyeish & (sizes < sizes[seed - 1] * 3 + 200) & (np.abs(cy - sy) < H * 0.2)
          # grow: add nearby solid white pieces (knot + tails) that touch the belt after a small gap
          for _ in range(4):
              near = ndimage.binary_dilation(m, iterations=9)
              add = [i for i in idx if grow_ok[i - 1] and not m[lab == i].any() and (near & (lab == i)).any()]
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
  for anim, frames in j['anims'].items():
      for fr in frames:
          if 'belt' in fr:
              bm = np.array(Image.open(f"{D}/{fr['belt']}"))[..., 3] > 0
              if bm.any():
                  ys, xs = np.nonzero(bm); fr['beltC'] = [round(xs.mean() / bm.shape[1], 3), round(ys.mean() / bm.shape[0], 3)]
  json.dump(j, open(f'{D}/frames.json', 'w'), indent=1)
dirs = sys.argv[1:] or ['assets/chars/arlo']
for d in dirs: run(d)
print('ok')
