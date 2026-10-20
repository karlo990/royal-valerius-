/* Royal Crest · Control Room. Vanilla JS, no build step. Talks to /api/v1/admin/*. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const money = (n) => `US$${Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  const initials = (n) => String(n || '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const today = () => new Date().toISOString().slice(0, 10);
  const fmtDate = (iso, o = { day: 'numeric', month: 'short', year: 'numeric' }) => (iso ? new Date(iso.length === 10 ? iso + 'T00:00' : iso).toLocaleDateString('en-GB', o) : '—');
  const ago = (iso) => {
    if (!iso) return 'never';
    const s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return 'just now'; if (s < 3600) return `${Math.floor(s / 60)} min ago`; if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
    return fmtDate(iso);
  };
  const bytes = (n) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`);
  const FORMS = [1, 2, 3, 4, 5];

  /* ── icons ── */
  const P = {
    overview: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>', learners: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.5a3.5 3.5 0 0 1 0 7M18 14a6 6 0 0 1 3.5 6"/>',
    parents: '<path d="M12 21s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.6-7 10-7 10z"/>', registrations: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><path d="M14 3v6h6M9 14l2 2 4-4"/>',
    results: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>', attendance: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13"/>',
    timetable: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', homework: '<path d="M4 4h12l4 4v12H4z"/><path d="M8 12h8M8 16h5"/>',
    fees: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', notices: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    kudzi: '<rect x="4" y="7" width="16" height="12" rx="3"/><path d="M12 3v4M9 12h.01M15 12h.01M9 16h6"/>', memory: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>',
    backups: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>', people: '<path d="M2 12h3l3-8 4 16 3-8h7"/>',
    staff: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>', settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', down: '<path d="M12 4v12M6 10l6 6 6-6M4 20h16"/>', up: '<path d="M12 20V8M6 14l6-6 6 6M4 4h16"/>', eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    wa: '<path d="M20.5 11.6a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.5-4.7a8.5 8.5 0 1 1 16-4.2z"/>', check: '<path d="M5 12.5l4.5 4.5L19 7"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    login: '<path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/>', chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>', star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    cloud: '<path d="M17.5 19H7a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 11 4 4 0 0 1 17.5 19z"/>', key: '<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2L20 3M16 7l3 3"/>',
  };
  const ic = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[k] || P.overview}</svg>`;

  /* ── API ── */
  const KEY = 'rc_hub_staff';
  let token = null;
  try { token = sessionStorage.getItem(KEY); } catch (e) { token = null; }
  const saveToken = (t) => { token = t; try { t ? sessionStorage.setItem(KEY, t) : sessionStorage.removeItem(KEY); } catch (e) { /* private window */ } };
  async function api(method, path, body, { raw = false, type = 'application/json' } = {}) {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    let payload;
    if (body !== undefined) { headers['Content-Type'] = type; payload = type === 'application/json' ? JSON.stringify(body) : body; }
    const res = await fetch(`/api/v1/admin${path}`, { method, headers, body: payload });
    if (res.status === 401 && path !== '/login') { saveToken(null); showLogin('Your session ended. Please sign in again.'); throw new Error('Signed out'); }
    if (!res.ok) {
      let msg = res.statusText;
      try { const j = await res.json(); msg = typeof j.detail === 'string' ? j.detail : (j.detail || []).map((d) => `${(d.loc || []).slice(-1)[0]}: ${d.msg}`).join('; ') || msg; } catch (e) { /* not json */ }
      throw new Error(msg);
    }
    if (raw) return res;
    return res.status === 204 ? null : res.json();
  }
  const GET = (p) => api('GET', p), PUT = (p, b) => api('PUT', p, b), POST = (p, b) => api('POST', p, b), DEL = (p) => api('DELETE', p);
  async function download(path, fallbackName) {
    const res = await api('GET', path, undefined, { raw: true });
    const cd = res.headers.get('content-disposition') || '', m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const blob = await res.blob(), url = URL.createObjectURL(blob), a = document.createElement('a');
    a.href = url; a.download = m ? decodeURIComponent(m[1]) : fallbackName; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  /* ── UI helpers ── */
  function toast(msg, kind = '') {
    const t = document.createElement('div'); t.className = `toast ${kind}`; t.innerHTML = msg;
    $('#toasts').appendChild(t); setTimeout(() => { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(() => t.remove(), 300); }, kind === 'bad' ? 6500 : 4200);
  }
  const fail = (e) => toast(esc(e.message || e), 'bad');
  async function busy(btn, fn) {
    const old = btn && btn.innerHTML;
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span>'; }
    try { return await fn(); } catch (e) { fail(e); return undefined; } finally { if (btn) { btn.disabled = false; btn.innerHTML = old; } }
  }
  function closeLayers() { $$('.scrim, .drawer, .modal').forEach((x) => x.remove()); }
  function modal(title, bodyHtml, { ok = 'Save', okClass = 'primary', onOk, wide = false, cancel = 'Cancel' } = {}) {
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const m = document.createElement('div'); m.className = 'modal'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-label', title);
    if (wide) m.style.width = 'min(860px, calc(100% - 24px))';
    m.innerHTML = `<header><h2>${esc(title)}</h2><button class="btn ghost sm x" type="button" aria-label="Close">${ic('x')}</button></header><div class="body">${bodyHtml}</div>
      <footer>${cancel ? `<button class="btn" type="button" data-cancel>${esc(cancel)}</button>` : ''}${onOk ? `<button class="btn ${okClass}" type="button" data-ok>${esc(ok)}</button>` : ''}</footer>`;
    const close = () => { scrim.remove(); m.remove(); };
    scrim.onclick = close; $('.x', m).onclick = close; const c = $('[data-cancel]', m); if (c) c.onclick = close;
    if (onOk) $('[data-ok]', m).onclick = (e) => busy(e.currentTarget, async () => { if ((await onOk(m)) !== false) close(); });
    document.body.append(scrim, m);
    setTimeout(() => { const f = $('input, select, textarea', m); if (f) f.focus(); }, 30);
    return { el: m, close };
  }
  const confirmBox = (title, text, ok = 'Confirm', danger = true) => new Promise((resolve) => {
    const m = modal(title, `<p style="margin:0">${text}</p>`, { ok, okClass: danger ? 'danger' : 'primary', onOk: () => { resolve(true); } });
    $$('.x, [data-cancel]', m.el).forEach((b) => b.addEventListener('click', () => resolve(false)));
  });
  const field = (name, label, { type = 'text', value = '', options = null, hint = '', required = false, full = false, attrs = '' } = {}) => {
    const v = value ?? '';
    let input;
    if (options) input = `<select name="${name}" ${attrs}>${options.map((o) => { const [val, lab] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(lab)}</option>`; }).join('')}</select>`;
    else if (type === 'textarea') input = `<textarea name="${name}" ${attrs}>${esc(v)}</textarea>`;
    else if (type === 'checkbox') return `<label class="field ${full ? 'full' : ''}" style="display:flex;gap:10px;align-items:center"><input type="checkbox" name="${name}" ${v ? 'checked' : ''} ${attrs}> <span style="font-size:13.5px;color:var(--ink)">${esc(label)}</span></label>`;
    else input = `<input name="${name}" type="${type}" value="${esc(v)}" ${required ? 'required' : ''} ${attrs}>`;
    return `<label class="field ${full ? 'full' : ''}"><span>${esc(label)}${required ? ' *' : ''}</span>${input}${hint ? `<small>${hint}</small>` : ''}</label>`;
  };
  const readForm = (root) => {
    const o = {};
    $$('[name]', root).forEach((el) => { o[el.name] = el.type === 'checkbox' ? el.checked : el.type === 'number' ? (el.value === '' ? null : Number(el.value)) : el.value.trim(); });
    return o;
  };
  const nul = (o) => { Object.keys(o).forEach((k) => { if (o[k] === '') o[k] = null; }); return o; };
  const waLink = (phone, text) => `https://wa.me/${String(phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
  const tag = (s) => { const k = { active: 'ok', approved: 'ok', pending: 'warn', rejected: 'bad', left: '', suspended: 'bad', disabled: 'bad', present: 'ok', late: 'warn', absent: 'bad', excused: 'info' }[s] ?? ''; return `<span class="tag ${k}">${esc(s)}</span>`; };

  /* ── state ── */
  const S = { me: null, page: 'overview', counts: {}, classes: [], subjects: [], terms: [], learners: null, settings: null, stream: null, liveFeed: [] };
  const can = (perm) => !!S.me && (S.me.perms.includes('*') || S.me.perms.includes(perm) || S.me.perms.includes(perm.split(':')[0]));
  const PAGES = [
    ['School', [['overview', 'Overview', null], ['learners', 'Learners', 'learners:read'], ['parents', 'Families', 'parents:read'], ['registrations', 'Registrations', 'registrations']]],
    ['Teaching', [['results', 'Marks & terms', 'academics'], ['attendance', 'Register', 'attendance'], ['timetable', 'Timetable', 'timetable'], ['homework', 'Homework', 'assignments']]],
    ['Money & news', [['fees', 'Fees', 'fees'], ['notices', 'Notices', 'notices']]],
    ['Kudzi & memory', [['kudzi', 'Kudzi the Crestbot', 'kudzi'], ['memory', 'Memory', 'memory'], ['backups', 'Backups & sync', 'backups']]],
    ['Administration', [['people', 'Activity & sign-ins', 'audit'], ['staff', 'Staff accounts', 'staff'], ['settings', 'Settings', null]]],
  ];
  const TITLES = Object.fromEntries(PAGES.flatMap(([, ps]) => ps.map(([k, l]) => [k, l])));

  /* ── sign-in ── */
  async function showLogin(err) {
    stopLive();
    $('#shell').hidden = true; $('#login').hidden = false; closeLayers();
    $('#lg-err').textContent = err || '';
    try { const s = await fetch('/api/v1/admin/setup').then((r) => r.json()); $('#setup-note').hidden = s.ready; } catch (e) { /* offline */ }
    $('#login-form').onsubmit = async (e) => {
      e.preventDefault();
      const b = $('#login-form button[type=submit]'); b.disabled = true; b.textContent = 'Signing in…';
      try {
        const r = await api('POST', '/login', { username: $('#lg-user').value.trim(), password: $('#lg-pass').value });
        saveToken(r.token); $('#lg-pass').value = ''; boot();
      } catch (ex) { $('#lg-err').textContent = ex.message; } finally { b.disabled = false; b.textContent = 'Sign in'; }
    };
    setTimeout(() => $('#lg-pass').focus(), 50);
  }

  async function boot() {
    if (!token) return showLogin();
    try { S.me = await GET('/me'); } catch (e) { return undefined; }
    $('#login').hidden = true; $('#shell').hidden = false;
    $('#foot').innerHTML = `<b>${esc(S.me.name)}</b>${esc(S.me.role_label)} · <a href="#" id="signout" style="color:var(--gold-500)">Sign out</a>
      <div style="margin-top:8px"><a href="#" id="mypw" style="color:#8f98bc">Change my password</a></div>`;
    $('#signout').onclick = async (e) => { e.preventDefault(); try { await api('POST', '/logout'); } catch (x) { /* gone */ } saveToken(null); showLogin(); };
    $('#mypw').onclick = (e) => { e.preventDefault(); changeMyPassword(); };
    await refreshLookups();
    renderNav(); startLive(); route();
  }
  async function refreshLookups() {
    const [cls, subs, terms] = await Promise.all([GET('/classes'), GET('/subjects'), GET('/terms')]).catch(() => [[], [], []]);
    S.classes = cls; S.subjects = subs; S.terms = terms;
  }
  function renderNav() {
    $('#nav').innerHTML = PAGES.map(([g, ps]) => {
      const items = ps.filter(([, , p]) => !p || can(p));
      if (!items.length) return '';
      return `<div class="grp">${esc(g)}</div>` + items.map(([k, l]) => `<a href="#/${k}" data-k="${k}">${ic(k)}<span>${esc(l)}</span>${k === 'registrations' && S.counts.pending ? `<span class="count">${S.counts.pending}</span>` : ''}</a>`).join('');
    }).join('');
    $$('#nav a').forEach((a) => (a.dataset.k === S.page ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $$('#nav a').forEach((a) => a.addEventListener('click', () => $('#side').classList.remove('open')));
  }
  $('#menu-btn').onclick = () => $('#side').classList.toggle('open');

  /* ── live updates (server-sent events over fetch, so the token stays in a header) ── */
  let liveCtl = null, liveTimer = null;
  function setLive(on, text) { const l = $('#live'); l.classList.toggle('on', on); $('span', l).textContent = text; }
  function stopLive() { if (liveCtl) liveCtl.abort(); liveCtl = null; clearTimeout(liveTimer); }
  async function startLive() {
    stopLive(); liveCtl = new AbortController();
    try {
      const res = await fetch('/api/v1/admin/events', { headers: { Authorization: `Bearer ${token}` }, signal: liveCtl.signal });
      if (!res.ok) throw new Error(res.status);
      const reader = res.body.getReader(), dec = new TextDecoder(); let buf = '';
      setLive(true, 'Live');
      for (;;) {
        const { value, done } = await reader.read(); if (done) break;
        buf += dec.decode(value, { stream: true });
        let i;
        while ((i = buf.indexOf('\n\n')) >= 0) {
          const chunk = buf.slice(0, i); buf = buf.slice(i + 2);
          const ev = (chunk.match(/^event: (.+)$/m) || [])[1], data = (chunk.match(/^data: (.+)$/m) || [])[1];
          if (data) onEvent(ev || 'message', JSON.parse(data));
        }
      }
      throw new Error('closed');
    } catch (e) {
      if (liveCtl && liveCtl.signal.aborted) return;
      setLive(false, 'Reconnecting…'); liveTimer = setTimeout(startLive, 4000);
    }
  }
  let refreshT = null;
  function onEvent(kind, ev) {
    if (kind === 'hello') { S.liveFeed = ev.recent || []; if (S.page === 'overview') paintFeed(); return; }
    S.liveFeed.unshift(ev); S.liveFeed = S.liveFeed.slice(0, 60);
    if (ev.data_version) setLive(true, `Live · v${ev.data_version}`);
    if (S.page === 'overview') paintFeed(true);
    if (ev.type === 'registration' && /New registration/.test(ev.summary)) { toast(`${ic('registrations')}<div><b>New registration</b><br>${esc(ev.summary.replace('New registration: ', ''))}</div>`, 'ok'); bumpPending(); }
    if (ev.type === 'payment') toast(`${ic('fees')}<div>${esc(ev.summary)}</div>`, 'ok');
    if (ev.type === 'restore') toast(`${ic('backups')}<div>${esc(ev.summary)}</div>`, 'ok');
    if (S.page === 'overview') { clearTimeout(refreshT); refreshT = setTimeout(() => { if (S.page === 'overview') loadOverview(true); }, 1500); }
  }
  async function bumpPending() { try { const o = await GET('/overview'); S.counts.pending = o.counts.pending_registrations; renderNav(); } catch (e) { /* later */ } }

  /* ── router ── */
  function route() {
    if (!S.me) return;
    let k = (location.hash.replace(/^#\//, '').split('?')[0]) || 'overview';
    if (!VIEWS[k]) k = 'overview';
    S.page = k; renderNav();
    $('#title').textContent = TITLES[k] || 'Overview';
    $('#crumb').textContent = `Royal Crest Academy · ${S.me.role_label}`;
    document.title = `${TITLES[k]} · Control Room · Royal Crest Academy`;
    $('#view').innerHTML = '<div class="grid"><div class="skel s12"></div><div class="skel s4"></div><div class="skel s4"></div><div class="skel s4"></div></div>';
    closeLayers();
    Promise.resolve(VIEWS[k]()).catch(fail);
    $('#view').focus({ preventScroll: true }); scrollTo(0, 0);
  }
  window.addEventListener('hashchange', route);
  const V = (html) => { $('#view').innerHTML = html; };

  /* ── charts ── */
  function barsChart(series, { h = 170, color = 'var(--navy-700)', color2 = null, series2 = null, label = (n) => n } = {}) {
    const w = 640, pad = { l: 30, r: 8, t: 14, b: 26 }, iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    const top = Math.max(0, ...series.map((d) => d.n), ...(series2 || []).map((d) => d.n)), step = Math.max(1, Math.ceil(top / 4)), max = step * 4;
    const bw = iw / series.length, y = (v) => pad.t + ih - (v / max) * ih;
    const grid = [0, .25, .5, .75, 1].map((f) => `<line class="gl" x1="${pad.l}" x2="${w - pad.r}" y1="${y(max * f)}" y2="${y(max * f)}"/><text class="ax" x="${pad.l - 6}" y="${y(max * f) + 4}" text-anchor="end">${Math.round(max * f)}</text>`).join('');
    const bars = series.map((d, i) => {
      const x = pad.l + i * bw, w1 = series2 ? bw * .36 : bw * .62, off = series2 ? bw * .12 : bw * .19;
      const b1 = `<rect x="${x + off}" y="${y(d.n)}" width="${w1}" height="${pad.t + ih - y(d.n)}" rx="3" fill="${color}"><title>${esc(fmtDate(d.date, { day: 'numeric', month: 'short' }))}: ${label(d.n)}</title></rect>`;
      const d2 = series2 && series2[i];
      const b2 = d2 ? `<rect x="${x + off + w1 + 2}" y="${y(d2.n)}" width="${w1}" height="${pad.t + ih - y(d2.n)}" rx="3" fill="${color2}"><title>${label(d2.n)}</title></rect>` : '';
      const lab = i % 2 === 0 ? `<text class="ax" x="${x + bw / 2}" y="${h - 8}" text-anchor="middle">${new Date(d.date + 'T00:00').getDate()}</text>` : '';
      return b1 + b2 + lab;
    }).join('');
    return `<svg class="chart" viewBox="0 0 ${w} ${h}" role="img">${grid}${bars}</svg>`;
  }

  /* ════════════════════════ OVERVIEW ════════════════════════ */
  const FEED_IC = { login: 'login', login_failed: 'x', registration: 'registrations', payment: 'fees', chat: 'chat', backup: 'backups', restore: 'backups', notice: 'notices', results: 'results', attendance: 'attendance', learner: 'learners', parent: 'parents', staff: 'staff', system: 'settings', memory: 'memory', homework: 'homework', award: 'star' };
  function paintFeed(flash) {
    const ul = $('#feed'); if (!ul) return;
    ul.innerHTML = S.liveFeed.slice(0, 40).map((e, i) => `<li class="${flash && i === 0 ? 'new' : ''}"><span class="dot ${esc(e.type)}">${ic(FEED_IC[e.type] || 'people')}</span><span>${esc(e.summary || e.type)}</span><span class="t">${ago(e.at)}</span></li>`).join('')
      || '<li class="muted" style="display:block">Waiting for activity. Sign-ins, registrations, payments and Kudzi chats appear here the moment they happen.</li>';
  }
  async function loadOverview(soft) {
    const o = await GET('/overview');
    S.counts.pending = o.counts.pending_registrations; renderNav();
    if (S.page !== 'overview') return;
    const c = o.counts, f = o.fees, on = o.online, att = o.attendance_today, attN = Object.values(att).reduce((a, b) => a + b, 0);
    const presentPct = attN ? Math.round(((att.present || 0) + (att.late || 0)) * 100 / attN) : null;
    const collected = f.invoiced ? Math.round(f.paid * 100 / f.invoiced) : 0;
    const hour = new Date().getHours(), greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const b = o.backup, maxForm = Math.max(1, ...o.by_form.map((x) => x.paid + x.outstanding));
    const kpi = (lbl, icon, val, sub, href, meter) => `<div class="card s3 kpi ${href ? 'link' : ''}" ${href ? `data-go="${href}"` : ''}><div class="lbl">${ic(icon)}${lbl}</div><div class="val num">${val}</div><div class="sub">${sub}</div>${meter != null ? `<div class="meter"><i style="width:${meter}%"></i></div>` : ''}</div>`;
    V(`<div class="grid">
      <div class="s12" style="display:flex;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:2px">
        <div><p class="eyebrow" style="margin:0">${esc(fmtDate(today(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }))}${o.term ? ` · ${esc(o.term.label)}` : ''}</p>
        <h2 style="font-size:32px">${greet}${S.me.username === 'admin' ? '' : `, ${esc(S.me.name.split(' ')[0])}`}.</h2></div>
        <div class="spacer" style="flex:1"></div>
        <div class="split">${can('learners') ? `<a class="btn" href="#/learners?new=1">${ic('plus')}Add learner</a>` : ''}${can('fees') ? `<a class="btn" href="#/fees?pay=1">${ic('fees')}Record payment</a>` : ''}${can('notices') ? `<a class="btn" href="#/notices">${ic('notices')}Post notice</a>` : ''}${can('backups') ? `<button class="btn gold" id="ov-zip" type="button">${ic('down')}Download everything</button>` : ''}</div>
      </div>
      ${c.demo_learners ? `<div class="s12 notice info">Demo learners are loaded (${c.demo_learners}). Try the portal with admission number <code>RCA-27-0142</code> and phone <code>0771234567</code>. Remove them in <a href="#/settings">Settings</a> before real learners go in.</div>` : ''}
      ${!b.cloud_enabled && !b.persistent_disk ? `<div class="s12 notice">This Space has no permanent disk and cloud backup is off, so a restart wipes the data unless the school PC agent restores it. Add <code>HF_TOKEN</code> and <code>HF_BACKUP_REPO</code> secrets (see <a href="#/backups">Backups & sync</a>).</div>` : ''}
      ${kpi('Learners', 'learners', c.learners, `${o.by_form.map((x) => `F${x.form}: ${x.learners}`).join(' · ') || 'none yet'}`, '#/learners')}
      ${kpi('Families', 'parents', c.parents, `${c.parents_active_30d} signed in this month`, '#/parents')}
      ${kpi('Registrations', 'registrations', c.pending_registrations, c.pending_registrations ? 'waiting for approval' : 'all caught up', '#/registrations')}
      ${kpi('Online now', 'people', (on.parent || 0) + (on.learner || 0) + (on.staff || 0), `${on.parent || 0} parents · ${on.learner || 0} learners · ${on.staff || 0} staff`, can('audit') ? '#/people' : null)}
      ${kpi('Fees collected', 'fees', `${collected}<small>%</small>`, `${money(f.paid)} of ${money(f.invoiced)} · ${money(f.outstanding)} owing`, can('fees') ? '#/fees' : null, collected)}
      ${kpi('Register today', 'attendance', presentPct == null ? '—' : `${presentPct}<small>%</small>`, attN ? `${att.absent || 0} absent · ${att.late || 0} late` : 'not marked yet', can('attendance') ? '#/attendance' : null, presentPct)}
      ${kpi('Kudzi today', 'kudzi', c.chats_today, `${c.chats_helpful} 👍 · ${c.chats_unhelpful} 👎 all time`, can('kudzi') ? '#/kudzi' : null)}
      ${kpi('Data version', 'memory', `v${b.data_version}`, `last change ${ago(b.last_change_at)}`, can('backups') ? '#/backups' : null)}
      <section class="card s7"><div class="card-h"><h2>Sign-ins and Kudzi chats</h2><span class="r muted">last 14 days</span></div>
        ${barsChart(o.series.logins, { series2: o.series.chats, color: 'var(--navy-700)', color2: 'var(--gold-500)' })}
        <div class="legend"><span><i style="background:var(--navy-700)"></i>Portal sign-ins</span><span><i style="background:var(--gold-500)"></i>Kudzi chats</span></div></section>
      <section class="card s5"><div class="card-h"><h2>Live activity</h2><span class="r"><span class="tag ok">● streaming</span></span></div><ul class="feed" id="feed"></ul></section>
      <section class="card s7"><div class="card-h"><h2>Fees by form</h2><span class="r muted">${o.term ? esc(o.term.label) : 'no current term'}</span></div>
        ${o.by_form.map((x) => `<div class="hbar"><b>Form ${x.form}</b><span class="tr"><i style="width:${x.paid / maxForm * 100}%;background:var(--ok)"></i><i style="width:${x.outstanding / maxForm * 100}%;background:#f0b8b2"></i></span><span class="v num muted">${money(x.paid)} · <span style="color:var(--bad)">${money(x.outstanding)}</span></span></div>`).join('') || '<p class="muted">No learners yet.</p>'}
        <div class="legend"><span><i style="background:var(--ok)"></i>Paid</span><span><i style="background:#f0b8b2"></i>Owing</span></div>
        <hr class="sep">${barsChart(o.series.payments, { h: 120, color: 'var(--ok)', label: (n) => money(n) })}<p class="hint" style="margin:4px 0 0">Payments received per day, last 14 days.</p></section>
      <section class="card s5"><div class="card-h"><h2>Memory & backups</h2><span class="r"><a href="#/backups">Open →</a></span></div>
        <ul class="checks">
          <li><span class="ic ${b.last_local ? 'y' : 'n'}">${b.last_local ? '✓' : '!'}</span><div><b>On the Space</b><br><span class="muted">${b.last_local ? `${esc(b.last_local.name)} · ${ago(b.last_local.at)}` : 'no backup yet'} · ${b.local_count} kept</span></div></li>
          <li><span class="ic ${b.cloud_enabled && !b.cloud_error ? 'y' : 'n'}">${b.cloud_enabled && !b.cloud_error ? '✓' : '!'}</span><div><b>Cloud (Hugging Face dataset)</b><br><span class="muted">${b.cloud_enabled ? (b.last_cloud ? `v${b.last_cloud.data_version} · ${ago(b.last_cloud.at)}` : 'waiting for the first push') : 'off: add HF_TOKEN and HF_BACKUP_REPO'}${b.cloud_error ? ` · <span style="color:var(--bad)">last error ${esc(b.cloud_error.slice(0, 80))}</span>` : ''}</span></div></li>
          <li><span class="ic ${b.sync_key_set ? 'y' : 'n'}">${b.sync_key_set ? '✓' : '!'}</span><div><b>School PC + Google Drive</b><br><span class="muted">${b.sync_key_set ? 'agent key set: run karlissa_sync.py on the PC' : 'add a SYNC_KEY secret for the PC agent'}</span></div></li>
        </ul>
        <hr class="sep"><div class="kv" style="grid-template-columns:120px 1fr;font-size:12.5px"><dt>Instance</dt><dd><code>${esc((b.instance_id || '').slice(0, 12))}</code></dd><dt>Database</dt><dd>${bytes(b.db_bytes)} · ${b.persistent_disk ? 'permanent disk' : 'temporary disk'}</dd>
        <dt>Kudzi AI</dt><dd>${o.system.kudzi_ai === 'ollama' ? `on (${esc(o.system.kudzi_model)})` : 'rules + FAQs (AI off)'}</dd><dt>Uptime</dt><dd>${Math.round(o.system.uptime_s / 60)} min · hub ${esc(o.system.version)}</dd></div></section>
      <section class="card s12"><div class="card-h"><h2>Recent changes</h2><span class="r">${can('audit') ? '<a href="#/people">Full log →</a>' : ''}</span></div>
        <div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>Who</th><th>What</th><th>Item</th></tr></thead><tbody>
        ${o.recent.slice(0, 12).map((r) => `<tr><td class="muted" title="${esc(r.at)}">${ago(r.at)}</td><td>${esc(r.actor)}</td><td><code>${esc(r.action)}</code></td><td>${esc(r.target)} <span class="muted">${esc(String(r.detail || '').slice(0, 80))}</span></td></tr>`).join('')}
        </tbody></table></div></section>
    </div>`);
    paintFeed();
    $$('[data-go]').forEach((el) => (el.onclick = () => (location.hash = el.dataset.go)));
    const z = $('#ov-zip'); if (z) z.onclick = () => busy(z, () => download('/backup/export', 'royal-crest-backup.zip'));
    if (!soft) setLive(true, `Live · v${b.data_version}`);
  }

  /* ════════════════════════ LEARNERS ════════════════════════ */
  const learnerForm = (L = {}) => `<div class="form-grid">
    ${field('first', 'First name', { value: L.first, required: true })}${field('last', 'Surname', { value: L.last })}
    ${field('id', 'Admission number', { value: L.id, hint: L.id ? 'Changing it updates every record.' : 'Leave empty to generate the next number.' })}
    ${field('form', 'Form', { value: L.form || 1, options: FORMS.map((f) => [f, `Form ${f}`]) })}
    ${field('stream', 'Class / stream', { value: L.stream, hint: 'e.g. 1 Blue', attrs: 'list="dl-streams"' })}${field('house', 'House', { value: L.house })}
    ${field('residence', 'Residence', { value: L.residence || 'Boarder', options: ['Boarder', 'Day scholar'] })}${field('hostel', 'Hostel', { value: L.hostel, hint: 'Block A, Block B…' })}
    ${field('class_teacher', 'Class teacher', { value: L.class_teacher })}${field('gender', 'Gender', { value: L.gender || '', options: [['', '—'], 'Female', 'Male'] })}
    ${field('dob', 'Date of birth', { type: 'date', value: L.dob })}${field('status', 'Status', { value: L.status || 'active', options: [['active', 'Active'], ['suspended', 'Suspended'], ['left', 'Left the school']] })}
    ${field('notes', 'Private notes (staff only)', { type: 'textarea', value: L.notes, full: true })}
    ${L.id ? '' : `<div class="full"><hr class="sep"><p class="eyebrow">Parent or guardian (optional)</p></div>
      ${field('parent_name', 'Parent name')}${field('parent_phone', 'Parent phone', { type: 'tel', hint: 'This is their portal password.' })}
      ${field('parent_email', 'Parent email', { type: 'email' })}${field('relationship', 'Relationship', { options: ['Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Sponsor'] })}`}
    <datalist id="dl-streams">${S.classes.map((c) => `<option value="${esc(c.stream)}">`).join('')}</datalist></div>`;

  async function viewLearners() {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const st = { q: '', form: 0, status: 'active' };
    V(`<div class="toolbar">
        <input type="search" id="lq" placeholder="Search name, admission no. or parent phone…" aria-label="Search learners">
        <div class="chips" id="lf"><button aria-pressed="true" data-f="0">All</button>${FORMS.map((f) => `<button aria-pressed="false" data-f="${f}">F${f}</button>`).join('')}</div>
        <select id="ls"><option value="active">Active</option><option value="left">Left</option><option value="suspended">Suspended</option><option value="all">All</option></select>
        <span class="grow"></span>
        ${can('learners') ? `<button class="btn" id="limp" type="button">${ic('up')}Import CSV</button>` : ''}
        ${can('backups') ? `<button class="btn" id="lexp" type="button">${ic('down')}Export</button>` : ''}
        ${can('learners') ? `<button class="btn primary" id="ladd" type="button">${ic('plus')}Add learner</button>` : ''}
      </div><div id="ltab"></div>`);
    const load = async () => {
      const rows = await GET(`/learners?status=${st.status}${st.form ? `&form=${st.form}` : ''}${st.q ? `&q=${encodeURIComponent(st.q)}` : ''}`);
      $('#ltab').innerHTML = rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Learner</th><th>Class</th><th>Residence</th><th>Family</th>${can('fees') ? '<th class="r">Balance</th>' : ''}<th>Portal</th></tr></thead><tbody>
        ${rows.map((r) => `<tr class="click" data-id="${esc(r.id)}"><td><div class="who"><span class="av">${initials(`${r.first} ${r.last}`)}</span><div><b>${esc(r.first)} ${esc(r.last)} ${r.demo ? '<span class="tag gold">demo</span>' : ''}</b><small>${esc(r.id)}</small></div></div></td>
          <td>Form ${r.form}${r.stream ? ` · ${esc(r.stream)}` : ''}${r.house ? `<br><small class="muted">${esc(r.house)} House</small>` : ''}</td><td>${esc(r.residence || '—')}</td>
          <td>${r.guardians ? `${r.guardians} linked` : '<span class="tag warn">no parent</span>'}</td>
          ${can('fees') ? `<td class="r num">${r.balance > 0 ? `<b style="color:var(--bad)">${money(r.balance)}</b>` : '<span class="tag ok">paid</span>'}</td>` : ''}
          <td class="muted">${r.status !== 'active' ? tag(r.status) : ago(r.last_login)}</td></tr>`).join('')}</tbody></table></div>
        <p class="hint">${rows.length} learner${rows.length === 1 ? '' : 's'}. Click a row for the full record.</p>`
        : `<div class="card empty"><b>No learners here yet</b>Add one, or import the class list from Excel (save it as CSV).</div>`;
      $$('#ltab tr.click').forEach((tr) => (tr.onclick = () => learnerDrawer(tr.dataset.id)));
    };
    let t = null; $('#lq').oninput = (e) => { st.q = e.target.value.trim(); clearTimeout(t); t = setTimeout(load, 220); };
    $$('#lf button').forEach((b) => (b.onclick = () => { st.form = Number(b.dataset.f); $$('#lf button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); load(); }));
    $('#ls').onchange = (e) => { st.status = e.target.value; load(); };
    if ($('#ladd')) $('#ladd').onclick = () => addLearner(load);
    if ($('#limp')) $('#limp').onclick = () => importLearners(load);
    if ($('#lexp')) $('#lexp').onclick = (e) => busy(e.currentTarget, () => download('/export/learners.csv', 'learners.csv'));
    await load();
    if (q.get('new') && can('learners')) addLearner(load);
    if (q.get('id')) learnerDrawer(q.get('id'));
  }
  function addLearner(after) {
    modal('Add a learner', learnerForm(), { ok: 'Add learner', wide: true, onOk: async (m) => {
      const b = nul(readForm(m.el));
      const L = await POST('/learners', b);
      toast(`<div><b>${esc(L.first)} ${esc(L.last)}</b> added as ${esc(L.id)}.</div>`, 'ok');
      await refreshLookups(); after && after(); learnerDrawer(L.id);
    } });
  }
  function importLearners(after) {
    const m = modal('Import learners from a spreadsheet', `<p class="muted" style="margin-top:0">In Excel or Google Sheets, save the class list as <b>CSV</b>. The first row must be headings. Recognised headings:</p>
      <p><code>admission_no</code> <code>first_name</code> <code>surname</code> <code>form</code> <code>stream</code> <code>house</code> <code>residence</code> <code>hostel</code> <code>parent_name</code> <code>parent_phone</code> <code>parent_email</code> <code>relationship</code></p>
      <p class="hint">Existing admission numbers are updated. Parents are matched by phone number and linked automatically. Their phone number is their portal password.</p>
      <label class="field"><span>CSV file</span><input type="file" id="imp-file" accept=".csv,text/csv"></label>
      <label class="field"><span>…or paste the rows</span><textarea id="imp-text" placeholder="admission_no,first_name,surname,form,stream,parent_name,parent_phone"></textarea></label><div id="imp-out"></div>`,
    { ok: 'Import', onOk: async (mm) => {
      const f = $('#imp-file', mm.el).files[0], text = f ? await f.text() : $('#imp-text', mm.el).value;
      if (!text.trim()) throw new Error('Choose a CSV file or paste the rows first.');
      const r = await api('POST', '/import/learners', text, { type: 'text/csv' });
      $('#imp-out', mm.el).innerHTML = `<div class="notice ok">${r.created} added · ${r.updated} updated · ${r.parents} new parents · ${r.links} links</div>${r.errors.length ? `<div class="notice" style="margin-top:8px">${r.errors.map(esc).join('<br>')}</div>` : ''}`;
      await refreshLookups(); after && after();
      return r.errors.length ? false : undefined;
    } });
    return m;
  }

  async function learnerDrawer(id, tab = 'profile') {
    closeLayers();
    const L = await GET(`/learners/${encodeURIComponent(id)}`);
    const scrim = document.createElement('div'); scrim.className = 'scrim';
    const d = document.createElement('aside'); d.className = 'drawer'; d.setAttribute('role', 'dialog');
    const tabs = [['profile', 'Profile'], ['family', `Family (${L.guardians.length})`], ['marks', 'Marks'], ...(can('fees') ? [['fees', 'Fees']] : []), ['attendance', 'Register'], ['skills', 'Skills'], ['kudzi', 'Kudzi']];
    d.innerHTML = `<header><span class="av">${initials(`${L.first} ${L.last}`)}</span><div><h2>${esc(L.first)} ${esc(L.last)}</h2><div class="muted" style="font-size:13px">${esc(L.id)} · Form ${L.form}${L.stream ? ` · ${esc(L.stream)}` : ''} · ${esc(L.residence || '')} ${L.status !== 'active' ? tag(L.status) : ''}</div></div>
      <div class="acts"><button class="btn sm" data-a="preview" type="button">${ic('eye')}Open in portal</button><button class="btn ghost sm" data-a="close" type="button" aria-label="Close">${ic('x')}</button></div></header>
      <div class="tabs" role="tablist">${tabs.map(([k, l]) => `<button role="tab" data-t="${k}" aria-selected="${k === tab}">${esc(l)}</button>`).join('')}</div><div class="body" id="dbody"></div>`;
    const close = () => { scrim.remove(); d.remove(); };
    scrim.onclick = close; $('[data-a=close]', d).onclick = close;
    $('[data-a=preview]', d).onclick = (e) => busy(e.currentTarget, async () => {
      const r = await POST(`/learners/${encodeURIComponent(L.id)}/preview`);
      window.open(`${r.portal_url}?api=${encodeURIComponent(location.origin)}#session=${encodeURIComponent(r.token)}`, '_blank', 'noopener');
    });
    document.body.append(scrim, d);
    const reload = () => learnerDrawer(L.id, $('[aria-selected=true]', d).dataset.t);
    const s = L.summary;
    const T = {
      profile: () => `<div class="grid">
          <div class="card s4 kpi"><div class="lbl">${ic('star')}Level</div><div class="val">${s.level}</div><div class="sub">${s.xp.toLocaleString()} XP · ${s.merits} merits · ${s.demerits} demerits</div></div>
          <div class="card s4 kpi"><div class="lbl">${ic('results')}Position</div><div class="val">${esc(s.position)}<small>/ ${s.class_size}</small></div><div class="sub">${esc(s.stream)}</div></div>
          <div class="card s4 kpi"><div class="lbl">${ic('fees')}Balance</div><div class="val" style="${L.fees.balance > 0 ? 'color:var(--bad)' : ''}">${money(L.fees.balance)}</div><div class="sub">${esc(L.fees.term)}</div></div>
          <section class="card s12">${can('learners') ? `<form id="lform">${learnerForm(L)}</form><div class="split"><button class="btn primary" id="lsave" type="button">Save changes</button>
            <button class="btn" id="laward" type="button">${ic('star')}Award merit / XP</button><button class="btn" id="lreset" type="button">${ic('key')}Reset password</button>
            <span style="flex:1"></span><button class="btn danger" id="lleft" type="button">${L.status === 'active' ? 'Mark as left' : 'Delete permanently'}</button></div>
            <p class="hint">Password: ${L.own_password ? 'the learner set their own.' : 'admission number + a parent’s phone number.'}</p>`
            : `<dl class="kv"><dt>House</dt><dd>${esc(L.house || '—')}</dd><dt>Hostel</dt><dd>${esc(L.hostel || '—')}</dd><dt>Class teacher</dt><dd>${esc(L.class_teacher || '—')}</dd></dl>`}</section></div>`,
      family: () => `${L.guardians.map((g) => `<div class="card" style="margin-bottom:12px"><div class="who"><span class="av">${initials(g.name)}</span><div><b>${esc(g.name)}</b><small>${esc(g.relationship || 'Parent')} · ${esc(g.phone_pretty)}${g.email ? ` · ${esc(g.email)}` : ''}</small></div>
          <div class="row-acts" style="margin-left:auto"><a class="btn sm" target="_blank" rel="noopener" href="${waLink(g.phone, `Hello ${g.name}, this is Royal Crest Academy. You can follow ${L.first}'s progress on Crest Quest: https://royalcrestzw.vercel.app/portal/ — sign in with admission number ${L.id} and your phone number.`)}">${ic('wa')}WhatsApp sign-in details</a>
          <a class="btn sm" href="tel:+${esc(g.phone)}">Call</a></div></div><p class="hint" style="margin:10px 0 0">Last portal sign-in: ${ago(g.last_login)} · password: ${g.own_password ? 'their own' : 'their phone number'} · ${tag(g.status)}</p></div>`).join('') || '<div class="notice">No parent linked yet, so nobody can sign in for this learner.</div>'}
        ${can('learners') ? `<section class="card" style="margin-top:14px"><h2>Link a parent</h2><form id="pform" class="form-grid">${field('parent_name', 'Name', { required: true })}${field('parent_phone', 'Phone', { type: 'tel', required: true, hint: 'Existing parents with this number are linked, not duplicated.' })}${field('parent_email', 'Email', { type: 'email' })}${field('relationship', 'Relationship', { options: ['Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Sponsor'] })}</form><button class="btn primary" id="plink" type="button">Link parent</button></section>` : ''}`,
      marks: () => {
        const by = {}; L.results.forEach((r) => { (by[r.term_id] = by[r.term_id] || { label: r.label, published: r.published, rows: [] }).rows.push(r); });
        return Object.entries(by).reverse().map(([tid, t]) => `<section class="card" style="margin-bottom:14px"><div class="card-h"><h2>${esc(t.label)}</h2><span class="r">${t.published ? '<span class="tag ok">published</span>' : '<span class="tag warn">not published</span>'}${can('academics') ? `<a class="btn sm" href="#/results?term=${encodeURIComponent(tid)}">Edit marks</a>` : ''}</span></div>
          <div class="table-wrap"><table class="t"><thead><tr><th>Subject</th><th class="r">CA /40</th><th class="r">Exam /60</th><th class="r">Total</th><th>Grade</th><th>Comment</th></tr></thead><tbody>
          ${t.rows.map((r) => { const tot = Math.round(Math.min(100, (r.ca || 0) + (r.exam || 0))), g = tot >= 75 ? 'A' : tot >= 65 ? 'B' : tot >= 50 ? 'C' : tot >= 45 ? 'D' : tot >= 40 ? 'E' : 'U'; return `<tr><td>${esc(r.name || r.code)}</td><td class="r num">${r.ca ?? '—'}</td><td class="r num">${r.exam ?? '—'}</td><td class="r num"><b>${tot}</b></td><td><span class="grade ${g}">${g}</span></td><td class="muted">${esc(r.comment || '')}</td></tr>`; }).join('')}
          </tbody></table></div></section>`).join('') || '<div class="card empty"><b>No marks yet</b>Enter marks under Marks &amp; terms.</div>';
      },
      fees: () => `<div class="grid"><section class="card s6"><h2>${esc(L.fees.term)}</h2><table class="t">${L.fees.lines.map(([k, v]) => `<tr><td>${esc(k)}</td><td class="r num">${money(v)}</td></tr>`).join('')}
          <tr><td><b>Invoiced</b></td><td class="r num"><b>${money(L.fees.invoiced)}</b></td></tr><tr><td>Paid</td><td class="r num">${money(L.fees.paid)}</td></tr><tr><td><b>Balance</b></td><td class="r num"><b style="${L.fees.balance > 0 ? 'color:var(--bad)' : ''}">${money(L.fees.balance)}</b></td></tr></table></section>
          <section class="card s6"><h2>Record a payment</h2><form id="payf">${field('amount', 'Amount (US$)', { type: 'number', required: true, attrs: 'step="0.01" min="0.01"', value: L.fees.balance || '' })}${field('method', 'Method', { options: ['Cash', 'EcoCash', 'InnBucks', 'OneMoney', 'Bank transfer', 'Swipe / card', 'Mukuru'] })}${field('date', 'Date', { type: 'date', value: today() })}${field('ref', 'Receipt no.', { hint: 'Leave empty to number it automatically.' })}</form>
          <button class="btn primary" id="paybtn" type="button">Record payment</button></section>
          <section class="card s12"><h2>Payments</h2>${L.payments.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Receipt</th><th>Method</th><th class="r">Amount</th><th>By</th><th></th></tr></thead><tbody>${L.payments.map((p) => `<tr><td>${fmtDate(p.date)}</td><td><code>${esc(p.ref)}</code></td><td>${esc(p.method)}</td><td class="r num">${money(p.amount)}</td><td class="muted">${esc(p.recorded_by || '')}</td><td class="r"><button class="btn sm danger" data-del="${p.id}" type="button">Remove</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No payments recorded.</p>'}</section></div>`,
      attendance: () => { const n = (k) => L.attendance.filter((a) => a.status === k).length; return `<div class="split" style="margin-bottom:14px">${['present', 'late', 'absent', 'excused'].map((k) => `<span class="tag ${{ present: 'ok', late: 'warn', absent: 'bad', excused: 'info' }[k]}">${n(k)} ${k}</span>`).join('')}<span class="hint">last 60 register entries</span></div>
          <div class="table-wrap"><table class="t"><tbody>${L.attendance.map((a) => `<tr><td>${fmtDate(a.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>${tag(a.status)}</td><td class="muted">${esc(a.note || '')}</td></tr>`).join('') || '<tr><td class="muted">No register entries yet.</td></tr>'}</tbody></table></div>`; },
      skills: () => `<section class="card"><h2>Skill tree · one trade a year</h2><div class="table-wrap"><table class="t"><thead><tr><th>Form</th><th>Trade</th><th>Status</th><th>Progress</th><th>Badge</th></tr></thead><tbody>
          ${L.skills.map((k) => `<tr data-form="${k.form}"><td>F${k.form}</td><td><input name="trade" value="${esc(k.trade)}"></td><td><select name="status">${['locked', 'active', 'done'].map((x) => `<option ${x === k.status ? 'selected' : ''}>${x}</option>`).join('')}</select></td>
          <td><input name="progress" type="number" min="0" max="100" value="${Math.round((k.progress || 0) * 100)}" style="width:80px"> %</td><td><input name="badge" value="${esc(k.badge || '')}"></td></tr>`).join('')}</tbody></table></div>
          ${can('academics') ? '<button class="btn primary" id="sksave" type="button" style="margin-top:12px">Save skill tree</button>' : ''}</section>`,
      kudzi: () => `<section class="card"><h2>Recent questions about ${esc(L.first)}</h2>${L.chats.map((c) => `<div class="chat"><span class="q">${esc(c.message)} <span class="tag">${esc(c.kind)}</span> <span class="tag ${c.source === 'fallback' ? 'warn' : 'info'}">${esc(c.source)}</span></span><span class="a">${esc(c.reply)}</span><span class="faint" style="font-size:11.5px">${ago(c.at)}${c.helpful === 1 ? ' · 👍' : c.helpful === 0 ? ' · 👎' : ''}</span></div>`).join('') || '<p class="muted">No chats yet.</p>'}</section>`,
    };
    const show = (k) => {
      $$('.tabs button', d).forEach((b) => b.setAttribute('aria-selected', String(b.dataset.t === k)));
      $('#dbody').innerHTML = T[k]();
      const on = (sel, fn) => { const el = $(sel, d); if (el) el.onclick = (e) => busy(e.currentTarget, fn); };
      on('#lsave', async () => { const b = nul(readForm($('#lform'))); await PUT(`/learners/${encodeURIComponent(L.id)}`, b); toast('Saved.', 'ok'); await refreshLookups(); learnerDrawer(b.id || L.id); });
      on('#lreset', async () => { const r = await POST(`/learners/${encodeURIComponent(L.id)}/reset-password`); toast(esc(r.message), 'ok'); });
      on('#lleft', async () => {
        const hard = L.status !== 'active';
        if (!(await confirmBox(hard ? 'Delete permanently?' : 'Mark as left?', hard ? `This removes all of ${esc(L.first)}'s records. A backup is kept, but this cannot be undone here.` : `${esc(L.first)} will no longer appear in classes or be able to sign in. Records are kept.`, hard ? 'Delete' : 'Mark as left'))) return;
        await DEL(`/learners/${encodeURIComponent(L.id)}${hard ? '?hard=true' : ''}`); close(); route();
      });
      on('#laward', async () => modal('Award merit or XP', `${field('merits', 'Merits', { type: 'number', value: 1, hint: 'Each merit also adds 50 XP.' })}${field('xp', 'Extra XP', { type: 'number', value: 0 })}${field('demerits', 'Demerits', { type: 'number', value: 0 })}${field('reason', 'Reason (shown to the family)', { value: 'Excellent effort in class' })}`,
        { ok: 'Award', onOk: async (m) => { await POST(`/learners/${encodeURIComponent(L.id)}/award`, readForm(m.el)); toast('Awarded. The family sees it on the portal.', 'ok'); reload(); } }));
      on('#plink', async () => { const b = readForm($('#pform')); if (!b.parent_phone) throw new Error('Enter a phone number.'); await PUT(`/learners/${encodeURIComponent(L.id)}`, { ...nul({ id: L.id, first: L.first, last: L.last, form: L.form, stream: L.stream, house: L.house, residence: L.residence, hostel: L.hostel, class_teacher: L.class_teacher, gender: L.gender, dob: L.dob, status: L.status, notes: L.notes }), ...b }); toast('Parent linked.', 'ok'); learnerDrawer(L.id, 'family'); });
      on('#paybtn', async () => { const b = nul(readForm($('#payf'))); const r = await POST('/payments', { ...b, learner_id: L.id }); toast(`Payment recorded · receipt <b>${esc(r.ref)}</b>`, 'ok'); learnerDrawer(L.id, 'fees'); });
      $$('[data-del]', d).forEach((b) => (b.onclick = async () => { if (await confirmBox('Remove this payment?', 'The balance goes back up. The removal is logged.', 'Remove')) { await DEL(`/payments/${b.dataset.del}`).catch(fail); learnerDrawer(L.id, 'fees'); } }));
      on('#sksave', async () => { const body = $$('tr[data-form]', d).map((tr) => ({ form: Number(tr.dataset.form), trade: $('[name=trade]', tr).value, status: $('[name=status]', tr).value, progress: Math.min(100, Math.max(0, Number($('[name=progress]', tr).value) || 0)) / 100, badge: $('[name=badge]', tr).value || null })); await PUT(`/learners/${encodeURIComponent(L.id)}/skills`, body); toast('Skill tree saved.', 'ok'); });
    };
    $$('.tabs button', d).forEach((b) => (b.onclick = () => show(b.dataset.t)));
    show(tab);
  }

  /* ════════════════════════ FAMILIES ════════════════════════ */
  async function viewParents() {
    V(`<div class="toolbar"><input type="search" id="pq" placeholder="Search name, phone, email or admission no.…"><span class="grow"></span>
      ${can('backups') ? `<button class="btn" id="pexp" type="button">${ic('down')}Export</button>` : ''}${can('parents') ? `<button class="btn primary" id="padd" type="button">${ic('plus')}Add parent</button>` : ''}</div><div id="ptab"></div>`);
    let q = '';
    const load = async () => {
      const rows = await GET(`/parents${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      $('#ptab').innerHTML = rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Parent / guardian</th><th>Phone (password)</th><th>Children</th><th>Password</th><th>Last sign-in</th><th></th></tr></thead><tbody>
        ${rows.map((p) => `<tr class="click" data-id="${p.id}"><td><div class="who"><span class="av">${initials(p.name)}</span><div><b>${esc(p.name)} ${p.demo ? '<span class="tag gold">demo</span>' : ''}</b><small>${esc(p.relationship || '')}${p.email ? ` · ${esc(p.email)}` : ''}</small></div></div></td>
          <td class="num">${esc(p.phone_pretty)}</td><td>${p.learners.map((l) => `<a class="tag info" href="#/learners?id=${encodeURIComponent(l)}" onclick="event.stopPropagation()">${esc(l)}</a>`).join(' ') || '<span class="tag warn">none</span>'}</td>
          <td>${p.own_password ? '<span class="tag ok">own</span>' : '<span class="tag">phone</span>'}</td><td class="muted">${p.status !== 'active' ? tag(p.status) : ago(p.last_login)}</td>
          <td class="r"><a class="btn sm" target="_blank" rel="noopener" onclick="event.stopPropagation()" href="${waLink(p.phone, `Hello ${p.name}, this is Royal Crest Academy.`)}">${ic('wa')}</a></td></tr>`).join('')}</tbody></table></div><p class="hint">${rows.length} famil${rows.length === 1 ? 'y' : 'ies'}.</p>`
        : '<div class="card empty"><b>No parents yet</b>Parents are added with their child, by import, or when you approve a registration.</div>';
      $$('#ptab tr.click').forEach((tr) => (tr.onclick = () => editParent(rows.find((p) => String(p.id) === tr.dataset.id), load)));
    };
    let t = null; $('#pq').oninput = (e) => { q = e.target.value.trim(); clearTimeout(t); t = setTimeout(load, 220); };
    if ($('#padd')) $('#padd').onclick = () => editParent(null, load);
    if ($('#pexp')) $('#pexp').onclick = (e) => busy(e.currentTarget, () => download('/export/parents.csv', 'parents.csv'));
    await load();
  }
  function editParent(p, after) {
    const ro = !can('parents');
    const m = modal(p ? p.name : 'Add a parent', `<div class="form-grid">${field('name', 'Full name', { value: p && p.name, required: true })}${field('phone', 'Phone number', { type: 'tel', value: p && p.phone_pretty, required: true, hint: 'Also their portal password until they choose one.' })}
      ${field('email', 'Email', { type: 'email', value: p && p.email })}${field('relationship', 'Relationship', { value: (p && p.relationship) || 'Mother', options: ['Mother', 'Father', 'Guardian', 'Grandparent', 'Aunt', 'Uncle', 'Sponsor'] })}
      ${field('learner_ids', 'Children (admission numbers)', { value: p ? p.learners.join(', ') : '', full: true, hint: 'Separate with commas, e.g. RCA-27-0142, RCA-27-0087' })}
      ${field('address', 'Address', { value: p && p.address, full: true })}${field('status', 'Status', { value: (p && p.status) || 'active', options: [['active', 'Active'], ['disabled', 'Disabled (cannot sign in)']] })}</div>
      ${p && !ro ? `<div class="split"><button class="btn sm" id="prs" type="button">${ic('key')}Reset password to phone</button><button class="btn sm danger" id="pdel" type="button">Remove parent</button></div>` : ''}`,
    { ok: p ? 'Save' : 'Add parent', onOk: ro ? null : async (mm) => {
      const b = readForm(mm.el); b.learner_ids = b.learner_ids.split(/[,\s]+/).filter(Boolean);
      if (p) await PUT(`/parents/${p.id}`, nul(b)); else await POST('/parents', nul(b));
      toast('Saved.', 'ok'); after();
    } });
    if (p && !ro) {
      $('#prs', m.el).onclick = (e) => busy(e.currentTarget, async () => { const r = await POST(`/parents/${p.id}/reset-password`); toast(esc(r.message), 'ok'); });
      $('#pdel', m.el).onclick = async () => { if (await confirmBox('Remove this parent?', 'They can no longer sign in. Their children stay on the register.', 'Remove')) { await DEL(`/parents/${p.id}`).catch(fail); m.close(); after(); } };
    }
  }

  /* ════════════════════════ REGISTRATIONS ════════════════════════ */
  async function viewRegistrations() {
    let status = 'pending';
    V(`<div class="toolbar"><div class="chips" id="rs">${[['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Declined'], ['all', 'All']].map(([k, l]) => `<button data-s="${k}" aria-pressed="${k === status}">${l}</button>`).join('')}</div>
      <span class="grow"></span><span class="hint">Parents register on the portal. New ones appear here instantly.</span></div><div id="rlist"></div>`);
    const load = async () => {
      const rs = await GET(`/registrations?status=${status}`);
      $('#rlist').innerHTML = rs.map((r) => `<section class="card" style="margin-bottom:16px" data-id="${r.id}">
        <div class="card-h"><h2>${esc(r.parent_name)} <span class="muted" style="font:500 14px var(--sans)">for</span> ${esc(r.learner_name)}</h2><span class="r">${tag(r.status)}<code>${esc(r.ref)}</code></span></div>
        <div class="reg"><dl><dt>Phone</dt><dd><b>${esc(r.phone_pretty)}</b> <a href="${waLink(r.phone, `Hello ${r.parent_name}, this is Royal Crest Academy about your registration ${r.ref}.`)}" target="_blank" rel="noopener">WhatsApp</a></dd>
          <dt>Email</dt><dd>${esc(r.email || '—')}</dd><dt>Relationship</dt><dd>${esc(r.relationship || '—')}</dd><dt>Address</dt><dd>${esc(r.address || '—')}</dd>
          <dt>Learner</dt><dd>${esc(r.learner_name)}${r.form ? ` · Form ${r.form}` : ''}${r.residence ? ` · ${esc(r.residence)}` : ''}</dd><dt>Admission no.</dt><dd>${esc(r.admission_no || 'not given (new learner?)')}</dd>
          <dt>Message</dt><dd>${esc(r.message || '—')}</dd><dt>Submitted</dt><dd>${fmtDate(r.created_at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</dd>
          ${r.status !== 'pending' ? `<dt>Decided</dt><dd>${esc(r.decided_by || '')} · ${ago(r.decided_at)}${r.learner_id ? ` · <a href="#/learners?id=${encodeURIComponent(r.learner_id)}">${esc(r.learner_id)}</a>` : ''}${r.note ? ` · ${esc(r.note)}` : ''}</dd>` : ''}</dl>
          ${r.status === 'pending' ? `<div><p class="eyebrow" style="margin-top:0">Who is this learner?</p>
            ${r.matches.map((m, i) => `<label class="opt"><input type="radio" name="pick-${r.id}" value="${esc(m.id)}" ${i === 0 ? 'checked' : ''}><span><b>Link to ${esc(m.first)} ${esc(m.last)}</b><br><span class="muted">${esc(m.id)} · Form ${m.form}${m.stream ? ` · ${esc(m.stream)}` : ''}</span></span></label>`).join('')}
            <label class="opt"><input type="radio" name="pick-${r.id}" value="" ${r.matches.length ? '' : 'checked'}><span><b>Create a new learner</b><br><span class="muted">Form <select data-form style="width:auto;padding:3px 6px">${FORMS.map((f) => `<option ${f === (r.form || 1) ? 'selected' : ''}>${f}</option>`).join('')}</select> · next admission number</span></span></label>
            ${r.existing_parent ? `<p class="hint">This phone already belongs to <b>${esc(r.existing_parent.name)}</b>; they'll be linked, not duplicated.</p>` : ''}
            <div class="split" style="margin-top:10px"><button class="btn primary" data-ok type="button">${ic('check')}Approve</button><button class="btn danger" data-no type="button">Decline</button></div></div>` : '<div></div>'}</div></section>`).join('')
        || `<div class="card empty"><b>${status === 'pending' ? 'All caught up' : 'Nothing here'}</b>${status === 'pending' ? 'New registrations from the portal will appear here, with a toast, the moment they arrive.' : ''}</div>`;
      $$('#rlist [data-ok]').forEach((b) => (b.onclick = () => busy(b, async () => {
        const card = b.closest('[data-id]'), id = card.dataset.id, pick = $(`input[name=pick-${id}]:checked`, card).value;
        const r = rs.find((x) => String(x.id) === id);
        const out = await POST(`/registrations/${id}/approve`, pick ? { learner_id: pick } : { form: Number($('[data-form]', card).value) });
        await bumpPending();
        modal('Approved', `<p style="margin-top:0"><b>${esc(r.parent_name)}</b> can now sign in to Crest Quest:</p><dl class="kv"><dt>Admission number</dt><dd><code>${esc(out.learner_id)}</code></dd><dt>Password</dt><dd>${esc(out.sign_in.password)}</dd></dl>
          <p class="hint">A welcome notice is already on their portal.</p>`, { cancel: 'Close', ok: 'Send on WhatsApp', okClass: 'gold', onOk: () => { window.open(waLink(r.phone, `Hello ${r.parent_name}, your Royal Crest Academy portal registration (${r.ref}) is approved. Sign in at https://royalcrestzw.vercel.app/portal/ with admission number ${out.learner_id} and your phone number as the password. Kudzi the Crestbot is there to help!`), '_blank', 'noopener'); } });
        load();
      })));
      $$('#rlist [data-no]').forEach((b) => (b.onclick = () => {
        const id = b.closest('[data-id]').dataset.id;
        modal('Decline registration', field('note', 'Reason (the parent sees this when they check)', { type: 'textarea', value: 'We could not match these details to a learner. Please call the office.' }),
          { ok: 'Decline', okClass: 'danger', onOk: async (m) => { await POST(`/registrations/${id}/reject`, readForm(m.el)); await bumpPending(); load(); } });
      }));
    };
    $$('#rs button').forEach((b) => (b.onclick = () => { status = b.dataset.s; $$('#rs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); load(); }));
    await load();
  }

  /* ════════════════════════ MARKS & TERMS ════════════════════════ */
  const classOpts = () => S.classes.map((c) => [c.stream, `${c.stream} (${c.n})`]);
  async function viewResults() {
    await refreshLookups();
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    const cur = S.terms.find((t) => t.current) || S.terms[0];
    const st = { term: q.get('term') || (cur && cur.id), stream: (S.classes[0] || {}).stream, code: (S.subjects[0] || {}).code };
    V(`<div class="grid"><section class="card s12"><div class="card-h"><h2>Terms</h2><span class="r"><button class="btn sm" id="tadd" type="button">${ic('plus')}New term</button><button class="btn sm" id="subj" type="button">Subjects</button><button class="btn sm" id="trd" type="button">Skill trades</button></span></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Term</th><th>Dates</th><th>Fees due</th><th class="r">Marks</th><th>Status</th><th></th></tr></thead><tbody>
      ${S.terms.map((t) => `<tr><td><b>${esc(t.label)}</b><br><code>${esc(t.id)}</code></td><td>${fmtDate(t.starts)} – ${fmtDate(t.ends)}</td><td>${fmtDate(t.fees_due)}</td><td class="r num">${t.results}</td>
        <td>${t.current ? '<span class="tag gold">current</span> ' : ''}${t.published ? '<span class="tag ok">published</span>' : '<span class="tag">hidden from families</span>'}</td>
        <td class="r"><div class="row-acts">${t.published ? '' : `<button class="btn sm gold" data-pub="${esc(t.id)}" type="button">Publish results</button>`}<button class="btn sm" data-edit="${esc(t.id)}" type="button">Edit</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No terms yet. Create the current term first.</td></tr>'}
      </tbody></table></div><p class="hint">Marks stay private until you publish the term. Publishing posts a notice and tells every family on the portal.</p></section>
      <section class="card s12"><div class="card-h"><h2>Enter marks</h2><span class="r"><button class="btn sm" id="rimp" type="button">${ic('up')}Import CSV</button></span></div>
      <div class="toolbar"><select id="rt">${S.terms.map((t) => `<option value="${esc(t.id)}" ${t.id === st.term ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select>
        <select id="rc">${classOpts().map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
        <select id="rsub">${S.subjects.map((s) => `<option value="${esc(s.code)}">${esc(s.name)} (${esc(s.code)})</option>`).join('')}</select>
        <span class="grow"></span><button class="btn primary" id="rsave" type="button">Save marks</button></div><div id="rgrid"></div></section></div>`);
    const load = async () => {
      if (!st.term || !st.stream || !st.code) { $('#rgrid').innerHTML = '<div class="empty"><b>Set up first</b>You need a term, a class with learners and at least one subject.</div>'; return; }
      const rows = await GET(`/results?term=${encodeURIComponent(st.term)}&code=${encodeURIComponent(st.code)}&stream=${encodeURIComponent(st.stream)}`);
      const grade = (t) => (t >= 75 ? 'A' : t >= 65 ? 'B' : t >= 50 ? 'C' : t >= 45 ? 'D' : t >= 40 ? 'E' : 'U');
      $('#rgrid').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>Learner</th><th class="r">CA /40</th><th class="r">Exam /60</th><th class="r">Total</th><th>Grade</th><th>Teacher's comment</th></tr></thead><tbody>
        ${rows.map((r) => `<tr data-id="${esc(r.learner_id)}"><td><b>${esc(r.name)}</b><br><small class="muted">${esc(r.learner_id)}</small></td><td class="r"><input class="mark" name="ca" type="number" min="0" max="40" step="0.5" value="${r.ca ?? ''}"></td>
          <td class="r"><input class="mark" name="exam" type="number" min="0" max="60" step="0.5" value="${r.exam ?? ''}"></td><td class="r num tot">—</td><td class="gr">—</td><td><input name="comment" value="${esc(r.comment)}" placeholder="e.g. Steady progress; revise algebra."></td></tr>`).join('') || '<tr><td class="muted" colspan="6">No learners in this class.</td></tr>'}
        </tbody></table></div><p class="hint">Tab moves across. Totals and grades update as you type (A 75+, B 65+, C 50+, D 45+, E 40+).</p>`;
      const calc = (tr) => { const ca = parseFloat($('[name=ca]', tr).value), ex = parseFloat($('[name=exam]', tr).value); if (isNaN(ca) && isNaN(ex)) { $('.tot', tr).textContent = '—'; $('.gr', tr).innerHTML = '—'; return; } const t = Math.round(Math.min(100, (ca || 0) + (ex || 0))); $('.tot', tr).textContent = t; $('.gr', tr).innerHTML = `<span class="grade ${grade(t)}">${grade(t)}</span>`; };
      $$('#rgrid tr[data-id]').forEach((tr) => { calc(tr); tr.oninput = () => calc(tr); });
    };
    $('#rt').onchange = (e) => { st.term = e.target.value; load(); };
    $('#rc').onchange = (e) => { st.stream = e.target.value; load(); };
    $('#rsub').onchange = (e) => { st.code = e.target.value; load(); };
    $('#rsave').onclick = (e) => busy(e.currentTarget, async () => {
      const rows = $$('#rgrid tr[data-id]').map((tr) => { const v = (n) => { const x = $(`[name=${n}]`, tr).value; return x === '' ? null : Number(x); }; return { learner_id: tr.dataset.id, ca: v('ca'), exam: v('exam'), comment: $('[name=comment]', tr).value || null }; });
      const r = await PUT('/results', { term: st.term, code: st.code, rows }); toast(`${r.saved} marks saved.`, 'ok');
    });
    const termModal = (t) => modal(t ? `Edit ${t.label}` : 'New term', `<div class="form-grid">${field('id', 'Short code', { value: t ? t.id : `T${Math.ceil((new Date().getMonth() + 1) / 4)}-${new Date().getFullYear()}`, required: true, hint: 'e.g. T1-2027', attrs: t ? 'readonly' : '' })}${field('label', 'Name', { value: t ? t.label : `Term 1 · ${new Date().getFullYear()}`, required: true })}
      ${field('starts', 'Starts', { type: 'date', value: t && t.starts })}${field('ends', 'Ends', { type: 'date', value: t && t.ends })}${field('fees_due', 'Fees due', { type: 'date', value: t && t.fees_due })}<div></div>
      ${field('current', 'This is the current term (fees and register use it)', { type: 'checkbox', value: t ? t.current : true, full: true })}${field('published', 'Results published (families can see marks)', { type: 'checkbox', value: t && t.published, full: true })}</div>`,
    { ok: 'Save term', onOk: async (m) => { const b = nul(readForm(m.el)); await PUT(`/terms/${encodeURIComponent(b.id)}`, b); toast('Term saved.', 'ok'); viewResults(); } });
    $('#tadd').onclick = () => termModal(null);
    $$('[data-edit]').forEach((b) => (b.onclick = () => termModal(S.terms.find((t) => t.id === b.dataset.edit))));
    $$('[data-pub]').forEach((b) => (b.onclick = async () => {
      const t = S.terms.find((x) => x.id === b.dataset.pub);
      if (!(await confirmBox(`Publish ${t.label}?`, 'Every family will see these marks on the portal straight away, and Kudzi can talk about them.', 'Publish', false))) return;
      await PUT(`/terms/${encodeURIComponent(t.id)}`, { ...t, current: !!t.current, published: true }).catch(fail); toast('Published. Families can see the results.', 'ok'); viewResults();
    }));
    $('#subj').onclick = () => {
      const m = modal('Subjects', `<div class="table-wrap"><table class="t" id="subt"><thead><tr><th>Code</th><th>Name</th><th>Default teacher</th></tr></thead><tbody>${S.subjects.map((s) => `<tr><td><input name="code" value="${esc(s.code)}" style="width:80px"></td><td><input name="name" value="${esc(s.name)}"></td><td><input name="teacher" value="${esc(s.teacher || '')}"></td></tr>`).join('')}
        <tr><td><input name="code" placeholder="AGR" style="width:80px"></td><td><input name="name" placeholder="Agriculture"></td><td><input name="teacher"></td></tr></tbody></table></div>`,
      { wide: true, ok: 'Save subjects', onOk: async (mm) => { const body = $$('#subt tbody tr', mm.el).map((tr) => ({ code: $('[name=code]', tr).value.trim(), name: $('[name=name]', tr).value.trim(), teacher: $('[name=teacher]', tr).value.trim() || null })).filter((x) => x.code && x.name); await PUT('/subjects', body); toast('Subjects saved.', 'ok'); viewResults(); } });
      return m;
    };
    $('#trd').onclick = async () => {
      const tr = await GET('/trades');
      modal('Skill tree trades (one a year)', tr.map((t) => field(`f${t.form}`, `Form ${t.form}`, { value: t.trade })).join(''), { ok: 'Save', onOk: async (m) => { const b = readForm(m.el); await PUT('/trades', Object.entries(b).map(([k, v]) => ({ form: Number(k.slice(1)), trade: v }))); toast('Trades saved.', 'ok'); } });
    };
    $('#rimp').onclick = () => modal('Import marks', `<p class="muted" style="margin-top:0">CSV headings: <code>admission_no</code> <code>code</code> <code>ca</code> <code>exam</code> <code>comment</code>. Imports into <b>${esc((S.terms.find((t) => t.id === st.term) || {}).label || st.term)}</b>.</p><input type="file" id="rif" accept=".csv,text/csv"><div id="rio" style="margin-top:10px"></div>`,
      { ok: 'Import', onOk: async (m) => { const f = $('#rif', m.el).files[0]; if (!f) throw new Error('Choose a file.'); const r = await api('POST', `/import/results?term=${encodeURIComponent(st.term)}`, await f.text(), { type: 'text/csv' }); toast(`${r.saved} marks imported${r.errors.length ? `, ${r.errors.length} rows skipped` : ''}.`, 'ok'); load(); } });
    await load();
  }

  /* ════════════════════════ REGISTER ════════════════════════ */
  async function viewAttendance() {
    const st = { day: today(), stream: (S.classes[0] || {}).stream };
    V(`<div class="toolbar"><input type="date" id="ad" value="${st.day}" style="width:auto"><select id="ac">${classOpts().map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select>
      <button class="btn" id="aall" type="button">${ic('check')}Everyone present</button><span class="grow"></span><span id="asum" class="hint"></span><button class="btn primary" id="asave" type="button">Save register</button></div><div id="alist"></div>`);
    const L = { present: 'P', late: 'L', absent: 'A', excused: 'E' };
    const summary = () => { const c = { present: 0, late: 0, absent: 0, excused: 0 }; $$('#alist tr[data-id]').forEach((tr) => { const s = tr.dataset.status; if (s) c[s] += 1; }); $('#asum').textContent = `${c.present} present · ${c.late} late · ${c.absent} absent · ${c.excused} excused`; };
    const load = async () => {
      if (!st.stream) { $('#alist').innerHTML = '<div class="card empty"><b>No classes yet</b>Add learners first.</div>'; return; }
      const rows = await GET(`/attendance?day=${st.day}&stream=${encodeURIComponent(st.stream)}`);
      $('#alist').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>Learner</th><th>Mark</th><th>Note</th></tr></thead><tbody>${rows.map((r) => `<tr data-id="${esc(r.learner_id)}" data-status="${esc(r.status || '')}"><td><div class="who"><span class="av">${initials(r.name)}</span><div><b>${esc(r.name)}</b><small>${esc(r.learner_id)}</small></div></div></td>
        <td><div class="att">${Object.entries(L).map(([k, l]) => `<button type="button" class="${k}" data-s="${k}" aria-pressed="${r.status === k}" title="${k}">${l}</button>`).join('')}</div></td><td><input name="note" value="${esc(r.note)}" placeholder="optional"></td></tr>`).join('') || '<tr><td class="muted">No learners in this class.</td></tr>'}</tbody></table></div>
        <p class="hint">P present · L late · A absent · E excused. Marking a learner absent tells their family on the portal.</p>`;
      $$('#alist tr[data-id]').forEach((tr) => $$('.att button', tr).forEach((b) => (b.onclick = () => { const on = tr.dataset.status === b.dataset.s; tr.dataset.status = on ? '' : b.dataset.s; $$('.att button', tr).forEach((x) => x.setAttribute('aria-pressed', String(!on && x === b))); summary(); })));
      summary();
    };
    $('#ad').onchange = (e) => { st.day = e.target.value; load(); };
    $('#ac').onchange = (e) => { st.stream = e.target.value; load(); };
    $('#aall').onclick = () => { $$('#alist tr[data-id]').forEach((tr) => { if (!tr.dataset.status) { tr.dataset.status = 'present'; $$('.att button', tr).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.s === 'present'))); } }); summary(); };
    $('#asave').onclick = (e) => busy(e.currentTarget, async () => { const entries = $$('#alist tr[data-id]').map((tr) => ({ learner_id: tr.dataset.id, status: tr.dataset.status || null, note: $('[name=note]', tr).value || null })); const r = await PUT('/attendance', { day: st.day, entries }); toast(`Register saved (${r.saved}).`, 'ok'); });
    await load();
  }

  /* ════════════════════════ TIMETABLE ════════════════════════ */
  async function viewTimetable() {
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    let cls = (S.classes[0] || {}).stream, periods = ['07:30', '08:20', '09:10', '10:20', '11:10', '12:00', '14:00'];
    V(`<div class="toolbar"><select id="tc">${classOpts().map(([v, l]) => `<option value="${esc(v)}">${esc(l)}</option>`).join('')}</select><input id="tper" style="max-width:420px" title="Period start times"><button class="btn" id="tapply" type="button">Set periods</button>
      <span class="grow"></span><button class="btn primary" id="tsave" type="button">Save timetable</button></div><div class="card" style="overflow-x:auto"><div id="tgrid"></div></div><p class="hint">Learners and parents see this on the portal, and Kudzi answers "what's next?" from it.</p>`);
    const subOpts = (code) => `<option value="">— free —</option>${S.subjects.map((s) => `<option value="${esc(s.code)}" ${s.code === code ? 'selected' : ''}>${esc(s.name)}</option>`).join('')}`;
    const draw = (cells) => {
      const by = {}; cells.forEach((c) => (by[`${c.day} ${c.start}`] = c));
      $('#tper').value = periods.join(', ');
      $('#tgrid').innerHTML = `<table class="tt"><thead><tr><th></th>${DAYS.map((d) => `<th>${d}</th>`).join('')}</tr></thead><tbody>${periods.map((p) => `<tr><td class="time">${p}</td>${DAYS.map((d) => { const c = by[`${d} ${p}`] || {}; return `<td data-day="${d}" data-start="${p}"><select name="code">${subOpts(c.code)}</select><input name="room" placeholder="Room" value="${esc(c.room || '')}"></td>`; }).join('')}</tr>`).join('')}</tbody></table>`;
    };
    const load = async () => { if (!cls) { $('#tgrid').innerHTML = '<div class="empty"><b>No classes yet</b></div>'; return; } const cells = await GET(`/timetable?cls=${encodeURIComponent(cls)}`); const starts = [...new Set(cells.map((c) => c.start))].sort(); if (starts.length) periods = starts; draw(cells); };
    $('#tc').onchange = (e) => { cls = e.target.value; load(); };
    $('#tapply').onclick = () => { const cur = collect(); periods = $('#tper').value.split(/[,\s]+/).filter((x) => /^\d{2}:\d{2}$/.test(x)).sort(); draw(cur); };
    const collect = () => $$('#tgrid td[data-day]').map((td) => ({ day: td.dataset.day, start: td.dataset.start, code: $('[name=code]', td).value || null, room: $('[name=room]', td).value || null }));
    $('#tsave').onclick = (e) => busy(e.currentTarget, async () => { await PUT('/timetable', { class: cls, cells: collect().filter((c) => c.code) }); toast(`Timetable saved for ${esc(cls)}.`, 'ok'); });
    await load();
  }

  /* ════════════════════════ HOMEWORK ════════════════════════ */
  async function viewHomework() {
    V(`<div class="toolbar"><div class="chips" id="hf"><button data-f="0" aria-pressed="true">All</button>${FORMS.map((f) => `<button data-f="${f}" aria-pressed="false">F${f}</button>`).join('')}</div><span class="grow"></span><button class="btn primary" id="hadd" type="button">${ic('plus')}Set homework</button></div><div id="hlist"></div>`);
    let form = 0;
    const load = async () => {
      const rows = await GET(`/assignments${form ? `?form=${form}` : ''}`);
      $('#hlist').innerHTML = rows.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Due</th><th>Homework</th><th>Class</th><th>Handed in</th><th></th></tr></thead><tbody>${rows.map((a) => `<tr><td><b>${fmtDate(a.due, { weekday: 'short', day: 'numeric', month: 'short' })}</b>${a.due < today() ? '<br><span class="tag">past</span>' : ''}</td><td><b>${esc(a.title)}</b><br><span class="muted">${esc(a.subject)}${a.details ? ` · ${esc(a.details.slice(0, 80))}` : ''}</span></td>
        <td>Form ${a.form}${a.stream ? ` · ${esc(a.stream)}` : ''}</td><td><div class="meter" style="width:120px"><i style="width:${a.learners ? a.submitted * 100 / a.learners : 0}%"></i></div><small class="muted">${a.submitted} / ${a.learners}</small></td>
        <td class="r"><div class="row-acts"><button class="btn sm" data-sub="${a.id}" type="button">Tick off</button><button class="btn sm" data-ed="${a.id}" type="button">Edit</button><button class="btn sm danger" data-del="${a.id}" type="button">Delete</button></div></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="card empty"><b>No homework set</b>Homework appears on learners’ portals and in Kudzi’s “what’s due?” answers.</div>';
      $$('[data-ed]').forEach((b) => (b.onclick = () => hwModal(rows.find((a) => String(a.id) === b.dataset.ed))));
      $$('[data-del]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete homework?', 'It disappears from learners’ portals.', 'Delete')) { await DEL(`/assignments/${b.dataset.del}`).catch(fail); load(); } }));
      $$('[data-sub]').forEach((b) => (b.onclick = async () => {
        const list = await GET(`/assignments/${b.dataset.sub}/submissions`);
        modal('Who has handed it in?', `<div class="table-wrap"><table class="t">${list.map((s) => `<tr data-id="${esc(s.learner_id)}"><td>${esc(s.name)}</td><td><select name="st">${['pending', 'submitted', 'late', 'marked'].map((x) => `<option ${x === s.status ? 'selected' : ''}>${x}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`,
          { ok: 'Save', onOk: async (m) => { await PUT(`/assignments/${b.dataset.sub}/submissions`, $$('tr[data-id]', m.el).map((tr) => ({ learner_id: tr.dataset.id, status: $('select', tr).value }))); toast('Saved.', 'ok'); load(); } });
      }));
    };
    const hwModal = (a) => modal(a ? 'Edit homework' : 'Set homework', `<div class="form-grid">${field('form', 'Form', { value: a ? a.form : 1, options: FORMS.map((f) => [f, `Form ${f}`]) })}${field('stream', 'Stream (optional)', { value: a && a.stream, hint: 'Empty = the whole form', attrs: 'list="dl-st2"' })}
      ${field('subject', 'Subject', { value: a ? a.subject : (S.subjects[0] || {}).name, options: S.subjects.map((s) => s.name) })}${field('due', 'Due date', { type: 'date', value: a ? a.due : today() })}
      ${field('title', 'Title', { value: a && a.title, full: true, required: true })}${field('details', 'Details', { type: 'textarea', value: a && a.details, full: true })}</div><datalist id="dl-st2">${S.classes.map((c) => `<option value="${esc(c.stream)}">`).join('')}</datalist>`,
    { ok: a ? 'Save' : 'Set homework', onOk: async (m) => { const b = nul(readForm(m.el)); b.form = Number(b.form); if (a) await PUT(`/assignments/${a.id}`, b); else await POST('/assignments', b); toast('Saved. Learners see it on the portal.', 'ok'); load(); } });
    $$('#hf button').forEach((b) => (b.onclick = () => { form = Number(b.dataset.f); $$('#hf button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); load(); }));
    $('#hadd').onclick = () => hwModal(null);
    await load();
  }

  /* ════════════════════════ FEES ════════════════════════ */
  async function viewFees() {
    const q = new URLSearchParams(location.hash.split('?')[1] || '');
    let tab = 'balances';
    V(`<div class="toolbar"><div class="chips" id="ft">${[['balances', 'Balances'], ['payments', 'Payments'], ['structure', 'Fee structure']].map(([k, l]) => `<button data-t="${k}" aria-pressed="${k === tab}">${l}</button>`).join('')}</div><span class="grow"></span>
      <button class="btn" id="fexp" type="button">${ic('down')}Export payments</button><button class="btn primary" id="fpay" type="button">${ic('plus')}Record payment</button></div><div id="fbody"></div>`);
    const T = {
      async balances() {
        const rows = await GET('/fees/balances'), owing = rows.filter((r) => r.balance > 0), total = owing.reduce((a, r) => a + r.balance, 0);
        $('#fbody').innerHTML = `<div class="grid" style="margin-bottom:16px"><div class="card s4 kpi"><div class="lbl">${ic('fees')}Owing</div><div class="val" style="color:var(--bad)">${money(total)}</div><div class="sub">${owing.length} learners</div></div>
          <div class="card s4 kpi"><div class="lbl">${ic('check')}Collected</div><div class="val">${money(rows.reduce((a, r) => a + r.paid, 0))}</div><div class="sub">of ${money(rows.reduce((a, r) => a + r.invoiced, 0))} invoiced</div></div>
          <div class="card s4 kpi"><div class="lbl">${ic('star')}Fully paid</div><div class="val">${rows.length - owing.length}</div><div class="sub">learners</div></div></div>
          <div class="toolbar"><label class="split hint"><input type="checkbox" id="fown"> Only learners who owe</label></div>
          <div class="table-wrap"><table class="t"><thead><tr><th>Learner</th><th>Class</th><th class="r">Invoiced</th><th class="r">Paid</th><th class="r">Balance</th><th></th></tr></thead><tbody id="fbal"></tbody></table></div>`;
        const draw = (only) => { $('#fbal').innerHTML = rows.filter((r) => !only || r.balance > 0).map((r) => `<tr><td><a href="#/learners?id=${encodeURIComponent(r.learner_id)}"><b>${esc(r.name)}</b></a><br><small class="muted">${esc(r.learner_id)} · ${esc(r.residence || '')}</small></td><td>${r.stream ? esc(r.stream) : `Form ${r.form}`}</td><td class="r num">${money(r.invoiced)}</td><td class="r num">${money(r.paid)}</td><td class="r num">${r.balance > 0 ? `<b style="color:var(--bad)">${money(r.balance)}</b>` : '<span class="tag ok">paid</span>'}</td>
          <td class="r"><div class="row-acts">${r.balance > 0 && r.phones[0] ? `<a class="btn sm" target="_blank" rel="noopener" href="${waLink(r.phones[0], `Hello, this is the Royal Crest Academy bursar. A friendly reminder that ${r.name}'s fees balance is ${money(r.balance)}. You can see the statement on Crest Quest: https://royalcrestzw.vercel.app/portal/ . Thank you!`)}">${ic('wa')}Remind</a>` : ''}<button class="btn sm" data-pay="${esc(r.learner_id)}" type="button">Pay</button></div></td></tr>`).join('') || '<tr><td class="muted" colspan="6">No learners.</td></tr>';
          $$('[data-pay]').forEach((b) => (b.onclick = () => payModal(b.dataset.pay, rows.find((x) => x.learner_id === b.dataset.pay).balance))); };
        $('#fown').onchange = (e) => draw(e.target.checked); draw(false);
      },
      async payments() {
        const rows = await GET('/payments?limit=300');
        $('#fbody').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>Date</th><th>Learner</th><th>Receipt</th><th>Method</th><th class="r">Amount</th><th>Recorded by</th><th></th></tr></thead><tbody>${rows.map((p) => `<tr><td>${fmtDate(p.date)}</td><td><a href="#/learners?id=${encodeURIComponent(p.learner_id)}">${esc(p.name || p.learner_id)}</a></td><td><code>${esc(p.ref)}</code></td><td>${esc(p.method)}</td><td class="r num"><b>${money(p.amount)}</b></td><td class="muted">${esc(p.recorded_by || '')}</td><td class="r"><button class="btn sm danger" data-del="${p.id}" type="button">Remove</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No payments yet.</td></tr>'}</tbody></table></div>`;
        $$('[data-del]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Remove this payment?', 'The balance goes back up. The removal is logged.', 'Remove')) { await DEL(`/payments/${b.dataset.del}`).catch(fail); T.payments(); } }));
      },
      async structure() {
        await refreshLookups();
        const cur = S.terms.find((t) => t.current) || S.terms[0];
        if (!cur) { $('#fbody').innerHTML = '<div class="card empty"><b>No term yet</b>Create a term under Marks &amp; terms first.</div>'; return; }
        let term = cur.id;
        const draw = async () => {
          const s = await GET(`/fees/structure?term=${encodeURIComponent(term)}`);
          $('#fbody').innerHTML = `<section class="card"><div class="toolbar"><select id="fst">${S.terms.map((t) => `<option value="${esc(t.id)}" ${t.id === term ? 'selected' : ''}>${esc(t.label)}</option>`).join('')}</select><span class="grow"></span><button class="btn" id="fadd" type="button">${ic('plus')}Add line</button><button class="btn primary" id="fsave" type="button">Save structure</button></div>
            <div class="table-wrap"><table class="t" id="fitems"><thead><tr><th>Item</th><th class="r">Amount (US$)</th><th>Charged to</th><th></th></tr></thead><tbody>${(s.items.length ? s.items : [{ item: 'Tuition', amount: 250, applies_to: 'all' }]).map(rowHtml).join('')}</tbody></table></div>
            <p class="hint">Boarding-only lines are charged to boarders, day-only lines to day scholars. Unpaid balances from earlier terms are brought forward automatically.</p><p id="ftot" class="muted"></p></section>`;
          const tot = () => { const r = $$('#fitems tbody tr').map((tr) => [Number($('[name=amount]', tr).value) || 0, $('[name=applies_to]', tr).value]); const b = r.filter(([, a]) => a !== 'day').reduce((x, [v]) => x + v, 0), d = r.filter(([, a]) => a !== 'boarder').reduce((x, [v]) => x + v, 0); $('#ftot').innerHTML = `Per term: boarders <b>${money(b)}</b> · day scholars <b>${money(d)}</b>`; };
          const wire = () => { $$('#fitems [data-rm]').forEach((b) => (b.onclick = () => { b.closest('tr').remove(); tot(); })); $('#fitems').oninput = tot; $('#fitems').onchange = tot; tot(); };
          $('#fst').onchange = (e) => { term = e.target.value; draw(); };
          $('#fadd').onclick = () => { $('#fitems tbody').insertAdjacentHTML('beforeend', rowHtml({ item: '', amount: '', applies_to: 'all' })); wire(); };
          $('#fsave').onclick = (e) => busy(e.currentTarget, async () => { const items = $$('#fitems tbody tr').map((tr) => ({ item: $('[name=item]', tr).value.trim(), amount: Number($('[name=amount]', tr).value) || 0, applies_to: $('[name=applies_to]', tr).value })).filter((x) => x.item); await PUT('/fees/structure', { term, items }); toast('Fee structure saved. Statements update on the portal.', 'ok'); });
          wire();
        };
        const rowHtml = (i) => `<tr><td><input name="item" value="${esc(i.item)}" placeholder="e.g. Boarding"></td><td class="r"><input name="amount" type="number" min="0" step="0.01" value="${esc(i.amount)}" style="width:120px;text-align:right"></td><td><select name="applies_to">${[['all', 'Everyone'], ['boarder', 'Boarders only'], ['day', 'Day scholars only']].map(([v, l]) => `<option value="${v}" ${v === i.applies_to ? 'selected' : ''}>${l}</option>`).join('')}</select></td><td class="r"><button class="btn sm ghost" data-rm type="button">${ic('x')}</button></td></tr>`;
        await draw();
      },
    };
    const go = (k) => { tab = k; $$('#ft button').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.t === k))); T[k]().catch(fail); };
    $$('#ft button').forEach((b) => (b.onclick = () => go(b.dataset.t)));
    $('#fpay').onclick = () => payModal(null);
    $('#fexp').onclick = (e) => busy(e.currentTarget, () => download('/export/payments.csv', 'payments.csv'));
    function payModal(lid, bal) {
      modal('Record a payment', `<div class="form-grid">${field('learner_id', 'Learner (admission number or name)', { value: lid || '', required: true, full: true, attrs: 'list="dl-learners" autocomplete="off"' })}
        ${field('amount', 'Amount (US$)', { type: 'number', value: bal || '', required: true, attrs: 'step="0.01" min="0.01"' })}${field('method', 'Method', { options: ['Cash', 'EcoCash', 'InnBucks', 'OneMoney', 'Bank transfer', 'Swipe / card', 'Mukuru'] })}
        ${field('date', 'Date', { type: 'date', value: today() })}${field('ref', 'Receipt no.', { hint: 'Empty = automatic' })}${field('note', 'Note', { full: true })}</div><datalist id="dl-learners"></datalist>`,
      { ok: 'Record payment', onOk: async (m) => {
        const b = nul(readForm(m.el)); b.learner_id = (b.learner_id || '').split(' · ')[0];
        const r = await POST('/payments', b); toast(`Payment recorded · receipt <b>${esc(r.ref)}</b>`, 'ok'); go(tab);
      } });
      GET('/learners').then((ls) => { const dl = $('#dl-learners'); if (dl) dl.innerHTML = ls.map((l) => `<option value="${esc(l.id)} · ${esc(l.first)} ${esc(l.last)}">`).join(''); }).catch(() => {});
    }
    go(tab);
    if (q.get('pay')) payModal(null);
  }

  /* ════════════════════════ NOTICES ════════════════════════ */
  async function viewNotices() {
    const rows = await GET('/notices');
    const audLabel = (a) => (a === 'all' ? 'Everyone' : a === 'parents' ? 'Parents' : a === 'learners' ? 'Learners' : a.startsWith('form:') ? `Form ${a.slice(5)}` : `Only ${a.slice(8)}`);
    V(`<div class="grid"><section class="card s5"><h2>Post a notice</h2><form id="nf">${field('title', 'Title', { required: true })}${field('body', 'Message', { type: 'textarea' })}
      <div class="form-grid">${field('tag', 'Label', { options: ['General', 'Academics', 'Boarding', 'Fees', 'Sport', 'Clubs', 'Health', 'Urgent'] })}${field('audience', 'Who sees it', { options: [['all', 'Everyone'], ['parents', 'Parents only'], ['learners', 'Learners only'], ...FORMS.map((f) => [`form:${f}`, `Form ${f} families`]), ['one', 'One learner’s family…']] })}</div>
      <div id="one" hidden>${field('learner', 'Admission number', { hint: 'A private message to that family.' })}</div>${field('pinned', 'Pin to the top', { type: 'checkbox' })}</form>
      <button class="btn primary" id="npost" type="button">${ic('notices')}Post notice</button><p class="hint">It appears on the portal at once, and the app shows it on its next sync.</p></section>
      <section class="card s7"><h2>On the portal now</h2>${rows.map((n) => `<div class="chat" data-id="${n.id}"><span class="q">${n.pinned ? '📌 ' : ''}${esc(n.title)} <span class="tag">${esc(n.tag)}</span> <span class="tag info">${esc(audLabel(n.audience))}</span>${n.demo ? ' <span class="tag gold">demo</span>' : ''}</span><span class="a">${esc(n.body)}</span>
        <span class="split" style="font-size:12px"><span class="faint">${fmtDate(n.date)} · ${esc(n.created_by || '')}</span><span style="flex:1"></span><button class="btn sm" data-ed="${n.id}" type="button">Edit</button><button class="btn sm danger" data-del="${n.id}" type="button">Delete</button></span></div>`).join('') || '<p class="muted">No notices yet.</p>'}</section></div>`);
    $('[name=audience]').onchange = (e) => ($('#one').hidden = e.target.value !== 'one');
    $('#npost').onclick = (e) => busy(e.currentTarget, async () => { const b = readForm($('#nf')); if (!b.title) throw new Error('Give the notice a title.'); if (b.audience === 'one') b.audience = `learner:${b.learner.toUpperCase()}`; delete b.learner; await POST('/notices', b); toast('Notice posted.', 'ok'); viewNotices(); });
    $$('[data-del]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this notice?', 'It disappears from the portal.', 'Delete')) { await DEL(`/notices/${b.dataset.del}`).catch(fail); viewNotices(); } }));
    $$('[data-ed]').forEach((b) => (b.onclick = () => { const n = rows.find((x) => String(x.id) === b.dataset.ed); modal('Edit notice', `${field('title', 'Title', { value: n.title })}${field('body', 'Message', { type: 'textarea', value: n.body })}${field('tag', 'Label', { value: n.tag })}${field('audience', 'Audience code', { value: n.audience, hint: 'all · parents · learners · form:3 · learner:RCA-27-0142' })}${field('pinned', 'Pinned', { type: 'checkbox', value: n.pinned })}`,
      { onOk: async (m) => { await PUT(`/notices/${n.id}`, readForm(m.el)); viewNotices(); } }); }));
  }

  /* ════════════════════════ KUDZI ════════════════════════ */
  async function viewKudzi() {
    const [st, chats, faqs] = await Promise.all([GET('/kudzi/stats'), GET('/kudzi/chats?limit=60'), can('memory') ? GET('/memory?scope=kudzi_faq') : Promise.resolve([])]);
    const n = (s) => (st.by_source.find((x) => x.source === s) || { n: 0 }).n, total = st.by_source.reduce((a, b) => a + b.n, 0);
    V(`<div class="grid">
      <div class="card s3 kpi"><div class="lbl">${ic('chat')}Questions answered</div><div class="val">${total}</div><div class="sub">${n('rules')} from records · ${n('faq')} FAQs · ${n('ai')} AI</div></div>
      <div class="card s3 kpi"><div class="lbl">${ic('star')}Helpful</div><div class="val">${st.helpful + st.unhelpful ? Math.round(st.helpful * 100 / (st.helpful + st.unhelpful)) : '—'}<small>%</small></div><div class="sub">${st.helpful} 👍 · ${st.unhelpful} 👎</div></div>
      <div class="card s3 kpi"><div class="lbl">${ic('x')}Couldn't answer</div><div class="val">${n('fallback')}</div><div class="sub">teach Kudzi below</div></div>
      <div class="card s3 kpi"><div class="lbl">${ic('kudzi')}AI brain</div><div class="val" style="font-size:24px">${st.ai === 'ollama' ? 'On' : 'Off'}</div><div class="sub">${st.ai === 'ollama' ? esc(st.model) : 'Set KUDZI_LLM=ollama to use this Space’s model'}</div></div>
      <section class="card s6"><h2>Talk to Kudzi as a family would</h2><form id="kt" class="form-grid">${field('learner_id', 'Learner', { value: 'RCA-27-0142', attrs: 'list="dl-kl"' })}${field('role', 'As', { options: [['parent', 'Parent'], ['learner', 'Learner']] })}${field('message', 'Question', { full: true, value: 'How is my child doing?' })}</form>
        <button class="btn primary" id="kask" type="button">${ic('chat')}Ask</button><div id="kout" style="margin-top:14px"></div><datalist id="dl-kl"></datalist></section>
      <section class="card s6"><div class="card-h"><h2>Teach Kudzi (FAQs)</h2><span class="r"><button class="btn sm primary" id="fqadd" type="button">${ic('plus')}Add answer</button></span></div>
        <p class="hint" style="margin-top:0">When a question contains any of the keywords, Kudzi gives your answer word for word. Stored in Memory and in every backup.</p>
        ${faqs.map((f) => `<div class="chat"><span class="q">${esc(f.key)}</span><span class="a">${esc(f.value)}</span><span class="split"><span class="faint" style="font-size:11.5px">${esc(f.updated_by || '')} · ${ago(f.updated_at)}</span><span style="flex:1"></span><button class="btn sm" data-fe="${esc(f.key)}" type="button">Edit</button><button class="btn sm danger" data-fd="${esc(f.key)}" type="button">Delete</button></span></div>`).join('') || '<p class="muted">No FAQs yet. Good first ones: uniform, visiting days, school fees banking details, term dates, what to pack.</p>'}</section>
      ${st.unanswered.length ? `<section class="card s12"><h2>Questions Kudzi couldn't answer</h2><div class="table-wrap"><table class="t"><tbody>${st.unanswered.map((u) => `<tr><td>${esc(u.message)}</td><td class="num muted">${u.n}×</td><td class="r"><button class="btn sm" data-teach="${esc(u.message)}" type="button">Teach an answer</button></td></tr>`).join('')}</tbody></table></div></section>` : ''}
      <section class="card s12"><h2>Recent conversations</h2>${chats.map((c) => `<div class="chat"><span class="q">${esc(c.message)} <span class="tag">${esc(c.kind)}</span> <a class="tag info" href="#/learners?id=${encodeURIComponent(c.learner_id)}">${esc(c.learner_id)}</a> <span class="tag ${c.source === 'fallback' ? 'warn' : ''}">${esc(c.source)}</span>${c.helpful === 1 ? ' 👍' : c.helpful === 0 ? ' 👎' : ''}</span><span class="a">${esc(c.reply)}</span><span class="faint" style="font-size:11.5px">${ago(c.at)} · ${esc(c.actor)}</span></div>`).join('') || '<p class="muted">No conversations yet.</p>'}</section></div>`);
    GET('/learners').then((ls) => { $('#dl-kl').innerHTML = ls.map((l) => `<option value="${esc(l.id)}">${esc(l.first)} ${esc(l.last)}</option>`).join(''); }).catch(() => {});
    $('#kask').onclick = (e) => busy(e.currentTarget, async () => { const b = readForm($('#kt')); const r = await POST('/kudzi/test', b); $('#kout').innerHTML = `<div class="notice info" style="white-space:pre-line">${esc(r.reply).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')}</div><p class="hint">Answered from: <b>${esc(r.source)}</b></p>`; });
    const faqModal = (key = '', value = '') => modal(key ? 'Edit answer' : 'Teach Kudzi an answer', `${field('key', 'Keywords (comma separated)', { value: key, hint: 'e.g. uniform, blazer, school shoes' })}${field('value', 'Kudzi’s answer', { type: 'textarea', value })}`,
      { onOk: async (m) => { const b = readForm(m.el); if (key && key !== b.key) await DEL(`/memory/kudzi_faq/${encodeURIComponent(key)}`); await PUT('/memory', { scope: 'kudzi_faq', ...b }); toast('Kudzi learnt it.', 'ok'); viewKudzi(); } });
    const fa = $('#fqadd'); if (fa) fa.onclick = () => faqModal();
    $$('[data-fe]').forEach((b) => (b.onclick = () => faqModal(b.dataset.fe, (faqs.find((f) => f.key === b.dataset.fe) || {}).value)));
    $$('[data-fd]').forEach((b) => (b.onclick = async () => { await DEL(`/memory/kudzi_faq/${encodeURIComponent(b.dataset.fd)}`).catch(fail); viewKudzi(); }));
    $$('[data-teach]').forEach((b) => (b.onclick = () => faqModal(b.dataset.teach.toLowerCase().replace(/[?.!]/g, '').split(/\s+/).filter((w) => w.length > 3).slice(0, 3).join(', '), '')));
  }

  /* ════════════════════════ MEMORY ════════════════════════ */
  async function viewMemory() {
    const rows = await GET('/memory'), scopes = [...new Set(rows.map((r) => r.scope))];
    let scope = '';
    V(`<div class="notice info" style="margin-bottom:16px"><b>Persistent memory</b>: notes, settings and Kudzi's FAQs, kept in the school database and in every backup zip, so they survive restarts. Scopes group entries: <code>kudzi_faq</code> (Kudzi's answers), <code>settings</code> (portal settings), <code>notes</code> (anything you want to remember).</div>
      <div class="toolbar"><div class="chips" id="ms"><button data-s="" aria-pressed="true">All</button>${scopes.map((s) => `<button data-s="${esc(s)}" aria-pressed="false">${esc(s)}</button>`).join('')}</div><span class="grow"></span><button class="btn primary" id="madd" type="button">${ic('plus')}New entry</button></div><div id="mlist"></div>`);
    const draw = () => { const r = rows.filter((x) => !scope || x.scope === scope); $('#mlist').innerHTML = r.length ? `<div class="table-wrap"><table class="t"><thead><tr><th>Scope</th><th>Key</th><th>Value</th><th>Updated</th><th></th></tr></thead><tbody>${r.map((m, i) => `<tr><td><span class="tag">${esc(m.scope)}</span></td><td><b>${esc(m.key)}</b></td><td style="max-width:420px;white-space:pre-line">${esc(String(m.value).slice(0, 300))}</td><td class="muted">${esc(m.updated_by || '')} · ${ago(m.updated_at)}</td><td class="r"><div class="row-acts"><button class="btn sm" data-i="${rows.indexOf(m)}" type="button">Edit</button><button class="btn sm danger" data-d="${rows.indexOf(m)}" type="button">Delete</button></div></td></tr>`).join('')}</tbody></table></div>` : '<div class="card empty"><b>Nothing remembered yet</b></div>';
      $$('[data-i]').forEach((b) => (b.onclick = () => edit(rows[b.dataset.i]))); $$('[data-d]').forEach((b) => (b.onclick = async () => { const m = rows[b.dataset.d]; if (await confirmBox('Delete this entry?', `${esc(m.scope)} / ${esc(m.key)}`, 'Delete')) { await DEL(`/memory/${encodeURIComponent(m.scope)}/${encodeURIComponent(m.key)}`).catch(fail); viewMemory(); } })); };
    const edit = (m) => modal(m ? 'Edit memory' : 'Remember something', `${field('scope', 'Scope', { value: m ? m.scope : 'notes', hint: 'lowercase, e.g. notes, kudzi_faq', attrs: m ? 'readonly' : '' })}${field('key', 'Key', { value: m && m.key, attrs: m ? 'readonly' : '' })}${field('value', 'Value', { type: 'textarea', value: m && m.value })}`,
      { onOk: async (mm) => { await PUT('/memory', readForm(mm.el)); toast('Remembered.', 'ok'); viewMemory(); } });
    $$('#ms button').forEach((b) => (b.onclick = () => { scope = b.dataset.s; $$('#ms button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
    $('#madd').onclick = () => edit(null);
    draw();
  }

  /* ════════════════════════ BACKUPS & SYNC ════════════════════════ */
  async function viewBackups() {
    const { status: s, items } = await GET('/backups');
    const host = location.origin;
    V(`<div class="grid">
      <section class="card s8"><div class="card-h"><h2>Everything, in one zip</h2><span class="r"><span class="tag gold">data v${s.data_version}</span></span></div>
        <p class="muted" style="margin-top:0">Each backup holds the whole database plus every table as a spreadsheet (CSV) and JSON. A new one is made automatically a minute after any change.</p>
        <div class="split"><button class="btn gold" id="bzip" type="button">${ic('down')}Download everything (.zip)</button><button class="btn" id="bnow" type="button">${ic('backups')}Back up now</button>
          <button class="btn" id="bcloud" type="button" ${s.cloud_enabled ? '' : 'disabled title="Add HF_TOKEN and HF_BACKUP_REPO first"'}>${ic('cloud')}Copy to cloud now</button>
          ${S.me.role === 'owner' || S.me.role === 'admin' ? `<label class="btn" style="cursor:pointer">${ic('up')}Restore from a zip<input type="file" id="bup" accept=".zip,application/zip" hidden></label>` : ''}</div>
        <hr class="sep"><dl class="kv"><dt>School instance</dt><dd><code>${esc(s.instance_id)}</code></dd><dt>Last change</dt><dd>${ago(s.last_change_at)}</dd><dt>Space backup</dt><dd>${s.last_local ? `${esc(s.last_local.name)} · ${ago(s.last_local.at)}` : 'none yet'} (${s.local_count} kept)</dd>
          <dt>Cloud backup</dt><dd>${s.cloud_enabled ? `${esc(s.cloud_repo)} · ${s.last_cloud ? `v${s.last_cloud.data_version}, ${ago(s.last_cloud.at)}` : 'not pushed yet'}` : '<span class="tag warn">off</span>'}${s.cloud_error ? `<br><span style="color:var(--bad)">${esc(s.cloud_error)}</span>` : ''}</dd>
          <dt>Last restore</dt><dd>${s.restored_from ? `${esc(s.restored_from.name)} (${esc(s.restored_from.reason)}) · ${ago(s.restored_from.at)}` : 'never'}</dd><dt>Storage</dt><dd>${esc(s.data_dir)} · ${bytes(s.db_bytes)} · ${s.persistent_disk ? '<span class="tag ok">permanent disk</span>' : '<span class="tag warn">temporary disk: rely on backups</span>'}</dd></dl></section>
      <section class="card s4"><h2>How the memory survives</h2><ul class="checks">
        <li><span class="ic y">1</span><div><b>Space</b>: a zip a minute after each change, the last 40 kept.</div></li>
        <li><span class="ic ${s.cloud_enabled ? 'y' : 'n'}">2</span><div><b>Cloud</b>: a private Hugging Face dataset. On a restart the hub restores from it by itself.</div></li>
        <li><span class="ic ${s.sync_key_set ? 'y' : 'n'}">3</span><div><b>School PC + Google Drive</b>: the PC agent saves every new zip into a Google Drive folder, and on start-up puts the newest copy back if the Space lost its data.</div></li></ul></section>
      <section class="card s12"><h2>Backups on the Space</h2><div class="table-wrap"><table class="t"><thead><tr><th>File</th><th>Made</th><th>Why</th><th class="r">Version</th><th class="r">Learners</th><th class="r">Size</th><th></th></tr></thead><tbody>
        ${items.map((b) => `<tr><td><code>${esc(b.name)}</code>${b.damaged ? ' <span class="tag bad">damaged</span>' : ''}</td><td>${ago(b.at)}</td><td>${esc(b.reason || '')}</td><td class="r num">${b.data_version ?? '—'}</td><td class="r num">${(b.counts || {}).learners ?? '—'}</td><td class="r num">${bytes(b.bytes)}</td>
          <td class="r"><div class="row-acts"><button class="btn sm" data-dl="${esc(b.name)}" type="button">${ic('down')}</button>${S.me.role === 'owner' || S.me.role === 'admin' ? `<button class="btn sm" data-rs="${esc(b.name)}" type="button">Restore</button>` : ''}<button class="btn sm danger" data-rm="${esc(b.name)}" type="button">${ic('x')}</button></div></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No backups yet.</td></tr>'}</tbody></table></div></section>
      <section class="card s7"><h2>School PC agent (Google Drive)</h2><p class="muted" style="margin-top:0">On the office PC, install Python and <a href="https://www.google.com/drive/download/" target="_blank" rel="noopener">Google Drive for desktop</a>, unzip <code>karlissa-pc-sync.zip</code>, then:</p>
<pre><code>python karlissa_sync.py setup
  Hub address : ${esc(host)}
  Sync key    : (the SYNC_KEY secret)
  Folder      : G:\\My Drive\\Royal Crest Backups
python karlissa_sync.py install    # start with Windows
python karlissa_sync.py run        # resume + keep pulling</code></pre>
        <p class="hint">Endpoints it uses: <code>GET /api/v1/admin/backup/status</code>, <code>GET /api/v1/admin/backup/export</code> and <code>PUT /api/v1/admin/backup/restore</code>, with the header <code>X-Sync-Key</code>.</p></section>
      <section class="card s5"><h2>Spreadsheets</h2><p class="muted" style="margin-top:0">Any table as a CSV for Excel:</p><div class="split">${['learners', 'parents', 'guardians', 'results', 'attendance', 'payments', 'fee_items', 'notices', 'registrations', 'assignments', 'chats', 'audit'].map((t) => `<button class="btn sm" data-csv="${t}" type="button">${t}</button>`).join('')}</div></section></div>`);
    const again = () => viewBackups();
    $('#bzip').onclick = (e) => busy(e.currentTarget, () => download('/backup/export', 'royal-crest-backup.zip'));
    $('#bnow').onclick = (e) => busy(e.currentTarget, async () => { const r = await POST('/backups'); toast(`Backup made: <b>${esc(r.name)}</b>`, 'ok'); again(); });
    $('#bcloud').onclick = (e) => busy(e.currentTarget, async () => { await POST('/backup/cloud'); toast('Copied to the cloud.', 'ok'); again(); });
    const up = $('#bup');
    if (up) up.onchange = async () => {
      const f = up.files[0]; if (!f) return;
      if (!(await confirmBox('Restore this backup?', `Everything in the hub is replaced by <b>${esc(f.name)}</b>. A safety backup of the current data is made first.`, 'Restore'))) { up.value = ''; return; }
      try { const r = await api('PUT', '/backup/restore', f, { type: 'application/zip' }); toast(`Restored data version ${r.data_version}.`, 'ok'); await refreshLookups(); again(); } catch (e) { fail(e); }
    };
    $$('[data-dl]').forEach((b) => (b.onclick = () => busy(b, () => download(`/backups/${encodeURIComponent(b.dataset.dl)}`, b.dataset.dl))));
    $$('[data-rs]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Restore this backup?', `Everything is replaced by <b>${esc(b.dataset.rs)}</b>. A safety backup is made first.`, 'Restore')) { await busy(b, async () => { const r = await POST(`/backups/${encodeURIComponent(b.dataset.rs)}/restore`); toast(`Restored data version ${r.data_version}.`, 'ok'); await refreshLookups(); again(); }); } }));
    $$('[data-rm]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Delete this backup file?', esc(b.dataset.rm), 'Delete')) { await DEL(`/backups/${encodeURIComponent(b.dataset.rm)}`).catch(fail); again(); } }));
    $$('[data-csv]').forEach((b) => (b.onclick = () => busy(b, () => download(`/export/${b.dataset.csv}.csv`, `${b.dataset.csv}.csv`))));
  }

  /* ════════════════════════ ACTIVITY ════════════════════════ */
  async function viewPeople() {
    const ss = await GET('/sessions');
    V(`<div class="grid"><section class="card s12"><h2>Signed in now</h2><div class="table-wrap"><table class="t"><thead><tr><th>Who</th><th>Type</th><th>Last seen</th><th>Signed in</th><th>Device</th><th></th></tr></thead><tbody>
      ${ss.map((s) => `<tr><td><b>${esc(s.name)}</b><br><small class="muted">${esc(s.subject)}</small></td><td><span class="tag">${esc(s.kind)}</span></td><td>${ago(s.last_seen_iso)}</td><td class="muted">${ago(s.created_at)}</td><td class="muted" style="max-width:260px">${esc(s.ip)} · ${esc((s.ua || '').slice(0, 60))}</td><td class="r"><button class="btn sm danger" data-k="${esc(s.kind)}" data-s="${esc(s.subject)}" type="button">Sign out</button></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Nobody.</td></tr>'}</tbody></table></div></section>
      <section class="card s12"><div class="card-h"><h2>Audit log</h2><span class="r"><input type="search" id="aq" placeholder="Filter…" style="width:220px"></span></div><div id="alog"></div><div class="split" style="margin-top:10px"><button class="btn sm" id="amore" type="button">Older →</button></div></section></div>`);
    $$('[data-k]').forEach((b) => (b.onclick = async () => { await DEL(`/sessions/${b.dataset.k}/${encodeURIComponent(b.dataset.s)}`).catch(fail); viewPeople(); }));
    let off = 0, q = '';
    const load = async () => { const rows = await GET(`/audit?limit=100&offset=${off}${q ? `&q=${encodeURIComponent(q)}` : ''}`); $('#alog').innerHTML = `<div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Item</th><th>Detail</th><th>IP</th></tr></thead><tbody>${rows.map((r) => `<tr><td class="muted" title="${esc(r.at)}">${fmtDate(r.at, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</td><td>${esc(r.actor)}</td><td><code>${esc(r.action)}</code></td><td>${esc(r.target)}</td><td class="muted" style="max-width:320px">${esc(String(r.detail || '').slice(0, 160))}</td><td class="muted">${esc(r.ip || '')}</td></tr>`).join('') || '<tr><td class="muted" colspan="6">Nothing.</td></tr>'}</tbody></table></div>`; };
    let t = null; $('#aq').oninput = (e) => { q = e.target.value.trim(); off = 0; clearTimeout(t); t = setTimeout(load, 250); };
    $('#amore').onclick = () => { off += 100; load(); };
    await load();
  }

  /* ════════════════════════ STAFF ════════════════════════ */
  const ROLE_HELP = { owner: 'Everything, including staff accounts', admin: 'Everything except staff accounts', teacher: 'Marks, register, timetable, homework, notices, Kudzi', bursar: 'Fees and payments; reads learners and families' };
  async function viewStaff() {
    const rows = await GET('/staff');
    V(`<div class="toolbar"><span class="hint">The built-in <code>admin</code> account always works with the ADMIN_PASSWORD secret.</span><span class="grow"></span><button class="btn primary" id="sadd" type="button">${ic('plus')}Add staff member</button></div>
      <div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Last sign-in</th><th>Status</th><th></th></tr></thead><tbody>${rows.map((s) => `<tr><td><b>${esc(s.name)}</b></td><td><code>${esc(s.username)}</code></td><td>${esc(s.role)}<br><small class="muted">${esc(ROLE_HELP[s.role])}</small></td><td class="muted">${ago(s.last_login)}</td><td>${s.active ? '<span class="tag ok">active</span>' : '<span class="tag">off</span>'}</td><td class="r"><div class="row-acts"><button class="btn sm" data-e="${s.id}" type="button">Edit</button><button class="btn sm danger" data-d="${s.id}" type="button">Remove</button></div></td></tr>`).join('') || '<tr><td colspan="6" class="muted">Only the built-in admin so far. Give each teacher and the bursar their own account so the audit log shows who did what.</td></tr>'}</tbody></table></div>`);
    const edit = (s) => modal(s ? `Edit ${s.name}` : 'Add a staff member', `<div class="form-grid">${field('name', 'Full name', { value: s && s.name, required: true })}${field('username', 'Username', { value: s && s.username, required: true, attrs: s ? 'readonly' : '' })}
      ${field('role', 'Role', { value: s ? s.role : 'teacher', options: Object.keys(ROLE_HELP).map((r) => [r, `${r}: ${ROLE_HELP[r]}`]), full: true })}${field('password', s ? 'New password (leave empty to keep)' : 'Password', { type: 'password', hint: 'At least 8 characters.' })}${field('active', 'Account active', { type: 'checkbox', value: s ? s.active : true })}</div>`,
    { onOk: async (m) => { const b = nul(readForm(m.el)); if (s) await PUT(`/staff/${s.id}`, b); else await POST('/staff', b); toast('Saved.', 'ok'); viewStaff(); } });
    $('#sadd').onclick = () => edit(null);
    $$('[data-e]').forEach((b) => (b.onclick = () => edit(rows.find((x) => String(x.id) === b.dataset.e))));
    $$('[data-d]').forEach((b) => (b.onclick = async () => { if (await confirmBox('Remove this account?', 'They are signed out at once.', 'Remove')) { await DEL(`/staff/${b.dataset.d}`).catch(fail); viewStaff(); } }));
  }

  /* ════════════════════════ SETTINGS ════════════════════════ */
  async function viewSettings() {
    const s = await GET('/settings'), e = s.env;
    const chk = (ok, title, text) => `<li><span class="ic ${ok ? 'y' : 'n'}">${ok ? '✓' : '!'}</span><div><b>${title}</b><br><span class="muted">${text}</span></div></li>`;
    V(`<div class="grid">
      <section class="card s6"><h2>Portal</h2><form id="sf">${field('portal_url', 'Portal address', { value: s.portal_url, hint: '“Open in portal” and WhatsApp messages use this.' })}${field('registration_open', 'Parents can register online', { type: 'checkbox', value: s.registration_open === '1' })}</form>
        ${can('settings') ? '<button class="btn primary" id="ssave" type="button">Save</button>' : ''}<hr class="sep">
        <p class="eyebrow">How families sign in</p><p class="muted" style="margin-top:4px">Username: the learner's <b>admission number</b>. Password: the <b>parent's phone number</b> as the school has it (any format: 0771 234 567 or +263 77 123 4567). Learners use the same until they set their own. Parents can change it on the portal.</p></section>
      <section class="card s6"><h2>Space checklist</h2><ul class="checks">
        ${chk(e.admin_password_set, 'ADMIN_PASSWORD secret', e.admin_password_set ? 'set: the built-in admin account works' : 'missing: set it so you can always get in')}
        ${chk(e.sync_key_set, 'SYNC_KEY secret', e.sync_key_set ? 'set: the school PC agent can back up and restore' : 'missing: needed for the PC + Google Drive agent')}
        ${chk(e.cloud_backup, 'Cloud backup (HF_TOKEN + HF_BACKUP_REPO)', e.cloud_backup ? `on: ${esc(e.cloud_repo)}` : 'off: without it, a Space restart relies on the PC agent')}
        ${chk(e.persistent_disk, 'Permanent disk', e.persistent_disk ? 'attached at /data' : 'not attached (fine with cloud backup on)')}
        ${chk(e.kudzi_ai === 'ollama', 'Kudzi AI brain (KUDZI_LLM=ollama)', e.kudzi_ai === 'ollama' ? 'on: open questions go to this Space’s model' : 'off: Kudzi uses records, rules and your FAQs')}
        ${chk(true, 'Portal origins (CORS)', e.portal_origins.map(esc).join('<br>'))}</ul></section>
      <section class="card s6"><h2>School details</h2><dl class="kv"><dt>Name</dt><dd>${esc(s.school.name)}</dd><dt>Address</dt><dd>${esc(s.school.address)}</dd><dt>Email</dt><dd>${esc(s.school.email)}</dd><dt>Phones</dt><dd>${s.school.phones.map((p) => `${esc(p.label)}: ${esc(p.number)}`).join('<br>')}</dd><dt>Sign-in lasts</dt><dd>${e.session_days} days</dd></dl></section>
      ${can('settings') ? `<section class="card s6"><h2>Demo data</h2><p class="muted" style="margin-top:0">Two sample learners (Tanaka and Rufaro Moyo) and their mother, to try everything safely. Remove them before real learners go in.</p><div class="split"><button class="btn danger" id="ddel" type="button">Remove demo data</button><button class="btn" id="dadd" type="button">Load demo data</button></div></section>` : ''}</div>`);
    const sv = $('#ssave'); if (sv) sv.onclick = (ev) => busy(ev.currentTarget, async () => { const b = readForm($('#sf')); await PUT('/settings', { portal_url: b.portal_url, registration_open: b.registration_open ? '1' : '0' }); toast('Settings saved.', 'ok'); });
    const dd = $('#ddel'); if (dd) dd.onclick = async () => { if (await confirmBox('Remove all demo data?', 'Removes the demo learners, their parent, marks, notices and the demo terms.', 'Remove')) { const r = await DEL('/demo').catch(fail); if (r) toast(`${r.removed_learners} demo learners removed.`, 'ok'); await refreshLookups(); } };
    const da = $('#dadd'); if (da) da.onclick = (ev) => busy(ev.currentTarget, async () => { await POST('/demo'); toast('Demo data loaded.', 'ok'); await refreshLookups(); });
  }
  function changeMyPassword() {
    modal('Change my password', `${field('current', 'Current password', { type: 'password' })}${field('new', 'New password', { type: 'password', hint: 'At least 8 characters.' })}`,
      { onOk: async (m) => { await POST('/me/password', readForm(m.el)); toast('Password changed.', 'ok'); } });
  }

  const VIEWS = { overview: () => loadOverview(), learners: viewLearners, parents: viewParents, registrations: viewRegistrations, results: viewResults, attendance: viewAttendance,
    timetable: viewTimetable, homework: viewHomework, fees: viewFees, notices: viewNotices, kudzi: viewKudzi, memory: viewMemory, backups: viewBackups, people: viewPeople,
    staff: viewStaff, settings: viewSettings };

  /* ── jump palette (Ctrl K) ── */
  async function palette() {
    if ($('.cmdk') || !S.me) return;
    const box = document.createElement('div'); box.className = 'cmdk';
    box.innerHTML = '<div class="cmdk-box" role="dialog" aria-label="Find"><input type="text" placeholder="Type a learner, parent phone or page…" aria-label="Find"><div class="cmdk-list" role="listbox"></div></div>';
    document.body.appendChild(box);
    const input = $('input', box), list = $('.cmdk-list', box); let sel = 0, items = [];
    const close = () => box.remove();
    if (!S.learners) S.learners = await GET('/learners?status=all').catch(() => []);
    const pages = PAGES.flatMap(([, ps]) => ps).filter(([, , p]) => !p || can(p)).map(([k, l]) => ({ label: l, hint: 'Page', run: () => (location.hash = `#/${k}`) }));
    const render = () => {
      const q = input.value.trim().toLowerCase();
      const ls = (S.learners || []).filter((l) => q && (`${l.first} ${l.last}`.toLowerCase().includes(q) || l.id.toLowerCase().includes(q))).slice(0, 8).map((l) => ({ label: `${l.first} ${l.last} · ${l.id}`, hint: `Form ${l.form}`, run: () => { location.hash = '#/learners'; setTimeout(() => learnerDrawer(l.id), 250); } }));
      items = [...ls, ...pages.filter((p) => !q || p.label.toLowerCase().includes(q))];
      if (q.replace(/\D/g, '').length >= 6) items.unshift({ label: `Find parent with phone “${input.value.trim()}”`, hint: 'Families', run: () => { location.hash = '#/parents'; setTimeout(() => { const i = $('#pq'); if (i) { i.value = input.value.trim(); i.dispatchEvent(new Event('input')); } }, 300); } });
      sel = Math.max(0, Math.min(sel, items.length - 1));
      list.innerHTML = items.map((it, i) => `<button type="button" role="option" aria-selected="${i === sel}">${esc(it.label)}<small>${esc(it.hint)}</small></button>`).join('') || '<div class="muted" style="padding:12px">Nothing found.</div>';
      $$('button', list).forEach((b, i) => (b.onclick = () => { close(); items[i].run(); }));
    };
    input.oninput = () => { sel = 0; render(); };
    input.onkeydown = (e) => {
      if (e.key === 'ArrowDown') { sel = Math.min(items.length - 1, sel + 1); render(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); render(); e.preventDefault(); }
      if (e.key === 'Enter' && items[sel]) { close(); items[sel].run(); }
      if (e.key === 'Escape') close();
    };
    box.onclick = (e) => { if (e.target === box) close(); };
    render(); input.focus();
  }
  $('#jump').onclick = palette;
  document.addEventListener('keydown', (e) => {
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); palette(); }
    if (e.key === 'Escape') { const m = $$('.modal, .drawer').pop(); if (m && !$('.cmdk')) { $$('.scrim').pop().remove(); m.remove(); } }
  });

  boot();
})();
