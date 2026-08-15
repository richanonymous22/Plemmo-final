/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · EPOS RECOMMENDATION ENGINE — default configuration
   ────────────────────────────────────────────────────────────────────────
   Phase 2. Completely independent from the Card Machine Recommendation
   Engine (Phase 1, pages/card-machine-engine/) — no shared logic or
   codebase, only the site's shared visual design language (tokens.css /
   components.css / site.js). Do not import Phase 1 files here, or import
   this file from Phase 1 code.

   Unlike Phase 1, this engine does NOT use turnover, business size, or
   any weighting — recommendations are keyed on business category alone,
   in an admin-editable priority order. Everything here is data; engine.js
   reads it but never hard-codes a provider, package or rule.
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CONFIG = {
    version: 1,

    /* ── BUSINESS CATEGORIES & TYPES (section 3) ── */
    categories: [
      {
        id: 'hospitality', name: 'Hospitality',
        types: [
          { id: 'restaurant', name: 'Restaurant' },
          { id: 'cafe', name: 'Café' },
          { id: 'coffee-shop', name: 'Coffee Shop' },
          { id: 'bar', name: 'Bar' },
          { id: 'pub', name: 'Pub' },
          { id: 'hotel', name: 'Hotel' },
          { id: 'food-truck', name: 'Food Truck' },
          { id: 'fine-dining', name: 'Fine Dining' },
          { id: 'takeaway', name: 'Takeaway' },
          { id: 'dessert-shop', name: 'Dessert Shop' },
          { id: 'bakery', name: 'Bakery' }
        ]
      },
      {
        id: 'retail', name: 'Retail',
        types: [
          { id: 'grocery-store', name: 'Grocery Store' },
          { id: 'convenience-store', name: 'Convenience Store' },
          { id: 'off-licence', name: 'Off Licence' },
          { id: 'clothing-store', name: 'Clothing Store' },
          { id: 'electronics-store', name: 'Electronics Store' },
          { id: 'jewellery-store', name: 'Jewellery Store' },
          { id: 'pharmacy', name: 'Pharmacy' },
          { id: 'vape-shop', name: 'Vape Shop' },
          { id: 'pet-shop', name: 'Pet Shop' },
          { id: 'furniture-store', name: 'Furniture Store' },
          { id: 'florist', name: 'Florist' },
          { id: 'hardware-store', name: 'Hardware Store' },
          { id: 'gift-shop', name: 'Gift Shop' },
          { id: 'other-retail', name: 'Other Retail Businesses' }
        ]
      }
    ],

    /* ── PROVIDERS (section 2) ── */
    providers: {
      plemmo: { id: 'plemmo', name: 'Plemmo EPOS', active: true, logo: '../images/logo.png', description: "Plemmo's own EPOS platform — always our first recommendation, built for retail and hospitality." },
      shift4: { id: 'shift4', name: 'Shift4 EPOS', active: true, logo: '../images/partners/shift4.svg', description: 'Hospitality POS with an integrated card machine included as standard.' },
      sumup: { id: 'sumup', name: 'SumUp POS', active: true, logo: '../images/partners/sumup.svg', description: 'Retail POS kit with integrated card machine and stock management.' },
      eposnow: { id: 'eposnow', name: 'Epos Now', active: true, logo: null, description: 'Cloud-based EPOS available in Countertop and Countertop Duo packages.' }
    },

    /* Feature groups shared by the two Plemmo packages (section: "Sales
       Features" through "Hardware Integration"). Hospitality adds the
       extra group below on top of these. */
    plemmoCoreFeatureGroups: [
      { group: 'Sales Features', items: ['Fast Checkout', 'Barcode Scanning', 'Multiple Payment Methods', 'Split Payments', 'Refund Management', 'Discounts & Promotions', 'Gift Cards', 'Product Variations'] },
      { group: 'Inventory Management', items: ['Real-Time Stock Management', 'Low Stock Alerts', 'Supplier Management', 'Purchase Orders', 'Stock Transfers', 'Stock Adjustments', 'Barcode Inventory'] },
      { group: 'Staff Management', items: ['Multiple Staff Accounts', 'User Permissions', 'Clock In/Clock Out', 'Staff Sales Performance'] },
      { group: 'Reporting', items: ['Sales Reports', 'Product Reports', 'Profit Reports', 'Staff Reports', 'Customer Reports', 'Tax Reports', 'End of Day Reports'] },
      { group: 'Customer Management', items: ['Customer Database', 'Customer Purchase History', 'Loyalty Programme'] },
      { group: 'Business Management', items: ['Cloud Based', 'Multi-store Support', 'Remote Access', 'Secure Backup', 'Role Permissions'] },
      { group: 'Hardware Integration', items: ['Card Machines', 'Barcode Scanners', 'Receipt Printers', 'Cash Drawers', 'Customer Facing Displays'] }
    ],
    plemmoHospitalityFeatureGroup: {
      group: 'Hospitality Features',
      items: ['Table Management', 'Table Reservations', 'Kitchen Display System (KDS)', 'Kitchen Printer Support', 'Table Transfers', 'Split Bills', 'Tips Management', 'Eat-In Orders', 'Takeaway Orders', 'Delivery Orders', 'QR Ordering', 'Online Ordering', 'Menu Management', 'Course Ordering', 'Floor Plan Management']
    },

    /* The exact, non-paraphrased card-machine messaging (section 6). */
    cardMachineMessages: {
      plemmo: { status: 'available', text: 'Integrated card machine available. Additional charges may apply. Please contact us for more information and a personalised quotation.' },
      included: { status: 'included', text: 'Integrated Card Machine Included' }
    },

    /* ── PACKAGES ── each carries which categories it can appear under.
       Countertop Duo appears under both Retail and Hospitality. */
    packages: {

      'plemmo-retail': {
        id: 'plemmo-retail', providerId: 'plemmo', active: true,
        name: 'Plemmo Retail EPOS', categories: ['retail'],
        hardwarePrice: 900, monthlySoftwareFee: 10,
        hardwareIncluded: ['Single Screen Touchscreen EPOS Terminal', 'Receipt Printer', 'Cash Drawer', 'Barcode Scanner'],
        hardwareOptional: [{ name: 'Customer Facing Display', price: 200 }],
        cardMachine: 'plemmo',
        featureGroups: 'plemmoCoreFeatureGroups' /* resolved by engine.js — Retail = core groups only */
      },
      'plemmo-hospitality': {
        id: 'plemmo-hospitality', providerId: 'plemmo', active: true,
        name: 'Plemmo Hospitality EPOS', categories: ['hospitality'],
        hardwarePrice: 500, monthlySoftwareFee: 20,
        hardwareIncluded: [],
        hardwareOptional: [],
        cardMachine: 'plemmo',
        featureGroups: 'plemmoCoreFeatureGroups+hospitality' /* core groups + hospitality-only group */
      },
      'shift4-hospitality': {
        id: 'shift4-hospitality', providerId: 'shift4', active: true,
        name: 'Shift4 Hospitality POS', categories: ['hospitality'],
        hardwarePrice: 0, monthlySoftwareFee: 39,
        hardwareIncluded: ['Integrated Card Machine', 'EPOS Terminal', 'Receipt Printer', 'Cash Drawer'],
        hardwareOptional: [],
        cardMachine: 'included',
        featureGroups: [
          { group: 'Payments', items: ['Integrated Card Machine'] },
          { group: 'Business Management', items: ['Real-Time Analytics', 'Staff Management', 'Inventory Control', 'Labour Cost Analysis', 'Sales Forecasting', 'Fraud Prevention'] },
          { group: 'Cloud', items: ['Cloud Back Office', 'Mobile App', 'API Access', 'Multi-site Management'] },
          { group: 'Reporting', items: ['Sales Reports', 'Performance Reports', 'Labour Reports', 'Inventory Reports'] },
          { group: 'Inventory', items: ['Stock Management', 'Low Stock Alerts', 'Supplier Management'] },
          { group: 'Support', items: ['24/7 Priority Support', 'Lifetime Warranty'] }
        ]
      },
      'sumup-retail': {
        id: 'sumup-retail', providerId: 'sumup', active: true,
        name: 'SumUp Retail POS Kit', categories: ['retail'],
        hardwarePrice: 649, monthlySoftwareFee: 29,
        hardwareIncluded: ['POS Terminal', 'Receipt Printer', 'Cash Drawer', 'Barcode Scanner'],
        hardwareOptional: [],
        promotions: ['30% Discount Available', '6 Monthly Instalments Available (on request)'],
        cardMachine: 'included',
        featureGroups: [
          { group: null, items: ['Integrated Card Machine', 'Retail POS Solution', 'Barcode Scanning', 'Stock Management', 'Sales Reporting', 'Customer Management', 'Staff Accounts', 'Cloud Based'] }
        ]
      },
      'eposnow-countertop': {
        id: 'eposnow-countertop', providerId: 'eposnow', active: true,
        name: 'Epos Now Countertop', categories: ['hospitality'],
        hardwarePrice: 199, monthlySoftwareFee: 39,
        hardwareIncluded: ['Single Screen EPOS Terminal', 'Built-in Receipt Printer', 'Cash Drawer', 'Integrated Card Machine'],
        hardwareOptional: [],
        cardMachine: 'included',
        featureGroups: [
          { group: null, items: ['Cloud-Based EPOS', 'Inventory Management', 'Sales Reporting', 'Staff Management', 'Customer Management', 'Hospitality Features', 'Integrated Card Machine Included'] }
        ]
      },
      'eposnow-countertop-duo': {
        id: 'eposnow-countertop-duo', providerId: 'eposnow', active: true,
        name: 'Epos Now Countertop Duo', categories: ['retail', 'hospitality'],
        hardwarePrice: 249, monthlySoftwareFee: 39,
        hardwareIncluded: ['All-in-One Dual Screen POS System', '15.6" Full HD Staff Touchscreen', '10.1" HD Customer-Facing Display', 'Built-in 80mm Thermal Receipt Printer', 'Cash Drawer', 'Integrated Card Machine'],
        hardwareOptional: [],
        cardMachine: 'included',
        featureGroups: [
          { group: null, items: ['Cloud-Based EPOS', 'Real-Time Reporting', 'Inventory Management', 'Customer Management', 'Staff Management', 'Multi-store Support', 'Retail Features', 'Hospitality Features', 'Reporting Dashboard', 'Integrated Card Machine Included'] }
        ]
      }
    },

    /* ── RECOMMENDATION RULES (section 5) ──
       Admin-editable priority order per category. Plemmo is guaranteed to
       display first regardless of this order — see engine.js — because
       that is a fixed Developer Rule, not a configurable preference. */
    rules: {
      retail: { priority: ['plemmo-retail', 'eposnow-countertop-duo', 'sumup-retail'] },
      hospitality: { priority: ['plemmo-hospitality', 'shift4-hospitality', 'eposnow-countertop', 'eposnow-countertop-duo'] }
    },

    leadSubmitEndpoint: 'https://formsubmit.co/ajax/plemmouk@gmail.com'
  };

  global.PLEMMO_EPOS_CONFIG = CONFIG;
})(window);
