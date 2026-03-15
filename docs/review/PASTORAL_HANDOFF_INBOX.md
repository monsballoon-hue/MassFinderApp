# Pastoral Handoff → Inbox

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** Mixed — 1 high, 2 medium
**Action required:** Log 3 new items into BACKLOG.md

---

## Context

These are new feature needs and a pastoral recommendation identified during my full app audit. None of these exist in the current backlog. Each is grounded in a specific pastoral scenario.

---

## NEW ITEM 1: Spanish-Language Prayer Tools (Starting with Examination of Conscience)

**Category:** new-feature
**Priority:** High
**Source:** Pastoral audit

**The need:** Maria (34, comes to Spanish Mass with three kids) can find Spanish Mass times through the app — that works. But when she opens the prayer tools — the Rosary, the Examination of Conscience, the Stations of the Cross — everything is in English. Prayer is intimate. People pray in their heart language. An examination of conscience in a second language creates cognitive distance at exactly the moment closeness to God is needed.

**The scope (phased):**
- **Phase 1:** Spanish-language Examination of Conscience. This is the highest-value item because confession preparation is time-sensitive (Maria needs this *before* she goes to confession, not later). The questions are straightforward to translate. The prayers (Act of Contrition, Prayer Before Confession, Thanksgiving) have standard Spanish translations available in any Spanish missal.
- **Phase 2:** Spanish versions of Rosary prayers (Padre Nuestro, Ave María, Gloria, Salve Regina). The mysteries, meditations, and Scripture references could remain in English initially or be translated.
- **Phase 3:** Spanish Stations of the Cross, Divine Mercy Chaplet.

**Data model consideration:** The current prayer data is English-only with no localization structure. This item may require Research to evaluate how to add multi-language support to the prayer JSON files without duplicating the entire dataset.

**Who this serves:** 32 Spanish-language services exist in the parish data. This represents a real and growing community. The families attending those Masses deserve prayer tools in their language.

**Suggested backlog entry:**
```
## IDEA-067 — Spanish-language prayer tools (phased rollout starting with Examination)
**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-15
**Source:** pastoral audit
**Related:** (none)
**Spec ref:** (none)

Spanish-language versions of prayer tools, starting with the Examination of Conscience
(highest pastoral value for confession preparation). Phase 1: exam questions + 
confession prayers in Spanish. Phase 2: Rosary prayers. Phase 3: Stations, Chaplet.
Requires evaluation of data model for multi-language support in prayer JSON files.
Serves the 32+ Spanish-language services and growing Hispanic community in the diocese.
```

---

## NEW ITEM 2: "Report an Issue" Mechanism on Church Detail Cards

**Category:** new-feature
**Priority:** Medium
**Source:** Pastoral audit

**The need:** Data accuracy is the #1 pastoral priority for a service directory. Wrong confession times cause real spiritual harm — someone drives 20 minutes to a parish and finds the door locked. Currently there's no way for users to flag incorrect data from within the app.

Helen (65, parish council president) would be the first person to use this feature. She knows her parish schedule cold and would spot errors in seconds. She'd also check neighboring parishes. She represents a class of engaged Catholics who would volunteer their local knowledge if given a channel.

**The feature:** A simple "Is this information correct?" or "Report an issue" link on the church detail card. It doesn't need to be a full form — even a mailto link to a data quality inbox, or a short form that captures the parish ID + freetext description, would be valuable. The key is lowering the barrier so that someone who notices wrong data can say something *right then*, not later when they've forgotten.

**Who this serves:** Every user who relies on the data, indirectly. Helen and people like her, directly.

**Suggested backlog entry:**
```
## IDEA-068 — "Report an issue" link on church detail cards
**Category:** new-feature
**Status:** new
**Date logged:** 2026-03-15
**Source:** pastoral audit
**Related:** IDEA-007, IDEA-047
**Spec ref:** (none)

Simple mechanism for users to flag incorrect parish data (wrong times, closed parishes,
missing services) directly from the church detail card. Could be a mailto link, a 
short form, or a feedback button that captures parish_id + freetext. Primary persona: 
Helen (engaged parishioner who knows local schedules). Supports data accuracy — the #1
pastoral priority.
```

---

## NEW ITEM 3: Remove Lenten Day Counter (Support for IDEA-022)

**Category:** pastoral-recommendation (supports existing backlog item)
**Priority:** Medium
**Source:** Pastoral audit

**The existing item:** IDEA-022 already flags that the Lenten counter shows "Day X of 45" with an incorrect total and notes a lean toward removal.

**My pastoral recommendation:** Remove it entirely. Here's why:

Lent is not a countdown. It's not a streak. It's not a fitness challenge. The moment you put "Day 23 of 45" on someone's screen, you've subtly reframed a season of repentance and interior conversion into a progress bar. Paul (19, college student) sees that and thinks of it like Dry January — something to endure and check off. That's the opposite of what Lent is for.

The liturgical teaser card is already excellent — knowing it's "Friday of the 3rd Week of Lent" with the abstinence reminder is useful and liturgically grounded. The counter adds nothing pastoral and risks something harmful. Even with the correct day count, I'd still recommend removing it.

This isn't a new backlog item — it's a pastoral vote on IDEA-022. Add a note:

```
**Pastoral recommendation (2026-03-15):** Remove the counter entirely rather than 
fixing the count. "Day X of Y" format risks gamifying Lent. The liturgical day name 
and week are sufficient and more liturgically appropriate. — Fr. Mike
```

---

## ID Sequencing Note

Current backlog ends at IDEA-066 with the next ID at IDEA-067. The two new items above should be IDEA-067 (Spanish prayer tools) and IDEA-068 (Report an issue). The Lenten counter is a note on existing IDEA-022.
