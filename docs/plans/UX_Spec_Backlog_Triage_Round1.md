# MassFinder — UX Spec: Backlog Triage Round 1

**Spec prefix:** BT1 (Backlog Triage 1)
**Created:** 2026-03-13
**Status:** Implemented
**Backlog items addressed:** IDEA-001, IDEA-002, IDEA-003, IDEA-004, IDEA-006, IDEA-008
**Items skipped (out of UX scope):** IDEA-005 (API/data dependency), IDEA-007 (data pipeline), IDEA-009 (sort algorithm)

| ID | Title | Status |
|----|-------|--------|
| BT1-01 | Liturgical Day Teaser Card: Design Uplift | Done |
| BT1-02 | Fasting Banner: SVG Icon, Dismissibility, Visual Polish | Done |
| BT1-03 | Readings: Gospel Border Consistency & Visual Warmth | Done |
| BT1-04 | Reference Snippets: Prevent Premature Dismissal | Done |
| BT1-05 | PWA Update Banner: Feedback, Styling, Auto-Dismiss | Done |
| BT1-06a | Map Tab: Bottom Gap Fix | Done |
| BT1-06b | Map Tab: Standalone Filter Chips | Done |

---

## Triage Summary

Six backlog items fall within UX scope. They group into three areas:

1. **Find Tab & More Tab surface** — Liturgical day teaser, fasting/abstinence banner (IDEA-002, IDEA-003)
2. **Readings & Reference snippets** — Gospel border inconsistency, vanishing Bible/CCC snippets (IDEA-004, IDEA-006)
3. **Chrome & Navigation** — PWA update banner, Map tab gap + standalone UX (IDEA-001, IDEA-008)

---

## BT1-01 — Liturgical Day Teaser Card: Design Uplift

**Backlog ref:** IDEA-002
**Severity:** Refinement
**Files:** `src/app.js` (lines 491–530), `css/app.css` (lines 215–228)

### Problem

The liturgical day teaser on the Find tab (`.daily-card`) is a flat, utilitarian row: a 10px color dot, plain text name, a progress counter, and a right-arrow chevron (`›`). It reads like a debug readout — "Friday of the 3rd Week of Lent · Day 23 of 45 · Lent · Abstinence from meat today" — rather than a warm daily touchstone.

### User stories

- **72-year-old:** Glances at Find tab. Sees a small dot and dense text. Doesn't register it as tappable or meaningful. Ignores it.
- **25-year-old:** Expects a card with visual presence — color, hierarchy, breathing room. This looks like a log line.
- **45-year-old parent:** Wants to know "what day is it liturgically?" at a glance. The progress counter is useful but buried in a flat row.

### Spec

**Before:** Single-row layout. 10px dot + name + progress text + chevron. No background tint. `--text-sm` name, `--text-xs` progress. No seasonal color beyond the dot.

**After:**

1. **Seasonal tint background.** Replace bare `var(--color-surface)` with a subtle seasonal wash:
   - `background: linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 100%);`
   - This ensures the card subtly shifts purple/gold/green with the liturgical season.

2. **Larger color indicator.** Replace the 10px dot with a 28×28px rounded square containing an SVG cross icon (matching `header-logo-cross` pattern). Background = the liturgical color hex. This gives the card a visual anchor.
   ```css
   .daily-card-icon {
     width: 28px; height: 28px;
     border-radius: 6px;
     display: flex; align-items: center; justify-content: center;
     flex-shrink: 0;
   }
   .daily-card-icon svg { width: 14px; height: 14px; color: white; }
   ```

3. **Typography hierarchy.** Promote the liturgical day name to `--text-base` / `--weight-semibold` / `--font-display`. Keep progress counter at `--text-xs` but add `--color-text-secondary` (up from tertiary). The secondary line (abstinence note) stays `--text-xs` italic with `--color-accent-text`.

4. **Replace the `›` arrow** with a proper 16×16 SVG chevron-right (stroke-based, `--color-text-tertiary`).

5. **Spacing.** Increase card padding from `--space-3 --space-4` to `--space-4` all around. Add `--space-3` gap in the row (already present — keep).

6. **Dark mode.** The `linear-gradient` uses `var(--color-accent-pale)` which already maps to dark-appropriate values per season (e.g., `#2E2618` for ordinary time dark). No extra override needed. Verify the icon background hex colors have adequate contrast against dark surface.

### CSS tokens used

`--color-accent-pale`, `--color-surface`, `--font-display`, `--text-base`, `--text-xs`, `--weight-semibold`, `--color-text-secondary`, `--color-accent-text`, `--color-text-tertiary`, `--space-4`, `--radius-md`

### Dark mode

Inherits from seasonal accent-pale overrides already in place (lines 138–166 of app.css). No new dark-mode rules needed. Test all five seasons: lent, advent, easter, christmas, ordinary.

### Cascading impacts

- The `.daily-card` click handler navigates to More tab — no change needed.
- The `_renderDailyStrip()` function in `app.js` builds the HTML. Must update the template to use the new icon element instead of `<span class="daily-card-dot">`.
- Remove `.daily-card-dot` class and add `.daily-card-icon` class in both CSS and JS.
- The `colorHex` value already computed in `_renderDailyStrip()` is used for the icon background — keep this logic.

### Test checklist

- [ ] Light mode: Lent (purple wash), Easter (gold wash), Ordinary (green wash)
- [ ] Dark mode: same three seasons — verify tint is subtle, not overwhelming
- [ ] Tap target: entire card ≥ 44pt tall
- [ ] Text truncation: long feast names (e.g., "Solemnity of the Annunciation of the Lord") ellipsis correctly
- [ ] Progress text present during seasons, absent during Ordinary Time (verify both)
- [ ] Secondary line: "Abstinence from meat today" shows on Lenten Fridays
- [ ] Arrow is SVG, not Unicode character

---

## BT1-02 — Fasting/Abstinence Banner: SVG Icon, Dismissibility, Visual Polish

**Backlog ref:** IDEA-003
**Severity:** Bug + refinement
**Files:** `src/readings.js` (lines 84–114), `src/app.js` (lines 1017–1035), `css/app.css` (lines 1701–1707)

### Problem

Three issues:

1. **Emoji icon.** The banner uses `\u271D` (✝ Latin Cross emoji) in `.fasting-banner-icon`, violating the app's SVG-only rule. Renders differently across platforms — some show a plain text symbol, others a colored emoji.

2. **Not dismissible.** The banner has no close button. Users who already know it's a fasting day see it every time they visit the More tab. It occupies ~60px of vertical space above the saint card.

3. **Visual roughness.** The hardcoded purple background (`#F3E8FF` / border `#D8B4FE`) doesn't use the seasonal accent system. The full-fast variant uses a red tone (`#FDE8E8` / `#FCA5A5`) that clashes with the purple Lenten palette.

### User stories

- **72-year-old:** Sees the banner, reads it, understands. Comes back the next Friday — sees the same banner again. Slight annoyance but not a blocker.
- **25-year-old:** Sees an emoji glyph that renders as a text symbol on their Android device. Feels cheap. Wants to dismiss it after reading.
- **45-year-old parent:** Useful first time. By the third Friday of Lent, wants it gone. Takes up space above the content they actually came for.

### Spec

**A. Replace emoji with SVG cross.**

Replace `.fasting-banner-icon` content from `\u271D` to an inline SVG:
```html
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="20" height="20">
  <line x1="12" y1="2" x2="12" y2="22"/>
  <line x1="2" y1="10" x2="22" y2="10"/>
</svg>
```

Update `.fasting-banner-icon` CSS:
```css
.fasting-banner-icon {
  width: 36px; height: 36px;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  color: var(--color-accent);
  background: rgba(124, 58, 237, 0.08); /* subtle purple tint for Lent */
}
```

**B. Use seasonal accent colors instead of hardcoded purples.**

Replace:
```css
.fasting-banner { background: #F3E8FF; border-color: #D8B4FE; }
.fasting-banner--full { background: #FDE8E8; border-color: #FCA5A5; }
```

With:
```css
.fasting-banner {
  background: var(--color-accent-pale);
  border: 1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);
}
.fasting-banner--full {
  background: var(--color-accent-pale);
  border: 1px solid color-mix(in srgb, var(--color-accent) 35%, transparent);
}
```

This ties the banner to the seasonal accent system (purple during Lent, which is when it actually appears). The `--full` variant gets a slightly stronger border for visual distinction.

**Fallback for `color-mix`:** If Safari <15 support is required, use `rgba()` with the accent color value instead. Check browser support matrix.

**C. Add dismiss button.**

Add a close button to the banner HTML (both in `readings.js` and `app.js` dev panel):
```html
<button class="fasting-banner-dismiss" onclick="dismissFastingBanner()" aria-label="Dismiss">
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
</button>
```

Dismiss behavior:
- Store `sessionStorage.setItem('fastingBannerDismissed', 'true')` — resets daily (session-scoped). Don't use `localStorage` — the banner should return the next fasting day.
- `renderFastingBanner()` checks this flag before rendering.
- Banner dismiss uses `el.style.opacity = '0'; setTimeout(() => el.innerHTML = '', 300);` for a fade-out.

CSS for dismiss button:
```css
.fasting-banner-dismiss {
  flex-shrink: 0;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  color: var(--color-text-tertiary);
  margin-left: auto;
  -webkit-tap-highlight-color: transparent;
}
.fasting-banner-dismiss:active { opacity: 0.5; }
```

### Dark mode

The existing dark overrides (lines 1706–1707) use `rgba()` tints. Replace them to match the new approach:
```css
html[data-theme="dark"] .fasting-banner {
  background: var(--color-accent-pale);
  border-color: color-mix(in srgb, var(--color-accent) 20%, transparent);
}
html[data-theme="dark"] .fasting-banner--full {
  background: var(--color-accent-pale);
  border-color: color-mix(in srgb, var(--color-accent) 30%, transparent);
}
html[data-theme="dark"] .fasting-banner-icon {
  background: rgba(255,255,255,0.06);
}
```

### Cascading impacts

- `src/readings.js` `renderFastingBanner()` — update HTML template (lines 98–114).
- `src/app.js` `_devSetFasting()` — update HTML template (lines 1021–1035).
- New global function `dismissFastingBanner()` — add to `app.js` or `readings.js` and expose on `window`.
- No impact on other modules.

### Test checklist

- [ ] Abstinence banner: SVG cross renders, no emoji glyph
- [ ] Full fast banner: same SVG, stronger border
- [ ] Dismiss button: 28×28 touch target, fades banner out
- [ ] Dismissed banner does not reappear on tab switch (same session)
- [ ] Dismissed banner reappears next session (new browser session)
- [ ] Dark mode: both variants use seasonal accent colors correctly
- [ ] Lent season: banner is purple-tinted; if somehow triggered outside Lent, uses current season accent
- [ ] Icon color matches accent

---

## BT1-03 — Today's Readings: Gospel Border Consistency & Visual Warmth

**Backlog ref:** IDEA-004
**Severity:** Bug + refinement
**Files:** `css/app.css` (lines 1493–1517), `src/readings.js` (lines 227–252)

### Problem

1. **Gospel border inconsistency.** `.reading-entry--gospel` adds a `border-left: 3px solid var(--color-accent)` with `margin-left: calc(-1 * var(--space-1))`. But `.reading-entry:hover` adds `margin: 0 calc(-1 * var(--space-3)); padding-left: var(--space-3); border-radius: var(--radius-sm)`. On hover, the negative margin shift and border-radius cause the gospel's left accent border to get clipped at the corners (sharp top/bottom on the 3px border vs rounded on the hover background). The expanded state has no explicit gospel override, so the border-left persists through the expansion with the same clipping.

2. **Drab reading list.** The three readings are plain rows with `--text-sm` heading labels ("First Reading") and `--text-base` italic scripture refs ("Hosea 14:2-10"). There's no visual hierarchy distinguishing them — they look like a flat list.

### User stories

- **72-year-old:** Reads the Gospel label but doesn't notice the subtle border-left. The visual distinction between readings is too subtle to be useful.
- **25-year-old:** Notices the border flicker on tap/hover. Feels unpolished.
- **45-year-old parent:** Wants to quickly spot the Gospel (the reading they'll hear at Mass). The current distinction is too subtle at a glance.

### Spec

**A. Fix the gospel border interaction with hover.**

Add a hover override specifically for the gospel entry so the border-left survives the rounded hover state:
```css
.reading-entry--gospel:hover {
  margin-left: calc(-1 * var(--space-1));
  padding-left: var(--space-3);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
```

This keeps the left edge sharp (for the accent border) while rounding only the right corners on hover.

**B. Improve reading header hierarchy.**

Add a small label/ref visual pairing. Currently `.reading-heading` (the label "First Reading") and `.reading-ref` (the scripture reference) are stacked with only `margin-top: 2px` between them. Improve:

- `.reading-heading`: Keep at `--text-xs` (demote from `--text-sm` to reduce visual weight), uppercase with `letter-spacing: 0.06em`, color `--color-text-tertiary`. This makes it a label, not a title.
- `.reading-ref`: Promote to `--text-base`, `--weight-medium`, color `--color-text-primary`, `--font-prayer`. This becomes the primary scannable element — the actual scripture reference the user cares about.
- `.reading-entry--gospel .reading-heading`: `--text-xs`, `--color-accent-text`, uppercase, `--weight-semibold`. The accent color distinguishes it.
- `.reading-entry--gospel .reading-ref`: `--font-display`, `--text-lg`, `--weight-semibold`, `--color-accent-text`. The Gospel reference is visually promoted.

**C. Add subtle divider enhancement.**

Replace `border-bottom: 1px solid var(--color-border-light)` with `border-bottom: none` and add `margin-bottom: var(--space-1)` between entries. Use spacing rather than lines to separate readings — this is warmer and less clinical.

### Dark mode

All colors use CSS variables. No new dark overrides needed. Verify `--color-accent-text` is readable against `--color-surface` in dark mode (it maps to `#D4A84B` in dark — adequate contrast).

### Cascading impacts

- `.reading-heading` style change affects all reading entries, not just Gospel. The intent is that all headings become labels and refs become primary. Verify this doesn't break the psalm display.
- The `.reading-entry:hover` negative margin trick is used globally — the gospel-specific override must have higher specificity.
- The `src/readings.js` template doesn't need changes — only CSS modifications.

### Test checklist

- [ ] Gospel entry: accent border stays consistent through hover, tap, expanded states
- [ ] Gospel border: left edge sharp, right corners rounded on hover
- [ ] Heading labels: smaller, uppercase, label-like for all readings
- [ ] Scripture refs: larger, primary text weight for all readings
- [ ] Gospel ref: uses `--font-display`, visually distinct from other entries
- [ ] No divider lines between entries — spacing only
- [ ] Dark mode: all text legible, accent colors appropriate
- [ ] Expand/collapse chevron still aligned properly after spacing changes

---

## BT1-04 — Reference Snippets: Prevent Premature Dismissal in Prayer Tools

**Backlog ref:** IDEA-006
**Severity:** Bug
**Files:** `src/snippet.js` (lines 45–67, 199–210), `src/examination.js` (lines 423–464), `src/rosary.js` (lines 392–404)

### Problem

Bible verse references in the Rosary (e.g., "Luke 22:39-46") and CCC references in the Examination "flash briefly on screen and then disappear." Root cause analysis reveals two interacting issues:

1. **DOM destruction via innerHTML replacement.** In both the Rosary and Examination, navigating between sections/decades calls `body.innerHTML = html`, which wipes the DOM tree including any snippet cards that `snippet.js` inserted via `insertBefore`. The snippet card is a DOM element injected after the anchor — it's not part of the template HTML, so it's destroyed on re-render.

2. **Aggressive outside-click dismissal.** `snippet.js` registers a document-level click handler (`_outsideClickHandler`) 100ms after the snippet opens. Any click that doesn't land on the snippet card or the anchor element triggers `dismissSnippet()`. In the Examination, checking a checkbox or tapping elsewhere in the question list fires this handler, dismissing the snippet immediately.

3. **Crossfade timing collision.** In `_renderCurrentSection()` (examination.js line 454), the body opacity is set to 0, then after 150ms the innerHTML is replaced. If a user taps a CCC ref and the section transitions (even back to the same section via dot navigation), the snippet is created, the crossfade fires, innerHTML is replaced, and the snippet vanishes — all within ~200ms, producing the "flash and disappear" effect.

### User stories

- **72-year-old:** Taps a CCC reference in the Examination. A card flashes for a split second then vanishes. Confused. Taps again — same result. Gives up.
- **25-year-old:** Taps a scripture ref in the Rosary decade. Nothing appears to happen (the snippet was created and immediately destroyed by the next render cycle). Assumes the feature is broken.
- **45-year-old parent:** Trying to look up a verse reference while praying the Rosary. The reference link looks tappable but produces no visible result. Frustrating.

### Spec

**A. Guard snippet creation against imminent re-render.**

In `snippet.js`, add a debounce/protection mechanism. Before inserting the snippet DOM node, check whether the anchor element is still in the document:

```javascript
// In showSnippet(), after insertAfter is determined:
if (!document.body.contains(insertAfter)) return;
```

This prevents the snippet from being created when the DOM is mid-transition.

**B. Protect snippets from outside-click dismissal within prayer tools.**

Widen the `_outsideClickHandler` exclusion list. Currently it only checks:
- `_currentSnippet.el.contains(e.target)` — the snippet card itself
- `_currentSnippet.anchorEl.contains(e.target)` — the tapped ref
- `e.target.closest('.ref-tap')` — any ref-tap element

Add exclusions for prayer tool interactive elements:
```javascript
// Don't dismiss on exam checkbox taps, rosary bead taps, or nav button taps
if (e.target.closest('.exam-q') || e.target.closest('.exam-checkbox')) return;
if (e.target.closest('.rosary-beads') || e.target.closest('.rosary-bead')) return;
if (e.target.closest('.exam-nav') || e.target.closest('.rosary-nav-btn')) return;
```

**C. Dismiss snippet before section re-renders.**

In `examination.js` `_renderCurrentSection()`, call `snippet.dismissSnippet()` at the top of the function, before the crossfade starts. This ensures a clean teardown rather than an orphaned DOM node:

```javascript
function _renderCurrentSection() {
  var snippet = require('./snippet.js');
  snippet.dismissSnippet();
  // ... rest of function
}
```

Same in `rosary.js` before any `body.innerHTML = ...` call in the decade/section rendering functions:

```javascript
// At top of _showDecade (or equivalent render function):
var snippet = require('./snippet.js');
snippet.dismissSnippet();
```

**D. Add a subtle entrance animation delay.**

The snippet currently `scrollIntoView` after 50ms. Add a minimum visibility duration — don't allow outside-click dismissal until the snippet has been visible for at least 500ms:

```javascript
// In showSnippet(), change the outsideClickHandler registration:
setTimeout(function() {
  document.addEventListener('click', _outsideClickHandler, true);
  document.addEventListener('keydown', _escapeHandler);
}, 500); // was 100ms
```

This gives the user time to see the snippet before any stray touch dismisses it.

### Dark mode

No visual changes — this is a behavioral bug fix. Existing dark mode snippet styles are unaffected.

### Cascading impacts

- `snippet.js`: Widen click handler exclusions (low risk — additive only).
- `examination.js`: Add `dismissSnippet()` call in `_renderCurrentSection()` — must require snippet.js at top of module or lazily.
- `rosary.js`: Add `dismissSnippet()` call before innerHTML replacements — same require pattern.
- `stations.js`: Check if the same pattern applies (stations uses scripture refs too). If `innerHTML` re-renders occur there, add the same guard.

### Test checklist

- [ ] Examination: Tap CCC ref → snippet appears and stays visible
- [ ] Examination: Tap CCC ref → tap a checkbox → snippet stays visible
- [ ] Examination: Tap CCC ref → navigate to next section → snippet dismisses cleanly (no flash)
- [ ] Rosary: Tap scripture ref → snippet appears and stays visible
- [ ] Rosary: Tap scripture ref → tap a bead → snippet stays visible
- [ ] Rosary: Tap scripture ref → navigate to next decade → snippet dismisses cleanly
- [ ] Snippet close button still works
- [ ] Escape key still dismisses
- [ ] Tapping outside (on prayer body text, not interactive elements) still dismisses after 500ms
- [ ] No console errors during rapid ref-tap + navigation sequences

---

## BT1-05 — PWA Update Banner: Feedback, Styling, and Auto-Dismiss

**Backlog ref:** IDEA-001
**Severity:** Bug
**Files:** `src/app.js` (lines 788–800), `css/app.css` (lines 1520–1524)

### Problem

The "App updated — Refresh" banner provides no visual feedback when the Refresh button is tapped. The button calls `window.location.reload()` directly, which can take 1–3 seconds on slow connections. Users can't tell if their tap registered. The banner is also visually heavy for what is a transient system notification.

### User stories

- **72-year-old:** Sees "App updated" banner floating above the tab bar. Taps "Refresh." Nothing visibly happens for 2 seconds. Taps again. Taps harder. Eventually the page reloads.
- **25-year-old:** Expects immediate feedback — a spinner, a checkmark, anything. The dead button moment feels broken.
- **45-year-old parent:** Sees the banner while trying to find Mass times. It's in the way. Wants to either dismiss it or have it handle itself.

### Spec

**A. Add tap feedback to the Refresh button.**

Replace the inline `onclick="window.location.reload()"` with a proper handler that:
1. Immediately shows a spinner state on the button (text changes to a rotating SVG)
2. Disables the button to prevent double-taps
3. Calls `window.location.reload()` after a 100ms delay (allows the visual update to paint)

Updated HTML template in `app.js`:
```javascript
b.innerHTML = 'App updated \u2014 '
  + '<button class="mf-update-banner-btn" onclick="_handleUpdateRefresh(this)">'
  + 'Refresh</button>';
```

New handler (add to `app.js`):
```javascript
window._handleUpdateRefresh = function(btn) {
  btn.disabled = true;
  btn.innerHTML = '<svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>';
  setTimeout(function() { window.location.reload(); }, 100);
};
```

Add spinner CSS:
```css
.mf-update-banner-btn svg.spin {
  animation: spin 0.8s linear infinite;
}
.mf-update-banner-btn:disabled {
  opacity: 0.7;
  cursor: default;
}
```

**B. Add auto-dismiss after 30 seconds.**

If the user doesn't tap Refresh within 30 seconds, fade the banner out. The update is already cached — it'll apply on the next natural page load.

In `_showUpdateBanner()`:
```javascript
setTimeout(function() {
  if (b.classList.contains('show')) {
    b.style.opacity = '0';
    setTimeout(function() { b.classList.remove('show'); }, 300);
  }
}, 30000);
```

**C. Visual refinement.**

The current banner is adequate in structure (pill shape, elevated shadow, positioned above tab bar). Minor tweaks:
- Change text from "App updated —" to "Update available ·" (shorter, more standard PWA language)
- Increase button min-height from 26px to 32px for better touch target
- Add `min-width: 44px` to the button to meet touch target requirements

### Dark mode

Existing dark overrides (line 1524) already cover the banner surface. No new rules needed.

### Cascading impacts

- Only `src/app.js` `_showUpdateBanner()` function affected.
- New global function `_handleUpdateRefresh` exposed on `window`.
- No impact on other modules.

### Test checklist

- [ ] Tap Refresh → button shows spinner immediately
- [ ] Tap Refresh → button is disabled (no double-tap)
- [ ] Page reloads after spinner appears
- [ ] Banner auto-dismisses after 30 seconds if not tapped
- [ ] Banner positioned correctly above tab bar on iOS (safe area)
- [ ] Dark mode: banner readable, button contrast adequate
- [ ] Button meets 44pt minimum touch target

---

## BT1-06 — Map Tab: Bottom Gap Fix & Standalone Filter Access

**Backlog ref:** IDEA-008
**Severity:** Bug + enhancement
**Files:** `css/app.css` (lines 184, 1155–1156), `src/map.js`, `index.html` (line 92–95)

### Problem

Two issues:

1. **Bottom gap.** The `body` element has `padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + var(--space-4))` (line 184). The extra `--space-4` (16px) creates a visible gap between the map container and the tab bar. The map container height calc (`100dvh - 56px - var(--tab-bar-height) - var(--safe-bottom)`) doesn't account for this body padding, so the map renders correctly in height but the body padding pushes content down, creating a 16px strip of `--color-bg` below the map.

2. **No standalone filters.** When the Map tab is accessed directly via the bottom nav (not from Find tab), it shows all 93 parishes with no filtering. The filter pill only appears when a filter was set on the Find tab first. Users who go straight to Map have no way to filter by service type, day, or search.

### User stories

- **72-year-old:** Taps Map tab. Sees a gap of beige background below the map before the tab bar. Looks broken.
- **25-year-old:** Goes to Map tab to see nearby parishes. Wants to filter for Confession but there's no filter UI. Has to go to Find tab, set the filter, then come back to Map. Poor navigation flow.
- **45-year-old parent:** On the Map tab, wants to quickly see "where's the closest Mass today?" No way to do this without leaving the Map.

### Spec

**A. Fix the bottom gap.**

The body padding-bottom is needed for scrollable panels (Find, Saved, More) to prevent content from being hidden behind the fixed tab bar. But the Map panel doesn't scroll — it's a full-viewport map. Override the body padding for the map panel:

```css
#panelMap {
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  position: relative;
  margin-bottom: calc(-1 * var(--space-4)); /* neutralize body padding-bottom extra */
}
```

Alternatively (cleaner): Add a class-based override. When the Map tab is active, the body doesn't need the extra `--space-4`:
```css
body:has(#panelMap.active) {
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom));
}
```

**Fallback for `:has()` (Firefox <121):** Use a JS-toggled class on `<body>` when switching to/from the Map tab. In the `switchTab()` function, add/remove `body.classList.toggle('map-active', tabId === 'panelMap')`:
```css
body.map-active {
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom));
}
```

**B. Add standalone filter chips to the Map tab.**

Add a compact filter chip row at the top of the map panel, positioned absolutely so it overlays the map without affecting layout. Show it when the map is accessed directly (no pre-existing filter from Find tab). The pill already handles "filter active" display — this adds a "no filter" state.

HTML structure (add to `#panelMap` in `index.html`):
```html
<div id="mapChipBar" class="map-chip-bar">
  <button class="map-chip" data-filter="all">All</button>
  <button class="map-chip" data-filter="today">Today</button>
  <button class="map-chip" data-filter="confession">Confession</button>
  <button class="map-chip" data-filter="adoration">Adoration</button>
</div>
```

CSS:
```css
.map-chip-bar {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  right: var(--space-3);
  z-index: 500;
  display: flex;
  gap: var(--space-2);
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
  padding-bottom: var(--space-2);
}
.map-chip-bar::-webkit-scrollbar { display: none; }
.map-chip {
  flex-shrink: 0;
  padding: var(--space-2) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-secondary);
  box-shadow: var(--shadow-card);
  min-height: 36px;
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
}
.map-chip.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}
```

JS behavior (add to `map.js` or wire in `app.js`):
- Tapping a map chip calls `ui.applyQuickFilter(filter)` and then `map.applyMapFilter()`.
- The chip bar and the filter pill coexist — when a chip is active, the pill shows the count. When "All" is active, the pill hides.
- The chip bar should hide when the map filter pill is showing a search query (to avoid redundant UI).

**Dark mode:**
```css
html[data-theme="dark"] .map-chip {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-secondary);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
html[data-theme="dark"] .map-chip.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}
```

### Cascading impacts

- `switchTab()` in `app.js` — add body class toggle for map-active.
- `map.js` — wire chip bar click handlers, integrate with existing `applyMapFilter()`.
- `ui.js` — `applyQuickFilter()` already exists and handles filter state. Map chips should call this same function.
- The existing filter pill (`#mapFilterPill`) positions at `top: var(--space-3)`. If chips are also at top, pill should shift down to `top: calc(var(--space-3) + 44px)` when chips are visible. Or, hide chips when a filter is active and show the pill instead.
- `index.html` — add chip bar markup inside `#panelMap`.

### Test checklist

- [ ] Map tab: no visible gap between map and tab bar
- [ ] Map tab on iOS: safe area renders correctly (no double gap, no overlap)
- [ ] Chip bar visible when accessing Map directly from bottom nav
- [ ] Tapping "Confession" chip filters map markers to confession-offering parishes
- [ ] "All" chip resets to showing all markers
- [ ] Active chip has primary-color fill
- [ ] Chip bar scrolls horizontally if more chips are added
- [ ] Filter pill and chip bar don't overlap
- [ ] Dark mode: chips readable, active state has good contrast
- [ ] Body padding fix doesn't affect Find, Saved, or More tab scroll behavior

---

## Implementation Priority

| ID | Title | Severity | Effort | Priority |
|----|-------|----------|--------|----------|
| BT1-04 | Reference Snippets: Prevent Premature Dismissal | Bug | 1 hr | P1 — broken feature |
| BT1-02 | Fasting Banner: SVG, Dismiss, Polish | Bug + ref | 1 hr | P1 — violates SVG rule |
| BT1-06a | Map Tab: Bottom Gap Fix | Bug | 15 min | P1 — visible glitch |
| BT1-05 | PWA Update Banner Feedback | Bug | 30 min | P2 — poor UX on interaction |
| BT1-03 | Readings: Gospel Border & Warmth | Bug + ref | 45 min | P2 — visual inconsistency |
| BT1-01 | Liturgical Day Teaser Uplift | Refinement | 45 min | P3 — design polish |

---

## BT1-04 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/snippet.js` — DOM guard, 500ms delay, exam/rosary/devot-card exclusions; `src/examination.js` — dismissSnippet at top of _renderCurrentSection; `src/rosary.js` — require + dismissSnippet before all 4 body.innerHTML renders; `src/stations.js` — same pattern across 5 innerHTML replacements
- **Approach:** Three-pronged fix: (1) DOM membership guard in `showSnippet()` prevents insertion into detached nodes mid-transition; (2) wider outside-click exclusion list prevents prayer tool interactions from dismissing open snippets; (3) proactive `dismissSnippet()` before every full-screen innerHTML replacement ensures clean teardown. Delay increased 100→500ms to give users time to see snippets before any stray touch dismisses them. Post-verification, also added `.devot-card` exclusion and `stations.js` coverage (not in original spec).
- **Deviations from spec:** Added `.devot-card` exclusion (Faith Guides) after user reported snippet dismissal there — additive extension of the same pattern. SVG cross was also removed from the fasting banner icon in a separate fixup commit per user feedback.
- **Known issues:** None observed.
- **Follow-up suggestions:** Consider adding the same `dismissSnippet()` guard to `novena.js` if it has full-screen innerHTML replacements.

---

## BT1-02 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/readings.js` — sessionStorage check, SVG cross (later removed per user), dismiss button; `src/app.js` — mirror in _devSetFasting, window.dismissFastingBanner; `css/app.css` — replace hardcoded purples with color-mix seasonal tokens, icon sizing, dismiss button styles, dark mode overrides
- **Approach:** Added sessionStorage-based dismissal that resets per browser session (not persisted). The `_devSetFasting()` panel now clears the dismissed flag when invoked, so developers can always preview the banner. The fasting-banner-icon SVG was removed after user review — the empty rounded square reads cleanly without it.
- **Deviations from spec:** SVG cross in the icon was removed at user request (spec called for SVG cross, user preferred no icon content). `_devSetFasting` also received the `sessionStorage.removeItem` reset which wasn't in the spec but is necessary for dev workflow.
- **Known issues:** None observed.

---

## BT1-06a Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/ui.js` — body.map-active toggle in switchTab doSwitch; `css/app.css` — body.map-active override removes --space-4 from padding-bottom
- **Approach:** Used the JS-toggled class approach (not `:has()`) for broad browser compatibility. The class is toggled inside `doSwitch()` which runs inside both the `startViewTransition` path and the fallback path.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT1-05 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/app.js` — updated _showUpdateBanner text, onclick, added _handleUpdateRefresh and 30s auto-dismiss; `css/app.css` — increased min-height/min-width, added svg.spin animation, disabled opacity
- **Approach:** The `_handleUpdateRefresh` function is exposed on `window` to be callable from the inline onclick. The 30s auto-dismiss fades out via inline opacity transition then removes the `show` class. The existing `@keyframes spin` at line 359 was reused.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT1-03 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `css/app.css` — reading entry/heading/ref/gospel overrides, gospel hover rule, remove border-bottom dividers
- **Approach:** Pure CSS changes. Demoted `.reading-heading` to uppercase label style; promoted `.reading-ref` to medium weight primary text. Gospel heading and ref both get accent-text with Playfair Display on the ref. Border-bottom dividers removed and replaced with margin-bottom spacing. Gospel hover override uses right-only border-radius to preserve the left accent border.
- **Deviations from spec:** Removed `.reading-entry:last-child` rule as spec directed (since border-bottom is gone, it's no longer needed).
- **Known issues:** None observed. Psalm display was not adversely affected by the heading demotion.

---

## BT1-01 Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/app.js` — _renderDailyStrip replaces dot span with icon div + SVG cross, replaces › with SVG chevron; `css/app.css` — .daily-card-dot replaced by .daily-card-icon, gradient background, padding/typography uplifts
- **Approach:** Icon uses a 28×28 rounded square with the liturgical color hex as background and a white SVG cross. The gradient uses `--color-accent-pale` at 135° which shifts with the liturgical season. Typography uplift promotes the day name to Playfair Display --text-base. The arrow uses flex centering for the SVG instead of a font-size-based approach.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## BT1-06b Implementation Notes

### Implementation Notes

- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `index.html` — #mapChipBar added before #mapFilterPill; `css/app.css` — chip bar/chip/active styles + dark mode; filter pill repositioned to top+48px; `src/map.js` — initChipBar(), _syncChipBar(), chip bar hide on search, clearMapFilter syncs chips
- **Approach:** Chip bar uses event delegation on the bar container. `_syncChipBar()` syncs the active chip to `state.currentFilter` whenever the filter changes (called from `_updateFilterPill` and `clearMapFilter`). When a search is active, the chip bar is hidden so the filter pill can show centered at the top. The pill was repositioned to `top: calc(var(--space-3) + 48px)` to sit below the chip bar at all other times.
- **Deviations from spec:** Filter pill always appears below chip bar (not conditionally) — cleaner than trying to toggle pill top position. Chip bar is shown on map init, not just when no filter is set from Find tab, so it's always present (reflecting current filter state).
- **Known issues:** If a filter is set from the Find tab that doesn't correspond to one of the 4 chips (e.g. "weekend", "latin"), no chip will be highlighted — this is expected behavior.
- **Follow-up suggestions:** Consider adding more chips (Latin Mass, Weekend) in a future pass.
| BT1-06b | Map Tab: Standalone Filters | Enhancement | 2 hrs | P3 — new functionality |
