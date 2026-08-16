/* ==========================================================================
   PLEMMO — rate-explorer.js

   An indicative blended-rate illustration for the card machines page.

   Two rules govern this component, both from the owner specification:

   1. It reads every rate from the card machine engine's config
      (PLEMMO_CME_CONFIG). Pricing must live in exactly one place that the
      admin panel can edit — spec §12/§86, "do not scatter the business
      rules throughout frontend components". An earlier version of this file
      carried its own copy of the rate tables and silently went out of date
      against the engine.

   2. It does NOT rank or recommend providers. Spec §13 Rule 3 is explicit
      that recommendation must weigh business category, turnover, current
      provider and required features rather than sorting on transaction
      rate, and §90 forbids changing provider priority. Ordering providers
      by lowest rate here would contradict the recommendation engine two
      sections down the same page. This shows published blended rates as a
      factual illustration and sends the visitor to the engine for an actual
      recommendation.
   ========================================================================== */
(function (w, d) {
  'use strict';

  var F = w.Fluid;
  if (!F) return;

  var MIN = 3000, MAX = 200000;

  /* Log scale: on a linear axis everything under £40k is crushed into the
     left tenth of the track, which is where most businesses are. */
  function toPos(t) { return (Math.log(t) - Math.log(MIN)) / (Math.log(MAX) - Math.log(MIN)); }
  function fromPos(p) { return Math.exp(Math.log(MIN) + p * (Math.log(MAX) - Math.log(MIN))); }
  function gbp(n) { return '£' + Math.round(n).toLocaleString('en-GB'); }
  function pc(r) { return r.toFixed(2) + '%'; }
  function tidy(t) {
    if (t < 10000) return Math.round(t / 500) * 500;
    if (t < 50000) return Math.round(t / 1000) * 1000;
    return Math.round(t / 5000) * 5000;
  }

  function build(mount) {
    var CFG = w.PLEMMO_CME_CONFIG, ENG = w.PLEMMO_CME_ENGINE;
    if (!CFG || !CFG.providers || !ENG) {
      /* Without the config there are no rates to show, and inventing them is
         not an option. Leave the section out rather than display a figure
         that isn't the owner's. */
      mount.style.display = 'none';
      return;
    }

    var teya = CFG.providers.teya, shift4 = CFG.providers.shift4;
    var teyaTable = (teya && teya.blendedRateTable) || [];

    /* Rate lookups reuse the ENGINE's own band lookup, not just its data.
       Reimplementing the lookup is how this component went wrong before: the
       published table has deliberate gaps (nothing listed for £35k-£40k or
       £60k-£70k) and the owner's rule is that a rate holds until the next
       band starts. A naive `t >= min && t < max` test returns null in those
       gaps and shows "On request" for turnovers that do have a rate.
       PLEMMO_CME_ENGINE.lookupBand carries the rate forward, and using it
       keeps this illustration and the recommendation engine in agreement by
       construction. */
    function teyaRate(t) {
      if (t < 10000) return null;     /* Teya's table starts at £10k */
      var row = ENG.lookupBand(teyaTable, t);
      return row ? row.rate : null;
    }
    function shift4Rate(t) {
      if (!shift4) return null;
      return t < 10000 ? shift4.blendedRateBelow10k : shift4.blendedRateFrom10k;
    }

    var turnover = 15000;

    mount.className = 'fl-rx';
    mount.innerHTML =
      '<div class="fl-rx-top">' +
        '<div class="fl-rx-turn">' +
          '<span class="lbl">Monthly card turnover</span>' +
          '<div class="val"><span id="rxTurn">£15,000</span><em id="rxPlus">/mo</em></div>' +
        '</div>' +
        '<div class="fl-rx-headline">' +
          '<span class="lbl">Estimated Monthly Cost</span>' +
          '<div class="rate" id="rxCost">£150</div>' +
          '<span class="who" id="rxCostNote">on Teya’s indicative blended rate</span>' +
        '</div>' +
      '</div>' +

      '<div class="fl-rx-chart">' +
        '<svg id="rxSvg" viewBox="0 0 700 190" preserveAspectRatio="none" aria-hidden="true">' +
          '<defs><linearGradient id="flRxGrad" x1="0" y1="0" x2="0" y2="1">' +
            '<stop offset="0%" stop-color="rgba(198,255,0,.24)"/>' +
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
        '<span><i class="k-sumup"></i>Shift4 blended rate</span>' +
        '<span class="fl-rx-legend-hint"><iconify-icon icon="ph:hand-swipe-left-duotone"></iconify-icon> drag to your turnover</span>' +
      '</div>' +

      '<div class="fl-rx-track" id="rxTrack" tabindex="0" role="slider" ' +
           'aria-label="Monthly card turnover" aria-valuemin="' + MIN + '" aria-valuemax="' + MAX + '" aria-valuenow="15000">' +
        '<div class="fl-rx-fill" id="rxFill"></div>' +
        '<div class="fl-rx-ticks" id="rxTicks"></div>' +
        '<div class="fl-rx-handle" id="rxHandle"><iconify-icon icon="ph:arrows-left-right-bold"></iconify-icon></div>' +
      '</div>' +
      '<div class="fl-rx-scale"><span>£3k</span><span>£10k</span><span>£30k</span><span>£80k</span><span>£200k+</span></div>' +

      '<div class="fl-rx-rates" id="rxRates"></div>' +

      /* Not a recommendation — the engine makes those, using the owner's rules. */
      '<div class="fl-rx-next">' +
        '<div>' +
          '<strong>These are published blended rates, not a recommendation.</strong>' +
          '<p>Which provider actually suits you depends on your business type, turnover, ' +
          'how you take payments and who you are with today. Answer a few questions and ' +
          'we’ll show suitable providers in order.</p>' +
        '</div>' +
        '<a class="btn btn-primary" href="card-machine-recommendation.html">' +
          'Find my provider <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></a>' +
      '</div>' +

      '<p class="fl-rx-note" id="rxNote"></p>';

    var elTurn = mount.querySelector('#rxTurn'), elPlus = mount.querySelector('#rxPlus'),
        elCost = mount.querySelector('#rxCost'), elCostNote = mount.querySelector('#rxCostNote'),
        elFill = mount.querySelector('#rxFill'), elHandle = mount.querySelector('#rxHandle'),
        elRates = mount.querySelector('#rxRates'), elTrack = mount.querySelector('#rxTrack'),
        elNote = mount.querySelector('#rxNote');

    /* ── chart geometry ────────────────────────────────────────────────── */
    var W = 700, H = 190, PAD_T = 18, PAD_B = 26;
    var R_MIN = 0.5, R_MAX = 1.55;
    /* High rate at the top so the line descends as turnover grows. Drawn the
       other way up it reads as "rates go up the more you take". */
    function ry(rate) { return PAD_T + (R_MAX - rate) / (R_MAX - R_MIN) * (H - PAD_T - PAD_B); }
    function rx(t) { return toPos(t) * W; }

    /* Banded tariffs are step functions. Drawing them as a smooth curve
       would imply rates the owner never published. */
    function pathFor(fn) {
      var pts = [], i, t, r;
      for (i = 0; i <= 260; i++) {
        t = fromPos(i / 260);
        r = fn(t);
        pts.push(r == null ? null : [rx(t), ry(r)]);
      }
      var dstr = '', prev = null;
      for (i = 0; i < pts.length; i++) {
        if (!pts[i]) { prev = null; continue; }      /* gap in the table — break the line */
        if (!prev) { dstr += 'M' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1); }
        else {
          dstr += 'L' + pts[i][0].toFixed(1) + ',' + prev[1].toFixed(1) +
                  'L' + pts[i][0].toFixed(1) + ',' + pts[i][1].toFixed(1);
        }
        prev = pts[i];
      }
      return dstr;
    }

    var teyaPath = pathFor(teyaRate);
    mount.querySelector('#rxLine').setAttribute('d', teyaPath);
    mount.querySelector('#rxArea').setAttribute('d', teyaPath ? teyaPath + 'L' + W + ',' + (H - PAD_B) + 'L0,' + (H - PAD_B) + 'Z' : '');
    mount.querySelector('#rxLineAlt').setAttribute('d', pathFor(shift4Rate));

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

    /* Ticks at the real turnover-band edges the engine uses. */
    (function () {
      var edges = (CFG.turnoverBands || []).map(function (b) { return b.lookupValue; })
        .filter(function (v) { return v > MIN && v < MAX; });
      mount.querySelector('#rxTicks').innerHTML = edges.map(function (e) {
        return '<i style="left:' + (toPos(e) * 100).toFixed(2) + '%"></i>';
      }).join('');
    })();

    /* ── rate rows: displayed in a fixed provider order, never re-sorted ── */
    function renderRates(t) {
      var rows = [
        { name: (teya && teya.name) || 'Teya', rate: teyaRate(t),
          note: 'Blended · £15/month rental or £139 + VAT terminal buyout' },
        { name: (shift4 && shift4.name) || 'Shift4', rate: shift4Rate(t),
          note: 'Blended · no monthly rental for one terminal' +
                (t < 10000 ? ' · plus 25p next-day settlement per payout' : '') }
      ];
      elRates.innerHTML = rows.map(function (p) {
        return '<div class="fl-rx-row" data-id="' + p.name + '">' +
                 '<span><span class="nm">' + p.name + '</span><span class="nt">' + p.note + '</span></span>' +
                 '<span class="rt">' +
                   (p.rate == null ? '<span class="fl-rx-quote">On request</span>' : pc(p.rate)) +
                   '<small>' + (p.rate == null ? 'not published for this turnover' : 'indicative blended') + '</small>' +
                 '</span>' +
               '</div>';
      }).join('');
    }

    function renderNote(t) {
      /* Both disclaimers are required by the owner specification and must
         not be dropped or reworded. */
      var bits = ['Rates shown are indicative only and subject to business type, turnover, card mix, provider approval and contract terms.'];
      bits.push('The pricing shown is indicative only and subject to underwriting and approval. Additional charges may apply, including PCI compliance and non-compliance fees, faster settlement charges, monthly account fees, gateway or virtual terminal fees, and other provider-specific fees and charges.');
      if (teyaRate(t) == null) {
        bits.push('Teya’s rates start at £10,000 monthly card turnover — below that we’ll recommend a provider that suits your level.');
      }
      elNote.textContent = bits.join(' ');
    }

    /* ── redraw ────────────────────────────────────────────────────────── */
    var lastKey = null;
    function update(t) {
      t = Math.max(MIN, Math.min(MAX, t));
      var shown = tidy(t);
      var p = toPos(t);

      elTurn.textContent = gbp(shown);
      elPlus.textContent = shown >= MAX ? '+ /mo' : '/mo';
      elTrack.setAttribute('aria-valuenow', String(shown));
      elTrack.setAttribute('aria-valuetext', gbp(shown) + ' per month');

      elFill.style.width = 'calc(' + (p * 100).toFixed(3) + '% - 2px)';
      elHandle.style.left = (p * 100).toFixed(3) + '%';

      var tr = teyaRate(t);
      var x = rx(t);
      elRule.setAttribute('x1', x.toFixed(1)); elRule.setAttribute('x2', x.toFixed(1));
      if (tr == null) { elDot.setAttribute('r', '0'); }
      else { elDot.setAttribute('r', '6'); elDot.setAttribute('cx', x.toFixed(1)); elDot.setAttribute('cy', ry(tr).toFixed(1)); }

      if (tr == null) {
        elCost.textContent = 'On request';
        elCostNote.textContent = 'Teya has no published rate at this turnover';
      } else {
        elCost.textContent = gbp(shown * tr / 100);
        elCostNote.textContent = 'on Teya’s indicative blended rate of ' + pc(tr);
      }

      var key = String(tr) + '|' + String(shift4Rate(t));
      if (key !== lastKey) { lastKey = key; renderRates(t); renderNote(t); }
      turnover = t;
    }

    new F.Scrubber(elTrack, {
      min: 0, max: 1, value: toPos(15000),
      onChange: function (v) { update(fromPos(Math.max(0, Math.min(1, v)))); },
      onCommit: function (v) { update(fromPos(Math.max(0, Math.min(1, v)))); }
    });

    update(15000);
    mount.getState = function () { return { turnover: tidy(turnover) }; };
  }

  function init() {
    Array.prototype.forEach.call(d.querySelectorAll('[data-rate-explorer]'), build);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init);
  else init();

})(window, document);
