/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · CARD MACHINE RECOMMENDATION ENGINE — browser-local admin panel
   ────────────────────────────────────────────────────────────────────────
   Edits a working copy of config.js persisted via store.js (localStorage).
   Every mutation here is written immediately and logged to the audit
   trail — there is no separate "publish" step. This is a bridge until a
   real backend/database exists for the admin panel described in the
   Phase 1 brief (see store.js header for the full caveat).
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_CME_STORE;
  var ENGINE = window.PLEMMO_CME_ENGINE;
  var cfg = STORE.getConfig(); /* working copy, mutated in place then persisted */

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) {
    var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function persist(detail) { STORE.saveConfig(cfg, detail); toast(detail); }
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function providerIdList() { return Object.keys(cfg.providers); }
  function parsePriorityInput(str) {
    return str.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(function (s) { return s && cfg.providers[s]; });
  }

  /* ── PASSCODE GATE ── */
  var gate = document.getElementById('gate'), app = document.getElementById('adminApp'), lockBtn = document.getElementById('lockBtn');
  function showApp() { gate.style.display = 'none'; app.style.display = ''; lockBtn.style.display = ''; initTabs(); }
  if (STORE.isUnlocked()) showApp();
  document.getElementById('unlockBtn').onclick = function () {
    var v = document.getElementById('passInput').value;
    if (STORE.checkPasscode(v)) { STORE.unlock(); showApp(); }
    else document.getElementById('passErr').style.display = 'block';
  };
  document.getElementById('passInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('unlockBtn').click(); });
  lockBtn.onclick = function () { STORE.lock(); location.reload(); };

  /* ── TABS ── */
  var TABS = [
    { id: 'providers', label: 'Providers', render: renderProviders },
    { id: 'pricing', label: 'Pricing', render: renderPricing },
    { id: 'categories', label: 'Categories & Types', render: renderCategories },
    { id: 'rules', label: 'Recommendation Rules', render: renderRules },
    { id: 'promotions', label: 'Promotions', render: renderPromotions },
    { id: 'leads', label: 'Leads', render: renderLeads },
    { id: 'audit', label: 'Audit Log', render: renderAudit },
    { id: 'backup', label: 'Backup & Reset', render: renderBackup }
  ];
  function initTabs() {
    var tabsEl = document.getElementById('tabs'), panelsEl = document.getElementById('panels');
    tabsEl.innerHTML = TABS.map(function (t, i) { return '<button class="tab' + (i === 0 ? ' active' : '') + '" data-tab="' + t.id + '">' + t.label + '</button>'; }).join('');
    panelsEl.innerHTML = TABS.map(function (t, i) { return '<div class="panel' + (i === 0 ? ' active' : '') + '" id="panel-' + t.id + '"></div>'; }).join('');
    tabsEl.querySelectorAll('.tab').forEach(function (btn) {
      btn.onclick = function () {
        tabsEl.querySelectorAll('.tab').forEach(function (b) { b.classList.remove('active'); });
        panelsEl.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
        renderTab(btn.dataset.tab);
      };
    });
    renderTab('providers');
  }
  function renderTab(id) {
    var t = TABS.filter(function (t) { return t.id === id; })[0];
    if (t) t.render(document.getElementById('panel-' + id));
  }

  /* ── PROVIDERS ── */
  function renderProviders(el) {
    el.innerHTML = providerIdList().map(function (id) {
      var p = cfg.providers[id];
      return '<div class="card">'
        + '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px">'
        + '<div><h3>' + esc(p.name) + '</h3><div class="sub">' + esc(p.pricingType === 'blended' ? 'Blended Rate provider' : 'Split Rate provider') + '</div></div>'
        + '<label class="switch"><input type="checkbox" data-active="' + id + '" ' + (p.active ? 'checked' : '') + '><span class="sl"></span></label>'
        + '</div>'
        + '<div class="grid2">'
        + '<div class="field"><label>Display name</label><input type="text" data-field="name" data-id="' + id + '" value="' + esc(p.name) + '"></div>'
        + '<div class="field"><label>Logo path</label><input type="text" data-field="logo" data-id="' + id + '" value="' + esc(p.logo || '') + '" placeholder="../images/partners/example.svg"></div>'
        + '</div>'
        + '<div class="field"><label>Description</label><textarea style="min-height:60px;font-family:Inter;font-size:13.5px" data-field="description" data-id="' + id + '">' + esc(p.description || '') + '</textarea></div>'
        + '</div>';
    }).join('');
    el.querySelectorAll('[data-active]').forEach(function (cb) {
      cb.onchange = function () { cfg.providers[cb.dataset.active].active = cb.checked; persist((cb.checked ? 'Enabled' : 'Disabled') + ' provider: ' + cb.dataset.active); };
    });
    el.querySelectorAll('[data-field]').forEach(function (input) {
      input.onchange = function () { cfg.providers[input.dataset.id][input.dataset.field] = input.value; persist('Updated ' + input.dataset.field + ' for ' + input.dataset.id); };
    });
  }

  /* ── PRICING ── */
  function numField(label, obj, key, id, step) {
    return '<div class="field"><label>' + esc(label) + '</label><input type="number" step="' + (step || '0.01') + '" data-num="' + key + '" data-id="' + id + '" value="' + (obj[key] != null ? obj[key] : '') + '"></div>';
  }
  function jsonField(label, hint, value) {
    return '<div class="field"><label>' + esc(label) + '</label><textarea data-json>' + esc(JSON.stringify(value, null, 2)) + '</textarea><div class="sub" style="margin-top:4px">' + esc(hint) + '</div><button class="btn small primary" data-save-json style="margin-top:8px">Save table</button></div>';
  }
  function renderPricing(el) {
    var html = '';
    providerIdList().forEach(function (id) {
      var p = cfg.providers[id];
      html += '<div class="card"><h3>' + esc(p.name) + '</h3><div class="sub">' + (p.pricingType === 'blended' ? 'Blended Rate' : 'Split Rate') + ' — edit the fields below, then Save table for rate grids.</div>';
      if (id === 'teya') {
        html += '<div class="grid2">' + numField('Monthly rental (£)', p.terminalOptions[0], 'amount', id) + numField('Buyout (£, one-off)', p.terminalOptions[1], 'amount', id) + '</div>';
        html += jsonField('Blended rate table (min, max, rate — rate as %, e.g. 1.20)', 'Array of {min,max,rate}. "max": null means open-ended (Above £X).', p.blendedRateTable);
      } else if (id === 'shift4') {
        html += '<div class="grid3">' + numField('Rate below £10k (%)', p, 'blendedRateBelow10k', id) + numField('Rate from £10k (%)', p, 'blendedRateFrom10k', id) + numField('Settlement fee (£)', p.settlementFee, 'amount', id) + '</div>';
      } else if (id === 'sumup') {
        html += '<div class="sub">SumUp intentionally shows no rate table or figure on the comparison card — per the Developer Rules, split/blended rate display must not be added where the spec excludes it.</div>';
      } else if (id === 'clover') {
        html += '<div class="grid2">' + numField('Standard rental (£/mo)', p, 'standardRental', id) + '</div>';
        html += '<div class="sub">Authorisation fee is set per turnover band inside the tables below (the "auth" field on each row), not as a single flat value.</div>';
        html += jsonField('Split rate table — Low ATV', 'Array of {min,max,debit,credit,auth,rental}.', p.splitRateTable.low);
        html += jsonField('Split rate table — High ATV', 'Array of {min,max,debit,credit,auth,rental}.', p.splitRateTable.high);
      } else if (id === 'elavon') {
        html += '<div class="grid2">' + numField('Standard rental (£/mo)', p, 'standardRental', id) + '</div>';
        html += jsonField('Split rate table — Low ATV', 'Array of {min,max,debit,credit,auth,rental}.', p.splitRateTable.low);
        html += jsonField('Split rate table — High ATV', 'Array of {min,max,debit,credit,auth,rental}.', p.splitRateTable.high);
      } else if (id === 'worldpay') {
        html += '<div class="field"><label>Rental note</label><input type="text" data-text="rentalNote" data-id="' + id + '" value="' + esc(p.rentalNote || '') + '"></div>';
        html += jsonField('Split rate table', 'Array of {min,max,debit,credit,auth}. No ATV split for Worldpay, per spec.', p.splitRateTable);
      }
      html += '</div>';
    });
    el.innerHTML = html;
    el.querySelectorAll('[data-num]').forEach(function (input) {
      input.onchange = function () {
        var id = input.dataset.id, key = input.dataset.num, v = parseFloat(input.value);
        var p = cfg.providers[id];
        if (id === 'teya' && (key === 'amount')) { /* handled via index below instead */ }
        if (key in p) p[key] = v;
        persist('Updated ' + key + ' for ' + id);
      };
    });
    /* Teya terminal amounts need index-aware binding (rental=0, buyout=1) */
    el.querySelectorAll('[data-id=teya][data-num=amount]').forEach(function (input, i) {
      input.onchange = function () { cfg.providers.teya.terminalOptions[i].amount = parseFloat(input.value); persist('Updated Teya terminal pricing'); };
    });
    el.querySelectorAll('[data-num=amount][data-id=shift4]').forEach(function (input) {
      input.onchange = function () { cfg.providers.shift4.settlementFee.amount = parseFloat(input.value); persist('Updated Shift4 settlement fee'); };
    });
    el.querySelectorAll('[data-text]').forEach(function (input) {
      input.onchange = function () { cfg.providers[input.dataset.id][input.dataset.text] = input.value; persist('Updated ' + input.dataset.text + ' for ' + input.dataset.id); };
    });
    el.querySelectorAll('[data-save-json]').forEach(function (btn) {
      btn.onclick = function () {
        var ta = btn.previousElementSibling.previousElementSibling; /* textarea before hint div */
        try {
          var parsed = JSON.parse(ta.value);
          /* Find which provider/table this belongs to by walking the card */
          var card = btn.closest('.card'); var providerName = card.querySelector('h3').textContent;
          var pid = providerIdList().filter(function (id) { return cfg.providers[id].name === providerName; })[0];
          var label = btn.parentElement.querySelector('label').textContent;
          if (pid === 'teya') cfg.providers.teya.blendedRateTable = parsed;
          else if (pid === 'clover' || pid === 'elavon') {
            if (label.indexOf('Low') !== -1) cfg.providers[pid].splitRateTable.low = parsed;
            else cfg.providers[pid].splitRateTable.high = parsed;
          } else if (pid === 'worldpay') cfg.providers.worldpay.splitRateTable = parsed;
          persist('Updated rate table for ' + pid);
        } catch (e) { alert('That is not valid JSON: ' + e.message); }
      };
    });
  }

  /* ── CATEGORIES & TYPES ── */
  function renderCategories(el) {
    var html = cfg.categories.map(function (cat, ci) {
      var pills = cat.types.map(function (t, ti) {
        return '<span class="pill"><span class="type-badge' + (t.atv === 'high' ? ' high' : '') + '" data-toggle-atv data-ci="' + ci + '" data-ti="' + ti + '" style="cursor:pointer" title="Click to toggle High/Low ATV">' + t.atv.toUpperCase() + '</span>' + esc(t.name) + '<button data-remove-type data-ci="' + ci + '" data-ti="' + ti + '" title="Remove type">&times;</button></span>';
      }).join('');
      return '<div class="card">'
        + '<div class="field" style="max-width:340px"><label>Category name</label><input type="text" data-cat-name data-ci="' + ci + '" value="' + esc(cat.name) + '"></div>'
        + '<div class="sub">' + cat.types.length + ' business types — click the ATV badge to toggle High/Low.</div>'
        + '<div class="pillrow">' + pills + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;align-items:flex-end">'
        + '<div class="field" style="margin-bottom:0;flex:1;min-width:160px"><label>Add business type</label><input type="text" data-new-type-name data-ci="' + ci + '" placeholder="e.g. Ice Cream Parlour"></div>'
        + '<div class="field" style="margin-bottom:0;width:110px"><label>ATV</label><select data-new-type-atv data-ci="' + ci + '"><option value="low">Low</option><option value="high">High</option></select></div>'
        + '<button class="btn small" data-add-type data-ci="' + ci + '">Add</button>'
        + '<button class="btn small danger" data-remove-cat data-ci="' + ci + '" style="margin-left:auto">Remove category</button>'
        + '</div></div>';
    }).join('');
    html += '<div class="card"><h3>Add a new category</h3><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:flex-end">'
      + '<div class="field" style="margin-bottom:0;flex:1;min-width:200px"><label>Category name</label><input type="text" id="newCatName" placeholder="e.g. Agriculture"></div>'
      + '<button class="btn small primary" id="addCatBtn">Add category</button></div></div>';
    el.innerHTML = html;

    el.querySelectorAll('[data-cat-name]').forEach(function (input) {
      input.onchange = function () { cfg.categories[input.dataset.ci].name = input.value; persist('Renamed category'); };
    });
    el.querySelectorAll('[data-toggle-atv]').forEach(function (badge) {
      badge.onclick = function () {
        var t = cfg.categories[badge.dataset.ci].types[badge.dataset.ti];
        t.atv = t.atv === 'high' ? 'low' : 'high';
        persist('Toggled ATV for ' + t.name + ' to ' + t.atv.toUpperCase());
        renderCategories(el);
      };
    });
    el.querySelectorAll('[data-remove-type]').forEach(function (btn) {
      btn.onclick = function () {
        var cat = cfg.categories[btn.dataset.ci], t = cat.types[btn.dataset.ti];
        if (!confirm('Remove business type "' + t.name + '"?')) return;
        cat.types.splice(btn.dataset.ti, 1);
        persist('Removed business type: ' + t.name);
        renderCategories(el);
      };
    });
    el.querySelectorAll('[data-add-type]').forEach(function (btn) {
      btn.onclick = function () {
        var ci = btn.dataset.ci;
        var nameInput = el.querySelector('[data-new-type-name][data-ci="' + ci + '"]');
        var atvSelect = el.querySelector('[data-new-type-atv][data-ci="' + ci + '"]');
        var name = nameInput.value.trim();
        if (!name) return;
        var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        cfg.categories[ci].types.push({ id: id, name: name, atv: atvSelect.value });
        persist('Added business type: ' + name);
        renderCategories(el);
      };
    });
    el.querySelectorAll('[data-remove-cat]').forEach(function (btn) {
      btn.onclick = function () {
        var cat = cfg.categories[btn.dataset.ci];
        if (!confirm('Remove category "' + cat.name + '" and all its business types?')) return;
        cfg.categories.splice(btn.dataset.ci, 1);
        persist('Removed category: ' + cat.name);
        renderCategories(el);
      };
    });
    var addCatBtn = document.getElementById('addCatBtn');
    if (addCatBtn) addCatBtn.onclick = function () {
      var input = document.getElementById('newCatName'), name = input.value.trim();
      if (!name) return;
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      cfg.categories.push({ id: id, name: name, types: [] });
      persist('Added category: ' + name);
      renderCategories(el);
    };
  }

  /* ── RECOMMENDATION RULES ── */
  function renderRules(el) {
    var providers = providerIdList().join(', ');
    var html = '<div class="card"><h3>General rules</h3><div class="sub">Fixed by the brief — never editable, shown here for transparency.</div>'
      + '<ul style="padding-left:18px;font-size:13px;color:#cfd6c5;line-height:1.8"><li>Never recommend the merchant\'s current provider.</li><li>If the top-priority provider is excluded, move to the next in the list.</li><li>Prioritise suitability, turnover and category — never simply the cheapest rate.</li></ul></div>';

    html += '<div class="card"><h3>Charity / Non-Profit</h3><div class="sub">Question: “' + esc(cfg.rules.charity.question.text) + '”</div>'
      + '<div class="grid2">'
      + '<div class="field"><label>If YES (no rental required) — priority order</label><input type="text" data-charity="onYes" value="' + esc(cfg.rules.charity.onYes.priority.join(', ')) + '"></div>'
      + '<div class="field"><label>If NO — priority order (blank = show all active, unranked)</label><input type="text" data-charity="onNo" value="' + esc((cfg.rules.charity.onNo.priority || []).join(', ')) + '"></div>'
      + '</div><div class="sub">Valid provider ids: ' + esc(providers) + '. Comma-separated, in priority order.</div></div>';

    html += '<div class="card"><h3>Food &amp; Beverage</h3><div class="sub">Question: “' + esc(cfg.rules.foodBeverage.question.text) + '”</div>'
      + '<div class="field" style="max-width:400px"><label>If Over the Phone (MOTO) — priority order (turnover ignored)</label><input type="text" data-fb-moto value="' + esc(cfg.rules.foodBeverage.moto.priority.join(', ')) + '"></div>'
      + '<div class="sub" style="margin:14px 0 6px">If Pay by Link / Neither — priority by monthly turnover band:</div>'
      + '<table><thead><tr><th>Band</th><th>Priority order</th></tr></thead><tbody>'
      + cfg.rules.foodBeverage.turnoverTable.map(function (row, i) {
        return '<tr><td>' + esc(row.band) + '</td><td><input type="text" data-fb-band="' + i + '" value="' + esc(row.priority.join(', ')) + '" style="min-width:220px"></td></tr>';
      }).join('') + '</tbody></table></div>';

    html += '<div class="card"><h3>Other categories (Retail, Health/Beauty/Wellness, Leisure &amp; Entertainment, Services)</h3>'
      + '<div class="sub">The brief only defines dedicated rules for Charity and Food &amp; Beverage. Until you set a priority order below, the engine shows every active provider unranked (still never the merchant\'s current provider).</div>'
      + cfg.categories.filter(function (c) { return c.id !== 'charity-non-profit' && c.id !== 'food-beverage'; }).map(function (c) {
        var existing = (cfg.rules.byCategory[c.id] && cfg.rules.byCategory[c.id].priority) || [];
        return '<div class="field"><label>' + esc(c.name) + ' — priority order (blank = unranked)</label><input type="text" data-bycat="' + c.id + '" value="' + esc(existing.join(', ')) + '"></div>';
      }).join('') + '</div>';

    el.innerHTML = html;

    el.querySelectorAll('[data-charity]').forEach(function (input) {
      input.onchange = function () {
        cfg.rules.charity[input.dataset.charity].priority = parsePriorityInput(input.value);
        persist('Updated Charity rule (' + input.dataset.charity + ')');
      };
    });
    var motoInput = el.querySelector('[data-fb-moto]');
    if (motoInput) motoInput.onchange = function () { cfg.rules.foodBeverage.moto.priority = parsePriorityInput(motoInput.value); persist('Updated Food & Beverage MOTO rule'); };
    el.querySelectorAll('[data-fb-band]').forEach(function (input) {
      input.onchange = function () { cfg.rules.foodBeverage.turnoverTable[input.dataset.fbBand].priority = parsePriorityInput(input.value); persist('Updated Food & Beverage turnover rule'); };
    });
    el.querySelectorAll('[data-bycat]').forEach(function (input) {
      input.onchange = function () {
        var catId = input.dataset.bycat, list = parsePriorityInput(input.value);
        if (list.length) cfg.rules.byCategory[catId] = { priority: list }; else delete cfg.rules.byCategory[catId];
        persist('Updated category rule for ' + catId);
      };
    });
  }

  /* ── PROMOTIONS ── */
  function renderPromotions(el) {
    var html = '';
    providerIdList().forEach(function (id) {
      var p = cfg.providers[id];
      if (!p.promotions) return;
      Object.keys(p.promotions).forEach(function (promoKey) {
        var promo = p.promotions[promoKey];
        html += '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">'
          + '<div><h3>' + esc(p.name) + ' — ' + esc(promo.label) + '</h3><div class="sub">Reverts to ' + esc(String(promo.revertsTo)) + ' after ' + esc(String(promo.months)) + ' months.</div></div>'
          + '<label class="switch"><input type="checkbox" data-promo-active="' + id + '|' + promoKey + '" ' + (promo.active ? 'checked' : '') + '><span class="sl"></span></label></div>'
          + '<div class="grid3" style="margin-top:12px">'
          + '<div class="field"><label>Amount (£)</label><input type="number" step="0.01" data-promo-field="' + id + '|' + promoKey + '|amount" value="' + promo.amount + '"></div>'
          + '<div class="field"><label>Months</label><input type="number" data-promo-field="' + id + '|' + promoKey + '|months" value="' + promo.months + '"></div>'
          + '<div class="field"><label>Reverts to (£)</label><input type="number" step="0.01" data-promo-field="' + id + '|' + promoKey + '|revertsTo" value="' + promo.revertsTo + '"></div>'
          + '</div></div>';
      });
    });
    if (!html) html = '<div class="card"><div class="sub">No promotions configured yet.</div></div>';
    el.innerHTML = html;
    el.querySelectorAll('[data-promo-active]').forEach(function (cb) {
      cb.onchange = function () {
        var parts = cb.dataset.promoActive.split('|');
        cfg.providers[parts[0]].promotions[parts[1]].active = cb.checked;
        persist((cb.checked ? 'Enabled' : 'Disabled') + ' promotion: ' + parts[1]);
      };
    });
    el.querySelectorAll('[data-promo-field]').forEach(function (input) {
      input.onchange = function () {
        var parts = input.dataset.promoField.split('|');
        cfg.providers[parts[0]].promotions[parts[1]][parts[2]] = parseFloat(input.value);
        persist('Updated promotion field: ' + parts[2]);
      };
    });
  }

  /* ── LEADS ── */
  function renderLeads(el) {
    var leads = STORE.getLeads();
    el.innerHTML = '<div class="card">'
      + '<div class="searchbar"><input type="text" id="leadSearch" placeholder="Search business, contact or email…"><select id="leadStatusFilter"><option value="">All statuses</option><option value="new">New</option><option value="reviewed">Reviewed</option><option value="contacted">Contacted</option></select><button class="btn small" id="exportLeadsBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export CSV</button></div>'
      + '<div id="leadsTableWrap"></div></div>';
    function draw() {
      var q = document.getElementById('leadSearch').value.toLowerCase();
      var status = document.getElementById('leadStatusFilter').value;
      var filtered = leads.filter(function (l) {
        var matchesQ = !q || [l.businessName, l.contactName, l.email].some(function (v) { return (v || '').toLowerCase().indexOf(q) !== -1; });
        var matchesStatus = !status || l.status === status;
        return matchesQ && matchesStatus;
      });
      var wrap = document.getElementById('leadsTableWrap');
      if (!filtered.length) { wrap.innerHTML = '<div class="sub" style="padding:16px 0">No leads yet.</div>'; return; }
      wrap.innerHTML = '<table><thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Category / Type</th><th>Turnover</th><th>Recommended</th><th>Status</th><th></th></tr></thead><tbody>'
        + filtered.map(function (l) {
          return '<tr' + (l.needsReview ? ' style="background:rgba(255,180,0,.06)"' : '') + '>'
            + '<td>' + new Date(l.createdAt).toLocaleDateString('en-GB') + '</td>'
            + '<td>' + esc(l.businessName) + '</td>'
            + '<td>' + esc(l.contactName) + '<br><span class="sub">' + esc(l.email) + ' · ' + esc(l.mobile) + '</span></td>'
            + '<td>' + esc(l.categoryId) + '<br><span class="sub">' + esc(l.typeId) + '</span></td>'
            + '<td>' + esc(l.turnoverBandId) + '</td>'
            + '<td>' + esc((l.recommendedProviderIds || []).join(', ') || l.recommendedChoice || '—') + (l.needsReview ? ' <span class="type-badge high">REVIEW</span>' : '') + '</td>'
            + '<td><select data-lead-status="' + l.id + '"><option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option><option value="reviewed"' + (l.status === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option></select></td>'
            + '<td><button class="btn small danger" data-lead-del="' + l.id + '">Delete</button></td>'
            + '</tr>';
        }).join('') + '</tbody></table>';
      wrap.querySelectorAll('[data-lead-status]').forEach(function (sel) {
        sel.onchange = function () { STORE.updateLead(sel.dataset.leadStatus, { status: sel.value }); toast('Lead status updated'); };
      });
      wrap.querySelectorAll('[data-lead-del]').forEach(function (btn) {
        btn.onclick = function () {
          if (!confirm('Delete this lead?')) return;
          STORE.deleteLead(btn.dataset.leadDel);
          leads = STORE.getLeads(); draw();
        };
      });
    }
    document.getElementById('leadSearch').oninput = draw;
    document.getElementById('leadStatusFilter').onchange = draw;
    document.getElementById('exportLeadsBtn').onclick = function () { download('plemmo-card-machine-leads.csv', STORE.leadsToCSV(), 'text/csv'); };
    draw();
  }

  /* ── AUDIT LOG ── */
  function renderAudit(el) {
    var log = STORE.getAudit();
    if (!log.length) { el.innerHTML = '<div class="card"><div class="sub">No changes logged yet.</div></div>'; return; }
    el.innerHTML = '<div class="card"><h3>Change history</h3><div class="sub">Every pricing, rule, category and promotion change made in this browser — newest first. Export a config backup before major changes so you can restore it if needed.</div>'
      + log.map(function (a) {
        return '<div class="audit-item"><span class="cat">' + esc(a.category) + '</span>' + esc(a.detail) + '<span class="ts">' + new Date(a.ts).toLocaleString('en-GB') + '</span></div>';
      }).join('') + '</div>';
  }

  /* ── BACKUP & RESET ── */
  function renderBackup(el) {
    el.innerHTML = '<div class="card"><h3>Export configuration</h3><div class="sub">Download the current providers, pricing, categories and rules as JSON — keep this as a backup, move it to another browser, or hand it to a developer to bake into config.js.</div><button class="btn primary" id="exportCfgBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export config JSON</button></div>'
      + '<div class="card"><h3>Import configuration</h3><div class="sub">Replaces every provider, price, category and rule in this browser with the contents of the file. This cannot be undone except by re-importing a previous export.</div><input type="file" id="importCfgFile" accept="application/json"></div>'
      + '<div class="card"><h3>Reset to defaults</h3><div class="sub">Discards every local change in this browser and reverts to the values shipped in config.js.</div><button class="btn danger" id="resetCfgBtn">Reset to defaults</button></div>'
      + '<div class="card"><h3>Change admin passcode</h3><div class="grid2"><div class="field"><label>New passcode</label><input type="password" id="newPass"></div></div><button class="btn small" id="setPassBtn">Update passcode</button></div>';
    document.getElementById('exportCfgBtn').onclick = function () { download('plemmo-card-machine-config.json', STORE.exportConfigJSON(), 'application/json'); };
    document.getElementById('importCfgFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try { STORE.importConfigJSON(reader.result); toast('Configuration imported'); location.reload(); }
        catch (err) { alert('Import failed: ' + err.message); }
      };
      reader.readAsText(file);
    };
    document.getElementById('resetCfgBtn').onclick = function () {
      if (!confirm('Reset all Card Machine Engine configuration to defaults? This cannot be undone.')) return;
      STORE.resetConfig(); toast('Reset to defaults'); location.reload();
    };
    document.getElementById('setPassBtn').onclick = function () {
      var v = document.getElementById('newPass').value;
      if (!v || v.length < 4) { alert('Choose a passcode at least 4 characters long.'); return; }
      STORE.setPasscode(v); toast('Passcode updated'); document.getElementById('newPass').value = '';
    };
  }
})();
