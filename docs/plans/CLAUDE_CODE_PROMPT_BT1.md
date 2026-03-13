# Claude Code Implementation Prompt — BT1 Series

**Spec:** `docs/plans/UX_Spec_Backlog_Triage_Round1.md`
**Prefix:** BT1

---

## Instructions

Implement the BT1 spec series in priority order. Read the full spec before starting. Each item has exact file paths, before/after descriptions, and test checklists.

**Priority order:** BT1-04 → BT1-02 → BT1-06a → BT1-05 → BT1-03 → BT1-01 → BT1-06b

**Rules:**
- Use only CSS custom properties (tokens) from `:root` — never hardcode colors except in `color-mix()` fallbacks
- SVG only — no emoji, no Unicode decorative characters
- All new elements need `html[data-theme="dark"]` overrides
- Touch targets ≥ 44×44pt on all interactive elements
- `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair) for headings, `--font-body` (Source Sans) for UI
- CommonJS everywhere, no arrow functions
- Test each item against its checklist before moving to the next

---

## BT1-04 — Reference Snippets Fix (P1)

**Files:** `src/snippet.js`, `src/examination.js`, `src/rosary.js`

1. In `snippet.js` `showSnippet()`: After computing `insertAfter`, add guard: `if (!document.body.contains(insertAfter)) return;`
2. In `snippet.js` `_outsideClickHandler()`: Add exclusions for `.exam-q`, `.exam-checkbox`, `.exam-nav`, `.rosary-beads`, `.rosary-bead`, `.rosary-nav-btn`
3. In `snippet.js` `showSnippet()`: Change the outside-click registration delay from `100` to `500` ms
4. In `examination.js` `_renderCurrentSection()`: Add `var snippet = require('./snippet.js'); snippet.dismissSnippet();` as the first two lines
5. In `rosary.js`: Before every `body.innerHTML = ...` in decade/section rendering, add `var snippet = require('./snippet.js'); snippet.dismissSnippet();` (cache the require at module top)
6. Check `stations.js` for the same pattern and apply if needed

## BT1-02 — Fasting Banner (P1)

**Files:** `src/readings.js` (lines 84–114), `src/app.js` (lines 1017–1035), `css/app.css` (lines 1701–1707)

1. In both `readings.js` `renderFastingBanner()` and `app.js` `_devSetFasting()`: Replace `\u271D` with an SVG cross (`<svg viewBox="0 0 24 24" ...><line x1="12" y1="2" x2="12" y2="22"/><line x1="2" y1="10" x2="22" y2="10"/></svg>`)
2. Add dismiss button HTML after `.fasting-banner-text` div, before closing `</div>`
3. In `readings.js` `renderFastingBanner()`: Check `sessionStorage.getItem('fastingBannerDismissed')` before rendering; if set, return early
4. Add `window.dismissFastingBanner` function: sets sessionStorage flag, fades out the banner
5. In CSS: Replace hardcoded `#F3E8FF` / `#D8B4FE` / `#FDE8E8` / `#FCA5A5` with `var(--color-accent-pale)` and `color-mix()` borders. Update `.fasting-banner-icon` to 36×28 rounded square with SVG styling. Add `.fasting-banner-dismiss` styles. Update dark mode overrides.

## BT1-06a — Map Bottom Gap (P1)

**Files:** `css/app.css`, `src/app.js` (switchTab function)

1. In `app.js` `switchTab()`: Add `document.body.classList.toggle('map-active', id === 'panelMap');`
2. In CSS: Add `body.map-active { padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom)); }`

## BT1-05 — PWA Update Banner (P2)

**Files:** `src/app.js` (lines 788–800), `css/app.css` (lines 1520–1524)

1. Replace inline `onclick="window.location.reload()"` with `onclick="_handleUpdateRefresh(this)"`
2. Add `window._handleUpdateRefresh` function with spinner state + disabled + delayed reload
3. Add auto-dismiss `setTimeout` (30s) in `_showUpdateBanner()`
4. Update banner text from "App updated —" to "Update available ·"
5. In CSS: Add `.mf-update-banner-btn svg.spin` animation, `.mf-update-banner-btn:disabled` opacity. Increase button min-height to 32px, add min-width 44px.

## BT1-03 — Readings Gospel Border & Warmth (P2)

**Files:** `css/app.css` (lines 1493–1517)

1. Add `.reading-entry--gospel:hover` override with right-only border-radius
2. Update `.reading-heading`: demote to `--text-xs`, uppercase, `letter-spacing: 0.06em`, `--color-text-tertiary`
3. Update `.reading-ref`: promote to `--text-base`, `--weight-medium`, `--color-text-primary`, `--font-prayer`
4. Update `.reading-entry--gospel .reading-heading`: `--text-xs`, uppercase, `--color-accent-text`, `--weight-semibold`
5. Update `.reading-entry--gospel .reading-ref`: `--font-display`, `--text-lg`, `--weight-semibold`, `--color-accent-text`
6. Replace `border-bottom` dividers with `margin-bottom: var(--space-1)` spacing

## BT1-01 — Liturgical Day Teaser (P3)

**Files:** `src/app.js` (lines 491–530), `css/app.css` (lines 215–228)

1. Replace `.daily-card-dot` with `.daily-card-icon` (28×28 rounded square with SVG cross, background = liturgical color hex)
2. Add seasonal gradient background: `background: linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 100%);`
3. Update typography: `.daily-card-name` to `--text-base` / `--weight-semibold` / `--font-display`
4. Replace `›` Unicode arrow with SVG chevron-right
5. Increase padding to `--space-4` all around
6. Update JS template in `_renderDailyStrip()` to match new HTML structure
7. Remove `.daily-card-dot` CSS, add `.daily-card-icon` CSS

## BT1-06b — Map Standalone Filters (P3)

**Files:** `index.html`, `src/map.js`, `css/app.css`

1. Add `.map-chip-bar` HTML inside `#panelMap` (before `#mapFilterPill`)
2. Add CSS for `.map-chip-bar`, `.map-chip`, `.map-chip.active` + dark mode overrides
3. In `map.js`: Wire chip click handlers to call `ui.applyQuickFilter()` then `applyMapFilter()`
4. Handle chip bar / filter pill coexistence: hide chips when search is active, show pill when filter is active
5. Adjust `.map-filter-pill` top position when chips are visible
