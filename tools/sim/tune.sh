#!/bin/bash
# usage: BALJSON='{...}' ./tune.sh  -> averages tries per chapter over 4 seeds
for sd in $(seq 1 ${N:-8}); do SEED=$sd GAME="$(cd "$(dirname "$0")/../.." && pwd)" MAX_RUNS=${MAX_RUNS:-180} node sim.mjs > out_$sd.json 2>&1 & done; wait
N=${N:-8} python3 - <<'PY'
import json
rs=[json.load(open(f'out_{i}.json')) for i in range(1,int(__import__("os").environ.get("N","8"))+1)]
for ch in range(1,11):
    t=[next((r['tries'] for r in d['report'] if r['ch']==ch),None) for d in rs]
    b=[next((r['belt'][:-5]+str(r['talents']) for r in d['report'] if r['ch']==ch),'-') for d in rs]
    tt=[x for x in t if x]; print(f"ch{ch}: avg {sum(tt)/max(1,len(tt)):.1f} median {sorted(tt)[len(tt)//2] if tt else '-'} tries {t}  belts {[x for x in b][:4]}")
print('total runs', [d['runs'] for d in rs], 'finished', [d['finished'] for d in rs])
errs=set(e[:160] for d in rs for e in d['errors']); [print('ERR',e) for e in list(errs)[:6]]
PY
