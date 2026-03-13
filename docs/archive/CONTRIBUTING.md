# Contributing to MassFinder

MassFinder is a free Catholic Mass-finder PWA serving 93 parishes across Western New England (MA, CT, VT, NH). This guide covers everything you need to get started as a contributor.

---

## Project Overview

MassFinder is a **vanilla JS progressive web app** built with **CommonJS modules bundled via esbuild** into a single IIFE (`dist/app.min.js`). No framework, no TypeScript, no JSX.

Core files:
- `src/` — 12 CommonJS modules (config, utils, data, render, events, map, readings, ui, saved, more, location, app)
- `index.html` — the public-facing PWA (references `dist/app.min.js`)
- `css/app.css` — all styles
- `parish_data.json` — source of truth (93 parishes, ~1,407 services)
- `events.json` — Young & Catholic and community events (~203 events)
- `sw.js` — service worker for offline support
- `manifest.json` — PWA manifest

Backend:
- **Supabase** — editorial pipeline tables (bulletin_changes)

Hosting is on **Vercel** (free tier, auto-deploys from GitHub `main` branch).

---

## Branches

| Branch | Purpose | Deploys to |
|--------|---------|------------|
| `main` | Production | mass-finder-app.vercel.app |

Work directly on `main` for now. Feature branches welcome for larger changes.

---

## Local Development

```bash
# Clone the repo
git clone https://github.com/monsballoon-hue/MassFinderApp.git
cd MassFinderApp

# Install dependencies
npm install

# Build the bundle
npm run build

# Start esbuild watcher + local server
npm run dev          # watches src/ for changes
npx serve . -l 5500  # serves at http://localhost:5500 (separate terminal)
```

All application code lives in `src/` as CommonJS modules. After editing any `src/*.js` file, esbuild automatically rebuilds `dist/app.min.js`.

---

## Data Model

All parish data lives in `parish_data.json` and is validated against `parish_data.schema.json` on every commit via GitHub Actions. See `DATA_STANDARDS.md` for the complete, authoritative data conventions.

### Key structures

**Parish object:**
- `id` — format: `parish_XXX`
- `name`, `town`, `state`, `zip`
- `locations[]` — one or more worship sites with lat/lng
- `services[]` — Mass times, confession, adoration, devotions, etc.
- `clergy[]` — lead priest + one deacon (uses `role` field, not `title`)
- `contact` — phone, email, website, social links
- `validation` — status, last_checked, bulletin_date

**Service object:**
- `type` — one of 24 enum values (see DATA_STANDARDS.md for full list)
- `day` — e.g. `sunday`, `monday`, `weekday`, `first_friday`, `holyday` (singular `weekday`, never `weekdays`)
- `time` — 24hr format `HH:MM`
- `language` — default `en`, also `es`, `pl`, `la`, `pt`, `fr`, `vi`
- `languages` — array for bilingual services: `["es", "en"]`
- `seasonal` — object: `{ is_seasonal: true, season: "lent" }`. Default: `year_round`. Seasonal values: `lent`, `advent`, `holy_week`, `easter_season`, `academic_year`, `summer`
- `recurrence` — for nth-week patterns: `{ type: "nth", week: 2 }` or `{ type: "nth", weeks: [1, 3] }`

### Validation

The GitHub Actions workflow validates every commit to `main`:
- JSON schema validation via `ajv-cli`
- Blocks deployment if validation fails
- Check `.github/workflows/validate.yml` for details

---

## Making Changes

### Updating parish data
1. Open `admin.html` in a browser, log in
2. Find the parish, edit its services/contact/etc.
3. Download the updated JSON
4. Commit to `dev`, push, verify the preview deployment
5. Open a PR to `main`

### Updating the app
1. Edit the relevant module in `src/`
2. Run `npm run dev` for auto-rebuild on change
3. Test locally with `npx serve .`
4. Push to `main` — Vercel auto-deploys

### Adding events (events.json)
Events follow the conventions in `DATA_STANDARDS.md`. Each event needs:
- `id` — format: `parish_XXX-evt-slug` or `yc-YYYY-MM-DD-shortcode`
- `category` — `yc`, `community`, `social`, `fellowship`, `educational`, `liturgical`, `devotional`, `volunteering`
- `parish_id` — must match an existing parish (or `null` for regional events)
- At least one of: `date`, `dates`, or `day`
- `title`, `time`

---

## File Map

```
MassFinderApp/
  index.html                    # Main PWA (references dist/app.min.js)
  css/app.css                   # All styles
  dist/app.min.js               # Bundled output (esbuild, do not edit)
  src/                          # Source modules (CommonJS)
    app.js                      # Entry point — wires modules, exposes window.*
    config.js                   # Service types, day types, languages, region config
    utils.js                    # Pure utility functions
    data.js                     # Shared state, data operations
    render.js                   # Card rendering, detail panel
    events.js                   # YC events + community events
    map.js                      # Leaflet map with marker clusters
    readings.js                 # Daily readings, BibleGet, liturgical calendar
    ui.js                       # Filter overlay, tab switching
    saved.js                    # Favorites tab
    more.js                     # More tab — devotional guides, forms
    location.js                 # Geolocation, data fetching
    ccc.js                      # Catechism bottom sheet
  parish_data.json              # All parish data (source of truth)
  parish_data.schema.json       # JSON Schema for validation
  events.json                   # YC & community events
  sw.js                         # Service worker
  manifest.json                 # PWA manifest
  CLAUDE.md                     # Project context for AI assistants
  docs/                         # All documentation (DATA_STANDARDS, FORK_GUIDE, etc.)
  scripts/
    build.js                    # esbuild bundler config
    generate-schema.js          # Generates schema from config.js enums
    apply-changes.js            # Applies Supabase bulletin changes
```

---

## External Services

| Service | What it does | Credentials needed |
|---------|-------------|-------------------|
| Vercel | Hosts the PWA (auto-deploys from `main`) | Vercel account access |
| Supabase | Editorial pipeline tables | Credentials in `.env.local` |
| Web3Forms | Contact/correction form submissions | API key in `src/more.js` |
| Google Analytics | Usage tracking | GA tag in `index.html` |
| Leaflet + MarkerCluster | Map rendering | Loaded from CDN |

---

## Code Style

- **CommonJS modules** — `var X = require('./x'); module.exports = { ... }`
- **No arrow functions** — ES5-style `function` declarations for consistency
- CSS in `css/app.css` — use CSS custom properties for all colors, spacing, typography
- Prefer concise, readable code over abstraction
- See `docs/STYLE_GUIDE.md` for the full design system

---

## Questions

Check the project documentation:
- `docs/DATA_STANDARDS.md` — authoritative data conventions
- `CLAUDE.md` — project architecture and context

Or reach out to the maintainer.
