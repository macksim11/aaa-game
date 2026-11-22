# Arlo's Awesome Adventure (AAA)

A private birthday game for Arlo. It's a web app: it runs in Safari/Chrome and can be added to the
home screen of an iPhone, iPad, Android tablet or laptop, where it opens full-screen like a real app.

## Play it on this computer
```bash
python3 tools/serve.py 8766
```
Then open http://localhost:8766

## Put it online (free, GitHub Pages)
1. Make a free account at https://github.com/signup
2. Create a new repository called `arlos-adventure` and choose **Private** or **Public**
   (GitHub Pages on a private repo needs a paid plan, so use Public; the link is hard to guess and not listed anywhere).
3. Upload every file in this folder (drag-and-drop on the repo page works), or ask Claude to push it.
4. In the repo: **Settings → Pages → Branch: main → Save**.
5. After a minute the game is live at `https://<your-username>.github.io/arlos-adventure/`

## Install on devices
- **iPhone / iPad:** open the link in Safari → Share button → **Add to Home Screen**.
- **Android:** open the link in Chrome → ⋮ menu → **Add to Home screen / Install app**.
- **Laptop:** open the link in Chrome → install icon in the address bar (or just bookmark it).

## Moving progress between devices
Menu (☰ on the home screen) → **Move my save to another device**. Copy the code, send it to the other
device (text/AirDrop/email), paste it there and tap Load.

## Updating the game later
All content lives in `js/data/` (chapters, enemies, skills, pets, mounts, gear, events, family).
Saves only store ids and numbers and every new field gets a default, so adding chapters, pets,
skills or items never breaks Arlo's progress. After uploading changes, bump `VERSION` in `sw.js`.

## Custom music
Drop MP3 files into `music/` named `hub.mp3`, `adventure.mp3`, `battle.mp3`, `boss.mp3`, `story.mp3`.
If a file exists it plays instead of the built-in tune.

## Custom character art
Put transparent PNGs (character facing right, feet at the bottom) in `sprites/` and list them in
`sprites/manifest.json`, e.g. `{ "mom": "mom.png", "twyla": "twyla.png" }`. Ids: arlo, mom, papa,
alyzee, eveah, emery, nana, papi, twyla, lenny, goose, marah, tobi, zuko, wolf, axolotl, eevee,
pikachu, charizard. The game animates them automatically.
(Note: a sprite for `arlo` replaces his customizable outfit.)
