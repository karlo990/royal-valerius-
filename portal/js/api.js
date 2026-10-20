/* Crest Quest — API client. Every server call the portal makes is listed here, matching
 * /portal/api/openapi.yaml. With no API_BASE configured the same calls are answered from
 * the demo data in mock.js, so the UI never needs to know which one it is talking to. */
(() => {
  const C = window.RC_CONFIG;
  const live = () => !!C.API_BASE;
  const root = () => `${C.API_BASE}/api/${C.API_VERSION}`;
  const TOKEN_KEY = 'rc_portal_session';

  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null'); } catch (e) { session = null; }
  const saveSession = (s) => { session = s; try { s ? sessionStorage.setItem(TOKEN_KEY, JSON.stringify(s)) : sessionStorage.removeItem(TOKEN_KEY); } catch (e) { /* private mode */ } };

  class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }

  async function http(method, path, body) {
    const res = await fetch(root() + path, {
      method, headers: { 'Content-Type': 'application/json', ...(session && session.token ? { Authorization: `Bearer ${session.token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.status === 401) { saveSession(null); window.dispatchEvent(new Event('rc:signed-out')); }
    if (!res.ok) {
      let msg = res.statusText;
      try { msg = (await res.json()).detail || msg; } catch (e) { /* not json */ }
      throw new ApiError(res.status, msg);
    }
    return res.status === 204 ? null : res.json();
  }

  // ── demo backend ──
  const M = () => window.RC_MOCK;
  const wait = (v) => new Promise((r) => setTimeout(() => r(JSON.parse(JSON.stringify(v))), 120 + Math.random() * 160));
  const stu = (id) => {
    const s = M().students[id];
    if (!s || !session || !session.user.students.includes(id)) throw new ApiError(404, 'Learner not found');
    return s;
  };
  const DEMO_LOGINS = { learner: { identifier: 'RCA-27-0142', pin: '2027' }, parent: { identifier: '0771234567', pin: '2027' } };
  const mock = {
    login({ role, identifier, pin }) {
      const d = DEMO_LOGINS[role];
      if (!d || identifier.trim().toUpperCase() !== d.identifier.toUpperCase() || pin !== d.pin) return Promise.reject(new ApiError(401, 'Those details do not match. Use the demo details shown below.'));
      return wait({ token: `demo-${role}`, user: M().users[role], demo: true });
    },
    me: () => wait(session.user),
    student: (id) => { const s = stu(id); const { results, attendance, timetable, assignments, fees, skills, ...p } = s; return wait(p); },
    results: (id, term) => wait(term ? stu(id).results.filter((r) => r.term === term) : stu(id).results),
    attendance: (id) => wait(stu(id).attendance),
    timetable: (id) => wait(stu(id).timetable),
    assignments: (id) => wait(stu(id).assignments),
    skills: (id) => wait(stu(id).skills),
    fees: (id) => wait(stu(id).fees),
    notices: () => wait(M().notices),
    crestbot: () => Promise.reject(new ApiError(503, 'offline')),      // chat falls back to the local brain
    registerDevice: () => wait({ ok: true }),
    sync: () => wait({ since: null, changes: [] }),
  };

  const API = {
    live, ApiError, DEMO_LOGINS,
    get session() { return session; },
    async login(creds) {
      const s = live() ? await http('POST', '/auth/login', creds) : await mock.login(creds);
      saveSession(s); return s;
    },
    async logout() { if (live() && session) { try { await http('POST', '/auth/logout'); } catch (e) { /* already gone */ } } saveSession(null); },
    setSession(s) { saveSession(s); },                                  // used by the app WebView bridge
    me: () => (live() ? http('GET', '/me') : mock.me()),
    student: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}`) : mock.student(id)),
    results: (id, term) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/results${term ? `?term=${encodeURIComponent(term)}` : ''}`) : mock.results(id, term)),
    attendance: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/attendance`) : mock.attendance(id)),
    timetable: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/timetable`) : mock.timetable(id)),
    assignments: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/assignments`) : mock.assignments(id)),
    skills: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/skills`) : mock.skills(id)),
    fees: (id) => (live() ? http('GET', `/students/${encodeURIComponent(id)}/fees`) : mock.fees(id)),
    reportUrl: (id, term) => (live() ? `${root()}/students/${encodeURIComponent(id)}/reports/${encodeURIComponent(term)}.pdf` : null),
    notices: () => (live() ? http('GET', '/notices') : mock.notices()),
    // Crestbot ("Kudzi"): the future AI server answers here; until then the portal's local brain does.
    crestbot: (payload) => (live() ? http('POST', '/crestbot/chat', payload) : mock.crestbot(payload)),
    crestbotFeedback: (payload) => (live() ? http('POST', '/crestbot/feedback', payload) : Promise.resolve(null)),
    // Royal Crest Connect (Android app) hooks
    registerDevice: (payload) => (live() ? http('POST', '/devices', payload) : mock.registerDevice(payload)),
    sync: (since) => (live() ? http('GET', `/sync${since ? `?since=${encodeURIComponent(since)}` : ''}`) : mock.sync(since)),
  };
  window.RC_API = API;
})();
