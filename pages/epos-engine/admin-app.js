/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · EPOS RECOMMENDATION ENGINE — browser-local admin panel
   ────────────────────────────────────────────────────────────────────────
   Independent from the Card Machine Engine admin — separate file,
   separate storage keys, separate passcode. Edits a working copy of
   config.js persisted via store.js; every mutation is written immediately
   and logged to the audit trail.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_EPOS_STORE;
  var cfg = STORE.getConfig();

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
  function packageIdList() { return Object.keys(cfg.packages); }

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
    { id: 'packages', label: 'Packages & Pricing', render: renderPackages },
    { id: 'features', label: 'Features', render: renderFeatures },
    { id: 'rules', label: 'Recommendation Rules', render: renderRules },
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
        btn.classList.add('active'); document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
        renderTab(btn.dataset.tab);
      };
    });
    renderTab('providers');
  }
  function renderTab(id) { var t = TABS.filter(function (t) { return t.id === id; })[0]; if (t) t.render(document.getElementById('panel-' + id)); }

  /* ── PROVIDERS ── */
  function renderProviders(el) {
    el.innerHTML = providerIdList().map(function (id) {
      var p = cfg.providers[id];
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px">'
        + '<div><h3>' + esc(p.name) + '</h3><div class="sub">Provider id: ' + esc(id) + '</div></div>'
        + '<label class="switch"><input type="checkbox" data-active="' + id + '" ' + (p.active ? 'checked' : '') + '><span class="sl"></span></label></div>'
        + '<div class="grid2"><div class="field"><label>Display name</label><input type="text" data-field="name" data-id="' + id + '" value="' + esc(p.name) + '"></div>'
        + '<div class="field"><label>Logo path</label><input type="text" data-field="logo" data-id="' + id + '" value="' + esc(p.logo || '') + '" placeholder="../images/partners/example.svg"></div></div>'
        + '<div class="field"><label>Description</label><textarea style="min-height:60px;font-family:Inter;font-size:13.5px" data-field="description" data-id="' + id + '">' + esc(p.description || '') + '</textarea></div></div>';
    }).join('');
    el.querySelectorAll('[data-active]').forEach(function (cb) { cb.onchange = function () { cfg.providers[cb.dataset.active].active = cb.checked; persist((cb.checked ? 'Enabled' : 'Disabled') + ' provider: ' + cb.dataset.active); }; });
    el.querySelectorAll('[data-field]').forEach(function (input) { input.onchange = function () { cfg.providers[input.dataset.id][input.dataset.field] = input.value; persist('Updated ' + input.dataset.field + ' for ' + input.dataset.id); }; });
  }

  /* ── PACKAGES & PRICING ── */
  function renderPackages(el) {
    el.innerHTML = packageIdList().map(function (id) {
      var pkg = cfg.packages[id];
      var catChecks = cfg.categories.map(function (c) {
        var checked = pkg.categories.indexOf(c.id) !== -1;
        return '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;font-size:12.5px;color:#cfd6c5;text-transform:none;font-weight:500"><input type="checkbox" data-pkg-cat="' + id + '|' + c.id + '" ' + (checked ? 'checked' : '') + '> ' + esc(c.name) + '</label>';
      }).join('');
      var includedPills = pkg.hardwareIncluded.map(function (h, i) { return '<span class="pill">' + esc(h) + '<button data-remove-hw="' + id + '|' + i + '">&times;</button></span>'; }).join('');
      var optionalRows = pkg.hardwareOptional.map(function (o, i) { return '<span class="pill">' + esc(o.name) + ' — £' + o.price + '<button data-remove-opt="' + id + '|' + i + '">&times;</button></span>'; }).join('');
      var promoPills = (pkg.promotions || []).map(function (pr, i) { return '<span class="pill">' + esc(pr) + '<button data-remove-promo="' + id + '|' + i + '">&times;</button></span>'; }).join('');
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px">'
        + '<div><h3>' + esc(pkg.name) + '</h3><div class="sub">' + esc(cfg.providers[pkg.providerId] ? cfg.providers[pkg.providerId].name : pkg.providerId) + ' · id: ' + esc(id) + '</div></div>'
        + '<label class="switch"><input type="checkbox" data-pkg-active="' + id + '" ' + (pkg.active ? 'checked' : '') + '><span class="sl"></span></label></div>'
        + '<div class="field"><label>Package name</label><input type="text" data-pkg-field="' + id + '|name" value="' + esc(pkg.name) + '"></div>'
        + '<div class="field"><label>Shown under category</label>' + catChecks + '</div>'
        + '<div class="grid2">'
        + '<div class="field"><label>Hardware price (£, one-off)</label><input type="number" step="1" data-pkg-num="' + id + '|hardwarePrice" value="' + pkg.hardwarePrice + '"></div>'
        + '<div class="field"><label>Monthly software fee (£)</label><input type="number" step="0.01" data-pkg-num="' + id + '|monthlySoftwareFee" value="' + pkg.monthlySoftwareFee + '"></div>'
        + '</div>'
        + '<div class="field"><label>Card machine status</label><select data-pkg-cm="' + id + '"><option value="plemmo"' + (pkg.cardMachine === 'plemmo' ? ' selected' : '') + '>Available (Plemmo disclaimer)</option><option value="included"' + (pkg.cardMachine === 'included' ? ' selected' : '') + '>Included</option></select><div class="sub" style="margin-top:6px">"' + esc((cfg.cardMachineMessages[pkg.cardMachine] || {}).text || '') + '"</div></div>'
        + '<div class="field"><label>Hardware included</label><div class="pillrow">' + includedPills + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" data-new-hw="' + id + '" placeholder="Add hardware item…" style="flex:1"><button class="btn small" data-add-hw="' + id + '">Add</button></div></div>'
        + '<div class="field"><label>Optional hardware (name + price)</label><div class="pillrow">' + (optionalRows || '<span class="sub">None</span>') + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" data-new-opt-name="' + id + '" placeholder="Name" style="flex:2"><input type="number" data-new-opt-price="' + id + '" placeholder="£" style="flex:1"><button class="btn small" data-add-opt="' + id + '">Add</button></div></div>'
        + '<div class="field"><label>Promotions</label><div class="pillrow">' + (promoPills || '<span class="sub">None</span>') + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" data-new-promo="' + id + '" placeholder="Add promotion…" style="flex:1"><button class="btn small" data-add-promo="' + id + '">Add</button></div></div>'
        + '</div>';
    }).join('');

    el.querySelectorAll('[data-pkg-active]').forEach(function (cb) { cb.onchange = function () { cfg.packages[cb.dataset.pkgActive].active = cb.checked; persist((cb.checked ? 'Enabled' : 'Disabled') + ' package: ' + cb.dataset.pkgActive); }; });
    el.querySelectorAll('[data-pkg-field]').forEach(function (input) {
      input.onchange = function () { var p = input.dataset.pkgField.split('|'); cfg.packages[p[0]][p[1]] = input.value; persist('Updated ' + p[1] + ' for ' + p[0]); };
    });
    el.querySelectorAll('[data-pkg-num]').forEach(function (input) {
      input.onchange = function () { var p = input.dataset.pkgNum.split('|'); cfg.packages[p[0]][p[1]] = parseFloat(input.value); persist('Updated ' + p[1] + ' for ' + p[0]); };
    });
    el.querySelectorAll('[data-pkg-cm]').forEach(function (sel) { sel.onchange = function () { cfg.packages[sel.dataset.pkgCm].cardMachine = sel.value; persist('Updated card machine status for ' + sel.dataset.pkgCm); renderPackages(el); }; });
    el.querySelectorAll('[data-pkg-cat]').forEach(function (cb) {
      cb.onchange = function () {
        var p = cb.dataset.pkgCat.split('|'), pkg = cfg.packages[p[0]], catId = p[1];
        var idx = pkg.categories.indexOf(catId);
        if (cb.checked && idx === -1) pkg.categories.push(catId);
        else if (!cb.checked && idx !== -1) pkg.categories.splice(idx, 1);
        persist('Updated categories for ' + p[0]);
      };
    });
    el.querySelectorAll('[data-remove-hw]').forEach(function (btn) { btn.onclick = function () { var p = btn.dataset.removeHw.split('|'); cfg.packages[p[0]].hardwareIncluded.splice(+p[1], 1); persist('Removed hardware item from ' + p[0]); renderPackages(el); }; });
    el.querySelectorAll('[data-add-hw]').forEach(function (btn) {
      btn.onclick = function () { var id = btn.dataset.addHw, input = el.querySelector('[data-new-hw="' + id + '"]'), v = input.value.trim(); if (!v) return; cfg.packages[id].hardwareIncluded.push(v); persist('Added hardware item to ' + id); renderPackages(el); };
    });
    el.querySelectorAll('[data-remove-opt]').forEach(function (btn) { btn.onclick = function () { var p = btn.dataset.removeOpt.split('|'); cfg.packages[p[0]].hardwareOptional.splice(+p[1], 1); persist('Removed optional hardware from ' + p[0]); renderPackages(el); }; });
    el.querySelectorAll('[data-add-opt]').forEach(function (btn) {
      btn.onclick = function () {
        var id = btn.dataset.addOpt, nameInput = el.querySelector('[data-new-opt-name="' + id + '"]'), priceInput = el.querySelector('[data-new-opt-price="' + id + '"]');
        var name = nameInput.value.trim(), price = parseFloat(priceInput.value); if (!name || isNaN(price)) return;
        cfg.packages[id].hardwareOptional.push({ name: name, price: price }); persist('Added optional hardware to ' + id); renderPackages(el);
      };
    });
    el.querySelectorAll('[data-remove-promo]').forEach(function (btn) { btn.onclick = function () { var p = btn.dataset.removePromo.split('|'); cfg.packages[p[0]].promotions.splice(+p[1], 1); persist('Removed promotion from ' + p[0]); renderPackages(el); }; });
    el.querySelectorAll('[data-add-promo]').forEach(function (btn) {
      btn.onclick = function () { var id = btn.dataset.addPromo, input = el.querySelector('[data-new-promo="' + id + '"]'), v = input.value.trim(); if (!v) return; if (!cfg.packages[id].promotions) cfg.packages[id].promotions = []; cfg.packages[id].promotions.push(v); persist('Added promotion to ' + id); renderPackages(el); };
    });
  }

  /* ── FEATURES ── */
  function featureGroupsEditor(groups, moveHandler, addHandler, removeHandler, addGroupHandler, removeGroupHandler, keyPrefix) {
    var html = groups.map(function (g, gi) {
      var items = g.items.map(function (item, ii) {
        return '<span class="pill">' + esc(item)
          + '<button data-move="' + keyPrefix + '|' + gi + '|' + ii + '|up" title="Move up" style="color:#9aa48d">&uarr;</button>'
          + '<button data-move="' + keyPrefix + '|' + gi + '|' + ii + '|down" title="Move down" style="color:#9aa48d">&darr;</button>'
          + '<button data-remove-item="' + keyPrefix + '|' + gi + '|' + ii + '">&times;</button></span>';
      }).join('');
      return '<div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid var(--line)">'
        + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><strong style="font-size:13px;color:#fff">' + esc(g.group || '(ungrouped)') + '</strong>' + (removeGroupHandler ? '<button class="btn small danger" data-remove-group="' + keyPrefix + '|' + gi + '">Remove group</button>' : '') + '</div>'
        + '<div class="pillrow">' + items + '</div>'
        + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" data-new-item="' + keyPrefix + '|' + gi + '" placeholder="Add feature…" style="flex:1"><button class="btn small" data-add-item="' + keyPrefix + '|' + gi + '">Add</button></div>'
        + '</div>';
    }).join('');
    if (addGroupHandler) {
      html += '<div style="display:flex;gap:8px;align-items:flex-end"><div class="field" style="margin-bottom:0;flex:1"><label>New group name (leave blank for ungrouped list)</label><input type="text" data-new-group="' + keyPrefix + '"></div><button class="btn small primary" data-add-group="' + keyPrefix + '">Add group</button></div>';
    }
    return html;
  }

  function renderFeatures(el) {
    var html = '<div class="card"><h3>Plemmo — shared core features</h3><div class="sub">Used by both Plemmo Retail and Plemmo Hospitality packages.</div>'
      + featureGroupsEditor(cfg.plemmoCoreFeatureGroups, true, true, true, true, true, 'core') + '</div>';
    html += '<div class="card"><h3>Plemmo — Hospitality-only features</h3><div class="sub">Added on top of the core list, for the Hospitality package only.</div>'
      + featureGroupsEditor([cfg.plemmoHospitalityFeatureGroup], true, true, true, false, false, 'hosp') + '</div>';
    packageIdList().forEach(function (id) {
      var pkg = cfg.packages[id];
      if (typeof pkg.featureGroups === 'string') return; /* Plemmo packages use the shared editors above */
      html += '<div class="card"><h3>' + esc(pkg.name) + '</h3>' + featureGroupsEditor(pkg.featureGroups, true, true, true, true, true, 'pkg-' + id) + '</div>';
    });
    el.innerHTML = html;

    function resolveGroupsArray(keyPrefix) {
      if (keyPrefix === 'core') return cfg.plemmoCoreFeatureGroups;
      if (keyPrefix === 'hosp') return [cfg.plemmoHospitalityFeatureGroup];
      var pkgId = keyPrefix.replace('pkg-', '');
      return cfg.packages[pkgId].featureGroups;
    }

    el.querySelectorAll('[data-move]').forEach(function (btn) {
      btn.onclick = function () {
        var parts = btn.dataset.move.split('|'), prefix = parts[0], gi = +parts[1], ii = +parts[2], dir = parts[3];
        var groups = resolveGroupsArray(prefix), items = groups[gi].items;
        var swapWith = dir === 'up' ? ii - 1 : ii + 1;
        if (swapWith < 0 || swapWith >= items.length) return;
        var tmp = items[ii]; items[ii] = items[swapWith]; items[swapWith] = tmp;
        persist('Reordered feature'); renderFeatures(el);
      };
    });
    el.querySelectorAll('[data-remove-item]').forEach(function (btn) {
      btn.onclick = function () { var parts = btn.dataset.removeItem.split('|'); var groups = resolveGroupsArray(parts[0]); groups[+parts[1]].items.splice(+parts[2], 1); persist('Removed feature'); renderFeatures(el); };
    });
    el.querySelectorAll('[data-add-item]').forEach(function (btn) {
      btn.onclick = function () {
        var parts = btn.dataset.addItem.split('|'), input = el.querySelector('[data-new-item="' + btn.dataset.addItem + '"]'), v = input.value.trim(); if (!v) return;
        resolveGroupsArray(parts[0])[+parts[1]].items.push(v); persist('Added feature'); renderFeatures(el);
      };
    });
    el.querySelectorAll('[data-add-group]').forEach(function (btn) {
      btn.onclick = function () {
        var prefix = btn.dataset.addGroup, input = el.querySelector('[data-new-group="' + prefix + '"]');
        var name = input.value.trim();
        resolveGroupsArray(prefix).push({ group: name || null, items: [] });
        persist('Added feature group'); renderFeatures(el);
      };
    });
    el.querySelectorAll('[data-remove-group]').forEach(function (btn) {
      btn.onclick = function () {
        var parts = btn.dataset.removeGroup.split('|'); var groups = resolveGroupsArray(parts[0]);
        if (!confirm('Remove this feature group and all its items?')) return;
        groups.splice(+parts[1], 1); persist('Removed feature group'); renderFeatures(el);
      };
    });
  }

  /* ── RECOMMENDATION RULES ── */
  function renderRules(el) {
    var pkgIds = packageIdList().join(', ');
    var html = '<div class="card"><h3>Fixed rule (not editable)</h3><div class="sub">An active Plemmo package always displays first for its category — this is a Developer Rule from the brief, enforced in engine.js regardless of the order below.</div></div>';
    html += cfg.categories.map(function (c) {
      var priority = (cfg.rules[c.id] && cfg.rules[c.id].priority) || [];
      return '<div class="card"><h3>' + esc(c.name) + '</h3><div class="field"><label>Priority order (after Plemmo)</label><input type="text" data-rule="' + c.id + '" value="' + esc(priority.join(', ')) + '"></div><div class="sub">Valid package ids for this category: ' + esc(packageIdList().filter(function (pid) { return cfg.packages[pid].categories.indexOf(c.id) !== -1; }).join(', ')) + '</div></div>';
    }).join('');
    el.innerHTML = html;
    el.querySelectorAll('[data-rule]').forEach(function (input) {
      input.onchange = function () {
        var catId = input.dataset.rule;
        var list = input.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s && cfg.packages[s]; });
        cfg.rules[catId] = { priority: list };
        persist('Updated recommendation priority for ' + catId);
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
      wrap.innerHTML = '<table><thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Category / Type</th><th>Recommended</th><th>Status</th><th></th></tr></thead><tbody>'
        + filtered.map(function (l) {
          return '<tr' + (l.needsReview ? ' style="background:rgba(255,180,0,.06)"' : '') + '>'
            + '<td>' + new Date(l.createdAt).toLocaleDateString('en-GB') + '</td>'
            + '<td>' + esc(l.businessName) + '</td>'
            + '<td>' + esc(l.contactName) + '<br><span class="sub">' + esc(l.email) + ' · ' + esc(l.mobile) + '</span></td>'
            + '<td>' + esc(l.categoryId) + '<br><span class="sub">' + esc(l.typeId) + '</span></td>'
            + '<td>' + esc(l.recommendedPackageId || l.recommendedChoice || '—') + (l.needsReview ? ' <span class="badge lime">REVIEW</span>' : '') + '</td>'
            + '<td><select data-lead-status="' + l.id + '"><option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option><option value="reviewed"' + (l.status === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option></select></td>'
            + '<td><button class="btn small danger" data-lead-del="' + l.id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table>';
      wrap.querySelectorAll('[data-lead-status]').forEach(function (sel) { sel.onchange = function () { STORE.updateLead(sel.dataset.leadStatus, { status: sel.value }); toast('Lead status updated'); }; });
      wrap.querySelectorAll('[data-lead-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Delete this lead?')) return; STORE.deleteLead(btn.dataset.leadDel); leads = STORE.getLeads(); draw(); }; });
    }
    document.getElementById('leadSearch').oninput = draw;
    document.getElementById('leadStatusFilter').onchange = draw;
    document.getElementById('exportLeadsBtn').onclick = function () { download('plemmo-epos-leads.csv', STORE.leadsToCSV(), 'text/csv'); };
    draw();
  }

  /* ── AUDIT LOG ── */
  function renderAudit(el) {
    var log = STORE.getAudit();
    if (!log.length) { el.innerHTML = '<div class="card"><div class="sub">No changes logged yet.</div></div>'; return; }
    el.innerHTML = '<div class="card"><h3>Change history</h3><div class="sub">Every pricing, rule, feature and provider change made in this browser — newest first.</div>'
      + log.map(function (a) { return '<div class="audit-item"><span class="cat">' + esc(a.category) + '</span>' + esc(a.detail) + '<span class="ts">' + new Date(a.ts).toLocaleString('en-GB') + '</span></div>'; }).join('') + '</div>';
  }

  /* ── BACKUP & RESET ── */
  function renderBackup(el) {
    el.innerHTML = '<div class="card"><h3>Export configuration</h3><div class="sub">Download the current providers, packages, features and rules as JSON.</div><button class="btn primary" id="exportCfgBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export config JSON</button></div>'
      + '<div class="card"><h3>Import configuration</h3><div class="sub">Replaces every provider, package, feature and rule in this browser with the contents of the file.</div><input type="file" id="importCfgFile" accept="application/json"></div>'
      + '<div class="card"><h3>Reset to defaults</h3><div class="sub">Discards every local change in this browser and reverts to the values shipped in config.js.</div><button class="btn danger" id="resetCfgBtn">Reset to defaults</button></div>'
      + '<div class="card"><h3>Change admin passcode</h3><div class="grid2"><div class="field"><label>New passcode</label><input type="password" id="newPass"></div></div><button class="btn small" id="setPassBtn">Update passcode</button></div>';
    document.getElementById('exportCfgBtn').onclick = function () { download('plemmo-epos-config.json', STORE.exportConfigJSON(), 'application/json'); };
    document.getElementById('importCfgFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { STORE.importConfigJSON(reader.result); toast('Configuration imported'); location.reload(); } catch (err) { alert('Import failed: ' + err.message); } };
      reader.readAsText(file);
    };
    document.getElementById('resetCfgBtn').onclick = function () { if (!confirm('Reset all EPOS Recommendation Engine configuration to defaults? This cannot be undone.')) return; STORE.resetConfig(); toast('Reset to defaults'); location.reload(); };
    document.getElementById('setPassBtn').onclick = function () {
      var v = document.getElementById('newPass').value;
      if (!v || v.length < 4) { alert('Choose a passcode at least 4 characters long.'); return; }
      STORE.setPasscode(v); toast('Passcode updated'); document.getElementById('newPass').value = '';
    };
  }
})();
