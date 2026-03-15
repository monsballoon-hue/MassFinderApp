# Content Spec: At a Glance Cards + TLM Paragraph Restructure
**Series:** CON-32 through CON-38 · **Created:** 2026-03-15
**Status:** Ready for implementation
**Depends on:** AGC-01 + AGC-02 (UX_Spec_AtAGlance_Card.md) must land before or with this spec
**Reviews completed:**
- Catholic Review (Review_CON_AtAGlance.md) — all items approved; CON-34 and CON-36 revised per feedback
- UX & Design (UX_Spec_AtAGlance_Card.md) — visual pattern finalized; `<strong>At a glance:</strong>` label required; `--font-body` upright (not italic `--font-prayer`)

---

## Summary

Add a brief "At a Glance" summary element to the top of five devotional guides. Also restructure the TLM guide's dense second paragraph into two shorter ones. No content is removed. No toggle. No second "mode."

**HTML pattern** (per UX spec AGC-01):
```html
<div class="devot-glance"><strong>At a glance:</strong> [summary text]</div>
```

The `<strong>At a glance:</strong>` label is required — it gives an explicit semantic anchor so all three demographics parse the card correctly (UX_Spec_AtAGlance_Card.md, Q4 stress test).

---

## Content Items

### CON-32 · At a Glance — How to Go to Confession
**Content Type:** At a Glance summary
**Target:** `src/devotions.js` → DEVOTIONAL_GUIDES[1] (title: "How to go to Confession"), prepended to `body`
**Draft Text:**
> **At a glance:** Tell the priest your sins. Receive God's forgiveness. The priest will help you through it — even if it's been years.

**Source:** CCC 1455–1456 (confession of sins), CCC 1468 (reconciliation with God), Rite of Penance §18
**Catholic Review:** ✅ Approved. "The priest will help you through it" faithfully summarizes the confessor's ministerial function per Canon 978 §1.

---

### CON-33 · At a Glance — What to Expect at a Latin Mass
**Content Type:** At a Glance summary
**Target:** `src/devotions.js` → Devotions group → child "What to Expect at a Latin Mass", prepended to `body`
**Draft Text:**
> **At a glance:** The older form of the Mass — in Latin, quieter, deeply reverent. You don't need to know anything special to attend. Just show up.

**Source:** General description consistent with CCC 1124–1125 (liturgical diversity within unity)
**Catholic Review:** ✅ Approved. No canonical preparation obligation beyond normal Mass requirements.

---

### CON-34 · At a Glance — The Sunday Obligation
**Content Type:** At a Glance summary
**Target:** `src/devotions.js` → DEVOTIONAL_GUIDES[0] (title: "The Sunday Obligation"), prepended to `body`
**Draft Text:**
> **At a glance:** Catholics attend Mass every Sunday or Saturday evening (4 PM or later), and on Holy Days of Obligation. If you've been away, you're welcome back anytime.

**Source:** CCC 2180–2183 (Sunday obligation), CIC 1247–1248, Canon 1248 §1
**Catholic Review:** ✅ Approved after revision. Time qualifier "(4 PM or later)" added per review — a Saturday Mass before 4 PM does not fulfill the Sunday obligation (Canon 202, *Christus Dominus* 1953).

---

### CON-35 · At a Glance — Divine Mercy Chaplet
**Content Type:** At a Glance summary
**Target:** `src/devotions.js` → Devotions group → child "Divine Mercy Chaplet", prepended to `body`
**Draft Text:**
> **At a glance:** A 10-minute prayer on Rosary beads asking for God's mercy. Given to St. Faustina in the 1930s. Simple to learn, deeply powerful.

**Source:** Diary of St. Faustina (Diary 476), CCC 2844 (mercy)
**Catholic Review:** ✅ Approved. "Deeply powerful" is pastoral/editorial, consistent with the Church's strong endorsement (plenary indulgence, Divine Mercy Sunday feast).

---

### CON-36 · At a Glance — Stations of the Cross
**Content Type:** At a Glance summary
**Target:** `src/devotions.js` → Devotions group → child "Stations of the Cross", prepended to `body`
**Draft Text:**
> **At a glance:** Fourteen stations through Christ's Passion and death. Prayed especially on Fridays in Lent. About 20–30 minutes.

**Source:** CCC 1674 (popular piety and the Way of the Cross)
**Catholic Review:** ✅ Approved after revision. Changed "stops" → "stations" per review — "stations" is the exclusive term in all liturgical texts (Directory on Popular Piety §131–135, USCCB).

---

### CON-37 · TLM Guide — Paragraph Restructure
**Content Type:** Body text rewrite (paragraph 2 only)
**Target:** `src/devotions.js` → Devotions group → child "What to Expect at a Latin Mass", second `<p>` in `body`

**Current text (single paragraph, 102 words):**
> If you're used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. At a Low Mass (the most common weekday form), you may hear no spoken responses from the congregation — only the altar server responds to the priest. At a Dialogue Mass or Sung Mass, however, the congregation joins in the responses and may sing parts of the liturgy in Latin. Much of the priest's prayer is said softly or silently. A choir or schola may sing in Latin or Gregorian chant. Communion is received kneeling, on the tongue. A hand missal — a booklet with the Latin text and English translation side by side — is your best companion. Most parishes that offer this Mass provide them in the pews.

**Revised text (two paragraphs):**

> If you're used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. Much of the priest's prayer is said quietly. At a Low Mass, the congregation may not speak at all — only the altar server responds. At a Sung Mass, the congregation joins in, and a choir may sing in Latin or Gregorian chant.

> Communion is received kneeling at the altar rail, on the tongue. A hand missal — a booklet with Latin and English side by side — is your best companion. Most parishes that offer this Mass provide them in the pews.

**What changed:** Split at natural seam (liturgical action → communion/logistics). Removed "Dialogue Mass" distinction, "schola," "(the most common weekday form)" parenthetical. Simplified "softly or silently" → "quietly." Added "at the altar rail."

**Catholic Review:** ✅ Approved (all three sub-items). Dropping "Dialogue Mass" and "schola" acceptable for first-visit audience. "At the altar rail" confirmed accurate for all seven TLM venues in coverage area.

---

### CON-38 · Visual Pattern Reference
**Content Type:** Implementation pattern (not a content item)
**CSS and selector fix:** Defined in UX_Spec_AtAGlance_Card.md (AGC-01, AGC-02). This spec defers to the AGC series for all visual treatment. Content & Voice owns the words; UX & Design owns the box.

---

## Review Routing — Final

| Item | Catholic Review | UX & Design | Status |
|------|:-:|:-:|-------|
| CON-32 (Confession) | ✅ Approved | — | Ready |
| CON-33 (TLM) | ✅ Approved | — | Ready |
| CON-34 (Sunday) | ✅ Revised + Approved | — | Ready |
| CON-35 (Divine Mercy) | ✅ Approved | — | Ready |
| CON-36 (Stations) | ✅ Revised + Approved | — | Ready |
| CON-37 (TLM rewrite) | ✅ Approved | — | Ready |
| CON-38 (Visual pattern) | — | ✅ AGC-01/02 | Ready |
