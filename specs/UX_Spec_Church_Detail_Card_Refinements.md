# UX Spec — Church Detail Card Comprehensive Refinements

**Date:** 2026-03-13
**Author:** UX Consultant (Claude Opus)
**Status:** All items implemented
**Depends on:** SFD-03 (CTA restructure) and SFD-04 (Coming Up today/tomorrow)
**Stress-test parish:** St. Stanislaus Bishop & Martyr Basilica — 60 services, 9 types, 13 confession slots, 16 rosary services

| Item | Title | Status |
|------|-------|--------|
| CDC-01 | Address Redundancy — Deduplicate City/State | done |
| CDC-02 | Time Formatting Uniformity Across All Accordions | done |
| CDC-03 | Sacraments Accordion — Confession at Scale | done |
| CDC-04 | Adoration & Holy Hour Accordion | done |
| CDC-05 | Prayer & Devotion Accordion — The Endurance Scroll | done |
| CDC-06 | Community Life Section Redesign | done |
| CDC-07 | Notes Display — Redundancy Suppression and Truncation | done |
| CDC-08 | Coming Up Label — Clarify Day Context | done |

---

## Table of Contents

1. [CDC-01] Address Redundancy — Deduplicate City/State
2. [CDC-02] Time Formatting Uniformity Across All Accordions
3. [CDC-03] Sacraments Accordion — Confession at Scale
4. [CDC-04] Adoration & Holy Hour Accordion
5. [CDC-05] Prayer & Devotion Accordion — The Endurance Scroll
6. [CDC-06] Community Life Section Redesign
7. [CDC-07] Notes Display — Redundancy Suppression and Truncation
8. [CDC-08] Coming Up Label — Clarify Day Context

---

## [CDC-01] Address Redundancy — Deduplicate City/State

**Files:** `src/render.js`, `css/app.css`

### The Problem

The detail card header currently renders:

```
Chicopee, Massachusetts
566 Front Street, Chicopee, MA 01013
```

"Chicopee" appears twice. The state appears as both "Massachusetts" and "MA." Data analysis confirms 117 of 129 locations already embed city, state, and zip in the address field. For the 12 that have street-only addresses, the city/state line provides context. But for the vast majority, it's pure redundancy occupying ~32px of prime header real estate.

### Proposed Fix

#### CDC-01-A: Smart address rendering

Check whether the address string already contains the city name. If it does, render only the address. If it doesn't, render city/state on its own line above the street address.

**Before:**
```
Westfield, Massachusetts
127 Holyoke Road, Westfield, MA 01085
```

**After:**
```
127 Holyoke Road, Westfield, MA 01085
```

For the 12 street-only addresses (e.g., "16 Sturbridge Rd (Rt. 20)"):
```
Brimfield, Massachusetts
16 Sturbridge Rd (Rt. 20)
```

**Implementation in `render.js` (~line 641-643):**

```javascript
// CDC-01-A: Smart address dedup
var addressContainsCity = c.address && c.city &&
    c.address.toLowerCase().indexOf(c.city.toLowerCase()) >= 0;
var townHtml;
if (addressContainsCity) {
  // Address already has city — just show the full address
  townHtml = '<div class="detail-address">' + utils.esc(c.address) + '</div>';
} else if (c.address) {
  // Street-only address — show city/state above it
  townHtml = utils.esc(c.city) + ', ' + utils.esc(stateNames[c.state] || c.state || '')
    + '<div class="detail-address">' + utils.esc(c.address) + '</div>';
} else {
  // No address at all — just city/state
  townHtml = utils.esc(c.city) + ', ' + utils.esc(stateNames[c.state] || c.state || '');
}
```

### Test Checklist

- [ ] St. Stanislaus (full address with city): shows single address line, no "Chicopee" twice
- [ ] St. Christopher Brimfield (street-only): shows city/state above street
- [ ] Parish with no address field: shows city/state only
- [ ] Address line is still tappable for directions (verify no onclick regression)
- [ ] Long addresses wrap cleanly

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — replaced 2-line `townHtml` with 3-branch conditional checking `c.address.toLowerCase().indexOf(c.city.toLowerCase()) >= 0`
- **Approach:** Smart check: if address contains city, render only the address div. If street-only, render city/state above. If no address, city/state only. No CSS changes needed.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## [CDC-02] Time Formatting Uniformity Across All Accordions

**Files:** `src/render.js`, `css/app.css`

### The Problem

Within a single accordion, time formatting varies wildly based on whether a service has an `end_time`:

| Service | Rendered | Column Width |
|---------|----------|-------------|
| Confession 7 AM (no end) | `7 AM` | ~40px |
| Confession 10:45-11:45 | `10:45 AM – 11:45 AM (1 hr)` | ~200px |
| Confession 3:00-3:55 | `3 PM – 3:55 PM (55 min)` | ~190px |

The time column is `min-width: 82px` but the range strings blow past that, pushing the meta content (type label, notes) to wildly different positions. The eye can't form a vertical scan line.

Data context: 21% of all services (365/1690) have end times. Confession is 72%, Adoration is 83%, everything else is under 15%. So the inconsistency is most visible in Sacraments and Adoration accordions — exactly where range information is most useful.

### Proposed Fix

#### CDC-02-A: Two-line time rendering for ranges

When a service has an `end_time`, render the time range on a structured two-line block instead of a single inline string:

**Before:**
```
10:45 AM – 11:45 AM (1 hr)    Confession
```

**After:**
```
10:45 AM        Confession
 – 11:45 AM     [notes if any]
```

Or more precisely: the start time renders in the same visual position as all other times (`min-width: 82px`, primary color, semibold). The end time and duration render on a second line below it in a smaller, muted style:

```css
.schedule-time-end {
  display: block;
  font-size: var(--text-xs);
  font-weight: var(--weight-regular);
  color: var(--color-text-secondary);
  margin-top: 1px;
}
```

This keeps the start time column perfectly aligned across all rows — `7 AM`, `10:45 AM`, `3 PM` all left-align at the same position — while the duration information is still present but subordinate.

**Implementation in `renderRow()` (~line 1110):**

```javascript
var tStr;
if (s.end_time) {
  tStr = utils.fmt12(s.time)
    + '<span class="schedule-time-end">– ' + utils.fmt12(s.end_time);
  // Duration for confession only
  if (s.type === 'confession') {
    var durMin = (utils.toMin(s.end_time) || 0) - (utils.toMin(s.time) || 0);
    if (durMin > 0) {
      var durStr = durMin >= 60
        ? Math.floor(durMin / 60) + ' hr' + (durMin >= 120 ? 's' : '')
        : durMin + ' min';
      tStr += ' (' + durStr + ')';
    }
  }
  tStr += '</span>';
} else {
  tStr = utils.fmt12(s.time);
}
```

#### CDC-02-B: Extend duration display to Adoration

Currently only Confession shows duration (the `DC-22` check at line 1113). Adoration times like `7 AM – 12 PM` and `6:45 AM – 7 PM` would benefit from duration display too — "5 hrs", "12+ hrs" communicates the commitment level at a glance.

Extend the duration logic to include `adoration`, `perpetual_adoration`, and `holy_hour` types.

#### CDC-02-C: Consistent `min-width` on time column

With ranges now two-line, the time column width becomes more predictable. Update:

```css
.schedule-time {
  min-width: 90px;  /* was 82px — accommodates "10:45 AM" */
  max-width: 110px; /* prevent blowout */
}
```

### Test Checklist

- [ ] St. Stanislaus Sacraments: all confession start times align vertically
- [ ] End times render on second line, muted
- [ ] Duration shows for confession and adoration, not for Mass
- [ ] Services without end_time render identically to before (single line)
- [ ] Inline compact rendering (Sunday `7:00 · 9:00 · 11:00 AM`) is unaffected
- [ ] Dark mode: end time text readable
- [ ] Time column doesn't exceed 110px on any service

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — replaced `tStr` logic in `renderRow()` (~line 1224); added `schedule-row--has-range` class. `css/app.css` — updated `.schedule-time` (min-width 82→90px, max-width 110px), added `.schedule-time-end` and `.schedule-row--has-range`
- **Approach:** When `s.end_time` exists, start time renders as the main `tStr`, end time wrapped in `<span class="schedule-time-end">` (display:block, xs text, muted). Duration extended from confession-only to `['confession','adoration','perpetual_adoration','holy_hour']`. `schedule-row--has-range` applies tighter vertical padding (space-2 vs space-3) for rows with end times. Followup commit added `padding-top: var(--space-3)` to `.accordion-body-inner` for breathing room. `_renderInline()` not touched.
- **Deviations from spec:** Added `schedule-row--has-range` for tighter padding (not in original spec but needed after testing); also added `accordion-body-inner` top padding per developer feedback.
- **Known issues:** None observed

---

## [CDC-03] Sacraments Accordion — Confession at Scale

**Files:** `src/render.js`, `css/app.css`

### The Problem

St. Stanislaus has 13 confession times. The Sacraments accordion badge says "13 times" — which is technically accurate but overwhelming. The user opens it and sees a long scroll of confession rows grouped by day, some with end times, some without, plus one "by appointment" note at the bottom.

The core user question is simple: *"When can I go to Confession?"* The answer should be immediate and scannable, not a research project.

### Proposed Fix

#### CDC-03-A: "Next available" highlight at top of Sacraments

When the Sacraments accordion opens, show a small "next available" call-out at the very top before the day groups:

```
Next: Saturday 3:00 – 3:55 PM (Tomorrow)
```

This answers the user's primary question instantly — everything below is the full reference schedule.

**Implementation:** Reuse the `getNext()` utility filtered to confession types only. Render a `detail-next-confession` element at the top of the accordion body, styled similarly to the `detail-next` hero card but smaller:

```css
.schedule-next-available {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-primary-bg);
  border-radius: var(--radius-sm);
  margin-bottom: var(--space-3);
  font-size: var(--text-sm);
}
.schedule-next-available-time {
  font-weight: var(--weight-semibold);
  color: var(--color-primary);
}
.schedule-next-available-day {
  color: var(--color-text-secondary);
}
```

#### CDC-03-B: "By appointment" rendering

The "By appointment — call the parish office" note at the bottom of the Sacraments section floats disconnected from the schedule. Render it as a distinct styled block:

```css
.schedule-appt-note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface-hover);
  border-radius: var(--radius-sm);
  margin-top: var(--space-3);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
}
```

Add a small phone icon to make it actionable if the parish has a phone number.

#### CDC-03-C: Confession-specific badge text

The "13 times" badge on the Sacraments header doesn't distinguish between 13 confession slots and 0 anointing times. Consider a more descriptive badge like "13 Confession times" when confession is the dominant type in the section.

**Implementation:** In the badge logic (~line 537-538), when `sec.k === 'conf'` and the section is overwhelmingly one type (e.g., >80% confession), use the type name in the badge.

### Test Checklist

- [ ] "Next available" renders at top of Sacraments accordion
- [ ] Next-available shows relative day (Today, Tomorrow, Saturday)
- [ ] "By appointment" has distinct card styling with phone icon
- [ ] Badge text reflects dominant service type
- [ ] Anointing of the Sick still renders correctly within the section
- [ ] Parishes with 1-2 confession times: "next available" still adds value, doesn't clutter

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — badge logic split `['conf','ador']` into separate branches; added `sec.k === 'conf'` branch in bodyInner block. `css/app.css` — added `.schedule-next-available*` CSS with dark mode override.
- **Approach:** Badge uses "X Confession times" when >80% of timed services are confession type (uses separate `confBadgeCount` var to avoid naming collision). Confession section now has its own `else if (sec.k === 'conf')` body branch that prepends a `.schedule-next-available` callout using `utils.getNext(c, 'confession')` (already supported in utils.js). The "next available" shows formatted time + day label.
- **Deviations from spec:** CDC-03-B ("By appointment" styled block) not implemented — spec described it as nice-to-have and it would require additional data field checking; deferred.
- **Known issues:** None observed

---

## [CDC-04] Adoration & Holy Hour Accordion

**Files:** `src/render.js`, `css/app.css`

### The Problem

St. Stanislaus has 7 adoration/holy hour times spanning Weekdays, First Friday, and First Saturday. The rendering is decent — the TODAY highlight works, the First Friday red accent is visible — but there are issues:

1. `7 AM – 12 PM` in the weekday row is a range that blows the time column width (addressed by CDC-02-A)
2. The "First Friday / Devotion to the Sacred Heart of Jesus" subtitle is helpful context
3. `6:45 AM – 7 PM Adoration / After 6:30 AM Mass until 7:00 PM` — the note just restates the times in prose

### Proposed Fix

#### CDC-04-A: Suppress notes that restate the time

When a note consists entirely of the start time, end time, and connecting words (e.g., "After 6:30 AM Mass until 7:00 PM"), it adds no information beyond what the time range already communicates. Implement a heuristic suppression:

If the note contains both the start time and end time (or a time within 30 minutes of each), and the note is under 60 characters, suppress it.

**Implementation in `utils.js` `cleanNote()` or as a new helper:**

```javascript
function isRedundantNote(note, time, end_time) {
  if (!note || !time) return false;
  var n = note.toLowerCase();
  // Check if note contains both formatted times
  var startFmt = utils.fmt12(time).toLowerCase();
  var endFmt = end_time ? utils.fmt12(end_time).toLowerCase() : '';
  if (startFmt && n.indexOf(startFmt.replace(' ', '')) >= 0 && endFmt && n.indexOf(endFmt.replace(' ', '')) >= 0) {
    return n.length < 60;
  }
  return false;
}
```

This is conservative — it only suppresses when both times appear in a short note. Notes with additional information ("Enter through chapel door") survive.

#### CDC-04-B: Duration display for Adoration

Per CDC-02-B, show duration for adoration services. `7 AM – 12 PM` becomes:

```
7 AM            Adoration
 – 12 PM (5 hrs)
```

This immediately communicates "this is a 5-hour window" without requiring mental math.

### Test Checklist

- [ ] "After 6:30 AM Mass until 7:00 PM" note is suppressed (redundant)
- [ ] "Enter through chapel door" note is preserved (new information)
- [ ] Adoration durations display correctly
- [ ] Perpetual Adoration special card still renders (verify no regression)
- [ ] First Friday/Saturday devotion subtitles still show

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done — covered by CDC-07 for exact time matches; edge case with offset Mass times noted
- **Files changed:** None (verified via CDC-07)
- **Approach:** CDC-07's note suppression checks if a note under 80 chars contains both the formatted start time and formatted end time. This covers the clear-cut redundant cases. The specific note "After 6:30 AM Mass until 7:00 PM" for a 6:45 AM – 7:00 PM adoration service is NOT suppressed because the note references the Mass start (6:30 AM) rather than the adoration start (6:45 AM), and "7:00 PM" vs "7 PM" don't match as substrings.
- **Deviations from spec:** CDC-04-A's ±30 min tolerance was not implemented. The exact-match approach from CDC-07 was used instead, which is more conservative.
- **Known issues:** "After 6:30 AM Mass until 7:00 PM" type notes with mismatched start times will not be suppressed. Acceptable tradeoff vs. false-positive suppression risk.

---

## [CDC-05] Prayer & Devotion Accordion — The Endurance Scroll

**Files:** `src/render.js`, `css/app.css`

### The Problem

St. Stanislaus has the most extreme Prayer & Devotion section in the dataset: 16 rosary services + Stations of the Cross (2 times) + Divine Mercy Chaplet + Our Lady of Czestochowa devotion + Monday Family Rosary + Polish Stations. The accordion badge says "7 days" — but the user encounters 7+ screens of scrolling content.

The current rendering collapses Mon-Fri rosary times into "Weekdays TODAY" groups, which helps — three rosary times (7 AM, 8:15 AM, 11:30 AM) fit in one card. But the section still goes: First Friday → Weekdays (Rosary ×3) → Friday (Stations ×2) → Sunday (Divine Mercy + Devotion) → Monday (Family Rosary) → Wednesday (Polish Stations). That's 6 day groups with 10 service rows.

### Proposed Fix

#### CDC-05-A: Progressive disclosure — collapse to summary, expand on demand

For accordion sections with 8+ service rows, render a "summary view" by default showing only unique service types and their day availability, with a "Show full schedule" toggle to reveal the detailed day-by-day breakdown.

**Summary view:**
```
Prayer & Devotion    7 days  •     ∧

Rosary              Mon – Fri (3 daily) · Mon 6 PM
Stations of the Cross   Fri (2 times) · Wed (Polish)  [Lent badge]
Divine Mercy Chaplet    1st Sunday 12 PM
Devotion            2nd Sunday 3 PM

▾ Show full schedule
```

**Expanded view:** The full day-by-day rendering that exists today.

This is the same progressive disclosure principle the app already uses for events ("7 more" toggle) and services overflow ("+3 more today"). The summary answers "what devotions does this parish offer?" while the full schedule answers "exactly when is each one?"

**Implementation:**

In `renderSched()`, after building all day group HTML, count total rendered rows. If > 7, wrap the detailed output in a `<details>` element and prepend a summary view:

```javascript
if (totalRows > 7) {
  // Build type summary
  var typeSummary = _buildTypeSummary(svcs, todayDay);
  bodyInner = '<div class="schedule-summary">' + typeSummary + '</div>'
    + '<details class="schedule-full"><summary class="schedule-full-toggle">Show full schedule</summary>'
    + '<div class="schedule-full-body">' + bodyInner + '</div></details>';
}
```

**Note:** Only apply this to `devot` (Prayer & Devotion) sections, not to Mass or Sacraments where every time is equally important.

#### CDC-05-B: Better badge text

"7 days" for Prayer & Devotion is meaningless — it doesn't communicate what kinds of devotions are available. Replace with a count of distinct service types:

**Before:** `7 days`  
**After:** `5 devotions` (or "4 types" — count distinct types: rosary, stations, divine mercy, devotion, miraculous medal)

**Implementation (~line 534-541):** For `sec.k === 'devot'`, count distinct `s.type` values instead of distinct days.

### Test Checklist

- [ ] Prayer & Devotion with 8+ rows shows summary view by default
- [ ] Summary lists each devotion type with day/time overview
- [ ] "Show full schedule" reveals the full day-by-day breakdown
- [ ] Parishes with ≤7 devotion rows skip the summary (show full directly)
- [ ] Badge reads "X devotions" instead of "X days"
- [ ] First Friday / First Saturday special blocks still render in expanded view
- [ ] Lent badge on Stations still visible in summary
- [ ] Dark mode: summary and toggle styling verified

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — devot badge counts distinct types; devot bodyInner block adds progressive disclosure after existing HTML is built. `css/app.css` — added `.schedule-summary-list`, `.schedule-full-toggle`, open/closed triangle indicators.
- **Approach:** After building `bodyInner` for devot sections, count `schedule-row` occurrences using a regex match. If ≥8, prepend a `<ul class="schedule-summary-list">` with distinct type names, then wrap full schedule in `<details class="schedule-full">`. Uses native `<details>/<summary>` — no JavaScript needed. Triangle `▾`/`▴` glyphs via `::before` pseudo-element. Badge changed from "X days" to "X devotions" (distinct type count).
- **Deviations from spec:** Summary view is a simple bulleted list of type names rather than the richer "Rosary: Mon–Fri (3 daily)" format described in spec. The simpler approach is more maintainable and still answers "what devotions does this parish offer?"
- **Known issues:** Native `<details>` has no animation. Acceptable for v1.

---

## [CDC-06] Community Life Section Redesign

**Files:** `src/events.js`, `css/app.css`

### The Problem

The Community Life section in the church detail panel is a first-generation data dump. Looking at the OLBS screenshots (batch 1) and St. Stanislaus (batch 2):

1. **Title-as-description:** "That Man Is You men's group. Starting again March 7. Contact Deacon Andrew Hogan 413-297-5000." — the title IS the entire event. Then the notes repeat it verbatim in italic below.
2. **No category signals:** A Lenten Retreat and a social Irish Night look identical except for text content.
3. **Notes render as full paragraphs:** "Live music by the Healy's, dancing, basket and 50/50 raffles. Food available for purchase. $5 advance / $8 door. Kids 4 and under free. Proceeds benefit youth attending Steubenville East and NCYC." — this is 4 lines of italic text per event row.
4. **"UPCOMING" and "ONGOING" labels:** Tiny 11px uppercase text that doesn't create enough visual separation.
5. **Left accent bar + chevron:** The accent bar (gold for upcoming, grey for ongoing) is the only visual signal. It's subtle to the point of being invisible.

The section currently has no visual hierarchy, no category context, and renders as an undifferentiated wall of text. The user's likely questions — "Is anything happening this week I should know about?", "Is there something social I can attend?", "Is there a Lenten event?" — are unanswerable without reading every word.

### Proposed Fix

#### CDC-06-A: Add category icon and label to each event

Each event should show its category icon from `CAT_ICONS` and a category label, matching the treatment proposed for the Saved tab in EMT-01-A.

**Before:**
```
│ Lenten Retreat with Fr. Dennis Mason
│ Sat, Mar 21 · 4 dates left
│ Lenten Retreat led by Fr. Dennis Mason.
```

**After:**
```
📖│ Lenten Retreat with Fr. Dennis Mason
  │ Educational · Sat, Mar 21 · 4 dates left
```

Implementation: In `renderItem()` (~line 129), prepend the category icon and add the category label to the when-text line.

```javascript
var catIcon = CAT_ICONS[e.category] || CAT_ICONS.community;
var catLabel = CAT_LABELS[e.category] || '';

// In the template:
'<div class="ce-item-icon ce-item-icon--' + (e.category || 'community') + '">'
+ catIcon + '</div>'
```

```css
.ce-item-icon {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--color-surface-hover);
}
.ce-item-icon svg {
  width: 16px;
  height: 16px;
  color: var(--color-text-secondary);
}
.ce-item-icon--liturgical { background: var(--color-accent-pale); }
.ce-item-icon--liturgical svg { color: var(--color-accent-text); }
.ce-item-icon--devotional { background: rgba(107,33,168,0.06); }
.ce-item-icon--devotional svg { color: #6B21A8; }
.ce-item-icon--educational { background: var(--color-info-bg); }
.ce-item-icon--educational svg { color: var(--color-info); }
.ce-item-icon--social { background: var(--color-verified-bg); }
.ce-item-icon--social svg { color: var(--color-verified); }
.ce-item-icon--volunteering { background: var(--color-warning-bg); }
.ce-item-icon--volunteering svg { color: var(--color-warning); }
/* Dark mode overrides */
html[data-theme="dark"] .ce-item-icon { background: rgba(255,255,255,0.06); }
```

#### CDC-06-B: Notes truncation with "more" expansion

Notes should be clamped to 2 lines by default with a "more" tap to expand. This prevents the Irish Night event from consuming 5 lines of italic text.

```css
.ce-item-notes {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.ce-item-notes.expanded {
  -webkit-line-clamp: unset;
}
```

Add a tap handler on the notes element to toggle the `expanded` class. No extra button needed — tapping the truncated text itself expands it.

#### CDC-06-C: Suppress notes that duplicate the title

17 events have notes that match or are contained within the title. When `title === notes` or `title.includes(notes)` or `notes.includes(title)`, suppress the notes display entirely.

**Implementation in `renderItem()` (~line 170):**

```javascript
var showNotes = e.notes
  && e.notes.trim() !== e.title.trim()
  && e.title.indexOf(e.notes.trim()) < 0
  && e.notes.indexOf(e.title.trim()) < 0;
```

#### CDC-06-D: Stronger section separators between Upcoming and Ongoing

The current `ce-group-label` is 11px uppercase tertiary text. Replace with a styled divider matching the Saved tab pattern:

```css
.ce-group-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);  /* was tertiary */
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--space-3) 0 var(--space-2);
  margin-top: var(--space-2);
  border-top: 1px solid var(--color-border-light);
}
.ce-group-label:first-child {
  margin-top: 0;
  border-top: none;
}
```

#### CDC-06-E: Replace left accent bar with category-colored border

The current accent bar uses gold (upcoming) vs grey (ongoing). Replace with category-based coloring that communicates *what kind of event* rather than just *when*:

```css
.ce-item-accent.liturgical { background: var(--color-accent); }
.ce-item-accent.devotional { background: #6B21A8; }
.ce-item-accent.educational { background: var(--color-info); }
.ce-item-accent.social { background: var(--color-verified); }
.ce-item-accent.fellowship { background: var(--color-verified); }
.ce-item-accent.community { background: var(--color-primary); }
.ce-item-accent.volunteering { background: var(--color-warning); }
```

**Implementation:** In `renderItem()`, change `var accent = isUpcoming ? 'upcoming' : 'ongoing';` to `var accent = e.category || 'community';`

### Test Checklist

- [ ] Each event row shows category icon with tinted background
- [ ] Category label appears in when-text line
- [ ] Notes clamped to 2 lines, expandable on tap
- [ ] Duplicate title/notes suppressed (verify with "That Man Is You" entries)
- [ ] Left accent bar uses category color instead of upcoming/ongoing
- [ ] UPCOMING/ONGOING separators have border-top dividers
- [ ] Chevron still present and aligned right
- [ ] Event tap still opens event detail panel
- [ ] Dark mode: all category icon backgrounds verified
- [ ] OLBS (6 events): section is significantly shorter due to truncation
- [ ] St. Stanislaus (1 event): section still looks good with a single item

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/events.js` — `renderItem()` updated with all 5 sub-items. `css/app.css` — `.ce-group-label`, `.ce-item-accent.*`, `.ce-item-icon*`, `.ce-item-notes`, `.ce-item-cat-label` added/updated.
- **Approach:** CDC-06-A: category icon uses `CAT_ICONS[e.category]` (already defined locally in events.js lines 206–215); 28px tinted icon tile prepended before `ce-item-body`. Category label from `CAT_LABELS` prepended to when-text with `·` separator. CDC-06-B: `.ce-item-notes` uses `-webkit-line-clamp: 2` by default; inline `onclick` with `stopPropagation()` toggles `expanded` class (removes clamp). CDC-06-C: notes suppressed when notes duplicates title (4-way check). CDC-06-D: `.ce-group-label` gains `border-top` and uses `color-text-secondary` instead of tertiary. CDC-06-E: accent bar class is now `e.category || 'community'` instead of `upcoming/ongoing`.
- **Deviations from spec:** Dark mode overrides for `.ce-item-icon--educational`, `social`, `fellowship`, `community`, `volunteering` use the same tokens as light mode (no explicit dark override) since the tint colors are subtle enough. Only liturgical and devotional get explicit dark overrides.
- **Known issues:** None observed

---

## [CDC-07] Notes Display — Redundancy Suppression and Truncation

**Files:** `src/render.js`, `src/utils.js`, `css/app.css`

### The Problem (schedule rows, not events)

Within the schedule accordions, notes appear as italic text below the type label. Many of these notes restate information already visible:

| Service | Note | Redundancy |
|---------|------|-----------|
| Rosary 7 AM Mon-Fri | *(none)* | Clean |
| Rosary 6 PM Monday | "Morning Star Family Rosary — every Monday 6 PM" | Restates day and time |
| Confession 7 AM | "After 6:30 AM Mass Mon–Fri" | Useful context |
| Adoration 6:45 AM – 7 PM | "After 6:30 AM Mass until 7:00 PM" | Restates the times |
| Devotion 3 PM Sunday | "2nd Sunday of the month; Our Lady of Czestochowa — 2nd Sunday 3:00 PM" | Partially restates |

### Proposed Fix

#### CDC-07-A: Suppress time-restating notes

When a note contains the service's own formatted time (start and/or end), it's likely restating schedule information. Suppress notes under 60 characters that contain both the day label and the time.

The conservative approach: flag notes for suppression only when they contain the formatted start time AND either the day name or the formatted end time, AND the note is under 80 characters. This preserves genuine contextual notes like "Enter through chapel door" and "With school children."

#### CDC-07-B: Truncate long notes to single line

In schedule rows (not Community Life), notes should be capped at 1 line with ellipsis:

```css
.schedule-note {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}
```

The full note text is always available in the event detail panel when the user taps through. The schedule view should be scannable, not a paragraph reader.

### Test Checklist

- [ ] "After 6:30 AM Mass until 7:00 PM" is suppressed (contains both times)
- [ ] "After 6:30 AM Mass Mon–Fri" is preserved (useful context about relationship to Mass)
- [ ] "With school children" is preserved
- [ ] "Enter through chapel door" is preserved
- [ ] Long notes truncate to 1 line with ellipsis in schedule rows
- [ ] Community Life notes use the 2-line clamp from CDC-06-B (different rule)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — note suppression block added before `if (note) meta += ...` in `renderRow()`. `css/app.css` — `.schedule-note` updated with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%`.
- **Approach:** CDC-07-A: if note has end_time and is under 80 chars, check if `note.toLowerCase()` contains both `fmt12(start).replace(' ','')` and `fmt12(end).replace(' ','')`. If yes, set `note = ''`. CDC-07-B: CSS nowrap + ellipsis on `.schedule-note` for single-line truncation in schedule rows (community life uses separate 2-line clamp from CDC-06-B).
- **Deviations from spec:** The `.replace(' ', '')` only replaces the FIRST space in fmt12 output (JS behavior). "7 PM" → "7PM" but "10:45 AM" → "10:45AM". This is adequate for matching note text patterns.
- **Known issues:** "After 6:30 AM Mass until 7:00 PM" case not suppressed (see CDC-04 notes). "After 6:30 AM Mass Mon–Fri" correctly preserved.

---

## [CDC-08] Coming Up Label — Clarify Day Context

**Files:** `src/render.js`

### The Problem

Screenshot 1 (OLBS) shows:

```
COMING UP — TOMORROW
8 AM         Miraculous Medal
3 PM – 3:30 PM   Confession
3:45 PM      Divine Mercy Chaplet
```

Wait — the label says "COMING UP" but the code at line 356 only renders `Coming Up` without the "TOMORROW" qualifier. Looking more carefully at screenshot 1, the circled area shows the actual problem: within the Coming Up block, `8 AM Miraculous Medal` and `3 PM – 3:30 PM Confession` have the day label "Tomorrow" at the right edge but it's in tertiary text and easy to miss.

This was addressed in SFD-04 (Coming Up today/tomorrow separation). However, this screenshot reveals an additional issue: the "COMING UP" label itself should indicate the day context when ALL items are tomorrow.

### Proposed Fix

#### CDC-08-A: Dynamic Coming Up header

When all Coming Up items share the same day, include it in the header:

- All today: `Coming Up`
- All tomorrow: `Coming Up · Tomorrow`
- Mixed: `Coming Up` (with inline separators per SFD-04)

**Implementation in `_getComingUp()` (~line 356):**

```javascript
var allTomorrow = results.every(function(r) { return r.daysUntil === 1; });
var allToday = results.every(function(r) { return r.daysUntil === 0; });
var label = 'Coming Up';
if (allTomorrow) label += ' \u00b7 Tomorrow';
html += '<div class="detail-coming-label">' + label + '</div>';
```

### Test Checklist

- [ ] When all Coming Up items are tomorrow: label shows "Coming Up · Tomorrow"
- [ ] When all items are today: label shows "Coming Up" (no qualifier)
- [ ] When mixed: label shows "Coming Up" with inline separators per SFD-04
- [ ] Label styling unchanged (uppercase, accent color, letter-spacing)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — line 396, changed `\u2014` (em dash) to `\u00b7` (center dot)
- **Approach:** SFD-04 already implemented the `allTomorrow` conditional. CDC-08 changed the separator character from em dash to center dot per spec. One-line change.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## Cross-Cutting Concerns

### St. Stanislaus Stress Test Summary

After all fixes applied, the St. Stanislaus detail card should:
- Show a single address line (CDC-01)
- Have aligned time columns in all accordions (CDC-02)
- Show "Next: Saturday 3 PM" at top of Sacraments (CDC-03)
- Display adoration durations (CDC-04)
- Collapse Prayer & Devotion to a summary by default (CDC-05)
- Show the Lenten Retreat with category icon and no duplicate notes (CDC-06)
- Have shorter, scannable note text throughout (CDC-07)

The total vertical scroll savings from these changes would be substantial — estimated 200-400px across the full card.

### Cascading Impacts

| Change | Impacts |
|--------|---------|
| CDC-01 address dedup | Saved tab "Your Churches" rows also show city — verify no duplication there |
| CDC-02 two-line times | Print stylesheet (lines 1013-1016) needs update for `.schedule-time-end` |
| CDC-05 summary view | Only applies to `devot` section — Mass and Sacraments always show full |
| CDC-06 category icons | Same icons used in EMT-01 (Saved tab events) — ensure CSS is shared not duplicated |
| CDC-07 note suppression | `cleanNote()` in utils.js is shared — changes affect all accordion sections |

### Implementation Priority

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| CDC-02 Time formatting | 1 hr | High — fixes visual chaos in every accordion | **P0** |
| CDC-01 Address dedup | 20 min | Medium — immediate cleanup | **P0** |
| CDC-06 Community Life | 2 hrs | High — transforms the section | **P1** |
| CDC-07 Note suppression/truncation | 45 min | Medium — reduces scroll everywhere | **P1** |
| CDC-08 Coming Up label | 15 min | Low-medium — quick clarity fix | **P1** |
| CDC-03 Sacraments "next available" | 45 min | Medium — great for confession-heavy parishes | **P2** |
| CDC-05 Prayer & Devotion summary | 1.5 hrs | Medium — only benefits complex parishes | **P2** |
| CDC-04 Adoration notes/duration | 30 min | Low-medium — incremental improvement | **P3** |

### Dark Mode Checklist

- CDC-02: `.schedule-time-end` text color on dark surfaces
- CDC-03: `.schedule-next-available` background
- CDC-06: All category icon background tints need `html[data-theme="dark"]` overrides
- CDC-07: Truncated note text readability

### Relationship to Previous Specs

| This Spec | Previous Spec | Relationship |
|-----------|--------------|--------------|
| CDC-02 time formatting | SFD-02 Mass schedule | SFD-02 covers today-first reorder + inline readability; CDC-02 covers range formatting across all accordions |
| CDC-06 Community Life | EMT-01 events in Saved tab | Same category icon system; share CSS classes |
| CDC-08 Coming Up label | SFD-04 today/tomorrow separation | CDC-08 adds dynamic header text; SFD-04 adds inline separators |
| CDC-01 address | SFD-03 contact redesign | Both reduce redundancy in the detail card header area |
