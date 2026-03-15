# MassFinder Bulletin Pipeline — Specification

**Last updated:** 2026-03-15
**Status:** Pre-MVP — spot check phase

> This document is the single source of truth for all bulletin pipeline work. It describes what exists, what needs building, how the system works, and the rules that govern it. Read this entire document before writing any pipeline code.

---

## 1. What MassFinder Is

MassFinder is a free, open-source (AGPL-3.0) vanilla JS Progressive Web App that helps Catholics find Mass, Confession, Adoration, and other services across Western New England. It currently tracks 93 parishes, ~1,690 services, and 203 events across Massachusetts, Connecticut, Vermont, and New Hampshire.

**Production repo:** `github.com/monsballoon-hue/MassFinderApp`
**Deploy:** Vercel from `main` branch
**Stack:** Vanilla JS (CommonJS, no arrow functions), esbuild IIFE bundle, Supabase (Postgres + Auth), Vercel serverless functions

This is a personal stewardship project — non-commercial, mission-driven, self-funded by a solo developer working limited evening hours alongside a full-time job and family.

---

## 2. The Problem

The app lives or dies by data accuracy. If someone opens MassFinder, drives to a church for 8:00 AM Mass, and discovers it's actually at 8:30 now — that person never opens the app again.

The current data was created in early March 2026 by manually pasting bulletin contents into Claude and having it format the output into `parish_data.json`. This produced a solid initial dataset, but it is frozen in time. Every week that passes without updating it, it drifts further from reality. 88 parishes × 52 weeks/year = ~4,600 bulletin reviews per year. One person cannot do this manually.

**The pipeline automates the grunt work** — fetching bulletin PDFs, extracting text, identifying changes against the known schedule — and surfaces only the differences for human verification. The AI makes suggestions. A human confirms or rejects every one.

---

## 3. What Exists Today

### In the Production Repo (`MassFinderApp`)

**Data files (the source of truth):**
- `parish_data.json` — 93 parishes, 1,690 services, 129 locations. 91 verified, 2 low-confidence. All data sourced from bulletins in early March 2026. No automated updates have ever been applied.
- `events.json` — 203 events. Static since creation. 46 dates already past as of March 13.
- `src/config.js` — **THE canonical enum definitions.** Service types, day types, languages, seasons, clergy roles. Everything derives from this file.

**Pipeline infrastructure (exists but never used):**
- `scripts/apply-changes.js` — Reads approved `bulletin_changes` from Supabase, patches `parish_data.json`. Has known gaps: no enum validation, no ID generation for new services, incomplete `seasonal` object construction. Needs hardening before use.
- `scripts/enrich-events.js` — Claude API call pattern using native `fetch` (no SDK). Rate limiting, dry-run support, JSON parsing with markdown fence stripping. **This is the established API call pattern for the pipeline.**
- `scripts/generate-schema.js` — Generates `parish_data.schema.json` from `config.js` enums.
- `api/_lib/supabase.js` — Shared Supabase client for Vercel serverless functions.

**Supabase migration (may or may not be applied):**
- `supabase/migrations/20260308000000_initial_schema.sql` — Defines: `churches`, `services`, `events`, `bulletins`, `bulletin_items`, `bulletin_changes`, `parish_profiles`. Before any pipeline work begins, verify these tables exist in Supabase. If not, apply the migration.

**What does NOT exist in the production repo:**
- No bulletin fetching scripts
- No text extraction scripts
- No AI prompt for change detection
- No diff engine
- No parish profiles configuration
- No review interface of any kind
- No bulletin cache management
- No URL audit tooling

### In the Legacy Repo (`MassFinder`, reference only)

Commit `04aad68` contains a working V2 prototype that ran against 53 pilot churches at $1.73 total batch cost with 84% confirmation rate. **This code is reference material, not a codebase to fork.** It was written against a different data model (flat church IDs with a separate `parish_to_church_map.json`) that the production repo does not use.

Key legacy files worth studying for patterns:
- `scripts/bulletin-parser/prompt-v2.js` — The change-detection prompt (single-church + multi-church strategies)
- `scripts/bulletin-parser/index-v2.js` — Batch orchestrator (sequential processing, cost tracking, summary output)
- `scripts/bulletin-parser/fetch-bulletin.js` — Multi-source PDF fetcher (LPi API, church-bulletin.org)
- `scripts/bulletin-parser/extract-text.js` — Ghostscript text extraction + quality assessment
- `scripts/bulletin-parser/load-services.js` — Loads and formats known services for the prompt
- `scripts/bulletin-parser/store-results-v2.js` — Writes results to Supabase
- `scripts/bulletin-parser/diff-engine.js` — Service diffing logic
- `scripts/prep-review.js` — Priority queue scoring for review scheduling
- `scripts/audit-urls.js` — Bulletin URL liveness checker
- `admin.html` — Developer-facing parish data editor (~2,800 lines)

### Known Data Quality Issues

Found during repo analysis (March 13, 2026):

- **13 services in multi-location parishes have no `location_id`:** St. John Paul II Parish (9 unassigned), Our Lady of Hope Parish (1), St. Damien of Molokai Parish (1), St. Ambrose Parish (2). These must be manually attributed to the correct location before the pipeline can process these parishes.
- **2 Saturday Mass edge cases:** Newman Catholic Center has a `sunday_mass` on Saturday at 09:00 (before the 2 PM vigil cutoff). National Shrine of Divine Mercy has a `daily_mass` on Saturday at 14:00 (at the cutoff). Both need review.
- **46 past-date events** in `events.json` as of March 13. Need cleanup.
- **No `bulletin_date` on 27 parishes** — validation metadata gap.

---

## 4. The Data Model

### parish_data.json — The Source of Truth

The production data uses a **parish → locations → services** hierarchy:

```
parish
├── id, name, town, state, status
├── contact { phone, website, emails[], office_hours, ... }
├── bulletin_url
├── validation { status, last_checked, bulletin_date }
├── locations[]
│   ├── id, name, short_name, type, address, city, state, zip, lat, lng
│   └── (type: church | chapel | cathedral | shrine | mission | ...)
└── services[]
    ├── id, type, day, time, end_time, language, notes
    ├── location_id → points to a locations[] entry
    ├── seasonal { is_seasonal, season }
    ├── recurrence { type, week/weeks }
    └── source ("bulletin_YYYY-MM")
```

### The Parish-to-Church Relationship

The pipeline processes bulletins at the **location (church) level**, not the parish level. A multi-site parish like "St. John Paul II Parish" with 3 churches gets 3 separate pipeline runs — one per worship location.

The production repo's `src/data.js` contains a `parishesToChurches()` function that flattens the parish→location hierarchy into a flat church array. The pipeline's service loader must perform a similar flattening: given a `location_id`, find its parent parish, filter services to that location, and format them for the prompt.

**Key rule for multi-location parishes:** Services with a `location_id` belong to that location only. Services without a `location_id` in a multi-location parish are unassigned — they are a data quality issue, not something the pipeline should silently assign.

### Bulletin URL Coverage

| Source | Count | Notes |
|--------|-------|-------|
| parishesonline.com (LPi) | 38 | Reverse-engineered AWS API, largest group |
| church-bulletin.org | 10 | Predictable URL pattern |
| Individual parish websites | 35 | Various formats, many are direct PDF links |
| No bulletin URL | 5 | Low priority, skip for MVP |
| **Total with bulletin URL** | **88** | |

### Canonical Enums (from `src/config.js`)

**Service types:** `sunday_mass`, `daily_mass`, `communion_service`, `confession`, `anointing_of_sick`, `adoration`, `perpetual_adoration`, `holy_hour`, `rosary`, `stations_of_cross`, `divine_mercy`, `miraculous_medal`, `novena`, `devotion`, `vespers`, `gorzkie_zale`, `benediction`, `prayer_group`, `blessing`, `holy_thursday_mass`, `good_friday_service`, `easter_vigil_mass`, `palm_sunday_mass`, `easter_sunday_mass`

**Day values:** `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `weekday`, `daily`, `first_friday`, `first_saturday`, `holyday`, `holyday_eve`, `lent`, `good_friday`, `holy_thursday`, `holy_saturday`, `easter_vigil`, `palm_sunday`, `easter_sunday`, `civil_holiday`

**Seasons:** `year_round`, `lent`, `advent`, `summer`, `winter`, `academic_year`, `easter_season`, `ordinary_time`, `holy_week`

**Languages:** `en`, `es`, `pl`, `pt`, `la`, `fr`, `vi`, `asl`

**All enum validation must check against `config.js` at runtime, not hardcoded lists.** If a value is added to `config.js`, the pipeline must pick it up automatically.

---

## 5. Pipeline Architecture

```
STAGE 1: FETCH                STAGE 2: EXTRACT + DIFF          STAGE 3: REVIEW + APPLY
────────────────────          ───────────────────────           ────────────────────────
fetch-bulletin.js              extract-text.js                   Developer reviews output
├─ LPi API (38 parishes)      ├─ Ghostscript txtwrite            in terminal / JSON file
├─ church-bulletin.org (10)    ├─ Quality assessment                      │
├─ Direct PDF links (35)       └─ Skip if vision_needed           Approve / Reject / Edit
└─ Manual drop folder                                             each change item
        │                      prompt.js + Claude Sonnet                  │
        ▼                      ├─ Known services as context        apply-changes.js
  bulletins-cache/             ├─ Bulletin text                    patches parish_data.json
  {location-id}/               ├─ Single vs multi-church                  │
  {date}.pdf                   │  strategy                         Git commit → deploy
                               └─ Returns structured diff
                                        │
                                   validate.js
                                   ├─ Enum validation
                                   ├─ Time format check
                                   ├─ Location existence check
                                   ├─ Duplicate detection
                                   └─ False-modified filter
                                        │
                                   store-results.js
                                   → Supabase bulletins table
                                   → Supabase bulletin_changes table
```

### The Diff Approach (Critical Design Decision)

Claude is NOT doing blind extraction. The prompt says: "Here are the 17 services we have on file for this church, numbered 1-17. Here is this week's bulletin text. Tell me what changed."

Claude returns:
- `confirmed: [1, 2, 3, 5, 7, ...]` — service numbers that match the bulletin
- `modified: [{service_num: 4, field: "time", old_value: "09:00", new_value: "08:30", confidence: 0.95}]`
- `not_found: [6, 8]` — not in this bulletin (does NOT mean cancelled)
- `new_services: [{type: "stations_of_cross", day: "friday", time: "19:00", ...}]`
- `notices: [{title: "No Daily Mass Monday", details: "Pastor away"}]`

This approach means:
1. Claude has strong priors from the known schedule — reduces hallucination
2. Output is a small diff, not a full extraction — cheaper, easier to review
3. Most weeks, most services are "confirmed" — minimal human review needed
4. Multi-church parishes get special prompts with strict attribution rules

### Why Text-First, Not Vision

The V1 prototype used Claude Vision to parse bulletin page images. It was expensive (~$0.35/church) and unreliable (hallucinated layout details). The V2 approach:
- Ghostscript `txtwrite` extracts text from digitally typeset PDFs at **zero API cost**
- Only scanned-image PDFs (no selectable text) would need vision — and those are flagged for manual review, not auto-parsed
- Cost dropped from ~$0.35 to ~$0.03 per church

**Text-first extraction is the established approach. Do not revert to vision parsing.**

---

## 6. MVP Scope

The MVP pipeline is a **manual CLI tool that the developer runs on his local machine** to process bulletins and review the AI's output. It is NOT automated, NOT web-based, and has NO volunteer-facing UI.

### What MVP Includes

- Fetch bulletin PDFs from LPi, church-bulletin.org, and direct URL sources
- Extract text via Ghostscript
- Diff extracted text against known services using Claude Sonnet
- Validate all AI output against canonical enums from `config.js`
- Store results in Supabase (`bulletins` + `bulletin_changes` tables)
- Output a human-readable summary to terminal
- Developer reviews ALL items (100% human review — no auto-approvals for MVP)
- Apply approved changes to `parish_data.json`

### What MVP Does NOT Include

- Event extraction from bulletins (services only)
- Automated weekly scheduling (manual trigger only)
- Volunteer-facing review portal
- Parish authentication / magic links
- Weekly email notifications
- Accuracy feedback loop
- Vision fallback for scanned PDFs

### MVP Success Criteria

Run the pipeline against 10 parishes. For each:
- The bulletin is fetched successfully
- Text is extracted with acceptable quality
- Claude identifies changes correctly (verified by the developer against the actual bulletin)
- False positives (hallucinated changes) < 5% of total items
- No invalid enum values, malformed times, or wrong location attributions in the output

---

## 7. Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| API client | Native `fetch` | Matches existing `enrich-events.js` pattern. Zero dependencies. |
| Claude model | Sonnet | Accuracy over cost. ~$0.03/church. Budget: <$5/month for all 88 parishes. |
| Text extraction | Ghostscript `txtwrite` | Free, fast, reliable for digitally typeset PDFs. Installed on dev machine. |
| Trigger | Manual CLI | `node scripts/bulletin-pipeline/run.js --church <id>` for single, no flag for all. |
| Storage | Supabase | `bulletins` + `bulletin_changes` tables. Supabase is the editorial pipeline store; `parish_data.json` remains the production source of truth. |
| Review model | 100% human for MVP | Developer reviews every item. No auto-approvals until accuracy is proven over 8+ weeks. |
| Event handling | Deferred | Services only for MVP. Events are harder (one-time, dedup, no clear write path). |
| Scanned PDFs | Skip + flag | If Ghostscript extracts no text, log it and move on. No vision fallback for MVP. |

---

## 8. Data Rules (Non-Negotiable)

These rules must be enforced by the AI prompt, the validation layer, and the apply step. Every test must verify them.

### Service Structure Rules
- **One row per day.** Monday Mass and Tuesday Mass = 2 records. Never consolidate.
- **Every service must have a `location_id`** pointing to a valid entry in the parish's `locations[]`.
- **All times in 24-hour HH:MM format.** "4:00 PM" → "16:00". "Noon" → "12:00".
- **`source` field** must be `"bulletin_YYYY-MM"` format matching the bulletin date.
- **`seasonal` is an object**, not a string: `{ "is_seasonal": false, "season": "year_round" }`.
- **Service IDs** follow the format: `{parish_id}-{type_abbr}-{day_abbr}-{time}-{location_abbr}`.

### Mass Classification Rules
- **Saturday Mass at 2:00 PM or later** → `type: "sunday_mass"` (vigil). `notes: "Vigil Mass"`.
- **Saturday Mass before 2:00 PM** → `type: "daily_mass"`.
- **First Friday / First Saturday Mass** → `type: "daily_mass"`, `day: "first_friday"` or `"first_saturday"`. Never `sunday_mass`.
- **Holy Day of Obligation Mass** → `type: "daily_mass"`, `day: "holyday"` or `"holyday_eve"`. Never `sunday_mass`.

### Devotion & Service Rules
- **Benediction paired with Adoration** → fold into the adoration entry with a note. No separate service.
- **Perpetual Adoration** → ONLY for truly 24/7 chapels. If there are posted hours, use `adoration`.
- **Devotion cycles** → separate entries per devotion (Rosary, Mass, Divine Mercy = 3 entries).
- **"After Mass" Confession** → estimate start time as Mass time + 45 min, add note.

### Multi-Church Parish Rules
- Services must be attributed to the correct location based on the church-specific section of the bulletin, NOT the parish-wide summary.
- If attribution is ambiguous, IGNORE the service (false negative > false positive).
- Never report a new service for a location unless there is clear evidence it belongs there.
- Two-column bulletin layouts: left column → first church, right column → second church.

### Validation Rules (enforced before any DB write)
- `service_type` must be in `config.SERVICE_TYPE_ENUM`
- `day` must be in `config.DAY_ENUM`
- `language` must be in `config.LANGUAGE_ENUM`
- `seasonal.season` must be a valid season value
- `time` and `end_time` must match `/^([01]\d|2[0-3]):[0-5]\d$/`
- `location_id` must exist in the parent parish's `locations[]` array
- New services must not duplicate an existing service (same type + day + time + location_id)
- Modified items where `old_value === new_value` (after whitespace normalization) must be rejected and moved to `confirmed`

---

## 9. Known AI Failure Modes

These were discovered during V1 and V2 testing. The validation layer must guard against all of them:

1. **Hallucinated times** — invents a 7:30 AM Mass that doesn't exist
2. **Merged services** — "Mass at 8 and 10" becomes one entry at "8:10"
3. **Wrong location assignment** — assigns service to Church A when it's at Church B
4. **Phantom seasonal flags** — marks year-round Mass as "lent" because the bulletin is from Lent
5. **Confident extraction of ads as services** — "Join us for coffee after Mass" → new_service
6. **Time format mangling** — "4 PM" → "04:00" instead of "16:00"
7. **Confession range collapse** — "3:00-3:45 PM" → only "15:00", loses end_time
8. **Holy Week / Triduum confusion** — mislabels Easter Vigil as Easter Sunday Mass
9. **Recurring vs one-time confusion** — single Lenten event listed as recurring service
10. **Notes that are actually services** — "Rosary at 6:30 before daily Mass" buried in Mass notes
11. **False "modified" where old === new** — reports a change when values are identical after normalization
12. **Multi-church column misattribution** — two-column bulletin layout, AI assigns left-column services to the right-column church
13. **Language guessing** — assumes English when bulletin is bilingual

---

## 10. File Structure (Target)

All pipeline code lives in `scripts/bulletin-pipeline/` within the production repo:

```
scripts/bulletin-pipeline/
├── run.js                  # CLI entry point and orchestrator
├── fetch-bulletin.js       # Multi-source PDF fetcher
├── extract-text.js         # Ghostscript text extraction + quality assessment
├── load-services.js        # Loads known services from parish_data.json for prompt
├── prompt.js               # Change-detection prompt builder (single + multi-church)
├── validate.js             # Enum, time, location, duplicate validation
├── store-results.js        # Writes validated results to Supabase
├── parish-profiles.json    # Per-church parsing config (skip_pages, notes, etc.)
├── call-claude.js          # Claude API wrapper (native fetch, cost tracking)
└── utils.js                # Shared helpers (JSON parsing, date formatting)
```

Supporting scripts (repo root `scripts/`):
```
scripts/
├── apply-changes.js        # EXISTS — patches parish_data.json from approved changes
├── audit-urls.js           # TO BUILD — checks bulletin URL liveness
├── enrich-events.js        # EXISTS — Claude API pattern reference
└── generate-schema.js      # EXISTS — schema generation from config.js
```

---

## 11. Code Conventions

- **CommonJS everywhere** — `var X = require('./x'); module.exports = { ... }`
- **No arrow functions** — ES5-style `function` declarations
- **Config is canonical** — all enums loaded at runtime from `src/config.js`
- **parish_data.json is the source of truth** — Supabase is editorial pipeline only
- **Native `fetch` for API calls** — no Anthropic SDK. Match the pattern in `scripts/enrich-events.js`.
- **Anthropic API version header:** `'anthropic-version': '2023-06-01'`
- **Model string:** `'claude-sonnet-4-20250514'`
- **Rate limiting:** minimum 500ms delay between API calls
- **Dry-run support:** every script that makes API calls or writes to DB must support `--dry-run`
- **Cost tracking:** every API call logs input/output tokens and calculates cost
- **Fail loud:** if something is wrong, log it clearly with context (parish name, location name, what went wrong). Never silently skip.
- **Defensive JSON parsing:** handle raw JSON, markdown-fenced JSON, and first-{-to-last-} extraction as fallback strategies.

### Environment Variables

```
ANTHROPIC_API_KEY=sk-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
```

Load from `.env.local` in the repo root (gitignored). Pattern: read file, split on `\n`, skip `#` comments, split on first `=`.

---

## 12. Development Plan

### Phase 0: Validate the Foundation (Current Phase)

**Goal:** Confirm the existing data is accurate before building anything on top of it.

- [ ] **Spot check 10 parishes** — pull their current bulletin, compare to `parish_data.json`. Answer: is the data Claude generated in early March still accurate?
- [ ] **Fix 13 unassigned services** in multi-location parishes (manual, no code needed)
- [ ] **Review 2 Saturday Mass edge cases** (Newman Catholic Center, National Shrine)
- [ ] **Verify Supabase tables exist** — check if the migration has been applied. If not, apply it.
- [ ] **Clean up 46 expired events** in `events.json`

### Phase 1: Single-Parish Pipeline Prototype

**Goal:** Process one bulletin end-to-end and prove the diff approach works against the production data model.

- [ ] Build `scripts/bulletin-pipeline/` directory structure
- [ ] Build `fetch-bulletin.js` — start with one LPi parish (known working)
- [ ] Build `extract-text.js` — Ghostscript wrapper with quality assessment
- [ ] Build `load-services.js` — loads services from `parish_data.json` for a given location, numbers them, formats for prompt
- [ ] Build `prompt.js` — port and adapt the V2 change-detection prompt for the production data model
- [ ] Build `call-claude.js` — native fetch wrapper with cost tracking
- [ ] Build `validate.js` — enum, time, location, duplicate checks against `config.js`
- [ ] Build `run.js` — CLI orchestrator for single-parish mode
- [ ] **Test against one LPi parish** — verify output matches manual bulletin review
- [ ] **Test against one multi-church parish** — verify location attribution is correct

### Phase 2: Scale to All Parishes

**Goal:** Process all 88 parishes with bulletin URLs, reliably.

- [ ] Extend `fetch-bulletin.js` for church-bulletin.org and direct URL patterns
- [ ] Build `parish-profiles.json` — per-church config (skip_pages, parsing_notes, etc.)
- [ ] Build `store-results.js` — write validated results to Supabase
- [ ] Build `audit-urls.js` — check which bulletin URLs are alive
- [ ] Add batch mode to `run.js` (process all parishes sequentially)
- [ ] Add bulletin text dedup (hash comparison to skip unchanged bulletins)
- [ ] Add bulletin cache management (rolling 4-week retention)
- [ ] **Run full batch** — measure total cost, error rate, confirmation rate
- [ ] **Harden `apply-changes.js`** — add enum validation, ID generation, proper seasonal objects, source field

### Phase 3: Developer Review Tooling

**Goal:** The developer can efficiently review and approve pipeline output.

- [ ] Build a terminal-based review summary (clear, grouped output)
- [ ] Build local review server (PDF side-by-side with extracted items) — port from legacy
- [ ] Build `not_found` tracking (flag after 3-4 consecutive weeks absent)
- [ ] Accuracy tracking per parish (parish_profiles.last_accuracy_pct)

### Phase 4: Volunteer Review Portal (Future)

**Goal:** Parish volunteers review their own church's data weekly. NOT in MVP scope.

- [ ] Design and build mobile-first review UI
- [ ] Parish authentication (magic link or PIN)
- [ ] Weekly email notifications
- [ ] Approve / Edit / Reject per item

### Phase 5: Automation (Future)

- [ ] Weekly cron trigger (GitHub Actions or Vercel cron)
- [ ] Correction feedback loop into future prompts
- [ ] Alerting on failed fetches, stale data, low accuracy

---

## 13. The `bulletin_items` Table

The Supabase migration defines both `bulletin_items` (from V1, full extraction approach) and `bulletin_changes` (from V2, diff approach). **The pipeline uses `bulletin_changes` only.** The `bulletin_items` table is a V1 artifact and should not be written to. It can be dropped in a future migration cleanup.

---

## 14. Working Protocol

1. **Read before writing.** Before modifying any file, read the current version. Before creating a new script, study the existing patterns in `enrich-events.js` and `apply-changes.js`.
2. **Validate everything.** Every value from AI output must be validated against canonical enums loaded from `config.js` before it touches the database.
3. **Fail loud.** If something is wrong, log it clearly with context. Never silently skip.
4. **Cost-conscious.** Every API call logs its token usage and cost. Target: <$0.05 per church per run.
5. **Defensive parsing.** AI will return garbage sometimes. Strip markdown fences, handle invalid JSON with multiple fallback strategies, validate every field, reject impossible values.
6. **Human-readable output.** Terminal output uses parish/church names, not IDs. Times shown as both 24h and 12h. Service types shown as labels ("Sunday Mass" not "sunday_mass").
7. **Progressive enhancement.** Build the simplest working version first. Single parish before batch. CLI before UI.
8. **Test with real data.** Use actual parish bulletins. The pipeline either works against real-world messiness or it doesn't work.
9. **False positives are worse than false negatives.** A hallucinated Mass time that goes live is catastrophic. A real service that gets missed in one week's bulletin is merely inconvenient — it'll be caught next week.
10. **No auto-approvals for MVP.** Every item — confirmed, modified, new, not_found — passes through the developer's eyes until accuracy is proven.

---

## 15. Reference: Legacy Pipeline Patterns

The legacy repo (`MassFinder`, commit `04aad68`) contains working code that demonstrates the core patterns. Key differences from the production data model that must be adapted:

| Legacy Pattern | Production Adaptation |
|---------------|----------------------|
| Uses `church_id` as primary key everywhere | Production uses `location.id` within a parent parish |
| Requires `parish_to_church_map.json` | Production nests locations under parishes — no separate map needed |
| `load-services.js` uses the map to find parish | New version walks `parish_data.json` directly: find parish containing the location |
| `store-results-v2.js` uses Anthropic SDK for Supabase | Use `@supabase/supabase-js` (already a devDependency) |
| Prompt references `churchName` / `churchTown` | Adapt to use `location.name` / `location.city` from parish data |
| `index-v2.js` uses Anthropic SDK for Claude | Use native `fetch` matching `enrich-events.js` pattern |
| Cost calculation uses Sonnet 3.5 pricing | Update to current Sonnet pricing |

The legacy prompt structure (single-church vs multi-church strategies, numbered service list, task section with output format) is sound and should be preserved in spirit. The output format (confirmed/modified/not_found/new_services/notices) maps directly to the `bulletin_changes` table schema.
