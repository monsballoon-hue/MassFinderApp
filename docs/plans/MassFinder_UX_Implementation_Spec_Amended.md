# MassFinder UX Implementation Spec — Amended
## Engagement, Retention, and Daily Habit Formation

**What changed from the previous spec:** The original 15 changes focused on making existing content more visible. This amended version keeps all 15 and adds 7 new retention mechanics (Changes 16-22) that create a daily habit loop. The original spec reorganized the store shelves. This amendment gives people a reason to walk in every morning.

**The habit loop this creates:**
- **Trigger:** Liturgical teaser on Find tab changes daily + More tab badge says "new content" + seasonal progress bar is incomplete
- **Action:** Open app, check today's content
- **Variable Reward:** Different saint, different readings, different CCC reflection every day — the user learns something they didn't know
- **Investment:** Saved churches, prayer activity history, confession cadence — the app remembers them and the data gets more valuable over time

**Persona-specific retention paths:**
- **Dorothy (55+):** Opens app Saturday afternoon → "Your Churches" shows weekend Mass times → she's done in 10 seconds. Returns next Saturday. HDO alerts bring her back mid-week when relevant.
- **Maria (30s):** Opens app most mornings → glances at liturgical teaser → taps to More tab → reads today's CCC reflection → maybe expands readings → uses rosary guide during Lent. Daily habit.
- **Lucas (20s):** Opens app daily → reads everything — saint, reflection, readings → taps CCC cross-references → prays rosary or examines conscience → checks prayer activity. Deep engagement.

---

## CHANGES 1-15: RETAINED FROM ORIGINAL SPEC

All 15 changes from the previous spec are retained exactly as written. Those cover:

1. Liturgical day teaser on Find tab
2. More tab content reorder (saint/readings up, about down)
3. Show all chips on mobile
4. First-visit welcome banner
5. "Your Churches" horizontal row on Find tab
6. Card chevron affordance
7. Saved tab active empty state
8. Prayer tool cards — entire card tappable
9. Dark mode auto-detection
10. Shaped skeleton loading states
11. Last-visit tracking in localStorage
12. More tab badge when daily content awaits
13. Seasonal urgency messaging
14. Text size preference
15. Section title emoji removal

**Do not re-implement these — they are specified in the previous version of this document.** This amendment adds Changes 16-22 below.

---

## CHANGE 16: Daily CCC Reflection Card

**Why this matters for retention:** This is the **variable reward**. Every day, the user sees a teaching they likely didn't know. It's the "did you know?" moment that creates a desire to check back tomorrow. With 1,423 CCC paragraphs under 400 characters, this runs for nearly 4 years without repeating.

**What:** A compact card in the More tab, positioned between the saint card and Today's Readings. Shows one CCC paragraph per day. Tappable to open the full paragraph + cross-references in the CCC bottom sheet.

**How daily selection works:** Deterministic hash from the date — same paragraph for all users on the same day, different paragraph tomorrow. No API call, no randomness, fully offline.

### JavaScript — new function in `src/readings.js` (or `src/more.js`)

```javascript
function getDailyCCCNumber() {
  var now = getNow();
  var daysSinceEpoch = Math.floor(now.getTime() / 86400000);
  // Map to a paragraph number using the curated pool
  // We skip the first ~20 paragraphs (meta/introductory) and focus on doctrinal content
  var pool = [];
  for (var i = 27; i <= 2865; i++) pool.push(i);
  return pool[daysSinceEpoch % pool.length];
}

function renderDailyReflection() {
  var el = document.getElementById('dailyReflection');
  if (!el) return;

  var num = getDailyCCCNumber();
  // Load catechism data (uses cached version if already loaded by CCC module)
  fetch('data/catechism.json').then(function(r) { return r.json(); }).then(function(d) {
    var text = d.paragraphs[String(num)];
    if (!text) { el.style.display = 'none'; return; }

    // Truncate to ~200 chars at a sentence boundary for the preview
    var preview = text;
    if (text.length > 220) {
      var cut = text.lastIndexOf('.', 200);
      if (cut > 80) preview = text.slice(0, cut + 1);
      else preview = text.slice(0, 200).trim() + '\u2026';
    }

    // Strip markdown formatting for clean display
    preview = preview.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1');

    el.innerHTML = '<div class="reflection-card" onclick="openCCC(\'' + num + '\')" role="button" tabindex="0">'
      + '<div class="reflection-label">Daily Reflection</div>'
      + '<div class="reflection-text">\u201C' + esc(preview) + '\u201D</div>'
      + '<div class="reflection-cite">Catechism \u00A7' + num + ' \u2014 Tap to read more</div>'
      + '</div>';
    el.style.display = '';
  }).catch(function() { el.style.display = 'none'; });
}
```

### HTML (`index.html`)

Add in the More tab, between the saint card section and the readings section:

```html
<div id="dailyReflection" class="more-section" style="display:none"></div>
```

### CSS (`css/app.css`)

```css
/* DAILY REFLECTION */
.reflection-card { padding: var(--space-4); background: var(--color-surface); border-left: 3px solid var(--color-accent); border-radius: var(--radius-md); cursor: pointer; transition: box-shadow var(--transition-fast); }
.reflection-card:hover { box-shadow: var(--shadow-card); }
.reflection-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); color: var(--color-accent-text); text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: var(--space-2); }
.reflection-text { font-family: var(--font-display); font-size: var(--text-base); color: var(--color-text-primary); line-height: 1.6; font-style: italic; }
.reflection-cite { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-2); }
```

### Call it from `renderMore()` in `src/more.js`:

After `renderSaintCard(events);`, add:

```javascript
renderDailyReflection();
```

---

## CHANGE 17: Liturgical Season Progress Tracker

**Why this matters for retention:** The Zeigarnik effect — incomplete tasks stay in the mind. A progress bar that says "Day 18 of 40 · Lent" creates a persistent psychological pull to keep checking in. The number changes every day. It's passive but it creates a sense of journey — the user is moving through the liturgical season WITH the Church, not just reading about it.

**When it shows:** Only during seasons with defined durations: Lent (46 days from Ash Wednesday to Holy Saturday), Advent (~28 days), Easter Season (50 days). Hidden during Ordinary Time.

### JavaScript — new function in `src/utils.js`

```javascript
function getSeasonProgress() {
  var now = getNow();
  var year = now.getFullYear();
  var easter = getEaster(year);
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Ash Wednesday = Easter - 46 days
  var ashWed = new Date(easter); ashWed.setDate(easter.getDate() - 46);
  // Holy Saturday = Easter - 1
  var holySat = new Date(easter); holySat.setDate(easter.getDate() - 1);
  // Pentecost = Easter + 49
  var pentecost = new Date(easter); pentecost.setDate(easter.getDate() + 49);

  // Advent: starts 4th Sunday before Christmas
  var christmas = new Date(year, 11, 25);
  var christmasDay = christmas.getDay();
  var advent1 = new Date(christmas);
  advent1.setDate(christmas.getDate() - (christmasDay === 0 ? 21 : (christmasDay + 21)));

  if (today >= ashWed && today <= holySat) {
    var elapsed = Math.floor((today - ashWed) / 86400000) + 1;
    var total = Math.floor((holySat - ashWed) / 86400000) + 1;
    return { season: 'Lent', day: elapsed, total: total, pct: Math.round((elapsed / total) * 100) };
  }
  if (today >= easter && today <= pentecost) {
    var elapsed = Math.floor((today - easter) / 86400000) + 1;
    return { season: 'Easter Season', day: elapsed, total: 50, pct: Math.round((elapsed / 50) * 100) };
  }
  if (today >= advent1 && today < christmas) {
    var elapsed = Math.floor((today - advent1) / 86400000) + 1;
    var total = Math.floor((christmas - advent1) / 86400000);
    return { season: 'Advent', day: elapsed, total: total, pct: Math.round((elapsed / total) * 100) };
  }
  return null;
}
```

Export `getSeasonProgress` from `utils.js`.

### Integrate into the liturgical teaser (Change 1):

In `_renderLiturgicalTeaser()` in `app.js`, after building the teaser HTML, append the progress bar if a season is active:

```javascript
var progress = utils.getSeasonProgress();
if (progress) {
  el.innerHTML += '<div class="season-progress">'
    + '<div class="season-progress-bar" style="width:' + progress.pct + '%"></div>'
    + '<span class="season-progress-label">Day ' + progress.day + ' of ' + progress.total + ' · ' + progress.season + '</span>'
    + '</div>';
}
```

### CSS (`css/app.css`)

```css
/* SEASON PROGRESS */
.season-progress { margin: var(--space-2) var(--space-4) 0; position: relative; height: 20px; background: var(--color-surface-hover); border-radius: 10px; overflow: hidden; }
.season-progress-bar { position: absolute; left: 0; top: 0; bottom: 0; background: var(--color-primary-muted); border-radius: 10px; transition: width 0.6s ease; opacity: 0.3; }
.season-progress-label { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; height: 100%; font-size: 11px; font-weight: var(--weight-semibold); color: var(--color-text-secondary); letter-spacing: 0.02em; }
```

---

## CHANGE 18: Return-Visit Context Card

**Why this matters for retention:** When a user returns after 2+ days, the app should acknowledge the gap and show what changed. This creates mild FOMO ("I missed the feast of St. Patrick!") that encourages more frequent visits. It also makes the app feel alive — it noticed you were gone and saved what you missed.

### JavaScript (`src/app.js`)

After the liturgical teaser renders in `init()`, check if this is a return visit:

```javascript
// Return-visit context (only on Find tab, only if returning after 1+ day)
if (state._isReturning && state._lastVisit) {
  var daysMissed = Math.floor((Date.now() - new Date(state._lastVisit + 'T00:00:00').getTime()) / 86400000);
  if (daysMissed >= 2 && daysMissed <= 14) {
    _renderReturnCard(daysMissed);
  }
}
```

Add function:

```javascript
function _renderReturnCard(daysMissed) {
  var el = document.getElementById('returnCard');
  if (!el) return;

  // Get notable feasts missed from litcal cache
  var missed = [];
  if (window._litcalCache && window._litcalCache.events) {
    var lastDate = new Date(state._lastVisit + 'T00:00:00');
    var today = new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00');
    window._litcalCache.events.forEach(function(e) {
      var evtDate = new Date(e.year + '-' + String(e.month).padStart(2, '0') + '-' + String(e.day).padStart(2, '0') + 'T00:00:00');
      if (evtDate > lastDate && evtDate < today && e.grade >= 3 && !e.is_vigil_mass) {
        missed.push(e.name);
      }
    });
  }

  var missedText = missed.length
    ? missed.slice(0, 3).join(', ') + (missed.length > 3 ? ' +' + (missed.length - 3) + ' more' : '')
    : '';

  el.innerHTML = '<div class="return-card">'
    + '<div class="return-text">Welcome back' + (missedText ? ' \u2014 ' + utils.esc(missedText) + ' since your last visit' : '') + '</div>'
    + '<button class="return-dismiss" onclick="this.parentElement.parentElement.style.display=\'none\'" aria-label="Dismiss">\u2715</button>'
    + '</div>';
  el.style.display = '';
}
```

### HTML (`index.html`)

Add in the Find tab main element, after the welcome banner and before the search section:

```html
<div id="returnCard" class="return-card-wrap" style="display:none"></div>
```

### CSS (`css/app.css`)

```css
/* RETURN VISIT CARD */
.return-card-wrap { max-width: var(--max-width); margin: 0 auto; padding: var(--space-2) var(--space-4) 0; }
.return-card { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-accent-pale); border-radius: var(--radius-md); }
.return-text { flex: 1; font-size: var(--text-sm); color: var(--color-accent-text); line-height: 1.4; }
.return-dismiss { flex-shrink: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: var(--text-xs); color: var(--color-accent-text); opacity: 0.6; }
.return-dismiss:hover { opacity: 1; background: rgba(0,0,0,0.05); }
```

---

## CHANGE 19: Prayer Activity Summary

**Why this matters for retention:** This is the **investment** piece of the habit loop. The app quietly remembers that the user prayed the rosary 4 times this month and completed 2 examinations. This isn't gamification — there are no badges, no leaderboards, no streaks-that-break. It's a private reflection of the user's prayer life that makes the app feel like a companion, not a tool. The more they use it, the more meaningful the summary becomes — that's investment.

### JavaScript — tracking in `src/rosary.js` and `src/examination.js`

When the rosary completes (all 5 decades), log it:

```javascript
// At the end of rosary completion
var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
log.push({ type: 'rosary', date: new Date().toISOString().slice(0, 10), set: currentMysterySet });
// Keep only last 90 days
var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
log = log.filter(function(e) { return e.date >= cutoff; });
localStorage.setItem('mf-prayer-log', JSON.stringify(log));
```

When examination completes (user taps "Review" and sees summary), log it:

```javascript
var log = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
log.push({ type: 'examination', date: new Date().toISOString().slice(0, 10) });
var cutoff = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);
log = log.filter(function(e) { return e.date >= cutoff; });
localStorage.setItem('mf-prayer-log', JSON.stringify(log));
```

### Rendering — in `src/more.js`, within the prayer tools section

After the prayer tool grid renders, add a summary if there's activity:

```javascript
// Prayer activity summary
var prayerLog = JSON.parse(localStorage.getItem('mf-prayer-log') || '[]');
var thisMonth = new Date().toISOString().slice(0, 7); // "2026-03"
var monthEntries = prayerLog.filter(function(e) { return e.date.startsWith(thisMonth); });
if (monthEntries.length > 0) {
  var rosaryCount = monthEntries.filter(function(e) { return e.type === 'rosary'; }).length;
  var examCount = monthEntries.filter(function(e) { return e.type === 'examination'; }).length;
  var parts = [];
  if (rosaryCount) parts.push('Rosary \u00d7' + rosaryCount);
  if (examCount) parts.push('Examination \u00d7' + examCount);
  var summaryEl = document.createElement('div');
  summaryEl.className = 'prayer-activity';
  summaryEl.innerHTML = '<span class="prayer-activity-label">This month:</span> ' + parts.join(' · ');
  ptGrid.parentNode.insertBefore(summaryEl, ptGrid.nextSibling);
}
```

### CSS (`css/app.css`)

```css
/* PRAYER ACTIVITY */
.prayer-activity { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-2); padding: var(--space-2) 0; }
.prayer-activity-label { font-weight: var(--weight-semibold); }
```

---

## CHANGE 20: Contextual "Find Confession" Prompts

**Why this matters for retention:** Confession is the single highest-value feature MassFinder offers — no other app makes it easy to find confession times. But currently the confession filter is hidden behind "More" on mobile, and the "Find Confession Near Me" button only exists inside the examination module. Surfacing it contextually drives both feature discovery and real-world utility.

### When to show (computed in `app.js` after init):

```javascript
// Contextual confession prompt — shows on Saturday or during Lent if user hasn't used it today
var showConfessionPrompt = false;
var confPromptDismissed = localStorage.getItem('mf-conf-prompt-' + new Date().toISOString().slice(0, 10));
if (!confPromptDismissed) {
  var day = new Date().getDay();
  var season = document.documentElement.getAttribute('data-season');
  // Saturday, or any day during Lent, or 30+ days since last confession
  var confStatus = examination.getConfessionStatus();
  if (day === 6 || season === 'lent' || (confStatus && confStatus.daysAgo >= 30)) {
    showConfessionPrompt = true;
  }
}

if (showConfessionPrompt) {
  _renderConfessionPrompt();
}
```

### Rendering:

```javascript
function _renderConfessionPrompt() {
  var el = document.getElementById('confessionPrompt');
  if (!el) return;
  var confStatus = examination.getConfessionStatus();
  var message = confStatus && confStatus.daysAgo >= 30
    ? 'It\u2019s been ' + confStatus.daysAgo + ' days \u2014 confession times near you'
    : 'Find confession times near you this weekend';

  el.innerHTML = '<div class="conf-prompt">'
    + '<div class="conf-prompt-text">' + message + '</div>'
    + '<button class="conf-prompt-btn" onclick="applyQuickFilter(\'confession\');this.closest(\'.conf-prompt-wrap\').style.display=\'none\';localStorage.setItem(\'mf-conf-prompt-\'+new Date().toISOString().slice(0,10),\'1\')">Find times</button>'
    + '<button class="conf-prompt-x" onclick="this.closest(\'.conf-prompt-wrap\').style.display=\'none\';localStorage.setItem(\'mf-conf-prompt-\'+new Date().toISOString().slice(0,10),\'1\')" aria-label="Dismiss">\u2715</button>'
    + '</div>';
  el.style.display = '';
}
```

### HTML (`index.html`)

Add in the Find tab, after the liturgical teaser and before the active filters:

```html
<div id="confessionPrompt" class="conf-prompt-wrap" style="display:none"></div>
```

### CSS (`css/app.css`)

```css
/* CONFESSION PROMPT */
.conf-prompt-wrap { max-width: var(--max-width); margin: 0 auto; padding: 0 var(--space-4); }
.conf-prompt { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); background: var(--color-verified-bg); border-radius: var(--radius-md); border-left: 3px solid var(--color-verified); }
.conf-prompt-text { flex: 1; font-size: var(--text-sm); color: var(--color-verified); font-weight: var(--weight-medium); }
.conf-prompt-btn { flex-shrink: 0; padding: var(--space-2) var(--space-4); background: var(--color-verified); color: white; font-size: var(--text-xs); font-weight: var(--weight-semibold); border-radius: var(--radius-full); min-height: 36px; white-space: nowrap; }
.conf-prompt-x { flex-shrink: 0; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: var(--text-xs); color: var(--color-verified); opacity: 0.5; }
.conf-prompt-x:hover { opacity: 1; }
```

---

## CHANGE 21: Enhanced "Your Churches" With Weekly Context

**Why this matters for retention:** The original Change 5 shows saved churches with their next service time. This enhancement adds a weekly event count badge and highlights upcoming events. It transforms the horizontal row from "here are your churches" to "here's what's happening at your churches this week" — a personal weekly digest in one glance.

### Amend the `renderYourChurches()` function from Change 5:

In each compact card, add event count if available:

```javascript
// Count this week's events at this church
var todayStr = new Date().toISOString().slice(0, 10);
var weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
var weekEvents = (state.eventsData || []).filter(function(e) {
  return e.church_id === c.id && e.date >= todayStr && e.date <= weekEnd;
}).length;

return '<div class="yc-compact" onclick="openDetail(\'' + c.id + '\')">'
  + '<div class="yc-compact-name">' + utils.esc(utils.displayName(c.name)) + '</div>'
  + (next
    ? '<div class="yc-compact-time">' + next.timeFormatted + '</div>'
      + '<div class="yc-compact-label">' + utils.esc(config.SVC_LABELS[next.service.type] || '') + '</div>'
    : '<div class="yc-compact-label" style="color:var(--color-text-tertiary)">See schedule</div>')
  + (weekEvents ? '<div class="yc-compact-events">' + weekEvents + ' event' + (weekEvents > 1 ? 's' : '') + ' this week</div>' : '')
  + '</div>';
```

### CSS addition:

```css
.yc-compact-events { font-size: 11px; color: var(--color-accent-text); font-weight: var(--weight-semibold); margin-top: var(--space-1); }
```

---

## CHANGE 22: Time-Aware Content Surfacing

**Why this matters for retention:** The app should feel like it knows what time it is and what matters right now. Saturday afternoon? Weekend Mass times matter most. Friday in Lent? Abstinence reminder. Morning? Next Mass. Evening? Tomorrow's readings. This makes the app feel situationally intelligent — like it was designed for THIS moment.

### JavaScript (`src/app.js`)

Enhance the `smartDefault()` logic and the liturgical teaser to be time-aware:

```javascript
// Time-aware enhancements in init(), after filterChurches/renderCards:
var hour = new Date().getHours();
var dow = new Date().getDay();

// Saturday afternoon: auto-select "weekend" filter if user hasn't manually chosen
// (smartDefault already handles this — verify it's working)

// Friday in Lent: show abstinence reminder in the liturgical teaser
var season = document.documentElement.getAttribute('data-season');
if (dow === 5 && season === 'lent') {
  var teaser = document.getElementById('liturgicalTeaser');
  if (teaser) {
    var note = document.createElement('div');
    note.className = 'teaser-note';
    note.textContent = 'Abstinence from meat today (Lenten Friday)';
    teaser.appendChild(note);
  }
}

// Holy Day tomorrow: enhance the teaser
if (window._litcalCache && window._litcalCache.events) {
  var tomorrow = new Date(Date.now() + 86400000);
  var tomorrowEvents = window._litcalCache.events.filter(function(e) {
    return e.month === (tomorrow.getMonth() + 1) && e.day === tomorrow.getDate() && e.holy_day_of_obligation;
  });
  if (tomorrowEvents.length) {
    var teaser = document.getElementById('liturgicalTeaser');
    if (teaser) {
      var hdoNote = document.createElement('div');
      hdoNote.className = 'teaser-note teaser-note--hdo';
      hdoNote.textContent = 'Tomorrow: Holy Day of Obligation \u2014 ' + tomorrowEvents[0].name;
      teaser.appendChild(hdoNote);
    }
  }
}
```

### CSS (`css/app.css`)

```css
.teaser-note { max-width: var(--max-width); margin: var(--space-1) auto 0; padding: 0 var(--space-4); font-size: var(--text-xs); color: var(--color-text-tertiary); font-style: italic; }
.teaser-note--hdo { color: var(--color-warning); font-style: normal; font-weight: var(--weight-medium); }
```

---

## UPDATED IMPLEMENTATION ORDER

Execute all 22 changes in this sequence:

**Phase A — Structure (HTML reordering, no logic changes):**
1. Change 2 + 15: More tab reorder, unhide saint card, remove emoji (20 min)
2. Change 3: Show all chips on mobile (10 min)
3. Change 10: Shaped skeletons (10 min)
4. Add placeholder `<div>` elements for Changes 4, 16, 18, 20 (5 min)

**Phase B — Core retention mechanics (the daily loop):**
5. Change 1: Liturgical teaser on Find tab (30 min)
6. Change 17: Season progress tracker (20 min)
7. Change 16: Daily CCC reflection card (30 min)
8. Change 12: More tab badge for unread daily content (15 min)
9. Change 22: Time-aware content surfacing (20 min)

**Phase C — Personalization layer:**
10. Change 5 + 21: Your Churches row with weekly event counts (45 min)
11. Change 6: Card chevron affordance (10 min)
12. Change 8: Prayer tool card redesign with confession subtitle (30 min)
13. Change 19: Prayer activity summary (20 min)

**Phase D — Onboarding + contextual nudges:**
14. Change 4: First-visit welcome banner (20 min)
15. Change 7: Saved tab active empty state (15 min)
16. Change 9: Dark mode auto-detection (10 min)
17. Change 18: Return-visit context card (25 min)
18. Change 20: Contextual confession prompt (20 min)
19. Change 13: Seasonal urgency messaging (10 min)

**Phase E — Polish:**
20. Change 14: Text size preference (20 min)
21. Change 11: Last-visit tracking (5 min)

**After all changes:**
- `npm run build`
- Test in Chrome incognito (no SW cache)
- Test on iPhone Safari (haptics, wake lock, dark mode)
- Test first-visit flow (clear localStorage)
- Test return-visit flow (set mf-last-visit to 3 days ago in localStorage, reload)
- Verify More tab order: Saint → Reflection → Readings → Prayer Tools → Events → Observances → Guides → About
- Verify Find tab order: Welcome banner (first visit) → Search → Liturgical teaser + progress + notes → Chips → Your Churches → Cards
- Verify seasonal progress shows during Lent
- Verify confession prompt shows on Saturday
- Verify More tab badge clears on tab visit
- Verify prayer activity logs after completing rosary
