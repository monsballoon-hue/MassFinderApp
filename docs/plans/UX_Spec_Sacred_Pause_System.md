# UX Spec — Sacred Pause System (SLV-07 through SLV-11)

**Created:** 2026-03-15
**Status:** Implemented
**Prefix:** SLV (Soul / Visual Language — addendum to UX_Spec_Soul_Visual_Language.md)
**Claude Code prompt:** `docs/plans/CLAUDE_CODE_PROMPT_SLV_PAUSE.md`
**Branch:** `content-additions`
**Depends on:** SLV-01 (the season transition overlay becomes the first consumer of the shared system)

| ID | Title | Status |
|----|-------|--------|
| SLV-07 | Sacred Pause Infrastructure | done |
| SLV-08 | Prayer Tool Entry Pause | done |
| SLV-09 | Holy Day & Solemnity Recognition | done |
| SLV-10 | Readings Liturgical Day Header | done |
| SLV-11 | Examination Centering Screen Enhancement | done |

---

## Overview

The season transition interstitial (SLV-01) revealed a design pattern with much broader application. For 3-4 seconds, the user leaves the data-driven utility layer and enters a contemplative space — no cards, no grids, no navigation. Just a message, a liturgical color, and breathing room. This spec extracts that pattern into a reusable system ("Sacred Pause") and applies it at every natural threshold between the app's utility and devotional modes.

**Core principle: The Sacred Pause is a threshold, not an interruption.**

In a church, you don't walk directly from the parking lot into the middle of prayer. You pass through the narthex. You dip your hand in holy water. You genuflect. These are thresholds — tiny moments that shift your posture from "I was just driving" to "I am in a sacred place." The Sacred Pause is the digital narthex.

**What makes it work (enforced for every instance):**
1. **Rare** — each trigger fires at most once per session or once per day
2. **Earned** — the user chose to be here (opened a prayer tool, opened the app on Easter)
3. **Informational** — tells the user something true about this moment
4. **Instantly dismissable** — tap anywhere, always
5. **Never blocking** — content loads behind the pause; when it fades, the tool is ready

**What kills it (hard rules):**
- More than 2 sacred pauses in a single session → the 45-year-old parent uninstalls
- A pause on a utility screen (Find, Map, Saved) → cognitive friction for no sacred reason
- A pause that shows the same content as the previous one → feels like a bug
- A pause longer than 4 seconds without user interaction → feels like a loading screen

---

## SLV-07 — Sacred Pause Infrastructure

**Priority:** P1
**Files:** New file `src/sacred-pause.js`, `css/app.css`, `src/app.js` (require + export)
**Backlog:** New

### Problem

SLV-01 hardcodes the season transition overlay directly in `src/readings.js`. As we add more pause contexts (prayer entry, holy days, solemnities), each would duplicate the same overlay creation, dismiss logic, fade animation, and storage guards. This creates maintenance burden and inconsistency risk.

### User stories

**All three demographics:** They never see or interact with this spec directly. This is pure infrastructure that ensures every sacred pause feels identical in its mechanics — same fade speed, same tap-to-dismiss behavior, same typography hierarchy — while varying in content. The consistency is what makes the pattern trustworthy rather than random.

### Spec

#### New module: `src/sacred-pause.js`

```javascript
// src/sacred-pause.js — Shared sacred pause overlay system
// Full-screen contemplative moment between utility and devotional contexts.
// Every pause uses the same container, animation, dismiss behavior.
// Consumers call show() with content; the system handles everything else.

var _active = false;
var _timeout = null;
var _sessionCount = 0;
var MAX_PER_SESSION = 2;

/**
 * Show a sacred pause overlay.
 * @param {Object} opts
 * @param {string} opts.label       — uppercase category label (e.g., "A NEW SEASON", "HOLY DAY OF OBLIGATION")
 * @param {string} opts.title       — main display text (e.g., "The Season of Lent", "Easter Sunday")
 * @param {string} opts.message     — italic prayer-font message (e.g., "He is risen. Alleluia!")
 * @param {number} [opts.timeout]   — auto-dismiss ms (default 4000, min 1500, max 5000)
 * @param {string} [opts.storageKey]— localStorage key to prevent re-trigger (e.g., "mf-pause-season")
 * @param {string} [opts.storageVal]— value to check against (e.g., "lent") — if current matches, skip
 * @param {string} [opts.guard]     — "session" (sessionStorage) or "day" (localStorage with date) or "once" (localStorage permanent)
 * @param {Function} [opts.onDismiss] — callback after fade-out completes
 * @returns {boolean} true if pause was shown, false if skipped
 */
function show(opts) {
  if (!opts || !opts.title) return false;
  if (_active) return false;

  // Session cap — never more than MAX_PER_SESSION per app open
  if (_sessionCount >= MAX_PER_SESSION) return false;

  // Storage guard — check if this pause was already shown
  if (opts.storageKey) {
    try {
      if (opts.guard === 'session') {
        if (sessionStorage.getItem(opts.storageKey)) return false;
      } else if (opts.guard === 'day') {
        var today = new Date().toISOString().slice(0, 10);
        if (localStorage.getItem(opts.storageKey) === today) return false;
      } else if (opts.guard === 'once') {
        if (localStorage.getItem(opts.storageKey) === (opts.storageVal || '1')) return false;
      } else {
        // Default: check value match
        if (localStorage.getItem(opts.storageKey) === opts.storageVal) return false;
      }
    } catch (e) {}
  }

  _active = true;
  _sessionCount++;

  var timeout = Math.max(1500, Math.min(5000, opts.timeout || 4000));

  // Create overlay
  var el = document.getElementById('sacredPause');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sacredPause';
    document.body.insertBefore(el, document.body.firstChild);
  }
  el.className = 'sacred-pause';
  el.innerHTML = '<div class="sacred-pause-content">'
    + (opts.label ? '<div class="sacred-pause-label">' + opts.label + '</div>' : '')
    + '<div class="sacred-pause-title">' + opts.title + '</div>'
    + (opts.message ? '<div class="sacred-pause-message">' + opts.message + '</div>' : '')
    + '</div>';

  // Dismiss handler
  var dismissed = false;
  function dismiss() {
    if (dismissed) return;
    dismissed = true;
    clearTimeout(_timeout);
    el.classList.add('dismissing');
    setTimeout(function() {
      if (el.parentNode) el.parentNode.removeChild(el);
      _active = false;
      if (opts.onDismiss) opts.onDismiss();
    }, 800);
  }
  el.addEventListener('click', dismiss);
  _timeout = setTimeout(dismiss, timeout);

  // Persist guard
  if (opts.storageKey) {
    try {
      if (opts.guard === 'session') {
        sessionStorage.setItem(opts.storageKey, '1');
      } else if (opts.guard === 'day') {
        localStorage.setItem(opts.storageKey, new Date().toISOString().slice(0, 10));
      } else {
        localStorage.setItem(opts.storageKey, opts.storageVal || '1');
      }
    } catch (e) {}
  }

  return true;
}

/**
 * Check if a pause is currently active (for sequencing)
 */
function isActive() {
  return _active;
}

/**
 * Queue a pause to show after current one dismisses
 * @param {Object} opts — same as show()
 * @param {number} [delay] — ms after previous dismiss (default 600)
 */
function showAfter(opts, delay) {
  if (!_active) return show(opts);
  var d = delay || 600;
  // Store a one-time listener
  var origDismiss = opts.onDismiss;
  // Poll for active=false (simpler than event system for 2-max queue)
  var poll = setInterval(function() {
    if (!_active) {
      clearInterval(poll);
      setTimeout(function() {
        opts.onDismiss = origDismiss;
        show(opts);
      }, d);
    }
  }, 100);
}

module.exports = {
  show: show,
  showAfter: showAfter,
  isActive: isActive
};
```

#### CSS (add to `css/app.css` — near the SLV-01 seasonal rules or after them)

```css
/* ── Sacred Pause — shared contemplative overlay ── */
.sacred-pause {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg);
  opacity: 0;
  animation: sacredPauseIn 0.6s ease-out forwards;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
@keyframes sacredPauseIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.sacred-pause.dismissing {
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  pointer-events: none;
}
.sacred-pause-content {
  text-align: center;
  padding: var(--space-8);
  max-width: 340px;
}
.sacred-pause-label {
  font-family: var(--font-body);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-accent);
  margin-bottom: var(--space-4);
  opacity: 0;
  animation: sacredPauseText 0.5s ease-out 0.2s forwards;
}
.sacred-pause-title {
  font-family: var(--font-display);
  font-size: var(--text-3xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  line-height: 1.2;
  margin-bottom: var(--space-4);
  letter-spacing: 0.015em;
  opacity: 0;
  animation: sacredPauseText 0.5s ease-out 0.35s forwards;
}
.sacred-pause-message {
  font-family: var(--font-prayer);
  font-size: var(--text-lg);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: 1.5;
  opacity: 0;
  animation: sacredPauseText 0.5s ease-out 0.5s forwards;
}
@keyframes sacredPauseText {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* Seasonal background — inherit ambient body gradients */
:root[data-season="lent"] .sacred-pause,
:root[data-season="advent"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #F5F3F7 100%);
}
:root[data-season="easter"] .sacred-pause,
:root[data-season="christmas"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #FBF9F3 100%);
}
:root[data-season="ordinary"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #F5F8F5 100%);
}

/* Dark mode seasonal backgrounds */
html[data-theme="dark"][data-season="lent"] .sacred-pause,
html[data-theme="dark"][data-season="advent"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #1C1A22 100%);
}
html[data-theme="dark"][data-season="easter"] .sacred-pause,
html[data-theme="dark"][data-season="christmas"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #1E1C18 100%);
}
html[data-theme="dark"][data-season="ordinary"] .sacred-pause {
  background: linear-gradient(180deg, var(--color-bg) 0%, #1A1E1A 100%);
}
```

#### Integration: Refactor SLV-01 to use this system

**In `src/readings.js`**, the `setLiturgicalSeason()` function's season transition code (from SLV-01 Part C) should be replaced with:

```javascript
var sacredPause = require('./sacred-pause.js');

// Inside setLiturgicalSeason(), after determining season:
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

This eliminates the custom overlay code from SLV-01 Part C and replaces it with a single `sacredPause.show()` call. The `#seasonTransition` div and its dedicated CSS classes (`.season-overlay` etc.) are no longer needed.

#### Registration in `src/app.js`

Add to the require block:
```javascript
var sacredPause = require('./sacred-pause.js');
```

And expose for modules that need it:
```javascript
window._sacredPause = sacredPause;
```

### Cascading impacts

- **SLV-01 Part C is replaced** by this spec. If SLV-01 has already been implemented, the custom overlay code should be migrated to use `sacred-pause.js`. If not yet implemented, skip SLV-01 Part C entirely and use this instead.
- The `MAX_PER_SESSION = 2` cap means the season transition + one holy day recognition is the maximum on any given app open. If the user then opens a prayer tool, the prayer entry pause is *skipped* (session count exhausted). This is correct — don't overwhelm.
- The `showAfter()` method handles the case where season transition AND solemnity recognition both trigger on the same app open (e.g., first open on Easter Sunday = season change from lent→easter + Easter solemnity). Season fires first; solemnity queues after a 600ms gap. Both count against the session cap.

### Test checklist

- [ ] `sacredPause.show()` creates overlay, fades in with staggered text animation
- [ ] Tap-to-dismiss: overlay fades out in <1s
- [ ] Auto-dismiss at specified timeout
- [ ] Storage guard "session": shows once, cleared on tab close
- [ ] Storage guard "day": shows once per calendar day
- [ ] Storage guard default: checks value match
- [ ] Session cap: third `show()` call returns false
- [ ] `showAfter()`: queues pause after current one dismisses
- [ ] Dark mode: background gradient renders correctly per season
- [ ] SLV-01 season transition works identically via the new system
- [ ] z-index 10000: overlay covers everything including install guide
- [ ] No interaction with reader overlay (z-index 1000) — sacred pause sits above

---

## SLV-08 — Prayer Tool Entry Pause

**Priority:** P1
**Files:** `src/reader.js` (line 38, `readerOpen()`), `src/sacred-pause.js`
**Depends on:** SLV-07
**Backlog:** New

### Problem

When a user opens a prayer tool, the transition is mechanical: tap card → reader slides up → content appears. There's no moment of centering — no threshold between "I was browsing the More tab" and "I am now praying." In a church, you kneel before you begin. The app should offer a digital equivalent.

### User stories

**72-year-old parishioner:** Taps "Guided Rosary." For 2 seconds she sees "The Holy Rosary" in beautiful display type with "In the name of the Father, and of the Son, and of the Holy Spirit" in Georgia italic. She makes the Sign of the Cross. The rosary tool appears. She's already in a prayerful posture before the first bead.

**25-year-old phone-native:** Taps "Prayer Book." Brief centering moment. Thinks "this app treats prayer as something worth pausing for." It's the equivalent of a meditation app's breathing intro — but this one is Catholic and earned, not performative.

**45-year-old parent:** Taps "Stations of the Cross" with kids in the car for a Lenten Friday. The 2-second pause is brief enough to not annoy, but long enough to shift mental gears from "parent wrangling" to "prayer." Tap-to-skip is always available.

### Spec

#### Injection point: `readerOpen()` in `src/reader.js`

Inside the `if (isNewOpen)` block (line 78), before the overlay opens, check if the mode qualifies for a prayer entry pause:

```javascript
var sacredPause = require('./sacred-pause.js');

// Inside readerOpen(), at the start of the isNewOpen block:
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };

if (isNewOpen && PRAYER_MODES[mode]) {
  var pauseKey = 'mf-prayer-pause-' + mode;
  sacredPause.show({
    label: null, // no category label for prayer entry — just title and invocation
    title: mod.getTitle ? mod.getTitle(params) : '',
    message: 'In the name of the Father,\nand of the Son,\nand of the Holy Spirit. Amen.',
    timeout: 2500,
    storageKey: pauseKey,
    guard: 'session'
  });
}
```

**Why these modes and not others:**
- **rosary, chaplet, stations, novena, prayerbook** — devotional prayer tools. The user is about to pray. A centering moment is natural.
- **NOT examination** — it already has its own centering prayer screen (line 36-47 in examination.js) with a cross icon and the Prayer Before Examination. Adding another pause before it would be redundant. SLV-11 enhances the existing screen instead.
- **NOT bible, ccc, explore, settings, firstfriday** — these are reference/utility tools. The user is looking something up, not entering prayer.

#### Session guard behavior

`guard: 'session'` means: once per tool per browser session (cleared on tab close). So:
- Open Rosary → see pause → close Rosary → open Rosary again → NO pause (already seen this session)
- Open Rosary → see pause → open Stations → see pause (different tool)
- Close browser tab → reopen app → open Rosary → see pause (session cleared)

This means a typical session shows at most 1-2 prayer entry pauses (the user usually opens 1-2 tools). Combined with the session cap of 2 in SLV-07, if a season transition or solemnity already fired, prayer pauses are skipped entirely — correct behavior.

#### The Sign of the Cross as universal invocation

"In the name of the Father, and of the Son, and of the Holy Spirit. Amen." is the universal Catholic opening prayer. It's appropriate for every prayer tool. It's also short enough that the 45-year-old parent reads it in under 2 seconds.

**Message rendering:** The `\n` line breaks in the message create three lines:
```
In the name of the Father,
and of the Son,
and of the Holy Spirit. Amen.
```

The `sacred-pause-message` CSS uses `white-space: pre-line` to honor these breaks. Add this to the existing CSS:

```css
.sacred-pause-message {
  /* ...existing properties... */
  white-space: pre-line;
}
```

#### Timing: reader opens BEHIND the pause

The sacred pause overlay is z-index 10000. The reader overlay is z-index 1000. So the reader can begin its slide-up animation (0.5s) while the sacred pause is still showing. When the pause fades after 2.5 seconds, the reader is fully open and content is loaded. The user perceives zero loading time — the pause *absorbed* the load time.

This means the existing `readerOpen()` flow continues unchanged after the pause check — it doesn't wait for the pause to dismiss. The pause is purely visual, not flow-blocking.

### Cascading impacts

- The `isNewOpen` check already exists at line 78. The pause code runs before the overlay opens, so the reader content starts loading immediately.
- If `sacredPause.show()` returns `false` (session cap exceeded, or already shown this session), the reader opens normally — no visible difference.
- The reader's own content fade-in (`bodyEl.style.opacity = '0'` → `'1'` at 200ms) happens under the pause overlay. By the time the pause dismisses at 2500ms, the content opacity is already at 1. No double-fade.
- The rosary's mystery selection screen (`_screen = 'select'`) renders as the first content. The pause shows "The Holy Rosary" + invocation. When it fades, the user sees the mystery selection. This is a beautiful sequence: centering → choose your mysteries → begin.

### Test checklist

- [ ] Open Rosary: sacred pause appears for ~2.5 seconds with "The Holy Rosary" and Sign of the Cross
- [ ] Tap to dismiss: pause fades, rosary selection screen is already loaded behind it
- [ ] Open Rosary again same session: NO pause
- [ ] Open Stations same session: pause appears (different tool)
- [ ] Close tab, reopen, open Rosary: pause appears (session cleared)
- [ ] Season transition + Rosary open: if session cap reached (2 pauses), rosary pause is skipped
- [ ] Examination: NO pause (has its own centering screen)
- [ ] Bible reader: NO pause (reference tool)
- [ ] CCC: NO pause (reference tool)
- [ ] Settings: NO pause
- [ ] Reader content is fully loaded when pause dismisses (no blank flash)
- [ ] Dark mode: pause renders correctly
- [ ] Pause does NOT block `trapFocus` or wake lock acquisition in rosary/stations

---

## SLV-09 — Holy Day & Solemnity Recognition

**Priority:** P2
**Files:** `src/readings.js` (after `fetchLiturgicalDay()` resolves in startup flow), `src/sacred-pause.js`
**Depends on:** SLV-07
**Backlog:** New

### Problem

Easter Sunday, Christmas, Pentecost, Ash Wednesday, All Saints — these are the most significant days of the Church year. Currently, the app treats them identically to ordinary Tuesdays: the saint card changes, the HDO banner might appear, but there's no moment of recognition proportional to the day's importance. The app should acknowledge these days the way a church does — with visible celebration or solemnity.

### User stories

**72-year-old parishioner:** Opens the app on Easter morning. Before she sees the Find tab, a full-screen moment: "Easter Sunday" in gold accent, "He is risen. Alleluia, alleluia!" in Georgia italic. She smiles. The app knows what day it is. She feels seen.

**25-year-old phone-native:** Opens the app on the Feast of the Immaculate Conception. Didn't realize it was a Holy Day of Obligation. The sacred pause says "Holy Day of Obligation — The Immaculate Conception of the Blessed Virgin Mary" with "Find a Mass near you" as the message. He taps through and checks Mass times. The pause was genuinely useful.

**45-year-old parent:** Opens the app on All Saints' Day. Brief recognition. She already knew. Taps to dismiss in 0.5 seconds. No harm done.

### Spec

#### Trigger: app startup, after litcal data resolves

In the app startup flow (in `src/readings.js` or `src/app.js` where `fetchLiturgicalDay().then(...)` is called), after the season is set and the saint card is rendered:

```javascript
var sacredPause = require('./sacred-pause.js');

function checkSolemnityPause(events) {
  var now = getNow();
  var m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d; });
  if (!today.length) return;
  var e = today[0];

  // Tier 1: Major solemnities — longer pause, curated messages
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

  var key = e.event_key || '';
  var major = majorDays[key];

  if (major) {
    // Use showAfter in case season transition is active
    sacredPause.showAfter({
      label: null,
      title: e.name || key,
      message: major.msg,
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
    return;
  }

  // Tier 2: Holy Days of Obligation (not already in major list)
  if (e.holy_day_of_obligation) {
    sacredPause.showAfter({
      label: 'HOLY DAY OF OBLIGATION',
      title: e.name || '',
      message: 'The faithful are obliged to attend Mass today.',
      timeout: 4000,
      storageKey: 'mf-pause-solemn',
      guard: 'day'
    }, 600);
    return;
  }

  // Tier 3: Other solemnities (grade 7 / rank "triduum" or "solemnity") — skip
  // These happen every Sunday and would fire too often. Only major + HDO get pauses.
}
```

#### Frequency: once per calendar day

`guard: 'day'` with `storageKey: 'mf-pause-solemn'` means: the user sees one solemnity pause per calendar day, regardless of how many times they open the app. The stored value is today's ISO date string (`2026-04-05`). Tomorrow, the guard resets.

#### Sequencing with season transition (SLV-01)

On Easter Sunday, BOTH triggers fire:
1. Season changes from `lent` → `easter` → SLV-01 shows "The Easter Season / He is risen. Alleluia!"
2. Today is Easter → SLV-09 wants to show "Easter Sunday / He is risen. Alleluia, alleluia!"

These are almost identical. To prevent redundancy:

```javascript
// In checkSolemnityPause, before showing:
// If today's major day message is essentially the same as the season message, skip.
var seasonJustChanged = sacredPause.isActive();
if (seasonJustChanged && majorDays[key]) {
  // Season transition already covered this moment. Skip.
  // Persist the day guard so it doesn't re-fire on next open today.
  try { localStorage.setItem('mf-pause-solemn', new Date().toISOString().slice(0, 10)); } catch (e) {}
  return;
}
```

Better yet: define a deduplication list of days where the season transition IS the solemnity recognition:

```javascript
var SEASON_COVERS = {
  'Easter': 1,       // season change lent→easter covers Easter
  'Christmas': 1,    // season change advent→christmas covers Christmas
  'AshWednesday': 1  // season change ordinary→lent covers Ash Wednesday
};
if (SEASON_COVERS[key]) {
  // If season also changed today, the season pause is sufficient
  var lastSeason = null;
  try { lastSeason = localStorage.getItem('mf-last-season'); } catch(e) {}
  if (lastSeason && lastSeason !== currentSeason) {
    try { localStorage.setItem('mf-pause-solemn', new Date().toISOString().slice(0, 10)); } catch (e) {}
    return; // season transition covers it
  }
}
```

For days where the season does NOT change (Good Friday, Pentecost, All Saints, Ascension, Holy Thursday, Palm Sunday), the solemnity pause fires normally.

#### Data source

The litcal data (`data/litcal-2026.json`) already provides everything needed:
- `key` → matches `majorDays` lookup
- `name` → display title
- `color` → liturgical color (could be used for future accent variation)
- `rank` → filters solemnities from memorials/weekdays
- `holy_day_of_obligation` field is NOT directly in the litcal JSON (it's computed from the key in `readings.js` line 106). The holy day check must use the same logic as `renderHDOBanner()`.

**Correction:** Looking at the litcal JSON structure, it doesn't have `holy_day_of_obligation` as a field. The HDO logic in the current code uses the events array from `getLiturgicalEventsFromLitCal()` which adds this field during processing. So `checkSolemnityPause()` should receive the processed events array, not the raw litcal JSON.

### Cascading impacts

- The session cap (MAX_PER_SESSION = 2) means: season transition (1) + solemnity (1) = cap reached. Prayer tool entry pauses (SLV-08) would be skipped on major days. This is acceptable — on Easter Sunday, the user has already had two sacred moments.
- On ordinary days with no season change, the session cap is untouched. Prayer tool entry pauses work normally.
- The HDO banner in the Find tab (`renderHDOBanner()`) still renders regardless of the sacred pause. The pause is a *moment*; the banner is persistent *information*. They serve different purposes.
- `showAfter()` polls at 100ms intervals for `_active === false`. On a 4-second season pause + 600ms delay, the solemnity pause appears at ~4.7 seconds after app open. This is fine — the user has already dismissed the first pause and is looking at the app.

### Test checklist

- [ ] Dev panel: set date to 2026-04-05 (Easter) → season change pause fires, then Easter solemnity is SKIPPED (dedup)
- [ ] Dev panel: set date to 2026-04-03 (Good Friday, no season change) → Good Friday pause fires
- [ ] Dev panel: set date to 2026-05-24 (Pentecost, no season change) → Pentecost pause fires
- [ ] Dev panel: set date to 2026-12-08 (Immaculate Conception, HDO) → HDO pause with obligation message
- [ ] Second open same day: no pause (day guard)
- [ ] Ordinary Tuesday: no pause
- [ ] Session cap: season + solemnity = 2 → prayer tool pause skipped
- [ ] Dark mode: all pause variants render correctly
- [ ] Message text is curated and accurate for each major day

---

## SLV-10 — Readings Liturgical Day Header

**Priority:** P3
**Files:** `src/readings.js`, `css/app.css`
**Depends on:** SLV-07 (conceptually, but can be implemented independently as a lighter-weight element)
**Backlog:** New

### Problem

The daily readings on the More tab render as expandable entries — heading, reference, tap to expand. There's no context about what liturgical day the readings belong to. The user sees "First Reading — Isaiah 65:17-21" but doesn't know they're reading for the Fourth Sunday of Lent unless they look at the saint card above.

### User stories

**72-year-old parishioner:** Expands the first reading. Above the reading entries, she sees "Fourth Sunday of Lent" in display font with the liturgical color (rose, since today is Laetare Sunday). She nods — this grounds the reading in the liturgical context she knows from Mass.

**25-year-old phone-native:** Sees the liturgical day header and realizes the readings change daily. Starts checking back each day. The header makes the readings feel curated, not random.

**45-year-old parent:** Glances at it, appreciates the context, moves on. Zero friction.

### Spec

#### Implementation: liturgical header above readings entries

This is NOT a full-page sacred pause overlay. It's a content-level element — a styled header that appears at the top of the `#readingsContent` container when readings are rendered.

**In `src/readings.js`**, in the `fetchReadings().then()` chain, before the readings entries HTML, prepend a liturgical day header:

```javascript
// Get current liturgical day from cache
var litDay = '';
var litColor = '';
if (window._litcalCache && window._litcalCache.events) {
  var now = getNow();
  var todayKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + String(now.getDate()).padStart(2, '0');
  // _litcalCache.events is the full litcal object keyed by date
  var todayEntry = window._litcalCache.events[todayKey] || null;
  // OR if events is the processed array:
  var m = now.getMonth() + 1, d = now.getDate();
  var todayEvents = (Array.isArray(window._litcalCache.events)
    ? window._litcalCache.events.filter(function(e) { return e.month === m && e.day === d; })
    : []);
  if (todayEvents.length) {
    litDay = todayEvents[0].name || '';
    litColor = (todayEvents[0].color && todayEvents[0].color[0]) || '';
  } else if (todayEntry) {
    litDay = todayEntry.name || '';
    litColor = todayEntry.color || '';
  }
}

var headerHtml = '';
if (litDay) {
  headerHtml = '<div class="readings-lit-header" data-lit-color="' + esc(litColor) + '">'
    + '<div class="readings-lit-day">' + esc(litDay) + '</div>'
    + '</div>';
}

// Prepend to readings HTML
el.innerHTML = headerHtml + html;
```

#### CSS

```css
.readings-lit-header {
  text-align: center;
  padding: var(--space-3) var(--space-4) var(--space-4);
  margin-bottom: var(--space-2);
}
.readings-lit-day {
  font-family: var(--font-display);
  font-size: var(--text-lg);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  letter-spacing: 0.015em;
  line-height: 1.3;
}

/* Liturgical color accent dot */
.readings-lit-header::after {
  content: '';
  display: block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin: var(--space-2) auto 0;
  background: var(--color-accent);
}
.readings-lit-header[data-lit-color="purple"]::after { background: #6B21A8; }
.readings-lit-header[data-lit-color="red"]::after    { background: #DC2626; }
.readings-lit-header[data-lit-color="white"]::after   { background: #94A3B8; }
.readings-lit-header[data-lit-color="green"]::after   { background: #16A34A; }
.readings-lit-header[data-lit-color="rose"]::after    { background: #DB2777; }

/* Dark mode */
html[data-theme="dark"] .readings-lit-header[data-lit-color="purple"]::after { background: #A855F7; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="red"]::after    { background: #EF4444; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="white"]::after  { background: #94A3B8; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="green"]::after  { background: #22C55E; }
html[data-theme="dark"] .readings-lit-header[data-lit-color="rose"]::after   { background: #EC4899; }
```

#### Why NOT a full sacred pause for readings

The readings section is embedded in the More tab — it's not a standalone reader that opens via `readerOpen()`. Readings expand in-place via `toggleReading()`. A full-page pause before expanding an accordion would be jarring and confusing. The liturgical header is the right scale: informational, always visible, zero interaction cost.

### Cascading impacts

- The `#readingsContent` container is re-rendered by `fetchReadings()` on every More tab load. The header re-renders with it — no stale state.
- The liturgical color dot uses the same color map as the saint card `[data-lit-color]` variants (lines 1841-1845 in CSS). These are hardcoded per-color because liturgical colors don't shift with season — they're fixed by the day's observance.
- The header's `--font-display` and `letter-spacing: 0.015em` are consistent with SLV-02's typography voice spec.
- If litcal data hasn't loaded yet when readings render (API timeout), `litDay` is empty and no header appears. The readings still render normally. When litcal resolves, the next More tab render will include the header.

### Test checklist

- [ ] More tab: readings section shows liturgical day name above entries
- [ ] Liturgical color dot matches the day's vestment color
- [ ] Rose on Laetare/Gaudete Sundays (test with dev date spoof)
- [ ] Dark mode: text and dot render correctly
- [ ] No litcal data loaded: header is omitted, readings render normally
- [ ] Font is --font-display with letter-spacing from SLV-02
- [ ] Header does not expand/collapse — it's always visible when readings are present

---

## SLV-11 — Examination Centering Screen Enhancement

**Priority:** P3
**Files:** `css/app.css` (lines 2699-2704), `src/examination.js` (lines 36-47)
**Depends on:** SLV-02 (warm text-shadow), SLV-03 (sacred glow concept)
**Backlog:** New

### Problem

The examination of conscience already has a centering prayer screen (implemented in PTR-03). It shows a cross SVG, the Prayer Before Examination, and a "Begin Examination" button. This is functionally correct, but visually it's styled identically to the rest of the reader — same background, same typography weight, same spacing. It doesn't feel like a threshold; it feels like step 1 of a wizard.

### User stories

**72-year-old parishioner:** Opens the examination. The centering screen feels warmer, more spacious, more like the quiet moment in the confessional before she begins. The cross has a faint glow. The prayer text has the warm Georgia feel from SLV-02. She takes a breath.

**25-year-old phone-native:** The centering screen feels distinctly different from the commandment review that follows. It's clearly a moment to pause, not a loading screen. The typography and spacing signal "this is sacred" before the checkboxes arrive.

**45-year-old parent:** The "Begin Examination" button is still prominent and tappable. She can skip through quickly. But the screen's warmth signals this isn't a settings form.

### Spec

#### Enhanced CSS for `.exam-opening`

**Before (line 2699):**
```css
.exam-opening {
  display:flex;flex-direction:column;align-items:center;text-align:center;
  padding:var(--space-5);max-width:420px;margin:0 auto;height:100%;overflow:hidden;
}
```

**After:**
```css
.exam-opening {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-5) var(--space-5);
  max-width: 380px;
  margin: 0 auto;
  height: 100%;
  overflow: hidden;
}
```

Changes: top padding increased from `--space-5` (20px) to `--space-8` (32px) for more generous breathing room. Max-width tightened from 420px to 380px for a more intimate reading column.

#### Cross icon sacred glow

**Before (line 2700):**
```css
.exam-opening-icon { color:var(--color-primary);margin-bottom:var(--space-3);opacity:0.6;flex-shrink:0; }
```

**After:**
```css
.exam-opening-icon {
  color: var(--color-sacred);
  margin-bottom: var(--space-5);
  opacity: 0.7;
  flex-shrink: 0;
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--color-sacred) 20%, transparent));
}
```

Changes: color from `--color-primary` (blue) to `--color-sacred` (warm gold). Increased bottom margin. Raised opacity from 0.6 to 0.7. Added drop-shadow glow matching the SLV-03 candlelight pattern.

**Dark mode:**
```css
html[data-theme="dark"] .exam-opening-icon {
  color: var(--color-sacred);
  filter: drop-shadow(0 0 16px color-mix(in srgb, var(--color-sacred) 25%, transparent));
}
```

#### Prayer text warm treatment

**Before (line 2702):**
```css
.exam-opening-text {
  font-family:var(--font-prayer);font-size:var(--text-sm);
  color:var(--color-text-secondary);line-height:1.7;...
}
```

**After:**
```css
.exam-opening-text {
  font-family: var(--font-prayer);
  font-size: var(--text-base);  /* was --text-sm — prayer text deserves full size */
  color: var(--color-text-secondary);
  line-height: 1.8;  /* was 1.7 — more breathing room */
  flex: 1;
  min-height: 0;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent);
  mask-image: linear-gradient(to bottom, black 80%, transparent);
}
```

Changes: font-size from `--text-sm` (15px) to `--text-base` (17px). Line-height from 1.7 to 1.8. The prayer text is sacred content — it deserves the same treatment as readings text.

**Dark mode warm shadow (from SLV-02):**
```css
html[data-theme="dark"] .exam-opening-text {
  text-shadow: 0 0 30px rgba(212, 168, 75, 0.04);
}
```

#### Button: sacred accent instead of primary blue

**Before (line 2703):**
```css
.exam-opening-btn {
  ...background:var(--color-primary);...
}
```

**After:**
```css
.exam-opening-btn {
  padding: var(--space-3) var(--space-6);
  background: var(--color-sacred);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  min-height: 48px;
  transition: all var(--transition-fast);
  -webkit-tap-highlight-color: transparent;
  margin-top: var(--space-5);
  flex-shrink: 0;
  box-shadow: 0 0 16px color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
```

Changes: background from `--color-primary` (blue) to `--color-sacred` (warm gold). Added sacred glow box-shadow to match SLV-03 pattern. Increased top margin.

**Dark mode:**
```css
html[data-theme="dark"] .exam-opening-btn {
  background: var(--color-sacred);
  box-shadow: 0 0 20px color-mix(in srgb, var(--color-sacred) 20%, transparent);
}
```

#### What NOT to change

- The cross SVG icon itself — keep the simple line cross. Don't add wood grain or ornamentation.
- The button text "Begin Examination" — clear and functional.
- The mask-image fade on the prayer text — this is correct progressive disclosure.
- The overall flow (centering → tap "Begin" → commandment review) — unchanged.

### Cascading impacts

- Changing `.exam-opening-icon` color to `--color-sacred` instead of `--color-primary` is a departure from the primary-blue accent used elsewhere in buttons. But this is a devotional context, not a utility context — sacred gold is more appropriate than action-blue.
- The `.exam-opening-btn` color change could feel inconsistent with other primary-action buttons in the app. However, the examination is the only prayer tool with its own centering screen, and the context is unambiguously sacred. The user is about to prepare for the Sacrament of Confession.
- The `filter: drop-shadow()` on the SVG icon works differently from `box-shadow` — it follows the shape of the SVG, not the bounding box. Test that the cross glow looks like light emanating from the cross, not a rectangular halo.

### Test checklist

- [ ] Centering screen: more generous top padding, tighter max-width
- [ ] Cross icon: warm gold color with soft glow (not blue)
- [ ] Dark mode: cross glow is visible and warm
- [ ] Prayer text: larger (17px), more line-height (1.8)
- [ ] Dark mode: warm text-shadow from SLV-02 applied
- [ ] Button: sacred gold with glow shadow
- [ ] Button: still has ≥48px min-height touch target
- [ ] "Begin Examination" flow: unchanged — tap button → commandment review
- [ ] 72-year-old test: prayer text is comfortably readable
- [ ] Cross SVG drop-shadow follows the cross shape, not a rectangle

---

## Implementation Dependencies (Full SLV Map)

```
SLV-07 (Sacred Pause Infrastructure)
  ├── SLV-01 refactored to use it (season transition)
  ├── SLV-08 depends on it (prayer tool entry)
  └── SLV-09 depends on it (holy day / solemnity)

SLV-08 (Prayer Tool Entry)
  └── Depends on SLV-07

SLV-09 (Holy Day / Solemnity)
  ├── Depends on SLV-07
  └── Deduplication with SLV-01 (season + solemnity same day)

SLV-10 (Readings Header)
  └── Independent (content element, not overlay)

SLV-11 (Examination Enhancement)
  ├── Enhanced by SLV-02 (warm text-shadow)
  └── Enhanced by SLV-03 (sacred glow pattern)
```

**Recommended implementation order:**
1. SLV-07 (infrastructure — everything else depends on this)
2. Refactor SLV-01 to use SLV-07
3. SLV-08 (prayer tool entry — high user impact, tests the system)
4. SLV-09 (solemnity recognition — needs dedup testing with SLV-01)
5. SLV-10 (readings header — independent, can be done anytime)
6. SLV-11 (examination enhancement — independent CSS, can be done anytime)

---

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:**
  - `src/sacred-pause.js` (new) — shared sacred pause overlay system with show(), showAfter(), isActive(), session cap (2), storage guards (session/day/once/value-match)
  - `src/app.js` — added require for sacred-pause.js
  - `src/readings.js` — refactored SLV-01 season transition from custom overlay to sacredPause.show(); added checkSolemnityPause() function with major day recognition and HDO support; added liturgical day header prepend in fetchReadings()
  - `src/reader.js` — added SLV-08 prayer entry pause in readerOpen() isNewOpen block for rosary, chaplet, stations, novena, prayerbook
  - `src/more.js` — wired readings.checkSolemnityPause(events) into startup chain after setLiturgicalSeason
  - `css/app.css` — replaced .season-overlay CSS with .sacred-pause CSS (staggered text animations, seasonal backgrounds, dark mode); added .readings-lit-header with color dots and dark mode; enhanced .exam-opening styles (sacred gold icon with glow, larger prayer text, sacred button with glow shadow, dark mode overrides)
- **Approach:** Created sacred-pause.js as the shared infrastructure, then refactored the existing SLV-01 season transition to use it (removing the old #seasonTransition div and .season-overlay CSS). Injected prayer entry pause non-blockingly at the start of the isNewOpen block in reader.js. Solemnity recognition uses showAfter() for sequencing with season transitions, with dedup for days where season change already covers the solemnity. Readings header resolves litcal data from the cached events array.
- **Deviations from spec:** None
- **Known issues:** None observed
