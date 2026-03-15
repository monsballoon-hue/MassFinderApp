# MassFinder Data Standards

This document defines the authoritative conventions for structuring services and events in MassFinder. All data entry (manual or via bulletin pipeline) should follow these rules.

**Canonical type lists live in `src/config.js`** — this document describes *how* to use them, not *what* they are. If this document and `config.js` disagree, `config.js` wins.

---

## Services vs Events

| | Services (`parish_data.json`) | Events (`events.json`) |
|---|---|---|
| **Nature** | Liturgical or devotional offerings | Social, educational, or community happenings |
| **Examples** | Mass, Confession, Adoration, Rosary, Novena | Fish fry, fundraiser, Bible study, retreat, social gathering |
| **Duration** | Ongoing or bounded (with `effective_date` / `end_date`) | Expires after date(s) pass |
| **Tied to** | A parish's worship life | A parish's calendar/bulletin |

**The decisive question is type, not duration.** If the offering has a service type defined in `config.js` (Mass, Confession, Adoration, Novena, Stations of the Cross, etc.), it is a **service** — even if it only runs for a few days. A 9-day novena is a service. A Lenten Stations series is a service. A 40 Hours devotion is a service. These are liturgical offerings with set times at a church, not social happenings.

**Events** are everything else: fish fries, spaghetti suppers, fundraisers, Bible studies, retreats, volunteer drives, youth nights, parish missions by visiting speakers. If it doesn't map to a `SERVICE_TYPES` key in `config.js`, it's an event.

### Bounded Services

Services that run for a limited period use `effective_date` and `end_date` to define their window. They still get a `seasonal` object and follow all other service rules. The frontend should surface these separately from the permanent schedule (e.g., a "Special Services" drawer on the church detail card) so users can discover them without cluttering the regular weekly view.

```json
{
  "type": "novena",
  "time": "17:15",
  "effective_date": "2026-03-16",
  "end_date": "2026-03-24",
  "seasonal": { "is_seasonal": true, "season": "lent" },
  "notes": "St. Francis Novena of Grace. Saturday March 21 at 12:00 noon instead of 5:15 PM.",
  "source": "bulletin_2026-03"
}
```

Common bounded service patterns: parish novenas (9 days), 40 Hours devotion (3 days), Lenten/Advent daily Mass additions, temporary confession schedules during penance services, Triduum-adjacent adoration.

---

## Services (parish_data.json)

### Service Types

Defined in `config.js → SERVICE_TYPES`. Each has a label, group, icon, and seasonal flag. Run `node -e "var c = require('./src/config.js'); Object.keys(c.SERVICE_TYPES).forEach(function(k) { console.log(k + ' → ' + c.SERVICE_TYPES[k].label); })"` to see the full list.

### Day Values

Defined in `config.js → DAY_TYPES`. Includes days of the week plus special values:
- `first_friday` / `first_saturday` — devotional significance (Sacred Heart / Immaculate Heart)
- `holyday` / `holyday_eve` — Holy Day of Obligation
- Triduum days: `holy_thursday`, `good_friday`, `holy_saturday`, `easter_vigil`, `palm_sunday`, `easter_sunday`
- `lent` — Lenten-only services
- `civil_holiday` — holiday schedule

**Deprecated day values** (do not use): `weekday`, `daily`, `first_sunday`, `first_thursday`, `fourth_friday`. Use individual day entries + recurrence instead.

### One Row Per Day — No Consolidation

**Every service occurrence gets its own record.** If a church has Daily Mass Mon–Fri at 8:00 AM, that's 5 records — one per day.

Why: eliminates ambiguity for multi-church parishes, makes AI change detection trivial, allows per-day modifications. The frontend auto-collapses 3+ identical weekday entries into "Mon – Fri" for display.

### First Friday / First Saturday Rules

The `day` field classifies **when** (monthly occurrence). The `type` field classifies **what** (the actual service).

- First Friday Mass → `type: "daily_mass", day: "first_friday"`
- First Saturday Mass → `type: "daily_mass", day: "first_saturday"`
- **Never** use `sunday_mass` for First Saturday Mass

### Saturday Vigil Mass

`type: "sunday_mass"`, `day: "saturday"`, `notes: "Vigil Mass"`

**Cutoff:** Saturday Mass at 4:00 PM or later = vigil (`sunday_mass`). Before 4:00 PM = `daily_mass`.

### Holy Day of Obligation Masses

Use `type: "daily_mass"` with day values `holyday` or `holyday_eve`. Do NOT use `sunday_mass`.

### Recurrence (nth-week patterns)

For services on specific weeks of the month (e.g., "2nd Tuesday"):

```json
{ "day": "tuesday", "recurrence": { "type": "nth", "week": 2 } }
```

Multiple weeks: `"recurrence": { "type": "nth", "weeks": [1, 3] }`

Only `first_friday` and `first_saturday` have dedicated day values. All other nth-week patterns use recurrence.

### Language Tagging

- Single-language: `language: "en"`
- Bilingual: `languages: ["es", "en"]` — array takes precedence over scalar

### Seasonal Values

Every service has `seasonal: { is_seasonal: bool, season: string }`. Valid seasons defined in `config.js`. Default: `{ is_seasonal: false, season: "year_round" }`.

### Location & Address Conventions

- Location address = **church/chapel address** (where services happen), not the office
- Office address belongs in `contact.office_address`
- Multi-location parishes: each location in `locations[]`, every service has `location_id`

### Special Rules

- **Benediction paired with Adoration**: fold into the adoration entry with a note — no separate service
- **Perpetual Adoration**: only for truly 24/7 chapels; if there are posted hours, use `adoration`
- **Devotion cycles**: separate entries per devotion (Rosary, Mass, Divine Mercy = 3 entries)
- **"After Mass" Confession**: estimate start time as Mass + 45 min, add note
- **Communion service / Mass alternating**: communion service as default, Mass with recurrence

### Clergy Conventions

Lead priest + one deacon only. Use `role` field. Valid roles defined in `config.js → CLERGY_ROLES`.

---

## Events (events.json)

### Categories

`yc`, `community`, `social`, `fellowship`, `educational`, `liturgical`, `devotional`, `volunteering`

### Date Fields

Three mutually exclusive scheduling modes:
- **One-time**: `date: "2026-03-15"`
- **Multi-date series**: `dates: ["2026-03-04", "2026-03-11"]`
- **Recurring**: `day: "wednesday"`

Use exactly one. `end_date` can be used with any mode.

### Required Fields

`id`, `title`, `parish_id` (or null for regional), and one of `date`/`dates`/`day`.

### Cross-Parish Events

Events hosted elsewhere: set `parish_id` to host parish. If host isn't in data: `parish_id: null` with `venue_name` + `venue_address`.

---

## ID Conventions

### Service IDs
Format: `{parish_id}-{type_abbr}-{day_abbr}-{time}-{location_abbr}`

### Event IDs
Format: `{parish_id}-evt-{slug}`
