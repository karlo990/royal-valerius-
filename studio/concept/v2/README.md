# Concept posters v2

27 Royal Crest concept flyers, each in five sizes, published on the website at **`/new/`** with captions.
v1 (`../poster.html`) was the two-poster prototype; v2 is the full system.

| Size key | Pixels | Use |
|---|---|---|
| `feed` | 1080 × 1350 (4:5) | Instagram and Facebook feed |
| `sq` | 1080 × 1080 (1:1) | Square post, WhatsApp chats |
| `grid` | 1080 × 1440 (3:4) | Fills the Instagram profile grid exactly |
| `story` | 1080 × 1920 (9:16) | WhatsApp Status, Stories, Reels cover. Text kept out of the top 250 px and bottom 320 px |
| `wide` | 1920 × 1080 (16:9) | Landscape: YouTube, Facebook, website, screens |

## The four looks (assorted on purpose)

| Family | Look | Headline |
|---|---|---|
| `studio` | Ivory seamless studio, soft daylight | Archivo 900 caps, key word in gold foil |
| `night` | Navy set, warm key light with a blue rim, the **crest yellow** `#F8C828` | Archivo 900 caps in ivory, key word in crest yellow |
| `editorial` | Framed page, warm paper (the "Oxford" look) | Newsreader serif, second line in italic gold |
| `corner` | Gallery-style corner details and window-light shadows | One big word, caps line underneath |

Every flyer carries the crest lockup, WhatsApp +263 714 404 090, `royalcrestzw.vercel.app` and the Form 1 · 2027 pill.
**No flyer is numbered.**

## How a flyer is made

1. `concepts.js`: copy (headline, sub-headline, caption, Status line, hashtags) and a Three.js builder for the hero object.
2. `engine.js`: picks the layout for the family and size, fits the headline to its box, then **frames the camera so the
   object fills the space the text leaves** (it projects the model's silhouette and adjusts distance and view offset).
   Lighting follows film practice: a warm key light, a coloured rim light behind for separation, a fill at about half the key,
   then GTAO contact shading, bloom only on glowing parts (bulb filament, windows, flame), a vignette and fine grain.
3. `render.cjs`: renders every concept × size with headless Chromium.
4. `build_new_page.py`: converts the renders to JPG + WebP and writes `/new/index.html`.

```bash
# from the website folder, keep running:
npx http-server . -p 8766
# in studio/concept:
npm install                      # three.js 0.170 (+ playwright: npx playwright install chromium)
node v2/render.cjs               # all 27 × 5 sizes → v2/out/   (or: node v2/render.cjs aim-higher --sizes story)
python3 v2/build_new_page.py     # → /new/flyers/… and /new/index.html
```

Preview one flyer in a browser: `http://localhost:8766/studio/concept/v2/poster.html?id=aim-higher&s=story`.

## Adding a flyer

Copy one entry in `concepts.js`, give it a new `id`, a `family`, the copy and a `build(M)` that returns a `THREE.Group`
standing on the floor (y = 0), about 2–4 units across. Helpers are in `kit.js` (books, pencils, keycaps, mortarboard,
crumpled paper, shield, gears, puzzle pieces, lathe/extrude/tube shortcuts and the brand materials). Then add the id to
`ORDER` and a topic in `build_new_page.py`.

## Facts used in the copy

From the school's own data (`studio/data`, `studio/js/posts.js`): ZIMSEC, Cambridge and HEXCO; one practical trade per year
(bakery, welding, solar PV, carpentry, cosmetology); four homemade meals a day; 10 clubs, 10 sports and 5 indoor games;
ChiShona, isiNdebele, French club and Mandarin Connect; one-to-one and small-group lessons, Form 1 to Upper 6.

From outside sources (please re-check before each posting season):
- Teens 13–18 need 8–10 hours of sleep: American Academy of Sleep Medicine, https://aasm.org/resources/pdf/pressroom/teen-sleep-duration-recommendation.pdf
- 2025 Grade 7 results were released on 28 November 2025: https://www.newsday.co.zw/local-news/article/200049088/grade-7-results-out-zimsec
- About 30,000 government Form 1 boarding places for 2026: https://www.heraldonline.co.zw/zimbabwean-education-ministry-says-only-30000-form-one-boarding-places-available-for-2026-amid-huge-demand/
- Five compulsory learning areas for Forms 1–4 under the Heritage-Based Curriculum: https://www.pressreader.com/zimbabwe/the-manica-post/20240426/281642490236442
- Lighting approach (warm key, rim for separation): https://renderman.pixar.com/only-a-dream · https://3drender.com/light/3point.html
