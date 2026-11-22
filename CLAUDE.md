# Arlo's Awesome Adventure: working rules

Private birthday web game (PWA) for Arlo, live at https://macksim11.github.io/aaa-game/ (GitHub Pages from `main`).

## Always run the doctor
After ANY change (code, art, balance, layout), run:

```
tools/doctor/doctor.sh          # full check (~5 min, includes bot playthroughs)
tools/doctor/doctor.sh quick    # skips the gameplay simulation
```

It checks art and data, belt colouring on every Arlo outfit and ride, the house layout (nobody inside or over furniture, Emery tallest), every screen on 5 devices (cut-off text, wrapping, overlaps, off-screen, tiny buttons, broken images, console errors), and gameplay (crashes, freezes, difficulty curve). It auto-fixes what it can.

- Fix every problem it reports, re-run until it says ALL CLEAR, and only then report the work as done.
- Also look at the screenshots in `tools/doctor/report/ui/`. The checks can't judge art (for example, a character standing somewhere odd), so review them by eye.
- When the user reports a new kind of flaw, add a check for it to the doctor so it can't come back.

## Testing
- Never touch the user's real save. Test at `/?test` (it uses a separate save key).
- Local server: `.claude/launch.json` config "aaa" (port 8766).

## Publishing
Bump `VERSION` in `sw.js`, commit, and `git push origin main`. Pages rebuilds in about a minute.

## Where things live
- Balance numbers: `js/data/balance.js`, tuned with `tools/sim` and checked by `tools/doctor/check_gameplay.py`.
- House spots and furniture map: `js/data/home.js`.
- Arlo outfits: `assets/chars/arlo_<armor>/`, using a magenta marker belt that is repainted in the game. Weapon grips: `hands.json`.
- Icons: `assets/icons` (`tools/icons_slice.py` re-cuts them, `tools/icon_list.py` rebuilds the list).
