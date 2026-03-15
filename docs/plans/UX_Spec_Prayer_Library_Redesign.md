# UX Spec: Prayer Library Redesign (PLR Series)

**Created:** 2026-03-15  
**Backlog items:** IDEA-107, IDEA-105, IDEA-112, IDEA-132, IDEA-135  
**Scope:** Complete internal redesign of the Prayer Book reader module  
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_PLR.md`  
**Depends on:** PZP series (should be implemented first for zone context)

---

## Context

The Prayer Book (`src/prayerbook.js`, 609 lines) contains 31 prayers across 5 categories, 2 guided litanies, and Lectio Divina. It renders inside the reader overlay as a flat list of accordion rows. Five converging backlog items point to a unified redesign:

- **IDEA-135:** z-index bug on search bar + structural revamp umbrella
- **IDEA-107:** Visually basic, uninspiring — needs soul
- **IDEA-105:** Sticky search with category filters
- **IDEA-112:** Guided prayers elevated above static text
- **IDEA-132:** User-configurable favorites bar replacing Angelus card

The entire render path is `_renderList()` (lines ~348–460 of prayerbook.js) and ~35 CSS rules (lines 1638–1872, 1905–1906 of app.css).

---

## PLR-01 — Fix Search Bar Z-Index Bug

**ID:** PLR-01  
**Category:** bug  
**Backlog:** IDEA-135  
**Priority:** P1

**Problem:**  
The search bar (`.prayerbook-search`) is `position:sticky; top:0; z-index:2` (line 1856 of app.css). But the reader body (`.reader-body`) has `overflow-y:auto` (line 2238) and the reader header has `z-index:1` (line 2230). When the user scrolls, prayer rows with `border-color` transitions (`.prayerbook-row--open`) can paint above the search bar because the stacking context within `.reader-body` doesn't properly isolate the search. The quick pills row scrolls under the search bar but the search bar's background doesn't fully occlude content during scroll.

**Fix:**

**File:** `css/app.css`, line 1856  
**Before:**
```css
.prayerbook-search { position:sticky;top:0;z-index:2;background:var(--color-background);padding:var(--space-2) 0 var(--space-3); }
```
**After:**
```css
.prayerbook-search { position:sticky;top:0;z-index:10;background:var(--color-background);padding:var(--space-2) 0 var(--space-3);margin:0 calc(-1 * var(--space-5));padding-left:var(--space-5);padding-right:var(--space-5); }
```

Changes: `z-index:2` → `z-index:10` (safely above any row). Negative margin + padding trick ensures the sticky background extends to full reader-body width (the reader body has `padding:var(--space-5)`), preventing content from peeking through at the edges during scroll.

**Dark mode:** Background uses `--color-background` which is already dark-mode aware.

**Test checklist:**
- [ ] Scroll prayer list — search bar stays above all content
- [ ] No content peeks through at left/right edges during scroll
- [ ] Search input still functional, focus ring visible
- [ ] Dark mode: background fully opaque during scroll

---

## PLR-02 — Category Quick Filters Replacing Per-Prayer Pills

**ID:** PLR-02  
**Category:** enhancement  
**Backlog:** IDEA-105  
**Priority:** P1

**Problem:**  
The current quick-access pills (PBR-02) list 5 specific prayers: Sign of the Cross, Our Father, Hail Mary, Glory Be, Act of Contrition. This works for the 5 most common prayers but doesn't scale — users who pray the Memorare daily or the Guardian Angel prayer each morning have no quick path. More importantly, 31 prayers across 5 categories are hard to scan without filtering.

**Fix:**  
Replace the per-prayer pills with category filter chips. Tapping a chip filters the list to that category. Tapping again clears the filter. Multiple chips can be active (OR logic).

**Categories from data:** Essential Prayers (10), Morning & Evening (7), Marian Prayers (7), Prayers to Saints (4), Sacramental Prayers (3)

**Shorter chip labels:**
- "Essential" (for Essential Prayers)
- "Daily" (for Morning & Evening)
- "Marian" (for Marian Prayers)
- "Saints" (for Prayers to Saints)
- "Sacrament" (for Sacramental Prayers)
- "Guided" (for Litanies + Lectio Divina)

**File:** `src/prayerbook.js`, in `_renderList()` — replace the `quickIds` block (~lines 358–371)

**Before:**
```js
var quickIds = ['sign_of_cross', 'our_father', 'hail_mary', 'glory_be', 'act_of_contrition_traditional'];
html += '<div class="prayerbook-quick">';
quickIds.forEach(function(id) {
  var prayer = null;
  _data.categories.forEach(function(cat) {
    cat.prayers.forEach(function(p) { if (p.id === id) prayer = p; });
  });
  if (prayer) {
    html += '<button class="prayerbook-quick-pill" onclick="prayerbookToggle(\'' + utils.esc(prayer.id) + '\')">'
      + utils.esc(_t(prayer, 'title')) + '</button>';
  }
});
html += '</div>';
```

**After:**
```js
var chipLabels = [
  { filter: 'essential_prayers', label: 'Essential' },
  { filter: 'morning_evening', label: 'Daily' },
  { filter: 'marian', label: 'Marian' },
  { filter: 'saints', label: 'Saints' },
  { filter: 'sacramental', label: 'Sacrament' },
  { filter: 'guided', label: 'Guided' }
];
html += '<div class="prayerbook-quick">';
chipLabels.forEach(function(c) {
  var active = _activeFilters.indexOf(c.filter) >= 0;
  html += '<button class="prayerbook-quick-pill' + (active ? ' prayerbook-quick-pill--active' : '') + '"'
    + ' onclick="prayerbookToggleFilter(\'' + c.filter + '\')">'
    + c.label + '</button>';
});
html += '</div>';
```

**New state variable** at top of prayerbook.js:
```js
var _activeFilters = [];  // category filter IDs
```

**New function:**
```js
function prayerbookToggleFilter(filterId) {
  var idx = _activeFilters.indexOf(filterId);
  if (idx >= 0) _activeFilters.splice(idx, 1);
  else _activeFilters.push(filterId);
  _openPrayerId = null;
  _renderList();
  _haptic();
}
```

**Filter logic** in the category rendering loop: if `_activeFilters.length > 0`, only render categories whose ID matches an active filter. The "guided" filter shows the litanies + lectio section. Map category titles to filter IDs in prayerbook.json by adding an `id` field to each category, or match by index position.

**CSS for active state:**

**File:** `css/app.css`, after line 1643  
**Add:**
```css
.prayerbook-quick-pill--active { background:var(--color-sacred-pale);color:var(--color-sacred-text);border-color:var(--color-sacred); }
html[data-theme="dark"] .prayerbook-quick-pill--active { background:color-mix(in srgb, var(--color-sacred) 15%, transparent);color:var(--color-sacred);border-color:var(--color-sacred); }
```

**Dark mode:** Covered by the dark rule above.

**Test checklist:**
- [ ] 6 chips render: Essential, Daily, Marian, Saints, Sacrament, Guided
- [ ] Tapping "Marian" shows only Marian Prayers category
- [ ] Tapping "Marian" again clears the filter
- [ ] Multiple active filters show all matching categories (OR)
- [ ] "Guided" filter shows litanies + lectio section
- [ ] Active chip has sacred gold styling
- [ ] Horizontal scroll on small screens — chips don't wrap
- [ ] Search still works independently of filters
- [ ] Dark mode: active chips have subtle sacred tint

---

## PLR-03 — Guided Prayers Elevated to Top

**ID:** PLR-03  
**Category:** enhancement  
**Backlog:** IDEA-112  
**Priority:** P1

**Problem:**  
Guided litanies and Lectio Divina are buried below all 31 static prayers in a section separated by a thin sacred-tinted border (`.prayerbook-guided-section`). They offer a fundamentally different experience — immersive step-through with wake lock and swipe navigation — but look like slightly accented accordion rows. Dorothy scrolls past them because they blend in. Paul never discovers them.

**Fix:**

Move the guided section to the TOP of the list, before categories, and give it a distinct card treatment.

**File:** `src/prayerbook.js` — restructure `_renderList()`

Currently the guided section is rendered after all categories (~lines 418–449). Move it to render immediately after the search bar and before the Recent section.

**New visual treatment for guided items:**

Replace `.prayerbook-row--guided` with a card that matches the prayer tool cards from the More tab grid — sacred left border, icon circle, body with title + subtitle.

```html
<div class="prayerbook-guided-card" onclick="prayerbookOpenLitany('litany_humility')">
  <div class="prayerbook-guided-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
    </svg>
  </div>
  <div class="prayerbook-guided-body">
    <div class="prayerbook-guided-title">Litany of Humility</div>
    <div class="prayerbook-guided-sub">Guided · Swipe through</div>
  </div>
  <span class="prayerbook-guided-badge">Guided</span>
</div>
```

**CSS for guided cards:**

```css
.prayerbook-guided-card { display:flex;align-items:center;gap:var(--space-3);padding:var(--space-3) var(--space-4);background:var(--color-surface);border:1px solid var(--color-border-light);border-left:3px solid var(--color-sacred);border-radius:var(--radius-md);cursor:pointer;-webkit-tap-highlight-color:transparent;min-height:52px;margin-bottom:var(--space-2);transition:box-shadow 0.15s, transform 0.15s; }
.prayerbook-guided-card:active { transform:scale(0.98); }
.prayerbook-guided-card:hover { box-shadow:var(--shadow-card-hover); }
.prayerbook-guided-icon { width:32px;height:32px;border-radius:50%;background:var(--color-sacred-pale);color:var(--color-sacred);display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.prayerbook-guided-icon svg { width:18px;height:18px; }
.prayerbook-guided-body { flex:1;min-width:0; }
.prayerbook-guided-title { font-size:var(--text-base);font-weight:var(--weight-medium);color:var(--color-text-primary);line-height:1.3; }
.prayerbook-guided-sub { font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:1px; }
html[data-theme="dark"] .prayerbook-guided-card { border-left-color:var(--color-sacred);background:var(--color-surface); }
```

Add a section label: `<div class="prayerbook-category-title">Guided Experiences</div>`

**Dark mode:** Covered inline above.

**Test checklist:**
- [ ] Guided section appears ABOVE Recent and all categories
- [ ] Litany of Humility, Litany of Trust, and Lectio Divina each render as cards with sacred left border
- [ ] Tapping a guided card opens the experience (litany step-through or lectio)
- [ ] Cards have 44px+ min-height (touch target)
- [ ] When category filter "Guided" is active, only this section shows
- [ ] When another filter is active and "Guided" is not, this section hides
- [ ] Dark mode: sacred accent visible, surface appropriate

---

## PLR-04 — Favorites System with Quick Access Strip

**ID:** PLR-04  
**Category:** new feature  
**Backlog:** IDEA-132  
**Priority:** P2

**Problem:**  
Users who pray the same 2–3 prayers daily must scroll through the full list each time. The Angelus card on the More tab occupies prime real estate that could serve as a quick-access favorites bar. PBR-05 added a "Recent" section but recents are passive — they reflect past behavior, not intentional bookmarks.

**Fix:**

Add a star/favorite toggle to each prayer row. Favorited prayers appear in a persistent "Favorites" strip at the top of the Prayer Book, above the guided section. The strip also renders as a condensed row on the More tab, replacing the Angelus card position.

**A. Favorite toggle on prayer rows:**

In `_renderPrayerRow()`, add a star icon to each row header:

```html
<button class="prayerbook-fav-btn" onclick="event.stopPropagation();prayerbookToggleFav('PRAYER_ID')" aria-label="Favorite">
  <svg class="prayerbook-fav-icon ACTIVE_CLASS" viewBox="0 0 24 24" fill="FILL" stroke="currentColor" stroke-width="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
</button>
```

Where `FILL` is `var(--color-sacred)` when favorited, `none` when not, and `ACTIVE_CLASS` is `prayerbook-fav-icon--active` when favorited.

**New state + functions:**

```js
var _favorites = []; // loaded from localStorage

function _loadFavorites() {
  try { _favorites = JSON.parse(localStorage.getItem('mf-prayerbook-favs') || '[]'); } catch(e) { _favorites = []; }
}

function prayerbookToggleFav(prayerId) {
  _loadFavorites();
  var idx = _favorites.indexOf(prayerId);
  if (idx >= 0) _favorites.splice(idx, 1);
  else { _favorites.push(prayerId); if (_favorites.length > 5) _favorites.shift(); }
  localStorage.setItem('mf-prayerbook-favs', JSON.stringify(_favorites));
  _renderList();
  _haptic();
}
```

Max 5 favorites to prevent the strip from becoming a second full list.

**B. Favorites strip in Prayer Book:**

If favorites exist, render a strip above guided section:

```html
<div class="prayerbook-favs-strip">
  <div class="prayerbook-category-title">Favorites</div>
  <!-- compact pill-style buttons for each favorite -->
</div>
```

**C. CSS:**

```css
.prayerbook-fav-btn { background:none;border:none;padding:var(--space-1);cursor:pointer;-webkit-tap-highlight-color:transparent;display:flex;align-items:center;min-width:44px;min-height:44px;justify-content:center; }
.prayerbook-fav-icon { width:18px;height:18px;color:var(--color-text-tertiary);transition:color 0.15s; }
.prayerbook-fav-icon--active { color:var(--color-sacred);fill:var(--color-sacred); }
```

**D. More tab integration (IDEA-132):**

This is a separate step. Once the favorites system exists in the Prayer Book, the Angelus card slot on the More tab (lines 568–623 of `src/more.js`) can conditionally render a favorites strip when the user has ≥1 favorite. If no favorites exist, the Angelus/Regina Caeli renders as before.

**Implementation note:** The More tab integration should be spec'd separately once PLR-04 core is implemented — it touches `more.js` which is a different module and involves conditional logic around the Angelus. For now, PLR-04 is scoped to the Prayer Book internal favorites only.

**Dark mode:** Star icon uses `--color-sacred` which is dark-mode aware.

**Test checklist:**
- [ ] Each prayer row has a star icon (unfilled by default)
- [ ] Tapping star fills it with sacred gold and adds to favorites
- [ ] Favorites strip appears above guided section (max 5 items)
- [ ] Tapping a favorite prayer in the strip opens/expands it
- [ ] Tapping filled star removes from favorites
- [ ] Favorites persist across sessions (localStorage)
- [ ] 44pt touch target on star button
- [ ] Dark mode: star icon visible, filled state clear

---

## PLR-05 — Visual Warmth: Prayer Row Typography and Spacing

**ID:** PLR-05  
**Category:** refinement  
**Backlog:** IDEA-107  
**Priority:** P2

**Problem:**  
Prayer rows use `.font-body` (Source Sans) for titles and have tight `--space-1` (4px) margins between them. The accordion presentation is functional but feels like a settings menu, not a prayer companion. The expanded prayer text at `--text-sm` (14px) with `line-height:1.85` is comfortable but the container has no visual warmth — no sacred accents, no drop cap, no breathing room.

**Fix:**

**A. Row spacing and grouping:**

**File:** `css/app.css`, line 1861  
**Before:**
```css
.prayerbook-row { border:1px solid var(--color-border-light);border-radius:var(--radius-md);background:var(--color-surface);margin-bottom:var(--space-1);overflow:hidden;transition:box-shadow 0.15s; }
```
**After:**
```css
.prayerbook-row { border:1px solid var(--color-border-light);border-radius:var(--radius-md);background:var(--color-surface);margin-bottom:var(--space-2);overflow:hidden;transition:box-shadow 0.15s; }
```

Change: `margin-bottom:var(--space-1)` → `var(--space-2)` (8px). Gives each row more breathing room.

**B. Expanded prayer text enhancements:**

**File:** `css/app.css`, line 1867  
**Before:**
```css
.prayerbook-text { padding:0 var(--space-4) var(--space-4);font-family:var(--font-prayer);font-size:var(--text-sm);color:var(--color-text-primary);line-height:1.85; }
```
**After:**
```css
.prayerbook-text { padding:var(--space-2) var(--space-4) var(--space-4);font-family:var(--font-prayer);font-size:var(--text-base);color:var(--color-text-primary);line-height:1.85;border-top:1px solid color-mix(in srgb, var(--color-sacred) 8%, transparent); }
```

Changes: top padding added for separation from header, `--text-sm` → `--text-base` (16px) for readability, subtle sacred-tinted border-top separating title from text.

**C. Open row accent:**

**File:** `css/app.css`, line 1862 (already exists but enhance)  
**Before:**
```css
.prayerbook-row--open { border-color:var(--color-sacred);box-shadow:0 0 0 1px color-mix(in srgb, var(--color-sacred) 20%, transparent); }
```
**After:**
```css
.prayerbook-row--open { border-color:var(--color-sacred);border-left:3px solid var(--color-sacred);box-shadow:0 0 0 1px color-mix(in srgb, var(--color-sacred) 20%, transparent); }
```

Adds a 3px sacred left-border to the open row, visually consistent with the guided cards from PLR-03 and the Prayer Book gateway card on the More tab.

**Dark mode:** All color values use CSS variables and `color-mix` which are already dark-mode safe.

**Test checklist:**
- [ ] Prayer rows have 8px gaps between them (not 4px)
- [ ] Expanded prayer text is 16px Georgia, not 14px
- [ ] Open row has 3px sacred gold left border
- [ ] Subtle sacred-tinted line separates title from prayer text
- [ ] Text is comfortably readable at arm's length
- [ ] Dark mode: all accents visible, text legible

---

## Summary

| ID | Title | Priority | Files |
|----|-------|----------|-------|
| PLR-01 | Fix search bar z-index | P1 | app.css:1856 |
| PLR-02 | Category quick filter chips | P1 | prayerbook.js:~358-371, app.css |
| PLR-03 | Guided prayers elevated to top | P1 | prayerbook.js:_renderList, app.css |
| PLR-04 | Favorites system + strip | P2 | prayerbook.js, app.css |
| PLR-05 | Visual warmth: spacing + typography | P2 | app.css:1861,1862,1867 |

## Implementation order

1. PLR-01 (z-index fix — unblocks scrolling UX)
2. PLR-05 (visual warmth — foundational styling before restructuring)
3. PLR-03 (guided section repositioning — structural change)
4. PLR-02 (filter chips — replaces pills, depends on category structure)
5. PLR-04 (favorites — builds on top of everything else)
