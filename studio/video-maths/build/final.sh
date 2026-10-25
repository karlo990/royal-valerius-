# Final render in 4 parallel parts, then join, check, and mix with the music and sound effects.
# usage: bash build/final.sh [portrait]
set -e
cd "$(dirname "$0")/.."
MODE=${1:-landscape}; SUF=""; [ "$MODE" = portrait ] && { export PORTRAIT=1; SUF="_portrait"; }
TOTAL=$(python3 -c "import json,re;print(json.loads(re.sub(r'^window.TL=|;$','',open('build/timeline.js').read().strip()))['total'])")
N=$(python3 -c "import math;print(math.ceil($TOTAL*30))"); P=4; STEP=$(( (N+P-1)/P ))
rm -f build/parts$SUF.txt
for k in 0 1 2 3; do
  F0=$((k*STEP)); F1=$(( (k+1)*STEP )); [ $F1 -gt $N ] && F1=$N
  T0=$(python3 -c "print($F0/30)"); T1=$(python3 -c "print($F1/30-1e-6)")
  node tools/render.mjs video 30 $T0 $T1 part$k$SUF.mp4 > build/render_part$k$SUF.log 2>&1 &
  echo "file 'part$k$SUF.mp4'" >> build/parts$SUF.txt
done
wait
ffmpeg -v error -y -f concat -safe 0 -i build/parts$SUF.txt -c copy build/video_silent$SUF.mp4
python3 tools/glitchscan.py build/video_silent$SUF.mp4
python3 tools/music.py
python3 tools/sfx.py
python3 tools/mix.py --video build/video_silent$SUF.mp4 --music build/music.wav --sfx build/sfx.wav --bed ${MUSIC_BED:-0.3} --name royal-crest-newton-slate$SUF
S=1280:720; [ "$MODE" = portrait ] && S=720:1280
ffmpeg -v error -y -i out/royal-crest-newton-slate$SUF.mp4 -vf scale=$S:flags=lanczos -c:v libx264 -preset slow -crf 24 -tune animation -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/royal-crest-newton-slate${SUF}_whatsapp.mp4
echo ALLDONE
