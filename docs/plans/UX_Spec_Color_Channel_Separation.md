# UX Spec: Color Channel Separation

**Prefix:** CCS (Color Channel Separation)
**Created:** 2026-03-14
**Status:** Ready for implementation
**Estimated effort:** 4–5 hours
**Files modified:** `css/app.css` (primary), `src/events.js` (minor class output)

---

## Problem Statement

MassFinder's color system routes ~12 semantic purposes through ~6 functional colors, creating pervasive collision. During Lent (the current season), `--color-accent` resolves to `#7C3AED` purple. Simultaneously, devotional events use `#6B21A8` purple, saint cards with purple liturgical days use `#6B21A8`, and Lent-tagged event borders use `#6B21A8`. The result: every visually differentiated element on screen reads as one undifferentiated purple wash.

This collision recurs in every season:
- **Ordinary Time:** Seasonal accent green (`#16A34A`) collides with verified badges (`#4A7C59`) and social/fellowship events (`var(--color-verified)`)
- **Easter/Christmas:** Seasonal accent gold (`#D97706`) collides identically with `--color-warning` and volunteering events, plus 16 hardcoded `rgba(184,150,63,...)` values that never shift

Additionally, 53 CSS rules use `var(--color-accent)` for purposes that aren't seasonal — CCC blockquotes, Gospel borders, prayer tool promotion, Scripture highlights, rosary beads — flooding the entire UI in whichever season color is active.

### The fix

Separate the color system into **five non-overlapping semantic channels**, each with its own token family:

1. **Seasonal accent** (dynamic) — header line, body wash, today/soon emphasis, season labels
2. **Sacred content** (fixed warm gold) — CCC, Scripture, Gospel, prayer tools, rosary
3. **Service types** (fixed) — Mass, Sacraments, Adoration, Devotion schedule dots and borders
4. **Event categories** (fixed, except liturgical inherits seasonal) — community life items, saved tab event icons
5. **Liturgical vestment** (fixed) — saint card data-lit-color system (already correct, no changes needed)

---

## Demographic walkthrough

**The 72-year-old parishioner:** Currently sees everything highlighted the same purple during Lent. Cannot distinguish between "this is happening soon" (temporal urgency), "this is a devotional event" (category), and "this is the Gospel reading" (sacred content). After fix: the seasonal purple only marks temporal/seasonal things. Sacred text keeps its warm gold. Event categories have distinct, recognizable colors. Cognitive load drops — each color means one thing.

**The 25-year-old phone-native:** Trained by Apple/Google to expect color = meaning. Currently sees purple overload and subconsciously processes it as "this app has one color" — it feels flat and unsophisticated. After fix: the palette has visual rhythm — warm gold for sacred depth, seasonal color for temporal emphasis, distinct teal/plum/terracotta for events. Reads as intentional and polished.

**The 45-year-old parent (one-handed, scanning):** Uses color as a shortcut to find what they need fast. When everything is the same color, scanning fails — they have to read every label. After fix: adoration has a warm copper dot, confession has forest green, a devotional event has a plum accent. Color becomes a reliable wayfinding signal even at a glance.

---

## CCS-01 — New Token Definitions

**File:** `css/app.css` (`:root` block, lines ~46–72)
**What:** Add three new token families after the existing accent tokens.

### Light mode (add after `--color-accent-pale` line):

```css
/* ── Sacred content — fixed warm gold, never shifts with season ── */
--color-sacred: #B8963F;
--color-sacred-text: #7D6520;
--color-sacred-pale: #F5EDD8;

/* ── Service type — fixed, always distinguishable from each other and season ── */
--color-svc-adoration: #B87514;
--color-svc-adoration-pale: #FDF3E3;
--color-svc-devotion: #8B5A6D;
--color-svc-devotion-pale: #F5ECF0;

/* ── Event category — fixed except liturgical (inherits seasonal accent) ── */
--color-cat-devotional: #8B3A62;
--color-cat-devotional-pale: #F7ECF2;
--color-cat-social: #0D7377;
--color-cat-social-pale: #E6F5F5;
--color-cat-volunteering: #B85C38;
--color-cat-volunteering-pale: #FBF0EB;
```

### Dark mode (add inside `html[data-theme="dark"]` block):

```css
--color-sacred: #D4A84B;
--color-sacred-text: #D4A84B;
--color-sacred-pale: #2E2618;

--color-svc-adoration: #E5A33D;
--color-svc-adoration-pale: #2A1F0A;
--color-svc-devotion: #C48A9E;
--color-svc-devotion-pale: #2A1A22;

--color-cat-devotional: #C46B96;
--color-cat-devotional-pale: #2A1520;
--color-cat-social: #38B2AC;
--color-cat-social-pale: #0A2626;
--color-cat-volunteering: #E07C56;
--color-cat-volunteering-pale: #2A1810;
```

### Color rationale

| Token | Hex | Why this color |
|-------|-----|----------------|
| `--color-sacred` | `#B8963F` | The app's original identity gold — warm, contemplative, associated with sacred text from day one. Distinct from Easter gold (`#D97706`) by being more muted/olive. |
| `--color-svc-adoration` | `#B87514` | Warm copper-amber. Distinct from sacred gold (more orange), from Easter gold (less yellow), and from warning amber. Evokes the warm glow of the Blessed Sacrament. |
| `--color-svc-devotion` | `#8B5A6D` | Dusty mauve. Cannot collide with Lent purple (`#7C3AED` is vivid blue-purple; this is warm rose-purple). Soft, contemplative, feminine without being pink. |
| `--color-cat-devotional` | `#8B3A62` | Deep plum. Warmer and redder than Lent purple. Used for devotional *events* (distinct from devotional *service type* — the mauve dot). |
| `--color-cat-social` | `#0D7377` | Deep teal. Clearly distinct from both verified forest green (`#4A7C59`) and Ordinary Time accent (`#16A34A`). Teal reads as community/connection in modern UI conventions. |
| `--color-cat-volunteering` | `#B85C38` | Terracotta. Warm but clearly distinct from Easter gold (`#D97706`) and warning (`#D97706`). Earthy, grounded — appropriate for service/volunteering. |

### Test checklist
- [ ] All new tokens defined in `:root`
- [ ] All new tokens overridden in `html[data-theme="dark"]`
- [ ] No token name conflicts with existing tokens
- [ ] Each new color visually distinct from every seasonal accent at arm's length

---

## CCS-02 — Sacred Content Channel Migration

**File:** `css/app.css`
**What:** Replace `var(--color-accent)` / `var(--color-accent-text)` / `var(--color-accent-pale)` with `var(--color-sacred)` equivalents on all sacred/content elements that should NOT shift with season.

### Rules to change (line numbers from current repo):

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 230 | `.formation-card` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 231 | `.formation-label` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 233 | `.formation-deeper-toggle` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 237 | `dark .formation-card` | `border-left-color` | `var(--color-accent)` | `var(--color-sacred)` |
| 1526 | `.reading-entry--gospel` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1527 | `.reading-entry--gospel .reading-heading` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 1528 | `.reading-entry--gospel .reading-ref` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 1545 | `.reading-entry:not(.expanded):hover .reading-ref` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 1593 | `.prayer-tool-card--promoted` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1593 | `.prayer-tool-card--promoted` | `background gradient` | `var(--color-accent-pale)` | `var(--color-sacred-pale)` |
| 1773 | `.reader-header::after` | `background` | `var(--color-accent)` | `var(--color-sacred)` |
| 1855 | `.ccc-blockquote` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1871 | `.ccc-baltimore-card` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1888 | `.ref-snippet-source--bible` | `background` | `var(--color-accent)` | `var(--color-sacred)` |
| 1898 | `.ref-snippet-verse-num` | `color` | `var(--color-accent)` | `var(--color-sacred)` |
| 1899 | `.ref-snippet-verse--target` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1906 | `.ref-snippet--bible .ref-snippet-header` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1912 | `dark .ref-snippet-verse--target` | `border-left-color` | `var(--color-accent)` | `var(--color-sacred)` |
| 1918 | `.saint-verse` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 1925 | `.reading-text .psalm-refrain` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 2083 | `dark .rosary-bead.filled` | `background` + `border-color` | `var(--color-accent)` | `var(--color-sacred)` |
| 2144 | `.stations-vr-label` | `color` | `var(--color-accent)` | `var(--color-sacred)` |
| 2458 | `.confession-tracker-icon` | `color` | `var(--color-accent)` | `var(--color-sacred)` |

### Hardcoded rgba replacements

All 16 instances of `rgba(184,150,63,...)` in the CSS must be converted to use `color-mix()` with `--color-sacred`:

| Before | After |
|--------|-------|
| `rgba(184,150,63,0.04)` | `color-mix(in srgb, var(--color-sacred) 4%, transparent)` |
| `rgba(184,150,63,0.08)` | `color-mix(in srgb, var(--color-sacred) 8%, transparent)` |
| `rgba(184,150,63,0.10)` | `color-mix(in srgb, var(--color-sacred) 10%, transparent)` |
| `rgba(184,150,63,0.15)` | `color-mix(in srgb, var(--color-sacred) 15%, transparent)` |
| `rgba(184,150,63,0.22)` | `color-mix(in srgb, var(--color-sacred) 22%, transparent)` |
| `rgba(184,150,63,0.25)` | `color-mix(in srgb, var(--color-sacred) 25%, transparent)` |

**Search pattern:** `rgba(184,150,63` — replace all 16 occurrences.

Also replace `rgba(212,168,75` (dark mode hardcoded gold, 1 occurrence at line 238):
| Before | After |
|--------|-------|
| `rgba(212,168,75,0.15)` | `color-mix(in srgb, var(--color-sacred) 15%, transparent)` |

### Dark mode hardcoded overrides to update

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 238 | `dark .formation-deeper` | `rgba(212,168,75,0.15)` | `color-mix(in srgb, var(--color-sacred) 15%, transparent)` |

### Test checklist
- [ ] CCC blockquote border stays warm gold during Lent (not purple)
- [ ] Gospel reading border stays warm gold during Ordinary Time (not green)
- [ ] Prayer tool promoted card stays warm gold during Easter (not bright amber)
- [ ] Scripture verse highlights stay warm gold in all seasons
- [ ] Rosary filled beads in dark mode stay warm gold
- [ ] All `rgba(184,150,63` occurrences eliminated from CSS
- [ ] Dark mode: all sacred elements readable and correctly tinted

---

## CCS-03 — Service Type Dot Color Separation

**File:** `css/app.css`
**What:** Give adoration and devotion schedule dots their own fixed colors instead of piggybacking on `--color-accent` and `--color-primary-muted`.

### Rules to change:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1299 | `.sched-type-dot--ador` | `background:var(--color-accent)` | `background:var(--color-svc-adoration)` |
| 1300 | `.sched-type-dot--devot` | `background:var(--color-primary-muted, #8B9DC3)` | `background:var(--color-svc-devotion)` |

### Also update the Saved tab "today" timeline if it uses accent for adoration:

Search the Saved tab rendering in `src/saved.js` for any adoration-specific accent usage. Currently the timeline uses service group colors from render.js — verify these also get the new tokens.

### Test checklist
- [ ] Schedule dots show 4 distinct colors: navy (Mass), green (Sacrament), copper (Adoration), mauve (Devotion)
- [ ] Dots remain distinguishable in dark mode
- [ ] During Lent: adoration dot is copper, NOT purple
- [ ] During Ordinary Time: adoration dot is copper, NOT green
- [ ] Touch targets unchanged (dots are decorative indicators, not interactive)

---

## CCS-04 — Event Category Color Separation

**File:** `css/app.css`
**What:** Replace hardcoded `#6B21A8` (devotional purple), `var(--color-verified)` (social/fellowship), and `#D97706` (volunteering) with new dedicated category tokens. Liturgical category stays on `var(--color-accent)` — that IS the season.

### Community Life accent bars (ce-item-accent):

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 772 | `.ce-item-accent.devotional` | `#6B21A8` | `var(--color-cat-devotional)` |
| 774 | `.ce-item-accent.social` | `var(--color-verified)` | `var(--color-cat-social)` |
| 775 | `.ce-item-accent.fellowship` | `var(--color-verified)` | `var(--color-cat-social)` |
| 777 | `.ce-item-accent.volunteering` | `var(--color-warning)` | `var(--color-cat-volunteering)` |

### Community Life category icons (ce-item-icon):

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 784 | `.ce-item-icon--devotional` | `background:rgba(107,33,168,0.08)` | `background:var(--color-cat-devotional-pale)` |
| 785 | `.ce-item-icon--devotional svg` | `color:#6B21A8` | `color:var(--color-cat-devotional)` |
| 788 | `.ce-item-icon--social` | `background:var(--color-verified-bg)` | `background:var(--color-cat-social-pale)` |
| 789 | `.ce-item-icon--social svg` | `color:var(--color-verified)` | `color:var(--color-cat-social)` |
| 790 | `.ce-item-icon--fellowship` | `background:var(--color-verified-bg)` | `background:var(--color-cat-social-pale)` |
| 791 | `.ce-item-icon--fellowship svg` | `color:var(--color-verified)` | `color:var(--color-cat-social)` |
| 792 | `.ce-item-icon--volunteering` | `background:var(--color-warning-bg)` | `background:var(--color-cat-volunteering-pale)` |

Also add:
```css
.ce-item-icon--volunteering svg { color: var(--color-cat-volunteering); }
```

### Saved tab event icons:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1329 | `.saved-evt-icon--devotional` | `background:rgba(107,33,168,0.06);color:#6B21A8` | `background:var(--color-cat-devotional-pale);color:var(--color-cat-devotional)` |
| 1331 | `.saved-evt-icon--social, .saved-evt-icon--fellowship` | `background:var(--color-verified-bg,...);color:var(--color-verified)` | `background:var(--color-cat-social-pale);color:var(--color-cat-social)` |
| 1333 | `.saved-evt-icon--volunteering` | `background:var(--color-warning-bg,...);color:#D97706` | `background:var(--color-cat-volunteering-pale);color:var(--color-cat-volunteering)` |

### Saved tab event category labels:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1342 | `.saved-evt-cat--devotional` | `color:#6B21A8` | `color:var(--color-cat-devotional)` |
| 1344 | `.saved-evt-cat--social, .saved-evt-cat--fellowship` | `color:var(--color-verified)` | `color:var(--color-cat-social)` |
| 1346 | `.saved-evt-cat--volunteering` | `color:#D97706` | `color:var(--color-cat-volunteering)` |

### Saved tab season-tagged event borders:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1351 | `.saved-evt-unified.saved-evt-season-lent` | `border-left:3px solid #6B21A8;...background:rgba(107,33,168,0.03)` | `border-left:3px solid var(--color-accent);...background:color-mix(in srgb, var(--color-accent) 3%, transparent)` |
| 1353 | `.saved-evt-unified.saved-evt-season-advent` | `border-left:3px solid #6B21A8;...background:rgba(107,33,168,0.03)` | `border-left:3px solid var(--color-accent);...background:color-mix(in srgb, var(--color-accent) 3%, transparent)` |
| 1354 | `.saved-evt-unified.saved-evt-season-christmas` | `border-left:3px solid var(--color-accent);...background:rgba(184,150,63,0.03)` | `border-left:3px solid var(--color-accent);...background:color-mix(in srgb, var(--color-accent) 3%, transparent)` |

**Note:** The season-tagged borders correctly use `--color-accent` (seasonal). The fix here is only replacing the hardcoded hex and rgba with token references so they shift correctly.

### Dark mode category overrides:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1356 | `dark .saved-evt-icon--devotional` | `background:rgba(168,85,247,0.12);color:#A855F7` | `background:var(--color-cat-devotional-pale);color:var(--color-cat-devotional)` |
| 1357 | `dark .saved-evt-cat--devotional` | `color:#A855F7` | `color:var(--color-cat-devotional)` |

### Saint card liturgical purple (NOT changing):

The `.saint-card[data-lit-color="purple"]` rules at lines 1696 and 1702 use `#6B21A8` / `#A855F7`. These represent **vestment color** — a distinct channel from seasonal accent and from event categories. **Leave these unchanged.** The liturgical color purple for vestments is intentionally the same shade it has always been; it will occasionally match Lent's seasonal accent, and that's correct — a purple vestment day during Lent *should* feel purple.

### Test checklist
- [ ] Devotional event accent bar is plum, not purple, during Lent
- [ ] Social/fellowship event accent bar is teal, not green, during Ordinary Time
- [ ] Volunteering event accent bar is terracotta, not amber, during Easter
- [ ] All 7 event categories visually distinct from each other at a glance
- [ ] Saved tab event icons match their category colors
- [ ] Season-tagged event borders still shift with season
- [ ] Dark mode: all category colors readable and distinct
- [ ] Saint card liturgical purple unchanged

---

## CCS-05 — YC (Your Churches) Brand Color to Sacred Channel

**File:** `css/app.css`
**What:** The "Your Churches" branded elements (YC chip, YC badge, YC card, YC cal button, inline YC card) use `--color-accent` as their brand color. This means YC cards turn purple during Lent, green during Ordinary Time, etc. The warm gold IS the YC brand identity — it should not shift seasonally. Migrate to `--color-sacred`.

### Rules to change:

| Line | Selector | Property | Before | After |
|------|----------|----------|--------|-------|
| 548 | `.yc-chip` | `border-color` + `color` | `var(--color-accent)` / `var(--color-accent-text)` | `var(--color-sacred)` / `var(--color-sacred-text)` |
| 549 | `.yc-chip.active` | `background` + `border-color` | `var(--color-accent)` | `var(--color-sacred)` |
| 550 | `.yc-card` | `border-left` | `var(--color-accent)` | `var(--color-sacred)` |
| 555 | `.yc-cal-btn:hover` | `background` | `rgba(184,150,63,0.1)` | `color-mix(in srgb, var(--color-sacred) 10%, transparent)` |
| 557 | `.yc-badge` | `color` + `background` | `var(--color-accent-text)` / `rgba(184,150,63,0.15)` | `var(--color-sacred-text)` / `color-mix(in srgb, var(--color-sacred) 15%, transparent)` |
| 1328 | `.saved-evt-icon--liturgical` | `background` + `color` | `var(--color-accent-pale)` / `var(--color-accent)` | Keep `var(--color-accent-pale)` / `var(--color-accent)` — liturgical events ARE seasonal |
| 1334 | `.saved-evt-icon--yc` | `background` + `color` | `var(--color-accent-pale)` / `var(--color-accent)` | `var(--color-sacred-pale)` / `var(--color-sacred)` |
| 1341 | `.saved-evt-cat--liturgical` | `color` | `var(--color-accent-text)` | Keep — liturgical events ARE seasonal |
| 1347 | `.saved-evt-cat--yc` | `color` | `var(--color-accent-text)` | `var(--color-sacred-text)` |
| 1359 | `.evt-yc-row` | `background` | `rgba(184,150,63,0.04)` | `color-mix(in srgb, var(--color-sacred) 4%, transparent)` |
| 1487 | `.inline-yc-card` | `background` + `border` | `rgba(184,150,63,0.10)` / `rgba(184,150,63,0.25)` | `color-mix(in srgb, var(--color-sacred) 10%, transparent)` / `color-mix(in srgb, var(--color-sacred) 25%, transparent)` |
| 728 | `.evt-yc-banner` | `background` + `border-left` | `rgba(184,150,63,0.08)` / `#B8963F` | `color-mix(in srgb, var(--color-sacred) 8%, transparent)` / `var(--color-sacred)` |

### Dark mode YC overrides:

The block at lines 132–145 that re-declares accent tokens for YC elements in dark mode should be updated to use sacred tokens instead. These selectors:

```css
html[data-theme="dark"] .yc-chip,
html[data-theme="dark"] .yc-card,
html[data-theme="dark"] .yc-badge,
/* ... etc ... */
```

Currently re-declare `--color-accent` / `--color-accent-text` / `--color-accent-light` / `--color-accent-pale` inside these selectors to lock them to gold. **After migration to `--color-sacred`, these overrides become unnecessary** because `--color-sacred` is already fixed (doesn't shift with season). Remove the entire override block (lines ~132–145) after migration.

Similarly, the dark mode YC card gradient at lines 146–147:
```css
html[data-theme="dark"] .yc-card,
html[data-theme="dark"] .saved-compact-yc {
  background: linear-gradient(135deg, #2A2618 0%, #302A1E 100%);
}
```
Keep this — it's a brand gradient that should stay.

### Event detail YC banner dark mode (line 173):
| Before | After |
|--------|-------|
| `rgba(184,150,63,0.12)` / `#D4A84B` | `color-mix(in srgb, var(--color-sacred) 12%, transparent)` / `var(--color-sacred)` |

### Test checklist
- [ ] YC chip stays warm gold during Lent (not purple)
- [ ] YC card border-left stays warm gold in all seasons
- [ ] YC badge text stays warm gold in all seasons
- [ ] YC elements in dark mode unchanged visually (already gold, just tokenized now)
- [ ] Dark mode override block safely removed without visual regression
- [ ] Inline YC cards on Find tab stay warm gold

---

## CCS-06 — Audit Remaining `var(--color-accent)` Usages

**File:** `css/app.css`
**What:** After CCS-02 through CCS-05, verify that every remaining `var(--color-accent)` usage is genuinely seasonal. These should be the ONLY elements still using the seasonal accent:

### Confirmed seasonal (keep on `--color-accent`):

| Element | Why seasonal |
|---------|-------------|
| `.top-header::after` accent line | Season-branded header treatment |
| `body` background gradient per season | Ambient seasonal wash |
| `.reader-overlay` seasonal background | Contemplative seasonal atmosphere |
| `.reader-body` seasonal background | Same |
| `.ccc-sheet` seasonal background | Same |
| `.parish-card--imminent` border | "Happening now" temporal emphasis |
| `.card-soon-badge` pulse dot | "Starting soon" temporal emphasis |
| `.card-live-badge` uses `--color-verified` (not accent) | Correct — live = verified green |
| `.card-imminent-badge` | Temporal emphasis |
| `.detail-coming-row--soon` border | Temporal emphasis |
| `.detail-next-badge.soon` color | Temporal emphasis |
| `.sched-soon` border | Temporal emphasis |
| `.saved-evt-today` border | "Today" emphasis — seasonal is correct |
| `.saved-evt-today-badge` color | Same |
| `.saved-header-season` color | Literal season label |
| `.tab-saved-badge` / `.tab-more-badge` | Notification dots — seasonal branding |
| `.pull-indicator.ready svg` / `.pull-indicator.refreshing svg` | Subtle brand signal |
| `.map-locate-loading svg` | Same |
| `.skip-link:focus` outline | Accessibility focus ring — seasonal brand |
| `.fasting-banner` border | Seasonal spiritual practice |
| `.ce-item-accent.liturgical` | Liturgical events ARE the season |
| `.ce-item-icon--liturgical` + svg | Same |
| `.saved-evt-icon--liturgical` | Same |
| `.saved-evt-cat--liturgical` | Same |
| Season-tagged event borders (lent/advent/christmas) | Season-aware by definition |

### Expected accent count after migration:
- Before: 53 `var(--color-accent)` usages (non-definition)
- After: ~25 `var(--color-accent)` usages — all genuinely seasonal

### Test checklist
- [ ] `grep -c 'var(--color-accent)' css/app.css` returns ~25 fewer than before
- [ ] Every remaining accent usage confirmed as seasonal/temporal
- [ ] No non-seasonal element still using accent

---

## CCS-07 — Dark Mode Hardcoded Badge Color Audit

**File:** `css/app.css`
**What:** Several dark mode badge colors are hardcoded and will now conflict with the new category tokens. Update them.

### Schedule season badge (lines 933–935):

These are CORRECT as-is — they use season-specific hardcoded colors for badge rendering in the schedule (lent purple, summer gold, academic blue). They should NOT use `--color-accent` because they represent a schedule's season tag, not the app's current season. Leave unchanged.

### Dark mode event category icon override:

The devotional dark override at line 1356 was already addressed in CCS-04. Verify no other dark hardcodes conflict.

### Dark mode `.ce-item-accent.devotional` — currently no dark override exists:

Add a new rule:
```css
html[data-theme="dark"] .ce-item-accent.devotional { background: var(--color-cat-devotional); }
```

And for social/fellowship and volunteering:
```css
html[data-theme="dark"] .ce-item-accent.social,
html[data-theme="dark"] .ce-item-accent.fellowship { background: var(--color-cat-social); }
html[data-theme="dark"] .ce-item-accent.volunteering { background: var(--color-cat-volunteering); }
```

Since these now use CSS variables that already have dark overrides, these explicit dark rules may not be needed — test with and without.

### Test checklist
- [ ] Schedule season badges unchanged
- [ ] Event accent bars readable in dark mode
- [ ] No hardcoded hex remaining for event category colors outside token definitions

---

## CCS-08 — Saint Card Sacred Channel Migration

**File:** `css/app.css`
**What:** The saint card's default border and gradient use `var(--color-accent)` + hardcoded `rgba(184,150,63,0.08)`. The default saint card (before liturgical color override) should use sacred gold, not seasonal accent.

### Rules to change:

| Line | Selector | Before | After |
|------|----------|--------|-------|
| 1695 | `.saint-card` | `border-left:4px solid var(--color-accent)` | `border-left:4px solid var(--color-sacred)` |
| 1695 | `.saint-card` | `background:linear-gradient(135deg, var(--color-surface) 60%, rgba(184,150,63,0.08) 100%)` | `background:linear-gradient(135deg, var(--color-surface) 60%, color-mix(in srgb, var(--color-sacred) 8%, transparent) 100%)` |
| 1695 | `.saint-card` | `transition:border-color 0.3s ease, background 0.3s ease` | Keep transition — when data-lit-color is applied by JS, the border will animate to the vestment color |

**Note:** The `data-lit-color` overrides (purple, red, white, green, rose) at lines 1696–1706 override the border-left-color with their specific vestment hex. These are correct and unchanged. The saint card now has a **three-layer** color system:
1. Default: sacred gold border + gold tint gradient
2. If liturgical color is set: vestment color overrides border + tint
3. Seasonal accent is NOT involved — correct, because a saint's feast color is intrinsic, not seasonal

### Test checklist
- [ ] Saint card default (no liturgical color) shows warm gold border in all seasons
- [ ] Saint card with `data-lit-color="purple"` shows purple border (unchanged)
- [ ] Saint card with `data-lit-color="green"` shows green border (unchanged)
- [ ] Transition animates smoothly when JS sets liturgical color
- [ ] Dark mode saint card: all variants readable

---

## CCS-09 — Confession Card Verified Color Audit

**File:** `css/app.css`
**What:** The confession card on the Saved tab uses `--color-verified` for its accent. Verify this does NOT collide with the new `--color-cat-social` (teal). It shouldn't — verified is `#4A7C59` (forest green) while cat-social is `#0D7377` (deep teal). These are distinct. But verify visually.

### No code changes needed — just visual verification.

### Test checklist
- [ ] Saved tab: confession card green border visually distinct from social event teal
- [ ] Dark mode: both greens distinguishable

---

## Implementation Order

Execute in this order to minimize cascading breakage:

1. **CCS-01** — Add all new tokens (no visual changes yet)
2. **CCS-02** — Sacred content migration (biggest batch, ~22 rules + 16 rgba replacements)
3. **CCS-03** — Service type dots (2 rules, quick win)
4. **CCS-04** — Event category separation (12–15 rules)
5. **CCS-05** — YC brand channel (10–12 rules + dark override cleanup)
6. **CCS-08** — Saint card migration (2 rules)
7. **CCS-06** — Audit pass (verify count, no code changes expected)
8. **CCS-07** — Dark mode badge audit (verification + possible additions)
9. **CCS-09** — Confession card visual verification (no code changes expected)

---

## Cross-Module Cascading Impacts

### `src/events.js`
The JS generates class names like `ce-item-accent devotional`, `ce-item-icon--devotional`, etc. These classes are already correct — the CSS selectors target them. **No JS changes needed** unless new category classes are introduced.

### `src/saved.js`
Generates `.saved-evt-icon--devotional`, `.saved-evt-cat--devotional`, etc. Same situation — class names unchanged, CSS handles the new colors. **No JS changes needed.**

### `src/render.js`
Generates `.sched-type-dot--ador`, `.sched-type-dot--devot`. Class names unchanged. **No JS changes needed.**

### `src/readings.js`
Generates `.reading-entry--gospel`. Class name unchanged. **No JS changes needed.**

### `src/rosary.js`, `src/examination.js`, `src/stations.js`
Use `.rosary-bead.filled`, `.confession-tracker-icon`, `.stations-vr-label` — all CSS-only changes. **No JS changes needed.**

### Dark mode override block cleanup
After CCS-05, the YC dark override block (lines ~132–145) that locks accent to gold for YC elements becomes dead code. Remove it. But **test thoroughly first** — ensure no other non-YC element was accidentally relying on this block.

---

## Color Palette Summary (Post-Migration)

### Five channels, zero collision:

| Channel | Purpose | Light | Dark | Shifts? |
|---------|---------|-------|------|---------|
| **Seasonal** | Header, body wash, today/soon, fasting | Lent: `#7C3AED` · Easter: `#D97706` · Ordinary: `#16A34A` | Lent: `#7C3AED` · Easter: `#D97706` · Ordinary: `#16A34A` | Yes — with liturgical calendar |
| **Sacred** | CCC, Scripture, Gospel, prayers, rosary, YC brand | `#B8963F` | `#D4A84B` | No — always warm gold |
| **Service type** | Mass: navy · Sacr: green · Ador: copper · Devot: mauve | `#2C3E5A` · `#4A7C59` · `#B87514` · `#8B5A6D` | `#8FA8C8` · `#6AAF84` · `#E5A33D` · `#C48A9E` | No — fixed recognition |
| **Event category** | Liturgical: seasonal · Devotional: plum · Social: teal · Vol: terracotta | `var(--color-accent)` · `#8B3A62` · `#0D7377` · `#B85C38` | — · `#C46B96` · `#38B2AC` · `#E07C56` | Liturgical only |
| **Vestment** | Saint card border per liturgical color | purple/red/white/green/rose | Same, lighter | No — intrinsic |

### Season collision test matrix:

| Element | Lent (purple) | Easter (gold) | Ordinary (green) |
|---------|--------------|---------------|-----------------|
| Sacred content | Gold ✓ | Gold ✓ | Gold ✓ |
| Adoration dot | Copper ✓ | Copper ✓ | Copper ✓ |
| Devotion dot | Mauve ✓ | Mauve ✓ | Mauve ✓ |
| Devotional event | Plum ✓ | Plum ✓ | Plum ✓ |
| Social event | Teal ✓ | Teal ✓ | Teal ✓ |
| Volunteering event | Terracotta ✓ | Terracotta ✓ | Terracotta ✓ |
| Verified badge | Forest green ✓ | Forest green ✓ | Forest green ✗ (close) |
| YC brand | Gold ✓ | Gold ✓ | Gold ✓ |

**One remaining adjacency:** Verified green (`#4A7C59`) and Ordinary Time accent (`#16A34A`) are both green-family. However, verified is always forest/muted while ordinary accent is vivid emerald — they're distinguishable. And verified appears as small badges while accent appears as borders/washes, so the context differs. This is acceptable.
