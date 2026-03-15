# UX Spec: Novena & Practice Tracker Improvements (NPT Series)

**Created:** 2026-03-15  
**Backlog items:** IDEA-133, IDEA-116, IDEA-131  
**Scope:** Novena deep-linking, liturgical sorting, date-aware tracker cards  
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_NPT.md`

---

## NPT-01 — Novena CTAs Must Deep-Link to Specific Novena

**ID:** NPT-01  
**Category:** bug  
**Backlog:** IDEA-133  
**Priority:** P1

**Problem:**  
When a user taps "Pray the St. Joseph Novena →" on the March monthly devotion card (line 633, `src/more.js`), it calls `openNovena()` with no argument. The novena module (`src/novena.js`, line 127–128) receives `null` for `novenaId`, falls through to `_screen = 'select'`, and renders the full novena index. Dorothy taps expecting to start praying and instead gets a list of 9 novenas. She doesn't know which one was referenced. Sarah taps while herding kids, gets the list, and gives up.

The same issue affects the Pentecost/Holy Spirit seasonal CTA at line 561 (`openNovena()`).

**Fix:**

Pass the novena ID to `openNovena()` in each contextual CTA.

**File:** `src/more.js`, line 633 (March monthly devotion)  
**Before:**
```js
action: 'Pray the St. Joseph Novena \u2192', actionFn: 'openNovena()'
```
**After:**
```js
action: 'Pray the St. Joseph Novena \u2192', actionFn: 'openNovena(\'st_joseph\')'
```

**File:** `src/more.js`, line 561 (Pentecost seasonal card)  
**Before:**
```js
+ '<div class="seasonal-card-action" onclick="event.stopPropagation();openNovena()">Start the Holy Spirit Novena \u2192</div>'
```
**After:**
```js
+ '<div class="seasonal-card-action" onclick="event.stopPropagation();openNovena(\'holy_spirit\')">Start the Holy Spirit Novena \u2192</div>'
```

**Existing novena IDs** (from `data/prayers.json`): `divine_mercy`, `holy_spirit`, `st_joseph`, `surrender`, `sacred_heart`, `st_jude`, `miraculous_medal`, `st_andrew_christmas`, `st_patrick`

**How it works:** `openNovena('st_joseph')` → `reader.readerOpen('novena', { id: 'st_joseph' })` → the render function at line 25 of `src/novena.js` hits `if (params.id) { _selectNovena(params.id); }` — which opens directly to the prayer screen for that novena. This path already exists; it just needs to be invoked.

**Audit for other bare `openNovena()` calls in more.js:**  
Search for `openNovena()` without arguments in `src/more.js`. The practice strip card at line 961 correctly opens to the index (user wants to browse all novenas from the tracker), so that one stays bare. Only contextual CTAs that name a specific novena need the ID.

**Dark mode:** No impact.

**Test checklist:**
- [ ] March: tapping "Pray the St. Joseph Novena →" opens St. Joseph novena directly (splash → day 1)
- [ ] Pentecost season: "Start the Holy Spirit Novena →" opens Holy Spirit novena directly
- [ ] Practice strip "Novenas" card still opens the novena index (no regression)
- [ ] If the user already has an in-progress St. Joseph novena, deep-link resumes at current day
- [ ] If no progress exists, starts at day 1 with splash

---

## NPT-02 — Liturgical Calendar Sorting for Novena List

**ID:** NPT-02  
**Category:** enhancement  
**Backlog:** IDEA-116  
**Priority:** P2

**Problem:**  
The novena select screen (`_renderSelect` in `src/novena.js`) sorts in-progress novenas to the top (BT4-06 implementation), then lists everything else alphabetically. But novenas have liturgical seasons where they're most relevant: St. Joseph in March, Divine Mercy starting Good Friday, Holy Spirit from Ascension to Pentecost, Sacred Heart in June, St. Patrick around March 17. The list feels static year-round.

**Fix:**

Add a "Suggested Now" section above the general list, populated by matching the current date against a novena-to-season map. The map uses litcal data already cached in `window._litcalCache`.

**Novena season map** (add as a constant at the top of `src/novena.js`):

```js
var NOVENA_SEASONS = [
  { id: 'st_joseph', startMonth: 2, startDay: 10, endMonth: 2, endDay: 19, reason: 'His feast is March 19' },
  { id: 'st_patrick', startMonth: 2, startDay: 8, endMonth: 2, endDay: 17, reason: 'His feast is March 17' },
  { id: 'divine_mercy', litcalKey: 'GoodFri', daysAfter: 0, duration: 9, reason: 'Begins Good Friday' },
  { id: 'holy_spirit', litcalKey: 'Ascension', daysAfter: 0, duration: 9, reason: 'Ascension to Pentecost' },
  { id: 'sacred_heart', startMonth: 5, startDay: 3, endMonth: 5, endDay: 12, reason: 'His feast is in June' },
  { id: 'st_andrew_christmas', startMonth: 10, startDay: 21, endMonth: 11, endDay: 24, reason: 'Preparing for Christmas' }
];
```

**Rendering logic** in `_renderSelect`:

After the "Your Active Novenas" master card, before the general list:

1. Compute today's date
2. For each entry in `NOVENA_SEASONS`, check if today falls within the date range (fixed dates) or within `daysAfter` + `duration` of a litcal key date (movable dates)
3. If a match is found AND the novena is NOT already in-progress, render a "Suggested Now" section with a sacred-accented border-left and the `reason` as subtitle
4. If the novena IS in-progress, it's already in the active section — skip it here

**Visual treatment for "Suggested Now" items:**

```css
.novena-item--suggested { border-left: 3px solid var(--color-sacred); background: var(--color-sacred-pale); }
html[data-theme="dark"] .novena-item--suggested { background: color-mix(in srgb, var(--color-sacred) 6%, transparent); }
```

Add a section label above suggested items:

```html
<div class="novena-section-label">Suggested Now</div>
```

Reuse the existing `.novena-section-label` styling from BT4-06.

**Dark mode:** Covered by the dark rule above.

**Test checklist:**
- [ ] Between March 10–19: St. Joseph novena appears in "Suggested Now" with "His feast is March 19"
- [ ] If St. Joseph novena is already in-progress, it shows in Active instead, not duplicated
- [ ] Outside any season window, "Suggested Now" section does not render
- [ ] Multiple novenas can be suggested simultaneously (e.g., St. Patrick and St. Joseph overlap March 10–17)
- [ ] Novenas not in any season window remain in the general alphabetical list
- [ ] Dark mode: suggested items have subtle sacred background tint

---

## NPT-03 — Practice Tracker Cards: Show Next Upcoming Date

**ID:** NPT-03  
**Category:** enhancement  
**Backlog:** IDEA-131  
**Priority:** P2

**Problem:**  
The Novena and First Friday/Saturday tracker cards on the More tab practice strip show generic subtitles ("Start a novena", "Track devotion") when no active devotion exists. They could instead show the next upcoming relevant date, making the trackers feel time-aware. Sarah sees "Next: Fri Apr 3" and thinks "oh, I should plan for that."

**Fix:**

Enhance the subtitle computation in the practice strip rendering block (`src/more.js`, lines ~936–975).

**For First Friday/Saturday** (when `!ctx.ffActive`):

Compute the next First Friday and First Saturday from today's date:

```js
function _getNextFirstFriSat() {
  var now = new Date();
  var y = now.getFullYear();
  var m = now.getMonth();
  // Try this month first, then next month
  for (var offset = 0; offset < 2; offset++) {
    var testMonth = m + offset;
    var testYear = y;
    if (testMonth > 11) { testMonth -= 12; testYear++; }
    // First Friday: first day where getDay()===5
    for (var d = 1; d <= 7; d++) {
      var fri = new Date(testYear, testMonth, d);
      if (fri.getDay() === 5) {
        // First Saturday is the next day
        var sat = new Date(testYear, testMonth, d + 1);
        if (fri > now || sat > now) {
          var opts = { month: 'short', day: 'numeric' };
          return 'Next: ' + fri.toLocaleDateString('en-US', opts) + ' & ' + sat.toLocaleDateString('en-US', opts);
        }
        break;
      }
    }
  }
  return 'Track devotion';
}
```

**In the practice strip block**, replace the fallback subtitle:

**Before:**
```js
var ffLabel = ctx.ffActive ? ctx.ffLabel : 'Track devotion';
```

**After:**
```js
var ffLabel = ctx.ffActive ? ctx.ffLabel : _getNextFirstFriSat();
```

Note: The exact location of `ctx.ffLabel` fallback assignment may be in the `_buildPrayerContext` function or inline. Search for the string `'Track devotion'` in `src/more.js` and replace with a call to `_getNextFirstFriSat()`.

**For Novenas** (when `!ctx.novenaActive` and no seasonal override):

The seasonal novena logic at lines 940–957 already computes seasonal labels. When no seasonal label and no active novena, the fallback is `'Start a novena'`. Replace with the next suggested novena from the NPT-02 season map (if NPT-02 is implemented), or keep `'Start a novena'` as fallback. This is a nice-to-have enhancement on top of NPT-02.

**Dark mode:** No impact — text inherits tokens.

**Test checklist:**
- [ ] When no First Friday streak is active, card shows "Next: Apr 3 & Apr 4" (or correct upcoming dates)
- [ ] When First Friday streak IS active, existing progress label still shows (no regression)
- [ ] Date rolls forward after the first Friday/Saturday pass
- [ ] Novena card: when seasonal label applies, it takes priority over date display
- [ ] Subtitle does not truncate on 375px viewport

---

## Summary

| ID | Title | Priority | Files |
|----|-------|----------|-------|
| NPT-01 | Novena CTAs deep-link with ID | P1 | more.js:561, more.js:633 |
| NPT-02 | Liturgical calendar sorting for novena list | P2 | novena.js, app.css |
| NPT-03 | Practice tracker next-date subtitles | P2 | more.js:~936-975 |
