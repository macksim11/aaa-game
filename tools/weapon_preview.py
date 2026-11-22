# Renders Arlo holding a weapon in every pose (same math as drawWeapon in sheets.js) -> for checking grips.
import json, sys, math
from PIL import Image
GRIP = { 'hockey_stick': ([0.82, 0.14], 225, 1), 'bo_staff': ([0.5, 0.5], 45, 1.25), 'nunchucks': ([0.18, 0.86], 15, 0.8), 'diamond_pick': ([0.12, 0.9], 45, 1) }
def render(sheet, weapon, behind, out, H=260):
    D = f'assets/chars/{sheet}'; j = json.load(open(D + '/frames.json')); hands = json.load(open(D + '/hands.json'))
    g = GRIP.get(weapon, ([0.18, 0.85], 45, 1)); wimg = Image.open(f'assets/icons/g_{weapon}.webp').convert('RGBA')
    frames = [(f'{a}_{k}', fr) for a, l in j['anims'].items() for k, fr in enumerate(l)]
    tiles = []
    for key, fr in frames:
        im = Image.open(f"{D}/{fr['f']}").convert('RGBA'); sc = H / j['refHeight']; im = im.resize((round(im.width * sc), round(im.height * sc)))
        canvas = Image.new('RGBA', (im.width + 160, im.height + 120), (90, 140, 90, 255)); ox, oy = 80, 60
        layer = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
        if key in hands:
            hx, hy, ang = hands[key]; S = round(H * 0.44 * g[2])
            w = wimg.resize((S, S)); px, py = g[0][0] * S, g[0][1] * S
            big = Image.new('RGBA', (S * 3, S * 3), (0, 0, 0, 0)); big.paste(w, (S + round(S / 2 - px), S + round(S / 2 - py)), w)
            rot = big.rotate(-(ang - g[1]), resample=Image.Resampling.BICUBIC, center=(1.5 * S, 1.5 * S))
            cx, cy = ox + hx * im.width, oy + hy * im.height
            layer.alpha_composite(rot, (round(cx - 1.5 * S), round(cy - 1.5 * S)))
        if behind: canvas.alpha_composite(layer); canvas.alpha_composite(im, (ox, oy))
        else: canvas.alpha_composite(im, (ox, oy)); canvas.alpha_composite(layer)
        tiles.append(canvas)
    Wt = sum(t.width for t in tiles); sheet_img = Image.new('RGBA', (Wt, max(t.height for t in tiles)), (90, 140, 90, 255)); x = 0
    for t in tiles: sheet_img.alpha_composite(t, (x, 0)); x += t.width
    sheet_img.save(out)
if __name__ == '__main__':
    render(sys.argv[1], sys.argv[2], sys.argv[3] == 'behind', sys.argv[4])
