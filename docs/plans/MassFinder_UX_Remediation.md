# MassFinder UX Spec — Remediation Report
## What's Missing, What's Partial, and Exact Code to Fix Each

**Audit date:** March 10, 2026
**Audited against:** MassFinder_UX_Implementation_Spec_Amended.md (22 changes)
**Latest commit:** `405d471` ("UX audit fixes: dark mode auto-detect, More tab badge, time-aware teaser notes")

---

## AUDIT SUMMARY

| Status | Count | Change IDs |
|--------|-------|------------|
| **Fully implemented** | 12 | 1, 5+21, 11, 14, 15, 16, 17, 18, 19, 20, 22 |
| **NOT implemented** | 7 | **2, 3, 6, 7, 8, 12, 13** |
| **Partially implemented** | 3 | 4, 9, 10 |

---

## MISSING CHANGE 2: More Tab Reorder (the single biggest gap)

**Status:** NOT done. The More tab HTML order is unchanged from before the spec.

**Current order in `index.html` (lines 108-200):**
1. HDO Banner ✓ (correct)
2. PWA Install Card ✓ (correct)
3. **About MassFinder (line 117)** — WRONG. Should be near bottom.
4. What's Happening (line 133) — should be after Prayer Tools
5. **Saint Card (line 153, `style="display:none"`)** — WRONG. Should be FIRST content section, VISIBLE.
6. Daily Reflection (line 159) — should be after saint card ✓
7. Today's Readings (line 162) — should be after reflection ✓
8. Upcoming Observances (line 168) — should be after events
9. Prayer Tools (line 182) — should be after readings
10. Faith Guides (line 189) — correct position

**Also still present:** The "What We're Working On" `<details>` inside About (lines 123-132). Spec says remove it.

### Fix — reorder sections in `index.html`

Inside `<div id="panelMore">` → `<div class="more-content">`, the sections should be in this exact order:

```
1. <div id="hdoBanner"></div>
2. <div id="moreInstallCard"></div>
3. Saint Card section (UNHIDE — remove style="display:none", change title to "Today")
4. <div id="dailyReflection" ...></div>
5. Today's Readings section
6. Prayer Tools section
7. What's Happening section
8. Upcoming Observances section
9. Faith Guides section
10. About MassFinder section (CONVERT to collapsed <details>)
11. <div class="more-footer" id="moreFooter"></div>
```

### Specific HTML edits:

**A. Unhide saint card** — Find line 153:
```html
<!-- BEFORE -->
<div class="more-section" style="display:none">
  <h2 class="more-section-title">Today's Celebration</h2>

<!-- AFTER -->
<div class="more-section" id="saintSection">
  <h2 class="more-section-title">Today</h2>
```

**B. Convert About to collapsible** — Replace the About `<div class="more-section">` block (lines 117-132) with:
```html
<details class="more-section">
  <summary class="more-section-title" style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;list-style:none">
    About MassFinder
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="width:18px;height:18px;flex-shrink:0;transition:transform 0.2s"><polyline points="6 9 12 15 18 9"/></svg>
  </summary>
  <div style="padding-top:var(--space-3)">
    <div class="stat-grid" id="aboutStatGrid"></div>
    <p>MassFinder is a stewardship project for Catholics in Western New England &mdash; find Mass, Confession and Adoration near you, throughout the region.</p>
  </div>
</details>
```

**C. Remove "What We're Working On"** — Delete the entire `<details>` block inside About (lines 123-132 in current HTML). All 4 paragraphs about "actively being built" and "rough edges" get removed.

**D. Move sections** — Cut and paste the HTML blocks into the specified order. The actual content of each section doesn't change — only their position in the DOM.

---

## MISSING CHANGE 3: Show All Chips on Mobile

**Status:** NOT done. `hide-mobile` class is still on 5 chips (lines 37-42 of `index.html`). CSS rule `.chip.hide-mobile { display: none !important; }` still exists.

### Fix — `index.html`

Remove `hide-mobile` from every chip that has it:

```html
<!-- Line 37: BEFORE -->
<button class="chip season-chip hide-mobile" data-filter="lent" id="seasonChip" style="display:none"></button>
<!-- AFTER -->
<button class="chip season-chip" data-filter="lent" id="seasonChip" style="display:none"></button>

<!-- Line 38: BEFORE -->
<button class="chip hide-mobile" data-filter="confession">Confession</button>
<!-- AFTER -->
<button class="chip" data-filter="confession">Confession</button>

<!-- Line 39: BEFORE -->
<button class="chip hide-mobile" data-filter="adoration">Adoration</button>
<!-- AFTER -->
<button class="chip" data-filter="adoration">Adoration</button>

<!-- Line 40: BEFORE -->
<button class="chip hide-mobile" data-filter="latin">Latin</button>
<!-- AFTER -->
<button class="chip" data-filter="latin">Latin</button>

<!-- Line 41: BEFORE -->
<button class="chip hide-mobile" data-filter="spanish">Spanish</button>
<!-- AFTER -->
<button class="chip" data-filter="spanish">Spanish</button>

<!-- Line 42: BEFORE -->
<button class="chip yc-chip hide-mobile" data-filter="yc">YC Events</button>
<!-- AFTER -->
<button class="chip yc-chip" data-filter="yc">YC Events</button>
```

### Fix — `css/app.css`

Find and remove this rule from inside the `@media (max-width: 767px)` block:
```css
.chip.hide-mobile { display: none !important; }
```

---

## MISSING CHANGE 6: Card Chevron Affordance

**Status:** NOT done. No `card-chevron` class exists in CSS or render.js.

### Fix — `src/render.js`

In the `renderCards()` function, find the closing of the `card-right` div. It currently ends with the favorite button followed by `</div></div>`. After the fav button's closing `</button>` and before `</div></div>` (closing card-right and card-top), add a chevron span.

Find this pattern in the card HTML template string (around line 94):
```javascript
+ '</button>'
+ '</div></div>'
```

Change to:
```javascript
+ '</button>'
+ '<span class="card-chevron" aria-hidden="true">\u203A</span>'
+ '</div></div>'
```

### Fix — `css/app.css`

Add after the `.card-fav` styles:
```css
.card-chevron { color:var(--color-text-tertiary);font-size:1.3rem;line-height:1;flex-shrink:0;margin-left:var(--space-1); }
```

---

## MISSING CHANGE 7: Saved Tab Active Empty State

**Status:** NOT done. Still shows passive "No saved churches yet" / "Tap the heart icon" with no button.

### Fix — `src/saved.js`

Replace the empty state block (lines 101-105) with:

```javascript
if (!favChurches.length) {
  el.innerHTML = '<div class="saved-empty">'
    + '<div class="saved-empty-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div>'
    + '<h3>Save your parish for quick access</h3>'
    + '<p>Your saved churches appear here with their upcoming schedules and events at a glance.</p>'
    + '<button class="saved-empty-btn" onclick="switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'))">Find churches near me</button>'
    + '</div>';
  return;
}
```

### Fix — `css/app.css`

Add after the existing `.saved-empty` styles:
```css
.saved-empty-btn { display:inline-flex;align-items:center;gap:var(--space-2);margin-top:var(--space-4);padding:var(--space-3) var(--space-5);background:var(--color-primary);color:var(--color-text-inverse);font-size:var(--text-sm);font-weight:var(--weight-semibold);border-radius:var(--radius-full);min-height:44px; }
.saved-empty-btn:hover { background:var(--color-primary-light); }
```

---

## MISSING CHANGE 8: Prayer Tool Cards — Full-Card Tap

**Status:** NOT done. Cards still use separate "Begin" button. Card div itself is not tappable. No chevron. Confession tracker still separate.

### Fix — `src/more.js`

Replace the prayer tools block (lines 215-234) with:

```javascript
var confStatus = exam.getConfessionStatus();
var confLabel = confStatus ? 'Last Confession: ' + confStatus.daysAgo + (confStatus.daysAgo === 1 ? ' day' : ' days') + ' ago' : '';

var ptCards = [
  { id: 'rosary', icon: '\u271E', title: 'Guided Rosary', subtitle: 'Mysteries, meditations, bead counter', action: 'openRosary()', active: true },
  { id: 'examination', icon: '\u2696\uFE0F', title: 'Examination of Conscience', subtitle: confLabel || 'Prepare for Reconciliation', action: 'openExamination()', active: true },
  { id: 'stations', icon: '\u271D\uFE0F', title: 'Stations of the Cross', subtitle: isLentSeason() ? 'Lenten devotion' : 'Coming soon', action: '', active: false },
];
ptGrid.innerHTML = ptCards.map(function(c) {
  return '<div class="prayer-tool-card' + (c.active ? '' : ' coming-soon') + '"'
    + (c.active ? ' onclick="' + c.action + '" role="button" tabindex="0"' : '')
    + '>'
    + '<div class="prayer-tool-icon">' + c.icon + '</div>'
    + '<div class="prayer-tool-body">'
    + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
    + '<div class="prayer-tool-subtitle">' + esc(c.subtitle) + '</div>'
    + '</div>'
    + (c.active ? '<span class="prayer-tool-chevron" aria-hidden="true">\u203A</span>' : '')
    + '</div>';
}).join('');
```

### Fix — `css/app.css`

Replace existing `.prayer-tool-card` and related styles with:
```css
.prayer-tool-card { display:flex;align-items:center;gap:var(--space-3);padding:var(--space-4);background:var(--color-surface);border:1px solid var(--color-border-light);border-radius:var(--radius-md);transition:box-shadow 0.15s;cursor:pointer;-webkit-tap-highlight-color:transparent; }
.prayer-tool-card:not(.coming-soon):hover { box-shadow:var(--shadow-card-hover); }
.prayer-tool-card:not(.coming-soon):active { transform:scale(0.98); }
.prayer-tool-card.coming-soon { opacity:0.5;cursor:default; }
.prayer-tool-icon { font-size:1.5rem;flex-shrink:0;width:40px;text-align:center; }
.prayer-tool-body { flex:1;min-width:0; }
.prayer-tool-title { font-size:var(--text-base);font-weight:var(--weight-semibold);color:var(--color-text-primary);line-height:1.3; }
.prayer-tool-subtitle { font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:2px; }
.prayer-tool-chevron { color:var(--color-text-tertiary);font-size:1.3rem;flex-shrink:0; }
```

### Fix — `index.html`

Remove the standalone confession tracker div (line 184):
```html
<!-- REMOVE THIS LINE -->
<div id="confessionTracker" class="confession-tracker" style="display:none"></div>
```

The confession tracker data is now shown as the examination card's subtitle.

### Fix — `src/more.js`

Remove or comment out the call to `exam._updateMoreTabTracker()` (line 209) since the tracker is now integrated into the card subtitle.

---

## MISSING CHANGE 12: More Tab Badge When Daily Content Awaits

**Status:** NOT done. No `tab-new-dot` class in CSS. No `mf-last-readings-view` tracking in JS.

### Fix — `src/app.js`

After the liturgical data fetches resolve (inside the `init()` function, after `_renderLiturgicalTeaser`), add:

```javascript
// Badge the More tab if daily content hasn't been viewed
var moreTabBtn = document.querySelector('[data-tab="panelMore"]');
var lastReadingsView = localStorage.getItem('mf-last-readings-view');
var todayStr = new Date().toISOString().slice(0, 10);
if (moreTabBtn && lastReadingsView !== todayStr) {
  if (!moreTabBtn.querySelector('.tab-new-dot')) {
    var dot = document.createElement('span');
    dot.className = 'tab-new-dot';
    dot.setAttribute('aria-hidden', 'true');
    moreTabBtn.appendChild(dot);
  }
}
```

### Fix — `src/ui.js`

In the `switchTab()` function, after the tab switching logic, add a block to clear the badge when switching to More:

```javascript
// Clear More tab daily-content badge
if (id === 'panelMore') {
  localStorage.setItem('mf-last-readings-view', new Date().toISOString().slice(0, 10));
  var dot = document.querySelector('.tab-new-dot');
  if (dot) dot.remove();
}
```

### Fix — `css/app.css`

Add after `.tab-item` styles:
```css
.tab-new-dot { position:absolute;top:6px;right:calc(50% - 16px);width:7px;height:7px;background:var(--color-accent);border-radius:50%;pointer-events:none; }
```

---

## MISSING CHANGE 13: Seasonal Urgency Messaging

**Status:** NOT done. No `seasonal-nudge` class in CSS or JS.

### Fix — `src/more.js`

In `renderMore()`, after the Prayer Tools grid renders and before the prayer activity summary, add:

```javascript
// Seasonal nudge above prayer tools
var season = document.documentElement.getAttribute('data-season');
var ptSection = document.getElementById('prayerToolsSection');
if (ptSection && (season === 'lent' || season === 'advent')) {
  var existingNudge = ptSection.querySelector('.seasonal-nudge');
  if (!existingNudge) {
    var nudge = document.createElement('div');
    nudge.className = 'seasonal-nudge';
    nudge.textContent = season === 'lent'
      ? 'It\u2019s Lent \u2014 a season of prayer, fasting, and almsgiving. These tools can help.'
      : 'It\u2019s Advent \u2014 a season of preparation and joyful expectation. These tools can help.';
    ptSection.insertBefore(nudge, ptGrid);
  }
}
```

### Fix — `css/app.css`

```css
.seasonal-nudge { font-size:var(--text-sm);color:var(--color-text-secondary);font-style:italic;margin-bottom:var(--space-3);line-height:1.5; }
```

---

## PARTIAL CHANGE 4: Welcome Banner — Style Mismatch

**Status:** Functional but uses subtle cream background (`--color-accent-pale`) instead of the bold navy (`--color-primary`) specified in the spec. The spec intended a high-contrast first-impression banner that demands attention. The current implementation blends into the page and is easy to miss.

### Fix — `css/app.css`

Change the welcome banner background:
```css
/* BEFORE */
.welcome-banner { display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4);background:var(--color-accent-pale);border-radius:var(--radius-md); }
.welcome-title { font-family:var(--font-display);font-size:var(--text-lg);font-weight:var(--weight-semibold);color:var(--color-heading);margin-bottom:var(--space-1); }
.welcome-desc { font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.5; }
.welcome-dismiss { ...color:var(--color-accent-text);... }

/* AFTER */
.welcome-banner { display:flex;align-items:flex-start;gap:var(--space-3);padding:var(--space-4);background:var(--color-primary);border-radius:var(--radius-md); }
.welcome-title { font-family:var(--font-display);font-size:var(--text-lg);font-weight:var(--weight-semibold);color:var(--color-text-inverse);margin-bottom:var(--space-1); }
.welcome-desc { font-size:var(--text-sm);color:var(--color-text-inverse);opacity:0.85;line-height:1.5; }
.welcome-dismiss { ...color:var(--color-text-inverse);... }
```

---

## PARTIAL CHANGE 9: Dark Mode — Missing Runtime Listener

**Status:** The FOUC script correctly auto-detects system dark mode on page load. But there's no runtime listener, so if the user changes system dark mode while the app is open (e.g., iOS automatic sunset switching), the app doesn't follow.

### Fix — `src/app.js`

Add at the top level (outside `init()`, after the theme toggle code):

```javascript
// Follow system dark mode changes when no explicit user preference
if (window.matchMedia) {
  try {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
      if (localStorage.getItem('mf-theme')) return;
      document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      var meta = document.getElementById('metaThemeColor');
      if (meta) meta.setAttribute('content', e.matches ? '#1A1C22' : '#F8F7F4');
    });
  } catch (e) { /* Safari <14 doesn't support addEventListener on matchMedia */ }
}
```

---

## IMPLEMENTATION ORDER

Execute in this exact sequence:

1. **Change 2** — More tab reorder (the HTML restructuring). This is the biggest single change. Move sections, unhide saint card, collapse About, remove "What We're Working On." (~15 min)
2. **Change 3** — Remove `hide-mobile` from chips + remove CSS rule. (~5 min)
3. **Change 6** — Add card chevron to render.js + CSS. (~5 min)
4. **Change 7** — Replace saved tab empty state. (~5 min)
5. **Change 8** — Redesign prayer tool cards (full-card tap, subtitle, remove separate confession tracker). (~15 min)
6. **Change 12** — Add More tab badge (JS in app.js + ui.js, CSS). (~10 min)
7. **Change 13** — Add seasonal nudge to more.js + CSS. (~5 min)
8. **Change 4 fix** — Update welcome banner colors to high-contrast navy. (~3 min)
9. **Change 9 fix** — Add runtime matchMedia listener. (~3 min)

**After all fixes:** `npm run build`, test in Chrome incognito, verify:
- [ ] More tab order: Today (saint) → Daily Reflection → Readings → Prayer Tools → Events → Observances → Guides → About (collapsed)
- [ ] Saint card is VISIBLE and rendering
- [ ] "What We're Working On" is GONE
- [ ] About section is a collapsed `<details>` element
- [ ] ALL chips visible on mobile viewport (320px width)
- [ ] Parish cards have `›` chevron
- [ ] Saved tab empty state has "Find churches near me" button
- [ ] Prayer tool cards are full-card tappable with chevron and subtitle
- [ ] Confession tracker shows as examination card subtitle, not as separate banner
- [ ] More tab has a small gold dot badge on first load (clears on tab visit)
- [ ] During Lent: italic seasonal nudge appears above prayer tools grid
- [ ] Welcome banner is navy with white text (not cream)
- [ ] Changing system dark mode preference while app is open triggers theme switch
