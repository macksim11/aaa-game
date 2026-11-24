#!/bin/bash
# Rebuild every armed frame set (v16) from the generated sheets in art-gen/raw (see tools/armed_frames.py).
# Repaired sheets (targeted edits) replaced their first versions (*_v1.png kept): swl_iron_chest (cheer sword),
# swl_arlo (sword lying down), arm_staff_diamond_chest (no shield), arm_nun_hoodie, arm_nun_leather_tunic (one pair, one hand).
# swl_<outfit>.png = lime marker sword (tinted per sword in the game); arm_<class>_<outfit>.png = pick / staff / hockey stick.
cd "$(dirname "$0")/.."
dir(){ [ "$1" = arlo ] && echo assets/chars/arlo || echo assets/chars/arlo_$1; }
for o in arlo hoodie karate_gi leather_tunic iron_chest diamond_chest; do
  gaps=--clear-pockets; [ $o = karate_gi ] && gaps=--clear-outlined   # white gi: clear only pockets ringed by outlines
  python3 tools/armed_frames.py art-gen/raw/swl_$o.png "$(dir $o)" || exit 1
  python3 tools/armed_frames.py art-gen/raw/arm_pick_$o.png "$(dir $o)" --weapon diamond_pick $gaps || exit 1
  ex=(); [ $o = iron_chest ] && ex=(--same idle_0=idle_1)   # the artist left the staff out of idle_0
  python3 tools/armed_frames.py art-gen/raw/arm_staff_$o.png "$(dir $o)" --weapon bo_staff $gaps "${ex[@]}" || exit 1
  python3 tools/armed_frames.py art-gen/raw/arm_stick_$o.png "$(dir $o)" --weapon hockey_stick $gaps || exit 1
  python3 tools/armed_frames.py art-gen/raw/arm_nun_$o.png "$(dir $o)" --weapon nunchucks $gaps || exit 1
done
