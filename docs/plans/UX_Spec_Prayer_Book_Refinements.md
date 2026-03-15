# UX Spec: Prayer Book & Content Access Refinements

**Prefix:** PBR (Prayer Book Refinements)
**Created:** 2026-03-15
**Status:** Ready for implementation
**Priority:** P2 (implement after PMV)
**Scope:** Prayer Book internal UX, sacred pause tuning, cross-content discovery hooks
**Files affected:** `src/prayerbook.js`, `src/reader.js`, `css/app.css`

---

## Problem Statement

The Prayer Book (PMB series, built 2026-03-14/15) contains 31 prayers across 5 categories, 2 guided litanies (51 invocations), and Lectio Divina — a substantial collection. But the internal browsing experience treats every item identically: flat accordion rows with chevrons, under uppercase category headers. Three specific friction points emerge from walking the demographics:

**Dorothy (72):** Opens the Prayer Book before bed. She prays the Guardian Angel Prayer and the Hail Holy Queen every night. Every time she opens the Prayer Book, she waits through a sacred pause (2.5 seconds), then scrolls past 10 "Essential Prayers" to reach "Morning & Evening" (Guardian Angel) and then scrolls further to "Marian Prayers" (Hail Holy Queen). No memory of her last-used prayers.

**Marcus (25):** Hears the Memorare mentioned at a talk. Opens the Prayer Book, types "Memorare" in search — finds it instantly. Good. But if he doesn't know the name? He scrolls through 31 identically-styled rows across 5 categories with no visual signal of what's a 16-word sign of the cross vs a 224-word Nicene Creed vs an interactive guided litany.

**Sarah (45):** Needs to look up the Grace Before Meals while the family waits at dinner. Opens Prayer Book → 2.5-second sacred pause → scroll to "Morning & Evening" → find "Grace Before Meals" → expand. This took 8+ seconds for a 22-word prayer. The sacred pause, designed for contemplative tools, adds friction to a utilitarian reference lookup.

---

## Spec Items

### PBR-01 — Remove Sacred Pause from Prayer Book Entry

**What:** Remove `prayerbook` from the `PRAYER_MODES` set in `src/reader.js` line 77.

**Why:** The Sacred Pause system (SLV-07/08) is designed for guided prayer experiences that involve sustained meditation: Rosary (20 min), Chaplet (10 min), Stations (15 min), even Novena (daily tracking). The pause centers the user: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen."

The Prayer Book is a *reference tool*. Its primary use case is "look up the words to a prayer." Adding 2.5 seconds of mandatory centering before a reference lookup violates the progressive disclosure principle — don't add friction to simple tasks. The user who opens the Prayer Book to find the Memorare is not in the same mental state as the user who opens the Rosary for a guided meditation.

**Before:**
```js
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };
```

**After:**
```js
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 };
```

**Note:** The Lectio Divina step-through (accessed *within* the Prayer Book) is a contemplative experience. But by the time a user navigates to it, they've already made an intentional choice to enter a guided meditation. The *entry* to the Prayer Book should be friction-free.

**Test checklist:**
- [ ] Opening Prayer Book goes directly to the list (no sacred pause)
- [ ] Opening Rosary still shows sacred pause
- [ ] Opening Chaplet still shows sacred pause
- [ ] Opening Stations still shows sacred pause
- [ ] Opening Novena still shows sacred pause

---

### PBR-02 — Quick Access: Surface 5 Essential Prayers Above Categories

**What:** Add a "Quick Access" row at the top of the Prayer Book list (above the search input) showing the 5 most universally used prayers as compact tappable pills that expand inline.

**Prayers:** Sign of the Cross · Our Father · Hail Mary · Glory Be · Act of Contrition

**Why:** These 5 prayers account for the vast majority of Prayer Book lookups. In a physical missal, they're printed on a separate card at the front. Currently they're buried as items 1–5 inside the "Essential Prayers" category alongside 5 other prayers. A dedicated quick-access row eliminates scrolling for the most common use case.

**Design:** Horizontal scrollable row of small pills, each showing the prayer name. Tapping a pill scrolls to and opens that prayer in the main list below (reusing the existing `prayerbookToggle()` mechanism).

```css
.prayerbook-quick { display:flex;gap:var(--space-2);overflow-x:auto;scrollbar-width:none;padding:var(--space-2) 0 var(--space-3);-webkit-overflow-scrolling:touch; }
.prayerbook-quick::-webkit-scrollbar { display:none; }
.prayerbook-quick-pill { flex-shrink:0;padding:var(--space-2) var(--space-3);border:1px solid var(--color-border-light);border-radius:var(--radius-full);font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-medium);color:var(--color-text-secondary);background:var(--color-surface);cursor:pointer;-webkit-tap-highlight-color:transparent;white-space:nowrap;min-height:36px;display:flex;align-items:center; }
.prayerbook-quick-pill:active { background:var(--color-surface-hover); }
html[data-theme="dark"] .prayerbook-quick-pill { background:var(--color-surface);border-color:var(--color-border); }
```

**JS in `prayerbook.js` `_renderList()`:** Before the search input, when not in search mode:
```js
if (!_searchQuery) {
  var quickIds = ['sign-of-the-cross', 'our-father', 'hail-mary', 'glory-be', 'act-of-contrition'];
  html += '<div class="prayerbook-quick">';
  quickIds.forEach(function(id) {
    var prayer = null;
    _data.categories.forEach(function(cat) {
      cat.prayers.forEach(function(p) { if (p.id === id) prayer = p; });
    });
    if (prayer) {
      html += '<button class="prayerbook-quick-pill" onclick="prayerbookToggle(\'' + utils.esc(prayer.id) + '\')">'
        + utils.esc(prayer.title) + '</button>';
    }
  });
  html += '</div>';
}
```

**Behavior:** Tapping a quick-access pill opens that prayer's accordion in the main list and scrolls to it (existing behavior via `prayerbookToggle()`).

**Test checklist:**
- [ ] Quick access row shows 5 pills: Sign of the Cross, Our Father, Hail Mary, Glory Be, Act of Contrition
- [ ] Tapping a pill expands that prayer and scrolls to it
- [ ] Quick access row not shown during search
- [ ] Horizontal scroll works when pills overflow (narrow screens)
- [ ] Touch targets ≥ 36px height (44pt with gap)
- [ ] Dark mode renders correctly

---

### PBR-03 — Guided Content Visual Distinction

**What:** Give the "Guided Litanies" and "Contemplative" (Lectio Divina) sections a visually distinct treatment from the static prayer categories.

**Why:** The Litany of Humility (23 invocations, step-through) and Lectio Divina (4-step guided meditation) are fundamentally different from looking up the text of the Guardian Angel Prayer. Currently all sections use identical `.prayerbook-category-title` treatment. A user sees "Essential Prayers" and "Guided Litanies" with the same visual weight and no indication that one is a list of text and the other is an interactive experience.

**Before:** Guided litanies and Lectio Divina render with the same `.prayerbook-category-title` uppercase label as static categories.

**After:** Add a section divider before guided content and use a slightly different title treatment:

```css
.prayerbook-guided-section {
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
.prayerbook-guided-section .prayerbook-category-title {
  color: var(--color-sacred-text);
}
html[data-theme="dark"] .prayerbook-guided-section {
  border-top-color: color-mix(in srgb, var(--color-sacred) 10%, transparent);
}
```

**JS:** Wrap the litanies and lectio rendering in a `.prayerbook-guided-section` div:
```js
html += '<div class="prayerbook-guided-section">';
// Litanies
if (_data.litanies && _data.litanies.length) {
  html += '<div class="prayerbook-category">';
  html += '<h3 class="prayerbook-category-title">Guided Litanies</h3>';
  // ...
}
// Lectio Divina
if (_data.lectio) {
  html += '<div class="prayerbook-category">';
  html += '<h3 class="prayerbook-category-title">Contemplative</h3>';
  // ...
}
html += '</div>'; // close guided section
```

**Test checklist:**
- [ ] Sacred-tinted divider line above "Guided Litanies"
- [ ] Category title color shifts to `--color-sacred-text` for guided sections
- [ ] Divider not shown during search mode
- [ ] Dark mode divider visible but subtle
- [ ] No visual regression on static categories above the divider

---

### PBR-04 — Prayer Length Indicator

**What:** Add a subtle word-count indicator to prayer rows so users can anticipate length before expanding.

**Why:** The Prayer Book ranges from 16 words (Sign of the Cross) to 224 words (Nicene Creed). When all rows look identical, a user doesn't know if tapping will reveal 2 lines or 20. This matters for Sarah looking up a quick grace vs. the Nicene Creed for Mass.

**Design:** A tiny text label on the right side of the row header, before the chevron. Shows "brief" for ≤ 40 words, nothing for 40–100, and "long" for 100+. Extremely subtle — `--text-xs`, `--color-text-tertiary`.

```css
.prayerbook-length { font-size: 11px; color: var(--color-text-tertiary); font-weight: var(--weight-regular); margin-right: var(--space-2); flex-shrink: 0; }
```

**JS:** In `_renderPrayerRow()`, calculate word count:
```js
var wc = (prayer.text || '').split(/\s+/).length;
var lengthLabel = wc <= 40 ? 'brief' : wc > 100 ? 'long' : '';
// Add before chevron in row header:
html += (lengthLabel ? '<span class="prayerbook-length">' + lengthLabel + '</span>' : '');
```

**Test checklist:**
- [ ] "brief" label on short prayers (Sign of the Cross, Glory Be, Grace Before Meals)
- [ ] "long" label on substantial prayers (Nicene Creed, Angelus, Magnificat, St. Anthony)
- [ ] No label on medium-length prayers
- [ ] Labels disappear when prayer is expanded (already showing full text)
- [ ] Dark mode readable

---

### PBR-05 — Recently Opened Prayers (localStorage)

**What:** Track the last 3 opened prayers in `localStorage` and show a "Recent" section above the categories.

**Why:** Dorothy prays the same 3 prayers nightly. Currently she scrolls past 10 items in "Essential Prayers" every time. A "Recent" section surfaces her habits.

**Storage:** `mf-prayerbook-recent` → JSON array of last 3 prayer IDs, most recent first. Updated on every `prayerbookToggle()` open action.

```js
function _trackRecent(prayerId) {
  try {
    var recent = JSON.parse(localStorage.getItem('mf-prayerbook-recent') || '[]');
    recent = recent.filter(function(id) { return id !== prayerId; });
    recent.unshift(prayerId);
    if (recent.length > 3) recent = recent.slice(0, 3);
    localStorage.setItem('mf-prayerbook-recent', JSON.stringify(recent));
  } catch (e) {}
}
```

**Rendering:** Above categories, after quick access pills, when not searching and at least 1 recent prayer exists:
```css
.prayerbook-recent-label {
  font-size: var(--text-xs);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: var(--space-2);
  padding-left: var(--space-1);
}
```

Recent prayers render as standard `.prayerbook-row` elements (same expand/collapse behavior).

**Privacy:** Prayer book browsing is not sensitive in the same way as examination items. Storing recently-viewed prayer titles in localStorage is appropriate. No confession or examination data is involved.

**Test checklist:**
- [ ] First visit: no "Recent" section shown
- [ ] Open a prayer → close → reopen Prayer Book → prayer appears in Recent
- [ ] Up to 3 recent prayers shown, most recent first
- [ ] Tapping a recent prayer expands it and scrolls to its position
- [ ] Recent section hidden during search
- [ ] localStorage key: `mf-prayerbook-recent`

---

## Implementation Sequence

1. **PBR-01** (sacred pause removal) — 1-line change, no cascading risk
2. **PBR-02** (quick access pills) — HTML/CSS addition, no existing code modified
3. **PBR-03** (guided section divider) — CSS + minor HTML wrapper
4. **PBR-04** (length indicator) — Small JS + CSS addition
5. **PBR-05** (recently opened) — localStorage + render logic

Items 2–5 can be batched into a single commit.

---

## Visual Summary

```
┌─────────────────────────────────────┐
│  Prayer Book                    [✕] │
├─────────────────────────────────────┤
│                                     │
│ [Sign of Cross] [Our Father]        │
│ [Hail Mary] [Glory Be] [Act of C.] │  ← QUICK ACCESS (PBR-02)
│                                     │
│ 🔍 Search prayers...               │
│                                     │
│ RECENT                              │  ← PBR-05
│ ┌─ Guardian Angel Prayer        ▾ ┐│
│ ┌─ Hail, Holy Queen        brief ▾┐│
│                                     │
│ ESSENTIAL PRAYERS                   │
│ ┌─ Sign of the Cross       brief ▾┐│
│ ┌─ Our Father                    ▾┐│
│ ┌─ Hail Mary                     ▾┐│
│ ┌─ ...                           ▾┐│
│ ┌─ Nicene Creed            long  ▾┐│
│                                     │
│ MORNING & EVENING                   │
│ ...                                 │
│                                     │
│ ──────── sacred divider ──────────  │  ← PBR-03
│                                     │
│ GUIDED LITANIES                     │
│ ┌─ Litany of Humility     Guided ┐│
│ ┌─ Litany of Trust         Guided ┐│
│                                     │
│ CONTEMPLATIVE                       │
│ ┌─ Lectio Divina           Guided ┐│
│                                     │
└─────────────────────────────────────┘
```
