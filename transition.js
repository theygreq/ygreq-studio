// YGREQ.STUDIO — page transitions
//
// A full-screen curtain between pages, reusing the menu overlay's motion
// vocabulary exactly: a translateY wipe over --dur-menu with --ease-menu,
// in the DESTINATION's field colour — the same data-category mapping
// .menu-overlay--* already uses on hover, extended to every page:
// work → clay, about → olive, contact → cobalt, home and Corps → black.
// Nothing new is introduced: no easing, no colour, no duration that isn't
// already a token.
//
// Every internal link transitions. Never intercepted: external hosts,
// mailto:/tel:, "#" placeholders, target="_blank", download, modified
// clicks, [data-no-transition], and links to the page you're already on.
//
// Progressive enhancement: with JS off, every link is a plain <a href> and
// the curtain never appears. Under prefers-reduced-motion nothing is
// intercepted, no flag is written, and the curtain is display:none in CSS.

(function () {
  const curtain = document.querySelector('.page-curtain');
  if (!curtain) return;

  // --- tuning ------------------------------------------------------
  // Entrance direction. 'lift' mirrors the menu overlay — the curtain
  // retreats back up the way it came, so exit and entrance read as one
  // continuous move. Flip to 'sweep' to send it on through, off the bottom.
  const ENTER_DIRECTION = 'lift'; // 'lift' | 'sweep'

  const root       = document.documentElement;
  const CATEGORIES = ['home', 'ink', 'work', 'about', 'contact',
                      'exemplary-home', 'pride-and-prejudice'];
  const reduced    = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Every page belongs to one of the four fields. The three destination
  // categories are the menu overlay's own mapping; home is the black hero
  // field, which is also the curtain's default colour.
  const PAGE_CATEGORY = {
    'index.html':             'home',
    '':                       'home',   // a bare "/" served as index
    'work.html':              'work',
    'exemplary-home.html':    'exemplary-home',  /* carries its own red, not Work clay */
    'pride-and-prejudice.html': 'pride-and-prejudice',  /* the ballet poster's navy */
    'corps.html':             'ink',    /* Corps runs on the dark field, not clay */
    'about.html':             'about',
    'contact.html':           'contact',
  };

  // Field colour per category, read from the tokens — never restated as hex.
  const FIELD_TOKEN = {
    home: '--black', ink: '--black',
    work: '--clay', about: '--olive', contact: '--cobalt',
    'exemplary-home': '--red-exemplary-home',
    'pride-and-prejudice': '--navy-pride-and-prejudice',
  };

  function categoryFor(a) {
    const explicit = a.dataset.transitionCategory || a.dataset.category;
    if (explicit && CATEGORIES.indexOf(explicit) !== -1) return explicit;
    return PAGE_CATEGORY[a.pathname.split('/').pop()] || 'home';
  }

  // Browser-chrome tint (Safari's toolbar, iOS/Android address bar). Each page
  // ships a static <meta name="theme-color"> matching its own field, so the
  // chrome a curtain arrives over is already the curtain's colour; this just
  // moves it early, on the way out, so the chrome leads the navigation.
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  function setThemeColour(cat) {
    if (!themeMeta) return;
    const value = getComputedStyle(root).getPropertyValue(FIELD_TOKEN[cat] || '--black').trim();
    if (value) themeMeta.setAttribute('content', value);
  }

  // Read --dur-menu rather than restating it, so retuning the token can never
  // leave the safety timeout below firing mid-wipe. Only a fallback anyway:
  // transitionend is what actually drives the navigation.
  const DUR = (function () {
    const raw = getComputedStyle(root).getPropertyValue('--dur-menu').trim();
    const ms  = raw.slice(-2) === 'ms' ? parseFloat(raw)
              : raw.slice(-1) === 's'  ? parseFloat(raw) * 1000
              : NaN;
    return ms > 0 ? ms : 700;
  }());

  // sessionStorage throws in some privacy modes / opaque origins — a failed
  // read or write just means no transition, never a broken link.
  function setFlag(cat) { try { sessionStorage.setItem('pt', cat); } catch (e) {} }
  function clearFlag()  { try { sessionStorage.removeItem('pt'); } catch (e) {} }

  // Colour classes are derived from CATEGORIES, never listed by hand — a
  // category that outlives a reset would win or lose on stylesheet order
  // rather than intent, and colour the next wipe wrongly.
  function clearColour() {
    CATEGORIES.forEach((c) => curtain.classList.remove('page-curtain--' + c));
  }
  function setColour(cat) {
    clearColour();
    curtain.classList.add('page-curtain--' + cat);
  }

  function resetCurtain() {
    curtain.classList.remove('is-animating', 'is-covering', 'is-sweeping', 'is-exiting');
    clearColour();
    delete root.dataset.ptEnter;
  }

  // Run fn once the curtain's transform transition lands, with a timeout
  // safety net so a dropped/never-fired transitionend can't strand a click.
  function onSettled(fn) {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      curtain.removeEventListener('transitionend', handler);
      fn();
    };
    const handler = (e) => {
      if (e.target === curtain && e.propertyName === 'transform') finish();
    };
    curtain.addEventListener('transitionend', handler);
    setTimeout(finish, DUR + 150);
  }

  // --- entrance ----------------------------------------------------
  // The <head> snippet has already set data-pt-enter (before first paint),
  // so the curtain is on screen, in the right colour, and the incoming page
  // has never flashed. Lift it away.
  (function playEntrance() {
    const cat = root.dataset.ptEnter;
    if (!cat) return;

    // hand the covering state from the attribute over to classes first, so
    // dropping the attribute can't uncover the page for a frame
    curtain.classList.add('is-covering');
    if (CATEGORIES.indexOf(cat) !== -1) setColour(cat);
    delete root.dataset.ptEnter;

    if (reduced()) { resetCurtain(); return; }

    // Start the lift on the first *rendered* frame, not here at parse time.
    // A cross-document navigation doesn't present the new page until its first
    // paint, and any of the wipe that elapses before that is simply never seen
    // — on a slow load the whole thing can be over before the page appears.
    // rAF only fires once the document is actually being rendered, so this
    // pins the lift to the first frame the visitor can see; the second frame
    // guarantees the covering state was painted before it starts moving.
    let started = false;
    function start() {
      if (started) return;
      started = true;
      // Arm the transition, flush, THEN change the transform. Doing both in one
      // style recalculation animates in Chrome but snaps in WebKit, which wants
      // the transition already in the before-change style — same forced-reflow
      // idiom main.js uses when it opens the menu overlay.
      curtain.classList.add('is-animating');
      curtain.offsetHeight; // eslint-disable-line no-unused-expressions -- force reflow
      curtain.classList.remove('is-covering');
      if (ENTER_DIRECTION === 'sweep') curtain.classList.add('is-sweeping');
      onSettled(resetCurtain);
    }
    requestAnimationFrame(() => requestAnimationFrame(start));

    // Fallback for a document that never renders (Page-Visibility 'hidden'):
    // no rAF, and CSS transitions wouldn't tick anyway — just clear the curtain.
    setTimeout(() => { if (!started) { started = true; resetCurtain(); } }, DUR + 150);
  }());

  // --- exit --------------------------------------------------------
  let navigating = false;

  function playExit(href, cat) {
    navigating = true;
    setColour(cat);
    curtain.classList.add('is-exiting', 'is-animating');
    setThemeColour(cat);    // chrome shifts with the curtain, ahead of the page
    window.__lenis?.stop(); // same scroll-lock pattern as the menu and lightbox

    curtain.offsetHeight; // eslint-disable-line no-unused-expressions -- force reflow before the wipe
    curtain.classList.add('is-covering');

    onSettled(() => { setFlag(cat); location.href = href; });
  }

  // --- click interception ------------------------------------------
  // Capture phase, so this runs before main.js's bubble-phase overlay
  // handler and can stopPropagation() — main.js stays untouched.
  document.addEventListener('click', (e) => {
    if (reduced() || e.defaultPrevented) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;

    // let the browser handle anything that isn't a plain same-site navigation
    if (a.target && a.target !== '_self') return;
    if (a.hasAttribute('download') || a.hasAttribute('data-no-transition')) return;
    const raw = a.getAttribute('href');
    if (!raw || raw.charAt(0) === '#') return;
    if (a.protocol === 'mailto:' || a.protocol === 'tel:') return;
    if ((a.protocol === 'http:' || a.protocol === 'https:') && a.host !== location.host) return;
    // a link to the page you're already on: nothing to transition to
    if (a.pathname === location.pathname && a.search === location.search) return;

    // Every internal link transitions. Colour comes from the destination's own
    // field (PAGE_CATEGORY), or from data-category / data-transition-category
    // where the markup states it — the menu's links already carry data-category.
    const cat = categoryFor(a);
    const inMenu = !!a.closest('#menu-overlay') &&
      (a.classList.contains('menu-item__link') || a.classList.contains('menu-item__child-link'));

    e.preventDefault();
    if (navigating) return;

    if (inMenu) {
      // The menu is already open and its curtain already covers the page —
      // and is already in the destination's colour if the user hovered.
      // Don't close it, don't play a second wipe: hand the colour over and
      // go. The next page's entrance completes the same continuous move.
      e.stopPropagation(); // keeps main.js's closeMenu() out of it
      const overlay = a.closest('.menu-overlay');
      // 'ink' and 'home' deliberately have no .menu-overlay--* rule: the menu
      // curtain's own default IS the black field, so it already reads correctly.
      if (overlay && cat !== 'home' && cat !== 'ink') {
        // keyboard activation never fired a hover, so set the colour here too
        overlay.classList.remove('menu-overlay--work', 'menu-overlay--about', 'menu-overlay--contact');
        overlay.classList.add('menu-overlay--' + cat);
      }
      navigating = true;
      setThemeColour(cat);
      setFlag(cat);
      location.href = a.href;
      return;
    }

    playExit(a.href, cat);
  }, true);

  // --- bfcache -----------------------------------------------------
  // A restored page is never re-parsed, so the entrance above never runs —
  // a curtain that was covering when we navigated away would be stuck there.
  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    clearFlag();
    navigating = false;
    resetCurtain();
  });
}());
