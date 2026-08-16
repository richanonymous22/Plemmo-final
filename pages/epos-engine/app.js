/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · EPOS RECOMMENDATION ENGINE — public category/type + compare + lead
   ────────────────────────────────────────────────────────────────────────
   UI controller for pages/epos-recommendation.html. Independent from the
   Card Machine Recommendation Engine's app.js — no shared code. Reads
   config through store.js so admin edits apply on next load, delegates
   all recommendation logic to engine.js.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_EPOS_STORE;
  var ENGINE = window.PLEMMO_EPOS_ENGINE;
  var CONFIG = STORE.getConfig();

  var body = document.getElementById('epBody');
  if (!body) return;

  var answers = { categoryId: null, typeId: null };
  var stepIndex = 0;
  var lastResult = null;
  var STEPS = ['category', 'type', 'result'];
  var STEP_LABELS = { category: 'Category', type: 'Business type', result: 'Result' };
  var CATEGORY_ICONS = { hospitality: 'ph:wine-duotone', retail: 'ph:storefront-duotone' };

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtMoney(n) { if (n == null) return null; if (n === 0) return '£0'; var v = Number(n); return '£' + (Math.round(v * 100) / 100).toFixed(2).replace(/\.00$/, ''); }

  function stepper() {
    var strip = document.createElement('div'); strip.className = 'ep-steps-strip';
    strip.innerHTML = STEPS.map(function (s, i) {
      var cls = i < stepIndex ? 'done' : (i === stepIndex ? 'active' : '');
      var n = i < stepIndex ? '<iconify-icon icon="ph:check-bold"></iconify-icon>' : (i + 1);
      return '<span class="ep-pill ' + cls + '"><span class="n">' + n + '</span>' + STEP_LABELS[s] + '</span>';
    }).join('');
    return strip;
  }

  function renderTiles(opts) {
    body.innerHTML = ''; body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'ep-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'ep-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'ep-tiles' + (opts.cat ? ' cat' : '');
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'ep-tile' + (opts.selected === t.v ? ' sel' : '');
      b.innerHTML = (t.i ? '<span class="ti"><iconify-icon icon="' + t.i + '"></iconify-icon></span>' : '') + '<span>' + esc(t.l) + '</span>';
      b.onclick = function () { opts.onPick(t.v); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    var foot = document.createElement('div'); foot.className = 'ep-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'ep-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.disabled = stepIndex === 0; back.onclick = goBack;
    var meta = document.createElement('span'); meta.style.cssText = 'font-size:12px;color:var(--muted)'; meta.textContent = 'No obligation · provider terms apply';
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
    if (step === 'category') {
      renderTiles({
        question: 'What category best describes your business?', cat: true,
        tiles: CONFIG.categories.map(function (c) { return { v: c.id, l: c.name, i: CATEGORY_ICONS[c.id] || 'ph:briefcase-duotone' }; }),
        selected: answers.categoryId,
        onPick: function (v) { if (v !== answers.categoryId) answers.typeId = null; answers.categoryId = v; advance(); }
      });
    } else if (step === 'type') {
      var cat = ENGINE.findCategory(CONFIG, answers.categoryId);
      renderTiles({
        question: 'Which best matches your business type?', hint: cat ? cat.name : '',
        tiles: (cat ? cat.types : []).map(function (t) { return { v: t.id, l: t.name }; }),
        selected: answers.typeId,
        onPick: function (v) { answers.typeId = v; advance(); }
      });
    } else if (step === 'result') {
      body.innerHTML = ''; body.appendChild(stepper());
      var wrap = document.createElement('div'); wrap.innerHTML = '<div class="ep-q" style="margin-bottom:6px">Generating your suggested EPOS systems…</div>';
      body.appendChild(wrap);
      var foot = document.createElement('div'); foot.className = 'ep-foot';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'ep-back';
      back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
      foot.appendChild(back); body.appendChild(foot);
      setTimeout(showResult, 120); /* instant — no page refresh */
    }
  }

  /* ── RESULT / COMPARISON CARDS ── */
  function providerLogoBlock(pkg) {
    if (pkg.logo) return '<div class="plogo-c"><img loading="lazy" decoding="async" src="' + pkg.logo + '" alt="' + esc(pkg.providerName) + '" onerror="this.style.display=\'none\';this.nextElementSibling.style.display=\'inline-flex\'"><span class="wordmark" style="display:none">' + esc(pkg.providerName) + '</span></div>';
    return '<div class="plogo-c"><span class="wordmark">' + esc(pkg.providerName) + '</span></div>';
  }

  function renderCard(pkg, rank) {
    /* Full list — results-polish.js folds anything past the first few
       behind a disclosure, so nothing is lost and nothing is dumped. */
    var hardwareList = pkg.hardwareIncluded.map(function (h) { return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(h) + '</li>'; }).join('');
    var flatFeatures = [];
    pkg.featureGroups.forEach(function (g) { flatFeatures = flatFeatures.concat(g.items); });
    var featureList = flatFeatures.map(function (f) { return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(f) + '</li>'; }).join('');
    var cm = pkg.cardMachine;
    return '<div class="ep-card' + (rank === 1 ? ' top' : '') + '">'
      + (rank === 1 ? '<span class="ep-rank">Top suggestion</span>' : '')
      + providerLogoBlock(pkg)
      + '<div class="ep-pkgname">' + esc(pkg.name) + '</div>'
      + '<div class="ep-prices">'
      + '<div class="ep-price"><div class="l">Hardware</div><div class="v">' + esc(fmtMoney(pkg.hardwarePrice)) + '</div></div>'
      + '<div class="ep-price"><div class="l">Software / mo</div><div class="v">' + esc(fmtMoney(pkg.monthlySoftwareFee)) + '</div></div>'
      + '</div>'
      + (cm ? '<span class="ep-cm ' + cm.status + '"><iconify-icon icon="' + (cm.status === 'included' ? 'ph:check-circle-fill' : 'ph:info-fill') + '"></iconify-icon>' + (cm.status === 'included' ? 'Card machine included' : 'Card machine available') + '</span>' : '')
      + (cm && cm.status === 'available' ? '<div class="ep-cm-note">' + esc(cm.text) + '</div>' : '')
      + (hardwareList ? '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a9279;margin-bottom:8px">Hardware included</div><ul>' + hardwareList + '</ul>' : '')
      + (featureList ? '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a9279;margin-bottom:8px">Key features</div><ul>' + featureList + '</ul>' : '')
      + '<button type="button" class="ep-viewmore" data-detail="' + pkg.id + '">View full feature list <iconify-icon icon="ph:arrow-right-bold"></iconify-icon></button>'
      + '<div class="ep-card-btns">'
      + '<button type="button" class="btn btn-primary" data-apply="' + pkg.id + '">Apply Now <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></button>'
      + '<button type="button" class="btn btn-ghost" data-contact="' + pkg.id + '">Contact Us</button>'
      + '</div></div>';
  }

  function showResult() {
    lastResult = ENGINE.recommend(CONFIG, answers.categoryId);
    var resultsSection = document.getElementById('results');
    var resultsBody = document.getElementById('resultsBody');
    var resultsHeading = document.getElementById('resultsHeading');

    if (lastResult.fallback || !lastResult.packages.length) {
      resultsHeading.textContent = 'Suggested EPOS System';
      resultsBody.innerHTML = '<div class="ep-fallback"><iconify-icon icon="ph:headset-duotone"></iconify-icon>'
        + '<h3>Please contact us for a personalised EPOS quotation</h3>'
        + '<p>We couldn’t automatically match an EPOS package for this business type — a Plemmo specialist will review your details and follow up directly. You can still send your details below.</p></div>';
      STORE.appendAudit('engine', 'No-match fallback shown for ' + (answers.categoryId || 'unknown category'));
    } else {
      resultsHeading.textContent = 'Suggested EPOS Systems';
      resultsBody.innerHTML = '<div class="ep-grid">' + lastResult.packages.map(function (pkg, i) { return renderCard(pkg, i + 1); }).join('') + '</div>';
    }
    resultsSection.style.display = '';
    wireCardButtons();
    prepareLeadForm();
    showDoneState(lastResult.fallback || !lastResult.packages.length);
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showDoneState(wasFallback) {
    body.innerHTML = ''; body.appendChild(stepper());
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="ep-q" style="margin-bottom:8px">' + (wasFallback ? "We've got your answers" : 'Your suggested EPOS systems are ready') + '</div>'
      + '<div class="ep-hint" style="margin-bottom:18px">Scroll down to compare' + (wasFallback ? '' : ' and continue') + ', or start again with different answers.</div>';
    body.appendChild(wrap);
    var foot = document.createElement('div'); foot.className = 'ep-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'ep-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
    var restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn btn-ghost';
    restart.innerHTML = 'Start over <iconify-icon icon="ph:arrow-clockwise-bold"></iconify-icon>';
    restart.onclick = function () {
      answers = { categoryId: null, typeId: null }; stepIndex = 0; lastResult = null;
      document.getElementById('results').style.display = 'none';
      document.getElementById('lead-form').style.display = 'none';
      render();
      document.getElementById('engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    foot.appendChild(back); foot.appendChild(restart); body.appendChild(foot);
  }

  function wireCardButtons() {
    document.querySelectorAll('[data-apply]').forEach(function (b) { b.onclick = function () { openLeadForm(b.getAttribute('data-apply'), 'apply'); }; });
    document.querySelectorAll('[data-contact]').forEach(function (b) { b.onclick = function () { openLeadForm(b.getAttribute('data-contact'), 'contact'); }; });
    document.querySelectorAll('[data-detail]').forEach(function (b) { b.onclick = function () { openDetail(b.getAttribute('data-detail')); }; });
  }

  function openDetail(pkgId) {
    var pkg = ENGINE.formatPackage(CONFIG, pkgId);
    if (!pkg) return;
    var groups = pkg.featureGroups.map(function (g) {
      return (g.group ? '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--lime);margin:16px 0 8px;font-weight:700">' + esc(g.group) + '</div>' : '')
        + '<ul style="list-style:none;display:grid;gap:7px">' + g.items.map(function (f) { return '<li style="display:flex;gap:8px;font-size:13.5px;color:#dfe4d7"><iconify-icon icon="ph:check-circle-fill" style="color:var(--lime);flex-shrink:0;margin-top:2px"></iconify-icon>' + esc(f) + '</li>'; }).join('') + '</ul>';
    }).join('');
    var hardware = pkg.hardwareIncluded.length ? '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:8px">Hardware included</div><ul style="list-style:none;display:grid;gap:7px;margin-bottom:8px">' + pkg.hardwareIncluded.map(function (h) { return '<li style="display:flex;gap:8px;font-size:13.5px;color:#dfe4d7"><iconify-icon icon="ph:check-circle-fill" style="color:var(--lime)"></iconify-icon>' + esc(h) + '</li>'; }).join('') + '</ul>' : '';
    var optional = pkg.hardwareOptional.length ? '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin:14px 0 8px">Optional upgrade</div>' + pkg.hardwareOptional.map(function (o) { return '<div style="font-size:13.5px;color:#dfe4d7">' + esc(o.name) + ' — ' + esc(fmtMoney(o.price)) + '</div>'; }).join('') : '';
    var promo = pkg.promotions.length ? '<div style="background:var(--lime-soft);border:1px solid rgba(198,255,0,.3);border-radius:12px;padding:10px 14px;margin-top:14px;font-size:13px;color:#cfd6c5">' + pkg.promotions.map(esc).join(' · ') + '</div>' : '';
    var detail = document.getElementById('detail'), dcard = document.getElementById('detailCard');
    dcard.innerHTML = '<button class="modal-close" data-dclose aria-label="Close" style="position:absolute;top:16px;right:16px;z-index:3"><iconify-icon icon="ph:x-bold"></iconify-icon></button>'
      + '<div style="padding:32px">'
      + providerLogoBlock(pkg)
      + '<h3 style="font-family:Space Grotesk;font-size:22px;color:#fff;margin:10px 0 4px">' + esc(pkg.name) + '</h3>'
      + '<div style="display:flex;gap:14px;margin-bottom:16px"><span style="color:var(--lime);font-weight:700;font-family:Space Grotesk">' + esc(fmtMoney(pkg.hardwarePrice)) + ' hardware</span><span style="color:var(--muted)">' + esc(fmtMoney(pkg.monthlySoftwareFee)) + '/month software</span></div>'
      + (pkg.cardMachine ? '<div style="font-size:13px;color:#cfd6c5;margin-bottom:14px">' + esc(pkg.cardMachine.text) + '</div>' : '')
      + hardware + optional + groups + promo
      + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:20px"><a href="#" class="btn btn-primary" data-ddetail-apply="' + pkg.id + '" style="flex:1;justify-content:center;min-width:150px">Apply Now</a><a href="#" class="btn btn-ghost" data-dclose style="flex:1;justify-content:center;min-width:120px">Close</a></div>'
      + '</div>';
    detail.classList.add('open'); document.body.style.overflow = 'hidden'; dcard.scrollTop = 0;
    dcard.querySelectorAll('[data-dclose]').forEach(function (b) { b.onclick = function (e) { e.preventDefault(); closeDetail(); }; });
    var applyBtn = dcard.querySelector('[data-ddetail-apply]');
    if (applyBtn) applyBtn.onclick = function (e) { e.preventDefault(); closeDetail(); openLeadForm(pkgId, 'apply'); };
    detail.querySelector('.modal-bd').onclick = closeDetail;
  }
  function closeDetail() { document.getElementById('detail').classList.remove('open'); document.body.style.overflow = ''; }

  function labelFor(list, id) { var found = null; (list || []).forEach(function (o) { if (o.id === id) found = o.name; }); return found || id; }

  function prepareLeadForm() {
    var leadSection = document.getElementById('lead-form');
    var cat = ENGINE.findCategory(CONFIG, answers.categoryId);
    var type = ENGINE.findType(cat, answers.typeId);
    document.getElementById('epRecap').innerHTML = [cat ? cat.name : '', type ? type.name : ''].filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    document.getElementById('leadCategory').value = cat ? cat.name : '';
    document.getElementById('leadType').value = type ? type.name : '';
    leadSection.style.display = 'none';
    if (lastResult && lastResult.fallback) {
      document.getElementById('leadRecommended').value = 'Not matched — manual review requested';
      leadSection.style.display = '';
    }
  }

  function openLeadForm(pkgId, intent) {
    var pkg = ENGINE.formatPackage(CONFIG, pkgId);
    document.getElementById('leadRecommended').value = (pkg ? pkg.name : pkgId) + (intent === 'contact' ? ' (contact requested)' : ' (apply now)');
    var notesField = document.getElementById('leadNotes');
    if (!notesField.value) notesField.value = intent === 'contact'
      ? 'Please contact me about ' + (pkg ? pkg.name : 'this recommendation') + '.'
      : 'I would like to apply for ' + (pkg ? pkg.name : 'this recommendation') + '.';
    var leadSection = document.getElementById('lead-form');
    leadSection.style.display = '';
    leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var f = document.getElementById('leadBusinessName'); if (f) setTimeout(function () { f.focus(); }, 400);
  }

  var leadForm = document.getElementById('epLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var lead = {
        businessName: document.getElementById('leadBusinessName').value,
        contactName: document.getElementById('leadContactName').value,
        mobile: document.getElementById('leadMobile').value,
        email: document.getElementById('leadEmail').value,
        categoryId: answers.categoryId, typeId: answers.typeId,
        recommendedPackageId: lastResult && !lastResult.fallback && lastResult.packages[0] ? lastResult.packages[0].id : null,
        recommendedChoice: document.getElementById('leadRecommended').value,
        notes: document.getElementById('leadNotes').value,
        needsReview: !!(lastResult && lastResult.fallback)
      };
      STORE.addLead(lead);

      var fd = new FormData(leadForm);
      fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (lead.email) fd.append('_replyto', lead.email);
      fetch(CONFIG.leadSubmitEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (res) { if (!res.ok) throw new Error('fail'); leadForm.style.display = 'none'; document.getElementById('epLeadOk').style.display = 'block'; document.getElementById('epLeadOk').scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          alert('Your details were saved, but we could not send the confirmation email. Please call us on 0333 041 1161 to make sure we have your enquiry.');
        });
    });
  }

  render();
})();
