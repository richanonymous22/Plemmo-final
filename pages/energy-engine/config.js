/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS ENERGY — default configuration
   ────────────────────────────────────────────────────────────────────────
   Phase 3, Module B. Independent from every other recommendation module
   on the site — no shared logic or codebase, only the site's visual
   design language.

   Per the brief: do NOT show live/real prices unless a broker API is
   integrated later. This module recommends a SOLUTION TYPE (Fixed or
   Flexible Energy Contract) — never a supplier, never a numeric quote.

   Note on the "Energy required" question: the brief lists it as
   checkboxes with options Electricity / Gas / Electricity & Gas. Having
   "Electricity & Gas" as an independent checkbox alongside the two single
   options is redundant as true multi-select (ticking both single boxes
   already means the same thing), so — to keep the UI unambiguous and
   consistent with every other single-answer step in this quiz — it's
   implemented as one single-choice question with those three options.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CONFIG = {
    version: 1,

    hero: {
      headline: 'Business Energy Made Simple',
      subheading: 'Compare electricity and gas prices from trusted UK suppliers and reduce your business energy costs in minutes.',
      primaryBtn: 'Compare Energy Prices',
      secondaryBtn: 'Request a Callback'
    },

    /* ── COMPARISON CALCULATOR QUESTIONS (section 2) ── */
    businessTypes: [
      { id: 'retail', name: 'Retail' },
      { id: 'restaurant-cafe', name: 'Restaurant/Café' },
      { id: 'office', name: 'Office' },
      { id: 'warehouse', name: 'Warehouse' },
      { id: 'industrial', name: 'Industrial' },
      { id: 'hotel', name: 'Hotel' },
      { id: 'healthcare', name: 'Healthcare' },
      { id: 'education', name: 'Education' },
      { id: 'other', name: 'Other' }
    ],
    energyRequiredOptions: [
      { id: 'electricity', name: 'Electricity' },
      { id: 'gas', name: 'Gas' },
      { id: 'electricity-gas', name: 'Electricity & Gas' }
    ],
    currentSuppliers: [
      { id: 'british-gas', name: 'British Gas' },
      { id: 'edf', name: 'EDF' },
      { id: 'eon-next', name: 'E.ON Next' },
      { id: 'scottishpower', name: 'ScottishPower' },
      { id: 'sse', name: 'SSE' },
      { id: 'octopus-energy', name: 'Octopus Energy' },
      { id: 'totalenergies', name: 'TotalEnergies' },
      { id: 'yu-energy', name: 'Yu Energy' },
      { id: 'utility-warehouse', name: 'Utility Warehouse' },
      { id: 'other', name: 'Other' }
    ],
    contractStatusOptions: [
      { id: 'in-contract', name: 'In Contract' },
      { id: 'out-of-contract', name: 'Out of Contract' },
      { id: 'ending-soon', name: 'Contract Ending Soon' },
      { id: 'not-sure', name: 'Not Sure' }
    ],
    annualSpendBands: [
      { id: 'under-2000', label: 'Under £2,000' },
      { id: '2000-5000', label: '£2,000–£5,000' },
      { id: '5000-10000', label: '£5,000–£10,000' },
      { id: '10000-20000', label: '£10,000–£20,000' },
      { id: '20000-50000', label: '£20,000–£50,000' },
      { id: 'above-50000', label: '£50,000+' }
    ],
    locationCountBands: [
      { id: '1', label: '1' },
      { id: '2-5', label: '2–5' },
      { id: '6-20', label: '6–20' },
      { id: 'above-20', label: '20+' }
    ],
    meterTypes: [
      { id: 'smart', name: 'Smart Meter' },
      { id: 'standard', name: 'Standard Meter' },
      { id: 'half-hourly', name: 'Half-Hourly Meter' },
      { id: 'not-sure', name: 'Not Sure' }
    ],
    tariffTypes: [
      { id: 'fixed', name: 'Fixed' },
      { id: 'variable', name: 'Variable' },
      { id: 'not-sure', name: 'Not Sure' }
    ],

    /* ── COMPARISON RESULT — solution types (section 3) ──
       No live prices. "Recommend Flexible when..." is an explicit,
       admin-editable rule built from the brief's qualitative criteria
       ("Large businesses, Multi-site businesses, High energy users"),
       operationalised against the two quantitative answers available
       (annual spend, number of locations). */
    solutionTypes: {
      fixed: {
        id: 'fixed', name: 'Fixed Energy Contract',
        suitableFor: 'Restaurants, Retail, Offices',
        benefits: ['Budget certainty', 'Fixed unit rates', 'Protection from market increases']
      },
      flexible: {
        id: 'flexible', name: 'Flexible Energy Contract',
        suitableFor: 'Large businesses, Multi-site businesses, High energy users',
        benefits: ['Suited to fluctuating or growing usage', 'Works well across multiple sites', 'Can flex with wholesale market movement']
      }
    },
    rules: {
      /* If the merchant's annual spend band OR location count band is in
         these lists, Flexible is recommended first; otherwise Fixed. */
      flexibleTriggerSpendBands: ['20000-50000', 'above-50000'],
      flexibleTriggerLocationBands: ['2-5', '6-20', 'above-20']
    },

    /* ── ENERGY SERVICE CARDS (section 4) ── */
    services: [
      { id: 'business-electricity', name: 'Business Electricity', icon: 'ph:lightning-duotone' },
      { id: 'business-gas', name: 'Business Gas', icon: 'ph:fire-duotone' },
      { id: 'dual-fuel', name: 'Dual Fuel', icon: 'ph:atom-duotone' },
      { id: 'smart-meters', name: 'Smart Meters', icon: 'ph:gauge-duotone' },
      { id: 'meter-installations', name: 'Meter Installations (new premises)', icon: 'ph:wrench-duotone' },
      { id: 'multi-site-energy', name: 'Multi-Site Energy', icon: 'ph:buildings-duotone' },
      { id: 'renewable-energy', name: 'Renewable Energy (green electricity)', icon: 'ph:leaf-duotone' },
      { id: 'contract-renewals', name: 'Contract Renewals', icon: 'ph:arrows-clockwise-duotone' }
    ],

    whyChoose: [
      { icon: 'ph:scales-duotone', title: 'Compare multiple suppliers', text: 'We compare across trusted UK suppliers on your behalf.' },
      { icon: 'ph:gift-duotone', title: 'Free quotation', text: 'No cost, no obligation to get your quote.' },
      { icon: 'ph:headset-duotone', title: 'Business energy specialists', text: 'Support from application to contract completion.' },
      { icon: 'ph:buildings-duotone', title: 'Multi-site solutions', text: 'We can help across multiple business locations.' },
      { icon: 'ph:user-circle-duotone', title: 'Dedicated account manager', text: 'A single point of contact throughout.' }
    ],

    faqs: [
      { q: 'Can I switch before my contract ends?', a: 'In many cases yes, particularly if your contract is ending soon. We can advise on timing once we know your renewal date.' },
      { q: 'How long does switching take?', a: 'Switching timelines vary by supplier and meter type — we will confirm expected timescales as part of your quote.' },
      { q: 'Will my supply be interrupted?', a: 'No. Switching business energy supplier does not interrupt your gas or electricity supply.' },
      { q: 'Can you help with multiple sites?', a: 'Yes — we support single-site and multi-site businesses.' },
      { q: 'Can you arrange smart meters?', a: 'Yes, smart meter installation can be arranged as part of your energy contract.' },
      { q: 'How much could I save?', a: 'Savings depend on your current tariff, usage and contract status — we will confirm this as part of your personalised quote.' }
    ],

    requiredDocuments: ['Latest energy bill', 'Business name', 'Business address', 'Contact details'],

    cta: {
      headline: 'Ready to reduce your business energy costs?',
      buttons: ['Upload My Bill', 'Get Free Quote', 'Speak to an Expert']
    },

    leadFormFields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true },
      { id: 'contactName', label: 'Contact Name', type: 'text', required: true },
      { id: 'telephone', label: 'Telephone', type: 'tel', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
    ],

    leadSubmitEndpoint: 'https://formsubmit.co/ajax/plemmouk@gmail.com'
  };

  global.PLEMMO_ENERGY_CONFIG = CONFIG;
})(window);
