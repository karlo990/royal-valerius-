#!/usr/bin/env bash
# Full build: voices (ElevenLabs) → timeline → frames → music → final MP4 in out/
set -euo pipefail
cd "$(dirname "$0")"
[ -f .env ] && set -a && . ./.env && set +a
[ -d node_modules ] || npm ci
# lens frame sequences (square crops, 30 fps) from the source clips
if [ ! -d assets/wall ]; then mkdir -p assets/wall && ffmpeg -v error -i assets/clips/great-wall.mp4 -vf "crop=720:720:0:300,fps=30" -q:v 3 assets/wall/%04d.jpg; fi
if [ ! -d assets/class ]; then mkdir -p assets/class && ffmpeg -v error -i assets/clips/rca-classroom.mp4 -vf "crop=720:720:280:0,fps=30" -q:v 3 assets/class/%04d.jpg; fi
python3 tools/tts.py
python3 tools/timeline.py
python3 tools/music.py
node tools/render.mjs video 30
python3 tools/mix.py
