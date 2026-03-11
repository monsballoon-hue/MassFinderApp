# Service Data Enrichment Plan

**Status:** Planning
**Related:** OW-23 (Church Detail Services Restructuring)

## Problem

Multi-site parishes (e.g., St. John Paul II with 3 church buildings) display services without clear location context. Time-range services (adoration, confession, holy hours) often lack `end_time`, making "Coming Up" calculations less accurate.

## Proposed Schema Additions

### 1. `location_name` (string, optional)

Human-readable display name for the service location.

**Current state:** Services have `location_id` (e.g., `"notre-dame-church-adams"`) but no display-friendly name. The detail panel currently derives names from `location_id` via title-casing heuristic.

**Target:** Each service with a `location_id` should also have `location_name`:
```json
{
  "type": "sunday_mass",
  "day": "sunday",
  "time": "09:00",
  "location_id": "notre-dame-church-adams",
  "location_name": "Notre Dame Church"
}
```

**Affected records:** Multi-site parishes only. Estimate ~8-12 parishes, ~200-300 service records.

### 2. `is_primary_site` (boolean, optional)

On parish `locations` array entries. Enables showing "at [secondary site]" labels only when a service is at a non-primary location.

```json
{
  "locations": [
    { "id": "st-thomas-parish", "name": "St. Thomas Church", "is_primary_site": true },
    { "id": "st-mary-chapel", "name": "St. Mary Chapel", "is_primary_site": false }
  ]
}
```

**Benefit:** Reduces noise — single-site parishes and services at the primary site don't need location labels.

### 3. `end_time` backfill (string, optional)

Currently most services lack `end_time`. Time-range services (adoration, confession, holy hours) should have it populated for accurate "live" detection and time-range display.

**Current coverage:**
- Services with `end_time`: ~15% (estimated)
- Services that should have `end_time`: adoration, perpetual_adoration, holy_hour, confession (~25% of all services)

**Priority types for backfill:**
1. `confession` — most common time-range service
2. `adoration` / `perpetual_adoration` — always time-range
3. `holy_hour` — always time-range

### 4. Supabase Alignment

The Supabase editorial pipeline already has `end_time` and `location` columns in `bulletin_changes`. The `apply-changes.js` script should map these to `parish_data.json` during enrichment.

**No Supabase schema changes needed** — only `apply-changes.js` mapping updates.

## Migration Plan

1. **Phase 1 (manual):** Backfill `end_time` for confession/adoration services at top-10 parishes (by usage)
2. **Phase 2 (manual):** Add `location_name` to multi-site parish services
3. **Phase 3 (automated):** Update `apply-changes.js` to write `location_name` and `end_time` from Supabase
4. **Phase 4 (validation):** Add `location_name` and `is_primary_site` to `parish_data.schema.json`

## Records Affected

| Field | Estimated Records | Priority |
|-------|------------------|----------|
| `end_time` backfill | ~400 services | High |
| `location_name` | ~200-300 services | Medium |
| `is_primary_site` | ~20 location entries | Low |

## Notes

- `parish_data.json` is the source of truth — all changes go there first
- Schema validation (`npm run validate`) must pass after any changes
- No breaking changes — all new fields are optional
