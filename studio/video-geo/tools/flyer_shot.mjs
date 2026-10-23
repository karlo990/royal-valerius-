// node tools/flyer_shot.mjs <page.html> <out-basename> : PNG at 2× (300 dpi A4) + A4 PDF
import { chromium } from 'playwright'; import path from 'path';
const [src, out] = process.argv.slice(2);
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
await p.goto('file://' + path.resolve(src)); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
await p.locator('#fl').screenshot({ path: out + '.png' });
await p.pdf({ path: out + '.pdf', width: '1240px', height: '1754px', printBackground: true, pageRanges: '1' });
await b.close(); console.log('wrote', out);
