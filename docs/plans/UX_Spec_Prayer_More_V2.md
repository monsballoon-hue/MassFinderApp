# UX Spec: Prayer & More Tab V2 Restructure (Amended)

**Prefix:** PMV (Prayer/More V2)
**Created:** 2026-03-15 · **Amended:** 2026-03-15
**Status:** Ready for implementation
**Scope:** More tab Zone 2 restructure + Zone 3 surfacing
**Files affected:** `src/more.js`, `css/app.css`, `index.html`

---

## Amendment Notes

- **PMV-01 DROPPED.** Daily Formation (Baltimore Q&A + Summa) stays in its current position. Baltimore and Summa content is deferred to a future spec.
- **PMV-05 REVISED.** Catholic Library is CCC + Bible only. Explore module is deferred — not ready to surface. Baltimore Catechism and Summa are deferred content.
- **Persona walkthroughs expanded** per review feedback — every spec item traces the full journey for all three demographics.

---

## Content Inventory (In-Scope)

| Content | Type | Engagement model | Time |
|---|---|---|---|
| Guided Rosary | Immersive prayer | Step-through, wake lock, bead tracker | 15-25 min |
| Divine Mercy Chaplet | Immersive prayer | Step-through, wake lock, bead tracker | 8-12 min |
| Stations of the Cross | Immersive prayer | 14 stations, step-through | 15-20 min |
| Examination of Conscience | Guided preparation | Section flow, confessional summary | 10-15 min |
| Prayer Book | Reference collection | Browse/search, expand, read, close | 10 sec-3 min |
| Novena Tracker | Accountability | Daily check-in, 9 active trackers | 30 sec |
| First Friday & Saturday | Accountability | Monthly check-in, streak tracking | 30 sec |
| Catechism (CCC) | Deep study | 2,865 paragraphs, cross-refs, search | 2-30 min |
| Sacred Scripture (Bible) | Deep study | DRB + CPDV, 73 books, per-book lazy load | 2-30 min |
| Faith Guides | Seasonal reference | 6+ expandable guides | 1-5 min |

---

## Persona Journeys: Current State Problems

### Dorothy, 72 — Daily Mass attendee, bifocals, arthritic fingers

**Goal:** Pray the Rosary before bed.

**Current journey:**
1. Taps More tab. Sees the warm Today zone (saint card, readings). Good.
2. Scrolls past Today zone, past the zone seam.
3. Sees "Prayer & Devotion" header with a 2x2 grid of four cards below it.
4. Each card has a 36x36px icon, a title at --text-sm (15px), and a subtitle at --text-xs (13px). With bifocals, the subtitles are marginally legible.
5. Rosary is in the top-right of the 2x2 grid. She taps it. This works.
6. But tomorrow she wants the Stations of the Cross. She scrolls down and sees "More tools" — a 36px-tall toggle in --text-xs (13px) with a tiny chevron. She does not notice it. She thinks the app only has 4 prayer tools. Stations, Novena Tracker, and First Friday are invisible to her.
7. She has never seen the CCC or Bible because they are behind a collapsed "Grow in Faith" details toggle with a generic label and no preview of content.

**Key failures:** (a) Secondary tools invisible at her text size. (b) "More tools" toggle is 13px text, below her reading threshold. (c) CCC and Bible completely hidden. (d) All 4 primary cards look identical — no signal that Rosary is a 20-minute meditation while Prayer Book is a reference lookup.

### Marcus, 25 — Returned to faith 6 months ago, iPhone native, expects polish

**Goal:** Discover what the app offers beyond finding Mass times.

**Current journey:**
1. Taps More tab for the first time after a week of using Find/Saved.
2. Saint card, readings — nice. Scrolls past them quickly.
3. Sees "Prayer & Devotion" with 4 cards. Thinks: "OK, four prayer things."
4. Notices "More tools" toggle, expands it. Sees 3 tiny cards in a 3-column grid at 13px text. The layout feels like overflow.
5. Below that, a dashed-border card says "Catholic Library — Bible, Catechism & Catholic classics — coming soon." He thinks: "They don't have a Bible or Catechism yet." This is wrong — both are fully built. The teaser actively misleads him.
6. "Grow in Faith" is collapsed. He might tap it, might not.
7. He never discovers that the app contains a full searchable Catechism (2,865 paragraphs) or a complete Bible (DRB + CPDV).

**Key failures:** (a) Library teaser says "coming soon" for features that exist. (b) CCC and Bible have zero entry points from the More tab. (c) The 3-column secondary grid reads as "junk drawer." (d) No progressive disclosure signal for the app's depth.

### Sarah, 45 — One-handed use, needs a specific answer fast

**Goal 1:** Pray the Rosary during her lunch break (20 minutes).
**Goal 2:** Look up what the Memorare says (her daughter is doing a project).

**Journey for Goal 1:** Taps More, scans 2x2 grid, spots Rosary, taps. 3 seconds. Acceptable.

**Journey for Goal 2:** Taps More, scans 2x2 grid. Sees "Prayer Book" in top-left. Also sees "Guided Rosary," "Examination of Conscience," and "Divine Mercy Chaplet." All look identical. She taps Prayer Book, waits through 2.5-second sacred pause, then searches "Memorare." Total time: 10 seconds. Could be 5 without the sacred pause and with a clearer "this is the reference tool" signal.

**Journey for a CCC reference from a podcast:** She heard "CCC 1324." Opens More tab. There is no CCC entry point visible. She closes the app and Googles it.

**Key failures:** (a) No cognitive shortcut between "reference lookup" and "immersive prayer." (b) CCC has no visible entry point. (c) Sacred pause on Prayer Book adds friction to utility lookups.

---

## V2 Zone Architecture

### Current
```
Zone 1: TODAY (saint, seasonal, readings)
Zone 2: PRAYER & DEVOTION
  - 2x2 grid: Prayer Book | Rosary | Examination | [dynamic 4th]
  - "More tools" accordion: Stations | Novena | First Friday
  - Daily Formation
Zone 3: GROW IN FAITH (hidden behind details)
  - Devotional guides
Library teaser (dashed "coming soon" placeholder)
```

### V2
```
Zone 1: TODAY (unchanged)
  --- zone seam ---
Zone 2: PRAY
  - Guided Prayer (2x2 grid): Rosary | Chaplet | Stations | Examination
  - Prayer Book (full-width gateway card)
  - Your Practice (compact strip): Novena | First Friday
  - Daily Formation (stays as-is)
  --- zone seam ---
Zone 3: STUDY (replaces hidden "Grow in Faith")
  - Catholic Library (2 cards): Catechism | Sacred Scripture
  - Faith Guides (disclosure accordion)
```

---

## Spec Items

### PMV-02 — Guided Prayer Grid: The "I Want to Pray" Experience

**What:** The primary 2x2 grid contains exactly four immersive guided prayer experiences: Rosary, Divine Mercy Chaplet, Examination of Conscience, and Stations of the Cross. Fixed composition — no dynamic slot rotation.

**Section title:** Change "Prayer & Devotion" to "Guided Prayer"

**Dorothy:** Scrolls past Today zone. Sees "Guided Prayer" — clear heading. Below it, four cards in a 2x2 grid. The grid is always the same four cards in the same positions — she builds spatial memory. Rosary is always top-left. She taps it without reading after 3 visits.

**Marcus:** Sees 4 guided experiences. The title "Guided Prayer" tells him these are interactive, not just text. Subtitles tell him what is happening today: "Sorrowful Mysteries today" (Rosary), "The Hour of Mercy" at 3 PM (Chaplet), "Lenten devotion" (Stations during Lent). He taps the Chaplet because the subtitle caught his eye. He discovers a beautiful step-through experience with bead tracking.

**Sarah:** She needs to pray the Rosary in 20 minutes. She sees 4 cards, spots Rosary, taps. 3 seconds from tab switch to prayer start. She is not choosing between a Rosary and looking up the Hail Mary — those are different activities served by different sections.

**JS changes in more.js:**

Replace STICKY_IDS with:
```js
var GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true };
```

Grid order is fixed: row 1 = Rosary, Chaplet; row 2 = Examination, Stations.

**CSS:**
```css
.more-section-title--pray {
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  letter-spacing: 0;
}
.prayer-tool-card--primary { min-height: 88px; }
```

**Promotion rules (visual only, no position changes):**
- Lent: Stations card gets --color-accent icon treatment
- 3 PM: Chaplet subtitle turns green ("The Hour of Mercy")
- Active confession < 7 days: Examination subtitle turns green
- All promotions are color changes, never position changes

**Test checklist:**
- [ ] 2x2 grid: Rosary (top-left), Chaplet (top-right), Examination (bottom-left), Stations (bottom-right)
- [ ] Section title reads "Guided Prayer"
- [ ] Grid order never changes regardless of promotions
- [ ] Lent: Stations icon uses --color-accent / --color-accent-pale
- [ ] 3 PM: Chaplet subtitle shows "The Hour of Mercy" with active styling
- [ ] Each card opens correct reader module with sacred pause
- [ ] Touch targets >= 44x44pt on all four cards (min-height 88px)
- [ ] Dark mode renders correctly
- [ ] Grid does not overflow on 320px (iPhone SE) viewport

---

### PMV-03 — Prayer Book Gateway: The "I Need the Words" Card

**What:** Below the guided grid, a full-width card provides the entry point to the Prayer Book. Its distinct shape (wide instead of square) and descriptive subtitle signal "collection of content you browse" rather than "one tool you open."

**Dorothy:** Scrolls past the guided grid. Sees a wider card with a book icon, "Prayer Book" in bold, and "31 prayers - Guided litanies - Lectio Divina" as a subtitle. A chevron tells her it opens something. She taps it. The Prayer Book list opens — no sacred pause (PBR-01). She finds the Guardian Angel Prayer in 5 seconds. The card looks different from the grid above — different shape = different purpose. The subtitle tells her this has 31 things inside.

**Marcus:** Reads "31 prayers - Guided litanies - Lectio Divina." He thinks: "Wait, there are litanies? And Lectio Divina?" He taps it, discovers a searchable prayer collection and the Lectio Divina step-through tied to today's Gospel. The subtitle sold it — three phrases cover three discovery hooks.

**Sarah:** Needs the Grace Before Meals text. The wide card below the guided grid reads as "the reference section" — different shape from the prayer tools above. She taps it, types "grace" in search, and has the 22-word prayer in 4 seconds. No confusion with the meditation tools.

**CSS:**
```css
.prayerbook-gateway {
  display: flex; align-items: center; gap: var(--space-3);
  padding: var(--space-3) var(--space-4); margin-top: var(--space-3);
  background: var(--color-surface); border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-sacred); border-radius: var(--radius-md);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  min-height: 56px; transition: box-shadow 0.15s, transform 0.15s;
}
.prayerbook-gateway:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
.prayerbook-gateway:active { transform: scale(0.98); }
.prayerbook-gateway-icon {
  width: 40px; height: 40px; border-radius: 50%;
  background: var(--color-sacred-pale); color: var(--color-sacred);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.prayerbook-gateway-icon svg { width: 22px; height: 22px; }
.prayerbook-gateway-body { flex: 1; min-width: 0; }
.prayerbook-gateway-title {
  font-size: var(--text-base); font-weight: var(--weight-semibold);
  color: var(--color-text-primary); line-height: 1.3;
}
.prayerbook-gateway-subtitle {
  font-size: var(--text-sm); color: var(--color-text-secondary);
  margin-top: 2px; line-height: 1.3;
}
.prayerbook-gateway-chevron { width: 16px; height: 16px; color: var(--color-text-tertiary); flex-shrink: 0; }
html[data-theme="dark"] .prayerbook-gateway { border-left-color: var(--color-sacred); background: var(--color-surface); }
```

**HTML:** Add after #prayerToolsGrid:
```html
<div id="prayerBookGateway"></div>
```

**JS rendering:**
```js
var pbGateway = document.getElementById('prayerBookGateway');
if (pbGateway) {
  pbGateway.innerHTML = '<div class="prayerbook-gateway" onclick="openPrayerBook()" role="button" tabindex="0">'
    + '<div class="prayerbook-gateway-icon">' + ptIcons.prayerbook + '</div>'
    + '<div class="prayerbook-gateway-body">'
    + '<div class="prayerbook-gateway-title">Prayer Book</div>'
    + '<div class="prayerbook-gateway-subtitle">31 prayers &#183; Guided litanies &#183; Lectio Divina</div>'
    + '</div>'
    + '<svg class="prayerbook-gateway-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>'
    + '</div>';
}
```

**Test checklist:**
- [ ] Full-width card renders below the 2x2 guided grid
- [ ] Visually distinct from grid cards — full width, left border accent, chevron
- [ ] Subtitle: "31 prayers - Guided litanies - Lectio Divina"
- [ ] Opens Prayer Book reader on tap (no sacred pause — PBR-01)
- [ ] Touch target >= 44pt (min-height 56px)
- [ ] Dark mode renders correctly
- [ ] Desktop: hover shadow + lift

---

### PMV-04 — Your Practice: The Tracking Companions

**What:** Below the Prayer Book gateway, a compact "Your Practice" strip shows the two accountability tools: Novena Tracker and First Friday & Saturday.

**Dorothy:** Has been praying the Surrender Novena for 5 days. Scrolls past the guided grid and Prayer Book card. Sees "Your Practice" label with two compact cards. Left card says "Novenas" with "Day 5 of 9" in green text. She taps it. The active green color drew her eye — she did not have to hunt for it. When nothing is active, the strip recedes with muted colors.

**Marcus:** Does not use novenas yet. Sees "Novenas — Guided prayer tracking" and "First Fri & Sat — Track devotion." The labels tell him what these are. He taps Novenas, discovers 9 available, and starts the Surrender Novena. Next visit, the strip shows "Day 1 of 9" in green — he remembers to continue.

**Sarah:** Has no active novena and no First Friday streak. The practice strip is muted — neutral colors. She scrolls past in half a second. It does not demand attention or add cognitive load. When she eventually starts a novena after Easter, the active state surfaces naturally.

**CSS:**
```css
.practice-strip-label {
  font-size: var(--text-xs); font-weight: var(--weight-medium);
  color: var(--color-text-tertiary); text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: var(--space-2); margin-top: var(--space-4);
}
.practice-strip { display: flex; gap: var(--space-2); }
.practice-card {
  flex: 1; display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-2) var(--space-3); background: var(--color-surface-hover);
  border-radius: var(--radius-md); cursor: pointer;
  -webkit-tap-highlight-color: transparent; min-height: 48px; transition: background 0.15s;
}
.practice-card:active { background: var(--color-border-light); }
.practice-card-icon {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--color-surface); color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.practice-card-icon svg { width: 14px; height: 14px; }
.practice-card--active .practice-card-icon { background: var(--color-sacred-pale); color: var(--color-sacred); }
.practice-card-body { flex: 1; min-width: 0; }
.practice-card-title { font-size: var(--text-sm); font-weight: var(--weight-medium); color: var(--color-text-primary); line-height: 1.2; }
.practice-card-subtitle { font-size: var(--text-xs); color: var(--color-text-secondary); line-height: 1.3; margin-top: 1px; }
.practice-card--active .practice-card-subtitle { color: var(--color-verified); font-weight: var(--weight-medium); }
html[data-theme="dark"] .practice-card { background: var(--color-surface); }
html[data-theme="dark"] .practice-card:active { background: var(--color-surface-hover); }
html[data-theme="dark"] .practice-card-icon { background: var(--color-surface-hover); }
```

**HTML:** Replace #prayerToolsSecondaryWrap with:
```html
<div id="practiceStrip"></div>
```

**Test checklist:**
- [ ] Two cards side by side: Novenas and First Friday
- [ ] "Your Practice" uppercase label above strip
- [ ] Active novena: green subtitle, sacred icon
- [ ] Active FF streak: green subtitle, sacred icon
- [ ] Inactive: muted text, neutral icon
- [ ] Subtitles always visible and readable at --text-xs
- [ ] Touch targets >= 44pt (min-height 48px)
- [ ] Dark mode renders correctly
- [ ] Both cards open correct reader modules

---

### PMV-05 — Catholic Library: Surfacing CCC and Bible

**What:** Replace the dashed "coming soon" library teaser and the hidden "Grow in Faith" details wrapper with a visible "Catholic Library" section. Two cards side by side: Catechism (CCC) and Sacred Scripture (Bible).

**Why this matters:** The app contains a fully searchable Catechism (2,865 paragraphs with cross-references, section context, accent blockquotes, crossfade navigation) and a complete Bible (DRB + CPDV, per-book lazy loading, 73 books). These features transform MassFinder from "Mass finder + prayer tools" into "comprehensive Catholic spiritual companion." But right now there is no way to access them from the More tab. The library teaser says "coming soon" — which is false.

**Dorothy:** Her priest quotes CCC 1324 in his homily. She opens the More tab, scrolls past the prayer tools, sees "Catholic Library" with two cards: Catechism and Sacred Scripture. She taps Catechism. The CCC reader opens. She navigates to 1324 and reads it. The card says "Catechism" with "2,865 paragraphs of Catholic teaching" as context. She knows exactly what she is getting.

**Marcus:** Scrolls past the prayer zone. Sees "Catholic Library" — two cards with subtle book-themed icons (not the prayer-sacred color scheme). He taps "Sacred Scripture" and discovers the app has a full DRB + CPDV Bible. Then he taps "Catechism" and finds paragraph 1 with a search function. He tells his RCIA group: "This app has everything."

**Sarah:** Heard a CCC reference on a podcast (1324). Opens the app, scrolls past prayer tools, sees "Catholic Library," taps "Catechism," searches 1324. Found. 10 seconds. Previously impossible.

**Visual distinction from prayer tools:** Library cards use border-radius: var(--radius-sm) (square-ish) icons with --color-surface-hover / --color-text-secondary coloring. Prayer tools use border-radius: 50% (circular) icons with --color-sacred-pale / --color-sacred coloring. This subtle shape+color difference signals "study mode" vs "prayer mode" without explanation.

**HTML:** Replace #libraryTeaser and #deeperZone with:
```html
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

**Library card SVG icons:**
```js
var libIcons = {
  catechism: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="12" y1="6" x2="12" y2="14"/><line x1="8" y1="10" x2="16" y2="10"/></svg>',
  bible: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>'
};
```

**CSS:**
```css
.more-zone--study { padding: var(--space-2) 0; }
.library-section { margin-bottom: var(--space-2); }
.library-section-title {
  font-family: var(--font-body); font-weight: var(--weight-semibold);
  color: var(--color-text-primary); font-size: var(--text-base);
  letter-spacing: 0; margin-bottom: var(--space-3);
}
.library-grid { display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); }
.library-card {
  display: flex; flex-direction: column; gap: var(--space-2);
  padding: var(--space-3); background: var(--color-surface);
  border: 1px solid var(--color-border-light); border-radius: var(--radius-md);
  cursor: pointer; -webkit-tap-highlight-color: transparent;
  min-height: 80px; transition: box-shadow 0.15s, transform 0.15s;
}
.library-card:hover { box-shadow: var(--shadow-card-hover); transform: translateY(-1px); }
.library-card:active { transform: scale(0.98); }
.library-card-icon {
  width: 36px; height: 36px; border-radius: var(--radius-sm);
  background: var(--color-surface-hover); color: var(--color-text-secondary);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.library-card-icon svg { width: 20px; height: 20px; }
.library-card-title { font-size: var(--text-sm); font-weight: var(--weight-semibold); color: var(--color-text-primary); line-height: 1.3; }
.library-card-desc { font-size: var(--text-xs); color: var(--color-text-tertiary); line-height: 1.3; }
html[data-theme="dark"] .library-card-icon { background: var(--color-surface); }

.faith-guides-disclosure { margin-top: var(--space-4); }
.faith-guides-summary {
  display: flex; align-items: center; gap: var(--space-2);
  padding: var(--space-3) 0; cursor: pointer; list-style: none;
  -webkit-tap-highlight-color: transparent; min-height: 48px;
}
.faith-guides-summary::-webkit-details-marker { display: none; }
.faith-guides-label { font-family: var(--font-body); font-weight: var(--weight-semibold); color: var(--color-text-secondary); font-size: var(--text-sm); flex: 1; }
.faith-guides-count { font-size: var(--text-xs); font-weight: var(--weight-medium); color: var(--color-text-tertiary); background: var(--color-surface-hover); padding: 2px var(--space-2); border-radius: var(--radius-full); }
.faith-guides-chevron { width: 18px; height: 18px; color: var(--color-text-tertiary); flex-shrink: 0; transition: transform 0.2s var(--ease-out); }
.faith-guides-disclosure[open] .faith-guides-chevron { transform: rotate(180deg); }
.faith-guides-body { padding: var(--space-2) 0 var(--space-4); }
html[data-theme="dark"] .faith-guides-count { background: var(--color-surface); }
```

**Test checklist:**
- [ ] 2 library cards side by side: Catechism and Sacred Scripture
- [ ] Section title "Catholic Library" visible without any disclosure toggle
- [ ] Library card icons are SQUARE radius with NEUTRAL colors (distinct from prayer tools)
- [ ] Catechism card opens CCC reader via openCCC('1')
- [ ] Bible card opens Bible reader via openBible()
- [ ] "Coming soon" library teaser completely removed
- [ ] Faith Guides below library, behind disclosure toggle
- [ ] Guide count badge shows correct number
- [ ] Touch targets >= 44pt (min-height 80px)
- [ ] Dark mode renders correctly

---

### PMV-06 — Zone Seam and Visual Rhythm Cleanup

**What:** Clean zone seams between Today, Pray, and Study. Remove orphaned elements.

**Dorothy's full-scroll journey:** She sees three visual blocks separated by thin seams. Today zone (warm background): "today's briefing." Pray zone (neutral): "my prayer life." Study zone (neutral): "learning resources." Three zones, three purposes, found by scrolling to the right third of the page.

**Marcus's full-scroll journey:** He processes the page in 2 seconds on first visit. Three visual zones separated by seams. Daily stuff, prayer stuff, reference stuff. Matches Apple Health (Summary, Trends, Browse) mental model.

**Sarah's full-scroll journey:** One question: "Where is X?" Three zones = three places to look. Daily content at top. Prayer tools in middle. Reference at bottom. She finds anything in one scroll gesture.

**HTML cleanup:**
- Remove `<div id="libraryTeaser"></div>` entirely
- Remove the entire `<details class="more-zone more-zone--deeper" id="deeperZone">...</details>`
- Add zone seam before study zone
- Add #studyZone structure from PMV-05

**JS cleanup in more.js:**
- Remove #libraryTeaser rendering block
- Remove #deeperZone open/close memory logic + #deeperCount badge logic
- Replace with #faithGuidesToggle open/close memory + #guidesCount targeting
- Devotional guide rendering continues to target #devotionalCards (now inside #faithGuidesToggle)

**Test checklist:**
- [ ] No dashed "coming soon" library teaser anywhere
- [ ] Clean zone seam between Pray and Study
- [ ] Devotional guides render inside faith guides disclosure
- [ ] Faith guides toggle remembers open/closed state via localStorage
- [ ] No console errors from missing DOM elements
- [ ] Total scroll length on iPhone SE is reasonable

---

### PMV-07 — Contextual Promotion Simplification

**What:** Replace _resolveCardTiers() with a simpler contextual state reader. Promotions are visual emphasis only — they never change card positions or composition.

**Why position stability matters for all three personas:** Dorothy taps the top-left card for the Rosary every night. If one day the Chaplet swaps into that position because it is 3 PM, she is confused. Marcus expects the grid to look the same each visit. Sarah wants the Rosary to be where it was yesterday. No card ever moves, appears, or disappears based on context.

```js
function _getContextualState() {
  var ctx = {};
  ctx.stationsLent = isLentSeason();
  ctx.chapletHourOfMercy = false;
  var nowH = new Date().getHours();
  var nowM = new Date().getMinutes();
  if ((nowH === 14 && nowM >= 30) || nowH === 15) ctx.chapletHourOfMercy = true;
  var confStatus = require('./examination.js').getConfessionStatus();
  ctx.examRecent = confStatus && confStatus.daysAgo <= 7;
  ctx.examNudge = confStatus && confStatus.daysAgo > 30;
  ctx.novenaLabel = _getNovenaSubtitle();
  ctx.novenaActive = ctx.novenaLabel.indexOf('Day') === 0 || ctx.novenaLabel.indexOf('in progress') !== -1;
  // Seasonal novena override logic stays here
  var ffSub = _getFirstFridaySubtitle();
  ctx.ffLabel = ffSub.text;
  ctx.ffActive = ffSub.active;
  return ctx;
}
```

**Test checklist:**
- [ ] Grid always: Rosary (top-left), Chaplet (top-right), Exam (bottom-left), Stations (bottom-right)
- [ ] Lent: Stations icon accent color. No position change.
- [ ] 3 PM: Chaplet subtitle green. No position change.
- [ ] Recent confession: Exam subtitle green. No position change.
- [ ] Active novena: Novenas practice card green. No grid change.
- [ ] Seasonal novena label overrides default subtitle.
- [ ] Near First Friday: FF practice card green. No grid change.

---

## Implementation Sequence

1. PMV-06 — Remove library teaser + deeper zone. Add study zone HTML.
2. PMV-05 — Build library grid (CCC + Bible) and faith guides disclosure.
3. PMV-02 — Restructure prayer grid to fixed 4-card guided set.
4. PMV-03 — Add Prayer Book gateway card.
5. PMV-04 — Replace secondary tools accordion with practice strip.
6. PMV-07 — Replace _resolveCardTiers() with _getContextualState().

---

## CSS Classes to Retire (mark, do not delete)

Mark with `/* PMV: retire after v2 stable */`:
- .prayer-tool-card--secondary
- .prayer-tools-secondary
- .prayer-tools-more / .prayer-tools-more-toggle / .prayer-tools-more-chevron
- .library-teaser
- .more-zone--deeper / .more-zone-deeper-toggle / .more-zone-deeper-count / .more-zone-deeper-chevron / .more-zone-deeper-body

---

## Visual Summary

```
+-------------------------------------+
| TODAY (warm sacred background)       |
|   Saint of the Day                   |
|   Seasonal Moment                    |
|   Today's Readings                   |
+--- zone seam -----------------------+
|                                      |
| GUIDED PRAYER                        |
| +----------+ +----------+           |
| | (o) Rosa | | (*) Chap |           |
| | Glorious | | On beads |           |
| +----------+ +----------+           |
| +----------+ +----------+           |
| | (<3) Exam| | (+) Stat |           |
| | Prepare  | | Lenten   |           |
| +----------+ +----------+           |
|                                      |
| +-------------------------------+    |
| | [book] Prayer Book         >  |    |
| |   31 prayers - Litanies - LD  |    |
| +-------------------------------+    |
|                                      |
| YOUR PRACTICE                        |
| +--------------++--------------+     |
| | Novenas      || First Fri    |     |
| | Day 5 of 9   || 7 of 9      |     |
| +--------------++--------------+     |
|                                      |
| [Daily Formation stays as-is]        |
+--- zone seam -----------------------+
|                                      |
| CATHOLIC LIBRARY                     |
| +----------+ +----------+           |
| | [=] CCC  | | [=] Bible|           |
| | 2,865 pp | | DRB+CPDV |           |
| +----------+ +----------+           |
|                                      |
| > Faith Guides (6 guides)        v  |
+-------------------------------------+

Icon shape key:
  (o) (<3) (*) (+) = ROUND, sacred colors (prayer)
  [=] [=] = SQUARE-RADIUS, neutral colors (library)
```
