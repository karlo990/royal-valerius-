/* Royal Crest Flyer Studio: the 21 social-media post designs (16 school posts + 5 Mandarin Connect).
 *
 * Fixed designs in portrait 4:5 (1080 x 1350; the Mandarin posts also square), like the series posters: the
 * template choice does not apply, text stays editable, and the phone number
 * follows the School details setting (the Mandarin posts show it in full, with +263).
 * Styles live in css/posts.css.
 * Generated from the approved designs; edit the markup here directly.
 */
(function () {
  'use strict';

  const POSTS = {
    'boarding-pass': { label: "Boarding pass", caption: ["Your child’s next destination: Form 1 at Royal Crest Academy ✈️", "", "Now boarding Form 1 to Form 5 for January 2027. Limited seats."] },
    'fees-receipt': { label: "Fees receipt", caption: ["What US$850 a term really buys 🧾", "", "Tuition $250 • SDC levy $150 • Boarding $300 • Science $50 • Practical $100", "Total: US$850 per term for boarders, with four homemade meals a day."] },
    'periodic-table': { label: "Periodic table", caption: ["The periodic table of Royal Crest ⚗️", "", "Sciences, French & Mandarin, trades, clubs and sports: the elements that make a well-rounded learner."] },
    'newspaper': { label: "Newspaper front page", caption: ["Extra! Extra! 📰 A new kind of school opens its doors.", "", "Science labs, a robotics club, French and Mandarin, and a practical trade every year. Royal Crest Academy opens 1 January 2027."] },
    'skill-tree': { label: "Skill tree (game)", caption: ["Unlock a new skill every year 🎮", "", "Every learner picks one trade per year: bakery, welding, solar PV, carpentry, cosmetology and more."] },
    'boarders-menu': { label: "Boarders’ menu", caption: ["Today’s menu at the boarders’ table 🍽️", "", "Peanut butter porridge • Queen cake • Spaghetti & sausage • Sadza & beef stew", "Four homemade meals. Every single day."] },
    'lock-screen': { label: "Lock-screen alerts", caption: ["Day One, 07:30 📱", "", "Assembly and devotion, a chemistry practical, then lunch. Your child’s first day at Royal Crest Academy: 1 January 2027."] },
    'parents-quiz': { label: "Parents’ quiz", caption: ["Pop quiz for parents ✍️", "", "Which school offers ZIMSEC, Cambridge AND HEXCO under one roof? Comment your answer 👇"] },
    'forecast': { label: "Weather forecast", caption: ["The 2027 forecast: 100% chance of a bright future ☀️", "", "Science labs, a trade every year, sport all week and four meals a day."] },
    'polaroids': { label: "Polaroid board", caption: ["A day at Royal Crest 📸", "", "Lab time • Karate • Study hour • Workshop"] },
    'movie-poster': { label: "Movie poster", caption: ["Coming 1 January 2027: The Next Chapter 🎬", "", "Starring your child. Featuring ZIMSEC, Cambridge and HEXCO, robotics, French & Mandarin, and a trade every year."] },
    'recipe': { label: "Recipe card", caption: ["Recipe for a well-rounded learner 🧁", "", "2 cups science • 1 tbsp French • 1 tbsp Mandarin • 1 trade a year • daily devotions • 4 homemade meals • plenty of sport."] },
    'chess': { label: "Chess: next move", caption: ["Your next move is the smart one ♞", "", "ZIMSEC, Cambridge and HEXCO, plus a practical trade every year. Enrol for 2027."] },
    'treasure-map': { label: "Treasure map", caption: ["X marks the future 🗺️", "", "Science labs → library → trade workshop → sports hall → Royal Crest Academy."] },
    'chalkboard': { label: "Chalkboard equation", caption: ["Today’s lesson: Science + Skill + Character = Royal Crest ✏️", "", "ZIMSEC • Cambridge • HEXCO • robotics • boarding with four meals a day."] },
    'playlist': { label: "Playlist", caption: ["A week at Royal Crest, on repeat 🎧", "", "Morning devotion • Chemistry practical • Bonjour, Nǐ hǎo • Sparks fly in the workshop • Code the robot • Rugby • Sadza & stew"] },
    'verse-of-the-day': { label: "Verse of the day", formats: ['portrait', 'square'], caption: ["🌅 Verse of the day: Jeremiah 29:11", "", "“For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”", "", "Heavenly Father, guide every Royal Crest family. Bless our children with wisdom, good character and a passion for learning. In Jesus’ name, Amen. 🙏", "", "Together, with God’s guidance, we are building a strong foundation for our children’s future."], plain: true },
    'verse-pink': { label: "Verse of the day (pink)", formats: ['portrait', 'square'], caption: ["🌅 Morning devotion: Trusting God for the vision", "", "📖 “Commit thy works unto the LORD, and thy thoughts shall be established.” Proverbs 16:3", "", "Heavenly Father, we commit Royal Crest Academy into Your hands. Guide every decision, provide every resource and unite us in purpose. In Jesus’ name, Amen. 🙏", "", "Our students shall rise, flourish and fulfil their God-given purpose.", "", "Have a blessed Sunday, Royal Crest family!"], plain: true },
    'verse-exams': { label: "Verse of the day (exams)", formats: ['portrait', 'square'], caption: ["🌅 Verse of the day: strength for the exam room", "", "📖 “I can do all things through Christ which strengtheneth me.” Philippians 4:13", "", "Heavenly Father, as learners across Zimbabwe sit their examinations, give them clear minds, calm hearts and good recall. Bless every pen and every page. In Jesus’ name, Amen. 🙏", "", "To every learner writing this season: you are prepared, and you are not alone. ✍️", "", "Have a blessed week, Royal Crest family!"], plain: true },
    'verse-week': { label: "Verse of the day (amber)", formats: ['portrait', 'square'], caption: ["🌅 Verse of the day: new mercies for a new week", "", "📖 “It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.” Lamentations 3:22–23", "", "Heavenly Father, thank You for mercies that are new every morning. Guide every Royal Crest family this week, keep our homes in peace and fill our children with joy. In Jesus’ name, Amen. 🙏", "", "Every sunrise is a fresh start. Walk into this week with a grateful heart. ☀️", "", "Have a blessed week, Royal Crest family!"], plain: true },
    'lit-english': { label: "Literature in English (Cambridge)", formats: ['portrait', 'square'], caption: ["“All the world’s a stage.” Shakespeare wrote it in 1599, and our learners will still be asking why. 📖", "", "Literature in English at Royal Crest Academy follows the Cambridge syllabus: poetry, prose and drama, from Form 1 to Upper 6.", "Close reading, sharp essays and a love of great books. ✍️"] },
    'verse-path': { label: "Verse of the day (forest)", formats: ['portrait', 'square'], caption: ["🌅 Morning devotion: Trusting God for the journey ahead", "", "📖 “Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.” Proverbs 3:5–6", "", "Every great vision begins with faith before the results become visible. What seems impossible today can become tomorrow’s testimony.", "", "Heavenly Father, guide the Royal Crest Academy family today. Strengthen our faith, bless our preparations and make Royal Crest a beacon of knowledge, character and excellence for generations to come. In Jesus’ name, Amen. 🙏", "", "✨ Royal Crest Academy is built on faith, strengthened by unity and guided by God.", "", "Have a blessed and fruitful Tuesday, Royal Crest family!"], plain: true },
    'physics-quantum': { label: "Physics: the quantum world", formats: ['portrait', 'square'], caption: ["The nucleus of an atom is about 100,000 times smaller than the atom itself. ⚛️", "", "Zoom in: atom → nucleus → proton → quarks. A proton is two up quarks and one down quark.", "In 1905 Albert Einstein showed that light travels in tiny packets, now called photons. That idea won him the 1921 Nobel Prize in Physics.", "“Imagination is more important than knowledge.” Albert Einstein"] },
    'zh-pictures': { label: "Mandarin: picture characters", formats: ['portrait', 'square'], caption: ["Chinese characters that are pictures 🖌️", "", "人 rén person • 山 shān mountain • 日 rì sun • 木 mù tree", "The oldest characters were carved on bones and shells more than 3,000 years ago. Learn to read them with us at Mandarin Connect."] },
    'zh-count': { formats: ['portrait', 'square'], label: "Mandarin: count to ten", caption: ["Count to ten in Mandarin 🏮", "", "yī, èr, sān, sì, wǔ, liù, qī, bā, jiǔ, shí", "Fun fact: 八 (bā) is a lucky number in China because it sounds like the word for wealth."] },
    'zh-great-wall': { formats: ['portrait', 'square'], label: "Mandarin: the Great Wall", caption: ["长城 Chángchéng: the Great Wall 🏯", "", "More than 21,000 km of history. At Mandarin Connect our learners explore the language and the culture behind it."] },
    'zh-quiz': { formats: ['portrait', 'square'], label: "Mandarin: quiz (xièxie)", caption: ["Mandarin quiz time ✍️", "", "What does 谢谢 (xièxie) mean?", "A. Hello  B. Thank you  C. Sorry  D. Goodbye", "Comment your answer 👇 (the answer is hidden upside down on the post!)"] },
    'zh-character': { formats: ['portrait', 'square'], label: "Mandarin: first character", caption: ["Write your first Chinese character: 中 ✍️", "", "中 zhōng means “middle”. 中国 Zhōngguó, China, is “the Middle Kingdom”.", "Four strokes, top to bottom, with the long middle stroke last."] },
  };
  const ORDER = Object.keys(POSTS);

  // ------------------------------------------------------------------ generated parts
  function bars(n, seed) {               // decorative barcode, same every time
    let s = seed, out = '';
    for (let i = 0; i < n; i++) {
      s = (s * 16807) % 2147483647;
      out += `<i style="width:${(1 + (s % 4)) * 2}px${s % 7 === 0 ? ';opacity:0' : ''}"></i>`;
    }
    return out;
  }

  function periodic() {
    const T = [['Rc', 'Royal Crest', 2027, 'hero'], ['Ma', 'Mathematics', 1, 'sci'], ['Ph', 'Physics', 2, 'sci'], ['Ch', 'Chemistry', 3, 'sci'],
      ['Bi', 'Biology', 4, 'sci'], ['Cs', 'Computer Science', 5, 'sci'], ['Fr', 'French', 6, 'lan'], ['Zh', 'Mandarin', 7, 'lan'], ['We', 'Welding', 8, 'trd'],
      ['Ba', 'Bakery', 9, 'trd'], ['So', 'Solar PV', 10, 'trd'], ['Cp', 'Carpentry', 11, 'trd'], ['Rb', 'Robotics & Coding', 12, 'clb'], ['De', 'Debate', 13, 'clb'],
      ['Ru', 'Rugby', 14, 'spt'], ['Ka', 'Karate', 15, 'spt'], ['Hk', 'Hockey', 16, 'spt']];
    return T.map(([s, w, n, c]) => `<div class="el ${c}"><div class="n">${n}</div><div class="s">${s}</div><div class="w">${w.replace('&', '&amp;')}</div></div>`).join('');
  }

  // Crestbot: the pixel crab-bot from the promo video, drawn as SVG squares.
  function crestbot(px) {
    const S = ['.GG.......GG.', 'G..G.....G..G', 'G.GG.....GG.G', '.GNNNNNNNNNG.', '..NNWKNWKNN..', '..NNNNNNNNN..', '.NNNGGGGGNNN.', 'N.NNNNNNNNN.N', '..N.N...N.N..', '.N..N...N..N.'];
    const C = { N: '#3b5bd6', G: '#f2b705', W: '#ffffff', K: '#071640' };
    let r = '';
    S.forEach((row, j) => [...row].forEach((c, i) => { if (c !== '.') r += `<rect x="${i}" y="${j}" width="1" height="1" fill="${C[c]}"/>`; }));
    return `<svg width="${13 * px}" height="${10 * px}" viewBox="0 0 13 10" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
  }

  function skillTree() {
    const N = [[520, 430, 'FORM 1 · UNLOCKED', 'Bakery &amp; Food Production', 1, 'on'], [760, 600, 'FORM 2', 'Arc &amp; Gas Welding', .55, 'on'],
      [520, 760, 'FORM 3', 'Solar PV Installation', .2, 'lock'], [760, 920, 'FORM 4', 'Carpentry &amp; Joinery', 0, 'lock'], [470, 1000, 'FORM 5', 'Cosmetology &amp; Design', 0, 'lock']];
    let links = '';
    for (let i = 0; i < N.length - 1; i++) {
      const [x1, y1] = N[i], [x2, y2] = N[i + 1], ax = x1 + 135, ay = y1 + 120, bx = x2 + 135, by = y2;
      links += `<path d="M${ax} ${ay} V${(ay + by) / 2} H${bx} V${by}" fill="none" stroke="${i < 1 ? '#f2b705' : '#3a4c8f'}" stroke-width="6"${i < 1 ? '' : ' stroke-dasharray="12 10"'}/>`;
    }
    const nodes = N.map(([x, y, k, t, p, c]) =>
      `<div class="node ${c}" style="left:${x}px;top:${y}px"><small>${c === 'lock' ? '▣ LOCKED · ' : '★ '}${k}</small><b>${t}</b><div class="bar"><i style="width:${p * 100}%"></i></div></div>`).join('');
    return `<svg class="links" width="1080" height="1350">${links}</svg>${nodes}`;
  }

  function chessBoard() {
    const P = { e2: '♘', a1: '♖', h1: '♖', d1: '♕', e1: '♔', a8: '♜', h8: '♜', e8: '♚', d8: '♛', c7: '♟', d7: '♟', f7: '♟', g8: '♞', b2: '♙', g2: '♙', c3: '♗' };
    const white = '♔♕♖♗♘♙';
    let h = '';
    for (let r = 8; r >= 1; r--) for (let c = 0; c < 8; c++) {
      const id = 'abcdefgh'[c] + r, light = (r + c) % 2 === 1, p = P[id];
      const col = p && (white.includes(p) ? '#f2b705' : light ? '#071640' : '#e9e2cf');
      h += `<i class="${light ? 'sq-l' : 'sq-d'}"${id === 'f4' ? ' style="box-shadow:inset 0 0 0 6px #f2b705"' : ''}>${p ? `<span class="pc" style="color:${col}">${p}</span>` : ''}</i>`;
    }
    return h;
  }


  // ------------------------------------------------------------------ verse of the day (Prospectus look)
  const SKY = { navy: ['#0c1638', '#2a3f8f', '#b06c86', '#f0a35e', '#ffd27a', '#1d2a66', '#0c1638'],
    pink: ['#4a0f2e', '#a3305f', '#e57fa6', '#ffb3c9', '#ffe1b8', '#8a2a5a', '#4a0f2e'],
    forest: ['#0d2a1e', '#1f5a3a', '#6e9a5a', '#e9c26a', '#ffe3a0', '#163f2a', '#0d2a1e'],
    amber: ['#2b1408', '#7a3a14', '#d9773a', '#f6b26b', '#ffe1a8', '#5a2a10', '#2b1408'],
    teal: ['#062a2e', '#0f5a5c', '#3f9a8f', '#e9b35f', '#ffd98a', '#0c4446', '#062a2e'] };
  function sunrise(theme = 'navy') {
    const c = SKY[theme], id = 'vd' + theme;
    return `<svg viewBox="0 0 300 500" preserveAspectRatio="xMidYMid slice"><defs>
      <linearGradient id="${id}Sky" x1="0" y1="0" x2="0" y2="1">${[0, .38, .62, .8, 1].map((o, i) => `<stop offset="${o}" stop-color="${c[i]}"/>`).join('')}</linearGradient>
      <radialGradient id="${id}Sun"><stop offset="0" stop-color="#fff8dc"/><stop offset=".55" stop-color="#ffd970"/><stop offset="1" stop-color="#ffc24a" stop-opacity="0"/></radialGradient></defs>
      <rect width="300" height="500" fill="url(#${id}Sky)"/>
      <g stroke="#ffe7a8" stroke-width="7" opacity=".16">${Array.from({ length: 13 }, (_, i) => { const a = Math.PI * (i + .5) / 13; return `<line x1="150" y1="390" x2="${150 - Math.cos(a) * 420}" y2="${390 - Math.sin(a) * 420}"/>`; }).join('')}</g>
      <circle cx="150" cy="390" r="120" fill="url(#${id}Sun)"/><circle cx="150" cy="390" r="52" fill="#fff3c4"/>
      <g fill="#fff" opacity=".55"><circle cx="40" cy="40" r="1.4"/><circle cx="230" cy="70" r="1.2"/><circle cx="120" cy="24" r="1"/><circle cx="270" cy="150" r="1.1"/><circle cx="70" cy="130" r="1"/></g>
      <path d="M0 400 C40 380 70 360 110 372 C150 384 170 352 210 356 C250 360 270 384 300 380 V500 H0 Z" fill="${c[5]}"/>
      <path d="M0 440 C80 420 160 432 220 424 C260 418 280 428 300 426 V500 H0 Z" fill="${c[6]}"/>
      <g fill="${c[6]}"><path d="M62 424 c-1 -16 3 -24 0 -34 c6 9 4 19 3 34 z"/><ellipse cx="63" cy="388" rx="22" ry="7"/></g>${theme === 'forest' ? '<path d="M96 500 C130 470 196 452 168 428 C150 412 136 406 148 392 L152 392 C146 406 160 412 178 428 C210 456 176 478 196 500 Z" fill="#ffe3a0" opacity=".5"/>' : ''}</svg>`;
  }

  // ------------------------------------------------------------------ Mandarin Connect parts
  const PHONE_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>`;
  const zhBrand = (crest, phone, tone) => `<div class="brand ${tone}"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>MANDARIN CONNECT</small></div></div><div class="ph"><i>${PHONE_ICON}</i>${phone}</div></div>`;

  function pictureCards() {             // each character beside a sketch of the picture it grew from
    const T = [['a person walking', '人', 'rén', 'person', '<circle cx="52" cy="17" r="9"/><path d="M50 28 L44 58 L28 90 M44 58 L66 90 M48 38 L70 52"/>'],
      ['three peaks', '山', 'shān', 'mountain', '<path d="M8 86 L30 42 L42 62 L54 20 L68 58 L78 44 L94 86 Z"/>'],
      ['the sun', '日', 'rì', 'sun, day', '<circle cx="50" cy="50" r="32"/><circle cx="50" cy="50" r="5" fill="#c8102e"/>'],
      ['a tree with roots', '木', 'mù', 'tree, wood', '<path d="M50 10 V92 M50 36 L26 16 M50 36 L74 16 M50 68 L26 90 M50 68 L74 90"/>']];
    return T.map(([how, ch, py, en, svg]) => `<div class="tc"><div class="tn"><b>Looks like</b>${how}</div>
      <svg class="cv" viewBox="0 0 100 100"><g fill="none" stroke="#c8102e" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">${svg}</g></svg>
      <div class="ch zb">${ch}</div><div class="py">${py}</div><div class="en">${en}</div></div>`).join('');
  }

  function countTiles() {
    return [['一', 'yī'], ['二', 'èr'], ['三', 'sān'], ['四', 'sì'], ['五', 'wǔ'], ['六', 'liù'], ['七', 'qī'], ['八', 'bā'], ['九', 'jiǔ'], ['十', 'shí']]
      .map(([c, p], i) => `<div class="tile${i === 7 ? ' lucky' : ''}"><small>${i + 1}</small><b class="zs">${c}</b><span>${p}</span></div>`).join('');
  }

  function lantern(x, len, s) {
    return `<g transform="translate(${x} 0) scale(${s})"><line x1="0" y1="0" x2="0" y2="${len}" stroke="#f2b705" stroke-width="2"/>
      <g transform="translate(0 ${len})"><rect x="-26" y="0" width="52" height="12" rx="3" fill="#f2b705"/>
      <ellipse cx="0" cy="62" rx="62" ry="52" fill="#e0262f"/><ellipse cx="0" cy="62" rx="38" ry="52" fill="none" stroke="#a50f19" stroke-width="3"/><ellipse cx="0" cy="62" rx="14" ry="52" fill="none" stroke="#a50f19" stroke-width="3"/>
      <ellipse cx="-20" cy="44" rx="14" ry="22" fill="#ff7a6e" opacity=".45"/>
      <rect x="-26" y="110" width="52" height="12" rx="3" fill="#f2b705"/><path d="M-10 122 L-14 176 M0 122 V182 M10 122 L14 176" stroke="#f2b705" stroke-width="3" stroke-linecap="round"/></g></g>`;
  }

  // 中: 1 left vertical, 2 top-and-right turn, 3 bottom horizontal, 4 long middle vertical
  const ZHONG = ['M28 34 V66', 'M28 34 H72 V66', 'M28 66 H72', 'M50 10 V92'];
  function strokeSteps() {
    return ZHONG.map((_, i) => `<div class="stp"><svg viewBox="0 0 100 100"><g stroke="#e9b4b4" stroke-width="1.2" stroke-dasharray="4 4"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/></g>
      ${ZHONG.slice(0, i + 1).map((d, j) => `<path d="${d}" fill="none" stroke="${j === i ? '#c8102e' : '#22201c'}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</svg><b>${i + 1}</b></div>`).join('');
  }

  // ------------------------------------------------------------------ designs
  const localPhone = (p) => String(p || '').replace(/^\+263\s*/, '0');
  const HTML = {
    'boarding-pass': (crest, phone, P) => `<div class="grid"></div>
  <div class="abs h">Your child’s next<br><em>destination.</em></div>
  <div class="abs sub">Now boarding: Form 1 to Form 5, intake 2027.</div>
  <svg class="abs path" viewBox="0 0 1080 200"><path d="M40 170 C 300 20, 760 20, 1040 120" fill="none" stroke="#f2b705" stroke-width="3" stroke-dasharray="2 14" stroke-linecap="round"/>
    <g transform="translate(905 58) rotate(22)"><path d="M0 0 L38 10 L0 20 L8 10 Z" fill="#f2b705"/></g></svg>
  <div class="abs ticket"><div class="tk">
    <div class="main">
      <div class="top"><b>Royal Crest Academy</b><span>BOARDING PASS</span></div>
      <div class="route">
        <div><small>FROM</small><b>Grade 7</b><i>Primary school</i></div>
        <svg viewBox="0 0 90 40"><path d="M4 20 H80 M66 8 L82 20 L66 32" fill="none" stroke="#c9a227" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <div style="text-align:right"><small>TO</small><b>Form 1</b><i>Royal Crest Academy</i></div>
      </div>
      <div class="fields">
        <div><small>PASSENGER</small><b>Your child</b></div>
        <div><small>DEPARTS</small><b>1 Jan 2027</b></div>
        <div><small>CLASS</small><b class="g">Boarder</b></div>
        <div><small>LUGGAGE</small><b>Big dreams</b></div>
        <div><small>PATHWAY</small><b>STEM</b></div>
        <div><small>SEAT</small><b class="g">1A</b></div>
      </div>
    </div>
    <div class="stub">
      <div><small>CHECK IN</small><b>${phone}</b><small>GATE</small><b>Masvingo</b><small>BOARDING</small><b>Now open</b></div>
      <div class="bars">${bars(46, 7)}</div>
    </div>
  </div></div>
  <div class="abs pchip"><span>LIMITED SEATS</span><span>FORM 1 – 5</span><span>BOARDERS</span></div>
  <div class="brand" style="color:#fff"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'fees-receipt': (crest, phone, P) => `<div class="abs kick" style="left:70px;top:60px;color:var(--plum)">Fees, explained</div>
  <div class="abs h">What<br><em>US$850</em><br>a term really buys.</div>
  <div class="abs sub">One termly fee for boarders. <b>Every dollar itemised</b>, nothing hidden. Uniforms and the desk fee are paid once, on admission.</div>
  <div class="abs paper"><div class="rc mono">
    <div class="c"><img src="${crest}" alt=""><b style="font-size:24px">ROYAL CREST ACADEMY</b><br>TERMLY FEES · BOARDERS<br>INTAKE 2027</div>
    <hr>
    <div class="ln"><span>TUITION</span><span>250.00</span></div>
    <div class="ln"><span>SDC LEVY</span><span>150.00</span></div>
    <div class="ln"><span>BOARDING</span><span>300.00</span></div>
    <div class="ln"><span>SCIENCE</span><span>50.00</span></div>
    <div class="ln"><span>PRACTICAL</span><span>100.00</span></div>
    <hr>
    <div class="ln tot"><span>TOTAL / TERM</span><span>$850.00</span></div>
    <hr>
    <div class="c" style="font-size:19px;line-height:1.6">ALSO SERVED DAILY:<br>BREAKFAST · BREAKTIME<br>LUNCH · SUPPER</div>
    <hr>
    <div class="ln"><span>FUTURE</span><span>PRICELESS</span></div>
    <div class="ln"><span>CHARACTER</span><span>INCLUDED</span></div>
    <hr>
    <div class="c" style="font-size:19px;line-height:1.6">THANK YOU FOR INVESTING<br>IN YOUR CHILD'S FUTURE<br>** ${phone} **</div>
    <div class="bars">${bars(64, 3)}</div>
  </div></div>
  <div class="abs stamp"><div>INVESTED<small>IN THE FUTURE</small></div></div>
  <div class="brand"><div class="b"><img src="${crest}" alt=""><div><b style="color:var(--navy)">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div class="ph" style="color:var(--navy)"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'periodic-table': (crest, phone, P) => `<div class="abs h">The periodic table<br>of <em>Royal Crest</em></div>
  <div class="abs sub">The elements that make a well-rounded learner.</div>
  <div class="abs tbl">${periodic()}</div>
  <div class="abs key"><span><i style="background:#f2b705"></i>Sciences</span><span><i style="background:#b48cff"></i>Languages</span><span><i style="background:#3fd0b8"></i>Trades</span><span><i style="background:#7fb2ff"></i>Clubs</span><span><i style="background:#ff8a6a"></i>Sports</span></div>
  <div class="brand" style="color:#fff"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'newspaper': (crest, phone, P) => `<div class="abs mast"><b>The Royal Crest Times</b></div>
  <div class="abs meta"><span>Special edition</span><span>Masvingo</span><span>Intake 2027</span></div>
  <div class="abs head">A new kind of school opens its doors</div>
  <div class="abs deck">Science labs, a robotics club, French and Mandarin, and a practical trade every single year.</div>
  <div class="abs photo"><img src="${P.campus}" alt=""></div>
  <div class="abs cap">The Royal Crest Academy campus, ready for its first intake in January 2027.</div>
  <div class="abs col">
    <p>Royal Crest Academy, a private boarding high school, welcomes its first learners on 1 January 2027, now enrolling Form 1 to Form 5.</p>
    <p>Learners follow ZIMSEC, Cambridge and HEXCO pathways, and choose one hands-on trade each year.</p>
  </div>
  <div class="abs box"><b>ENROL TODAY</b>Call or WhatsApp<br><span style="font-size:26px">${phone}</span></div>
  <div class="brand dark" style="bottom:46px"><div class="b"><img src="${crest}" alt=""><div><b style="color:#1b1b1b">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph" style="color:#1b1b1b;font-size:22px;font-weight:700;letter-spacing:.14em">PRICE: ONE PHONE CALL</div></div>`,
    'skill-tree': (crest, phone, P) => `<div class="glow"></div><div class="scan"></div>
  <div class="abs hud"><span>PLAYER: YOU</span><span>LVL FORM 1</span><span>XP ████░░ 2027</span></div>
  <div class="abs h">Unlock a<br><em>new skill</em><br>every year</div>
  <div class="abs sub">&gt; every learner picks ONE trade per year_</div>
  ${skillTree()}
  <div class="abs" style="left:150px;top:640px">${crestbot(20)}</div><div class="abs" style="left:150px;top:860px;width:260px;text-align:center;font:800 20px 'IBM Plex Mono',monospace;color:#9fb3ff">CRESTBOT · P1</div>
  <div class="abs press">▶ PRESS START: ${phone}</div>
  <div class="brand" style="color:#fff;bottom:44px"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div style="font:800 22px 'IBM Plex Mono',monospace;color:#9fb3ff">INTAKE 2027 · FORM 1–5</div></div>`,
    'boarders-menu': (crest, phone, P) => `<div class="abs frame"></div><div class="abs frame2"></div>
  <div class="abs c tiny" style="top:110px">ROYAL CREST ACADEMY · BOARDERS’ DINING</div>
  <div class="abs c t" style="top:160px">Today’s Menu</div>
  <div class="abs c day" style="top:300px">TUESDAY</div>
  <div class="abs orn" style="top:356px"></div>
  <div class="abs plate"><img src="assets/photos/cake-making.webp" alt=""></div>
  <div class="abs course" style="top:400px"><small>BREAKFAST</small><b>Peanut butter porridge</b><i>toast, scrambled egg &amp; tea</i></div>
  <div class="abs course" style="top:570px"><small>BREAKTIME</small><b>Queen cake</b><i>with fresh coffee</i></div>
  <div class="abs course" style="top:720px"><small>LUNCH</small><b>Spaghetti &amp; sausage</b><i>with a crisp green salad</i></div>
  <div class="abs course" style="top:870px"><small>SUPPER</small><b>Sadza &amp; beef stew</b><i>fried cabbage &amp; beans</i></div>
  <div class="abs orn" style="top:1040px"></div>
  <div class="abs c" style="top:1066px;font:italic 500 40px PsSerif,serif;color:var(--navy)">Four homemade meals. Every single day.</div>
  <div class="brand" style="bottom:80px;left:110px;right:110px"><div class="b"><img src="${crest}" alt=""><div><b style="color:var(--navy)">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div class="ph" style="color:var(--navy)"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'lock-screen': (crest, phone, P) => `<div class="wall"></div>
  <div class="abs date">Friday, 1 January 2027</div>
  <div class="abs time">07:30</div>
  <div class="abs nt" style="top:470px"><img src="${crest}" alt=""><div><b>Royal Crest Academy <span>now</span></b><p>Welcome to Day One! Assembly and morning devotion start in the hall.</p></div></div>
  <div class="abs nt" style="top:660px"><div class="ic" style="background:#0a1f5c"><svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/></svg></div><div><b>Science Lab <span>9:00</span></b><p>Chemistry practical today. Goggles on, lab coats ready.</p></div></div>
  <div class="abs nt" style="top:850px"><div class="ic" style="background:#c9a227">★</div><div><b>Boarders' Kitchen <span>13:00</span></b><p>Lunch is served: rice, roast chicken and fruit for dessert.</p></div></div>
  <div class="abs swipe">Enrol now: ${phone}</div>
  <div class="brand light"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph" style="font-size:24px">Form 1 – 5 · Boarders</div></div>`,
    'parents-quiz': (crest, phone, P) => `<div class="abs hd"><span>Name: <b>Every parent</b></span><span>Paper 1 · <b>Choosing a school</b></span></div>
  <div class="abs title">Pop quiz for parents</div>
  <div class="abs score"><div><b>100%</b><small>Excellent!</small></div></div>
  <div class="abs q" style="top:330px"><b>1.</b> Which school offers ZIMSEC, Cambridge <i>and</i> HEXCO under one roof?
    <div class="opt"><i>A</i>One of them</div><div class="opt"><i>B</i>Two of them</div>
    <div class="opt"><i style="background:#fde3e6;border-color:var(--red);color:var(--red)">C</i><b>All three: Royal Crest Academy</b></div></div>
  <svg class="abs" style="left:96px;top:550px" width="70" height="60" viewBox="0 0 70 60"><path d="M6 32 L26 52 L64 6" fill="none" stroke="#c8102e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="abs q" style="top:640px"><b>2.</b> How many practical trades will your child master?
    <div class="opt" style="margin-top:6px"><span class="red">One every year: welding, bakery, solar, carpentry…</span></div></div>
  <svg class="abs" style="left:96px;top:740px" width="70" height="60" viewBox="0 0 70 60"><path d="M6 32 L26 52 L64 6" fill="none" stroke="#c8102e" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="abs q" style="top:860px"><b>3.</b> Name two languages beyond English and Shona.
    <div class="opt" style="margin-top:6px"><span class="red">French &amp; Mandarin Chinese ✓</span></div></div>
  <div class="abs" style="left:170px;top:1040px;font:italic 600 44px PsSerif,serif;color:var(--red);transform:rotate(-2deg)">Well done! See you in Form 1 → January 2027</div>
  <div class="brand"><div class="b"><img src="${crest}" alt=""><div><b style="color:var(--navy)">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div>
    <div class="ph" style="color:var(--navy)"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'forecast': (crest, phone, P) => `<div class="abs loc">Royal Crest Academy · 2027</div>
  <div class="abs big">100<sup>%</sup></div>
  <div class="abs cond">chance of a bright future<small>Clear skies ahead for every learner</small></div>
  <div class="abs card" style="top:580px"><h4>THE 2027 FORECAST</h4>
    <div class="row"><span>Term 1</span><svg viewBox="0 0 24 24" fill="none" stroke="#ffd65a" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></svg><div class="bar" style="width:70%"></div><em>New starts</em></div>
    <div class="row"><span>Science</span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9V3"/></svg><div class="bar" style="width:92%"></div><em>Labs on</em></div>
    <div class="row"><span>Trades</span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4l6 6-9 9H5v-6z"/><path d="M12 6l6 6"/></svg><div class="bar" style="width:85%"></div><em>1 per year</em></div>
    <div class="row"><span>Sports</span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 3c3 3 3 15 0 18M3 12h18"/></svg><div class="bar" style="width:80%"></div><em>All week</em></div>
    <div class="row"><span>Meals</span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><path d="M4 11h16a8 8 0 0 1-16 0z"/><path d="M8 7c0-2 2-2 2-4M12 7c0-2 2-2 2-4"/></svg><div class="bar" style="width:100%"></div><em>4 a day</em></div>
    <div class="row"><span>Languages</span><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg><div class="bar" style="width:75%"></div><em>Fr &amp; Zh</em></div>
  </div>
  <div class="brand light"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'polaroids': (crest, phone, P) => `<div class="abs h">A day at<br><em>Royal Crest</em></div>
  <div class="abs pol" style="left:70px;top:300px;transform:rotate(-5deg)"><div class="abs pin"></div><img src="assets/photos/science-lab.webp" alt="" style="object-position:50% 60%"><span>Lab time</span></div>
  <div class="abs pol" style="left:560px;top:270px;transform:rotate(4deg)"><div class="abs pin"></div><img src="assets/photos/karate.webp" alt=""><span>Karate</span></div>
  <div class="abs pol" style="left:90px;top:770px;transform:rotate(3deg)"><div class="abs pin"></div><img src="assets/photos/library-study.webp" alt=""><span>Study hour</span></div>
  <div class="abs pol" style="left:570px;top:740px;transform:rotate(-4deg)"><div class="abs pin"></div><img src="assets/photos/welding.webp" alt=""><span>Workshop</span></div>
  <div class="brand light" style="bottom:36px"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'movie-poster': (crest, phone, P) => `<div class="bg"></div><div class="shade"></div>
  <div class="abs top">ROYAL CREST ACADEMY PRESENTS</div>
  <div class="abs laurel" style="left:70px">“A school built<br>for the future”</div>
  <div class="abs laurel" style="right:70px">Science · Innovation<br>· Skill</div>
  <div class="abs star">STARRING YOUR CHILD</div>
  <div class="abs tt">The Next<br>Chapter<em>a Royal Crest story</em></div>
  <div class="abs date">1 · JANUARY · 2027</div>
  <div class="abs credits"><b>ZIMSEC</b> · <b>Cambridge</b> · <b>HEXCO</b> · featuring <b>robotics</b>, <b>French</b> &amp; <b>Mandarin</b>, a <b>trade every year</b> · boarding with <b>four homemade meals a day</b><br>Tickets: Form 1 – 5 · Book on <b>${phone}</b></div>`,
    'recipe': (crest, phone, P) => `<div class="abs card"></div>
  <div class="abs tape" style="left:420px"></div>
  <div class="abs pic"><img src="assets/photos/cake-making.webp" alt=""></div>
  <div class="abs t">Recipe for a well-rounded learner</div>
  <div class="abs serves">SERVES: EVERY CHILD · READY: JANUARY 2027</div>
  <div class="abs ing">
    <div><span class="m">2 cups</span><b>Science</b> &amp; Mathematics</div>
    <div><span class="m">1 tbsp</span><b>French</b>, 1 tbsp <b>Mandarin</b></div>
    <div><span class="m">1 trade</span>per year, from welding to bakery</div>
    <div><span class="m">A pinch</span>of robotics &amp; coding</div>
    <div><span class="m">Daily</span><b>devotions</b> &amp; Christian values</div>
    <div><span class="m">4 meals</span>a day, homemade</div>
    <div><span class="m">Plenty</span>of sport: rugby, hockey, karate…</div>
    <div><span class="m">To taste</span>discipline, care &amp; friendship</div>
  </div>
  <div class="abs meth">Method: mix well at Royal Crest Academy from Form 1. Call ${phone} to start.</div>
  <div class="brand"><div class="b"><img src="${crest}" alt=""><div><b style="color:var(--navy)">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph" style="color:var(--navy)"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'chess': (crest, phone, P) => `<div class="abs h">Your next move<br>is <em>the smart one.</em></div>
  <div class="abs sub">Think ahead like a chess player: ZIMSEC, Cambridge and HEXCO, plus a trade every year.</div>
  <div class="abs board">${chessBoard()}</div>
  <svg class="abs" style="left:190px;top:420px" width="700" height="700" viewBox="0 0 700 700"><path d="M393 560 V393 H462" fill="none" stroke="#f2b705" stroke-width="8" stroke-dasharray="14 12" stroke-linecap="round"/><path d="M450 378 L470 393 L450 408" fill="none" stroke="#f2b705" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>
  <div class="abs tag" style="left:728px;top:796px">ENROL 2027</div>
  <div class="brand light"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'treasure-map': (crest, phone, P) => `<div class="abs h">X marks<br>the future</div>
  <div class="abs sub">Follow the trail through a day at Royal Crest Academy.</div>
  <svg class="map" width="1080" height="1350" viewBox="0 0 1080 1350"><path d="M170 470 C 420 420, 700 480, 820 560 S 760 800, 520 800 S 160 860, 230 1000 S 620 1120, 820 1040" fill="none" stroke="#7a4a14" stroke-width="7" stroke-dasharray="4 20" stroke-linecap="round"/>
    <g fill="none" stroke="#7a4a14" stroke-width="3"><circle cx="930" cy="160" r="70"/><path d="M930 70v180M840 160h180"/><path d="M930 95 l14 55 -14 10 -14 -10z" fill="#7a4a14"/></g>
    <text x="922" y="62" font-family="Newsreader" font-size="28" fill="#7a4a14" font-weight="700">N</text></svg>
  <div class="abs stop" style="left:45px;top:410px">Science labs<small>STOP 1</small></div>
  <div class="abs stop" style="left:780px;top:600px">The library<small>STOP 2</small></div>
  <div class="abs stop" style="left:395px;top:745px">Trade workshop<small>STOP 3</small></div>
  <div class="abs stop" style="left:105px;top:950px">Sports hall<small>STOP 4</small></div>
  <div class="abs x" style="left:785px;top:985px">✕</div>
  <div class="abs stop" style="left:740px;top:1110px;width:270px">Royal Crest<small>YOUR FUTURE</small></div>
  <div class="brand"><div class="b"><img src="${crest}" alt=""><div><b style="color:#4a2c0c">Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph" style="color:#4a2c0c"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,
    'chalkboard': (crest, phone, P) => `<div class="frame"></div>
  <div class="abs ch" style="left:100px;top:90px;font-size:30px;color:rgba(244,241,232,.7)">Today’s lesson · Form 1</div>
  <div class="abs eq" style="top:230px"><b>Science</b> + <b>Skill</b> + <b>Character</b></div>
  <div class="abs eq" style="top:340px;font-size:54px">+ French + Mandarin + a trade a year</div>
  <div class="abs line" style="top:470px"></div>
  <div class="abs ans" style="top:510px">Royal Crest</div>
  <div class="abs note" style="top:650px">Show your working: ZIMSEC · Cambridge · HEXCO</div>
  <div class="abs ch" style="left:130px;top:780px;font-size:40px;line-height:1.6">✓ Science labs &amp; computer lab<br>✓ Robotics &amp; coding club<br>✓ Boarding with 4 meals a day<br>✓ Starts 1 January 2027</div>
  <div class="abs ch" style="right:110px;top:1100px;font-size:38px;color:#ffe08a;transform:rotate(-4deg)">Call ${phone} ☺</div>
  <div class="abs ledge"></div>
  <div class="abs chalk" style="left:200px;width:90px"></div><div class="abs chalk" style="left:320px;width:60px;background:#ffe08a"></div>`,
    'playlist': (crest, phone, P) => `<div class="cover"><img src="${crest}" alt=""><b>FORM 1 · 2027</b></div>
  <div class="abs meta"><small>PLAYLIST</small><h2>A week at Royal Crest</h2><p>Royal Crest Academy · 8 tracks · on repeat from 1 January 2027</p></div>
  <div class="abs play"><i><svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#071640"/></svg></i><span style="font:700 26px PsSans;opacity:.85">Shuffle: on</span></div>
  <div class="abs tracks">
    <div class="tr on"><span class="n">1</span><div><b>Morning Devotion</b><span>Assembly &amp; prayer</span></div><em>07:00</em></div>
    <div class="tr"><span class="n">2</span><div><b>Chemistry Practical</b><span>Science labs</span></div><em>08:00</em></div>
    <div class="tr"><span class="n">3</span><div><b>Bonjour, Nǐ hǎo</b><span>French &amp; Mandarin</span></div><em>10:30</em></div>
    <div class="tr"><span class="n">4</span><div><b>Queen Cake Break</b><span>Breaktime</span></div><em>11:00</em></div>
    <div class="tr"><span class="n">5</span><div><b>Sparks Fly</b><span>Welding workshop</span></div><em>14:00</em></div>
    <div class="tr"><span class="n">6</span><div><b>Code the Robot</b><span>Robotics &amp; coding club</span></div><em>15:30</em></div>
    <div class="tr"><span class="n">7</span><div><b>Rugby Under the Sun</b><span>Sports</span></div><em>16:30</em></div>
    <div class="tr"><span class="n">8</span><div><b>Sadza &amp; Stew</b><span>Supper with friends</span></div><em>18:00</em></div>
  </div>
  <div class="brand light" style="bottom:40px"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph"><i><svg viewBox="0 0 24 24" fill="none" stroke="#071640" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></i>${phone}</div></div>`,

    'verse-of-the-day': (crest) => `<div class="t-prospectus vd">
  <div class="fl-head"><div class="fl-brand"><img class="fl-crest" src="${crest}" alt=""><div class="fl-brandtext"><span class="fl-school">Royal Crest Academy</span><span class="fl-motto">Science · Innovation · Skill</span></div></div><span class="fl-kind">Verse of the day</span></div>
  <div class="vd-main"><div class="vd-text">
    <div class="fl-kicker">Morning devotion · 24 October 2026</div>
    <div class="fl-title">Trusting God with our children’s <em>future.</em></div>
    <div class="vd-verse">“For I know the plans I have for you,” declares the Lord, “plans to prosper you and not to harm you, plans to give you hope and a future.”</div>
    <div class="vd-ref">Jeremiah 29:11</div>
    <div class="vd-prayer"><b>Prayer</b>Heavenly Father, bless our children with wisdom, good character and a passion for learning. In Jesus’ name, Amen.</div></div>
    <div class="fl-photo vd-arch">${sunrise()}</div></div>
  <div class="fl-foot"><div class="fl-cta">Together, with God’s guidance, we build a strong foundation for our children’s future.</div><div class="fl-contact">Have a blessed day<div class="c-web">Royal Crest family</div></div></div></div>`,
    'verse-pink': (crest) => `<div class="t-prospectus vd">
  <div class="fl-head"><div class="fl-brand"><img class="fl-crest" src="${crest}" alt=""><div class="fl-brandtext"><span class="fl-school">Royal Crest Academy</span><span class="fl-motto">Science · Innovation · Skill</span></div></div><span class="fl-kind">Verse of the day</span></div>
  <div class="vd-main"><div class="vd-text">
    <div class="fl-kicker">Morning devotion · Sunday 25 October 2026</div>
    <div class="fl-title">Trusting God for the <em>vision.</em></div>
    <div class="vd-verse">“Commit thy works unto the LORD, and thy thoughts shall be established.”</div>
    <div class="vd-ref">Proverbs 16:3</div>
    <div class="vd-note">Every great vision begins with faith before it becomes reality. <b>What God has planted, He is able to establish.</b></div>
    <div class="vd-prayer"><b>Prayer</b>Heavenly Father, we commit Royal Crest Academy into Your hands. May this vision become a blessing to our children, families and generations to come. In Jesus’ name, Amen.</div></div>
    <div class="fl-photo vd-arch">${sunrise('pink')}</div></div>
  <div class="fl-foot"><div class="fl-cta">Our students shall rise, flourish and fulfil their God-given purpose.</div><div class="fl-contact">Have a blessed Sunday<div class="c-web">Royal Crest family</div></div></div></div>`,
    'verse-exams': (crest) => `<div class="t-prospectus vd">
  <div class="fl-head"><div class="fl-brand"><img class="fl-crest" src="${crest}" alt=""><div class="fl-brandtext"><span class="fl-school">Royal Crest Academy</span><span class="fl-motto">Science · Innovation · Skill</span></div></div><span class="fl-kind">Verse of the day</span></div>
  <div class="vd-main"><div class="vd-text">
    <div class="fl-kicker">Exam season · Monday 26 October 2026</div>
    <div class="fl-title">Strength for the <em>exam room.</em></div>
    <div class="vd-verse">“I can do all things through Christ which strengtheneth me.”</div>
    <div class="vd-ref">Philippians 4:13</div>
    <div class="vd-note">Prepare well, rest well, and walk in calm. <b>The God who gave you wisdom will help you recall it.</b></div>
    <div class="vd-prayer"><b>Prayer</b>Heavenly Father, as learners sit their examinations, give them clear minds, calm hearts and good recall. Bless every pen and every page. In Jesus’ name, Amen.</div></div>
    <div class="fl-photo vd-arch">${sunrise('teal')}</div></div>
  <div class="fl-foot"><div class="fl-cta">To every learner writing this season: you are prepared, and you are not alone.</div><div class="fl-contact">Have a blessed week<div class="c-web">Royal Crest family</div></div></div></div>`,
    'verse-week': (crest) => `<div class="t-prospectus vd">
  <div class="fl-head"><div class="fl-brand"><img class="fl-crest" src="${crest}" alt=""><div class="fl-brandtext"><span class="fl-school">Royal Crest Academy</span><span class="fl-motto">Science · Innovation · Skill</span></div></div><span class="fl-kind">Verse of the day</span></div>
  <div class="vd-main"><div class="vd-text">
    <div class="fl-kicker">Morning devotion · Monday 26 October 2026</div>
    <div class="fl-title">New mercies for a <em>new week.</em></div>
    <div class="vd-verse">“It is of the LORD’s mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.”</div>
    <div class="vd-ref">Lamentations 3:22–23</div>
    <div class="vd-note">Every sunrise is a fresh start. <b>Walk into this week with a grateful heart.</b></div>
    <div class="vd-prayer"><b>Prayer</b>Heavenly Father, thank You for mercies that are new every morning. Guide every Royal Crest family this week, keep our homes in peace and fill our children with joy. In Jesus’ name, Amen.</div></div>
    <div class="fl-photo vd-arch">${sunrise('amber')}</div></div>
  <div class="fl-foot"><div class="fl-cta">Great is Thy faithfulness, this morning and every morning.</div><div class="fl-contact">Have a blessed week<div class="c-web">Royal Crest family</div></div></div></div>`,
    'lit-english': (crest, phone, P, full) => `<div class="ink"></div><div class="dust"></div>
  <div class="abs kick" style="color:var(--gold2)">Literature in English · Cambridge</div>
  <div class="abs h">Read closely.<br><em>Write boldly.</em></div>
  <div class="abs page"><div class="pg-head"><span>As You Like It · Act II, Scene vii</span><span>47</span></div>
    <p><span class="hl">All the world’s a stage,</span><br>And all the men and women <span class="ring">merely players</span>;<br>They have their <span class="wave">exits and their entrances</span>,<br>And one man in his time plays many parts,<br><span class="seven">His acts being seven ages.</span></p>
    <div class="note n1">metaphor!<br>life = theatre</div><div class="note n2">why “merely”?<br>→ tone</div><div class="note n3">structure: 7 ages</div>
    <svg class="arrow a1" viewBox="0 0 90 40"><path d="M86 20 C60 10 30 12 6 22 M18 12 L6 22 L20 30"/></svg>
    <svg class="arrow a2" viewBox="0 0 90 40"><path d="M86 14 C60 24 30 28 6 22 M18 12 L6 22 L18 32"/></svg></div>
  <svg class="abs nib" viewBox="0 0 200 200"><defs><linearGradient id="nibG" x1="0" x2="1"><stop offset="0" stop-color="#f6d77a"/><stop offset=".5" stop-color="#c9a227"/><stop offset="1" stop-color="#8a6a12"/></linearGradient></defs>
    <path d="M100 10 C130 50 150 90 140 130 L100 190 L60 130 C50 90 70 50 100 10 Z" fill="url(#nibG)"/><path d="M100 70 V185" stroke="#3a2a05" stroke-width="3"/><circle cx="100" cy="70" r="9" fill="#3a2a05"/></svg>
  <div class="abs helps"><div class="lab">On the Cambridge syllabus</div>
    <div class="it"><i>i.</i><b>Poetry</b>Set poems and unseen verse</div><div class="it"><i>ii.</i><b>Prose</b>Novels and short stories</div><div class="it"><i>iii.</i><b>Drama</b>Shakespeare and modern plays</div></div>
  <div class="abs meta">Cambridge IGCSE &amp; A Level <b>·</b> Form 1 to Upper 6 <b>·</b> Opening January 2027</div>
  <div class="brand light"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>SCIENCE · INNOVATION · SKILL</small></div></div><div class="ph"><i>${PHONE_ICON}</i>${full}</div></div>`,
    'verse-path': (crest) => `<div class="t-prospectus vd">
  <div class="fl-head"><div class="fl-brand"><img class="fl-crest" src="${crest}" alt=""><div class="fl-brandtext"><span class="fl-school">Royal Crest Academy</span><span class="fl-motto">Science · Innovation · Skill</span></div></div><span class="fl-kind">Verse of the day</span></div>
  <div class="vd-main"><div class="vd-text">
    <div class="fl-kicker">Morning devotion · Tuesday 27 October 2026</div>
    <div class="fl-title">Trusting God for the <em>journey ahead.</em></div>
    <div class="vd-verse">“Trust in the LORD with all thine heart; and lean not unto thine own understanding. In all thy ways acknowledge him, and he shall direct thy paths.”</div>
    <div class="vd-ref">Proverbs 3:5–6</div>
    <div class="vd-note">Every great vision begins with faith. <b>What seems impossible today can become tomorrow’s testimony.</b></div>
    <div class="vd-prayer"><b>Prayer</b>Heavenly Father, guide the Royal Crest family today. Strengthen our faith, bless our preparations and make Royal Crest a beacon of knowledge, character and excellence. In Jesus’ name, Amen.</div></div>
    <div class="fl-photo vd-arch">${sunrise('forest')}</div></div>
  <div class="fl-foot"><div class="fl-cta">Built on faith, strengthened by unity and guided by God.</div><div class="fl-contact">Have a blessed Tuesday<div class="c-web">Royal Crest family</div></div></div></div>`,
    'physics-quantum': (crest, phone, P, full) => `<div class="glow"></div><div class="stars"></div>
  <div class="abs kick" style="color:var(--gold2)">Physics · the quantum world</div>
  <div class="abs h">Smaller than <em>small.</em></div>
  <svg class="abs zoom" viewBox="0 0 1000 380">
    <defs>
      <radialGradient id="qNuc" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ffd9a0"/><stop offset="1" stop-color="#e0702a" stop-opacity="0"/></radialGradient>
      <radialGradient id="qP" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff9a8a"/><stop offset=".6" stop-color="#d23a3a"/><stop offset="1" stop-color="#7a1414"/></radialGradient>
      <radialGradient id="qN" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#a8c8ff"/><stop offset=".6" stop-color="#3a6ad2"/><stop offset="1" stop-color="#14287a"/></radialGradient>
      <radialGradient id="qE" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="#7ff0ff"/><stop offset="1" stop-color="#7ff0ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="qG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#f2b705" stop-opacity=".35"/><stop offset="1" stop-color="#f2b705" stop-opacity="0"/></radialGradient>
      <filter id="qGlow"><feGaussianBlur stdDeviation="3"/></filter>
    </defs>
    <g fill="none" stroke="rgba(242,183,5,.35)" stroke-width="1.5" stroke-dasharray="5 6">
      <path d="M150 182 L370 70 M150 198 L370 310"/><path d="M500 175 L640 70 M500 205 L640 310"/><path d="M745 160 L860 75 M745 200 L860 305"/></g>
    <g transform="translate(150 190)"><circle r="120" fill="url(#qG)"/>
      <g fill="none" stroke="#7ff0ff" stroke-width="2" opacity=".75"><ellipse rx="110" ry="38"/><ellipse rx="110" ry="38" transform="rotate(60)"/><ellipse rx="110" ry="38" transform="rotate(-60)"/></g>
      <circle r="12" fill="url(#qNuc)"/><circle r="5" fill="#ffd9a0"/>
      <circle cx="110" cy="0" r="9" fill="url(#qE)"/><circle cx="-55" cy="95" r="9" fill="url(#qE)"/><circle cx="-55" cy="-95" r="9" fill="url(#qE)"/></g>
    <g transform="translate(500 190)"><circle r="120" fill="url(#qG)"/>
      ${[[-30,-18,'P'],[8,-30,'N'],[34,-6,'P'],[-8,4,'N'],[22,26,'N'],[-30,24,'P'],[2,36,'P'],[-40,-2,'N'],[12,-2,'P']].map(([x, y, k]) => `<circle cx="${x}" cy="${y}" r="24" fill="url(#q${k})" stroke="rgba(0,0,0,.25)"/>`).join('')}</g>
    <g transform="translate(800 190)"><circle r="120" fill="url(#qG)"/><circle r="104" fill="url(#qP)" opacity=".28" stroke="#ff9a8a" stroke-width="2"/>
      <g stroke="#f2b705" stroke-width="2.5" fill="none" opacity=".9" filter="url(#qGlow)"><path d="M-40 -30 Q0 -60 40 -30 Q60 20 0 46 Q-60 20 -40 -30"/></g>
      ${[[-40,-30,'u','#ff6b6b'],[40,-30,'u','#ff6b6b'],[0,46,'d','#6b9bff']].map(([x, y, q, c]) => `<circle cx="${x}" cy="${y}" r="26" fill="${c}"/><text x="${x}" y="${y + 9}" text-anchor="middle" font-family="PsSerif" font-style="italic" font-weight="600" font-size="28" fill="#fff">${q}</text>`).join('')}</g>
  </svg>
  <div class="abs lab l1"><b>Atom</b>about 0.1 nanometres across</div>
  <div class="abs lab l2"><b>Nucleus</b>100,000× smaller than the atom</div>
  <div class="abs lab l3"><b>Proton</b>2 up quarks + 1 down quark</div>
  <div class="abs ein">
    <div class="emc">E = mc<sup>2</sup></div>
    <div class="who"><div class="nm">Albert Einstein <span>1879–1955</span></div>
      <div class="tx">In <b>1905</b> he showed that light travels in tiny packets, now called <b>photons</b>. It won him the <b>1921 Nobel Prize</b> in Physics.</div>
      <div class="qt">“Imagination is more important than knowledge.”</div></div></div>
  <div class="brand light"><div class="b"><img src="${crest}" alt=""><div><b>Royal Crest Academy</b><small>PHYSICS · SCIENCES</small></div></div><div class="ph"><i>${PHONE_ICON}</i>${full}</div></div>`,
    'zh-pictures': (crest, phone, P, full) => `<div class="paper"></div>
  <div class="abs kick" style="left:70px;top:70px;color:var(--red)">Mandarin Connect · characters</div>
  <div class="abs h">Characters that<br>are <em>pictures.</em></div>
  <div class="abs seal zb">汉<br>字</div>
  <div class="abs sub">Many Chinese characters began as drawings of what they mean.</div>
  <div class="abs cards">${pictureCards()}</div>
  <div class="abs note">The oldest were carved on <b>bones and shells</b> more than 3,000 years ago.</div>
  ${zhBrand(crest, full, 'dark')}`,
    'zh-count': (crest, phone, P, full) => `<div class="dots"></div>
  <svg class="abs lan" viewBox="0 0 400 420">${lantern(120, 40, 1)}${lantern(300, 110, .8)}</svg>
  <div class="abs kick" style="left:70px;top:70px;color:var(--gold2)">Mandarin Connect · numbers</div>
  <div class="abs h">Count to ten<br>in <em>Mandarin.</em></div>
  <div class="abs sub">Say it with us: yī, èr, sān…</div>
  <div class="abs tiles">${countTiles()}</div>
  <div class="abs note"><b>Fun fact:</b> 八 <i>bā</i>, eight, is a lucky number in China because it sounds like the word for wealth.</div>
  ${zhBrand(crest, full, 'light')}`,
    'zh-great-wall': (crest, phone, P, full) => `<img class="bg" src="${P['great-wall'] || ''}" alt="">
  <div class="shade"></div>
  <div class="abs vert zb">长城</div><div class="abs vpy">Chángchéng</div>
  <div class="abs kick" style="left:70px;top:70px;color:var(--gold2)">Mandarin Connect · culture</div>
  <div class="abs h">21,000 km<br>of <em>history.</em></div>
  <div class="abs sub">The Great Wall, <span class="zs">长城</span> Chángchéng, stretches more than 21,000 km. Learn the language behind it.</div>
  ${zhBrand(crest, full, 'light')}`,
    'zh-quiz': (crest, phone, P, full) => `<div class="glow"></div>
  <div class="abs ph1"><img src="${P['mandarin-students'] || ''}" alt=""><span>QUIZ TIME</span></div>
  <div class="abs kick" style="left:70px;top:556px;color:var(--gold2)">Mandarin Connect · quiz</div>
  <div class="abs q">What does <span class="zs">谢谢</span> <em>xièxie</em> mean?</div>
  <div class="abs opts"><div><i>A</i>Hello</div><div><i>B</i>Thank you</div><div><i>C</i>Sorry</div><div><i>D</i>Goodbye</div></div>
  <div class="abs cta">Comment A, B, C or D below.</div>
  <div class="abs ans">Answer: B, thank you. Reply <span class="zs">不客气</span> bú kèqi: you’re welcome!</div>
  ${zhBrand(crest, full, 'light')}`,
    'zh-character': (crest, phone, P, full) => `<div class="paper"></div>
  <div class="abs kick" style="left:70px;top:70px;color:var(--red)">Mandarin Connect · writing</div>
  <div class="abs h">Write your<br><em>first character.</em></div>
  <div class="abs grid"><svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#c8102e" stroke-width=".35" stroke-dasharray="1.6 1.6" opacity=".7"><line x1="50" y1="0" x2="50" y2="100"/><line x1="0" y1="50" x2="100" y2="50"/><line x1="0" y1="0" x2="100" y2="100"/><line x1="100" y1="0" x2="0" y2="100"/></g></svg><b class="zb">中</b></div>
  <div class="abs info"><div class="py">zhōng</div><div class="en">middle, centre</div>
    <div class="cn"><span class="zs">中国</span> Zhōngguó, China: “the Middle Kingdom”</div>
    <div class="lab">Stroke order · 4 strokes</div><div class="steps">${strokeSteps()}</div></div>
  <div class="abs tip">Top to bottom, left to right. The long middle stroke comes last.</div>
  <div class="abs pol"><img src="${P['mandarin-textbook'] || ''}" alt=""><span>Our Mandarin textbook</span></div>
  ${zhBrand(crest, full, 'dark')}`,
  };

  function build(m, format) {
    const id = m.post;
    const root = document.createElement('div');
    const square = format === 'square';
    root.className = `flyer ps ps-${id} f-${format} ${square ? 'is-wide' : 'is-tall'}`;
    root.style.width = '1080px';
    root.style.height = square ? '1080px' : '1350px';
    root.dataset.file = `post-${id}-${format}`;
    root.innerHTML = HTML[id](m.brand.crest, localPhone(m.brand.phone), m.brand.photos || {}, m.brand.phone);
    return root;
  }

  function caption(m) {
    const b = m.brand;
    if (POSTS[m.post].plain) return [...POSTS[m.post].caption, '', `💙💛 ${b.school}`, '#RoyalCrestAcademy #VerseOfTheDay'].join('\n');   // devotions carry no sales lines
    return [...POSTS[m.post].caption, '', `${b.school} · ${b.opening}`, `📞 Call or WhatsApp ${b.phone} · ${b.website}`, '', (b.hashtags || []).join(' ')].join('\n');
  }

  window.Posts = { POSTS, ORDER, build, caption };
})();
