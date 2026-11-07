// Render the concept posters to PNG.
// From the website folder:  npx http-server . -p 8766   (keep it running)
// Then, in studio/concept:   npm install && node render.cjs
//   node render.cjs a feed   -> one poster;  no arguments -> all four
const { chromium } = require('playwright');
const path = require('path');
const jobs = process.argv[2] ? [[process.argv[2], process.argv[3] || 'feed']] : [['a', 'feed'], ['a', 'story'], ['b', 'feed'], ['b', 'story']];
(async () => {
  const b = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  for (const [c, s] of jobs) {
    const p = await b.newPage({ viewport: { width: 1080, height: s === 'story' ? 1920 : 1350 }, deviceScaleFactor: 1 });
    p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto(`http://localhost:8766/studio/concept/poster.html?c=${c}&s=${s}`);
    await p.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
    const out = path.join(__dirname, 'out', `rca-concept-${c}_${s}.png`);
    await p.locator('#stage').screenshot({ path: out });
    console.log('wrote', out);
    await p.close();
  }
  await b.close();
})();
