# SPEC-012 — Stretch & Pie-in-the-Sky Features (Deferred)
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Opus (design) → Claude Code (implementation) — when prioritized
**Status: ALL ITEMS DEFERRED** — do not implement without explicit prioritization decision

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-012-A | IDEA-007 | Latin/English toggle in Bible sheet | deferred |
| SPEC-012-B | IDEA-008 | Gregorian chant database links | deferred |
| SPEC-012-C | IDEA-009 | Catholic hierarchy data for diocese forkers | deferred |
| SPEC-012-D | IDEA-010 | Ambient prayer tones (Web Audio API) | deferred |
| SPEC-012-E | IDEA-011 | Physical rosary counter via Web Bluetooth | deferred |
| SPEC-012-F | IDEA-012 | Doctors of the Church gallery and saint-card badge | deferred |
| SPEC-012-G | IDEA-049 | Replace "Prayer Life" section with compact hotkey buttons | deferred |
| SPEC-012-H | IDEA-053 | Rename/reimagine "Prayer Life" as devotional/study tracker | deferred |
| SPEC-012-I | IDEA-055 | Daily reflection card with user journaling prompt | deferred |
| SPEC-012-J | IDEA-024 | Research: Prayer Life CTAs in Saved vs. More tab only | deferred |

---

## Why deferred
These items are stretch features, pie-in-the-sky redesigns, or open design-decision questions that require significant research and/or design work before any code can be written. Given solo-dev bandwidth, none should enter active development until SPEC-001 through SPEC-011 are complete and prioritization is explicitly revisited.

---

## Brief sketches (for future spec expansion)

### SPEC-012-A — Latin/English toggle in Bible sheet
**Origin:** IDEA-007 | OW-07 / STR-01

Parallel DRB English + Clementine Vulgata Latin text in the Bible sheet. Source: `mborders/vulgata` repo (public domain). Primary audience: TLM attendees. Requires a data pipeline for Latin text (~74 books) and a toggle UI. Estimated effort: 4 hours.

**Before expanding this spec, answer:**
- Is the `mborders/vulgata` repo actively maintained and in a usable format?
- What is the exact verse-by-verse data structure, and does it align with the DRB book/chapter/verse IDs already in use?
- Toggle state: per-session only, or persisted in `localStorage`?

---

### SPEC-012-B — Gregorian chant database links
**Origin:** IDEA-008 | OW-08 / STR-02

Link from the liturgical day view to proper chants via GregoSearch. Extremely niche. Estimated effort: 2 hours.

**Before expanding this spec, answer:**
- Does GregoSearch have a stable deep-link URL pattern that can be constructed from a liturgical day identifier?
- Is the audience size sufficient to justify the maintenance cost of external link dependencies?

---

### SPEC-012-C — Catholic hierarchy data for diocese forkers
**Origin:** IDEA-009 | OW-09 / STR-03

Auto-populate diocese information for users who fork MassFinder for their own diocese, sourced from catholic-hierarchy.org data. Reduces setup friction for new diocese deployments. Estimated effort: 2 hours.

**Before expanding this spec, answer:**
- Is there a usable API or data export from catholic-hierarchy.org, or does this require scraping?
- What exact diocese fields are needed for a new deployment?
- Should this be a build-time script or a runtime fetch?

---

### SPEC-012-D — Ambient prayer tones (Web Audio API)
**Origin:** IDEA-010 | OW-10 / STR-04

Programmatic sine wave (~174 Hz) during guided prayer. No audio files. Opt-in only.

**Before expanding this spec, answer:**
- Opt-in: where in Settings or the prayer module UI does the user enable it?
- Volume control: within the module or system volume only?
- Which modules: Rosary only? All prayer modules?
- Does it continue during the back-nav overlay (Bible/CCC reference) or pause?

---

### SPEC-012-E — Physical rosary counter via Web Bluetooth
**Origin:** IDEA-011 | OW-11 / STR-05

Web Bluetooth integration with a physical rosary counting device. Extremely niche. Web Bluetooth is not available in Safari on iOS (the primary platform for this app's users). Essentially a non-starter until Safari supports Web Bluetooth. Mark as **blocked** pending Safari Web Bluetooth support.

---

### SPEC-012-F — Doctors of the Church gallery and saint-card badge
**Origin:** IDEA-012 | OW-12 / STR-06

37 Doctors of the Church data file + "Doctor of the Church" badge on saint card when applicable. Clean self-contained feature with a clear data model. Estimated effort: 2 hours. Good candidate for next prioritization cycle.

**Before expanding this spec, answer:**
- Is there a public-domain structured data source for all 37 Doctors, or does the data need to be hand-authored?
- What fields per Doctor: name, dates, feast day, title, notable works?
- Badge placement on saint card: next to name, below name, or in the card header?

---

### SPEC-012-G — Replace "Prayer Life" section with compact hotkey buttons
**Origin:** IDEA-049

Compact icon-button row replacing the large "Prayer Life" cards in the Saved tab. Would free significant vertical real estate. Design decision required: what fills the reclaimed space?

**Dependency on SPEC-012-J:** Resolve the research question (SPEC-012-J) about whether Prayer Life CTAs should live in both Saved and More tabs before redesigning either location.

---

### SPEC-012-H — Rename/reimagine "Prayer Life" as devotional/study tracker
**Origin:** IDEA-053

Ambitious redesign that depends on whether the app's content library grows to include classic Catholic books (see SPEC-009). Requires significant design and architecture decisions. Defer until SPEC-009 is complete and the content library direction is clear.

---

### SPEC-012-I — Daily reflection card with user journaling prompt
**Origin:** IDEA-055

Open design questions before any implementation:
- Storage: `localStorage` only (private, on-device) or cloud sync?
- Surface: where do past journal entries appear? (Saved tab journal view?)
- Friction concern: will the demographic actually engage with text input?
- Integration with streak/activity tracking?

Good candidate for user feedback validation before spec expansion.

---

### SPEC-012-J — Research: Prayer Life CTAs in Saved vs. More tab
**Origin:** IDEA-024

Should resolve before SPEC-012-G or SPEC-012-H are designed. Question: does the Saved tab instance of Prayer Life CTAs serve a distinct purpose (surfacing active streaks or saved progress), or is it purely duplicative of the More tab? Answer by reading `src/saved.js` and `src/more.js` and documenting the actual rendered difference between the two locations.

---

## Activation instructions
When any item in this spec is ready to be activated:
1. Move it to a new standalone spec file (e.g., `SPEC-013-doctors-gallery.md`)
2. Answer the "before expanding" questions in the new spec's research gate section
3. Fill in full before/after descriptions, file paths, CSS, and test checklist
4. Update this file: change the item's status to `deferred → active (see SPEC-013)`
