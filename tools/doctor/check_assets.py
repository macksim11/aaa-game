# Doctor: art & data checks.  python3 tools/doctor/check_assets.py [--fix]
# - every frame / belt file listed in every frames.json exists
# - every icon referenced by the code exists; icons/list.json is up to date
# - no icon has stray fragments of a neighbouring icon (pieces touching the edge)
# - every Arlo sprite set has hands.json (weapon grips)
# - every background referenced exists
# - no sprite has a SEE-THROUGH hole inside the figure (v16: white tops / cat chest / beards keyed out by the
#   sheet cutter). Enclosed transparent areas that are real gaps (bow strings, wheel spokes, between legs) are listed
#   after a look by eye in tools/doctor/holes_ok.json; anything else fails. --holes-baseline rewrites that list.
# - armed frames (sw / arm entries in frames.json) exist with their masks
# Prints problems; with --fix repairs what it can (icon list, icon fragments) and re-checks.
import json, os, re, sys, glob, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); os.chdir(ROOT)
FIX = '--fix' in sys.argv

HOLES_OK = 'tools/doctor/holes_ok.json'
def enclosed_holes(path):
    a = np.array(Image.open(path).convert('RGBA'))[..., 3] < 200
    lab, n = ndimage.label(a)
    border = set(np.unique(np.concatenate([lab[0], lab[-1], lab[:, 0], lab[:, -1]])))
    sizes = ndimage.sum(a, lab, range(1, n + 1))
    return int(sum(s for i, s in enumerate(sizes, 1) if i not in border and s >= 150))
def sprite_files():
    for f in sorted(glob.glob('assets/**/*.webp', recursive=True)):
        b = os.path.basename(f)
        if any(x in f for x in ('/icons/', '/bg/', '/story/')) or b.startswith(('belt_', 'swt_', 'swb_', 'ab_')): continue
        yield f
def see_through_holes():
    ok = json.load(open(HOLES_OK)) if os.path.exists(HOLES_OK) else {}
    if '--holes-baseline' in sys.argv:
        json.dump({f: h for f in sprite_files() if (h := enclosed_holes(f))}, open(HOLES_OK, 'w'), indent=0); return []
    out = []
    for f in sprite_files():
        h = enclosed_holes(f)
        if h and h > ok.get(f, 0) * 1.15 + 40:
            out.append(('see-through', f'{f}: {h} px of see-through area enclosed by the figure (white clothing/fur keyed out?). Fill it from the raw sheet; if it is a real gap, look at it and add it to {HOLES_OK}'))
    return out

def check():
    probs = []
    # frames
    for fj in glob.glob('assets/**/frames.json', recursive=True):
        D = os.path.dirname(fj); j = json.load(open(fj))
        for anim, l in j.get('anims', {}).items():
            if not l: probs.append(('frames', f'{D}: animation "{anim}" has no frames'))
            for fr in l:
                if not os.path.exists(f"{D}/{fr['f']}"): probs.append(('frames', f"{D}/{fr['f']} missing"))
                if 'belt' in fr and not os.path.exists(f"{D}/{fr['belt']}"): probs.append(('frames', f"{D}/{fr['belt']} missing"))
                for e in ([fr['sw']] if 'sw' in fr else []) + list(fr.get('arm', {}).values()):
                    for k in ('f', 't', 'b'):
                        if k in e and not os.path.exists(f"{D}/{e[k]}"): probs.append(('frames', f"{D}/{e[k]} missing (armed pose)"))
    probs += see_through_holes()
    for D in glob.glob('assets/chars/arlo*'):
        if os.path.isdir(D) and not os.path.exists(D + '/hands.json'): probs.append(('weapons', f'{D}/hands.json missing (weapons would not show)'))
    # icons
    have = {f[:-5] for f in os.listdir('assets/icons') if f.endswith('.webp')}
    try: listed = set(json.load(open('assets/icons/list.json')))
    except Exception: listed = set()
    if listed != have: probs.append(('icon-list', f'assets/icons/list.json out of date ({len(have ^ listed)} differences)'))
    code = ''.join(open(p).read() for p in glob.glob('js/**/*.js', recursive=True))
    used = set(re.findall(r"icon\(\s*'([a-z0-9_]+)'", code)) | set(re.findall(r"'(g_[a-z0-9_]+)'", code))
    used |= set(re.findall(r":\s*'([a-z0-9_]+)'", re.search(r'EMOJI_ICON = \{(.*?)\};', code, re.S).group(1)))
    for n in sorted(used):
        if n.endswith('_'): continue   # name is built in code, e.g. 'chest_' + id
        if n not in have and not n.startswith('g_'): probs.append(('icon-missing', f'icon "{n}" is used in the code but assets/icons/{n}.webp does not exist'))
    # gear icons
    gear = re.findall(r"^\s+([a-z_]+):\s+\{ slot:", open('js/data/gear.js').read(), re.M)
    for g in gear:
        if f'g_{g}' not in have: probs.append(('icon-missing', f'gear "{g}" has no icon g_{g}.webp'))
    # stray fragments in icons
    for n in sorted(have):
        a = np.array(Image.open(f'assets/icons/{n}.webp').convert('RGBA'))[..., 3] > 40
        lab, k = ndimage.label(ndimage.binary_dilation(a, iterations=2))
        if k <= 1: continue
        sizes = ndimage.sum(a, lab, range(1, k + 1)); big = sizes.max(); H, W = a.shape
        for i in range(1, k + 1):
            if sizes[i - 1] == big or sizes[i - 1] < 6: continue
            ys, xs = np.nonzero(lab == i)
            if (ys.min() <= 1 or xs.min() <= 1 or ys.max() >= H - 2 or xs.max() >= W - 2) and sizes[i - 1] < big * 0.12:
                probs.append(('icon-fragment', f'icon "{n}" has a stray fragment at the edge')); break
    # backgrounds
    for b in set(re.findall(r"bg_[a-z_]+", code)):
        if b.endswith('_'): continue
        if not os.path.exists(f'assets/bg/{b}.webp'): probs.append(('bg-missing', f'background {b}.webp missing'))
    # images referenced by literal path
    for p in set(re.findall(r"['\"`](assets/[A-Za-z0-9_/.-]+\.(?:webp|png|json))['\"`]", code)):
        if not os.path.exists(p): probs.append(('file-missing', f'{p} referenced in code but missing'))
    return probs

probs = check()
if FIX and probs:
    kinds = {k for k, _ in probs}
    if 'icon-fragment' in kinds: subprocess.run([sys.executable, '-W', 'ignore', 'tools/icons_slice.py'], capture_output=True)
    if kinds & {'icon-list', 'icon-fragment'}: subprocess.run([sys.executable, 'tools/icon_list.py'], capture_output=True)
    after = check()
    fixed = len(probs) - len(after)
    if fixed > 0: print(f'AUTO-FIXED {fixed} problem(s)')
    probs = after
for k, m in probs: print(f'ASSET [{k}] {m}')
print(f'{len(probs)} asset problems')
sys.exit(1 if probs else 0)
