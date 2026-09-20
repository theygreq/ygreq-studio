// YGREQ.STUDIO — hero wordmark
// STUDIO rolls in Solari/split-flap style; YGREQ. lands instantly.
// Letters are coloured via a shared clay/gold/olive gradient clipped to
// each glyph, positioned so the gradient runs continuously across the
// whole wordmark rather than repeating per-letter.
// Ported from the texture-lab exploration (Ember colourway).

(function () {
  const host = document.getElementById('heroWordmark');
  if (!host) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORD = 'YGREQ.STUDIO';
  const ANIM_FROM = 'YGREQ.'.length; // STUDIO starts here
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  function build() {
    host.innerHTML = '';
    [...WORD].forEach((ch, i) => {
      const slot = document.createElement('span'); slot.className = 'reel';
      const strip = document.createElement('span'); strip.className = 'reel__strip';
      const animated = i >= ANIM_FROM && ch !== '.';
      let cells;
      if (animated) {
        const steps = 9 + Math.floor(Math.random() * 6);
        cells = [];
        for (let k = 0; k < steps; k++) cells.push(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
        cells.push(ch);
      } else {
        cells = [ch];
      }
      cells.forEach(g => {
        const cell = document.createElement('span'); cell.className = 'reel__cell';
        cell.textContent = g;
        strip.appendChild(cell);
      });
      slot.appendChild(strip);
      slot.dataset.animated = animated ? '1' : '0';
      slot.dataset.count = cells.length;
      slot.dataset.order = i - ANIM_FROM;
      host.appendChild(slot);
    });
  }

  // measure each glyph's true advance width (matches the wordmark's own tracking)
  function measureAdvances() {
    const m = document.createElement('div');
    const cs = getComputedStyle(host);
    m.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre;visibility:hidden;';
    m.style.fontFamily = cs.fontFamily; m.style.fontWeight = cs.fontWeight;
    m.style.fontSize = cs.fontSize; m.style.letterSpacing = cs.letterSpacing;
    [...WORD].forEach(ch => { const s = document.createElement('span'); s.textContent = ch; m.appendChild(s); });
    document.body.appendChild(m);
    const ws = [...m.children].map(s => s.getBoundingClientRect().width);
    m.remove();
    return ws;
  }

  // size each slot to its true glyph width (correct spacing) and run the
  // colour gradient continuously across the whole wordmark
  function layout() {
    const adv = measureAdvances();
    const slots = [...host.querySelectorAll('.reel')];
    slots.forEach((slot, i) => { if (adv[i]) slot.style.width = adv[i] + 'px'; });
    const rowRect = host.getBoundingClientRect();
    const totalW = rowRect.width;
    slots.forEach(slot => {
      const left = slot.getBoundingClientRect().left - rowRect.left;
      slot.querySelectorAll('.reel__cell').forEach(cell => {
        cell.style.backgroundSize = totalW + 'px 100%';
        cell.style.backgroundPositionX = (-left) + 'px';
      });
    });
  }

  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  function tween(strip, to, dur, delayMs) {
    const t0 = performance.now() + delayMs;
    function step(now) {
      let t = (now - t0) / dur;
      if (t < 0) { requestAnimationFrame(step); return; }
      if (t > 1) t = 1;
      strip.style.transform = `translateY(${to * easeOutQuart(t)}px)`;
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function play() {
    host.querySelectorAll('.reel').forEach(slot => {
      const strip = slot.firstChild;
      const n = +slot.dataset.count;
      if (slot.dataset.animated !== '1' || n < 2) return;
      const cellH = strip.querySelector('.reel__cell').getBoundingClientRect().height;
      const dist = -(n - 1) * cellH;
      strip.style.transform = 'translateY(0)';
      if (reduce) { strip.style.transform = `translateY(${dist}px)`; return; }
      const order = +slot.dataset.order;
      tween(strip, dist, 1150, 120 + order * 120);
    });
  }

  function trigger() {
    build();
    requestAnimationFrame(() => { layout(); requestAnimationFrame(play); });
  }

  trigger();

  const heroSection = document.querySelector('.hero');
  let heroInView = true, wasOut = false;
  if (heroSection && 'IntersectionObserver' in window) {
    new IntersectionObserver(es => es.forEach(e => {
      heroInView = e.isIntersecting;
      if (!e.isIntersecting) { wasOut = true; }
      else if (wasOut) { wasOut = false; trigger(); }
    }), { threshold: 0.55 }).observe(heroSection);
  }

  // occasional self-replay while the hero is on screen
  if (!reduce) {
    setInterval(() => {
      if (heroInView && document.visibilityState === 'visible') trigger();
    }, 12000 + Math.random() * 4000);
  }

  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 150); });

  // ---- cinematic film grain, hero only ----
  const cv = document.getElementById('heroGrain');
  if (cv) {
    const ctx = cv.getContext('2d');
    const TILE = 84;
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileCanvas.height = TILE;
    const tctx = tileCanvas.getContext('2d');
    function regenTile() {
      const img = tctx.createImageData(TILE, TILE);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const n = (Math.random() + Math.random() + Math.random()) / 3;
        const v = Math.round(128 + (n - 0.5) * 2 * 55);
        d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255;
      }
      tctx.putImageData(img, 0, 0);
    }
    function size() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      cv.width = Math.max(2, r.width * dpr | 0);
      cv.height = Math.max(2, r.height * dpr | 0);
    }
    size(); addEventListener('resize', size);
    let visible = true;
    if (heroSection && 'IntersectionObserver' in window) {
      new IntersectionObserver(es => es.forEach(e => { visible = e.isIntersecting; }), { threshold: 0.2 }).observe(heroSection);
    }
    if (reduce) {
      regenTile();
      ctx.fillStyle = ctx.createPattern(tileCanvas, 'repeat');
      ctx.fillRect(0, 0, cv.width, cv.height);
    } else {
      let last = 0;
      (function tick(t) {
        if (visible && t - last > 130) {
          regenTile(); last = t;
          ctx.clearRect(0, 0, cv.width, cv.height);
          ctx.fillStyle = ctx.createPattern(tileCanvas, 'repeat');
          ctx.fillRect(0, 0, cv.width, cv.height);
        }
        requestAnimationFrame(tick);
      })(0);
    }
  }
})();
