/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS ENERGY — browser-local admin panel
   ────────────────────────────────────────────────────────────────────────
   Independent from every other module's admin — separate file, separate
   storage keys, separate passcode.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_ENERGY_STORE;
  var cfg = STORE.getConfig();

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function toast(msg) { var t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function () { t.classList.remove('show'); }, 2600); }
  function persist(detail) { STORE.saveConfig(cfg, detail); toast(detail); }
  function download(filename, content, mime) {
    var blob = new Blob([content], { type: mime || 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  var gate = document.getElementById('gate'), app = document.getElementById('adminApp'), lockBtn = document.getElementById('lockBtn');
  function showApp() { gate.style.display = 'none'; app.style.display = ''; lockBtn.style.display = ''; initTabs(); }
  if (STORE.isUnlocked()) showApp();
  document.getElementById('unlockBtn').onclick = function () {
    var v = document.getElementById('passInput').value;
    if (STORE.checkPasscode(v)) { STORE.unlock(); showApp(); } else document.getElementById('passErr').style.display = 'block';
  };
  document.getElementById('passInput').addEventListener('keydown', function (e) { if (e.key === 'Enter') document.getElementById('unlockBtn').click(); });
  lockBtn.onclick = function () { STORE.lock(); location.reload(); };

  var TABS = [
    { id: 'suppliers', label: 'Suppliers', render: renderSuppliers },
    { id: 'categories', label: 'Categories & Options', render: renderCategories },
    { id: 'rules', label: 'Solution Rules', render: renderRules },
    { id: 'content', label: 'Content', render: renderContent },
    { id: 'faqs', label: 'FAQs & Documents', render: renderFaqs },
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
    renderTab('suppliers');
  }
  function renderTab(id) { var t = TABS.filter(function (t) { return t.id === id; })[0]; if (t) t.render(document.getElementById('panel-' + id)); }

  function editableNamedList(list, key, el, redraw) {
    var html = list.map(function (item, i) {
      return '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><input type="text" data-item="' + key + '|' + i + '" value="' + esc(item.name || item.label) + '" style="flex:1"><button class="btn small danger" data-remove="' + key + '|' + i + '">&times;</button></div>';
    }).join('');
    html += '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" id="new-' + key + '" placeholder="Add…" style="flex:1"><button class="btn small" data-add="' + key + '">Add</button></div>';
    return html;
  }
  function wireNamedList(el, key, redraw) {
    el.querySelectorAll('[data-item^="' + key + '|"]').forEach(function (input) {
      input.onchange = function () {
        var i = +input.dataset.item.split('|')[1], item = cfg[key][i];
        if ('name' in item) item.name = input.value; else item.label = input.value;
        persist('Updated ' + key);
      };
    });
    el.querySelectorAll('[data-remove^="' + key + '|"]').forEach(function (btn) {
      btn.onclick = function () { var i = +btn.dataset.remove.split('|')[1]; if (!confirm('Remove this item?')) return; cfg[key].splice(i, 1); persist('Removed item from ' + key); redraw(); };
    });
    var addBtn = el.querySelector('[data-add="' + key + '"]');
    if (addBtn) addBtn.onclick = function () {
      var input = document.getElementById('new-' + key), name = input.value.trim(); if (!name) return;
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      var usesLabel = cfg[key].length && 'label' in cfg[key][0];
      var item = { id: id }; item[usesLabel ? 'label' : 'name'] = name;
      cfg[key].push(item); persist('Added to ' + key); redraw();
    };
  }

  /* ── SUPPLIERS ── */
  function renderSuppliers(el) {
    el.innerHTML = '<div class="card"><h3>Current Supplier options</h3><div class="sub">Shown on the "Who is your current supplier?" question — used only to exclude that supplier from consideration, never to compare rates.</div>' + editableNamedList(cfg.currentSuppliers, 'currentSuppliers') + '</div>';
    wireNamedList(el, 'currentSuppliers', function () { renderSuppliers(el); });
  }

  /* ── CATEGORIES & OPTIONS ── */
  function renderCategories(el) {
    el.innerHTML = '<div class="card"><h3>Business Types</h3>' + editableNamedList(cfg.businessTypes, 'businessTypes') + '</div>'
      + '<div class="card"><h3>Energy Required options</h3>' + editableNamedList(cfg.energyRequiredOptions, 'energyRequiredOptions') + '</div>'
      + '<div class="card"><h3>Contract Status options</h3>' + editableNamedList(cfg.contractStatusOptions, 'contractStatusOptions') + '</div>'
      + '<div class="card"><h3>Meter Types</h3>' + editableNamedList(cfg.meterTypes, 'meterTypes') + '</div>'
      + '<div class="card"><h3>Tariff Types</h3>' + editableNamedList(cfg.tariffTypes, 'tariffTypes') + '</div>'
      + '<div class="card"><h3>Annual Spend Bands</h3>' + editableNamedList(cfg.annualSpendBands, 'annualSpendBands') + '</div>'
      + '<div class="card"><h3>Location Count Bands</h3>' + editableNamedList(cfg.locationCountBands, 'locationCountBands') + '</div>';
    ['businessTypes', 'energyRequiredOptions', 'contractStatusOptions', 'meterTypes', 'tariffTypes', 'annualSpendBands', 'locationCountBands'].forEach(function (key) {
      wireNamedList(el, key, function () { renderCategories(el); });
    });
  }

  /* ── SOLUTION RULES ── */
  function renderRules(el) {
    var spendOptions = cfg.annualSpendBands.map(function (b) {
      var checked = cfg.rules.flexibleTriggerSpendBands.indexOf(b.id) !== -1;
      return '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:8px;font-size:12.5px;color:#cfd6c5;text-transform:none;font-weight:500"><input type="checkbox" data-spend-trigger="' + b.id + '" ' + (checked ? 'checked' : '') + '> ' + esc(b.label) + '</label>';
    }).join('');
    var locOptions = cfg.locationCountBands.map(function (b) {
      var checked = cfg.rules.flexibleTriggerLocationBands.indexOf(b.id) !== -1;
      return '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:8px;font-size:12.5px;color:#cfd6c5;text-transform:none;font-weight:500"><input type="checkbox" data-loc-trigger="' + b.id + '" ' + (checked ? 'checked' : '') + '> ' + esc(b.label) + '</label>';
    }).join('');
    el.innerHTML = '<div class="card"><h3>When to recommend Flexible instead of Fixed</h3><div class="sub">If the merchant\'s annual spend OR number of locations matches any ticked band below, Flexible is recommended first. Otherwise Fixed is recommended.</div>'
      + '<div class="field"><label>Annual spend bands that trigger Flexible</label>' + spendOptions + '</div>'
      + '<div class="field"><label>Location count bands that trigger Flexible</label>' + locOptions + '</div></div>'
      + ['fixed', 'flexible'].map(function (key) {
        var s = cfg.solutionTypes[key];
        return '<div class="card"><h3>' + esc(s.name) + '</h3>'
          + '<div class="field"><label>Name</label><input type="text" data-sol="' + key + '|name" value="' + esc(s.name) + '"></div>'
          + '<div class="field"><label>Suitable for</label><input type="text" data-sol="' + key + '|suitableFor" value="' + esc(s.suitableFor) + '"></div>'
          + '<div class="field"><label>Benefits (comma-separated)</label><input type="text" data-sol-benefits="' + key + '" value="' + esc(s.benefits.join(', ')) + '"></div></div>';
      }).join('');

    el.querySelectorAll('[data-spend-trigger]').forEach(function (cb) {
      cb.onchange = function () {
        var id = cb.dataset.spendTrigger, list = cfg.rules.flexibleTriggerSpendBands, idx = list.indexOf(id);
        if (cb.checked && idx === -1) list.push(id); else if (!cb.checked && idx !== -1) list.splice(idx, 1);
        persist('Updated Flexible spend trigger');
      };
    });
    el.querySelectorAll('[data-loc-trigger]').forEach(function (cb) {
      cb.onchange = function () {
        var id = cb.dataset.locTrigger, list = cfg.rules.flexibleTriggerLocationBands, idx = list.indexOf(id);
        if (cb.checked && idx === -1) list.push(id); else if (!cb.checked && idx !== -1) list.splice(idx, 1);
        persist('Updated Flexible location trigger');
      };
    });
    el.querySelectorAll('[data-sol]').forEach(function (input) { input.onchange = function () { var p = input.dataset.sol.split('|'); cfg.solutionTypes[p[0]][p[1]] = input.value; persist('Updated ' + p[0] + ' solution'); }; });
    el.querySelectorAll('[data-sol-benefits]').forEach(function (input) {
      input.onchange = function () { cfg.solutionTypes[input.dataset.solBenefits].benefits = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated benefits list'); };
    });
  }

  /* ── CONTENT ── */
  function renderContent(el) {
    el.innerHTML = '<div class="card"><h3>Hero</h3>'
      + '<div class="field"><label>Headline</label><input type="text" data-hero="headline" value="' + esc(cfg.hero.headline) + '"></div>'
      + '<div class="field"><label>Subheading</label><textarea data-hero="subheading">' + esc(cfg.hero.subheading) + '</textarea></div>'
      + '<div class="grid2"><div class="field"><label>Primary button</label><input type="text" data-hero="primaryBtn" value="' + esc(cfg.hero.primaryBtn) + '"></div><div class="field"><label>Secondary button</label><input type="text" data-hero="secondaryBtn" value="' + esc(cfg.hero.secondaryBtn) + '"></div></div></div>'
      + '<div class="card"><h3>Why Choose Plemmo</h3>' + cfg.whyChoose.map(function (w, i) {
        return '<div style="display:flex;gap:8px;margin-bottom:8px"><input type="text" data-why="' + i + '|title" value="' + esc(w.title) + '" style="flex:1"><input type="text" data-why="' + i + '|text" value="' + esc(w.text) + '" style="flex:2"></div>';
      }).join('') + '</div>'
      + '<div class="card"><h3>Final CTA</h3><div class="field"><label>Headline</label><input type="text" data-cta="headline" value="' + esc(cfg.cta.headline) + '"></div><div class="field"><label>Button labels (comma-separated)</label><input type="text" id="ctaButtonsInput" value="' + esc(cfg.cta.buttons.join(', ')) + '"></div></div>'
      + '<div class="card"><h3>Energy Services</h3>' + cfg.services.map(function (s, i) {
        return '<div style="display:flex;gap:8px;margin-bottom:8px"><input type="text" data-svc="' + i + '" value="' + esc(s.name) + '" style="flex:1"></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-hero]').forEach(function (input) { input.onchange = function () { cfg.hero[input.dataset.hero] = input.value; persist('Updated hero ' + input.dataset.hero); }; });
    el.querySelectorAll('[data-why]').forEach(function (input) { input.onchange = function () { var p = input.dataset.why.split('|'); cfg.whyChoose[+p[0]][p[1]] = input.value; persist('Updated Why Choose Plemmo item'); }; });
    document.getElementById('ctaButtonsInput').onchange = function (e) { cfg.cta.buttons = e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated CTA buttons'); };
    el.querySelectorAll('[data-cta]').forEach(function (input) { input.onchange = function () { cfg.cta[input.dataset.cta] = input.value; persist('Updated CTA ' + input.dataset.cta); }; });
    el.querySelectorAll('[data-svc]').forEach(function (input) { input.onchange = function () { cfg.services[+input.dataset.svc].name = input.value; persist('Updated service name'); }; });
  }

  /* ── FAQs & DOCUMENTS ── */
  function renderFaqs(el) {
    el.innerHTML = '<div class="card"><h3>Required Documents</h3><div class="sub">Comma-separated list shown in the "What you\'ll need" section.</div><input type="text" id="docsInput" value="' + esc(cfg.requiredDocuments.join(', ')) + '"></div>'
      + cfg.faqs.map(function (f, i) {
        return '<div class="card"><div class="field"><label>Question</label><input type="text" data-faq="' + i + '|q" value="' + esc(f.q) + '"></div><div class="field"><label>Answer</label><textarea data-faq="' + i + '|a">' + esc(f.a) + '</textarea></div><button class="btn small danger" data-remove-faq="' + i + '">Remove FAQ</button></div>';
      }).join('') + '<div class="card"><h3>Add FAQ</h3><div class="field"><label>Question</label><input type="text" id="newFaqQ"></div><div class="field"><label>Answer</label><textarea id="newFaqA"></textarea></div><button class="btn small primary" id="addFaqBtn">Add FAQ</button></div>';
    document.getElementById('docsInput').onchange = function (e) { cfg.requiredDocuments = e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated required documents'); };
    el.querySelectorAll('[data-faq]').forEach(function (input) { input.onchange = function () { var p = input.dataset.faq.split('|'); cfg.faqs[+p[0]][p[1]] = input.value; persist('Updated FAQ'); }; });
    el.querySelectorAll('[data-remove-faq]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Remove this FAQ?')) return; cfg.faqs.splice(+btn.dataset.removeFaq, 1); persist('Removed FAQ'); renderFaqs(el); }; });
    document.getElementById('addFaqBtn').onclick = function () {
      var q = document.getElementById('newFaqQ').value.trim(), a = document.getElementById('newFaqA').value.trim(); if (!q || !a) return;
      cfg.faqs.push({ q: q, a: a }); persist('Added FAQ'); renderFaqs(el);
    };
  }

  /* ── LEADS ── */
  function renderLeads(el) {
    var leads = STORE.getLeads();
    el.innerHTML = '<div class="card"><div class="searchbar"><input type="text" id="leadSearch" placeholder="Search business, contact or email…"><select id="leadStatusFilter"><option value="">All statuses</option><option value="new">New</option><option value="reviewed">Reviewed</option><option value="contacted">Contacted</option></select><button class="btn small" id="exportLeadsBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export CSV</button></div><div id="leadsTableWrap"></div></div>';
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
      wrap.innerHTML = '<table><thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Recommended</th><th>Bill attached</th><th>Status</th><th></th></tr></thead><tbody>'
        + filtered.map(function (l) {
          return '<tr>'
            + '<td>' + new Date(l.createdAt).toLocaleDateString('en-GB') + '</td>'
            + '<td>' + esc(l.businessName) + '</td>'
            + '<td>' + esc(l.contactName) + '<br><span class="sub">' + esc(l.email) + ' · ' + esc(l.telephone) + '</span></td>'
            + '<td>' + esc(l.recommendedSolution || '—') + '</td>'
            + '<td>' + (l.hasAttachment ? '<span class="badge lime">YES</span>' : '—') + '</td>'
            + '<td><select data-lead-status="' + l.id + '"><option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option><option value="reviewed"' + (l.status === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option></select></td>'
            + '<td><button class="btn small danger" data-lead-del="' + l.id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table>';
      wrap.querySelectorAll('[data-lead-status]').forEach(function (sel) { sel.onchange = function () { STORE.updateLead(sel.dataset.leadStatus, { status: sel.value }); toast('Lead status updated'); }; });
      wrap.querySelectorAll('[data-lead-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Delete this lead?')) return; STORE.deleteLead(btn.dataset.leadDel); leads = STORE.getLeads(); draw(); }; });
    }
    document.getElementById('leadSearch').oninput = draw;
    document.getElementById('leadStatusFilter').onchange = draw;
    document.getElementById('exportLeadsBtn').onclick = function () { download('plemmo-energy-leads.csv', STORE.leadsToCSV(), 'text/csv'); };
    draw();
  }

  function renderAudit(el) {
    var log = STORE.getAudit();
    if (!log.length) { el.innerHTML = '<div class="card"><div class="sub">No changes logged yet.</div></div>'; return; }
    el.innerHTML = '<div class="card"><h3>Change history</h3><div class="sub">Every category, rule, content and FAQ change made in this browser — newest first.</div>' + log.map(function (a) { return '<div class="audit-item"><span class="cat">' + esc(a.category) + '</span>' + esc(a.detail) + '<span class="ts">' + new Date(a.ts).toLocaleString('en-GB') + '</span></div>'; }).join('') + '</div>';
  }

  function renderBackup(el) {
    el.innerHTML = '<div class="card"><h3>Export configuration</h3><div class="sub">Download the current suppliers, categories, rules and content as JSON.</div><button class="btn primary" id="exportCfgBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export config JSON</button></div>'
      + '<div class="card"><h3>Import configuration</h3><div class="sub">Replaces everything in this browser with the contents of the file.</div><input type="file" id="importCfgFile" accept="application/json"></div>'
      + '<div class="card"><h3>Reset to defaults</h3><div class="sub">Discards every local change in this browser.</div><button class="btn danger" id="resetCfgBtn">Reset to defaults</button></div>'
      + '<div class="card"><h3>Change admin passcode</h3><div class="grid2"><div class="field"><label>New passcode</label><input type="password" id="newPass"></div></div><button class="btn small" id="setPassBtn">Update passcode</button></div>';
    document.getElementById('exportCfgBtn').onclick = function () { download('plemmo-energy-config.json', STORE.exportConfigJSON(), 'application/json'); };
    document.getElementById('importCfgFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { STORE.importConfigJSON(reader.result); toast('Configuration imported'); location.reload(); } catch (err) { alert('Import failed: ' + err.message); } };
      reader.readAsText(file);
    };
    document.getElementById('resetCfgBtn').onclick = function () { if (!confirm('Reset all Business Energy configuration to defaults? This cannot be undone.')) return; STORE.resetConfig(); toast('Reset to defaults'); location.reload(); };
    document.getElementById('setPassBtn').onclick = function () {
      var v = document.getElementById('newPass').value;
      if (!v || v.length < 4) { alert('Choose a passcode at least 4 characters long.'); return; }
      STORE.setPasscode(v); toast('Passcode updated'); document.getElementById('newPass').value = '';
    };
  }
})();
