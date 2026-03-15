# CLAUDE_CODE_PROMPT_NPT.md — Novena & Practice Tracker

**Spec:** `docs/plans/UX_Spec_Novena_Practice_Tracker.md`  
**Series:** NPT-01 through NPT-03  
**Scope:** Novena deep-linking, liturgical sort, date-aware subtitles

---

## NPT-01: Deep-link novena CTAs (P1 — do first)

1. `src/more.js` ~line 633 (March monthly devotion): change `actionFn: 'openNovena()'` → `actionFn: 'openNovena(\'st_joseph\')'`
2. `src/more.js` ~line 561 (Pentecost seasonal card): change `openNovena()` → `openNovena(\'holy_spirit\')`
3. Search entire `src/more.js` for any other contextual CTA that names a specific novena but calls `openNovena()` bare — fix each with the correct ID
4. Do NOT change the practice strip card at ~line 961 — that should remain `openNovena()` (opens index)
5. Valid IDs: `divine_mercy`, `holy_spirit`, `st_joseph`, `surrender`, `sacred_heart`, `st_jude`, `miraculous_medal`, `st_andrew_christmas`, `st_patrick`

## NPT-02: Liturgical calendar sorting in novena select

1. Add `NOVENA_SEASONS` constant array at top of `src/novena.js` (see spec for full map)
2. In `_renderSelect`, after the active novenas master card and before the general list:
   - Compute today's date
   - Check each NOVENA_SEASONS entry against today (fixed date ranges) or litcal key dates from `window._litcalCache`
   - For matches where the novena is NOT in-progress, render a "Suggested Now" section
   - Each suggested item gets `.novena-item--suggested` class with sacred left-border accent
   - Show the `reason` field as subtitle text
3. CSS additions in `css/app.css`:
   ```css
   .novena-item--suggested { border-left: 3px solid var(--color-sacred); background: var(--color-sacred-pale); }
   html[data-theme="dark"] .novena-item--suggested { background: color-mix(in srgb, var(--color-sacred) 6%, transparent); }
   ```
4. Do not duplicate novenas that already appear in the active section

## NPT-03: Next First Friday/Saturday date in subtitle

1. Add `_getNextFirstFriSat()` helper function in `src/more.js` (see spec for implementation)
2. Find where `'Track devotion'` is used as the fallback `ffLabel` — replace with `_getNextFirstFriSat()`
3. Format: "Next: Apr 3 & Apr 4" using `toLocaleDateString('en-US', { month: 'short', day: 'numeric' })`
4. When an active streak exists (`ctx.ffActive`), existing label takes priority — no change

## Verification

- Tap "Pray the St. Joseph Novena →" → opens St. Joseph novena directly, not index
- Novena list shows "Suggested Now" section when current date matches a season
- In-progress novenas never duplicated between Active and Suggested
- First Fri/Sat card shows "Next: [date] & [date]" when no streak active
- Dark mode: suggested items have subtle sacred tint
- `npm run build` succeeds
