// Write v2/out/concepts.json (copy and captions) without rendering.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
(async () => { const b = await chromium.launch(); const p = await b.newPage();
  await p.goto('http://localhost:8766/studio/concept/v2/poster.html?list'); await p.waitForFunction(() => window.ready);
  const d = await p.evaluate(() => window.DATA); fs.mkdirSync(path.join(__dirname, 'out'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, 'out', 'concepts.json'), JSON.stringify(d, null, 2)); console.log(d.length, 'concepts'); await b.close(); })();
