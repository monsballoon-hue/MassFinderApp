# UX Spec: Prayer & More Tab V2 Restructure

**Prefix:** PMV (Prayer/More V2)
**Created:** 2026-03-15
**Status:** Ready for implementation
**Scope:** More tab Zones 2–3 restructure — prayer content hierarchy, library surfacing, progressive disclosure
**Files affected:** `src/more.js`, `css/app.css`, `index.html`, potentially `src/app.js` (Daily Formation move)

---

## Problem Statement

The More tab's "Prayer & Devotion" zone has grown from 3 prayer tools to a comprehensive Catholic spiritual life platform:

| Content type | Items | Engagement model |
|---|---|---|
| Guided prayer experiences | 5 (Rosary, Chaplet, Stations, Examination, Lectio Divina) | 5–30 min immersive, wake lock, sacred pause |
| Quick-reference prayers | 31 prayers + 2 litanies | Look up → read → close |
| Tracking & practice | 2 (Novena tracker, First Friday/Saturday) | Accountability, streaks, progress |
| Study & reference | 5 (CCC, Bible, Explore, Baltimore, Summa) | Deep reading, cross-referencing |
| Faith guides | 6+ devotional guides | Seasonal reference |

All of this is presented through a flat 2×2 grid + "More tools" accordion + dashed library teaser + hidden `<details>` toggle. **The container has not evolved with the content.**

### Impact by demographic

**Dorothy, 72, bifocals:** The 3-column secondary grid uses `--text-xs` (13px) titles with 28px icons and no subtitles. She cannot read them. She doesn't know Stations of the Cross exist in the app. The Prayer Book — where she'd find the Hail Mary text — looks identical to the Examination of Conscience, a complex multi-screen guided flow.

**Marcus, 25, phone-native:** No visual hierarchy signals "these are the big immersive experiences" vs "these are quick utilities." The Explore module (the app's most powerful feature for cross-referencing CCC/Bible/Baltimore) is completely invisible from the More tab. The "Grow in Faith" behind a `<details>` toggle feels like an afterthought. He bounces — nothing signals depth.

**Sarah, 45, one-handed with kids:** She wants "pray the Rosary right now" but has to scan a 2×2 grid of 4 identically-styled cards. No clear entry hierarchy between the Rosary (20-min meditation) and the Prayer Book (reference lookup). The Daily Formation card sits in the Practice zone rather than the Today zone where she'd expect daily content.

---

## Core Insight

MassFinder's prayer content has evolved into **four distinct content types** that need different visual treatments:

1. **Guided Experiences** — immersive, time-investment → "I want to pray for 5–30 minutes"
2. **Quick Reference** — look up, read, close → "I need the words to this prayer"
3. **Tracking & Practice** — accountability, streaks → "Am I keeping up?"
4. **Study & Learn** — deep reading, cross-refs → "I want to understand my faith"

The current grid treats all four identically.

---

## V2 Zone Architecture

### Current structure
```
Zone 1: TODAY (saint, seasonal, readings)
Zone 2: PRAYER & DEVOTION
  └─ 2×2 grid: Prayer Book | Rosary | Examination | [dynamic]
  └─ "More tools" accordion: Stations | Novena | First Friday
  └─ Library teaser (dashed, placeholder)
Zone 3: GROW IN FAITH (behind <details>)
  └─ Devotional guides
```

### V2 structure
```
Zone 1: TODAY (unchanged — saint, seasonal, readings, daily formation MOVED HERE)
  ─── zone seam ───
Zone 2: PRAY (restructured)
  ├─ Section A: Guided Prayer (2×2 grid — the immersive experiences)
  │   └─ Rosary | Chaplet | Stations | Examination
  ├─ Section B: Prayer Book (distinctive gateway card — wide, single-column)
  │   └─ "31 prayers · 2 guided litanies · Lectio Divina"
  └─ Section C: Your Practice (compact tracker strip)
      └─ Novena progress | First Friday streak
  ─── zone seam ───
Zone 3: STUDY (promoted from hidden — replaces library teaser + Grow in Faith)
  ├─ Section A: Catholic Library (2×2 grid of reference tools)
  │   └─ Explore | Catechism | Bible | Baltimore
  └─ Section B: Faith Guides (devotional guides — disclosure accordion)
```

---

## Spec Items

### PMV-01 — Daily Formation: Relocate to Today Zone

**What:** Move the Daily Formation card (Baltimore Q&A + Summa "Go Deeper") from Zone 2 into Zone 1 (Today), below Today's Readings.

**Why:** The Daily Formation is daily-rotating content — it belongs in the "daily briefing" zone, not the "practice tools" zone. Sarah checks the More tab once a day for the briefing — she expects all daily content in one place. Currently the formation card renders inside `#dailyFormation` which is a child of `.more-zone--practice`. It needs to move inside `.more-zone--today`.

**Before:** `#dailyFormation` is a direct child of `.more-zone--practice` in `index.html` line ~142.

**After:** `#dailyFormation` moves to inside `.more-zone--today`, after `#readingsSection`:
```html
<!-- Inside .more-zone--today, after readingsSection -->
<div id="dailyFormation" class="more-section more-section--tight" style="display:none"></div>
```

**CSS:** Add sacred-tinted top border matching the readings section treatment:
```css
.more-zone--today #dailyFormation:not(:empty) {
  padding-top: var(--space-3);
  margin-top: var(--space-2);
  border-top: 1px solid color-mix(in srgb, var(--color-sacred) 10%, transparent);
}
html[data-theme="dark"] .more-zone--today #dailyFormation:not(:empty) {
  border-top-color: color-mix(in srgb, var(--color-sacred) 8%, transparent);
}
```

**JS impact:** `_renderDailyFormation()` in `src/app.js` targets `#dailyFormation` by ID — no JS changes needed. The element just moves in the DOM.

**Dark mode:** Inherits Today zone dark treatment. Formation card already has dark mode styles.

**Test checklist:**
- [ ] Formation card renders inside Today zone below readings
- [ ] Sacred top border visible in light and dark mode
- [ ] "Go Deeper" toggle still expands Summa content
- [ ] CCC §link in Baltimore cite still opens CCC reader
- [ ] Empty state (failed fetch) doesn't leave visible gap

---

### PMV-02 — Guided Prayer Grid: Visual Hierarchy for Immersive Experiences

**What:** Restructure the primary prayer tools grid into a "Guided Prayer" section containing only the four immersive guided experiences: Rosary, Chaplet, Stations, and Examination.

**Why:** These four tools share a common interaction model: they open the full-screen reader overlay, acquire wake lock, trigger sacred pause, and involve multi-step guided flows. They are the "I want to pray right now" tools. The Prayer Book, Novena Tracker, and First Friday are fundamentally different content types and need separate visual treatment (PMV-03, PMV-04).

**Before:** `STICKY_IDS` = `{ prayerbook: true, rosary: true, examination: true }` — 3 sticky + 1 dynamic in a 2×2 grid.

**After:** The 2×2 grid contains exactly Rosary, Chaplet, Examination, Stations. No dynamic slot — all four are always visible. During contextual promotion (Lent → Stations gets accent, 3 PM → Chaplet gets Hour of Mercy badge, etc.), the promoted card gets the existing `prayer-tool-card--promoted` treatment but stays in the same grid position.

**Section title:** Change from "Prayer & Devotion" to "Guided Prayer"

```css
.more-section-title--pray {
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  letter-spacing: 0;
}
```

**Card grid:** Stays 2×2, but with slightly taller min-height to accommodate subtitle:
```css
.prayer-tools-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.prayer-tool-card--primary {
  flex-direction: column;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  min-height: 88px; /* was 80px — gives subtitle room */
}
```

**JS changes in `more.js`:**

New sticky IDs:
```js
var GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true };
```

The `ptCards` array stays the same, but `_resolveCardTiers()` is replaced with a simpler split:
- Guided: filter by `GUIDED_IDS` → always rendered in `#prayerToolsGrid`
- Prayer Book: rendered separately (PMV-03)
- Trackers (novena, firstfriday): rendered separately (PMV-04)

**Contextual promotion logic remains** — during Lent, Stations gets accent color. During Hour of Mercy, Chaplet gets active subtitle. Active novena or First Friday streak doesn't affect this grid — it affects the tracker strip (PMV-04).

**Test checklist:**
- [ ] 2×2 grid shows exactly: Rosary, Chaplet, Examination, Stations
- [ ] Section title reads "Guided Prayer"
- [ ] Promoted card styling works (Lent → Stations accent, 3 PM → Chaplet active)
- [ ] Each card opens correct reader module
- [ ] Touch targets ≥ 44×44pt on all four cards
- [ ] Dark mode renders correctly
- [ ] Grid doesn't overflow on 320px viewport

---

### PMV-03 — Prayer Book Gateway Card: Distinctive Collection Treatment

**What:** Replace the Prayer Book's position in the 2×2 grid with a distinctive full-width "gateway card" below the guided prayer grid. This card signals "collection of content" rather than "single tool."

**Why:** The Prayer Book is a *reference library* of 31 prayers organized by 5 categories, plus 2 guided litanies and Lectio Divina. It's fundamentally different from the immersive guided prayer tools. Dorothy opens the Prayer Book to find the Hail Mary text. Marcus opens the Rosary for a guided meditation. These are different use cases that deserve different visual treatment.

Currently the Prayer Book is one of 4 identical-looking grid cards. A 72-year-old can't distinguish "I want to look up a prayer" from "I want a guided 20-minute meditation."

**HTML:** New element after `#prayerToolsGrid`:
```html
<div id="prayerBookGateway"></div>
```

**Visual design:** Full-width card with horizontal layout — icon on left, text block on right, subtle chevron on far right. Visually distinct from the 2×2 grid above it through:
- Full-width (not 50% column)
- Slightly different background: `var(--color-surface)` with a subtle left-border accent
- Descriptive subtitle showing content breadth

```css
.prayerbook-gateway {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  margin-top: var(--space-2);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-sacred);
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 56px;
  transition: box-shadow 0.15s, transform 0.15s;
}
.prayerbook-gateway:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}
.prayerbook-gateway:active {
  transform: scale(0.98);
}
.prayerbook-gateway-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-sacred-pale);
  color: var(--color-sacred);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.prayerbook-gateway-icon svg {
  width: 22px;
  height: 22px;
}
.prayerbook-gateway-body {
  flex: 1;
  min-width: 0;
}
.prayerbook-gateway-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}
.prayerbook-gateway-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.3;
}
.prayerbook-gateway-chevron {
  width: 16px;
  height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* Dark mode */
html[data-theme="dark"] .prayerbook-gateway {
  border-left-color: var(--color-sacred);
  background: var(--color-surface);
}
```

**JS rendering:** In `renderMore()`, after the guided prayer grid:
```js
var pbGateway = document.getElementById('prayerBookGateway');
if (pbGateway) {
  pbGateway.innerHTML = '<div class="prayerbook-gateway" onclick="openPrayerBook()" role="button" tabindex="0">'
    + '<div class="prayerbook-gateway-icon">' + ptIcons.prayerbook + '</div>'
    + '<div class="prayerbook-gateway-body">'
    + '<div class="prayerbook-gateway-title">Prayer Book</div>'
    + '<div class="prayerbook-gateway-subtitle">31 prayers · 2 guided litanies · Lectio Divina</div>'
    + '</div>'
    + '<svg class="prayerbook-gateway-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</div>';
}
```

**Test checklist:**
- [ ] Full-width card renders below the 2×2 guided grid
- [ ] Visually distinct from grid cards (left border accent, wider)
- [ ] Subtitle reads "31 prayers · 2 guided litanies · Lectio Divina"
- [ ] Opens Prayer Book reader on tap
- [ ] Touch target ≥ 44×44pt
- [ ] Hover state on desktop
- [ ] Dark mode renders correctly
- [ ] Chevron signals "opens a list" not "expands inline"

---

### PMV-04 — Your Practice Strip: Compact Tracker Row

**What:** Replace the secondary tools accordion ("More tools" toggle) with a visually lighter "Your Practice" strip showing the two tracking/accountability tools: Novena Tracker and First Friday & Saturday.

**Why:** These tools aren't prayer experiences — they're accountability companions. A novena tracker shows "Day 5 of 9." A First Friday tracker shows "7 of 9 First Fridays." They need a lighter visual weight than the guided prayer cards but should still be accessible. The current 3-column secondary grid at `--text-xs` is unreadable for Dorothy and invisible for Marcus.

**Design:** Horizontal strip with 2 compact cards. Not a grid — a flex row with equal halves. Lighter visual treatment than the guided prayer cards:
- No colored icon circles (icon is inline, smaller)
- Subtitle always visible (unlike current `--secondary` which hides subtitles)
- Slightly recessed surface color

```css
.practice-strip {
  display: flex;
  gap: var(--space-2);
  margin-top: var(--space-3);
}
.practice-strip-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-2);
}
.practice-card {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--color-surface-hover);
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
  transition: background 0.15s;
}
.practice-card:active {
  background: var(--color-border-light);
}
.practice-card-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-surface);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.practice-card-icon svg {
  width: 14px;
  height: 14px;
}
.practice-card--active .practice-card-icon {
  background: var(--color-sacred-pale);
  color: var(--color-sacred);
}
.practice-card-body {
  flex: 1;
  min-width: 0;
}
.practice-card-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-primary);
  line-height: 1.2;
}
.practice-card-subtitle {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  line-height: 1.3;
  margin-top: 1px;
}
.practice-card--active .practice-card-subtitle {
  color: var(--color-verified);
  font-weight: var(--weight-medium);
}

/* Dark mode */
html[data-theme="dark"] .practice-card {
  background: var(--color-surface);
}
html[data-theme="dark"] .practice-card:active {
  background: var(--color-surface-hover);
}
html[data-theme="dark"] .practice-card-icon {
  background: var(--color-surface-hover);
}
```

**HTML:** Replace `#prayerToolsSecondaryWrap` with:
```html
<div id="practiceStrip"></div>
```

**JS rendering:**
```js
var practiceStrip = document.getElementById('practiceStrip');
if (practiceStrip) {
  var novIsActive = novenaActive || !!seasonalNovenaLabel;
  var ffIsActive = ffSub.active;

  practiceStrip.innerHTML = '<div class="practice-strip-label">Your Practice</div>'
    + '<div class="practice-strip">'
    + '<div class="practice-card' + (novIsActive ? ' practice-card--active' : '') + '" onclick="openNovena()" role="button" tabindex="0">'
    + '<div class="practice-card-icon">' + ptIcons.novena + '</div>'
    + '<div class="practice-card-body">'
    + '<div class="practice-card-title">Novenas</div>'
    + '<div class="practice-card-subtitle">' + esc(novSub) + '</div>'
    + '</div></div>'
    + '<div class="practice-card' + (ffIsActive ? ' practice-card--active' : '') + '" onclick="openFirstFriday()" role="button" tabindex="0">'
    + '<div class="practice-card-icon">' + ptIcons.firstfriday + '</div>'
    + '<div class="practice-card-body">'
    + '<div class="practice-card-title">First Fri & Sat</div>'
    + '<div class="practice-card-subtitle">' + esc(ffSub.text) + '</div>'
    + '</div></div>'
    + '</div>';
}
```

**Test checklist:**
- [ ] Two compact cards side by side: Novenas and First Friday
- [ ] "Your Practice" label above strip
- [ ] Active state (green subtitle, sacred icon) when novena in progress or FF streak active
- [ ] Subtitles always visible (not hidden like current secondary cards)
- [ ] Touch targets ≥ 44×44pt (min-height 48px)
- [ ] Dark mode renders correctly
- [ ] Text readable at `--text-sm` / `--text-xs` for all demographics

---

### PMV-05 — Catholic Library: Surface Reference Tools

**What:** Replace the dashed-border library teaser and the hidden "Grow in Faith" `<details>` wrapper with a visible "Catholic Library" section containing card entry points for the app's reference tools.

**Why:** MassFinder has *five* deep reference tools — Explore (cross-reference engine), CCC (2,865 paragraphs), Bible (DRB + CPDV), Baltimore Catechism, and Summa Theologica — but none are discoverable from the More tab. Users only encounter them through cross-reference links or the daily formation card. Marcus, the 25-year-old, has no idea the app contains a full Catechism and Bible. The library teaser with its dashed border and "coming soon" text actively *discourages* exploration of content that already exists.

**Design:** A 2×2 grid of "library cards" — similar to the guided prayer grid but with a distinct visual treatment that signals "reference content" rather than "prayer tool."

```css
.library-section {
  padding: var(--space-2) 0;
}
.library-section-title {
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  letter-spacing: 0;
  margin-bottom: var(--space-3);
}
.library-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2);
}
.library-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-radius: var(--radius-md);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  min-height: 80px;
  transition: box-shadow 0.15s, transform 0.15s;
}
.library-card:hover {
  box-shadow: var(--shadow-card-hover);
  transform: translateY(-1px);
}
.library-card:active {
  transform: scale(0.98);
}
.library-card-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--color-surface-hover);
  color: var(--color-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.library-card-icon svg {
  width: 20px;
  height: 20px;
}
.library-card-title {
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}
.library-card-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: 1.3;
}

/* Dark mode */
html[data-theme="dark"] .library-card-icon {
  background: var(--color-surface);
}
```

**HTML:** Replace `#libraryTeaser` and restructure `#deeperZone`:
```html
<!-- Replace libraryTeaser + deeperZone with: -->
<div class="more-zone more-zone--study" id="studyZone">
  <div class="library-section">
    <h2 class="library-section-title">Catholic Library</h2>
    <div class="library-grid" id="libraryGrid"></div>
  </div>
  <div id="devotionalSection">
    <details class="faith-guides-disclosure" id="faithGuidesToggle">
      <summary class="faith-guides-summary">
        <span class="faith-guides-label">Faith Guides</span>
        <span class="faith-guides-count" id="guidesCount"></span>
        <svg class="faith-guides-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
      </summary>
      <div class="faith-guides-body" id="devotionalCards"></div>
    </details>
  </div>
</div>
```

**Library card content:**

| Card | Title | Description | Action | Icon |
|------|-------|-------------|--------|------|
| Explore | Explore | Cross-reference CCC, Bible & more | `openExplore({type:'landing'})` | Connected nodes SVG |
| Catechism | Catechism | 2,865 paragraphs of Catholic teaching | `openCCC('1')` | Book with cross |
| Bible | Sacred Scripture | Douay-Rheims & CPDV | `openBible()` | Open book |
| Baltimore | Baltimore Catechism | Q&A format for the essentials | `openExplore({type:'landing'})` | Question mark in book |

**SVG icons for library cards:**
```js
var libIcons = {
  explore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="17" r="2"/><circle cx="19" cy="17" r="2"/><line x1="7" y1="7" x2="9.5" y2="10.5"/><line x1="17" y1="7" x2="14.5" y2="10.5"/><line x1="7" y1="17" x2="9.5" y2="13.5"/><line x1="17" y1="17" x2="14.5" y2="13.5"/></svg>',
  catechism: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
  bible: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  baltimore: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><circle cx="12" cy="9" r="2.5"/><path d="M10 14h4"/></svg>'
};
```

**Study zone CSS:**
```css
.more-zone--study {
  padding: var(--space-2) 0;
}
.faith-guides-disclosure {
  margin-top: var(--space-4);
}
.faith-guides-summary {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  cursor: pointer;
  list-style: none;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
}
.faith-guides-summary::-webkit-details-marker { display: none; }
.faith-guides-label {
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  flex: 1;
}
.faith-guides-count {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  background: var(--color-surface-hover);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}
.faith-guides-chevron {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform 0.2s var(--ease-out);
}
.faith-guides-disclosure[open] .faith-guides-chevron {
  transform: rotate(180deg);
}
.faith-guides-body {
  padding: var(--space-2) 0 var(--space-4);
}
html[data-theme="dark"] .faith-guides-count {
  background: var(--color-surface);
}
```

**Test checklist:**
- [ ] 2×2 library grid renders with 4 cards: Explore, Catechism, Bible, Baltimore
- [ ] Section title "Catholic Library" visible without disclosure toggle
- [ ] Each card opens correct reader module
- [ ] Faith Guides moved below library grid, behind disclosure
- [ ] Guide count badge shows correct number
- [ ] Cards have distinct visual treatment from prayer tools (square icon, not round)
- [ ] Touch targets ≥ 44×44pt on all cards
- [ ] Dark mode renders correctly
- [ ] Library teaser (dashed placeholder) completely removed

---

### PMV-06 — Zone Seam and Visual Rhythm

**What:** Ensure zone seams between Today → Pray → Study provide clear visual separation, and remove the orphaned library teaser element.

**Before:** Zone seam between Practice and Go Deeper has a library teaser wedged between them. The `#libraryTeaser` div contains a dashed-border placeholder card.

**After:** Clean zone seam between Pray and Study. No more library teaser. The existing `.more-zone-seam` pattern continues.

**HTML cleanup in `index.html`:**
```
Remove: <div id="libraryTeaser"></div>
Remove: The entire <details class="more-zone more-zone--deeper" id="deeperZone"> ... </details>
Replace with: The new #studyZone structure from PMV-05
```

**JS cleanup in `more.js`:**
- Remove the `#libraryTeaser` rendering block (~lines 1083-1097)
- Remove the `#deeperZone` open/close memory logic (~lines 1174-1186)
- Replace `#deeperCount` badge logic with `#guidesCount` targeting

**Test checklist:**
- [ ] No dashed library teaser visible
- [ ] Clean zone seam between Pray and Study
- [ ] No console errors for missing DOM elements
- [ ] Scroll length is reasonable (not too long)

---

### PMV-07 — Contextual Promotion Simplification

**What:** Simplify the contextual promotion system. Currently it manages a "4th primary slot" dynamic, which is no longer needed since the guided grid is fixed at 4 cards. Contextual promotion now only affects visual emphasis (accent colors, active subtitles) rather than card placement.

**Before:** `_resolveCardTiers()` manages sticky vs dynamic vs secondary with a promoted 4th slot.

**After:** Replace `_resolveCardTiers()` with a simpler `_getContextualState()` that returns promotion flags:
```js
function _getContextualState() {
  var state = {
    stationsAccent: isLentSeason(),
    chapletActive: _getChapletSubtitle() === 'The Hour of Mercy',
    novenaActive: false,
    novenaLabel: _getNovenaSubtitle(),
    ffActive: false,
    ffLabel: ''
  };

  // Novena detection
  var novSub = state.novenaLabel;
  state.novenaActive = novSub.indexOf('Day') === 0 || novSub.indexOf('in progress') !== -1;

  // Seasonal novena override
  // [existing seasonal novena detection logic]

  // First Friday/Saturday
  var ffSub = _getFirstFridaySubtitle();
  state.ffActive = ffSub.active;
  state.ffLabel = ffSub.text;

  return state;
}
```

This simplifies the rendering code significantly — each section (guided grid, prayer book, practice strip) reads from the context state independently.

**Test checklist:**
- [ ] Lent: Stations card gets accent color treatment
- [ ] 3 PM: Chaplet subtitle shows "The Hour of Mercy" in green
- [ ] Active novena: Novenas practice card shows active state
- [ ] Near First Friday: FF practice card shows active state
- [ ] Seasonal novena: Novenas practice card shows seasonal label
- [ ] No "4th slot" behavior — all 4 guided cards always visible

---

## Implementation Sequence

**Recommended order (minimize merge conflicts):**

1. **PMV-01** (Daily Formation move) — HTML-only, no cascading risk
2. **PMV-06** (Cleanup library teaser + deeper zone) — removes old structure
3. **PMV-05** (Catholic Library section) — builds new Study zone
4. **PMV-02** (Guided Prayer grid) — restructures Zone 2 grid
5. **PMV-03** (Prayer Book gateway) — adds new card format
6. **PMV-04** (Practice strip) — replaces secondary tools
7. **PMV-07** (Promotion simplification) — refactors JS, cleanest last

Items 2–5 can be batched into one commit if the implementer prefers.

---

## Cascading Impact Analysis

| Module | Impact | Notes |
|--------|--------|-------|
| `src/more.js` | **Heavy** | Restructured rendering for all 3 sections; `_resolveCardTiers()` replaced |
| `css/app.css` | **Heavy** | New CSS classes for gateway, practice strip, library grid. Some existing `.prayer-tool-*` classes can be retired |
| `index.html` | **Medium** | DOM restructure: move dailyFormation, remove libraryTeaser, replace deeperZone with studyZone |
| `src/app.js` | **Light** | `_renderDailyFormation()` targets element by ID — DOM move is transparent. Verify render timing. |
| `src/devotions.js` | **None** | Still renders into `#devotionalCards`, which moves inside the new Study zone |
| `src/prayerbook.js` | **None** | Opens via `openPrayerBook()` — entry point is the same |
| `src/novena.js` | **None** | Opens via `openNovena()` — entry point is the same |
| All prayer modules | **None** | All use `reader.readerOpen()` — agnostic to More tab layout |

---

## CSS Classes to Retire After Implementation

After PMV is fully implemented, these classes are dead:
- `.prayer-tool-card--secondary` (replaced by `.practice-card`)
- `.prayer-tools-secondary` (replaced by `.practice-strip`)
- `.prayer-tools-more` / `.prayer-tools-more-toggle` / `.prayer-tools-more-chevron` (removed — no more "More tools" accordion)
- `.library-teaser` (replaced by `.library-grid` / `.library-card`)
- `.more-zone--deeper` / `.more-zone-deeper-toggle` / `.more-zone-deeper-count` / `.more-zone-deeper-chevron` / `.more-zone-deeper-body` (replaced by `.more-zone--study` / `.faith-guides-*`)

Do NOT remove these during implementation — mark them with `/* PMV: retire after v2 stable */` and clean up in a follow-up dead CSS pass.

---

## Visual Summary

```
┌─────────────────────────────────────┐
│ ▣ TODAY                             │
│   Saint of the Day                  │
│   Seasonal Moment                   │
│   Today's Readings                  │
│   Daily Formation (Q&A + Summa)  ← NEW POSITION
│                                     │
├─── zone seam ───────────────────────┤
│                                     │
│ GUIDED PRAYER                       │
│ ┌──────────┐ ┌──────────┐          │
│ │ ◎ Rosary │ │ ✦ Chaplet│          │
│ │ Glorious │ │ On beads │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ ♡ Exam   │ │ ✝ Stat.  │          │
│ │ Prepare  │ │ 14 stns  │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 📖 Prayer Book            ›  │   │  ← GATEWAY CARD
│ │    31 prayers · 2 litanies    │   │
│ └───────────────────────────────┘   │
│                                     │
│ YOUR PRACTICE                       │
│ ┌──────────────┐┌──────────────┐   │  ← COMPACT STRIP
│ │ 🕯 Novenas   ││ ○○ First Fri ││  │
│ │ Day 5 of 9   ││ 7 of 9       ││  │
│ └──────────────┘└──────────────┘   │
│                                     │
├─── zone seam ───────────────────────┤
│                                     │
│ CATHOLIC LIBRARY                    │
│ ┌──────────┐ ┌──────────┐          │
│ │ ⊕ Explore│ │ ✚ CCC    │          │  ← NEW VISIBLE SECTION
│ │ Cross-ref│ │ 2,865 §§ │          │
│ └──────────┘ └──────────┘          │
│ ┌──────────┐ ┌──────────┐          │
│ │ 📖 Bible │ │ ? Baltim.│          │
│ │ DRB+CPDV │ │ Q&A      │          │
│ └──────────┘ └──────────┘          │
│                                     │
│ ▸ Faith Guides (6 guides)       ▾  │  ← DISCLOSURE
│                                     │
└─────────────────────────────────────┘
```
