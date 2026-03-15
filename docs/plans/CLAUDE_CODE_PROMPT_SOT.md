# Claude Code Implementation Prompt — SOT Series (Seasonal Offerings Triage)

**Spec:** `docs/plans/UX_Spec_Seasonal_Offerings_Triage.md`
**Prefix:** SOT
**Priority:** SOT-01 + SOT-02 + SOT-05 must ship by March 31 (Holy Week starts April 1)

---

## Pre-flight

```bash
git checkout main && git pull
head -170 css/app.css   # verify tokens
cat CLAUDE.md            # read conventions
```

Read the full spec at `docs/plans/UX_Spec_Seasonal_Offerings_Triage.md` before starting.

---

## Implementation Order

### 1. SOT-01 — Seasonal Moment Container

**Files:** `index.html`, `css/app.css`, `src/more.js`

**index.html:** Insert between `saintSection` and `readingsSection` (after line ~123):
```html
<div class="more-section more-section--tight" id="seasonalMoment"></div>
```

**css/app.css:** Add the `.seasonal-card` family from the spec (see SOT-01 CSS spec section). Place near the existing `.prayer-tool-card` styles (~line 1603). Include both light and `html[data-theme="dark"]` variants.

**src/more.js:** Add a `_renderSeasonalMoment()` function called from `renderMore()`. For now, implement the container and priority logic skeleton. Cards will be added in subsequent SOT items. The function should:
- Get today's date and litcal data from `window._litcalCache`
- Build an array of candidate cards with priority levels (1=day, 2=week, 3=season, 4=month)
- Sort by priority, take top 2
- Render into `#seasonalMoment`
- If no candidates, leave the container empty (CSS hides it via `:empty`)

### 2. SOT-02 — Liturgical Color in Saint Card

**Files:** `src/readings.js`, `css/app.css`

**src/readings.js:** In `renderSaintCard()` (~line 500), after the `alsoToday` variable, add:
```javascript
var colorMap = {
  purple: { hex: '#6B21A8', name: 'Purple', meaning: 'Penance & preparation' },
  red: { hex: '#DC2626', name: 'Red', meaning: 'Martyrs & the Holy Spirit' },
  white: { hex: '#F8F7F4', name: 'White', meaning: 'Joy & purity' },
  green: { hex: '#16A34A', name: 'Green', meaning: 'Growth & hope' },
  rose: { hex: '#DB2777', name: 'Rose', meaning: 'A brief respite in the penitential season' }
};
var colorInfo = colorMap[color] || colorMap.green;
var colorLine = '<div class="saint-color">'
  + '<span class="saint-color-dot" style="background:' + colorInfo.hex + '"></span>'
  + esc(colorInfo.name) + ' — ' + esc(colorInfo.meaning)
  + '</div>';
```
Insert `colorLine` after `alsoToday` in the innerHTML template.

**Dark mode hex overrides:** Use the same hex values already in the saint card dark mode CSS (lines 1726-1730) for the dot colors in dark mode. Add:
```css
html[data-theme="dark"] .saint-color-dot[style*="#6B21A8"] { background: #A855F7 !important; }
/* etc. for each color */
```
Or better: use CSS custom properties set by `data-lit-color` attribute that already exists on `.saint-card`.

**css/app.css:** Add `.saint-color` and `.saint-color-dot` styles near the existing saint card styles (~line 1940).

### 3. SOT-05 — Holy Week Day-by-Day Guide

**Files:** `src/more.js` (or new `src/seasonal.js` if preferred for separation), `css/app.css`

**Data:** Add a `HOLY_WEEK_GUIDE` object keyed by litcal event key (or by day offset from Easter). Each entry:
```javascript
var HOLY_WEEK_GUIDE = {
  'PalmSun': {
    title: 'Palm Sunday',
    subtitle: 'The Procession of Palms',
    icon: '...svg...',
    body: '...~150 words in HTML...',
    findLabel: 'Palm Sunday Mass',
    filter: 'weekend'
  },
  // ... Holy Thursday, Good Friday, Holy Saturday, Easter Sunday
  // Monday-Wednesday can share a generic "Days of Holy Week" entry
};
```

**Render logic:** In `_renderSeasonalMoment()`, check if today's litcal events include any Holy Week keys. If so, create a card with priority 1 (day-specific) and add it to the candidates array.

**Card HTML:** Use the `.seasonal-card` pattern from SOT-01. Expandable via `<details>`:
```html
<details class="seasonal-card">
  <summary>
    <div class="seasonal-card-icon">...svg...</div>
    <div class="seasonal-card-body">
      <div class="seasonal-card-title">Holy Thursday</div>
      <div class="seasonal-card-subtitle">Mass of the Lord's Supper tonight</div>
    </div>
    <svg class="seasonal-card-chevron">...</svg>
  </summary>
  <div class="seasonal-card-expanded">
    ...body in --font-prayer...
    <div class="seasonal-card-action" onclick="switchTab(...)">Find Mass near you →</div>
  </div>
</details>
```

**Body text:** Use `--font-prayer` (Georgia) for the descriptive content. Keep each day's body under 150 words. Include 1 action link per day.

### 4. SOT-03 — Novena Auto-Surfacing

**Files:** `src/more.js`

In the existing `renderMore()` prayer tools section, modify the `promotedId` logic (~line 165) to add seasonal novena detection:

```javascript
// After existing promotedId logic:
var now = new Date();
var litEvents = (window._litcalCache && window._litcalCache.events) || [];
// Check for Divine Mercy Novena window (Good Friday through Divine Mercy Sunday)
// Check for Holy Spirit Novena window (Ascension through Pentecost)
// Check for St. Joseph month (March 10-19)
// If match, set promotedId = 'novena' and update subtitle
```

Update the novena's subtitle text to be contextual during promotion windows. Change `ptColors.novena` and `ptBgColors.novena` to use accent colors during promotion.

### 5-9. Remaining SOT items

Follow the spec for SOT-06 (Easter Alleluia), SOT-07 (Divine Mercy Sunday), SOT-08 (Pentecost Novena), SOT-09 (Monthly Devotion), SOT-04 (Seasonal CCC). Each adds a card definition to the `_renderSeasonalMoment()` candidates array with appropriate priority level and date logic.

---

## Key Conventions

- **CommonJS everywhere, no arrow functions** (per CLAUDE.md)
- **`var` not `let`/`const`**
- **`esc()` from utils.js** for all user-facing text
- **`var(--color-accent)`** for seasonal borders — never hardcode hex
- **`--font-prayer`** (Georgia) for sacred text
- **`--font-display`** (Playfair) for card titles
- **SVG icons only** — no emoji
- **Dark mode** for every new CSS class
- **Touch targets ≥ 44×44pt** (min-height: 48px on cards)
- **Test with dev panel date override** if available

## Do NOT

- Add new HTML `<script>` or `<link>` tags
- Create new external API calls
- Modify the Find tab, Map tab, or Saved tab
- Add any npm dependencies
- Force push
