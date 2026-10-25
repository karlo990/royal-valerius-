# Crest Slate: the maths canvas

`/portal/slate/` (in the portal menu as **Crest Slate**). Learners write on a page, snap a photo of a
question, drag a box to read it, and get step-by-step help in the style of Cambridge IGCSE (0580) and
O Level (4024) Mathematics, or ZIMSEC O Level (4004).

- **Templates:** blank, lined, squared, graph paper, x–y axes, isometric dots, number lines, chalk slate.
- **Tools:** pen (pressure-sensitive), highlighter, eraser, ruler line, move photo, Read (OCR), photo, plot
  `y = …`, undo/redo, clear, save as PNG. Keys: P H E L M R, Ctrl+Z / Ctrl+Y.
- **Reading (OCR):** runs in the browser with Tesseract.js. The selection is enlarged and cleaned to black
  and white first (Otsu threshold), which fixes most photo misreads. The learner always checks the text.
- **Help:** *Solve step by step*, *Hint* (one step at a time, never the answer) and *Check my working*
  (marks the learner's lines and points to the first slip).
- **Double-check:** for an equation in one unknown, Slate substitutes the answer back in with math.js and
  says whether both sides balance, because a small model can slip.
- **Question bank:** practice questions across all nine Cambridge topic areas.

## Where the answers come from

Set `window.RC_CONFIG.SLATE` (in `portal/js/config.js`) or use `?solver=` on the URL:

| Solver | What it does |
|---|---|
| `hub` (default) | `POST {API_BASE}/api/v1/maths/solve` with the portal sign-in. The hub calls the Space's phi4-mini through Ollama (turn on with `MATHS_LLM=ollama`; see `karlissa/hub/maths.py`). |
| `ollama` | Straight to an Ollama server, e.g. a teacher's laptop: `?ollama=http://localhost:11434/api/chat`. Start Ollama with `OLLAMA_ORIGINS` set to the site's address. |
| `local` | No AI. The built-in helper solves linear and quadratic equations exactly, and arithmetic. |

If the AI is off or doesn't answer, Slate falls back to the built-in helper for equations and arithmetic.

## Libraries (loaded from CDNs, pinned)

KaTeX 0.16.9 and math.js 12.4.2 (cdnjs), Tesseract.js 5.1.1 (jsdelivr; loaded only when Read is first used,
then it fetches its engine and English data, about 10 MB, once).
