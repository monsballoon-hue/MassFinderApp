# MassFinder V2 — Complete Rebuild Plan
## Claude Code Handoff Document

**Purpose:** This document contains everything needed to rebuild MassFinder from the ground up in a new repository with a modular architecture. It is designed to be consumed by Claude Code in sequential phases.

**Source repo:** `github.com/monsballom-hue/MassFinder` (dev branch) — read-only reference
**Target repo:** New repo to be created by Mike (see Admin Steps below)

---

## ADMIN STEPS (Mike does these manually before Claude Code begins)

### Step 1: Create New GitHub Repository
1. Go to github.com → New Repository
2. Name: `massfinder-v2` (or `massfinder-app`, your preference)
3. Public, no template, add README
4. Clone locally: `git clone git@github.com:monsballom-hue/massfinder-v2.git`

### Step 2: Create New Vercel Project
1. Go to vercel.com → Add New Project
2. Import the new GitHub repo
3. Framework Preset: **Other** (not Next.js)
4. Build Command: `npm run build`
5. Output Directory: `.` (root — we serve index.html from root)
6. Install Command: `npm install`
7. Do NOT add a custom domain yet — use the default `.vercel.app` URL for testing
8. Add Environment Variables (Settings → Environment Variables):
   - `SUPABASE_URL` = (same as current project)
   - `SUPABASE_SERVICE_ROLE_KEY` = (same as current project)
   - These are only needed for the review API route, not for the public app

### Step 3: Copy Data Files
Copy these files from the old repo to the new repo root:
- `parish_data.json` (929KB — the source of truth)
- `events.json` (104KB — community events)
- `manifest.json` (505 bytes — PWA manifest)
- `assets/` directory (icons: icon-180.png, icon-192.png, icon-512.png)

### Step 4: Tell Claude Code to Begin
Open the new repo in Claude Code and provide this document as context.

---

## EXCLUDE FROM CONTEXT

Do NOT load these files — they are old-architecture artifacts:
- `MassFinder_V2_Build_Plan.md`
- `project_plans/archive/*`
- `scripts/bulletin-parser/*` (will be ported later, not in initial build)
- `supabase/migrations/*` (carry over as-is, don't modify)
- `admin.html` (being replaced)
- `review/` directory

---

## PHASE 1: PROJECT SCAFFOLD

### 1.1 Directory Structure

Create this exact structure:

```
massfinder-v2/
├── src/
│   ├── app.js
│   ├── config.js
│   ├── data.js
│   ├── render.js
│   ├── events.js
│   ├── map.js
│   ├── readings.js
│   ├── ui.js
│   ├── saved.js
│   ├── more.js
│   ├── location.js
│   └── utils.js
├── css/
│   └── app.css
├── scripts/
│   ├── build.js
│   ├── generate-schema.js
│   └── apply-changes.js
├── assets/
│   ├── icon-180.png
│   ├── icon-192.png
│   └── icon-512.png
├── index.html
├── parish_data.json          (copied from old repo)
├── parish_data.schema.json   (will be generated)
├── events.json               (copied from old repo)
├── manifest.json             (copied from old repo)
├── sw.js
├── vercel.json
├── package.json
├── .gitignore
├── CLAUDE.md
├── CONTRIBUTING.md
├── DATA_STANDARDS.md
├── FORK_GUIDE.md
└── .github/
    └── workflows/
        └── build-and-validate.yml
```

### 1.2 `package.json`

```json
{
  "name": "massfinder",
  "version": "3.0.0",
  "private": true,
  "description": "Catholic services directory PWA",
  "scripts": {
    "build": "node scripts/build.js",
    "dev": "node scripts/build.js --watch",
    "schema": "node scripts/generate-schema.js",
    "validate": "npx ajv-cli validate --spec=draft7 -s parish_data.schema.json -d parish_data.json --errors=text --all-errors -c ajv-formats",
    "precommit": "npm run build && npm run schema && npm run validate"
  },
  "devDependencies": {
    "esbuild": "^0.24.0",
    "ajv-cli": "^5.0.0",
    "ajv-formats": "^3.0.0"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.49.0"
  },
  "engines": {
    "node": ">=18"
  }
}
```

### 1.3 `scripts/build.js`

```javascript
var esbuild = require('esbuild');
var path = require('path');

var isWatch = process.argv.includes('--watch');

var options = {
  entryPoints: [path.join(__dirname, '..', 'src', 'app.js')],
  bundle: true,
  outfile: path.join(__dirname, '..', 'dist', 'app.min.js'),
  format: 'iife',
  target: ['es2017'],
  minify: !isWatch,
  sourcemap: isWatch,
  logLevel: 'info',
};

if (isWatch) {
  esbuild.context(options).then(function(ctx) {
    ctx.watch();
    console.log('Watching for changes...');
  });
} else {
  esbuild.build(options).then(function() {
    console.log('Build complete: dist/app.min.js');
  });
}
```

### 1.4 `.gitignore`

```
node_modules/
dist/
.env.local
.DS_Store
*.log
```

### 1.5 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "npm run build",
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 1.6 `.github/workflows/build-and-validate.yml`

```yaml
name: Build & Validate

on:
  push:
    branches: [main, dev]
  pull_request:
    branches: [main]

jobs:
  build:
    name: Build, Generate Schema, Validate
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - run: npm run schema
      - name: Check JSON syntax
        run: node -e "JSON.parse(require('fs').readFileSync('parish_data.json','utf8'));console.log('✓ Valid JSON')"
      - run: npm run validate
```

---

## PHASE 2: CONFIG MODULE — THE SINGLE SOURCE

### 2.1 `src/config.js`

This is the most important file. Every service type, day type, language, category grouping, and region setting is defined here. Everything else derives from it.

**Claude Code instruction:** Copy this file exactly as written. Then cross-reference against the current `index.html` lines 895-903 (SVC, SERVICE_CATEGORIES, DAY_ORDER, DAY_NAMES, LANG_NAMES, CLERGY_RANK, CLERGY_ROLE_LABEL) to verify no types are missing.

```javascript
// src/config.js — THE canonical type definitions
// To add a new service type: add ONE entry to SERVICE_TYPES. Everything derives.

// ── Service Types ──
var SERVICE_TYPES = {
  sunday_mass:        { label: 'Sunday Mass',              group: 'Mass',                icon: 'church' },
  daily_mass:         { label: 'Daily Mass',               group: 'Mass',                icon: 'church' },
  communion_service:  { label: 'Communion Service (no priest)', group: 'Mass',            icon: 'church' },
  confession:         { label: 'Confession',               group: 'Sacraments',          icon: 'shield' },
  anointing_of_sick:  { label: 'Anointing of the Sick',    group: 'Sacraments',          icon: 'shield' },
  adoration:          { label: 'Adoration',                group: 'Adoration',           icon: 'sun' },
  perpetual_adoration:{ label: 'Perpetual Adoration',      group: 'Adoration',           icon: 'sun', perpetual: true },
  holy_hour:          { label: 'Holy Hour',                group: 'Adoration',           icon: 'sun' },
  rosary:             { label: 'Rosary',                   group: 'Prayer & Devotion',   icon: 'book' },
  stations_of_cross:  { label: 'Stations of the Cross',    group: 'Prayer & Devotion',   icon: 'book' },
  divine_mercy:       { label: 'Divine Mercy Chaplet',     group: 'Prayer & Devotion',   icon: 'book' },
  miraculous_medal:   { label: 'Miraculous Medal',         group: 'Prayer & Devotion',   icon: 'book' },
  novena:             { label: 'Novena',                   group: 'Prayer & Devotion',   icon: 'book' },
  devotion:           { label: 'Devotion',                 group: 'Prayer & Devotion',   icon: 'book' },
  vespers:            { label: 'Vespers',                  group: 'Prayer & Devotion',   icon: 'book' },
  gorzkie_zale:       { label: 'Gorzkie Żale',            group: 'Prayer & Devotion',   icon: 'book' },
  benediction:        { label: 'Benediction',              group: 'Prayer & Devotion',   icon: 'book' },
  prayer_group:       { label: 'Prayer Group',             group: 'Prayer & Devotion',   icon: 'book' },
  blessing:           { label: 'Blessing',                 group: 'Prayer & Devotion',   icon: 'book' },
  holy_thursday_mass: { label: "Mass of the Lord's Supper",group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  good_friday_service:{ label: 'Celebration of the Passion',group:'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  easter_vigil_mass:  { label: 'Easter Vigil',             group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  palm_sunday_mass:   { label: 'Palm Sunday Mass',         group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
  easter_sunday_mass: { label: 'Easter Sunday Mass',       group: 'Holy Week',           icon: 'cross', seasonal: 'holy_week' },
};

// ── Day Types ──
var DAY_TYPES = {
  sunday:         { label: 'Sunday',              short: 'Sun', order: 0 },
  monday:         { label: 'Monday',              short: 'Mon', order: 1 },
  tuesday:        { label: 'Tuesday',             short: 'Tue', order: 2 },
  wednesday:      { label: 'Wednesday',           short: 'Wed', order: 3 },
  thursday:       { label: 'Thursday',            short: 'Thu', order: 4 },
  friday:         { label: 'Friday',              short: 'Fri', order: 5 },
  saturday:       { label: 'Saturday',            short: 'Sat', order: 6 },
  weekday:        { label: 'Weekday (Mon–Fri)',   short: 'M-F', order: 7,
                    expandsTo: ['monday','tuesday','wednesday','thursday','friday'] },
  daily:          { label: 'Daily',               short: 'Daily', order: 8,
                    expandsTo: ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] },
  first_friday:   { label: 'First Friday',        short: '1st Fri', order: 9 },
  first_saturday: { label: 'First Saturday',      short: '1st Sat', order: 10 },
  holyday:        { label: 'Holy Day',            short: 'HD', order: 11 },
  holyday_eve:    { label: 'Holy Day Eve',        short: 'HD Eve', order: 12 },
  lent:           { label: 'Lent',                short: 'Lent', order: 13, seasonal: true },
  good_friday:    { label: 'Good Friday',         short: 'GF', order: 14, seasonal: true },
  holy_thursday:  { label: 'Holy Thursday',       short: 'HT', order: 15, seasonal: true },
  holy_saturday:  { label: 'Holy Saturday',       short: 'HS', order: 16, seasonal: true },
  easter_vigil:   { label: 'Easter Vigil',        short: 'EV', order: 17, seasonal: true },
  palm_sunday:    { label: 'Palm Sunday',         short: 'PS', order: 18, seasonal: true },
  easter_sunday:  { label: 'Easter Sunday',       short: 'ES', order: 19, seasonal: true },
  civil_holiday:  { label: 'Civil Holiday',       short: 'Hol', order: 20 },
};

// ── Languages ──
var LANGUAGES = {
  en:  { label: 'English' },
  es:  { label: 'Spanish' },
  pl:  { label: 'Polish' },
  pt:  { label: 'Portuguese' },
  la:  { label: 'Latin' },
  fr:  { label: 'French' },
  vi:  { label: 'Vietnamese' },
  asl: { label: 'ASL' },
};

// ── Region (forkers change this) ──
var REGION = {
  name: 'Western New England',
  tagline: 'Catholic Services Directory',
  mapCenter: [42.38, -72.78],
  mapZoom: 9,
  gaId: 'G-0XWS7YKHED',
  web3FormsKey: '4f21ef78-9dc3-4f10-b1ad-3cdfad78d55b',
  readingsApiUrl: 'https://massfinder-readings-api.vercel.app/api/readings',
  dioceseUrl: 'https://diospringfield.org',
  dioceseName: 'Diocese of Springfield',
  states: ['MA', 'CT', 'VT', 'NH'],
};

// ── Clergy Roles ──
var CLERGY_ROLES = {
  pastor:              { label: 'Pastor',              rank: 1 },
  administrator:       { label: 'Administrator',       rank: 2 },
  provisional_priest:  { label: 'Provisional Priest',  rank: 3 },
  parochial_vicar:     { label: 'Parochial Vicar',     rank: 4 },
  in_residence:        { label: 'In Residence',        rank: 5 },
  senior_priest:       { label: 'Senior Priest',       rank: 6 },
  priest:              { label: 'Priest',              rank: 7 },
  deacon:              { label: 'Deacon',              rank: 8 },
  deacon_emeritus:     { label: 'Deacon Emeritus',     rank: 9 },
  deacon_retired:      { label: 'Deacon (Retired)',    rank: 10 },
  transitional_deacon: { label: 'Transitional Deacon', rank: 11 },
  bishop:              { label: 'Bishop',              rank: 0 },
  bishop_emeritus:     { label: 'Bishop Emeritus',     rank: 12 },
};

// ── Derived Values (computed, never maintained separately) ──

// Service label map: { sunday_mass: 'Sunday Mass', ... }
var SVC_LABELS = {};
Object.keys(SERVICE_TYPES).forEach(function(k) { SVC_LABELS[k] = SERVICE_TYPES[k].label; });

// Service categories grouped: { 'Mass': ['sunday_mass','daily_mass','communion_service'], ... }
var SERVICE_GROUPS = {};
Object.keys(SERVICE_TYPES).forEach(function(k) {
  var g = SERVICE_TYPES[k].group;
  if (!SERVICE_GROUPS[g]) SERVICE_GROUPS[g] = [];
  SERVICE_GROUPS[g].push(k);
});

// Day display order
var DAY_ORDER = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
var DAY_NAMES = {};
Object.keys(DAY_TYPES).forEach(function(k) { DAY_NAMES[k] = DAY_TYPES[k].label; });

// Enum arrays (for schema generation)
var SERVICE_TYPE_ENUM = Object.keys(SERVICE_TYPES);
var DAY_ENUM = Object.keys(DAY_TYPES);
var LANGUAGE_ENUM = Object.keys(LANGUAGES);

// ── Exports ──
// In the esbuild bundle these become accessible via the module system.
// For Node.js scripts (generate-schema.js), use: var config = require('../src/config.js');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SERVICE_TYPES: SERVICE_TYPES, DAY_TYPES: DAY_TYPES, LANGUAGES: LANGUAGES,
    REGION: REGION, CLERGY_ROLES: CLERGY_ROLES,
    SVC_LABELS: SVC_LABELS, SERVICE_GROUPS: SERVICE_GROUPS,
    DAY_ORDER: DAY_ORDER, DAY_NAMES: DAY_NAMES,
    SERVICE_TYPE_ENUM: SERVICE_TYPE_ENUM, DAY_ENUM: DAY_ENUM, LANGUAGE_ENUM: LANGUAGE_ENUM,
  };
}
```

**Note on exports:** This file uses a CommonJS guard (`if typeof module !== 'undefined'`) so it works both in the esbuild browser bundle AND in Node.js scripts (like `generate-schema.js`). esbuild will tree-shake the CommonJS wrapper out of the browser bundle.

---

## PHASE 3: MODULE EXTRACTION

### Function-to-Module Assignment (complete)

Claude Code should extract functions from the current `index.html` (old repo, dev branch) and place them in the assigned module. The line numbers below reference the OLD `index.html`.

**`src/utils.js` — 24 functions**
Extract from old index.html:
- L895: `displayName`
- L910: `getNow`
- L911: `isEventActive`
- L912: `getNextEventDate`
- L913: `getRemainingDates`
- L914: `getNextDateForDay`
- L923: `fmt12`
- L924: `toMin`
- L927: `getEaster`
- L936: `isLentSeason`
- L947: `getNext` (the main "next occurrence" calculator)
- L985: `hav`
- L986: `getDist`
- L987: `fmtDist`
- L1039: `isVer`
- L1042: `generateICS`
- L1043: `pad`
- L1044: `toICSDate`
- L1694: `svcKey`
- L1881: `cleanNote`
- L1888: `escRe`
- L1999: `makeRangeLabel`
- L3107: `smartDefault`
- L3109: `esc`

**`src/data.js` — 13 functions + global state**
- L904: `loadFav`
- L905: `saveFav`
- L906: `isFav`
- L907: `toggleFav`
- L990: `matchSearch`
- L993: `hasAdv`
- L994: `matchAdv`
- L1021: `filterChurches`
- L1027: `sortChurches`
- L3116: `migrateFavorites`
- L3128-3130: `parishesToChurches` + `isWorship`
- L3177: `processChurches`
- Also manages global state: `allChurches`, `favorites`, `advancedFilters`, `tempAdvanced`, `currentFilter`, `currentSort`, `userLat`, `userLng`, `ycEvents`

**`src/render.js` — 16 functions**
- L995: `renderPills`
- L1101: `renderCards`
- L1174: `renderItem`
- L1247: `getPastor`
- L1253: `openDetail`
- L1303: `isFirstDevotionMass`
- L1368: `closeDetail`
- L1550: `shareParish`
- L1558: `showToast`
- L1564: `getMapsUrl`
- L1569: `getMapsUrlCoords`
- L1574: `toggleAcc`
- L1675: `renderSched`
- L1801: `renderDayGroup`
- L1816: `mergeSameTime`
- L1839: `renderRow`

**`src/events.js` — 13 functions**
- L1063: `addYCToCalendar`
- L1071: `getUpcomingYC`
- L1075: `resolveYC`
- L1079: `fmtYCDate`
- L1087: `renderYCCard`
- L1145: `renderCommunityEvents`
- L1406: `openEventDetail`
- L1379: `closeEventDetail`
- L1530: `downloadEventIcal`
- L1545: `navEventToParish`
- L1657: `addMoreEventToCal`
- L2212: `renderCompactYC`
- L2318: `renderEventsWidget`

**`src/map.js` — 3 functions**
- L2027: `createPinIcon`
- L2040: `initMap`
- L2121: `closeMapPopup`

**`src/readings.js` — 10 functions**
- L2347: `getLiturgicalEvents`
- L2355: `easterOffset`
- L2356: `fixed`
- L2394: `fetchReadings`
- L2450: `renderSaintFromTitle`
- L2491: `renderSaintFallback`
- L2504: `toggleReading`
- L2508: `formatReadingText`
- L2515: `formatPsalm`
- L2538: `formatReading`

**`src/ui.js` — 15 functions**
- L996: `removeAdv`
- L997: `updateMFChip`
- L1000: `openMoreFilters`
- L1001: `closeMoreFilters`
- L1002: `clearAdvancedFilters`
- L1003: `applyAdvancedFilters`
- L1004: `toggleTemp`
- L1005: `renderFiltersBody`
- L1035: `toggleSort`
- L1036: `updateSortLabel`
- L1393: `closeAllPanels`
- L2012: `switchTab`
- L3052: `trapFocus`
- L3064: `releaseFocus`
- L3084: `updateTabIndex`

**`src/saved.js` — 3 functions**
- L2126: `getSavedChurchEvents`
- L2167: `renderSavedEvt`
- L2227: `renderSaved`

**`src/more.js` — 14 functions + DEVOTIONAL_GUIDES data**
- L1575: `web3submit`
- L1584: `expressInterest`
- L1600: `verifyOk`
- L1614: `showCorrectionForm`
- L1616: `selectCorrPill`
- L1617: `submitCorrection`
- L1636: `showMoreCorrection`
- L1637: `selectMoreCorrPill`
- L1638: `submitMoreCorrection`
- L2730: `selectFbType`
- L2735: `submitFeedback`
- L2756: `renderMore`
- L2920: `renderGuide`
- L3270: `dismissMoreInstall`
- Also: `DEVOTIONAL_GUIDES` array (L2563-2727), `CORR_PLACEHOLDERS`, `EVT_TYPES`

**`src/location.js` — 6 functions**
- L2958: `saveLocationCookie`
- L2963: `loadLocationCookie`
- L2972: `requestLocation`
- L2989: `initLocation`
- L3007: `refreshLocation`
- L3019: `refreshApp`

**`src/app.js` — Entry point**
- Imports all modules
- Contains the `init()` function (L3191 from old index.html)
- Registers the service worker
- Binds global event listeners (chip clicks, search input, keyboard shortcuts)
- Calls `init()` on DOMContentLoaded

### Module Communication Pattern

Modules communicate through a shared state object and function imports. The pattern is:

```javascript
// src/data.js exports state and functions
var state = {
  allChurches: [],
  favorites: [],
  userLat: null,
  userLng: null,
  currentFilter: 'all',
  currentSort: 'name',
  ycEvents: [],
  // ... all mutable app state lives here
};

function filterChurches() { /* uses state.allChurches, state.currentFilter */ }
function sortChurches() { /* uses state.allChurches, state.currentSort */ }

// Other modules import state:
// var state = require('./data.js').state;
// state.currentFilter = 'confession';
// filterChurches();
```

**Rule:** Global variables from the old `index.html` (`allChurches`, `favorites`, `userLat`, `userLng`, `currentFilter`, `mapInitialized`, etc.) all move into `state` in `data.js`. Every module that needs state imports it from `data.js`.

### Global Function Exposure

Many functions are called from `onclick` attributes in HTML (e.g., `onclick="openDetail('church-id')"`). esbuild's IIFE bundle doesn't expose functions globally by default. The entry point `app.js` must expose them:

```javascript
// src/app.js — at the bottom, after all imports
// Expose functions that HTML onclick attributes need
window.openDetail = render.openDetail;
window.closeDetail = render.closeDetail;
window.switchTab = ui.switchTab;
window.toggleFav = data.toggleFav;
window.refreshApp = location.refreshApp;
window.openMoreFilters = ui.openMoreFilters;
window.closeMoreFilters = ui.closeMoreFilters;
window.clearAdvancedFilters = ui.clearAdvancedFilters;
window.applyAdvancedFilters = ui.applyAdvancedFilters;
window.toggleSort = ui.toggleSort;
window.closeAllPanels = ui.closeAllPanels;
window.shareParish = render.shareParish;
window.toggleAcc = render.toggleAcc;
window.closeEventDetail = events.closeEventDetail;
window.openEventDetail = events.openEventDetail;
window.downloadEventIcal = events.downloadEventIcal;
window.navEventToParish = events.navEventToParish;
window.addYCToCalendar = events.addYCToCalendar;
window.addMoreEventToCal = events.addMoreEventToCal;
window.selectFbType = more.selectFbType;
window.submitFeedback = more.submitFeedback;
window.showCorrectionForm = more.showCorrectionForm;
window.selectCorrPill = more.selectCorrPill;
window.submitCorrection = more.submitCorrection;
window.showMoreCorrection = more.showMoreCorrection;
window.selectMoreCorrPill = more.selectMoreCorrPill;
window.submitMoreCorrection = more.submitMoreCorrection;
window.expressInterest = more.expressInterest;
window.dismissMoreInstall = more.dismissMoreInstall;
window.toggleReading = readings.toggleReading;
// ... every function referenced in HTML onclick/onsubmit
```

**Claude Code instruction:** When porting functions, search the old `index.html` for every `onclick="functionName(` reference to build the complete window exposure list.

---

## PHASE 4: CSS EXTRACTION

### 4.1 Extract CSS from old `index.html`

The CSS lives between lines 35-676 of the old `index.html` (everything inside `<style>...</style>`).

**Claude Code instruction:**
1. Copy lines 35-676 from old `index.html` into `css/app.css`
2. Keep all CSS custom properties (`:root { ... }`) exactly as-is
3. Keep all media queries exactly as-is
4. The CSS references no external files — it's self-contained
5. Do NOT modify any class names or property values during extraction

### 4.2 CSS for New Features (add to end of `css/app.css`)

Add these new classes for features from the UI Toolkit report:

```css
/* ── Bottom Sheet ── */
.sheet-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity .3s;z-index:1000}
.sheet-overlay.open{opacity:1;pointer-events:auto}
.sheet-panel{position:fixed;bottom:0;left:0;right:0;max-height:70vh;background:var(--color-surface);border-radius:12px 12px 0 0;transform:translateY(100%);transition:transform .3s ease;box-shadow:0 -4px 20px rgba(0,0,0,.12);z-index:1001;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:0 var(--space-5) var(--space-6)}
.sheet-overlay.open .sheet-panel{transform:translateY(0)}
.sheet-handle{width:36px;height:4px;border-radius:2px;background:var(--color-border-light);margin:12px auto}

/* ── Toast ── */
.mf-toast{position:fixed;bottom:calc(80px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%) translateY(20px);opacity:0;background:var(--color-text-primary);color:var(--color-surface);padding:var(--space-3) var(--space-5);border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-medium);box-shadow:0 4px 12px rgba(0,0,0,.15);z-index:999;transition:opacity .3s,transform .3s;pointer-events:none;max-width:calc(100vw - 32px);text-align:center}
.mf-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
```

---

## PHASE 5: HTML SHELL

### 5.1 `index.html`

Extract the HTML structure from the old `index.html`. The new file should contain:

1. **`<head>`** — All meta tags (lines 1-33 of old file), but replace inline `<style>` with `<link rel="stylesheet" href="/css/app.css">` and replace inline `<script>` blocks with `<script src="/dist/app.min.js"></script>`
2. **`<body>`** — All HTML elements (lines 678-889 of old file) exactly as-is
3. **Google Analytics** — Keep the gtag snippet in `<head>` (lines 20-27 of old file)
4. **Leaflet** — Keep the CDN script tags before `app.min.js`
5. **Service worker registration** — Move to end of body or into `app.js`

**Key change:** The `<style>` block (643 lines) is replaced by one `<link>` tag. The `<script>` block (2,394 lines) is replaced by one `<script>` tag. The HTML itself stays identical.

```html
<!-- In <head>, replace <style>...</style> with: -->
<link rel="stylesheet" href="/css/app.css">

<!-- At end of <body>, replace <script>...</script> with: -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js"></script>
<script src="/dist/app.min.js"></script>
```

---

## PHASE 6: SERVICE WORKER

### 6.1 `sw.js`

Update the service worker to cache the new file structure:

```javascript
var CACHE_NAME = 'massfinder-v3_' + '20260315_01';
var SHELL_ASSETS = [
  '/',
  '/index.html',
  '/css/app.css',
  '/dist/app.min.js',
  '/parish_data.json',
  '/events.json',
  '/manifest.json',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Source+Sans+3:wght@400;500;600&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/MarkerCluster.Default.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet.markercluster/1.5.3/leaflet.markercluster.min.js',
];

// NETWORK_ONLY_HOSTS — always bypass cache for these
var NETWORK_ONLY_HOSTS = [
  'massfinder-readings-api.vercel.app',
  'api.web3forms.com',
  'www.googletagmanager.com',
  'www.google-analytics.com',
  'universalis.com',
];

// Install: cache shell assets
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(SHELL_ASSETS); })
  );
  self.skipWaiting();
});

// Activate: delete old caches, notify clients
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      var old = keys.filter(function(k) { return k !== CACHE_NAME; });
      return Promise.all(old.map(function(k) { return caches.delete(k); })).then(function() {
        if (old.length) {
          self.clients.matchAll().then(function(clients) {
            clients.forEach(function(c) { c.postMessage({ type: 'CACHE_UPDATED' }); });
          });
        }
      });
    })
  );
  self.clients.claim();
});

// Fetch: network-only for APIs, stale-while-revalidate for everything else
self.addEventListener('fetch', function(event) {
  var url = new URL(event.request.url);

  // Network-only for API hosts
  if (NETWORK_ONLY_HOSTS.some(function(h) { return url.host === h; })) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Stale-while-revalidate for everything else
  event.respondWith(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.match(event.request).then(function(cached) {
        var fetchPromise = fetch(event.request).then(function(response) {
          if (response.ok) cache.put(event.request, response.clone());
          return response;
        }).catch(function() {
          // Network failed — return cached or offline
          if (cached) return cached;
          return new Response('Offline', { status: 503, statusText: 'Offline' });
        });
        return cached || fetchPromise;
      });
    })
  );
});
```

---

## PHASE 7: SCHEMA GENERATION

### 7.1 `scripts/generate-schema.js`

```javascript
// scripts/generate-schema.js — Generates parish_data.schema.json from config.js
// Run: node scripts/generate-schema.js

var config = require('../src/config.js');
var fs = require('fs');
var path = require('path');

// Load the template schema (hand-authored structure, enums filled by this script)
var templatePath = path.join(__dirname, '..', 'parish_data.schema.template.json');
var outputPath = path.join(__dirname, '..', 'parish_data.schema.json');

// If template exists, use it. Otherwise generate from scratch.
var schema;
if (fs.existsSync(templatePath)) {
  schema = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  // Replace enum placeholders
  schema.definitions.service_type_enum.enum = config.SERVICE_TYPE_ENUM;
  schema.definitions.day_enum.oneOf[0].enum = config.DAY_ENUM;
} else {
  // Generate minimal schema
  console.warn('No template found — generating minimal schema');
  schema = {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "title": "MassFinder Parish Data",
    "type": "object",
    "required": ["metadata", "parishes"],
    "properties": {
      "metadata": { "type": "object" },
      "parishes": { "type": "array", "items": { "type": "object" } },
      "yc_events": { "type": "array" }
    }
  };
}

fs.writeFileSync(outputPath, JSON.stringify(schema, null, 2) + '\n');
console.log('Generated parish_data.schema.json with ' + config.SERVICE_TYPE_ENUM.length + ' service types, ' + config.DAY_ENUM.length + ' day types');
```

**Claude Code instruction:** Copy `parish_data.schema.json` from old repo as `parish_data.schema.template.json`. Replace the hardcoded enum arrays with placeholder comments that `generate-schema.js` fills in. The structural rules (nullable patterns, regex, bounds) stay in the template. Only the enum lists are generated.

---

## PHASE 8: DATA PIPELINE SCRIPTS

### 8.1 `scripts/apply-changes.js`

This closes the broken loop. Reads approved bulletin changes from Supabase, patches `parish_data.json`.

```javascript
// scripts/apply-changes.js
// Reads approved bulletin_changes → patches parish_data.json
// Run: node scripts/apply-changes.js [supabase | path/to/changes.json]

var fs = require('fs');
var path = require('path');

// Load env
var envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(function(line) {
    line = line.trim();
    if (!line || line.startsWith('#')) return;
    var eq = line.indexOf('=');
    if (eq < 0) return;
    if (!process.env[line.slice(0, eq).trim()]) process.env[line.slice(0, eq).trim()] = line.slice(eq + 1).trim();
  });
}

var jsonPath = path.join(__dirname, '..', 'parish_data.json');

function loadJSON() {
  return JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
}

function saveJSON(data) {
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n');
}

function findParishByChurchId(data, churchId) {
  for (var i = 0; i < data.parishes.length; i++) {
    var p = data.parishes[i];
    var locs = p.locations || [];
    for (var j = 0; j < locs.length; j++) {
      if (locs[j].id === churchId) return p;
    }
  }
  return null;
}

async function fetchFromSupabase() {
  var sb = require('@supabase/supabase-js');
  var supabase = sb.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  var res = await supabase.from('bulletin_changes')
    .select('*')
    .eq('status', 'approved')
    .order('created_at');
  if (res.error) throw new Error(res.error.message);
  return res.data || [];
}

async function main() {
  var source = process.argv[2] || 'supabase';
  var changes;

  if (source !== 'supabase' && fs.existsSync(source)) {
    changes = JSON.parse(fs.readFileSync(source, 'utf8'));
    console.log('Loaded ' + changes.length + ' changes from ' + source);
  } else {
    changes = await fetchFromSupabase();
    console.log('Loaded ' + changes.length + ' approved changes from Supabase');
  }

  if (!changes.length) {
    console.log('No changes to apply.');
    return;
  }

  var data = loadJSON();
  var changelog = [];

  changes.forEach(function(ch) {
    var parish = findParishByChurchId(data, ch.church_id);
    if (!parish) {
      console.warn('  SKIP: church ' + ch.church_id + ' not found in JSON');
      return;
    }

    switch (ch.change_type) {
      case 'confirmed':
        // No action — service exists and matches
        break;

      case 'modified':
        if (ch.service_num && ch.field_changed) {
          var svc = parish.services[ch.service_num - 1];
          if (svc) {
            var old = svc[ch.field_changed];
            svc[ch.field_changed] = ch.new_value;
            changelog.push(parish.name + ': ' + ch.field_changed + ' ' + old + ' → ' + ch.new_value);
          }
        }
        break;

      case 'new_service':
        var newSvc = {
          type: ch.service_type,
          day: ch.day || null,
          time: ch.time || null,
          end_time: ch.end_time || null,
          language: ch.language || 'en',
          location_id: ch.church_id,
          notes: ch.notes || null,
        };
        if (ch.seasonal) newSvc.seasonal = { season: ch.seasonal };
        parish.services.push(newSvc);
        changelog.push(parish.name + ': NEW ' + ch.service_type + ' ' + (ch.day || '') + ' ' + (ch.time || ''));
        break;

      case 'not_found':
        if (ch.service_num) {
          var notFoundSvc = parish.services[ch.service_num - 1];
          if (notFoundSvc) {
            notFoundSvc._needs_review = true;
            changelog.push(parish.name + ': NOT FOUND IN BULLETIN — ' + (notFoundSvc.type || ''));
          }
        }
        break;
    }
  });

  // Update metadata
  data.metadata.last_bulletin_sync = new Date().toISOString().slice(0, 10);

  saveJSON(data);
  console.log('\nApplied ' + changelog.length + ' changes:');
  changelog.forEach(function(line) { console.log('  • ' + line); });

  // Mark as applied in Supabase if we fetched from there
  if (source === 'supabase' && changes.length) {
    var sb = require('@supabase/supabase-js');
    var supabase = sb.createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    var ids = changes.map(function(c) { return c.id; });
    await supabase.from('bulletin_changes')
      .update({ status: 'applied', updated_at: new Date().toISOString() })
      .in('id', ids);
    console.log('Marked ' + ids.length + ' changes as applied in Supabase');
  }
}

main().catch(function(err) {
  console.error('Error:', err.message);
  process.exit(1);
});
```

---

## PHASE 9: DOCUMENTATION

### 9.1 `CLAUDE.md`

Update for the new architecture. Include:
- Module structure (which file does what)
- How to add a new service type (edit config.js, run generate-schema)
- How to add a new feature (create src/newfeature.js, import in app.js)
- Build commands
- Data flow diagram
- Config.js as the single source of truth

### 9.2 `FORK_GUIDE.md`

Step-by-step instructions:
1. Fork the repo
2. Edit `src/config.js` → change `REGION` object (name, map center, diocese, states)
3. Replace `parish_data.json` with your data (use template)
4. `npm install && npm run build`
5. Push to GitHub → connect to Vercel → deployed
6. Optional: Set up Supabase for bulletin pipeline

### 9.3 `DATA_STANDARDS.md`

Copy from old repo. Update to reference `config.js` as the canonical type list instead of hardcoded enums.

---

## PHASE 10: VERIFICATION CHECKLIST

Before considering the rebuild complete, verify:

- [ ] `npm run build` produces `dist/app.min.js` without errors
- [ ] `npm run schema` generates `parish_data.schema.json` with correct enums
- [ ] `npm run validate` passes against `parish_data.json`
- [ ] CI workflow passes on push
- [ ] App loads in desktop Chrome incognito (cold start)
- [ ] App loads in desktop Safari
- [ ] App loads in mobile Safari (iPhone)
- [ ] App loads in mobile Chrome (Android)
- [ ] Service worker installs and caches assets
- [ ] Second visit loads from cache (airplane mode test)
- [ ] All 93 parishes render in card list
- [ ] Filter chips work (All, Today, Weekend, Confession, Adoration, Latin, Spanish)
- [ ] Search works (by church name, city, service type)
- [ ] Map view works with markers and clusters
- [ ] Detail panel opens with full service schedule
- [ ] Saved/favorites persist across sessions
- [ ] Daily readings load (readings API)
- [ ] Saint card renders (fallback OK for now, LitCal integration is Phase 4 feature)
- [ ] Devotional guides render with expandable content
- [ ] Events render (YC + community)
- [ ] Feedback form submits (Web3Forms)
- [ ] Correction form submits
- [ ] iCal download works for events
- [ ] Geolocation sorts by distance
- [ ] PWA installs from home screen

---

## PHASE 11: POST-LAUNCH

### 11.1 Domain Switchover (Mike does manually)

1. In Vercel, go to the OLD project → Settings → Domains → Remove the custom domain
2. In Vercel, go to the NEW project → Settings → Domains → Add the custom domain
3. DNS propagates in 0-15 minutes
4. Test: open the domain, verify new version loads
5. Archive the old repo (Settings → Archive)

### 11.2 Bulletin Parser Port

After the core app is live, port the bulletin parser scripts (`scripts/bulletin-parser/`) from the old repo. These scripts are self-contained and don't depend on the frontend architecture. They just need:
- `parish_data.json` (to read current services)
- Supabase connection (to write changes)
- `config.js` (for service type enums — replaces the hardcoded lists in `prompt.js`)

### 11.3 New Features

With the modular architecture in place, add features from the Feature Discovery Report:
- `src/litcal.js` — LitCal API integration (saint card fix)
- `src/bibleget.js` — BibleGet API integration (formatted readings)
- `src/devotions.js` — Rosary guide, stations, novena tracker, CCC bottom sheet
- Each is a new file, imported in `app.js`, with zero changes to existing modules

---

## APPENDIX: KEY CONSTANTS TO VERIFY

When porting, cross-reference these values between old and new:

**PARISH_CHURCH_MAP** (L3113 in old index.html): ~102 entries mapping parish IDs to church IDs. Copy exactly into `config.js` or a separate `data/parish-church-map.json`.

**DEVOTIONAL_GUIDES** (L2563-2727 in old index.html): ~165 lines of HTML content for 11 devotional guides. Copy into `src/more.js` as a data constant.

**Web3Forms access key:** `4f21ef78-9dc3-4f10-b1ad-3cdfad78d55b` (in REGION config)

**Google Analytics ID:** `G-0XWS7YKHED` (in REGION config)

**Service worker cache name format:** `massfinder-v3_YYYYMMDD_NN` — increment on every deploy.
