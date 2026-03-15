# CLAUDE_CODE_PROMPT_IPV.md — Immersive Prayer Visual Enhancements

**Spec:** `docs/plans/UX_Spec_Immersive_Prayer_Visual.md`  
**Series:** IPV-01 through IPV-07  
**Scope:** Visual parity for immersive prayer tools  
**Depends on:** ARC series (preferred but not blocking — items work standalone)  
**Implementation order:** IPV-04 → IPV-05 → IPV-03 → IPV-02 → IPV-07 → IPV-06 → IPV-01

---

## IPV-04: Novena sacred color token (quick fix)

1. `css/app.css` line ~2768: `.novena-day-num` change `color:#1E6B4A` → `color:var(--color-sacred-text)`
2. Leave `.novena-completed-badge` at `var(--color-verified)` — green is semantic for completion

## IPV-05: Novena SVG completion icon (quick fix)

1. `src/novena.js` line ~300: replace `'\u2665'` (heart emoji) with an SVG cross:
   ```html
   <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg>
   ```
2. CSS: add `.novena-complete-icon { color:var(--color-sacred);margin-bottom:var(--space-3); }` and `.novena-complete-icon svg { width:28px;height:38px; }`
3. Remove any existing font-size/color on `.novena-complete-icon` that styled the emoji

## IPV-03: Novena section labels

1. `src/novena.js` in `_renderPrayer()`: add `<div class="novena-block-label">LABEL</div>` as the first child of each content block:
   - `.novena-day-meditation` → "Meditation"
   - `.novena-day-prayer` → "Prayer"
   - `.novena-day-response` → "Response"
   - `.novena-day-closing` → "Closing Prayer"
2. CSS: add `.novena-block-label { font-size:11px;font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:var(--space-2); }`

## IPV-02: Novena splash screen

1. Add `'intro'` to `_screen` states in `src/novena.js`
2. In `_selectNovena(id)`: change `_screen = 'prayer'` → `_screen = 'intro'`
3. Add `_renderIntro(title, body, footer)` function rendering centered splash:
   - Candle/flame or cross SVG icon in sacred color
   - Title in `--font-display`, `--text-2xl`
   - Subtitle: "Nine days of prayer" (or "{N} days of prayer" for non-9-day novenas)
   - Description in `--font-prayer`, italic
   - "Begin Day {N}" button in sacred gold pill
4. Add `novenaBeginPrayer()` function: sets `_screen = 'prayer'`, renders with crossfade if `prayerCore` available, else direct render
5. Export `novenaBeginPrayer` as window global
6. Update render dispatcher to handle `_screen === 'intro'`
7. CSS: add `.novena-intro`, `.novena-intro-icon`, `.novena-intro-title`, `.novena-intro-subtitle`, `.novena-intro-desc`, `.novena-begin` rules (see spec for full CSS)
8. Dark mode: ensure `.novena-begin` background uses `var(--color-sacred)`

## IPV-07: Prayerbook litany intro screen

1. In `prayerbookOpenLitany()` in `src/prayerbook.js`: change `_litanyStep = 0` → `_litanyStep = -1`
2. In `_renderLitany()`: when `_litanyStep === -1`, render intro screen:
   - Cross SVG icon
   - Title in display font
   - Description (use `_litany.description` if present, else "A guided litany of {N} petitions")
   - Instruction: "Swipe or tap to advance. Respond aloud when prompted."
   - "Begin" button in sacred gold pill
3. Add `prayerbookLitanyBegin()` function: sets `_litanyStep = 0`, renders with crossfade
4. Export as window global
5. In `prayerbookLitanyPrev()`: when `_litanyStep === 0`, go back to list (not intro)
6. CSS: add `.litany-intro`, `.litany-intro-icon`, `.litany-intro-title`, `.litany-intro-desc`, `.litany-intro-instruction`, `.litany-begin` rules (see spec)

## IPV-06: Examination completion moment

1. In `src/examination.js`: after the user taps "I received reconciliation" and items are cleared, instead of immediately showing exit options, render a completion screen
2. Completion screen: centered 60vh, cross SVG, "Go in Peace" title, Luke 7:48,50 quote, single "Return to MassFinder" button
3. CSS: add `.exam-complete-screen`, `.exam-complete-icon`, `.exam-complete-title`, `.exam-complete-quote`, `.exam-complete-ref`, `.exam-complete-btn` rules (see spec)
4. Uses existing `rosary-fadein` animation keyframe
5. X button in reader header still works as escape

## IPV-01: Stations accent color variable

1. Add `--color-stations: #8B2252;` and `--color-stations-pale: rgba(139, 34, 82, 0.08);` to `:root` tokens
2. Add dark overrides: `--color-stations: #C75B8F;` and `--color-stations-pale: rgba(199, 91, 143, 0.06);`
3. Find-replace all `#8B2252` in stations CSS rules with `var(--color-stations)`
4. Replace `rgba(139,34,82,...)` patterns with `color-mix(in srgb, var(--color-stations) N%, transparent)` or `var(--color-stations-pale)`

## Verification

- Novena: selecting novena shows splash → "Begin Day N" → prayer with labeled sections
- Novena: day number in sacred gold, completion screen uses SVG cross
- Litany: opening shows intro → "Begin" → first invocation
- Examination: "I received reconciliation" → completion screen → exit
- Stations: all accent elements use CSS variable, dark mode brighter
- All new screens are centered, 60vh, use design system fonts
- All Begin buttons are 48px min-height
- All dark mode rules in place
- `npm run build` succeeds
