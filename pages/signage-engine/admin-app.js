/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · DIGITAL SIGNAGE & MENU DESIGN — browser-local admin panel
   ────────────────────────────────────────────────────────────────────────
   Independent from every other module's admin — separate file, separate
   storage keys, separate passcode.
   ════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var STORE = window.PLEMMO_SIGNAGE_STORE;
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
    { id: 'screens', label: 'Screen Sizes & Pricing', render: renderScreens },
    { id: 'services', label: 'Services', render: renderServices },
    { id: 'design', label: 'Design Services & Categories', render: renderDesign },
    { id: 'content', label: 'Content', render: renderContent },
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
    renderTab('screens');
  }
  function renderTab(id) { var t = TABS.filter(function (t) { return t.id === id; })[0]; if (t) t.render(document.getElementById('panel-' + id)); }

  /* ── SCREEN SIZES & PRICING (section 6 — exact figures) ── */
  function renderScreens(el) {
    el.innerHTML = '<div class="card"><h3>Screen bundles</h3><div class="sub">Prices are one-off, exactly as agreed with the business — do not round or estimate when editing.</div>'
      + cfg.screenSizes.map(function (s, i) {
        return '<div style="padding:14px 0;border-bottom:1px solid var(--line)"><div class="grid2">'
          + '<div class="field"><label>Label</label><input type="text" data-screen="' + i + '|label" value="' + esc(s.label) + '"></div>'
          + '<div class="field"><label>Price (£, blank = "Contact us")</label><input type="number" step="0.01" data-screen="' + i + '|price" value="' + (s.price != null ? s.price : '') + '"></div>'
          + '</div><div class="field"><label>Includes (comma-separated)</label><input type="text" data-screen-includes="' + i + '" value="' + esc(s.includes.join(', ')) + '"></div></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-screen]').forEach(function (input) {
      input.onchange = function () {
        var p = input.dataset.screen.split('|'), i = +p[0], key = p[1];
        cfg.screenSizes[i][key] = key === 'price' ? (input.value === '' ? null : parseFloat(input.value)) : input.value;
        persist('Updated screen size ' + key);
      };
    });
    el.querySelectorAll('[data-screen-includes]').forEach(function (input) {
      input.onchange = function () { cfg.screenSizes[+input.dataset.screenIncludes].includes = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated screen includes'); };
    });
  }

  /* ── SERVICES REQUIRED ── */
  function renderServices(el) {
    el.innerHTML = '<div class="card"><h3>Services required (shown on the quiz)</h3><div class="sub">"Needs a screen size" controls whether the screen-size question appears when this service is selected.</div>'
      + cfg.services.map(function (s, i) {
        return '<div style="display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px solid var(--line)"><input type="text" data-svc-name="' + i + '" value="' + esc(s.name) + '" style="flex:1">'
          + '<label style="display:inline-flex;align-items:center;gap:8px;font-size:12.5px;color:#cfd6c5;text-transform:none;font-weight:500;white-space:nowrap"><input type="checkbox" data-svc-hw="' + i + '" ' + (s.hardware ? 'checked' : '') + '> Needs a screen size</label></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-svc-name]').forEach(function (input) { input.onchange = function () { cfg.services[+input.dataset.svcName].name = input.value; persist('Updated service name'); }; });
    el.querySelectorAll('[data-svc-hw]').forEach(function (cb) { cb.onchange = function () { cfg.services[+cb.dataset.svcHw].hardware = cb.checked; persist('Updated service hardware flag'); }; });
  }

  /* ── DESIGN SERVICES & BUSINESS CATEGORIES ── */
  function renderDesign(el) {
    el.innerHTML = '<div class="card"><h3>Design services</h3><div class="sub">"Relevant business types" highlights this service as matching those business types on the results page. Leave blank to show it as relevant to every business type.</div>'
      + cfg.designServices.map(function (d, i) {
        return '<div style="padding:14px 0;border-bottom:1px solid var(--line)"><div class="field"><label>Name</label><input type="text" data-ds="' + i + '|name" value="' + esc(d.name) + '"></div>'
          + '<div class="field"><label>Suitable for (text)</label><input type="text" data-ds="' + i + '|suitableFor" value="' + esc(d.suitableFor) + '"></div>'
          + '<div class="field"><label>Relevant business type ids (comma-separated, blank = all)</label><input type="text" data-ds-relevant="' + i + '" value="' + esc(d.relevantBusinessTypes.join(', ')) + '"></div></div>';
      }).join('') + '</div>'
      + '<div class="card"><h3>Business Types</h3>' + cfg.businessTypes.map(function (b, i) {
        return '<div style="display:flex;gap:8px;margin-bottom:8px;align-items:center"><input type="text" data-biz="' + i + '" value="' + esc(b.name) + '" style="flex:1"><span class="badge">' + esc(b.id) + '</span></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-ds]').forEach(function (input) { input.onchange = function () { var p = input.dataset.ds.split('|'); cfg.designServices[+p[0]][p[1]] = input.value; persist('Updated design service'); }; });
    el.querySelectorAll('[data-ds-relevant]').forEach(function (input) {
      input.onchange = function () { cfg.designServices[+input.dataset.dsRelevant].relevantBusinessTypes = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated relevant business types'); };
    });
    el.querySelectorAll('[data-biz]').forEach(function (input) { input.onchange = function () { cfg.businessTypes[+input.dataset.biz].name = input.value; persist('Renamed business type'); }; });
  }

  /* ── CONTENT ── */
  function renderContent(el) {
    el.innerHTML = '<div class="card"><h3>Hero</h3>'
      + '<div class="field"><label>Headline</label><input type="text" data-hero="headline" value="' + esc(cfg.hero.headline) + '"></div>'
      + '<div class="field"><label>Subheading</label><textarea data-hero="subheading">' + esc(cfg.hero.subheading) + '</textarea></div>'
      + '<div class="grid2"><div class="field"><label>Primary button</label><input type="text" data-hero="primaryBtn" value="' + esc(cfg.hero.primaryBtn) + '"></div><div class="field"><label>Secondary button</label><input type="text" data-hero="secondaryBtn" value="' + esc(cfg.hero.secondaryBtn) + '"></div></div></div>'
      + '<div class="card"><h3>Features (shown on every design)</h3><input type="text" id="featuresInput" value="' + esc(cfg.features.join(', ')) + '"></div>'
      + '<div class="card"><h3>Why Choose Plemmo</h3>' + cfg.whyChoose.map(function (w, i) {
        return '<div style="display:flex;gap:8px;margin-bottom:8px"><input type="text" data-why="' + i + '|title" value="' + esc(w.title) + '" style="flex:1"><input type="text" data-why="' + i + '|text" value="' + esc(w.text) + '" style="flex:2"></div>';
      }).join('') + '</div>'
      + '<div class="card"><h3>Service Cards</h3>' + cfg.serviceCards.map(function (c, i) {
        return '<div style="padding:10px 0;border-bottom:1px solid var(--line)"><div class="field"><label>Name</label><input type="text" data-svccard="' + i + '|name" value="' + esc(c.name) + '"></div><div class="field"><label>Bullets (comma-separated)</label><input type="text" data-svccard-bullets="' + i + '" value="' + esc(c.bullets.join(', ')) + '"></div></div>';
      }).join('') + '</div>';
    el.querySelectorAll('[data-hero]').forEach(function (input) { input.onchange = function () { cfg.hero[input.dataset.hero] = input.value; persist('Updated hero ' + input.dataset.hero); }; });
    document.getElementById('featuresInput').onchange = function (e) { cfg.features = e.target.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated features list'); };
    el.querySelectorAll('[data-why]').forEach(function (input) { input.onchange = function () { var p = input.dataset.why.split('|'); cfg.whyChoose[+p[0]][p[1]] = input.value; persist('Updated Why Choose Plemmo item'); }; });
    el.querySelectorAll('[data-svccard]').forEach(function (input) { input.onchange = function () { var p = input.dataset.svccard.split('|'); cfg.serviceCards[+p[0]][p[1]] = input.value; persist('Updated service card'); }; });
    el.querySelectorAll('[data-svccard-bullets]').forEach(function (input) { input.onchange = function () { cfg.serviceCards[+input.dataset.svccardBullets].bullets = input.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean); persist('Updated service card bullets'); }; });
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
      wrap.innerHTML = '<table><thead><tr><th>Date</th><th>Business</th><th>Contact</th><th>Services</th><th>Screen size</th><th>Screens needed</th><th>Status</th><th></th></tr></thead><tbody>'
        + filtered.map(function (l) {
          return '<tr>'
            + '<td>' + new Date(l.createdAt).toLocaleDateString('en-GB') + '</td>'
            + '<td>' + esc(l.businessName) + '</td>'
            + '<td>' + esc(l.contactName) + '<br><span class="sub">' + esc(l.email) + ' · ' + esc(l.mobile) + '</span></td>'
            + '<td>' + esc((l.serviceIds || []).join(', ')) + '</td>'
            + '<td>' + esc(l.screenSizeId || '—') + '</td>'
            + '<td>' + esc(l.numberOfScreens || '—') + '</td>'
            + '<td><select data-lead-status="' + l.id + '"><option value="new"' + (l.status === 'new' ? ' selected' : '') + '>New</option><option value="reviewed"' + (l.status === 'reviewed' ? ' selected' : '') + '>Reviewed</option><option value="contacted"' + (l.status === 'contacted' ? ' selected' : '') + '>Contacted</option></select></td>'
            + '<td><button class="btn small danger" data-lead-del="' + l.id + '">Delete</button></td></tr>';
        }).join('') + '</tbody></table>';
      wrap.querySelectorAll('[data-lead-status]').forEach(function (sel) { sel.onchange = function () { STORE.updateLead(sel.dataset.leadStatus, { status: sel.value }); toast('Lead status updated'); }; });
      wrap.querySelectorAll('[data-lead-del]').forEach(function (btn) { btn.onclick = function () { if (!confirm('Delete this lead?')) return; STORE.deleteLead(btn.dataset.leadDel); leads = STORE.getLeads(); draw(); }; });
    }
    document.getElementById('leadSearch').oninput = draw;
    document.getElementById('leadStatusFilter').onchange = draw;
    document.getElementById('exportLeadsBtn').onclick = function () { download('plemmo-signage-leads.csv', STORE.leadsToCSV(), 'text/csv'); };
    draw();
  }

  function renderAudit(el) {
    var log = STORE.getAudit();
    if (!log.length) { el.innerHTML = '<div class="card"><div class="sub">No changes logged yet.</div></div>'; return; }
    el.innerHTML = '<div class="card"><h3>Change history</h3><div class="sub">Every pricing, service, design and content change made in this browser — newest first.</div>' + log.map(function (a) { return '<div class="audit-item"><span class="cat">' + esc(a.category) + '</span>' + esc(a.detail) + '<span class="ts">' + new Date(a.ts).toLocaleString('en-GB') + '</span></div>'; }).join('') + '</div>';
  }

  function renderBackup(el) {
    el.innerHTML = '<div class="card"><h3>Export configuration</h3><div class="sub">Download the current screen sizes, services, pricing and content as JSON.</div><button class="btn primary" id="exportCfgBtn"><iconify-icon icon="ph:download-simple"></iconify-icon> Export config JSON</button></div>'
      + '<div class="card"><h3>Import configuration</h3><div class="sub">Replaces everything in this browser with the contents of the file.</div><input type="file" id="importCfgFile" accept="application/json"></div>'
      + '<div class="card"><h3>Reset to defaults</h3><div class="sub">Discards every local change in this browser.</div><button class="btn danger" id="resetCfgBtn">Reset to defaults</button></div>'
      + '<div class="card"><h3>Change admin passcode</h3><div class="grid2"><div class="field"><label>New passcode</label><input type="password" id="newPass"></div></div><button class="btn small" id="setPassBtn">Update passcode</button></div>';
    document.getElementById('exportCfgBtn').onclick = function () { download('plemmo-signage-config.json', STORE.exportConfigJSON(), 'application/json'); };
    document.getElementById('importCfgFile').onchange = function (e) {
      var file = e.target.files[0]; if (!file) return;
      var reader = new FileReader();
      reader.onload = function () { try { STORE.importConfigJSON(reader.result); toast('Configuration imported'); location.reload(); } catch (err) { alert('Import failed: ' + err.message); } };
      reader.readAsText(file);
    };
    document.getElementById('resetCfgBtn').onclick = function () { if (!confirm('Reset all Digital Signage configuration to defaults? This cannot be undone.')) return; STORE.resetConfig(); toast('Reset to defaults'); location.reload(); };
    document.getElementById('setPassBtn').onclick = function () {
      var v = document.getElementById('newPass').value;
      if (!v || v.length < 4) { alert('Choose a passcode at least 4 characters long.'); return; }
      STORE.setPasscode(v); toast('Passcode updated'); document.getElementById('newPass').value = '';
    };
  }
})();
