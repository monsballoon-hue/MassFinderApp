# SPEC-004 — Novena UX & Bug Fixes
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~1.5–2 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-004-A | IDEA-041 | Active novena card: elements and text too small for older users | open |
| SPEC-004-B | IDEA-042 | No intuitive way to advance to the current day's prayer | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/novena.js` and `css/app.css` (tokens at lines 38–80) before beginning. The Novena Tracker allows users to pray novenas over 9 days with progress tracking and streak integration.

**Design principles:**
- Three user demographics: Older parishioners (50+) are the priority concern for both of these items
- Touch targets ≥ 44×44pt (Apple HIG) — non-negotiable for this spec
- `--font-prayer` (Georgia) for prayer text, `--font-body` for UI
- Dark mode parity
- SVG only — no emoji
- Haptic feedback on interactive touches
- CommonJS — no arrow functions

**Ordering:** SPEC-004-A first (visual/sizing), SPEC-004-B second (behavior). -B may reference markup introduced or modified in -A.

---

## SPEC-004-A — Active novena card: elements too small for older users
**Origin:** IDEA-041 | **Status:** open

### Goal
The active novena section uses small dot indicators, small chevrons, and small text. All interactive elements must meet 44×44pt touch targets and text must be comfortably readable for older parishioners (50+). This is a redesign of the active novena card's sizing and visual weight — not a full re-architecture.

### Files affected
- `src/novena.js`
- `css/app.css`

### Before (description)
- Day dot indicators: ~12–16px diameter, tightly spaced, not individually tappable in a meaningful way
- Chevron navigation icons: too small to tap reliably
- Prayer text: likely `0.875rem` or smaller
- Overall card feels "data-dense" in a way that serves younger users but fails older ones

### After
**Day indicator dots:**
- Minimum 20px diameter per dot (up from ~12px)
- Spacing between dots: `var(--space-sm)` minimum
- Active day dot: filled with `--color-accent`, 24px diameter
- Completed day dot: filled with `--color-text-secondary` at 60% opacity
- Future day dot: outlined only, `--color-border`
- Entire dot row wrapped in a container that does not truncate on narrow viewports — dots should wrap to two rows before clipping

**Chevron / navigation:**
- Chevron tap target: min 44×44pt, achieved by padding the icon's wrapper element
- SVG chevron size: 20×20px intrinsic, centered in 44×44 tap target
- Left/Right chevrons for day navigation (if present) must both meet this target

**Prayer day heading:**
- Day label (e.g., "Day 3 of 9"): `font-size: 1.1rem`, `--font-body`, `font-weight: 600`
- Novena title: `font-size: 1.25rem`, `--font-display`

**Prayer text:**
- Body prayer text: `font-size: 1.05rem`, `--font-prayer` (Georgia), `line-height: 1.7`
- Minimum: 16px rendered size at default system font scale

**Card container:**
- Padding: `var(--space-md)` minimum on all sides
- Card background: `--color-surface` with `--border-radius-md` rounding
- Subtle box shadow: `var(--shadow-sm)` or equivalent token

### CSS / dark mode
All new/changed values must use tokens. Dark mode example:
```css
/* dot styles */
.novena-day-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: transparent;
  flex-shrink: 0;
}
.novena-day-dot--active {
  width: 24px;
  height: 24px;
  background: var(--color-accent);
  border-color: var(--color-accent);
}
.novena-day-dot--complete {
  background: var(--color-text-secondary);
  opacity: 0.6;
  border-color: transparent;
}
```

### Test checklist
- [ ] All interactive elements (dots, chevrons, buttons) have ≥ 44px tap target measured in DevTools
- [ ] Prayer text renders at ≥ 16px at default system font scale
- [ ] Day dots do not overflow or clip on 375px viewport
- [ ] Active dot visually distinct from completed and future dots
- [ ] Dark mode: all dot states visible, text readable, card has visible surface distinction from page background
- [ ] Older user scenario: test by increasing iOS/Android text size to "Large" — layout should not break

### Claude Code notes
Read `src/novena.js` to understand the full DOM structure before writing CSS. If dot indicators are rendered via JS (likely an array map), the markup may need class additions to support the three states (active, complete, future). Ensure the dot-row container uses `display: flex; flex-wrap: wrap` so dots wrap instead of overflow on narrow viewports.

---

## SPEC-004-B — No intuitive way to advance to the current day's prayer
**Origin:** IDEA-042 | **Status:** open

### Goal
When returning to an active novena, the module loads the last-viewed day rather than automatically advancing to today's prayer. The only way to advance is tapping dot indicators — which is undiscoverable, especially for older users. Add an explicit "Continue — Day N" button that brings the user to the correct current day.

### Files affected
- `src/novena.js`

### Before (description)
The novena module tracks the last-viewed day index. On return, it renders that day's prayer with no indication of whether today is a different day or a call-to-action to advance.

### After
**Automatic day calculation:**
- When an active novena is opened, calculate the current day:
  ```js
  var startDate = new Date(novena.startDate);   // stored at novena start
  var today = new Date();
  var daysSinceStart = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  var currentDay = Math.min(daysSinceStart + 1, 9); // 1-indexed, cap at 9
  ```

**"Continue" CTA:**
- If `currentDay > lastViewedDay`, render a prominent "Continue — Day [N]" button at the top of the novena card (above the day content area):
  ```html
  <button class="novena-continue-btn">
    <!-- SVG play/arrow icon -->
    Continue — Day 3
  </button>
  ```
- Button uses `--color-accent` background, white text, 44pt height, full width of the card
- Tapping it: navigates to `currentDay`, fires `haptics.medium()`, updates `lastViewedDay`

**If currentDay === lastViewedDay:**
- No "Continue" button rendered — user is already on today's day
- Existing day content renders normally

**If novena is complete (all 9 days prayed, currentDay > 9):**
- No "Continue" button
- A "Novena complete" state renders (this may already exist — check `src/novena.js`)

**Edge case — streak:**
- If `daysSinceStart >= 9` but the user has not completed all 9 days, navigate to their last incomplete day, not day 9. The "Continue" button label should reflect the next unprayed day rather than the calendar day.

### CSS / dark mode
```css
.novena-continue-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  width: 100%;
  min-height: 44px;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-accent);
  color: #fff;
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  margin-bottom: var(--space-md);
}
/* Dark mode accent is already handled by --color-accent token — no override needed */
```

### Test checklist
- [ ] User opens novena on Day 1, leaves, reopens the next day: "Continue — Day 2" button appears prominently
- [ ] Tapping "Continue — Day 2" navigates to Day 2's prayer content and fires haptic
- [ ] User already on today's day: no "Continue" button rendered
- [ ] Novena complete (all 9 days): no "Continue" button, completion state shown
- [ ] User has skipped a day: "Continue" goes to next unprayed day, not calendar day
- [ ] Button is full-width, 44px minimum height, visible in both light and dark mode

### Claude Code notes
Read the novena state storage carefully — `startDate`, `lastViewedDay`, and the per-day completion flags. The date calculation is straightforward but the edge case (user skipped a day) requires iterating over per-day completion flags to find the first unprayed day rather than relying solely on the date delta.
