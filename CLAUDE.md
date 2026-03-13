# MassFinder — Claude Code Context

Catholic services directory PWA for the Diocese of Springfield / Western New England.
**License:** AGPL-3.0-only

-----

## Architecture

Vanilla JS PWA, CommonJS modules bundled via esbuild into a single IIFE (`dist/app.min.js`).
No framework, no TypeScript, no JSX. Static site deployed to Vercel.

-----

## Module Structure (26 modules)

|File                  |Purpose                                                                                              |
|----------------------|-----------------------------------------------------------------------------------------------------|
|`src/config.js`       |**Single source of truth** — service types, day types, languages, region config, clergy roles        |
|`src/utils.js`        |Pure utility functions (formatting, time logic, day matching, CCC ref stripping)                     |
|`src/data.js`         |Shared state, data operations, filter/sort, parish→church flattening                                 |
|`src/render.js`       |Card rendering, church detail panel (next-service highlight, CSS grid accordions, schedule rendering)|
|`src/events.js`       |YC events + community events, event detail panel                                                     |
|`src/map.js`          |Leaflet map — filter carry-over, gold saved-church pins, dark tiles, popup save action               |
|`src/readings.js`     |Daily readings, BibleGet integration, liturgical calendar, saint card                                |
|`src/ui.js`           |Filter overlay, tab switching, focus management, event delegation                                    |
|`src/saved.js`        |“Your Parishes” dashboard — Today Card timeline, compact church rows, activity card                  |
|`src/more.js`         |More tab orchestration                                                                               |
|`src/ccc.js`          |Catechism bottom sheet — section context, Georgia serif, accent blockquotes, crossfade nav           |
|`src/ccc-data.js`     |**Shared CCC data loader** — single fetch, shared across ccc.js, examination.js, rosary.js           |
|`src/rosary.js`       |Guided rosary — set-color beads, crossfade transitions, manual “Amen” completion                     |
|`src/examination.js`  |Examination of conscience — full-row tap targets, confessional summary, centering prayer             |
|`src/stations.js`     |Stations of the Cross — guided 14-station devotion                                                   |
|`src/novena.js`       |Novena tracker — 9-day prayer tracking with persistent state                                         |
|`src/bible.js`        |Bible bottom sheet — DRB/CPDV text, verse display, cross-references                                  |
|`src/haptics.js`      |**Shared haptic feedback** — vibrate API + iOS switch trick, confirm/error variants                  |
|`src/devotions.js`    |Faith guides — devotional content rendering                                                          |
|`src/forms.js`        |Feedback, correction, Web3Forms integration                                                          |
|`src/refs.js`         |Universal reference resolver — tappable CCC/Bible ref spans                                          |
|`src/explore.js`      |CCC Explore — deep cross-reference navigation (CCC ↔ Baltimore ↔ Scripture ↔ Lectionary)             |
|`src/settings.js`     |Settings overlay — theme, text size, notifications, prayer prefs, privacy controls                   |
|`src/install-guide.js`|Visual PWA install guide overlay                                                                     |
|`src/location.js`     |Geolocation, cookie persistence, data refresh                                                        |
|`src/app.js`          |Entry point — wires all modules, window bindings, SW registration, init                              |

-----

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
data/summa-daily.json  300KB   366 curated Summa Theologica articles (lazy-loaded)
```

**All data/ files are lazy-loaded on first use and SW-cached. Users who never use a feature pay zero download cost.**

-----

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
node scripts/build-summa.js        # Fetch Summa Theologica → data/summa-daily.json (366 articles)
node scripts/enrich-events.js      # Claude-powered event note parsing
node scripts/apply-changes.js      # Apply Supabase bulletin changes to parish_data.json
```

-----

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
- **SVG only** — no emoji or decorative icon fonts anywhere in the UI.
- **Haptic feedback** — call `haptics.confirm()` or `haptics.error()` on all interactive touch actions.
- **Privacy-first** — examination items, personal notes, and streak data stay in memory or localStorage only. Never POST this data anywhere.
- **Local-first** — every feature must render something useful from cached data. APIs enhance; they never gate.

-----

## Three-Layer Content Stack (Local-First Principle)

|Layer             |Source                                                 |Availability                      |
|------------------|-------------------------------------------------------|----------------------------------|
|1 — Always present|Inline in bundle (`dist/app.min.js`)                   |100% — no network needed          |
|2 — Cached        |Static JSON files in repo (`data/`, `parish_data.json`)|After first load — SW cached      |
|3 — Live          |External APIs (LitCal, BibleGet, readings API)         |Online only — graceful degradation|

**Rule:** Layer 2 behaviour first. Layer 3 (API) enhances but never gates. If an API call fails, the feature must render something from cache.

-----

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

-----

## Tab Structure

- **Find** — directory + discovery (search → chips → cards, saved churches float to top)
- **Map** — spatial (Leaflet, filter carry-over, gold pins for saved churches)
- **Saved** — “Your Parishes” personal dashboard (today timeline, events, compact church rows, activity)
- **More** — daily formation + tools (saint card, CCC reflection, readings, prayer tools, faith guides)

-----

## External Services

- **Vercel** — static hosting, auto-deploys from GitHub `main` branch (production), `dev` branch (preview)
- **Supabase** — editorial pipeline tables (bulletin_changes) — NOT used in client bundle
- **massfinder-readings-api.vercel.app** — daily readings API (separate project)
- **LitCal API v5** — liturgical calendar (Layer 3 enhancement over pre-built litcal-YYYY.json)
- **BibleGet API v3** — verse-by-verse scripture text (Layer 3 enhancement)
- **Web3Forms** — contact/correction form submissions
- **Leaflet + MarkerCluster** — map rendering (loaded from CDN)

-----

## Branch Strategy

- **`main`** — production branch. Never commit directly. All changes arrive via pull request from `dev`.
- **`dev`** — active development branch. All implementation work happens here. Vercel deploys `dev` to a stable preview URL for QA testing on device.
- **Hotfixes** — if a critical production fix must bypass `dev`, commit to `main` directly and immediately merge `main` back into `dev` to prevent drift.

**Do not push implementation work to `main` directly.** All `git push` commands in a normal session target `dev`.

-----

## How to Add a New Feature

1. Confirm you are on the `dev` branch: `git branch`
1. Create `src/newfeature.js` with CommonJS exports
1. Use shared utilities: `require('./haptics.js')`, `require('./ccc-data.js')`, `require('./utils.js').esc`
1. `require()` it in `src/app.js`
1. Wire DOM event listeners — prefer `data-*` attributes + delegation over `onclick=""` strings
1. Add CSS in the appropriate section of `css/app.css` with dark mode overrides
1. `npm run build` to bundle
1. Follow the Post-Implementation Protocol below

-----

## Files NOT to Modify Directly

- `parish_data.json` — edit via bulletin pipeline or manually, never auto-generate
- `events.json` — edit manually
- `assets/` — icons, rarely change
- `dist/` — generated by build, never hand-edit

-----

## Spec Sheet System

All planned work is tracked via two living documents:

- **`BACKLOG.md`** (repo root) — the master backlog. Every discrete item has an `IDEA-NNN` ID, a category, a status, and relationship links to other items. New entries are added by the Inbox project (Claude.ai) and pushed to main. Status updates (done/deferred) are made by Claude Code on working branches and merge to main via PR. Do not restructure or reformat this file — append and update only.
- **`docs/plans/`** — implementation-ready spec sheets produced by the UX & Design project. Each spec file is named `UX_Spec_[Name].md`. Each item has a 3-letter prefix + 2-digit ID (e.g., CDC-01, PTR-03). Specs reference `IDEA-NNN` backlog items where applicable.

**When starting a session:** The developer will tell you which spec file to read and which item IDs to implement. Read the full spec file before touching any code. If items have dependencies on other items in the spec, implement prerequisites first.

**When finishing a session:** Follow the Post-Implementation Protocol below — this is not optional and does not require prompting.

-----

## Post-Implementation Protocol

**These steps are mandatory after every spec implementation session, without exception. Execute them automatically — do not wait to be asked.**

This protocol exists because the developer works async in short sessions and often reviews work hours or days later. The spec sheets and `BACKLOG.md` are the shared memory of what was done and why. Keeping them current is as important as the implementation itself.

-----

### Step 1 — Update the Spec Sheet

Open the spec file you worked from (e.g., `docs/plans/UX_Spec_[Name].md`).

For **every item you implemented**, append an implementation notes block directly below that item’s spec content. Do not delete the original spec content — add the notes block beneath it.

```markdown
### Implementation Notes
- **Date:** YYYY-MM-DD
- **Status:** done
- **Files changed:** [list each file and briefly describe what changed — e.g., "src/rosary.js — added cancel on tab switch", "css/app.css lines 1204–1218 — button alignment fix"]
- **Approach:** [2–4 sentences describing how you implemented it, what key decisions were made, and why. Be specific enough that a future session can understand the shape of the solution without re-reading the code.]
- **Deviations from spec:** [Any places you had to do something different than described, and why. Write "None" if you followed the spec exactly.]
- **Known issues:** [Anything observed during implementation that may need follow-up — edge cases, browser-specific behavior, interactions with other modules. Write "None observed" if clean.]
- **Follow-up suggestions:** [Optional — anything worth logging as a new IDEA, e.g. "Consider extracting the cancel logic into a shared utility." Omit this line if nothing to add.]
```

For items that were **skipped** (excluded by developer instruction this session):

```markdown
### Implementation Notes
- **Status:** skipped — excluded by developer request this session
```

For items that were **blocked** (could not be completed due to a dependency, missing data, or unresolvable error):

```markdown
### Implementation Notes
- **Status:** blocked
- **Reason:** [What prevented completion — be specific]
- **What is needed to unblock:** [Concrete next step before this can proceed]
```

After writing notes for all items, update the **header status summary** at the top of the spec file to reflect the new statuses of all items. The header should have a line for each item: ID, title, and current status (open / in-progress / done / blocked / skipped / deferred).

-----

### Step 2 — Update BACKLOG.md

Open `BACKLOG.md` in the repo root.

For **every `IDEA-NNN` that corresponds to a spec item you just implemented**:

1. Change `**Status:**` to `done`
1. Append a one-line note at the end of that item’s description block:
   
   ```
   **Implemented:** YYYY-MM-DD via [spec ID, e.g. CDC-01] — [one sentence describing what was done]
   ```

For any IDEA items that were **skipped or blocked**, update their status to `deferred` and add:

```
**Deferred:** YYYY-MM-DD — [brief reason]
```

Do not restructure, reorder, or reformat any other part of `BACKLOG.md`. Append and update in place only. The Inbox project maintains this file and any structural changes will break that workflow.

-----

### Step 2b — Update COMPLETED_SPECS.md

Open `docs/reference/COMPLETED_SPECS.md`.

For each spec item you implemented, change `| Queued |` to `| Done |` in the status column. If all items in a spec series are Done, update the series status line from `Ready for implementation` to `Implemented`.

-----

### Step 3 — Build

Run the full build to confirm no regressions were introduced:

```bash
npm run build
```

**If the build fails:** Do NOT proceed to commit. Attempt to fix the issue. If it cannot be resolved in a reasonable number of attempts, revert the breaking change (`git checkout -- <file>`), note the failure in that item’s spec implementation notes with a clear description of what went wrong and what was tried, then continue to Step 4 with the remaining clean work. Make it explicit in the commit message that one item was reverted due to a build failure.

**If the build passes:** Continue to Step 4.

-----

### Step 4 — Commit and Push

Stage all changed files — source files, spec status docs, and `BACKLOG.md`:

```bash
git add -A
```

Write a commit message using this format:

```
<type>: <brief description> [<spec IDs, e.g. CDC-01,02,03>]

- CDC-01: <one line describing what was done>
- CDC-02: <one line describing what was done>
- CDC-03: <one line describing what was done>

BACKLOG.md and COMPLETED_SPECS.md updated.
```

**Commit type prefixes:**

- `feat:` — new user-facing behavior or capability
- `fix:` — corrects broken or wrong behavior
- `chore:` — infrastructure, documentation, data pipeline — no user-facing change
- `refactor:` — internal restructuring with no behavior change
- `style:` — CSS/visual changes only, no logic change

Then push to the current branch:

```bash
git push
```

**Verify the branch before pushing.** In a normal working session this will be `dev`. Do not push to `main` directly unless the developer has explicitly instructed it for a specific hotfix.

-----

### Step 5 — Session Summary

After pushing, output a session summary in this format. Write it clearly and completely — this is what the developer reads when they return to the keyboard.

```
## Session Complete ✓

**Branch:** [branch name]
**Spec file:** [filename]
**Build:** passed ✓ / FAILED ✗
**Pushed:** yes / no

### Items Implemented
- [ID]-A — [title] ✓
- [ID]-B — [title] ✓

### Items Skipped
- [ID]-C — [title] (excluded by request)

### Items Blocked
- [ID]-D — [title] ✗ — [one sentence reason]

### Files Changed
[list each file modified]

### Action Required From You
[List anything the developer needs to do, check, decide, or test before this work is considered complete.
Be specific — name the item, the platform, or the edge case.
Examples:
  "Test [ID]-A on iOS Safari — speechSynthesis cancel behavior may differ from Chrome"
  "[ID]-D is blocked — the back-navigation strategy needs to be decided first (see IDEA-029)"
  "Nothing — all clear."]
```

-----

### Standing Pre-Approvals

The developer has permanently pre-approved the following actions for every session. You do not need to request confirmation before doing any of these:

- Running `npm run build`
- Editing `BACKLOG.md` to update statuses and append implementation notes
- Editing any spec file in `docs/plans/` to append implementation notes and update the status summary
- Editing `docs/reference/COMPLETED_SPECS.md` to mark spec items as Done
- Running `git add -A`, `git commit`, and `git push` to the current working branch after a successful build
- Reading any file in the repo to inform implementation decisions

The only hard stop is a **failed build** — do not commit until it is resolved or the breaking change is reverted and noted.

-----

## Documentation Index

|File                                             |Purpose                                                             |Status                        |
|-------------------------------------------------|--------------------------------------------------------------------|------------------------------|
|`CLAUDE.md`                                      |This file — architecture, conventions, module map, workflow protocol|**Current**                   |
|`BACKLOG.md`                                     |Living backlog — master source of all planned work                  |**Living document**           |
|`docs/plans/`                                    |Spec sheets: 4 UX specs (implemented) + 4 feature specs (planned)   |**Living documents**          |
|`docs/reference/COMPLETED_SPECS.md`              |Spec status tracking — which items are Done vs Queued               |**Living document**           |
|`docs/reference/PROJECT_CONTEXT.md`              |Architecture overview for Claude Projects                           |Current                       |
|`docs/reference/MODULE_MAP.md`                   |Module dependencies and line counts                                 |Current                       |
|`docs/reference/DESIGN_TOKENS.md`                |CSS design tokens and visual system reference                       |Current                       |
|`docs/reference/DATA_SCHEMA.md`                  |parish_data.json and events.json schema docs                        |Current                       |
|`docs/DATA_STANDARDS.md`                         |Authoritative data rules — service types, day values, events        |Current                       |
|`docs/STYLE_GUIDE.md`                            |Design system — tokens, components, layout rules                    |Current                       |
|`docs/TERMINOLOGY.md`                            |Domain knowledge — liturgical correctness, display names            |Current                       |
|`docs/ANTI_PATTERNS.md`                          |Known gotchas — SW cache, overlays, Web3Forms                       |Current                       |
|`docs/INTEGRATIONS.md`                           |External services — Supabase, Web3Forms, Leaflet, LitCal            |Current                       |
|`docs/FORK_GUIDE.md`                             |How to fork and deploy for another diocese                          |Current                       |
|`CONTRIBUTING.md`                                |Contributor quick-start (root level)                                |Current                       |
|`docs/review/validation-checklist.md`            |Per-parish data validation runbook                                  |Current                       |
|`docs/archive/`                                  |Archived docs, old specs, superseded plans                          |Reference only                |