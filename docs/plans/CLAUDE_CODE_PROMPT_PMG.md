# Claude Code Implementation Prompt — PMG Series (Prayer Tools Grid Restructure)

**Spec:** `docs/plans/UX_Spec_Pocket_Missal_Grid.md`
**Prefix:** PMG
**Priority:** P1 — prerequisite for PMB and PMD series. Ship first.

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css   # verify tokens
cat CLAUDE.md            # read conventions
cat docs/plans/UX_Spec_Pocket_Missal_Grid.md  # read full spec
```

---

## Implementation Order

### 1. PMG-01 + PMG-02 — Grid Layout Change

**Files:** `css/app.css`, `index.html`

**css/app.css:**
- Line 1605: Change `.prayer-tools-grid` from `grid-template-columns: 1fr` to `grid-template-columns: 1fr 1fr`
- Line 1606: Remove the `@media (min-width: 480px)` override for `.prayer-tools-grid`
- Line 2957: Remove the `@media (min-width: 680px)` override for `.prayer-tools-grid`
- Add `.prayer-tools-secondary` grid after `.prayer-tools-grid` styles:
  ```css
  .prayer-tools-secondary { display:grid;grid-template-columns:1fr 1fr 1fr;gap:var(--space-2);margin-top:var(--space-2); }
  ```

**index.html:** After line 136 (`<div class="prayer-tools-grid" id="prayerToolsGrid"></div>`), add:
```html
<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>
```

Ensure `<div id="libraryTeaser"></div>` remains after both grids.

### 2. PMG-03 — Card Layout Variants

**Files:** `css/app.css`

Add primary card vertical layout and secondary card compact layout. See spec PMG-03 for full CSS. Place after existing `.prayer-tool-card` styles (~line 1620).

Key points:
- `.prayer-tool-card--primary`: `flex-direction: column; align-items: flex-start; min-height: 84px;`
- `.prayer-tool-card--secondary`: `padding: var(--space-2) var(--space-3); min-height: 44px;` with hidden subtitle
- `.prayer-tool-card--secondary .prayer-tool-subtitle { display: none; }`

### 3. PMG-04 — Split Card Rendering in more.js

**Files:** `src/more.js`

**Step 1:** Add `tier` property to each card in the `ptCards` array (~line 931):
```javascript
var ptCards = [
  { id: 'rosary', title: 'Guided Rosary', subtitle: _getRosarySubtitle(), action: 'openRosary()', active: true, tier: 1 },
  { id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for confession', action: 'openExamination()', active: true, tier: 1 },
  { id: 'stations', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : '14 stations of prayer', action: 'openStations()', active: true, tier: 2 },
  { id: 'novena', title: 'Novena Tracker', subtitle: novSub, action: 'openNovena()', active: true, tier: 2 },
  { id: 'firstfriday', title: 'First Friday & Saturday', subtitle: ffSub.text, action: 'openFirstFriday()', active: true, tier: 2 }
];
```

Note: Only 2 tier-1 cards for now (Rosary + Exam). Prayer Book and Chaplet cards will be added by PMB and PMD specs. The grid will have 2 primary cards initially (2×1 grid) which still works with `grid-template-columns: 1fr 1fr`.

**Step 2:** Add `_resolveCardTiers()` function that handles promoted-card swaps (see spec PMG-04 for full logic). For now, implement the basic version that just filters by tier since we only have 2 tier-1 cards initially.

**Step 3:** Split the rendering. Replace the single `ptGrid.innerHTML = ptCards.map(...)` with:

```javascript
var tiers = _resolveCardTiers(ptCards, promotedId);
var primaryCards = ptCards.filter(function(c) { return tiers.primary.indexOf(c.id) !== -1; });
var secondaryCards = ptCards.filter(function(c) { return tiers.secondary.indexOf(c.id) !== -1; });

ptGrid.innerHTML = primaryCards.map(function(c) {
  return _renderCard(c, 'primary', promotedId, ptIcons, ptColors, ptBgColors, ptSubtitleClass);
}).join('');

var secEl = document.getElementById('prayerToolsSecondary');
if (secEl) {
  secEl.innerHTML = secondaryCards.map(function(c) {
    return _renderCard(c, 'secondary', promotedId, ptIcons, ptColors, ptBgColors, ptSubtitleClass);
  }).join('');
}
```

Extract the card rendering into a `_renderCard()` helper that adds `--primary` or `--secondary` class based on the tier parameter.

### 4. PMG-05 + PMG-06 — Library Teaser + Dark Mode

**Files:** `css/app.css`, `src/more.js`

- Add `margin-top: var(--space-2)` to `.library-teaser`
- Verify dark mode: the new `--primary` and `--secondary` classes should inherit from base `.prayer-tool-card` dark styles. Add explicit overrides only if needed.

---

## Test Checklist

After implementation:
1. `npm run build` — verify build succeeds
2. Mobile viewport (375px): primary grid shows 2 columns, secondary shows 3 columns
3. All 5 cards are visible and tappable
4. Promoted card (test by temporarily setting `promotedId = 'stations'`) gets border/gradient
5. Dark mode: all cards readable
6. Tab through all cards with keyboard — verify focus states
7. Library teaser appears below secondary row
8. Total section height ≤ 300px on iPhone SE viewport

---

## Important Notes

- Do NOT create the Prayer Book or Chaplet cards yet — those come from PMB and PMD specs
- The primary grid will initially have only 2 cards (Rosary + Exam) in a 2×1 layout. This is expected and will fill to 2×2 when PMB and PMD ship.
- CommonJS only — no arrow functions
- All new CSS needs `html[data-theme="dark"]` verification
- Bump SW cache version in `sw.js` after changes
