# Pastoral Handoff → MassFinder Catholic Review

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Subject:** Five items from comprehensive pastoral audit requiring theological review
**Priority:** High — several items touch user-facing prayer content

---

## Context

I've completed a full pastoral audit of the app — every prayer text, examination question, devotional guide, and data file. The items below are things I've flagged not because they're doctrinally wrong (that's your call), but because they create pastoral friction when presented without a priest present to provide context. An app delivers content cold — no eye contact, no tone of voice, no follow-up question. That changes how even accurate content lands.

The five parishioner personas relevant here:
- **Kevin, 42** — Lapsed 15 years, just came back, self-conscious about not knowing the routine. He's the most fragile user of the Examination of Conscience.
- **Maria, 34** — Spanish-speaking, may not parse English theological vocabulary with full nuance.
- **Helen, 65** — Parish council president, will notice inconsistencies and have opinions.
- **Dorothy, 78** — Daily Mass, will take prayer texts at face value without theological context.
- **Paul, 19** — College student, culturally aware, may react to language he perceives as judgmental.

---

## Item 1: Examination of Conscience — Question #31 (Suicide)

**File:** `data/examination.json`, line 67
**Current text:** `"Have I contemplated or attempted suicide?"`
**CCC reference:** 2280-2283

**Pastoral concern:** This question is theologically warranted in a thorough examination. The concern is purely contextual. In a confessional, when someone mentions suicidal ideation, I can respond immediately with compassion, assess their wellbeing, and connect them with help. An app cannot do this. Someone who is currently struggling with suicidal thoughts and encounters this item — framed as a sin to confess — could experience it as condemnation rather than the mercy the sacrament is meant to offer.

**What I'm asking you to evaluate:**
- Should this question include a brief pastoral annotation? Something like: *"If you are struggling with thoughts of self-harm, please reach out for help. You are loved by God, and help is available."* With a resource link or number.
- Or should the question be reframed to distinguish between the grave matter (which the CCC addresses) and the reduced culpability that the CCC itself acknowledges in 2282 ("Grave psychological disturbances, anguish, or grave fear of hardship, suffering, or torture can diminish the responsibility of the one committing suicide")?
- The CCC is notably compassionate on this topic. The app's presentation should reflect that compassion, not just the prohibition.

**I am not asking you to remove this question.** I am asking whether the way it's presented serves the pastoral goal of drawing people toward confession or whether it risks causing harm to someone in crisis.

---

## Item 2: Examination of Conscience — Question #39 (Disordered Sexual Desires)

**File:** `data/examination.json`, line 79
**Current text:** `"Have I acted on disordered sexual desires?"`
**CCC reference:** 2357-2359

**Pastoral concern:** The CCC reference points to the section on homosexuality. The word "disordered" is technically precise per Church teaching (CCC 2357: "tradition has always declared that homosexual acts are intrinsically disordered"), but this term carries significant cultural weight that it did not carry when the CCC was published in 1992.

In the confessional, I would never use the word "disordered" without extensive pastoral context. The Church's teaching on this topic requires great care and sensitivity — the CCC itself says (2358): "They must be accepted with respect, compassion, and sensitivity. Every sign of unjust discrimination in their regard should be avoided."

In an app, the question "Have I acted on disordered sexual desires?" is presented without any of that pastoral context. Kevin, coming back to the Church after 15 years, reads this and may feel the Church is confirming his worst fears about what it means to walk back in.

**What I'm asking you to evaluate:**
- Does this question, as phrased, serve the pastoral goal of drawing people toward confession?
- Could it be rephrased to maintain theological accuracy while reducing the risk of alienation? For example, many published examinations use: "Have I been faithful to the Church's teaching on sexuality?" or "Have I engaged in sexual acts contrary to God's plan for human sexuality?"
- Or is the current phrasing the most accurate representation of the teaching and should stand as-is?

**This is your call, not mine.** My lane is "Does this help people get to confession?" and I want to flag that this phrasing may not.

---

## Item 3: Examination of Conscience — Question #66 (Voting)

**File:** `data/examination.json`, line 143
**Current text:** `"Have I voted for candidates or policies that conflict with Catholic moral teaching?"`
**CCC reference:** 2240

**Pastoral concern:** CCC 2240 addresses civic duty in general terms. The question as written is broad enough to cause two opposite problems:

1. **Scrupulosity:** A faithful Catholic who voted for any candidate (since no candidate aligns perfectly with Catholic teaching on every issue) may feel they've committed a sin they didn't commit. The USCCB's own guidance in *Forming Consciences for Faithful Citizenship* is significantly more nuanced than this question allows.

2. **Defensive rejection:** In the current political climate, this question reads to many people as the Church telling them how to vote. It triggers a defensive reaction that undermines the reflective posture the entire examination is trying to cultivate.

In my experience hearing confessions, no one confesses "I voted wrong" — they confess the underlying moral failures (indifference to the poor, disregard for human life, etc.) which are already covered by other questions in the examination.

**What I'm asking you to evaluate:**
- Does this question belong in a general examination of conscience, or is it better addressed through specific catechesis on faithful citizenship?
- If it stays, does it need a pastoral annotation about the complexity of prudential judgment in voting?
- My pastoral recommendation is removal, but I defer to your theological judgment.

---

## Item 4: Rosary Day-of-Week Mystery Assignments

**File:** `data/prayers.json`, `dayMysteries` object
**Current mapping:**
```json
{
  "sunday": "Joyful",
  "monday": "Joyful",
  "tuesday": "Sorrowful",
  "wednesday": "Glorious",
  "thursday": "Luminous",
  "friday": "Sorrowful",
  "saturday": "Joyful"
}
```

**Concern:** The standard assignments per St. John Paul II's *Rosarium Virginis Mariae* (2002) are:

| Day | JPII Assignment | App Assignment | Match? |
|-----|----------------|----------------|--------|
| Sunday | Glorious | Joyful | ❌ |
| Monday | Joyful | Joyful | ✅ |
| Tuesday | Sorrowful | Sorrowful | ✅ |
| Wednesday | Glorious | Glorious | ✅ |
| Thursday | Luminous | Luminous | ✅ |
| Friday | Sorrowful | Sorrowful | ✅ |
| Saturday | Joyful | Joyful | ✅ |

Sunday is the issue. JPII assigned the Glorious Mysteries to Sunday because Sunday is the day of the Resurrection — the first Glorious Mystery. The Joyful Mysteries on Sunday appear in some older prayer books (pre-Luminous Mysteries, when there were only three sets and each covered two days), but the JPII standard is what virtually all current Catholic resources follow.

**What I'm asking you to verify:**
- Confirm the correct JPII assignments and flag the Sunday mapping for correction.
- Also verify that the `SET_META` display in `rosary.js` (line 28: `Glorious: { desc: 'Wednesday & Sunday' }`) — wait, actually I see the code says `Wednesday & Sunday` for Glorious in the display, but the data maps Sunday to Joyful. So there's an inconsistency between the data and the UI description. One of them is wrong.

**If the JPII standard is confirmed:** → Hand off to Engineering for data correction.

---

## Item 5: Act of Contrition — Two Different Versions

**File 1:** `data/prayers.json` → `prayers.act_of_contrition`
**Text:** "Lord Jesus, Son of God, have mercy on me, a sinner." (short form, from the Rite of Penance)

**File 2:** `data/examination.json` → `prayers.act_of_contrition`
**Text:** "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, Who art all-good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen."

**Pastoral concern:** Both are valid Acts of Contrition. The short form appears in the Rite of Penance and is perfectly acceptable. The long form is what most Catholics over 40 learned and what most parishes teach in sacramental preparation.

The problem is that Kevin encounters the short form while praying the Rosary (it appears in the closing prayers) and the long form when preparing for confession. He doesn't know both are acceptable — he thinks he's learning "the prayer" and then discovers a different version when he needs it most (in the confessional line, looking at his phone).

**What I'm asking you to evaluate:**
- Which version should be the app's "primary" Act of Contrition?
- Should the Rosary module use the same version as the Examination module?
- My pastoral recommendation: use the traditional long form everywhere as the primary, with a note that the short form is also acceptable. The long form is what the priest will expect to hear in the confessional in most U.S. parishes, and Kevin needs to practice the one he'll actually use.

**If a decision is made:** → Hand off to Engineering for data alignment.

---

## How to Use This Document

Each item above is a question for your theological and pastoral judgment. I've given you my pastoral read — how these items land on real people in real pews. Your job is to evaluate whether the content is doctrinally sound, whether my concerns have theological merit, and what (if any) changes are warranted.

For items where you recommend a change, please produce a clear recommendation that Engineering can implement — specific text, specific file, specific location.

For items where you determine the current content is correct and should stand, please note that too, with your reasoning. I'll accept your judgment.

Thank you for this work. It matters.

— Fr. Mike, Pastoral Advisor
