# MEMORY: Royal Crest Academy media + web project (handoff for the next model)

Written 2026-10-26 by the previous Claude session for any AI (Claude, Gemini, GPT…) that picks this repo up.
Dense on purpose. Read sections 1, 2 and 6 first; use 7–11 as the playbook. No secrets live in this file.

## 1. Problem statement

**Goal**: be the in-house design, film and web studio for **Royal Crest Academy** (new private secondary school,
Bikita, Masvingo, Zimbabwe; opens January 2027; motto *Science · Innovation · Skill*). Produce films, flyers,
social posts, captions, PDFs and web tools (portal, Crest Slate maths canvas, Caption Desk) on request.

**Constraint**: the user writes fast with many typos, mostly from a phone; infer intent, act, don't over-ask.
Voices are made by the user locally (ElevenLabs) because the container cannot reach ElevenLabs; the container
network also blocks cdnjs/jsdelivr/Wikimedia/the live site/HuggingFace. Branch work on `mandarin-connect-video`;
`main` deploys to Vercel (https://royalcrestzw.vercel.app). Merging to main needs the user's OK.

**Signal of done**: a file the user can post today (WhatsApp ≤ ~20 MB, Facebook full quality), a short caption
in the house style, the source committed and pushed (a stop hook rejects a dirty or unpushed tree).

## 2. Current status

All requested work delivered and pushed. Open items:
- [karlo990/royal-valerius-#12](https://github.com/karlo990/royal-valerius-/pull/12) (Crest Slate unstyled when URL has no trailing slash) is open, **not merged**; the user must merge or say "merge it".
- The user still has to upload `karlissa-hub-update.zip` to HF Space `Davincii-code/Karlissa` and set `KUDZI_LLM=ollama` (turns on the maths and caption AI).
- Facebook Page is out of link posts this month (Meta One test: 2 link posts/month); resets 1 Nov. Put links in comments or the Page bio.

## 3. Facts (with evidence)

- School phone, always in **+263 714 404 090** format — evidence: every caption/flyer since Oct 2026; `karlissa/hub/captions.py` `PHONE`.
- Website `https://royalcrestzw.vercel.app`; Crest Slate `…/portal/slate/`; Caption Desk `/studio/captions/` — evidence: `portal/slate/`, `studio/captions/index.html`.
- Vercel `cleanUrls: true` strips trailing slashes → relative asset paths break; **always use absolute paths** (`/portal/slate/slate.css`) — evidence: `vercel.json`, PR #12.
- Hub = FastAPI in `karlissa/hub/` (Ollama `phi4-mini` at `127.0.0.1:11434`), endpoints `/api/v1/maths/{status,solve}` and `POST /api/v1/captions` (staff Bearer token from `/api/v1/admin/login`); `MATHS_LLM`/`CAPTIONS_LLM` follow `KUDZI_LLM` — evidence: `karlissa/hub/{maths,captions,config}.py`.
- Hub tests: `tests/test_maths.py`, `tests/test_captions.py` (24 pass); they must `import tests.test_hub` first (sets env before the hub imports) — evidence: those files.
- GitHub raw serves files < 100 MB; GraphQL is blocked in this environment, use `gh api` REST — evidence: 403 message from `gh repo view`.
- Films render at ~1.5–5 s per frame for Three.js scenes on 4 cores; a 5-min film ≈ 1.5 h — evidence: `studio/video-maths/build/render_part*.log`.

## 4. Open questions

- Does the user want portrait (9:16) cuts of the Newton film? `final.sh portrait` supports it; not yet asked for.
- Does deleting a Facebook link post refund the monthly allowance? Unknown; test on the account.
- Copyrighted music ("Oceans", Hillsong) is in the Newton film mix; Facebook may mute. Offer the old synth bed (`build/music.wav`) if it gets muted.

## 5. Artifacts

| Path | Role | Origin | Status |
|---|---|---|---|
| `studio/index.html`, `studio/js/{app,render,posts}.js`, `studio/css/{studio,flyer,posts}.css` | Flyer Studio (templates, posts, batch export API `window.Studio`) | Claude | CANONICAL |
| `studio/social-extra/` + `README.md` | exported posts (JPG) with an index | Claude | CANONICAL |
| `studio/video-{geo,zh,maths,bio,cake,tg}/` | one folder per film, same pipeline | Claude | CANONICAL (maths = newest) |
| `studio/video-maths/out/royal-crest-newton-slate{,_whatsapp}.mp4` | Newton + Crest Slate film, 4:59 | Claude | CANONICAL (gitignored) |
| `studio/video-maths/downloads/royal-crest-newton-slate-facebook.mp4` | 92 MB copy for GitHub download | Claude | CANONICAL |
| `studio/video-*/downloads/*-voice-kit.zip` | voice kits for the user's PC (no key inside) | Claude | CANONICAL |
| `portal/slate/{index.html,slate.js,slate.css,README.md}` | Crest Slate maths canvas | Claude | CANONICAL (fix in PR #12) |
| `studio/captions/index.html` | Caption Desk UI | Claude | CANONICAL |
| `karlissa/hub/` | FastAPI hub for HF Space | Claude + user | CANONICAL |
| `downloads/karlissa-hub-update.zip` (sent in chat) | hub bundle for HF | Claude | DRAFT until user uploads |
| `Royal-Crest-Academy-Hairstyle-Guide-2027.pdf` (sent in chat) | hairstyle guide | Claude | delivered |

## 6. Next action

Ask nothing; wait for the user's next request. If they say "merge it", merge PR #12 with
`gh api -X PUT repos/karlo990/royal-valerius-/pulls/12/merge -f merge_method=merge`, then confirm
`https://royalcrestzw.vercel.app/portal/slate` (no slash) loads styled.

---

## 7. House style (non-negotiable)

**Captions**
- Open with one striking fact or hook. Short (40–70 words), warm, simple English: the audience is local Bikita parents ("they are from Bikita, make it simple").
- Never start with "Wait". Never use the surprised-face emoji (😮 😲). At most one emoji per line.
- School posts end with `📞 +263 714 404 090`, then 3–5 hashtags, always `#RoyalCrestAcademy` first.
- **Devotions / verse of the day are never transactional**: no phone, no enrolment, no fees, no "book now". End with a blessing and `#RoyalCrestAcademy #VerseOfTheDay`. Use KJV text quoted exactly; say "Verse of the day".
- Give a WhatsApp Status one-liner (under 25 words) with captions when relevant.
- Film CTA line used: "Secure your child's Form One place in Bikita today. Bookings are open now."
- Facebook link limit: put the link in the first comment or "link in our bio"; WhatsApp captions can carry the full `https://` link (WhatsApp Business website field needs `https://`).

**Brand**
- Colours: navy `#0a1f5c`, deep `#071640`, gold `#c9a227`/`#f2b705`, paper `#f6f1e6`, card `#fffdf8`, line `#e4dccb`, ink `#1a2340`.
- Fonts (self-hosted in `/assets/fonts/`): Newsreader (serif, headlines, italic *em* in gold), Plus Jakarta Sans (UI/body). Handwriting in films: Caveat ("Hand").
- Crest image: `/studio/assets/brand/crest-640.webp`. Never use AI-generated badges in photos: crop them out.
- Subjects/selling points used so far: ZIMSEC + Cambridge + HEXCO, robotics, coding, Mandarin Connect (Mandarin + culture; link to Bikita lithium mine / Sinomine), French, boarding with four meals a day, rugby.

## 8. Flyer Studio (static site in `studio/`)

- Templates (A4/portrait/square): `prospectus, royal, stadium, labsheet, block, notebook, element` (`css/flyer.css`).
- Social posts live in `js/posts.js`: `POSTS[key] = {label, formats:['portrait','square'], caption:[lines], plain}` plus a renderer `(crest, phone, P, full) => html` in the second map; per-post CSS in `css/posts.css` scoped as `.flyer.ps-<key>` and `.f-square`.
- **Verse of the day system**: renderers `verse-of-the-day` (navy), `verse-pink`, `verse-exams` (teal), `verse-week` (amber) reuse Prospectus parts (`fl-head`, `fl-kicker`, `fl-title`, `fl-foot`, `fl-cta`) + `.vd-*` blocks and an SVG sunrise arch `sunrise(theme)` with palettes in `SKY = {navy, pink, teal, amber}` (7 colours: 5 sky stops, 2 hill fills). New theme = add SKY entry + one CSS block overriding `--navy --navy-deep --ink --gold --gold-dark --muted --stone`, background, `.vd-note`, `.fl-foot`; add the class to the shared `:is(...)` selector list. Square hides `.vd-prayer` by default; re-enable per theme if space.
- Mandarin Connect posts `zh-*` (pictures, count, great-wall, quiz, character): paper texture, red `var(--red)` kicker, polaroid photos, 汉字 large.
- **Export** (served over HTTP, not file://):
  ```
  python3 -m http.server 8765   # repo root
  // node script: page.goto('http://localhost:8765/studio/?batch'); await Studio.ready;
  // jobs = Studio.jobs('prospectus', fmt) → filter j.key==='post-<key>'
  // r = Studio.mountForShot(j.key, j.kind, 'prospectus', fmt); await document.fonts.ready;
  // page.locator('#batch-stage > .flyer').screenshot(...)  viewport 1080×1920, r.fits=false → text overflow
  ffmpeg -i x.png -q:v 2 studio/social-extra/<name>.jpg
  ```
  `studio/tools/render_all.mjs` does whole templates in batch. Playwright import from scratch scripts:
  `import { chromium } from '/home/user/royal-valerius-/studio/video-geo/node_modules/playwright/index.mjs'`.
- Kill the test server with `ps aux | awk '/[h]ttp.server 8765/{print $2}' | xargs -r kill` (plain `pkill -f` kills its own shell, exit 144).

## 9. Film pipeline (`studio/video-<name>/`, newest = `video-maths`)

```
script.json      voices + scenes + lines {id, scene, voice, say}
voice-kit/       make_voices.py (ElevenLabs with-timestamps API, resumable) → voices.zip; zipped to downloads/<name>-voice-kit.zip
tools/import_voices.py voices.zip  → audio/<id>.mp3 + <id>.json (char alignment); run with python3 -I
tools/timeline.py → build/timeline.js  window.TL = {total, scenes[{id,start,end}], lines[{id,start,end,chars,times}], real_audio}
build/stage.html  1280×720 DOM/SVG/Canvas stage; window.ready; async window.renderAt(t) — pure function of t
tools/render.mjs  stills 5,20,… | video 30 T0 T1 partN.mp4 (Playwright DPR 1.5 → JPEG q93 → ffmpeg image2pipe, crf 17)
build/final.sh   4 parallel parts → concat -c copy → glitchscan → music.py → sfx.py → mix.py → WhatsApp encode
tools/glitchscan.py  160×90 gray frame-diff; flags spikes > 4× local median; check each spike with a frame grab
tools/music.py   synth bed (build/music.wav)   tools/sfx.py  synthesised effects on cues (build/sfx.wav)
tools/mix.py --video --music --sfx --bed 0.3 [--duck 10] [--music-start s] [--loop-from s] --name out
```

**Voice workflow (user's PC, PowerShell)**:
```
iwr https://github.com/karlo990/royal-valerius-/raw/mandarin-connect-video/studio/video-<name>/downloads/<name>-voice-kit.zip -OutFile kit.zip; Expand-Archive kit.zip -DestinationPath . -Force; cd <name>-voice-kit; $env:PYTHONIOENCODING="utf-8"; $env:ELEVENLABS_API_KEY="<REDACTED: user supplies>"; $env:NO_PAUSE="1"; py make_voices.py
```
"Done: N lines" → user uploads voices.zip. Voices: Teacher Tendai `KpK2JUuSi307pzhaXdaL`, Sam (commentator) `FSjbVsYdGQ5KJ6l0Ul2r`.
API keys: only in the command given in chat or a gitignored `.env`; never in a kit, a commit or this file.

**Timing** (`timeline.py`): `LEAD[scene]` before first line, `TAIL[scene]` after last, `GAP_LINE .4`, `GAP_SCENE 1.0`,
`HOLD_AFTER[id]` pauses for visuals. To hit a target length scale HOLD_AFTER (Newton film: ×0.62 → 298.84 s).
`cue(id, 'substring', nth)` returns the exact time a word is spoken (ElevenLabs alignment) — sync every animation to words, never to guesses.

**Animation helpers in stage.html**: `k(t, start, dur)` clamped 0..1; easings `eo`, `eio`, `back`; `show(scene, w)` with
`sceneW(id, in, out)` crossfades; `fade(el, t0)`. Keep a paper/background layer on for one continuous stretch across
adjacent paper scenes (switching it per scene flashes white between them).

**Video clips inside the stage**: pre-extract to frames (`ffmpeg -i clip.mp4 -q:v 3 assets/clipfr/<dir>/%04d.jpg`, gitignored),
then `frame(el, dir, n, max)` swaps `img.src` and awaits `img.decode()` so every rendered frame is exact (no `<video>` seeking).
Speed change = scale n (library clip at 0.72×). Start a clip at an exact story beat: `c0 = cue('n02','falls') + .25 - 5.54`.

**Watermark masking**: crop then rescale, e.g. CapCut AI mark → `crop=1180:664:100:56,scale=1280:720:flags=lanczos`; verify on stills from the start, middle and end.

**Newton "thought" doodle transition** (the technique to reuse for any "idea forms" moment):
1. still photo slow push-in (`scale(1.02 + .22*eio(x))`, origin at the subject's hand/apple);
2. user's doodle clip on top with `mix-blend-mode: screen` (black drops out, chalk lines remain), opacity ramps from `cue('n05','think')`;
3. SVG layer of hand-drawn equations: paths drawn with `pathLength=1` + `stroke-dashoffset`, text revealed with `clip-path: inset(0 X% 0 0)`, all through a chalk filter `feTurbulence(fractalNoise, 1.4) + feDisplacementMap(scale 2.2)`; staggered every 0.55 s; key item in gold.

**Photoreal 3D devices** (`video-maths/build/devices.js`, Three.js r128 from `node_modules/three/build/three.min.js`):
tablet + laptop from `ExtrudeGeometry` rounded slabs, metal `MeshStandardMaterial` lit by a PMREM environment made
from a canvas equirect, PCF soft shadows, procedural oak desk. Screens are `CanvasTexture`s redrawn each frame from real
site screenshots (tablet 2048×1536, laptop 2560×1600) plus live overlays: selection box "Reading…/Read ✓", tap ripples,
panel reveal, green "Checked" glow, graph veil. Camera/device poses are keyframed per scene in `pose(sc,t)` and blended.
Layout rule: devices right, headline left over a dark left gradient (white screens otherwise fight the text).
Marketing screenshots: fresh page per shot, hide toasts, Caveat-styled "handwriting" instead of real scribbles.

**Sound effects** (`tools/sfx.py`): synthesised with ffmpeg lavfi (`aevalsrc`, `anoisesrc`), placed with `cue()`, mixed
with `adelay` + `amix normalize=0`; ffmpeg durations need a leading zero (`d=0.25`). The user **dislikes scratchy
sounds**: no chalk, pencil, rustle or keyboard noise. Kept: birds, thud, whoosh, pop, clunk, creak, chime, ding, tick, shutter, tap, rise, soft "no".

**Mixing** (`tools/mix.py`): voices compressed + EQ; music high-passed, EQ-dipped at 1–4 kHz, ducked by a voice
sidechain (`--duck` ratio: 10 hard, 4–6 gentle and still audible), `--bed` = level in gaps (0.3 normal, 0.4 "make it
audible"); sfx ducked lightly by voices; two-pass loudnorm to −14 LUFS; video stream copied. **Audio-only changes
never need a re-render**: re-run sfx.py/mix.py on `build/video_silent.mp4`, then swap audio into the WhatsApp file:
```
ffmpeg -i out/X_whatsapp.mp4 -i out/X.mp4 -map 0:v -map 1:a -c:v copy -c:a aac -b:a 128k -movflags +faststart tmp.mp4
```
User songs: copy into `build/` (gitignored), check length + loudness (`ebur128`, astats RMS per 5 s). Vocal intro →
instrumental for teaching: build one wav (`loudnorm` each part, `dynaudnorm` on the instrumental, cut out near-silent
breaks, `acrossfade d=3` at the lesson start) and pass it as `--music`. Warn about copyright on Facebook.

**Delivery**: WhatsApp = 1280×720 libx264 crf 24 `-tune animation` aac 128k (~19 MB for 5 min). Facebook = full mix
(~110 MB). For GitHub download (< 100 MB) two-pass `-b:v 2250k` into `downloads/`, then give
`curl.exe -L -o "$HOME\Downloads\<file>" "https://raw.githubusercontent.com/karlo990/royal-valerius-/mandarin-connect-video/<path>"`.
Run long jobs with `run_in_background` (a foreground command dies at 2 min and a turn end can kill an unfinished encode: check duration before committing).

**Progress / ETA**: read `build/render_part*.log` (`frame N/M  Ts`), estimate from the slowest part; Three.js parts are the slow ones; 4 cores only, more parallel parts don't help.

## 10. Films made (reuse their scripts as templates)

| Folder | Film | Notes |
|---|---|---|
| `video-geo` | Geography film | has `arrange.py`, `flyer_shot.mjs`, `sfx.py` |
| `video-zh` | Mandarin "Count & write", 2:59.7 | paper scenes, character stroke writing |
| `video-maths` | "Newton's apples: what is x? + Crest Slate", 4:59 | 19 scenes: story, pickup (doodles), title, mystery, balance, terms, subst, word, quiz, recap, bridge, reveal, snap, checked, graph, marking, features, anydevice (URL, no app), outro (gold Form One CTA). Theme line "From Newton's quill to your stylus". Don't open the marketing half with the portal; show the Slate URL. |
| `video-bio`, `video-cake`, `video-tg` | earlier films | same tools |

## 11. Web tools

- **Crest Slate** (`portal/slate/`): canvas (pen, highlighter, eraser, line, move, select-to-read), paper types (blank, lined, squared, graph, x–y axes), photo upload, Tesseract.js 5.1.1 OCR (Otsu binarise, ×3 scale, PSM 6; normalise "−"→"-", watch "4x"→"dx"), KaTeX 0.16.9, math.js 12.4.2 verification by substitution, pluggable solver `SL.SOLVER = hub | ollama | local` (local solves linear/quadratic/arithmetic offline), syllabus select (Cambridge IGCSE 0580, O Level 4024, ZIMSEC 4004), question bank, hint/check/marking.
- **Caption Desk** (`studio/captions/`): staff login → `POST /api/v1/captions {about, facts, kind: post|film|lesson|event|devotion|reply, platform, length}` → `{caption, status, hashtags}`; server strips "Wait", surprised emoji, and any phone/enrolment line from devotions.
- **Testing without network**: serve CDN libs via Playwright `page.route()` from `npm pack` copies (keep them in the scratchpad), or abort CDN requests for layout checks.

## 12. Gemini / image prompt practice

- Photoreal prompts name: subject + setting (Zimbabwean school / library / Bikita landscape), lens and light ("35 mm, soft window light, shallow depth of field"), wardrobe (navy/gold uniform), and **"no text, no logos, no badges"** (AI badges get cropped out later).
- Hairstyle guide: five girls' styles incl. "Free hand bridge style"; boys' short cut; source images from the user, crop logos.
- Short video clips from Gemini/CapCut: ask for 8 s, static tripod or slow dolly, no on-screen text; mask watermarks by crop.

## 13. Working rules for the next model

- Commit trailers the user's harness expects (per session) and push to `mandarin-connect-video`; open PRs to `main` only when asked; never merge without the user saying so.
- Never commit API keys, the user's email, or downloaded media you weren't asked to publish; songs stay gitignored.
- Untrusted uploads: copy into their own folder; run Python on them with `-I`.
- Answer the user in short, plain lines; they read on a phone. Deliver files first, then the caption.
