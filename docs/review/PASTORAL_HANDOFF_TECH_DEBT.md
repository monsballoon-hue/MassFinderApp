# Pastoral Handoff → Tech Debt & Data

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** Medium — data quality issues affecting prayer content
**Action required:** Fix 2 data errors in `data/prayers.json`

---

## Context

During my full pastoral audit, I read through all prayer content line by line the way a parishioner would encounter it. I found two data quality issues that will be visible to users during prayer. Both are in `data/prayers.json`.

These matter because prayer content is the one place where errors are most jarring. Someone praying the Rosary or the Stations is in a contemplative state. A typo or formatting glitch breaks that state. Dorothy (78, daily Mass attendee) will notice, and Helen (parish council president) will email me about it.

---

## ISSUE 1: Typo in Joyful Mysteries — "amoung"

**File:** `data/prayers.json`
**Location:** `mysteries.Joyful[1].meditation` (The Visitation, mystery #2)
**Current text:**
```
"Elizabeth greets Mary: "Blessed art Thou amoung women and blessed is the fruit of thy womb""
```
**Should be:**
```
"Elizabeth greets Mary: "Blessed art Thou among women and blessed is the fruit of thy womb""
```

**Fix:** Single character deletion — remove the extra "u" in "amoung" → "among"

**Impact:** This text is displayed on every Joyful Mystery Rosary session during the second decade. It's visible to every user who prays the Rosary on Monday, Saturday, or (currently) Sunday.

---

## ISSUE 2: Stray Line Break in Stations of the Cross — Station 3

**File:** `data/prayers.json`
**Location:** `stations[2].meditation` (Station 3: Jesus Falls the First Time)
**Current text contains:**
```
"He was in so\r\n\r\nmuch pain He could barely walk"
```
**Should be:**
```
"He was in so much pain He could barely walk"
```

**Fix:** Remove the `\r\n\r\n` between "so" and "much" — replace with a single space.

**Impact:** This will render as a broken sentence with a blank line in the middle during the Stations of the Cross. During Lent especially, this is a heavily-used prayer tool. The formatting break disrupts the meditation at a moment of deep devotion.

---

## Additional Note

While reviewing the prayers data broadly, I noticed inconsistent line ending styles — some prayers use `\r\n` (Windows-style), others use `\n` (Unix-style). This doesn't affect rendering in most cases but the Station 3 issue suggests there may be copy-paste artifacts elsewhere. A sweep of the file for stray `\r\n` sequences within sentences (not between stanzas/paragraphs, where they're intentional) would be worthwhile.

---

## Who This Serves

Dorothy prays the Rosary daily. She prays the Stations every Friday in Lent. These are the two prayer tools she'd use most. Both have visible errors in the content she'd see.
