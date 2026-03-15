# UX Spec: Immersive Prayer Visual Enhancements (IPV Series)

**Created:** 2026-03-15  
**Backlog items:** IDEA-119  
**Scope:** Visual design for immersive mode across stations, novena, examination, and prayerbook litany/lectio  
**Claude Code prompt:** `CLAUDE_CODE_PROMPT_IPV.md`  
**Depends on:** ARC series (prayer-core.js + immersive flag must land first)

---

## Context: The Rosary/Chaplet Standard

The rosary and chaplet establish the visual language for an immersive prayer experience in MassFinder. Users who have prayed the rosary in the app expect every guided prayer tool to feel comparably reverent. The key visual ingredients are:

1. **Splash screen** — centered 60vh, icon, display-font title, prayer-font subtitle/quote, prominent begin CTA
2. **Sacred color system** — each tool has a signature color threaded through progress dots, accents, section labels
3. **Typography hierarchy** — `--font-display` for titles, `--font-prayer` for sacred text, `--font-body` for UI labels
4. **Progress visualization** — dots/beads with active glow, done fill, animated transitions
5. **Centered prayer screens** — `min-height:60vh; justify-content:center` for single-focus contemplation
6. **Section identity** — labeled blocks (Meditation, Prayer, Response) so the user knows where they are in the flow
7. **Completion screen** — centered, icon, quote in prayer font, gentle farewell message
8. **Swipe + crossfade** — step-to-step transitions (handled by ARC, not this spec)

This spec addresses the **visual gaps** in each module. ARC handles the infrastructure (wake lock, swipe, crossfade, dismiss protection). This spec handles what the user *sees*.

---

## Module Assessment

### Stations of the Cross — HAS SPLASH (needs retrofit to shared system)
Has `.stations-intro`: centered, icon, title, text, instruction, Begin button. No gradient, no glow. Uses hardcoded `#8B2252`.

### Chaplet — HAS SPLASH (needs retrofit to shared system)
Has `.chaplet-intro`: centered, cross icon, title, origin, quote, Begin button. No gradient, no glow.

### Examination — HAS SPLASH (most polished, needs extraction to shared system)
Has `.exam-opening` (line 2952): already the most sophisticated splash — icon with `drop-shadow` glow, button with `box-shadow` glow, dark-mode text shadow. But these visual techniques are trapped in exam-specific CSS that no other module can reuse.

### Novena — NO SPLASH
Missing entirely. Drops user straight into Day 1 prayer text.

### Prayerbook Litany — NO SPLASH
Jumps to invocation 1 with no introduction.

### Prayerbook Lectio Divina — PARTIAL
Has a step-0 intro (title, subtitle, description) but it's rendered as a navigation step, not a proper splash with gradient/glow treatment.

### Rosary — FUNCTIONAL ENTRY (leave as-is)
Select screen (mystery set picker) serves as the entry experience. It's interactive/functional, not a contemplative splash. Does not need the shared splash treatment.

---

## IPV-01 — Stations: Accent Color Consistency

**ID:** IPV-01  
**Category:** refinement  
**Priority:** P3

**Problem:**  
Stations uses hardcoded `#8B2252` throughout its CSS (~15 occurrences). This is a Lenten burgundy/rose that works well thematically but doesn't participate in the seasonal accent system. During Easter, every other element shifts to gold but stations keeps its static burgundy.

The color is correct for the Lenten devotion. The issue is that it's hardcoded hex instead of a CSS variable, making it impossible to adjust without touching 15 rules.

**Fix:**

Add a stations-specific color variable:

**File:** `css/app.css`, in the `:root` design tokens section (~line 38–80)  
**Add:**
```css
--color-stations: #8B2252;
--color-stations-pale: rgba(139, 34, 82, 0.08);
```

**Dark mode override:**
```css
html[data-theme="dark"] {
  --color-stations: #C75B8F;
  --color-stations-pale: rgba(199, 91, 143, 0.06);
}
```

Then replace all 15 hardcoded `#8B2252` occurrences in stations CSS rules with `var(--color-stations)`. Replace all `rgba(139,34,82,...)` with `var(--color-stations-pale)` or `color-mix(in srgb, var(--color-stations) N%, transparent)`.

**Why this matters for immersive mode:** When ARC lands and stations gets `immersive: true`, the tool will be on visual parity with rosary (which uses `--set-color` per mystery set). Having a proper CSS variable means the accent can be seasonally shifted later if desired — e.g., slightly warmer during Lent, more muted during Ordinary Time.

**Test checklist:**
- [ ] All stations accent elements use the variable (dots, intro icon, nav button, num label, completion cross)
- [ ] Dark mode: accent is brighter/lighter for contrast
- [ ] No remaining hardcoded `#8B2252` in stations CSS rules
- [ ] Visual appearance unchanged in light mode

---

## IPV-02 — Novena: Splash Screen

**ID:** IPV-02  
**Category:** enhancement  
**Priority:** P1

**Problem:**  
When a user selects a novena from the list (or deep-links via NPT-01), they go directly to the Day 1 prayer text. No centering moment, no context-setting, no visual entry. Compare with rosary: icon → title → mystery set → scripture → meditation. The novena just dumps prayer text. Dorothy opens it and doesn't know if she should start reading immediately or pause.

**Fix:**

Add a splash/intro screen for each novena that renders before the prayer screen. The splash shows for 2 seconds or until the user taps "Begin."

**Screen structure** (uses shared `.prayer-splash` from IPV-08):

```html
<div class="prayer-splash">
  <div class="prayer-splash-icon">
    <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5">
      <!-- candle/flame SVG -->
      <line x1="12" y1="8" x2="12" y2="30"/>
      <path d="M12 8C12 8 8 4 8 2.5C8 1.1 9.8 0 12 0C14.2 0 16 1.1 16 2.5C16 4 12 8 12 8Z" fill="currentColor" stroke="none"/>
    </svg>
  </div>
  <h2 class="prayer-splash-title">{novena.title}</h2>
  <p class="prayer-splash-subtitle">Nine days of prayer</p>
  <p class="prayer-splash-desc">{novena.description}</p>
  <button class="prayer-splash-begin" onclick="novenaBeginPrayer()">Begin Day {N}</button>
</div>
```

For novenas with a different day count (St. Andrew Christmas = 25 days), the subtitle should read "{N} days of prayer."

**No module-specific CSS needed** — the shared `.prayer-splash` rules from IPV-08 handle everything.

**Flow change in `src/novena.js`:**

Currently `_selectNovena(id)` sets `_screen = 'prayer'` directly. Change to:
1. Set `_screen = 'intro'`
2. On "Begin Day N" tap → `_screen = 'prayer'`, render with crossfade

Add `'intro'` to the screen dispatcher:
```js
if (_screen === 'intro') _renderIntro(title, body, footer);
```

**Test checklist:**
- [ ] Selecting a novena shows splash with title, description, Begin button
- [ ] "Begin Day N" button shows correct day number (Day 1 for new, Day 3 if resuming)
- [ ] Tapping Begin transitions to prayer screen with crossfade (once ARC lands)
- [ ] Deep-link from seasonal CTA (NPT-01) still shows splash first
- [ ] 48px touch target on Begin button
- [ ] Dark mode: sacred gold button, readable text

---

## IPV-03 — Novena: Section Labels on Prayer Blocks

**ID:** IPV-03  
**Category:** enhancement  
**Priority:** P2

**Problem:**  
The novena prayer screen renders up to 4 content blocks (meditation, prayer, response, closing) as identical white surface cards. There is no label distinguishing which block is which. A user halfway through doesn't know if the next card is a meditation to read silently or a response to say aloud.

Compare with stations: each block has a `.stations-meditation-label` or `.stations-prayer-label` in small caps above the text.

**Fix:**

Add small-caps labels above each novena prayer block.

**File:** `src/novena.js`, in `_renderPrayer()` (~line 272–276)

**Before (meditation block):**
```js
+ (dayData.meditation ? '<div class="novena-day-meditation"><p>' + _fmtPrayer(dayData.meditation) + '</p></div>' : '')
```
**After:**
```js
+ (dayData.meditation ? '<div class="novena-day-meditation"><div class="novena-block-label">Meditation</div><p>' + _fmtPrayer(dayData.meditation) + '</p></div>' : '')
```

Apply the same pattern to prayer ("Prayer"), response ("Response"), and closing ("Closing Prayer") blocks.

**CSS:**
```css
.novena-block-label { font-size:11px;font-weight:var(--weight-semibold);color:var(--color-text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:var(--space-2); }
```

This exactly mirrors `.stations-meditation-label` (line 2682) for visual consistency.

**Test checklist:**
- [ ] Each content block shows its label: Meditation, Prayer, Response, Closing Prayer
- [ ] Labels render in small caps, tertiary color
- [ ] Blocks without content don't render (no empty labels)
- [ ] Dark mode: labels legible

---

## IPV-04 — Novena: Replace Hardcoded Color with Sacred Token

**ID:** IPV-04  
**Category:** refinement  
**Priority:** P2

**Problem:**  
Novena uses hardcoded `#1E6B4A` (a muted green) for `.novena-day-num` and `.novena-completed-badge`. This doesn't participate in the sacred color system and doesn't match the warm gold used by every other prayer tool.

**Fix:**

Replace all `#1E6B4A` in novena CSS with `var(--color-sacred-text)`:

**File:** `css/app.css`  
- Line 2768: `.novena-day-num` color → `var(--color-sacred-text)`
- Line 2792: `.novena-completed-badge` color → `var(--color-verified)` (green is correct for "completed" state — this one stays semantic)

Actually, the completed badge at `#1E6B4A` maps to verified/success. Keep that as `var(--color-verified)` which is the semantic green. Only the day number label should shift to sacred gold.

**Test checklist:**
- [ ] "Day 3 of 9" label renders in sacred gold, not green
- [ ] Completed badge still renders in verified green (success semantic)
- [ ] Dark mode: sacred-text color is readable

---

## IPV-05 — Novena: SVG Completion Icon

**ID:** IPV-05  
**Category:** refinement  
**Priority:** P3

**Problem:**  
The novena completion screen at line 300 of `src/novena.js` uses a Unicode heart character (`\u2665`) for the icon. Every other prayer tool uses SVGs. This breaks the design system rule: SVG only, no emoji.

**Fix:**

**File:** `src/novena.js`, line ~300  
**Before:**
```js
+ '<div class="novena-complete-icon">\u2665</div>'
```
**After:**
```js
+ '<div class="novena-complete-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M12 21C12 21 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.91 3.81 12 5.09C12.09 3.81 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 21 12 21Z"/></svg></div>'
```

Or use a cross/dove SVG consistent with stations completion (`.stations-complete-cross` uses a cross). A cross would be more liturgically appropriate for prayer completion than a heart:

```js
+ '<div class="novena-complete-icon"><svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/></svg></div>'
```

**CSS** — ensure the icon uses sacred color:
```css
.novena-complete-icon { color:var(--color-sacred);margin-bottom:var(--space-3); }
.novena-complete-icon svg { width:28px;height:38px; }
```

**Test checklist:**
- [ ] Completion screen shows SVG cross, not emoji heart
- [ ] Sacred gold color on icon
- [ ] Dark mode: icon visible

---

## IPV-06 — Examination: Completion Moment

**ID:** IPV-06  
**Category:** enhancement  
**Priority:** P2

**Problem:**  
The examination is architecturally different from other prayer tools — it's a scroll-through checklist, not a step-through flow. Converting it to a bead-by-bead model would break its purpose. However, it currently ends with a final page showing Act of Contrition and Thanksgiving prayer with exit buttons, but no contemplative completion moment like the other tools have.

When the user taps "I received reconciliation" on the final page, the items clear and the user gets exit options. There's no centered moment of closure.

**Fix:**

After the user taps "I received reconciliation," show a brief completion screen (reusing the pattern from novena/stations) before returning to exit options.

**Completion screen structure:**

```html
<div class="exam-complete-screen">
  <svg class="exam-complete-icon" viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5">
    <line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/>
  </svg>
  <h3 class="exam-complete-title">Go in Peace</h3>
  <p class="exam-complete-quote">"Your sins are forgiven. Your faith has saved you; go in peace."</p>
  <p class="exam-complete-ref">— Luke 7:48, 50</p>
  <button class="exam-complete-btn" onclick="closeExamination()">Return to MassFinder</button>
</div>
```

**CSS:**
```css
.exam-complete-screen { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;text-align:center;padding:var(--space-6);animation:rosary-fadein 0.5s ease; }
.exam-complete-icon { color:var(--color-sacred);margin-bottom:var(--space-3); }
.exam-complete-icon svg { width:28px;height:38px; }
.exam-complete-title { font-family:var(--font-display);font-size:var(--text-xl);font-weight:700;color:var(--color-text-primary);margin:var(--space-4) 0 var(--space-2); }
.exam-complete-quote { font-family:var(--font-prayer);font-size:var(--text-lg);line-height:1.7;color:var(--color-text-secondary);font-style:italic;margin-bottom:var(--space-2);max-width:320px; }
.exam-complete-ref { font-size:var(--text-xs);color:var(--color-text-tertiary);font-weight:var(--weight-medium);letter-spacing:0.02em;margin-bottom:var(--space-5); }
.exam-complete-btn { padding:var(--space-3) var(--space-6);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-family:var(--font-body);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px; }
.exam-complete-btn:active { transform:scale(0.98); }
```

**Note:** This screen only shows after "I received reconciliation." Users who exit via the X button or "Return to MassFinder" before that point do not see it. The existing confession tracker and item clearing logic should still fire before this screen renders.

→ **Hand off to Catholic Review:** "Open Catholic Review: Verify the Luke 7:48, 50 quote on the examination completion screen is appropriate for the context of leaving confession. See IPV-06 in `docs/plans/UX_Spec_Immersive_Prayer_Visual.md`."

**Test checklist:**
- [ ] After "I received reconciliation" → completion screen with cross, quote, single exit button
- [ ] Items are already cleared before this screen shows
- [ ] Animation fades in (reuse rosary-fadein keyframe)
- [ ] X button still available in reader header as escape hatch
- [ ] Dark mode: all elements readable

---

## IPV-07 — Prayerbook Litany: Intro Screen

**ID:** IPV-07  
**Category:** enhancement  
**Priority:** P2

**Problem:**  
When a user opens a litany (Humility or Trust), they jump immediately to invocation 1 with no context. The rosary has a splash; the chaplet has a splash; stations has a splash. The litany has nothing — just "1 of 34" and the first petition. Dorothy doesn't know what she's supposed to do. Paul wonders if it loaded correctly.

**Fix:**

Add a litany intro screen before step 1.

**Screen structure** (uses shared `.prayer-splash` from IPV-08):

```html
<div class="prayer-splash">
  <div class="prayer-splash-icon">
    <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/>
    </svg>
  </div>
  <h2 class="prayer-splash-title">{litany.title}</h2>
  <p class="prayer-splash-subtitle">{litany.invocations.length} petitions</p>
  <p class="prayer-splash-desc">{litany.description || "A guided litany"}</p>
  <p class="prayer-splash-hint">Swipe or tap to advance. Respond aloud when prompted.</p>
  <button class="prayer-splash-begin" onclick="prayerbookLitanyBegin()">Begin</button>
</div>
```

**No module-specific CSS needed** — shared `.prayer-splash` rules handle everything.

**Flow change in `src/prayerbook.js`:**

Currently `prayerbookOpenLitany(id)` sets `_litanyStep = 0` and `_screen = 'litany'`. Change to:
1. Set `_litanyStep = -1` (intro state) and `_screen = 'litany'`
2. When `_litanyStep === -1`, render intro screen
3. On "Begin" tap → `_litanyStep = 0`, render first invocation with crossfade

**Test checklist:**
- [ ] Opening a litany shows intro screen with title, description, Begin button
- [ ] "Begin" advances to invocation 1 with crossfade
- [ ] Back from invocation 1 returns to list (not intro) — intro is entry-only
- [ ] 48px touch target on Begin
- [ ] Dark mode: sacred gold button, readable text

---

## IPV-08 — Universal Prayer Splash System

**ID:** IPV-08  
**Category:** enhancement  
**Priority:** P0 (foundation — implement before all other IPV items)

**Problem:**  
Six guided modules need splash screens. Each currently either has no splash (novena, litany) or has a bespoke one (chaplet, stations, exam, lectio) with different CSS class names, different visual treatments, and no shared visual DNA. The exam opening already has glow and shadow effects, but they're trapped in `.exam-opening-*` classes that nobody else can use.

Every splash screen should feel like the same invitation from the same app — a moment of centering before prayer begins. Currently they feel like six different apps.

**Fix:**

Define a shared `.prayer-splash` CSS system that provides the universal visual treatment. Module-specific splashes apply `.prayer-splash` as a base alongside their own class for any overrides.

**Shared CSS pattern:**

```css
/* ── Universal prayer splash ── */
.prayer-splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: var(--space-8) var(--space-5);
  min-height: 60vh;
  justify-content: center;
  max-width: 400px;
  margin: 0 auto;
  background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--color-sacred) 4%, transparent) 0%, transparent 70%);
}

.prayer-splash-icon {
  color: var(--color-sacred);
  opacity: 0.7;
  margin-bottom: var(--space-4);
  filter: drop-shadow(0 0 12px color-mix(in srgb, var(--color-sacred) 20%, transparent));
}
.prayer-splash-icon svg { width: 40px; height: 52px; }

.prayer-splash-title {
  font-family: var(--font-display);
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: var(--space-2);
  text-shadow: 0 0 40px color-mix(in srgb, var(--color-sacred) 12%, transparent);
}

.prayer-splash-subtitle {
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  color: var(--color-sacred-text);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: var(--space-5);
}

.prayer-splash-desc {
  font-family: var(--font-prayer);
  font-size: var(--text-sm);
  font-style: italic;
  color: var(--color-text-secondary);
  line-height: 1.7;
  max-width: 300px;
  margin: 0 0 var(--space-4);
}

.prayer-splash-hint {
  font-size: var(--text-xs);
  color: var(--color-text-tertiary);
  line-height: 1.6;
  max-width: 280px;
  margin-bottom: var(--space-6);
}

.prayer-splash-begin {
  padding: var(--space-3) var(--space-8);
  background: var(--color-sacred);
  color: white;
  border: none;
  border-radius: var(--radius-full);
  font-family: var(--font-body);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  cursor: pointer;
  min-height: 48px;
  -webkit-tap-highlight-color: transparent;
  box-shadow: 0 0 20px color-mix(in srgb, var(--color-sacred) 15%, transparent);
  transition: transform var(--transition-fast);
}
.prayer-splash-begin:active { transform: scale(0.97); }

/* Dark mode enhancements — glow intensifies slightly */
html[data-theme="dark"] .prayer-splash {
  background: radial-gradient(ellipse at 50% 40%, color-mix(in srgb, var(--color-sacred) 5%, transparent) 0%, transparent 70%);
}
html[data-theme="dark"] .prayer-splash-icon {
  filter: drop-shadow(0 0 16px color-mix(in srgb, var(--color-sacred) 25%, transparent));
}
html[data-theme="dark"] .prayer-splash-title {
  text-shadow: 0 0 50px color-mix(in srgb, var(--color-sacred) 15%, transparent);
}
html[data-theme="dark"] .prayer-splash-begin {
  box-shadow: 0 0 24px color-mix(in srgb, var(--color-sacred) 20%, transparent);
}
```

**Visual description for the three demographics:**

- **Dorothy:** The gentle golden glow on the title and cross icon gives the screen warmth and gravity. She knows immediately this is something sacred, not a settings menu. The "Begin" button is large and obvious.
- **Paul:** The radial gradient and drop-shadow create the kind of subtle depth he'd see in Apple's meditation features. It feels premium without being gaudy.
- **Sarah:** The single Begin button is the only actionable element. Tap it, start praying.

**HTML template** (modules fill in their content):

```html
<div class="prayer-splash">
  <div class="prayer-splash-icon">
    <svg viewBox="0 0 24 32" fill="none" stroke="currentColor" stroke-width="1.5">
      <line x1="12" y1="2" x2="12" y2="30"/><line x1="4" y1="10" x2="20" y2="10"/>
    </svg>
  </div>
  <h2 class="prayer-splash-title">{Module Title}</h2>
  <p class="prayer-splash-subtitle">{Tagline}</p>
  <p class="prayer-splash-desc">{Description in prayer font}</p>
  <p class="prayer-splash-hint">{Duration/instruction hint}</p>
  <button class="prayer-splash-begin" onclick="{beginFn}">{Begin Label}</button>
</div>
```

**Test checklist:**
- [ ] Radial gradient is barely perceptible in light mode — a warm sacred-gold haze from center
- [ ] Title has a soft golden text-shadow that doesn't look like a drop shadow — more like a glow behind the letters
- [ ] Icon has a `drop-shadow` glow, not a hard shadow
- [ ] Begin button has a subtle surrounding glow
- [ ] Dark mode: all glows intensify slightly for visibility against dark background
- [ ] At 375px viewport, nothing overflows or truncates
- [ ] At "large" text size, layout still holds

---

## IPV-09 — Examination: Upgrade Opening to Shared Splash

**ID:** IPV-09  
**Category:** refinement  
**Priority:** P1

**Problem:**  
The exam's opening screen (`.exam-opening`, line 2952 of `css/app.css`) already has the most sophisticated visual treatment — icon glow, button glow, dark-mode text shadow. But it uses bespoke class names and renders the full opening prayer text inline, making it both a splash and a functional prayer display. It should be refactored to use the shared `.prayer-splash` system while preserving the opening prayer.

**Fix:**

Restructure the exam opening HTML to use `.prayer-splash` classes:

**File:** `src/examination.js`, line ~64–68  
**Before:**
```html
<div class="exam-opening">
  <div class="exam-opening-icon">SVG</div>
  <p class="exam-opening-text">{full prayer text}</p>
  <button class="exam-opening-btn">Begin Examination</button>
  <p class="exam-opening-hint">A prayerful review...</p>
</div>
```

**After:**
```html
<div class="prayer-splash">
  <div class="prayer-splash-icon">SVG</div>
  <h2 class="prayer-splash-title">Examine Your Conscience</h2>
  <p class="prayer-splash-subtitle">Prepare for confession</p>
  <div class="prayer-splash-prayer-text">{full prayer text}</div>
  <button class="prayer-splash-begin" onclick="window._examBeginReview()">Begin Examination</button>
  <p class="prayer-splash-hint">About 10–15 minutes. Nothing is saved.</p>
</div>
```

The opening prayer text still renders on the splash — this is the centering prayer that prepares the user's heart. But now it sits within the shared visual system with gradient, glow, and consistent typography.

**New CSS for the prayer text block within a splash:**

```css
.prayer-splash-prayer-text {
  font-family: var(--font-prayer);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.8;
  max-width: 340px;
  margin-bottom: var(--space-4);
  max-height: 30vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
```

This preserves the scrollable prayer text from BT4-01 while gaining the splash visual treatment.

**Dead CSS cleanup:** Once retrofitted, the bespoke `.exam-opening-*` rules at lines 2952–2961 become dead CSS. Remove them.

**Dark mode:** Inherits from `.prayer-splash` shared dark rules.

**Test checklist:**
- [ ] Exam opening shows radial gradient background, icon glow, title glow
- [ ] Opening prayer text still scrollable (BT4-01 regression check)
- [ ] "Begin Examination" button has sacred gold glow
- [ ] Title reads "Examine Your Conscience" (per PZP-01)
- [ ] Dark mode: enhanced glows visible
- [ ] Bespoke `.exam-opening-*` CSS removed without visual regression

---

## IPV-10 — Lectio Divina: Upgrade Step-0 to Shared Splash

**ID:** IPV-10  
**Category:** refinement  
**Priority:** P2

**Problem:**  
Lectio Divina's step-0 intro (`_lectioStep === 0` in `src/prayerbook.js`) renders a title, subtitle, description, and gospel reference. It uses `.lectio-step.lectio-intro` and `.lectio-title` classes, which work but have no gradient, no glow, and no visual warmth. It feels like a settings page, not an invitation into contemplative prayer.

**Fix:**

Replace the lectio intro HTML to use `.prayer-splash`:

**Before:**
```html
<div class="lectio-step lectio-intro">
  <h2 class="lectio-title">Lectio Divina</h2>
  <p class="lectio-subtitle">Sacred Reading</p>
  <p class="lectio-desc">{description}</p>
  <p class="lectio-gospel-ref">{gospel ref}</p>
</div>
```

**After:**
```html
<div class="prayer-splash">
  <div class="prayer-splash-icon">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
    </svg>
  </div>
  <h2 class="prayer-splash-title">Lectio Divina</h2>
  <p class="prayer-splash-subtitle">Sacred Reading</p>
  <p class="prayer-splash-desc">{description}</p>
  <p class="prayer-splash-hint">{gospel ref}</p>
</div>
```

The icon is an open book SVG (fitting for sacred reading). The rest maps directly to shared splash slots.

**Test checklist:**
- [ ] Lectio intro shows gradient, icon glow, title glow
- [ ] Open book icon renders at correct size
- [ ] "Begin →" button in footer still works (footer rendering unchanged)
- [ ] Dark mode: enhanced glows
- [ ] Back from step 1 returns to list, not re-showing splash

---

## IPV-11 — Retrofit Chaplet + Stations Splash to Shared System

**ID:** IPV-11  
**Category:** refinement  
**Priority:** P2

**Problem:**  
Chaplet and stations have bespoke splash screens with different class names, different visual treatments, and no gradient or glow effects. They should inherit from `.prayer-splash` for uniformity.

**Fix:**

**A. Chaplet intro retrofit:**

**File:** `src/chaplet.js`, in `_renderIntro()` (~line 277–285)  
Replace `.chaplet-intro` wrapper with `.prayer-splash`, map children to shared classes:

- `.chaplet-intro-cross` → `.prayer-splash-icon`
- `.chaplet-intro-title` → `.prayer-splash-title`
- `.chaplet-intro-origin` → `.prayer-splash-subtitle`
- `.chaplet-intro-quote` → `.prayer-splash-desc` (the Faustina quote)
- `.chaplet-intro-ref` → kept as a child within `.prayer-splash-desc` (attribution)
- `.chaplet-begin` → `.prayer-splash-begin`

The chaplet quote and Faustina attribution are unique to this splash. These render within `.prayer-splash-desc` as a blockquote or with a small cite tag — the shared system accommodates extra content.

**B. Stations intro retrofit:**

**File:** `src/stations.js`, in `_renderIntro()` (~line 194–204)  
Replace `.stations-intro` wrapper with `.prayer-splash`, map children:

- `.stations-intro-icon` → `.prayer-splash-icon`
- `.stations-intro-title` → `.prayer-splash-title`
- `.stations-intro-text` → `.prayer-splash-desc`
- `.stations-intro-instruction` → `.prayer-splash-hint`
- Footer Begin button unchanged

**C. Dead CSS cleanup:**

After retrofit, these module-specific intro rules become dead CSS:
- Lines 1831–1838: `.chaplet-intro-*` rules (8 rules)
- Lines 1849–1852: dark mode overrides for chaplet intro (4 rules)
- Lines 2661–2665: `.stations-intro-*` rules (5 rules)

Remove them. The shared `.prayer-splash` rules replace all of them.

**Test checklist:**
- [ ] Chaplet splash shows radial gradient, cross icon with glow, title with glow, Faustina quote, Begin button with glow
- [ ] Stations splash shows gradient, cross icon with glow, title with glow, description, instruction hint
- [ ] Both splashes visually match novena and exam splashes (unified feel)
- [ ] Dark mode: enhanced glows on both
- [ ] No bespoke `.chaplet-intro-*` or `.stations-intro-*` CSS remains
- [ ] Chaplet quote text doesn't truncate on small screens

---

## Summary

| ID | Title | Priority | Module | Scope |
|----|-------|----------|--------|-------|
| **IPV-08** | **Universal prayer splash system** | **P0** | **css/app.css** | **Shared CSS foundation** |
| IPV-01 | Stations: accent color variable | P3 | stations CSS | 15 hex replacements |
| IPV-02 | Novena: splash screen | P1 | novena.js + CSS | New screen using `.prayer-splash` |
| IPV-03 | Novena: section labels | P2 | novena.js + CSS | 4 label additions |
| IPV-04 | Novena: sacred color token | P2 | novena CSS | 1 hex replacement |
| IPV-05 | Novena: SVG completion icon | P3 | novena.js + CSS | 1 emoji → SVG |
| IPV-06 | Examination: completion moment | P2 | examination.js + CSS | New completion screen |
| IPV-07 | Prayerbook litany: intro screen | P2 | prayerbook.js + CSS | New screen using `.prayer-splash` |
| **IPV-09** | **Examination: upgrade to shared splash** | **P1** | **examination.js + CSS** | **Retrofit + dead CSS removal** |
| **IPV-10** | **Lectio Divina: upgrade to shared splash** | **P2** | **prayerbook.js + CSS** | **Retrofit step-0** |
| **IPV-11** | **Chaplet + stations: retrofit to shared splash** | **P2** | **chaplet.js + stations.js + CSS** | **Retrofit + dead CSS removal** |

## Implementation order

1. **IPV-08** (shared splash CSS — foundation, must land first)
2. **IPV-04** + **IPV-05** (novena quick fixes)
3. **IPV-03** (novena section labels)
4. **IPV-02** (novena splash using shared system)
5. **IPV-09** (exam opening retrofit to shared system)
6. **IPV-07** (litany splash using shared system)
7. **IPV-10** (lectio splash upgrade)
8. **IPV-11** (chaplet + stations retrofit)
9. **IPV-06** (exam completion moment)
10. **IPV-01** (stations color variable — cleanup)

**Note on ARC dependency:** IPV-08 (the shared CSS) has zero dependency on ARC. IPV-02, IPV-07, and the retrofits in IPV-09/10/11 benefit from ARC's crossfade but work standalone. Ship the visual foundation now; the infrastructure can land before or after.
