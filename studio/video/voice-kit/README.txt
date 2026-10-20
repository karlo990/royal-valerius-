ROYAL CREST · MANDARIN CONNECT: VOICE KIT
=========================================

This makes the two commentator voices for the Mandarin film:
  Teacher Wen (Chinese voice)  4AfodMgwXps9oZFhHzoj
  Sam (English voice)          FSjbVsYdGQ5KJ6l0Ul2r

1. Install Python 3 if you don't have it: https://www.python.org/downloads/
   (Windows: tick "Add python.exe to PATH" during install.)
2. Unzip this folder.
3. Windows: double-click make_voices.bat
   Mac:     right-click make_voices.command > Open
   Any:     open a terminal here and run:  python3 make_voices.py
4. Wait about 2 minutes. It makes 36 short clips in the "audio" folder,
   then creates voices.zip.
5. Upload voices.zip to Claude. Claude mixes the voices with the music
   and renders the final video.

Your API key is in the .env file. Don't share this folder publicly.
If it stops halfway (internet, credits), just run it again; finished
lines are kept.
If you get a "voice not found" error, open ElevenLabs > Voice Library,
add that voice to My Voices, and run again.
