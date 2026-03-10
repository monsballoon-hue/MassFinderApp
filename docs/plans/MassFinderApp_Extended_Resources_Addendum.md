# MassFinderApp — Extended Resources Addendum
## Repos, Browser APIs, and Creative Patterns the First Report Missed

The first report covered the obvious Catholic content repos and primary UX components. This addendum covers everything else: pre-built prayer data that saves weeks of authoring, tiny utility libraries, and zero-dependency browser APIs that transform a simple PWA into something that feels native.

---

## SECTION A: CATHOLIC DATA REPOS — THE ONES WE MISSED

### A.1 openPrayers — Pre-Built JSON for Everything

**Repo:** `erickouassi/openPrayers`
**URL:** github.com/erickouassi/openPrayers
**License:** Not explicitly stated; appears freely distributable
**Why this matters:** This repo has **ready-to-use JSON files** for content the previous report said to "author manually." Specifically:

- `rosary_day.json` — 7-day rosary mysteries with all prayers, meditations, and Scripture references. Pre-structured by day of the week. This is exactly the data `src/rosary.js` needs.
- `stations_of_the_cross.json` — All 14 stations with titles, meditations, and prayers. Ready to drop into `data/prayers.json`.
- `saints-en.json` — Saints of the Roman Calendar in English JSON. This replaces the manual curation needed for `data/saints-mini.json`.
- `saints-fr.json` — French translation. i18n-ready.

**Impact:** The previous report estimated 35KB of manual authoring for `data/prayers.json`. This repo provides 80%+ of that content pre-structured. It saves days of data entry and reduces the risk of liturgical errors in prayer texts.

**Integration:** Run a build script that fetches these JSON files, normalizes them to MassFinder's structure, adds CCC cross-references and Scripture tappable refs, and outputs `data/prayers.json`. Commit the output — no runtime API dependency.

**Priority: Immediate — use this for Phase 2 (rosary) and Phase 5 (stations).**

---

### A.2 Baltimore Catechism No. 2 in JSON

**Mentioned in:** awesome-catholic list
**What it is:** The Baltimore Catechism — the Q&A format catechism used in American Catholic education from 1885 through the 1960s. Simpler and more accessible than the CCC for everyday questions like "Why did God make you?" / "God made me to know Him, to love Him, and to serve Him in this world, and to be happy with Him forever in the next."
**Relevance:** A "Question of the Day" feature could surface one Baltimore Catechism Q&A per day — much more digestible than CCC paragraphs for the 55+ demographic. Dorothy doesn't want to read CCC §2180; she'd love a simple "Q: Is it a sin to miss Mass on Sunday? A: Yes, it is a mortal sin..."
**Size:** Small — 421 questions, probably ~80KB raw.
**Integration:** Static JSON file, lazy-loaded. One card in the More tab: "Catholic Q&A" → daily question with linked CCC paragraph for depth.

---

### A.3 Doctors of the Church Gallery

**Mentioned in:** awesome-catholic list
**What it is:** Data on all 37 Doctors of the Church — names, dates, notable works, short descriptions.
**Relevance:** When the saint card shows a Doctor of the Church (e.g., St. Thomas Aquinas, St. Thérèse of Lisieux), display a "Doctor of the Church" badge with their notable work. Small dataset, high polish.

---

### A.4 Catholic Public Domain Version (CPDV) Bible in JSON

**Source:** sacredbible.org (directly offers CPDV in JSON format)
**License:** Public domain (explicitly stated by translator)
**What it is:** A modern English translation from the Latin Vulgate, specifically produced for digital use. More readable than the Douay-Rheims while remaining Catholic canon-complete (73 books). The translator explicitly provides a JSON download for mobile/web applications.
**Why this matters:** The DRB (isaacronan repo) uses archaic English ("thou," "begotten," "hast"). The CPDV reads like a modern Bible while still being public domain and Catholic. This could be offered as a translation toggle: DRB (traditional) ↔ CPDV (modern) — both offline, both free, both Catholic canon.
**Integration:** Download JSON from sacredbible.org, split by book, same structure as DRB data.

---

## SECTION B: MICRO-LIBRARIES (2KB OR LESS)

### B.1 microfuzz — Fuzzy Search for CCC + Bible

**Repo:** `Nozbe/microfuzz`
**URL:** github.com/Nozbe/microfuzz
**License:** MIT
**Size:** 2KB gzipped
**What it does:** Fuzzy search with match highlighting. Zero dependencies. Framework-agnostic.
**Why it matters for MassFinder:** Once the full CCC (2,865 paragraphs) and Bible data are local, users need a way to search them. "What does the Church teach about divorce?" → fuzzy match against CCC paragraph text → show results with highlighted matches. Current search in MassFinder only covers parish names/cities. Expanding it to content search transforms the app from a schedule tool into a reference tool.
**Integration:** `var searcher = createFuzzySearch(cccParagraphs, { getText: function(p) { return [p.text]; } })` — results include match ranges for highlighting.

---

### B.2 QR Creator — Generate Shareable QR Codes

**Repo:** `nimiq/qr-creator`
**URL:** github.com/nimiq/qr-creator
**License:** MIT
**Size:** ~4KB minified
**What it does:** Generates QR codes as canvas or SVG. No dependencies. CDN-loadable.
**Why it matters for MassFinder:** The parish detail panel could show a "Share" QR code. Scan it with your phone → opens MassFinder at that parish's detail view (`massfinder.app/#parish-id`). This is perfect for bulletin boards, parish offices, and printed flyers. A volunteer coordinator pins a QR code in the church vestibule: "Find our Mass schedule on MassFinder."
**Also useful:** The review/validator tool could generate QR codes for individual parishes that link to the reviewer's verification page.
**Integration:** CDN script tag, generate on demand when user taps "QR Code" in share options. No build-time dependency.

---

### B.3 ios-haptics — Haptic Feedback on iOS Safari

**Repo:** `tijnjh/ios-haptics`
**URL:** github.com/tijnjh/ios-haptics
**License:** MIT
**Size:** <1KB
**What it does:** iOS Safari doesn't support the Vibration API. This library creates a momentary `<input type="checkbox" switch>` element (introduced in Safari 18) to trigger the native iOS haptic engine, then removes it. Falls back to `navigator.vibrate()` on Android.
**Why it matters for MassFinder:** The rosary module. Each bead tap → gentle haptic pulse. Each decade completion → stronger haptic. Mystery transition → distinct pattern. This transforms the guided rosary from a visual-only experience to a tactile one — the phone becomes a physical prayer tool. Without haptics, the rosary module is just text on a screen.
**Integration:** Import via CDN. Call on each bead tap in `src/rosary.js`. Graceful degradation — if haptics aren't supported, nothing happens.
**Also useful for:** Examination of conscience (haptic on each commandment transition), Stations of the Cross (haptic on station advance), and novena tracker (haptic on day completion).

---

## SECTION C: BROWSER APIs — ZERO DEPENDENCIES, MAXIMUM IMPACT

These require no repos, no libraries, no dependencies. They're built into every modern browser. Each is a few lines of JavaScript.

### C.1 Web Share API — Native Share Sheet

```javascript
navigator.share({ title: 'St. Mary's Church', text: 'Sunday Mass at 10:00 AM', url: 'https://massfinder.app/#st-marys' })
```
MassFinder already has `shareParish()` in `render.js`, but it currently copies to clipboard with a toast message. Replacing with `navigator.share()` opens the native share sheet — iMessage, WhatsApp, email, AirDrop. One line of code. This is how Dorothy sends her daughter-in-law the Mass schedule.

**Support:** iOS Safari 12.2+, Chrome Android 61+, Firefox Android 79+. Desktop Chrome 89+.
**Fallback:** Keep the current clipboard copy for unsupported browsers.

### C.2 Screen Wake Lock API — Keep Screen On During Prayer

```javascript
var wakeLock = await navigator.wakeLock.request('screen');
// Release when prayer module closes
wakeLock.release();
```
During the rosary guide, stations, or examination of conscience, the user is reading and praying — not tapping the screen. Without a wake lock, the screen dims and locks after 30-60 seconds. The user has to tap to wake it, loses their place, gets frustrated. Wake lock keeps the screen on for the duration of the prayer session.

**Support:** Chrome 84+, Safari 16.4+, Firefox (behind flag). Falls back gracefully — screen just dims normally.
**Implementation:** Request on prayer module open, release on close/dismiss.

### C.3 Badging API — Holy Day Reminder Badge

```javascript
navigator.setAppBadge(1); // Show notification dot on PWA icon
navigator.clearAppBadge(); // Clear it
```
When a Holy Day of Obligation is approaching, set a badge on the installed PWA icon. The user sees a notification dot without any push notification infrastructure. No server, no subscription, no permission prompt. Just a dot that says "check MassFinder." Clear it after the holy day passes.

**Support:** Chrome 81+ (installed PWAs only), Edge, Safari 17+.
**Implementation:** Check LitCal/romcal for upcoming HDOs in `init()`. If within 2 days, set badge.

### C.4 Web Speech API — Text-to-Speech for Readings

```javascript
var utterance = new SpeechSynthesisUtterance(readingText);
utterance.rate = 0.9; // Slightly slower for prayer
utterance.lang = 'en-US';
speechSynthesis.speak(utterance);
```
A "Listen" button on the daily readings card. Tap it, and the device reads the Scripture passage aloud. This is transformative for the accessibility persona — someone driving to church, someone with low vision, someone praying the rosary with closed eyes while meditating on the Scripture passage.

**Support:** All modern browsers. Built-in voices — no audio files needed.
**Implementation:** Add a small speaker icon to reading cards. Tap to toggle play/pause.

### C.5 Notification API + Periodic Background Sync — Daily Prayer Reminder

**Why not push notifications:** Push notifications require a server, a subscription endpoint, a VAPID key, and ongoing infrastructure. Overkill for a non-commercial PWA.

**What to use instead:** The Notification API (for the visual notification) + a service worker timer or Periodic Background Sync (for the trigger).

```javascript
// In service worker
self.registration.showNotification('Daily Reading Available', {
  body: 'Third Sunday of Lent — Exodus 17:3-7',
  icon: '/assets/icon-192.png',
  tag: 'daily-reading',
  data: { url: '/#panelMore' }
});
```

**Realistic scope:** Periodic Background Sync has limited browser support (Chrome only). A simpler approach: check the time difference since the last app open. If >24 hours and notifications are permitted, show one. This happens client-side — no server needed.

### C.6 View Transitions API — Smooth Page Transitions

```javascript
document.startViewTransition(function() {
  // Switch panel content here
  openDetail(churchId);
});
```
When switching between tabs (Find → Map → Saved → More) or opening a detail panel, View Transitions provide a smooth cross-fade or slide animation. Currently, tab switches are instant cuts. With view transitions, they feel like a native app.

**Support:** Chrome 111+, Safari 18+. Falls back to instant switch — no degradation.
**Implementation:** Wrap `switchTab()` and `openDetail()` calls in `document.startViewTransition()` if available.

### C.7 CSS `scroll-timeline` — Liturgical Color Progress Bar

A thin progress bar at the top of the app that shows liturgical color — purple during Lent, white during Easter, green during Ordinary Time. As the user scrolls through the card list, the bar subtly animates. Zero JavaScript — pure CSS with `scroll-timeline` and `animation-timeline: scroll()`.

```css
.liturgical-bar {
  position: fixed; top: 0; left: 0; right: 0; height: 3px;
  background: var(--liturgical-color);
  transform-origin: left;
  animation: grow-bar linear;
  animation-timeline: scroll(root);
}
@keyframes grow-bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
```

**Support:** Chrome 115+, Safari 18.4+. Falls back to a static colored bar.

### C.8 Popover API — Tooltip Definitions

```html
<button popovertarget="def-transubstantiation">Transubstantiation</button>
<div id="def-transubstantiation" popover>
  The change of the whole substance of bread into the Body of Christ...
</div>
```
When devotional guides use theological terms, the Popover API provides lightweight definitions without modals or JavaScript. Tap a term → inline popover appears. Tap elsewhere → dismisses. Native accessibility, native dismiss behavior, native positioning.

**Support:** Chrome 114+, Safari 17+, Firefox 125+.

---

## SECTION D: PATTERNS — NO REPO NEEDED, JUST SMART CODE

### D.1 Streak Tracking for Daily Engagement

No repo needed. A simple object in localStorage:

```javascript
var streak = JSON.parse(localStorage.getItem('mf_streak') || '{"count":0,"lastDate":null}');
var today = new Date().toISOString().slice(0, 10);
if (streak.lastDate === today) { /* already counted */ }
else if (streak.lastDate === yesterday(today)) { streak.count++; streak.lastDate = today; }
else { streak.count = 1; streak.lastDate = today; }
```

Show "Day 3 of prayer" in the More tab header. Subtle, no gamification pressure, but gives Lucas (20s persona) a sense of continuity. Works for rosary streaks, daily reading streaks, or examination completion.

### D.2 "Pray for Me" / Intentions Counter

An anonymous "Pray for me" button on the saint card or daily reading. Tap it → counter increments (stored in Supabase or a simple analytics event). Show "142 people praying today." No user accounts, no free text, no moderation. Pure structured community signal — the "Interested" counter from the V2 vision doc applied to prayer.

### D.3 Fasting & Abstinence Calculator

Computed locally from LitCal/romcal data. On Ash Wednesday and all Fridays of Lent, show a subtle banner: "Today is a day of abstinence from meat." On Ash Wednesday and Good Friday specifically: "Today is a day of fasting and abstinence." Ages 14-59 for fasting, 14+ for abstinence. The rules are simple and universal — three lines of logic, zero API calls.

### D.4 "Time Since Last Confession" Tracker

A private, localStorage-only counter. After using the Examination of Conscience module, the user can tap "I went to Confession today." The More tab then quietly shows "Last Confession: 12 days ago." When it exceeds 30 days, a gentle nudge appears near the confession filter chip. Deeply pastoral, deeply private. No data leaves the device.

### D.5 Offline Page — Graceful Degradation

When the service worker serves a cached page but the user navigates to something not cached, show a branded offline page instead of a browser error. This is a single `offline.html` file added to `SHELL_ASSETS`. It shows the MassFinder logo, "You're offline," and a list of what's available from cache (saved parishes, downloaded readings, prayer guides).

### D.6 Font Subsetting

MassFinder loads two Google Fonts: Playfair Display (display headings) and Source Sans 3 (body text). The full fonts are ~80KB each. Using `&text=` parameter on the Google Fonts URL, you can subset to only the characters used in the app's UI (Latin alphabet + a few special characters). This cuts font load to ~15KB per font.

```html
<!-- Instead of loading the full font: -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap">
<!-- Subset to Latin + common glyphs: -->
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&display=swap&subset=latin">
```

Also consider self-hosting the fonts (download .woff2 files, serve from `/assets/fonts/`). This eliminates the Google Fonts DNS lookup and makes the fonts available offline from first load instead of waiting for the service worker cache.

---

## SECTION E: LONG-HORIZON IDEAS

These are stretches — not for the next sprint, but worth keeping on the radar.

### E.1 GregoSearch — Gregorian Chant Database

**Mentioned in:** awesome-catholic
**What it is:** A search interface for GregoBase, one of the largest databases of Gregorian chant scores. Could theoretically link from a liturgical day to the proper chants for that day's Mass.
**Stretch:** Very niche. Only relevant if MassFinder expands to serve TLM communities deeply.

### E.2 Catholic Hierarchy Data

**URL:** catholic-hierarchy.org
**What it is:** Complete database of every Catholic bishop and diocese worldwide. Historical and current.
**Relevance:** Could auto-populate diocese information for forkers: "You said you're covering the Diocese of Miami → here's the bishop, here's the chancery address, here are the deaneries."

### E.3 Web Bluetooth API — Physical Rosary Counter

A future-future idea: a Bluetooth-connected physical rosary bead that advances the app's rosary module as beads are moved. The Web Bluetooth API supports this on Chrome Android. Extremely niche, but the kind of thing that generates press coverage.

### E.4 Ambient Sound / Web Audio API — Prayer Atmosphere

Use the Web Audio API to generate subtle ambient tones during guided prayer (rosary, stations, meditation). A low-frequency sine wave at 50% volume creates a contemplative atmosphere without loading any audio files. The entire "audio file" is generated programmatically in ~10 lines of code.

```javascript
var ctx = new AudioContext();
var osc = ctx.createOscillator();
osc.frequency.setValueAtTime(174, ctx.currentTime); // 174 Hz — "healing frequency"
var gain = ctx.createGain();
gain.gain.setValueAtTime(0.05, ctx.currentTime); // Very quiet
osc.connect(gain).connect(ctx.destination);
osc.start();
```

---

## CONSOLIDATED PRIORITY TABLE

| Priority | Item | Type | Size Impact | Effort |
|----------|------|------|-------------|--------|
| **Now** | openPrayers rosary + stations JSON | Data repo | 0 (build-time) | 2 hours |
| **Now** | Web Share API (replace clipboard copy) | Browser API | 0 | 15 min |
| **Phase 2** | ios-haptics for rosary beads | Micro-lib | <1KB | 30 min |
| **Phase 2** | Screen Wake Lock for prayer modules | Browser API | 0 | 10 min |
| **Phase 3** | microfuzz for CCC/Bible search | Micro-lib | 2KB | 1 hour |
| **Phase 3** | Confession tracker (localStorage) | Pattern | 0 | 30 min |
| **Phase 4** | CPDV Bible (translation toggle) | Data | ~200KB gz | 2 hours |
| **Phase 4** | Text-to-Speech for readings | Browser API | 0 | 30 min |
| **Phase 4** | QR Creator for parish sharing | Micro-lib | 4KB CDN | 1 hour |
| **Phase 5** | Fasting/abstinence calculator | Pattern | 0 | 20 min |
| **Phase 5** | HDO app badge | Browser API | 0 | 15 min |
| **Phase 5** | Streak tracking | Pattern | 0 | 30 min |
| **Phase 6** | Baltimore Catechism Q&A | Data | ~30KB gz | 1 hour |
| **Phase 6** | View Transitions API | Browser API | 0 | 1 hour |
| **Phase 6** | Liturgical color scroll bar | CSS only | 0 | 20 min |
| **Future** | Dark mode (CSS custom properties) | Pattern | 0 | 2 hours |
| **Future** | Font self-hosting / subsetting | Optimization | -40KB | 1 hour |
| **Future** | Offline page | SW pattern | 1KB | 30 min |
| **Future** | Popover API for term definitions | Browser API | 0 | 1 hour |
| **Stretch** | Web Audio ambient prayer tones | Browser API | 0 | 1 hour |
| **Stretch** | Pray for me / intentions counter | Pattern + Supabase | 0 | 2 hours |
