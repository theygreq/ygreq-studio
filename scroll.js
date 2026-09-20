// YGREQ.STUDIO — scroll engine (ES module)
// Natural Lenis smooth scroll + gentle section assist + parallax, hero exit, marquee.
// Disabled entirely for prefers-reduced-motion.

import Lenis from 'https://esm.sh/lenis';

// ============================================================
//  TUNING
// ============================================================
const LENIS_LERP       = 0.08;

// Section assist — fires only for [data-snap] sections.
// Catches a resting scroll that lands within ASSIST_THRESHOLD px of a
// data-snap section top, then eases it the remaining distance.
const ASSIST_THRESHOLD = 90;   // px catch radius from section top
const ASSIST_DEBOUNCE  = 140;  // ms idle before assist check fires
const ASSIST_DURATION  = 0.4;  // s easing duration (always short travel)

const easeOutCubic = t => 1 - Math.pow(1 - t, 3);
// ============================================================

// ---- Section counter -------------------------------------------
// Runs unconditionally (not nested inside the Lenis branch below), so it
// works identically under prefers-reduced-motion (where Lenis never
// initialises). initSectionCounter() returns an update function used two
// ways below: driven every frame by Lenis's own rAF loop when Lenis is
// active (the same loop that already reliably drives parallax/hero-exit —
// this avoids relying on native 'scroll' event timing, which Lenis
// deliberately suppresses on itself during smooth-wheel animation via an
// internal _preventNextNativeScrollEvent flag), and by a plain native
// 'scroll' listener as the fallback when Lenis is disabled.
function initSectionCounter() {
  const allSections    = [...document.querySelectorAll('section')];
  const counterCurrent = document.getElementById('counterCurrent');
  const counterTotal   = document.getElementById('counterTotal');
  if (!allSections.length || !counterCurrent || !counterTotal) return null;

  counterTotal.textContent = String(allSections.length).padStart(2, '0');

  function updateCounter() {
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    let cur = 0;
    allSections.forEach((s, i) => {
      const top = s.getBoundingClientRect().top + scrollY;
      if (top <= scrollY + vh * 0.5) cur = i;
    });
    const next = String(cur + 1).padStart(2, '0');
    if (counterCurrent.textContent !== next) counterCurrent.textContent = next;
  }

  updateCounter();
  return updateCounter;
}
const updateSectionCounter = initSectionCounter();

// Belt-and-suspenders: always attach a plain native 'scroll' listener too
// (rAF-throttled), not just the Lenis-raf hook added below when Lenis is
// active. Native 'scroll' fires on window regardless of Lenis's internal
// bookkeeping, so this path still works even in a context where Lenis's
// own rAF loop is stalled (e.g. a backgrounded/hidden tab throttling
// requestAnimationFrame) as long as the browser is dispatching scroll
// events at all. Harmless overlap with the raf-loop hook when both fire.
if (updateSectionCounter) {
  let counterTicking = false;
  window.addEventListener('scroll', () => {
    if (counterTicking) return;
    counterTicking = true;
    requestAnimationFrame(() => { counterTicking = false; updateSectionCounter(); });
  }, { passive: true });
}

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (reduced) {
  window.__lenis = null;
} else {

  // ---- Lenis init ------------------------------------------------
  const lenis = new Lenis({
    lerp:        LENIS_LERP,
    smoothWheel: true,
    syncTouch:   false,
  });
  window.__lenis = lenis;

  // ---- Section assist --------------------------------------------
  const snapSections = [...document.querySelectorAll('[data-snap]')];
  let assistTimer = null;

  lenis.on('scroll', () => {
    // Assist
    clearTimeout(assistTimer);
    assistTimer = setTimeout(() => {
      if (Math.abs(lenis.velocity) > 0.15) return;
      const scrollY = lenis.scroll;
      let nearest = null, nearestDist = Infinity;
      snapSections.forEach(s => {
        const top  = s.getBoundingClientRect().top + scrollY;
        const dist = Math.abs(scrollY - top);
        if (dist > 2 && dist <= ASSIST_THRESHOLD && dist < nearestDist) {
          nearestDist = dist; nearest = top;
        }
      });
      if (nearest !== null) {
        lenis.scrollTo(Math.round(nearest), { duration: ASSIST_DURATION, easing: easeOutCubic });
      }
    }, ASSIST_DEBOUNCE);
  });

  // ---- Parallax setup --------------------------------------------
  const parallaxPairs = [];
  document.querySelectorAll('.parallax-frame').forEach(frame => {
    const inner = frame.firstElementChild;
    if (inner) parallaxPairs.push({ frame, inner });
  });

  const heroMedia   = document.querySelector('.hero__media');
  const heroSection = document.querySelector('.hero');

  // ---- Marquee setup ---------------------------------------------
  const marquee      = document.querySelector('.marquee');
  const marqueeTrack = document.getElementById('marqueeTrack');
  if (marqueeTrack) {
    let marqueeX = 0, marqueePrev = 0, marqueeW = 0;

    requestAnimationFrame(function measureMarquee() {
      marqueeW = marqueeTrack.firstElementChild?.offsetWidth || 0;
      if (!marqueeW) { requestAnimationFrame(measureMarquee); return; }
      if (marquee) marquee.classList.add('marquee--js');
      requestAnimationFrame(marqueeTick);
    });

    function marqueeTick(time) {
      const dt    = marqueePrev ? Math.min(time - marqueePrev, 50) : 16.67;
      marqueePrev = time;
      const vel   = lenis.velocity || 0;
      const nudge = Math.sign(vel) * Math.min(Math.abs(vel) * 0.22, 2.5);
      marqueeX   -= (0.45 + nudge) * (dt / 16.67);
      if (marqueeX <= -marqueeW) marqueeX += marqueeW;
      if (marqueeX >   0)        marqueeX  = 0;
      marqueeTrack.style.transform = `translateX(${marqueeX}px)`;
      requestAnimationFrame(marqueeTick);
    }
  }

  // ---- Main rAF loop ---------------------------------------------
  function raf(time) {
    lenis.raf(time);
    updateParallax();
    updateHeroExit();
    if (updateSectionCounter) updateSectionCounter();
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  function updateParallax() {
    const vh = window.innerHeight;
    parallaxPairs.forEach(({ frame, inner }) => {
      const rect = frame.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const progress = (vh - rect.top) / (vh + rect.height);
      const clamped  = Math.max(0, Math.min(1, progress));
      const travel   = (0.5 - clamped) * rect.height * 0.08;
      inner.style.transform = `scale(1.10) translateY(${travel}px)`;
    });
  }

  function updateHeroExit() {
    if (!heroMedia || !heroSection) return;
    const scrollY = lenis.scroll;
    if (scrollY > heroSection.offsetHeight) return;
    const progress = scrollY / heroSection.offsetHeight;
    heroMedia.style.transform = `scale(${1 + progress * 0.05})`;
  }
}
