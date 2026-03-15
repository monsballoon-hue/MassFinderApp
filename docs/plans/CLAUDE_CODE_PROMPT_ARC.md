# Claude Code Prompt — ARC Series (Immersive Prayer API)

**Spec file:** `docs/plans/Arch_Spec_Immersive_Prayer_API.md`
**Items:** ARC-01 through ARC-09
**Branch:** `dev`
**IDEA ref:** IDEA-119

---

## Context

Read the full spec at `docs/plans/Arch_Spec_Immersive_Prayer_API.md` before starting.

Six prayer modules duplicate wake lock, swipe, crossfade, prayer text formatting, and completion logging code. Reader.js has three hardcoded prayer mode lists that are already inconsistent. This refactor extracts shared code into `src/prayer-core.js` and adds an `immersive: true` registration flag to `reader.js`.

---

## Implementation Order (mandatory)

1. **ARC-01** — Create `src/prayer-core.js`
2. **ARC-02** — Enhance `reader.js` registerModule with `immersive` flag
3. **ARC-03** — Refactor `rosary.js`
4. **ARC-04** — Refactor `chaplet.js`
5. **ARC-05** — Refactor `stations.js`
6. **ARC-06** — Refactor `novena.js`
7. **ARC-07** — Refactor `prayerbook.js`
8. **ARC-08** — Refactor `examination.js`
9. **ARC-09** — Update `docs/reference/MODULE_MAP.md`

Run `npm run build` after ARC-01 + ARC-02, then again after all module refactors.

---

## Key Implementation Details

### ARC-01: `src/prayer-core.js`

Create `src/prayer-core.js` in the Foundation Layer. ~90 lines. Exports:

```
wakeLock.acquire()          — navigator.wakeLock.request('screen'), store reference
wakeLock.release()          — release if held
wakeLock.onVisibility(mode) — returns function for visibilitychange listener
                              uses lazy require('./reader.js').getCurrent() to check mode
fmtPrayer(text)             — line break→HTML conversion with utils.esc()
scrollTop()                 — readerBody.scrollTop = 0
crossfade(renderFn)         — 150ms fade-out, renderFn(), scrollTop(), 200ms fade-in
logCompletion(type, extra)  — writes to mf-prayer-log, 90-day pruning
initSwipe(nextFn, prevFn)   — attaches touchstart/touchend to readerBody, returns teardown fn
                              threshold: dx > 60 && |dx| > |dy| * 1.5
                              left swipe → nextFn, right swipe → prevFn
navHtml(prevLabel, prevFnName, nextLabel, nextFnName) — returns two-button flex HTML
```

Conventions: `var` only, no arrow functions, CommonJS. Imports only `utils.js` for `esc()`.

The `wakeLock.onVisibility(mode)` function needs reader.getCurrent() but must avoid a top-level circular import. Use lazy require:
```js
function _onVis(mode) {
  return function() {
    var reader = require('./reader.js');
    if (document.visibilityState === 'visible' && reader.getCurrent() && reader.getCurrent().mode === mode) {
      _acquire();
    }
  };
}
```

### ARC-02: `reader.js` changes

In `registerModule()` — store `module.immersive` on the module object (it already stores the whole object, so this is automatic).

Replace three hardcoded lists:

**Line 77 (sacred pause):** Replace `var PRAYER_MODES = { rosary: 1, chaplet: 1, stations: 1, novena: 1 }; if (PRAYER_MODES[mode])` with `if (mod.immersive)`.

**Line 205 (backdrop dismiss):** Replace `if (_current && ['rosary', 'examination', 'stations', 'novena'].indexOf(_current.mode) >= 0) return;` with `if (_current && _modules[_current.mode] && _modules[_current.mode].immersive) return;`.

**Line 228 (swipe dismiss):** Same replacement as line 205.

### ARC-03–08: Module refactors

For each module, the pattern is:
1. Add `var prayerCore = require('./prayer-core.js');` at top
2. Add `immersive: true` to the `registerModule()` options object
3. Delete the duplicated function definitions
4. Replace internal calls with `prayerCore.xxx()` equivalents
5. For swipe: `var _swipeTeardown = null;` in state, `_swipeTeardown = prayerCore.initSwipe(nextFn, prevFn)` in render, `if (_swipeTeardown) _swipeTeardown()` in onClose
6. For wake lock visibility: `var _visHandler = prayerCore.wakeLock.onVisibility('rosary')` then `document.addEventListener('visibilitychange', _visHandler)` / `removeEventListener` in onClose
7. For completion: `prayerCore.logCompletion('rosary', { set: _set })` replacing inline try/catch blocks

**IMPORTANT for rosary.js (ARC-03):** The bead counter (rosaryBeadTap, rosaryBeadReset, _updateBeadUI) is module-specific. Do NOT extract it. The `_navHtml` in rosary includes a swipe cue line — either keep rosary's custom `_navHtml` or add the swipe cue as a parameter to `prayerCore.navHtml()`.

**IMPORTANT for chaplet.js (ARC-04):** The BT4-04 optimization (same-decade bead advance without crossfade, lines 142–156 and 196–210) must remain intact. These code paths do direct DOM updates and do NOT call `_transitionTo`. After refactoring, they should NOT call `prayerCore.crossfade()` either. Only the full-screen transitions use crossfade.

**IMPORTANT for prayerbook.js (ARC-07):** The swipe is only active in litany/lectio modes, not list mode. Check the current conditional logic and preserve it. Set `immersive: true` on the registration (Option A from spec).

**IMPORTANT for examination.js (ARC-08):** Minimal changes only — add `immersive: true`, replace completion logging, add `prayerCore` import. Do not extract navigation logic (examination uses a different section-expand pattern, not step-through).

---

## After implementation

Follow the Post-Implementation Protocol in CLAUDE.md:
1. Update this spec with implementation notes per item
2. Update BACKLOG.md — mark IDEA-119 as done
3. Update COMPLETED_SPECS.md — register ARC-01 through ARC-09
4. `npm run build`
5. Commit and push to `dev`
