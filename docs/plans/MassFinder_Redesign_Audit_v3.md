# MassFinder Ground-Up Redesign Audit v3
## Delight, Clarity, and Retention — Surgical Implementation Spec

**Audited commit:** `8c346e7` ("UX polish: daily strip, swipe dismiss, inline YC, confessional format, collapsible More")
**Date:** March 10, 2026

**Guiding principle for every change below:** Does this make a user more likely to open MassFinder tomorrow? If no, cut it. If yes, make it frictionless.

---

## PART 1: WHAT TO REMOVE

These items add clutter without driving retention. Removing them is as important as adding features.

### REMOVE-1: "Stations of the Cross — Coming Soon" prayer tool placeholder

**File:** `src/more.js`, lines 215-218
**Why:** A grayed-out card with "Coming soon" tells the user "this app is incomplete." It occupies prime space in the prayer tools grid. Remove it entirely. When Stations is ready, add it back.

**Action:** In the `ptCards` array (line 215), delete the third object:
```javascript
// DELETE this entire object from the ptCards array:
{ id: 'stations', icon: '\u271D\uFE0F', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : 'Coming soon', action: '', active: false }
```
The array should have exactly 2 items (rosary, examination).

### REMOVE-2: Action buttons on every What's Happening event card

**File:** `src/more.js`, lines ~160-165 and ~175-180
**Why:** Each event card in What's Happening has two buttons (Add to Calendar, I'm Interested) that create visual noise. These actions belong in the event detail panel, not on a glance-view card.

**Action:** In both the YC card template and the community card template inside `renderMore()`, delete the `saved-evt-actions` div block. Specifically, remove these blocks:

In the YC event card template (around line 160):
```javascript
// DELETE these 4 lines from the YC card:
+ '<div class="saved-evt-actions" style="margin-top:var(--space-2)">'
+ '<button class="saved-evt-btn" onclick="downloadEventIcal(...)...>...'
+ '<button class="saved-evt-btn" onclick="expressInterest(...)...>...'
+ '</div></div>';
```
Replace the last line with just `+ '</div>';`

Same deletion in the community card template (around line 180).

### REMOVE-3: Community events ticker animation

**File:** `src/more.js`, around line 185
**Why:** The auto-scrolling ticker (`wh-ticker` class with `tickerScroll` animation) is distracting, hard to interact with, and causes motion sickness for some users. Replace with a simple static list.

**Action:** Replace the conditional ticker block:
```javascript
// BEFORE:
if (commCards && commShow.length > 3) {
  commEl.innerHTML = '<div class="wh-ticker">' + commCards + commCards + '</div>';
} else {
  commEl.innerHTML = commCards || '<p class="wh-empty">No upcoming events.</p>';
}

// AFTER:
commEl.innerHTML = commCards || '<p class="wh-empty">No upcoming events.</p>';
if (commShow.length > 6) {
  commEl.style.maxHeight = '320px';
  commEl.style.overflowY = 'auto';
}
```

Also remove the height-matching `setTimeout` block that follows (lines ~188-196) — it was only needed for the ticker.

**File:** `css/app.css` — remove or keep (harmless) the `.wh-ticker` and `@keyframes tickerScroll` rules. Also remove the mask-image on `#whCommunityList`:
```css
/* DELETE this rule: */
#whCommunityList { overflow: hidden; -webkit-mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 80%, transparent 100%); mask-image: linear-gradient(to bottom, transparent 0%, black 8%, black 80%, transparent 100%); }
```

### REMOVE-4: The About stat grid

**File:** `src/more.js`, the "ABOUT STAT GRID" IIFE (lines ~103-130)
**Why:** Showing "93 Churches · 1,690 Services · 42 days Avg. Data Age · 15 Active Events" is developer metrics, not user-facing value. The About section should be a single sentence, not a dashboard.

**Action:** Delete the entire `(function() { var grid = document.getElementById('aboutStatGrid'); ... })();` block.

**File:** `index.html` — inside the About `<details>` section, remove `<div class="stat-grid" id="aboutStatGrid"></div>`.

### REMOVE-5: The "What We're Working On" block

**File:** `index.html`
**Status check:** Already removed per remediation spec. Verify it's gone. If any trace remains, delete it.

---

## PART 2: VISUAL CLARITY FIXES

### COLOR-1: Fix the secondary/tertiary text color collapse

**File:** `css/app.css`, `:root` variables (line 49-50)

**Problem:** `--color-text-secondary: #5C6370` and `--color-text-tertiary: #656B73` are nearly identical (only ~6 luminance points apart). The eye cannot distinguish them. This makes the three-tier text hierarchy (primary → secondary → tertiary) collapse into two tiers.

**Action:** Increase the gap. Lighten tertiary significantly:
```css
/* BEFORE: */
--color-text-secondary: #5C6370;
--color-text-tertiary: #656B73;

/* AFTER: */
--color-text-secondary: #5C6370;
--color-text-tertiary: #8B919C;
```

This gives a clear three-step hierarchy: dark (#1A1E26) → medium (#5C6370) → light (#8B919C).

**Dark mode equivalent** — in `html[data-theme="dark"]`:
```css
/* BEFORE: */
--color-text-secondary: #A8AEBC;
--color-text-tertiary: #949AAA;

/* AFTER: */
--color-text-secondary: #A8AEBC;
--color-text-tertiary: #6E7585;
```

### COLOR-2: Define `--color-heading` in `:root`

**File:** `css/app.css`, `:root` block

**Problem:** `--color-heading` is referenced in `.yc-compact-name`, `.exam-title`, `.exam-row-title`, `.exam-prayer-title`, `.exam-howto-label` but never defined in `:root`. It falls back to `inherit` which works but is fragile.

**Action:** Add to `:root`:
```css
--color-heading: #1A1E26;
```

And in `html[data-theme="dark"]`:
```css
--color-heading: #EEF0F4;
```

### COLOR-3: Strengthen the daily reflection card's visual identity

**File:** `css/app.css`, `.reflection-card` rule

**Problem:** The reflection card has the same background as every other surface. It doesn't read as "daily changing content." The saint card has a colored left border (via `border-left: 3px solid`). The reflection card should have similar treatment.

**Action:**
```css
/* BEFORE: */
.reflection-card { padding:var(--space-4);background:var(--color-surface);border-radius:var(--radius-md);cursor:pointer;transition:box-shadow var(--transition-fast);-webkit-tap-highlight-color:transparent; }

/* AFTER: */
.reflection-card { padding:var(--space-4);background:var(--color-surface);border-left:3px solid var(--color-primary-muted);border-radius:var(--radius-md);cursor:pointer;transition:box-shadow var(--transition-fast);-webkit-tap-highlight-color:transparent; }
```

### SPACING-1: More tab section spacing

**File:** `css/app.css`, `.more-section` rule

**Problem:** `padding: var(--space-5) 0` (20px) between sections is tight. The daily content sections (Today, Reflection, Readings) need more breathing room so they don't feel like a wall of text.

**Action:**
```css
/* BEFORE: */
.more-section { padding: var(--space-5) 0; border-bottom: 1px solid var(--color-border-light); }

/* AFTER: */
.more-section { padding: var(--space-6) 0; border-bottom: 1px solid var(--color-border-light); }
```

This changes from 20px to 24px — subtle but makes each section breathe.

### SPACING-2: More section title margin

**File:** `css/app.css`, `.more-section-title` rule

**Problem:** `margin-bottom: var(--space-3)` (12px) is tight between title and content.

**Action:**
```css
/* BEFORE: */
.more-section-title { font-family: var(--font-display); font-size: var(--text-xl); font-weight: 700; color: var(--color-text-primary); margin-bottom: var(--space-3); }

/* AFTER: */
.more-section-title { font-family: var(--font-display); font-size: var(--text-lg); font-weight: 700; color: var(--color-text-primary); margin-bottom: var(--space-4); }
```

Note: also reduces from `--text-xl` (20px) to `--text-lg` (18px). The section titles were competing with content for visual weight. Slightly smaller titles let the content breathe.

---

## PART 3: FIND TAB REFINEMENT

### FIND-1: Strengthen the daily strip into a proper card

**File:** `src/app.js`, function `_renderDailyStrip()` (line 291)
**File:** `css/app.css`, `.daily-strip` rules

**Problem:** The current daily strip is a single line of tiny text (`.daily-strip-text` is `font-size:var(--text-xs)`, which is 13px). It's the #1 retention driver but it's the smallest element on the page. Users scroll right past it.

**Action — JS:** Replace the `_renderDailyStrip` function in `src/app.js`:

```javascript
function _renderDailyStrip(events) {
  var el = document.getElementById('liturgicalTeaser');
  if (!el) return;
  var now = utils.getNow(), m = now.getMonth() + 1, d = now.getDate();
  var today = events.filter(function(e) { return e.month === m && e.day === d && !e.is_vigil_mass; });
  if (!today.length) return;

  var pick = today.sort(function(a, b) { return (b.grade || 0) - (a.grade || 0); })[0];
  var color = (pick.color && pick.color[0]) || 'green';
  var colorMap = { purple: '#6B21A8', red: '#DC2626', white: '#94A3B8', green: '#16A34A', rose: '#DB2777' };
  var colorHex = colorMap[color] || '#16A34A';

  var progress = utils.getSeasonProgress();
  var progressText = progress ? 'Day ' + progress.day + ' of ' + progress.total + ' \u00b7 ' + progress.season : '';

  // Secondary line
  var secondary = '';
  var dow = now.getDay();
  var season = document.documentElement.getAttribute('data-season');
  if (dow === 5 && season === 'lent') secondary = 'Abstinence from meat today';
  var tomorrow = new Date(now.getTime() + 86400000);
  var tomorrowHDO = events.filter(function(e) {
    return e.month === (tomorrow.getMonth() + 1) && e.day === tomorrow.getDate() && e.holy_day_of_obligation;
  });
  if (tomorrowHDO.length) secondary = 'Tomorrow: ' + tomorrowHDO[0].name + ' (Holy Day)';

  el.innerHTML = '<div class="daily-card" onclick="switchTab(\'panelMore\',document.querySelector(\'[data-tab=panelMore]\'))">'
    + '<div class="daily-card-row">'
    + '<span class="daily-card-dot" style="background:' + colorHex + '"></span>'
    + '<div class="daily-card-text">'
    + '<div class="daily-card-name">' + utils.esc(pick.name) + '</div>'
    + (progressText ? '<div class="daily-card-progress">' + utils.esc(progressText) + '</div>' : '')
    + (secondary ? '<div class="daily-card-secondary">' + utils.esc(secondary) + '</div>' : '')
    + '</div>'
    + '<span class="daily-card-arrow">\u203A</span>'
    + '</div>'
    + '</div>';
  el.style.display = '';
}
```

**Action — CSS:** Replace all `.daily-strip*` rules with:

```css
/* DAILY CARD — liturgical day teaser on Find tab */
.liturgical-teaser { max-width:var(--max-width);margin:0 auto;padding:var(--space-2) var(--space-4) 0; }
.daily-card { padding:var(--space-3) var(--space-4);background:var(--color-surface);border-radius:var(--radius-md);cursor:pointer;-webkit-tap-highlight-color:transparent;transition:box-shadow var(--transition-fast); }
.daily-card:hover { box-shadow:var(--shadow-card); }
.daily-card:active { opacity:0.9; }
.daily-card-row { display:flex;align-items:center;gap:var(--space-3); }
.daily-card-dot { width:10px;height:10px;border-radius:50%;flex-shrink:0; }
.daily-card-text { flex:1;min-width:0; }
.daily-card-name { font-size:var(--text-sm);font-weight:var(--weight-semibold);color:var(--color-text-primary);line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.daily-card-progress { font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:1px; }
.daily-card-secondary { font-size:var(--text-xs);color:var(--color-accent-text);font-style:italic;margin-top:1px; }
.daily-card-arrow { color:var(--color-text-tertiary);font-size:1.3rem;flex-shrink:0; }
```

**What changed:** The strip is now a card with surface background, larger dot (10px vs 8px), the saint name in semibold `--text-sm` (15px, up from 13px), and the progress/secondary info on separate lines below instead of crammed into one line. The card has hover/active states so it feels tappable.

### FIND-2: Reduce banner stacking at the top

**Problem:** The Find tab can show welcome banner AND return card simultaneously above the search bar. This pushes the search bar (the primary function) too far down.

**Action:** In `src/app.js`, the welcome banner render function (around line 354) and the return card render function (around line 369) should be mutually exclusive. The return card already checks `if (state._lastVisit)` — which means it won't show for first-time users. But verify that if `mf-welcome-dismissed` hasn't been set AND `_lastVisit` exists, only the return card shows. The current code at line 354 has `if (state._lastVisit) return;` — this correctly prevents the welcome banner from showing to returning users. No code change needed, but verify this logic holds.

### FIND-3: Confession prompt is missing — implement it

**Status:** CSS rules exist (`.conf-prompt-*` in `css/app.css` lines 255-260) but the HTML element and JS rendering function were never created. The confession prompt was specified in Change 20 of the amended spec.

**Action — `index.html`:** Add after the `</div>` closing the `chip-bar-wrap` div and before `<div id="activeFilters"`:
```html
<div id="confessionPrompt" class="conf-prompt-wrap" style="display:none"></div>
```

**Action — `src/app.js`:** Add the rendering function and call it after liturgical data resolves. See the amended spec (Change 20) for the full implementation. Key guard: don't show confession prompt if welcome banner or return card is visible:
```javascript
function _renderConfessionPrompt() {
  var dismissed = localStorage.getItem('mf-conf-prompt-' + new Date().toISOString().slice(0, 10));
  if (dismissed) return;
  var welcome = document.getElementById('welcomeBanner');
  var returnC = document.getElementById('returnCard');
  if ((welcome && welcome.style.display !== 'none') || (returnC && returnC.style.display !== 'none')) return;

  var day = new Date().getDay();
  var season = document.documentElement.getAttribute('data-season');
  if (day !== 6 && season !== 'lent') return; // Only Saturdays or during Lent

  var el = document.getElementById('confessionPrompt');
  if (!el) return;
  el.innerHTML = '<div class="conf-prompt">'
    + '<div class="conf-prompt-text">Find confession times near you this weekend</div>'
    + '<button class="conf-prompt-btn" onclick="applyQuickFilter(\'confession\');this.closest(\'.conf-prompt-wrap\').style.display=\'none\';localStorage.setItem(\'mf-conf-prompt-\'+new Date().toISOString().slice(0,10),\'1\')">Find times</button>'
    + '<button class="conf-prompt-x" onclick="this.closest(\'.conf-prompt-wrap\').style.display=\'none\';localStorage.setItem(\'mf-conf-prompt-\'+new Date().toISOString().slice(0,10),\'1\')" aria-label="Dismiss">\u2715</button>'
    + '</div>';
  el.style.display = '';
}
```
Call `_renderConfessionPrompt()` after `_renderDailyStrip()` in the init liturgical data callback.

---

## PART 4: MORE TAB RESTRUCTURING

### MORE-1: Uncollapse the daily content sections

**File:** `index.html`

**Problem:** Prayer Tools, What's Happening, Observances, Faith Guides, and About are all wrapped in `<details>` (collapsible). This is appropriate for Faith Guides, About, and Observances. But Prayer Tools should NOT be collapsible — it's a primary feature. The two prayer tools (rosary + examination) are the only interactive features in the More tab. Hiding them behind a tap creates friction.

**Action:** Convert Prayer Tools from `<details>` back to a plain `<div>`:

```html
<!-- BEFORE: -->
<details class="more-section" id="prayerToolsSection" open>
  <summary class="more-section-title more-section-collapsible">Prayer Tools<svg ...>...</svg></summary>
  <div class="prayer-tools-grid" id="prayerToolsGrid"></div>
</details>

<!-- AFTER: -->
<div class="more-section" id="prayerToolsSection">
  <h2 class="more-section-title">Prayer Tools</h2>
  <div class="prayer-tools-grid" id="prayerToolsGrid"></div>
</div>
```

### MORE-2: Simplify What's Happening to a single-column list

**File:** `index.html`

**Problem:** The two-column layout (YC | Community) wastes space on mobile and creates a cramped, hard-to-read layout. On a 375px screen, each column is ~155px wide — too narrow for event titles.

**Action:** Replace the two-column HTML with a single list:

```html
<!-- BEFORE: complex two-column layout with wh-two-col, wh-col-left, wh-col-right -->

<!-- AFTER: -->
<details class="more-section" id="whatsHappeningSection" style="display:none">
  <summary class="more-section-title more-section-collapsible">What's Happening<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div id="whEventsList"></div>
</details>
```

**File:** `src/more.js` — replace the entire What's Happening rendering block (the YC cards + community cards + ticker logic) with a simplified unified list:

```javascript
// -- What's Happening: unified event list --
var upcoming = getUpcomingYC();
var allCommunityEvents = state.eventsData.filter(function(e) { return e.category !== 'yc' && isEventActive(e); }).map(function(e) {
  var ch = state.allChurches.find(function(x) { return x.id === e.church_id; });
  return Object.assign({}, e, { churchName: ch ? ch.name : '', churchId: e.church_id, isYC: false });
});
var ycMapped = upcoming.map(function(e) {
  var r = resolveYC(e);
  return Object.assign({}, e, { churchName: r.locName || r.churchName, isYC: true });
});
var allEvents = ycMapped.concat(allCommunityEvents).sort(function(a, b) {
  return (a.date || '9999').localeCompare(b.date || '9999');
}).slice(0, 8);

var whSection = document.getElementById('whatsHappeningSection');
var whList = document.getElementById('whEventsList');
if (whSection && whList && allEvents.length) {
  whSection.style.display = 'block';
  whList.innerHTML = allEvents.map(function(e) {
    var dateStr = e.date ? fmtYCDate(e.date) : (e.day ? (DAY_NAMES[e.day] || e.day) : '');
    var timeStr = e.time ? ' \u00b7 ' + fmt12(e.time) : '';
    var ycBadge = e.isYC ? ' <span class="evt-yc-badge">YC</span>' : '';
    return '<div class="wh-event-card" onclick="openEventDetail(\'' + esc(e.id) + '\')">'
      + '<div class="wh-event-date">' + esc(dateStr) + timeStr + '</div>'
      + '<div class="wh-event-title">' + esc(e.title) + ycBadge + '</div>'
      + '<div class="wh-event-church">' + esc(displayName(e.churchName)) + '</div>'
      + '</div>';
  }).join('');
}
```

This is dramatically simpler — one chronological list, no columns, no ticker, no action buttons.

### MORE-3: Reduce Faith Guides visual weight

**File:** `index.html`

**Problem:** The intro paragraph "Brief guides to common Catholic devotions and services — written for everyone, whether you're returning after a long absence or simply curious." is preachy and takes up space. Users who want guides will open them.

**Action:** Remove the `<p>` tag from inside the Faith Guides details section. Let the devotional cards speak for themselves.

---

## PART 5: TYPOGRAPHY AND FONT HIERARCHY

### TYPE-1: Section title consistency

**File:** `css/app.css`

**Problem:** More tab section titles use `font-family: var(--font-display)` (Playfair Display, a serif display face) at `font-weight: 700`. Combined with the oversized `--text-xl` (now changed to `--text-lg` per SPACING-2), these titles have heavy visual weight that competes with the actual content.

The card names in Find tab use `font-size: var(--text-lg); font-weight: var(--weight-semibold)` in Source Sans (body font). This inconsistency means the More tab's "Today's Readings" title has more visual weight than a church name in the Find tab, which inverts the hierarchy.

**Action:** Already addressed in SPACING-2 by reducing to `--text-lg`. No additional change needed.

### TYPE-2: Reading entry tap target clarity

**File:** `css/app.css`

**Problem:** Reading entries (First Reading, Psalm, etc.) are tappable to expand but don't look tappable. The only hint is a tiny chevron.

**Action:** Add a subtle hover/active state:
```css
.reading-entry:hover { background:var(--color-surface-hover);margin:0 calc(-1 * var(--space-3));padding-left:var(--space-3);padding-right:var(--space-3);border-radius:var(--radius-sm); }
.reading-entry:active { opacity:0.85; }
```

---

## PART 6: PERSONA PATH VERIFICATION

### PATH-DOROTHY (55+, Saturday afternoon, wants weekend Mass times):

**Current path:** Open app → (sees daily strip, maybe banner clutter) → sees "All" chip active → scrolls card list → taps church → sees schedule.

**Issue:** Dorothy has to scroll to find her church. If she's saved it, the "Your Churches" row helps. But if she hasn't saved anything, the path is: search or scroll.

**Action (already implemented):** Your Churches row appears if she has saved churches. No further change needed.

### PATH-MARIA (30s, daily check-in, reads formation content):

**Current path:** Open app → sees daily strip → taps it → lands on More tab → reads saint card → reads reflection → expands readings.

**Issue:** The daily strip is too small (fixed in FIND-1). The More tab badge (Change 12) pulls her to the More tab. After FIND-1, the daily card will be visually prominent enough to drive the tap.

**Remaining gap:** When Maria taps the daily card and lands on More tab, the saint card is the first thing she sees. But the saint card loading state says "Loading..." then "Fetching today's celebration..." — this is two loading messages for one card. If the API is slow, she sees loading text for 1-2 seconds.

**Action — `index.html`:** Simplify the saint card loading state:
```html
<!-- BEFORE: -->
<div id="saintOfDayCard"><div class="saint-card"><div class="saint-feast">Loading…</div><div class="saint-name" style="font-size:var(--text-base);color:var(--color-text-tertiary);font-family:var(--font-body);font-weight:var(--weight-regular)">Fetching today's celebration…</div></div></div>

<!-- AFTER: -->
<div id="saintOfDayCard"><div class="saint-card"><div class="saint-feast" style="color:var(--color-text-tertiary)">Loading today's celebration…</div></div></div>
```

One line, not two. Cleaner loading state.

### PATH-LUCAS (20s, power user, deep engagement):

Lucas's path is fine — he uses everything. The prayer activity summary, the CCC reflection with cross-references, the rosary guide. No changes needed for his path.

---

## PART 7: MICRO-INTERACTIONS AND DELIGHT

### DELIGHT-1: Card press feedback

**File:** `css/app.css`

**Problem:** The parish card has `transform: scale(0.995)` on `:active` — this is so subtle it's invisible. For a touch interface, the press feedback should be perceptible.

**Action:**
```css
/* BEFORE: */
.parish-card:active { transform: scale(0.995); }

/* AFTER: */
.parish-card:active { transform: scale(0.98); }
```

Same for `.yc-compact`:
```css
/* BEFORE: */
.yc-compact:active { opacity:0.85; }

/* AFTER: stays the same — opacity feedback is good for small cards */
```

### DELIGHT-2: Smooth tab switching

**File:** `css/app.css`

**Problem:** Tab switching is instant (display:none → display:block). Adding a subtle fade-in makes it feel polished.

**Action:** Add to the `.tab-panel` rules:
```css
.tab-panel.active { display:block;animation:tabFadeIn 0.15s ease-out; }
@keyframes tabFadeIn { from { opacity:0.7; } to { opacity:1; } }
```

Add a reduced-motion override in the existing `@media (prefers-reduced-motion: reduce)` block — the existing blanket `animation-duration: 0.01ms` rule will handle this automatically.

---

## IMPLEMENTATION ORDER

Execute in exactly this sequence. Test after each numbered step.

**Step 1 — Removals (10 min):**
- REMOVE-1: Delete Stations from ptCards array in `src/more.js`
- REMOVE-2: Delete saved-evt-actions from both event card templates in `src/more.js`
- REMOVE-4: Delete the aboutStatGrid IIFE in `src/more.js` AND the `<div class="stat-grid" id="aboutStatGrid"></div>` from `index.html`
- REMOVE-5: Verify "What We're Working On" is gone from `index.html`

**Step 2 — Color and spacing fixes (10 min):**
- COLOR-1: Update `--color-text-tertiary` in both light and dark mode
- COLOR-2: Add `--color-heading` to both `:root` and dark mode
- COLOR-3: Add `border-left` to `.reflection-card`
- SPACING-1: Update `.more-section` padding
- SPACING-2: Update `.more-section-title` font-size and margin

**Step 3 — Find tab refinement (20 min):**
- FIND-1: Replace `_renderDailyStrip()` in `src/app.js` AND replace `.daily-strip*` CSS rules with `.daily-card*` rules
- FIND-2: Verify banner mutual exclusivity logic (welcome vs return card)
- FIND-3: Add confession prompt: HTML element in `index.html` after chip-bar-wrap, JS function `_renderConfessionPrompt()` in `src/app.js`, wire it into the liturgical data callback

**Step 4 — More tab restructuring (20 min):**
- MORE-1: Convert Prayer Tools from `<details>` to `<div>` in `index.html`
- MORE-2: Replace What's Happening two-column HTML in `index.html` + replace JS rendering in `src/more.js`
- MORE-3: Remove the intro `<p>` from Faith Guides in `index.html`
- REMOVE-3: Remove ticker logic from `src/more.js` + remove mask-image CSS (this is handled by MORE-2)

**Step 5 — Polish (5 min):**
- TYPE-2: Add reading-entry hover/active styles
- PATH-MARIA: Simplify saint card loading HTML
- DELIGHT-1: Strengthen card press scale
- DELIGHT-2: Add tab fade-in animation

**Step 6 — Build and test:**
- Run `npm run build`
- Test in Chrome incognito at 375px width (iPhone SE)
- Test in Chrome incognito at 430px width (iPhone Pro Max)
- Verify: More tab sections breathe (24px between sections)
- Verify: Daily card on Find tab is visible and tappable (not a thin strip)
- Verify: Only 2 prayer tools shown (no "Coming soon" placeholder)
- Verify: What's Happening is a single column list (no ticker)
- Verify: Text color hierarchy visible — primary is dark, secondary is medium, tertiary is noticeably lighter
- Verify: Confession prompt appears below chips, not above search
- Verify: No stacking of welcome banner + confession prompt simultaneously
- Test dark mode: verify all three text colors are distinguishable
