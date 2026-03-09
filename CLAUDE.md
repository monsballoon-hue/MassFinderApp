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
- **One record per day** — no `weekday`/`daily` consolidation (see docs/DATA_STANDARDS.md)
- **parish_data.json is the source of truth** — Supabase is for the editorial pipeline only, not for serving data to the app

## Three-Layer Content Stack (Local-First Principle)

Every feature must work from locally cached data. API calls add richness but are never required for a feature to render something useful.

| Layer | Source | Availability |
|-------|--------|-------------|
| 1 — Always present | Inline in bundle (`dist/app.min.js`) | 100% — no network needed |
| 2 — Cached | Static JSON files in repo (`data/`, `parish_data.json`) | After first load — SW cached |
| 3 — Live | External APIs (LitCal, BibleGet, readings API) | Online only — graceful degradation |

**Rule:** When building a new feature, establish Layer 1 or Layer 2 behaviour first. Layer 3 (API) enhances the experience but never gates it. If an API call fails, the feature must still render something from cache.

**Data files** in `data/` are lazy-loaded on first use and SW-cached — not in `SHELL_ASSETS`. Users who never use a feature pay zero download cost.

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

## Documentation Index

| File | Purpose |
|------|---------|
| `CLAUDE.md` | This file — architecture, conventions, build commands (auto-loaded) |
| `docs/DATA_STANDARDS.md` | Authoritative data rules — service types, day values, events |
| `docs/FORK_GUIDE.md` | How to fork and deploy for another diocese |
| `docs/STYLE_GUIDE.md` | Design system — tokens, components, layout rules |
| `docs/TERMINOLOGY.md` | Domain knowledge — liturgical correctness, display names |
| `docs/PERSONAS.md` | User personas (50+, millennial, Gen Z) and UX principles |
| `docs/ANTI_PATTERNS.md` | Known gotchas — SW cache, overlays, Web3Forms |
| `docs/ROADMAP.md` | 6-batch feature plan and long-term vision |
| `docs/INTEGRATIONS.md` | External services — Supabase, Web3Forms, Leaflet, LitCal |
| `docs/DEV_CHEATSHEET.md` | Quick reference for working with Claude Code |
| `docs/CONTRIBUTING.md` | Contributor onboarding — setup, workflow, file map |
| `docs/MassFinder_UX_Vision.md` | Product vision — feed, subscriptions, bulletin aggregation |
| `docs/MassFinder_Feature_Discovery_Report.md` | Feature research — open source repos, build priorities |
| `docs/MassFinder_UI_Toolkit_Report.md` | UI component evaluation — build vs. import decisions |
| `docs/MassFinder_Open_Source_Guide.md` | GitHub community setup — issues, templates, outreach |
| `docs/review/validation-checklist.md` | Per-parish bulletin validation checklist |
