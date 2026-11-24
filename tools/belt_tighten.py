# Keep a magenta belt mask on the belt: only mask pixels within 4 px of bright belt magenta (v16: a purple hoodie's
# dark shading passed the magenta test and was repainted in the belt colour).  usage: belt_tighten.py <img> <mask> ...
import sys, numpy as np
from PIL import Image
from scipy import ndimage
def tighten(img, mask):
    a = np.array(Image.open(img).convert('RGB')); m = np.array(Image.open(mask).convert('RGBA'))
    h = np.array(Image.fromarray(a).convert('HSV')).astype(float); hue, sat, val = h[..., 0] * 360 / 255, h[..., 1] / 255, h[..., 2] / 255
    seed = (hue >= 296) & (hue <= 335) & (sat > 0.55) & (val > 0.72)
    keep = (m[..., 3] > 0) & ndimage.binary_dilation(seed, iterations=4)
    m[..., 3] = np.where(keep, m[..., 3], 0); Image.fromarray(m).save(mask, 'WEBP', lossless=True)
    return int(keep.sum())
if __name__ == '__main__':
    for i in range(1, len(sys.argv), 2): print(sys.argv[i + 1], tighten(sys.argv[i], sys.argv[i + 1]))
