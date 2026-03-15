# Claude Code Prompt — PMV (Prayer/More V2)

**Spec:** `docs/plans/UX_Spec_Prayer_More_V2.md`
**Scope:** More tab Zones 2–3 restructure
**Model recommendation:** Opus — this is a structural refactor across HTML, CSS, and JS with cross-module awareness

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css  # verify tokens
```

Read CLAUDE.md for conventions. Read the full spec at `docs/plans/UX_Spec_Prayer_More_V2.md`.

---

## Task

Implement PMV-01 through PMV-07 as described in the spec. This restructures the More tab from a flat prayer tools grid into four semantic sections: Guided Prayer (2×2 grid), Prayer Book (gateway card), Your Practice (tracker strip), and Catholic Library (reference grid). The Daily Formation card moves into the Today zone. The hidden "Grow in Faith" section is replaced by a visible "Catholic Library" section.

### Implementation order:

1. **PMV-01:** Move `#dailyFormation` from `.more-zone--practice` to inside `.more-zone--today` (after `#readingsSection`) in `index.html`. Add sacred-tinted border CSS for it inside the Today zone. No JS changes — `_renderDailyFormation()` targets by ID.

2. **PMV-06 + PMV-05:** Remove `#libraryTeaser` div and `#deeperZone` details element from `index.html`. Replace with new `#studyZone` containing `#libraryGrid` (2×2 grid) and `#devotionalSection` (faith guides inside `<details>`). Add zone seam before study zone. Add all `.library-*`, `.faith-guides-*`, `.more-zone--study` CSS per spec. In `more.js`, add library grid rendering with 4 cards (Explore, Catechism, Bible, Baltimore) using the SVG icons from the spec. Move devotional guide rendering into the new `#devotionalCards` inside `#faithGuidesToggle`. Replace deeperZone open/close memory with faithGuidesToggle. Update count badge from `#deeperCount` to `#guidesCount`.

3. **PMV-02:** Change the `STICKY_IDS` to `GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true }`. The guided grid renders only these 4 cards into `#prayerToolsGrid`. Change section title from "Prayer & Devotion" to "Guided Prayer" using `.more-section-title--pray`. Bump min-height to 88px.

4. **PMV-03:** Add `#prayerBookGateway` div after `#prayerToolsGrid` in HTML. Render the full-width gateway card with book icon, "Prayer Book" title, content count subtitle, and chevron. Add all `.prayerbook-gateway-*` CSS per spec.

5. **PMV-04:** Replace `#prayerToolsSecondaryWrap` with `#practiceStrip`. Render two compact cards (Novenas, First Friday) with active state detection. Add all `.practice-*` CSS per spec. Remove the old "More tools" accordion rendering.

6. **PMV-07:** Replace `_resolveCardTiers()` with `_getContextualState()`. Each section (guided grid, practice strip) reads contextual state independently. Keep all existing promotion logic (Lent stations, 3PM chaplet, seasonal novena, near-date FF) but express it as visual emphasis flags rather than card placement.

7. **Dead CSS:** Mark retired classes with `/* PMV: retire after v2 stable */` comments. Don't delete them yet.

### Key conventions:
- CommonJS everywhere, no arrow functions
- `var` not `const`/`let`
- `utils.esc()` for user-facing strings
- Design tokens from css/app.css — never hardcode colors
- `var(--color-sacred)` for sacred elements, `var(--color-accent)` for seasonal
- Every element needs `html[data-theme="dark"]` override
- Touch targets ≥ 44×44pt
- SVG only — no emoji

### Files to modify:
- `index.html` — DOM restructure (move dailyFormation, remove libraryTeaser + deeperZone, add studyZone + prayerBookGateway + practiceStrip)
- `css/app.css` — New classes + dark mode + mark retired classes
- `src/more.js` — Restructure `renderMore()` for new section model

### Files NOT to modify:
- `src/app.js` — `_renderDailyFormation()` works by ID, transparent to DOM move
- `src/prayerbook.js`, `src/novena.js`, `src/rosary.js`, etc. — All reader modules are entry-point-agnostic
- `src/devotions.js` — Still renders into `#devotionalCards`

### Test after implementation:
```
npm run build
# Open in browser, navigate to More tab
```
- [ ] Today zone: Saint → Seasonal → Readings → Daily Formation (Baltimore Q&A)
- [ ] Guided Prayer: 2×2 grid with Rosary, Chaplet, Examination, Stations
- [ ] Prayer Book: Full-width gateway card below grid, opens Prayer Book reader
- [ ] Your Practice: Two compact cards (Novenas, First Friday) with active state
- [ ] Catholic Library: 2×2 grid with Explore, Catechism, Bible, Baltimore
- [ ] Faith Guides: Behind disclosure toggle below library
- [ ] All touch targets ≥ 44pt
- [ ] Dark mode: Every new element has dark override
- [ ] Lent promotion: Stations gets accent color in guided grid
- [ ] Active novena: Novenas practice card shows green active subtitle
- [ ] No console errors
- [ ] Scroll length reasonable on iPhone SE (320px) through iPhone 15 Pro Max

### Commit message:
```
feat: restructure More tab prayer/study zones (PMV-01→07)

- Move Daily Formation into Today zone (PMV-01)
- Fixed 2×2 guided prayer grid: Rosary, Chaplet, Exam, Stations (PMV-02)
- Prayer Book as distinctive full-width gateway card (PMV-03)
- Compact practice tracker strip for Novenas + First Friday (PMV-04)
- New visible Catholic Library section with 4 reference cards (PMV-05)
- Faith Guides moved below library behind disclosure (PMV-06)
- Simplified contextual promotion to visual emphasis only (PMV-07)
```
