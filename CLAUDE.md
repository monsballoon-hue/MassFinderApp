# MassFinder — Claude Code Context

Catholic services directory PWA for the Diocese of Springfield / Western New England.
**License:** AGPL-3.0-only

## Architecture

Vanilla JS PWA, CommonJS modules bundled via esbuild into a single IIFE (`dist/app.min.js`).
No framework, no TypeScript, no JSX. Static site deployed to Vercel.

## Module Structure (24 modules)

| File | Purpose |
|------|---------|
| `src/config.js` | **Single source of truth** — service types, day types, languages, region config, clergy roles |
| `src/utils.js` | Pure utility functions (formatting, time logic, day matching, CCC ref stripping) |
| `src/data.js` | Shared state, data operations, filter/sort, parish→church flattening |
| `src/render.js` | Card rendering, church detail panel (next-service highlight, CSS grid accordions, schedule rendering) |
| `src/events.js` | YC events + community events, event detail panel |
| `src/map.js` | Leaflet map — filter carry-over, gold saved-church pins, dark tiles, popup save action |
| `src/readings.js` | Daily readings, BibleGet integration, liturgical calendar, saint card |
| `src/ui.js` | Filter overlay, tab switching, focus management, event delegation |
| `src/saved.js` | "Your Parishes" dashboard — Today Card timeline, compact church rows, activity card |
| `src/more.js` | More tab orchestration |
| `src/ccc.js` | Catechism bottom sheet — section context, Georgia serif, accent blockquotes, crossfade nav |
| `src/ccc-data.js` | **Shared CCC data loader** — single fetch, shared across ccc.js, examination.js, rosary.js |
| `src/rosary.js` | Guided rosary — set-color beads, crossfade transitions, manual "Amen" completion |
| `src/examination.js` | Examination of conscience — full-row tap targets, confessional summary, centering prayer |
| `src/stations.js` | Stations of the Cross — guided 14-station devotion |
| `src/novena.js` | Novena tracker — 9-day prayer tracking with persistent state |
| `src/bible.js` | Bible bottom sheet — DRB/CPDV text, verse display, cross-references |
| `src/haptics.js` | **Shared haptic feedback** — vibrate API + iOS switch trick, confirm/error variants |
| `src/devotions.js` | Faith guides — devotional content rendering |
| `src/forms.js` | Feedback, correction, Web3Forms integration |
| `src/refs.js` | Universal reference resolver — tappable CCC/Bible ref spans |
| `src/install-guide.js` | Visual PWA install guide overlay |
| `src/location.js` | Geolocation, cookie persistence, data refresh |
| `src/app.js` | Entry point — wires all modules, window bindings, SW registration, init |

## Data Files

```
parish_data.json       930KB   93 parishes, 1,690 services (fetched at startup)
events.json            113KB   203 events (fetched at startup)
data/catechism.json    1.36MB  2,865 CCC paragraphs + 1,941 xrefs (lazy-loaded)
data/prayers.json      47KB    Rosary mysteries, stations, core prayers (lazy-loaded)
data/examination.json  11KB    10 commandments + precepts + questions (lazy-loaded)
data/bible-drb/        74 books  Douay-Rheims Bible, per-book JSON (lazy-loaded)
data/bible-cpdv/       74 books  Catholic Public Domain Version, per-book JSON (lazy-loaded)
data/bible-xrefs.json  4MB     Cross-reference database (lazy-loaded)
data/lectionary-index.json  22KB  Sunday/weekday lectionary mappings (lazy-loaded)
data/litcal-2026.json  70KB    Pre-built liturgical calendar for 2026 (lazy-loaded)
data/litcal-2027.json  70KB    Pre-built liturgical calendar for 2027 (lazy-loaded)
data/baltimore-catechism.json  48KB  Q&A format catechism (lazy-loaded)
```

**All data/ files are lazy-loaded on first use and SW-cached. Users who never use a feature pay zero download cost.**

## Build Commands

```bash
npm run build      # esbuild → dist/app.min.js (IIFE, ES2017, minified), auto-bumps SW cache
npm run dev        # esbuild watch mode with sourcemaps
npm run schema     # Generate parish_data.schema.json from config.js enums
npm run validate   # AJV validation of parish_data.json against schema
npm run precommit  # build + schema + validate
```

## Build Scripts (data pipeline)

```bash
node scripts/build-catechism.js    # Process CCC source → data/catechism.json
node scripts/build-prayers.js      # Process prayer sources → data/prayers.json
node scripts/build-bible-drb.js    # Process DRB source → data/bible-drb/*.json
node scripts/build-bible-cpdv.js   # Process CPDV source → data/bible-cpdv/*.json
node scripts/build-xrefs.js        # Build cross-reference index → data/bible-xrefs.json
node scripts/build-lectionary.js   # Build lectionary index → data/lectionary-index.json
node scripts/build-litcal.js       # Fetch LitCal API → data/litcal-YYYY.json
node scripts/build-baltimore.js    # Process Baltimore Catechism → data/baltimore-catechism.json
node scripts/enrich-events.js      # Claude-powered event note parsing
node scripts/apply-changes.js      # Apply Supabase bulletin changes to parish_data.json
```

## Key Conventions

- **CommonJS everywhere** — `var X = require('./x'); module.exports = { ... }`
- **No arrow functions in source** — ES5-style `function` declarations for consistency
- **Config is canonical** — service types, day types, languages all come from `src/config.js`
- **parish_data.json is the source of truth** — Supabase is for the editorial pipeline only
- **Shared utilities over duplication** — haptics.js, ccc-data.js, utils.esc() are shared. Never copy-paste utility functions into modules.
- **`--font-prayer`** for all sacred/contemplative text. `--font-display` for headings. `--font-body` for UI.
- **Event delegation** preferred over `onclick=""` strings for new code. Existing window bindings are legacy but functional.
- **Dark mode parity** — every new CSS rule needs a `html[data-theme="dark"]` override if it uses hardcoded colors.
- **Seasonal accent threading** — `--color-accent` shifts with liturgical season (purple in Lent, gold in Ordinary, green in Easter). Use it for accent borders, blockquote tints, and decorative elements.

## Three-Layer Content Stack (Local-First Principle)

| Layer | Source | Availability |
|-------|--------|-------------|
| 1 — Always present | Inline in bundle (`dist/app.min.js`) | 100% — no network needed |
| 2 — Cached | Static JSON files in repo (`data/`, `parish_data.json`) | After first load — SW cached |
| 3 — Live | External APIs (LitCal, BibleGet, readings API) | Online only — graceful degradation |

**Rule:** Layer 2 behaviour first. Layer 3 (API) enhances but never gates. If an API call fails, the feature must render something from cache.

## CSS Design Tokens

```css
--font-display: 'Playfair Display', Georgia, serif;  /* Headings, parish names */
--font-body: 'Source Sans 3', sans-serif;             /* UI text, labels */
--font-prayer: Georgia, 'Playfair Display', serif;    /* Sacred/contemplative text */
--font-heading: 'Playfair Display', Georgia, serif;   /* Alias for display */
--color-primary: #2C3E5A;                             /* Navy — primary actions */
--color-accent: #B8963F;                              /* Gold — seasonal, shifts with liturgical season */
--color-verified: #4A7C59;                            /* Green — confirmation states */
--color-fav: #E11D48;                                 /* Red — favorites/hearts */
```

## Tab Structure

- **Find** — directory + discovery (search → chips → cards, saved churches float to top)
- **Map** — spatial (Leaflet, filter carry-over, gold pins for saved churches)
- **Saved** — "Your Parishes" personal dashboard (today timeline, events, compact church rows, activity)
- **More** — daily formation + tools (saint card, CCC reflection, readings, prayer tools, faith guides)

## External Services

- **Vercel** — static hosting, auto-deploys from GitHub `main` branch
- **Supabase** — editorial pipeline tables (bulletin_changes) — NOT used in client bundle
- **massfinder-readings-api.vercel.app** — daily readings API (separate project)
- **LitCal API v5** — liturgical calendar (Layer 3 enhancement over pre-built litcal-YYYY.json)
- **BibleGet API v3** — verse-by-verse scripture text (Layer 3 enhancement)
- **Web3Forms** — contact/correction form submissions
- **Leaflet + MarkerCluster** — map rendering (loaded from CDN)

## How to Add a New Feature

1. Create `src/newfeature.js` with CommonJS exports
2. Use shared utilities: `require('./haptics.js')`, `require('./ccc-data.js')`, `require('./utils.js').esc`
3. `require()` it in `src/app.js`
4. Wire DOM event listeners — prefer `data-*` attributes + delegation over `onclick=""` strings
5. Add CSS in the appropriate section of `css/app.css` with dark mode overrides
6. `npm run build` to bundle

## Files NOT to Modify Directly

- `parish_data.json` — edit via bulletin pipeline or manually, never auto-generate
- `events.json` — edit manually
- `assets/` — icons, rarely change
- `dist/` — generated by build

## Documentation Index

| File | Purpose | Status |
|------|---------|--------|
| `CLAUDE.md` | This file — architecture, conventions, module map | **Current** |
| `docs/DATA_STANDARDS.md` | Authoritative data rules — service types, day values, events | Current |
| `docs/STYLE_GUIDE.md` | Design system — tokens, components, layout rules | Needs `--font-prayer` addition |
| `docs/TERMINOLOGY.md` | Domain knowledge — liturgical correctness, display names | Current |
| `docs/PERSONAS.md` | User personas (50+, millennial, Gen Z) and UX principles | Current |
| `docs/ANTI_PATTERNS.md` | Known gotchas — SW cache, overlays, Web3Forms | Needs Node v12→v18 update |
| `docs/INTEGRATIONS.md` | External services — Supabase, Web3Forms, Leaflet, LitCal | Needs Bible/litcal additions |
| `docs/CONTRIBUTING.md` | Contributor onboarding — setup, workflow, file map | Current |
| `docs/FORK_GUIDE.md` | How to fork and deploy for another diocese | Current |
| `docs/DEV_CHEATSHEET.md` | Quick reference for working with Claude Code | Current |
| `docs/plans/MassFinder_Master_Feature_Catalog.md` | Master feature catalog — 48 done, 19 open | **Living document** |
