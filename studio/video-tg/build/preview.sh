set -e
cd "$(dirname "$0")/.."
node tools/render.mjs video 30
python3 tools/glitchscan.py build/video_silent.mp4
python3 tools/mix.py --music music/release-minana-yamakaita.mp3 --loop-from 24 --bed 0.5 --name tg_PREVIEW_song_no-voice
ffmpeg -v error -y -i out/tg_PREVIEW_song_no-voice.mp4 -vf scale=1280:720:flags=lanczos -c:v libx264 -preset slow -crf 25 -tune animation -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart out/tg_PREVIEW_song_no-voice_whatsapp.mp4
echo ALLDONE
