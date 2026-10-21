// node tools/render.mjs stills 5,20,...  |  node tools/render.mjs video [fps]
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import fs from 'fs'; import path from 'path'; import url from 'url';
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const [mode = 'stills', arg, T0, T1, OUTN] = process.argv.slice(2);
const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const PORTRAIT = !!process.env.PORTRAIT;
const p = await b.newPage({ viewport: PORTRAIT ? { width: 720, height: 1280 } : { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
p.on('pageerror', e => console.error('PAGEERR', e.message)); p.on('console', m => m.type() === 'error' && console.error('CONSOLE', m.text()));
await p.goto('file://' + path.join(ROOT, 'build/stage.html') + (PORTRAIT ? '?portrait' : '')); await p.evaluate(() => window.ready);
const TOTAL = await p.evaluate(() => TL.total);
if (mode === 'stills') {
  fs.mkdirSync(path.join(ROOT, 'build/stills'), { recursive: true });
  for (const t of arg.split(',').map(Number)) { await p.evaluate(t => renderAt(t), t); await p.screenshot({ path: path.join(ROOT, `build/stills/t${String(t).padStart(6, '0')}.jpg`), quality: 88 }); }
} else {
  const fps = +(arg || 30), t0 = +(T0 || 0), t1 = +T1 > 0 ? Math.min(+T1, TOTAL) : TOTAL, N = Math.ceil((t1 - t0) * fps), out = path.join(ROOT, 'build/' + (OUTN || 'video_silent.mp4'));
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const tStart = Date.now();
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => renderAt(t), t0 + i / fps);
    const buf = await p.screenshot({ type: 'jpeg', quality: 93 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 300 === 0) console.log(`frame ${i}/${N}  ${((Date.now() - tStart) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); console.log('wrote', out);
}
await b.close();
