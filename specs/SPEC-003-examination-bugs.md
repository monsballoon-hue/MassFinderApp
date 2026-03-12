# SPEC-003 — Examination of Conscience Bug Fixes
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~2–3 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-003-A | IDEA-032 | Landing page loads scrolled to bottom, cross barely visible | open |
| SPEC-003-B | IDEA-033 | "No items noted yet" visible before starting | open |
| SPEC-003-C | IDEA-034 | Progress tracker renders at full viewport height | open |
| SPEC-003-D | IDEA-036 | "Prayers" label after confession summary should be centered | open |
| SPEC-003-E | IDEA-035 | CCC "See Full Range" navigation loses examen progress | open |
| SPEC-003-F | IDEA-037 | Reconciliation confirmation: clashing pop-up, summary not cleared | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/examination.js` and `css/app.css` (tokens at lines 38–80) in full before beginning. The Examination module uses a centering prayer screen on load, a full-row tap-target item list, and a confessional format summary. Privacy is critical — examination items must remain in memory only and must never be written to `localStorage` or any persistent store.

**Design principles:**
- `--font-prayer` (Georgia) for all prayer text and examination items
- `--font-body` for UI chrome (labels, buttons, progress)
- Dark mode parity for every change
- SVG only — no emoji
- Haptic feedback on interactive touches (see `src/haptics.js`)
- CommonJS everywhere — no arrow functions
- Touch targets ≥ 44×44pt
- **Privacy-first:** examination items stay in memory only

**Ordering:** SPEC-003-A and SPEC-003-B first (landing page issues, likely related). SPEC-003-C next (likely caused by -A, may auto-resolve). SPEC-003-D is independent. SPEC-003-E and SPEC-003-F last (functional behavior, not layout).

---

## SPEC-003-A — Landing page loads scrolled to bottom, cross barely visible
**Origin:** IDEA-032 | **Status:** open

### Goal
The Examination of Conscience landing page loads in a scrolled-to-bottom state. The cross graphic is barely visible and the centering prayer text is off-screen. The landing screen should render fully in-view, vertically centered in the viewport, with the cross and prayer text both visible without scrolling.

### Files affected
- `src/examination.js` — landing screen render function
- `css/app.css` — `.examination-landing` or equivalent container selector

### Before (description)
The landing container's flex or absolute layout is miscalculating height, causing the rendered content to start below the visible viewport. The scroll position is not reset to `0,0` when the examination screen is opened.

### After
- Opening the Examination calls `scrollTo(0, 0)` or equivalent on the container element immediately after render
- The landing container uses `min-height: 100vh` (or `100dvh` for modern mobile) and `display: flex; flex-direction: column; justify-content: center; align-items: center`
- Cross SVG is fully visible in the upper portion of the screen
- Centering prayer text is fully visible without scrolling on 667px viewport (iPhone 8 height — minimum target)

### CSS / dark mode
- Cross SVG color should use `--color-accent` (season-aware) in light mode and the same or slightly desaturated variant in dark mode
- Background: `--color-background` token

### Test checklist
- [ ] Landing screen opens with cross fully visible, not clipped at top
- [ ] Centering prayer text visible without scrolling on 375×667 (iPhone 8)
- [ ] Scroll position is 0,0 when landing renders
- [ ] Dark mode: cross and prayer text visible, no white-on-white or invisible elements
- [ ] Layout is not broken at 390×844 (iPhone 14) or 430×932 (iPhone 14 Plus)

### Claude Code notes
The most likely cause is that the landing container's parent has an unintended height or the container itself uses `height: 100%` with a parent that has no defined height. Check the rendering call-site — is the container appended to a parent div that has leftover scroll position from a previous view? A `scrollTo(0,0)` call at render time may be sufficient.

---

## SPEC-003-B — "No items noted yet | view summary" visible before starting
**Origin:** IDEA-033 | **Status:** open

### Goal
The "No items noted yet | view summary" UI element is visible on the landing screen before the user has interacted with the examination at all. It should only be shown once the user has started (i.e., begun reviewing examination items), and should remain hidden during the landing/centering prayer phase.

### Files affected
- `src/examination.js`

### Before (description)
The noted-items counter/summary prompt is rendered as part of the initial DOM and has no hidden state on first load.

### After
- The "No items noted yet" element has `display: none` or is not rendered at all until the user has tapped "Begin" or equivalent (the transition past the centering prayer screen)
- Once the user is in the examination item list, the element renders normally (showing either "No items noted yet" or the count of noted items)
- If the examination is reset or restarted, the element returns to hidden

### CSS / dark mode
No new styles required. Only render/hide logic in JS.

### Test checklist
- [ ] Landing screen: "No items noted yet | view summary" is not visible
- [ ] After tapping Begin and entering the item list: element is visible
- [ ] After noting at least one item: element shows correct count
- [ ] After resetting/restarting examination: element is hidden again on landing
- [ ] No flash of the element during transition from landing to item list

### Claude Code notes
Read the render function carefully to find where this element is inserted. The simplest fix is a conditional render guard — only insert the element after the examination has entered its active state. Check what "active state" flag or phase variable already exists in the module.

---

## SPEC-003-C — Progress tracker renders at full viewport height
**Origin:** IDEA-034 | **Status:** open

### Goal
After starting the Examination, the progress tracker at the top of the screen renders at nearly full viewport height instead of as a thin horizontal bar (similar to a progress bar or step indicator). The tracker should be compact — no taller than ~8px for the bar itself, with a label line if needed.

### Files affected
- `css/app.css` — progress tracker container selector
- `src/examination.js` — if markup structure contributing to height needs correction

### Before (description)
Progress tracker container has no explicit `height` or has inherited a percentage height from a parent that resolves to the full viewport. The element takes up the majority of the screen.

### After
- Progress tracker is a thin horizontal element:
  - Bar height: `6px` or `8px` (use `--space-xs` or a direct value — check token scale)
  - Container max-height: `40px` total (bar + optional label)
  - `overflow: hidden` on the container to prevent bleed
- Progress fill uses `--color-accent` (season-aware)
- Background track uses `--color-border` or `--color-surface-alt`
- Label (if present, e.g., "3 / 47") uses `--font-body`, `font-size: 0.75rem`

### CSS / dark mode
- Progress fill: `--color-accent`
- Track background: `--color-border` (light) / `--color-border` (dark — same token, different resolved value)
- Label text: `--color-text-secondary`

### Test checklist
- [ ] Progress bar height ≤ 8px, full-width, anchored to top of examination content area
- [ ] Container total height ≤ 40px
- [ ] Fill color uses `--color-accent` and updates as items are reviewed
- [ ] Dark mode: track visible against dark background, fill color correct
- [ ] Layout below the tracker (item list) is not displaced or compressed

### Claude Code notes
This may be partially or fully caused by the landing page height issue fixed in SPEC-003-A. After applying -A, re-test the progress tracker height before writing any additional CSS. The fix here may be as simple as adding an explicit `height: 8px` and `max-height: 8px` to the tracker element.

---

## SPEC-003-D — "Prayers" label after confession summary should be centered
**Origin:** IDEA-036 | **Status:** open

### Goal
The "Prayers" section label appearing after the "Summary for Confession" block is left-aligned but should be centered to match the visual weight and hierarchy of the summary screen.

### Files affected
- `css/app.css` — examination summary "Prayers" heading selector
- `src/examination.js` — confirm the element's class or tag

### Before
```css
/* existing or missing rule */
.examination-summary-prayers-label {
  text-align: left; /* or no text-align at all */
}
```

### After
```css
.examination-summary-prayers-label {
  text-align: center;
  font-family: var(--font-display);
  font-size: 1rem;
  color: var(--color-text-secondary);
  margin-top: var(--space-lg);
}
```

### CSS / dark mode
- Color: `--color-text-secondary` (resolves correctly in dark mode via token)
- No dark-mode–specific override needed

### Test checklist
- [ ] "Prayers" label is horizontally centered above the prayers section
- [ ] Alignment matches other section headings on the summary screen
- [ ] Dark mode: label visible, correct color
- [ ] No layout impact on surrounding elements

### Claude Code notes
Small, targeted change. Read `src/examination.js` to find the exact class name used for this element before editing CSS.

---

## SPEC-003-E — CCC "See Full Range" navigation loses examen progress
**Origin:** IDEA-035 | **Status:** open

### Goal
Tapping a CCC reference during the Examination opens the reference correctly. But tapping "See Full Range" (or equivalent deep-link within the CCC sheet) navigates away from the Examination with no way to return, losing all progress.

This is the same class of back-navigation regression as SPEC-002-F (Rosary/Stations → Bible). The approach is identical: pass a `returnContext` to the CCC overlay so it can render a "← Back to Examination" button.

### Files affected
- `src/examination.js`
- `src/ccc.js`

### Before (description)
When the Examination opens a CCC reference via an inline tap:
- CCC sheet opens without any return context
- "See Full Range" within the CCC navigates to the full CCC browser with no back path to the Examination
- All in-progress examination state (noted items, current position) is lost

### After
1. When Examination opens a CCC reference, pass `returnContext`:
   ```js
   var returnContext = {
     module: 'examination',
     phase: state.currentPhase,      // 'active' | 'summary'
     currentItemIndex: state.currentItemIndex,
     notedItems: state.notedItems    // array of noted item IDs — memory only
   };
   openCCCOverlay(paragraphRef, returnContext);
   ```

2. `ccc.js` overlay stores `returnContext` in module scope. When "See Full Range" is tapped:
   - Instead of a full navigation away, render a back button: "← Back to Examination"
   - On tapping back: call `examination.restoreState(returnContext)` to return to the exact item and noted state

3. If `returnContext` is absent (CCC opened directly), existing behavior unchanged.

**Privacy constraint:** `notedItems` passed in `returnContext` must remain in memory only — never serialized to `localStorage` or any persistent store.

### CSS / dark mode
- "← Back to Examination" button: same styling as established in SPEC-002-F
- SVG chevron-left icon, `--font-body`, `--color-text-secondary`
- Dark mode tokens only

### Test checklist
- [ ] Tap CCC ref in Examination → CCC opens → "See Full Range" tap shows "← Back to Examination" button
- [ ] Tapping "← Back to Examination" returns to the exact item index and noted state
- [ ] Noted items are preserved in memory through the round-trip
- [ ] Opening CCC directly (from More tab or elsewhere): close/back behavior unchanged
- [ ] Noted items are never written to `localStorage` at any point in the flow

### Claude Code notes
Coordinate with SPEC-002-F — the `returnContext` pattern and the CCC overlay back-button rendering should be implemented identically across both specs. If SPEC-002-F is already complete when this is being implemented, reuse the exact same pattern rather than inventing a new one. The `examination.js` module must expose a `restoreState(ctx)` function that accepts the context object and re-renders from the saved state.

---

## SPEC-003-F — Reconciliation confirmation: clashing pop-up, summary not cleared
**Origin:** IDEA-037 | **Status:** open

### Goal
Two problems with the "I received the sacrament of Reconciliation" confirmation:
1. Tapping the button produces a pop-up overlay that visually clashes with buttons beneath it
2. After confirming, the summary and noted items remain visible — they should be cleared

### Files affected
- `src/examination.js`
- `css/app.css`

### Before (description)
Tapping the Reconciliation CTA triggers a `showToast()` or similar temporary overlay element that overlaps the buttons below the CTA. After the toast dismisses, the summary content (sins noted, Act of Contrition, etc.) remains on-screen.

### After
**Problem 1 — Replace pop-up with in-place confirmation:**
- Remove the pop-up/toast
- Instead: the CTA button itself animates to a "checkmark received" state:
  - Button text changes to "✓ Received" (use an SVG checkmark, not ✓ emoji character — or use CSS `::before` with a checkmark path)
  - Button background transitions to a muted success color (e.g., `--color-success` if it exists, or `hsl(145, 40%, 45%)` for light / `hsl(145, 40%, 35%)` for dark)
  - Brief pulse animation (scale 1 → 1.03 → 1 over 300ms) using CSS `@keyframes`
  - Button becomes disabled (`pointer-events: none`) after state change

**Problem 2 — Clear summary after Reconciliation confirmed:**
- 1500ms after the button animates to "received" state, transition the summary content out:
  - Fade out the noted items list and summary block using CSS opacity transition (300ms)
  - After fade, replace with a single centered "Thanks be to God." text in `--font-prayer` (Georgia), `--color-text-secondary`
  - In-memory noted items array is cleared (`state.notedItems = []`)
  - Streak/activity tracker records the completed examination (if that hook exists)

### CSS / dark mode
```css
/* New pulse animation */
@keyframes reconciliation-received {
  0%   { transform: scale(1); }
  50%  { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.exam-reconciliation-btn--received {
  animation: reconciliation-received 300ms ease;
  background-color: hsl(145, 40%, 45%);
  pointer-events: none;
}

@media (prefers-color-scheme: dark) {
  .exam-reconciliation-btn--received {
    background-color: hsl(145, 40%, 35%);
  }
}

/* also honor [data-theme="dark"] if the app uses that pattern */
[data-theme="dark"] .exam-reconciliation-btn--received {
  background-color: hsl(145, 40%, 35%);
}
```

### Test checklist
- [ ] Tapping Reconciliation CTA: no pop-up or toast appears
- [ ] Button animates (pulse) and changes to "✓ Received" state
- [ ] Button is disabled after state change — cannot be tapped again
- [ ] 1500ms after confirmation: noted items fade out
- [ ] After fade: "Thanks be to God." text appears in Georgia, centered
- [ ] `state.notedItems` is empty after confirmation (privacy — nothing persisted)
- [ ] Dark mode: success button color is correct dark-mode variant

### Claude Code notes
Check whether the app uses `[data-theme="dark"]` attribute or `prefers-color-scheme` media query for dark mode — apply dark mode CSS accordingly. Ensure `state.notedItems = []` is called in the JS, not just the UI cleared. Confirm haptic feedback fires on the CTA tap (check `haptics.js` for the appropriate feedback type — likely `medium` impact).
