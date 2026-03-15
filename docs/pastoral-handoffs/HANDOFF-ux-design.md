# Pastoral Handoff → MassFinder UX & Design

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Subject:** Two UX recommendations from pastoral audit — confession pathway for returning Catholics and elderly usability
**Priority:** High for Item 1 (serves the most vulnerable users), Medium for Item 2

---

## Context

These recommendations come from evaluating the app through the eyes of specific parishioners I know — real people whose struggles and limitations I encounter every week. I don't make design decisions or write CSS. What I do is tell you *who* this serves and *why* it matters, and then you figure out *how*.

---

## Item 1: "First Time in a While?" — Surfacing the Confession Guide for Returning Catholics

### Who this serves: Kevin

Kevin is 42. He was Catholic growing up, drifted away in his twenties, and his wife recently dragged him back. He went to Mass for the first time in 15 years last month. He's thinking about going to confession but he's terrified. Last week he googled "how to go to confession Catholic" on his phone in the parking lot before Mass.

Kevin is never going to browse the More tab, find the Faith Guides section, and tap "How to go to Confession." He doesn't know the app has that content. He's going to tap the Confession filter on the Find tab because he wants to know *when* confession is available near him. That's his entry point.

### What I'm asking for

When someone taps the **Confession** chip filter on the Find tab, and the results appear showing nearby confession times — that is the moment of maximum pastoral opportunity. Kevin is looking at confession times. He's considering going. He is one small friction away from giving up.

At that moment, somewhere near the top of the confession-filtered results (not blocking them, not modal, not aggressive), surface a gentle link to the "How to go to Confession" guide. Something like:

> *"Been a while? Here's what to expect →"*

Or:

> *"Not sure what to do? A simple guide to confession →"*

The link opens the existing "How to go to Confession" Faith Guide content, which is already warm and excellent ("If you've been away for a long time, a gentle priest will be happy to help you through it. If you're nervous, that's normal. The confessional is one of the most merciful places in the world.").

### What NOT to do

- Don't make it a popup or modal. Kevin doesn't want to be lectured. He wants a quiet option he can tap if he needs it.
- Don't show it every single time. If Kevin has already seen it or dismissed it, respect that. A session-scoped or one-time-show flag is fine.
- Don't make it look like an ad or a CTA. It should feel like a hand on the shoulder, not a call to action.
- Don't put it below the results. Kevin may not scroll. It needs to be near the top, before the first confession listing.

### Why this matters

"I couldn't find when confession was, so I just... didn't go." I've heard this from real people. But the deeper version is: "I found the time but I didn't know what to do when I got there, and I was too embarrassed to ask, so I just sat in the car and drove home." The confession guide exists. It's good. It just needs to be *where Kevin is looking* at the moment he needs it.

### Related backlog

The Confession chip nudge on Saturdays and during Lent (FT-20) already exists and is a great precedent. This is the same pastoral instinct — meet people in their moment of decision — applied to content rather than timing.

---

## Item 2: Elderly Usability Testing — Dorothy's Experience

### Who this serves: Dorothy

Dorothy is 78. She comes to daily Mass. Her grandson set up her iPhone and installed the app for her. She can barely read small text. She has mild arthritis that makes precise tapping difficult. She will use this app if someone shows her how, but she will never figure out anything unintuitive. If she taps something and it doesn't do what she expected, she hands the phone back to her grandson and says "it doesn't work."

Dorothy is the most important user because she represents the largest demographic in most Catholic parishes — elderly parishioners who have the deepest faith commitment but the least technological fluency.

### What I'm asking for

A usability evaluation of the prayer tools (Rosary, Stations, Examination of Conscience, Chaplet, Novena) specifically through Dorothy's lens:

**Navigation clarity:**
- Can Dorothy always see how to go back or close a prayer tool?
- If she accidentally swipes and advances past where she was in the Rosary, can she get back?
- Is the close button (X) large enough for arthritic fingers?
- Does the back button in the reader overlay header make its function obvious?

**Text size:**
- When the Large text size is selected in Settings, does the prayer text in all modules actually become large enough for someone with age-related vision changes?
- The text size setting exists (I saw small/default/large in settings.js). Has anyone tested whether "large" is actually large enough for a 78-year-old?

**Touch targets:**
- The bead-by-bead Rosary interaction (tapping to advance through Hail Marys) — are the tap targets large enough?
- The Examination of Conscience checkboxes (tapping to mark items for your confession summary) — are they large enough and spaced far enough apart that Dorothy won't accidentally tap the wrong one?
- The CCC reference pills — the backlog already fixed the issue where tapping a pill toggled the parent checkbox (IDEA-021). Good. But are the pills themselves large enough to tap reliably?

**Cognitive load:**
- The Rosary module has multiple screens (select, opening, decade, closing). Is the flow intuitive enough that Dorothy can follow it without instruction?
- The Examination module uses Previous/Next pagination through commandment sections. Is this clearer than infinite scroll? (I believe yes, but test it.)

### What I'm NOT asking for

I'm not asking you to redesign anything for elderly users specifically. The app should work for Paul (19) and Dorothy (78) with the same interface. I'm asking for an honest assessment of whether the current interface *does* work for both, and if there are specific pain points for elderly users, to flag them.

### Suggested approach

If you have access to anyone over 70 who uses an iPhone, hand them the phone with the Rosary open and ask them to pray one decade. Watch where they hesitate, where they tap wrong, where they look confused. That 5-minute observation will tell you more than any spec document.

---

## Design Direction Notes

Both of these items share a principle: **the app should meet people where they are, not where we wish they were.**

Kevin doesn't know the app has a confession guide. Don't expect him to find it. Bring it to him.

Dorothy doesn't know she can change the text size. Don't expect her to find the setting. Make sure the default works for her, or make the setting unmissable.

The best Catholic design I've ever seen is in the architecture of old churches. The doors are wide. The nave draws your eye forward. The light comes from above. Nothing is hidden. Nothing requires instructions. You walk in and you know where to go.

That's what this app should feel like.

— Fr. Mike, Pastoral Advisor
