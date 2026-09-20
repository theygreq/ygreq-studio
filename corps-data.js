// ============================================================
//  CORPS — image-sequence data  ·  THE ONE FILE TO EDIT
// ============================================================
//
//  To add a photograph to the page:
//    1. Drop the file into  assets/work/corps/
//       (files currently sit flat in that folder, so `src` is just the
//        filename. The per-section subfolders from the first build are
//        empty and can be deleted, or used later if the folder grows.)
//    2. Add one line to that section's `images` array below.
//  Nothing else — reveals, parallax, the lightbox and the section
//  counter all pick it up automatically.
//
//  Per-image fields:
//    src        Path RELATIVE TO assets/work/corps/, e.g. "the-floor/01.jpg".
//               Files are flat in that folder, so this is just the filename,
//               e.g. "Ballet project-1805.jpg".
//               OMIT it to render a clearly-marked placeholder box instead.
//    alt        Descriptive alt text. Required on real images. Say what the
//               photograph shows, not "photo of" — e.g.
//               "Two dancers rehearsing a lift, seen from across the studio".
//    aspect     Shape of the frame: "4:5" (default, portrait), "5:4", "1:1",
//               "3:2", "2:3", "16:9"… Drives the placeholder box; real photos
//               always render at their own native ratio and are never cropped.
//    treatment  "mono" (default) or "colour" — see the Process note on the page.
//    span       Width in the row: "full" (full-bleed single), "half" (default,
//               two-up), or "third" (tighter three-up grid). Mix them within a
//               section to vary the rhythm.
//
//  Section fields:  slug · heading (fixed) · caption (edit freely) · images[]
//
//  The captions below are editable placeholders — rewrite them in your own
//  words, or set caption to "" to drop the caption line entirely.
//  The alt strings on the placeholders are sensible defaults; replace them
//  with a real description when you wire the actual frame.
// ============================================================

window.CORPS_SEQUENCES = [
  {
    slug: 'the-house',
    heading: 'The House — the rooms the work happens in',
    caption: 'Rehearsal studios, corridors, the auditorium with nobody in it. Ordinary rooms, improvised equipment, and an extraordinary amount of work going on inside them.',
    images: [
      { src: 'Ballet project-1805.jpg', aspect: '4:5', treatment: 'mono',   span: 'full', alt: 'An empty rehearsal studio with a reflective floor; dancers rest against the walls and in the doorway at the far end.' },
      { src: 'Ballet project-1836.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'A studio wall with a barre and a framed photograph of a ballerina above it; a discarded tutu and pointe shoes lie on the floor below.' },
      { src: 'Ballet project-1823.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'Two white tutus draped over blue plastic chairs in a corridor beside metal lockers and a red door.' },
      { src: 'Ballet project-1834.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'A narrow service corridor lit by a single strip light, with water running along the floor.' },
      { src: 'Ballet project-1822.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'A technician working at a lighting console in an orange cabinet backstage.' },
      { src: 'Ballet project-1835.jpg', aspect: '4:5', treatment: 'mono',   span: 'full', alt: 'A bank of empty tiered seating with one woman sitting alone near the centre.' },
    ],
  },
  {
    slug: 'class',
    heading: 'Class — the day begins the same way',
    caption: 'Morning company class. The same exercises, in the same order, for a working lifetime.',
    images: [
      { src: 'Ballet project-1806.jpg', aspect: '4:5', treatment: 'mono',   span: 'full', alt: 'Dancers in arabesque across a sunlit studio while an older ballet master watches from among them.' },
      { src: 'Ballet project-1828.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'A ballet master in a red top demonstrating an extension in front of a line of dancers at the barre.' },
      { src: 'Ballet project-1838.jpg', aspect: '4:5', treatment: 'mono',   span: 'half', alt: 'A dancer in black working at the barre by a window, the photographer visible in the mirror behind her.' },
    ],
  },
  {
    slug: 'the-same-thing-again',
    heading: 'The Same Thing, Again',
    caption: 'The repetition the work is actually made of — and the reason I started photographing it.',
    images: [
      { src: 'Ballet project-1818.jpg', aspect: '4:5', treatment: 'mono', span: 'full', alt: 'A long exposure of the corps bending in unison, the line of bodies dissolving into a single smear of movement.' },
      { src: 'Ballet project-1824.jpg', aspect: '4:5', treatment: 'mono', span: 'half', alt: 'The sweat-soaked back of a dancer with one arm raised, under fluorescent studio lights.' },
      { src: 'Ballet project-1826.jpg', aspect: '4:5', treatment: 'mono', span: 'half', alt: 'A dancer seated with her back to the camera, shoulder blades and damp leotard catching the light.' },
    ],
  },
  {
    slug: 'ritual',
    heading: 'Ritual — the shoes, and what is done to them',
    caption: 'Pointe shoes are broken in, cut, burned and sewn by hand before they are worn. Everyone has a method, and everyone is certain about it.',
    images: [
      { src: 'Ballet project-1837.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'A dancer working a new pointe shoe against her foot on the studio floor, surrounded by soft shoes and an embroidered shoe bag.' },
      { src: 'Ballet project-1827.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'Hands using a lighter to singe the ribbon ends of a pointe shoe on a table, scissors and a water bottle beside them.' },
      { src: 'Ballet project-1821.jpg', aspect: '4:5', treatment: 'mono',   span: 'full', alt: 'Feet in pointe shoes at the edge of a rosin tray set into the stage floor.' },
    ],
  },
  {
    slug: 'waiting',
    heading: 'Waiting — most of this life is standing still',
    caption: 'The wings, the dressing room, the hour before. The largest part of the working day, and the least photographed.',
    images: [
      { src: 'Ballet project-1804.jpg', aspect: '5:4', treatment: 'mono', span: 'full',  alt: 'Dancers in white tutus crowded in the darkness of the wings, one looking directly toward the camera.' },
      { src: 'Ballet project-1829.jpg', aspect: '4:5', treatment: 'mono', span: 'third', alt: 'A dancer in a tutu standing among scaffolding and stage flats, waiting to go on.' },
      { src: 'Ballet project-1814.jpg', aspect: '4:5', treatment: 'mono', span: 'third', alt: 'A dancer sitting under an awning beside stacked plastic chairs on a rain-wet outdoor stage.' },
      { src: 'Ballet project-1813.jpg', aspect: '4:5', treatment: 'mono', span: 'third', alt: 'A dancer pulling on a jacket in a portacabin dressing room beside a water cooler and plastic chairs.' },
    ],
  },
  {
    slug: 'the-apparatus',
    heading: 'The Apparatus — Swan Lake, on a lake',
    caption: 'An open-air staging built on the water: scaffolding, water tanks, polystyrene swans, and a stage that has to be squeegeed dry before anyone can dance on it.',
    images: [
      { src: 'Ballet project-1815.jpg', aspect: '4:5', treatment: 'colour', span: 'full', alt: 'Polystyrene swans floating beside a pontoon stage while a man in a rowing boat moves them into position.' },
      { src: 'Ballet project-1812.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'Dancers in tutus gathered by scaffolding on the lakeside stage, props and flowers stacked in the foreground.' },
      { src: 'Ballet project-1831.jpg', aspect: '4:5', treatment: 'colour', span: 'half', alt: 'Crew and dancers squeegeeing rainwater off the lakeside stage, one in a pink dressing gown at the edge.' },
      { src: 'Ballet project-1830.jpg', aspect: '4:5', treatment: 'colour', span: 'full', alt: 'A dancer in jester makeup and a red cap smoking backstage, directly beneath a no-smoking sign.' },
    ],
  },
];

// ------------------------------------------------------------
//  Renderer — builds the sequence sections from the data above.
//  Runs synchronously, BEFORE main.js and scroll.js, so every image it
//  creates is wrapped/observed by the existing reveal + parallax + lightbox
//  machinery with no changes to those files. You shouldn't need to touch
//  anything below this line to add images.
// ------------------------------------------------------------
(function renderCorpsSequences() {
  var mount = document.getElementById('corps-sequences');
  var data  = window.CORPS_SEQUENCES;
  if (!mount || !Array.isArray(data)) return;

  var SPAN = { full: 'full', half: 'half', third: 'third' };

  function aspectRatio(aspect) {
    var parts = String(aspect || '4:5').split(':');
    var w = parseFloat(parts[0]) || 4;
    var h = parseFloat(parts[1]) || 5;
    return w + ' / ' + h;
  }

  function makeImageCell(img, section) {
    var span = SPAN[img.span] || 'half';
    var cell = document.createElement('div');
    cell.className = 'corps-cell corps-cell--' + span;

    if (img.src) {
      // real photograph
      var el = document.createElement('img');
      el.className = 'zoomable';
      // filenames contain spaces, so encode the path rather than relying on the
      // browser to fix up the URL
      el.src = 'assets/work/corps/' + encodeURIComponent(img.src).replace(/%2F/g, '/');
      el.alt = img.alt || '';
      el.loading = 'lazy';                 // below-the-fold images defer
      el.setAttribute('data-reveal', '');
      el.setAttribute('data-reveal-type', 'image');
      if (img.treatment) el.setAttribute('data-treatment', img.treatment);
      // parallax on the big full-bleed singles only — it reads as jitter in a
      // tight two/three-up grid, so half/third cells clip-reveal without it
      if (span === 'full') el.setAttribute('data-parallax', '');
      cell.appendChild(el);
    } else {
      // clearly-marked placeholder at the declared ratio
      var ph = document.createElement('div');
      ph.className = 'ph';
      ph.style.aspectRatio = aspectRatio(img.aspect);
      ph.setAttribute('data-ph', section + ' · placeholder · ' + (img.treatment || 'mono') + ' ' + (img.aspect || '4:5'));
      ph.setAttribute('data-reveal', '');
      ph.setAttribute('data-reveal-type', 'image');
      cell.appendChild(ph);
    }
    return cell;
  }

  var frag = document.createDocumentFragment();

  data.forEach(function (section) {
    var sec = document.createElement('section');
    sec.className = 'section--tight case-section corps-seq';
    sec.id = 'corps-' + section.slug;

    // heading (+ optional caption)
    var head = document.createElement('div');
    head.className = 'wrap';

    var h2 = document.createElement('h2');
    h2.className = 'label case-section__eyebrow';
    h2.setAttribute('data-reveal', '');
    h2.textContent = section.heading;
    head.appendChild(h2);

    if (section.caption) {
      var cap = document.createElement('p');
      cap.className = 'corps-seq__caption measure-read';
      cap.setAttribute('data-reveal', '');
      cap.textContent = section.caption;
      head.appendChild(cap);
    }
    sec.appendChild(head);

    // image grid
    var grid = document.createElement('div');
    grid.className = 'wrap corps-grid';
    (section.images || []).forEach(function (img) {
      grid.appendChild(makeImageCell(img, section.heading.split(' — ')[0]));
    });
    sec.appendChild(grid);

    frag.appendChild(sec);
  });

  mount.innerHTML = '';   // drop the no-JS fallback, then mount the real sections
  mount.appendChild(frag);
}());
