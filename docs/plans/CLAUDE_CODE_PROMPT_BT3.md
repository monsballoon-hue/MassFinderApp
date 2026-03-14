# Claude Code Prompt — BT3 Series (Backlog Triage Round 3)

**Spec:** `docs/plans/UX_Spec_Backlog_Triage_Round3.md`
**Items:** BT3-01 through BT3-28 (28 items, 26 unique — BT3-09/BT3-10 are traceability refs)

---

## Setup

```bash
git checkout main && git pull
git checkout -b ux/bt3-backlog-triage-round3
```

Read the spec: `cat docs/plans/UX_Spec_Backlog_Triage_Round3.md`

---

## Phase 1 — Critical Bugs & Accessibility (P1)

Implement these first. Each has exact before/after in the spec.

### BT3-02 — Exam Header Centering
File: `src/reader.js` → `_updateBackBtn` function
Change: Replace `btn.style.display = _stack.length ? '' : 'none'` with `btn.style.visibility = _stack.length ? 'visible' : 'hidden'`
Also: Remove any other `btn.style.display` assignments for the back button. The button must remain in flex flow for centering.

### BT3-03 — How-to-Confess Modal Overhaul (3 fixes)
1. **CSS** `css/app.css` ~line 2510: Change `.exam-howto-modal-inner` — remove `max-height:70vh`, `border-radius` to `0`, add `height:100%`, add safe-area padding
2. **JS** `src/examination.js` in `examShowHowTo`: Change inline `font-size:var(--text-sm)` to `font-size:var(--text-lg)` on the title span
3. **CSS** `css/app.css` ~line 2392: Change `.exam-howto-steps li` font-size from `var(--text-base)` to `var(--text-lg)`, line-height to `1.7`
4. **Data** `data/examination.json`: Change step 1 from `"Examine your conscience using the questions above."` to `"Examine your conscience using the questions in each section of this module."`

### BT3-04 — Exam Selection Feedback
1. **JS** `src/examination.js`: Add `var _shownLogHint = false;` to module state. In checkbox change handler (both `_wireCheckboxes` and the `_renderExamination` handler), after `_updateCheckedUI()`, add:
   ```javascript
   var count = Object.keys(_checked).length;
   if (count === 1 && !_shownLogHint) {
     _shownLogHint = true;
     var render = require('./render.js');
     render.showToast('Noted for your confession summary');
   }
   ```
   Reset `_shownLogHint = false;` in `onClose`.
2. **CSS** `css/app.css`: Restyle `.exam-nav-count--link` — `font-size:var(--text-sm)`, `font-weight:var(--weight-semibold)`, `color:var(--color-verified)`, `background:var(--color-verified-bg)`, `border-radius:var(--radius-full)`, `padding:var(--space-1) var(--space-3)`

### BT3-16 — Faith Guides Dark Mode
File: `css/app.css` ~line 1617
Change `.devot-card[open]` dark mode background gradient:
```css
html[data-theme="dark"] .devot-card[open] {
  background: linear-gradient(135deg, rgba(212,168,75,0.06) 0%, var(--color-surface) 40%);
  box-shadow: var(--shadow-card-hover);
  border-left-color: var(--color-accent);
}
```
Add explicit text color overrides for content inside open cards:
```css
html[data-theme="dark"] .devot-card[open] .conf-exam-body { color: var(--color-text-secondary); }
html[data-theme="dark"] .devot-card[open] .conf-exam-body p { color: var(--color-text-primary); }
```

### BT3-17 — Find Tab Sort Text Size
File: `css/app.css` lines 348, 350-352
- `.results-count`: `font-size: 11px` → `font-size: var(--text-sm)`
- `.results-sort`: `font-size: 11px` → `font-size: var(--text-sm)`, `min-height: 32px` → `min-height: 44px`, color to `var(--color-text-secondary)`
- `.results-sort svg`: `width: 14px; height: 14px` → `width: 16px; height: 16px`

### BT3-18 — Saved Tab Schedule Font Size
File: `css/app.css` lines 1281, 1283
- `.sched-time`: `font-size:var(--text-sm)` → `font-size:var(--text-base)`
- `.sched-type`: `font-size:var(--text-sm)` → `font-size:var(--text-base)`
- `.sched-church`: keep at `var(--text-sm)` (secondary info)

### BT3-20 — Chip Bar Swipe-to-Refresh Fix
File: `css/app.css` line 318
Add to `.chip-bar`: `overscroll-behavior: contain; touch-action: pan-x;`

### BT3-22 — Tab Bar Fixed Position Defense
File: `css/app.css` line 1030
Add to `.tab-bar`: `transform: translateZ(0); -webkit-transform: translateZ(0);`

### BT3-24 — CCC Pills in Faith Guides
File: `src/more.js` ~line 280
Verify the click handler has `ev.stopPropagation(); ev.preventDefault();`
File: `src/snippet.js` — verify `.devot-card` is in the click exclusion list (added in BT1-04). If missing, add it.

### BT3-26 — Map Chips to Bottom on Mobile
File: `css/app.css` line 1188
Add a media query for mobile:
```css
@media (max-width: 768px) {
  .map-chip-bar { top: auto; bottom: var(--space-3); }
  .map-chip-bar ~ .map-filter-pill { top: auto; bottom: calc(var(--space-3) + 44px); }
}
```

---

## Phase 2 — Refinements (P2)

### BT3-01 — Exam Subtitle Text
File: `src/more.js` ~line 200
Change: `'Prepare for Reconciliation'` → `'Prepare for confession'`

### BT3-05 — Remove "Prayers" Label
File: `src/examination.js`
Remove `html += '<div class="exam-group-label">Prayers</div>';` from both `_renderSummaryScreen` (~line 272) and `_renderExamination` (~line 238)

### BT3-06 — Thanksgiving Prayer Style
File: `src/examination.js` — in both `_renderSummaryScreen` and `_renderExamination`
Replace `html += _renderPrayer(d.prayers.thanksgiving);` with:
```javascript
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
Add CSS: `.exam-prayer-divider { width:60px;height:1px;background:var(--color-border-light);margin:0 auto; }`

### BT3-07 — Confession Tracker Refinement
1. `src/examination.js`: Change button text from `'I received the Sacrament of Reconciliation'` to `'I went to confession today'` (in both render functions)
2. `css/app.css`: Add `.exam-tracker-btn.confirmed { background:var(--color-verified);color:white;border-color:var(--color-verified);transform:scale(0.97); }`
3. `src/more.js` ~line 189: Update `confLabel` formatting to use friendlier phrasing (see spec)

### BT3-08 — Consolidate Exit Paths
File: `src/examination.js` — in `_renderSummaryScreen`
Remove the `<button class="exam-ending-btn">` from the ending section. Keep the cross icon and "Go in peace" text.

### BT3-11 — Remove Fasting Banner from More Tab
File: `index.html` line 121
Remove: `<div id="fastingBanner"></div>`

### BT3-12 — Remove Gospel Formatting
1. `src/readings.js` ~line 246-247: Remove gospel class logic, just use `var entryClass = 'reading-entry';`
2. `css/app.css` lines 1526-1529: Remove `.reading-entry--gospel` rules (4 lines)

### BT3-14 — Faith Guides: Remove Toggle and TLM
1. `src/more.js` ~line 247-260: Replace progressive disclosure logic with `devotEl.innerHTML = allGuideHtml.join('');` — remove overflow div and toggle button
2. `src/devotions.js` ~line 230-233: Remove the Traditional Latin Mass object from the DEVOTIONAL_GUIDES array
3. `src/more.js`: Remove `toggleDevotOverflow` function and its export
4. `src/app.js`: Remove `window.toggleDevotOverflow` binding if present

### BT3-21 — YC Card Design
File: `css/app.css` ~line 550
Change `.yc-card` background from gradient to `var(--color-surface)`, border-left from `4px` to `3px`
File: `css/app.css` ~line 142-143
Change dark `.yc-card` background from gradient to `var(--color-surface)`

### BT3-25 — Settings About Cleanup
File: `src/settings.js` ~lines 95-116
Replace entire About section with just GitHub link + data date (see spec for exact code)

### BT3-27 — External Links in Detail Panel
File: `src/render.js`
Search for bulletin and website `<a href=` links. Ensure all have `target="_blank" rel="noopener"`.

### BT3-28 — PWA Banner Session Guard
File: `src/app.js` — SW update handler
Add `sessionStorage` guard so the banner only shows once per session.

---

## Phase 3 — Enhancements (P3)

### BT3-13 — Novena Promotion
File: `src/more.js` ~line 196-204
Add novena active check before existing if/else chain (see spec for exact code)

### BT3-15 — Holy Days Dispensation
File: `src/devotions.js` ~line 154
Remove the dispensation paragraph

### BT3-19 — Schedule Zebra Striping
File: `css/app.css` after line ~1279
Add: `.sched-row:nth-child(even):not(.sched-live):not(.sched-past) { background: var(--color-primary-bg); }`
Dark mode: `html[data-theme="dark"] .sched-row:nth-child(even):not(.sched-live):not(.sched-past) { background: rgba(255,255,255,0.02); }`

### BT3-23 — Rosary Opening Prayers Collapsible
File: `src/rosary.js` ~line 388-392
Replace `_prayerBlock(` calls with `_prayerBlockCollapsible(` — all 5 opening prayers

---

## Commit Strategy

```bash
# Phase 1
git add -A && git commit -m "fix: P1 accessibility and critical bugs (BT3-02,03,04,16,17,18,20,22,24,26)"

# Phase 2
git add -A && git commit -m "refine: P2 exam overhaul, more tab, find/saved polish (BT3-01,05,06,07,08,11,12,14,21,25,27,28)"

# Phase 3
git add -A && git commit -m "enhance: P3 novena promotion, zebra striping, rosary collapsible (BT3-13,15,19,23)"

# Push
git push origin ux/bt3-backlog-triage-round3
```

Then create PR to main.

---

## Test Checklist

- [ ] Examination: title centered in header
- [ ] Examination: how-to modal is full-screen, text ≥18px, step 1 text fixed
- [ ] Examination: first checkbox shows toast "Noted for your confession summary"
- [ ] Examination: footer count styled green with background
- [ ] Examination: no "Prayers" label above Act of Contrition
- [ ] Examination: Thanksgiving prayer centered, matches Act of Contrition, divider between
- [ ] Examination: button reads "I went to confession today", green flash on tap
- [ ] Examination: only "Find Confession Near Me" + footer "Done" as exits
- [ ] More tab: no fasting banner
- [ ] More tab: all readings styled identically (no gospel distinction)
- [ ] More tab: novena card promoted when active
- [ ] More tab: all Faith Guides visible (no "Show all" toggle)
- [ ] More tab: no TLM guide
- [ ] More tab: no dispensation footnote in Holy Days
- [ ] More tab: Faith Guide open state readable in dark mode
- [ ] Find tab: sort text readable (≥15px), sort button ≥44px touch target
- [ ] Find tab: chip bar swipe doesn't trigger refresh
- [ ] Find tab: YC cards match standard card background
- [ ] Saved tab: schedule times at --text-base
- [ ] Saved tab: alternating row colors (subtle)
- [ ] Map tab: chips at bottom on mobile, no overlap with controls
- [ ] Tab bar: stays fixed during rapid navigation
- [ ] Rosary: opening prayers are collapsible
- [ ] CCC pills render in Faith Guides
- [ ] Settings: no About text or feedback form, GitHub link present
- [ ] Detail panel: external links open in system browser
- [ ] PWA banner: only shows once per session
- [ ] All changes verified in dark mode
- [ ] All touch targets ≥ 44×44pt
