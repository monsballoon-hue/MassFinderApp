# Catholic Fidelity Review — Content_Spec_AtAGlance.md

**Reviewer:** MassFinder Catholic Review
**Date:** 2026-03-15
**Items reviewed:** CON-32 through CON-37
**Source spec:** Content_Spec_AtAGlance.md (from Content & Voice project)

---

## Verdicts

| Item | Topic | Verdict |
|------|-------|---------|
| CON-32 | Confession: "The priest will help you through it" | ✅ Approved |
| CON-33 | TLM: "Just show up" | ✅ Approved |
| CON-34 | Sunday: "Saturday evening" without time qualifier | ⚠️ Concern |
| CON-35 | Divine Mercy: "Deeply powerful" | ✅ Approved |
| CON-36 | Stations: "Fourteen stops" vs. "fourteen stations" | ⚠️ Concern |
| CON-37 | TLM rewrite: dropped Dialogue Mass/schola, added "at the altar rail" | ✅ Approved |

---

## CON-32: Confession — "The priest will help you through it"

**✅ APPROVED**

The proposed phrasing is doctrinally sound and improves on the current text (line 263 of `src/devotions.js`), which reads: "a gentle priest will be happy to help you through it." The current version makes subjective behavioral promises; the proposed version correctly describes the priest's ministerial function.

**Authority:** Rite of Penance, Introduction §18 instructs the confessor to receive penitents with "fraternal charity" and to help the penitent make an integral confession. Canon 978 §1 defines the priest's role as judge and healer. "The priest will help you through it" is a faithful summary.

No correction needed.

---

## CON-33: TLM — "Just show up"

**✅ APPROVED**

No canonical or liturgical obligation exists to prepare specifically for a TLM beyond normal Mass requirements (state of grace for Communion, one-hour Eucharistic fast per Canon 919 §1). The full guide already handles detailed preparation. "Just show up" is pastorally appropriate for an "at a glance" audience and lowers the genuine intimidation barrier without making any false claim.

No correction needed.

---

## CON-34: Sunday — "Saturday evening" without time specification

**⚠️ CONCERN — retain the time qualifier**

**What's proposed:** "Saturday evening" as shorthand for when the vigil Mass fulfills the Sunday obligation.

**Why it matters:** Canon 1248 §1 permits fulfillment "in the evening of the preceding day." The canonical threshold in the United States is 4:00 PM, established by Pius XII's apostolic constitution *Christus Dominus* (1953) and reflected in canonical consensus (cf. Canon 202). A Saturday Mass at 2:00 or 3:00 PM does NOT fulfill the Sunday obligation. The app's own TERMINOLOGY.md encodes this: "A Saturday evening Mass (4:00 PM or later) fulfills the Sunday obligation."

**Risk:** Users may make scheduling decisions based on what the app says. Omitting the threshold in the "at a glance" copy could lead someone to conclude a mid-afternoon Saturday Mass fulfills Sunday obligation.

**Recommendation for Content & Voice:** Retain the qualifier even in the short version. Suggested phrasing: "Saturday evening (4 PM or later)" — adds seven characters, preserves canonical precision.

---

## CON-35: Divine Mercy — "Deeply powerful"

**✅ APPROVED**

"Deeply powerful" is pastoral/editorial language, not a theological claim. It is consistent with the Church's strong endorsement of the devotion:
- Apostolic Penitentiary decree (June 29, 2002) grants a plenary indulgence for praying the Chaplet on Divine Mercy Sunday with usual conditions.
- The feast of Divine Mercy (Second Sunday of Easter) was approved by the Congregation for Divine Worship in 2000.
- CCC §1471–1479 teaches the reality and efficacy of indulgences.

**Guardrail:** Ensure the surrounding copy does not suggest the Chaplet replaces sacramental confession or that reciting it guarantees specific temporal outcomes. The devotion's efficacy flows from God's mercy through the merits of Christ's Passion.

No correction needed.

---

## CON-36: Stations — "Fourteen stops" vs. "fourteen stations"

**⚠️ CONCERN — use "stations," not "stops"**

**What's proposed:** "Fourteen stops" as informal shorthand for the Stations of the Cross.

**Why it should be "stations":** Every authoritative source uses "stations" exclusively:
- Directory on Popular Piety and the Liturgy (Congregation for Divine Worship, 2001), §131–135
- USCCB pastoral materials
- The Latin name *statio* (standing/stopping place)
- The app's own TERMINOLOGY.md and current code (line 436 of `src/devotions.js`)

"Stops" is etymologically defensible but has no basis in any liturgical text. More practically: the devotion is called "Stations of the Cross," not "Stops of the Cross." Using "stops" in the summary while the title says "stations" reads as an error, particularly to the 50+ demographic.

**Recommendation for Content & Voice:** Use "fourteen stations." The word is accessible, already appears in the title, and is the correct term.

---

## CON-37: TLM rewrite — Dropped "Dialogue Mass" and "schola"; added "at the altar rail"

**✅ APPROVED (all three sub-items)**

**(a) Dropping "Dialogue Mass":** Acceptable for "at a glance." The *Missa Dialogata* is a valid liturgical form but a technical term unlikely to be needed by a first-time visitor. Full guide should retain it.

**(b) Dropping "schola":** Acceptable. "Choir" communicates the same concept without requiring a glossary. Full guide should retain the term.

**(c) Adding "at the altar rail":** Liturgically correct per the 1962 Roman Missal rubrics. All seven TLM venues in the app's coverage area (Our Lady of the Valley, Our Lady of Czestochowa, St. Martha, Immaculate Heart of Mary Chapel, St. Ambrose, St. Stanislaus Kostka, St. Patrick Oratory) are regular EF communities where altar-rail Communion is the normative practice. Even if one venue uses a portable kneeler, "at the altar rail" correctly describes the rubrical norm and prepares the visitor for what to expect.

No correction needed.

---

## Disposition

Two concerns identified. Both are imprecision issues in proposed copy, not doctrinal errors.

**For Content & Voice:** Please incorporate the two recommendations (CON-34 time qualifier, CON-36 "stations" terminology) before handing the spec to Claude Code. No fix spec is needed — these are adjustments to draft copy, not corrections to production code.

**Would a parish priest recommend this content?** Yes, with the two adjustments above. The pastoral tone is warm, the theology is sound, the practical guidance is accurate.
