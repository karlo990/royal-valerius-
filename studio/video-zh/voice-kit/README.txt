ROYAL CREST · MANDARIN CONNECT "COUNT AND WRITE": VOICE KIT
===========================================================

Makes the 33 voice lines for the counting and writing film:
  Teacher Wen  4AfodMgwXps9oZFhHzoj  (same teacher as the first Mandarin film)
  Sam          FSjbVsYdGQ5KJ6l0Ul2r  (same commentator as the other films)

Windows (PowerShell), from C:\Users\<you>:
  $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="sk_YOUR_KEY"; $env:NO_PAUSE="1"; py make_voices.py

When it says "Done: 33 lines", upload voices.zip to Claude.
If it stops halfway, run it again: it carries on from where it stopped.
