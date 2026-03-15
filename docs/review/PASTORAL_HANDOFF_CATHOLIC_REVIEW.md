# Pastoral Handoff → Catholic Review

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** High — these items affect real people in vulnerable moments
**Action required:** Theological accuracy + pastoral appropriateness review on 5 items

---

## Context

I completed a comprehensive pastoral audit of the full MassFinder app and data. The items below are things I flagged not because they're *doctrinally wrong* (that's your call) but because they may be *pastorally harmful* in an app context — where there's no priest present to provide nuance, read body language, or offer reassurance.

The key difference between a printed examination of conscience and one on a phone: in a confessional, I can see someone's face. I can respond to pain with compassion in real time. An app presents content cold. These items need your review through that lens.

---

## ITEM 1: Examination of Conscience Q31 — Suicide

**File:** `data/examination.json`, question id 31
**Current text:** "Have I contemplated or attempted suicide?"
**CCC reference:** 2280-2283

**Pastoral concern:** This question is theologically present in any thorough examination. The issue is context. Someone who is actively struggling with suicidal thoughts — and who has come to this app in a moment of spiritual searching — may encounter this question without any pastoral framing. In a confessional, a priest would respond with immediate compassion and potentially connect the person with help. In an app, the question sits alone.

**Request:** Evaluate whether a brief pastoral note should accompany this item. Something like: "If you are struggling with thoughts of self-harm, please reach out for help. You are loved by God and by your community." This is not about softening doctrine — CCC 2283 already provides the pastoral nuance ("We should not despair of the eternal salvation of persons who have taken their own lives"). It's about surfacing that compassion in the moment it's needed.

**Who this serves:** Anyone in crisis who opens the app looking for spiritual help. These people exist. I've met them.

---

## ITEM 2: Examination of Conscience Q39 — "Disordered Sexual Desires"

**File:** `data/examination.json`, question id 39
**Current text:** "Have I acted on disordered sexual desires?"
**CCC reference:** 2357-2359

**Pastoral concern:** The CCC uses "objectively disordered" in reference to homosexual acts (2357). The term is technically precise in moral theology. However, in an app used by ordinary laypeople — many of whom are returning to the faith after years away — the word "disordered" lands as a judgment on their personhood rather than a theological categorization of acts.

Kevin, my returning-Catholic persona, reads this and hears: "The Church thinks I'm broken." That's not what the CCC teaches (2358 explicitly calls for respect, compassion, and sensitivity), but that's how it reads without context.

**Request:** Evaluate whether alternative phrasing could maintain doctrinal fidelity while reducing the risk of driving vulnerable people away. Some possibilities:
- "Have I engaged in sexual activity contrary to Church teaching?"
- "Have I acted against the virtue of chastity in ways contrary to God's plan for sexuality?"

Or determine that the current phrasing is necessary and should stand. This is your call — I'm flagging the pastoral risk, not prescribing the solution.

**Who this serves:** Returning Catholics, young adults, anyone with same-sex attraction who is trying to live faithfully.

---

## ITEM 3: Examination of Conscience Q66 — Voting

**File:** `data/examination.json`, question id 66 (in the Precepts section)
**Current text:** "Have I voted for candidates or policies that conflict with Catholic moral teaching?"
**CCC reference:** 2240

**Pastoral concern:** In the current American political climate, this question creates more confusion than clarity. CCC 2240 addresses civic responsibility broadly; the USCCB's "Faithful Citizenship" document acknowledges the complexity of applying moral principles to specific candidates and policies. No candidate perfectly aligns with Catholic teaching, and reasonable Catholics can disagree on prudential judgments.

In my experience, this question either:
- Causes scrupulosity in conscientious people who agonize over imperfect choices
- Provokes political defensiveness that shuts down the entire examination
- Gets weaponized in parish arguments ("Father said we can't vote for X")

None of these outcomes serves the purpose of preparing for confession.

**Request:** Evaluate whether this item should be removed from the examination. The civic responsibility of Catholics is real and important, but an examination of conscience may not be the right venue for it — especially without a confessor present to discuss the nuance. If you determine it should stay, consider whether clarifying language is needed.

**Who this serves:** Everyone who uses the examination. This is a universal friction point.

---

## ITEM 4: Rosary Day-of-Week Mystery Assignment

**File:** `data/prayers.json`, key `dayMysteries`
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

**Concern:** The standard assignment per *Rosarium Virginis Mariae* (John Paul II, 2002) is:
- **Sunday:** Glorious (during Ordinary Time) / varies by season
- **Monday:** Joyful
- **Tuesday:** Sorrowful
- **Wednesday:** Glorious
- **Thursday:** Luminous
- **Friday:** Sorrowful
- **Saturday:** Joyful

The current mapping assigns **Joyful** to Sunday. The standard is **Glorious** for Sunday (the day of the Resurrection → Glorious mysteries).

**Request:** Verify the correct assignment per JPII and the standard practice. If Sunday should be Glorious, correct the data. This affects the auto-selection when someone opens the Rosary module — they should see the right mysteries for the day.

**Who this serves:** Dorothy, who prays the Rosary daily and will notice immediately if the wrong mysteries are suggested on Sunday.

---

## ITEM 5: Act of Contrition — Two Different Versions

**File 1:** `data/examination.json` → `prayers.act_of_contrition`
**Text:** "O my God, I am heartily sorry for having offended Thee, and I detest all my sins because of Thy just punishments, but most of all because they offend Thee, my God, Who art all-good and deserving of all my love. I firmly resolve, with the help of Thy grace, to sin no more and to avoid the near occasions of sin. Amen."

**File 2:** `data/prayers.json` → `prayers.act_of_contrition`
**Text:** "Lord Jesus, Son of God, have mercy on me, a sinner. (from the Rite of Penance)"

**Concern:** The examination module uses the traditional long-form Act of Contrition. The prayers.json file (used by the Rosary closing and potentially other modules) uses the very short form from the Rite of Penance. Both are valid. But if Kevin learns one version in the Rosary tool and then encounters a completely different version in the Examination, he may be confused — he's already anxious about not knowing the "right" prayers.

**Request:** Recommend which version should be primary across the app, or whether both should appear with context. Most parishes in our diocese teach the traditional long form. The short form is what the priest offers as an alternative in the confessional when someone doesn't know the long form.

**Who this serves:** Kevin and anyone relearning the prayers.

---

## Notes for Catholic Review

- I am NOT asking you to soften Church teaching. I'm asking you to evaluate whether the *presentation* in an app context serves the pastoral goal of drawing people toward Christ.
- Every item above involves content that is doctrinally defensible. The question is whether it's pastorally effective when delivered without a human minister present.
- For any item you determine should change, hand the revised content to Engineering for implementation.
- For any item you determine should stand as-is, document your reasoning so we can reference it if questions arise.
