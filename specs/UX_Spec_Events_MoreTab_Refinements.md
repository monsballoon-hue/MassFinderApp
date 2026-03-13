# UX Spec — Events Section & More Tab Refinements

**Date:** 2026-03-13  
**Author:** UX Consultant (Claude Opus)  
**Status:** Implemented
**Depends on:** UX_Spec_Saved_Find_Detail_Refinements.md (SFD series)

---

## Item Status Summary

| Item | Title | Status |
|------|-------|--------|
| EMT-01-A | Category icons + labels in event rows | done |
| EMT-01-B | Seasonal tinting on Lenten/Advent events | done |
| EMT-01-C | Truncate over-long titles, surface notes | done |
| EMT-01-D | Today's Events badge enhancement | done (via existing `saved-evt-today` styles) |
| EMT-02-A | Reorder More tab sections | done |
| EMT-02-B | Section headers that tell a story | done |
| EMT-02-C | Reduce vertical dead space | done |
| EMT-03-A | Prayer tool card icons | done |
| EMT-03-B | Contextual "today" highlight | done |
| EMT-03-C | Active progress indicators | done |
| EMT-04-A | Warmer reading labels | done |
| EMT-04-B | Reference styling in Georgia | done |
| EMT-04-C | Liturgical context subtitle | skipped — redundant with saint card |
| EMT-04-D | Gospel elevation | done |
| EMT-05-A | Rebrand "Discover the Faith" as "Catholic Library" | done |
| EMT-05-B | Move Library teaser below prayer tools | done |
| EMT-05-C | Keep Weekly Email in footer | done (no change needed) |

---

## Table of Contents

1. [EMT-01] Saved Tab Events — From Database Rows to Living Parish Life
2. [EMT-02] More Tab — Mission, Flow & Information Architecture
3. [EMT-03] More Tab — Prayer Tools Visual Upgrade
4. [EMT-04] More Tab — Today's Readings Warmth & Readability
5. [EMT-05] More Tab — Coming Soon Items & Real Estate Recovery

---

## [EMT-01] Saved Tab Events — From Database Rows to Living Parish Life

**Files:** `src/saved.js`, `src/events.js`, `css/app.css`

### User Story

A user scrolls past the Today card and Tomorrow services in their Saved tab and reaches "This week." They see:

```
Tomorrow
Knights of Columbus Membership Drive        >
Tomorrow · 2 dates left · St. Mary

Monday, Mar 16
Lenten Retreat: 5pm Confession, 6pm Mass,   >
reflection until 8pm. Fr. Paul with Deacon
Kevin.
Mon, Mar 16 · St. Peter & St. Casimir
```

Every row is identical in structure: bold title, grey when-line, chevron. There are no icons, no color, no category signals, no distinction between a social coffee hour and a multi-day Lenten retreat. The information is *correct* but emotionally flat — it reads like a spreadsheet export, not a living parish community.

**72-year-old parishioner:** Sees a wall of grey text. The Lenten Retreat title is 67 characters long and wraps three lines — but they can't tell at a glance whether this is a prayer event, a social gathering, or a volunteer signup. They don't feel invited.

**25-year-old:** Has been trained by every modern app to expect category chips, color coding, and visual hierarchy. This list gives them nothing to scan. They scroll past without engaging.

**45-year-old parent:** Needs to quickly identify "are any of these kid-friendly?" or "is there anything *I* should care about this week?" The flat list offers no filtering and no visual shortcuts to answer these questions.

### Root Cause

1. `renderUnifiedEvt()` in `saved.js` renders every event identically — title + when-parts + chevron
2. Category icons exist in `events.js` (`CAT_ICONS`) but are not used in the saved tab list view
3. Category labels exist (`CAT_LABELS`) but are not displayed
4. Some event titles contain the entire description (e.g., "Lenten Retreat: 5pm Confession, 6pm Mass, reflection until 8pm. Fr. Paul with Deacon Kevin.") because the data was entered with the schedule embedded in the title field
5. The `notes` field is populated on 176/203 events but never shown in the list — only on the detail panel
6. No seasonal or category-based visual treatment is applied to the rows

### Proposed Fix

#### EMT-01-A: Add category icon and colored accent to event rows

Each event row should include a small category icon to the left, providing an instant visual signal about the event type.

**Before:**
```
Knights of Columbus Membership Drive        >
Tomorrow · 2 dates left · St. Mary
```

**After:**
```
🏠  Knights of Columbus Membership Drive    >
    Community · Tomorrow · 2 dates left
    St. Mary
```

Changes:
- Prepend the category SVG icon from `CAT_ICONS[evt.category]` to each row, rendered at `20px × 20px` inside a `28px × 28px` rounded container with a tinted background
- The icon container uses a category-tinted background: `background: var(--color-{category}-pale, var(--color-surface-hover))`
- Add a small category label (e.g., "Community", "Liturgical", "Social") as the first item in the when-parts, styled with `font-weight: var(--weight-medium)` and the category accent color
- Move the church name to its own line below the when-parts for cleaner separation

**Category color map** (add to CSS as custom properties or inline):

| Category | Accent Color | Pale Background |
|----------|-------------|-----------------|
| liturgical | `var(--color-accent)` (gold) | `var(--color-accent-pale)` |
| devotional | `#6B21A8` (purple) | `rgba(107,33,168,0.06)` |
| educational | `var(--color-info)` (blue) | `var(--color-info-bg)` |
| social | `var(--color-verified)` (green) | `var(--color-verified-bg)` |
| fellowship | `var(--color-verified)` | `var(--color-verified-bg)` |
| community | `var(--color-primary)` (navy) | `var(--color-primary-bg)` |
| volunteering | `#D97706` (amber) | `var(--color-warning-bg)` |
| yc | `var(--color-accent)` | `var(--color-accent-pale)` |

**Implementation in `saved.js` `renderUnifiedEvt()`:**

```javascript
// Add to the template:
var catIcon = CAT_ICONS[e.category] || CAT_ICONS.community;
var catLabel = CAT_LABELS[e.category] || '';

// Insert icon container before the body:
'<div class="saved-evt-icon saved-evt-icon--' + (e.category || 'community') + '">'
+ catIcon + '</div>'

// Add category label as first when-part:
if (catLabel) whenParts.unshift(catLabel);
```

Need to import `CAT_ICONS` and `CAT_LABELS` into `saved.js` — they currently live in `events.js`. Expose them via module exports (they're already exported at line 612).

#### EMT-01-B: Seasonal tint on Lenten/Advent events

Events with `seasonal.is_seasonal === true` and `seasonal.season === 'lent'` should receive a subtle left-border accent matching the liturgical season, similar to how the saint card adapts.

```css
.saved-evt-unified.saved-evt-season-lent {
  border-left: 3px solid #6B21A8;
  padding-left: var(--space-3);
  background: rgba(107,33,168,0.03);
}
html[data-theme="dark"] .saved-evt-unified.saved-evt-season-lent {
  background: rgba(168,85,247,0.06);
}
```

This creates an instant visual signal: purple = Lent, gold = Advent/Christmas, green = Ordinary Time feast. The user learns to associate the color with the season without reading a label.

**Implementation:** In `renderUnifiedEvt()`, check `e.seasonal && e.seasonal.is_seasonal` and append a season class to `rowClass`.

#### EMT-01-C: Truncate over-long titles, surface notes separately

The data issue: some event titles contain the full schedule description. "Lenten Retreat: 5pm Confession, 6pm Mass, reflection until 8pm. Fr. Paul with Deacon Kevin." is a title that should be "Lenten Retreat" with the rest as a note.

**Short-term fix (rendering):** Clamp the title to 2 lines with CSS `line-clamp`:
```css
.saved-evt-unified-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
```

If the event has a `notes` field that differs from the title, show the first ~60 characters as a snippet line below the when-parts:
```css
.saved-evt-unified-note {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  font-style: italic;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
```

**Long-term fix (data):** Audit events.json for titles that exceed ~50 characters. Split the schedule details into the `notes` or `description` field. This is a data quality task, not a code change.

#### EMT-01-D: "Today's Events" badge enhancement

The existing `saved-evt-today-badge` ("Today's Events" label) is a good start. Enhance the today events themselves with a slightly more prominent card treatment:

- Today events get a warm background card: `background: var(--color-accent-pale)`, `border-radius: var(--radius-md)`, `padding: var(--space-3)`
- Group today events into a visible container rather than relying solely on the left-border accent
- Add the time prominently if the event has one: render time as `font-weight: var(--weight-bold)` before the title

### Test Checklist

- [ ] Every event row shows a category icon with colored background
- [ ] Category label appears in when-parts line
- [ ] Lenten events show purple left-border
- [ ] Titles longer than 2 lines are clamped with ellipsis
- [ ] Notes snippet shows when present and different from title
- [ ] Today events have warm accent background
- [ ] Dark mode: all category colors have dark-mode overrides
- [ ] YC events retain their existing gold treatment (verify no regression)
- [ ] "7 more" progressive disclosure still works correctly
- [ ] Performance: icon rendering doesn't cause layout shift on scroll

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/saved.js` — added `_getCatData()` lazy loader for CAT_ICONS/CAT_LABELS from events.js; refactored `renderUnifiedEvt()` to prepend category icon container, add category label as first when-part, move church name to own line, add notes snippet, add seasonal tint class, CSS line-clamp on title. `src/events.js` — exported CAT_ICONS and CAT_LABELS. `css/app.css` — added `.saved-evt-icon` variants per category with colored backgrounds, `.saved-evt-cat-label` + `.saved-evt-cat--{category}` color classes, `.saved-evt-unified-title` line-clamp:2, `.saved-evt-unified-church` and `.saved-evt-unified-note` styling, `.saved-evt-season-{lent,advent,christmas,easter}` border+background tints, dark mode overrides for purple category icons.
- **Approach:** Lazy-loaded CAT_ICONS/CAT_LABELS via `_getCatData()` to avoid circular dependency at module load time. Category icons use 28x28 rounded-square containers (matching spec's "rounded squares for events" guidance) with category-tinted backgrounds. Church name separated to its own line below when-parts. Notes snippet shown only when notes differ from title (first 60 chars, ellipsized).
- **Deviations from spec:** Icon container is 28x28 rounded square instead of spec's 20x20 in 28x28 circle — squares differentiate event icons from prayer tool circular icons per cross-cutting concern guidance. EMT-01-D not separately implemented as a container card — existing `saved-evt-today` border+background styling already provides the warm treatment.
- **Known issues:** None observed.

---

## [EMT-02] More Tab — Mission, Flow & Information Architecture

**Files:** `src/more.js`, `index.html`, `css/app.css`

### Current State Analysis

The More tab currently serves five distinct purposes simultaneously:
1. **Daily liturgical context** — saint card, liturgical day, fasting banner
2. **Prayer tools** — Rosary, Examination, Stations, Novena
3. **Scripture** — Today's Readings
4. **Reference/education** — Faith Guides
5. **App admin** — Settings, install card, "coming soon" placeholders

The result is a tab that doesn't have a clear identity. It's not a "prayer" tab, it's not a "daily" tab, it's not a "reference" tab — it's a grab bag. The user can't form a mental model of what to expect here, which means they don't build a habit of returning.

### Proposed Mission: "Your Daily Catholic Life"

The More tab should be reframed as **the daily companion** — what the user opens once a day to ground themselves. The organizing principle becomes *temporal cadence*: what matters today, arranged in order of spiritual importance.

**Revised hierarchy (top to bottom):**

1. **The Day** — liturgical context (what day is it in the Church's life?)
2. **The Word** — today's Scripture readings
3. **The Practice** — prayer tools for today
4. **The Knowledge** — reference & formation (collapsed)
5. **The App** — settings, footer (minimal)

This is not a radical restructuring — it's mostly a reordering and regrouping of what already exists, plus some visual enhancements to create a sense of daily rhythm.

### Proposed Fix

#### EMT-02-A: Reorder the More tab sections

**Current order:**
1. HDO/Fasting banner
2. Saint card (liturgical day)
3. Prayer tools grid
4. Today's Readings
5. Daily Formation (disabled)
6. Faith Guides (collapsed)
7. Install card
8. Footer

**New order:**
1. HDO/Fasting banner *(unchanged — contextual alerts belong at top)*
2. Saint card / liturgical day *(unchanged — THE DAY)*
3. Today's Readings *(moved up — THE WORD)*
4. Prayer tools grid *(moved down — THE PRACTICE)*
5. Catholic Library teaser *(extracted from grid, standalone card — see EMT-05)*
6. Faith Guides (collapsed) *(unchanged — THE KNOWLEDGE)*
7. Footer with Settings *(unchanged)*

**Rationale:** Readings should come before prayer tools because the readings are *temporal* — they change every day, creating a reason to return. Prayer tools are *persistent* — they're available anytime. Placing the daily-changing content higher creates a stronger daily habit loop.

**Implementation:** Reorder the HTML sections in `index.html` (lines 108-146). Move `prayerToolsSection` below `readingsContent`. The JS rendering in `more.js` is DOM-id-based and doesn't depend on HTML order, so no JS changes are needed for the reorder itself.

#### EMT-02-B: Section headers that tell a story

Replace generic section titles with warmer headers that create narrative flow:

| Current | New | Font |
|---------|-----|------|
| *(no header for saint card)* | *(stays as-is — the card IS the header)* | — |
| "Today's Readings" | "Today's Readings" | Keep as-is, add subtle subtitle |
| *(no header for prayer tools)* | "Prayer & Devotion" | `--font-display`, `--text-base` |
| "Faith Guides" | "Grow in Faith" | `--font-display`, `--text-base` |

For "Today's Readings", add a liturgical subtitle below the heading that indicates the day context, e.g., *"Friday of the 3rd Week of Lent"* — this connects the readings to the liturgical day shown in the saint card above, reinforcing the narrative.

**Implementation in `more.js` or `readings.js`:** After readings load, inject the liturgical day name into a subtitle element below "Today's Readings." The data is already available from `fetchLiturgicalDay()`.

#### EMT-02-C: Reduce vertical dead space between sections

Looking at screenshot 1 (bottom of More tab): there is excessive vertical spacing between the Novena Tracker card and "Today's Readings" heading, and between the Gospel entry and "Faith Guides." The `more-section` class applies `padding: var(--space-6) 0` (24px top and bottom), creating 48px of combined gap between sections.

**Fix:**
- `.more-section` padding: `var(--space-6) 0` → `var(--space-4) 0` (16px, down from 24px)
- `.more-section--tight` padding: `var(--space-2) 0` → stays as-is
- Net savings: ~32px across 4 sections, enough to show one more reading entry above the fold

### Test Checklist

- [ ] Today's Readings now appears directly below the saint card
- [ ] Prayer tools appear below readings
- [ ] Catholic Library teaser appears below prayer tools, above Faith Guides
- [ ] Liturgical day subtitle appears below "Today's Readings" heading
- [ ] Section spacing is tighter without feeling cramped
- [ ] Faith Guides collapsed state still works
- [ ] Footer still renders at bottom
- [ ] No JS errors from section reorder
- [ ] Scroll position on tab switch is still correct (top of tab)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `index.html` — reordered readings section above prayer tools, added `readingsSection` id, added "Prayer & Devotion" h2 header, added `libraryTeaser` placeholder div, renamed "Faith Guides" to "Grow in Faith". `css/app.css` — reduced `.more-section` padding from `--space-6` to `--space-4`.
- **Approach:** Moved the readings `<div class="more-section">` block above the prayer tools section in the HTML. The JS rendering is DOM-id-based so no JS changes were needed for the reorder. Added section headers per EMT-02-B. Reduced section padding per EMT-02-C (saves ~32px across sections).
- **Deviations from spec:** EMT-04-C liturgical subtitle was implemented but then removed at user request — it was redundant with the saint card shown directly above.
- **Known issues:** None observed.

---

## [EMT-03] More Tab — Prayer Tools Visual Upgrade

**Files:** `src/more.js`, `css/app.css`

### User Story

The user scrolls to the prayer tools section and sees four identical rectangular cards: "Guided Rosary / Sorrowful Mysteries today", "Examination of Conscience / Last Confession: 0 days ago", "Stations of the Cross / Lenten devotion", "Novena Tracker / 2 novenas in progress."

These are the app's most powerful and well-built features. The Rosary module has bead-by-bead tracking with crossfade transitions. The Examination has a full confessional summary flow. But the entry points look like plain list items — identical flat rectangles with text. There's nothing to suggest which one is relevant *today* or to create the sense that these are sacred tools worth engaging with.

**72-year-old:** Sees text boxes. Doesn't feel drawn to tap any of them. Would be more engaged if the presentation suggested "this is for you, today."

**25-year-old:** Expects the kind of visual distinction they see in apps like Headspace or Hallow — cards with distinct character, context-aware suggestions, subtle visual cues.

**45-year-old parent:** Has 5 minutes. Wants to know: "What should I pray today?" The current grid says "here are four equal options" rather than "here's what's timely."

### Proposed Fix

#### EMT-03-A: Add category icons to prayer tool cards

Each prayer tool should have a small SVG icon on the left side that provides visual identity. These should be consistent with MassFinder's SVG-only design principle.

| Tool | Icon concept | Color |
|------|-------------|-------|
| Guided Rosary | Rosary beads (circle chain) | `var(--color-accent)` |
| Examination of Conscience | Shield/heart (reconciliation) | `#6B21A8` (purple, penitential) |
| Stations of the Cross | Cross | `#6B21A8` during Lent, `var(--color-text-secondary)` otherwise |
| Novena Tracker | Flame/candle | `var(--color-accent)` |

**Implementation:**

Add an icon field to the `ptCards` array in `more.js` (~line 153-158):
```javascript
{ id: 'rosary', title: 'Guided Rosary', subtitle: _getRosarySubtitle(),
  icon: '<svg ...rosary icon...>', action: 'openRosary()', active: true },
```

Render the icon in a `32px × 32px` container with a tinted circular background:
```css
.prayer-tool-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.prayer-tool-icon svg {
  width: 18px;
  height: 18px;
}
```

#### EMT-03-B: Contextual "today" highlight for the most relevant tool

One prayer tool should be visually promoted as the "suggested" practice based on the liturgical context:

- **During Lent:** Elevate "Stations of the Cross" with a subtle purple left-border and label "Lenten practice"
- **Fridays outside Lent:** Elevate "Guided Rosary" with "Sorrowful Mysteries today"
- **When confession is overdue (>30 days):** Elevate "Examination of Conscience" with a gentle nudge label

The elevated card gets:
- `border-left: 3px solid [contextual color]`
- A faint background tint matching the border color
- Slightly larger: `padding: var(--space-4)` instead of `var(--space-3)`

This is not a mandate — the user can still tap any card. It's a gentle contextual suggestion.

**Implementation:** Add a `promoted` boolean to the `ptCards` array based on liturgical context. Apply a `.prayer-tool-card--promoted` class.

```css
.prayer-tool-card--promoted {
  border-left: 3px solid var(--color-accent);
  background: linear-gradient(135deg, var(--color-surface) 60%, var(--color-accent-pale) 100%);
}
```

#### EMT-03-C: Active progress indicators

The subtitles already show progress data ("2 novenas in progress", "Last Confession: 0 days ago") but they're styled identically to static descriptions. Make active progress visually distinct:

- "2 novenas in progress" → add a small dot indicator or progress fraction: `Day 5 of 9 · Day 3 of 9`
- "Last Confession: 0 days ago" → style differently when recent (green accent) vs overdue (>30 days, warm amber nudge)
- "Sorrowful Mysteries today" → this is already good, no change needed

```css
.prayer-tool-subtitle--active {
  color: var(--color-verified);
  font-weight: var(--weight-medium);
}
.prayer-tool-subtitle--nudge {
  color: var(--color-warning);
}
```

### Test Checklist

- [ ] Each prayer tool card shows an icon with colored circular background
- [ ] During Lent, Stations card has purple left-border
- [ ] When confession >30 days, Examination card has amber nudge styling
- [ ] Active novena progress shows day fractions
- [ ] "Catholic Library" teaser card renders below the prayer tools grid (not inside it) per EMT-05
- [ ] Dark mode: all icon backgrounds and borders have overrides
- [ ] Icons are SVG, not emoji (per design principles)
- [ ] Touch targets remain ≥ 48px (verify min-height on cards)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/more.js` — removed "Discover the Faith" from ptCards array, added ptIcons/ptColors/ptBgColors maps for SVG icons per tool, added promotedId logic (Stations during Lent, Rosary on Fridays, Examination when >30 days), added ptSubtitleClass for active/nudge states, renders icon containers with circular tinted backgrounds, renders library teaser separately. `css/app.css` — added `.prayer-tool-icon` (32x32 circle), `.prayer-tool-card--promoted` (accent left-border + gradient), `.prayer-tool-subtitle--active` (verified green), `.prayer-tool-subtitle--nudge` (amber), dark mode override for promoted card.
- **Approach:** Added SVG icons as inline strings in a ptIcons map. Color/background maps drive inline styles on the icon containers. Promoted card determination uses isLentSeason() for Stations, day-of-week for Rosary Friday, confession daysAgo for Examination. Subtitle styling uses CSS classes rather than inline styles for maintainability.
- **Deviations from spec:** Novena subtitle enhancement (day fractions) only adds the `--active` class when "in progress" text is detected — the single-novena case already shows "Day X of 9" from `_getNovenaSubtitle()`.
- **Known issues:** None observed.

---

## [EMT-04] More Tab — Today's Readings Warmth & Readability

**Files:** `src/readings.js`, `css/app.css`

### User Story

The user reaches "Today's Readings" and sees three expandable rows:

```
FIRST READING                               ∨
Hosea 14:2-10

RESPONSORIAL PSALM                          ∨
Psalm 81:6c-8a, 8bc-9, 10-11ab, 14 and 17

GOSPEL                                      ∨
Mark 12:28-34
```

The labels are uppercase, tertiary-colored, with technical references below. This is structurally correct and functionally complete — the user can tap to expand and read the text. But it feels like a database index, not an invitation to encounter Scripture. The reading labels read like column headers, not like "here's what the Church is praying today."

The saint card above does this beautifully: a reflection prompt in Georgia italic ("Have you thanked someone who has helped you grow in faith?") that invites contemplation. The readings section should aim for the same emotional register.

### Proposed Fix

#### EMT-04-A: Warmer reading labels

**Before:** `FIRST READING` — uppercase, `var(--text-xs)`, `var(--color-text-tertiary)`, `letter-spacing: 0.06em`

**After:** Keep the structured labels but reduce the "shouting" uppercase treatment:

```css
.reading-label {
  font-size: var(--text-sm);         /* was --text-xs */
  font-weight: var(--weight-medium); /* was semibold uppercase */
  color: var(--color-accent-text);   /* warm accent instead of grey */
  text-transform: none;              /* was uppercase */
  letter-spacing: 0.02em;            /* was 0.06em */
}
```

So "FIRST READING" becomes "First Reading" — same information, warmer tone. The accent color ties it to the liturgical color system.

#### EMT-04-B: Reference styling in Georgia (prayer font)

The Scripture reference (e.g., "Hosea 14:2-10") is sacred text — it's the identity of the passage. It should use `--font-prayer` (Georgia) to visually connect it to the contemplative layer of the app.

```css
.reading-ref {
  font-family: var(--font-prayer);
  font-size: var(--text-base);       /* was --text-sm */
  font-weight: var(--weight-regular); /* was semibold */
  color: var(--color-text-primary);
  font-style: italic;
}
```

The italic Georgia treatment says "this is Scripture" the way the app's rosary prayer text says "this is prayer."

#### EMT-04-C: Liturgical context subtitle

Add a single line below the "Today's Readings" heading that connects the readings to the liturgical day:

```
Today's Readings
Friday of the 3rd Week of Lent
```

The subtitle should be:
```css
.reading-section-subtitle {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  font-style: italic;
  margin-top: -var(--space-2);
  margin-bottom: var(--space-3);
}
```

**Implementation:** The liturgical day name is available from the `fetchLiturgicalDay()` result that `renderSaintCard()` already consumes. After the saint card renders, store the primary event name in a module-level variable (or on `window`). When readings render, inject it into a subtitle element.

This creates a thread from the saint card → readings, reinforcing the "today's spiritual journey" narrative.

#### EMT-04-D: Gospel elevation

The Gospel reading is the high point of the Liturgy of the Word. It should be visually elevated compared to the other readings:

- Add a subtle left-border accent: `border-left: 3px solid var(--color-accent)`
- The label "Gospel" renders in `--font-display` at `var(--text-base)` instead of matching the other labels
- Slightly more padding: `padding-left: var(--space-3)` on the entry

This mirrors the liturgical tradition where the Gospel proclamation is treated with greater solemnity (the congregation stands, the deacon carries the Book of the Gospels in procession).

```css
.reading-entry--gospel {
  border-left: 3px solid var(--color-accent);
  padding-left: var(--space-3);
  margin-left: calc(-1 * var(--space-1));
}
.reading-entry--gospel .reading-label {
  font-family: var(--font-display);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-accent-text);
}
```

### Test Checklist

- [ ] Reading labels render in title case, not uppercase
- [ ] References use Georgia italic
- [ ] Liturgical day subtitle appears below "Today's Readings"
- [ ] Gospel entry has accent left-border
- [ ] Expanded reading text still renders correctly with new label styling
- [ ] Dark mode: accent colors, Georgia text readable against dark surface
- [ ] Labels still align correctly with the expand chevron
- [ ] No visual regression on Psalm reference (long text should still wrap cleanly)

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done (EMT-04-C skipped — redundant with saint card)
- **Files changed:** `css/app.css` — changed `.reading-heading` to title-case, medium weight, accent color; changed `.reading-ref` to Georgia italic at text-base; added `.reading-entry--gospel` with accent left-border and display-font label; added `.reading-section-subtitle` class (retained but unused). `src/readings.js` — added `isGospel` detection in fetchReadings() to apply `reading-entry--gospel` class to Gospel entries.
- **Approach:** EMT-04-A/B are pure CSS changes. EMT-04-D adds a class check on `s.heading.toLowerCase().indexOf('gospel')` to apply the elevated Gospel styling. EMT-04-C was implemented (subtitle from renderSaintCard piped to readingsSubtitle div) but removed at user's request since it duplicated the saint card information visible directly above.
- **Deviations from spec:** EMT-04-C skipped per user feedback — the liturgical day name is already prominent in the saint card.
- **Known issues:** None observed.

---

## [EMT-05] More Tab — Coming Soon Items: Upgrade the Library Teaser

**Files:** `src/more.js`, `css/app.css`

### Context

Two "coming soon" elements exist in the More tab:

1. **"Discover the Faith / Bible, CCC & more coming soon"** — greyed-out prayer tool card
2. **"Weekly Email / Coming soon"** — greyed-out footer row

Both features are shipping soon and should be retained. However, the "Discover the Faith" card in particular undersells what's coming — a full Library with Bible (DRB + CPDV), CCC (2,865 §§), Catholic classics, cross-referencing, note-taking, highlights, and bookmarks. The current placeholder reads like a vague afterthought rather than a preview of a major feature.

### Proposed Fix

#### EMT-05-A: Rebrand "Discover the Faith" as "Catholic Library"

**Before:**
```
Discover the Faith
Bible, CCC & more coming soon
```

**After:**
```
📖  Catholic Library
    Bible, Catechism & Catholic classics — coming soon
```

Changes:
- Title: `"Discover the Faith"` → `"Catholic Library"`
- Subtitle: `"Bible, CCC & more coming soon"` → `"Bible, Catechism & Catholic classics — coming soon"`
- Add a book-stack SVG icon (matching the icon treatment from EMT-03-A) with a muted tint, reinforcing that this is a substantial content tool, not a vague link
- Keep the `coming-soon` class and `opacity: 0.5` / `cursor: default` behavior — the card stays non-interactive until the feature ships

**Implementation in `more.js` (~line 158):**
```javascript
{ id: 'library', title: 'Catholic Library',
  subtitle: 'Bible, Catechism & Catholic classics \u2014 coming soon',
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>',
  action: '', active: false }
```

#### EMT-05-B: Move the Library teaser below the prayer tools

Currently the "Discover the Faith" card sits *inside* the prayer tools grid, making it look like a broken prayer tool. The Library is a fundamentally different kind of feature — it's a reference/study tool, not a guided prayer experience.

**Move it to its own position** between the prayer tools grid and the Faith Guides section. Render it as a standalone card (not part of the grid) with its own styling:

```css
.library-teaser {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px dashed var(--color-border);
  border-radius: var(--radius-md);
  opacity: 0.6;
  margin-top: var(--space-3);
}
.library-teaser .prayer-tool-title {
  font-size: var(--text-base);
  color: var(--color-text-secondary);
}
.library-teaser .prayer-tool-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
}
```

The dashed border signals "coming soon" more clearly than a greyed-out solid card, and separating it from the grid prevents users from misreading it as a broken prayer tool.

**Implementation:** Remove the `{ id: 'library', ... }` entry from the `ptCards` array. Instead, render a standalone `<div class="library-teaser">` after `ptGrid` in `renderMore()`, using the same icon + title + subtitle structure.

#### EMT-05-C: Keep "Weekly Email / Coming soon" in footer

Retain as-is. The footer is the right location for a notification/subscription feature — it's low-friction placement that doesn't compete with core content.

### Test Checklist

- [ ] Library teaser renders below the prayer tools grid, not inside it
- [ ] Library teaser uses dashed border to signal coming-soon
- [ ] Prayer tools grid contains only the 4 active tools (clean grid)
- [ ] Library card title reads "Catholic Library"
- [ ] Library card subtitle mentions Bible, Catechism & Catholic classics
- [ ] Weekly Email row still appears in footer
- [ ] Dark mode: dashed border and muted opacity render correctly
- [ ] Library teaser is not tappable / no onclick handler

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/more.js` — removed `{ id: 'explore', ... }` from ptCards array, renders standalone library teaser into `#libraryTeaser` div with book SVG icon, rebranded title and subtitle. `index.html` — added `<div id="libraryTeaser">` inside prayer tools section. `css/app.css` — added `.library-teaser` with dashed border, 0.6 opacity, flex layout, and scoped title/subtitle overrides, dark mode border override.
- **Approach:** Extracted the library card from the prayer tools grid into a standalone div rendered after the grid. Uses dashed border to signal "coming soon" state. No onclick handler — card is purely visual.
- **Deviations from spec:** None.
- **Known issues:** None observed.

---

## Cross-Cutting Concerns

### Events + More Tab Interaction

The events section on the Saved tab and the More tab both serve the user's daily experience. If the events section is enhanced with category icons and seasonal tinting (EMT-01), the More tab's prayer tools should use a *compatible* but *distinct* visual language — category icons for events, tool icons for prayer tools, both using the same color system but different shapes (rounded squares for events, circles for prayer tools).

### Cascading Impacts

| Change | Impacts |
|--------|---------|
| EMT-01-A category icons in event rows | Event rows in the church detail "Community Life" section should also get icons for consistency |
| EMT-02-A readings moved above prayer tools | When Catholic Library ships, it should slot between prayer tools and Faith Guides (its teaser already occupies this position). When Daily Formation is re-enabled, it should slot between readings and prayer tools. |
| EMT-03-B contextual highlight | If "Pray for Me" counter (IDEA-006) ships, it could be a promoted card during prayer emphasis periods |
| EMT-04-C liturgical context subtitle | Requires readings and litcal to coordinate — already happens via `renderMore()` sequencing |

### Implementation Priority

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| EMT-02-A Reorder More tab sections | 15 min | Medium — better daily flow | **P0** |
| EMT-05 Library teaser rebrand + extract from grid | 20 min | Medium — cleaner grid, better teaser | **P0** |
| EMT-01-A Event row icons + categories | 1.5 hrs | High — transforms event section | **P1** |
| EMT-04 Readings warmth | 1 hr | Medium — emotional upgrade | **P1** |
| EMT-03 Prayer tools visual upgrade | 1.5 hrs | Medium — better engagement | **P2** |
| EMT-01-B Seasonal tinting | 30 min | Medium — seasonal context | **P2** |
| EMT-01-C Title truncation | 30 min | Low-medium — data quality | **P2** |
| EMT-02-B Section headers | 30 min | Low — narrative polish | **P3** |

### Dark Mode Checklist

All items must be tested in dark mode. Key risk areas:
- EMT-01-A: Category icon background tints need `html[data-theme="dark"]` overrides
- EMT-01-B: Seasonal purple/gold borders need dark-mode verified colors
- EMT-03-A: Prayer tool icon circular backgrounds
- EMT-04-B: Georgia italic text legibility on dark surfaces
- EMT-04-D: Gospel accent border in dark mode
- EMT-05-A: Library teaser dashed border and muted opacity on dark surface

### Relationship to IDEAS.md

| Spec Item | Related IDEAS |
|-----------|--------------|
| EMT-01 Event enhancement | IDEA-045 (today events visual distinction) |
| EMT-02 More tab reorder | IDEA-024 (Prayer Life location), IDEA-026 (redundant season label) |
| EMT-03 Prayer tool highlight | IDEA-053 (reimagine Prayer Life) |
| EMT-04 Readings warmth | IDEA-003 (read-aloud for readings — natural companion) |
| EMT-05 Library teaser | IDEA-051 (Summa research), IDEA-053 (reimagine study tools) — Library replaces vague placeholder with concrete vision |
