# MassFinder — Open Work Register v2
## All remaining features, fixes, and improvements

**As of:** 2026-03-11 | **Commit:** `57546fb`
**Catalog status:** 53 of 67 items complete
**Open items:** 14 existing (OW-01→OW-14) + 15 new (OW-15→OW-29)

---

## CATALOG ITEMS DONE BUT NOT MARKED (update the catalog)

These items are implemented in code but the Master Feature Catalog still shows them as open. Mark them ~~strikethrough~~ ✓ DONE:

- **DAT-07:** Bible Cross-Reference Database — `data/bible-xrefs.json` exists (4MB), loaded by `src/bible.js`
- **BLD-04:** `scripts/build-bible-drb.js` — exists and works
- **BLD-05:** `scripts/build-lectionary.js` — exists and works
- **BLD-06:** `scripts/build-litcal.js` — exists (fetches from LitCal API, not romcal)
- **XREF-02:** Tappable Scripture References — `src/devotions.js` uses `refs.renderRef('bible', ref)`, rosary scripture links use `_refTap('bible', ...)`, both connect to `src/bible.js` → `openBible()`
- **LIB-05:** Already marked REVERTED — confirm text is accurate

---

## EXISTING WORK (OW-01 → OW-14)

Carried forward unchanged from original register. See prior OPEN_WORK.md for full details.

| ID | Summary | Priority | Effort |
|----|---------|----------|--------|
| OW-01 | Update CLAUDE.md | P1 | 5 min |
| OW-02 | romcal offline liturgical calendar | P1 | 3 hrs |
| OW-03 | Web Speech API read-aloud | P1 | 30 min |
| OW-04 | build-examination.js build script | P1 | 1 hr |
| OW-05 | Summa Theologica daily wisdom card | P2 | 3 hrs |
| OW-06 | "Pray for Me" intentions counter | P2 | 2 hrs |
| OW-07 | Latin/English Bible toggle | P3 | 4 hrs |
| OW-08 | Gregorian Chant Database | P3 | 2 hrs |
| OW-09 | Catholic Hierarchy Data | P3 | 2 hrs |
| OW-10 | Ambient Prayer Tones | P3 | 1 hr |
| OW-11 | Bluetooth Rosary Counter | P3 | 4 hrs |
| OW-12 | Doctors of the Church Gallery | P3 | 2 hrs |
| OW-13 | Update ANTI_PATTERNS.md | Docs | 10 min |
| OW-14 | Update STYLE_GUIDE.md | Docs | 15 min |

---

## NEW WORK (OW-15 → OW-29)

---

### OW-15: Saved Tab — Activity Metrics Redesign

**Priority:** P1
**Effort:** 2 hours
**Files:** `src/saved.js` (lines 322–387), `css/app.css` (lines 1069–1076)

#### Problem
The activity section uses horizontal bar charts (`activity-bar-row`) where each prayer type's bar width is proportional to whichever type has the max count. This reads as a competitive comparison — "you're doing more Rosary than Examen" — which is the wrong signal for a faith app. It implies you should equalize or maximize all bars. The fire emoji streak (`🔥 7-day prayer streak`) leans gamification. Users report confusion about what the bars represent.

#### Root cause (code)
`saved.js` lines 332–336: `Math.round(rosaryCount / maxCount * 100) + '%'` — relative proportional width with no fixed meaning. A single rosary with nothing else shows as 100% full bar, which looks like "completion."

#### Proposed design: "Prayer Life" journal card
Replace bars with a text-driven, contemplative reflection card:

**Primary line (always shown):**
- `"You've prayed 14 times in the past 30 days"` — or `"You've prayed every day this week"` if streak ≥ 7

**Secondary line (breakdown, natural language):**
- `"7 Rosaries · 4 Examens · 2 Stations · 1 Novena"` — using the existing `·` separator pattern from elsewhere in the app

**Streak (reframed, no emoji):**
- < 3 days: omit
- 3–6 days: `"3 consecutive days of prayer"`
- 7+ days: `"You've prayed daily since last [Wednesday]"` — use actual day name
- 30+ days: `"A month of daily prayer"` — milestone language

**Optional enhancement — 7-day dot row:**
Seven small circles for the past 7 days. Filled (accent color) for days with prayer activity, hollow for missed days. Not progress toward a goal — just a gentle weekly reflection. Similar in spirit to the novena day dots.

**Confession nudge:** Keep as-is (well-designed, action-oriented).

#### What to remove
- All `activity-bar-*` CSS classes and HTML
- Fire emoji from streak display
- `activity-stats-header "Last 30 days"` label (fold into the primary sentence)

#### CSS (new)
```css
.activity-journal { font-size: var(--text-sm); color: var(--color-text-secondary); line-height: 1.5; }
.activity-journal-count { font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.activity-journal-breakdown { font-size: var(--text-xs); color: var(--color-text-tertiary); margin-top: var(--space-1); }
.activity-streak-text { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-secondary); margin-top: var(--space-2); }
.activity-week-dots { display: flex; gap: var(--space-2); margin-top: var(--space-3); }
.activity-week-dot { width: 8px; height: 8px; border-radius: 50%; border: 1.5px solid var(--color-border); }
.activity-week-dot.filled { background: var(--color-accent); border-color: var(--color-accent); }
```

#### Dark mode
All colors use CSS custom properties — no special dark mode rules needed.

#### Test checklist
- [ ] Zero prayer activity: section hidden entirely (existing behavior preserved)
- [ ] Single prayer type: natural sentence, no bar
- [ ] Multiple types: breakdown line shows all types with counts
- [ ] Streak < 3 days: no streak line
- [ ] Streak 7+ days: shows day name, not number
- [ ] 7-day dots: correct fill for each of past 7 days
- [ ] Confession nudge: unchanged, still functional
- [ ] Dark mode: all text readable, dot borders visible

---

### OW-16: Saved Tab — Soon/Live Service Visual Enhancement

**Priority:** P1
**Effort:** 2 hours
**Files:** `src/saved.js` (lines 62–83, 227–249), `css/app.css` (lines 1017–1031)

#### Problem
Live and soon services in the "Today" schedule don't visually pop. The "Now" badge is 10px text with a tiny 6px pulse dot. The "Soon" badge is unstyled text. When someone opens the Saved tab, their eye should immediately find what's happening now or next. Currently it requires scanning each row.

#### Root cause (code)
- `sched-live-badge`: 10px font, subtle background `rgba(44,62,90,0.08)`
- `sched-soon-badge`: no background at all, just colored text
- No hero/priority treatment for the most urgent service

#### Proposed design

**Phase A — Hero card for most urgent service:**
Above the timeline, when there's a live or soon service, render a prominent hero card:
- Live: `"Mass at St. Mary's · Happening now"` with accent background wash and pulse dot
- Soon: `"Confession at Holy Cross · Starts in 23 min"` with lighter accent wash
- Tap → `openDetail()` for that church
- Include a "Directions" shortcut button (links to maps)

**Phase B — Enhanced timeline badges:**
- Live row: stronger left border (3px accent), background wash, pulse dot 10px, "Now" badge with pill background
- Soon row: left border (2px, lighter accent), "Soon" badge with subtle pill background, countdown text: `"in 23 min"`
- Past rows: keep current strike-through + opacity treatment

#### Implementation notes
`_renderSchedRow` (saved.js line 62): add `data-minutes-until` attribute to enable CSS-driven countdown. Add `setTimeout` refresh every 60 seconds to update countdown and transition soon → live → past.

#### CSS (hero card)
```css
.sched-hero { background: var(--color-primary-bg); border: 1px solid var(--color-primary-border); border-radius: var(--radius-md); padding: var(--space-3) var(--space-4); margin-bottom: var(--space-3); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.sched-hero--live { background: var(--color-accent-bg); border-color: var(--color-accent); }
.sched-hero-time { font-size: var(--text-lg); font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.sched-hero-info { font-size: var(--text-sm); color: var(--color-text-secondary); margin-top: var(--space-1); }
.sched-hero-badge { display: inline-flex; align-items: center; gap: 4px; font-size: var(--text-xs); font-weight: var(--weight-semibold); padding: 2px 8px; border-radius: var(--radius-sm); }
.sched-hero-badge--live { background: var(--color-primary); color: #fff; }
.sched-hero-badge--soon { background: var(--color-accent-bg); color: var(--color-accent-text); }
.sched-hero .pulse-dot { width: 8px; height: 8px; }
```

#### CSS (enhanced timeline badges)
```css
.sched-live { background: var(--color-primary-bg); border-left: 3px solid var(--color-primary); border-radius: var(--radius-sm); padding: var(--space-2) var(--space-3); margin: var(--space-1) 0; border-bottom: none; }
.sched-live-badge { font-size: 11px; font-weight: var(--weight-semibold); color: #fff; background: var(--color-primary); padding: 2px 8px; border-radius: var(--radius-sm); display: inline-flex; align-items: center; gap: 4px; }
.sched-soon { border-left: 2px solid var(--color-accent); padding-left: var(--space-3); }
.sched-soon-badge { font-size: 11px; font-weight: var(--weight-medium); color: var(--color-accent-text); background: var(--color-accent-bg); padding: 2px 8px; border-radius: var(--radius-sm); }
.sched-countdown { font-size: var(--text-xs); color: var(--color-text-tertiary); }
```

#### Test checklist
- [ ] Live service: hero card renders with pulse, "Happening now"
- [ ] Soon service (< 60 min): hero card with countdown
- [ ] No live/soon: hero card hidden, timeline starts normally
- [ ] Multiple live: hero shows the one starting soonest
- [ ] Past services: still crossed out + dimmed
- [ ] Auto-refresh: countdown updates, transitions occur
- [ ] Dark mode: all washes/badges readable
- [ ] Directions link opens correct maps URL

---

### OW-17: Saved Tab — Time-Range Service Display Fix

**Priority:** P1 (bug fix)
**Effort:** 1 hour
**Files:** `src/saved.js` (line 45), `src/utils.js` (line 144, line 157)

#### Problem
A church offering Adoration from 9:00 AM to 5:00 PM on Wednesday shows as crossed out (past) at 9:30 AM on Wednesday. The service is still happening but displays as concluded.

#### Root cause (code)
Two locations where `end_time` is ignored:

1. **`saved.js` line 45:**
   ```javascript
   var isPast = sm < curMin - 30; // Past if ended 30+ min ago
   ```
   Only checks `s.time` (start time). Never reads `s.end_time`.

2. **`utils.js` line 144:**
   ```javascript
   if (du === 0 && sm <= curMin - 30) du = 7;
   ```
   Same issue — treats the service as "next week" if start time is 30+ minutes ago.

3. **`utils.js` line 157:**
   ```javascript
   isLive: best.totalMin <= 0 && best.totalMin >= -30,
   ```
   Live window is only 30 minutes after start time.

#### Fix

**`saved.js` — `getTodayServices()` (line 44–48):**
```javascript
var em = s.end_time ? toMin(s.end_time) : null;
var effectiveEnd = em !== null ? em : sm + 60; // Default 1hr if no end_time
var isPast = curMin > effectiveEnd;
var isLive = !isPast && sm <= curMin;
var isSoon = !isPast && !isLive && sm > curMin && sm <= curMin + 60;
```

**`utils.js` — `getNext()` (line 144):**
```javascript
var em = s.end_time ? toMin(s.end_time) : null;
var effectiveEnd = em !== null ? em : sm + 60;
if (du === 0 && curMin > effectiveEnd) du = 7;
```

**`utils.js` — `getNext()` return (line 157):**
```javascript
var em2 = best.service.end_time ? toMin(best.service.end_time) : null;
var effectiveEnd2 = em2 !== null ? em2 : toMin(best.service.time) + 60;
isLive: best.daysUntil === 0 && toMin(best.service.time) <= curMin && curMin <= effectiveEnd2,
```

#### Display enhancement for time-range services
When `end_time` is present, show the range in the schedule row:
- Current: `"9:00 AM"` (crossed out)
- Proposed: `"9:00 AM – 5:00 PM"` with live badge if currently in range

In `_renderSchedRow` (saved.js line 63):
```javascript
var timeStr = item.service.end_time
  ? fmt12(item.service.time) + ' – ' + fmt12(item.service.end_time)
  : fmt12(item.service.time);
```

#### Test checklist
- [ ] Adoration 9 AM–5 PM: shows as "Live" at 10 AM, not crossed out
- [ ] Mass 8:00 AM (no end_time): shows as past by 9:00 AM (60-min default)
- [ ] Perpetual adoration: handled by type, not affected
- [ ] Confession 3:30–4:30 PM: shows range, live during window
- [ ] Time display: "9:00 AM – 5:00 PM" renders correctly
- [ ] getNext: returns correct isLive/isSoon for ranged services
- [ ] Dark mode: time range text readable

---

### OW-18: Novena — Multi-Novena Tracking & UX Overhaul

**Priority:** P1
**Effort:** 3 hours
**Files:** `src/novena.js`, `src/more.js` (lines 21–27, line 143), `css/app.css`

#### Problem (4 issues, one root cause)

1. **localStorage is single-novena:** `mf-novena-active` stores one object. Starting a second novena overwrites the first.
2. **More tab card shows one novena:** `_getNovenaSubtitle()` (more.js:21) reads single tracking object.
3. **Click defaults to active novena:** `openNovena()` (novena.js:77) auto-resumes the single tracked novena instead of showing the index.
4. **Select screen shows one "Continue" card:** `_renderSelect` (novena.js:122) only renders one active card.

#### Phase A: Multi-novena storage

**New localStorage key:** `mf-novena-tracking` (object keyed by novena ID)
```javascript
{
  "sacred-heart": { "startDate": "2026-03-05", "completedDays": [1, 2, 3, 4, 5] },
  "divine-mercy": { "startDate": "2026-03-09", "completedDays": [1, 2] }
}
```

**Migration:** On first load, if `mf-novena-active` exists, migrate it into the new structure under its ID, then remove the old key.

**Updated functions:**
```javascript
function _getTracking(id) {
  try {
    var all = JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
    return id ? all[id] || null : all;
  } catch (e) { return id ? null : {}; }
}

function _setTracking(id, obj) {
  var all = _getTracking();
  all[id] = obj;
  localStorage.setItem('mf-novena-tracking', JSON.stringify(all));
}

function _clearTracking(id) {
  var all = _getTracking();
  delete all[id];
  localStorage.setItem('mf-novena-tracking', JSON.stringify(all));
}

function _getAllActive() {
  var all = _getTracking();
  return Object.keys(all).map(function(id) { return { id: id, tracking: all[id] }; });
}
```

#### Phase B: Always open to index

**`openNovena()` change:**
Always set `_screen = 'select'` on open. Remove the auto-resume logic (novena.js lines 77–87). Users reach their active novena(s) via the master card on the select screen.

#### Phase C: Master progress card on select screen

Replace the single "Continue" card with an "Active Novenas" card that shows all in-progress novenas:

```html
<div class="novena-master-card">
  <div class="novena-master-label">Your Active Novenas</div>
  <!-- One row per active novena -->
  <div class="novena-master-row" onclick="novenaSelect('sacred-heart')">
    <div class="novena-master-info">
      <div class="novena-master-title">Sacred Heart</div>
      <div class="novena-master-progress">Day 6 of 9 · 5 completed</div>
    </div>
    <div class="novena-master-dots"><!-- 9 small dots --></div>
    <span class="novena-master-chevron">›</span>
  </div>
  <div class="novena-master-row" onclick="novenaSelect('divine-mercy')">
    <div class="novena-master-info">
      <div class="novena-master-title">Divine Mercy</div>
      <div class="novena-master-progress">Day 3 of 9 · 2 completed</div>
    </div>
    <div class="novena-master-dots"><!-- 9 small dots --></div>
    <span class="novena-master-chevron">›</span>
  </div>
</div>
```

Each row has inline 9-dot progress (tiny, 6px dots — filled for completed days). Tap → enters that novena's prayer screen.

#### Phase D: More tab subtitle

**`_getNovenaSubtitle()` rewrite (more.js:21):**
```javascript
function _getNovenaSubtitle() {
  try {
    var all = JSON.parse(localStorage.getItem('mf-novena-tracking') || '{}');
    var active = Object.keys(all);
    if (active.length === 1) {
      var t = all[active[0]];
      var dayNum = _computeCurrentDay(t) + 1; // needs import or inline
      return 'Day ' + dayNum + ' of 9';
    }
    if (active.length > 1) return active.length + ' novenas in progress';
  } catch (e) {}
  return '9-day guided prayer';
}
```

#### CSS (master card)
```css
.novena-master-card { background: var(--color-card-bg); border-radius: var(--radius-md); padding: var(--space-3); margin-bottom: var(--space-4); }
.novena-master-label { font-size: var(--text-xs); font-weight: var(--weight-semibold); text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-tertiary); margin-bottom: var(--space-3); }
.novena-master-row { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-2) 0; border-bottom: 1px solid var(--color-border-light); cursor: pointer; -webkit-tap-highlight-color: transparent; }
.novena-master-row:last-child { border-bottom: none; }
.novena-master-row:active { opacity: 0.85; }
.novena-master-info { flex: 1; min-width: 0; }
.novena-master-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-text-primary); }
.novena-master-progress { font-size: var(--text-xs); color: var(--color-text-tertiary); }
.novena-master-dots { display: flex; gap: 3px; }
.novena-master-dot { width: 6px; height: 6px; border-radius: 50%; border: 1px solid var(--color-border); }
.novena-master-dot.done { background: var(--color-accent); border-color: var(--color-accent); }
.novena-master-chevron { color: var(--color-text-tertiary); font-size: 18px; }
```

#### Test checklist
- [ ] Start novena A: tracked in new structure
- [ ] Start novena B: A still tracked, B added
- [ ] Select screen: master card shows both with correct day/progress
- [ ] Tap row: enters correct novena prayer screen
- [ ] Complete novena A: removed from tracking, B unaffected
- [ ] More tab: shows "2 novenas in progress" subtitle
- [ ] More tab: shows "Day X of 9" when only one active
- [ ] More tab: shows "9-day guided prayer" when none active
- [ ] Open novena from More tab: always shows select/index screen
- [ ] Migration: old `mf-novena-active` data preserved
- [ ] Prayer log: completed novenas still logged
- [ ] Dark mode: master card, dots, text all correct

---

### OW-19: CCC — Baltimore Catechism Toggle in Reference Sheet ✅

**Priority:** P2 — **DONE**
**Effort:** 2 hours
**Files:** `src/ccc.js`, `src/ccc-data.js`, `css/app.css`

#### Problem
The CCC sheet shows the full Catechism paragraph, but the Baltimore Catechism's Q&A format is more accessible to laypeople. The Baltimore data already has `ccc` field mappings (220 Q&As → CCC §§). These two resources are siloed — you can read CCC paragraphs in the sheet or see one Baltimore Q&A per day on the More tab, but never together.

#### Proposed design
Add a toggle button in the CCC sheet header bar (next to the back/search buttons) that switches between CCC view and Baltimore view:

**CCC view (default, existing):** Full paragraph text, section context, "See Also" cross-references.

**Baltimore companion card (new, shown below CCC text when a mapping exists):**
When the current CCC paragraph has a Baltimore Q&A mapped to it (via `qa.ccc === currentNum`), show a card below the paragraph:
```html
<div class="ccc-baltimore-card">
  <div class="ccc-baltimore-label">Baltimore Catechism #42</div>
  <div class="ccc-baltimore-q">Q. What is Confirmation?</div>
  <div class="ccc-baltimore-a">A. Confirmation is a Sacrament through which we receive the Holy Ghost...</div>
</div>
```

**Baltimore view (toggled):** When toggled, the sheet shows the Baltimore Q&A as the primary content, with the linked CCC § shown below as context.

#### Data loading
Baltimore Catechism data (`data/baltimore-catechism.json`, 220 questions) is already loaded by `app.js` for the daily reflection. Build a reverse lookup map at load time: `{ [cccNum]: baltimoreQA }` to enable CCC → Baltimore lookups.

#### Implementation
- `ccc-data.js`: add `loadBaltimore()` function that fetches and caches the Baltimore data + builds reverse map
- `ccc.js` `_renderCCCContent()`: after rendering CCC paragraph, check reverse map and append Baltimore card if match exists
- Add toggle button to sheet header with `data-view="ccc"` / `data-view="baltimore"` state

#### Test checklist
- [ ] CCC § with Baltimore mapping: companion card appears
- [ ] CCC § without mapping: no card, no error
- [ ] Toggle to Baltimore view: Q&A is primary, CCC § is secondary
- [ ] Toggle back: returns to CCC view
- [ ] Search works in both views
- [ ] Navigation (See Also) works from both views
- [ ] Dark mode: card styling correct

---

### OW-20: Baltimore Catechism — Language Modernization ✅

**Priority:** P2 — **DONE**
**Effort:** 2 hours (mostly editorial review)
**Files:** `data/baltimore-catechism.json`, `scripts/build-baltimore.js`

#### Problem
The Baltimore Catechism uses archaic language ("hitherto," "wherefore," "thou," "doth," etc.) that feels inaccessible to modern readers. The Q&A format is excellent for laypeople, but the vocabulary creates a barrier.

#### Approach
**Build-time transformation, not runtime.** Create an updated version of the Baltimore data with modernized vocabulary while preserving doctrinal precision.

**Modernization rules (conservative):**
- `wherefore` → `why` or `for this reason` (context-dependent)
- `hitherto` → `until now` or `so far`
- `thou/thee/thy/thine` → `you/your` (outside of direct Scripture quotes and prayer texts)
- `doth/dost/hath/hast` → `does/do/has/have`
- `whence` → `from where`
- `unto` → `to`
- `thereof` → `of it` or `of this`
- Preserve all doctrinal terms exactly (e.g., "transubstantiation," "concupiscence," "sanctifying grace")
- Preserve direct Scripture quotations verbatim (these are from an established translation)
- Preserve prayer texts verbatim (Our Father, Hail Mary, Act of Contrition, etc.)

**Implementation:**
1. Create `scripts/modernize-baltimore.js` — takes `data/baltimore-catechism.json` as input
2. Apply word-for-word substitutions with context guards (don't modify text inside quotation marks or known prayer text)
3. Output `data/baltimore-catechism-modern.json` with same structure + `"modernized": true` flag
4. Manual review pass — the script's output must be reviewed by hand for any nonsensical substitutions before replacing the original
5. Original data preserved as `data/baltimore-catechism-original.json`

#### Risks
- Some substitutions may change meaning in theological context
- "Thou" in prayers (Lord's Prayer, Hail Mary) must be preserved
- Compound archaic constructions may not map cleanly

#### Test checklist
- [ ] All 220 Q&As processed
- [ ] No doctrinal terms altered
- [ ] No Scripture quotes altered
- [ ] No prayer texts altered
- [ ] Manual review: no nonsensical substitutions
- [ ] `ccc` field mappings preserved
- [ ] Daily reflection renders correctly with modernized text
- [ ] Original data preserved for reference

---

### OW-21: CCC — Deep Exploration Module ("Explore") ✅

**Priority:** P2 — **DONE**
**Effort:** 6–8 hours (largest single item)
**Files:** New `src/explore.js`, updates to `src/ccc.js`, `src/bible.js`, `css/app.css`, `index.html`

#### Problem
MassFinder has an exceptionally rich dataset that's almost entirely siloed:
- CCC: 2,865 §§ with 1,941 cross-reference entries (fwd + rev)
- Baltimore Catechism: 220 Q&As, each mapped to a CCC §
- Bible cross-references: 29,364 verse-to-verse mappings
- DRB + CPDV full text (148 books)
- Lectionary index: readings mapped to liturgical days
- Section context: 20 CCC topic areas

Each resource opens in its own sheet. There's no way to follow the thread from a CCC paragraph to the Scripture it cites to the related cross-references to the Baltimore explanation and back. The opportunity is to connect all of this into a single discovery experience.

#### Proposed design: Explore module (full-screen overlay)

**Entry points:**
- "Explore" button in CCC sheet (next to the paragraph being viewed)
- "Explore" button in Bible sheet
- "Explore" card on More tab (below prayer tools)
- Deep link: `openExplore('ccc', '355')` or `openExplore('bible', 'John 3:16')`

**Screen layout:**
```
┌──────────────────────────────┐
│ ← Back         Explore       │ ← header with trail breadcrumb
├──────────────────────────────┤
│ [Section context badge]      │
│                              │
│ PRIMARY CONTENT              │ ← CCC paragraph or Bible passage
│ (Georgia serif, prayer font) │    (whatever the user pivoted to)
│                              │
├──────────────────────────────┤
│ CONNECTIONS                  │ ← generated from all data sources
│                              │
│ ┌─ Baltimore Catechism ────┐ │
│ │ Q. Who made us?          │ │ ← if CCC § maps to a Baltimore Q&A
│ │ A. God made us.          │ │
│ └──────────────────────────┘ │
│                              │
│ ┌─ Scripture Citations ────┐ │
│ │ Gen 1:27 · Gen 2:7       │ │ ← parsed from CCC paragraph text
│ │ Ps 8:5 · Wis 2:23       │ │    (already parsed by _wrapCCCScriptureRefs)
│ └──────────────────────────┘ │
│                              │
│ ┌─ Related Teachings ──────┐ │
│ │ §343 · §1700 (2 shown)   │ │ ← CCC xrefs (fwd + rev)
│ │ ▸ Show 5 more            │ │    progressive disclosure
│ └──────────────────────────┘ │
│                              │
│ ┌─ Cross-References ───────┐ │
│ │ Prov 8:22 · Eph 3:9      │ │ ← bible-xrefs for cited verses
│ │ ▸ Show 12 more           │ │    progressive disclosure
│ └──────────────────────────┘ │
│                              │
│ ┌─ In the Lectionary ──────┐ │
│ │ 6th Sunday of Easter (A) │ │ ← lectionary-index matches
│ └──────────────────────────┘ │
└──────────────────────────────┘
```

**Every card is tappable.** Tapping a Scripture ref pivots to that passage as the primary content, with its own connections generated. Tapping a CCC § pivots to that paragraph. The breadcrumb trail builds as the user goes deeper: `§355 → Gen 1:27 → Prov 8:22 → §291`. Back button pops one level.

**Connection generation algorithm:**
```
function generateConnections(type, id) {
  connections = []
  if type === 'ccc':
    1. Baltimore reverse lookup (cccNum → Q&A)
    2. Parse Scripture refs from paragraph text (regex from _wrapCCCScriptureRefs)
    3. CCC xrefs (fwd + rev from catechism.json xrefs)
    4. Lectionary matches (scan lectionary-index for readings matching cited verses)
  if type === 'bible':
    1. Bible cross-references (bible-xrefs.json)
    2. CCC paragraphs that cite this verse (reverse search CCC text — build index at load time)
    3. Lectionary matches
    4. Baltimore Q&As that reference this verse (if any)
  return connections (grouped by source, sorted by relevance)
}
```

**Progressive disclosure:**
- Each connection group shows 2–3 items by default
- "Show N more" expander reveals the rest
- This directly addresses the "Dorothy doesn't get overwhelmed" concern

**Topic tags (inferred from CCC sections):**
The `_CCC_SECTIONS` array in `ccc.js` maps paragraph ranges to topics. Surface these as filter chips at the top: "Sacraments," "Prayer," "Moral Life," "The Creed," etc. Users can tap a topic to browse all paragraphs in that section.

#### Architecture decisions
- New module: `src/explore.js` — full-screen overlay (like rosary/stations)
- Lazy-load all data on first Explore open (CCC + xrefs already cached, Bible xrefs + Baltimore + lectionary loaded on demand)
- Build reverse index (CCC text → cited Bible verses) at load time — scan all 2,865 paragraphs once with the existing regex
- Reuse existing rendering patterns from ccc.js and bible.js
- Navigation history as stack (same pattern as CCC sheet)

#### Effort breakdown
- Module scaffold + overlay + navigation: 2 hrs
- Connection generator: 2 hrs
- Reverse index building: 1 hr
- UI rendering + progressive disclosure: 2 hrs
- Topic browsing: 1 hr

#### Test checklist
- [ ] Enter from CCC sheet: paragraph loads as primary, connections generated
- [ ] Enter from Bible sheet: passage loads, connections generated
- [ ] Baltimore companion: shows when mapping exists, hidden when not
- [ ] Scripture citations: parsed from CCC text, tappable
- [ ] CCC xrefs: shown with previews, progressive disclosure
- [ ] Bible xrefs: shown, progressive disclosure (≤3 visible, rest behind expander)
- [ ] Lectionary matches: correct day/year cycle
- [ ] Pivot navigation: tap any card → new primary content → new connections
- [ ] Breadcrumb trail: accurate, back button works
- [ ] Topic chips: filter to correct section range
- [ ] Dark mode: all cards, text, badges correct
- [ ] Performance: initial load < 2s, pivots < 500ms
- [ ] Wake lock: not needed (reading, not prayer)
- [ ] Georgia serif for primary content, Source Sans for UI

---

### OW-22: Bible Sheet — Progressive Disclosure for References ✅

**Priority:** P2 — **DONE**
**Effort:** 1 hour
**Files:** `src/bible.js` (lines 285–316), `css/app.css`

#### Problem
The Bible sheet currently shows up to 12 cross-references (`passages.slice(0, 12)`) as a flat list. For verses with dense cross-references (like Gen 1:1 with 20 refs), this overwhelms casual users. The persona "Dorothy" (older parishioner, 50+) shouldn't see a wall of references.

#### Proposed design
Show 3 references by default. Below them, a "Show N more" expander.

#### Implementation
**`bible.js` line 304 — change from:**
```javascript
passages.slice(0, 12).forEach(function(p) {
```
**To:**
```javascript
var maxVisible = 3;
var visible = passages.slice(0, maxVisible);
var hidden = passages.slice(maxVisible);

visible.forEach(function(p) {
  // existing rendering
});

if (hidden.length) {
  relHtml += '<details class="bible-refs-overflow"><summary class="bible-refs-more">'
    + hidden.length + ' more references</summary>';
  hidden.forEach(function(p) {
    // same rendering as visible
  });
  relHtml += '</details>';
}
```

#### CSS
```css
.bible-refs-more { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-accent-text); cursor: pointer; padding: var(--space-2) 0; -webkit-tap-highlight-color: transparent; }
.bible-refs-overflow[open] .bible-refs-more { margin-bottom: var(--space-2); }
```

#### Test checklist
- [ ] Verse with ≤3 refs: all shown, no expander
- [ ] Verse with >3 refs: 3 shown, expander with correct count
- [ ] Expand: remaining refs appear
- [ ] Each ref still tappable (navigates to passage)
- [ ] Genre badges still render
- [ ] Dark mode: expander text readable

---

### OW-23: Church Detail — Services Layout Restructuring [DONE]

**Priority:** P2
**Effort:** 4 hours (UI) + 2 hours (data schema planning)
**Files:** `src/render.js` (lines 241–423, 530–665), `css/app.css`, `parish_data.json` (schema planning only)

#### Problem
The service accordion groups by type (Mass, Sacraments, Adoration, etc.) with days nested within. To answer "When can I go to Mass this weekend?" the user must open Mass Schedule, then mentally parse: Sunday header → multiple times at multiple locations → Saturday header (vigil masses mixed in) → decode which `location_id` is which building. Multi-site parishes (e.g., St. John Paul II with 3 church buildings) are especially confusing because the location is buried or absent from the display.

#### Proposed design: Two-phase improvement

**Phase 1 — "What's Next" chronological view (UI only, no data changes):**

Insert a "Coming Up" section at the top of the detail body, above the existing accordions. Shows the next 3 services (any type) in chronological order:
```html
<div class="detail-coming-up">
  <div class="detail-coming-label">Coming Up</div>
  <div class="detail-coming-row">
    <div class="detail-coming-time">4:00 PM</div>
    <div class="detail-coming-info">
      <span class="detail-coming-type">Sunday Mass (Vigil)</span>
      <span class="detail-coming-loc">at Notre Dame Church</span>
    </div>
    <span class="detail-coming-day">Today</span>
  </div>
  <!-- 2 more rows -->
</div>
```

This answers the immediate question without requiring accordion interaction. The existing accordions remain below for the full schedule.

**Phase 2 — Location display enhancement (requires data enrichment):**

Currently, services have a `location_id` field (e.g., `"notre-dame-church-adams"`) but no display-friendly name. The parish has a `locations` array (if present) but mapping is inconsistent.

**Data schema additions to plan for (backfill later):**
1. `location_name` on each service record: `"Notre Dame Church"` — human-readable display name
2. `is_primary_site` boolean on locations: enables "at [secondary site]" labeling only when needed
3. Populate `end_time` on all time-range services (adoration, confession, holy hours) — currently almost always `null`

**For now (Phase 1):** Derive display name from `location_id` by splitting on hyphens and title-casing. Not perfect but better than nothing:
```javascript
function locationDisplay(locId) {
  if (!locId) return '';
  return locId.split('-').map(function(w) {
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(' ').replace(/ Church .*$/, ' Church'); // trim city suffix
}
```

**Phase 3 — View toggle (future):**
Add a segmented control to switch between "By Day" (chronological, all types) and "By Type" (current accordion view). Not for this round — needs design mockup.

#### Data planning document
This item includes producing a data schema proposal document (`docs/plans/Service_Data_Enrichment.md`) that maps:
- Which fields to add (`location_name`, `is_primary_site`, `end_time`)
- Which parishes need backfilling (multi-site parishes first)
- Estimated records affected
- Migration plan for `parish_data.json`
- Supabase schema alignment (already has `end_time` and `location` columns)

#### Test checklist
- [ ] "Coming Up" shows next 3 services chronologically
- [ ] Services from different types (Mass + Confession) sort correctly
- [ ] Location name derived from location_id displays correctly
- [ ] Multi-site parish: location shown on each row
- [ ] Single-site parish: location omitted (no redundancy)
- [ ] "Coming Up" hidden when no upcoming services today/tomorrow
- [ ] Existing accordions unchanged in behavior
- [ ] Dark mode: coming-up card styling correct
- [ ] Data planning doc produced

---

### OW-24: Find Tab — Liturgical Banner Skeleton + Local Fallback

**Priority:** P1
**Effort:** 1.5 hours
**Files:** `src/readings.js` (lines 379–403), `src/app.js` (lines 694–699), `css/app.css`, `index.html`

#### Problem
The liturgical daily card on the Find tab (`#liturgicalTeaser`) loads from the external LitCal API (`litcal.johnromanodorazio.com`) with a 10-second timeout. If the API is slow or fails, the card never renders and the space jumps when it eventually appears. Meanwhile, pre-built `data/litcal-2026.json` and `data/litcal-2027.json` exist in the data folder but are never used as a runtime fallback.

#### Root cause (code)
`readings.js` line 387: `fetch('https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + year)` — external API is the only source. Catch block (line 399) returns `null` and `_renderDailyStrip()` never fires.

`app.js` line 695: `readings.fetchLiturgicalDay().then(function() { ... _renderDailyStrip(window._litcalCache.events); })` — the daily strip rendering is entirely gated behind the API fetch.

#### Fix (two parts)

**Part 1: Local-first loading**
Modify `fetchLiturgicalDay()` to load local data first, then upgrade from API:

```javascript
function fetchLiturgicalDay() {
  if (!config.FEATURES.litcal) return Promise.resolve(null);
  var now = getNow();
  var year = now.getFullYear();

  if (window._litcalCache && window._litcalCache.year === year) {
    return Promise.resolve(filterToday(window._litcalCache.events, now));
  }

  // Load local fallback first (instant)
  var localPromise = fetch('/data/litcal-' + year + '.json')
    .then(function(r) { return r.ok ? r.json() : null; })
    .then(function(d) {
      if (d && d.litcal && !window._litcalCache) {
        window._litcalCache = { year: year, events: d.litcal, source: 'local' };
      }
      return d;
    })
    .catch(function() { return null; });

  // API upgrade (parallel, non-blocking)
  var apiPromise = fetch(
    'https://litcal.johnromanodorazio.com/api/v5/calendar/nation/US/' + year,
    { signal: AbortSignal.timeout(10000) }
  )
  .then(function(resp) { return resp.ok ? resp.json() : null; })
  .then(function(data) {
    if (data && data.litcal) {
      window._litcalCache = { year: year, events: data.litcal, source: 'api' };
    }
  })
  .catch(function() {}); // API failure is non-fatal

  return localPromise.then(function() {
    return filterToday(window._litcalCache ? window._litcalCache.events : [], now);
  });
}
```

**Part 2: Skeleton loader**
Add a shimmer placeholder in `index.html` for `#liturgicalTeaser`:

```html
<div id="liturgicalTeaser" class="liturgical-teaser-wrap">
  <div class="daily-card-skeleton">
    <div class="skeleton-dot"></div>
    <div class="skeleton-lines">
      <div class="skeleton-line skeleton-line--long"></div>
      <div class="skeleton-line skeleton-line--short"></div>
    </div>
  </div>
</div>
```

CSS:
```css
.daily-card-skeleton { display: flex; align-items: center; gap: var(--space-3); padding: var(--space-3) var(--space-4); }
.skeleton-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--color-border-light); animation: skeleton-pulse 1.5s ease-in-out infinite; }
.skeleton-lines { flex: 1; }
.skeleton-line { height: 12px; border-radius: 6px; background: var(--color-border-light); animation: skeleton-pulse 1.5s ease-in-out infinite; }
.skeleton-line--long { width: 70%; margin-bottom: 6px; }
.skeleton-line--short { width: 40%; }
@keyframes skeleton-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
```

The skeleton is replaced when `_renderDailyStrip()` writes to `el.innerHTML`.

#### Test checklist
- [ ] Cold load: skeleton visible immediately, real content appears in < 1s (local data)
- [ ] API down: local data renders, no error
- [ ] API available: API data used (may silently upgrade from local)
- [ ] No local file (litcal-2028.json missing): graceful fallback to API only, skeleton shows until resolved
- [ ] Both fail: skeleton stays, no crash
- [ ] Dark mode: skeleton colors correct
- [ ] No layout jump when content replaces skeleton

---

### OW-25: Notification Preferences & System Settings Panel [DONE]

**Priority:** P2
**Effort:** 3 hours
**Files:** New section in `src/more.js` or new `src/settings.js`, `css/app.css`, `index.html`

#### Problem
The app has no centralized settings UI. Notification preferences are scattered (daily reading reminders exist but no preference panel). Dark mode toggles via system preference only. There's no way to manage:
- Push notification types and frequency
- Display preferences
- Data/privacy controls
- Prayer tool preferences

#### Proposed design: Settings card on More tab

Add a "Settings" card at the bottom of the More tab (below prayer tools and devotional guides). Tap opens a full-screen overlay.

**Settings groups:**

**Notifications:**
- Daily readings reminder (toggle + time picker)
- Holy Day of Obligation alerts (toggle, 1 day before)
- Saved church event reminders (toggle)
- Fasting/abstinence day reminders (toggle, Fridays in Lent)
- Prayer streak reminder (toggle + time)

**Display:**
- Dark mode (System / Light / Dark)
- Font size (Small / Default / Large) — affects `--text-base` scale

**Prayer:**
- Rosary mystery default (auto by day / manual)
- Examination of conscience: enable confession date tracking (toggle)

**Privacy:**
- Clear prayer activity data
- Clear saved churches
- Clear all local data (full reset)

**About:**
- App version
- Data last updated
- Licenses / open source
- Feedback link

#### Implementation notes
- All preferences stored in `localStorage` with `mf-pref-*` prefix
- Push notifications require service worker registration + user permission prompt
- Notification scheduling uses `Notification` API + service worker periodic sync (or `setTimeout` fallback for PWA)
- Settings overlay uses same pattern as novena/rosary overlays

#### Dependency
Push notifications depend on `sw.js` enhancements. Basic toggle UI can ship first; actual push scheduling is a separate sub-task.

#### Test checklist
- [ ] Settings card appears on More tab
- [ ] Each toggle persists across sessions
- [ ] Dark mode override works (system/light/dark)
- [ ] Font size change applies immediately
- [ ] Clear data: confirmation dialog, then wipes localStorage
- [ ] Notification permission: prompt shown, preference saved
- [ ] Dark mode: settings overlay fully styled
- [ ] Back button / swipe dismiss works

---

### OW-26: Validation Portal — Community Validator Roles

**Priority:** P3 (scoped project — design now, build later)
**Effort:** 8–12 hours (full project)
**Files:** New `src/validation-portal.js` or separate SPA, Supabase migrations, RLS policies

#### Problem
Currently, validation is dev-only (manual JSON edits). The app has 91 of 93 parishes verified, but maintaining accuracy requires community help. There's no way for trusted volunteers to confirm or correct service times.

#### Proposed design: Two-tier portal

**Tier 1 — Community validators ("Church Helpers"):**
- Simple, mobile-friendly interface
- Sign up with email (Supabase Auth magic link, no passwords)
- Assigned to specific parishes (self-select or admin-assign)
- Can: confirm services as accurate, flag services as wrong, submit corrections with notes
- Cannot: directly edit data, create new services, delete anything
- Trust levels: New (all corrections require review) → Trusted (corrections auto-applied after N confirmed accurate submissions) → Senior (can review other validators' submissions)

**Tier 2 — Administrators (dev/forkers):**
- Full CRUD on parish data
- Review and approve/reject community corrections
- Manage validator accounts and trust levels
- View accuracy metrics per parish, per validator
- Bulk operations (seasonal schedule updates)

#### Supabase schema additions
```sql
CREATE TABLE validators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  display_name TEXT,
  email TEXT NOT NULL,
  trust_level TEXT DEFAULT 'new' CHECK (trust_level IN ('new', 'trusted', 'senior', 'admin')),
  assigned_parishes TEXT[],
  total_submissions INT DEFAULT 0,
  accurate_submissions INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE validations (
  id SERIAL PRIMARY KEY,
  validator_id UUID REFERENCES validators(id),
  church_id TEXT REFERENCES churches(id),
  service_id TEXT,
  action TEXT CHECK (action IN ('confirmed', 'flagged', 'corrected')),
  field_changed TEXT,
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_applied')),
  reviewed_by UUID REFERENCES validators(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### RLS policies
- Validators can only INSERT their own validations
- Validators can only SELECT their own submissions + churches they're assigned to
- Admins can SELECT/UPDATE all
- Auto-apply rule: if `trust_level = 'trusted'` and `action = 'confirmed'`, set `status = 'auto_applied'`

#### Security
- All form inputs sanitized server-side (Supabase RLS + check constraints)
- Rate limiting on submissions (max 50/day per validator)
- Email verification required
- No free-text fields that could contain SQL (all structured data)

#### This item deliverable
For now: produce the design document (`docs/plans/Validation_Portal_Spec.md`) with schema, wireframes, trust level rules, and implementation phases. Build comes later as a scoped project.

---

### OW-27: Event Submission Portal

**Priority:** P3 (scoped project — design now, build later)
**Effort:** 6–8 hours (full project)
**Files:** Supabase migrations, new portal module or SPA

#### Problem
Community events are manually entered into `events.json`. There's no way for authorized community members (e.g., Young Catholic group leaders) to submit events themselves.

#### Proposed design: Role-based event submission

**Roles:**
- **Event submitter:** Can submit events for review. All submissions go through approval queue.
- **Trusted submitter:** Submissions auto-publish after N approved submissions. Can edit their own published events.
- **Event admin:** Can approve/reject submissions, edit any event, feature events.

**Submission form (structured, not free-text):**
- Title (required, max 100 chars)
- Category (dropdown: community, yc, liturgical, fundraiser, education, social)
- Date/dates (date picker, multi-date support)
- Time / end time
- Church (dropdown from parishes list — prevents typos and bad church_id)
- Description (max 500 chars, sanitized)
- Contact info (optional)
- Registration URL (optional, validated format)

**Data integrity:**
- All dropdown selections map to known enum values
- Church ID comes from existing parish list, never free-text
- Dates validated (must be future, reasonable range)
- Times validated (HH:MM format)
- Description sanitized: strip HTML, escape special chars
- No raw SQL anywhere — Supabase parameterized queries only
- Rate limiting: max 10 submissions/day per user

**Supabase schema:**
```sql
CREATE TABLE event_submissions (
  id SERIAL PRIMARY KEY,
  submitter_id UUID REFERENCES auth.users(id),
  church_id TEXT REFERENCES churches(id),
  title TEXT NOT NULL CHECK (char_length(title) <= 100),
  category TEXT NOT NULL CHECK (category IN ('community','yc','liturgical','fundraiser','education','social')),
  description TEXT CHECK (char_length(description) <= 500),
  date TEXT,
  dates TEXT[],
  time TEXT,
  end_time TEXT,
  contact_name TEXT,
  contact_email TEXT,
  registration_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','published')),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### This item deliverable
Design document (`docs/plans/Event_Submission_Portal_Spec.md`). Build comes later, likely alongside OW-26.

---

### OW-28: Parish Management Portal

**Priority:** P3 (scoped project — design now, build later)
**Effort:** 10–15 hours (full project)
**Files:** Supabase Auth, new portal module or SPA, migrations

#### Problem
Church leaders have no way to manage their own parish page. All data changes go through the dev. For the app to scale (especially for forks serving other dioceses), parish self-management is essential.

#### Proposed design: Authenticated parish dashboard

**Authentication:** Supabase Auth with email magic link. Parish leaders are invited by an admin and linked to their `church_id`.

**Capabilities:**
- View their parish's current data as it appears in the app
- Edit service times (with structured form, not free-text)
- Mark services as seasonal (with date ranges)
- Update contact info, office hours, clergy
- Submit special events
- View validation history for their parish
- See when data was last checked/confirmed

**Guardrails:**
- All edits create a `bulletin_changes` record (existing table) with `status: 'pending'`
- Admin approval required for first 3 edits, then auto-apply for trusted parishes
- Schema validation on all submissions (matches `parish_data.schema.json` rules)
- Audit trail: every change logged with timestamp, user, before/after

#### This item deliverable
Design document (`docs/plans/Parish_Portal_Spec.md`). Build comes later, likely final phase after OW-26 and OW-27.

---

### OW-29: Portal Infrastructure — Shared Auth & Trust System

**Priority:** P3 (prerequisite for OW-26, OW-27, OW-28)
**Effort:** 4 hours
**Files:** Supabase migrations, `src/auth.js` (new), `supabase/config.toml`

#### Problem
OW-26, OW-27, and OW-28 all need authentication, role management, and trust levels. This is the shared infrastructure they build on.

#### Scope
- Supabase Auth configuration (magic link, no passwords)
- Unified `users` table with role + trust_level columns
- RLS policies for role-based access
- Shared auth UI component (login/logout, role badge)
- Rate limiting middleware
- Input sanitization utilities (prevent XSS/injection in all portal forms)

#### Supabase schema
```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'validator' CHECK (role IN ('validator', 'event_submitter', 'parish_admin', 'admin', 'dev')),
  trust_level INT DEFAULT 0 CHECK (trust_level BETWEEN 0 AND 5),
  assigned_churches TEXT[],
  total_actions INT DEFAULT 0,
  approved_actions INT DEFAULT 0,
  last_active TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trust level thresholds:
-- 0: New (all actions reviewed)
-- 1: Basic (10+ approved actions)
-- 2: Trusted (50+ approved, >90% accuracy)
-- 3: Senior (100+ approved, can review others)
-- 4: Parish admin (manages own church)
-- 5: Dev/admin (full access)
```

#### This item deliverable
Design document (`docs/plans/Portal_Auth_Infrastructure_Spec.md`) + Supabase migration file. Build first when portal work begins.

---

## PRIORITY SUMMARY

### P1 — Ship next (high value, clear scope)
| ID | Summary | Effort | Dependencies |
|----|---------|--------|-------------|
| OW-15 | Activity metrics redesign | 2 hrs | None |
| OW-16 | Soon/Live visual enhancement | 2 hrs | None |
| OW-17 | Time-range service display fix | 1 hr | None |
| OW-18 | Novena multi-tracking overhaul | 3 hrs | None |
| OW-24 | Liturgical banner skeleton + fallback | 1.5 hrs | None |

### P2 — Valuable, needs some design work
| ID | Summary | Effort | Dependencies |
|----|---------|--------|-------------|
| ~~OW-19~~ | ~~CCC ↔ Baltimore toggle~~ | ~~2 hrs~~ | ✅ Done |
| ~~OW-20~~ | ~~Baltimore language modernization~~ | ~~2 hrs~~ | ✅ Done |
| ~~OW-21~~ | ~~CCC Explore module~~ | ~~6–8 hrs~~ | ✅ Done |
| ~~OW-22~~ | ~~Bible refs progressive disclosure~~ | ~~1 hr~~ | ✅ Done |
| ~~OW-23~~ | ~~Church detail services restructuring~~ | ~~4+2 hrs~~ | ✅ Done |
| ~~OW-25~~ | ~~Settings panel~~ | ~~3 hrs~~ | ✅ Done |

### P3 — Scoped projects (design now, build later)
| ID | Summary | Effort | Dependencies |
|----|---------|--------|-------------|
| OW-29 | Portal auth infrastructure | 4 hrs | Supabase setup |
| OW-26 | Validation portal | 8–12 hrs | OW-29 |
| OW-27 | Event submission portal | 6–8 hrs | OW-29 |
| OW-28 | Parish management portal | 10–15 hrs | OW-29, OW-26 |

---

## DOCS THAT NEED ACTION

### Keep as-is (current and accurate)
- `docs/DATA_STANDARDS.md`, `docs/TERMINOLOGY.md`, `docs/PERSONAS.md`
- `docs/CONTRIBUTING.md`, `docs/FORK_GUIDE.md`, `docs/DEV_CHEATSHEET.md`
- `docs/review/validation-checklist.md`

### Keep but update
- `docs/ANTI_PATTERNS.md` — remove Node v12 section (OW-13)
- `docs/STYLE_GUIDE.md` — add `--font-prayer`, update component list (OW-14)
- `docs/ROADMAP.md` — metrics stale (28→91 validated, ~1,407→1,690 services)
- `docs/INTEGRATIONS.md` — add Bible data, BibleGet, litcal JSON, bible-xrefs
- `docs/plans/MassFinder_Master_Feature_Catalog.md` — mark 5 newly-done items

### Archive (move to docs/archive/)
- `docs/plans/CCC_BottomSheet_UX_Redesign.md`
- `docs/plans/MassFinder_Redesign_Audit_v3.md`
- `docs/plans/MassFinder_UX_Implementation_Spec_Amended.md`
- `docs/plans/MassFinder_UX_Remediation.md`
- `docs/plans/MassFinder_V2_Rebuild_Plan_ClaudeCode.md`

### New docs to produce (as part of work items)
- `docs/plans/Service_Data_Enrichment.md` (OW-23)
- `docs/plans/Validation_Portal_Spec.md` (OW-26)
- `docs/plans/Event_Submission_Portal_Spec.md` (OW-27)
- `docs/plans/Parish_Portal_Spec.md` (OW-28)
- `docs/plans/Portal_Auth_Infrastructure_Spec.md` (OW-29)
