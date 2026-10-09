// Batch-render every flyer to PNG with a headless browser (Playwright).
//
// The in-browser studio can already download everything as a ZIP. Use this
// script when you want the files on disk in one go, e.g. for printing:
//
//   npx http-server . -p 8080              (from the website folder)
//   npm i -D playwright                    (once)
//   node studio/tools/render_all.mjs --template labsheet --format a4
//   node studio/tools/render_all.mjs --template all --format square
//
// Output: studio/output/<template>-<format>/<file>.png, captions.txt,
// report.json and index.html (a gallery of everything rendered).
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith('--')) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true]);
  return acc;
}, []));
const url = args.url || 'http://localhost:8080/studio/?batch';
const formats = (args.format || 'square').split(',');
const TEMPLATES = ['prospectus', 'labsheet', 'block', 'notebook', 'element'];
const templates = !args.template || args.template === 'all' ? TEMPLATES : args.template.split(',');
const limit = args.limit ? Number(args.limit) : Infinity;
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'output');

const browser = await chromium.launch(args.chromium ? { executablePath: args.chromium } : {});
const report = [];
for (const format of formats) {
  for (const template of templates) {
    const outDir = path.join(root, `${template}-${format}`);
    await mkdir(outDir, { recursive: true });
    const scale = format === 'a4' ? 2480 / 1080 : 1;
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: scale });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(() => window.Studio.ready);
    const jobs = (await page.evaluate(([t, f]) => window.Studio.jobs(t, f), [template, format])).slice(0, limit);
    const captions = [];
    for (const job of jobs) {
      const r = await page.evaluate(([j, t, f]) => window.Studio.mountForShot(j.key, j.kind, t, f), [job, template, format]);
      const file = `${r.file}.png`;
      await page.locator('#batch-stage > .flyer').screenshot({ path: path.join(outDir, file) });
      captions.push(`=== ${file} ===\n${r.caption}\n`);
      report.push({ template, format, file: `${template}-${format}/${file}`, subject: job.label, kind: job.kind, fits: r.fits });
      if (!r.fits) console.warn(`  text still overflows: ${file}`);
    }
    await writeFile(path.join(outDir, 'captions.txt'), captions.join('\n'));
    console.log(`${template}-${format}: ${jobs.length} flyers${errors.length ? ` (${errors.length} page errors)` : ''}`);
    await page.close();
  }
}
await browser.close();
await writeFile(path.join(root, 'report.json'), JSON.stringify(report, null, 1));
const cards = report.map((r) => `<figure><img loading="lazy" src="${r.file}" alt=""><figcaption>${r.subject} · ${r.kind}${r.fits ? '' : ' · <b>check text</b>'}</figcaption></figure>`).join('\n');
await writeFile(path.join(root, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Royal Crest flyers</title>
<style>body{font:14px system-ui;margin:24px;background:#efebe2}main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px}img{width:100%;display:block;box-shadow:0 0 0 1px #0002}figure{margin:0}figcaption{padding:6px 0;color:#444}</style>
<h1>Royal Crest flyers (${report.length})</h1><main>${cards}</main>`);
console.log(`Done: ${report.length} flyers. Open studio/output/index.html`);
