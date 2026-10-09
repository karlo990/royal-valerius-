/* Royal Crest Flyer Studio — app controller (no build step, no framework). */
(() => {
  'use strict';
  const F = window.Flyer;
  const $ = (s) => document.querySelector(s);
  const SETTINGS_KEY = 'rca-studio-settings';
  const isBatch = new URLSearchParams(location.search).has('batch');

  const state = { template: 'prospectus', format: 'portrait', kind: 'spotlight', key: 'chemistry', editing: false, view: 'editor' };
  let brandDefaults, brand, subjects = [], molecules = [], items = [], svgs = {}, fontCSS = null;
  const edits = new Map(); // flyerKey -> innerHTML after the user edited it

  // ------------------------------------------------------------- data
  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  }

  async function load() {
    const [b, s, m] = await Promise.all([loadJSON('data/brand.json'), loadJSON('data/subjects.json'), loadJSON('data/molecules.json')]);
    brandDefaults = b;
    subjects = s.subjects.filter((x) => x.offered !== false);
    molecules = m.molecules;
    await Promise.all(molecules.map(async (mol) => { svgs[mol.id] = await (await fetch(mol.svg)).text(); }));
    items = [
      ...subjects.map((sub, i) => ({ key: sub.id, type: 'subject', data: sub, index: i + 1, label: sub.name, symbol: sub.symbol, dept: sub.dept })),
      ...molecules.map((mol, i) => ({ key: 'mol-' + mol.id, type: 'molecule', data: mol, index: i + 1, label: mol.display, symbol: mol.formula_html, dept: 'molecules' })),
    ];
    applySettings();
    // make sure every face is ready before measuring text
    await Promise.all([
      '400 40px Newsreader', 'italic 400 40px Newsreader', '500 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"',
      '800 40px Archivo', '600 20px "Archivo Narrow"', '400 16px "IBM Plex Mono"', '600 16px "IBM Plex Mono"', '700 30px Caveat',
    ].map((f) => document.fonts.load(f).catch(() => null)));
  }

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; }
  }
  function applySettings() {
    const s = readSettings();
    brand = structuredClone(brandDefaults);
    if (s.phone) brand.phone = s.phone;
    if (s.website) brand.website = s.website;
    brand.tutoring.schedule = s.schedule || brandDefaults.tutoring.schedule;
    brand.tutoring.fee = s.fee || brandDefaults.tutoring.fee;
  }

  const itemByKey = (k) => items.find((i) => i.key === k);
  const kindsFor = (item) => (item.type === 'molecule' ? ['molecule'] : ['spotlight', 'tutoring', 'fact', 'tip', 'quiz']);
  const flyerKey = (item, kind, template, format) => `${item.key}|${kind}|${template}|${format}`;

  function model(item, kind) {
    if (item.type === 'molecule') return F.buildModel(brand, item.data, 'molecule', { svg: svgs[item.data.id], index: item.index });
    return F.buildModel(brand, item.data, kind, { index: item.index });
  }

  // ------------------------------------------------------------- rendering
  function waitImages(node) {
    return Promise.all([...node.querySelectorAll('img')].map((img) => (img.complete ? img.decode().catch(() => null) : new Promise((r) => { img.onload = img.onerror = r; }))));
  }

  /** Build a flyer at native size inside `host`, fitted and ready. */
  async function mount(host, item, kind, template, format) {
    const m = model(item, kind);
    const node = F.buildFlyer(m, template, format);
    const key = flyerKey(item, kind, template, format);
    if (edits.has(key)) node.innerHTML = edits.get(key);
    host.replaceChildren(node);
    await waitImages(node);
    await document.fonts.ready;
    F.fitFlyer(node);
    return { node, model: m, key };
  }

  // ------------------------------------------------------------- controls
  function radio(btn, on) { btn.setAttribute('aria-checked', String(on)); btn.tabIndex = on ? 0 : -1; }

  function renderControls() {
    const tl = $('#template-list');
    tl.replaceChildren(...Object.entries(F.TEMPLATES).map(([id, t]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt-card'; b.setAttribute('role', 'radio'); b.dataset.id = id;
      b.innerHTML = `<span class="swatch sw-${id}" aria-hidden="true"></span><span><strong>${t.label}</strong><small>${t.note}</small></span>`;
      radio(b, id === state.template);
      b.onclick = () => { state.template = id; update(); };
      return b;
    }));

    const item = itemByKey(state.key);
    const allowed = kindsFor(item);
    if (!allowed.includes(state.kind)) state.kind = allowed[0];
    const kl = $('#kind-list');
    kl.replaceChildren(...Object.entries(F.KINDS).map(([id, k]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'radio'); b.textContent = k.short;
      b.disabled = !allowed.includes(id);
      if (b.disabled) b.title = id === 'molecule' ? 'Pick a molecule under Chemistry molecules' : 'Molecules have one flyer type';
      radio(b, id === state.kind);
      b.onclick = () => { state.kind = id; update(); };
      return b;
    }));

    const fl = $('#format-list');
    fl.replaceChildren(...Object.entries(F.FORMATS).map(([id, f]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'fmt'; b.setAttribute('role', 'radio');
      const h = Math.round(24 * (f.h / f.w));
      b.innerHTML = `<span class="fmt-shape" style="width:${Math.round(24 * Math.min(1, 1.25 * f.w / f.h))}px;height:${Math.min(40, h)}px"></span><span><strong>${f.label}</strong><small>${f.note}</small></span>`;
      radio(b, id === state.format);
      b.onclick = () => { state.format = id; update(); };
      return b;
    }));
    renderSubjects();
  }

  function renderSubjects() {
    const q = $('#subject-search').value.trim().toLowerCase();
    const groups = [...Object.entries(brand.departments).map(([k, d]) => [k, d.name, d.accent]), ['molecules', 'Chemistry molecules', '#d2ae4c']];
    const out = [];
    for (const [k, name, accent] of groups) {
      const list = items.filter((i) => i.dept === k && (!q || i.label.toLowerCase().includes(q) || name.toLowerCase().includes(q)));
      if (!list.length) continue;
      const wrap = document.createElement('div');
      wrap.innerHTML = `<p class="dept-title"><span class="dept-dot" style="background:${accent}"></span>${name}</p>`;
      const grid = document.createElement('div');
      grid.className = 'subj-grid'; grid.setAttribute('role', 'radiogroup'); grid.setAttribute('aria-label', name);
      list.forEach((i) => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'subj'; b.setAttribute('role', 'radio');
        b.innerHTML = `<span class="subj-sym" style="background:${accent}">${i.type === 'molecule' ? '⌬' : i.symbol}</span>${i.label}`;
        radio(b, i.key === state.key);
        b.onclick = () => { state.key = i.key; if (i.type === 'molecule') state.kind = 'molecule'; else if (state.kind === 'molecule') state.kind = 'spotlight'; update(); };
        grid.append(b);
      });
      wrap.append(grid);
      out.push(wrap);
    }
    if (!out.length) { const p = document.createElement('p'); p.className = 'subj-empty'; p.textContent = 'No subject matches that search.'; out.push(p); }
    $('#subject-list').replaceChildren(...out);
  }

  // ------------------------------------------------------------- preview
  let previewToken = 0;
  async function renderPreview() {
    const token = ++previewToken;
    const item = itemByKey(state.key);
    const f = F.FORMATS[state.format];
    const frame = document.createElement('div');
    frame.className = 'preview-frame';
    const host = $('#preview');
    const availW = host.clientWidth - 48;
    const availH = Math.max(360, window.innerHeight * 0.74);
    const scale = Math.min(availW / f.w, availH / f.h, 1);
    frame.style.width = Math.round(f.w * scale) + 'px';
    frame.style.height = Math.round(f.h * scale) + 'px';
    const { node, model: m, key } = await mount(frame, item, state.kind, state.template, state.format);
    if (token !== previewToken) return;
    node.style.transform = `scale(${scale})`;
    host.replaceChildren(frame);
    $('#preview-title').textContent = `${item.label} · ${F.KINDS[state.kind].label} · ${F.TEMPLATES[state.template].label}`;
    $('#preview-file').textContent = `${node.dataset.file}.png · ${Math.round(f.w * f.scale)} × ${Math.round(f.h * f.scale)} px`;
    $('#caption').value = F.caption(m);
    setEditable(node, key);
    $('#btn-reset-edit').hidden = !edits.has(key);
  }

  const EDITABLE = '.fl-title, .fl-subtitle, .fl-kicker, .fl-body, .fl-bullets li, .opt-text, .fl-rows dd, .fl-cta, .fl-listtitle, .ans-explain';
  function setEditable(node, key) {
    $('#preview').classList.toggle('is-editing', state.editing);
    node.querySelectorAll(EDITABLE).forEach((n) => {
      if (state.editing) n.setAttribute('contenteditable', 'true'); else n.removeAttribute('contenteditable');
    });
    if (!state.editing) return;
    let t;
    node.oninput = () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const clone = node.cloneNode(true);
        clone.querySelectorAll('[contenteditable]').forEach((n) => n.removeAttribute('contenteditable'));
        edits.set(key, clone.innerHTML);
        $('#btn-reset-edit').hidden = false;
        F.fitFlyer(node);
      }, 250);
    };
  }

  // ------------------------------------------------------------- export
  async function ensureFontCSS(node) {
    if (fontCSS == null) fontCSS = await htmlToImage.getFontEmbedCSS(node);
    return fontCSS;
  }

  async function exportBlob(item, kind, template, format) {
    const stage = $('#export-stage');
    const holder = document.createElement('div');
    stage.append(holder);
    try {
      const { node } = await mount(holder, item, kind, template, format);
      const f = F.FORMATS[format];
      const css = await ensureFontCSS(node);
      const blob = await htmlToImage.toBlob(node, { width: f.w, height: f.h, pixelRatio: f.scale, fontEmbedCSS: css, cacheBust: false });
      return { blob, name: node.dataset.file + '.png' };
    } finally {
      holder.remove();
    }
  }

  function saveBlob(blob, name) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  }

  async function downloadCurrent() {
    const btn = $('#btn-download');
    btn.disabled = true; btn.textContent = 'Preparing…';
    try {
      const { blob, name } = await exportBlob(itemByKey(state.key), state.kind, state.template, state.format);
      saveBlob(blob, name);
      toast(`Downloaded ${name}`);
    } catch (e) {
      console.error(e);
      toast('The flyer could not be exported. Reload the page and try again.');
    } finally {
      btn.disabled = false; btn.textContent = 'Download PNG';
    }
  }

  async function downloadZip(jobs, zipName) {
    const bar = $('#progress-bar'), text = $('#progress-text'), box = $('#progress');
    const buttons = [$('#btn-zip-all'), $('#btn-zip-subject')];
    buttons.forEach((b) => { b.disabled = true; });
    box.hidden = false;
    const zip = new JSZip();
    const captions = [];
    const rows = [['file', 'subject', 'flyer type', 'template', 'size']];
    try {
      for (let i = 0; i < jobs.length; i++) {
        const [item, kind, template, format] = jobs[i];
        text.textContent = `Rendering ${i + 1} of ${jobs.length}: ${item.label}, ${F.KINDS[kind].short}`;
        bar.style.width = `${(i / jobs.length) * 100}%`;
        const { blob, name } = await exportBlob(item, kind, template, format);
        const path = `${template}-${format}/${name}`;
        zip.file(path, blob);
        captions.push(`=== ${path} ===\n${F.caption(model(item, kind))}\n`);
        rows.push([path, item.label, F.KINDS[kind].label, F.TEMPLATES[template].label, F.FORMATS[format].label]);
      }
      zip.file('captions.txt', captions.join('\n'));
      zip.file('flyers.csv', rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'));
      text.textContent = 'Packing the ZIP…';
      bar.style.width = '100%';
      const out = await zip.generateAsync({ type: 'blob' });
      saveBlob(out, zipName);
      toast(`Downloaded ${jobs.length} flyers`);
    } catch (e) {
      console.error(e);
      toast('Stopped: a flyer could not be exported. Reload and try again.');
    } finally {
      buttons.forEach((b) => { b.disabled = false; });
      setTimeout(() => { box.hidden = true; bar.style.width = '0'; }, 1500);
    }
  }

  function allJobs(template, format) {
    return items.flatMap((item) => kindsFor(item).map((kind) => [item, kind, template, format]));
  }

  // ------------------------------------------------------------- gallery
  let galleryObserver;
  function renderGallery() {
    const jobs = allJobs(state.template, state.format);
    const f = F.FORMATS[state.format];
    $('#gallery-summary').textContent = `${jobs.length} flyers in ${F.TEMPLATES[state.template].label}, ${F.FORMATS[state.format].label.toLowerCase()}. Click one to open it in the editor.`;
    $('#btn-zip-all').textContent = `Download all ${jobs.length} as ZIP`;
    galleryObserver?.disconnect();
    const W = 200, scale = W / f.w;
    galleryObserver = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        galleryObserver.unobserve(e.target);
        const [item, kind] = e.target._job;
        mount(e.target.querySelector('.thumb-frame'), item, kind, state.template, state.format).then(({ node }) => { node.style.transform = `scale(${scale})`; });
      });
    }, { rootMargin: '400px' });
    $('#gallery').replaceChildren(...jobs.map((job) => {
      const [item, kind] = job;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'thumb'; b._job = job;
      b.innerHTML = `<span class="thumb-frame" style="width:${W}px;height:${Math.round(f.h * scale)}px"></span><span class="thumb-label"><strong>${item.label}</strong>${F.KINDS[kind].label}</span>`;
      b.onclick = () => { state.key = item.key; state.kind = kind; setView('editor'); update(); };
      galleryObserver.observe(b);
      return b;
    }));
  }

  function setView(v) {
    state.view = v;
    $('#tab-editor').setAttribute('aria-selected', String(v === 'editor'));
    $('#tab-gallery').setAttribute('aria-selected', String(v === 'gallery'));
    $('#panel-editor').hidden = v !== 'editor';
    $('#panel-gallery').hidden = v !== 'gallery';
    if (v === 'gallery') renderGallery();
  }

  // ------------------------------------------------------------- misc UI
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 3200);
  }

  function update() {
    renderControls();
    $('#gallery-count').textContent = `(${allJobs(state.template, state.format).length})`;
    if (state.view === 'gallery') renderGallery(); else renderPreview();
  }

  function wire() {
    $('#subject-search').addEventListener('input', renderSubjects);
    $('#tab-editor').onclick = () => { setView('editor'); renderPreview(); };
    $('#tab-gallery').onclick = () => setView('gallery');
    $('#btn-download').onclick = downloadCurrent;
    $('#btn-edit').onclick = () => {
      state.editing = !state.editing;
      $('#btn-edit').setAttribute('aria-pressed', String(state.editing));
      $('#edit-hint').hidden = !state.editing;
      renderPreview();
    };
    $('#btn-reset-edit').onclick = () => { edits.delete(flyerKey(itemByKey(state.key), state.kind, state.template, state.format)); renderPreview(); toast('Edits removed'); };
    $('#btn-copy').onclick = async () => {
      const ta = $('#caption');
      try { await navigator.clipboard.writeText(ta.value); toast('Caption copied'); }
      catch { ta.select(); toast('Press Ctrl+C to copy the selected caption'); }
    };
    $('#btn-surprise').onclick = () => {
      const item = items[Math.floor(Math.random() * items.length)];
      const kinds = kindsFor(item);
      state.key = item.key;
      state.kind = kinds[Math.floor(Math.random() * kinds.length)];
      state.template = Object.keys(F.TEMPLATES)[Math.floor(Math.random() * 5)];
      setView('editor'); update();
    };
    $('#btn-zip-all').onclick = () => downloadZip(allJobs(state.template, state.format), `royal-crest-flyers-${state.template}-${state.format}.zip`);
    $('#btn-zip-subject').onclick = () => {
      const item = itemByKey(state.key);
      const jobs = Object.keys(F.TEMPLATES).flatMap((t) => kindsFor(item).map((k) => [item, k, t, state.format]));
      downloadZip(jobs, `royal-crest-${item.key}-${state.format}.zip`);
    };
    // settings
    const fields = { phone: '#set-phone', website: '#set-website', schedule: '#set-schedule', fee: '#set-fee' };
    const fillSettings = () => {
      const s = readSettings();
      $('#set-phone').value = s.phone || brandDefaults.phone;
      $('#set-website').value = s.website || brandDefaults.website;
      $('#set-schedule').value = s.schedule || '';
      $('#set-fee').value = s.fee || '';
    };
    $('#btn-settings').onclick = () => {
      const panel = $('#settings');
      panel.hidden = !panel.hidden;
      $('#btn-settings').setAttribute('aria-expanded', String(!panel.hidden));
      if (!panel.hidden) { fillSettings(); $('#set-phone').focus(); }
    };
    $('#btn-save-settings').onclick = () => {
      const s = Object.fromEntries(Object.entries(fields).map(([k, sel]) => [k, $(sel).value.trim()]));
      try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* private mode: applies for this visit */ }
      applySettings(); update(); toast('School details saved');
    };
    $('#btn-reset-settings').onclick = () => {
      try { localStorage.removeItem(SETTINGS_KEY); } catch { /* ignore */ }
      applySettings(); fillSettings(); update(); toast('Defaults restored');
    };
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (state.view === 'editor') renderPreview(); }, 150); });
  }

  // ------------------------------------------------------------- batch API (used by tools/render_all.mjs)
  window.Studio = {
    ready: null,
    jobs(template, format) {
      return allJobs(template, format).map(([item, kind]) => ({ key: item.key, kind, label: item.label }));
    },
    async mountForShot(key, kind, template, format) {
      let stage = document.getElementById('batch-stage');
      if (!stage) {
        stage = document.createElement('div');
        stage.id = 'batch-stage';
        stage.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#fff';
        document.body.append(stage);
      }
      const item = itemByKey(key);
      const { node, model: m } = await mount(stage, item, kind, template, format);
      return { file: node.dataset.file, caption: F.caption(m), fits: F.fitFlyer(node), w: F.FORMATS[format].w, h: F.FORMATS[format].h, scale: F.FORMATS[format].scale };
    },
  };

  window.Studio.ready = (async () => {
    try {
      await load();
    } catch (e) {
      console.error(e);
      $('#preview').innerHTML = '<p style="max-width:44ch;text-align:center">The studio could not load its data. Open it through a web server (double-click <strong>start-studio.bat</strong>, or run <code>python -m http.server</code> in the website folder) rather than opening the file directly.</p>';
      $('#preview-title').textContent = 'Could not load';
      throw e;
    }
    if (isBatch) return true;
    wire();
    update();
    return true;
  })();
})();
