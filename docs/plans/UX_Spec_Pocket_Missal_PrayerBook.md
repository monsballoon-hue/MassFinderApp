# UX Spec — Pocket Missal: Prayer Book Module

**Date:** 2026-03-14
**Author:** UX Consultant (Claude Opus)
**Status:** Implemented
**Depends on:** PMG (Grid Restructure)
**Prefix:** PMB

| Item | Title | Status |
|------|-------|--------|
| PMB-01 | Prayer Book Data File | done |
| PMB-02 | Reader Module Registration & Selection Screen | done |
| PMB-03 | Prayer Text Display & Expand/Collapse | done |
| PMB-04 | Search Input (Sticky) | done |
| PMB-05 | V/R Formatting for Call-and-Response Prayers | done |
| PMB-06 | Litany Step-Through Mode (Humility + Trust) | done |
| PMB-07 | Lectio Divina Guided Experience | done |
| PMB-08 | Prayer Tools Grid Card Entry Point | done |
| PMB-09 | Dark Mode Parity | done |

---

## Context

MassFinder has **8 prayer texts** — all embedded in `data/prayers.json` as rosary infrastructure. They are not independently browseable. Users looking for Grace Before Meals, the Memorare, the St. Michael prayer, or any other common Catholic prayer cannot find them in the app.

The Prayer Book fills this gap: **20-25 essential prayers**, categorized, searchable, rendered in `--font-prayer` (Georgia), accessible from the primary prayer tools grid.

### Demographic Rationale

- **72-year-old:** Scrolls "Essential Prayers" category, taps Grace Before Meals. Reads in large Georgia serif. 3 taps, done.
- **25-year-old:** Types "trust" in search, finds Litany of Trust, enters guided step-through mode. Elegant discovery.
- **45-year-old parent:** Bedtime with kids. Opens Prayer Book, taps Guardian Angel Prayer. Under 5 seconds.

---

## [PMB-01] Prayer Book Data File

**Files:** NEW `data/prayerbook.json`

### Structure

```json
{
  "version": 1,
  "categories": [
    {
      "id": "essential",
      "title": "Essential Prayers",
      "prayers": [
        {
          "id": "our_father",
          "title": "Our Father",
          "aka": "Lord's Prayer, Pater Noster",
          "text": "Our Father, who art in heaven,\nhallowed be Thy name;\nThy kingdom come,\nThy will be done\non earth as it is in heaven.\nGive us this day our daily bread,\nand forgive us our trespasses,\nas we forgive those who trespass against us;\nand lead us not into temptation,\nbut deliver us from evil.\nAmen.",
          "tags": ["mass", "rosary", "daily"],
          "type": "static"
        }
      ]
    }
  ],
  "litanies": [
    {
      "id": "litany_humility",
      "title": "Litany of Humility",
      "author": "Rafael Cardinal Merry del Val",
      "invocations": [
        { "text": "From the desire of being esteemed", "response": "Deliver me, Jesus." },
        { "text": "From the desire of being loved", "response": "Deliver me, Jesus." }
      ],
      "closing": "Jesus, meek and humble of heart, make my heart like Yours. Amen.",
      "type": "litany"
    }
  ]
}
```

### Prayer Categories and Contents

**Essential Prayers** (~10):
- Our Father, Hail Mary, Glory Be, Sign of the Cross, Apostles' Creed, Nicene Creed, Confiteor, Act of Contrition (traditional + modern versions), Hail Holy Queen

**Morning & Evening** (~7):
- Morning Offering, Guardian Angel Prayer, Grace Before Meals, Grace After Meals, Act of Faith, Act of Hope, Act of Charity

**Marian Prayers** (~7):
- Memorare, Angelus (with V/R markup), Regina Caeli (with V/R markup), Sub Tuum Praesidium, Alma Redemptoris Mater, Ave Regina Caelorum, Magnificat (Luke 1:46-55)

**Prayers to Saints** (~4):
- St. Michael the Archangel (Leo XIII), Prayer of St. Francis, St. Anthony (lost things), Anima Christi

**Sacramental Prayers** (~3):
- Act of Spiritual Communion, Prayer Before the Blessed Sacrament, Eternal Rest

**Litanies** (2 — guided, see PMB-06):
- Litany of Humility (18 invocations)
- Litany of Trust (28 invocations)

**Contemplative** (1 — guided, see PMB-07):
- Lectio Divina (4-step method using today's Gospel)

**Total: ~34 entries** (25 static prayers + 2 litanies + 1 guided method + cross-references to existing rosary prayers)

### Data Considerations

- All texts are public domain traditional Catholic prayers. No copyright concerns.
- The `aka` field enables search matching (e.g., searching "Pater Noster" finds Our Father).
- The `tags` field enables future filtering by occasion ("mass", "lent", "rosary", "morning").
- V/R prayers (Angelus, Regina Caeli, Divine Praises) use `\nV. ` and `\nR. ` prefixes for formatter to detect.
- Size estimate: ~25KB for the full data file. Lazy-loaded on first Prayer Book open.

### Test Checklist

- [ ] JSON validates with `node -e "JSON.parse(require('fs').readFileSync('data/prayerbook.json'))"`
- [ ] All prayer texts reviewed for accuracy against official sources
- [ ] V/R markers consistent across all call-and-response prayers
- [ ] No duplicate IDs

---

## [PMB-02] Reader Module Registration & Selection Screen

**Files:** NEW `src/prayerbook.js`, `src/app.js`

### Module Structure

```javascript
// src/prayerbook.js
var reader = require('./reader.js');
var utils = require('./utils.js');

var _data = null;
var _screen = 'list'; // 'list' | 'prayer' | 'litany' | 'lectio'
var _currentPrayer = null;

reader.registerModule('prayerbook', {
  getTitle: function() { return 'Prayer Book'; },
  getHeaderExtra: function() {
    if (_screen === 'list') return _searchHtml();
    return '';
  },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    _load().then(function() {
      if (params.prayerId) {
        _openPrayer(params.prayerId, bodyEl);
      } else {
        _screen = 'list';
        _renderList(bodyEl);
      }
    });
  },
  onClose: function() { _screen = 'list'; _currentPrayer = null; }
});
```

### Selection Screen Layout

The list screen shows categories as section headers with prayers as expandable rows below each:

```
PRAYER BOOK
[🔍 Search prayers...                    ]
─────────────────────────────────────────

ESSENTIAL PRAYERS
┌─────────────────────────────────────────┐
│ Our Father                              │
│ Lord's Prayer                      ▼    │
├─────────────────────────────────────────┤
│ Hail Mary                               │
│ Ave Maria                          ▼    │
├─────────────────────────────────────────┤
│ ...                                     │
└─────────────────────────────────────────┘

MORNING & EVENING
┌─────────────────────────────────────────┐
│ Morning Offering                        │
│ Apostleship of Prayer              ▼    │
├─────────────────────────────────────────┤
│ Guardian Angel Prayer                   │
│ "Angel of God, my guardian dear..."  ▼  │
└─────────────────────────────────────────┘
```

Category headers: `--font-display`, `--text-xs`, `--weight-semibold`, uppercase, `--color-text-tertiary`, `letter-spacing: 0.05em`.

Prayer rows: Title in `--font-body`, `--text-base`, `--weight-semibold`. Subtitle (aka/first line) in `--font-prayer`, `--text-sm`, italic, `--color-text-secondary`. Chevron right-aligned for expand indicator.

Litanies and Lectio Divina entries get a distinct treatment — a small badge or icon indicating they're guided experiences, not static text. Use `--color-sacred` accent pill: `<span class="prayerbook-guided-badge">Guided</span>`.

### Registration in `app.js`

Add to the module requires and window bindings:
```javascript
var prayerbook = require('./prayerbook.js');
window.openPrayerBook = function(prayerId) {
  prayerbook.open(prayerId);
};
```

### Test Checklist

- [ ] Reader opens with title "Prayer Book"
- [ ] Categories render in correct order
- [ ] Prayer rows show title + subtitle preview
- [ ] Litany/Lectio entries show "Guided" badge
- [ ] Back button returns to More tab (no stack history on fresh open)
- [ ] Reader crossfade animation works on open

---

## [PMB-03] Prayer Text Display & Expand/Collapse

**Files:** `src/prayerbook.js`, `css/app.css`

### Interaction Pattern

Tapping a prayer row expands the full text inline — same `<details>` expand/collapse pattern as reading entries on the More tab (`.reading-entry` / `.reading-text`).

### Expanded Prayer Display

```css
.prayerbook-text {
  font-family: var(--font-prayer);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.75;
  padding: var(--space-4) 0;
  white-space: pre-line;
}
```

`white-space: pre-line` preserves the `\n` line breaks from the JSON data without requiring `<br>` tags in the data.

### Touch Target

Each prayer row must be ≥ 44px tall. The current `.reading-entry` pattern achieves this with `padding: var(--space-3) 0` which gives ~52px. Match this.

### Test Checklist

- [ ] Tapping prayer row expands full text below
- [ ] Tapping again collapses
- [ ] Only one prayer expanded at a time (accordion behavior)
- [ ] Prayer text renders in Georgia at readable size
- [ ] Line breaks preserved (e.g., Our Father has line breaks per petition)
- [ ] Long prayers (Nicene Creed ~200 words) scroll within the reader body, not the prayer element

---

## [PMB-04] Search Input (Sticky)

**Files:** `src/prayerbook.js`

### Implementation

The search input renders in the reader header extra area (returned by `getHeaderExtra()`), same as the CCC search pattern:

```javascript
function _searchHtml() {
  return '<div class="prayerbook-search">'
    + '<input type="search" id="prayerBookSearch" placeholder="Search prayers\u2026"'
    + ' class="prayerbook-search-input" autocomplete="off" autocorrect="off">'
    + '</div>';
}
```

### Search Logic

Fuzzy matching against: `title`, `aka`, `tags`, and first 50 characters of `text`. Use the same simple `indexOf` matching the CCC search uses — no need for a fuzzy library.

```javascript
function _filterPrayers(query) {
  var q = query.toLowerCase().trim();
  if (!q) return null; // show full categorized list
  var results = [];
  _data.categories.forEach(function(cat) {
    cat.prayers.forEach(function(p) {
      var haystack = (p.title + ' ' + (p.aka || '') + ' ' + (p.tags || []).join(' ')).toLowerCase();
      if (haystack.indexOf(q) !== -1) results.push(p);
    });
  });
  // Also search litanies
  (_data.litanies || []).forEach(function(l) {
    if (l.title.toLowerCase().indexOf(q) !== -1) results.push(l);
  });
  return results;
}
```

When search is active, the categorized sections collapse into a flat results list. Clearing the search restores the categorized view.

### CSS

```css
.prayerbook-search { padding: 0 0 var(--space-2); }
.prayerbook-search-input {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-size: var(--text-sm);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text-primary);
  outline: none;
}
.prayerbook-search-input:focus {
  border-color: var(--color-sacred);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
html[data-theme="dark"] .prayerbook-search-input {
  background: var(--color-surface);
  border-color: var(--color-border);
  color: var(--color-text-primary);
}
```

### Test Checklist

- [ ] Search input visible at top of Prayer Book
- [ ] Typing "memorare" filters to Memorare
- [ ] Typing "guardian" filters to Guardian Angel Prayer
- [ ] Typing "pater noster" filters to Our Father (via `aka` field)
- [ ] Clearing search restores full categorized list
- [ ] Search input stays visible when scrolling prayer list

---

## [PMB-05] V/R Formatting for Call-and-Response Prayers

**Files:** `src/prayerbook.js`, `css/app.css`

### Affected Prayers

Angelus, Regina Caeli, Divine Praises, Confiteor responses, Litany of the Saints (if added later).

### Data Convention

In `prayerbook.json`, V/R prayers use line prefixes:
```
"V. The Angel of the Lord declared unto Mary.\nR. And she conceived of the Holy Spirit.\n\nHail Mary...\n\nV. Behold the handmaid of the Lord.\nR. Be it done unto me according to thy word."
```

### Rendering

The `_formatPrayerText()` function detects V/R prefixes and wraps them:

```javascript
function _formatPrayerText(text) {
  return utils.esc(text)
    .replace(/^V\. (.+)$/gm, '<span class="vr-versicle"><span class="vr-label">V.</span> $1</span>')
    .replace(/^R\. (.+)$/gm, '<span class="vr-response"><span class="vr-label">R.</span> <strong>$1</strong></span>');
}
```

### CSS

```css
.vr-versicle, .vr-response { display: block; margin-bottom: var(--space-1); }
.vr-label {
  font-family: var(--font-body);
  font-weight: var(--weight-bold);
  font-size: var(--text-xs);
  color: var(--color-sacred-text);
  margin-right: var(--space-1);
}
.vr-response strong {
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
}
```

The leader text (V.) renders in regular weight. The congregation response (R.) renders in bold — the universal convention in missals and prayer books.

### Test Checklist

- [ ] Angelus displays with proper V/R formatting
- [ ] Regina Caeli displays with proper V/R formatting
- [ ] Non-V/R prayers unaffected by the formatter
- [ ] Dark mode: V/R labels readable in `--color-sacred-text`

---

## [PMB-06] Litany Step-Through Mode

**Files:** `src/prayerbook.js`, `css/app.css`

### Trigger

When a user taps a litany entry (type: `"litany"`) in the Prayer Book list, the reader transitions to step-through mode instead of expanding inline text.

### Screen Layout

```
┌─────────────────────────────────────────┐
│  ← Prayer Book      Litany of Trust     │
│                                         │
│              3 of 28                     │
│                                         │
│                                         │
│                                         │
│    From the belief that I have to       │
│    earn Your love,                      │
│                                         │
│         deliver me, Jesus.              │
│                                         │
│                                         │
│                                         │
│    ════════════════════════              │
│    (subtle progress bar)                │
│                                         │
│           [ Continue ]                  │
└─────────────────────────────────────────┘
```

### Visual Treatment

- Invocation text: `--font-prayer`, `--text-xl`, centered, `--color-text-primary`, `line-height: 1.6`
- Response text: `--font-prayer`, `--text-lg`, italic, centered, `--color-sacred-text`, `margin-top: var(--space-4)`
- Step counter: `--font-body`, `--text-xs`, `--color-text-tertiary`, centered above invocation
- Progress bar: thin horizontal bar (2px height), `--color-sacred` fill, `--color-border-light` track, `border-radius: var(--radius-full)`, width based on `currentStep / totalSteps`
- Continue button: ghost button, `--color-sacred` border, centered, min-height 44px

### State Management

```javascript
var _litanyState = {
  litany: null,      // litany data object
  step: 0,           // 0-indexed
  total: 0           // invocations.length
};
```

### Navigation

- Tap "Continue" or swipe left → advance to next invocation
- Swipe right → go back one invocation
- On final invocation → show closing prayer with "Amen" / "Finish" button
- "Finish" → return to Prayer Book list (pop reader stack)

### Swipe Detection

Reuse the same swipe detection pattern from `rosary.js` (`_touchStartX`, `_touchStartY`, threshold of 50px horizontal, < 30px vertical).

### Wake Lock

Acquire wake lock on litany enter, release on exit. Same pattern as rosary/stations.

### CSS

```css
.litany-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: var(--space-6);
}
.litany-invocation {
  font-family: var(--font-prayer);
  font-size: var(--text-xl);
  color: var(--color-text-primary);
  line-height: 1.6;
  max-width: 320px;
}
.litany-response {
  font-family: var(--font-prayer);
  font-size: var(--text-lg);
  font-style: italic;
  color: var(--color-sacred-text);
  margin-top: var(--space-4);
}
.litany-counter {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-bottom: var(--space-6);
}
.litany-progress {
  width: 100%;
  max-width: 200px;
  height: 2px;
  background: var(--color-border-light);
  border-radius: var(--radius-full);
  margin-top: var(--space-6);
  overflow: hidden;
}
.litany-progress-fill {
  height: 100%;
  background: var(--color-sacred);
  border-radius: var(--radius-full);
  transition: width 0.3s var(--ease-out);
}
.litany-continue {
  margin-top: var(--space-4);
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
.litany-continue:active { transform: scale(0.97); }
```

### Haptic Feedback

Trigger `_haptic('light')` on each step advance (same as rosary bead advance).

### Test Checklist

- [ ] Tapping "Litany of Humility" enters step-through mode
- [ ] Each invocation displays centered with response below
- [ ] Progress bar advances smoothly
- [ ] Swipe left advances, swipe right goes back
- [ ] Final step shows closing prayer
- [ ] "Finish" returns to Prayer Book list
- [ ] Wake lock active during litany
- [ ] Haptic on each step
- [ ] Back button (reader header) returns to Prayer Book list
- [ ] Dark mode: all elements readable
- [ ] Counter "X of Y" is accurate

---

## [PMB-07] Lectio Divina Guided Experience

**Files:** `src/prayerbook.js`, `css/app.css`

### Trigger

Tapping "Lectio Divina" in the Prayer Book's "Contemplative" category. Type: `"lectio"`.

### Data Dependency

Uses today's Gospel reading from the existing `readings.fetchReadings()` module. If readings haven't loaded, show the Gospel reference without text and a note: "Today's Gospel will appear when readings are available."

### 5 Screens (Intro + 4 Steps)

**Screen 0 — Intro:**
```
LECTIO DIVINA
"Divine Reading"

A 4-step method for praying with Scripture,
practiced since the early centuries of the Church.

Today's Gospel: [reference]

         [ Begin ]
```
Intro title: `--font-display`, `--text-2xl`. Latin subtitle: `--font-prayer`, italic. Description: `--font-body`, `--text-sm`.

**Screen 1 — Lectio (Read):**
Header: "1. Lectio — Read" in `--font-display`, `--text-lg`
Instruction: "Read the passage slowly. Let the words wash over you. Notice any word or phrase that catches your attention." — `--font-body`, `--text-sm`, `--color-text-secondary`
Gospel text: `--font-prayer`, `--text-base`, `line-height: 1.8`, full passage displayed.

**Screen 2 — Meditatio (Meditate):**
Header: "2. Meditatio — Meditate"
Instruction: "Read the passage again. Dwell on the word or phrase that stood out. What is God saying to you through this text?"
Gospel text: same, but with reduced opacity (`opacity: 0.6`) to shift focus from reading to reflecting.

**Screen 3 — Oratio (Pray):**
Header: "3. Oratio — Pray"
Instruction: "Respond to God. Speak to Him about what you've heard. This is your conversation with the Lord."
Minimal visual — a small cross icon (`--color-sacred`, 48px) centered. No Gospel text. Space for the user's interior prayer.

**Screen 4 — Contemplatio (Contemplate):**
Header: "4. Contemplatio — Rest"
Instruction: "Rest in God's presence. Let go of words and thoughts. Simply be with the Lord."
Near-empty screen. Just the instruction and vast whitespace. Background: `--color-bg`. Wake lock active.
Button: "Conclude" — returns to Prayer Book.

### Navigation

- "Continue" button advances through screens 0→1→2→3→4
- Swipe navigation (same as litany)
- No back-stepping required (but swipe right works if user wants it)

### Progress Indicator

4 dots at bottom of screens 1-4: filled dot for current step, empty for remaining. Uses `--color-sacred` fill.

### CSS

```css
.lectio-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--space-6) var(--space-4);
  min-height: 60vh;
}
.lectio-label {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: var(--space-3);
}
.lectio-instruction {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  line-height: 1.6;
  text-align: center;
  max-width: 400px;
  margin-bottom: var(--space-5);
}
.lectio-gospel {
  font-family: var(--font-prayer);
  font-size: var(--text-base);
  color: var(--color-text-primary);
  line-height: 1.8;
  max-width: 540px;
  text-align: left;
}
.lectio-gospel--faded { opacity: 0.6; }
.lectio-dots {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-6);
}
.lectio-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border-light);
}
.lectio-dot--active { background: var(--color-sacred); }
```

### Test Checklist

- [ ] Intro screen shows today's Gospel reference
- [ ] Step 1 shows full Gospel text
- [ ] Step 2 shows Gospel text with reduced opacity
- [ ] Step 3 shows cross icon, no text
- [ ] Step 4 shows minimal content, vast whitespace
- [ ] Progress dots advance correctly
- [ ] "Conclude" returns to Prayer Book
- [ ] Wake lock active during all steps
- [ ] Dark mode: cross icon and text readable
- [ ] When readings haven't loaded: graceful fallback message

---

## [PMB-08] Prayer Tools Grid Card Entry Point

**Files:** `src/more.js`

### Card Definition

Add to the `ptCards` array:
```javascript
{ id: 'prayerbook', title: 'Prayer Book', subtitle: '25 essential prayers', action: 'openPrayerBook()', active: true, tier: 1 }
```

### Icon

Book with cross — simplified:
```javascript
prayerbook: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/><line x1="12" y1="7" x2="12" y2="13"/><line x1="9" y1="10" x2="15" y2="10"/></svg>'
```

### Colors

```javascript
prayerbook: 'var(--color-sacred)'    // icon color
prayerbook: 'var(--color-sacred-pale)' // icon background
```

### Position

First card in primary grid (top-left). The `_resolveCardTiers()` function (PMG-04) assigns it to primary by default.

### Test Checklist

- [ ] Prayer Book card appears top-left in primary grid
- [ ] Tapping opens Prayer Book reader module
- [ ] Icon renders correctly (book with cross)
- [ ] Subtitle shows "25 essential prayers"

---

## [PMB-09] Dark Mode Parity

**Files:** `css/app.css`

### Elements Requiring Dark Overrides

All new CSS classes inherit from the reader overlay's existing dark mode treatment. Specific additions:

```css
html[data-theme="dark"] .prayerbook-text {
  color: var(--color-text-primary);
}
html[data-theme="dark"] .vr-label {
  color: var(--color-sacred-text);
}
html[data-theme="dark"] .litany-invocation {
  color: var(--color-text-primary);
}
html[data-theme="dark"] .litany-response {
  color: var(--color-sacred-text);
}
html[data-theme="dark"] .litany-progress {
  background: var(--color-border);
}
html[data-theme="dark"] .lectio-gospel {
  color: var(--color-text-primary);
}
html[data-theme="dark"] .prayerbook-guided-badge {
  background: color-mix(in srgb, var(--color-sacred) 15%, transparent);
  color: var(--color-sacred-text);
}
```

### Test Checklist

- [ ] Prayer Book list readable in dark mode
- [ ] Expanded prayer text readable in dark mode
- [ ] V/R labels visible in dark mode
- [ ] Litany step-through: invocation and response both readable
- [ ] Lectio Divina: Gospel text readable, faded step still visible
- [ ] Search input: border, background, text all visible
- [ ] "Guided" badge visible but not overpowering

---

## Cascading Impacts

- **`data/prayerbook.json`:** New file, lazy-loaded on first Prayer Book open
- **`src/prayerbook.js`:** New module (~300-400 lines estimated)
- **`src/app.js`:** Add require + window binding for `openPrayerBook()`
- **`src/more.js`:** Add card to `ptCards` array
- **`css/app.css`:** ~80 lines of new CSS
- **`sw.js`:** Add `data/prayerbook.json` to cache list
- **No impact on:** readings.js (just reads its data), rosary.js, examination.js, stations.js, novena.js, devotions.js, or existing data files

---

## Implementation Notes — All PMB Items

### Implementation Notes

- **Date:** 2026-03-14
- **Status:** done (all 9 items)
- **Files changed:**
  - `data/prayerbook.json` (new, ~27KB) — 5 categories with 31 prayers: Essential (10), Morning & Evening (7), Marian (7), Saints (4), Sacramental (3). Plus 2 litanies (Humility with 23 invocations, Trust with 28 invocations) and 1 Lectio Divina entry with 4 steps.
  - `src/prayerbook.js` (new, ~450 lines) — Reader module with three screens: categorized list, litany step-through, and Lectio Divina 4-step guided experience. Includes `_formatPrayerText()` V/R formatter, `prayerbookSearch()` indexOf matching, expand/collapse accordion, swipe gestures, wake lock, haptic feedback.
  - `src/app.js` — Added `require('./prayerbook.js')` and window bindings for all prayerbook functions.
  - `src/more.js` — Added Prayer Book card to ptCards as tier 1, first position. Book+cross SVG icon with sacred color.
  - `css/app.css` — Added prayer book list/search/row/text styles, V/R formatting (`.vr-line`, `.vr-label`, `.vr-response`), litany step-through styles (`.litany-step`, `.litany-counter`, `.litany-progress`, `.litany-invocation`, `.litany-response`), Lectio Divina styles (`.lectio-step`, `.lectio-dots`, `.lectio-label`, `.lectio-gospel`, `.lectio-rest`), dark mode overrides.
- **Approach:** PMB-06 (litany) and PMB-07 (lectio) were built directly into prayerbook.js rather than as separate sessions, since the guided experiences share the reader registration and state management. The module uses three screen modes ('list', 'litany', 'lectio') with internal navigation. Lectio Divina attempts to load today's Gospel from `window._readingsCache` with graceful fallback. Deep-link support via `params.prayerId` allows seasonal cards to link directly to specific prayers.
- **Deviations from spec:** Litanies and Lectio Divina are stored in the categories array in prayerbook.json with `type: "litany"` and `type: "lectio"` rather than a separate top-level `litanies` array, for simpler data loading. Search matches against first 80 chars of text (spec said 50). Both are improvements over spec.
- **Known issues:** None observed.
