/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · BUSINESS FINANCE & FUNDING — default configuration
   ────────────────────────────────────────────────────────────────────────
   Phase 3, Module A. Independent from every other recommendation module
   on the site (Card Machine, EPOS, Energy, Signage) — no shared logic or
   codebase, only the site's visual design language.

   HARD COMPLIANCE RULES (section 9 of the brief) — enforced by never
   putting the forbidden content into this file, not by filtering it out
   later:
     - No lender names anywhere in this module.
     - No lender comparisons.
     - No interest rates or APRs.
     - No promises of loan approval.
     - No repayment calculations (funding range / repayment term below are
       descriptive text, not numbers fed into a calculator).
   Plemmo recommends FINANCE PRODUCTS ONLY, never a named partner — every
   enquiry goes to Plemmo for manual review and introduction.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CONFIG = {
    version: 1,

    mandatoryNotice: 'Plemmo Services Ltd is an introducer only. We do not provide loans, make lending decisions, or offer financial advice. All funding applications are assessed and approved by our finance partners, subject to their eligibility criteria and underwriting.',

    hero: {
      headline: 'Business Funding Made Simple',
      subheading: "Looking for business finance? Tell us about your requirements and we'll introduce you to one of our trusted funding partners.",
      primaryBtn: 'Find Suitable Funding',
      secondaryBtn: 'Request a Callback'
    },

    whyChoose: [
      { icon: 'ph:handshake-duotone', title: 'Trusted finance partners', text: 'Access to a panel of trusted finance partners.' },
      { icon: 'ph:lightning-duotone', title: 'One simple enquiry', text: 'Tell us once — no need to approach multiple partners yourself.' },
      { icon: 'ph:squares-four-duotone', title: 'Multiple funding solutions', text: 'From working capital to asset finance and beyond.' },
      { icon: 'ph:headset-duotone', title: 'Support throughout', text: 'Guidance through the introduction process, start to finish.' },
      { icon: 'ph:buildings-duotone', title: 'Wide range of industries', text: 'Suitable for businesses across most sectors.' }
    ],

    /* ── QUALIFICATION FORM OPTIONS (section 3) ── */
    fundingAmountBands: [
      { id: '10000-25000', label: '£10,000–£25,000' },
      { id: '25000-50000', label: '£25,000–£50,000' },
      { id: '50000-100000', label: '£50,000–£100,000' },
      { id: '100000-250000', label: '£100,000–£250,000' },
      { id: 'above-250000', label: '£250,000+' }
    ],
    fundingPurposes: [
      { id: 'working-capital', name: 'Working Capital' },
      { id: 'business-expansion', name: 'Business Expansion' },
      { id: 'equipment-purchase', name: 'Equipment Purchase' },
      { id: 'stock-purchase', name: 'Stock Purchase' },
      { id: 'cash-flow', name: 'Cash Flow' },
      { id: 'commercial-property', name: 'Commercial Property' },
      { id: 'vehicle-purchase', name: 'Vehicle Purchase' },
      { id: 'tax-funding', name: 'Tax Funding' },
      { id: 'vat-funding', name: 'VAT Funding' },
      { id: 'business-acquisition', name: 'Business Acquisition' },
      { id: 'debt-consolidation', name: 'Debt Consolidation' },
      { id: 'other', name: 'Other' }
    ],
    businessTypes: [
      { id: 'sole-trader', name: 'Sole Trader' },
      { id: 'partnership', name: 'Partnership' },
      { id: 'limited-company', name: 'Limited Company' },
      { id: 'llp', name: 'LLP' }
    ],
    businessSectors: [
      { id: 'retail', name: 'Retail' },
      { id: 'hospitality', name: 'Hospitality' },
      { id: 'construction', name: 'Construction' },
      { id: 'healthcare', name: 'Healthcare' },
      { id: 'manufacturing', name: 'Manufacturing' },
      { id: 'professional-services', name: 'Professional Services' },
      { id: 'transport', name: 'Transport' },
      { id: 'property', name: 'Property' },
      { id: 'wholesale', name: 'Wholesale' },
      { id: 'other', name: 'Other' }
    ],
    turnoverBands: [
      { id: 'under-100k', label: 'Under £100k' },
      { id: '100k-250k', label: '£100k–£250k' },
      { id: '250k-500k', label: '£250k–£500k' },
      { id: '500k-1m', label: '£500k–£1m' },
      { id: 'above-1m', label: '£1m+' }
    ],
    timeTradingBands: [
      { id: 'under-12m', label: 'Under 12 Months' },
      { id: '1-2y', label: '1–2 Years' },
      { id: '2-5y', label: '2–5 Years' },
      { id: 'above-5y', label: '5+ Years' }
    ],

    /* ── FINANCE PRODUCTS (section 4) ──
       "range" and "term" are descriptive text only — never a calculated
       figure, never a rate or APR. */
    products: {
      'business-loan': { id: 'business-loan', name: 'Business Loan', active: true, suitableFor: 'General business needs, expansion, working capital or a specific one-off cost.', range: '£10,000 – £500,000+', term: '1 – 5 years', description: 'A lump sum of finance for a wide range of general business purposes, repaid in regular instalments.' },
      'working-capital-loan': { id: 'working-capital-loan', name: 'Working Capital Loan', active: true, suitableFor: 'Day-to-day operational costs, bridging cash flow gaps.', range: '£5,000 – £250,000', term: '3 months – 3 years', description: 'Short to medium-term finance to keep your business running smoothly between income and outgoings.' },
      'asset-finance': { id: 'asset-finance', name: 'Asset Finance', active: true, suitableFor: 'Purchasing equipment, machinery or other business assets.', range: '£5,000 – £500,000', term: '1 – 7 years', description: 'Spread the cost of new or used equipment instead of paying the full amount upfront.' },
      'vehicle-finance': { id: 'vehicle-finance', name: 'Vehicle Finance', active: true, suitableFor: 'Purchasing commercial vehicles or company fleet vehicles.', range: '£5,000 – £250,000', term: '1 – 5 years', description: 'Finance to acquire vans, trucks or other commercial vehicles for your business.' },
      'commercial-mortgage': { id: 'commercial-mortgage', name: 'Commercial Mortgage', active: true, suitableFor: 'Purchasing or refinancing commercial property.', range: '£50,000 – £5,000,000+', term: '5 – 25 years', description: 'Long-term finance secured against commercial premises you own or intend to buy.' },
      'bridging-finance': { id: 'bridging-finance', name: 'Bridging Finance', active: true, suitableFor: 'Short-term property or acquisition funding while a longer-term deal completes.', range: '£25,000 – £5,000,000+', term: '1 – 24 months', description: 'Fast, short-term finance to bridge a gap — often used for property purchases or business acquisitions.' },
      'invoice-finance': { id: 'invoice-finance', name: 'Invoice Finance', active: true, suitableFor: 'Businesses with unpaid customer invoices tying up cash.', range: 'Based on outstanding invoice value', term: 'Ongoing revolving facility', description: 'Release cash tied up in unpaid invoices instead of waiting for customers to pay.' },
      'merchant-cash-advance': { id: 'merchant-cash-advance', name: 'Merchant Cash Advance', active: true, suitableFor: 'Businesses that take a steady volume of card payments.', range: '£5,000 – £300,000', term: '4 – 18 months', description: 'An advance repaid as a percentage of future card sales, flexing with your takings.' },
      'vat-loan': { id: 'vat-loan', name: 'VAT Loan', active: true, suitableFor: 'Spreading the cost of a VAT bill instead of paying it in one go.', range: 'Based on VAT liability', term: 'Up to 12 months', description: 'Short-term finance to spread a VAT payment into manageable instalments.' },
      'tax-loan': { id: 'tax-loan', name: 'Tax Loan', active: true, suitableFor: 'Spreading the cost of a corporation or other tax bill.', range: 'Based on tax liability', term: 'Up to 12 months', description: 'Short-term finance to spread a tax payment into manageable instalments.' },
      'revolving-credit-facility': { id: 'revolving-credit-facility', name: 'Revolving Credit Facility', active: true, suitableFor: 'Businesses wanting flexible, ongoing access to funds as needed.', range: '£5,000 – £250,000', term: 'Rolling facility, no fixed term', description: 'A pre-agreed credit line you can draw on and repay repeatedly, paying only for what you use.' }
    },

    /* ── RECOMMENDATION RULES ──
       The brief lists the product catalogue (section 4) but does not
       specify an exact purpose -> product mapping table (unlike Phase 1's
       Food & Beverage rules). This default mapping is a transparent,
       sensible starting point built from each product's own "suitable
       for" description — fully admin-editable, exactly like Phase 1's
       category rules. */
    rules: {
      byPurpose: {
        'working-capital': { priority: ['working-capital-loan', 'revolving-credit-facility', 'merchant-cash-advance'] },
        'business-expansion': { priority: ['business-loan', 'working-capital-loan', 'revolving-credit-facility'] },
        'equipment-purchase': { priority: ['asset-finance', 'business-loan'] },
        'stock-purchase': { priority: ['working-capital-loan', 'revolving-credit-facility', 'merchant-cash-advance'] },
        'cash-flow': { priority: ['invoice-finance', 'merchant-cash-advance', 'revolving-credit-facility'] },
        'commercial-property': { priority: ['commercial-mortgage', 'bridging-finance'] },
        'vehicle-purchase': { priority: ['vehicle-finance', 'asset-finance'] },
        'tax-funding': { priority: ['tax-loan', 'business-loan'] },
        'vat-funding': { priority: ['vat-loan', 'business-loan'] },
        'business-acquisition': { priority: ['business-loan', 'bridging-finance', 'commercial-mortgage'] },
        'debt-consolidation': { priority: ['business-loan', 'revolving-credit-facility'] },
        'other': { priority: ['business-loan', 'working-capital-loan'] }
      }
    },

    leadFormFields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true },
      { id: 'contactName', label: 'Contact Name', type: 'text', required: true },
      { id: 'telephone', label: 'Telephone', type: 'tel', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
    ],

    faqs: [
      { q: 'Is Plemmo a lender?', a: 'No. Plemmo is an introducer — we help you explore options and introduce you to selected finance partners. We do not lend money or make lending decisions ourselves.' },
      { q: 'Is approval guaranteed?', a: 'No. All funding applications are assessed and approved by our finance partners, subject to their own eligibility criteria, underwriting and affordability checks.' },
      { q: 'How much can I borrow?', a: 'This depends on your business profile, affordability, turnover, the finance partner’s criteria and the product type. We’ll introduce you to a partner who can confirm exact figures.' },
      { q: 'Will you tell me which lender I get?', a: 'We recommend suitable finance product types based on your answers. A specific partner is only confirmed once we make an introduction and they assess your application.' }
    ],

    leadSubmitEndpoint: 'https://formsubmit.co/ajax/plemmouk@gmail.com'
  };

  global.PLEMMO_FINANCE_CONFIG = CONFIG;
})(window);
