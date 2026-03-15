# Content Spec: What to Expect at a Latin Mass

**Spec series:** CON-01 through CON-01  
**Author:** Content & Voice  
**Status:** Catholic Review APPROVED (CRX-01–04 applied 2026-03-15)  
**Date:** 2026-03-15  
**Target location:** `src/devotions.js` → `DEVOTIONAL_GUIDES` array, inside the Devotions group (children of the `isGroup:true` "Devotions" entry)  
**Position:** After "Gorzkie Żale", before "Stations of the Cross" (or at end of Devotions group — implementer's discretion)  
**Filter link:** `filter: 'latin'` (existing Latin Mass filter)  
**Find label:** `Latin Mass`

---

## CON-01: What to Expect at a Latin Mass

**Content type:** Devotional / Practical Guide  
**Format:** 3 body paragraphs + 1 expandable `<details>` section  
**Voice model:** Matches Confession guide (warm, step-oriented, reassuring) and Adoration guide (experiential, no-pressure)

### Draft Text

**Paragraph 1 — What it is:**

> The Traditional Latin Mass — also called the Extraordinary Form, or the Mass according to the 1962 Roman Missal — is the older form of the Mass celebrated in the Catholic Church for centuries before the liturgical reforms following Vatican II. The prayers are in Latin. The priest faces the altar, in the same direction as the people, a posture called *ad orientem*. The overall feel is quieter, more formal, and deeply reverent.

**Paragraph 2 — What you'll experience:**

> If you're used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. At a Low Mass (the most common weekday form), you may hear no spoken responses from the congregation — only the altar server responds to the priest. At a Dialogue Mass or Sung Mass, however, the congregation joins in the responses and may sing parts of the liturgy in Latin. Much of the priest's prayer is said softly or silently. A choir or schola may sing in Latin or Gregorian chant. Communion is received kneeling, on the tongue. A hand missal — a booklet with the Latin text and English translation side by side — is your best companion. Most parishes that offer this Mass provide them in the pews.

**Paragraph 3 — Reassurance:**

> It's completely normal to feel a little lost. Many people do their first several times. You don't need to follow every word. You can pray along in the missal, pray the Rosary quietly, or simply be present. Let the beauty of the liturgy wash over you. No one is watching to see if you turn to the right page.

**Expandable section — "Practical tips for your first time":**

> - **Dress:** Many regular attendees dress more formally — men in collared shirts, women in dresses or skirts, sometimes with a chapel veil. This isn't a rule. Come as you are. You won't be turned away for wearing jeans.
> - **Missal:** Look for a red booklet in the pew — often a *1962 Missal* or a parish guide. It will have Latin on one side and English on the other. If you can't find one, ask someone nearby. People are usually happy to help.
> - **Posture:** Stand, kneel, and sit when others do. Communion is received kneeling at the altar rail, on the tongue — the priest will place the host on your tongue. If you're not receiving Communion, simply remain in your pew — there's no expectation to approach the altar rail.
> - **Length:** A Low Mass (spoken, no singing) runs about 45 minutes to an hour. A High Mass or Solemn High Mass (sung, with incense and more ceremony) can run 75–90 minutes.
> - **If you get lost:** Close the missal. Look up. Listen. The Mass is still the Mass — the same sacrifice of Calvary, the same Real Presence, the same Lord. You belong here.

---

## Source Citations

| Claim | Source |
|-------|--------|
| Extraordinary Form / 1962 Missal | *Summorum Pontificum* (Benedict XVI, 2007); CCC 1345–1355 (general Mass structure) |
| Ad orientem posture | GIRM (historical), Ratzinger *Spirit of the Liturgy* ch. 3 |
| Communion on the tongue, kneeling | 1962 Missale Romanum, *Ritus servandus* X (*De Communione*); cf. USCCB Committee on Divine Worship (May 2020) confirming tongue-only for EF |
| No congregational spoken responses (Low Mass) | 1962 rubrics — *Missa Lecta* norms |
| Chapel veils as custom, not requirement | 1983 Code of Canon Law dropped the 1917 CIC can. 1262 requirement; now voluntary tradition |

---

## Review Notes for Catholic Review

1. **Verify:** The description of ad orientem is accurate and neutral ("same direction as the people" — not "back to the people," which is polemical).
2. **Verify:** Communion posture description — kneeling, on the tongue. Confirm this is universal for EF or if any indult allows standing/hand.
3. **Verify:** "No spoken responses from the congregation during most of the Mass" — accurate for Low Mass. At a *Missa Cantata* or *Dialogue Mass*, some responses are given. Should we note this nuance or does it over-complicate for a first-timer?
4. **Verify:** Chapel veil language — "This isn't a rule" is accurate post-1983 CIC. Confirm no diocesan norms in Springfield MA diocese override this.
5. **Pastoral check:** The phrase "You belong here" at the end — is this appropriate, or does it risk sounding presumptuous? (Content team believes it's the right close given the audience: someone nervous about trying something new.)
6. **Sensitivity note:** This guide deliberately avoids the "TLM vs. Novus Ordo" debate. It does not position either form as superior. Catholic Review should confirm the tone reads as informational, not partisan.

---

## Implementation Notes

- **Term triggers:** "Extraordinary Form" and "ad orientem" already exist in `TERM_DEFS` in `devotions.js`. They will auto-link via `_wrapTerms()`.
- **Filter link:** Uses existing `filter: 'latin'` which maps to `['mass_latin','mass_traditional_latin']` in render.js.
- **Icon:** Suggest reusing the church icon from Sunday Obligation guide, or a simple cross. No new SVG needed.
- **searchTerm:** `'latin mass'` — enables "Find Latin Mass near me →" link via the search input path.
