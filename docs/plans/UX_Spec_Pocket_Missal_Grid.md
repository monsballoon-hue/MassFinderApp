# UX Spec — Pocket Missal: Prayer Tools Grid Restructure

**Date:** 2026-03-14
**Author:** UX Consultant (Claude Opus)
**Status:** Implemented
**Prerequisite for:** PMB (Prayer Book), PMD (Chaplet & Devotions)
**Prefix:** PMG

| Item | Title | Status |
|------|-------|--------|
| PMG-01 | Always-2-Column Primary Grid | done |
| PMG-02 | Secondary Compact Row (3-up) | done |
| PMG-03 | Vertical Card Layout for Primary Cards | done |
| PMG-04 | Promoted Card Swap Logic | done |
| PMG-05 | Library Teaser Repositioning | done |
| PMG-06 | Dark Mode Parity | done |

---

## Context

The Prayer & Devotion section currently has **5 cards** (Rosary, Examination, Stations, Novena, First Friday/Saturday) in a single-column mobile grid (~300px vertical space). The Pocket Missal plan adds Prayer Book and Divine Mercy Chaplet, bringing the total to **7 cards**. At 7 single-column rows, the section would consume ~420px before the user reaches "Grow in Faith" — an unacceptable scroll cost for all three demographics.

This spec restructures the grid into a **2×2 primary grid** + **3-up secondary row**, fitting 7 items in ~280px — *less* space than the current 5-card layout.

### Demographic Rationale

- **72-year-old:** Four large cards with icons are scannable at arm's length. Three smaller secondary items don't compete for attention.
- **25-year-old:** Clean 2×2 grid matches iOS/Android native app patterns. Compact secondary row signals "more tools" without clutter.
- **45-year-old parent:** Entire section visible in one viewport on any phone. No scrolling past prayer cards to reach faith guides.

---

## [PMG-01] Always-2-Column Primary Grid

**Files:** `css/app.css`
**Priority:** P1 — blocks PMB and PMD specs

### Current State

```css
/* Line 1605 */
.prayer-tools-grid { display: grid; grid-template-columns: 1fr; gap: var(--space-2); }
@media (min-width: 480px) { .prayer-tools-grid { grid-template-columns: 1fr 1fr; } }
/* Line 2957 */
@media (min-width:680px) { .prayer-tools-grid { grid-template-columns:1fr 1fr; } }
```

Mobile shows 1 column. Tablet+ shows 2 columns.

### Proposed

```css
.prayer-tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
```

Remove both `@media` overrides for `.prayer-tools-grid` (lines 1606 and 2957). The grid is always 2 columns.

At iPhone SE width (375px), each column is ~170px after padding. At iPhone 14 Pro (393px), ~182px. Both are well above the 44pt minimum touch target.

### Test Checklist

- [ ] iPhone SE (375px): two columns render, no horizontal overflow
- [ ] iPhone 14 Pro (393px): cards don't feel cramped
- [ ] iPad (768px+): grid still looks balanced (may want max-width on section)
- [ ] Verify `min-height: 48px` still met on all cards

---

## [PMG-02] Secondary Compact Row (3-up)

**Files:** `css/app.css`, `src/more.js`

### What Changes

The prayer tools card array in `more.js` (~line 931) currently renders all cards into a single `.prayer-tools-grid`. This splits into two containers:

1. `.prayer-tools-grid` — primary 2×2 grid (4 cards)
2. `.prayer-tools-secondary` — compact 3-up row beneath (3 cards)

### Default Card Assignment

**Primary grid (Tier 1 — frequent, broad appeal):**
1. Prayer Book (NEW — PMB spec)
2. Guided Rosary
3. Divine Mercy Chaplet (NEW — PMD spec)
4. Examination of Conscience

**Secondary row (Tier 2 — contextual, specific audience):**
5. Stations of the Cross
6. Novena Tracker
7. First Friday & Saturday

### CSS for Secondary Row

```css
.prayer-tools-secondary {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--space-2);
  margin-top: var(--space-2);
}
```

### HTML Structure Change in `more.js`

Before (single grid):
```javascript
ptGrid.innerHTML = ptCards.map(...).join('');
```

After (split):
```javascript
var primaryCards = ptCards.filter(function(c) { return c.tier === 1; });
var secondaryCards = ptCards.filter(function(c) { return c.tier === 2; });
ptGrid.innerHTML = primaryCards.map(function(c) { return _renderPrimaryCard(c); }).join('');

var secEl = document.getElementById('prayerToolsSecondary');
if (secEl) {
  secEl.innerHTML = secondaryCards.map(function(c) { return _renderSecondaryCard(c); }).join('');
}
```

### index.html Addition

After the existing `prayerToolsGrid` div (~line 136):
```html
<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>
```

### Test Checklist

- [ ] Primary grid shows exactly 4 cards in 2×2
- [ ] Secondary row shows exactly 3 cards in 3-up
- [ ] iPhone SE: secondary cards are tappable (each ~110×44px minimum)
- [ ] Section total vertical height ≤ 300px on mobile

---

## [PMG-03] Vertical Card Layout for Primary Cards

**Files:** `css/app.css`

### Current Card Layout

Cards use horizontal flex (icon-left, text-right):
```css
/* Line 1605 */
.prayer-tool-card { display:flex;align-items:center;gap:var(--space-3);... }
```

### Primary Card Layout (Vertical)

Primary cards switch to vertical stacking to fit in the narrower 2-column grid:

```css
.prayer-tool-card--primary {
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  min-height: 84px;
}
.prayer-tool-card--primary .prayer-tool-icon {
  margin-bottom: var(--space-1);
}
.prayer-tool-card--primary .prayer-tool-title {
  font-size: var(--text-sm);
  line-height: 1.3;
}
.prayer-tool-card--primary .prayer-tool-subtitle {
  font-size: var(--text-xs);
  line-height: 1.3;
}
```

### Secondary Card Layout (Compact Horizontal)

Secondary cards stay horizontal but shrink:

```css
.prayer-tool-card--secondary {
  padding: var(--space-2) var(--space-3);
  min-height: 44px;
  gap: var(--space-2);
}
.prayer-tool-card--secondary .prayer-tool-icon {
  width: 24px;
  height: 24px;
}
.prayer-tool-card--secondary .prayer-tool-icon svg {
  width: 14px;
  height: 14px;
}
.prayer-tool-card--secondary .prayer-tool-title {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
}
.prayer-tool-card--secondary .prayer-tool-subtitle {
  display: none;
}
```

### Promoted Card Override

When a secondary card is promoted (e.g., Stations during Lent), the `--promoted` style overrides the secondary compact layout:

```css
.prayer-tool-card--secondary.prayer-tool-card--promoted {
  /* Inherit primary sizing when promoted */
  flex-direction: column;
  align-items: flex-start;
  padding: var(--space-3) var(--space-4);
  min-height: 84px;
}
.prayer-tool-card--secondary.prayer-tool-card--promoted .prayer-tool-subtitle {
  display: block;
}
```

### Test Checklist

- [ ] Primary cards: icon top-left, title below, subtitle below title
- [ ] Secondary cards: icon-left, title-right, no subtitle visible
- [ ] Title wrapping: "Examination of Conscience" wraps to 2 lines in primary — acceptable
- [ ] Title truncation: "First Friday & Saturday" fits in secondary at 110px width
- [ ] Touch targets: all cards ≥ 44×44pt

---

## [PMG-04] Promoted Card Swap Logic

**Files:** `src/more.js`

### Current Behavior

The `promotedId` variable (~line 890) highlights a card with a left border and gradient. All cards stay in the same flat list.

### Proposed Behavior

When `promotedId` targets a secondary card (Stations, Novena, or First Friday), that card **swaps into the primary grid** and the least-relevant primary card moves to secondary.

**Swap rules:**
- Stations promoted (Lent) → swaps with Prayer Book (user unlikely to be browsing prayers during Stations season)
- Novena promoted (active novena nearing completion) → swaps with Chaplet
- First Friday promoted (day-of/day-before) → swaps with Chaplet

**Implementation:** Add a `_resolveCardTiers()` function that returns the final primary/secondary arrays after applying promotion swaps:

```javascript
function _resolveCardTiers(allCards, promotedId) {
  var primaryIds = ['prayerbook', 'rosary', 'chaplet', 'examination'];
  var secondaryIds = ['stations', 'novena', 'firstfriday'];

  // If promoted card is already in primary, no swap needed
  if (primaryIds.indexOf(promotedId) !== -1) {
    return { primary: primaryIds, secondary: secondaryIds };
  }

  // Swap promoted secondary card into primary
  if (promotedId === 'stations') {
    // Swap with prayerbook
    primaryIds[primaryIds.indexOf('prayerbook')] = 'stations';
    secondaryIds[secondaryIds.indexOf('stations')] = 'prayerbook';
  } else if (promotedId === 'novena' || promotedId === 'firstfriday') {
    // Swap with chaplet
    primaryIds[primaryIds.indexOf('chaplet')] = promotedId;
    secondaryIds[secondaryIds.indexOf(promotedId)] = 'chaplet';
  }

  return { primary: primaryIds, secondary: secondaryIds };
}
```

### Test Checklist

- [ ] During Lent: Stations appears in primary grid, Prayer Book moves to secondary
- [ ] On First Friday: First Fri/Sat appears in primary grid, Chaplet in secondary
- [ ] No promotion: default tier assignment holds
- [ ] Promoted card retains `--promoted` border/gradient styling

---

## [PMG-05] Library Teaser Repositioning

**Files:** `src/more.js`, `css/app.css`

### Current State

The Library teaser renders inside `#libraryTeaser` after the prayer tools grid. It uses `.library-teaser` styles.

### Proposed

The Library teaser moves below the secondary row. Visual treatment: full-width card with reduced opacity treatment (current `.coming-soon` pattern). No layout change needed — just ensure the teaser div in `index.html` is positioned after `prayerToolsSecondary`:

```html
<div class="prayer-tools-grid" id="prayerToolsGrid"></div>
<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>
<div id="libraryTeaser"></div>
```

Add spacing:
```css
.library-teaser { margin-top: var(--space-2); }
```

### Test Checklist

- [ ] Library teaser appears below secondary row
- [ ] Teaser visually distinct (muted) from active cards
- [ ] Tapping teaser does nothing (no action wired)

---

## [PMG-06] Dark Mode Parity

**Files:** `css/app.css`

### Items to Verify

All new CSS classes need `html[data-theme="dark"]` overrides:

```css
html[data-theme="dark"] .prayer-tool-card--primary {
  /* Inherits existing .prayer-tool-card dark styles */
}
html[data-theme="dark"] .prayer-tool-card--secondary {
  /* Same surface/border treatment as primary */
}
html[data-theme="dark"] .prayer-tools-secondary {
  /* No special override needed — inherits grid gap */
}
```

The existing dark mode rules for `.prayer-tool-card` and `.prayer-tool-card--promoted` (line 1622) should cascade to both `--primary` and `--secondary` variants since they extend the base class.

### Test Checklist

- [ ] Dark mode: primary cards have correct surface/border colors
- [ ] Dark mode: secondary cards readable at compact size
- [ ] Dark mode: promoted gradient uses `color-mix` pattern (line 1622)
- [ ] Dark mode: Library teaser muted treatment still visible

---

## Cascading Impacts

- **`src/more.js`:** The `ptCards` array (~line 931) needs `tier` property added to each card object. The rendering logic splits into primary/secondary loops.
- **`index.html`:** One new div (`prayerToolsSecondary`) inserted after `prayerToolsGrid`.
- **`css/app.css`:** New classes `--primary`, `--secondary`, `.prayer-tools-secondary`. Two `@media` rules removed.
- **No impact on:** reader.js, rosary.js, examination.js, stations.js, novena.js, or any data files. This is purely a layout spec.

---

## Implementation Notes — All PMG Items

### Implementation Notes

- **Date:** 2026-03-14
- **Status:** done (all 6 items)
- **Files changed:**
  - `css/app.css` — Changed `.prayer-tools-grid` to always `1fr 1fr`, removed two `@media` overrides, added `.prayer-tools-secondary` 3-up grid, added `.prayer-tool-card--primary` (vertical layout) and `.prayer-tool-card--secondary` (compact horizontal) variants, added promoted card override styles
  - `index.html` — Added `<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>` between prayer tools grid and library teaser
  - `src/more.js` — Added `tier` property to all ptCards, added `_resolveCardTiers(cards, promotedId)` swap logic, split rendering into primary/secondary loops with separate card renderers
- **Approach:** All 6 PMG items implemented as a single atomic change since they're tightly coupled. The grid always renders 2 columns now. Primary cards use vertical layout (icon top, title+subtitle below). Secondary cards use compact horizontal (icon left, title right, no subtitle). `_resolveCardTiers()` handles Stations↔Prayer Book and Novena/FirstFriday↔Chaplet swaps when promotion is active. Dark mode inherits from existing `.prayer-tool-card` dark styles.
- **Deviations from spec:** None significant. Followed spec exactly for grid layout, card variants, and swap logic.
- **Known issues:** None observed.
