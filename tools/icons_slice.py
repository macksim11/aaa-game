# Cut 5x4 transparent icon sheets into assets/icons/<name>.webp (reading order)
import sys, os
import numpy as np
from PIL import Image
from scipy import ndimage

def clean(cell):
    # keep the icon itself; drop stray fragments of neighbouring icons (small pieces touching the cell edge)
    a = np.array(cell); alpha = a[..., 3] > 24
    lab, n = ndimage.label(ndimage.binary_dilation(alpha, iterations=2))
    if n <= 1: return cell
    sizes = ndimage.sum(alpha, lab, range(1, n + 1)); big = sizes.max()
    H, W = alpha.shape; keep = np.zeros_like(alpha)
    for i in range(1, n + 1):
        comp = lab == i; ys, xs = np.nonzero(comp)
        edge = ys.min() <= 2 or xs.min() <= 2 or ys.max() >= H - 3 or xs.max() >= W - 3
        if sizes[i - 1] == big or (sizes[i - 1] > big * 0.12 and not edge) or (sizes[i - 1] > big * 0.35):
            keep |= comp
    a[..., 3] = np.where(keep, a[..., 3], 0)
    return Image.fromarray(a)
NAMES = {
 'icons_ui': 'shop gear home pets belts look rides menu gift papi pinball coin gem food egg chest_wood chest_gold chest_diamond settings skills',
 'icons_skill1': 'star star_plus heal_star rage_star bolt_star soccer soccer_plus thunder power_punch iron_body big_lunch combo counter eagle_eye crit_power quick_feet second_wind snack lucky_coins fast_learner',
 'icons_gear1': 'g_wood_sword g_bo_staff g_nunchucks g_stone_sword g_hockey_stick g_iron_sword g_diamond_pick g_diamond_sword g_netherite_sword g_karate_gi g_hoodie g_leather_tunic g_iron_chest g_diamond_chest g_sparring g_goalie g_dragon_wraps g_cleats g_water_shoes g_kungfu_shoes',
 'icons_gear2': 'g_diamond_boots g_burger_pendant g_ender_pearl g_dragon_medal g_pinball_ring g_emerald_ring g_totem_ring lego kragle poutine bagel slushie dice trophy crown horseshoe potion taffy goal fountain',
 'icons_skill2': 'fire_fist ice_palm poison_touch rage_builder rage_up shield_up lifesteal skill_dmg berserker skill_master diamond_skin creeper_kick cinema pinball_wiz frozen_touch tornado_kick burger_fort shadow_clone revive star_storm',
'icons_ui2': 'heart sword shield bolt target burst fists counter_arrows wingshoe blood lock check slot_weapon slot_gloves slot_necklace slot_gi slot_shoes slot_ring music sound',
 'icons_ui4': 'flag_start flag_white footprints soccer_ball boss_badge calendar replay vibrate shield_crack music_on sound_on cup gift_box verified stopwatch magic heart_plus key_gold clover crown_silver',
 'icons_ui3': 'clapper transfer stats close plus hourglass skull swords fast map question family note heal sparkle flame book belt key alert',
}
import sys as _s
if len(_s.argv) > 1: NAMES = {k: v for k, v in NAMES.items() if k in _s.argv[1:]}
os.makedirs('assets/icons', exist_ok=True)
for sheet, names in NAMES.items():
    p = f'art-gen/raw/{sheet}.png'
    if not os.path.exists(p): print('missing', p); continue
    im = Image.open(p).convert('RGBA'); W, H = im.size; names = names.split()
    for i, n in enumerate(names):
        r, c = divmod(i, 5)
        cell = im.crop((c * W // 5, r * H // 4, (c + 1) * W // 5, (r + 1) * H // 4))
        cell = clean(cell)
        bb = cell.getbbox()
        if bb: cell = cell.crop(bb)
        cell.thumbnail((160, 160), Image.Resampling.LANCZOS)
        sq = Image.new('RGBA', (160, 160), (0, 0, 0, 0)); sq.alpha_composite(cell, ((160 - cell.width) // 2, (160 - cell.height) // 2))
        sq.save(f'assets/icons/{n}.webp', 'WEBP', quality=90)
print(len(os.listdir('assets/icons')), 'icons')
