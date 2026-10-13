/* Royal Crest Flyer Studio — flyer engine.
 *
 * buildModel()  turns a subject, molecule, activity (club / sport / indoor
 *               game) or series poster plus a flyer kind into one content
 *               shape that every template understands.
 * buildFlyer()  renders that model into a fixed-size DOM node in one of the
 *               seven templates and four formats. Series posters have their
 *               own fixed designs (from the school's brief).
 * fitFlyer()    shrinks headline and body text until nothing overflows its
 *               box, and drops list items that still do not fit, so long
 *               content never collides with other elements.
 * caption()     writes a ready-to-paste WhatsApp / Facebook caption.
 *
 * Every format is laid out at 1080 px wide; export scales it up (A4 at
 * 300 dpi = 2480 x 3508 px). Used by the studio page and the batch renderer.
 */
(function () {
  'use strict';

  const FORMATS = {
    square:   { label: 'Square post',     note: '1080 × 1080 · Instagram, Facebook', w: 1080, h: 1080, scale: 1 },
    portrait: { label: 'Portrait post',   note: '1080 × 1350 · Instagram feed 4:5',  w: 1080, h: 1350, scale: 1 },
    story:    { label: 'Story / Status',  note: '1080 × 1920 · WhatsApp & Instagram', w: 1080, h: 1920, scale: 1 },
    a4:       { label: 'A4 print',        note: '2480 × 3508 · 300 dpi printing',     w: 1080, h: 1528, scale: 2480 / 1080 },
  };

  const TEMPLATES = {
    prospectus: { label: 'Prospectus', note: 'Ivory and serif, like the website' },
    royal:      { label: 'Royal',      note: 'Navy band, gold banner, rounded cards' },
    stadium:    { label: 'Stadium',    note: 'Gold stripes, big condensed type' },
    labsheet:   { label: 'Lab Sheet',  note: 'Technical drawing sheet with title block' },
    block:      { label: 'Bold Block', note: 'Swiss poster: navy block, big type' },
    notebook:   { label: 'Exercise Book', note: 'Ruled paper and teacher’s red pen' },
    element:    { label: 'Element',    note: 'Periodic-table tile on navy' },
  };

  const KINDS = {
    spotlight: { label: 'Subject spotlight', short: 'Spotlight', n: 1 },
    tutoring:  { label: 'Private lessons',   short: 'Tutoring',  n: 2 },
    fact:      { label: 'Did you know?',     short: 'Fun fact',  n: 3 },
    tip:       { label: 'Exam tip',          short: 'Exam tip',  n: 4 },
    quiz:      { label: 'Quick quiz',        short: 'Quiz',      n: 5 },
    answer:    { label: 'Quiz answer',       short: 'Answer',    n: 6 },
    molecule:  { label: 'Molecule of the week', short: 'Molecule', n: 7 },
    series:    { label: 'Poster',            short: 'Poster',    n: 8 },
  };

  // The six posters from the school's brief. Text on these is fixed and
  // spelled exactly as supplied; they ignore the template choice.
  const SERIES = {
    catalogue:      { label: 'Clubs, Sports & Indoor Games', formats: ['a4', 'portrait', 'story'] },
    cover:          { label: 'Beyond the Classroom',          formats: ['a4', 'portrait', 'story', 'square'] },
    'clubs-minds':  { label: 'Our Clubs: Minds & Cultures',   formats: ['a4', 'portrait', 'story', 'square'] },
    'clubs-skills': { label: 'Our Clubs: Skills & Creativity', formats: ['a4', 'portrait', 'story', 'square'] },
    sports:         { label: 'Sports at Royal Crest',         formats: ['a4', 'portrait', 'story', 'square'] },
    indoor:         { label: 'Indoor Games',                  formats: ['a4', 'portrait', 'story', 'square'] },
  };

  const LETTERS = ['A', 'B', 'C', 'D'];
  const GROUP_KIND_LABEL = { clubs: 'Club spotlight', sports: 'Sport spotlight', indoor: 'Indoor games' };

  // ------------------------------------------------------------------ helpers
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  function el(tag, cls, html) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function quizModel(m, name, q) {
    m.kicker = `${name} quick quiz`;
    m.title = esc(q.q);
    m.listStyle = 'options';
    m.list = q.options.map(esc);
    m.answer = { letter: LETTERS[q.answer], text: esc(q.options[q.answer]), explain: esc(q.explain) };
    m.body = 'Think you know it? The answer is upside down.';
    m.cta = 'Share your answer, then check below';
  }

  function answerModel(m, name, q) {
    // The second slide of a two-picture quiz post: question first, answer next.
    m.kicker = `${name} quiz · the answer`;
    m.title = `${LETTERS[q.answer]}. ${esc(q.options[q.answer])}`;
    m.subtitle = esc(q.q);
    m.body = esc(q.explain);
    m.listStyle = 'none';
    m.list = [];
    m.cta = 'Did you get it right? New quiz every week';
  }

  // ------------------------------------------------------------------ model
  /* opts: index, svg (molecule drawing), icon (activity icon svg),
   *       photo (resolved photo URL or null), type ('activity' | 'series'),
   *       series (for series: { acts: {id: {..., icon, photo}}, photos }) */
  function buildModel(brand, item, kind, opts = {}) {
    const m = { kind, kindLabel: KINDS[kind].label, brand };
    const tut = brand.tutoring || {};

    if (kind === 'series') {
      m.id = item.id;
      m.series = item.id;
      m.subjectName = SERIES[item.id].label;
      m.title = esc(SERIES[item.id].label);
      m.acts = opts.acts || {};
      m.fallbackPhotos = opts.fallbackPhotos || [];
      m.dept = { name: 'Royal Crest', accent: '#0A1F5C' };
      m.fileBase = `poster-${item.id}`;
      return m;
    }

    if (kind === 'molecule') {
      const mol = item;
      m.id = mol.id;
      m.subjectName = 'Chemistry';
      m.symbol = 'Ch';
      m.number = mol.molar_mass.toFixed(2);
      m.levels = 'O & A Level';
      m.dept = brand.departments.sciences;
      m.deptKey = 'sciences';
      m.kicker = `Chemistry · ${mol.group}`;
      m.title = esc(mol.display);
      // Long IUPAC names (capsaicin's runs to 60 characters) read as noise on a flyer.
      const iupacUseful = mol.iupac.toLowerCase() !== mol.display.toLowerCase() && mol.iupac.length <= 34;
      m.subtitle = mol.aka ? `Also called ${esc(mol.aka)}` : iupacUseful ? `IUPAC name: ${esc(mol.iupac)}` : `Family: ${esc(mol.group)}`;
      m.body = esc(mol.fact);
      m.listStyle = 'rows';
      m.list = [
        ['Formula', mol.formula_html],
        ['Molar mass', `${mol.molar_mass.toFixed(2)} g/mol`],
        ['Family', `${esc(mol.group)}: ${esc(mol.group_note)}`],
        ['Used for', esc(mol.use)],
      ];
      m.visual = { type: 'molecule', svg: opts.svg || '', aspect: mol.aspect, label: mol.group_key === 'alkane' || mol.group_key === 'purine' ? null : `Highlighted: ${mol.group.toLowerCase()} group` };
      m.formula = mol.formula_html;
      m.source = `Data: PubChem CID ${mol.cid} · Structure: RDKit`;
      m.cta = 'Learn chemistry with us from 1 January 2027';
      m.sheet = `RCA-CH-M${String(opts.index ?? 0).padStart(2, '0')}`;
      m.fileBase = `molecule-${mol.id}`;
      return m;
    }

    if (opts.type === 'activity') {
      const a = item;
      const dept = brand.departments[a.group];
      m.id = a.id;
      m.subjectName = a.short;
      m.symbol = a.symbol;
      m.number = String(opts.index ?? 0);
      m.levels = 'All forms';
      m.dept = dept;
      m.deptKey = a.group;
      m.sheet = `RCA-${a.symbol.toUpperCase()}-${String(KINDS[kind].n).padStart(2, '0')}`;
      m.fileBase = `${a.id}-${kind}`;
      m.visual = opts.photo
        ? { type: 'photo', src: opts.photo, alt: '', slot: a.id, slotLabel: a.short }
        : { type: 'icon', svg: opts.icon || '', slot: a.id, slotLabel: a.short };
      switch (kind) {
        case 'spotlight':
          m.kindLabel = GROUP_KIND_LABEL[a.group];
          // Long official names ("Mandarin Connect (Chinese Language for
          // Beginners)") go in the kicker; the headline uses the short name.
          m.kicker = a.name !== a.short ? a.name : `${dept.name} · Royal Crest Academy`;
          m.title = esc(a.short);
          m.subtitle = esc(a.tagline);
          m.body = esc(a.summary);
          m.listStyle = 'bullets';
          m.listTitle = 'What you’ll do';
          m.list = a.doing.map(esc);
          m.cta = 'Join us from 1 January 2027';
          break;
        case 'fact':
          m.kicker = `${a.short} · ${dept.name}`;
          m.title = 'Did you know?';
          m.body = esc(a.fact);
          m.listStyle = 'none';
          m.list = [];
          m.cta = `Try ${a.short} at Royal Crest`;
          break;
        case 'quiz': quizModel(m, a.short, a.quiz); break;
        case 'answer': answerModel(m, a.short, a.quiz); break;
      }
      return m;
    }

    const s = item;
    const dept = brand.departments[s.dept];
    m.id = s.id;
    m.subjectName = s.name;
    m.symbol = s.symbol;
    m.number = String(opts.index ?? 0);
    m.levels = s.levels;
    m.dept = dept;
    m.deptKey = s.dept;
    m.sheet = `RCA-${s.symbol.toUpperCase()}-${String(KINDS[kind].n).padStart(2, '0')}`;
    m.fileBase = `${s.id}-${kind}`;
    m.visual = { type: 'photo', src: opts.photo || brand.photos[s.photo] || brand.photos.campus, alt: '', slot: s.id, slotLabel: s.name };

    switch (kind) {
      case 'spotlight':
        m.kicker = `${dept.name} · ${s.levels}`;
        m.title = esc(s.name);
        m.subtitle = esc(s.tagline) + (s.tagline_en ? ` <span class="fl-gloss">${esc(s.tagline_en)}</span>` : '');
        m.body = esc(s.summary);
        m.listStyle = 'bullets';
        m.listTitle = 'What you will study';
        m.list = s.topics.map(esc);
        m.cta = 'Register for 1 January 2027';
        break;
      case 'tutoring':
        m.kicker = `${s.name} tutoring`;
        m.title = esc(s.tutoring.headline);
        m.subtitle = `${esc(s.name)} · ${esc(tut.levels || s.levels)}`;
        m.body = [tut.format, tut.schedule, tut.fee].filter(Boolean).map(esc).join(' · ') + '. ZIMSEC & Cambridge aligned.';
        m.listStyle = 'bullets';
        m.listTitle = 'We help with';
        m.list = s.tutoring.focus.map(esc);
        m.cta = 'Book a lesson on WhatsApp';
        break;
      case 'fact':
        m.kicker = `${s.name} · ${dept.name}`;
        m.title = 'Did you know?';
        m.body = esc(s.fact);
        m.listStyle = 'none';
        m.list = [];
        m.cta = `Discover ${s.name} at Royal Crest`;
        break;
      case 'tip':
        m.kicker = `${s.name} exam tip`;
        m.title = esc(s.tip.title);
        m.body = esc(s.tip.text);
        m.listStyle = 'none';
        m.list = [];
        m.cta = 'Revise with our specialist teachers';
        break;
      case 'quiz': quizModel(m, s.name, s.quiz); break;
      case 'answer': answerModel(m, s.name, s.quiz); break;
    }
    return m;
  }

  // ------------------------------------------------------------------ DOM
  const crestImg = (brand, cls = 'fl-crest') => `<img class="${cls}" src="${esc(brand.crest)}" alt="">`;

  function sealSvg(brand) {
    // Round seal with the motto set on a circle (homage to the AutoPoster seal).
    const ring = `${brand.school.toUpperCase()} · ${brand.motto.toUpperCase().replace(/ · /g, ' · ')} · `;
    return `<svg class="fl-seal" viewBox="0 0 200 200" aria-hidden="true">
      <defs><path id="sealpath" d="M100,100 m-76,0 a76,76 0 1,1 152,0 a76,76 0 1,1 -152,0"/></defs>
      <circle cx="100" cy="100" r="98" class="seal-ring"/>
      <circle cx="100" cy="100" r="93" class="seal-line"/>
      <circle cx="100" cy="100" r="62" class="seal-line"/>
      <circle cx="100" cy="100" r="60" class="seal-core"/>
      <text class="seal-text"><textPath href="#sealpath" textLength="477" lengthAdjust="spacing">${esc(ring)}</textPath></text>
      <image href="${esc(brand.crest)}" x="62" y="57" width="76" height="86" preserveAspectRatio="xMidYMid meet"/>
    </svg>`;
  }

  const CHECK = '<svg class="li-ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12l5 5l10 -10"/></svg>';

  function listHtml(m) {
    if (m.listStyle === 'none' || !m.list.length) return '';
    if (m.listStyle === 'options') {
      return `<ol class="fl-list fl-options">${m.list.map((t, i) => `<li data-letter="${LETTERS[i]}"><span class="opt-letter">${LETTERS[i]}</span><span class="opt-text">${t}</span></li>`).join('')}</ol>`;
    }
    if (m.listStyle === 'rows') {
      return `<dl class="fl-list fl-rows">${m.list.map(([k, v]) => `<div class="row"><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
    }
    return `<div class="fl-listwrap">${m.listTitle ? `<p class="fl-listtitle">${m.listTitle}</p>` : ''}<ul class="fl-list fl-bullets">${m.list.map((t) => `<li>${CHECK}<span>${t}</span></li>`).join('')}</ul></div>`;
  }

  const slotAttrs = (v) => (v.slot ? ` data-slot="${esc(v.slot)}" data-slot-label="${esc(v.slotLabel || v.slot)}"` : '');

  function visualHtml(m) {
    const v = m.visual;
    if (!v) return '';
    if (v.type === 'molecule') {
      return `<figure class="fl-visual fl-mol" style="--mol-aspect:${v.aspect}">
        <div class="mol-draw">${v.svg}</div>
        ${v.label ? `<figcaption class="mol-label"><span class="mol-swatch"></span>${esc(v.label)}</figcaption>` : ''}
        ${m.source ? `<p class="fl-source">${esc(m.source)}</p>` : ''}
      </figure>`;
    }
    if (v.type === 'icon') {
      return `<figure class="fl-visual fl-icon"${slotAttrs(v)}><span class="ic-wrap">${v.svg}</span></figure>`;
    }
    return `<figure class="fl-visual fl-photo"${slotAttrs(v)}><img src="${esc(v.src)}" alt="${esc(v.alt)}"></figure>`;
  }

  function answerHtml(m) {
    if (!m.answer) return '';
    return `<div class="fl-answer"><span class="ans-label">Answer</span> <strong>${m.answer.letter}. ${m.answer.text}</strong> <span class="ans-explain">${m.answer.explain}</span></div>`;
  }

  function contactHtml(brand) {
    return `<span class="c-phone">${esc(brand.phone)}</span><span class="c-web">${esc(brand.website)}</span>`;
  }

  function addressLine(brand) {
    return [brand.address, ...(brand.phones || [brand.phone])].map((t) => `<span>${esc(t)}</span>`).join('<i class="sep" aria-hidden="true"></i>');
  }

  function buildFlyer(m, template, format) {
    if (m.kind === 'series') return buildSeries(m, format);
    const f = FORMATS[format];
    const b = m.brand;
    const root = el('div', `flyer t-${template} f-${format} k-${m.kind} ${f.h > f.w * 1.05 ? 'is-tall' : 'is-wide'} v-${m.visual?.type || 'none'}`);
    root.style.width = f.w + 'px';
    root.style.height = f.h + 'px';
    root.style.setProperty('--accent', m.dept.accent);
    root.dataset.file = `${m.fileBase}-${template}-${format}`;

    const header = `
      <header class="fl-head">
        <div class="fl-brand">${crestImg(b)}<div class="fl-brandtext"><span class="fl-school">${esc(b.school)}</span><span class="fl-motto">${esc(b.motto)}</span></div></div>
        <span class="fl-kind">${esc(m.kindLabel)}</span>
      </header>`;
    const titleBlock = `
      <div class="fl-titles">
        <p class="fl-kicker">${esc(m.kicker)}</p>
        <h1 class="fl-title" data-fit>${m.title}</h1>
        ${m.subtitle ? `<p class="fl-subtitle">${m.subtitle}</p>` : ''}
      </div>`;
    const body = m.body ? `<p class="fl-body" data-fit>${m.body}</p>` : '';
    const foot = `
      <footer class="fl-foot">
        <span class="fl-cta">${esc(m.cta)}</span>
        <span class="fl-contact">${contactHtml(b)}</span>
      </footer>`;
    const hasSide = m.visual.type === 'molecule' || m.kind === 'spotlight' || m.kind === 'tutoring';

    let inner = '';
    switch (template) {
      case 'royal':
        inner = `
          <header class="ry-band">
            ${crestImg(b, 'ry-crest')}
            <p class="ry-school">${esc(b.school.toUpperCase())}</p>
            <p class="ry-tag">${esc(b.royal?.tagline || b.motto)}</p>
          </header>
          <div class="ry-main">
            <div class="ry-head">
              <p class="ry-pill">${esc(m.kindLabel)}</p>
              <p class="fl-kicker">${esc(m.kicker)}</p>
              <h1 class="fl-title" data-fit>${m.title}</h1>
              ${m.subtitle ? `<p class="fl-subtitle">${m.subtitle}</p>` : ''}
            </div>
            <div class="ry-card">
              <div class="ry-visual">${visualHtml(m)}</div>
              <div class="ry-text">${body}${listHtml(m)}${answerHtml(m)}</div>
            </div>
          </div>
          <div class="ry-banner"><span class="fl-cta">${esc(m.cta)}</span></div>
          <footer class="ry-foot">${addressLine(b)}</footer>`;
        break;

      case 'stadium':
        inner = `
          <div class="sd-stripes" aria-hidden="true"></div>
          <div class="sd-slash" aria-hidden="true"></div>
          ${header}
          <div class="sd-hero">
            <p class="fl-kicker">${esc(m.kicker)}</p>
            <h1 class="fl-title" data-fit>${m.title}</h1>
            ${m.subtitle ? `<p class="fl-subtitle">${m.subtitle}</p>` : ''}
          </div>
          <div class="sd-main">
            <div class="sd-visual">${visualHtml(m)}</div>
            <div class="sd-text">${body}${listHtml(m)}${answerHtml(m)}</div>
          </div>
          <footer class="sd-foot">
            <span class="fl-cta">${esc(m.cta)}</span>
            <span class="fl-contact">${contactHtml(b)}</span>
          </footer>`;
        break;

      case 'labsheet':
        inner = `
          <div class="ls-grid" aria-hidden="true"></div>
          <div class="ls-zones" aria-hidden="true">${['1', '2', '3', '4'].map((z) => `<span>${z}</span>`).join('')}</div>
          <div class="ls-rows" aria-hidden="true">${['A', 'B', 'C', 'D', 'E'].map((z) => `<span>${z}</span>`).join('')}</div>
          <div class="ls-frame">
            <div class="ls-top">
              <div class="ls-titlecol">
                <p class="fl-kicker">${esc(b.school)} / ${esc(m.dept.name)} / Sheet ${esc(m.sheet)}</p>
                <h1 class="fl-title" data-fit>${m.title}</h1>
                ${m.subtitle ? `<p class="fl-subtitle">${m.subtitle}</p>` : ''}
              </div>
              <span class="fl-kind">${esc(m.kindLabel)}</span>
            </div>
            <div class="ls-body">
              <div class="ls-visualbox">${visualHtml(m)}${sealSvg(b)}</div>
              <div class="ls-notes">
                ${body}
                ${listHtml(m)}
                ${answerHtml(m)}
              </div>
            </div>
            <div class="ls-titleblock">
              <div class="tb-cell"><span class="tb-k">Drawn for</span><span class="tb-v">${esc(b.school)}</span></div>
              <div class="tb-cell"><span class="tb-k">${m.deptKey === 'clubs' || m.deptKey === 'sports' || m.deptKey === 'indoor' ? 'Activity' : 'Subject'}</span><span class="tb-v">${esc(m.subjectName)}</span></div>
              <div class="tb-cell"><span class="tb-k">Level</span><span class="tb-v">${esc(m.levels)}</span></div>
              <div class="tb-cell"><span class="tb-k">Sheet</span><span class="tb-v">${esc(m.sheet)}</span></div>
              <div class="tb-cta"><span class="fl-cta">${esc(m.cta)}</span><span class="fl-contact">${contactHtml(b)}</span></div>
            </div>
          </div>`;
        break;

      case 'block':
        inner = `
          <div class="bk-top">
            ${header}
            <span class="bk-symbol" aria-hidden="true">${esc(m.symbol)}</span>
            <div class="bk-titles">
              <span class="bk-bar"></span>
              ${titleBlock}
            </div>
          </div>
          <div class="bk-bottom">
            <div class="bk-left">${body}${m.visual.type === 'molecule' ? visualHtml(m) : ''}${answerHtml(m)}</div>
            <div class="bk-right">${m.visual.type !== 'molecule' && !m.list.length ? visualHtml(m) : ''}${listHtml(m)}</div>
          </div>
          ${foot}`;
        break;

      case 'notebook':
        inner = `
          <div class="nb-paper" aria-hidden="true"></div>
          <div class="nb-content">
            <div class="nb-top">
              <div class="nb-label">
                <div class="nb-line"><span class="nb-k">Name</span><span class="nb-v">${esc(b.school)}</span></div>
                <div class="nb-line"><span class="nb-k">${m.deptKey === 'clubs' || m.deptKey === 'sports' || m.deptKey === 'indoor' ? 'Activity' : 'Subject'}</span><span class="nb-v hand">${esc(m.subjectName)}</span></div>
                <div class="nb-line"><span class="nb-k">Form</span><span class="nb-v hand">${esc(m.levels)}</span></div>
              </div>
              <div class="nb-sticker">${crestImg(b, 'nb-crest')}</div>
            </div>
            <p class="nb-kind hand">${esc(m.kindLabel)}</p>
            <h1 class="fl-title" data-fit>${m.title}</h1>
            ${m.subtitle ? `<p class="fl-subtitle">${m.subtitle}</p>` : ''}
            <div class="nb-main">
              <div class="nb-text">${body}${listHtml(m)}</div>
              ${hasSide ? `<div class="nb-visual">${visualHtml(m)}${m.visual.type === 'molecule' ? '<span class="nb-note hand">← the group to know!</span>' : '<span class="nb-tape"></span><span class="nb-tape nb-tape-2"></span>'}</div>` : ''}
            </div>
            ${answerHtml(m)}
            <div class="nb-foot">
              <span class="nb-mark hand" aria-hidden="true">${m.kind === 'quiz' ? '?/10' : '10/10'}</span>
              <span class="fl-cta">${esc(m.cta)}</span>
              <span class="fl-contact">${contactHtml(b)}</span>
            </div>
          </div>`;
        break;

      case 'element':
        inner = `
          <div class="el-dots" aria-hidden="true"></div>
          ${header}
          <div class="el-hero">
            <div class="el-tile">
              <span class="el-num">${esc(m.number)}</span>
              <span class="el-lvl">${esc(m.levels)}</span>
              <span class="el-sym">${m.kind === 'molecule' ? m.formula : esc(m.symbol)}</span>
              <span class="el-name">${esc(m.kind === 'molecule' ? m.title : m.subjectName)}</span>
              <span class="el-group">${esc(m.kind === 'molecule' ? 'g/mol · ' + m.dept.name : m.dept.name)}</span>
            </div>
            ${titleBlock}
          </div>
          <div class="el-main">
            ${m.visual.type === 'molecule' ? `<div class="el-molcard">${visualHtml(m)}</div>` : ''}
            <div class="el-text">${body}${listHtml(m)}${answerHtml(m)}</div>
          </div>
          ${foot}`;
        break;

      default: // prospectus
        inner = `
          ${header}
          <div class="pr-main">
            <div class="pr-copy">${titleBlock}${body}</div>
            <div class="pr-visual">${visualHtml(m)}</div>
          </div>
          <div class="pr-lower">${listHtml(m)}${answerHtml(m)}</div>
          ${foot}`;
    }

    inner = `<div class="fl-stage">${inner}</div>`;
    if (format === 'story') {
      // keep the top 200 px and bottom 240 px clear of WhatsApp / Instagram controls
      inner = `<div class="st-safe st-top" aria-hidden="true"><span>${esc(b.school)}</span><span>${esc(b.opening)}</span></div>
               ${inner}
               <div class="st-safe st-bottom" aria-hidden="true"><span>Message us on WhatsApp</span><span>${esc(b.phone)}</span></div>`;
    }
    root.innerHTML = inner;
    return root;
  }

  // ------------------------------------------------------------------ series posters
  /* A photo slot: the uploaded / library photo for that activity, otherwise a
   * navy tile with the gold line icon (never a photo of something else). */
  function slot(m, id, cls = '', label = '') {
    const a = m.acts[id] || {};
    const lab = label || a.short || id;
    const inner = a.photo ? `<img src="${esc(a.photo)}" alt="">` : `<span class="ic-wrap">${a.iconSvg || ''}</span>`;
    return `<figure class="sr-slot ${a.photo ? 'has-photo' : 'is-icon'} ${cls}" data-slot="${esc(id)}" data-slot-label="${esc(lab)}">${inner}</figure>`;
  }
  /* A scenery strip slot: uploaded photo for the tag, else a school photo. */
  function sceneSlot(m, tag, i) {
    const a = m.acts[tag] || {};
    const src = a.photo || m.fallbackPhotos[i % m.fallbackPhotos.length];
    return `<figure class="sr-slot has-photo sr-scene" data-slot="${esc(tag)}" data-slot-label="${esc(a.short || tag)}"><img src="${esc(src)}" alt=""></figure>`;
  }
  const icon = (m, id) => `<span class="sr-ic">${(m.acts[id] || {}).iconSvg || ''}</span>`;
  const iconRaw = (m, name) => `<span class="sr-ic">${m.brand.icons?.[name] || ''}</span>`;

  const CATALOGUE = {
    clubs: [['robotics', 'Robotics & Coding'], ['music-dance', 'Music & Dance'], ['debate', 'Debate & Public Speaking'], ['mandarin', 'Mandarin Connect (Chinese Language for Beginners)'], ['french', 'Le Club Français (French Club)'], ['cake', 'Cake Making'], ['decor', 'Event Décor & Interior Décor'], ['welding', 'Welding & Aluminium Fabrication'], ['beauty', 'Beauty Therapy (Pedicure & Manicure)'], ['karate', 'Karate']],
    sports: [['rugby', 'Rugby'], ['hockey', 'Hockey'], ['basketball', 'Basketball'], ['tennis', 'Tennis'], ['woodball', 'Woodball'], ['volleyball', 'Volleyball'], ['handball', 'Handball'], ['softball', 'Softball'], ['girls-soccer', 'Girls\' Soccer / Football'], ['netball', 'Netball']],
    indoor: [['table-tennis', 'Table Tennis'], ['chess', 'Chess'], ['darts', 'Darts'], ['quiz', 'Quiz'], ['balloon-volleyball', 'Balloon Volleyball']],
  };

  function buildSeries(m, format) {
    const f = FORMATS[format];
    const b = m.brand;
    const R = b.royal || {};
    const id = m.series;
    const root = el('div', `flyer sr sr-${id} f-${format} ${f.h > f.w * 1.05 ? 'is-tall' : 'is-wide'}`);
    root.style.width = f.w + 'px';
    root.style.height = f.h + 'px';
    root.dataset.file = `${m.fileBase}-${format}`;
    const crest = (cls) => `<img class="sr-crest ${cls || ''}" src="${esc(b.crest)}" alt="">`;
    const card = (aid, label) => `<li class="sr-card">${icon(m, aid)}<span class="sr-label">${esc(label)}</span></li>`;
    let html = '';

    switch (id) {
      case 'catalogue': {
        const section = (key, title, scenes) => `
          <section class="cat-sec cat-${key}">
            <h2 class="cat-h"><span>${esc(title)}</span></h2>
            <div class="cat-strip">${scenes.map((t, i) => sceneSlot(m, t, i + (key === 'sports' ? 1 : key === 'indoor' ? 2 : 0))).join('')}</div>
            <ul class="cat-grid">${CATALOGUE[key].map(([a, l]) => card(a, l)).join('')}</ul>
          </section>`;
        html = `
          <header class="sr-band">${crest()}<p class="sr-school">ROYAL CREST ACADEMY</p><p class="sr-tagline">${esc(R.tagline || 'Science. Innovation. Skill.')}</p></header>
          <div class="sr-body sr-fit">
            <div class="cat-title"><h1>CLUBS, SPORTS &amp; INDOOR GAMES</h1><p>Beyond the Classroom – 2027 Intake</p></div>
            ${section('clubs', 'CLUBS', ['robotics', 'music-dance', 'cake', 'karate'])}
            ${section('sports', 'SPORTS', ['rugby', 'netball', 'hockey', 'basketball'])}
            ${section('indoor', 'INDOOR GAMES', ['chess', 'table-tennis', 'darts'])}
          </div>
          <div class="sr-banner">Your Future Starts Here! – Enrolling Now for 2027</div>
          <footer class="sr-foot">${addressLine(b)}</footer>`;
        break;
      }
      case 'cover':
        html = `
          <header class="cv-top">${crest('cv-crest')}</header>
          <div class="sr-body sr-fit">
            <div class="cv-collage">${['rugby', 'robotics', 'music-dance', 'chess'].map((a) => slot(m, a, 'cv-cell')).join('')}</div>
            <div class="cv-titles"><h1>BEYOND THE CLASSROOM</h1><p>Clubs • Sports • Indoor Games</p></div>
            <ul class="cv-badges">
              <li>${iconRaw(m, 'users-group')}<span>10 Clubs</span></li>
              <li>${iconRaw(m, 'trophy')}<span>10 Sports</span></li>
              <li>${icon(m, 'chess')}<span>5 Indoor Games</span></li>
            </ul>
          </div>
          <div class="sr-banner">Your Future Starts Here! — 2027 Intake Now Open</div>
          <footer class="sr-foot"><span>Royal Crest Academy</span><i class="sep" aria-hidden="true"></i><span>Nyika, Masvingo</span><i class="sep" aria-hidden="true"></i><span>+263 714 404 090</span></footer>`;
        break;
      case 'clubs-minds':
      case 'clubs-skills': {
        const minds = id === 'clubs-minds';
        const list = minds
          ? [['robotics', 'Robotics & Coding'], ['music-dance', 'Music & Dance'], ['debate', 'Debate & Public Speaking'], ['mandarin', 'Mandarin Connect'], ['french', 'French Club']]
          : [['cake', 'Cake Making'], ['decor', 'Event & Interior Décor'], ['welding', 'Welding & Aluminium Fabrication'], ['beauty', 'Beauty Therapy'], ['karate', 'Karate']];
        html = `
          <header class="cl-head">${crest('cl-crest')}<div><h1>OUR CLUBS</h1><p>${minds ? 'Minds &amp; Cultures' : 'Skills &amp; Creativity'}</p></div></header>
          <div class="sr-body sr-fit">
            <ul class="cl-grid">${list.map(([a, l], i) => `<li class="cl-card ${i === 0 ? 'cl-hero' : ''}">${slot(m, a, 'cl-photo', l)}<span class="sr-label">${esc(l)}</span></li>`).join('')}</ul>
          </div>
          <footer class="cl-band">${minds ? 'Royal Crest Academy — Science. Innovation. Skill.' : 'Learn a skill. Build a future.'}</footer>`;
        break;
      }
      case 'sports': {
        const list = [['rugby', 'Rugby'], ['hockey', 'Hockey'], ['basketball', 'Basketball'], ['tennis', 'Tennis'], ['woodball', 'Woodball'], ['volleyball', 'Volleyball'], ['handball', 'Handball'], ['softball', 'Softball'], ['girls-soccer', 'Girls\' Soccer'], ['netball', 'Netball']];
        html = `
          <div class="sp-stripes" aria-hidden="true"></div>
          <header class="sp-top">${crest('sp-crest')}</header>
          <div class="sr-body sr-fit">
            <div class="sp-hero">${['rugby', 'netball', 'hockey'].map((a) => slot(m, a, 'sp-cell')).join('')}</div>
            <h1 class="sp-title">SPORTS AT ROYAL CREST</h1>
            <ul class="sp-list">${list.map(([a, l]) => `<li>${icon(m, a)}<span class="sr-label">${esc(l)}</span></li>`).join('')}</ul>
          </div>
          <div class="sp-banner"><span>Train. Compete. Excel. — 2027 Intake Open</span></div>`;
        break;
      }
      case 'indoor':
        html = `
          <div class="in-blobs" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
          <header class="in-top">${crest('in-crest')}</header>
          <div class="sr-body sr-fit">
            <h1 class="in-title">INDOOR GAMES</h1>
            <ul class="in-grid">${CATALOGUE.indoor.map(([a, l]) => `<li class="in-card">${slot(m, a, 'in-photo', l)}<span class="in-name">${icon(m, a)}<span class="sr-label">${esc(l)}</span></span></li>`).join('')}</ul>
          </div>
          <div class="sr-banner">Your Future Starts Here! — 2027 Intake Now Open</div>
          <footer class="sr-foot"><span>Royal Crest Academy</span><i class="sep" aria-hidden="true"></i><span>Nyika, Masvingo</span><i class="sep" aria-hidden="true"></i><span>+263 714 404 090</span></footer>`;
        break;
    }
    // Story: keep content clear of the app controls, but add no extra words.
    root.innerHTML = format === 'story' ? `<div class="sr-story">${html}</div>` : html;
    return root;
  }

  // ------------------------------------------------------------------ fitting
  // Content regions: each is a box with a fixed size (flex: 1 / min-height: 0,
  // overflow hidden). Only vertical overflow counts, because decorations
  // (the tilted photo, the bleeding symbol) legitimately poke out sideways.
  const REGIONS = '.pr-copy, .ls-notes, .bk-left, .bk-right, .nb-main, .el-text, .el-hero .fl-titles, .ry-main, .ry-text, .sd-hero, .sd-text';
  // a few px of slack: tight display leading lets descenders poke below the line box
  const overflowsY = (n) => n.scrollHeight > n.clientHeight + 6;
  const overflowsX = (n) => n.scrollWidth > n.clientWidth + 1;

  function collisions(root) {
    // Bold Block: the title block must stay clear of the header row.
    const head = root.querySelector('.t-block .fl-head') || (root.classList.contains('t-block') && root.querySelector('.fl-head'));
    const titles = root.querySelector('.bk-titles');
    if (head && titles) {
      const h = head.getBoundingClientRect(), t = titles.getBoundingClientRect();
      if (t.top < h.bottom + 24) return true;
    }
    // Lab Sheet: the header must leave the drawing area at least a third of the frame.
    const top = root.querySelector('.ls-top'), frame = root.querySelector('.ls-frame');
    if (top && frame && top.offsetHeight > frame.clientHeight * 0.42) return true;
    // Royal: the card keeps at least 40 % of the main area.
    const card = root.querySelector('.ry-card'), main = root.querySelector('.ry-main');
    if (card && main && card.offsetHeight < main.clientHeight * 0.4) return true;
    return false;
  }

  /** Series posters: scale the whole design (one CSS variable) until every
   *  region fits. Labels never shrink independently, so the grid stays even. */
  function fitSeries(root) {
    const regions = [...root.querySelectorAll('.sr-fit, .sr-label, .sr-banner, .sp-banner span, .cl-band')];
    const bad = () => regions.some((n) => overflowsY(n) || overflowsX(n));
    let k = 1;
    root.style.setProperty('--k', k);
    while (bad() && k > 0.6) { k -= 0.03; root.style.setProperty('--k', k.toFixed(2)); }
    return !bad();
  }

  /** Shrink [data-fit] text until no region overflows, then drop list items
   *  that still do not fit. Must run while the flyer is attached to the DOM. */
  function fitFlyer(root) {
    if (root.classList.contains('sr')) return fitSeries(root);
    const regions = [...root.querySelectorAll(REGIONS)];
    const titles = [...root.querySelectorAll('.fl-title[data-fit]')];
    const bodies = [...root.querySelectorAll('.fl-body[data-fit]')];
    const sized = [...titles, ...bodies];
    const anyOverflow = () => regions.some(overflowsY) || titles.some(overflowsX) || collisions(root);

    sized.forEach((t) => { t.style.fontSize = ''; });
    sized.forEach((t) => { t.dataset.base = parseFloat(getComputedStyle(t).fontSize); });
    root.querySelectorAll('.fl-list > *').forEach((li) => { li.hidden = false; });

    // element tile name and symbol / formula: shrink to the tile width
    root.querySelectorAll('.el-name').forEach((n) => {
      n.style.fontSize = '';
      let size = parseFloat(getComputedStyle(n).fontSize);
      while (overflowsX(n) && size > 16) { size -= 1; n.style.fontSize = size + 'px'; }
    });
    root.querySelectorAll('.el-sym').forEach((n) => {
      n.style.fontSize = '';
      let size = parseFloat(getComputedStyle(n).fontSize);
      while (overflowsX(n) && size > 30) { size -= 4; n.style.fontSize = size + 'px'; }
    });

    // 1) shrink titles (to 55 %) and bodies (to 72 %) together
    for (let k = 0.97; k >= 0.55 && anyOverflow(); k -= 0.03) {
      titles.forEach((t) => { t.style.fontSize = (t.dataset.base * k) + 'px'; });
      bodies.forEach((t) => { t.style.fontSize = (t.dataset.base * Math.max(k, 0.72)) + 'px'; });
    }
    // 2) still too much: drop list items from the end (never quiz options)
    const items = [...root.querySelectorAll('.fl-bullets > li, .fl-rows > .row')];
    while (anyOverflow() && items.length > 2) items.pop().hidden = true;
    return !anyOverflow();
  }

  // ------------------------------------------------------------------ captions
  function caption(m) {
    const b = m.brand;
    const plain = (h) => String(h).replace(/<sub>(.*?)<\/sub>/g, (_, d) => d.replace(/\d/g, (x) => '₀₁₂₃₄₅₆₇₈₉'[x])).replace(/<[^>]+>/g, '').replace(/&amp;/g, '&');
    const lines = [];
    if (m.kind === 'series') {
      const L = (k) => CATALOGUE[k].map(([, l]) => l).join(' • ');
      switch (m.series) {
        case 'catalogue': lines.push('Clubs, Sports & Indoor Games at Royal Crest Academy 🏆', '', `CLUBS: ${L('clubs')}`, '', `SPORTS: ${L('sports')}`, '', `INDOOR GAMES: ${L('indoor')}`, '', 'Your Future Starts Here! Enrolling now for 2027.'); break;
        case 'cover': lines.push('Beyond the classroom at Royal Crest Academy: 10 clubs, 10 sports and 5 indoor games.', '', 'Your Future Starts Here! 2027 intake now open.'); break;
        case 'clubs-minds': lines.push('Our clubs: Minds & Cultures', '', 'Robotics & Coding • Music & Dance • Debate & Public Speaking • Mandarin Connect • French Club'); break;
        case 'clubs-skills': lines.push('Our clubs: Skills & Creativity', '', 'Cake Making • Event & Interior Décor • Welding & Aluminium Fabrication • Beauty Therapy • Karate', '', 'Learn a skill. Build a future.'); break;
        case 'sports': lines.push('Sports at Royal Crest Academy', '', L('sports').replace(' / Football', ''), '', 'Train. Compete. Excel. 2027 intake open.'); break;
        case 'indoor': lines.push('Indoor games at Royal Crest Academy', '', L('indoor')); break;
      }
      lines.push('', `📍 ${b.address}`, `📞 ${(b.phones || [b.phone]).join(' | ')}`, '', [...(b.hashtags || []), '#BeyondTheClassroom'].join(' '));
      return lines.join('\n');
    }
    const tags = [...(b.hashtags || []), '#' + m.subjectName.replace(/[^A-Za-z]/g, '')].join(' ');
    switch (m.kind) {
      case 'spotlight': lines.push(`${plain(m.title)} at ${b.school}: ${plain(m.subtitle)}`, '', plain(m.body), '', ...m.list.map((t) => '• ' + plain(t))); break;
      case 'tutoring': lines.push(`${m.subjectName} private lessons: ${plain(m.title)}`, '', ...m.list.map((t) => '• ' + plain(t)), '', plain(m.body)); break;
      case 'fact': lines.push(`Did you know? (${m.subjectName})`, '', plain(m.body)); break;
      case 'tip': lines.push(`${m.subjectName} exam tip: ${plain(m.title)}`, '', plain(m.body)); break;
      case 'quiz': lines.push(`${m.subjectName} quick quiz: ${plain(m.title)}`, '', ...m.list.map((t, i) => `${LETTERS[i]}. ${plain(t)}`), '', 'Reply with your answer! (The answer is on the flyer, upside down.)'); break;
      case 'answer': lines.push(`${m.subjectName} quiz, the answer: ${plain(m.title)}`, '', plain(m.subtitle), plain(m.body), '', 'Did you get it right? Tell us in the comments.'); break;
      case 'molecule': lines.push(`Molecule of the week: ${plain(m.title)} (${plain(m.formula)})`, '', plain(m.body), '', ...m.list.map(([k, v]) => `${k}: ${plain(v)}`), '', m.source); break;
    }
    lines.push('', `${b.school} · ${b.opening}`, `WhatsApp ${b.phone} · ${b.website}`, '', tags);
    return lines.join('\n');
  }

  window.Flyer = { FORMATS, TEMPLATES, KINDS, SERIES, buildModel, buildFlyer, fitFlyer, caption };
})();
