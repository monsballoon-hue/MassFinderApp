# Claude Code Prompt — PBR (Prayer Book Internal Navigation)

**Spec:** `docs/plans/UX_Spec_Prayer_Book_Refinements.md`
**Priority:** P2 — implement after PMV
**Model recommendation:** Sonnet

---

## Pre-flight

```bash
git checkout main && git pull
```

Read CLAUDE.md. Read `docs/plans/UX_Spec_Prayer_Book_Refinements.md`.

---

## Task (5 items, 1 commit)

### 1. PBR-01: Sacred Pause removal
`src/reader.js` line ~77: remove `prayerbook` from PRAYER_MODES.

### 2. PBR-02: Quick access pills
In `src/prayerbook.js` `_renderList()`, before search input when `!_searchQuery`, render horizontal pill row. IDs: `sign_of_cross`, `our_father`, `hail_mary`, `glory_be`, `act_of_contrition_traditional`. Each calls `prayerbookToggle()`. Add CSS per spec.

### 3. PBR-03: Guided section divider
Wrap litanies + lectio in `<div class="prayerbook-guided-section">` (non-search only). Sacred-tinted border-top CSS per spec.

### 4. PBR-04: Length indicators
In `_renderPrayerRow()`, compute word count. Show "brief" (≤40w) or "long" (>100w) before chevron. Hide when expanded. CSS per spec.

### 5. PBR-05: Recently opened
Add `_trackRecent(prayerId)` storing last 3 in `mf-prayerbook-recent`. Call from `prayerbookToggle()` on open. Render "Recent" section above categories when not searching. Standard `.prayerbook-row` render.

### Files:
- `src/reader.js` — PBR-01 only
- `src/prayerbook.js` — PBR-02 through PBR-05
- `css/app.css` — new classes + dark mode

### Test:
```
npm run build
```
- [ ] Prayer Book: no sacred pause. Rosary/Chaplet/Stations/Novena: still have pause.
- [ ] 5 quick pills, correct IDs, tap → expand + scroll
- [ ] Sacred divider above guided content
- [ ] "brief" on Sign of Cross/Glory Be, "long" on Nicene Creed/Angelus
- [ ] Labels hidden when expanded
- [ ] Recent: populates after use, max 3, hidden during search
- [ ] Dark mode on all new elements

### Commit:
```
feat: prayer book navigation refinements (PBR-01-05)

- Remove sacred pause from reference lookups (PBR-01)
- Quick access pills for 5 essential prayers (PBR-02)
- Guided section divider for litanies/Lectio (PBR-03)
- Brief/long length indicators (PBR-04)
- Recently opened prayers via localStorage (PBR-05)
```
