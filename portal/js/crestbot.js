/* Kudzi — the Crestbot assistant ("Kudzi" is short for Kudzai: honour, in Shona).
 * Draws the pixel Crestbot, runs the chat drawer and answers from the learner's own data.
 * When an API is configured, questions go to POST /api/v1/crestbot/chat first and this
 * local brain only answers if that server is unreachable. */
(() => {
  const { esc } = window.RC_CHARTS;
  const PAL = { N: '#3b5bd6', G: '#f2b705', W: '#ffffff', K: '#071640', D: '#2a44b0' };
  const OPEN = ['.GG.......GG.', 'G..G.....G..G', 'G.GG.....GG.G'];
  const SHUT = ['..GG.....GG..', '.GGGG...GGGG.', '.GGGG...GGGG.'];
  const BODY = ['.GNNNNNNNNNG.', '..NNWKNWKNN..', '..NNNNNNNNN..', '.NNNGGGGGNNN.', 'N.NNNNNNNNN.N'];
  const BLINK = '..NNDDNDDNN..';
  const LEGS = [['..N.N...N.N..', '.N..N...N..N.'], ['.N.N.....N.N.', '..N..N.N..N..']];

  // draw a frame of the sprite onto a canvas (13 x 10 cells)
  function frame(cv, t, { mood = 'idle' } = {}) {
    const g = cv.getContext('2d'), px = cv.width / 13;
    g.clearRect(0, 0, cv.width, cv.height);
    const chomp = mood === 'talk' ? Math.floor(t * 8) % 2 === 0 : Math.floor(t * 1.2) % 5 === 0;
    const blink = (t % 3.4) < .14;
    const rows = [...(chomp ? SHUT : OPEN), BODY[0], blink ? BLINK : BODY[1], ...BODY.slice(2), ...LEGS[Math.floor(t * (mood === 'talk' ? 6 : 2)) % 2]];
    const bob = Math.round(Math.sin(t * (mood === 'talk' ? 9 : 2.4)) * (px * .12));
    rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== '.') { g.fillStyle = PAL[c]; g.fillRect(i * px, j * px + bob + px * .2, px, px); } }));
  }
  const sprites = new Set();
  function sprite(cv, opts = {}) { cv.width = cv.width || 130; cv.height = cv.width * 11 / 13; sprites.add({ cv, opts }); return cv; }
  let t0 = performance.now();
  (function loop(now) { const t = Math.max(0, now - t0) / 1000; sprites.forEach((s) => { if (!s.cv.isConnected) { sprites.delete(s); return; } frame(s.cv, t, s.opts); }); requestAnimationFrame(loop); })(t0);

  // ── the local brain ──
  const pct = (n) => `${Math.round(n)}%`;
  const avg = (subs) => subs.reduce((s, x) => s + x.total, 0) / (subs.length || 1);
  const day = (iso) => new Date(iso + 'T00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  const TIPS = {
    titration: 'Titration finds an unknown concentration. Fill the burette, read the bottom of the meniscus at eye level, and add drop by drop while swirling. The end point is the first permanent colour change: pale pink with phenolphthalein. Repeat until two titres agree within 0.10 cm³, then average them.',
    revise: 'Try 25-minute focus blocks with 5-minute breaks, then test yourself with past papers instead of re-reading notes. Explain each topic out loud, as if teaching a friend. That is the fastest way to find gaps.',
  };

  function brain(msg, ctx) {
    const m = msg.toLowerCase().trim(), s = ctx.student, me = ctx.role === 'learner';
    const who = me ? 'you' : s.first, your = me ? 'your' : `${s.first}'s`, Your = me ? 'Your' : `${s.first}'s`;
    const subs = ctx.term ? ctx.term.subjects : [];
    const sorted = [...subs].sort((a, b) => b.total - a.total);
    const subject = subs.find((x) => m.includes(x.name.toLowerCase()) || m.includes(x.name.toLowerCase().split(' ')[0]) || m.includes(x.code.toLowerCase() + ' '));
    const has = (re) => re.test(m);

    if (has(/^(hi|hello|hey|mhoro|makadii|good (morning|afternoon|evening))\b/)) return { text: `Hello${me ? ` ${s.first}` : ''}! I'm Kudzi, the Crestbot. Ask me about ${your} marks, homework, timetable, attendance${ctx.role === 'parent' ? ' or fees' : ''}.`, chips: true };
    if (has(/help|what can you|who are you/)) return { text: `I can tell ${who} about: term marks and grades, the best and weakest subjects, homework due, today's lessons, attendance, ${ctx.role === 'parent' ? 'fees balance, ' : ''}skills progress and school notices. I can also give quick study tips, e.g. "explain titration".`, chips: true };
    if (has(/titrat/)) return { text: TIPS.titration };
    if (has(/revis|study tip|how (do|can) i study|exam prep/)) return { text: TIPS.revise };
    if (subject) {
      const diff = subject.total - subject.class_avg;
      return { text: `${subject.name}: **${subject.total}%** (grade ${subject.grade}). CA ${subject.ca}/40, exam ${subject.exam}/60, class average ${subject.class_avg}%, so ${diff >= 0 ? `${Math.abs(diff)} points above` : `${Math.abs(diff)} points below`} average. ${subject.teacher} says: “${subject.comment}”`, actions: [{ label: 'Open results', route: '#/results' }] };
    }
    if (has(/best|strongest|top subject|favourite/)) return { text: `${Your} strongest subjects are ${sorted.slice(0, 3).map((x) => `${x.name} (${x.total}%)`).join(', ')}. 🏆` };
    if (has(/weak|worst|improve|struggl|lowest|fail/)) {
      const low = sorted.slice(-2).reverse();
      return { text: `${me ? 'Focus' : `${s.first} could focus`} on ${low.map((x) => `${x.name} (${x.total}%)`).join(' and ')}. Tip: ask ${low[0].teacher} for past-paper practice, and 20 minutes a day on it makes a real difference.`, actions: [{ label: 'See all subjects', route: '#/results' }] };
    }
    if (has(/average|how (am i|is|are)|perform|overall|progress|doing|marks|results|grade/)) {
      const tr = s.trend, delta = tr[tr.length - 1].avg - tr[0].avg;
      return { text: `${Your} ${ctx.term.label} average is **${pct(avg(subs))}**, ${delta >= 0 ? `up ${delta} points` : `down ${-delta} points`} since week 2. Position ${s.position} of ${s.class_size} in ${s.stream}. Best: ${sorted[0].name} (${sorted[0].total}%).`, actions: [{ label: 'View trend', route: '#/overview' }] };
    }
    if (has(/position|rank|place|number in class/)) return { text: `${Your} class position is **${s.position} of ${s.class_size}** in ${s.stream}.` };
    if (has(/homework|assignment|due|deadline|task/)) {
      const open = ctx.assignments.filter((a) => a.status === 'pending').sort((a, b) => a.due.localeCompare(b.due));
      return open.length ? { text: `${open.length} task${open.length > 1 ? 's' : ''} due:\n${open.map((a) => `• ${day(a.due)}: ${a.subject}, ${a.title}`).join('\n')}`, actions: [{ label: 'Open overview', route: '#/overview' }] } : { text: 'Nothing due right now. 🎉' };
    }
    if (has(/fee|balance|owe|pay|invoice|money/)) {
      const f = ctx.fees;
      return { text: f.balance > 0 ? `${f.term}: invoiced US$${f.invoiced}, paid US$${f.paid}. **Balance US$${f.balance}** (due ${day(f.due)}). Pay at the bursar's office or on the RCA Portal app.` : `${f.term} fees are fully paid (US$${f.paid}). Thank you! ✅`, actions: [{ label: 'Open fees', route: '#/fees' }] };
    }
    if (has(/attend|absent|late|present|missed|bunk/)) {
      const a = ctx.attendance, n = (k) => a.filter((d) => d.status === k).length, rate = (n('present') + n('late')) / a.length;
      return { text: `Attendance this term: **${pct(rate * 100)}**. ${n('present')} present, ${n('late')} late, ${n('absent')} absent, ${n('excused')} excused out of ${a.length} school days.`, actions: [{ label: 'Open attendance', route: '#/attendance' }] };
    }
    if (has(/today|tomorrow|timetable|lesson|schedule|next class|period/)) {
      const d = new Date(ctx.today + 'T00:00'); if (has(/tomorrow/)) d.setDate(d.getDate() + 1);
      const name = d.toLocaleDateString('en-GB', { weekday: 'short' }).slice(0, 3), row = ctx.timetable.find((r) => r.day === name);
      return row ? { text: `${has(/tomorrow/) ? 'Tomorrow' : 'Today'} (${name}):\n${row.periods.map((p) => `• ${p.start} ${p.subject} · ${p.room}`).join('\n')}`, actions: [{ label: 'Full timetable', route: '#/timetable' }] } : { text: 'No lessons that day. Enjoy the weekend!' };
    }
    if (has(/skill|trade|bak|weld|solar|carpent|cosmet|xp|level|badge/)) {
      const act = ctx.skills.find((k) => k.status === 'active');
      return { text: `Level ${s.level}, ${s.xp.toLocaleString()} XP (${s.next_level_xp - s.xp} to level ${s.level + 1}). ${act ? `Current trade: **${act.trade}**, ${pct(act.progress * 100)} complete.` : ''} Next to unlock: ${(ctx.skills.find((k) => k.status === 'locked') || {}).trade || 'all unlocked!'}.`, actions: [{ label: 'Open skill tree', route: '#/skills' }] };
    }
    if (has(/notice|news|event|visit|announcement/)) return { text: ctx.notices.slice(0, 3).map((n) => `• ${day(n.date)}: ${n.title}`).join('\n'), actions: [{ label: 'All notices', route: '#/notices' }] };
    if (has(/contact|phone|call|whatsapp|office/)) return { text: `School office: ${window.RC_CONFIG.PHONE} (call or WhatsApp). Class teacher: ${s.class_teacher}.` };
    if (has(/thank|thanks|ndatenda/)) return { text: 'Any time! Keep levelling up. 👑' };
    return { text: `I'm still learning that one. When my full AI brain goes live I'll handle open questions too. For now, try one of these:`, chips: true };
  }

  // ── chat drawer ──
  function mount(getCtx) {
    const root = document.createElement('div');
    root.className = 'kudzi';
    root.innerHTML = `
      <button class="kudzi-fab" type="button" aria-expanded="false" aria-controls="kudzi-panel"><canvas width="52"></canvas><span>Ask Kudzi</span></button>
      <section class="kudzi-panel" id="kudzi-panel" role="dialog" aria-label="Kudzi, the Crestbot assistant" hidden>
        <header><canvas width="44"></canvas><div><b>Kudzi</b><small class="kz-status"></small></div><button type="button" class="kz-close" aria-label="Close">✕</button></header>
        <div class="kz-log" role="log" aria-live="polite"></div>
        <div class="kz-chips"></div>
        <form class="kz-form"><input type="text" autocomplete="off" placeholder="Ask about marks, homework, fees…" aria-label="Message Kudzi"><button type="submit" aria-label="Send">➤</button></form>
      </section>`;
    document.body.appendChild(root);
    const fab = root.querySelector('.kudzi-fab'), panel = root.querySelector('.kudzi-panel'), log = root.querySelector('.kz-log');
    const chips = root.querySelector('.kz-chips'), form = root.querySelector('.kz-form'), input = form.querySelector('input');
    sprite(fab.querySelector('canvas'));
    const head = { cv: sprite(panel.querySelector('header canvas')), opts: {} };
    [...sprites].find((s) => s.cv === head.cv).opts = head.opts;
    root.querySelector('.kz-status').textContent = window.RC_API.live() ? 'Crestbot assistant · online' : 'Crestbot assistant · demo brain';
    const history = [];

    const SUGGEST = () => (getCtx().role === 'parent'
      ? ['How is my child doing?', 'Fees balance', 'Homework due', 'Attendance', 'Weakest subject']
      : ['How am I doing?', 'What is due this week?', "Today's lessons", 'My skill progress', 'Explain titration']);
    function setChips() { chips.innerHTML = SUGGEST().map((c) => `<button type="button">${esc(c)}</button>`).join(''); }
    const md = (t) => esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>');
    function bubble(who, text, actions) {
      const el = document.createElement('div'); el.className = `kz-msg ${who}`;
      el.innerHTML = `<p>${md(text)}</p>${actions && actions.length ? `<div class="kz-acts">${actions.map((a) => `<a href="${esc(a.route)}">${esc(a.label)} →</a>`).join('')}</div>` : ''}`;
      log.appendChild(el); log.scrollTop = log.scrollHeight;
      el.querySelectorAll('.kz-acts a').forEach((a) => a.addEventListener('click', () => { if (innerWidth < 760) toggle(false); }));
    }
    async function ask(text) {
      if (!text.trim()) return;
      bubble('me', text); history.push({ role: 'user', content: text }); input.value = '';
      const typing = document.createElement('div'); typing.className = 'kz-msg bot typing'; typing.innerHTML = '<p><i></i><i></i><i></i></p>'; log.appendChild(typing); log.scrollTop = log.scrollHeight;
      head.opts.mood = 'talk';
      const ctx = getCtx();
      let out;
      try {
        const r = await window.RC_API.crestbot({ student_id: ctx.student.id, message: text, history: history.slice(-10), client: window.RC_CONFIG.EMBED ? 'app' : 'web' });
        out = { text: r.reply, actions: r.actions, chips: !!r.suggestions };
      } catch (e) {
        await new Promise((r) => setTimeout(r, 380 + Math.min(900, text.length * 12)));
        out = brain(text, ctx);
      }
      typing.remove(); head.opts.mood = 'idle';
      bubble('bot', out.text, out.actions); history.push({ role: 'assistant', content: out.text });
      setChips();
    }
    function toggle(open) {
      open = open ?? panel.hidden; panel.hidden = !open; fab.setAttribute('aria-expanded', String(open)); root.classList.toggle('open', open);
      if (open && !log.children.length) { const c = getCtx(); bubble('bot', c.role === 'parent' ? `Mhoro! I'm Kudzi, the Crestbot. 👋 Ask me anything about ${c.student.first}'s progress.` : `Mhoro ${c.student.first}! I'm Kudzi, your Crestbot. 👋 What would you like to check?`); setChips(); }
      if (open) setTimeout(() => input.focus(), 50);
    }
    fab.addEventListener('click', () => toggle());
    root.querySelector('.kz-close').addEventListener('click', () => toggle(false));
    chips.addEventListener('click', (e) => { if (e.target.tagName === 'BUTTON') ask(e.target.textContent); });
    form.addEventListener('submit', (e) => { e.preventDefault(); ask(input.value); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panel.hidden) toggle(false); });
    return { open: () => toggle(true), ask: (t) => { toggle(true); ask(t); }, reset: () => { log.innerHTML = ''; history.length = 0; }, destroy: () => root.remove() };
  }

  window.RC_CRESTBOT = { sprite, mount, brain };
})();
