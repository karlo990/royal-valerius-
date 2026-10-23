// Screenshot a design page headlessly (WebGL via SwiftShader). cdnjs is blocked in the build container, so three.js is served from studio/video/node_modules.
// node video-tg/tools/screenshot.mjs <page.html> <out.png> <width> <height> ["BIM.setState({...})"]
import { chromium } from 'playwright'; import fs from 'fs';
const [src, out, w, h, script] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type()==='error' && errs.push(m.text()));
await p.route('**/three.js/r128/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(new URL('../../video/node_modules/three/build/three.min.js', import.meta.url)) }));
const t0 = Date.now(); await p.goto('file://' + src); await p.evaluate(() => document.fonts.ready);
if (script) await p.evaluate(script);
await p.waitForTimeout(1500); await p.screenshot({ path: out }); console.log('errors', JSON.stringify(errs), 'ms', Date.now()-t0); await b.close();
