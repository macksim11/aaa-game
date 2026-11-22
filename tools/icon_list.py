# Writes assets/icons/list.json (every icon name) so the game can preload them all at start.
# Re-run after adding icons.
import os, json
names = sorted(f[:-5] for f in os.listdir('assets/icons') if f.endswith('.webp'))
json.dump(names, open('assets/icons/list.json', 'w'))
print(len(names), 'icons')
