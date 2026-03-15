# CLAUDE_CODE_PROMPT_DRT.md — Daily Readings Typography

**Spec:** `docs/plans/UX_Spec_Daily_Readings_Typography.md`  
**Series:** DRT-01 through DRT-03  
**Scope:** Reading text formatting — verse numbers, rubrics, size

---

## DRT-01: Remove verse numbers (P1)

1. `src/readings.js` in `formatReading()` (~lines 893–896):
   - Line matching `^(\d{1,3})\s+(.+)$`: instead of wrapping number in `<span class="verse-num">`, just return `esc(vm[2])` (text only)
   - Regex replacing mid-sentence `\d{1,3}` with `<span class="verse-num">`: strip the number entirely, keeping surrounding text
   - Before: `if (vm) return '<span class="verse-num">' + vm[1] + '</span>' + esc(vm[2]);`
   - After: `if (vm) return esc(vm[2]);`
   - Before: `processed = processed.replace(/(\.?\s+)(\d{1,3})\s+/g, '$1<span class="verse-num">$2</span> ');`
   - After: `processed = processed.replace(/(\.?\s+)\d{1,3}\s+/g, '$1');`
2. Do NOT touch `.bible-verse-num` in bible.js — that's a separate module
3. Optionally remove the now-dead `.reading-text .verse-num` rule at css/app.css ~line 2421

## DRT-02: Rubric/conclusion formatting (P2)

1. `css/app.css` ~line 1745: change `.reading-text .reading-para` margin from `var(--space-3)` to `var(--space-4)`
2. `css/app.css` ~line 2425: add `font-size: var(--text-xs); letter-spacing: 0.02em;` to `.reading-text .reading-intro`
3. `css/app.css` ~line 2426: change `.reading-text .reading-conclusion` margin-top from `var(--space-4)` to `var(--space-5)`, letter-spacing from `0.04em` to `0.06em`

## DRT-03: Reading body text size (P3)

1. `css/app.css` ~line 1744: change `.reading-text` font-size from `var(--text-sm)` to `var(--text-base)`

## Verification

- Expand any daily reading — no verse numbers visible
- Rubric ("A reading from...") is smaller italic text
- Conclusion ("The word of the Lord") has clear vertical separation
- Body text is 16px Georgia, comfortable at arm's length
- Psalm formatting (refrains, R. markers) still correct
- Bible module verse numbers unaffected
- Dark mode renders correctly
- `npm run build` succeeds
