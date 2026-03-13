# MassFinder — UX Spec: Faith Guides & Prayer Polish

**Spec prefix:** FGP (Faith Guides & Prayer)
**Created:** 2026-03-13
**Status:** Implemented
**Backlog items addressed:** IDEA-011, IDEA-020

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| FGP-01 | Faith Guides: Icon System & Visual Hierarchy | P3 | Done |
| FGP-02 | Faith Guides: Progressive Disclosure Drawer | P3 | Done |
| FGP-03 | Faith Guides: Expanded State Accent & Polish | P3 | Done |
| FGP-04 | Rosary: "Mysteries Only" Condensed Mode | P3 | Done |

---

## FGP-01 — Faith Guides: Icon System & Visual Hierarchy

**Backlog ref:** IDEA-011
**Severity:** Refinement
**Files:** `src/devotions.js` (lines 121–261 data, lines 285–300 `renderGuide()`), `css/app.css` (lines 1588–1609)

### Problem

The Faith Guides in the More tab are visually plain. Every guide uses the same `devot-card` styling — a bordered card with a summary/details pattern. The `icon` field exists in the data structure but is set to empty string (`''`) for all 11 guides. Without icons, all guides have identical visual weight, making it hard to distinguish "The Sunday Obligation" (essential) from "Gorzkie Żale" (niche). The guides look like an afterthought compared to the polished Prayer Tools section above them.

### User stories

- **72-year-old:** Sees a wall of identical-looking cards in the faith guides section. Can't quickly find "How to go to Confession" because nothing distinguishes it visually from the others.
- **25-year-old:** Expects iconography and visual differentiation. The flat card list feels like a settings page, not a curated spiritual resource.
- **45-year-old parent:** Scanning for "Lent" guide during Lenten season. Has to read every title because the cards all look the same.

### Spec

1. **Add SVG icons to each guide in the data.** Update the `icon` field in `DEVOTIONAL_GUIDES` (src/devotions.js) with inline SVGs. Each icon should be a simple, meaningful 20×20 stroke-based SVG.

   Recommended icon assignments:
   - **Sunday Obligation:** church/chapel icon (building with cross)
   - **How to go to Confession:** key icon (keys of reconciliation)
   - **Lent:** cross icon (simple Latin cross)
   - **Traditional Latin Mass:** book icon (open missal)
   - **Devotions (group):** heart icon (Sacred Heart reference)
   - **Eucharistic Adoration:** monstrance-like radiance icon (circle with rays)
   - **Divine Mercy Chaplet:** rays icon (mercy rays)
   - **Novena:** flame icon (9-day devotion/candle)
   - **Miraculous Medal:** medal/circle icon
   - **Gorzkie Żale:** music note icon (hymn-based devotion)
   - **Stations of the Cross:** path/route icon (journey)

   **SVG template:** Each icon should follow the project's SVG conventions — `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, `stroke-width="2"`, `stroke-linecap="round"`, `stroke-linejoin="round"`.

2. **Style the icon container.** The `.devot-icon` class exists in the `renderGuide()` function (line 297) but has no CSS rules. Add:

   ```css
   .devot-icon {
     width: 36px;
     height: 36px;
     border-radius: var(--radius-sm);
     background: var(--color-accent-pale);
     display: flex;
     align-items: center;
     justify-content: center;
     flex-shrink: 0;
   }
   .devot-icon svg {
     width: 18px;
     height: 18px;
     color: var(--color-accent-text);
   }
   ```

3. **Dark mode icon container:**
   ```css
   html[data-theme="dark"] .devot-icon {
     background: var(--color-accent-pale);
   }
   ```
   (The `--color-accent-pale` already maps to `#2E2618` in dark mode — a warm dark tint. The SVG stroke uses `currentColor` → `--color-accent-text` which maps to `#D4A84B` in dark mode. Good contrast.)

4. **Adjust summary padding** to accommodate the icon. The summary currently has `padding: var(--space-4)` and `min-height: 52px` (line 1590). With the 36px icon, ensure vertical centering:
   ```css
   .devot-card summary {
     /* existing properties... */
     min-height: 56px;
   }
   ```

### Cascading impacts

- The `renderGuide()` function already checks `g.icon` and wraps it in `<span class="devot-icon">` (line 297). Once the data is populated, the icons will render automatically.
- The group header in `more.js` (line 247) also checks `g.icon` — groups will get icons too.
- Sub-guides (`.devot-sub`) render with the same `renderGuide()` — they'll get icons if populated. Consider leaving sub-guide icons empty for visual hierarchy (only top-level guides get icons).

### Test checklist

- [ ] All 5 top-level guides display colored icon containers
- [ ] Group header ("Devotions") displays its icon
- [ ] Sub-guides within the Devotions group: decide whether they get icons (recommendation: yes, for scannability)
- [ ] Icon containers: 36×36, rounded corners, accent-pale background
- [ ] SVGs: correct stroke style, 18×18 within container
- [ ] Dark mode: icon container uses dark accent-pale, SVG uses dark accent-text
- [ ] Summary row: vertically centered with icon present
- [ ] Lent guide during Lent: accent-pale shifts to purple tint (seasonal)

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/devotions.js` — replaced empty `icon:''` strings with inline SVGs for all 11 guides; `css/app.css` — added `.devot-icon` container rules (36×36, accent-pale bg, centered flex), dark mode override, bumped summary min-height to 56px
- **Approach:** Populated all 11 guide `icon` fields with stroke-based 24×24 SVGs. Initial icon set was revised per developer feedback — replaced Confession key with speech bubble, Lent cross made bolder (stroke-width 2.5), TLM closed book replaced with open book, Stations sub-guide cross reused from prayer tools. Sub-guides within Devotions group also get icons for scannability.
- **Deviations from spec:** Changed several recommended icons after visual review on device. Confession uses speech bubble instead of key (more intuitive). TLM uses open book instead of closed book (avoids phone/tablet appearance at 18px). Lent cross uses stroke-width 2.5 for visibility. Stations sub-guide reuses exact prayer tools cross instead of abstract path icon.
- **Known issues:** None observed

---

## FGP-02 — Faith Guides: Progressive Disclosure Drawer

**Backlog ref:** IDEA-011
**Severity:** Refinement
**Files:** `src/more.js` (lines 238–260), `css/app.css` (after line 1609)

### Problem

All 5 top-level guides (plus the Devotions group with 6 children) are displayed at once. For most users, the essential guides are "Sunday Obligation," "How to go to Confession," and "Lent" (during Lent). The others are valuable but secondary. Showing everything at once creates visual overwhelm and pushes the Catholic Library section below a long scroll.

### User stories

- **72-year-old:** Overwhelmed by the card count. Only needs the top 2–3 guides. The rest add cognitive load.
- **25-year-old:** Expects a curated, prioritized view. "Show me the essentials, let me explore the rest."
- **45-year-old parent:** Scrolls past 11+ cards to find the Catholic Library section below. Too much content density.

### Spec

1. **Show the top 3 guides by default, collapse the rest behind a "Show all" button.** In `more.js`, render the first 3 guides normally. Wrap guides 4+ in a `<div>` with `display: none` and a toggle button.

   **In `more.js` (~line 240), modify the rendering:**

   ```javascript
   var allHtml = DEVOTIONAL_GUIDES.map(function(g, idx) {
     if (g.isGroup) {
       // ... existing group rendering
     }
     return renderGuide(g, false);
   });

   // FGP-02: Progressive disclosure — show top 3, hide rest
   var visibleCount = 3;
   var visibleHtml = allHtml.slice(0, visibleCount).join('');
   var hiddenHtml = allHtml.slice(visibleCount).join('');

   devotEl.innerHTML = visibleHtml;
   if (hiddenHtml) {
     devotEl.innerHTML += '<div class="devot-overflow" id="devotOverflow" style="display:none">'
       + hiddenHtml + '</div>'
       + '<button class="devot-show-all" id="devotShowAll" onclick="toggleDevotOverflow()">'
       + 'Show all guides <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>'
       + '</button>';
   }
   ```

2. **Toggle function:**
   ```javascript
   window.toggleDevotOverflow = function() {
     var overflow = document.getElementById('devotOverflow');
     var btn = document.getElementById('devotShowAll');
     if (!overflow || !btn) return;
     var isHidden = overflow.style.display === 'none';
     overflow.style.display = isHidden ? '' : 'none';
     btn.innerHTML = isHidden
       ? 'Show fewer <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="18 15 12 9 6 15"/></svg>'
       : 'Show all guides <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="6 9 12 15 18 9"/></svg>';
   };
   ```

3. **CSS for the toggle button:**
   ```css
   .devot-show-all {
     display: flex;
     align-items: center;
     justify-content: center;
     gap: var(--space-2);
     width: 100%;
     padding: var(--space-3) var(--space-4);
     margin-top: var(--space-2);
     font-size: var(--text-sm);
     font-weight: var(--weight-semibold);
     color: var(--color-primary);
     background: none;
     border: 1px dashed var(--color-border);
     border-radius: var(--radius-md);
     cursor: pointer;
     -webkit-tap-highlight-color: transparent;
     min-height: 44px;
   }
   .devot-show-all:active {
     background: var(--color-surface-hover);
   }
   .devot-show-all svg {
     color: var(--color-text-tertiary);
     transition: transform 0.2s;
   }
   html[data-theme="dark"] .devot-show-all {
     color: var(--color-primary);
     border-color: var(--color-border);
   }
   ```

### Dark mode

Button uses token-based colors — dark mode inherits automatically. Added explicit dark override for border color safety.

### Cascading impacts

- The `initTermClicks()` and `initRefTaps()` calls in more.js (lines 253–260) need to run on the full set, including hidden cards. Since those cards are in the DOM (just `display: none`), the event delegation should still work. However, verify that term/ref tap handlers initialize correctly on hidden elements — if not, re-run initialization when overflow is shown.
- The visible count of 3 shows: Sunday Obligation, How to go to Confession, Lent. The Traditional Latin Mass and the Devotions group are in the overflow. This seems correct for priority ordering. If the order in `DEVOTIONAL_GUIDES` changes, the visible set changes too.

### Test checklist

- [ ] Initial load: 3 guide cards visible + "Show all guides" button
- [ ] Tap "Show all": remaining guides appear, button text changes to "Show fewer"
- [ ] Tap "Show fewer": guides collapse back, button text reverts
- [ ] Hidden guides: scripture/term taps still work after expanding
- [ ] Touch target: button ≥ 44pt height
- [ ] Dark mode: button styling correct
- [ ] Content below (Catholic Library): visible sooner with progressive disclosure

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/more.js` — split guide rendering at index 3 with overflow div and toggle button, added `toggleDevotOverflow()` function; `src/app.js` — wired `window.toggleDevotOverflow`; `css/app.css` — added `.devot-show-all` button rules (dashed border, flex, 44px min-height, dark mode)
- **Approach:** Built array of guide HTML, split at index 3 (Sunday Obligation, Confession, Lent visible by default). Remaining guides wrapped in `display:none` overflow div. Toggle button switches between "Show all guides" (chevron down) and "Show fewer" (chevron up). Event delegation for term/ref taps already runs on the full container including hidden elements.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## FGP-03 — Faith Guides: Expanded State Accent & Polish

**Backlog ref:** IDEA-011
**Severity:** Refinement
**Files:** `css/app.css` (lines 1588–1609)

### Problem

When a guide card is expanded (`<details open>`), it looks the same as when collapsed — no visual indicator beyond the chevron rotation. There's no accent treatment to reinforce which card is open. The transition from collapsed to expanded is abrupt.

### User stories

- **72-year-old:** Opens a guide but doesn't get a visual "you are here" signal. May lose track of which card is expanded after scrolling.
- **25-year-old:** Expects a polished expand/collapse with visual state change — like iOS accordion cards that tint or elevate when open.
- **45-year-old parent:** Quick visual scan of the guide section — can immediately see which card is open vs closed.

### Spec

1. **Add an accent left-border on expanded cards:**
   ```css
   .devot-card[open] {
     border-left: 3px solid var(--color-accent);
     border-left-color: var(--color-accent);
   }
   ```

2. **Add a subtle background tint on expanded cards:**
   ```css
   .devot-card[open] {
     background: linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);
   }
   ```

3. **Elevate the card shadow slightly when open:**
   ```css
   .devot-card[open] {
     box-shadow: var(--shadow-card-hover);
   }
   ```

4. **Combined rule:**
   ```css
   .devot-card[open] {
     border-left: 3px solid var(--color-accent);
     background: linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);
     box-shadow: var(--shadow-card-hover);
   }
   ```

5. **Dark mode:**
   ```css
   html[data-theme="dark"] .devot-card[open] {
     background: linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);
     box-shadow: var(--shadow-card-hover);
   }
   ```
   (The accent border uses `var(--color-accent)` which already has dark overrides. The `--color-accent-pale` in dark mode is `#2E2618` — a warm tint on the dark surface.)

6. **Smooth transition on the border and background:**
   ```css
   .devot-card {
     /* existing properties... */
     transition: border-left-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
   }
   ```

### Cascading impacts

- This affects all `<details class="devot-card">` elements — both top-level guides and the "Devotions" group header. Sub-guides (`.devot-sub`) also use `.devot-card` but have their own overrides — verify the expanded state doesn't produce a double-tint effect on sub-guides inside an already-expanded group.
- The accent uses `var(--color-accent)` which shifts with liturgical season — so guides will have a purple tint in Lent, gold in Easter, green in Ordinary Time. This is a nice touch.

### Test checklist

- [ ] Collapsed card: no accent border, standard surface background, standard shadow
- [ ] Expanded card: accent left border, gradient background, elevated shadow
- [ ] Transition: smooth color/shadow change on expand/collapse
- [ ] Sub-guides inside expanded "Devotions" group: no double-tint effect
- [ ] Dark mode: accent border visible, gradient subtle, shadow appropriate
- [ ] All five liturgical seasons: accent color shifts correctly
- [ ] Multiple cards expanded simultaneously: each has its own accent independently

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — added transition to `.devot-card`, added `.devot-card[open]` rule (accent left border, gradient background, elevated shadow), dark mode override, `.devot-card[open] .devot-sub[open]` override to prevent double-tint
- **Approach:** Pure CSS solution using `[open]` attribute selector on `<details>`. Added smooth transitions for border, background, and box-shadow. Sub-guide override uses `var(--color-surface)` background and thinner 2px accent border to maintain visual hierarchy within expanded parent groups.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## FGP-04 — Rosary: "Mysteries Only" Condensed Mode

**Backlog ref:** IDEA-020
**Severity:** New feature
**Files:** `src/rosary.js` (lines 390–475 `_renderDecade()`, lines 330–340 `_renderScreen()`, lines 490–506 `_prayerBlockCollapsible()`), `css/app.css` (rosary section)

### Problem

Experienced pray-ers who know the rosary prayers by heart still see the full text of the Our Father, Hail Mary, Glory Be, and O My Jesus on every decade. For someone praying during a commute or in a quiet moment, the prayer text is unnecessary — they only need the mystery announcement, scripture reference, and a bead counter. The collapsible blocks (`_prayerBlockCollapsible()`) already exist, but each starts expanded and must be manually collapsed per-prayer, per-decade, which resets on every decade transition.

### User stories

- **72-year-old:** Knows every prayer by heart after decades of practice. The text is familiar but takes up screen space, requiring more scrolling. Would prefer a compact view.
- **25-year-old:** Uses the rosary app on the subway. Wants a minimal interface — mystery card + tap counter + swipe. The prayer blocks are visual noise they don't need.
- **45-year-old parent:** Praying during a lunch break. Wants to move through decades efficiently. Collapsing 4 prayer blocks × 5 decades = 20 taps of overhead.

### Spec

**Add a "Mysteries Only" toggle** that collapses all prayer text and persists the preference across the session. This leverages the existing `_prayerBlockCollapsible()` infrastructure.

1. **Add state variable** at the top of rosary.js:
   ```javascript
   var _condensedMode = false;
   ```

2. **Persist preference via localStorage** (not sessionStorage — this is a user preference that should survive app reloads):
   ```javascript
   try { _condensedMode = localStorage.getItem('mf-rosary-condensed') === '1'; } catch(e) {}
   ```

3. **Add a toggle button in the decade screen header area.** In `_renderDecade()`, add a toggle above the mystery card:
   ```javascript
   + '<div class="rosary-mode-toggle">'
   + '<button class="rosary-mode-btn' + (_condensedMode ? ' active' : '') + '" onclick="toggleRosaryCondensed()">'
   + (_condensedMode ? 'Show prayers' : 'Mysteries only')
   + '</button>'
   + '</div>'
   ```

4. **Control collapsible default state.** Modify `_prayerBlockCollapsible()` to check `_condensedMode`:
   ```javascript
   function _prayerBlockCollapsible(name, text, subtitle, isOpen) {
     // FGP-04: In condensed mode, default to collapsed
     var openAttr = _condensedMode ? '' : (isOpen ? ' open' : '');
     return '<details class="rosary-prayer-block rosary-prayer-collapsible"' + openAttr + '>'
       + ...
   }
   ```

   **Important:** The current `_prayerBlockCollapsible()` uses an `isOpen` parameter. In the decade rendering, the calls are:
   - `_prayerBlockCollapsible('Our Father', p.our_father)` — no isOpen, defaults to closed
   - `_prayerBlockCollapsible('Hail Mary', p.hail_mary)` — no isOpen, defaults to closed
   - `_prayerBlockCollapsible('Glory Be', p.glory_be)` — no isOpen, defaults to closed
   - `_prayerBlockCollapsible('O My Jesus', p.o_my_jesus, 'Fatima Prayer')` — no isOpen, defaults to closed

   So all prayer blocks already default to collapsed! The "condensed mode" simply needs to **ensure they stay collapsed and not be accidentally opened.** Actually, re-reading the code — the `<details>` elements start without `open` attribute, so they're already collapsed by default. The issue IDEA-020 describes is that users still see the prayer block headers (Our Father, Hail Mary, etc.) taking up space even when collapsed.

   **Revised approach:** In condensed mode, hide the prayer blocks entirely (not just collapse them). Only show the mystery card and bead counter.

5. **In condensed mode, skip rendering prayer blocks entirely:**
   ```javascript
   // In _renderDecade(), wrap prayer blocks in a conditional:
   var prayerBlocksHtml = '';
   if (!_condensedMode) {
     prayerBlocksHtml = _prayerBlockCollapsible('Our Father', p.our_father)
       + /* ... hail mary section stays always visible for bead counter ... */
       + _prayerBlockCollapsible('Glory Be', p.glory_be)
       + _prayerBlockCollapsible('O My Jesus', p.o_my_jesus, 'Fatima Prayer');
   }
   ```

   The Hail Mary bead counter section (`.rosary-hm-section`) should **always** render — it's the core interaction even in condensed mode. Only the Our Father, Glory Be, and O My Jesus text blocks are hidden. The Hail Mary text block within `.rosary-hm-section` can also be hidden.

6. **Also apply to opening/closing screens.** In `_renderOpening()` and `_renderClosing()`, wrap prayer blocks in the condensed conditional. In condensed mode, show only the section title and a brief reminder (e.g., "Sign of the Cross · Apostles' Creed · 3 Hail Marys") without full text.

7. **Toggle function:**
   ```javascript
   window.toggleRosaryCondensed = function() {
     _condensedMode = !_condensedMode;
     try { localStorage.setItem('mf-rosary-condensed', _condensedMode ? '1' : '0'); } catch(e) {}
     _renderScreen(); // Re-render current screen with new mode
   };
   ```

8. **CSS for the toggle button:**
   ```css
   .rosary-mode-toggle {
     display: flex;
     justify-content: flex-end;
     padding: 0 0 var(--space-2);
   }
   .rosary-mode-btn {
     font-size: var(--text-xs);
     font-weight: var(--weight-medium);
     color: var(--color-text-tertiary);
     background: none;
     border: 1px solid var(--color-border);
     border-radius: var(--radius-full);
     padding: var(--space-1) var(--space-3);
     cursor: pointer;
     min-height: 32px;
     -webkit-tap-highlight-color: transparent;
     transition: all var(--transition-fast);
   }
   .rosary-mode-btn.active {
     color: var(--color-primary);
     border-color: var(--color-primary);
     background: var(--color-primary-bg);
   }
   .rosary-mode-btn:active {
     opacity: 0.85;
   }
   html[data-theme="dark"] .rosary-mode-btn {
     border-color: var(--color-border);
     color: var(--color-text-tertiary);
   }
   html[data-theme="dark"] .rosary-mode-btn.active {
     color: var(--color-primary);
     border-color: var(--color-primary);
     background: var(--color-primary-bg);
   }
   ```

### Cascading impacts

- The `_renderScreen()` function dispatches to `_renderOpening()`, `_renderDecade()`, and `_renderClosing()`. All three need condensed-mode awareness.
- The bead counter logic in `_renderDecade()` is unaffected — it's independent of prayer text display.
- The `_prayerBlockCollapsible()` function is also used as-is — we're conditionally skipping its calls, not modifying it.
- The localStorage key `mf-rosary-condensed` is new. No collision with existing keys (all use `mf-` prefix).
- The opening/closing screens use `_prayerBlock()` (non-collapsible) — these should also be hidden in condensed mode.

### Test checklist

- [ ] Default state: condensed mode OFF, all prayer blocks visible (existing behavior)
- [ ] Tap "Mysteries only": prayer blocks disappear, mystery card + bead counter remain
- [ ] Button text changes to "Show prayers" in condensed mode
- [ ] Navigate between decades: condensed state persists
- [ ] Opening/closing screens: prayer text hidden in condensed mode, brief labels shown
- [ ] Bead counter: fully functional in both modes
- [ ] Swipe navigation: works in both modes
- [ ] Close and reopen rosary: condensed preference remembered (localStorage)
- [ ] Clear localStorage: reverts to full mode (default)
- [ ] Dark mode: toggle button styled correctly
- [ ] Touch target: toggle button ≥ 32px height, comfortably tappable
- [ ] Screen height: condensed decade screen is notably shorter (less scrolling)

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/rosary.js` — added `_condensedMode` state with localStorage persistence, toggle button in `_renderDecade()`, conditional prayer block rendering in decade/opening/closing screens, `toggleRosaryCondensed()` function; `src/app.js` — wired `window.toggleRosaryCondensed`; `css/app.css` — added `.rosary-mode-toggle`, `.rosary-mode-btn` (pill button, active state), `.rosary-condensed-summary` (italic prayer font), dark mode overrides
- **Approach:** Added `_condensedMode` boolean initialized from `localStorage.getItem('mf-rosary-condensed')`. In decade view, prayer blocks (Our Father, Hail Mary, Glory Be, O My Jesus) are conditionally rendered — hidden entirely in condensed mode while bead counter always shows. Opening and closing screens show a single-line italic summary (e.g. "Sign of the Cross · Apostles' Creed · 3 Hail Marys · Glory Be") instead of full prayer text. Toggle calls `_render()` to re-render current screen.
- **Deviations from spec:** Used `_render()` instead of `_renderScreen()` for the toggle re-render (they're equivalent — `_render()` dispatches to the current screen's render function). Did not modify `_prayerBlockCollapsible()` itself — used conditional rendering at the call sites instead, which is cleaner.
- **Known issues:** None observed
