# MassFinder — Backlog

## Structured catalog of all ideas, bugs, enhancements, and observations

> This file is the single source of truth for all work items. Claude.ai Inbox adds new entries on main. Claude Code marks items done on working branches. Status updates merge to main via PR.

**Last updated:** 2026-03-15
**ID sequence:** IDEA-084 →
**Total items:** 83

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
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-026
**Spec ref:** (none)
**Impl ref:** BT3-19

Consider adding alternating colored rows (zebra striping) to improve scannability, particularly for the church schedule on the Saved tab. This pattern could potentially be applied elsewhere in the app as well.

## IDEA-028 — Novena tracker card should be elevated when novena is in progress
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-13

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
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** IDEA-019, IDEA-020
**Spec ref:** (none)
**Impl ref:** BT3-23

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
**Status:** done
**Completed:** 2026-03-14
**Date logged:** 2026-03-14
**Source:** typed
**Related:** (none)
**Spec ref:** (none)
**Impl ref:** BT3-15

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

## IDEA-053 — Monthly Devotion Card: traditional Catholic monthly dedications on More tab
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-09
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-060
**Spec ref:** (none)

A rotating card on the More tab showing the Church's traditional monthly dedication — January (Holy Name of Jesus), February (Holy Family), March (St. Joseph), April (Blessed Sacrament), May (Blessed Virgin Mary), June (Sacred Heart), July (Precious Blood), August (Immaculate Heart), September (Our Lady of Sorrows), October (Holy Rosary), November (Holy Souls in Purgatory), December (Immaculate Conception). Each entry includes a brief explanation (~100 words), 1-2 CCC references wired to the snippet system, and a suggested prayer or action that links to existing app tools where possible (e.g., October → Rosary, March → St. Joseph novena, November → prayers for the dead). Data is 12 static JSON entries, zero API, zero maintenance after build. Rotates automatically by calendar month.

**Estimated effort:** 2-3 hours
**Dependencies:** None — all infrastructure exists
**Audience fit:** All three demographics. Older parishioners will recognize these devotions; younger users will discover a tradition they may not know.

## IDEA-054 — O Antiphons: Dec 17-23 daily card for the final days of Advent
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-10
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-058
**Spec ref:** (none)

The seven O Antiphons (O Sapientia, O Adonai, O Radix Jesse, O Clavis David, O Oriens, O Rex Gentium, O Emmanuel) are among the most ancient and beautiful texts in the liturgy, prayed during Vespers on Dec 17-23. A daily card appears on the More tab during these 7 days showing the Latin title, English translation, full antiphon text (2-3 sentences each), and a one-line explanation of the Old Testament reference. Rendered in --font-prayer (Georgia) with Advent purple accent. All texts are pre-medieval and public domain. Only fires for 7 days per year. Would resonate deeply with liturgically-aware Catholics and introduce the tradition to those unfamiliar.

**Estimated effort:** 1.5-2 hours
**Dependencies:** None — date check against calendar, inline or JSON data
**Audience fit:** Middle and younger demographics will discover something new; older parishioners will appreciate seeing it surfaced.

## IDEA-055 — Seasonal novena auto-surfacing: promote contextually appropriate novenas
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-03
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-028, IDEA-065, IDEA-066
**Spec ref:** (none)

The app already has 3 novenas (Divine Mercy, Holy Spirit, St. Joseph) but they sit equally in the Novena Tracker year-round. Auto-promote the contextually appropriate novena based on the liturgical calendar: Divine Mercy Novena promoted starting Good Friday (traditional start, 9 days ending Divine Mercy Sunday); Novena to the Holy Spirit promoted from Ascension Thursday through Pentecost (the original novena); Novena to St. Joseph promoted in March leading up to March 19. The promoted novena gets a seasonal badge, moves to the top of the novena list, and if not yet started, shows a gentle CTA: "The traditional time to pray this novena begins [date]." Date-matching logic uses litcal data already cached.

**Estimated effort:** 1.5 hours
**Dependencies:** Litcal data (exists), novena tracker (exists)
**Audience fit:** All demographics. Makes the novena tracker feel alive rather than static.

## IDEA-056 — Holy Week day-by-day guide: Palm Sunday through Easter Sunday
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-05
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-055, IDEA-061
**Spec ref:** (none)

During Holy Week (Palm Sunday → Easter Sunday, April 1-5 in 2026), replace or augment the liturgical teaser card on the More tab with a richer daily guide. Each day gets a dedicated card explaining its significance: Palm Sunday (Procession, Passion reading), Monday-Wednesday (Jesus's final teachings, "Spy Wednesday"), Holy Thursday (Mass of the Lord's Supper, foot washing, Eucharist institution, altar stripping, watching hour), Good Friday (Celebration of the Passion, Veneration of the Cross, no Mass today, bare church), Holy Saturday (The Great Silence, Easter Vigil, RCIA), Easter Sunday (He is Risen, Alleluia returns). Include suggested actions ("Find Mass of the Lord's Supper near you" → Find tab with Holy Thursday filter). Static data: ~150 words per day × 8 days = ~1,200 words total. The litcal data already identifies these days by key.

**Estimated effort:** 2-3 hours
**Dependencies:** Litcal data (exists)
**Audience fit:** High impact for all demographics. Holy Week is the peak of the liturgical year.

## IDEA-057 — Liturgical color awareness: subtle indicator with explanation
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-02
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-002
**Spec ref:** (none)

A subtle indicator on the More tab (within or near the liturgical teaser) showing today's liturgical color with a brief explanation. The litcal data already includes a `color` field for every day of the year. Display as a small colored circle or bar matching the actual vestment color. Special callouts for unusual colors: Rose (only Gaudete Sunday and Laetare Sunday — "A brief respite in the penitential season"), Red (Martyrs, Pentecost, Palm Sunday, Good Friday — "The blood of the martyrs and the fire of the Holy Spirit"), White/Gold (Feasts of the Lord, Easter, Christmas — "Joy and purity"), Green (Ordinary Time — "Growth and hope"), Purple (Penance and preparation). Expandable one-liner on tap. Very lightweight — just a display map from the existing color field.

**Estimated effort:** 1 hour
**Dependencies:** Litcal data (exists, includes color field)
**Audience fit:** Educational for younger users; appreciated by all.

## IDEA-058 — Advent Wreath devotion: interactive candle lighting with weekly prayers
**Category:** new-feature
**Status:** deferred
**Deferred:** 2026-03-14 — Phase 2, Advent 2026
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-054
**Spec ref:** (none)

An interactive Advent wreath experience on the More tab during Advent. SVG wreath with 3 purple candles, 1 rose candle (third week), and a white center candle (Christmas). Candles illuminate progressively each Sunday of Advent. Tap a lit candle to see the week's theme (Hope, Peace, Joy, Love), a traditional Advent wreath blessing/prayer (~80 words), and during Dec 17-23 the day's O Antiphon (linking to IDEA-054). Dark mode: candles glow warmly against the dark background. The wreath could serve as the "signature" Advent experience — visual, contemplative, and deeply traditional. Many families do this at home but don't have the prayers memorized.

**Estimated effort:** 3-4 hours (SVG wreath design, progressive animation, prayer data, conditional rendering, dark mode)
**Dependencies:** None — standalone feature with date logic
**Audience fit:** Strong for families (middle group) and younger adults who may not have grown up with the tradition.

## IDEA-059 — First Friday / First Saturday devotion tracker
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-12
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-041
**Spec ref:** (none)

Two traditional Catholic devotions that span all seasons: Nine First Fridays (Sacred Heart — attend Mass and receive Communion on the first Friday of 9 consecutive months; associated with promises of special graces) and Five First Saturdays (Fatima — Confession, Communion, Rosary, 15-min meditation on the mysteries on 5 consecutive first Saturdays). A tracker in the Prayer Tools section. Tap to mark completion. Counter shows progress (e.g., "5 of 9 First Fridays"). Resets if a month is missed (with a gentle "Start again" rather than a punitive message). Can link to Find tab to locate Mass for the upcoming first Friday/Saturday. The app already tracks confession dates and novena progress — this is the same localStorage pattern. Flows naturally across all 12 months.

**Estimated effort:** 3 hours
**Dependencies:** None
**Audience fit:** Older parishioners will recognize these devotions immediately. Younger users may discover them. Privacy-first: localStorage only.

## IDEA-060 — Seasonal CCC Spotlight: catechism paragraph tied to the liturgical season
**Category:** new-feature
**Status:** deferred
**Deferred:** 2026-03-14 — needs UX refinement, content-for-content's-sake
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-053
**Spec ref:** (none)

A daily or weekly rotating CCC paragraph thematically tied to the current liturgical season, displayed as a card on the More tab. The full CCC (2,865 paragraphs) is already loaded in catechism.json. Curate ~20-30 paragraph numbers per season: Lent (CCC 1430-1439 interior penance, 1450-1460 confession, 538-540 Jesus in the desert), Easter (CCC 638-658 the Resurrection, 731-741 the Holy Spirit), Advent (CCC 522-524 preparation for Christ, 484-507 Mary), Christmas (CCC 525-534 mysteries of infancy), Ordinary Time (broader rotation). Card shows paragraph number, full text, section context, and a "Read more" link opening the CCC sheet. Data is a curated index of ~100-150 paragraph numbers; the text is already in the app.

**Estimated effort:** 2-3 hours (curation of paragraph index + render logic)
**Dependencies:** CCC data (exists), CCC sheet (exists)
**Audience fit:** Deepens faith formation for all demographics. Especially valuable for middle group seeking substance.

## IDEA-061 — Easter Season Alleluia card and Regina Caeli prayer
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-06
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-056
**Spec ref:** (none)

During the 50 days of Easter (Easter Sunday → Pentecost), surface a celebratory card on the More tab. After 40 days of Lenten solemnity, the app should feel different. The card includes: "Alleluia!" announcement, a note that the Easter season lasts 50 days, the Regina Caeli prayer (the traditional prayer that replaces the Angelus during Easter season — only 4 lines, public domain), and optionally a countdown to Pentecost. The accent color already shifts to gold for Easter; this card makes the seasonal shift tangible in content, not just color. The Regina Caeli text is ~60 words. Rendered in --font-prayer.

**Estimated effort:** 1-1.5 hours
**Dependencies:** Litcal data for Easter date range (exists)
**Audience fit:** Joyful and welcoming. Older parishioners will know the Regina Caeli; younger users will learn it.

## IDEA-062 — Ember Days awareness: recovering a forgotten Catholic tradition
**Category:** pie-in-the-sky
**Status:** deferred
**Deferred:** 2026-03-14 — Phase 3, low priority
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-057
**Spec ref:** (none)

Ember Days are four sets of three days (Wednesday, Friday, Saturday) occurring near the start of each liturgical season — traditionally days of fasting, abstinence, and prayer for vocations and thanksgiving for the gifts of the season. Most Catholics have never heard of them; they were de-emphasized after Vatican II but never abolished. A subtle card appears on or near Ember Days: "This week includes Ember Days" with a brief explanation (~100 words) and links to the Examen or confession finder. Date logic follows the traditional rules (Ember Days of Advent: after Dec 13, Lent: after Ash Wednesday, Pentecost: after Pentecost, September: after Sept 14). Very low data footprint.

**Estimated effort:** 1.5-2 hours
**Dependencies:** Date computation logic
**Audience fit:** Niche but appreciated by depth-seeking users. Educational for all.

## IDEA-063 — Seasonal Scripture Spotlight: weekly thematic passage in --font-prayer
**Category:** new-feature
**Status:** deferred
**Deferred:** 2026-03-14 — Phase 3, evaluate after SOT-04
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-060
**Spec ref:** (none)

A weekly rotating Scripture passage capturing the spiritual essence of the current season. Not the daily readings (which already exist) but a thematic "mood-setting" passage: Lent (Isaiah 58, Joel 2:12-13, Psalm 51), Easter (John 20, Acts 2, Romans 6:9), Advent (Isaiah 9:2, Luke 1:46-55, Isaiah 40:3), Christmas (John 1:1-14, Luke 2:1-20), Ordinary Time (broader Gospel and Psalm rotation). Rendered in --font-prayer (Georgia) with the seasonal accent as a contemplative card on the More tab. The Bible text already exists in the DRB/CPDV data — just needs a curated index of ~50-60 passage references mapped to liturgical weeks, loaded lazily at runtime.

**Estimated effort:** 3-4 hours (passage curation + lazy-load from Bible data + styling)
**Dependencies:** Bible data (exists — bible-drb/ and bible-cpdv/)
**Audience fit:** Contemplative, serves all demographics. Older parishioners will appreciate familiar passages surfaced in season.

## IDEA-064 — Marian Consecration countdown and tracker
**Category:** pie-in-the-sky
**Status:** deferred
**Deferred:** 2026-03-14 — Phase 4, needs full 33-day tracker
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-053, IDEA-059
**Spec ref:** (none)

Total Consecration to Jesus through Mary (St. Louis de Montfort) is a 33-day preparation that traditionally starts on specific dates to culminate on a Marian feast day. Common start dates: Feb 20 → March 25 (Annunciation), Apr 10 → May 13 (Our Lady of Fatima), Jun 13 → Jul 16 (Our Lady of Mt. Carmel), Jul 20 → Aug 22 (Queenship of Mary), Nov 5 → Dec 8 (Immaculate Conception). A countdown card appears ~1 week before each start date with an explanation. If the user opts in, a daily tracker (similar to novena tracker) marks progress. The awareness card alone is ~2-3 hours; including daily prayer texts (public domain but need sourcing and formatting) would be 6-8 hours.

**Estimated effort:** 2-3 hours (awareness card); 6-8 hours (with daily prayer texts)
**Dependencies:** None for awareness card; daily texts would require data curation
**Audience fit:** Popular among younger adult Catholics especially. Multiple opportunities per year.

## IDEA-065 — Pentecost Novena auto-surface: the original novena from Ascension to Pentecost
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-08
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-055
**Spec ref:** (none)

The Novena to the Holy Spirit (already in the app's prayer data) is the original novena — the Apostles prayed for 9 days between Ascension Thursday and Pentecost Sunday. Auto-surface a prominent card on the More tab starting Ascension Thursday (May 15, 2026): "The original novena begins today. Join the Apostles in 9 days of prayer for the Holy Spirit." Direct link to start the Holy Spirit novena in the existing tracker. Daily progress integrated with the existing novena system. The data already exists — this is purely date-matching logic (Ascension key from litcal) and a promotional card.

**Estimated effort:** 1.5 hours
**Dependencies:** Litcal data (exists), novena data (exists), novena tracker (exists)
**Audience fit:** Beautiful tie-in of existing content to the liturgical moment. All demographics.

## IDEA-066 — Divine Mercy Sunday experience: dedicated card with chaplet link and indulgence info
**Category:** new-feature
**Status:** done
**Completed:** 2026-03-14
**Impl ref:** SOT-07
**Date logged:** 2026-03-14
**Source:** research (seasonal-offerings-research.md)
**Related:** IDEA-055
**Spec ref:** (none)

The Second Sunday of Easter is Divine Mercy Sunday (already in litcal data as "Easter2"). Surface a dedicated card on the More tab for that day: brief explanation of the Divine Mercy devotion, conditions for the plenary indulgence (Confession within ~20 days, Communion, prayer for the Pope's intentions, complete detachment from sin), link to the Divine Mercy Chaplet (currently in devotions.js), tie-in with the Divine Mercy Novena which ends that day (IDEA-055), and CCC references on God's mercy (CCC 1846-1848). ~200 words of content. Date from litcal. April 12, 2026.

**Estimated effort:** 1.5 hours
**Dependencies:** Litcal data (exists), devotions data (exists)
**Audience fit:** Divine Mercy Sunday has become one of the most popular Catholic observances, especially among younger adults. High resonance.

## IDEA-067 — More tab: uniform visual treatment across all content zones
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-011, IDEA-024
**Spec ref:** MTR-01
**Impl ref:** MTR-01

The More tab has grown to 20+ interactive elements across 10 content zones (saint card, seasonal moment, readings, prayer tools, devotional guides, etc.) all sharing identical visual DNA — same card background, same border-bottom separators, same section title typography. Users cannot build spatial memory of where things live. The tab needs restructuring into three visually distinct zones: "Today" (daily briefing), "Practice" (prayer tools), and "Go Deeper" (reference library).

**Implemented:** 2026-03-15 via MTR-01 — restructured More tab into three visually distinct zone containers with zone seams and collapsible Go Deeper section

## IDEA-068 — More tab section titles all use same typography
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067
**Spec ref:** MTR-02
**Impl ref:** MTR-02

"Today's Readings," "Prayer & Devotion," and "Grow in Faith" all use identical `.more-section-title` styling. No visual hierarchy between daily content, practice tools, and reference material. Each zone should use differentiated typography.

**Implemented:** 2026-03-15 via MTR-02 — added three title modifier classes with sacred, UI, and muted treatments

## IDEA-069 — Prayer tools secondary row adds cognitive load for elderly users
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067
**Spec ref:** MTR-03
**Impl ref:** MTR-03

The prayer tools grid shows all 7 interactive items at once (4 primary + 3 secondary). The secondary row (Stations, Novena Tracker, First Friday) is advanced/niche content that adds cognitive load. Should be behind a "More tools" progressive disclosure by default, with bypass when a card is contextually promoted.

**Implemented:** 2026-03-15 via MTR-03 — secondary tools wrapped in disclosure toggle, promoted cards bypass

## IDEA-070 — Reading entries take too much vertical space inside Today zone
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067
**Spec ref:** MTR-04
**Impl ref:** MTR-04

Each reading entry takes ~52px vertical. With 4-5 entries, readings consume ~250px before expansion. Inside the warm "Today" container, tighter spacing would better serve the briefing intent.

**Implemented:** 2026-03-15 via MTR-04 — tighter padding and smaller headings for reading entries inside Today zone

## IDEA-071 — Library teaser positioned as a prayer tool instead of a reference bridge
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067
**Spec ref:** MTR-05
**Impl ref:** MTR-05

The "Catholic Library — coming soon" teaser sits inside the prayer tools section, feeling like another prayer tool. It's actually a future Zone 3 (reference) asset. Repositioning it between the Practice and Go Deeper zones would better telegraph what's coming.

**Implemented:** 2026-03-15 via MTR-05 — moved libraryTeaser between Zone 2 and Zone 3

## IDEA-072 — More tab Today zone needs internal spacing without border-bottom lines
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067
**Spec ref:** MTR-06
**Impl ref:** MTR-06

Inside the "Today" zone, the saint card, seasonal moment, and readings need breathing room. Pure spacing plus a faint sacred-tinted separator (not the generic border-light) should replace the current border-bottom treatment.

**Implemented:** 2026-03-15 via MTR-06 — added scoped spacing and sacred-tinted border-top for readings section

## IDEA-073 — Collapsed Grow in Faith section gives no signal of what's inside
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** UX audit
**Related:** IDEA-067, IDEA-011
**Spec ref:** MTR-07
**Impl ref:** MTR-07

When the "Go Deeper" section is collapsed (MTR-01), users see only "Grow in Faith" and a chevron with no indication of content depth. A count badge ("4 guides") would signal what's available without requiring expansion.

**Implemented:** 2026-03-15 via MTR-07 — count badge shows guide count after seasonal filtering

## IDEA-074 — Confession guide not discoverable from confession times
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-011
**Spec ref:** PHF-01
**Impl ref:** PHF-01

The "How to Go to Confession" guide lives exclusively on the More tab's Grow in Faith section. Kevin (42, returning after 15 years) finds confession times via the Confession chip → church detail → Sacraments accordion, but there is zero path to the guide that would give him confidence. Register the confession guide as a reader module so it can be opened from anywhere.

**Implemented:** 2026-03-15 via PHF-01 — registered confession guide as reader module with term/CCC/Scripture wiring and Find Confession button

## IDEA-075 — Detail panel Sacraments accordion has no link to confession guide
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-074
**Spec ref:** PHF-01a
**Impl ref:** PHF-01a

When a user opens the Sacraments accordion on a church detail card showing confession times, there is no contextual link to the confession guide. Add a gentle nudge: "First time in a while? What to expect ›" below the confession schedule. Non-intrusive — a lifelong Catholic ignores it, a returning Catholic taps it.

**Implemented:** 2026-03-15 via PHF-01a — added nudge card below confession schedule in detail panel

## IDEA-076 — Find tab confession filter shows no help for returning Catholics
**Category:** enhancement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-074, IDEA-075
**Spec ref:** PHF-01b
**Impl ref:** PHF-01b

When the Confession filter chip is active on the Find tab, results show churches with times but no indication that a guide exists. Add a dismissible one-line hint: "Not sure what to expect? How Confession works ›". Session-scoped dismissal via sessionStorage.

**Implemented:** 2026-03-15 via PHF-01b — added session-scoped confession hint below Find tab filter chips

## IDEA-077 — Reader close button below 44pt minimum touch target
**Category:** bug
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-029
**Spec ref:** PHF-02a
**Impl ref:** PHF-02a

The .reader-close-btn is 30×30px with a 16×16px SVG icon. This is the only way to exit any prayer tool. Apple HIG minimum is 44×44pt. Dorothy (78, daily Mass) cannot reliably hit a 30px target. She is trapped in the overlay. Increase to 44×44px.

**Implemented:** 2026-03-15 via PHF-02a — close button enlarged from 30px to 44px

## IDEA-078 — Rosary swipe hint disappears after first interaction
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-019, IDEA-030
**Spec ref:** PHF-02b
**Impl ref:** PHF-02b

The rosary swipe hint shows once and vanishes permanently after the first interaction. If Dorothy accidentally swipes past a decade, she has no reminder that swiping right goes back. Replace the temporary hint with a persistent subtle cue ("← swipe to navigate →") in the footer below the Previous/Next buttons.

**Implemented:** 2026-03-15 via PHF-02b — replaced one-time hint with persistent swipe cue in nav footer

## IDEA-079 — Prayer text too small at "large" setting for arm's-length reading
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-023, IDEA-026
**Spec ref:** PHF-02c
**Impl ref:** PHF-02c

At [data-text-size="large"], root is 19px. Rosary prayer text computes to ~19px Georgia. For a 78-year-old reading at arm's length on a 6.1" iPhone, this may not be sufficient. Add a +2px reader-specific boost when large text is active, giving ~21px prayer text inside the reader overlay without affecting the rest of the app.

**Implemented:** 2026-03-15 via PHF-02c — added +2px boost for prayer text in reader at large text size

## IDEA-080 — Reader overlay has no continuity cue when tab bar disappears
**Category:** refinement
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** Pastoral advisor handoff (Fr. Mike)
**Related:** IDEA-029
**Spec ref:** PHF-02d
**Impl ref:** PHF-02d

When the reader overlay opens, the bottom tab bar disappears. Dorothy's mental model ("tabs = how I move around") breaks. Consider a subtle continuity cue — either a faint wordmark or a 3px colored line at the bottom edge where the tab bar was. Lowest priority item — may be unnecessary if PHF-02a (bigger close button) resolves the confusion.

**Implemented:** 2026-03-15 via PHF-02d — added 3px primary-colored line at bottom edge of reader overlay

## IDEA-081 — App rebrand: evaluate "Sacristy" as replacement for "MassFinder"
**Category:** research
**Status:** done
**Completed:** 2026-03-15
**Date logged:** 2026-03-15
**Source:** research (branding-research.md)
**Related:** IDEA-082, IDEA-083
**Spec ref:** (none)

"MassFinder" describes ~15% of the app's current functionality and collides with massfinder.app (active competitor), massfinder.org, and the Catholic Mass Times ecosystem (130K+ churches, 20K reviews). Research evaluated three naming strategies: keep MassFinder (rejected — brand collision, scope mismatch), descriptive compound (rejected — forgettable), single evocative word (recommended — matches Hallow/Laudate/Amen pattern). Top candidate: **Sacristy** — "everything you need for the liturgical life, gathered in one place." sacristy.app domain appears available. Full analysis in docs/research/branding-research.md.

## IDEA-082 — Secure sacristy.app domain and configure Vercel custom domain
**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-15
**Source:** research (branding-research.md)
**Related:** IDEA-081, IDEA-083
**Spec ref:** (none)

If rebrand decision is confirmed: purchase sacristy.app (~$12-14/yr), configure DNS, set up Vercel custom domain pointing to existing deployment. Includes SSL provisioning (automatic with .app TLD which requires HTTPS).

**Estimated effort:** 1 hour
**Dependencies:** IDEA-081 decision

## IDEA-083 — Rebrand string references: manifest, meta tags, header wordmark, OG tags
**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-15
**Source:** research (branding-research.md)
**Related:** IDEA-081, IDEA-082
**Spec ref:** (none)

Update all user-facing "MassFinder" references to new brand name: manifest.json (name, short_name), index.html (title, meta description, OG tags, header wordmark text, header subtitle), service worker, any hardcoded strings in JS modules. Add a temporary "formerly MassFinder" note for 3-6 months to ease transition for existing users. Preserve the cross-and-gold icon and "Western New England" regional subtitle.

**Estimated effort:** 2-3 hours
**Dependencies:** IDEA-082 (domain must be active first)
