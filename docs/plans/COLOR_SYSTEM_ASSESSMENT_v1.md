# MassFinder — First-Principles Color System Assessment

**Date:** 2026-03-14
**Branch audited:** `ui-patches` (commit `0cf8d8e`)
**Purpose:** Ground-up evaluation for a one-and-done CSS color overhaul
**Pass:** 1 of 2 (this report feeds back for refinement before spec generation)

---

## 1. Executive diagnosis

The app is drowning in its own accent color. During Lent, I count **29+ visually distinct elements** across all four tabs that render purple. These include the body background gradient, the liturgical day card, every "starting soon" badge, every "imminent" border, today highlights in schedules, event countdown text, the HDO banner, the fasting banner, devotion card borders, and tab notification dots. The user is surrounded by purple everywhere they look.

The CCS (Color Channel Separation) migration successfully moved sacred content, YC brand, event categories, and service type dots onto fixed tokens — that work is solid and should be kept. But the remaining **60 accent-family touchpoints** (27 accent + 14 accent-text + 17 accent-pale + 2 accent-light) are still all resolving to the same seasonal color. The problem was never that non-seasonal things were on the seasonal accent. The problem is that the seasonal accent itself is being used for too many different semantic purposes, and the result is a monochromatic flood.

Apple's design philosophy — which this app targets — uses tint colors with surgical precision. iOS puts its accent on interactive elements (buttons, links, toggles, selection indicators) and almost nowhere else. Backgrounds stay neutral. Badges use semantic colors (red for urgency, blue for informational). The system never floods the viewport with its accent color. MassFinder needs this same restraint.

---

## 2. The three things the accent does that it shouldn't

### 2A. Temporal urgency = seasonal accent (WRONG)

"Starting soon," "imminent," "happening now," and "today" are temporal signals. They communicate urgency — the user needs to act. During Lent these all turn purple. During Ordinary Time they turn green. But urgency doesn't change with the liturgical calendar. "Mass starts in 10 minutes" is equally urgent in February and July.

**Apple parallel:** iOS uses a fixed red for time-critical notifications and a fixed orange for warnings. These never change based on theme or accent color.

**Elements affected (15 touchpoints):**
- `.card-soon-badge` (text + bg + pulse dot)
- `.card-imminent-badge` (text + bg)
- `.parish-card--soon` (border + gradient)
- `.parish-card--imminent` (border)
- `.detail-next--soon` (bg)
- `.detail-next-badge.soon` (text)
- `.detail-coming-row--soon` (border)
- `.detail-coming-up` (bg gradient)
- `.sched-soon` (border)
- `.sched-soon-badge` (text + bg)
- `.litu-soon` (text + bg)

**Recommendation:** Create a fixed temporal-urgency color that never shifts. Something warm and attention-getting but not alarm-red — a warm amber/gold like `#C8850D` (darker than Easter gold, distinct from sacred gold). This gives temporal badges a consistent, recognizable identity year-round.

### 2B. Atmospheric wash = full-strength seasonal color (TOO STRONG)

The body gradient, daily card background, schedule-day--today background, detail-coming-up gradient, return card, and several other surfaces all use `--color-accent-pale` as a background fill. During Lent, `--color-accent-pale` resolves to `#F3E8FF` — a perceptible lilac wash. During Ordinary Time it becomes `#DCFCE7` — a perceptible mint wash. These tinted surfaces stack on top of each other: the body gradient (purple) + a daily card (purple) + a today schedule row (purple) + a soon card (purple) = purple everywhere.

**Apple parallel:** iOS uses ultra-subtle warm/cool surface tinting. The difference between "light" and "dark" backgrounds in iOS is about 2-3% luminance shift. You feel it but you can't quite point to it. Apple never puts a strong tint on a card background.

**Elements affected (12+ touchpoints):**
- `body` seasonal gradients (the viewport itself)
- `.daily-card` background
- `.return-card` background
- `.schedule-day--today` background
- `.parish-card--soon` gradient
- `.detail-coming-up` gradient
- `.detail-next--soon` background
- Reader/CCC/prayer overlays (seasonal backgrounds)
- `.devot-card--seasonal` gradient
- `.fasting-banner` background
- `.hdo-banner` background

**Recommendation:** The body gradient and reader overlays should remain seasonal but become much more subtle — barely perceptible tints. Card-level backgrounds (.daily-card, .schedule-day--today, .detail-coming-up) should NOT use accent-pale. They should use a very light neutral tint (`--color-surface-hover` or `--color-primary-bg`) that provides hierarchy without seasonal coloring. The seasonal signal comes from the header line and a few key accent elements — not from painting every surface.

### 2C. Accent text used as general secondary text (OVERUSED)

`--color-accent-text` appears on daily card secondary text, return card text, card event row text, event countdowns, HDO banner labels, and more. During Lent this becomes `#5C6170` — a muted gray that's actually fine. But during Easter it becomes `#B45309` — a dark amber that tints all that text warm. During Ordinary Time it becomes `#15803D` — green text. This is too much tinted text across the interface.

**Apple parallel:** iOS never uses the accent color for body text or secondary labels. Text is always neutral (primary, secondary, or tertiary gray). Only interactive text (links, buttons) gets the tint color.

**Recommendation:** Most accent-text usages should become `--color-text-secondary` (neutral gray). The only elements that should use accent-colored text are explicit seasonal identification labels (`.saved-header-season`, `.saved-evt-cat--liturgical`) and interactive seasonal elements.

---

## 3. What SHOULD be seasonal (the short list)

After removing temporal urgency, atmospheric wash, and accent-as-body-text, the truly seasonal elements should be a very focused set:

### Tier 1 — The seasonal signature (2-3 elements)
- **Header accent line** (`.top-header::after`) — the single strongest seasonal brand signal. 3px gradient across the top. Correct as-is.
- **Season label text** (`.saved-header-season`) — "Lenten Season" in the Saved tab header. Correct as-is.
- **Body gradient** — keep but make nearly invisible. The current Lent tint `#F0ECF5` is too strong. Something like `#F5F4F6` (1-2% purple shift) would create atmosphere without overwhelming.

### Tier 2 — Liturgical content markers (5-6 elements)
- **Liturgical event accent bar** (`.ce-item-accent.liturgical`) — these events ARE the season. Correct.
- **Liturgical event icon bg** (`.ce-item-icon--liturgical`) — same.
- **Liturgical event labels** (`.saved-evt-cat--liturgical`, `.saved-evt-icon--liturgical`) — same.
- **Seasonal devotion card** (`.devot-card--seasonal`) — Stations during Lent, etc. Correct.
- **Daily liturgical card border** — the daily card could have a subtle seasonal left-border accent (not a full gradient fill).

### Tier 3 — Seasonal spiritual practice banners (2-3 elements)
- **Fasting/abstinence banner** — genuinely seasonal, but the background should be very subtle.
- **HDO banner** — holy days are liturgical, seasonal accent is appropriate but should be subtle.

**Total truly seasonal elements: ~12, down from 60.**

---

## 4. Proposed color architecture (final system)

### Layer 1: Structural palette (never changes)

| Token | Value | Role |
|-------|-------|------|
| `--color-primary` | `#2C3E5A` | Navigation, headers, interactive text |
| `--color-surface` | `#FFFFFF` | Card backgrounds |
| `--color-bg` | `#F8F7F4` | Page background (warm neutral) |
| `--color-text-primary` | `#1A1E26` | Body text |
| `--color-text-secondary` | `#5C6370` | Secondary labels, metadata |
| `--color-text-tertiary` | `#8B919C` | Hints, timestamps |
| `--color-border` | `#E5E2DC` | Dividers |

### Layer 2: Semantic status colors (never changes)

| Token | Value | Role |
|-------|-------|------|
| `--color-verified` | `#4A7C59` | Verified badge, live indicators |
| `--color-info` | `#3478C6` | Informational badges |
| `--color-fav` | `#E11D48` | Saved/favorite heart |
| `--color-error` | `#B91C1C` | Error states |

### Layer 3: Sacred content (fixed warm gold — never changes)

| Token | Value | Role |
|-------|-------|------|
| `--color-sacred` | `#B8963F` | CCC, Scripture, Gospel, rosary, YC brand |
| `--color-sacred-text` | `#7D6520` | Sacred text labels |
| `--color-sacred-pale` | `#F5EDD8` | Sacred content backgrounds |

### Layer 4: Temporal urgency (NEW — fixed, never changes)

| Token | Light | Dark | Role |
|-------|-------|------|------|
| `--color-soon` | `#C8850D` | `#E5A33D` | "Starting soon" / "imminent" / "today" |
| `--color-soon-text` | `#8B5E06` | `#E5A33D` | Soon badge text |
| `--color-soon-pale` | `#FEF6E7` | `#2A1F0A` | Soon badge background |

Why this amber: it's warm and urgent without being alarming (not red), distinct from sacred gold (darker, more orange), and doesn't collide with any seasonal accent. It reads as "attention needed" across all seasons.

### Layer 5: Service types (fixed)

| Token | Value | Role |
|-------|-------|------|
| `--color-svc-adoration` | `#B87514` | Adoration schedule dots, perpetual card |
| `--color-svc-devotion` | `#8B5A6D` | Devotion schedule dots |
| Mass, Sacraments | Use existing primary/verified | Already correct |

### Layer 6: Event categories (fixed, liturgical inherits season)

| Token | Value | Role |
|-------|-------|------|
| `--color-cat-devotional` | `#8B3A62` | Devotional events |
| `--color-cat-social` | `#0D7377` | Social/fellowship events |
| `--color-cat-volunteering` | `#B85C38` | Service/volunteering events |
| Liturgical | `var(--color-accent)` | Inherits seasonal (correct) |

### Layer 7: Seasonal accent (shifts with liturgical calendar — REDUCED scope)

| Season | `--color-accent` | `--color-accent-pale` (MUCH subtler) |
|--------|-----------------|--------------------------------------|
| Default | `#B8963F` (warm gold) | `#F5EDD8` |
| Lent/Advent | `#7C3AED` (purple) | `#F8F6FA` (barely visible) |
| Easter/Christmas | `#D97706` (gold) | `#FEFCF5` (barely visible) |
| Ordinary | `#16A34A` (green) | `#F6F9F6` (barely visible) |

Key change: `--color-accent-pale` becomes ultra-subtle. Currently Lent pale is `#F3E8FF` (clearly purple). Proposed: `#F8F6FA` (you can barely tell it's tinted). The atmosphere is *felt*, not *seen*.

Simultaneously: `--color-accent-text` is REMOVED from most usages. It's only used for the season label and liturgical event category text. Everything else uses `--color-text-secondary`.

### Layer 8: Vestment colors (unchanged)
Saint card `data-lit-color` system stays exactly as-is.

---

## 5. Migration map — what changes and what stays

### Elements moving FROM accent → temporal urgency (`--color-soon` family)

| Element | Current | Proposed |
|---------|---------|----------|
| `.card-soon-badge` text | `accent-text` | `--color-soon-text` |
| `.card-soon-badge` bg | `accent-pale` | `--color-soon-pale` |
| `.card-soon-badge .pulse-dot` | `accent` | `--color-soon` |
| `.card-imminent-badge` text | `accent-text` | `--color-soon-text` |
| `.card-imminent-badge` bg | `accent-pale` | `--color-soon-pale` |
| `.parish-card--soon` border | `accent` | `--color-soon` |
| `.parish-card--soon` gradient | `accent-pale` | `--color-soon-pale` |
| `.parish-card--imminent` border | `accent` | `--color-soon` |
| `.detail-next--soon` bg | `accent-pale` | `--color-soon-pale` |
| `.detail-next-badge.soon` text | `accent-text` | `--color-soon-text` |
| `.detail-coming-row--soon` border | `accent` | `--color-soon` |
| `.detail-coming-up` gradient bg | `accent-pale` | `--color-soon-pale` |
| `.sched-soon` border | `accent` | `--color-soon` |
| `.sched-soon-badge` text + bg | `accent-text` / `accent-pale` | `--color-soon-text` / `--color-soon-pale` |
| `.litu-soon` text + bg | `accent-text` / `accent-pale` | `--color-soon-text` / `--color-soon-pale` |
| `.schedule-day--today` bg | `accent-pale` | `--color-soon-pale` |
| `.saved-evt-today` border + bg | `accent` | `--color-soon` |
| `.saved-evt-today-badge` text | `accent` | `--color-soon-text` |

### Elements moving FROM accent → neutral/primary

| Element | Current | Proposed |
|---------|---------|----------|
| `.daily-card` bg | `accent-pale` gradient | `--color-surface-hover` gradient |
| `.daily-card-secondary` text | `accent-text` | `--color-text-secondary` |
| `.return-card` bg | `accent-pale` | `--color-surface-hover` |
| `.return-text` / `.return-dismiss` | `accent-text` | `--color-text-secondary` |
| `.card-evt-row` text | `accent-text` | `--color-text-secondary` |
| `.ce-item-when .ce-countdown` | `accent-text` | `--color-text-secondary` |

### Accent-pale values getting much subtler (staying seasonal)

The season override rules at `:root[data-season="..."]` get updated `--color-accent-pale` values:

| Season | Current `accent-pale` | Proposed `accent-pale` |
|--------|----------------------|----------------------|
| Lent/Advent | `#F3E8FF` | `#F8F6FA` |
| Easter/Christmas | `#FEF3C7` | `#FEFCF5` |
| Ordinary | `#DCFCE7` | `#F6F9F6` |

### Body gradients getting much subtler

| Season | Current gradient end | Proposed gradient end |
|--------|---------------------|---------------------|
| Lent/Advent | `#F0ECF5` | `#F5F4F6` |
| Easter/Christmas | `#F9F6ED` | `#F8F7F3` |
| Ordinary (no change needed) | N/A | `#F7F8F6` |

### Elements staying on seasonal accent (correct)

- `.top-header::after` (header accent line)
- `.saved-header-season` (season label text)
- `.ce-item-accent.liturgical` + icon + saved variants (liturgical events)
- `.devot-card--seasonal` + icon (seasonal devotion card)
- `.saved-evt-season-lent` / `.saved-evt-season-advent` / `.saved-evt-season-christmas` borders
- `.fasting-banner` bg + border (but accent-pale is now subtler)
- `.hdo-banner` bg + label + CTA (but accent-pale is now subtler)
- `.tab-saved-badge` / `.tab-more-badge` dots
- `.pull-indicator` loading (minor)
- `.map-locate-loading` (minor)
- `.skip-link:focus` outline (accessibility)

---

## 6. What this achieves for each demographic

### The 72-year-old parishioner
Before: Everything is the same purple. "Starting soon" looks the same as the fasting reminder, which looks the same as the liturgical day card. Color provides no wayfinding.
After: Warm amber badges mean "something is happening soon — tap here." Warm gold means "Scripture and prayer." A faint purple atmosphere says "it's Lent." Three distinct signals, not one.

### The 25-year-old phone-native
Before: Sees a monochromatic app that feels unsophisticated. "This app has one color."
After: Sees a restrained, Apple-like neutral interface where color appears sparingly and with purpose. The seasonal tint is felt as atmosphere — like walking into a church during Lent where the lighting is different. It's not painted on the walls.

### The 45-year-old parent (one-handed, scanning)
Before: Scanning the Find tab, every card looks the same shade of purple. Can't tell which ones need attention.
After: Amber-bordered cards with amber badges immediately signal "this is about to start." The rest of the cards are clean white. Scanning works in one second.

---

## 7. Design principles this follows

1. **Color is a signal, not a theme.** Each color means one thing. You never have to ask "why is this purple?"
2. **Seasonal atmosphere is felt, not seen.** Like incense in a church — you sense it without staring at it.
3. **Urgency is urgent regardless of season.** The warm amber soon-badge looks the same on Ash Wednesday and on the feast of Corpus Christi.
4. **Sacred content has its own warmth.** Scripture and prayer keep their contemplative gold year-round.
5. **The accent color is a thread, not a flood.** The header line, the season label, and a few liturgical markers carry the season. Everything else is neutral.
6. **Every color earns its place.** If you can't explain why this element has this color, it should be gray.

---

## 8. What changes in the CSS (scope estimate)

- **New tokens:** 3 (--color-soon, --color-soon-text, --color-soon-pale) in both light and dark
- **Season overrides modified:** 5 rules (accent-pale values made subtler)
- **Body gradients modified:** 4 rules (Lent, Advent, Easter, Christmas made subtler)
- **Temporal urgency migration:** ~18 rules → soon family
- **Neutralized to text-secondary:** ~6 rules (accent-text → text-secondary)
- **Daily card / return card neutralized:** ~4 rules
- **Total CSS changes:** ~35-40 rules
- **No JS changes**
- **No new classes**
- **Estimated effort:** 2-3 hours

---

## 9. Open questions for second pass

1. **Daily card treatment:** Should the liturgical day card have ANY seasonal tinting (subtle border-left? icon color?) or go fully neutral? It IS liturgical content, but it's also the first thing the user sees and a big surface area.

2. **Fasting/HDO banner:** These use accent-pale backgrounds which will now be ultra-subtle. Is that enough visual weight for a banner that needs to be noticed? Or should they use a fixed warm tone instead?

3. **Dark mode body gradients:** Currently Lent dark mode body goes from `#1A1C22` to `#1E1A28` (subtle purple shift). Should this stay or become neutral? Dark mode is already muted; the shift may be acceptable.

4. **schedule-day--today:** Currently uses accent-pale. The proposed move to soon-pale (warm amber) makes it read as "urgent" rather than "current." Should today-highlighting be a lighter neutral instead (surface-hover)?

5. **Reader/CCC/prayer seasonal overlays:** These are currently the one place where stronger seasonal tinting creates genuine atmosphere for contemplation. Should these stay at current strength, or also get subtler? The prayer experience is one place where a stronger tint is arguably appropriate.

6. **The devot-card--seasonal variant:** During Lent, Stations of the Cross gets a purple treatment. This is correct. But should it be the ONLY seasonal devotion card? Or should the system support multiple seasonal cards (e.g., Advent wreath guide during Advent)?

---

## 10. Summary — the one-liner

Stop using color to say "it's Lent." Use color to say "this needs your attention," "this is Scripture," "this is happening soon," or "this is a social event." Then whisper "it's Lent" through the faintest atmospheric shift in the background and a single accent line at the top of the screen.
