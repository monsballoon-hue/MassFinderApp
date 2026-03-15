# CLAUDE_CODE_PROMPT_IPV.md — Immersive Prayer Visual Enhancements

**Spec:** `docs/plans/UX_Spec_Immersive_Prayer_Visual.md`  
**Series:** IPV-01 through IPV-11  
**Scope:** Universal prayer splash system + visual parity for all guided prayer tools  
**Depends on:** ARC series (preferred but not blocking)  
**Implementation order:** IPV-08 → IPV-04+05 → IPV-03 → IPV-02 → IPV-09 → IPV-07 → IPV-10 → IPV-11 → IPV-06 → IPV-01

---

## IPV-08: Universal Prayer Splash System (P0 — do FIRST)

This is the foundation. Every other splash item depends on these shared CSS classes.

1. Add the complete `.prayer-splash` CSS block to `css/app.css` (see spec for full CSS):
   - `.prayer-splash` — flex column, centered 60vh, **radial gradient** background using sacred color at 4% opacity
   - `.prayer-splash-icon` — sacred color with `drop-shadow` glow (12px light, 16px dark)
   - `.prayer-splash-icon svg` — 40×52px
   - `.prayer-splash-title` — `--font-display`, `--text-2xl`, **text-shadow glow** (40px light, 50px dark)
   - `.prayer-splash-subtitle` — xs, uppercase, sacred-text color
   - `.prayer-splash-desc` — `--font-prayer`, italic, secondary color
   - `.prayer-splash-hint` — xs, tertiary, 280px max
   - `.prayer-splash-begin` — sacred gold pill, 48px min-height, **box-shadow glow** (20px light, 24px dark)
   - `.prayer-splash-prayer-text` — for modules that show prayer text on splash (exam), scrollable, 30vh max
2. Dark mode rules: slightly intensified glows (see spec for exact values)
3. Place CSS near other prayer tool styles (~after the prayerbook section, before litany styles)

## IPV-04: Novena sacred color token (quick fix)

1. `css/app.css` ~line 2768: `.novena-day-num` change `color:#1E6B4A` → `color:var(--color-sacred-text)`

## IPV-05: Novena SVG completion icon (quick fix)

1. `src/novena.js` ~line 300: replace `'\u2665'` with cross SVG:
   ```html
   <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>
   ```
2. CSS: `.novena-complete-icon { color:var(--color-sacred);margin-bottom:var(--space-3); }` and `.novena-complete-icon svg { width:28px;height:38px; }`

## IPV-03: Novena section labels

1. `src/novena.js` in `_renderPrayer()`: add `<div class="novena-block-label">LABEL</div>` as first child of each block:
   - `.novena-day-meditation` → "Meditation"
   - `.novena-day-prayer` → "Prayer"
   - `.novena-day-response` → "Response"
   - `.novena-day-closing` → "Closing Prayer"
2. CSS: `.novena-block-label { font-size:11px;font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:var(--space-2); }`

## IPV-02: Novena splash screen (uses .prayer-splash)

1. Add `'intro'` to `_screen` states in `src/novena.js`
2. In `_selectNovena(id)`: change `_screen = 'prayer'` → `_screen = 'intro'`
3. Add `_renderIntro()` using `.prayer-splash` HTML template:
   - Icon: candle/flame SVG (see spec)
   - Title: novena title
   - Subtitle: "{N} days of prayer"
   - Desc: novena description
   - Button: "Begin Day {N}" via `novenaBeginPrayer()`
4. Add `novenaBeginPrayer()` → sets `_screen = 'prayer'`, crossfade if available
5. Export as window global
6. Update render dispatcher for `_screen === 'intro'`
7. NO module-specific CSS needed — `.prayer-splash` handles it all

## IPV-09: Examination splash retrofit (uses .prayer-splash)

1. `src/examination.js` ~line 64–68: replace `.exam-opening` HTML with `.prayer-splash` template:
   - Icon: cross SVG (already there)
   - Title: "Examine Your Conscience" (per PZP-01)
   - Subtitle: "Prepare for confession"
   - Prayer text: use `.prayer-splash-prayer-text` class (scrollable, 30vh max)
   - Button: "Begin Examination"
   - Hint: "About 10–15 minutes. Nothing is saved."
2. Remove dead CSS: `.exam-opening`, `.exam-opening-icon`, `.exam-opening-title`, `.exam-opening-text`, `.exam-opening-btn`, `.exam-opening-hint` and their dark mode rules (~lines 2952–2961)

## IPV-07: Prayerbook litany intro screen (uses .prayer-splash)

1. In `prayerbookOpenLitany()`: change `_litanyStep = 0` → `_litanyStep = -1`
2. In `_renderLitany()`: when `_litanyStep === -1`, render `.prayer-splash` template:
   - Icon: cross SVG
   - Title: litany title
   - Subtitle: "{N} petitions"
   - Desc: litany description or fallback
   - Hint: "Swipe or tap to advance. Respond aloud when prompted."
   - Button: "Begin" via `prayerbookLitanyBegin()`
3. Add `prayerbookLitanyBegin()` → `_litanyStep = 0`, crossfade, render
4. Export as window global
5. `prayerbookLitanyPrev()` when `_litanyStep === 0` → back to list (not intro)

## IPV-10: Lectio Divina splash upgrade (uses .prayer-splash)

1. `src/prayerbook.js` in `_renderLectio()` when `_lectioStep === 0`:
   - Replace `.lectio-step.lectio-intro` HTML with `.prayer-splash` template
   - Icon: open book SVG (see spec)
   - Title: "Lectio Divina"
   - Subtitle: "Sacred Reading"
   - Desc: lectio description from data
   - Hint: gospel reference (if available)
2. Footer Begin button unchanged
3. Remove dead CSS for `.lectio-intro .lectio-title` if fully replaced

## IPV-11: Chaplet + stations retrofit (uses .prayer-splash)

**Chaplet:**
1. `src/chaplet.js` in `_renderIntro()` ~line 277: rewrite HTML to use `.prayer-splash` classes:
   - `.chaplet-intro` → `.prayer-splash`
   - `.chaplet-intro-cross` → `.prayer-splash-icon`
   - `.chaplet-intro-title` → `.prayer-splash-title`
   - `.chaplet-intro-origin` → `.prayer-splash-subtitle`
   - `.chaplet-intro-quote` + `.chaplet-intro-ref` → `.prayer-splash-desc` with cite inside
   - `.chaplet-begin` → `.prayer-splash-begin`
2. Remove dead CSS: `.chaplet-intro`, `.chaplet-intro-cross`, `.chaplet-intro-title`, `.chaplet-intro-origin`, `.chaplet-intro-quote`, `.chaplet-intro-ref`, `.chaplet-begin`, plus dark overrides (~12 rules)

**Stations:**
1. `src/stations.js` in `_renderIntro()` ~line 194: rewrite HTML to use `.prayer-splash` classes:
   - `.stations-intro` → `.prayer-splash`
   - `.stations-intro-icon` → `.prayer-splash-icon`
   - `.stations-intro-title` → `.prayer-splash-title`
   - `.stations-intro-text` → `.prayer-splash-desc`
   - `.stations-intro-instruction` → `.prayer-splash-hint`
2. Remove dead CSS: `.stations-intro`, `.stations-intro-icon`, `.stations-intro-title`, `.stations-intro-text`, `.stations-intro-instruction` (~5 rules)

## IPV-06: Examination completion moment

1. In `src/examination.js`: after "I received reconciliation" clears items, render completion screen:
   - Cross SVG, "Go in Peace" title, Luke 7:48,50 quote, "Return to MassFinder" button
2. CSS: `.exam-complete-screen` (centered 60vh, `rosary-fadein` animation), `.exam-complete-icon`, etc. (see spec)
3. X button still works as escape hatch

## IPV-01: Stations accent color variable

1. Add `--color-stations: #8B2252;` and `--color-stations-pale` to `:root`
2. Dark override: `--color-stations: #C75B8F;`
3. Replace all `#8B2252` in stations CSS with `var(--color-stations)`

## Verification

- **Uniformity check:** Open each guided tool (rosary excepted) and confirm the splash screens have identical visual DNA: radial gradient, icon glow, title glow, sacred gold Begin button with box-shadow glow
- **Dark mode:** All glows slightly intensified, gradient slightly stronger
- **Dorothy check:** Glow is warm and inviting, not harsh. Begin button is obvious
- **Paul check:** Gradient is barely perceptible — sophisticated, not cheap
- **Text sizes:** All splash screens hold at large and x-large text settings
- **Dead CSS:** No remaining `.chaplet-intro-*`, `.stations-intro-*`, or `.exam-opening-*` classes in CSS
- `npm run build` succeeds
