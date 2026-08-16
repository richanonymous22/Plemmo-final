/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · CARD MACHINE RECOMMENDATION ENGINE — public quiz + compare + lead
   ────────────────────────────────────────────────────────────────────────
   UI controller for pages/card-machine-recommendation.html. Reads config
   through store.js (so admin edits apply immediately) and delegates all
   recommendation logic to engine.js — this file only renders state and
   wires clicks. No provider name, rate or rule is hard-coded here.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── embeddable lookups ────────────────────────────────────────────────
     This module now runs on the service page (the "comparison page" the
     specification refers to) rather than a page of its own. Some elements it
     used to own there — hero copy, FAQ list, service-card grids — belong to
     the host page and may simply not exist.

     Writing to a missing element must not abort the module and take the
     whole quiz down with it, so member access goes through el(), which
     returns an inert stub and logs once. Bare getElementById() calls are
     left alone, because several are used as `if (!x) return` guards that
     must keep seeing null. */
  var _elMissing = {};
  var _elNoop = function () {};
  var _elStub = {
    innerHTML: '', textContent: '', value: '', disabled: false, checked: false,
    style: {}, dataset: {},
    classList: { add: _elNoop, remove: _elNoop, toggle: _elNoop, contains: function () { return false; } },
    addEventListener: _elNoop, removeEventListener: _elNoop, dispatchEvent: _elNoop,
    appendChild: _elNoop, removeChild: _elNoop, insertBefore: _elNoop, remove: _elNoop,
    setAttribute: _elNoop, removeAttribute: _elNoop, getAttribute: function () { return null; },
    querySelector: function () { return null; }, querySelectorAll: function () { return []; },
    closest: function () { return null; }, scrollIntoView: _elNoop,
    focus: _elNoop, blur: _elNoop, click: _elNoop, reset: _elNoop, submit: _elNoop
  };
  function el(id) {
    var e = document.getElementById(id);
    if (e) return e;
    if (!_elMissing[id]) {
      _elMissing[id] = 1;
      if (window.console && console.debug) console.debug('[plemmo] optional element #' + id + ' is not on this page');
    }
    return _elStub;
  }
  var STORE = window.PLEMMO_CME_STORE;
  var ENGINE = window.PLEMMO_CME_ENGINE;
  var CONFIG = STORE.getConfig();

  var body = document.getElementById('cmeBody');
  if (!body) return; /* not on this page */

  var answers = {
    categoryId: null, typeId: null, turnoverBandId: null, currentProviderId: null,
    charityNoRental: null, foodBeveragePaymentMethod: null
  };
  var stepIndex = 0;
  var lastResult = null;

  var CATEGORY_ICONS = {
    'food-beverage': 'ph:coffee-duotone',
    'retail': 'ph:storefront-duotone',
    'health-beauty-wellness': 'ph:scissors-duotone',
    'leisure-entertainment': 'ph:ticket-duotone',
    'services': 'ph:briefcase-duotone',
    'charity-non-profit': 'ph:heart-duotone'
  };
  var STEP_LABELS = {
    category: 'Category', type: 'Business type', turnover: 'Turnover',
    current: 'Current provider', charity: 'Rental', foodbev: 'Payments', result: 'Result'
  };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtPct(n) { return (typeof n === 'number') ? n.toFixed(2) + '%' : n; }
  function fmtMoney(n) { if (n == null) return null; var v = Number(n); return '£' + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, ''); }
  function fmtPence(n) { return (typeof n === 'number') ? (n * 100).toFixed(0) + 'p' : n; }

  function stepsList() {
    var steps = ['category', 'type', 'turnover', 'current'];
    var cat = ENGINE.findCategory(CONFIG, answers.categoryId);
    if (cat && cat.id === 'charity-non-profit') steps.push('charity');
    else if (cat && cat.id === 'food-beverage') steps.push('foodbev');
    steps.push('result');
    return steps;
  }

  function stepper() {
    var steps = stepsList();
    var strip = document.createElement('div');
    strip.className = 'cme-steps-strip';
    strip.innerHTML = steps.map(function (s, i) {
      var cls = i < stepIndex ? 'done' : (i === stepIndex ? 'active' : '');
      var n = i < stepIndex ? '<iconify-icon icon="ph:check-bold"></iconify-icon>' : (i + 1);
      return '<span class="cme-pill ' + cls + '"><span class="n">' + n + '</span>' + STEP_LABELS[s] + '</span>';
    }).join('');
    return strip;
  }

  function renderTiles(opts) {
    /* opts: {question, hint, tiles:[{v,l,i}], selected, compact, onPick} */
    body.innerHTML = '';
    body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'cme-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'cme-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div');
    grid.className = 'cme-tiles' + (opts.compact ? ' compact' : (opts.tiles.length <= 4 ? ' wide' : ''));
    if (opts.compact) grid.style.gridTemplateColumns = 'repeat(auto-fill,minmax(150px,1fr))';
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'cme-tile' + (opts.selected === t.v ? ' sel' : '');
      b.innerHTML = (t.i ? '<span class="ti"><iconify-icon icon="' + t.i + '"></iconify-icon></span>' : '') + '<span>' + esc(t.l) + '</span>';
      b.onclick = function () { opts.onPick(t.v); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    var foot = document.createElement('div'); foot.className = 'cme-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'cme-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back';
    back.disabled = stepIndex === 0;
    back.onclick = goBack;
    var meta = document.createElement('span'); meta.style.cssText = 'font-size:12px;color:var(--muted)';
    meta.textContent = 'No obligation · provider terms apply';
    foot.appendChild(back); foot.appendChild(meta);
    body.appendChild(foot);
  }

  function goBack() {
    if (stepIndex === 0) return;
    stepIndex--;
    el('results').style.display = 'none';
    el('lead-form').style.display = 'none';
    render();
  }

  function advance() { stepIndex++; render(); }

  function render() {
    var steps = stepsList();
    var step = steps[stepIndex];

    if (step === 'category') {
      renderTiles({
        question: 'What category best describes your business?',
        tiles: CONFIG.categories.map(function (c) { return { v: c.id, l: c.name, i: CATEGORY_ICONS[c.id] || 'ph:briefcase-duotone' }; }),
        selected: answers.categoryId,
        onPick: function (v) {
          if (v !== answers.categoryId) { answers.typeId = null; answers.charityNoRental = null; answers.foodBeveragePaymentMethod = null; }
          answers.categoryId = v; stepIndex = 1; render();
        }
      });
    } else if (step === 'type') {
      var cat = ENGINE.findCategory(CONFIG, answers.categoryId);
      renderTiles({
        question: 'Which best matches your business type?',
        hint: cat ? cat.name : '',
        compact: true,
        tiles: (cat ? cat.types : []).map(function (t) { return { v: t.id, l: t.name }; }),
        selected: answers.typeId,
        onPick: function (v) { answers.typeId = v; advance(); }
      });
    } else if (step === 'turnover') {
      renderTiles({
        question: 'What is your monthly card turnover?',
        compact: true,
        tiles: CONFIG.turnoverBands.map(function (b) { return { v: b.id, l: b.label }; }),
        selected: answers.turnoverBandId,
        onPick: function (v) { answers.turnoverBandId = v; advance(); }
      });
    } else if (step === 'current') {
      renderTiles({
        question: 'Do you currently use a card machine provider?',
        hint: "We'll never recommend the provider you're already using.",
        compact: true,
        tiles: CONFIG.currentProviderOptions.map(function (p) { return { v: p.id, l: p.label }; }),
        selected: answers.currentProviderId,
        onPick: function (v) { answers.currentProviderId = v; advance(); }
      });
    } else if (step === 'charity') {
      renderTiles({
        question: CONFIG.rules.charity.question.text,
        tiles: [{ v: 'yes', l: 'Yes' }, { v: 'no', l: 'No' }],
        selected: answers.charityNoRental === true ? 'yes' : (answers.charityNoRental === false ? 'no' : null),
        onPick: function (v) { answers.charityNoRental = (v === 'yes'); advance(); }
      });
    } else if (step === 'foodbev') {
      renderTiles({
        question: CONFIG.rules.foodBeverage.question.text,
        tiles: CONFIG.rules.foodBeverage.question.options.map(function (o) { return { v: o.id, l: o.label }; }),
        selected: answers.foodBeveragePaymentMethod,
        onPick: function (v) { answers.foodBeveragePaymentMethod = v; advance(); }
      });
    } else if (step === 'result') {
      body.innerHTML = '';
      body.appendChild(stepper());
      var wrap = document.createElement('div');
      wrap.innerHTML = '<div class="cme-q" style="margin-bottom:6px">Generating your suggested providers…</div>';
      body.appendChild(wrap);
      var foot = document.createElement('div'); foot.className = 'cme-foot';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'cme-back';
      back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
      foot.appendChild(back);
      body.appendChild(foot);
      /* instant — no page refresh */
      setTimeout(showResult, 120);
    }
  }

  /* ── RESULT / COMPARISON CARDS ── */
  function providerLogoBlock(provider) {
    if (provider.logo) {
      return '<div class="plogo-c"><img loading="lazy" decoding="async" src="' + provider.logo + '" alt="' + esc(provider.name) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\'"><span class="wordmark" style="display:none">' + esc(provider.name) + '</span></div>';
    }
    return '<div class="plogo-c"><span class="wordmark">' + esc(provider.name) + '</span></div>';
  }

  function cardRatesHTML(item) {
    var p = item.pricing, rows = '';
    if (p.pricingType === 'blended') {
      if (p.blendedRate != null) rows += rateRow('Blended rate', fmtPct(p.blendedRate));
      else rows += rateRow('Blended rate', 'Contact for quote');
      if (p.terminalOptions) {
        rows += rateRow('Terminal', p.terminalOptions.map(function (t) {
          return t.oneOff ? (fmtMoney(t.amount) + (t.vatExclusive ? ' + VAT (' + t.label + ')' : ' (' + t.label + ')'))
            : (fmtMoney(t.amount) + '/' + t.unit + ' (' + t.label + ')');
        }).join(' or '));
      }
      if (p.rentalNote) rows += rateRow('Monthly rental', p.rentalNote);
      if (p.settlementFee) rows += rateRow(p.settlementFee.label, fmtMoney(p.settlementFee.amount) + ' ' + p.settlementFee.unit);
      if (p.hardwareOptions) rows += rateRow('Hardware', p.hardwareOptions.join(' · '));
      if (p.contractOptions) rows += rateRow('Contract', p.contractOptions.join(' · '));
    } else {
      if (p.debit != null) rows += rateRow('Debit', typeof p.debit === 'number' ? fmtPct(p.debit) : p.debit);
      if (p.credit != null) rows += rateRow('Credit', typeof p.credit === 'number' ? fmtPct(p.credit) : p.credit);
      if (p.authorisationFee != null) rows += rateRow('Authorisation fee', fmtPence(p.authorisationFee));
      if (p.rentalPromo) rows += rateRow('Rental', p.rentalPromo.label + ' — then ' + fmtMoney(p.rentalPromo.revertsTo) + '/mo');
      else if (p.rental != null) rows += rateRow('Rental', fmtMoney(p.rental) + '/mo');
      else if (p.rentalNote) rows += rateRow('Rental', p.rentalNote);
      if (p.deviceOptions) rows += rateRow('Devices', p.deviceOptions.join(' · '));
    }
    return rows;
  }
  function rateRow(label, value) {
    return '<div class="cme-rate-row"><span>' + esc(label) + '</span><b>' + esc(value) + '</b></div>';
  }

  function renderCard(item, rank) {
    var provider = item.provider, p = item.pricing;
    var model = p.pricingType === 'blended' ? 'Blended Rate' : 'Split Rate';
    /* Full feature list; the disclosure folds the tail. */
    var features = (p.features || []).map(function (f) {
      return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(f) + '</li>';
    }).join('');
    return '<div class="cme-card' + (rank === 1 ? ' top' : '') + '">'
      + (rank === 1 ? '<span class="cme-rank">Top suggestion</span>' : '')
      + providerLogoBlock(provider)
      + '<span class="cme-model">' + model + '</span>'
      + '<div class="cme-rates">' + cardRatesHTML(item) + '</div>'
      + '<ul>' + features + '</ul>'
      + '<div class="cme-card-btns">'
      + '<button type="button" class="btn btn-primary" data-apply="' + provider.id + '">Apply Now <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></button>'
      + '<button type="button" class="btn btn-ghost" data-callback="' + provider.id + '">Request Callback</button>'
      + '</div></div>';
  }

  function showResult() {
    lastResult = ENGINE.recommend(CONFIG, answers);
    var resultsSection = document.getElementById('results');
    var resultsBody = document.getElementById('resultsBody');
    var resultsHeading = document.getElementById('resultsHeading');
    var recDisc = document.getElementById('recommendationDisclaimer');
    recDisc.textContent = CONFIG.recommendationDisclaimer;

    if (lastResult.fallback || !lastResult.providers.length) {
      resultsHeading.textContent = 'Suggested Provider';
      resultsBody.innerHTML = '<div class="cme-fallback"><iconify-icon icon="ph:headset-duotone"></iconify-icon>'
        + '<h3>Please contact us for a personalised quote</h3>'
        + '<p>We couldn’t automatically match a provider from the answers given — a Plemmo specialist will review your details and follow up directly. You can still send your details below.</p></div>';
      if (STORE) STORE.appendAudit('engine', 'No-match fallback shown for ' + (answers.categoryId || 'unknown category') + ' / ' + (answers.typeId || 'unknown type'));
    } else {
      resultsHeading.textContent = 'Suggested Providers';
      resultsBody.innerHTML = '<div class="cme-grid">' + lastResult.providers.map(function (item, i) { return renderCard(item, i + 1); }).join('') + '</div>';
    }
    resultsSection.style.display = '';
    wireCardButtons();
    prepareLeadForm();
    showDoneState(lastResult.fallback || !lastResult.providers.length);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showDoneState(wasFallback) {
    body.innerHTML = '';
    body.appendChild(stepper());
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="cme-q" style="margin-bottom:8px">'
      + (wasFallback ? "We've got your answers" : 'Your suggested providers are ready') + '</div>'
      + '<div class="cme-hint" style="margin-bottom:18px">Scroll down to compare' + (wasFallback ? '' : ' and continue') + ', or start again with different answers.</div>';
    body.appendChild(wrap);
    var foot = document.createElement('div'); foot.className = 'cme-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'cme-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
    var restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn btn-ghost';
    restart.innerHTML = 'Start over <iconify-icon icon="ph:arrow-clockwise-bold"></iconify-icon>';
    restart.onclick = function () {
      answers = { categoryId: null, typeId: null, turnoverBandId: null, currentProviderId: null, charityNoRental: null, foodBeveragePaymentMethod: null };
      stepIndex = 0; lastResult = null;
      el('results').style.display = 'none';
      el('lead-form').style.display = 'none';
      render();
      el('engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    foot.appendChild(back); foot.appendChild(restart);
    body.appendChild(foot);
  }

  function wireCardButtons() {
    document.querySelectorAll('[data-apply]').forEach(function (b) {
      b.onclick = function () { openLeadForm(b.getAttribute('data-apply'), 'apply'); };
    });
    document.querySelectorAll('[data-callback]').forEach(function (b) {
      b.onclick = function () { openLeadForm(b.getAttribute('data-callback'), 'callback'); };
    });
  }

  function labelFor(list, id) {
    var found = null;
    (list || []).forEach(function (o) { if (o.id === id) found = o.label || o.name; });
    return found || id;
  }

  function prepareLeadForm() {
    var leadSection = document.getElementById('lead-form');
    var cat = ENGINE.findCategory(CONFIG, answers.categoryId);
    var type = ENGINE.findType(cat, answers.typeId);
    var turnoverLabel = labelFor(CONFIG.turnoverBands, answers.turnoverBandId);
    var currentLabel = labelFor(CONFIG.currentProviderOptions, answers.currentProviderId);
    el('cmeRecap').innerHTML = [
      cat ? cat.name : '', type ? type.name : '', turnoverLabel,
      'Current: ' + currentLabel
    ].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    el('leadCategory').value = cat ? cat.name : '';
    el('leadType').value = type ? type.name : '';
    el('leadTurnover').value = turnoverLabel;
    el('leadCurrent').value = currentLabel;
    leadSection.style.display = 'none'; /* revealed once a card CTA or fallback CTA is used */
    if (lastResult && lastResult.fallback) {
      /* Fallback still allows lead submission — show the form directly. */
      el('leadRecommended').value = 'Not matched — manual review requested';
      leadSection.style.display = '';
    }
  }

  function openLeadForm(providerId, intent) {
    var provider = CONFIG.providers[providerId];
    el('leadRecommended').value = (provider ? provider.name : providerId) + (intent === 'callback' ? ' (callback requested)' : ' (apply now)');
    var notesField = document.getElementById('leadNotes');
    if (!notesField.value) notesField.value = intent === 'callback'
      ? 'Please call me back about ' + (provider ? provider.name : 'this recommendation') + '.'
      : 'I would like to apply for ' + (provider ? provider.name : 'this recommendation') + '.';
    var leadSection = document.getElementById('lead-form');
    leadSection.style.display = '';
    leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var f = document.getElementById('leadBusinessName'); if (f) setTimeout(function () { f.focus(); }, 400);
  }

  /* ── LEAD FORM SUBMIT ── */
  var leadForm = document.getElementById('cmeLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var recommendedIds = lastResult && !lastResult.fallback ? lastResult.providers.map(function (p) { return p.provider.name; }) : [];
      var lead = {
        businessName: el('leadBusinessName').value,
        contactName: el('leadContactName').value,
        mobile: el('leadMobile').value,
        email: el('leadEmail').value,
        categoryId: answers.categoryId, typeId: answers.typeId,
        turnoverBandId: answers.turnoverBandId, currentProviderId: answers.currentProviderId,
        recommendedProviderIds: recommendedIds,
        recommendedChoice: el('leadRecommended').value,
        notes: el('leadNotes').value,
        needsReview: !!(lastResult && lastResult.fallback)
      };
      STORE.addLead(lead);

      var fd = new FormData(leadForm);
      fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (lead.email) fd.append('_replyto', lead.email);
      fetch(CONFIG.leadSubmitEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (res) { if (!res.ok) throw new Error('fail'); leadForm.style.display = 'none'; el('cmeLeadOk').style.display = 'block'; el('cmeLeadOk').scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .catch(function () {
          /* Lead is already saved locally — still confirm to the user, but let them know to call if email failed. */
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          alert('Your details were saved, but we could not send the confirmation email. Please call us on 0333 041 1161 to make sure we have your enquiry.');
        });
    });
  }

  /* ── GENERAL PRICING DISCLAIMER (section 13, sitewide on this module) ── */
  var gd = document.getElementById('generalDisclaimer');
  if (gd) {
    gd.innerHTML = '<p><b style="color:#5f9000">Pricing disclaimer.</b> ' + esc(CONFIG.generalDisclaimer.text) + ' Additional charges that may apply and are not included in the rates shown:</p>'
      + '<ul>' + CONFIG.generalDisclaimer.extraCharges.map(function (c) { return '<li>' + esc(c) + '</li>'; }).join('') + '</ul>';
  }

  render();
})();
