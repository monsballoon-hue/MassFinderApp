# Claude Code Prompt — FVX Series (First Visit Experience)

**Spec:** `docs/plans/UX_Spec_First_Visit_Experience.md`  
**Items:** FVX-01, FVX-02, FVX-03  
**Branch:** `fvx-first-visit-experience`  

---

## FVX-01 — Onboarding Delay + Blur Backdrop

### JS changes (src/app.js)

1. **Move onboarding trigger block** from its current position (before parish data fetch, ~line 893) to AFTER the initial `render.renderCards()` call (~after line 959). The exact block to move:
```js
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

2. **Wrap `_showOnboarding()` in setTimeout(fn, 800)** at the new location. This gives cards time to paint before overlay appears.

### CSS changes (css/app.css)

3. **Line 2038** — Replace `.ob-overlay` background with blur:
```css
.ob-overlay { position:fixed;inset:0;z-index:9999;background:color-mix(in srgb, var(--color-bg) 85%, transparent);-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px);display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity 0.5s ease, backdrop-filter 0.6s ease, -webkit-backdrop-filter 0.6s ease; }
```

4. **Line 2039** — Update `.ob-overlay.open`:
```css
.ob-overlay.open { opacity:1;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px); }
```

5. **Line 2040** — Update `.ob-overlay.dismissing`:
```css
.ob-overlay.dismissing { opacity:0;-webkit-backdrop-filter:blur(0px);backdrop-filter:blur(0px);transition:opacity 0.5s ease, backdrop-filter 0.4s ease, -webkit-backdrop-filter 0.4s ease;pointer-events:none; }
```

6. Per-step gradient backgrounds (lines 2042–2045) — **no changes needed**, they layer on top of blur.

---

## FVX-02 — Tip Card State-Aware Logic

### JS changes

7. **src/data.js (~line 53)** — In `toggleFav`, when ADDING a favorite (the `else` branch), add:
```js
try { localStorage.setItem('mf-had-fav', '1'); } catch (e) {}
```

8. **src/app.js (~line 146)** — In `_dismissOb()`, after the `mf-onboarding-complete` localStorage set, add:
```js
try { sessionStorage.setItem('mf-ob-just-done', '1'); } catch (e) {}
```

9. **src/render.js (~line 298–305)** — Replace tip card condition:

**Before:**
```js
if (!localStorage.getItem('mf-welcome-dismissed') && cards.length >= 2) {
```

**After:**
```js
var _tipShouldShow = cards.length >= 2
  && !localStorage.getItem('mf-had-fav')
  && !localStorage.getItem('mf-welcome-dismissed')
  && !sessionStorage.getItem('mf-ob-just-done')
  && localStorage.getItem('mf-onboarding-complete');
if (_tipShouldShow) {
```

10. **src/render.js (~line 302)** — Update dismiss button to set `mf-had-fav`:

**Before:**
```js
+ '<button onclick="this.parentElement.remove();localStorage.setItem(\'mf-welcome-dismissed\',\'1\')" aria-label="Dismiss">\u2715</button>'
```

**After:**
```js
+ '<button onclick="this.parentElement.remove();localStorage.setItem(\'mf-had-fav\',\'1\')" aria-label="Dismiss">\u2715</button>'
```

---

## FVX-03 — Daily Card Liturgical Enhancement

### JS changes (src/app.js)

11. **In `_renderDailyStrip` (~line 713)** — Add grade label computation before the `el.innerHTML` assignment:
```js
var gradeLabels = { 4: 'Feast', 5: 'Feast of the Lord', 6: 'Solemnity', 7: 'Solemnity' };
var gradeLabel = '';
if (pick.grade >= 4) gradeLabel = gradeLabels[pick.grade] || '';
if (pick.holy_day_of_obligation) gradeLabel = gradeLabel ? gradeLabel + ' \u00b7 Holy Day' : 'Holy Day of Obligation';
```

12. **Replace the `el.innerHTML` template** with:
```js
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

### CSS changes (css/app.css)

13. **After line 283** — Add new rules:
```css
.daily-card-color { width:8px;height:8px;border-radius:50%;flex-shrink:0;margin-top:2px;align-self:flex-start;box-shadow:0 0 4px color-mix(in srgb, currentColor 30%, transparent); }
.daily-card-rank { font-family:var(--font-body);font-size:var(--text-xs);font-weight:var(--weight-semibold);color:var(--color-accent);text-transform:uppercase;letter-spacing:0.05em;line-height:1;margin-bottom:2px; }
.daily-card-teaser { font-family:var(--font-body);font-size:var(--text-xs);color:var(--color-text-tertiary);margin-top:var(--space-1);display:flex;align-items:center;gap:4px; }
.daily-card-teaser svg { flex-shrink:0;color:var(--color-text-tertiary);transition:transform 0.15s ease; }
.daily-card:hover .daily-card-teaser svg,.daily-card:active .daily-card-teaser svg { transform:translateX(2px); }
```

14. **Delete line 283** — Remove orphaned `.daily-card-arrow` rule.

15. **Dark mode (line 285–288)** — Replace `.daily-card-arrow` dark rule with:
```css
html[data-theme="dark"] .daily-card-rank { color:var(--color-accent); }
html[data-theme="dark"] .daily-card-teaser { color:var(--color-text-secondary); }
html[data-theme="dark"] .daily-card-color { box-shadow:0 0 6px color-mix(in srgb, currentColor 40%, transparent); }
```
Remove `html[data-theme="dark"] .daily-card-arrow` (orphaned).

---

## Build & verify

```bash
npm run build
```

Test all three items per the test checklists in the spec. Use dev tools onboarding toggle to test FVX-01/02. Check dark mode for all three.

## Commit

```
feat: first visit experience — onboarding blur, tip card logic, daily card liturgical draw (FVX-01/02/03)

FVX-01: Delay onboarding to post-render, blur backdrop instead of solid bg
FVX-02: State-aware tip card — suppress after onboarding, after first fav
FVX-03: Daily card gets liturgical color dot, rank label, teaser line

Closes IDEA-123, IDEA-124, IDEA-125
```
