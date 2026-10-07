/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS FINANCE & FUNDING — browser-local admin panel
   ────────────────────────────────────────────────────────────────────────
   Independent from every other module's admin — separate file, separate
   storage keys, separate passcode. Every field exposed here is
   deliberately descriptive text (name, "suitable for", range, term,
   description) — there is no rate/APR/lender field anywhere in this UI,
   by design, to keep the compliance rules impossible to violate through
   the admin panel.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_FINANCE_STORE;
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
  function productIdList() { return Object.keys(cfg.products); }

  /* ── PASSCODE GATE ── */
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
    { id: 'products', label: 'Finance Products', render: renderProducts },
    { id: 'rules', label: 'Purposes & Rules', render: renderRules },
    { id: 'categories', label: 'Business Types & Sectors', render: renderCategories },
    { id: 'content', label: 'Website Content', render: renderContent },
    { id: 'faqs', label: 'FAQs', render: renderFaqs },
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
    renderTab('products');
  }
  function renderTab(id) { var t = TABS.filter(function (t) { return t.id === id; })[0]; if (t) t.render(document.getElementById('panel-' + id)); }

  /* ── PRODUCTS ── */
  function renderProducts(el) {
    el.innerHTML = productIdList().map(function (id) {
      var p = cfg.products[id];
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px;margin-bottom:12px">'
        + '<div><h3>' + esc(p.name) + '</h3><div class="sub">id: ' + esc(id) + '</div></div>'
        + '<label class="switch"><input type="checkbox" data-active="' + id + '" ' + (p.active ? 'checked' : '') + '><span class="sl"></span></label></div>'
        + '<div class="field"><label>Product name</label><input type="text" data-field="' + id + '|name" value="' + esc(p.name) + '"></div>'
        + '<div class="field"><label>Suitable for</label><input type="text" data-field="' + id + '|suitableFor" value="' + esc(p.suitableFor) + '"></div>'
        + '<div class="grid2"><div class="field"><label>Typical funding range (text)</label><input type="text" data-field="' + id + '|range" value="' + esc(p.range) + '"></div>'
        + '<div class="field"><label>Typical repayment term (text)</label><input type="text" data-field="' + id + '|term" value="' + esc(p.term) + '"></div></div>'
        + '<div class="field"><label>Brief description</label><textarea data-field="' + id + '|description">' + esc(p.description) + '</textarea></div>'
        + '</div>';
    }).join('');
    el.querySelectorAll('[data-active]').forEach(function (cb) { cb.onchange = function () { cfg.products[cb.dataset.active].active = cb.checked; persist((cb.checked ? 'Enabled' : 'Disabled') + ' product: ' + cb.dataset.active); }; });
    el.querySelectorAll('[data-field]').forEach(function (input) {
      input.onchange = function () { var p = input.dataset.field.split('|'); cfg.products[p[0]][p[1]] = input.value; persist('Updated ' + p[1] + ' for ' + p[0]); };
    });
  }

  /* ── PURPOSES & RULES ── */
  function renderRules(el) {
    var productIds = productIdList().join(', ');
    var purposePills = cfg.fundingPurposes.map(function (p, i) {
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px"><input type="text" data-purpose-name="' + i + '" value="' + esc(p.name) + '" style="max-width:260px"><button class="btn small danger" data-remove-purpose="' + i + '">Remove</button></div>'
        + '<div class="field"><label>Recommended products (priority order)</label><input type="text" data-rule="' + p.id + '" value="' + esc(((cfg.rules.byPurpose[p.id] || {}).priority || []).join(', ')) + '"></div></div>';
    }).join('');
    el.innerHTML = '<div class="card"><h3>Valid product ids</h3><div class="sub">' + esc(productIds) + '</div></div>'
      + purposePills
      + '<div class="card"><h3>Add a funding purpose</h3><div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;align-items:flex-end"><div class="field" style="margin-bottom:0;flex:1;min-width:200px"><label>Purpose name</label><input type="text" id="newPurposeName"></div><button class="btn small primary" id="addPurposeBtn">Add</button></div></div>';

    el.querySelectorAll('[data-purpose-name]').forEach(function (input) { input.onchange = function () { cfg.fundingPurposes[input.dataset.purposeName].name = input.value; persist('Renamed funding purpose'); }; });
    el.querySelectorAll('[data-rule]').forEach(function (input) {
      input.onchange = function () {
        var purposeId = input.dataset.rule;
        var list = input.value.split(',').map(function (s) { return s.trim(); }).filter(function (s) { return s && cfg.products[s]; });
        cfg.rules.byPurpose[purposeId] = { priority: list };
        persist('Updated recommendation rule for ' + purposeId);
      };
    });
    el.querySelectorAll('[data-remove-purpose]').forEach(function (btn) {
      btn.onclick = function () {
        var i = +btn.dataset.removePurpose, p = cfg.fundingPurposes[i];
        if (!confirm('Remove funding purpose "' + p.name + '"?')) return;
        delete cfg.rules.byPurpose[p.id];
        cfg.fundingPurposes.splice(i, 1);
        persist('Removed funding purpose: ' + p.name); renderRules(el);
      };
    });
    var addBtn = document.getElementById('addPurposeBtn');
    if (addBtn) addBtn.onclick = function () {
      var input = document.getElementById('newPurposeName'), name = input.value.trim(); if (!name) return;
      var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      cfg.fundingPurposes.push({ id: id, name: name });
      cfg.rules.byPurpose[id] = { priority: [] };
      persist('Added funding purpose: ' + name); renderRules(el);
    };
  }

  /* ── BUSINESS TYPES & SECTORS ── */
  function editableList(list, keyPrefix, labelKey) {
    return list.map(function (item, i) {
      return '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><input type="text" data-list-item="' + keyPrefix + '|' + i + '" value="' + esc(item[labelKey]) + '" style="flex:1"><button class="btn small danger" data-remove-listitem="' + keyPrefix + '|' + i + '">&times;</button></div>';
    }).join('');
  }
  function renderCategories(el) {
    el.innerHTML = '<div class="card"><h3>Business Types</h3>' + editableList(cfg.businessTypes, 'businessTypes', 'name')
      + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" id="newBizType" placeholder="Add business type…" style="flex:1"><button class="btn small" data-add-list="businessTypes">Add</button></div></div>'
      + '<div class="card"><h3>Business Sectors</h3>' + editableList(cfg.businessSectors, 'businessSectors', 'name')
      + '<div style="display:flex;gap:8px;margin-top:8px"><input type="text" id="newSector" placeholder="Add business sector…" style="flex:1"><button class="btn small" data-add-list="businessSectors">Add</button></div></div>'
      + '<div class="card"><h3>Funding Amount Bands</h3>' + editableList(cfg.fundingAmountBands, 'fundingAmountBands', 'label') + '</div>'
      + '<div class="card"><h3>Annual Turnover Bands</h3>' + editableList(cfg.turnoverBands, 'turnoverBands', 'label') + '</div>'
      + '<div class="card"><h3>Time Trading Bands</h3>' + editableList(cfg.timeTradingBands, 'timeTradingBands', 'label') + '</div>';

    el.querySelectorAll('[data-list-item]').forEach(function (input) {
      input.onchange = function () {
        var p = input.dataset.listItem.split('|'), list = cfg[p[0]], item = list[+p[1]];
        var key = item.name !== undefined ? 'name' : 'label';
        item[key] = input.value; persist('Updated ' + p[0]);
      };
    });
    el.querySelectorAll('[data-remove-listitem]').forEach(function (btn) {
      btn.onclick = function () {
        var p = btn.dataset.removeListitem.split('|');
        if (!confirm('Remove this item?')) return;
        cfg[p[0]].splice(+p[1], 1); persist('Removed item from ' + p[0]); renderCategories(el);
      };
    });
    el.querySelectorAll('[data-add-list]').forEach(function (btn) {
      btn.onclick = function () {
        var key = btn.dataset.addList;
        var inputId = key === 'businessTypes' ? 'newBizType' : 'newSector';
        var input = document.getElementById(inputId), name = input.value.trim(); if (!name) return;
        var id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        cfg[key].push({ id: id, name: name }); persist('Added to ' + key); renderCategories(el);
      };
    });
  }

  /* ── WEBSITE CONTENT ── */
  function renderContent(el) {
    el.innerHTML = '<div class="card"><h3>Hero</h3>'
      + '<div class="field"><label>Headline</label><input type="text" data-hero="headline" value="' + esc(cfg.hero.headline) + '"></div>'
      + '<div class="field"><label>Subheading</label><textarea data-hero="subheading">' + esc(cfg.hero.subheading) + '</textarea></div>'
      + '<div class="grid2"><div class="field"><label>Primary button</label><input type="text" data-hero="primaryBtn" value="' + esc(cfg.hero.primaryBtn) + '"></div><div class="field"><label>Secondary button</label><input type="text" data-hero="secondaryBtn" value="' + esc(cfg.hero.secondaryBtn) + '"></div></div></div>'
      + '<div class="card"><h3>Mandatory Notice</h3><div class="sub">Displayed prominently on the page — regulatory-sensitive, edit with care.</div><textarea id="noticeField" style="min-height:90px">' + esc(cfg.mandatoryNotice) + '</textarea><button class="btn small primary" id="saveNoticeBtn" style="margin-top:10px">Save notice</button></div>'
      + '<div class="card"><h3>Why Choose Plemmo</h3>' + cfg.whyChoose.map(function (w, i) {
        return '<div style="display:flex;gap:8px;margin-bottom:8px"><input type="text" data-why="' + i + '|title" value="' + esc(w.title) + '" style="flex:1"><input type="text" data-why="' + i + '|text" value="' + esc(w.text) + '" style="flex:2"></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-hero]').forEach(function (input) { input.onchange = function () { cfg.hero[input.dataset.hero] = input.value; persist('Updated hero ' + input.dataset.hero); }; });
    document.getElementById('saveNoticeBtn').onclick = function () { cfg.mandatoryNotice = document.getElementById('noticeField').value; persist('Updated mandatory notice'); };
    el.querySelectorAll('[data-why]').forEach(function (input) { input.onchange = function () { var p = input.dataset.why.split('|'); cfg.whyChoose[+p[0]][p[1]] = input.value; persist('Updated Why Choose Plemmo item'); }; });
  }

  /* ── FAQs ── */
  function renderFaqs(el) {
    el.innerHTML = cfg.faqs.map(function (f, i) {
      return '<div class="card"><div class="field"><label>Question</label><input type="text" data-faq="' + i + '|q" value="' + esc(f.q) + '"></div><div class="field"><label>Answer</label><textarea data-faq="' + i + '|a">' + esc(f.a) + '</textarea></div><button class="btn small danger" data-remove-faq="' + i + '">Remove FAQ</button></div>';
    }).join('') + '<div class="card"><h3>Add FAQ</h3><div class="field"><label>Question</label><input type="text" id="newFaqQ"></div><div class="field"><label>Answer</label><textarea id="newFaqA"></textarea></div><button class="btn small primary" id="addFaqBtn">Add FAQ</button></div>';
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
      wrap.innerHTML = '<table><thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Purpose</th><th>Suggested</th><th>Status</th><th></th></tr></thead><tbody>'
        + filtered.map(function (l) {
          return '<tr' + (l.needsReview ? ' style="background:rgba(255,180,0,.06)"' : '') + '>'
            + '<td>' + new Date(l.createdAt).toLocaleDateString('en-GB') + '</td>'
            + '<td>' + esc(l.businessName) + '</td>'
            + '<td>' + esc(l.contactName) + '<br><span class="sub">' + esc(l.email) + ' · ' + esc(l.telephone) + '</span></td>'
            + '<td>' + esc(l.fundingPurposeId) + '</td>'
            + '<td>' + esc((l.recommendedProductIds || []).join(', ') || l.recommendedChoice || '—') + (l.needsReview ? ' <span class="badge lime">REVIEW</span>' : '') + '</td>'
            + '<td><select data-lead-status="' + l.id + '"><option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option><option value="reviewed"' + (l.status === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option></select></td>'
            + '<td><button class="btn small danger" data-lead-del="' + l.id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table>';
      wrap.querySelectorAll('[data-lead-status]').forEach(function (sel) { sel.onchange = function () { STORE.updateLead(sel.dataset.leadStatus, { status: sel.value }); toast('Lead status updated'); }; });
      wrap.querySelectorAll('[data-lead-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Delete this lead?')) return; STORE.deleteLead(btn.dataset.leadDel); leads = STORE.getLeads(); draw(); }; });
    }
    document.getElementById('leadSearch').oninput = draw;
    document.getElementById('leadStatusFilter').onchange = draw;
    document.getElementById('exportLeadsBtn').onclick = function () { download('plemmo-finance-leads.csv', STORE.leadsToCSV(), 'text/csv'); };
    draw();
  }

  function renderAudit(el) {
    var log = STORE.getAudit();
    if (!log.length) { el.innerHTML = '<div class="card"><div class="sub">No changes logged yet.</div></div>'; return; }
    el.innerHTML = '<div class="card"><h3>Change history</h3><div class="sub">Every product, rule, content and FAQ change made in this browser — newest first.</div>' + log.map(function (a) { return '<div class="audit-item"><span class="cat">' + esc(a.category) + '</span>' + esc(a.detail) + '<span class="ts">' + new Date(a.ts).toLocaleString('en-GB') + '</span></div>'; }).join('') + '</div>';
  }

  function renderBackup(el) {
    el.innerHTML = '<div class="card"><h3>Export configuration</h3><div class="sub">Download the current products, purposes, rules and content as JSON.</div><button class="btn primary" id="exportCfgBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export config JSON</button></div>'
      + '<div class="card"><h3>Import configuration</h3><div class="sub">Replaces everything in this browser with the contents of the file.</div><input type="file" id="importCfgFile" accept="application/json"></div>'
      + '<div class="card"><h3>Reset to defaults</h3><div class="sub">Discards every local change in this browser.</div><button class="btn danger" id="resetCfgBtn">Reset to defaults</button></div>'
      + '<div class="card"><h3>Change admin passcode</h3><div class="grid2"><div class="field"><label>New passcode</label><input type="password" id="newPass"></div></div><button class="btn small" id="setPassBtn">Update passcode</button></div>';
    document.getElementById('exportCfgBtn').onclick = function () { download('plemmo-finance-config.json', STORE.exportConfigJSON(), 'application/json'); };
    document.getElementById('importCfgFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { STORE.importConfigJSON(reader.result); toast('Configuration imported'); location.reload(); } catch (err) { alert('Import failed: ' + err.message); } };
      reader.readAsText(file);
    };
    document.getElementById('resetCfgBtn').onclick = function () { if (!confirm('Reset all Business Finance configuration to defaults? This cannot be undone.')) return; STORE.resetConfig(); toast('Reset to defaults'); location.reload(); };
    document.getElementById('setPassBtn').onclick = function () {
      var v = document.getElementById('newPass').value;
      if (!v || v.length < 4) { alert('Choose a passcode at least 4 characters long.'); return; }
      STORE.setPasscode(v); toast('Passcode updated'); document.getElementById('newPass').value = '';
    };
  }
})();
