# Makes round-avatar portraits (head and shoulders) from each character's first idle frame.
import sys, os, numpy as np
from PIL import Image
def face(key, out, frac=0.78, pad=0.1):
    im = Image.open(f'assets/chars/{key}/idle_0.webp').convert('RGBA')
    # paint any magenta marker belt white for the portrait
    arr = np.array(im); hsv = np.array(im.convert('RGB').convert('HSV')).astype(float)
    mk = (arr[..., 3] > 100) & (hsv[..., 0] * 360 / 255 >= 296) & (hsv[..., 0] * 360 / 255 <= 332) & (hsv[..., 1] > 127)
    v = hsv[..., 2][mk]; arr[mk, 0] = arr[mk, 1] = arr[mk, 2] = np.clip(v * 0.97, 0, 255).astype(np.uint8); im = Image.fromarray(arr)
    a = np.array(im)[..., 3] > 40; H, W = a.shape
    top = np.argmax(a.any(1))
    head = a[top: top + int(H * 0.45)]
    xs = np.nonzero(head.any(0))[0]; cx = (xs.min() + xs.max()) / 2
    side = int(H * frac)
    y0 = top - int(side * pad); x0 = int(cx - side / 2)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(im.crop((max(0, x0), max(0, y0), x0 + side, y0 + side)), (max(0, -x0), max(0, -y0)))
    canvas.resize((192, 192), Image.Resampling.LANCZOS).save(out, 'WEBP', quality=92)
for k in sys.argv[1:] or ['arlo', 'nana', 'papi', 'mom', 'papa', 'alyzee', 'eveah', 'emery']:
    face(k, f'assets/ui/face_{k}.webp')
print('ok')
