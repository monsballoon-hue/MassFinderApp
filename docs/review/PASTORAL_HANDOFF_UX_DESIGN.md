# Pastoral Handoff → UX & Design

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** High — these directly affect whether vulnerable users complete critical journeys
**Action required:** Evaluate 2 UX recommendations, both grounded in specific user personas

---

## Context

My pastoral audit surfaced two UX concerns that I can describe from the parish side but can't solve with design language. Both center on the same truth: the people who need this app most are the ones most likely to abandon it if the experience creates friction at the wrong moment.

---

## ITEM 1: Kevin's Confession Journey — Surface the Guide Earlier

**The persona:** Kevin, 42. Lapsed for 15 years, just came back because his wife insisted. Self-conscious about not knowing the routine. Googled "how to go to confession Catholic" last week. He needs this app more than anyone but would never ask for help.

**The current state:** The "How to Go to Confession" guide lives in the Faith Guides section on the More tab. It's well-written — warm, non-judgmental, with clear steps. The content is exactly right.

**The problem:** Kevin's most likely entry point is the **Confession filter chip** on the Find tab. He taps "Confession," sees a list of churches with times, and now he's looking at a screen that assumes he knows what to do when he gets there. He doesn't. The guide that would help him is two tabs away, buried in a section he'd never think to look in.

**The pastoral scenario I've actually witnessed:** A man tells me after Mass, "I wanted to go to confession, but I couldn't remember how it works, so I just... didn't go." This is the moment we're designing for. Kevin found the *time*. He found the *place*. But he didn't have the *confidence*. The guide would have given him that confidence, but it wasn't where he was looking.

**My recommendation (in pastoral terms, not design terms):** When someone is looking at confession listings — either through the Confession filter or on a church detail card — there should be a gentle, non-intrusive pathway to the confession guide. Not a popup. Not a requirement. Something that says, in effect: "First time in a while? Here's what to expect." Kevin would tap that. A lifelong Catholic would ignore it. Both are fine.

**What I'm NOT prescribing:** I don't know if this should be a link, a card, a banner, an expandable section, or something else. That's your expertise. I just know that the confession guide needs to be discoverable at the moment someone is looking at confession times, not only when they're browsing Faith Guides.

**Success metric (pastoral):** Kevin finds confession times, feels prepared, and actually goes. He doesn't have to navigate to a different tab or know that "Faith Guides" exists.

---

## ITEM 2: Dorothy's Usability — Prayer Tool Navigation Testing

**The persona:** Dorothy, 78. Daily Mass. Her grandson set up her iPhone. She can barely read small text. She'd use this app if someone showed her how, but she will NEVER figure out anything unintuitive. If she taps something and it doesn't do what she expected, she'll hand the phone back to her grandson and say "it doesn't work." She is the most important user.

**The current state:** The prayer tools (Rosary, Stations, Examination of Conscience, Divine Mercy Chaplet, Novenas) all use the reader overlay system. They have a close button (X) in the top right and a back button (←) in the top left. The Rosary and Stations use swipe gestures for navigation. The Examination uses Previous/Next buttons in a footer.

**The concern:** I haven't been able to observe Dorothy using this app, and neither has anyone else. The prayer tools involve multi-screen flows with different navigation patterns. Specific things I worry about:

1. **Swipe vs. tap confusion:** The Rosary uses swipe gestures to advance beads/decades, but also has tappable areas. If Dorothy accidentally swipes when she meant to tap (or vice versa), she may end up on a screen she doesn't recognize with no obvious way back. The swipe hint helps, but it's shown once and then hidden after the first interaction.

2. **Reader overlay "feels like a different app":** The prayer tools open in a full-screen overlay that replaces the normal tab navigation. Dorothy's mental model is: tabs at the bottom = how I move around. When those tabs disappear inside the reader, she may feel lost. The close button (X) returns her to where she was, but she has to *know* that.

3. **Text size in prayer tools:** Settings offers small/default/large text. In the prayer tools specifically, where Dorothy would be reading along with prayer text at arm's length, I want to make sure the "large" setting is genuinely large enough. "Large" on a settings panel and "large enough for a 78-year-old to read the Hail Mary during the Rosary" may be two different things.

**My recommendation (in pastoral terms):** This needs real-world testing with someone like Dorothy. Not a formal usability study — just hand the phone to someone's grandmother and ask her to pray a decade of the Rosary. Watch where she gets stuck. Watch what she taps. Watch her face when something unexpected happens. That 10-minute observation will reveal more than any spec.

**If real-world testing isn't possible right now**, evaluate the prayer tool navigation with these Dorothy-specific questions:
- If she accidentally swipes past where she meant to be, can she get back without frustration?
- Is the close button (X) large enough and obvious enough for someone who's never used an overlay pattern?
- At the "large" text size setting, is prayer text readable at arm's length on a standard iPhone screen?
- When the reader overlay opens and the bottom tabs disappear, is there any cue that tells her "you're still in MassFinder, just in a different view"?

**What I'm NOT prescribing:** I don't know the right solutions for any of these. Maybe the navigation is already fine and Dorothy would handle it. Maybe it needs bigger buttons, persistent back arrows, or a "tap anywhere to advance" mode. That's your call after evaluation.

**Success metric (pastoral):** Dorothy opens the Rosary, prays all five decades, and closes the tool — without handing the phone to her grandson.

---

## Shared Design Principle

Both of these items reflect the same truth about our users: the people who most need this app are the ones least equipped to figure out unintuitive interfaces. Kevin doesn't know Catholic vocabulary. Dorothy doesn't know app patterns. Neither of them will ask for help. The design has to anticipate their needs and meet them silently.

The best parish experiences work the same way — the usher who hands you a hymnal open to the right page, the sign outside the confessional that says what to expect. Nobody has to ask. The help is just *there*.
