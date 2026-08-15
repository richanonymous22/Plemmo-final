/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS FINANCE & FUNDING — rules engine
   ────────────────────────────────────────────────────────────────────────
   Pure, config-driven. Recommends finance PRODUCTS only — this file must
   never reference a lender name, a rate, an APR, or compute a repayment
   figure. Independent from every other recommendation module.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function activeProductIds(config) {
    var ids = [];
    for (var id in config.products) { if (config.products.hasOwnProperty(id) && config.products[id].active) ids.push(id); }
    return ids;
  }

  /* Recommendation is driven by funding purpose only, per the brief's
     qualification-form-to-recommendation flow. Other answers (amount,
     business type, sector, turnover, time trading) are carried through
     to the lead for the manual-review team but do not change which
     products are suggested — there is no automated matching to a named
     partner, only a suggested product type. */
  function recommend(config, answers) {
    var rule = config.rules.byPurpose[answers.fundingPurposeId];
    var active = activeProductIds(config);
    var priority = (rule ? rule.priority.slice() : []).filter(function (id) { return active.indexOf(id) !== -1; });

    /* No configured rule for this purpose (or every configured product is
       inactive) — fall back to every active product, unranked, rather
       than showing nothing. */
    if (priority.length === 0) priority = active.slice();

    var products = priority.map(function (id) { return config.products[id]; });
    return { fundingPurposeId: answers.fundingPurposeId, products: products, fallback: products.length === 0 };
  }

  global.PLEMMO_FINANCE_ENGINE = {
    findById: findById,
    activeProductIds: activeProductIds,
    recommend: recommend
  };
})(window);
