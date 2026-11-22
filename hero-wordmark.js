// YGREQ.STUDIO — hero wordmark
// STUDIO rolls in Solari/split-flap style; YGREQ. lands instantly.
// Letters are coloured via a shared clay/gold/olive gradient clipped to
// each glyph, positioned so the gradient runs continuously across the
// whole wordmark rather than repeating per-letter.
// Ported from the texture-lab exploration (Ember colourway).

(function () {
  // ---- shared reel mechanics ----
  // One split-flap reel = a clipped slot holding a vertical strip of cells,
  // tweened up with easeOutQuart. Exposed as window.YGREQReel so other
  // boards (coming-soon.js) build the same reel rather than a copy of it.
  const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function randomGlyphs(n) {
    const out = [];
    for (let k = 0; k < n; k++) out.push(GLYPHS[Math.floor(Math.random() * GLYPHS.length)]);
    return out;
  }
  function buildReel(cells, cellClass) {
    const slot = document.createElement('span'); slot.className = 'reel';
    const strip = document.createElement('span'); strip.className = 'reel__strip';
    cells.forEach(g => {
      const cell = document.createElement('span'); cell.className = cellClass || 'reel__cell';
      cell.textContent = g;
      strip.appendChild(cell);
    });
    slot.appendChild(strip);
    slot.dataset.count = cells.length;
    return slot;
  }
  function easeOutQuart(t) { return 1 - Math.pow(1 - t, 4); }
  // tween a strip's translateY from `from` to `to` (px); `done` fires once at the end
  function tween(strip, to, dur, delayMs, from, done) {
    from = from || 0;
    const t0 = performance.now() + delayMs;
    function step(now) {
      let t = (now - t0) / dur;
      if (t < 0) { requestAnimationFrame(step); return; }
      if (t > 1) t = 1;
      strip.style.transform = `translateY(${from + (to - from) * easeOutQuart(t)}px)`;
      if (t < 1) requestAnimationFrame(step);
      else if (done) done();
    }
    requestAnimationFrame(step);
  }
  window.YGREQReel = { GLYPHS, randomGlyphs, buildReel, tween, easeOutQuart };

  const host = document.getElementById('heroWordmark');
  if (!host) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const WORD = 'YGREQ.STUDIO';
  const ANIM_FROM = 'YGREQ.'.length; // STUDIO starts here

  // Opt-in (data-overshoot on #heroWordmark, used by coming-soon.html):
  // on the first play only, STUDIO's reels run 3–5 glyphs past the real
  // letter and roll back to it, as if the board isn't quite ready.
  // Self-replays are normal. Absent the attribute, nothing changes.
  let overshootPending = host.hasAttribute('data-overshoot') && !reduce;

  function build(overshoot) {
    host.innerHTML = '';
    [...WORD].forEach((ch, i) => {
      const animated = i >= ANIM_FROM && ch !== '.';
      let cells, target = 0;
      if (animated) {
        cells = randomGlyphs(9 + Math.floor(Math.random() * 6));
        target = cells.length;
        cells.push(ch);
        if (overshoot) cells.push(...randomGlyphs(3 + Math.floor(Math.random() * 3)));
      } else {
        cells = [ch];
      }
      const slot = buildReel(cells, 'reel__cell');
      slot.dataset.animated = animated ? '1' : '0';
      slot.dataset.target = target;
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

  function play() {
    host.querySelectorAll('.reel').forEach(slot => {
      const strip = slot.firstChild;
      const n = +slot.dataset.count;
      if (slot.dataset.animated !== '1' || n < 2) return;
      const cellH = strip.querySelector('.reel__cell').getBoundingClientRect().height;
      const dist = -(+slot.dataset.target) * cellH;
      strip.style.transform = 'translateY(0)';
      if (reduce) { strip.style.transform = `translateY(${dist}px)`; return; }
      const order = +slot.dataset.order;
      const end = -(n - 1) * cellH;
      if (end === dist) { tween(strip, dist, 1150, 120 + order * 120); return; }
      // overshoot: run to the last spare glyph, catch, roll back to the letter
      tween(strip, end, 1150, 120 + order * 120, 0, () => tween(strip, dist, 820, 260, end));
    });
  }

  function trigger() {
    build(overshootPending);
    overshootPending = false;
    requestAnimationFrame(() => { layout(); requestAnimationFrame(play); });
  }

  // With the overshoot (first-load) path, wait for the wordmark's own font
  // before measuring: measured in the fallback, the slots are the wrong widths
  // and every letter jumps when DM Sans swaps in mid-roll. Capped at 1.5 s.
  if (overshootPending && document.fonts && document.fonts.load) {
    host.style.visibility = 'hidden';
    const font = `600 1em ${getComputedStyle(host).fontFamily}`;
    Promise.race([document.fonts.load(font), new Promise(r => setTimeout(r, 1500))])
      .catch(() => {})
      .then(() => { host.style.visibility = ''; trigger(); });
  } else {
    trigger();
  }

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
