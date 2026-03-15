# Claude Code Implementation Prompt — SLV Sacred Pause System (SLV-07 through SLV-11)

**Spec:** `docs/plans/UX_Spec_Sacred_Pause_System.md`
**Prefix:** SLV (addendum)
**Branch:** `content-additions`
**Depends on:** SLV-01 through SLV-06 (from `docs/plans/UX_Spec_Soul_Visual_Language.md`)

---

## Pre-flight

```bash
git checkout content-additions && git pull
cat CLAUDE.md
cat docs/plans/UX_Spec_Sacred_Pause_System.md   # full spec
cat docs/plans/UX_Spec_Soul_Visual_Language.md   # original SLV spec
# Verify SLV-01 status:
grep -n "mf-last-season\|season-overlay\|seasonTransition" src/readings.js
# Verify reader.js injection point:
sed -n '38,100p' src/reader.js
```

**IMPORTANT:** If SLV-01 Part C (season transition overlay) has already been implemented with custom overlay code, this prompt refactors it to use the new shared system. If SLV-01 Part C has NOT been implemented yet, skip the refactor and implement the season transition directly via `sacred-pause.js`.

---

## Implementation Order

### 1. SLV-07 — Create `src/sacred-pause.js`

Create new module. Follow CommonJS pattern. No arrow functions.

See spec SLV-07 for the full module code. Key exports:
- `show(opts)` — display a sacred pause overlay
- `showAfter(opts, delay)` — queue after current pause dismisses
- `isActive()` — check if a pause is on screen

Constants:
- `MAX_PER_SESSION = 2` — hard cap
- z-index `10000` — above everything

Register in `src/app.js`:
```javascript
var sacredPause = require('./sacred-pause.js');
window._sacredPause = sacredPause;
```

Add CSS to `css/app.css` — the full `.sacred-pause` block from the spec. Includes:
- Base styles (fixed overlay, flex center, fade animation)
- Staggered text animations (label 0.2s, title 0.35s, message 0.5s)
- `.sacred-pause.dismissing` (opacity transition)
- Seasonal background gradients (light + dark mode, all 5 seasons)
- `white-space: pre-line` on `.sacred-pause-message`

### 2. Refactor SLV-01 Season Transition → Sacred Pause

**File:** `src/readings.js`

In `setLiturgicalSeason()`, replace any custom season overlay code with:

```javascript
var sacredPause = require('./sacred-pause.js');

// After determining season string (around line 46):
var lastSeason = null;
try { lastSeason = localStorage.getItem('mf-last-season'); } catch (e) {}

if (lastSeason && lastSeason !== season && !window._devSkipSeasonOverlay) {
  var names = {
    advent: 'The Season of Advent',
    christmas: 'The Christmas Season',
    lent: 'The Season of Lent',
    easter: 'The Easter Season',
    ordinary: 'Ordinary Time'
  };
  var messages = {
    advent: 'A time of joyful waiting and preparation.',
    christmas: 'The Word was made flesh, and dwelt among us.',
    lent: 'Return to Me with your whole heart.',
    easter: 'He is risen. Alleluia!',
    ordinary: 'Growing in grace, day by day.'
  };
  sacredPause.show({
    label: 'A NEW SEASON',
    title: names[season] || season,
    message: messages[season] || '',
    timeout: 4000,
    storageKey: 'mf-last-season',
    storageVal: season
  });
} else {
  try { localStorage.setItem('mf-last-season', season); } catch (e) {}
}
```

If SLV-01 Part C's custom `#seasonTransition` div and `.season-overlay` CSS exist, remove them. The `.sacred-pause` classes replace them entirely.

### 3. SLV-08 — Prayer Tool Entry Pause

**File:** `src/reader.js` — modify `readerOpen()` (line 38)

At the TOP of the `if (isNewOpen)` block (line 78), before `overlay.classList.add('open')`:

```javascript
var sacredPause = require('./sacred-pause.js');
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };

// Inside readerOpen, at start of isNewOpen block:
if (PRAYER_MODES[mode]) {
  var pauseKey = 'mf-prayer-pause-' + mode;
  sacredPause.show({
    title: mod.getTitle ? mod.getTitle(params) : '',
    message: 'In the name of the Father,\nand of the Son,\nand of the Holy Spirit. Amen.',
    timeout: 2500,
    storageKey: pauseKey,
    guard: 'session'
  });
}
```

**CRITICAL:** The pause is purely visual. The reader still opens behind it at z-1000. Do NOT add any `await` or callback gating — the `readerOpen` flow continues immediately after `show()`. The sacred pause sits at z-10000 above the reader. When it fades, the reader and its content are already loaded.

The existing content fade-in (`bodyEl.style.opacity = '0'` → `'1'` at 200ms) still runs. It completes long before the 2500ms pause dismisses. When the pause fades, the content is visible at full opacity.

**Do NOT add pause for these modes:** `examination`, `bible`, `ccc`, `explore`, `settings`, `firstfriday`.

### 4. SLV-09 — Holy Day & Solemnity Recognition

**File:** `src/readings.js` — add `checkSolemnityPause()` function

Call it from the startup flow, after `fetchLiturgicalDay().then()` resolves and after `setLiturgicalSeason()` runs. This ensures `data-season` is already set and the season transition pause (if any) has been triggered.

```javascript
function checkSolemnityPause(events) {
  var sacredPause = require('./sacred-pause.js');
  var now = getNow();
  var m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d; });
  if (!today.length) return;
  var e = today[0];

  var majorDays = {
    'Easter':       { msg: 'He is risen. Alleluia, alleluia!' },
    'Christmas':    { msg: 'For unto us a Child is born, unto us a Son is given.' },
    'Pentecost':    { msg: 'Come, Holy Spirit, fill the hearts of your faithful.' },
    'AshWednesday': { msg: 'Remember that you are dust, and to dust you shall return.' },
    'GoodFri':      { msg: 'By your holy Cross, you have redeemed the world.' },
    'EasterVigil':  { msg: 'Lumen Christi. The Light of Christ.' },
    'PalmSun':      { msg: 'Blessed is he who comes in the name of the Lord.' },
    'AllSaints':    { msg: 'After this I had a vision of a great multitude, which no one could count.' },
    'Ascension':    { msg: 'He was lifted up, and a cloud took him from their sight.' },
    'HolyThurs':    { msg: 'Do this in remembrance of Me.' }
  };

  // Dedup: if season also changed today, the season pause covers these
  var SEASON_COVERS = { 'Easter': 1, 'Christmas': 1, 'AshWednesday': 1 };
  var key = e.event_key || '';
  if (SEASON_COVERS[key] && sacredPause.isActive()) {
    try { localStorage.setItem('mf-pause-solemn', new Date().toISOString().slice(0, 10)); } catch (ex) {}
    return;
  }

  var major = majorDays[key];
  if (major) {
    sacredPause.showAfter({
      title: e.name || key,
      message: major.msg,
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
    return;
  }

  if (e.holy_day_of_obligation) {
    sacredPause.showAfter({
      label: 'HOLY DAY OF OBLIGATION',
      title: e.name || '',
      message: 'The faithful are obliged to attend Mass today.',
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
  }
}
```

Wire it into the startup chain — find where `setLiturgicalSeason(events)` is called and add `checkSolemnityPause(events)` right after it:

```javascript
readings.setLiturgicalSeason(events);
readings.checkSolemnityPause(events);  // must come after season is set
```

Export `checkSolemnityPause` from readings.js.

### 5. SLV-10 — Readings Liturgical Day Header

**File:** `src/readings.js` — in `fetchReadings()` (~line 252)

After the readings HTML is built (the `sections.map()` block around line 282), prepend a liturgical day header:

```javascript
// Before el.innerHTML = html:
var litDay = '';
var litColor = '';
try {
  if (window._litcalCache) {
    var now2 = getNow();
    var todayKey = now2.getFullYear() + '-'
      + String(now2.getMonth() + 1).padStart(2, '0') + '-'
      + String(now2.getDate()).padStart(2, '0');
    var entry = window._litcalCache.events;
    if (entry && !Array.isArray(entry) && entry[todayKey]) {
      litDay = entry[todayKey].name || '';
      litColor = entry[todayKey].color || '';
    } else if (Array.isArray(entry)) {
      var m2 = now2.getMonth() + 1, d2 = now2.getDate();
      var td = entry.filter(function(ev) { return ev.month === m2 && ev.day === d2; });
      if (td.length) {
        litDay = td[0].name || '';
        litColor = (td[0].color && td[0].color[0]) || '';
      }
    }
  }
} catch (ex) {}

if (litDay) {
  html = '<div class="readings-lit-header" data-lit-color="' + esc(litColor) + '">'
    + '<div class="readings-lit-day">' + esc(litDay) + '</div>'
    + '</div>' + html;
}

el.innerHTML = html;
```

**File:** `css/app.css` — add readings liturgical header styles:

```css
.readings-lit-header { text-align:center;padding:var(--space-3) var(--space-4) var(--space-4);margin-bottom:var(--space-2); }
.readings-lit-day { font-family:var(--font-display);font-size:var(--text-lg);font-weight:var(--weight-bold);color:var(--color-text-primary);letter-spacing:0.015em;line-height:1.3; }
.readings-lit-header::after { content:'';display:block;width:6px;height:6px;border-radius:50%;margin:var(--space-2) auto 0;background:var(--color-accent); }
.readings-lit-header[data-lit-color="purple"]::after { background:#6B21A8; }
.readings-lit-header[data-lit-color="red"]::after { background:#DC2626; }
.readings-lit-header[data-lit-color="white"]::after { background:#94A3B8; }
.readings-lit-header[data-lit-color="green"]::after { background:#16A34A; }
.readings-lit-header[data-lit-color="rose"]::after { background:#DB2777; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="purple"]::after { background:#A855F7; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="red"]::after { background:#EF4444; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="white"]::after { background:#94A3B8; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="green"]::after { background:#22C55E; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="rose"]::after { background:#EC4899; }
```

### 6. SLV-11 — Examination Centering Enhancement

**File:** `css/app.css` — modify existing exam-opening styles (lines 2699-2704)

Replace the following rules with enhanced versions. See spec SLV-11 for exact before/after CSS. Key changes:

- `.exam-opening`: top padding `--space-5` → `--space-8`, max-width `420px` → `380px`
- `.exam-opening-icon`: color `--color-primary` → `--color-sacred`, add `filter: drop-shadow()`, increase margin-bottom
- `.exam-opening-text`: font-size `--text-sm` → `--text-base`, line-height `1.7` → `1.8`
- `.exam-opening-btn`: background `--color-primary` → `--color-sacred`, add sacred glow box-shadow

Add dark mode overrides:
```css
html[data-theme="dark"] .exam-opening-icon {
  color: var(--color-sacred);
  filter: drop-shadow(0 0 16px color-mix(in srgb, var(--color-sacred) 25%, transparent));
}
html[data-theme="dark"] .exam-opening-text {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}
html[data-theme="dark"] .exam-opening-btn {
  background: var(--color-sacred);
  box-shadow: 0 0 20px color-mix(in srgb, var(--color-sacred) 20%, transparent);
}
```

---

## Post-implementation

```bash
npm run build
# Test sequence:
# 1. Set mf-last-season to "ordinary" in localStorage
# 2. Dev panel: set date to 2026-02-18 (Ash Wednesday) — season pause should fire
# 3. Same session: open Rosary — prayer entry pause should fire (if under cap)
# 4. Same session: open Stations — should be skipped (session cap = 2)
# 5. Dev panel: set date to 2026-04-03 (Good Friday) — solemnity pause should fire
# 6. Dev panel: set date to 2026-04-05 (Easter) — season pause fires, Easter solemnity deduped
# 7. Check readings header on More tab — liturgical day name with color dot
# 8. Open Examination — centering screen has warm gold treatment
# 9. Repeat all tests in dark mode
git add -A
git commit -m "feat: SLV-07→11 — Sacred Pause system, prayer entry, solemnity recognition, readings header, exam enhancement"
```
