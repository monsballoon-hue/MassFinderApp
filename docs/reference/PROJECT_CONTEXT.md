# MassFinder — Project Context Reference
## Single-file context for new Claude chat sessions

**Last updated:** 2026-03-11 | **Commit:** `57546fb`

---

## What This App Is

MassFinder is a free, open-source (AGPL-3.0) vanilla JS Progressive Web App helping Catholics find Mass, Confession, Adoration, and other services across Western New England (93 parishes, ~1,690 services, 91 verified). Personal stewardship project — non-commercial, mission-driven, self-funded. Dev works limited evening hours alongside full-time job and family.

**Repo:** `github.com/monsballoon-hue/MassFinderApp` | **Deploy:** Vercel from `main` branch
**Three user demographics:** Older parishioners (50+), phone-native younger adults, middle group wanting utility without complexity
**Design philosophy:** Apple HIG adherence, mobile-first, progressive disclosure

---

## Architecture

```
24 JS modules (src/) → esbuild IIFE → dist/app.min.js (~221KB)
css/app.css (~167KB, ~1,800 lines)
parish_data.json (930KB) + events.json (113KB) — fetched at startup
data/ (lazy-loaded): catechism 1.36MB, bible-drb/ 74 books, bible-cpdv/ 74 books,
  bible-xrefs 4MB, prayers 47KB, examination 11KB, lectionary-index 22KB,
  litcal-2026/2027 70KB each, baltimore-catechism 48KB
```

**Key modules:** config.js (enums), data.js (state), render.js (cards + detail), events.js, map.js (Leaflet + filter sync), readings.js (readings + liturgical), ui.js (filters + tabs), saved.js (dashboard), ccc.js (Catechism sheet), bible.js (Scripture sheet), rosary.js, examination.js, stations.js, novena.js, haptics.js (shared), ccc-data.js (shared), refs.js, devotions.js, forms.js, install-guide.js, location.js, more.js, app.js (entry)

**Build:** `npm run build` → esbuild IIFE + auto SW cache bump
**CI:** GitHub Actions — build + schema validate + data validate

---

## What's Shipped (comprehensive)

**Core:** Find tab (search + chips + cards), Map tab (filter carry-over, gold saved pins, dark tiles), Saved tab ("Your Parishes" dashboard with today timeline + compact rows + activity), More tab (saint card, CCC reflection, readings, prayer tools, faith guides)

**Prayer modules:** Guided Rosary (set-color beads, crossfade transitions, Georgia serif prayer text, manual "Amen" completion), Examination of Conscience (centering prayer screen, full-row tap targets, confessional format summary, Act of Contrition elevated), Stations of the Cross, Novena Tracker

**Content layers:** Full CCC (2,865 §§ + xrefs, section context, accent blockquotes, crossfade nav), DRB + CPDV Bible (per-book lazy load, cross-references), Baltimore Catechism, Lectionary Index, Pre-built liturgical calendar

**UX:** Dark mode with seasonal accent threading (purple/gold/green), haptic feedback, wake lock, fasting calculator, streak tracking, fuzzy search, QR codes, term tooltips, daily reading notifications, view transitions

**Detail panel:** Street address display, next-service highlight card, CSS grid accordions, "today" dot indicators, compact badge set, verification prompt

**CCC sheet:** 88vh, Georgia serif body, section context line, accent blockquotes, full dark mode, crossfade navigation, "See Also" with context

**Infrastructure:** Automated SW cache busting, schema validation CI, feature flags for APIs, shared haptics.js + ccc-data.js + utils (no more duplication), event delegation for core interactions

---

## What's Remaining (14 items)

### Priority 1
- **OW-01:** Replace CLAUDE.md with updated version (5 min)
- **OW-02:** romcal offline liturgical calendar — replace API fetch in build-litcal.js with romcal npm package (3 hrs)
- **OW-03:** Web Speech API read-aloud for daily readings (30 min)
- **OW-04:** build-examination.js build script (1 hr)

### Priority 2
- **OW-05:** Summa Theologica daily wisdom card — curate 365 articles, build script, More tab card (3 hrs)
- **OW-06:** "Pray for Me" anonymous intentions counter (2 hrs)

### Priority 3 (Stretch)
- **OW-07→OW-12:** Latin/English toggle, Gregorian chant, Catholic hierarchy, ambient prayer tones, Bluetooth rosary, Doctors of the Church gallery

### Docs maintenance
- **OW-13:** Remove Node v12 warnings from ANTI_PATTERNS.md (10 min)
- **OW-14:** Add `--font-prayer` to STYLE_GUIDE.md (15 min)

### Docs to archive (move to docs/archive/)
Fully superseded plans: `CCC_BottomSheet_UX_Redesign.md`, `MassFinder_Redesign_Audit_v3.md`, `MassFinder_UX_Implementation_Spec_Amended.md`, `MassFinder_UX_Remediation.md`, `MassFinder_V2_Rebuild_Plan_ClaudeCode.md`

---

## Consulting Conventions

**Workflow:** Claude Opus in chat → spec sheets with item IDs → Claude Code (Sonnet for tight specs, Opus for refactors) → implementation
**Spec format:** Numbered IDs (e.g., D-01, CCC-07), exact file paths, before/after code, CSS + dark mode, test checklist. Designed for "do all but X" cherry-picking.

**Design principles enforced:**
- `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair) for headings, `--font-body` (Source Sans) for UI
- Seasonal accent threading (--color-accent shifts with liturgical season)
- Dark mode parity for every element
- SVG only (no emoji/decorative icons)
- Haptic feedback on interactive touches
- Privacy-first (exam items in memory only)
- Local-first (features must work from cached data)
- CommonJS everywhere, no arrow functions, config.js is canonical

**Key files for any evaluation:** Fresh clone → `src/[module].js` + `css/app.css` (lines 38-80 for tokens) + `CLAUDE.md` + `docs/plans/MassFinder_Master_Feature_Catalog.md`

**To start a new evaluation:** "Fresh clone, evaluate [area]" — tells consultant to read actual code, not rely on context alone.
