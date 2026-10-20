/* Crest Quest — Royal Crest Academy learner & parent portal. */
(() => {
  const C = window.RC_CONFIG, API = window.RC_API, CH = window.RC_CHARTS, BOT = window.RC_CRESTBOT, { esc } = CH;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  if (C.EMBED) document.body.classList.add('embed');

  const I = {
    overview: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/>',
    results: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    attendance: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13"/>',
    timetable: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    skills: '<path d="M12 2l3 6 6 .9-4.5 4.3 1 6.3L12 16.6 6.5 19.5l1-6.3L3 8.9 9 8z"/>',
    fees: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>',
    notices: '<path d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path d="M10.5 20a2 2 0 0 0 3 0"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    star: '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  };
  const icon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[k]}</svg>`;
  const ROUTES = [
    ['overview', 'Overview'], ['results', 'Results'], ['attendance', 'Attendance'], ['timetable', 'Timetable'],
    ['skills', 'Skills'], ['fees', 'Fees'], ['notices', 'Notices'],
  ];
  const TABS = ['overview', 'results', 'timetable', 'skills', 'fees'];
  const initials = (n) => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const fmt = (iso, o = { day: 'numeric', month: 'short' }) => new Date(iso + 'T00:00').toLocaleDateString('en-GB', o);
  const money = (n) => `US$${Number(n).toLocaleString('en-US')}`;
  const today = () => (API.live() ? new Date().toISOString().slice(0, 10) : window.RC_MOCK.TODAY);

  const state = { user: null, ids: [], id: null, cache: {}, notices: [], term: null, bot: null };

  /* ───────────── sign-in ───────────── */
  function showSignin(err) {
    $('#app').hidden = true; $('#signin').hidden = false;
    if (state.bot) { state.bot.destroy(); state.bot = null; }
    const form = $('#si-form'), roleBtns = $$('.seg button');
    let role = 'parent';
    const setRole = (r) => {
      role = r; roleBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.role === r)));
      $('#si-id-label').textContent = r === 'parent' ? 'Parent phone number' : 'Admission number';
      $('#si-id').placeholder = r === 'parent' ? 'e.g. 0771 234 567' : 'e.g. RCA-27-0142';
      $('#si-id').inputMode = r === 'parent' ? 'tel' : 'text';
    };
    roleBtns.forEach((b) => (b.onclick = () => setRole(b.dataset.role)));
    setRole(role);
    $('#si-err').textContent = err || '';
    form.onsubmit = async (e) => {
      e.preventDefault();
      const btn = form.querySelector('button[type=submit]'); btn.disabled = true; btn.textContent = 'Signing in…';
      try {
        await API.login({ role, identifier: $('#si-id').value.replace(/\s/g, ''), pin: $('#si-pin').value });
        $('#si-pin').value = ''; boot();
      } catch (ex) { $('#si-err').textContent = ex.message || 'Could not sign in.'; } finally { btn.disabled = false; btn.textContent = 'Sign in'; }
    };
    $('#demo').hidden = !(C.DEMO && !API.live());
    $$('#demo [data-demo]').forEach((b) => (b.onclick = () => {
      const r = b.dataset.demo, d = API.DEMO_LOGINS[r]; setRole(r);
      $('#si-id').value = d.identifier; $('#si-pin').value = d.pin; form.requestSubmit();
    }));
    BOT.sprite($('#si-bot'));
  }

  /* ───────────── app shell ───────────── */
  async function boot() {
    if (!API.session) return showSignin();
    try { state.user = await API.me(); } catch (e) { return showSignin(); }
    state.ids = state.user.students; state.id = state.id && state.ids.includes(state.id) ? state.id : state.ids[0];
    $('#signin').hidden = true; $('#app').hidden = false;
    shell();
    try { state.notices = await API.notices(); } catch (e) { state.notices = []; }
    await loadStudent(state.id);
    if (!state.bot) state.bot = BOT.mount(ctx);
    notifyNative({ type: 'rc-portal-ready', role: state.user.role, students: state.ids });
    route();
  }
  function shell() {
    const nav = ROUTES.map(([k, l]) => `<a href="#/${k}" data-r="${k}">${icon(k)}<span>${l}</span></a>`).join('');
    $('#app').innerHTML = `
      <aside class="side">
        <a class="logo" href="${C.SITE}"><img src="/assets/img/crest-128.webp" alt=""><span><b>Crest Quest</b><small>Royal Crest Academy</small></span></a>
        <nav class="nav" aria-label="Portal">${nav}</nav>
        <div class="side-app"><b>On your phone?</b>Get alerts for marks, notices and fees in the Royal Crest Connect app.<br><a href="${C.APP_DEEP_LINK}/overview">Open the app →</a></div>
        <button class="signout" type="button">Sign out · ${esc(state.user.name)}</button>
      </aside>
      <div class="main">
        <header class="top">
          <h1 id="page-title">Overview</h1>
          ${state.ids.length > 1 ? `<div class="kids" role="group" aria-label="Choose child">${state.ids.map((id) => `<button class="kid" data-id="${esc(id)}" type="button"><span class="av">··</span><span class="kname">…</span></button>`).join('')}</div>` : ''}
          ${API.live() ? '' : '<span class="badge-demo" title="Sample data: nothing here is a real learner">Demo</span>'}
          <button class="search" type="button" aria-label="Search or ask Kudzi">${icon('search')}<span>Search or ask Kudzi</span><kbd>Ctrl K</kbd></button>
        </header>
        <main class="content" id="view" tabindex="-1"></main>
      </div>
      <nav class="tabbar" aria-label="Sections">${TABS.map((k) => `<a href="#/${k}" data-r="${k}">${icon(k)}<span>${ROUTES.find((r) => r[0] === k)[1]}</span></a>`).join('')}</nav>`;
    $('.signout').onclick = async () => { await API.logout(); state.cache = {}; location.hash = ''; showSignin(); };
    $('.search').onclick = palette;
    $$('.kid').forEach((b) => (b.onclick = async () => { state.id = b.dataset.id; await loadStudent(state.id); if (state.bot) state.bot.reset(); route(); }));
  }
  async function loadStudent(id) {
    if (!state.cache[id]) {
      $('#view').innerHTML = '<div class="grid"><div class="skel span-12" style="min-height:180px"></div><div class="skel span-4"></div><div class="skel span-4"></div><div class="skel span-4"></div><div class="skel span-8" style="min-height:260px"></div><div class="skel span-4" style="min-height:260px"></div></div>';
      const [p, results, attendance, timetable, assignments, skills, fees] = await Promise.all([
        API.student(id), API.results(id), API.attendance(id), API.timetable(id), API.assignments(id), API.skills(id), API.fees(id)]);
      state.cache[id] = { ...p, results, attendance, timetable, assignments, skills, fees };
    }
    const s = state.cache[id];
    state.term = (s.results.filter((r) => r.published).slice(-1)[0] || s.results[0]);
    $$('.kid').forEach((b) => {
      const k = state.cache[b.dataset.id];
      b.setAttribute('aria-pressed', String(b.dataset.id === id));
      if (k) { b.querySelector('.av').textContent = initials(k.name); b.querySelector('.kname').textContent = k.first; }
    });
    // fill names of the other children lazily
    state.ids.filter((x) => !state.cache[x]).forEach(async (x) => {
      const k = await API.student(x), b = $(`.kid[data-id="${CSS.escape(x)}"]`);
      if (b) { b.querySelector('.av').textContent = initials(k.name); b.querySelector('.kname').textContent = k.first; }
    });
  }
  const S = () => state.cache[state.id];
  const ctx = () => ({ role: state.user.role, student: S(), term: state.term, attendance: S().attendance, assignments: S().assignments, fees: S().fees,
    timetable: S().timetable, skills: S().skills, notices: state.notices, today: today() });

  /* ───────────── router ───────────── */
  function route() {
    if (!state.user || !S()) return;
    const k = (location.hash.replace(/^#\//, '').split('?')[0] || 'overview');
    const r = ROUTES.find((x) => x[0] === k) || ROUTES[0];
    $$('[data-r]').forEach((a) => (a.dataset.r === r[0] ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current')));
    $('#page-title').textContent = r[0] === 'overview' ? (state.user.role === 'parent' ? `${S().first}'s progress` : `Welcome back, ${S().first}`) : r[1];
    document.title = `${r[1]} · Crest Quest · ${C.SCHOOL}`;
    $('#view').innerHTML = VIEWS[r[0]]();
    after[r[0]] && after[r[0]]();
    $$('#view [data-route]').forEach((el) => el.addEventListener('click', () => (location.hash = el.dataset.route)));
    $$('#view canvas[data-bot]').forEach((cv) => BOT.sprite(cv));
    $('#view').focus({ preventScroll: true }); scrollTo(0, 0);
    notifyNative({ type: 'rc-route', route: r[0] });
  }
  window.addEventListener('hashchange', route);
  window.addEventListener('rc:signed-out', () => showSignin('Your session ended. Please sign in again.'));

  /* ───────────── views ───────────── */
  const avg = (subs) => Math.round(subs.reduce((a, b) => a + b.total, 0) / (subs.length || 1));
  const att = (days) => { const n = (k) => days.filter((d) => d.status === k).length; return { n, rate: (n('present') + n('late')) / (days.length || 1) }; };
  const dateTile = (iso) => `<div class="date-tile"><b>${new Date(iso + 'T00:00').getDate()}</b><span>${fmt(iso, { month: 'short' })}</span></div>`;
  const pending = () => S().assignments.filter((a) => a.status === 'pending').sort((a, b) => a.due.localeCompare(b.due));

  const VIEWS = {
    overview() {
      const s = S(), t = state.term, a = att(s.attendance), parent = state.user.role === 'parent', next = s.skills.find((k) => k.status === 'locked');
      const due = pending(), dueSoon = due.filter((d) => (new Date(d.due) - new Date(today())) / 864e5 <= 7).length;
      const tip = parent ? `${s.first} has <b>${dueSoon}</b> task${dueSoon === 1 ? '' : 's'} due this week. Ask me anything!` : `You have <b>${dueSoon}</b> task${dueSoon === 1 ? '' : 's'} due this week. Keep levelling up!`;
      const xpPct = Math.round((s.xp / s.next_level_xp) * 100);
      return `<div class="grid">
        <section class="card player span-12" aria-label="Learner card">
          <div class="bigav">${initials(s.name)}</div>
          <div>
            <h2>${esc(s.name)}</h2>
            <div class="meta">${esc(s.form)} · ${esc(s.stream)} · ${esc(s.house)} House · ${esc(s.residence)}${s.hostel ? ` (${esc(s.hostel)})` : ''} · ${esc(s.admission_no)}</div>
            <div class="xp"><div class="xp-top"><span>LVL ${s.level}</span><span>${s.xp.toLocaleString()} / ${s.next_level_xp.toLocaleString()} XP</span></div><div class="xp-bar"><i style="width:${xpPct}%"></i></div></div>
            <div class="chips-row"><span class="pill">★ ${s.merits} merits</span><span class="pill">${s.demerits} demerit${s.demerits === 1 ? '' : 's'}</span>${next ? `<span class="pill">🔒 Next unlock: ${esc(next.trade)}</span>` : ''}</div>
          </div>
          <div class="pbot"><div class="tip">${tip}</div><canvas class="px" data-bot width="130"></canvas></div>
        </section>
        <div class="card span-3 stat">${CH.ring(avg(t.subjects) / 100, { label: `${avg(t.subjects)}%` })}<div><b>Average</b><span>${esc(t.label)}</span></div></div>
        <div class="card span-3 stat"><div class="ico">${icon('star')}</div><div><b>${s.position}<small class="muted" style="font-size:18px"> / ${s.class_size}</small></b><span>Class position · ${esc(s.stream)}</span></div></div>
        <div class="card span-3 stat" data-route="#/attendance" style="cursor:pointer">${CH.ring(a.rate, { label: `${Math.round(a.rate * 100)}%` })}<div><b>Attendance</b><span>${a.n('absent')} absent · ${a.n('late')} late</span></div></div>
        ${parent
          ? `<div class="card span-3 stat" data-route="#/fees" style="cursor:pointer"><div class="ico">${icon('fees')}</div><div><b>${money(s.fees.balance)}</b><span>${s.fees.balance > 0 ? `Balance · due ${fmt(s.fees.due)}` : 'Fees fully paid ✓'}</span></div></div>`
          : `<div class="card span-3 stat" data-route="#/timetable" style="cursor:pointer"><div class="ico">${icon('timetable')}</div><div><b>${esc(nextLesson().subject)}</b><span>Next lesson · ${esc(nextLesson().start)} · ${esc(nextLesson().room)}</span></div></div>`}
        <section class="card span-8"><h2>Progress this term <a href="#/results">All results →</a></h2>${CH.line(s.trend, innerWidth < 700 ? { w: 360, h: 230 } : {})}</section>
        <section class="card span-4"><h2>Due soon</h2><ul class="list">${due.slice(0, 4).map((d) => `<li>${dateTile(d.due)}<div class="li-main"><b>${esc(d.title)}</b><span>${esc(d.subject)}</span></div></li>`).join('') || '<li class="muted">Nothing due. 🎉</li>'}</ul></section>
        <section class="card span-8"><h2>Subjects · ${esc(t.label)} <a href="#/results">Details →</a></h2>${CH.bars(t.subjects)}<p class="muted" style="font-size:12.5px;margin:12px 0 0">The thin line on each bar is the class average.</p></section>
        <section class="card span-4"><h2>Notices <a href="#/notices">All →</a></h2><ul class="list">${state.notices.slice(0, 3).map((n) => `<li>${dateTile(n.date)}<div class="li-main"><b>${esc(n.title)}</b><span>${esc(n.tag)}</span></div></li>`).join('')}</ul></section>
      </div>`;
    },
    results() {
      const s = S();
      return `<div class="tabs" role="group" aria-label="Term">${s.results.map((r) => `<button type="button" data-term="${esc(r.term)}" aria-pressed="${r.term === state.term.term}">${esc(r.label)}</button>`).join('')}</div><div id="res"></div>`;
    },
    attendance() {
      const s = S(), a = att(s.attendance), odd = s.attendance.filter((d) => d.status !== 'present').slice(-8).reverse();
      return `<div class="grid">
        <div class="card span-4 stat">${CH.ring(a.rate, { label: `${Math.round(a.rate * 100)}%`, size: 110 })}<div><b>${a.n('present')} / ${s.attendance.length}</b><span>days present this term</span></div></div>
        <div class="card span-8"><h2>At a glance</h2><div class="summary"><div><b>${a.n('present')}</b><span>Present</span></div><div><b>${a.n('late')}</b><span>Late</span></div><div><b>${a.n('absent')}</b><span>Absent</span></div><div><b>${a.n('excused')}</b><span>Excused</span></div></div></div>
        <section class="card span-12"><h2>Term calendar</h2>${CH.heat(s.attendance)}
          <div class="legend"><span><i class="h-present"></i>Present</span><span><i class="h-late"></i>Late</span><span><i class="h-absent"></i>Absent</span><span><i class="h-excused"></i>Excused</span></div></section>
        <section class="card span-12"><h2>Recent absences and late arrivals</h2><ul class="list">${odd.map((d) => `<li>${dateTile(d.date)}<div class="li-main"><b>${fmt(d.date, { weekday: 'long', day: 'numeric', month: 'long' })}</b><span>Marked by the class register</span></div><span class="tag ${d.status === 'absent' ? 'bad' : d.status === 'late' ? 'warn' : ''}">${d.status}</span></li>`).join('') || '<li class="muted">Perfect attendance so far. ⭐</li>'}</ul></section>
      </div>`;
    },
    timetable() {
      const s = S(), dname = new Date(today() + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3), nl = nextLesson();
      const rows = s.timetable[0].periods.map((p, i) => `<tr><td class="time">${p.start}</td>${s.timetable.map((d) => {
        const q = d.periods[i], cls = d.day === dname ? (q.start === nl.start && nl.today ? 'today now' : 'today') : '';
        return `<td class="${cls}"><b>${esc(q.subject)}</b><span>${esc(q.room)}</span></td>`; }).join('')}</tr>`).join('');
      return `<section class="card"><h2>This week</h2><div class="table-wrap"><table class="tt"><thead><tr><th></th>${s.timetable.map((d) => `<th class="${d.day === dname ? 'today' : ''}">${d.day}</th>`).join('')}</tr></thead><tbody>${rows}</tbody></table></div></section>`;
    },
    skills() {
      const s = S(), act = s.skills.find((k) => k.status === 'active');
      return `<div class="grid"><section class="card arcade span-12"><h2>&gt; skill tree · ${esc(s.first)}_</h2>
        <div class="bot-side"><canvas class="px" data-bot width="130"></canvas><div>LVL ${s.level} · ${s.xp.toLocaleString()} XP<br>${act ? `NOW PLAYING: ${esc(act.trade.toUpperCase())}` : 'ALL TRADES COMPLETE'}<br>ONE NEW TRADE UNLOCKS EVERY YEAR</div></div>
        <div class="tree">${s.skills.map((k) => `<div class="node ${k.status}"><small>${k.status === 'locked' ? '▣ LOCKED' : k.status === 'done' ? '✔ COMPLETE' : '★ IN PROGRESS'} · FORM ${k.form}</small><b>${esc(k.trade)}</b><div class="nb"><i style="width:${Math.round(k.progress * 100)}%"></i></div>${k.badge ? `<span class="badge">Badge: ${esc(k.badge)}</span>` : ''}</div>`).join('')}</div>
      </section></div>`;
    },
    fees() {
      const f = S().fees, paidPct = Math.round((f.paid / f.invoiced) * 100);
      return `<div class="grid">
        <section class="card span-6"><h2>Balance · ${esc(f.term)}</h2><div class="bal ${f.balance ? '' : 'zero'}">${money(f.balance)}</div>
          <div class="prog"><i style="width:${paidPct}%"></i></div><p class="muted" style="margin:0 0 16px">${money(f.paid)} paid of ${money(f.invoiced)} · ${f.balance ? `due ${fmt(f.due, { day: 'numeric', month: 'long', year: 'numeric' })}` : 'fully paid, thank you'}</p>
          <div class="callout">Pay at the bursar's office or through the Royal Crest Connect app. Always ask for an official receipt for every payment.</div>
          <p style="margin:16px 0 0;display:flex;gap:10px;flex-wrap:wrap"><a class="btn btn-primary btn-sm" href="${C.APP_DEEP_LINK}/fees?student=${encodeURIComponent(S().id)}">Open in the app</a><a class="btn btn-ghost btn-sm" href="tel:${C.PHONE.replace(/\s/g, '')}">${icon('phone')}Call the bursar</a></p></section>
        <section class="card span-6"><h2>Termly fees (all-inclusive)</h2><table class="lines">${f.lines.map(([k, v]) => `<tr><td>${esc(k)}</td><td>${money(v)}</td></tr>`).join('')}<tr class="tot"><td>Total per term</td><td>${money(f.invoiced)}</td></tr></table></section>
        <section class="card span-12"><h2>Payments received</h2><ul class="list">${f.payments.map((p) => `<li>${dateTile(p.date)}<div class="li-main"><b>${money(p.amount)}</b><span>${esc(p.method)} · receipt ${esc(p.ref)}</span></div><span class="tag ok">Received</span></li>`).join('')}</ul></section>
      </div>`;
    },
    notices() {
      return `<div class="grid">${state.notices.map((n) => `<article class="card span-12 notice">${dateTile(n.date)}<div><span class="tag">${esc(n.tag)}</span><h3>${esc(n.title)}</h3><p>${esc(n.body)}</p></div></article>`).join('')}</div>`;
    },
  };
  const after = {
    results() {
      const draw = () => {
        const t = state.term, subs = t.subjects;
        if (!t.published) { $('#res').innerHTML = `<div class="card"><h2>${esc(t.label)}</h2><p class="muted" style="margin:0">Results for this term are not published yet. Kudzi will let you know when they are.</p></div>`; return; }
        const url = API.reportUrl(S().id, t.term);
        $('#res').innerHTML = `<div class="card"><div class="summary"><div><b>${avg(subs)}%</b><span>Average</span></div><div><b>${S().position} / ${S().class_size}</b><span>Class position</span></div><div><b>${subs.filter((x) => x.grade === 'A').length}</b><span>A grades</span></div><div><b>${esc(S().class_teacher)}</b><span>Class teacher</span></div>
          <div style="margin-left:auto">${url ? `<a class="btn btn-ghost btn-sm" href="${esc(url)}">Download report (PDF)</a>` : '<span class="muted" style="font-size:13px">PDF report available once connected to the school server</span>'}</div></div>
          <div class="table-wrap"><table class="res"><thead><tr><th>Subject</th><th>CA /40</th><th>Exam /60</th><th>Total</th><th>Grade</th><th>vs class</th><th>Teacher's comment</th></tr></thead><tbody>
          ${subs.map((x) => { const d = x.total - x.class_avg; return `<tr><td><b>${esc(x.name)}</b><br><span class="muted" style="font-size:12.5px">${esc(x.teacher)}</span></td><td class="num">${x.ca}</td><td class="num">${x.exam}</td><td class="num">${x.total}%</td><td><em class="grade g-${x.grade}">${x.grade}</em></td><td><span class="vs ${d >= 0 ? 'up' : 'down'}">${d >= 0 ? '▲' : '▼'} ${Math.abs(d)}</span></td><td class="cmt">${esc(x.comment)}</td></tr>`; }).join('')}
          </tbody></table></div></div>`;
      };
      $$('.tabs button').forEach((b) => (b.onclick = () => { state.term = S().results.find((r) => r.term === b.dataset.term); $$('.tabs button').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); draw(); }));
      draw();
    },
  };
  function nextLesson() {
    const d = new Date(today() + 'T00:00'), name = d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3);
    const row = S().timetable.find((r) => r.day === name), now = API.live() ? new Date().toTimeString().slice(0, 5) : '10:05';
    if (row) { const p = row.periods.find((q) => q.start >= now); if (p) return { ...p, today: true }; }
    return { ...S().timetable[0].periods[0], today: false };
  }

  /* ───────────── command palette (Ctrl/⌘ K, or "/") ───────────── */
  function palette() {
    if ($('.cmdk')) return;
    const box = document.createElement('div'); box.className = 'cmdk';
    box.innerHTML = '<div class="cmdk-box" role="dialog" aria-label="Search"><input type="text" placeholder="Go to a page, switch child, or ask Kudzi…" aria-label="Search"><div class="cmdk-list" role="listbox"></div></div>';
    document.body.appendChild(box);
    const input = $('input', box), list = $('.cmdk-list', box); let sel = 0, items = [];
    const close = () => box.remove();
    const render = () => {
      const q = input.value.trim().toLowerCase();
      items = [
        ...ROUTES.map(([k, l]) => ({ label: l, hint: 'Page', run: () => (location.hash = `#/${k}`) })),
        ...state.ids.filter((id) => id !== state.id && state.cache[id]).map((id) => ({ label: `Switch to ${state.cache[id].name}`, hint: 'Child', run: () => $(`.kid[data-id="${CSS.escape(id)}"]`).click() })),
        ...S().results.flatMap((r) => r.subjects).filter((x, i, a) => a.findIndex((y) => y.name === x.name) === i).map((x) => ({ label: `${x.name} marks`, hint: 'Ask Kudzi', run: () => state.bot.ask(`How am I doing in ${x.name}?`) })),
      ].filter((it) => !q || it.label.toLowerCase().includes(q));
      if (q) items.push({ label: `Ask Kudzi: “${input.value.trim()}”`, hint: 'Crestbot', run: () => state.bot.ask(input.value.trim()) });
      sel = Math.min(sel, items.length - 1);
      list.innerHTML = items.map((it, i) => `<button type="button" role="option" aria-selected="${i === sel}">${esc(it.label)}<small>${esc(it.hint)}</small></button>`).join('');
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
  document.addEventListener('keydown', (e) => {
    if (!state.user || $('#app').hidden) return;
    if ((e.key === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !/input|textarea/i.test(document.activeElement.tagName))) { e.preventDefault(); palette(); }
  });

  /* ───────────── Royal Crest Connect app bridge (WebView) ─────────────
   * The Android app can sign the user in and steer the portal without a second login:
   *   window.RCPortal.setSession({ token, user })  or postMessage({ type: 'rc-auth', token, user })
   *   window.RCPortal.navigate('fees')              or postMessage({ type: 'rc-navigate', route: 'fees' })
   *   postMessage({ type: 'rc-device', platform: 'android', push_token })  → POST /api/v1/devices
   * The portal reports back through window.AndroidBridge.postMessage(json) or ReactNativeWebView. */
  function notifyNative(msg) {
    const json = JSON.stringify(msg);
    try { if (window.AndroidBridge && window.AndroidBridge.postMessage) window.AndroidBridge.postMessage(json); } catch (e) { /* not in the app */ }
    try { if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(json); } catch (e) { /* not in the app */ }
  }
  window.RCPortal = {
    setSession(s) { API.setSession(s); state.cache = {}; boot(); },
    navigate(r) { location.hash = `#/${r}`; },
    ask(q) { if (state.bot) state.bot.ask(q); },
  };
  window.addEventListener('message', (e) => {
    const m = e.data && typeof e.data === 'object' ? e.data : (() => { try { return JSON.parse(e.data); } catch (x) { return null; } })();
    if (!m || !m.type) return;
    if (m.type === 'rc-auth' && m.token) window.RCPortal.setSession({ token: m.token, user: m.user || null });
    if (m.type === 'rc-navigate' && m.route) window.RCPortal.navigate(m.route);
    if (m.type === 'rc-device' && m.push_token) API.registerDevice({ platform: m.platform || 'android', push_token: m.push_token, student_ids: state.ids }).catch(() => {});
  });

  boot();
})();
