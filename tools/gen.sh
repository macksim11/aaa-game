#!/bin/bash
# usage: tools/gen.sh <name> <aspect> "<prompt>" [ref1 ref2 ...]
# generates with Nano Banana 2 @2k, saves art-gen/raw/<name>.png, logs to art-gen/log.txt
cd "$(dirname "$0")/.."
mkdir -p art-gen/raw
name="$1"; ar="$2"; prompt="$3"; shift 3
refs=(); for r in "$@"; do refs+=(--image-references "$r"); done
model="${MODEL:-nano_banana_flash}"
extra=(); [[ $model == gpt_image* ]] && extra=(--quality high)
for attempt in 1 2; do
  url=$(higgsfield generate create "$model" --resolution 2k --aspect_ratio "$ar" "${extra[@]}" "${refs[@]}" --prompt "$prompt" --wait 2>&1 | grep -Eo 'https://[^ ]+\.(png|jpg|jpeg|webp)' | tail -1)
  if [ -n "$url" ]; then curl -sSL -o "art-gen/raw/$name.png" "$url"; echo "$(date +%H:%M) OK $name $url" >> art-gen/log.txt; echo "OK $name"; exit 0; fi
  echo "$(date +%H:%M) FAIL $name attempt $attempt" >> art-gen/log.txt
done
echo "FAIL $name"; exit 1
