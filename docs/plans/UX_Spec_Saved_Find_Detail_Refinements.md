# UX Spec — Saved Tab, Find Tab & Detail Panel Refinements

**Date:** 2026-03-13  
**Author:** UX Consultant (Claude Opus)  
**Status:** Implemented
**Related IDEAs:** 023, 025, 045, 046, 047, 054, 056

### Item Status Summary
- SFD-01 — Find Tab: Live/Soon Card Overload — **done**
- SFD-02 — Detail Panel: Mass Schedule Readability — **done**
- SFD-03 — Detail Panel: Quick Actions & Contact Info Redesign — **done**
- SFD-04 — Detail Panel: Coming Up Today vs Tomorrow — **done**
- SFD-05 — Saved Tab: Your Churches Section Optimization — **done**
- SFD-06 — Saved Tab: Header & Today Card Hierarchy — **done**

---

## Table of Contents

1. [SFD-01] Find Tab — Live/Soon Card Overload
2. [SFD-02] Detail Panel — Mass Schedule Readability
3. [SFD-03] Detail Panel — Quick Actions & Contact Info Redesign
4. [SFD-04] Detail Panel — Coming Up: Today vs Tomorrow Visual Separation
5. [SFD-05] Saved Tab — "Your Churches" Section Optimization
6. [SFD-06] Saved Tab — Header & Today Card Hierarchy

---

## [SFD-01] Find Tab — Live/Soon Card Overload

**Files:** `src/render.js`, `src/data.js`, `css/app.css`

### User Story

A user opens MassFinder at 8:17 AM on a weekday. They have a specific intent: *find Mass near me right now, or find Confession this afternoon.* Instead, the Find tab presents ~25 cards all badged "Live" or "Soon" because 7:00–9:00 AM is peak service time across 93 parishes. Every card looks equally urgent. The information hierarchy is flat — there is no gradient of relevance.

**72-year-old parishioner:** Opens the app to find morning Mass. Sees a wall of green "Live" badges. Cannot distinguish "this church 2 miles away has Mass starting in 12 minutes" from "a church 13 miles away has Adoration that started an hour ago." Scrolls, gives up, drives to the usual parish.

**25-year-old:** Sees 25 identical-looking cards with no visual hierarchy. Nothing feels personalized or smart. Bounces to Google Maps and searches "Catholic church near me."

**45-year-old parent:** Has 8 minutes before the school run. Needs to know: is there a Mass I can actually make? Scanning 25 cards to find the one within 5 miles starting in 10 minutes is impossible in the time available.

### Root Cause

1. `isSoon` triggers when `minutesUntil <= 60` — at 8:00 AM, every 8:30 and 9:00 service across the region qualifies
2. `isLive` triggers for any service currently in progress — at 8:00 AM, every 7:00 and 7:30 service is live
3. Sort by `next_service` with a 15-mile proximity gate isn't selective enough — 15 miles in Western New England covers the entire Springfield metro area
4. The card design treats Live and Soon as equally prominent badge states, but the user need is *relative urgency*: "can I make it?"

### Proposed Fix

#### SFD-01-A: Tiered badge system — replace binary Live/Soon with graduated urgency

**Before:** Every service within 60 minutes gets the same green "Live" pill or gold "Soon" pill.

**After:** Three visual tiers based on *reachability*, not just time:

| Tier | Condition | Card Treatment | Badge |
|------|-----------|---------------|-------|
| **Imminent** | `isSoon && minutesUntil <= 20 && distance <= 8` | Elevated card with accent left-border, hero-sized time | `in X min` — accent background pill |
| **Available** | `isLive \|\| isSoon` (remaining) | Standard card, normal badge | `Live` or `Soon` as today, but smaller/muted |
| **Upcoming** | Next service > 60 min away, today | Standard card, no badge | Time + day label only |

The key insight: "Live" is not necessarily useful to the user — a service that's been running for 40 minutes is *less* actionable than one starting in 12 minutes. The badge should encode *can I still get there?*, not just *is it happening?*.

#### SFD-01-B: Smart grouping header on the Find tab

When 5+ cards share the same badge state, insert a contextual section header that helps users scan:

```
── Near you now ──────────────────
[2-3 imminent cards, sorted by distance]

── Also happening ────────────────
[Remaining Live/Soon cards]
```

This is not a UI tab or mode — it's a lightweight divider rendered inline in the card list, similar to how the Saved tab uses `saved-divider`.

#### SFD-01-C: Tighten the proximity gate for time-sorted view

**Before (data.js:120):** `distance <= 15` gets priority in time-sort.  
**After:** `distance <= 8` for the imminent tier. This scopes the "near you" bucket to a realistic driving radius for a service starting in under 20 minutes.

### Implementation Notes

**render.js changes:**
- In `renderCards()`, after computing `next` for each card, add an `urgencyTier` property: `'imminent'`, `'available'`, or `'upcoming'`
- The `imminent` condition: `(next.isSoon && next.minutesUntil <= 20 && dist !== null && dist <= 8)`
- Add a new card class `parish-card--imminent` with elevated styling
- Insert section divider HTML between tiers when `imminentCount >= 1 && availableCount >= 3`

**data.js changes:**
- In `sortChurches()`, for `next_service` sort: within the `aClose` proximity gate, sub-sort imminent cards above available cards

**css/app.css changes:**
- `.parish-card--imminent` — accent left-border (`3px solid var(--color-accent)`), slightly elevated shadow
- `.find-section-divider` — matches `.saved-divider` pattern: `font-size: var(--text-xs)`, `font-weight: var(--weight-semibold)`, `color: var(--color-text-tertiary)`, `text-transform: uppercase`, with horizontal rules

**Badge changes:**
- `.card-live-badge` and `.card-soon-badge` on non-imminent cards: reduce to `font-size: 11px`, `padding: 1px 6px`, muted background
- New `.card-imminent-badge`: `font-size: var(--text-xs)`, `background: var(--color-accent-pale)`, `color: var(--color-accent-text)`, `padding: 2px 8px`, `border-radius: var(--radius-full)`

### Test Checklist

- [ ] At 8:00 AM with location enabled: ≤3 cards in "Near you now" section, all within 8 miles and starting within 20 min
- [ ] Live services > 40 min into their duration show muted badge, not imminent
- [ ] Cards without Live/Soon still render normally with day labels
- [ ] No-location fallback: skip section dividers, show flat list with current badge behavior
- [ ] Dark mode: all new badge/tier colors have dark mode overrides
- [ ] Proximity sort respects saved-church float-to-top behavior

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — added urgencyTier computation (imminent/available/upcoming), tiered badge rendering with muted variants for non-imminent, section divider injection ("Near you now" / "Also happening"); `css/app.css` — new `.parish-card--imminent`, `.card-imminent-badge`, `.card-live-badge--muted`, `.card-soon-badge--muted`, `.find-section-divider` classes with dark mode overrides
- **Approach:** Urgency tier is computed render-side only (no data.js changes). The 8-mile proximity threshold is checked against `dist` on each card item. Dividers are injected into the cards array after the map phase but before the saved-church separator, using a parallel tier-tracking array. The sort proximity gate in data.js remains at 15 miles.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## [SFD-02] Detail Panel — Mass Schedule Readability

**Files:** `src/render.js`, `css/app.css`

### User Story

The user has tapped into a church detail card and scrolled to the Mass Schedule accordion (which auto-opens). They want to answer one question: *When is Mass on the day I'm interested in?* The current rendering shows all days in a flat list — Sunday, Weekdays, Monday (extra), Saturday, Holy Days — with identical visual weight. The inline time rendering (`8:30 · 10 · 11:30 Spanish AM`) is compact but requires parsing: "Is 10 a time? 10 AM? Are all three AM?" The `Weekdays TODAY` tag helps but doesn't elevate the today row enough to be the first thing the eye catches.

**72-year-old parishioner:** Squints at the schedule. "Is 10 a Mass time or a number of services?" The inline dot-separated rendering is space-efficient but not accessible. Vigil badge on Saturday is `11px` and light purple — nearly invisible.

**25-year-old:** Wants to glance and immediately know: "What's today's situation? Can I catch the next one?" The schedule reads like a reference table, not an answer to their question.

**45-year-old parent wrangling kids:** Has one thumb free. Needs to see Saturday 4 PM Vigil Mass immediately. Instead, must scroll past Sunday, Weekdays, Monday, before reaching Saturday. Each section looks identical.

### Proposed Fix

#### SFD-02-A: "Today first" dynamic reordering

The schedule should always lead with today's services, regardless of canonical day ordering.

**Before:** Sunday → Weekdays → Monday → Saturday → Holy Days (fixed liturgical order)  
**After:** [Today's day] → [Tomorrow] → [Rest in liturgical order]

If today is Thursday, the schedule renders: **Weekdays (TODAY)** → Saturday → Sunday → Monday → Holy Days.

This is a rendering change only — the underlying data stays the same. The `renderSched()` function in `render.js:812` already receives `todayDay`. Use it to reorder the output sections.

**Implementation in `render.js` `renderSched()`:**

After building all day groups (line ~891-933), instead of always starting with Sunday:

```
// New render order:
// 1. Today's group (with hero treatment)
// 2. Tomorrow's group  
// 3. Remaining days in liturgical order
// 4. Special days (holyday, first_friday, etc.)
```

#### SFD-02-B: Elevated "today" treatment

**Before:** Today's group gets a subtle left-border and small `TODAY` tag.

**After:** Today's group gets:
- A distinct background card: `background: var(--color-accent-pale)` with `border-radius: var(--radius-md)` and `padding: var(--space-3) var(--space-4)`
- The `TODAY` tag becomes larger: `font-size: var(--text-xs)` → `font-size: 12px`, `padding: 2px 10px`
- Times within the today group render at `var(--text-lg)` instead of `var(--text-sm)` — making them the visual anchor
- A subtle "next service" indicator: if a service is upcoming today, its time gets the accent color

#### SFD-02-C: Improve inline time readability

The inline rendering `8:30 · 10 · 11:30 Spanish AM` has two issues:
1. Bare numbers without `:00` are confusing (is "10" a time or a count?)
2. The shared AM/PM suffix at the end requires the eye to scan back

**Fixes:**
- Always render `:00` on hour times: `10:00` not `10`. Change `fmt12bare()` call in `_renderInline()` to always include minutes.
- Increase inline time font size from `var(--text-sm)` to `var(--text-base)` for legibility
- Add `font-weight: var(--weight-semibold)` to `.schedule-inline-time`

**In `src/utils.js` — modify `fmt12bare()`:** Always output minutes. If the current implementation strips `:00`, stop stripping it.

#### SFD-02-D: Vigil badge visibility

The `Vigil` badge on Saturday is rendered in light purple at `11px` — it's nearly invisible.

**Fix:** Increase to `font-size: 12px`, `padding: 2px 8px`, `font-weight: var(--weight-semibold)`. Use `background: var(--color-primary-bg)`, `color: var(--color-primary)` to match the app's primary color system instead of standalone purple.

### Test Checklist

- [ ] Open detail on a Thursday: Weekdays (TODAY) renders first, then Saturday, then Sunday, then Monday
- [ ] Open detail on a Sunday: Sunday (TODAY) renders first, then Weekdays, then Saturday
- [ ] Collapsed weekday group works correctly when today is a weekday
- [ ] "10" times always render as "10:00" in inline mode
- [ ] Today's group has distinct background that reads in both light and dark mode
- [ ] Vigil badge is legible at arm's length on mobile
- [ ] Holy Days section still renders in its correct position (after regular days)
- [ ] Auto-open accordion still targets the correct section based on filter context

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — refactored renderSched() to collect sections into an array with priority metadata (today/tomorrow/regular/special), then sort before rendering; `src/utils.js` — modified fmt12bare() to always include `:00` on hour times; `css/app.css` — updated `.schedule-day--today` with accent-pale background and rounded corners, `.schedule-today-tag` enlarged to 12px, `.schedule-inline-time` bumped to text-base, `.schedule-vigil-badge` made larger and bolder with primary color system
- **Approach:** Schedule reordering collects all rendered day groups (including collapsed weekdays) into a `sections` array with `priority` (today/tomorrow/regular/special) and `order` (DAY_ORDER index). The array is sorted by priority then order, so today always renders first regardless of liturgical position. Collapsed weekday groups inherit their priority from whether today/tomorrow is a weekday. `fmt12bare` now always outputs minutes — "10:00" instead of "10".
- **Deviations from spec:** Dark mode for schedule-day--today changed to use accent-tinted background (`rgba(212,168,75,0.06)`) instead of the previous blue tint, for consistency with the accent color system.
- **Known issues:** None observed

---

## [SFD-03] Detail Panel — Quick Actions & Contact Info Redesign

**Files:** `src/render.js`, `css/app.css`

### User Story

The user has opened a church detail and scrolled past the schedule. They see four large square buttons (Call, Directions, Bulletin, Share) taking up significant real estate, followed by a text list of pastor name, website URL, office hours, and email. The user's likely intents at this point are:

1. **Get there** (Directions) — high frequency
2. **Call the office** — moderate frequency, usually to confirm something
3. **Check the bulletin** — moderate frequency, weekly habit for regular parishioners

The current layout gives all four CTAs equal visual weight in a 4-column grid. "Share" — by far the least-used action — occupies the same prime real estate as "Directions."

Below the CTAs, the contact info is a flat list of items with no visual hierarchy. Office hours — a dense string like `Mon/Tue/Thu 9:00 AM - 3:00 PM, Wed 9:00 AM - 5:00 PM, Fri 9:00 AM - 11:30 AM` — is buried as one of several lines, all the same size.

**Data availability across 93 parishes:**
- Phone: 93/93 (100%)
- Website: 88/93 (95%)
- Bulletin URL: 88/93 (95%)
- Office hours: 81/93 (87%)
- Email: 81/93 (87%)
- Facebook: 17/93 (18%)
- Instagram: 7/93 (8%)

### Proposed Fix

#### SFD-03-A: Restructure CTAs as primary/secondary

**Before:** 4 equal square buttons in a row.

**After:** Two tiers:

**Primary row** (full-width, prominent):
- **Directions** — full-width button, accent background, most prominent CTA. This is the #1 action after viewing schedule times.
- Styled as: `display: flex; width: 100%; padding: var(--space-3) var(--space-4); background: var(--color-primary); color: var(--color-text-inverse); border-radius: var(--radius-md); font-size: var(--text-base); font-weight: var(--weight-semibold); align-items: center; justify-content: center; gap: var(--space-2); min-height: 48px`

**Secondary row** (compact, three items):
- **Call** | **Bulletin** (or **Website** if no bulletin) | **Share**
- Styled as smaller pill-shaped buttons: `padding: var(--space-2) var(--space-3); border: 1px solid var(--color-border); border-radius: var(--radius-full); font-size: var(--text-sm); color: var(--color-primary); background: transparent`
- Each gets icon + label inline

This follows Apple HIG's pattern: one dominant action, secondary actions visually recessed.

#### SFD-03-B: Contact info as structured card, not flat list

**Before:** A flat list of contact items, each with icon + text, no grouping.

**After:** A compact card grouping contact info with clear visual hierarchy:

```
┌─────────────────────────────────────────┐
│  Fr. Jonathan Reardon, Pastor           │
│                                         │
│  📞 (413) 555-1234      ✉ eramos@...   │
│  🌐 www.stmarysof...                   │
│                                         │
│  Office Hours                           │
│  Mon/Tue/Thu  9 AM – 3 PM              │
│  Wed          9 AM – 5 PM              │
│  Fri          9 AM – 11:30 AM          │
└─────────────────────────────────────────┘
```

Key changes:
- Pastor name in `font-weight: var(--weight-semibold)`, `font-size: var(--text-base)`, role label as subtitle
- Phone and email on a single row as tappable links, `font-size: var(--text-sm)`
- Office hours parsed and rendered as a structured mini-table instead of a single long string
- Website as a subtle link below phone/email

#### SFD-03-C: Office hours parsing

The current rendering dumps the raw `office_hours` string. Many are formatted like `Mon/Tue/Thu 9:00 AM - 3:00 PM, Wed 9:00 AM - 5:00 PM, Fri 9:00 AM - 11:30 AM`.

Add a utility function `parseOfficeHours(str)` that attempts to split on commas or semicolons and render each segment on its own line. If parsing fails (freeform text like "Varies"), fall back to raw string display.

This isn't a hard requirement but significantly improves readability of what's currently the densest text block in the detail panel.

#### SFD-03-D: Phone number tappable in event detail (IDEA-056)

The contact phone number on event detail cards should be wrapped in `<a href="tel:...">`. This is already done in the main church detail `quick-action` Call button but may be missing from the event card flow. Verify and fix.

### Implementation Notes

**render.js changes (openDetail function, ~line 466-471):**
- Replace the 4-column grid `detail-quick-actions` with a 2-row layout: `.detail-primary-action` + `.detail-secondary-actions`
- Restructure `chtml` contact section to use the card layout described above

**css/app.css changes:**
- `.detail-primary-action` — full-width accent CTA
- `.detail-secondary-actions` — `display: flex; gap: var(--space-2); justify-content: center`
- `.detail-secondary-action` — pill-shaped outline buttons
- `.detail-contact-card` — replaces `.detail-contact`, adds padding and background
- `.detail-office-hours` — multi-line rendering with `font-variant-numeric: tabular-nums`

### Test Checklist

- [ ] Directions button is visually dominant (primary action)
- [ ] Call button links to tel: correctly
- [ ] Bulletin falls back to Website when bulletin_url is null
- [ ] Share button still triggers `shareParish()`
- [ ] Office hours render multi-line when parseable, single line when freeform
- [ ] Contact card displays correctly when optional fields (email, Facebook) are missing
- [ ] Dark mode: primary CTA remains high-contrast, secondary buttons readable
- [ ] All touch targets meet 44×44pt minimum

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — replaced 4-column quick-action grid with 2-tier layout (primary Directions + secondary pills), restructured contact section as card with parsed office hours; `src/utils.js` — added `parseOfficeHours()` utility function; `css/app.css` — new `.detail-primary-action`, `.detail-secondary-actions`, `.detail-secondary-action`, `.detail-contact-card`, `.contact-pastor-name`, `.contact-links-row`, `.contact-link`, `.detail-office-hours`, `.detail-office-hours-line` classes with dark mode overrides
- **Approach:** Directions is now a full-width primary CTA with accent background. Call, Bulletin/Website, and Share are compact pill-shaped secondary buttons. Contact info restructured as a card with pastor name prominent, phone+email inline, office hours parsed via `parseOfficeHours()` (splits on commas/semicolons), and website as subtle link. SFD-03-D verified: event detail cards already use `tel:` links for contact phones.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## [SFD-04] Detail Panel — Coming Up: Today vs Tomorrow Visual Separation

**Files:** `src/render.js`, `css/app.css`

### User Story

The "Coming Up" block in the detail panel shows the next 2-3 services chronologically. It's a useful at-a-glance widget. But looking at screenshot 4, "2:30 PM – 3:30 PM Confession Tomorrow" and "4 PM Sunday Mass Tomorrow" are visually identical to a hypothetical today service that might appear above them. The only differentiator is the word "Tomorrow" in small tertiary text at the right edge — easy to miss.

**72-year-old:** Sees "2:30 PM Confession" and thinks it's today. Drives to the church. It's tomorrow.

**25-year-old:** Scans the Coming Up block quickly. The visual uniformity means they treat all three rows as "next up" without registering the day boundary.

**45-year-old parent:** Is planning around tomorrow's Confession and today's Mass. Needs to immediately distinguish the two timeframes without reading fine print.

### Proposed Fix

#### SFD-04-A: Visual day boundary in Coming Up

Insert a lightweight separator between today and tomorrow rows inside the Coming Up block.

**Before:**
```
COMING UP
2:30 PM – 3:30 PM   Confession    Tomorrow
4 PM                 Sunday Mass   Tomorrow
```

**After:**
```
COMING UP
[today rows if any, with "Today" label or relative time]

── Tomorrow ──
2:30 PM – 3:30 PM   Confession
4 PM                 Sunday Mass
```

When all Coming Up items are tomorrow (because no more services remain today), show the "Tomorrow" header at the top of the block to set context immediately.

#### SFD-04-B: Tomorrow rows get subdued styling

- Today rows: `color: var(--color-text-primary)` for time, accent left-border for live/soon
- Tomorrow rows: `color: var(--color-text-secondary)` for time, `opacity: 0.85` on the row, no left-border
- The day label ("Tomorrow") moves from inline-right to a section header, styled like `.saved-divider`

#### SFD-04-C: Today rows get urgency enhancement

When a Coming Up row is for today:
- Show relative time: `in 3 hrs` or `in 45 min` (this already exists in the code at line 364-373)
- If `isSoon` (within 60 min): add the accent left-border (`border-left: 3px solid var(--color-accent)`) to that specific row
- If `isLive`: add verified-green left-border

### Implementation Notes

**render.js changes (_getComingUp function, ~line 355-386):**
- After building results, partition into `todayResults` (daysUntil === 0) and `tomorrowResults` (daysUntil === 1)
- Render today results first with `detail-coming-row--today` class
- If tomorrow results exist, insert `<div class="detail-coming-separator">Tomorrow</div>`
- Render tomorrow results with `detail-coming-row--tomorrow` class
- Remove inline "Tomorrow" text from individual row `dayLabel` since it's now a section header

**css/app.css changes:**
```css
.detail-coming-separator {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: var(--space-2) 0 var(--space-1);
  margin-top: var(--space-1);
  border-top: 1px solid var(--color-border-light);
}
.detail-coming-row--tomorrow .detail-coming-time {
  color: var(--color-text-secondary);
}
.detail-coming-row--today .detail-coming-time {
  color: var(--color-primary);
  font-weight: var(--weight-bold);
}
```

### Test Checklist

- [ ] At 8 AM: Coming Up shows today's remaining services above tomorrow's, with separator
- [ ] At 10 PM (no today services left): Coming Up shows "Tomorrow" header at top
- [ ] Relative time labels work correctly for today rows
- [ ] Tomorrow rows are visually subdued compared to today
- [ ] Dark mode separator and text colors verified
- [ ] The detail-coming-up block's accent left-border still applies to the container

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/render.js` — refactored `_getComingUp()` to partition results into todayResults/tomorrowResults, render today first with urgency classes, insert "Tomorrow" separator, render tomorrow rows with subdued class; `css/app.css` — new `.detail-coming-separator`, `.detail-coming-row--today`, `.detail-coming-row--tomorrow`, `.detail-coming-row--soon`, `.detail-coming-row--live` classes with dark mode override
- **Approach:** Results are partitioned by `daysUntil`. Today rows get urgency border-left (accent for soon, verified-green for live) and bold primary time color. Tomorrow rows get secondary text color and 0.85 opacity. When all results are tomorrow, the header reads "Coming Up — Tomorrow". Individual "Tomorrow" labels are suppressed on tomorrow rows since the separator header provides context.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## [SFD-05] Saved Tab — "Your Churches" Section Optimization

**Files:** `src/saved.js`, `css/app.css`

### User Story

The user scrolls to the bottom of the Saved tab and sees "Your churches · 3 | Edit" followed by three compact rows: church name, city, distance, event count, next service time+type+day, and a chevron. This section serves as a quick-reference directory of saved parishes.

Looking at screenshot 5, the current rendering is functional but raises several questions:

1. **Is this redundant with the Today card above?** The Today card already shows services from these same churches. The user sees "8:30 AM Daily Mass Today — St. Mary" in the Today card, then scrolls down and sees "St. Mary — 8:30 AM Daily Mass Today" in Your Churches. Same information, different layout.

2. **What unique value does this section provide?** It answers: "What are my saved churches and what's coming up at each one?" — a church-centric view vs the Today card's time-centric view. This *is* meaningfully different for users with 3+ saved churches.

3. **The "Soon" badge:** St. Mary shows a gold "Soon" badge — but this duplicates the "in 13 min" treatment already visible in the Today card above.

**72-year-old:** The text is at `var(--text-sm)` (0.9375rem / ~15px) for church names and `var(--text-xs)` (0.8125rem / ~13px) for meta and next-service lines. This is workable for good vision but tight for bifocals. The Edit button and X remove buttons are small.

**25-year-old:** The section feels like a settings list, not a dashboard. It's functional but not engaging.

### Proposed Fix

#### SFD-05-A: Deduplicate badge state with Today card

**Before:** "Soon" badge appears on the church row even though the same service is prominently featured in the Today card hero row above.

**After:** Suppress Live/Soon badges in the Your Churches section when the same service is already visible in the Today card. The Your Churches section's job is *directory and upcoming*, not *real-time status* — that's the Today card's job.

Implementation: In `renderSaved()` at ~line 448, when building the status badge for each church, check whether that church+service combo already appears in `todaySvcs`. If so, skip the badge.

#### SFD-05-B: Increase typographic size for accessibility

- `.saved-church-name`: `var(--text-sm)` → `var(--text-base)` (15px → 17px)
- `.saved-church-meta`: `var(--text-xs)` → `var(--text-sm)` (13px → 15px)
- `.saved-church-next-time`: `var(--text-sm)` → `var(--text-base)`
- `.saved-church-next-label` and `.saved-church-next-day`: `var(--text-xs)` → `var(--text-sm)`
- `.saved-church-row` min-height: `64px` → `72px`

This addresses IDEA-023 for the Your Churches section specifically.

#### SFD-05-C: Enlarge Edit and Remove touch targets

- `.saved-edit-btn` already has `min-height: 44px` — confirm `min-width: 44px` as well
- `.saved-church-remove` (the X button, line 479): currently `width: 16px, height: 16px` for the SVG icon. Wrap in a tap area: `min-width: 44px; min-height: 44px; display: flex; align-items: center; justify-content: center`

This addresses IDEA-048.

#### SFD-05-D: Make the "events" badge count tappable

The blue `6 events` badge in the meta line is informational but not interactive. Consider making it a link that opens the detail panel scrolled to the Community Events section — giving it a purpose beyond just a number.

### Test Checklist

- [ ] Church names readable without squinting on iPhone SE/Mini
- [ ] Edit button tap target is 44×44pt
- [ ] Remove (X) buttons have 44×44pt tap area in edit mode
- [ ] Live/Soon badges suppressed when same service is in Today card
- [ ] Event badge count still displays correctly
- [ ] Dark mode: text sizes and colors verified
- [ ] Long church names still truncate gracefully with ellipsis

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/saved.js` — added todaySvcKeys lookup before church row loop, badge rendering now checks if service is already in Today card before showing Live/Soon, event count badge wrapped with onclick for tappability; `css/app.css` — `.saved-church-row` min-height to 72px, `.saved-church-name` to text-base, `.saved-church-meta` to text-sm, `.saved-church-next-time` to text-base, `.saved-church-next-label`/`.saved-church-next-day` to text-sm, `.saved-edit-btn` added min-width:44px, new `.saved-evt-count--tap` class
- **Approach:** Badge dedup builds a key set from `todaySvcs` (church ID + service type + time) and checks each church row's next service against it before rendering the badge. Typography bumped one size across all church row elements. Event badge opens detail panel on tap via `openDetail()`.
- **Deviations from spec:** SFD-05-D simplified — tapping the event badge opens the detail panel at the top rather than scrolling to the events section, to avoid adding a 4th parameter to `openDetail()` and keep the change minimal.
- **Known issues:** None observed

---

## [SFD-06] Saved Tab — Header & Today Card Hierarchy

**Files:** `src/saved.js`, `css/app.css`, `index.html`

### User Story

The user opens the Saved tab — their "home base." Screenshot 6 shows:

1. **"Good morning"** — large Playfair Display heading
2. **"Lenten Season"** — small accent-colored label below
3. **TODAY · Friday, Mar 13** — uppercase label inside a card
4. **8:30 AM / Daily Mass / in 13 min / St. Mary / Directions** — the hero service row
5. **Tomorrow · Saturday** — divider
6. **Tomorrow services** — two Confession rows

The issues:

**Hierarchy inversion:** The most actionable information — "Daily Mass in 13 min at St. Mary" — is buried as the *fourth* visual element. The greeting and season label consume prime viewport space with low-information content. On an iPhone SE screen, the greeting alone pushes the Today card below the fold.

**"Lenten Season" label:** During Lent, this is modestly useful context. During Ordinary Time (33 weeks/year), it would display "Ordinary Time" — adding nothing. The code at line 516-518 *already handles this correctly* (only shows named seasons), but the label itself is competing with higher-value content for vertical space.

**Disjointed feeling:** The greeting, season label, Today card, Tomorrow divider, and tomorrow card all use different visual containers, spacing, and typographic scales. The eye has to recalibrate at each level. Nothing creates a visual flow from "here's what matters right now" to "here's what's coming."

**The "Directions" link:** Currently routes to Google Maps on all devices. Should route to Apple Maps on iOS (already implemented in the detail panel at saved.js:137-140, but this same detection should be used for the Saved tab hero row as well — confirming this is actually implemented via `_isApple` check at line 137). Verify this works.

**Tomorrow card is visually identical to Today card:** Same card background, same row styling, same text weight. A quick glance doesn't distinguish "happening now" from "happening tomorrow."

### Proposed Fix

#### SFD-06-A: Compress the greeting, elevate the Today card

**Before:**
```
Good morning          ← 1.5rem Playfair, full line
Lenten Season         ← 0.8125rem label, full line
                      ← spacing
TODAY · Friday...     ← inside card
8:30 AM...           ← hero row
```

**After:**
```
Good morning · Lenten Season     ← single line, greeting + season inline
                                 ← minimal spacing (--space-2)
┌─ TODAY · Friday, Mar 13 ────────────────────┐
│                                              │
│   8:30 AM                                    │
│   Daily Mass · St. Mary                      │
│   Starting in 13 min                         │
│   [Directions button]                        │
│                                              │
└──────────────────────────────────────────────┘
```

Changes:
- Merge greeting and season onto one line: `<h2>Good morning</h2>` becomes `<h2>Good morning <span class="saved-header-season">· Lenten Season</span></h2>`
- Reduce greeting font size from `var(--text-2xl)` (1.5rem) to `var(--text-xl)` (1.25rem) — still warm, takes less space
- Reduce header bottom padding from `var(--space-4)` to `var(--space-2)`
- The season label stays `var(--text-sm)`, inline after the greeting, separated by a middle dot

This saves ~40px of vertical space, pushing the Today card higher into the viewport.

#### SFD-06-B: Hero service elevation

The hero service row (first live/soon service) should be the visual anchor of the entire Saved tab. Currently it uses `sched-row--hero` which adds `var(--space-3)` padding and `var(--text-lg)` time size — but it doesn't *feel* like the most important element on screen.

**Enhancement:**
- Hero time: `font-size: var(--text-2xl)` (1.5rem), `font-weight: var(--weight-bold)`, `color: var(--color-primary)`
- "Starting in X min" or "Happening now" becomes a larger badge: `font-size: var(--text-sm)`, `padding: 4px 12px`, `border-radius: var(--radius-full)`, `background: var(--color-accent-pale)`, `color: var(--color-accent-text)`
- Church name: `font-size: var(--text-base)`, not `var(--text-xs)`
- Directions link: increase to `font-size: var(--text-sm)`, `padding: var(--space-1) var(--space-3)`, `text-decoration: underline`

This makes the hero row feel like a hero — the thing you opened the app for.

#### SFD-06-C: Differentiate Tomorrow from Today

**Before:** Tomorrow card uses the same `saved-tomorrow-card` styling as a generic card.

**After:**
- Tomorrow card gets subdued background: `background: var(--color-surface)` with reduced shadow or no shadow
- Tomorrow service rows: `color: var(--color-text-secondary)` for times (vs `var(--color-text-primary)` for today)
- The "Tomorrow · Saturday" divider serves as the visual break — make it slightly bolder: `font-size: var(--text-sm)` (already is), but add a top border or increase top margin to create clear separation

#### SFD-06-D: Suppress Ordinary Time season label (IDEA-047)

The code already handles this correctly — `seasonLabels` at line 516-518 only maps `lent`, `advent`, `christmas`, `easter`. Ordinary Time produces no label. Verify this is working as expected in production. If so, IDEA-047 can be marked as done.

### Implementation Notes

**saved.js changes (~line 506-521, ST-22 greeting):**
```javascript
// Merge greeting + season into one line
var seasonNote = seasonLabels[curSeason]
  ? ' <span class="saved-header-season">\u00b7 ' + seasonLabels[curSeason] + '</span>'
  : '';
headerEl.innerHTML = '<h2>' + greeting + seasonNote + '</h2>';
```

**saved.js changes (~line 329-332, hero row):**
- Add explicit class `sched-row--hero-elevated` when `isHero` is true
- Increase hero rendering: time at `var(--text-2xl)`, church name at `var(--text-base)`

**css/app.css changes:**
```css
.saved-header h2 {
  font-size: var(--text-xl);  /* was --text-2xl */
  /* season label inherits but at smaller size */
}
.saved-header-season {
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-accent);
}
.sched-row--hero .sched-time {
  font-size: var(--text-2xl);  /* was --text-lg */
  font-weight: var(--weight-bold);
  color: var(--color-primary);
}
.sched-row--hero .sched-church {
  font-size: var(--text-base);  /* was --text-xs */
}
.saved-tomorrow-card {
  opacity: 0.9;
}
.saved-tomorrow-card .sched-time {
  color: var(--color-text-secondary);
}
```

### Test Checklist

- [ ] Greeting + season label render on single line, no wrapping at 320px width
- [ ] Hero time is visually dominant: 1.5rem bold, primary color
- [ ] "in X min" badge is prominent and legible
- [ ] Tomorrow section is visually distinct (subdued) from today
- [ ] Season label hidden during Ordinary Time (verify IDEA-047)
- [ ] Season label shows during Lent, Advent, Christmas, Easter
- [ ] Directions link opens Apple Maps on iOS, Google Maps on Android
- [ ] iPhone SE: Today card hero row is above the fold after greeting compression
- [ ] Dark mode: all color changes have parity
- [ ] Non-hero service rows in Today card remain at standard sizing

### Implementation Notes
- **Date:** 2026-03-13
- **Status:** done
- **Files changed:** `src/saved.js` — greeting + season label merged onto single line using inline `<span>` with middle-dot separator; `css/app.css` — `.saved-header` padding bottom reduced to space-2, `.saved-header h2` font-size reduced to text-xl, `.sched-row--hero .sched-time` elevated to text-2xl bold with primary color, `.sched-row--hero .sched-church` to text-base, `.sched-row-directions` to text-sm with padding, `.saved-tomorrow-card` shadow removed and opacity set to 0.9 with secondary time color
- **Approach:** SFD-06-A saves ~40px vertical space by merging the greeting and season onto one line. SFD-06-B makes the hero row the visual anchor with 1.5rem bold time. SFD-06-C subdues the tomorrow card by removing its shadow and reducing opacity. SFD-06-D verified: `seasonLabels` object at saved.js:516 only maps lent/advent/christmas/easter — Ordinary Time produces empty string, correctly suppressed.
- **Deviations from spec:** None
- **Known issues:** None observed

---

## Cross-Cutting Concerns

### Cascading Impacts

| Change | Impacts |
|--------|---------|
| SFD-01 tiered badges on Find tab | Map tab pin popups may need similar tier treatment if they show Live/Soon |
| SFD-02 today-first schedule reorder | Any code that assumes Sunday-first accordion rendering (tests, screenshots) needs updating |
| SFD-03 CTA restructure | The event detail card also has action buttons — should be audited for consistency |
| SFD-06 greeting compression | If Prayer Life CTAs are ever re-enabled in Saved tab (IDEA-024), the compressed greeting gives more room |

### Font Size Audit Summary (IDEA-022)

This spec addresses font sizing in the Saved tab (SFD-05-B, SFD-06-B) and Detail panel (SFD-02-C, SFD-02-D). A full app-wide font audit is still warranted per IDEA-022, but these are the highest-impact areas.

### Implementation Priority

| Item | Effort | Impact | Priority |
|------|--------|--------|----------|
| SFD-06 Saved tab header | 1 hr | High — first thing every user sees | **P0** |
| SFD-04 Coming Up today/tomorrow | 30 min | High — prevents user mistakes | **P0** |
| SFD-02 Mass schedule readability | 2 hrs | High — core functionality | **P1** |
| SFD-01 Find tab tiered cards | 2 hrs | High — addresses core usability complaint | **P1** |
| SFD-03 CTA/Contact redesign | 2 hrs | Medium — improves detail panel UX | **P2** |
| SFD-05 Your Churches polish | 1 hr | Medium — accessibility + dedup | **P2** |

### Dark Mode Checklist

Every item above must be tested in dark mode. Key risk areas:
- SFD-01: New imminent card background needs `html[data-theme="dark"]` override
- SFD-02: Today section background in schedule accordion
- SFD-03: Primary CTA button contrast in dark mode
- SFD-04: Coming Up separator and subdued tomorrow styling
- SFD-06: Hero row accent colors against dark surface

### Seasonal Accent Threading

All new accent-colored elements (badges, borders, hero treatments) should use `var(--color-accent)` and `var(--color-accent-pale)` — which shift automatically with liturgical season — rather than hardcoded hex values.
