/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · CARD MACHINE RECOMMENDATION ENGINE — default configuration
   ────────────────────────────────────────────────────────────────────────
   This file is the single source of truth for providers, pricing, business
   categories/types and recommendation rules used by the Card Machine
   Recommendation Engine (Phase 1B). It is intentionally separate from the
   EPOS Recommendation Engine (Phase 2) — do not import this file, or the
   engine/store/app modules next to it, from any EPOS code.

   Everything here is data, not logic. The rules engine (engine.js) reads
   this object and never hard-codes a provider name, rate or rule outside
   of it. The admin panel (admin-app.js) edits a copy of this object that
   is persisted in the browser via store.js — editing pricing or rules
   never requires touching this file or any code.

   All monetary figures and rates are reproduced exactly as supplied in the
   Phase 1 brief. Do not round or estimate — if a number needs to change,
   change it here (or via the admin panel), nowhere else.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CONFIG = {
    version: 1,

    /* ── GENERAL / SITEWIDE DISCLAIMER (section 13) ── */
    generalDisclaimer: {
      text: 'The pricing displayed throughout the comparison engine is indicative only and subject to underwriting and provider approval.',
      extraCharges: [
        'PCI Compliance Fee',
        'PCI Non-Compliance Charges',
        'Faster Settlement / Faster Payment Charges',
        'Monthly Account Fees (where applicable)',
        'Gateway or Virtual Terminal Fees (where applicable)',
        'Chargeback Fees',
        'Additional Terminal Charges',
        'Other provider-specific fees and charges'
      ]
    },

    recommendationDisclaimer: 'Recommendations are generated from the information you provide and do not constitute financial advice.',

    /* ── BUSINESS CATEGORIES & TYPES (section 5) ── ATV per section 6 ── */
    categories: [
      {
        id: 'food-beverage', name: 'Food & Beverage',
        types: [
          { id: 'bakery', name: 'Bakery', atv: 'low' },
          { id: 'cafe', name: 'Café', atv: 'low' },
          { id: 'restaurant', name: 'Restaurant', atv: 'low' },
          { id: 'fast-food', name: 'Fast Food', atv: 'low' },
          { id: 'fine-dining', name: 'Fine Dining', atv: 'low' },
          { id: 'bar-pub', name: 'Bar/Pub', atv: 'low' },
          { id: 'food-truck', name: 'Food Truck', atv: 'low' },
          { id: 'catering', name: 'Catering', atv: 'low' },
          { id: 'butchers', name: 'Butchers', atv: 'low' },
          { id: 'fishmongers', name: 'Fishmongers', atv: 'low' },
          { id: 'fruit-veg-shop', name: 'Fruit & Vegetable Shop', atv: 'low' }
        ]
      },
      {
        id: 'retail', name: 'Retail',
        types: [
          { id: 'grocery-store', name: 'Grocery Store', atv: 'low' },
          { id: 'convenience-store', name: 'Convenience Store', atv: 'low' },
          { id: 'off-licence', name: 'Off Licence', atv: 'low' },
          { id: 'clothing-store', name: 'Clothing Store', atv: 'low' },
          { id: 'electronics-store', name: 'Electronics Store', atv: 'high' },
          { id: 'furniture-store', name: 'Furniture Store', atv: 'low' },
          { id: 'hardware-store', name: 'Hardware Store', atv: 'low' },
          { id: 'automotive-store', name: 'Automotive Store', atv: 'high' },
          { id: 'jewellery-store', name: 'Jewellery Store', atv: 'high' },
          { id: 'bookshop', name: 'Bookshop', atv: 'high' },
          { id: 'florist', name: 'Florist', atv: 'high' },
          { id: 'pet-shop', name: 'Pet Shop', atv: 'low' },
          { id: 'vape-shop', name: 'Vape Shop', atv: 'low' },
          { id: 'market-stall', name: 'Market Stall', atv: 'low' },
          { id: 'other-retail', name: 'Other Retail', atv: 'low' }
        ]
      },
      {
        id: 'health-beauty-wellness', name: 'Health, Beauty & Wellness',
        types: [
          { id: 'barber', name: 'Barber', atv: 'low' },
          { id: 'hair-salon', name: 'Hair Salon', atv: 'low' },
          { id: 'beauty-salon', name: 'Beauty Salon', atv: 'low' },
          { id: 'cosmetic-store', name: 'Cosmetic Store', atv: 'low' },
          { id: 'pharmacy', name: 'Pharmacy', atv: 'low' },
          { id: 'dentist', name: 'Dentist', atv: 'low' },
          { id: 'gym', name: 'Gym', atv: 'low' },
          { id: 'spa', name: 'Spa', atv: 'low' },
          { id: 'wellness-centre', name: 'Wellness Centre', atv: 'low' }
        ]
      },
      {
        id: 'leisure-entertainment', name: 'Leisure & Entertainment',
        types: [
          { id: 'hotel', name: 'Hotel', atv: 'high' },
          { id: 'hostel', name: 'Hostel', atv: 'high' },
          { id: 'accommodation', name: 'Accommodation', atv: 'high' },
          { id: 'event-company', name: 'Event Company', atv: 'high' },
          { id: 'festival', name: 'Festival', atv: 'high' },
          { id: 'shooting-club', name: 'Shooting Club', atv: 'high' },
          { id: 'experiences', name: 'Experiences', atv: 'high' },
          { id: 'activities', name: 'Activities', atv: 'high' },
          { id: 'cinema', name: 'Cinema', atv: 'high' },
          { id: 'entertainment-venue', name: 'Entertainment Venue', atv: 'low' },
          { id: 'travel-agency', name: 'Travel Agency', atv: 'high' }
        ]
      },
      {
        id: 'services', name: 'Services',
        types: [
          { id: 'accountant', name: 'Accountant', atv: 'high' },
          { id: 'bookkeeper', name: 'Bookkeeper', atv: 'high' },
          { id: 'solicitor', name: 'Solicitor', atv: 'high' },
          { id: 'lawyer', name: 'Lawyer', atv: 'high' },
          { id: 'consultant', name: 'Consultant', atv: 'high' },
          { id: 'estate-agent', name: 'Estate Agent', atv: 'high' },
          { id: 'property-management', name: 'Property Management', atv: 'high' },
          { id: 'tradesperson', name: 'Tradesperson', atv: 'high' },
          { id: 'contractor', name: 'Contractor', atv: 'high' },
          { id: 'education', name: 'Education', atv: 'high' },
          { id: 'garage', name: 'Garage', atv: 'high' },
          { id: 'mot-centre', name: 'MOT Centre', atv: 'high' },
          { id: 'taxi', name: 'Taxi', atv: 'high' },
          { id: 'chauffeur', name: 'Chauffeur', atv: 'high' },
          { id: 'vehicle-hire', name: 'Vehicle Hire', atv: 'high' },
          { id: 'cleaning-company', name: 'Cleaning Company', atv: 'high' },
          { id: 'photographer', name: 'Photographer', atv: 'high' },
          { id: 'videographer', name: 'Videographer', atv: 'high' },
          { id: 'courier', name: 'Courier', atv: 'high' },
          { id: 'logistics', name: 'Logistics', atv: 'high' },
          { id: 'marketing-agency', name: 'Marketing Agency', atv: 'high' },
          { id: 'it-services', name: 'IT Services', atv: 'high' },
          { id: 'digital-agency', name: 'Digital Agency', atv: 'high' },
          { id: 'other-services', name: 'Other Services', atv: 'high' }
        ]
      },
      {
        id: 'charity-non-profit', name: 'Charity / Non-Profit',
        types: [
          { id: 'registered-charity', name: 'Registered Charity', atv: 'low' },
          { id: 'community-organisation', name: 'Community Organisation', atv: 'low' },
          { id: 'religious-organisation', name: 'Religious Organisation', atv: 'low' },
          { id: 'non-profit-organisation', name: 'Non-Profit Organisation', atv: 'low' }
        ]
      }
    ],

    /* ── TURNOVER BANDS shown to the merchant (section 10) ── */
    turnoverBands: [
      { id: 'below-5000', label: 'Below £5,000', lookupValue: 4999 },
      { id: '5000-10000', label: '£5,000–£10,000', lookupValue: 5000 },
      { id: '10000-15000', label: '£10,000–£15,000', lookupValue: 10000 },
      { id: '15000-20000', label: '£15,000–£20,000', lookupValue: 15000 },
      { id: '20000-30000', label: '£20,000–£30,000', lookupValue: 20000 },
      { id: '30000-35000', label: '£30,000–£35,000', lookupValue: 30000 },
      { id: '35000-50000', label: '£35,000–£50,000', lookupValue: 35000 },
      { id: '50000-100000', label: '£50,000–£100,000', lookupValue: 50000 },
      { id: 'above-100000', label: 'Above £100,000', lookupValue: 100001 }
    ],

    /* ── CURRENT PROVIDER options (section 11) ── */
    currentProviderOptions: [
      { id: 'none', label: 'None' },
      { id: 'teya', label: 'Teya' },
      { id: 'shift4', label: 'Shift4' },
      { id: 'sumup', label: 'SumUp' },
      { id: 'clover', label: 'Clover' },
      { id: 'elavon', label: 'Elavon' },
      { id: 'worldpay', label: 'Worldpay' },
      { id: 'other', label: 'Other' }
    ],

    /* ── PROVIDERS (section 12) ── */
    providers: {

      teya: {
        id: 'teya', name: 'Teya', pricingType: 'blended', active: true,
        logo: '../images/partners/teya.svg', deviceImage: '../images/teya-card-machine.webp',
        description: 'Flexible blended-rate provider with rental or buy-outright terminal routes and a range of payout speeds.',
        contractOptions: ['12 Month Contract', 'No Contract'],
        terminalOptions: [
          { id: 'rental', label: 'Monthly Rental', amount: 15.00, unit: 'month' },
          { id: 'buyout', label: 'Terminal Buyout', amount: 139, oneOff: true, vatExclusive: true }
        ],
        payoutOptions: ['Instant Payout (requires Teya Business Account)', 'Everyday Payout', 'Next Working Day Payout'],
        businessAccountBenefits: ['Instant Settlement', '0.5% Cashback on eligible business spending'],
        features: ['Tap to Pay', 'Instant Payout', 'Everyday Payout', 'Next Working Day Payout', '0.5% Cashback', 'Blended Pricing'],
        blendedRateTable: [
          { min: 10000, max: 15000, rate: 1.20 },
          { min: 15000, max: 20000, rate: 1.00 },
          { min: 20000, max: 25000, rate: 0.90 },
          { min: 25000, max: 30000, rate: 0.82 },
          { min: 30000, max: 35000, rate: 0.82 },
          { min: 40000, max: 45000, rate: 0.80 },
          { min: 45000, max: 50000, rate: 0.77 },
          { min: 50000, max: 60000, rate: 0.75 },
          { min: 70000, max: 80000, rate: 0.72 },
          { min: 80000, max: 90000, rate: 0.70 },
          { min: 90000, max: 110000, rate: 0.67 },
          { min: 110000, max: 150000, rate: 0.65 },
          { min: 150000, max: null, rate: 0.60 }
        ]
      },

      shift4: {
        id: 'shift4', name: 'Shift4', pricingType: 'blended', active: true,
        logo: '../images/partners/shift4.svg', deviceImage: '../images/Card machine no bg.webp',
        description: 'No monthly rental for one terminal — simple flat blended pricing with next-day settlement.',
        rentalNote: 'No monthly rental for one terminal',
        settlementFee: { label: 'Next Day Settlement Fee', amount: 0.25, unit: 'per payout' },
        blendedRateBelow10k: 1.25,
        blendedRateFrom10k: 0.70,
        features: ['No Monthly Rental', 'One Terminal Included', 'Pay by Link', 'Virtual Terminal', 'Next Day Settlement', 'Blended Pricing']
      },

      sumup: {
        id: 'sumup', name: 'SumUp', pricingType: 'blended', active: true,
        logo: '../images/partners/sumup.svg', deviceImage: '../images/sumup-card-machine.webp',
        description: 'Low-commitment blended-rate provider suited to small and growing businesses.',
        contractOptions: ['Pay As You Go', '12 Month Contract', '24 Month Contract'],
        hardwareOptions: ['Up to 1 terminal', 'Up to 2 terminals', 'Up to 3 terminals'],
        features: ['Blended Pricing', 'Pay As You Go Available', '12 Month Contract Available', '24 Month Contract Available', 'Integrated Payment Solution', 'Suitable for Small Businesses', 'Suitable for Growing Businesses']
        /* No blended rate table or debit/credit split is displayed for SumUp — per spec. */
      },

      clover: {
        id: 'clover', name: 'Clover', pricingType: 'split', active: true,
        logo: null, deviceImage: '../images/Card machine no bg.webp',
        description: 'Split-rate provider with Flex and Mini devices, and a promotional low-cost rental for new merchants.',
        deviceOptions: ['Clover Flex', 'Clover Mini'],
        standardRental: 24.00,
        promotions: {
          rentalPromo: { id: 'clover-rental-promo', active: true, label: '£1/month terminal rental for first 6 months', amount: 1.00, months: 6, revertsTo: 24.00 }
        },
        /* Authorisation fee is set per turnover band in splitRateTable.low/high
           below (the "auth" field on each row) — edit it there, not here. */
        splitRateTable: {
          low: [
            { min: 20000, max: 40000, debit: 0.45, credit: 0.75, auth: 0.02, rental: 24 },
            { min: 40000, max: 60000, debit: 0.40, credit: 0.72, auth: 0.02, rental: 24 },
            { min: 60000, max: 100000, debit: 0.35, credit: 0.68, auth: 0.02, rental: 24 },
            { min: 100000, max: 150000, debit: 0.30, credit: 0.65, auth: 0.02, rental: 24 },
            { min: 150000, max: 250000, debit: 0.28, credit: 0.65, auth: 0.02, rental: 24 },
            { min: 250000, max: null, debit: 'Custom Quote', credit: 'Custom Quote', auth: 0.02, rental: 24 }
          ],
          high: [
            { min: 20000, max: 40000, debit: 0.45, credit: 0.75, auth: 0.02, rental: 24 },
            { min: 40000, max: 60000, debit: 0.40, credit: 0.70, auth: 0.02, rental: 24 },
            { min: 60000, max: 100000, debit: 0.35, credit: 0.65, auth: 0.02, rental: 24 },
            { min: 100000, max: 150000, debit: 0.30, credit: 0.60, auth: 0.02, rental: 24 },
            { min: 150000, max: null, debit: 0.28, credit: 0.58, auth: 0.02, rental: 24 }
          ]
        },
        features: ['Split Debit/Credit Pricing', 'Clover Flex & Mini Devices', 'Promotional Rental Available']
      },

      elavon: {
        id: 'elavon', name: 'Elavon', pricingType: 'split', active: true,
        logo: '../images/partners/elavon.svg', deviceImage: '../images/elavon-card-machine.webp',
        description: 'Split-rate provider with a flat monthly rental across all turnover bands.',
        standardRental: 19.99,
        splitRateTable: {
          low: [
            { min: 20000, max: 40000, debit: 0.35, credit: 0.65, auth: 0.02, rental: 19.99 },
            { min: 40000, max: 50000, debit: 0.32, credit: 0.60, auth: 0.02, rental: 19.99 },
            { min: 50000, max: 100000, debit: 0.30, credit: 0.60, auth: 0.02, rental: 19.99 },
            { min: 100000, max: null, debit: 0.29, credit: 0.55, auth: 0.02, rental: 19.99 }
          ],
          high: [
            { min: 20000, max: 40000, debit: 0.55, credit: 0.75, auth: 0.03, rental: 19.99 },
            { min: 40000, max: 50000, debit: 0.40, credit: 0.70, auth: 0.03, rental: 19.99 },
            { min: 50000, max: 100000, debit: 0.35, credit: 0.55, auth: 0.02, rental: 19.99 },
            { min: 100000, max: null, debit: 0.32, credit: 0.55, auth: 0.02, rental: 19.99 }
          ]
        },
        features: ['Split Debit/Credit Pricing', 'Flat Monthly Rental', 'MOTO / Phone Payments Available', 'Everyday Payout Available']
      },

      worldpay: {
        id: 'worldpay', name: 'Worldpay', pricingType: 'split', active: true,
        logo: '../images/partners/worldpay.png', deviceImage: '../images/worldpay-card-machine.webp',
        description: 'Split-rate provider for established businesses — monthly rental is agreed per merchant.',
        rentalNote: 'Configurable — varies by merchant agreement',
        splitRateTable: [
          { min: 15000, max: 20000, debit: 0.35, credit: 0.75, auth: 0.02 },
          { min: 20000, max: null, debit: 0.30, credit: 0.75, auth: 0.02 }
        ],
        features: ['Split Debit/Credit Pricing', 'MOTO / Phone Payments', 'Established UK Provider']
      }
    },

    /* ── RECOMMENDATION RULES (sections 7–9) ──
       Everything below is data the admin panel can edit; engine.js reads
       it but never encodes a priority order itself. */
    rules: {

      /* Rule 1/2/3 — general, applies to every category */
      general: {
        neverRecommendCurrentProvider: true,
        prioritiseSuitabilityOverCheapest: true
      },

      /* Section 8 — Charity / Non-Profit */
      charity: {
        question: {
          id: 'no_rental_required',
          text: 'Do you require a card machine with no monthly rental?'
        },
        onYes: { priority: ['shift4', 'sumup'] },
        onNo: { priority: [] } /* admin-editable — no rental-based provider unless requested */
      },

      /* Section 9 — Food & Beverage */
      foodBeverage: {
        question: {
          id: 'payment_method',
          text: 'How do you take payments?',
          options: [
            { id: 'moto', label: 'Over the Phone (MOTO)' },
            { id: 'pay-by-link', label: 'Pay by Link' },
            { id: 'neither', label: 'Neither' }
          ]
        },
        moto: { priority: ['elavon', 'worldpay'], ignoreTurnover: true },
        /* Pay by Link / Neither — turnover-based table */
        turnoverTable: [
          { band: 'below-5000', priority: ['shift4'], substitutions: { shift4: 'sumup' } },
          { band: '5000-10000', priority: ['sumup', 'shift4'] },
          { band: '10000-15000', priority: ['teya', 'worldpay', 'sumup'] },
          { band: '15000-20000', priority: ['teya', 'worldpay', 'sumup'] },
          { band: '20000-30000', priority: ['teya', 'elavon', 'clover'] },
          { band: '30000-35000', priority: ['elavon', 'clover', 'teya'] },
          { band: '35000-50000', priority: ['elavon', 'clover', 'teya'] },
          { band: '50000-100000', priority: ['elavon', 'clover', 'teya'] },
          { band: 'above-100000', priority: ['elavon', 'clover', 'teya'] }
        ]
      },

      /* Every other category (Retail, Health/Beauty/Wellness,
         Leisure & Entertainment, Services): the brief defines a dedicated
         rule set only for Charity and Food & Beverage (sections 8–9) and
         explicitly says not to invent turnover-based logic beyond what is
         specified. Until an admin defines a priority order for a category
         below, the engine falls back to "all active, eligible providers,
         unranked" (see engine.js `recommend()` / `FALLBACK_UNRANKED`) —
         still honouring Rule 1 (never the merchant's current provider).
         Add entries here as {category-id}: {priority:[...]} to switch a
         category over to an explicit ranked recommendation. */
      byCategory: {}
    },

    /* ── LEAD FORM FIELDS (section 15) — used by app.js to render the form ── */
    leadFormFields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true },
      { id: 'contactName', label: 'Contact Name', type: 'text', required: true },
      { id: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'notes', label: 'Notes', type: 'textarea', required: false }
      /* Business Category, Business Type, Monthly Turnover, Current Provider
         and Recommended Provider are carried automatically from the quiz
         answers/result — not re-asked on the lead form. */
    ],

    /* Where leads are emailed (matches the pattern already used across the
       site for contact/refer/team forms) */
    leadSubmitEndpoint: 'https://formsubmit.co/ajax/plemmouk@gmail.com'
  };

  global.PLEMMO_CME_CONFIG = CONFIG;
})(window);
