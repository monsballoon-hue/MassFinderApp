# MassFinder — Module Map

**27 JS modules in `src/`** → esbuild IIFE → `dist/app.min.js` (~353KB)  
**Last synced from repo:** 2026-03-13

> **Freshness rule:** At the start of each session, run `wc -l src/*.js | sort -rn` to verify. New modules may have been added.

---

## Foundation Layer (no UI rendering)

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `config.js` | 170 | none | Canonical enums: `SVC_LABELS`, `DAY_ORDER`, `DAY_NAMES`, `CLERGY_ROLES`, `FEATURES` flags. |
| `utils.js` | 391 | config | Shared utilities: `fmt12()`, `toMin()`, `getNow()`, `getNext()`, `cleanNote()`, `esc()`, `isVer()`, `getDist()`, `fmtDist()`, `isEventActive()`, `makeRangeLabel()` |
| `data.js` | 234 | config, utils | State management: `state` object, `filterChurches()`, `sortChurches()`, `parishesToChurches()`, `toggleFav()` |
| `haptics.js` | 30 | none | Shared haptic feedback function. |
| `ccc-data.js` | 38 | none | Shared lazy-loader for CCC paragraph data. |
| `prayer-core.js` | 120 | utils | Shared prayer infrastructure: `wakeLock`, `fmtPrayer()`, `crossfade()`, `initSwipe()`, `logCompletion()`, `navHtml()`, `scrollTop()`. Imported by all prayer tool modules. |
| `refs.js` | 77 | none | Renders tappable CCC and Scripture reference spans. `renderRef()`, `initRefTaps()`. |

## Tab Rendering

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `render.js` | 1373 | config, utils, data | **Find tab + Detail panel.** `renderCards()`, `openDetail()`, `closeDetail()`, `renderSched()`, `_getComingUp()`. |
| `saved.js` | 609 | config, utils, data | **Saved tab.** `renderSaved()`, `getTodayServices()`, greeting, today card, your churches, events list. |
| `more.js` | 332 | config, utils, data, devotions, forms | **More tab orchestrator.** `renderMore()`, prayer tools grid, install card, footer. |
| `events.js` | 639 | config, utils, data | Events: `renderCommunityEvents()`, `openEventDetail()`, `renderYCCard()`, `CAT_ICONS`, `CAT_LABELS`. |
| `ui.js` | 337 | config, data, utils | Tab switching, filter chips, search, sort, pull-to-refresh, focus trap. `switchTab()`, `applyQuickFilter()`. |
| `map.js` | 324 | — | Leaflet map: `initMap()`, pin rendering, filter carry-over, dark tiles, saved gold pins. |

## Content / Reader Modules

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `reader.js` | 233 | ui | **Universal overlay manager.** `readerOpen()`, `readerClose()`, `readerBack()`. Navigation stack. All prayer tools and content readers register here. |
| `readings.js` | 885 | utils, config | Daily readings (BibleGet API), liturgical day (LitCal), saint card, season detection, HDO/fasting banners. |
| `bible.js` | 533 | reader | Bible reader: DRB + CPDV, per-book lazy load, cross-references, verse highlighting. |
| `ccc.js` | 448 | utils, ccc-data, reader, microfuzz | CCC reader: 2,865 §§, fuzzy search, section context, accent blockquotes, crossfade nav. |
| `devotions.js` | 306 | — | `DEVOTIONAL_GUIDES` array, `renderGuide()`, term definitions, ref wiring. |

## Prayer Tool Modules

All register with `reader.js`. Share `haptics.js` and `ccc-data.js`.

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `rosary.js` | 540 | utils, haptics, ccc-data, reader | Guided Rosary: set selection, decade-by-decade, bead tracking, mystery cards. |
| `examination.js` | 817 | refs, ui, haptics, ccc-data, reader, utils | Examination of Conscience: section-by-section flow, dot navigation, checklist, confessional summary. |
| `stations.js` | 315 | utils, haptics, reader | Stations of the Cross: 14 stations, meditation + prayer, station-by-station nav. |
| `novena.js` | 367 | utils, haptics, reader | Novena Tracker: 3 novenas, 9-day tracking, progress persistence. |

## Support Modules

| Module | Lines | Imports | Role |
|--------|-------|---------|------|
| `forms.js` | 214 | — | Verification, correction, feedback forms. Web3Forms submission. |
| `location.js` | 133 | — | Geolocation: permission flow, distance calc, watch position. |
| `settings.js` | 218 | — | Settings overlay: dark mode, notifications, about. |
| `install-guide.js` | 335 | — | PWA install guide with platform detection. |
| `explore.js` | 1314 | — | Library/explore module (in development). |
| `app.js` | 1142 | all | **Entry point.** Wires modules, global handlers, SW registration, data loading, initial render. |

## Dependency Rules

- `config.js` and `utils.js` are leaf nodes
- All rendering modules import config + utils + data
- Prayer tools import reader.js (not each other)
- Lazy `require()` calls break circular deps (render.js ↔ events.js)
- `app.js` is the only module that imports everything
