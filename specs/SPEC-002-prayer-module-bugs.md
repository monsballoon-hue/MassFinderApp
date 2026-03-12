# SPEC-002 — Prayer Module Bugs: Rosary & Stations of the Cross
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~3–4 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-002-A | IDEA-027 | Rosary: bottom nav buttons bunched left | **done** |
| SPEC-002-B | IDEA-028 | Rosary: Hail Mary beads overflow container | **done** |
| SPEC-002-C | IDEA-031 | Rosary: back press resets completed decade to zero | **done** |
| SPEC-002-D | IDEA-030 | Rosary: CCC inline reference has no spacing from surrounding content | **done** |
| SPEC-002-E | IDEA-038 | Stations: navigation buttons left-aligned | **done** |
| SPEC-002-F | IDEA-029, IDEA-040 | Shared back-navigation: Rosary + Stations → Bible/CCC loses user's place | **done** |

---

## Context for Claude Code
**Fresh clone required.** Read `src/rosary.js`, `src/stations.js`, `src/bible.js`, `src/ccc.js`, and `css/app.css` (tokens at lines 38–80) before beginning. Do not rely on this spec for exact current code — treat before/after blocks as descriptions of intent, not guaranteed current state.

**Design principles:**
- `--font-prayer` (Georgia) for prayer text, `--font-body` for UI chrome
- Dark mode parity required for every CSS change
- SVG only — no emoji
- Haptic feedback on interactive touches (see `src/haptics.js`)
- CommonJS everywhere — no arrow functions, no ES module syntax
- Touch targets ≥ 44×44pt (Apple HIG)
- `config.js` is canonical for any new constants

**Ordering:** Do SPEC-002-A and SPEC-002-B first (layout fixes, independent). Then SPEC-002-C and SPEC-002-D (state + spacing, independent). Then SPEC-002-E (aligned with -A for consistency). SPEC-002-F last (shared back-nav touches multiple modules).

---

## SPEC-002-A — Rosary: bottom nav buttons bunched left
**Origin:** IDEA-027 | **Status:** done | **Completed:** 2026-03-12

### Goal
The bottom navigation buttons (e.g., "Back," "Next," "Amen") in the Rosary module are floated or flex-aligned to the left and visually bunched together. Fix layout so buttons are ergonomically placed for mobile thumb reach — either right-aligned for single-button states, or split left/right for two-button states.

### Files affected
- `css/app.css` — Rosary nav button container selector
- `src/rosary.js` — if button container markup needs adjustment

### Before (description)
Buttons share a container that aligns its children to `flex-start` or uses `float: left`, causing them to cluster at the left edge regardless of how many are present.

### After
- Container uses `display: flex; justify-content: space-between` when two buttons are present (Back left, Next right)
- Container uses `display: flex; justify-content: flex-end` when only one button is present (e.g., final "Amen" button sits right)
- Each button meets the 44×44pt minimum touch target
- Spacing uses existing `--space-*` tokens, not hardcoded px

### CSS / dark mode
The button styling itself (colors, backgrounds) should already be correct. Only layout changes needed. Verify dark mode is unaffected.

### Test checklist
- [ ] Two-button state: Back appears at left edge, Next at right edge
- [ ] Single-button state: button is right-aligned
- [ ] Buttons do not overlap or overflow on 375px viewport (iPhone SE)
- [ ] Touch targets measure ≥ 44px tall in DevTools
- [ ] Dark mode renders correctly with no layout shift

### Claude Code notes
Identify the CSS class(es) used for the Rosary nav button container by reading `src/rosary.js` and `css/app.css`. Make the minimum targeted change — do not refactor the full Rosary layout.

### Execution notes (2026-03-12)
**Root cause:** `_navHtml()` placed two buttons directly into `#readerFooter` (not a flex container). `.rosary-nav` CSS class existed but was never used as a wrapper — it was legacy from pre-universal-reader overlays.
**Fix:** Wrapped buttons in `<div style="display:flex;gap:var(--space-3)">` in `_navHtml()`. Used inline style to avoid inheriting old desktop media query overrides tied to `.rosary-nav` class. Single-button "Amen" state also wrapped — `flex:1` makes it full-width (better touch target than right-aligned).

---

## SPEC-002-B — Rosary: Hail Mary beads overflow container
**Origin:** IDEA-028 | **Status:** done | **Completed:** 2026-03-12

### Goal
Hail Mary bead elements overflow or are clipped by their container in the Rosary module. Beads should fit within the container and wrap or scroll cleanly.

### Files affected
- `css/app.css` — bead container and bead element selectors
- `src/rosary.js` — if bead container markup needs adjustment

### Before (description)
Bead elements extend beyond the bounds of their wrapping container. Likely causes: `overflow: hidden` on the container with no defined height, or beads using a fixed size that doesn't fit the available width.

### After
- All beads visible within their container — no clipping, no overflow
- Beads wrap gracefully on narrow viewports (≥320px)
- Container does not impose a height that clips the last row of beads
- Bead size uses relative units (`rem` or `%`) not hardcoded `px`

### CSS / dark mode
Bead fill colors are themed by mystery type (Joyful, Luminous, Sorrowful, Glorious). Verify all four mystery bead color classes render correctly and no bead appears white-on-white in light mode or black-on-black in dark mode.

### Test checklist
- [ ] All 10 Hail Mary beads visible simultaneously on 375px viewport
- [ ] Beads do not overflow their container on 320px viewport (minimum)
- [ ] All four mystery type colors render correctly in light mode
- [ ] All four mystery type colors render correctly in dark mode
- [ ] No bead element is clipped by `overflow: hidden`

### Claude Code notes
Read the bead rendering logic in `src/rosary.js` to understand how beads are generated (likely an array map into a container div). The fix is probably in `css/app.css` — check for `overflow: hidden`, `max-height`, or inflexible `width` on the bead container.

### Execution notes (2026-03-12)
**Root cause:** 10 beads × 28px + 9 gaps × 10px = 370px exceeded available width on 375px viewports (303px after body + section padding). No `flex-wrap`, no responsive sizing.
**Fix:** Changed `.rosary-bead` to `1.375rem` (22px) and `.rosary-beads` gap to `0.375rem` (6px). Total: 274px — fits 303px. Added `flex-wrap:wrap` as safety net for extreme edge cases.

---

## SPEC-002-C — Rosary: back press resets completed decade to zero
**Origin:** IDEA-031 | **Status:** done | **Completed:** 2026-03-12

### Goal
After completing a decade (10 Hail Marys) and advancing to the next mystery/decade, pressing Back wipes the completed decade's progress back to 0/10. Rosary state must persist across decade transitions so Back correctly shows the completed state.

### Files affected
- `src/rosary.js`

### Before (description)
The Rosary module maintains a current decade counter. When the user advances past a completed decade, the previous decade's completion state is discarded from state. Pressing Back re-renders the previous decade with bead count reset to 0.

### After
- Rosary state object tracks completion per decade (not just current), e.g.:
  ```js
  // state.decades = { 0: 10, 1: 10, 2: 3, ... }
  // when navigating Back to decade 1, render with beads = 10
  ```
- Back navigation reads from `state.decades[n]` instead of resetting to 0
- The visual bead state (filled/unfilled) correctly reflects the stored count
- Haptic feedback on Back navigation is unchanged

### Test checklist
- [ ] Complete decade 1 (10 Hail Marys) → advance to decade 2 → press Back → decade 1 shows all 10 beads filled
- [ ] Complete decade 1, partially complete decade 2 (e.g., 4/10) → press Back → decade 1 shows 10/10, not 4/10
- [ ] Pressing Back on the first decade does not throw an error
- [ ] Completing all 5 decades and pressing Back on the final decade correctly shows decade 4 as complete
- [ ] State persists through multiple Back/Forward cycles without drift

### Claude Code notes
Read `src/rosary.js` in full before touching state. The fix is purely in the state management logic — not CSS. Ensure the state object structure change does not break the progress percentage or the bead rendering loop.

### Execution notes (2026-03-12)
**Root cause:** `rosaryPrev()`, `rosaryNext()`, and `rosaryGoTo()` always set `_bead = 0` when changing decades. No per-decade bead tracking.
**Fix:** Added `_beadsByDecade = [0,0,0,0,0]` array. All navigation functions save/restore per-decade bead counts. `rosaryBeadTap()` and `rosaryBeadReset()` sync the array. Array is reset on fresh open and set selection.

---

## SPEC-002-D — Rosary: CCC inline reference has no spacing from surrounding content
**Origin:** IDEA-030 | **Status:** done | **Completed:** 2026-03-12

### Goal
When a CCC reference is tapped within the Rosary module, the reference block is inserted inline but has no visual separation (margin/padding) from adjacent content such as the "Our Father" section above or below it.

### Files affected
- `css/app.css` — inline CCC reference block selector within Rosary context
- `src/rosary.js` — if the CCC block container element needs a class for targeting

### Before (description)
CCC inline reference block is injected directly adjacent to mystery content with no margin. Blocks visually merge with the prayer text above and below.

### After
- CCC reference block has `margin-top: var(--space-md)` and `margin-bottom: var(--space-md)` (or equivalent spacing tokens from `css/app.css`)
- A subtle visual separator (e.g., left border using `--color-accent` or a top border at reduced opacity) makes the block distinct from inline prayer text
- Spacing is consistent with CCC inline references rendered elsewhere in the app (check `src/ccc.js` for the established pattern)

### CSS / dark mode
- In dark mode, the separator border color should use `--color-accent` (which is season-aware) or a muted `--color-border` token
- Do not use hardcoded colors

### Test checklist
- [ ] CCC block has visible top and bottom spacing from adjacent content
- [ ] Visual separator (border or margin) clearly distinguishes the block from inline prayer text
- [ ] Spacing matches the CCC reference block treatment elsewhere in the app
- [ ] Dark mode renders correctly — no white-on-white or black-on-black borders
- [ ] Layout is not disrupted on 375px viewport

### Claude Code notes
Look at how CCC inline references are rendered in `src/ccc.js` and use the same class or add to the same selector block. If the Rosary uses a different wrapper element for its inline CCC block, add the spacing class to that wrapper.

### Execution notes (2026-03-12)
**Root cause:** `.exam-ccc-card` (shared by rosary and examination) had `margin-top:var(--space-3)` but no `margin-bottom`.
**Fix:** Added `margin-bottom:var(--space-3)` to the base `.exam-ccc-card` rule. Benefits both rosary and examination modules.

---

## SPEC-002-E — Stations of the Cross: navigation buttons left-aligned
**Origin:** IDEA-038 | **Status:** done | **Completed:** 2026-03-12

### Goal
Navigation buttons in the Stations of the Cross module are left-aligned. Fix to match the Rosary button layout established in SPEC-002-A (Back left, Next right; single button right-aligned).

### Files affected
- `css/app.css` — Stations nav button container selector
- `src/stations.js` — if markup needs adjustment

### Before (description)
Same left-clustering issue as Rosary (SPEC-002-A). Both modules likely share the same class or the same root cause.

### After
- Identical layout behavior to Rosary after SPEC-002-A is applied
- If both modules share a nav button container class, a single CSS fix covers both
- If they use different classes, apply the same `justify-content: space-between` / `justify-content: flex-end` pattern

### CSS / dark mode
Same as SPEC-002-A — layout only, colors unaffected.

### Test checklist
- [ ] Two-button state: Back left, Next right
- [ ] Single-button state: button right-aligned
- [ ] Consistent with Rosary button layout after SPEC-002-A
- [ ] 44px minimum touch target height maintained
- [ ] Dark mode unaffected

### Claude Code notes
Do SPEC-002-A first. If the Rosary and Stations already share a nav container class in `css/app.css`, SPEC-002-A may fully resolve this item. Confirm and mark SPEC-002-E done if so, rather than applying a redundant fix.

### Execution notes (2026-03-12)
**Root cause:** Same pattern as SPEC-002-A — stations `_navHtml()` placed buttons directly into footer without flex wrapper. Different classes (`.stations-nav-btn`) but identical root cause.
**Fix:** Same approach as SPEC-002-A — wrapped in `<div style="display:flex;gap:var(--space-3)">`. Applied to `_navHtml()`, intro "Begin" button, and completion "Amen" button.

---

## SPEC-002-F — Shared back-navigation: Rosary + Stations → Bible/CCC loses user's place
**Origin:** IDEA-029, IDEA-040 | **Status:** done | **Completed:** 2026-03-12

### Goal
Tapping a Bible reference in the Rosary or Stations opens the correct passage but provides no way to return to the specific mystery, bead, or station the user was on. The back button currently returns to the module landing page (losing in-progress state), and the X button closes the module entirely. This is a regression from the universal card refactor.

**Note:** The Examination module has the same class of problem — see SPEC-003-E. Consider a unified back-navigation approach, but the Examination fix is in SPEC-003.

### Files affected
- `src/rosary.js`
- `src/stations.js`
- `src/bible.js`
- `src/ccc.js`

### Before (description)
When a Bible/CCC overlay is opened from within Rosary or Stations:
- The overlay is rendered without any record of where the user came from
- The back/close button in the overlay calls a generic close/dismiss function
- The calling module renders its landing page on return rather than the specific state (mystery N, decade N, station N) from which the user departed

### After
**Pattern to implement:**

1. When Rosary or Stations opens a Bible/CCC overlay, pass a `returnContext` object to the overlay open function:
   ```js
   // example — rosary context
   var returnContext = {
     module: 'rosary',
     mysteryIndex: state.currentMystery,
     decadeIndex: state.currentDecade,
     beadCount: state.beadCount
   };
   openBibleOverlay(verseRef, returnContext);
   ```
   ```js
   // example — stations context
   var returnContext = {
     module: 'stations',
     stationIndex: state.currentStation
   };
   openBibleOverlay(verseRef, returnContext);
   ```

2. `bible.js` and `ccc.js` overlay close handlers check for `returnContext`. If present:
   - Render a "← Back to [Rosary / Station N]" label on the close/back button instead of a generic X
   - On close, call the originating module's render function with the saved context to restore the exact state

3. If no `returnContext` is present (user opened Bible/CCC directly), existing close behavior is unchanged.

### CSS / dark mode
- The "← Back to Rosary" / "← Back to Station N" back button label should use `--font-body`, `--color-text-secondary`
- An SVG chevron-left icon (already in use elsewhere in the app) precedes the label
- Dark mode: colors must use tokens, not hardcoded values

### Test checklist
- [ ] Tapping a Bible ref in the Rosary mid-decade → reading opens → tapping Back returns to the exact mystery and bead count, not the Rosary landing
- [ ] Tapping a Bible ref in Stations → reading opens → Back returns to the exact station number, not the Stations landing
- [ ] Back button label reads "← Back to Rosary" or "← Back to Station N" (not generic X or Back)
- [ ] Opening Bible/CCC directly (not from prayer module) — close behavior is unchanged
- [ ] CCC "See Also" references tapped from within the Bible overlay do not lose the Rosary/Stations return context

### Claude Code notes
Read all four files (`rosary.js`, `stations.js`, `bible.js`, `ccc.js`) before writing any code. The key architectural decision is where `returnContext` lives — the simplest approach is passing it as a parameter to the overlay open function and storing it in a module-scoped variable in `bible.js`/`ccc.js` that is cleared on direct-open invocations. Do not use `localStorage` or global state on `window` — keep it in module scope.

### Execution notes (2026-03-12)
**Approach chosen:** Simpler than spec's `returnContext` proposal. Used the universal reader's existing navigation stack instead of per-module return contexts.
**Root cause:** Module `render()` functions always reset state (`_screen`, `_decade`, `_bead`, `_station`) even when called via `readerBack()` (returning from Bible/CCC). Module-scoped variables already held the correct state but were overwritten.
**Fix (3 files):**
1. `reader.js`: Added `_updateBackBtn()` helper that shows contextual "← {module title}" back label. In `readerBack()`, sets `prev.params._restore = true` before calling `mod.render()`.
2. `rosary.js`: Render function checks `params._restore && _set` — if true, skips reset and re-renders current state (preserving decade, bead count, screen).
3. `stations.js`: Same pattern — checks `params._restore` to skip reset and preserve current station.
**No changes to bible.js or ccc.js** — the fix is entirely in the reader stack protocol and calling modules. Bible/CCC don't need to know about return context; the reader stack already handles the navigation.
