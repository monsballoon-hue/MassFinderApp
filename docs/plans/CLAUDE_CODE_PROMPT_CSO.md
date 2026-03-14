# Claude Code Prompt — CSO (Color System Overhaul)

**Branch:** `ui-patches`
**Spec:** `docs/plans/UX_Spec_Color_System_Overhaul.md`
**Assessment:** `docs/plans/COLOR_SYSTEM_ASSESSMENT_v2_FINAL.md`
**File:** `css/app.css` only — NO JS changes

---

## What this does

Reduces the seasonal accent from 60 touchpoints to ~16. Adds a fixed warm amber for temporal urgency ("starting soon / today"), a fixed warm tone for notice banners (fasting/HDO), makes seasonal atmosphere ultra-subtle, and neutralizes accent-colored body text. After this, every color means one specific thing.

## Execute in this exact order

---

### Step 1: Add new tokens to `:root`

After the line `--color-cat-volunteering-pale: #FBF0EB;` (around line 60), add:

```css
/* ── Temporal urgency — fixed warm amber, never shifts ── */
--color-soon: #C8850D;
--color-soon-text: #8B5E06;
--color-soon-pale: #FEF6E7;
/* ── Notice banners — fixed warm tone for fasting/HDO ── */
--color-notice: #A16B2A;
--color-notice-pale: #FDF5E6;
```

### Step 2: Add new tokens to `html[data-theme="dark"]`

After the line `--color-cat-volunteering-pale: #2A1810;` (around line 123), add:

```css
--color-soon: #E5A33D;
--color-soon-text: #E5A33D;
--color-soon-pale: #2A1F0A;
--color-notice: #D4A84B;
--color-notice-pale: #2A2010;
```

---

### Step 3: Temporal urgency — Find tab cards

**Line 513** — `.card-soon-badge`
Before: `color: var(--color-accent-text); background: var(--color-accent-pale);`
After: `color: var(--color-soon-text); background: var(--color-soon-pale);`

**Line 514** — `.card-soon-badge .pulse-dot`
Before: `background: var(--color-accent);`
After: `background: var(--color-soon);`

**Line 521** — `.parish-card--soon`
Before: `border-left:3px solid var(--color-accent);background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);`
After: `border-left:3px solid var(--color-soon);background:linear-gradient(135deg, var(--color-soon-pale) 0%, var(--color-surface) 60%);`

**Line 523** — `.parish-card--imminent`
Before: `border-left:3px solid var(--color-accent);`
After: `border-left:3px solid var(--color-soon);`

**Line 524** — `.card-imminent-badge`
Before: `color:var(--color-accent-text);background:var(--color-accent-pale);`
After: `color:var(--color-soon-text);background:var(--color-soon-pale);`

**Line 533** — `html[data-theme="dark"] .parish-card--soon`
Before: `color-mix(in srgb, var(--color-accent) 6%, transparent)`
After: `color-mix(in srgb, var(--color-soon) 6%, transparent)`

---

### Step 4: Temporal urgency — Detail panel

**Line 614** — `.detail-next-badge.soon`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-soon-text);`

**Line 616** — `.detail-next--soon`
Before: `background:var(--color-accent-pale);border:1px solid color-mix(in srgb, var(--color-accent) 12%, transparent);`
After: `background:var(--color-soon-pale);border:1px solid color-mix(in srgb, var(--color-soon) 12%, transparent);`

**Line 625** — `.detail-coming-up`
Before: `background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%);...border-left:3px solid var(--color-accent);`
After: `background:linear-gradient(135deg, var(--color-soon-pale) 0%, var(--color-surface) 60%);...border-left:3px solid var(--color-soon);`

**Line 639** — `.detail-coming-row--soon`
Before: `border-left:3px solid var(--color-accent);`
After: `border-left:3px solid var(--color-soon);`

**Line 641** — `html[data-theme="dark"] .detail-coming-up`
Before: `color-mix(in srgb, var(--color-accent) 6%, transparent)`
After: `color-mix(in srgb, var(--color-soon) 6%, transparent)`

---

### Step 5: Temporal urgency — Schedule

**Line 908** — `.schedule-day--today`
Before: `background: var(--color-accent-pale);`
After: `background: var(--color-soon-pale);`

**Line 918** — `html[data-theme="dark"] .schedule-day--today`
Before: `color-mix(in srgb, var(--color-accent) 6%, transparent)`
After: `color-mix(in srgb, var(--color-soon) 6%, transparent)`

**Line 1301** — `.sched-soon`
Before: `border-left:2px solid var(--color-accent);`
After: `border-left:2px solid var(--color-soon);`

**Line 1303** — `.sched-soon-badge`
Before: `color:var(--color-accent-text);background:var(--color-accent-pale);`
After: `color:var(--color-soon-text);background:var(--color-soon-pale);`

---

### Step 6: Temporal urgency — Saved tab

**Line 1359** — `.saved-evt-today`
Before: `border-left:3px solid var(--color-accent);...background:color-mix(in srgb, var(--color-accent) 4%, transparent);`
After: `border-left:3px solid var(--color-soon);...background:color-mix(in srgb, var(--color-soon) 4%, transparent);`

**Line 1360** — `html[data-theme="dark"] .saved-evt-today`
Before: `color-mix(in srgb, var(--color-accent) 6%, transparent)`
After: `color-mix(in srgb, var(--color-soon) 6%, transparent)`

**Line 1368** — `.saved-evt-today-badge`
Before: `color:var(--color-accent);`
After: `color:var(--color-soon-text);`

---

### Step 7: Temporal urgency — Liturgical "soon" badge

**Line 1587** — `.litu-soon`
Before: `color: var(--color-accent-text); background: var(--color-accent-pale);`
After: `color: var(--color-soon-text); background: var(--color-soon-pale);`

---

### Step 8: Notice banners — Fasting

**Line 1755** — `.fasting-banner`
Before: `background:var(--color-accent-pale);border:1px solid color-mix(in srgb, var(--color-accent) 25%, transparent);`
After: `background:var(--color-notice-pale);border:1px solid color-mix(in srgb, var(--color-notice) 25%, transparent);`

**Line 1756** — `.fasting-banner--full`
Before: `border-color:color-mix(in srgb, var(--color-accent) 35%, transparent);`
After: `border-color:color-mix(in srgb, var(--color-notice) 35%, transparent);`

**Line 1762** — `html[data-theme="dark"] .fasting-banner`
Before: `background:var(--color-accent-pale);border-color:color-mix(in srgb, var(--color-accent) 20%, transparent);`
After: `background:var(--color-notice-pale);border-color:color-mix(in srgb, var(--color-notice) 20%, transparent);`

**Line 1763** — `html[data-theme="dark"] .fasting-banner--full`
Before: `border-color:color-mix(in srgb, var(--color-accent) 30%, transparent);`
After: `border-color:color-mix(in srgb, var(--color-notice) 30%, transparent);`

---

### Step 9: Notice banners — HDO

**Line 1749** — `.hdo-banner`
Before: `background:var(--color-accent-pale);border:1px solid var(--color-accent-light);`
After: `background:var(--color-notice-pale);border:1px solid var(--color-notice);`

**Line 1750** — `.hdo-banner-label`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-notice);`

**Line 1752** — `.hdo-banner-cta`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-notice);`

---

### Step 10: Daily card neutralization

**Line 224** — `.daily-card`
Before: `background:linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 100%);border-radius:var(--radius-md);`
After: `background:var(--color-surface);border-left:3px solid var(--color-accent);border-radius:0;`

Note: The border-radius change to 0 is because single-sided borders should not have rounded corners per design rules. Keep all other properties (padding, cursor, transition, animation, margin-top) unchanged.

**Line 232** — `.daily-card-secondary`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-text-secondary);`

**Line 238** — `html[data-theme="dark"] .daily-card-secondary`
Before: `color:var(--color-accent-light);`
After: `color:var(--color-text-secondary);`

---

### Step 11: Return card neutralization

**Line 298** — `.return-card`
Before: `background:var(--color-accent-pale);`
After: `background:var(--color-surface-hover);`

**Line 299** — `.return-text`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-text-secondary);`

**Line 300** — `.return-dismiss`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-text-tertiary);`

---

### Step 12: Card event row and countdown neutralization

**Line 508** — `.card-evt-row`
Before: `color:var(--color-accent-text);`
After: `color:var(--color-text-secondary);`

**Line 816** — `.ce-item-when .ce-countdown`
Before: `color: var(--color-accent-text);`
After: `color: var(--color-text-secondary);`

---

### Step 13: Season override accent-pale values — make ultra-subtle

**Line 1721** — `:root[data-season="lent"]`
Change `--color-accent-pale:#F3E8FF` to `--color-accent-pale:#F7F5FA`

**Line 1722** — `:root[data-season="advent"]`
Change `--color-accent-pale:#F3E8FF` to `--color-accent-pale:#F7F5FA`

**Line 1723** — `:root[data-season="easter"]`
Change `--color-accent-pale:#FEF3C7` to `--color-accent-pale:#FBF9F3`

**Line 1724** — `:root[data-season="christmas"]`
Change `--color-accent-pale:#FEF3C7` to `--color-accent-pale:#FBF9F3`

**Line 1725** — `:root[data-season="ordinary"]`
Change `--color-accent-pale:#DCFCE7` to `--color-accent-pale:#F5F8F5`

---

### Step 14: Body gradients — make ultra-subtle

**Line 1728** — `:root[data-season="lent"] body`
Before: `background:linear-gradient(180deg, #F8F7F4 0%, #F0ECF5 100%);`
After: `background:linear-gradient(180deg, #F8F7F4 0%, #F5F3F7 100%);`

**Line 1729** — `:root[data-season="advent"] body`
Before: `background:linear-gradient(180deg, #F8F7F4 0%, #F0ECF5 100%);`
After: `background:linear-gradient(180deg, #F8F7F4 0%, #F5F3F7 100%);`

**Line 1730** — `:root[data-season="easter"] body`
Before: `background:linear-gradient(180deg, #F8F7F4 0%, #F9F6ED 100%);`
After: `background:linear-gradient(180deg, #F8F7F4 0%, #F8F7F2 100%);`

**Line 1731** — `:root[data-season="christmas"] body`
Before: `background:linear-gradient(180deg, #F8F7F4 0%, #F9F6ED 100%);`
After: `background:linear-gradient(180deg, #F8F7F4 0%, #F8F7F2 100%);`

**Line 158** — `html[data-theme="dark"][data-season="lent/advent"] body`
Before: `background: linear-gradient(180deg, #1A1C22 0%, #1E1A28 100%);`
After: `background: linear-gradient(180deg, #1A1C22 0%, #1C1A22 100%);`

**Line ~165** — `html[data-theme="dark"][data-season="easter/christmas"] body`
Before: `background: linear-gradient(180deg, #1A1C22 0%, #1E1C18 100%);`
After: `background: linear-gradient(180deg, #1A1C22 0%, #1C1B1A 100%);`

---

### Step 15: Prayer overlay subtlety — reader-overlay

**Line 1797** — `:root[data-season="lent"] .reader-overlay`
Before: `background:linear-gradient(180deg,#F6F4F8 0%,#EDE8F2 100%);`
After: `background:linear-gradient(180deg,#F6F4F8 0%,#F2EFF5 100%);`

**Line 1798** — `:root[data-season="advent"] .reader-overlay`
Same change as lent.

**Line 1799** — `:root[data-season="easter"] .reader-overlay`
Before: `background:linear-gradient(180deg,#F8F6F1 0%,#F2EDDF 100%);`
After: `background:linear-gradient(180deg,#F8F6F1 0%,#F4F1EA 100%);`

**Line 1800** — `:root[data-season="christmas"] .reader-overlay`
Same change as easter.

**Line 1801** — `:root[data-season="ordinary"] .reader-overlay`
Before: `background:linear-gradient(180deg,#F6F8F5 0%,#ECF0EA 100%);`
After: `background:linear-gradient(180deg,#F6F8F5 0%,#F0F2EE 100%);`

---

### Step 16: Prayer overlay subtlety — reader-body

**Line 1822** — `:root[data-season="lent"] .reader-body, :root[data-season="advent"] .reader-body`
Before: `background:linear-gradient(180deg,#F6F4F8 0%,#EDE8F2 100%);`
After: `background:linear-gradient(180deg,#F6F4F8 0%,#F2EFF5 100%);`

**Line 1823** — `:root[data-season="easter"] .reader-body, :root[data-season="christmas"] .reader-body`
Before: `background:linear-gradient(180deg,#F8F6F1 0%,#F2EDDF 100%);`
After: `background:linear-gradient(180deg,#F8F6F1 0%,#F4F1EA 100%);`

**Line 1824** — `:root[data-season="ordinary"] .reader-body`
Before: `background:linear-gradient(180deg,#F6F8F5 0%,#ECF0EA 100%);`
After: `background:linear-gradient(180deg,#F6F8F5 0%,#F0F2EE 100%);`

---

### Step 17: Prayer overlay subtlety — CCC sheet

**Line 2552** — `:root[data-season="lent"] .ccc-sheet`
Before: `background:linear-gradient(180deg,#F6F4F8 0%,#EDE8F2 100%);`
After: `background:linear-gradient(180deg,#F6F4F8 0%,#F2EFF5 100%);`

**Line 2553** — `:root[data-season="advent"] .ccc-sheet`
Same change.

**Line 2554** — `:root[data-season="easter"] .ccc-sheet`
Before: `background:linear-gradient(180deg,#F8F6F1 0%,#F2EDDF 100%);`
After: `background:linear-gradient(180deg,#F8F6F1 0%,#F4F1EA 100%);`

**Line 2555** — `:root[data-season="christmas"] .ccc-sheet`
Same change.

**Line 2556** — `:root[data-season="ordinary"] .ccc-sheet`
Before: `background:linear-gradient(180deg,#F6F8F5 0%,#ECF0EA 100%);`
After: `background:linear-gradient(180deg,#F6F8F5 0%,#F0F2EE 100%);`

---

## Verification

After all steps, run:

```bash
# New tokens present
grep -c 'color-soon' css/app.css
# Should be 20+ (definitions + usages)

grep -c 'color-notice' css/app.css
# Should be 12+ (definitions + usages)

# Remaining accent (ONLY seasonal elements)
grep 'var(--color-accent)' css/app.css | grep -v 'accent-text\|accent-pale\|accent-light\|accent-bg' | grep -v '^\s*--' | wc -l
# Target: ~14-16

grep 'var(--color-accent-text)' css/app.css | grep -v '^\s*--' | wc -l
# Target: ~3-4

grep 'var(--color-accent-pale)' css/app.css | grep -v '^\s*--' | wc -l
# Target: ~6-8

# Zero remaining accent on temporal elements
grep 'soon-badge\|imminent-badge\|parish-card--soon\|parish-card--imminent\|sched-soon\|saved-evt-today\|litu-soon\|detail-coming\|detail-next.*soon\|schedule-day--today' css/app.css | grep -c 'color-accent'
# Target: 0

# Zero remaining accent on notice banners
grep 'fasting-banner\|hdo-banner' css/app.css | grep -c 'color-accent'
# Target: 0
```

### Visual test in browser with dev panel:

1. **Set season to Lent** → header line purple, body barely tinted, daily card has purple left border but white fill, "starting soon" badges are warm amber NOT purple, fasting banner is warm tone NOT purple
2. **Switch to Ordinary** → header line green, body barely tinted, daily card green left border, all non-seasonal elements UNCHANGED
3. **Switch to Easter** → same pattern, gold header, everything else stays
4. **Toggle dark mode** in each season → all readable, seasonal gradients present but subtle

## Do NOT change

- Saint card `[data-lit-color]` rules
- `.devot-card--seasonal` + variants (correctly seasonal)
- Schedule season badges (`.schedule-season-badge--*`)
- Any `var(--color-sacred)` usage
- Any `var(--color-svc-*)` or `var(--color-cat-*)` usage
- `.ce-item-accent.liturgical` + icon variants
- `.saved-evt-cat--liturgical` / `.saved-evt-icon--liturgical`
- `.saved-header-season`
- `.saved-evt-season-*` borders
- Header accent line rules
- `.tab-saved-badge` / `.tab-more-badge` dots
- `.pull-indicator` / `.map-locate-loading`
- `.skip-link:focus`
- Reader/CCC/prayer dark mode rules (keep current dark values)
