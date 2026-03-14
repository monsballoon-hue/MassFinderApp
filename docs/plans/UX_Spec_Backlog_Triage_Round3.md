# UX Spec: Backlog Triage Round 3

**Created:** 2026-03-14 · **Status:** Queued
**Backlog items:** IDEA-023, IDEA-024, IDEA-025, IDEA-026, IDEA-027, IDEA-028, IDEA-029, IDEA-030, IDEA-031, IDEA-033, IDEA-034, IDEA-035, IDEA-036, IDEA-037, IDEA-038, IDEA-039, IDEA-040, IDEA-041, IDEA-042, IDEA-043, IDEA-044, IDEA-045, IDEA-046, IDEA-048, IDEA-049, IDEA-050, IDEA-051, IDEA-052
**Claude Code prompt:** CLAUDE_CODE_PROMPT_BT3.md

---

## Triage Summary

28 UX-relevant open items across 4 areas. Organized into 4 groups by priority:

| Group | Items | Priority | Effort |
|-------|-------|----------|--------|
| A: Examination of Conscience Overhaul | BT3-01 → BT3-10 | P1 | ~3 hrs |
| B: More Tab & Faith Guides Polish | BT3-11 → BT3-16 | P2 | ~1.5 hrs |
| C: Find & Saved Tab Accessibility | BT3-17 → BT3-21 | P2 | ~1.5 hrs |
| D: Global Fixes & Cross-Cutting | BT3-22 → BT3-28 | P2–P3 | ~2.5 hrs |

---

## Group A: Examination of Conscience Overhaul

> The Examination of Conscience is the most interaction-dense prayer module. These 10 items address readability, navigation clarity, and emotional tone for the 72-year-old parishioner preparing for confession.

---

### BT3-01 — Examination Subheader: "Confession" Not "Reconciliation"
**Backlog:** IDEA-033 · **Priority:** P1 · **Category:** refinement
**Files:** `src/more.js` line ~200

**Problem:** The Prayer Tools card subtitle reads "Prepare for Reconciliation" — the target audience (traditional Catholic parishioners in Western New England) overwhelmingly says "confession." The 72-year-old will connect instantly with "confession"; "reconciliation" adds a cognitive speed bump.

**Fix:**
```
// src/more.js line ~200
BEFORE: subtitle: confLabel || 'Prepare for Reconciliation'
AFTER:  subtitle: confLabel || 'Prepare for confession'
```

**Dark mode:** No impact.
**Test:** Open More tab → verify "Prepare for confession" subtitle on Examination card.

---

### BT3-02 — Examination Header Not Visually Centered
**Backlog:** IDEA-036 · **Priority:** P1 · **Category:** bug
**Files:** `css/app.css` (reader header area, lines ~1772–1778)

**Problem:** The "Examination of Conscience" title in the reader header appears off-center because when the back button is hidden (`display:none`), it collapses from the flex layout. The close button on the right still occupies space, shifting the `flex:1` title leftward.

**User story:** All demographics — the off-center title looks broken. The 25-year-old notices instantly.

**Fix:** Add a spacer element approach by giving the back button a fixed width even when hidden, or use `visibility:hidden` instead of `display:none` when at the root level (no stack).

```css
/* css/app.css — around line 1774 */
BEFORE: (back button uses display:none when no stack)
AFTER:
.reader-back-btn { min-width: 30px; } /* Match close button width for symmetry */
.reader-back-btn[style*="display: none"] { visibility: hidden; display: flex !important; }
```

**Better approach — fix in JS:** In `reader.js` `_updateBackBtn()`, use `visibility` instead of `display`:
```
// src/reader.js — _updateBackBtn function
BEFORE: btn.style.display = _stack.length ? '' : 'none';
AFTER:  btn.style.visibility = _stack.length ? 'visible' : 'hidden';
```

Remove inline `style.display` setting. Keep the element in flow.

**Dark mode:** No impact.
**Test:** Open Examination → verify title is horizontally centered with close button on right and invisible spacer on left. Navigate into a section → verify back button appears → go back → verify title re-centers.

---

### BT3-03 — How-to-Confess Tooltip: Nearly Illegible & Inaccurate
**Backlog:** IDEA-034, IDEA-037, IDEA-038 · **Priority:** P1 · **Category:** bug + refinement
**Files:** `src/examination.js` (examShowHowTo function ~line 355), `css/app.css` (~line 2508–2510), `data/examination.json`

**Problem (3 combined):**
1. The ℹ️ button in the exam header opens a bottom-sheet modal with tiny text — the 72-year-old cannot read it
2. Step 1 says "the questions above" which is inaccurate (questions are section-by-section, not above)
3. The modal is 70vh max-height and requires scrolling for the last bit of content — nearly all visible, so make it full-screen

**User story:** The 72-year-old taps the info icon seeking guidance on confession. Text is too small. Instructions reference "questions above" but there are no questions above — they're paginated. The 45-year-old one-handing the phone can't scroll the tiny remaining content.

**Fix A — Make modal full-screen with larger text:**
```css
/* css/app.css — around line 2510 */
BEFORE:
.exam-howto-modal-inner { background:var(--color-bg);border-radius:var(--radius-lg) var(--radius-lg) 0 0;padding:var(--space-5) var(--space-4);max-height:70vh;overflow-y:auto;width:100%; }

AFTER:
.exam-howto-modal-inner {
  background: var(--color-bg);
  border-radius: 0;
  padding: var(--space-5) var(--space-4);
  padding-top: max(var(--space-5), env(safe-area-inset-top));
  padding-bottom: max(var(--space-5), env(safe-area-inset-bottom));
  height: 100%;
  overflow-y: auto;
  width: 100%;
}
```

**Fix B — Increase modal title font size:**
In `src/examination.js`, the `examShowHowTo` function has inline styles for the title. Change:
```
BEFORE: font-size:var(--text-sm)
AFTER:  font-size:var(--text-lg)
```

**Fix C — Increase step font size in CSS:**
```css
/* css/app.css — around line 2392 */
BEFORE:
.exam-howto-steps li { font-size:var(--text-base); ... }

AFTER:
.exam-howto-steps li { font-size:var(--text-lg); line-height:1.7; ... }
```

**Fix D — Fix step 1 text in examination.json:**
```json
BEFORE: "Examine your conscience using the questions above."
AFTER:  "Examine your conscience using the questions in each section of this module."
```

**Dark mode:** Already handled at line 2518.
**Test:**
- Open Examination → tap ℹ️ → verify full-screen modal with no scrolling required
- Verify step 1 text reads "...in each section of this module"
- Verify text size is comfortable for bifocal readers (≥18px rendered)
- Verify dark mode styling

---

### BT3-04 — Examination: Unclear That Selections Are Being Logged
**Backlog:** IDEA-035 · **Priority:** P1 · **Category:** enhancement
**Files:** `src/examination.js` (footer nav area, `_updateFooterNav` ~line 354), `css/app.css`

**Problem:** The footer shows "X items noted" in small text, but a first-time user has no indication that tapping checkboxes is building a confession summary. The 72-year-old completes the entire exam without realizing their selections were tracked. The tooltip explains this, but as established in BT3-03, the tooltip is barely readable.

**User story:** All three demographics benefit from immediate, visible feedback. First checkbox tap should produce an unmistakable signal.

**Fix — Enhance the footer counter with first-tap onboarding toast:**

In `_wireCheckboxes` or the change handler, after the first item is checked (count goes from 0 → 1), show a brief toast:

```javascript
// src/examination.js — inside checkbox change handler, after _updateCheckedUI()
var count = Object.keys(_checked).length;
if (count === 1 && !_shownLogHint) {
  _shownLogHint = true;
  var render = require('./render.js');
  render.showToast('Noted for your confession summary');
}
```

Add `var _shownLogHint = false;` to module state. Reset in `onClose`.

Additionally, restyle the footer count to be more prominent when items exist:

```css
/* css/app.css — around line 2505-2506 */
/* Enhance the footer count when items are noted */
.exam-nav-count--link {
  font-size: var(--text-sm);       /* was --text-xs */
  font-weight: var(--weight-semibold);  /* was --weight-medium */
  color: var(--color-verified);    /* green, not primary blue */
  background: var(--color-verified-bg);
  border-radius: var(--radius-full);
  padding: var(--space-1) var(--space-3);
}
```

**Dark mode:** `--color-verified` and `--color-verified-bg` already have dark overrides.
**Test:**
- Open Examination → check first item → verify toast "Noted for your confession summary"
- Check 3 items → verify footer reads "3 items noted" in green with background pill
- Uncheck all → verify "No items noted" in muted style
- Close and reopen → verify toast fires again on first check

---

### BT3-05 — Examination: Remove "Prayers" Group Label
**Backlog:** IDEA-039 · **Priority:** P2 · **Category:** refinement
**Files:** `src/examination.js` (~line 272 in `_renderSummaryScreen`, ~line 238 in `_renderExamination`)

**Problem:** The summary/final screen has a `<div class="exam-group-label">Prayers</div>` above the Act of Contrition. This label is unnecessary — the prayers are self-evident, and the label adds clutter in a contemplative moment.

**Fix:** Remove the "Prayers" group label from both `_renderSummaryScreen` and `_renderExamination`:
```javascript
// Both functions — remove this line:
html += '<div class="exam-group-label">Prayers</div>';
```

**Test:** Open Examination → navigate to summary → verify Act of Contrition appears directly without "Prayers" header above it.

---

### BT3-06 — Examination: Style Thanksgiving Prayer to Match Act of Contrition
**Backlog:** IDEA-040 · **Priority:** P2 · **Category:** refinement
**Files:** `src/examination.js` (both `_renderSummaryScreen` and `_renderExamination`), `css/app.css`

**Problem:** On the final page, the Act of Contrition is centered with display font and elegant styling (`.exam-contrition`), but the Thanksgiving prayer below it uses the generic `.exam-prayer` style with a white card container, left-aligned text, and a header with an icon. They should look unified — two prayers in the same contemplative space.

**User story:** The 25-year-old sees the visual inconsistency as unpolished. The 72-year-old finds the Thanksgiving prayer feels like an afterthought.

**Fix A — Render Thanksgiving in contrition style with divider:**

Replace `_renderPrayer(d.prayers.thanksgiving)` with inline rendering matching contrition style:

```javascript
// src/examination.js — in both _renderSummaryScreen and _renderExamination
// Replace: html += _renderPrayer(d.prayers.thanksgiving);
// With:
if (d.prayers.thanksgiving) {
  html += '<div class="exam-prayer-divider"></div>';
  html += '<div class="exam-contrition">';
  html += '<div class="exam-contrition-title">' + _esc(d.prayers.thanksgiving.title) + '</div>';
  d.prayers.thanksgiving.text.split('\n\n').forEach(function(p) {
    html += '<p class="exam-contrition-text">' + _esc(p.trim()) + '</p>';
  });
  html += '</div>';
}
```

**Fix B — Add divider CSS:**
```css
/* css/app.css — after .exam-contrition-text:last-child */
.exam-prayer-divider {
  width: 60px;
  height: 1px;
  background: var(--color-border-light);
  margin: 0 auto;
}
```

The existing `.exam-contrition` class already provides centered text, display font for title, and prayer font for body. Reusing it ensures visual unity.

**Dark mode:** `.exam-contrition` classes already have dark mode parity via token usage.
**Test:**
- Open Examination → navigate to summary
- Verify light divider between Act of Contrition and Thanksgiving
- Verify both prayers are centered with matching typography
- Verify no white card container on Thanksgiving
- Verify dark mode renders the divider correctly

---

### BT3-07 — Examination: Confession Tracker Feedback Refinement
**Backlog:** IDEA-041 · **Priority:** P2 · **Category:** enhancement
**Files:** `src/examination.js` (`examMarkConfession` ~line 490), `src/more.js` (~line 198)

**Problem:** Clicking "I received the Sacrament of Reconciliation" shows a redundant popup. Additionally, the button text uses "Reconciliation" (should be "Confession" per BT3-01 convention). The confirmation should be a visual effect on the button itself, not a separate status element.

**Fix A — Change button text:**
```javascript
// src/examination.js — in _renderSummaryScreen and _renderExamination
BEFORE: 'I received the Sacrament of Reconciliation'
AFTER:  'I went to confession today'
```

**Fix B — Enhance button confirmation effect:**
The existing `examMarkConfession` already adds a `.confirmed` class temporarily. Ensure the CSS provides clear visual feedback:

```css
/* css/app.css — add after existing exam-tracker styles */
.exam-tracker-btn.confirmed {
  background: var(--color-verified);
  color: white;
  border-color: var(--color-verified);
  transform: scale(0.97);
}
```

**Fix C — Show last confession on More tab card:**
In `src/more.js`, the exam card subtitle already shows `confLabel` when a confession is tracked. Verify the `confLabel` format:
```javascript
// src/more.js — around line 189
// Already exists: var confLabel = confStatus ? 'Last Confession: ' + ...
// Change to friendlier format:
var confLabel = confStatus
  ? (confStatus.daysAgo === 0 ? 'Went to confession today'
     : confStatus.daysAgo === 1 ? 'Last confession: yesterday'
     : 'Last confession: ' + confStatus.daysAgo + ' days ago')
  : '';
```

**Dark mode:** `--color-verified` has dark override.
**Test:**
- Open Examination → navigate to summary → tap "I went to confession today"
- Verify button flashes green (no popup/toast)
- Return to More tab → verify card subtitle updates
- Verify dark mode button colors

---

### BT3-08 — Examination: Consolidate Redundant Exit Paths
**Backlog:** IDEA-042 · **Priority:** P2 · **Category:** refinement
**Files:** `src/examination.js` (`_renderSummaryScreen` ~line 300–325)

**Problem:** The summary screen offers 3 exit paths: "Find Confession Near Me" (navigates to Find tab), "Return to MassFinder" (closes overlay), and a "Done" button in the footer that duplicates "Return to MassFinder." Additionally, the back button persists after marking confession.

**User story:** The 72-year-old is confused by three options. The 45-year-old just wants one obvious exit.

**Fix — Simplify to 2 clear actions:**

1. **Keep** "Find Confession Near Me" button — it has a unique destination
2. **Keep** the footer "Done" button — natural exit point
3. **Remove** the "Return to MassFinder" ending section entirely (it's redundant with footer "Done")
4. **Keep** the graceful ending cross icon and "Go in peace" text, but remove its button

```javascript
// src/examination.js — in _renderSummaryScreen, replace the exam-ending block:
BEFORE:
html += '<div class="exam-ending">';
html += '<div class="exam-ending-icon">...cross SVG...</div>';
html += '<p class="exam-ending-text">Go in peace to love and serve the Lord.</p>';
html += '<button class="exam-ending-btn" onclick="examGracefulClose()">Return to MassFinder</button>';
html += '</div>';

AFTER:
html += '<div class="exam-ending">';
html += '<div class="exam-ending-icon">...cross SVG...</div>';
html += '<p class="exam-ending-text">Go in peace to love and serve the Lord.</p>';
html += '</div>';
```

The footer "Done" button serves as the sole exit. "Find Confession Near Me" serves as the sole alternative action. Clean, simple, two paths.

**Test:**
- Open Examination → navigate to summary
- Verify only "Find Confession Near Me" and footer "Done" as actions
- Verify "Go in peace" text renders as a closing benediction, not a button
- Verify footer back arrow still works to return to last section

---

### BT3-09 — Examination: How-to-Confess Tooltip Step 1 Fix
**Backlog:** IDEA-037 · **Priority:** P1 · **Category:** bug
**Files:** `data/examination.json`

**Note:** This is data-only and is fully covered by BT3-03 Fix D. Included here for backlog traceability. Implementation is identical — change the step text in examination.json.

---

### BT3-10 — Examination: Full-Screen How-to Modal
**Backlog:** IDEA-038 · **Priority:** P2 · **Category:** refinement

**Note:** Fully covered by BT3-03 Fix A. Included here for backlog traceability.

---

## Group B: More Tab & Faith Guides Polish

---

### BT3-11 — Remove Redundant Abstinence Banner from More Tab
**Backlog:** IDEA-024 · **Priority:** P2 · **Category:** refinement
**Files:** `src/readings.js` (`renderFastingBanner` ~line 86), `index.html` (line 121)

**Problem:** The abstinence/fasting banner appears on the More tab, but the same information is already displayed in the liturgical teaser card on the Find tab. Duplicate content wastes vertical space on the More tab and adds no value.

**User story:** The 45-year-old switching between tabs sees the same banner twice. It feels like the app is nagging.

**Fix:** Remove the fasting banner from the More tab. The information lives on the Find tab liturgical teaser, which is the primary landing screen.

Option A (cleanest): Remove the `fastingBanner` div from `index.html`:
```html
<!-- index.html line 121 — REMOVE this line -->
<div id="fastingBanner"></div>
```

Option B (safer, keeps element for future use): In `renderFastingBanner`, return early:
```javascript
// src/readings.js — renderFastingBanner
// Add at top of function:
function renderFastingBanner(events) {
  return; // IDEA-024: abstinence info shown in Find tab teaser
  // ... rest of function
}
```

**Preferred:** Option A — remove the div. Cleaner.

**Test:** Open app on a Friday in Lent → verify no fasting banner on More tab → verify Find tab still shows liturgical teaser with abstinence info.

---

### BT3-12 — Remove Gospel Special Formatting in Readings
**Backlog:** IDEA-025 · **Priority:** P2 · **Category:** refinement
**Files:** `css/app.css` (lines ~1526–1529), `src/readings.js` (~line 246–247)

**Problem:** The Gospel reading entry has a colored left border and special accent text styling that distinguishes it from the First Reading and Responsorial Psalm. This visual separation is unnecessary and clashes with the warm, unified design of the readings section.

**User story:** The 72-year-old doesn't understand why one reading looks different. The 25-year-old finds the inconsistency distracting rather than helpful.

**Fix A — Remove Gospel class application in JS:**
```javascript
// src/readings.js — around line 246-247
BEFORE:
var isGospel = s.heading.toLowerCase().indexOf('gospel') !== -1;
var entryClass = 'reading-entry' + (isGospel ? ' reading-entry--gospel' : '');

AFTER:
var entryClass = 'reading-entry';
```

**Fix B — Remove (or keep) the CSS:** The CSS at lines 1526–1529 becomes dead code. Remove it for cleanliness:
```css
/* REMOVE lines 1526-1529 */
.reading-entry--gospel { ... }
.reading-entry--gospel .reading-heading { ... }
.reading-entry--gospel .reading-ref { ... }
.reading-entry--gospel:hover { ... }
```

**Dark mode:** Removing the class eliminates the dark mode concern entirely.
**Test:** Open More tab → expand Today's Readings → verify all three readings have identical styling (no colored left border on Gospel).

---

### BT3-13 — Novena Tracker Card Elevation When Active
**Backlog:** IDEA-028 · **Priority:** P3 · **Category:** enhancement
**Files:** `src/more.js` (~line 213), `css/app.css`

**Problem:** When a user has an active novena in progress, the Novena Tracker card in Prayer Tools looks identical to all other cards. The active devotion should be visually elevated to encourage follow-through.

**User story:** The 72-year-old started a novena 3 days ago but forgets to continue. The card blends in. A gentle visual elevation reminds them without being pushy.

**Fix:** The `promotedId` logic already exists (lines ~196–204 in more.js) and applies `prayer-tool-card--promoted` with an accent left border and gradient. Extend it to also promote the novena when one is active:

```javascript
// src/more.js — around line 196-204, enhance promotedId logic:
BEFORE:
var promotedId = '';
if (isLentSeason()) {
  promotedId = 'stations';
} else if (new Date().getDay() === 5) {
  promotedId = 'rosary';
} else if (confStatus && confStatus.daysAgo > 30) {
  promotedId = 'examination';
}

AFTER:
var promotedId = '';
var novenaActive = novSub.indexOf('Day') === 0 || novSub.indexOf('in progress') !== -1;
if (novenaActive) {
  promotedId = 'novena';
} else if (isLentSeason()) {
  promotedId = 'stations';
} else if (new Date().getDay() === 5) {
  promotedId = 'rosary';
} else if (confStatus && confStatus.daysAgo > 30) {
  promotedId = 'examination';
}
```

Active novena takes priority because it represents an in-progress commitment.

**Dark mode:** `--promoted` already has dark override at line 1602.
**Test:**
- Start a novena → return to More tab → verify Novena card has accent left border and gradient
- Complete all 9 days → verify card returns to normal style
- During Lent with no active novena → verify Stations still promoted

---

### BT3-14 — Faith Guides: Remove Collapse Toggle and TLM Entry
**Backlog:** IDEA-031 · **Priority:** P2 · **Category:** refinement
**Files:** `src/more.js` (~line 250–260 for show/hide toggle), `src/devotions.js` (~line 230–233 for TLM)

**Problem:** Two changes: (1) The "Show all guides / Show fewer" toggle should be removed — all guides should always be visible. (2) The Traditional Latin Mass guide entry should be removed entirely.

**Fix A — Remove progressive disclosure toggle:** In `src/more.js`, render all guides directly without the overflow/toggle mechanism:

```javascript
// src/more.js — around line 247-260
// Replace the visibleCount / overflow logic with:
devotEl.innerHTML = allGuideHtml.join('');
// Remove the hiddenHtml, overflow div, and devotShowAll button
```

Also remove `toggleDevotOverflow` function and its export.

**Fix B — Remove TLM entry from devotions.js:**
```javascript
// src/devotions.js — remove the object starting at line ~230:
{icon:'...book SVG...',title:'The Traditional Latin Mass',body: '...' },
```

**Test:**
- Open More tab → scroll to Faith Guides → verify all guides visible (no "Show all" button)
- Verify "The Traditional Latin Mass" does not appear in the list
- Verify remaining guides render correctly

---

### BT3-15 — Remove Holy Days Dispensation Footnote
**Backlog:** IDEA-044 · **Priority:** P3 · **Category:** refinement
**Files:** `src/devotions.js` (~line 154)

**Problem:** The Sunday Obligation guide has a paragraph about the U.S. bishops dispensing the obligation when Jan 1, Aug 15, or Nov 1 falls on a Saturday or Monday. This footnote is not needed.

**Fix:** Remove the paragraph from the Holy Days of Obligation details content:
```javascript
// src/devotions.js — remove line ~154:
+'    <p>When January 1, August 15, or November 1 falls on a Saturday or Monday, the obligation is typically dispensed by the U.S. bishops. A vigil Mass the evening before fulfills the obligation for any Holy Day.</p>'
```

**Test:** Open More tab → expand Sunday Obligation → expand Holy Days → verify dispensation paragraph is gone. Verify the list of 6 holy days still renders.

---

### BT3-16 — Faith Guides Active State Unreadable in Dark Mode
**Backlog:** IDEA-045 · **Priority:** P1 · **Category:** bug
**Files:** `css/app.css` (~line 1616–1618)

**Problem:** When a Faith Guide `<details>` is open, the active state uses `border-left:3px solid var(--color-accent)` and a gradient from `var(--color-accent-pale)` to `var(--color-surface)`. In dark mode, `--color-accent-pale` maps to `#2E2618` which is dark brown, and the text may become unreadable against this background depending on what text colors the content uses.

**User story:** The 25-year-old switches to dark mode and opens a guide — text disappears into the background.

**Fix:** Verify and adjust the dark mode gradient specifically for open guides:

```css
/* css/app.css — around line 1617 */
BEFORE:
html[data-theme="dark"] .devot-card[open] { background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);box-shadow:var(--shadow-card-hover); }

AFTER:
html[data-theme="dark"] .devot-card[open] {
  background: linear-gradient(135deg, rgba(212,168,75,0.06) 0%, var(--color-surface) 40%);
  box-shadow: var(--shadow-card-hover);
  border-left-color: var(--color-accent);
}
```

The gradient start should be a very subtle accent tint (6% opacity), transitioning to surface color at 40% instead of 60%. This preserves the open-state visual cue without compromising text readability.

Also check child content text colors:
```css
html[data-theme="dark"] .devot-card[open] .conf-exam-body { color: var(--color-text-secondary); }
html[data-theme="dark"] .devot-card[open] .conf-exam-body p { color: var(--color-text-primary); }
```

**Test:**
- Toggle dark mode → open More tab → expand a Faith Guide
- Verify all text is readable against the background
- Verify the accent left border is visible
- Verify child `<details>` (sub-guides like Devotions) also have readable text
- Test on both light and dark modes

---

## Group C: Find & Saved Tab Accessibility

---

### BT3-17 — Find Tab Sorting Text Too Small
**Backlog:** IDEA-023 · **Priority:** P1 · **Category:** refinement
**Files:** `css/app.css` (~lines 348–352)

**Problem:** The results-count (e.g., "32 results") and sort button ("By distance") are rendered at `font-size: 11px` — far too small for elderly users. The 72-year-old with bifocals cannot read this at all.

**User story:** The 72-year-old can see the church cards but has no idea what sorting is applied or how to change it. The sort control is effectively invisible.

**Fix:**
```css
/* css/app.css — lines 348, 350 */
BEFORE:
.results-count { font-size: 11px; ... }
.results-sort { font-size: 11px; ... min-height: 32px; }
.results-sort svg { width: 14px; height: 14px; }

AFTER:
.results-count { font-size: var(--text-sm); color: var(--color-text-tertiary); font-weight: var(--weight-medium); display: flex; align-items: center; gap: var(--space-2); }
.results-sort { font-size: var(--text-sm); color: var(--color-text-secondary); font-weight: var(--weight-medium); display: flex; align-items: center; gap: var(--space-1); padding: var(--space-1) var(--space-2); border-radius: var(--radius-sm); min-height: 44px; }
.results-sort svg { width: 16px; height: 16px; }
```

Key changes: `11px` → `var(--text-sm)` (15px), min-height `32px` → `44px` (touch target), SVG `14px` → `16px`, text color on sort button to `--color-text-secondary` (slightly darker for readability).

**Dark mode:** Token-based — inherits automatically.
**Test:**
- Open Find tab → verify sort label "By distance" is clearly legible
- Verify results count "X results" is readable
- Verify sort button tap target is ≥44px
- Test with text-size setting on "large"

---

### BT3-18 — Saved Tab Schedule Section Font Too Small
**Backlog:** IDEA-026 · **Priority:** P1 · **Category:** refinement
**Files:** `css/app.css` (~lines 1278–1284)

**Problem:** The schedule rows on the Saved tab use `var(--text-sm)` (15px) for both times and church names. For a dense schedule of today's services across multiple saved parishes, this is too small for the 72-year-old.

**Fix:**
```css
/* css/app.css — lines 1281-1284 */
BEFORE:
.sched-time { font-size:var(--text-sm); ... }
.sched-type { font-size:var(--text-sm); ... }
.sched-church { font-size:var(--text-sm); ... }

AFTER:
.sched-time { font-size:var(--text-base); font-weight:var(--weight-semibold); color:var(--color-text-primary); min-width:92px; flex-shrink:0; font-variant-numeric:tabular-nums; text-align:right; }
.sched-type { font-size:var(--text-base); color:var(--color-text-primary); display:flex; align-items:center; gap:var(--space-2); }
.sched-church { font-size:var(--text-sm); color:var(--color-text-tertiary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
```

Time and service type bumped from `--text-sm` (15px) to `--text-base` (17px). Church name stays at `--text-sm` as secondary info.

**Dark mode:** Token-based.
**Test:**
- Open Saved tab with 2+ saved churches → verify schedule times are clearly readable
- Verify times still align in a clean column (tabular-nums)
- Verify text doesn't overflow on smaller screens (375px width)

---

### BT3-19 — Saved Tab Schedule Alternating Row Colors
**Backlog:** IDEA-027 · **Priority:** P3 · **Category:** enhancement
**Files:** `css/app.css` (after line ~1279)

**Problem:** The schedule rows on the Saved tab lack visual differentiation between adjacent entries, making it easy to lose your place when scanning a long list.

**Fix:**
```css
/* css/app.css — after .sched-row styles */
.sched-row:nth-child(even) {
  background: var(--color-primary-bg);
}
html[data-theme="dark"] .sched-row:nth-child(even) {
  background: rgba(255,255,255,0.02);
}
```

Light, subtle alternating — `--color-primary-bg` is `rgba(44,62,90,0.04)` in light mode, essentially a whisper of color. Dark mode uses a very slight white tint.

**Note:** Must not conflict with `.sched-live` (which has its own background) or `.sched-past` (opacity-based). Add specificity:
```css
.sched-row:nth-child(even):not(.sched-live):not(.sched-past) {
  background: var(--color-primary-bg);
}
```

**Test:**
- Open Saved tab → verify alternating subtle background on even rows
- Verify live service rows retain their blue highlight
- Verify past service rows retain their dimmed opacity
- Verify dark mode alternation is visible but subtle

---

### BT3-20 — Find Tab Filter Pills Swipe Triggers Page Refresh
**Backlog:** IDEA-049 · **Priority:** P1 · **Category:** bug
**Files:** `css/app.css` (chip-bar area, line ~318), possibly `src/ui.js` or `src/app.js`

**Problem:** Swiping left/right on the filter chip bar at the top of the Find tab frequently triggers the browser's pull-to-refresh gesture, causing an unintended page reload.

**User story:** The 45-year-old one-handing the phone swipes on chips to see more filters and the page refreshes, losing their context. Extremely frustrating.

**Fix:** Add `overscroll-behavior-y: contain` on the chip bar and ensure the chip bar scroll container captures horizontal touch events:

```css
/* css/app.css — line 318 */
.chip-bar {
  /* existing styles... */
  overscroll-behavior: contain;
  touch-action: pan-x;  /* restrict to horizontal panning only */
}
```

The key is `touch-action: pan-x` which tells the browser this element only handles horizontal gestures, preventing vertical pull-to-refresh from being triggered by diagonal swipes that start on the chip bar.

**Test:**
- Open Find tab → swipe horizontally on chip bar → verify no page refresh
- Verify vertical pull-to-refresh still works when swiping on the card list below
- Test on iOS Safari and Chrome Android

---

### BT3-21 — Young Catholic Event Cards Need Subtler Design
**Backlog:** IDEA-051 · **Priority:** P2 · **Category:** refinement
**Files:** `css/app.css` (~line 550 for `.yc-card`, line ~1487 for `.inline-yc-card`)

**Problem:** Young Catholic event cards on the Find tab use a distinct cream gradient background with a gold left border that creates too much visual separation from standard church cards. They should match the regular card system with just a subtle identifier.

**User story:** The 25-year-old sees the YC cards as "sponsored content" — they look so different they feel promotional. The 72-year-old is confused by the visual language shift.

**Fix — Tone down the `.yc-card` to match standard cards with subtle flair:**

```css
/* css/app.css — around line 550 */
BEFORE:
.yc-card { background: linear-gradient(135deg, #FBF8F1 0%, #F5EDD8 100%); border-left: 4px solid var(--color-accent); border-radius: var(--radius-md); padding: var(--space-5); box-shadow: var(--shadow-card); ... }

AFTER:
.yc-card {
  background: var(--color-surface);
  border-left: 3px solid var(--color-accent);
  border-radius: var(--radius-md);
  padding: var(--space-5);
  box-shadow: var(--shadow-card);
  cursor: pointer;
  transition: box-shadow var(--transition-base), transform var(--transition-fast);
}
```

Key change: Remove the cream gradient, use standard `--color-surface` background. Keep the accent left border (3px instead of 4px) as the sole differentiator. This matches the promoted prayer card treatment — consistent visual language.

Also update the dark mode override:
```css
/* css/app.css — around line 142-143 */
BEFORE:
html[data-theme="dark"] .yc-card { background: linear-gradient(135deg, #2A2618 0%, #302A1E 100%); }

AFTER:
html[data-theme="dark"] .yc-card { background: var(--color-surface); }
```

**Test:**
- Open Find tab on a day with YC events → verify cards match standard card background
- Verify accent left border still distinguishes them
- Verify dark mode treatment matches standard dark cards with accent border
- Verify the YC badge/chip at top of card still renders

---

## Group D: Global Fixes & Cross-Cutting

---

### BT3-22 — Bottom Nav Bar Scrolls with Page Content
**Backlog:** IDEA-029 · **Priority:** P1 · **Category:** bug
**Files:** `css/app.css` (~line 1030)

**Problem:** Intermittently, the bottom tab bar loses its `position: fixed` and scrolls with the page. The trigger is unknown.

**Investigation approach:** The tab bar at line 1030 has `position: fixed`. The most common cause of this bug on iOS is a parent element with `transform`, `filter`, or `will-change` set, which creates a new stacking context that breaks `position: fixed`. Another cause is `overflow: hidden` on the body or an ancestor.

**Fix — Add defensive CSS:**
```css
/* css/app.css — line 1030 */
.tab-bar {
  position: fixed;
  position: -webkit-sticky;  /* iOS fallback */
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  /* Existing styles... */
  transform: translateZ(0);  /* Force GPU layer — prevents ancestor transforms from capturing */
  -webkit-transform: translateZ(0);
}
```

**Note:** `position: -webkit-sticky` is not the right fix here — `position: fixed` is correct. The `translateZ(0)` forces a compositing layer which can help on iOS. However, the real fix may require auditing which element occasionally gets a `transform` applied that captures the fixed positioning. Check if any JS animations apply `transform` to a parent of `.tab-bar`.

Additionally, check if `body.reader-open` or `body.map-active` class changes affect the tab bar:

```css
/* Defensive: ensure tab-bar is ALWAYS fixed */
body.reader-open .tab-bar,
body.map-active .tab-bar {
  position: fixed !important;
}
```

**Test:** This is a intermittent bug — test by rapid tab switching, opening/closing detail panels, opening/closing reader overlay, and navigating between map and find tabs. Verify tab bar stays fixed throughout.

---

### BT3-23 — Rosary Opening Prayers: Stacked with Toggle
**Backlog:** IDEA-030 · **Priority:** P2 · **Category:** refinement
**Files:** `src/rosary.js` (`_renderOpening` ~line 372, `_prayerBlock` ~line 511), `css/app.css`

**Problem:** The rosary opening prayers (Sign of the Cross, Apostles' Creed, Our Father, 3 Hail Marys, Glory Be) are rendered in a continuous vertical flow with all prayer text fully visible by default. Users who know these prayers by heart are overwhelmed. The "Mysteries only" toggle already collapses everything to a single summary line, but there's no middle ground.

**User story:** The 72-year-old wants to see the prayer names listed vertically (as a checklist feel), with the ability to expand any specific prayer they need a refresher on. The 25-year-old wants a clean, beautiful layout — not a wall of text.

**Fix:** Change opening prayers to use `_prayerBlockCollapsible` (already exists) with all prayers collapsed by default:

```javascript
// src/rosary.js — in _renderOpening, around line 386-393
// When NOT in condensed mode, use collapsible blocks instead of expanded:
BEFORE:
: _prayerBlock('Sign of the Cross', p.sign_of_cross)
  + _prayerBlock('Apostles\' Creed', p.apostles_creed)
  + _prayerBlock('Our Father', p.our_father)
  + _prayerBlock('Three Hail Marys', p.hail_mary, 'For an increase of Faith, Hope, and Charity')
  + _prayerBlock('Glory Be', p.glory_be))

AFTER:
: _prayerBlockCollapsible('Sign of the Cross', p.sign_of_cross)
  + _prayerBlockCollapsible('Apostles\' Creed', p.apostles_creed)
  + _prayerBlockCollapsible('Our Father', p.our_father)
  + _prayerBlockCollapsible('Three Hail Marys', p.hail_mary, 'For an increase of Faith, Hope, and Charity')
  + _prayerBlockCollapsible('Glory Be', p.glory_be))
```

The `_prayerBlockCollapsible` function (line 520) already renders as `<details>` with a chevron, collapsed by default (4th param `isOpen` defaults to falsy). The prayer names appear as a clean stacked list. Users tap to expand any prayer they need.

**Dark mode:** Prayer blocks already use token-based colors.
**Test:**
- Open Rosary → select a mystery set → verify opening prayers show as stacked collapsed titles
- Tap "Apostles' Creed" → verify text expands smoothly
- Toggle "Mysteries only" → verify summary line still works
- Toggle back → verify collapsible state returns

---

### BT3-24 — CCC Reference Pills Not Rendering in Faith Guides
**Backlog:** IDEA-043 · **Priority:** P1 · **Category:** bug
**Files:** `src/more.js` (~line 276–282), `src/refs.js`, `src/devotions.js`

**Problem:** CCC reference pills inside open Faith Guide drawers on the More tab don't render their text snippets when tapped. The wiring at line ~276 in more.js uses a querySelector for `<strong>` elements matching a CCC pattern and binds `window.openCCC(num)` — but the CCC sheet may not receive the correct paragraph number, or the snippet.js dismissal may interfere.

**Investigation:** The issue may be the same as IDEA-006 (resolved in BT1-04) — the snippet is being dismissed prematurely. Verify that the `.devot-card` exclusion added in BT1-04 is working. Check `src/snippet.js` for the click exclusion list.

**Fix — Verify exclusion in snippet.js:**
```javascript
// src/snippet.js — check the dismissal click handler
// The BT1-04 fix added '.devot-card' to the exclusion list
// Verify this is present. If not, add it.
```

If the exclusion is present but still failing, the issue may be timing — the CCC data fetch completing after the snippet has already been dismissed. Add a guard:

```javascript
// src/more.js — around line 280, verify the click handler stops propagation:
el.addEventListener('click', function(ev) {
  ev.stopPropagation();
  ev.preventDefault();  // Add this to prevent any default behavior
  window.openCCC(num);
});
```

**Test:**
- Open More tab → expand "The Sunday Obligation" guide
- Tap a **CCC 2180** reference → verify catechism text appears
- Tap a **CCC 2181** reference → verify it also renders
- Verify the snippet persists (doesn't flash and disappear)

---

### BT3-25 — Remove About Section and Feedback Form from Settings
**Backlog:** IDEA-046 · **Priority:** P2 · **Category:** refinement
**Files:** `src/settings.js` (~lines 95–116)

**Problem:** The Settings page has an About section with app description, a feedback form (textarea + email + send button), and a GitHub link. Per the request: remove the About text and the feedback form. Keep the GitHub link.

**Fix:** Replace the About group content in `_render()`:

```javascript
// src/settings.js — replace the About section (lines ~95-116):
BEFORE: (full about block with description, feedback form, and GitHub link)

AFTER:
html += '<div class="settings-group settings-about">'
  + '<div class="settings-about-block">'
  + '<p class="settings-about-text">Open source. <a href="https://github.com/monsballoon-hue/MassFinderApp" target="_blank" rel="noopener" style="color:var(--color-primary);text-decoration:none;font-weight:var(--weight-semibold)">View on GitHub \u2192</a></p>'
  + '</div>'
  + (lastUpdated ? '<div class="settings-about-row" style="margin-top:var(--space-3);font-size:var(--text-xs);color:var(--color-text-tertiary)">Parish data updated ' + esc(lastUpdated) + '</div>' : '')
  + '</div>';
```

Keep the `lastUpdated` display — it's useful metadata.

**Test:**
- Open Settings → verify About section only shows GitHub link and data date
- Verify no textarea, email input, or Send button
- Verify GitHub link opens correctly

---

### BT3-26 — Map Tab: Move Filter Pills Below Map Controls on Mobile
**Backlog:** IDEA-048 · **Priority:** P1 · **Category:** bug
**Files:** `css/app.css` (~line 1188)

**Problem:** On mobile, the map filter chip bar is positioned at `top:76px` which places it below the zoom controls but still conflicts with the map's location button. Moving pills to the bottom of the screen (above the tab bar) eliminates all overlap.

**Fix:**
```css
/* css/app.css — line 1188 */
BEFORE:
.map-chip-bar { position:absolute;top:76px;left:var(--space-3);right:var(--space-3);z-index:501; ... }

AFTER:
.map-chip-bar {
  position: absolute;
  bottom: calc(var(--space-3));
  left: var(--space-3);
  right: var(--space-3);
  z-index: 501;
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-1);
}
```

Also update the sibling combinator for the filter pill:
```css
/* css/app.css — line 1198 */
BEFORE:
.map-chip-bar ~ .map-filter-pill { top:124px; }

AFTER:
.map-chip-bar ~ .map-filter-pill { bottom: calc(var(--space-3) + 44px); top: auto; }
```

**Note:** On desktop, top positioning may still be preferred. Use a media query:
```css
@media (max-width: 768px) {
  .map-chip-bar { top: auto; bottom: var(--space-3); }
  .map-chip-bar ~ .map-filter-pill { top: auto; bottom: calc(var(--space-3) + 44px); }
}
```

**Dark mode:** No color changes — positional only.
**Test:**
- Open Map tab on mobile → verify chips appear above tab bar, not overlapping zoom controls
- Verify filter pill appears above chips
- Verify chips still scroll horizontally
- Verify desktop layout remains at top (if media query approach used)
- Verify tapping a chip still filters markers

---

### BT3-27 — Church Detail Links Open in External Browser
**Backlog:** IDEA-050 · **Priority:** P2 · **Category:** bug
**Files:** `src/render.js` (church detail rendering — bulletin/website links)

**Problem:** Bulletin and website links in the church detail panel open within the PWA instead of in the system browser. Users get trapped without browser navigation (back, tabs, URL bar).

**Fix:** Add `target="_blank" rel="noopener"` to all external links in the detail panel. Search `src/render.js` for `bulletin` and `website` link rendering and ensure both have the attributes.

```javascript
// src/render.js — find bulletin/website link rendering
// Ensure all external <a> tags include:
'<a href="' + url + '" target="_blank" rel="noopener">'
```

**Note:** In a PWA with `"display": "standalone"`, `target="_blank"` should open in the system browser on both iOS and Android. If this doesn't work on iOS, the alternative is to use `window.open(url, '_system')` or an onclick handler.

**Test:**
- Open church detail → tap bulletin link → verify opens in Safari/Chrome (not in-app)
- Tap website link → verify same behavior
- Test in PWA mode (installed to home screen)
- Test in browser mode (should open in new tab)

---

### BT3-28 — PWA Update Banner Appearing Too Frequently
**Backlog:** IDEA-052 · **Priority:** P2 · **Category:** bug
**Files:** `sw.js` or `src/app.js` (service worker registration and update handling)

**Problem:** The "Update available — Refresh" banner fires nearly every app open, even without new deployments. The service worker update check is triggering false positives.

**Investigation:** This is likely caused by the SW always detecting a byte difference (e.g., cache version string, build timestamp, or Vercel injecting different headers). The SW registration `updatefound` event fires whenever any byte of the SW file changes.

**Fix approach:** Add a version check — compare the new SW's cache version against the current one. Only show the banner if the versions actually differ.

```javascript
// src/app.js — in the service worker update handler
// Before showing the banner, verify it's a real update:
navigator.serviceWorker.addEventListener('controllerchange', function() {
  // Only show if we haven't already shown in this session
  if (sessionStorage.getItem('mf-sw-updated')) return;
  sessionStorage.setItem('mf-sw-updated', '1');
  // Show banner...
});
```

At minimum, add a session-scoped guard so the banner only shows once per session, not on every focus/refocus.

**Test:**
- Open app → close and reopen → verify no update banner (unless a real deploy happened)
- Deploy a real change → open app → verify banner shows once
- Tap refresh → verify banner doesn't reappear

---

## Backlog Items Excluded from This Spec

| ID | Reason |
|----|--------|
| IDEA-007 | Tech-debt: events data cleanup (non-UX) |
| IDEA-009 | Logic bug: nearby prioritization (non-visual) |
| IDEA-018 | Dev tooling: dev panel buildout (non-UX) |
| IDEA-019 | Research: prayer ambient experience (too broad, no concrete spec) |
| IDEA-022 | Data bug: Lenten counter days (non-visual, needs liturgical decision) |
| IDEA-032 | Pie-in-the-sky: journaling (needs backend) |
| IDEA-047 | Tech-debt: church name data cleanup (non-UX) |

---

## Implementation Order (Recommended)

**Phase 1 — Critical bugs & accessibility (P1):**
BT3-02, BT3-03, BT3-04, BT3-16, BT3-17, BT3-18, BT3-20, BT3-22, BT3-24, BT3-26

**Phase 2 — Refinements (P2):**
BT3-01, BT3-05, BT3-06, BT3-07, BT3-08, BT3-11, BT3-12, BT3-14, BT3-21, BT3-25, BT3-27, BT3-28

**Phase 3 — Enhancements (P3):**
BT3-09 (traceability only), BT3-10 (traceability only), BT3-13, BT3-15, BT3-19, BT3-23
