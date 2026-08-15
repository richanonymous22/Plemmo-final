/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS ENERGY — public calculator + results + lead
   ────────────────────────────────────────────────────────────────────────
   UI controller for pages/business-energy-recommendation.html.
   Independent from every other recommendation module — no shared code.
   Never renders a live/numeric energy price — only a recommended
   contract type (Fixed or Flexible).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_ENERGY_STORE;
  var ENGINE = window.PLEMMO_ENERGY_ENGINE;
  var CONFIG = STORE.getConfig();

  var body = document.getElementById('enBody');
  if (!body) return;

  var answers = { businessTypeId: null, energyRequiredId: null, currentSupplierId: null, contractStatusId: null, annualSpendBandId: null, locationCountBandId: null, meterTypeId: null, tariffTypeId: null };
  var stepIndex = 0;
  var lastResult = null;
  var STEPS = ['biztype', 'energy', 'supplier', 'contract', 'spend', 'locations', 'meter', 'tariff', 'result'];
  var STEP_LABELS = { biztype: 'Business type', energy: 'Energy needed', supplier: 'Current supplier', contract: 'Contract status', spend: 'Annual spend', locations: 'Locations', meter: 'Meter type', tariff: 'Tariff type', result: 'Result' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ── static content from config ── */
  document.getElementById('heroHeadline').textContent = CONFIG.hero.headline;
  document.getElementById('heroSub').textContent = CONFIG.hero.subheading;
  document.getElementById('heroPrimaryBtn').innerHTML = esc(CONFIG.hero.primaryBtn) + ' <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon>';
  document.getElementById('heroSecondaryBtn').textContent = CONFIG.hero.secondaryBtn;
  document.getElementById('servicesGrid').innerHTML = CONFIG.services.map(function (s) {
    return '<div class="svc rv"><div class="si"><iconify-icon icon="' + esc(s.icon) + '"></iconify-icon></div><strong>' + esc(s.name) + '</strong></div>';
  }).join('');
  document.getElementById('whyChooseGrid').innerHTML = CONFIG.whyChoose.map(function (w) {
    return '<div class="card benchc rv" style="padding:20px"><div class="bi"><iconify-icon icon="' + esc(w.icon) + '"></iconify-icon></div><strong>' + esc(w.title) + '</strong><span>' + esc(w.text) + '</span></div>';
  }).join('');
  document.getElementById('faqList').innerHTML = CONFIG.faqs.map(function (f) {
    return '<div class="faq"><div class="faq-q">' + esc(f.q) + ' <iconify-icon icon="ph:plus-bold"></iconify-icon></div><div class="faq-a"><p>' + esc(f.a) + '</p></div></div>';
  }).join('');
  document.getElementById('docList').innerHTML = CONFIG.requiredDocuments.map(function (d) {
    return '<span><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(d) + '</span>';
  }).join('');
  document.getElementById('ctaHeadline').textContent = CONFIG.cta.headline;
  document.getElementById('ctaButtons').innerHTML = CONFIG.cta.buttons.map(function (b, i) {
    return '<button type="button" class="btn ' + (i === 1 ? 'btn-primary' : 'btn-ghost') + ' btn-lg" data-cta="' + esc(b) + '">' + esc(b) + '</button>';
  }).join('');
  document.querySelectorAll('[data-cta]').forEach(function (btn) {
    btn.onclick = function () { openLeadFormGeneric(btn.getAttribute('data-cta')); };
  });

  function stepper() {
    var strip = document.createElement('div'); strip.className = 'en-steps-strip';
    strip.innerHTML = STEPS.map(function (s, i) {
      var cls = i < stepIndex ? 'done' : (i === stepIndex ? 'active' : '');
      var n = i < stepIndex ? '<iconify-icon icon="ph:check-bold"></iconify-icon>' : (i + 1);
      return '<span class="en-pill ' + cls + '"><span class="n">' + n + '</span>' + STEP_LABELS[s] + '</span>';
    }).join('');
    return strip;
  }

  function renderTiles(opts) {
    body.innerHTML = ''; body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'en-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'en-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'en-tiles';
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'en-tile' + (opts.selected === t.v ? ' sel' : '');
      b.textContent = t.l;
      b.onclick = function () { opts.onPick(t.v); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    var foot = document.createElement('div'); foot.className = 'en-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'en-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.disabled = stepIndex === 0; back.onclick = goBack;
    var meta = document.createElement('span'); meta.style.cssText = 'font-size:12px;color:var(--muted)'; meta.textContent = 'No obligation · Free quotation';
    foot.appendChild(back); foot.appendChild(meta); body.appendChild(foot);
  }

  function goBack() {
    if (stepIndex === 0) return;
    stepIndex--;
    document.getElementById('results').style.display = 'none';
    render();
  }
  function advance() { stepIndex++; render(); }

  function render() {
    var step = STEPS[stepIndex];
    if (step === 'biztype') renderTiles({ question: 'What type of business do you run?', tiles: CONFIG.businessTypes.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.businessTypeId, onPick: function (v) { answers.businessTypeId = v; advance(); } });
    else if (step === 'energy') renderTiles({ question: 'What energy do you need?', tiles: CONFIG.energyRequiredOptions.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.energyRequiredId, onPick: function (v) { answers.energyRequiredId = v; advance(); } });
    else if (step === 'supplier') renderTiles({ question: 'Who is your current supplier?', tiles: CONFIG.currentSuppliers.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.currentSupplierId, onPick: function (v) { answers.currentSupplierId = v; advance(); } });
    else if (step === 'contract') renderTiles({ question: "What's your contract status?", tiles: CONFIG.contractStatusOptions.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.contractStatusId, onPick: function (v) { answers.contractStatusId = v; advance(); } });
    else if (step === 'spend') renderTiles({ question: 'What is your annual energy spend?', tiles: CONFIG.annualSpendBands.map(function (b) { return { v: b.id, l: b.label }; }), selected: answers.annualSpendBandId, onPick: function (v) { answers.annualSpendBandId = v; advance(); } });
    else if (step === 'locations') renderTiles({ question: 'How many business locations do you have?', tiles: CONFIG.locationCountBands.map(function (b) { return { v: b.id, l: b.label }; }), selected: answers.locationCountBandId, onPick: function (v) { answers.locationCountBandId = v; advance(); } });
    else if (step === 'meter') renderTiles({ question: 'What meter type do you currently have?', tiles: CONFIG.meterTypes.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.meterTypeId, onPick: function (v) { answers.meterTypeId = v; advance(); } });
    else if (step === 'tariff') renderTiles({ question: 'What tariff type are you currently on?', tiles: CONFIG.tariffTypes.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.tariffTypeId, onPick: function (v) { answers.tariffTypeId = v; advance(); } });
    else if (step === 'result') {
      body.innerHTML = ''; body.appendChild(stepper());
      var wrap = document.createElement('div'); wrap.innerHTML = '<div class="en-q" style="margin-bottom:6px">Finding your recommended contract type…</div>';
      body.appendChild(wrap);
      var foot = document.createElement('div'); foot.className = 'en-foot';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'en-back';
      back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
      foot.appendChild(back); body.appendChild(foot);
      setTimeout(showResult, 120); /* instant — no page refresh */
    }
  }

  function renderCard(solution, rank) {
    var benefits = solution.benefits.map(function (b) { return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(b) + '</li>'; }).join('');
    return '<div class="en-card' + (rank === 1 ? ' top' : '') + '">'
      + (rank === 1 ? '<span class="en-rank">Recommended</span>' : '')
      + '<h3>' + esc(solution.name) + '</h3>'
      + '<div class="suit">Suitable for: <b>' + esc(solution.suitableFor) + '</b></div>'
      + '<ul>' + benefits + '</ul>'
      + '<button type="button" class="btn btn-primary" data-enquire="' + solution.id + '">Get My Quote <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></button>'
      + '</div>';
  }

  function showResult() {
    lastResult = ENGINE.recommend(CONFIG, answers);
    var resultsSection = document.getElementById('results');
    var resultsBody = document.getElementById('resultsBody');
    resultsBody.innerHTML = '<div class="en-grid">' + lastResult.solutions.map(function (s, i) { return renderCard(s, i + 1); }).join('') + '</div>';
    resultsSection.style.display = '';
    document.querySelectorAll('[data-enquire]').forEach(function (b) { b.onclick = function () { openLeadForm(b.getAttribute('data-enquire')); }; });
    showDoneState();
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showDoneState() {
    body.innerHTML = ''; body.appendChild(stepper());
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="en-q" style="margin-bottom:8px">Your recommended contract type is ready</div>'
      + '<div class="en-hint" style="margin-bottom:18px">Scroll down to see your recommendation, or start again with different answers.</div>';
    body.appendChild(wrap);
    var foot = document.createElement('div'); foot.className = 'en-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'en-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
    var restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn btn-ghost';
    restart.innerHTML = 'Start over <iconify-icon icon="ph:arrow-clockwise-bold"></iconify-icon>';
    restart.onclick = function () {
      answers = { businessTypeId: null, energyRequiredId: null, currentSupplierId: null, contractStatusId: null, annualSpendBandId: null, locationCountBandId: null, meterTypeId: null, tariffTypeId: null };
      stepIndex = 0; lastResult = null;
      document.getElementById('results').style.display = 'none';
      document.getElementById('lead-form').style.display = 'none';
      render();
      document.getElementById('engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    foot.appendChild(back); foot.appendChild(restart); body.appendChild(foot);
  }

  function labelFor(list, id, key) { var found = null; (list || []).forEach(function (o) { if (o.id === id) found = o[key || 'name']; }); return found || id || ''; }

  function fillRecap() {
    var bizLabel = labelFor(CONFIG.businessTypes, answers.businessTypeId);
    var energyLabel = labelFor(CONFIG.energyRequiredOptions, answers.energyRequiredId);
    var supplierLabel = labelFor(CONFIG.currentSuppliers, answers.currentSupplierId);
    var contractLabel = labelFor(CONFIG.contractStatusOptions, answers.contractStatusId);
    var spendLabel = labelFor(CONFIG.annualSpendBands, answers.annualSpendBandId, 'label');
    var locLabel = labelFor(CONFIG.locationCountBands, answers.locationCountBandId, 'label');
    document.getElementById('enRecap').innerHTML = [bizLabel, energyLabel, supplierLabel, contractLabel, spendLabel, locLabel].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    document.getElementById('leadBizType').value = bizLabel;
    document.getElementById('leadEnergyRequired').value = energyLabel;
    document.getElementById('leadSupplier').value = supplierLabel;
    document.getElementById('leadContractStatus').value = contractLabel;
    document.getElementById('leadSpend').value = spendLabel;
    document.getElementById('leadLocations').value = locLabel;
  }

  function openLeadForm(solutionId) {
    var solution = CONFIG.solutionTypes[solutionId];
    fillRecap();
    document.getElementById('leadRecommended').value = solution ? solution.name : solutionId;
    var notesField = document.getElementById('leadNotes');
    if (!notesField.value) notesField.value = "I'd like a quote for a " + (solution ? solution.name : 'suitable contract') + '.';
    revealLeadForm();
  }
  function openLeadFormGeneric(intentLabel) {
    fillRecap();
    if (!document.getElementById('leadRecommended').value && lastResult) document.getElementById('leadRecommended').value = lastResult.solutions[0].name;
    var notesField = document.getElementById('leadNotes');
    if (!notesField.value) notesField.value = intentLabel + ' — please get in touch.';
    revealLeadForm();
    if (intentLabel === 'Upload My Bill') { var f = document.getElementById('leadFile'); if (f) setTimeout(function () { f.focus(); }, 450); }
  }
  function revealLeadForm() {
    var leadSection = document.getElementById('lead-form');
    leadSection.style.display = '';
    leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var f = document.getElementById('leadBusinessName'); if (f) setTimeout(function () { f.focus(); }, 400);
  }

  var leadForm = document.getElementById('enLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var fileInput = document.getElementById('leadFile');
      var hasAttachment = !!(fileInput && fileInput.files && fileInput.files.length);
      var lead = {
        businessName: document.getElementById('leadBusinessName').value,
        contactName: document.getElementById('leadContactName').value,
        telephone: document.getElementById('leadTelephone').value,
        email: document.getElementById('leadEmail').value,
        businessTypeId: answers.businessTypeId, energyRequiredId: answers.energyRequiredId,
        currentSupplierId: answers.currentSupplierId, contractStatusId: answers.contractStatusId,
        annualSpendBandId: answers.annualSpendBandId, locationCountBandId: answers.locationCountBandId,
        recommendedSolution: document.getElementById('leadRecommended').value,
        hasAttachment: hasAttachment,
        notes: document.getElementById('leadNotes').value
      };
      STORE.addLead(lead);

      var fd = new FormData(leadForm);
      fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (lead.email) fd.append('_replyto', lead.email);
      fetch(CONFIG.leadSubmitEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (res) { if (!res.ok) throw new Error('fail'); leadForm.style.display = 'none'; document.getElementById('enLeadOk').style.display = 'block'; document.getElementById('enLeadOk').scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          alert('Your details were saved, but we could not send the confirmation email. Please call us on 0333 041 1161 to make sure we have your enquiry.');
        });
    });
  }

  render();
})();
