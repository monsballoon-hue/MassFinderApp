# MassFinder — Claude Code Context

Catholic services directory PWA for the Diocese of Springfield / Western New England.

## Architecture

Vanilla JS PWA, CommonJS modules bundled via esbuild into a single IIFE (`dist/app.min.js`).
No framework, no TypeScript, no JSX. Static site deployed to Vercel.

## Module Structure

| File | Purpose |
|------|---------|
| `src/config.js` | **Single source of truth** — service types, day types, languages, region config, clergy roles |
| `src/utils.js` | 24 pure utility functions (formatting, time logic, day matching) |
| `src/data.js` | Shared state, data operations, PARISH_CHURCH_MAP (~102 entries) |
| `src/render.js` | Card rendering, detail panel |
| `src/events.js` | YC events + community events |
| `src/map.js` | Leaflet map with marker clusters |
| `src/readings.js` | Daily readings, BibleGet integration, liturgical calendar |
| `src/ui.js` | Filter overlay, tab switching, focus management |
| `src/saved.js` | Favorites tab (localStorage) |
| `src/more.js` | More tab — devotional guides, forms, about section |
| `src/location.js` | Geolocation, data fetching |
| `src/app.js` | Entry point — wires all modules, exposes `window.*` functions, registers SW |

## Data Flow

```
parish_data.json (static, 929KB) → fetch at startup → data.js state
events.json (static) → fetch at startup → events.js
config.js enums → generate-schema.js → parish_data.schema.json → AJV validation
bulletin pipeline → Supabase bulletin_changes → apply-changes.js → patches parish_data.json
```

## Build Commands

```bash
npm run build      # esbuild → dist/app.min.js (IIFE, ES2017, minified)
npm run dev        # esbuild watch mode with sourcemaps
npm run schema     # Generate parish_data.schema.json from config.js enums
npm run validate   # AJV validation of parish_data.json against schema
npm run precommit  # build + schema + validate
```

## Key Conventions

- **CommonJS everywhere** — `var X = require('./x'); module.exports = { ... }`
- **No arrow functions** — ES5-style `function` declarations for consistency
- **Config is canonical** — service types, day types, languages all come from `src/config.js`
- **One record per day** — no `weekday`/`daily` consolidation (see DATA_STANDARDS.md)
- **parish_data.json is the source of truth** — Supabase is for the editorial pipeline only, not for serving data to the app

## How to Add a New Service Type

1. Add entry to `SERVICE_TYPES` in `src/config.js` (label, group, icon, seasonal flag)
2. Run `npm run schema` to regenerate `parish_data.schema.json`
3. Run `npm run validate` to confirm data still passes
4. Update rendering logic in `src/render.js` if needed (icon, grouping)

## How to Add a New Feature

1. Create `src/newfeature.js` with CommonJS exports
2. `require()` it in `src/app.js`
3. Wire up DOM event listeners in app.js `init()` or the module's own init
4. `npm run build` to bundle

## External Services

- **Vercel** — static hosting, auto-deploys from GitHub `main` branch
- **Supabase (MassFinderV2)** — editorial pipeline tables (bulletin_changes)
- **massfinder-readings-api.vercel.app** — daily readings API (separate project)
- **Web3Forms** — contact form submissions
- **Leaflet + MarkerCluster** — map rendering (loaded from CDN)

## Files NOT to Modify

- `parish_data.json` — edit via bulletin pipeline or manually, never auto-generate
- `events.json` — edit manually
- `assets/` — icons, rarely change
