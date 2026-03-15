# MassFinder — Spec Sheet Index

**Last updated:** 2026-03-14 (9 specs implemented, 1 in-progress, 2 queued)

> **Freshness rule:** After each implementation session, update the status of items below. Check `docs/plans/` in the repo for the latest spec files.

---

## Active Specs

### UX_Spec_Saved_Find_Detail_Refinements.md (SFD series)
**Created:** 2026-03-13 · **Status:** Implemented  
| ID | Title | Status |
|----|-------|--------|
| SFD-01 | Find Tab — Live/Soon Card Overload (tiered badges) | Done |
| SFD-02 | Detail Panel — Mass Schedule Readability (today-first, inline times) | Done |
| SFD-03 | Detail Panel — Quick Actions & Contact Redesign | Done |
| SFD-04 | Detail Panel — Coming Up Today vs Tomorrow | Done |
| SFD-05 | Saved Tab — Your Churches Optimization | Done |
| SFD-06 | Saved Tab — Header & Today Card Hierarchy | Done |

### UX_Spec_Events_MoreTab_Refinements.md (EMT series)
**Created:** 2026-03-13 · **Status:** Implemented  
| ID | Title | Status |
|----|-------|--------|
| EMT-01 | Saved Tab Events — Category icons, seasonal tint, truncation | Done |
| EMT-02 | More Tab — Section reorder & spacing | Done |
| EMT-03 | More Tab — Prayer Tools Visual Upgrade | Done |
| EMT-04 | More Tab — Today's Readings Warmth | Done |
| EMT-05 | More Tab — Catholic Library Teaser | Done |

### UX_Spec_Church_Detail_Card_Refinements.md (CDC series)
**Created:** 2026-03-13 · **Status:** Implemented  
| ID | Title | Status |
|----|-------|--------|
| CDC-01 | Address Redundancy Dedup | Done |
| CDC-02 | Time Formatting Uniformity | Done |
| CDC-03 | Sacraments Accordion — Next Available | Done |
| CDC-04 | Adoration Accordion Polish | Done |
| CDC-05 | Prayer & Devotion Progressive Disclosure | Done |
| CDC-06 | Community Life Section Redesign | Done |
| CDC-07 | Notes Suppression & Truncation | Done |
| CDC-08 | Coming Up Label Day Context | Done |

### UX_Spec_Prayer_Tools_Refinements.md (PTR series)
**Created:** 2026-03-13 · **Status:** Implemented  
| ID | Title | Status |
|----|-------|--------|
| PTR-01 | CRITICAL: iOS Scroll-Through Bug | Done |
| PTR-02 | Desktop Immersive Backdrop | Done |
| PTR-03 | Examination Section-by-Section Flow | Done |
| PTR-04 | Examination Progress Dots | Done |
| PTR-05 | Reader Header Accent Line | Done |
| PTR-06 | Rosary Aesthetic Polish | Done |
| PTR-07 | Stations & Novena Polish | Done |
| PTR-08 | Dead CSS Cleanup | Done |

---

## Naming Convention

Spec IDs use a 3-letter prefix + 2-digit number:
- **SFD** = Saved / Find / Detail
- **EMT** = Events / More Tab
- **CDC** = Church Detail Card
- **PTR** = Prayer Tools Reader
- **BT1** = Backlog Triage Round 1
- **BT2** = Backlog Triage Round 2
- **CD2** = Church Detail Round 2
- **FGP** = Faith Guides & Prayer
- **BT3** = Backlog Triage Round 3
- **CCS** = Color Channel Separation
- **CSO** = Color System Overhaul
- **SOT** = Seasonal Offerings Triage

Future specs should continue this pattern with new prefixes.

---

## Queued Specs

### UX_Spec_Backlog_Triage_Round1.md (BT1 series)
**Created:** 2026-03-13 · **Status:** Implemented
**Backlog items:** IDEA-001, IDEA-002, IDEA-003, IDEA-004, IDEA-006, IDEA-008
**Claude Code prompt:** CLAUDE_CODE_PROMPT_BT1.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| BT1-01 | Liturgical Day Teaser Card: Design Uplift | Done | P3 |
| BT1-02 | Fasting Banner: SVG Icon, Dismissibility, Visual Polish | Done | P1 |
| BT1-03 | Readings: Gospel Border Consistency & Visual Warmth | Done | P2 |
| BT1-04 | Reference Snippets: Prevent Premature Dismissal | Done | P1 |
| BT1-05 | PWA Update Banner: Feedback, Styling, Auto-Dismiss | Done | P2 |
| BT1-06a | Map Tab: Bottom Gap Fix | Done | P1 |
| BT1-06b | Map Tab: Standalone Filter Chips | Done | P3 |

### UX_Spec_Backlog_Triage_Round2.md (BT2 series)
**Created:** 2026-03-13 · **Status:** Implemented
**Backlog items:** IDEA-021, IDEA-010, IDEA-017, IDEA-005
**Claude Code prompt:** CLAUDE_CODE_PROMPT_BT2.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| BT2-01 | Examen: CCC Pill Tap Toggles Parent Checkbox | Done | P1 |
| BT2-02 | Saved Tab: Schedule Time Column Alignment | Done | P1 |
| BT2-03 | Map: Filter Chips Overlap Zoom/Location Controls | Done | P1 |
| BT2-04 | Readings: Psalm Rendering Graceful Fallback | Done | P2 |

### UX_Spec_Church_Detail_Round2.md (CD2 series)
**Created:** 2026-03-13 · **Status:** Implemented
**Backlog items:** IDEA-012, IDEA-013, IDEA-014, IDEA-015, IDEA-016
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CD2.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| CD2-01 | Hero Banner: Merge Same-Day Services | Done | P2 |
| CD2-02 | Inline Schedule Badges: Padding & Touch Targets | Done | P2 |
| CD2-03 | Inline Times: Badge Density Threshold | Done | P2 |
| CD2-04 | Community Life: Collapsible Section | Done | P2 |
| CD2-05 | Footer Metadata: Structured Layout | Done | P3 |

### UX_Spec_Faith_Guides_Prayer.md (FGP series)
**Created:** 2026-03-13 · **Status:** Implemented
**Backlog items:** IDEA-011, IDEA-020
**Claude Code prompt:** CLAUDE_CODE_PROMPT_FGP.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| FGP-01 | Faith Guides: Icon System & Visual Hierarchy | Done | P3 |
| FGP-02 | Faith Guides: Progressive Disclosure Drawer | Done | P3 |
| FGP-03 | Faith Guides: Expanded State Accent & Polish | Done | P3 |
| FGP-04 | Rosary: "Mysteries Only" Condensed Mode | Done | P3 |

### UX_Spec_Backlog_Triage_Round3.md (BT3 series)
**Created:** 2026-03-14 · **Status:** In progress (24/28 done, 4 Phase 3 remaining)
**Backlog items:** IDEA-023, IDEA-024, IDEA-025, IDEA-026, IDEA-027, IDEA-028, IDEA-029, IDEA-030, IDEA-031, IDEA-033, IDEA-034, IDEA-035, IDEA-036, IDEA-037, IDEA-038, IDEA-039, IDEA-040, IDEA-041, IDEA-042, IDEA-043, IDEA-044, IDEA-045, IDEA-046, IDEA-048, IDEA-049, IDEA-050, IDEA-051, IDEA-052
**Claude Code prompt:** CLAUDE_CODE_PROMPT_BT3.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| BT3-01 | Exam Subtitle: "Confession" Not "Reconciliation" | Done | P1 |
| BT3-02 | Exam Header Not Centered | Done | P1 |
| BT3-03 | How-to-Confess Modal: Illegible, Inaccurate, Not Full-Screen | Done | P1 |
| BT3-04 | Exam: Unclear Selections Are Logged | Done | P1 |
| BT3-05 | Exam: Remove "Prayers" Group Label | Done | P2 |
| BT3-06 | Exam: Style Thanksgiving to Match Act of Contrition | Done | P2 |
| BT3-07 | Exam: Confession Tracker Feedback | Done | P2 |
| BT3-08 | Exam: Consolidate Exit Paths | Done | P2 |
| BT3-09 | Exam: Tooltip Step 1 Fix (ref BT3-03) | Done | P1 |
| BT3-10 | Exam: Full-Screen Modal (ref BT3-03) | Done | P2 |
| BT3-11 | Remove Fasting Banner from More Tab | Done | P2 |
| BT3-12 | Remove Gospel Special Formatting | Done | P2 |
| BT3-13 | Novena Card Elevation When Active | Queued | P3 |
| BT3-14 | Faith Guides: Remove Toggle and TLM | Done | P2 |
| BT3-15 | Remove Holy Days Dispensation Footnote | Queued | P3 |
| BT3-16 | Faith Guides Dark Mode Readability | Done | P1 |
| BT3-17 | Find Tab Sort Text Too Small | Done | P1 |
| BT3-18 | Saved Tab Schedule Font Too Small | Done | P1 |
| BT3-19 | Saved Tab Alternating Row Colors | Queued | P3 |
| BT3-20 | Chip Bar Swipe Triggers Refresh | Done | P1 |
| BT3-21 | YC Cards Subtler Design | Done | P2 |
| BT3-22 | Bottom Nav Bar Fixed Position Defense | Done | P1 |
| BT3-23 | Rosary Opening Prayers Collapsible | Queued | P2 |
| BT3-24 | CCC Pills Not Rendering in Faith Guides | Done | P1 |
| BT3-25 | Remove About Section from Settings | Done | P2 |
| BT3-26 | Map Chips to Bottom on Mobile | Done | P1 |
| BT3-27 | Detail Links Open in External Browser | Done | P2 |
| BT3-28 | PWA Banner Session Guard | Done | P2 |

### UX_Spec_Color_Channel_Separation.md (CCS series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (color system redesign — not from existing backlog)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CCS.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| CCS-01 | New Token Definitions (sacred, service, category) | Done | P1 |
| CCS-02 | Sacred Content Channel Migration (~22 rules + 16 rgba) | Done | P1 |
| CCS-03 | Service Type Dot Color Separation | Done | P1 |
| CCS-04 | Event Category Color Separation | Done | P1 |
| CCS-05 | YC Brand Color to Sacred Channel | Done | P1 |
| CCS-06 | Remaining Accent Usage Audit | Done | P2 |
| CCS-07 | Dark Mode Hardcoded Badge Audit | Done | P2 |
| CCS-08 | Saint Card Sacred Channel Migration | Done | P1 |
| CCS-09 | Confession Card Verified Color Audit | Done | P3 |

### UX_Spec_Color_System_Overhaul.md (CSO series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (follow-on to CCS — not from existing backlog)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CSO.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| CSO-01 | New Tokens (soon, notice) | Done | P1 |
| CSO-02 | Temporal Urgency Migration (27 rules) | Done | P1 |
| CSO-03 | Notice Banner Migration (10 rules) | Done | P1 |
| CSO-04 | Daily Card & Text Neutralization | Done | P2 |
| CSO-05 | Accent-Pale Ultra-Subtlety | Done | P2 |
| CSO-06 | Body Gradient Subtlety | Done | P2 |
| CSO-07 | Prayer Overlay Subtlety (15 rules) | Done | P2 |
| CSO-08 | Verification Counts | Done | P3 |

### UX_Spec_Seasonal_Offerings_Triage.md (SOT series)
**Created:** 2026-03-14 · **Status:** Queued
**Backlog items:** IDEA-053, IDEA-054, IDEA-055, IDEA-056, IDEA-057, IDEA-058, IDEA-059, IDEA-060, IDEA-061, IDEA-062, IDEA-063, IDEA-064, IDEA-065, IDEA-066
**Claude Code prompt:** CLAUDE_CODE_PROMPT_SOT.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| SOT-01 | Seasonal Moment Container (max 2-card zone) | Queued | P1 |
| SOT-02 | Liturgical Color Indicator in Saint Card (IDEA-057) | Queued | P1 |
| SOT-03 | Novena Auto-Surfacing in Prayer Tools Grid (IDEA-055) | Queued | P1 |
| SOT-04 | Seasonal CCC Spotlight in dailyFormation Slot (IDEA-060) | Queued | P2 |
| SOT-05 | Holy Week Day-by-Day Guide (IDEA-056) | Queued | P1 |
| SOT-06 | Easter Alleluia + Regina Caeli (IDEA-061) | Queued | P1 |
| SOT-07 | Divine Mercy Sunday Experience (IDEA-066) | Queued | P1 |
| SOT-08 | Pentecost Novena Countdown (IDEA-065) | Queued | P1 |
| SOT-09 | Monthly Devotion Card (IDEA-053) | Queued | P2 |
| SOT-10 | O Antiphons — Dec 17-23 (IDEA-054) | Queued | P2 |
| SOT-11 | Advent Wreath Devotion (IDEA-058) | Deferred Phase 2 | P3 |
| SOT-12 | First Friday/Saturday Tracker (IDEA-059) | Deferred Phase 3 | P3 |
| SOT-13 | Seasonal Scripture Spotlight (IDEA-063) | Deferred Phase 3 | P3 |
| SOT-14 | Marian Consecration Countdown (IDEA-064) | Deferred Phase 4 | P3 |
| SOT-15 | Ember Days Awareness (IDEA-062) | Deferred Phase 3 | P3 |
