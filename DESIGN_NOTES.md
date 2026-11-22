# Design review — Nov 22

Checked every screen at iPhone 12 (390×844), iPhone SE (375×667), iPad (820×1180) and a tall laptop window.

## Fixed in this update
- **Didn't fill the iPhone screen** (dark strip at the bottom in home-screen mode): the game is now pinned to all four screen edges, so it fills every phone, including notches and home-indicator areas. Tablets get a slightly wider column (600px).
- **App icon**: new generated icon (Arlo with his red karate headband), in all sizes: iPhone home screen, Android (including the rounded "safe zone" version) and the browser tab.
- **Blank screen while loading**: new instant loading screen with the icon, a real progress bar (characters, icons, backgrounds, fonts) and fun tips ("Papi is heating up the stove…").
- **Top-left avatar**: replaced the cropped sprite with proper head-and-shoulders portrait images (also used for Nana in the tutorial and on the defeat screen). Portraits exist for the whole family (`assets/ui/face_*.webp`, made by `tools/faces.py`).
- **Opening screen**: was a boxed picture floating in purple, with an emoji ▶️ that looked off on iPhone. It's now full-screen: blurred art fills the background, the title art fades in softly, there's a glowing pulsing PLAY button, a gold-pink "Happy Birthday Arlo!" ribbon, twinkling sparkles, and a zoom-out transition into the story.
- **Phone turned sideways**: shows a friendly "Turn your phone upright" screen instead of a squashed game.
- **Defeat screen**: Arlo's portrait on top, "1 day" vs "days" grammar, and the first-adventure button no longer wraps onto two lines.
- **Icons popping in late**: art is cached on the device and all icons preload during the loading screen.

## Ideas for later (not done yet)
- **Victory screen**: give it the same portrait treatment, plus confetti.
- **Boss intro card**: a quick "VS" splash with the boss's name before boss fights (the art already exists).
- **Haptics**: a little vibration on big hits and level-ups (Android only; iPhone browsers don't allow it).
- **Pinball**: decorate the table (Montreal theme, Arlo's face on the bumpers) and add a launch plunger.
- **Settings**: a "Battle speed" option next to Music/Sounds, so the default pace can be picked.
- **Chapter map**: a scrolling map of the 10 chapters instead of the ◀ ▶ arrows, like the real game.
- **Daily login streak**: a 7-day calendar with growing rewards to make coming back every day exciting.
- **Sound**: a short jingle when a family member is rescued, and a unique sound per pet attack.
