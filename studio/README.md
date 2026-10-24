# Royal Crest Flyer Studio

Make flyers for every subject, club, sport and indoor game, from ChiShona and
isiNdebele to Chemistry, Mandarin, karate and rugby, in seven templates and four
sizes, plus six fixed posters from the school's brief. Pick, preview, edit the
text, add your own photos, download. Or download a whole set as a ZIP, with a
ready-made WhatsApp caption for each.

**Per template and size:**

| What | Flyers |
|---|---|
| 24 subjects × 6 types (spotlight, tutoring, fun fact, exam tip, quiz, quiz answer) | 144 |
| 25 clubs, sports and indoor games × 4 types (spotlight, fun fact, quiz, quiz answer) | 100 |
| "Molecule of the week" (PubChem + RDKit) | 17 |
| Series posters (portrait, A4, story; five of them also square) | 6 |
| Social media posts (portrait only) | 21 |

That is up to 288 flyers per template and size, and about 7,400 combinations in
all. Every combination is checked to fit.

### Social media posts

Twenty-one ready-made designs for the Facebook and Instagram feed (portrait 4:5,
1080 × 1350), under **Social media posts** at the top of the list: Boarding
pass, Fees receipt, Periodic table, Newspaper front page, Skill tree (game),
Boarders’ menu, Lock-screen alerts, Parents’ quiz, Weather forecast, Polaroid
board, Movie poster, Recipe card, Chess: next move, Treasure map, Chalkboard
equation and Playlist, plus five for Mandarin Connect: the four tones, count
to ten, the Great Wall, a 谢谢 quiz (answer printed upside down) and writing 中.
The Mandarin posts show the phone number in full (+263) and use small subsets
of two OFL fonts (Ma Shan Zheng, Noto Serif SC) for the Chinese characters. Like the series posters they have their own fixed
design, so the template choice does not apply. *Edit text* works on every line,
the phone number follows *School details*, and each comes with a caption. The
markup is in `js/posts.js` and the styles in `css/posts.css`. Facts on them
(fees, menu, subjects, trades) come from the 2027 prospectus: check them before
posting if the prospectus changes.

### The series posters (from the brief)

1. **Clubs, Sports & Indoor Games**: the full A4 catalogue
2. **Beyond the Classroom**: the cover, with 10 Clubs / 10 Sports / 5 Indoor Games badges
3. **Our Clubs: Minds & Cultures**
4. **Our Clubs: Skills & Creativity**
5. **Sports at Royal Crest**
6. **Indoor Games**

Their wording is fixed and spelled exactly as in the brief. They have their own
design, so the template choice does not apply to them.

## Open the studio

- **Online:** once the website is deployed, go to `www.royalcrest.co.zw/studio/`
  (hidden from search engines).
- **On your computer (Windows):** double-click `studio/start-studio.bat`. It
  starts a small local server and opens the studio in your browser. It needs
  Python (python.org); keep the black window open while you work.
- **Mac / Linux:** in the website folder run `python3 -m http.server 8080`, then
  open http://localhost:8080/studio/.

Opening `index.html` directly from the file explorer will not work: browsers
block the data files when a page is opened that way.

## Using it

1. **Template:** Prospectus, Royal (navy band and gold banner), Stadium (gold
   stripes, sporty), Lab Sheet, Bold Block, Exercise Book or Element.
2. **Flyer type:** Spotlight, Tutoring (private lessons), Fun fact, Exam tip,
   Quiz (answer printed upside down), Answer (a second slide that reveals the
   answer, for a two-picture post), or Molecule.
3. **Size:** Square post, Portrait post (Instagram 4:5), Story / WhatsApp status
   (content kept clear of the app controls), or A4 print (300 dpi).
4. **Subject:** search or pick from the departments, or pick a molecule.
5. **Photos:** under the preview, *Photos on this flyer* lists every photo slot.
   Click **Upload photo** to use your own picture. It is saved in that browser and
   used on every flyer and poster for that item. Slots without a photo show a navy
   tile with a gold icon. **Copy AI prompt** gives a ready-made prompt for an image
   generator; `PHOTO_PROMPTS.md` has the 10 prompts that fill every poster.
   To keep photos for everyone, save them in `assets/photos/` and list them in
   `data/photos.json`.
6. **Edit text:** click *Edit text*, then click any text on the flyer to change
   it. Your edits are used when you download that flyer.
7. **Download PNG**, or open **All flyers** and **Download all as ZIP**
   (includes `captions.txt` and `flyers.csv`).
8. **Surprise me** picks a random subject, flyer type and template.
9. **School details** sets the phone, website, tutoring days and tutoring fee.
   Days and fee only appear on tutoring flyers once you fill them in; nothing
   prints as a blank placeholder.

## Changing the content

| What | Where |
|---|---|
| Subjects, taglines, topics, fun facts, exam tips, quizzes, tutoring focus | `data/subjects.json` (set `"offered": false` to hide a subject) |
| Clubs, sports and indoor games: descriptions, facts, quizzes, photo prompts | `data/activities.json` |
| Project photos by subject or activity | `data/photos.json` + `assets/photos/` |
| Icons | `assets/icons/` (Tabler Icons, MIT, plus three drawn for this project) |
| School name, address, phones, website, colours, photos | `data/brand.json` |
| Molecules | `tools/build_chemistry.py`, then run it (below) |
| Template designs | `css/flyer.css` (one section per template) |
| How content maps onto a flyer | `js/render.js` (`buildModel`) |

Every quiz has four options and an `answer` index (0 = A, 1 = B, …). Please have
a subject teacher check facts and quiz answers before posting.

## The chemistry module

`tools/build_chemistry.py` builds `data/molecules.json` and the structure
drawings in `data/molecules/`:

- **Facts from PubChem**, the chemistry database of the U.S. National Library of
  Medicine (NIH): IUPAC name, molecular formula, molar mass and PubChem CID. One
  batched request, cached in `data/pubchem_cache.json`.
- **Drawings by RDKit**, the standard open-source cheminformatics library. Small
  molecules are drawn as **displayed formulae** (every atom and bond, the way
  ZIMSEC and Cambridge O Level papers show them); larger ones as **skeletal
  formulae**. The functional group is highlighted in the school gold: –CHO for
  aldehydes, –OH for alcohols, –COOH for acids, C=C for alkenes, and so on.
- **Checked twice:** the script recalculates each formula and molar mass with
  RDKit and stops if PubChem and RDKit disagree.

Five aldehydes are included (methanal, ethanal, benzaldehyde, vanillin,
cinnamaldehyde), alongside an alkane, alkene, alcohol, ketone, carboxylic acid,
esters, amides, an arene, a sugar and an alkaloid.

To add a molecule, add a line to `COMPOUNDS` in the script (name, PubChem CID,
functional group, displayed/skeletal, everyday use, fun fact) and run:

```bash
pip install rdkit
python studio/tools/build_chemistry.py
```

## Rendering everything to disk (optional)

The ZIP button covers most needs. For a print run, the batch renderer writes
PNGs, captions, a report and a gallery page to `studio/output/`:

```bash
npx http-server . -p 8080            # in the website folder, keep running
npm i -D playwright && npx playwright install chromium
node studio/tools/render_all.mjs --template all --format a4
```

## How the design works

The studio follows the same four stages as the KarlCon AutoPoster (after
Lin et al., *AutoPoster*, ACM MM 2023): content → layout → text fitting → style.

- **One content model, five templates.** `buildModel()` turns any subject and
  flyer type into the same shape (kicker, title, subtitle, body, list, visual,
  call to action), so every template works for every flyer.
- **A layout per shape, not linear scaling.** Each template has a wide layout
  (square) and a tall one (portrait, A4, story), because stretching one design
  across very different proportions breaks it (AutoPoster §4.5).
- **Text never collides.** `fitFlyer()` shrinks headlines and body text until
  every region fits, then drops list items that still do not fit, never quiz
  options (the overlap and boundary terms of O'Donovan, Agarwala & Hertzmann,
  *Learning Layouts for Single-Page Graphic Designs*, 2014). All 2,740
  combinations are checked to fit.
- **Grid first, decoration second.** The Swiss tradition (Müller-Brockmann,
  Hofmann, Ruder at the Basel School of Design) guides the hierarchy: one
  typeface pairing per template, a strict grid, one accent. Each template
  borrows one real school object instead of clip art: the arch of the campus
  buildings (Prospectus), an engineering drawing's title block (Lab Sheet), a
  tone-on-tone subject symbol (Bold Block), an exercise-book cover label and
  teacher's red pen (Exercise Book), and a periodic-table tile (Element).
- **Colour from the crest.** Navy, gold and ivory, plus one muted accent per
  department.

Fonts: Newsreader, Plus Jakarta Sans, Archivo, Archivo Narrow, IBM Plex Mono and
Caveat, all under the SIL Open Font License and stored in the project. The
studio uses html-to-image (MIT) for PNG export and JSZip (MIT) for ZIP files,
also stored in the project, so it works offline.
