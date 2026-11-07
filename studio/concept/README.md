# Concept posters: teardown and Royal Crest recipe (v1)

Three reference posters taken apart, then rebuilt as Royal Crest Academy posts.
Rendered examples: `rca-concept-a_feed`, `a_story`, `b_feed`, `b_story` (1080 × 1350 and 1080 × 1920).

---

## 1. What each reference is doing

### Ref 1 · "IDEAS NEED DIRECTION" (EmelieX Studio): metaphor object

| | |
|---|---|
| Format | 736 × 1104 = **2:3** (a Pinterest size; Instagram would trim it, so use 4:5) |
| Grid | Left margin ≈ 8 % of width. Logo and phone number top left. Headline in the top-left third, product in the right third, floor in the bottom 40 %. |
| Headline | Heavy geometric grotesque (Gilroy/Montserrat Black type), all caps, 3 short lines, tight leading (~0.9). The last word is in the accent colour. |
| Accent | **One colour only** (red), used on the keyword, the short rule under it **and** the key object (target rings, paper plane). That repetition is what ties text to picture. |
| Sub | One sentence, ≤ 7 words, ~⅕ of the headline size. |
| Image | Studio product photo or AI image: seamless white set, soft key light from upper left, contact shadows, foreground paper blurred (shallow depth of field). |
| Story | Crumpled paper (failed tries) → dashed flight path → plane in the bullseye. Before and after in one glance. |
| Space | About half the canvas is empty white. That emptiness is what reads as "premium". |

### Ref 2 · "DELETE 'AI will replace me' mindset" (Mridul Hassan): action metaphor + series

| | |
|---|---|
| Format | 735 × 919 = **4:5**, the Instagram feed size |
| Grid | Corner metadata system: author top left, credit top right, series counter `[ Day 05\365 ]` mid right, two captions at the bottom corners, logo bottom left. Small text (~1.6 % of height) at a fixed margin. |
| Headline | One huge word (the verb) in the accent colour, then a two-line caps sub-headline in black. |
| Image | A hand drops a red keycap into a wire-mesh bin. The **verb is acted out** by the picture. Window-blind (gobo) shadows across the wall and floor add depth and a real-room feel. |
| Accent | Red again on the word **and** on the object. Everything else is black, white and grey. |
| Series | "Day 05 of 365" turns single posts into a habit people follow. |

### Ref 3 · "Analysis paralysis": paper-craft illustration

| | |
|---|---|
| Format | 736 × 1318 ≈ **9:16** (Story / Status / Reel) |
| Image | Layered cardstock sculpture: visible cut edges, soft shadows between layers, one warm key light from the front left, taupe backdrop. |
| Type | None laid on top. The words are physical objects in the scene (paper ribbons: DOUBT, OVERTHINKING, TOO MUCH DATA). |
| Colour | Analogous warm palette: burgundy `#643227`, terracotta `#a26c53`, ochre, kraft `#d5ac92`. No pure black or white. |
| Why it works | Handmade texture is a 2026 trend, and it reads as crafted and human rather than as stock or AI. |

## 2. The shared formula

1. **One idea, one physical metaphor.** The object explains the message; the words only name it.
2. **One accent colour**, on the keyword and on the key object, nothing else.
3. **Neutral studio set**: seamless backdrop, soft key light, real contact shadows, window gobo for depth.
4. **Headline ≤ 4 words**, heavy, keyword in the accent. Sub-headline ≤ 8 words.
5. **Before → after** inside the picture (crumpled → bullseye, old mindset → bin).
6. **Small corner metadata** and a **series counter**. They make it look designed and make people follow it.
7. **40–50 % empty space.**

## 3. Royal Crest mapping

| Reference | Royal Crest |
|---|---|
| Red accent | **Gold foil** gradient `#7d5f17 → #b8902f → #e2c26a → #8a6a1c`, on big type only. Flat gold `#d2ae4c` on ivory is only 1.9 : 1 contrast, too weak to read, so it stays for objects and rules. |
| Black text | Navy `#13215a` |
| Pure white set | Ivory studio `#f2f0eb` (the website's paper colour) |
| Heavy grotesque | **Archivo 900** (already in the Flyer Studio) |
| Logo | The website crest lockup: crest + Newsreader "Royal Crest Academy" + gold small caps motto |
| Day 05\365 | **Mindset Series `[ 03 \ 10 ]`** for Grade 7 parents |
| Contact | WhatsApp `+263 714 404 090`, Form 1 · 2027 pill, `royalcrest.co.zw` |

Safe zones: feed 1080 × 1350 with text ≥ 60 px from the sides (the 3:4 profile grid trims ~34 px each side).
Story 1080 × 1920 with no text in the top 250 px or bottom 320 px. Story is **re-composed, never stretched**.

## 4. How the two examples were made

`poster.html` (Three.js 0.170, rendered with Playwright) builds the hero object as a real 3D scene:
a curved seamless studio sweep, a soft key light, and an environment light for reflections.
- **A · Talent needs direction:** navy/ivory target with a gold rim on a wooden easel, a gold paper plane in
  the bullseye, crumpled paper drawn as dented polyhedra, and the dashed flight path projected from the 3D positions.
- **B · Delete "I'm not a science person" mindset:** navy keycap with a gold Delete legend over a wire-mesh bin
  (a mesh texture used as an alpha map), crumpled papers inside, and a spotlight projecting a window frame (the gobo).

`?c=a|b` picks the concept and `?s=feed|story` the size. Each size has its own camera and layout.
What the 3D build can't do well: hands, people, and paper-craft figures. Use AI images for those (section 5).

## 5. AI image prompts (Gemini / Nano Banana), house style

Generate the hero image **without text**, then drop it into the layout. Keep the empty area where the
headline goes. Check uniform, crest and faces before posting.

**A · photoreal "Talent needs direction"** (4:5)
> High-end advertising studio photograph, vertical 4:5. Seamless warm off-white backdrop (#F2F0EB) curving into
> the floor. On the right edge, partly cropped by the frame, a navy-blue and ivory archery target with a gold
> bullseye and a thin polished gold rim stands on a light wooden easel, turned about 60° to the left. A paper
> plane folded from matte gold paper is stuck in the bullseye. White crumpled exercise-book pages lie on the
> floor; the nearest ones are softly out of focus. Soft key light from the upper left, soft contact shadows,
> 85 mm lens, shallow depth of field, calm and minimal. Leave the upper-left half completely empty. No text, no logos.

**B · photoreal "Delete" with a hand** (4:5)
> Minimal studio photograph, vertical 4:5, warm off-white wall and floor with soft window-blind shadows falling
> diagonally from the left. A hand in a navy school-blazer sleeve with a thin gold cuff stripe reaches in from the
> top right and drops a large glossy navy keyboard keycap, printed with the word "Delete" and a small bin icon in
> gold, into a black wire-mesh waste-paper bin full of crumpled white papers, lower centre of frame. Photoreal,
> soft shadows, premium advertising look. Leave the upper-left third empty. No other text.

**C · paper-craft "Too many questions?"** (9:16, two-slide before/after)
> Handcrafted 3D paper sculpture diorama, vertical 9:16. A parent figure made of layered cardstock sits at a
> desk, head in hands. Swirling paper ribbons circle the head, printed with the words "WHICH SCHOOL?",
> "BOARDING?", "ZIMSEC OR CAMBRIDGE?", "FEES?", "GRADE 7 RESULTS". Palette: navy, muted gold, ivory, kraft
> brown, on a warm taupe backdrop. Visible cut edges, soft shadows between paper layers, one warm key light
> from the front left, shallow depth of field. Keep the bottom fifth empty.

> Slide 2 (answer): the same diorama, the parent now sitting up and smiling. The ribbons have straightened into
> a single navy ribbon lying flat on the desk, printed in gold "ROYAL CREST ACADEMY". Same light and palette.

Layout for C: no type over the picture. A navy band in the bottom fifth with a Newsreader headline,
"Too many questions? / *One conversation.*" (italic in gold), and the WhatsApp pill. Check the
ribbon spelling in the generated image (AI text can come out misspelt).

## 6. More ideas for the series (headline · object)

| # | Headline | Metaphor object |
|---|---|---|
| 3 | Potential needs **structure.** | A gold seedling growing from an open textbook, tied to a navy plant stake |
| 4 | Small steps. **Big results.** | Textbooks stacked as a staircase, a gold mortarboard on the top step |
| 5 | Practice makes **permanent.** | Pencils worn down from long to short in a row, ending in a gold trophy |
| 6 | Unlock **their potential.** | A gold key in a navy padlock shaped like the crest shield |
| 7 | Noise off. **Focus on.** | A phone face-down in a drawer, an open book and desk lamp beside it |
| 8 | A second **home.** | A small house folded from exam paper, warm light glowing in its windows at dusk |
| 9 | Curiosity is the **spark.** | A match lighting a gold bulb filament inside a glass flask |
| 10 | Built by **hands.** | A learner's hands holding a small wooden bridge model over a drawing board |

Each one follows the formula: one object, gold on the keyword and the object, ivory set, crest lockup, series counter.

## Sources

- Instagram 3:4 profile grid: https://www.kapwing.com/resources/instagrams-new-grid-layout-size-and-dimensions-2025/
- Story / Reel safe zones: https://www.hopperhq.com/blog/instagram-reel-size/ · https://www.inro.social/blog/instagram-story-size
- Paper-craft prompt wording: https://youmind.com/prompts/3d-handcrafted-paper-craft-diorama-30692 · https://gptprompts.ai/ai-image-styles/paper-craft
- Gobo window light: https://expertphotography.com/what-is-a-gobo · https://planetphotoshop.com/using-photoshop-to-create-digital-gobos.html
- 2026 type and texture trends: https://www.creativebloq.com/design/fonts-typography/breaking-rules-and-bringing-joy-top-typography-trends-for-2026 · https://www.creativebloq.com/design/graphic-design/texture-warmth-and-tactile-rebellion-the-big-graphic-design-trends-for-2026
