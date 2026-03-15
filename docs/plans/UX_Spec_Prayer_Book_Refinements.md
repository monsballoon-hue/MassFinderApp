# UX Spec: Prayer Book Internal Navigation

**Prefix:** PBR (Prayer Book Refinements)
**Created:** 2026-03-15
**Status:** Ready for implementation
**Priority:** P2 (implement after PMV)
**Scope:** Prayer Book browsing experience inside the reader overlay
**Files affected:** `src/prayerbook.js`, `src/reader.js`, `css/app.css`

---

## Problem

The Prayer Book contains 31 prayers (5 categories), 2 guided litanies (51 invocations), and Lectio Divina. Every item is a flat accordion row with a chevron under an uppercase category header. No shortcuts, no memory, no content-type distinction, and a 2.5-second sacred pause on entry that penalizes quick lookups.

---

## Spec Items (5 items)

### PBR-01 — Remove Sacred Pause from Prayer Book

**What:** Remove `prayerbook` from `PRAYER_MODES` in `src/reader.js` line ~77.

**Dorothy (72):** Opens the Prayer Book before bed. List appears instantly — no 2.5-second centering screen. She's already in a contemplative state; the pause was redundant friction.

**Marcus (25):** Taps Prayer Book to look up a prayer. List loads immediately. He searches, reads, closes. 4 seconds total.

**Sarah (45):** Grace Before Meals while the family waits for dinner. List appears in under a second instead of 3.5 seconds. The sacred pause was the single biggest time tax on her use case.

**Why it's safe:** Lectio Divina (inside the Prayer Book) is a contemplative experience — but it's reached by two intentional taps past the list screen. By the time someone opens Lectio, they've chosen meditation. The *entry* to the Prayer Book is a reference lookup.

**Before:** `var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };`
**After:** `var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 };`

**Test checklist:**
- [ ] Prayer Book opens directly to list (no sacred pause)
- [ ] Rosary, Chaplet, Stations, Novena still show sacred pause

---

### PBR-02 — Quick Access Pills

**What:** Horizontal scrollable row of 5 pills at the top of the Prayer Book (above search) showing the most universally used prayers. Tapping a pill expands that prayer and scrolls to it.

**Prayers:** Sign of the Cross · Our Father · Hail Mary · Glory Be · Act of Contrition

**IDs from prayerbook.json:** `sign_of_cross`, `our_father`, `hail_mary`, `glory_be`, `act_of_contrition_traditional`

**Dorothy (72):** She doesn't need these for her nightly routine (she uses Guardian Angel + Hail Holy Queen). But on Sunday when she needs the Act of Contrition before confession, it's one tap instead of scrolling past 7 prayers.

**Marcus (25):** Sees the pills — "OK, these are the basics." He already knows them. He scrolls past to search for the Memorare. The row tells him the Prayer Book is organized and accessible.

**Sarah (45):** On Sunday her daughter needs the Our Father for homework. She taps the pill, prayer expands, done in 2 seconds. No scrolling, no search keyboard.

**CSS:**
```css
.prayerbook-quick {
  display: flex; gap: var(--space-2); overflow-x: auto;
  scrollbar-width: none; padding: var(--space-2) 0 var(--space-3);
  -webkit-overflow-scrolling: touch;
}
.prayerbook-quick::-webkit-scrollbar { display: none; }
.prayerbook-quick-pill {
  flex-shrink: 0; padding: var(--space-2) var(--space-3);
  border: 1px solid var(--color-border-light); border-radius: var(--radius-full);
  font-family: var(--font-body); font-size: var(--text-xs);
  font-weight: var(--weight-medium); color: var(--color-text-secondary);
  background: var(--color-surface); cursor: pointer;
  -webkit-tap-highlight-color: transparent; white-space: nowrap;
  min-height: 36px; display: flex; align-items: center;
}
.prayerbook-quick-pill:active { background: var(--color-surface-hover); }
html[data-theme="dark"] .prayerbook-quick-pill {
  background: var(--color-surface); border-color: var(--color-border);
}
```

**JS:** In `_renderList()`, before search input, only when `!_searchQuery`:
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
      + utils.esc(prayer.title) + '</button>';
  }
});
html += '</div>';
```

**Test checklist:**
- [ ] 5 pills in correct order with correct titles
- [ ] Tapping pill expands prayer + scrolls to it
- [ ] Hidden during search mode
- [ ] Horizontal scroll works on 320px
- [ ] Touch targets: 36px height + 8px gap = effective ≥ 44px
- [ ] Dark mode correct

---

### PBR-03 — Guided Section Divider

**What:** A sacred-tinted divider separates static prayer categories from the guided interactive content (litanies and Lectio Divina) at the bottom.

**Dorothy (72):** Scrolls through 5 categories of static prayer text. Then sees a thin colored line — section break. Below it: "Guided Litanies" in a slightly different title color. She's curious. Taps "Litany of Humility" and discovers a step-through experience.

**Marcus (25):** The divider catches his eye. Above: text you read. Below: things with "Guided" badges. He taps Lectio Divina, discovers the 4-step meditation.

**Sarah (45):** She doesn't need guided content right now. But the divider means she scans faster — static prayers end at the line.

**CSS:**
```css
.prayerbook-guided-section {
  margin-top: var(--space-4); padding-top: var(--space-4);
  border-top: 1px solid color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
.prayerbook-guided-section .prayerbook-category-title {
  color: var(--color-sacred-text);
}
html[data-theme="dark"] .prayerbook-guided-section {
  border-top-color: color-mix(in srgb, var(--color-sacred) 10%, transparent);
}
```

**JS:** Wrap litanies + lectio in `<div class="prayerbook-guided-section">` (non-search mode only).

**Test checklist:**
- [ ] Sacred-tinted divider above "Guided Litanies"
- [ ] Title color shifts to `--color-sacred-text`
- [ ] Not shown during search
- [ ] Dark mode subtle but visible

---

### PBR-04 — Prayer Length Indicator

**What:** Tiny "brief" or "long" label on prayer rows before the chevron. ≤ 40 words = "brief". > 100 words = "long". Hidden when prayer is expanded.

**Dorothy (72):** Sees "Nicene Creed — long" and knows it's substantial. Sees "Sign of the Cross — brief" — just a few words. Sets expectations before she taps.

**Marcus (25):** Browsing Marian prayers. "The Memorare" has no label (medium). "The Angelus" says "long." "Sub Tuum Praesidium" says "brief." He plans his reading.

**Sarah (45):** "Grace Before Meals — brief" — perfect, that's what she needs.

**Expected labels:**
- **brief** (≤ 40w): Sign of the Cross, Glory Be, Grace Before/After Meals, Guardian Angel, Sub Tuum, Eternal Rest, Act of Hope
- **long** (> 100w): Apostles' Creed, Nicene Creed, Angelus, Magnificat, St. Anthony
- **no label** (41–100w): Our Father, Hail Mary, Morning Offering, Memorare, etc.

**CSS:**
```css
.prayerbook-length {
  font-size: 11px; color: var(--color-text-tertiary);
  font-weight: var(--weight-regular); margin-right: var(--space-2); flex-shrink: 0;
}
```

**JS in `_renderPrayerRow()`:**
```js
var wc = (prayer.text || '').split(/\s+/).length;
var lengthLabel = wc <= 40 ? 'brief' : wc > 100 ? 'long' : '';
// Before the chevron, only when collapsed:
+ (lengthLabel && !isOpen ? '<span class="prayerbook-length">' + lengthLabel + '</span>' : '')
```

**Test checklist:**
- [ ] "brief" on ≤ 40-word prayers
- [ ] "long" on > 100-word prayers
- [ ] No label on 41–100 word prayers
- [ ] Label disappears when expanded
- [ ] Dark mode readable

---

### PBR-05 — Recently Opened Prayers

**What:** Track last 3 opened prayers in localStorage. Show a "Recent" section above categories.

**Dorothy (72):** Second visit to Prayer Book. Above the categories: "Recent" with Guardian Angel Prayer and Hail Holy Queen — the two she prayed last night. One tap, no scrolling past 12 rows. Time saved: 5–8 seconds every night.

**Marcus (25):** First visit: no Recent section. He searches "Memorare." Second visit: Recent shows the Memorare at top. Third visit: Recent shows his last 3 prayers. The Prayer Book feels like it knows him.

**Sarah (45):** Used Grace Before Meals on Monday. Tuesday she opens Prayer Book — it's right there in Recent. One tap.

**Storage:** `mf-prayerbook-recent` → JSON array, max 3, most recent first.

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

Called from `prayerbookToggle()` on open (not close).

**CSS:**
```css
.prayerbook-recent-label {
  font-size: var(--text-xs); font-weight: var(--weight-medium);
  color: var(--color-text-tertiary); text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: var(--space-2); padding-left: var(--space-1);
}
```

Recent prayers render as standard `.prayerbook-row` elements with full expand/collapse.

**Test checklist:**
- [ ] First visit: no Recent section
- [ ] Open prayer → close Prayer Book → reopen: prayer in Recent
- [ ] Max 3, most recent first
- [ ] Tapping recent prayer expands + scrolls
- [ ] Hidden during search
- [ ] localStorage key: `mf-prayerbook-recent`

---

## Implementation sequence

1. PBR-01 — 1 line in reader.js
2. PBR-02 — Quick access pills in prayerbook.js + CSS
3. PBR-03 — Guided section wrapper in prayerbook.js + CSS
4. PBR-04 — Length labels in prayerbook.js + CSS
5. PBR-05 — Recent tracking in prayerbook.js + CSS

All 5 can be one commit.
