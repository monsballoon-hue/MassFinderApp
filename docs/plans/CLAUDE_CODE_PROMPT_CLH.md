# Claude Code Prompt — CLH Series (Contextual Filter Hints)

**Spec:** `docs/plans/UX_Spec_Contextual_Filter_Hints.md`  
**Scope:** 4 items (CLH-01 through CLH-04). CLH-05 is deferred (needs content).  
**Branch:** `clh-contextual-filter-hints`

---

## Pre-flight

```bash
git checkout main && git pull
git checkout -b clh-contextual-filter-hints
```

Verify current state:
- `index.html` lines ~82–83: two divs `confessionHint` and `spanishHint`
- `src/render.js` lines ~129–157: two parallel hint blocks
- `css/app.css` lines ~2105–2109: `.confession-hint*` classes
- `src/devotions.js` line ~8: confession-guide reader module
- `src/app.js` line ~259: `window.openConfessionGuide`

---

## Step 1: CLH-02 — Register Adoration reader module

**File: `src/devotions.js`**

After the confession-guide `reader.registerModule` block (after the `onClose: function() {}` closing and before `_wrapScriptureRefs`), add an adoration-guide reader module. Follow the exact pattern of confession-guide (lines 8–47):

- Module name: `'adoration-guide'`
- Title: `'Eucharistic Adoration'`
- Find the guide by iterating DEVOTIONAL_GUIDES for `isGroup` entries, then searching `children` for `title === 'Eucharistic Adoration'`
- Render body with `_wrapScriptureRefs(_wrapTerms(guide.body))` inside a max-width:540px container
- Add a "Find Adoration near you" button at bottom that closes reader, switches to Find tab, clicks adoration filter chip
- Call `_initTermClicks(bodyEl)` and `refs.initRefTaps(bodyEl)` after rendering
- `footerEl.style.display = 'none'`

**File: `src/app.js`**

Near line 259 (after `window.openConfessionGuide`), add:
```javascript
window.openAdorationGuide = function() { reader.readerOpen('adoration-guide'); };
```

**Verify:** `npm run build` succeeds. Test `openAdorationGuide()` in browser console.

---

## Step 2: CLH-01 + CLH-04 — Generalize hint system

### 2a: Replace HTML divs

**File: `index.html`**

Replace the two hint divs:
```html
<div id="confessionHint" class="confession-hint" style="display:none"></div>
<div id="spanishHint" class="confession-hint" style="display:none"></div>
```
With one:
```html
<div id="filterHint" class="filter-hint" style="display:none"></div>
```

### 2b: Replace render.js hint logic

**File: `src/render.js`**

Find the confession hint block (starts with comment `// PHF-01b:`) and the Spanish hint block (starts with `// I18N:`). Replace both blocks with a single data-driven block:

```javascript
// CLH-01: Data-driven contextual filter hints
var filterHintEl = document.getElementById('filterHint');
if (filterHintEl) {
  var _hintConfig = {
    confession: {
      text: 'Not sure what to expect?',
      link: 'How Confession works \u203A',
      action: 'openConfessionGuide()',
      storageKey: 'mf-conf-hint-dismissed'
    },
    adoration: {
      text: 'New to Adoration?',
      link: 'What to expect \u203A',
      action: 'openAdorationGuide()',
      storageKey: 'mf-ador-hint-dismissed'
    },
    spanish: {
      text: 'Prayers available in Spanish',
      link: 'Set prayer language \u203A',
      action: 'openSettings()',
      storageKey: 'mf-spanish-hint-dismissed',
      condition: function() {
        return localStorage.getItem('mf-prayer-lang') !== 'es';
      }
    }
    // CLH-05: latin entry — add when content is ready
  };

  var _hint = _hintConfig[state.currentFilter];
  var _showHint = _hint
    && !sessionStorage.getItem(_hint.storageKey)
    && (!_hint.condition || _hint.condition());

  if (_showHint) {
    filterHintEl.style.display = '';
    filterHintEl.innerHTML = '<div class="filter-hint-inner">'
      + '<span>' + _hint.text + '</span>'
      + '<span class="filter-hint-link" onclick="' + _hint.action + '">' + _hint.link + '</span>'
      + '<button class="filter-hint-dismiss" onclick="this.closest(\'.filter-hint\').style.display=\'none\';sessionStorage.setItem(\'' + _hint.storageKey + '\',\'1\')" aria-label="Dismiss hint">'
      + '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      + '</button>'
      + '</div>';
  } else {
    filterHintEl.style.display = 'none';
  }
}
```

Ensure you remove the OLD confession hint block AND the OLD spanish hint block entirely. Search for `confessionHint` and `spanishHint` in render.js to confirm no orphaned references.

### 2c: Replace CSS

**File: `css/app.css`**

Find the block starting with `/* PHF-01b: Confession guide hint on Find tab */` (around line 2104). Replace ALL `.confession-hint*` rules with:

```css
/* CLH-01: Contextual filter hints (generalized from PHF-01b) */
.filter-hint { padding:0 var(--space-4);max-width:var(--max-width);margin:0 auto; }
.filter-hint-inner { display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:color-mix(in srgb, var(--color-info) 4%, transparent);border-radius:var(--radius-sm);font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2); }
.filter-hint-link { color:var(--color-info);font-weight:var(--weight-semibold);cursor:pointer;white-space:nowrap; }
.filter-hint-dismiss { margin-left:auto;background:none;border:none;color:var(--color-text-tertiary);cursor:pointer;padding:var(--space-2);min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent; }
html[data-theme="dark"] .filter-hint-inner { background:color-mix(in srgb, var(--color-info) 5%, transparent); }
```

Key changes from old CSS: class names `.confession-hint*` → `.filter-hint*`, dismiss button 28px → 44px, padding `--space-1` → `--space-2`, removed `font-size:var(--text-xs)` from dismiss (SVG handles sizing now).

**IMPORTANT:** Do NOT touch the `.conf-guide-nudge*` styles (~line 2098). Those are for the detail panel confession nudge (PHF-01a), unrelated.

### 2d: Search for orphaned references

After changes, search entire codebase:
```bash
grep -rn "confessionHint\|spanishHint\|confession-hint-inner\|confession-hint-link\|confession-hint-dismiss" src/ index.html css/
```

The ONLY remaining matches should be in the `.conf-guide-nudge` area (which uses different class names). If anything else references the old IDs/classes, update it.

---

## Step 3: Build and verify

```bash
npm run build
```

Must succeed with no errors.

---

## Step 4: Manual test matrix

| Test | Expected |
|------|----------|
| Tap Confession chip | "Not sure what to expect? How Confession works ›" appears |
| Tap hint link | Confession guide opens in reader |
| Tap × dismiss | Hint hides, stays hidden during session |
| Switch to All chip | Hint area hides |
| Return to Confession after dismiss | Stays hidden |
| Tap Adoration chip | "New to Adoration? What to expect ›" appears |
| Tap hint link | Adoration guide opens in reader |
| Adoration guide content | Shows term tooltips, "Find Adoration near you" button |
| Tap × dismiss | Hint hides for session |
| Tap Spanish chip (non-Spanish lang) | "Prayers available in Spanish / Set prayer language ›" |
| Tap Spanish chip (Spanish lang set) | No hint appears |
| Tap Today/Weekend/Latin/All chips | No hint appears |
| Dark mode all hints | Subtle tinted background, readable text |
| Dismiss button size | ≥ 44×44 actual touch area |

---

## Step 5: Commit

```bash
git add -A
git commit -m "feat: contextual filter hints — generalized system + adoration guide (CLH-01–04)

- Replace hardcoded confessionHint/spanishHint with data-driven filterHint system
- Register Adoration guide as reader module (openable from any surface)
- Add adoration filter hint: 'New to Adoration? What to expect ›'
- Fix dismiss button touch target: 28px → 44px (Apple HIG compliance)
- Session-scoped dismissal preserved for all hints
- Infrastructure ready for Latin hint when content is written (CLH-05)"
```

---

## Post-implementation

Update BACKLOG.md: mark IDEA-120, IDEA-121, IDEA-122 as done with spec ref CLH-01–04.
Update COMPLETED_SPECS.md: mark CLH-01–04 as Done.
