# Claude Code Prompt — CLH Series (Contextual Filter Hints)

**Spec:** `docs/plans/UX_Spec_Contextual_Filter_Hints.md`  
**Content specs:** `docs/plans/Content_Spec_LatinMass.md` (CON-30, approved), `docs/plans/Content_Spec_LatinFilterHint.md` (CON-31, approved)  
**Scope:** 5 items (CLH-01 through CLH-05). All content approved by Catholic Review.  
**Branch:** `clh-contextual-filter-hints`

---

## Pre-flight

```bash
git checkout main && git pull
git checkout -b clh-contextual-filter-hints
```

Verify current state:
- `index.html` lines ~81–82: two divs `confessionHint` and `spanishHint`
- `src/render.js` lines ~128–158: two parallel hint blocks (PHF-01b confession, I18N spanish)
- `css/app.css` lines ~2184–2188: `.confession-hint*` classes
- `src/devotions.js` line ~8: confession-guide reader module (the pattern to follow)
- `src/devotions.js` line ~353: Gorzkie Żale entry (Latin Mass guide goes AFTER this)
- `src/app.js` line ~429: `window.openConfessionGuide` (adoration + latin go near here)

---

## Step 1: CLH-02 — Register Adoration reader module

**File: `src/devotions.js`**

After the confession-guide `reader.registerModule` block (after the `onClose: function() {}` closing on line ~46, before the `_wrapScriptureRefs` function), add:

```javascript
// CLH-02: Adoration Guide reader module — accessible from any tab
reader.registerModule('adoration-guide', {
  getTitle: function() { return 'Eucharistic Adoration'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    // Find Adoration guide in Devotions group
    var guide = null;
    for (var i = 0; i < DEVOTIONAL_GUIDES.length; i++) {
      var g = DEVOTIONAL_GUIDES[i];
      if (g.isGroup && g.children) {
        for (var j = 0; j < g.children.length; j++) {
          if (g.children[j].title === 'Eucharistic Adoration') {
            guide = g.children[j];
            break;
          }
        }
      }
      if (guide) break;
    }
    if (!guide) { bodyEl.innerHTML = '<p>Guide not found.</p>'; return; }

    bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75">'
      + _wrapScriptureRefs(_wrapTerms(guide.body))
      + '<div style="margin-top:var(--space-5)">'
      + '<button onclick="readerClose();closeAllPanels();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=adoration]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Adoration near you</button>'
      + '</div></div>';

    _initTermClicks(bodyEl);
    refs.initRefTaps(bodyEl);
  },
  onClose: function() {}
});
```

**File: `src/app.js`**

Near line ~429 (after `window.openConfessionGuide`), add:
```javascript
window.openAdorationGuide = function() { reader.readerOpen('adoration-guide'); };
```

**Verify:** `npm run build` succeeds. Test `openAdorationGuide()` in browser console.

---

## Step 2: CON-30 + CLH-05 reader — Add Latin Mass guide content and reader module

### 2a: Add guide entry to DEVOTIONAL_GUIDES

**File: `src/devotions.js`**

In the `DEVOTIONAL_GUIDES` array, inside the Devotions group (`isGroup:true` → `children` array), add a new entry **after** the Gorzkie Żale entry (line ~357, after `},`) and **before** the Stations of the Cross entry.

The content below is from `Content_Spec_LatinMass.md` (CON-30), approved by Catholic Review with CRX-01–04 corrections applied. **Copy exactly — do not edit the text.**

```javascript
    {icon:'',title:'What to Expect at a Latin Mass',findLabel:'Latin Mass',filter:'latin',body:
'<p>The <strong>Traditional Latin Mass</strong> \u2014 also called the Extraordinary Form, or the Mass according to the 1962 Roman Missal \u2014 is the older form of the Mass celebrated in the Catholic Church for centuries before the liturgical reforms following Vatican II. The prayers are in Latin. The priest faces the altar, in the same direction as the people, a posture called <em>ad orientem</em>. The overall feel is quieter, more formal, and deeply reverent.</p>'
+'<p>If you\u2019re used to the regular Sunday Mass (the Ordinary Form), a few things will feel different. At a Low Mass (the most common weekday form), you may hear no spoken responses from the congregation \u2014 only the altar server responds to the priest. At a Dialogue Mass or Sung Mass, however, the congregation joins in the responses and may sing parts of the liturgy in Latin. Much of the priest\u2019s prayer is said softly or silently. A choir or schola may sing in Latin or Gregorian chant. Communion is received kneeling, on the tongue. A hand missal \u2014 a booklet with the Latin text and English translation side by side \u2014 is your best companion. Most parishes that offer this Mass provide them in the pews.</p>'
+'<p>It\u2019s completely normal to feel a little lost. Many people do their first several times. You don\u2019t need to follow every word. You can pray along in the missal, pray the Rosary quietly, or simply be present. Let the beauty of the liturgy wash over you. No one is watching to see if you turn to the right page.</p>'
+'<details class="devot-expand"><summary>Practical tips for your first time</summary>'
+'<p><strong>Dress:</strong> Many regular attendees dress more formally \u2014 men in collared shirts, women in dresses or skirts, sometimes with a chapel veil. This isn\u2019t a rule. Come as you are. You won\u2019t be turned away for wearing jeans.</p>'
+'<p><strong>Missal:</strong> Look for a red booklet in the pew \u2014 often a <em>1962 Missal</em> or a parish guide. It will have Latin on one side and English on the other. If you can\u2019t find one, ask someone nearby. People are usually happy to help.</p>'
+'<p><strong>Posture:</strong> Stand, kneel, and sit when others do. Communion is received kneeling at the altar rail, on the tongue \u2014 the priest will place the host on your tongue. If you\u2019re not receiving Communion, simply remain in your pew \u2014 there\u2019s no expectation to approach the altar rail.</p>'
+'<p><strong>Length:</strong> A Low Mass (spoken, no singing) runs about 45 minutes to an hour. A High Mass or Solemn High Mass (sung, with incense and more ceremony) can run 75\u201390 minutes.</p>'
+'<p><strong>If you get lost:</strong> Close the missal. Look up. Listen. The Mass is still the Mass \u2014 the same sacrifice of Calvary, the same Real Presence, the same Lord. You belong here.</p>'
+'</details>'
    },
```

**Key notes:**
- `filter: 'latin'` ties to the existing Latin filter chip (maps to `['mass_latin','mass_traditional_latin']` in render.js)
- `findLabel: 'Latin Mass'` renders the "Find Latin Mass near me →" link in the guide card
- "Extraordinary Form" and "ad orientem" are already in `TERM_DEFS` — they'll auto-link via `_wrapTerms()`
- The `<details class="devot-expand">` follows the same pattern as Lent/Easter/Advent/Christmas guides

### 2b: Register Latin Mass reader module

**File: `src/devotions.js`**

After the adoration-guide `reader.registerModule` block you just added in Step 1, add:

```javascript
// CLH-05 / CON-31: Latin Mass Guide reader module — accessible from any tab
reader.registerModule('latin-mass-guide', {
  getTitle: function() { return 'What to Expect at a Latin Mass'; },
  render: function(params, bodyEl, footerEl) {
    footerEl.style.display = 'none';
    // Find Latin Mass guide in Devotions group
    var guide = null;
    for (var i = 0; i < DEVOTIONAL_GUIDES.length; i++) {
      var g = DEVOTIONAL_GUIDES[i];
      if (g.isGroup && g.children) {
        for (var j = 0; j < g.children.length; j++) {
          if (g.children[j].title === 'What to Expect at a Latin Mass') {
            guide = g.children[j];
            break;
          }
        }
      }
      if (guide) break;
    }
    if (!guide) { bodyEl.innerHTML = '<p>Guide not found.</p>'; return; }

    bodyEl.innerHTML = '<div style="max-width:540px;margin:0 auto;font-size:var(--text-sm);color:var(--color-text-secondary);line-height:1.75">'
      + _wrapScriptureRefs(_wrapTerms(guide.body))
      + '<div style="margin-top:var(--space-5)">'
      + '<button onclick="readerClose();closeAllPanels();switchTab(\'panelFind\',document.querySelector(\'[data-tab=panelFind]\'));var c=document.querySelector(\'[data-filter=latin]\');if(c)c.click()" '
      + 'style="display:block;width:100%;padding:var(--space-3);background:var(--color-primary);color:white;border:none;border-radius:var(--radius-md);font-size:var(--text-sm);font-weight:var(--weight-semibold);cursor:pointer;min-height:44px">'
      + 'Find Latin Mass near you</button>'
      + '</div></div>';

    _initTermClicks(bodyEl);
    refs.initRefTaps(bodyEl);
  },
  onClose: function() {}
});
```

### 2c: Add global function

**File: `src/app.js`**

After the `window.openAdorationGuide` line you added in Step 1, add:
```javascript
window.openLatinMassGuide = function() { reader.readerOpen('latin-mass-guide'); };
```

**Verify:** `npm run build` succeeds. Test `openLatinMassGuide()` in browser console — reader should open with the full Latin Mass guide, term tooltips working on "Extraordinary Form" and "ad orientem".

---

## Step 3: CLH-01 + CLH-04 — Generalize hint system (with Latin hint live)

### 3a: Replace HTML divs

**File: `index.html`**

Replace the two hint divs (lines ~81–82):
```html
<div id="confessionHint" class="confession-hint" style="display:none"></div>
<div id="spanishHint" class="confession-hint" style="display:none"></div>
```
With one:
```html
<div id="filterHint" class="filter-hint" style="display:none"></div>
```

### 3b: Replace render.js hint logic

**File: `src/render.js`**

Find the confession hint block (starts with comment `// PHF-01b:`) and the Spanish hint block (starts with `// I18N:`). Replace both blocks with a single data-driven block.

**IMPORTANT:** The `latin` entry is now LIVE (not a comment placeholder). CON-30 content and CON-31 hint copy are both approved.

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
    latin: {
      text: 'New to Latin Mass?',
      link: 'What to expect \u203A',
      action: 'openLatinMassGuide()',
      storageKey: 'mf-latin-hint-dismissed'
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

### 3c: Replace CSS

**File: `css/app.css`**

Find the `.confession-hint*` rules (around line 2184). Replace ALL 5 rules with:

```css
/* CLH-01: Contextual filter hints (generalized from PHF-01b) */
.filter-hint { padding:0 var(--space-4);max-width:var(--max-width);margin:0 auto; }
.filter-hint-inner { display:flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-3);background:color-mix(in srgb, var(--color-info) 4%, transparent);border-radius:var(--radius-sm);font-size:var(--text-xs);color:var(--color-text-secondary);margin-bottom:var(--space-2); }
.filter-hint-link { color:var(--color-info);font-weight:var(--weight-semibold);cursor:pointer;white-space:nowrap; }
.filter-hint-dismiss { margin-left:auto;background:none;border:none;color:var(--color-text-tertiary);cursor:pointer;padding:var(--space-2);min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent; }
html[data-theme="dark"] .filter-hint-inner { background:color-mix(in srgb, var(--color-info) 5%, transparent); }
```

Key changes from old CSS: class names `.confession-hint*` → `.filter-hint*`, dismiss button 28px → 44px (CLH-04), padding `--space-1` → `--space-2`, removed `font-size:var(--text-xs)` from dismiss (SVG handles sizing now).

**IMPORTANT:** Do NOT touch the `.conf-guide-nudge*` styles (~line 2098). Those are for the detail panel confession nudge (PHF-01a), unrelated.

### 3d: Search for orphaned references

After changes, search entire codebase:
```bash
grep -rn "confessionHint\|spanishHint\|confession-hint-inner\|confession-hint-link\|confession-hint-dismiss" src/ index.html css/
```

The ONLY remaining matches should be in the `.conf-guide-nudge` area (which uses different class names). If anything else references the old IDs/classes, update it.

---

## Step 4: Build and verify

```bash
npm run build
```

Must succeed with no errors.

---

## Step 5: Manual test matrix

| Test | Expected |
|------|----------|
| Tap Confession chip | "Not sure what to expect? How Confession works ›" appears |
| Tap confession hint link | Confession guide opens in reader |
| Tap × dismiss | Hint hides, stays hidden during session |
| Switch to All chip | Hint area hides |
| Return to Confession after dismiss | Stays hidden |
| Tap Adoration chip | "New to Adoration? What to expect ›" appears |
| Tap adoration hint link | Adoration guide opens in reader with term tooltips |
| "Find Adoration near you" button | Closes reader, switches to Find tab, activates Adoration chip |
| Tap × dismiss | Hint hides for session |
| Tap Latin chip | "New to Latin Mass? What to expect ›" appears |
| Tap latin hint link | Latin Mass guide opens in reader |
| Latin guide content | 3 paragraphs + expandable "Practical tips" section |
| Term tooltips in Latin guide | "Extraordinary Form" and "ad orientem" trigger popovers |
| "Find Latin Mass near you" button | Closes reader, switches to Find tab, activates Latin chip |
| Tap × dismiss | Hint hides for session |
| Tap Spanish chip (non-Spanish lang) | "Prayers available in Spanish / Set prayer language ›" |
| Tap Spanish chip (Spanish lang set) | No hint appears |
| Tap Today/Weekend/All chips | No hint appears |
| Dark mode all hints | Subtle tinted background, readable text |
| Dismiss button size | ≥ 44×44 actual touch area (inspect to confirm) |
| Latin guide in Faith Guides | Guide also visible under More → Faith Guides → Devotions |
| Latin guide "Find Latin Mass near me →" link | Works from Faith Guides card view too |

---

## Step 6: Commit

```bash
git add -A
git commit -m "feat: contextual filter hints — generalized system + adoration/latin guides (CLH-01–05)

- CLH-01: Replace hardcoded confessionHint/spanishHint with data-driven filterHint system
- CLH-02: Register Adoration guide as reader module (openable from any surface)
- CLH-03: Add adoration filter hint: 'New to Adoration? What to expect ›'
- CLH-04: Fix dismiss button touch target: 28px → 44px (Apple HIG compliance)
- CLH-05: Add Latin Mass guide content (CON-30, CRX-01–04 applied) + reader module + filter hint
- CON-30: 'What to Expect at a Latin Mass' devotional guide (Catholic Review approved)
- CON-31: Latin filter hint copy 'New to Latin Mass? What to expect ›' (Catholic Review approved)
- Session-scoped dismissal preserved for all hints

BACKLOG.md and COMPLETED_SPECS.md updated."
```

---

## Step 7: Post-implementation docs

### BACKLOG.md
Mark IDEA-120, IDEA-121, IDEA-122 as done with spec ref CLH-01–05.

### COMPLETED_SPECS.md
Mark as Done:
- CLH-01 through CLH-05
- CON-30
- CON-31a, CON-31b, CON-31c

Update the CLH section status from "Queued" to "Implemented".
