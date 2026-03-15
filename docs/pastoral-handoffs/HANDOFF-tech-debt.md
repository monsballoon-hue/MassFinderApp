# Pastoral Handoff → MassFinder Tech Debt & Data

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Subject:** Data quality issues found during pastoral audit
**Priority:** Medium — these are accuracy issues in prayer content people will read during devotion

---

## Context

During a comprehensive audit of all prayer data, examination content, and devotional text, I found two data quality issues. Both are in `data/prayers.json`, which is the source file for the Rosary, Stations of the Cross, Divine Mercy Chaplet, and Novena modules.

These aren't cosmetic. Prayer texts are read slowly, reverently, often aloud. A typo or formatting glitch in a prayer is like a typo in the hymnal — it breaks the moment. Dorothy (78, daily Mass) will notice. Helen (65, parish council president) will definitely notice and will tell me about it.

---

## Item 1: Typo in Rosary — Joyful Mysteries, The Visitation

**File:** `data/prayers.json`
**Location:** `mysteries.Joyful[1].meditation`
**Current text:** `"Elizabeth greets Mary: "Blessed art Thou amoung women and blessed is the fruit of thy womb""`
**Issue:** "amoung" should be "among"
**Severity:** Low but embarrassing — this is a direct quote from Luke 1:42 (Douay-Rheims). Getting Scripture wrong in a prayer app is not a good look.

**Fix:** Replace `amoung` with `among` in the meditation string.

---

## Item 2: Stray Line Break in Stations of the Cross — Station 3

**File:** `data/prayers.json`
**Location:** `stations[2].meditation` (Station 3, "Jesus Falls the First Time")
**Current text contains:** `"He was in so\r\n\r\nmuch pain He could barely walk"`
**Issue:** There's a `\r\n\r\n` (carriage return + double newline) in the middle of a sentence, between "so" and "much." This would render as a paragraph break in the middle of a thought.
**Expected:** `"He was in so much pain He could barely walk"`

**Fix:** Remove the `\r\n\r\n` between "so" and "much" so the sentence reads continuously.

**Note:** You may want to scan the entire `stations` array and `prayers` object for other stray `\r\n` artifacts. I noticed that some prayer texts use `\r\n` (Windows-style line breaks) while others use `\n` (Unix-style). A normalization pass might be warranted to prevent rendering inconsistencies across platforms.

---

## Item 3 (Conditional): Rosary Sunday Mystery Assignment

**Pending Catholic Review decision.** I've flagged to Catholic Review that the `dayMysteries.sunday` value is set to `"Joyful"` when the standard JPII assignment is Glorious. If Catholic Review confirms the correction, this is a one-line data change:

**File:** `data/prayers.json`
**Location:** `dayMysteries.sunday`
**Current:** `"Joyful"`
**Corrected:** `"Glorious"`

Additionally, check `src/rosary.js` line 28 — `SET_META` shows `Glorious: { desc: 'Wednesday & Sunday' }`, which contradicts the current data mapping. One of these is wrong. Catholic Review will confirm which.

---

## Item 4 (Conditional): Act of Contrition Alignment

**Pending Catholic Review decision.** There are two different Acts of Contrition in the app:

- **`data/prayers.json` → `prayers.act_of_contrition`**: Short form from Rite of Penance ("Lord Jesus, Son of God, have mercy on me, a sinner.")
- **`data/examination.json` → `prayers.act_of_contrition`**: Traditional long form ("O my God, I am heartily sorry for having offended Thee...")

Catholic Review will recommend which should be primary. Once decided, align both files to use the same version (or explicitly label them as "Traditional Form" and "Short Form" so users understand both are valid).

---

That's all from me on data quality. The prayer content is otherwise solid — the novena texts, the Stations meditations, the Chaplet structure are all complete and well-crafted.

— Fr. Mike, Pastoral Advisor
