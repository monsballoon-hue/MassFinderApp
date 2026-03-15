# Claude Code Implementation Prompt — PMD Series (Devotions Expansion)

**Spec:** `docs/plans/UX_Spec_Pocket_Missal_Devotions.md`
**Prefix:** PMD
**Depends on:** PMG (Grid Restructure) must be shipped first
**Can be done in parallel with:** PMB (Prayer Book) — no interdependencies except PMD-06 links to Prayer Book

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css   # verify tokens
cat CLAUDE.md            # read conventions
cat docs/plans/UX_Spec_Pocket_Missal_Devotions.md  # read full spec
# Verify PMG has shipped:
grep "prayer-tools-secondary" index.html
# Study existing rosary module for pattern reference:
head -200 src/rosary.js
```

---

## Implementation Order

### Phase A: Novena Data + Variable Day Count (ship independently)

#### 1. PMD-04 — Novena Data Expansion

**Files:** `data/prayers.json`

Add 6 new novenas to the `novenas` array. Each novena needs:
- `id` (string, snake_case)
- `title` (display name)
- `description` (one-line description for selection screen)
- `days` array with objects: `{ day: N, title: "Day N", meditation: "...", prayer: "..." }`

**Novenas to add (in this order within the array):**

1. `surrender` — Surrender Novena (Fr. Dolindo Ruotolo). 9 days. Each day has a unique meditation from Fr. Dolindo + the response "O Jesus, I surrender myself to You, take care of everything!" Source the traditional English translations of all 9 meditations.

2. `sacred_heart` — Sacred Heart Novena. 9 days. Traditional prayers to the Sacred Heart of Jesus. Include the Litany of the Sacred Heart on Day 1 or as an optional element.

3. `st_jude` — Novena to St. Jude. 9 days. Traditional novena to the patron of desperate causes.

4. `miraculous_medal` — Novena to Our Lady of the Miraculous Medal. 9 days. Traditional Marian novena.

5. `st_andrew_christmas` — Christmas Novena (St. Andrew). **25 days** (Nov 30 – Dec 25). Each day has the same single prayer repeated 15 times. Structure the `days` array with 25 entries. The prayer text: "Hail and blessed be the hour and moment in which the Son of God was born of the most pure Virgin Mary, at midnight, in Bethlehem, in piercing cold. In that hour, vouchsafe, O my God, to hear my prayer and grant my desires, through the merits of Our Saviour Jesus Christ and of His Blessed Mother. Amen." Each day's `meditation` can note "Repeat this prayer 15 times" and the `prayer` field contains the text once.

6. `st_patrick` — Novena to St. Patrick. 9 days. Prayers invoking St. Patrick's intercession for faith, conversion, and protection.

**After adding, validate:**
```bash
node -e "var d=JSON.parse(require('fs').readFileSync('data/prayers.json'));console.log('Novenas:',d.novenas.length);d.novenas.forEach(function(n){console.log(n.id,n.days.length+'d')})"
```

Expected output: 9 novenas total (3 existing + 6 new), with the Christmas Novena showing 25 days.

**Also:** Remove the "More novenas are coming soon" note from `src/novena.js`. Search for `novena-more-note` and delete that HTML block from `_renderSelect()`.

#### 2. PMD-05 — Variable Day Count Support

**Files:** `src/novena.js`

**Step 1:** Find all hardcoded `9` references in novena.js and replace with data-driven values:

```bash
grep -n ' 9 ' src/novena.js
grep -n '"9"' src/novena.js
grep -n "'9'" src/novena.js
grep -n 'of 9' src/novena.js
```

Replace patterns:
- `for (var d = 0; d < 9; d++)` → `for (var d = 0; d < nov.days.length; d++)`
- `'Day ' + dayNum + ' of 9'` → `'Day ' + dayNum + ' of ' + totalDays`
- Any `completedDays.length >= 9` → `completedDays.length >= totalDays`

**Step 2:** In `_renderSelect()`, add progress bar for high day counts:

```javascript
var totalDays = nov.days.length;
if (totalDays <= 12) {
  // Existing dots pattern
  dotsHtml = '<div class="novena-master-dots">';
  for (var d = 0; d < totalDays; d++) {
    var dotCls = 'novena-master-dot';
    if ((item.tracking.completedDays || []).indexOf(d + 1) >= 0) dotCls += ' done';
    dotsHtml += '<div class="' + dotCls + '"></div>';
  }
  dotsHtml += '</div>';
} else {
  // Progress bar for 25-day novena etc.
  var pct = Math.round(((item.tracking.completedDays || []).length / totalDays) * 100);
  dotsHtml = '<div class="novena-progress-bar"><div class="novena-progress-fill" style="width:' + pct + '%"></div></div>';
}
```

**Step 3:** Add CSS for progress bar (see spec PMD-05 for exact CSS). Place near existing `.novena-master-dots` styles.

**Step 4:** Export `_getTotalDays()` for use by more.js subtitle:

```javascript
function _getTotalDays(novenaId) {
  if (!_data || !_data.novenas) return 9;
  var nov = _data.novenas.filter(function(n) { return n.id === novenaId; })[0];
  return nov ? nov.days.length : 9;
}
```

Add to module.exports: `_getTotalDays: _getTotalDays`

**Step 5:** Update `_getNovenaSubtitle()` in `src/more.js` to use the exported function instead of assuming 9 days.

---

### Phase B: Divine Mercy Chaplet (main new feature)

#### 3. PMD-01 + PMD-02 — Create `src/chaplet.js`

New module following `src/rosary.js` pattern. See spec PMD-01 and PMD-02 for complete behavior.

**Key implementation notes:**

- Register with `reader.registerModule('chaplet', { ... })`
- Lazy-load from `data/prayers.json` (the `chaplet` key)
- Opening prayers reference existing `prayers` object by ID — reuse text, don't duplicate
- 5 decades: large bead shows `decade_large` text, 10 small beads show `decade_small` text
- Closing: 3 repetitions of `closing` text with counter
- Wake lock: acquire on enter, release on close
- Swipe navigation: same pattern as rosary.js touchstart/touchend
- Haptic on each bead advance

**State management:**
```javascript
var _screen = 'intro';   // 'intro' | 'opening' | 'decade' | 'closing' | 'complete'
var _decade = 0;          // 0-4
var _bead = 0;            // 0-10 (0=large bead, 1-10=small beads)
var _openingStep = 0;     // 0-3 (Sign of Cross, Our Father, Hail Mary, Creed)
var _closingRep = 0;      // 0-2 (three repetitions of Holy God)
```

**Advance logic:**
```javascript
function _advance() {
  _haptic('light');
  if (_screen === 'intro') { _screen = 'opening'; _openingStep = 0; }
  else if (_screen === 'opening') {
    _openingStep++;
    if (_openingStep >= 4) { _screen = 'decade'; _decade = 0; _bead = 0; }
  }
  else if (_screen === 'decade') {
    _bead++;
    if (_bead > 10) {
      _decade++;
      _bead = 0;
      if (_decade >= 5) { _screen = 'closing'; _closingRep = 0; }
    }
  }
  else if (_screen === 'closing') {
    _closingRep++;
    if (_closingRep >= 3) { _screen = 'complete'; }
  }
  _render();
}
```

**Bead counter visual:** Reuse the rosary's bead arc pattern. The chaplet uses standard rosary beads so the visual is identical. Import or duplicate the SVG generation from rosary.js, or create a simplified version:

```javascript
function _renderBeadCounter(current, total) {
  // Simple dot row (not the full rosary arc)
  var html = '<div class="chaplet-beads">';
  for (var i = 1; i <= total; i++) {
    var cls = 'chaplet-bead';
    if (i < current) cls += ' chaplet-bead--done';
    if (i === current) cls += ' chaplet-bead--active';
    html += '<div class="' + cls + '"></div>';
  }
  html += '</div>';
  return html;
}
```

#### 4. PMD-01 — Add chaplet data to `data/prayers.json`

Add the `chaplet` key to `prayers.json` with all prayer texts. See spec PMD-01 for the exact data structure. The prayers are:

- `decade_large`: "Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world."
- `decade_small`: "For the sake of His sorrowful Passion, have mercy on us and on the whole world."
- `closing`: "Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world."
- `optional_closing`: The full closing prayer (see spec for text)

#### 5. PMD-03 — Grid Card + Contextual Promotion

**Files:** `src/more.js`, `src/app.js`

**src/app.js:** Add require and window binding:
```javascript
var chaplet = require('./chaplet.js');
window.openChaplet = function() { chaplet.open(); };
```

**src/chaplet.js:** Export:
```javascript
module.exports = {
  open: function() { reader.readerOpen('chaplet'); }
};
```

**src/more.js:** Add to `ptCards` array as tier-1 card:
```javascript
{ id: 'chaplet', title: 'Divine Mercy Chaplet', subtitle: _getChapletSubtitle(), action: 'openChaplet()', active: true, tier: 1 }
```

Add `_getChapletSubtitle()` function (see spec PMD-03).

Add icon, colors:
```javascript
ptIcons.chaplet = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>';
ptColors.chaplet = 'var(--color-sacred)';
ptBgColors.chaplet = 'var(--color-sacred-pale)';
```

Add 3 PM promotion logic to the `promotedId` chain (after existing checks, see spec PMD-03).

---

### Phase C: Seasonal Integration (lightweight, do last)

#### 6. PMD-06 — Angelus Seasonal Moment Candidate

**Files:** `src/more.js`

Add the Angelus/Regina Caeli candidate to `_renderSeasonalMoment()`. See spec PMD-06 for the full code block. Place after the Monthly Devotion candidate. Use `priority: 3.5`.

This is ~30 lines of code added to an existing function. The prayer text for the Angelus and Regina Caeli should be hardcoded in the seasonal card (they're short — ~120 words and ~60 words respectively). Include the "See in Prayer Book →" action that calls `openPrayerBook('angelus')` (requires PMB to be shipped for the link to work — if PMB hasn't shipped yet, omit the action link and add it later).

#### 7. PMD-07 — Cross-Links

**Files:** `src/more.js`

Add to the existing Divine Mercy Sunday seasonal card (SOT-07, ~line 460):
```javascript
+ '<div class="seasonal-card-action" onclick="event.stopPropagation();openChaplet()">Pray the Divine Mercy Chaplet \u2192</div>'
```

---

### Phase D: CSS + Dark Mode

#### 8. PMD-08 — All CSS

**Files:** `css/app.css`

Add all chaplet CSS classes from spec PMD-02. Place near the existing rosary styles.
Add novena progress bar CSS from spec PMD-05.
Verify dark mode for all new elements.

---

## Build & Deploy

```bash
npm run build
# Bump SW cache version in sw.js
```

---

## Test Checklist

**Novenas:**
1. All 9 novenas appear in novena tracker selection screen
2. Christmas Novena shows 25 days with progress bar (not dots)
3. Standard novenas still show 9 dots
4. Day labels read "Day X of Y" with correct Y
5. "More novenas are coming soon" note removed
6. Tracking works for all new novenas (start, log days, complete)

**Chaplet:**
7. Chaplet card appears in primary grid
8. Subtitle shows "The Hour of Mercy" between 2:30-3:30 PM
9. Tapping opens chaplet with intro screen
10. Begin → 4 opening prayers → 5 decades (11 beads each) → 3 closings → complete
11. Bead counter advances correctly
12. Swipe left/right works
13. Haptic on each bead advance
14. Wake lock active (screen stays on)
15. Large bead / small bead prayers display correct text
16. Complete screen has close button

**Seasonal:**
17. Angelus card appears in seasonal moment zone (outside Easter)
18. Regina Caeli card appears during Easter season
19. Divine Mercy Sunday card has chaplet link
20. Chaplet link opens chaplet from seasonal card

**Dark mode:**
21. Chaplet intro screen readable
22. Chaplet prayer screens readable
23. Novena progress bar visible
24. Seasonal cards follow existing dark treatment

---

## Important Notes

- CommonJS only — no arrow functions, no `let`/`const`
- Follow rosary.js patterns exactly for: wake lock, swipe detection, haptics, screen transitions
- The chaplet `_load()` fetches `data/prayers.json` — same file as rosary/novena, already cached in SW
- Opening prayers reference IDs from the `prayers` object in prayers.json — use `_data.prayers.our_father.text` etc.
- All new prayer texts must be sourced from traditional Catholic texts (public domain, centuries-old)
- The 6 novena texts are the most time-consuming part — each has 9 (or 25) unique daily entries that need careful sourcing
- Bump SW cache version after all changes
