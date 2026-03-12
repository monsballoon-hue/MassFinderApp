# CCC Cross-References & Explore Connections — Bugfix Spec

**Author:** UX Design Consultant  
**Date:** 2026-03-11  
**Scope:** "Explore connections >" button failure, CCC footnote/citation gap, data pipeline limitations  
**Status:** BLOCKING — the Explore button is non-functional from inside CCC and Bible readers

---

## Diagnosis Summary

Three problems. One critical UI bug, one data limitation, one educational gap.

---

## BUG: "Explore connections >" Button Does Nothing

### What the user sees
Tap "Explore connections ›" at the bottom of CCC §663. Nothing happens.

### Root cause
**Z-index collision.** The button calls `openExplore('ccc', '663')` (line 192, `ccc.js`). This opens the Explore overlay at `z-index: 1500` (line 2259, `css/app.css`). But the CCC sheet sits at `z-index: 2001` (line 1552, `css/app.css`). The Explore overlay opens invisibly **behind** the CCC sheet.

The same bug exists on the Bible sheet — its "Explore connections ›" button (line 341, `bible.js`) also opens Explore behind the Bible reader (z-index 2001 vs. 1500).

```
Explore overlay:  z-index: 1500  ← BEHIND
CCC overlay:      z-index: 2000
CCC sheet:        z-index: 2001  ← IN FRONT
Bible overlay:    z-index: 2000
Bible sheet:      z-index: 2001  ← IN FRONT
```

Explore was designed at z-index 1500 when it was accessed from the More tab (z-index ~0). It was never updated when the CCC and Bible sheets were promoted to z-index 2000+ in the Reading Room upgrade.

### Fix

**Option A (recommended): Close the reader, then open Explore.**

The user explicitly asked to "explore connections" — they're leaving the reading context. Close the CCC/Bible sheet first, then open Explore with a small delay for the animation.

**Files:** `src/ccc.js` (line 192), `src/bible.js` (line 341)

**In `ccc.js` — replace the Explore button onclick (line 192):**

```js
// Before:
bodyHtml += '<button class="ccc-explore-btn" onclick="openExplore(\'ccc\',\'' + primaryId + '\')">Explore connections \u203A</button>';

// After:
bodyHtml += '<button class="ccc-explore-btn" onclick="_openExploreFromCCC(\'' + primaryId + '\')">Explore connections \u203A</button>';
```

**Add the helper function to `ccc.js`:**

```js
function _openExploreFromCCC(numStr) {
  closeCCC();
  setTimeout(function() {
    if (window.openExplore) window.openExplore('ccc', numStr);
  }, 150);
}
window._openExploreFromCCC = _openExploreFromCCC;
```

**In `bible.js` — replace the Explore button onclick (line 341):**

```js
// Before:
relHtml += '<button class="bible-explore-btn" onclick="openExplore(\'bible\',\'' + _esc(refStr).replace(/'/g, '\\\'') + '\')">Explore connections \u203A</button>';

// After:
relHtml += '<button class="bible-explore-btn" onclick="_openExploreFromBible(\'' + _esc(refStr).replace(/'/g, '\\\'') + '\')">Explore connections \u203A</button>';
```

**Add the helper to `bible.js`:**

```js
function _openExploreFromBible(refStr) {
  closeBible();
  setTimeout(function() {
    if (window.openExplore) window.openExplore('bible', refStr);
  }, 150);
}
window._openExploreFromBible = _openExploreFromBible;
```

**Option B (alternative): Boost Explore's z-index when opened from a reader.**

This would keep the reader visible underneath Explore. More complex, less clean. Not recommended.

---

## DATA GAP: CCC Source Citations (Footnotes) Not Captured

### What the user observed
Their hardcopy CCC shows a superscript "546" on §663 pointing to a footnote: "St. John Damascene, De fide orth. 4,2: PG 94, 1104C." This does not appear in the app.

### Why it's missing

The build pipeline (`scripts/build-catechism.js`) sources from `aseemsavio/catholicism-in-json`, which provides paragraph text with parenthetical CCC cross-references (like `(648)`) but **strips all superscript footnote numbers and their footnote content.** The source dataset simply doesn't contain footnotes.

The CCC has two reference systems:
1. **Marginal cross-references** — parenthetical numbers like `(648)` pointing to other CCC paragraphs. These ARE captured. §663 correctly shows fwd:[648].
2. **Footnotes** — superscript numbers (545, 546, 547...) pointing to source documents (Scripture passages, Church Fathers, conciliar texts, papal encyclicals). These are NOT in the data.

### The full footnote picture for §663

From the St. Charles Borromeo and Vatican sources:

| Footnote | Citation |
|---|---|
| 546 | St. John Damascene, *De fide orth.* 4,2: PG 94, 1104C |

Note: footnote 545 actually belongs to §662 (the preceding paragraph), citing Heb 9:11; cf. Rev 4:6-11. The user's hardcopy may show 545 at the top of §663's page because it wraps from §662.

### What exists that could fill this gap

The `nossbigg/catechism-ccc-json` repo (v0.0.2) separates CCC refs from content into distinct element types. Their v0.0.2 release notes: "Split CCC refs from content into own element type." This may include footnote data — needs investigation.

The **Vatican's own HTML** (vatican.va/archive/ENG0015/) contains the full footnotes embedded in the page. The St. Charles Borromeo edition (scborromeo.org) also has them with verse references and source documents fully listed at the bottom of each page.

### Recommended approach

**Phase 1 (immediate): Acknowledge the gap in the UI.**

When §663 shows the quote from St. John Damascene but doesn't cite it, that's a gap the user noticed. The text itself contains the attribution — "By 'the Father's right hand' we understand..." is a quote. The `(648)` at the end is the CCC cross-ref. But the Damascene citation isn't surfaced.

**Phase 2 (data enrichment): Build a footnotes extraction pipeline.**

Write a new build script (`scripts/build-ccc-footnotes.js`) that:
1. Fetches the Vatican HTML for each CCC article section
2. Parses the footnote numbers and their content from the bottom of each page
3. Maps footnote numbers to the paragraph they appear in
4. Categorizes each footnote as: Scripture, Church Father, Council/Encyclical, or Other
5. Outputs `data/ccc-footnotes.json`

**Format:**
```json
{
  "663": [
    {
      "num": 546,
      "type": "church_father",
      "source": "St. John Damascene",
      "work": "De fide orthodoxa",
      "ref": "4,2: PG 94, 1104C"
    }
  ],
  "662": [
    {
      "num": 542,
      "type": "scripture",
      "ref": "Jn 12:32"
    },
    {
      "num": 543,
      "type": "scripture",
      "ref": "Heb 9:24"
    },
    {
      "num": 544,
      "type": "scripture",
      "ref": "Heb 7:25"
    },
    {
      "num": 545,
      "type": "scripture",
      "ref": "Heb 9:11; cf. Rev 4:6-11"
    }
  ]
}
```

**Phase 3 (rendering): Show footnotes in the CCC reader.**

Once footnote data exists, render them in the CCC sheet below the paragraph text as a collapsible "Sources" section:

```js
// After paragraph text, before the Explore button
if (footnotes && footnotes.length) {
  bodyHtml += '<details class="ccc-sources">';
  bodyHtml += '<summary class="ccc-sources-header">Sources <span class="ccc-sources-count">' + footnotes.length + '</span></summary>';
  bodyHtml += '<div class="ccc-sources-body">';
  footnotes.forEach(function(fn) {
    var icon = fn.type === 'scripture' ? 'Scripture' : fn.type === 'church_father' ? 'Church Father' : 'Document';
    bodyHtml += '<div class="ccc-source-item">';
    bodyHtml += '<span class="ccc-source-type">' + utils.esc(icon) + '</span>';
    if (fn.source) bodyHtml += '<span class="ccc-source-name">' + utils.esc(fn.source) + '</span>';
    if (fn.work) bodyHtml += '<span class="ccc-source-work">' + utils.esc(fn.work) + '</span>';
    if (fn.ref && fn.type === 'scripture') {
      // Make Scripture references tappable
      bodyHtml += '<span class="ref-tap ref-tap--bible" onclick="window._refTap(\'bible\',\'' + utils.esc(fn.ref) + '\')">' + utils.esc(fn.ref) + '</span>';
    } else if (fn.ref) {
      bodyHtml += '<span class="ccc-source-ref">' + utils.esc(fn.ref) + '</span>';
    }
    bodyHtml += '</div>';
  });
  bodyHtml += '</div></details>';
}
```

**CSS:**
```css
.ccc-sources { 
  margin-top: var(--space-3); 
  border-top: 1px solid var(--color-border-light); 
}
.ccc-sources-header { 
  display: flex; 
  align-items: center; 
  gap: var(--space-2); 
  padding: var(--space-3) 0; 
  font-size: var(--text-xs); 
  font-weight: var(--weight-medium); 
  color: var(--color-text-tertiary); 
  cursor: pointer; 
  list-style: none; 
}
.ccc-sources-header::-webkit-details-marker { display: none; }
.ccc-sources-count { 
  background: rgba(0,0,0,0.04); 
  padding: 0 6px; 
  border-radius: var(--radius-full); 
  font-size: 10px; 
}
.ccc-source-item { 
  display: flex; 
  flex-wrap: wrap; 
  align-items: baseline; 
  gap: var(--space-1); 
  padding: var(--space-1) 0; 
  font-size: var(--text-xs); 
  color: var(--color-text-secondary); 
}
.ccc-source-type { 
  font-weight: var(--weight-semibold); 
  color: var(--color-text-tertiary); 
  min-width: 80px; 
}
.ccc-source-name { 
  font-weight: var(--weight-medium); 
}
.ccc-source-work { 
  font-style: italic; 
}
.ccc-source-ref { 
  color: var(--color-text-tertiary); 
}
```

---

## CONTEXT: What Superscript Numbers Actually Are

For the user's understanding (and for anyone maintaining this code):

The CCC has **two parallel reference systems** printed on the same page:

**System 1 — Marginal cross-references (what we have):**  
Parenthetical numbers in the body text: `(648)`, `(1545, 1137)`. These point to other CCC paragraphs. In the print edition, these appear in the margins. In our data, they're embedded in the paragraph text and extracted by the build script's regex: `/\((\d[\d,\s\u2013\-]*\d|\d)\)/g`.

**System 2 — Footnotes (what we're missing):**  
Superscript numbers: ⁵⁴⁵, ⁵⁴⁶, ⁵⁴⁷. These point to footnotes at the bottom of the page. The footnotes cite:
- **Scripture** — "Heb 9:11; cf. Rev 4:6-11" (the vast majority)
- **Church Fathers** — "St. John Damascene, De fide orth. 4,2: PG 94, 1104C"
- **Councils & Encyclicals** — "LG 48; cf. Rev 21:3"
- **Other sources** — Roman Missal, Liturgy of the Hours, etc.

The footnote numbers are sequential across the entire CCC (1 through ~2,800+). They are NOT CCC paragraph numbers. Footnote 545 ≠ CCC §545. This is the source of confusion the user encountered.

The `aseemsavio/catholicism-in-json` dataset (our source) strips all superscript footnote numbers from the text. The `nossbigg/catechism-ccc-json` dataset may preserve them — this needs investigation.

---

## Implementation Order

**Immediate (fixes the blocking bug):**
1. Add `_openExploreFromCCC()` to `src/ccc.js` — close CCC, then open Explore
2. Add `_openExploreFromBible()` to `src/bible.js` — close Bible, then open Explore
3. Wire both to `window` for onclick access
4. Test: open CCC §663 → tap "Explore connections ›" → Explore opens showing §663 with connections

**Short-term (data investigation):**
5. Download `nossbigg/catechism-ccc-json` v0.0.2 release assets
6. Check whether their format includes footnote content
7. If yes, write `build-ccc-footnotes.js` to extract and structure footnote data
8. If no, write a Vatican HTML scraper for the footnote extraction pipeline

**Medium-term (rendering):**
9. Add "Sources" collapsible section to CCC sheet rendering
10. Scripture-type footnotes become tappable (open Bible reader)
11. Church Father citations display as informational text

---

## Files Modified

| File | Items | Phase |
|------|-------|-------|
| `src/ccc.js` | Fix Explore button (line 192), add `_openExploreFromCCC()` | Immediate |
| `src/bible.js` | Fix Explore button (line 341), add `_openExploreFromBible()` | Immediate |
| `scripts/build-ccc-footnotes.js` | **NEW** — footnote extraction pipeline | Short-term |
| `data/ccc-footnotes.json` | **NEW** — structured footnote data | Short-term |
| `src/ccc.js` | Add "Sources" rendering | Medium-term |
| `css/app.css` | Sources section CSS | Medium-term |

---

## Test Checklist

- [ ] Open CCC §663 → tap "Explore connections ›" → CCC closes, Explore opens with §663
- [ ] In Explore, §663 shows connections: §648 (CCC xref), any Scripture citations
- [ ] Open Bible (any verse) → tap "Explore connections ›" → Bible closes, Explore opens
- [ ] Explore back button from §663 → returns to Explore landing (not CCC sheet)
- [ ] CCC §662 — verify "(1545, 1137)" cross-refs show in See Also as §1545 and §1137
- [ ] CCC §664 — verify "(541)" cross-ref shows in See Also as §541
