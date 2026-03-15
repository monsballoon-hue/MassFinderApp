# Claude Code Prompt — CON Series (Content & Voice Pass)

**Spec:** `docs/plans/Content_Spec_Audit_v1.md`  
**Items:** 29 (CON-01 through CON-29)  
**Branch:** `main` (content-only changes, no structural risk)

---

## Pre-flight

1. Read `docs/plans/Content_Spec_Audit_v1.md` in full.
2. Read `docs/TERMINOLOGY.md` for Catholic terminology rules.
3. Read `CLAUDE.md` for project conventions (CommonJS, no arrow functions, config.js canonical).

---

## Implementation Order

### Pass 1: Priority 1 (High-traffic, high-impact)

**CON-01** — `src/devotions.js` → `DEVOTIONAL_GUIDES[0].body`  
Replace the entire `body` string of the first guide (Sunday Obligation) with the draft in the spec. Preserve the `icon`, `title`, `findLabel`, `filter` properties unchanged. The body is a single concatenated string of HTML — replace it wholesale.

**CON-02** — `src/saved.js` → empty state block (~line 281)  
Find the `<h3>Your parish dashboard</h3>` block and replace the `<h3>`, `<p>`, and `<p class="saved-empty-hint">` with spec text. Keep the button unchanged.

**CON-16** — `src/settings.js` → `_render()` → About section  
Find the `settings-about-block` div. Replace its contents with the three `<p>` tags from the spec. Keep the `lastUpdated` row below it unchanged.

**CON-28** — SKIP. Blocked pending Catholic Review.

### Pass 2: Priority 2 (Polish and consistency)

**CON-03** — `src/devotions.js` → `DEVOTIONAL_GUIDES[2].body` (Lent, `season:'lent'`)  
Replace the entire `body` string. Verify the `<details>` elements use class `conf-exam` (same as existing Confession guide pattern).

**CON-04** — `src/devotions.js` → `DEVOTIONAL_GUIDES[3].body` (Easter, `season:'easter'`)  
Replace the entire `body` string.

**CON-05** — `src/devotions.js` → `DEVOTIONAL_GUIDES[4].body` (Advent, `season:'advent'`)  
Replace the entire `body` string.

**CON-06** — `src/devotions.js` → `DEVOTIONAL_GUIDES[5].body` (Christmas, `season:'christmas'`)  
Replace the entire `body` string.

**CON-07** — Multiple files. After CON-03 through CON-06 are done, grep for remaining "the faithful" in `src/devotions.js` and `src/more.js` body copy (NOT inside CCC direct quote strings that start with `"` or `\u201c`). Replace per spec table.

**CON-08** — `src/more.js` → find `'31 prayers'` string in prayerBookGateway. Replace with `'Common prayers'`.

**CON-09** — `src/render.js` → find `'No churches found'`. Replace `<h3>` and `<p>` per spec.

**CON-10** — `src/readings.js` → `renderFastingBanner()`. Find the two `fasting-banner-title` and `fasting-banner-desc` strings. Replace per spec.

**CON-11** — `src/render.js` → find the sparse message string. Replace per spec.

**CON-12** — `src/forms.js` → find each toast string listed in the spec table. Replace per spec. Do NOT change strings in `src/settings.js` or `src/examination.js` (those are already fine per spec).

**CON-13** — `src/more.js` → `MONTHLY_DEVOTIONS` array. For each month listed in the spec:
- Add `action` and `actionFn` properties where specified
- Add second `<p>` paragraph to `body` string where specified
- Do not touch months not mentioned in the spec

**CON-17** — `src/devotions.js` → `DEVOTIONAL_GUIDES` array. Add the Ordinary Time guide object from the spec. Insert it after the Christmas guide (index 5) and before the Devotions group. It must have `season: 'ordinary'`.

### Pass 3: Priority 3 (Nice-to-have)

**CON-14** — `src/more.js` → moreFooter. Replace `'MassFinder v2'` with `'MassFinder \\u00b7 A Catholic stewardship project'`.

**CON-15** — `src/more.js`:
1. libraryTeaser: Replace the innerHTML of the `libTeaser` block with the spec's Explore-linked version. This requires `openExplore` to be a valid global function — verify it exists in `src/explore.js` exports and `src/app.js` window bindings.
2. moreFooter: Remove the `more-footer-link--disabled` bulletin row. Keep the Settings button row and version line (now updated by CON-14).

**CON-18** — `src/prayerbook.js` → `_renderList()`. When `!_searchQuery`, add `'<div class="prayerbook-intro">Your companion for daily prayer</div>'` before the `prayerbook-quick` div. Add the CSS class to `css/app.css` per spec.

**CON-19** — `src/novena.js` → `_renderSelect()`. Check if any novenas are active. If not, add the intro line before the "Available Novenas" label. Add CSS class to `css/app.css`.

**CON-20** — `src/rosary.js` → `_renderSelect()`. Add subtitle `<div>` elements under each mystery button per spec table. Add CSS class `rosary-mystery-desc`.

**CON-21** — `src/stations.js` → `_renderIntro()`. Append the duration sentence to the existing instruction text.

**CON-22** — `src/examination.js` → opening screen render. Add the hint `<p>` after the "Begin Examination" button. Add both `en` and `es` versions. Add CSS class.

**CON-23** — `index.html` → search input placeholder. Change to spec text.

**CON-24** — `src/explore.js` → `_renderLanding()`. Add subtitle divs below each source title. Add CSS class `explore-source-subtitle`.

**CON-25** — `src/saved.js` → greeting logic. Add the `MONTH_DEVOTIONS_SHORT` array and inject during Ordinary Time (when `curSeason === 'ordinary'`). Format: `' · ' + MONTH_DEVOTIONS_SHORT[new Date().getMonth()]`.

**CON-26** — `src/chaplet.js` → `_renderIntro()`. Add the description paragraph per spec.

**CON-27** — `src/devotions.js` → Divine Mercy Chaplet body. Change `'centred'` to `'centered'`.

**CON-29** — Multiple files. Find each loading message string per spec table. Replace.

---

## After Implementation

1. Run `npm run build` to verify no syntax errors.
2. Visually spot-check:
   - More tab → open each devotional guide → verify collapsibles work
   - More tab → scroll to footer → verify identity line
   - Saved tab (no favorites) → verify empty state
   - Settings → About section → verify copy
   - Find tab → search for gibberish → verify "No matches found"
   - Open Rosary → verify mystery descriptors
   - Open Stations → verify duration line
   - Open Examination → verify hint below Begin button
3. Mark items done in `docs/reference/COMPLETED_SPECS.md`.
4. Commit: `git commit -m "content: full voice & content pass (CON series, 29 items)"`

---

## Items NOT to implement (blocked/handoff)

- **CON-28** — Blocked pending Catholic Review (Act of Contrition alignment)
- Any items requiring UX & Design work (D-01 onboarding, D-09 filter context links) — these are noted in the audit but NOT in this spec

---

## CSS Classes to Add

Add these to `css/app.css` in the appropriate sections:

```css
/* CON-18: Prayer Book intro */
.prayerbook-intro {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--space-3) 0 var(--space-1);
  letter-spacing: 0.02em;
}

/* CON-19: Novena newcomer intro */
.novena-intro {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  color: var(--color-text-tertiary);
  text-align: center;
  padding: var(--space-2) var(--space-4) var(--space-4);
  line-height: 1.6;
}

/* CON-20: Rosary mystery descriptors */
.rosary-mystery-desc {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}

/* CON-22: Examination opening hint */
.exam-opening-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  text-align: center;
  margin-top: var(--space-3);
}

/* CON-24: Explore source subtitles */
.explore-source-subtitle {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  margin-top: var(--space-1);
}
```

These all use existing design tokens and will work in both light and dark mode.
