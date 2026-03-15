# UX Spec — Pocket Missal: Devotions Expansion

**Date:** 2026-03-14
**Author:** UX Consultant (Claude Opus)
**Status:** Implemented
**Depends on:** PMG (Grid Restructure)
**Prefix:** PMD

| Item | Title | Status |
|------|-------|--------|
| PMD-01 | Divine Mercy Chaplet — Reader Module | done |
| PMD-02 | Divine Mercy Chaplet — Guided Bead Experience | done |
| PMD-03 | Divine Mercy Chaplet — Grid Card & Contextual Promotion | done |
| PMD-04 | Novena Data Expansion (6 new novenas) | done |
| PMD-05 | Novena Tracker — Variable Day Count Support | done |
| PMD-06 | Angelus / Regina Caeli — Seasonal Moment Candidate | done |
| PMD-07 | Seasonal Card Cross-Links to New Tools | done |
| PMD-08 | Dark Mode Parity | done |

---

## Context

The Pocket Missal plan adds two prayer tool modules and a data expansion that work alongside the existing reader infrastructure. The Divine Mercy Chaplet is the single highest-ROI guided prayer tool — it reuses the rosary's bead-prayer architecture, serves the second most popular bead devotion in the American Church, and ties into existing seasonal content (Divine Mercy Sunday card, Divine Mercy Novena). The novena expansion fills a "sparse" feeling with 6 curated additions. The Angelus card uses the existing seasonal moment zone.

---

## [PMD-01] Divine Mercy Chaplet — Reader Module

**Files:** NEW `src/chaplet.js`, `src/app.js`

### Module Structure

The chaplet module follows the rosary pattern exactly — register with `reader.js`, manage screens internally, lazy-load prayer data.

```javascript
// src/chaplet.js
var utils = require('./utils.js');
var _haptic = require('./haptics.js');
var reader = require('./reader.js');

var _data = null;
var _screen = 'intro';   // 'intro' | 'opening' | 'decade' | 'closing'
var _decade = 0;          // 0-4
var _bead = 0;            // 0-9 (small beads within decade)
var _wakeLock = null;

reader.registerModule('chaplet', {
  getTitle: function() { return 'Divine Mercy Chaplet'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    _load().then(function() {
      _screen = 'intro';
      _decade = 0;
      _bead = 0;
      _render();
      _acquireWakeLock();
    });
  },
  onClose: function() { _releaseWakeLock(); }
});
```

### Data Structure

Add to `data/prayers.json` under a new `chaplet` key:

```json
{
  "chaplet": {
    "title": "The Divine Mercy Chaplet",
    "origin": "Given by Jesus to St. Faustina Kowalska, 1935",
    "quote": { "text": "Say unceasingly the chaplet that I have taught you.", "ref": "Diary, 687" },
    "opening": ["sign_of_cross", "our_father", "hail_mary", "apostles_creed"],
    "decade_large": "Eternal Father, I offer You the Body and Blood, Soul and Divinity of Your dearly beloved Son, Our Lord Jesus Christ, in atonement for our sins and those of the whole world.",
    "decade_small": "For the sake of His sorrowful Passion, have mercy on us and on the whole world.",
    "closing": "Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world.",
    "closing_repeats": 3,
    "optional_closing": "Eternal God, in whom mercy is endless and the treasury of compassion inexhaustible, look kindly upon us and increase Your mercy in us, that in difficult moments we might not despair nor become despondent, but with great confidence submit ourselves to Your holy will, which is Love and Mercy itself. Amen."
  }
}
```

The opening prayers reference IDs from the existing `prayers` object (Our Father, Hail Mary, etc.), so no text duplication.

### Test Checklist

- [ ] Module registers with reader
- [ ] `_load()` fetches data correctly
- [ ] Reader opens with title "Divine Mercy Chaplet"
- [ ] Module appears in window bindings via `app.js`

---

## [PMD-02] Divine Mercy Chaplet — Guided Bead Experience

**Files:** `src/chaplet.js`, `css/app.css`

### Screen Flow

**Intro screen:**
```
         ✙

  THE DIVINE MERCY CHAPLET
  Prayed on ordinary rosary beads

  Given by Jesus to St. Faustina
  Kowalska, 1935

  "Say unceasingly the chaplet
   that I have taught you."
                    — Diary, 687

          [ Begin ]
```

Intro layout: centered, `--font-display` title at `--text-2xl`, origin line in `--font-body` `--text-xs` uppercase, quote in `--font-prayer` italic. Cross icon: `--color-sacred`, 32px SVG.

**Opening prayers (4 sequential screens):**
Sign of the Cross → Our Father → Hail Mary → Apostles' Creed

Each displayed one at a time. Title at top (e.g., "Our Father"), full prayer text in `--font-prayer`, `--text-base`, centered. Tap anywhere or tap "Continue" to advance.

Reuse the rosary's opening prayer rendering pattern from `rosary.js` `_renderOpening()`.

**Decade screens (5 decades × 11 beads each):**

Each decade:
1. **Large bead** — "Eternal Father, I offer You the Body and Blood..." Full text displayed in `--font-prayer`, `--text-base`. This is the distinctive chaplet prayer.
2. **Small beads 1-10** — "For the sake of His sorrowful Passion, have mercy on us and on the whole world." Counter shows bead position within decade.

### Bead Visualization

Reuse the rosary's bead counter visual. The chaplet uses standard rosary beads, so the 10-bead decade arc with active bead highlight works identically.

**Bead colors:** Red/white (Divine Mercy palette). Active bead: `#DC2626` (red). Completed bead: `#EF4444` at 50% opacity. Pending bead: `--color-border-light`.

Alternative approach: Use `--color-sacred` for consistency with the app's sacred content palette. This avoids a one-off color scheme.

**Decade label:** "Decade 1 of 5" in `--font-body`, `--text-xs`, `--color-text-tertiary`, centered above the bead counter.

### Closing Screen

Three repetitions of "Holy God, Holy Mighty One, Holy Immortal One, have mercy on us and on the whole world." — displayed as a single text with a counter "1 of 3", "2 of 3", "3 of 3". Tap to advance through each.

Then the optional closing prayer, displayed in `--font-prayer`, italic, with "Amen" as a "Complete" button.

### Navigation

- Tap "Continue" button or tap anywhere on the prayer text area → advance one bead
- Swipe left → advance one bead
- Swipe right → go back one bead
- Haptic on each bead advance (`_haptic('light')`)
- Wake lock active throughout

### Condensed Mode (v2)

Not in this spec. Future enhancement: a "condensed mode" toggle (like the rosary's FGP-04) that shows only the decade count and bead position without full prayer text, for users who have the prayers memorized.

### CSS

```css
.chaplet-intro {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-4);
  min-height: 60vh;
  justify-content: center;
}
.chaplet-intro-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: var(--space-2);
}
.chaplet-intro-origin {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-sacred-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-5);
}
.chaplet-intro-quote {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 280px;
  margin-bottom: var(--space-6);
}
.chaplet-intro-ref {
  font-family: var(--font-body);
  font-style: normal;
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}
.chaplet-begin {
  padding: var(--space-3) var(--space-8);
  background: var(--color-sacred);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
}
.chaplet-begin:active { transform: scale(0.97); }

/* Bead prayer screen */
.chaplet-prayer {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-4);
  min-height: 60vh;
  justify-content: center;
}
.chaplet-decade-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-4);
}
.chaplet-prayer-text {
  font-family: var(--font-prayer);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.75;
  max-width: 400px;
}
.chaplet-continue {
  margin-top: var(--space-5);
  padding: var(--space-3) var(--space-6);
  background: transparent;
  border: 1.5px solid var(--color-sacred);
  border-radius: var(--radius-full);
  color: var(--color-sacred-text);
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  min-height: 44px;
  -webkit-tap-highlight-color: transparent;
}
.chaplet-continue:active { transform: scale(0.97); }
```

### Test Checklist

- [ ] Intro screen renders with quote and Begin button
- [ ] Opening prayers display one at a time
- [ ] Large bead prayer displays correctly (the long "Eternal Father..." text)
- [ ] Small bead prayer displays with counter
- [ ] Bead counter advances 1→10 within each decade
- [ ] Decade label advances 1→5 across decades
- [ ] Closing "Holy God..." displays 3 times with counter
- [ ] Optional closing prayer displays after third "Holy God"
- [ ] Swipe left/right navigation works
- [ ] Haptic feedback on each bead advance
- [ ] Wake lock active throughout
- [ ] Tap anywhere on prayer text advances (not just button)
- [ ] Complete button returns to More tab (closes reader)

---

## [PMD-03] Divine Mercy Chaplet — Grid Card & Contextual Promotion

**Files:** `src/more.js`

### Card Definition

```javascript
{ id: 'chaplet', title: 'Divine Mercy Chaplet', subtitle: _getChapletSubtitle(), action: 'openChaplet()', active: true, tier: 1 }
```

### Subtitle Logic

```javascript
function _getChapletSubtitle() {
  var now = new Date();
  var hour = now.getHours();
  var min = now.getMinutes();
  // 2:30 PM - 3:30 PM = "The Hour of Mercy"
  if ((hour === 14 && min >= 30) || hour === 15) {
    return 'The Hour of Mercy';
  }
  return 'Prayed on rosary beads · ~10 min';
}
```

### Icon

Rays radiating from center (Divine Mercy image motif):
```javascript
chaplet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>'
```

### Colors

```javascript
chaplet: 'var(--color-sacred)'
chaplet: 'var(--color-sacred-pale)'
```

### Promotion Logic

Add to the `promotedId` decision tree (~line 890 in more.js):

```javascript
// Near 3 PM (2:30-3:30) — promote Divine Mercy Chaplet
if (!promotedId) {
  var nowH = new Date().getHours();
  var nowM = new Date().getMinutes();
  if ((nowH === 14 && nowM >= 30) || nowH === 15) {
    promotedId = 'chaplet';
  }
}
```

This fires *after* the Lent/confession checks, so Stations during Lent and Exam after 30 days still take priority. The 3 PM promotion is a lower-priority contextual nudge.

### Position

Third card in primary grid (second row, left). Default tier 1.

### Test Checklist

- [ ] Chaplet card appears in primary grid
- [ ] Subtitle shows "The Hour of Mercy" between 2:30-3:30 PM
- [ ] Subtitle shows "Prayed on rosary beads · ~10 min" at other times
- [ ] Tapping opens chaplet reader module
- [ ] Card promoted with border/gradient at 3 PM
- [ ] Promotion does not override Lent/Stations or stale-confession priority

---

## [PMD-04] Novena Data Expansion

**Files:** `data/prayers.json`

### New Novenas (6)

Add to the `novenas` array in `prayers.json`:

1. **Surrender Novena** (Fr. Dolindo Ruotolo)
   - 9 days, each with unique meditation + "O Jesus, I surrender myself to You, take care of everything!"
   - Tags: `["anytime", "trust", "anxiety"]`
   - Description: "A 9-day prayer of total abandonment to God's will"

2. **Sacred Heart Novena**
   - 9 days, traditional timing: 9 days before Sacred Heart feast
   - Tags: `["june", "sacred_heart", "reparation"]`
   - Description: "Nine days of prayer to the Sacred Heart of Jesus"

3. **Novena to St. Jude**
   - 9 days, traditional timing: Oct 19-28
   - Tags: `["anytime", "desperate_causes", "hopeless"]`
   - Description: "Patron of desperate and hopeless causes"

4. **Novena to Our Lady of the Miraculous Medal**
   - 9 days, traditional timing: Nov 18-27
   - Tags: `["anytime", "marian", "miraculous_medal"]`
   - Description: "To Our Lady of the Miraculous Medal"

5. **Christmas Novena (St. Andrew)**
   - 25 days (Nov 30 → Dec 25), single prayer repeated 15× daily
   - Tags: `["advent", "christmas"]`
   - Description: "Traditional Advent prayer — repeated 15 times daily"
   - **Special format:** `days` array has 25 entries, each with the same prayer text but unique day number. See PMD-05 for tracker UI adjustment.

6. **Novena to St. Patrick**
   - 9 days, traditional timing: Mar 8-17
   - Tags: `["march", "irish", "new_england"]`
   - Description: "Patron of Ireland — beloved in New England"

### Data Structure Per Novena

Match existing format:
```json
{
  "id": "surrender",
  "title": "Surrender Novena",
  "description": "A 9-day prayer of total abandonment to God's will",
  "author": "Fr. Dolindo Ruotolo",
  "days": [
    {
      "day": 1,
      "title": "Day 1",
      "meditation": "Why do you confuse yourselves by worrying?...",
      "prayer": "O Jesus, I surrender myself to You, take care of everything!"
    }
  ]
}
```

### Data Size

~9,000 words total across 6 novenas ≈ 40-50KB added to `prayers.json`. The file is already 47KB; this brings it to ~95KB. Still reasonable for a single lazy-loaded fetch.

### Seasonal Auto-Surfacing

The existing `seasonalNovenaLabel` logic in more.js (~line 860) detects litcal events and promotes relevant novenas. The new novenas plug into this system via their tags:
- Sacred Heart: promote when litcal indicates Sacred Heart feast within 14 days
- Christmas/St. Andrew: promote during Advent (Nov 30–Dec 25)
- St. Patrick: promote Mar 8-17

No code change needed in more.js if the seasonal detection already covers these feast days. If not, add event_key checks alongside the existing Divine Mercy and Pentecost checks.

### Test Checklist

- [ ] All 6 novenas appear in novena tracker selection screen
- [ ] Each novena's day 1 text renders correctly in the prayer screen
- [ ] All 9 (or 25) days have content — no empty days
- [ ] Novena descriptions display in the selection list
- [ ] "More novenas are coming soon" note removed from selection screen
- [ ] JSON validates after additions

---

## [PMD-05] Novena Tracker — Variable Day Count Support

**Files:** `src/novena.js`, `css/app.css`

### The Problem

The novena tracker hardcodes `9` in several places:
- Progress dots in `_renderSelect()`: `for (var d = 0; d < 9; d++)`
- Day labels: "Day X of 9"
- Dots UI: 9 fixed dots in master progress card

The Christmas Novena (St. Andrew) is 25 days. 25 individual dots would be unreadable.

### Fix: Data-Driven Day Count

Replace all hardcoded `9` references with `_active.days.length` or `nov.days.length`:

**In `_renderSelect()`** (~line in novena.js):
```javascript
// Before:
for (var d = 0; d < 9; d++) {

// After:
var totalDays = nov.days.length;
for (var d = 0; d < totalDays; d++) {
```

**In progress label:**
```javascript
// Before:
'Day ' + dayNum + ' of 9 · ' + completed + ' completed'

// After:
'Day ' + dayNum + ' of ' + totalDays + ' · ' + completed + ' completed'
```

### Progress Bar for High Day Counts

When `totalDays > 12`, switch from individual dots to a progress bar:

```javascript
if (totalDays <= 12) {
  // Render individual dots (existing pattern)
  dotsHtml = '<div class="novena-master-dots">';
  for (var d = 0; d < totalDays; d++) { /* dots */ }
  dotsHtml += '</div>';
} else {
  // Render progress bar
  var pct = Math.round((completed / totalDays) * 100);
  dotsHtml = '<div class="novena-progress-bar">'
    + '<div class="novena-progress-fill" style="width:' + pct + '%"></div>'
    + '</div>';
}
```

### CSS for Progress Bar

```css
.novena-progress-bar {
  width: 80px;
  height: 6px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
  overflow: hidden;
  flex-shrink: 0;
}
.novena-progress-fill {
  height: 100%;
  background: var(--color-sacred);
  border-radius: var(--radius-full);
  transition: width 0.3s var(--ease-out);
}
html[data-theme="dark"] .novena-progress-bar {
  background: var(--color-border);
}
```

### More Tab Subtitle for Non-9-Day Novenas

In `more.js` `_getNovenaSubtitle()` (~line 21):
```javascript
// Before:
return 'Day ' + dayNum + ' of 9';

// After:
var novena = require('./novena.js');
var totalDays = novena._getTotalDays(active[0]);
return 'Day ' + dayNum + ' of ' + totalDays;
```

This requires exporting a `_getTotalDays()` helper from novena.js.

### Test Checklist

- [ ] 9-day novenas: still show 9 individual dots
- [ ] 25-day novena: shows progress bar instead of dots
- [ ] Day label reads "Day X of 25" for Christmas Novena
- [ ] Progress bar fills proportionally
- [ ] More tab subtitle shows correct total for non-9-day novenas
- [ ] Dark mode: progress bar track and fill visible

---

## [PMD-06] Angelus / Regina Caeli — Seasonal Moment Candidate

**Files:** `src/more.js`

### Implementation

Add a new candidate to `_renderSeasonalMoment()` at priority 4 (same as Monthly Devotion — fills empty slots when no higher-priority cards are active):

```javascript
// Angelus / Regina Caeli — daily Marian prayer
var isEasterSeason = currentSeason === 'easter';
var angelusTitle = isEasterSeason ? 'Regina Caeli' : 'The Angelus';
var angelusSubtitle = isEasterSeason
  ? 'Queen of Heaven, rejoice! Alleluia.'
  : 'The Angel of the Lord declared unto Mary.';
var angelusBody = isEasterSeason
  ? '<p><em>Queen of Heaven, rejoice, alleluia.<br>For He whom you did merit to bear, alleluia,<br>Has risen as He said, alleluia.<br>Pray for us to God, alleluia.</em></p>'
    + '<p><strong>V.</strong> Rejoice and be glad, O Virgin Mary, alleluia.<br><strong>R.</strong> For the Lord has truly risen, alleluia.</p>'
    + '<p>Let us pray. O God, who gave joy to the world through the resurrection of Thy Son, our Lord Jesus Christ: grant, we beseech Thee, that through His Mother, the Virgin Mary, we may obtain the joys of everlasting life. Through the same Christ our Lord. Amen.</p>'
  : '<p><strong>V.</strong> The Angel of the Lord declared unto Mary.<br><strong>R.</strong> And she conceived of the Holy Spirit.</p>'
    + '<p><em>Hail Mary...</em></p>'
    + '<p><strong>V.</strong> Behold the handmaid of the Lord.<br><strong>R.</strong> Be it done unto me according to Thy word.</p>'
    + '<p><em>Hail Mary...</em></p>'
    + '<p><strong>V.</strong> And the Word was made flesh.<br><strong>R.</strong> And dwelt among us.</p>'
    + '<p><em>Hail Mary...</em></p>'
    + '<p>Let us pray. Pour forth, we beseech Thee, O Lord, Thy grace into our hearts; that we, to whom the Incarnation of Christ, Thy Son, was made known by the message of an angel, may by His Passion and Cross be brought to the glory of His Resurrection. Through the same Christ our Lord. Amen.</p>';

var angelusIcon = isEasterSeason
  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/></svg>'
  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 3c0 4-3 6-3 9a3 3 0 0 0 6 0c0-3-3-5-3-9z"/><line x1="12" y1="15" x2="12" y2="20"/></svg>';

candidates.push({
  priority: 4,
  html: '<details class="seasonal-card">'
    + '<summary>'
    + '<div class="seasonal-card-icon">' + angelusIcon + '</div>'
    + '<div class="seasonal-card-body">'
    + '<div class="seasonal-card-title">' + esc(angelusTitle) + '</div>'
    + '<div class="seasonal-card-subtitle">' + esc(angelusSubtitle) + '</div>'
    + '</div>'
    + '<svg class="seasonal-card-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>'
    + '</summary>'
    + '<div class="seasonal-card-expanded">' + angelusBody
    + '<div class="seasonal-card-action" onclick="event.stopPropagation();openPrayerBook(\'angelus\')">See in Prayer Book \u2192</div>'
    + '</div>'
    + '</details>'
});
```

### Priority Behavior

At priority 4, the Angelus/Regina Caeli competes with the Monthly Devotion card for the bottom slot(s). Since `_renderSeasonalMoment` takes the top 2 candidates by priority, the Angelus only appears when there are fewer than 2 higher-priority cards (Holy Week = P1, Divine Mercy Sunday = P1, Pentecost = P1-2, Easter Alleluia = P3, O Antiphons = P1).

In Ordinary Time (most of the year), the typical rendering will be:
- Slot 1: Monthly Devotion (P4)
- Slot 2: Angelus (P4)

Both at P4, so add a tiebreaker: the Angelus gets `priority: 3.5` (before Monthly Devotion) to ensure it appears when both compete.

### Test Checklist

- [ ] Outside Easter: "The Angelus" card appears in seasonal moment zone
- [ ] During Easter: "Regina Caeli" card appears instead
- [ ] Expanding shows full V/R prayer text in `--font-prayer`
- [ ] "See in Prayer Book →" action works (requires PMB to be shipped)
- [ ] Card yields to higher-priority seasonal content (Holy Week, etc.)
- [ ] Dark mode: card follows existing `.seasonal-card` dark styles

---

## [PMD-07] Seasonal Card Cross-Links to New Tools

**Files:** `src/more.js`

### Divine Mercy Sunday Card (SOT-07)

The existing Divine Mercy Sunday seasonal card (~line 436) should gain an action link to the chaplet:

```javascript
+ '<div class="seasonal-card-action" onclick="event.stopPropagation();openChaplet()">Pray the Divine Mercy Chaplet \u2192</div>'
```

Add after the existing indulgence information paragraph.

### First Friday Seasonal Reminder

The existing First Friday seasonal card (~line 624) already links to `openFirstFriday()` and "Find Mass near you." No change needed.

### Monthly Devotions with Tool Links

Several monthly devotions already have `actionFn` links (May → `openRosary()`, October → `openRosary()`, March → `openNovena()`). After chaplet ships, add to April (Month of the Eucharist): no tool link needed. After prayer book ships, consider adding links from devotion months to relevant prayers (e.g., June Sacred Heart → Sacred Heart prayers in Prayer Book).

### Test Checklist

- [ ] Divine Mercy Sunday card shows "Pray the Divine Mercy Chaplet →"
- [ ] Tapping chaplet link opens the chaplet reader module
- [ ] Existing seasonal card links still work

---

## [PMD-08] Dark Mode Parity

**Files:** `css/app.css`

### Chaplet Module

```css
html[data-theme="dark"] .chaplet-intro-title { color: var(--color-heading); }
html[data-theme="dark"] .chaplet-intro-origin { color: var(--color-sacred-text); }
html[data-theme="dark"] .chaplet-intro-quote { color: var(--color-text-secondary); }
html[data-theme="dark"] .chaplet-prayer-text { color: var(--color-text-primary); }
html[data-theme="dark"] .chaplet-begin { background: var(--color-sacred); }
```

Most chaplet styles use CSS custom properties that already adapt to dark mode. The explicit overrides above are belt-and-suspenders for the few that reference semantic color roles.

### Novena Progress Bar

Already specified in PMD-05.

### Angelus/Regina Caeli

Uses existing `.seasonal-card` dark styles (line 1647 in current CSS). No additional overrides needed.

### Test Checklist

- [ ] Chaplet intro screen: title, quote, button all readable
- [ ] Chaplet prayer screen: bead text readable, counter visible
- [ ] Novena progress bar: track and fill visible
- [ ] Angelus seasonal card: inherits existing dark treatment

---

## Cascading Impacts

- **`src/chaplet.js`:** New module (~250-350 lines, follows rosary.js pattern closely)
- **`src/app.js`:** Add require + window binding for `openChaplet()`
- **`src/more.js`:** Add chaplet card to `ptCards`, add Angelus seasonal candidate, add chaplet cross-link to Divine Mercy Sunday card
- **`src/novena.js`:** Replace hardcoded `9` with `days.length`, add progress bar for high counts, export `_getTotalDays()`
- **`data/prayers.json`:** Add `chaplet` object + 6 new novena entries (~50KB additional data)
- **`css/app.css`:** ~50 lines chaplet CSS, ~10 lines novena progress bar CSS
- **`sw.js`:** No change needed (`prayers.json` is already cached)
- **No impact on:** rosary.js, examination.js, stations.js, reader.js, devotions.js, prayerbook.js, or any HTML structure

---

## Implementation Notes — All PMD Items

### Implementation Notes

- **Date:** 2026-03-14
- **Status:** done (all 8 items)
- **Files changed:**
  - `data/prayers.json` — Added 6 new novenas (surrender, sacred_heart, st_jude, miraculous_medal, st_andrew_christmas with 25 days, st_patrick). Added `chaplet` key with Divine Mercy Chaplet data (opening prayer IDs, decade prayers, closing, optional closing prayer).
  - `src/chaplet.js` (new, ~345 lines) — Divine Mercy Chaplet guided bead experience. State machine: intro → opening (4 prayers) → decade (5×11 beads) → closing (3× Holy God) → final. Bead visualization, swipe navigation, wake lock, haptic feedback, crossfade transitions, prayer log on completion.
  - `src/novena.js` — Replaced 7+ hardcoded `9` references with `nov.days.length`/`totalDays`. Changed `_computeCurrentDay()` signature to accept `totalDays` parameter. Added progress bar for `totalDays > 12`. Added `_getTotalDays()` export. Changed completion check to `>= totalDays`. Changed "More novenas coming soon" to "Have a novena suggestion?".
  - `src/more.js` — Added chaplet card (tier 1), `_getChapletSubtitle()` with 2:30-3:30 PM Hour of Mercy logic, 3 PM promotion. Added Angelus/Regina Caeli seasonal moment candidate at priority 3.5 with full V/R prayer text and "See in Prayer Book" cross-link. Added "Pray the Divine Mercy Chaplet" action link to Divine Mercy Sunday card.
  - `src/app.js` — Added `require('./chaplet.js')` and window bindings.
  - `css/app.css` — Chaplet styles (intro, prayer, beads, bead states, dark mode), novena progress bar styles.
- **Approach:** Chaplet follows rosary.js patterns exactly: reader registration, state machine, swipe/haptic/wake lock. Novena variable day count was a targeted find-and-replace of hardcoded `9` with data-driven values. PMD-06 Angelus/Regina Caeli uses `currentSeason === 'easter'` to toggle between the two prayers, with full V/R formatted text inline in the seasonal card. PMD-07 adds chaplet cross-link to existing Divine Mercy Sunday card (SOT-07).
- **Deviations from spec:** PMD-06 priority set to 3.5 (spec initially said 4, then corrected to 3.5 in the priority behavior section). Used a clock icon for both Angelus and Regina Caeli cards (spec suggested different icons but clock is more thematically appropriate for a prayer tied to specific times of day). Chaplet subtitle uses "Prayed on rosary beads" without the "~10 min" suffix for cleaner grid appearance.
- **Known issues:** None observed.
