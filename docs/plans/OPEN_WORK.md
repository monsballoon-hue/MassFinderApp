# MassFinder — Open Work Register
## All remaining features, fixes, and improvements

**As of:** 2026-03-11 | **Commit:** `57546fb`
**Catalog status:** 53 of 67 items complete (including items done but not yet marked in catalog)

---

## CATALOG ITEMS DONE BUT NOT MARKED (update the catalog)

These items are implemented in code but the Master Feature Catalog still shows them as open. Mark them ~~strikethrough~~ ✓ DONE:

- **DAT-07:** Bible Cross-Reference Database — `data/bible-xrefs.json` exists (4MB), loaded by `src/bible.js`
- **BLD-04:** `scripts/build-bible-drb.js` — exists and works
- **BLD-05:** `scripts/build-lectionary.js` — exists and works
- **BLD-06:** `scripts/build-litcal.js` — exists (fetches from LitCal API, not romcal)
- **XREF-02:** Tappable Scripture References — `src/devotions.js` uses `refs.renderRef('bible', ref)`, rosary scripture links use `_refTap('bible', ...)`, both connect to `src/bible.js` → `openBible()`
- **LIB-05:** Already marked REVERTED — confirm text is accurate

---

## ACTIVE REMAINING WORK (14 items)

### Priority 1 — High value, clear scope

#### OW-01: DOC-03 — Update CLAUDE.md
- **Status:** Being addressed now. New CLAUDE.md produced as part of this audit.
- **Action:** Replace root `CLAUDE.md` with the updated version. Then mark DOC-03 as done.
- **Effort:** 5 min (file replacement)

#### OW-02: LIT-01 — romcal Offline Liturgical Calendar
- **What:** `scripts/build-litcal.js` currently fetches from the LitCal API at build time. The original plan was to use the `romcal` npm package to compute calendars locally, making builds fully offline-capable.
- **Current state:** Pre-built `data/litcal-2026.json` and `data/litcal-2027.json` exist. The app falls back to these when the API is unavailable. The API is the primary source for saint card and liturgical events.
- **Remaining work:** Install `romcal` as a devDependency. Rewrite `scripts/build-litcal.js` to use romcal's `Calendar` API with US national calendar plugin instead of HTTP fetch. Output format must match existing litcal-YYYY.json structure.
- **Why it matters:** Build reproducibility. If the LitCal API goes down during a build, the calendar data can't be regenerated.
- **Effort:** 3 hours
- **Files:** `scripts/build-litcal.js`, `package.json` (add romcal devDep)

#### OW-03: UX-04 — Web Speech API Read Aloud
- **What:** "Listen" button on daily reading cards in the More tab. Uses `SpeechSynthesisUtterance` to read the text aloud.
- **Implementation:** Add a play/pause button to each expanded reading in `src/readings.js`. Use `speechSynthesis.speak()` with `rate: 0.9`. Toggle between play (speaker icon) and pause (stop icon). Cancel speech on reading collapse or tab switch.
- **Accessibility win:** Helps low-vision users and people praying while driving.
- **Effort:** 30 min
- **Files:** `src/readings.js`, `css/app.css` (button styling)

#### OW-04: BLD-03 — build-examination.js
- **What:** Build script to transform ConfessIt translation JSON (or other source) into `data/examination.json`.
- **Current state:** `data/examination.json` was hand-authored. No build script exists.
- **Why it matters:** Reproducibility. If the examination data needs updating, there's no pipeline.
- **Effort:** 1 hour
- **Files:** `scripts/build-examination.js`

### Priority 2 — Valuable, needs design decisions

#### OW-05: DAT-08 — Summa Theologica Daily Wisdom
- **What:** Curate ~365 articles from the Summa Theologica, matched to liturgical themes. One article per day in a "Daily Wisdom" card on the More tab.
- **Source repo:** `Jacob-Gray/summa.json` (public domain, 20MB total)
- **Build script needed:** `scripts/build-summa.js` — curate subset, map to liturgical season/themes
- **Output:** `data/summa-daily.json` (~50KB)
- **Feature code:** New rendering block in `src/more.js` or `src/readings.js`, similar to the daily CCC reflection
- **Design decision needed:** Where does this card live? Below the CCC reflection? Separate section? Toggle between CCC and Summa?
- **Effort:** 3 hours (curation + build script + rendering)

#### OW-06: PAT-07 — "Pray for Me" Intentions Counter
- **What:** Anonymous "Pray for me" button. Tap → counter increments. Shows "142 people praying today." No accounts, no text, no moderation.
- **Design decision needed:** Where does this live? Saint card? Daily reading? Its own card? Backend: Supabase counter table? GA event? Vercel KV?
- **Privacy constraint:** Must be fully anonymous. No user identification.
- **Effort:** 2 hours (backend + frontend)

### Priority 3 — Stretch / Long Horizon

#### OW-07: STR-01 — Latin/English Translation Toggle
- **What:** Parallel DRB English + Clementina Vulgata Latin in the Bible sheet. Toggle button.
- **Source:** `mborders/vulgata` repo (public domain)
- **Audience:** TLM attendees (niche but passionate)
- **Effort:** 4 hours (data pipeline + UI toggle)

#### OW-08: STR-02 — Gregorian Chant Database
- **What:** Link from liturgical day to proper chants via GregoSearch.
- **Audience:** Extremely niche.
- **Effort:** 2 hours

#### OW-09: STR-03 — Catholic Hierarchy Data
- **What:** Auto-populate diocese info for forkers from catholic-hierarchy.org data.
- **Effort:** 2 hours

#### OW-10: STR-04 — Ambient Prayer Tones
- **What:** Programmatic sine wave (174 Hz, very quiet) during guided prayer. Web Audio API, no audio files.
- **Design decision needed:** Opt-in? Per-module? Volume control?
- **Effort:** 1 hour

#### OW-11: STR-05 — Physical Rosary Counter (Web Bluetooth)
- **What:** Bluetooth-connected physical rosary advances the app's rosary module.
- **Audience:** Extremely niche. Web Bluetooth support is limited.
- **Effort:** 4 hours

#### OW-12: STR-06 — Doctors of the Church Gallery
- **What:** 37 entries with names, dates, notable works. Badge on saint card when the day's saint is a Doctor.
- **Effort:** 2 hours (data + badge rendering)

### Documentation Maintenance

#### OW-13: Update docs/ANTI_PATTERNS.md
- **What:** Remove Node.js v12 warnings (engine is >=18, CI uses Node 20). Update to reflect current environment.
- **Effort:** 10 min

#### OW-14: Update docs/STYLE_GUIDE.md
- **What:** Add `--font-prayer` to the design tokens table. Document the three-font system (display, body, prayer). Update component examples for contemplative text styling.
- **Effort:** 15 min

---

## DOCS THAT NEED ACTION

### Keep as-is (current and accurate)
- `docs/DATA_STANDARDS.md` — authoritative data rules
- `docs/TERMINOLOGY.md` — liturgical correctness reference
- `docs/PERSONAS.md` — user personas and UX principles
- `docs/CONTRIBUTING.md` — contributor onboarding
- `docs/FORK_GUIDE.md` — diocese fork instructions
- `docs/DEV_CHEATSHEET.md` — Claude Code quick reference
- `docs/review/validation-checklist.md` — parish validation checklist

### Keep but update
- `docs/ANTI_PATTERNS.md` — remove Node v12 section (OW-13)
- `docs/STYLE_GUIDE.md` — add `--font-prayer`, update component list (OW-14)
- `docs/ROADMAP.md` — metrics are stale (says 28 validated, actual is 91; says ~1,407 services, actual is 1,690). Batch structure may need updating.
- `docs/INTEGRATIONS.md` — add Bible data (DRB, CPDV), BibleGet verse integration, litcal pre-built JSON, bible-xrefs. Remove any references that suggest these are future work.
- `docs/plans/MassFinder_Master_Feature_Catalog.md` — mark the 5 newly-done items listed above

### Archive (historical — fully superseded by implementation)
These docs were planning/strategy artifacts for work that's now complete. They're not wrong, but they describe a past state and could confuse Claude Code if used as context. Move to `docs/archive/` or delete:

- `docs/plans/CCC_BottomSheet_UX_Redesign.md` — superseded by CCC-01→CCC-14 implementation
- `docs/plans/MassFinder_Redesign_Audit_v3.md` — all changes implemented
- `docs/plans/MassFinder_UX_Implementation_Spec_Amended.md` — all 22 changes implemented
- `docs/plans/MassFinder_UX_Remediation.md` — all remediation work done
- `docs/plans/MassFinder_V2_Rebuild_Plan_ClaudeCode.md` — V2 rebuild is complete

### Keep as reference (historical but still useful context)
- `docs/plans/Catholic_API_Integration_Spec.md` — API endpoint details, auth, response formats still useful for maintenance
- `docs/plans/MassFinderApp_Content_Extensibility_Report.md` — strategy context for Summa and future content decisions
- `docs/plans/MassFinderApp_GitHub_Repos_Report.md` — repo catalog for stretch items
- `docs/plans/MassFinderApp_Extended_Resources_Addendum.md` — additional repos for stretch items
- `docs/MassFinder_Feature_Discovery_Report.md` — feature research context
- `docs/MassFinder_UI_Toolkit_Report.md` — component evaluation decisions
- `docs/MassFinder_Open_Source_Guide.md` — community strategy
- `docs/MassFinder_UX_Vision.md` — long-term product vision
