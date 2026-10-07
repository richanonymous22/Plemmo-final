/* ==========================================================================
   PLEMMO — price-spectrum.js

   The commercial display range is 27 products from £230 to £5,455, and the
   page showed it as eight tab-switched tables. You could see four screens at
   a time and never the shape of the range, so the two questions a buyer
   actually has — "what does a screen my size cost?" and "what does the extra
   money buy?" — were unanswerable without clicking through all eight tabs
   and holding the numbers in your head.

   This plots every product at once: price along the x-axis, physical size in
   lanes down the y-axis. Filtering rescales the axis to the visible range, so
   narrowing to POS displays zooms into £230–£360 instead of leaving them
   squashed against the left edge.

   Prices mirror data/content.json exactly.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var F = w.Fluid;
  if (!F) return;

  /* ── catalogue (mirrors data/content.json → signage.commercial) ───────── */
  var CATS = [
    { id: 'adv',   label: 'Advertising' },
    { id: 'vib',   label: '4K Vibrant' },
    { id: 'free',  label: 'Freestanding' },
    { id: 'win',   label: 'Window' },
    { id: 'kiosk', label: 'Touch Kiosks' },
    { id: 'out',   label: 'Outdoor' },
    { id: 'touch', label: 'Interactive' },
    { id: 'pos',   label: 'POS' }
  ];

  var P = [
    ['adv',   32, 650,  '32" Slimline Pro Advertising Display'],
    ['adv',   43, 890,  '43" Slimline Pro Advertising Display'],
    ['adv',   50, 1035, '50" Slimline Pro Advertising Display'],
    ['adv',   55, 1350, '55" Slimline Pro Advertising Display'],
    ['vib',   32, 499,  '32" Vibrant Professional Display'],
    ['vib',   43, 715,  '43" 4K Vibrant Professional Display'],
    ['vib',   50, 810,  '50" 4K Vibrant Professional Display'],
    ['vib',   55, 1140, '55" 4K Vibrant Professional Display'],
    ['free',  50, 1915, '50" Android Freestanding Digital Poster'],
    ['free',  55, 2190, '55" Android Freestanding Digital Poster'],
    ['free',  65, 3575, '65" 4K Freestanding Digital Poster'],
    ['win',   43, 1770, '43" Ultra High Brightness Window Display'],
    ['win',   55, 2220, '55" Ultra High Brightness Window Display'],
    ['win',   65, 3240, '65" Ultra High Brightness Window Display'],
    ['kiosk', 43, 2290, '43" Android Touch Screen Kiosk'],
    ['kiosk', 50, 2565, '50" Android Touch Screen Kiosk'],
    ['kiosk', 55, 2745, '55" Android Touch Screen Kiosk'],
    ['out',   43, 2960, '43" Outdoor Digital Advertising Display'],
    ['out',   55, 5455, '55" Outdoor Digital Advertising Display'],
    ['out',   43, 2370, '43" Outdoor Digital A-Board'],
    ['touch', 55, 1139, '55" 4K Interactive Touch Display'],
    ['touch', 65, 1230, '65" 4K Interactive Touch Display'],
    ['touch', 75, 1770, '75" 4K Interactive Touch Display'],
    ['pos',   10, 230,  '10" POS Android Advertising Display'],
    ['pos',   15, 360,  '15" POS Android Advertising Display']
  ].map(function (r, i) {
    return { i: i, cat: r[0], size: r[1], price: r[2], name: r[3],
             catLabel: CATS.filter(function (c) { return c.id === r[0]; })[0].label };
  });

  /* Lanes group screens by the decision a buyer is actually making — a
     counter-top unit and a shopfront poster are not the same purchase. */
  var LANES = [
    { id: 'l1', label: 'Counter · 10–15"',  test: function (s) { return s <= 15; } },
    { id: 'l2', label: 'Standard · 32–43"', test: function (s) { return s >= 32 && s <= 43; } },
    { id: 'l3', label: 'Large · 50–55"',    test: function (s) { return s >= 50 && s <= 55; } },
    { id: 'l4', label: 'Flagship · 65–75"', test: function (s) { return s >= 65; } }
  ];
  function laneOf(size) {
    for (var i = 0; i < LANES.length; i++) if (LANES[i].test(size)) return i;
    return LANES.length - 1;
  }

  function gbp(n) { return '£' + n.toLocaleString('en-GB'); }

  function build(mount) {
    var active = null;                  /* null = all categories */
    var selected = null;

    mount.className = 'fl-sp';
    mount.innerHTML =
      '<div class="fl-sp-filters" role="group" aria-label="Filter by display type">' +
        '<button type="button" class="fl-sp-chip on" data-cat="" data-press aria-pressed="true">' +
          'All displays<span class="ct">' + P.length + '</span></button>' +
        CATS.map(function (c) {
          var n = P.filter(function (p) { return p.cat === c.id; }).length;
          return '<button type="button" class="fl-sp-chip" data-cat="' + c.id + '" data-press aria-pressed="false">' +
                 c.label + '<span class="ct">' + n + '</span></button>';
        }).join('') +
      '</div>' +
      '<div class="fl-sp-plot">' +
        '<div class="fl-sp-lanes" id="spLanes">' +
          LANES.map(function (l) {
            return '<div class="fl-sp-lane"><span class="fl-sp-lane-lbl">' + l.label + '</span></div>';
          }).join('') +
        '</div>' +
        '<div class="fl-sp-axis" id="spAxis"></div>' +
      '</div>' +
      '<div class="fl-sp-readout" id="spReadout" aria-live="polite"></div>';

    var lanesEl = mount.querySelector('#spLanes');
    var axisEl = mount.querySelector('#spAxis');
    var readoutEl = mount.querySelector('#spReadout');

    /* One node per product; each gets its own X spring so a filter change
       animates positions rather than teleporting them. */
    var nodes = P.map(function (p) {
      var el = d.createElement('button');
      el.type = 'button';
      el.className = 'fl-sp-node';
      el.setAttribute('data-i', String(p.i));
      el.setAttribute('aria-label', p.name + ', ' + gbp(p.price));
      /* Node size encodes screen size — a second reading of the same data,
         so the plot is legible even before you read a label. */
      var px = Math.round(9 + (p.size / 75) * 13);
      el.innerHTML = '<i style="width:' + px + 'px;height:' + px + 'px"></i>' +
                     '<span class="tag">' + gbp(p.price) + '</span>';
      lanesEl.children[laneOf(p.size)].appendChild(el);

      /* X and Y get independent springs. A single spring on the 2D distance
         desyncs the moment the two axes have different velocities. */
      var sx = new F.Spring({ from: 0, response: 0.5, damping: 0.85 });
      var sy = new F.Spring({ from: 0, response: 0.46, damping: 0.9 });
      var so = new F.Spring({ from: 1, response: 0.34, damping: 1.0 });
      var node = { p: p, el: el, sx: sx, sy: sy, so: so, visible: true };
      sx.onUpdate = function () { paint(node); };
      sy.onUpdate = function () { paint(node); };
      so.onUpdate = function () { paint(node); };
      return node;
    });

    function paint(node) {
      node.el.style.transform =
        'translate3d(' + node.sx.value.toFixed(2) + 'px,' + node.sy.value.toFixed(2) + 'px,0) ' +
        'scale(' + Math.max(0, node.so.value).toFixed(3) + ')';
      node.el.style.opacity = Math.max(0, Math.min(1, node.so.value)).toFixed(3);
      node.el.style.pointerEvents = node.so.value > 0.5 ? 'auto' : 'none';
      node.el.setAttribute('aria-hidden', node.visible ? 'false' : 'true');
      node.el.tabIndex = node.visible ? 0 : -1;
    }

    /* ── scale ─────────────────────────────────────────────────────────── */
    /* Prices span £230 to £5,455 — a 24x range. On a linear axis the single
       £5,455 outdoor unit pushes two thirds of the catalogue into the left
       third of the plot, which is exactly where most buyers are shopping.
       A log axis gives each price step proportional room; the ticks are
       labelled with real amounts so nothing is misread. */
    var lo = 1, hi = 2;
    function lg(v) { return Math.log(v); }
    function visibleSet() {
      return nodes.filter(function (n) { return !active || n.p.cat === active; });
    }

    /* ROW_H must clear a dot plus its label plus breathing room, or a price
       from one row sits on the dot of the next. */
    var MIN_GAP = 52, ROW_H = 40, LANE_PAD = 34;

    function rescale(animate) {
      var prices = visibleSet().map(function (n) { return n.p.price; });
      var min = Math.min.apply(null, prices), max = Math.max.apply(null, prices);
      /* Pad in log space, and force a floor on the window width so a
         single-product filter doesn't divide by zero or explode the scale. */
      var span = Math.max(lg(max) - lg(min), 0.35);
      var pad = span * 0.14;
      lo = lg(min) - pad; hi = lg(max) + pad;

      var W = lanesEl.clientWidth || 600;
      var INSET = 46;                     /* keep nodes clear of the lane label */
      var usable = Math.max(60, W - INSET - 44);

      nodes.forEach(function (n) {
        n.visible = !active || n.p.cat === active;
        n.x = INSET + ((lg(n.p.price) - lo) / (hi - lo)) * usable;
      });

      /* Two screens priced within a few pounds land on top of each other and
         their labels become an unreadable smear. Walk each lane left to right
         and drop any node that crowds its neighbour onto a second row. The
         lane then grows to fit however many rows it needed — otherwise the
         overflow silently lands in the lane below and the size grouping,
         which is the whole point of the y-axis, stops being true. */
      LANES.forEach(function (lane, li) {
        var inLane = nodes
          .filter(function (n) { return n.visible && laneOf(n.p.size) === li; })
          .sort(function (a, b) { return a.x - b.x; });
        var rowEnds = [], maxRow = 0;
        inLane.forEach(function (n) {
          var row = 0;
          while (rowEnds[row] != null && n.x - rowEnds[row] < MIN_GAP) row++;
          rowEnds[row] = n.x;
          n.y = row * ROW_H;
          if (row > maxRow) maxRow = row;
        });
        lanesEl.children[li].style.height = (LANE_PAD + (maxRow + 1) * ROW_H) + 'px';
      });

      nodes.forEach(function (n) {
        var y = n.visible ? (n.y || 0) : 0;
        if (animate === false) { n.sx.set(n.x); n.sy.set(y); n.so.set(n.visible ? 1 : 0); }
        else { n.sx.to(n.x); n.sy.to(y); n.so.to(n.visible ? 1 : 0); }
      });

      /* Ticks span the real data range and are positioned at the same x as
         the nodes, so the ends of the axis are the cheapest and dearest
         products we actually sell. Spacing them evenly across the *padded*
         window instead would print a top tick like "£8,500" when nothing in
         the range costs over £5,455. */
      var ticks = 5, out = '';
      for (var i = 0; i < ticks; i++) {
        var v = Math.exp(lg(min) + (lg(max) - lg(min)) * (i / (ticks - 1)));
        var tx = INSET + ((lg(v) - lo) / (hi - lo)) * usable;
        /* Round intermediate ticks for readability; keep the two endpoints
           exact, because they are real prices. */
        var label = (i === 0 || i === ticks - 1) ? Math.round(v) : Math.round(v / 10) * 10;
        out += '<span style="left:' + tx.toFixed(1) + 'px">' + gbp(label) + '</span>';
      }
      axisEl.innerHTML = out;
    }

    /* ── readout ───────────────────────────────────────────────────────── */
    function showReadout(p) {
      selected = p;
      nodes.forEach(function (n) { n.el.classList.toggle('on', n.p === p); });
      if (!p) {
        var vis = visibleSet().map(function (n) { return n.p.price; });
        var min = Math.min.apply(null, vis), max = Math.max.apply(null, vis);
        readoutEl.innerHTML =
          '<div><div class="rk">' + (active ? CATS.filter(function (c) { return c.id === active; })[0].label : 'Full range') + '</div>' +
          '<h4>' + visibleSet().length + ' displays from ' + gbp(min) + ' to ' + gbp(max) + '</h4>' +
          '<p>Select any dot to see the model and its indicative price.</p></div>' +
          '<div class="pr">' + gbp(min) + '<small>from</small></div>';
        return;
      }
      readoutEl.innerHTML =
        '<div><div class="rk">' + p.catLabel + ' · ' + p.size + '"</div>' +
        '<h4>' + p.name + '</h4>' +
        '<p>Indicative price. Final cost depends on specification, VAT, delivery, installation, design work and site survey.</p></div>' +
        '<div class="pr">' + gbp(p.price) +
        '<small><a href="#" class="fl-sp-cta" data-quote data-service="Digital Signage" ' +
        'data-product="' + p.name.replace(/"/g, '&quot;') + '">Get a quote →</a></small></div>';
    }

    /* Select on pointer-down, not click: the readout should appear the
       instant the finger lands. */
    lanesEl.addEventListener('pointerdown', function (e) {
      var btn = e.target.closest ? e.target.closest('.fl-sp-node') : null;
      if (!btn) return;
      var n = nodes[+btn.getAttribute('data-i')];
      if (!n || !n.visible) return;
      showReadout(n.p === selected ? null : n.p);
      F.haptic(6);
    });
    lanesEl.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var btn = e.target.closest ? e.target.closest('.fl-sp-node') : null;
      if (!btn) return;
      e.preventDefault();
      var n = nodes[+btn.getAttribute('data-i')];
      showReadout(n.p === selected ? null : n.p);
    });

    /* ── filters ───────────────────────────────────────────────────────── */
    Array.prototype.forEach.call(mount.querySelectorAll('[data-cat]'), function (btn) {
      btn.addEventListener('click', function () {
        active = btn.getAttribute('data-cat') || null;
        Array.prototype.forEach.call(mount.querySelectorAll('[data-cat]'), function (b) {
          var on = b === btn;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        if (selected && active && selected.cat !== active) selected = null;
        rescale(true);
        showReadout(selected);
        F.haptic(8);
        /* Let the page swap its category photo without this component
           needing to know that a photo exists. */
        mount.dispatchEvent(new CustomEvent('spectrum:filter', {
          bubbles: true, detail: { cat: active }
        }));
      });
    });

    var rt;
    w.addEventListener('resize', function () {
      clearTimeout(rt);
      rt = setTimeout(function () { rescale(true); }, 120);
    });

    rescale(false);
    showReadout(null);
  }

  function init() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-price-spectrum]'), build);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
