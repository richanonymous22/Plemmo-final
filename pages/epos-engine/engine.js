/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · EPOS RECOMMENDATION ENGINE — rules engine
   ────────────────────────────────────────────────────────────────────────
   Pure, config-driven functions — independent from the Card Machine
   Recommendation Engine (Phase 1). Recommendations are keyed on business
   category ONLY: no turnover, no business-size filter, no scoring. The
   one hard-coded invariant (by design, per the brief's Developer Rules)
   is that an active Plemmo package always sorts first for its category —
   everything else about ordering comes from config.rules.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

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

  function resolveFeatureGroups(config, pkg) {
    if (pkg.featureGroups === 'plemmoCoreFeatureGroups') return config.plemmoCoreFeatureGroups;
    if (pkg.featureGroups === 'plemmoCoreFeatureGroups+hospitality') {
      return config.plemmoCoreFeatureGroups.concat([config.plemmoHospitalityFeatureGroup]);
    }
    return pkg.featureGroups || [];
  }

  function cardMachineInfo(config, pkg) {
    return config.cardMachineMessages[pkg.cardMachine] || null;
  }

  function isPackageEligible(config, pkg, categoryId) {
    if (!pkg.active) return false;
    if (pkg.categories.indexOf(categoryId) === -1) return false;
    var provider = config.providers[pkg.providerId];
    return !!(provider && provider.active);
  }

  function packageIdsForCategory(config, categoryId) {
    var ids = [];
    for (var id in config.packages) {
      if (config.packages.hasOwnProperty(id) && isPackageEligible(config, config.packages[id], categoryId)) ids.push(id);
    }
    return ids;
  }

  function formatPackage(config, pkgId) {
    var pkg = config.packages[pkgId];
    if (!pkg) return null;
    var provider = config.providers[pkg.providerId];
    return {
      id: pkg.id,
      providerId: pkg.providerId,
      providerName: provider ? provider.name : pkg.providerId,
      logo: provider ? provider.logo : null,
      name: pkg.name,
      hardwarePrice: pkg.hardwarePrice,
      monthlySoftwareFee: pkg.monthlySoftwareFee,
      hardwareIncluded: pkg.hardwareIncluded || [],
      hardwareOptional: pkg.hardwareOptional || [],
      promotions: pkg.promotions || [],
      cardMachine: cardMachineInfo(config, pkg),
      featureGroups: resolveFeatureGroups(config, pkg)
    };
  }

  /* Main entry point: category in, ordered + formatted packages out.
     Business type is accepted for context/lead-capture only — per the
     brief, it never changes which packages are recommended or their
     order (section 4: "No other conditions may influence recommendation
     order"). */
  function recommend(config, categoryId) {
    var eligibleIds = packageIdsForCategory(config, categoryId);
    var rule = config.rules[categoryId];
    var priority = (rule && rule.priority) ? rule.priority.slice() : [];

    /* Ordered: configured priority first (filtered to eligible), then any
       eligible package the admin hasn't ranked yet (so a newly-added
       package still shows up instead of silently disappearing). */
    var ordered = priority.filter(function (id) { return eligibleIds.indexOf(id) !== -1; });
    eligibleIds.forEach(function (id) { if (ordered.indexOf(id) === -1) ordered.push(id); });

    /* Hard invariant: an eligible Plemmo package is always first. */
    var plemmoIndex = -1;
    for (var i = 0; i < ordered.length; i++) {
      if (config.packages[ordered[i]].providerId === 'plemmo') { plemmoIndex = i; break; }
    }
    if (plemmoIndex > 0) {
      var plemmoId = ordered.splice(plemmoIndex, 1)[0];
      ordered.unshift(plemmoId);
    }

    var packages = ordered.map(function (id) { return formatPackage(config, id); });
    return { categoryId: categoryId, packages: packages, fallback: packages.length === 0 };
  }

  global.PLEMMO_EPOS_ENGINE = {
    findCategory: findCategory,
    findType: findType,
    resolveFeatureGroups: resolveFeatureGroups,
    packageIdsForCategory: packageIdsForCategory,
    formatPackage: formatPackage,
    recommend: recommend
  };
})(window);
