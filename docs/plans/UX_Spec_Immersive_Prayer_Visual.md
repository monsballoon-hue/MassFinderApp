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

### Stations of the Cross — CLOSE (minor polish)
Already has: splash screen, progress dots, display-font titles, prayer-font text, meditation/prayer surface cards, completion screen, swipe, dark mode. Only needs minor accent refinements.

### Novena — SIGNIFICANT GAPS
Missing: splash screen, section labels on prayer blocks, uses hardcoded green (#1E6B4A), completion screen uses emoji instead of SVG, no swipe between days. Has good prayer text formatting but blocks are visually anonymous.

### Examination — ARCHITECTURALLY DIFFERENT
The examination is a scroll-through checklist, not a step-through prayer. Forcing it into a rosary-like flow would break its purpose. It needs a better completion moment, not a different navigation model. Section accordion + checkboxes are correct for this tool.

### Prayerbook Litany/Lectio — MODERATE GAPS
Litany: no intro screen, jumps straight to invocation 1. Progress bar is functional but plain. Lectio: already quite polished (dots, steps, Latin names). Both use borrowed rosary nav buttons which work fine.

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

**Screen structure:**

```html
<div class="novena-intro">
  <svg class="novena-intro-icon" viewBox="0 0 24 24" ...>
    <!-- flame/candle SVG — novena = nine days of prayer, candle is the traditional symbol -->
  </svg>
  <h3 class="novena-intro-title">{novena.title}</h3>
  <p class="novena-intro-subtitle">Nine days of prayer</p>
  <p class="novena-intro-desc">{novena.description}</p>
  <button class="novena-begin" onclick="novenaBeginPrayer()">Begin Day {N}</button>
</div>
```

For novenas with a different day count (St. Andrew Christmas = 25 days), the subtitle should read "25 days of prayer."

**CSS:**

```css
.novena-intro { display:flex;flex-direction:column;align-items:center;text-align:center;padding:var(--space-8) var(--space-4);min-height:60vh;justify-content:center; }
.novena-intro-icon { color:var(--color-sacred);opacity:0.6;margin-bottom:var(--space-4);width:36px;height:36px; }
.novena-intro-title { font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--color-heading);margin-bottom:var(--space-2); }
.novena-intro-subtitle { font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-sacred-text);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-5); }
.novena-intro-desc { font-family:var(--font-prayer);font-size:var(--text-sm);font-style:italic;color:var(--color-text-secondary);line-height:1.7;max-width:300px;margin:0 0 var(--space-6); }
.novena-begin { padding:var(--space-3) var(--space-8);background:var(--color-sacred);color:white;border:none;border-radius:var(--radius-full);font-family:var(--font-body);font-size:var(--text-base);font-weight:var(--weight-semibold);cursor:pointer;min-height:48px;-webkit-tap-highlight-color:transparent; }
.novena-begin:active { transform:scale(0.97); }
html[data-theme="dark"] .novena-begin { background:var(--color-sacred); }
```

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

**Screen structure:**

```html
<div class="litany-intro">
  <svg class="litany-intro-icon" viewBox="0 0 24 24" ...>
    <!-- small cross or prayer hands SVG -->
  </svg>
  <h3 class="litany-intro-title">{litany.title}</h3>
  <p class="litany-intro-desc">{litany.description || "A guided litany of " + litany.invocations.length + " petitions."}</p>
  <p class="litany-intro-instruction">Swipe or tap to advance through each petition. Respond aloud when prompted.</p>
  <button class="litany-begin" onclick="prayerbookLitanyBegin()">Begin</button>
</div>
```

**CSS:**
```css
.litany-intro { display:flex;flex-direction:column;align-items:center;text-align:center;padding:var(--space-8) var(--space-4);min-height:60vh;justify-content:center; }
.litany-intro-icon { color:var(--color-sacred);opacity:0.6;margin-bottom:var(--space-4);width:32px;height:32px; }
.litany-intro-title { font-family:var(--font-display);font-size:var(--text-2xl);font-weight:700;color:var(--color-heading);margin-bottom:var(--space-2); }
.litany-intro-desc { font-family:var(--font-prayer);font-size:var(--text-sm);font-style:italic;color:var(--color-text-secondary);line-height:1.7;max-width:300px;margin-bottom:var(--space-4); }
.litany-intro-instruction { font-size:var(--text-xs);color:var(--color-text-tertiary);line-height:1.6;max-width:280px;margin-bottom:var(--space-6); }
.litany-begin { padding:var(--space-3) var(--space-8);background:var(--color-sacred);color:white;border:none;border-radius:var(--radius-full);font-family:var(--font-body);font-size:var(--text-base);font-weight:var(--weight-semibold);cursor:pointer;min-height:48px;-webkit-tap-highlight-color:transparent; }
.litany-begin:active { transform:scale(0.97); }
```

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

## Summary

| ID | Title | Priority | Module | Scope |
|----|-------|----------|--------|-------|
| IPV-01 | Stations: accent color variable | P3 | stations CSS | 15 hex replacements |
| IPV-02 | Novena: splash screen | P1 | novena.js + CSS | New screen + flow change |
| IPV-03 | Novena: section labels | P2 | novena.js + CSS | 4 label additions |
| IPV-04 | Novena: sacred color token | P2 | novena CSS | 1 hex replacement |
| IPV-05 | Novena: SVG completion icon | P3 | novena.js + CSS | 1 emoji → SVG |
| IPV-06 | Examination: completion moment | P2 | examination.js + CSS | New completion screen |
| IPV-07 | Prayerbook litany: intro screen | P2 | prayerbook.js + CSS | New screen + flow change |

## Implementation order

1. **IPV-04** + **IPV-05** (novena quick fixes — can land immediately)
2. **IPV-03** (novena section labels — small, high impact)
3. **IPV-02** (novena splash — requires flow change, benefits from ARC crossfade)
4. **IPV-07** (litany intro — similar pattern to IPV-02)
5. **IPV-06** (examination completion — touches exam flow)
6. **IPV-01** (stations color variable — lowest priority, cleanup)

**Note on ARC dependency:** IPV-02 and IPV-07 add new screens with "Begin" buttons. If ARC has landed, the crossfade transition will be automatic via `prayerCore.crossfade()`. If ARC hasn't landed yet, these items can still be implemented with the module's existing `_transitionTo()` function — the visual improvement is the splash screen itself, not the transition.
