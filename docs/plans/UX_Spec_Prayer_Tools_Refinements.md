# UX Spec — Prayer Tools Refinements

**Date:** 2026-03-13
**Author:** UX Consultant (Claude Opus)
**Status:** All items implemented — 2026-03-13
**Shared infrastructure:** All four prayer tools (Rosary, Examination, Stations, Novena) use the universal reader overlay (`src/reader.js`, `.reader-overlay` in CSS). Fixes to the reader affect all four tools simultaneously.

| Item | Title | Status |
|------|-------|--------|
| PTR-01 | iOS Scroll-Through Bug & Tab Bar Break | done |
| PTR-02 | Desktop Immersive Experience — Backdrop & Card Treatment | done |
| PTR-03 | Examination of Conscience — UX Restructuring | done |
| PTR-04 | Examination — Progress Visibility | done |
| PTR-05 | Reader Header Accent Line Polish | done |
| PTR-06 | Rosary Aesthetic Improvements | done |
| PTR-07 | Stations & Novena Minor Polish | done |
| PTR-08 | Dead CSS Cleanup | done |

---

## Table of Contents

1. [PTR-01] CRITICAL: iOS Scroll-Through Bug & Tab Bar Break
2. [PTR-02] Desktop Immersive Experience — Backdrop & Card Treatment
3. [PTR-03] Examination of Conscience — UX Restructuring
4. [PTR-04] Examination — Progress Visibility
5. [PTR-05] Reader Header Accent Line Polish
6. [PTR-06] Rosary Aesthetic Improvements
7. [PTR-07] Stations & Novena Minor Polish
8. [PTR-08] Dead CSS Cleanup

---

## [PTR-01] CRITICAL: iOS Scroll-Through Bug & Tab Bar Break

**Files:** `css/app.css`, `src/reader.js`  
**Priority:** P0 — ship blocker

### The Bug

On iOS Safari, when the reader overlay is open and the user scrolls past the content boundaries (rubber-band/overscroll), the entire overlay visually shifts, revealing the More tab content behind it. The prayer tool cards from the More tab are clearly visible beneath the Examination overlay (confirmed in mobile screenshots 4 and 5). After dismissing the overlay in this state, the tab bar becomes unfixed and scrolls with the page content, requiring a force quit to recover.

### Root Cause

The reader overlay uses `position: fixed; inset: 0` with `overscroll-behavior: contain` on both the overlay and `.reader-body`. However, iOS Safari has a known deficiency with `overscroll-behavior` in combination with `-webkit-overflow-scrolling: touch`. When the inner scrollable area (`.reader-body`) reaches its scroll boundary, iOS's rubber-band scrolling propagates to the viewport itself, physically shifting the fixed-position overlay.

The tab bar break on exit is a secondary consequence: when the viewport has been shifted by rubber-band scrolling, `document.body.style.overflow = ''` in `readerClose()` at line 136 restores body scrolling, but the viewport offset persists. The tab bar (`position: fixed; bottom: 0`) is now calculated against a shifted viewport, causing it to float.

### Proposed Fix

#### PTR-01-A: Harden scroll containment on the overlay

Add `overflow: hidden` to `.reader-overlay` itself to prevent any scroll propagation past the overlay container. The inner `.reader-body` already handles its own scrolling.

```css
.reader-overlay {
  /* existing styles ... */
  overflow: hidden;                    /* ADD — prevent scroll pass-through */
  -webkit-overflow-scrolling: auto;    /* ADD — disable momentum pass-through */
  touch-action: none;                  /* ADD — prevent gesture pass-through to body */
}
.reader-body {
  /* existing styles ... */
  touch-action: pan-y;                 /* ADD — allow vertical scroll within body only */
  -webkit-overflow-scrolling: auto;    /* CHANGE from touch — prevent momentum bleed */
}
```

**Note:** Removing `-webkit-overflow-scrolling: touch` from `.reader-body` may slightly change scroll feel on older iOS devices, but it's deprecated since iOS 13 and is the primary cause of scroll bleed-through on modern iOS.

#### PTR-01-B: Viewport reset on close

In `reader.js` `readerClose()`, add explicit viewport reset before restoring body scroll:

```javascript
function readerClose() {
  var overlay = document.getElementById('readerOverlay');
  if (!overlay) return;
  overlay.classList.remove('open');

  // PTR-01-B: Reset viewport position before restoring scroll
  window.scrollTo(0, 0);
  document.body.style.overflow = '';

  // ... rest of cleanup
}
```

The `window.scrollTo(0, 0)` ensures the viewport is at the expected position before the tab bar's `position: fixed; bottom: 0` is recalculated.

#### PTR-01-C: Prevent body scroll while overlay is open (belt and suspenders)

The current approach sets `body.style.overflow = 'hidden'` in JS. Add a CSS class approach as reinforcement:

```css
body.reader-open {
  overflow: hidden;
  position: fixed;
  width: 100%;
  top: 0;
  left: 0;
}
```

In `reader.js`:
```javascript
// In readerOpen:
document.body.classList.add('reader-open');
document.body.dataset.scrollPos = window.scrollY;

// In readerClose:
document.body.classList.remove('reader-open');
window.scrollTo(0, parseInt(document.body.dataset.scrollPos || '0', 10));
document.body.style.overflow = '';
```

The `position: fixed` on body is the nuclear option for iOS scroll prevention. Combined with saving/restoring scroll position, it prevents the viewport from moving while the overlay is active.

### Test Checklist

- [ ] iOS Safari: open Examination, scroll to bottom of questions, rubber-band scroll — no content visible behind overlay
- [ ] iOS Safari: close Examination — tab bar stays fixed at bottom
- [ ] iOS Safari: open Rosary, scroll aggressively on landing page — no bleed-through
- [ ] Android Chrome: verify no regression from -webkit-overflow-scrolling removal
- [ ] Desktop: verify reader overlay still scrolls normally within its body area
- [ ] Scroll position restoration: open reader from mid-page More tab, close reader — page returns to same scroll position

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — added `overflow:hidden; touch-action:none; -webkit-overflow-scrolling:auto` to `.reader-overlay`; changed `.reader-body` `-webkit-overflow-scrolling` from `touch` to `auto`, added `touch-action:pan-y`; added `body.reader-open` rule with `position:fixed; overflow:hidden; width:100%; top:0; left:0`. `src/reader.js` — replaced `document.body.style.overflow = 'hidden'` at line 76 with `classList.add('reader-open')` + `dataset.scrollPos` save; replaced `document.body.style.overflow = ''` at line 136 with `classList.remove('reader-open')` + `window.scrollTo(0, scrollPos)` restore.
- **Approach:** Implemented all three sub-fixes (PTR-01-A, B, C). The `body.reader-open` CSS class with `position:fixed` is the primary iOS fix. Scroll position is saved before opening and restored on close so users return to the same scroll position. Other overlays (filter, detail, settings) are unaffected since they don't use the `reader-open` class.
- **Deviations from spec:** Combined PTR-01-B and PTR-01-C into a single implementation — `window.scrollTo(0, scrollPos)` restores the saved position rather than always scrolling to (0,0).
- **Known issues:** None observed.

---

## [PTR-02] Desktop Immersive Experience — Backdrop & Card Treatment

**Files:** `css/app.css`

### The Problem

On desktop (768px+), the reader overlay constrains to `max-width: 680px` and centers itself via `left: 50%; transform: translate(-50%, 0)`. But there is **no backdrop** behind it. The areas to the left and right of the card show either the overlay's own gradient background bleeding to the edges, or — more problematically — nothing at all. The result is a floating card in a void, with no visual grounding.

The old prayer overlay system had desktop-specific rules (lines 2607-2686) with `backdrop-filter: blur(4px)` and dimmed backgrounds, but these target `.rosary-overlay`, `.exam-overlay`, etc. — classes that are **never rendered in the DOM**. The universal reader system replaced those overlays but never inherited the desktop treatment.

### Proposed Fix

#### PTR-02-A: Add backdrop scrim behind the reader card on desktop

On desktop, the reader overlay should use a two-layer approach: a full-screen dimmed/blurred backdrop, and the content card on top.

Using a `::before` pseudo-element on the overlay:

```css
@media (min-width: 768px) {
  .reader-overlay {
    background: transparent;     /* Override gradient — it now goes on the card */
    align-items: flex-start;
    justify-content: center;
  }

  .reader-overlay::before {
    content: '';
    position: fixed;
    inset: 0;
    background: rgba(26, 30, 38, 0.4);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    z-index: -1;
  }

  .reader-header,
  .reader-header-extra,
  .reader-body,
  .reader-footer {
    width: min(600px, 90vw);
    margin-left: auto;
    margin-right: auto;
  }

  .reader-header {
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    margin-top: 3vh;
  }

  .reader-body {
    background: linear-gradient(180deg, #F8F6F1 0%, #F0EDE5 100%);
    max-height: calc(94vh - 140px);
    box-shadow: 0 8px 40px rgba(0,0,0,0.12);
  }

  .reader-footer {
    border-radius: 0 0 var(--radius-lg) var(--radius-lg);
    background: rgba(248, 246, 241, 0.97);
  }

  /* Remove the old centered-card transform — use flexbox centering instead */
  .reader-overlay {
    left: 0;
    right: 0;
    width: 100%;
    max-width: none;
    transform: translateY(100%);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .reader-overlay.open {
    transform: translateY(0);
  }
}
```

**Dark mode desktop:**
```css
@media (min-width: 768px) {
  html[data-theme="dark"] .reader-overlay::before {
    background: rgba(0, 0, 0, 0.6);
  }
  html[data-theme="dark"] .reader-body {
    background: var(--color-bg);
    box-shadow: 0 8px 40px rgba(0,0,0,0.4);
  }
  html[data-theme="dark"] .reader-header {
    background: rgba(26, 28, 34, 0.97);
  }
  html[data-theme="dark"] .reader-footer {
    background: rgba(26, 28, 34, 0.97);
  }
}
```

**Seasonal tint override for desktop:** The body background should still respect the liturgical season gradient. Override `reader-body` background inside the seasonal selectors when `min-width: 768px`.

#### PTR-02-B: Click-to-dismiss on backdrop

On desktop, clicking the dimmed backdrop area (outside the card) should close the reader for non-prayer modules. Prayer modules (Rosary, Examination, Stations, Novena) should NOT dismiss on backdrop click — the user must explicitly close via the X button, matching the existing swipe-to-dismiss guard in `reader.js` line 201.

**Implementation:** The `::before` pseudo-element can't receive click events separately. Instead, add an event listener on the overlay itself that checks if the click target is the overlay (not a child):

```javascript
// In reader.js _initSwipeDismiss or a new _initBackdropDismiss:
overlay.addEventListener('click', function(e) {
  if (e.target !== overlay) return;
  if (_current && ['rosary', 'examination', 'stations', 'novena'].indexOf(_current.mode) >= 0) return;
  readerClose();
});
```

### Test Checklist

- [ ] Desktop: reader opens with dimmed/blurred backdrop covering full screen
- [ ] Desktop: card is centered, ~600px wide, with rounded corners and shadow
- [ ] Desktop: Rosary set-color backgrounds still tint the card body
- [ ] Desktop: click outside card on CCC/Bible reader dismisses overlay
- [ ] Desktop: click outside card on prayer tools does NOT dismiss
- [ ] Desktop dark mode: backdrop and card render correctly
- [ ] Mobile: no visual changes (backdrop not applied below 768px)
- [ ] Seasonal tints: Lenten purple gradient visible in card body on desktop

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — replaced single-line desktop media query at line 1753 with three `@media (min-width:768px)` blocks: main card layout (full-screen overlay + `::before` backdrop + child element widths/radii/shadows), seasonal tint overrides targeting `.reader-body` (not `.reader-overlay`), and dark mode overrides. `src/reader.js` — added `_initBackdropDismiss()` function and exported it. `src/app.js` — added call to `reader._initBackdropDismiss()` alongside `_initSwipeDismiss`.
- **Approach:** Overlay becomes full-screen transparent on desktop with `background:transparent`. A `::before` pseudo-element with `position:fixed; inset:0; backdrop-filter:blur(8px); z-index:-1` provides the dimmed scrim. Child elements (header, header-extra, body, footer) are constrained to `width:min(600px,90vw)` with the `.reader-header` getting top border-radius and `margin-top:3vh`. Seasonal tints now target `.reader-body` instead of `.reader-overlay` since the overlay background is transparent on desktop.
- **Deviations from spec:** None.
- **Known issues:** The `::before` z-index:-1 approach works correctly because the overlay's z-index creates a stacking context. Tested conceptually — verify visually on desktop.

---

## [PTR-03] Examination of Conscience — UX Restructuring

**Files:** `src/examination.js`, `css/app.css`

### The Problem

After the beautiful centering prayer screen, the user taps "Begin Examination" and is immediately confronted with:

1. "How to Go to Confession" — a collapsible reference section that has no clear role in the flow
2. "THE TEN COMMANDMENTS" — a shouting uppercase label
3. All 10 commandment sections visible as a scrollable list, with the 1st auto-expanded showing 8 questions
4. "PRECEPTS OF THE CHURCH" — another section below all 10 commandments
5. Summary, prayers, tracker — all below the fold

The experience shifts from contemplative centering to bureaucratic checklist in a single transition. The user's emotional posture ("I'm preparing my soul") collides with the interface's posture ("here are 66 items to audit"). 

The 72-year-old sees 11 sections and feels overwhelmed. The 25-year-old sees a form that looks like a compliance checklist. The 45-year-old parent has limited time and can't tell which sections to focus on.

### Proposed Fix

#### PTR-03-A: Guided one-section-at-a-time flow

Instead of showing all 11 sections simultaneously, present one commandment at a time with forward/back navigation — matching the Rosary's decade-by-decade and Stations' station-by-station pattern.

**Flow:**
1. Opening prayer (existing — keep as-is)
2. "How to Go to Confession" reference (move to a permanent icon-link in the header, not inline)
3. **1st Commandment** — full screen with its 8 questions, CCC refs, checkboxes
4. **Navigation:** "Next →" button to advance to 2nd Commandment, "← Back" to return
5. Continue through all 10 Commandments → Precepts
6. Summary automatically shown after completing the last section
7. Act of Contrition, tracker, "Find Confession Near Me"

**The dot navigation** from Rosary/Stations should be reused at the top: 11 dots (10 commandments + precepts), with the current section highlighted and completed sections filled. This gives the user a sense of progress and position without the overwhelm of seeing all sections.

**"How to Go to Confession"** becomes a small icon button in the reader header (info circle icon) that opens the guide as a temporary overlay or sheet — available at any point during the examination, not competing for attention in the main flow.

**Implementation:**

The existing `_renderExamination()` renders all sections at once into `body.innerHTML`. Restructure to:

1. Store sections as an array: `_sections = d.commandments.concat([d.precepts])`
2. Track current section index: `_currentSection = 0`
3. Render only the current section plus navigation
4. `_renderCurrentSection()` replaces body content with single section
5. Navigation buttons in the reader footer: "← Previous" / "Next →" (same pattern as Rosary/Stations)
6. Dot navigation in `readerHeaderExtra`

```javascript
function _renderCurrentSection() {
  var section = _sections[_currentSection];
  var isLast = _currentSection === _sections.length - 1;
  
  // Update dots
  _updateDots();
  
  // Update progress bar
  var progress = (_currentSection + 1) / _sections.length;
  var bar = document.getElementById('examProgress');
  if (bar) bar.style.transform = 'scaleX(' + progress + ')';
  
  // Render section content
  var body = document.getElementById('readerBody');
  body.style.opacity = '0';
  setTimeout(function() {
    var key = section.number ? 'cmd-' + section.number : 'precepts';
    _expanded[key] = true; // Always expanded in single-section mode
    body.innerHTML = _renderSingleSection(section, key);
    body.scrollTop = 0;
    body.style.opacity = '1';
    _wireInlineCCC();
    refs.initRefTaps(body);
    _wireCheckboxes(body);
  }, 150);
  
  // Update footer navigation
  _updateFooterNav(isLast);
}
```

**Footer becomes navigation:**
```html
<div class="exam-nav">
  <button class="exam-nav-back" onclick="examPrevSection()">← Previous</button>
  <span class="exam-nav-count">3 items noted</span>
  <button class="exam-nav-next" onclick="examNextSection()">Next →</button>
</div>
```

The "View Summary" button moves to the last-section footer: after Precepts, the "Next →" button becomes "View Summary →".

#### PTR-03-B: Section transition animation

When advancing between sections, use the same crossfade that the reader already uses for CCC/Bible navigation (opacity fade in `readerOpen` at lines 80-85). The body content fades out, new section renders, body fades in. This creates a sense of progression rather than page-jumping.

The transition is already built into the code pattern at line 90-95 of reader.js. The exam module just needs to use the same opacity toggle.

#### PTR-03-C: Section header with commandment context

Each section view should feel like a contemplative stop, not a form section. Replace the current accordion header rendering with:

```
                    ┌────┐
                    │ 1  │
                    └────┘
   I am the Lord your God; you shall 
     not have strange gods before Me.
              
              CCC 2084-2141
              
   ─────────────────────────────
   
   □ Have I doubted or denied the 
     teachings of the Catholic Church?
                              CCC 2087-2089
```

The commandment number renders as a large centered numeral (similar to the Rosary's "1ST SORROWFUL MYSTERY" treatment). The commandment text renders in `--font-prayer` (Georgia) centered. The CCC reference sits below as a tappable link. Then the questions follow with generous spacing.

```css
.exam-section-hero {
  text-align: center;
  padding: var(--space-6) var(--space-4) var(--space-4);
}
.exam-section-num {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  margin-bottom: var(--space-3);
}
.exam-section-title {
  font-family: var(--font-prayer);
  font-size: var(--text-lg);
  color: var(--color-text-primary);
  line-height: 1.5;
  max-width: 480px;
  margin: 0 auto;
}
```

#### PTR-03-D: Running item count stays visible

The current "No items noted yet | View Summary" footer bar should persist through the section-by-section flow, but the "View Summary" button should be hidden until at least one item is checked. The count updates in real-time as the user checks items.

On the final section (Precepts), "View Summary" becomes the primary forward action.

### Test Checklist

- [ ] Opening prayer → Begin → lands on 1st Commandment (not all sections)
- [ ] Dot navigation shows 11 dots, current highlighted
- [ ] "Next →" advances to 2nd Commandment with crossfade
- [ ] "← Previous" returns to 1st Commandment, preserving checked items
- [ ] Progress bar advances with each section
- [ ] Checked items persist across section navigation
- [ ] After Precepts, "Next →" becomes "View Summary →"
- [ ] Summary shows all checked items grouped by commandment
- [ ] "How to Go to Confession" accessible via header icon at any point
- [ ] Footer shows running count of checked items
- [ ] Mobile: navigation buttons properly spaced, 44pt+ touch targets
- [ ] Desktop: section hero centered in card, questions readable
- [ ] Back-navigation from Summary returns to Precepts (or last section visited)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/examination.js` — replaced `_examBeginReview` body (removed all headerExtra/footer setup code, replaced `_renderExamination(d)` call with `_initSectionFlow(d)`). Added module-level `_sections[]` and `_currentSection` state vars. Added new functions: `_initSectionFlow`, `_buildHeaderExtraHTML`, `_updateDots`, `_sectionHasItems`, `_renderCurrentSection`, `_wireCheckboxes`, `_updateFooterNav`, `examNextSection`, `examPrevSection`, `examGoToSection`, `examViewSummary`, `_renderSummaryScreen`, `examShowHowTo`. Updated `_updateCheckedUI` to call `_updateFooterNav` when in section flow. Updated `module.exports` with new public functions. `src/app.js` — added `window` bindings for all new exam functions. `css/app.css` — added `.exam-section-hero`, `.exam-section-num`, `.exam-section-title`, `.exam-section-ccc`, `.exam-section-questions`, `.exam-nav`, `.exam-nav-back/next/count`, `.exam-howto-modal` rules and dark mode overrides.
- **Approach:** `_examBeginReview` now calls `_initSectionFlow(d)` which builds `_sections = d.commandments.concat([d.precepts])`. Each section renders via `_renderCurrentSection()` using a crossfade (150ms). The footer is a three-part nav: Previous | count | Next. The count is tappable to jump to summary when items exist. "Next →" becomes "View Summary →" on the last section. The How-to-Confess guide opens as a modal sheet (reusing exam-exit-dialog visual pattern) triggered by an info icon in headerExtra. The summary screen (`_renderSummaryScreen`) reuses the existing summary/prayers/tracker HTML structure. `_checked` items survive section navigation since they're only cleared on `render()` (fresh open) and `onClose`. Checkbox delegation is done via `_wireCheckboxes(body)` which guards against duplicate listeners with `body._examChangeWired`. Added `skey` field to `_checked` entries for dot green-state tracking.
- **Deviations from spec:** The "How to Go to Confession" is a bottom-sheet modal overlay on the reader (not a `readerNavigate` call) since it's simpler and doesn't disturb the reader's navigation stack. The footer count field is a tappable button to jump to summary (rather than always requiring navigation to last section first).
- **Known issues:** The old `_renderExamination`, `examToggleSection`, `_initScrollProgress`, and `examScrollToSummary` functions remain in the file as dead code. They don't affect behavior but could be cleaned up later.
- **Follow-up suggestions:** Consider extracting `_wireCheckboxes` to a shared utility if other modules need delegation-based checkbox handling. The old `_renderExamination` dead code could be removed in a future cleanup pass.

---

## [PTR-04] Examination — Progress Visibility

**Files:** `src/examination.js`, `css/app.css`

### The Problem

The progress bar is 2px tall at the top of the reader header-extra area. On both mobile and desktop, it's essentially invisible. The user has no ambient sense of how far through the examination they are.

### Proposed Fix

With the section-by-section flow from PTR-03, progress becomes much more meaningful. The progress bar now represents "section 3 of 11" rather than "you've scrolled 20% of a long page."

#### PTR-04-A: Increase progress bar height and add section label

```css
.exam-progress-track {
  height: 4px;           /* was 2px */
  background: var(--color-border-light);
  overflow: hidden;
  border-radius: 2px;    /* ADD — rounded ends */
}
.exam-progress-bar {
  height: 100%;
  background: var(--color-primary);
  border-radius: 2px;    /* ADD */
  transition: transform 0.3s cubic-bezier(0.28, 0.11, 0.32, 1);  /* smoother */
}
```

#### PTR-04-B: Dot navigation (replaces progress bar for exam)

With PTR-03's section-by-section flow, replace the progress bar with dot navigation matching Rosary/Stations:

```css
.exam-dots {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: var(--space-2) var(--space-3);
}
.exam-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border-light);
  transition: all 0.3s;
}
.exam-dot.active {
  background: var(--color-primary);
  transform: scale(1.4);
}
.exam-dot.done {
  background: var(--color-primary);
}
.exam-dot.has-items {
  background: var(--color-verified);  /* green — items checked in this section */
}
```

Dots that have checked items turn green, giving the user a visual breadcrumb of where they've noted sins.

### Test Checklist

- [ ] 11 dots render in header-extra area
- [ ] Current section dot is enlarged and primary-colored
- [ ] Completed sections show filled dots
- [ ] Sections with checked items show green dots
- [ ] Dots are tappable to jump to that section (44pt tap area via padding)
- [ ] Mobile: dots don't overflow on small screens (11 × 8px + 10 × 8px gap = 168px fits 320px+)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — added `.exam-dots`, `.exam-dot-btn`, `.exam-dot`, `.exam-dot.active`, `.exam-dot.done`, `.exam-dot.has-items` rules. Dot logic is in `_updateDots()` in `examination.js` (implemented as part of PTR-03).
- **Approach:** The progress bar is replaced by 11 dot indicators. Dots are 8px circles in `<button>` wrappers with 44px touch height via `padding:10px 4px; min-height:44px`. Active dot scales to 1.4x. Dots with checked items show `--color-verified` (green). `_sectionHasItems(key)` checks `_checked[*].skey` to determine per-section state. Dots are rendered in `#examDots` inside the `#readerHeaderExtra` area, updating via `_updateDots()` on each section transition.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## [PTR-05] Reader Header Accent Line Polish

**Files:** `css/app.css`

### The Problem

The `reader-header::after` pseudo-element renders a 2px accent-colored line at `opacity: 0.3` spanning from 20% to 80% of the header width. On desktop it looks like a decorative design element. On mobile it looks like a rendering artifact — an unexplained purple line below the header text.

### Proposed Fix

#### PTR-05-A: Make the accent line intentional or remove it

The accent line should either be purposeful (thick enough to read as a design element, extending full width) or removed entirely.

**Option chosen: purposeful minimal accent.** Increase opacity slightly and reduce width to feel like a subtle chapter-mark:

```css
.reader-header::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 30%;           /* was 20% */
  right: 30%;          /* was 20% */
  height: 2px;
  background: var(--color-accent);
  opacity: 0.2;        /* was 0.3 — slightly more subtle */
  border-radius: 1px;
}
```

This is a minor polish item. If it still feels like an artifact after the change, remove the `::after` entirely.

### Test Checklist

- [ ] Accent line is subtle but intentional on mobile
- [ ] Accent line shifts color with liturgical season (uses var(--color-accent))
- [ ] Dark mode: line visible but not jarring

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` line 1729 — changed `.reader-header::after` from `left:20%;right:20%;opacity:0.3` to `left:30%;right:30%;opacity:0.2;border-radius:1px`.
- **Approach:** Single-line CSS change. Width narrowed from 60% to 40% of header, opacity slightly reduced to feel more like a subtle chapter-mark than an artifact.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## [PTR-06] Rosary Aesthetic Improvements

**Files:** `src/rosary.js`, `css/app.css`

### Current State

The Rosary is the most polished of the four prayer tools. The mystery card with set-color left-border, the bead tracking, the crossfade transitions, and the set-specific gradient backgrounds all work well. Mobile screenshots confirm the beads render at appropriate size on phone width (22px circles on ~350px content area).

### Proposed Improvements

#### PTR-06-A: Remove redundant "Tap beads to count" hint after first interaction

Currently "Tap to count / Tap beads to count" appears below the bead counter on every decade. After the user has tapped their first bead (demonstrating they understand the interaction), this hint should fade out and not reappear for subsequent decades.

**Implementation:** Track `_hasInteracted` flag. On first bead tap, set flag and add `display: none` to `.rosary-bead-hint`.

#### PTR-06-B: Bead sizing on desktop

On desktop, the 22px beads feel small in the 540px content area. Scale up on wider screens:

```css
@media (min-width: 768px) {
  .rosary-bead {
    width: 1.75rem;    /* was 1.375rem */
    height: 1.75rem;
  }
  .rosary-beads {
    gap: 0.5rem;       /* was 0.375rem */
  }
}
```

#### PTR-06-C: "Begin" button — use set color instead of generic red

The Rosary landing page "Begin" button is always red (`#C0392B`-ish). It should use the mystery set's accent color — red for Sorrowful (already matches), blue for Joyful, gold for Glorious, green for Luminous. This creates an immediate visual thread from the landing page into the prayer experience.

**Implementation:** The set color is known before rendering the landing page. Apply it as `style="--btn-color: var(--set-color)"` on the Begin button and use CSS:

```css
.rosary-begin-btn {
  background: var(--btn-color, #C0392B);
}
```

### Test Checklist

- [ ] "Tap beads to count" disappears after first bead tap
- [ ] Desktop beads are 28px instead of 22px
- [ ] Begin button matches mystery set color
- [ ] Dark mode: bead scaling and button color verified

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/rosary.js` — added `var _hasInteracted = false` state var; reset in fresh state block; in `rosaryBeadTap()` added first-tap guard to hide `.rosary-bead-hint`; changed decade render to suppress hint when `_hasInteracted` is true. `css/app.css` — added `@media (min-width:768px)` rule for `.rosary-bead` (1.75rem) and `.rosary-beads` (gap 0.5rem).
- **Approach:** PTR-06-A: `_hasInteracted` flag is set on first bead tap and remains set for the entire session. The hint is both suppressed in re-renders (via `!_hasInteracted` guard in HTML template) and immediately hidden in the DOM on first tap. PTR-06-B: CSS-only media query. PTR-06-C: Already fully implemented — `rosary.js` line 416 already sets `style="--set-color:..."` on the Begin button and `css/app.css` line 1881 already uses `background:var(--set-color,var(--color-primary))`.
- **Deviations from spec:** PTR-06-C required no code change — was already implemented.
- **Known issues:** None observed.

---

## [PTR-07] Stations & Novena Minor Polish

**Files:** `css/app.css`

### Stations

The Stations tool is the strongest on both mobile and desktop. The landing page is contemplative, the V/R formatting works well, the meditation and prayer cards are cleanly structured. No major issues.

**Minor polish:**

#### PTR-07-A: Reduce MEDITATION/PRAYER label size

The "MEDITATION" and "PRAYER" labels inside the cards are uppercase at standard size. They feel slightly loud for the contemplative context. Reduce to `font-size: 11px` and `letter-spacing: 0.06em` for a more restrained feel — matching the Rosary's "1ST SORROWFUL MYSTERY" styling approach.

### Novena

The Novena listing (image 9) is clean. The day view (image 2) shows the prayer content well. The "Day 1 Complete ✓ / Done" footer buttons work.

**Minor polish:**

#### PTR-07-B: Novena dot navigation consistency

The Novena uses 9 dots at the top. Ensure they match the same sizing and transition as the Rosary and Stations dots. Currently they may have slightly different implementations since each module builds its own dot HTML.

Consider extracting dot rendering to a shared utility if not already shared — but this is a P3 polish item, not a P0 fix.

### Test Checklist

- [ ] Stations: MEDITATION/PRAYER labels slightly smaller
- [ ] Novena: dots match Rosary/Stations visual style
- [ ] No regressions in either module's core functionality

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — changed `.stations-meditation-label, .stations-prayer-label` `font-size` from `var(--text-xs)` (~13px) to `11px`. Changed `.novena-dot` from `width:14px;height:14px` to `10px;10px`; `.novena-dot.active` from hardcoded `#1E6B4A;scale(1.3);box-shadow` to `var(--color-primary);scale(1.4);no box-shadow`; `.novena-dot.done` from hardcoded `#1E6B4A;opacity:0.5` to `var(--color-primary);opacity:0.5`.
- **Approach:** CSS-only changes. Stations labels reduced 2px. Novena dots reduced from 14px to 10px and aligned with the design token approach (using `--color-primary` instead of hardcoded green). The existing dark mode rule at line 2168 already handles `html[data-theme="dark"] .novena-dot { background:var(--color-border) }` which remains valid.
- **Deviations from spec:** Novena dot size set to 10px (not 8px as exam dots) since the novena dots render inside the reader body where slightly more visual weight is appropriate (not in the header-extra area). `.novena-master-dot` (the listing page dots) was not changed as it has a different visual context.
- **Known issues:** None observed.

---

## [PTR-08] Dead CSS Cleanup

**Files:** `css/app.css`

### The Problem

Lines 2607-2730 contain ~120 lines of desktop media queries targeting `.rosary-overlay`, `.exam-overlay`, `.stations-overlay`, `.novena-overlay`. These classes are **never rendered in the DOM** — the universal reader system replaced all four standalone overlays with `#readerOverlay .reader-overlay`. The old class-based CSS is entirely dead code.

### Proposed Fix

Remove the following CSS blocks:
- Lines 2607-2663: `@media (min-width:768px)` rules for `.rosary-overlay`, `.stations-overlay`, `.novena-overlay`, `.exam-overlay` headers, bodies, footers, progress bars, navs
- Lines 2665-2686: Desktop background overrides for the same classes
- Lines 2698-2730: Dark mode desktop overrides for the same classes

These ~120 lines can be safely deleted. They reference classes that don't exist in the DOM, so removal has zero visual impact.

**Verify before deleting:** `grep -r "rosary-overlay\|exam-overlay\|stations-overlay\|novena-overlay" index.html src/` — if these classes appear nowhere in HTML or JS, the CSS is confirmed dead.

### Test Checklist

- [ ] Grep confirms no HTML/JS references to old overlay classes
- [ ] All four prayer tools render correctly after CSS removal
- [ ] Desktop and mobile tested
- [ ] File size reduced by ~3-4KB

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — deleted lines 2757–2835 (two dead `@media (min-width:768px)` blocks targeting `.rosary-overlay`, `.stations-overlay`, `.novena-overlay`, `.exam-overlay` and their children). Surgically edited the dark mode `@media (min-width:768px)` block: removed dead prayer overlay selectors from the combined background rule (lines 2851–2854), removed dead header/body/nav rules (lines 2856–2869), preserved `.settings-overlay` and `.explore-overlay` rules which were live in the same block.
- **Approach:** Ran `grep -r "rosary-overlay|exam-overlay|stations-overlay|novena-overlay" index.html src/` first — confirmed zero matches. The dark mode block was mixed (contained both dead prayer overlay classes and live settings/explore classes), requiring surgical editing rather than full deletion. Replaced the dead `@media` comment with a one-line note explaining the removal.
- **Deviations from spec:** None.
- **Known issues:** The `@media print` rule at line 1076 still references `.rosary-overlay` etc. — these are harmless (dead selectors in print context don't affect rendering) but could be cleaned up in a future pass.

---

## Cross-Cutting Concerns

### Implementation Priority

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| PTR-01 iOS scroll-through bug | 1 hr | Critical — data loss + app-breaking | **P0** |
| PTR-02 Desktop backdrop | 1 hr | High — transforms desktop experience | **P0** |
| PTR-03 Exam section-by-section | 3 hrs | High — core UX restructure | **P1** |
| PTR-04 Exam progress/dots | 30 min | Medium — builds on PTR-03 | **P1** |
| PTR-08 Dead CSS cleanup | 15 min | Low — hygiene | **P1** |
| PTR-05 Accent line polish | 10 min | Low — minor visual | **P2** |
| PTR-06 Rosary polish | 45 min | Medium — nice-to-have | **P2** |
| PTR-07 Stations/Novena polish | 20 min | Low — minor visual | **P3** |

### Dependencies

- PTR-04 depends on PTR-03 (dot navigation only makes sense with section-by-section flow)
- PTR-02 should be implemented before PTR-06 (desktop sizing changes depend on the new card layout)
- PTR-01 should be implemented first — it's the only ship blocker

### Regression Risk

| Fix | Risk Area |
|-----|-----------|
| PTR-01 body position:fixed | May affect detail panel, event panel, filters overlay — test all overlays |
| PTR-01 -webkit-overflow-scrolling removal | Scroll feel on older iOS — test iPhone SE/8 if accessible |
| PTR-02 desktop layout change | CCC sheet, Bible sheet also use reader overlay — verify they get backdrop too |
| PTR-03 exam restructure | Checked items must persist across section navigation — verify with 10+ checked items |
| PTR-08 CSS removal | Zero risk if grep confirms dead code — but grep first |

### Dark Mode Checklist

- PTR-01: No visual changes
- PTR-02: Desktop backdrop, card background, shadow — all need dark overrides
- PTR-03: Section hero numeral, question highlighting, dot colors
- PTR-05: Accent line opacity on dark background
- PTR-06: Bead scaling has no color impact; Begin button color works via CSS variable
