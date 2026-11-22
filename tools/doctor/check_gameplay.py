# Doctor: gameplay & balance.  python3 tools/doctor/check_gameplay.py [players]
# Runs the real game code headless (tools/sim/sim.mjs) with several bot players, half picking random skills and
# half picking the strongest skills, and checks:
#   - no crashes, no freezes/softlocks (an adventure that never ends)
#   - every bot can finish the whole game
#   - chapter 1 is not beaten on the very first adventure (most of the time)
#   - each chapter takes a reasonable number of tries (not a pushover, not a wall)
#   - the whole game takes a reasonable number of adventures
import json, os, sys, shutil, subprocess, statistics
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DOC = os.path.join(ROOT, 'tools/doctor')
N = int(sys.argv[1]) if len(sys.argv) > 1 else 6
TRIES = (1.8, 12.0)          # allowed average tries per chapter
TOTAL = (28, 110)            # allowed average adventures for the whole game
shutil.copy(os.path.join(ROOT, 'tools/sim/sim.mjs'), os.path.join(DOC, '.sim.mjs'))   # so it finds jsdom in tools/doctor/node_modules

def play(args):
    seed, policy = args
    env = dict(os.environ, GAME=ROOT, SEED=str(seed), POLICY=policy, MAX_RUNS='260')
    out = subprocess.run(['node', os.path.join(DOC, '.sim.mjs')], env=env, capture_output=True, text=True, timeout=1200).stdout
    try: return policy, json.loads(out[out.index('{'):])
    except Exception: return policy, {'report': [], 'runs': 0, 'finished': False, 'errors': ['simulator crashed: ' + out[-300:]]}

jobs = [(s, 'random') for s in range(1, N // 2 + 1)] + [(s + 50, 'smart') for s in range(1, N - N // 2 + 1)]
with ThreadPoolExecutor(max_workers=min(8, len(jobs))) as ex: results = list(ex.map(play, jobs))
probs = []
errs = {}
for pol, d in results:
    for e in d['errors']:
        key = e[:160]; errs[key] = errs.get(key, 0) + 1
    if not d['finished']: probs.append(f'a {pol} bot could not finish the game in 260 adventures (reached chapter {len(d["report"]) + 1})')
for e, n in errs.items(): probs.append(f'error seen {n}x: {e}')
chapters = sorted({r['ch'] for _, d in results for r in d['report']})
lines = []
for ch in chapters:
    t = [r['tries'] for _, d in results for r in d['report'] if r['ch'] == ch]
    avg = statistics.mean(t); lines.append(f'  chapter {ch}: avg {avg:.1f} tries (min {min(t)}, max {max(t)})')
    if avg < TRIES[0]: probs.append(f'chapter {ch} is too easy: average {avg:.1f} tries')
    if avg > TRIES[1]: probs.append(f'chapter {ch} is a wall: average {avg:.1f} tries')
first_wins = sum(1 for _, d in results for r in d['report'] if r['ch'] == 1 and r['tries'] == 1)
if first_wins > len(results) * 0.2: probs.append(f'chapter 1 was beaten on the very first adventure by {first_wins}/{len(results)} bots')
totals = [d['runs'] for _, d in results if d['finished']]
if totals:
    avg = statistics.mean(totals); lines.append(f'  whole game: avg {avg:.0f} adventures')
    if not TOTAL[0] <= avg <= TOTAL[1]: probs.append(f'whole game takes {avg:.0f} adventures on average (target {TOTAL[0]}-{TOTAL[1]})')
print('\n'.join(lines))
for p in probs: print('GAMEPLAY ' + p)
print(f'{len(probs)} gameplay problems ({len(results)} bot players)')
sys.exit(1 if probs else 0)
