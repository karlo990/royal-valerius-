/* Demo data for Crest Quest. Fictional learners, shaped exactly like the /api/v1 responses
 * documented in /portal/api/openapi.yaml, so the UI behaves the same against the real server. */
(() => {
  const SUBJECTS_F1 = [
    ['MAT', 'Mathematics', 'Mr T. Gama'], ['ENG', 'English Language', 'Mrs C. Binda'], ['SHO', 'ChiShona', 'Mr K. Mutasa'],
    ['SCI', 'Combined Science', 'Ms J. Chikore'], ['CSC', 'Computer Science', 'Mr P. Ndlovu'], ['GEO', 'Geography', 'Mrs F. Dube'],
    ['HIS', 'History', 'Mr A. Sibanda'], ['HER', 'Heritage Studies', 'Mrs F. Dube'], ['BAK', 'Bakery & Food Production', 'Mrs L. Moyo'],
  ];
  const SUBJECTS_F3 = [
    ['MAT', 'Mathematics', 'Mr T. Gama'], ['ENG', 'English Language', 'Mrs C. Binda'], ['CHE', 'Chemistry', 'Ms J. Chikore'],
    ['PHY', 'Physics', 'Mr R. Zhou'], ['BIO', 'Biology', 'Ms N. Hove'], ['CSC', 'Computer Science', 'Mr P. Ndlovu'],
    ['GEO', 'Geography', 'Mrs F. Dube'], ['ACC', 'Principles of Accounts', 'Mr S. Banda'], ['SPV', 'Solar PV Installation', 'Eng. T. Mhlanga'],
  ];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const grade = (m) => (m >= 75 ? 'A' : m >= 65 ? 'B' : m >= 50 ? 'C' : m >= 45 ? 'D' : m >= 40 ? 'E' : 'U');
  const COMMENTS = {
    A: ['Outstanding work, keep leading the class.', 'Excellent understanding and neat presentation.'],
    B: ['Very good effort; push for an A with more practice.', 'Strong grasp of the topic, well done.'],
    C: ['Good progress; revise past papers regularly.', 'Steady work; ask questions in class more often.'],
    D: ['Needs more practice on the basics.', 'Has potential; complete all homework on time.'],
    E: ['Please see the subject teacher for extra lessons.'], U: ['Urgent support needed; extra lessons arranged.'],
  };

  function results(subjects, bias) {
    return ['T1-2027', 'T2-2027'].map((term, ti) => ({
      term, label: ti ? 'Term 2 · 2027' : 'Term 1 · 2027', published: ti === 0,
      subjects: subjects.map(([code, name, teacher], i) => {
        const base = 52 + bias + (i * 37 % 23) + rnd() * 10 + ti * 4;
        const ca = Math.round(Math.min(40, base * .4 + rnd() * 3)), exam = Math.round(Math.min(60, base * .6 + rnd() * 5));
        const total = Math.min(100, ca + exam), g = grade(total), c = COMMENTS[g];
        return { code, name, teacher, ca, exam, total, grade: g, comment: c[Math.floor(rnd() * c.length)], class_avg: Math.round(55 + rnd() * 10) };
      }),
    }));
  }
  function attendance(rate) {          // school days of Term 1 2027 up to the demo "today"
    const days = [], d = new Date('2027-01-11');
    while (d <= new Date('2027-03-10')) {
      if (d.getDay() && d.getDay() < 6) {
        const r = rnd(), status = r < rate ? 'present' : r < rate + .04 ? 'late' : r < rate + .06 ? 'excused' : 'absent';
        days.push({ date: d.toISOString().slice(0, 10), status });
      }
      d.setDate(d.getDate() + 1);
    }
    return days;
  }
  const PERIODS = ['07:30', '08:20', '09:10', '10:20', '11:10', '12:00', '14:00'];
  function timetable(subjects) {
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, di) => ({
      day, periods: PERIODS.map((start, pi) => {
        const s = subjects[(di * 3 + pi * 2) % subjects.length];
        return { start, code: s[0], subject: s[1], teacher: s[2], room: pi === 6 && di % 2 ? 'Workshop' : `Room ${1 + (di + pi) % 6}` };
      }),
    }));
  }

  const F1 = {
    id: 'RCA-27-0142', admission_no: 'RCA-27-0142', name: 'Tanaka Moyo', first: 'Tanaka', form: 'Form 1', stream: '1 Blue',
    house: 'Kariba', residence: 'Boarder', hostel: 'Block A', class_teacher: 'Mrs C. Binda',
    xp: 1240, level: 4, next_level_xp: 1500, merits: 18, demerits: 1, position: 7, class_size: 38,
    trend: [{ label: 'Wk 2', avg: 58 }, { label: 'Wk 4', avg: 61 }, { label: 'Wk 6', avg: 60 }, { label: 'Wk 8', avg: 65 }, { label: 'Mid', avg: 68 }, { label: 'Wk 10', avg: 70 }, { label: 'Wk 12', avg: 72 }],
    results: results(SUBJECTS_F1, 6), attendance: attendance(.9), timetable: timetable(SUBJECTS_F1),
    skills: [
      { form: 1, trade: 'Bakery & Food Production', status: 'active', progress: .72, badge: 'Bread & pastry basics' },
      { form: 2, trade: 'Arc & Gas Welding', status: 'locked', progress: 0 },
      { form: 3, trade: 'Solar PV Installation', status: 'locked', progress: 0 },
      { form: 4, trade: 'Carpentry & Joinery', status: 'locked', progress: 0 },
      { form: 5, trade: 'Cosmetology & Design', status: 'locked', progress: 0 },
    ],
    assignments: [
      { id: 'a1', subject: 'Mathematics', title: 'Algebra exercise 4B (Q1–20)', due: '2027-03-11', status: 'pending' },
      { id: 'a2', subject: 'Combined Science', title: 'Lab report: separating mixtures', due: '2027-03-12', status: 'pending' },
      { id: 'a3', subject: 'English Language', title: 'Composition: “My first week at Royal Crest”', due: '2027-03-15', status: 'pending' },
      { id: 'a4', subject: 'Bakery & Food Production', title: 'Practical: bread rolls (bring an apron)', due: '2027-03-16', status: 'pending' },
      { id: 'a5', subject: 'History', title: 'Great Zimbabwe timeline', due: '2027-03-08', status: 'submitted' },
    ],
    fees: {
      currency: 'USD', term: 'Term 1 · 2027', due: '2027-01-15',
      lines: [['Tuition', 250], ['Development levy (SDC)', 150], ['Boarding', 300], ['Practicals', 100], ['Science', 50]],
      invoiced: 850, paid: 600, balance: 250,
      payments: [{ date: '2027-01-08', amount: 400, ref: 'RC-0091', method: 'EcoCash' }, { date: '2027-02-12', amount: 200, ref: 'RC-0178', method: 'Bank transfer' }],
    },
  };
  const F3 = {
    id: 'RCA-27-0087', admission_no: 'RCA-27-0087', name: 'Rufaro Moyo', first: 'Rufaro', form: 'Form 3', stream: '3 Gold',
    house: 'Mutirikwi', residence: 'Boarder', hostel: 'Block B', class_teacher: 'Mr R. Zhou',
    xp: 2980, level: 9, next_level_xp: 3200, merits: 26, demerits: 0, position: 3, class_size: 34,
    trend: [{ label: 'Wk 2', avg: 66 }, { label: 'Wk 4', avg: 69 }, { label: 'Wk 6', avg: 71 }, { label: 'Wk 8', avg: 70 }, { label: 'Mid', avg: 74 }, { label: 'Wk 10', avg: 76 }, { label: 'Wk 12', avg: 77 }],
    results: results(SUBJECTS_F3, 14), attendance: attendance(.95), timetable: timetable(SUBJECTS_F3),
    skills: [
      { form: 1, trade: 'Bakery & Food Production', status: 'done', progress: 1, badge: 'Certified baker (internal)' },
      { form: 2, trade: 'Arc & Gas Welding', status: 'done', progress: 1, badge: 'Safe welding practice' },
      { form: 3, trade: 'Solar PV Installation', status: 'active', progress: .41, badge: 'Panel wiring basics' },
      { form: 4, trade: 'Carpentry & Joinery', status: 'locked', progress: 0 },
      { form: 5, trade: 'Cosmetology & Design', status: 'locked', progress: 0 },
    ],
    assignments: [
      { id: 'b1', subject: 'Chemistry', title: 'Titration practical write-up', due: '2027-03-11', status: 'pending' },
      { id: 'b2', subject: 'Physics', title: 'Ohm’s law worksheet', due: '2027-03-13', status: 'pending' },
      { id: 'b3', subject: 'Solar PV Installation', title: 'Wiring diagram: 2-panel system', due: '2027-03-17', status: 'pending' },
    ],
    fees: {
      currency: 'USD', term: 'Term 1 · 2027', due: '2027-01-15',
      lines: [['Tuition', 250], ['Development levy (SDC)', 150], ['Boarding', 300], ['Practicals', 100], ['Science', 50]],
      invoiced: 850, paid: 850, balance: 0,
      payments: [{ date: '2027-01-06', amount: 850, ref: 'RC-0042', method: 'Bank transfer' }],
    },
  };
  const NOTICES = [
    { id: 'n1', date: '2027-03-09', title: 'Visiting Sunday: 14 March', body: 'Parents may visit boarders from 10:00 to 15:00. Please sign in at the gate.', tag: 'Boarding' },
    { id: 'n2', date: '2027-03-05', title: 'Mid-term reports published', body: 'Term 1 mid-term results are now available in the Results tab.', tag: 'Academics' },
    { id: 'n3', date: '2027-03-01', title: 'Science fair: entries open', body: 'Learners may enter projects in Chemistry, Physics and Robotics. Deadline 26 March.', tag: 'Clubs' },
  ];

  window.RC_MOCK = {
    TODAY: '2027-03-10',
    users: {
      learner: { role: 'learner', name: 'Tanaka Moyo', students: ['RCA-27-0142'] },
      parent: { role: 'parent', name: 'Mrs R. Moyo', students: ['RCA-27-0142', 'RCA-27-0087'] },
    },
    students: { 'RCA-27-0142': F1, 'RCA-27-0087': F3 },
    notices: NOTICES,
  };
})();
