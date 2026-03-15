# Sacristy — Brand Strategy & Growth Roadmap

**Date:** 2026-03-15
**Status:** Active strategy document
**Predecessor:** docs/research/branding-research.md (naming research)

---

## Brand Identity

### The Name
**Sacristy** — the room in a church where sacred vessels, vestments, and everything needed for the liturgy are prepared and stored.

### The Promise
*Everything you need for the liturgical life, gathered in one place.*

### The Position
Sacristy occupies a lane that no other Catholic app owns:

| App | Lane | Model |
|-----|------|-------|
| **Hallow** | Meditation & audio prayer experience | Subscription ($70/yr), VC-funded, celebrity content |
| **Laudate** | Free utility reference (Swiss Army knife) | Ad-supported, kitchen-sink UI, no curation |
| **Catholic Mass Times** | Global Mass directory | Crowd-sourced, single-purpose |
| **Magnificat** | Daily Mass companion (digital missal) | Subscription, publisher-backed |
| **Sacristy** | **Local parish companion + liturgical living + formation** | Free, open-source, privacy-first, curated |

Sacristy is the only app that:
1. **Connects you to YOUR parishes** — not 130K churches you'll never visit, but the 93 in your region, verified, with real community events
2. **Lives the liturgical year with you** — seasonal content that changes daily, not a static reference
3. **Goes deep without going wide** — full CCC, two Bible translations, Baltimore Catechism, not as a feature list but as integrated formation woven into daily use
4. **Respects your attention** — no accounts, no ads, no tracking, no subscription, no gamification. Just the faith.

### Tagline Candidates (pick one)

1. **"Prepare for the Sacred"** — action-oriented, captures the sacristy metaphor perfectly
2. **"Catholic Life, Gathered"** — warmer, emphasizes the comprehensiveness
3. **"Your Parish. Your Practice. Your Faith."** — three pillars, clear scope
4. **"Where faith is prepared"** — poetic, slightly mysterious

Recommendation: **"Prepare for the Sacred"** — it's active, it's dignified, it works as both invitation and description. It echoes what people actually do in a sacristy.

### Voice & Tone
- **Not preachy.** The app serves, it doesn't lecture.
- **Not startup-y.** No "supercharge your faith journey" or "level up your prayer life."
- **Quiet confidence.** Like a well-run sacristy: everything in its place, ready when you need it.
- **Reverent without being stiff.** Georgia serif for sacred text, clean UI for everything else.
- **Regional pride.** "Western New England" stays — it's a feature, not a limitation. The app knows your parishes by name.

### Visual Identity

**What stays:**
- Cross-and-gold icon mark (the existing header SVG is strong)
- Seasonal accent threading (purple/gold/green/rose/red/white)
- Apple HIG adherence, mobile-first
- Dark mode as first-class citizen

**What evolves:**
- Header wordmark: "Sacristy" in Playfair Display, "Western New England" subtitle
- Consider a subtle sacristy-door or key icon element alongside the cross
- App icon: the gold cross on warm cream works; consider a thin arch or doorway framing it
- Splash/loading: "Sacristy" wordmark, tagline, minimal

---

## Differentiation: Why Someone Chooses Sacristy

### vs. Hallow
"I don't want to pay $70/year for celebrity audio meditations. I want to find Confession near me, pray the Rosary, and read the Catechism — all in one free app that doesn't track me."

### vs. Laudate
"Laudate has everything but it looks like it was built in 2013 and it's a mess to navigate. Sacristy is beautiful and actually curates what I need today."

### vs. Catholic Mass Times
"Mass Times finds me a church. Sacristy helps me live my faith at that church — it shows me what's happening this week, prepares me for confession, walks me through the liturgical season."

### vs. Magnificat
"Magnificat is for daily Mass readings. Sacristy gives me that plus prayer tools, formation content, parish discovery, and it's free."

### The elevator pitch
"Sacristy is a free Catholic app for Western New England that helps you find Mass, prepare for Confession, pray the Rosary, study the Catechism, and live the liturgical year — all from your phone, with no ads, no accounts, and no subscriptions. Everything you need for the liturgical life, gathered in one place."

---

## Growth Strategy (Mission-Aligned, Solo-Dev-Realistic)

### Principle: The Lord brings people in. The app earns their trust.

Hallow spent $50M+ on celebrity partnerships and performance marketing. That's not your path — and it doesn't need to be. Hallow's own founders say "the majority of our growth is from just folks talking about the app and sharing it with folks." Word of mouth is the Catholic growth engine. The question is: what makes someone say "check out this app"?

**Answer: the moment of surprise.** When someone opens the Rosary and it's *beautiful*. When the Holy Week guide appears right on time. When the Confession guide turns up exactly when they need it. When they show their mom and she can read the text without her glasses.

### Phase 1: Foundation (Now → Easter 2026, April 5)

**Goal:** Rebrand ships. Domain is live. App is discoverable as "Sacristy."

| Task | Effort | Priority |
|------|--------|----------|
| Purchase sacristy.app domain | 30 min | Immediate |
| Update manifest, meta, OG tags, header wordmark | 2 hrs | Immediate |
| Configure Vercel custom domain | 30 min | Immediate |
| "Formerly MassFinder" transition note (3-6 months) | 30 min | Immediate |
| GitHub repo description update | 5 min | Immediate |
| Basic landing page at sacristy.app root (for non-PWA visitors) | 2-3 hrs | Week 1 |
| App Store-style screenshots for sharing (3-5 screens) | 2 hrs | Week 2 |

**Total Phase 1:** ~8-10 hours across 2 weeks of evening sessions.

### Phase 2: Seed (Easter → Pentecost 2026, May 24)

**Goal:** First users outside your personal network. Word of mouth begins.

**Actions:**
- **Parish bulletin insert.** One paragraph + QR code. Start with 2-3 parishes you attend or know the pastor. "Free app for finding Mass, Confession, and Adoration across Western New England — plus prayer tools, daily readings, and the full Catechism." Physical bulletin inserts reach your #1 demographic (50+) where they already are.
- **Diocese of Springfield outreach.** Email the communications office. A free, open-source, privacy-first app serving their exact territory is an easy yes. Ask for a mention in the diocesan newsletter or website. They're not being asked to endorse or fund — just to inform.
- **r/Catholicism, Catholic Twitter/X.** One authentic post: "I built a free Catholic PWA for Western New England. No ads, no tracking, no subscription. It has [list]. I'd love feedback." The open-source angle resonates with younger Catholic tech community.
- **Catholic tech blogs.** Catholic Apptitude (catholicapptitude.org) reviews Catholic apps — submit Sacristy for review. They covered Hallow early.

**Effort:** 3-5 hours total (writing + outreach emails). Zero dollars.

### Phase 3: Grow (Pentecost → Advent 2026)

**Goal:** Sacristy is known in the Springfield diocese. Regular users in double digits → triple digits.

**Actions:**
- **RCIA season tie-in (Sept-Nov).** RCIA directors need resources for candidates. Sacristy's Faith Guides + Confession guide + CCC + Bible is exactly what a catechumen needs. Email 5-10 RCIA directors directly: "Free tool for your candidates."
- **Advent content as growth moment.** The O Antiphons, Advent Wreath (IDEA-058), seasonal novena surfacing — these are shareable. When someone screenshots the O Antiphon card and texts it to a friend, that's organic growth.
- **QR codes at churches.** Print small cards (business card size) with QR code → sacristy.app. Leave a stack in the vestibule. Cost: ~$15 for 500 cards at a print shop.
- **Feedback loop.** Add a subtle "Share Sacristy" button (native Web Share API) that generates a clean share message. Make it effortless for the user who *wants* to tell someone.

### Phase 4: Regional Expansion (2027+, only if warranted)

**Only after Springfield diocese is well-served.** The model could expand to:
- Diocese of Worcester
- Archdiocese of Hartford
- Diocese of Burlington (Vermont)
- Diocese of Providence

Each expansion requires data collection (parish_data.json for that diocese) which is the real bottleneck — not code. The app architecture already supports it. But this is "Lord willing" territory, not a roadmap commitment.

---

## What Sacristy is NOT

Clarity about what you're *not* building is as important as what you are:

- **Not a social network.** No profiles, no feeds, no "pray with friends" pressure.
- **Not a content platform.** No daily audio from celebrities, no subscription tiers.
- **Not a global directory.** 93 parishes, verified, curated. Quality over quantity.
- **Not trying to replace the parish.** Sacristy prepares you to *go* to the parish. It's the sacristy, not the sanctuary.
- **Not VC-funded.** No growth-at-all-costs pressure. The app serves the mission on the mission's timeline.

---

## Trademark Notes

"Sacristy" used for a software application falls into the "arbitrary" trademark category (like "Apple" for computers) — a common English word used in an unrelated context. This is the strongest category of trademark protection. No existing trademarks found for "Sacristy" in software/app categories. Formal trademark registration (~$250-350 via USPTO TEAS Plus) is not urgent but worth considering once the brand has established use. Common-law trademark rights begin automatically with use.

---

## Content Pillars (for any future marketing/communications)

Everything Sacristy communicates should map to one of these:

1. **Find** — "Find Mass, Confession, Adoration, and events near you"
2. **Prepare** — "Prepare for the sacraments with guided tools"
3. **Pray** — "Pray the Rosary, Stations, Novenas, and daily devotions"
4. **Study** — "Go deeper with the Catechism, Scripture, and Faith Guides"
5. **Live** — "Live the liturgical year with daily seasonal content"

These five verbs map cleanly to the app's actual tabs and features. They also make great section headers for a landing page, bulletin insert, or app store listing.

---

## Immediate Next Steps (ordered)

1. **Secure sacristy.app** — Cloudflare Registrar recommended (at-cost pricing, ~$15/yr, built-in HTTPS which .app requires, easy DNS management, pairs well with Vercel)
2. **Also grab sacristy.org** if available (~$10/yr) — defensive registration
3. **Update BACKLOG items to reflect confirmed decision**
4. **Begin IDEA-083** — string reference updates (manifest, index.html, SW)
5. **Draft bulletin insert copy** — even before the domain is live, have the words ready
6. **Create a simple landing page** — for desktop/non-PWA visitors who hit sacristy.app

---

## The Long View

Sacristy doesn't need to be Hallow. Hallow raised $100M+ and has 80 employees to serve a billion Catholics worldwide with premium audio content. Sacristy serves 93 parishes in Western New England with deep, curated, free, private, beautiful tools for the liturgical life.

That's not a limitation. That's a *charism.*

A sacristy doesn't try to be the whole church. It just makes sure everything is ready when Mass begins. If the app does that well — if Dorothy (78) can find Confession and read the prayers, if Kevin (42) can come back after 15 years and know what to expect, if Maria (25) can pray the Rosary on her commute and text her friend "check out this app" — then the Lord will bring the people.

Build it faithfully. The rest follows.
