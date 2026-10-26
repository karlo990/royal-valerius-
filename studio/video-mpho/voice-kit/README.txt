ROYAL CREST · LITERATURE FILM "MPHO'S SEARCH" (a reader's guide): VOICE KIT
==========================================================================

Makes the 23 voice lines:
  Teacher Rudo  XrExE9yKIg1WjnnlVkGX  (ElevenLabs "Matilda": warm teacher)
  Narrator      nPczCjzI2devNBz1zQrb  (ElevenLabs "Brian": deep, calm)
  Student       cgSgspJ2msm6clMCkdW9  (ElevenLabs "Jessica": young, bright)

If a voice is "not found", open ElevenLabs > Voices > Voice Library, search the name in brackets,
press "Add to my voices", then run again.

Windows (PowerShell), from C:\Users\<you>:
  $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="sk_YOUR_KEY"; $env:NO_PAUSE="1"; py make_voices.py

When it says "Done: 23 lines", upload voices.zip to Claude.
If it stops halfway, run it again: it carries on from where it stopped.
