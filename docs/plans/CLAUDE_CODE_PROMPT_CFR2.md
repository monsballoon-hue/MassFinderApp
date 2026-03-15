# Claude Code Implementation Prompt — CFR2: Seasonal Sunday Rosary Mystery

**BACKLOG ref:** IDEA-083
**Source:** Catholic Fidelity Review 2026-03-15, item R3 follow-up
**Prefix:** CFR2
**Priority:** Low — enhancement

---

## Instructions

Expand the Rosary module's Sunday mystery selection to vary by liturgical season, per *Rosarium Virginis Mariae* (John Paul II, 2002), §38.

**Current state:** `dayMysteries.sunday` is `"Glorious"` (corrected in `content-additions` branch). The `_todaySet()` function in `rosary.js` already has a Lent override that changes Joyful → Sorrowful on non-Saturday days, but it doesn't handle Sunday-specific seasonal logic.

**Target state:** Sunday mystery follows RVM §38:
- Advent / Christmas → Joyful
- Lent → Sorrowful
- Easter / Ordinary Time → Glorious (default)

**Rules:**
- CommonJS everywhere, no arrow functions
- Reuse existing season detection — do not duplicate litcal logic
- If season data is unavailable, fall back to Glorious (the JSON default)
- No UI changes — the correct mystery simply loads automatically

---

## CFR2-01 — Add `getLiturgicalSeason()` to utils.js (P1)

**File:** `src/utils.js`

The app already has `isLentSeason()` (line ~58) which checks `window._litcalCache.events`. Add a general-purpose season getter following the same pattern:

```js
// CFR2-01: General liturgical season getter
function getLiturgicalSeason() {
  if (window._litcalCache && window._litcalCache.events) {
    var now = getNow(), m = now.getMonth() + 1, d = now.getDate();
    var today = window._litcalCache.events.filter(function(e) {
      return e.month === m && e.day === d;
    });
    if (today.length) return (today[0].liturgical_season || '').toUpperCase();
  }
  return '';
}
```

**Add to exports** (line ~380):

```js
getLiturgicalSeason: getLiturgicalSeason,
```

**Season values** in the litcal data (verify against `data/litcal-2026.json`): `ADVENT`, `CHRISTMAS`, `LENT`, `EASTER`, `ORDINARY_TIME` (confirm exact casing and underscoring by inspecting the file).

**Fallback:** Returns empty string if litcal not loaded. Callers must handle this.

---

## CFR2-02 — Update `_todaySet()` in rosary.js (P1)

**File:** `src/rosary.js` (line ~82)

Replace the current `_todaySet()` function:

**Before:**
```js
function _todaySet() {
  if (!_data) return 'Joyful';
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var today = days[new Date().getDay()];
  var set = _data.dayMysteries[today] || 'Joyful';
  // During Lent, Sorrowful is traditional on days that would otherwise be Joyful
  if (utils.isLentSeason() && set === 'Joyful' && today !== 'saturday') {
    set = 'Sorrowful';
  }
  return set;
}
```

**After:**
```js
function _todaySet() {
  if (!_data) return 'Joyful';
  var days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  var today = days[new Date().getDay()];
  var set = _data.dayMysteries[today] || 'Joyful';
  var season = utils.getLiturgicalSeason();

  // RVM §38: Sunday mystery varies by liturgical season
  if (today === 'sunday' && season) {
    if (season === 'ADVENT' || season === 'CHRISTMAS') {
      set = 'Joyful';
    } else if (season === 'LENT') {
      set = 'Sorrowful';
    }
    // Easter + Ordinary Time = Glorious (the default from dayMysteries)
  }

  // Non-Sunday Lent override (existing behavior): Joyful → Sorrowful except Saturday
  if (today !== 'sunday' && utils.isLentSeason() && set === 'Joyful' && today !== 'saturday') {
    set = 'Sorrowful';
  }

  return set;
}
```

**Key detail:** The Sunday check runs first (keyed on the new `getLiturgicalSeason()`), then the existing non-Sunday Lent override runs second. This avoids double-overriding Sunday.

---

## CFR2-03 — Update season label on selection screen (P2)

**File:** `src/rosary.js` (line ~348)

The selection screen already shows `"Lenten Season"` when `isLent` is true. Expand to show the season for Advent/Christmas as well:

**Before:**
```js
var isLent = utils.isLentSeason();
```
```js
+ (isLent ? '<p class="rosary-select-season">Lenten Season</p>' : '')
```

**After:**
```js
var season = utils.getLiturgicalSeason();
var seasonLabel = '';
if (season === 'ADVENT') seasonLabel = 'Advent Season';
else if (season === 'CHRISTMAS') seasonLabel = 'Christmas Season';
else if (season === 'LENT') seasonLabel = 'Lenten Season';
else if (season === 'EASTER') seasonLabel = 'Easter Season';
```
```js
+ (seasonLabel ? '<p class="rosary-select-season">' + seasonLabel + '</p>' : '')
```

Also remove the now-redundant `var isLent = utils.isLentSeason();` line.

---

## Pre-implementation: Verify litcal season values

Before coding, run this to confirm exact season strings in the litcal data:

```bash
python3 -c "
import json
with open('data/litcal-2026.json') as f:
    d = json.load(f)
seasons = set()
for e in d.get('events', d if isinstance(d, list) else []):
    s = e.get('liturgical_season', '')
    if s: seasons.add(s)
print('Season values:', sorted(seasons))
"
```

If the values differ from `ADVENT`, `CHRISTMAS`, `LENT`, `EASTER`, `ORDINARY_TIME`, adjust the string comparisons in CFR2-01 and CFR2-02 accordingly.

---

## Test Checklist

- [ ] Verify litcal season string values match spec (run pre-implementation command)
- [ ] Sunday during Ordinary Time → Glorious mysteries
- [ ] Sunday during Advent → Joyful mysteries
- [ ] Sunday during Christmas → Joyful mysteries
- [ ] Sunday during Lent → Sorrowful mysteries
- [ ] Sunday during Easter → Glorious mysteries (default, no override needed)
- [ ] Monday–Saturday → unchanged regardless of season
- [ ] Non-Sunday during Lent: Joyful still overrides to Sorrowful (existing behavior preserved)
- [ ] Saturday during Lent: Joyful stays Joyful (existing Saturday exception preserved)
- [ ] Litcal data unavailable → Sunday falls back to Glorious (empty string from getLiturgicalSeason)
- [ ] Selection screen shows season label for Advent/Christmas/Lent/Easter
- [ ] Selection screen shows no season label during Ordinary Time
- [ ] `utils.getLiturgicalSeason()` is exported and accessible
