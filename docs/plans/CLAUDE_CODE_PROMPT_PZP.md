# CLAUDE_CODE_PROMPT_PZP.md — Prayer Zone Polish

**Spec:** `docs/plans/UX_Spec_Prayer_Zone_Polish.md`  
**Series:** PZP-01 through PZP-04  
**Scope:** More tab Zone 2 labels, spacing, placeholder

---

## PZP-01: Rename "Examination of Conscience" → "Examine Your Conscience"

1. `src/more.js` ~line 900: change `title: 'Examination of Conscience'` → `title: 'Examine Your Conscience'`
2. `src/examination.js`: find `getTitle` in the reader module registration, change return value to `'Examine Your Conscience'`
3. Search `src/examination.js` for any other display-facing string `'Examination of Conscience'` used as headings and update to `'Examine Your Conscience'`
4. Do NOT change internal variable names, CSS class names, or comments — only user-facing display strings

## PZP-02: Tighten "Guided Prayer" header margin

1. `css/app.css` ~line 1588: add `margin-bottom: var(--space-2);` to `.more-section-title--pray`

## PZP-03: "Your Practice" → "Ongoing Devotions"

1. `src/more.js` ~line 959: change `'Your Practice'` → `'Ongoing Devotions'` in the `practiceStrip.innerHTML` assignment

## PZP-04: Library teaser → Coming Soon

1. `src/more.js` ~line 977–990: in the `libraryTeaser` block:
   - Remove `onclick="openExplore()"`
   - Remove `role="button" tabindex="0"`
   - Add `coming-soon` to the class: `class="library-teaser coming-soon"`
   - Change icon color from `var(--color-text-secondary)` to `var(--color-text-tertiary)`
   - Add inline style to title: `style="color:var(--color-text-tertiary)"`
   - Change subtitle text from `'Bible, Catechism, Baltimore Catechism & Summa'` to `'Coming soon'`
2. `css/app.css` after the existing `.library-teaser` rules (~line 1808): add:
   ```css
   .library-teaser.coming-soon { opacity:0.5;cursor:default;pointer-events:none; }
   ```

## Verification

- Grid card "Examine Your Conscience" wraps to ≤2 lines at 375px default text
- Reader overlay header says "Examine Your Conscience"
- "Guided Prayer" header margin visually tighter (8px not 12px gap to grid)
- Practice strip label says "Ongoing Devotions"
- Library teaser dimmed, non-interactive, says "Coming soon"
- Dark mode: all 4 items render correctly
- `npm run build` succeeds
