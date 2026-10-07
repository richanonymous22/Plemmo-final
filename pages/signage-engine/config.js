/* ════════════════════════════════════════════════════════════════════════
   PLEMMO · DIGITAL SIGNAGE & MENU DESIGN — default configuration
   ────────────────────────────────────────────────────────────────────────
   Phase 3, Module C. Independent from every other recommendation module
   on the site — no shared logic or codebase, only the site's visual
   design language.

   Lead generation only — there is no checkout/online purchase flow
   anywhere in this module. Every path ends at the lead form. Screen
   pricing below is reproduced exactly as supplied in the brief — do not
   round or estimate it, and do not invent a price for anything the brief
   didn't price (the standalone design services intentionally carry no
   price — they route to "Request a quote").
   ════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  var CONFIG = {
    version: 1,

    hero: {
      headline: 'Digital Signage & Menu Boards for Modern Businesses',
      subheading: 'Promote your products, menus and offers with professionally designed digital displays. Suitable for restaurants, cafés, retail stores, salons, supermarkets and more.',
      primaryBtn: 'Request a Quote',
      secondaryBtn: 'Design My Menu'
    },

    /* ── BUSINESS TYPES (section 3) ── */
    businessTypes: [
      { id: 'restaurant', name: 'Restaurant' },
      { id: 'cafe', name: 'Café' },
      { id: 'coffee-shop', name: 'Coffee Shop' },
      { id: 'fast-food', name: 'Fast Food' },
      { id: 'takeaway', name: 'Takeaway' },
      { id: 'bakery', name: 'Bakery' },
      { id: 'dessert-shop', name: 'Dessert Shop' },
      { id: 'supermarket', name: 'Supermarket' },
      { id: 'convenience-store', name: 'Convenience Store' },
      { id: 'retail-shop', name: 'Retail Shop' },
      { id: 'salon', name: 'Salon' },
      { id: 'barbershop', name: 'Barbershop' },
      { id: 'pharmacy', name: 'Pharmacy' },
      { id: 'hotel', name: 'Hotel' },
      { id: 'reception-area', name: 'Reception Area' },
      { id: 'office', name: 'Office' },
      { id: 'other', name: 'Other' }
    ],

    /* ── SERVICES REQUIRED (multi-select, section 4) ──
       hardware:true services trigger the screen-size question. */
    services: [
      { id: 'digital-menu-board', name: 'Digital Menu Board', hardware: true },
      { id: 'promotional-digital-screen', name: 'Promotional Digital Screen', hardware: true },
      { id: 'window-display-screen', name: 'Window Display Screen', hardware: true },
      { id: 'advertising-display', name: 'Advertising Display', hardware: true },
      { id: 'professional-menu-design', name: 'Professional Menu Design', hardware: false },
      { id: 'promotional-poster-design', name: 'Promotional Poster Design', hardware: false },
      { id: 'social-media-design', name: 'Social Media Design', hardware: false },
      { id: 'existing-menu-update', name: 'Existing Menu Update', hardware: false },
      { id: 'screen-design-package', name: 'Screen & Design Package', hardware: true }
    ],

    /* ── SCREEN SIZES + EXACT PRICING (section 5–6) ── */
    screenSizes: [
      { id: '32in', label: '32"', price: 350, includes: ['Digital Display', 'Professional Menu Design'] },
      { id: '40in', label: '40"', price: 400, includes: ['Digital Display', 'Professional Menu Design'] },
      { id: 'other', label: 'Other / Not Sure', price: null, includes: [] }
    ],

    /* ── DESIGN SERVICES (section 7) — no standalone price given, so none
       is shown; each routes to a quote request. "relevantBusinessTypes":
       [] means the service applies broadly and is always shown as
       relevant (matches the brief's generic framing for those two). */
    designServices: [
      { id: 'menu-design', name: 'Menu Design', suitableFor: 'Restaurants, Cafés, Takeaways, Bakeries, Dessert Shops', relevantBusinessTypes: ['restaurant', 'cafe', 'coffee-shop', 'fast-food', 'takeaway', 'bakery', 'dessert-shop'] },
      { id: 'promotional-screen-design', name: 'Promotional Screen Design', suitableFor: 'Retail, Salons, Pharmacies, Grocery Stores', relevantBusinessTypes: ['retail-shop', 'salon', 'barbershop', 'pharmacy', 'supermarket', 'convenience-store'] },
      { id: 'window-advertising-design', name: 'Window Advertising Design', suitableFor: 'Offers, Promotions, Seasonal Campaigns, New Products', relevantBusinessTypes: [] },
      { id: 'social-media-design', name: 'Social Media Design', suitableFor: 'Promotions, Product Advertisements, Business Branding', relevantBusinessTypes: [] }
    ],

    features: ['Professional Design', 'Modern Layouts', 'High Resolution Graphics', 'Brand Colour Matching', 'Easy to Read Menus', 'Fast Turnaround', 'Digital Ready Files', 'Print Ready Files (if required)'],

    /* ── SERVICE CARDS (section 10) ── */
    serviceCards: [
      { id: 'digital-signage', name: 'Digital Signage', icon: 'ph:monitor-duotone', bullets: ['Screen Sizes', 'Professional Installation Support', 'Commercial Grade Displays'] },
      { id: 'menu-design-card', name: 'Menu Design', icon: 'ph:fork-knife-duotone', bullets: ['Restaurant Menus', 'Café Menus', 'Takeaway Menus', 'Digital Menu Boards'] },
      { id: 'promotional-design-card', name: 'Promotional Design', icon: 'ph:megaphone-duotone', bullets: ['Digital Posters', 'Offers', 'Seasonal Promotions', 'Window Displays'] }
    ],

    whyChoose: [
      { icon: 'ph:medal-duotone', title: 'Professional Commercial Displays', text: 'Built for daily use in busy premises.' },
      { icon: 'ph:paint-brush-duotone', title: 'High Quality Menu Designs', text: 'Clear, modern layouts your customers can read at a glance.' },
      { icon: 'ph:sparkle-duotone', title: 'Business Branding', text: 'Matched to your brand colours and style.' },
      { icon: 'ph:lightning-duotone', title: 'Fast Turnaround', text: 'Get your screens and designs live quickly.' },
      { icon: 'ph:tag-duotone', title: 'Competitive Pricing', text: 'Clear, upfront pricing on our screen bundles.' },
      { icon: 'ph:headset-duotone', title: 'Support After Installation', text: 'We are here after your screens go live too.' }
    ],

    faqs: [
      { q: 'Which screen size should I choose?', a: '32" suits most counters and smaller spaces; 40" suits larger or more visible areas. Not sure? Choose "Other / Not Sure" and we will advise based on your space.' },
      { q: 'Can you update my menu later?', a: 'Yes — content updates can be arranged after your initial design and installation.' },
      { q: 'Can I use my own branding?', a: 'Yes, we match designs to your existing brand colours and style where provided.' },
      { q: 'Do you design promotional adverts?', a: 'Yes — promotional poster, window advertising and social media designs are all available.' },
      { q: 'Can I order multiple screens?', a: 'Yes — let us know how many screens you need on the enquiry form and we will quote accordingly.' },
      { q: 'Can you redesign my existing menu?', a: 'Yes — select "Existing Menu Update" as a service required and tell us more in the enquiry form.' }
    ],

    leadFormFields: [
      { id: 'businessName', label: 'Business Name', type: 'text', required: true },
      { id: 'contactName', label: 'Contact Name', type: 'text', required: true },
      { id: 'mobile', label: 'Mobile Number', type: 'tel', required: true },
      { id: 'email', label: 'Email Address', type: 'email', required: true },
      { id: 'numberOfScreens', label: 'Number of Screens Required', type: 'number', required: false },
      { id: 'notes', label: 'Additional Requirements', type: 'textarea', required: false }
    ],

    leadSubmitEndpoint: 'https://formsubmit.co/ajax/plemmouk@gmail.com'
  };

  global.PLEMMO_SIGNAGE_CONFIG = CONFIG;
})(window);
