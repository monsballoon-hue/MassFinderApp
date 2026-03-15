# CLAUDE_CODE_PROMPT_BT4.md — Backlog Triage Round 4

Implementation prompt for Claude Code. 9 items. Full spec: `docs/plans/UX_Spec_Backlog_Triage_Round_4.md`

## Pre-flight
```
git checkout -b bt4-refinements
```

## BT4-01 — Exam Opening Prayer Scrollable (P1)
**css/app.css ~line 2788:** `.exam-opening-text`
- Replace `overflow:hidden` → `overflow-y:auto;-webkit-overflow-scrolling:touch`
- Remove `-webkit-mask-image` and `mask-image` properties entirely
- Keep `flex:1;min-height:0` (constrains height within flex parent)
- Test: open Examen at all 3 text sizes, confirm prayer scrolls fully

## BT4-03 — Chip Animation Fix (P1)
**css/app.css ~line 138-144:** SLV-01 fallback selector
- Remove `.chip.active` from the comma-separated selector list
- Keep `.saint-card`, `.formation-card`, `.reader-header::after` — they still need the 1.5s season transition
- The chip's own `transition: all var(--transition-fast)` on line 385 handles interaction speed (150ms)
- Test: tap chips on Find tab — instant color fill. Verify saint card on More tab still does slow season transition.

## BT4-08 — Sacred Font Token Swap (P2)
**css/app.css** — 7 novena rules (~lines 2604-2640):
- Find all `font-family:Georgia,'Playfair Display',serif` → replace with `font-family:var(--font-prayer)`
- Affected classes: `.novena-intention`, `.novena-day-meditation p`, `.novena-day-prayer p`, `.novena-day-response p`, `.novena-day-closing p`, `.novena-complete-quote`, `.novena-complete-msg`

**css/app.css** — add after `.devot-body ol li` (~line 1907):
```css
.devot-body blockquote { font-family:var(--font-prayer);font-style:italic;line-height:1.8; }
```
Visual-only — no layout changes expected.

## BT4-07 — Remove Zone 3 Collapse (P2)
**index.html ~line 154:**
- Replace `<details class="more-zone more-zone--deeper" id="deeperZone">` → `<div class="more-zone more-zone--deeper" id="deeperZone">`
- Replace `<summary class="more-zone-deeper-toggle">` → `<div class="more-zone-deeper-header">`
- Remove the chevron SVG (`<svg class="more-zone-deeper-chevron"...>`)
- Close with `</div>` instead of `</summary>`
- Replace `</details>` → `</div>`
- Keep the count badge span (`#deeperCount`)

**src/more.js ~line 1064-1075:**
- Remove the `deeperZone` toggle listener block (the `if (deeperZone)` block that manages open/close state and localStorage)
- Keep the MTR-07 count badge logic (it still reads `deeperCount` and sets textContent)

**css/app.css:**
- Remove line 1517: `.more-zone--deeper[open] .more-zone-deeper-chevron { transform: rotate(180deg); }`
- Keep `.more-zone--deeper` background rule (line 1511)

## BT4-05 — Practice Tile Refinements (P2)
**css/app.css ~line 1574:** `.practice-card`
- Change `background:var(--color-surface-hover)` → `background:var(--color-surface);border:1px solid var(--color-border-light)`
**css/app.css ~line 1583:** dark mode override
- Change to: `html[data-theme="dark"] .practice-card { background:var(--color-surface);border-color:var(--color-border); }`

**src/more.js ~line 964:** Novena practice card subtitle
- Replace verbose description with progress-first label:
```javascript
// Find where novSub is used in the practice card subtitle
// Replace: esc(novSub || 'Guided prayer tracking')
// With progress-aware label:
var novLabel = (activeNovena && activeTracking)
  ? 'Day ' + (activeTracking.completedDays || []).length + ' of ' + (activeNovena.days ? activeNovena.days.length : '?')
  : 'Start a novena';
```
Use `novLabel` in the subtitle instead of `novSub`.

## BT4-06 — Novena List Hierarchy (P2)
**src/novena.js ~line 190 (`_renderSelect`):**
- Before building the list HTML, sort novenas: in-progress first, then alphabetical
```javascript
var sorted = _novenas.slice().sort(function(a, b) {
  var aActive = !!_getTracking(a.id);
  var bActive = !!_getTracking(b.id);
  if (aActive !== bActive) return aActive ? -1 : 1;
  return a.title.localeCompare(b.title);
});
```
- Use `sorted` instead of `_novenas` in the loop
- Add section labels: if any in-progress, render "Continue Praying" label first, then "Available Novenas" before the idle items
- Iterate with a flag to detect the transition point

**css/app.css ~line 2584:** `.novena-list-item.active`
- Replace `border-color:#1E6B4A` → `border-color:var(--color-sacred);border-left:3px solid var(--color-sacred);background:color-mix(in srgb, var(--color-sacred) 6%, var(--color-surface))`

**css/app.css ~line 2587:** `.novena-list-desc`
- Change `font-size:var(--text-base)` → `font-size:var(--text-sm)`
- Add: `display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden`

**Dark mode addition:**
```css
html[data-theme="dark"] .novena-list-item.active { background:rgba(184,150,63,0.08);border-color:var(--color-sacred); }
```

## BT4-09 — Text Size x-large (P2)
**css/app.css ~line 369:** after `[data-text-size="large"]`
- Add: `[data-text-size="x-large"] { font-size:22px; }`

**css/app.css ~line 2115-2121:** PHF-02c reader boost
- Duplicate every `[data-text-size="large"]` selector and add matching `[data-text-size="x-large"]` versions
- Can combine: `[data-text-size="large"] .reader-body .rosary-prayer-text, [data-text-size="x-large"] .reader-body .rosary-prayer-text, ...`

**src/settings.js ~line 54:** text size buttons
- Add 4th button after the large button:
```javascript
+ '<button class="settings-seg-btn settings-seg-xl' + (curSize === 'x-large' ? ' active' : '') + '" onclick="setSettingSize(\'x-large\')">A</button>'
```

**css/app.css:** add after `.text-size-btn--lg` (~line 376):
```css
.settings-seg-xl { font-size:21px; }
```

**Regression:** test all views at 22px root — especially chip bar overflow, parish card layout, detail panel, bottom nav.

## BT4-02 — Prayer Book Render Fix (P2)
**src/prayerbook.js:**
- Find the tap handler that opens a prayer (likely `_onPrayerTap` or event delegation)
- The handler currently: (1) expands prayer text, (2) writes to localStorage recent, (3) re-renders the recents section
- Fix: after writing to localStorage, do NOT call `_renderRecents()` or equivalent. Only update recents on the next full `_render()` (when prayer book reopens or user navigates away and back)
- If recents are rendered via a separate function, guard it: `if (_expandedPrayerId) return;`
- Test: tap prayer → only expands in-place. Close prayer book, reopen → recents updated.

## BT4-04 — Chaplet Same-Prayer Skip (P2)
**src/chaplet.js:**
- Track previous render state: add module-level vars `var _prevPhase = null; var _prevBeadIdx = -1;`
- In the navigation handler (before `_transitionTo`), check:
```javascript
var sameDecade = (_phase === 'decade' && _prevPhase === 'decade' && _prevBeadIdx !== _beadIdx);
if (sameDecade) {
  // Direct update — skip crossfade
  var body = document.getElementById('readerBody');
  // Update bead counter text
  var counter = body && body.querySelector('.chaplet-bead-count, .chaplet-progress-count');
  if (counter) counter.textContent = (_beadIdx + 1) + ' of 10';
  // Update any progress dots
  var dots = body ? body.querySelectorAll('.chaplet-bead-dot') : [];
  dots.forEach(function(d, i) { d.classList.toggle('done', i <= _beadIdx); });
  _prevBeadIdx = _beadIdx;
  _haptic();
  return;
}
_prevPhase = _phase;
_prevBeadIdx = _beadIdx;
_transitionTo(function() { _render(); });
```
- The exact class names for counter and dots will need verification from the actual render output — read `_renderDecade()` to confirm
- Keep full crossfade for phase transitions (opening→decade, decade→closing, etc.)

## Post-flight
```
npm run build
# Visual test: Find tab chips, More tab zones, Settings text size, Examen opening, Prayer book, Chaplet, Novena list
git add -A
git commit -m "fix: BT4 — exam overflow, chip speed, practice tiles, novena list, text size, zone 3, sacred font, chaplet fade, prayerbook render"
git push origin bt4-refinements
```
