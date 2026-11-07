# Royal Crest Academy: Content Playbook v2

How every Royal Crest flyer, post and film should look, so they all read as one family with the website.
Drawn from the website (`assets/css/styles.css`), the Flyer Studio (`studio/`), the film series
(`studio/video*`), Karl's memory notes, and current platform specs (Nov 2026).

**v2 decisions:** website on every flyer is `royalcrestzw.vercel.app`; the crest yellow `#F8C828` is a second accent
(the navy "night" look); every post ships in **five sizes** (1:1, 4:5, 3:4, 9:16, 16:9); flyers are **never numbered**;
looks are **assorted** (studio, night, editorial, corner) so the grid does not repeat. See `concept/v2/README.md`.

---

## 1. Who it is for, and the tone

- **Audience:** parents of Grade 7 learners, **boarder parents first**. Decisions on content and fees come from Mom.
- **Promise:** "An academy for curious minds and capable hands." Motto: **Science · Innovation · Skill.**
- **Tone:** calm, confident, factual. Premium means restraint, not shouting. No "total payable", no big
  cost cards: keep fees low-key.
- **Facts to repeat:** doors open 1 January 2027 · Form 1 intake after Grade 7 results · ZIMSEC & Cambridge
  aligned · full supervised boarding · one vocational trade per learner per year · 1226 Chinobva, Nyika, Bikita, Masvingo.
- **People:** Principal Mrs Charity Binda. Film presenters so far: Teacher Tendai, Chef Chipo, Wén Lǎoshī, Sam.

## 2. The look (the "architecture")

The website and every template use the same rules:

| Element | Rule |
|---|---|
| Colour | Navy `#13215a` (deep `#0a1330`), gold `#d2ae4c`, ivory `#f6f3ec` / paper `#fbfaf6`, **crest yellow `#F8C828`** (on navy only: it is too pale to read on ivory). One muted department accent at most (see `studio/data/brand.json`). |
| Headline | **Newsreader** serif, two-tone: first line roman navy, second line *italic* (navy on light, gold on dark). e.g. "Three words on our crest. / *One promise to every family.*" |
| Body | **Plus Jakarta Sans**, short lines, muted ink `#525a70`. |
| Labels | Small caps eyebrow with a short gold rule: `— OUR APPROACH`. Numbered: `01`, `LESSON 04 · THE OVEN`. Data labels in IBM Plex Mono. |
| Shapes | The campus **arch** (gold outline round-top frame), thin hairline dividers, 6–10 px radii, soft single shadow. |
| Grid | Swiss grid: strict margins, one focal image, one accent. Big scale contrast: one huge headline, one quiet caption. |
| Photos | Real campus, library and uniform photos first. AI images only from `studio/PHOTO_PROMPTS.md`, matching uniform and crest. |
| Sign-off | Crest lockup top left ("Royal Crest Academy / SCIENCE · INNOVATION · SKILL"). Form 1 · 2027 pill, WhatsApp +263 714 404 090 and `royalcrestzw.vercel.app`. No series numbers on flyers. |

**Never:** clip art, more than two typefaces, rainbow gradients, stretched one-size-fits-all layouts,
text over busy photo areas, fee totals as the headline.

## 3. Sizes

| Use | Size | Notes |
|---|---|---|
| Instagram / Facebook feed | **1080 × 1350** (4:5) | Main post size. The profile grid now shows posts as **3:4**, trimming about 34 px off each side: keep text 60 px in from the left and right edges. |
| Instagram grid-exact / carousel | 1080 × 1440 (3:4) | Fills the profile grid tile exactly. |
| Square (legacy) | 1080 × 1080 | The 3:4 grid trims about 135 px off each side. Avoid for new posts, or keep content in the middle 810 px. |
| Story / WhatsApp Status / Reel | **1080 × 1920** (9:16) | Keep text out of the top ~250 px and bottom ~320 px (app controls), and ~65 px from the sides. Reel covers: design for the 3:4 crop. |
| Film (landscape) | 1920 × 1080, 30 fps | YouTube, Facebook, website. |
| Print | A4, 300 dpi | Studio "A4 print". |

**Films for Status:** WhatsApp Status takes 9:16, about 16 MB per clip, and 30–60 s per segment
(guides disagree; check in the app). Longer videos get split. A 3-minute film needs a **30–60 s portrait cut-down** per post, encoded
720 × 1280, H.264 (as `studio/video/build/portrait.sh` already does).

## 4. The film system (Lab Series, Mandarin Connect, Geography, Bakery, Technical Graphics…)

Every film shares: crest lockup top left · subject pill top right · lesson progress tabs along the top ·
numbered eyebrow + two-tone serif headline · teacher commentary bar bottom left (avatar initial, name,
subject) · "FORM 1 · 2027" + gold phone pill bottom right · rotating gold dial/lens for close-ups.
Each film has a **landscape** build and a **portrait** build (`?portrait` in `stage.html`), never a
stretched crop.

Pipeline (`studio/video/README.md`): `script.json` → ElevenLabs voices → timeline from real audio →
original music bed → Playwright frame render → mix → MP4.

## 5. Flyer system (Flyer Studio)

Seven templates (Prospectus, Royal, Stadium, Lab Sheet, Bold Block, Exercise Book, Element) × flyer types
(spotlight, tutoring, fun fact, exam tip, quiz, answer, molecule) × four sizes, plus 23 fixed social posts.
One content model (kicker, title, subtitle, body, list, visual, CTA) and text-fitting that never collides.
Series flyers (Physics in 20, Art tools, Electrovalency, Mandarin, Hackathons) follow the same header and
footer, so a series reads as one set on the grid.

**Premium checklist before posting**
1. One message, readable in 2 seconds on a phone.
2. Headline is the biggest thing by far. Two tones, max 8 words.
3. One real photo or one precise diagram, not both competing.
4. Gold used for 1–2 accents only.
5. Crest lockup and the contact bar in the same place as every other post.
6. Teacher has checked facts and quiz answers.
7. Previewed at phone size and in the 3:4 grid crop.

## 6. Settled in v2, still open

| Item | Decision |
|---|---|
| Website on posts | **`royalcrestzw.vercel.app`** (older flyers still say `www.royalcrest.co.zw` or `royalcrestacademy.com`) |
| Numbering | None on flyers. Use the caption, not the artwork, if a series needs an order. |
| Sizes | All five for every new post: 1080×1080, 1080×1350, 1080×1440, 1080×1920, 1920×1080 |
| Email on posts | Still open: `valeriushall2026@gmail.com` on flyers, `info@royalcrestacademy.com` in the prospectus |
| Gold | Website gold `#d2ae4c` for gold; crest yellow `#F8C828` on navy; the Royal template's `#F2B705` is close to the crest yellow |
| Phone format | `+263 714 404 090` on posts (films still show `0714 404 090`) |
| Music | Use original music on posted films, not the commercial song in the portrait Mandarin build. |
| Two code copies | `karlo990/royal-valerius-` deploys to royalcrestzw.vercel.app and is the source of truth; `karlo990/royalcrest` has an older Flyer Studio. |
