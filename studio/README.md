# Royal Crest Flyer Studio

Make flyers for every subject, from ChiShona and isiNdebele to Chemistry and the
technical subjects, in five professional templates and four sizes. Pick, preview,
edit the text, download. Or download all of them at once as a ZIP, with a
ready-made WhatsApp caption for each.

**137 flyers per template and size:** 24 subjects × 5 flyer types, plus 17
"Molecule of the week" flyers with real chemistry data. That is 685 designs per
size across the five templates, 2,740 in all.

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

1. **Template:** Prospectus, Lab Sheet, Bold Block, Exercise Book or Element.
2. **Flyer type:** Spotlight (enrolment), Tutoring (private lessons), Fun fact,
   Exam tip, Quiz (answer printed upside down), or Molecule.
3. **Size:** Square post, Portrait post (Instagram 4:5), Story / WhatsApp status
   (content kept clear of the app controls), or A4 print (300 dpi).
4. **Subject:** search or pick from the departments, or pick a molecule.
5. **Edit text:** click *Edit text*, then click any text on the flyer to change
   it. Your edits are used when you download that flyer.
6. **Download PNG**, or open **All flyers** and **Download all as ZIP**
   (includes `captions.txt` and `flyers.csv`).
7. **Surprise me** picks a random subject, flyer type and template.
8. **School details** sets the phone, website, tutoring days and tutoring fee.
   Days and fee only appear on tutoring flyers once you fill them in; nothing
   prints as a blank placeholder.

## Changing the content

| What | Where |
|---|---|
| Subjects, taglines, topics, fun facts, exam tips, quizzes, tutoring focus | `data/subjects.json` (set `"offered": false` to hide a subject) |
| School name, phone, website, department colours, photos | `data/brand.json` |
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
