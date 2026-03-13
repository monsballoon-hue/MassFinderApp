# SPEC-001 — Docs Housekeeping
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Code / Sonnet
**Estimated total effort:** ~1 hour

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-001-A | IDEA-001 | Replace CLAUDE.md | open |
| SPEC-001-B | IDEA-013 | Remove Node v12 warnings from ANTI_PATTERNS.md | open |
| SPEC-001-C | IDEA-014 | Add --font-prayer to STYLE_GUIDE.md | open |
| SPEC-001-D | IDEA-015 | Mark completed items ✓ DONE in Master Feature Catalog | open |
| SPEC-001-E | IDEA-016 | Update ROADMAP.md metrics | open |
| SPEC-001-F | IDEA-017 | Update INTEGRATIONS.md for shipped Bible + calendar | open |
| SPEC-001-G | IDEA-018 | Archive superseded planning docs | open |

---

## Context for Claude Code
This spec contains documentation-only changes. No JS or CSS is modified. All items are independent and can be executed in any order. Items SPEC-001-D through SPEC-001-G require reading the target files before editing — do not guess at their current content.

**Design principles reminder (docs must reflect these):**
- Three-font system: `--font-prayer` (Georgia) for sacred text, `--font-display` (Playfair Display) for headings, `--font-body` (Source Sans 3) for UI
- CommonJS everywhere, no arrow functions
- Config.js is canonical for enums

---

## SPEC-001-A — Replace CLAUDE.md
**Origin:** IDEA-001 | **Status:** open

### Goal
Replace the root `CLAUDE.md` with the updated version produced during the 2026-03-11 audit. After replacement, verify the file reads cleanly and mark OW-01 and DOC-03 as done in `docs/plans/MassFinder_Master_Feature_Catalog.md`.

### Files affected
- `CLAUDE.md` (root)
- `docs/plans/MassFinder_Master_Feature_Catalog.md`

### Steps
1. Read current `CLAUDE.md` to confirm what is stale.
2. The 2026-03-11 audit produced a replacement version. If that version is present in the repo as a draft file (e.g., `CLAUDE_NEW.md`, `CLAUDE_updated.md`, or similar), copy it over `CLAUDE.md` and delete the draft.
3. If no draft file exists, read the current `CLAUDE.md` carefully and update it to reflect the current architecture as described in `PROJECT_CONTEXT.md`: 24 modules, esbuild IIFE build, correct module list, correct data file list, correct design principles (three-font system, SVG only, CommonJS, no arrow functions, etc.).
4. In `docs/plans/MassFinder_Master_Feature_Catalog.md`, find entries for OW-01 and DOC-03 and mark them `✓ DONE` with strikethrough.

### Test checklist
- [ ] `CLAUDE.md` references all 24 src/ modules by name
- [ ] `CLAUDE.md` lists `--font-prayer` (Georgia) in design principles
- [ ] `CLAUDE.md` does not reference any superseded architecture (e.g., old bundler, old module count)
- [ ] OW-01 and DOC-03 are marked done in Master Feature Catalog
- [ ] No draft/temp CLAUDE file remains in the repo root

### Claude Code notes
Read the file before touching it. If a draft replacement exists anywhere in the repo, use it. Otherwise update in place against PROJECT_CONTEXT.md as the source of truth.

---

## SPEC-001-B — Remove Node v12 warnings from ANTI_PATTERNS.md
**Origin:** IDEA-013 | **Status:** open

### Goal
`docs/ANTI_PATTERNS.md` contains sections warning about Node v12 compatibility. The project engine requirement is now `>=18` and CI runs Node 20. Remove all v12-specific warnings and any outdated engine guidance.

### Files affected
- `docs/ANTI_PATTERNS.md`

### Before
Sections referencing Node v12 limitations, e.g.:
```
> ⚠️ Node v12 does not support optional chaining — use lodash.get() instead.
```
or engine guard blocks like:
```
engines: { node: ">=12" }
```

### After
Remove the v12-specific warning blocks entirely. If a section only exists to warn about v12, delete the whole section. If a section has broader anti-pattern guidance with v12 notes mixed in, remove just the v12 notes and leave the rest.

### Test checklist
- [ ] No occurrences of "v12", "node 12", or ">=12" remain in the file
- [ ] No anti-pattern sections have been accidentally deleted in full when only part of them was stale
- [ ] File still has correct markdown structure (headings, code blocks intact)
- [ ] `package.json` engines field reads `>=18` (read-only verification, do not change it here)

### Claude Code notes
Read the full file first. Remove v12 content surgically — do not rewrite sections that are otherwise still accurate.

---

## SPEC-001-C — Add --font-prayer to STYLE_GUIDE.md
**Origin:** IDEA-014 | **Status:** open

### Goal
`--font-prayer` (Georgia) is used throughout the app for sacred/contemplative text but is absent from the design tokens table in `docs/STYLE_GUIDE.md`. Document the full three-font system and add component usage examples for contemplative text styling.

### Files affected
- `docs/STYLE_GUIDE.md`

### Before
Design tokens table has `--font-display` and `--font-body` but no `--font-prayer` entry. Component examples for contemplative text (rosary prayers, CCC body text, examination prayers, stations text) either use an undocumented token or use the font directly.

### After
**Add to the design tokens table** (find the existing fonts section and insert):
```
| --font-prayer | Georgia, 'Times New Roman', serif | Sacred and contemplative text — rosary prayers, CCC body, examination prayers, stations of the cross text |
```

**Add or update a "Three-Font System" section** explaining:
- `--font-display` (Playfair Display): headings, card titles, sheet headers
- `--font-body` (Source Sans 3): all UI chrome, labels, navigation, form elements
- `--font-prayer` (Georgia): any text that is being prayed or read meditatively — rosary prayer text, CCC paragraph bodies, examination items, stations scripture, novena prayer text

**Add a "Contemplative Text Styling" component example:**
```css
/* Contemplative / prayer text */
.prayer-text {
  font-family: var(--font-prayer);
  font-size: 1.05rem;
  line-height: 1.7;
  color: var(--color-text-primary);
}
```

### Test checklist
- [ ] `--font-prayer` appears in the design tokens table with correct value and usage note
- [ ] Three-font system is documented as a cohesive unit (display / body / prayer)
- [ ] At least one CSS component example uses `var(--font-prayer)`
- [ ] Dark mode implications noted (font itself doesn't change in dark mode, color tokens do)
- [ ] Markdown renders correctly — no broken tables or code blocks

### Claude Code notes
Read the current STYLE_GUIDE.md first. Insert into the existing fonts section rather than appending a new disconnected section at the bottom. Preserve the file's existing structure and heading hierarchy.

---

## SPEC-001-D — Mark completed catalog items ✓ DONE
**Origin:** IDEA-015 | **Status:** open

### Goal
Five items are fully implemented in code but still show as open in `docs/plans/MassFinder_Master_Feature_Catalog.md`. Mark them as done.

### Files affected
- `docs/plans/MassFinder_Master_Feature_Catalog.md`

### Items to mark done
| Catalog ID | Description |
|------------|-------------|
| DAT-07 | Bible cross-references |
| BLD-04 | build-bible-drb.js |
| BLD-05 | build-lectionary.js |
| BLD-06 | build-litcal.js |
| XREF-02 | Tappable scripture references |

Also confirm: the entry for LIB-05 should read `REVERTED` — verify the current text is accurate, correct it if not.

### Before (example)
```markdown
- [ ] DAT-07 — Bible cross-references
```

### After (example)
```markdown
- [x] ~~DAT-07~~ — Bible cross-references ✓ DONE
```

### Test checklist
- [ ] All five items (DAT-07, BLD-04, BLD-05, BLD-06, XREF-02) are marked with strikethrough and ✓ DONE
- [ ] LIB-05 REVERTED text is verified accurate
- [ ] No other items were accidentally changed
- [ ] Markdown renders correctly (checkboxes, strikethrough)

### Claude Code notes
Read the full catalog file before making any edits. Use str_replace for targeted edits — do not rewrite the file wholesale.

---

## SPEC-001-E — Update ROADMAP.md metrics
**Origin:** IDEA-016 | **Status:** open

### Goal
`docs/ROADMAP.md` contains stale metrics. Update them to match the current production state.

### Files affected
- `docs/ROADMAP.md`

### Corrections required
| Metric | Stale value | Correct value |
|--------|-------------|---------------|
| Validated parishes | 28 | 91 |
| Services | ~1,407 | ~1,690 |

Also: review the batch structure section — if it references batches of 28 or interim milestones that have now been surpassed, update or remove those milestone markers.

### Test checklist
- [ ] "28 validated" or similar no longer appears anywhere in the file
- [ ] "~1,407 services" or similar no longer appears anywhere in the file
- [ ] Correct figures (91 validated, ~1,690 services) appear in the appropriate places
- [ ] No other content was accidentally altered
- [ ] File still renders valid markdown

### Claude Code notes
Read the full file first. Use str_replace for targeted replacements. Do not rewrite narrative sections — only update the numbers.

---

## SPEC-001-F — Update INTEGRATIONS.md for shipped Bible + calendar
**Origin:** IDEA-017 | **Status:** open

### Goal
`docs/INTEGRATIONS.md` is missing documentation for several integrations that have already shipped. Add accurate current descriptions and remove any "future work" language for these items.

### Files affected
- `docs/INTEGRATIONS.md`

### Integrations to add or correct
| Integration | Status to document |
|-------------|-------------------|
| DRB Bible (Douay-Rheims) | Shipped — per-book lazy load from `data/bible-drb/` |
| CPDV Bible (Catholic Public Domain Version) | Shipped — per-book lazy load from `data/bible-cpdv/` |
| BibleGet verse integration | Shipped — used for inline verse lookups |
| Pre-built litcal JSON | Shipped — `data/litcal-2026.json` + `data/litcal-2027.json` |
| bible-xrefs | Shipped — `data/bible-xrefs` 4MB cross-reference file |

For each: document the data source, file location, lazy-load strategy, and any relevant build script.

Remove any language suggesting these integrations are planned, in-progress, or future work.

### Test checklist
- [ ] All five integrations are documented with current/accurate descriptions
- [ ] No "future work," "planned," or "TODO" language remains for these five items
- [ ] File structure and heading hierarchy is preserved
- [ ] No other integrations were accidentally modified

### Claude Code notes
Read the full INTEGRATIONS.md before editing. If the file has a consistent format for each integration entry (e.g., table row, headed section), match that format for the new/updated entries.

---

## SPEC-001-G — Archive superseded planning docs
**Origin:** IDEA-018 | **Status:** open

### Goal
Five planning documents describe work that is now fully complete. Their presence in `docs/plans/` risks confusing Claude Code in future sessions. Move them to `docs/archive/` (creating that directory if needed).

### Files affected
- `docs/plans/CCC_BottomSheet_UX_Redesign.md` → `docs/archive/`
- `docs/plans/MassFinder_Redesign_Audit_v3.md` → `docs/archive/`
- `docs/plans/MassFinder_UX_Implementation_Spec_Amended.md` → `docs/archive/`
- `docs/plans/MassFinder_UX_Remediation.md` → `docs/archive/`
- `docs/plans/MassFinder_V2_Rebuild_Plan_ClaudeCode.md` → `docs/archive/`

### Steps
1. `mkdir -p docs/archive`
2. `git mv` each file from `docs/plans/` to `docs/archive/`
3. Verify the five files appear in `docs/archive/` and are gone from `docs/plans/`
4. Add an `docs/archive/README.md` with a single line: "This directory contains planning documents for work that has been fully implemented. Kept for historical reference only."

### Test checklist
- [ ] `docs/archive/` directory exists
- [ ] All five files are present in `docs/archive/`
- [ ] None of the five files remain in `docs/plans/`
- [ ] `docs/archive/README.md` exists with explanatory note
- [ ] `git status` shows moves, not deletions (i.e., used `git mv`)

### Claude Code notes
Use `git mv` not `mv` so git tracks the rename. If any of the five files are not present in `docs/plans/`, note which ones were missing rather than failing silently.
