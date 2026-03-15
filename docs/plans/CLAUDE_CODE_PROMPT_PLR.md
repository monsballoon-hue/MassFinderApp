# CLAUDE_CODE_PROMPT_PLR.md — Prayer Library Redesign

**Spec:** `docs/plans/UX_Spec_Prayer_Library_Redesign.md`  
**Series:** PLR-01 through PLR-05  
**Scope:** Prayer Book internal redesign — z-index, filters, guided elevation, favorites, visual warmth  
**Implementation order:** PLR-01 → PLR-05 → PLR-03 → PLR-02 → PLR-04

---

## PLR-01: Fix search bar z-index

1. `css/app.css` ~line 1856: change `.prayerbook-search` to:
   - `z-index:10` (from 2)
   - Add `margin:0 calc(-1 * var(--space-5));padding-left:var(--space-5);padding-right:var(--space-5);`
   - This extends background to full reader-body width during sticky scroll

## PLR-05: Visual warmth (do before structural changes)

1. `css/app.css` ~line 1861: `.prayerbook-row` change `margin-bottom:var(--space-1)` → `margin-bottom:var(--space-2)`
2. `css/app.css` ~line 1862: `.prayerbook-row--open` add `border-left:3px solid var(--color-sacred);`
3. `css/app.css` ~line 1867: `.prayerbook-text`:
   - Add `padding-top:var(--space-2)` (was 0)
   - Change `font-size:var(--text-sm)` → `font-size:var(--text-base)`
   - Add `border-top:1px solid color-mix(in srgb, var(--color-sacred) 8%, transparent);`

## PLR-03: Guided prayers elevated to top

1. In `_renderList()` of `src/prayerbook.js`: move the guided section rendering (litanies + lectio, currently after all categories ~lines 418-449) to BEFORE the Recent section
2. Replace `prayerbook-row--guided` button elements with new `prayerbook-guided-card` div cards:
   - Sacred left border (3px), icon circle (sacred-pale bg), title + "Guided · Swipe through" subtitle, guided badge
3. Section label: `<div class="prayerbook-category-title">Guided Experiences</div>`
4. CSS: add `.prayerbook-guided-card` rules (see spec for full CSS block)
5. When filter system is active (PLR-02), guided section respects the "guided" filter

## PLR-02: Category filter chips

1. Add `var _activeFilters = [];` to prayerbook.js state section
2. Add `prayerbookToggleFilter(filterId)` function — toggles filter in/out of array, re-renders
3. Expose as global: add to `module.exports` and ensure `window.prayerbookToggleFilter` is available
4. In `_renderList()`, replace the `quickIds` pill block with chip generation:
   - Chips: Essential, Daily, Marian, Saints, Sacrament, Guided
   - Filter IDs must map to category identifiers in prayerbook.json
   - Active chip gets `.prayerbook-quick-pill--active` class
5. Filter logic: when `_activeFilters.length > 0`, only render matching categories. "guided" filter shows guided section only
6. CSS: add `.prayerbook-quick-pill--active` rules (sacred-pale bg, sacred-text color, sacred border)
7. Filters clear when search query is entered (search overrides filters)

## PLR-04: Favorites system

1. Add `var _favorites = [];` state, `_loadFavorites()`, `prayerbookToggleFav(prayerId)` functions
2. Expose `prayerbookToggleFav` as global
3. In `_renderPrayerRow()`: add star button to each row header (before chevron)
   - 44px min touch target, `event.stopPropagation()` to prevent toggle
   - Filled sacred gold when active, outline when inactive
4. In `_renderList()`: if favorites exist, render "Favorites" strip above guided section
   - Compact clickable pills that expand the prayer on tap
5. Max 5 favorites, stored in `localStorage` key `mf-prayerbook-favs`
6. CSS: add `.prayerbook-fav-btn`, `.prayerbook-fav-icon`, `.prayerbook-fav-icon--active` rules

## Global exports

Ensure all new functions are exported from prayerbook.js module.exports AND accessible as window globals for onclick handlers:
- `prayerbookToggleFilter`
- `prayerbookToggleFav`

## Verification

- Search bar stays above content during scroll (no z-index bleed)
- 6 category chips render, toggle independently, filter the list
- Guided section (3 cards) renders above all categories
- Star icons on every prayer row, functional favorite toggle
- Favorites strip at top when ≥1 favorite exists
- Prayer text is 16px Georgia, rows have 8px gaps, open rows have sacred left border
- All dark mode rules in place
- `npm run build` succeeds
