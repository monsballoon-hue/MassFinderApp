# MassFinder — Backlog

## Structured catalog of all ideas, bugs, enhancements, and observations

> This file is the single source of truth for all work items. Claude.ai Inbox adds new entries on main. Claude Code marks items done on working branches. Status updates merge to main via PR.

**Last updated:** 2026-03-13
**ID sequence:** IDEA-022 →
**Total items:** 21

---


## IDEA-001 — PWA refresh banner: no feedback on click and poor styling
**Category:** bug
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-05
**Implemented:** 2026-03-13 via BT1-05 — added spinner feedback, disabled state, 30s auto-dismiss, and touch target improvements to the PWA update banner

The "App updated — Refresh" banner that appears above the bottom nav bar provides no visual feedback when tapped (no spinner, no confirmation). Users can't tell if it worked. The banner itself is also visually heavy and unattractive. Explore better patterns for injecting PWA update prompts — possibly a more subtle toast or inline notification that auto-dismisses after refresh completes.

## IDEA-002 — Liturgical day teaser card needs design uplift
**Category:** refinement
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-01
**Implemented:** 2026-03-13 via BT1-01 — replaced dot with 28×28 color icon, added seasonal gradient background, promoted typography to Playfair Display, replaced Unicode arrow with SVG chevron

The liturgical day teaser on the Find tab (e.g. "Friday of the 3rd Week of Lent · Day 23 of 45 · Lent · Abstinence from meat today") is heavy on function and low on form. It needs a design pass to make it more visually appealing and less utilitarian while preserving the same information density.

## IDEA-003 — Day of Abstinence banner: ugly, uses emoji, not dismissible
**Category:** bug
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-002
**Spec ref:** BT1-02
**Implemented:** 2026-03-13 via BT1-02 — replaced emoji with SVG (then removed icon entirely per user review), replaced hardcoded purples with seasonal accent tokens, added session-scoped dismiss button

The "Day of Abstinence" banner on the home screen uses an emoji icon (purple cross emoji) instead of an SVG, which violates the app's icon standard. The purple card styling is visually rough. The banner is also not dismissible — devout users who already know it's a day of abstinence should be able to close it. Should be a simple, dismissible reminder with a proper SVG icon.

## IDEA-004 — Today's Readings: Gospel color indicator inconsistent and design is drab
**Category:** bug
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-005
**Spec ref:** BT1-03
**Implemented:** 2026-03-13 via BT1-03 — gospel hover border-radius fix (right-only), heading demoted to uppercase label, ref promoted to display font and larger size, border-bottom dividers replaced with margin spacing

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
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-005
**Spec ref:** BT1-04
**Implemented:** 2026-03-13 via BT1-04 — DOM guard, wider click exclusions (exam/rosary/stations/devotions), proactive dismissSnippet before innerHTML replacements, 100→500ms delay; also fixed Faith Guides via .devot-card exclusion

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
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** (none)
**Spec ref:** BT1-06
**Implemented:** 2026-03-13 via BT1-06a + BT1-06b — body.map-active class removes extra padding-bottom when on map tab; chip bar (All/Today/Confession/Adoration) added as overlay with filter delegation and pill coexistence

The Map tab has a persistent visual glitch where there is a gap between the map content and the bottom navigation bar. This has been present since launch. Additionally, the Map tab only shows filter chips when navigated to from the Find tab — when accessed directly via the bottom nav, it lacks filtering. Explore adding more standalone functionality to the Map tab (e.g. filters, search, layer toggles) without overwhelming users.

## IDEA-009 — Find tab: nearby church prioritization logic may be missing or overwritten
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

Previously built logic to prioritize the nearest churches on the Find tab so that during peak times (e.g. 8:30 AM with 30+ live events) users aren't inundated with a long unsorted list. This prioritization appears to no longer be working — need to investigate whether the feature was lost during a recent update or overwritten by another change. The current "By distance" sort may not be applying the expected proximity-first filtering.

## IDEA-010 — Saved tab: misaligned church mass times at top of list
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

Mass times displayed at the top of the Saved tab are visually misaligned. Some entries with start and end times extend further right than others, creating an inconsistent layout. The time columns need to be cleaned up so all entries align uniformly regardless of time format or length.

## IDEA-011 — Faith Guides: visual facelift and placement reassessment
**Category:** refinement
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The Faith Guides are visually basic and plain — they need a design facelift across the board. Also worth assessing whether they should be relocated to a collapsed drawer at the bottom of the view by default, or whether a better placement/interaction pattern exists. Currently they may be taking up prominent space without earning it visually.

## IDEA-012 — Church detail: two separate hero banners for confession and mass tomorrow should merge
**Category:** question
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

At the top of the church detail card, two separate hero banners appear for confession and mass tomorrow. Since neither is for today, they should likely be consolidated into a single "tomorrow" hero that lists both services together. Need to clarify the convention: when should services get their own hero vs. being grouped by date? Establish a clear rule for hero banner logic.

## IDEA-013 — Church detail: highlighted service offerings lack padding
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-012
**Spec ref:** (none)

Service offerings on the church detail card that are highlighted via conditional formatting have very little padding around the text. The tight spacing looks unpolished. Needs additional internal padding to give the highlighted elements a more professional appearance.

## IDEA-014 — Church detail: assess inline mass times UX on a given day
**Category:** research
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-012, IDEA-013
**Spec ref:** (none)

Mass times for a given day are currently displayed inline on the church detail card. This was an intentional design choice but warrants a UX assessment — does the inline layout actually improve readability and scannability, or would a different pattern (e.g. stacked list, table, chips) serve users better? Evaluate against common scheduling UI patterns.

## IDEA-015 — Church detail: assess whether Community Life section should be collapsible
**Category:** research
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-011, IDEA-014
**Spec ref:** (none)

The Community Life section on the church detail card is always expanded. Assess whether making it collapsible would improve the UX — it may be pushing more critical content (mass times, sacraments) further down the page. Evaluate the overall information hierarchy of the church detail card and whether a collapsible pattern fits.

## IDEA-016 — Church detail footer: metadata readability improvements
**Category:** refinement
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The metadata points in the church detail card footer (e.g. diocese, rite, contact info) are not formatted in an easy-to-read way. Consider restructuring the layout — possibly a two-column grid, labeled rows, or grouped sections — to improve scannability and visual clarity.

## IDEA-017 — Map: filter pills overlap zoom and location buttons
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-008
**Spec ref:** (none)

The filter pills on the Map tab visually clash with the zoom controls (top-left) and the location button (top-right). The overlapping elements create a cluttered UI and may cause tap target conflicts. Need to reposition either the pills or the map controls to avoid overlap.

## IDEA-018 — Dev panel: surface all conditionally rendered elements for testing
**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The dev panel (accessed via 5 taps on the More tab footer) does not include all conditionally rendered elements. The "click for updates" CTA is one known omission, but there are likely others. Every element that requires specific conditions to render should be toggleable from the dev panel so they can be triggered on demand during testing. Additionally, the dev panel UI itself needs a buildout to make adding/managing these toggles more organized and usable.

## IDEA-019 — Prayer Tools: UX and ambient experience research
**Category:** research
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-020
**Spec ref:** (none)

The Prayer Tools are functional but the experience doesn't invite people to linger. Research how to elevate the feel — ambient background Gregorian chant audio (small loopable files bundled in the repo), refined color scheming, better haptic feedback, and overall atmosphere without adding images or heavy iconography. The goal is a steady balance of form and function that drives people toward prayer, not gamification or social engagement traps. Target reaction: "check out this app for the rosary — I love it."

## IDEA-020 — Prayer Tools: "I know the prayers" condensed mode
**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-019
**Spec ref:** (none)

Explore adding an option for experienced users to hide prayer text they already know by heart. Possible approaches: an "I know the prayers" toggle that collapses all text, a per-prayer selector to choose which ones to show, or an expedited swipe-through mode where decades advance with a single swipe instead of 10 individual taps. Primary use case: a user who only needs the mystery announcement and blurb but not the Hail Mary / Our Father text repeated each time.

## IDEA-021 — Examen: tapping CCC pill incorrectly marks item as selected
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-006
**Spec ref:** (none)

Tapping a CCC (Catechism) reference pill within the Examen tool is incorrectly triggering the parent item's selected state. The CCC pill tap should only open the catechism snippet — not toggle the exam item. The touch target for the pill may need to be larger and the tap event needs to stop propagating to the parent element.
