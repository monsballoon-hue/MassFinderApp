# Claude Code Implementation Prompt — CD2 Series

**Spec:** `docs/plans/UX_Spec_Church_Detail_Round2.md`
**Prefix:** CD2

---

## Instructions

Implement the CD2 spec series in priority order. Read the full spec before starting. Each item has exact file paths, before/after descriptions, and test checklists.

**Priority order:** CD2-02 → CD2-03 → CD2-04 → CD2-05 → CD2-01

CD2-01 (hero merging) is listed last because it has the most complexity and the highest risk of regressions. Do the simpler items first.

**Rules:**
- Use only CSS custom properties (tokens) from `:root` — never hardcode colors except in `color-mix()` fallbacks
- SVG only — no emoji, no Unicode decorative characters
- All new elements need `html[data-theme="dark"]` overrides
- Touch targets ≥ 44×44pt on all interactive elements
- `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair) for headings, `--font-body` (Source Sans) for UI
- CommonJS everywhere, no arrow functions
- Test each item against its checklist before moving to the next

---

## CD2-02 — Inline Schedule Badge Padding (P2)

**Files:** `css/app.css` (lines 870–874, 910–911)

1. Update `.schedule-lang-badge` (line 870):
   - Change `font-size: 11px` to `font-size: var(--text-xs)`
   - Change `padding: 1px 6px` to `padding: 2px 8px`

2. Update `.schedule-season-badge` (line 871):
   - Change `font-size: 11px` to `font-size: var(--text-xs)`
   - Change `padding: 1px 7px` to `padding: 2px 8px`

3. Add shared sizing rule after the vigil badge:
   ```css
   .schedule-lang-badge, .schedule-season-badge, .schedule-vigil-badge { min-height:22px;line-height:1; }
   ```

**Verify:** Open a church detail with Spanish Mass, TLM, and Lenten services. Badges should look visually balanced with comfortable reading size. Check inline layout still wraps correctly on narrow viewports.

## CD2-03 — Inline Times Badge Density Threshold (P2)

**Files:** `src/render.js` (`_canRenderInline()` function, ~line 1163)

1. Add a `badgeCount` variable initialized to 0 at the start of the function.

2. Inside the existing `for` loop, after the existing checks, add:
   ```javascript
   if ((s.language && s.language !== 'en') || s.rite === 'tridentine' || s.seasonal) {
     badgeCount++;
   }
   ```

3. After the loop, before `return true;`, add:
   ```javascript
   if (badgeCount > rows.length / 2) return false;
   ```

**Verify:** Find a parish with multiple Spanish or TLM masses on the same day. They should render as rows, not inline. Regular English-only parishes should still render inline.

## CD2-04 — Community Life Collapsible (P2)

**Files:** `src/events.js` (lines 186–207), `css/app.css` (after line 751)

1. In `renderCommunityEvents()` (~line 186), change the opening HTML:
   - Replace `'<div class="community-events-section">'` with:
   ```javascript
   var openAttr = total <= 2 ? ' open' : '';
   '<details class="community-events-section community-events-collapsible"' + openAttr + '>'
   ```
   - Replace `'<div class="community-events-header">'` with `'<summary class="community-events-header">'`
   - Before the closing of the header element, add the chevron SVG:
   ```javascript
   + '<svg class="community-events-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
   ```
   - Replace `'</div>'` (header close) with `'</summary>'`

2. At the end of the function (~line 206), replace the final `'</div>'` with `'</details>'`.

3. Add CSS after line 751:
   ```css
   .community-events-collapsible summary { cursor:pointer;list-style:none; }
   .community-events-collapsible summary::-webkit-details-marker { display:none; }
   .community-events-chevron { width:18px;height:18px;color:var(--color-text-tertiary);transition:transform 0.2s;flex-shrink:0;margin-left:auto; }
   .community-events-collapsible[open] .community-events-chevron { transform:rotate(180deg); }
   ```

**Verify:** Open a church detail with 5+ community events — section should be collapsed by default, showing "Community Life (5)" with a chevron. Tap to expand/collapse. Church with 1–2 events should default open.

## CD2-05 — Footer Metadata Grid (P3)

**Files:** `src/render.js` (lines 749–759), `css/app.css` (lines 939–943)

1. In `render.js`, replace the footer metadata construction. Find the block that builds `footerParts` array and joins with `\u00b7`. Replace with:
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

2. Add CSS (replace or supplement the `.detail-verified-footer` rule at line 940):
   ```css
   .detail-footer-meta { display:grid;grid-template-columns:auto 1fr;gap:var(--space-1) var(--space-3);font-size:var(--text-xs);color:var(--color-text-tertiary); }
   .detail-footer-meta-item { display:contents; }
   .detail-footer-meta-label { font-weight:var(--weight-medium);color:var(--color-text-secondary);white-space:nowrap; }
   .detail-footer-meta-value { color:var(--color-text-tertiary); }
   ```

   Note: Using `display: contents` on `.detail-footer-meta-item` makes each item's label and value participate directly in the parent grid, creating a clean two-column layout.

3. Check if `.detail-verified-footer` class is used anywhere else (grep the codebase). If not, remove the old rule.

**Verify:** Open a church detail panel for a parish with county, established date, last-checked, and source fields. Should display as a clean two-column grid. Verify with a parish that has only 1–2 metadata fields.

## CD2-01 — Hero Banner Merge (P2, implement last)

**Files:** `src/utils.js` (line ~168), `src/render.js` (lines 470–497, 380–384)

This is the most complex item. Read the full spec carefully.

1. In `src/utils.js` `getNext()`, add `_daysUntil: best.daysUntil` to the return object (~line 168):
   ```javascript
   return {
     service: best.service,
     _daysUntil: best.daysUntil,
     dayLabel: ...
   ```

2. In `src/render.js`, after the existing `nextHtml` construction (~line 497), add the merge logic. The key steps:
   - Only merge when `nextSvc.dayLabel !== 'Today'`
   - Collect same-day candidates from the Coming Up data
   - Build a multi-row hero replacing the single-row hero
   - Track which services were merged so they're excluded from Coming Up

3. Update the Coming Up dedup (line 384) to skip all merged services, not just the primary hero service.

4. Add CSS for `.detail-next-day-header`, `.detail-next-multi-row` (see spec for exact values).

5. Add dark mode override for `.detail-next-multi-row + .detail-next-multi-row` border.

**Verify:** Find a church with both Confession and Mass on Saturday (tomorrow). Should show a single "Tomorrow" hero with both times. Verify neither appears in Coming Up. Check today's services still show single hero. Test church with 3+ services on the same future day.
