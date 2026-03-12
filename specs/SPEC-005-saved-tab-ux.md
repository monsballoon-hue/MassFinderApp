# SPEC-005 — Saved Tab: UX Bugs & Refinements
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet (fresh clone required)
**Estimated total effort:** ~2.5–3 hours

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-005-A | IDEA-023 | "Prayer Life," "Your Churches," event listing text too small | open |
| SPEC-005-B | IDEA-048 | "Your Churches" edit and X buttons too small | open |
| SPEC-005-C | IDEA-054 | "Directions" link should open Apple Maps on iOS | open |
| SPEC-005-D | IDEA-047 | Suppress season label during Ordinary Time | open |
| SPEC-005-E | IDEA-044 | Clarify / document the dot on Saved tab greeting | open |
| SPEC-005-F | IDEA-050 | Clarify / document the dot on the heart icon in tab bar | open |
| SPEC-005-G | IDEA-045 | Today's events visually distinguished from future events | open |

---

## Context for Claude Code
**Fresh clone required.** Read `src/saved.js`, `src/ui.js`, `src/readings.js`, and `css/app.css` (tokens at lines 38–80) before beginning. The Saved tab is the personal dashboard: contextual greeting, liturgical season label, today's service timeline, "Your Churches," "Prayer Life" section, and activity tracker.

**Design principles:**
- Older parishioners (50+) are the primary concern for SPEC-005-A and SPEC-005-B
- Touch targets ≥ 44×44pt for all interactive elements
- Dark mode parity for every CSS change
- SVG only — no emoji
- CommonJS — no arrow functions
- `config.js` is canonical for enums (check for existing season/liturgical constants before adding new ones)

**Ordering:** -A and -B first (sizing, independent). -C next (behavior, independent). -D (season label logic, may share code with More tab changes in SPEC-006). -E and -F (investigation/documentation items — read the code and document findings, minimal code change expected). -G last (most complex, depends on understanding of current event rendering after -A).

---

## SPEC-005-A — "Prayer Life," "Your Churches," event listing text too small
**Origin:** IDEA-023, IDEA-022 | **Status:** open

### Goal
Section labels ("Prayer Life," "Your Churches") and event listing text in the Saved tab are too small for comfortable reading, particularly for older parishioners (50+). Increase to legible sizes across all three elements.

### Files affected
- `css/app.css` — Saved tab section label and event listing text selectors
- `src/saved.js` — if markup classes need to be confirmed or added

### Before (description)
- Section labels ("Prayer Life," "Your Churches"): likely `0.75rem` or `0.875rem`, styled as overline-style caps labels
- Event listing text (service name, time, parish name): likely `0.875rem`
- Both are below comfortable reading threshold for 50+ users at default system font scale

### After
**Section labels ("Prayer Life," "Your Churches"):**
```css
.saved-section-label {
  font-family: var(--font-body);
  font-size: 0.875rem;          /* up from ~0.75rem */
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-secondary);
  margin-bottom: var(--space-sm);
}
```

**Event listing — service name:**
```css
.saved-event-service-name {
  font-family: var(--font-body);
  font-size: 1rem;              /* minimum — up from ~0.875rem */
  font-weight: 600;
  color: var(--color-text-primary);
}
```

**Event listing — time and parish:**
```css
.saved-event-meta {
  font-family: var(--font-body);
  font-size: 0.9375rem;         /* 15px — up from ~14px */
  color: var(--color-text-secondary);
}
```

### CSS / dark mode
All values use tokens — no dark-mode override needed for these text styles beyond what tokens provide.

### Test checklist
- [ ] Section labels render ≥ 14px at default system font scale
- [ ] Service name renders ≥ 16px at default system font scale
- [ ] Event time/parish meta renders ≥ 15px at default system font scale
- [ ] Increased sizes do not cause layout overflow in the event listing cards
- [ ] Dark mode: all text colors resolve correctly via tokens
- [ ] Snapshot test on 375px viewport — no text clipping or overflow

### Claude Code notes
Read `src/saved.js` to find exact class names before editing CSS. If section labels and event text use utility classes shared with other tabs, be cautious about unintended changes elsewhere. Create targeted selectors scoped to `.saved-tab` or equivalent parent if needed.

---

## SPEC-005-B — "Your Churches" edit and X buttons too small
**Origin:** IDEA-048 | **Status:** open

### Goal
The "Edit" button next to "Your Churches" and the X buttons for removing parishes are too small for reliable tapping by older users. Expand tap targets to ≥ 44×44pt.

### Files affected
- `css/app.css`
- `src/saved.js` — confirm markup for Edit and X elements

### Before (description)
- "Edit" button: small text-link style, no padding, tap target < 44px
- Parish X remove buttons: icon-only, likely 20–24px, no padding wrapper

### After
**"Edit" button:**
```css
.saved-churches-edit-btn {
  min-height: 44px;
  min-width: 44px;
  padding: var(--space-xs) var(--space-sm);
  display: inline-flex;
  align-items: center;
  font-family: var(--font-body);
  font-size: 0.9375rem;
  color: var(--color-accent);
  background: transparent;
  border: none;
  cursor: pointer;
}
```

**Parish X remove buttons:**
```css
.saved-parish-remove-btn {
  min-height: 44px;
  min-width: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  /* SVG icon inside is 20×20, tap target is 44×44 via padding */
}
```

### CSS / dark mode
- Edit button color: `--color-accent` (season-aware, resolves in dark mode)
- X icon color: `--color-text-secondary` in resting state, `--color-error` or `--color-text-primary` on hover/active

### Test checklist
- [ ] "Edit" button: tap target ≥ 44px tall and 44px wide measured in DevTools
- [ ] Parish X button: tap target ≥ 44×44px
- [ ] Edit button visually looks like an action link, not enlarged in a jarring way
- [ ] X button SVG centered within the tap target
- [ ] Dark mode: both buttons visually correct

### Claude Code notes
The goal is expanded tap targets via padding, not visually enlarged buttons. The icons and text can remain at their current visual size — the padding and `min-height`/`min-width` make the invisible tap zone larger.

---

## SPEC-005-C — "Directions" link should open Apple Maps on iOS
**Origin:** IDEA-054 | **Status:** open

### Goal
The "Directions" link in the today service banner of the Saved tab currently routes all users to Google Maps. On iPhone it should open Apple Maps, matching the behavior already implemented in the church detail card.

### Files affected
- `src/saved.js`

### Before
```js
// current — always Google Maps
var directionsUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(address);
window.open(directionsUrl, '_blank');
```

### After
```js
// platform-detect and route accordingly
function getDirectionsUrl(address) {
  var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  var encodedAddress = encodeURIComponent(address);
  if (isIOS) {
    return 'maps://?daddr=' + encodedAddress;
  }
  return 'https://www.google.com/maps/dir/?api=1&destination=' + encodedAddress;
}
```

**Note:** Verify this is the exact same logic used in the church detail card (likely in `src/render.js`). If it is, extract into a shared utility in `src/utils.js` (or wherever the app's utility functions live) and call from both locations. Do not duplicate the logic.

### Test checklist
- [ ] On iPhone/iPad: "Directions" tap opens Apple Maps app (not browser Google Maps)
- [ ] On Android: "Directions" tap opens Google Maps
- [ ] On desktop browser: "Directions" tap opens Google Maps in a new tab
- [ ] Logic is shared with church detail card — not duplicated
- [ ] Address is correctly URL-encoded (test with multi-word addresses and addresses with special characters)

### Claude Code notes
Find where the church detail card already does this (likely `src/render.js`). Extract the detection logic to a utility if it isn't already in one, then call the utility from both `saved.js` and `render.js`. CommonJS module pattern — use `module.exports` / `require()`.

---

## SPEC-005-D — Suppress season label during Ordinary Time
**Origin:** IDEA-047, IDEA-046 | **Status:** open

### Goal
The Saved tab greeting and the More tab liturgical day card both display the current liturgical season. During Ordinary Time (~33 weeks per year), the label reads "Ordinary Time" — which conveys no meaningful context. Suppress the season label entirely during Ordinary Time; show it only for named seasons: Advent, Christmas, Lent, Easter.

**Note:** The More tab sub-label (IDEA-026) is the same issue on a different screen — see SPEC-006-A. Implement the suppression logic as a shared utility so both specs use the same function.

### Files affected
- `src/saved.js` — greeting season label render
- `src/more.js` — liturgical day card season sub-label (coordinate with SPEC-006-A)
- `src/readings.js` (or wherever liturgical season is sourced) — add/confirm a helper function

### Before (description)
Season label renders unconditionally for all liturgical seasons, including Ordinary Time.

### After
**Shared helper (add to `src/readings.js` or `src/utils.js`):**
```js
/**
 * Returns the season label for display, or null if the season
 * should be suppressed (Ordinary Time).
 * @param {string} season - season string from litcal data
 * @returns {string|null}
 */
function getDisplaySeasonLabel(season) {
  var SUPPRESS_SEASONS = ['ordinary_time', 'ORDINARY_TIME', 'OrdinaryTime'];
  // normalize and check
  if (!season) return null;
  var normalized = season.toLowerCase().replace(/[^a-z]/g, '');
  if (normalized === 'ordinarytime') return null;
  return season; // return the original for display
}
```
(Adjust `SUPPRESS_SEASONS` to match the actual season value strings from `config.js` — read the file first.)

**In `saved.js`:**
```js
var seasonLabel = getDisplaySeasonLabel(currentSeason);
if (seasonLabel) {
  // render the label element
} else {
  // do not render — or set element to display:none
}
```

**In `more.js`:** Same pattern (see SPEC-006-A).

### CSS / dark mode
No new CSS required. The label's existing styles are unchanged — it's a render/hide decision.

### Test checklist
- [ ] During Ordinary Time: season label absent from both Saved tab greeting and More tab liturgical card
- [ ] During Lent: "Lent" label visible in both locations
- [ ] During Advent: "Advent" label visible in both locations
- [ ] During Christmas: "Christmas" label visible
- [ ] During Easter: "Easter" label visible
- [ ] Suppression logic is in a shared function called from both modules — not duplicated

### Claude Code notes
Read `config.js` first to find the canonical season enum values. The suppression check must use those exact values. Do not hardcode string literals — use the config constants.

---

## SPEC-005-E — Clarify the dot on the Saved tab greeting
**Origin:** IDEA-044 | **Status:** open

### Goal
A dot appears next to the contextual greeting on the Saved tab. The purpose is unclear from external inspection. Read the code, document what it represents, and fix it if it is broken or add a code comment so future developers understand it.

### Files affected
- `src/saved.js` (primary — read this)
- `css/app.css` (if the dot element needs a style fix)

### Steps
1. Read `src/saved.js` and find the greeting dot element
2. Determine: what condition renders it? what does it represent? is there an existing comment?
3. **Outcome A — Dot is functioning correctly and intentional:** Add a clear JSDoc comment explaining the dot's purpose, trigger condition, and clear condition. No functional change.
4. **Outcome B — Dot is broken (renders unconditionally, wrong condition, or no logic):** Fix the condition logic, add the comment.
5. **Outcome C — Dot is vestigial with no current purpose:** Remove it.
6. Update IDEAS.md IDEA-044 with findings (the answer to "what does this dot do").

### Test checklist
- [ ] A clear code comment explains what the dot represents
- [ ] If functional: dot appears exactly when expected and not otherwise
- [ ] If vestigial: dot element and its CSS removed cleanly
- [ ] No visual regression in the greeting area in light or dark mode

### Claude Code notes
This is an investigation item, not a predetermined fix. Read first, then act based on findings. Write the outcome in a comment at the top of the relevant function.

---

## SPEC-005-F — Clarify the dot on the heart icon in the tab bar
**Origin:** IDEA-050 | **Status:** open

### Goal
A dot appears on the heart/Saved icon in the bottom navigation bar. The meaning is unclear. Read the code, document what it represents, and fix if broken.

### Files affected
- `src/saved.js`
- `src/ui.js` (likely — tab bar badge logic)

### Steps
1. Read `src/ui.js` and `src/saved.js` to find where the tab bar dot/badge is set
2. Determine: trigger condition, what state it represents, clear condition
3. **Outcome A — Functioning and intentional:** Add clear comment, confirm clear behavior works correctly.
4. **Outcome B — Broken logic:** Fix and comment.
5. **Outcome C — Vestigial:** Remove.
6. Update IDEAS.md IDEA-050 with findings.

### Test checklist
- [ ] Clear code comment explains dot's trigger and clear conditions
- [ ] If functional: dot appears and clears per the documented logic
- [ ] If vestigial: dot and related CSS removed
- [ ] No visual regression on tab bar in light or dark mode

### Claude Code notes
This investigation complements SPEC-005-E. Both dots may share a root cause or the same badge system. If so, document both in the same comment block and fix together.

---

## SPEC-005-G — Today's events visually distinguished from future events
**Origin:** IDEA-045 | **Status:** open

### Goal
In the Saved tab's service timeline, events happening today should be visually differentiated from upcoming events. When multiple services fall today, they should be prioritized: chronologically by time, with Mass (or the service type configured as highest priority) elevated.

### Files affected
- `src/saved.js`
- `css/app.css`

### Before (description)
Today's and future events appear with identical visual treatment — same card style, same row style. A user cannot quickly distinguish "happening today" from "happening Thursday."

### After
**Today's events:**
```css
.saved-event-card--today {
  border-left: 3px solid var(--color-accent);
  background: var(--color-surface-alt);   /* slightly elevated surface */
}

.saved-event-today-badge {
  display: inline-block;
  font-family: var(--font-body);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-accent);
  margin-bottom: var(--space-xs);
}
```

**Prioritization logic (JS):**
```js
function sortTodayEvents(events) {
  // Service type priority: Mass > Confession > Adoration > other
  var SERVICE_PRIORITY = { 'Mass': 0, 'Confession': 1, 'Adoration': 2 };
  return events.sort(function(a, b) {
    var priorityDiff = (SERVICE_PRIORITY[a.type] || 99) - (SERVICE_PRIORITY[b.type] || 99);
    if (priorityDiff !== 0) return priorityDiff;
    // Secondary sort: chronologically by time
    return a.time.localeCompare(b.time);
  });
}
```
(Use `config.js` service type enum values — do not hardcode strings.)

**Rendering:**
- Today's events rendered first in the list with `--today` class applied
- A "TODAY" badge (`saved-event-today-badge`) above the first today-event group
- Future events follow below with no badge but with a date label (e.g., "Friday, March 14")
- If there are no today events, render future events normally with no "TODAY" badge

### CSS / dark mode
- `--color-surface-alt` and `--color-accent` resolve correctly in dark mode via tokens
- Accent border color is season-aware (purple in Lent, gold in Ordinary Time, etc.)

### Test checklist
- [ ] Events for today have the accent left-border and elevated surface
- [ ] "TODAY" badge visible above the today-event group
- [ ] Multiple today-events: Mass appears first, then Confession, then others, then by time
- [ ] Future events appear below today-events with a date label
- [ ] No today events: future events render without any "TODAY" badge or section
- [ ] Dark mode: left-border accent, surface elevation, and badge all render correctly
