# MassFinder — UX Spec: Backlog Triage Round 2

**Spec prefix:** BT2 (Backlog Triage 2)
**Created:** 2026-03-13
**Status:** Implemented
**Backlog items addressed:** IDEA-021, IDEA-010, IDEA-017, IDEA-005

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| BT2-01 | Examen: CCC Pill Tap Toggles Parent Checkbox | P1 | Done |
| BT2-02 | Saved Tab: Schedule Time Column Alignment | P1 | Done |
| BT2-03 | Map: Filter Chips Overlap Zoom/Location Controls | P1 | Done |
| BT2-04 | Readings: Psalm Rendering Graceful Fallback | P2 | Done |

---

## BT2-01 — Examen: CCC Pill Tap Toggles Parent Checkbox

**Backlog ref:** IDEA-021
**Severity:** Bug (interaction)
**Files:** `src/examination.js` (lines 94–101 classic mode, lines 445–451 section-by-section mode), `src/refs.js` (line 42), `css/app.css` (line 2302, 2318)

### Problem

Tapping a CCC reference pill (e.g., "CCC 2180") inside an Examen question incorrectly toggles the parent checkbox. The pill is rendered by `refs.renderRef()` which includes `event.stopPropagation()` in its onclick — but the pill sits inside a `<label class="exam-q">` element that wraps an `<input type="checkbox">`. In HTML, clicking *anywhere* inside a `<label>` triggers its associated input via the browser's native label-input association. `stopPropagation()` prevents event bubbling up the DOM tree, but does **not** prevent the label's native toggle behavior — only `event.preventDefault()` on the label's click event (or restructuring the DOM) would do that.

The bug exists in **both** rendering paths:
- Classic accordion mode: `_renderSection()` at ~line 94
- Section-by-section flow: `_renderCurrentSection()` at ~line 445

### User stories

- **72-year-old:** Tapping the small "CCC 2180" pill to learn what the Catechism says. Inadvertently marks a sin they didn't commit. Confusing, potentially distressing in the context of preparing for Confession.
- **25-year-old:** Taps the pill, sees the checkbox toggle. Thinks the app is broken. Loses trust in the tool.
- **45-year-old parent:** Quickly reviewing Examen items. Accidentally selects items via pill taps while scrolling. Summary at the end includes items they didn't intend.

### Spec

**Root cause fix — two changes needed:**

1. **In `src/refs.js` line 42:** Add `event.preventDefault();` alongside the existing `event.stopPropagation();` in the rendered onclick handler. This prevents the label's native checkbox-toggle behavior when the ref-tap span is clicked.

   **Before:**
   ```
   onclick="event.stopPropagation();window._refTap(...)
   ```
   **After:**
   ```
   onclick="event.stopPropagation();event.preventDefault();window._refTap(...)
   ```

2. **Touch target enlargement for ref-tap pills inside exam questions.** The `.ref-tap` span inside `.exam-q-ref` inherits the label's styling but has no explicit minimum touch area. Add CSS to ensure the pill is comfortably tappable without hitting the surrounding label area.

   **In `css/app.css`, add after line 2318 (`.exam-q-ref`):**
   ```css
   .exam-q-ref .ref-tap {
     display: inline-block;
     min-height: 32px;
     line-height: 32px;
     padding: 0 var(--space-3);
   }
   ```

### Dark mode

No dark mode changes needed — `.ref-tap` already has dark mode color overrides.

### Cascading impacts

- The `event.preventDefault()` addition is in `refs.js` which is used universally. However, `preventDefault()` only suppresses the *default action* of the click target's containing label — it has no effect when ref-taps are rendered outside labels (e.g., in CCC sheet, readings, rosary). Safe to apply globally.
- Both rendering paths in examination.js produce the same `<label>` wrapping structure. The fix in refs.js covers both automatically.
- No changes needed in `snippet.js` — the snippet display logic is downstream and unaffected.

### Test checklist

- [ ] Classic accordion mode: tap CCC pill → snippet appears, checkbox does NOT toggle
- [ ] Section-by-section flow: tap CCC pill → snippet appears, checkbox does NOT toggle
- [ ] Tap the checkbox itself → still toggles correctly
- [ ] Tap the question text area → still toggles correctly (label behavior preserved for non-ref areas)
- [ ] Keyboard: Enter/Space on ref-tap → snippet appears, checkbox does NOT toggle
- [ ] CCC pills in rosary, stations, CCC sheet → still work correctly (no regression)
- [ ] Touch target: pill is comfortably tappable on mobile without accidentally hitting checkbox area

---

## BT2-02 — Saved Tab: Schedule Time Column Alignment

**Backlog ref:** IDEA-010
**Severity:** Bug (visual)
**Files:** `css/app.css` (line 1262, 1285), `src/saved.js` (lines 122–162)

### Problem

The `.sched-time` element uses `min-width: 72px` for regular rows and `min-width: 110px` for hero rows. Services with end times render as "3:00 – 4:00 PM" (roughly 120px at `--text-sm`) which overflows the 72px minimum, pushing the adjacent `.sched-info` column to an inconsistent left edge. The result is a ragged time column where rows with start-only times (e.g., "8:30 AM") align at one width and rows with time ranges align at a wider width.

### User stories

- **72-year-old:** Scanning the Today card for service times. The misaligned columns make it harder to quickly identify times — the eye has to re-anchor for each row.
- **25-year-old:** Notices the misalignment instantly. Feels unpolished, like a layout bug.
- **45-year-old parent:** Trying to compare times across multiple saved churches. Ragged alignment slows down the one-handed scan.

### Spec

1. **Widen `.sched-time` min-width.** Change from `72px` to `92px`. This accommodates the longest common time string ("12:30 – 1:30 PM" ≈ 88px at `--text-sm` with tabular-nums).

   **In `css/app.css` line 1262:**
   ```css
   /* Before */
   .sched-time { ... min-width:72px; ... }
   /* After */
   .sched-time { ... min-width:92px; ... }
   ```

2. **Add `text-align: right` to `.sched-time`.** Right-aligning the time column ensures the colon in times like "8:30" and "12:30" roughly aligns, giving a cleaner visual column. Combined with the existing `font-variant-numeric: tabular-nums`, this produces a proper table-like alignment.

   **In `css/app.css` line 1262, add:**
   ```css
   .sched-time { ... text-align:right; ... }
   ```

3. **Hero row min-width stays at 110px** (line 1285) — no change needed, already wide enough.

4. **Tomorrow card inherits same fix.** The `.saved-tomorrow-card .sched-time` override on line 1298 only changes color — the min-width fix cascades automatically.

### Dark mode

No dark mode changes — this is purely a layout/spacing fix.

### Cascading impacts

- The `.sched-time` class is only used in `saved.js` `_renderSchedRow()`. It does not appear in the Find tab or detail panel (those use `.detail-coming-time` and `.schedule-inline-time` respectively).
- The hero row override (`.sched-row--hero .sched-time`) already has `min-width: 110px` and `--text-2xl`, so the min-width increase only affects regular rows.

### Test checklist

- [ ] Regular rows: times with and without end-times align at the same left edge of `.sched-info`
- [ ] Hero row: still displays correctly at 110px min-width with `--text-2xl`
- [ ] Tomorrow preview rows: times align consistently
- [ ] Long time ranges ("12:30 – 1:30 PM") don't overflow or wrap
- [ ] Tabular-nums still active (verify consistent digit widths)
- [ ] Right-alignment: single times (e.g., "8:30 AM") sit flush-right within the time column
- [ ] Light + dark mode: no visual regressions

---

## BT2-03 — Map: Filter Chips Overlap Zoom/Location Controls

**Backlog ref:** IDEA-017
**Severity:** Bug (interaction)
**Files:** `css/app.css` (lines 1170–1182), `src/map.js` (lines 190–225)

### Problem

The `.map-chip-bar` is positioned at `top: var(--space-3)` (12px from the top of the map container). Leaflet's default zoom control renders at top-left with approximately 60px total height. The chip bar visually overlaps the zoom buttons and may also conflict with the GPS/location button at top-right. For users with large fingers or accessibility needs, this creates tap-target conflicts where pressing a chip accidentally triggers zoom, or vice versa.

The `.map-filter-pill` (the "Showing: Confession" persistent indicator) is positioned at `top: calc(var(--space-3) + 48px)`, which also sits in the zoom control zone.

### User stories

- **72-year-old:** Trying to zoom in to find a nearby church. Thick fingers hit a filter chip instead of the zoom button. Frustrating and disorienting on a map interface.
- **25-year-old:** Expects Apple Maps-level polish where controls don't overlap. Overlap feels amateur.
- **45-year-old parent:** One-handed use. Needs zoom and filter to be spatially separated for reliable tapping.

### Spec

1. **Move `.map-chip-bar` below the Leaflet zoom control.** Change `top` from `var(--space-3)` to `76px`. This clears the zoom control (typically 62px tall with default Leaflet styling) plus breathing room.

   **In `css/app.css` line 1170:**
   ```css
   /* Before */
   .map-chip-bar { position:absolute;top:var(--space-3); ... }
   /* After */
   .map-chip-bar { position:absolute;top:76px; ... }
   ```

2. **Adjust `.map-filter-pill` position.** It currently uses `top: calc(var(--space-3) + 48px)`. Update to sit below the chip bar: `top: 124px` (76px chip bar + 36px chip height + 12px gap).

   **In `css/app.css` line 1179:**
   ```css
   /* Before */
   .map-filter-pill { position:absolute;top:calc(var(--space-3) + 48px); ... }
   /* After */
   .map-filter-pill { position:absolute;top:124px; ... }
   ```

3. **When chip bar is absent (no standalone chips rendered), the filter pill should revert to a higher position.** Add a fallback: if `.map-chip-bar` has no children or is hidden, the filter pill repositions. This is handled by the existing pill logic in `map.js` — the pill only renders when a filter is active. When chips AND pill coexist, both are visible at their respective positions. When only the pill exists (navigated from Find tab with a filter), it should use `top: 76px` as well to stay below zoom controls.

   **Add to `css/app.css` after the filter pill block:**
   ```css
   .map-filter-pill:only-child { top: 76px; }
   ```
   
   Actually, the pill and chip bar are siblings inside the map container. A cleaner approach: always position the pill at 76px, and when the chip bar is present, the pill moves to 124px via a sibling combinator:
   ```css
   .map-filter-pill { position:absolute;top:76px; ... }
   .map-chip-bar ~ .map-filter-pill { top:124px; }
   ```

4. **Ensure chip bar doesn't overlap the location/GPS button.** The chip bar uses `right: var(--space-3)` which may overlap a custom location button. Add `right: 52px` to leave room for a 40px location button + margin. If the location button is Leaflet's default (bottom-right), this is already fine.

   Check the actual location button position in the app first — if it's at top-right, the right margin needs adjustment. If it's at bottom-right (Leaflet default), no change needed.

### Dark mode

Dark mode chip styles already exist at lines 1175–1176. No changes needed for the repositioning.

### Cascading impacts

- The map container uses `position: relative` so absolute positioning of children is relative to it — safe.
- The chip bar z-index (501) is above the map tiles but below the detail panel (1001). The zoom control default z-index in Leaflet is typically 1000, but MassFinder may have overridden it. Verify no z-index conflicts.
- The filter pill z-index (500) is below the chip bar (501) — correct stacking order maintained.

### Test checklist

- [ ] Zoom in/out buttons: fully accessible, no overlap with chips
- [ ] Chip bar: all 4 chips (All, Today, Confession, Adoration) visible and tappable
- [ ] Filter pill: shows below chip bar when a filter is active
- [ ] Filter pill without chip bar: shows at 76px (below zoom controls)
- [ ] Location button: not overlapped by chips or pill
- [ ] Desktop: wider viewport — chips don't stretch awkwardly
- [ ] Mobile: chips scroll horizontally as expected
- [ ] Dark mode: chip/pill styling preserved at new positions
- [ ] Tap targets: verify ≥ 44pt separation between zoom control and nearest chip

---

## BT2-04 — Readings: Psalm Rendering Graceful Fallback

**Backlog ref:** IDEA-005
**Severity:** Bug (visual)
**Files:** `src/readings.js` (lines 573–610, 639–665, 667–690), `css/app.css` (lines 1896–1903)

### Problem

The Responsorial Psalm relies on the BibleGet API (`query.bibleget.io/v3/`) for full verse text. When the API is rate-limited, times out, or returns errors, the `enhanceWithBibleGet()` function catches the error and silently falls back — but it falls back to *nothing*, leaving whatever the lectionary API initially provided. The lectionary text is typically a raw block without psalm formatting (no refrain markers, no stanza breaks, no verse indentation). Users see unformatted prose where they expect liturgical psalm structure.

The function already extracts a refrain via `extractPsalmRefrain()` and attempts stanza rendering via `renderPsalmVerses()` — but only when BibleGet succeeds. The fallback path (the `.catch()` block at line 610) just logs an error and does nothing.

### User stories

- **72-year-old:** Opens Today's Readings to pray along. The psalm renders as a raw paragraph of text without the familiar "R." markers they expect from their missalette. Confused, may think the app is broken.
- **25-year-old:** Sees polished formatting for the First Reading and Gospel but a raw text dump for the Psalm. Inconsistency erodes trust.
- **45-year-old parent:** Leading family prayers. The psalm response ("R. Lord, heal my soul...") is missing — they don't know what to say between stanzas.

### Spec

1. **Add a `formatPsalmFallback()` function** in `readings.js` that takes the raw lectionary psalm text and applies basic liturgical formatting without BibleGet data:
   - Extract the refrain using the existing `extractPsalmRefrain()` function
   - Split remaining text into stanzas by double-newline or paragraph breaks
   - Wrap each stanza in `<span class="psalm-verse">...</span>`
   - Insert `<span class="psalm-r-marker">R.</span>` between stanzas
   - Wrap refrain in `<span class="psalm-refrain">R. [refrain text]</span>` at top

2. **Call `formatPsalmFallback()` in two places:**

   a. **In the `.catch()` block of `enhanceWithBibleGet()` (line 610):** When the API fails, apply fallback formatting to `textEl` using the original `fallbackText`:
   ```javascript
   .catch(function(e) {
     console.error('[BibleGet] Error for:', ref, e.message || e);
     if (isPsalm && fallbackText) {
       textEl.innerHTML = formatPsalmFallback(fallbackText);
     }
   });
   ```

   b. **In the empty-results guard (line 590):** When `data.results` is empty (rate-limited), apply the same fallback:
   ```javascript
   if (!data.results || !data.results.length) {
     console.warn('[BibleGet] No results for:', ref);
     if (isPsalm && fallbackText) {
       textEl.innerHTML = formatPsalmFallback(fallbackText);
     }
     return;
   }
   ```

3. **The `formatPsalmFallback()` function:**
   ```javascript
   function formatPsalmFallback(raw) {
     if (!raw) return '';
     var refrain = extractPsalmRefrain(raw);
     var html = '';
     if (refrain) html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
     // Remove refrain line from body
     var body = raw;
     if (refrain) {
       body = body.replace(refrain, '').trim();
       // Also remove any leading "R." or "R:" prefix
       body = body.replace(/^R[\.\:]\s*/i, '').trim();
     }
     // Split into stanzas by double newline or <br><br> or \n\n
     var stanzas = body.split(/\n\s*\n|<br\s*\/?>\s*<br\s*\/?>/).filter(function(s) {
       return s.trim().length > 0;
     });
     for (var i = 0; i < stanzas.length; i++) {
       var lines = stanzas[i].trim().split(/\n|<br\s*\/?>/).filter(function(l) {
         return l.trim().length > 0;
       });
       var stanzaHtml = '';
       for (var j = 0; j < lines.length; j++) {
         stanzaHtml += '<span class="psalm-verse-line">' + esc(lines[j].trim()) + '</span>';
       }
       html += '<span class="psalm-verse">' + stanzaHtml + '</span>';
       if (i < stanzas.length - 1) {
         html += '<span class="psalm-r-marker">R.</span>';
       }
     }
     return html;
   }
   ```

4. **Do NOT cache fallback-formatted psalms.** The BibleGet-enhanced version is superior. Only cache API-sourced results (current behavior). If the API succeeds on a future load, the cached version will replace the fallback.

### Dark mode

No dark mode changes — psalm CSS classes (`.psalm-refrain`, `.psalm-verse`, `.psalm-r-marker`) already have correct color token usage via `--color-primary`, `--color-accent-text`, etc.

### Cascading impacts

- `formatPsalmFallback()` is a new local function in `readings.js`. It uses `extractPsalmRefrain()` and `esc()` which are already available in scope.
- The existing `formatPsalm()` function (line 706) is used for a different path (initial lectionary rendering). `formatPsalmFallback()` is only used in the BibleGet error/empty paths.
- The `textEl.innerHTML` assignment in the fallback is the same pattern already used in the success path — no structural change.

### Test checklist

- [ ] With BibleGet available: psalm renders with full verse formatting (existing behavior, no regression)
- [ ] With BibleGet rate-limited (empty results): psalm renders with fallback formatting — refrain at top, stanzas separated by R. markers
- [ ] With BibleGet timeout/network error: same fallback formatting applied
- [ ] Refrain extraction: verify "R." prefix on first line, italicized, with accent border
- [ ] Multi-stanza psalms: R. markers appear between stanzas
- [ ] Single-stanza psalms: no trailing R. marker
- [ ] Fallback result is NOT cached in localStorage (verify no `mf-bg-` key written)
- [ ] Dark mode: psalm-refrain, psalm-verse, psalm-r-marker colors correct
- [ ] Non-psalm readings: no change in behavior when BibleGet fails

---

## BT2-01 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/refs.js` — added `event.preventDefault()` in onclick handler; `css/app.css` — added `.exam-q-ref .ref-tap` touch target rule
- **Approach:** Two-pronged fix: (1) `event.preventDefault()` in the rendered onclick handler prevents the browser's native label-input association from toggling the checkbox when a ref-tap span inside a `<label class="exam-q">` is clicked. (2) CSS gives the pill a 32px min-height with horizontal padding for comfortable touch target separation.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT2-02 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — `.sched-time` min-width 72px → 92px, added text-align:right
- **Approach:** Pure CSS change. Widened min-width accommodates time ranges like "12:30 – 1:30 PM". Right-alignment ensures colons in times like "8:30" and "12:30" roughly align, producing cleaner visual columns with the existing tabular-nums.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT2-03 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — `.map-chip-bar` top changed from `var(--space-3)` to `76px`; `.map-filter-pill` top changed to `76px` base with `124px` via `.map-chip-bar ~ .map-filter-pill` sibling combinator
- **Approach:** Moved chip bar below Leaflet zoom controls (62px tall + margin). Filter pill uses sibling combinator to position at 124px when chip bar is present, 76px when standalone. No JS changes needed — pure CSS repositioning.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT2-04 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/readings.js` — added `formatPsalmFallback()` function; updated empty-results guard and `.catch()` block in `enhanceWithBibleGet()` to call it
- **Approach:** New `formatPsalmFallback()` takes raw lectionary text, extracts refrain via existing `extractPsalmRefrain()`, splits body into stanzas by double-newline, wraps in psalm-verse/psalm-verse-line spans with R. markers between stanzas. Called in both the empty-results guard (rate-limited) and the .catch() block (network/timeout errors). Fallback results are deliberately NOT cached to prefer BibleGet-sourced results on future loads.
- **Deviations from spec:** None.
- **Known issues:** None observed.
