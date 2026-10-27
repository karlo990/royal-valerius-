// Render a fact pack as "Did you know?" flyers, one fact per flyer, cycling through all seven templates.
//   python3 -m http.server 8765            (from the website folder)
//   node studio/tools/render_facts.mjs --pack physics-facts --format square
// Output: studio/output/<pack>-<format>/NN-<template>.jpg and captions.txt
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const args = Object.fromEntries(process.argv.slice(2).reduce((a, x, i, arr) => (x.startsWith('--') && a.push([x.slice(2), arr[i + 1]]), a), []));
const pack = args.pack || 'physics-facts', format = args.format || 'square', url = args.url || 'http://localhost:8765/studio/?batch';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const data = JSON.parse(await readFile(path.join(root, 'data', pack + '.json'), 'utf8'));
const TPL = ['prospectus', 'royal', 'stadium', 'labsheet', 'block', 'notebook', 'element'];
const out = path.join(root, 'output', `${pack}-${format}`); await mkdir(out, { recursive: true });
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto(url, { waitUntil: 'networkidle' }); await p.evaluate(() => window.Studio.ready);
const caps = [];
for (let i = 0; i < data.facts.length; i++) {
  const t = TPL[i % TPL.length];
  const r = await p.evaluate(([k, f, t, fmt, n]) => window.Studio.mountFact(k, f, t, fmt, n), [data.subject, data.facts[i], t, format, i + 1]);
  await p.evaluate(() => document.fonts.ready);
  const file = `${String(i + 1).padStart(2, '0')}-${t}.png`;
  await p.locator('#batch-stage > .flyer').screenshot({ path: path.join(out, file) });
  caps.push(`=== ${file} ===\n${r.caption}\n`);
  if (!r.fits) console.warn('text overflows:', file);
}
await writeFile(path.join(out, 'captions.txt'), caps.join('\n'));
await b.close(); console.log(`${data.facts.length} flyers → ${out}`);
