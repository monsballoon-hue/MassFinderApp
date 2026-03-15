# Content Spec: Full Voice & Content Pass (CON Series)

**Author:** Content & Voice Project  
**Date:** 2026-03-15  
**Source:** Content_Audit_Full_v1.md  
**Status:** Awaiting Catholic Review (B-03 only), then ready for implementation  
**Items:** 29 total (15 amendments, 2 removals, 12 additions)

---

## Implementation Notes

- All items modify **user-facing strings only** — no structural JS changes unless noted.
- Items marked ⛪ require **Catholic Review** sign-off before implementation.
- Items marked 🎨 have a **UX & Design** dependency (design needed before content wires in).
- Items marked 🔧 have an **Engineering** dependency (code change needed to support content).
- All other items can be implemented directly by Claude Code.
- **Dark mode parity** is not a concern here — these are text changes, not CSS.
- **Spanish (I18N):** Items that touch bilingual content (examination, prayers) must update both `en` and `es` strings where they exist.

---

## CON-01 · Sunday Obligation Guide — Warmth-First Rewrite

**Type:** Amendment  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES[0].body`  
**Priority:** 1

**Current opening:**
```
The Catholic Church teaches that attending Mass on Sundays and Holy Days of 
Obligation is a serious duty for every baptized Catholic.
```

**Draft replacement (full body rewrite):**
```html
<p>Sunday Mass is the heartbeat of Catholic life. It's the one hour each week where the whole community gathers around the altar to worship God, hear His word, and receive the Eucharist. If you've been away for a while, you're welcome back — no questions asked.</p>

<p>The Church teaches that attending Mass on Sundays and Holy Days of Obligation is a serious responsibility for every baptized Catholic. This flows from the Third Commandment — "Remember to keep holy the Lord's Day" — and from the Church's own precepts (CCC 2180). Sunday is the day of the Resurrection, and the Eucharist is the foundation of the Church's week.</p>

<p>The obligation is fulfilled by attending any valid Catholic Mass — either on Sunday itself or the Saturday evening vigil (typically 4:00 PM or later).</p>

<details class="conf-exam">
  <summary>What counts as a serious reason to miss <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <p>Legitimate reasons for missing Sunday Mass include:</p>
    <ul>
      <li>Illness or physical inability to attend</li>
      <li>Caring for the sick, infants, or those who cannot be left alone</li>
      <li>Severe weather or dangerous travel conditions</li>
      <li>Required work that cannot be rescheduled (e.g., healthcare, emergency services)</li>
      <li>Dispensation granted by your pastor or bishop</li>
    </ul>
    <p>When in doubt, speak with your priest. The Church trusts your honest judgment about your ability to attend.</p>
  </div>
</details>

<details class="conf-exam">
  <summary>Holy Days of Obligation (U.S.) <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <p>In the United States, you are also required to attend Mass on these six Holy Days (USCCB):</p>
    <ul>
      <li><strong>January 1</strong> — Solemnity of Mary, Mother of God</li>
      <li><strong>40 days after Easter</strong> — Ascension of the Lord (in some dioceses transferred to the following Sunday)</li>
      <li><strong>August 15</strong> — Assumption of the Blessed Virgin Mary</li>
      <li><strong>November 1</strong> — All Saints' Day</li>
      <li><strong>December 8</strong> — Immaculate Conception of the Blessed Virgin Mary</li>
      <li><strong>December 25</strong> — Nativity of the Lord (Christmas)</li>
    </ul>
  </div>
</details>
```

**What changed:**
1. Opens with beauty and welcome, not duty
2. Removed "those who deliberately fail…commit a grave sin" (CCC 2181) — this is true but doesn't belong in the opening body; the CCC pill provides it on tap
3. Removed "well enough for a restaurant" line (B-02) — replaced with "The Church trusts your honest judgment"
4. Changed "the faithful are bound" to "you" language
5. Kept all Holy Day content intact in collapsible

**Source citations:** CCC 2180, 2181, 1166–1167; USCCB Holy Days list  
**Review notes:** ⛪ Catholic Review should verify that removing the CCC 2181 "grave sin" quote from the body (while keeping it accessible via CCC pill tap) is pastorally appropriate. The teaching is not being hidden — it's being moved to an on-demand interaction.

---

## CON-02 · Saved Tab Empty State Rewrite

**Type:** Amendment  
**Target:** `src/saved.js` → empty state block (~line 281)  
**Priority:** 1

**Current:**
```
<h3>Your parish dashboard</h3>
<p>Build your own custom church schedule. Favorite your parishes and track Mass times, events, and community happenings — all in one place.</p>
<p class="saved-empty-hint">Tap ♡ on any church to add it to your dashboard.</p>
```

**Draft replacement:**
```html
<h3>Your parishes</h3>
<p>Save your parishes here. You'll see today's schedule, upcoming services, and events at a glance.</p>
<p class="saved-empty-hint">Tap ♡ on any church to add it here.</p>
```

**What changed:** Removed "custom church schedule" and "community happenings" (marketing voice). Shorter. Clearer. Action-oriented.

---

## CON-03 · Lent Guide — Restructure into Collapsibles

**Type:** Amendment  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES[2].body` (Lent)  
**Priority:** 1

**Draft replacement:**
```html
<p><strong>Lent</strong> is the 40-day season of prayer, fasting, and almsgiving that prepares you for Easter — the celebration of Christ's Resurrection. It begins on Ash Wednesday and ends on the evening of Holy Thursday. The 40 days recall Christ's fasting in the desert before His public ministry (Matthew 4:1–11).</p>

<p>Lent is a time to slow down, turn toward God, and prepare your heart. Sundays are not counted among the 40 days of penance — every Sunday is a celebration of the Resurrection.</p>

<details class="conf-exam">
  <summary>The Three Pillars of Lent <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <p>The Church calls you to three practices during Lent, rooted in Christ's teaching in the Sermon on the Mount (Matthew 6:1–18):</p>
    <ul>
      <li><strong>Prayer</strong> — Deepening your relationship with God through daily prayer, Scripture, Adoration, the Rosary, Stations of the Cross, or other devotions.</li>
      <li><strong>Fasting</strong> — A discipline of self-denial that sharpens spiritual awareness. Fasting is required on Ash Wednesday and Good Friday (one full meal and two smaller meals) for ages 18–59. Abstinence from meat is required on all Fridays of Lent for ages 14 and older.</li>
      <li><strong>Almsgiving</strong> — Giving to those in need as a concrete expression of charity.</li>
    </ul>
  </div>
</details>

<details class="conf-exam">
  <summary>Key Lenten Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <ul>
      <li><strong>Ash Wednesday</strong> — Ashes are placed on your forehead with the words "Remember that you are dust, and to dust you shall return." A day of fasting and abstinence.</li>
      <li><strong>Fridays of Lent</strong> — All Catholics aged 14+ abstain from meat. Many parishes hold Stations of the Cross or fish fries on Friday evenings.</li>
      <li><strong>Confession</strong> — Strongly emphasized during Lent. Many parishes offer extended hours and penance services.</li>
      <li><strong>Laetare Sunday</strong> — The Fourth Sunday of Lent. A brief respite — the priest may wear rose vestments as Easter draws nearer.</li>
    </ul>
  </div>
</details>

<details class="conf-exam">
  <summary>Holy Week <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <p>The final week of Lent intensifies the focus on Christ's Passion. During Holy Week, MassFinder shows a day-by-day guide on the More tab with details for each day from Palm Sunday through Easter.</p>
  </div>
</details>
```

**What changed:**
1. Cut from ~800 words to ~350 (visible body: ~80 words, rest in collapsibles)
2. Converted all "the faithful" → "you/your"
3. Removed duplicate Holy Week content (points to the day-by-day cards instead)
4. Removed standalone CCC bold-quote blocks (accessible via tappable pills)
5. Tightened fasting rules into one clear sentence

**Source citations:** CCC 540, 1438, 1095; Matthew 4:1–11, 6:1–18  
**Review notes:** ⛪ Verify the fasting rule summary is complete enough. The full details exist in the fasting banner (CON-10).

---

## CON-04 · Easter Guide — Collapsible Restructure

**Type:** Amendment  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES[3].body` (Easter)  
**Priority:** 2

**Draft replacement:**
```html
<p><strong>Easter</strong> is the greatest season of the liturgical year — 50 days celebrating Christ's Resurrection, from Easter Sunday through Pentecost. The vestments are white and gold. The Alleluia, silent throughout Lent, rings out again.</p>

<p>The Resurrection is the central event of the Christian faith. As St. Paul writes: "If Christ has not been raised, then our preaching is in vain and your faith is in vain" (1 Corinthians 15:14). Every Sunday Mass is a "little Easter" — a weekly celebration of this mystery.</p>

<details class="conf-exam">
  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <ul>
      <li><strong>The Easter Octave</strong> — The eight days from Easter Sunday through Divine Mercy Sunday are celebrated as one continuous feast.</li>
      <li><strong>Divine Mercy Sunday</strong> — The Second Sunday of Easter. A plenary indulgence is available for those who go to Confession, receive Communion, and pray for the Pope's intentions.</li>
      <li><strong>Ascension</strong> — 40 days after Easter. Commemorates Christ's ascent into heaven. A Holy Day of Obligation.</li>
      <li><strong>Pentecost</strong> — The 50th day. Celebrates the descent of the Holy Spirit and the birth of the Church. Vestments are red.</li>
    </ul>
  </div>
</details>
```

**What changed:** Collapsed key observances. Converted "the faithful" → direct address. Cut from ~450 words to ~250.

---

## CON-05 · Advent Guide — Collapsible Restructure

**Type:** Amendment  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES[4].body` (Advent)  
**Priority:** 2

**Draft replacement:**
```html
<p><strong>Advent</strong> is the four-week season of preparation for Christmas. It begins on the Sunday nearest November 30 and ends on Christmas Eve. The liturgical color is purple, with rose on Gaudete Sunday (the Third Sunday).</p>

<p>Advent has a dual focus: preparing to celebrate the birth of Jesus at Christmas, and preparing for Christ's second coming. It's a season of joyful anticipation — not penitential in the same way as Lent.</p>

<details class="conf-exam">
  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <ul>
      <li><strong>Advent Wreath</strong> — Four candles (three purple, one rose) lit progressively each Sunday, representing Hope, Peace, Joy, and Love.</li>
      <li><strong>Gaudete Sunday</strong> — The Third Sunday. Rose vestments, a lighter tone. "Gaudete" means "Rejoice."</li>
      <li><strong>Immaculate Conception</strong> — December 8, a Holy Day of Obligation. Celebrates Mary's conception without original sin.</li>
      <li><strong>O Antiphons</strong> — December 17–23. Ancient prayers addressing Christ by Messianic titles. They form the basis of "O Come, O Come, Emmanuel."</li>
    </ul>
  </div>
</details>
```

---

## CON-06 · Christmas Guide — Collapsible Restructure

**Type:** Amendment  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES[5].body` (Christmas)  
**Priority:** 2

**Draft replacement:**
```html
<p><strong>Christmas</strong> is the season celebrating the Incarnation — God becoming man in Jesus Christ. It begins with the Christmas Vigil on December 24 and extends through the Baptism of the Lord in early January. The liturgical color is white or gold.</p>

<p>Christmas is not just one day but an entire season. The Church invites you to contemplate the mystery that "the Word became flesh and dwelt among us" (John 1:14).</p>

<details class="conf-exam">
  <summary>Key Observances <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>
  <div class="conf-exam-body">
    <ul>
      <li><strong>Christmas Day</strong> — December 25, a Holy Day of Obligation. Many parishes celebrate Vigil, Midnight, and daytime Masses.</li>
      <li><strong>The Holy Family</strong> — The Sunday within the Octave celebrates the family life of Jesus, Mary, and Joseph.</li>
      <li><strong>Mary, Mother of God</strong> — January 1, a Holy Day of Obligation.</li>
      <li><strong>Epiphany</strong> — Celebrates the manifestation of Christ to the nations, represented by the Magi.</li>
      <li><strong>Baptism of the Lord</strong> — The Sunday after Epiphany, ending the Christmas season.</li>
    </ul>
  </div>
</details>
```

---

## CON-07 · "The faithful" → "You" Pass

**Type:** Amendment  
**Target:** Multiple locations in `src/devotions.js` and `src/more.js`  
**Priority:** 2

**Find-and-replace list** (body copy only, not CCC direct quotes):

| File | Current text | Replacement |
|------|-------------|-------------|
| devotions.js, Lent | "The Church calls the faithful to three practices" | "The Church calls you to three practices" |
| devotions.js, Lent | "the faithful are bound to participate" | (removed in CON-03 rewrite) |
| devotions.js, Easter | "The faithful who go to Confession" | "Those who go to Confession" |
| devotions.js, Advent | "the faithful are invited to" | "you are invited to" |
| devotions.js, Christmas | "The Church invites the faithful to" | "The Church invites you to" |
| more.js, monthly devotions (multiple) | "The faithful are encouraged to" | "You are encouraged to" |
| more.js, monthly devotions (multiple) | "The faithful are invited to" | "You are invited to" |

**Note:** If CON-03 through CON-06 are implemented first, many of these are already fixed. This item catches any remaining instances.

---

## CON-08 · Prayer Book Gateway — Remove Hardcoded Count

**Type:** Amendment  
**Target:** `src/more.js` → `renderMore()` → prayerBookGateway subtitle  
**Priority:** 2

**Current:**
```
31 prayers · Guided litanies · Lectio Divina
```

**Replacement:**
```
Common prayers · Guided litanies · Lectio Divina
```

---

## CON-09 · "No churches found" Empty State

**Type:** Amendment  
**Target:** `src/render.js` → `renderCards()` no-results block (~line 171)  
**Priority:** 2

**Current:**
```html
<h3>No churches found</h3>
<p>Try a different search term or filter.</p>
```

**Replacement:**
```html
<h3>No matches found</h3>
<p>Try a broader search, or check your filters.</p>
```

---

## CON-10 · Fasting Banner — Add Context

**Type:** Amendment  
**Target:** `src/readings.js` → `renderFastingBanner()` (~lines 188–201)  
**Priority:** 2

**Current (full fast):**
```
Day of Fasting & Abstinence
Ages 18–59 fast (one full meal). Ages 14+ abstain from meat.
```

**Replacement:**
```
Day of Fasting & Abstinence
Ages 18–59: one full meal, two smaller meals that together don't equal the full meal. Ages 14+: no meat today.
```

**Current (abstinence only):**
```
Day of Abstinence
Ages 14+ abstain from meat today.
```

**Replacement:**
```
Friday Abstinence
Ages 14 and older abstain from meat today.
```

---

## CON-11 · Sparse Weekday Message

**Type:** Amendment  
**Target:** `src/render.js` → sparse message (~line 338)  
**Priority:** 2

**Current:**
```
Fewer services on weekdays — try This Weekend for Sunday Mass times.
```

**Replacement:**
```
Weekday schedules are lighter. Tap This Weekend to see Sunday Mass times.
```

---

## CON-12 · Toast Message Standardization

**Type:** Amendment  
**Target:** `src/forms.js`, `src/examination.js`, `src/settings.js` (multiple locations)  
**Priority:** 2

**Rules:**
- No terminal period on short toasts (under 8 words)
- Exclamation marks only on "thank you" acknowledgments
- Em dash style: " — " (with spaces)

**Changes:**

| File | Current | Replacement |
|------|---------|-------------|
| forms.js | "Thank you for helping keep MassFinder accurate! God bless." | "Thank you — your help keeps MassFinder accurate" |
| forms.js | "Thank you! We'll review your correction." | "Thank you — we'll review your correction" |
| forms.js | "Could not send — please check your connection and try again." | "Could not send — check your connection and try again" |
| forms.js | "Got it — thank you!" | "Got it — thank you" |
| forms.js | "Thank you — your feedback means a lot. God bless!" | "Thank you — your feedback means a lot" |
| settings.js | "Prayer data cleared" | "Prayer data cleared" (no change) |
| settings.js | "Saved churches cleared" | "Saved churches cleared" (no change) |
| settings.js | "All data cleared" | "All data cleared" (no change) |
| examination.js | "Noted for your confession summary" | "Noted for your confession summary" (no change) |

---

## CON-13 · Monthly Devotion Cards — Expand Thin Months & Add CTAs

**Type:** Amendment  
**Target:** `src/more.js` → `MONTHLY_DEVOTIONS` array  
**Priority:** 2

**Months needing a second paragraph and/or CTA:**

**January (Holy Name):** Add CTA:
```
action: 'Find Mass near you →', actionFn: 'switchTab("panelFind",document.querySelector("[data-tab=panelFind]"))'
```

**February (Holy Family):** Add second paragraph:
```
<p>The Holy Family feast (the Sunday after Christmas) is the anchor of this devotion. Pray for your own family — for patience, forgiveness, and the grace to love as Jesus, Mary, and Joseph loved.</p>
```

**April (Eucharist):** Add CTA:
```
action: 'Find Adoration near you →', actionFn: 'switchTab("panelFind",document.querySelector("[data-tab=panelFind]"));document.querySelector("[data-filter=adoration]")&&document.querySelector("[data-filter=adoration]").click()'
```

**June (Sacred Heart):** Add CTA:
```
action: 'First Friday Tracker →', actionFn: 'openFirstFriday()'
```

**July (Precious Blood):** Add second paragraph:
```
<p>The feast of the Most Precious Blood was long celebrated on July 1. Though no longer on the universal calendar, many parishes and religious communities maintain the devotion. Consider attending an extra weekday Mass this month in gratitude for the gift of redemption.</p>
```

**August (Immaculate Heart):** Add second paragraph and CTA:
```
<p>The Five First Saturdays devotion, requested by Our Lady of Fátima, is centered on reparation to the Immaculate Heart. If you haven't started, this month is a natural time to begin.</p>
```
```
action: 'First Saturday Tracker →', actionFn: 'openFirstFriday()'
```

**September (Our Lady of Sorrows):** Add CTA:
```
action: 'Pray the Rosary →', actionFn: 'openRosary()'
```

**November (Holy Souls):** Add CTA:
```
action: 'Find Mass near you →', actionFn: 'switchTab("panelFind",document.querySelector("[data-tab=panelFind]"))'
```

**December (Immaculate Conception):** Add CTA:
```
action: 'Find Mass near you →', actionFn: 'switchTab("panelFind",document.querySelector("[data-tab=panelFind]"))'
```

---

## CON-14 · Footer Identity Line

**Type:** Amendment  
**Target:** `src/more.js` → `renderMore()` → moreFooter  
**Priority:** 3

**Current:**
```
MassFinder v2
```

**Replacement:**
```
MassFinder · A Catholic stewardship project
```

---

## CON-15 · Remove "Coming Soon" Promises

**Type:** Removal  
**Target:** `src/more.js` → `renderMore()` → libraryTeaser + moreFooter  
**Priority:** 3

**libraryTeaser:** Replace "Catholic Library — coming soon" with a link to the existing Explore module:
```html
<div class="library-teaser" onclick="openExplore()" role="button" tabindex="0">
  <div class="prayer-tool-icon" style="background:var(--color-surface-hover);color:var(--color-text-secondary)">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z"/></svg>
  </div>
  <div class="prayer-tool-body">
    <div class="prayer-tool-title">Catholic Library</div>
    <div class="prayer-tool-subtitle">Bible, Catechism, Baltimore Catechism & Summa</div>
  </div>
</div>
```

**moreFooter:** Remove "Weekly Parish Bulletin — Coming soon" row entirely. Keep Settings and version line.

**Replacement footer:**
```html
<div class="more-footer-links">
  <button class="more-footer-link" onclick="openSettings()"><span>Settings</span><span class="more-footer-chevron">›</span></button>
</div>
<div class="more-version">MassFinder · A Catholic stewardship project</div>
```

---

## CON-16 · About Section — App Identity Copy

**Type:** Addition  
**Target:** `src/settings.js` → `_render()` → About section  
**Priority:** 1

**Current:**
```
Open source. View on GitHub →
```

**Replacement:**
```html
<p class="settings-about-text">MassFinder helps you find Mass, Confession, Adoration, and other services at 93 parishes across Western New England.</p>
<p class="settings-about-text">A personal stewardship project — built and maintained by a Catholic layperson. Free, open source, and not affiliated with any diocese.</p>
<p class="settings-about-text"><a href="https://github.com/monsballoon-hue/MassFinderApp" target="_blank" rel="noopener" style="color:var(--color-primary);text-decoration:none;font-weight:var(--weight-semibold)">View on GitHub →</a></p>
```

---

## CON-17 · Ordinary Time Devotional Guide

**Type:** Addition  
**Target:** `src/devotions.js` → `DEVOTIONAL_GUIDES` array (add new entry)  
**Priority:** 2

**Draft content:**
```javascript
{
  icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 6v6l4 2"/></svg>',
  title: 'Ordinary Time',
  season: 'ordinary',
  body:
    '<p><strong>Ordinary Time</strong> isn\'t "ordinary" in the everyday sense. The name comes from the Latin <em>ordinalis</em> — meaning "counted" or "ordered." These are the numbered weeks of the liturgical year, and they make up the longest season: roughly 34 weeks total, split between winter (after Epiphany) and summer–fall (after Pentecost).</p>'
  + '<p>During Ordinary Time, the Church walks through Christ\'s public ministry week by week. The Sunday readings move sequentially through one of the Gospels (Matthew, Mark, or Luke, depending on the year\'s cycle). The liturgical color is green — symbolizing hope and growth.</p>'
  + '<details class="conf-exam">'
  + '  <summary>Living Ordinary Time well <svg style="width:16px;height:16px;flex-shrink:0;transition:transform 0.2s" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg></summary>'
  + '  <div class="conf-exam-body">'
  + '    <p>The great seasons — Lent, Easter, Advent, Christmas — have built-in intensity. Ordinary Time asks something quieter: faithfulness in the day-to-day. Some ways to enter more deeply:</p>'
  + '    <ul>'
  + '      <li>Follow the daily readings. They\'re available on the More tab.</li>'
  + '      <li>Learn about the saint of the day. The Church celebrates a saint nearly every day of the year.</li>'
  + '      <li>Pick one prayer practice — the Rosary, the Angelus, a daily examination of conscience — and stick with it through the season.</li>'
  + '    </ul>'
  + '  </div>'
  + '</details>'
}
```

**Source citations:** CCC 1163–1165 (liturgical year), General Norms for the Liturgical Year §43–44  
**Review notes:** ⛪ Verify the "ordinalis" etymology is correctly attributed.

---

## CON-18 · Prayer Book Header Line

**Type:** Addition  
**Target:** `src/prayerbook.js` → `_renderList()` (above quick-access pills)  
**Priority:** 3

**Draft content:** Add at the top of the prayer list, before the quick pills, when not searching:
```html
<div class="prayerbook-intro">Your companion for daily prayer</div>
```

**CSS class needed:** `prayerbook-intro` — `font-family: var(--font-prayer); font-size: var(--text-sm); color: var(--color-text-tertiary); text-align: center; padding: var(--space-3) 0 var(--space-1); letter-spacing: 0.02em;`

---

## CON-19 · Novena Newcomer Intro

**Type:** Addition  
**Target:** `src/novena.js` → `_renderSelect()` (when no active novenas)  
**Priority:** 3

**Draft content:** Show above "Available Novenas" label when no novenas are active:
```html
<div class="novena-intro">A novena is nine days of prayer for a specific intention. Choose one below to begin.</div>
```

**CSS class needed:** `novena-intro` — same style pattern as `prayerbook-intro` above.

---

## CON-20 · Rosary Mystery Descriptors

**Type:** Addition  
**Target:** `src/rosary.js` → `_renderSelect()` mystery buttons  
**Priority:** 3

**Draft content:** Add a subtitle line under each mystery name on the selection screen:

| Mystery | Descriptor |
|---------|-----------|
| Joyful | Christ's birth and childhood |
| Sorrowful | His suffering and death |
| Glorious | His resurrection and glory |
| Luminous | His public ministry |

**Implementation:** Add a `<div class="rosary-mystery-desc">` below each mystery title in the selection grid.

---

## CON-21 · Stations Duration Line

**Type:** Addition  
**Target:** `src/stations.js` → `_renderIntro()` intro instruction  
**Priority:** 3

**Current:**
```
At each station, we pause to reflect on Christ's suffering and offer our prayers.
```

**Replacement:**
```
At each station, we pause to reflect on Christ's suffering and offer our prayers. This guided devotion takes about 15–20 minutes.
```

---

## CON-22 · Examination Expectation-Setting

**Type:** Addition  
**Target:** `src/examination.js` → `render()` opening screen, below "Begin Examination" button  
**Priority:** 3

**Draft content:**
```html
<p class="exam-opening-hint">A prayerful review of conscience, section by section. About 10–15 minutes. Nothing is saved.</p>
```

**I18N (es):**
```
Un examen de conciencia guiado, sección por sección. Unos 10–15 minutos. No se guarda nada.
```

**CSS class needed:** `exam-opening-hint` — `font-size: var(--text-xs); color: var(--color-text-tertiary); text-align: center; margin-top: var(--space-3);`

---

## CON-23 · Search Placeholder Enhancement

**Type:** Amendment  
**Target:** `index.html` → search input placeholder (line 51)  
**Priority:** 3

**Current:**
```
Search churches, events, or services…
```

**Replacement:**
```
Search by name, town, or service…
```

---

## CON-24 · Explore Module Source Subtitles

**Type:** Addition  
**Target:** `src/explore.js` → `_renderLanding()` source tiles  
**Priority:** 3

**Draft subtitles for each source tile:**

| Source | Current title | Add subtitle |
|--------|-------------|-------------|
| Catechism (CCC) | "Catechism (CCC)" | "The Church's teaching in 2,865 paragraphs" |
| Sacred Scripture | "Sacred Scripture" | "Douay-Rheims & CPDV with cross-references" |
| Baltimore Catechism | "Baltimore Catechism" | "The faith in question-and-answer form" |
| Summa Theologica | "Summa Theologica" | "St. Thomas Aquinas" |
| Lectionary | "Lectionary" | "Sunday and daily readings index" |

**Implementation:** Add a `<div class="explore-source-subtitle">` below each `explore-source-title`.

---

## CON-25 · Ordinary Time Saved Tab Greeting

**Type:** Addition  
**Target:** `src/saved.js` → greeting/season logic (~line 562)  
**Priority:** 3

**Current during Ordinary Time:** "Good morning" (no season label)

**Enhancement:** During Ordinary Time, show the current month's devotion:
```javascript
var MONTH_DEVOTIONS_SHORT = [
  'Month of the Holy Name',      // Jan
  'Month of the Holy Family',    // Feb
  'Month of St. Joseph',         // Mar
  'Month of the Eucharist',      // Apr
  'Month of Mary',               // May
  'Month of the Sacred Heart',   // Jun
  'Month of the Precious Blood', // Jul
  'Month of the Immaculate Heart',// Aug
  'Month of Our Lady of Sorrows',// Sep
  'Month of the Rosary',         // Oct
  'Month of the Holy Souls',     // Nov
  'Month of the Immaculate Conception' // Dec
];
```

During Ordinary Time, inject: `' · ' + MONTH_DEVOTIONS_SHORT[new Date().getMonth()]`

---

## CON-26 · Chaplet Intro — "The Hour of Mercy" Context

**Type:** Addition  
**Target:** `src/chaplet.js` → `_renderIntro()` intro screen  
**Priority:** 3

**Current intro title:** "The Divine Mercy Chaplet"

**Add below the intro title, before the "Begin" button:**
```html
<p class="chaplet-intro-desc">A short prayer of trust in God's mercy, given to St. Faustina Kowalska. Prayed on rosary beads. About 10–15 minutes.</p>
```

---

## CON-27 · Divine Mercy Chaplet — "centred" Typo

**Type:** Amendment  
**Target:** `src/devotions.js` → Devotions children, Divine Mercy Chaplet body  
**Priority:** 3

**Current:** "centred on trust in God's mercy"  
**Fix:** "centered on trust in God's mercy" (American English per app convention)

---

## CON-28 · Act of Contrition Alignment ⛪

**Type:** Amendment — BLOCKED pending Catholic Review  
**Target:** `src/devotions.js` (Confession guide) AND `data/prayerbook.json` (`act_of_contrition_traditional`)  
**Priority:** 1 (after review)

**Issue:** Two different traditional wordings. Confession guide uses "dread the loss of heaven and the pains of hell." Prayer Book uses "Thy just punishments."

**Action:** Catholic Review determines canonical wording → then both locations are aligned.

---

## CON-29 · Loading Message Polish

**Type:** Amendment  
**Target:** Multiple files  
**Priority:** 3

| Module | Current | Replacement |
|--------|---------|-------------|
| rosary.js | "Loading prayers…" | "Preparing your rosary…" |
| chaplet.js | "Loading…" | "Preparing your prayer…" |
| stations.js | "Loading prayers…" | "Preparing the stations…" |
| novena.js | "Loading novenas…" | "Loading novenas…" (no change — already clear) |
| prayerbook.js | "Loading prayers…" | "Loading prayers…" (no change) |
| examination.js | "Preparing examination…" | "Preparing your examination…" |

---

*End of content spec. 29 items total.*
