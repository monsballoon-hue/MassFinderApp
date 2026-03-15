# Claude Code Prompt — PBR (Prayer Book Refinements)

**Spec:** `docs/plans/UX_Spec_Prayer_Book_Refinements.md`
**Scope:** Prayer Book internal UX + sacred pause tuning
**Priority:** P2 — implement after PMV series
**Model recommendation:** Sonnet — tight, well-scoped changes

---

## Pre-flight

```bash
git checkout main && git pull
```

Read CLAUDE.md for conventions. Read the full spec at `docs/plans/UX_Spec_Prayer_Book_Refinements.md`.

---

## Task

Implement PBR-01 through PBR-05 as described in the spec.

### 1. PBR-01: Remove Sacred Pause from Prayer Book

In `src/reader.js` line ~77, remove `prayerbook` from `PRAYER_MODES`:
```js
// Before:
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1, prayerbook: 1 };
// After:
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 };
```

### 2. PBR-02: Quick Access Pills

In `src/prayerbook.js` `_renderList()`, before the search input (only when `!_searchQuery`), render a horizontal scroll row of 5 pills: Sign of the Cross, Our Father, Hail Mary, Glory Be, Act of Contrition. Each pill calls `prayerbookToggle()` with the prayer's ID. Add `.prayerbook-quick` and `.prayerbook-quick-pill` CSS per spec. Dark mode override needed.

Note: Prayer IDs in `data/prayerbook.json` — verify the exact ID strings before hardcoding. Use `_data.categories[0].prayers` to find Essential Prayers IDs.

### 3. PBR-03: Guided Section Divider

In `src/prayerbook.js` `_renderList()`, wrap the litanies + lectio sections in `<div class="prayerbook-guided-section">`. Add CSS per spec — sacred-tinted border-top, color override for category titles inside guided section. Only render the wrapper in non-search mode.

### 4. PBR-04: Prayer Length Indicator

In `_renderPrayerRow()`, compute word count from `prayer.text`. Show "brief" for ≤40 words, "long" for >100 words, nothing for middle range. Add `<span class="prayerbook-length">` before the chevron SVG. Hide when prayer is open (expanded). Add minimal CSS per spec.

### 5. PBR-05: Recently Opened Prayers

Add `_trackRecent(prayerId)` function — stores last 3 opened prayer IDs in `mf-prayerbook-recent` localStorage key. Call from `prayerbookToggle()` when opening (not closing). In `_renderList()`, when not searching and recent prayers exist, render a "Recent" section above categories with standard prayer rows.

### Key conventions:
- CommonJS, `var`, no arrow functions
- `utils.esc()` for all user-facing strings
- Design tokens only — never hardcode colors
- Dark mode for every new CSS class
- Touch targets ≥ 44pt (pills can be 36px height with 8px gap)

### Files to modify:
- `src/reader.js` — PBR-01 only (remove prayerbook from PRAYER_MODES)
- `src/prayerbook.js` — PBR-02 through PBR-05
- `css/app.css` — New classes for quick access, guided section, length label, recent label

### Test:
```
npm run build
```
- [ ] Prayer Book opens instantly (no sacred pause)
- [ ] Rosary/Chaplet/Stations/Novena still show sacred pause
- [ ] Quick access pills show 5 prayers, scroll horizontally
- [ ] Tapping pill opens prayer and scrolls to it
- [ ] Guided section has sacred-tinted divider
- [ ] Length indicators show "brief" and "long" appropriately
- [ ] Recent section populates after opening prayers
- [ ] All new elements render in dark mode
- [ ] Search mode hides quick access, recent, guided divider

### Commit:
```
feat: prayer book internal UX refinements (PBR-01→05)

- Remove sacred pause from Prayer Book entry (PBR-01)
- Quick access pills for 5 essential prayers (PBR-02)
- Visual divider for guided litanies/lectio section (PBR-03)
- Prayer length indicators: brief/long (PBR-04)
- Recently opened prayers with localStorage tracking (PBR-05)
```
