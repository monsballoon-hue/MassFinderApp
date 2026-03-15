# UX Spec — At a Glance Card Pattern

**Prefix:** AGC · **Created:** 2026-03-15 · **Items:** 2  
**Depends on:** Content_Spec_AtAGlance.md (CON-32 through CON-37, CON-38)  
**Catholic Review:** Review_CON_AtAGlance.md — approved with two copy adjustments (CON-34, CON-36)  
**Status:** Queued

---

## Context

Content & Voice produced "At a Glance" summaries for five devotional guides: Sunday Obligation, Confession, Latin Mass, Divine Mercy, and Stations of the Cross. These are 2–3 sentence orientation blocks prepended inside each guide's `body` string, appearing in both the More tab accordion (`.devot-body`) and the reader guide overlay (`.reader-guide-body`).

This spec defines the visual treatment (`.devot-glance`) and fixes a cascading selector break in the reader overlay.

---

## AGC-01 — `.devot-glance` Visual Pattern

**Problem:**  
The proposed treatment (left-border + italic + `--color-sacred` + `--font-prayer`) is visually indistinguishable from existing blockquote styling in the reader overlay (`css/app.css` line 1923: `.reader-guide-body blockquote` uses `border-left:3px solid var(--color-sacred); font-style:italic; font-family:var(--font-prayer)`). In the accordion context, `.devot-body blockquote` (line 1913) also uses prayer font + italic. The glance card reads as a pull-quote, not an orientation card.

Dorothy (72) struggles with italic Georgia at `--text-sm` — italic reduces letter recognition speed for older readers with bifocals. Paul (25) skims past it as decorative. Sarah (45) misses the off-ramp because it blends into body copy.

**Fix:**  
Use `--font-body` (Source Sans) instead of `--font-prayer`. Keep left-border `--color-sacred`. NO italic. Subtle background. This creates a visually distinct "summary box" pattern that all three demographics parse correctly.

**File:** `css/app.css`  
**Insert after:** line 1913 (`.devot-body blockquote` rule)

```css
/* AGC-01: At a Glance orientation card — prepended in devotional guide bodies */
.devot-glance {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  line-height: 1.65;
  color: var(--color-text-secondary);
  background: color-mix(in srgb, var(--color-sacred) 6%, transparent);
  border-left: 3px solid var(--color-sacred);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  padding: var(--space-3) var(--space-4);
  margin-bottom: var(--space-4);
}
.devot-glance strong {
  color: var(--color-text-primary);
  font-weight: var(--weight-semibold);
}
html[data-theme="dark"] .devot-glance {
  background: color-mix(in srgb, var(--color-sacred) 8%, transparent);
  border-left-color: var(--color-sacred);
}
```

**Design decisions:**

| Property | Value | Rationale |
|----------|-------|-----------|
| `font-family` | `var(--font-body)` | Distinguishes from blockquotes (`--font-prayer`). This is practical UI, not sacred text. |
| `font-style` | normal (not italic) | Italic + serif at `--text-sm` fails Dorothy. Upright sans-serif is the most scannable option. |
| `border-left` | `3px solid var(--color-sacred)` | Consistent `--color-sacred` for all five guides. NOT `--color-accent` for Stations — see rationale below. |
| `background` | `color-mix(in srgb, var(--color-sacred) 6%, transparent)` | Subtle warm tint. 6% is enough to register as a distinct zone without competing with `devot-card[open]` gradient (which uses `--color-sacred-pale`). |
| `border-radius` | `0 var(--radius-sm) var(--radius-sm) 0` | Left edge flush with border; right edge softened. Matches the app's use of left-border accents (e.g., `reader-guide-body blockquote`, `evt-yc-banner`). |
| `padding` | `var(--space-3) var(--space-4)` | Compact — 12px top/bottom, 16px left/right. Enough breathing room without pushing body content down too far. |
| `margin-bottom` | `var(--space-4)` | 16px gap between glance and the first body paragraph. Enough visual separation. |

**Why `--color-sacred` for all five (including Stations):**
1. Glance card is a structural pattern — mixing `--color-accent` for one guide creates visual inconsistency.
2. Stations is inside the Devotions group, which uses `--color-sacred` for icon backgrounds (lines 1894–1896). Mixing accent into a child element breaks hierarchy.
3. `.devot-card--seasonal` (line 1902) is reserved for season-gated guides. Stations isn't season-gated.

**Dark mode notes:**  
8% sacred mix in dark mode (vs 6% light) compensates for the darker surface. `--color-sacred` dark value is `#D4A84B` (line 153), which is already brighter than the light-mode `#B8963F`. The border-left-color explicit declaration ensures it picks up the dark token.

**Test checklist:**
- [ ] Glance card is visually distinct from blockquotes in both accordion and reader overlay
- [ ] Left border color matches `--color-sacred` in light and dark mode
- [ ] Background tint is subtle but visible in both modes
- [ ] Font is Source Sans (not Georgia) — compare against a blockquote in the same view
- [ ] Card appears inside `.devot-body` (accordion) and `.reader-guide-body` (overlay) — verify both
- [ ] All five guides show the same visual treatment (no accent-color variants)
- [ ] Margin-bottom creates clear separation from the first body paragraph
- [ ] Text is readable at `--text-sm` (15px) for Dorothy — upright, sufficient contrast

---

## AGC-02 — Reader Overlay `p:first-child` → `p:first-of-type` Fix

**Problem:**  
Line 1919: `.reader-guide-body p:first-child { font-size:var(--text-base); color:var(--color-text-primary); line-height:1.65; }`

When a `<div class="devot-glance">` is prepended before the first `<p>`, the `<div>` becomes the first child. `p:first-child` stops matching because the `<p>` is now the second child. Result: the opening paragraph drops from `--text-base` (17px) to `--text-sm` (15px) and from `--color-text-primary` to `--color-text-secondary`. Visual hierarchy inverts.

Line 1932 has the same issue: `html[data-theme="dark"] .reader-guide-body p:first-child`.

This affects ALL five guides that get a glance card, plus it silently breaks any future guide that prepends a non-`<p>` element.

**Fix:**  
Change `p:first-child` to `p:first-of-type` in both selectors. This matches the first `<p>` element regardless of preceding sibling types.

**File:** `css/app.css`

**Before (line 1919):**
```css
.reader-guide-body p:first-child { font-size:var(--text-base);color:var(--color-text-primary);line-height:1.65; }
```

**After:**
```css
.reader-guide-body p:first-of-type { font-size:var(--text-base);color:var(--color-text-primary);line-height:1.65; }
```

**Before (line 1932):**
```css
html[data-theme="dark"] .reader-guide-body p:first-child { color:var(--color-text-primary); }
```

**After:**
```css
html[data-theme="dark"] .reader-guide-body p:first-of-type { color:var(--color-text-primary); }
```

**Cascading impact:** None negative. Currently, guides don't prepend non-`<p>` elements, so the selector change is backward-compatible. After the glance card is added, `p:first-of-type` correctly targets the first prose paragraph.

**Dark mode notes:** The dark-mode rule preserves `--color-text-primary` for the enlarged first paragraph. Same selector fix.

**Test checklist:**
- [ ] Open each of the five guides with glance cards in the reader overlay
- [ ] First prose paragraph (after the glance card) renders at `--text-base` (17px), not `--text-sm`
- [ ] First prose paragraph uses `--color-text-primary`, not `--color-text-secondary`
- [ ] Toggle dark mode — verify first paragraph still gets `--color-text-primary`
- [ ] Open a guide WITHOUT a glance card (e.g., Adoration, Novena) — verify first paragraph is unchanged
- [ ] Accordion view (`.devot-body`) is unaffected — it doesn't use `p:first-child`

---

## HTML Pattern (for Content & Voice reference)

The glance card is inserted as the first element inside the `body` string:

```html
<div class="devot-glance">
  <strong>At a glance:</strong> [2–3 sentence summary from CON-32 through CON-37]
</div>
<p>The existing opening paragraph continues here...</p>
```

The `<strong>At a glance:</strong>` label is required — it gives Dorothy a semantic anchor ("this is the summary part") and gives Paul a scannable heading-like element. Without it, the card reads as a disconnected sentence.

---

## Visual Hierarchy After Implementation

**Reader overlay (`.reader-guide-body`):**
1. `.devot-glance` — compact, left-border, Source Sans, `--text-sm`, `--color-text-secondary`, subtle background
2. First `<p>` — enlarged via `p:first-of-type`, `--text-base`, `--color-text-primary` (the guide's opening statement)
3. Remaining `<p>` elements — standard `--text-sm`, `--color-text-secondary`
4. `<blockquote>` — Georgia italic, left-border sacred, no background (prayer/quotation)

Each level is visually distinct. The glance card orients; the first paragraph introduces; the body informs; blockquotes pray.

**Accordion (`.devot-body`):**
1. `.devot-glance` — same treatment as reader (the class is context-independent)
2. Body `<p>` — all `--text-sm`, `--color-text-secondary` (no first-child enlargement in accordion)
3. `<blockquote>` — Georgia italic, no left-border (line 1913 has no border in accordion context)

In the accordion, the glance card's left-border + background makes it the most visually distinct element. It's the only element with a background fill — that's intentional. It's the "read this if you read nothing else" block.
