// Render Royal Crest concept posters v2.
// 1) From the website folder: npx http-server . -p 8766   (keep it running)
// 2) In studio/concept: npm install   then   node v2/render.cjs [id ...] [--sizes sq,feed,grid,story,wide] [--jobs 3]
// Writes v2/out/<id>/<id>_<size>.png and v2/out/concepts.json (copy and captions).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); return i >= 0 ? args.splice(i, 2)[1] : d; };
const SIZES = opt('--sizes', 'sq,feed,grid,story,wide').split(','), JOBS = +opt('--jobs', 3), BASE = opt('--base', 'http://localhost:8766/studio/concept/v2/poster.html');
const DIM = { sq: [1080, 1080], feed: [1080, 1350], grid: [1080, 1440], story: [1080, 1920], wide: [1920, 1080] };
const OUT = path.join(__dirname, 'out');
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const lp = await b.newPage(); await lp.goto(BASE + '?list'); await lp.waitForFunction(() => window.ready); const data = await lp.evaluate(() => window.DATA); await lp.close();
  fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, 'concepts.json'), JSON.stringify(data, null, 2));
  const ids = args.length ? args : data.map((d) => d.id);
  const jobs = ids.flatMap((id) => SIZES.map((s) => [id, s]));
  let n = 0;
  const worker = async () => { for (;;) { const j = jobs.shift(); if (!j) return; const [id, s] = j; const [w, h] = DIM[s];
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
    p.on('pageerror', (e) => console.log('ERR', id, s, e.message)); p.on('console', (m) => { if (m.type() === 'error') console.log('console', id, s, m.text()); });
    const t0 = Date.now(); await p.goto(`${BASE}?id=${id}&s=${s}`); await p.waitForFunction(() => window.ready === true, null, { timeout: 300000 });
    const err = await p.evaluate(() => window.err); if (err) console.log('FAIL', id, s, err);
    fs.mkdirSync(path.join(OUT, id), { recursive: true }); await p.locator('#stage').screenshot({ path: path.join(OUT, id, `${id}_${s}.png`) });
    await p.close(); console.log(`${++n} ${id} ${s} ${((Date.now() - t0) / 1000).toFixed(1)}s`); } };
  await Promise.all(Array.from({ length: JOBS }, worker));
  await b.close();
})();
