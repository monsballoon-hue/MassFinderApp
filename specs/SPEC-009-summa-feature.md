# SPEC-009 — Summa Theologica / Catholic Classics Daily Wisdom Card
**Created:** 2026-03-12 | **Updated:** 2026-03-12
**Executor:** Claude Opus (design + research) → Claude Code / Sonnet (implementation)
**Estimated total effort:** ~3–4 hours (after research gate cleared)

## Status Summary
| ID | Idea | Title | Status |
|----|------|-------|--------|
| SPEC-009-R | IDEA-051, IDEA-021 | Research gate: source selection + placement UX | open |
| SPEC-009-A | IDEA-005 | build-summa.js curation script | blocked (on SPEC-009-R) |
| SPEC-009-B | IDEA-005 | More tab "Daily Wisdom" card rendering | blocked (on SPEC-009-R) |

---

## ⛔ BLOCKED — Research gate must be resolved before any code is written

Do not implement SPEC-009-A or SPEC-009-B until SPEC-009-R questions are answered and decisions recorded here. Update this file with the decisions before handing off to Claude Code.

---

## SPEC-009-R — Research gate: source selection and placement UX
**Origin:** IDEA-051, IDEA-021 | **Status:** open

### Questions to answer (Claude Opus task)

**Question 1 — Source selection (IDEA-051)**
The Summa Theologica (`Jacob-Gray/summa.json`, 20MB, public domain) was the original proposal. However, the Summa is academically dense and may not serve general users well as a daily "going deeper" feature.

Evaluate candidate sources for a daily Catholic wisdom card aimed at the MassFinder user demographics (older parishioners, phone-native younger adults, middle-ground utility seekers). Criteria:
- Audience accessibility (plain language vs. academic)
- Public domain availability
- Feasibility of date-matching to liturgical themes
- Data size and lazy-load compatibility
- Spiritual depth appropriate for post-Mass or post-prayer reflection

Candidate sources to evaluate (and add others):
1. Summa Theologica (dense, academic — power-user niche)
2. Imitation of Christ by Thomas à Kempis (accessible, devotional, widely beloved)
3. Introduction to the Devout Life by St. Francis de Sales (accessible, practical)
4. Story of a Soul by St. Thérèse (accessible, popular, Carmelite)
5. Confessions of St. Augustine (literary, widely read)
6. Dialogue of St. Catherine of Siena (mystical, intermediate)
7. Selected writings from Doctors of the Church (varied accessibility)

**Produce:** A shortlist of 1–2 recommended sources with rationale, plus a note on whether the Summa should be included as a power-user/expandable layer rather than the primary offering.

**Question 2 — Placement UX (IDEA-021)**
Three placement options for the daily wisdom card in the More tab:

Option A: Below the CCC reflection card
- Pro: Natural "going deeper" flow from daily readings → CCC → Wisdom
- Con: Adds more vertical scroll to an already content-heavy tab

Option B: Separate collapsible section
- Pro: Progressive disclosure — users opt in to the extra content
- Con: Another accordion adds UI complexity; older users may not find it

Option C: Toggle that swaps between CCC reflection and Wisdom
- Pro: Minimal additional real estate
- Con: Toggle pattern may confuse older parishioners; CCC and Wisdom serve different purposes

**Produce:** A recommended placement option with rationale, citing the three user demographics explicitly. If none of the three options is right, propose an alternative.

### Decision record (fill in after Opus research)
```
Source selected: ___________
Rationale: ___________
Placement option: ___________
Rationale: ___________
Data file: ___________
Approximate output size: ___________
```

---

## SPEC-009-A — build-summa.js (or build-wisdom.js) curation script
**Origin:** IDEA-005 | **Status:** blocked (on SPEC-009-R)

### Goal (after research gate)
Create `scripts/build-wisdom.js` to:
1. Read the selected source text (downloaded to `scripts/source/`)
2. Curate or select ~365 entries matched to liturgical themes or dates
3. Output `data/wisdom-daily.json` (~50KB target)

### Files affected (anticipated)
- `scripts/build-wisdom.js` (new)
- `data/wisdom-daily.json` (new, generated output)
- `package.json` — add `build:wisdom` script

### Schema placeholder (finalize after SPEC-009-R)
```json
{
  "entries": [
    {
      "date": "03-12",          // MM-DD for annual cycle, or liturgical day key
      "source": "Imitation of Christ",
      "book": "Book II",
      "chapter": "Chapter 1",
      "text": "...",
      "theme": "humility"       // optional liturgical theme tag
    }
  ]
}
```

### Build script notes (fill in after SPEC-009-R)
- Date-matching strategy: ___________
- Liturgical theme mapping: ___________
- Entry selection criteria: ___________

### Test checklist (fill in after SPEC-009-R)
- [ ] Script runs without error
- [ ] Output has ~365 entries (one per day of year)
- [ ] Schema matches what `src/more.js` rendering code expects
- [ ] CI schema validation passes
- [ ] CommonJS, no arrow functions

---

## SPEC-009-B — More tab "Daily Wisdom" card rendering
**Origin:** IDEA-005 | **Status:** blocked (on SPEC-009-R)

### Goal (after research gate)
Add a "Daily Wisdom" card to the More tab that shows today's curated entry from `data/wisdom-daily.json`.

### Files affected (anticipated)
- `src/more.js`
- `css/app.css`

### Card design placeholder (finalize after SPEC-009-R)
**Card structure:**
```
[Source title]                  ← small label, --font-body, --color-text-secondary
[Wisdom text]                   ← --font-prayer (Georgia), 1.05rem, line-height 1.7
[Citation — Book, Chapter]      ← small, --font-body, --color-text-secondary, right-aligned
```

**Placement:** [to be determined by SPEC-009-R]

**Lazy load:** `data/wisdom-daily.json` loaded on More tab open, same pattern as existing data lazy-loads in the tab.

### CSS / dark mode placeholder
All colors via tokens. Same card shell as existing More tab cards.

### Test checklist (fill in after SPEC-009-R)
- [ ] Card renders with today's wisdom entry
- [ ] Text uses `--font-prayer` (Georgia)
- [ ] Source and citation in `--font-body`
- [ ] Dark mode: all elements visible
- [ ] Card does not render if `wisdom-daily.json` fails to load (graceful degradation)
- [ ] On days not covered by the 365 entries, a fallback entry renders
