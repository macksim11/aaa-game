# Convert sprite frame PNGs to WEBP (keeps transparency) and update frames.json files.
import glob, json, os
from PIL import Image
for fj in glob.glob('assets/*/*/frames.json'):
    d = os.path.dirname(fj); j = json.load(open(fj)); changed = False
    for anim, lst in j['anims'].items():
        for fr in lst:
            if fr['f'].endswith('.png'):
                src = os.path.join(d, fr['f']); dst = src[:-4] + '.webp'
                if os.path.exists(src):
                    Image.open(src).save(dst, 'WEBP', quality=88, method=6)
                    os.remove(src)
                fr['f'] = fr['f'][:-4] + '.webp'; changed = True
    if changed: json.dump(j, open(fj, 'w'), indent=1)
print('done')
