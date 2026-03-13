# MassFinder — Data Schema Reference

**Data files:** `parish_data.json` (930KB) · `events.json` (113KB)  
**Last synced from repo:** 2026-03-13

> **Freshness rule:** At the start of each session, run the field population checks below to verify counts are current.

---

## parish_data.json

**Top-level:** `{ metadata, parishes[], yc_events[] }`  
**Parish count:** 93  
**Total services:** 1,690 across all parishes  
**Verified:** 91

### Parish Object

```
{
  id, name, town, state, zip, established, is_mission, mission_of,
  status, locations[], contact{}, staff[], services[], validation{},
  county, clergy[], bulletin_url, is_accessible
}
```

### Location Object (within `locations[]`)

```
{
  id, name, short_name, type, address, city, state, zip,
  lat, lng, is_accessible
}
```

`type`: church | chapel | mission | shrine | cathedral | oratory | office | hall

### Contact Object

```
{
  phone, emails[], website, office_hours, phone_secondary,
  office_address, instagram, facebook, notes
}
```

**Field population (93 parishes):**
| Field | Count | % |
|-------|-------|---|
| phone | 93 | 100% |
| website | 88 | 95% |
| bulletin_url | 88 | 95% |
| office_hours | 81 | 87% |
| emails | 81 | 87% |
| facebook | 17 | 18% |
| instagram | 7 | 8% |

**Address data:** 117/129 locations have full addresses (include city/state/zip). 12 have street-only.

### Service Object

```
{
  type, day, time, end_time, language, rite, notes, location_id,
  seasonal{}, recurrence{}, status, effective_date, end_date, times_vary
}
```

**Service types (1,690 total):**
| Type | Count | % with end_time |
|------|-------|----------------|
| daily_mass | 547 | 0% |
| sunday_mass | 331 | 0% |
| confession | 245 | 72% |
| adoration | 164 | 83% |
| rosary | 134 | 14% |
| stations_of_cross | 84 | 5% |
| divine_mercy | 33 | 27% |
| devotion | 21 | 14% |
| communion_service | 11 | 0% |
| perpetual_adoration | 7 | 100% |
| holy_hour | 8 | 75% |
| + 14 other types | ~105 | varies |

**Day values:** sunday, monday, ..., saturday, weekday, daily, first_friday, first_saturday, first_sunday, first_thursday, holyday, holyday_eve, civil_holiday

### Flattening

`data.js` `parishesToChurches()` flattens the parish→location→service hierarchy into a flat church array. Contact fields are hoisted from `parish.contact` onto each church. Services are filtered by location for multi-location parishes.

---

## events.json

**Top-level:** `{ metadata, events[] }`  
**Event count:** 203

### Event Object

```
{
  id, category, title, date, day, time, end_time, type,
  parish_id, location_id, service_id, social, notes, description,
  image_url, flyer_url, registration_url, contact_name, contact_email,
  venue_name, venue_address, venue_lat, venue_lng, tags,
  frequency, recurrence{}, seasonal{}, end_date, dates[]
}
```

### Categories (203 events)

| Category | Count |
|----------|-------|
| social | 35 |
| liturgical | 34 |
| educational | 33 |
| devotional | 32 |
| community | 28 |
| fellowship | 20 |
| yc (Young & Catholic) | 16 |
| volunteering | 5 |

### Field Population

| Field | Populated | Notes |
|-------|-----------|-------|
| notes | 176/203 (87%) | Primary description field |
| venue_name | 108/203 (53%) | |
| description | 54/203 (27%) | When present, replaces notes in detail view |
| dates[] | 20/203 (10%) | Multi-date series |
| tags | 16/203 (8%) | YC events only |
| contact_name | 15/203 (7%) | |
| contact_email | 6/203 (3%) | |
| image_url | 0/203 (0%) | Not yet populated |
| flyer_url | 0/203 (0%) | Not yet populated |
| registration_url | 0/203 (0%) | Not yet populated |

### Known Data Quality Issues

- **17 events** have notes that duplicate the title verbatim
- **Some events** have the full schedule description in the title field (e.g., "Lenten Retreat: 5pm Confession, 6pm Mass, reflection until 8pm. Fr. Paul with Deacon Kevin.")
- **Duplicate entries** exist for some recurring events at the same parish

---

## Verification Commands

Run these to check current counts:

```bash
# Parish and service counts
python3 -c "
import json
with open('parish_data.json') as f: d = json.load(f)
p = d['parishes']
svcs = sum(len(x.get('services',[])) for x in p)
print(f'Parishes: {len(p)}, Services: {svcs}')
"

# Event counts by category
python3 -c "
import json
from collections import Counter
with open('events.json') as f: d = json.load(f)
cats = Counter(e.get('category','') for e in d['events'])
print(f'Events: {len(d[\"events\"])}')
for k,v in cats.most_common(): print(f'  {k}: {v}')
"
```
