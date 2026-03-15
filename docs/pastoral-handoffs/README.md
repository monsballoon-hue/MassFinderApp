# Pastoral Audit — Handoff Index

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Audit scope:** Full app — all prayer data, examination content, devotional guides, parish data, config, backlog, events, validation checklist
**Audit method:** Every item evaluated through the lens of "Would this help my parishioners draw closer to Christ?"

---

## Summary

A comprehensive pastoral audit was completed on 2026-03-15. The app is strong — it serves souls and it was built by people who understand parish life. The audit produced 13 actionable items distributed across 5 handoff documents to 5 destination projects.

---

## Handoff Documents

| # | Document | Destination Project | Items | Priority |
|---|----------|-------------------|-------|----------|
| 1 | [HANDOFF-catholic-review.md](./HANDOFF-catholic-review.md) | Catholic Review | 5 items | High |
| 2 | [HANDOFF-tech-debt.md](./HANDOFF-tech-debt.md) | Tech Debt & Data | 2 confirmed + 2 conditional | Medium |
| 3 | [HANDOFF-ux-design.md](./HANDOFF-ux-design.md) | UX & Design | 2 items | High / Medium |
| 4 | [HANDOFF-inbox.md](./HANDOFF-inbox.md) | Inbox | 3 items | Varies |
| 5 | [HANDOFF-bulletin-pipeline.md](./HANDOFF-bulletin-pipeline.md) | Bulletin Pipeline | 1 ongoing priority | Critical |

---

## Item Summary

### Catholic Review (5 items)
1. **Exam Q31 — Suicide question sensitivity** — Should a pastoral note accompany this question for vulnerable users?
2. **Exam Q39 — "Disordered sexual desires" phrasing** — Does this phrasing serve the pastoral goal of drawing people toward confession?
3. **Exam Q66 — Voting question inclusion** — Should this be removed from a general examination?
4. **Rosary Sunday mystery assignment** — Data says Joyful; JPII standard says Glorious. Verify and correct.
5. **Act of Contrition inconsistency** — Two different versions across Rosary and Examination modules. Recommend primary.

### Tech Debt & Data (2 confirmed + 2 pending Catholic Review)
1. **"amoung" typo** in Rosary Joyful Mysteries, Visitation meditation (`prayers.json`)
2. **Stray `\r\n\r\n` line break** in Stations of the Cross, Station 3 meditation (`prayers.json`)
3. *(Conditional)* Sunday mystery day assignment fix — pending Catholic Review
4. *(Conditional)* Act of Contrition alignment — pending Catholic Review

### UX & Design (2 items)
1. **Confession guide surfacing for returning Catholics** — Show "Been a while? Here's what to expect" link when Confession filter is active on Find tab. Serves Kevin.
2. **Elderly usability evaluation of prayer tools** — Can Dorothy (78) navigate the Rosary, Stations, and Examination without confusion? Touch targets, text size, navigation clarity.

### Inbox (3 items)
1. **Spanish-language prayer tools** — Start with Examination of Conscience. Maria's community is growing and prayer in your heart language matters. New feature.
2. **"Report an issue" on church detail cards** — Let Helen flag wrong Mass/confession times. Feeds into Bulletin Pipeline validation. New feature.
3. **Remove Lenten day counter** — Supporting recommendation for existing IDEA-022. Lent is not a countdown.

### Bulletin Pipeline (1 ongoing priority)
1. **Confession time accuracy as #1 data priority** — Wrong confession times cause real spiritual harm. Prioritize confession verification over other service types. Be vigilant about seasonal changes (Lent → Ordinary Time transition). Flag "by appointment" parishes explicitly.

---

## Dependency Chain

Some items have dependencies on Catholic Review decisions:

```
Catholic Review decides on:
  ├─ Rosary Sunday mystery → Tech Debt implements data fix
  ├─ Act of Contrition primary version → Tech Debt aligns both files
  ├─ Exam Q31 annotation → Engineering implements (if text change needed)
  ├─ Exam Q39 rephrasing → Engineering implements (if text change needed)
  └─ Exam Q66 removal → Engineering implements (if removal approved)
```

All other items can proceed independently.

---

## Personas Referenced

These five parishioners are referenced throughout the handoff documents. They represent the real people this app serves:

| Name | Age | Profile | Primary Need |
|------|-----|---------|-------------|
| **Dorothy** | 78 | Daily Mass, grandson set up her iPhone, can barely read small text | Everything must be intuitive; she gets one chance |
| **Maria** | 34 | Spanish Mass, three kids, on her phone constantly in Spanish apps | Find confession times without calling; pray in her language |
| **Kevin** | 42 | Lapsed 15 years, wife brought him back, self-conscious | Know how to go to confession; access to basic prayers |
| **Paul** | 19 | College student, checks phone during homily, design-sensitive | Clean tool that doesn't feel dated; depth he can discover |
| **Helen** | 65 | Parish council president, organized, opinionated, uses email/FB | Accurate data; will volunteer to review if given a mechanism |

---

## Overall Assessment

The app is ready for pastoral recommendation. I would mention it from the pulpit. I would show it to Kevin after Mass. I would tell Dorothy's grandson to install it.

The items above are refinements to something that is already genuinely good for souls. None of them are blockers. All of them would make the app better at what it already does well: helping people find their way to Christ through the sacraments and prayer.

— Fr. Mike, Pastoral Advisor
