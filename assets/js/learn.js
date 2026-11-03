/* Royal Crest learning pages: header, mobile menu, reveal on scroll. No dependencies. */
(() => {
  'use strict';
  const header = document.querySelector('[data-header]');
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let lastY = window.scrollY;
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    const open = header.classList.contains('menu-open');
    header.classList.toggle('is-hidden', !open && y > lastY && y > 480);
    lastY = y;
  }, { passive: true });

  function setMenu(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
    header.classList.toggle('menu-open', open);
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  if (toggle && menu) {
    toggle.addEventListener('click', () => setMenu(toggle.getAttribute('aria-expanded') !== 'true'));
    menu.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
  }

  const els = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    els.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -5% 0px' });
    els.forEach((el) => io.observe(el));
  }
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
