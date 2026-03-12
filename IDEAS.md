# MassFinder — Ideas & Work Register

## Structured catalog of all ideas, bugs, enhancements, and observations

**Last updated:** 2026-03-12
**ID sequence:** IDEA-001 → IDEA-055
**Total items:** 55

-----

## IDEA-001 — Update CLAUDE.md

**Category:** tech-debt
**Status:** in-progress
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-01 / DOC-03

New CLAUDE.md was produced as part of the 2026-03-11 audit. Remaining action is to replace the root `CLAUDE.md` with the updated version and mark DOC-03 as done in the Master Feature Catalog. Estimated effort is 5 minutes (file replacement only).

-----

## IDEA-002 — romcal offline liturgical calendar

**Category:** backend-data-infra
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-020
**Spec ref:** OW-02 / LIT-01

`scripts/build-litcal.js` currently fetches from the LitCal API at build time. The plan is to replace this with the `romcal` npm package so calendar data can be computed locally, making builds fully offline-capable and reproducible. Pre-built `data/litcal-2026.json` and `data/litcal-2027.json` already exist as fallbacks. Output format must match the existing litcal-YYYY.json structure. Files: `scripts/build-litcal.js`, `package.json`. Estimated effort: 3 hours.

-----

## IDEA-003 — Web Speech API read-aloud for daily readings

**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-03 / UX-04

Add a play/pause “Listen” button to each expanded reading card in the More tab. Uses `SpeechSynthesisUtterance` with `rate: 0.9`. Speech should cancel on reading collapse or tab switch. Accessibility win for low-vision users and people praying while driving. Files: `src/readings.js`, `css/app.css`. Estimated effort: 30 minutes.

-----

## IDEA-004 — build-examination.js build script

**Category:** backend-data-infra
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-04 / BLD-03

`data/examination.json` was hand-authored with no build pipeline. A build script is needed to transform a ConfessIt translation JSON (or equivalent source) into the examination data file, establishing reproducibility if the data ever needs updating. File: `scripts/build-examination.js`. Estimated effort: 1 hour.

-----

## IDEA-005 — Summa Theologica daily wisdom card

**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-006, IDEA-021, IDEA-051
**Spec ref:** OW-05 / DAT-08

Curate ~365 articles from the Summa Theologica matched to liturgical themes and surface one per day in a “Daily Wisdom” card on the More tab. Source: `Jacob-Gray/summa.json` (public domain, 20MB). Requires a `scripts/build-summa.js` curation script and a new rendering block in `src/more.js` or `src/readings.js`. Open design decision: placement relative to the existing CCC reflection card (below it, separate section, or toggle). Output: `data/summa-daily.json` (~50KB). Estimated effort: 3 hours. Note: see IDEA-051 re: whether Summa is the right “going deeper” source for general users.

-----

## IDEA-006 — “Pray for Me” anonymous intentions counter

**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-005, IDEA-019
**Spec ref:** OW-06 / PAT-07

A single anonymous “Pray for me” tap increments a counter displayed as “142 people praying today.” No accounts, no text input, no moderation required. Open design decisions: placement (saint card, daily reading, its own card) and backend (Supabase counter table, GA event, or Vercel KV). Must be fully anonymous with no user identification. Estimated effort: 2 hours.

-----

## IDEA-007 — Latin/English translation toggle in Bible sheet

**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-07 / STR-01

Add a toggle to display parallel DRB English and Clementina Vulgata Latin text in the Bible sheet. Source: `mborders/vulgata` repo (public domain). Primary audience is TLM attendees — niche but passionate. Requires a data pipeline for the Latin text plus a UI toggle. Estimated effort: 4 hours.

-----

## IDEA-008 — Gregorian chant database links

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-08 / STR-02

Link from the liturgical day view to proper chants via GregoSearch. Extremely niche audience. No design decisions documented yet. Estimated effort: 2 hours.

-----

## IDEA-009 — Catholic hierarchy data for diocese forkers

**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-09 / STR-03

Auto-populate diocese information for users who fork MassFinder for their own diocese, sourced from catholic-hierarchy.org data. Reduces setup friction for new diocese deployments. Estimated effort: 2 hours.

-----

## IDEA-010 — Ambient prayer tones (Web Audio API)

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-10 / STR-04

Play a very quiet programmatic sine wave (174 Hz) during guided prayer using the Web Audio API — no audio files required. Open design decisions: opt-in vs. default, per-module vs. global, volume control. Estimated effort: 1 hour.

-----

## IDEA-011 — Physical rosary counter via Web Bluetooth

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-11 / STR-05

Allow a Bluetooth-connected physical rosary device to advance the in-app rosary module bead-by-bead. Web Bluetooth support is limited across browsers and the audience is extremely niche. Estimated effort: 4 hours.

-----

## IDEA-012 — Doctors of the Church gallery and saint-card badge

**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-12 / STR-06

Build a gallery of all 37 Doctors of the Church (name, dates, notable works) and display a “Doctor of the Church” badge on the saint card when the day’s saint is one of them. Estimated effort: 2 hours (data + badge rendering).

-----

## IDEA-013 — Remove Node v12 warnings from ANTI_PATTERNS.md

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-13

The engine requirement is now >=18 and CI runs Node 20. The Node v12 warning sections in `docs/ANTI_PATTERNS.md` are stale and should be removed. Estimated effort: 10 minutes.

-----

## IDEA-014 — Add –font-prayer to STYLE_GUIDE.md

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** OW-14

`--font-prayer` (Georgia) is in use throughout the app but not documented in `docs/STYLE_GUIDE.md`. Add it to the design tokens table, document the full three-font system (display/body/prayer), and update component examples for contemplative text styling. Estimated effort: 15 minutes.

-----

## IDEA-015 — Mark completed catalog items as done in Master Feature Catalog

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-001
**Spec ref:** (none)

Five items are implemented in code but still show as open in `docs/plans/MassFinder_Master_Feature_Catalog.md`: DAT-07 (Bible xrefs), BLD-04 (build-bible-drb.js), BLD-05 (build-lectionary.js), BLD-06 (build-litcal.js), XREF-02 (tappable scripture refs). Each should be marked with strikethrough and ✓ DONE. Also confirm LIB-05 REVERTED text is accurate.

-----

## IDEA-016 — Update ROADMAP.md with current metrics

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

`docs/ROADMAP.md` contains stale metrics: it says 28 validated parishes (actual: 91) and ~1,407 services (actual: 1,690). The batch structure may also need updating. A quick pass to sync these numbers with the current state of the data is needed.

-----

## IDEA-017 — Update INTEGRATIONS.md to reflect shipped Bible and calendar integrations

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-015
**Spec ref:** (none)

`docs/INTEGRATIONS.md` does not yet document the DRB Bible, CPDV Bible, BibleGet verse integration, pre-built litcal JSON, or bible-xrefs. Any references suggesting these are future work should be removed and replaced with accurate current descriptions.

-----

## IDEA-018 — Archive superseded planning docs

**Category:** tech-debt
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-001
**Spec ref:** (none)

Five planning documents describe work that is now fully complete and are likely to confuse Claude Code if used as context. Move to `docs/archive/` or delete: `CCC_BottomSheet_UX_Redesign.md`, `MassFinder_Redesign_Audit_v3.md`, `MassFinder_UX_Implementation_Spec_Amended.md`, `MassFinder_UX_Remediation.md`, `MassFinder_V2_Rebuild_Plan_ClaudeCode.md`.

-----

## IDEA-019 — Research: evaluate Vercel KV vs Supabase for intentions counter backend

**Category:** research
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-006
**Spec ref:** (none)

Before implementing the “Pray for Me” counter (IDEA-006), evaluate backend options: Vercel KV (already in the deploy stack, minimal setup), Supabase counter table (more flexible, separate service), or a simple GA event (no persistence). Key criteria: anonymity guarantee, cost at scale, and operational simplicity given solo-dev bandwidth.

-----

## IDEA-020 — Research: romcal API shape and US calendar plugin compatibility

**Category:** research
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-002
**Spec ref:** (none)

Before rewriting `build-litcal.js`, verify the current romcal npm package API (Calendar constructor, US national calendar plugin, output structure) and confirm it can produce output matching the existing `litcal-YYYY.json` format. The package has changed significantly across major versions. Check the latest docs and changelog before writing any code.

-----

## IDEA-021 — Research: Summa placement UX — below CCC card, separate section, or toggle

**Category:** research
**Status:** new
**Date logged:** 2026-03-11
**Source:** typed
**Related:** IDEA-005
**Spec ref:** (none)

The Summa Theologica daily wisdom card (IDEA-005) has an unresolved placement question. Evaluate three options against the More tab’s existing information hierarchy: (1) below the CCC reflection card, (2) a separate collapsible section, (3) a toggle that swaps between CCC and Summa. Consider the three user demographics — older parishioners may find a toggle confusing; younger users may prefer less vertical scroll.

-----

## IDEA-022 — Font size audit across the app

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-023, IDEA-041
**Spec ref:** (none)

Font sizes are inconsistent across the app — some areas look correct while others render too small depending on the system font size setting. A systematic pass through all views is needed to ensure legibility across the three user demographics, particularly older parishioners. Files: `css/app.css`.

-----

## IDEA-023 — Saved tab: “Prayer Life,” “Your Churches,” and event listing text too small

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-022
**Spec ref:** (none)

“Prayer Life” and “Your Churches” section labels in the Saved tab, along with event listing text, are rendering too small to be comfortably readable — particularly for older parishioners. Priority fix given the demographic. Files: `css/app.css`, `src/saved.js`.

-----

## IDEA-024 — Research: should Prayer Life CTAs live in Saved tab or only in More tab?

**Category:** research
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-053
**Spec ref:** (none)

Prayer Life CTAs appear at the top of the More tab and again in the Saved tab. Evaluate whether this duplication is useful (two convenient entry points) or confusing and redundant. Consider whether the Saved tab instance serves a distinct purpose — e.g., surfacing active streaks or saved progress — that justifies the presence, or whether it should be removed from one location.

-----

## IDEA-025 — Universal card component rendering broken across multiple modules

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-027, IDEA-028, IDEA-029, IDEA-030, IDEA-031, IDEA-032, IDEA-033, IDEA-034, IDEA-035, IDEA-037, IDEA-038, IDEA-040
**Spec ref:** (none)

The universal card component appears to be missing context-specific parameters, causing visual breakage across all prayer tools and explorer/reader modules. Symptoms include missing text, misplaced buttons, and incorrect layout. Every location where the universal card is used should be audited to confirm the render is appropriate for its specific context. Module-specific issues are logged individually as related items.

-----

## IDEA-026 — More tab: redundant season sub-label below liturgical day header

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-047
**Spec ref:** (none)

The liturgical day card shows e.g. “Thursday of the 3rd Week of Lent” as the header, and then “Lent” again in smaller text below. During Ordinary Time this sub-label would read “Ordinary Time” for most of the year, conveying no additional information. Evaluate whether the sub-label serves any purpose not already captured by the header text, and remove it if redundant. Files: `src/more.js`, `css/app.css`.

-----

## IDEA-027 — Rosary: bottom navigation buttons bunched left instead of balanced

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025, IDEA-038
**Spec ref:** SPEC-002-A

Bottom navigation buttons in the Rosary module are floated left and bunched together. They should be right-aligned or split to left and right for ergonomic thumb reach on mobile. Files: `src/rosary.js`, `css/app.css`.
**Implemented:** 2026-03-12 via SPEC-002-A — buttons wrapped in flex div with space-between; single-button (Amen) goes full-width for larger touch target.

-----

## IDEA-028 — Rosary: Hail Mary beads overflow their container

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025
**Spec ref:** SPEC-002-B

Hail Mary bead elements do not fit within their container in the Rosary module — they overflow or are clipped. Likely a flexbox or grid sizing issue introduced with the universal card refactor. Files: `src/rosary.js`, `css/app.css`.
**Implemented:** 2026-03-12 via SPEC-002-B — bead size reduced to 1.375rem, gap to 0.375rem, flex-wrap added as safety net; all 10 beads now fit 375px viewport.

-----

## IDEA-029 — Rosary: Bible reading back button returns to landing page instead of reading origin point

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025, IDEA-035, IDEA-040
**Spec ref:** SPEC-002-F

Tapping a Bible reference in the Rosary opens the correct passage, but the back button returns to the Rosary landing page rather than the mystery or bead from which the reading was opened. The X button closes the entire Rosary and returns to the More tab. Neither behavior preserves user context. A shared back-navigation strategy should be considered across Rosary, Examination, and Stations (see also IDEA-035, IDEA-040). Files: `src/rosary.js`, `src/bible.js`.
**Implemented:** 2026-03-12 via SPEC-002-F — reader navigation stack enhanced with _restore flag; rosary.js preserves decade/bead state on back-nav without needing changes to bible.js or ccc.js.

-----

## IDEA-030 — Rosary: CCC inline reference has no spacing separation from surrounding content

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025
**Spec ref:** SPEC-002-D

Tapping a CCC reference within the Rosary opens the reference correctly inline, but there is no visual separation (margin or padding) between the CCC reference block and adjacent content such as the “Our Father” section. Spacing tokens need to be applied. Files: `src/rosary.js`, `css/app.css`.
**Implemented:** 2026-03-12 via SPEC-002-D — added margin-bottom: var(–space-3) to .exam-ccc-card; fix benefits both Rosary and Examination modules.

-----

## IDEA-031 — Rosary: completing a decade then pressing back resets that decade’s progress to zero

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025
**Spec ref:** SPEC-002-C

After completing a decade and advancing to the next, pressing back wipes the completed decade back to 0/10. Rosary progress state is not being persisted across decade transitions. Files: `src/rosary.js`.
**Implemented:** 2026-03-12 via SPEC-002-C — rosary.js render() now checks _restore flag and skips state reset when navigating back, preserving all decade and bead count state.

-----

## IDEA-032 — Examination: landing page loads scrolled to bottom, cross barely visible

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025, IDEA-033, IDEA-034
**Spec ref:** (none)

The Examination of Conscience landing page loads in a scrolled-to-bottom state, showing only the top of the cross graphic with the centering prayer text off-screen. Likely a scroll position initialization or flexbox height issue. Files: `src/examination.js`, `css/app.css`.

-----

## IDEA-033 — Examination: “No items noted yet | view summary” visible before starting

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-032
**Spec ref:** (none)

The “No items noted yet | view summary” UI element is visible on the Examination landing page before the user has started the examen. It should only appear after the user has begun. Files: `src/examination.js`.

-----

## IDEA-034 — Examination: progress tracker renders at full viewport height instead of thin horizontal bar

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-032, IDEA-025
**Spec ref:** (none)

After starting the Examination, the progress tracker at the top of the screen renders at nearly full viewport height rather than as a thin horizontal bar. Likely a cascading layout issue from the landing page scroll/height bug (IDEA-032). Files: `src/examination.js`, `css/app.css`.

-----

## IDEA-035 — Examination: navigating to CCC “See Full Range” loses examen progress with no way back

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025, IDEA-029, IDEA-040
**Spec ref:** (none)

Tapping a CCC reference during the Examination opens the reference correctly, but tapping “See Full Range” navigates away with no way to return to the in-progress examen. All progress is lost. This is the same class of back-navigation problem as IDEA-029 (Rosary) and IDEA-040 (Stations). A shared fix strategy should be considered. Files: `src/examination.js`, `src/ccc.js`.

-----

## IDEA-036 — Examination: “Prayers” label after confession summary should be centered

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The “Prayers” section label appearing after the “Summary for Confession” block is left-aligned but should be centered to match the visual hierarchy of the summary screen. Files: `src/examination.js`, `css/app.css`.

-----

## IDEA-037 — Examination: reconciliation confirmation button produces clashing pop-up and should clear summary

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025
**Spec ref:** (none)

Tapping “I received the sacrament of Reconciliation” produces a temporary pop-up that visually clashes with the buttons beneath it. The preferred behavior is an in-place confirmation (pulse animation or checkmark on the CTA itself) rather than a new overlay element. Additionally, once reconciliation is confirmed, the summary and noted items should be cleared or hidden — keeping them visible after the sacrament has been received is not logically coherent. Files: `src/examination.js`, `css/app.css`.

-----

## IDEA-038 — Stations of the Cross: navigation buttons left-aligned

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-025, IDEA-027
**Spec ref:** SPEC-002-E

Navigation buttons in the Stations of the Cross are left-aligned. Should be corrected in tandem with or following the Rosary button alignment fix (IDEA-027) to maintain consistency across prayer modules. Files: `src/stations.js`, `css/app.css`.
**Implemented:** 2026-03-12 via SPEC-002-E — same flex wrapper approach as SPEC-002-A applied to stations _navHtml(), intro Begin button, and completion Amen button.

-----

## IDEA-039 — Stations of the Cross: replace V/R label divs with colored plain text to reclaim vertical space

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The versicle/response (V/R) label elements in Stations are rendered on separate divs, consuming enough vertical space to prevent a no-scroll experience. Proposal: remove the V/R label divs and use colored or styled inline text to distinguish versicle from response, reclaiming space to achieve a single-viewport render for most stations. Files: `src/stations.js`, `css/app.css`.

-----

## IDEA-040 — Stations of the Cross: Bible reference navigation loses station progress

**Category:** bug
**Status:** done
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-029, IDEA-035
**Spec ref:** SPEC-002-F

Tapping a Bible reference in the Stations of the Cross opens the passage correctly but provides no back navigation to return to the station in progress. This is the same class of back-navigation regression as IDEA-029 (Rosary) and IDEA-035 (Examination). A unified fix across all three modules should be considered. Files: `src/stations.js`, `src/bible.js`.
**Implemented:** 2026-03-12 via SPEC-002-F — same _restore flag pattern as Rosary; stations.js preserves current station index on reader back-nav. Unified fix covered both IDEA-029 and IDEA-040.

-----

## IDEA-041 — Novena: active novena card elements and text too small for older users

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-022, IDEA-042
**Spec ref:** (none)

The active novena section uses small dots, small chevrons, and small text that will be nearly impossible to interact with for older parishioners. Touch targets should meet the 44×44pt minimum and the overall design should be enlarged and made visually impactful. Files: `src/novena.js`, `css/app.css`.

-----

## IDEA-042 — Novena: no intuitive way to advance to the current day’s prayer

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-041
**Spec ref:** (none)

When returning to an active novena, the app loads the previously completed day rather than the current one. The only way to advance is by tapping the dot indicators at the top, which is not discoverable — especially for older users. An explicit “Continue” or “Next Day” button should be added, or the app should automatically calculate and load the correct day based on tracked progress and elapsed time. Files: `src/novena.js`.

-----

## IDEA-043 — Bible reader: destination highlight not prominent enough when deep-linked from another module

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-029, IDEA-035, IDEA-040
**Spec ref:** (none)

When the Bible reader is opened from Rosary, Stations, or Examination and scrolls to a target passage, the verse highlight barely stands out. The highlight needs to be more visually prominent so the user immediately identifies the intended passage. Files: `src/bible.js`, `css/app.css`.

-----

## IDEA-044 — Question: what does the dot indicator on the Saved tab greeting serve?

**Category:** question
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

A dot appears next to the contextual greeting on the Saved tab. The purpose and function of this dot are unclear. When specced, this should produce a factual answer explaining what the dot represents, when it appears vs. not, and whether it is working as intended. Files: `src/saved.js`.

-----

## IDEA-045 — Saved tab: today’s events should be visually distinguished from future events

**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

Events happening today in the Saved tab should be visually differentiated from upcoming events — e.g., via a highlight, badge, or elevated position. When multiple services fall today, a prioritization strategy is needed (e.g., next chronologically, or Mass over other service types). Design decision required before implementation. Files: `src/saved.js`, `css/app.css`.

-----

## IDEA-046 — Question: will “Lenten Season” in the Saved tab greeting show “Ordinary Time” most of the year?

**Category:** question
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-047
**Spec ref:** (none)

The Saved tab greeting currently shows “Lenten Season” below the greeting text. The question is whether this label will display “Ordinary Time” for the ~33 weeks of the year that fall in that season. If so, the label may be worth suppressing during Ordinary Time and showing only for named seasons (Advent, Christmas, Lent, Easter). When specced, this should confirm the current rendering logic and whether the conditional suppression approach is already implemented or needs to be added. Files: `src/saved.js`, `src/readings.js` or wherever the season label is sourced.

-----

## IDEA-047 — Suppress season label during Ordinary Time in greeting and liturgical day card

**Category:** refinement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-046, IDEA-026
**Spec ref:** (none)

Both the Saved tab greeting and the More tab liturgical day card display the current liturgical season. During Ordinary Time — which covers most of the year — displaying “Ordinary Time” adds no meaningful context. The season label should only render for named seasons: Advent, Christmas, Lent, and Easter. Files: `src/saved.js`, `src/more.js`, `css/app.css`.

-----

## IDEA-048 — Saved tab: “Your Churches” edit and X buttons too small for older users

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-022, IDEA-041
**Spec ref:** (none)

The “Edit” button next to “Your Churches” and the associated X buttons for removing parishes are too small to be comfortably tapped by older users. Touch targets should be enlarged to meet the 44×44pt minimum. Files: `src/saved.js`, `css/app.css`.

-----

## IDEA-049 — Pie in the sky: replace “Prayer Life” section with compact hotkey buttons

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-024, IDEA-053
**Spec ref:** (none)

The “Prayer Life” section in the Saved tab occupies significant real estate and appears duplicative with the same cards at the top of the More tab. A possible replacement is a compact row of hotkey icon buttons that launch the same tools with far less vertical space. This would free the Saved tab to focus on parish-specific content. Requires a design decision on what, if anything, replaces the reclaimed space.

-----

## IDEA-050 — Question: what does the dot on the heart icon in the bottom tab bar indicate?

**Category:** question
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-044
**Spec ref:** (none)

A dot appears on the heart/Saved icon in the bottom navigation bar. The meaning of this dot is unclear — it may indicate unread activity, a new saved parish, or a notification state. When specced, this should produce a factual answer explaining the dot’s trigger conditions, what state it represents, and whether it clears correctly. Files: `src/saved.js`, `src/ui.js`.

-----

## IDEA-051 — Research: is Summa Theologica too advanced for general users as a “going deeper” source?

**Category:** research
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-005, IDEA-021
**Spec ref:** (none)

The Summa Theologica is academically dense and may not serve general users well as a daily “going deeper” feature. It may be better positioned as a power-user or academic resource. Evaluate what public-domain classic Catholic literary works could better serve the common user for accessible spiritual depth — previous conversations have touched on bringing in copyright-free Catholic classics as a content layer. This research should produce a shortlist of candidate sources with audience fit assessments.

-----

## IDEA-052 — CCC “See Also” references clipped at bottom of screen

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The “See Also” section at the bottom of a CCC entry is sometimes cut off and not fully visible. Likely a max-height or overflow issue on the sheet container. Files: `src/ccc.js`, `css/app.css`.

-----

## IDEA-053 — Pie in the sky: rename and reimagine “Prayer Life” as a devotional/study tracker

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** IDEA-024, IDEA-049
**Spec ref:** (none)

Rather than a simple list of prayer tool links, the “Prayer Life” section could be renamed (e.g., “Devotional Life”) and expanded into a personal progress tracker. If the app’s content library grows to include classic Catholic books, this section could track reading progress through those works. A more ambitious version would turn the explorer modules into a study aid with bookmarking and note-jotting, with those notes and bookmarks surfacing here for review. Requires significant design and architecture decisions before any implementation.

-----

## IDEA-054 — Saved tab: “Directions” link should route to Apple Maps on iOS, not Google Maps

**Category:** bug
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The “Directions” link under the today service banner in the Saved tab currently routes to Google Maps regardless of device. On iPhone it should open Apple Maps, matching the behavior already implemented in the church detail card. The fix should detect the user’s platform and route to the appropriate default maps application. Files: `src/saved.js`.

-----

## IDEA-055 — More tab / pie in the sky: daily reflection card with user journaling prompt

**Category:** pie-in-the-sky
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The reflection card at the top of the More tab prompts the user to reflect on a text. A natural extension would be to invite the user to jot a brief response — engaging them to articulate something meaningful in reply to the prompt. Open questions: where would these notes be stored (local only for privacy?), how would they be surfaced later (a journal view in the Saved tab?), and whether this is too much friction for the primary user demographic. Worth exploring before dismissing.

-----

## IDEA-056 — Event detail card: contact phone number should be a tappable call button

**Category:** enhancement
**Status:** new
**Date logged:** 2026-03-12
**Source:** typed
**Related:** (none)
**Spec ref:** (none)

The contact phone number displayed in the event detail card is static text. It should be a tappable `tel:` link so the user can call directly from the card, provided the number is a valid phone number format. Files: `src/render.js` or wherever event detail cards are built, `css/app.css`.