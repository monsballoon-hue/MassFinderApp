# Claude Code Prompt — PBR (Prayer Book Refinements) — Amended

**Spec:** `docs/plans/UX_Spec_Prayer_Book_Refinements.md`
**Scope:** Prayer Book internal UX + sacred pause tuning
**Priority:** P2 — implement after PMV series
**Model recommendation:** Sonnet — tight, well-scoped changes

---

## Pre-flight

```bash
git checkout main && git pull
```

Read CLAUDE.md. Read the full spec at `docs/plans/UX_Spec_Prayer_Book_Refinements.md`.

---

## Task

Implement PBR-01 through PBR-05 as described in the spec.

### 1. PBR-01: Remove Sacred Pause from Prayer Book

In `src/reader.js` line ~77, remove `prayerbook` from `PRAYER_MODES`:
```js
var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 };
```

### 2. PBR-02: Quick Access Pills

In `src/prayerbook.js` `_renderList()`, before the search input (only when `!_searchQuery`), render a horizontal scroll row of 5 pills. **Exact IDs from prayerbook.json:**
```js
var quickIds = ['sign_of_cross', 'our_father', 'hail_mary', 'glory_be', 'act_of_contrition_traditional'];
```
Each pill calls `prayerbookToggle()` with the prayer ID. Add `.prayerbook-quick` and `.prayerbook-quick-pill` CSS per spec. Dark mode override needed.

### 3. PBR-03: Guided Section Divider

In `_renderList()`, wrap the litanies + lectio sections in `<div class="prayerbook-guided-section">`. Only in non-search mode. Add CSS: sacred-tinted border-top, category title color override. Dark mode variant.

### 4. PBR-04: Prayer Length Indicator

In `_renderPrayerRow()`, compute word count from `prayer.text`. Show "brief" for <=40 words, "long" for >100 words, nothing for middle. Add `<span class="prayerbook-length">` before the chevron SVG. **Hide when prayer is expanded** (isOpen check). Minimal CSS per spec.

### 5. PBR-05: Recently Opened Prayers

Add `_trackRecent(prayerId)` — stores last 3 opened prayer IDs in `mf-prayerbook-recent` localStorage. Call from `prayerbookToggle()` when opening (not closing). In `_renderList()`, when not searching and recent prayers exist, render "Recent" section above categories. Recent prayers render as standard `.prayerbook-row` with full expand/collapse behavior.

### Key conventions:
- CommonJS, `var`, no arrow functions
- `utils.esc()` for user-facing strings
- Design tokens only — never hardcode colors
- Dark mode for every new CSS class
- Touch targets >= 44pt

### Files to modify:
- `src/reader.js` — PBR-01 only
- `src/prayerbook.js` — PBR-02 through PBR-05
- `css/app.css` — New classes

### Test:
```
npm run build
```
- [ ] Prayer Book opens instantly (no sacred pause)
- [ ] Rosary/Chaplet/Stations/Novena still show sacred pause
- [ ] Quick access: 5 pills, correct IDs, tapping opens + scrolls
- [ ] Pills hidden during search
- [ ] Guided section has sacred-tinted divider
- [ ] Length: "brief" on Sign of Cross/Glory Be, "long" on Nicene Creed/Angelus
- [ ] Length labels hidden when prayer expanded
- [ ] Recent: populates after opening prayers, max 3, most recent first
- [ ] Recent hidden during search
- [ ] All elements render in dark mode

### Commit:
```
feat: prayer book internal UX refinements (PBR-01-05)

- Remove sacred pause from Prayer Book entry (PBR-01)
- Quick access pills for 5 essential prayers (PBR-02)
- Visual divider for guided litanies/lectio section (PBR-03)
- Prayer length indicators: brief/long (PBR-04)
- Recently opened prayers with localStorage tracking (PBR-05)
```
