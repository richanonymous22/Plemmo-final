/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · DIGITAL SIGNAGE & MENU DESIGN — public configurator + lead
   ────────────────────────────────────────────────────────────────────────
   UI controller for pages/digital-signage-recommendation.html.
   Independent from every other recommendation module — no shared code.
   Lead generation only: every path ends at the lead form, never a
   checkout.
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
  var STORE = window.PLEMMO_SIGNAGE_STORE;
  var ENGINE = window.PLEMMO_SIGNAGE_ENGINE;
  var CONFIG = STORE.getConfig();

  var body = document.getElementById('sgBody');
  if (!body) return;

  var answers = { businessTypeId: null, serviceIds: [], screenSizeId: null };
  var stepIndex = 0;
  var lastResult = null;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmtMoney(n) { if (n == null) return null; return '£' + (Math.round(n * 100) / 100).toFixed(2).replace(/\.00$/, ''); }

  /* ── static content ── */
  el('heroHeadline').textContent = CONFIG.hero.headline;
  el('heroSub').textContent = CONFIG.hero.subheading;
  el('heroPrimaryBtn').innerHTML = esc(CONFIG.hero.primaryBtn) + ' <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon>';
  el('heroSecondaryBtn').textContent = CONFIG.hero.secondaryBtn;
  el('serviceCardsGrid').innerHTML = CONFIG.serviceCards.map(function (c) {
    return '<div class="svc3 rv"><div class="si"><iconify-icon icon="' + esc(c.icon) + '"></iconify-icon></div><h3>' + esc(c.name) + '</h3><ul>' + c.bullets.map(function (b) { return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(b) + '</li>'; }).join('') + '</ul></div>';
  }).join('');
  el('whyChooseGrid').innerHTML = CONFIG.whyChoose.map(function (w) {
    return '<div class="card benchc rv" style="padding:20px"><div class="bi"><iconify-icon icon="' + esc(w.icon) + '"></iconify-icon></div><strong>' + esc(w.title) + '</strong><span>' + esc(w.text) + '</span></div>';
  }).join('');
  el('faqList').innerHTML = CONFIG.faqs.map(function (f) {
    return '<div class="faq"><div class="faq-q">' + esc(f.q) + ' <iconify-icon icon="ph:plus-bold"></iconify-icon></div><div class="faq-a"><p>' + esc(f.a) + '</p></div></div>';
  }).join('');

  function stepsList() {
    var steps = ['biztype', 'services'];
    if (ENGINE.needsScreenSize(CONFIG, answers.serviceIds)) steps.push('screensize');
    steps.push('result');
    return steps;
  }
  var STEP_LABELS = { biztype: 'Business type', services: 'Services', screensize: 'Screen size', result: 'Result' };

  function stepper() {
    var steps = stepsList();
    var strip = document.createElement('div'); strip.className = 'sg-steps-strip';
    strip.innerHTML = steps.map(function (s, i) {
      var cls = i < stepIndex ? 'done' : (i === stepIndex ? 'active' : '');
      var n = i < stepIndex ? '<iconify-icon icon="ph:check-bold"></iconify-icon>' : (i + 1);
      return '<span class="sg-pill ' + cls + '"><span class="n">' + n + '</span>' + STEP_LABELS[s] + '</span>';
    }).join('');
    return strip;
  }

  function renderSingleTiles(opts) {
    body.innerHTML = ''; body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'sg-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'sg-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'sg-tiles';
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'sg-tile' + (opts.selected === t.v ? ' sel' : '');
      b.textContent = t.l;
      b.onclick = function () { opts.onPick(t.v); };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    appendFoot();
  }

  function renderMultiTiles(opts) {
    body.innerHTML = ''; body.appendChild(stepper());
    var q = document.createElement('div'); q.className = 'sg-q'; q.textContent = opts.question;
    body.appendChild(q);
    if (opts.hint) { var h = document.createElement('div'); h.className = 'sg-hint'; h.textContent = opts.hint; body.appendChild(h); }
    var grid = document.createElement('div'); grid.className = 'sg-tiles';
    opts.tiles.forEach(function (t) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'sg-tile' + (opts.selectedSet.indexOf(t.v) !== -1 ? ' sel' : '');
      b.textContent = t.l;
      b.onclick = function () {
        var idx = opts.selectedSet.indexOf(t.v);
        if (idx === -1) opts.selectedSet.push(t.v); else opts.selectedSet.splice(idx, 1);
        renderMultiTiles(opts);
      };
      grid.appendChild(b);
    });
    body.appendChild(grid);
    var foot = document.createElement('div'); foot.className = 'sg-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'sg-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.disabled = stepIndex === 0; back.onclick = goBack;
    var cont = document.createElement('button'); cont.type = 'button'; cont.className = 'btn btn-primary';
    cont.disabled = opts.selectedSet.length === 0;
    cont.style.opacity = opts.selectedSet.length === 0 ? '.5' : '1';
    cont.innerHTML = 'Continue <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon>';
    cont.onclick = function () { if (opts.selectedSet.length) opts.onContinue(); };
    foot.appendChild(back); foot.appendChild(cont); body.appendChild(foot);
  }

  function appendFoot() {
    var foot = document.createElement('div'); foot.className = 'sg-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'sg-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.disabled = stepIndex === 0; back.onclick = goBack;
    var meta = document.createElement('span'); meta.style.cssText = 'font-size:12px;color:var(--muted)'; meta.textContent = 'No obligation · Lead generation only, not a checkout';
    foot.appendChild(back); foot.appendChild(meta); body.appendChild(foot);
  }

  function goBack() {
    if (stepIndex === 0) return;
    stepIndex--;
    el('results').style.display = 'none';
    render();
  }
  function advance() { stepIndex++; render(); }

  function render() {
    var steps = stepsList();
    var step = steps[stepIndex];
    if (step === 'biztype') {
      renderSingleTiles({ question: 'What type of business is this for?', tiles: CONFIG.businessTypes.map(function (b) { return { v: b.id, l: b.name }; }), selected: answers.businessTypeId, onPick: function (v) { answers.businessTypeId = v; advance(); } });
    } else if (step === 'services') {
      renderMultiTiles({
        question: 'Which service(s) do you need?', hint: 'Select all that apply.',
        tiles: CONFIG.services.map(function (s) { return { v: s.id, l: s.name }; }),
        selectedSet: answers.serviceIds,
        onContinue: function () { stepIndex = stepsList().indexOf('services') + 1; render(); }
      });
    } else if (step === 'screensize') {
      renderSingleTiles({ question: 'What screen size do you need?', tiles: CONFIG.screenSizes.map(function (s) { return { v: s.id, l: s.label }; }), selected: answers.screenSizeId, onPick: function (v) { answers.screenSizeId = v; advance(); } });
    } else if (step === 'result') {
      body.innerHTML = ''; body.appendChild(stepper());
      var wrap = document.createElement('div'); wrap.innerHTML = '<div class="sg-q" style="margin-bottom:6px">Putting together your options…</div>';
      body.appendChild(wrap);
      var foot = document.createElement('div'); foot.className = 'sg-foot';
      var back = document.createElement('button'); back.type = 'button'; back.className = 'sg-back';
      back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
      foot.appendChild(back); body.appendChild(foot);
      setTimeout(showResult, 120); /* instant — no page refresh */
    }
  }

  function showResult() {
    lastResult = ENGINE.buildResult(CONFIG, answers);
    var resultsSection = document.getElementById('results');
    var resultsBody = document.getElementById('resultsBody');
    var html = '';

    if (lastResult.wantsHardware) {
      if (lastResult.screen && lastResult.screen.price != null) {
        html += '<div class="hw-card"><div class="hw-price">' + esc(fmtMoney(lastResult.screen.price)) + '<br><small>one-off</small></div>'
          + '<div class="hw-body"><h3>' + esc(lastResult.screen.label) + ' Digital Signage</h3><ul>' + lastResult.screen.includes.map(function (i) { return '<li><iconify-icon icon="ph:check-circle-fill"></iconify-icon>' + esc(i) + '</li>'; }).join('') + '</ul></div></div>';
      } else {
        html += '<div class="sg-fallback"><iconify-icon icon="ph:headset-duotone"></iconify-icon><h3>Please contact us for a personalised quote</h3><p>Not sure on screen size, or need something outside our standard 32"/40" bundles? Send your details below and we\'ll advise.</p></div>';
      }
    }

    var designToShow = lastResult.wantsDesignOnly ? lastResult.designServices : lastResult.designServices.filter(function (d) { return d.relevant; });
    if (designToShow.length) {
      html += '<div class="dsg-grid">' + designToShow.map(function (d) {
        return '<div class="dsg-card' + (d.relevant ? ' relevant' : '') + '">' + (d.relevant ? '<span class="dsg-badge">Matches your business</span>' : '') + '<h4>' + esc(d.service.name) + '</h4><p>' + esc(d.service.suitableFor) + '</p></div>';
      }).join('') + '</div>';
    }

    html += '<div style="font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#8a9279;margin-bottom:10px">Included with every design</div>';
    html += '<div class="feat-pills">' + lastResult.features.map(function (f) { return '<span>' + esc(f) + '</span>'; }).join('') + '</div>';
    html += '<div style="text-align:center"><button type="button" class="btn btn-primary btn-lg" id="resultEnquireBtn">Get My Quote <iconify-icon class="ar" icon="ph:arrow-right-bold"></iconify-icon></button></div>';

    resultsBody.innerHTML = html;
    resultsSection.style.display = '';
    var enquireBtn = document.getElementById('resultEnquireBtn');
    if (enquireBtn) enquireBtn.onclick = openLeadForm;
    showDoneState();
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showDoneState() {
    body.innerHTML = ''; body.appendChild(stepper());
    var wrap = document.createElement('div');
    wrap.innerHTML = '<div class="sg-q" style="margin-bottom:8px">Your options are ready</div>'
      + '<div class="sg-hint" style="margin-bottom:18px">Scroll down to see your recommendation, or start again with different answers.</div>';
    body.appendChild(wrap);
    var foot = document.createElement('div'); foot.className = 'sg-foot';
    var back = document.createElement('button'); back.type = 'button'; back.className = 'sg-back';
    back.innerHTML = '<iconify-icon icon="ph:arrow-left-bold"></iconify-icon> Back'; back.onclick = goBack;
    var restart = document.createElement('button'); restart.type = 'button'; restart.className = 'btn btn-ghost';
    restart.innerHTML = 'Start over <iconify-icon icon="ph:arrow-clockwise-bold"></iconify-icon>';
    restart.onclick = function () {
      answers = { businessTypeId: null, serviceIds: [], screenSizeId: null };
      stepIndex = 0; lastResult = null;
      el('results').style.display = 'none';
      el('lead-form').style.display = 'none';
      render();
      el('engine').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };
    foot.appendChild(back); foot.appendChild(restart); body.appendChild(foot);
  }

  function labelFor(list, id) { var found = null; (list || []).forEach(function (o) { if (o.id === id) found = o.name || o.label; }); return found || id || ''; }

  function openLeadForm() {
    var bizLabel = labelFor(CONFIG.businessTypes, answers.businessTypeId);
    var serviceLabels = answers.serviceIds.map(function (id) { return labelFor(CONFIG.services, id); });
    var screenLabel = answers.screenSizeId ? labelFor(CONFIG.screenSizes, answers.screenSizeId) : '';
    el('sgRecap').innerHTML = [bizLabel].concat(serviceLabels, screenLabel ? [screenLabel] : []).filter(Boolean).map(function (t) { return '<span>' + esc(t) + '</span>'; }).join('');
    el('leadBizType').value = bizLabel;
    el('leadServices').value = serviceLabels.join(', ');
    el('leadScreenSize').value = screenLabel;
    var leadSection = document.getElementById('lead-form');
    leadSection.style.display = '';
    leadSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    var f = document.getElementById('leadBusinessName'); if (f) setTimeout(function () { f.focus(); }, 400);
  }

  var leadForm = document.getElementById('sgLeadForm');
  if (leadForm) {
    leadForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = leadForm.querySelector('button[type=submit]'), label = btn ? btn.innerHTML : '';
      if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

      var lead = {
        businessName: el('leadBusinessName').value,
        contactName: el('leadContactName').value,
        mobile: el('leadMobile').value,
        email: el('leadEmail').value,
        businessTypeId: answers.businessTypeId, serviceIds: answers.serviceIds, screenSizeId: answers.screenSizeId,
        numberOfScreens: el('leadScreens').value,
        notes: el('leadNotes').value
      };
      STORE.addLead(lead);

      var fd = new FormData(leadForm);
      fd.append('_template', 'table'); fd.append('_captcha', 'false');
      if (lead.email) fd.append('_replyto', lead.email);
      fetch(CONFIG.leadSubmitEndpoint, { method: 'POST', headers: { 'Accept': 'application/json' }, body: fd })
        .then(function (res) { if (!res.ok) throw new Error('fail'); leadForm.style.display = 'none'; el('sgLeadOk').style.display = 'block'; el('sgLeadOk').scrollIntoView({ behavior: 'smooth', block: 'center' }); })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = label; }
          alert('Your details were saved, but we could not send the confirmation email. Please call us on 0333 041 1161 to make sure we have your enquiry.');
        });
    });
  }

  render();
})();
