# UX Spec: More Tab Content Restructure (MTR series)

**Created:** 2026-03-15
**Status:** Implemented
**Backlog items:** New (content architecture — not from existing backlog)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_MTR.md
**Depends on:** SOT, PMG, PMB, PMD (all implemented)

| ID | Title | Status |
|----|-------|--------|
| MTR-01 | Zone Container Architecture | done |
| MTR-02 | Section Title Typography Differentiation | done |
| MTR-03 | Secondary Prayer Tools Progressive Disclosure | done |
| MTR-04 | Reading Entries Compact Mode | done |
| MTR-05 | Library Teaser Repositioned | done |
| MTR-06 | Zone 1 Internal Spacing Refinement | done |
| MTR-07 | Devotional Guide Count When Collapsed | done |

---

## Problem Statement

The More tab has grown from ~5 sections to **10 content zones with 20+ interactive elements** across 3 spec waves (SOT, PMG, PMB/PMD). Every section uses the same visual DNA:

- Same `more-section` container with `border-bottom: 1px solid var(--color-border-light)`
- Same `--font-display` at `--text-base` section titles
- Same `var(--color-surface)` card background with `var(--radius-md)` corners
- Same `<details>` accordion pattern for both seasonal moments AND devotional guides

**Result:** A uniform wall of cards that doesn't signal editorial hierarchy, doesn't communicate "what matters right now" vs "reference material," and doesn't let users build spatial memory of where things live.

### Impact by persona

**72-year-old parishioner:** Scrolls past Today's Readings looking for the Rosary. Everything looks the same. Gives up, goes back to Find tab. "Too much stuff on that page."

**25-year-old phone-native:** Opens More tab, sees it requires 4+ scrolls to reach the bottom. Nothing signals what's new or contextual vs static. "This feels like a settings dump."

**45-year-old parent (one-handed, in a hurry):** Needs today's readings reference. Can't tell at a glance where they are vs the prayer tools vs the faith guides. "I just need the reading for Mass, where is it?"

---

## Architecture: Three Zones

The More tab content falls naturally into three intent-based zones. The fix is to make these zones **visually distinct** so users build spatial memory.

### Zone 1 — "Today" (the daily briefing)
**What changes daily.** Saint card → Seasonal Moment → Today's Readings.
Users come here to answer: "What is the Church doing today?"

### Zone 2 — "Practice" (prayer tools)
**What you can do right now.** Prayer & Devotion grid.
Users come here to answer: "I want to pray."

### Zone 3 — "Go Deeper" (reference library)
**What doesn't change day-to-day.** Grow in Faith guides.
Users come here to answer: "I want to learn about X."

### Visual language per zone

| Zone | Background | Separator | Title style | Density |
|------|-----------|-----------|------------|---------|
| Today | Warm tinted surface | Spacing only (no lines) | Sacred styling | Generous padding |
| Practice | Neutral surface, contained island | Internal grid gaps | UI styling | Compact grid |
| Go Deeper | Recessed/flat (--color-bg) | Collapsible | Muted styling | Collapsed by default |

---

## Spec Items

---

### MTR-01: Zone Container Architecture

**Priority:** P1
**Files:** `index.html`, `css/app.css`

#### Problem
All sections use the same `.more-section` class with identical padding and `border-bottom` separators. No visual grouping communicates that Saint card + Seasonal Moment + Readings belong together, or that Grow in Faith is supplementary reference content.

#### User story
- **72yo:** Needs a visual "neighborhood" — "the top part is about today, the middle part is prayers, the bottom part is if I want to read more."
- **25yo:** Expects editorial layout like Apple News or Spotify — zones have different visual weight and density.
- **45yo:** Needs spatial memory — "readings are always at the top in the warm section, prayer buttons are in the middle."

#### Before (index.html ~113-155)
```html
<div class="more-content">
  <div id="hdoBanner"></div>
  <div class="more-section more-section--tight" id="saintSection">…</div>
  <div class="more-section more-section--tight" id="seasonalMoment"></div>
  <div class="more-section" id="readingsSection">…</div>
  <div class="more-section more-section--tight" id="prayerToolsSection">…</div>
  <div id="dailyFormation" class="more-section more-section--tight" style="display:none"></div>
  <div class="more-section">
    <h2 class="more-section-title">Grow in Faith</h2>
    <div id="devotionalCards"></div>
  </div>
  <div id="moreInstallCard"></div>
  <div class="more-footer" id="moreFooter"></div>
</div>
```

#### After (index.html)
```html
<div class="more-content">
  <div id="hdoBanner"></div>

  <!-- ZONE 1: TODAY — the daily briefing -->
  <div class="more-zone more-zone--today">
    <div class="more-section more-section--tight" id="saintSection">…</div>
    <div class="more-section more-section--tight" id="seasonalMoment"></div>
    <div class="more-section more-section--zone-inner" id="readingsSection">
      <h2 class="more-section-title more-section-title--today">Today's Readings</h2>
      <div id="readingsContent"><p class="reading-loading">Loading today's readings…</p></div>
    </div>
  </div>

  <!-- ZONE SEAM -->
  <div class="more-zone-seam" aria-hidden="true"></div>

  <!-- ZONE 2: PRACTICE — prayer tools -->
  <div class="more-zone more-zone--practice">
    <div class="more-section more-section--zone-inner" id="prayerToolsSection">
      <h2 class="more-section-title more-section-title--practice">Prayer &amp; Devotion</h2>
      <div class="prayer-tools-grid" id="prayerToolsGrid"></div>
      <div id="prayerToolsSecondaryWrap"></div>
      <div id="libraryTeaser"></div>
    </div>
    <div id="dailyFormation" class="more-section more-section--tight" style="display:none"></div>
  </div>

  <!-- ZONE SEAM -->
  <div class="more-zone-seam" aria-hidden="true"></div>

  <!-- ZONE 3: GO DEEPER — reference library -->
  <details class="more-zone more-zone--deeper" id="deeperZone">
    <summary class="more-zone-deeper-toggle">
      <h2 class="more-section-title more-section-title--deeper">Grow in Faith</h2>
      <span class="more-zone-deeper-count" id="deeperCount"></span>
      <svg class="more-zone-deeper-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
    </summary>
    <div class="more-zone-deeper-body" id="devotionalCards"></div>
  </details>

  <div id="moreInstallCard"></div>
  <div class="more-footer" id="moreFooter"></div>
</div>
```

#### CSS additions (`css/app.css`)

```css
/* ── Zone containers ── */
.more-zone { margin-bottom: 0; }
.more-zone--today {
  background: var(--color-surface-sacred);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-4) var(--space-5);
  margin-bottom: 0;
  box-shadow: var(--shadow-card);
}
.more-zone--today .more-section { border-bottom: none; padding: var(--space-2) 0; }
.more-zone--today .more-section--zone-inner { padding: var(--space-3) 0 0; }

.more-zone--practice {
  padding: var(--space-2) 0;
}
.more-zone--practice .more-section { border-bottom: none; }
.more-zone--practice .more-section--zone-inner { padding: var(--space-2) 0; }

/* Zone seam — breathing room with micro-ornament */
.more-zone-seam {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5) 0;
}
.more-zone-seam::after {
  content: '';
  width: 40px;
  height: 0;
  border-top: 1px solid var(--color-border-light);
  opacity: 0.5;
}

/* Zone 3: Go Deeper — collapsible reference */
.more-zone--deeper {
  background: transparent;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.more-zone-deeper-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) 0;
  cursor: pointer;
  list-style: none;
  -webkit-tap-highlight-color: transparent;
  min-height: 48px;
}
.more-zone-deeper-toggle::-webkit-details-marker { display: none; }
.more-zone-deeper-toggle .more-section-title { margin-bottom: 0; flex: 1; }
.more-zone-deeper-count {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  background: var(--color-surface-hover);
  padding: 2px var(--space-2);
  border-radius: var(--radius-full);
}
.more-zone-deeper-chevron {
  width: 18px; height: 18px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform 0.2s var(--ease-out);
}
.more-zone--deeper[open] .more-zone-deeper-chevron { transform: rotate(180deg); }
.more-zone-deeper-body { padding: var(--space-2) 0 var(--space-4); }

/* Dark mode */
html[data-theme="dark"] .more-zone--today {
  background: var(--color-surface-sacred);
  box-shadow: var(--shadow-card);
}
html[data-theme="dark"] .more-zone-seam::after { opacity: 0.3; }
html[data-theme="dark"] .more-zone-deeper-count { background: var(--color-surface); }
```

#### CSS modifications (existing rules to update)

**Line ~1494:** `.more-section`
- Before: `padding: var(--space-4) 0; border-bottom: 1px solid var(--color-border-light);`
- After: `padding: var(--space-4) 0; border-bottom: none;`
- Rationale: Zone containers now own separation. Individual sections no longer need `border-bottom`.

**Line ~1493:** `.more-content`
- Before: `padding: var(--space-4) var(--space-4) var(--space-12);`
- After: `padding: var(--space-3) var(--space-4) var(--space-12);`
- Rationale: Slightly tighter top padding since Zone 1 now has its own internal padding.

#### JS changes (`src/more.js`)

In `renderMore()`, after devotional cards render, add zone 3 open/close memory + count badge:

```javascript
// MTR-01: Zone 3 open/close memory
var deeperZone = document.getElementById('deeperZone');
if (deeperZone) {
  var deeperPref = localStorage.getItem('mf-deeper-open');
  // Default: open on first visit, then remember preference
  if (deeperPref === 'false') {
    deeperZone.removeAttribute('open');
  } else {
    deeperZone.setAttribute('open', '');
  }
  deeperZone.addEventListener('toggle', function() {
    localStorage.setItem('mf-deeper-open', deeperZone.open ? 'true' : 'false');
  });

  // Count badge
  var countEl = document.getElementById('deeperCount');
  if (countEl && devotEl) {
    var guideCount = devotEl.querySelectorAll('.devot-card:not(.devot-sub)').length;
    countEl.textContent = guideCount + ' guides';
  }
}
```

#### Test checklist
- [ ] Zone 1 has warm sacred background, saint card + seasonal + readings grouped
- [ ] Zone 2 has neutral background, prayer tools grouped
- [ ] Zone 3 is collapsible, remembers open/close state across sessions
- [ ] Zone seam micro-ornaments visible between zones
- [ ] No `border-bottom` lines on individual sections anymore
- [ ] Dark mode: Zone 1 background uses `--color-surface-sacred`, seam opacity reduced
- [ ] Count badge shows correct guide count
- [ ] 72yo test: visually distinct neighborhoods — can point to "the top section"
- [ ] 25yo test: editorial rhythm, not a dump
- [ ] 45yo test: spatial memory — readings always in warm zone at top

---

### MTR-02: Section Title Typography Differentiation

**Priority:** P2
**Files:** `css/app.css`

#### Problem
Both "Today's Readings" and "Grow in Faith" use the same `.more-section-title` styling: `font-family: var(--font-display); font-size: var(--text-base); font-weight: 700;`. No visual hierarchy between daily content and reference content.

#### Before
```css
.more-section-title { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--color-heading); margin-bottom: var(--space-3); letter-spacing:0.01em; }
```
Single class, one look, every section.

#### After — add modifier classes
```css
/* Base title — keep existing for backward compat */
.more-section-title { font-family: var(--font-display); font-size: var(--text-base); font-weight: 700; color: var(--color-heading); margin-bottom: var(--space-3); letter-spacing:0.01em; }

/* Zone 1: Today — warm, sacred feel */
.more-section-title--today {
  color: var(--color-sacred-text);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

/* Zone 2: Practice — UI, functional */
.more-section-title--practice {
  font-family: var(--font-body);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  font-size: var(--text-base);
  letter-spacing: 0;
}

/* Zone 3: Go Deeper — muted, recessed */
.more-section-title--deeper {
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-semibold);
  letter-spacing: 0.01em;
}
```

#### Test checklist
- [ ] "Today's Readings" renders with sacred text color, small caps feel
- [ ] "Prayer & Devotion" renders with body font, functional feel
- [ ] "Grow in Faith" renders with muted secondary color
- [ ] Dark mode: all three title variants legible and differentiated
- [ ] No regressions in any other `more-section-title` usage

---

### MTR-03: Secondary Prayer Tools Progressive Disclosure

**Priority:** P2
**Files:** `index.html`, `css/app.css`, `src/more.js`

#### Problem
The prayer tools grid shows 4 primary cards (2×2) + 3 secondary cards (3-up) all visible at once = **7 interactive items** in a single section. The secondary row (Stations, Novena Tracker, First Friday) is advanced/niche content. The 72-year-old doesn't need to see all 7 every time — it adds cognitive load. The 25-year-old experiences it as visual clutter.

**Exception:** When a secondary card is **promoted** (e.g., Novena during Divine Mercy window, Stations during Lent), it swaps into the primary grid and shouldn't be hidden.

#### Before (index.html)
```html
<div class="prayer-tools-grid" id="prayerToolsGrid"></div>
<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>
```
Both always visible.

#### After (index.html)
```html
<div class="prayer-tools-grid" id="prayerToolsGrid"></div>
<div id="prayerToolsSecondaryWrap"></div>
```

#### JS changes (`src/more.js`)

Replace the secondary rendering block (the `var ptSecondary = document.getElementById('prayerToolsSecondary');` section) with:

```javascript
// MTR-03: Secondary tools progressive disclosure
var ptSecWrap = document.getElementById('prayerToolsSecondaryWrap');
if (ptSecWrap && resolved.secondary.length > 0) {
  // If a promoted card is in secondary, show all (it means the primary grid absorbed one already)
  var hasPromotedInSec = resolved.secondary.some(function(c) { return c.id === promotedId; });

  var secHtml = resolved.secondary.map(function(c) {
    var isPromoted = c.id === promotedId;
    var iconHtml = ptIcons[c.id]
      ? '<div class="prayer-tool-icon" style="background:' + ptBgColors[c.id] + ';color:' + ptColors[c.id] + '">' + ptIcons[c.id] + '</div>'
      : '';
    var subClass = 'prayer-tool-subtitle' + (ptSubtitleClass[c.id] ? ' ' + ptSubtitleClass[c.id] : '');
    return '<div class="prayer-tool-card prayer-tool-card--secondary' + (isPromoted ? ' prayer-tool-card--promoted' : '') + '"'
      + ' onclick="' + c.action + '" role="button" tabindex="0"'
      + (isPromoted ? ' style="border-left-color:' + ptColors[c.id] + '"' : '')
      + '>'
      + iconHtml
      + '<div class="prayer-tool-body">'
      + '<div class="prayer-tool-title">' + esc(c.title) + '</div>'
      + '<div class="' + subClass + '">' + esc(c.subtitle) + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  if (hasPromotedInSec || resolved.secondary.length <= 1) {
    // Show directly if promoted card present or only 1 card
    ptSecWrap.innerHTML = '<div class="prayer-tools-secondary">' + secHtml + '</div>';
  } else {
    // Wrap in disclosure
    ptSecWrap.innerHTML = '<details class="prayer-tools-more" id="ptMoreTools">'
      + '<summary class="prayer-tools-more-toggle">'
      + '<span>More tools</span>'
      + '<svg class="prayer-tools-more-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="14" height="14"><polyline points="6 9 12 15 18 9"/></svg>'
      + '</summary>'
      + '<div class="prayer-tools-secondary" style="margin-top:var(--space-2)">' + secHtml + '</div>'
      + '</details>';
  }
}
```

#### CSS additions
```css
/* Secondary tools disclosure */
.prayer-tools-more { margin-top: var(--space-3); }
.prayer-tools-more-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  padding: var(--space-2);
  cursor: pointer;
  list-style: none;
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  -webkit-tap-highlight-color: transparent;
  min-height: 36px;
}
.prayer-tools-more-toggle::-webkit-details-marker { display: none; }
.prayer-tools-more-chevron {
  transition: transform 0.2s var(--ease-out);
  color: var(--color-text-tertiary);
}
.prayer-tools-more[open] .prayer-tools-more-chevron { transform: rotate(180deg); }
.prayer-tools-more-toggle:active { opacity: 0.7; }
```

#### Test checklist
- [ ] Default state: only 4 primary prayer cards visible + "More tools" toggle
- [ ] Tapping "More tools" reveals Stations, Novena Tracker, First Friday in 3-up grid
- [ ] When a secondary card is promoted (e.g., Novena during Lent), secondary row shows without disclosure
- [ ] Toggle chevron rotates on open
- [ ] 44pt minimum touch target on toggle
- [ ] Dark mode: toggle text and chevron use `--color-text-tertiary`
- [ ] 72yo test: fewer items to scan by default, clear path to more if needed
- [ ] Library teaser remains below (not inside disclosure)

---

### MTR-04: Reading Entries Compact Mode

**Priority:** P3
**Files:** `css/app.css`

#### Problem
Each reading entry takes ~52px of vertical space (`padding: var(--space-3) 0` + heading + ref). With 4–5 entries, readings consume ~250px before any expansion. Inside Zone 1 (the warm "Today" container), this feels heavy.

#### Proposed change
Tighten reading entry padding when inside the Today zone. This is CSS-only — no JS changes.

#### CSS additions
```css
/* Compact reading entries inside Today zone */
.more-zone--today .reading-entry { padding: var(--space-2) 0; }
.more-zone--today .reading-heading { font-size: 11px; letter-spacing: 0.08em; }
.more-zone--today .reading-ref { font-size: var(--text-sm); }
```

#### Test checklist
- [ ] Reading entries slightly tighter vertically inside Zone 1
- [ ] Headings (FIRST READING, RESPONSORIAL PSALM, etc.) smaller/more label-like
- [ ] Scripture references remain legible at `--text-sm`
- [ ] Expand/collapse still works, expanded text has normal spacing
- [ ] Entries outside Zone 1 (if any future use) unaffected
- [ ] Dark mode: no regressions

---

### MTR-05: Library Teaser Repositioned Below Zone 2

**Priority:** P3
**Files:** `index.html`

#### Problem
The Library teaser ("Bible, Catechism & Catholic classics — coming soon") currently sits inside the prayer tools section, feeling like another prayer tool. It's actually a future Zone 3 asset — it signals "more content is coming for the reference layer."

#### Proposed change
Move `#libraryTeaser` below the Zone 2 container but above the Zone 3 seam. This visually bridges the two zones and teases the "Go Deeper" section.

#### After (index.html)
```html
  </div><!-- end .more-zone--practice -->

  <!-- Library teaser — bridges Practice and Go Deeper -->
  <div id="libraryTeaser"></div>

  <!-- ZONE SEAM -->
  <div class="more-zone-seam" aria-hidden="true"></div>
```

Remove `<div id="libraryTeaser"></div>` from inside `prayerToolsSection`.

#### CSS addition
```css
/* Library teaser between zones */
#libraryTeaser { padding: 0 0 var(--space-2); }
#libraryTeaser .library-teaser { margin-top: 0; }
```

#### Test checklist
- [ ] Library teaser appears between Zone 2 and Zone 3
- [ ] Dashed border + low opacity treatment preserved
- [ ] Not inside the prayer tools disclosure
- [ ] Dark mode: no regression

---

### MTR-06: Zone 1 Internal Spacing Refinement

**Priority:** P2
**Files:** `css/app.css`

#### Problem
Inside Zone 1, the saint card, seasonal moment cards, and readings section need breathing room between them without `border-bottom` lines. Pure spacing handles this.

#### CSS additions
```css
/* Zone 1 internal spacing */
.more-zone--today #saintSection { padding-bottom: var(--space-3); }
.more-zone--today #seasonalMoment:not(:empty) { padding: var(--space-2) 0 var(--space-3); }
.more-zone--today #readingsSection { padding-top: var(--space-3); border-top: 1px solid color-mix(in srgb, var(--color-sacred) 10%, transparent); }

html[data-theme="dark"] .more-zone--today #readingsSection {
  border-top-color: color-mix(in srgb, var(--color-sacred) 8%, transparent);
}
```

Rationale: A very faint sacred-tinted separator between the saint/seasonal zone and readings gives just enough structure inside Zone 1 without the harsh `border-light` line used elsewhere.

#### Test checklist
- [ ] Saint card has subtle bottom breathing room
- [ ] Seasonal moment cards have vertical padding (only when present)
- [ ] A faint sacred-tinted line separates seasonal from readings
- [ ] Dark mode: separator visible but subtle
- [ ] Empty seasonal moment doesn't leave orphan spacing

---

### MTR-07: Devotional Guide Count When Collapsed

**Priority:** P3
**Files:** `src/more.js`

#### Problem
When Zone 3 is collapsed, the user sees "Grow in Faith" and a chevron — no signal of what's inside or how much content exists.

#### Solution
Show a count badge: "4 guides" (number adjusts based on what's visible after seasonal filtering). Already specified in MTR-01 JS code. This item covers the edge cases.

#### JS details
The count should reflect `orderedGuides.length` (after seasonal filtering removes non-current season guides). This gives an accurate "4 guides" during Lent (Sunday Obligation, Confession, Lent, Devotions group) vs "4 guides" during Easter (Sunday Obligation, Confession, Easter, Devotions group).

#### Test checklist
- [ ] Badge shows correct count during Lent (4 guides visible)
- [ ] Badge shows correct count during Easter (4 guides visible)
- [ ] Badge shows correct count during Ordinary Time (4 guides visible)
- [ ] Badge hidden or shows 0 gracefully if no guides render

---

## Cascading Impact Analysis

| Area | Impact | Notes |
|------|--------|-------|
| `more-section` border-bottom | Removed globally | No other tab uses `more-section` — safe |
| Prayer tools secondary grid | Wrapped in disclosure | Promoted-card swap logic (PMG-04) must bypass disclosure |
| Devotional cards container | Moved inside `<details>` | Term click delegation (`initTermClicks`) must re-attach after open — use event delegation on parent |
| `ref-tap` and `ccc-ref` wiring | Must survive zone restructure | Already delegated in `renderMore()` on `devotEl` — just ensure `devotEl = document.getElementById('devotionalCards')` still resolves inside `<details>` |
| Seasonal CCC (`_renderSeasonalCCC`) | Currently hidden (`display:none`) | No impact |
| Install card | Remains below Zone 3 | No change |
| Footer | Remains at bottom | No change |
| `more-section p` font-size override (line ~395) | Still applies inside zones | No change needed |

---

## Implementation Order

1. **MTR-01** (Zone containers + Zone 3 collapsible) — structural change, everything builds on this
2. **MTR-06** (Zone 1 internal spacing) — immediate polish after containers
3. **MTR-02** (Title typography) — visual differentiation
4. **MTR-03** (Secondary tools disclosure) — content reduction
5. **MTR-05** (Library teaser reposition) — small move
6. **MTR-04** (Reading compaction) — final polish
7. **MTR-07** (Guide count badge) — edge case coverage

Items 1–3 should be done as a group. Items 4–7 can be cherry-picked.

---

## Summary Table

| ID | Title | Priority | Files |
|----|-------|----------|-------|
| MTR-01 | Zone Container Architecture | P1 | index.html, css/app.css, src/more.js |
| MTR-02 | Section Title Typography Differentiation | P2 | css/app.css |
| MTR-03 | Secondary Prayer Tools Progressive Disclosure | P2 | index.html, css/app.css, src/more.js |
| MTR-04 | Reading Entries Compact Mode | P3 | css/app.css |
| MTR-05 | Library Teaser Repositioned | P3 | index.html, css/app.css |
| MTR-06 | Zone 1 Internal Spacing Refinement | P2 | css/app.css |
| MTR-07 | Devotional Guide Count When Collapsed | P3 | src/more.js |

---

### Implementation Notes

- **Date:** 2026-03-15
- **Status:** done
- **Files changed:**
  - `index.html` — restructured More tab into three zone containers (Today, Practice, Go Deeper), moved libraryTeaser between zones, replaced prayerToolsSecondary with prayerToolsSecondaryWrap, wrapped Grow in Faith in collapsible `<details>` with count badge
  - `css/app.css` — added zone container styles (.more-zone--today, --practice, --deeper), zone seam micro-ornament, Zone 3 collapsible toggle/chevron/count badge, Zone 1 internal spacing (MTR-06), section title typography modifiers (MTR-02), reading compact mode (MTR-04), secondary tools disclosure styles (MTR-03), library teaser spacing, dark mode overrides; removed border-bottom from .more-section; reduced .more-content top padding
  - `src/more.js` — replaced prayerToolsSecondary rendering with progressive disclosure wrapper (shows "More tools" toggle unless a promoted card is in secondary tier or only 1 card); added Zone 3 open/close localStorage memory (mf-deeper-open); added guide count badge rendering
- **Approach:** Followed the spec's three-zone architecture exactly. Zone 1 (Today) gets a warm sacred surface with subtle sacred-tinted internal separator. Zone 2 (Practice) is neutral with secondary tools behind a `<details>` disclosure. Zone 3 (Go Deeper) is a collapsible `<details>` element with localStorage memory and count badge. Zone seams use a 40px micro-ornament line. All seven MTR items implemented in recommended order.
- **Deviations from spec:** None
- **Known issues:** None observed
