/* Crest Quest portal — runtime configuration.
 *
 * API_BASE  Where the portal API lives (see /portal/api/README.md).
 *           Leave empty to run on the built-in demo data. When the Crestbot /
 *           portal server is live, set it here, e.g. "https://api.royalcrestacademy.com",
 *           or override per page load with ?api=https://… (handy for testing).
 * DEMO      Show the "Try the demo" buttons on the sign-in screen.
 */
window.RC_CONFIG = Object.assign({
  API_BASE: '',
  API_VERSION: 'v1',
  DEMO: true,
  SCHOOL: 'Royal Crest Academy',
  PHONE: '+263 714 404 090',
  SITE: '/',
  APP_DEEP_LINK: 'royalcrest://portal',     // Royal Crest Connect (Android) deep-link scheme
}, window.RC_CONFIG || {});

(() => {
  const q = new URLSearchParams(location.search);
  if (q.get('api')) window.RC_CONFIG.API_BASE = q.get('api').replace(/\/$/, '');
  window.RC_CONFIG.EMBED = q.get('embed') === '1' || q.get('embed') === 'app';   // inside the app's WebView
})();
