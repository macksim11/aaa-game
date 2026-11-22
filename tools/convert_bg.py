# Convert generated backgrounds / story slides to web-friendly WEBP.
import sys, os, glob
from PIL import Image
def conv(src, dst, max_h):
    im = Image.open(src).convert('RGB')
    if im.height > max_h: im = im.resize((round(im.width * max_h / im.height), max_h), Image.Resampling.LANCZOS)
    im.save(dst, 'WEBP', quality=84, method=6)
os.makedirs('assets/bg', exist_ok=True); os.makedirs('assets/story', exist_ok=True)
for f in glob.glob('art-gen/raw/bg_*.png'):
    conv(f, 'assets/bg/' + os.path.basename(f)[:-4] + '.webp', 900)
for f in glob.glob('art-gen/raw/s[0-9][0-9]_*.png') + glob.glob('art-gen/raw/e[0-9][0-9]_*.png') + glob.glob('art-gen/raw/rescue_*.png'):
    conv(f, 'assets/story/' + os.path.basename(f)[:-4] + '.webp', 1400)
[os.remove('assets/story/' + f) for f in os.listdir('assets/story') if '_v1' in f]
print(sorted(os.listdir('assets/bg')), sorted(os.listdir('assets/story')))
