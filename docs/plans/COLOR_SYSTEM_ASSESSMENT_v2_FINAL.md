# MassFinder — Color System Assessment v2 (FINAL)

**Date:** 2026-03-14
**Branch:** `ui-patches`
**Purpose:** Definitive color strategy — the basis for the one-and-done CSS spec
**Pass:** 2 of 2 (incorporates all owner decisions from v1 review)

---

## Owner decisions incorporated

1. **Daily liturgical card:** Subtle coloring by default, seasonal tinting during appropriate liturgical seasons
2. **Fasting/HDO banners:** Fixed warm tone — these must always stand out as "pay attention" notices
3. **Dark mode body gradients:** Keep seasonal gradients in dark mode, tinted to whatever season is active
4. **Schedule "today" row:** Warm amber — agree with temporal urgency treatment
5. **Prayer tool overlays:** Dial back — currently too much color, make more subtle
6. **Seasonal devotion cards:** Four seasonal guides exist (Lent, Easter, Advent, Christmas) — all get pinned and seasonal-tinted during their season. For prayer tools, Stations is the Lent one. Future prayer tools (e.g., Divine Mercy Chaplet for Easter, O Antiphons for Advent) would follow the same pattern — attributed to the appropriate season, pinned to top, seasonal tinting applied.

---

## The final color architecture

### Eight layers, zero collision, one-and-done

---

### Layer 1 — Structural palette (never changes)

These are the bones of the app. White surfaces, warm neutral background, readable text.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-primary` | `#2C3E5A` | `#8FA8C8` | Navigation, interactive elements, headers |
| `--color-bg` | `#F8F7F4` | `#1A1C22` | Page background |
| `--color-surface` | `#FFFFFF` | `#22252E` | Card backgrounds |
| `--color-surface-hover` | `#F5F3EF` | `#2A2E38` | Hover states, subtle highlight |
| `--color-text-primary` | `#1A1E26` | `#EEF0F4` | Body text |
| `--color-text-secondary` | `#5C6370` | `#A8AEBC` | Secondary labels, metadata |
| `--color-text-tertiary` | `#8B919C` | `#6E7585` | Hints, timestamps |
| `--color-border` | `#E5E2DC` | `#2E3240` | Dividers, card borders |

No changes from current. These are correct.

---

### Layer 2 — Semantic status (never changes)

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-verified` | `#4A7C59` | `#6AAF84` | Verified badge, live Mass indicator |
| `--color-info` | `#3478C6` | `#60A5FA` | Informational badges, accessible |
| `--color-fav` | `#E11D48` | `#FB7185` | Saved/favorite heart |
| `--color-error` | `#B91C1C` | `#F87171` | Error states |

No changes from current. These are correct.

---

### Layer 3 — Sacred content (fixed warm gold — never changes)

The app's identity color. Scripture, Catechism, prayer, Gospel, rosary beads, YC brand. Evokes candlelight, chalice gold, the warmth of sacred tradition.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-sacred` | `#B8963F` | `#D4A84B` | Borders, icons, filled beads |
| `--color-sacred-text` | `#7D6520` | `#D4A84B` | Labels on sacred content |
| `--color-sacred-pale` | `#F5EDD8` | `#2E2618` | Sacred content backgrounds |

Already migrated in CCS. No further changes.

---

### Layer 4 — Temporal urgency (NEW — fixed warm amber, never changes)

"This needs your attention right now." Mass starting soon, service imminent, today's schedule. The same warm amber year-round — urgency doesn't observe the liturgical calendar.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-soon` | `#C8850D` | `#E5A33D` | Soon/imminent borders, pulse dots |
| `--color-soon-text` | `#8B5E06` | `#E5A33D` | Soon badge text |
| `--color-soon-pale` | `#FEF6E7` | `#2A1F0A` | Soon badge backgrounds, today highlight |

**Why this amber:** Warm and attention-getting without being alarming. Darker and more orange than Easter gold (`#D97706`), distinct from sacred gold (`#B8963F`), distinct from any seasonal accent. Reads universally as "pay attention."

#### Elements migrating to temporal urgency:

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.card-soon-badge` | color | `accent-text` | `--color-soon-text` |
| `.card-soon-badge` | background | `accent-pale` | `--color-soon-pale` |
| `.card-soon-badge .pulse-dot` | background | `accent` | `--color-soon` |
| `.card-imminent-badge` | color | `accent-text` | `--color-soon-text` |
| `.card-imminent-badge` | background | `accent-pale` | `--color-soon-pale` |
| `.parish-card--soon` | border-left color | `accent` | `--color-soon` |
| `.parish-card--soon` | background gradient | `accent-pale` | `--color-soon-pale` |
| `dark .parish-card--soon` | background gradient | `accent 6%` | `--color-soon 6%` |
| `.parish-card--imminent` | border-left color | `accent` | `--color-soon` |
| `.detail-next--soon` | background | `accent-pale` | `--color-soon-pale` |
| `.detail-next--soon` | border color-mix | `accent 12%` | `--color-soon 12%` |
| `.detail-next-badge.soon` | color | `accent-text` | `--color-soon-text` |
| `.detail-coming-row--soon` | border-left color | `accent` | `--color-soon` |
| `.detail-coming-up` | background gradient | `accent-pale` | `--color-soon-pale` |
| `.detail-coming-up` | border-left color | `accent` | `--color-soon` |
| `dark .detail-coming-up` | background gradient | `accent 6%` | `--color-soon 6%` |
| `.sched-soon` | border-left color | `accent` | `--color-soon` |
| `.sched-soon-badge` | color | `accent-text` | `--color-soon-text` |
| `.sched-soon-badge` | background | `accent-pale` | `--color-soon-pale` |
| `.litu-soon` | color | `accent-text` | `--color-soon-text` |
| `.litu-soon` | background | `accent-pale` | `--color-soon-pale` |
| `.schedule-day--today` | background | `accent-pale` | `--color-soon-pale` |
| `dark .schedule-day--today` | background | `accent 6%` | `--color-soon 6%` |
| `.saved-evt-today` | border-left color | `accent` | `--color-soon` |
| `.saved-evt-today` | background | `accent 4%` | `--color-soon 4%` |
| `dark .saved-evt-today` | background | `accent 6%` | `--color-soon 6%` |
| `.saved-evt-today-badge` | color | `accent` | `--color-soon-text` |

---

### Layer 5 — Notice banners (NEW — fixed warm tone, never changes)

Fasting reminders, Holy Day of Obligation banners. These are "pay attention to this spiritual practice" — not temporal urgency (you have all day) but not purely informational either. They need to stand out consistently regardless of season.

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-notice` | `#A16B2A` | `#D4A84B` | Banner borders, label text |
| `--color-notice-pale` | `#FDF5E6` | `#2A2010` | Banner backgrounds |

**Why a separate token (not reusing sacred or soon):** Fasting banners sit visually between sacred gold and temporal amber. Sacred gold is for Scripture/Catechism content; soon-amber is for "act now." Banners are "be aware today." Using a midpoint warm tone keeps the channels clean.

#### Elements migrating to notice:

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.fasting-banner` | background | `accent-pale` | `--color-notice-pale` |
| `.fasting-banner` | border color-mix | `accent 25%` | `color-mix(--color-notice 25%)` |
| `.fasting-banner--full` | border color-mix | `accent 35%` | `color-mix(--color-notice 35%)` |
| `dark .fasting-banner` | background | `accent-pale` | `--color-notice-pale` |
| `dark .fasting-banner` | border color-mix | `accent 20%` | `color-mix(--color-notice 20%)` |
| `dark .fasting-banner--full` | border color-mix | `accent 30%` | `color-mix(--color-notice 30%)` |
| `.hdo-banner` | background | `accent-pale` | `--color-notice-pale` |
| `.hdo-banner` | border | `accent-light` | `--color-notice` |
| `.hdo-banner-label` | color | `accent-text` | `--color-notice` |
| `.hdo-banner-cta` | color | `accent-text` | `--color-notice` |

---

### Layer 6 — Service types (fixed)

Already migrated in CCS. No further changes.

| Token | Light | Role |
|-------|-------|------|
| `--color-svc-adoration` | `#B87514` | Adoration dots, perpetual card |
| `--color-svc-devotion` | `#8B5A6D` | Devotion dots |
| Mass | `--color-primary` | Navy dots |
| Sacraments | `--color-verified` | Green dots |

---

### Layer 7 — Event categories (fixed, liturgical inherits season)

Already migrated in CCS. No further changes.

| Token | Light | Role |
|-------|-------|------|
| `--color-cat-devotional` | `#8B3A62` | Plum — devotional events |
| `--color-cat-social` | `#0D7377` | Teal — social/fellowship |
| `--color-cat-volunteering` | `#B85C38` | Terracotta — service events |
| Liturgical | `var(--color-accent)` | Inherits season (correct) |

---

### Layer 8 — Seasonal accent (shifts with liturgical calendar — DRAMATICALLY REDUCED scope)

The seasonal accent becomes a whisper, not a shout. It touches the header line, the season label, liturgical event markers, seasonal guide cards, and the faintest body tint. Everything else is handled by the seven layers above.

#### 8A. Accent-pale values become ultra-subtle

The biggest single change. Current accent-pale values are clearly tinted. New values are barely perceptible — you feel the season without seeing it painted on every surface.

**Season override changes (`:root[data-season="..."]` rules):**

| Season | Current `accent-pale` | New `accent-pale` | Perceptibility |
|--------|----------------------|-------------------|----------------|
| Lent/Advent | `#F3E8FF` (clearly purple) | `#F7F5FA` (whisper) | ~2% tint |
| Easter/Christmas | `#FEF3C7` (clearly gold) | `#FBF9F3` (whisper) | ~2% tint |
| Ordinary | `#DCFCE7` (clearly green) | `#F5F8F5` (whisper) | ~2% tint |

#### 8B. Body gradients become ultra-subtle

| Season | Current gradient end | New gradient end |
|--------|---------------------|-----------------|
| Lent/Advent light | `#F0ECF5` | `#F5F3F7` |
| Lent/Advent dark | `#1E1A28` | `#1C1A22` |
| Easter/Christmas light | `#F9F6ED` | `#F8F7F2` |
| Easter/Christmas dark | `#1E1C18` | `#1C1B1A` |
| Ordinary light | (no current rule) | `#F6F8F5` |
| Ordinary dark | (no current rule) | keep default `#1A1C22` |

#### 8C. Prayer tool / reader overlays — dialed back

The seasonal backgrounds for reader-overlay, reader-body, and ccc-sheet currently have noticeable tints. These get made subtler — still present for atmosphere, but half the current intensity.

| Season | Current reader gradient end | New reader gradient end |
|--------|---------------------------|------------------------|
| Lent/Advent | `#EDE8F2` | `#F2EFF5` |
| Easter/Christmas | `#F2EDDF` | `#F4F1EA` |
| Ordinary | `#ECF0EA` | `#F0F2EE` |

Same proportional reduction for ccc-sheet and reader-body.

#### 8D. Daily liturgical card treatment

The daily card (liturgical day teaser at top of Find tab) gets:
- **Default state:** neutral surface gradient (no seasonal tint on the fill itself)
- **Seasonal state:** a subtle 3px left border in the seasonal accent color
- Text stays neutral (`--color-text-secondary` for secondary, not `accent-text`)

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.daily-card` | background | `linear-gradient(accent-pale → surface)` | `linear-gradient(var(--color-surface-hover) 0%, var(--color-surface) 100%)` |
| `.daily-card` | border-left | (none) | `3px solid var(--color-accent)` |
| `.daily-card` | border-radius | current | `0` (single-sided border, no rounding) |
| `.daily-card-secondary` | color | `accent-text` | `--color-text-secondary` |
| `dark .daily-card` | background | `sacred 8% gradient` | keep as-is (already using sacred) |
| `dark .daily-card-secondary` | color | `accent-light` | `--color-text-secondary` |

#### 8E. Return card neutralized

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.return-card` | background | `accent-pale` | `var(--color-surface-hover)` |
| `.return-text` | color | `accent-text` | `--color-text-secondary` |
| `.return-dismiss` | color | `accent-text` | `--color-text-tertiary` |

#### 8F. Card event row neutralized

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.card-evt-row` | color | `accent-text` | `--color-text-secondary` |

#### 8G. Event countdown neutralized

| Selector | Property | Before | After |
|----------|----------|--------|-------|
| `.ce-item-when .ce-countdown` | color | `accent-text` | `--color-text-secondary` |

#### 8H. Seasonal devotion cards (STAY on accent — correct)

Four seasonal guides (Lent, Easter, Advent, Christmas) get pinned and tinted during their season. `.devot-card--seasonal` stays on `var(--color-accent)` for border and gradient. This is correct and intentional — these guides ARE the season.

Future prayer tools (Divine Mercy Chaplet for Easter, O Antiphons for Advent) would follow the same `season:` attribute pattern in `src/more.js` and automatically receive the `devot-card--seasonal` class during their season. No CSS changes needed — the system already supports this.

---

### What remains on seasonal accent after all migrations

The complete and final list of elements that shift with the liturgical calendar:

| Element | Why seasonal |
|---------|-------------|
| `.top-header::after` | The primary seasonal brand signal |
| `body` gradient | Ultra-subtle atmospheric wash |
| `.saved-header-season` text | Literal season name label |
| `.daily-card` left border | Subtle seasonal thread on liturgical card |
| `.ce-item-accent.liturgical` | Liturgical events ARE the season |
| `.ce-item-icon--liturgical` bg + svg | Same |
| `.saved-evt-icon--liturgical` bg + color | Same |
| `.saved-evt-cat--liturgical` text | Same |
| `.saved-evt-season-*` borders | Season-tagged event markers |
| `.devot-card--seasonal` border + gradient + icon | Seasonal guide card |
| `.reader-overlay` seasonal bg | Contemplative atmosphere (subtler) |
| `.reader-body` seasonal bg | Same |
| `.ccc-sheet` seasonal bg | Same |
| `.tab-saved-badge` / `.tab-more-badge` | Notification dots |
| `.pull-indicator` / `.map-locate-loading` | Minor loading indicators |
| `.skip-link:focus` | Accessibility focus ring |

**Total: ~16 element groups. Down from 60.**

---

## Demographic validation

### The 72-year-old parishioner
Opens app on Friday morning during Lent. Sees a clean white interface with a thin purple line at the top and a faint purple warmth in the background — barely noticeable but it feels different from summer. The daily card says "Friday of the 3rd Week of Lent" with a subtle purple left border. Below, parish cards show warm amber "Starting soon" badges — she knows to tap those. When she opens the church detail, the "Coming Up" section has the same warm amber. The Rosary has warm gold beads. Every color means one thing.

### The 25-year-old phone-native
Opens app on his phone. Sees a restrained, premium-feeling interface. No color overload. The seasonal purple is barely there — just a hint in the header and the background, like walking into a church. When he opens Faith Guides, Stations of the Cross has a purple accent — he knows that's the Lent thing. Everything else is clean neutral surfaces. He screenshots it and sends it to a friend: "this app is actually nice."

### The 45-year-old parent
Running late for Mass on Sunday, opens app with one hand. Scans the Find tab — warm amber badges on two cards jump out immediately: "Starting in 12 min" and "Live now." She doesn't need to read anything else. Taps the amber one, gets directions. The color did its job in two seconds.

---

## Implementation scope

| Category | Changes | Effort |
|----------|---------|--------|
| New tokens (soon + notice, light + dark) | 6 new tokens | 10 min |
| Temporal urgency migration | ~27 rules | 45 min |
| Notice banner migration | ~10 rules | 20 min |
| Daily card / return card / evt-row / countdown neutralization | ~8 rules | 15 min |
| Accent-pale subtlety (season overrides) | 3 rules | 5 min |
| Body gradient subtlety | 4-6 rules | 10 min |
| Reader/CCC/prayer overlay subtlety | ~9 rules | 15 min |
| **Total** | **~65-70 rules** | **~2 hours** |

All CSS-only. No JS changes. No new classes (temporal elements keep their existing selectors, just change token references). No structural changes.

---

## Verification plan

After implementation, test with dev panel season toggle:

**Lent (purple):**
- Header line: purple ✓
- Body background: barely-perceptible purple warmth ✓
- Daily card: neutral bg, purple left border ✓
- Soon badges: warm amber (NOT purple) ✓
- Fasting banner: warm tone (NOT purple) ✓
- Stations of the Cross card: purple accent ✓
- CCC blockquote: warm gold (NOT purple) ✓
- Scripture highlight: warm gold (NOT purple) ✓
- Rosary bead: warm gold ✓
- Adoration dot: copper ✓
- Devotional event: plum ✓
- Social event: teal ✓

**Ordinary Time (green):**
- All above non-seasonal elements: UNCHANGED from Lent ✓
- Header line: green ✓
- Body: barely-perceptible green warmth ✓
- Daily card: green left border ✓
- Liturgical events: green ✓

**Easter (gold):**
- Same pattern — only the ~16 seasonal elements shift ✓
- Soon badges stay amber (distinct from Easter gold) ✓
- Sacred gold stays sacred gold (distinct from Easter gold) ✓

**Dark mode in each season:**
- Seasonal gradients present but subtle ✓
- All text readable ✓
- All tokens have dark overrides ✓

---

## Summary

The color system becomes eight distinct layers with no collision:

1. **Structural** — the neutral canvas
2. **Semantic status** — verified, info, error, favorite
3. **Sacred** — warm gold for Scripture, prayer, CCC, YC
4. **Temporal urgency** — warm amber for "happening now/soon"
5. **Notice** — warm tone for fasting/HDO banners
6. **Service types** — fixed dots and cards for Mass/Confession/Adoration/Devotion
7. **Event categories** — plum/teal/terracotta for community life
8. **Seasonal accent** — a whispered atmospheric tint on ~16 elements

The liturgical calendar gives the app its rhythm — you feel Lent, you sense Easter, you know it's Ordinary Time. But the feeling comes from atmosphere, not from painting every surface the same color. Color earns its place by meaning something specific, not by being everywhere.

One and done.
