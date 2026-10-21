ROYAL CREST · TECHNICAL GRAPHICS FILM: VOICE KIT
================================================

Makes the 39 voice lines for "Every building starts as a line":
  Teacher Tinashe  JBFqnCBsd6RMwjVu3G6B  (ElevenLabs premade voice "George")
  Sam              FSjbVsYdGQ5KJ6l0Ul2r  (same commentator as the Mandarin film)

Windows (PowerShell), in the folder where you unzipped this kit:
  $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="sk_YOUR_KEY"; $env:NO_PAUSE="1"; py make_voices.py

Or double-click make_voices.bat and paste your key when asked.

When it says "Done: 39 lines", upload voices.zip to Claude.

To use a different teacher voice, change TIN's voice_id in script.json
(any voice in your ElevenLabs "My Voices"), then run again.
If it stops halfway, run it again: finished lines are kept.
Your API key is never stored in this kit. Don't share your key.
