#!/bin/bash
# =====================================================================
#  Arlo's Awesome Adventure — DOCTOR
#  One command that checks the whole game and repairs what it can:
#    tools/doctor/doctor.sh          (full check, ~5 min)
#    tools/doctor/doctor.sh quick    (skip the long gameplay simulation)
#  1. art & data  (missing files, icon fragments, icon list, weapon grips)  -> auto-fixes icons
#  2. belts       (every Arlo outfit & ride repaints the belt fully)        -> auto-rebuilds belt masks
#  3. house       (nobody inside / floating over furniture)
#  4. screens     (5 devices: cut-off text, wrapping, overlaps, off-screen, tiny buttons, broken images, errors)
#  5. gameplay    (bot players: crashes, freezes, difficulty curve)
#  Writes tools/doctor/report/REPORT.md (+ screenshots of every screen) and exits 1 if anything is left.
# =====================================================================
cd "$(dirname "$0")/../.."
R=tools/doctor/report; mkdir -p $R
[ -d tools/doctor/node_modules/playwright ] || (cd tools/doctor && npm install --silent)   # uses the installed Google Chrome
fail=0; : > $R/REPORT.md
section(){ echo -e "\n## $1\n\`\`\`" >> $R/REPORT.md; }
endsec(){ echo '```' >> $R/REPORT.md; }
echo "# Doctor report — $(date '+%Y-%m-%d %H:%M')" >> $R/REPORT.md

echo "1/5 art & data..."; section "Art & data"
python3 -W ignore tools/doctor/check_assets.py --fix >> $R/REPORT.md 2>&1 || fail=1; endsec

echo "2/5 belts..."; section "Belts"
if ! python3 -W ignore tools/check_belts.py > /dev/null 2>&1; then
  echo "rebuilding belt masks..." >> $R/REPORT.md
  python3 -W ignore tools/belt_masks.py $(ls -d assets/chars/arlo*/) $(ls -d assets/rides/*/) > /dev/null 2>&1
fi
python3 -W ignore tools/check_belts.py >> $R/REPORT.md 2>&1 || fail=1; endsec

echo "3/5 house layout..."; section "House layout"
node tools/doctor/check_home.mjs >> $R/REPORT.md 2>&1 || fail=1; endsec

echo "4/5 screens on 5 devices..."; section "Screens (iPhone SE, iPhone 12, iPhone Pro Max, iPad, laptop)"
node tools/doctor/check_ui.mjs >> $R/REPORT.md 2>&1 || fail=1; endsec

if [ "$1" != "quick" ]; then
  echo "5/5 gameplay (bot players)..."; section "Gameplay & balance"
  python3 tools/doctor/check_gameplay.py 8 >> $R/REPORT.md 2>&1 || fail=1; endsec
fi
grep -E "problems" $R/REPORT.md
[ $fail = 0 ] && echo "ALL CLEAR" || echo "Problems found — see $R/REPORT.md"
exit $fail
