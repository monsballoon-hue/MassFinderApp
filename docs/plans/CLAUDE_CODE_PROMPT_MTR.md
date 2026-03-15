# Claude Code Prompt — MTR (More Tab Restructure)

**Spec:** `docs/plans/UX_Spec_More_Tab_Restructure.md`
**Scope:** index.html, css/app.css, src/more.js
**Do NOT modify:** Any other src/ files, data files, or build scripts

---

## Context

The More tab has grown to 20+ interactive elements across 10 content zones that all share identical visual treatment. This spec restructures the More tab into 3 visually distinct zones: "Today" (daily briefing), "Practice" (prayer tools), and "Go Deeper" (reference library). The goal is editorial rhythm and spatial memory, not just uniform cards.

**Read the full spec first:** `docs/plans/UX_Spec_More_Tab_Restructure.md`

---

## Implementation instructions

### Group 1: Core structure (do all)

**MTR-01 — Zone Container Architecture**

1. In `index.html`, wrap the More tab content into three zone `<div>` containers plus zone seam dividers. The exact HTML structure is in the spec's "After" block. Key points:
   - Zone 1 (`.more-zone--today`): wraps `#saintSection` + `#seasonalMoment` + `#readingsSection`
   - Zone 2 (`.more-zone--practice`): wraps `#prayerToolsSection` + `#dailyFormation`
   - Zone 3 (`.more-zone--deeper`): is a `<details>` element wrapping `#devotionalCards`
   - Two `.more-zone-seam` dividers between zones
   - Move `#libraryTeaser` out of `prayerToolsSection` and place it between Zone 2 and the second seam (MTR-05)
   - Replace `<div class="prayer-tools-secondary" id="prayerToolsSecondary"></div>` with `<div id="prayerToolsSecondaryWrap"></div>` (MTR-03 prep)

2. In `css/app.css`:
   - Add all new zone CSS classes from the spec (`.more-zone`, `.more-zone--today`, `.more-zone--practice`, `.more-zone-seam`, `.more-zone--deeper`, etc.)
   - Modify `.more-section` (line ~1494): remove `border-bottom: 1px solid var(--color-border-light);` → `border-bottom: none;`
   - Modify `.more-content` (line ~1493): reduce top padding from `var(--space-4)` to `var(--space-3)`
   - Add dark mode overrides for zone backgrounds
   - IMPORTANT: `--color-surface-sacred` already exists from CCS series — use it for Zone 1 background

3. In `src/more.js`, at the end of `renderMore()`:
   - Add Zone 3 open/close `localStorage` memory (`mf-deeper-open` key)
   - Default: open on first visit (no stored preference), closed on subsequent visits if user closed it
   - Add guide count badge to `#deeperCount`
   - IMPORTANT: The `devotEl` variable (`document.getElementById('devotionalCards')`) must still resolve correctly inside the `<details>` element. Verify the term click init and CCC ref wiring still works.

**MTR-06 — Zone 1 Internal Spacing**

4. In `css/app.css`, add scoped spacing rules for elements inside `.more-zone--today`:
   - `#saintSection` gets bottom padding
   - `#seasonalMoment:not(:empty)` gets vertical padding
   - `#readingsSection` gets a faint sacred-tinted top border (NOT `--color-border-light`)
   - Dark mode: reduce separator opacity

**MTR-02 — Section Title Typography Differentiation**

5. In `css/app.css`, add three modifier classes:
   - `.more-section-title--today`: sacred text color, uppercase, smaller, letter-spaced
   - `.more-section-title--practice`: body font, semibold, neutral
   - `.more-section-title--deeper`: muted secondary color, smaller

6. In `index.html`, add the modifier classes to the respective `<h2>` elements.

### Group 2: Content reduction (do all)

**MTR-03 — Secondary Prayer Tools Progressive Disclosure**

7. In `src/more.js`, replace the secondary grid rendering block. Instead of always showing `#prayerToolsSecondary`, render into `#prayerToolsSecondaryWrap`:
   - If a promoted card exists in the secondary tier OR only 1 secondary card: render directly (no disclosure)
   - Otherwise: wrap in a `<details class="prayer-tools-more">` with a centered "More tools" toggle
   - Add the CSS for `.prayer-tools-more`, `.prayer-tools-more-toggle`, `.prayer-tools-more-chevron`

**MTR-04 — Reading Entries Compact Mode**

8. In `css/app.css`, add scoped compact styles for reading entries inside `.more-zone--today`:
   - Tighter padding on `.reading-entry`
   - Smaller heading text
   - Ref text at `--text-sm`

**MTR-05 — Library Teaser Reposition**

9. Already handled in step 1 (HTML move). Add the CSS to ensure `#libraryTeaser` has correct spacing between zones.

**MTR-07 — Devotional Guide Count Badge**

10. Already handled in step 3 (JS). Ensure the count reflects `orderedGuides.length` after seasonal filtering.

---

## Key gotchas

- `devotEl = document.getElementById('devotionalCards')` is used after rendering to wire term clicks, CCC refs, and Scripture refs. Since it's now inside a `<details>` element, it's still in the DOM (just potentially hidden). The wiring should work regardless of open/close state. Verify by testing: open Zone 3, tap a CCC pill — should show snippet.
- The `_resolveCardTiers` function handles promoted-card swaps between primary and secondary tiers. The disclosure wrapper (MTR-03) must check if any promoted card landed in the secondary array AFTER the swap. If so, skip the disclosure wrapper.
- `prayerToolsSecondary` ID is gone from HTML. The JS currently does `document.getElementById('prayerToolsSecondary')` — this must change to `document.getElementById('prayerToolsSecondaryWrap')` and the rendering logic must change per the spec.
- Test with all liturgical seasons: during Lent (Stations promoted), Easter (seasonal cards visible), Ordinary Time (default state).

---

## Test checklist (full)

- [ ] Three visually distinct zones visible when scrolling
- [ ] Zone 1 has warm sacred background containing saint card + seasonal + readings
- [ ] Zone 2 has neutral treatment with prayer grid
- [ ] Zone 3 is collapsible `<details>` with chevron and count badge
- [ ] Zone 3 remembers open/close state across page loads
- [ ] Zone seam micro-ornaments visible (40px line, 0.5 opacity)
- [ ] Section titles use three different typographic treatments
- [ ] Secondary prayer tools hidden behind "More tools" disclosure by default
- [ ] Promoted secondary card bypasses disclosure (shows directly)
- [ ] Library teaser appears between Zone 2 and Zone 3
- [ ] Reading entries slightly more compact inside Zone 1
- [ ] All CCC pills, Scripture refs, and term definitions still work inside Zone 3
- [ ] Dark mode: all three zones look correct, seams subtle
- [ ] Mobile: zones stack naturally, no horizontal overflow
- [ ] Desktop (>680px): zones respect max-width
- [ ] Build passes: `npm run build`
- [ ] No console errors on More tab load
