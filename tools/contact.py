import sys
from PIL import Image
# contact sheet of several raw images, 2 per row, for quick review
files = sys.argv[2:]; out = sys.argv[1]
ims = [Image.open(f).convert('RGB') for f in files]
for im in ims: im.thumbnail((900, 600))
cols = 2; rows = (len(ims) + 1) // 2
W = 900 * cols; H = 600 * rows
c = Image.new('RGB', (W, H), (60, 60, 60))
for i, im in enumerate(ims): c.paste(im, ((i % cols) * 900, (i // cols) * 600))
c.save(out, quality=85)
