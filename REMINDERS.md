# Plemmo — Outstanding items (owner-dependent / next round)

These are tracked follow-ups that were intentionally deferred. They need
owner-supplied content or a larger build, so they were not done in the
content/compliance/bug-fix round.

## Imagery (owner to supply)
- [ ] Replace ALL imagery across the site with real Plemmo photos.
  - Card-machines hero is currently the Teya device: `pages/card-machines.html`
    `<img ... src="../images/Card machine no bg.webp">` (hero).
  - EPOS hero is the placeholder EPOS render: `pages/epos-systems.html`
    `<img ... src="../images/EPOS no bg.png">`.
  - Various stock Unsplash images (e.g. PREMIUM HARDWARE cards in `index.html`,
    industry panels) should be swapped for real photography.
- [ ] Replace text partner chips (`.plogo` in `pages/card-machines.html`) with
  real partner logo images once provided.

## Legal / compliance — next round (full build)
Quick wins are done (introducer wording, two-company trading-name footnote +
company numbers, short service-page disclaimers). Still to build:
- [ ] Privacy Policy page (incl. ICO registration numbers).
- [ ] Terms & Conditions page.
- [ ] Cookie Policy page + cookie consent banner.
- [ ] Legal Disclosures page.
- [ ] Complaints page/procedure.
- [ ] Commission Disclosure page.
- [ ] Wire footer legal links (Terms, Privacy, Cookie Policy, Legal Disclosures,
  Complaints, Commission Disclosure) once the pages above exist — deferred now
  to avoid 404s.

## Forms — verify after deploy
- [ ] Confirm the FormSubmit endpoint `plemmouk@gmail.com` is activated (first
  submission to a new endpoint triggers an activation email).
- [ ] Submit each form once on the live site and confirm the received email
  contains full_name, business_name, phone, email and the form-specific fields
  (all handlers now send `_template=table` and only show success on a real 200).
  Forms: homepage wizard (`index.html`), contact (`contact-us.html`), referral
  (`refer-and-earn.html`), card-machine modal (`card-machines.html`), EPOS demo
  (`epos-systems.html`), funding modal (`business-funding.html`).

## Contact details
- [x] Phone number updated to 0333 041 1161 sitewide.
- [ ] Owner to confirm final logo/brand photos.
