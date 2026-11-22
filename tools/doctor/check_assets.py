# Doctor: art & data checks.  python3 tools/doctor/check_assets.py [--fix]
# - every frame / belt file listed in every frames.json exists
# - every icon referenced by the code exists; icons/list.json is up to date
# - no icon has stray fragments of a neighbouring icon (pieces touching the edge)
# - every Arlo sprite set has hands.json (weapon grips)
# - every background referenced exists
# Prints problems; with --fix repairs what it can (icon list, icon fragments) and re-checks.
import json, os, re, sys, glob, subprocess
import numpy as np
from PIL import Image
from scipy import ndimage
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')); os.chdir(ROOT)
FIX = '--fix' in sys.argv

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
