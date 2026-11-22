#!/bin/bash
# Re-make sheets with a bright MAGENTA belt (exact belt mask -> the game repaints it in Arlo's belt colour).
cd "$(dirname "$0")/.."
P="Edit this exact image. Keep EVERYTHING pixel-identical: same characters, same poses, same positions and sizes in the grid, same colors, same outlines, same white background. The ONLY change: the boy's white karate belt (the band around his waist, the knot and the two hanging tails) becomes solid bright MAGENTA (hot pink #ff00ff) in every pose. Change nothing else at all. No text."
gen(){ out=$1; src=$2; ar=$3
  url=$(higgsfield generate create nano_banana_flash --resolution 2k --aspect_ratio $ar --image-references "$src" --prompt "$P" --wait 2>&1 | grep -Eo 'https://[^ ]+\.(png|jpg|jpeg|webp)' | tail -1)
  [ -n "$url" ] && curl -sSL -o art-gen/raw/$out.png "$url" && echo "$(date +%H:%M) OK $out $url" >> art-gen/log.txt && echo "OK $out" || echo "FAIL $out"; }
gen mk_arlo art-gen/samples/arlo-sheet.png 3:2 &
gen mk_hoodie art-gen/raw/armor_hoodie.png 3:2 &
gen mk_tunic art-gen/raw/armor_leather_tunic.png 3:2 &
gen mk_ride1 art-gen/raw/ride1.png 1:1 &
gen mk_ride2 art-gen/raw/ride2.png 1:1 &
gen mk_ride3 art-gen/raw/ride3.png 1:1 &
wait
