ROYAL CREST · BIOLOGY FILM: VOICE KIT
=====================================

Makes the 40 voice lines for "Life, up close" (DNA, RNA, red blood cells, bacteria, viruses):
  Teacher Rudo  KpK2JUuSi307pzhaXdaL  (Stacy, warm South African)
  Sam           FSjbVsYdGQ5KJ6l0Ul2r  (same commentator as the other films)

Windows (PowerShell), from C:\Users\<you>:
  $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="sk_YOUR_KEY"; $env:NO_PAUSE="1"; py make_voices.py

When it says "Done: 40 lines", upload voices.zip to Claude.
To use another voice, change RUD's voice_id in script.json. If it stops halfway, run it again.
