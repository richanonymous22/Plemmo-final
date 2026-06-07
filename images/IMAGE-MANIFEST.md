# Plemmo image manifest & drop-in checklist

This is the master list of every image on the site. Drop your files into the
folders below using the **exact filenames** shown, then commit. I'll wire them
into the HTML/CSS, fix fallbacks, and keep aspect ratios correct.

Format guidance:
- **Photos / product shots** → `.webp` preferred (smaller), `.jpg` fine. Aim for the "export" size listed (already 2× retina).
- **Logos** → `.svg` ideal (scales perfectly); transparent `.png` at 2× otherwise.
- Keep file sizes reasonable (photos < ~250 KB, logos < ~40 KB).

Status legend:  ⬜ = you provide · 🟦 = I curate stock (pending your approval) · ✅ = already in repo

---

## 1. You provide — PRODUCT images → `images/products/`

These replace the product-photo slots currently using generic stock.

| Status | Filename | What it should show | Export size | Used on |
|--------|----------|---------------------|-------------|---------|
| ⬜ | `card-type-countertop.webp` | Countertop card terminal | 1000×750 | card-machines (types) |
| ⬜ | `card-type-portable.webp` | Portable/handheld terminal | 1000×750 | card-machines (types) |
| ⬜ | `card-type-mobile.webp` | Pocket mobile card reader | 1000×750 | card-machines (types) |
| ⬜ | `card-type-smart.webp` | Android smart terminal | 1000×750 | card-machines (types) |
| ⬜ | `epos-smart-terminal.webp` | Plemmo Smart Terminal (10" all-in-one) | 1000×1000 | epos-systems (hardware) |
| ⬜ | `epos-touch-pro.webp` | Plemmo Touch Pro (15" dual-screen) | 1000×1000 | epos-systems (hardware) |
| ⬜ | `epos-mobile-pos.webp` | Plemmo Mobile POS (portable) | 1000×1000 | epos-systems (hardware) |
| ⬜ | `home-recommended-pax-a920.webp` | PAX A920 Pro smart terminal | 1000×1000 | index (recommended) |
| ⬜ | `home-feature-smart-terminals.webp` | Smart terminal hardware | 800×800 | index (feature thumbs) |
| ⬜ | `home-feature-kitchen-displays.webp` | Kitchen display screen | 800×800 | index (feature thumbs) |
| ⬜ | `home-feature-cash-drawers.webp` | Cash drawer | 800×800 | index (feature thumbs) |
| ⬜ | `home-feature-barcode-scanners.webp` | Barcode scanner | 800×800 | index (feature thumbs) |

> Already in repo (✅): `EPOS no bg.png` (680×462, transparent) and
> `Card machine no bg.webp` (901×1024, transparent) — keep, or send upgraded
> transparent cut-outs to replace them.

---

## 2. You provide — PARTNER logos → `images/partners/`

Rendered on branded tiles (logo centred on a coloured/lime card). Send
transparent SVG/PNG; ideally a version that reads on a dark tile.

| Status | Filename | Provider | Used on |
|--------|----------|----------|---------|
| ⬜ | `teya.svg` | Teya | card-machines (providers, compare tool) |
| ⬜ | `sumup.svg` | SumUp | card-machines (providers, compare tool) |
| ⬜ | `worldpay.svg` | Worldpay | card-machines (providers, compare tool) |
| ⬜ | `elavon.svg` | Elavon | card-machines (providers, compare tool) |
| ⬜ | `funding-*.svg` *(optional)* | Any funding partners you want credited | business-funding |

---

## 3. I curate — STOCK / lifestyle photos → `images/stock/`

🟦 Pending your approval (see chat shortlist). Once approved I'll download,
optimise and drop them here, then wire them in. Filenames I'll use:

| Filename | Scene | Export size | Used on |
|----------|-------|-------------|---------|
| `home-hero-owner.webp` | UK business owner (hero portrait) | 1000×1250 | index hero |
| `home-stop-overpaying.webp` | Owner / payments moment | 1000×1250 | index |
| `home-ecosystem-1..6.webp` | 6 hover-zoom backgrounds | 1200×900 | index ecosystem |
| `home-sticky-1..3.webp` | Setup / settlement / support | 1200×1200 | index sticky scroll |
| `home-cat-cards.webp` | Card Machines category | 1200×900 | index |
| `home-cat-epos.webp` | EPOS category | 1200×900 | index |
| `home-cat-funding.webp` | Funding category | 1200×900 | index |
| `home-cat-signage.webp` | Signage category | 1200×900 | index |
| `card-how-counter.webp` | Owner taking payment at counter | 1200×900 | card-machines |
| `funding-hero.webp` | Owners exploring funding | 1200×800 | business-funding |
| `funding-mca/loan/rbf/asset/credit.webp` | 5 funding-type headers | 1200×700 | business-funding |
| `epos-industry-retail/hospitality/cafe/takeaway/salon/services.webp` | 6 industry scenes | 1000×1000 | epos-systems |
| `signage-hero-menu.webp` | Digital menu board in café | 1200×900 | digital-signage |
| `signage-before.webp` | Plain shopfront (before) | 1400×900 | digital-signage slider |
| `signage-after.webp` | Bright signage (after) | 1400×900 | digital-signage slider |
| `signage-showcase.webp` | Signage in storefront | 900×900 | digital-signage |
| `about-hero-owner.webp` | Small business owner | 1200×900 | about-us |
| `about-paperwork.webp` | Owner reviewing paperwork | 1000×750 | about-us |
| `about-team-helping.webp` | Plemmo team helping owner | 1000×750 | about-us |

---

## 4. Brand assets (✅ already in repo) → `images/`

| File | Size | Use |
|------|------|-----|
| `logo.png` | 500×500 transparent | nav logo, favicon, app icon, social share |
| *(suggested)* `og-banner.png` | 1200×630 | dedicated social-share image (currently uses the square logo) |
