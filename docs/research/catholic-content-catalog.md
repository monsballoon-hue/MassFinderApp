# Catholic Content Landscape — Comprehensive Catalog

**Date:** 2026-03-14
**Purpose:** Exhaustive inventory of Catholic prayers, devotions, guided experiences, and formation content that could exist within MassFinder's prayer and formation layer. No UX filtering — that's for the UX project to determine.

---

## What MassFinder Currently Has

| Category | Content | Format |
|---|---|---|
| **Guided rosary** | 4 mystery sets (Joyful, Sorrowful, Glorious, Luminous), day-mapped, bead-by-bead with Scripture, "Mysteries only" condensed mode | Interactive guided tool |
| **Stations of the Cross** | 14 stations with Scripture, meditation, prayer, response | Interactive guided tool |
| **Examination of Conscience** | 10 Commandments + precepts, centering prayer, confessional format summary, Act of Contrition | Interactive guided tool |
| **Novena tracker** | Divine Mercy, Holy Spirit, St. Joseph — 9 days each with unique daily prayers | Tracked multi-day tool |
| **Core prayers (data)** | Our Father, Hail Mary, Sign of the Cross, Apostles' Creed, Act of Contrition, Glory Be, Hail Holy Queen, O My Jesus | JSON data (used by rosary/exam) |
| **Faith guides** | Sunday Obligation, How to go to Confession, Lent, Easter, Advent, Christmas, Eucharistic Adoration, Divine Mercy Chaplet, Novena, Miraculous Medal, Gorzkie Żale, Stations of the Cross | Expandable info cards |
| **Daily readings** | First Reading, Responsorial Psalm, Gospel — from lectionary | API + local fallback |
| **Saint of the day** | From litcal data | Card on More tab |
| **CCC** | Full 2,865 paragraphs + cross-references, section navigation | Bottom sheet reader |
| **Bible** | DRB + CPDV, 74 books each, cross-references | Bottom sheet reader |
| **Baltimore Catechism** | Full text | Data file |
| **Summa Theologica** | 366 daily articles curated | Data file (not yet surfaced) |

---

## 1. NOVENAS — Expansion Candidates

### Currently in app: 3
- Divine Mercy Novena (9 days, Good Friday → Divine Mercy Sunday)
- Novena to the Holy Spirit (Ascension → Pentecost)
- Novena to St. Joseph

### Tier A — Most popular / broadly relevant novenas
These are the novenas a Western New England Catholic is most likely to want to pray. Each consists of 9 daily prayers, often with unique text per day.

| Novena | Traditional timing | Notes |
|---|---|---|
| **Sacred Heart Novena** | 9 days before Sacred Heart feast (19 days after Pentecost) | Padre Pio prayed this daily. One of the most beloved devotions in the Church. |
| **Surrender Novena** | Anytime | Fr. Dolindo Ruotolo. "O Jesus, I surrender myself to You." Enormously popular among younger Catholics. Short daily prayers. |
| **Novena to Our Lady of Perpetual Help** | Anytime / 9 Tuesdays | Very popular parish devotion, especially in the Northeast. |
| **Christmas Novena (St. Andrew)** | Nov 30 → Dec 25 (repeated 15x daily) | Traditional Advent novena. Single prayer repeated 15 times per day for 25 days. |
| **Novena to Our Lady of the Miraculous Medal** | Anytime / Nov 18-27 | Tied to existing Faith Guide on Miraculous Medal. |
| **Novena to St. Jude** | Anytime / Oct 19-28 | Patron of desperate causes. Universally known. |
| **Novena to the Infant of Prague** | Anytime / Christmas season | Popular in Czech/Slovak communities (relevant to New England). |
| **Novena to St. Anthony** | Anytime / Jun 4-13 | Patron of lost things. Extremely popular. |
| **Novena to St. Thérèse (Little Flower)** | Sep 22 → Oct 1 | Very popular, especially among women. |
| **Novena to St. Michael** | Sep 20-29 | Archangel, patron of spiritual warfare. |
| **Novena to Our Lady of Fatima** | May 5-13 | Marian apparition novena. |
| **Holy Souls Novena** | Oct 24 → Nov 1 (or Nov 2-10) | For the dead. November devotion. |

### Tier B — Strong tradition, narrower audience

| Novena | Traditional timing | Notes |
|---|---|---|
| Novena to Our Lady of Lourdes | Feb 2-11 | Healing novena. |
| Novena to Our Lady of Mount Carmel | Jul 7-16 | Carmelite devotion. |
| Novena to St. Patrick | Mar 8-17 | Irish-American communities (very relevant to New England). |
| Novena to St. Francis | Sep 25 → Oct 4 | Franciscan devotion. |
| Novena to Our Lady of Guadalupe | Dec 3-12 | Growing Hispanic population. |
| Novena to St. Monica | Aug 18-27 | Patroness of mothers, conversion of children. |
| Novena to St. Anne | Jul 17-26 | Grandmother of Jesus, patroness of grandparents. |
| Novena to St. Rita | May 13-22 | Patroness of impossible cases. |
| 54-Day Rosary Novena | Anytime (27 days petition + 27 days thanksgiving) | Unique format — not 9 days but 54. Uses rosary. |
| 30-Day Novena to St. Joseph | Feb 17 → Mar 19 | Extended format. |
| Novena to Bl. Carlo Acutis | Anytime / Oct 3-12 | Newly beatified. Resonates with young Catholics. |
| Holy Face Novena | Before Shrove Tuesday | Reparation devotion. |

### Tier C — Special-purpose novenas

| Novena | Purpose |
|---|---|
| Novena for the Dead | Anytime — praying for deceased loved ones |
| Novena for Vocations | Anytime — praying for priests and religious |
| Novena for Marriage/Family | Anytime |
| Novena for Employment | Anytime — to St. Joseph the Worker |
| Novena for Healing | Anytime — to St. Raphael or Our Lady of Lourdes |
| Novena for Protection | Anytime — to St. Michael |
| Flying Novena (Mother Teresa's) | Emergency — 10 Memorares in succession |

---

## 2. CHAPLETS — Guided Bead Prayers

Chaplets are shorter than the rosary and use beads (often rosary beads repurposed) with different prayer patterns. These are natural candidates for guided interactive experiences like the existing rosary tool.

### Tier A — Most widely prayed

| Chaplet | Structure | Notes |
|---|---|---|
| **Divine Mercy Chaplet** | Prayed on rosary beads. Eternal Father prayer on large beads, "For the sake of His sorrowful Passion" on small beads. ~10 min. | Already has a Faith Guide. Could become a guided tool like the rosary. St. Faustina. |
| **Chaplet of St. Michael** | 9 salutations (one to each angelic choir), each with 1 Our Father + 3 Hail Marys. ~15 min. | Very popular. Revealed by St. Michael to a Carmelite nun. |
| **Seven Sorrows Rosary** | 7 groups of 7 beads meditating on Mary's sorrows. ~20 min. | Also called the Servite Rosary or Dolour Beads. Powerful Lenten devotion. |
| **Chaplet of the Holy Spirit** | 5 decades focusing on the 7 gifts of the Holy Spirit. | Natural Pentecost/Confirmation devotion. |
| **Chaplet of St. Joseph** | 15 groups of 4 beads (1 white, 3 purple) meditating on Joseph's joys and sorrows. | March devotion tie-in. |

### Tier B — Well-known

| Chaplet | Notes |
|---|---|
| Chaplet of the Sacred Heart | Meditations on the Sacred Heart. June devotion. |
| Chaplet of the Holy Wounds (Five Wounds) | 5 groups of 5 Gloria Patris. Passionist devotion. Lenten. |
| Chaplet of the Blessed Sacrament | 33 beads (Christ's 33 years). Eucharistic devotion. |
| Chaplet of the Holy Name | 33 beads. January devotion. |
| Chaplet of the Precious Blood | July devotion. |
| Chaplet for the Holy Souls in Purgatory | 13 sets of 4 beads. November devotion. |
| Chaplet of Our Lady Undoer of Knots | Pope Francis's devotion. Very popular. |
| Little Crown of the Blessed Virgin Mary | 3 + 12 beads. Simple Marian chaplet. |
| Chaplet of the Immaculate Conception | Crown of Stars — 3 groups of 4 beads. December devotion. |
| Chaplet of St. Philomena | 13 red + 3 white beads. |

---

## 3. LITANIES — Call-and-Response Prayers

Litanies are rhythmic, repetitive prayers with invocations and fixed responses. Naturally suited to a guided reader format (leader/response pattern).

### Officially approved for public worship (6)

| Litany | Response pattern | Notes |
|---|---|---|
| **Litany of the Saints** | "Pray for us" / "Lord, deliver us" / "Lord, hear our prayer" | Used at baptisms, ordinations, Easter Vigil. The most ancient. |
| **Litany of Loreto (Blessed Virgin Mary)** | "Pray for us" | Most popular Marian litany. ~50 invocations. |
| **Litany of the Sacred Heart** | "Have mercy on us" | June devotion. 33 invocations. |
| **Litany of the Holy Name of Jesus** | "Have mercy on us" | January devotion. |
| **Litany of St. Joseph** | "Pray for us" | March devotion. Updated by Pope Francis in 2021. |
| **Litany of the Precious Blood** | "Save us" | July devotion. |

### Widely used for private devotion

| Litany | Notes |
|---|---|
| **Litany of Humility** | Rafael Cardinal Merry del Val. Extremely popular modern devotion. Short, powerful. |
| **Litany of Trust** | Sr. Faustina Maria Pia, SV. Modern. "From the belief that I have to earn Your love, deliver me, Jesus." Resonates strongly with younger Catholics. |
| Litany of the Blessed Sacrament | Eucharistic devotion. |
| Litany of the Holy Spirit | Pentecost/Confirmation. |
| Litany of Divine Providence | Trust-focused. |
| Litany of the Immaculate Heart of Mary | August devotion. |
| Litany of St. Michael the Archangel | September devotion. |
| Litany for the Faithful Departed | November. |
| Litany of the Divine Mercy | Extension of the Divine Mercy devotion. |

---

## 4. CONSECRATIONS & ACTS — Formal Devotional Commitments

| Consecration/Act | Duration | Notes |
|---|---|---|
| **Total Consecration to Jesus through Mary (St. Louis de Montfort)** | 33-day preparation | Multiple start dates per year keyed to Marian feasts. Enormously popular. |
| **Consecration to St. Joseph (Fr. Donald Calloway)** | 33-day preparation | Very popular recent book/devotion. |
| **Consecration to the Sacred Heart (St. Margaret Mary)** | Single act, often after Sacred Heart novena | First Friday tie-in. |
| **Consecration to the Immaculate Heart of Mary** | Single act, often on Marian feast | Five First Saturdays tie-in. |
| **Morning Offering** | Daily | Apostleship of Prayer. Short daily prayer offering the day to God. |
| **Act of Faith** | Anytime | Traditional formula. |
| **Act of Hope** | Anytime | Traditional formula. |
| **Act of Charity (Love)** | Anytime | Traditional formula. |
| **Act of Contrition** | Already in app (Examination) | Multiple versions exist (traditional, modern, child's). |
| **Act of Spiritual Communion** | When unable to receive Eucharist | Very relevant — used during COVID, homebound parishioners. |
| **Guardian Angel Prayer** | Daily / morning | "Angel of God, my guardian dear..." Very basic but universally known. |
| **Prayer to St. Michael** | After Mass (traditional) | Leo XIII prayer. Many parishes still recite it. Short. |
| **Anima Christi** | After Communion | "Soul of Christ, sanctify me..." Ignatian prayer. |
| **Memorare** | Anytime | St. Bernard. Short, powerful Marian prayer. Mother Teresa's favorite. |
| **Divine Praises** | After Benediction | "Blessed be God, Blessed be His Holy Name..." |

---

## 5. DAILY / TIMED PRAYERS — Rhythms of the Day

| Prayer | Time | Notes |
|---|---|---|
| **Angelus** | 6 AM, Noon, 6 PM (outside Easter) | V/R format. 3 Hail Marys with antiphons. |
| **Regina Caeli** | 6 AM, Noon, 6 PM (Easter season) | Replaces the Angelus. Short, joyful. |
| **Morning Offering** | Upon waking | Multiple versions. Apostleship of Prayer. |
| **Night Prayer (Compline)** | Before bed | Simplest Hour of the Divine Office. ~10 min. Includes Nunc Dimittis, examination of conscience, Marian antiphon. |
| **Three O'Clock Prayer** | 3:00 PM | Hour of Divine Mercy. "You expired, Jesus, but the source of life gushed forth for souls..." |
| **Grace Before Meals** | Before eating | "Bless us, O Lord..." Multiple versions. |
| **Grace After Meals** | After eating | "We give Thee thanks..." |
| **Prayer to One's Guardian Angel** | Morning | "Angel of God, my guardian dear..." |
| **Nightly Examination of Conscience** | Before bed | Brief 5-step Ignatian examen — distinct from the full Examination for confession. |
| **Sub Tuum Praesidium** | Anytime | Oldest known Marian prayer (~3rd century). "We fly to thy patronage..." |

---

## 6. GUIDED MULTI-STEP DEVOTIONS — Like Stations/Rosary

These are devotions with a sequential, step-by-step structure that naturally lend themselves to the kind of interactive guided experience MassFinder already does with the Rosary and Stations.

| Devotion | Steps | Notes |
|---|---|---|
| **Stations of the Cross** | 14 stations | Already in app. Multiple meditation texts exist (Alphonsus Liguori is traditional; others: John Paul II's "Scriptural Way", Newman, USCCB modern) |
| **Seven Sorrows of Mary** | 7 sorrows, each with meditation + 7 Hail Marys | Lenten/September. Mary's 7 sorrows from Scripture. |
| **Seven Joys of Mary** | 7 joys, each with meditation + Hail Mary | Franciscan devotion. Counterpart to Seven Sorrows. |
| **Seven Last Words of Christ** | 7 words from the Cross, each with meditation | Good Friday devotion. Deeply scriptural. |
| **Way of the Cross for the Holy Souls** | 14 stations adapted for prayers for the dead | November devotion. |
| **Scriptural Way of the Cross (John Paul II)** | 14 stations with only scriptural scenes | Alternative to traditional stations. |
| **Stations of the Resurrection (Via Lucis)** | 14 stations from Easter to Pentecost | Post-conciliar devotion. Easter season counterpart to Stations of the Cross. |
| **Five First Saturdays** | 5 months, each with Confession + Communion + Rosary + 15-min meditation | Our Lady of Fatima devotion. Tracked over months. |
| **Nine First Fridays** | 9 months, each with Mass + Communion on first Friday | Sacred Heart devotion. Tracked over months. |
| **Lectio Divina** | 4 steps: Read, Meditate, Pray, Contemplate | Method for praying with Scripture. Could use daily readings. |
| **Ignatian Examen** | 5 steps: Gratitude, Review, Sorrow, Forgiveness, Grace | Shorter daily version vs. the full Examination of Conscience. |
| **Spiritual Communion** | Brief guided reflection when unable to attend Mass | Especially relevant for homebound elderly. |

---

## 7. PRAYER CATALOG — Static Reference Library

Prayers that don't need a guided interactive experience but should be accessible as text, organized and searchable. Think of this as "the prayer book in your pocket."

### Essential prayers every Catholic should know

| Prayer | Length | Notes |
|---|---|---|
| Sign of the Cross | ~10 words | In app (rosary data) |
| Our Father | ~65 words | In app |
| Hail Mary | ~55 words | In app |
| Glory Be | ~30 words | In app |
| Apostles' Creed | ~110 words | In app |
| Nicene Creed | ~200 words | Said at every Sunday Mass |
| Act of Contrition | ~80 words | In app. Multiple versions. |
| Hail, Holy Queen | ~80 words | In app |
| Memorare | ~90 words | Not in app |
| Prayer to St. Michael | ~60 words | Not in app. Said after Mass in many parishes. |
| Guardian Angel Prayer | ~30 words | Not in app |
| Grace Before Meals | ~25 words | Not in app |
| Grace After Meals | ~40 words | Not in app |
| Morning Offering | ~80 words | Not in app |
| Act of Faith | ~80 words | Not in app |
| Act of Hope | ~70 words | Not in app |
| Act of Charity | ~60 words | Not in app |
| Act of Spiritual Communion | ~50 words | Not in app |
| Eternal Rest (prayer for the dead) | ~35 words | Not in app |
| Anima Christi | ~80 words | Not in app |
| Prayer Before a Crucifix | ~60 words | Traditional indulgenced prayer |
| Come, Holy Spirit | ~30 words (short) / ~150 words (sequence) | Pentecost |
| Te Deum | ~250 words | Ancient hymn of praise |
| Magnificat | ~170 words | Mary's canticle. Luke 1:46-55 |
| Benedictus | ~200 words | Zechariah's canticle. Luke 1:68-79 |
| Nunc Dimittis | ~45 words | Simeon's canticle. Luke 2:29-32. Night Prayer. |
| Divine Praises | ~150 words | Said after Benediction. |
| Confiteor | ~100 words | "I confess to Almighty God..." Said at Mass. |
| Psalm 51 (Miserere) | ~300 words | The great penitential psalm. Lenten. |
| Psalm 23 (The Lord is My Shepherd) | ~120 words | Funerals, comfort. |
| Psalm 91 (He who dwells) | ~250 words | Protection. |
| De Profundis (Psalm 130) | ~120 words | "Out of the depths..." Prayers for the dead. |

### Marian prayers

| Prayer | Notes |
|---|---|
| Hail Mary | In app |
| Hail, Holy Queen (Salve Regina) | In app |
| Memorare | St. Bernard |
| Angelus | Timed prayer (6am/noon/6pm) outside Easter |
| Regina Caeli | Replaces Angelus during Easter |
| Sub Tuum Praesidium | Oldest Marian prayer (~3rd century) |
| Ave Maris Stella | Ancient Marian hymn |
| Alma Redemptoris Mater | Advent/Christmas Marian antiphon |
| Ave Regina Caelorum | Post-Candlemas to Wednesday of Holy Week antiphon |
| O Sanctissima | Traditional Marian hymn |
| The Magnificat | Luke 1:46-55. Evening Prayer canticle. |
| Prayer to Our Lady of Perpetual Help | Popular Northeast devotion |
| Stabat Mater | Hymn of Mary at the Cross. Lenten. 20 stanzas. |
| Three Hail Marys devotion | Morning/night. For purity. |

### Prayers to saints

| Prayer | Saint | Notes |
|---|---|---|
| Prayer to St. Michael the Archangel | Michael | Post-Mass in many parishes. Leo XIII. |
| Prayer to St. Joseph | Joseph | Multiple versions. March. |
| Prayer to St. Joseph the Worker | Joseph | May 1. |
| Prayer of St. Francis (Peace Prayer) | Francis | "Lord, make me an instrument of Your peace..." |
| Prayer to St. Anthony (for lost things) | Anthony | Universally known. |
| Prayer to St. Jude (desperate causes) | Jude | Popular. |
| Breastplate of St. Patrick | Patrick | March/Irish-American. Long, dramatic. |
| Prayer to St. Thérèse (Little Flower) | Thérèse | "Let Your rain of roses fall..." |
| Prayer to St. Padre Pio | Padre Pio | Popular. |
| Prayer to St. Faustina | Faustina | Divine Mercy tie-in. |
| Prayer to Bl. Carlo Acutis | Carlo Acutis | Patron of the internet. Resonates with young Catholics. |
| Prayer to St. Peregrine (cancer) | Peregrine | Patron of cancer patients. |
| Prayer to St. Dymphna (mental health) | Dymphna | Patron of mental illness/anxiety. |
| Prayer to St. Monica (conversion of children) | Monica | Patroness of mothers. |
| Prayer to St. Gerard (expectant mothers) | Gerard | Patron of motherhood/pregnancy. |
| Prayer to St. Christopher (travelers) | Christopher | Patron of travelers. |
| Prayer to St. Cecilia (musicians) | Cecilia | Patron of music. |
| Prayer to St. Thomas Aquinas (students) | Thomas Aquinas | Before study. |
| Prayer to St. Joseph of Cupertino (exams) | Joseph of Cupertino | Patron of test-takers. |

### Prayers for specific occasions / needs

| Prayer | Occasion |
|---|---|
| Prayer Before Mass | Preparation for Eucharist |
| Prayer After Mass / Thanksgiving After Communion | Post-Communion |
| Prayer Before Confession | Examination prep |
| Prayer After Confession | Thanksgiving |
| Prayer for the Faithful Departed | Funerals, November, anytime |
| Prayer for the Sick | Anointing, hospital visits |
| Prayer for Travelers | Before a journey |
| Prayer Before Work | Daily |
| Prayer Before Study | Students |
| Prayer for Discernment of Vocation | Young adults |
| Prayer for Priests | Anytime, especially June (month of the Sacred Heart / priestly ordinations) |
| Prayer for a Happy Death | Traditional Catholic prayer |
| Prayer in Time of Suffering | Comfort |
| Prayer for Peace | World events |
| Prayer for the Pope | Anytime |
| Prayer for the Parish | Community |
| Family Prayer / Blessing of the Home | Epiphany tradition, anytime |
| Prayer Before Reading Scripture | Bible study |

---

## 8. SEASONAL DEVOTIONS — Calendar-Anchored Content

### Advent (4 weeks before Christmas)

| Content | Type |
|---|---|
| O Antiphons (Dec 17-23) | 7 daily texts |
| Advent Wreath prayers (4 Sundays + Christmas candle) | Weekly guided prayer |
| Jesse Tree readings (Dec 1-25) | Daily Scripture + ornament symbol |
| St. Andrew Christmas Novena (Nov 30 → Dec 25) | 15x daily repeated prayer |
| Rorate Caeli Mass awareness | Informational |
| Advent Lessons and Carols awareness | Informational |
| Alma Redemptoris Mater antiphon | Seasonal Marian antiphon |

### Christmas (Dec 25 → Baptism of the Lord)

| Content | Type |
|---|---|
| Christmas novena (Dec 16-24) | 9 daily prayers |
| Novena to the Infant of Prague | Traditional Christmas-season novena |
| Blessing of the Home (Epiphany) | Jan 6 guided prayer + chalk tradition |
| 12 Days of Christmas — liturgical meaning | 12 daily cards |

### Lent (Ash Wednesday → Holy Thursday)

| Content | Type |
|---|---|
| Stations of the Cross | Already in app |
| Gorzkie Żale | Already in Faith Guides |
| Seven Last Words of Christ | Good Friday guided meditation |
| Seven Sorrows of Mary | Guided bead prayer (7 × 7 Hail Marys) |
| Stabat Mater | Hymn text — Our Lady at the Cross |
| Lenten prayer of St. Ephrem | Eastern tradition, used in many Western parishes |
| Daily Lenten Scripture reflections | Could use lectionary data |
| Holy Week day-by-day guide | 8 daily cards (already in BACKLOG as IDEA-056) |
| Tenebrae awareness | Informational — the Office of Darkness |

### Easter (Easter Sunday → Pentecost)

| Content | Type |
|---|---|
| Regina Caeli | Replaces Angelus. Daily prayer text. |
| Via Lucis (Stations of the Resurrection) | 14-station guided counterpart to Stations of the Cross |
| Divine Mercy Chaplet focus | Divine Mercy Sunday (2nd Sunday of Easter) |
| Pentecost Novena | Already in app — auto-surface from Ascension |
| Veni Creator Spiritus | Pentecost hymn/prayer |
| Come, Holy Spirit (Sequence) | Pentecost sequence — one of only 4 remaining sequences in the Roman rite |
| Easter Alleluia awareness | Seasonal card |

### Ordinary Time

| Content | Type |
|---|---|
| Monthly devotion of the month | 12 rotating cards (IDEA-053) |
| First Friday / First Saturday tracking | Multi-month tracked devotion (IDEA-059) |
| Ember Days | Quarterly awareness cards |
| Rogation Days | Agricultural/community blessing awareness |
| Sacred Heart month focus (June) | Litany, novena, consecration |
| Precious Blood month focus (July) | Litany, chaplet |
| Rosary month focus (October) | Rosary promotion, Litany of Loreto |
| All Souls / Holy Souls focus (November) | Prayers for the dead, plenary indulgence info |

---

## 9. SACRAMENTAL PREPARATION — Deeper Formation Content

| Content | Sacrament | Notes |
|---|---|---|
| How to go to Confession (step-by-step) | Reconciliation | Already in Faith Guides |
| Examination of Conscience | Reconciliation | Already a guided tool |
| How to receive Communion | Eucharist | Posture, fasting rules, disposition |
| Spiritual Communion guide | Eucharist (unable to attend) | For homebound, travelers |
| Eucharistic Adoration guide | Eucharist | Already in Faith Guides |
| How to pray before the Blessed Sacrament | Eucharist | Guided meditation |
| RCIA overview | Initiation | For those exploring the faith |
| Confirmation preparation prayers | Confirmation | Gifts of the Holy Spirit, Come Holy Spirit |
| How to prepare for Anointing of the Sick | Anointing | What to expect, prayers |
| Marriage preparation prayers | Matrimony | Prayers for engaged couples |
| Prayers for vocational discernment | Holy Orders / Religious Life | For young adults |

---

## 10. CATECHETICAL / FORMATION CONTENT

| Content | Source | Notes |
|---|---|---|
| Full CCC (2,865 §§) | Already in app | Bottom sheet with cross-references |
| Baltimore Catechism | Already in app (data file) | Not yet surfaced in UI? |
| Summa Theologica daily wisdom | Already in app (data file, 366 articles) | Mentioned in BACKLOG as OW-05 — not yet surfaced |
| Doctors of the Church gallery | OW-12 in PROJECT_CONTEXT | Stretch goal |
| Precepts of the Church (6) | Could be a Faith Guide | Basic obligations |
| Corporal Works of Mercy (7) | Could be a Faith Guide | Feed the hungry, visit the sick, etc. |
| Spiritual Works of Mercy (7) | Could be a Faith Guide | Counsel the doubtful, pray for the living and dead, etc. |
| Theological Virtues (3) | Faith, Hope, Charity | Brief formation content |
| Cardinal Virtues (4) | Prudence, Justice, Fortitude, Temperance | Brief formation content |
| Gifts of the Holy Spirit (7) | Wisdom, Understanding, Counsel, Fortitude, Knowledge, Piety, Fear of the Lord | Confirmation / Pentecost |
| Fruits of the Holy Spirit (12) | Charity, Joy, Peace, Patience, Kindness, Goodness, Generosity, Gentleness, Faithfulness, Modesty, Self-control, Chastity | |
| Beatitudes (8) | Matthew 5:3-12 | |
| Ten Commandments | In app (Examination) | Already structured |
| Precepts of the Church | 5-6 basic obligations | "The bare minimum" |
| Holy Days of Obligation (6 in US) | In app (Faith Guide + HDO banner) | |
| Plenary Indulgence conditions | When relevant (All Souls, Divine Mercy Sunday, etc.) | |
| How to pray the Liturgy of the Hours | Guide/overview | The prayer of the Church |
| How to do Lectio Divina | 4-step guide | Praying with Scripture |
| What happens at Mass (guide) | Step-by-step Mass walkthrough | For new/returning Catholics |

---

## 11. MARIAN ANTIPHONS — The Four Seasonal Antiphons

The Church prescribes four Marian antiphons that rotate with the liturgical season, traditionally sung at Compline (Night Prayer):

| Antiphon | Season | Notes |
|---|---|---|
| **Alma Redemptoris Mater** | Advent → Feb 1 | "Loving Mother of the Redeemer" |
| **Ave Regina Caelorum** | Feb 2 → Wednesday of Holy Week | "Hail, Queen of Heaven" |
| **Regina Caeli** | Easter → Pentecost Saturday | "Queen of Heaven, rejoice!" (Also replaces Angelus) |
| **Salve Regina (Hail, Holy Queen)** | Pentecost → Advent | Already in app as rosary closing prayer |

These four texts are short (each ~50-80 words), public domain, and rotate automatically by season. A natural fit for a "Marian Prayer of the Season" card.

---

## 12. LATIN/ENGLISH PAIRS — For the Tradition-Minded

Several prayers have beloved Latin forms. The app could offer both (per OW-07 in PROJECT_CONTEXT stretch goals):

| Prayer | Latin incipit |
|---|---|
| Our Father | Pater Noster |
| Hail Mary | Ave Maria |
| Glory Be | Gloria Patri |
| Hail, Holy Queen | Salve Regina |
| Angelus | Angelus Domini |
| Regina Caeli | Regina Caeli |
| Come, Holy Spirit | Veni Creator Spiritus / Veni Sancte Spiritus |
| Soul of Christ | Anima Christi |
| Memorare | Memorare |
| Act of Contrition | Actus Contritionis |
| Apostles' Creed | Symbolum Apostolorum |
| Nicene Creed | Credo in unum Deum |
| Te Deum | Te Deum laudamus |
| Sub Tuum | Sub Tuum Praesidium |
| Tantum Ergo | Tantum Ergo Sacramentum |
| O Salutaris Hostia | O Salutaris Hostia |
| Adoro Te Devote | Adoro Te Devote |

---

## Summary Counts

| Category | Items in app | Possible additions |
|---|---|---|
| Novenas | 3 | 25+ Tier A/B candidates |
| Chaplets | 0 guided (1 info card) | 10+ Tier A/B candidates |
| Litanies | 0 | 6 official + 10+ popular private |
| Consecrations/Acts | 1 (Act of Contrition) | 15+ |
| Guided multi-step devotions | 3 (Rosary, Stations, Examen) | 10+ candidates |
| Daily/timed prayers | 0 | 10+ |
| Static prayer texts | 8 (in rosary data) | 60+ essential prayers |
| Seasonal devotions | Partial (colors, guides) | 30+ specific content items |
| Formation guides | Partial (Faith Guides, CCC) | 15+ topical guides |
| Marian antiphons | 1 (Salve Regina in rosary) | 3 more seasonal antiphons |

---

## Data Characteristics

Almost everything in this catalog is **public domain** or **traditional text without copyright issues.** The prayers, litanies, and devotional texts are centuries old. The primary work is:

1. **Curation** — selecting the right version/translation of each prayer
2. **Data entry** — typing or sourcing the text into JSON
3. **Categorization** — tagging by season, occasion, saint, sacrament, type
4. **Formatting** — marking up V/R patterns, responses, rubrics

No APIs required. No ongoing maintenance. Once built, this data is permanent.
