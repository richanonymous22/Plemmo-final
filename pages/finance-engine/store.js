/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS FINANCE & FUNDING — browser-local store
   ────────────────────────────────────────────────────────────────────────
   Same browser-local bridge pattern as the other recommendation modules —
   independent storage keys, independent file, no shared code. This site
   has no backend/database; the admin panel edits a working copy of
   config.js persisted here. Leads and the audit log live here too.
   Not real multi-user infrastructure — one browser/device only.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var K_CONFIG = 'plemmo_finance_config_v1';
  var K_LEADS = 'plemmo_finance_leads_v1';
  var K_AUDIT = 'plemmo_finance_audit_v1';
  var K_PASS = 'plemmo_finance_admin_pass_v1';
  var K_UNLOCK = 'plemmo_finance_admin_unlocked';
  var DEFAULT_PASSCODE = 'plemmo2026';

  function readJSON(key, fallback) { try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch (e) { return false; } }
  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }
  function uid() { return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 9); }
  function nowISO() { return new Date().toISOString(); }

  function getConfig() { var stored = readJSON(K_CONFIG, null); return stored || clone(global.PLEMMO_FINANCE_CONFIG); }
  function isConfigCustomised() { return readJSON(K_CONFIG, null) !== null; }
  function saveConfig(newConfig, auditDetail) { writeJSON(K_CONFIG, newConfig); appendAudit('config', auditDetail || 'Configuration updated'); }
  function resetConfig() { try { localStorage.removeItem(K_CONFIG); } catch (e) {} appendAudit('config', 'Configuration reset to defaults'); }
  function exportConfigJSON() { return JSON.stringify(getConfig(), null, 2); }
  function importConfigJSON(jsonString) {
    var parsed = JSON.parse(jsonString);
    if (!parsed || !parsed.products || !parsed.fundingPurposes) throw new Error('That file does not look like a Business Finance config export.');
    saveConfig(parsed, 'Configuration imported from file');
    return parsed;
  }

  function getLeads() { return readJSON(K_LEADS, []); }
  function addLead(lead) {
    var leads = getLeads();
    var record = Object.assign({ id: uid(), createdAt: nowISO(), status: 'new' }, lead);
    leads.unshift(record); writeJSON(K_LEADS, leads);
    appendAudit('lead', 'New lead captured: ' + (lead.businessName || lead.contactName || record.id));
    return record;
  }
  function updateLead(id, patch) {
    var leads = getLeads();
    for (var i = 0; i < leads.length; i++) { if (leads[i].id === id) { leads[i] = Object.assign({}, leads[i], patch); writeJSON(K_LEADS, leads); appendAudit('lead', 'Lead updated: ' + id); return leads[i]; } }
    return null;
  }
  function deleteLead(id) { writeJSON(K_LEADS, getLeads().filter(function (l) { return l.id !== id; })); appendAudit('lead', 'Lead deleted: ' + id); }
  function leadsToCSV() {
    var leads = getLeads();
    var cols = ['id', 'createdAt', 'status', 'businessName', 'contactName', 'telephone', 'email', 'fundingAmountId', 'fundingPurposeId', 'turnoverBandId', 'timeTradingId', 'recommendedProductIds', 'needsReview', 'notes'];
    var rows = [cols.join(',')];
    leads.forEach(function (l) {
      rows.push(cols.map(function (c) { var v = l[c]; if (Array.isArray(v)) v = v.join('|'); v = (v === undefined || v === null) ? '' : String(v); return '"' + v.replace(/"/g, '""') + '"'; }).join(','));
    });
    return rows.join('\r\n');
  }

  function getAudit() { return readJSON(K_AUDIT, []); }
  function appendAudit(category, detail) {
    var log = readJSON(K_AUDIT, []);
    log.unshift({ id: uid(), ts: nowISO(), category: category, detail: detail });
    if (log.length > 500) log = log.slice(0, 500);
    writeJSON(K_AUDIT, log);
  }

  function getPasscode() { return localStorage.getItem(K_PASS) || DEFAULT_PASSCODE; }
  function setPasscode(newPass) { localStorage.setItem(K_PASS, newPass); appendAudit('admin', 'Admin passcode changed'); }
  function checkPasscode(attempt) { return attempt === getPasscode(); }
  function isUnlocked() { return sessionStorage.getItem(K_UNLOCK) === 'true'; }
  function unlock() { sessionStorage.setItem(K_UNLOCK, 'true'); appendAudit('admin', 'Admin session unlocked'); }
  function lock() { sessionStorage.removeItem(K_UNLOCK); }

  global.PLEMMO_FINANCE_STORE = {
    getConfig: getConfig, isConfigCustomised: isConfigCustomised, saveConfig: saveConfig,
    resetConfig: resetConfig, exportConfigJSON: exportConfigJSON, importConfigJSON: importConfigJSON,
    getLeads: getLeads, addLead: addLead, updateLead: updateLead, deleteLead: deleteLead, leadsToCSV: leadsToCSV,
    getAudit: getAudit, appendAudit: appendAudit,
    getPasscode: getPasscode, setPasscode: setPasscode, checkPasscode: checkPasscode,
    isUnlocked: isUnlocked, unlock: unlock, lock: lock,
    DEFAULT_PASSCODE: DEFAULT_PASSCODE
  };
})(window);
