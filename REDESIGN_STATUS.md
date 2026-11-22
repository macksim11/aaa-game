# Art redesign status (Higgsfield)

**Credits:** started 330 → now 174 (156 used, ~2 per image).

## Done (all in the game)
- Characters with animations (idle, run, attacks, hurt, victory): Arlo, Emery, Mom, Papa, Alyzée, Évéah, Nana*, Papi*
- Family pets: Twyla, Lenny, Goose, Marah, Tobi, Zuko · Egg pets: Wolf, Axolotl, Eevee, Pikachu, Charizard
- 20 monsters + 10 bosses (all facing left toward Arlo, with special-attack poses)
- 9 rides with Arlo riding (bike, e-bike, horse, hippo, pig, camel, chicken jockey, Oddballs golf cart, his car)
- 11 backgrounds (all 10 chapters + Nana & Papi's house)
- Comic-book intro story (13 slides, speech bubbles added in-game) + title screen
- 5 rescue celebration scenes + 4-slide ending comic (plays after beating President Business)
- 100 icons (menus, skills, gear, events)

\* Nana & Papi were drawn from a description: their photos didn't save. Resend them to redo (~4 credits).

## Fixed after review
Story slides with duplicated people / Emery's stretched head (s07, s08), Nana's eye-patch sunglasses (s12),
duplicate Zuko on title, blank boxes/borders on ending slides.

## Still to do (no credits needed unless noted)
- Nana & Papi from real photos (~4 credits)
- Balance-test chapters 3–10
- Put it online (GitHub Pages) and add to home screens
- Optional extras: boss intro cards (~20), "chapter freed" scenes for Act 2 (~6), outfit customization (~12)

## Tools
tools/gen.sh (generate), tools/slice.py (sprite sheets → frames), tools/optimize.py (→ WEBP),
tools/convert_bg.py (backgrounds/story), tools/icons_slice.py. Raw art in art-gen/raw.
