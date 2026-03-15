# UX Spec: Prayer Zone Polish (PZP Series)

**Created:** 2026-03-15  
**Backlog items:** IDEA-127, IDEA-128, IDEA-129, IDEA-130  
**Scope:** More tab Zone 2 quick wins — label clarity, spacing, placeholder  
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_PZP.md`

---

## PZP-01 — Rename "Examination of Conscience" to "Examine Your Conscience"

**ID:** PZP-01  
**Category:** refinement  
**Backlog:** IDEA-127  
**Priority:** P1

**Problem:**  
"Examination of Conscience" is the longest title in the 2×2 prayer grid. At `--text-sm` (14px) on a ~170px-wide card, it wraps to 3 lines, eating into subtitle space. Dorothy squints at the cramped text; Paul sees a cluttered card that doesn't match the polish of the other three.

**Fix:**

**File:** `src/more.js`, line 900  
**Before:**
```js
{ id: 'examination', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for confession', action: 'openExamination()' },
```
**After:**
```js
{ id: 'examination', title: 'Examine Your Conscience', subtitle: confLabel || 'Prepare for confession', action: 'openExamination()' },
```

Also update the splash screen title in `src/examination.js`. Search for the string `'Examination of Conscience'` used as a display heading and replace with `'Examine Your Conscience'`. The reader module `getTitle` should also be updated:

**File:** `src/examination.js` — find the `getTitle` function in the reader module registration  
**Before:** `return 'Examination of Conscience';`  
**After:** `return 'Examine Your Conscience';`

**Note:** The reader header bar has limited width. "Examine Your Conscience" (23 chars) vs "Examination of Conscience" (25 chars) — marginal savings in header but meaningful savings on the grid card where it wraps.

**Dark mode:** No impact — text inherits color tokens.

**Test checklist:**
- [ ] Grid card title fits on 2 lines max at default text size on 375px viewport
- [ ] Grid card title fits on 2 lines max at "large" text size
- [ ] Reader overlay header shows "Examine Your Conscience" when tool opens
- [ ] Splash screen (if present) shows updated title
- [ ] Subtitle still renders below title with breathing room

---

## PZP-02 — Tighten Section Header Spacing in Zone 2

**ID:** PZP-02  
**Category:** refinement  
**Backlog:** IDEA-128  
**Priority:** P2

**Problem:**  
The "Guided Prayer" section title (`.more-section-title--pray`) inherits `margin-bottom: var(--space-3)` (12px) from the base `.more-section-title` rule. Combined with the zone-inner padding of `var(--space-2)` (8px) on `.more-zone--practice .more-section--zone-inner`, there's 20px of dead space between the header and the first grid row. For Sarah scrolling one-handed, that's wasted viewport. The "Your Practice" label below the gateway card adds another gap.

**Fix:**

**File:** `css/app.css`, line 1588  
**Before:**
```css
.more-section-title--pray { font-family: var(--font-body); font-weight: var(--weight-semibold); color: var(--color-text-primary); font-size: var(--text-base); letter-spacing: 0; }
```
**After:**
```css
.more-section-title--pray { font-family: var(--font-body); font-weight: var(--weight-semibold); color: var(--color-text-primary); font-size: var(--text-base); letter-spacing: 0; margin-bottom: var(--space-2); }
```

This overrides the base `--space-3` with `--space-2` (8px) — total gap becomes 16px instead of 20px.

**Dark mode:** No impact.

**Test checklist:**
- [ ] "Guided Prayer" header sits closer to 2×2 grid (8px gap, not 12px)
- [ ] No overlap or touching between header and first grid card
- [ ] Consistent visual rhythm at 375px and 428px viewports
- [ ] Large text size does not cause overlap

---

## PZP-03 — Replace "Your Practice" with "Ongoing Devotions"

**ID:** PZP-03  
**Category:** refinement  
**Backlog:** IDEA-129  
**Priority:** P1

**Problem:**  
"Your Practice" is vague. Dorothy sees it and has no idea what it means. Paul skips it because it could be anything. The label is rendered at line 959 of `src/more.js` as a `.practice-strip-label`. It needs to communicate that this is the tracker area for novenas and recurring devotional commitments.

**Fix:**

**File:** `src/more.js`, line 959  
**Before:**
```js
practiceStrip.innerHTML = '<div class="practice-strip-label">Your Practice</div>'
```
**After:**
```js
practiceStrip.innerHTML = '<div class="practice-strip-label">Ongoing Devotions</div>'
```

"Ongoing Devotions" is self-documenting: Catholics know what a devotion is, and "ongoing" signals these are tracked over time. It's 2 words, compact, and doesn't require a subtitle to explain itself.

**Dark mode:** No impact.

**Test checklist:**
- [ ] Label reads "Ongoing Devotions" above the practice strip
- [ ] No truncation at 375px or 320px viewports
- [ ] Text is visually balanced with "Guided Prayer" section title above

---

## PZP-04 — Catholic Library Teaser: Coming Soon Placeholder

**ID:** PZP-04  
**Category:** refinement  
**Backlog:** IDEA-130  
**Priority:** P2

**Problem:**  
The Catholic Library teaser card at the bottom of Zone 2 (`#libraryTeaser`, line 977 of `src/more.js`) links to the Explore tab which contains CCC, Bible, and Baltimore Catechism. The teaser implies a curated library experience but the destination is the raw reference browser. Dorothy taps it expecting something like the Prayer Book and gets a dense academic tool. Paul finds it misleading.

**Fix:**  
Replace the interactive card with a muted "Coming Soon" placeholder. Keep the card visible so users know the feature is planned, but disable interaction and visually dim it.

**File:** `src/more.js`, around line 977–990 (the `libraryTeaser` block)  
**Before:**
```js
libTeaser.innerHTML = '<div class="library-teaser" onclick="openExplore()" role="button" tabindex="0">'
  + '<div class="prayer-tool-icon" style="background:var(--color-surface-hover);color:var(--color-text-secondary)">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>'
  + '</div>'
  + '<div class="prayer-tool-body">'
  + '<div class="prayer-tool-title">Catholic Library</div>'
  + '<div class="prayer-tool-subtitle">Bible, Catechism, Baltimore Catechism & Summa</div>'
  + '</div>'
  + '</div>';
```
**After:**
```js
libTeaser.innerHTML = '<div class="library-teaser coming-soon">'
  + '<div class="prayer-tool-icon" style="background:var(--color-surface-hover);color:var(--color-text-tertiary)">'
  + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>'
  + '</div>'
  + '<div class="prayer-tool-body">'
  + '<div class="prayer-tool-title" style="color:var(--color-text-tertiary)">Catholic Library</div>'
  + '<div class="prayer-tool-subtitle">Coming soon</div>'
  + '</div>'
  + '</div>';
```

Key changes: removed `onclick`, removed `role="button"` and `tabindex="0"`, added `coming-soon` class. The existing `.prayer-tool-card.coming-soon` rule at line 1797 already applies `opacity:0.5;cursor:default;` — and the hover/active overrides at lines 1794–1796 already exclude `.coming-soon`. But `.library-teaser` is not a `.prayer-tool-card` — it's its own class. So add a CSS rule:

**File:** `css/app.css`, after line 1808 (after existing `.library-teaser` rules)  
**Add:**
```css
.library-teaser.coming-soon { opacity:0.5;cursor:default;pointer-events:none; }
```

**Dark mode:** Inherits from existing token colors. `--color-text-tertiary` is already dark-mode aware.

**Test checklist:**
- [ ] Card shows "Catholic Library" with "Coming soon" subtitle
- [ ] Card is visually dimmed (0.5 opacity)
- [ ] Tapping does nothing — no navigation, no hover effect
- [ ] Dark mode: card still visible but muted
- [ ] Users who previously tapped this to reach Explore can still reach it via the "Explore" section in Go Deeper zone, or via the CCC/Bible cards elsewhere

**Cascading note:** Users who relied on this teaser to access the Explore tab must have an alternative path. The Explore tab is already accessible via the Go Deeper zone's existing cards (CCC, Bible, etc.). No path is lost.

---

## Summary

| ID | Title | Priority | Files |
|----|-------|----------|-------|
| PZP-01 | Rename to "Examine Your Conscience" | P1 | more.js:900, examination.js |
| PZP-02 | Tighten "Guided Prayer" header spacing | P2 | app.css:1588 |
| PZP-03 | "Your Practice" → "Ongoing Devotions" | P1 | more.js:959 |
| PZP-04 | Library teaser Coming Soon placeholder | P2 | more.js:977, app.css:~1808 |
