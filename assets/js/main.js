/* Royal Crest Academy — site interactions (no dependencies). */
(() => {
  'use strict';

  const WHATSAPP_NUMBER = '263714404090';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: solid on scroll, hide on scroll down ---------- */
  const header = document.querySelector('[data-header]');
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  let lastY = window.scrollY;
  let ticking = false;

  const waFab = document.querySelector('.wa-fab');

  function updateHeader() {
    const y = window.scrollY;
    waFab.classList.toggle('is-visible', y > window.innerHeight * 0.6);
    header.classList.toggle('is-scrolled', y > 8);
    const menuOpen = header.classList.contains('menu-open');
    const goingDown = y > lastY;
    header.classList.toggle('is-hidden', !menuOpen && goingDown && y > 480);
    lastY = y;
  }

  /* ---------- Mobile menu ---------- */
  function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.querySelector('.sr-only').textContent = open ? 'Close menu' : 'Open menu';
    header.classList.toggle('menu-open', open);
    document.body.classList.toggle('is-locked', open);
    if (open) {
      menu.hidden = false;
      requestAnimationFrame(() => menu.classList.add('is-open'));
      menu.querySelector('a').focus({ preventScroll: true });
    } else {
      menu.classList.remove('is-open');
      window.setTimeout(() => { if (!header.classList.contains('menu-open')) menu.hidden = true; }, 350);
    }
  }

  menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
  });
  menu.addEventListener('click', (e) => {
    if (e.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('menu-open')) {
      setMenu(false);
      menuToggle.focus();
    }
  });
  // Keep keyboard focus inside the open menu (toggle button + menu links).
  header.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab' || !header.classList.contains('menu-open')) return;
    const focusables = [menuToggle, ...menu.querySelectorAll('a')];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.matchMedia('(min-width: 1081px)').addEventListener('change', (e) => {
    if (e.matches && header.classList.contains('menu-open')) setMenu(false);
  });

  /* ---------- Active nav link ---------- */
  const navLinks = [...document.querySelectorAll('.primary-nav a')];
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);

  // Highlight the section currently under the upper part of the viewport; none while in the hero.
  function updateActiveNav() {
    const line = window.innerHeight * 0.35;
    let active = null;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= line) active = section;
    });
    if (active && active.getBoundingClientRect().bottom < line) active = null;
    navLinks.forEach((a) => {
      if (active && a.getAttribute('href') === `#${active.id}`) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal, .reveal-image');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-in'));
  } else {
    const revealObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        obs.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ---------- Subtle parallax ---------- */
  const parallaxEls = reduceMotion ? [] : [...document.querySelectorAll('[data-parallax]')];
  const parallaxQuery = window.matchMedia('(min-width: 901px)');

  function updateParallax() {
    if (!parallaxQuery.matches) return;
    const vh = window.innerHeight;
    parallaxEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const speed = parseFloat(el.dataset.parallax) || 0.05;
      const offset = (rect.top + rect.height / 2 - vh / 2) * -speed;
      el.style.setProperty('--py', `${offset.toFixed(1)}px`);
    });
  }
  // Once the reveal zoom has finished, drop the transform transition so parallax tracks the scroll exactly.
  parallaxEls.forEach((el) => {
    const img = el.querySelector('img');
    img.addEventListener('transitionend', (e) => {
      if (e.propertyName === 'transform' && el.classList.contains('is-in')) el.classList.add('is-settled');
    });
  });

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateActiveNav();
      updateParallax();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  updateHeader();
  updateActiveNav();
  updateParallax();

  /* ---------- Count-up stats ---------- */
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target;
        const target = Number(el.dataset.count);
        const duration = 1400;
        const start = performance.now();
        const step = (now) => {
          const p = Math.min((now - start) / duration, 1);
          el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(step);
        };
        el.textContent = '0';
        requestAnimationFrame(step);
        obs.unobserve(el);
      });
    }, { threshold: 0.6 });
    counters.forEach((el) => countObserver.observe(el));
  }

  /* ---------- Gallery lightbox ---------- */
  const lightbox = document.querySelector('[data-lightbox]');
  const galleryButtons = [...document.querySelectorAll('[data-gallery] .gallery-btn')];

  if (lightbox && typeof lightbox.showModal === 'function' && galleryButtons.length) {
    const lbImg = lightbox.querySelector('[data-lightbox-img]');
    const lbCaption = lightbox.querySelector('[data-lightbox-caption]');
    let current = 0;
    let opener = null;

    const show = (index) => {
      current = (index + galleryButtons.length) % galleryButtons.length;
      const btn = galleryButtons[current];
      const thumb = btn.querySelector('img');
      lbImg.src = btn.dataset.full;
      lbImg.alt = thumb.alt;
      lbCaption.textContent = `${btn.dataset.caption} — ${current + 1} of ${galleryButtons.length}`;
      // restart the entrance animation
      lbImg.style.animation = 'none';
      void lbImg.offsetWidth;
      lbImg.style.animation = '';
    };

    galleryButtons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        opener = btn;
        show(i);
        lightbox.showModal();
        document.body.classList.add('is-locked');
      });
    });

    lightbox.querySelector('[data-lightbox-close]').addEventListener('click', () => lightbox.close());
    lightbox.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(current - 1));
    lightbox.querySelector('[data-lightbox-next]').addEventListener('click', () => show(current + 1));
    lightbox.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
    // close when clicking the backdrop (outside the figure and controls)
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) lightbox.close();
    });
    lightbox.addEventListener('close', () => {
      document.body.classList.remove('is-locked');
      if (opener) opener.focus();
    });
  } else {
    // Without <dialog> support, open the full image directly.
    galleryButtons.forEach((btn) => {
      btn.addEventListener('click', () => window.open(btn.dataset.full, '_blank', 'noopener'));
    });
  }

  /* ---------- Enquiry form → WhatsApp ---------- */
  const form = document.querySelector('[data-enquiry-form]');
  if (form) {
    const status = form.querySelector('[data-form-status]');
    const required = [...form.querySelectorAll('[required]')];

    const validateField = (input) => {
      const value = input.value.trim();
      let valid = value.length > 0;
      if (valid && input.type === 'tel') valid = /^[+0-9 ()-]{7,}$/.test(value) && value.replace(/\D/g, '').length >= 7;
      input.setAttribute('aria-invalid', String(!valid));
      const error = document.getElementById(`${input.id}-error`);
      if (error) {
        error.hidden = valid;
        if (valid) input.removeAttribute('aria-describedby');
        else input.setAttribute('aria-describedby', error.id);
      }
      return valid;
    };

    required.forEach((input) => {
      input.addEventListener('blur', () => { if (input.value) validateField(input); });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') validateField(input);
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const results = required.map(validateField);
      const firstInvalid = required[results.indexOf(false)];
      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const data = new FormData(form);
      const get = (key) => String(data.get(key) || '').trim();
      const lines = [
        'Hello Royal Crest Academy, I would like to enquire about admissions for 2027.',
        '',
        `Student: ${get('student')}`,
        `Parent/guardian: ${get('parent')}`,
        `Phone: ${get('phone')}`,
        `Entry level: ${get('level') || 'Not sure yet'}`,
        `Interested in: ${get('interest')}`,
      ];
      if (get('message')) lines.push('', get('message'));

      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join('\n'))}`;
      const win = window.open(url, '_blank');
      if (win) win.opener = null;
      else window.location.href = url; // popup blocked: continue in this tab

      status.textContent = 'WhatsApp has opened with your enquiry. Press send there to reach our admissions team.';
      status.classList.add('is-success');
    });
  }

  /* ---------- WhatsApp prompt (once per session, never auto-redirects) ---------- */
  const prompt = document.querySelector('[data-wa-prompt]');
  const PROMPT_KEY = 'rca_wa_prompt_seen';
  const PROMPT_DELAY = 25000;

  const storage = {
    get(key) { try { return sessionStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { sessionStorage.setItem(key, value); } catch { /* storage unavailable */ } },
  };

  if (prompt && !storage.get(PROMPT_KEY)) {
    const hidePrompt = () => {
      prompt.classList.remove('is-visible');
      window.setTimeout(() => { prompt.hidden = true; }, 400);
    };
    window.setTimeout(() => {
      // Don't interrupt someone who is already filling in the form or has the menu open.
      const busy = form && form.contains(document.activeElement);
      if (busy || header.classList.contains('menu-open') || (lightbox && lightbox.open)) return;
      storage.set(PROMPT_KEY, '1');
      prompt.hidden = false;
      requestAnimationFrame(() => prompt.classList.add('is-visible'));
    }, PROMPT_DELAY);
    prompt.querySelectorAll('[data-wa-dismiss]').forEach((el) => el.addEventListener('click', hidePrompt));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !prompt.hidden) hidePrompt();
    });
  }

  /* ---------- Footer year ---------- */
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
