# MassFinder — Spec Sheet Index

**Last updated:** 2026-03-15 (20 specs implemented, 0 in-progress, 5 queued)

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
- **PMG** = Pocket Missal — Grid Restructure
- **PMB** = Pocket Missal — Prayer Book
- **PMD** = Pocket Missal — Devotions Expansion

- **PMD** = Pocket Missal — Devotions Expansion
- **SLV** = Soul / Visual Language
- **BT4** = Backlog Triage Round 4
- **MTR** = More Tab Restructure
- **PHF** = Pastoral Handoff

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
**Created:** 2026-03-14 · **Status:** Implemented
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
| BT3-13 | Novena Card Elevation When Active | Done | P3 |
| BT3-14 | Faith Guides: Remove Toggle and TLM | Done | P2 |
| BT3-15 | Remove Holy Days Dispensation Footnote | Done | P3 |
| BT3-16 | Faith Guides Dark Mode Readability | Done | P1 |
| BT3-17 | Find Tab Sort Text Too Small | Done | P1 |
| BT3-18 | Saved Tab Schedule Font Too Small | Done | P1 |
| BT3-19 | Saved Tab Alternating Row Colors | Done | P3 |
| BT3-20 | Chip Bar Swipe Triggers Refresh | Done | P1 |
| BT3-21 | YC Cards Subtler Design | Done | P2 |
| BT3-22 | Bottom Nav Bar Fixed Position Defense | Done | P1 |
| BT3-23 | Rosary Opening Prayers Collapsible | Done | P2 |
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
**Created:** 2026-03-14 · **Status:** Phase 1 Implemented (11/15 done, 4 deferred)
**Backlog items:** IDEA-053, IDEA-054, IDEA-055, IDEA-056, IDEA-057, IDEA-058, IDEA-059, IDEA-060, IDEA-061, IDEA-062, IDEA-063, IDEA-064, IDEA-065, IDEA-066
**Claude Code prompt:** CLAUDE_CODE_PROMPT_SOT.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| SOT-01 | Seasonal Moment Container (max 2-card zone) | Done | P1 |
| SOT-02 | Liturgical Color Indicator in Saint Card (IDEA-057) | Done | P1 |
| SOT-03 | Novena Auto-Surfacing in Prayer Tools Grid (IDEA-055) | Done | P1 |
| SOT-04 | Seasonal CCC Spotlight in dailyFormation Slot (IDEA-060) | Deferred | P2 |
| SOT-05 | Holy Week Day-by-Day Guide (IDEA-056) | Done | P1 |
| SOT-06 | Easter Alleluia + Regina Caeli (IDEA-061) | Done | P1 |
| SOT-07 | Divine Mercy Sunday Experience (IDEA-066) | Done | P1 |
| SOT-08 | Pentecost Novena Countdown (IDEA-065) | Done | P1 |
| SOT-09 | Monthly Devotion Card (IDEA-053) | Done | P2 |
| SOT-10 | O Antiphons — Dec 17-23 (IDEA-054) | Done | P2 |
| SOT-11 | Advent Wreath Devotion (IDEA-058) | Deferred Phase 2 | P3 |
| SOT-12 | First Friday/Saturday Tracker (IDEA-059) | Done | P3 |
| SOT-13 | Seasonal Scripture Spotlight (IDEA-063) | Deferred Phase 3 | P3 |
| SOT-14 | Marian Consecration Countdown (IDEA-064) | Deferred Phase 4 | P3 |
| SOT-15 | Ember Days Awareness (IDEA-062) | Deferred Phase 3 | P3 |

### UX_Spec_Pocket_Missal_Grid.md (PMG series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (Pocket Missal initiative — prerequisite for PMB/PMD)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PMG.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PMG-01 | Always-2-Column Primary Grid | Done | P1 |
| PMG-02 | Secondary Compact Row (3-up) | Done | P1 |
| PMG-03 | Vertical Card Layout for Primary Cards | Done | P1 |
| PMG-04 | Promoted Card Swap Logic | Done | P2 |
| PMG-05 | Library Teaser Repositioning | Done | P3 |
| PMG-06 | Dark Mode Parity | Done | P1 |

### UX_Spec_Pocket_Missal_PrayerBook.md (PMB series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (Pocket Missal initiative — biggest content gap)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PMB.md
**Depends on:** PMG
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PMB-01 | Prayer Book Data File | Done | P1 |
| PMB-02 | Reader Module Registration & Selection Screen | Done | P1 |
| PMB-03 | Prayer Text Display & Expand/Collapse | Done | P1 |
| PMB-04 | Search Input (Sticky) | Done | P2 |
| PMB-05 | V/R Formatting for Call-and-Response Prayers | Done | P2 |
| PMB-06 | Litany Step-Through Mode (Humility + Trust) | Done | P2 |
| PMB-07 | Lectio Divina Guided Experience | Done | P3 |
| PMB-08 | Prayer Tools Grid Card Entry Point | Done | P1 |
| PMB-09 | Dark Mode Parity | Done | P1 |

### UX_Spec_Pocket_Missal_Devotions.md (PMD series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (Pocket Missal initiative — chaplet, novenas, seasonal)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PMD.md
**Depends on:** PMG
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PMD-01 | Divine Mercy Chaplet — Reader Module | Done | P1 |
| PMD-02 | Divine Mercy Chaplet — Guided Bead Experience | Done | P1 |
| PMD-03 | Divine Mercy Chaplet — Grid Card & Contextual Promotion | Done | P1 |
| PMD-04 | Novena Data Expansion (6 new novenas) | Done | P2 |
| PMD-05 | Novena Tracker — Variable Day Count Support | Done | P2 |
| PMD-06 | Angelus / Regina Caeli — Seasonal Moment Candidate | Done | P3 |
| PMD-07 | Seasonal Card Cross-Links to New Tools | Done | P3 |
| PMD-08 | Dark Mode Parity | Done | P1 |

### UX_Spec_Soul_Visual_Language.md (SLV series)
**Created:** 2026-03-14 · **Status:** Implemented
**Backlog items:** New (visual soul & warmth initiative — not from existing backlog)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_SLV.md
**Depends on:** None (builds on existing seasonal infrastructure)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| SLV-01 | Season Transition Moment (CSS transition + interstitial overlay) | Done | P1 |
| SLV-02 | Typography with a Voice (drop cap, small-caps LORD, warm shadow, letter-spacing) | Done | P1 |
| SLV-03 | Candlelight Halo (sacred glow signature on key cards) | Done | P1 |
| SLV-04 | Season as Emotional Temperature (timing token shifts per season) | Done | P2 |
| SLV-05 | Warm Sacred Surfaces (targeted surface warmth on sacred cards) | Done | P2 |
| SLV-06 | Intentional Asymmetry (saint card padding) | Done | P3 |

### UX_Spec_More_Tab_Restructure.md (MTR series)
**Created:** 2026-03-15 · **Status:** Implemented
**Backlog items:** New (content architecture — not from existing backlog)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_MTR.md
**Depends on:** SOT, PMG, PMB, PMD (all implemented)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| MTR-01 | Zone Container Architecture | Done | P1 |
| MTR-02 | Section Title Typography Differentiation | Done | P2 |
| MTR-03 | Secondary Prayer Tools Progressive Disclosure | Done | P2 |
| MTR-04 | Reading Entries Compact Mode | Done | P3 |
| MTR-05 | Library Teaser Repositioned | Done | P3 |
| MTR-06 | Zone 1 Internal Spacing Refinement | Done | P2 |
| MTR-07 | Devotional Guide Count When Collapsed | Done | P3 |

### UX_Spec_Pastoral_Handoff.md (PHF series)
**Created:** 2026-03-15 · **Status:** Implemented
**Source:** Pastoral Advisor (Fr. Mike) handoff
**Backlog items:** IDEA-074 through IDEA-080
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PHF.md
**Depends on:** Reader system (implemented), Devotional guides (implemented)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PHF-01 | Confession Guide — Reader Module Registration | Done | P1 |
| PHF-01a | Confession Guide Nudge in Detail Panel | Done | P1 |
| PHF-01b | Confession Guide Hint on Find Tab Filter | Done | P2 |
| PHF-02a | Reader Close Button — 44pt Touch Target | Done | P1 |
| PHF-02b | Persistent Swipe Hint in Rosary Footer | Done | P2 |
| PHF-02c | Prayer Text Size Boost at Large Setting | Done | P2 |
| PHF-02d | Reader Overlay Continuity Cue | Done | P3 |

### UX_Spec_Sacred_Pause_System.md (SLV series addendum)
**Created:** 2026-03-15 · **Status:** Implemented
**Backlog items:** New (sacred pause pattern — extends SLV visual language)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_SLV_PAUSE.md
**Depends on:** SLV-01 (season transition becomes first consumer of shared system)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| SLV-07 | Sacred Pause Infrastructure (reusable overlay system with session cap, storage guards, sequencing) | Done | P1 |
| SLV-08 | Prayer Tool Entry Pause (centering moment before rosary, chaplet, stations, novena, prayerbook) | Done | P1 |
| SLV-09 | Holy Day & Solemnity Recognition (Easter, Christmas, Pentecost, Good Friday, HDOs) | Done | P2 |
| SLV-10 | Readings Liturgical Day Header (day name + color dot above daily readings) | Done | P3 |
| SLV-11 | Examination Centering Screen Enhancement (warm gold treatment, sacred glow, larger prayer text) | Done | P3 |

### UX_Spec_Prayer_More_V2.md (PMV series) — Final
**Created:** 2026-03-15 · **Status:** Spec ready
**Backlog items:** IDEA-101 (prayer tools grid restructure)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PMV.md
**Scope:** Zone 2 only. Zone 1, Zone 3, library teaser, CCC/Bible surfacing untouched.
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PMV-02 | Fixed 2×2 Guided Prayer Grid | Queued | P1 |
| PMV-03 | Prayer Book Full-Width Gateway Card | Queued | P1 |
| PMV-04 | Your Practice Compact Tracker Strip | Queued | P1 |
| PMV-07 | Contextual Promotion Simplification | Queued | P1 |

### UX_Spec_Prayer_Book_Refinements.md (PBR series) — Final
**Created:** 2026-03-15 · **Status:** Spec ready
**Backlog items:** IDEA-102 (Prayer Book internal navigation)
**Claude Code prompt:** CLAUDE_CODE_PROMPT_PBR.md
**Depends on:** PMV series (implement after PMV)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| PBR-01 | Remove Sacred Pause from Prayer Book | Queued | P1 |
| PBR-02 | Quick Access Pills for Essential Prayers | Queued | P1 |
| PBR-03 | Guided Content Visual Distinction | Queued | P2 |
| PBR-04 | Prayer Length Indicators | Queued | P3 |
| PBR-05 | Recently Opened Prayers | Queued | P2 |

### UX_Spec_Backlog_Triage_Round_4.md (BT4 series)
**Created:** 2026-03-15 · **Status:** Implemented
**Backlog items:** IDEA-103, IDEA-108, IDEA-109, IDEA-110, IDEA-111, IDEA-113, IDEA-115, IDEA-117, IDEA-118
**Claude Code prompt:** CLAUDE_CODE_PROMPT_BT4.md
**Depends on:** None
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| BT4-01 | Exam Opening Prayer Overflow Fix | Done | P1 |
| BT4-02 | Prayer Book Duplicate Render Fix | Done | P1 |
| BT4-03 | Find Tab Chip Animation Speed Fix | Done | P1 |
| BT4-04 | Chaplet Same-Prayer Fade Skip | Done | P2 |
| BT4-05 | Practice Tile Border + Concise Labels | Done | P2 |
| BT4-06 | Novena List Visual Hierarchy + Sort | Done | P2 |
| BT4-07 | Growing Faith Section Collapse Removal | Done | P2 |
| BT4-08 | Sacred Font Token Consistency | Done | P2 |
| BT4-09 | Text Size x-large (22px) Option | Done | P2 |

### Content_Spec_Audit_v1.md (CON series)
**Created:** 2026-03-15 · **Status:** Implemented (28/29 done, CON-28 blocked)
**Audit source:** Content_Audit_Full_v1.md
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CON.md
**Depends on:** CON-28 requires Catholic Review sign-off before implementation
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| CON-01 | Sunday Obligation Guide — Warmth-First Rewrite | Done | P1 |
| CON-02 | Saved Tab Empty State Rewrite | Done | P1 |
| CON-03 | Lent Guide — Collapsible Restructure | Done | P1 |
| CON-04 | Easter Guide — Collapsible Restructure | Done | P2 |
| CON-05 | Advent Guide — Collapsible Restructure | Done | P2 |
| CON-06 | Christmas Guide — Collapsible Restructure | Done | P2 |
| CON-07 | "The faithful" → "You" Pass | Done | P2 |
| CON-08 | Prayer Book Gateway — Remove Hardcoded Count | Done | P2 |
| CON-09 | "No churches found" Empty State | Done | P2 |
| CON-10 | Fasting Banner — Add Context | Done | P2 |
| CON-11 | Sparse Weekday Message | Done | P2 |
| CON-12 | Toast Message Standardization | Done | P2 |
| CON-13 | Monthly Devotion Cards — Expand & Add CTAs | Done | P2 |
| CON-14 | Footer Identity Line | Done | P3 |
| CON-15 | Remove "Coming Soon" Promises | Done | P3 |
| CON-16 | About Section — App Identity Copy | Done | P1 |
| CON-17 | Ordinary Time Devotional Guide | Done | P2 |
| CON-18 | Prayer Book Header Line | Done | P3 |
| CON-19 | Novena Newcomer Intro | Done | P3 |
| CON-20 | Rosary Mystery Descriptors | Done | P3 |
| CON-21 | Stations Duration Line | Done | P3 |
| CON-22 | Examination Expectation-Setting | Done | P3 |
| CON-23 | Search Placeholder Enhancement | Done | P3 |
| CON-24 | Explore Module Source Subtitles | Done | P3 |
| CON-25 | Ordinary Time Saved Tab Greeting | Done | P3 |
| CON-26 | Chaplet Intro Description | Done | P3 |
| CON-27 | "centred" Typo Fix | Done | P3 |
| CON-28 | Act of Contrition Alignment | Blocked (Catholic Review) | P1 |
| CON-29 | Loading Message Polish | Done | P3 |

### UX_Spec_Onboarding_Walkthrough.md (OBW series)
**Created:** 2026-03-15 · **Status:** Queued
**Source:** Content_Audit_Full_v1.md (D-01), Content & Voice requirements
**Claude Code prompt:** CLAUDE_CODE_PROMPT_OBW.md
**Depends on:** install-guide.js (existing, no changes needed)
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| OBW-01 | Overlay Container & Layout Structure | Queued | P1 |
| OBW-02 | Step 1 — Find | Queued | P1 |
| OBW-03 | Step 2 — Save | Queued | P1 |
| OBW-04 | Step 3 — Pray/Learn/Grow | Queued | P1 |
| OBW-05 | Step 4 — Install (conditional) | Queued | P1 |
| OBW-06 | Standalone Detection & Step Array | Queued | P1 |
| OBW-07 | Dismiss Behavior & Persistence | Queued | P1 |
| OBW-08 | Desktop & Tablet Adaptation | Queued | P2 |

### UX_Spec_Contextual_Filter_Hints.md (CLH series)
**Created:** 2026-03-15 · **Status:** Queued
**Backlog items:** IDEA-120, IDEA-121, IDEA-122
**Claude Code prompt:** CLAUDE_CODE_PROMPT_CLH.md
| ID | Title | Status | Priority |
|----|-------|--------|----------|
| CLH-01 | Generalize Filter Hints to Data-Driven System | Queued | P1 |
| CLH-02 | Register Adoration Guide as Reader Module | Queued | P1 |
| CLH-03 | Adoration Filter Hint | Queued | P2 |
| CLH-04 | Fix Dismiss Button Touch Target (44pt) | Queued | P1 |
| CLH-05 | Latin Filter Hint (Placeholder — Needs Content) | Queued | P3 |

### Content_Spec_LatinMass.md (CON-30)
**Created:** 2026-03-15 · **Status:** Awaiting Catholic Review
| ID | Title | Status |
|----|-------|--------|
| CON-30 | What to Expect at a Latin Mass — devotional guide | Awaiting Review |

> **Note:** CON-30 content also provides the text needed for CLH-05 (Latin Filter Hint).
