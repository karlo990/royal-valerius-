# Mandarin Connect: Case Study 01 (promo film)

A 3-minute marketing film for Grade 7 parents. Two commentators follow an illustrative beginner from
Chitungwiza through five days of Mandarin, with a short tour of Chinese heritage on the way
(Qín, Hàn, Yuán/Kublai Khan, Míng/Great Wall, Guānhuà → "Mandarin").

It uses the same design system as the "Look closer" Lab Series film: crest lockup, a cinnabar
Pink-October-style pill (here **Mandarin Connect**), the rotating gold dial with a circular lens,
a numbered eyebrow with a two-tone serif headline, and the WhatsApp CTA bar. Colours and fonts come
from the website (`assets/css/styles.css`): navy `#13215a`, gold `#d2ae4c`, Newsreader and
Plus Jakarta Sans. Cinnabar `#C8372D` and rice paper are added for the Chinese theme.

## Voices (ElevenLabs)

| Role | Voice ID | Speaks |
|---|---|---|
| Wén Lǎoshī (Teacher Wen) | `4AfodMgwXps9oZFhHzoj` | Mandarin and English |
| Sam (commentator) | `FSjbVsYdGQ5KJ6l0Ul2r` | English, plus Tendai's day-5 replay |

The words are in `script.json`. `say` is the text sent to ElevenLabs (Chinese characters wherever
Mandarin must be pronounced), and `cap` is the on-screen caption with pinyin.

## Build

```bash
./make.sh          # reads ELEVENLABS_API_KEY from .env (git-ignored)
```

Steps: `tools/tts.py` (voices + character timestamps) → `tools/timeline.py` (scene timing from the
real audio) → `tools/music.py` (original pentatonic plucked-string bed) → `tools/render.mjs`
(frame-exact render of `build/stage.html` with Playwright, 1920×1080, 30 fps) → `tools/mix.py`
(voices over ducked music, loudness-normalised) → `out/royal-crest-mandarin-connect.mp4`.

Without voice files, the same pipeline makes `out/…_PREVIEW_no-voice.mp4` from estimated timings.

## Sources

- Body-part words (眼睛 yǎnjing, 鼻子 bízi, 嘴 zuǐ): from the Easy Chinese lesson clip. Only the
  phrases are used, not the footage.
- Great Wall and Royal Crest classroom clips: the supplied videos, cropped into the lens.
- Stroke-order data: `hanzi-writer-data` (Arphic Public License, see `node_modules/hanzi-writer-data`).
- Tendai is an illustrative learner, and the case-file card says so on screen.
