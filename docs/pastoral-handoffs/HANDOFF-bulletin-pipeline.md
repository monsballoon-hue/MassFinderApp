# Pastoral Handoff → MassFinder Bulletin Pipeline

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Subject:** Confession time accuracy is the #1 pastoral priority for data freshness
**Priority:** Critical — ongoing

---

## Context

I've completed a full pastoral audit of the app. The data coverage is impressive — 93 parishes, 1,691 services, 245 confession listings. The validation checklist is thorough and the issue registry shows real rigor in catching data problems.

This handoff is not about a specific bug. It's about an ongoing pastoral priority that should inform how the Bulletin Pipeline prioritizes its work.

---

## The Principle

**Wrong confession times cause more spiritual harm than any other data error in this app.**

Here's why: the person looking up confession times is almost always one of these three people:

1. **Someone returning to the faith after years away.** Kevin hasn't been to confession in 15 years. His wife convinced him to go. He looked it up on the app. He drove to St. Mary's. The door was locked because confession moved to a different time two months ago. Kevin drove home. He has not gone back. *I have heard this story from real people.* It haunts me.

2. **Someone in a state of serious sin who is trying to get right with God.** This person is in pain. They've made the decision to confess — which may have taken them weeks of agonizing. The act of driving to a church for confession is an enormous act of courage. Arriving to find the wrong information is not just inconvenient — it can feel like God Himself closed the door. That's not true, but it's how it feels.

3. **A traveler or visitor.** They're in a town they don't know, it's Saturday afternoon, they want to find confession before Sunday Mass. If the app gives them the right place at the right time, they receive the sacrament. If it doesn't, they don't. There is no second chance for this interaction.

For all three of these people, **wrong information is worse than no information.** If the app says "Call for times" or "By appointment," that's honest and useful. If the app says "Saturdays 3:00-4:00 PM" and it's actually 3:30-4:30 PM now, or Saturdays only during Lent, or moved to a different church because of priest shortages — that's a broken promise.

---

## What I'm Asking

### 1. Prioritize confession time verification over other service types

When validating parish data from bulletins, if you have limited time, check confession times first. A wrong daily Mass time is an inconvenience. A wrong confession time is a pastoral failure.

### 2. Be especially vigilant about seasonal confession changes

During Lent, many parishes add extra confession times. After Easter, they revert. This transition — from Lenten to regular schedule — is the highest-risk moment for data staleness. The app may show Lenten confession hours well into Ordinary Time if the data isn't updated promptly.

Similarly, some parishes reduce confession availability during summer or when priests are on vacation. "By appointment" is the correct listing when regular hours are suspended.

### 3. Flag "soft" confession times explicitly

Many parishes list confession as "Before Mass" or "After the 8 AM Mass" or "During Holy Hour." The bulletin terminology doc already addresses these (estimate time, add note). This is exactly right. But the note is critical — without it, someone sees "8:45 AM" on a Saturday and doesn't understand that this is an estimate based on Mass ending, and the priest might still be doing purification and thanksgiving.

The best format for these cases:
- **Time:** Estimated start (e.g., 8:45)
- **Note:** "After 8:00 AM Mass" or "During Holy Hour (3:00-4:00 PM)"
- **End time:** Estimated or noted as approximate

### 4. Watch for parishes with no confession times at all

I see 93 parishes and 245 confession listings. That's about 2.6 confession entries per parish, which probably means some parishes have multiple time slots and some have none listed. A parish with no confession times in the app isn't necessarily a parish without confession — it may just mean the bulletin doesn't print a regular time, or confession is "by appointment only."

For parishes with zero confession entries, if the bulletin says "By appointment" or "Contact the rectory," add a confession entry with no time and a note like "By appointment — call rectory." This is more useful than silence. A person searching for confession near them should see that the parish *offers* confession even if there's no standing time.

---

## The Standard

Before I recommend this app to my parishioners — before I mention it from the pulpit, before I tell Kevin about it — I need to trust that the confession times are accurate. Not perfect (schedules change), but accurate as of the most recent bulletin check, with honest notes where times are approximate or by-appointment.

I'd rather the app show "Confession: By appointment — (413) 555-1234" for every single parish than show even one specific time that turns out to be wrong when someone arrives.

That's the standard. Accurate above all. Honest always.

---

## Related

- **Validation checklist** (docs/review/validation-checklist.md) — Section 4 (Completeness) and Section 10 (Common Gotchas) both address confession data. The checklist is good. This handoff is about *prioritizing* confession accuracy within the existing framework.
- **HANDOFF-inbox.md** — I've also recommended a "Report an issue" mechanism on church detail cards, which would create a user-driven feedback loop for data freshness. If Helen sees a wrong confession time, she should be able to flag it.

— Fr. Mike, Pastoral Advisor
