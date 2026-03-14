# Claude Code Prompt — CCS (Color Channel Separation)

**Spec:** `docs/plans/UX_Spec_Color_Channel_Separation.md`
**Scope:** CSS-only changes to `css/app.css`. No JS changes needed.

---

## Context

MassFinder's `--color-accent` token serves 53+ CSS rules but only ~25 are genuinely seasonal. The rest (sacred content, YC brand, service type dots, event categories) should not shift with liturgical season. During Lent, everything turns purple. During Easter, everything turns gold. This spec separates the color system into five non-overlapping channels.

## Execute in order

### Step 1: Add new tokens to `:root` (after line ~50, after `--color-accent-pale`)

Add to light mode `:root`:
```css
--color-sacred: #B8963F;
--color-sacred-text: #7D6520;
--color-sacred-pale: #F5EDD8;
--color-svc-adoration: #B87514;
--color-svc-adoration-pale: #FDF3E3;
--color-svc-devotion: #8B5A6D;
--color-svc-devotion-pale: #F5ECF0;
--color-cat-devotional: #8B3A62;
--color-cat-devotional-pale: #F7ECF2;
--color-cat-social: #0D7377;
--color-cat-social-pale: #E6F5F5;
--color-cat-volunteering: #B85C38;
--color-cat-volunteering-pale: #FBF0EB;
```

Add to `html[data-theme="dark"]`:
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

### Step 2: Sacred content migration

Replace `var(--color-accent)` → `var(--color-sacred)` on these selectors:
- `.formation-card` border-left
- `.formation-label` color
- `.formation-deeper-toggle` color
- `dark .formation-card` border-left-color
- `.reading-entry--gospel` border-left
- `.reading-entry--gospel .reading-heading` color
- `.reading-entry--gospel .reading-ref` color
- `.reading-entry:not(.expanded):hover .reading-ref` color
- `.prayer-tool-card--promoted` border-left AND background gradient `var(--color-accent-pale)` → `var(--color-sacred-pale)`
- `.reader-header::after` background
- `.ccc-blockquote` border-left
- `.ccc-baltimore-card` border-left
- `.ref-snippet-source--bible` background
- `.ref-snippet-verse-num` color
- `.ref-snippet-verse--target` border-left
- `.ref-snippet--bible .ref-snippet-header` border-left
- `dark .ref-snippet-verse--target` border-left-color
- `.saint-verse` border-left
- `.reading-text .psalm-refrain` border-left
- `dark .rosary-bead.filled` background + border-color
- `.stations-vr-label` color
- `.confession-tracker-icon` color

Replace ALL `rgba(184,150,63,...)` with `color-mix(in srgb, var(--color-sacred) N%, transparent)` where N matches the original alpha × 100. There are 16 occurrences. Also replace `rgba(212,168,75,0.15)` the same way.

### Step 3: Service type dots

```
.sched-type-dot--ador { background:var(--color-svc-adoration); }
.sched-type-dot--devot { background:var(--color-svc-devotion); }
```

### Step 4: Event category separation

Replace `#6B21A8` with `var(--color-cat-devotional)` on:
- `.ce-item-accent.devotional`
- `.ce-item-icon--devotional svg`
- `.saved-evt-icon--devotional` color
- `.saved-evt-cat--devotional`

Replace `rgba(107,33,168,0.08)` with `var(--color-cat-devotional-pale)` on:
- `.ce-item-icon--devotional` background
- `.saved-evt-icon--devotional` background

Replace `rgba(107,33,168,0.06)` with `var(--color-cat-devotional-pale)` on saved-evt-icon--devotional.

Replace `var(--color-verified)` with `var(--color-cat-social)` on:
- `.ce-item-accent.social`
- `.ce-item-accent.fellowship`
- `.ce-item-icon--social svg`
- `.ce-item-icon--fellowship svg`
- `.saved-evt-icon--social, .saved-evt-icon--fellowship` color
- `.saved-evt-cat--social, .saved-evt-cat--fellowship`

Replace `var(--color-verified-bg)` with `var(--color-cat-social-pale)` on:
- `.ce-item-icon--social` background
- `.ce-item-icon--fellowship` background
- `.saved-evt-icon--social, .saved-evt-icon--fellowship` background

Replace `var(--color-warning)` / `#D97706` with `var(--color-cat-volunteering)` on:
- `.ce-item-accent.volunteering`
- `.saved-evt-icon--volunteering` color
- `.saved-evt-cat--volunteering`

Replace `var(--color-warning-bg)` with `var(--color-cat-volunteering-pale)` on:
- `.ce-item-icon--volunteering` background
- `.saved-evt-icon--volunteering` background

Replace hardcoded `rgba(107,33,168,0.03)` on `.saved-evt-season-lent` and `.saved-evt-season-advent` with `color-mix(in srgb, var(--color-accent) 3%, transparent)`.

Dark mode: replace `#A855F7` with `var(--color-cat-devotional)` on dark devotional overrides.

### Step 5: YC brand to sacred

Replace `var(--color-accent)` → `var(--color-sacred)` and `var(--color-accent-text)` → `var(--color-sacred-text)` and `var(--color-accent-pale)` → `var(--color-sacred-pale)` on:
- `.yc-chip` border-color + color
- `.yc-chip.active` background + border-color
- `.yc-card` border-left
- `.yc-badge` color
- `.saved-evt-icon--yc` background + color
- `.saved-evt-cat--yc` color
- `.evt-yc-banner` border-left

Then remove the dark mode override block (lines ~132-145) that re-declares accent tokens for YC elements — no longer needed since sacred tokens don't shift.

### Step 6: Saint card default

Replace `var(--color-accent)` → `var(--color-sacred)` on `.saint-card` border-left. Replace `rgba(184,150,63,0.08)` in its gradient with `color-mix(in srgb, var(--color-sacred) 8%, transparent)`.

Do NOT touch `.saint-card[data-lit-color=...]` rules — those are vestment colors.

### Step 7: Verify

Run: `grep -c 'var(--color-accent)' css/app.css` — should be ~25 (down from ~53, not counting definitions and season overrides).
Run: `grep -c 'rgba(184,150,63' css/app.css` — should be 0.
Run: `grep -c '#6B21A8' css/app.css` — should be 2 (only saint-card liturgical purple light+dark).
Run: `grep -c '#A855F7' css/app.css` — should be 1 (only saint-card dark liturgical purple).

Test in browser:
1. Set `data-season="lent"` — verify sacred content stays gold, not purple
2. Set `data-season="ordinary"` — verify social events are teal, not green
3. Set `data-season="easter"` — verify volunteering is terracotta, not gold
4. Toggle dark mode in each season
5. Check YC cards stay warm gold in all seasons

## Do NOT change

- Any file in `src/` — this is CSS-only
- Season override rules at lines 1709–1734 (seasonal accent definitions)
- Saint card `data-lit-color` rules
- Schedule season badge hardcoded colors (lent purple, summer gold, academic blue)
- Any `var(--color-verified)` usage that refers to actual verification status (badges, live indicators)
- Any `var(--color-primary)` usage
