/* ==========================================================================
   PLEMMO — rate-explorer.js

   The provider rate tables in data/content.json are not really a list — they
   are a curve. Teya alone has twelve turnover bands, SumUp has eight across
   three contract terms. Presented as a table, nobody reads past row three.

   This renders them as the shape they actually are: a curve you drag along,
   with the providers re-ranking underneath as your turnover changes, so the
   answer to "who is cheapest for a business my size" is a gesture rather
   than a lookup.

   Every number below mirrors data/content.json exactly. Nothing is rounded,
   averaged or estimated here — pricing must never be invented by a UI.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var F = w.Fluid;
  if (!F) return;

  /* ── pricing data (mirrors data/content.json) ─────────────────────────── */

  /* Teya blended rate by monthly card turnover. */
  function teyaRate(t) {
    if (t < 10000) return 1.25; if (t < 11000) return 1.20; if (t < 12000) return 1.10;
    if (t < 13000) return 1.04; if (t < 14000) return 1.02; if (t < 15000) return 1.01;
    if (t < 16000) return 1.00; if (t < 17000) return 0.95; if (t < 18000) return 0.90;
    if (t < 19000) return 0.88; if (t < 20000) return 0.86; if (t < 22000) return 0.85;
    if (t < 36000) return 0.80; if (t < 43000) return 0.77; if (t < 66000) return 0.70;
    if (t < 81000) return 0.67; if (t < 100000) return 0.63; if (t < 120000) return 0.61;
    if (t < 200000) return 0.60; return 0.55;
  }

  /* SumUp: [pay-as-you-go, 12-month, 24-month] by band. */
  function sumupRates(t) {
    if (t < 7500) return [1.49, 1.29, 1.19]; if (t < 10000) return [1.29, 1.19, 1.19];
    if (t < 15000) return [1.19, 0.99, 0.89]; if (t < 20000) return [0.99, 0.89, 0.79];
    if (t < 30000) return [0.89, 0.79, 0.75]; if (t < 50000) return [0.79, 0.75, 0.69];
    if (t < 100000) return [0.75, 0.69, 0.59]; return [0.69, 0.59, 0.55];
  }

  /* Shift4 is a flat blended rate: 1.25% below £10k (plus a 25p per-
     transaction next-day settlement fee), 0.70% above. */
  function shift4Rate(t) { return t < 10000 ? 1.25 : 0.70; }

  /* Worldpay prices debit and credit separately, so it has no blended figure.
     It is shown alongside the blended providers but never ranked against
     them — inventing a blend would mean inventing a card mix we don't know. */
  function worldpaySplit(t) {
    if (t < 25000) return null;               /* split pricing starts around £25k */
    return t < 25001 ? { debit: 0.35, credit: 0.75 } : { debit: 0.30, credit: 0.65 };
  }

  var TERMS = [
    { id: 'payg', label: 'No contract', idx: 0 },
    { id: 'm12', label: '12 months', idx: 1 },
    { id: 'm24', label: '24 months', idx: 2 }
  ];

  var MIN = 3000, MAX = 200000;

  /* Log scale: at a linear scale everything below £40k is crushed into the
     left tenth of the track, which is exactly where most businesses are. */
  function toPos(t) {
    return (Math.log(t) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN));
  }
  function fromPos(p) {
    return Math.exp(Math.log(MIN) + p * (Math.log(MAX) - Math.log(MIN)));
  }

  function gbp(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function pc(r) { return r.toFixed(2) + '%'; }

  /* Round to a figure a business owner would actually say out loud. */
  function tidy(t) {
    if (t < 10000) return Math.round(t / 500) * 500;
    if (t < 50000) return Math.round(t / 1000) * 1000;
    return Math.round(t / 5000) * 5000;
  }

  function build(mount) {
    var term = 'payg';
    var turnover = 15000;

    mount.className = 'fl-rx';
    mount.innerHTML =
      '<div class="fl-rx-top">' +
        '<div class="fl-rx-turn">' +
          '<span class="lbl">Monthly card turnover</span>' +
          '<div class="val"><span id="rxTurn">£15,000</span><em id="rxPlus"></em></div>' +
        '</div>' +
        '<div class="fl-rx-headline">' +
          '<span class="lbl">Lowest indicative rate</span>' +
          '<div class="rate" id="rxBest">1.01%</div>' +
          '<span class="who" id="rxWho">Teya</span>' +
        '</div>' +
      '</div>' +

      '<div class="fl-rx-chart">' +
        '<svg id="rxSvg" viewBox="0 0 700 190" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs><linearGradient id="flRxGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="rgba(198,255,0,.26)"/>' +
            '<stop offset="100%" stop-color="rgba(198,255,0,0)"/>' +
          '</linearGradient></defs>' +
          '<g class="fl-rx-grid" id="rxGrid"></g>' +
          '<path class="fl-rx-area" id="rxArea"></path>' +
          '<path class="fl-rx-line alt" id="rxLineAlt"></path>' +
          '<path class="fl-rx-line" id="rxLine"></path>' +
          '<line class="fl-rx-rule" id="rxRule" y1="0" y2="190"></line>' +
          '<circle class="fl-rx-dot" id="rxDot" r="6"></circle>' +
          '<g id="rxAxis"></g>' +
        '</svg>' +
      '</div>' +

      '<div class="fl-rx-legend">' +
        '<span><i class="k-teya"></i>Teya blended rate</span>' +
        '<span><i class="k-sumup"></i>SumUp <em id="rxLegTerm">no contract</em></span>' +
        '<span class="fl-rx-legend-hint"><iconify-icon icon="ph:hand-swipe-left-duotone"></iconify-icon> drag to your turnover</span>' +
      '</div>' +

      '<div class="fl-rx-track" id="rxTrack" tabindex="0" role="slider" ' +
           'aria-label="Monthly card turnover" aria-valuemin="' + MIN + '" aria-valuemax="' + MAX + '" aria-valuenow="15000">' +
        '<div class="fl-rx-fill" id="rxFill"></div>' +
        '<div class="fl-rx-ticks" id="rxTicks"></div>' +
        '<div class="fl-rx-handle" id="rxHandle"><iconify-icon icon="ph:arrows-left-right-bold"></iconify-icon></div>' +
      '</div>' +
      '<div class="fl-rx-scale"><span>£3k</span><span>£10k</span><span>£30k</span><span>£80k</span><span>£200k+</span></div>' +

      '<div class="fl-sp-filters" style="margin:22px 0 0" role="group" aria-label="SumUp contract term">' +
        TERMS.map(function (t) {
          return '<button type="button" class="fl-sp-chip' + (t.id === 'payg' ? ' on' : '') +
                 '" data-term="' + t.id + '" data-press aria-pressed="' + (t.id === 'payg') + '">' + t.label + '</button>';
        }).join('') +
        '<span class="fl-meta fl-vibrant-dim" style="align-self:center;margin-left:6px">affects SumUp pricing</span>' +
      '</div>' +

      '<div class="fl-rx-rank" id="rxRank"></div>' +
      '<p class="fl-rx-note" id="rxNote"></p>';

    var elTurn = mount.querySelector('#rxTurn'), elPlus = mount.querySelector('#rxPlus'),
        elBest = mount.querySelector('#rxBest'), elWho = mount.querySelector('#rxWho'),
        elFill = mount.querySelector('#rxFill'), elHandle = mount.querySelector('#rxHandle'),
        elRank = mount.querySelector('#rxRank'), elTrack = mount.querySelector('#rxTrack'),
        elNote = mount.querySelector('#rxNote');

    /* ── chart geometry ────────────────────────────────────────────────── */
    var W = 700, H = 190, PAD_T = 18, PAD_B = 26;
    var R_MIN = 0.5, R_MAX = 1.55;
    /* High rate at the top, low rate at the bottom, so the line descends as
       turnover grows. Drawn the other way up it reads as "rates go up the
       more you take", which is the opposite of what the data says. */
    function ry(rate) { return PAD_T + (R_MAX - rate) / (R_MAX - R_MIN) * (H - PAD_T - PAD_B); }
    function rx(t) { return toPos(t) * W; }

    /* Sample the step functions densely enough that each band edge lands on
       a real vertical step — these are stepped tariffs, not smooth curves,
       and smoothing them would misrepresent the pricing. */
    function pathFor(fn) {
      var pts = [], i, t;
      for (i = 0; i <= 260; i++) {
        t = fromPos(i / 260);
        pts.push([rx(t), ry(fn(t))]);
      }
      var dstr = 'M' + pts[0][0].toFixed(1) + ',' + pts[0][1].toFixed(1);
      for (i = 1; i < pts.length; i++) {
        /* step-style: travel horizontally, then drop — the honest shape of a
           banded tariff. */
        dstr += 'L' + pts[i][0].toFixed(1) + ',' + pts[i - 1][1].toFixed(1) +
                'L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
      }
      return dstr;
    }

    var teyaPath = pathFor(teyaRate);
    mount.querySelector('#rxLine').setAttribute('d', teyaPath);
    mount.querySelector('#rxArea').setAttribute('d', teyaPath + 'L' + W + ',' + (H - PAD_B) + 'L0,' + (H - PAD_B) + 'Z');

    function renderAlt() {
      mount.querySelector('#rxLineAlt').setAttribute('d', pathFor(function (t) {
        return sumupRates(t)[TERMS.filter(function (x) { return x.id === term; })[0].idx];
      }));
    }
    renderAlt();

    /* grid + axis */
    (function () {
      var g = '', a = '', i;
      for (i = 0; i <= 4; i++) {
        var rate = R_MIN + (R_MAX - R_MIN) * (i / 4);
        var y = ry(rate);
        g += '<line x1="0" y1="' + y.toFixed(1) + '" x2="' + W + '" y2="' + y.toFixed(1) + '"/>';
        a += '<text class="fl-rx-axis" x="4" y="' + (y - 5).toFixed(1) + '">' + rate.toFixed(2) + '%</text>';
      }
      mount.querySelector('#rxGrid').innerHTML = g;
      mount.querySelector('#rxAxis').innerHTML = a;
    })();

    var elRule = mount.querySelector('#rxRule'), elDot = mount.querySelector('#rxDot');

    /* ── ticks on the track at each real band edge ─────────────────────── */
    (function () {
      var edges = [5000, 10000, 15000, 20000, 25000, 30000, 50000, 100000];
      mount.querySelector('#rxTicks').innerHTML = edges.map(function (e) {
        return '<i style="left:' + (toPos(e) * 100).toFixed(2) + '%"></i>';
      }).join('');
    })();

    /* ── ranking rows, animated with FLIP so a reorder is a movement ────── */
    var rowEls = {};

    /* Plemmo's recommendation is a commercial judgement, not just the
       smallest number — it weighs settlement speed, contract flexibility and
       support alongside the headline rate. It follows the documented logic in
       data/content.json and must not silently become "whatever sorts first",
       or the tool would contradict the advice the team actually gives. */
    function recommendedId(t) { return t < 10000 ? 'shift4' : 'teya'; }
    function recommendedWhy(t) {
      return t < 10000
        ? 'Best fit below £10k — no monthly rental and no contract'
        : 'Our first choice above £10k — instant or next-day settlement and flexible terms';
    }

    function rankData(t) {
      var s = sumupRates(t)[TERMS.filter(function (x) { return x.id === term; })[0].idx];
      var list = [
        { id: 'teya', name: 'Teya', rate: teyaRate(t),
          note: t >= 10000 ? '£15 + VAT monthly rental · flexible terms' : 'Best suited above £10k turnover' },
        { id: 'shift4', name: 'Shift4', rate: shift4Rate(t),
          note: t < 10000 ? 'No monthly rental · plus 25p next-day settlement' : 'No monthly rental' },
        { id: 'sumup', name: 'SumUp', rate: s,
          note: term === 'payg' ? 'No contract · terminal from £105 inc. VAT' :
                (term === 'm12' ? 'On a 12-month term' : 'On a 24-month term') }
      ];
      /* Sorted by rate because that is the honest, checkable ordering. The
         recommendation is flagged separately rather than being smuggled in
         by re-sorting. */
      list.sort(function (a, b) { return a.rate - b.rate; });
      var rec = recommendedId(t);
      list.forEach(function (p) { p.recommended = (p.id === rec); });
      return list;
    }

    function renderRank(t) {
      var list = rankData(t);
      var wp = worldpaySplit(t);

      /* FIRST: record where every existing row currently sits. */
      var firstTops = {};
      Object.keys(rowEls).forEach(function (k) {
        if (rowEls[k].isConnected) firstTops[k] = rowEls[k].getBoundingClientRect().top;
      });

      var html = list.map(function (p, i) {
        return '<div class="fl-rx-row' + (p.recommended ? ' best' : '') + '" data-id="' + p.id + '">' +
                 '<span class="pos">' + (i + 1) + '</span>' +
                 '<span><span class="nm">' + p.name +
                   (p.recommended ? '<b class="fl-rx-pick">Plemmo’s pick</b>' : '') +
                   (i === 0 && !p.recommended ? '<b class="fl-rx-low">Lowest rate</b>' : '') +
                 '</span><span class="nt">' +
                   (p.recommended ? recommendedWhy(t) : p.note) + '</span></span>' +
                 '<span class="rt">' + pc(p.rate) + '<small>' + (i === 0 ? 'lowest' : 'blended') + '</small></span>' +
               '</div>';
      }).join('');

      if (wp) {
        html += '<div class="fl-rx-row" data-id="worldpay">' +
                  '<span class="pos">—</span>' +
                  '<span><span class="nm">Worldpay</span><span class="nt">Split debit/credit pricing · £1 first year, then £29.50 + VAT</span></span>' +
                  '<span class="rt">' + wp.debit.toFixed(2) + '% / ' + wp.credit.toFixed(2) + '%' +
                  '<small>debit / credit</small></span>' +
                '</div>';
      }
      elRank.innerHTML = html;

      /* LAST + INVERT + PLAY: springs, so a row already in motion when the
         next reorder lands re-targets instead of jumping. */
      rowEls = {};
      Array.prototype.forEach.call(elRank.children, function (el) {
        var id = el.getAttribute('data-id');
        rowEls[id] = el;
        if (firstTops[id] == null || !F.motionOK()) return;
        var delta = firstTops[id] - el.getBoundingClientRect().top;
        if (!delta) return;
        var s = new F.Spring({ from: delta, response: 0.42, damping: 0.85 });
        s.onUpdate = function (v) { el.style.transform = 'translate3d(0,' + v.toFixed(2) + 'px,0)'; };
        s.onRest = function () { el.style.transform = ''; };
        s.to(0);
      });
    }

    /* ── note text ─────────────────────────────────────────────────────── */
    function renderNote(t) {
      var bits = ['All rates are indicative only and depend on business type, card mix, transaction profile, settlement option, provider approval and contract terms. Final pricing is confirmed after review.'];
      if (t < 10000) bits.unshift('Below £10k monthly turnover, Shift4 charges a flat 1.25% blended rate plus a 25p next-day settlement fee per transaction.');
      if (t >= 25000) bits.unshift('Worldpay prices debit and credit cards separately, so it has no single blended rate and is not ranked against the blended providers above.');
      elNote.textContent = bits.join(' ');
    }

    /* ── the one function that redraws everything ──────────────────────── */
    var lastTidy = null;
    function update(t, dragging) {
      t = Math.max(MIN, Math.min(MAX, t));
      var shown = tidy(t);
      var p = toPos(t);

      elTurn.textContent = gbp(shown);
      elPlus.textContent = shown >= MAX ? '+ /mo' : '/mo';
      elTrack.setAttribute('aria-valuenow', String(shown));
      elTrack.setAttribute('aria-valuetext', gbp(shown) + ' per month');

      elFill.style.width = 'calc(' + (p * 100).toFixed(3) + '% - 2px)';
      elHandle.style.left = (p * 100).toFixed(3) + '%';

      var x = rx(t);
      elRule.setAttribute('x1', x.toFixed(1)); elRule.setAttribute('x2', x.toFixed(1));
      elDot.setAttribute('cx', x.toFixed(1)); elDot.setAttribute('cy', ry(teyaRate(t)).toFixed(1));

      var list = rankData(t);
      elBest.textContent = pc(list[0].rate);
      elWho.textContent = list[0].name;

      /* Only rebuild the rows when the answer actually changes — rebuilding
         on every pointermove would fight the FLIP animation. */
      var key = list.map(function (x2) { return x2.id + x2.rate; }).join('|') + (worldpaySplit(t) ? 'w' : '');
      if (key !== lastTidy) {
        lastTidy = key;
        renderRank(t);
        renderNote(t);
        if (dragging) F.haptic(6);     /* a band edge is a real event */
      }
      turnover = t;
    }

    /* ── the gesture ───────────────────────────────────────────────────── */
    var scrub = new F.Scrubber(elTrack, {
      min: 0, max: 1, value: toPos(15000),
      onChange: function (p) { update(fromPos(Math.max(0, Math.min(1, p))), true); },
      onCommit: function (p) { update(fromPos(Math.max(0, Math.min(1, p))), false); }
    });

    /* contract term chips */
    Array.prototype.forEach.call(mount.querySelectorAll('[data-term]'), function (btn) {
      btn.addEventListener('click', function () {
        term = btn.getAttribute('data-term');
        Array.prototype.forEach.call(mount.querySelectorAll('[data-term]'), function (b) {
          var on = b === btn;
          b.classList.toggle('on', on);
          b.setAttribute('aria-pressed', String(on));
        });
        renderAlt();
        var legTerm = mount.querySelector('#rxLegTerm');
        if (legTerm) legTerm.textContent = TERMS.filter(function (x) { return x.id === term; })[0].label.toLowerCase();
        lastTidy = null;
        update(turnover, false);
        F.haptic(8);
      });
    });

    update(15000, false);

    /* Let other parts of the page read the current state (the quote modal
       pre-fills from it). */
    mount.getState = function () {
      var list = rankData(turnover);
      return { turnover: tidy(turnover), best: list[0], term: term };
    };
  }

  function init() {
    var mounts = d.querySelectorAll('[data-rate-explorer]');
    Array.prototype.forEach.call(mounts, build);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
