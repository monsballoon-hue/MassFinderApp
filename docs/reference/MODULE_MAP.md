# MassFinder — Module Map

**24 JS modules in `src/`** → esbuild IIFE → `dist/app.min.js` (~221KB)  
**Last synced from repo:** 2026-03-13

> **Freshness rule:** At the start of each session, run `ls -la src/*.js` and `wc -l src/*.js | sort -rn` to verify module list and sizes are current. New modules may have been added.

---

## Foundation Layer (no UI rendering)

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `config.js` | 170 | none | Canonical enums: `SVC_LABELS`, `DAY_ORDER`, `DAY_NAMES`, `CLERGY_ROLES`, `FEATURES` flags. Import this for all label/enum lookups. |
| `utils.js` | 381 | config | Shared utilities: `fmt12()`, `toMin()`, `getNow()`, `getNext()`, `cleanNote()`, `esc()`, `isVer()`, `getDist()`, `fmtDist()`, `isEventActive()`, `makeRangeLabel()`, `stripCCCRefs()` |
| `data.js` | 234 | config, utils | State management: `state` object (allChurches, filteredChurches, favorites, etc.), `filterChurches()`, `sortChurches()`, `parishesToChurches()`, `toggleFav()` |
| `haptics.js` | ~40 | none | Shared haptic feedback function. Single export. |
| `ccc-data.js` | ~40 | none | Shared lazy-loader for CCC paragraph data. Used by examination.js, rosary.js, ccc.js. |
| `refs.js` | ~70 | none | Renders tappable CCC and Scripture reference spans. `renderRef()`, `initRefTaps()`. |

## Tab Rendering

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `render.js` | 1195 | config, utils, data | **Find tab + Detail panel.** `renderCards()`, `openDetail()`, `closeDetail()`, `renderSched()`, `_getComingUp()`. The largest rendering module. |
| `saved.js` | 562 | config, utils, data | **Saved tab.** `renderSaved()`, `getTodayServices()`, greeting, today card, your churches, events list. |
| `more.js` | 269 | config, utils, data, devotions, forms | **More tab orchestrator.** `renderMore()`, prayer tools grid, install card, footer. Triggers readings/litcal fetches. |
| `events.js` | 627 | config, utils, data | Events system: `renderCommunityEvents()` (detail panel), `openEventDetail()`, `renderYCCard()`, `CAT_ICONS`, `CAT_LABELS`, `downloadEventIcal()`. |
| `ui.js` | 337 | config, data, utils | Tab switching, filter chips, search, sort, pull-to-refresh, focus trap, keyboard nav. `switchTab()`, `applyQuickFilter()`, `trapFocus()`. |
| `map.js` | 324 | — | Leaflet map: `initMap()`, pin rendering, filter carry-over, dark tiles, saved gold pins. |

## Content / Reader Modules

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `reader.js` | 218 | ui | **Universal overlay manager.** `readerOpen()`, `readerClose()`, `readerBack()`. Navigation stack enables CCC→Bible→back. All prayer tools and content readers register here. |
| `readings.js` | 883 | utils, config | Daily readings fetch (BibleGet API), liturgical day fetch (LitCal), saint card rendering, season detection, HDO/fasting banners. |
| `bible.js` | 529 | reader | Bible reader module: per-book lazy load, DRB + CPDV, cross-references, verse highlighting. Registers with reader.js. |
| `ccc.js` | 448 | utils, ccc-data, reader, microfuzz | CCC reader: 2,865 §§, fuzzy search, section context, accent blockquotes, "See Also" with crossfade nav. Registers with reader.js. |
| `devotions.js` | 306 | — | `DEVOTIONAL_GUIDES` array (faith guides content), `renderGuide()`, term definitions, Scripture/CCC ref wiring. |

## Prayer Tool Modules

All register with `reader.js` via `reader.registerModule()`. Share `haptics.js` and `ccc-data.js`.

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `rosary.js` | 620 | utils, haptics, ccc-data, reader | Guided Rosary: set selection, decade-by-decade, bead tracking, mystery cards, crossfade transitions. |
| `examination.js` | 628 | refs, ui, haptics, ccc-data, reader, utils | Examination of Conscience: opening prayer, 10 commandments + precepts, interactive checklist, confessional summary, tracker. |
| `stations.js` | 315 | utils, haptics, reader | Stations of the Cross: 14 stations, meditation + prayer cards, V/R formatting, station-by-station nav. |
| `novena.js` | 367 | utils, haptics, reader | Novena Tracker: 3 novenas, 9-day tracking, day-by-day prayer content, progress persistence in localStorage. |

## Support Modules

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `forms.js` | 209 | — | Verification, correction, feedback, interest forms. Web3Forms submission. |
| `location.js` | 133 | — | Geolocation: permission flow, distance calculation, watch position. |
| `settings.js` | 218 | — | Settings overlay: dark mode toggle, notification prefs, about section. |
| `install-guide.js` | 335 | — | PWA install guide overlay with platform detection (iOS/Android/desktop). |
| `explore.js` | 1314 | — | Library/explore module (in development). Bible, CCC, Catholic classics unified interface. |
| `app.js` | 1135 | all | **Entry point.** Wires all modules, global onclick handlers, service worker registration, data loading, initial render. |

## Dependency Rules

- `config.js` and `utils.js` are leaf nodes — they import nothing except config→nothing and utils→config
- All rendering modules import config + utils + data
- Prayer tools import reader.js (not each other)
- Lazy `require()` calls in render.js and saved.js break potential circular deps with events.js
- `app.js` is the only module that imports everything — it's the bundle entry point
