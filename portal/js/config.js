/* Crest Quest portal — runtime configuration.
 *
 * API_BASE  Where the portal API lives (see /portal/api/README.md).
 *           Leave empty to run on the built-in demo data. When the Crestbot /
 *           portal server is live, set it here, e.g. "https://api.royalcrestacademy.com",
 *           or override per page load with ?api=https://… (handy for testing).
 * DEMO      Show the "Try the demo" buttons on the sign-in screen.
 */
window.RC_CONFIG = Object.assign({
  HUB: 'https://davincii-code-karlissa.hf.space',   // the Royal Crest hub (Karlissa Space)
  API_BASE: null,                                   // null = use HUB; '' = demo data only
  API_VERSION: 'v1',
  DEMO: true,
  SCHOOL: 'Royal Crest Academy',
  PHONE: '+263 714 404 090',
  SITE: '/',
  APP_DEEP_LINK: 'royalcrest://portal',     // Royal Crest Connect (Android) deep-link scheme
}, window.RC_CONFIG || {});

(() => {
  const q = new URLSearchParams(location.search);
  const C = window.RC_CONFIG;
  if (C.API_BASE === null) C.API_BASE = C.HUB;
  if (q.get('api')) C.API_BASE = q.get('api').replace(/\/$/, '');
  if (q.get('demo') === '1') C.API_BASE = '';
  window.RC_CONFIG.EMBED = q.get('embed') === '1' || q.get('embed') === 'app';   // inside the app's WebView
})();
