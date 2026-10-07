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
- **What:** phone `0333 041 1161`, email `hello@plemmo.co.uk`, footer blurb.
- Phone appears in: top nav button, mobile menu, footer "Contact", sticky bar.
  Search each page for `03330411161` / `0333 041 1161`.

## "Admin panel" — how it actually works on this site (read this first)

The owner's specification documents (card machines / EPOS / funding / energy / signage)
repeatedly ask for provider data, pricing, rules and categories to be "editable from an
admin panel without changing website code." **This site has no backend, database or
admin login** — it's fast static HTML with no build step. Building a real multi-user
admin UI + database + auth would mean adding a server, which wasn't asked for and would
be a much bigger project than "implement the owner's changes into the current site."

Instead, every recommendation engine below stores **all** of its commercial data
(providers, pricing tables, categories, business types, rules, promotions) in a single,
clearly-labelled JavaScript object near the top of that page's `<script>` block — e.g.
`CM` on Card Machines, `EPOS_CONFIG` on EPOS, `FUNDING_CONFIG` on Funding,
`ENERGY_CONFIG` on Utilities/Energy, `SIGNAGE_CONFIG` on Digital Signage. Each is headed
with an "ADMIN-EDITABLE CONFIG" comment. The engine logic underneath only *reads* that
object — it never hardcodes a price, rate, provider name or business type inline. A
non-developer who can carefully edit a JSON-shaped block (with guidance) can update
prices/providers/rules **without touching the recommendation logic**. This mirrors the
existing `data/content.json` convention below, just implemented per-page since these
engines need the data available instantly client-side with no server round-trip.

If a real admin panel (with login, a database, and lead search/filter/export — see the
owner's Lead Management requirements) is wanted later, that's a genuine backend project
and should be scoped separately; the config-object structure above is deliberately
shaped so it could later be swapped for API calls with minimal changes to the render code.

## Card Machines — `pages/card-machines.html`
- **Recommendation engine config:** the `CM` object in the page's `<script>` —
  `CM.categories` (business categories & types), `CM.highATVRetail` (ATV classification),
  `CM.turnoverBands`, `CM.currentProviders`, `CM.providers` (per-provider pricing tables,
  rental, contract, features), `CM.generalBands`/`CM.charityNoRental`/`CM.foodMoto`
  (recommendation priority rules). Edit values here — the wizard, results and compare
  drawer all read from this object.
- **Provider showcase cards** (static "Top providers" grid): the `.pcard` blocks.
- **Compare drawer data:** the `CMP` object (near the bottom of the `<script>`).
- **Detail popups (full pricing tables):** the `DETAIL` object.
- **Suggested headline rate** (0.35% / 0.30% with utilities): search the page for
  `0.35%` — appears in the hero chip, the live-dashboard mock, the rate calculator and
  the FAQ.
- **Partner marquee:** the `.mq-track` `.plogo` list.

## Business Funding — `pages/business-funding.html`
- **Recommendation engine config:** the `FUNDING_CONFIG` object — qualification-question
  options, the 11-product catalogue (name/suitable-for/typical range/typical term/
  description), and the purpose → product priority mapping.
- **Product cards:** the `.fprod` blocks (mirror `FUNDING_CONFIG`).
- **Documents:** the `.docs` section.
- No lender names or interest rates/APRs should ever be added back to this page — see
  the owner's funding restrictions (introducer only, products not lenders).

## EPOS — `pages/epos-systems.html`
- **Recommendation engine config:** the `EPOS_CONFIG` object — completely separate from
  the Card Machine engine (`CM`) by design. Holds `EPOS_CONFIG.categories` (Retail/
  Hospitality business types), `EPOS_CONFIG.order` (the fixed, never-auto-reordered
  package lists per category) and each package's pricing/hardware/features/integrated
  card-machine-status text.
- **Standalone hardware showroom & cash registers:** the `.hw`/`.hw-grid` cards further
  down the page are a separate, pre-existing hardware catalogue (not part of the owner's
  EPOS package recommendation engine) — left as-is.

## Business Energy — `pages/utilities-broadband.html`
- **Recommendation engine config:** the `ENERGY_CONFIG` object — comparison-question
  options and the two Recommended Solution definitions (Fixed / Flexible) plus the
  `recommend()` rule (see the in-file comment for the exact Fixed-vs-Flexible logic,
  which is an admin-editable default since the owner spec didn't give exact thresholds).
  No live prices or £ savings figures are computed anywhere on this page by design —
  only a qualitative recommendation.
- Broadband/Water/Telecoms/Renewable tab content is separate, pre-existing copy.

## Digital Signage — `pages/digital-signage.html`
- **Selector config:** the `SIGNAGE_CONFIG` object — business types, the 9-item
  multi-select service list, screen sizes and FAQs.
- **Menu board packages (32"/40"/Custom):** the `.pkg` cards — £350/£400 pricing.
- **Commercial pricing tables (bonus catalogue beyond the owner spec):** the `.sg-cat`
  tables. Mirror `signage.commercial` in `data/content.json`.

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
