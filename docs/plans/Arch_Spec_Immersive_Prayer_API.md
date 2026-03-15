# Architecture Spec: Universal Immersive Prayer API

**Series:** ARC (Architecture)
**Created:** 2026-03-15
**IDEA ref:** IDEA-119
**Status:** Ready for implementation

---

## Problem Statement

Six prayer modules (rosary, chaplet, stations, novena, examination, prayerbook) independently implement the same infrastructure: wake lock management, swipe navigation, crossfade transitions, prayer text formatting, completion logging, and nav button rendering. This produces ~240 lines of duplicated code across modules.

Additionally, `reader.js` maintains **three separate hardcoded prayer mode lists** (lines 77, 205, 228) that are already inconsistent:

- Line 77 `PRAYER_MODES`: `{ rosary, chaplet, stations, novena }` — sacred pause trigger
- Line 205 dismiss exclusion: `['rosary', 'examination', 'stations', 'novena']` — **chaplet missing**
- Line 228 swipe-dismiss exclusion: `['rosary', 'examination', 'stations', 'novena']` — **chaplet missing, prayerbook litany mode missing**

Every new prayer module requires updating 3+ hardcoded lists AND copy-pasting ~50 lines of boilerplate. This is fragile and has already produced the chaplet dismiss bug.

IDEA-119 asks for immersive mode in **all** prayer tools. Without this refactor, that means copying the boilerplate into every new module and extending the hardcoded lists further.

---

## Architecture Design

Two changes, independent of each other, that together solve the problem:

### Layer 1: `src/prayer-core.js` — Shared Prayer Utilities

A new foundation-layer module (no UI rendering) that extracts the duplicated infrastructure into reusable functions. Prayer modules import what they need.

### Layer 2: Enhanced `reader.registerModule()` — Immersive Flag

Modules declare `immersive: true` during registration. `reader.js` uses this flag instead of hardcoded lists to control sacred pause, backdrop dismiss blocking, and swipe-to-dismiss blocking.

These two layers are independent: prayer-core.js does not import reader.js, and reader.js does not import prayer-core.js. Prayer modules import both.

---

## Dependency Analysis

**Current dependency chain (prayer modules):**
```
rosary.js → utils.js, haptics.js, reader.js, snippet.js
chaplet.js → utils.js, haptics.js, reader.js
stations.js → utils.js, haptics.js, reader.js, snippet.js, refs.js (lazy)
novena.js → utils.js, haptics.js, reader.js
prayerbook.js → utils.js, haptics.js, reader.js
examination.js → refs.js, ui.js, haptics.js, reader.js
```

**Proposed dependency chain:**
```
prayer-core.js → utils.js, haptics.js          (foundation layer — no circular risk)
rosary.js → utils.js, haptics.js, reader.js, prayer-core.js, snippet.js
chaplet.js → utils.js, haptics.js, reader.js, prayer-core.js
stations.js → utils.js, haptics.js, reader.js, prayer-core.js, snippet.js, refs.js (lazy)
novena.js → utils.js, haptics.js, reader.js, prayer-core.js
prayerbook.js → utils.js, haptics.js, reader.js, prayer-core.js
examination.js → refs.js, ui.js, haptics.js, reader.js, prayer-core.js
```

**Circular dependency risk:** None. `prayer-core.js` only imports leaf nodes (`utils.js`, `haptics.js`). It never imports `reader.js` or any prayer module.

---

## Spec Items

### ARC-01 — Create `src/prayer-core.js`

**What:** New module exporting shared prayer infrastructure.

**Exports:**

| Function | Signature | Replaces |
|----------|-----------|----------|
| `wakeLock.acquire()` | `function()` — requests screen wake lock | `_acquireWakeLock()` in 5 modules |
| `wakeLock.release()` | `function()` — releases wake lock | `_releaseWakeLock()` in 5 modules |
| `wakeLock.onVisibility(mode)` | `function(mode)` — returns a visibility handler that re-acquires lock when `reader.getCurrent().mode === mode` | `_handleVisibility()` in 3 modules |
| `fmtPrayer(text)` | `function(text) → string` — line breaks to HTML, escapes | `_fmtPrayer()` in 4 modules |
| `scrollTop()` | `function()` — scrolls readerBody to top | `_scrollTop()` in 2 modules |
| `crossfade(renderFn)` | `function(renderFn)` — 150ms fade-out, render, 200ms fade-in, scroll top | `_transitionTo()` in 3 modules |
| `logCompletion(type, extra)` | `function(type, extra)` — writes to `mf-prayer-log` in localStorage with 90-day pruning | Completion logging in 5 modules |
| `initSwipe(nextFn, prevFn)` | `function(nextFn, prevFn)` — attaches horizontal swipe to readerBody, returns teardown function | `_initSwipe/_teardownSwipe/_onTouchStart/_onTouchEnd` in 4 modules |
| `navHtml(prevLabel, prevFn, nextLabel, nextFn)` | `function → string` — returns nav button HTML with configurable onclick names | `_navHtml()` in 3 modules |

**NOTE on `wakeLock.onVisibility`:** This function needs to call `reader.getCurrent()` to check if the prayer module is still active. To avoid importing reader.js, it accepts a callback or the mode string and uses a lazy `require('./reader.js')` call. This is the established pattern for circular-dep-adjacent situations in this codebase.

**Implementation notes:**
- `var` only, `function` declarations, CommonJS
- `utils.js` imported for `esc()`
- `haptics.js` NOT imported here (callers already have it)
- Swipe threshold: `dx > 60 && |dx| > |dy| * 1.5` (matches existing)
- Crossfade timing: 150ms out / 200ms in (matches existing)
- Prayer log: 90-day rolling window (matches existing)

**Estimated size:** ~90 lines

**Why:** Without this, every new prayer module (litanies, lectio divina, etc.) must copy-paste ~50 lines and risk divergence. The chaplet already diverges in its swipe threshold handling from rosary.

**File location in MODULE_MAP:** Foundation Layer, between `ccc-data.js` and `refs.js`

---

### ARC-02 — Enhance `reader.registerModule()` with immersive flag

**What:** Extend the registration interface so modules can declare immersive behavior.

**Current registration API:**
```js
reader.registerModule('rosary', {
  getTitle: function(params) { return 'The Holy Rosary'; },
  render: function(params, bodyEl, footerEl) { ... },
  onClose: function() { ... },
  getHeaderExtra: function(params) { return ''; }  // optional
});
```

**New registration API (backward-compatible):**
```js
reader.registerModule('rosary', {
  getTitle: function(params) { return 'The Holy Rosary'; },
  render: function(params, bodyEl, footerEl) { ... },
  onClose: function() { ... },
  getHeaderExtra: function(params) { return ''; },  // optional
  immersive: true  // NEW — opt-in flag
});
```

**What `immersive: true` controls in reader.js:**

1. **Sacred pause** (line 77): Replace hardcoded `PRAYER_MODES` with:
   ```js
   if (mod.immersive) { _sacredPause.show(...); }
   ```

2. **Backdrop dismiss** (line 205): Replace hardcoded array with:
   ```js
   if (_current && _modules[_current.mode] && _modules[_current.mode].immersive) return;
   ```

3. **Swipe-to-dismiss** (line 228): Same pattern as backdrop dismiss.

**Why:** Eliminates three hardcoded lists that are already inconsistent. New prayer modules get immersive behavior by setting one flag — no reader.js edits required.

**Risk:** None — backward compatible. Modules that don't set `immersive` behave exactly as before (CCC, Bible, explore, settings, guides all continue as-is).

**Bug fix included:** Chaplet gets dismiss protection it currently lacks (lines 205, 228).

---

### ARC-03 — Refactor `rosary.js` to use `prayer-core.js`

**What:** Remove duplicated code, import shared functions.

**Changes:**
- Remove: `_acquireWakeLock`, `_releaseWakeLock`, `_handleVisibility` (~18 lines)
- Remove: `_transitionTo` (~10 lines)
- Remove: `_initSwipe`, `_teardownSwipe`, `_onTouchStart`, `_onTouchEnd` (~28 lines)
- Remove: `_fmtPrayer` (~5 lines)
- Remove: completion logging block in `rosaryNext()` (~8 lines)
- Add: `var prayerCore = require('./prayer-core.js');` at top
- Add: `immersive: true` to `registerModule()` call
- Replace internal calls: `_transitionTo(fn)` → `prayerCore.crossfade(fn)`, etc.
- **Swipe teardown:** `_initSwipe()` now returns a teardown function. Store it: `var _teardown = prayerCore.initSwipe(rosaryNext, rosaryPrev)`. Call `_teardown()` in `onClose`.

**Estimated removal:** ~60 lines net (add ~5, remove ~65)

**Risk:** Rosary is the most complex prayer module. Test: set selection, decade navigation, bead counting, completion, swipe, wake lock re-acquire on tab-back.

---

### ARC-04 — Refactor `chaplet.js` to use `prayer-core.js`

**What:** Same extraction pattern as ARC-03.

**Changes:**
- Remove: `_acquireWakeLock`, `_releaseWakeLock`, `_handleVisibility` (~18 lines)
- Remove: `_transitionTo` (~10 lines)
- Remove: `_initSwipe`, `_teardownSwipe`, `_onTouchStart`, `_onTouchEnd` (~25 lines)
- Remove: `_fmtPrayer` (~5 lines)
- Remove: completion logging block (~8 lines)
- Add: `var prayerCore = require('./prayer-core.js');`
- Add: `immersive: true` to `registerModule()`

**Estimated removal:** ~55 lines net

**Bug fix included:** Chaplet now gets backdrop/swipe dismiss protection via `immersive: true` (currently missing from reader.js lines 205, 228).

**Risk:** Low. Chaplet is a simpler linear flow. Test: full completion path, swipe navigation, bead dot updates during same-decade advances (BT4-04 optimization must still work — it does DOM updates directly, not via crossfade).

---

### ARC-05 — Refactor `stations.js` to use `prayer-core.js`

**What:** Same extraction pattern.

**Changes:**
- Remove: `_acquireWakeLock`, `_releaseWakeLock`, `_handleVisibility` (~18 lines)
- Remove: `_transitionTo` (~10 lines)
- Remove: `_initSwipe`, `_teardownSwipe`, `_onTouchStart`, `_onTouchEnd` (~25 lines)
- Remove: `_fmtPrayer` (~5 lines)
- Remove: completion logging block (~8 lines)
- Add: `var prayerCore = require('./prayer-core.js');`
- Add: `immersive: true` to `registerModule()`

**Estimated removal:** ~55 lines net

**Risk:** Low. Test: 14-station navigation, progress dot jumping, closing/completion, scripture refs still tappable.

---

### ARC-06 — Refactor `novena.js` to use `prayer-core.js`

**What:** Partial extraction — novena has wake lock and fmtPrayer but no swipe or crossfade.

**Changes:**
- Remove: `_acquireWakeLock`, `_releaseWakeLock` (~12 lines)
- Remove: `_fmtPrayer` (~4 lines)
- Add: `var prayerCore = require('./prayer-core.js');`
- Add: `immersive: true` to `registerModule()`

**Estimated removal:** ~12 lines net

**Risk:** Low. Novena is simpler — no swipe, no crossfade. Test: novena selection, day completion, tracking persistence.

---

### ARC-07 — Refactor `prayerbook.js` to use `prayer-core.js`

**What:** Extract wake lock and swipe code.

**Changes:**
- Remove: `_acquireWakeLock`, `_releaseWakeLock` (~12 lines)
- Remove: `_initSwipe`, `_teardownSwipe`, `_onTouchStart`, `_onTouchEnd` (~25 lines)
- Add: `var prayerCore = require('./prayer-core.js');`
- Add: `immersive: true` to `registerModule()` — BUT only for litany/lectio sub-modes, not list mode

**Design decision for prayerbook:** Prayerbook has a `_screen` state that shifts between 'list', 'litany', and 'lectio'. The list screen is not immersive (it's a scrollable index). Only litany and lectio are immersive. Two options:

**Option A:** Set `immersive: true` on the module. The list screen still gets dismiss protection, which is slightly conservative but harmless — users close via the X button anyway.

**Option B:** Don't set `immersive: true` on the module. Instead, add a new optional callback `isImmersive: function() { return _screen !== 'list'; }` and update reader.js to call it dynamically.

**Recommendation:** Option A. The cost of being slightly conservative on dismiss behavior is near-zero (nobody swipe-dismisses a prayer book mid-use). Option B adds complexity for a marginal edge case.

**Estimated removal:** ~30 lines net

**Risk:** Medium — prayerbook has sub-mode complexity. Test: list view, individual prayer expansion, litany step-through with swipe, lectio divina flow, wake lock in litany mode.

---

### ARC-08 — Refactor `examination.js` to use `prayer-core.js`

**What:** Minimal extraction — examination only shares completion logging and (optionally) fmtPrayer. It already has `immersive: true` behavior via the hardcoded dismiss lists.

**Changes:**
- Add: `var prayerCore = require('./prayer-core.js');`
- Add: `immersive: true` to `registerModule()`
- Replace: inline completion logging with `prayerCore.logCompletion('examination')`
- No wake lock/swipe/crossfade changes needed — examination doesn't use these (it has its own section-by-section navigation that differs from the step-through pattern)

**Estimated removal:** ~8 lines net

**Risk:** Low. Examination is architecturally different from other prayer modules (section expand/collapse vs step-through). The refactor is minimal.

---

### ARC-09 — Update `docs/reference/MODULE_MAP.md`

**What:** Add `prayer-core.js` to the Foundation Layer table. Update Prayer Tool Modules section to note `prayer-core.js` as a shared import.

---

## Implementation Order

**Dependency-safe sequence:**

1. **ARC-01** (prayer-core.js) — must exist before anything imports it
2. **ARC-02** (reader.js immersive flag) — independent of ARC-01, but do it second so prayer modules can set the flag when refactored
3. **ARC-03** (rosary.js) — most complex, test first
4. **ARC-04** (chaplet.js) — includes dismiss bug fix
5. **ARC-05** (stations.js)
6. **ARC-06** (novena.js)
7. **ARC-07** (prayerbook.js)
8. **ARC-08** (examination.js)
9. **ARC-09** (MODULE_MAP update)

Items 3–8 are independent of each other and can be done in any order after ARC-01 + ARC-02 land.

---

## Impact Summary

| Metric | Before | After |
|--------|--------|-------|
| Wake lock implementations | 5 copies | 1 in prayer-core.js |
| Swipe implementations | 4 copies | 1 in prayer-core.js |
| Crossfade implementations | 3 copies | 1 in prayer-core.js |
| Prayer formatting implementations | 4 copies | 1 in prayer-core.js |
| Completion logging implementations | 5 copies | 1 in prayer-core.js |
| Hardcoded mode lists in reader.js | 3 (inconsistent) | 0 (data-driven) |
| Lines removed from prayer modules | — | ~220 |
| New prayer-core.js | — | ~90 lines |
| **Net line reduction** | — | **~130 lines** |
| Bundle size impact | — | ~-500 bytes (dedup > new module overhead) |
| Chaplet dismiss bug | present | fixed |
| New prayer module boilerplate | ~50 lines copy-paste | `require + immersive: true` |

---

## Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Rosary bead counter breaks during refactor | Medium | Bead tap/reset is module-specific code, not extracted. Only swipe/wake/transition extracted. Test decade navigation specifically. |
| Chaplet same-decade optimization (BT4-04) breaks | Low | This optimization does direct DOM updates, not crossfade. It won't call `prayerCore.crossfade()`. Verify it still bypasses correctly. |
| Examination section navigation regresses | Very Low | Examination extraction is minimal (logging only). No navigation code changes. |
| Wake lock not re-acquired after tab switch | Medium | `wakeLock.onVisibility(mode)` must use lazy `require('./reader.js')` to check current mode. Test by switching tabs and back. |
| Swipe conflicts with bead tap in rosary | Low | Rosary swipe and bead tap use different gesture thresholds. Swipe is horizontal (dx>60), bead is vertical tap. No change to thresholds. |

---

## Test Checklist (for QA after implementation)

For each prayer module (rosary, chaplet, stations, novena, prayerbook, examination):

- [ ] Module opens via More tab → prayer tool grid
- [ ] Sacred pause shows on first open (session)
- [ ] Wake lock acquired (check via chrome://wake-lock-internals or observe screen-never-dims)
- [ ] Swipe navigation works (where applicable)
- [ ] Crossfade transitions smooth (where applicable)
- [ ] Completion logging writes to localStorage
- [ ] Backdrop click does NOT dismiss (prayer modules)
- [ ] Downward swipe does NOT dismiss (prayer modules)
- [ ] X button closes properly, wake lock released
- [ ] Tab switch + return re-acquires wake lock
- [ ] Cross-reference tap (CCC/Bible) opens reader stack, back button returns

**Chaplet-specific:**
- [ ] Backdrop click no longer dismisses (bug fix)
- [ ] BT4-04 same-decade bead advance still skips crossfade

**Prayerbook-specific:**
- [ ] List mode still scrollable
- [ ] Litany swipe navigation works
- [ ] Lectio divina step-through works
