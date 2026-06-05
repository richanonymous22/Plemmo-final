# Plemmo — Brand Kit

The single source of truth for how Plemmo looks, moves and sounds. Everything on the
site should trace back to the tokens and rules here. When in doubt, match this doc.

> Implementation note: inner service pages share `pages/components.css` (nav, footer,
> buttons, cards, modal, FAQ, forms, grain, reassurance) + `pages/tokens.css`
> (variables). Change a token once, it updates everywhere.

---

## 1. Brand idea

**"One partner for every business solution."**
Plemmo helps UK high‑street businesses run, grow and modernise by connecting them with
practical tools and trusted providers. Tone: simple, clear, confident, helpful, local,
non‑corporate. Never salesy, never SaaS‑buzzwordy, never over‑promising.

Plemmo is an **introducer / broker** — not a lender, not a payment processor. Legal‑safe
wording always (see §9).

---

## 2. Colour

| Token | Hex | Use |
|---|---|---|
| `--lime` (accent) | `#C6FF00` | Primary accent. (KB reference value `#B8F000` — switch globally by editing the token.) |
| `--lime-d` | `#AEE000` | Accent gradient / pressed |
| `--lime-soft` | `rgba(198,255,0,.12)` | Tints, icon chips |
| `--bg` | `#080A06` | Page background (darkest) |
| `--bg2` | `#0C0F09` | Footer / alt dark |
| `--panel` | `#11150E` | Dark cards |
| `--ink` | `#0B0E08` | Text on light |
| `--ink-soft` | `#5C6553` | Muted text on light |
| `--paper` | `#F5F7F0` | Off‑white section |
| `--cream` | `#FBFBF6` | Lighter section |
| `--white` | `#FFFFFF` | White cards |
| `--txt-d` | `#EEF2E8` | Text on dark |
| `--muted` | `#9AA48D` | Muted text on dark |
| `--line` | `rgba(255,255,255,.10)` | Border on dark |
| `--line-l` | `#E7EBDD` | Border on light |

**Lime discipline (signature rule):** lime is an *accent*, not a fill. Use it for one
hero highlight (underline swipe / dashboard glow), the primary button, small icons,
active states and data highlights. Never large lime fills, never glowing edges. Glows are
soft, blurred and use `mix-blend-mode: screen` so they merge into the dark background.

---

## 3. Type

- **Display / headings:** `Space Grotesk` (700). Tight tracking (`-0.02em`).
- **Body / UI:** `Inter` (400–800).
- **Logo:** `Inter` 900, `-0.04em`, lime full stop.

Scale (clamp, fluid):
| Role | Size |
|---|---|
| Hero H1 | `clamp(46px, 6.4vw, 84px)` |
| Section H2 | `clamp(30px, 4.2vw, 50px)` |
| Card H3 | `18–22px` |
| Lead | `17–18px` |
| Body | `15–16px` |
| Small / meta | `12.5–14px` (never below 12px) |

---

## 4. Spacing & layout

- Container max‑width: **1200px**, side padding **24px**.
- Section vertical padding: **96px** (desktop) / **70px** (mobile); tight variant **56px**.
- Grid gaps: cards **18–22px**; large split layouts **48–54px**.
- Base unit ≈ 4px. Prefer multiples (8 / 12 / 16 / 24 / 32 / 48).

---

## 5. Radii & shadows

- Radii: `--r:16px` · `--r-lg:24px` · `--r-xl:32px` · pill `100px`.
- Shadows (soft, never harsh):
  - Light cards: `0 24px 60px rgba(17,20,15,.12)`
  - Dark cards: `0 30px 70px rgba(0,0,0,.5)`
  - Hover lift adds depth, never a hard drop shadow.

---

## 6. Motion (Framer‑grade, tasteful)

- Easing: `cubic-bezier(.16,1,.3,1)` (standard) · `cubic-bezier(.34,1.56,.64,1)` (spring, for hovers).
- Durations: micro **.2–.35s**, reveals **.6–.8s**.
- Patterns: scroll reveal w/ stagger, button lift + arrow slide, card hover lift,
  image zoom on hover, count‑ups on view, modal fade/scale, mobile menu slide.
- **Always** respect `prefers-reduced-motion: reduce` (disable transforms/animations).
- Avoid: heavy parallax, bouncing, slow/long animations, cursor effects (hero only, subtle).

---

## 7. Texture & depth

- **Grain:** a fixed, very low‑opacity (~3–4%) SVG noise overlay across the page — the
  single biggest "this isn't AI" upgrade. Pointer‑events none.
- **Dark/light rhythm:** alternate `--bg`/`--panel` (dark) with `--paper`/`--cream`
  (light) so the page breathes. Two same‑tone sections may sit together when they form a
  deliberate "zone" (e.g. finder + calculator = a tools zone).

---

## 8. Components

- **Buttons:** pill. `btn-primary` (lime), `btn-ghost` (translucent border on dark),
  `btn-dark`. Hover = lift + subtle shadow + arrow slide. Soft lime shadow only.
- **Cards:** rounded, soft shadow on light / hairline border on dark, hover lift.
- **Reassurance line:** small muted line under primary CTAs —
  `No obligation · Provider terms apply · UK support`.
- **Progressive disclosure:** short by default, "See details" expands (no walls of text).
- **Nav / footer / modal / FAQ / forms:** identical across all inner pages (shared file).
- **Signature device:** the "dashboard window" frame (traffic‑light dots, URL pill, Live
  badge) — reuse for finders/checkers/selectors across services.

---

## 9. Voice & legal (always)

Positioning language: "Plemmo helps you compare", "introduces businesses to selected
providers", "we help you find suitable options", "subject to provider approval",
"pricing may vary", "indicative", "provider terms apply", "Plemmo may receive commission
from providers".

Never: "guaranteed approval/savings", "we lend money", "we process payments directly",
"trusted by thousands" / "award‑winning" / "market leader" (unless confirmed & marked as
editable placeholder).

Disclaimers (per service) live in the footer and near pricing — see master KB.

---

## 10. Imagery / art‑direction

- Warm UK high‑street photography (corner shops, cafés, salons, takeaways) over sterile
  stock. Consistent grade; a recurring **lime object in frame** (card machine, sign) so
  shots feel shot‑for‑Plemmo.
- Product images: `object-fit: contain`. Background/industry images: `object-fit: cover`.
- All images: `max-width:100%`, lazy‑loaded, width/height set (no layout shift), alt text.

---

## 11. Quality bar (every page answers)

1. What does Plemmo offer? 2. Who is it for? 3. Why trust it? 4. What options exist?
5. What do I do next? — clear hero, strong CTA, visual cards, an interactive
selector/checker where useful, pricing/info, FAQ, disclaimer, final CTA, shared footer.

---

_Pending customization phase: real product images, partner/provider logos and verified
figures must replace placeholders before launch._
