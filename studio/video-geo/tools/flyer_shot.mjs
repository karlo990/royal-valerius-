// node tools/flyer_shot.mjs <page.html> <out-basename> [nopdf] : PNG of #fl at 2× (+ PDF the size of #fl)
import { chromium } from 'playwright'; import path from 'path';
const [src, out, nopdf] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
await p.goto('file://' + path.resolve(src)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
const { w, h } = await p.evaluate(() => { const r = document.querySelector('#fl').getBoundingClientRect(); return { w: r.width, h: r.height } });
await p.setViewportSize({ width: w, height: h });
await p.locator('#fl').screenshot({ path: out + '.png' });
if (!nopdf) await p.pdf({ path: out + '.pdf', width: w + 'px', height: h + 'px', printBackground: true, pageRanges: '1' });
await b.close(); console.log('wrote', out);
