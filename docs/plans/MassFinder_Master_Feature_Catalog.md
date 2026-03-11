# MassFinder — Master Feature & Enhancement Catalog
## Every Actionable Item Across All Reports, Categorized and Prioritized

**Source reports consolidated:**
- V2 Architecture Assessment
- Content Extensibility Report
- GitHub Repos Report
- Extended Resources Addendum
- Architecture Redesign V2
- Feature Discovery Report
- UI Toolkit Report
- CCC Bottom Sheet UX Redesign
- Catholic API Integration Spec
- V2 Rebuild Plan (Claude Code handoff)

**Format:** Each item has a unique ID (`CAT-NN`), priority tier, effort estimate, size impact, source reference, and implementation notes. Claude Code can parse by section or search by ID.

**Status legend:** ~~Strikethrough~~ ✓ DONE = shipped to production. All others are not yet started unless noted.

---

# CATEGORY 1: ARCHITECTURE FIXES (must-do before feature work)

These are defects or gaps in the current repo that could cause confusion, break forks, or create maintenance debt.

## 1.1 Fork-Blocking Issues

### ~~ARC-01: Schema Generator Doesn't Update Regional Constraints~~ ✓ DONE
- **Priority:** P0 — blocks all fork promotion
- **Effort:** 20 minutes
- **Size impact:** 0
- **File:** `scripts/generate-schema.js`
- **Problem:** Generator updates `service_type_enum` and `day_enum` from `config.js` but leaves `state` enum hardcoded to `['MA','CT','VT','NH','NY']` and lat/lng bounds hardcoded to Western New England. A forker who changes `REGION.states` to `['FL']` gets a schema that rejects their data.
- **Fix:** Add three more replacement lines in `generate-schema.js`:
  - `schema.definitions.location.properties.state.enum = config.REGION.states`
  - Remove or parameterize lat/lng bounds (add `config.REGION.bounds` or remove bounds entirely)
  - Remove phantom `'NY'` from template (not in config, not in data)

### ~~ARC-02: FORK_GUIDE Field Names Mismatch Config.js~~ ✓ DONE
- **Priority:** P0 — blocks all fork promotion
- **Effort:** 10 minutes
- **Size impact:** 0
- **File:** `docs/FORK_GUIDE.md`
- **Problem:** Guide shows `shortName` (doesn't exist), `diocese` (actual: `dioceseName`), `web3formsKey` (actual: `web3FormsKey` capital F). Missing fields: `tagline`, `readingsApiUrl`, `dioceseUrl`.
- **Fix:** Replace the example REGION object in FORK_GUIDE with the exact one from `config.js`.

## 1.2 Code Health

### ~~ARC-03: Dead Code in map.js Line 70~~ ✓ DONE
- **Priority:** P1
- **Effort:** 2 minutes
- **Size impact:** -200 bytes
- **File:** `src/map.js`, line 70
- **Problem:** Generates an onclick string with `require('./src/map.js')` that would fail at runtime. Immediately overwritten on line 72 with correct version. Leftover from port.
- **Fix:** Delete line 70.

### ~~ARC-04: openCCC Double-Export Pattern~~ ✓ DONE
- **Priority:** P1
- **Effort:** 10 minutes
- **Size impact:** 0
- **Files:** `src/more.js` (line 600), `src/ccc.js` (line 121), `src/app.js`
- **Problem:** `more.js` defines its own `openCCC()` as a thin wrapper around `ccc.openCCC()`. Both modules export `openCCC`. The call chain is HTML tap → `more.openCCC()` → `ccc.openCCC()`.
- **Fix:** Remove `openCCC` from `more.js`. In `app.js`, expose `window.openCCC = ccc.openCCC` directly.

### ~~ARC-05: LANG_NAMES Duplicated Across Modules~~ ✓ DONE
- **Priority:** P2
- **Effort:** 10 minutes
- **Size impact:** -100 bytes
- **Files:** `src/events.js` (line 4), `src/data.js` (line 40)
- **Problem:** Both modules compute `LANG_NAMES` from `config.LANGUAGES`. This should be a derived value in `config.js` (like `SVC_LABELS` and `DAY_NAMES` already are).
- **Fix:** Add `var LANG_NAMES = {}; Object.keys(LANGUAGES).forEach(function(k) { LANG_NAMES[k] = LANGUAGES[k].label; });` to config.js exports. Remove from events.js and data.js.

### ~~ARC-06: more.js Approaching Monolith (623 lines)~~ ✓ DONE
- **Priority:** P2
- **Effort:** 1 hour
- **Size impact:** 0 (reorganization)
- **File:** `src/more.js`
- **Problem:** Contains devotional guide HTML (~400 lines of string templates), feedback forms, correction forms, Web3Forms, about section, PWA install, and CCC wiring. Same organic growth pattern that created the original monolith.
- **Fix:** Split into `src/devotions.js` (DEVOTIONAL_GUIDES data + renderGuide), `src/forms.js` (feedback, correction, Web3Forms), and a slimmer `src/more.js` that imports both.

## 1.3 Build & Deploy Robustness

### ~~ARC-07: No Automated Service Worker Cache Busting~~ ✓ DONE
- **Priority:** P1
- **Effort:** 30 minutes
- **Size impact:** 0
- **Files:** `sw.js` (line 1), `scripts/build.js`
- **Problem:** `CACHE_NAME` is manually incremented (`'massfinder-v3_20260309_02'`). If code changes ship without a bump, returning users get stale content indefinitely.
- **Fix:** In `scripts/build.js`, generate a hash from build timestamp. Use esbuild's `--define` to inject `BUILD_HASH` into `sw.js`. Cache name becomes `'mf-' + BUILD_HASH`.

### ARC-08: Schema Template Not Validated in CI
- **Priority:** P2
- **Effort:** 5 minutes
- **Size impact:** 0
- **File:** `.github/workflows/build-and-validate.yml`
- **Problem:** CI validates the generated schema against data but doesn't validate that the template itself is valid JSON. A broken template silently produces corrupt output.
- **Fix:** Add step: `node -e "JSON.parse(require('fs').readFileSync('parish_data.schema.template.json','utf8'));console.log('✓ Template valid')"` before `npm run schema`.

### ARC-09: Feature Flags for External APIs
- **Priority:** P2
- **Effort:** 20 minutes
- **Size impact:** 0
- **File:** `src/config.js`
- **Problem:** `readings.js` has LitCal, BibleGet, and readings API integrations with no way to disable individual features. Forkers who don't want BibleGet have to edit module code.
- **Fix:** Add to config.js: `var FEATURES = { litcal: true, bibleget: true, readings_api: true, hdo_banner: true };`. Check flags before API calls in `readings.js`.

### ARC-10: apply-changes.js Uses Array Index Not Service ID
- **Priority:** P2
- **Effort:** 30 minutes
- **Size impact:** 0
- **File:** `scripts/apply-changes.js`
- **Problem:** Uses `ch.service_num - 1` (1-indexed → 0-indexed array access) to find services. If parish_data.json services are reordered between parse and apply, the index points to the wrong service.
- **Fix:** Match by composite key: `type + day + time + location_id` instead of array index.

### ~~ARC-11: ccc-mini.json Pre-cached Unnecessarily~~ ✓ DONE
- **Priority:** P3
- **Effort:** 2 minutes
- **Size impact:** -15KB initial payload
- **File:** `sw.js` line 8
- **Problem:** `ccc-mini.json` is in `SHELL_ASSETS` but `ccc.js` already lazy-loads it on first tap. Pre-caching forces every user to download it even if they never tap a CCC reference.
- **Fix:** Remove `/ccc-mini.json` from `SHELL_ASSETS`. The SWR strategy caches it on first access.

---

# CATEGORY 2: CATHOLIC CONTENT DATA REPOS

Repos providing structured Catholic data that ships as static JSON in the repo. No runtime dependency — build scripts fetch and transform once, output is committed.

### ~~DAT-01: Full Catechism of the Catholic Church~~ ✓ DONE
- **Priority:** P0 — Phase 1 (foundation for all cross-referencing)
- **Effort:** 2 hours (build script + verification)
- **Size impact:** +427KB gzipped (lazy-loaded, not in SHELL_ASSETS)
- **Repo:** `aseemsavio/catholicism-in-json`
- **License:** Public domain text (Vatican publication)
- **What:** 2,865 CCC paragraphs + 1,941 xref entries (3,157 forward refs). Replaces `ccc-mini.json` (23 paragraphs).
- **Output file:** `data/catechism.json`
- **Build script:** `scripts/build-catechism.js` — fetches JSON from GitHub release, builds paragraph lookup + bidirectional xref graph (fwd+rev), writes output.
- **Module change:** `src/ccc.js` fetch path changed from `/ccc-mini.json` to `/data/catechism.json`. Added 150ms crossfade navigation.
- **Unlocks:** All CCC refs throughout app are now tappable at full depth. Devotional guides get unlimited CCC exploration.

### ~~DAT-02: openPrayers — Rosary, Stations, Saints JSON~~ ✓ DONE
- **Priority:** P0 — Phase 2 (rosary) and Phase 5 (stations)
- **Effort:** 2 hours (normalize + add CCC/Scripture refs)
- **Size impact:** ~12KB gzipped combined
- **Repo:** `erickouassi/openPrayers`
- **License:** Freely distributable (no explicit license)
- **What:** Pre-built JSON for rosary mysteries (7-day structure), all 14 Stations of the Cross, Saints of the Roman Calendar.
- **Output file:** `data/prayers.json` (merged with manually authored core prayers)
- **Build script:** `scripts/build-prayers.js` — fetches openPrayers JSONs, normalizes structure, adds `ccc` and `ref` fields for cross-referencing, merges with handwritten core prayers (Our Father, Hail Mary, etc.), writes output.
- **Saves:** Days of manual prayer text authoring.

### ~~DAT-03: Examination of Conscience (ConfessIt)~~ ✓ DONE
- **Priority:** P1 — Phase 3
- **Effort:** 2 hours (transform + add CCC mappings)
- **Size impact:** ~10KB gzipped
- **Repo:** `kas-catholic/confessit-web`
- **License:** MIT
- **What:** Ten Commandments + Precepts of the Church, ~150 reflection questions, CCC citations, Bible references. i18n-ready (English, Spanish, Portuguese).
- **Output file:** `data/examination.json`
- **Build script:** `scripts/build-examination.js` — transforms ConfessIt's i18next JSON into MassFinder format, maps CCC numbers to tappable refs, adds Scripture refs.
- **Same maintainer** as LitCal and BibleGet (Fr. D'Orazio) — good community alignment.

### DAT-04: Douay-Rheims Bible (73 Books)
- **Priority:** P1 — Phase 4
- **Effort:** 3 hours (fetch + split by book + lectionary subset)
- **Size impact:** ~200KB gzipped (lectionary passages only, lazy-loaded per book)
- **Repo:** `isaacronan/douay-rheims-json`
- **License:** Public domain (pre-1923 text)
- **What:** Complete Catholic Bible including deuterocanonicals. 73 books, ~31,000 verses.
- **Output files:** `data/bible-drb/genesis.json`, `data/bible-drb/matthew.json`, etc. (one per book)
- **Structure per book:** `{ "1:1": "In the beginning...", "1:2": "And the earth...", ... }`
- **Build script:** `scripts/build-bible-drb.js` — processes verses into per-book JSON keyed by `chapter:verse`.
- **Loading:** Lazy-load on demand via `refs.js`. When a reading reference is needed (e.g., "Matthew 24:37-44"), fetch `data/bible-drb/matthew.json`. Service worker caches each book after first fetch.

### DAT-05: Catholic Public Domain Version (CPDV) Bible
- **Priority:** P2 — Phase 4+
- **Effort:** 2 hours
- **Size impact:** ~200KB gzipped (same split strategy as DRB)
- **Source:** sacredbible.org (offers CPDV in JSON format)
- **License:** Public domain (explicitly stated by translator)
- **What:** Modern English translation from Latin Vulgate. More readable than DRB ("thou"/"hast" vs. modern syntax). Catholic canon-complete (73 books).
- **Output files:** `data/bible-cpdv/` (same structure as DRB)
- **Feature:** Translation toggle: DRB (traditional) ↔ CPDV (modern). Both offline, both free.

### DAT-06: Lectionary Reference Index
- **Priority:** P1 — Phase 4
- **Effort:** 4 hours (compile from public tables)
- **Size impact:** ~25KB gzipped
- **Source:** catholic-resources.org/Lectionary (Fr. Felix Just, S.J. — comprehensive HTML tables)
- **What:** Mapping of liturgical day keys to Scripture references. Sunday Cycle A/B/C, Weekday Cycle I/II, seasonal readings, sanctoral feasts. No copyrighted text — just references.
- **Output file:** `data/lectionary-index.json`
- **Structure:** `{ "sundays": { "A": { "advent_1": { "first_reading": "Isaiah 2:1-5", ... } } } }`
- **Build script:** `scripts/build-lectionary.js` — parses reference tables into structured JSON.
- **Fallback chain:** LitCal API → lectionary index → BibleGet for NABRE text → local DRB if BibleGet fails.

### DAT-07: Bible Cross-Reference Database
- **Priority:** P3 — Phase 4+
- **Effort:** 2 hours
- **Size impact:** ~100KB gzipped (selective)
- **Repo:** `scrollmapper/bible_databases`
- **License:** Varies; DRC cross-refs are public domain
- **What:** 340,000+ verse-to-verse cross-references. Maps related passages across the entire Bible.
- **Use case:** When showing a reading, offer "Related passages" — tap to navigate. Deep exploration for power users.

### DAT-08: Summa Theologica (Curated Subset)
- **Priority:** P3 — Phase 6
- **Effort:** 3 hours (curate ~365 articles)
- **Size impact:** ~50KB gzipped
- **Repo:** `Jacob-Gray/summa.json`
- **License:** Public domain (Benziger Bros. 1947 edition)
- **What:** Complete Summa in JSON (20MB total). For MassFinder, curate a daily subset of ~365 articles matched to liturgical themes.
- **Output file:** `data/summa-daily.json`
- **Feature:** "Daily Wisdom" card in More tab — one Summa article per day.

### DAT-09: Baltimore Catechism Q&A
- **Priority:** P3 — Phase 6
- **Effort:** 1 hour
- **Size impact:** ~30KB gzipped
- **Source:** awesome-catholic list reference
- **What:** 421 Q&A pairs in accessible format. More digestible than CCC for everyday questions.
- **Feature:** "Catholic Q&A" daily card — one question per day with linked CCC paragraph.

---

# CATEGORY 3: LITURGICAL COMPUTATION

### LIT-01: romcal — Offline Liturgical Calendar Engine
- **Priority:** P1 — Phase 4
- **Effort:** 3 hours (build-time integration + output JSON)
- **Size impact:** 0 runtime (build-time only)
- **Repo:** `romcal/romcal`
- **License:** MIT
- **What:** Computes complete Roman Catholic liturgical calendar for any year. Movable feasts, seasonal boundaries, saint days, precedence rules, liturgical colors, psalter week. US national calendar plugin available.
- **Use:** Build-time script generates `data/litcal-{year}.json`. Removes LitCal API as a hard dependency. LitCal API becomes Layer 3 enhancement for rich saint metadata.
- **Build script:** `scripts/build-litcal.js` — uses romcal to generate current + next year's calendar.

### LIT-02: LitCal API — Keep as Enhancement Layer
- **Priority:** Already integrated
- **Effort:** 0 (keep current integration)
- **API:** `litcal.johnromanodorazio.com/api/v5/calendar/nation/US/{YEAR}`
- **Status:** Working. Used for saint card and liturgical events.
- **Change:** Add romcal (LIT-01) as offline fallback. If API fails, compute locally.

---

# CATEGORY 4: NEW APP MODULES (features to build)

### ~~MOD-01: `src/refs.js` — Universal Reference Resolver~~ ✓ DONE
- **Priority:** P0 — Phase 1 (foundation for everything)
- **Effort:** 4 hours
- **Size impact:** ~3KB in bundle
- **What:** Single module that resolves Bible references, CCC paragraph numbers, and prayer text lookups. Lazy-loads data files on demand. Provides `resolveBible(ref)`, `resolveCCC(num)`, `resolveReadings(litcalEvent)`, `renderRef(type, ref)` (returns tappable HTML span), `handleRefTap(type, ref)` (opens appropriate sheet).
- **Depends on:** `config.js`, `utils.js`
- **Depended on by:** Every new devotional module, refactored `ccc.js`, refactored `readings.js`
- **Pattern:** `refs.renderRef('ccc', '2180')` → `<span class="ref-tap" data-type="ccc" data-ref="2180">CCC 2180</span>`

### ~~MOD-02: `src/rosary.js` — Guided Rosary~~ ✓ DONE
- **Priority:** P1 — Phase 2
- **Effort:** 6 hours
- **Size impact:** ~4KB in bundle (data in `data/prayers.json`)
- **What:** Full-screen swipeable rosary experience. Auto-selects mysteries by day (or liturgical season via LitCal). Each decade: mystery title, Scripture reference (tappable → Bible sheet via refs.js), meditation text, fruit of the mystery. 5 decades per set, 4 sets (Joyful, Sorrowful, Glorious, Luminous). Progress indicator (5 dots). Prayer texts inline.
- **Data source:** `data/prayers.json` (from DAT-02)
- **UX pattern:** Full-screen overlay (same as detail panel), CSS scroll-snap for decade navigation.
- **Enhancement:** Haptic feedback per bead tap (ios-haptics, UX-06). Wake lock during prayer (UX-05).

### ~~MOD-03: `src/examination.js` — Confession Preparation~~ ✓ DONE
- **Priority:** P1 — Phase 3
- **Effort:** 6 hours
- **Size impact:** ~4KB in bundle (data in `data/examination.json`)
- **What:** Interactive examination of conscience. Ten Commandments + Precepts, each expandable. Reflection questions with CCC references (tappable via refs.js). Checklist-style (user can mentally note items without any data being stored). Summary view. Act of Contrition at the end. "Find Confession Near Me" button that filters Find tab to `confession`.
- **Data source:** `data/examination.json` (from DAT-03)
- **Cross-references:** Every question links to CCC paragraph. Tapping opens CCC bottom sheet → related teachings → deeper exploration.

### MOD-04: `src/stations.js` — Stations of the Cross
- **Priority:** P2 — Phase 5
- **Effort:** 4 hours
- **Size impact:** ~2KB in bundle (data in `data/prayers.json`)
- **What:** 14-station guided experience. Each station: title, Scripture reference (tappable), meditation, prayer. Swipeable cards or vertical scroll. Station counter (1/14). Prominently surfaced during Lent.
- **Data source:** `data/prayers.json` (from DAT-02)
- **Seasonal trigger:** LitCal/romcal detects Lent → card appears in More tab.

### MOD-05: `src/novena.js` — Novena Tracker
- **Priority:** P2 — Phase 5
- **Effort:** 4 hours
- **Size impact:** ~3KB in bundle (data in `data/prayers.json`)
- **What:** Multi-novena support (Holy Spirit, Divine Mercy, St. Joseph, Miraculous Medal, St. Andrew). Tracks current day (localStorage). Shows daily prayer text. LitCal integration: auto-suggests relevant novena when liturgical calendar indicates it (e.g., Holy Spirit Novena between Ascension and Pentecost).
- **Data source:** `data/prayers.json` under `novenas` key
- **Liturgical triggers:** `litcal_trigger: { after: "Ascension", days: 9 }` in novena data.

### MOD-06: Refactored `src/readings.js` — Offline Readings
- **Priority:** P1 — Phase 4
- **Effort:** 4 hours (refactor existing ~650 lines)
- **Size impact:** 0 (refactoring, not adding)
- **What:** Current flow: readings API → render. New flow: readings API → enhance with BibleGet NABRE text → fall back to lectionary index + local DRB. Uses `refs.js` for Bible text resolution.
- **Fallback chain:** (1) Readings API → NABRE. (2) If API fails → LitCal + BibleGet. (3) If BibleGet fails → lectionary index + local DRB. (4) If everything fails → USCCB link.

---

# CATEGORY 5: UX ENHANCEMENTS — BROWSER APIs (zero dependency)

### ~~UX-01: Web Share API — Native Share Sheet~~ ✓ DONE
- **Priority:** P0 — immediate
- **Effort:** 15 minutes
- **Size impact:** 0
- **File:** `src/render.js` → `shareParish()`
- **What:** Replace clipboard-copy-with-toast pattern with `navigator.share()`. Opens native share sheet (iMessage, WhatsApp, email, AirDrop).
- **Fallback:** Keep current clipboard copy for unsupported browsers.
- **Code:** `if (navigator.share) navigator.share({ title, text, url }); else /* current clipboard logic */`

### ~~UX-02: Badging API — Holy Day Reminder~~ ✓ DONE
- **Priority:** P2 — Phase 5
- **Effort:** 15 minutes
- **Size impact:** 0
- **File:** `src/app.js` → `init()`
- **What:** When HDO is within 2 days, `navigator.setAppBadge(1)`. Clear after HDO passes. No push server needed.
- **Support:** Chrome 81+ (installed PWAs), Safari 17+.

### ~~UX-03: View Transitions API — Smooth Tab Switching~~ ✓ DONE
- **Priority:** P3 — Phase 6
- **Effort:** 1 hour
- **Size impact:** 0
- **File:** `src/ui.js` → `switchTab()`, `src/render.js` → `openDetail()`
- **What:** Wrap panel transitions in `document.startViewTransition()`. Cross-fade between tabs, slide-up for detail panels. Falls back to instant switch.
- **Support:** Chrome 111+, Safari 18+.

### UX-04: Web Speech API — Read Aloud for Readings
- **Priority:** P2 — Phase 4
- **Effort:** 30 minutes
- **Size impact:** 0
- **File:** `src/readings.js`
- **What:** "Listen" button on reading cards. `var utt = new SpeechSynthesisUtterance(text); utt.rate = 0.9; speechSynthesis.speak(utt);`. Toggle play/pause. Accessibility win for low-vision users and drivers.
- **Support:** All modern browsers.

### ~~UX-05: Screen Wake Lock — Keep Screen On During Prayer~~ ✓ DONE
- **Priority:** P1 — Phase 2 (ship with rosary)
- **Effort:** 10 minutes
- **Size impact:** 0
- **Files:** `src/rosary.js`, `src/stations.js`, `src/examination.js`
- **What:** `navigator.wakeLock.request('screen')` on prayer module open. Release on close.
- **Why:** Without it, screen dims/locks while user is praying — they lose their place.
- **Support:** Chrome 84+, Safari 16.4+.

### UX-06: CSS scroll-timeline — Liturgical Color Bar
- **Priority:** P3 — Phase 6
- **Effort:** 20 minutes
- **Size impact:** 0
- **File:** `css/app.css`
- **What:** Thin 3px bar at top of app showing liturgical color (purple Lent, white Easter, green Ordinary Time). Animates with scroll. Pure CSS — zero JavaScript.
- **Support:** Chrome 115+, Safari 18.4+. Falls back to static bar.

### UX-07: Popover API — Inline Term Definitions
- **Priority:** P3
- **Effort:** 1 hour
- **Size impact:** 0
- **Files:** Devotional guide content in `src/devotions.js`
- **What:** Theological terms (transubstantiation, absolution, contrition) get lightweight popovers with definitions. Native accessibility, native dismiss behavior.
- **Support:** Chrome 114+, Safari 17+, Firefox 125+.

### UX-08: Notification API — Daily Reading Reminder
- **Priority:** P3
- **Effort:** 2 hours
- **Size impact:** 0
- **Files:** `sw.js`, `src/app.js`
- **What:** Client-side daily reminder (no server). Check time since last app open. If >24 hours and notifications permitted, show one. Notification body includes today's liturgical day.
- **Scope:** Permission-gated. Never auto-prompt — only show after user opts in from settings.

---

# CATEGORY 6: UX ENHANCEMENTS — MICRO-LIBRARIES (<5KB each)

### ~~LIB-01: ios-haptics — Haptic Feedback~~ ✓ DONE
- **Priority:** P1 — Phase 2 (ship with rosary)
- **Effort:** 30 minutes
- **Size impact:** <1KB (implemented inline, no CDN dependency)
- **Repo:** `tijnjh/ios-haptics`
- **License:** MIT
- **What:** Triggers iOS haptic engine via Safari 18's `<input switch>` trick. Falls back to `navigator.vibrate()` on Android.
- **Use cases:** Rosary bead taps (light pulse), decade completion (medium pulse), mystery transition (distinct pattern), station advance, examination commandment transition.

### LIB-02: microfuzz — Fuzzy Search for Content
- **Priority:** P2 — Phase 3+
- **Effort:** 1 hour
- **Size impact:** 2KB
- **Repo:** `Nozbe/microfuzz`
- **License:** MIT
- **What:** Once full CCC and Bible data are local, users need a way to search them. Fuzzy matching with highlight ranges for the results UI.
- **Integration:** `createFuzzySearch(paragraphs, { getText: function(p) { return [p.text]; } })`

### LIB-03: QR Creator — Shareable Parish QR Codes
- **Priority:** P2
- **Effort:** 1 hour
- **Size impact:** 4KB (CDN-loaded)
- **Repo:** `nimiq/qr-creator`
- **License:** MIT
- **What:** Generate QR code in parish detail panel. Scan → opens MassFinder at that parish (`massfinder.app/#parish-id`). For bulletin boards, vestibule flyers, parish office.
- **Integration:** CDN script tag. Generate on demand when user taps "QR Code" in share options.

### ~~LIB-04: scroll-snap-carousel — Progress Dots~~ ✓ DONE
- **Priority:** P2 — Phase 2+
- **Effort:** 30 minutes
- **Size impact:** 0 (built with custom dots, no library needed)
- **Repo:** `Grsmto/scroll-snap-carousel`
- **License:** MIT
- **What:** Active dot indicator for CSS scroll-snap containers. Shows progress through rosary decades (5 dots), stations (14 dots), commandments (10 dots).
- **Alternative:** Pure CSS scroll-snap handles the scrolling; this library only adds the dots. Can be built manually with IntersectionObserver if preferred.

### LIB-05: pure-web-bottom-sheet — Native-Feel Sheets
- **Priority:** P2 — Phase 2+
- **Effort:** 1 hour
- **Size impact:** 3KB
- **Repo:** `viliket/pure-web-bottom-sheet`
- **License:** MIT
- **What:** CSS scroll-snap-driven bottom sheet with multiple snap points (25%, 50%, 75%), swipe-to-dismiss, nested scrolling, `<dialog>` for accessibility. Could replace custom CCC sheet and serve all new interactive modules.
- **Tradeoff:** Current CCC sheet works. This standardizes the pattern for all new modules.

---

# CATEGORY 7: UX PATTERNS (zero-dependency, just code)

### ~~PAT-01: Dark Mode~~ ✓ DONE
- **Priority:** P2
- **Effort:** 2 hours
- **Size impact:** +~200 lines CSS
- **Files:** `css/app.css`, `src/ui.js` (or `src/app.js`)
- **What:** MassFinder already uses 58 CSS custom properties. Dark mode is a second set of values under `[data-theme="dark"]`. Toggle in More tab or settings. Respect `prefers-color-scheme`. Persist in localStorage.
- **Pattern:** `html[data-theme="dark"] { --color-bg: #1a1e26; --color-surface: #242830; ... }`
- **Note:** Light mode is default regardless of system preference; dark mode is a manual user preference via More tab toggle.

### ~~PAT-02: Confession Tracker (Time Since Last Confession)~~ ✓ DONE
- **Priority:** P2 — Phase 3 (ship with examination module)
- **Effort:** 30 minutes
- **Size impact:** 0
- **Storage:** localStorage only. Nothing leaves the device.
- **What:** After examination module, user can tap "I went to Confession today." More tab shows "Last Confession: 12 days ago." Gentle nudge near confession filter chip after 30+ days.

### PAT-03: Fasting & Abstinence Calculator
- **Priority:** P2 — Phase 5
- **Effort:** 20 minutes
- **Size impact:** 0
- **File:** `src/readings.js` or `src/app.js`
- **What:** On Ash Wednesday and all Fridays of Lent, show banner: "Today is a day of abstinence from meat." On Ash Wednesday and Good Friday: "Today is a day of fasting and abstinence." Three lines of logic using LitCal/romcal data.

### PAT-04: Streak Tracking
- **Priority:** P3
- **Effort:** 30 minutes
- **Size impact:** 0
- **Storage:** localStorage
- **What:** "Day 3 of daily prayer" in More tab header. Track rosary streaks, daily reading engagement. Simple `{ count, lastDate }` object. Subtle — no gamification pressure.

### ~~PAT-05: Offline Fallback Page~~ ✓ DONE
- **Priority:** P2
- **Effort:** 30 minutes
- **Size impact:** +1KB
- **Files:** `offline.html` (new), `sw.js`
- **What:** Branded offline page instead of browser error when navigating to uncached content. Shows MassFinder logo, "You're offline," and list of what's available from cache.

### ~~PAT-06: Font Self-Hosting / Subsetting~~ ✓ DONE
- **Priority:** P3
- **Effort:** 1 hour
- **Size impact:** -40KB (eliminates Google Fonts DNS lookup)
- **Files:** `css/app.css`, `assets/fonts/` (new)
- **What:** Download Playfair Display and Source Sans 3 .woff2 files. Serve from repo. Eliminates external DNS dependency, makes fonts available offline from first load (currently waits for SW cache).
- **Subset:** Use `&subset=latin` or download only used weights (600, 700 for Playfair; 400, 500, 600 for Source Sans 3).

### PAT-07: "Pray for Me" / Intentions Counter
- **Priority:** P3
- **Effort:** 2 hours
- **Size impact:** 0 (uses existing Supabase or GA event)
- **What:** Anonymous "Pray for me" button on saint card or daily reading. Tap → counter increments. Show "142 people praying today." No user accounts, no free text, no moderation. Structured community signal.

---

# CATEGORY 8: CONTENT CROSS-REFERENCING (the glue)

### ~~XREF-01: Tappable CCC References in Devotional Guides~~ ✓ DONE
- **Priority:** P0 — Phase 1 (after refs.js + full CCC)
- **Effort:** 1 hour (mechanical transformation)
- **Size impact:** 0
- **File:** `src/more.js` (or `src/devotions.js` after ARC-06 split)
- **What:** CCC references in guide content wrapped as `<span class="ccc-ref" onclick="window.openCCC(N)">CCC N</span>`. Tapping opens CCC bottom sheet.
- **Current state:** Implemented inline (no refs.js dependency). ccc.js still reads from ccc-mini.json (23 paragraphs). Full upgrade to 2,865 paragraphs pending DAT-01.

### XREF-02: Tappable Scripture References in Devotional Guides
- **Priority:** P1 — Phase 4 (after Bible data is local)
- **Effort:** 1 hour
- **What:** Same pattern as XREF-01 but for Bible references. "Matthew 4:1-11" becomes a tappable span that opens a reading sheet with DRB text (or NABRE if online).

### ~~XREF-03: More Tab Redesign — Card Grid~~ ✓ DONE
- **Priority:** P2 — Phase 2+
- **Effort:** 2 hours
- **Size impact:** ~50 lines CSS
- **What:** Reorganize More tab from vertical scroll of sections into card grid with progressive reveal. "Prayer & Devotion" and "Guided Devotions" sections as entry points to interactive features. Keeps surface clean while enabling depth.

---

# CATEGORY 9: BUILD SCRIPTS & DATA PIPELINE

### ~~BLD-01: `scripts/build-catechism.js`~~ ✓ DONE
- **Priority:** Phase 1
- **What:** Fetches full CCC from GitHub release, builds paragraph lookup + xref index, writes `data/catechism.json`.

### ~~BLD-02: `scripts/build-prayers.js`~~ ✓ DONE
- **Priority:** Phase 2
- **What:** Fetches openPrayers JSON files, normalizes structure, merges with handwritten core prayers, adds CCC/Scripture refs, writes `data/prayers.json`.

### BLD-03: `scripts/build-examination.js`
- **Priority:** Phase 3
- **What:** Transforms ConfessIt translation JSON into MassFinder format, writes `data/examination.json`.

### BLD-04: `scripts/build-bible-drb.js`
- **Priority:** Phase 4
- **What:** Processes DRB verses into per-book JSON files in `data/bible-drb/`.

### BLD-05: `scripts/build-lectionary.js`
- **Priority:** Phase 4
- **What:** Compiles lectionary reference index from public tables, writes `data/lectionary-index.json`.

### BLD-06: `scripts/build-litcal.js`
- **Priority:** Phase 4
- **What:** Uses romcal to generate current + next year liturgical calendar, writes `data/litcal-{year}.json`.

---

# CATEGORY 10: DOCUMENTATION & CONTRIBUTOR EXPERIENCE

### DOC-01: Add `.editorconfig`
- **Priority:** P3
- **Effort:** 5 minutes
- **What:** Enforce consistent indentation (2 spaces), EOL (LF), charset (utf-8) across contributors.

### DOC-02: Add Husky Pre-commit Hook
- **Priority:** P3 — when contributors arrive
- **Effort:** 15 minutes
- **Repo:** `typicode/husky`
- **What:** Auto-runs `npm run precommit` on git commit. Prevents broken builds from reaching repo.

### DOC-03: Update CLAUDE.md After Each Phase
- **Priority:** Ongoing
- **What:** After each phase of feature work, update CLAUDE.md with new modules, new data files, new build scripts, and any changed conventions.

---

# CATEGORY 11: STRETCH / LONG-HORIZON

### STR-01: Latin/English Translation Toggle (Vulgata)
- **Repo:** `mborders/vulgata`
- **What:** Parallel DRB English + Clementina Vulgata Latin. For TLM attendees.

### STR-02: Gregorian Chant Database (GregoSearch)
- **What:** Link from liturgical day to proper chants. Very niche.

### STR-03: Catholic Hierarchy Data
- **What:** Auto-populate diocese info for forkers from catholic-hierarchy.org.

### STR-04: Web Audio API — Ambient Prayer Tones
- **What:** Programmatic sine wave (174 Hz, very quiet) during guided prayer. No audio files.

### STR-05: Web Bluetooth — Physical Rosary Counter
- **What:** Bluetooth-connected physical rosary advances app's rosary module. Extremely niche.

### STR-06: Doctors of the Church Gallery Data
- **What:** 37 entries with names, dates, notable works. Badge on saint card when relevant.

---

# IMPLEMENTATION PHASES (recommended order)

## Phase 1 — Foundation
| ID | Item | Effort | Status |
|----|------|--------|--------|
| ~~ARC-01~~ | ~~Fix schema generator for forks~~ | 20 min | ✓ Done |
| ~~ARC-02~~ | ~~Fix FORK_GUIDE field names~~ | 10 min | ✓ Done |
| ~~ARC-03~~ | ~~Delete dead code in map.js~~ | 2 min | ✓ Done |
| ~~ARC-04~~ | ~~Fix openCCC double-export~~ | 10 min | ✓ Done |
| ~~ARC-07~~ | ~~Automated SW cache busting~~ | 30 min | ✓ Done |
| ~~DAT-01~~ | ~~Full CCC JSON + build script~~ | 2 hours | ✓ Done |
| ~~MOD-01~~ | ~~`src/refs.js` reference resolver~~ | 4 hours | ✓ Done |
| ~~XREF-01~~ | ~~Tappable CCC refs in guides~~ | 1 hour | ✓ Done (inline, pending DAT-01 for full 2865 paragraphs) |
| ~~UX-01~~ | ~~Web Share API (replace clipboard)~~ | 15 min | ✓ Done |

## Phase 2 — First Interactive Feature
| ID | Item | Effort | Status |
|----|------|--------|--------|
| ~~DAT-02~~ | ~~openPrayers data (rosary + stations)~~ | 2 hours | ✓ Done |
| ~~MOD-02~~ | ~~`src/rosary.js` guided rosary~~ | 6 hours | ✓ Done |
| ~~LIB-01~~ | ~~ios-haptics for rosary~~ | 30 min | ✓ Done (inline) |
| ~~UX-05~~ | ~~Screen Wake Lock~~ | 10 min | ✓ Done |
| ~~LIB-04~~ | ~~scroll-snap-carousel dots~~ | 30 min | ✓ Done (custom) |
| ~~XREF-03~~ | ~~More tab card grid redesign~~ | 2 hours | ✓ Done |

## Phase 3 — Confession Preparation
| ID | Item | Effort | Status |
|----|------|--------|--------|
| ~~DAT-03~~ | ~~ConfessIt examination data~~ | 2 hours | ✓ Done |
| ~~MOD-03~~ | ~~`src/examination.js`~~ | 6 hours | ✓ Done |
| ~~PAT-02~~ | ~~Confession tracker~~ | 30 min | ✓ Done |
| LIB-02 | microfuzz for CCC search | 1 hour | |

## Phase 4 — Offline Readings & Bible
| ID | Item | Effort |
|----|------|--------|
| DAT-04 | DRB Bible per-book JSON | 3 hours |
| DAT-06 | Lectionary reference index | 4 hours |
| LIT-01 | romcal build-time calendar | 3 hours |
| MOD-06 | Refactored readings.js | 4 hours |
| UX-04 | Text-to-Speech for readings | 30 min |
| XREF-02 | Tappable Scripture refs in guides | 1 hour |

## Phase 5 — Seasonal Features
| ID | Item | Effort | Status |
|----|------|--------|--------|
| MOD-04 | `src/stations.js` | 4 hours | |
| MOD-05 | `src/novena.js` tracker | 4 hours | |
| PAT-03 | Fasting/abstinence calculator | 20 min | |
| ~~UX-02~~ | ~~HDO app badge~~ | 15 min | ✓ Done |
| ~~PAT-05~~ | ~~Offline fallback page~~ | 30 min | ✓ Done |

## Phase 6 — Polish & Depth
| ID | Item | Effort | Status |
|----|------|--------|--------|
| DAT-05 | CPDV Bible (translation toggle) | 2 hours | |
| DAT-08 | Summa daily subset | 3 hours | |
| DAT-09 | Baltimore Catechism Q&A | 1 hour | |
| LIB-03 | QR Creator for parish sharing | 1 hour | |
| ~~UX-03~~ | ~~View Transitions API~~ | 1 hour | ✓ Done |
| UX-06 | Liturgical color scroll bar | 20 min | |
| ~~PAT-01~~ | ~~Dark mode~~ | 2 hours | ✓ Done |
| ~~PAT-06~~ | ~~Font self-hosting~~ | 1 hour | ✓ Done |

## Ongoing / As Needed
| ID | Item | Effort | Status |
|----|------|--------|--------|
| ~~ARC-05~~ | ~~LANG_NAMES dedup~~ | 10 min | ✓ Done |
| ~~ARC-06~~ | ~~Split more.js~~ | 1 hour | ✓ Done |
| ARC-08 | CI template validation | 5 min | |
| ARC-09 | Feature flags | 20 min | |
| ARC-10 | apply-changes.js composite key | 30 min | |
| ~~ARC-11~~ | ~~Remove ccc-mini.json from SHELL_ASSETS~~ | 2 min | ✓ Done |
| DOC-01 | .editorconfig | 5 min | |
| DOC-02 | Husky pre-commit | 15 min | |
| PAT-04 | Streak tracking | 30 min | |
| PAT-07 | Pray for me counter | 2 hours | |
| UX-07 | Popover API definitions | 1 hour | |
| UX-08 | Daily reading notification | 2 hours | |
