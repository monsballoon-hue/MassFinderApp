# Claude Code Prompt — CCS v2 (Corrective Pass)

**Branch:** `ui-patches`
**Spec:** `docs/plans/UX_Spec_Color_Channel_Separation.md`
**File:** `css/app.css` only — no JS changes

---

## Context

CCS implementation on `ui-patches` is ~85% complete. Token definitions are correct, most sacred/YC/event-category/service-dot migrations landed. But several elements were missed, causing the five-channel separation to be incomplete. When toggling seasons in the dev panel, these elements still shift color when they shouldn't.

## Fixes — grouped by channel

---

### Group A: Perpetual adoration → `--color-svc-adoration` family

These describe a *service type* (perpetual adoration), not temporal urgency or seasonal emphasis. They should use the fixed copper adoration token.

#### Step 1
Selector: `.schedule-perpetual-card` (line 971)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-svc-adoration-pale)`

#### Step 2
Selector: `.schedule-perpetual-card` (line 971)
Property: `border-left` (the color portion)
Before: `3px solid var(--color-accent)`
After: `3px solid var(--color-svc-adoration)`

#### Step 3
Selector: `.schedule-perpetual-title` (line 972)
Property: `color`
Before: `var(--color-accent-text)`
After: `var(--color-svc-adoration)`

#### Step 4
Selector: `html[data-theme="dark"] .schedule-perpetual-card` (line 974)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-svc-adoration-pale)`

#### Step 5
Selector: `html[data-theme="dark"] .schedule-perpetual-title` (line 975)
Property: `color`
Before: `var(--color-accent)`
After: `var(--color-svc-adoration)`

---

### Group B: Devotion card base → `--color-sacred` family

The `.devot-card` is a prayer/devotion tool (Faith Guides, Rosary, Stations, etc.) on the More tab. The base open state and icon should use sacred gold — these are *sacred content*, not seasonal emphasis. The `.devot-card--seasonal` variant is correctly seasonal and should NOT be changed.

#### Step 6
Selector: `.devot-icon` (line 1621)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-sacred-pale)`

#### Step 7
Selector: `html[data-theme="dark"] .devot-icon` (line 1623)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-sacred-pale)`

#### Step 8
Selector: `.devot-card[open]` (line 1624)
Property: `border-left` (color portion)
Before: `3px solid var(--color-accent)`
After: `3px solid var(--color-sacred)`

#### Step 9
Selector: `.devot-card[open]` (line 1624)
Property: `background` (gradient)
Before: `linear-gradient(135deg, var(--color-accent-pale) 0%, var(--color-surface) 60%)`
After: `linear-gradient(135deg, var(--color-sacred-pale) 0%, var(--color-surface) 60%)`

#### Step 10
Selector: `html[data-theme="dark"] .devot-card[open]` (line 1625)
Property: `background` (gradient)
Before: `linear-gradient(135deg, color-mix(in srgb, var(--color-accent) 6%, transparent) 0%, var(--color-surface) 40%)`
After: `linear-gradient(135deg, color-mix(in srgb, var(--color-sacred) 6%, transparent) 0%, var(--color-surface) 40%)`

#### Step 11
Selector: `html[data-theme="dark"] .devot-card[open]` (line 1625)
Property: `border-left-color`
Before: `var(--color-accent)`
After: `var(--color-sacred)`

---

### Group C: Bible verse highlight → `--color-sacred-pale`

Scripture content — should always be warm gold, never seasonal.

#### Step 12
Selector: `.bible-verse--target` (line 2775)
Property: `background` (gradient — two occurrences of accent-pale in same value)
Before: `linear-gradient(to bottom,transparent 0%,var(--color-accent-pale) 8%,var(--color-accent-pale) 92%,transparent 100%)`
After: `linear-gradient(to bottom,transparent 0%,var(--color-sacred-pale) 8%,var(--color-sacred-pale) 92%,transparent 100%)`

---

### Group D: Dark mode devotional event icon → `--color-cat-devotional` tokens

These are event category indicators, not seasonal. The light mode rules (lines 794–795) were correctly migrated. The dark mode override was missed and still uses hardcoded hex.

#### Step 13
Selector: `html[data-theme="dark"] .ce-item-icon--devotional` (line 810)
Property: `background`
Before: `rgba(167,93,228,0.12)`
After: `var(--color-cat-devotional-pale)`

#### Step 14
Selector: `html[data-theme="dark"] .ce-item-icon--devotional svg` (line 811)
Property: `color`
Before: `#C084FC`
After: `var(--color-cat-devotional)`

---

### Group E: Schedule metadata badges → neutral `--color-primary` family

The recurrence badge ("Every week") and vigil badge ("Vigil Mass") are schedule classification labels — not temporal urgency, not sacred content, not seasonal. They should use the stable primary/neutral palette.

#### Step 15
Selector: `.schedule-recurrence-badge` (line 948)
Property: `color`
Before: `var(--color-accent-text)`
After: `var(--color-primary)`

#### Step 16
Selector: `.schedule-recurrence-badge` (line 948)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-primary-bg)`

#### Step 17
Selector: `html[data-theme="dark"] .schedule-recurrence-badge` (line 949)
Property: `color`
Before: `var(--color-accent)`
After: `var(--color-primary)`

#### Step 18
Selector: `html[data-theme="dark"] .schedule-recurrence-badge` (line 949)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-primary-bg)`

#### Step 19
Selector: `.schedule-vigil-badge` (line 934)
Property: `background`
Before: `var(--color-primary-bg, var(--color-accent-pale))`
After: `var(--color-primary-bg)`
Note: Remove the accent-pale fallback entirely. The primary-bg token is always defined.

#### Step 20
Selector: `html[data-theme="dark"] .schedule-vigil-badge` (line 935)
Property: `color`
Before: `var(--color-accent)`
After: `var(--color-primary)`

#### Step 21
Selector: `html[data-theme="dark"] .schedule-vigil-badge` (line 935)
Property: `background`
Before: `var(--color-accent-pale)`
After: `var(--color-primary-bg)`

---

## Do NOT change

- `.devot-card--seasonal` and its dark variant (lines 1629–1631) — these ARE correctly seasonal
- `.devot-card--seasonal .devot-icon` (line 1630) — correctly seasonal
- All season override rules at `:root[data-season=...]` (lines 1721–1725)
- Saint card `[data-lit-color]` rules (lines 1708–1718)
- Schedule season badges (`.schedule-season-badge--lent` etc.)
- Any rule already using `var(--color-sacred)`, `var(--color-svc-*)`, or `var(--color-cat-*)`
- All temporal/urgency elements: soon badges, imminent borders, today highlights, fasting banner, sched-soon, pull-to-refresh, saved-evt-today, hdo-banner
- All liturgical event elements: `.ce-item-accent.liturgical`, `.ce-item-icon--liturgical`, `.saved-evt-icon--liturgical`, `.saved-evt-cat--liturgical`
- The `.daily-card` and `.return-card` (seasonal liturgical day elements)

---

## Verification

After applying all 21 steps, run these checks:

```bash
# Remaining accent usages (should all be genuinely seasonal/temporal)
grep 'var(--color-accent)' css/app.css | grep -v 'accent-text\|accent-pale\|accent-light\|accent-bg' | grep -v '^\s*--' | wc -l
# Target: ~24 (down from 29, removed 5: perpetual ×2, devot-card[open] ×2, dark devot-card[open] border)

grep -c 'var(--color-accent-text)' css/app.css
# Target: ~18 (total including definitions; non-def should be ~14, down from 16, removed recurrence + perpetual)

grep -c 'var(--color-accent-pale)' css/app.css
# Target: ~21 (total including definitions; non-def should be ~16, down from 27, removed perpetual ×2, devot-icon ×2, devot-card[open] ×1, bible-verse ×1, recurrence ×2, vigil ×2 = 12 removals... wait)

# Hardcoded hex — should be ZERO outside token definitions and saint card vestment:
grep -n 'rgba(167,93,228' css/app.css
# Target: 0 occurrences

grep -n '#C084FC' css/app.css
# Target: 0 occurrences
```

### Visual verification in browser:

1. Open dev panel, set season to `lent` (purple)
   - Perpetual adoration card: should be copper, NOT purple
   - Devotion card (open any Faith Guide): should be warm gold border, NOT purple
   - Bible verse highlight: should be warm gold, NOT purple
   - Recurrence/vigil badges: should be navy/neutral, NOT purple
   - "Starting soon" badges, today highlights: SHOULD be purple (seasonal ✓)

2. Switch to `ordinary` (green)
   - Same non-seasonal elements: unchanged (copper, gold, navy)
   - Temporal elements: should shift to green

3. Toggle dark mode in each season
   - All elements readable, correct channel colors maintained
