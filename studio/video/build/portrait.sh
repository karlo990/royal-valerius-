set -e
cd "$(dirname "$0")/.."
PORTRAIT=1 node tools/render.mjs video 30 0 0 video_silent_portrait.mp4
python3 tools/glitchscan.py build/video_silent_portrait.mp4
python3 tools/mix.py --video build/video_silent_portrait.mp4 --music music/empire-state-of-mind.mp3 --bed 0.18 --name royal-crest-mandarin-connect_song_portrait
python3 tools/mix.py --video build/video_silent_portrait.mp4 --name royal-crest-mandarin-connect_original-music_portrait
cd out
for n in song original-music; do ffmpeg -v error -y -i royal-crest-mandarin-connect_${n}_portrait.mp4 -vf scale=720:1280:flags=lanczos -c:v libx264 -preset slow -crf 24 -tune animation -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart royal-crest-mandarin-connect_${n}_portrait_whatsapp.mp4; done
echo ALLDONE
