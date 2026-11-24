"""Cut a generated sprite sheet into transparent animation frames.

usage: python3 tools/slice.py <sheet.png> <out_dir> <rows spec> [--key white|magenta|green] [--height 300]
rows spec: comma-separated counts per row with names, e.g. "idle:3+victory:1,run:4,punch:1+kick:1+hurt:1+down:1"
Writes <out_dir>/<anim>_<n>.png and <out_dir>/frames.json
"""
import sys, json, os, warnings
warnings.filterwarnings('ignore')
from collections import deque
from PIL import Image, ImageFilter
import numpy as np

def remove_bg(im, key):
    if key == 'alpha':
        return im.convert('RGBA')
    a = np.array(im.convert('RGBA')).astype(np.int16)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    if key == 'white':
        bgmask = (r > 238) & (g > 238) & (b > 238)
    elif key == 'magenta':
        bgmask = (r > 180) & (b > 180) & (g < 110)
    else:  # green
        bgmask = (g > 170) & (r < 120) & (b < 120)
    h, w = bgmask.shape
    if key == 'white':
        # flood fill from the borders so whites inside the character (eyes, belt) survive
        seen = np.zeros_like(bgmask)
        q = deque()
        for x in range(w):
            for y in (0, h - 1):
                if bgmask[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
        for y in range(h):
            for x in (0, w - 1):
                if bgmask[y, x] and not seen[y, x]: seen[y, x] = True; q.append((y, x))
        while q:
            y, x = q.popleft()
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and bgmask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True; q.append((ny, nx))
        # Enclosed near-white pockets are KEPT by default: they are usually white clothing, fur, teeth or a beard.
        # (Clearing every pocket > 900 px made white tops, cat chests and beards see-through: v16 "accidental
        # transparency" bug.) Real gaps between arms/legs are listed so they can be cleared on purpose with
        # --clear-pockets (all) or --clear-pocket x,y (the pocket containing that sheet pixel; repeatable).
        from scipy import ndimage  # noqa
        lab, n = ndimage.label(bgmask & ~seen)
        sizes = ndimage.sum(np.ones_like(lab), lab, range(1, n + 1))
        picks = [tuple(int(v) for v in sys.argv[k + 1].split(',')) for k, a in enumerate(sys.argv) if a == '--clear-pocket']
        for i, s in enumerate(sizes, 1):
            if s <= 900: continue
            m = lab == i; ys, xs = np.nonzero(m); cx, cy = int(xs.mean()), int(ys.mean())
            if '--clear-pockets' in sys.argv or any(m[py, px] for px, py in picks): seen |= m; print(f'pocket cleared at {cx},{cy} ({int(s)} px)', file=sys.stderr)
            else: print(f'NOTE white pocket kept at {cx},{cy} ({int(s)} px): if it is a gap between limbs, pass --clear-pocket {xs[0]},{ys[0]}', file=sys.stderr)
        bg = seen
    else:
        bg = bgmask
    out = np.array(im.convert('RGBA'))
    out[bg] = (0, 0, 0, 0)
    # de-fringe: soften the 1px edge
    alpha = Image.fromarray(out[..., 3]).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.6))
    res = Image.fromarray(out); res.putalpha(alpha)
    return res

def components(rgba, min_area=2500):
    from scipy import ndimage
    a = np.array(rgba)[..., 3] > 20
    a = ndimage.binary_dilation(a, iterations=6)
    lab, n = ndimage.label(a)
    boxes = []
    for sl in ndimage.find_objects(lab):
        y0, y1, x0, x1 = sl[0].start, sl[0].stop, sl[1].start, sl[1].stop
        if (y1 - y0) * (x1 - x0) >= min_area: boxes.append((x0, y0, x1, y1))
    return boxes

def merge_small(boxes, drop=False):
    if drop:
        hmax = sorted(b[3] - b[1] for b in boxes)[-max(1, len(boxes) // 3)]
        boxes = [b for b in boxes if (b[3] - b[1]) > hmax * 0.3]
    # attach small pieces (music notes, tears, sparkles, props) to the nearest big sprite
    area = lambda b: (b[2] - b[0]) * (b[3] - b[1])
    areas = sorted(area(b) for b in boxes); med = areas[len(areas) // 2]
    big = [list(b) for b in boxes if area(b) >= med * 0.3]
    for b in boxes:
        if area(b) >= med * 0.3: continue
        if drop: continue
        cx, cy = (b[0] + b[2]) / 2, (b[1] + b[3]) / 2
        best = min(big, key=lambda g: (max(g[0] - cx, 0, cx - g[2]) ** 2 + max(g[1] - cy, 0, cy - g[3]) ** 2))
        best[0] = min(best[0], b[0]); best[1] = min(best[1], b[1]); best[2] = max(best[2], b[2]); best[3] = max(best[3], b[3])
    return [tuple(b) for b in big]

def group_rows(boxes, nrows=None):
    # auto-detect rows: boxes whose vertical centres are close belong together
    boxes = sorted(boxes, key=lambda b: (b[1] + b[3]) / 2)
    hs = sorted(b[3] - b[1] for b in boxes); med = hs[len(hs) // 2]
    rows = []
    for b in boxes:
        c = (b[1] + b[3]) / 2
        if rows and abs(c - rows[-1]['c']) < med * 0.45:
            rows[-1]['b'].append(b); rows[-1]['c'] = sum((x[1] + x[3]) / 2 for x in rows[-1]['b']) / len(rows[-1]['b'])
        else: rows.append({'c': c, 'b': [b]})
    return [sorted(r['b'], key=lambda x: x[0]) for r in rows]

def main():
    sheet, out_dir, spec = sys.argv[1], sys.argv[2], sys.argv[3]
    key = 'white'; height = 300
    if '--key' in sys.argv: key = sys.argv[sys.argv.index('--key') + 1]
    if '--height' in sys.argv: height = int(sys.argv[sys.argv.index('--height') + 1])
    os.makedirs(out_dir, exist_ok=True)
    rows_spec = []
    for row in spec.split(','):
        names = []
        for part in row.split('+'):
            nm, cnt = part.split(':'); names += [(nm, i) for i in range(int(cnt))]
        rows_spec.append(names)
    im = Image.open(sheet)
    rgba = remove_bg(im, key)
    if '--min-h' in sys.argv:  # erase small detached bits (text labels, letters)
        from scipy import ndimage
        minh = int(sys.argv[sys.argv.index('--min-h') + 1])
        arr = np.array(rgba); lab, n = ndimage.label(arr[..., 3] > 20)
        for i, sl in enumerate(ndimage.find_objects(lab), 1):
            if sl[0].stop - sl[0].start < minh: arr[lab == i] = (0, 0, 0, 0)
        rgba = Image.fromarray(arr)
    boxes = components(rgba)
    boxes = merge_small(boxes, '--drop-small' in sys.argv)
    rows = group_rows(boxes)
    print('detected rows:', [len(r) for r in rows], file=sys.stderr)
    # common scale: tallest standing frame in row 0 -> height
    ref_h = max(b[3] - b[1] for b in rows[0])
    scale = height / ref_h
    frames = {}
    for r, (row, names) in enumerate(zip(rows, rows_spec)):
        if len(row) != len(names):
            print(f'NOTE row {r}: found {len(row)} sprites, spec has {len(names)}', file=sys.stderr)
        rh = max(b[3] - b[1] for b in row)
        for box, (nm, i) in zip(row, names):
            crop = rgba.crop(box)
            bb = crop.getbbox()
            if bb: crop = crop.crop(bb)
            sub, anim = (nm.split('/') + [None])[:2] if '/' in nm else ('', nm)
            sc = (height / rh) if sub else scale   # each mob row scaled on its own
            crop = crop.resize((max(1, round(crop.width * sc)), max(1, round(crop.height * sc))), Image.LANCZOS)
            d = os.path.join(out_dir, sub); os.makedirs(d, exist_ok=True)
            fn = f'{anim}_{i}.png'; crop.save(os.path.join(d, fn), optimize=True)
            frames.setdefault(sub, {}).setdefault(anim, []).append({'f': fn, 'w': crop.width, 'h': crop.height})
    for sub, an in frames.items():
        json.dump({'refHeight': height, 'anims': an}, open(os.path.join(out_dir, sub, 'frames.json'), 'w'), indent=1)
        print(os.path.join(out_dir, sub), {k: len(v) for k, v in an.items()})

if __name__ == '__main__':
    main()
