/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · DIGITAL SIGNAGE & MENU DESIGN — configurator logic
   ────────────────────────────────────────────────────────────────────────
   Pure, config-driven. This is a guided configurator, not a scored
   recommendation engine — every path ends at the lead form, never a
   checkout. Independent from every other recommendation module.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function findById(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
    return null;
  }

  function selectedServices(config, serviceIds) {
    return (serviceIds || []).map(function (id) { return findById(config.services, id); }).filter(Boolean);
  }

  function needsScreenSize(config, serviceIds) {
    return selectedServices(config, serviceIds).some(function (s) { return s.hardware; });
  }

  /* answers: { businessTypeId, serviceIds: [...], screenSizeId } */
  function buildResult(config, answers) {
    var services = selectedServices(config, answers.serviceIds);
    var wantsHardware = needsScreenSize(config, answers.serviceIds);
    var screen = wantsHardware ? findById(config.screenSizes, answers.screenSizeId) : null;

    var relevantDesign = config.designServices.map(function (d) {
      var relevant = !d.relevantBusinessTypes.length || d.relevantBusinessTypes.indexOf(answers.businessTypeId) !== -1;
      return { service: d, relevant: relevant };
    });
    /* Show relevant-to-this-business-type design services first. */
    relevantDesign.sort(function (a, b) { return (b.relevant ? 1 : 0) - (a.relevant ? 1 : 0); });

    var wantsDesignOnly = services.some(function (s) { return !s.hardware; });

    return {
      businessTypeId: answers.businessTypeId,
      services: services,
      wantsHardware: wantsHardware,
      screen: screen,
      wantsDesignOnly: wantsDesignOnly,
      designServices: relevantDesign,
      features: config.features,
      fallback: services.length === 0
    };
  }

  global.PLEMMO_SIGNAGE_ENGINE = {
    findById: findById,
    selectedServices: selectedServices,
    needsScreenSize: needsScreenSize,
    buildResult: buildResult
  };
})(window);
