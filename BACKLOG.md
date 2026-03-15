# MassFinder — Backlog

## Structured catalog of all ideas, bugs, enhancements, and observations

> This file is the single source of truth for all work items. Claude.ai Inbox adds new entries on main. Claude Code marks items done on working branches. Status updates merge to main via PR.

**Last updated:** 2026-03-14
**ID sequence:** IDEA-053 →
**Total items:** 52

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
**Status:** done
**Date logged:** 2026-03-13
**Source:** screenshot
**Related:** IDEA-004
**Spec ref:** BT2-04
**Implemented:** 2026-03-13 via BT2-04 — added formatPsalmFallback() that applies liturgical formatting (refrain, stanzas, R. markers) when BibleGet API fails or rate-limits

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
**Status:** done
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** BT2-02
**Implemented:** 2026-03-13 via BT2-02 — widened .sched-time min-width to 92px with text-align:right for clean column alignment

Mass times displayed at the top of the Saved tab are visually misaligned. Some entries with start and end times extend further right than others, creating an inconsistent layout. The time columns need to be cleaned up so all entries align uniformly regardless of time format or length.

## IDEA-011 — Faith Guides: visual facelift and placement reassessment
**Category:** refinement
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** FGP-01, FGP-02, FGP-03
**Impl ref:** FGP-01, FGP-02, FGP-03

The Faith Guides are visually basic and plain — they need a design facelift across the board. Also worth assessing whether they should be relocated to a collapsed drawer at the bottom of the view by default, or whether a better placement/interaction pattern exists. Currently they may be taking up prominent space without earning it visually.

**Implemented:** 2026-03-13 via FGP-01, FGP-02, FGP-03 — Added SVG icons to all 11 guides, progressive disclosure (top 3 visible, rest behind "Show all" toggle), accent left-border + gradient + shadow on expanded cards

## IDEA-012 — Church detail: two separate hero banners for confession and mass tomorrow should merge
**Category:** question
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** CD2-01
**Impl ref:** CD2-01

At the top of the church detail card, two separate hero banners appear for confession and mass tomorrow. Since neither is for today, they should likely be consolidated into a single "tomorrow" hero that lists both services together. Need to clarify the convention: when should services get their own hero vs. being grouped by date? Establish a clear rule for hero banner logic.

**Implemented:** 2026-03-13 via CD2-01 — same-day future services merged into multi-row hero with day header

## IDEA-013 — Church detail: highlighted service offerings lack padding
**Category:** bug
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-012
**Spec ref:** CD2-02
**Impl ref:** CD2-02

Service offerings on the church detail card that are highlighted via conditional formatting have very little padding around the text. The tight spacing looks unpolished. Needs additional internal padding to give the highlighted elements a more professional appearance.

**Implemented:** 2026-03-13 via CD2-02 — badge padding increased to 2px 8px, font-size to var(--text-xs), min-height 22px

## IDEA-014 — Church detail: assess inline mass times UX on a given day
**Category:** research
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-012, IDEA-013
**Spec ref:** CD2-03
**Impl ref:** CD2-03

Mass times for a given day are currently displayed inline on the church detail card. This was an intentional design choice but warrants a UX assessment — does the inline layout actually improve readability and scannability, or would a different pattern (e.g. stacked list, table, chips) serve users better? Evaluate against common scheduling UI patterns.

**Implemented:** 2026-03-13 via CD2-03 — badge density threshold added; falls back to rows when majority of services have badges

## IDEA-015 — Church detail: assess whether Community Life section should be collapsible
**Category:** research
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-011, IDEA-014
**Spec ref:** CD2-04
**Impl ref:** CD2-04

The Community Life section on the church detail card is always expanded. Assess whether making it collapsible would improve the UX — it may be pushing more critical content (mass times, sacraments) further down the page. Evaluate the overall information hierarchy of the church detail card and whether a collapsible pattern fits.

**Implemented:** 2026-03-13 via CD2-04 — converted to details/summary with chevron, collapsed by default for 3+ events

## IDEA-016 — Church detail footer: metadata readability improvements
**Category:** refinement
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** (none)
**Spec ref:** CD2-05
**Impl ref:** CD2-05

The metadata points in the church detail card footer (e.g. diocese, rite, contact info) are not formatted in an easy-to-read way. Consider restructuring the layout — possibly a two-column grid, labeled rows, or grouped sections — to improve scannability and visual clarity.

**Implemented:** 2026-03-13 via CD2-05 — replaced dot-separated string with CSS grid label-value pairs

## IDEA-017 — Map: filter pills overlap zoom and location buttons
**Category:** bug
**Status:** done
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-008
**Spec ref:** BT2-03
**Implemented:** 2026-03-13 via BT2-03 — repositioned chip bar to top:76px (below zoom controls), filter pill to 76px/124px via sibling combinator

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

The Prayer Tools are functional but the experience doesn't invite people to linger. Research how to elevate the feel — ambient background Gregorian chant audio (small loopable files bundled in the repo), refined color scheming, better haptic feedback, and overall atmosphere without adding images or heavy iconography. Minimal or zero icons/SVGs. The goal is a steady balance of form and function that drives people toward prayer, not gamification or social engagement traps. The UX should make someone want to stay and pray, not just complete a task. Target reaction: "check out this app for the rosary — I love it."

## IDEA-020 — Prayer Tools: "I know the prayers" condensed mode
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-13
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-019
**Spec ref:** FGP-04
**Impl ref:** FGP-04

Explore adding an option for experienced users to hide prayer text they already know by heart. Possible approaches: an "I know the prayers" toggle that collapses all text, a per-prayer selector to choose which ones to show, or an expedited swipe-through mode where decades advance with a single swipe instead of 10 individual taps. Primary use case: a user who only needs the mystery announcement and blurb but not the Hail Mary / Our Father text repeated each time.

**Implemented:** 2026-03-13 via FGP-04 — Added "Mysteries only" toggle to rosary decades that hides all prayer text, shows condensed summaries on opening/closing screens, persists via localStorage

## IDEA-021 — Examen: tapping CCC pill incorrectly marks item as selected
**Category:** bug
**Status:** done
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-006
**Spec ref:** BT2-01
**Implemented:** 2026-03-13 via BT2-01 — added event.preventDefault() in refs.js onclick to stop label's native checkbox toggle; enlarged touch target via CSS

Tapping a CCC (Catechism) reference pill within the Examen tool is incorrectly triggering the parent item's selected state. The CCC pill tap should only open the catechism snippet — not toggle the exam item. The touch target for the pill may need to be larger and the tap event needs to stop propagating to the parent element.

## IDEA-022 — Lenten counter shows incorrect 45-day total; consider removing tracker
**Category:** bug
**Status:** new
**Date logged:** 2026-03-13
**Source:** typed
**Related:** IDEA-002
**Spec ref:** (none)

The liturgical day teaser's Lenten counter displays "Day X of 45" but the actual length of Lent is not 45 days. Beyond the incorrect number, the day-tracking format itself may gamify Lent in a way that conflicts with the spirit of the season. Leaning toward removing the "Day X of Y" counter entirely rather than fixing the count.

## IDEA-023 — Find tab sorting text too small for elderly users
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-17
**Implemented:** 2026-03-14 via BT3-17 — increased sort label font size for accessibility

The sorting label text at the top of the Find tab is too small. An elderly user would likely struggle to read it. Increase the font size significantly to improve accessibility for older users.

## IDEA-024 — Abstinence banner on More tab is redundant with Find tab teaser
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-002, IDEA-003
**Spec ref:** (none)
**Impl ref:** BT3-11
**Implemented:** 2026-03-14 via BT3-11 — removed fasting banner from More tab

The abstinence banner displayed on the More tab is redundant because the same information is already conveyed by the liturgical teaser card on the Find tab. Remove the More tab abstinence banner to reduce duplication.

## IDEA-025 — Remove special formatting for Gospel reading on More tab
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-004
**Spec ref:** (none)
**Impl ref:** BT3-12
**Implemented:** 2026-03-14 via BT3-12 — removed Gospel formatting differentiation

The Gospel reading under Readings of the Day on the More tab has special formatting or coloring to differentiate it from other readings. This is unnecessary and clashes visually. Remove the distinct styling so all readings render consistently.

## IDEA-026 — Saved tab schedule section font too small
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-010
**Spec ref:** (none)
**Impl ref:** BT3-18
**Implemented:** 2026-03-14 via BT3-18 — increased Saved tab schedule font sizes

At the top of the Saved tab, the church schedule section has text that is too small — both the section labels and the times/days. All text in this area needs to be larger for readability, especially for elderly users.

## IDEA-027 — Alternating row colors for church schedule on Saved tab
**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-026
**Spec ref:** (none)

Consider adding alternating colored rows (zebra striping) to improve scannability, particularly for the church schedule on the Saved tab. This pattern could potentially be applied elsewhere in the app as well.

## IDEA-028 — Novena tracker card should be elevated when novena is in progress
**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

When the user has an active but unfinished novena in progress, the Novena tracker card should be visually "lifted" or elevated to draw attention. This would signal that there is an ongoing devotion requiring follow-through.

## IDEA-029 — Bottom nav bar occasionally scrolls with page content
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** screenshot
**Related:** IDEA-008
**Spec ref:** (none)
**Impl ref:** BT3-22
**Implemented:** 2026-03-14 via BT3-22 — fixed bottom nav positioning

Intermittently, the bottom navigation bar hosting the four tab buttons loses its fixed/sticky positioning and begins scrolling with the page content. The trigger is unknown and the bug is not consistently reproducible. Screenshot attached showing the nav bar displaced from its expected position.

## IDEA-030 — Rosary opening prayers should be stacked with toggle for full text
**Category:** refinement
**Status:** new
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-019, IDEA-020
**Spec ref:** (none)

The Rosary opening prayers section (Sign of the Cross, Apostles' Creed, Our Father, 3 Hail Marys, Glory Be) should be displayed in a stacked vertical layout rather than inline. Design it to be visually beautiful, and render the full prayer text only when toggled. All prayers should be toggled off (collapsed) by default.

## IDEA-031 — Remove drawer collapse and TLM option from Faith Guides on More tab
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-011
**Spec ref:** (none)
**Impl ref:** BT3-14
**Implemented:** 2026-03-14 via BT3-14 — removed Faith Guides collapse toggle and TLM option

Two changes to Faith Guides on the More tab: (1) Remove the ability for users to collapse the Faith Guides drawer — it should always remain open. (2) Remove the Traditional Latin Mass option from Faith Guides entirely; it is no longer wanted.

## IDEA-032 — Liturgical calendar meditation prompt: journaling and annual reflection
**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-14
**Source:** voice
**Related:** (none)
**Spec ref:** (none)

The meditation prompt on the liturgical calendar (top of More tab) is typically phrased as a question. Explore making it more actionable — offer suggestions, let users include a personal note or response. Long-term vision: with user authentication and a database, users could save their reflections and on an annual or biannual cadence the app would resurface the same liturgical day's question alongside their past response, prompting self-reflection on growth. Requires backend infrastructure not currently in place.

## IDEA-033 — Examination of conscience subheader should say "confession" not "reconciliation"
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-01
**Implemented:** 2026-03-14 via BT3-01 — changed exam subtitle from "reconciliation" to "confession"

The subheader on the Examination of Conscience module currently reads "Prepare for reconciliation." It should be changed to "Prepare for confession" to match the more commonly used term among the target audience.

## IDEA-034 — Examination of conscience tooltip text nearly illegible
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-03, BT3-09
**Implemented:** 2026-03-14 via BT3-03, BT3-09 — tooltip replaced with full-screen modal, text made legible

The tooltip in the top-right corner of the Examination of Conscience explaining how to use the module is extremely small and nearly illegible. This needs to be displayed much more prominently to accommodate elderly users. Consider an alternative to a tiny tooltip.

## IDEA-035 — Examination of conscience: unclear that selections are being logged
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** voice
**Related:** IDEA-034
**Spec ref:** (none)
**Impl ref:** BT3-04
**Implemented:** 2026-03-14 via BT3-04 — made selection logging more visually prominent

As a user runs through the Examination of Conscience, there is a counter at the bottom center tracking logged notes, but it is not obvious that tapping items is cataloging them for later review. A first-time user would not know their actions are being recorded. Need a more prominent indication that selections are saved for review at the end and that everything is wiped after confession is completed. This should not be buried in a tooltip.

## IDEA-036 — Examination of conscience header text not centered
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-02
**Implemented:** 2026-03-14 via BT3-02 — centered exam header text

The "Examination of Conscience" header text at the top of the Examination of Conscience module is not horizontally centered. Align it to center.

## IDEA-037 — Examination of conscience tooltip item #1 is inaccurate
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-034
**Spec ref:** (none)
**Impl ref:** BT3-03
**Implemented:** 2026-03-14 via BT3-03 — fixed inaccurate tooltip wording

Item number one in the Examination of Conscience tooltip references "the questions above," which is inaccurate in context. It should instead say something like "the questions within this module, page by page" or similar phrasing that accurately describes where the questions are located.

## IDEA-038 — Examination of conscience tooltip should be full-screen to avoid scrolling
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-034, IDEA-037
**Spec ref:** (none)
**Impl ref:** BT3-03, BT3-10
**Implemented:** 2026-03-14 via BT3-03, BT3-10 — tooltip converted to full-screen modal

Items one through six of the Examination of Conscience tooltip are visible without scrolling, but a small amount of additional content requires scrolling. Since it is nearly all visible already, make the tooltip a full-screen modal so users can see everything at once without any scrolling.

## IDEA-039 — Remove "Prayers" header above Act of Contrition in Examination of Conscience
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-05
**Implemented:** 2026-03-14 via BT3-05 — removed "Prayers" label from exam final page

On the last page of the Examination of Conscience module, there is a "Prayers" header rendered above the Act of Contrition. Remove this header — it is unnecessary.

## IDEA-040 — Style Thanksgiving prayer to match Act of Contrition on exam final page
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** voice
**Related:** IDEA-039
**Spec ref:** (none)
**Impl ref:** BT3-06
**Implemented:** 2026-03-14 via BT3-06 — unified Thanksgiving prayer styling with Act of Contrition

On the final page of the Examination of Conscience, the Thanksgiving prayer after confession should be centered (both header and body) to match the Act of Contrition above it. Remove the white box container around the Thanksgiving prayer, add a simple light divider between the two prayers, and apply consistent styling and font centering to both. They should look visually unified but distinct via the divider.

## IDEA-041 — Confession logged feedback: move tracking to module button, not popup
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** voice
**Related:** IDEA-035
**Spec ref:** (none)
**Impl ref:** BT3-07
**Implemented:** 2026-03-14 via BT3-07 — moved confession tracker feedback to module button

Clicking "I received confession/reconciliation today" currently shows a popup saying "Last confession: today," which is redundant since the user just clicked it. If confession date is being tracked, the indicator belongs on the module button on the More tab, not inside the module. Render a visual confirmation effect on click, but be careful not to imply that confession content is being saved — only the date is recorded.

## IDEA-042 — Exam of conscience final page: too many redundant exit paths
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** voice
**Related:** IDEA-041
**Spec ref:** (none)
**Impl ref:** BT3-08
**Implemented:** 2026-03-14 via BT3-08 — consolidated redundant exit paths on exam final page

The final page of the Examination of Conscience offers three ways to exit: (1) a link to the Find tab to find confession, (2) a "Return to MassFinder" CTA going to the More tab, and (3) a redundant "Done" button that duplicates the Return CTA. There is also a back button. After clicking "I received reconciliation," evaluate whether the back button should still render. Consolidate the exit options to reduce confusion.

## IDEA-043 — Catechism reference pills not rendering text snippets in Faith Guides
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-006, IDEA-021
**Spec ref:** (none)
**Impl ref:** BT3-24
**Implemented:** 2026-03-14 via BT3-24 — fixed CCC pills rendering in Faith Guides

Catechism (CCC) reference pills inside the open Faith Guides drawers on the More tab are not rendering their associated text snippets. Tapping a pill should display the relevant catechism excerpt but nothing appears.

## IDEA-044 — Remove holy days dispensation footnote from Faith Guides
**Category:** refinement
**Status:** new
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

Remove the following text from the end of the Holy Days of Obligation drawer content in Faith Guides on the More tab: the paragraph about January 1, August 15, or November 1 falling on Saturday or Monday and the U.S. bishops dispensing the obligation. This footnote is not needed.

## IDEA-045 — Faith Guides active guide coloring unreadable in dark mode
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-011
**Spec ref:** (none)
**Impl ref:** BT3-16
**Implemented:** 2026-03-14 via BT3-16 — fixed Faith Guides dark mode coloring

On the More tab, the coloring used to indicate which Faith Guide is currently active/selected breaks in dark mode. The text becomes unreadable against the background. Needs a dark-mode-compatible color treatment.

## IDEA-046 — Remove About section and feedback form from Settings page
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-25
**Implemented:** 2026-03-14 via BT3-25 — removed About section from Settings

Remove the entire About section and the feedback submission form from the bottom of the Settings page. Keep the GitHub link — only remove the About content and feedback form.

## IDEA-047 — Church short name data cleanup for common vernacular
**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-14
**Source:** voice
**Related:** IDEA-007
**Spec ref:** (none)

Church records have a short name field but the values often use formal names like "Saint Mary Church" when users would typically say "St. Mary's." Audit all church short names and update them to match common vernacular — contractions, possessives, and abbreviations that people actually use when referring to their parish.

## IDEA-048 — Map tab: move filter pills below map controls on mobile
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-008, IDEA-017
**Spec ref:** (none)
**Impl ref:** BT3-26
**Implemented:** 2026-03-14 via BT3-26 — moved map chips to bottom on mobile

On mobile, the filter pills on the Map tab need to be moved to the bottom of the screen, just above the sticky universal bottom tab selector. They currently conflict with the zoom and location buttons in the top-left and top-right corners of the map.

## IDEA-049 — Find tab filter pills: swipe too sensitive, triggers page refresh
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-20
**Implemented:** 2026-03-14 via BT3-20 — fixed chip bar swipe triggering page refresh

When swiping left or right on the filter pills at the top of the Find tab, it is very easy to inadvertently trigger a page refresh. The refresh causes unintended re-rendering. Reduce the swipe sensitivity or adjust the gesture handling so horizontal swipes on the pills do not trigger the pull-to-refresh behavior.

## IDEA-050 — Church detail bulletin and website links should open in external browser
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-27
**Implemented:** 2026-03-14 via BT3-27 — detail links now open in external browser

Clicking on the bulletin or website link on a church detail page opens the URL within the app itself rather than in the user's dedicated mobile browser. These external links should open in the system browser (Safari, Chrome, etc.) so users get full browser functionality and can navigate back to the app cleanly.

## IDEA-051 — Young Catholic event cards on Find tab need subtler design treatment
**Category:** refinement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** voice
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-21
**Implemented:** 2026-03-14 via BT3-21 — made YC cards subtler

The Young Catholic church cards on the Find tab are styled too differently from the standard church cards. They should match the regular card design but include a subtle flair or indicator that distinguishes them as young adult event cards. The current treatment is over the top — dial it back to something that fits within the existing card system while still being identifiable.

## IDEA-052 — PWA update banner appearing too frequently without actual updates
**Category:** bug
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-001
**Spec ref:** (none)
**Impl ref:** BT3-28
**Implemented:** 2026-03-14 via BT3-28 — added PWA banner session guard

The "Update available — Refresh" banner is appearing nearly every time the app is opened, even when no new code has been pushed. The service worker update check is triggering false positives. Ensure the update banner only displays when there is a genuine new deployment, not on routine app opens.
