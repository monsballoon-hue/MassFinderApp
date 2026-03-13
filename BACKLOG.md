# MassFinder — Backlog

## Structured catalog of all ideas, bugs, enhancements, and observations

> This file is the single source of truth for all work items. Claude.ai Inbox adds new entries on main. Claude Code marks items done on working branches. Status updates merge to main via PR.

**Last updated:** 2026-03-13
**ID sequence:** IDEA-010 →
**Total items:** 9

---


## IDEA-001 — PWA refresh banner: no feedback on click and poor styling
**Category:** bug
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-05

The "App updated — Refresh" banner that appears above the bottom nav bar provides no visual feedback when tapped (no spinner, no confirmation). Users can't tell if it worked. The banner itself is also visually heavy and unattractive. Explore better patterns for injecting PWA update prompts — possibly a more subtle toast or inline notification that auto-dismisses after refresh completes.

## IDEA-002 — Liturgical day teaser card needs design uplift
**Category:** refinement
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-01

The liturgical day teaser on the Find tab (e.g. "Friday of the 3rd Week of Lent · Day 23 of 45 · Lent · Abstinence from meat today") is heavy on function and low on form. It needs a design pass to make it more visually appealing and less utilitarian while preserving the same information density.

## IDEA-003 — Day of Abstinence banner: ugly, uses emoji, not dismissible
**Category:** bug
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-002
**Spec ref:** BT1-02

The "Day of Abstinence" banner on the home screen uses an emoji icon (purple cross emoji) instead of an SVG, which violates the app's icon standard. The purple card styling is visually rough. The banner is also not dismissible — devout users who already know it's a day of abstinence should be able to close it. Should be a simple, dismissible reminder with a proper SVG icon.

## IDEA-004 — Today's Readings: Gospel color indicator inconsistent and design is drab
**Category:** bug
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-005
**Spec ref:** BT1-03

In the Today's Readings section, the Gospel item has a colored left-border indicator, but the style changes between the collapsed view (sharp corners) and the expanded/toggled view (rounded corners). The visual treatment for distinguishing the Gospel from other readings needs a more intentional design approach. Additionally, the overall presentation of the three readings (First Reading, Responsorial Psalm, Gospel) is drab — the relationship between the header label (e.g. "First Reading") and the scripture reference display name (e.g. "Hosea 14:2-10") could be improved.

## IDEA-005 — Responsorial Psalm renders incorrectly ~50% of the time
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-004
**Spec ref:** (none)

The Responsorial Psalm text does not render in the proper liturgical format on roughly half of all renders. This may be related to the Bible API dependency. Investigate whether the psalm text and formatting can be handled locally (bundled or cached) to avoid the inconsistent rendering caused by external API calls.

## IDEA-006 — Bible verses in Prayer Tools and CCC in Examen fail to render
**Category:** bug
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-005
**Spec ref:** BT1-04

Bible verse references in the Prayer Tools (e.g. the Rosary scripture links like Luke 22:39-46) and Catechism (CCC) references in the Examen flash briefly on screen and then disappear. This is a glitchy rendering bug — the content appears to load momentarily and then collapses or is removed. Affects the Rosary decade view and the Examen tool.

## IDEA-007 — Events data cleanup: parse messy event titles into proper metadata fields
**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** (none)

Many entries in events.json have messy data where entire event details (times, descriptions, celebrant names) are crammed into the title field. For example, a Lenten Retreat entry has "5pm Confession, 6pm Mass, reflection until 8pm. Fr. Paul with Deacon..." all in the title. Need to parse through all events and strategically extract metadata (times, descriptions, celebrants, sub-events) into their proper fields, then reinject the cleaned data back into events.json.

## IDEA-008 — Map tab: bottom nav gap glitch and lack of standalone functionality
**Category:** bug
**Status:** specced
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-06

The Map tab has a persistent visual glitch where there is a gap between the map content and the bottom navigation bar. This has been present since launch. Additionally, the Map tab only shows filter chips when navigated to from the Find tab — when accessed directly via the bottom nav, it lacks filtering. Explore adding more standalone functionality to the Map tab (e.g. filters, search, layer toggles) without overwhelming users.

## IDEA-009 — Find tab: nearby church prioritization logic may be missing or overwritten
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

Previously built logic to prioritize the nearest churches on the Find tab so that during peak times (e.g. 8:30 AM with 30+ live events) users aren't inundated with a long unsorted list. This prioritization appears to no longer be working — need to investigate whether the feature was lost during a recent update or overwritten by another change. The current "By distance" sort may not be applying the expected proximity-first filtering.
