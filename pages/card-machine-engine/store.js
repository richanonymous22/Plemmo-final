/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · CARD MACHINE RECOMMENDATION ENGINE — browser-local store
   ────────────────────────────────────────────────────────────────────────
   This site has no backend, server or database. Per the agreed approach
   for this phase, the admin panel edits a working copy of config.js that
   lives in this browser's localStorage (export/import JSON to move it
   between browsers, or hand to a developer to bake into config.js
   permanently). Leads and the change-log/audit trail live here too.

   IMPORTANT — this is a convenience layer for one browser/device, not a
   real multi-user backend: it does not sync between visitors, does not
   survive "clear browsing data", and the admin passcode below is a soft
   deterrent, not real authentication. Treat this as a bridge until a
   proper backend + database is built for the admin panel, leads and
   audit log described in the Phase 1 brief.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var K_CONFIG = 'plemmo_cme_config_v1';
  var K_LEADS = 'plemmo_cme_leads_v1';
  var K_AUDIT = 'plemmo_cme_audit_v1';
  var K_PASS = 'plemmo_cme_admin_pass_v1';
  var K_UNLOCK = 'plemmo_cme_admin_unlocked';
  var DEFAULT_PASSCODE = 'plemmo2026';

  function readJSON(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }
  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function uid() { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9); }
  function nowISO() { return new Date().toISOString(); }

  /* ── CONFIG ── */
  function getConfig() {
    var stored = readJSON(K_CONFIG, null);
    return stored || clone(global.PLEMMO_CME_CONFIG);
  }
  function isConfigCustomised() { return readJSON(K_CONFIG, null) !== null; }
  function saveConfig(newConfig, auditDetail) {
    writeJSON(K_CONFIG, newConfig);
    appendAudit('config', auditDetail || 'Configuration updated');
  }
  function resetConfig() {
    try { localStorage.removeItem(K_CONFIG); } catch (e) {}
    appendAudit('config', 'Configuration reset to defaults');
  }
  function exportConfigJSON() { return JSON.stringify(getConfig(), null, 2); }
  function importConfigJSON(jsonString) {
    var parsed = JSON.parse(jsonString); /* let caller catch */
    if (!parsed || !parsed.providers || !parsed.categories) {
      throw new Error('That file does not look like a Card Machine Engine config export.');
    }
    saveConfig(parsed, 'Configuration imported from file');
    return parsed;
  }

  /* ── LEADS ── */
  function getLeads() { return readJSON(K_LEADS, []); }
  function addLead(lead) {
    var leads = getLeads();
    var record = Object.assign({
      id: uid(), createdAt: nowISO(), status: 'new'
    }, lead);
    leads.unshift(record);
    writeJSON(K_LEADS, leads);
    appendAudit('lead', 'New lead captured: ' + (lead.businessName || lead.contactName || record.id));
    return record;
  }
  function updateLead(id, patch) {
    var leads = getLeads();
    for (var i = 0; i < leads.length; i++) {
      if (leads[i].id === id) {
        leads[i] = Object.assign({}, leads[i], patch);
        writeJSON(K_LEADS, leads);
        appendAudit('lead', 'Lead updated: ' + id);
        return leads[i];
      }
    }
    return null;
  }
  function deleteLead(id) {
    var leads = getLeads().filter(function (l) { return l.id !== id; });
    writeJSON(K_LEADS, leads);
    appendAudit('lead', 'Lead deleted: ' + id);
  }
  function leadsToCSV() {
    var leads = getLeads();
    var cols = ['id', 'createdAt', 'status', 'businessName', 'contactName', 'mobile', 'email',
      'categoryId', 'typeId', 'turnoverBandId', 'currentProviderId', 'recommendedProviderIds', 'needsReview', 'notes'];
    var rows = [cols.join(',')];
    leads.forEach(function (l) {
      rows.push(cols.map(function (c) {
        var v = l[c];
        if (Array.isArray(v)) v = v.join('|');
        v = (v === undefined || v === null) ? '' : String(v);
        return '"' + v.replace(/"/g, '""') + '"';
      }).join(','));
    });
    return rows.join('\r\n');
  }

  /* ── AUDIT LOG (section 16 — logging & auditing) ── */
  function getAudit() { return readJSON(K_AUDIT, []); }
  function appendAudit(category, detail) {
    var log = readJSON(K_AUDIT, []);
    log.unshift({ id: uid(), ts: nowISO(), category: category, detail: detail });
    if (log.length > 500) log = log.slice(0, 500); /* keep it bounded */
    writeJSON(K_AUDIT, log);
  }

  /* ── ADMIN PASSCODE (soft gate, not real auth — see file header) ── */
  function getPasscode() { return localStorage.getItem(K_PASS) || DEFAULT_PASSCODE; }
  function setPasscode(newPass) {
    localStorage.setItem(K_PASS, newPass);
    appendAudit('admin', 'Admin passcode changed');
  }
  function checkPasscode(attempt) { return attempt === getPasscode(); }
  function isUnlocked() { return sessionStorage.getItem(K_UNLOCK) === 'true'; }
  function unlock() { sessionStorage.setItem(K_UNLOCK, 'true'); appendAudit('admin', 'Admin session unlocked'); }
  function lock() { sessionStorage.removeItem(K_UNLOCK); }

  global.PLEMMO_CME_STORE = {
    getConfig: getConfig, isConfigCustomised: isConfigCustomised, saveConfig: saveConfig,
    resetConfig: resetConfig, exportConfigJSON: exportConfigJSON, importConfigJSON: importConfigJSON,
    getLeads: getLeads, addLead: addLead, updateLead: updateLead, deleteLead: deleteLead, leadsToCSV: leadsToCSV,
    getAudit: getAudit, appendAudit: appendAudit,
    getPasscode: getPasscode, setPasscode: setPasscode, checkPasscode: checkPasscode,
    isUnlocked: isUnlocked, unlock: unlock, lock: lock,
    DEFAULT_PASSCODE: DEFAULT_PASSCODE
  };
})(window);
