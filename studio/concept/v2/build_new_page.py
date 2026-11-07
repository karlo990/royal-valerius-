"""Build the /new page of the website from the v2 concept renders.

Run after `node v2/render.cjs` (from studio/concept):
    python3 v2/build_new_page.py
Reads v2/out/concepts.json and v2/out/<id>/<id>_<size>.png, writes
/new/flyers/<id>/royal-crest-<id>-<size>.jpg (+ a WebP preview) and /new/index.html.
"""
import html
import json
import pathlib
import re

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE.parents[2]                      # website root
OUT = HERE / "out"
NEW = SITE / "new"
SIZES = [("feed", "4:5 post", 1080, 1350), ("sq", "1:1 square", 1080, 1080), ("grid", "3:4 grid", 1080, 1440),
         ("story", "9:16 Status", 1080, 1920), ("wide", "16:9 landscape", 1920, 1080)]
SIGN = ["🏫 Royal Crest Academy · Nyika, Bikita, Masvingo", "📲 WhatsApp +263 714 404 090"]
BASE_TAGS = ["#RoyalCrestAcademy", "#Bikita", "#Masvingo", "#Form1"]
TOPIC = {
    "boarding": ("Boarding & life", ["a-second-home", "good-food-good-focus", "time-well-spent", "sleep-builds-memory", "one-good-habit"]),
    "academics": ("Academics", ["talent-needs-direction", "potential-needs-structure", "small-steps-big-results", "practice-makes-permanent",
                                "every-question-counts", "begin-with-the-end", "every-learner-fits", "unlock-their-potential", "aim-higher", "charged-for-form-1"]),
    "science": ("Science & tech", ["delete-the-mindset", "curiosity-is-the-spark", "ask-then-test-it", "build-what-others-use"]),
    "skills": ("Skills & trades", ["ideas-you-can-build", "measure-twice-build-once", "brick-by-brick", "skills-that-work-together"]),
    "clubs": ("Clubs & sport", ["mind-and-body", "speak-with-confidence", "think-three-moves-ahead", "learn-local-think-global"]),
}
TOPIC_OF = {i: k for k, (_, ids) in TOPIC.items() for i in ids}
# an assorted order: the four looks alternate down the page
ORDER = ["talent-needs-direction", "small-steps-big-results", "a-second-home", "delete-the-mindset", "curiosity-is-the-spark",
         "potential-needs-structure", "ideas-you-can-build", "unlock-their-potential", "good-food-good-focus", "ask-then-test-it",
         "sleep-builds-memory", "practice-makes-permanent", "every-question-counts", "speak-with-confidence", "build-what-others-use",
         "mind-and-body", "learn-local-think-global", "aim-higher", "measure-twice-build-once", "time-well-spent", "charged-for-form-1",
         "think-three-moves-ahead", "brick-by-brick", "every-learner-fits", "begin-with-the-end", "skills-that-work-together", "one-good-habit"]
LOOK = {"studio": "Ivory studio", "night": "Navy & crest yellow", "editorial": "Editorial", "corner": "Gallery corners"}


def strip(t):
    return re.sub(r"<[^>]+>", " ", t).replace("  ", " ").strip()


def title(c):
    if c["family"] == "corner":
        return f'{c["big"]} {strip(c["sub"])}'
    return " ".join(c["h"])


def caption(c):
    tags = BASE_TAGS + [t for t in c["tags"] if t not in BASE_TAGS]
    return "\n".join(c["caption"] + [""] + SIGN + ["", " ".join(tags)])


def export(c):
    d = NEW / "flyers" / c["id"]
    d.mkdir(parents=True, exist_ok=True)
    for key, _, w, h in SIZES:
        src = OUT / c["id"] / f'{c["id"]}_{key}.png'
        im = Image.open(src).convert("RGB")
        assert im.size == (w, h), (src, im.size)
        im.save(d / f'royal-crest-{c["id"]}-{key}.jpg', quality=87, optimize=True, progressive=True)
        prev = im.resize((640, round(640 * h / w)), Image.LANCZOS)
        prev.save(d / f'royal-crest-{c["id"]}-{key}.webp', quality=82, method=6)


def card(c):
    i, t = c["id"], title(c)
    base = f"flyers/{i}/royal-crest-{i}"
    chips = "".join(
        f'<button type="button" class="chip{" on" if k == "feed" else ""}" data-k="{k}" data-w="{w}" data-h="{h}">{html.escape(lbl)}</button>'
        for k, lbl, w, h in SIZES)
    dls = " · ".join(f'<a href="{base}-{k}.jpg" download>{html.escape(lbl.split(" ")[0])}</a>' for k, lbl, _, _ in SIZES)
    topic = TOPIC_OF.get(i, "academics")
    return f"""
<article class="card" id="{i}" data-t="{topic}" data-base="{base}">
  <a class="shot" href="{base}-feed.jpg" download><img src="{base}-feed.webp" width="640" height="800" loading="lazy" alt="Royal Crest Academy flyer: {html.escape(t)}"></a>
  <div class="chips" role="group" aria-label="Size">{chips}</div>
  <div class="meta"><span class="tg">{html.escape(TOPIC[topic][0])}</span><span class="look">{html.escape(LOOK[c["family"]])}</span></div>
  <h2>{html.escape(t)}</h2>
  <pre class="cap">{html.escape(caption(c))}</pre>
  <p class="status"><b>WhatsApp Status</b><span class="st">{html.escape(c["status"])} 📲 +263 714 404 090</span></p>
  <div class="acts"><button type="button" class="btn copy" data-what="cap">Copy caption</button><button type="button" class="btn ghost copy" data-what="st">Copy Status line</button><a class="btn ghost dl" href="{base}-feed.jpg" download>Download 4:5</a></div>
  <p class="all">All sizes: {dls}</p>
</article>"""


def page(cards, n):
    filters = '<button type="button" class="on" data-t="all">All</button>' + "".join(
        f'<button type="button" data-t="{k}">{html.escape(v[0])}</button>' for k, v in TOPIC.items())
    return f"""<!doctype html>
<html lang="en-ZW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>New posts · Royal Crest Academy</title>
<meta name="description" content="New Royal Crest Academy posts for Form 1 2027: {n} concept flyers in five sizes (4:5, 1:1, 3:4, 9:16 Status and 16:9), each with a ready-made caption and WhatsApp Status line.">
<meta name="theme-color" content="#0C1638"><link rel="canonical" href="https://royalcrestzw.vercel.app/new/">
<meta property="og:title" content="New posts · Royal Crest Academy"><meta property="og:image" content="https://royalcrestzw.vercel.app/new/flyers/talent-needs-direction/royal-crest-talent-needs-direction-feed.jpg">
<link rel="icon" type="image/png" href="/favicon.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<style>
@font-face {{ font-family: 'Newsreader'; src: url('/assets/fonts/newsreader-latin.woff2') format('woff2'); font-weight: 200 800; font-display: swap; }}
@font-face {{ font-family: 'Newsreader'; src: url('/assets/fonts/newsreader-italic-latin.woff2') format('woff2'); font-style: italic; font-weight: 200 800; font-display: swap; }}
@font-face {{ font-family: 'Jakarta'; src: url('/assets/fonts/plus-jakarta-sans-latin.woff2') format('woff2'); font-weight: 200 800; font-display: swap; }}
:root {{ --navy: #0c1638; --navy2: #13215a; --gold: #d2ae4c; --gold7: #8a6a1c; --yellow: #f8c828; --ink: #0b1533; --muted: #525a70; --paper: #f6f3ec; --line: #e6e0d3; }}
* {{ box-sizing: border-box; margin: 0; padding: 0; }}
body {{ font-family: 'Jakarta', system-ui, sans-serif; color: var(--ink); background: var(--paper); -webkit-font-smoothing: antialiased; }}
a {{ color: inherit; }}
.top {{ background: var(--navy); color: #fff; }}
.bar {{ max-width: 1240px; margin: 0 auto; padding: 16px 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }}
.brand {{ display: flex; align-items: center; gap: 12px; text-decoration: none; }} .brand img {{ width: 44px; height: auto; }}
.brand b {{ display: block; font: 500 21px/1.1 'Newsreader', serif; }} .brand small {{ font: 700 10.5px 'Jakarta'; letter-spacing: .22em; color: var(--gold); }}
.back {{ font: 600 14px 'Jakarta'; text-decoration: none; color: var(--gold); }}
.hero {{ background: radial-gradient(60% 120% at 85% 0%, rgba(248,200,40,.16), transparent 60%), linear-gradient(180deg, #0c1638, #13215a); color: #f6f3ec; }}
.hero .in {{ max-width: 1240px; margin: 0 auto; padding: 60px 20px 66px; }}
.k {{ display: flex; align-items: center; gap: 12px; font: 700 12.5px 'Jakarta'; letter-spacing: .24em; text-transform: uppercase; color: var(--gold); }}
.k::before {{ content: ''; width: 34px; height: 1.5px; background: var(--gold); }}
h1 {{ font: 500 clamp(44px, 7vw, 86px)/1.02 'Newsreader', serif; letter-spacing: -.02em; margin: 16px 0 18px; }} h1 em {{ color: var(--yellow); font-weight: 400; }}
.hero p {{ font: 400 18px/1.6 'Jakarta'; max-width: 700px; color: rgba(246,243,236,.82); }}
.how {{ display: flex; flex-wrap: wrap; gap: 10px 26px; margin-top: 26px; font: 600 14px 'Jakarta'; color: rgba(246,243,236,.9); }}
.how span::before {{ content: '◆'; color: var(--gold); margin-right: 8px; font-size: 10px; }}
.filters {{ position: sticky; top: 0; z-index: 5; background: rgba(246,243,236,.94); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }}
.filters .in {{ max-width: 1240px; margin: 0 auto; padding: 12px 20px; display: flex; gap: 8px; flex-wrap: wrap; }}
.filters button {{ font: 600 14px 'Jakarta'; padding: 9px 16px; border-radius: 999px; border: 1px solid #cfc6b2; background: #fff; color: var(--ink); cursor: pointer; }}
.filters button.on {{ background: var(--navy2); border-color: var(--navy2); color: #fff; }}
main {{ max-width: 1240px; margin: 0 auto; padding: 30px 20px 64px; display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 26px; }}
.card {{ background: #fff; border: 1px solid var(--line); border-radius: 14px; padding: 14px 14px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 1px 2px rgba(11,21,51,.05), 0 18px 40px -26px rgba(11,21,51,.35); }}
.card[hidden] {{ display: none; }}
.shot {{ display: grid; place-items: center; background: #ece7dc; border-radius: 10px; overflow: hidden; aspect-ratio: 4 / 5; }}
.shot img {{ display: block; max-width: 100%; max-height: 100%; width: auto; height: auto; }}
.chips {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.chip {{ font: 600 12px 'Jakarta'; padding: 6px 10px; border-radius: 999px; border: 1px solid #d8d0bd; background: #faf8f3; color: var(--muted); cursor: pointer; }}
.chip.on {{ background: var(--ink); color: #fff; border-color: var(--ink); }}
.meta {{ display: flex; gap: 8px; align-items: center; font: 600 12px 'Jakarta'; }}
.tg {{ background: #f3ead2; color: var(--gold7); padding: 4px 10px; border-radius: 999px; letter-spacing: .04em; }}
.look {{ color: var(--muted); }}
.card h2 {{ font: 500 25px/1.15 'Newsreader', serif; color: var(--navy2); }}
.cap {{ white-space: pre-wrap; font: 400 13.5px/1.55 'Jakarta'; color: #2c3350; background: #faf8f3; border: 1px solid #eee7d8; border-radius: 10px; padding: 12px 14px; max-height: 230px; overflow: auto; }}
.status {{ font: 400 13px/1.5 'Jakarta'; color: #2c3350; }} .status b {{ display: block; font: 700 11px 'Jakarta'; letter-spacing: .14em; text-transform: uppercase; color: var(--gold7); margin-bottom: 3px; }}
.acts {{ display: flex; flex-wrap: wrap; gap: 8px; }}
.btn {{ font: 700 13.5px 'Jakarta'; padding: 10px 14px; border-radius: 999px; border: 1px solid var(--navy2); background: var(--navy2); color: #fff; cursor: pointer; text-decoration: none; }}
.btn.ghost {{ background: #fff; color: var(--navy2); }} .btn.ok {{ background: #1f7a4a; border-color: #1f7a4a; color: #fff; }}
.all {{ font: 500 12.5px 'Jakarta'; color: var(--muted); }} .all a {{ color: var(--navy2); font-weight: 700; }}
footer {{ background: var(--navy); color: rgba(246,243,236,.8); font: 400 14px/1.6 'Jakarta'; }}
footer .in {{ max-width: 1240px; margin: 0 auto; padding: 30px 20px; display: flex; flex-wrap: wrap; gap: 10px 30px; justify-content: space-between; }}
footer a {{ color: var(--gold); text-decoration: none; font-weight: 600; }}
@media (max-width: 700px) {{ .filters .in {{ flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }} .filters button {{ flex: none; }} }}
@media (max-width: 420px) {{ main {{ grid-template-columns: 1fr; }} }}
</style></head>
<body>
<header class="top"><div class="bar">
  <a class="brand" href="/"><img src="/studio/assets/brand/crest-640.webp" alt="" width="44" height="54"><span><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></span></a>
  <a class="back" href="/">← Back to the website</a>
</div></header>
<section class="hero"><div class="in">
  <p class="k">New · Form 1 · January 2027</p>
  <h1>Fresh posts for <em>parents</em>,<br>ready to share.</h1>
  <p>{n} new concept flyers for Royal Crest Academy. Each comes in five sizes, with a ready-made caption and a WhatsApp Status line. Pick a size, copy the caption and post.</p>
  <div class="how"><span>4:5 Instagram and Facebook feed</span><span>1:1 square</span><span>3:4 profile grid</span><span>9:16 WhatsApp Status and Stories</span><span>16:9 landscape</span></div>
</div></section>
<nav class="filters" aria-label="Filter by topic"><div class="in">{filters}</div></nav>
<main>{''.join(cards)}
</main>
<footer><div class="in"><span>Royal Crest Academy · 1226 Chinobva, Nyika, Bikita, Masvingo</span><span>WhatsApp <a href="https://wa.me/263714404090">+263 714 404 090</a> · <a href="/">royalcrestzw.vercel.app</a></span></div></footer>
<script>
const copy = async (t) => {{ try {{ await navigator.clipboard.writeText(t); }} catch (e) {{ const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); try {{ document.execCommand('copy'); }} catch (_) {{}} a.remove(); }} }};
document.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {{
  const c = b.closest('.card'), t = b.dataset.what === 'st' ? c.querySelector('.st').textContent : c.querySelector('.cap').textContent, label = b.textContent;
  await copy(t); b.textContent = 'Copied ✓'; b.classList.add('ok'); setTimeout(() => {{ b.textContent = label; b.classList.remove('ok'); }}, 1800);
}}));
document.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {{
  const c = b.closest('.card'), base = c.dataset.base, k = b.dataset.k, img = c.querySelector('.shot img'), lbl = b.textContent.split(' ')[0];
  c.querySelectorAll('.chip').forEach((x) => x.classList.toggle('on', x === b));
  img.src = base + '-' + k + '.webp'; img.width = 640; img.height = Math.round(640 * b.dataset.h / b.dataset.w);
  c.querySelector('.shot').href = base + '-' + k + '.jpg'; const d = c.querySelector('.dl'); d.href = base + '-' + k + '.jpg'; d.textContent = 'Download ' + lbl;
}}));
document.querySelectorAll('.filters button').forEach((b) => b.addEventListener('click', () => {{
  document.querySelectorAll('.filters button').forEach((x) => x.classList.toggle('on', x === b));
  document.querySelectorAll('main .card').forEach((c) => {{ c.hidden = b.dataset.t !== 'all' && c.dataset.t !== b.dataset.t; }});
}}));
</script>
</body></html>
"""


def main():
    data = {c["id"]: c for c in json.loads((OUT / "concepts.json").read_text())}
    missing = [i for i in data if i not in ORDER]
    order = ORDER + missing
    cards = []
    for i in order:
        c = data[i]
        export(c)
        cards.append(card(c))
    (NEW / "index.html").write_text(page(cards, len(order)), encoding="utf-8")
    print("wrote", NEW / "index.html", len(order), "flyers")


if __name__ == "__main__":
    main()
