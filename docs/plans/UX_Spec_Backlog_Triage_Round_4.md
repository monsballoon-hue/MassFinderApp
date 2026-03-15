# UX Spec — Backlog Triage Round 4 (BT4 Series)

**Created:** 2026-03-15
**Source:** IDEA-103, IDEA-108, IDEA-109, IDEA-110, IDEA-111, IDEA-113, IDEA-115, IDEA-117, IDEA-118
**Items:** 9
**Scope:** Visual bugs, interaction refinements, typography consistency, accessibility
**Demographics:** Dorothy (72), Paul (25), Sarah (45)

### Status Summary
- BT4-01 — Exam Opening Prayer Overflow — **done**
- BT4-02 — Prayer Book Duplicate Render — **done**
- BT4-03 — Find Tab Chip Animation — **done**
- BT4-04 — Chaplet Same-Prayer Fade Skip — **done**
- BT4-05 — Practice Tile Refinements — **done**
- BT4-06 — Novena List Visual Hierarchy — **done**
- BT4-07 — Growing Faith Collapse Removal — **done**
- BT4-08 — Sacred Font Token Consistency — **done**
- BT4-09 — Text Size x-large — **done**

---

## BT4-01 — Exam Opening Prayer Overflow (IDEA-118)

**Priority:** P1 — Bug
**Problem:** The opening prayer on the Examination of Conscience first page is cut off with no way to scroll. `.exam-opening-text` has `overflow:hidden` and a CSS mask gradient that fades the bottom 20% to transparent, making the last lines of prayer text literally invisible. At `[data-text-size="large"]` (19px), the prayer is guaranteed to overflow the flex container.

**Dorothy:** Cannot read the full prayer before beginning her examination. The "Begin Examination" button sits below the cut-off text, so she might not even realize text is missing.
**Sarah:** Quickly taps "Begin" without reading — less impacted, but still broken if she tries.
**Paul:** Notices the mask gradient fade and wonders if content is hidden — feels like a rendering bug.

**Fix:**
- **File:** `css/app.css` line 2785
- **Before:**
```css
.exam-opening { display:flex;flex-direction:column;align-items:center;text-align:center;padding:var(--space-8) var(--space-5) var(--space-5);max-width:380px;margin:0 auto;height:100%;overflow:hidden; }
```
```css
.exam-opening-text { font-family:var(--font-prayer);font-size:var(--text-base);color:var(--color-text-secondary);line-height:1.8;flex:1;min-height:0;overflow:hidden;-webkit-mask-image:linear-gradient(to bottom,black 80%,transparent);mask-image:linear-gradient(to bottom,black 80%,transparent); }
```
- **After:**
```css
.exam-opening { display:flex;flex-direction:column;align-items:center;text-align:center;padding:var(--space-8) var(--space-5) var(--space-5);max-width:380px;margin:0 auto;height:100%;overflow:hidden; }
```
```css
.exam-opening-text { font-family:var(--font-prayer);font-size:var(--text-base);color:var(--color-text-secondary);line-height:1.8;flex:1;min-height:0;overflow-y:auto;-webkit-overflow-scrolling:touch; }
```
- Remove the mask-image gradient entirely — it conceals content. The flex layout with `flex:1;min-height:0` already constrains height; adding `overflow-y:auto` lets users scroll to read the full prayer.

**Dark mode:** No changes — dark mode inherits same fix.

**Test checklist:**
- [ ] Opening prayer fully scrollable at all 3 text sizes
- [ ] "Begin Examination" button remains visible and tappable
- [ ] No mask gradient — last line of prayer text is fully opaque
- [ ] Dark mode: prayer text remains readable while scrolling
- [ ] Long prayer text (Spanish translation future-proofing) doesn't break layout

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** css/app.css line 2788 — replaced overflow:hidden + mask-image gradient with overflow-y:auto + -webkit-overflow-scrolling:touch
- **Approach:** CSS-only fix. Removed the mask-image that was fading out the bottom 20% of prayer text, and replaced overflow:hidden with overflow-y:auto so the text can scroll. The flex:1;min-height:0 constraint still governs height.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## BT4-02 — Prayer Book Renders Prayer In-Place and in Recents Simultaneously (IDEA-108)

**Priority:** P1 — Bug
**Problem:** Clicking any prayer in the Prayer Book immediately renders the prayer text at the click location AND simultaneously adds it to the "Recently Opened" section at the top. The prayer should expand in-place only. Recents tracking should happen silently in localStorage without auto-rendering the prayer in the recents area.

**Dorothy:** Sees the same prayer appear twice on screen — thinks something is broken.
**Paul:** Notices the duplicate render — perceives it as a bug and loses trust.
**Sarah:** Confused by sudden content shift as the page re-renders with the prayer in two places.

**Fix:**
- **File:** `src/prayerbook.js`
- The `_onPrayerTap()` handler (or equivalent) needs two changes:
  1. Track the opened prayer ID in localStorage `mf-prayerbook-recent` (already happens)
  2. Do NOT re-render the recents section while the current prayer is expanded. Only update the recents display on the next full render (when the prayer book is re-opened or the prayer is collapsed).
- Find the render path that updates the recents UI on tap and guard it: if a prayer was just opened, skip the recents re-render until the prayer is collapsed.

**Dark mode:** N/A — logic-only fix.

**Test checklist:**
- [ ] Tapping a prayer expands it in-place only — no duplicate rendering
- [ ] Recently Opened section updates on next prayer book open, not during current expansion
- [ ] Collapsing a prayer and re-opening prayer book shows correct recents
- [ ] localStorage `mf-prayerbook-recent` tracks correctly (max 3)

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** src/prayerbook.js line 390 — added `&& !_openPrayerId` guard to recents rendering
- **Approach:** When a prayer is expanded (_openPrayerId is set), the recents section is skipped during _renderList(). Recents still track in localStorage, but the visual section only renders when no prayer is currently open. On next full render (prayer collapsed or prayer book reopened), recents display correctly.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## BT4-03 — Find Tab Chip Animation Sluggish (IDEA-103)

**Priority:** P1 — Bug
**Problem:** The SLV-01 season transition system registers `.chip.active` for the 1.5s color transition (line 143 in app.css). This means when a user taps a filter chip on the Find tab, the background/border/color change takes 1.5 seconds to complete — intended for vestment-like season shifts, not for instant user interactions. The chip feels unresponsive.

**Paul:** Taps "Confession" chip and waits 1.5s for the color to fill — feels broken. Bounces.
**Sarah:** Quick-tapping between chips while wrangling kids — the slow animation makes her think taps aren't registering.
**Dorothy:** Less sensitive to animation speed but still perceives delay.

**Fix:**
- **File:** `css/app.css` line 143
- **Before:**
```css
.saint-card,
.formation-card,
.reader-header::after,
.chip.active {
  transition: background 1.5s ease-in-out, border-color 1.5s ease-in-out, box-shadow 1.5s ease-in-out, color 1.5s ease-in-out;
}
```
- **After:**
```css
.saint-card,
.formation-card,
.reader-header::after {
  transition: background 1.5s ease-in-out, border-color 1.5s ease-in-out, box-shadow 1.5s ease-in-out, color 1.5s ease-in-out;
}
```
- Remove `.chip.active` from the SLV-01 fallback selector. The chip's own `transition: all var(--transition-fast)` (line 385, 150ms) is already correct for user interactions. The 1.5s override was collateral damage from the season transition system.

**Dark mode:** Same fix applies — the SLV-01 rule is theme-agnostic.

**Test checklist:**
- [ ] Tapping a chip on Find tab shows instant color fill (~150ms)
- [ ] Season color transitions on saint-card and formation-card still animate at 1.5s
- [ ] Chip active state renders correctly in both light and dark mode
- [ ] Map tab chip overlay also responds instantly (shares `.chip` class)

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** css/app.css line 141 — removed `.chip.active` from the SLV-01 fallback selector
- **Approach:** Removed .chip.active from the comma-separated selector that applied 1.5s season transitions. The chip's own `transition: all var(--transition-fast)` (150ms) now governs chip interactions. Saint-card and formation-card retain the 1.5s transition.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## BT4-04 — Chaplet Full-Screen Fade on Repetitive Steps (IDEA-109)

**Priority:** P2 — Refinement
**Problem:** In the Divine Mercy Chaplet, each "Hail Mary" / "Eternal Father" bead triggers `_transitionTo()` which fades the entire `#readerBody` to opacity 0, replaces all innerHTML, and fades back to opacity 1. On repetitive prayers where only the bead counter changes, this full-body crossfade is jarring — the prayer text and structure are identical, only the progress indicator updates.

**Dorothy:** The full fade between each bead is disorienting — she loses her place in prayer.
**Sarah:** The 150ms out + 150ms in transition adds 300ms per bead × 10 beads = 3 seconds of dead animation per decade.
**Paul:** Perceives the fade as unnecessary motion — a polished app would only animate what changed.

**Fix:**
- **File:** `src/chaplet.js`, `_renderDecade()` function and the navigation handler that calls `_transitionTo()`
- When advancing within the same prayer type (same decade, same prayer text), skip the full crossfade. Instead:
  1. Check if the current screen type and prayer text match the previous render
  2. If same prayer type: update only the bead counter / progress indicator directly via DOM manipulation (no innerHTML replace, no opacity transition)
  3. If different prayer type (e.g., moving from Eternal Father to Hail Mary, or decade to closing): keep the existing crossfade

- **Implementation approach:**
```javascript
// In the navigation handler, before calling _transitionTo:
var isSameType = (_prevPhase === _phase && _prevStep === 'decade');
if (isSameType) {
  // Direct DOM update — no fade
  var counter = document.querySelector('.chaplet-bead-count');
  if (counter) counter.textContent = _beadIdx + ' of 10';
  // Update progress dots directly
  _updateProgressDots();
  _haptic();
  return;
}
_transitionTo(function() { _render(); });
```

**Dark mode:** No additional changes.

**Test checklist:**
- [ ] Same-prayer bead advances update counter without full fade
- [ ] Transition between different prayer types (Eternal Father → Hail Mary) still crossfades
- [ ] Transition between decades still crossfades
- [ ] Opening and closing prayers still crossfade
- [ ] Haptic feedback still fires on same-prayer advances
- [ ] Swipe navigation handles same-prayer detection correctly

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** src/chaplet.js — added _prevScreen/_prevBead vars (line 18-19), modified chapletNext() and chapletPrev() with same-decade detection
- **Approach:** Before state mutation, capture wasDecade/wasBead/wasDecadeIdx. After mutation, check if both old and new states are within the same decade with small beads (bead > 0). If so, directly update the decade label text and bead dot classes without triggering _transitionTo(). Applied to both chapletNext() and chapletPrev() for consistency. Full crossfade preserved for large bead, decade transitions, opening/closing.
- **Deviations from spec:** Also applied optimization to chapletPrev() (spec only mentioned chapletNext). This prevents jarring crossfade when swiping backward through beads too.
- **Known issues:** None observed

---

## BT4-05 — Practice Tiles Verbose and Low Contrast (IDEA-110)

**Priority:** P2 — Refinement
**Problem:** The "Your Practice" tracker strip tiles (`.practice-card`) have two issues: (1) The Novena tile subtitle renders the full novena description, which is too verbose for a compact 48px-tall tile. (2) The tiles use `background:var(--color-surface-hover)` which is barely distinguishable from the zone background, making them look like they float in nothing.

**Dorothy:** Can't tell where the tile ends and the background begins. The small text in the subtitle is unreadable.
**Paul:** The tiles look unfinished — no card elevation, no border definition.
**Sarah:** Glances at the tile expecting a status update, gets a paragraph of text instead.

**Fix:**
- **File:** `src/more.js` — Novena practice card subtitle
  - **Before:** `esc(novSub || 'Guided prayer tracking')` renders the full novena description
  - **After:** Truncate `novSub` to first sentence or 40 characters, whichever is shorter. If in-progress, show "Day X of Y" instead of the description.
  ```javascript
  // Replace novSub with progress-first summary
  var novLabel = novTracking
    ? 'Day ' + novTracking.completedDays.length + ' of ' + novTracking.total
    : 'Start a novena';
  ```

- **File:** `css/app.css` line 1574
  - **Before:**
  ```css
  .practice-card { flex:1;display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--color-surface-hover);border-radius:var(--radius-md);cursor:pointer;-webkit-tap-highlight-color:transparent;min-height:48px;transition:background 0.15s; }
  ```
  - **After:**
  ```css
  .practice-card { flex:1;display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);cursor:pointer;-webkit-tap-highlight-color:transparent;min-height:48px;transition:background 0.15s; }
  ```
  - Add border for definition. Switch background from `surface-hover` to `surface` for contrast.

- **Dark mode:** Update dark override:
  - **Before:** `html[data-theme="dark"] .practice-card { background:var(--color-surface); }`
  - **After:** `html[data-theme="dark"] .practice-card { background:var(--color-surface);border-color:var(--color-border); }`

**Test checklist:**
- [ ] Practice tiles have visible border in light mode
- [ ] Novena tile shows "Day X of Y" when in-progress, "Start a novena" when idle
- [ ] First Friday tile subtitle remains concise
- [ ] Tiles are visually distinct from zone background in both themes
- [ ] Active state (`.practice-card--active`) still renders with sacred colors

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** css/app.css line 1570 — changed background to var(--color-surface) + added border; line 1579 — added border-color to dark override; src/more.js line 953-964 — seasonal label no longer overrides progress when novena is active; idle shows "Start a novena"
- **Approach:** CSS: swapped surface-hover bg for surface + border:1px solid var(--color-border-light). Dark mode adds border-color:var(--color-border). JS: when novena is actively tracked, the progress label ("Day X of Y") takes priority over seasonal labels. Seasonal labels only show when no novena is in progress. When idle, subtitle shows "Start a novena" instead of "Guided prayer tracking".
- **Deviations from spec:** Kept seasonal labels visible when there's no active tracking (they serve as useful prompts to start a novena).
- **Known issues:** None observed

---

## BT4-06 — Novena List Page Visual Hierarchy (IDEA-111)

**Priority:** P2 — Refinement
**Problem:** After the splash screen, the novena selection page is a flat alphabetical wall of `.novena-list-item` buttons. In-progress novenas have only a slightly different border color (`border-color:#1E6B4A`). There is no visual sorting — in-progress novenas sit in alphabetical order among idle ones.

**Dorothy:** Scrolls past her in-progress novena because it looks identical to the others.
**Paul:** A flat list of 9 novenas with identical cards feels like a prototype.
**Sarah:** Wants to resume her novena — can't find it without reading every title.

**Fix:**
- **File:** `src/novena.js` — `_renderSelect()` function (around line 190)
  - Sort novenas with in-progress items first, then alphabetical for the rest:
  ```javascript
  var sorted = _novenas.slice().sort(function(a, b) {
    var aActive = !!_getTracking(a.id);
    var bActive = !!_getTracking(b.id);
    if (aActive !== bActive) return aActive ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  ```
  - Add a section label above in-progress items: `<div class="novena-list-label">Continue Praying</div>` followed by the standard `Available Novenas` label for the rest.

- **File:** `css/app.css` line 2582-2584
  - **Before:**
  ```css
  .novena-list-item.active { border-color:#1E6B4A; }
  ```
  - **After:**
  ```css
  .novena-list-item.active { border-color:var(--color-sacred);border-left:3px solid var(--color-sacred);background:var(--color-surface-sacred, var(--color-sacred-pale)); }
  ```
  - Replace hardcoded `#1E6B4A` with `var(--color-sacred)` for token consistency.
  - Add `border-left:3px` accent and warm background to make in-progress items visually prominent.

- **File:** `css/app.css` — add truncation to `.novena-list-desc`:
  ```css
  .novena-list-desc { font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
  ```
  - Reduce from `text-base` to `text-sm` and clamp to 2 lines to reduce the wall-of-text effect.

**Dark mode:**
- `html[data-theme="dark"] .novena-list-item.active { background:rgba(184,150,63,0.08);border-color:var(--color-sacred); }`

**Test checklist:**
- [ ] In-progress novenas sort to top with "Continue Praying" label
- [ ] In-progress items have sacred left border + warm background
- [ ] Idle novenas listed under "Available Novenas" alphabetically
- [ ] Descriptions truncated at 2 lines
- [ ] Hardcoded #1E6B4A replaced with var(--color-sacred)
- [ ] Dark mode: warm tint visible on active items

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** src/novena.js lines 194-215 — sorted novenas with in-progress first + section labels; css/app.css line 2581 — sacred border-left+background on active items; line 2584 — description clamped to 2 lines; line 2650 — dark mode active item override
- **Approach:** Sorted _novenas array copy by active status then alphabetically. Added "Continue Praying" and "Available Novenas" section labels with transition detection. Replaced hardcoded #1E6B4A with var(--color-sacred). Added border-left:3px accent and color-mix background. Description font reduced to text-sm and clamped with -webkit-line-clamp:2.
- **Deviations from spec:** Used color-mix() for background tint instead of var(--color-surface-sacred) to avoid needing a new token.
- **Known issues:** None observed

---

## BT4-07 — Growing Faith Section Collapse Removal (IDEA-113)

**Priority:** P2 — Refinement
**Problem:** The "Grow in Faith" section (Zone 3) is wrapped in a `<details>` element (`#deeperZone`) making the entire section collapsible. When collapsed, users see only "Grow in Faith" and a chevron — zero indication of what's inside. The collapsed state provides no value and the section looks broken. Individual guide items inside already have their own open/close behavior.

**Dorothy:** Accidentally collapses the section and thinks the guides disappeared.
**Paul:** Collapsed state with just a header and chevron looks like a loading skeleton.
**Sarah:** Never discovers the faith guides exist if the section starts collapsed.

**Fix:**
- **File:** `index.html` lines 154-162
  - **Before:**
  ```html
  <details class="more-zone more-zone--deeper" id="deeperZone">
    <summary class="more-zone-deeper-toggle">
      <h2 class="more-section-title more-section-title--deeper">Grow in Faith</h2>
      <span class="more-zone-deeper-count" id="deeperCount"></span>
      <svg class="more-zone-deeper-chevron" ...></svg>
    </summary>
    <div class="more-zone-deeper-body" id="devotionalCards"></div>
  </details>
  ```
  - **After:**
  ```html
  <div class="more-zone more-zone--deeper" id="deeperZone">
    <div class="more-zone-deeper-header">
      <h2 class="more-section-title more-section-title--deeper">Grow in Faith</h2>
      <span class="more-zone-deeper-count" id="deeperCount"></span>
    </div>
    <div class="more-zone-deeper-body" id="devotionalCards"></div>
  </div>
  ```
  - Remove `<details>/<summary>`, remove chevron SVG. Section is always visible.

- **File:** `src/more.js` lines 1064-1075
  - Remove the `deeperZone` toggle listener and localStorage open/close memory. The `deeperCount` badge (MTR-07) can stay — it's still useful as a content signal in the always-visible header.

- **File:** `css/app.css`
  - Remove `.more-zone--deeper[open] .more-zone-deeper-chevron` rule (line 1517)
  - Remove `.more-zone-deeper-toggle` cursor/summary styles
  - The `.more-zone--deeper` background and `.more-zone-deeper-body` styles remain unchanged.

**Dark mode:** No additional changes — inherits zone styling.

**Test checklist:**
- [ ] Section is always visible — no collapse/expand behavior
- [ ] Chevron SVG removed
- [ ] Guide count badge still renders
- [ ] Individual guide items still have their own open/close
- [ ] localStorage `mf-deeper-open` key can be ignored (no need to clean up — harmless orphan)
- [ ] Zone seam above section still renders

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** index.html lines 154-161 — replaced details/summary with div/div; src/more.js lines 1064-1075 — removed toggle listener and localStorage logic, kept MTR-07 count badge; css/app.css lines 1511-1516 — replaced toggle/chevron styles with header styles
- **Approach:** Converted details/summary to plain divs. Removed chevron SVG. Removed toggle event listener and localStorage mf-deeper-open logic. Kept the count badge (MTR-07) rendering. Replaced .more-zone-deeper-toggle CSS with .more-zone-deeper-header (same flexbox layout minus cursor:pointer and list-style).
- **Deviations from spec:** None
- **Known issues:** None observed

---

## BT4-08 — Sacred Font Token Consistency (IDEA-115)

**Priority:** P2 — Refinement
**Problem:** Several surfaces rendering prayer content use hardcoded `Georgia, 'Playfair Display', serif` instead of `var(--font-prayer)`. Additionally, `.devot-body` (faith guide expanded content) uses no explicit font-family — it inherits `--font-body` (Source Sans) even when the content is prayer text (e.g., the Act of Contrition in the confession guide, prayer text in the Holy Days guide).

**Dorothy:** The font inconsistency doesn't register consciously, but the prayer text in a faith guide feels "different" from the same prayer in the rosary — subtle trust erosion.
**Paul:** Notices the font mismatch between prayer contexts — perceives it as inconsistent design.
**Sarah:** Unaffected unless reading closely.

**Fix:**

**A. Token replacement — hardcoded Georgia stacks → var(--font-prayer)**
- **File:** `css/app.css` — 10 rules in the novena section using `Georgia,'Playfair Display',serif`
  - Lines: 2604 (`.novena-intention`), 2607 (`.novena-day-meditation p`), 2610 (`.novena-day-prayer p`), 2614 (`.novena-day-response p`), 2617 (`.novena-day-closing p`), 2638 (`.novena-complete-quote`), 2640 (`.novena-complete-msg`)
  - Replace all with: `font-family:var(--font-prayer);`

**B. Add --font-prayer to faith guide prayer paragraphs**
- **File:** `css/app.css` — add a new rule after `.devot-body` (line 1900):
```css
.devot-body .prayer-text { font-family:var(--font-prayer);font-style:italic;line-height:1.8; }
```
- **File:** `src/devotions.js` (or wherever guide HTML is generated) — wrap actual prayer text paragraphs in `<span class="prayer-text">` or `<p class="prayer-text">` when the content is known to be prayer text. This requires a data-level annotation (`"type": "prayer"` in the guide content) or a CSS-only approach using the existing structure.
- **CSS-only alternative:** If all prayer text in guides is rendered inside `<blockquote>` or a specific container, target that:
```css
.devot-body blockquote { font-family:var(--font-prayer);font-style:italic;line-height:1.8; }
```

**Dark mode:** No additional changes — font-family is theme-agnostic.

**Test checklist:**
- [ ] Novena prayer text uses `var(--font-prayer)` — visually identical but now token-consistent
- [ ] Faith guide prayer paragraphs (Act of Contrition, etc.) render in Georgia
- [ ] Non-prayer instructional text in guides remains in Source Sans
- [ ] No font FOUT or fallback flash on any surface

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** css/app.css — replaced 7 hardcoded Georgia,'Playfair Display',serif stacks with var(--font-prayer) in novena section; added .devot-body blockquote rule after line 1907
- **Approach:** Used replace_all to swap all Georgia font stack occurrences in CSS with var(--font-prayer). Added a new rule for .devot-body blockquote to apply --font-prayer with italic style and 1.8 line-height, targeting prayer text in faith guide expanded content.
- **Deviations from spec:** Used CSS-only blockquote approach rather than data-level annotation, which is simpler and covers existing prayer content without requiring devotions.js changes.
- **Known issues:** None observed

---

## BT4-09 — Text Size Granularity (IDEA-117)

**Priority:** P2 — Refinement
**Problem:** The text size control offers only 3 levels: small (16px), default (17px), large (19px). The gap between default and large is only 2px — Dorothy at 72 may need significantly larger text. The reader-specific +2px boost (PHF-02c) only fires at the current "large" setting. Adding more granularity must preserve this accessibility behavior.

**Dorothy:** Needs 22-24px prayer text. Current max is 19px + 2px reader boost = 21px. Not enough for arm's-length reading.
**Paul:** Happy at default or small — unaffected.
**Sarah:** Occasionally bumps to large for quick glances — would benefit from a mid-step.

**Fix:**
- **File:** `css/app.css` lines 368-369
  - **Before:**
  ```css
  [data-text-size="small"] { font-size:16px; }
  [data-text-size="large"] { font-size:19px; }
  ```
  - **After:**
  ```css
  [data-text-size="small"] { font-size:15px; }
  [data-text-size="large"] { font-size:19px; }
  [data-text-size="x-large"] { font-size:22px; }
  ```
  - Default remains 17px (`:root` font-size). Add `x-large` at 22px for Dorothy.

- **File:** `css/app.css` — extend PHF-02c reader boost to x-large:
  ```css
  [data-text-size="large"] .reader-body .rosary-prayer-text,
  [data-text-size="large"] .reader-body .chaplet-prayer-text,
  [data-text-size="large"] .reader-body .stations-meditation-text,
  [data-text-size="large"] .reader-body .stations-prayer-text,
  [data-text-size="x-large"] .reader-body .rosary-prayer-text,
  [data-text-size="x-large"] .reader-body .chaplet-prayer-text,
  [data-text-size="x-large"] .reader-body .stations-meditation-text,
  [data-text-size="x-large"] .reader-body .stations-prayer-text { font-size:calc(var(--text-base) + 2px);line-height:1.9; }
  ```
  - Also extend the exam section body, mystery meditation, and mystery title boosts.

- **File:** `src/settings.js` — line 54-56
  - **Before:** 3 buttons (small, default, large)
  - **After:** 4 buttons (small, default, large, extra large)
  ```javascript
  + '<button class="settings-seg-btn settings-seg-sm' + (curSize === 'small' ? ' active' : '') + '" onclick="setSettingSize(\'small\')">A</button>'
  + '<button class="settings-seg-btn' + (curSize === 'default' ? ' active' : '') + '" onclick="setSettingSize(\'default\')">A</button>'
  + '<button class="settings-seg-btn settings-seg-lg' + (curSize === 'large' ? ' active' : '') + '" onclick="setSettingSize(\'large\')">A</button>'
  + '<button class="settings-seg-btn settings-seg-xl' + (curSize === 'x-large' ? ' active' : '') + '" onclick="setSettingSize(\'x-large\')">A</button>'
  ```

- **File:** `css/app.css` — add XL button size:
  ```css
  .settings-seg-xl { font-size:21px; }
  ```

- **File:** `src/app.js` line 323 — `setTextSize()` already handles arbitrary size strings. The index.html inline script (line 12) also handles any `data-text-size` value. No changes needed to core logic.

**Dark mode:** No additional changes.

**Test checklist:**
- [ ] 4 text size options visible in Settings: A (small) A (default) A (large) A (x-large)
- [ ] x-large sets root to 22px
- [ ] Reader boost (+2px) applies at both large and x-large
- [ ] Exam section body boost applies at both large and x-large
- [ ] Layout doesn't break at 22px root (check chip bar, cards, detail panel, nav bar)
- [ ] Setting persists via localStorage across app restarts
- [ ] Active button indicator correct for all 4 states

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:** css/app.css line 367 — changed small from 16px to 15px, added x-large at 22px; lines 2113-2119 — extended PHF-02c reader boost selectors to include x-large; line 3234 — added .settings-seg-xl style; src/settings.js line 57 — added 4th button for x-large
- **Approach:** Added [data-text-size="x-large"] { font-size:22px } rule. Duplicated all PHF-02c reader boost selectors (rosary-prayer-text, chaplet-prayer-text, stations text, mystery meditation/title, exam-section-body) to also fire at x-large. Added 4th settings button with settings-seg-xl class (21px font-size). setSettingSize() already handles arbitrary size strings, so no core logic changes needed.
- **Deviations from spec:** None
- **Known issues:** None observed. Layout should be regression-tested at 22px root on all views.

---

## Cascading Impact Notes

| Change | Modules affected |
|--------|-----------------|
| BT4-01 (exam overflow) | examination.js, app.css — isolated to `.exam-opening` |
| BT4-02 (prayer book render) | prayerbook.js — render path only |
| BT4-03 (chip animation) | app.css — SLV-01 fallback selector. Verify saint-card and formation-card still transition. |
| BT4-04 (chaplet fade) | chaplet.js — `_transitionTo()` and `_renderDecade()`. Rosary uses separate crossfade — unaffected. |
| BT4-05 (practice tiles) | more.js (subtitle text), app.css (border/bg). Touch targets unchanged (already 48px min-height). |
| BT4-06 (novena list) | novena.js (sorting), app.css (active state). Master progress card above list unchanged. |
| BT4-07 (zone 3 collapse) | index.html, more.js, app.css. Zone seam, zone 1, zone 2 unaffected. |
| BT4-08 (sacred font) | app.css token replacements — visual-only, no layout shifts. |
| BT4-09 (text size) | settings.js, app.css. Must regression-test all views at 22px root. |

---

## Implementation Order

1. **BT4-01** (exam overflow) — CSS-only, zero risk
2. **BT4-03** (chip animation) — CSS-only, removes one selector
3. **BT4-08** (sacred font) — CSS-only token swap
4. **BT4-07** (zone 3 collapse) — HTML + JS removal
5. **BT4-05** (practice tiles) — CSS + minor JS
6. **BT4-06** (novena list) — JS sort + CSS
7. **BT4-09** (text size) — CSS + settings JS
8. **BT4-02** (prayer book render) — JS logic fix
9. **BT4-04** (chaplet fade) — JS logic, most complex
