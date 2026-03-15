# UX Spec: Daily Readings Typography (DRT Series)

**Created:** 2026-03-15  
**Backlog items:** IDEA-134  
**Scope:** Reading text formatting — remove verse numbers, add rubric italics, missal-quality typography  
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_DRT.md`

---

## DRT-01 — Remove Verse Numbers from Daily Reading Text

**ID:** DRT-01  
**Category:** enhancement  
**Backlog:** IDEA-134  
**Priority:** P1

**Problem:**  
The daily readings text includes inline verse numbers styled as `.verse-num` (line 2421 of `css/app.css`). These are rendered by `formatReading()` in `src/readings.js` at lines 893–896 — the function detects lines starting with a digit and wraps the number in `<span class="verse-num">`. It also injects verse numbers mid-paragraph via a regex replacement. While useful for Bible study, verse numbers are distracting in a devotional reading context. After hearing Scripture proclaimed at Mass from a lectionary (which has no verse numbers), returning to the app and seeing `3 Jesus said to them...` breaks the contemplative flow. Dorothy finds the numbers confusing ("is that a footnote?"). Paul expects missal-quality presentation.

**Fix:**

Remove verse number rendering from the `formatReading()` function. The numbers are present in the source data but should not be displayed.

**File:** `src/readings.js`, lines ~893–896  
**Before:**
```js
var vm = line.match(/^(\d{1,3})\s+(.+)$/);
if (vm) return '<span class="verse-num">' + vm[1] + '</span>' + esc(vm[2]);
var processed = esc(line);
processed = processed.replace(/(\.?\s+)(\d{1,3})\s+/g, '$1<span class="verse-num">$2</span> ');
```
**After:**
```js
var vm = line.match(/^(\d{1,3})\s+(.+)$/);
if (vm) return esc(vm[2]);
var processed = esc(line);
processed = processed.replace(/(\.?\s+)\d{1,3}\s+/g, '$1');
```

This strips the leading verse number and the mid-sentence verse numbers, preserving the text content.

**CSS cleanup:** The `.reading-text .verse-num` rule at line 2421 becomes dead CSS. Leave it for now (it won't match anything) or remove it.

**Dark mode:** No impact.

**Test checklist:**
- [ ] Expanded daily reading shows clean prose — no numeric verse markers
- [ ] First Reading, Psalm, Second Reading, and Gospel all render without verse numbers
- [ ] Text flow reads naturally without unexpected number breaks
- [ ] No data loss — the actual scripture text is preserved, only display numbers removed
- [ ] Bible module (bible.js) verse numbers are NOT affected — they use `.bible-verse-num` class

---

## DRT-02 — Enhance Rubric and Liturgical Formatting

**ID:** DRT-02  
**Category:** enhancement  
**Backlog:** IDEA-134  
**Priority:** P2

**Problem:**  
The `formatReading()` function at lines 887–899 of `src/readings.js` already detects introductory rubrics ("A reading from...") and conclusions ("The word of the Lord") with `.reading-intro` and `.reading-conclusion` classes. But it misses several liturgical formatting patterns:

1. **Speaker attributions** like "Jesus said to them:" or "He answered:" — these should be in small caps or semibold to visually separate dialogue attribution from the spoken words
2. **Psalm refrains** are already styled (`.psalm-refrain` at line 2422) but the "R." marker could be more prominent
3. **Paragraph spacing** — readings currently have `--space-3` (12px) between paragraphs. For longer readings (Passion narratives, extended OT passages), this feels cramped. Increase to `--space-4` (16px)

**Fix:**

**File:** `css/app.css`, line 1745  
**Before:**
```css
.reading-text .reading-para { margin: 0 0 var(--space-3) 0; }
```
**After:**
```css
.reading-text .reading-para { margin: 0 0 var(--space-4) 0; }
```

**File:** `css/app.css`, line 2425 — enhance the intro line:  
**Before:**
```css
.reading-text .reading-intro { display: block; font-style: italic; color: var(--color-text-tertiary); margin-bottom: var(--space-3); }
```
**After:**
```css
.reading-text .reading-intro { display: block; font-style: italic; color: var(--color-text-tertiary); margin-bottom: var(--space-3); font-size: var(--text-xs); letter-spacing: 0.02em; }
```

This makes the rubric ("A reading from the Letter of Saint Paul to the Romans") smaller and more distinct from the body text — matching how a lectionary prints rubrics in a smaller, italic typeface above the proclaimed text.

**File:** `css/app.css`, line 2426 — refine conclusion:  
**Before:**
```css
.reading-text .reading-conclusion { display: block; font-weight: var(--weight-semibold); color: var(--color-text-primary); margin-top: var(--space-4); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.04em; }
```
**After:**
```css
.reading-text .reading-conclusion { display: block; font-weight: var(--weight-semibold); color: var(--color-text-primary); margin-top: var(--space-5); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.06em; }
```

Increased top margin to `--space-5` (20px) and tightened letter-spacing to `0.06em` — gives the concluding acclamation ("The word of the Lord") more visual separation from the final verse, mimicking the pause a lector takes before the acclamation.

**Dark mode:** All values use CSS variables already. No additional dark rules needed.

**Test checklist:**
- [ ] Paragraph spacing is visibly wider (16px vs 12px)
- [ ] Intro rubric ("A reading from...") renders smaller and italic, distinct from body text
- [ ] Conclusion ("The word of the Lord") has clear separation from final verse
- [ ] Psalm refrain still renders correctly (no regression)
- [ ] Long readings (e.g., Passion narratives) feel spacious, not cramped
- [ ] Dark mode: all elements maintain legibility

---

## DRT-03 — Reading Text Size Increase for Devotional Readability

**ID:** DRT-03  
**Category:** refinement  
**Backlog:** IDEA-134  
**Priority:** P3

**Problem:**  
Reading body text is set at `--text-sm` (14px) per line 1744. For Dorothy reading without her glasses, this is small for extended Scripture passages. The `--font-prayer` (Georgia) at 14px has adequate x-height but the line is set at 1.7 line-height which is good. Bumping to `--text-base` (16px) would match the Bible module's reading size and improve accessibility.

**Fix:**

**File:** `css/app.css`, line 1744  
**Before:**
```css
.reading-text { display: none; font-family:var(--font-prayer); font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.7; margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border-light); }
```
**After:**
```css
.reading-text { display: none; font-family:var(--font-prayer); font-size: var(--text-base); color: var(--color-text-secondary); line-height: 1.7; margin-top: var(--space-3); padding-top: var(--space-3); border-top: 1px solid var(--color-border-light); }
```

Change: `var(--text-sm)` → `var(--text-base)`.

**Cascading impact:** The More tab compact reading view (`.more-zone--today .reading-text`) may need its own override if the larger size is too much for the zone card context. Check whether readings expand inline in Zone 1 — if so, the `--text-base` size should be fine since the zone already has generous padding.

**Dark mode:** No impact.

**Test checklist:**
- [ ] Expanded reading text is 16px (visibly larger than current 14px)
- [ ] Line height at 1.7 with 16px base produces comfortable ~27px line spacing
- [ ] Zone 1 compact readings (if expandable there) don't overflow
- [ ] Dorothy-test: readable at arm's length on an iPhone SE screen
- [ ] Large text size setting doesn't produce overlapping lines

---

## Summary

| ID | Title | Priority | Files |
|----|-------|----------|-------|
| DRT-01 | Remove verse numbers from readings | P1 | readings.js:893–896 |
| DRT-02 | Enhance rubric/conclusion formatting | P2 | app.css:1745,2425,2426 |
| DRT-03 | Increase reading body text to --text-base | P3 | app.css:1744 |
