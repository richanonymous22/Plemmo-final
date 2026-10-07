/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS ENERGY — rules engine
   ────────────────────────────────────────────────────────────────────────
   Pure, config-driven. Never returns a live/numeric price — only a
   recommended solution type (Fixed or Flexible Energy Contract).
   Independent from every other recommendation module.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  /* answers: { businessTypeId, energyRequiredId, currentSupplierId,
     contractStatusId, annualSpendBandId, locationCountBandId,
     meterTypeId, tariffTypeId } */
  function recommend(config, answers) {
    var rules = config.rules;
    var isHighSpend = rules.flexibleTriggerSpendBands.indexOf(answers.annualSpendBandId) !== -1;
    var isMultiSite = rules.flexibleTriggerLocationBands.indexOf(answers.locationCountBandId) !== -1;
    var recommendedId = (isHighSpend || isMultiSite) ? 'flexible' : 'fixed';
    var otherId = recommendedId === 'flexible' ? 'fixed' : 'flexible';

    return {
      recommendedId: recommendedId,
      solutions: [config.solutionTypes[recommendedId], config.solutionTypes[otherId]],
      reason: isHighSpend ? 'high-annual-spend' : (isMultiSite ? 'multi-site' : 'standard-single-site')
    };
  }

  global.PLEMMO_ENERGY_ENGINE = { recommend: recommend };
})(window);
