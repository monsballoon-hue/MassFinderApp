# UX Spec — Soul & Visual Language (SLV Series)

**Created:** 2026-03-14
**Status:** Implemented
**Prefix:** SLV (Soul / Visual Language)
**Claude Code prompt:** `docs/plans/CLAUDE_CODE_PROMPT_SLV.md`
**Branch:** `content-additions`

| Item | Title | Status |
|------|-------|--------|
| SLV-01 | Season Transition Moment | done |
| SLV-02 | Typography with a Voice | done |
| SLV-03 | Candlelight Halo | done |
| SLV-04 | Season as Emotional Temperature | done |
| SLV-05 | Warm Sacred Surfaces | done |
| SLV-06 | Intentional Asymmetry | done |

---

## Overview

This spec infuses human warmth, sacred intentionality, and a clear visual voice into MassFinder's existing design system — without adding weight, breaking HIG alignment, or introducing decorative assets. Every change uses existing CSS infrastructure (custom properties, `color-mix()`, `::first-letter`, `transition`). Zero new images, zero new fonts, zero new JS libraries.

**Core thesis:** The app is polished and functional but emotionally flat. It follows the system perfectly, and that's exactly why it feels machine-made. These specs introduce *the small, deliberate ways a human designer who loves the Faith would break their own rules.*

**Implementation order:** SLV-01 → SLV-03 → SLV-02 → SLV-04 → SLV-05 → SLV-06. Items 01/03/02 form a reinforcing triad and should ship together.

---

## SLV-01 — Season Transition Moment

**Priority:** P1
**Files:** `css/app.css` (lines 103-104, 1854-1879), `src/readings.js` (line 47), `src/app.js`
**Backlog:** New (not from existing backlog)

### Problem

When the liturgical season changes (e.g., Ordinary → Lent on Ash Wednesday), the entire app accent color snaps instantly from green to purple. The user sees no acknowledgment — no moment of recognition. The Church year turns, and the app doesn't breathe.

### User stories

**72-year-old parishioner:** Opens the app on Ash Wednesday morning. Yesterday it was green. Today it's purple. She might not notice consciously, but if the app gently shifted and showed "The Season of Lent begins" for a brief moment, she'd feel the same recognition she feels when the altar cloths change at Mass. That connection is everything.

**25-year-old phone-native:** Opens the app and sees a brief, beautiful interstitial with the season name. Thinks "wait, this app is *alive* — it knows what's happening in the Church." This is the kind of detail that makes someone screenshot and text a friend. No other Catholic app does this.

**45-year-old parent:** Driving to Ash Wednesday Mass, opens app to check times. The interstitial must NOT block her — auto-dismiss after 4 seconds max, tap-to-dismiss immediately. She might not read it, but the color shift registers subliminally.

### Spec

#### Part A: CSS Accent Transition on `:root`

Add to the existing `:root` block (after line 104):

```css
/* Soul: Season accent transitions — colors shift like vestment changes */
:root {
  transition: --color-accent 1.5s ease-in-out,
              --color-accent-text 1.5s ease-in-out,
              --color-accent-light 1.5s ease-in-out,
              --color-accent-pale 1.5s ease-in-out;
}
```

**IMPORTANT — browser support note:** CSS custom property transitions require `@property` registration to animate. If `@property` is not viable (Safari <15.4), the fallback approach is: apply `transition: background 1.5s ease-in-out, border-color 1.5s ease-in-out, box-shadow 1.5s ease-in-out, color 1.5s ease-in-out` directly on the elements that consume accent (saint-card, formation-card, header::after, reader-header::after). Claude Code must test in Safari and implement whichever path works.

**Fallback selector targets (if per-element approach needed):**
- `.saint-card` (border-left-color, background)
- `.formation-card` (border-left-color)
- `.reader-header::after` (background)
- `.top-header::after` (background) — **requires refactoring hex to `var(--color-accent)`**, see Part C
- `.chip.active` (background, border-color)
- `body` (background gradient) — may need separate transition

#### Part B: Header Accent Bar — Migrate Hardcoded Hex to Token

The `.top-header::after` gradient (lines 1870-1879) uses hardcoded hex per season instead of `var(--color-accent)`. This prevents smooth transition.

**Before (line 1870):**
```css
:root[data-season="lent"] .top-header::after {
  height:3px;
  background:linear-gradient(90deg, transparent 0%, #7C3AED 20%, #7C3AED 80%, transparent 100%);
}
```

**After:**
```css
:root[data-season="lent"] .top-header::after {
  height:3px;
  background:linear-gradient(90deg, transparent 0%, var(--color-accent) 20%, var(--color-accent) 80%, transparent 100%);
}
```

Apply same refactor to all 5 season rules (lent, advent, easter, christmas, ordinary) in both light and dark mode. For dark mode, use `color-mix(in srgb, var(--color-accent) 60%, transparent)` to replace the hardcoded `rgba()` values.

**Easter/Christmas special case:** The current Easter header bar uses a gold-center-ivory-edge gradient (`#F5F5F0 → #D4AF37 → #F5F5F0`). This is a deliberate design choice, not just a flat accent fill. Preserve the 3-stop gradient structure but replace the center color with `var(--color-accent)` and edge colors with `var(--color-accent-pale)`:
```css
:root[data-season="easter"] .top-header::after {
  height:3px;
  background:linear-gradient(90deg, transparent 0%, var(--color-accent-pale) 15%, var(--color-accent) 50%, var(--color-accent-pale) 85%, transparent 100%);
}
```

#### Part C: Season Transition Interstitial Overlay

**Trigger condition:** `localStorage.getItem('mf-last-season')` exists AND differs from current season. Never triggers on first install (no stored value). Never triggers on same-season reload.

**Persistence:** After displaying, set `localStorage.setItem('mf-last-season', currentSeason)`. Also set on every `setLiturgicalSeason()` call even when interstitial doesn't show.

**Location in code:** Add to `setLiturgicalSeason()` in `src/readings.js` (line 35-48). After determining the new season string, check localStorage before setting `data-season`.

**Overlay structure (injected as innerHTML into a new `#seasonTransition` div at top of `<body>`):**

```html
<div class="season-overlay" id="seasonTransition">
  <div class="season-overlay-content">
    <div class="season-overlay-label">A NEW SEASON</div>
    <div class="season-overlay-name">{Season Name}</div>
    <div class="season-overlay-message">{Inspirational message}</div>
  </div>
</div>
```

**Season names and messages (curated):**

| Season | Name | Message |
|--------|------|---------|
| advent | The Season of Advent | *A time of joyful waiting and preparation.* |
| christmas | The Christmas Season | *The Word was made flesh, and dwelt among us.* |
| lent | The Season of Lent | *Return to Me with your whole heart.* |
| easter | The Easter Season | *He is risen. Alleluia!* |
| ordinary | Ordinary Time | *Growing in grace, day by day.* |

**CSS for overlay:**

```css
.season-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000; /* above everything including install guide */
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  opacity: 1;
  transition: opacity 0.8s ease-in-out;
  cursor: pointer; /* tap to dismiss */
}
.season-overlay.dismissing {
  opacity: 0;
  pointer-events: none;
}
.season-overlay-content {
  text-align: center;
  padding: var(--space-8);
  max-width: 320px;
}
.season-overlay-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-4);
}
.season-overlay-name {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: var(--space-4);
  letter-spacing: 0.01em;
}
.season-overlay-message {
  font-family: var(--font-prayer);
  font-size: var(--text-lg);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: 1.5;
}
```

**Dark mode:** The overlay uses `var(--color-bg)` which already shifts in dark mode. No additional overrides needed.

**Seasonal background:** Add subtle per-season background gradient (matching existing body gradients from lines 1861-1864):
```css
:root[data-season="lent"] .season-overlay,
:root[data-season="advent"] .season-overlay {
  background: linear-gradient(180deg, var(--color-bg) 0%, #F5F3F7 100%);
}
:root[data-season="easter"] .season-overlay,
:root[data-season="christmas"] .season-overlay {
  background: linear-gradient(180deg, var(--color-bg) 0%, #FBF9F3 100%);
}
```

**Dismiss behavior:**
1. Tap anywhere → add `.dismissing` class → remove from DOM after 800ms transition completes
2. Auto-dismiss after 4 seconds → same `.dismissing` flow
3. `setTimeout` should be cleared if manual tap occurs first

**Accent color on overlay:** The overlay renders *after* `data-season` is set, so `var(--color-accent)` already reflects the new season. The label "A NEW SEASON" appears in the new season's accent color.

### Cascading impacts

- All ~40+ elements using `var(--color-accent)` will transition smoothly IF the `@property` approach works. If per-element fallback is needed, only the ~6 targeted elements transition; others snap (acceptable).
- The map tile accent bar in `src/map.js` line 218 reads `data-season` — it will pick up the new season on next render, not mid-transition. This is fine; the map isn't visible during the overlay.
- The `_devSetSeason()` function in `src/app.js` line 1055 should NOT trigger the interstitial — add a skip flag.

### Dark mode

- Overlay: fully handled via CSS variables (no additional rules needed except seasonal gradient)
- Header bar refactor: dark mode rules (lines 1875-1879) must also migrate to `color-mix(in srgb, var(--color-accent) 60%, transparent)` to inherit the transition

### Test checklist

- [ ] Light mode: change date from Feb 17 to Feb 18 (Ash Wednesday 2026) using dev panel — interstitial appears with "The Season of Lent" in purple accent
- [ ] Dark mode: same test — verify overlay background and text colors
- [ ] Tap dismiss: overlay fades out in <1 second
- [ ] Auto dismiss: overlay fades after ~4 seconds with no interaction
- [ ] First install: no `mf-last-season` in localStorage → no interstitial shown
- [ ] Same-season reload: season hasn't changed → no interstitial
- [ ] Header bar: accent line transitions smoothly when season changes (or snaps if per-element approach)
- [ ] Dev panel `_devSetSeason()`: does NOT trigger interstitial
- [ ] Easter gold header gradient: 3-stop gradient preserved, center uses `var(--color-accent)`
- [ ] iOS Safari: test `@property` support, fall back to per-element transitions if needed
- [ ] 72-year-old test: text is large, readable, no cognitive load required
- [ ] Performance: no jank on iPhone 11 or equivalent older device

---

## SLV-02 — Typography with a Voice

**Priority:** P1
**Files:** `css/app.css`
**Backlog:** New

### Problem

The app's three font families are correctly applied but lack typographic *character*. Sacred text in Georgia looks like a web default, not like a missal. Headings in Playfair don't feel hand-set. The typography follows the system without expressing a point of view.

### User stories

**72-year-old parishioner:** Opens daily readings. The first letter of the Gospel is a large drop cap — instantly, this feels like her missal, like her prayer book at home. The text has more breathing room. She reads more comfortably.

**25-year-old phone-native:** Notices the typography has craft — the heading letter-spacing, the drop cap, the way "LORD" is set in small-caps. Thinks "someone who actually reads these texts designed this." This is the kind of typographic attention that Linear and Notion have.

**45-year-old parent:** Doesn't consciously notice the changes, but reads the daily reading 10% more easily because the line-height is more generous and the text-shadow in dark mode reduces eye strain.

### Spec

#### Part A: Drop Cap on Daily Readings

Target: first paragraph of content inside `.reader-body` when displaying daily readings (not all reader content — not rosary, not stations).

Add a data attribute to differentiate reading content from other reader content. In `src/readings.js`, when rendering into `.reader-body`, add `data-content="readings"` to the reader-body or a wrapper div.

```css
.reader-body[data-content="readings"] > p:first-of-type::first-letter,
.reader-body[data-content="readings"] > div:first-of-type > p:first-of-type::first-letter {
  font-family: var(--font-display);
  font-size: 3.2em;
  float: left;
  line-height: 0.8;
  padding-right: 0.08em;
  padding-top: 0.05em;
  color: var(--color-accent);
  font-weight: var(--weight-bold);
}

html[data-theme="dark"] .reader-body[data-content="readings"] > p:first-of-type::first-letter,
html[data-theme="dark"] .reader-body[data-content="readings"] > div:first-of-type > p:first-of-type::first-letter {
  color: var(--color-accent);
}
```

**Sizing note:** Use `em` not `px` so the drop cap scales with the text-size adjustment buttons (A−/A+). Test at all three text sizes.

**Seasonal accent:** The drop cap color uses `var(--color-accent)` — it automatically shifts with season. Purple drop cap during Lent, gold at Easter.

#### Part B: Heading Letter-Spacing

Add subtle letter-spacing to `--font-display` headings to feel more hand-set:

```css
.saint-name {
  letter-spacing: 0.015em; /* was: none */
}
```

Apply same `letter-spacing: 0.015em` to:
- `.season-overlay-name` (from SLV-01)
- `.reader-header .reader-title` (if a class exists for the title text in the reader header)
- `.ccc-title` or equivalent CCC heading

**Do NOT apply to:** `.formation-label`, `.prayer-tool-title`, or any `--text-xs`/`--text-sm` sized text — letter-spacing on small text reduces readability for the 72-year-old.

#### Part C: Sacred Text Warm Shadow (Dark Mode Only)

In dark mode, `--font-prayer` text currently renders as flat light text on dark background. Add an extremely subtle warm text-shadow to create an "oil lamp" reading feel:

```css
html[data-theme="dark"] .reader-body {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}

html[data-theme="dark"] .ccc-body,
html[data-theme="dark"] .ccc-paragraph {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}
```

**Opacity 0.04 is critical.** This should be felt, not seen. If you can see a visible glow, it's too strong. The effect is that dark-mode reading feels warmer without the user being able to point to why.

**Do NOT apply to:** Rosary bead text (has its own visual treatment), examination items (privacy-focused minimal design), or any UI text using `--font-body`.

#### Part D: Small-Caps LORD in Scripture

In Catholic Bibles, "LORD" (representing the Tetragrammaton) is traditionally typeset in small caps. This is a typographic convention, not a design flourish.

**Implementation approach:** In `src/readings.js`, in the rendering path after BibleGet HTML is received and before it's cached/displayed, apply a regex replacement:

```javascript
// Typographic convention: LORD → small-caps
html = html.replace(/\bLORD\b/g, '<span class="sc">LORD</span>');
```

```css
.sc {
  font-variant: small-caps;
  text-transform: lowercase; /* needed for font-variant to work on uppercase text */
  letter-spacing: 0.05em;
}
```

**Cache note:** BibleGet results are cached in localStorage with daily expiry (line 17-28 in readings.js). The replacement should happen before caching so cached reads also show small-caps.

**Bible module:** `src/bible.js` also renders Scripture from local files (`/data/bible-drb/`, `/data/bible-cpdv/`). Apply the same regex in bible.js rendering. Check both DRB and CPDV files for "LORD" occurrences.

### Cascading impacts

- Drop cap interacts with text-size adjustment — tested via `em` units
- Small-caps regex must not match "Lord" (mixed case) — only all-caps "LORD". The `\b` word boundary handles this.
- Warm text-shadow applies to all reader content in dark mode — verify it doesn't conflict with existing `.reader-body` styles (line 1925)
- Letter-spacing on `.saint-name` is additive to existing styles (line 2060) — no override conflicts

### Test checklist

- [ ] Drop cap: visible on first reading paragraph, sized ~3× base text
- [ ] Drop cap: scales correctly when text-size buttons used (A−/A+)
- [ ] Drop cap: renders in correct season accent color
- [ ] Drop cap: does NOT appear in rosary, stations, examination, novena, or CCC readers
- [ ] Drop cap: dark mode accent color
- [ ] Letter-spacing: saint-name on More tab has subtle spacing
- [ ] Letter-spacing: not applied to small text labels
- [ ] Dark mode text-shadow: not consciously visible as a glow; reading just feels "warmer"
- [ ] Small-caps: "LORD" renders in small caps in daily readings
- [ ] Small-caps: "Lord" (mixed case) is NOT affected
- [ ] Small-caps: works in both BibleGet readings and DRB/CPDV Bible reader
- [ ] Small-caps: cached readings include the small-caps span

---

## SLV-03 — Candlelight Halo (Visual Signature)

**Priority:** P1
**Files:** `css/app.css`
**Backlog:** New

### Problem

The app has no visual signature — no single design element that makes it *unmistakably MassFinder*. Every card, shadow, and radius follows the system identically. The app needs one recurring visual motif that says "this is ours."

### User stories

**72-year-old parishioner:** Sees the saint card on the More tab with a faint warm glow behind it. It looks like candlelight. She can't articulate why, but this card feels more reverent than the utility cards above it.

**25-year-old phone-native:** Notices that certain elements — the saint card, the formation card, the promoted prayer tool — have a distinctive soft halo. In dark mode, it's beautiful. Thinks "this is a design choice, not a default."

**45-year-old parent:** Doesn't notice consciously. Good — it's not adding cognitive load.

### Spec

#### New CSS variable (add to `:root` tokens)

```css
:root {
  --shadow-sacred-glow: 0 0 20px color-mix(in srgb, var(--color-sacred) 8%, transparent);
}

html[data-theme="dark"] {
  --shadow-sacred-glow: 0 0 24px color-mix(in srgb, var(--color-sacred) 12%, transparent);
}
```

Uses `--color-sacred` (fixed warm gold, `#B8963F` light / `#D4A84B` dark) NOT `--color-accent` (which shifts with season). Rationale: the halo is the app's signature warmth — it should be consistent gold regardless of season, like candlelight doesn't change color with vestments.

**Design decision:** After analysis, sacred gold is the right choice for the signature halo. The seasonal accent already expresses itself through the header bar, drop cap, chip active state, and accent borders. The halo is a *separate* visual layer — warm, constant, like the candle that's always lit in the sanctuary.

#### Apply to sacred content cards only (max 4 elements)

**1. Saint card:**
```css
.saint-card {
  box-shadow: var(--shadow-card), var(--shadow-sacred-glow);
}
```

**2. Formation card (Daily Wisdom):**
```css
.formation-card {
  box-shadow: var(--shadow-card), var(--shadow-sacred-glow);
}
```

**3. Promoted prayer tool card:**
```css
.prayer-tool-card--promoted {
  box-shadow: var(--shadow-card), var(--shadow-sacred-glow);
}
```

**4. Reader header accent line** (existing `::after` at line 1918):

Currently: `opacity: 0.2`. Enhance with a subtle glow spread:
```css
.reader-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  right: 20%;
  height: 2px;
  background: var(--color-sacred);
  opacity: 0.25;
  border-radius: 1px;
  box-shadow: 0 0 12px color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
```

#### Do NOT apply to

- Parish cards (Find tab) — these are utility, not sacred
- Chips, buttons, or navigation — these are interaction, not contemplation
- Map elements — performance concern on lower-end devices
- Daily card — already has border-left accent; double emphasis clutters
- YC compact cards — too small for the effect to read

### Cascading impacts

- Adding a second shadow layer to saint-card: the card already has `box-shadow: var(--shadow-card)` (line 1840). The multi-shadow comma syntax is standard CSS. Verify no `!important` overrides.
- Dark mode: the 12% opacity sacred glow on `#22252E` dark surfaces creates visible warmth — test that it doesn't cause "dirty" artifacts on lower-resolution screens.
- The `.saint-card[data-lit-color]` variants (lines 1841-1845) set their own `background` but NOT `box-shadow` — the glow inherits cleanly.
- Hover states: `.prayer-tool-card:hover` uses `var(--shadow-card-hover)` — the glow should persist on hover. Make sure the hover shadow is also comma-separated with the glow:
```css
.prayer-tool-card--promoted:not(.coming-soon):hover {
  box-shadow: var(--shadow-card-hover), var(--shadow-sacred-glow);
}
```

### Test checklist

- [ ] Light mode: saint card has barely-perceptible warm halo (8% opacity)
- [ ] Dark mode: saint card has visible but subtle warm glow (12% opacity)
- [ ] Formation card: same treatment, consistent with saint card
- [ ] Promoted prayer tool: glow visible, persists on hover
- [ ] Reader header: accent line has soft glow spread
- [ ] Non-promoted prayer tools: NO glow (only promoted cards)
- [ ] Parish cards on Find tab: NO glow
- [ ] Performance: no visible jank when scrolling More tab on iPhone 11
- [ ] Glow does not change color with season (uses --color-sacred, not --color-accent)
- [ ] Multi-shadow syntax doesn't conflict with existing dark mode card overrides

---

## SLV-04 — Season as Emotional Temperature

**Priority:** P2
**Files:** `css/app.css` (lines 103-104, 1854-1858)
**Backlog:** New
**Depends on:** SLV-01 (interstitial provides context for why pace changed)

### Problem

Every season of the Church year has a different emotional character — Lent is austere and contemplative, Easter is joyful and kinetic, Ordinary Time is steady. Currently, every season has identical interaction timing.

### User stories

**72-year-old parishioner:** During Lent, the app feels slightly more... still. Transitions take a breath longer. She doesn't notice consciously, but the app matches the penitential mood she's living in.

**25-year-old phone-native:** During Easter, the app feels slightly snappier — transitions have a bit more spring. Coming out of the slower Lenten pace, the difference registers as "the app got better" — which is exactly how Easter should feel.

**45-year-old parent:** If the timing changes are >100ms from the default, she'll notice and be annoyed. Keep it tight.

### Spec

#### Seasonal timing token overrides

```css
/* ── Seasonal emotional temperature ── */
:root[data-season="lent"],
:root[data-season="advent"] {
  --transition-fast: 180ms var(--ease-out);  /* was 150ms — +30ms contemplative */
  --transition-base: 300ms var(--ease-out);  /* was 250ms — +50ms contemplative */
}

:root[data-season="easter"],
:root[data-season="christmas"] {
  --transition-fast: 130ms cubic-bezier(0.34, 1.56, 0.64, 1);  /* was 150ms — springier */
  --transition-base: 220ms cubic-bezier(0.34, 1.56, 0.64, 1);  /* was 250ms — slight bounce */
}

:root[data-season="ordinary"] {
  /* Default values — no override needed, inherits :root */
}
```

**The cubic-bezier for Easter/Christmas** (`0.34, 1.56, 0.64, 1`) creates a very slight overshoot — the element moves just past its target and settles back. This reads as "springy" or "joyful" without being cartoony. The overshoot is ~2px max on typical transitions.

**Safe ranges (enforced):**
- `--transition-fast`: 120ms–200ms (never below 120 — accessibility; never above 200 — feels broken)
- `--transition-base`: 200ms–350ms (same rationale)

#### Hardcoded timing audit

These elements use hardcoded timing and will NOT inherit the seasonal shift. This is acceptable for v1:

| Element | Hardcoded timing | Location | Inherit? |
|---------|-----------------|----------|----------|
| `.reader-overlay` slide-up | `0.5s cubic-bezier(0.28,0.11,0.32,1)` | line 1915 | No — reader needs consistent feel |
| `tabFadeIn` keyframe | `0.15s ease-out` | line 1065 | No — tab switches should be instant |
| `.pull-indicator` height | `0.2s ease` | line 387 | No — system-feel interaction |
| `@keyframes pulse` | `2s / 1.5s` | line 529 | No — live/soon indicators need consistency |
| `@keyframes spin` | `0.8s linear` | line 384 | No — loading spinner |

**Future consideration:** In a v2, the reader overlay could slow to `0.6s` during Lent with a more measured ease. But don't over-scope v1.

### Cascading impacts

- Every element using `var(--transition-fast)` or `var(--transition-base)` inherits the change. This includes: search-bar focus, chip press, card hover, card-fav, text-size buttons, ig-picker-btn, and more (~30+ usages).
- The Easter spring ease (`cubic-bezier(0.34, 1.56, 0.64, 1)`) causes slight overshoot on `transform: scale(0.98)` active states — test that card press doesn't "bounce" visibly.
- Must test combined with SLV-01: during the season transition, the *timing itself* changes mid-transition. This could cause a visible timing jump on elements already animating. Mitigation: the interstitial overlay (SLV-01) covers the screen during the season swap, so no elements are visibly transitioning.

### Test checklist

- [ ] Lent: card hover transitions feel slightly slower (~300ms) compared to Ordinary (~250ms)
- [ ] Easter: chip press feels slightly snappier with subtle spring ease
- [ ] Easter: card active `scale(0.98)` doesn't bounce visibly
- [ ] Ordinary: default timing, no override applied
- [ ] Reader overlay: maintains its own timing regardless of season
- [ ] Tab switching: maintains instant feel regardless of season
- [ ] iPhone 11 performance: no dropped frames from timing changes
- [ ] 45-year-old test: ask a non-designer if the app "feels slow" during Lent — if yes, reduce to +20ms

---

## SLV-05 — Warm Sacred Surfaces

**Priority:** P2
**Files:** `css/app.css`
**Backlog:** New

### Problem

All cards use `var(--color-surface)` (flat `#FFFFFF`). Sacred content cards (saint, formation, daily reading) look identical to utility cards (prayer tools, compact rows). There's no visual warmth that distinguishes contemplative content from functional UI.

### User stories

**72-year-old parishioner:** The saint card and formation card feel slightly different from the rest of the page — warmer, more like a prayer card she'd find in a church pew.

**25-year-old phone-native:** Notices some cards have a barely-there warm surface, others are clean white. Reads it as intentional design hierarchy. It's the kind of thing Airbnb does with their hero vs. standard cards.

**45-year-old parent:** Doesn't notice. Good.

### Spec

#### New token

```css
:root {
  --color-surface-sacred: linear-gradient(135deg, #FFFFFF 60%, #FFFCF5 100%);
}

html[data-theme="dark"] {
  --color-surface-sacred: linear-gradient(135deg, var(--color-surface) 60%, color-mix(in srgb, var(--color-sacred) 4%, var(--color-surface)) 100%);
}
```

**IMPORTANT:** This is a `background` value, not a `background-color` value. Elements using it must set `background:` not `background-color:`.

#### Apply to sacred content cards only

**Saint card** — already has a similar gradient (line 1840). Migrate to the new token:
```css
.saint-card {
  background: var(--color-surface-sacred);
  /* ...rest unchanged */
}
```

Wait — the saint card already has per-liturgical-color gradients (lines 1841-1845). The `[data-lit-color]` variants should continue to override the default. So `--color-surface-sacred` is the base, and `[data-lit-color]` variants override `background` entirely. This is already how it works.

**Formation card** — currently flat `var(--color-surface)` (line 255):
```css
.formation-card {
  background: var(--color-surface-sacred);
}
```

**Daily card** — currently flat `var(--color-surface)` light, gradient in dark (lines 236, 248):
```css
.daily-card {
  background: var(--color-surface-sacred);
}
```

#### Do NOT apply to

- Parish cards — utility, not sacred
- Prayer tool cards (including promoted) — these already have their own gradient treatment (line 1613)
- Compact YC cards — too small, gradient won't read
- CCC sheet / Bible reader — these are full-screen reading surfaces, not cards

### Cascading impacts

- The saint card's existing `background: linear-gradient(135deg, var(--color-surface) 60%, color-mix(in srgb, var(--color-sacred) 8%, transparent) 100%)` is functionally the same as `--color-surface-sacred`. Migrating centralizes the token.
- Dark mode: the `color-mix()` approach at 4% opacity is extremely subtle — test on both OLED and LCD screens.
- The daily card dark mode already has a different gradient (line 248) — this override should remain, so dark mode daily card does NOT use `--color-surface-sacred` but keeps its existing treatment.

### Test checklist

- [ ] Light mode: saint card surface has barely-visible warm tint in bottom-right corner
- [ ] Light mode: formation card matches saint card warmth
- [ ] Dark mode: sacred surface has 4% sacred tint — visible on OLED, may be invisible on LCD (acceptable)
- [ ] Saint card `[data-lit-color]` variants still override correctly
- [ ] Daily card dark mode: keeps existing gradient, not overridden
- [ ] Prayer tool cards: NOT affected
- [ ] Parish cards on Find tab: NOT affected
- [ ] No visible difference on smaller phones where gradient doesn't have room to express

---

## SLV-06 — Intentional Asymmetry (Saint Card)

**Priority:** P3
**Files:** `css/app.css` (line 1840)
**Backlog:** New

### Problem

Every card in the app has identical symmetric padding. This is correct for utility cards but makes sacred content feel like data rather than text meant to be contemplated. The saint card — the most prominent sacred element on the More tab — should feel like a prayer card, not a data card.

### User stories

**72-year-old parishioner:** The saint card has more space on the left side. Her eye tracks more easily from the accent border to the text. It feels like a page in a book.

**25-year-old phone-native:** Notices the saint card feels "different" from other cards — more generous, more intentional. Can't articulate why. It's the kind of asymmetry that good editorial design uses.

**45-year-old parent:** Doesn't notice.

### Spec

**Before:**
```css
.saint-card { padding: var(--space-4); }
/* = 16px all sides */
```

**After:**
```css
.saint-card {
  padding: var(--space-4) var(--space-4) var(--space-5) var(--space-5);
  /* = 16px top, 16px right, 20px bottom, 20px left */
}
```

The extra 4px on left creates a "margin note" feel against the `border-left: 4px solid` accent border. The extra 4px on bottom gives the card content room to breathe downward.

**Desktop consideration:** At desktop widths (max-width 680px centered), the asymmetry is subtle enough to work without looking off-center.

### Cascading impacts

- The saint card `padding` is used once (line 1840). No other elements inherit from it.
- The `border-left: 4px solid` + extra left padding means the accent border doesn't feel disconnected — test that the text still aligns near the border.
- `.saint-feast`, `.saint-name`, `.saint-desc` inherit layout from their parent — no child padding changes needed.

### Test checklist

- [ ] Light mode: saint card left edge has more breathing room
- [ ] Dark mode: same treatment
- [ ] Desktop: card doesn't look off-center at max-width
- [ ] Border-left still feels connected to the content, not floating
- [ ] No impact on any other card type

---

## Implementation Dependencies (Summary)

```
SLV-01 (Season Transition)
  ├── SLV-03 depends on: glow shifts color cleanly if accent transitions
  ├── SLV-04 depends on: interstitial masks timing change
  └── SLV-02 enhanced by: drop cap uses seasonal accent color

SLV-02 (Typography) — independent, enhanced by SLV-01
SLV-03 (Halo) — independent, enhanced by SLV-05 (warm surface under glow)
SLV-04 (Timing) — depends on SLV-01
SLV-05 (Surfaces) — independent, enhances SLV-03
SLV-06 (Asymmetry) — fully independent
```

**Recommended implementation order:**
1. SLV-01 (Part B first: header hex refactor. Then Part A: CSS transition. Then Part C: interstitial.)
2. SLV-03 (Sacred glow — while accent CSS is fresh in mind)
3. SLV-02 (Typography — independent, can be done in parallel)
4. SLV-04 (Timing — test after interstitial is working)
5. SLV-05 (Surfaces — enhances glow)
6. SLV-06 (Asymmetry — polish pass, do last)

---

## Implementation Notes — All SLV Items

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done (all 6 items)
- **Files changed:**
  - `css/app.css` — Added `@property` registrations for accent color animation, `:root` transition for accent properties, per-element fallback transitions, body seasonal gradient transition. Migrated all `.top-header::after` seasonal rules from hardcoded hex to `var(--color-accent)` / `color-mix()`. Added `--shadow-sacred-glow` and `--color-surface-sacred` tokens (both light/dark). Applied sacred glow to saint-card, formation-card, promoted prayer-tool-card, reader-header::after. Applied sacred surface to formation-card and daily-card. Added season transition interstitial overlay CSS (`.season-overlay` + seasonal background gradients + dark mode). Added SLV-04 seasonal timing overrides (Lent/Advent +30/+50ms contemplative, Easter/Christmas spring ease). Added SLV-02 typography: drop cap on first reading paragraph, `.sc` small-caps class, `.saint-name` letter-spacing, dark mode warm text-shadow on reader/reading/CCC bodies. Saint card padding changed to asymmetric (16/16/20/20). Promoted card hover preserves glow.
  - `src/readings.js` — SLV-01 Part C: season transition interstitial in `setLiturgicalSeason()` — checks `mf-last-season` localStorage, shows overlay with season name/message, auto-dismiss 4s, tap-dismiss, respects `_devSkipSeasonOverlay` flag. SLV-02: LORD→small-caps regex applied after BibleGet HTML build before caching.
  - `src/app.js` — Added `window._devSkipSeasonOverlay = true` in `_devSetSeason()` to prevent interstitial during dev panel season switching.
  - `src/bible.js` — SLV-02: LORD→small-caps regex applied before `bodyEl.innerHTML = html` assignment.
- **Approach:** Followed spec implementation order (SLV-01→03→02→04→05→06). Used `@property` CSS registration for accent color transitions with per-element fallback for older Safari. Dark mode header bar consolidated to single `color-mix()` rule instead of 5 per-season rules (Easter/Christmas gets separate gradient). Season interstitial creates DOM element dynamically, no HTML template needed. Drop cap targets `.reading-text` children (where daily readings actually render) rather than `.reader-body` (which isn't used for readings). LORD regex applied at BibleGet cache point to catch all verse types and persist small-caps in localStorage cache.
- **Deviations from spec:**
  - SLV-01 Part B: Dark mode header bars consolidated into 2 rules (1 generic + 1 Easter/Christmas) instead of 5 per-season rules, since `var(--color-accent)` already shifts with season.
  - SLV-02 Part A: Drop cap targets `.reading-text > .reading-verse:first-child::first-letter` etc. instead of `.reader-body[data-content="readings"]` because daily readings render in `#readingsContent` on the More tab, not in the reader overlay.
  - SLV-02 Part B: `.reader-title` already had `letter-spacing: 0.02em` — kept as-is since it's close to the spec's 0.015em.
  - SLV-05: Saint card already uses a functionally equivalent gradient — left as-is per spec's own note that `[data-lit-color]` variants override.
- **Known issues:** None observed.
