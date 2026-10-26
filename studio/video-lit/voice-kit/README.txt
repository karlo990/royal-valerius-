ROYAL CREST · LITERATURE FILM "FROM PAGE TO PODIUM": VOICE KIT
=============================================================

Makes the 27 voice lines (Literature in English + public speaking):
  Teacher Rudo  XrExE9yKIg1WjnnlVkGX  (ElevenLabs "Matilda": warm teacher)
  Narrator      nPczCjzI2devNBz1zQrF  (ElevenLabs "Brian": deep, calm)
  Student       cgSgspJ2msm6clMCkdW9  (ElevenLabs "Jessica": young, bright; says the sample hook)

If a voice is "not found", open ElevenLabs > Voices > Voice Library, search the name in brackets,
press "Add to my voices", then run again.

Windows (PowerShell), from C:\Users\<you>:
  $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="sk_YOUR_KEY"; $env:NO_PAUSE="1"; py make_voices.py

When it says "Done: 27 lines", upload voices.zip to Claude.
If it stops halfway, run it again: it carries on from where it stopped.
