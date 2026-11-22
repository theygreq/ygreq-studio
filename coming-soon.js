// YGREQ.STUDIO — coming soon ("lens cap on")
// The departures board, the shutter, and hold-to-expose.
// The wordmark is hero-wordmark.js (loaded first), which also provides the
// shared reel mechanics as window.YGREQReel.

(function () {
  const root = document.documentElement;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const R = window.YGREQReel;
  root.classList.add('cs-ready');

  /* ============================================================
     DEPARTURES BOARD
     ============================================================ */
  // Same disciplines, same order, as the home page's discipline grid.
  const DISCIPLINES = ['PHOTOGRAPHY', 'CREATIVE DIRECTION', 'BRAND IDENTITY',
                       'CONTENT PRODUCTION', 'MOTION', 'EDITORIAL'];
  const STATUS = 'IN PREPARATION';
  const ALTERNATES = ['HOLDING FOR LIGHT', 'ONE MORE PASS', 'NEARLY'];

  const board = document.getElementById('csBoard');
  const cols = board ? {
    left:  board.querySelector('[data-board="left"]'),
    right: board.querySelector('[data-board="right"]'),
  } : null;
  const shown = { left: DISCIPLINES[0], right: STATUS };

  // true advance width of each character at the board's own size and tracking
  function advances(el, text) {
    const cs = getComputedStyle(el);
    const m = document.createElement('div');
    m.style.cssText = 'position:absolute;left:-9999px;top:0;white-space:pre;visibility:hidden;';
    ['fontFamily', 'fontWeight', 'fontSize', 'letterSpacing'].forEach(k => { m.style[k] = cs[k]; });
    [...text].forEach(ch => { const s = document.createElement('span'); s.textContent = ch; m.appendChild(s); });
    document.body.appendChild(m);
    const ws = [...m.children].map(s => s.getBoundingClientRect().width);
    m.remove();
    return ws;
  }

  // flip one column from what it shows to `next`, character by character:
  // each reel starts on the old letter, runs a few random glyphs, lands on the new
  function flip(side, next, delayMs) {
    const col = cols[side];
    const prev = shown[side];
    shown[side] = next;
    const ws = advances(col, next);
    col.innerHTML = '';
    const slots = [...next].map((ch, i) => {
      const old = prev[i] || ' ';
      const cells = [old, ...R.randomGlyphs(4 + Math.floor(Math.random() * 4)), ch];
      const slot = R.buildReel(cells, 'board__cell');
      slot.style.width = ws[i] + 'px';
      col.appendChild(slot);
      return slot;
    });
    requestAnimationFrame(() => {
      slots.forEach((slot, i) => {
        const strip = slot.firstChild;
        const h = strip.firstChild.getBoundingClientRect().height;
        R.tween(strip, -(+slot.dataset.count - 1) * h, 640, delayMs + i * 28);
      });
    });
  }

  if (cols && R && !reduce) {
    let d = 0, lastAlt = null;
    function nextStatus() {
      if (Math.random() < 0.25) {
        const pool = ALTERNATES.filter(a => a !== lastAlt);
        lastAlt = pool[Math.floor(Math.random() * pool.length)];
        return lastAlt;
      }
      return STATUS;
    }
    (function tick() {
      setTimeout(() => {
        if (document.visibilityState === 'visible') {
          d = (d + 1) % DISCIPLINES.length;
          flip('left', DISCIPLINES[d], 0);
          const s = nextStatus();
          if (s !== shown.right) flip('right', s, 140);
        }
        tick();
      }, 3500 + Math.random() * 500);
    })();
  }
  // reduced motion: the static row in the markup stays as it is.

  /* ============================================================
     SHUTTER
     ============================================================ */
  const FRAMES = [
    { src: 'assets/work/corps/Ballet project-1804.jpg',
      alt: 'Dancers in white tutus crowded in the darkness of the wings, one looking directly toward the camera.' },
    { src: 'assets/work/exemplary-home/img_039.jpg',
      alt: 'A rusted octagonal sign above an arrow pointing to the stadium, its Cyrillic lettering flaking against a pale evening sky.' },
    { src: 'assets/work/pride-and-prejudice/03-rehearsal.jpg',
      alt: 'A dancer caught mid-leap in a rehearsal studio, arms raised, with the company leaping behind her.' },
    { src: 'assets/work/exemplary-home/img_056-Edit.jpg',
      alt: 'An elderly woman in a headscarf, a red jumper and a knitted waistcoat, standing before a row of bare trees.' },
    { src: 'assets/work/corps/Ballet project-1830.jpg',
      alt: 'A dancer in jester makeup and a red cap smoking backstage, directly beneath a no-smoking sign.' },
    { src: 'assets/work/pride-and-prejudice/02-residence.jpg',
      alt: 'A photographer arranging five dancers in Regency dress by the tall windows of the residence drawing room.' },
  ].map(f => ({ ...f, src: encodeURI(f.src) }));

  const field = document.querySelector('.cs');
  const img = document.getElementById('csFrame');
  if (!field || !img) return;

  // timings come from the CSS (--cs-fade, --cs-iris on .cs) so the two never drift
  const ms = name => parseFloat(getComputedStyle(field).getPropertyValue(name)) || 0;
  const LEAD = reduce ? 0 : ms('--cs-fade') * 0.6;   // the iris opens as the stack clears
  const IRIS = reduce ? 0 : ms('--cs-iris');         // each way
  const AUTO_HOLD = 400;             // automatic exposure stays fully open this long
  const MIN_SHOW = 200;              // no frame shows for less than this
  const MIN_GAP = 1000;              // never more than one opening per second
  const TOUCH_DELAY = 150;           // a touch must be held this long to expose

  const cache = new Map();           // src -> Promise resolved when decodable
  function fetchFrame(i) {
    const f = FRAMES[i % FRAMES.length];
    if (!cache.has(f.src)) {
      const im = new Image();
      im.decoding = 'async';
      im.src = f.src;
      cache.set(f.src, (im.decode ? im.decode() : Promise.resolve()).catch(() => {}));
    }
    return cache.get(f.src);
  }

  let frame = -1;            // index of the frame last shown
  let phase = 'closed';      // closed | opening | open | closing
  let source = null;         // 'auto' | 'hold' for the current exposure
  let holding = false;
  let wantOpen = false;      // an opening is queued (throttle or iris still moving)
  let closeAsked = false;    // release arrived before the frame was up
  let lastOpen = -Infinity, openedAt = 0;
  let openTimer, closeTimer, autoTimer;

  function requestOpen(src) {
    source = src;
    wantOpen = true;
    tryOpen();
  }

  function tryOpen() {
    clearTimeout(openTimer);
    if (!wantOpen || phase !== 'closed') return;
    const wait = lastOpen + MIN_GAP - performance.now();
    if (wait > 0) { openTimer = setTimeout(tryOpen, wait); return; }
    wantOpen = false;
    open();
  }

  async function open() {
    phase = 'opening';
    closeAsked = false;
    frame = (frame + 1) % FRAMES.length;
    const f = FRAMES[frame];
    await fetchFrame(frame);
    img.src = f.src;
    img.alt = f.alt;
    lastOpen = openedAt = performance.now();
    field.classList.add('is-exposed');
    phase = 'open';
    fetchFrame(frame + 1);   // fetch the next one while this one is showing
    if (source === 'auto') scheduleClose(AUTO_HOLD);
    else if (closeAsked || !holding) scheduleClose(MIN_SHOW);
  }

  // close once the iris is fully open and the frame has had at least `hold` ms
  function scheduleClose(hold) {
    clearTimeout(closeTimer);
    const at = openedAt + LEAD + IRIS + Math.max(hold, MIN_SHOW);
    closeTimer = setTimeout(close, Math.max(0, at - performance.now()));
  }

  function close() {
    clearTimeout(closeTimer);
    if (phase !== 'open') return;
    phase = 'closing';
    field.classList.remove('is-exposed');
    setTimeout(() => {
      phase = 'closed';
      if (holding) requestOpen('hold'); else tryOpen();
    }, IRIS);
  }

  /* ---- hold to expose ---- */
  function press() {
    if (holding) return;
    holding = true;
    clearTimeout(autoTimer);
    if (phase === 'open') {
      // already exposed (an automatic opening): keep it open while held
      clearTimeout(closeTimer);
      source = 'hold';
      return;
    }
    requestOpen('hold');
  }

  function release() {
    if (!holding) return;
    holding = false;
    wantOpen = false;
    clearTimeout(openTimer);
    if (phase === 'open') scheduleClose(MIN_SHOW);
    else if (phase === 'opening') closeAsked = true;
    scheduleAuto();
  }

  const onInteractive = el => el.closest && el.closest('a, button, input, textarea, select');
  let touchTimer = null, touchId = null;

  document.addEventListener('pointerdown', e => {
    if (onInteractive(e.target) || e.button > 0) return;
    if (e.pointerType === 'touch') {
      touchId = e.pointerId;
      clearTimeout(touchTimer);
      touchTimer = setTimeout(() => { touchTimer = null; press(); }, TOUCH_DELAY);
    } else {
      press();
    }
  });
  function endPointer(e) {
    if (e.pointerType === 'touch') {
      if (e.pointerId !== touchId) return;
      touchId = null;
      if (touchTimer) { clearTimeout(touchTimer); touchTimer = null; return; } // a tap
    }
    release();
  }
  document.addEventListener('pointerup', endPointer);
  document.addEventListener('pointercancel', endPointer);
  // no long-press menu on the field (links keep theirs)
  document.addEventListener('contextmenu', e => { if (!onInteractive(e.target)) e.preventDefault(); });

  const isHoldKey = e => e.key === ' ' || e.key === 'Enter';
  document.addEventListener('keydown', e => {
    if (!isHoldKey(e) || onInteractive(e.target)) return;
    e.preventDefault();
    if (!e.repeat) press();
  });
  document.addEventListener('keyup', e => {
    if (!isHoldKey(e) || onInteractive(e.target)) return;
    release();
  });
  window.addEventListener('blur', release);

  /* ---- the instruction follows the cursor (fine pointers only) ----
     Trails the pointer slightly, steps away over links and while exposed. */
  const hold = document.getElementById('csHold');
  if (hold && !reduce && matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const OFF_X = 22, OFF_Y = 20;
    let x = 0, y = 0, tx = 0, ty = 0, raf = 0;
    const place = () => { hold.style.transform = `translate3d(${x}px, ${y}px, 0)`; };
    function follow() {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;
      place();
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.3) ? requestAnimationFrame(follow) : 0;
    }
    document.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse') return;
      tx = e.clientX + OFF_X; ty = e.clientY + OFF_Y;
      if (!hold.classList.contains('is-following')) {
        // detach from its place under the contact and glide to the cursor
        const r = hold.getBoundingClientRect();
        x = r.left; y = r.top;
        hold.classList.add('is-following', 'is-on');
        place();
      }
      hold.classList.toggle('is-on', !onInteractive(e.target));
      if (!raf) raf = requestAnimationFrame(follow);
    });
    document.documentElement.addEventListener('mouseleave', () => hold.classList.remove('is-on'));
  }

  /* ---- automatic exposure: every 20–30 s, never under reduced motion ---- */
  function scheduleAuto() {
    clearTimeout(autoTimer);
    if (reduce || document.visibilityState !== 'visible') return;
    autoTimer = setTimeout(() => {
      if (holding || phase !== 'closed' || document.visibilityState !== 'visible') { scheduleAuto(); return; }
      requestOpen('auto');
      scheduleAuto();
    }, 20000 + Math.random() * 10000);
  }
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleAuto();
    else { clearTimeout(autoTimer); release(); }
  });

  // only the first frame is fetched up front, and only after everything else
  function start() { fetchFrame(0); scheduleAuto(); }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });
})();
