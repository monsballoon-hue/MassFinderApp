# Claude Code Prompt — PMV (Prayer Tools Grid Restructure)

**Spec:** `docs/plans/UX_Spec_Prayer_More_V2.md`
**Scope:** More tab Zone 2 only — prayer grid, Prayer Book card, practice strip
**Model recommendation:** Sonnet — well-bounded changes in 3 files

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css  # verify tokens
```

Read CLAUDE.md. Read `docs/plans/UX_Spec_Prayer_More_V2.md`.

**Scope guard:** Do NOT touch Zone 1 (Today), Zone 3 (Grow in Faith / deeperZone), the library teaser, Daily Formation, or any reader modules. Changes are limited to the prayer tools section inside `.more-zone--practice`.

---

## Implementation (4 items, 1 commit)

### 1. PMV-07: Replace _resolveCardTiers()

In `src/more.js`, replace the `_resolveCardTiers()` function and its call site with `_getContextualState()` per spec. This function returns flags (stationsLent, chapletHourOfMercy, examRecent, examNudge, novenaActive, novenaLabel, ffActive, ffLabel) that are consumed independently by the grid, gateway, and practice strip renderers. Preserve all existing seasonal novena detection logic and First Friday near-date logic — just restructure how results are consumed.

### 2. PMV-02: Fix guided prayer grid

Change `STICKY_IDS` to `GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true }`. Filter `ptCards` to only GUIDED_IDS for the `#prayerToolsGrid` render. Enforce fixed order: Rosary, Chaplet, Examination, Stations. Change section title in HTML from "Prayer &amp; Devotion" to "Guided Prayer" with class `more-section-title--pray`. Add CSS per spec. Apply contextual state as color/subtitle changes only — never reorder cards.

### 3. PMV-03: Prayer Book gateway card

Add `<div id="prayerBookGateway"></div>` after `#prayerToolsGrid` in `index.html`. In `renderMore()`, render a full-width card with the existing `ptIcons.prayerbook` SVG, title "Prayer Book", subtitle "31 prayers · Guided litanies · Lectio Divina", and a right-pointing chevron. Calls `openPrayerBook()`. Add all `.prayerbook-gateway-*` CSS per spec including dark mode.

### 4. PMV-04: Practice strip

Replace `#prayerToolsSecondaryWrap` with `<div id="practiceStrip"></div>` in `index.html`. In `renderMore()`, render two compact cards (Novenas and First Friday) using existing `ptIcons.novena` and `ptIcons.firstfriday` SVGs, with active-state detection from `_getContextualState()`. Add `.practice-*` CSS per spec. Remove all "More tools" accordion rendering code.

### Key conventions:
- CommonJS, `var`, no arrow functions
- `utils.esc()` for all strings
- Design tokens only
- Every new CSS class needs `html[data-theme="dark"]` override
- Touch targets ≥ 44pt
- SVG only

### Files:
- `index.html` — add #prayerBookGateway, replace #prayerToolsSecondaryWrap with #practiceStrip, change section title
- `css/app.css` — new classes, mark retired classes with `/* PMV: retire after v2 stable */`
- `src/more.js` — restructure renderMore() prayer tools section

### Do NOT touch:
- Zone 1, Zone 3, #libraryTeaser, #deeperZone, #dailyFormation
- Any file in src/ other than more.js

### Test:
```
npm run build
```
- [ ] Grid: Rosary/Chaplet/Exam/Stations in fixed positions
- [ ] Title: "Guided Prayer"
- [ ] Prayer Book: full-width gateway card below grid
- [ ] Practice: two compact cards (Novenas, First Friday)
- [ ] Lent: Stations accent color, same position
- [ ] Active novena: practice card green
- [ ] Dark mode: all new elements
- [ ] No console errors
- [ ] Zone 1 and Zone 3 completely unchanged

### Commit:
```
feat: restructure prayer tools grid (PMV-02/03/04/07)

- Fixed 2x2 guided grid: Rosary, Chaplet, Exam, Stations (PMV-02)
- Prayer Book as full-width gateway card (PMV-03)
- Compact practice strip for Novenas + First Friday (PMV-04)
- Simplified promotion to visual emphasis only (PMV-07)
```
