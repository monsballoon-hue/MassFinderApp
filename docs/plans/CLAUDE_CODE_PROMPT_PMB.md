# Claude Code Implementation Prompt — PMB Series (Prayer Book Module)

**Spec:** `docs/plans/UX_Spec_Pocket_Missal_PrayerBook.md`
**Prefix:** PMB
**Depends on:** PMG (Grid Restructure) must be shipped first
**Priority:** P1 — the single biggest content gap in the app

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css   # verify tokens
cat CLAUDE.md            # read conventions
cat docs/plans/UX_Spec_Pocket_Missal_PrayerBook.md  # read full spec
# Verify PMG has shipped:
grep "prayer-tools-secondary" index.html  # should find the secondary grid div
```

---

## Implementation Order

### 1. PMB-01 — Create `data/prayerbook.json`

Create the data file with all prayer content. See spec PMB-01 for the full structure and category breakdown.

**Categories and prayers to include:**

Essential Prayers (~10): Our Father, Hail Mary, Glory Be, Sign of the Cross, Apostles' Creed, Nicene Creed, Confiteor, Act of Contrition (traditional), Act of Contrition (modern), Hail Holy Queen

Morning & Evening (~7): Morning Offering, Guardian Angel Prayer, Grace Before Meals, Grace After Meals, Act of Faith, Act of Hope, Act of Charity

Marian Prayers (~7): Memorare, Angelus (V/R format), Regina Caeli (V/R format), Sub Tuum Praesidium, Alma Redemptoris Mater, Ave Regina Caelorum, Magnificat

Prayers to Saints (~4): St. Michael the Archangel, Prayer of St. Francis, Prayer to St. Anthony, Anima Christi

Sacramental (~3): Act of Spiritual Communion, Prayer Before the Blessed Sacrament, Eternal Rest

Litanies (2): Litany of Humility (18 invocations + closing), Litany of Trust (28 invocations + closing) — type: `"litany"` with `invocations` array

Contemplative (1): Lectio Divina — type: `"lectio"` (no prayer text — it's a guided method)

**Data format conventions:**
- Use `\n` for line breaks within prayer text
- V/R prayers prefix lines with `V. ` and `R. ` for formatter detection
- Include `aka` field for search (e.g., `"aka": "Lord's Prayer, Pater Noster"`)
- Include `tags` array for future filtering
- Litanies use `invocations` array with `text` and `response` per item
- Validate JSON after creation: `node -e "JSON.parse(require('fs').readFileSync('data/prayerbook.json'))"`

**Source all prayer texts from traditional Catholic sources. These are public domain texts — use standard English translations.**

### 2. PMB-02 + PMB-03 + PMB-04 — Create `src/prayerbook.js`

New module. Follow the pattern established by `src/novena.js` for reader module registration.

**Core structure:**
```javascript
// src/prayerbook.js
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');

var _data = null;
var _screen = 'list';       // 'list' | 'litany' | 'lectio'
var _filterQuery = '';
var _litanyState = null;     // { litany, step, total }
var _lectioState = null;     // { step: 0-4, gospelText, gospelRef }

reader.registerModule('prayerbook', {
  getTitle: function() { return 'Prayer Book'; },
  getHeaderExtra: function() {
    if (_screen === 'list') return _searchHtml();
    return '';
  },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    _load().then(function() {
      if (params && params.prayerId) {
        _screen = 'list';
        _renderList(bodyEl, params.prayerId);
      } else {
        _screen = 'list';
        _renderList(bodyEl);
      }
    });
  },
  onClose: function() {
    _screen = 'list';
    _filterQuery = '';
    _litanyState = null;
    _lectioState = null;
    _releaseWakeLock();
  }
});
```

**Key functions to implement:**
1. `_load()` — lazy fetch of `data/prayerbook.json`
2. `_renderList(bodyEl, scrollToId)` — categorized prayer list with expand/collapse
3. `_searchHtml()` — returns search input for reader header extra
4. `_filterPrayers(query)` — search against title, aka, tags
5. `_formatPrayerText(text)` — handles V/R formatting (see PMB-05)
6. `_openLitany(litanyData, bodyEl)` — enters step-through mode (PMB-06)
7. `_renderLitanyStep(bodyEl)` — renders current litany invocation
8. `_openLectio(bodyEl)` — enters Lectio Divina mode (PMB-07)
9. `_renderLectioStep(bodyEl)` — renders current Lectio step

**Prayer list rendering pattern:**
Use `<details>` for each prayer (matching the reading entry pattern on More tab). Category headers as sticky labels. Accordion behavior: use JS to close other open details when one opens.

**Search wiring:**
After rendering the list, attach an `input` event listener to `#prayerBookSearch` that calls `_filterPrayers()` and re-renders the list body (not the header).

**Litany detection:**
When user taps a prayer with `type: "litany"`, call `_openLitany()` instead of expanding inline text. The litany renders in the same reader body — no new reader module needed.

**Lectio detection:**
When user taps the Lectio Divina entry (type: `"lectio"`), call `_openLectio()`. This fetches today's Gospel from the readings module:
```javascript
var readings = require('./readings.js');
// readings.fetchReadings() returns a promise; cache the gospel text
```

**Exports:**
```javascript
module.exports = {
  open: function(prayerId) {
    reader.readerOpen('prayerbook', prayerId ? { prayerId: prayerId } : {});
  }
};
```

### 3. PMB-08 — Grid Card in more.js

**Files:** `src/more.js`, `src/app.js`

**src/app.js:** Add require and window binding:
```javascript
var prayerbook = require('./prayerbook.js');
window.openPrayerBook = function(id) { prayerbook.open(id); };
```

**src/more.js:** Add to `ptCards` array as first tier-1 card:
```javascript
{ id: 'prayerbook', title: 'Prayer Book', subtitle: '25 essential prayers', action: 'openPrayerBook()', active: true, tier: 1 }
```

Add icon, colors to the respective objects:
```javascript
ptIcons.prayerbook = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></svg>';
ptColors.prayerbook = 'var(--color-sacred)';
ptBgColors.prayerbook = 'var(--color-sacred-pale)';
```

### 4. PMB-09 — CSS + Dark Mode

**Files:** `css/app.css`

Add all CSS classes from spec sections PMB-03 through PMB-07. Place after the existing prayer tool card styles.

For every new class, verify it works in dark mode. Use CSS custom properties (`var(--color-*)`) throughout — this ensures most styles auto-adapt. Add explicit `html[data-theme="dark"]` overrides only where needed (see spec PMB-09).

### 5. Build & Cache

**Files:** `sw.js`

Add `'/data/prayerbook.json'` to the cache list in `sw.js` so the prayer book works offline.

Run `npm run build` to verify everything compiles.

---

## Test Checklist

1. `npm run build` succeeds
2. Prayer Book card appears in primary grid (top-left after PMG ships)
3. Tapping card opens reader with "Prayer Book" title
4. All categories visible with prayer rows beneath
5. Tapping a prayer row expands full text in Georgia font
6. Accordion behavior: opening one prayer closes the previously open one
7. Search: typing "memorare" filters to Memorare only
8. Search: typing "guardian" finds Guardian Angel Prayer
9. Search: clearing search restores full categorized list
10. V/R prayers: Angelus shows proper leader/response formatting
11. Litany of Humility: tapping enters step-through mode, not inline expand
12. Litany step-through: invocations advance with tap/swipe
13. Litany progress bar fills correctly
14. Litany closing prayer appears after final invocation
15. Lectio Divina: intro shows today's Gospel reference
16. Lectio 4 steps render correctly (read → meditate → pray → contemplate)
17. Wake lock active during litany and lectio divina
18. Haptic on litany step advance
19. Dark mode: all screens readable
20. Offline: prayer book loads from cache after first fetch
21. Back button in reader returns to Prayer Book list (not More tab) when in litany/lectio

---

## Important Notes

- CommonJS only — no arrow functions, no `let`/`const`
- `var esc = utils.esc` — always escape user-facing text
- Follow rosary.js patterns for wake lock acquire/release
- Follow novena.js patterns for reader module registration
- The `_formatPrayerText()` V/R detection must NOT affect prayers without V/R markers
- Litany swipe detection: reuse rosary.js touchstart/touchend pattern with 50px horizontal threshold
- All prayer texts must be sourced from traditional Catholic prayers — these are centuries-old public domain texts
- Bump SW cache version after changes
