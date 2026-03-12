# SPEC-006 — More Tab, CCC & Bible Reader Refinements
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~1.5 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-006-A | IDEA-026 | More tab: remove redundant season sub-label | open |
| SPEC-006-B | IDEA-043 | Bible reader: destination highlight not prominent enough | open |
| SPEC-006-C | IDEA-052 | CCC "See Also" references clipped at bottom of screen | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/more.js`, `src/bible.js`, `src/ccc.js`, and `css/app.css` (tokens at lines 38–80) before beginning.

**Design principles:**
- `--font-prayer` (Georgia) for sacred/contemplative text
- `--font-body` for UI chrome
- Seasonal accent threading: `--color-accent` shifts with liturgical season
- Dark mode parity for every CSS change
- SVG only — no emoji
- CommonJS — no arrow functions

**Ordering:** SPEC-006-A is independent and small. SPEC-006-B is independent and small. SPEC-006-C is independent — check for a shared root cause with the examination scroll bug (SPEC-003-A) before writing a new fix.

---

## SPEC-006-A — More tab: remove redundant season sub-label
**Origin:** IDEA-026 | **Status:** open

### Goal
The liturgical day card on the More tab shows a header like "Thursday of the 3rd Week of Lent" followed by a smaller sub-label "Lent." The sub-label is fully redundant — the season is already encoded in the header text. During Ordinary Time it would read "Ordinary Time" all year. Remove it.

This item is related to SPEC-005-D (suppress season label in Saved tab). The same `getDisplaySeasonLabel()` helper implemented there could be used here to suppress during Ordinary Time — but in this case the sub-label should be removed unconditionally since it is always redundant with the header, not just during Ordinary Time.

### Files affected
- `src/more.js`
- `css/app.css` — if the sub-label element's CSS selector should also be cleaned up

### Before (description)
Liturgical day card renders:
```
Thursday of the 3rd Week of Lent   ← header
Lent                                 ← sub-label (redundant)
```

### After
Liturgical day card renders:
```
Thursday of the 3rd Week of Lent   ← header only
```

**Steps:**
1. Find the sub-label element in `src/more.js`
2. Remove it from the render function (do not just hide with CSS — remove from the DOM)
3. Remove its CSS selector from `css/app.css` if it is only used for this element
4. If the selector is shared, leave the CSS and only remove the element from the render function

### Test checklist
- [ ] More tab liturgical day card shows header text only — no season sub-label below it
- [ ] During Lent: header like "Thursday of the 3rd Week of Lent" — no "Lent" sub-label
- [ ] During Ordinary Time: no sub-label (was already the problematic state)
- [ ] Card layout is not disrupted by the element's removal — no extra whitespace gap
- [ ] Dark mode unaffected

### Claude Code notes
This is a removal, not an addition. Read the render function in `more.js` to locate the exact element. After removing it, check if its CSS class is used anywhere else in the app before deleting the CSS rule.

---

## SPEC-006-B — Bible reader: destination highlight not prominent enough
**Origin:** IDEA-043 | **Status:** open

### Goal
When the Bible reader is opened from a deep-link (via Rosary, Stations, Examination, or a cross-reference) and scrolls to the target verse, the verse highlight is too subtle to immediately catch the eye. The highlighted verse should be visually unmistakable.

### Files affected
- `css/app.css` — `.bible-verse--highlighted` or equivalent selector
- `src/bible.js` — confirm the highlight class name and scroll behavior

### Before (description)
Target verse highlight is likely a light background tint (`background-color: rgba(...)` at low opacity) that blends into surrounding text. Users must scan to find which verse they were linked to.

### After
**Enhanced highlight:**
```css
.bible-verse--highlighted {
  background-color: color-mix(in srgb, var(--color-accent) 18%, transparent);
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-sm);
  border-radius: 0 var(--border-radius-sm) var(--border-radius-sm) 0;
  /* Pulse animation to draw attention on load */
  animation: verse-highlight-pulse 1.2s ease-out forwards;
}

@keyframes verse-highlight-pulse {
  0%   { background-color: color-mix(in srgb, var(--color-accent) 40%, transparent); }
  100% { background-color: color-mix(in srgb, var(--color-accent) 18%, transparent); }
}
```

**Fallback for browsers without `color-mix` support:**
```css
@supports not (background-color: color-mix(in srgb, red 10%, transparent)) {
  .bible-verse--highlighted {
    background-color: rgba(150, 100, 50, 0.15); /* fallback amber */
    border-left: 3px solid var(--color-accent);
  }
}
```

**Scroll behavior:** Confirm `src/bible.js` uses `scrollIntoView({ behavior: 'smooth', block: 'center' })` — update if it uses `block: 'start'` (center is better for context).

### CSS / dark mode
- `color-mix()` with `--color-accent` will resolve correctly in dark mode since `--color-accent` is a token
- The left border `--color-accent` is season-aware

### Test checklist
- [ ] Deep-linked verse is immediately visually obvious — accent border + tinted background
- [ ] Pulse animation plays once on load, then settles to the steady tint
- [ ] Verse is scrolled to vertical center of viewport (not top)
- [ ] Dark mode: tint visible against dark background, border color correct
- [ ] Non-highlighted verses unaffected — no bleed of styles
- [ ] Fallback renders acceptably on Safari if `color-mix` not supported (check Safari version support)

### Claude Code notes
Read `src/bible.js` to find the current highlight class name. If it is different from `.bible-verse--highlighted`, adjust the CSS selectors to match. The `color-mix()` function has good support in modern iOS Safari (16.2+) — the `@supports` fallback covers older devices.

---

## SPEC-006-C — CCC "See Also" references clipped at bottom
**Origin:** IDEA-052 | **Status:** open

### Goal
The "See Also" section at the bottom of a CCC entry is sometimes cut off and not fully visible. The CCC sheet must allow the "See Also" section to be fully scrollable — no clipping.

### Files affected
- `src/ccc.js`
- `css/app.css` — CCC sheet container and inner content selectors

### Before (description)
The CCC sheet is a bottom sheet at 88vh. Its inner content container may have `overflow: hidden` or a max-height that clips the last section. "See Also" is always rendered last, making it the first victim of any clipping.

### After
- The CCC sheet inner content area uses `overflow-y: auto` with `-webkit-overflow-scrolling: touch`
- The content area's height fills the available sheet height minus the sheet header
- Sufficient `padding-bottom` at the bottom of the content to clear iOS home bar / safe area: `padding-bottom: calc(var(--space-lg) + env(safe-area-inset-bottom))`
- "See Also" is always fully visible and scrollable

**Specific CSS changes to make:**
```css
.ccc-sheet-content {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(var(--space-xl) + env(safe-area-inset-bottom));
  /* remove any max-height that is causing clipping */
}
```

### CSS / dark mode
Content and scrollbar colors are token-based — no dark-mode override needed for the scroll fix itself.

### Test checklist
- [ ] Open a CCC entry with "See Also" references — scroll to the bottom — all references visible
- [ ] No clipping at the bottom of long CCC entries
- [ ] iOS home bar safe area is cleared (test on iPhone with home indicator)
- [ ] Sheet still opens at 88vh — the fix does not change sheet height
- [ ] Dark mode: no visual regression

### Claude Code notes
Read the CCC sheet CSS carefully. Look for `overflow: hidden`, `max-height: Xpx` (non-dynamic), or missing `padding-bottom`. The `env(safe-area-inset-bottom)` is critical for modern iPhones. If the app checks for `SPEC-003-A` type scroll initialization issues (landing page scrolled to bottom), confirm this is a different problem — the CCC sheet is a different component.
