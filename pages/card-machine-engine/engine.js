/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · CARD MACHINE RECOMMENDATION ENGINE — rules engine
   ────────────────────────────────────────────────────────────────────────
   Pure, config-driven functions. Nothing in this file references a
   provider name, rate or rule directly — everything is read from the
   config object passed in (the caller decides whether that's the default
   config.js or the admin-edited copy from store.js). This keeps the
   engine testable and keeps recommendation logic in one place instead of
   scattered through page markup.

   Kept separate from the EPOS Recommendation Engine (Phase 2) by design —
   do not share this module with EPOS code.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* Find the category object a business type belongs to. */
  function findCategory(config, categoryId) {
    for (var i = 0; i < config.categories.length; i++) {
      if (config.categories[i].id === categoryId) return config.categories[i];
    }
    return null;
  }

  function findType(category, typeId) {
    if (!category) return null;
    for (var i = 0; i < category.types.length; i++) {
      if (category.types[i].id === typeId) return category.types[i];
    }
    return null;
  }

  /* section 6 — ATV classification lookup */
  function classifyATV(config, categoryId, typeId) {
    var cat = findCategory(config, categoryId);
    var type = findType(cat, typeId);
    return type ? type.atv : null;
  }

  /* "Extend forward" band lookup: the row with the greatest min <= value.
     This lets published rate tables with non-contiguous tiers (a gap
     between two bands) still resolve deterministically without inventing
     a new number — the last published tier keeps applying until the next
     explicit tier begins. Returns null if value is below the first tier. */
  function lookupBand(table, value) {
    if (!table || !table.length) return null;
    var best = null;
    for (var i = 0; i < table.length; i++) {
      var row = table[i];
      if (value >= row.min && (best === null || row.min >= best.min)) best = row;
    }
    return best;
  }

  function turnoverValueForBand(config, bandId) {
    for (var i = 0; i < config.turnoverBands.length; i++) {
      if (config.turnoverBands[i].id === bandId) return config.turnoverBands[i].lookupValue;
    }
    return null;
  }

  /* ── Pricing lookups per provider (section 3 / 12) ── */
  function getBlendedPricing(provider, turnoverValue) {
    if (provider.id === 'teya') {
      var row = lookupBand(provider.blendedRateTable, turnoverValue);
      return row ? { rate: row.rate, note: null } : { rate: null, note: 'Contact us for a personalised quote' };
    }
    if (provider.id === 'shift4') {
      var rate = turnoverValue >= 10000 ? provider.blendedRateFrom10k : provider.blendedRateBelow10k;
      return { rate: rate, note: null };
    }
    if (provider.id === 'sumup') {
      /* SumUp never displays a rate table or figure — spec-mandated. */
      return { rate: null, note: null };
    }
    return { rate: null, note: null };
  }

  function getSplitPricing(provider, turnoverValue, atv) {
    var table = provider.id === 'worldpay' ? provider.splitRateTable : (provider.splitRateTable ? provider.splitRateTable[atv] : null);
    var row = lookupBand(table, turnoverValue);
    if (!row) return null;
    return {
      debit: row.debit, credit: row.credit, auth: row.auth,
      rental: 'rental' in row ? row.rental : (provider.standardRental != null ? provider.standardRental : null)
    };
  }

  /* Builds the full display-ready pricing block for a comparison card,
     respecting: blended providers never show debit/credit/auth; split
     providers always show it (Developer Rules). */
  function formatProviderPricing(config, providerId, turnoverValue, atv) {
    var provider = config.providers[providerId];
    if (!provider) return null;
    if (provider.pricingType === 'blended') {
      var b = getBlendedPricing(provider, turnoverValue);
      return {
        pricingType: 'blended',
        blendedRate: b.rate,
        note: b.note,
        rentalNote: provider.rentalNote || null,
        terminalOptions: provider.terminalOptions || null,
        contractOptions: provider.contractOptions || null,
        hardwareOptions: provider.hardwareOptions || null,
        settlementFee: provider.settlementFee || null,
        payoutOptions: provider.payoutOptions || null,
        deviceOptions: provider.deviceOptions || null,
        features: provider.features || []
      };
    }
    var s = getSplitPricing(provider, turnoverValue, atv);
    var promo = provider.promotions && provider.promotions.rentalPromo && provider.promotions.rentalPromo.active
      ? provider.promotions.rentalPromo : null;
    return {
      pricingType: 'split',
      debit: s ? s.debit : null,
      credit: s ? s.credit : null,
      authorisationFee: s ? s.auth : (provider.authorisationFee != null ? provider.authorisationFee : null),
      rental: s ? s.rental : (provider.standardRental != null ? provider.standardRental : null),
      rentalNote: provider.rentalNote || null,
      rentalPromo: promo,
      deviceOptions: provider.deviceOptions || null,
      contractOptions: provider.contractOptions || null,
      features: provider.features || []
    };
  }

  /* Rule 1/2: remove the merchant's current provider from a priority list.
     If that empties the list and a substitution is defined for the
     removed id, fall back to the substitute (used for the Food & Beverage
     "Below £5,000" band, where Shift4 is the only listed option). */
  function applyCurrentProviderExclusion(priority, currentProviderId, substitutions) {
    var filtered = priority.filter(function (id) { return id !== currentProviderId; });
    if (filtered.length === 0 && priority.length && substitutions) {
      var removed = priority[0];
      if (substitutions[removed] && substitutions[removed] !== currentProviderId) {
        filtered = [substitutions[removed]];
      }
    }
    return filtered;
  }

  function activeProviderIds(config) {
    var ids = [];
    for (var id in config.providers) {
      if (config.providers.hasOwnProperty(id) && config.providers[id].active) ids.push(id);
    }
    return ids;
  }

  /* ── Main entry point ──
     answers: {
       categoryId, typeId, turnoverBandId, currentProviderId,
       charityNoRental: true|false|null,
       foodBeveragePaymentMethod: 'moto'|'pay-by-link'|'neither'|null
     }
  */
  function recommend(config, answers) {
    var category = findCategory(config, answers.categoryId);
    var type = findType(category, answers.typeId);
    var atv = type ? type.atv : 'low';
    var turnoverValue = turnoverValueForBand(config, answers.turnoverBandId);
    var currentProviderId = (answers.currentProviderId && answers.currentProviderId !== 'none' && answers.currentProviderId !== 'other')
      ? answers.currentProviderId : null;

    var priority = [];
    var ruleUsed = '';
    var substitutions = null;

    if (category && category.id === 'charity-non-profit') {
      if (answers.charityNoRental === true) {
        priority = config.rules.charity.onYes.priority.slice();
        ruleUsed = 'charity-no-rental';
      } else if (config.rules.charity.onNo.priority && config.rules.charity.onNo.priority.length) {
        /* Admin has explicitly configured a priority for "No" — use it. */
        priority = config.rules.charity.onNo.priority.slice();
        ruleUsed = 'charity-default-configured';
      } else {
        /* No dedicated rule for "No" (the brief only specifies the "Yes"
           branch) — same graceful fallback as an unconfigured category,
           not the hard no-match state. Rule 1 still applies below. */
        priority = activeProviderIds(config);
        ruleUsed = 'charity-default-unranked-fallback';
      }
    } else if (category && category.id === 'food-beverage') {
      if (answers.foodBeveragePaymentMethod === 'moto') {
        priority = config.rules.foodBeverage.moto.priority.slice();
        ruleUsed = 'food-beverage-moto';
      } else {
        var row = null;
        var table = config.rules.foodBeverage.turnoverTable;
        for (var i = 0; i < table.length; i++) {
          if (table[i].band === answers.turnoverBandId) { row = table[i]; break; }
        }
        priority = row ? row.priority.slice() : [];
        substitutions = row ? row.substitutions : null;
        ruleUsed = 'food-beverage-turnover';
      }
    } else if (category) {
      var byCat = config.rules.byCategory && config.rules.byCategory[category.id];
      if (byCat && byCat.priority && byCat.priority.length) {
        priority = byCat.priority.slice();
        ruleUsed = 'category-configured';
      } else {
        /* No admin-defined priority for this category yet — offer every
           active, eligible provider unranked rather than inventing a
           turnover-based order the brief doesn't specify. */
        priority = activeProviderIds(config);
        ruleUsed = 'category-unranked-fallback';
      }
    }

    var active = activeProviderIds(config);
    priority = priority.filter(function (id) { return active.indexOf(id) !== -1; });
    priority = applyCurrentProviderExclusion(priority, currentProviderId, substitutions);
    /* Belt and braces — Rule 1 must hold even after substitution/fallback. */
    priority = priority.filter(function (id) { return id !== currentProviderId; });

    var fallback = priority.length === 0;
    var providers = priority.map(function (id) {
      return {
        id: id,
        provider: config.providers[id],
        pricing: formatProviderPricing(config, id, turnoverValue, atv)
      };
    });

    return {
      categoryId: answers.categoryId, typeId: answers.typeId, atv: atv,
      turnoverBandId: answers.turnoverBandId, turnoverValue: turnoverValue,
      currentProviderId: currentProviderId, ruleUsed: ruleUsed,
      providers: providers, fallback: fallback
    };
  }

  global.PLEMMO_CME_ENGINE = {
    findCategory: findCategory,
    findType: findType,
    classifyATV: classifyATV,
    lookupBand: lookupBand,
    turnoverValueForBand: turnoverValueForBand,
    formatProviderPricing: formatProviderPricing,
    activeProviderIds: activeProviderIds,
    recommend: recommend
  };
})(window);
