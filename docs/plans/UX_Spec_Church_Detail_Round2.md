# MassFinder — UX Spec: Church Detail Panel Round 2

**Spec prefix:** CD2 (Church Detail 2)
**Created:** 2026-03-13
**Status:** Implemented
**Backlog items addressed:** IDEA-012, IDEA-013, IDEA-014, IDEA-015, IDEA-016

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| CD2-01 | Hero Banner: Merge Same-Day Services | P2 | Done |
| CD2-02 | Inline Schedule Badges: Padding & Touch Targets | P2 | Done |
| CD2-03 | Inline Times: Badge Density Threshold | P2 | Done |
| CD2-04 | Community Life: Collapsible Section | P2 | Done |
| CD2-05 | Footer Metadata: Structured Layout | P3 | Done |

---

## CD2-01 — Hero Banner: Merge Same-Day Services

**Backlog ref:** IDEA-012
**Severity:** Refinement
**Files:** `src/render.js` (lines 470–497), `src/utils.js` (lines 127–175), `css/app.css` (lines 596–607)

### Problem

The detail panel renders a single "Next Service" hero card via `getNext()`, which returns exactly one result (the absolute soonest service). If a church has Confession at 3:00 PM tomorrow and Mass at 4:00 PM tomorrow, the hero shows only the Confession. Mass appears separately in the "Coming Up" section below. Since neither is today, they should be consolidated into a single "Tomorrow" hero block showing both services — this is what the user actually wants: "When should I go to this church next?"

### User stories

- **72-year-old:** Sees a hero card for "Confession · Tomorrow · 3:00 PM." Scrolls down to find Mass at 4:00 PM in a different visual treatment. Doesn't realize they're related. May only plan for Confession and miss Mass.
- **25-year-old:** Two separate UI elements for the same day feels like poor design. Expects a single "Tomorrow" card.
- **45-year-old parent:** Planning a Saturday trip. Wants to see "Confession 3:00, Mass 4:00" as one actionable block to plan their drive.

### Spec

**Rule:** When the next service hero is for tomorrow (or any future day), gather all services on that same day from the Coming Up candidates and display them together in the hero block.

1. **In `src/render.js` after the `nextSvc` calculation (~line 470–497):** After building `nextHtml` for the single hero service, check if `nextSvc.dayLabel` is NOT "Today". If so, query the Coming Up candidates for all services on the same `daysUntil` value and build a multi-row hero.

   **After the existing `nextHtml` block, add logic:**
   ```javascript
   // CD2-01: Merge same-day future services into hero
   if (nextSvc && nextSvc.dayLabel !== 'Today') {
     var heroDay = nextSvc.dayLabel; // "Tomorrow", "Saturday", etc.
     // Collect additional services on the same day from Coming Up candidates
     var comingUpCands = _getComingUp(c, nextSvc); // reuse the existing Coming Up logic
     var sameDaySvcs = comingUpCands.filter(function(r) {
       return r.daysUntil === nextSvc._daysUntil;
     });
     if (sameDaySvcs.length > 0) {
       // Build multi-row hero
       var multiHtml = '<div class="detail-next detail-next--tomorrow">';
       multiHtml += '<div class="detail-next-day-header">' + heroDay + '</div>';
       // Primary service (the hero)
       multiHtml += '<div class="detail-next-multi-row">';
       multiHtml += '<span class="detail-next-time">' + nextSvc.timeFormatted + '</span>';
       multiHtml += '<span class="detail-next-label">' + utils.esc(config.SVC_LABELS[nextSvc.service.type] || '') + '</span>';
       multiHtml += '</div>';
       // Additional same-day services
       for (var msi = 0; msi < sameDaySvcs.length; msi++) {
         multiHtml += '<div class="detail-next-multi-row">';
         multiHtml += '<span class="detail-next-time">' + utils.fmt12(sameDaySvcs[msi].service.time) + '</span>';
         multiHtml += '<span class="detail-next-label">' + utils.esc(config.SVC_LABELS[sameDaySvcs[msi].service.type] || '') + '</span>';
         multiHtml += '</div>';
       }
       multiHtml += '</div>';
       nextHtml = multiHtml;
     }
   }
   ```

   **Note:** The implementer needs to thread `daysUntil` through the `getNext()` return value (as `_daysUntil`) so the hero logic knows which day index to match. Currently `getNext()` does not expose `daysUntil` — add it to the return object at line ~168 of `utils.js`.

2. **Exclude merged services from Coming Up.** Any services that were absorbed into the multi-row hero should be filtered out of the Coming Up section so they don't appear twice. The existing `nextSvcKey` dedup logic (line 384 render.js) handles the primary hero service — extend it to also skip the additional same-day services.

3. **CSS for multi-row hero:**
   ```css
   .detail-next-day-header {
     font-size: var(--text-xs);
     font-weight: var(--weight-semibold);
     color: var(--color-text-tertiary);
     text-transform: uppercase;
     letter-spacing: 0.06em;
     margin-bottom: var(--space-2);
     width: 100%;
   }
   .detail-next-multi-row {
     display: flex;
     align-items: center;
     gap: var(--space-3);
     padding: var(--space-1) 0;
   }
   .detail-next-multi-row + .detail-next-multi-row {
     border-top: 1px solid var(--color-border-light);
   }
   .detail-next-multi-row .detail-next-time {
     font-size: var(--text-lg);
     min-width: 80px;
   }
   .detail-next-multi-row .detail-next-label {
     font-size: var(--text-sm);
   }
   ```

4. **Dark mode:** The multi-row hero inherits `.detail-next--tomorrow` background which already has dark mode overrides (line 635). Add border-top color override:
   ```css
   html[data-theme="dark"] .detail-next-multi-row + .detail-next-multi-row {
     border-top-color: var(--color-border);
   }
   ```

5. **When hero IS today:** Do NOT merge. Today's hero should remain a single prominent card for the very next service. The urgency of "Happening now" or "Starting soon" is specific to one service.

### Cascading impacts

- `utils.js` `getNext()` return value needs `_daysUntil` added (non-breaking addition).
- The Coming Up dedup logic (render.js line 384) needs to handle multiple excluded keys.
- No impact on Saved tab — it uses its own `_renderSchedRow()` pattern.

### Test checklist

- [ ] Church with Mass tomorrow + Confession tomorrow: single merged hero with both times
- [ ] Church with only Mass tomorrow: single-row hero (existing behavior)
- [ ] Church with live/soon service today: single hero, no merging (today behavior unchanged)
- [ ] Merged services do NOT also appear in Coming Up section
- [ ] Multi-row hero: times left-aligned, types right of times
- [ ] Dark mode: background gradient, border colors correct
- [ ] Church with 3+ services on the same future day: all appear in merged hero
- [ ] Hero click/tap behavior: not interactive (existing behavior — hero is informational)

---

## CD2-02 — Inline Schedule Badges: Padding & Touch Targets

**Backlog ref:** IDEA-013
**Severity:** Bug (visual)
**Files:** `css/app.css` (lines 870–874, 910–911)

### Problem

Inline schedule badges (`.schedule-lang-badge`, `.schedule-season-badge`, `.schedule-vigil-badge`) have minimal padding — the language badge uses `padding: 1px 6px` (line 870) and the season badge uses `padding: 1px 7px` (line 871). These are visually cramped and feel unpolished. While these badges are informational (not directly tappable), they sit adjacent to tappable time elements and contribute to a visually tight, cluttered feel.

### User stories

- **72-year-old:** Sees "TLM" or "Spanish" as a tiny, cramped pill next to a time. Hard to read at small size with tight padding.
- **25-year-old:** The cramped padding looks like a rendering bug, not an intentional design choice. Expects the badge polish of iOS system badges.
- **45-year-old parent:** Scanning for the Spanish Mass time. The badge is so small it doesn't register visually — it blends into the time text.

### Spec

1. **Increase padding on all three badge types:**

   **`.schedule-lang-badge` (line 870):**
   ```css
   /* Before */
   padding: 1px 6px;
   /* After */
   padding: 2px 8px;
   ```

   **`.schedule-season-badge` (line 871):**
   ```css
   /* Before */
   padding: 1px 7px;
   /* After */
   padding: 2px 8px;
   ```

   **`.schedule-vigil-badge` (line 910) — already `padding: 2px 8px`:** No change needed.

2. **Increase font size from 11px/12px to `var(--text-xs)` (13px):**

   **`.schedule-lang-badge` (line 870):**
   ```css
   /* Before */
   font-size: 11px;
   /* After */
   font-size: var(--text-xs);
   ```

   **`.schedule-season-badge` (line 871):**
   ```css
   /* Before */
   font-size: 11px;
   /* After */
   font-size: var(--text-xs);
   ```

3. **Add `min-height: 22px` and `line-height: 1` to all three badge types** for consistent vertical sizing:
   ```css
   .schedule-lang-badge, .schedule-season-badge, .schedule-vigil-badge {
     min-height: 22px;
     line-height: 1;
   }
   ```

### Dark mode

Existing dark mode overrides for `.schedule-lang-badge` (line 161) and `.schedule-season-badge` (line 162) only change colors, not spacing. No new dark mode rules needed.

### Cascading impacts

- The inline schedule display (`.schedule-inline`) uses `flex-wrap: wrap` (line 899), so slightly larger badges will wrap gracefully on narrow viewports.
- The badges appear in the detail panel schedule accordions (render.js `_renderInline()`) and nowhere else.
- The vigil badge (line 910) already has the target padding — this change brings lang and season badges into alignment.

### Test checklist

- [ ] Language badge ("Spanish", "TLM"): visibly larger, comfortable to read
- [ ] Season badge ("Lent", "Summer", "Academic Year"): same treatment
- [ ] Vigil badge: unchanged (already correct)
- [ ] Inline layout doesn't break: badges wrap correctly when row is narrow
- [ ] Font size consistent across all three badge types (all `--text-xs`)
- [ ] Dark mode: badge colors still correct
- [ ] Large screen: badges don't appear oversized

---

## CD2-03 — Inline Times: Badge Density Threshold

**Backlog ref:** IDEA-014
**Severity:** Refinement
**Files:** `src/render.js` (lines 1163–1177 `_canRenderInline()`)

### Problem

The inline rendering ("8:30 · 10:00 · 11:30 AM") is excellent for simple time lists. But `_canRenderInline()` currently only checks for end_time, recurrence, times_vary, notes, and multi-location — it does NOT check for badge-producing attributes (language, rite, seasonal). When 3+ times each have badges (e.g., "8:30 Spanish · 10:00 TLM · 11:30 Lent"), the inline layout becomes a dense, hard-to-scan horizontal strip.

### User stories

- **72-year-old:** Sees "8:30 Spanish · 10:00 TLM · 11:30 Lent" as a single wrapped line. Can't distinguish which badge belongs to which time. Confusing.
- **25-year-old:** The horizontal layout with interleaved badges feels cluttered. Expects stacked rows when metadata is present.
- **45-year-old parent:** Scanning quickly — the inline format with badges requires more cognitive parsing than a vertical list.

### Spec

**Add a badge-density check to `_canRenderInline()`:** If more than half the services in the group have a badge-producing attribute (language !== 'en', rite === 'tridentine', or seasonal), fall back to row rendering.

**In `src/render.js` `_canRenderInline()` (~line 1163), add after the existing checks:**

```javascript
function _canRenderInline(rows) {
  if (rows.length < 2) return false;
  var badgeCount = 0; // CD2-03: badge density threshold
  for (var ci = 0; ci < rows.length; ci++) {
    var s = rows[ci];
    if (s.end_time || s.recurrence || s.times_vary) return false;
    if (utils.cleanNote(s)) return false;
    if (s._mergedNotes && s._mergedNotes.length) return false;
    if (ml && s.location_id) return false;
    // CD2-03: Count badge-producing attributes
    if ((s.language && s.language !== 'en') || s.rite === 'tridentine' || s.seasonal) {
      badgeCount++;
    }
  }
  // CD2-03: Fall back to rows if majority have badges
  if (badgeCount > rows.length / 2) return false;
  return true;
}
```

### Dark mode

No dark mode changes — this is a rendering logic change, not a visual one.

### Cascading impacts

- When `_canRenderInline()` returns false, `_renderRowsWithDivider()` renders individual rows with the AM/PM divider pattern — this already handles badges correctly in row format.
- Parishes with all-English, no-seasonal services are unaffected (most common case).
- Parishes that happen to have exactly one badged service among many will still render inline (threshold is majority, not any).

### Test checklist

- [ ] Parish with 4 simple English masses: renders inline (no change)
- [ ] Parish with 3 masses, 2 Spanish: renders as rows (majority have badges)
- [ ] Parish with 4 masses, 1 TLM: renders inline (1/4 < majority)
- [ ] Parish with 2 Lenten-only services: renders as rows (2/2 = majority)
- [ ] Row rendering: badges display correctly in individual rows with proper spacing
- [ ] No impact on parishes with notes, end times, multi-location (already forced to rows)

---

## CD2-04 — Community Life: Collapsible Section

**Backlog ref:** IDEA-015
**Severity:** Refinement
**Files:** `src/events.js` (lines 186–207), `css/app.css` (lines 747–751)

### Problem

The Community Life section in the church detail panel is always expanded. For parishes with many community events (5+), this pushes the Verify Prompt and footer metadata below the fold. The primary content of the detail panel — mass schedule, sacraments, adoration — lives in collapsible accordions, but community events do not follow this pattern.

### User stories

- **72-year-old:** Opened the detail panel to check Mass times. Scrolls past 8 community events to find the verification prompt. May give up scrolling.
- **25-year-old:** The detail panel feels long and overwhelming for busy parishes. Expects progressive disclosure.
- **45-year-old parent:** Came to check Confession times. Community events are interesting but not urgent — they should be available without dominating the view.

### Spec

1. **Wrap the community events section in a `<details>` element.** Convert the existing `.community-events-section` from an always-open div to a collapsible details/summary pattern matching the existing accordion UX.

   **In `src/events.js` (~line 186), change the section structure:**

   **Before:**
   ```javascript
   var html = '<div class="community-events-section">'
     + '<div class="community-events-header">'
     + '...'
     + '</div>';
   ```

   **After:**
   ```javascript
   var html = '<details class="community-events-section community-events-collapsible">'
     + '<summary class="community-events-header">'
     + '...'
     + '</summary>';
   ```

   And change the closing tag (~line 206):
   **Before:** `html += '</div>';`
   **After:** `html += '</details>';`

2. **Add a chevron to the header** matching the accordion pattern. Insert before the closing `</summary>`:
   ```javascript
   + '<svg class="community-events-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
   ```

3. **CSS for the collapsible behavior:**
   ```css
   .community-events-collapsible summary {
     cursor: pointer;
     list-style: none;
   }
   .community-events-collapsible summary::-webkit-details-marker {
     display: none;
   }
   .community-events-chevron {
     width: 18px;
     height: 18px;
     color: var(--color-text-tertiary);
     transition: transform 0.2s;
     flex-shrink: 0;
     margin-left: auto;
   }
   .community-events-collapsible[open] .community-events-chevron {
     transform: rotate(180deg);
   }
   ```

4. **Default state:** Collapsed. If the parish has 2 or fewer events, render with `open` attribute by default:
   ```javascript
   var openAttr = total <= 2 ? ' open' : '';
   var html = '<details class="community-events-section community-events-collapsible"' + openAttr + '>';
   ```

5. **Existing header styles** (`.community-events-header` at line 748) already use `display: flex; align-items: center; gap: var(--space-3)` — the chevron will align naturally at the right edge via `margin-left: auto`.

### Dark mode

No new dark mode rules needed — the chevron uses `--color-text-tertiary` which already has dark mode overrides. The section border and background inherit from existing dark mode rules.

### Cascading impacts

- The Community Life section is rendered by `events.renderCommunityEvents()` and injected into the detail panel HTML in `render.js` line 721. No change needed in render.js — the returned HTML is inserted as-is.
- Event click handlers (`onclick="openEventDetail(...)"``) inside the section still work inside `<details>` — no event delegation changes needed.
- The count badge (`.community-events-count`) is already in the header, so users can see "Community Life (5)" even when collapsed.

### Test checklist

- [ ] Parish with 5+ events: section starts collapsed, shows header with count
- [ ] Tap header: section expands with chevron rotation
- [ ] Tap again: section collapses
- [ ] Parish with 1–2 events: section starts expanded (open attribute)
- [ ] Event items inside section: still clickable, open event detail
- [ ] Chevron animation: smooth 0.2s rotation
- [ ] Dark mode: chevron color correct
- [ ] No impact on parishes with 0 events (section not rendered)
- [ ] Scroll position: collapsing the section doesn't cause jarring scroll jumps

---

## CD2-05 — Footer Metadata: Structured Layout

**Backlog ref:** IDEA-016
**Severity:** Refinement
**Files:** `src/render.js` (lines 749–759), `css/app.css` (lines 939–943)

### Problem

The detail panel footer concatenates all metadata (county, established date, last-checked date, bulletin date, source) into a single middle-dot-separated string inside `.detail-verified-footer`. When a parish has all fields populated, this produces a long wrapping string like "Hampden County · Est. 1872 · Checked 3 weeks ago · March bulletin · Source: bulletin" that's hard to scan.

### User stories

- **72-year-old:** Can't distinguish individual metadata items in the long string. Each datum has equal visual weight — nothing stands out.
- **25-year-old:** Expects structured metadata, not a sentence-like concatenation. Thinks of it like the footer of an Apple Maps listing.
- **45-year-old parent:** Wants to quickly check when the data was last verified. Has to read through the entire string to find "Checked 3 weeks ago."

### Spec

1. **Replace the dot-separated string with a CSS grid layout.** Each metadata item gets its own row with a label and value.

   **In `src/render.js` (~lines 749–759), replace the footer construction:**

   **Before:**
   ```javascript
   var footerParts = [];
   if (c.county) footerParts.push(utils.esc(c.county) + ' County');
   if (c.established) footerParts.push('Est. ' + utils.esc(c.established));
   // ... etc
   var footer = '<div class="detail-footer-row">';
   if (footerParts.length) footer += '<div class="detail-verified-footer">' + footerParts.join(' \u00b7 ') + '</div>';
   ```

   **After:**
   ```javascript
   var footerItems = [];
   if (c.county) footerItems.push({ label: 'County', value: utils.esc(c.county) });
   if (c.established) footerItems.push({ label: 'Established', value: utils.esc(c.established) });
   if (v.last_checked) footerItems.push({ label: 'Last checked', value: utils.fmtRelDate(v.last_checked) });
   if (v.bulletin_date) footerItems.push({ label: 'Bulletin', value: utils.fmtMonth(v.bulletin_date) });
   if (v.source) footerItems.push({ label: 'Source', value: utils.esc(v.source) });

   var footer = '<div class="detail-footer-row">';
   if (footerItems.length) {
     footer += '<div class="detail-footer-meta">';
     for (var fi = 0; fi < footerItems.length; fi++) {
       footer += '<div class="detail-footer-meta-item">'
         + '<span class="detail-footer-meta-label">' + footerItems[fi].label + '</span>'
         + '<span class="detail-footer-meta-value">' + footerItems[fi].value + '</span>'
         + '</div>';
     }
     footer += '</div>';
   }
   ```

2. **CSS for the structured footer:**
   ```css
   .detail-footer-meta {
     display: grid;
     grid-template-columns: auto 1fr;
     gap: var(--space-1) var(--space-3);
     font-size: var(--text-xs);
     color: var(--color-text-tertiary);
   }
   .detail-footer-meta-label {
     font-weight: var(--weight-medium);
     color: var(--color-text-secondary);
     white-space: nowrap;
   }
   .detail-footer-meta-value {
     color: var(--color-text-tertiary);
   }
   ```

3. **Remove or repurpose `.detail-verified-footer`.** The old class is no longer used — remove it from CSS if no other elements reference it. Check for any other uses first.

### Dark mode

The new classes use `--color-text-secondary` and `--color-text-tertiary` which already have dark mode overrides. No new dark mode rules needed.

### Cascading impacts

- The `.detail-footer-row` container (line 939) is kept — it still provides the `margin-top`, `padding-top`, and `border-top` separator. Only the inner content changes.
- The footer action buttons (`.detail-footer-actions` at line 940) are unaffected — they sit after `.detail-footer-row` in the detail panel HTML.
- QR code button placeholder (currently disabled) is inside the footer row — verify it's not disrupted by the grid change.

### Test checklist

- [ ] Parish with all metadata fields: grid renders cleanly with label-value pairs
- [ ] Parish with only county: single row, no empty grid cells
- [ ] Parish with no metadata: footer section not rendered (existing guard)
- [ ] Label column: consistent width, right-aligned text (or left — verify what reads better)
- [ ] Value column: wraps gracefully for long source URLs
- [ ] Dark mode: label and value colors correct
- [ ] Desktop: grid doesn't stretch too wide (constrained by `--max-width`)
- [ ] Mobile: grid fits within detail panel padding

---

## CD2-02 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — `.schedule-lang-badge` font-size 11px → var(--text-xs), padding 1px 6px → 2px 8px; `.schedule-season-badge` same changes; added shared min-height:22px + line-height:1 rule for all three badge types
- **Approach:** Pure CSS change. Increased font size to the design token `--text-xs` (13px) and padded badges uniformly to 2px 8px, matching the vigil badge which already had the target padding. Added a shared rule for min-height and line-height consistency across all three badge types.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## CD2-03 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — added `badgeCount` variable and badge-density threshold in `_canRenderInline()`
- **Approach:** Counts services with badge-producing attributes (non-English language, tridentine rite, or seasonal). If more than half the services in a group have badges, falls back to row rendering via `_renderRowsWithDivider()`. Simple threshold check after the existing loop.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## CD2-04 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/events.js` — changed `renderCommunityEvents()` from div to details/summary pattern with chevron SVG; `css/app.css` — added collapsible summary styles, chevron rotation animation
- **Approach:** Converted outer `<div>` to `<details>` and header `<div>` to `<summary>`. Added SVG chevron with margin-left:auto for right-alignment. Default collapsed for 3+ events, open for 1-2. CSS hides default marker and adds 0.2s rotation transition on the chevron.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## CD2-05 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — replaced `footerParts` dot-separated string with `footerItems` array of label/value objects rendered as grid items; `css/app.css` — removed `.detail-verified-footer`, added `.detail-footer-meta` grid layout with `display:contents` pattern
- **Approach:** Each metadata field (county, established, last checked, bulletin, source) is now a label-value pair in a CSS grid with `grid-template-columns: auto 1fr`. The `display:contents` trick on each item makes label and value participate directly in the parent grid for clean two-column alignment. Labels use secondary text color with medium weight; values use tertiary.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## CD2-01 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/utils.js` — added `_daysUntil` to `getNext()` return object; `src/render.js` — added same-day service merge logic after hero construction, updated `_getComingUp()` to accept and filter `mergedKeys`; `css/app.css` — added `.detail-next-day-header`, `.detail-next-multi-row` styles with dark mode border override
- **Approach:** After building the single-service hero, if the hero is NOT for today (i.e., tomorrow or later), scans all non-seasonal services for the same `daysUntil` value. If matches are found, builds a multi-row hero with a day header ("Tomorrow", "Saturday", etc.) and individual time+type rows. Merged service keys are tracked and passed to `_getComingUp()` which filters them out of Coming Up to prevent duplication. The `_daysUntil` field was added to `getNext()`'s return object to enable day-matching.
- **Deviations from spec:** None.
- **Known issues:** The merge only applies when the hero is for a future day (not today). Coming Up only shows today+tomorrow candidates, so merges for day 2+ won't create dedup issues there.
