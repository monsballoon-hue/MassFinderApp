# MassFinder — Catholic Terminology & Bulletin Vernacular Reference

**Purpose:** Maps the messy, informal language found in parish bulletins to the canonical terms used in the app. Used by the Bulletin Pipeline for parsing, Catholic Review for accuracy, and the Pastoral Advisor for language choices.

**Authoritative sources:** USCCB, GIRM, Roman Missal (3rd typical edition), Code of Canon Law, CCC  
**Last updated:** 2026-03-14

---

## 1. Mass & Liturgy

### How Bulletins Say It → How We Normalize It

| Bulletin Language | App Term | `config.js` Type | Notes |
|-------------------|----------|-------------------|-------|
| Mass, Holy Mass, Liturgy, Eucharist, The Eucharistic Celebration | Mass | `sunday_mass` or `daily_mass` | Classification by day, not by name |
| Vigil Mass, Saturday Vigil, Anticipated Mass, Saturday Evening Mass | Sunday Mass (Vigil) | `sunday_mass` | Saturday 2 PM or later per GIRM §115 |
| Weekday Mass, Morning Mass, Daily Mass, Low Mass | Daily Mass | `daily_mass` | Any non-Sunday, non-holy-day Mass |
| Communion Service, Communion in the Absence of a Priest, Word & Communion | Communion Service | `communion_service` | Not Mass — no consecration |
| Holy Day Mass, Solemnity Mass, Obligation Mass | Daily Mass | `daily_mass` + `day: "holyday"` | Type is Mass; day field captures obligation |
| First Friday Mass, Sacred Heart Friday | Daily Mass | `daily_mass` + `day: "first_friday"` | |
| Latin Mass, TLM, Extraordinary Form, Traditional Mass, Usus Antiquior | Mass | `daily_mass` or `sunday_mass` + `rite: "tridentine"` | |
| Spanish Mass, Misa en Español, Polish Mass, Msza Święta | Mass | Same type + `language: "es"` or `"pl"` | Language is a field, not a type |

### What Is NOT Mass

| Bulletin Language | What It Actually Is | Notes |
|-------------------|-------------------|-------|
| Bible Study with Communion | Not Mass | Educational event |
| Prayer Service | Not Mass | Devotion or prayer_group |
| Liturgy of the Word (no Eucharist) | Not Mass | Sometimes used during priest shortages |
| Memorial Mass, Funeral Mass, Wedding Mass | Not a scheduled service | One-time events, don't add to schedule |
| Mass Intention for... | Note on existing Mass | The Mass time doesn't change |

---

## 2. Sacrament of Reconciliation

### How Bulletins Say It → How We Normalize It

| Bulletin Language | App Term | Notes |
|-------------------|----------|-------|
| Confession, Confessions | Confession | Acceptable casual term per CCC §1424 |
| Reconciliation, Sacrament of Reconciliation | Confession | Formal name; app uses "Confession" for brevity and recognition |
| Penance, Sacrament of Penance | Confession | Older formal term, still correct |
| Confessions heard, Confessions available | Confession | Service listing, not event |
| By appointment, By request, Anytime by appointment | Confession (by appt.) | Add note, don't invent a time |
| Before/After Mass | Confession | Estimate time: before = Mass - 30min; after = Mass + 45min. Add note. |
| During Holy Hour | Confession | Use Holy Hour time as start time. Add note. |
| Communal Penance Service, Parish Reconciliation Service | Not recurring confession | One-time event, goes in events.json |
| First Confession, First Reconciliation | Not a public service | Sacramental prep — not a schedule item |

---

## 3. Adoration & Eucharistic Devotion

| Bulletin Language | App Term | Type | Notes |
|-------------------|----------|------|-------|
| Adoration, Eucharistic Adoration, Exposition | Adoration | `adoration` | With posted hours |
| Perpetual Adoration, 24/7 Adoration, Always Open | Perpetual Adoration | `perpetual_adoration` | ONLY if truly 24/7 |
| Holy Hour, Eucharistic Holy Hour | Holy Hour | `holy_hour` | Typically 1 hour |
| Benediction | — | Fold into adoration note | Not a separate service |
| Benediction of the Blessed Sacrament (standalone) | Devotion | `benediction` | Only if separate from adoration |
| First Friday Adoration, All-Day Adoration | Adoration | `adoration` + `day: "first_friday"` | |
| Exposition & Reposition | Adoration | Note the reposition time as `end_time` | |
| Adoration Chapel Open | Adoration | Check if truly perpetual or has posted hours | |

---

## 4. Devotions & Prayer

| Bulletin Language | App Term | Type | Notes |
|-------------------|----------|------|-------|
| Rosary, Holy Rosary, The Rosary | Rosary | `rosary` | |
| Rosary before Mass, Rosary in the chapel | Rosary | Add note with context | Estimate time if not given |
| Stations, Stations of the Cross, Way of the Cross, Via Crucis | Stations of the Cross | `stations_of_cross` | Primarily Lenten |
| Divine Mercy Chaplet, 3 O'Clock Prayer, Divine Mercy | Divine Mercy Chaplet | `divine_mercy` | |
| Miraculous Medal Novena, Monday Novena | Miraculous Medal | `miraculous_medal` | |
| Novena, Novena to [Saint] | Novena | `novena` | |
| Vespers, Evening Prayer, Liturgy of the Hours | Vespers | `vespers` | |
| Gorzkie Żale, Bitter Lamentations | Gorzkie Żale | `gorzkie_zale` | Polish Lenten devotion |
| Benediction (standalone) | Benediction | `benediction` | |
| Anointing of the Sick, Communal Anointing | Anointing of the Sick | `anointing_of_sick` | |
| Healing Mass | Daily Mass | `daily_mass` + note | It's a Mass with anointing, not a separate type |
| Prayer Group, Cenacle, Charismatic Prayer | Prayer Group | `prayer_group` | |
| Blessing of [throats, pets, etc.] | Blessing | `blessing` | Usually annual |

---

## 5. Western New England Local Vernacular

Specific to the Diocese of Springfield and surrounding area:

| Local Term | Meaning | Notes |
|------------|---------|-------|
| "The Polish Mass" | Mass in Polish language | Common in Chicopee, Springfield (St. Stanislaus, OLMC) |
| "Gorzkie Żale" | Polish Lenten devotion (Bitter Lamentations) | Sung service, usually Sunday afternoons in Lent |
| "Msza Święta" | "Holy Mass" in Polish | Found in Polish-English bilingual bulletins |
| "Misa" or "Misa en Español" | Mass in Spanish | Holy Name, OLSH Springfield, Our Lady of the Cross Holyoke |
| "CCD" or "Religious Ed" | Not a service | Education program, not a schedule item |
| "Knights" or "K of C" | Knights of Columbus | Event organizer, not a service type |
| "Altar & Rosary Society" | Parish organization | Event organizer, not a service type |
| "First Friday/Saturday" | Recurring monthly devotion | `day: "first_friday"` or `"first_saturday"` |
| "Holy Day" (without specifying which) | Holy Day of Obligation | Check USCCB calendar for the specific day |
| "Anticipated Mass" | Vigil Mass | Saturday evening Mass counting for Sunday |
| "Morning Star" | Rosary/prayer group name | Not a service type — the service is the Rosary |
| "That Man Is You" / "TMIY" | Men's faith formation program | Event, not a service |
| "Walking with Purpose" | Women's Bible study program | Event, not a service |
| "Christ Life" / "Alpha" | Evangelization programs | Events, not services |
| "Fish Fry" | Lenten Friday dinner event | Event, not a service |

---

## 6. Time Expression Normalization

| Bulletin Says | Normalize To | Notes |
|---------------|-------------|-------|
| 8:00 AM, 8 AM, 8:00am, 8am | `"08:00"` | 24-hour, zero-padded |
| 4:00 PM, 4 PM, 4pm | `"16:00"` | |
| Noon, 12 Noon | `"12:00"` | |
| Midnight | `"00:00"` | Rare |
| 4:00 – 4:45 PM | time: `"16:00"`, end_time: `"16:45"` | |
| "After 8 AM Mass" | Estimate: `"08:45"` | Add note "After 8:00 AM Mass" |
| "Before the 10 AM Mass" | Estimate: `"09:30"` | Add note "Before 10:00 AM Mass" |
| "Following Mass" | Estimate: Mass time + 45 min | Always add note |
| "By appointment" | No time — add note only | Never invent a time |
| "Varies" or "TBA" | No time — add note "Times vary" | Set `times_vary: true` |

---

## 7. Day Expression Normalization

| Bulletin Says | Normalize To | Notes |
|---------------|-------------|-------|
| Mon, Monday, Mondays | `"monday"` | |
| Mon-Fri, Monday through Friday, Weekdays | `"weekday"` | |
| Every day, Daily, 7 days a week | `"daily"` | |
| 1st Friday, First Friday of the month | `"first_friday"` | |
| 1st Saturday, First Saturday | `"first_saturday"` | |
| 2nd Sunday, Second Sunday of the month | `"sunday"` + recurrence: `{ type: "nth", week: 2 }` | |
| Last Sunday of the month | `"sunday"` + recurrence: `{ type: "last_sunday_of_month" }` | |
| Holy Days, HDO | `"holyday"` | |
| During Lent, Lenten Fridays | Add `seasonal: { is_seasonal: true, season: "lent" }` | |
| Summer schedule | Add `seasonal: { is_seasonal: true, season: "summer" }` | |

---

## 8. What Is an Event vs a Service

This is the most common source of confusion. The rule:

**Service** = regularly recurring, indefinite duration, part of the parish's standing schedule.
- Sunday Mass at 10 AM — SERVICE
- Confession every Saturday 3-4 PM — SERVICE
- Rosary before daily Mass — SERVICE

**Event** = time-bounded, has a specific date or date range, will end.
- Lenten Retreat March 21-24 — EVENT
- Fish Fry every Friday in Lent — EVENT (seasonal, will end)
- Parish Mission with Fr. Smith — EVENT
- Knights of Columbus Membership Drive — EVENT
- Confirmation prep classes — EVENT (not even a public event)

**Gray areas (resolve toward SERVICE):**
- "Stations of the Cross every Friday in Lent" — SERVICE with `seasonal.season: "lent"`
- "Adoration every First Friday" — SERVICE with `day: "first_friday"`
- "Rosary after daily Mass year-round" — SERVICE

**Gray areas (resolve toward EVENT):**
- "Special Healing Mass with Fr. Smith on March 18" — EVENT
- "40 Hours Devotion March 20-22" — EVENT
- "Communal Penance Service December 18" — EVENT
