# Plemmo — Outstanding items

## NEXT UP (item 5 — do after the visual round) — REMIND OWNER
- [ ] **Replace ALL site imagery with real Plemmo photos.** Current placeholders (Unsplash + onerror fallbacks) to swap:
  - Card-machines hero (Teya device): `pages/card-machines.html` `src="../images/Card machine no bg.webp"`.
  - EPOS hero placeholder: `pages/epos-systems.html` `src="../images/EPOS no bg.png"`.
  - Digital signage product images (NEW this round, all placeholders): pricing-tab visual (`#sgImg` + `SGIMG` map in inline JS), the 3 menu-board package cards (`.pkg-media`), and the 2 custom-band cards (`.ccard-media`).
  - Stock Unsplash images (PREMIUM HARDWARE cards in `index.html`, industry panels, before/after, etc.).
- [ ] **Add real partner logos** — replace text `.plogo` chips in `pages/card-machines.html` with real logo images once provided.
- [ ] **Real calculator data** — bring in the actual product we offer at each monthly-turnover cap, and update the rate calculator logic in `pages/card-machines.html` (the `teyaRate()` table + the "Suggested fit" product names) so the indicative rates and recommended products are accurate, not example pricing.

## A few facts to confirm in the (now live) legal pages
These pages are built and wired, but contain a couple of values the owner said
are not issued yet — update the text once available:
- [ ] **VAT registration number** — both companies are VAT registered but the number
  hadn't been issued. Currently shown as "VAT registration number to be confirmed"
  in `pages/privacy-policy.html` and `pages/legal-disclosures.html`.
- [ ] **ADR scheme details** — `pages/complaints.html` says ADR arrangements are being
  finalised; add the scheme/number once received.

## Done
- [x] Phone number updated to 0333 041 1161 sitewide.
- [x] Reviews, calculator move, hospitality icon, cursor-image fix, partner removal,
  form-reliability fixes, "credit broker" → "introducer".
- [x] **Legal compliance suite built and wired** (round 2):
  - `pages/privacy-policy.html` — UK GDPR, lawful bases, rights, ICO numbers
    (PLEMMO SERVICES LTD ZC113490 / Digitease Business Solutions Ltd ZB963503),
    ICO complaint route.
  - `pages/terms.html` — Terms & Conditions (introducer role, governing law E&W).
  - `pages/cookie-policy.html` — cookie table + "change preferences" control.
  - `pages/legal-disclosures.html` — company info, trading-name structure,
    regulatory status, per-service disclosures.
  - `pages/complaints.html` — procedure + timescales (ack 5 business days / resolve ≤8 weeks).
  - `pages/commission-disclosure.html` — how Plemmo is paid.
  - Consent-style **cookie banner** (`cookie-consent.js`, loaded sitewide; Accept all /
    Reject non-essential; stores choice; future analytics must gate on
    `window.plemmoConsent === 'all'` / the `plemmo:consent` event).
  - Footer **legal links** wired into every page; new pages added to `sitemap.xml`.
  - Registered office / contact: 133 Soho Hill, Hockley, Birmingham B19 1AT.

## Verify after deploy
- [ ] Confirm FormSubmit endpoint `plemmouk@gmail.com` is activated; test each form
  receives full_name, business_name, phone, email + form-specific fields.
- [ ] Have the legal pages reviewed by a solicitor before relying on them — this build
  is a strong, compliant-ready baseline but is not a substitute for legal advice.
