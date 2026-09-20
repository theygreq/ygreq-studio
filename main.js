// YGREQ.STUDIO — interactions

// mark JS as available (enables overlay nav, hides static inline links)
document.documentElement.classList.add('js');

// current year
document.getElementById('year').textContent = new Date().getFullYear();

// ============================================================
//  FULL-SCREEN MENU OVERLAY
// ============================================================
(function () {
  const toggle  = document.querySelector('.nav__toggle');
  const overlay = document.getElementById('menu-overlay');
  if (!toggle || !overlay) return;

  const curtain    = overlay.querySelector('.menu-overlay__curtain');
  const items      = [...overlay.querySelectorAll('.menu-item__inner')];
  const liItems    = [...overlay.querySelectorAll('.menu-item')];  // <li> — holds borders
  const ext        = overlay.querySelector('.menu-overlay__ext');
  const mediaItems = [...overlay.querySelectorAll('.menu-media')];

  // count badge next to "The Work" — computed from actual children so it
  // never goes stale as sub-items are added/removed
  overlay.querySelectorAll('[data-count-for]').forEach((el) => {
    const list = overlay.querySelector(el.dataset.countFor);
    if (list) el.textContent = `(${list.children.length})`;
  });

  // active-page indication: the current page's own sub-item (if any) reads
  // as permanently "hovered" rather than the default dimmed state
  overlay.querySelectorAll('.menu-item__child-link').forEach((link) => {
    if (location.pathname.endsWith('/' + link.getAttribute('href'))) {
      link.classList.add('is-current');
      link.setAttribute('aria-current', 'page');
    }
  });

  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let isOpen    = false;
  let closeTimer = null;

  // --- open -------------------------------------------------------
  function openMenu() {
    if (isOpen) return;
    isOpen = true;

    clearTimeout(closeTimer);
    overlay.removeAttribute('hidden');
    overlay.classList.remove('is-closing');

    // force reflow so initial transform is painted before transition
    overlay.offsetHeight; // eslint-disable-line no-unused-expressions
    overlay.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.textContent = 'Close';

    // lock background scroll (stop Lenis if running)
    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();

    if (reduced()) {
      // instant — no stagger
      items.forEach(el => el.classList.add('is-in'));
      if (ext) ext.classList.add('is-in');
      focusFirst();
    } else {
      // stagger items in after curtain is ~halfway (350ms)
      items.forEach((el, i) => {
        setTimeout(() => el.classList.add('is-in'), 350 + i * 65);
      });
      // ext links after last item
      setTimeout(() => { if (ext) ext.classList.add('is-in'); }, 350 + items.length * 65 + 40);
      setTimeout(focusFirst, 400);
    }

    document.addEventListener('keydown', handleKey);
  }

  // --- close -------------------------------------------------------
  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;

    toggle.setAttribute('aria-expanded', 'false');
    toggle.textContent = 'Menu';
    document.removeEventListener('keydown', handleKey);

    if (reduced()) {
      items.forEach(el => el.classList.remove('is-in'));
      if (ext) ext.classList.remove('is-in');
      overlay.classList.remove('is-open');
      overlay.classList.add('is-closing');
      overlay.setAttribute('hidden', '');
      overlay.classList.remove('is-closing');
      document.body.style.overflow = '';
      window.__lenis?.start();
      toggle.focus();
      return;
    }

    // 1. quickly fade items + their borders out together
    items.forEach(el => {
      el.style.transition = 'opacity 150ms linear, transform 150ms linear';
      el.classList.remove('is-in');
    });
    liItems.forEach(li => { li.style.opacity = '0'; });
    if (ext) {
      ext.style.transition = 'opacity 150ms linear';
      ext.classList.remove('is-in');
    }
    mediaItems.forEach(m => m.classList.remove('is-visible'));

    // 2. after items fade, trigger curtain exit
    closeTimer = setTimeout(() => {
      overlay.classList.remove('is-open');
      overlay.classList.add('is-closing');

      // 3. after curtain exits, hide overlay and reset
      closeTimer = setTimeout(() => {
        overlay.setAttribute('hidden', '');
        overlay.classList.remove('is-closing');
        document.body.style.overflow = '';
        window.__lenis?.start();
        // reset item transitions for next open
        items.forEach(el => { el.style.transition = ''; });
        liItems.forEach(li => { li.style.opacity = ''; });
        if (ext) ext.style.transition = '';
        toggle.focus();
      }, 750); // matches --dur-menu
    }, 180);
  }

  // --- keyboard ---------------------------------------------------
  function handleKey(e) {
    if (e.key === 'Escape') { e.preventDefault(); closeMenu(); return; }
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    const focusable = [...overlay.querySelectorAll('a[href], button:not([disabled])')];
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  function focusFirst() {
    const first = overlay.querySelector('a[href], button');
    if (first) first.focus();
  }

  // --- hover image reveal + destination colour --------------------
  // Links are matched to their media panel and colour by data-for/data-category,
  // not array position — top-level destinations and their nested sub-items (e.g.
  // The Work's case-study children) all resolve the same way, so adding another
  // sub-item later is just markup, no JS changes.
  // Clears whatever destination colour is on the overlay — matched by prefix,
  // not a fixed list, because destinations can name their own field colour
  // (a project red, say) and a stale class would then fight the next hover.
  const clearColour = () => {
    [...overlay.classList].forEach((c) => {
      if (c.indexOf('menu-overlay--') === 0) overlay.classList.remove(c);
    });
  };

  const hoverLinks = [...overlay.querySelectorAll('[data-for]')]; // top-level + child links
  hoverLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      mediaItems.forEach(m => m.classList.remove('is-visible'));
      const media = overlay.querySelector(`.menu-media[data-for="${link.dataset.for}"]`);
      if (media) media.classList.add('is-visible');
      clearColour();
      const cat = link.dataset.category;
      if (cat) overlay.classList.add(`menu-overlay--${cat}`);
    });
  });
  const list = overlay.querySelector('.menu-overlay__list');
  if (list) {
    list.addEventListener('mouseleave', () => {
      mediaItems.forEach(m => m.classList.remove('is-visible'));
      clearColour();
    });
  }

  // --- toggle & link clicks ---------------------------------------
  toggle.addEventListener('click', () => isOpen ? closeMenu() : openMenu());

  overlay.addEventListener('click', (e) => {
    if (e.target.closest('.menu-item__link')) closeMenu();
  });
}());

// ============================================================
//  SCROLL REVEALS
// ============================================================

// Wrap mask-reveal elements with .reveal-inner so the clip works
document.querySelectorAll('[data-reveal-type="mask"]').forEach((el) => {
  const inner = document.createElement('span');
  inner.className = 'reveal-inner';
  inner.innerHTML = el.innerHTML;
  el.innerHTML = '';
  el.appendChild(inner);
});

// Wrap parallax images in an overflow:hidden frame BEFORE the IO is set up.
// clip-path on an element inside overflow:hidden doesn't animate in some browsers,
// so we transfer data-reveal / data-reveal-type to the FRAME — the clip reveal
// runs on the frame (not inside overflow:hidden), parallax runs on the inner element.
document.querySelectorAll('[data-parallax]').forEach((el) => {
  const frame = document.createElement('div');
  frame.className = 'parallax-frame';
  if (el.hasAttribute('data-reveal')) {
    frame.setAttribute('data-reveal', el.getAttribute('data-reveal'));
    el.removeAttribute('data-reveal');
  }
  if (el.hasAttribute('data-reveal-type')) {
    frame.setAttribute('data-reveal-type', el.getAttribute('data-reveal-type'));
    el.removeAttribute('data-reveal-type');
  }
  el.parentNode.insertBefore(frame, el);
  frame.appendChild(el);
});

const reveals = document.querySelectorAll('[data-reveal]');

// Reveal helper — adds the class that drives the CSS transition, but if the
// document is in the Page Visibility 'hidden' state (some embedding/preview
// contexts render in a technically-hidden iframe even while shown to the
// user), CSS transitions never tick forward and the element would stay
// frozen at its pre-reveal, invisible state forever. In that case, jump
// straight to the revealed end state with no transition instead.
function markRevealed(el) {
  el.classList.add('is-in');
  if (!document.hidden) return;
  const type = el.getAttribute('data-reveal-type');
  if (type === 'mask') {
    const inner = el.querySelector('.reveal-inner');
    if (inner) { inner.style.transition = 'none'; inner.style.transform = 'translateY(0)'; }
  } else if (type === 'image') {
    el.style.transition = 'none';
    el.style.clipPath = 'inset(0 0 0% 0)';
  } else {
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
  }
}

if ('IntersectionObserver' in window && reveals.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        markRevealed(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
  reveals.forEach((el) => io.observe(el));

  // Safety net: some embedding contexts (sandboxed iframes, odd initial layout
  // timing) never fire the IO callback for elements already in view on load,
  // which would otherwise leave mask/fade reveals permanently invisible.
  // Sweep once shortly after load and reveal anything still off-screen that
  // is already within the viewport bounds.
  const revealIfVisible = () => {
    reveals.forEach((el) => {
      if (el.classList.contains('is-in')) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        markRevealed(el);
        io.unobserve(el);
      }
    });
  };
  window.addEventListener('load', () => setTimeout(revealIfVisible, 400));
  setTimeout(revealIfVisible, 1200);

  // Ongoing safety net: some embedding contexts pause both CSS-transition
  // ticking AND IntersectionObserver callback delivery while the document
  // is Page-Visibility 'hidden' (even though it's genuinely on-screen to
  // the person using it), so scrolling a new element into view may never
  // trigger the IO at all. A plain 'scroll' listener still fires from real
  // scroll position changes regardless of that throttling, so use it as a
  // parallel, low-cost sweep (rAF-based throttling is avoided here since
  // rAF is exactly the kind of callback that gets paused in this scenario).
  let scrollSweepPending = false;
  window.addEventListener('scroll', () => {
    if (scrollSweepPending) return;
    scrollSweepPending = true;
    setTimeout(() => { scrollSweepPending = false; revealIfVisible(); }, 80);
  }, { passive: true });
} else {
  reveals.forEach((el) => markRevealed(el));
}

// ============================================================
//  CONTACT FORM — Web3Forms progressive enhancement
// ============================================================
(function () {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = form.querySelector('.contact-form__fields');
  const status = form.querySelector('.contact-form__status');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function showSuccess() {
    if (fields && !fields.hidden) {
      if (reducedMotion()) {
        fields.hidden = true;
      } else {
        fields.style.transition = 'opacity 300ms ease-out';
        fields.style.opacity = '0';
        setTimeout(() => { fields.hidden = true; }, 300);
      }
    }
    if (status) {
      status.hidden = false;
      status.textContent = "Thank you — I'll be in touch.";
      status.classList.remove('is-error');
      status.classList.add('is-success');
    }
  }

  function showError() {
    if (status) {
      status.hidden = false;
      status.textContent = "Something went wrong sending that — try again, or email hello@ygreq.studio directly.";
      status.classList.remove('is-success');
      status.classList.add('is-error');
    }
  }

  // Landed here via the no-JS redirect target after a real (non-fetch) POST
  // already succeeded server-side — show the same success state for anyone
  // who has JS by the time they arrive back on the page.
  if (location.search.includes('sent=1')) showSuccess();

  // Inline per-field error text, wired via aria-describedby, using the
  // browser's own validation message so it stays in sync with whatever
  // constraint actually failed.
  form.querySelectorAll('input[required], textarea[required]').forEach((el) => {
    const errorEl = document.getElementById(el.id + '-error');
    if (!errorEl) return;
    el.addEventListener('invalid', () => { errorEl.textContent = el.validationMessage; });
    el.addEventListener('input', () => {
      if (el.validity.valid) errorEl.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success !== false) {
        showSuccess();
      } else {
        showError();
      }
    } catch (err) {
      showError();
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}());

// ============================================================
//  LIGHTBOX — click a .zoomable photograph to view it full-screen
// ============================================================
(function () {
  const zoomables = [...document.querySelectorAll('.zoomable')];
  if (!zoomables.length) return;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // .zoomable is applied to plain <img>/.ph elements, neither of which is
  // natively interactive — enhance each one with button semantics here
  // rather than hand-writing role/tabindex on every photograph in every page.
  zoomables.forEach((el, i) => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    if (!el.hasAttribute('aria-label')) {
      const label = el.tagName === 'IMG' ? (el.alt || 'Photograph') : (el.getAttribute('data-ph') || 'Photograph');
      el.setAttribute('aria-label', `View ${label} full screen`);
    }
    el.addEventListener('click', () => openLightbox(i));
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(i); }
    });
  });

  // --- build the overlay once, append to <body> -------------------
  const overlay = document.createElement('div');
  overlay.className = 'lightbox';
  overlay.id = 'lightbox';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Image viewer');
  overlay.hidden = true;
  overlay.innerHTML = `
    <div class="lightbox__backdrop" data-lightbox-close></div>
    <div class="lightbox__stage"></div>
    <button type="button" class="lightbox__prev" aria-label="Previous photograph">←</button>
    <button type="button" class="lightbox__next" aria-label="Next photograph">→</button>
    <button type="button" class="lightbox__close" aria-label="Close">Close</button>
  `;
  document.body.appendChild(overlay);

  const stage    = overlay.querySelector('.lightbox__stage');
  const prevBtn  = overlay.querySelector('.lightbox__prev');
  const nextBtn  = overlay.querySelector('.lightbox__next');
  const closeBtn = overlay.querySelector('.lightbox__close');

  // no point offering prev/next through a "gallery" of one
  if (zoomables.length <= 1) { prevBtn.hidden = true; nextBtn.hidden = true; }

  let currentIndex = -1;
  let triggerEl    = null;
  let isOpen       = false;
  let closeTimer   = null;

  function renderStage(index) {
    const el = zoomables[index];
    stage.innerHTML = '';
    if (el.tagName === 'IMG') {
      const img = document.createElement('img');
      img.src = el.currentSrc || el.src;
      img.alt = el.alt || '';
      img.className = 'lightbox__img';
      stage.appendChild(img);
    } else {
      // still a .ph placeholder — show the same hatch pattern/label, larger,
      // so this keeps working exactly as-is once a real <img> replaces it
      const ph = document.createElement('div');
      ph.className = 'ph lightbox__ph';
      ph.setAttribute('data-ph', el.getAttribute('data-ph') || '');
      stage.appendChild(ph);
    }
  }

  function openLightbox(index) {
    clearTimeout(closeTimer);
    currentIndex = index;
    triggerEl = zoomables[index];
    renderStage(index);

    overlay.hidden = false;
    overlay.offsetHeight; // eslint-disable-line no-unused-expressions -- force reflow before transition
    overlay.classList.add('is-open');

    document.body.style.overflow = 'hidden';
    window.__lenis?.stop();

    document.addEventListener('keydown', handleKey);
    closeBtn.focus();
    isOpen = true;
  }

  function closeLightbox() {
    if (!isOpen) return;
    isOpen = false;
    overlay.classList.remove('is-open');
    document.removeEventListener('keydown', handleKey);

    const finish = () => {
      overlay.hidden = true;
      stage.innerHTML = '';
      document.body.style.overflow = '';
      window.__lenis?.start();
      triggerEl?.focus();
    };
    if (reducedMotion()) {
      finish();
    } else {
      closeTimer = setTimeout(finish, 260); // matches the CSS fade/scale duration
    }
  }

  function step(delta) {
    if (zoomables.length <= 1) return;
    currentIndex = (currentIndex + delta + zoomables.length) % zoomables.length; // wrap
    // triggerEl deliberately NOT reassigned here — focus returns to the image
    // that was originally clicked to open the lightbox, even after prev/next.
    renderStage(currentIndex);
  }

  function handleKey(e) {
    if (e.key === 'Escape')     { e.preventDefault(); closeLightbox(); return; }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); step(-1); return; }
    if (e.key === 'ArrowRight') { e.preventDefault(); step(1); return; }
    if (e.key === 'Tab') trapFocus(e);
  }

  function trapFocus(e) {
    const focusable = [...overlay.querySelectorAll('button')].filter(b => !b.hidden);
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }

  overlay.querySelector('[data-lightbox-close]').addEventListener('click', closeLightbox);
  closeBtn.addEventListener('click', closeLightbox);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
}());

// ============================================================
//  DISCIPLINE TILE VIDEO — plays only while the tile is revealed
// ============================================================
// The disciplines grid reveals its image on hover and only on hover (see
// .disc__img in styles.css), so the Motion tile's clip has no reason to decode
// until then. It ships preload="none" behind a poster still, starts on
// hover/focus, and rewinds on the way out so every visit begins on the same
// frame. Touch devices never fire hover, so there the tile shows its media
// outright (see the @media (hover: none) block in styles.css) and the clip runs
// whenever it is actually on screen instead.
(function () {
  const videos = document.querySelectorAll('[data-disc-video]');
  if (!videos.length) return;

  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const play = (v) => {
    if (reducedMotion()) return;          // the poster still is the whole experience
    const p = v.play();
    if (p && p.catch) p.catch(() => {});  // autoplay policy — poster stays, no throw
  };
  const stop = (v) => { v.pause(); v.currentTime = 0; };

  const canHover = window.matchMedia('(hover: hover)').matches;

  videos.forEach((v) => {
    v.muted = true;                       // iOS wants the property set, not just the attribute

    if (canHover) {
      const tile = v.closest('.disc__item') || v;
      tile.addEventListener('mouseenter', () => play(v));
      tile.addEventListener('mouseleave', () => stop(v));
      tile.addEventListener('focusin',    () => play(v));
      tile.addEventListener('focusout',   () => stop(v));
      return;
    }

    // touch: the tile shows the clip regardless, so run it while it's in view
    // and pause it when it isn't — no point decoding video three screens away.
    if (!('IntersectionObserver' in window)) { play(v); return; }
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play(v) : v.pause()));
    }, { threshold: 0.4 }).observe(v);
  });
}());
