/* Crest Slate: Royal Crest Academy's maths canvas.
 *
 * Draw on a page template, add a photo of a question, drag a box to read it (OCR runs in the
 * browser with Tesseract.js), then get step-by-step help from the school's own model.
 *
 * Solvers (window.RC_CONFIG.SLATE, or ?solver= on the URL):
 *   hub     POST {API_BASE}/api/v1/maths/solve with the portal sign-in (default)
 *   ollama  straight to an Ollama server, e.g. a teacher's laptop: OLLAMA_URL + MODEL
 *           (start Ollama with OLLAMA_ORIGINS set to this site so the browser may call it)
 *   local   no AI: the built-in helper solves linear and quadratic equations and arithmetic
 * Whatever answers, Slate substitutes equation answers back in and says whether they check out.
 */
(() => {
  'use strict';
  const C = window.RC_CONFIG || {};
  const Q = new URLSearchParams(location.search);
  const SL = Object.assign({ SOLVER: 'hub', OLLAMA_URL: 'http://localhost:11434/api/chat', MODEL: 'phi4-mini:3.8b-q4_K_M' }, C.SLATE || {});
  if (Q.get('solver')) SL.SOLVER = Q.get('solver');
  if (Q.get('ollama')) { SL.SOLVER = 'ollama'; SL.OLLAMA_URL = Q.get('ollama'); }
  const API = (C.API_BASE || C.HUB || '').replace(/\/$/, '');
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const token = () => { try { return (JSON.parse(sessionStorage.getItem('rc_portal_session') || 'null') || {}).token || ''; } catch (e) { return ''; } };
  const toast = (m) => { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('on'), 2600); };

  // ================================================================ page + templates
  const PW = 1400, PH = 900;                       // the page, in page units; the view scales it to fit
  const TEMPLATES = {
    blank: { label: 'Blank' }, lined: { label: 'Lined' }, squared: { label: 'Squared' }, graph: { label: 'Graph paper' },
    axes: { label: 'x–y axes' }, iso: { label: 'Isometric' }, numline: { label: 'Number lines' }, slate: { label: 'Chalk slate', dark: true },
  };
  const AX = { u: 40, ox: PW / 2, oy: PH / 2 };   // axes template: 1 unit = 40 page units, origin in the middle
  function drawTemplate(g, id, s = 1) {
    const L = (x1, y1, x2, y2) => { g.beginPath(); g.moveTo(x1 * s, y1 * s); g.lineTo(x2 * s, y2 * s); g.stroke(); };
    g.fillStyle = id === 'slate' ? '#23312b' : '#fffdf8'; g.fillRect(0, 0, PW * s, PH * s);
    g.lineWidth = Math.max(s < .5 ? 1 : .5, s);
    if (id === 'slate') {
      g.fillStyle = 'rgba(255,255,255,.025)'; for (let i = 0; i < 260; i++) { const x = (i * 131) % PW, y = (i * 197) % PH; g.fillRect(x * s, y * s, 60 * s, 2 * s); }
    } else if (id === 'lined') {
      g.strokeStyle = '#c9d6ee'; for (let y = 90; y < PH; y += 40) L(0, y, PW, y);
      g.strokeStyle = '#ef9a9a'; L(100, 0, 100, PH);
    } else if (id === 'squared') {
      g.strokeStyle = '#d7e0f0'; for (let x = 0; x <= PW; x += 30) L(x, 0, x, PH); for (let y = 0; y <= PH; y += 30) L(0, y, PW, y);
    } else if (id === 'graph') {
      g.strokeStyle = '#cfe6d6'; for (let x = 0; x <= PW; x += 10) L(x, 0, x, PH); for (let y = 0; y <= PH; y += 10) L(0, y, PW, y);
      g.strokeStyle = '#8cc7a0'; for (let x = 0; x <= PW; x += 50) L(x, 0, x, PH); for (let y = 0; y <= PH; y += 50) L(0, y, PW, y);
    } else if (id === 'axes') {
      g.strokeStyle = '#e2e8f4'; for (let x = AX.ox % AX.u; x <= PW; x += AX.u) L(x, 0, x, PH); for (let y = AX.oy % AX.u; y <= PH; y += AX.u) L(0, y, PW, y);
      g.strokeStyle = '#0a1f5c'; g.lineWidth = 2 * s; L(0, AX.oy, PW, AX.oy); L(AX.ox, 0, AX.ox, PH);
      g.fillStyle = '#0a1f5c'; g.font = `${13 * s}px RcSans, sans-serif`; g.textAlign = 'center';
      for (let i = -Math.floor(AX.ox / AX.u) + 1; i < AX.ox / AX.u; i++) if (i) { L(AX.ox + i * AX.u, AX.oy - 5, AX.ox + i * AX.u, AX.oy + 5); g.fillText(i, (AX.ox + i * AX.u) * s, (AX.oy + 20) * s); }
      g.textAlign = 'right';
      for (let j = -Math.floor(AX.oy / AX.u) + 1; j < AX.oy / AX.u; j++) if (j) { L(AX.ox - 5, AX.oy - j * AX.u, AX.ox + 5, AX.oy - j * AX.u); g.fillText(j, (AX.ox - 9) * s, (AX.oy - j * AX.u + 5) * s); }
      g.font = `italic ${20 * s}px RcSerif, serif`; g.fillText('x', (PW - 12) * s, (AX.oy - 10) * s); g.textAlign = 'left'; g.fillText('y', (AX.ox + 10) * s, 22 * s);
    } else if (id === 'iso') {
      g.fillStyle = '#9fb0d0'; const d = 36, h = d * Math.sqrt(3) / 2;
      for (let r = 0, y = 0; y <= PH; r++, y += h) for (let x = (r % 2) * d / 2; x <= PW; x += d) { g.beginPath(); g.arc(x * s, y * s, 1.8 * s, 0, 7); g.fill(); }
    } else if (id === 'numline') {
      g.strokeStyle = '#0a1f5c'; g.fillStyle = '#0a1f5c'; g.font = `${15 * s}px RcSans, sans-serif`; g.textAlign = 'center';
      [200, 450, 700].forEach((y) => { g.lineWidth = 2 * s; L(80, y, PW - 80, y); g.lineWidth = Math.max(.5, s);
        for (let i = -10; i <= 10; i++) { const x = PW / 2 + i * 60; L(x, y - (i % 5 ? 8 : 14), x, y + (i % 5 ? 8 : 14)); g.fillText(i, x * s, (y + 34) * s); } });
    }
  }

  // ================================================================ canvas + items
  const cv = $('#cv'), ctx = cv.getContext('2d');
  let tpl = 'lined', view = 1;
  const items = [], redo = [];                   // {type:'stroke'|'line'|'image'|'plot', ...} in page units
  let ink = '#0a1f5c', size = 3, tool = 'pen';
  const INKS = ['#0a1f5c', '#c8202e', '#2f8a4a', '#c9a227', '#1a1a1a', '#ffffff'];

  function fit() {
    const w = $('#frame').clientWidth; view = w / PW;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(w * dpr); cv.height = Math.round(PH * view * dpr); cv.style.height = `${PH * view}px`;
    ctx.setTransform(dpr * view, 0, 0, dpr * view, 0, 0); draw();
  }
  function drawItem(g, it, s = 1) {
    g.save(); g.scale(s, s);
    if (it.type === 'image') g.drawImage(it.img, it.x, it.y, it.w, it.h);
    else if (it.type === 'stroke' || it.type === 'line') {
      const p = it.pts; if (!p.length) { g.restore(); return; }
      g.strokeStyle = it.erase ? (TEMPLATES[tpl].dark ? '#23312b' : '#fffdf8') : it.color; g.lineCap = g.lineJoin = 'round';
      g.globalAlpha = it.hl ? .32 : 1;
      if (it.erase) g.globalCompositeOperation = 'destination-out';
      for (let i = 1; i < p.length; i++) { g.lineWidth = it.w * (it.hl ? 5 : 1) * (.55 + .9 * (p[i][2] ?? .5)); g.beginPath(); g.moveTo(p[i - 1][0], p[i - 1][1]); g.lineTo(p[i][0], p[i][1]); g.stroke(); }
      if (p.length === 1) { g.beginPath(); g.arc(p[0][0], p[0][1], it.w / 2, 0, 7); g.fillStyle = it.color; g.fill(); }
    } else if (it.type === 'plot') {
      g.strokeStyle = it.color; g.lineWidth = 3; g.beginPath(); let on = false;
      for (let px = 0; px <= PW; px += 2) {
        const x = (px - AX.ox) / AX.u; let y; try { y = it.f(x); } catch (e) { y = NaN; }
        const py = AX.oy - y * AX.u;
        if (!isFinite(py) || py < -PH || py > 2 * PH) { on = false; continue; }
        on ? g.lineTo(px, py) : g.moveTo(px, py); on = true;
      }
      g.stroke(); g.fillStyle = it.color; g.font = 'italic 22px RcSerif, serif'; g.fillText(it.label, 16, 36 + 28 * it.n);
    }
    g.restore();
  }
  // ink lives on its own layer so the eraser never rubs out the template or the photo
  const inkLayer = document.createElement('canvas'), ig = inkLayer.getContext('2d');
  function draw() {
    const dpr = window.devicePixelRatio || 1;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.restore();
    drawTemplate(ctx, tpl);
    items.filter((i) => i.type === 'image' || i.type === 'plot').forEach((i) => drawItem(ctx, i));
    inkLayer.width = cv.width; inkLayer.height = cv.height; ig.setTransform(dpr * view, 0, 0, dpr * view, 0, 0);
    items.filter((i) => i.type === 'stroke' || i.type === 'line').forEach((i) => drawItem(ig, i));
    if (live) drawItem(ig, live);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(inkLayer, 0, 0); ctx.restore();
    if (box) { ctx.save(); ctx.strokeStyle = '#c8202e'; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.strokeRect(box.x, box.y, box.w, box.h); ctx.fillStyle = 'rgba(200,32,46,.06)'; ctx.fillRect(box.x, box.y, box.w, box.h); ctx.restore(); }
  }
  const push = (it) => { items.push(it); redo.length = 0; draw(); };

  // pointer input
  let live = null, box = null, drag = null, readTarget = 'q';
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / view, (e.clientY - r.top) / view, e.pressure || .5]; };
  cv.addEventListener('pointerdown', (e) => {
    cv.setPointerCapture(e.pointerId); const p = pt(e);
    if (tool === 'read') { box = { x0: p[0], y0: p[1], x: p[0], y: p[1], w: 0, h: 0 }; return; }
    if (tool === 'move') { const im = [...items].reverse().find((i) => i.type === 'image' && p[0] > i.x && p[0] < i.x + i.w && p[1] > i.y && p[1] < i.y + i.h); if (im) drag = { im, dx: p[0] - im.x, dy: p[1] - im.y }; return; }
    const dark = TEMPLATES[tpl].dark;
    live = { type: tool === 'line' ? 'line' : 'stroke', pts: [p], w: tool === 'eraser' ? size * 6 : size, hl: tool === 'hl', erase: tool === 'eraser',
             color: dark && ink === '#0a1f5c' ? '#f4f1e8' : tool === 'hl' ? '#f2b705' : ink };
    draw();
  });
  cv.addEventListener('pointermove', (e) => {
    const p = pt(e);
    if (box && e.buttons) { box.x = Math.min(box.x0, p[0]); box.y = Math.min(box.y0, p[1]); box.w = Math.abs(p[0] - box.x0); box.h = Math.abs(p[1] - box.y0); draw(); return; }
    if (drag && e.buttons) { drag.im.x = p[0] - drag.dx; drag.im.y = p[1] - drag.dy; draw(); return; }
    if (!live) return;
    if (live.type === 'line') live.pts = [live.pts[0], [p[0], p[1], .5]];
    else (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]).forEach((ev) => live.pts.push(pt(ev)));
    draw();
  });
  const end = () => {
    if (box) { const b = box; box = null; draw(); if (b.w > 12 && b.h > 8) readRegion(b); return; }
    if (drag) { drag = null; return; }
    if (live) { const l = live; live = null; push(l); }
  };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);

  // tools, inks, keyboard
  const setTool = (t) => { tool = t; document.querySelectorAll('.tool[data-tool]').forEach((b) => b.classList.toggle('on', b.dataset.tool === t)); cv.style.cursor = t === 'move' ? 'grab' : 'crosshair';
    hint(t === 'read' ? 'Drag a box around the question to read it' : t === 'move' ? 'Drag the photo to move it' : ''); };
  document.querySelectorAll('.tool[data-tool]').forEach((b) => b.addEventListener('click', () => setTool(b.dataset.tool)));
  $('#inks').innerHTML = INKS.map((c, i) => `<button class="ink${i ? '' : ' on'}" data-c="${c}" style="background:${c}" title="Ink"></button>`).join('');
  $('#inks').addEventListener('click', (e) => { const b = e.target.closest('.ink'); if (!b) return; ink = b.dataset.c; document.querySelectorAll('.ink').forEach((x) => x.classList.toggle('on', x === b)); if (tool === 'eraser' || tool === 'read' || tool === 'move') setTool('pen'); });
  $('#size').addEventListener('input', (e) => { size = +e.target.value; });
  const undo = () => { if (items.length) { redo.push(items.pop()); draw(); } };
  const redoIt = () => { if (redo.length) { items.push(redo.pop()); draw(); } };
  $('#undo').onclick = undo; $('#redo').onclick = redoIt;
  $('#clear').onclick = () => { if (items.length && confirm('Clear the whole page?')) { items.length = 0; redo.length = 0; draw(); } };
  $('#save').onclick = () => { const a = document.createElement('a'); a.download = `crest-slate-${new Date().toISOString().slice(0, 10)}.png`; a.href = cv.toDataURL('image/png'); a.click(); };
  document.addEventListener('keydown', (e) => {
    if (e.target.closest('textarea, input, select')) return;
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redoIt() : undo(); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redoIt(); return; }
    const m = { p: 'pen', h: 'hl', e: 'eraser', l: 'line', m: 'move', r: 'read' }[e.key.toLowerCase()]; if (m) setTool(m);
  });
  const hint = (m) => { const h = $('#hintbox'); h.textContent = m; h.classList.toggle('on', !!m); };

  // template picker with live thumbnails
  $('#templates').innerHTML = Object.entries(TEMPLATES).map(([id, t]) => `<button class="tpl${id === tpl ? ' on' : ''}" data-t="${id}" role="radio"><canvas width="152" height="100"></canvas>${t.label}</button>`).join('');
  document.querySelectorAll('.tpl').forEach((b) => { const g = b.querySelector('canvas').getContext('2d'); drawTemplate(g, b.dataset.t, 152 / PW * 2.2); });
  const setTpl = (id) => { tpl = id; document.querySelectorAll('.tpl').forEach((b) => b.classList.toggle('on', b.dataset.t === id)); if (TEMPLATES[id].dark && ink === '#0a1f5c') ink = '#ffffff'; draw(); };
  $('#templates').addEventListener('click', (e) => { const b = e.target.closest('.tpl'); if (b) setTpl(b.dataset.t); });

  // photos
  $('#file').addEventListener('change', (e) => {
    const f = e.target.files[0]; if (!f) return;
    const img = new Image(); img.onload = () => {
      const k = Math.min(PW * .8 / img.width, PH * .8 / img.height, 1.5), w = img.width * k, h = img.height * k;
      push({ type: 'image', img, x: (PW - w) / 2, y: (PH - h) / 2, w, h }); setTool('read'); toast('Photo added. Drag a box around the question to read it.');
    };
    img.src = URL.createObjectURL(f); e.target.value = '';
  });

  // plotting y = f(x) on the axes
  function plot(s) {
    const rhs = s.replace(/^\s*y\s*=\s*/i, '').replace(/−/g, '-').trim();
    try {
      const f = math.compile(toMath(rhs)); f.evaluate({ x: 1 });
      setTpl('axes');
      const n = items.filter((i) => i.type === 'plot').length, colors = ['#c8202e', '#2f8a4a', '#c9a227', '#6b3fa0'];
      push({ type: 'plot', f: (x) => f.evaluate({ x }), label: `y = ${rhs}`, color: colors[n % 4], n });
    } catch (e) { toast('Slate couldn’t read that graph. Try: y = 2x + 1'); }
  }
  $('#plot-btn').onclick = () => { const s = prompt('Plot a graph. Type it like:  y = 2x + 1   or   y = x^2 - 3x - 4', 'y = 2x + 1'); if (s) plot(s); };

  // ================================================================ OCR (in the browser)
  let ocrWorker = null;
  async function ocr(canvas) {
    if (!window.Tesseract) await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5.1.1/dist/tesseract.min.js'; s.onload = ok; s.onerror = bad; document.head.appendChild(s); });
    if (!ocrWorker) { ocrWorker = await Tesseract.createWorker('eng'); await ocrWorker.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' }); }
    const { data } = await ocrWorker.recognize(canvas);
    return data.text;
  }
  function tidy(text) {          // common OCR slips in maths
    return text.replace(/[—–]/g, '-').replace(/[“”]/g, '"').replace(/\s*\n\s*/g, '\n').replace(/(\d)\s*[xX×]\s*(\d)/g, '$1 × $2')
      .replace(/\b([a-z])2\b/g, '$1²').replace(/\b([a-z])3\b/g, '$1³').replace(/\s{2,}/g, ' ').trim();
  }
  function binarise(c) {         // clean black-on-white helps the reader a lot with photos
    const g = c.getContext('2d'), d = g.getImageData(0, 0, c.width, c.height), px = d.data, hist = new Array(256).fill(0), n = px.length / 4;
    for (let i = 0; i < px.length; i += 4) { const y = (px[i] * .299 + px[i + 1] * .587 + px[i + 2] * .114) | 0; px[i] = y; hist[y]++; }
    let sum = 0, sumB = 0, wB = 0, best = 0, th = 128; for (let i = 0; i < 256; i++) sum += i * hist[i];
    for (let i = 0; i < 256; i++) { wB += hist[i]; if (!wB) continue; const wF = n - wB; if (!wF) break; sumB += i * hist[i];
      const mB = sumB / wB, mF = (sum - sumB) / wF, between = wB * wF * (mB - mF) ** 2; if (between > best) { best = between; th = i; } }   // Otsu's threshold
    for (let i = 0; i < px.length; i += 4) { const v = px[i] > th ? 255 : 0; px[i] = px[i + 1] = px[i + 2] = v; }
    g.putImageData(d, 0, 0); return c;
  }
  async function readRegion(b) {
    const k = 3, c = document.createElement('canvas'); c.width = Math.round(b.w * k); c.height = Math.round(b.h * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.translate(-b.x * k, -b.y * k);
    items.forEach((it) => { if (it.type === 'image') drawItem(g, it, k); });                         // photo
    items.forEach((it) => { if (it.type === 'stroke' || it.type === 'line') drawItem(g, { ...it, color: it.erase ? '#fff' : '#000', erase: false }, k); });   // handwriting, as black ink
    hint('Reading…');
    try {
      const text = tidy(await ocr(binarise(c)));
      if (!text) { toast('Slate couldn’t find any writing there. Try a bigger box or a clearer photo.'); return; }
      const target = readTarget === 'working' ? $('#working') : $('#q');
      target.value = target.value ? `${target.value}\n${text}` : text; target.dispatchEvent(new Event('input'));
      toast('Read! Check the text and fix anything Slate misread.'); readTarget = 'q';
    } catch (e) { toast('Reading needs the internet the first time (to load the reader).'); }
    finally { hint(''); setTool('pen'); }
  }

  // ================================================================ question box, keys, preview
  const KEYS = ['x', 'y', '²', '³', '√(', 'π', '×', '÷', '(', ')', '=', '≤', '≥', '°', '^', '/'];
  $('#keys').innerHTML = KEYS.map((k) => `<button type="button" data-k="${esc(k)}">${esc(k === '√(' ? '√' : k)}</button>`).join('');
  $('#keys').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; const t = $('#q'), s = t.selectionStart, k = b.dataset.k;
    t.setRangeText(k, s, t.selectionEnd, 'end'); t.focus(); t.dispatchEvent(new Event('input')); });
  function toMath(s) {           // the question's maths → math.js syntax
    return s.replace(/×/g, '*').replace(/÷/g, '/').replace(/²/g, '^2').replace(/³/g, '^3').replace(/√/g, 'sqrt').replace(/π/g, 'pi').replace(/−/g, '-')
      .replace(/(\d)\s*([a-z(])/gi, '$1*$2').replace(/\)\s*\(/g, ')*(');
  }
  function equationOf(q) {       // a single equation in one unknown, if the question holds one
    const m = q.replace(/\n/g, ' ').replace(/[−–]/g, '-').match(/([0-9a-z+\-*/^().√²³×÷π\s]+)=([0-9a-z+\-*/^().√²³×÷π\s]+)/i);
    if (!m) return null;
    const lhs = m[1].replace(/^.*?(solve|find|if|when)\s+/i, '').trim(), rhs = m[2].replace(/[.,]\s*(find|solve|give|hence).*$/i, '').trim();
    const vars = [...new Set((lhs + rhs).replace(/sqrt|pi/g, '').match(/[a-z]/gi) || [])];
    if (vars.length !== 1 || /[a-z]{2,}/i.test((lhs + rhs).replace(/sqrt|pi/g, ''))) return null;
    try { const f = math.compile(`(${toMath(lhs)}) - (${toMath(rhs)})`), v = vars[0]; f.evaluate({ [v]: 1.234 }); return { v, f: (x) => f.evaluate({ [v]: x }), lhs, rhs }; } catch (e) { return null; }
  }
  const tidyTex = (t) => t.replace(/(\d)\s*\\cdot\s*(?=[a-z\\(])/gi, '$1').replace(/([a-z])\s*\\cdot\s*(?=\\left\(|\()/gi, '$1');
  const tex = (latex, el, display = false) => { try { katex.render(latex, el, { throwOnError: false, displayMode: display }); } catch (e) { el.textContent = latex; } };
  $('#q').addEventListener('input', () => {
    const q = $('#q').value, el = $('#qprev'), eq = window.math && equationOf(q);
    if (!eq) { el.innerHTML = ''; return; }
    try { tex(tidyTex(`${math.parse(toMath(eq.lhs)).toTex()} = ${math.parse(toMath(eq.rhs)).toTex()}`), el, true); } catch (e) { el.innerHTML = ''; }
  });

  // ================================================================ solving
  function systemPrompt(mode, level, step) {        // same instructions as the hub (karlissa/hub/maths.py), for the direct-Ollama plug
    const base = `You are Crest Slate, a careful, encouraging mathematics tutor for ${level} learners at Royal Crest Academy in Zimbabwe. The question may come from a photo read by OCR: silently fix obvious OCR slips. Write every mathematical expression in LaTeX WITHOUT dollar signs. Reply with JSON only. `;
    if (mode === 'hint') return base + `Give ONLY hint number ${step + 1}: one small next step as a short guiding sentence, never the final answer. JSON: {"topic":"...","hint":"...","math":"LaTeX or empty","last":true|false}`;
    if (mode === 'check') return base + 'Mark the learner\'s working. JSON: {"topic":"...","verdict":"correct"|"partly"|"incorrect","feedback":"two or three kind sentences","first_error":"first wrong line or empty","answer":"correct final answer in LaTeX"}';
    return base + 'Solve it step by step, showing method-mark working, in at most 8 steps. JSON: {"topic":"...","steps":[{"text":"short sentence","math":"LaTeX"}],"answer":"final answer in LaTeX","solution":"for an equation in one unknown, e.g. x=4, else empty"}';
  }
  async function askAI(body) {
    if (SL.SOLVER === 'ollama') {
      const user = `QUESTION:\n${body.question}` + (body.topic ? `\nTOPIC: ${body.topic}` : '') + (body.mode === 'check' ? `\nLEARNER'S WORKING:\n${body.working}` : '');
      const r = await fetch(SL.OLLAMA_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: SL.MODEL, stream: false, format: 'json', options: { temperature: .1, num_predict: 900 },
          messages: [{ role: 'system', content: systemPrompt(body.mode, $('#level').selectedOptions[0].text, body.step) }, { role: 'user', content: user }] }) });
      if (!r.ok) throw new Error(`Ollama ${r.status}`);
      const raw = ((await r.json()).message || {}).content || '';
      try { return JSON.parse(raw); } catch (e) { const m = raw.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : { steps: [{ text: raw, math: '' }], answer: '' }; }
    }
    const r = await fetch(`${API}/api/${C.API_VERSION || 'v1'}/maths/solve`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { const e = new Error(j.detail || `Error ${r.status}`); e.status = r.status; throw e; }
    return j;
  }

  // the offline helper: exact for linear and quadratic equations in one unknown, and for arithmetic
  const coef = (n, v) => (Math.abs(n - 1) < 1e-12 ? v : Math.abs(n + 1) < 1e-12 ? `-${v}` : `${fmt(n)}${v}`);
  const fmt = (n) => { const r = Math.round(n * 1e6) / 1e6; return Number.isInteger(r) ? String(r) : String(+r.toFixed(4)); };
  function localSolve(q) {
    const eq = equationOf(q);
    if (eq) {
      const f0 = eq.f(0), f1 = eq.f(1), f2 = eq.f(2), f3 = eq.f(3), d2 = f2 - 2 * f1 + f0, d3 = f3 - 3 * f2 + 3 * f1 - f0, v = eq.v;
      if (Math.abs(d2) < 1e-9 && Math.abs(f1 - f0) > 1e-12) {
        const a = f1 - f0, b = f0, x = -b / a;
        return { topic: 'Algebra and graphs', steps: [
          { text: 'Move everything to one side, so the equation equals zero.', math: `${coef(a, v)} ${b < 0 ? '-' : '+'} ${fmt(Math.abs(b))} = 0` },
          { text: `Get the ${v} term on its own.`, math: `${coef(a, v)} = ${fmt(-b)}` },
          { text: `Divide both sides by ${fmt(a)}.`, math: `${v} = ${fmt(x)}` }], answer: `${v} = ${fmt(x)}`, solution: `${v}=${fmt(x)}`, source: 'local' };
      }
      if (Math.abs(d3) < 1e-9 && Math.abs(d2) > 1e-12) {
        const a = d2 / 2, b = f1 - f0 - a, c = f0, D = b * b - 4 * a * c;
        const steps = [{ text: 'Rearrange into the form ax² + bx + c = 0.', math: `${coef(a, v + '^2')} ${b < 0 ? '-' : '+'} ${coef(Math.abs(b), v)} ${c < 0 ? '-' : '+'} ${fmt(Math.abs(c))} = 0` },
          { text: 'Use the quadratic formula.', math: `${v} = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}` },
          { text: 'Work out the discriminant.', math: `b^2 - 4ac = ${fmt(D)}` }];
        if (D < -1e-9) return { topic: 'Algebra and graphs', steps, answer: '\\text{no real solutions}', solution: '', source: 'local' };
        const r1 = (-b + Math.sqrt(D)) / (2 * a), r2 = (-b - Math.sqrt(D)) / (2 * a);
        steps.push({ text: 'Substitute the values.', math: `${v} = ${fmt(r1)} \\text{ or } ${v} = ${fmt(r2)}` });
        return { topic: 'Algebra and graphs', steps, answer: `${v} = ${fmt(r1)} \\text{ or } ${v} = ${fmt(r2)}`, solution: `${v}=${fmt(r1)}, ${v}=${fmt(r2)}`, source: 'local' };
      }
      return null;
    }
    const expr = q.replace(/^\s*(work out|calculate|evaluate|find)\s*/i, '').replace(/[?.]\s*$/, '');
    if (/^[0-9+\-*/^().√²³×÷π\s]+$/.test(expr) && /\d/.test(expr)) {
      try { const v = math.evaluate(toMath(expr)); return { topic: 'Number', steps: [{ text: 'Work it out, brackets and powers first (BODMAS).', math: tidyTex(math.parse(toMath(expr)).toTex()) }], answer: fmt(v), solution: '', source: 'local' }; } catch (e) { return null; }
    }
    return null;
  }

  // Slate's own check: put the answer back into the equation
  function verify(q, solution, answer) {
    const eq = equationOf(q); if (!eq) return null;
    const src = `${solution || ''} ${answer || ''}`.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)').replace(/\\(text|mathrm)\{[^}]*\}/g, ' ');
    const vals = [...src.matchAll(new RegExp(`${eq.v}\\s*=\\s*(-?[0-9.()/\\s-]+)`, 'g'))].map((m) => { try { return math.evaluate(m[1].trim()); } catch (e) { return NaN; } }).filter((n) => isFinite(n)).filter((n, i, a) => a.findIndex((m) => Math.abs(m - n) < 1e-9) === i);
    if (!vals.length) return null;
    const scale = 1 + Math.abs(eq.f(0)) + Math.abs(eq.f(1));
    const bad = vals.filter((x) => Math.abs(eq.f(x)) > 1e-6 * scale);
    return bad.length ? { ok: false, text: `Slate put ${eq.v} = ${bad.map(fmt).join(', ')} back into the equation and it doesn’t balance. Check this one carefully.` }
                      : { ok: true, text: `Checked: ${vals.map((x) => `${eq.v} = ${fmt(x)}`).join(' and ')} make${vals.length > 1 ? '' : 's'} both sides equal.` };
  }

  // rendering answers
  const out = $('#out');
  const busy = (m) => { out.hidden = false; out.innerHTML = `<div class="loading"><i></i>${esc(m)}</div>`; };
  function mathHTML(latex) { const s = document.createElement('div'); s.className = 'm'; if (latex) tex(latex, s, false); return s; }
  function showSolve(q, r) {
    out.hidden = false; out.innerHTML = `<h3>Worked solution ${r.topic ? `<span class="chip">${esc(r.topic)}</span>` : ''}${r.source === 'local' ? '<span class="chip">offline helper</span>' : ''}</h3><ol class="steps"></ol>`;
    const ol = out.querySelector('.steps');
    (r.steps || []).forEach((s) => { const li = document.createElement('li'); li.innerHTML = `<div class="t">${esc(s.text)}</div>`; if (s.math) li.appendChild(mathHTML(s.math)); ol.appendChild(li); });
    if (r.answer) { const a = document.createElement('div'); a.className = 'answer'; a.innerHTML = '<small>ANSWER</small>'; const m = document.createElement('div'); tex(r.answer, m, false); a.appendChild(m); out.appendChild(a); }
    const v = verify(q, r.solution, r.answer);
    if (v) { const d = document.createElement('div'); d.className = `verify ${v.ok ? 'ok' : 'warn'}`; d.textContent = `${v.ok ? '✓' : '⚠'} ${v.text}`; out.appendChild(d); }
    const row = document.createElement('div'); row.className = 'row';
    row.innerHTML = '<button class="soft" data-a="write" type="button">Write it on the slate</button>' + (/y\s*=/.test(q) ? '<button class="soft" data-a="plot" type="button">Plot the graph</button>' : '');
    out.appendChild(row);
  }
  out.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    if (b.dataset.a === 'write') {      // the steps, written neatly on the page as text items on the ink layer
      const lines = [...out.querySelectorAll('.steps li')].map((li, i) => `${i + 1}. ${li.querySelector('.t').textContent}  ${li.querySelector('.m')?.textContent || ''}`);
      const ans = out.querySelector('.answer div:last-child')?.textContent; if (ans) lines.push(`Answer: ${ans}`);
      const c = document.createElement('canvas'); c.width = PW; c.height = 40 * lines.length + 20; const g = c.getContext('2d');
      g.fillStyle = TEMPLATES[tpl].dark ? '#f4f1e8' : '#0a1f5c'; g.font = '26px RcSerif, serif'; lines.forEach((l, i) => g.fillText(l.slice(0, 95), 10, 34 + i * 40));
      const img = new Image(); img.onload = () => push({ type: 'image', img, x: 110, y: 100, w: PW, h: c.height }); img.src = c.toDataURL();
    }
    if (b.dataset.a === 'plot') { const m = $('#q').value.match(/y\s*=\s*([^\n,]+)/); if (m) plot(m[0]); }
  });

  function level() { return $('#level').value; }
  async function run(mode) {
    const q = $('#q').value.trim(); if (!q) { toast('Type a question, or read one from a photo first.'); $('#q').focus(); return; }
    const body = { question: q, mode, topic: $('#topic').value, level: level(), step: mode === 'hint' ? hints.length : 0, working: $('#working').value.trim() };
    if (mode === 'check' && !body.working) { toast('Write your working first, then mark it.'); return; }
    const offline = SL.SOLVER === 'local' || (SL.SOLVER === 'hub' && (!API || !token()));
    if (offline || !aiOn) {
      const r = mode === 'solve' ? localSolve(q) : null;
      if (r) { showSolve(q, r); return; }
      out.hidden = false; out.innerHTML = `<h3>Slate needs the AI for this one</h3><p class="sub">${!token() && SL.SOLVER === 'hub' ? 'Sign in to the <a href="../">portal</a> first, then open Crest Slate from there.' : 'The school’s maths AI is switched off right now.'} The offline helper only solves equations (like 3x + 2 = 17 or x² − 5x + 6 = 0) and arithmetic.</p>`;
      return;
    }
    busy(mode === 'hint' ? 'Thinking of a hint…' : mode === 'check' ? 'Marking your working…' : 'Working it out… (the school’s AI can take up to a minute)');
    try {
      const r = await askAI(body);
      if (mode === 'solve') showSolve(q, r);
      else if (mode === 'hint') { hints.push(r); showHints(r); }
      else showCheck(q, r);
    } catch (e) {
      const r = mode === 'solve' ? localSolve(q) : null;
      if (r) { showSolve(q, r); toast('The AI didn’t answer, so Slate solved it offline.'); return; }
      out.innerHTML = `<h3>Something went wrong</h3><p class="sub">${esc(e.status === 401 ? 'Please sign in to the portal again.' : e.message)}</p>`;
    }
  }
  let hints = [];
  function showHints(last) {
    out.hidden = false; out.innerHTML = `<h3>Hints ${last.topic ? `<span class="chip">${esc(last.topic)}</span>` : ''}</h3><ol class="steps"></ol><div class="row">${last.last ? '' : '<button class="soft" id="next-hint" type="button">Next hint</button>'}<button class="soft" id="show-all" type="button">Show the full solution</button></div>`;
    const ol = out.querySelector('.steps');
    hints.forEach((h) => { const li = document.createElement('li'); li.innerHTML = `<div class="t">${esc(h.hint)}</div>`; if (h.math) li.appendChild(mathHTML(h.math)); ol.appendChild(li); });
    out.querySelector('#next-hint')?.addEventListener('click', () => run('hint'));
    out.querySelector('#show-all').addEventListener('click', () => run('solve'));
  }
  function showCheck(q, r) {
    out.hidden = false;
    const words = { correct: 'Correct! Well done.', partly: 'Nearly there.', incorrect: 'Not quite yet.' };
    out.innerHTML = `<h3>Your working ${r.topic ? `<span class="chip">${esc(r.topic)}</span>` : ''}</h3><div class="verdict ${esc(r.verdict)}">${esc(words[r.verdict] || '')}</div><p>${esc(r.feedback)}</p>${r.first_error ? `<p class="sub">First slip: <b>${esc(r.first_error)}</b></p>` : ''}`;
    if (r.answer) { const a = document.createElement('div'); a.className = 'answer'; a.innerHTML = '<small>CORRECT ANSWER</small>'; const m = document.createElement('div'); tex(r.answer, m); a.appendChild(m); out.appendChild(a); }
  }
  $('#solve').onclick = () => { hints = []; run('solve'); };
  $('#hint').onclick = () => run('hint');
  $('#check').onclick = () => { $('#working-box').hidden = !$('#working-box').hidden; if (!$('#working-box').hidden) $('#working').focus(); };
  $('#check-go').onclick = () => run('check');
  $('#read-working').onclick = () => { readTarget = 'working'; setTool('read'); };
  $('#q').addEventListener('input', () => { hints = []; });

  // ================================================================ Cambridge question bank (practice questions in the Cambridge style)
  const BANK = {
    'Number': ['Write 0.000 482 in standard form.', 'Increase $250 by 12%.', 'Work out (3.5 + 1.25) × 4'],
    'Algebra and graphs': ['Solve 3x + 2 = 17', 'Solve 5x − 7 = 2x + 8', 'Solve x² − 5x + 6 = 0', 'Factorise x² + 7x + 12', 'Make r the subject of A = πr²'],
    'Coordinate geometry': ['Find the gradient of the line through (2, 3) and (6, 11).', 'Find the equation of the line through (0, 4) with gradient 3.', 'Find the midpoint of (−2, 5) and (6, 1).'],
    'Geometry': ['The angles of a triangle are x, 2x and 3x. Find x.', 'Find the size of each interior angle of a regular hexagon.'],
    'Mensuration': ['Find the area of a circle of radius 7 cm. Give your answer to 3 significant figures.', 'A cuboid measures 5 cm by 4 cm by 3 cm. Find its volume and total surface area.'],
    'Trigonometry': ['In a right-angled triangle the hypotenuse is 10 cm and one angle is 30°. Find the side opposite the 30° angle.', 'Find the acute angle x when tan x = 0.75.'],
    'Transformations and vectors': ['The point (3, −2) is translated by the vector (4, 5). Find its new position.', 'Find the magnitude of the vector (6, 8).'],
    'Probability': ['A bag holds 3 red and 5 blue balls. One is taken at random. Find P(red).', 'Two fair coins are tossed. Find the probability of two heads.'],
    'Statistics': ['Find the mean of 4, 7, 9, 10 and 15.', 'Find the median of 3, 8, 2, 9, 5 and 7.'],
  };
  $('#topic').innerHTML += Object.keys(BANK).map((t) => `<option>${esc(t)}</option>`).join('');
  $('#bank-list').innerHTML = Object.entries(BANK).map(([t, qs]) => `<div class="topic"><h4>${esc(t)}</h4>${qs.map((q) => `<button class="qbtn" type="button" data-t="${esc(t)}">${esc(q)}</button>`).join('')}</div>`).join('');
  $('#bank-list').addEventListener('click', (e) => { const b = e.target.closest('.qbtn'); if (!b) return; $('#q').value = b.textContent; $('#topic').value = b.dataset.t; $('#q').dispatchEvent(new Event('input')); $('#bank').hidden = true; out.hidden = true; hints = []; });
  $('#bank-open').onclick = () => { $('#bank').hidden = false; };
  $('#bank-close').onclick = () => { $('#bank').hidden = true; };
  $('#bank').addEventListener('click', (e) => { if (e.target.id === 'bank') $('#bank').hidden = true; });

  // ================================================================ status
  let aiOn = false;
  async function status() {
    const pill = $('#ai-pill');
    const set = (cls, txt, tip) => { pill.className = `pill ${cls}`; pill.textContent = txt; pill.title = tip; };
    if (SL.SOLVER === 'local') { set('off', 'Offline helper', 'No AI: Slate solves equations and arithmetic itself'); return; }
    if (SL.SOLVER === 'ollama') { aiOn = true; $('#model-name').textContent = SL.MODEL; set('on', 'AI: local Ollama', SL.OLLAMA_URL); return; }
    if (!API || !token()) { set('off', 'Not signed in', 'Sign in to the portal to use the school’s maths AI'); return; }
    try {
      const r = await fetch(`${API}/api/${C.API_VERSION || 'v1'}/maths/status`, { headers: { Authorization: `Bearer ${token()}` } });
      const j = await r.json(); aiOn = !!j.ai;
      if (j.model) $('#model-name').textContent = j.model.split(':')[0];
      aiOn ? set('on', 'AI on', `School AI: ${j.model}`) : set('off', 'AI off', 'The hub’s maths AI is off; the offline helper still works');
    } catch (e) { set('off', 'Hub offline', 'Couldn’t reach the hub; the offline helper still works'); }
  }

  window.addEventListener('resize', fit);
  document.fonts?.ready.then(fit);
  window.addEventListener('load', () => { fit(); status(); $('#q').dispatchEvent(new Event('input')); });
  fit();
})();
