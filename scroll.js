// YGREQ.STUDIO — scroll engine (ES module)
// Lenis smooth scroll + gentle section assist + parallax, hero exit, marquee.
//
// Two profiles:
//   full  — pointer devices. Everything below, driven by one rAF loop.
//   lite  — touch devices and prefers-reduced-motion. Native scrolling, no
//           Lenis (not even downloaded), no parallax, no hero zoom, and the
//           marquee left to its CSS animation.
//
// Why lite exists: on a phone the scroll itself is already smooth and
// compositor-driven, while this file's per-frame work — a getBoundingClientRect
// per section and per parallax image, every frame — forces a synchronous
// layout on the main thread on each of those frames. Running that against
// native momentum scrolling is what made the whole site stutter on mobile.
// Parallax also reads as jitter rather than depth at phone size, so there is
// nothing to miss. Pointer devices are unchanged.

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

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const coarse  = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
const lite    = reduced || coarse;

// ---- Section counter -------------------------------------------
// Section tops are measured once and cached, rather than re-read from the
// layout on every call: the old version ran a getBoundingClientRect over
// every section on every frame, which is a forced layout per section per
// frame. Re-measured on resize, after load (images settle late and move
// everything below them) and on any body resize.
function initSectionCounter() {
  const allSections    = [...document.querySelectorAll('section')];
  const counterCurrent = document.getElementById('counterCurrent');
  const counterTotal   = document.getElementById('counterTotal');
  if (!allSections.length || !counterCurrent || !counterTotal) return null;

  counterTotal.textContent = String(allSections.length).padStart(2, '0');

  let tops = [];
  function measure() {
    const y = window.scrollY;
    tops = allSections.map(s => s.getBoundingClientRect().top + y);
    lastY = -1;            // force the next update to re-evaluate
  }

  let lastY = -1, lastIdx = -1;
  function updateCounter() {
    const scrollY = window.scrollY;
    if (scrollY === lastY) return;   // nothing moved — skip the whole pass
    lastY = scrollY;
    const mid = scrollY + window.innerHeight * 0.5;
    let cur = 0;
    for (let i = 0; i < tops.length; i++) if (tops[i] <= mid) cur = i;
    if (cur === lastIdx) return;     // same section — skip the DOM write
    lastIdx = cur;
    counterCurrent.textContent = String(cur + 1).padStart(2, '0');
  }

  measure();
  let measureTimer = null;
  const remeasure = () => { clearTimeout(measureTimer); measureTimer = setTimeout(measure, 150); };
  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('load', () => setTimeout(measure, 300));
  if ('ResizeObserver' in window) new ResizeObserver(remeasure).observe(document.body);

  return updateCounter;
}
const updateSectionCounter = initSectionCounter();

// Native 'scroll' drives the counter in lite mode, and also as a safety net
// in full mode: Lenis suppresses some native scroll events on itself during
// smooth-wheel animation, but the rAF loop covers that case, and this covers
// the reverse (a stalled rAF loop in a throttled tab). updateCounter() now
// early-exits when the scroll position has not changed, so the overlap is
// genuinely free.
if (updateSectionCounter) {
  let counterTicking = false;
  window.addEventListener('scroll', () => {
    if (counterTicking) return;
    counterTicking = true;
    requestAnimationFrame(() => { counterTicking = false; updateSectionCounter(); });
  }, { passive: true });
}

if (lite) {
  // No Lenis instance, and the module is never even fetched. Anything that
  // calls window.__lenis?.stop() / .start() (the menu overlay's scroll lock)
  // no-ops safely against null.
  window.__lenis = null;
} else {

  // ---- Lenis init ------------------------------------------------
  // Dynamic import so touch devices never pay for the download.
  const { default: Lenis } = await import('https://esm.sh/lenis');

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
    // The frame's first child is now the .wipe layer built by main.js, which
    // owns its own transform for the reveal. Parallax must write to the
    // photograph itself or the two would fight over one property.
    const inner = frame.querySelector('img, video') || frame.firstElementChild;
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
  // Parallax and the hero zoom only depend on scroll position, so they are
  // skipped on frames where it has not changed — which is most frames once
  // the page comes to rest. Lenis still ticks every frame; it needs to.
  let lastScroll = -1;
  function raf(time) {
    lenis.raf(time);
    const y = lenis.scroll;
    if (y !== lastScroll) {
      lastScroll = y;
      updateParallax();
      updateHeroExit(y);
      if (updateSectionCounter) updateSectionCounter();
    }
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

  function updateHeroExit(scrollY) {
    if (!heroMedia || !heroSection) return;
    if (scrollY > heroSection.offsetHeight) return;
    const progress = scrollY / heroSection.offsetHeight;
    heroMedia.style.transform = `scale(${1 + progress * 0.05})`;
  }
}
