/* =====================================================================
   SCHILCHER HÄUSER – Interaktionen
   ===================================================================== */
(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var IMAGES = window.IMAGES || {};
  var HOUSES = window.HOUSES || [];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var fmt = function (n) { return n == null ? '–' : String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  var STATUS = {
    verfuegbar: 'Verfügbar',
    reserviert: 'Reserviert',
    verkauft: 'Verkauft'
  };

  /* ---------------- Bilder ---------------- */
  function isResizable(src) { return /images\.(unsplash|pexels)\.com/.test(src); }
  function imgUrl(src, w) {
    if (!src) return '';
    var base = src.split('?')[0];
    if (/images\.unsplash\.com/.test(src)) return base + '?auto=format&fit=crop&w=' + w + '&q=78';
    if (/images\.pexels\.com/.test(src)) return base + '?auto=compress&cs=tinysrgb&w=' + w;
    return src;
  }
  function applyImage(img, key, sizes) {
    var src = IMAGES[key];
    if (!src) return;
    if (isResizable(src)) {
      img.srcset = [640, 1024, 1600, 2400].map(function (w) { return imgUrl(src, w) + ' ' + w + 'w'; }).join(', ');
      img.sizes = sizes || img.getAttribute('data-sizes') || '100vw';
      img.src = imgUrl(src, 1600);
    } else {
      img.src = src;
    }
  }
  $$('img[data-img]').forEach(function (img) { applyImage(img, img.getAttribute('data-img')); });

  /* ---------------- Header & Navigation ---------------- */
  var header = $('#site-header');
  var hero = $('.hero');
  function updateHeader() {
    var limit = hero ? hero.offsetHeight - header.offsetHeight - 10 : 0;
    header.classList.toggle('is-solid', window.scrollY > Math.max(40, limit * 0.04) && window.scrollY > 40);
  }
  // nach dem Hero immer solide
  function headerState() {
    updateHeader();
    if (hero && window.scrollY > hero.offsetHeight * 0.6) header.classList.add('is-solid');
  }
  window.addEventListener('scroll', headerState, { passive: true });
  headerState();

  var toggle = $('.nav-toggle');
  function setNav(open) {
    document.body.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
  }
  toggle.addEventListener('click', function () { setNav(!document.body.classList.contains('nav-open')); });
  $$('.main-nav a').forEach(function (a) { a.addEventListener('click', function () { setNav(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 960) setNav(false); });

  // aktiven Menüpunkt markieren
  var navLinks = $$('.main-nav ul a');
  if ('IntersectionObserver' in window) {
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) {
      var href = a.getAttribute('href');
      var t = href.charAt(0) === '#' ? $(href) : null;
      if (t) sectionObs.observe(t);
    });
  }

  /* ---------------- Scroll-Reveal ---------------- */
  function observeReveal(els) {
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); obs.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) { obs.observe(el); });
  }

  /* ---------------- Modals ---------------- */
  var openDialog = null;

  function openModal(id) {
    var dlg = document.getElementById(id);
    if (!dlg) { window.location.href = "index.html#" + id; return; }
    if (openDialog && openDialog !== dlg) closeModal(openDialog, true);
    // Formulare zurücksetzen
    $$('.mf-content', dlg).forEach(function (c) { c.hidden = false; });
    $$('.mf-success', dlg).forEach(function (s) { s.hidden = true; });
    $$('.field.is-invalid', dlg).forEach(function (f) { f.classList.remove('is-invalid'); });
    if (typeof dlg.showModal === 'function') { if (!dlg.open) dlg.showModal(); }
    else dlg.setAttribute('open', '');
    openDialog = dlg;
    dlg.scrollTop = 0;
    document.body.classList.add('modal-open');
    setNav(false);
    requestAnimationFrame(function () { dlg.scrollTop = 0; requestAnimationFrame(function () { dlg.scrollTop = 0; dlg.classList.add('is-visible'); }); });
  }

  function closeModal(dlg, instant) {
    dlg = dlg || openDialog;
    if (!dlg) return;
    dlg.classList.remove('is-visible');
    var done = function () {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
      if (openDialog === dlg) openDialog = null;
      if (!openDialog) document.body.classList.remove('modal-open');
    };
    if (instant || reduceMotion) done(); else setTimeout(done, 320);
  }

  $$('dialog.modal').forEach(function (dlg) {
    dlg.addEventListener('cancel', function (e) { e.preventDefault(); closeModal(dlg); });
    dlg.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]')) { closeModal(dlg); return; }
      // Klick auf den Hintergrund (nur echte Klicks direkt auf das Dialog-Element)
      if (e.target !== dlg || (e.clientX === 0 && e.clientY === 0)) return;
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(dlg);
    });
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    e.preventDefault();
    var which = trigger.getAttribute('data-modal');
    if (which === 'expose') openExpose();
    else openModal('modal-' + which);
  });

  function openExpose(house) {
    var msg = $('#ex-msg');
    if (msg) msg.value = house ? 'Ich interessiere mich für Haus ' + pad(house.nr) + ' und bitte um Zusendung des Exposés.' : '';
    openModal('modal-expose');
  }

  // Demo-Formulare: keine Übertragung, nur Erfolgsmeldung
  $$('.demo-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      $$('input[required]', form).forEach(function (input) {
        var valid = input.value.trim() !== '' && (input.type !== 'email' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim()));
        input.closest('.field').classList.toggle('is-invalid', !valid);
        if (!valid && ok) { input.focus(); ok = false; }
      });
      if (!ok) return;
      var inner = form.closest('.mf-inner');
      $('.mf-content', inner).hidden = true;
      $('.mf-success', inner).hidden = false;
      form.reset();
    });
    form.addEventListener('input', function (e) {
      var f = e.target.closest('.field');
      if (f) f.classList.remove('is-invalid');
    });
  });

  /* ---------------- Architektur aufklappen ---------------- */
  var archBtn = $('#arch-toggle');
  var archMore = $('#arch-more');
  if (archBtn && archMore) {
    archBtn.addEventListener('click', function () {
      var open = archBtn.getAttribute('aria-expanded') === 'true';
      archBtn.setAttribute('aria-expanded', String(!open));
      $('.label', archBtn).textContent = open ? 'Architektur entdecken' : 'Weniger anzeigen';
      if (!open) {
        archMore.hidden = false;
        archMore.classList.add('is-open');
        if (archMore.animate && !reduceMotion) {
          archMore.animate([{ height: '0px' }, { height: archMore.scrollHeight + 'px' }], { duration: 600, easing: 'cubic-bezier(.22,.61,.36,1)' });
        }
      } else {
        var finish = function () { archMore.hidden = true; archMore.classList.remove('is-open'); };
        if (archMore.animate && !reduceMotion) {
          archMore.animate([{ height: archMore.scrollHeight + 'px' }, { height: '0px' }], { duration: 450, easing: 'cubic-bezier(.22,.61,.36,1)' }).onfinish = finish;
        } else finish();
      }
    });
  }

  /* ---------------- Häuser: Karten ---------------- */
  var grid = $('#house-grid');
  var cards = {};

  if (grid) HOUSES.forEach(function (h, i) {
    var card = document.createElement('article');
    card.className = 'house-card reveal status-' + h.status;
    card.style.setProperty('--i', i % 4);
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Haus ' + pad(h.nr) + ' – Details ansehen');
    card.dataset.nr = h.nr;
    card.innerHTML =
      '<div class="img-zoom"><img alt="Musterbild Haus ' + pad(h.nr) + '" loading="lazy"><span class="house-card-num">Musterbild</span></div>' +
      '<div class="house-card-body">' +
        '<h3>Haus ' + pad(h.nr) + '</h3>' +
        '<ul class="house-specs">' +
          '<li><span>Grundstück</span><span>ca. ' + fmt(h.grundstueck) + ' m²</span></li>' +
          '<li><span>Wohnfläche</span><span>ca. ' + fmt(h.wohnflaeche) + ' m²</span></li>' +
          '<li><span>Terrasse</span><span>ca. ' + fmt(h.terrasse) + ' m²</span></li>' +
        '</ul>' +
        '<div class="house-card-foot">' +
          '<span class="house-price">Preis auf Anfrage</span>' +
          '<span class="status"><span class="status-dot" aria-hidden="true"></span>' + STATUS[h.status] + '</span>' +
        '</div>' +
        '<span class="house-more">Details ansehen</span>' +
      '</div>';
    applyImage($('img', card), h.image, '(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 100vw');
    card.addEventListener('click', function () { openHouse(i); });
    card.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openHouse(i); }
    });
    card.addEventListener('mouseenter', function () { setPlanActive(h.nr, true); });
    card.addEventListener('mouseleave', function () { setPlanActive(h.nr, false); });
    grid.appendChild(card);
    cards[h.nr] = card;
  });

  /* ---------------- Häuser: Modal ---------------- */
  var current = 0;
  function fillHouse(i) {
    var h = HOUSES[i];
    current = i;
    var img = $('#hd-img');
    img.style.opacity = '0';
    var tmp = new Image();
    var show = function () { img.style.opacity = '1'; };
    tmp.onload = show; tmp.onerror = show;
    applyImage(img, h.image, '(min-width: 960px) 55vw, 100vw');
    applyImage(tmp, h.image, '(min-width: 960px) 55vw, 100vw');
    img.alt = 'Musterbild Haus ' + pad(h.nr);
    $('#hd-eyebrow').textContent = 'Grundstück ' + h.parzelle + ' · Stainz';
    $('#hd-title').textContent = 'Haus ' + pad(h.nr);
    $('#hd-status').textContent = STATUS[h.status];
    $('.hd-status').className = 'hd-status status-' + h.status;
    $('#hd-text').textContent = h.text;
    $('#hd-facts').innerHTML =
      '<div><dt>Grundstück</dt><dd>ca. ' + fmt(h.grundstueck) + ' m²</dd></div>' +
      '<div><dt>Wohnfläche</dt><dd>ca. ' + fmt(h.wohnflaeche) + ' m²</dd></div>' +
      '<div><dt>Terrasse</dt><dd>ca. ' + fmt(h.terrasse) + ' m²</dd></div>' +
      '<div><dt>Zimmer</dt><dd>' + h.zimmer + '</dd></div>';
  }
  function openHouse(i) { fillHouse(i); openModal('modal-house'); }
  if ($('#modal-house')) {
    $('#hd-prev').addEventListener('click', function () { fillHouse((current - 1 + HOUSES.length) % HOUSES.length); });
    $('#hd-next').addEventListener('click', function () { fillHouse((current + 1) % HOUSES.length); });
    $('#hd-cta').addEventListener('click', function () { openExpose(HOUSES[current]); });
  }
  document.addEventListener('keydown', function (e) {
    if (!openDialog || openDialog.id !== 'modal-house') return;
    if (e.key === 'ArrowLeft') $('#hd-prev').click();
    if (e.key === 'ArrowRight') $('#hd-next').click();
  });

  /* ---------------- Masterplan ---------------- */
  // Grenzpunkte (Gauß-Krüger M34, y/x in m) laut Teilungsplan
  var PTS = {
    33: [-83582.59, 197250.44], 35: [-83549.64, 197248.00], 37: [-83477.01, 197234.26], 171: [-83520.10, 197243.28],
    1173: [-83567.50, 197278.61], 1175: [-83545.60, 197314.01], 1178: [-83534.64, 197332.44], 1179: [-83562.05, 197287.97],
    2425: [-83574.79, 197264.99], 2696: [-83523.38, 197321.68], 2697: [-83491.41, 197304.98], 2698: [-83474.71, 197299.52],
    2699: [-83447.66, 197291.46], 2700: [-83458.43, 197271.69], 2701: [-83470.12, 197232.93],
    2950: [-83556.62, 197248.52], 2951: [-83551.09, 197251.44], 2952: [-83543.43, 197264.76], 2953: [-83541.70, 197263.77],
    2954: [-83539.21, 197268.10], 2955: [-83564.99, 197282.92], 2956: [-83551.28, 197305.02], 2957: [-83527.99, 197291.64],
    2958: [-83531.52, 197285.48], 2959: [-83529.79, 197284.49], 2960: [-83526.04, 197295.02], 2961: [-83519.11, 197291.04],
    2962: [-83518.11, 197292.77], 2963: [-83506.55, 197312.89], 2964: [-83508.62, 197283.29], 2965: [-83488.88, 197276.64],
    2966: [-83481.29, 197301.67], 2967: [-83472.41, 197271.10], 2968: [-83464.17, 197275.41], 2969: [-83463.26, 197278.37],
    2970: [-83455.97, 197276.20], 2971: [-83461.33, 197262.07], 2972: [-83484.29, 197269.82], 2973: [-83505.61, 197277.00],
    2974: [-83517.89, 197281.11], 2975: [-83523.25, 197280.64], 2976: [-83528.41, 197276.85], 2977: [-83535.83, 197263.94],
    2978: [-83538.74, 197256.85], 2979: [-83531.86, 197245.16], 2980: [-83517.17, 197242.67], 2981: [-83494.99, 197238.02]
  };
  var LOTS = {
    1: [1175, 1178, 2696, 2963, 2962, 2961, 2960, 2957, 2956],
    2: [1179, 2956, 2957, 2958, 2959, 2954, 2955],
    3: [2425, 1173, 2955, 2954, 2953, 2952, 2951, 2950, 33],
    4: [2963, 2697, 2966, 2965, 2964, 2962],
    5: [2966, 2698, 2699, 2970, 2969, 2968, 2967, 2965],
    6: [2981, 2972, 2971, 2701, 37],
    7: [2979, 2978, 2977, 2976, 2975, 2974, 2973, 2980, 171],
    8: [2980, 2973, 2972, 2981]
  };
  var ROAD = [2950, 2951, 2952, 2953, 2954, 2959, 2958, 2957, 2960, 2961, 2962, 2964, 2965, 2967, 2968, 2969, 2970, 2700,
              2971, 2972, 2973, 2974, 2975, 2976, 2977, 2978, 2979, 35];
  var OUTER = [33, 35, 171, 37, 2701, 2700, 2699, 2698, 2697, 2696, 1178, 1175, 1179, 1173, 2425];
  // Hausposition (GK) + Drehung (Grad)
  var HOUSE_POS = {
    1: [-83529.1, 197310.5, 20], 2: [-83546.5, 197287.5, 30], 3: [-83562.0, 197263.5, 30], 4: [-83498.6, 197294.8, 18],
    5: [-83469.5, 197286.4, 17], 6: [-83478.4, 197250.6, 19], 7: [-83522.0, 197261.5, 19], 8: [-83500.6, 197256.4, 19]
  };

  var MP = { y0: -83628, x0: 197343, s: 5, w: 1100, h: 660 };
  function gk(y, x) { return [(y - MP.y0) * MP.s, (MP.x0 - x) * MP.s]; }
  function pt(id) { return gk(PTS[id][0], PTS[id][1]); }
  function polyD(ids) { return 'M' + ids.map(function (id) { return pt(id).map(function (v) { return v.toFixed(1); }).join(' '); }).join('L') + 'Z'; }
  function pathFromGK(list) { return 'M' + list.map(function (p) { return gk(p[0], p[1]).map(function (v) { return v.toFixed(1); }).join(' '); }).join('L'); }
  function el(name, attrs, parent) {
    var n = document.createElementNS(SVGNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function pointIn(poly, x, y) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  var seed = 7;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function drawTree(g, x, y, r) {
    el('circle', { cx: x + r * 0.28, cy: y + r * 0.34, r: r, fill: 'rgba(52,64,38,.16)' }, g);
    el('circle', { cx: x, cy: y, r: r, fill: '#8FA06E' }, g);
    el('circle', { cx: x - r * 0.18, cy: y - r * 0.2, r: r * 0.68, fill: '#A2B27F' }, g);
    el('circle', { cx: x - r * 0.32, cy: y - r * 0.36, r: r * 0.28, fill: '#B5C293', opacity: 0.8 }, g);
  }

  // Auf schmalen Screens auf den relevanten Ausschnitt zoomen
  var narrow = window.matchMedia("(max-width: 640px)");
  function fitView(svg, full, crop) {
    var apply = function () { svg.setAttribute("viewBox", narrow.matches ? crop : full); };
    apply();
    if (narrow.addEventListener) narrow.addEventListener("change", apply);
  }

  function buildMasterplan() {
    var host = $('#mp-canvas');
    if (!host) return;
    var svg = el('svg', { viewBox: '0 0 ' + MP.w + ' ' + MP.h, role: 'img', 'aria-label': 'Masterplan der acht Grundstücke mit Zufahrtsstraße' });
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id: 'mp-vines', width: 11, height: 11, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(-24)' }, defs);
    el('line', { x1: 0, y1: 5.5, x2: 11, y2: 5.5, stroke: '#B6BE98', 'stroke-width': 1.6, 'stroke-dasharray': '2.2 1.4' }, pat);
    var pat2 = el('pattern', { id: 'mp-field', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(12)' }, defs);
    el('line', { x1: 0, y1: 7, x2: 14, y2: 7, stroke: '#D7D6C0', 'stroke-width': 1 }, pat2);
    var lotGrad = el('linearGradient', { id: 'mp-lot', x1: 0, y1: 0, x2: 1, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#C9D2A8' }, lotGrad);
    el('stop', { offset: '1', 'stop-color': '#BAC697' }, lotGrad);
    var f = el('filter', { id: 'mp-shadow', x: '-30%', y: '-30%', width: '160%', height: '160%' }, defs);
    el('feDropShadow', { dx: 3, dy: 4, stdDeviation: 2.6, 'flood-color': '#2F3A22', 'flood-opacity': 0.28 }, f);

    // Umgebung
    el('rect', { x: 0, y: 0, width: MP.w, height: MP.h, fill: '#E3E3CF' }, svg);
    el('rect', { x: 0, y: 0, width: MP.w, height: MP.h, fill: 'url(#mp-vines)', opacity: 0.75 }, svg);
    el('path', { d: pathFromGK([[-83700, 197400], [-83541, 197400], [-83541, 197332.4], [-83552, 197314], [-83568.5, 197288], [-83574, 197278.6], [-83581.3, 197265], [-83589, 197250.6], [-83700, 197253]]) + 'Z', fill: '#E8E6D4' }, svg);
    el('path', { d: pathFromGK([[-83700, 197246], [-83582.6, 197243.2], [-83549.6, 197240.8], [-83520.1, 197236.1], [-83477, 197227.1], [-83470, 197225.8], [-83380, 197211.5], [-83380, 197100], [-83700, 197100]]) + 'Z', fill: '#E9E7D5' }, svg);
    el('path', { d: pathFromGK([[-83700, 197246], [-83582.6, 197243.2], [-83549.6, 197240.8], [-83520.1, 197236.1], [-83477, 197227.1], [-83470, 197225.8], [-83380, 197211.5], [-83380, 197100], [-83700, 197100]]) + 'Z', fill: 'url(#mp-field)' }, svg);

    // Nachbarbebauung (dezent)
    [[-83612, 197296, 12, 9, 28], [-83606, 197268, 11, 8, 26], [-83614, 197318, 10, 8, 32], [-83560, 197222, 12, 9, 8], [-83430, 197248, 9, 8, 20], [-83598, 197228, 10, 8, 4]]
      .forEach(function (b) {
        var c = gk(b[0], b[1]);
        el('rect', { x: -b[2] * 2.5, y: -b[3] * 2.5, width: b[2] * 5, height: b[3] * 5, fill: '#D8D2C2', stroke: '#CBC3B0', 'stroke-width': 1, transform: 'translate(' + c[0] + ' ' + c[1] + ') rotate(' + b[4] + ')' }, svg);
      });

    // öffentliche Straße & Weg
    var road = [[-83720, 197249.6], [-83582.6, 197246.4], [-83549.6, 197244], [-83520.1, 197239.3], [-83477, 197230.3], [-83470.1, 197228.9], [-83360, 197211]];
    el('path', { d: pathFromGK(road), fill: 'none', stroke: '#D5CCB6', 'stroke-width': 33 }, svg);
    el('path', { d: pathFromGK(road), fill: 'none', stroke: '#F3EFE4', 'stroke-width': 29 }, svg);
    var path = [[-83586.6, 197249.5], [-83578.8, 197265.4], [-83571.6, 197279], [-83566.2, 197288.6], [-83549.8, 197314.6], [-83538.7, 197333.4], [-83531, 197400]];
    el('path', { d: pathFromGK(path), fill: 'none', stroke: '#D9D1BD', 'stroke-width': 15, 'stroke-linejoin': 'round' }, svg);
    el('path', { d: pathFromGK(path), fill: 'none', stroke: '#F0EBDE', 'stroke-width': 12, 'stroke-linejoin': 'round' }, svg);

    // Grundstücke
    var outerPoly = OUTER.map(pt);
    el('path', { d: polyD(OUTER), fill: '#C3CDA0' }, svg);
    var lotLayer = el('g', {}, svg);
    var lotEls = {};
    HOUSES.forEach(function (h) {
      var ids = LOTS[h.nr];
      if (!ids) return;
      var g = el('g', { class: 'mp-lot', 'data-nr': h.nr, tabindex: 0, role: 'button', 'aria-label': 'Haus ' + pad(h.nr) + ', Grundstück ca. ' + h.grundstueck + ' m²' }, lotLayer);
      el('path', { class: 'lot-shape', d: polyD(ids), fill: 'url(#mp-lot)', stroke: '#F5F2EA', 'stroke-width': 2.4, 'stroke-linejoin': 'round' }, g);
      lotEls[h.nr] = g;
    });

    // Zufahrt
    el('path', { d: polyD(ROAD), fill: '#EFEADD', stroke: '#D6CDB8', 'stroke-width': 1.4, 'stroke-linejoin': 'round' }, svg);
    var lbl = gk(-83501.5, 197275.6);
    var t = el('text', { x: 0, y: 3.5, 'text-anchor': 'middle', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 9, 'letter-spacing': 2.4, fill: '#A59B86', transform: 'translate(' + lbl[0] + ' ' + lbl[1] + ') rotate(18.6)' }, svg);
    t.textContent = 'ZUFAHRT';

    // Bäume
    var trees = el('g', { 'pointer-events': 'none' }, svg);
    var housesSvg = Object.keys(HOUSE_POS).map(function (k) { return gk(HOUSE_POS[k][0], HOUSE_POS[k][1]); });
    var roadPoly = ROAD.map(pt);
    var nearHouse = function (x, y, d) { return housesSvg.some(function (c) { return Math.hypot(c[0] - x, c[1] - y) < d; }); };
    for (var i = 0; i < outerPoly.length; i++) {
      var a = outerPoly[i], b = outerPoly[(i + 1) % outerPoly.length];
      var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      var nx = -(b[1] - a[1]) / len, ny = (b[0] - a[0]) / len;
      var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      if (!pointIn(outerPoly, mx + nx * 6, my + ny * 6)) { nx = -nx; ny = -ny; }
      for (var d = 22; d < len - 14; d += 50 + rnd() * 16) {
        var x = a[0] + (b[0] - a[0]) * d / len + nx * (17 + rnd() * 6);
        var y = a[1] + (b[1] - a[1]) * d / len + ny * (17 + rnd() * 6);
        if (pointIn(roadPoly, x, y) || nearHouse(x, y, 66)) continue;
        if (Math.hypot(x - pt(2970)[0], y - pt(2970)[1]) < 50 || Math.hypot(x - pt(2950)[0], y - pt(2950)[1]) < 60) continue;
        drawTree(trees, x, y, 10 + rnd() * 5);
      }
    }
    // Gehölz außerhalb
    [[-83592, 197338, 15], [-83600, 197320, 12], [-83545, 197347, 13], [-83440, 197300, 14], [-83428, 197280, 12], [-83438, 197262, 11],
     [-83597, 197284, 11], [-83593, 197262, 13], [-83620, 197240, 12], [-83405, 197238, 13], [-83520, 197225, 11]]
      .forEach(function (tr) { var c = gk(tr[0], tr[1]); drawTree(trees, c[0], c[1], tr[2]); });

    // Häuser
    var houseLayer = el('g', {}, svg);
    var pinLayer = el('g', { 'pointer-events': 'none' }, svg);
    var pinEls = {};
    HOUSES.forEach(function (h) {
      var p = HOUSE_POS[h.nr];
      if (!p) return;
      var c = gk(p[0], p[1]);
      var g = el('g', { class: 'mp-house', 'data-nr': h.nr, transform: 'translate(' + c[0].toFixed(1) + ' ' + c[1].toFixed(1) + ') rotate(' + p[2] + ')', filter: 'url(#mp-shadow)' }, houseLayer);
      el('rect', { x: -30, y: 22, width: 46, height: 17, fill: '#D8C3A0', stroke: '#C7AF88', 'stroke-width': 0.8 }, g);
      el('rect', { x: 8, y: -42, width: 26, height: 21, fill: '#CFC8B9', stroke: '#BDB5A4', 'stroke-width': 0.8 }, g);
      el('rect', { x: -34, y: -22, width: 68, height: 22, fill: '#A2917C' }, g);
      el('rect', { x: -34, y: 0, width: 68, height: 22, fill: '#8C7B67' }, g);
      el('line', { x1: -34, y1: 0, x2: 34, y2: 0, stroke: '#76654F', 'stroke-width': 1.2 }, g);
      lotEls[h.nr].appendChild(g); // Haus gehört zur Hover-Fläche des Grundstücks

      var pin = el('g', { class: 'pin', 'data-nr': h.nr, transform: 'translate(' + c[0].toFixed(1) + ' ' + (c[1] - 4).toFixed(1) + ')' }, pinLayer);
      var inner = el('g', { class: 'pin-inner' }, pin);
      el('circle', { r: 14, fill: '#F5F2EA', stroke: '#55624A', 'stroke-width': 1.2 }, inner);
      var tx = el('text', { y: 4, 'text-anchor': 'middle', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 11, 'font-weight': 500, fill: '#252C26' }, inner);
      tx.textContent = pad(h.nr);
      pinEls[h.nr] = pin;
    });

    // Nordpfeil
    var n = el('g', { transform: 'translate(1046 66)', opacity: 0.75 }, svg);
    el('circle', { r: 20, fill: 'none', stroke: '#55624A', 'stroke-width': 0.8 }, n);
    el('path', { d: 'M0 -15 L5 6 L0 2 L-5 6 Z', fill: '#55624A' }, n);
    var nt = el('text', { y: -25, 'text-anchor': 'middle', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 10, fill: '#55624A' }, n);
    nt.textContent = 'N';

    fitView(svg, "0 0 " + MP.w + " " + MP.h, "190 34 740 600");
    host.appendChild(svg);

    // Interaktion
    var tip = $('#mp-tooltip');
    var figure = $('.mp-figure');
    function showTip(nr) {
      var h = HOUSES.filter(function (x) { return x.nr === nr; })[0];
      var p = HOUSE_POS[nr];
      if (!h || !p) return;
      var c = gk(p[0], p[1]);
      var fr = figure.getBoundingClientRect();
      var sp = svg.createSVGPoint();
      sp.x = c[0]; sp.y = c[1] - 20;
      sp = sp.matrixTransform(svg.getScreenCTM());
      tip.innerHTML = '<strong>Haus ' + pad(nr) + '</strong>Grundstück ca. ' + fmt(h.grundstueck) + ' m²<br>' + STATUS[h.status];
      tip.style.left = (sp.x - fr.left) + 'px';
      tip.style.top = (sp.y - fr.top) + 'px';
      tip.classList.add('is-visible');
    }
    function hideTip() { tip.classList.remove('is-visible'); }

    setPlanActive = function (nr, on, withTip) {
      if (lotEls[nr]) lotEls[nr].classList.toggle('is-active', on);
      if (pinEls[nr]) pinEls[nr].classList.toggle('is-active', on);
      if (withTip) { if (on) showTip(nr); else hideTip(); }
    };

    Object.keys(lotEls).forEach(function (k) {
      var nr = +k, g = lotEls[k];
      g.addEventListener('mouseenter', function () { setPlanActive(nr, true, true); if (cards[nr]) cards[nr].classList.add('is-linked'); });
      g.addEventListener('mouseleave', function () { setPlanActive(nr, false, true); if (cards[nr]) cards[nr].classList.remove('is-linked'); });
      g.addEventListener('focus', function () { setPlanActive(nr, true, true); });
      g.addEventListener('blur', function () { setPlanActive(nr, false, true); });
      var go = function () { hideTip(); highlightCard(nr); };
      g.addEventListener('click', go);
      g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    });
  }

  var setPlanActive = function () {};
  function highlightCard(nr) {
    var card = cards[nr];
    if (!card) return;
    card.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
    card.classList.remove('is-highlight');
    void card.offsetWidth;
    card.classList.add('is-highlight', 'is-in');
    setTimeout(function () { card.classList.remove('is-highlight'); }, 2600);
  }

  buildMasterplan();

  /* ---------------- Lage-Karte ---------------- */
  function buildMap() {
    var host = $('#lage-map');
    if (!host) return;
    var W = 800, H = 520;
    // lon 14.93–15.67, lat 46.78–47.10 (stilisiert)
    var geo = function (lat, lon) { return [(lon - 14.93) / 0.74 * W, (47.10 - lat) / 0.32 * H]; };
    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + H, role: 'img', 'aria-label': 'Stilisierte Karte: Projektstandort bei Stainz, Deutschlandsberg im Süden, Graz im Nordosten' });
    var defs = el('defs', {}, svg);
    var pat = el('pattern', { id: 'map-vine', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(35)' }, defs);
    el('line', { x1: 0, y1: 3, x2: 6, y2: 3, stroke: '#B9BE9C', 'stroke-width': 1 }, pat);

    el('rect', { width: W, height: H, fill: '#F1EDE3' }, svg);
    // Koralpe / Hügelland – weiche Konturen
    var hills = el('g', { fill: 'none', stroke: '#E1DACA', 'stroke-width': 1.1 }, svg);
    for (var k = 0; k < 7; k++) {
      var o = k * 22;
      el('path', { d: 'M' + (-20) + ' ' + (60 + o) + ' C ' + (90 + o * 0.4) + ' ' + (110 + o) + ', ' + (60 + o * 0.6) + ' ' + (260 + o) + ', ' + (150 + o * 0.5) + ' ' + (330 + o) + ' S ' + (120 + o) + ' ' + (480 + o * 0.3) + ', ' + (190 + o) + ' ' + (560) }, hills);
    }
    el('path', { d: 'M0 0 H 150 C 120 120, 70 200, 110 300 S 90 460, 160 520 H 0 Z', fill: '#E7E1D2' }, svg);
    var hills2 = el('g', { fill: 'none', stroke: '#E6E0D1', 'stroke-width': 1 }, svg);
    [[380, 120], [470, 330], [560, 230], [660, 400], [250, 440], [700, 160]].forEach(function (c, i) {
      for (var r = 0; r < 3; r++) el('ellipse', { cx: c[0], cy: c[1], rx: 60 + r * 26 + i * 4, ry: 26 + r * 12, transform: 'rotate(' + (-12 + i * 5) + ' ' + c[0] + ' ' + c[1] + ')' }, hills2);
    });
    // Weinbau-Flächen
    [[300, 260, 34, 18, -20], [395, 300, 30, 14, 10], [330, 380, 38, 16, 25], [290, 420, 26, 12, -10], [420, 360, 24, 12, -25], [270, 330, 22, 12, 15]].forEach(function (v) {
      el('ellipse', { cx: v[0], cy: v[1], rx: v[2], ry: v[3], fill: 'url(#map-vine)', opacity: 0.85, transform: 'rotate(' + v[4] + ' ' + v[0] + ' ' + v[1] + ')' }, svg);
    });
    // Mur
    el('path', { d: 'M560 -10 C 552 40, 566 90, 580 140 S 610 260, 640 330 S 690 450, 700 530', fill: 'none', stroke: '#CAD5D2', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg);

    var P = {
      graz: geo(47.071, 15.439), lieboch: geo(46.973, 15.339), ligist: geo(47.013, 15.207),
      stainz: geo(46.894, 15.262), dl: geo(46.815, 15.222), projekt: geo(46.910, 15.237)
    };
    var roadStyle = function (d, w) {
      el('path', { d: d, fill: 'none', stroke: '#DCD3C0', 'stroke-width': w + 2.5, 'stroke-linecap': 'round' }, svg);
      el('path', { d: d, fill: 'none', stroke: '#FFFDF8', 'stroke-width': w, 'stroke-linecap': 'round' }, svg);
    };
    roadStyle('M' + P.graz + ' C 520 110, 470 160, ' + P.lieboch + ' S 380 280, ' + P.stainz, 3.4);
    roadStyle('M' + P.stainz + ' C 350 370, 330 400, ' + P.dl, 3);
    roadStyle('M' + P.projekt + ' L ' + P.stainz, 2);
    roadStyle('M' + P.ligist + ' C 300 190, 340 260, ' + P.projekt, 2);
    // Schilcherweinstraße
    var wine = el('path', { d: 'M' + P.ligist + ' C 280 200, 300 260, ' + P.projekt + ' S 350 330, ' + P.stainz + ' S 300 400, ' + P.dl, fill: 'none', stroke: '#B07A80', 'stroke-width': 1.4, 'stroke-dasharray': '5 5', opacity: 0.85 }, svg);
    wine.setAttribute('id', 'wine-route');
    var wl = el('text', { x: 205, y: 395, 'font-family': 'Cormorant Garamond, Georgia, serif', 'font-style': 'italic', 'font-size': 16, fill: '#9A6870', transform: 'rotate(-62 205 395)' }, svg);
    wl.textContent = 'Schilcherweinstraße';

    var label = function (x, y, txt, opts) {
      opts = opts || {};
      var t = el('text', { x: x, y: y, 'text-anchor': opts.anchor || 'start', 'font-family': opts.serif ? 'Cormorant Garamond, Georgia, serif' : 'Inter, Arial, sans-serif', 'font-size': opts.size || 12, 'font-weight': opts.weight || 400, 'letter-spacing': opts.ls || 0, fill: opts.fill || '#3d3d38' }, svg);
      t.textContent = txt;
      return t;
    };
    var dot = function (p, r, fill) { el('circle', { cx: p[0], cy: p[1], r: r + 3, fill: '#F1EDE3' }, svg); el('circle', { cx: p[0], cy: p[1], r: r, fill: fill || '#252C26' }, svg); };

    dot(P.ligist, 3, '#8f8a7c'); label(P.ligist[0] + 9, P.ligist[1] + 4, 'Ligist', { size: 11, fill: '#8f8a7c' });
    dot(P.lieboch, 3, '#8f8a7c'); label(P.lieboch[0] + 9, P.lieboch[1] + 4, 'Lieboch', { size: 11, fill: '#8f8a7c' });
    dot(P.graz, 6); label(P.graz[0] + 14, P.graz[1] + 8, 'Graz', { serif: true, size: 30, weight: 500, fill: '#252C26' });
    label(P.graz[0] + 16, P.graz[1] + 27, 'ca. 35 Min.', { size: 11, ls: 1, fill: '#6B6A62' });
    label(122, 484, '↙ Klagenfurt · ca. 1,5 Std.', { size: 11.5, ls: 1, fill: '#6B6A62' });
    dot(P.stainz, 5); label(P.stainz[0] + 13, P.stainz[1] + 8, 'Stainz', { serif: true, size: 26, weight: 500, fill: '#252C26' });
    dot(P.dl, 5); label(P.dl[0] + 13, P.dl[1] + 7, 'Deutschlandsberg', { serif: true, size: 22, weight: 500, fill: '#252C26' });
    label(34, 150, 'KORALPE', { size: 10, ls: 5, fill: '#A79F8E' });

    // Projektstandort
    var pj = el('g', { transform: 'translate(' + P.projekt[0] + ' ' + P.projekt[1] + ')' }, svg);
    el('circle', { r: 22, fill: 'rgba(71,122,69,.18)', cy: -2 }, pj).appendChild(el('animate', { attributeName: 'r', values: '14;26;14', dur: '3.2s', repeatCount: 'indefinite' }));
    el('path', { d: 'M0 0 C -4 -8, -11 -12, -11 -21 A 11 11 0 1 1 11 -21 C 11 -12, 4 -8, 0 0 Z', fill: '#477A45', stroke: '#F5F2EA', 'stroke-width': 1.5 }, pj);
    el('circle', { cy: -21, r: 4, fill: '#F5F2EA' }, pj);
    var pl = el('g', { transform: 'translate(-20 -44)' }, pj);
    el('rect', { x: -168, y: -16, width: 168, height: 26, fill: '#252C26' }, pl);
    var plt = el('text', { x: -84, y: 1.5, 'text-anchor': 'middle', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 10, 'font-weight': 500, 'letter-spacing': 2.4, fill: '#F5F2EA' }, pl);
    plt.textContent = 'SCHILCHER HÄUSER';

    // Maßstab & Nordpfeil
    var sc = el('g', { transform: 'translate(' + (W - 130) + ' ' + (H - 34) + ')', fill: '#6B6A62' }, svg);
    var kmPx = W / (0.74 * 76); // ≈ px pro km
    el('rect', { x: 0, y: 0, width: kmPx * 5, height: 2, fill: '#6B6A62' }, sc);
    label(W - 130, H - 42, '5 km', { size: 10, fill: '#6B6A62' });
    var nn = el('g', { transform: 'translate(' + (W - 40) + ' 48)' }, svg);
    el('path', { d: 'M0 -16 L6 8 L0 3 L-6 8 Z', fill: '#55624A' }, nn);
    var ntt = el('text', { y: -22, 'text-anchor': 'middle', 'font-family': 'Inter, Arial, sans-serif', 'font-size': 10, fill: '#55624A' }, nn);
    ntt.textContent = 'N';

    fitView(svg, "0 0 " + W + " " + H, "110 20 620 470");
    host.appendChild(svg);
  }
  buildMap();

  /* ---------------- Start ---------------- */
  observeReveal($$('.reveal, .reveal-img'));

  // Von Unterseiten: index.html#modal-expose / #modal-termin öffnet das Modal
  var hashModal = /^#modal-(expose|termin|impressum|datenschutz)$/.exec(window.location.hash);
  if (hashModal && document.getElementById('modal-' + hashModal[1])) {
    history.replaceState(null, '', window.location.pathname);
    setTimeout(function () { openModal('modal-' + hashModal[1]); }, 400);
  }
  var y = $('#year');
  if (y) y.textContent = new Date().getFullYear();
})();
