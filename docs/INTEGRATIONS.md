# MassFinder External Services & Integrations

---

## Supabase (Database & API)

**Project:** `mgbhmwnaipopdctbihmf.supabase.co`
**Credentials:** `.env.local` (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY)

### Tables

| Table | Purpose |
|-------|---------|
| `churches` | Worship locations (119 rows) — name, address, lat/lng, parish_id |
| `services` | Mass times, confession, adoration, devotions (~1,407 rows) |
| `events` | Community events, YC events (~203 rows) |
| `bulletin_items` | Parsed bulletin data (status: pending/flagged/approved/rejected) |

### API Pagination

Supabase caps at **1000 rows per request**. The services table exceeds this, so the frontend uses **range-based pagination** with two parallel requests:
- Request 1: rows 0-999
- Request 2: rows 1000+

### Client Usage

```javascript
const { data } = await supabase
  .from('services')
  .select('*')
  .range(0, 999);
```

---

## Anthropic Claude API (Bulletin Parsing)

**Model:** Claude Sonnet (vision capability)
**Credentials:** `scripts/bulletin-parser/config.js`
**Cost:** ~$0.02-0.06 per bulletin page

Used by the bulletin parsing pipeline to extract structured data from bulletin PDF page images. The prompt (`scripts/bulletin-parser/prompt.js`) contains Catholic-specific taxonomy with 23 service categories and detailed classification rules.

---

## Web3Forms (Contact/Correction Forms)

**Endpoint:** `https://api.web3forms.com/submit`
**API Key:** `3d503d58-e668-4ef8-81ff-70ad5ec3ecf6`
**Submissions route to:** `massfinderapp@gmail.com`

### Request Format

```javascript
const body = {
  access_key: '3d503d58-e668-4ef8-81ff-70ad5ec3ecf6',
  to: 'massfinderapp@gmail.com',    // REQUIRED — explicit recipient
  subject: 'MassFinder: ...',        // Descriptive subject line
  feedback_type: 'correction',       // NOT "type" — see gotcha below
  // ... other fields
};

fetch('https://api.web3forms.com/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});
```

### Gotchas

1. **`to:` field is REQUIRED in every POST payload.** Relying solely on the access key's registered email causes silent delivery failures.
2. **The field name `type` is RESERVED by Web3Forms API.** Use `feedback_type` instead. Using `type` silently overwrites an internal Web3Forms field.
3. **No file uploads.** Web3Forms free tier doesn't support attachments.
4. **Rate limits:** generous for the volume MassFinder generates, but don't submit in a loop.

### Current Forms

| Form | Location | Fields |
|------|----------|--------|
| Parish verification ("Looks good") | Detail panel → verify prompt | parish_id, parish_name |
| Correction submission | Detail panel → verify prompt → correction form | parish_id, parish_name, feedback_type, message |
| General feedback | More tab | feedback_type, message |
| Interest/volunteer | More tab | name, email, message |

---

## Leaflet.js (Map)

**Version:** 1.9.4 (loaded from cdnjs.cloudflare.com)
**Plugins:** MarkerCluster 1.5.3

### Tile Provider

OpenStreetMap default tiles:
```
https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png
```

### Custom Markers

Navy/gold cross-pin markers rendered as inline SVG data URIs:
- Default pin: navy background, gold cross
- The marker is created via `L.divIcon` with inline SVG, not image files

### Map Configuration

- Default center: Western MA area (approximate center of coverage)
- Default zoom: fits the service area
- Max bounds: loosely constrained to New England
- Clustering: MarkerCluster groups nearby pins at low zoom levels
- Popup: shows parish name, town, next service — styled consistently with card design

### Map Initialization

Map initializes lazily when the Map tab is first selected (not on page load). This avoids loading Leaflet tiles for users who never visit the Map tab.

```javascript
function initMap() {
  if (window._map) return; // Already initialized
  // ... create map, add tiles, add markers
}
```

---

## Google Analytics

**Property ID:** `G-0XWS7YKHED`
**Tag:** gtag.js (loaded async in `<head>`)

### Event Tracking

Currently tracks:
- Page views (automatic)
- Custom events can be added via `gtag('event', 'event_name', { ...params })`

### Privacy

- No cookie consent banner currently (analytics is basic pageview tracking)
- GA is in the service worker's NETWORK_ONLY list — never cached

---

## Liturgical Calendar API (LitCal)

**Endpoint:** `https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/{YEAR}`
**Author:** Fr. John Romano D'Orazio (Diocese of Rome)
**Auth:** None. CORS-enabled. No API key.
**GitHub:** `github.com/Liturgical-Calendar/LiturgicalCalendarAPI`
**Used in:** `src/readings.js` — `fetchLiturgicalDay()`

### Usage

Fetched once per session per year. Cached in-memory as `window._litcalCache`. Returns ~555 events for the US liturgical year. Used for:
- Saint of the day card (highest-grade event for today)
- Upcoming observances list (feasts, solemnities, HDOs in next 90 days)
- Liturgical season detection (Lent, Advent, etc.)
- ICS calendar export (filtered by preset: HDO, feasts, Lent, all)

### Grade Hierarchy

| Grade | Label | Count (~) |
|-------|-------|-----------|
| 0 | Weekday | 218 |
| 1 | Commemoration (Lent replaces optional memorial) | 10 |
| 2 | Optional Memorial | 114 |
| 3 | Memorial (obligatory) | 62 |
| 4 | Feast | 13 |
| 5 | Feast of the Lord (includes Sundays) | 61 |
| 6 | Solemnity | 21 |
| 7 | Highest precedence (Easter, Christmas, Triduum) | 56 |

### Key Fields

```json
{
  "event_key": "StsPerpetuaFelicity",
  "name": "Saints Perpetua and Felicity, Martyrs",
  "color": ["red"],
  "grade": 1,
  "grade_lcl": "commemoration",
  "date": "2026-03-07T00:00:00+00:00",
  "year": 2026, "month": 3, "day": 7,
  "liturgical_season": "LENT",
  "holy_day_of_obligation": true,
  "is_vigil_mass": true,
  "readings": {
    "first_reading": "Romans 8:31b-39",
    "responsorial_psalm": "Psalm 124",
    "gospel": "Matthew 10:34-39"
  }
}
```

**Important:** `date` is midnight UTC — use `month`/`day` integer fields for local date display to avoid off-by-one timezone bugs.

### Multiple Events Per Day

A single date can have multiple events (weekday + saint + vigil). Filter out `is_vigil_mass === true`, then pick highest-grade event.

### Season Values

`LENT`, `HOLY_WEEK`, `EASTER_TRIDUUM`, `ADVENT`, `CHRISTMAS`, `EASTER`, `EASTER_SEASON`, `ORDINARY_TIME`

---

## BibleGet API

**Endpoint:** `https://query.bibleget.io/v3/?query={REF}&version={VERSION}`
**Author:** Fr. John Romano D'Orazio (same as LitCal)
**Auth:** None. CORS-enabled. No API key.
**Used in:** `src/readings.js` — `enhanceWithBibleGet()`

### Usage

Called as an enhancement layer on top of the readings API. For each reading section, fetches verse-by-verse NABRE text with proper verse numbers. Falls back to the readings API's flat text if BibleGet fails.

Calls are staggered 2500ms apart to stay under rate limits.

### Versions

| Code | Translation | Notes |
|------|------------|-------|
| `NABRE` | New American Bible Revised Edition | **Primary** — read at US Mass, copyrighted |
| `DRB` | Douay-Rheims Bible | Public domain, traditional |
| `NVBSE` | Nova Vulgata | Latin, public domain |

### Response Format

```json
{
  "results": [
    { "chapter": 8, "verse": "31", "text": " What then shall we say...", "bookabbrev": "Rom" }
  ]
}
```

### Formatting Tags in Text

Poetic passages include formatting tags that must be converted to CSS classes:

| Tag | Meaning | CSS class |
|-----|---------|-----------|
| `<pof>` | First line of poetic couplet | `.verse-poetic-first` |
| `<poi>` | Indented continuation line | `.verse-poetic-indent` |
| `<po>` | Standard poetic line | `.verse-poetic` |
| `<sm>` | Small caps (e.g., L`<sm>`ORD`</sm>`) | `.small-caps` |

### Reference Conversion (LitCal → BibleGet)

`convertRefToBibleGet()` in `src/readings.js` handles:
- Book name mapping (e.g., `Romans` → `Rom`, `Matthew` → `Mt`)
- Stripping sub-verse letters (`31b` → `31`)
- Stripping `Cf.` prefixes
- Handling `|` alternate readings (uses first option)
- Parenthetical psalm numbering (`Psalm 33 (34)` → `Ps33`)

### Edge Cases

- LitCal occasionally has typos: `Marc` for `Mark`, `Hewbrews` for `Hebrews` — the book map handles these
- Easter Vigil has non-standard reading keys (`seventh_reading`, `epistle`, etc.)
- Some events have empty reading references
- Some events have `readings` as a plain string: `"From the Common of the Blessed Virgin Mary"`

---

## Readings API

**Endpoint:** `https://massfinder-readings-api.vercel.app/api/readings?date=YYYYMMDD`
**Stack:** Python on Vercel (serverless)
**Timeout:** 12 seconds (AbortSignal)
**Used in:** `src/readings.js` — `fetchReadings()`

### Usage

Provides the **structure** for daily readings — section headings (First Reading, Psalm, Gospel), references, and flat text. BibleGet enhances each section with verse-by-verse text; this API is the fallback if BibleGet fails.

Returns: `{ title, url, sections: [{heading, ref, text}] }`

### Error Handling

If the API fails, the More tab shows a USCCB direct link. The readings section never shows an error state — just gracefully degrades.

---

## Service Worker — Network Behavior

The service worker (`sw.js`) partitions network requests:

| Host | Treatment |
|------|-----------|
| `massfinder-readings-api.vercel.app` | Network-only (never cached) |
| `litcal.johnromanodorazio.com` | Network-only (never cached) |
| `query.bibleget.io` | Network-only (never cached) |
| `api.web3forms.com` | Network-only (never cached) |
| `www.googletagmanager.com` | Network-only (never cached) |
| `www.google-analytics.com` | Network-only (never cached) |
| `universalis.com` | Network-only (never cached) |
| Same-origin data files | Stale-while-revalidate |
| Everything else (shell) | Cache-first |

When adding a new external API or service, add its hostname to the `NETWORK_ONLY_HOSTS` array in `sw.js`. Forgetting this will cause the service worker to cache API responses, leading to stale data.

---

## iCal Export (Calendar Integration)

YC events, community events, and liturgical calendar dates support `.ics` file export.

### Three-Tier Download Strategy

1. **Web Share API** (modern iOS/macOS Safari): `navigator.share({ files: [icsFile] })`
2. **Data URI** (older Safari): `window.open('data:text/calendar;charset=utf-8,...')`
3. **Blob download** (Chrome/Firefox): `URL.createObjectURL(blob)` → `<a download>`

### iCal File Requirements

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MassFinder//EN
METHOD:PUBLISH              ← REQUIRED for Apple Calendar compatibility
BEGIN:VEVENT
DTSTART:20260315T180000
DTEND:20260315T190000
SUMMARY:Event Title
LOCATION:Church Name, Address
DESCRIPTION:Event description
UID:timestamp@massfinder.app
END:VEVENT
END:VCALENDAR
```

**Key:** `METHOD:PUBLISH` header is required for Apple Calendar clients to properly import the event. Without it, some versions of iOS Calendar silently ignore the file.

---

## External CDN Dependencies

| Library | Version | CDN URL | Used For |
|---------|---------|---------|----------|
| Leaflet | 1.9.4 | cdnjs.cloudflare.com | Map rendering |
| MarkerCluster | 1.5.3 | cdnjs.cloudflare.com | Map marker clustering |
| Playfair Display | (Google Fonts) | fonts.googleapis.com | Display typography |
| Source Sans 3 | (Google Fonts) | fonts.googleapis.com | Body typography |

**Rules:**
- Pin versions explicitly. Never use `@latest` or unversioned CDN URLs.
- All CDN resources are in the service worker's cache list.
- If adding a new CDN dependency, add it to `SHELL_ASSETS` in `sw.js`.
- Minimize external dependencies. Each one is a potential point of failure for offline use.

---

## Future Integrations (Planned)

| Integration | Purpose | Status |
|------------|---------|--------|
| GitHub Actions + Vercel pipeline | Automated data validation on push | Implemented (CI validates schema) |
| Resend | Weekly email digests for subscribers | Planned (Batch 5) |
| Ko-fi | Donation/support link | Planned (Batch 5) |
| Supabase Auth | Magic link login for contributors | Planned (Batch 6) |
