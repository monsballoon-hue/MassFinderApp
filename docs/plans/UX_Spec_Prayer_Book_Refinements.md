# UX Spec: Prayer Book & Content Access Refinements (Amended)

**Prefix:** PBR (Prayer Book Refinements)
**Created:** 2026-03-15 · **Amended:** 2026-03-15
**Status:** Ready for implementation
**Priority:** P2 (implement after PMV)
**Scope:** Prayer Book internal UX, sacred pause tuning
**Files affected:** `src/prayerbook.js`, `src/reader.js`, `css/app.css`

---

## Amendment Notes

- Persona walkthroughs expanded per review — each item now traces the complete journey for all three demographics.
- Prayer IDs corrected to match actual `data/prayerbook.json`: `sign_of_cross`, `our_father`, `hail_mary`, `glory_be`, `act_of_contrition_traditional`.
- Scope limited to Prayer Book internal experience. No Baltimore/Summa/Explore references.

---

## Problem Statement

The Prayer Book contains 31 prayers across 5 categories (Essential, Morning & Evening, Marian, Saints, Sacramental), 2 guided litanies (Litany of Humility with 23 invocations, Litany of Trust with 28 invocations), and Lectio Divina (4-step guided meditation with today's Gospel). This is a substantial collection. But the internal experience treats every item identically: flat accordion rows with chevrons under uppercase category headers.

---

## Persona Journeys: Current State (Inside Prayer Book)

### Dorothy, 72 — Nightly prayer routine

**Goal:** Pray the Guardian Angel Prayer and the Hail Holy Queen before bed. She does this every single night.

**Current journey:**
1. Taps Prayer Book on More tab. **2.5 seconds of sacred pause.** She waits, watching "In the name of the Father..." fade in and out. She's in bed, phone on the nightstand, glasses on. She wants the prayer text. The sacred pause is for entering a contemplative state — she's already in one. The delay is friction, not reverence.
2. Prayer list loads. Search bar at top, then categories. She does not use search — she's 72 and the keyboard is small.
3. She sees "Essential Prayers" (10 items). She scrolls past: Sign of the Cross, Our Father, Hail Mary, Glory Be, Apostles' Creed, Nicene Creed (224 words — long), Confiteor, Act of Contrition, Act of Contrition (Rite of Penance), Hail Holy Queen. She taps Hail Holy Queen at the bottom of Essential Prayers. **That's 10 rows of scrolling to reach item #10.**
4. Then she needs the Guardian Angel Prayer. It's in "Morning & Evening" — one more category header, 2 more rows. She scrolls further.
5. **Tomorrow night, she does the same thing.** No memory of last night. Same scroll journey.

**Failures:** (a) Sacred pause is friction for a reference lookup. (b) Every night she scrolls past 12+ rows to find the same 2 prayers. (c) No recents, no favorites, no shortcut. (d) The 16-word Sign of the Cross looks identical to the 224-word Nicene Creed — no length signal.

### Marcus, 25 — Discovering the prayer tradition

**Goal:** His RCIA sponsor mentions the Memorare. He wants to read it.

**Current journey:**
1. Opens Prayer Book. Sacred pause: 2.5 seconds. He's mildly impatient — this isn't prayer time, he's just looking something up.
2. Types "Memorare" in search. Finds it instantly. Good.
3. He taps it. The row expands to show 73 words of Georgia-serif text. He reads it. Good experience.
4. He notices other prayers in the list but has no signal for *which ones are interactive*. The Litany of Humility (a 23-step guided experience with V/R formatting) has the same visual weight as the Glory Be (a 30-word text blob). He might scroll past the litanies entirely.
5. He never discovers Lectio Divina at the very bottom because he found the Memorare and closed the Prayer Book.

**Failures:** (a) Sacred pause for a lookup. (b) No visual distinction between static text and interactive guided experiences. (c) No indication of content length — is the Memorare 10 words or 200? (d) Guided litanies and Lectio Divina are buried at the bottom with no visual signal that they're different.

### Sarah, 45 — Quick reference, one-handed

**Goal:** The family is sitting down for dinner. She needs the Grace Before Meals.

**Current journey:**
1. Opens Prayer Book one-handed while settling a toddler. Sacred pause: 2.5 seconds. The toddler is reaching for the green beans. She waits.
2. Prayer list loads. She could search but typing one-handed is slow. She scrolls.
3. Grace Before Meals is in "Morning & Evening" — the 2nd category. She scrolls past 10 Essential Prayers to reach it. That's a lot of scrolling one-handed.
4. She taps it. 22 words. Done.
5. **Total time from tap to reading the prayer: ~8 seconds.** Should be 3.

**Failures:** (a) Sacred pause adds 2.5 seconds to a 22-word lookup. (b) No quick-access for the most commonly used prayers. (c) No sense of what's short ("brief") vs what requires sitting down and reading ("long").

---

## Spec Items

### PBR-01 — Remove Sacred Pause from Prayer Book Entry

**What:** Remove `prayerbook` from the `PRAYER_MODES` set in `src/reader.js` line ~77.

**Dorothy:** Opens the Prayer Book and the list appears immediately. No 2.5-second wait. She can start scrolling right away. She prays the Sign of the Cross herself before reading — the sacred pause was redundant for her.

**Marcus:** Taps Prayer Book to look up a prayer. List appears instantly. He searches "Memorare," finds it, reads it. 4 seconds. He doesn't feel the app slowed him down.

**Sarah:** Grace Before Meals in 3 seconds instead of 8. The sacred pause was the single biggest time tax on her use case. Removing it cuts response time by 45%.

**Why it's safe to remove:** The Lectio Divina step-through (accessed *within* the Prayer Book) is a contemplative experience. But it's reached by scrolling to the bottom, tapping a "Guided" badge row, and then choosing to begin. By that point the user has made two intentional choices to enter a guided meditation. The *entry* to the Prayer Book should be friction-free — it's a reference tool.

**Before:**
```js
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };
```

**After:**
```js
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 };
```

**Test checklist:**
- [ ] Opening Prayer Book goes directly to the list (no sacred pause)
- [ ] Opening Rosary still shows sacred pause
- [ ] Opening Chaplet still shows sacred pause
- [ ] Opening Stations still shows sacred pause
- [ ] Opening Novena still shows sacred pause

---

### PBR-02 — Quick Access: The 5 Prayers Everyone Needs

**What:** A horizontal scrollable row of 5 compact pills at the top of the Prayer Book list (above the search input) showing the most universally used prayers. Tapping a pill scrolls to and expands that prayer in the main list below.

**Prayers:** Sign of the Cross · Our Father · Hail Mary · Glory Be · Act of Contrition

**Why these 5:** These are the prayers every Catholic learns first and uses most frequently. In a physical missal, they're printed on a separate card at the front. In any catechism class, they're the first 5 prayers taught. They account for the vast majority of Prayer Book lookups.

**Dorothy:** Opens the Prayer Book. Before the search bar, she sees 5 small rounded buttons in a row: "Sign of the Cross", "Our Father", "Hail Mary", "Glory Be", "Act of Contrition." She doesn't need these specifically (she wants the Guardian Angel Prayer), but she appreciates the shortcut when she does need the Act of Contrition before bed. The pills are at `--text-xs` (13px) — readable but compact.

**Marcus:** Sees the quick access row. Thinks: "OK, these are the basics." He already knows these. He scrolls past them to the search bar. The row tells him the Prayer Book is organized and accessible — it's not just a dumping ground.

**Sarah:** Grace Before Meals isn't in the quick access row, but the Act of Contrition is — and that's what she needs next time she takes the kids to confession. For the Grace Before Meals, she types "grace" in search. But on Sunday she needs the Our Father for her daughter's homework — she taps the pill and has it in 2 seconds.

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
html[data-theme="dark"] .prayerbook-quick-pill { background: var(--color-surface); border-color: var(--color-border); }
```

**JS in `_renderList()` — before search input, when not searching:**
```js
if (!_searchQuery) {
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
}
```

**Behavior:** Tapping a pill calls `prayerbookToggle()` which expands that prayer and scrolls to it (existing behavior).

**Test checklist:**
- [ ] Quick access row shows 5 pills in correct order
- [ ] IDs match data: sign_of_cross, our_father, hail_mary, glory_be, act_of_contrition_traditional
- [ ] Tapping a pill expands that prayer and scrolls to it
- [ ] Quick access row not shown during search mode
- [ ] Horizontal scroll works on narrow screens (320px)
- [ ] Touch targets: min-height 36px with 8px gap = effective 44px
- [ ] Dark mode renders correctly

---

### PBR-03 — Guided Content Visual Distinction

**What:** A sacred-tinted visual divider separates the static prayer categories from the guided interactive experiences (litanies and Lectio Divina) at the bottom of the list.

**Dorothy:** Scrolls through Essential Prayers, Morning & Evening, Marian Prayers, Prayers to Saints, Sacramental Prayers. Then she sees a thin sacred-colored line — a section break. Below it: "Guided Litanies" in a slightly different color. She recognizes this as a different category of content. She's curious. She taps "Litany of Humility" — it says "Guided" in a badge. She enters the step-through. She discovers a whole new way to pray.

**Marcus:** The divider catches his eye. Above it: static prayer text. Below it: "Guided" badges, different title color. He taps Lectio Divina, discovers the 4-step meditation with today's Gospel. The divider told him: "Something different starts here."

**Sarah:** She doesn't need the guided content right now. But the divider means she can scan faster — she knows the static prayers end at the line. She doesn't have to scroll through guided content to confirm she's past the regular prayers.

**CSS:**
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

**JS:** Wrap the litanies + lectio rendering in `<div class="prayerbook-guided-section">`:
```js
// Only in non-search mode, after all regular categories:
html += '<div class="prayerbook-guided-section">';
// ... litanies rendering ...
// ... lectio rendering ...
html += '</div>';
```

**Test checklist:**
- [ ] Sacred-tinted divider line above "Guided Litanies"
- [ ] Category title color shifts to --color-sacred-text for guided sections
- [ ] Divider not shown during search mode
- [ ] Dark mode divider visible but subtle
- [ ] No visual regression on static categories above the divider

---

### PBR-04 — Prayer Length Indicator

**What:** A subtle word-count hint on prayer rows so users can anticipate content size before expanding.

**Dorothy:** She sees "Nicene Creed" with a tiny "long" label on the right side. She knows this will be a lot of text — she adjusts her glasses. She sees "Sign of the Cross" with "brief" — just a few words. This matches her expectations. She never has to open a prayer and be surprised by its length.

**Marcus:** He's browsing the Marian section. "The Memorare" has no label — it's medium length. "The Angelus" has "long." "Sub Tuum Praesidium" has "brief." He can plan his reading time without expanding each one.

**Sarah:** She's scanning fast. "Grace Before Meals" says "brief" — perfect, that's what she needs. She doesn't waste time expanding long prayers when she wants a quick one.

**Design:** Tiny text label before the chevron. "brief" for <= 40 words, nothing for 41-100, "long" for 100+. Uses --text-xs and --color-text-tertiary. Invisible when prayer is expanded (you can see the full text already).

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
// In the row header, before the chevron:
+ (lengthLabel && !isOpen ? '<span class="prayerbook-length">' + lengthLabel + '</span>' : '')
```

**Expected labels:**
- "brief": Sign of the Cross (16w), Grace Before Meals (22w), Grace After Meals (34w), Glory Be (30w), Guardian Angel (29w), Sub Tuum (30w), Eternal Rest (30w), Act of Hope (37w)
- "long": Apostles' Creed (112w), Nicene Creed (224w), Angelus (168w), Magnificat (166w), St. Anthony (146w)
- No label: Our Father (56w), Hail Mary (42w), Morning Offering (84w), Memorare (73w), etc.

**Test checklist:**
- [ ] "brief" on prayers <= 40 words (Sign of the Cross, Glory Be, etc.)
- [ ] "long" on prayers > 100 words (Nicene Creed, Angelus, etc.)
- [ ] No label on medium-length prayers
- [ ] Labels disappear when prayer is expanded
- [ ] Dark mode readable

---

### PBR-05 — Recently Opened Prayers

**What:** Track the last 3 opened prayers in localStorage and show a "Recent" section above the categories when at least 1 recent prayer exists.

**Dorothy:** Opens the Prayer Book for the second time. Above the categories, she sees "Recent" with the Guardian Angel Prayer and Hail Holy Queen — the two she prayed last night. She taps Guardian Angel Prayer. It expands immediately. No scrolling past 12 rows of Essential Prayers. **Time saved: 5-8 seconds every single night.**

On the third night, her three Recent prayers are exactly the ones she uses: Guardian Angel Prayer, Hail Holy Queen, and the Act of Contrition (she added it after confession). Her nightly routine is now 2 taps and zero scrolling.

**Marcus:** First visit: no "Recent" section — it hasn't learned yet. He searches "Memorare," reads it. Second visit: "Recent" shows the Memorare at the top. He taps it to re-read. Third visit: he's also looked at the Angelus and the Litany of Humility. Recent shows all three. The Prayer Book feels like it knows him.

**Sarah:** She used the Grace Before Meals on Monday. On Tuesday, she opens the Prayer Book and it's right there in "Recent." One tap. Done. The recency tracking costs zero cognitive load — it just works.

**Storage:** `mf-prayerbook-recent` -> JSON array of last 3 prayer IDs, most recent first.

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

Called from `prayerbookToggle()` when *opening* a prayer (not closing).

**Rendering:** Above categories, after quick access pills, when not searching and at least 1 recent exists:
```css
.prayerbook-recent-label {
  font-size: var(--text-xs); font-weight: var(--weight-medium);
  color: var(--color-text-tertiary); text-transform: uppercase;
  letter-spacing: 0.06em; margin-bottom: var(--space-2);
  padding-left: var(--space-1);
}
```

Recent prayers render as standard `.prayerbook-row` elements — same expand/collapse behavior.

**Privacy:** Prayer book browsing is not sensitive (unlike examination items which are memory-only). Storing recently-viewed prayer titles in localStorage is appropriate.

**Test checklist:**
- [ ] First visit: no "Recent" section
- [ ] Open a prayer, close Prayer Book, reopen: prayer appears in Recent
- [ ] Up to 3 recent prayers shown, most recent first
- [ ] Tapping a recent prayer expands it and scrolls to its position
- [ ] Recent section hidden during search
- [ ] localStorage key: mf-prayerbook-recent
- [ ] Clearing localStorage removes recent section gracefully

---

## Implementation Sequence

1. **PBR-01** — 1-line change in reader.js. No cascading risk.
2. **PBR-02** — Quick access pills. HTML/CSS addition in prayerbook.js.
3. **PBR-03** — Guided section divider. CSS + minor HTML wrapper in prayerbook.js.
4. **PBR-04** — Length indicator. Small JS + CSS addition in prayerbook.js.
5. **PBR-05** — Recently opened. localStorage + render logic in prayerbook.js.

Items 2-5 can be batched into a single commit.

---

## Visual Summary

```
+-------------------------------------+
|  Prayer Book                    [x] |
+---------+---------------------------+
| [Sign of Cross] [Our Father]        |
| [Hail Mary] [Glory Be] [Act of C.] |  <- QUICK ACCESS (PBR-02)
|                                      |
| Search prayers...                    |
|                                      |
| RECENT                               |  <- PBR-05
| +- Guardian Angel Prayer        v -+|
| +- Hail, Holy Queen       brief v -+|
|                                      |
| ESSENTIAL PRAYERS                    |
| +- Sign of the Cross      brief v -+|  <- PBR-04
| +- Our Father                    v -+|
| +- Hail Mary                    v -+|
| +- ...                          v -+|
| +- Nicene Creed            long  v -+|
|                                      |
| MORNING & EVENING                    |
| ...                                  |
|                                      |
| -------- sacred divider ------------ |  <- PBR-03
|                                      |
| GUIDED LITANIES                      |
| +- Litany of Humility      Guided -+|
| +- Litany of Trust          Guided -+|
|                                      |
| CONTEMPLATIVE                        |
| +- Lectio Divina            Guided -+|
+--------------------------------------+
```
