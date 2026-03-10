# MassFinderApp — Content Extensibility & Feature Depth Report

**Purpose:** Architecture recommendations for transforming MassFinder from a schedule-lookup tool into a rich, cross-referenced Catholic formation companion — without overwhelming users, breaking forkability, or creating API dependencies that fail on church WiFi.

---

## PART 1: THE CONTENT PROBLEM TODAY

### What Exists

| Asset | Size | Depth | Expandable? |
|-------|------|-------|-------------|
| `parish_data.json` | 929KB | Deep — 93 parishes, 1,690 services | Yes (schema-validated, config-driven) |
| `events.json` | 104KB | Moderate — 203 events | Yes |
| `ccc-mini.json` | 15KB | **Shallow — 23 of 2,865 paragraphs** | **No — hardcoded selection** |
| Devotional guides (in `more.js`) | ~20KB of HTML strings | Moderate — 11 guides | **No — hardcoded in JS** |
| Bible content | 0 bytes local | **None — depends on 3 external APIs** | **API-dependent** |
| Lectionary mapping | 0 bytes | **None — readings API does this** | **API-dependent** |
| Prayer texts | 0 bytes | **None** | N/A |

The parish schedule data is well-architected. The spiritual formation content is not. It's either hardcoded into JavaScript strings, limited to a manually curated subset, or dependent on external APIs that fail when a user is in a church basement with one bar of signal.

### The Three API Dependencies

1. **massfinder-readings-api.vercel.app** — Custom serverless function that scrapes USCCB for daily readings. If USCCB changes their HTML structure, this breaks. If the Vercel function cold-starts slowly, the user stares at "Loading today's readings..." for 5-12 seconds.

2. **query.bibleget.io** — Third-party API by Fr. D'Orazio. No SLA, no rate limit documentation, maintained by volunteers. Used for BibleGet verse formatting and gospel acclamation verse.

3. **litcal.johnromanodorazio.com** — Same maintainer. Used for saint card and liturgical calendar. Reliable so far, but it's one priest's side project.

Any of these going down kills a feature. All three going down makes the More tab mostly empty. For a PWA that promises offline capability, this is architecturally inconsistent.

---

## PART 2: THE CONTENT STRATEGY

### Principle: Local First, API to Enhance

Every feature must work from locally cached data. API calls add richness (NABRE translation, today's specific readings) but are never required for the feature to render something useful. If all APIs are down, every feature still shows content — just from local data instead of live data.

### The Content Layer Stack

```
┌──────────────────────────────────────────────────────────────┐
│  LAYER 3: LIVE APIs (enhancement — graceful degradation)     │
│  • massfinder-readings-api → today's NABRE readings          │
│  • BibleGet API → NABRE verse text for specific passages     │
│  • LitCal API → today's saint, liturgical season, HDO flags  │
└──────────────┬───────────────────────────────────────────────┘
               │ If available, overrides/enhances Layer 2
┌──────────────┴───────────────────────────────────────────────┐
│  LAYER 2: LOCAL DATA FILES (cached by service worker)        │
│  • data/catechism.json — full 2,865 CCC paragraphs + xrefs  │
│  • data/bible-drb.json — Douay-Rheims (public domain) text  │
│  • data/lectionary-index.json — which readings per day       │
│  • data/prayers.json — all prayer texts (rosary, novenas)    │
│  • data/examination.json — examination of conscience         │
│  • data/stations.json — Stations of the Cross meditations    │
│  • data/saints-mini.json — ~100 saint bios for feast days    │
└──────────────┬───────────────────────────────────────────────┘
               │ Always available (SW cached after first load)
┌──────────────┴───────────────────────────────────────────────┐
│  LAYER 1: INLINE DATA (ships with the bundle — always there) │
│  • config.js — service types, days, languages, region        │
│  • Rosary mysteries (4 sets × 5 decades) — ~4KB              │
│  • Core prayers (Our Father, Hail Mary, etc.) — ~3KB         │
│  • Devotional guide prose — ~20KB (already in more.js)       │
│  • PARISH_CHURCH_MAP — ~4KB (already in data.js)             │
└──────────────────────────────────────────────────────────────┘
```

---

## PART 3: THE DATA FILES

### 3.1 Full Catechism — `data/catechism.json`

**Source:** `aseemsavio/catholicism-in-json` (GitHub)
**License:** The CCC text is published by the Vatican and freely distributable for non-commercial use.
**Size:** 1.35MB raw, **427KB gzipped** (comparable to a single hero image)

**Structure (current `ccc-mini.json`):**
```json
{
  "paragraphs": { "2180": "The precept of the Church...", ... },
  "xrefs": { "2180": { "fwd": [2042, 1389], "rev": [2042] }, ... }
}
```

**What changes:** Replace `ccc-mini.json` (23 paragraphs) with the full CCC. The structure stays identical — just the count goes from 23 to 2,865. The cross-reference index grows from 22 to 1,811 entries. The `ccc.js` module doesn't change at all — it already handles arbitrary paragraph lookups and cross-reference navigation.

**Loading strategy:** Lazy-load on first CCC tap (same as today). Service worker caches it after first fetch. Every subsequent CCC access is instant from cache. Not in `SHELL_ASSETS` — no upfront cost for users who never tap a CCC reference.

**What this unlocks:**
- Any devotional guide can reference any CCC paragraph, not just the 23 currently curated
- Future features (examination of conscience, sacrament preparation guides) can cite CCC freely
- Cross-reference rabbit hole works for all 2,865 paragraphs, not just the curated subset
- Forkers get the full CCC automatically — no curation required

**Build step:** Create a script (`scripts/build-catechism.js`) that fetches the raw JSON from GitHub, builds the paragraph lookup + cross-reference index, and writes `data/catechism.json`. Run once, commit the output. Re-run only when the upstream source updates (rarely — the CCC doesn't change).

### 3.2 Lectionary Reference Index — `data/lectionary-index.json`

This is the mapping file that tells the app which Scripture passages are read at Mass on which day. The Lectionary itself (the *Ordo Lectionum Missae*) is a public reference — the USCCB copyrights their specific NABRE *translation* of the passages, not the *list* of which passages to read.

**Structure:**
```json
{
  "_meta": {
    "source": "Ordo Lectionum Missae (1969/1981)",
    "note": "References only, not translated text. Actual text fetched via BibleGet API or local DRB."
  },
  "sundays": {
    "A": {
      "advent_1": {
        "first_reading": "Isaiah 2:1-5",
        "responsorial_psalm": "Psalm 122:1-2,3-4,4-5,6-7,8-9",
        "second_reading": "Romans 13:11-14",
        "gospel": "Matthew 24:37-44"
      },
      "advent_2": { ... },
      "lent_1": { ... },
      "ordinary_1": { ... }
    },
    "B": { ... },
    "C": { ... }
  },
  "weekdays": {
    "I": {
      "ordinary_week1_monday": {
        "first_reading": "Hebrews 1:1-6",
        "responsorial_psalm": "Psalm 97:1,2b,6,7c,9",
        "gospel": "Mark 1:14-20"
      }
    },
    "II": { ... }
  },
  "seasons": {
    "lent_week1_monday": {
      "first_reading": "Leviticus 19:1-2,11-18",
      "responsorial_psalm": "Psalm 19:8,9,10,15",
      "gospel": "Matthew 25:31-46"
    }
  },
  "sanctoral": {
    "03-19": {
      "name": "Solemnity of Saint Joseph",
      "first_reading": "2 Samuel 7:4-5a,12-14a,16",
      "responsorial_psalm": "Psalm 89:2-3,4-5,27,29",
      "second_reading": "Romans 4:13,16-18,22",
      "gospel": "Matthew 1:16,18-21,24a | Luke 2:41-51a"
    }
  }
}
```

**Size estimate:** ~80KB raw, ~25KB gzipped (the lectionary is ~700 unique day entries × ~100 bytes per entry for references only).

**How it integrates with LitCal:** LitCal tells us "today is Monday of the 3rd Week of Lent, Year A, Weekday Cycle II." The lectionary index maps that liturgical day to Scripture references. BibleGet (or local DRB) provides the actual text.

**Fallback chain:**
1. LitCal API → tells us which liturgical day it is → lectionary index → BibleGet for NABRE text
2. If BibleGet fails → lectionary index → local DRB text for same references
3. If LitCal fails → compute liturgical day locally from date (romcal-style algorithm) → lectionary index → local DRB
4. If everything fails → show USCCB link (current behavior, last resort)

**Build step:** Create `scripts/build-lectionary-index.js` that compiles the reference index from the publicly available lectionary tables (catholic-resources.org has comprehensive HTML tables). This is a one-time compilation effort — the lectionary doesn't change year to year (it's a fixed 3-year/2-year cycle).

### 3.3 Bible Text — `data/bible-drb/` (split by book)

**Source:** BibleGet API (DRB version) or `scrollmapper/bible_databases` repo
**License:** Douay-Rheims Bible is public domain (pre-1923 publication)

**Why DRB and not NABRE:** NABRE is copyrighted by the USCCB. Shipping the full NABRE text in a repo would require a license. The DRB is the traditional Catholic English translation, it's public domain, and it covers every verse in the Catholic canon (73 books including deuterocanonicals).

**Strategy: Pre-fetch the lectionary passages, not the whole Bible.**

The full DRB is ~4.5MB. That's too large to ship entirely. But the lectionary only uses ~14% of the Old Testament and ~72% of the New Testament. Pre-fetching just the lectionary passages gives us reliable offline readings at a fraction of the size.

**Structure — split by book for lazy loading:**
```
data/bible-drb/
  genesis.json      — { "1:1": "In the beginning...", "1:2": "And the earth...", ... }
  exodus.json
  ...
  matthew.json
  mark.json
  ...
  revelation.json
```

**Size estimate:** ~600KB for lectionary passages only (~3,500 unique verses), ~200KB gzipped. Split across 73 files, each book loads independently on demand.

**Loading strategy:**
- When a reading reference is needed (e.g., "Matthew 24:37-44"), lazy-load `data/bible-drb/matthew.json`
- Service worker caches each book file after first fetch
- Over time, the frequently-used books (Matthew, Luke, Psalms, Isaiah, Romans) are all cached
- BibleGet API is tried first for NABRE text (better translation for modern readers)
- DRB is the offline fallback — always available after first load

**Build step:** `scripts/build-bible-drb.js` fetches each book from BibleGet API (version=DRB), structures it as `{ "chapter:verse": "text" }`, writes one JSON file per book. Run once. The DRB text doesn't change.

### 3.4 Prayer Texts — `data/prayers.json`

All prayer texts needed by guided devotion features. Public domain content.

**Structure:**
```json
{
  "core": {
    "sign_of_cross": "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
    "our_father": "Our Father, who art in heaven...",
    "hail_mary": "Hail Mary, full of grace...",
    "glory_be": "Glory be to the Father...",
    "apostles_creed": "I believe in God, the Father Almighty...",
    "act_of_contrition": "O my God, I am heartily sorry..."
  },
  "rosary": {
    "fatima_prayer": "O my Jesus, forgive us our sins...",
    "hail_holy_queen": "Hail, holy Queen, Mother of Mercy...",
    "mysteries": {
      "joyful": {
        "title": "The Joyful Mysteries",
        "days": ["monday", "saturday"],
        "season_override": ["advent", "christmas"],
        "decades": [
          {
            "title": "The Annunciation",
            "ref": "Luke 1:26-38",
            "fruit": "Humility",
            "meditation": "The Angel Gabriel announces to Mary..."
          }
        ]
      },
      "sorrowful": { ... },
      "glorious": { ... },
      "luminous": { ... }
    }
  },
  "divine_mercy_chaplet": {
    "opening": "You expired, Jesus, but the source of life...",
    "decade_prayer": "For the sake of His sorrowful Passion...",
    "closing": "Holy God, Holy Mighty One..."
  },
  "stations_of_cross": [
    {
      "station": 1,
      "title": "Jesus Is Condemned to Death",
      "ref": "Matthew 27:22-26",
      "meditation": "Pilate said to them...",
      "prayer": "Lord Jesus, You were condemned..."
    }
  ],
  "novenas": {
    "holy_spirit": {
      "title": "Novena to the Holy Spirit",
      "occasion": "Between Ascension and Pentecost",
      "litcal_trigger": { "after": "Ascension", "days": 9 },
      "days": [
        { "day": 1, "title": "The Holy Spirit, Spirit of Truth", "prayer": "..." }
      ]
    },
    "divine_mercy": {
      "title": "Divine Mercy Novena",
      "occasion": "Good Friday through Divine Mercy Sunday",
      "litcal_trigger": { "start": "good_friday", "days": 9 },
      "days": [ ... ]
    },
    "st_joseph": { ... },
    "miraculous_medal": { ... },
    "st_andrew": { ... }
  }
}
```

**Size estimate:** ~35KB raw, ~12KB gzipped. Small enough to inline in the bundle or load as a single file.

**Loading strategy:** Inline in the bundle (it's only 12KB gzipped). Every devotional feature has instant access to prayer texts. No lazy loading needed.

### 3.5 Examination of Conscience — `data/examination.json`

**Source:** `kas-catholic/confessit-web` (MIT license) — 10 Commandments + Precepts of the Church, with ~150 reflection questions, Bible citations, and CCC references.

**Size:** ~10KB gzipped.

**Structure:**
```json
{
  "commandments": {
    "1": {
      "title": "First Commandment",
      "text": "I am the Lord your God. You shall have no other gods before Me.",
      "ref": "Exodus 20:2-3",
      "ccc": [2084, 2085, 2086],
      "questions": [
        { "text": "Have I doubted or denied that God exists?", "ccc": 2087 },
        { "text": "Have I placed excessive importance on work, money, or possessions?", "ccc": 2113 },
        { "text": "Have I participated in superstitious practices?", "ccc": 2111 }
      ]
    }
  },
  "precepts": {
    "1": {
      "title": "Attend Mass on Sundays and Holy Days of Obligation",
      "ccc": [2042, 2180, 2181],
      "questions": [
        { "text": "Have I deliberately missed Mass on a Sunday or Holy Day?", "ccc": 2181 }
      ]
    }
  },
  "prayers": {
    "before": "Come Holy Spirit...",
    "act_of_contrition": "O my God, I am heartily sorry..."
  }
}
```

**Cross-reference integration:** Every question links to a CCC paragraph number. Tapping the CCC number opens the CCC bottom sheet with the full paragraph + related teachings. This creates a natural "why is this a sin?" → "here's the Church's teaching" exploration path.

**Loading strategy:** Inline in bundle (10KB is negligible) or lazy-load on first access to the examination module.

---

## PART 4: THE CROSS-REFERENCE ENGINE

This is the architectural centerpiece. Every content type links to every other content type through a lightweight reference system.

### The Reference Graph

```
  Bible Verse  ←──────────────→  CCC Paragraph
       ↑                               ↑
       │                               │
       ↓                               ↓
  Lectionary Day  ←──→  LitCal Event  ←──→  Devotional Guide
       ↑                               ↑
       │                               │
       ↓                               ↓
  Examination Question  ←──→  Prayer Text
```

### Implementation: `src/refs.js` — The Reference Resolver

A single module that resolves any reference type to its content:

```javascript
// src/refs.js — Universal reference resolver

var _cache = {};

// Resolve a Bible reference to text
// Returns: { text, translation, ref } or null
function resolveBible(ref, preferNABRE) {
  // 1. Try BibleGet API for NABRE (if online and preferNABRE)
  // 2. Fall back to local DRB
  // 3. Return { text, translation: 'DRB', ref }
}

// Resolve a CCC reference to paragraph
// Returns: { id, text, xrefs: { fwd, rev } } or null
function resolveCCC(num) {
  // Loads from catechism.json (lazy, cached)
}

// Resolve a liturgical day to readings
// Returns: { first_reading, psalm, second_reading, gospel, gospel_acclamation }
function resolveReadings(litcalEvent) {
  // 1. Use litcalEvent.readings if available
  // 2. Fall back to lectionary-index.json by liturgical day key
}

// Render a tappable reference inline
// e.g., renderRef('ccc', '2180') → <span class="ref-tap" data-type="ccc" data-ref="2180">CCC 2180</span>
function renderRef(type, ref) {
  // Returns HTML string with tappable span
}

// Handle tap on any reference
function handleRefTap(type, ref) {
  switch (type) {
    case 'ccc': openCCCSheet(ref); break;
    case 'bible': openBibleSheet(ref); break;
    case 'prayer': scrollToPrayer(ref); break;
  }
}
```

**What this unlocks:**

A devotional guide about Lent can include `CCC 540` and `Matthew 4:1-11` as tappable references. Tapping `CCC 540` opens the CCC bottom sheet showing the full paragraph plus related teachings (CCC 538, 539, 541 — the complete Lenten theology cluster). Tapping `Matthew 4:1-11` opens a reading sheet showing the DRB verse text (or NABRE if the API is available). The examination of conscience question "Have I deliberately missed Mass?" links to `CCC 2181`, which links to `CCC 2180` and `CCC 2042`, which link to canon law and the precepts of the Church. Every thread pulls another thread.

---

## PART 5: UX — HOW TO ADD DEPTH WITHOUT CLUTTER

### The Progressive Disclosure Hierarchy

MassFinder serves three very different users (from your PERSONAS.md):
1. **Dorothy (55+):** Wants Mass times. Period. Doesn't want to be overwhelmed.
2. **Maria (30s):** Wants Mass times + some spiritual formation. Will explore if it's easy.
3. **Lucas (20s):** Wants everything — readings, saint card, rosary guide, novena tracker. Lives in the app.

**The architecture must serve all three with the same UI.** The answer is three layers of progressive disclosure:

```
LAYER 1: Always visible (Dorothy's needs)
├── Find tab — Mass times, Confession times, Adoration
├── Map tab — Where's the nearest church?
├── Saved tab — My favorites
└── More tab — Today's saint, readings link

LAYER 2: One tap deep (Maria's exploration)
├── Saint card → tap → full biography + feast context
├── Reading heading → tap → formatted Scripture text
├── CCC reference → tap → bottom sheet with paragraph
├── "Prepare for Confession" → tap → examination flow
└── Devotional guide → tap → expandable content

LAYER 3: Intentional exploration (Lucas's deep engagement)
├── CCC cross-references → related teachings → further exploration
├── Rosary guide → step through decades with Scripture meditations
├── Novena tracker → 9-day prayer journey with daily content
├── Stations of the Cross → 14-station guided walk
└── Bible translation toggle → DRB ↔ NABRE
```

**Dorothy never sees Layer 3.** It doesn't clutter her experience. The Find tab is still just a list of churches with Mass times.

**Maria discovers Layer 2 naturally.** The CCC references in the devotional guides are already tappable. The saint card already shows content. Adding more content behind those taps doesn't add any visual complexity to the surface.

**Lucas opts into Layer 3 deliberately.** The rosary guide, novena tracker, and stations are features he navigates to intentionally. They don't appear unless he's looking for them.

### The "More" Tab Redesign

The More tab is currently a vertical scroll of sections. As features grow, this becomes overwhelming. Instead, organize it as a **card grid with progressive reveal:**

```
┌─────────────────────────────────────────────┐
│  🌟 Today's Celebration                     │
│  [Saint card — always first, contextual]     │
├─────────────────────────────────────────────┤
│  📖 Today's Readings                        │
│  [Collapsed by default — tap to expand]      │
├──────────────────┬──────────────────────────┤
│  🙏 Prayer &     │  📿 Guided               │
│  Devotion        │  Devotions               │
│  [Rosary]        │  [Confession Prep]       │
│  [Divine Mercy]  │  [Novena Tracker]        │
│  [Stations]      │  [Stations of Cross]     │
├──────────────────┴──────────────────────────┤
│  📚 Faith Guides                            │
│  [Current 11 devotional guides — unchanged] │
├─────────────────────────────────────────────┤
│  💬 Feedback / About                        │
└─────────────────────────────────────────────┘
```

The "Prayer & Devotion" and "Guided Devotions" sections are new entry points to the interactive features. They're small cards (not full-section blocks) that open into full-screen experiences when tapped.

### The Full-Screen Module Pattern

Interactive features (rosary, stations, examination, novena) open as full-screen overlays — the same pattern as the detail panel for churches. They slide up from the bottom, have a drag handle, and dismiss with swipe-down or back button. This prevents the More tab from becoming a 10,000-pixel scroll.

```
More tab → tap "Rosary" → full-screen rosary module slides up
  └── 5 decades, swipeable (Splide or CSS scroll-snap)
  └── Each decade: mystery title, Scripture ref (tappable → Bible sheet), meditation, prayer texts
  └── Progress indicator (5 dots at top)
  └── "Today's Mysteries" auto-selected by day/season
  └── Close: swipe down or X button → back to More tab
```

---

## PART 6: NEW MODULES (what Claude Code builds)

### 6.1 `src/refs.js` — Reference Resolver (build first)

The foundation for everything else. Handles lazy-loading of `catechism.json`, `bible-drb/*.json`, and `lectionary-index.json`. Provides `resolveBible()`, `resolveCCC()`, `resolveReadings()`, `renderRef()`, and `handleRefTap()`.

**Depends on:** config.js, utils.js
**Depended on by:** ccc.js (refactor to use refs.js), readings.js (refactor to use refs.js), all new devotional modules

### 6.2 `src/rosary.js` — Guided Rosary

Reads mysteries from `data/prayers.json`. Auto-selects by day (or liturgical season via LitCal). Full-screen swipeable experience. Each decade links to Scripture (via refs.js) and shows meditation text.

### 6.3 `src/examination.js` — Confession Preparation

Reads examination data from `data/examination.json`. Ten Commandments + Precepts, each expandable. Reflection questions with CCC references (tappable via refs.js). Summary view of selected items. Act of Contrition at the end. "Find Confession Near Me" button that filters the Find tab.

### 6.4 `src/stations.js` — Stations of the Cross

14-station guided experience from `data/prayers.json`. Each station: title, Scripture reference (tappable), meditation, prayer. Swipeable cards or vertical scroll. Prominently surfaced during Lent (LitCal season detection).

### 6.5 `src/novena.js` — Novena Tracker

Reads novena data from `data/prayers.json`. Supports multiple novenas (Holy Spirit, Divine Mercy, St. Joseph, Miraculous Medal, St. Andrew). Tracks current day (localStorage). Shows daily prayer text. LitCal integration: auto-suggests relevant novena when the liturgical calendar indicates it (e.g., Holy Spirit Novena between Ascension and Pentecost).

### 6.6 Refactored `src/readings.js` — Enhanced with Lectionary Index

Refactor to use `refs.js` for Bible text resolution. Current flow: readings API → render. New flow: readings API → enhance with BibleGet NABRE text → fall back to lectionary index + local DRB. The lectionary index provides reliable readings even when both the readings API and BibleGet are down.

---

## PART 7: THE DATA PIPELINE

### Build Scripts for Static Data

```
scripts/
├── build-catechism.js     — Fetches full CCC JSON, builds paragraph+xref structure
├── build-lectionary.js    — Compiles lectionary reference index from public tables
├── build-bible-drb.js     — Fetches DRB text from BibleGet, writes per-book JSON
├── build-prayers.js       — (manual) Validates prayers.json structure
├── build-examination.js   — Processes ConfessIt data into MassFinder format
└── build.js               — (existing) esbuild bundle
```

These run once (or occasionally when upstream sources update). Their outputs are committed to the repo. CI validates the outputs. Forkers get the data files without running any build scripts.

### `data/` Directory in Repo

```
data/
├── catechism.json         — 427KB gzipped, full CCC with cross-references
├── lectionary-index.json  — 25KB gzipped, lectionary reference mapping
├── prayers.json           — 12KB gzipped, all prayer texts + mysteries + novenas + stations
├── examination.json       — 10KB gzipped, examination of conscience
├── saints-mini.json       — 15KB gzipped, ~100 saint biographies for feast days
└── bible-drb/             — 200KB gzipped total, DRB text split by book
    ├── genesis.json
    ├── exodus.json
    ├── ...
    └── revelation.json
```

**Total additional data:** ~690KB gzipped. This is less than a single large photograph. The service worker caches it lazily — only files that features actually request get cached. A user who only uses the Mass finder never downloads any of this.

### Service Worker Update

```javascript
// In sw.js — remove ccc-mini.json from SHELL_ASSETS
// The full catechism and all data/ files load on demand via stale-while-revalidate
// They're NOT in SHELL_ASSETS — they don't slow down initial install
```

---

## PART 8: MAINTAINABILITY FOR DEVELOPERS

### Adding a New Devotional Feature

A contributor who wants to add, say, a "Liturgy of the Hours" guided module:

1. Add prayer texts to `data/prayers.json` under a `liturgy_of_hours` key
2. Create `src/liturgy-of-hours.js` with a `render()` function and `init()` function
3. Import in `src/app.js`, call `init()`, expose any window functions
4. Add an entry card in the More tab (in `src/more.js`'s render function)
5. `npm run build` → done

They never touch `config.js` (no new service type), they never touch `parish_data.json` (no new data model), they never touch the schema. The content data and the feature module are self-contained.

### Adding a New Prayer/Novena

1. Add the novena object to `data/prayers.json` under `novenas.new_novena_name`
2. If it has a liturgical trigger, add `litcal_trigger` field
3. The novena module (`src/novena.js`) automatically picks it up — it reads from the JSON, it doesn't hardcode novena names
4. `npm run build` → done

### Adding Cross-References to Existing Content

Every existing devotional guide in `more.js` can have CCC and Bible references made tappable by wrapping them with `renderRef()`:

```javascript
// BEFORE (hardcoded string):
'<p><strong>CCC 2180:</strong> "On Sundays..."</p>'

// AFTER (tappable reference):
'<p>' + refs.renderRef('ccc', '2180') + ': "On Sundays..."</p>'
```

This is a mechanical transformation — every `<strong>CCC XXXX:</strong>` pattern in the devotional guide strings can be converted to tappable references. The content doesn't change. The behavior does.

---

## PART 9: IMPLEMENTATION PRIORITY

| Phase | Work | Data Files | New Modules | Impact |
|-------|------|-----------|-------------|--------|
| **1** | Full CCC + `refs.js` | `catechism.json` | `refs.js` (refactor `ccc.js`) | All CCC refs become tappable throughout app |
| **2** | Prayers + Rosary guide | `prayers.json` | `rosary.js` | First interactive devotional feature |
| **3** | Examination of Conscience | `examination.json` | `examination.js` | Deepest formation feature, strongest word-of-mouth |
| **4** | Lectionary index + DRB | `lectionary-index.json`, `bible-drb/` | Refactored `readings.js` | Offline readings, translation toggle |
| **5** | Stations + Novena tracker | (in `prayers.json`) | `stations.js`, `novena.js` | Seasonal features, daily engagement |
| **6** | Saint biographies | `saints-mini.json` | Enhanced `readings.js` | Rich saint card content |

Phase 1 is the foundation — everything else depends on `refs.js` and the full CCC. Phase 2-3 are the features that make users say "I didn't know an app could help me with this." Phase 4 makes the app reliable offline. Phase 5-6 deepen engagement for the most active users.

---

## PART 10: WHAT THIS MEANS FOR THE FORK STORY

A developer forking MassFinder for the Diocese of Miami gets:

- The full CCC (universal — same everywhere)
- The complete lectionary index (universal — same everywhere)
- The DRB Bible text (universal — same everywhere)
- All prayer texts (universal — same everywhere)
- The examination of conscience (universal — same everywhere)
- Saint biographies (universal — same everywhere)

They replace **one file** (`parish_data.json`) and **five lines** of config (`REGION` in `config.js`). Everything else — every feature, every data file, every cross-reference — works identically. The Catholic content is universal. Only the parish schedule is local.

That's the architecture: **universal formation content + local parish data = a complete Catholic companion app for any diocese in the country.**
