/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS FINANCE & FUNDING — public qualification + results + lead
   ────────────────────────────────────────────────────────────────────────
   UI controller for pages/business-finance-recommendation.html.
   Independent from every other recommendation module — no shared code.
   Never renders a lender name, a rate/APR, or a calculated repayment
   figure; every card links to a single generic "Enquire Now" action.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_FINANCE_STORE;
  var ENGINE = window.PLEMMO_FINANCE_ENGINE;
  var CONFIG = STORE.getConfig();

  var body = document.getElementById('fnBody');
  if (!body) return;

  var answers = { fundingAmountId: null, fundingPurposeId: null, businessTypeId: null, businessSectorId: null, turnoverBandId: null, timeTradingId: null };
  var stepIndex = 0;
  var lastResult = null;
  var STEPS = ['amount', 'purpose', 'biztype', 'sector', 'turnover', 'trading', 'result'];
  var STEP_LABELS = { amount: 'Amount', purpose: 'Purpose', biztype: 'Business type', sector: 'Sector', turnover: 'Turnover', trading: 'Time trading', result: 'Result' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── static content from config (hero, notice, why-choose, FAQ) ── */
  document.getElementById('heroHeadline').textContent = CONFIG.hero.headline;
  document.getElementById('heroSub').textContent = CONFIG.hero.subheading;
  document.getElementById('heroPrimaryBtn').innerHTML = esc(CONFIG.hero.primaryBtn) + ' <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon>';
  document.getElementById('heroSecondaryBtn').textContent = CONFIG.hero.secondaryBtn;
  document.getElementById('noticeText').textContent = CONFIG.mandatoryNotice;
  document.getElementById('noticeText2').textContent = CONFIG.mandatoryNotice;
  document.getElementById('whyChooseGrid').innerHTML = CONFIG.whyChoose.map(function (w) {
    return '<div class="card benchc rv" style="padding:20px"><div class="bi"><iconify-icon icon="' + esc(w.icon) + '"></iconify-icon></div><strong>' + esc(w.title) + '</strong><span>' + esc(w.text) + '</span></div>';
  }).join('');
  document.getElementById('faqList').innerHTML = CONFIG.faqs.map(function (f) {
    return '<div class="faq"><div class="faq-q">' + esc(f.q) + ' <iconify-icon icon="ph:plus-bold"></iconify-icon></div><div class="faq-a"><p>' + esc(f.a) + '</p></div></div>';
  }).join('');

  function stepper() {
    var strip = document.createElement('div'); strip.className = 'fn-steps-strip';
    strip.innerHTML = STEPS.map(function (s, i) {
      var cls = i < stepIndex ? 'done' : (i === stepIndex ? 'active' : '');
      var n = i < stepIndex ? '<iconify-icon icon="ph:check-bold"></iconify-icon>' : (i + 1);
      return '<span class="fn-pill ' + cls + '"><span class="n">' + n + '</span>' + STEP_LABELS[s] + '</span>';
    }).join('');
    return strip;
  }

  function renderTiles(opts) {
    body.innerHTML = ''; body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'fn-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'fn-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'fn-tiles';
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'fn-tile' + (opts.selected === t.v ? ' sel' : '');
      b.textContent = t.l;
      b.onclick = function () { opts.onPick(t.v); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    var foot = document.createElement('div'); foot.className = 'fn-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'fn-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.disabled = stepIndex === 0; back.onclick = goBack;
    var meta = document.createElement('span'); meta.style.cssText = 'font-size:12px;color:var(--muted)'; meta.textContent = 'No obligation · Plemmo is an introducer, not a lender';
    foot.appendChild(back); foot.appendChild(meta); body.appendChild(foot);
  }

  function goBack() {
    if (stepIndex === 0) return;
    stepIndex--;
    document.getElementById('results').style.display = 'none';
    document.getElementById('lead-form').style.display = 'none';
    render();
  }
  function advance() { stepIndex++; render(); }

  function render() {
    var step = STEPS[stepIndex];
    if (step === 'amount') {
      renderTiles({ question: 'How much funding are you looking for?', tiles: CONFIG.fundingAmountBands.map(function (b) { return { v: b.id, l: b.label }; }), selected: answers.fundingAmountId, onPick: function (v) { answers.fundingAmountId = v; advance(); } });
    } else if (step === 'purpose') {
      renderTiles({ question: "What's the funding for?", tiles: CONFIG.fundingPurposes.map(function (p) { return { v: p.id, l: p.name }; }), selected: answers.fundingPurposeId, onPick: function (v) { answers.fundingPurposeId = v; advance(); } });
    } else if (step === 'biztype') {
      renderTiles({ question: 'What type of business are you?', tiles: CONFIG.businessTypes.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.businessTypeId, onPick: function (v) { answers.businessTypeId = v; advance(); } });
    } else if (step === 'sector') {
      renderTiles({ question: 'Which sector best describes your business?', tiles: CONFIG.businessSectors.map(function (s) { return { v: s.id, l: s.name }; }), selected: answers.businessSectorId, onPick: function (v) { answers.businessSectorId = v; advance(); } });
    } else if (step === 'turnover') {
      renderTiles({ question: 'What is your annual turnover?', tiles: CONFIG.turnoverBands.map(function (t) { return { v: t.id, l: t.label }; }), selected: answers.turnoverBandId, onPick: function (v) { answers.turnoverBandId = v; advance(); } });
    } else if (step === 'trading') {
      renderTiles({ question: 'How long have you been trading?', tiles: CONFIG.timeTradingBands.map(function (t) { return { v: t.id, l: t.label }; }), selected: answers.timeTradingId, onPick: function (v) { answers.timeTradingId = v; advance(); } });
    } else if (step === 'result') {
      body.innerHTML = ''; body.appendChild(stepper());
      var wrap = document.createElement('div'); wrap.innerHTML = '<div class="fn-q" style="margin-bottom:6px">Finding suitable funding products…</div>';
      body.appendChild(wrap);
      var foot = document.createElement('div'); foot.className = 'fn-foot';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'fn-back';
      back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
      foot.appendChild(back); body.appendChild(foot);
      setTimeout(showResult, 120); /* instant — no page refresh */
    }
  }

  function renderCard(product, rank) {
    return '<div class="fn-card' + (rank === 1 ? ' top' : '') + '">'
      + (rank === 1 ? '<span class="fn-rank">Top suggestion</span>' : '')
      + '<h3>' + esc(product.name) + '</h3>'
      + '<div class="fn-facts">'
      + '<div class="fn-fact"><span>Suitable for</span><b>' + esc(product.suitableFor) + '</b></div>'
      + '<div class="fn-fact"><span>Typical funding range</span><b>' + esc(product.range) + '</b></div>'
      + '<div class="fn-fact"><span>Typical repayment term</span><b>' + esc(product.term) + '</b></div>'
      + '</div>'
      + '<p class="desc">' + esc(product.description) + '</p>'
      + '<button type="button" class="btn btn-primary" data-enquire="' + product.id + '">Enquire Now <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></button>'
      + '</div>';
  }

  function showResult() {
    lastResult = ENGINE.recommend(CONFIG, answers);
    var resultsSection = document.getElementById('results');
    var resultsBody = document.getElementById('resultsBody');
    var resultsHeading = document.getElementById('resultsHeading');

    if (lastResult.fallback || !lastResult.products.length) {
      resultsHeading.textContent = 'Suggested Finance Product';
      resultsBody.innerHTML = '<div class="fn-fallback"><iconify-icon icon="ph:headset-duotone"></iconify-icon>'
        + '<h3>Please contact us for a personalised funding conversation</h3>'
        + '<p>We couldn’t automatically suggest a product from the answers given — a Plemmo specialist will review your enquiry directly. You can still send your details below.</p></div>';
      STORE.appendAudit('engine', 'No-match fallback shown for purpose ' + (answers.fundingPurposeId || 'unknown'));
    } else {
      resultsHeading.textContent = 'Suggested Finance Products';
      resultsBody.innerHTML = '<div class="fn-grid">' + lastResult.products.map(function (p, i) { return renderCard(p, i + 1); }).join('') + '</div>';
    }
    resultsSection.style.display = '';
    document.querySelectorAll('[data-enquire]').forEach(function (b) { b.onclick = function () { openLeadForm(b.getAttribute('data-enquire')); }; });
    prepareLeadForm();
    showDoneState(lastResult.fallback || !lastResult.products.length);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showDoneState(wasFallback) {
    body.innerHTML = ''; body.appendChild(stepper());
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="fn-q" style="margin-bottom:8px">' + (wasFallback ? "We've got your answers" : 'Your suggested funding products are ready') + '</div>'
      + '<div class="fn-hint" style="margin-bottom:18px">Scroll down to compare' + (wasFallback ? '' : ' and continue') + ', or start again with different answers.</div>';
    body.appendChild(wrap);
    var foot = document.createElement('div'); foot.className = 'fn-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'fn-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
    var restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn btn-ghost';
    restart.innerHTML = 'Start over <iconify-icon icon="ph:arrow-clockwise-bold"></iconify-icon>';
    restart.onclick = function () {
      answers = { fundingAmountId: null, fundingPurposeId: null, businessTypeId: null, businessSectorId: null, turnoverBandId: null, timeTradingId: null };
      stepIndex = 0; lastResult = null;
      document.getElementById('results').style.display = 'none';
      document.getElementById('lead-form').style.display = 'none';
      render();
      document.getElementById('engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    foot.appendChild(back); foot.appendChild(restart); body.appendChild(foot);
  }

  function labelFor(list, id, key) { var found = null; (list || []).forEach(function (o) { if (o.id === id) found = o[key || 'name']; }); return found || id; }

  function prepareLeadForm() {
    var leadSection = document.getElementById('lead-form');
    var amountLabel = labelFor(CONFIG.fundingAmountBands, answers.fundingAmountId, 'label');
    var purposeLabel = labelFor(CONFIG.fundingPurposes, answers.fundingPurposeId);
    var bizTypeLabel = labelFor(CONFIG.businessTypes, answers.businessTypeId);
    var sectorLabel = labelFor(CONFIG.businessSectors, answers.businessSectorId);
    var turnoverLabel = labelFor(CONFIG.turnoverBands, answers.turnoverBandId, 'label');
    var tradingLabel = labelFor(CONFIG.timeTradingBands, answers.timeTradingId, 'label');
    document.getElementById('fnRecap').innerHTML = [amountLabel, purposeLabel, bizTypeLabel, sectorLabel, turnoverLabel, tradingLabel].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    document.getElementById('leadAmount').value = amountLabel;
    document.getElementById('leadPurpose').value = purposeLabel;
    document.getElementById('leadBizType').value = bizTypeLabel;
    document.getElementById('leadSector').value = sectorLabel;
    document.getElementById('leadTurnover').value = turnoverLabel;
    document.getElementById('leadTimeTrading').value = tradingLabel;
    leadSection.style.display = 'none';
    if (lastResult && lastResult.fallback) {
      document.getElementById('leadRecommended').value = 'Not matched — manual review requested';
      leadSection.style.display = '';
    }
  }

  function openLeadForm(productId) {
    var product = CONFIG.products[productId];
    document.getElementById('leadRecommended').value = product ? product.name : productId;
    var notesField = document.getElementById('leadNotes');
    if (!notesField.value) notesField.value = "I'd like to enquire about " + (product ? product.name : 'this funding product') + '.';
    var leadSection = document.getElementById('lead-form');
    leadSection.style.display = '';
    leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var f = document.getElementById('leadBusinessName'); if (f) setTimeout(function () { f.focus(); }, 400);
  }

  var leadForm = document.getElementById('fnLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var lead = {
        businessName: document.getElementById('leadBusinessName').value,
        contactName: document.getElementById('leadContactName').value,
        telephone: document.getElementById('leadTelephone').value,
        email: document.getElementById('leadEmail').value,
        fundingAmountId: answers.fundingAmountId, fundingPurposeId: answers.fundingPurposeId,
        turnoverBandId: answers.turnoverBandId, timeTradingId: answers.timeTradingId,
        recommendedProductIds: lastResult && !lastResult.fallback ? lastResult.products.map(function (p) { return p.id; }) : [],
        recommendedChoice: document.getElementById('leadRecommended').value,
        notes: document.getElementById('leadNotes').value,
        needsReview: !!(lastResult && lastResult.fallback)
      };
      STORE.addLead(lead);

      var fd = new FormData(leadForm);
      fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (lead.email) fd.append('_replyto', lead.email);
      fetch(CONFIG.leadSubmitEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (res) { if (!res.ok) throw new Error('fail'); leadForm.style.display = 'none'; document.getElementById('fnLeadOk').style.display = 'block'; document.getElementById('fnLeadOk').scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          alert('Your details were saved, but we could not send the confirmation email. Please call us on 0333 041 1161 to make sure we have your enquiry.');
        });
    });
  }

  render();
})();
