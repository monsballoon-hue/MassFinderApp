# UX Spec: Prayer Tools Grid Restructure

**Prefix:** PMV (Prayer/More V2)
**Created:** 2026-03-15 · **Final:** 2026-03-15
**Status:** Ready for implementation
**Scope:** More tab Zone 2 only — prayer tool grid, Prayer Book card, practice strip
**Out of scope:** Zone 1 (Today), Zone 3 (Grow in Faith), library teaser, CCC/Bible surfacing
**Files affected:** `src/more.js`, `css/app.css`, `index.html`

---

## Problem

Seven prayer tools are presented through a flat 2×2 grid (3 sticky + 1 dynamic) plus a "More tools" accordion at 13px text. The grid conflates four different content types with identical visual treatment:

- **Guided prayer** (Rosary, Chaplet, Stations, Exam) — 10–25 min immersive, wake lock, sacred pause
- **Reference collection** (Prayer Book) — browse/search, read text, close
- **Accountability tracking** (Novena, First Friday) — log progress, check streaks

A 72-year-old cannot tell that the Rosary is a 20-minute meditation while the Prayer Book is a quick text lookup — both are identical cards. The Stations of the Cross, Novena Tracker, and First Friday are hidden behind a 13px "More tools" toggle that elderly users never find. The dynamic 4th slot causes position instability — Dorothy taps the top-right card expecting the Rosary but gets the Chaplet because it's 3 PM.

---

## Spec Items (4 items)

### PMV-02 — Fixed Guided Prayer Grid

**What:** The 2×2 grid contains exactly four immersive guided experiences in fixed positions: Rosary (top-left), Chaplet (top-right), Examination (bottom-left), Stations (bottom-right). No dynamic slot. Section title changes from "Prayer & Devotion" to "Guided Prayer."

**Dorothy (72):** Builds spatial memory after 3 visits. Rosary is always top-left. She taps without reading. Grid never rearranges — promotions are color-only (Stations gets accent during Lent, Chaplet subtitle turns green at 3 PM).

**Marcus (25):** Sees 4 guided experiences. "Guided Prayer" title signals interactivity. Dynamic subtitles ("Sorrowful Mysteries today," "The Hour of Mercy") make the grid feel alive. He taps Chaplet because the subtitle caught his eye.

**Sarah (45):** Four cards, spots Rosary, taps. 3 seconds. She's not choosing between a Rosary and looking up the Hail Mary — the grid is focused on "I want to pray right now."

**JS in `more.js`:**

Replace:
```js
var STICKY_IDS = { prayerbook: true, rosary: true, examination: true };
```
With:
```js
var GUIDED_IDS = { rosary: true, chaplet: true, examination: true, stations: true };
```

Only `GUIDED_IDS` items render into `#prayerToolsGrid`. Fixed order enforced in the `ptCards` array.

Remove `_resolveCardTiers()` — replaced by PMV-07.

**HTML:** Change section title:
```html
<h2 class="more-section-title more-section-title--pray">Guided Prayer</h2>
```

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

**Promotion rules (visual only — no position changes ever):**
- Lent: Stations icon → `--color-accent` / `--color-accent-pale`
- 3 PM: Chaplet subtitle → "The Hour of Mercy" with `prayer-tool-subtitle--active`
- Confession < 7 days: Exam subtitle → `prayer-tool-subtitle--active`
- Confession > 30 days: Exam subtitle → `prayer-tool-subtitle--nudge`

**Test checklist:**
- [ ] Grid: Rosary (top-left), Chaplet (top-right), Exam (bottom-left), Stations (bottom-right)
- [ ] Title: "Guided Prayer"
- [ ] Order never changes regardless of time, season, or active trackers
- [ ] Lent: Stations icon accent color
- [ ] 3 PM: Chaplet subtitle green
- [ ] Each card opens correct reader module with sacred pause
- [ ] Touch targets ≥ 44×44pt (min-height 88px)
- [ ] Dark mode correct
- [ ] No overflow on 320px viewport

---

### PMV-03 — Prayer Book Gateway Card

**What:** Below the guided grid, a full-width card provides the Prayer Book entry point. Its distinct shape (wide, not square) and descriptive subtitle signal "collection you browse" rather than "single tool you open."

**Dorothy (72):** Below the 4-card grid, she sees a wider card: book icon, "Prayer Book" in bold, "31 prayers · Guided litanies · Lectio Divina." A chevron says "opens something." She taps. The Prayer Book list loads instantly (no sacred pause — PBR-01). Different shape from the grid = different purpose. She gets it.

**Marcus (25):** Reads the subtitle. "Wait, there are litanies? And Lectio Divina?" He taps, discovers a searchable prayer collection plus guided litanies and a 4-step contemplative meditation tied to today's Gospel. The subtitle sold it — three phrases, three discovery hooks.

**Sarah (45):** Needs the Grace Before Meals. The wide card reads as "the reference section." She taps, types "grace," has the 22-word prayer in 4 seconds. No confusion with the meditation tools above.

**HTML:** New element after `#prayerToolsGrid`:
```html
<div id="prayerBookGateway"></div>
```

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

html[data-theme="dark"] .prayerbook-gateway {
  border-left-color: var(--color-sacred); background: var(--color-surface);
}
```

**JS in `renderMore()`:**
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
- [ ] Full-width card below the 2×2 grid
- [ ] Left border accent, chevron, visually distinct from grid cards
- [ ] Subtitle: "31 prayers · Guided litanies · Lectio Divina"
- [ ] Opens Prayer Book reader (no sacred pause)
- [ ] Touch target ≥ 44pt (min-height 56px)
- [ ] Desktop hover state
- [ ] Dark mode correct

---

### PMV-04 — Your Practice Strip

**What:** Below the Prayer Book gateway, a compact "Your Practice" strip shows Novena Tracker and First Friday & Saturday. Replaces the "More tools" accordion.

**Dorothy (72):** Has been praying the Surrender Novena for 5 days. Below the Prayer Book card, she sees two compact cards. "Novenas — Day 5 of 9" in green. She taps to log today. The green drew her eye. When nothing is active, the strip is muted — no urgency.

**Marcus (25):** Sees "Novenas — Guided prayer tracking" and "First Fri & Sat — Track devotion." The subtitles explain what these are — he didn't know either existed. He taps Novenas, discovers 9 options, starts the Surrender Novena. Next visit, the green "Day 1 of 9" reminds him to continue.

**Sarah (45):** No active trackers. The strip is muted — she scrolls past in half a second. Zero cognitive load. When she starts a novena later, the active state surfaces automatically.

**HTML:** Replace `#prayerToolsSecondaryWrap`:
```html
<div id="practiceStrip"></div>
```

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
.practice-card-title {
  font-size: var(--text-sm); font-weight: var(--weight-medium);
  color: var(--color-text-primary); line-height: 1.2;
}
.practice-card-subtitle {
  font-size: var(--text-xs); color: var(--color-text-secondary);
  line-height: 1.3; margin-top: 1px;
}
.practice-card--active .practice-card-subtitle { color: var(--color-verified); font-weight: var(--weight-medium); }

html[data-theme="dark"] .practice-card { background: var(--color-surface); }
html[data-theme="dark"] .practice-card:active { background: var(--color-surface-hover); }
html[data-theme="dark"] .practice-card-icon { background: var(--color-surface-hover); }
```

**JS:** Render two cards with active-state detection using existing `novenaActive`, `novSub`, `ffSub` variables. Use existing `ptIcons.novena` and `ptIcons.firstfriday` SVGs.

**Test checklist:**
- [ ] Two compact cards: Novenas and First Friday
- [ ] "Your Practice" label above
- [ ] Active novena → green subtitle, sacred icon bg
- [ ] Active FF → green subtitle, sacred icon bg
- [ ] Inactive → muted colors
- [ ] Subtitles always visible (not hidden like old secondary cards)
- [ ] Touch targets ≥ 44pt (min-height 48px)
- [ ] Dark mode correct

---

### PMV-07 — Promotion Simplification

**What:** Replace `_resolveCardTiers()` with `_getContextualState()`. All promotion is visual emphasis — color and subtitle changes — never position changes.

**Why:** `_resolveCardTiers()` managed a dynamic 4th primary slot, secondary sorting, and promoted-card bypass logic. With PMV-02 fixing the grid and PMV-04 giving trackers their own strip, this complexity is unnecessary. The new function returns flags that each section reads independently.

```js
function _getContextualState() {
  var ctx = {};
  ctx.stationsLent = isLentSeason();
  var nowH = new Date().getHours();
  var nowM = new Date().getMinutes();
  ctx.chapletHourOfMercy = (nowH === 14 && nowM >= 30) || nowH === 15;
  var confStatus = require('./examination.js').getConfessionStatus();
  ctx.examRecent = confStatus && confStatus.daysAgo <= 7;
  ctx.examNudge = confStatus && confStatus.daysAgo > 30;
  ctx.novenaLabel = _getNovenaSubtitle();
  ctx.novenaActive = ctx.novenaLabel.indexOf('Day') === 0 || ctx.novenaLabel.indexOf('in progress') !== -1;
  // Seasonal novena override logic preserved here
  var ffSub = _getFirstFridaySubtitle();
  ctx.ffLabel = ffSub.text;
  ctx.ffActive = ffSub.active;
  return ctx;
}
```

**Test checklist:**
- [ ] Grid positions never change
- [ ] Lent: Stations icon accent. Same position.
- [ ] 3 PM: Chaplet subtitle green. Same position.
- [ ] Active novena: practice card green. Grid untouched.
- [ ] Seasonal novena label overrides default subtitle
- [ ] Near First Friday: practice card green. Grid untouched.

---

## What is NOT touched

- Zone 1 (Today): saint card, seasonal moment, readings — unchanged
- Zone 3 (Grow in Faith): devotional guides, library teaser — unchanged
- Daily Formation: stays in current position
- CCC, Bible, Explore: no new entry points

---

## CSS to retire (mark, don't delete)

```css
/* PMV: retire after v2 stable */
.prayer-tool-card--secondary
.prayer-tools-secondary
.prayer-tools-more / .prayer-tools-more-toggle / .prayer-tools-more-chevron
```

---

## Implementation sequence

1. PMV-07 — Replace `_resolveCardTiers()`. Clears the path.
2. PMV-02 — Fix grid to 4 guided cards.
3. PMV-03 — Add Prayer Book gateway card.
4. PMV-04 — Replace secondary accordion with practice strip.

Can batch into one commit.
