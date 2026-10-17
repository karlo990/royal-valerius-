/* Royal Crest Flyer Studio: the 16 social-media post designs.
 *
 * Fixed designs in portrait 4:5 (1080 x 1350), like the series posters: the
 * template choice does not apply, text stays editable, and the phone number
 * follows the School details setting. Styles live in css/posts.css.
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
  };

  function build(m, format) {
    const id = m.post;
    const root = document.createElement('div');
    root.className = `flyer ps ps-${id} f-${format} is-tall`;
    root.style.width = '1080px';
    root.style.height = '1350px';
    root.dataset.file = `post-${id}-${format}`;
    root.innerHTML = HTML[id](m.brand.crest, localPhone(m.brand.phone), m.brand.photos || {});
    return root;
  }

  function caption(m) {
    const b = m.brand;
    return [...POSTS[m.post].caption, '', `${b.school} · ${b.opening}`, `📞 Call or WhatsApp ${b.phone} · ${b.website}`, '', (b.hashtags || []).join(' ')].join('\n');
  }

  window.Posts = { POSTS, ORDER, build, caption };
})();
