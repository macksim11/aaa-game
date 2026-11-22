#!/bin/bash
# Arlo armor variants: same 12-pose sheet as art-gen/samples/arlo-sheet.png, wearing each armor.
cd "$(dirname "$0")/.."
BASE="Edit this exact character sprite sheet. Keep EVERYTHING identical: the same boy, same face, same messy dirty-blond hair, same blue eyes, same 12 poses in exactly the same 3-row grid positions and sizes, same thick dark-brown outlines and cartoon style, same plain white background, same grey shorts and navy shoes. The ONLY change: he now wears"
END="in every single pose, drawn consistently across all 12 poses. Keep his white karate belt tied around the waist on top of the outfit. No text, no labels, no extra characters, nothing else added."
gen(){ name=$1; outfit=$2
  url=$(higgsfield generate create nano_banana_flash --resolution 2k --aspect_ratio 3:2 --image-references art-gen/samples/arlo-sheet.png --prompt "$BASE $outfit $END" --wait 2>&1 | grep -Eo 'https://[^ ]+\.(png|jpg|jpeg|webp)' | tail -1)
  [ -n "$url" ] && curl -sSL -o art-gen/raw/$name.png "$url" && echo "$(date +%H:%M) OK $name $url" >> art-gen/log.txt && echo "OK $name" || echo "FAIL $name"; }
gen armor_karate_gi "a crisp white karate gi jacket (wrap-over collar, short sleeves) instead of his navy shirt" &
gen armor_hoodie "a cozy purple hoodie with the hood down and a front pocket instead of his navy shirt" &
gen armor_leather_tunic "a brown Minecraft-style leather tunic armor with stitched panels over his shirt" &
gen armor_iron_chest "a shiny grey Minecraft-style iron chestplate armor with shoulder pieces over his shirt" &
gen armor_diamond_chest "a glowing light-blue Minecraft-style diamond chestplate armor with shoulder pieces over his shirt" &
wait
