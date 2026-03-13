# Claude Code Implementation Prompt — BT2 Series

**Spec:** `docs/plans/UX_Spec_Backlog_Triage_Round2.md`
**Prefix:** BT2

---

## Instructions

Implement the BT2 spec series in priority order. Read the full spec before starting. Each item has exact file paths, before/after descriptions, and test checklists.

**Priority order:** BT2-01 → BT2-02 → BT2-03 → BT2-04

**Rules:**
- Use only CSS custom properties (tokens) from `:root` — never hardcode colors except in `color-mix()` fallbacks
- SVG only — no emoji, no Unicode decorative characters
- All new elements need `html[data-theme="dark"]` overrides
- Touch targets ≥ 44×44pt on all interactive elements
- `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair) for headings, `--font-body` (Source Sans) for UI
- CommonJS everywhere, no arrow functions
- Test each item against its checklist before moving to the next

---

## BT2-01 — Examen CCC Pill Fix (P1)

**Files:** `src/refs.js` (line 42), `css/app.css` (after line 2318)

1. In `src/refs.js` `renderRef()`: In the onclick attribute string (line 42), add `event.preventDefault();` immediately after the existing `event.stopPropagation();`:
   - Before: `onclick="event.stopPropagation();window._refTap(...)`
   - After: `onclick="event.stopPropagation();event.preventDefault();window._refTap(...)`
   
2. In `css/app.css`, add after the `.exam-q-ref` rule (line 2318):
   ```css
   .exam-q-ref .ref-tap { display:inline-block;min-height:32px;line-height:32px;padding:0 var(--space-3); }
   ```

**Verify:** Open Examen → tap a CCC pill → snippet appears, checkbox does NOT toggle. Tap checkbox itself → still toggles. Test both classic accordion and section-by-section flow modes.

## BT2-02 — Saved Tab Time Alignment (P1)

**Files:** `css/app.css` (line 1262)

1. In `.sched-time` rule (line 1262), change `min-width:72px` to `min-width:92px` and add `text-align:right`:
   - Before: `.sched-time { font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-text-primary);min-width:72px;flex-shrink:0;font-variant-numeric:tabular-nums; }`
   - After: `.sched-time { font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-text-primary);min-width:92px;flex-shrink:0;font-variant-numeric:tabular-nums;text-align:right; }`

**Verify:** Open Saved tab with churches that have services with end times (e.g., Confession 3:00–4:00 PM) alongside services without (e.g., Mass 8:30 AM). Time columns should align cleanly. Check hero row still looks correct.

## BT2-03 — Map Chip/Zoom Overlap Fix (P1)

**Files:** `css/app.css` (lines 1170, 1179)

1. In `.map-chip-bar` (line 1170), change `top:var(--space-3)` to `top:76px`

2. Replace the `.map-filter-pill` `top` positioning (line 1179):
   - Change `top:calc(var(--space-3) + 48px)` to `top:76px`
   
3. Add a sibling combinator rule after the `.map-filter-pill` block:
   ```css
   .map-chip-bar ~ .map-filter-pill { top:124px; }
   ```

**Verify:** Open Map tab. Zoom buttons (top-left) should be fully clear of the chip bar. Chips sit below zoom controls. Filter pill sits below chips when both are present. When only filter pill is present (navigate from Find tab with a filter), pill sits at 76px below zoom controls. Test on mobile viewport.

## BT2-04 — Psalm Rendering Fallback (P2)

**Files:** `src/readings.js` (after line 665, lines 590 and 610)

1. Add `formatPsalmFallback()` function after the existing `extractPsalmRefrain()` function (after line ~690):
   ```javascript
   function formatPsalmFallback(raw) {
     if (!raw) return '';
     var refrain = extractPsalmRefrain(raw);
     var html = '';
     if (refrain) html += '<span class="psalm-refrain">R. ' + esc(refrain) + '</span>';
     var body = raw;
     if (refrain) {
       body = body.replace(refrain, '').trim();
       body = body.replace(/^R[\.\:]\s*/i, '').trim();
     }
     var stanzas = body.split(/\n\s*\n/).filter(function(s) { return s.trim().length > 0; });
     for (var i = 0; i < stanzas.length; i++) {
       var lines = stanzas[i].trim().split(/\n/).filter(function(l) { return l.trim().length > 0; });
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

2. In `enhanceWithBibleGet()`, in the empty-results guard (~line 590), add fallback:
   ```javascript
   if (!data.results || !data.results.length) {
     console.warn('[BibleGet] No results for:', ref, '(likely rate-limited)');
     if (isPsalm && fallbackText) {
       textEl.innerHTML = formatPsalmFallback(fallbackText);
     }
     return;
   }
   ```

3. In the `.catch()` block (~line 610), add fallback:
   ```javascript
   .catch(function(e) {
     console.error('[BibleGet] Error for:', ref, e.message || e);
     if (isPsalm && fallbackText) {
       textEl.innerHTML = formatPsalmFallback(fallbackText);
     }
   });
   ```

4. Do NOT cache fallback results — only BibleGet-sourced results should be cached.

**Verify:** To test, temporarily add `return Promise.resolve();` as the first line of `enhanceWithBibleGet()` to simulate API failure. Open Today's Readings. The psalm should render with a refrain line, stanzas, and R. markers between stanzas. Remove the test line after verification.
