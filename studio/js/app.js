/* Royal Crest Flyer Studio — app controller (no build step, no framework). */
(() => {
  'use strict';
  const F = window.Flyer;
  const $ = (s) => document.querySelector(s);
  const SETTINGS_KEY = 'rca-studio-settings';
  const isBatch = new URLSearchParams(location.search).has('batch');

  const state = { template: 'prospectus', format: 'portrait', kind: 'spotlight', key: 'chemistry', editing: false, view: 'editor' };
  let brandDefaults, brand, subjects = [], molecules = [], activities = [], outfits = {}, items = [], fontCSS = null;
  const svgs = {};          // molecule id -> structure svg
  const icons = {};         // icon name -> svg
  let libraryPhotos = {};   // tag -> project photo path (data/photos.json)
  const uploads = new Map(); // tag -> object URL of a photo uploaded in this browser
  const edits = new Map();  // flyerKey -> innerHTML after the user edited it

  // ------------------------------------------------------------- photo store (IndexedDB, this browser only)
  const DB = {
    db: null,
    open() {
      return new Promise((resolve) => {
        try {
          const req = indexedDB.open('rca-flyer-studio', 1);
          req.onupgradeneeded = () => req.result.createObjectStore('photos');
          req.onsuccess = () => { this.db = req.result; resolve(this.db); };
          req.onerror = () => resolve(null);
        } catch { resolve(null); }
      });
    },
    tx(mode) { return this.db.transaction('photos', mode).objectStore('photos'); },
    all() {
      return new Promise((resolve) => {
        if (!this.db) return resolve([]);
        const out = [];
        const req = this.tx('readonly').openCursor();
        req.onsuccess = () => { const c = req.result; if (c) { out.push([c.key, c.value]); c.continue(); } else resolve(out); };
        req.onerror = () => resolve(out);
      });
    },
    put(tag, blob) { return new Promise((r) => { if (!this.db) return r(); const q = this.tx('readwrite').put(blob, tag); q.onsuccess = q.onerror = () => r(); }); },
    del(tag) { return new Promise((r) => { if (!this.db) return r(); const q = this.tx('readwrite').delete(tag); q.onsuccess = q.onerror = () => r(); }); },
  };

  async function loadUploads() {
    await DB.open();
    for (const [tag, blob] of await DB.all()) uploads.set(tag, URL.createObjectURL(blob));
  }

  /** Shrink a photo to at most 2000 px on its long side (keeps exports fast). */
  async function prepareImage(file) {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * scale); c.height = Math.round(bmp.height * scale);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  }

  const photoFor = (tag) => uploads.get(tag) || libraryPhotos[tag] || null;

  // ------------------------------------------------------------- data
  async function loadJSON(url) {
    const r = await fetch(url);
    if (!r.ok) throw new Error(`${url}: ${r.status}`);
    return r.json();
  }
  const loadText = async (url) => { const r = await fetch(url); if (!r.ok) throw new Error(`${url}: ${r.status}`); return r.text(); };

  async function load() {
    const [b, s, m, a, p] = await Promise.all([loadJSON('data/brand.json'), loadJSON('data/subjects.json'), loadJSON('data/molecules.json'), loadJSON('data/activities.json'), loadJSON('data/photos.json').catch(() => ({ photos: {} }))]);
    brandDefaults = b;
    subjects = s.subjects.filter((x) => x.offered !== false);
    molecules = m.molecules;
    activities = a.activities.filter((x) => x.offered !== false);
    outfits = a.outfits || {};
    libraryPhotos = p.photos || {};
    const iconNames = [...new Set([...activities.map((x) => x.icon), 'trophy', 'users-group'])];
    await Promise.all([
      ...molecules.map(async (mol) => { svgs[mol.id] = await loadText(mol.svg); }),
      ...iconNames.map(async (n) => { icons[n] = await loadText(`assets/icons/${n}.svg`); }),
      isBatch ? null : loadUploads(),
    ]);
    items = [
      ...window.Posts.ORDER.map((id, i) => ({ key: 'post-' + id, type: 'social', data: { id }, index: i + 1, label: window.Posts.POSTS[id].label, symbol: '✦', dept: 'social' })),
      ...Object.keys(F.SERIES).map((id, i) => ({ key: 'poster-' + id, type: 'series', data: { id }, index: i + 1, label: F.SERIES[id].label, symbol: '★', dept: 'series' })),
      ...subjects.map((sub, i) => ({ key: sub.id, type: 'subject', data: sub, index: i + 1, label: sub.name, symbol: sub.symbol, dept: sub.dept })),
      ...activities.map((act, i) => ({ key: 'act-' + act.id, type: 'activity', data: act, index: i + 1, label: act.short, symbol: act.symbol, dept: act.group })),
      ...molecules.map((mol, i) => ({ key: 'mol-' + mol.id, type: 'molecule', data: mol, index: i + 1, label: mol.display, symbol: mol.formula_html, dept: 'molecules' })),
    ];
    applySettings();
    // make sure every face is ready before measuring text
    await Promise.all([
      '400 40px Newsreader', 'italic 400 40px Newsreader', '500 20px "Plus Jakarta Sans"', '700 20px "Plus Jakarta Sans"',
      '800 40px Archivo', '600 20px "Archivo Narrow"', '400 16px "IBM Plex Mono"', '600 16px "IBM Plex Mono"', '700 30px Caveat',
      '500 20px "Plus Jakarta Sans" ǐ', 'italic 400 40px Newsreader ǎ',
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
    brand.icons = icons;
  }

  const itemByKey = (k) => items.find((i) => i.key === k);
  function kindsFor(item) {
    switch (item.type) {
      case 'molecule': return ['molecule'];
      case 'series': return ['series'];
      case 'social': return ['social'];
      case 'activity': return ['spotlight', 'fact', 'quiz', 'answer'];
      default: return ['spotlight', 'tutoring', 'fact', 'tip', 'quiz', 'answer'];
    }
  }
  const isFixed = (item) => item.type === 'series' || item.type === 'social';   // own design, no template choice
  const formatsFor = (item) => (item.type === 'series' ? F.SERIES[item.data.id].formats : item.type === 'social' ? (window.Posts.POSTS[item.data.id].formats || ['portrait']) : Object.keys(F.FORMATS));
  const flyerKey = (item, kind, template, format) => `${item.key}|${kind}|${isFixed(item) ? '-' : template}|${format}`;
  const actById = (id) => activities.find((a) => a.id === id);

  function model(item, kind) {
    switch (item.type) {
      case 'molecule': return F.buildModel(brand, item.data, 'molecule', { svg: svgs[item.data.id], index: item.index });
      case 'activity': return F.buildModel(brand, item.data, kind, { type: 'activity', index: item.index, icon: icons[item.data.icon], photo: photoFor(item.data.id) });
      case 'series': {
        const acts = Object.fromEntries(activities.map((a) => [a.id, { short: a.short, iconSvg: icons[a.icon], photo: photoFor(a.id) }]));
        const fallbackPhotos = ['campus', 'library', 'arch', 'reading', 'aisle'].map((k) => brand.photos[k]);
        return F.buildModel(brand, item.data, 'series', { acts, fallbackPhotos });
      }
      case 'social': return F.buildModel(brand, item.data, 'social');
      default: return F.buildModel(brand, item.data, kind, { index: item.index, photo: photoFor(item.data.id) });
    }
  }

  /** The AI image prompt for an activity, built from its outfit, scene and place. */
  function promptFor(tag) {
    const a = actById(tag);
    if (!a) return null;
    return `Photorealistic candid photograph, natural light, documentary style, not a posed stock photo. `
      + `Black African high-school students aged 13 to 18 at a private secondary school in rural Zimbabwe, wearing ${outfits[a.outfit] || outfits.blazer}. `
      + `${a.scene[0].toUpperCase() + a.scene.slice(1)}, ${a.place}. `
      + `Bright, joyful and authentic expressions, sharp focus, shallow depth of field, landscape 3:2, high resolution. `
      + `No text, no watermarks, no extra logos. If the generator accepts a reference image, attach the Royal Crest crest so the blazer badge matches.`;
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
    const item = itemByKey(state.key);
    const isSeries = isFixed(item);
    const fmts = formatsFor(item);
    if (!fmts.includes(state.format)) state.format = fmts[0];

    const tl = $('#template-list');
    $('#template-note').hidden = !isSeries;
    $('#template-note').textContent = item.type === 'social' ? 'Social media posts have their own fixed design, made for the 4:5 feed (the Mandarin posts also come square).' : 'Series posters have their own fixed design from the school’s brief.';
    tl.replaceChildren(...Object.entries(F.TEMPLATES).map(([id, t]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'opt-card'; b.setAttribute('role', 'radio'); b.dataset.id = id;
      b.innerHTML = `<span class="swatch sw-${id}" aria-hidden="true"></span><span><strong>${t.label}</strong><small>${t.note}</small></span>`;
      radio(b, id === state.template && !isSeries);
      b.disabled = isSeries;
      b.onclick = () => { state.template = id; update(); };
      return b;
    }));

    const allowed = kindsFor(item);
    if (!allowed.includes(state.kind)) state.kind = allowed[0];
    const kl = $('#kind-list');
    kl.replaceChildren(...Object.entries(F.KINDS).filter(([id]) => allowed.includes(id) || (item.type === 'subject' && id !== 'series' && id !== 'social')).map(([id, k]) => {
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'chip'; b.setAttribute('role', 'radio'); b.textContent = k.short;
      b.disabled = !allowed.includes(id);
      if (b.disabled) b.title = 'Pick a molecule under Chemistry molecules';
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
      b.disabled = !fmts.includes(id);
      if (b.disabled) b.title = item.type === 'social' ? 'Social media posts are made for the portrait feed (4:5)' : 'This poster has too much on it for a square post';
      b.onclick = () => { state.format = id; update(); };
      return b;
    }));
    renderSubjects();
  }

  function renderSubjects() {
    const q = $('#subject-search').value.trim().toLowerCase();
    const groups = [['social', 'Social media posts', '#C9A227'], ['series', 'Clubs & sports posters', '#0A1F5C'], ...Object.entries(brand.departments).map(([k, d]) => [k, d.name, d.accent]), ['molecules', 'Chemistry molecules', '#d2ae4c']];
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
        b.onclick = () => {
          state.key = i.key;
          const kinds = kindsFor(i);
          if (!kinds.includes(state.kind)) state.kind = kinds[0];
          update();
        };
        grid.append(b);
      });
      wrap.append(grid);
      out.push(wrap);
    }
    if (!out.length) { const p = document.createElement('p'); p.className = 'subj-empty'; p.textContent = 'Nothing matches that search.'; out.push(p); }
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
    const designName = isFixed(item) ? (item.type === 'social' ? 'Post' : 'Poster') : F.TEMPLATES[state.template].label;
    $('#preview-title').textContent = `${item.label} · ${item.type === 'series' ? 'Series poster' : m.kindLabel} · ${designName}`;
    $('#preview-file').textContent = `${node.dataset.file}.png · ${Math.round(f.w * f.scale)} × ${Math.round(f.h * f.scale)} px`;
    $('#caption').value = F.caption(m);
    setEditable(node, key);
    $('#btn-reset-edit').hidden = !edits.has(key);
    renderPhotoPanel(node);
  }

  // ------------------------------------------------------------- photos panel
  function renderPhotoPanel(node) {
    const seen = new Map();
    node.querySelectorAll('[data-slot]').forEach((n) => { if (!seen.has(n.dataset.slot)) seen.set(n.dataset.slot, n.dataset.slotLabel); });
    const panel = $('#photo-panel');
    panel.hidden = !seen.size;
    $('#photo-list').replaceChildren(...[...seen].map(([tag, label]) => {
      const up = uploads.get(tag), lib = libraryPhotos[tag];
      const isAct = !!actById(tag);
      const status = up ? 'Your photo (saved in this browser)' : lib ? 'Photo from the project folder' : isAct ? 'No photo yet: showing an icon tile' : 'Using a school photo';
      const row = document.createElement('li');
      row.className = 'photo-row';
      const thumb = up || lib || (isAct ? '' : null);
      row.innerHTML = `
        <span class="photo-thumb">${thumb ? `<img src="${thumb}" alt="">` : `<span class="photo-icon">${isAct ? icons[actById(tag).icon] : ''}</span>`}</span>
        <span class="photo-meta"><strong>${label}</strong><small>${status}</small></span>
        <span class="photo-actions">
          <label class="btn btn-small">${up ? 'Replace' : 'Upload photo'}<input type="file" accept="image/*" class="sr-only" data-tag="${tag}"></label>
          ${up ? `<button type="button" class="btn btn-small" data-remove="${tag}">Remove</button>` : ''}
          ${isAct ? `<button type="button" class="btn btn-small" data-prompt="${tag}">Copy AI prompt</button>` : ''}
        </span>`;
      return row;
    }));
  }

  async function onPhotoChosen(input) {
    const file = input.files && input.files[0];
    if (!file) return;
    const tag = input.dataset.tag;
    try {
      const blob = await prepareImage(file);
      await DB.put(tag, blob);
      if (uploads.has(tag)) URL.revokeObjectURL(uploads.get(tag));
      uploads.set(tag, URL.createObjectURL(blob));
      toast('Photo added. It is used on every flyer for this item.');
      renderPreview();
    } catch (e) {
      console.error(e);
      toast('That file could not be read as an image. Try a JPG or PNG.');
    }
  }

  const EDITABLE = '.fl-title, .fl-subtitle, .fl-kicker, .fl-body, .fl-bullets li > span, .opt-text, .fl-rows dd, .fl-cta, .fl-listtitle, .ans-explain';
  /** Social posts have free-form markup: every element that holds text directly becomes one editable block. */
  function postTextBlocks(node) {
    const out = [];
    node.querySelectorAll('*').forEach((n) => {
      if (n.closest('svg') || out.some((o) => o.contains(n))) return;
      if ([...n.childNodes].some((c) => c.nodeType === Node.TEXT_NODE && c.textContent.trim())) out.push(n);
    });
    return out;
  }

  function setEditable(node, key) {
    $('#preview').classList.toggle('is-editing', state.editing);
    (node.classList.contains('ps') ? postTextBlocks(node) : node.querySelectorAll(EDITABLE)).forEach((n) => {
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
    const rows = [['file', 'item', 'flyer type', 'design', 'size']];
    try {
      for (let i = 0; i < jobs.length; i++) {
        const [item, kind, template, format] = jobs[i];
        text.textContent = `Rendering ${i + 1} of ${jobs.length}: ${item.label}, ${F.KINDS[kind].short}`;
        bar.style.width = `${(i / jobs.length) * 100}%`;
        const { blob, name } = await exportBlob(item, kind, template, format);
        const folder = item.type === 'series' ? `posters-${format}` : item.type === 'social' ? `social-posts-${format}` : `${template}-${format}`;
        const path = `${folder}/${name}`;
        zip.file(path, blob);
        captions.push(`=== ${path} ===\n${F.caption(model(item, kind))}\n`);
        rows.push([path, item.label, F.KINDS[kind].label, item.type === 'series' ? 'Poster' : item.type === 'social' ? 'Social post' : F.TEMPLATES[template].label, F.FORMATS[format].label]);
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
    return items.filter((item) => formatsFor(item).includes(format)).flatMap((item) => kindsFor(item).map((kind) => [item, kind, template, format]));
  }

  // ------------------------------------------------------------- gallery
  let galleryObserver;
  function renderGallery() {
    const jobs = allJobs(state.template, state.format);
    const f = F.FORMATS[state.format];
    $('#gallery-summary').textContent = `${jobs.length} flyers in ${F.TEMPLATES[state.template].label}, ${F.FORMATS[state.format].label.toLowerCase()}, including the series posters${state.format === 'portrait' ? ' and social media posts' : ''}. Click one to open it in the editor.`;
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

  async function copyText(text, okMsg, fallbackEl) {
    try { await navigator.clipboard.writeText(text); toast(okMsg); }
    catch { if (fallbackEl) { fallbackEl.value = text; fallbackEl.select(); } toast('Press Ctrl+C to copy the selected text'); }
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
    $('#btn-copy').onclick = () => copyText($('#caption').value, 'Caption copied', null);
    $('#photo-list').addEventListener('change', (e) => { if (e.target.matches('input[type=file]')) onPhotoChosen(e.target); });
    $('#photo-list').addEventListener('click', async (e) => {
      const rm = e.target.closest('[data-remove]');
      const pr = e.target.closest('[data-prompt]');
      if (rm) {
        const tag = rm.dataset.remove;
        await DB.del(tag);
        if (uploads.has(tag)) URL.revokeObjectURL(uploads.get(tag));
        uploads.delete(tag);
        toast('Photo removed');
        renderPreview();
      }
      if (pr) {
        const text = promptFor(pr.dataset.prompt);
        $('#prompt-box').hidden = false;
        $('#prompt-text').value = text;
        copyText(text, 'Prompt copied. Paste it into Gemini, ChatGPT or another image generator.', $('#prompt-text'));
      }
    });
    $('#btn-surprise').onclick = () => {
      const pool = items.filter((i) => !isFixed(i));
      const item = pool[Math.floor(Math.random() * pool.length)];
      const kinds = kindsFor(item);
      const tpls = Object.keys(F.TEMPLATES);
      state.key = item.key;
      state.kind = kinds[Math.floor(Math.random() * kinds.length)];
      state.template = tpls[Math.floor(Math.random() * tpls.length)];
      setView('editor'); update();
    };
    $('#btn-zip-all').onclick = () => downloadZip(allJobs(state.template, state.format), `royal-crest-flyers-${state.template}-${state.format}.zip`);
    $('#btn-zip-subject').onclick = () => {
      const item = itemByKey(state.key);
      const tpls = isFixed(item) ? [state.template] : Object.keys(F.TEMPLATES);
      const jobs = tpls.flatMap((t) => kindsFor(item).map((k) => [item, k, t, state.format]));
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
      return allJobs(template, format).map(([item, kind]) => ({ key: item.key, kind, label: item.label, series: isFixed(item) }));
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
    // a "Did you know?" flyer for any subject with a fact of your own (used for fact packs such as data/physics-facts.json)
    async mountFact(key, fact, template, format, n) {
      let stage = document.getElementById('batch-stage');
      if (!stage) { stage = document.createElement('div'); stage.id = 'batch-stage'; stage.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;background:#fff'; document.body.append(stage); }
      const base = itemByKey(key);
      const item = { ...base, data: { ...base.data, fact } };
      const { node, model: m } = await mount(stage, item, 'fact', template, format);
      node.dataset.file = `${base.key}-fact-${String(n || 1).padStart(2, '0')}-${template}-${format}`;
      return { file: node.dataset.file, caption: F.caption(m), fits: F.fitFlyer(node) };
    },
    promptFor,
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
