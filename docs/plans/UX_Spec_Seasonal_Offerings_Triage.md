# UX Spec: Seasonal Offerings Triage & More Tab Information Architecture

**Spec prefix:** SOT (Seasonal Offerings Triage)
**Created:** 2026-03-14
**Status:** Draft — awaiting review
**Source:** seasonal-offerings-research.pdf (IDEA-053 → IDEA-066)
**Scope:** UX triage of 14 proposed seasonal features; structural framework for the More tab; implementation-ready specs for Phase 1

---

## The Core Problem

The research document proposes 14 new features. Every single one is described as "a card on the More tab." That is the UX problem this spec solves.

The More tab already has **six content zones** stacked vertically:

```
Current More Tab (top → bottom)
─────────────────────────────────
1. HDO Banner              (conditional — ~60px when shown)
2. Saint Card              (always — ~100-140px)
3. Today's Readings        (always — ~180px collapsed, ~600px+ expanded)
4. Prayer & Devotion       (always — 4 tool cards + library teaser, ~280px)
5. Grow in Faith           (always — seasonal guide pinned + year-round guides, ~400px+ expanded)
6. PWA Install Card        (conditional — ~160px, dismissible)
7. Footer                  (always — ~80px)
```

**Measured scroll depth on iPhone SE (375×667):** The current More tab requires approximately **3–4 full screen scrolls** to reach the footer. Adding even 3–4 new cards above the fold would push Prayer & Devotion below the second scroll, which means the 45-year-old parent one-handing their phone while wrangling kids will never see the Rosary button. The 72-year-old parishioner will scroll twice, get confused, and give up.

**The phone-native 25-year-old** will perceive the tab as "cluttered" within 200ms of opening it and mentally file the app as a content dump rather than a tool.

### Design Principle

> The More tab is a **dashboard**, not a **feed**. It should feel like opening the front page of a well-curated parish bulletin — not like scrolling an infinite timeline.

Every seasonal item must either **enhance an existing element** or live inside a **single contained zone** with strict density rules. The tab's scroll depth must not increase by more than one additional viewport.

---

## Structural Proposal: The Seasonal Moment

### SOT-01 — Introduce "Season & Devotion" Zone

**What:** A single new section between the Saint Card and Today's Readings that serves as the **one container** for all seasonal content. It replaces the scattered "add a card" approach with a contained, curated zone that auto-rotates based on the liturgical calendar.

**Rules for the zone:**

1. **Maximum 2 visible cards at any time.** No exceptions. If the liturgical calendar produces 3+ relevant items (e.g., Holy Week + active novena + monthly devotion), the system prioritizes by specificity: day-specific > week-specific > season-specific > month-specific.
2. **Cards are compact.** Each card is a single row with icon, title, 1-line subtitle, and a tap-to-expand pattern. Expanded state uses a bottom sheet or inline expansion (not a new page). Maximum expanded height: 280px (roughly half a phone screen).
3. **The zone collapses entirely when empty.** During periods with no seasonal content (unlikely but possible in mid-Ordinary Time), the zone disappears and the layout closes the gap.
4. **Cards link to action.** Every card must have a primary action: open a prayer tool, navigate to Find tab, expand to read content. No dead-end informational cards.

**Why this works for each persona:**

- **72-year-old:** Sees at most 2 new items, each with large tap targets. The saint card and readings — which they came for — haven't moved. The seasonal zone is visually distinct (uses seasonal accent border) so it reads as "something special today" rather than "more stuff to scroll past."
- **25-year-old:** The contained zone signals editorial curation — "someone thought about what to show me today." This is the Apple HIG pattern of contextual cards (Weather app's daily summary, Fitness app's seasonal challenge). It feels intentional, not dumped.
- **45-year-old parent:** The zone is skippable in under one thumb-flick. If it catches their eye (e.g., "Holy Thursday — find Mass of the Lord's Supper near you"), the action link gets them where they need to go in one tap.

**HTML insertion point (index.html):**

```
Between saintSection and readingsSection:

<div class="more-section more-section--tight" id="seasonalMoment">
  <!-- JS-rendered: 0-2 compact cards based on liturgical calendar -->
</div>
```

**CSS spec:**

```css
/* Container */
#seasonalMoment:empty { display: none; }
#seasonalMoment { padding: var(--space-2) 0; }

/* Individual seasonal card */
.seasonal-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface);
  border: 1px solid var(--color-border-light);
  border-left: 3px solid var(--color-accent);  /* seasonal accent */
  border-radius: var(--radius-md);
  cursor: pointer;
  min-height: 48px;                            /* touch target */
  -webkit-tap-highlight-color: transparent;
  transition: box-shadow 0.15s;
}
.seasonal-card + .seasonal-card { margin-top: var(--space-2); }
.seasonal-card:active { transform: scale(0.98); }

/* Icon circle — same pattern as prayer tool icons */
.seasonal-card-icon {
  width: 32px; height: 32px;
  border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: var(--color-accent-pale);
  color: var(--color-accent);
}
.seasonal-card-icon svg { width: 18px; height: 18px; }

/* Text */
.seasonal-card-body { flex: 1; min-width: 0; }
.seasonal-card-title {
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  color: var(--color-text-primary);
  line-height: 1.3;
}
.seasonal-card-subtitle {
  font-size: var(--text-sm);
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.3;
}

/* Chevron for expandable cards */
.seasonal-card-chevron {
  width: 16px; height: 16px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
  transition: transform 0.2s;
}

/* Dark mode */
html[data-theme="dark"] .seasonal-card {
  background: var(--color-surface);
  border-color: var(--color-border-light);
  border-left-color: var(--color-accent);
}
```

**Expanded state:** When a seasonal card is tapped, it expands inline using `<details>`/`<summary>` (matching the Faith Guides pattern). The expanded body uses `--font-prayer` for sacred text, includes CCC/Scripture ref pills where appropriate, and has a primary action button at the bottom.

**Priority logic (in seasonal.js or within more.js):**

```
Priority order for the 2 visible slots:
1. Day-specific (Holy Week guide, O Antiphon, Divine Mercy Sunday)
2. Active-novena promotion (Divine Mercy novena in progress, Pentecost novena)
3. Week-specific (Ember Days, Marian Consecration countdown)
4. Season-specific (Easter Alleluia/Regina Caeli, Seasonal CCC Spotlight)
5. Month-specific (Monthly Devotion Card)

If >2 items qualify, show the top 2 by priority.
If slot 1 is day-specific and slot 2 is also day-specific, show both.
```

---

## Item-by-Item Triage

### Tier A — Enhance Existing Elements (no new cards needed)

These items should augment elements already on the More tab rather than adding new cards.

#### SOT-02 — Liturgical Color Awareness (IDEA-057) → Enhance Saint Card

**Recommendation: Integrate into the existing saint card, not a separate card.**

The saint card already renders with a `data-lit-color` attribute that changes its left-border color. The infrastructure is fully in place. What's missing is making that color *meaningful* to the user.

**Before:** Saint card shows the liturgical color as a left border but doesn't explain it.

**After:** Add a small colored dot + label beneath the feast/date line:

```
Memorial · March 19              ← existing feast label
━━━━━━━━━━━━━━━━━━━━━
St. Joseph                       ← existing saint name
● White — Feast of the Lord      ← NEW: inline color indicator
```

**Implementation:**
- In `renderSaintCard()` (readings.js ~line 500), after building `feastLabel`, add a `colorLabel` using a lookup map from the litcal `color` field.
- Color map: `{ purple: 'Penance & preparation', red: 'Martyrs & the Holy Spirit', white: 'Joy & purity', green: 'Growth & hope', rose: 'A brief respite in the penitential season' }`
- Render as: `<div class="saint-color"><span class="saint-color-dot" style="background:${colorHex}"></span> ${colorName} — ${colorMeaning}</div>`
- The dot is 8×8px with `border-radius:50%`, inline with text. Touch target is the whole line (expandable to a 2-sentence explanation on tap for users who want to learn more).

**CSS:**
```css
.saint-color {
  font-size: var(--text-xs);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}
.saint-color-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
```

**Effort:** 30-45 min
**Dark mode:** The dot colors already have dark-mode variants in the saint card CSS (lines 1726-1730). Reuse those hex values.
**Cascading impact:** None — purely additive to existing saint card render.

**Persona walk-through:**
- 72-year-old: "Oh, the priest is wearing white today — now I know why." The dot is visible even through bifocals because it's a solid color block, not text.
- 25-year-old: Appreciates the detail without it taking up space. This is the kind of micro-interaction that signals quality.
- 45-year-old: Glances at it or doesn't — either way it adds no scroll depth.

---

#### SOT-03 — Seasonal Novena Auto-Surfacing (IDEA-055) → Enhance Prayer Tools Grid

**Recommendation: Modify the existing novena card in Prayer & Devotion, not a separate card.**

The novena tracker already sits in the prayer tools grid with a contextual subtitle ("Day 3 of 9" or "9-day guided prayer"). The auto-surfacing should happen *within* this existing card, not above it.

**Before:** Novena card always says "Novena Tracker · Day X of 9" or "9-day guided prayer"

**After:** During promotion windows, the novena card gets the `prayer-tool-card--promoted` treatment (accent left-border + gradient) and the subtitle changes to the contextual CTA:

- Good Friday → Divine Mercy Sunday: "Divine Mercy Novena begins today" (or "Day X of 9 — Divine Mercy")
- Ascension → Pentecost: "The original novena — Ascension to Pentecost"
- March 10-19: "Novena to St. Joseph — his feast is March 19"

**Implementation:**
- In `more.js` `renderMore()`, where `promotedId` logic already exists (~line 165), add date-matching against litcal keys for Good Friday, Ascension, and March date range.
- Modify the novena entry in `ptCards` to use the contextual subtitle when a seasonal novena is relevant.
- The `ptColors.novena` and `ptBgColors.novena` should shift to accent colors during promotion windows.

**Effort:** 1-1.5 hrs
**Cascading impact:** Pairs naturally with IDEA-065 (Pentecost Novena) and IDEA-066 (Divine Mercy Sunday). When IDEA-065/066 are implemented as seasonal cards in the SOT-01 zone, the novena tracker promotion provides the *action* while the seasonal card provides the *context*.

---

#### SOT-04 — Seasonal CCC Spotlight (IDEA-060) → Enhance Existing CCC Reflection Slot

**Recommendation: Use the `dailyFormation` slot (currently hidden, index.html line 138) rather than adding a new card.**

The HTML already has a `<div id="dailyFormation">` that's display:none. This was intended for Baltimore Catechism Q&A + Summa content (per the code comment). Repurpose this slot for the Seasonal CCC Spotlight. It sits between Prayer & Devotion and Grow in Faith — a natural position for formation content.

**Implementation:**
- Curate ~100-150 CCC paragraph numbers mapped to seasons (the research doc provides the starting ranges).
- In `more.js`, un-hide `dailyFormation` and render a compact card: section label "Catechism for the Season", the CCC paragraph number as a `ref-tap--ccc` pill, first 2 sentences of the paragraph text in `--font-prayer`, and a "Read more in Catechism" link that opens the CCC sheet.
- Rotate weekly (use `Math.floor(dayOfYear / 7) % seasonParagraphs.length` for deterministic weekly rotation).

**Effort:** 2-3 hrs (mostly curation)
**Cascading impact:** None — slot already exists in DOM.

**Persona walk-through:**
- 72-year-old: Sees a familiar Catechism reference in a readable format. If they tap it, the CCC sheet opens (which they may already know from using the app). If they don't, it's a single small card that doesn't push anything down.
- 25-year-old: "I didn't know the Catechism said that about Lent" — discovery of depth content without having to go looking for it.
- 45-year-old: Skips it with one thumb-flick, or reads the 2-sentence preview while waiting for their kid to put on shoes.

---

### Tier B — Seasonal Moment Cards (live inside SOT-01 container)

These are the items that belong in the new Season & Devotion zone as compact, expandable cards. **Maximum 2 visible at a time** per the SOT-01 rules.

#### SOT-05 — Holy Week Day-by-Day Guide (IDEA-056)

**Priority level:** Day-specific (highest)
**Active window:** Palm Sunday → Easter Sunday (April 1–5, 2026)
**Slot behavior:** Takes slot 1 during Holy Week. Always visible — this is the app's most important seasonal moment.

**Card (collapsed):**
```
[Cross icon]  Holy Thursday                    ›
              Mass of the Lord's Supper tonight
```

**Card (expanded — max 280px, scrollable if needed):**

Title in `--font-display` (Playfair), body in `--font-prayer` (Georgia), ~120-150 words per day. Structure:

1. Day name + significance (1 sentence)
2. What happens at this liturgy (2-3 sentences)
3. Action link: "Find [service] near you →" → switches to Find tab with appropriate filter

**Data:** 8 entries (Palm Sunday, Mon, Tue, Wed, Thu, Fri, Sat, Easter Sunday), ~150 words each. Inline in a `HOLY_WEEK` const or small JSON. Date-match against litcal keys.

**Test checklist:**
- [ ] Card appears only during Holy Week date range
- [ ] Correct day renders based on today's date
- [ ] Find tab link applies correct filter (e.g., "holy-thursday" → evening Mass)
- [ ] Expanded state doesn't exceed 280px on iPhone SE
- [ ] Dark mode: text readable, accent border uses `var(--color-accent)`
- [ ] Card disappears on Easter Monday

**Effort:** 2-3 hrs
**Persona notes:** This is the single highest-impact item in the entire list. The 72-year-old will open the app on Holy Thursday and see "Mass of the Lord's Supper tonight" — exactly what they need. The 25-year-old gets elegant context about what's happening and why. The parent taps "Find Mass near you" and is done in 3 seconds.

---

#### SOT-06 — Easter Alleluia + Regina Caeli (IDEA-061)

**Priority level:** Season-specific
**Active window:** Easter Sunday → Pentecost (April 5 – May 24, 2026)
**Slot behavior:** Takes slot 1 during Easter season (after Holy Week guide ends).

**Card (collapsed):**
```
[Sun icon]  Alleluia! — Easter Season          ›
            Day 12 of 50 · Regina Caeli
```

**Card (expanded):**
- Brief note: "The Church's most joyful 50 days — every Sunday is a little Easter."
- **Regina Caeli prayer** in `--font-prayer` (Georgia): This is the prayer that replaces the Angelus during Easter season. ~60 words, public domain, deeply traditional.
- Countdown to Pentecost: "Pentecost in 38 days"
- Optional link: When Ascension approaches, link to the Holy Spirit Novena (pairs with SOT-03).

**Day counter note:** The "Day X of 50" is acceptable here because Easter is a *celebration*, not a penance. The research doc correctly flagged that Lenten day counters feel gamified — but Easter is the opposite. Counting up to Pentecost is liturgically appropriate and joyful.

**Effort:** 1-1.5 hrs
**Dark mode:** Gold accent (`--color-accent` during Easter = #D97706) with dark background.

---

#### SOT-07 — Divine Mercy Sunday Experience (IDEA-066)

**Priority level:** Day-specific (highest)
**Active window:** Second Sunday of Easter (April 12, 2026)
**Slot behavior:** Takes slot 1 on that day, bumping the general Easter Alleluia card to slot 2.

**Card (collapsed):**
```
[Heart icon]  Divine Mercy Sunday               ›
              Plenary indulgence available today
```

**Card (expanded):**
- Brief explanation of the devotion (~100 words)
- Indulgence conditions (Confession within ~20 days, Communion, prayer for Pope's intentions)
- "Pray the Divine Mercy Chaplet →" → opens the chaplet in devotions.js
- CCC refs on God's mercy (CCC 1846-1848) wired to snippet system
- Tie-in: If the Divine Mercy Novena was started on Good Friday (via novena tracker), show completion status: "Your novena concludes today."

**Effort:** 1.5 hrs

---

#### SOT-08 — Pentecost Novena Countdown (IDEA-065)

**Priority level:** Day-specific during Ascension, then week-specific through Pentecost
**Active window:** Ascension Thursday → Pentecost Sunday (May 14–24, 2026)
**Slot behavior:** Takes slot 1 on Ascension Thursday, then slot 2 for the remaining days (below the Easter Alleluia card).

**Card (collapsed):**
```
[Flame icon]  The Original Novena               ›
              9 days of prayer — Ascension to Pentecost
```

**Card (expanded):**
- "The Apostles prayed for 9 days between Christ's Ascension and Pentecost. This was the first novena."
- Direct "Start the Holy Spirit Novena →" link that opens the novena tracker with the Holy Spirit novena pre-selected.
- If already started, show progress: "Day 5 of 9"

**Effort:** 1.5 hrs (data already exists — this is date matching + UI card)

---

#### SOT-09 — Monthly Devotion Card (IDEA-053)

**Priority level:** Month-specific (lowest)
**Active window:** Always (rotates monthly)
**Slot behavior:** Takes slot 2 when no higher-priority items fill it. Disappears when both slots are occupied by day/week/season-specific content.

**Card (collapsed):**
```
[Calendar icon]  March: Month of St. Joseph      ›
                 Patron of the Universal Church
```

**Card (expanded):**
- ~100-word explanation of the monthly dedication
- CCC reference(s) wired to snippet system
- Suggested action linking to an existing tool:
  - January → (general prayer)
  - February → (family prayer)
  - March → "Pray the St. Joseph Novena →" → novena tracker
  - May → "Pray the Rosary →" → rosary tool
  - October → "Pray the Rosary →" → rosary tool
  - November → "Pray for the dead" → (Examen or general prayer)

**Data:** 12 JSON entries, ~100 words each + CCC refs + action links.

**Effort:** 2-3 hrs (mostly content curation)

---

#### SOT-10 — O Antiphons (IDEA-054)

**Priority level:** Day-specific (highest)
**Active window:** December 17–23 (Advent)
**Slot behavior:** Takes slot 1 during these 7 days.

**Card (collapsed):**
```
[Star icon]  O Sapientia — O Wisdom             ›
             Dec 17 · The O Antiphons of Advent
```

**Card (expanded):**
- Latin title + English translation in `--font-display`
- Full antiphon text (2-3 sentences) in `--font-prayer`
- One-line explanation of the Old Testament reference
- All text public domain (pre-medieval)

**Effort:** 1.5-2 hrs
**Note:** This pairs beautifully with the Advent Wreath (SOT-11) when both are implemented. During Dec 17-23, the O Antiphon takes slot 1 and the Advent Wreath takes slot 2.

---

### Tier C — Phase 2/3 Items (defer or integrate into existing tools)

These items are sound ideas but should not be built until Phase 1 is shipped and evaluated. They either require larger effort, serve a niche audience, or need to be integrated into existing tools rather than the More tab.

#### SOT-11 — Advent Wreath Devotion (IDEA-058) → Phase 2 (Advent 2026)

**Placement:** Seasonal Moment zone, slot 1 or 2 during Advent.
**Notes:** The SVG wreath is a delightful idea but is a 3-4 hour build with custom animation. Ship it for Advent 2026 (November). Design the wreath as a self-contained component that opens in the prayer reader overlay (z-index 1000, full-screen, wake lock), not inline on the More tab. The collapsed card in the Seasonal Moment zone shows the wreath icon + "Week 2 of Advent · Light the candle →". Tapping opens the immersive wreath experience.

**Key UX constraint:** The wreath must not auto-play any animation or sound on the More tab. It is a *link to an experience*, not the experience itself. The More tab is a dashboard.

---

#### SOT-12 — First Friday / First Saturday Tracker (IDEA-059) → Phase 3, integrate into Prayer Tools

**Placement:** Not the Seasonal Moment zone. This is a **prayer tool**, not a seasonal card. It belongs in the Prayer & Devotion grid alongside the Rosary, Examen, Stations, and Novena Tracker.

**When built:** Add as a 5th card in the prayer tools grid. On mobile (single column), this is fine. On wider screens (2-column grid), it creates an asymmetric 3+2 layout — acceptable.

**Card design:** Same pattern as existing prayer tool cards. Icon: two small circles (representing First Friday/Saturday). Subtitle shows progress: "3 of 9 First Fridays" or "Next First Friday: April 3". Links to Find tab to locate Mass.

**UX caution:** The "resets if a month is missed" mechanic needs gentle handling. Don't show "0 of 9 — you missed a month!" — instead: "Ready to begin again" with no judgment. Privacy-first: localStorage only.

---

#### SOT-13 — Seasonal Scripture Spotlight (IDEA-063) → Phase 3, evaluate need after SOT-04

**Recommendation: Wait.** The Seasonal CCC Spotlight (SOT-04) serves a very similar purpose — rotating contemplative content tied to the season. Shipping both risks card fatigue. Evaluate after SOT-04 has been live for one full season cycle. If users engage with the CCC Spotlight, consider adding Scripture as an alternating rotation (CCC one week, Scripture the next) within the same `dailyFormation` slot rather than a separate card.

---

#### SOT-14 — Marian Consecration Countdown (IDEA-064) → Phase 4

**Recommendation: Defer.** The awareness card alone (2-3 hrs) is reasonable, but the 33-day daily prayer tracker (6-8 hrs) is a significant build that essentially creates a new prayer tool. Without the daily texts, the awareness card is just a notification that links to... nothing in the app. This needs the full tracker to be meaningful, which puts it in Phase 4 territory.

**When built:** Integrate as a prayer tool (like the novena tracker), with a promotional card in the Seasonal Moment zone during the ~1 week before each start date.

---

#### SOT-15 — Ember Days Awareness (IDEA-062) → Phase 3, low-priority seasonal card

**Recommendation: Low priority.** The research doc correctly notes that "most Catholics have never heard of them." While educationally valuable, this serves only the depth-seeking minority. Build when the Seasonal Moment zone is stable and there are empty slots during Ordinary Time.

**When built:** Priority level "week-specific" — shows in slot 2 during Ember Day weeks.

---

## Revised More Tab Layout (Post-Implementation)

```
More Tab (top → bottom) — with Seasonal Moment
───────────────────────────────────────────────
1. HDO Banner              (conditional)
2. Saint Card              (enhanced: liturgical color indicator — SOT-02)
3. ★ Season & Devotion     (NEW — SOT-01: max 2 compact cards)
4. Today's Readings        (unchanged)
5. Prayer & Devotion       (enhanced: novena auto-surfacing — SOT-03)
6. Catechism for Season    (repurposed dailyFormation slot — SOT-04)
7. Grow in Faith           (unchanged)
8. PWA Install Card        (conditional)
9. Footer                  (unchanged)
```

**Net scroll depth increase:** ~100-120px (two compact cards at ~48-56px each). This is less than one thumb-flick and does not push Prayer & Devotion below the second viewport on any standard phone.

---

## Phase 1 Implementation Plan (Lent → Easter → Pentecost 2026)

Ordered by **liturgical urgency** — what needs to ship first to be seasonally relevant:

| Order | Spec ID | Item | Active Date | Effort | Notes |
|-------|---------|------|-------------|--------|-------|
| 1 | SOT-01 | Seasonal Moment container | Permanent | 1-2 hrs | Infrastructure — must ship first |
| 2 | SOT-02 | Liturgical color in saint card | Permanent | 30-45 min | Quick win, enhances existing |
| 3 | SOT-05 | Holy Week guide | Apr 1-5 | 2-3 hrs | **Highest impact. Must ship by March 31.** |
| 4 | SOT-03 | Novena auto-surfacing | Good Friday+ | 1-1.5 hrs | Divine Mercy Novena starts April 3 |
| 5 | SOT-07 | Divine Mercy Sunday | Apr 12 | 1.5 hrs | One-day card |
| 6 | SOT-06 | Easter Alleluia + Regina Caeli | Apr 5–May 24 | 1-1.5 hrs | 50-day Easter season |
| 7 | SOT-08 | Pentecost Novena | May 14-24 | 1.5 hrs | Ties into existing novena data |
| 8 | SOT-09 | Monthly Devotion Card | Permanent | 2-3 hrs | Year-round, can ship anytime |
| 9 | SOT-04 | Seasonal CCC Spotlight | Permanent | 2-3 hrs | Curation-heavy, can ship anytime |

**Phase 1 total: ~14-18 hours** (vs. research doc's ~7.5 hrs, because we're building proper infrastructure first)

**Critical deadline:** SOT-01 + SOT-05 must ship by **March 31** for Holy Week.

---

## Design Rules for All Seasonal Content

1. **Static data, no APIs.** Every seasonal feature works from pre-built JSON or inline data. No new external dependencies.
2. **Automatic rotation.** Content appears and disappears based on the liturgical calendar without user action.
3. **Gentle, not gamified.** No "Day X of 40" counters during penitential seasons. No streaks. No challenges. Easter's "Day X of 50" is acceptable because Easter is a celebration.
4. **Georgia for sacred text.** All prayer texts, antiphons, and Scripture in `--font-prayer`. Playfair for card titles. Source Sans for UI labels and subtitles.
5. **Progressive disclosure.** Seasonal cards collapse to one line. Expanded state caps at 280px.
6. **Dark mode parity.** Every seasonal element uses `var(--color-accent)` for borders, `var(--color-accent-pale)` for backgrounds. Both shift with `data-season`.
7. **Link to action.** Every card has a primary action: open a prayer tool, navigate to Find tab, expand for content. No dead-end informational cards.
8. **Two-card maximum.** The Seasonal Moment zone never shows more than 2 cards. Priority logic handles overflow.
9. **SVG icons only.** No emoji, no Unicode decorative characters.
10. **Privacy-first.** No tracking of which seasonal cards were viewed. Novena/devotion progress uses localStorage only.

---

## Test Checklist (applies to all SOT items)

- [ ] Card renders correctly on iPhone SE (375px width)
- [ ] Card renders correctly on iPad (768px width)
- [ ] Dark mode: all text readable, accent colors shift with season
- [ ] Touch targets ≥ 44×44pt on all interactive elements
- [ ] Expanded card does not exceed 280px height
- [ ] Card disappears when outside its active window
- [ ] Priority logic correctly handles overlapping items (test: set date to Holy Thursday during March = St. Joseph month)
- [ ] "Find near me" links switch to Find tab with correct filter applied
- [ ] Prayer tool links open the correct prayer overlay
- [ ] CCC ref pills open snippet popover
- [ ] Scripture ref pills open Bible reference
- [ ] No layout shift when seasonal cards appear/disappear
- [ ] Screen reader: all cards have appropriate ARIA labels
- [ ] `--font-prayer` (Georgia) used for all sacred text
- [ ] `--font-display` (Playfair) used for card titles
- [ ] `var(--color-accent)` used for seasonal borders — no hardcoded hex
