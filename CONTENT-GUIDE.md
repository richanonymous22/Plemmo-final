# Plemmo — Content Edit Guide

Plain‑English guide to changing prices, copy and contact details without breaking
anything. The editable values live in **`data/content.json`** (the source of truth).
This guide maps each value to the page where it currently appears so you can mirror
the change.

> Why mirror? The pages are fast static HTML, so values are written directly into each
> page. `data/content.json` is the canonical list — edit it first, then update the
> matching spot in the page below. (A future hosted build can load the JSON
> automatically; that needs a web server, so it isn't wired for local file preview.)

---

## Global (phone, email, footer)
- **File:** every page in `pages/` + `404.html`
- **What:** phone `020 7946 0958`, email `hello@plemmo.co.uk`, footer blurb.
- Phone appears in: top nav button, mobile menu, footer "Contact", sticky bar.
  Search each page for `02079460958` / `020 7946 0958`.

## Card Machines — `pages/card-machines.html`
- **Provider cards** (name, rating, 3 highlights): the `.cm-pcard` blocks.
- **Compare drawer & finder data:** the `CMP` and `PROV` objects in the page's
  `<script>` (rate, monthly, settlement, contract, best‑for, result benefits).
- **Rate calculator bands:** the `teyaRate()` function in the page `<script>`
  (mirror `cardMachines.teyaRatesByTurnover`).
- **Partner marquee:** the `.mq-track` `.plogo` list.

## Business Funding — `pages/business-funding.html`
- **Product cards:** the `.fprod` blocks + the `PROD` object in `<script>`.
- **Lender marquee:** the `.mq-track` `.plogo` list.
- **Documents:** the `.docs` section.

## EPOS — `pages/epos-systems.html`
- **Base systems & prices:** the `.cfg-base` buttons (`data-price`) and the
  `.hw` hardware cards (`.price`). Mirror `epos.baseSystems`.
- **Add‑ons & prices:** the `.cfg-add` buttons (`data-price`). Mirror `epos.addOns`.

## Digital Signage — `pages/digital-signage.html`
- **Menu board packages:** the `.pkg` cards.
- **Commercial pricing tables:** the `.sg-cat` tables. Mirror `signage.commercial`.
- **Selector recommendations:** the `SIG` object in `<script>`.

## Marketing claims (IMPORTANT) — `data/content.json → editableClaims`
These appear on the site and **must be substantiated before launch** (or edited/removed):
- "10,000+ UK businesses" and "4.8/5 Trustpilot" — `pages/card-machines.html` hero.
- "5.0 Rated" — `pages/digital-signage.html` hero pills.
- "£300+ per year on average" — `pages/card-machines.html` Switch & Save.

## Forms (go‑live)
Forms currently show a success state without sending. To make them send, set your
endpoint in `pages/site.js` (the `form.addEventListener('submit', …)` block —
look for `TODO(launch)`), and in the inline contact handler in
`pages/contact-us.html`.

## SEO / domain
Canonical domain is `https://plemmo.co.uk` (in each page's `<head>`, `sitemap.xml`,
`robots.txt`, `site.webmanifest`). Change there if the domain differs.

## Still to do before launch (customization phase)
- Replace stock photography with **real product photos**.
- Replace text wordmarks with **real provider/partner logos** (confirm permission).
- Confirm or edit the **marketing claims** above.
- Wire a **real form endpoint**.
