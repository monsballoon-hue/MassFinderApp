# Pastoral Handoff → Research

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** Medium — this supports a high-priority pastoral need (Spanish prayer tools)
**Action required:** Evaluate data model options for multi-language prayer content

---

## Context

My pastoral audit identified Spanish-language prayer tools as the #2 pastoral priority for the app (after data accuracy). The full rationale is in the Inbox handoff document (PASTORAL_HANDOFF_INBOX.md, IDEA-067).

The short version: 32 Spanish-language Mass services exist in the parish data. Maria (34, attends Spanish Mass with three kids) can find Mass times but has no prayer tools in her language. An examination of conscience in a second language creates distance at the moment you need closeness. Prayer in your heart language matters.

This handoff asks Research to evaluate *how* to add multi-language support to the prayer data, not *whether* to do it (that's a pastoral decision already made).

---

## Current State

Prayer content lives in several JSON files with no localization structure:

| File | Content | Size | Localization? |
|------|---------|------|--------------|
| `data/examination.json` | Exam of conscience questions, prayers, how-to guide | 11K | English only |
| `data/prayers.json` | Rosary mysteries, Stations, novenas, chaplet, common prayers | 100K | English only |
| `data/prayerbook.json` | Standalone prayers (Our Father, Hail Mary, Creeds, etc.) | 27K | English only |

All text is inline in the JSON — no key/value localization pattern, no language codes, no fallback structure.

---

## What Needs to Be Localized (Phased)

**Phase 1 — Examination of Conscience (highest pastoral value):**
- 66 examination questions
- 3 prayers (Prayer Before Confession, Act of Contrition, Thanksgiving)
- 6 "How to Go to Confession" steps
- Commandment titles (10 + Precepts header)
- Total: ~80 translatable strings

**Phase 2 — Rosary core prayers:**
- Our Father, Hail Mary, Glory Be, Apostles' Creed, Hail Holy Queen, O My Jesus, Sign of the Cross
- Mystery titles and meditations (20 mysteries × title + meditation)
- Fruit of each mystery (20 short strings)
- Total: ~50 translatable strings + 7 prayers

**Phase 3 — Stations, Chaplet, Novenas:**
- 14 stations × (title + verse + response + meditation + prayer)
- Chaplet prayers (5 strings)
- Novenas would be the largest lift — 9 novenas × 9 days × (prayer + meditation)
- Total: significant, probably Phase 3+

---

## Questions for Research

1. **Inline vs. separate files:** Should Spanish translations live in the same JSON files (e.g., `examination.json` with `"text_es"` fields alongside `"text"`) or in parallel files (e.g., `examination-es.json`)? The inline approach keeps content co-located but bloats the files for English-only users. The parallel approach is cleaner but creates maintenance burden (every content change needs to be made in both files).

2. **Lazy loading:** If translations are in separate files, they should only be loaded when the user has set a language preference. Evaluate the impact on the existing `fetch('/data/prayers.json')` pattern used by all prayer modules.

3. **Fallback behavior:** If a string doesn't have a Spanish translation yet, should it fall back to English silently, or show an indicator that the content is in English? (Pastoral preference: fall back silently. A mix of languages in prayer is better than a missing prayer.)

4. **Standard translations:** For common prayers (Padre Nuestro, Ave María, Gloria, Acto de Contrición), the translations are liturgically standardized by the USCCB and Vatican. We should use the official approved texts, not fresh translations. Research where to source these authoritatively.

5. **Future languages:** Polish (28 services) and Portuguese (10 services) are the next most common after Spanish. Whatever data model is chosen should accommodate additional languages without restructuring.

---

## What I'm NOT Asking For

- I'm not asking for a full i18n framework for the app's UI chrome (buttons, labels, navigation). The UI can stay English.
- I'm not asking for the parish data to be translated (church names, service notes, etc.).
- I'm only asking about prayer content — the text that people read while they pray.

---

## Who This Serves

Maria, and every Spanish-speaking Catholic in the diocese who wants to prepare for confession, pray the Rosary, or walk through the Stations in their own language. The 32 Spanish Mass listings represent real families. Their prayer life deserves the same support the English-speaking community already has.
