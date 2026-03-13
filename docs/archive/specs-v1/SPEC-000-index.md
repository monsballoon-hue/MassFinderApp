# MassFinder — Spec Index
**Generated:** 2026-03-12 | **Source:** IDEAS.md (IDEA-001 → IDEA-056)
**Total specs:** 12 | **Total items:** 46 | **Total ideas processed:** 55/56

---

## Quick-pick by executor

### Claude Code / Sonnet — Ready to run now
| Spec | Title | Items | Est. |
|------|-------|-------|------|
| SPEC-001 | Docs housekeeping | A–G (7 items) | 1 hr |
| SPEC-002 | Rosary + Stations bugs | A–F (6 items) | 3–4 hr |
| SPEC-003 | Examination of Conscience bugs | A–F (6 items) | 2–3 hr |
| SPEC-004 | Novena UX & bugs | A–B (2 items) | 1.5 hr |
| SPEC-005 | Saved tab UX & bugs | A–G (7 items) | 2.5 hr |
| SPEC-006 | More tab / CCC / Bible refinements | A–C (3 items) | 1.5 hr |
| SPEC-007 | Web Speech read-aloud | A (1 item) | 45 min |
| SPEC-011 | Small enhancements (Stations V/R + phone link) | A–B (2 items) | 45 min |

### Claude Code / Opus — Requires architectural judgment
| Spec | Title | Items | Est. |
|------|-------|-------|------|
| SPEC-008 | Build scripts (romcal + build-examination) | A–B (2 items) | 4 hr |

### Claude Opus (design) → then Claude Code
| Spec | Title | Gate | Items |
|------|-------|------|-------|
| SPEC-009 | Summa / Catholic Classics daily wisdom card | Research gate SPEC-009-R | R + A + B |
| SPEC-010 | "Pray for Me" intentions counter | Research gate SPEC-010-R | R + A |

### Deferred — Do not start
| Spec | Title | Reason |
|------|-------|--------|
| SPEC-012 | Stretch & pie-in-sky features | 10 items, open design questions, low priority |

---

## All items cross-reference (IDEA → SPEC)

| IDEA | Title | Spec | Item |
|------|-------|------|------|
| IDEA-001 | Update CLAUDE.md | SPEC-001 | A |
| IDEA-002 | romcal offline calendar | SPEC-008 | B |
| IDEA-003 | Web Speech read-aloud | SPEC-007 | A |
| IDEA-004 | build-examination.js | SPEC-008 | A |
| IDEA-005 | Summa daily wisdom card | SPEC-009 | A + B |
| IDEA-006 | Pray for Me counter | SPEC-010 | A |
| IDEA-007 | Latin/English toggle | SPEC-012 | A |
| IDEA-008 | Gregorian chant links | SPEC-012 | B |
| IDEA-009 | Catholic hierarchy data | SPEC-012 | C |
| IDEA-010 | Ambient prayer tones | SPEC-012 | D |
| IDEA-011 | Bluetooth rosary | SPEC-012 | E |
| IDEA-012 | Doctors of the Church gallery | SPEC-012 | F |
| IDEA-013 | Remove Node v12 warnings | SPEC-001 | B |
| IDEA-014 | Add --font-prayer to STYLE_GUIDE | SPEC-001 | C |
| IDEA-015 | Mark catalog items done | SPEC-001 | D |
| IDEA-016 | Update ROADMAP metrics | SPEC-001 | E |
| IDEA-017 | Update INTEGRATIONS.md | SPEC-001 | F |
| IDEA-018 | Archive superseded docs | SPEC-001 | G |
| IDEA-019 | Research: backend for intentions | SPEC-010 | R |
| IDEA-020 | Research: romcal API | SPEC-008 | B (pre-step) |
| IDEA-021 | Research: Summa placement UX | SPEC-009 | R |
| IDEA-022 | Font size audit | SPEC-005 | A (scope) |
| IDEA-023 | Saved tab text too small | SPEC-005 | A |
| IDEA-024 | Research: Prayer Life tab placement | SPEC-012 | J |
| IDEA-025 | Universal card rendering broken | SPEC-002–003 | (root cause across multiple items) |
| IDEA-026 | Redundant season sub-label (More) | SPEC-006 | A |
| IDEA-027 | Rosary nav buttons bunched left | SPEC-002 | A |
| IDEA-028 | Rosary Hail Mary beads overflow | SPEC-002 | B |
| IDEA-029 | Rosary Bible back-nav loses place | SPEC-002 | F |
| IDEA-030 | Rosary CCC inline no spacing | SPEC-002 | D |
| IDEA-031 | Rosary back resets decade to zero | SPEC-002 | C |
| IDEA-032 | Examination lands scrolled to bottom | SPEC-003 | A |
| IDEA-033 | Examination "No items" visible early | SPEC-003 | B |
| IDEA-034 | Examination progress tracker too tall | SPEC-003 | C |
| IDEA-035 | Examination CCC loses examen progress | SPEC-003 | E |
| IDEA-036 | Examination "Prayers" label alignment | SPEC-003 | D |
| IDEA-037 | Reconciliation confirmation clashes | SPEC-003 | F |
| IDEA-038 | Stations nav buttons left-aligned | SPEC-002 | E |
| IDEA-039 | Stations V/R divs waste space | SPEC-011 | A |
| IDEA-040 | Stations Bible back-nav loses place | SPEC-002 | F |
| IDEA-041 | Novena card too small | SPEC-004 | A |
| IDEA-042 | Novena no way to advance to today | SPEC-004 | B |
| IDEA-043 | Bible highlight not prominent enough | SPEC-006 | B |
| IDEA-044 | Dot on Saved greeting (investigate) | SPEC-005 | E |
| IDEA-045 | Today's events vs future events | SPEC-005 | G |
| IDEA-046 | "Lenten Season" label question | SPEC-005 | D (resolved in) |
| IDEA-047 | Suppress season label in Ordinary Time | SPEC-005 | D |
| IDEA-048 | Your Churches buttons too small | SPEC-005 | B |
| IDEA-049 | Replace Prayer Life with hotkeys | SPEC-012 | G |
| IDEA-050 | Dot on heart tab icon (investigate) | SPEC-005 | F |
| IDEA-051 | Research: is Summa too advanced? | SPEC-009 | R |
| IDEA-052 | CCC See Also clipped | SPEC-006 | C |
| IDEA-053 | Reimagine Prayer Life as tracker | SPEC-012 | H |
| IDEA-054 | Directions → Apple Maps on iOS | SPEC-005 | C |
| IDEA-055 | Reflection card journaling prompt | SPEC-012 | I |
| IDEA-056 | Phone number as call link | SPEC-011 | B |

**Not processed:** IDEA-025 (universal card root cause — documented as context note across SPEC-002 and SPEC-003, addressed symptom-by-symptom in those specs)

---

## Recommended execution order

### Pass 1 — Quick wins (no risk, high confidence)
1. SPEC-001 (docs)
2. SPEC-007 (read-aloud — standalone, 30 min)
3. SPEC-011 (V/R labels + phone link — small, isolated)
4. SPEC-006-A (remove redundant season label — 1 removal)
5. SPEC-006-C (CCC clipping — 2 CSS lines)

### Pass 2 — Bug fixes (most user-visible)
6. SPEC-003 (Examination — all 6 items, order A→B→C→D→E→F)
7. SPEC-004 (Novena — A then B)
8. SPEC-002-A + SPEC-002-B + SPEC-002-E (Rosary/Stations layout)
9. SPEC-002-C + SPEC-002-D (Rosary state + spacing)
10. SPEC-005-A + SPEC-005-B (Saved tab sizing — older user priority)
11. SPEC-005-C (Directions → Apple Maps)

### Pass 3 — Behavior + refinements
12. SPEC-002-F (back-nav — touches 4 modules, save for after other prayer fixes are stable)
13. SPEC-005-D (season label suppression — shared utility across 2 tabs)
14. SPEC-005-E + SPEC-005-F (dot investigations)
15. SPEC-005-G (today vs future events)
16. SPEC-006-B (Bible highlight)

### Pass 4 — Build infrastructure
17. SPEC-008-A (build-examination)
18. SPEC-008-B (romcal)

### Pass 5 — New features (after Opus research gates)
19. SPEC-009 (wisdom card — after SPEC-009-R resolved)
20. SPEC-010 (pray for me — after SPEC-010-R resolved)

### Deferred indefinitely
21. SPEC-012 (stretch features)
