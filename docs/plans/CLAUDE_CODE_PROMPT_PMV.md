# Claude Code Prompt — PMV (Prayer/More V2) — Amended

**Spec:** `docs/plans/UX_Spec_Prayer_More_V2.md`
**Scope:** More tab Zones 2-3 restructure
**Model recommendation:** Opus — structural refactor across HTML, CSS, and JS

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css  # verify tokens
```

Read CLAUDE.md for conventions. Read the full spec at `docs/plans/UX_Spec_Prayer_More_V2.md`.

**Amendment note:** PMV-01 has been dropped. Daily Formation stays in its current position. Explore module, Baltimore Catechism, and Summa are out of scope. Catholic Library is CCC + Bible only (2 cards, not 4).

---

## Task

Implement PMV-02 through PMV-07 as described in the spec. This restructures the More tab from a flat prayer tools grid into four semantic sections: Guided Prayer (fixed 2x2 grid), Prayer Book (gateway card), Your Practice (tracker strip), and Catholic Library (CCC + Bible). The hidden "Grow in Faith" section is replaced by a visible "Catholic Library" section.

### Implementation order:

1. **PMV-06 + PMV-05:** Remove `#libraryTeaser` div and `#deeperZone` details element from `index.html`. Replace with new `#studyZone` containing `#libraryGrid` (1x2 grid with CCC + Bible) and `#devotionalSection` (faith guides inside `<details>`). Add zone seam before study zone. Add all `.library-*`, `.faith-guides-*`, `.more-zone--study` CSS per spec. In `more.js`, add library grid rendering with 2 cards (Catechism and Bible) using SVG icons from spec. Move devotional guide rendering into `#devotionalCards` inside `#faithGuidesToggle`. Replace deeperZone open/close memory with faithGuidesToggle. Update count badge from `#deeperCount` to `#guidesCount`. **Note: library icons use square radius + neutral colors, not round sacred icons.**

2. **PMV-02:** Change `STICKY_IDS` to `GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true }`. The guided grid renders only these 4 cards into `#prayerToolsGrid`. Fixed order: Rosary (top-left), Chaplet (top-right), Examination (bottom-left), Stations (bottom-right). Change section title from "Prayer & Devotion" to "Guided Prayer" using `.more-section-title--pray`. Bump min-height to 88px.

3. **PMV-03:** Add `#prayerBookGateway` div after `#prayerToolsGrid` in HTML. Render the full-width gateway card with prayerbook icon, "Prayer Book" title, subtitle "31 prayers · Guided litanies · Lectio Divina", and right chevron. Add `.prayerbook-gateway-*` CSS per spec.

4. **PMV-04:** Replace `#prayerToolsSecondaryWrap` with `#practiceStrip`. Render two compact cards (Novenas, First Friday) with active state detection. Add `.practice-*` CSS per spec. Remove the old "More tools" accordion rendering entirely.

5. **PMV-07:** Replace `_resolveCardTiers()` with `_getContextualState()`. Each section reads contextual state independently. Key rule: **no card ever changes position**. All promotion is expressed as color/subtitle changes only.

6. **Dead CSS:** Mark retired classes with `/* PMV: retire after v2 stable */`. Don't delete yet.

### Key conventions:
- CommonJS everywhere, no arrow functions, `var` not `const`/`let`
- `utils.esc()` for user-facing strings
- Design tokens only — never hardcode colors
- `var(--color-sacred)` for prayer elements, `var(--color-accent)` for seasonal
- Every element needs `html[data-theme="dark"]` override
- Touch targets >= 44x44pt, SVG only — no emoji

### Files to modify:
- `index.html` — DOM restructure (remove libraryTeaser + deeperZone, add studyZone + prayerBookGateway + practiceStrip)
- `css/app.css` — New classes + dark mode + mark retired classes
- `src/more.js` — Restructure `renderMore()` for new section model

### Files NOT to modify:
- `src/app.js` — Daily Formation stays as-is
- `src/prayerbook.js`, `src/novena.js`, `src/rosary.js`, `src/ccc.js`, `src/bible.js` — all reader modules are entry-point-agnostic
- `src/devotions.js` — Still renders into `#devotionalCards`

### Test after implementation:
```
npm run build
```
- [ ] Today zone: unchanged (Saint, Seasonal, Readings)
- [ ] Guided Prayer: fixed 2x2 grid (Rosary top-left, Chaplet top-right, Exam bottom-left, Stations bottom-right)
- [ ] Prayer Book: full-width gateway card below grid, opens Prayer Book reader
- [ ] Your Practice: two compact cards (Novenas, First Friday) with active state
- [ ] Daily Formation: unchanged, renders in current position
- [ ] Catholic Library: 2 cards (Catechism, Sacred Scripture) with square-radius neutral icons
- [ ] Faith Guides: behind disclosure toggle below library
- [ ] All touch targets >= 44pt
- [ ] Dark mode: every new element has dark override
- [ ] Lent: Stations gets accent color (no position change)
- [ ] Active novena: Novenas practice card shows green (no grid change)
- [ ] No "coming soon" library teaser anywhere
- [ ] No console errors
- [ ] Scroll length reasonable on iPhone SE through iPhone 15 Pro Max

### Commit message:
```
feat: restructure More tab prayer/study zones (PMV-02-07)

- Fixed 2x2 guided prayer grid: Rosary, Chaplet, Exam, Stations (PMV-02)
- Prayer Book as distinctive full-width gateway card (PMV-03)
- Compact practice tracker strip for Novenas + First Friday (PMV-04)
- New visible Catholic Library: Catechism + Bible (PMV-05)
- Faith Guides moved below library behind disclosure (PMV-06)
- Simplified contextual promotion to visual emphasis only (PMV-07)
```
