# UX Spec: First-Launch Onboarding Walkthrough (OBW Series)

**Author:** UX & Design Project
**Date:** 2026-03-15
**Source:** Content_Audit_Full_v1.md (D-01), Content & Voice requirements
**Status:** Queued — ready for Claude Code
**Items:** 8 total (1 structural, 4 per-step, 1 standalone detection, 1 dismiss/persist, 1 desktop adaptation)
**Dependencies:** `src/install-guide.js` (existing, no changes needed). Content finalized by Content & Voice.

---

## Design Rationale

### Pattern Choice: Full-Screen Overlay (not coach marks)

**Evaluated alternatives:**
1. **Coach marks / spotlight cutouts** — Point at real UI elements behind a scrim with a hole. Rejected because:
   - Dorothy (72): Seeing partial UI through a dark overlay is disorienting. She hasn't oriented to the app yet.
   - Positioning is fragile: requires calculating coordinates of live DOM elements, breaks across screen sizes and orientations.
   - The app content loads asynchronously — coach marks would need to wait for `init()` to complete, adding complexity.

2. **Tooltip sequence** — Small popovers near UI elements. Rejected because:
   - Sarah (45) one-handing: tooltips near the tab bar require thumb-to-bottom, tooltips near search require thumb-to-top. Inconsistent reach zones.
   - Too easy to dismiss accidentally.

3. **Full-screen modal carousel** (chosen) — Modeled after the existing install-guide.js pattern. Benefits:
   - Dorothy: Large text, single focal point, obvious "Next" button. No cognitive overload.
   - Paul: Recognizes the Apple onboarding pattern immediately. Clean, expected, fast.
   - Sarah: "Skip" in top-right, or just tap Next a few times. Under 10 seconds to dismiss.
   - Implementable without coupling to DOM positions of other elements.
   - Consistent with the existing `ig-*` install-guide precedent in the codebase.

### Step Count: 3 or 4 (Adaptive)

The walkthrough is **4 steps for browser users, 3 steps for users who have already installed the PWA**.

Steps 1–3 orient the user to the app's three pillars: Find, Save, Pray.
Step 4 pushes PWA installation by funneling into the existing `install-guide.js`.

**Why adaptive?** If someone is already running in standalone mode (they found MassFinder through a shared link that was already added to their home screen, or they installed it before the onboarding feature existed), showing them "add to home screen" is pointless and patronizing. The standalone check removes step 4 entirely — the dot indicators show 3 dots, and step 3 gets the gold "Get Started" CTA.

### Install Guide Integration Strategy

The existing `install-guide.js` module is a **fully built, tested, platform-aware** walkthrough with CSS phone mockups for iOS Safari, iOS Chrome, and Android. It handles:
- Platform detection (`detectPlatform()`)
- 3 platform-specific step sequences with highlighted tap targets
- Desktop fallback (platform picker)
- Pulse-ring animations on tap targets

We do NOT rebuild any of this inside the onboarding overlay. Step 4 is a **gateway** that pitches the install and offers a "Show Me How" CTA. That CTA calls `openInstallGuide()`, which opens its own z-index 10000 overlay on top of the onboarding. When the install guide closes, the onboarding dismisses as well.

### Existing Pattern Reference

The install-guide.js module (lines 1–335 of `src/install-guide.js`, CSS lines 441–540 of `css/app.css`) uses:
- Full-screen overlay at z-index 10000
- Step label, visual area, caption, dots, nav buttons
- Crossfade-like transitions between steps

The onboarding walkthrough follows this pattern with modifications:
- **Simpler visuals**: SVG icons in colored circles instead of CSS phone mockups
- **No back button on steps 1–3**: Forward-only momentum (too few steps for back nav to matter)
- **Two-button layout on final step**: "Show Me How" (primary) + "Maybe Later" (ghost)
- **Tab bar visible**: The real tab bar shows through at the bottom for spatial preview

---

## OBW-01 · Overlay Container & Layout Structure

**Problem:** New users land on the Find tab with zero orientation. No onboarding exists.

**Fix — Create the onboarding overlay:**

**File: `index.html`** — Add before `</body>`, after the toast div and before the scripts:
```html
<!-- Onboarding Walkthrough -->
<div id="onboardOverlay" class="ob-overlay" role="dialog" aria-modal="true" aria-label="Welcome to MassFinder" style="display:none">
  <div class="ob-container">
    <button class="ob-skip" id="obSkip" aria-label="Skip introduction">Skip</button>
    <div class="ob-content" id="obContent"></div>
    <div class="ob-footer">
      <div class="ob-dots" id="obDots" role="tablist" aria-label="Walkthrough progress"></div>
      <button class="ob-btn ob-btn-primary" id="obNext">Next</button>
      <button class="ob-btn ob-btn-ghost" id="obSecondary" style="display:none">Maybe Later</button>
    </div>
  </div>
</div>
```

**DOM placement rationale:** After the toast div (z-index 10000) but rendered at z-index 9999 — below toast and update banner but above everything else. The tab bar (z-index 100) is visible behind the overlay.

**File: `css/app.css`** — Add new section after the Sacred Pause block (~line 2040):

```css
/* ── OBW: First-Launch Onboarding Walkthrough ── */
.ob-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--color-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.4s ease;
}
.ob-overlay.open { opacity: 1; }
.ob-overlay.dismissing {
  opacity: 0;
  transition: opacity 0.5s ease;
  pointer-events: none;
}
.ob-container {
  width: 100%;
  max-width: 400px;
  padding: var(--space-6) var(--space-5);
  padding-bottom: calc(var(--tab-bar-height) + var(--safe-bottom) + var(--space-6));
  text-align: center;
  position: relative;
}
.ob-skip {
  position: absolute;
  top: calc(-1 * var(--space-8));
  right: 0;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  color: var(--color-text-tertiary);
  background: none;
  border: none;
  padding: var(--space-3);
  min-height: 44px;
  min-width: 44px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.ob-skip:hover { color: var(--color-text-secondary); }

/* ── Step content area ── */
.ob-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 280px;
  justify-content: center;
  opacity: 1;
  transform: translateY(0);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.ob-content.exiting {
  opacity: 0;
  transform: translateY(-8px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.ob-content.entering {
  opacity: 0;
  transform: translateY(8px);
}
.ob-illustration {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: var(--color-sacred-pale);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: var(--space-6);
  flex-shrink: 0;
}
.ob-illustration svg {
  width: 52px;
  height: 52px;
  stroke: var(--color-sacred);
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
/* Install step uses verified green instead of sacred gold */
.ob-illustration.ob-install {
  background: var(--color-verified-bg);
}
.ob-illustration.ob-install svg {
  stroke: var(--color-verified);
}
.ob-headline {
  font-family: var(--font-prayer);
  font-size: var(--text-xl);
  font-weight: var(--weight-bold);
  color: var(--color-text-primary);
  line-height: 1.3;
  margin-bottom: var(--space-3);
  letter-spacing: 0.01em;
  max-width: 300px;
}
.ob-subtitle {
  font-family: var(--font-body);
  font-size: var(--text-base);
  color: var(--color-text-secondary);
  line-height: 1.5;
  max-width: 280px;
}

/* ── Footer: dots + buttons ── */
.ob-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  margin-top: var(--space-8);
}
.ob-dots {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
}
.ob-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--color-border);
  transition: background 0.3s ease, width 0.3s ease, border-radius 0.3s ease;
}
.ob-dot.active {
  background: var(--color-primary);
  width: 24px;
  border-radius: 4px;
}
.ob-btn {
  width: 100%;
  max-width: 320px;
  border: none;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  font-family: var(--font-body);
}
.ob-btn:active { transform: scale(0.98); }
.ob-btn-primary {
  min-height: 52px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: var(--color-text-inverse);
  font-size: var(--text-base);
  font-weight: var(--weight-semibold);
  transition: background 0.3s ease, transform 0.1s ease;
}
.ob-btn-primary.ob-btn-accent {
  background: var(--color-sacred);
}
.ob-btn-ghost {
  min-height: 44px;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--text-sm);
  font-weight: var(--weight-medium);
  transition: color 0.15s ease;
}
.ob-btn-ghost:hover { color: var(--color-text-primary); }
```

**Dark mode** — add inside the `html[data-theme="dark"]` block:

```css
/* OBW dark mode — tokens auto-resolve, this is the safety net */
html[data-theme="dark"] .ob-overlay { background: var(--color-bg); }
html[data-theme="dark"] .ob-illustration { background: var(--color-sacred-pale); }
html[data-theme="dark"] .ob-illustration svg { stroke: var(--color-sacred); }
html[data-theme="dark"] .ob-illustration.ob-install { background: var(--color-verified-bg); }
html[data-theme="dark"] .ob-illustration.ob-install svg { stroke: var(--color-verified); }
html[data-theme="dark"] .ob-dot.active { background: var(--color-primary); }
html[data-theme="dark"] .ob-btn-primary { background: var(--color-primary); }
html[data-theme="dark"] .ob-btn-primary.ob-btn-accent { background: var(--color-sacred); }
```

**Reduced motion:**
```css
@media (prefers-reduced-motion: reduce) {
  .ob-overlay { transition: none !important; }
  .ob-content { transition: none !important; }
  .ob-dot { transition: none !important; }
}
```

**Test checklist:**
- [ ] Overlay covers full viewport including notch area
- [ ] Tab bar peeks through at bottom (z-index 100 < 9999)
- [ ] Container centered vertically and horizontally
- [ ] Content area has enough height for tallest step (step 1 headline is 2 lines)
- [ ] Bottom padding clears the tab bar + safe area
- [ ] Skip button has 44×44pt minimum tap target
- [ ] Both primary and ghost buttons have ≥44pt height
- [ ] Dark mode: all tokens resolve correctly, no white flashes
- [ ] Reduced motion: no transitions fire
- [ ] Screen reader: dialog role, aria-modal, aria-label announced

---

## OBW-02 · Step 1 — "Find Mass, Confession, and Adoration near you"

**Content (from Content & Voice):**
- Headline: "Find Mass, Confession, and Adoration near you"
- Subtitle: "Search by name, filter by service type, and see what's happening today."
- Illustration: Search/magnifying glass icon (reuse the Find tab icon), sacred-pale gold circle

**Step data:**

```javascript
{
  icon: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  headline: 'Find Mass, Confession, and Adoration near you',
  subtitle: 'Search by name, filter by service type, and see what\u2019s happening today.'
}
```

**Illustration SVG specs:**
- Container: 120×120px circle, background `var(--color-sacred-pale)`
- Icon: 52×52px, stroke `var(--color-sacred)`, stroke-width 1.8, no fill
- The magnifying glass icon matches the Find tab icon exactly for recognition continuity

**Typography:**
- Headline: `var(--font-prayer)` (Georgia) at `var(--text-xl)` (1.25rem / 20px), weight 700
- Subtitle: `var(--font-body)` (Source Sans) at `var(--text-base)` (1.0625rem / 17px), weight 400

**Demographic walkthrough:**
- Dorothy: Georgia serif headline reads warm and familiar. Large 52px icon is unmistakable. "Next" button is 52px tall — easy thumb target.
- Paul: Recognizes the Apple onboarding pattern. Content loads instantly (no network dependency). Dots tell him how many steps remain.
- Sarah: Reads the headline in 2 seconds. Taps "Next" or "Skip" and moves on.

**Test checklist:**
- [ ] Headline wraps to 2 lines on 320px screens, stays 1–2 lines on 375px+
- [ ] Icon circle centered above headline
- [ ] Sacred-pale circle visible in both light and dark mode
- [ ] Georgia font renders (check @font-face fallback chain)

---

## OBW-03 · Step 2 — "Save your parishes"

**Content (from Content & Voice):**
- Headline: "Save your parishes"
- Subtitle: "Tap the heart on any church to build your personal dashboard."
- Illustration: Heart icon (reuse the Saved tab icon), sacred-pale gold circle

**Step data:**
```javascript
{
  icon: '<svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  headline: 'Save your parishes',
  subtitle: 'Tap the heart on any church to build your personal dashboard.'
}
```

**Transition mechanics (all inter-step transitions):**
1. Current content gets class `exiting` → fades out + slides up (200ms)
2. After 200ms, innerHTML swaps, content gets class `entering` (opacity 0, translateY 8px)
3. RAF → remove `entering` class → content slides in from below + fades in (300ms)
4. Active dot shifts (pill animation, 300ms)

**Test checklist:**
- [ ] Transition is smooth, no layout shift during swap
- [ ] Dot indicator updates correctly
- [ ] Heart icon SVG renders in sacred gold, stroke only (no fill)

---

## OBW-04 · Step 3 — "Pray, learn, and grow"

**Content (from Content & Voice):**
- Headline: "Pray, learn, and grow"
- Subtitle: "Guided Rosary, daily readings, the Catechism, and more — all in your pocket."
- Illustration: Cross with explore/expand arrow, sacred-pale gold circle

**Step data:**
```javascript
{
  icon: '<svg viewBox="0 0 24 24"><rect x="6.5" y="1" width="3" height="14" rx="1"/><rect x="1" y="5.5" width="14" height="3" rx="1"/><path d="M17 4h4v4M21 4l-6 6" stroke-width="1.5"/></svg>',
  headline: 'Pray, learn, and grow',
  subtitle: 'Guided Rosary, daily readings, the Catechism, and more\u2009\u2014\u2009all in your pocket.'
}
```

**CTA behavior depends on whether step 4 exists (see OBW-06):**
- **If step 4 is present** (browser, not standalone): Button says "Next", stays `--color-primary` navy. Skip visible.
- **If step 4 is skipped** (standalone/PWA): Button says "Get Started", class adds `ob-btn-accent` → gold. Skip hidden. This IS the final step.

**Test checklist:**
- [ ] When 4-step flow: button says "Next", is navy, skip visible
- [ ] When 3-step flow (standalone): button says "Get Started", is gold, skip hidden
- [ ] Cross SVG renders with both rects and path visible
- [ ] Em dash renders correctly (thin spaces + em dash)

---

## OBW-05 · Step 4 — "Add MassFinder to your home screen" (Conditional)

**This step is only shown to users in a browser context (not standalone/PWA). See OBW-06.**

**Content:**
- Headline: "Add MassFinder to your home screen"
- Subtitle: "Opens instantly, works offline, and feels like a native app. No app store needed."
- Illustration: Phone/device icon in **verified green** circle (NOT sacred gold — utility action, not sacred)

**Step data:**
```javascript
{
  icon: '<svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="3"/><line x1="12" y1="18" x2="12.01" y2="18" stroke-width="2.5"/><path d="M9 2v1.5a1 1 0 001 1h4a1 1 0 001-1V2"/></svg>',
  headline: 'Add MassFinder to your home screen',
  subtitle: 'Opens instantly, works offline, and feels like a native app. No app store needed.',
  installStep: true
}
```

**Visual treatment — Green circle:**
The illustration circle uses `--color-verified-bg` (#EDF5F0 light / #1A2E22 dark) background and `--color-verified` (#4A7C59 light / #6AAF84 dark) icon stroke. Rationale:
- Green = "good for you" / utility / verified — matches the verified badge semantic already in the app
- Gold = sacred content — reserved for spiritual features
- Color break prevents visual fatigue from 4 identical gold circles

**Two-button layout:**
When step 4 renders:
1. Primary button (`#obNext`): text → **"Show Me How"**, class adds `ob-btn-accent` (gold)
2. Ghost button (`#obSecondary`): **"Maybe Later"** becomes visible (`display: ''`)
3. Skip button: hidden (redundant with "Maybe Later")

**Button behavior:**
- **"Show Me How"** → calls `openInstallGuide()` from `install-guide.js`, then patches `closeInstallGuide` so closing the install guide also dismisses onboarding:

```javascript
function _obShowInstallGuide() {
  var _origClose = window.closeInstallGuide;
  window.closeInstallGuide = function() {
    _origClose();
    window.closeInstallGuide = _origClose; // restore original
    _dismissOb();
  };
  openInstallGuide();
}
```

- **"Maybe Later"** → dismisses onboarding normally (same as skip). Does NOT suppress the More tab install banner — they'll see it again organically.

**Demographic walkthrough:**
- Dorothy: "Add to your home screen" is language she's heard from her grandkids. The phone icon makes it concrete. "Show Me How" leads to the platform-specific mockups she needs — she'll see exactly where to tap Share in Safari.
- Paul: He probably already knows how to install a PWA. He taps "Maybe Later" in 0.5 seconds. Or he's curious and taps "Show Me How."
- Sarah: "Works offline" is the hook — she can check Mass times in the church parking lot with no signal. "No app store" removes friction.

**Test checklist:**
- [ ] Step only appears when NOT in standalone mode
- [ ] Green circle renders correctly in light and dark mode
- [ ] "Show Me How" opens existing install guide overlay
- [ ] Install guide appears ON TOP of onboarding (z-index 10000 > 9999)
- [ ] Closing install guide also dismisses onboarding and sets completion flag
- [ ] "Maybe Later" dismisses onboarding, sets flag
- [ ] Skip button hidden on this step
- [ ] Ghost button visible, vertically stacked below primary
- [ ] Ghost button has min-height 44px (tap target)
- [ ] On desktop: install guide platform picker appears correctly

---

## OBW-06 · Standalone Detection & Step Array Construction

**Problem:** Users who already have the PWA installed should not see the install step.

**Detection (reuse existing pattern from `src/more.js` line 828–829):**
```javascript
var _isStandalone = window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;
```

**Step array construction:**
```javascript
var OB_CONTENT_STEPS = [
  { /* step 1 — Find */ },
  { /* step 2 — Save */ },
  { /* step 3 — Pray */ }
];

var OB_INSTALL_STEP = {
  icon: '...',
  headline: 'Add MassFinder to your home screen',
  subtitle: '...',
  installStep: true
};

// Build active step array at show-time
var _obSteps = _isStandalone
  ? OB_CONTENT_STEPS
  : OB_CONTENT_STEPS.concat([OB_INSTALL_STEP]);
```

**Impact on rendering:**
- Dot count: `_obSteps.length` (3 or 4)
- Final step always gets gold CTA
- Step 3: if it's the last step (standalone), it gets gold "Get Started" + no skip. If step 4 follows, it keeps navy "Next" + skip visible.
- Two-button layout only appears on the install step (the `installStep: true` flag)

**Test checklist:**
- [ ] In Safari standalone (iOS): 3 steps, no install step
- [ ] In browser (iOS Safari): 4 steps, install step present
- [ ] In browser (Android Chrome): 4 steps, install step present
- [ ] In desktop browser: 4 steps (install guide shows platform picker)
- [ ] Dot count matches step count
- [ ] Step 3 CTA adapts correctly based on whether step 4 exists

---

## OBW-07 · Dismiss Behavior & Persistence

**Completion flow:**
1. User reaches the final step and taps the final CTA:
   - 3-step flow: "Get Started" on step 3
   - 4-step flow: "Show Me How" (→ install guide → dismiss when guide closes) or "Maybe Later"
2. OR user taps "Skip" on any earlier step
3. Overlay gets class `dismissing` → fades out (500ms)
4. After 500ms, `display: none`
5. `localStorage.setItem('mf-onboarding-complete', '1')`
6. Haptic feedback: `haptics.light()` on dismiss (if available)
7. Focus moves to `#searchInput`

**Gate logic in init() — File: `src/app.js`:**

At the top of `init()`, after `data.loadFav(); data.migrateFavorites();` and before the fetch:

```javascript
// Onboarding gate — show walkthrough on first launch only
if (!localStorage.getItem('mf-onboarding-complete')) {
  _showOnboarding();
}
```

**Timing:** Onboarding displays immediately (hardcoded content, no fetch). Parish data loads in parallel behind the overlay. When the user finishes the walkthrough, the Find tab is already populated. The onboarding masks the loading time.

**Existing user protection:** Check for any existing MassFinder localStorage key (`mf-favorites`, `mf-theme`, `mf-last-visit`). If any exist, skip onboarding and set the flag silently.

**Dev panel integration:** Add `onboarding` toggle to dev panel (~line 865 of app.js) that clears `mf-onboarding-complete` from localStorage.

**Edge cases:**
- Force-close during onboarding → next launch shows onboarding again (correct)
- localStorage unavailable → onboarding shows every time (acceptable fallback, wrap in try/catch)
- "Show Me How" → close install guide → `_dismissOb()` fires via patched `closeInstallGuide()`
- Existing user with any MassFinder data → never sees onboarding

**Test checklist:**
- [ ] First visit: onboarding appears immediately
- [ ] After completion: onboarding never appears again
- [ ] After skip: onboarding never appears again
- [ ] Existing user with favorites: onboarding does not appear
- [ ] Dev panel toggle works
- [ ] localStorage unavailable: no JS error
- [ ] "Show Me How" → install guide → close → both overlays dismiss, flag set
- [ ] Focus moves to search input after dismiss
- [ ] Haptic fires on dismiss (iOS Safari)

---

## OBW-08 · Desktop & Tablet Adaptation

**File: `css/app.css`** — Desktop media query:

```css
@media (min-width: 769px) {
  .ob-overlay {
    background: rgba(26, 30, 38, 0.35);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
  }
  .ob-container {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-elevated);
    max-width: 440px;
    padding: var(--space-8) var(--space-6);
    padding-bottom: var(--space-8);
  }
  .ob-skip {
    top: var(--space-2);
    right: var(--space-2);
  }
}
@media (min-width: 769px) {
  html[data-theme="dark"] .ob-overlay { background: rgba(26, 28, 34, 0.5); }
  html[data-theme="dark"] .ob-container { background: var(--color-surface); }
}
```

**Desktop behavior:** Scrim + blur background, centered card with elevation shadow, no bottom padding offset.

**Desktop + Step 4:** "Show Me How" opens the install guide which shows the platform picker ("What kind of phone do you have?"). Correct behavior — desktop users need to install on their phone.

**Test checklist:**
- [ ] Desktop: card centered, scrim + blur behind
- [ ] Desktop: card shadow renders
- [ ] Desktop dark mode: darker scrim, dark surface card
- [ ] Tablet portrait (768px): mobile layout
- [ ] Tablet landscape (1024px+): desktop layout

---

## Swipe Gesture Support

**Optional enhancement (implement with OBW-01, not a separate item):**

Horizontal swipe on `.ob-content`:
- Swipe left → advance (same as "Next")
- Swipe right → go back (steps 2+ only)
- Threshold: 50px horizontal, < 30px vertical

Pattern: same as `initPanelSwipe()` in app.js (line 497).

---

## Cascading Impacts

1. **install-guide.js**: `closeInstallGuide()` is monkey-patched during step 4 to also dismiss onboarding. Patch is restored after firing. No source changes to install-guide.js.
2. **More tab install banner** (`src/more.js` ~line 825): Remains independent. "Maybe Later" does NOT suppress this banner. Users get a second organic chance to install.
3. **sacred-pause.js**: No conflict (z-index 10000, fires on prayer tool opens only).
4. **Return card**: Returning users have `mf-last-visit` set → skip onboarding entirely.
5. **Welcome banner**: Currently a no-op (line 678). No conflict.
6. **Loading skeletons**: Render behind overlay while data loads. Onboarding masks loading time.
7. **Accessibility**: `role="dialog"`, `aria-modal="true"`, focus trapped. Focus moves to `#searchInput` on dismiss.

---

## Summary Table

| ID | Title | Priority | Estimated effort |
|----|-------|----------|-----------------|
| OBW-01 | Overlay Container & Layout Structure | P1 | 45 min |
| OBW-02 | Step 1 — Find | P1 | 15 min |
| OBW-03 | Step 2 — Save | P1 | 10 min |
| OBW-04 | Step 3 — Pray/Learn/Grow | P1 | 15 min |
| OBW-05 | Step 4 — Install (conditional) | P1 | 30 min |
| OBW-06 | Standalone Detection & Step Array | P1 | 15 min |
| OBW-07 | Dismiss Behavior & Persistence | P1 | 30 min |
| OBW-08 | Desktop & Tablet Adaptation | P2 | 20 min |

**Total estimated implementation time:** ~3 hours
