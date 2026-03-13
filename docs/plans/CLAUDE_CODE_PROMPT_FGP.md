# Claude Code Implementation Prompt — FGP Series

**Spec:** `docs/plans/UX_Spec_Faith_Guides_Prayer.md`
**Prefix:** FGP

---

## Instructions

Implement the FGP spec series in order. Read the full spec before starting. Each item has exact file paths, before/after descriptions, and test checklists.

**Priority order:** FGP-01 → FGP-03 → FGP-02 → FGP-04

FGP-01 (icons) and FGP-03 (expanded state) are CSS-only changes and should be done first. FGP-02 (drawer) modifies the rendering logic. FGP-04 (rosary condensed mode) is the most complex and should be done last.

**Rules:**
- Use only CSS custom properties (tokens) from `:root` — never hardcode colors except in `color-mix()` fallbacks
- SVG only — no emoji, no Unicode decorative characters
- All new elements need `html[data-theme="dark"]` overrides
- Touch targets ≥ 44×44pt on all interactive elements
- `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair) for headings, `--font-body` (Source Sans) for UI
- CommonJS everywhere, no arrow functions
- Test each item against its checklist before moving to the next

---

## FGP-01 — Faith Guide Icons (P3)

**Files:** `src/devotions.js` (lines 122–261), `css/app.css` (after line 1609)

1. Replace the empty `icon:''` strings in `DEVOTIONAL_GUIDES` with inline SVGs. Use 24×24 viewBox, stroke-based, `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`. Each icon should be wrapped in the SVG tag only (no `<span>` — that's handled by `renderGuide()`).

   Recommended icons:
   - **Sunday Obligation:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/><line x1="12" y1="9" x2="12" y2="12"/><line x1="10.5" y1="10.5" x2="13.5" y2="10.5"/></svg>`
   - **How to go to Confession:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`
   - **Lent:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="22"/><line x1="4" y1="8" x2="20" y2="8"/></svg>`
   - **Traditional Latin Mass:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>`
   - **Devotions (group):** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`
   - **Eucharistic Adoration:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="6.76" y2="6.76"/><line x1="17.24" y1="17.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="6.76" y2="17.24"/><line x1="17.24" y1="6.76" x2="19.07" y2="4.93"/></svg>`
   - **Divine Mercy Chaplet:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="4"/><line x1="12" y1="20" x2="12" y2="23"/><line x1="1" y1="12" x2="4" y2="12"/><line x1="20" y1="12" x2="23" y2="12"/></svg>`
   - **Novena:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3 1.5 5.5 1.5 8A5.5 5.5 0 0 1 8 15.5c0 .34.03.67.09 1H6a7.5 7.5 0 0 1 6-12.5z"/><path d="M12 2c-1 3-1.5 5.5-1.5 8A5.5 5.5 0 0 0 16 15.5c0 .34-.03.67-.09 1H18a7.5 7.5 0 0 0-6-12.5z"/><line x1="12" y1="17" x2="12" y2="22"/></svg>`
   - **Miraculous Medal:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="8"/><path d="M12 5V2"/><circle cx="12" cy="2" r="1"/></svg>`
   - **Gorzkie Żale:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
   - **Stations of the Cross:** `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="18" r="2"/><circle cx="19" cy="6" r="2"/><path d="M7 18h3l6-8h1"/><path d="M10 6h4"/><path d="M12 4v4"/></svg>`

   Feel free to adjust these SVGs for visual balance. The key constraint is: stroke-based, 24×24 viewBox, matches the existing SVG conventions.

2. Add CSS after line 1609:
   ```css
   .devot-icon { width:36px;height:36px;border-radius:var(--radius-sm);background:var(--color-accent-pale);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
   .devot-icon svg { width:18px;height:18px;color:var(--color-accent-text); }
   html[data-theme="dark"] .devot-icon { background:var(--color-accent-pale); }
   ```

3. Update `.devot-card summary` min-height from `52px` to `56px`.

**Verify:** Open More tab, scroll to Faith Guides. Every guide should show a colored icon container with an appropriate SVG. Check dark mode.

## FGP-03 — Expanded State Accent (P3)

**Files:** `css/app.css` (after line 1594)

1. Add transition to `.devot-card` (line 1588 — append to existing rule):
   ```css
   transition: border-left-color var(--transition-fast), background var(--transition-fast), box-shadow var(--transition-fast);
   ```

2. Add expanded state rules:
   ```css
   .devot-card[open] { border-left:3px solid var(--color-accent);background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);box-shadow:var(--shadow-card-hover); }
   html[data-theme="dark"] .devot-card[open] { background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);box-shadow:var(--shadow-card-hover); }
   ```

3. For sub-guides (`.devot-sub`) inside an already-expanded parent, ensure no double-tint by scoping:
   ```css
   .devot-card[open] .devot-sub[open] { background:var(--color-surface);border-left:2px solid var(--color-accent);box-shadow:none; }
   ```

**Verify:** Expand a guide card — should show accent left border, gradient background, elevated shadow. Collapse — returns to normal. Check sub-guides inside Devotions group. Test all 3 liturgical season accent colors.

## FGP-02 — Progressive Disclosure Drawer (P3)

**Files:** `src/more.js` (lines 238–260), `css/app.css`

1. In `more.js`, modify the rendering in the `devotEl` block. Change the `.map().join('')` to build an array, then split at index 3:
   - First 3 guides rendered normally
   - Remaining guides wrapped in `<div class="devot-overflow" id="devotOverflow" style="display:none">`
   - "Show all guides" button appended after

2. Add `window.toggleDevotOverflow` function (see spec for exact code).

3. Ensure `initTermClicks()` and `initRefTaps()` still run on the full container (they already do — they run on `devotEl` which contains both visible and hidden cards).

4. Add CSS:
   ```css
   .devot-show-all { display:flex;align-items:center;justify-content:center;gap:var(--space-2);width:100%;padding:var(--space-3) var(--space-4);margin-top:var(--space-2);font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-primary);background:none;border:1px dashed var(--color-border);border-radius:var(--radius-md);cursor:pointer;-webkit-tap-highlight-color:transparent;min-height:44px; }
   .devot-show-all:active { background:var(--color-surface-hover); }
   .devot-show-all svg { color:var(--color-text-tertiary);transition:transform 0.2s; }
   html[data-theme="dark"] .devot-show-all { color:var(--color-primary);border-color:var(--color-border); }
   ```

**Verify:** More tab shows 3 faith guide cards + "Show all guides" button. Tap to expand/collapse. Scripture refs and term definitions still work in hidden-then-revealed cards.

## FGP-04 — Rosary Condensed Mode (P3)

**Files:** `src/rosary.js` (top-level state, `_renderDecade()`, `_renderOpening()`, `_renderClosing()`, `_prayerBlockCollapsible()`), `css/app.css`

This is the most complex item. Read the full spec carefully.

1. Add state variable after the existing state block (~line 21):
   ```javascript
   var _condensedMode = false;
   try { _condensedMode = localStorage.getItem('mf-rosary-condensed') === '1'; } catch(e) {}
   ```

2. In `_renderDecade()` (~line 390), add toggle button HTML before the mystery card:
   ```javascript
   + '<div class="rosary-mode-toggle">'
   + '<button class="rosary-mode-btn' + (_condensedMode ? ' active' : '') + '" onclick="toggleRosaryCondensed()">'
   + (_condensedMode ? 'Show prayers' : 'Mysteries only')
   + '</button>'
   + '</div>'
   ```

3. In `_renderDecade()`, wrap the prayer blocks (Our Father, Glory Be, O My Jesus, and the Hail Mary collapsible text) in a condensed-mode conditional:
   ```javascript
   + (_condensedMode ? '' : _prayerBlockCollapsible('Our Father', p.our_father))
   // Bead counter section ALWAYS renders (remove Hail Mary text block inside it if condensed)
   + ... bead counter HTML ...
   + (_condensedMode ? '' : _prayerBlockCollapsible('Hail Mary', p.hail_mary))
   + (_condensedMode ? '' : _prayerBlockCollapsible('Glory Be', p.glory_be))
   + (_condensedMode ? '' : _prayerBlockCollapsible('O My Jesus', p.o_my_jesus, 'Fatima Prayer'))
   ```

4. Apply same pattern to `_renderOpening()` and `_renderClosing()`. In condensed mode, replace full prayer blocks with a brief inline summary:
   ```javascript
   if (_condensedMode) {
     body.innerHTML += '<div class="rosary-condensed-summary">Sign of the Cross · Apostles\' Creed · 3 Hail Marys · Glory Be</div>';
   } else {
     body.innerHTML += _prayerBlock('Sign of the Cross', p.sign_of_cross) + ...;
   }
   ```

5. Add toggle function:
   ```javascript
   window.toggleRosaryCondensed = function() {
     _condensedMode = !_condensedMode;
     try { localStorage.setItem('mf-rosary-condensed', _condensedMode ? '1' : '0'); } catch(e) {}
     _renderScreen();
   };
   ```

6. Add CSS:
   ```css
   .rosary-mode-toggle { display:flex;justify-content:flex-end;padding:0 0 var(--space-2); }
   .rosary-mode-btn { font-size:var(--text-xs);font-weight:var(--weight-medium);color:var(--color-text-tertiary);background:none;border:1px solid var(--color-border);border-radius:var(--radius-full);padding:var(--space-1) var(--space-3);cursor:pointer;min-height:32px;-webkit-tap-highlight-color:transparent;transition:all var(--transition-fast); }
   .rosary-mode-btn.active { color:var(--color-primary);border-color:var(--color-primary);background:var(--color-primary-bg); }
   .rosary-mode-btn:active { opacity:0.85; }
   .rosary-condensed-summary { font-size:var(--text-sm);color:var(--color-text-secondary);text-align:center;padding:var(--space-4);font-family:var(--font-prayer);font-style:italic; }
   html[data-theme="dark"] .rosary-mode-btn { border-color:var(--color-border);color:var(--color-text-tertiary); }
   html[data-theme="dark"] .rosary-mode-btn.active { color:var(--color-primary);border-color:var(--color-primary);background:var(--color-primary-bg); }
   ```

**Verify:** Start the Rosary, select a mystery set, go to Decade 1. Tap "Mysteries only" — prayer text disappears, mystery card and bead counter remain. Toggle back — prayers return. Navigate to Decade 2 — condensed state persists. Close and reopen — preference remembered. Test opening and closing screens in both modes.
