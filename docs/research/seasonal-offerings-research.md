# Seasonal Offerings Research — MassFinder

**Date:** 2026-03-14
**Researcher:** Claude Opus (product research session)
**Scope:** Expansive ideation for prayer tools, faith guides, and devotional features that flow with the rhythm of the liturgical year
**BACKLOG entries:** IDEA-053 through IDEA-066

---

## Problem Statement

MassFinder already has strong seasonal infrastructure — accent colors shift with the liturgical season, the More tab pins the current season's Faith Guide, Stations of the Cross gets promoted during Lent, and the Rosary auto-selects Sorrowful mysteries on Lenten days. But the app doesn't yet offer a *living* sense of moving through the Church's year. A user opening the app on the Tuesday of Holy Week sees roughly the same More tab as someone opening it on a random Wednesday in Ordinary Time (minus the accent color).

The liturgical calendar is the heartbeat of Catholic life. The Church doesn't just mark time — it *inhabits* it. Each season, month, week, and day has its own spiritual texture. MassFinder can serve that rhythm without becoming a content treadmill by leaning into pre-built, static data that rotates automatically.

**User need:** "The app should feel like it *knows* what season we're in — not just with colors, but with what it offers me to pray."

---

## What Already Exists

| Asset | Seasonal? | Notes |
|---|---|---|
| `data-season` attribute on `<html>` | ✅ | Drives accent colors, body gradients, header lines |
| Seasonal accent tokens (purple/gold/green) | ✅ | Full dark mode parity |
| Faith Guides (Lent, Easter, Advent, Christmas) | ✅ | Pinned to top when in-season, hidden when not |
| Stations of the Cross promoted during Lent | ✅ | `isLentSeason()` check in more.js |
| Rosary mystery auto-selection | ✅ | Sorrowful override during Lent (rosary.js:88) |
| Litcal data (2026 + 2027) | ✅ | Season, color, rank, cycles for every day |
| Saint card | ✅ | Daily, from litcal |
| Daily readings | ✅ | With lectionary matching |
| Fasting/abstinence banners | ✅ | Lenten Fridays, Ash Wed, Good Friday |
| HDO banners | ✅ | Holy Days of Obligation |
| 3 novenas (Divine Mercy, Holy Spirit, St. Joseph) | Partial | Data exists; not auto-surfaced by season |
| Devotional guides (Sunday Obligation, Confession, etc.) | ❌ | Year-round, no seasonal rotation |
| Prayer tool promotion logic | Partial | Stations (Lent), Rosary (Fridays), Examen (>30 days) |

**Key insight:** The infrastructure is solid. The `data-season` attribute, `isLentSeason()` helper, and litcal cache give us everything needed to conditionally render seasonal content. The gap is *content*, not *plumbing*.

---

## Competitive Landscape

**Hallow** (the $100M+ funded Catholic app) leans heavily into seasonal content:
- "Pray40" challenge during Lent, "Pray25" during Advent
- Themed content series with celebrity voices
- Seasonal audio meditations, sleep content, Gregorian chant
- Subscription-driven ($10.99/mo)

**What MassFinder should NOT do:** Gamify prayer with streaks/challenges, require subscriptions, add celebrity audio, or become a content platform. MassFinder's advantage is being free, local-first, and liturgically grounded without the engagement-trap mechanics.

**What MassFinder CAN do better than Hallow:** Surface the *traditional* devotional practices of the Church — monthly dedications, O Antiphons, Ember Days, First Friday/Saturday devotions, seasonal rosary emphasis — things that a parish bulletin might mention but that no app surfaces in a clean, contextual way. These are all static data, zero API, zero maintenance.

---

## Proposed Seasonal Offerings

### Tier 1 — High Impact, Low Effort (static data, existing infrastructure)

#### 1. Monthly Devotion Card (IDEA-053)
**What:** A card on the More tab that rotates monthly, showing the Church's traditional monthly dedication with a brief explanation, suggested prayer, and CCC reference.

The 12 traditional monthly dedications:
- Jan: Holy Name of Jesus → Jun: Sacred Heart → Jul: Precious Blood
- Feb: Holy Family → Aug: Immaculate Heart of Mary
- Mar: St. Joseph → Sep: Our Lady of Sorrows
- Apr: Blessed Sacrament → Oct: Holy Rosary
- May: Blessed Virgin Mary → Nov: Holy Souls in Purgatory
- Dec: Immaculate Conception

**Why it works:** Zero maintenance after initial build. Rotates automatically. Deeply traditional. Links naturally to existing tools (October → Rosary, March → St. Joseph novena, November → prayers for the dead). Each entry is ~100 words + 1-2 CCC refs.

**Data:** 12 JSON entries. Build script or inline in devotions.js.
**Effort:** 2-3 hours (data curation + render logic + styling)

#### 2. O Antiphons — Final Days of Advent (IDEA-054)
**What:** Dec 17–23, the Church prays the seven "O Antiphons" — ancient prayers that each address Christ with a different Old Testament title (O Sapientia, O Adonai, O Radix Jesse, O Clavis David, O Oriens, O Rex Gentium, O Emmanuel). These are among the most beautiful texts in the entire liturgy.

A daily card appears on the More tab during Dec 17–23 showing:
- The Latin title and English translation
- The full antiphon text (short — each is 2-3 sentences)
- A one-line explanation of the Old Testament reference

**Why it works:** Only 7 entries. Fires for 7 days per year. Deeply beloved by liturgically-aware Catholics. No app surfaces these well. The data is public domain (pre-medieval texts). Would make someone say "this app *gets it*."

**Data:** 7 JSON entries, ~50 words each.
**Effort:** 1.5-2 hours

#### 3. Seasonal Novena Auto-Surfacing (IDEA-055)
**What:** The app already has 3 novenas (Divine Mercy, Holy Spirit, St. Joseph). Today they sit in the Novena Tracker equally. Instead, auto-promote the contextually appropriate novena:
- **Divine Mercy Novena:** Promote starting Good Friday (traditional start date), 9 days ending Divine Mercy Sunday
- **Novena to the Holy Spirit:** Promote from Ascension Thursday through Pentecost (the original novena — the Apostles praying for 9 days)
- **Novena to St. Joseph:** Promote in March (month of St. Joseph), especially leading up to March 19

The promoted novena gets a seasonal badge and moves to the top of the novena list. If not started, a gentle CTA: "The traditional time to pray this novena begins [date]."

**Data:** Already exists. Only needs date-matching logic against litcal.
**Effort:** 1.5 hours (date logic + UI promotion)

#### 4. Holy Week Day-by-Day Guide (IDEA-056)
**What:** During Holy Week (Palm Sunday → Easter Sunday), replace or augment the liturgical teaser card with a richer daily guide:
- **Palm Sunday:** Procession, Passion reading, significance
- **Monday–Wednesday:** "Spy Wednesday," Jesus's final teachings
- **Holy Thursday:** Mass of the Lord's Supper, foot washing, Eucharist institution, altar stripping, watching hour
- **Good Friday:** Celebration of the Passion, Veneration of the Cross, no Mass today, church is bare
- **Holy Saturday:** The Great Silence, Easter Vigil prep, RCIA
- **Easter Sunday:** He is Risen, Alleluia returns

**Why it works:** Holy Week is the absolute peak of the liturgical year. Many Catholics (especially the 50+ demographic) want guidance on what's happening and why. This is the one week where the app should feel *alive* with the season. Static data — 7-8 entries.

**Data:** ~150 words per day × 8 days = ~1,200 words total.
**Effort:** 2-3 hours (data + conditional render + styling)

#### 5. Liturgical Color Awareness (IDEA-057)
**What:** A subtle indicator on the More tab (or within the liturgical teaser) showing today's liturgical color with a one-line explanation. The litcal data already includes the color field for every day. Special emphasis on unusual colors:
- **Rose:** Only two days per year (Gaudete Sunday in Advent, Laetare Sunday in Lent) — "A brief respite in the penitential season"
- **Red:** Martyrs, Pentecost, Palm Sunday, Good Friday
- **White/Gold:** Feasts of the Lord, Easter season, Christmas
- **Green:** Ordinary Time — "Growth and hope"
- **Purple/Violet:** Penance and preparation

The color indicator could be a small colored dot or bar that matches the actual liturgical color, with a tooltip or expandable explanation.

**Data:** Already in litcal-2026.json (`color` field). Just needs a display map.
**Effort:** 1 hour

---

### Tier 2 — Medium Effort, Strong Seasonal Resonance

#### 6. Advent Wreath Devotion (IDEA-058)
**What:** An interactive Advent wreath experience. Four weeks of Advent, each Sunday a new candle "lights." Tap a candle to see:
- The week's theme (Hope, Peace, Joy, Love)
- A brief prayer/blessing text (traditional Advent wreath prayers)
- The day's O Antiphon (during Dec 17-23, linking to IDEA-054)

Visual: A simple SVG wreath with 3 purple candles, 1 rose candle, and a white center candle (Christmas). Candles illuminate progressively. Dark mode: candles glow against the dark background.

**Why it works:** Many families do this at home but don't have the prayers memorized. Combines beautifully with the app's existing seasonal accent (purple for Advent). Could be the "signature" Advent experience.

**Data:** 4 weekly entries + 1 Christmas candle. ~80 words each.
**Effort:** 3-4 hours (SVG wreath, animation, prayer data, conditional rendering)

#### 7. First Friday / First Saturday Tracker (IDEA-059)
**What:** Two traditional Catholic devotions that span across all seasons:
- **Nine First Fridays** (Sacred Heart): Attend Mass and receive Communion on the first Friday of 9 consecutive months. Promise: special graces at the hour of death.
- **Five First Saturdays** (Fatima): Confession, Communion, Rosary, and 15-min meditation on the mysteries on 5 consecutive first Saturdays. Promise: Mary's intercession at death.

A simple tracker in the Prayer Tools section. Tap to mark a First Friday/Saturday as completed. Counter shows progress (e.g., "5 of 9 First Fridays"). Resets if a month is missed.

**Why it works:** These devotions are deeply embedded in Catholic practice but hard to track manually. The app already tracks confession dates and novena progress — this is the same pattern. Naturally flows across all 12 months. Links to the Find tab (find Mass for this Friday).

**Data:** No external data needed. localStorage tracking.
**Effort:** 3 hours (UI, tracking logic, reset logic, styling)

#### 8. Seasonal CCC Spotlight (IDEA-060)
**What:** A daily or weekly rotating CCC paragraph that's thematically tied to the current liturgical season. The app already has the full CCC (2,865 paragraphs) loaded. Curate ~20-30 paragraphs per season:
- **Lent:** CCC 1430-1439 (interior penance), 1450-1460 (confession), 538-540 (Jesus in the desert)
- **Easter:** CCC 638-658 (the Resurrection), 731-741 (the Holy Spirit)
- **Advent:** CCC 522-524 (preparation for Christ), 484-507 (Mary)
- **Christmas:** CCC 525-534 (the mysteries of Christ's infancy)
- **Ordinary Time:** Broader rotation through the whole Catechism

Displayed as a small card on the More tab: "Catechism for the Season" with the paragraph number, text, and a "Read more" link to the full CCC sheet.

**Data:** A curated index (~100-150 paragraph numbers mapped to seasons). The text already exists in catechism.json.
**Effort:** 2-3 hours (curation + render logic)

#### 9. Easter Season Alleluia Card (IDEA-061)
**What:** During the 50 days of Easter (Easter Sunday → Pentecost), surface a celebratory card on the More tab: "Alleluia! — The Easter season lasts 50 days. The Church's most joyful time." Optionally include:
- A countdown to Pentecost
- The Regina Caeli prayer (replaces the Angelus during Easter season) — short, beautiful, traditional
- A reminder that every Sunday is a "little Easter"

**Why it works:** After 40 days of Lenten solemnity, the app should *feel* different. The accent color already shifts to gold, but adding an explicit joyful card makes the seasonal shift tangible. The Regina Caeli is only 4 lines — trivial to add.

**Data:** Regina Caeli text (public domain, ~60 words) + date logic.
**Effort:** 1-1.5 hours

#### 10. Ember Days Awareness (IDEA-062)
**What:** Ember Days are four sets of three days (Wednesday, Friday, Saturday) occurring near the start of each season — traditionally days of fasting, prayer, and thanksgiving for the season. Most Catholics have never heard of them. A subtle card appears on or near Ember Days:
- "This week includes Ember Days — a traditional time of seasonal fasting and prayer"
- Brief explanation of the practice
- Link to the Examen or confession finder

**Why it works:** Recovers a forgotten Catholic tradition. Zero maintenance (dates can be computed from the liturgical calendar). Serves the "depth" users who want to go beyond the basics. Very low data footprint.

**Data:** Date computation logic (Ember Days follow specific rules relative to the seasons) + ~100 words of explanatory text.
**Effort:** 1.5-2 hours

---

### Tier 3 — Larger Effort, High Delight

#### 11. Seasonal Scripture Spotlight (IDEA-063)
**What:** A weekly rotating Scripture passage that captures the spiritual essence of the current season. Not the daily readings (which already exist) but a *thematic* passage that sets the mood:
- **Lent:** Isaiah 58 (true fasting), Joel 2:12-13 (return to me), Psalm 51 (Miserere)
- **Easter:** John 20 (Resurrection appearances), Acts 2 (Pentecost), Romans 6:9
- **Advent:** Isaiah 9:2 (people in darkness), Luke 1:46-55 (Magnificat), Isaiah 40:3 (prepare the way)
- **Christmas:** John 1:1-14 (the Word made flesh), Luke 2:1-20 (Nativity)
- **Ordinary Time:** Broader rotation through the Gospels and Psalms

Rendered in `--font-prayer` (Georgia) with the seasonal accent, displayed as a contemplative card. The Bible text already exists in the DRB/CPDV data — just needs a curated index.

**Data:** ~50-60 passage references mapped to liturgical weeks. Text pulled from existing Bible data at runtime.
**Effort:** 3-4 hours (passage curation + lazy-load from Bible data + styling)

#### 12. Marian Consecration Countdown (IDEA-064)
**What:** Total Consecration to Jesus through Mary (St. Louis de Montfort) is a 33-day preparation that traditionally starts on specific dates to culminate on a Marian feast day. Common start dates:
- Feb 20 → March 25 (Annunciation)
- Apr 10 → May 13 (Our Lady of Fatima)
- Jun 13 → Jul 16 (Our Lady of Mt. Carmel)
- Jul 20 → Aug 22 (Queenship of Mary)
- Nov 5 → Dec 8 (Immaculate Conception)

A countdown card appears ~1 week before each start date: "Marian Consecration preparation begins [date]. 33 days of prayer leading to [feast]." If the user opts in, a daily tracker (similar to novena tracker) marks progress.

**Why it works:** This is one of the most popular Catholic devotions, especially among younger adults. Multiple opportunities per year. Ties into the monthly devotion system (May/Aug/Dec are Marian months).

**Data:** Date logic + ~200 words of explanatory text. Daily prayer texts would be a larger effort (public domain but need sourcing/formatting).
**Effort:** 2-3 hours for awareness card + countdown; 6-8 hours if including daily prayer texts

#### 13. Pentecost Novena Countdown (IDEA-065)
**What:** The Novena to the Holy Spirit (already in the app's data!) is the *original* novena — the Apostles prayed for 9 days between Ascension and Pentecost. Auto-surface a prominent card starting on Ascension Thursday:
- "The original novena begins today. Join the Apostles in 9 days of prayer for the Holy Spirit."
- Direct link to start the Holy Spirit novena in the tracker
- Daily progress integrated with the existing novena system

**Data:** Already exists! Just needs date matching (Ascension = litcal key) and a promotional card.
**Effort:** 1.5 hours

#### 14. Divine Mercy Sunday Experience (IDEA-066)
**What:** The Second Sunday of Easter (Divine Mercy Sunday) is already in the litcal data. Surface a dedicated card:
- Brief explanation of the Divine Mercy devotion and the plenary indulgence conditions
- Direct link to start the Divine Mercy Chaplet (could link to devotions or a future chaplet module)
- Tie-in with the Divine Mercy Novena (starts Good Friday, ends Divine Mercy Sunday)
- CCC refs on God's mercy (CCC 1846-1848)

**Data:** ~200 words + CCC refs. Date from litcal.
**Effort:** 1.5 hours

---

## Recommendation

**Phase 1 — Build for this Lent/Easter cycle (now through Pentecost):**
Focus on items that are seasonally relevant *right now* (mid-Lent 2026) or for the upcoming Easter season:
1. **Holy Week Guide** (IDEA-056) — Holy Week starts April 1, 2026. High impact, ~2 hrs.
2. **Seasonal Novena Auto-Surfacing** (IDEA-055) — Divine Mercy novena starts Good Friday (April 3). 1.5 hrs.
3. **Easter Alleluia + Regina Caeli** (IDEA-061) — Easter season April 5 – May 24. 1 hr.
4. **Pentecost Novena Countdown** (IDEA-065) — Ascension May 15, Pentecost May 24. 1.5 hrs.
5. **Divine Mercy Sunday** (IDEA-066) — April 12. 1.5 hrs.

Total: ~7.5 hours for a complete Lent→Easter→Pentecost seasonal experience.

**Phase 2 — Build for Advent 2026 (Nov/Dec):**
1. **O Antiphons** (IDEA-054) — 1.5 hrs.
2. **Advent Wreath Devotion** (IDEA-058) — 3-4 hrs.

**Phase 3 — Year-round improvements (Ordinary Time):**
1. **Monthly Devotion Card** (IDEA-053) — 2-3 hrs. Works year-round.
2. **Liturgical Color Awareness** (IDEA-057) — 1 hr.
3. **First Friday/Saturday Tracker** (IDEA-059) — 3 hrs.
4. **Seasonal CCC Spotlight** (IDEA-060) — 2-3 hrs.

**Phase 4 — When time allows:**
1. **Seasonal Scripture Spotlight** (IDEA-063) — 3-4 hrs.
2. **Marian Consecration Countdown** (IDEA-064) — 2-8 hrs depending on scope.
3. **Ember Days** (IDEA-062) — 1.5 hrs.

---

## Design Principles for Seasonal Content

1. **Static data, no APIs.** Every seasonal feature should work from pre-built JSON or inline data. No new external dependencies.
2. **Automatic rotation.** Content appears and disappears based on the liturgical calendar without user action. The app should feel alive on its own.
3. **Gentle, not gamified.** No "Day X of 40" counters (per IDEA-022). No streaks. No challenges. The Church's calendar is the rhythm; the app just follows it.
4. **Georgia for sacred text.** All prayer texts, antiphons, and Scripture in `--font-prayer`. Seasonal accent for borders and highlights.
5. **Progressive disclosure.** Seasonal cards should be brief with expandable detail. Don't overwhelm the More tab.
6. **Dark mode parity.** Every seasonal element must look good in both themes.
7. **Link to action.** Seasonal cards should connect to existing tools: "Find confession near you" → Find tab, "Pray the Rosary" → Rosary tool, "Start this novena" → Novena tracker.
