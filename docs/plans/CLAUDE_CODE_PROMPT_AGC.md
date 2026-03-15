# Claude Code Prompt — AGC Series (At a Glance Card Pattern)

**Spec:** `docs/plans/UX_Spec_AtAGlance_Card.md`  
**Items:** 2 (AGC-01, AGC-02)  
**Branch:** `main` (CSS-only changes, no structural risk)

---

## Pre-flight

1. Read `docs/plans/UX_Spec_AtAGlance_Card.md` in full.
2. Read `css/app.css` lines 1905–1942 (devot-body, reader-guide-body context).
3. Confirm line 1913 is `.devot-body blockquote` — insertion point for AGC-01.
4. Confirm line 1919 is `.reader-guide-body p:first-child` — fix target for AGC-02.
5. Confirm line 1932 is `html[data-theme="dark"] .reader-guide-body p:first-child` — second fix target for AGC-02.

---

## Implementation Order

### AGC-02 FIRST (selector fix — prevents hierarchy break)

**File:** `css/app.css`

**Step 1:** Find line 1919:
```css
.reader-guide-body p:first-child { font-size:var(--text-base);color:var(--color-text-primary);line-height:1.65; }
```
Replace `p:first-child` with `p:first-of-type`. Result:
```css
.reader-guide-body p:first-of-type { font-size:var(--text-base);color:var(--color-text-primary);line-height:1.65; }
```

**Step 2:** Find line 1932:
```css
html[data-theme="dark"] .reader-guide-body p:first-child { color:var(--color-text-primary); }
```
Replace `p:first-child` with `p:first-of-type`. Result:
```css
html[data-theme="dark"] .reader-guide-body p:first-of-type { color:var(--color-text-primary); }
```

### AGC-01 (new CSS class)

**File:** `css/app.css`

**Insert after** the `.devot-body blockquote` rule (line 1913). Add these rules on new lines:

```css
/* AGC-01: At a Glance orientation card */
.devot-glance { font-family:var(--font-body);font-size:var(--text-sm);line-height:1.65;color:var(--color-text-secondary);background:color-mix(in srgb, var(--color-sacred) 6%, transparent);border-left:3px solid var(--color-sacred);border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:var(--space-3) var(--space-4);margin-bottom:var(--space-4); }
.devot-glance strong { color:var(--color-text-primary);font-weight:var(--weight-semibold); }
html[data-theme="dark"] .devot-glance { background:color-mix(in srgb, var(--color-sacred) 8%, transparent);border-left-color:var(--color-sacred); }
```

---

## After Implementation

1. Run `npm run build` to verify no syntax errors.
2. Verify:
   - Open any guide in the reader overlay → `p:first-of-type` still enlarges the first paragraph
   - Toggle dark mode → first paragraph still `--color-text-primary`
   - Open a guide WITHOUT a glance card (Adoration, Novena) → confirm no visual change
3. The `.devot-glance` class is now available for the CON series implementation to use when inserting glance HTML into guide body strings.
4. Mark AGC-01 and AGC-02 done in `docs/reference/COMPLETED_SPECS.md`.
5. Commit: `git commit -m "style: add devot-glance pattern, fix reader p:first-child selector (AGC series)"`

---

## NOTE

This spec is CSS-only. The actual glance card HTML insertion into `DEVOTIONAL_GUIDES[].body` strings is part of the CON series (Content_Spec_AtAGlance.md, CON-32 through CON-37). AGC must land BEFORE or WITH the CON At a Glance implementation. AGC-02 is safe to land independently — it's backward-compatible.
