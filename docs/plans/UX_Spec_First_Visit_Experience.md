# UX Spec — First Visit Experience (FVX Series)

**Created:** 2026-03-15  
**Covers:** IDEA-123, IDEA-124, IDEA-125  
**Items:** 3  
**Status:** Queued  

---

## FVX-01 — Onboarding Overlay: Delay Trigger and Blur Backdrop

**IDEA ref:** IDEA-123  
**Category:** enhancement  
**Files:** `src/app.js` (lines 893–903, 168–217), `css/app.css` (lines 2038–2045)  

### Problem

The onboarding overlay fires at `src/app.js:902` during init — **before** parish data loads and `renderCards()` runs (line 959). The overlay uses `position:fixed;inset:0;z-index:9999;background:var(--color-bg)` (`css/app.css:2038`), which paints a solid background over the entire viewport. A first-time user lands on the site and immediately sees a walkthrough for an app they haven't confirmed they're on yet.

**Dorothy (72):** Opens a link her friend texted her. Sees an unfamiliar overlay. "Is this the right thing? Did I get a virus?" She might close the tab.  
**Paul (25):** No content visible = feels like a loading screen or broken state. He's already swiping to close.  
**Sarah (45):** Juggling kids, opened this in a rush. Needs to see "church finder" in the background to know she's in the right place before engaging with a walkthrough.

### Fix

**Phase 1 — Move trigger to post-render:**

The `_showOnboarding()` call must move from its current position (line 902, before data fetch) to **after** the initial `renderCards()` call (after line 959). This ensures the Find tab content (search bar, chips, church cards) is painted behind the overlay.

```
File: src/app.js
```

**Before (line 893–903):**
```js
// OBW: Show onboarding for genuinely new users only
var _isNewUser = !localStorage.getItem('mf-onboarding-complete');
if (_isNewUser) {
  var _hasExistingData = localStorage.getItem('mf-fav') ||
    localStorage.getItem('mf-theme') ||
    state._lastVisit;
  if (_hasExistingData) {
    try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
  } else {
    _showOnboarding();
  }
}
```

**After:** Move the entire block to after line 959 (`render.renderCards();`). Wrap the `_showOnboarding()` call in a `setTimeout`:

```js
// OBW: Show onboarding for genuinely new users only — AFTER cards render
var _isNewUser = !localStorage.getItem('mf-onboarding-complete');
if (_isNewUser) {
  var _hasExistingData = localStorage.getItem('mf-fav') ||
    localStorage.getItem('mf-theme') ||
    state._lastVisit;
  if (_hasExistingData) {
    try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
  } else {
    setTimeout(function() { _showOnboarding(); }, 800);
  }
}
```

The 800ms delay ensures the Find tab is visually stable before the overlay appears.

**Phase 2 — Blur backdrop instead of solid background:**

```
File: css/app.css (line 2038)
```

**Before:**
```css
.ob-overlay {
  position:fixed;inset:0;z-index:9999;
  background:var(--color-bg);
  display:flex;align-items:center;justify-content:center;
  opacity:0;
  transition:opacity 0.4s ease, background 0.8s ease;
}
```

**After:**
```css
.ob-overlay {
  position:fixed;inset:0;z-index:9999;
  background:color-mix(in srgb, var(--color-bg) 85%, transparent);
  -webkit-backdrop-filter:blur(0px);
  backdrop-filter:blur(0px);
  display:flex;align-items:center;justify-content:center;
  opacity:0;
  transition:opacity 0.5s ease, backdrop-filter 0.6s ease, -webkit-backdrop-filter 0.6s ease;
}
.ob-overlay.open {
  opacity:1;
  -webkit-backdrop-filter:blur(12px);
  backdrop-filter:blur(12px);
}
```

The per-step gradient backgrounds (`css/app.css:2042–2045`) continue to work — they layer on top of the blur. The `color-mix` with 85% opacity ensures the content behind is visible but defocused, communicating "the app is here, just answer this first."

**Phase 3 — Dismiss transition:**

```
File: css/app.css (line 2040)
```

**Before:**
```css
.ob-overlay.dismissing {
  opacity:0;transition:opacity 0.5s ease;pointer-events:none;
}
```

**After:**
```css
.ob-overlay.dismissing {
  opacity:0;
  -webkit-backdrop-filter:blur(0px);
  backdrop-filter:blur(0px);
  transition:opacity 0.5s ease, backdrop-filter 0.4s ease, -webkit-backdrop-filter 0.4s ease;
  pointer-events:none;
}
```

On dismiss, the blur fades out in sync with the opacity fade, revealing the already-loaded Find tab underneath.

### Dark mode notes

The `color-mix(in srgb, var(--color-bg) 85%, transparent)` adapts automatically — `--color-bg` is dark in dark mode. The blur effect is equally effective on both themes. Per-step gradients already have dark mode rules (line 2042–2045, using `--color-sacred`, `--color-fav`, etc. which are theme-aware). No additional dark mode CSS needed.

### Fallback

`backdrop-filter` is supported in Safari 9+, Chrome 76+, Firefox 103+. For very old browsers, the `color-mix` background provides a semi-transparent scrim as graceful degradation — the overlay still works, just without blur. No `@supports` needed.

### Test checklist

- [ ] First visit: Find tab renders (search bar, chips, at least 1 card visible), then ~800ms later the blur + overlay fades in
- [ ] Overlay content (illustration, headline, subtitle) renders on top of blur
- [ ] User can see blurred church cards behind the overlay
- [ ] Per-step gradient shifts still work (data-ob-step 0–3)
- [ ] "Skip" dismisses with blur fade-out, revealing Find tab immediately interactive
- [ ] "Get Started" / "Next" → same dismiss behavior on final step
- [ ] Dark mode: blur renders cleanly, no white flash
- [ ] Swipe navigation between onboarding steps unaffected
- [ ] Install step (non-standalone) works correctly with blur
- [ ] Dev tools: toggle onboarding flag → re-triggers correctly with delay + blur

---

## FVX-02 — Tip Card State-Aware Rendering Rules

**IDEA ref:** IDEA-124  
**Category:** bug  
**Files:** `src/render.js` (line 299), `src/data.js` (line 50–56), `src/app.js` (line 144–146, 324–338)  
**Dependency:** Engineering review of state key design (see handoff below)  

### Problem

The "tap ♡ to favorite" tip card at `src/render.js:299` renders based on a single condition:

```js
if (!localStorage.getItem('mf-welcome-dismissed') && cards.length >= 2) {
```

This is the only gate. It doesn't know:
- Whether onboarding just completed (which already teaches the heart mechanic on step 2)
- Whether the user ever had favorites before (they know the mechanic)
- Whether this is the user's first session or a return visit
- Whether onboarding was skipped vs. completed

**Dorothy:** Completed onboarding, tapped "Get Started," and now sees the same heart instruction repeated inline — redundant, adds noise.  
**Paul:** Had 5 favorites, removed them all while traveling, now sees the beginner tip again — feels like the app forgot him.  
**Sarah:** Skipped onboarding — this tip is her *only* introduction to favoriting. It needs to show. But it currently shows even when it shouldn't (after completing onboarding this session).

### Fix

Replace the single `mf-welcome-dismissed` check with a state-aware decision tree. The tip card renders when ALL of these are true:

| Condition | Key / source | Logic |
|-----------|-------------|-------|
| User has never had favorites | `localStorage 'mf-had-fav'` | If key exists → suppress |
| Not just completed onboarding this session | `sessionStorage 'mf-ob-just-done'` | If key exists → suppress |
| User has seen the app before OR skipped onboarding | See below | Required for render |

**Rule matrix:**

| Scenario | Tip renders? |
|----------|-------------|
| Onboarding just completed this session | No — `mf-ob-just-done` in sessionStorage |
| Previously had favorites (even if now empty) | No — `mf-had-fav` exists |
| Session 2+, completed onboarding previously, no favorites ever | **Yes** |
| Returned to Find tab after exploring, completed onboarding, no favorites ever | **Yes** |
| Skipped onboarding, no favorites ever | **Yes** |
| Brand new user, onboarding showing | No — onboarding overlay is active |

**New state keys:**

1. **`mf-had-fav`** (localStorage, never cleared on unfavorite)  
   Set to `'1'` in `toggleFav()` when adding a favorite (not on remove).

   ```
   File: src/data.js (line 50–56)
   ```

   **Before:**
   ```js
   function toggleFav(id, ev) {
     if (ev) { ev.stopPropagation(); ev.preventDefault(); }
     if (isFav(id)) state.favorites = state.favorites.filter(function(f) { return f !== id; });
     else state.favorites.push(id);
     saveFav();
   ```

   **After:**
   ```js
   function toggleFav(id, ev) {
     if (ev) { ev.stopPropagation(); ev.preventDefault(); }
     if (isFav(id)) state.favorites = state.favorites.filter(function(f) { return f !== id; });
     else {
       state.favorites.push(id);
       try { localStorage.setItem('mf-had-fav', '1'); } catch (e) {}
     }
     saveFav();
   ```

2. **`mf-ob-just-done`** (sessionStorage, auto-clears on tab close)  
   Set in `_dismissOb()` when onboarding completes (not when skipped).

   ```
   File: src/app.js (line 144–146)
   ```

   **Before:**
   ```js
   function _dismissOb() {
     var overlay = document.getElementById('onboardOverlay');
     if (!overlay) return;
     try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
   ```

   **After:**
   ```js
   function _dismissOb() {
     var overlay = document.getElementById('onboardOverlay');
     if (!overlay) return;
     try { localStorage.setItem('mf-onboarding-complete', '1'); } catch (e) {}
     try { sessionStorage.setItem('mf-ob-just-done', '1'); } catch (e) {}
   ```

   Note: `_dismissOb` is called both from "Get Started" and "Skip". The `mf-ob-just-done` flag should be set in BOTH cases — if the user just went through onboarding (completed or skipped), the tip is redundant for this session.

3. **Updated tip card condition:**

   ```
   File: src/render.js (line 298–305)
   ```

   **Before:**
   ```js
   // FT-05: First-use tip card — after first card for new visitors
   if (!localStorage.getItem('mf-welcome-dismissed') && cards.length >= 2) {
   ```

   **After:**
   ```js
   // FVX-02: State-aware tip card — shows only when the user needs the hint
   var _tipShouldShow = cards.length >= 2
     && !localStorage.getItem('mf-had-fav')
     && !sessionStorage.getItem('mf-ob-just-done')
     && localStorage.getItem('mf-onboarding-complete');
   if (_tipShouldShow) {
   ```

   This means:
   - `mf-had-fav` exists → tip suppressed forever (they know the mechanic)
   - `mf-ob-just-done` exists → tip suppressed this session (onboarding just taught this)
   - `mf-onboarding-complete` missing → tip suppressed (onboarding is active or hasn't triggered)
   - All conditions pass → tip shows (user completed/skipped onboarding in a prior session, never favorited)

4. **Remove the old dismiss button and `mf-welcome-dismissed` key:**

   The tip card currently has an inline `onclick` that sets `mf-welcome-dismissed`. Under the new logic, the tip auto-suppresses once the user favorites anything (via `mf-had-fav`). The dismiss × button should still work but should set `mf-had-fav` instead:

   ```
   File: src/render.js (line 300–302)
   ```

   **Before:**
   ```js
   + '<button onclick="this.parentElement.remove();localStorage.setItem(\'mf-welcome-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
   ```

   **After:**
   ```js
   + '<button onclick="this.parentElement.remove();localStorage.setItem(\'mf-had-fav\',\'1\')" aria-label="Dismiss">\u2715</button>'
   ```

   The `mf-welcome-dismissed` key becomes unused. Do NOT remove existing values — users who already dismissed the old tip shouldn't see it reappear. Add a migration guard:

   ```
   File: src/render.js — inside the tip card condition
   ```

   Amend the condition to also suppress if the old key exists:

   ```js
   var _tipShouldShow = cards.length >= 2
     && !localStorage.getItem('mf-had-fav')
     && !localStorage.getItem('mf-welcome-dismissed')
     && !sessionStorage.getItem('mf-ob-just-done')
     && localStorage.getItem('mf-onboarding-complete');
   ```

### Dark mode notes

No visual changes — the tip card CSS (`css/app.css:593–595`) already has dark mode rules. This is purely logic.

### Test checklist

- [ ] First visit → complete onboarding → Find tab loads → tip does NOT show (mf-ob-just-done in sessionStorage)
- [ ] Close tab, reopen → tip SHOWS (sessionStorage cleared, onboarding complete, no favorites ever)
- [ ] Tap heart on any church → tip disappears on next renderCards() (mf-had-fav now set)
- [ ] Remove all favorites → tip does NOT reappear (mf-had-fav persists)
- [ ] Skip onboarding → tip does NOT show this session (mf-ob-just-done set even on skip)
- [ ] Skip onboarding → close tab → reopen → tip SHOWS
- [ ] Legacy user who already dismissed old tip → tip does NOT show (mf-welcome-dismissed still honored)
- [ ] Dev tools: clear all storage → fresh user flow works correctly

---

## FVX-03 — Daily Card Liturgical Enhancement

**IDEA ref:** IDEA-125  
**Category:** enhancement  
**Files:** `src/app.js` (lines 684–724), `css/app.css` (lines 273–288)  

### Problem

The daily liturgical strip on the Find tab (`_renderDailyStrip`, `src/app.js:684`) renders:
- The feast name in `--font-display` (Playfair)
- A 16×16 chevron arrow in `--color-text-tertiary`
- A secondary line (only on fasting days or HDO vigils)

The card has `border-left:3px solid var(--color-accent)` and a sacred surface background, but nothing communicates **what kind of day** it is or **why tapping would be worthwhile**. The liturgical color (`colorHex`) is computed at line 695 but never rendered. The grade/rank is available on `pick.grade` but unused.

**Dorothy (72):** Sees "Fourth Sunday of Lent" — she already knows this. Nothing tells her there's more content behind the tap. The tiny chevron is invisible to her.  
**Paul (25):** The card looks static, like a label. No color, no movement, no reason to engage. He scrolls past.  
**Sarah (45):** One-handed, scrolling fast. The card blends into the background. Nothing catches her eye to signal "this is tappable and has content."

### Fix

Enhance `_renderDailyStrip()` to render three additional elements using data already available:

**1. Liturgical color dot** — an 8px circle showing the liturgical color of the day.

**2. Rank label** — for high-ranking days (grade ≥ 4), show the rank (Feast, Solemnity) as a small label.

**3. Teaser line** — a brief call-to-action: "Readings & saint of the day →"

```
File: src/app.js (lines 713–722)
```

**Before:**
```js
el.innerHTML = '<div class="daily-card" onclick="switchTab(\'panelMore\',document.querySelector(\'[data-tab=panelMore]\'))">'
  + '<div class="daily-card-row">'
  + '<div class="daily-card-text">'
  + '<div class="daily-card-name">' + utils.esc(pick.name) + '</div>'
  + (secondary ? '<div class="daily-card-secondary">' + utils.esc(secondary) + '</div>' : '')
  + '</div>'
  + '<span class="daily-card-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="16" height="16"><polyline points="9 18 15 12 9 6"/></svg></span>'
  + '</div>'
  + '</div>';
```

**After:**
```js
// FVX-03: Grade label for notable days
var gradeLabels = { 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
var gradeLabel = '';
if (pick.grade >= 4) gradeLabel = gradeLabels[pick.grade] || '';
if (pick.holy_day_of_obligation) gradeLabel = gradeLabel ? gradeLabel + ' · Holy Day' : 'Holy Day of Obligation';

el.innerHTML = '<div class="daily-card" onclick="switchTab(\'panelMore\',document.querySelector(\'[data-tab=panelMore]\'))">'
  + '<div class="daily-card-row">'
  + '<span class="daily-card-color" style="background:' + colorHex + '" aria-label="Liturgical color: ' + color + '"></span>'
  + '<div class="daily-card-text">'
  + (gradeLabel ? '<div class="daily-card-rank">' + utils.esc(gradeLabel) + '</div>' : '')
  + '<div class="daily-card-name">' + utils.esc(pick.name) + '</div>'
  + (secondary ? '<div class="daily-card-secondary">' + utils.esc(secondary) + '</div>' : '')
  + '<div class="daily-card-teaser">Readings & saint of the day<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><polyline points="9 18 15 12 9 6"/></svg></div>'
  + '</div>'
  + '</div>'
  + '</div>';
```

The old standalone `<span class="daily-card-arrow">` is removed — the arrow is now inline in the teaser line, giving the entire teaser text + arrow a clear "tap to go" affordance.

**New CSS:**

```
File: css/app.css — insert after line 283 (after .daily-card-arrow)
```

```css
/* FVX-03: Liturgical color dot */
.daily-card-color { width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:2px;align-self:flex-start;box-shadow:0 0 4px color-mix(in srgb, currentColor 30%, transparent); }

/* FVX-03: Rank label for notable days */
.daily-card-rank { font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-accent);text-transform:uppercase;letter-spacing:0.05em;line-height:1;margin-bottom:2px; }

/* FVX-03: Teaser line with inline arrow */
.daily-card-teaser { font-family:var(--font-body);font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);display:flex;align-items:center;gap:4px; }
.daily-card-teaser svg { flex-shrink:0;color:var(--color-text-tertiary);transition:transform 0.15s ease; }
.daily-card:hover .daily-card-teaser svg,
.daily-card:active .daily-card-teaser svg { transform:translateX(2px); }
```

**Remove the old arrow rule** (line 283):

**Before:**
```css
.daily-card-arrow { color:var(--color-text-tertiary);flex-shrink:0;display:flex;align-items:center; }
```

**After:** Delete this rule (orphaned — no longer rendered).

### Dark mode notes

```
File: css/app.css — update dark mode block (lines 285–288)
```

**Before:**
```css
html[data-theme="dark"] .daily-card-arrow { color:var(--color-text-secondary); }
```

**After:** Replace with:
```css
html[data-theme="dark"] .daily-card-rank { color:var(--color-accent); }
html[data-theme="dark"] .daily-card-teaser { color:var(--color-text-secondary); }
html[data-theme="dark"] .daily-card-color { box-shadow:0 0 6px color-mix(in srgb, currentColor 40%, transparent); }
```

The `--color-accent` is already theme-aware (shifts with liturgical season). The color dot's `background` is set inline via `colorHex`, which is season-specific and reads well on dark backgrounds. The slightly stronger `box-shadow` in dark mode makes the dot more visible against dark surfaces.

### Visual result

**Ordinary weekday (green, grade 0):**
```
🟢  Wednesday of the Third Week of Lent
    Readings & saint of the day ›
```

**Solemnity (white, grade 7):**
```
⚪  SOLEMNITY
    The Annunciation of the Lord
    Readings & saint of the day ›
```

**Fasting day (purple, grade 7):**
```
🟣  SOLEMNITY
    Ash Wednesday
    Day of fasting and abstinence
    Readings & saint of the day ›
```

(Dots shown as emoji for illustration — actual render is CSS circles.)

### Test checklist

- [ ] Ordinary weekday: color dot (green), no rank label, teaser shows
- [ ] Memorial (grade 3): color dot, no rank label (rank labels start at grade 4)
- [ ] Feast (grade 4): color dot + "Feast" rank label
- [ ] Solemnity (grade 6–7): color dot + "Solemnity" rank label
- [ ] Holy Day of Obligation: shows "Solemnity · Holy Day" or "Holy Day of Obligation"
- [ ] Rose color renders correctly (Laetare/Gaudete Sundays)
- [ ] Teaser arrow shifts right on hover/active
- [ ] Dark mode: dot visible with glow, rank label uses accent, teaser readable
- [ ] Secondary line (fasting/abstinence) still renders between name and teaser
- [ ] Tap navigates to More tab (existing behavior preserved)
- [ ] Card animation (`fadeIn 0.3s`) still works
- [ ] Desktop hover state still works (`box-shadow:var(--shadow-card)`)

---

## Cascading Impacts

| Item | Impacts |
|------|---------|
| FVX-01 | Onboarding trigger timing changes may affect the dev tools toggle (`src/app.js:1262–1267`). The toggle sets/clears `mf-onboarding-complete` and calls `_showOnboarding()` — this should still work, but now the overlay will blur the current view instead of painting solid. Verify. |
| FVX-02 | The `mf-welcome-dismissed` key is now legacy. Do NOT remove it from storage — existing users depend on it for suppression. The dev tools welcome toggle (`src/app.js:1210–1215`) should be updated to toggle `mf-had-fav` instead, but this is low priority. |
| FVX-02 | The `_onFavToggle` callback (`src/app.js:324`) calls `renderCards()`, which will re-evaluate the tip condition. After the user's first favorite, the tip disappears on the next render cycle — correct behavior. |
| FVX-03 | The old `.daily-card-arrow` CSS rule (line 283) and its dark mode rule (line 288) become orphaned. Remove both. |
| FVX-03 | The `colorHex` variable is already computed at `src/app.js:695` and is now consumed in the template. No new computation needed. |
