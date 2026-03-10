# MassFinderApp — GitHub Repos & Open Source Resources

**Purpose:** A catalog of open-source repos, data files, and lightweight libraries that MassFinder can leverage to build the content layer and UX features outlined in the Content Extensibility Report. Each entry is evaluated for license compatibility, data format, size impact, and integration complexity.

Organized by function: Catholic content data, liturgical computation, UX components, and developer tooling.

---

## SECTION 1: CATHOLIC CONTENT DATA

### 1.1 Full Catechism of the Catholic Church

**Repo:** `aseemsavio/catholicism-in-json`
**URL:** github.com/aseemsavio/catholicism-in-json
**License:** Public domain text (Vatican publication); repo has no explicit license file but data is freely distributable
**What it has:** CCC (2,865 paragraphs), Code of Canon Law, General Instruction of the Roman Missal — all in JSON
**Size:** 1.35MB raw, 427KB gzipped for the CCC alone
**Format:** JSON array of `{ id, text }` objects; text uses markdown-style formatting (bold, italics, quotes)
**Integration:** Replaces the current `ccc-mini.json` (23 paragraphs). The existing `ccc.js` module already handles arbitrary paragraph lookups — it just needs the larger dataset. Build script extracts CCC from the release, adds cross-reference index (by parsing embedded `(1234, 5678)` patterns in text), writes `data/catechism.json`.
**Also includes:** Canon Law and GIRM — potential future features for sacrament preparation guides or liturgical rubrics reference.

**Priority: Phase 1 — this unlocks all CCC cross-referencing throughout the app.**

---

### 1.2 Douay-Rheims Bible (73 Books, Public Domain)

**Repo:** `isaacronan/douay-rheims-json`
**URL:** github.com/isaacronan/douay-rheims-json
**License:** Public domain (pre-1923 text from Project Gutenberg)
**What it has:** Complete DRB — all 73 Catholic canon books including deuterocanonicals (Tobit, Judith, Wisdom, Sirach, Baruch, 1-2 Maccabees), which Protestant Bibles omit. Two JSON files: `books.json` (metadata) and `verses.json` (all verses).
**Format:** Verses: `{ booknumber, bookname, chapter, verse, text }`. Books: `{ booknumber, bookname, shortname, contentsname }`.
**Size:** ~4.5MB raw for the full Bible. Split by book for lazy loading, lectionary-only passages would be ~600KB raw, ~200KB gzipped.
**Integration:** Build script processes verses into per-book JSON files (`data/bible-drb/matthew.json`), each structured as `{ "1:1": "text", "1:2": "text" }`. The `refs.js` resolver lazy-loads books on demand. Service worker caches each book after first access.

**Also consider:** BibleGet API (query.bibleget.io) already works with DRB version — could be used as the build-time source instead, with the advantage of getting cleaned-up text formatting. Both paths produce the same result.

**Priority: Phase 4 — provides offline Bible text for readings and cross-references.**

---

### 1.3 Alternative Bible Source: scrollmapper/bible_databases

**Repo:** `scrollmapper/bible_databases`
**URL:** github.com/scrollmapper/bible_databases
**License:** Varies by translation; DRC (Douay-Rheims Challoner) is public domain
**What it has:** 100+ Bible translations in SQL, JSON, and XML. Includes DRC, KJV, Vulgate (Latin), and cross-reference tables between verses.
**Notable feature:** The `cross_reference` table maps related verses across the entire Bible — 340,000+ cross-reference pairs. This is the Bible equivalent of the CCC cross-reference index. A devotional guide could link from a reading to all related passages.
**Format:** SQL tables with JSON exports. Verse cross-references: `{ from_book, from_chapter, from_verse, to_book, to_chapter, to_verse }`.
**Tradeoff:** The JSON export format requires parsing (not as clean as the isaacronan repo). But the cross-reference table is unique and extremely valuable.
**Integration:** Use isaacronan's DRB for the text. Use scrollmapper's cross-reference table for the verse-to-verse links. Build script merges both.

**Priority: Phase 4+ — cross-references are a "Layer 3" feature for deep explorers.**

---

### 1.4 Vulgata (Latin-English Parallel Bible)

**Repo:** `mborders/vulgata`
**URL:** github.com/mborders/vulgata
**License:** Public domain text; Go library MIT-licensed
**What it has:** Complete DRB English text alongside the Clementina Vulgata Latin, structured as a Go library with embedded data. Each verse has `.Text` (English) and `.TextLatin` (Latin).
**Relevance:** If you ever add a Latin/English toggle for TLM attendees, this provides the parallel text. Low priority now but perfectly aligned with the existing "Latin" filter chip.
**Format:** Go source files with embedded data — would need extraction to JSON.

**Priority: Future — only relevant if Latin toggle feature is built.**

---

### 1.5 Examination of Conscience (ConfessIt)

**Repo:** `kas-catholic/confessit-web`
**URL:** github.com/kas-catholic/confessit-web
**License:** MIT
**What it has:** Complete examination of conscience organized by the Ten Commandments + Precepts of the Church. ~150 reflection questions, each with Scripture citations and CCC references. Prayer texts (Act of Contrition, multiple versions). i18n support (English, Spanish, Portuguese, more).
**Size:** 32KB raw translation file, ~10KB gzipped
**Format:** i18next JSON with nested `commandments.{1-10}.{title, text, description}` structure and `prayers.{name}_text` for prayer content.
**Integration:** Build script transforms the ConfessIt translation JSON into MassFinder's format (`data/examination.json`), mapping their CCC numbers to our `refs.js` tappable references. The examination module reads this file and renders the interactive flow.
**Notable:** ConfessIt is maintained by the same Fr. D'Orazio who maintains LitCal and BibleGet — he's a known collaborator in the Catholic open source space. The `confessit.app` is a working PWA you can reference for UX patterns.

**Priority: Phase 3 — the feature with the strongest word-of-mouth potential.**

---

### 1.6 Summa Theologica (St. Thomas Aquinas)

**Repo:** `Jacob-Gray/summa.json`
**URL:** github.com/Jacob-Gray/summa.json
**License:** Public domain (Benziger Bros. edition, 1947)
**What it has:** Complete Summa Theologica parsed to JSON — 7 parts, ~3,000 articles organized into questions. Each article has: the question, objections, "on the contrary" (sed contra), the response (corpus), and replies to objections.
**Size:** 20MB for the complete work (ALL.json). Individual parts are 1-4MB each.
**Relevance:** The Summa is the masterwork of Catholic philosophical theology. A "Daily Wisdom" feature could surface one article per day matched to the liturgical season. The ROADMAP.md already mentions this as a Phase 4 feature. However, at 20MB, it cannot ship in-repo. It would need to be a separate lazy-loaded data source or a curated subset.
**Format:** Nested JSON: `{ part → question → article → { outer, body, objections[], replies[] } }`.
**Integration:** Build a curated subset (`data/summa-daily.json`, ~50KB) of ~365 articles matched to liturgical themes. The full work stays external (CDN or separate fetch).

**Priority: Phase 6 — "Daily Wisdom" feature, lower urgency.**

---

### 1.7 Awesome Catholic (Meta-Index)

**Repo:** `servusdei2018/awesome-catholic`
**URL:** github.com/servusdei2018/awesome-catholic
**License:** Various (it's a curated link list)
**What it is:** The definitive index of Catholic open-source projects. Categories include: data/API, applications, libraries, and resources. Every repo mentioned in this report was either found through or cross-referenced against this list.
**Notable entries not covered elsewhere:**
- `romanus` — Roman Catechism of the Council of Trent (historical, not for app features, but interesting)
- `Mariam` — meditative rosary app (Flutter, can reference for UX patterns)
- `auxilium-christianorum` — daily protection prayers
- `catholic-bible-cheatsheet` — quick reference card format (could inspire a "Cheat Sheet" feature)
**Integration:** Bookmark this repo. Check it quarterly for new Catholic data projects.

**Priority: Ongoing reference — not a direct integration.**

---

## SECTION 2: LITURGICAL COMPUTATION

### 2.1 romcal (Liturgical Calendar Engine)

**Repo:** `romcal/romcal`
**URL:** github.com/romcal/romcal
**License:** MIT
**What it does:** Computes the complete Roman Catholic liturgical calendar for any year. Calculates movable feasts (Easter, Ascension, Pentecost), seasonal boundaries (Advent, Lent, Ordinary Time), saint days, precedence rules when celebrations overlap, liturgical colors, and psalter week. Supports national calendars (US, France, etc.) as plugins.
**Size:** ~60KB minified for the core + US calendar plugin
**Format:** npm package. CommonJS and ESM builds. IIFE browser build available.
**Why it matters:** Right now MassFinder computes liturgical dates with hand-written functions (`getEaster`, `isLentSeason`, `getNext`). These cover basic cases but miss edge cases like transferred solemnities, suppressed memorials, and octave day calculations. romcal handles all of this correctly per GIRM rules. It also provides the liturgical day key needed to look up lectionary readings.
**Integration:** Import romcal as an npm dependency. Use it in a build script to pre-compute the liturgical calendar for the current year and write it as `data/litcal-{year}.json`. Or use it at runtime (60KB is acceptable for the bundle). It replaces the LitCal API dependency for basic calendar computation — LitCal API becomes an optional enhancement for saint metadata.

**Tradeoff:** Adding romcal to the runtime bundle costs ~60KB. Using it as a build-time-only tool costs 0KB in the bundle but requires annual regeneration. Recommendation: **build-time**, outputting a JSON file per year. This keeps the bundle lean and provides full offline capability.

**Priority: Phase 4 — enables offline lectionary resolution and removes LitCal API as a hard dependency.**

---

### 2.2 LitCal API (Already In Use)

**Repo:** `Liturgical-Calendar/LiturgicalCalendarAPI`
**URL:** github.com/Liturgical-Calendar/LiturgicalCalendarAPI
**License:** Apache 2.0
**What it does:** The API that MassFinder already uses at `litcal.johnromanodorazio.com/api/v5/calendar/nation/US/{YEAR}`. Returns saint days, liturgical grades, reading references, and liturgical colors. Maintained by Fr. John Romano D'Orazio (same person as BibleGet and ConfessIt).
**Current status in MassFinder:** Used in `readings.js` for saint card rendering and liturgical event list.
**Recommendation:** Keep as a Layer 3 enhancement (live API for rich saint data and reading references). Add romcal as the Layer 2 fallback (offline computation). If LitCal API is down, romcal provides the liturgical day key, and the lectionary index provides the reading references.
**Notable companion:** `Liturgical-Calendar/liturgy-components-js` — JavaScript web components for displaying liturgical data. Not needed (we render our own UI), but worth knowing about.

**Priority: Already integrated — no new work, just add fallback via romcal.**

---

### 2.3 Awesome Church Calendar (Meta-Index for Liturgical Computation)

**Repo:** `calendarium-romanum/awesome-church-calendar`
**URL:** github.com/calendarium-romanum/awesome-church-calendar
**License:** Reference list
**What it is:** Comprehensive catalog of every liturgical calendar implementation across all programming languages and rites (Roman OF, Roman EF, Anglican, etc.). Useful for finding alternative computation libraries if romcal doesn't meet a specific need.

---

## SECTION 3: UX COMPONENTS

### 3.1 Bottom Sheet: CSS Scroll Snap Web Component

**Repo:** `viliket/pure-web-bottom-sheet`
**URL:** github.com/viliket/pure-web-bottom-sheet
**License:** MIT
**What it does:** Native-feeling bottom sheet using CSS scroll snap instead of JavaScript animation. Multiple snap points, swipe-to-dismiss, nested scrolling, `<dialog>` element for accessibility. Zero dependencies. Framework-agnostic web component.
**Size:** ~3KB minified
**Why it matters:** MassFinder's current CCC bottom sheet and detail panel use custom CSS + JS. This component provides smoother scroll physics (compositor thread, not main thread), proper snap points (25%, 50%, 75%), and accessibility via native `<dialog>`. The rosary guide, stations, examination, and novena tracker all need bottom sheet / full-screen slide-up panels.
**Integration:** Import via CDN (`unpkg.com/pure-web-bottom-sheet`) or npm. Use as `<bottom-sheet>` web component wrapping content divs. Replace the custom `.ccc-sheet` implementation.

**Tradeoff vs. custom:** The existing CCC sheet works fine. Adding a web component introduces a new pattern. But as more features need bottom sheets (rosary, stations, examination, novena), having one consistent component is worth the 3KB cost.

**Priority: Phase 2 — implement with the first interactive devotional feature.**

---

### 3.2 Swipe Gesture Detection

**Repo:** `umanghome/swipe-listener`
**URL:** github.com/umanghome/swipe-listener
**License:** MIT
**What it does:** Zero-dependency swipe gesture detection. Fires a single `swipe` event with direction, coordinates, and velocity. Configurable thresholds. Works on touch and mouse. 2KB minified.
**Why it matters:** The rosary guide, stations, and examination modules need swipeable card navigation (swipe left/right to advance through decades, stations, or commandments). MassFinder currently has no swipe gesture handling except the native pull-to-refresh in `app.js`.
**Integration:** `SwipeListener(containerEl)` → listen for `swipe` events → advance/retreat through content.

**Alternative: CSS scroll-snap only.** For simple horizontal card navigation, pure CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: start` on child elements gives native swipe behavior without any library. The library is only needed if you want programmatic control (e.g., "Next" button that animates to the next card).

**Recommendation: Start with pure CSS scroll-snap. Add swipe-listener only if programmatic control is needed.**

**Priority: Phase 2 — evaluate when building rosary module.**

---

### 3.3 Scroll-Snap Carousel

**Repo:** `Grsmto/scroll-snap-carousel`
**URL:** github.com/Grsmto/scroll-snap-carousel
**License:** MIT
**What it does:** Enhances native CSS scroll-snap with active dot indicators and drag-scroll for desktop. Vanilla JS core (~2KB), with framework wrappers available. The dot indicator is the key feature — it shows progress through a set of cards (5 decades, 14 stations, 10 commandments).
**Why it matters:** Every guided devotion needs a progress indicator. Building one from scratch means tracking scroll position, calculating which card is visible, and updating dot state. This library does exactly that, using IntersectionObserver for efficient card visibility detection.
**Integration:** Apply to any horizontal scroll container. Provides `goTo(index)`, `next()`, `prev()` methods for programmatic navigation.

**Alternative: n-carousel** (`radogado/n-carousel`) — heavier at ~11KB but includes accessibility (ARIA, keyboard nav, focus management), RTL support, auto-height, and fullscreen mode. Better if you want a production-grade component rather than a minimal helper.

**Recommendation: scroll-snap-carousel for its minimal footprint. Add keyboard navigation manually (the chip bar already has this pattern in `app.js`).**

**Priority: Phase 2 — build with rosary module.**

---

### 3.4 No New CSS Framework Needed

MassFinder's custom CSS design system (58 custom properties, Apple HIG adherence) is mature and intentional. Adding Tailwind, Bootstrap, or any CSS framework would conflict with the design system and add unnecessary weight. The existing component patterns (cards, pills, bottom sheets, toast) are sufficient for all planned features.

**Confirmed: No CSS framework repos recommended.**

---

## SECTION 4: DEVELOPER TOOLING

### 4.1 AJV (Already In Use)

**Package:** `ajv-cli` + `ajv-formats`
**Status:** Already a devDependency in package.json
**Used for:** `npm run validate` — validates `parish_data.json` against the generated schema.
**No changes needed.**

---

### 4.2 esbuild (Already In Use)

**Package:** `esbuild`
**Status:** Already a devDependency
**Used for:** Bundling `src/*.js` → `dist/app.min.js` as IIFE (140KB, 35ms build)
**Potential enhancement:** Use esbuild's `--define` flag to inject a build hash into `sw.js` for automatic cache busting:
```javascript
// scripts/build.js
var hash = require('crypto').createHash('md5').update(Date.now().toString()).digest('hex').slice(0, 8);
esbuild.build({ ...options, define: { 'BUILD_HASH': JSON.stringify(hash) } });
```
This addresses finding #6 from the Architecture Assessment (manual SW cache name bumping).

---

### 4.3 Husky + lint-staged (Optional, for Contributors)

**Repo:** `typicode/husky`
**URL:** github.com/typicode/husky
**License:** MIT
**What it does:** Runs `npm run precommit` automatically on `git commit`. Prevents broken builds from being committed.
**Size:** ~6KB, devDependency only
**Integration:** `npx husky init` → configure `.husky/pre-commit` to run `npm run precommit` (which already does build + schema + validate).
**Relevance:** When contributors start submitting PRs, this prevents schema violations from reaching the repo. Not needed for solo development with Claude Code.

**Priority: When open-source contributors start arriving.**

---

## SECTION 5: DATA FILES THAT DON'T NEED REPOS

Some content is small enough to author directly rather than importing from a repo:

### 5.1 `data/prayers.json` — Author Manually

Core prayers (Our Father, Hail Mary, Glory Be, etc.) are short, well-known texts. Rosary mysteries are 20 entries with title, Scripture reference, fruit, and a sentence of meditation. Stations of the Cross are 14 entries. Divine Mercy Chaplet is 3 prayers. These total ~35KB and are faster to write by hand than to extract from a repo.

**Source for accuracy:** USCCB prayer texts page, or simply any Catholic prayer book. All traditional prayer texts are public domain.

### 5.2 `data/lectionary-index.json` — Build from Public Tables

The lectionary reference list (which Scripture passages on which day) is published by the USCCB and cataloged comprehensively at `catholic-resources.org/Lectionary/` by Fr. Felix Just, S.J. The data is a mapping of liturgical day keys to Scripture references — no copyrighted text, just references like "Isaiah 2:1-5". A build script can compile this from the HTML tables or from romcal's output.

### 5.3 `data/saints-mini.json` — Curate from LitCal + Wikipedia

A mini saint biography dataset (~100 entries for commonly celebrated feasts) with name, feast date, title, 1-2 sentence bio, and patronage. Authored from public sources. LitCal provides the list of which saints appear in the US calendar; bios sourced from Catholic Encyclopedia (public domain) or authored fresh.

---

## SECTION 6: INTEGRATION ROADMAP

| Phase | Repos Used | Data Files Created | Modules Built |
|-------|-----------|-------------------|---------------|
| **1** | `aseemsavio/catholicism-in-json` | `data/catechism.json` (427KB gz) | `src/refs.js`, refactored `src/ccc.js` |
| **2** | `Grsmto/scroll-snap-carousel` (optional) | `data/prayers.json` (12KB gz) | `src/rosary.js` |
| **3** | `kas-catholic/confessit-web` | `data/examination.json` (10KB gz) | `src/examination.js` |
| **4** | `isaacronan/douay-rheims-json`, `romcal/romcal` | `data/bible-drb/*.json` (200KB gz), `data/lectionary-index.json` (25KB gz) | Refactored `src/readings.js` |
| **5** | None (manual authoring) | (in `prayers.json`) | `src/stations.js`, `src/novena.js` |
| **6** | `Jacob-Gray/summa.json` | `data/summa-daily.json` (50KB gz) | Daily wisdom in `src/readings.js` |

**Total new dependencies added to package.json:** 0 (all content repos are build-time data sources, not runtime dependencies). scroll-snap-carousel loads from CDN if used; pure CSS scroll-snap may eliminate the need entirely. romcal is build-time only.

**Total gzipped data added to repo:** ~724KB across all phases. Users only download what features they access (lazy loading via service worker).

---

## SECTION 7: WHAT NOT TO USE

| Considered | Why Not |
|-----------|---------|
| NABRE Bible text in repo | Copyrighted by USCCB — requires license. Use BibleGet API for NABRE, DRB for offline. |
| React/Vue/Svelte | Adds 30-80KB runtime; conflicts with vanilla JS architecture; no team coordination benefit for solo dev. |
| Splide.js (carousel) | 29KB minified — heavier than needed. CSS scroll-snap + a 2KB helper achieves the same result. |
| Hammer.js (gestures) | 25KB — wildly oversized for simple swipe detection. CSS scroll-snap or the 2KB swipe-listener handles it. |
| getbible/v2 | Warned against by maintainers ("some of the Scripture Text has errors"). Use isaacronan's DRB instead. |
| Full Summa in-repo | 20MB — far too large. Curated daily subset only. |
| Any authentication library | The app is public, read-only for users. Review tool uses simple Supabase auth. No user accounts. |
