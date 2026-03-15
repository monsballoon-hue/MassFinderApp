# Pastoral Handoff → Bulletin Pipeline

**From:** MassFinder Pastoral Advisor (Fr. Mike)
**Date:** 2026-03-15
**Priority:** Critical — this is pastoral priority #1 from the full app audit
**Action required:** Understand the pastoral stakes of data freshness; prioritize confession time accuracy

---

## Context

I completed a comprehensive pastoral audit of the full MassFinder app. My conclusion: **data accuracy for confession times is the single most important priority across the entire project.** Everything else — prayer tools, seasonal content, design refinements — is secondary to this.

This document explains *why* from a parish perspective, so that data freshness decisions can be made with pastoral weight, not just technical priority.

---

## Why Confession Times Are Different From Mass Times

If someone shows up to Mass at the wrong time, they're inconvenienced. They'll go next week, or find another parish that day. It's frustrating but recoverable.

If someone shows up to confession at the wrong time — especially someone like Kevin, who hasn't been in 15 years and is finally working up the courage — and the door is locked... that person may not try again for months. Or years. Or ever.

I've heard this in my own confessional: "I tried to go at St. Mary's last month, but nobody was there." The window of willingness is narrow. Confession requires vulnerability. A lapsed Catholic making the decision to confess has overcome enormous internal resistance. A locked door at the wrong time is not a minor inconvenience — it's a pastoral failure.

**This is why I'd rather have "Call for times" than a wrong time.** Wrong information is worse than no information.

---

## What Changes Most Often (and Gets Stale Fastest)

From 22 years of pastoring, here's what actually changes in parish schedules, roughly in order of frequency:

1. **Confession times** — Priests get reassigned, go on vacation, get sick. Confession is often one priest's schedule, and when that priest is unavailable, the time changes or gets canceled with minimal notice. Some parishes only update their bulletin, not their website.

2. **Daily Mass times** — Summer schedules, holiday weeks, priest shortages. A parish that normally has 7 AM and 9 AM daily Mass drops to one when the parochial vicar is reassigned.

3. **Seasonal services** — Lenten Stations times change year to year. Holy Week schedules are annual and unique. Adoration hours shift when volunteer coverage changes.

4. **Sunday Mass times** — These are the most stable, but they do change — especially when parishes merge or a priest covers multiple parishes.

**Implication for the pipeline:** Confession time validation should happen more frequently than other service types. If a bulletin mentions a confession time change, that update should propagate fast.

---

## Specific Scenarios to Watch For

These are patterns I've seen in actual parish bulletins that create stale data:

**"Confessions suspended until further notice"** — Priest is ill, on sabbatical, or the parish is between pastors. The bulletin says this once and then stops mentioning it. The app still shows the old times for months.

**"Summer schedule begins June 15"** — Daily Mass drops from two times to one. Confession moves from Saturday afternoon to by-appointment-only. If the app doesn't pick up the summer schedule transition, the data is wrong for three months.

**"Fr. Smith is on retreat this week — no confession Saturday"** — One-week disruption. Not worth changing the standing data. But someone checking the app that Saturday will see a time that doesn't exist.

**"Confessions: Before all Masses"** — Some bulletins say this without specifying a time. The app needs to either estimate the time (Mass time minus 30 minutes, with a note) or show "Before Mass" as the description. What it must NOT do is show nothing, because then the parish appears to have no confession.

**Holy Week schedules** — Confession availability often *increases* during Holy Week (extra hours on Wednesday/Thursday) but the regular Saturday slot may not exist (because Holy Saturday has the Easter Vigil instead). This is the highest-traffic confession week of the year and the most likely to have schedule deviations.

---

## What "Verified" Means Pastorally

The validation checklist has fields for `status: "verified"`, `last_checked`, and `bulletin_date`. From a pastoral standpoint:

- A parish verified **within the last 2 months** is trustworthy for Sunday Mass times.
- A parish verified **within the last month** is trustworthy for confession times.
- A parish verified **more than 3 months ago** should show a subtle indicator that times may have changed — or at minimum, surface the parish phone number prominently.
- **Holy Week data** should be verified against the current year's bulletin, not last year's. Easter moves. The entire schedule shifts.

---

## The 245 Confession Listings

There are currently 245 confession service entries across 93 parishes. That's good coverage. But each of those 245 entries is a promise to someone like Kevin: "If you go here at this time, a priest will be waiting for you." Every promise we can't keep is a potential soul lost.

If the pipeline has to prioritize which parishes to re-validate first, I'd suggest:
1. Parishes where the last bulletin check is oldest
2. Parishes with confession times that seem unusual (very early, very late, unusual days)
3. Parishes where the confession time is listed as only "by appointment" — verify whether they also have scheduled hours that aren't captured

---

## One Request

If the pipeline ever encounters a situation where it's uncertain whether a confession time is still accurate — the bulletin is ambiguous, the website is outdated, the data is from months ago — err toward showing the parish phone number and a note like "Call to confirm times" rather than displaying a time that might be wrong.

The app should never promise something it can't deliver. Especially not this.
